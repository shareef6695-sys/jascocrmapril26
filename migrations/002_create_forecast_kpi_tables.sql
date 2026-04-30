-- Create sales forecasting and KPIs tables

-- Forecast table
create table if not exists public.forecasts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  forecast_month date not null, -- First day of the month
  forecast_amount decimal(15, 2),
  actual_amount decimal(15, 2),
  currency_code text default 'USD',
  status text default 'draft' check (status in ('draft', 'submitted', 'approved', 'locked')),
  notes text,
  approved_by uuid references public.users(id) on delete set null,
  approved_at timestamp with time zone,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid,
  unique(company_id, user_id, forecast_month)
);

-- KPIs table
create table if not exists public.kpis (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  kpi_month date not null, -- First day of the month
  metric_name text not null,
  target_value decimal(15, 2),
  actual_value decimal(15, 2),
  unit text default 'currency',
  status text default 'in_progress' check (status in ('pending', 'in_progress', 'completed', 'missed')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid
);

-- Create indexes
create index if not exists idx_forecasts_company_id on public.forecasts(company_id);
create index if not exists idx_forecasts_user_id on public.forecasts(user_id);
create index if not exists idx_forecasts_month on public.forecasts(forecast_month);
create index if not exists idx_kpis_company_id on public.kpis(company_id);
create index if not exists idx_kpis_user_id on public.kpis(user_id);
create index if not exists idx_kpis_month on public.kpis(kpi_month);

-- Apply updated_at triggers
create trigger update_forecasts_updated_at before update on public.forecasts
  for each row execute function public.update_updated_at_column();

create trigger update_kpis_updated_at before update on public.kpis
  for each row execute function public.update_updated_at_column();
