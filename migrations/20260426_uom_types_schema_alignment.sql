-- Align uom_types with frontend expectations (value, label, sort_order, is_active).
-- Safe, additive migration: does not drop/rename existing columns.

alter table public.uom_types
add column if not exists value text;

alter table public.uom_types
add column if not exists label text;

alter table public.uom_types
add column if not exists sort_order int;

alter table public.uom_types
add column if not exists is_active boolean default true;

do $$
declare
  src_value text;
  src_label text;
begin
  select c.column_name into src_value
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'uom_types'
    and c.column_name in ('code','name','uom_code','display_name')
  order by array_position(array['code','uom_code','name','display_name'], c.column_name)
  limit 1;

  if src_value is not null then
    execute format(
      'update public.uom_types set value = coalesce(value, %I::text) where value is null',
      src_value
    );
  end if;

  select c.column_name into src_label
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'uom_types'
    and c.column_name in ('label','display_name','name','code','uom_code')
  order by array_position(array['label','display_name','name','code','uom_code'], c.column_name)
  limit 1;

  if src_label is not null then
    execute format(
      'update public.uom_types set label = coalesce(label, %I::text) where label is null',
      src_label
    );
  end if;

  update public.uom_types
  set label = coalesce(label, initcap(replace(value, '_', ' ')))
  where label is null and value is not null;

  update public.uom_types
  set sort_order = coalesce(sort_order, 1)
  where sort_order is null;

  update public.uom_types
  set is_active = coalesce(is_active, true)
  where is_active is null;
end $$;

create unique index if not exists uom_types_value_key on public.uom_types (value);
