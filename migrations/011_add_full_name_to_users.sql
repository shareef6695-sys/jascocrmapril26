-- Add full_name as a generated column to users table
alter table public.users
  add column if not exists full_name text generated always as (
    case
      when first_name is not null and last_name is not null then first_name || ' ' || last_name
      when first_name is not null then first_name
      when last_name is not null then last_name
      else null
    end
  ) stored;

-- Create index on full_name for better query performance
create index if not exists idx_users_full_name on public.users(full_name);
