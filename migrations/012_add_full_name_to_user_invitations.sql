-- Add full_name column to user_invitations table
alter table public.user_invitations
  add column if not exists full_name text;

-- Create index on full_name for better query performance
create index if not exists idx_user_invitations_full_name on public.user_invitations(full_name);
