import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing Supabase server environment variables" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await supabase.auth.getUser();

  if (callerError || !caller) return json({ error: "Not authenticated" }, 401);

  const { data: callerProfile } = await supabase
    .from("users")
    .select("id, role, company_id")
    .eq("id", caller.id)
    .single();

  const callerRole = callerProfile?.role;
  const callerCompanyId = callerProfile?.company_id ?? null;

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = payload?.action;
  if (!action) return json({ error: "Missing action" }, 400);

  if (action === "create_user") {
    if (!callerRole || !new Set(["admin", "director", "head", "manager"]).has(callerRole)) {
      return json({ error: "Forbidden" }, 403);
    }

    const email = payload?.email;
    const password = payload?.password;
    const full_name = payload?.full_name ?? null;
    const role = payload?.role ?? "agent";
    let company_id = payload?.company_id ?? null;
    const supervisor_id = payload?.supervisor_id ?? null;

    if (!email || !password) return json({ error: "Missing email or password" }, 400);

    if (callerRole === "manager") {
      const disallowed = new Set(["admin", "director", "head"]);
      if (disallowed.has(role)) return json({ error: "Forbidden role" }, 403);
      company_id = callerCompanyId;
    }

    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role },
      });

    if (createError || !created?.user) {
      return json({ error: createError?.message ?? "Failed to create user" }, 400);
    }

    const userId = created.user.id;

    const { error: upsertError } = await supabase.from("users").upsert(
      {
        id: userId,
        email,
        full_name,
        role,
        company_id,
        supervisor_id,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (upsertError) {
      return json({ error: upsertError.message }, 400);
    }

    return json({ user_id: userId });
  }

  if (action === "generate_invite_link") {
    if (!callerRole || !new Set(["admin", "director", "head", "manager"]).has(callerRole)) {
      return json({ error: "Forbidden" }, 403);
    }

    const email = payload?.email;
    const full_name = payload?.full_name ?? null;
    const role = payload?.role ?? "agent";
    let company_id = payload?.company_id ?? null;
    const supervisor_id = payload?.supervisor_id ?? null;
    const redirectTo = payload?.redirect_to ?? undefined;

    if (!email) return json({ error: "Missing email" }, 400);

    if (callerRole === "manager") {
      const disallowed = new Set(["admin", "director", "head"]);
      if (disallowed.has(role)) return json({ error: "Forbidden role" }, 403);
      company_id = callerCompanyId;
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo,
        data: { full_name, role },
      },
    });

    if (error) return json({ error: error.message }, 400);

    const userId = data?.user?.id ?? null;
    if (userId) {
      await supabase.from("users").upsert(
        {
          id: userId,
          email,
          full_name,
          role,
          company_id,
          supervisor_id,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    }

    return json({ invitation_url: data?.properties?.action_link, email_sent: false });
  }

  if (action === "generate_password_reset_link") {
    if (!callerRole || !new Set(["admin", "director", "head"]).has(callerRole)) {
      return json({ error: "Forbidden" }, 403);
    }

    const email = payload?.email;
    const redirectTo = payload?.redirect_to ?? undefined;
    if (!email) return json({ error: "Missing email" }, 400);

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error) return json({ error: error.message }, 400);
    return json({ action_link: data?.properties?.action_link });
  }

  return json({ error: "Unknown action" }, 400);
});
