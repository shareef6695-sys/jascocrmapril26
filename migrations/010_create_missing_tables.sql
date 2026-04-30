-- Create all tables that are referenced in application code but missing from the database.
-- Run this after 009_create_sales_targets.sql.

-- ============================================================
-- 1. DEAL PRODUCTS (line items linking deals to products)
-- ============================================================
create table if not exists public.deal_products (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity decimal(15, 4) not null default 1,
  sqm decimal(15, 4),
  ton decimal(15, 4),
  unit_price decimal(15, 2),
  line_total decimal(15, 2),
  notes text,
  uom_type text,
  uom_value decimal(15, 4),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_deal_products_deal_id on public.deal_products(deal_id);
create index if not exists idx_deal_products_product_id on public.deal_products(product_id);

create trigger update_deal_products_updated_at before update on public.deal_products
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- 2. NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  metadata jsonb default '{}',
  is_read boolean not null default false,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_company_id on public.notifications(company_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_insert" on public.notifications
  for insert with check (
    company_id in (
      select company_id from public.users where id = auth.uid()
    )
  );

create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());

create policy "notifications_delete_own" on public.notifications
  for delete using (user_id = auth.uid());

-- ============================================================
-- 3. TAGS
-- ============================================================
create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  color text default '#6366f1',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(company_id, name)
);

create index if not exists idx_tags_company_id on public.tags(company_id);

-- ============================================================
-- 4. CONTACT TAGS (junction: contacts ↔ tags)
-- ============================================================
create table if not exists public.contact_tags (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(contact_id, tag_id)
);

create index if not exists idx_contact_tags_contact_id on public.contact_tags(contact_id);
create index if not exists idx_contact_tags_tag_id on public.contact_tags(tag_id);

-- ============================================================
-- 5. EXCHANGE RATES
-- ============================================================
create table if not exists public.exchange_rates (
  id uuid primary key default uuid_generate_v4(),
  currency_code text not null unique,
  rate_to_usd decimal(18, 8) not null default 1,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Seed common currencies used in the app
insert into public.exchange_rates (currency_code, rate_to_usd) values
  ('USD', 1.0),
  ('SAR', 0.2667),
  ('EUR', 1.08),
  ('GBP', 1.27),
  ('AED', 0.2723)
on conflict (currency_code) do nothing;

-- ============================================================
-- 6. TEAM PERFORMANCE (aggregated snapshot per user per period)
-- ============================================================
create table if not exists public.team_performance (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  performance_score decimal(8, 2) default 0,
  total_deals integer default 0,
  won_deals integer default 0,
  total_amount decimal(15, 2) default 0,
  won_amount decimal(15, 2) default 0,
  period_start date,
  period_end date,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_team_performance_company_id on public.team_performance(company_id);
create index if not exists idx_team_performance_user_id on public.team_performance(user_id);

create trigger update_team_performance_updated_at before update on public.team_performance
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- 7. USER SETTINGS
-- ============================================================
create table if not exists public.user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  preferred_currency text not null default 'SAR',
  date_format text not null default 'MM/DD/YYYY',
  timezone text not null default 'UTC',
  language text not null default 'en',
  notifications_enabled boolean not null default true,
  email_notifications boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_user_settings_user_id on public.user_settings(user_id);

create trigger update_user_settings_updated_at before update on public.user_settings
  for each row execute function public.update_updated_at_column();

alter table public.user_settings enable row level security;

create policy "user_settings_select_own" on public.user_settings
  for select using (user_id = auth.uid());

create policy "user_settings_insert_own" on public.user_settings
  for insert with check (user_id = auth.uid());

create policy "user_settings_update_own" on public.user_settings
  for update using (user_id = auth.uid());
