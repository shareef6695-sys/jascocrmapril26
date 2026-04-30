-- Create the sales_targets table (hierarchical target assignment)
-- sales_targets is the parent table; client_targets and product_group_targets are breakdowns of it.

create table if not exists public.sales_targets (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  assigned_to uuid references public.users(id) on delete set null,
  target_amount decimal(15, 2) not null default 0,
  progress_amount decimal(15, 2) not null default 0,
  currency text not null default 'USD',
  period_type text not null default 'monthly'
    check (period_type in ('monthly', 'quarterly', 'yearly', 'custom')),
  period_start date not null,
  period_end date not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'overdue', 'cancelled')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add sales_target_id FK to client_targets (breakdown by contact)
alter table public.client_targets
  add column if not exists sales_target_id uuid references public.sales_targets(id) on delete set null;

-- Add sales_target_id FK to product_group_targets (breakdown by product group)
alter table public.product_group_targets
  add column if not exists sales_target_id uuid references public.sales_targets(id) on delete set null;

-- Indexes
create index if not exists idx_sales_targets_company_id on public.sales_targets(company_id);
create index if not exists idx_sales_targets_assigned_to on public.sales_targets(assigned_to);
create index if not exists idx_sales_targets_assigned_by on public.sales_targets(assigned_by);
create index if not exists idx_sales_targets_period on public.sales_targets(period_start, period_end);
create index if not exists idx_sales_targets_status on public.sales_targets(status);
create index if not exists idx_client_targets_sales_target_id on public.client_targets(sales_target_id);
create index if not exists idx_product_group_targets_sales_target_id on public.product_group_targets(sales_target_id);

-- updated_at trigger
create trigger update_sales_targets_updated_at before update on public.sales_targets
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- RLS Policies
-- ============================================================

alter table public.sales_targets enable row level security;

-- Users can view targets they assigned or were assigned to them (within same company)
create policy "sales_targets_select" on public.sales_targets
  for select using (
    company_id in (
      select company_id from public.users where id = auth.uid()
    )
  );

-- Only the assigner (or a company admin/director/manager) can insert
create policy "sales_targets_insert" on public.sales_targets
  for insert with check (
    assigned_by = auth.uid()
    and company_id in (
      select company_id from public.users where id = auth.uid()
    )
  );

-- Assigner can update their own targets
create policy "sales_targets_update" on public.sales_targets
  for update using (
    assigned_by = auth.uid()
    or exists (
      select 1 from public.users
      where id = auth.uid()
        and company_id = sales_targets.company_id
        and role in ('director', 'admin')
    )
  );

-- Assigner or admin/director can delete
create policy "sales_targets_delete" on public.sales_targets
  for delete using (
    assigned_by = auth.uid()
    or exists (
      select 1 from public.users
      where id = auth.uid()
        and company_id = sales_targets.company_id
        and role in ('director', 'admin')
    )
  );

-- ============================================================
-- Helper RPC functions
-- ============================================================

-- Total target amount allocated TO a user for a period
create or replace function public.get_user_allocated_target(
  user_id uuid,
  company_id uuid,
  period_start_date date,
  period_end_date date
)
returns numeric
language sql
stable
security definer
as $$
  select coalesce(sum(target_amount), 0)
  from public.sales_targets
  where assigned_to = user_id
    and sales_targets.company_id = get_user_allocated_target.company_id
    and status = 'active'
    and period_start <= period_end_date
    and period_end >= period_start_date;
$$;

-- Total target amount a user has assigned to others for a period
create or replace function public.get_user_assigned_target(
  user_id uuid,
  company_id uuid,
  period_start_date date,
  period_end_date date
)
returns numeric
language sql
stable
security definer
as $$
  select coalesce(sum(target_amount), 0)
  from public.sales_targets
  where assigned_by = user_id
    and sales_targets.company_id = get_user_assigned_target.company_id
    and status = 'active'
    and period_start <= period_end_date
    and period_end >= period_start_date;
$$;

-- Check if assigner can assign a target to assignee (must be in same company, assigner is superior)
create or replace function public.can_assign_target_to_user(
  assigner_id uuid,
  assignee_id uuid
)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.users a
    join public.users b on b.id = assignee_id
    where a.id = assigner_id
      and a.company_id = b.company_id
      and (
        -- directors can assign to anyone
        a.role = 'director'
        -- managers can assign to supervisors and salesmen
        or (a.role = 'manager' and b.role in ('supervisor', 'salesman'))
        -- supervisors can assign to salesmen
        or (a.role = 'supervisor' and b.role = 'salesman')
      )
  );
$$;
