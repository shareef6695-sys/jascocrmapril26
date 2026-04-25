do $$
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'companies'
  ) then
    raise exception 'companies table does not exist';
  end if;
end $$;

alter table public.companies enable row level security;

drop policy if exists companies_select_accessible on public.companies;
create policy companies_select_accessible
on public.companies
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'director', 'head')
      and u.is_active = true
  )
  or id = (
    select u.company_id
    from public.users u
    where u.id = auth.uid()
      and u.is_active = true
    limit 1
  )
);

drop policy if exists companies_insert_admin on public.companies;
create policy companies_insert_admin
on public.companies
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'director')
      and u.is_active = true
  )
);

drop policy if exists companies_update_admin on public.companies;
create policy companies_update_admin
on public.companies
for update
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'director')
      and u.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'director')
      and u.is_active = true
  )
);
