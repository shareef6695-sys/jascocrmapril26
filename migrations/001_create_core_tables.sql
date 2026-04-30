-- Create core users and authentication tables
-- Enable UUID extension for ID generation
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Companies table
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  industry text,
  country text,
  state text,
  city text,
  address text,
  postal_code text,
  phone text,
  email text,
  website text,
  logo_url text,
  currency_code text default 'USD',
  fiscal_year_start int default 1,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid
);

-- Users table with role-based access
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  first_name text,
  last_name text,
  phone text,
  company_id uuid references public.companies(id) on delete set null,
  role text not null check (role in ('admin', 'director', 'head', 'manager', 'supervisor', 'staff')),
  department text,
  job_title text,
  manager_id uuid references public.users(id) on delete set null,
  is_active boolean default true,
  last_login_at timestamp with time zone,
  profile_picture_url text,
  preferences jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid
);

-- Contacts/Prospects table
create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  mobile text,
  job_title text,
  company_name text,
  company_website text,
  status text default 'new' check (status in ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'lost', 'inactive')),
  source text check (source in ('website', 'referral', 'event', 'cold_call', 'linkedin', 'email', 'other')),
  owner_id uuid references public.users(id) on delete set null,
  tags text[] default '{}',
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  birthday date,
  notes text,
  last_contacted_at timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid
);

-- Deals/Opportunities table
create table if not exists public.deals (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null,
  description text,
  amount decimal(15, 2),
  currency_code text default 'USD',
  stage text not null default 'lead' check (stage in ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold')),
  probability integer default 0 check (probability >= 0 and probability <= 100),
  expected_close_date date,
  closed_date date,
  owner_id uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid,
  is_active boolean default true
);

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  type text check (type in ('call', 'email', 'meeting', 'follow_up', 'other')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  due_date date,
  due_date_time timestamp with time zone,
  assigned_to uuid references public.users(id) on delete set null,
  assigned_by uuid references public.users(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  owner_id uuid references public.users(id) on delete set null,
  completed_at timestamp with time zone,
  completed_by uuid references public.users(id) on delete set null,
  is_overdue boolean default false,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid,
  is_active boolean default true
);

-- Activities/Timeline table
create table if not exists public.activities (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null check (type in ('call', 'email', 'meeting', 'note', 'task_created', 'deal_updated', 'contact_updated')),
  title text,
  description text,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  activity_date timestamp with time zone not null,
  duration_minutes integer,
  outcome text,
  next_steps text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes for better query performance
create index if not exists idx_users_company_id on public.users(company_id);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_contacts_company_id on public.contacts(company_id);
create index if not exists idx_contacts_owner_id on public.contacts(owner_id);
create index if not exists idx_contacts_status on public.contacts(status);
create index if not exists idx_deals_company_id on public.deals(company_id);
create index if not exists idx_deals_owner_id on public.deals(owner_id);
create index if not exists idx_deals_stage on public.deals(stage);
create index if not exists idx_deals_contact_id on public.deals(contact_id);
create index if not exists idx_tasks_company_id on public.tasks(company_id);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_activities_company_id on public.activities(company_id);
create index if not exists idx_activities_created_by on public.activities(created_by);
create index if not exists idx_activities_activity_date on public.activities(activity_date);

-- Create updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger update_companies_updated_at before update on public.companies
  for each row execute function public.update_updated_at_column();

create trigger update_users_updated_at before update on public.users
  for each row execute function public.update_updated_at_column();

create trigger update_contacts_updated_at before update on public.contacts
  for each row execute function public.update_updated_at_column();

create trigger update_deals_updated_at before update on public.deals
  for each row execute function public.update_updated_at_column();

create trigger update_tasks_updated_at before update on public.tasks
  for each row execute function public.update_updated_at_column();

create trigger update_activities_updated_at before update on public.activities
  for each row execute function public.update_updated_at_column();
