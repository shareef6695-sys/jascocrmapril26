create or replace function public.forecast_get_kpis(
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
  month_end date;
  target_sum numeric;
  actual_sum numeric;
  forecast_sum numeric;
  pipeline_open_sum numeric;
  risk_count int;
  risk_sum numeric;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  month_start := date_trunc('month', now())::date;
  next_month_start := (date_trunc('month', now()) + interval '1 month')::date;
  month_end := (next_month_start - interval '1 day')::date;

  owner_ids := public._forecast_allowed_owner_ids(caller_id, company_id, scope, rep_id);

  select coalesce(sum(coalesce(st.target_amount, 0)), 0)
  into target_sum
  from public.sales_targets st
  where st.company_id = forecast_get_kpis.company_id
    and st.period_start = month_start
    and st.period_end = month_end
    and (owner_ids is null or st.assigned_to = any(owner_ids));

  select coalesce(sum(coalesce(d.amount, 0)), 0)
  into actual_sum
  from public.deals d
  where d.company_id = forecast_get_kpis.company_id
    and (owner_ids is null or d.owner_id = any(owner_ids))
    and d.stage = 'won'
    and d.closed_at is not null
    and d.closed_at::date >= month_start
    and d.closed_at::date < next_month_start;

  select coalesce(sum(coalesce(d.amount, 0) * case d.stage
    when 'lead' then 0.10
    when 'contact_made' then 0.25
    when 'proposal_sent' then 0.50
    when 'negotiation' then 0.75
    when 'won' then 1.00
    when 'lost' then 0.00
    else 0.50
  end), 0)
  into forecast_sum
  from public.deals d
  where d.company_id = forecast_get_kpis.company_id
    and (owner_ids is null or d.owner_id = any(owner_ids))
    and d.expected_close_date is not null
    and d.expected_close_date::date >= month_start
    and d.expected_close_date::date < next_month_start;

  select coalesce(sum(coalesce(d.amount, 0)), 0)
  into pipeline_open_sum
  from public.deals d
  where d.company_id = forecast_get_kpis.company_id
    and (owner_ids is null or d.owner_id = any(owner_ids))
    and d.stage not in ('won', 'lost');

  select count(*)::int, coalesce(sum(coalesce(d.amount, 0)), 0)
  into risk_count, risk_sum
  from public.deals d
  where d.company_id = forecast_get_kpis.company_id
    and (owner_ids is null or d.owner_id = any(owner_ids))
    and d.expected_close_date is not null
    and d.expected_close_date::date < current_date
    and d.stage not in ('won', 'lost');

  return jsonb_build_object(
    'company_id', forecast_get_kpis.company_id,
    'scope', coalesce(scope, public._forecast_role_scope(caller_id)),
    'rep_id', rep_id,
    'period_start', month_start,
    'period_end', month_end,
    'target', target_sum,
    'actual', actual_sum,
    'forecast', forecast_sum,
    'achievement_pct', case when target_sum > 0 then (actual_sum / target_sum) * 100 else 0 end,
    'gap_to_target', greatest(target_sum - actual_sum, 0),
    'pipeline_open', pipeline_open_sum,
    'risk', jsonb_build_object(
      'deals', risk_count,
      'total_amount', risk_sum
    )
  );
end;
$$;

grant execute on function public.forecast_get_kpis(uuid, text, uuid) to authenticated;
