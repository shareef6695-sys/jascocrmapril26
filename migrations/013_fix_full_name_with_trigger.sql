-- Drop the problematic generated column if it exists
alter table public.users drop column if not exists full_name;

-- Add full_name as a regular column
alter table public.users
  add column if not exists full_name text;

-- Create a function to update full_name
create or replace function public.update_user_full_name()
returns trigger as $$
begin
  new.full_name := case
    when new.first_name is not null and new.last_name is not null then new.first_name || ' ' || new.last_name
    when new.first_name is not null then new.first_name
    when new.last_name is not null then new.last_name
    else null
  end;
  return new;
end;
$$ language plpgsql;

-- Drop trigger if it exists
drop trigger if exists update_user_full_name_trigger on public.users;

-- Create trigger to update full_name before insert/update
create trigger update_user_full_name_trigger
  before insert or update on public.users
  for each row
  execute function public.update_user_full_name();

-- Update existing rows
update public.users set full_name = case
  when first_name is not null and last_name is not null then first_name || ' ' || last_name
  when first_name is not null then first_name
  when last_name is not null then last_name
  else null
end;

-- Create index on full_name
create index if not exists idx_users_full_name on public.users(full_name);
