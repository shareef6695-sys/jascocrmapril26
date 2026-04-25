import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

const missingEnvMessage =
  "Missing Supabase environment variables. Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY";

const createDisabledQuery = () => {
  const query = {
    select: () => query,
    eq: () => query,
    neq: () => query,
    gt: () => query,
    gte: () => query,
    lt: () => query,
    lte: () => query,
    like: () => query,
    ilike: () => query,
    in: () => query,
    is: () => query,
    contains: () => query,
    containedBy: () => query,
    overlap: () => query,
    match: () => query,
    order: () => query,
    range: () => query,
    limit: () => query,
    single: async () => ({
      data: null,
      error: { message: missingEnvMessage, code: "ENV_MISSING" },
    }),
    maybeSingle: async () => ({
      data: null,
      error: { message: missingEnvMessage, code: "ENV_MISSING" },
    }),
    then: (onFulfilled, onRejected) =>
      Promise.resolve({
        data: null,
        error: { message: missingEnvMessage, code: "ENV_MISSING" },
      }).then(onFulfilled, onRejected),
    insert: () => query,
    update: () => query,
    upsert: () => query,
    delete: () => query,
  };

  return query;
};

const createDisabledSupabase = () => {
  const disabledError = { message: missingEnvMessage, code: "ENV_MISSING" };

  return {
    from: () => createDisabledQuery(),
    rpc: async () => ({ data: null, error: disabledError }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: disabledError }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: async () => ({ data: null, error: disabledError }),
      signOut: async () => ({ error: disabledError }),
      signUp: async () => ({ data: null, error: disabledError }),
      resetPasswordForEmail: async () => ({ data: null, error: disabledError }),
      updateUser: async () => ({ data: null, error: disabledError }),
      exchangeCodeForSession: async () => ({ data: null, error: disabledError }),
    },
  };
};

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          storage: localStorage,
        },
      })
    : createDisabledSupabase();
