do $$
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'uom_types'
  ) then
    raise exception 'uom_types table does not exist';
  end if;
end $$;

alter table public.uom_types enable row level security;

drop policy if exists uom_types_select_authenticated on public.uom_types;
create policy uom_types_select_authenticated
on public.uom_types
for select
to authenticated
using (true);

drop policy if exists uom_types_insert_admin on public.uom_types;
create policy uom_types_insert_admin
on public.uom_types
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'director', 'head')
      and u.is_active = true
  )
);

drop policy if exists uom_types_update_admin on public.uom_types;
create policy uom_types_update_admin
on public.uom_types
for update
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'director', 'head')
      and u.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'director', 'head')
      and u.is_active = true
  )
);

drop policy if exists uom_types_delete_admin on public.uom_types;
create policy uom_types_delete_admin
on public.uom_types
for delete
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'director', 'head')
      and u.is_active = true
  )
);
