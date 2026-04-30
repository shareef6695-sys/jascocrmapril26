-- Lead Scoring RPC Functions for Frontend

-- Get top leads by score
create or replace function public.get_top_leads(p_company_id uuid, p_limit int default 10)
returns table (
  contact_id uuid,
  first_name text,
  last_name text,
  email text,
  total_score integer,
  grade text,
  status text,
  last_activity_at timestamp with time zone,
  total_deals integer,
  total_deal_value decimal
) as $$
begin
  return query
  select 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    ls.total_score,
    ls.grade,
    c.status,
    ls.last_activity_at,
    ls.total_deals,
    ls.total_deal_value
  from public.contacts c
  join public.lead_scores ls on c.id = ls.contact_id
  where c.company_id = p_company_id
    and c.is_active = true
  order by ls.total_score desc, ls.last_activity_at desc
  limit p_limit;
end;
$$ language plpgsql;

-- Get leads by grade
create or replace function public.get_leads_by_grade(p_company_id uuid, p_grade text)
returns table (
  contact_id uuid,
  first_name text,
  last_name text,
  email text,
  total_score integer,
  grade text,
  status text,
  owner_id uuid,
  owner_name text,
  last_activity_at timestamp with time zone,
  total_activities integer,
  total_deals integer,
  total_deal_value decimal
) as $$
begin
  return query
  select 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    ls.total_score,
    ls.grade,
    c.status,
    c.owner_id,
    concat(u.first_name, ' ', u.last_name),
    ls.last_activity_at,
    ls.total_activities,
    ls.total_deals,
    ls.total_deal_value
  from public.contacts c
  join public.lead_scores ls on c.id = ls.contact_id
  left join public.users u on c.owner_id = u.id
  where c.company_id = p_company_id
    and c.is_active = true
    and ls.grade = p_grade
  order by ls.total_score desc;
end;
$$ language plpgsql;

-- Get lead score details
create or replace function public.get_lead_score_details(p_contact_id uuid)
returns table (
  contact_id uuid,
  contact_name text,
  email text,
  total_score integer,
  activity_score integer,
  engagement_score integer,
  deal_score integer,
  profile_score integer,
  recency_score integer,
  grade text,
  last_scored_at timestamp with time zone,
  last_activity_at timestamp with time zone,
  total_activities integer,
  total_deals integer,
  total_deal_value decimal,
  score_change_last_7_days integer
) as $$
declare
  v_previous_score integer;
begin
  return query
  select 
    ls.contact_id,
    concat(c.first_name, ' ', c.last_name),
    c.email,
    ls.total_score,
    ls.activity_score,
    ls.engagement_score,
    ls.deal_score,
    ls.profile_score,
    ls.recency_score,
    ls.grade,
    ls.last_scored_at,
    ls.last_activity_at,
    ls.total_activities,
    ls.total_deals,
    ls.total_deal_value,
    (select coalesce(new_score - previous_score, 0)
     from public.lead_score_history
     where contact_id = p_contact_id
       and created_at > now() - interval '7 days'
     order by created_at desc
     limit 1)
  from public.lead_scores ls
  join public.contacts c on ls.contact_id = c.id
  where ls.contact_id = p_contact_id;
end;
$$ language plpgsql;

-- Get stale leads (no activity in X days)
create or replace function public.get_stale_leads(p_company_id uuid, p_days_since_activity int default 30)
returns table (
  contact_id uuid,
  first_name text,
  last_name text,
  email text,
  total_score integer,
  grade text,
  last_activity_at timestamp with time zone,
  days_since_activity int,
  owner_id uuid,
  owner_name text
) as $$
begin
  return query
  select 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    ls.total_score,
    ls.grade,
    ls.last_activity_at,
    extract(day from (now() - ls.last_activity_at))::int,
    c.owner_id,
    concat(u.first_name, ' ', u.last_name)
  from public.contacts c
  join public.lead_scores ls on c.id = ls.contact_id
  left join public.users u on c.owner_id = u.id
  where c.company_id = p_company_id
    and c.is_active = true
    and ls.last_activity_at < now() - make_interval(days => p_days_since_activity)
  order by ls.last_activity_at asc;
end;
$$ language plpgsql;

-- Get high-value leads (high score + high deal value)
create or replace function public.get_high_value_leads(p_company_id uuid)
returns table (
  contact_id uuid,
  first_name text,
  last_name text,
  email text,
  total_score integer,
  grade text,
  total_deal_value decimal,
  active_deal_count integer,
  owner_id uuid,
  owner_name text
) as $$
begin
  return query
  select 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    ls.total_score,
    ls.grade,
    ls.total_deal_value,
    ls.total_deals,
    c.owner_id,
    concat(u.first_name, ' ', u.last_name)
  from public.contacts c
  join public.lead_scores ls on c.id = ls.contact_id
  left join public.users u on c.owner_id = u.id
  where c.company_id = p_company_id
    and c.is_active = true
    and ls.total_score >= 60
    and ls.total_deal_value > 0
  order by ls.total_deal_value desc;
end;
$$ language plpgsql;

-- Get leads improved recently (score increased significantly)
create or replace function public.get_improved_leads(p_company_id uuid, p_days int default 7)
returns table (
  contact_id uuid,
  first_name text,
  last_name text,
  email text,
  current_score integer,
  previous_score integer,
  score_improvement integer,
  improvement_date timestamp with time zone,
  grade text
) as $$
begin
  return query
  select 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    lsh.new_score,
    lsh.previous_score,
    lsh.score_change,
    lsh.created_at,
    ls.grade
  from public.lead_score_history lsh
  join public.contacts c on lsh.contact_id = c.id
  join public.lead_scores ls on c.id = ls.contact_id
  where lsh.company_id = p_company_id
    and lsh.created_at > now() - make_interval(days => p_days)
    and lsh.score_change > 0
  order by lsh.score_change desc, lsh.created_at desc;
end;
$$ language plpgsql;

-- Get lead score summary statistics
create or replace function public.get_lead_score_summary(p_company_id uuid)
returns table (
  total_leads integer,
  average_score decimal,
  grade_a_count integer,
  grade_b_count integer,
  grade_c_count integer,
  grade_d_count integer,
  grade_f_count integer,
  avg_deal_value decimal,
  leads_with_activity_last_7_days integer,
  stale_leads_count integer
) as $$
begin
  return query
  select 
    count(distinct c.id)::integer,
    round(avg(ls.total_score)::numeric, 1),
    count(case when ls.grade = 'A' then 1 end)::integer,
    count(case when ls.grade = 'B' then 1 end)::integer,
    count(case when ls.grade = 'C' then 1 end)::integer,
    count(case when ls.grade = 'D' then 1 end)::integer,
    count(case when ls.grade = 'F' then 1 end)::integer,
    round(avg(ls.total_deal_value)::numeric, 2),
    count(case when ls.last_activity_at > now() - interval '7 days' then 1 end)::integer,
    count(case when ls.last_activity_at < now() - interval '30 days' then 1 end)::integer
  from public.contacts c
  join public.lead_scores ls on c.id = ls.contact_id
  where c.company_id = p_company_id
    and c.is_active = true;
end;
$$ language plpgsql;
