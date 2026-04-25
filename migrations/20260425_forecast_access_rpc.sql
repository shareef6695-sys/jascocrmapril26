create or replace function public._forecast_role_scope(user_id uuid)
returns text
language sql
stable
as $$
  select case
    when exists (
      select 1
      from public.users u
      where u.id = user_id and u.role in ('director', 'admin')
    ) then 'company'
    when exists (
      select 1
      from public.users u
      where u.id = user_id and u.role in ('manager', 'supervisor', 'head')
    ) then 'team'
    else 'own'
  end;
$$;

create or replace function public._forecast_is_subordinate(manager_id uuid, candidate_id uuid)
returns boolean
language sql
stable
as $$
  with recursive subs as (
    select u.id
    from public.users u
    where u.supervisor_id = manager_id and u.is_active = true
    union all
    select u2.id
    from public.users u2
    join subs s on u2.supervisor_id = s.id
    where u2.is_active = true
  )
  select exists(select 1 from subs where id = candidate_id);
$$;

create or replace function public._forecast_allowed_owner_ids(
  caller_id uuid,
  company_id uuid,
  requested_scope text,
  requested_rep_id uuid
)
returns uuid[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  caller_role text;
  scope text;
  owners uuid[];
begin
  select u.role into caller_role
  from public.users u
  where u.id = caller_id;

  if caller_role is null then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  scope := requested_scope;
  if scope is null or scope = '' then
    scope := public._forecast_role_scope(caller_id);
  end if;

  if caller_role in ('salesman', 'sales_rep', 'agent') then
    return array[caller_id];
  end if;

  if caller_role in ('manager', 'supervisor', 'head') then
    if scope = 'company' then
      raise exception 'Forbidden' using errcode = '42501';
    end if;

    if requested_rep_id is not null and requested_rep_id <> caller_id then
      if not public._forecast_is_subordinate(caller_id, requested_rep_id) then
        raise exception 'Forbidden' using errcode = '42501';
      end if;
      return array[requested_rep_id];
    end if;

    owners := array[caller_id];
    owners := owners || array(
      with recursive subs as (
        select u.id
        from public.users u
        where u.supervisor_id = caller_id and u.is_active = true and u.company_id = company_id
        union all
        select u2.id
        from public.users u2
        join subs s on u2.supervisor_id = s.id
        where u2.is_active = true and u2.company_id = company_id
      )
      select id from subs
    );
    return owners;
  end if;

  if caller_role in ('director', 'admin') then
    if scope = 'own' then
      return array[coalesce(requested_rep_id, caller_id)];
    end if;

    if scope = 'team' then
      if requested_rep_id is not null and requested_rep_id <> caller_id then
        return array[requested_rep_id];
      end if;
      return null;
    end if;

    return null;
  end if;

  return array[caller_id];
end;
$$;

create or replace function public.forecast_get_summary(
  company_id uuid,
  scope text default null,
  rep_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  caller_id uuid;
  owner_ids uuid[];
  month_start date;
  next_month_start date;
  following_month_start date;
  result jsonb;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  month_start := date_trunc('month', now())::date;
  next_month_start := (date_trunc('month', now()) + interval '1 month')::date;
  following_month_start := (date_trunc('month', now()) + interval '2 months')::date;

  owner_ids := public._forecast_allowed_owner_ids(caller_id, company_id, scope, rep_id);

  with scoped_deals as (
    select d.*
    from public.deals d
    where d.company_id = forecast_get_summary.company_id
      and (owner_ids is null or d.owner_id = any(owner_ids))
  ),
  weighted as (
    select
      d.*,
      (coalesce(d.amount, 0) * case d.stage
        when 'lead' then 0.10
        when 'contact_made' then 0.25
        when 'proposal_sent' then 0.50
        when 'negotiation' then 0.75
        when 'won' then 1.00
        when 'lost' then 0.00
        else 0.50
      end) as weighted_amount
    from scoped_deals d
  ),
  this_month as (
    select
      count(*)::int as deals_count,
      coalesce(sum(coalesce(amount, 0)), 0) as total_pipeline,
      coalesce(sum(weighted_amount), 0) as weighted_forecast
    from weighted
    where expected_close_date is not null
      and expected_close_date::date >= month_start
      and expected_close_date::date < next_month_start
  ),
  next_month as (
    select
      count(*)::int as deals_count,
      coalesce(sum(coalesce(amount, 0)), 0) as total_pipeline,
      coalesce(sum(weighted_amount), 0) as weighted_forecast
    from weighted
    where expected_close_date is not null
      and expected_close_date::date >= next_month_start
      and expected_close_date::date < following_month_start
  ),
  risk as (
    select
      count(*)::int as risk_deals_count,
      coalesce(sum(coalesce(amount, 0)), 0) as risk_total_amount
    from weighted
    where expected_close_date is not null
      and expected_close_date::date < current_date
      and stage not in ('won', 'lost')
  ),
  pipeline as (
    select
      count(*)::int as pipeline_deals_count,
      coalesce(sum(coalesce(amount, 0)), 0) as pipeline_total_amount,
      coalesce(sum(weighted_amount), 0) as pipeline_weighted_amount
    from weighted
    where stage <> 'lost'
  )
  select jsonb_build_object(
    'company_id', forecast_get_summary.company_id,
    'scope', coalesce(scope, public._forecast_role_scope(caller_id)),
    'rep_id', rep_id,
    'this_month', jsonb_build_object(
      'deals', (select deals_count from this_month),
      'total_pipeline', (select total_pipeline from this_month),
      'weighted_forecast', (select weighted_forecast from this_month)
    ),
    'next_month', jsonb_build_object(
      'deals', (select deals_count from next_month),
      'total_pipeline', (select total_pipeline from next_month),
      'weighted_forecast', (select weighted_forecast from next_month)
    ),
    'pipeline', jsonb_build_object(
      'deals', (select pipeline_deals_count from pipeline),
      'total_amount', (select pipeline_total_amount from pipeline),
      'weighted_amount', (select pipeline_weighted_amount from pipeline)
    ),
    'risk', jsonb_build_object(
      'deals', (select risk_deals_count from risk),
      'total_amount', (select risk_total_amount from risk)
    )
  ) into result;

  return result;
end;
$$;

create or replace function public.forecast_get_risk_deals(
  company_id uuid,
  scope text default null,
  rep_id uuid default null
)
returns table (
  id uuid,
  title text,
  amount numeric,
  currency text,
  stage text,
  expected_close_date date,
  owner_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  caller_id uuid;
  owner_ids uuid[];
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  owner_ids := public._forecast_allowed_owner_ids(caller_id, company_id, scope, rep_id);

  return query
  select
    d.id,
    d.title,
    d.amount,
    d.currency,
    d.stage,
    d.expected_close_date,
    d.owner_id,
    d.created_at,
    d.updated_at
  from public.deals d
  where d.company_id = forecast_get_risk_deals.company_id
    and (owner_ids is null or d.owner_id = any(owner_ids))
    and d.expected_close_date is not null
    and d.expected_close_date::date < current_date
    and d.stage not in ('won', 'lost')
  order by d.expected_close_date asc nulls last;
end;
$$;

grant execute on function public.forecast_get_summary(uuid, text, uuid) to authenticated;
grant execute on function public.forecast_get_risk_deals(uuid, text, uuid) to authenticated;
