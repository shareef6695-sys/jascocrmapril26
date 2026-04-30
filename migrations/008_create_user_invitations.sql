-- User Invitations Table

create table if not exists public.user_invitations (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role text not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  invitation_token text unique,
  invited_by uuid references public.users(id) on delete set null,
  accepted_by uuid references public.users(id) on delete set null,
  accepted_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(company_id, email)
);

-- Function to create invitation
create or replace function public.invite_user(
  p_company_id uuid,
  p_email text,
  p_role text
)
returns table (
  id uuid,
  email text,
  invitation_token text,
  expires_at timestamp with time zone
) as $$
declare
  v_token text;
begin
  v_token := encode(gen_random_bytes(32), 'hex');
  
  insert into public.user_invitations (
    company_id,
    email,
    role,
    invited_by,
    invitation_token,
    expires_at
  ) values (
    p_company_id,
    p_email,
    p_role,
    auth.uid(),
    v_token,
    now() + interval '7 days'
  )
  on conflict(company_id, email) do update set
    invitation_token = v_token,
    expires_at = now() + interval '7 days',
    status = 'pending',
    updated_at = now()
  returning user_invitations.id, user_invitations.email, user_invitations.invitation_token, user_invitations.expires_at;
end;
$$ language plpgsql;

-- Get pending invitations
create or replace function public.get_pending_invitations(p_company_id uuid)
returns table (
  id uuid,
  email text,
  role text,
  status text,
  invited_by text,
  created_at timestamp with time zone,
  expires_at timestamp with time zone
) as $$
begin
  return query
  select 
    ui.id,
    ui.email,
    ui.role,
    ui.status,
    concat(u.first_name, ' ', u.last_name),
    ui.created_at,
    ui.expires_at
  from public.user_invitations ui
  left join public.users u on ui.invited_by = u.id
  where ui.company_id = p_company_id
    and ui.status = 'pending'
    and ui.expires_at > now()
  order by ui.created_at desc;
end;
$$ language plpgsql;

create index if not exists idx_user_invitations_company on public.user_invitations(company_id);
create index if not exists idx_user_invitations_email on public.user_invitations(email);
create index if not exists idx_user_invitations_token on public.user_invitations(invitation_token);
create index if not exists idx_user_invitations_status on public.user_invitations(status);

create trigger update_user_invitations_updated_at before update on public.user_invitations
  for each row execute function public.update_updated_at_column();
