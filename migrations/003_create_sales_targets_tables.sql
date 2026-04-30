-- Create sales targets and product tables

-- Product Groups table
create table if not exists public.product_groups (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid,
  unique(company_id, code)
);

-- UOM Types (Units of Measurement)
create table if not exists public.uom_types (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete set null,
  value text not null unique,
  label text,
  sort_order int default 1,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Products table
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  product_group_id uuid references public.product_groups(id) on delete set null,
  unit_of_measure_id uuid references public.uom_types(id) on delete set null,
  price decimal(15, 2),
  currency_code text default 'USD',
  sku text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid,
  unique(company_id, code)
);

-- Client Sales Targets table
create table if not exists public.client_targets (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  target_month date not null, -- First day of the month
  assigned_by uuid references public.users(id) on delete set null,
  assigned_to uuid references public.users(id) on delete set null,
  target_amount decimal(15, 2),
  achieved_amount decimal(15, 2),
  currency_code text default 'USD',
  notes text,
  status text default 'active' check (status in ('active', 'inactive', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid,
  unique(company_id, contact_id, target_month)
);

-- Product Group Sales Targets table
create table if not exists public.product_group_targets (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_group_id uuid references public.product_groups(id) on delete set null,
  target_month date not null, -- First day of the month
  assigned_by uuid references public.users(id) on delete set null,
  assigned_to uuid references public.users(id) on delete set null,
  target_amount decimal(15, 2),
  achieved_amount decimal(15, 2),
  target_quantity decimal(15, 2),
  achieved_quantity decimal(15, 2),
  currency_code text default 'USD',
  notes text,
  status text default 'active' check (status in ('active', 'inactive', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid,
  unique(company_id, product_group_id, target_month)
);

-- Create indexes
create index if not exists idx_product_groups_company_id on public.product_groups(company_id);
create index if not exists idx_products_company_id on public.products(company_id);
create index if not exists idx_products_group_id on public.products(product_group_id);
create index if not exists idx_client_targets_company_id on public.client_targets(company_id);
create index if not exists idx_client_targets_contact_id on public.client_targets(contact_id);
create index if not exists idx_client_targets_assigned_to on public.client_targets(assigned_to);
create index if not exists idx_client_targets_month on public.client_targets(target_month);
create index if not exists idx_product_group_targets_company_id on public.product_group_targets(company_id);
create index if not exists idx_product_group_targets_group_id on public.product_group_targets(product_group_id);
create index if not exists idx_product_group_targets_assigned_to on public.product_group_targets(assigned_to);
create index if not exists idx_product_group_targets_month on public.product_group_targets(target_month);

-- Apply updated_at triggers
create trigger update_product_groups_updated_at before update on public.product_groups
  for each row execute function public.update_updated_at_column();

create trigger update_uom_types_updated_at before update on public.uom_types
  for each row execute function public.update_updated_at_column();

create trigger update_products_updated_at before update on public.products
  for each row execute function public.update_updated_at_column();

create trigger update_client_targets_updated_at before update on public.client_targets
  for each row execute function public.update_updated_at_column();

create trigger update_product_group_targets_updated_at before update on public.product_group_targets
  for each row execute function public.update_updated_at_column();
