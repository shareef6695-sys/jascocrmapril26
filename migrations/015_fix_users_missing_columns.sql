-- Add missing columns that the app queries but were never created
alter table public.users
  add column if not exists supervisor_id uuid references public.users(id) on delete set null,
  add column if not exists territory text,
  add column if not exists hire_date date,
  add column if not exists avatar_url text;

-- Fix role check constraint to include 'agent' (used as default in admin-auth function)
alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
  check (role in ('admin', 'director', 'head', 'manager', 'supervisor', 'staff', 'agent'));

-- Index for supervisor hierarchy lookups
create index if not exists idx_users_supervisor_id on public.users(supervisor_id);

-- Fix RLS: allow authenticated users to read all active users in their company
-- (current policy only allows reading own row, which breaks all user listing queries)
drop policy if exists users_select_self on public.users;

create policy users_select_own
  on public.users for select to authenticated
  using (id = auth.uid());

create policy users_select_same_company
  on public.users for select to authenticated
  using (
    company_id = (select company_id from public.users where id = auth.uid())
  );
