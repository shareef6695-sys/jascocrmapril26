-- User Management RPC Functions

-- Create a new user (admin only)
create or replace function public.create_user(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_company_id uuid,
  p_role text,
  p_department text default null,
  p_job_title text default null,
  p_phone text default null
)
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  is_active boolean,
  created_at timestamp with time zone
) as $$
declare
  v_user_id uuid;
  v_auth_user jsonb;
begin
  -- Check if user has admin or director role
  if not exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'director')
      and u.is_active = true
  ) then
    raise exception 'Only admins and directors can create users';
  end if;

  -- Create auth user (temporary password will be set)
  select auth.email() into v_user_id;
  
  -- Insert user record
  insert into public.users (
    id,
    email,
    first_name,
    last_name,
    company_id,
    role,
    department,
    job_title,
    phone,
    is_active,
    created_by
  ) values (
    gen_random_uuid(),
    p_email,
    p_first_name,
    p_last_name,
    p_company_id,
    p_role,
    p_department,
    p_job_title,
    p_phone,
    true,
    auth.uid()
  )
  returning users.id, users.email, users.first_name, users.last_name, users.role, users.is_active, users.created_at;
end;
$$ language plpgsql;

-- Get company users
create or replace function public.get_company_users(p_company_id uuid)
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  department text,
  job_title text,
  phone text,
  is_active boolean,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone
) as $$
begin
  return query
  select 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.department,
    u.job_title,
    u.phone,
    u.is_active,
    u.last_login_at,
    u.created_at
  from public.users u
  where u.company_id = p_company_id
  order by u.created_at desc;
end;
$$ language plpgsql;

-- Get users by role
create or replace function public.get_users_by_role(p_company_id uuid, p_role text)
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  department text,
  job_title text,
  is_active boolean
) as $$
begin
  return query
  select 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.department,
    u.job_title,
    u.is_active
  from public.users u
  where u.company_id = p_company_id
    and u.role = p_role
    and u.is_active = true
  order by u.first_name, u.last_name;
end;
$$ language plpgsql;

-- Update user
create or replace function public.update_user(
  p_user_id uuid,
  p_first_name text default null,
  p_last_name text default null,
  p_role text default null,
  p_department text default null,
  p_job_title text default null,
  p_phone text default null,
  p_is_active boolean default null
)
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  is_active boolean,
  updated_at timestamp with time zone
) as $$
begin
  update public.users set
    first_name = coalesce(p_first_name, first_name),
    last_name = coalesce(p_last_name, last_name),
    role = coalesce(p_role, role),
    department = coalesce(p_department, department),
    job_title = coalesce(p_job_title, job_title),
    phone = coalesce(p_phone, phone),
    is_active = coalesce(p_is_active, is_active),
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_user_id
  returning users.id, users.email, users.first_name, users.last_name, users.role, users.is_active, users.updated_at;
end;
$$ language plpgsql;

-- Deactivate user
create or replace function public.deactivate_user(p_user_id uuid)
returns table (
  id uuid,
  email text,
  is_active boolean
) as $$
begin
  update public.users set
    is_active = false,
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_user_id
  returning users.id, users.email, users.is_active;
end;
$$ language plpgsql;

-- Get active team members for assignment
create or replace function public.get_team_members(p_company_id uuid)
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  department text
) as $$
begin
  return query
  select 
    u.id,
    u.email,
    concat(u.first_name, ' ', u.last_name) as full_name,
    u.role,
    u.department
  from public.users u
  where u.company_id = p_company_id
    and u.is_active = true
  order by u.first_name, u.last_name;
end;
$$ language plpgsql;

-- Get user hierarchy (managers and direct reports)
create or replace function public.get_user_hierarchy(p_company_id uuid, p_user_id uuid)
returns table (
  user_id uuid,
  full_name text,
  role text,
  manager_id uuid,
  manager_name text,
  level text
) as $$
begin
  return query
  with recursive user_tree as (
    select 
      u.id,
      u.manager_id,
      concat(u.first_name, ' ', u.last_name) as full_name,
      u.role,
      1 as depth
    from public.users u
    where u.id = p_user_id and u.company_id = p_company_id
    
    union all
    
    select 
      u.id,
      u.manager_id,
      concat(u.first_name, ' ', u.last_name) as full_name,
      u.role,
      ut.depth + 1
    from public.users u
    join user_tree ut on u.manager_id = ut.user_id
    where u.company_id = p_company_id
      and ut.depth < 10
  )
  select 
    ut.id,
    ut.full_name,
    ut.role,
    ut.manager_id,
    concat(m.first_name, ' ', m.last_name) as manager_name,
    case when ut.depth = 1 then 'Current' else 'Reports' end as level
  from user_tree ut
  left join public.users m on ut.manager_id = m.id
  order by ut.depth, ut.full_name;
end;
$$ language plpgsql;
