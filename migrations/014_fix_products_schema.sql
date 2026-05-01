-- Add missing columns that the app uses
alter table public.products
  add column if not exists material text,
  add column if not exists material_group text,
  add column if not exists base_unit_of_measure text;

-- Make name and code nullable (app never provides them)
alter table public.products
  alter column name drop not null,
  alter column code drop not null;

-- Backfill material from code for any existing rows
update public.products
  set material = coalesce(code, name, id::text)
  where material is null;

-- Add unique constraint on (material, company_id) for upsert conflict resolution
alter table public.products
  drop constraint if exists products_company_id_code_key;

create unique index if not exists products_material_company_id_key
  on public.products (material, company_id)
  where material is not null;

-- Index for lookups
create index if not exists idx_products_material on public.products(material);
create index if not exists idx_products_material_group on public.products(material_group);
