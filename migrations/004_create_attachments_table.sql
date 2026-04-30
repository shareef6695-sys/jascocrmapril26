-- Create attachments and documents table

create table if not exists public.attachments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size integer,
  file_type text,
  entity_type text check (entity_type in ('contact', 'deal', 'task', 'document')),
  entity_id uuid,
  uploaded_by uuid references public.users(id) on delete set null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes
create index if not exists idx_attachments_company_id on public.attachments(company_id);
create index if not exists idx_attachments_entity on public.attachments(entity_type, entity_id);
create index if not exists idx_attachments_uploaded_by on public.attachments(uploaded_by);

-- Apply updated_at trigger
create trigger update_attachments_updated_at before update on public.attachments
  for each row execute function public.update_updated_at_column();
