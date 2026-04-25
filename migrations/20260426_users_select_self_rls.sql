do $$
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'users'
  ) then
    raise exception 'users table does not exist';
  end if;
end $$;

alter table public.users enable row level security;

drop policy if exists users_select_self on public.users;
create policy users_select_self
on public.users
for select
to authenticated
using (id = auth.uid());
