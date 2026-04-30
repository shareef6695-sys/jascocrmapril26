-- Lead Scoring System Tables

-- Lead Scoring Rules/Criteria
create table if not exists public.lead_scoring_rules (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  rule_type text not null check (rule_type in ('activity', 'engagement', 'deal', 'profile', 'time_decay', 'manual')),
  trigger_event text,
  points integer not null default 0,
  weight decimal(5, 2) default 1.0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid
);

-- Lead Scores table - stores calculated scores for each contact
create table if not exists public.lead_scores (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid not null unique references public.contacts(id) on delete cascade,
  total_score integer default 0,
  activity_score integer default 0,
  engagement_score integer default 0,
  deal_score integer default 0,
  profile_score integer default 0,
  recency_score integer default 0,
  manual_adjustment integer default 0,
  grade text check (grade in ('A', 'B', 'C', 'D', 'F')),
  last_scored_at timestamp with time zone,
  last_activity_at timestamp with time zone,
  last_contact_at timestamp with time zone,
  days_since_last_activity integer,
  total_activities integer default 0,
  total_deals integer default 0,
  total_deal_value decimal(15, 2) default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Lead Score History - audit trail of score changes
create table if not exists public.lead_score_history (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  lead_score_id uuid references public.lead_scores(id) on delete set null,
  previous_score integer,
  new_score integer,
  score_change integer,
  change_reason text,
  changed_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Lead Scoring Activity Log - tracks individual scoring events
create table if not exists public.lead_scoring_events (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  rule_id uuid references public.lead_scoring_rules(id) on delete set null,
  event_type text not null,
  points_awarded integer not null,
  activity_id uuid references public.activities(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  event_details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes
create index if not exists idx_lead_scoring_rules_company on public.lead_scoring_rules(company_id);
create index if not exists idx_lead_scoring_rules_active on public.lead_scoring_rules(is_active);
create index if not exists idx_lead_scores_company on public.lead_scores(company_id);
create index if not exists idx_lead_scores_contact on public.lead_scores(contact_id);
create index if not exists idx_lead_scores_grade on public.lead_scores(grade);
create index if not exists idx_lead_scores_total on public.lead_scores(total_score);
create index if not exists idx_lead_score_history_company on public.lead_score_history(company_id);
create index if not exists idx_lead_score_history_contact on public.lead_score_history(contact_id);
create index if not exists idx_lead_scoring_events_company on public.lead_scoring_events(company_id);
create index if not exists idx_lead_scoring_events_contact on public.lead_scoring_events(contact_id);
create index if not exists idx_lead_scoring_events_rule on public.lead_scoring_events(rule_id);

-- Apply updated_at triggers
create trigger update_lead_scoring_rules_updated_at before update on public.lead_scoring_rules
  for each row execute function public.update_updated_at_column();

create trigger update_lead_scores_updated_at before update on public.lead_scores
  for each row execute function public.update_updated_at_column();

-- Function to calculate lead score grade based on total score
create or replace function public.calculate_lead_grade(total_score integer)
returns text as $$
begin
  if total_score >= 80 then
    return 'A';
  elsif total_score >= 60 then
    return 'B';
  elsif total_score >= 40 then
    return 'C';
  elsif total_score >= 20 then
    return 'D';
  else
    return 'F';
  end if;
end;
$$ language plpgsql immutable;

-- Function to recalculate lead score
create or replace function public.recalculate_lead_score(p_contact_id uuid)
returns void as $$
declare
  v_company_id uuid;
  v_activity_score integer := 0;
  v_engagement_score integer := 0;
  v_deal_score integer := 0;
  v_profile_score integer := 0;
  v_recency_score integer := 0;
  v_total_activities integer := 0;
  v_total_deals integer := 0;
  v_total_deal_value decimal := 0;
  v_last_activity_at timestamp with time zone;
  v_total_score integer;
  v_grade text;
  v_old_score integer;
begin
  -- Get company_id from contact
  select c.company_id into v_company_id
  from public.contacts c
  where c.id = p_contact_id;

  if v_company_id is null then
    return;
  end if;

  -- Calculate activity score (based on number of activities in last 90 days)
  select count(*) into v_total_activities
  from public.activities a
  where a.contact_id = p_contact_id
    and a.created_at > now() - interval '90 days';

  v_activity_score := least(v_total_activities * 5, 30);

  -- Calculate engagement score (types of activities)
  select sum(
    case a.type
      when 'call' then 10
      when 'email' then 5
      when 'meeting' then 15
      else 2
    end
  ) into v_engagement_score
  from public.activities a
  where a.contact_id = p_contact_id
    and a.created_at > now() - interval '90 days';

  v_engagement_score := coalesce(v_engagement_score, 0);
  v_engagement_score := least(v_engagement_score, 40);

  -- Calculate deal score (number and value of active deals)
  select 
    count(*),
    coalesce(sum(d.amount), 0)
  into v_total_deals, v_total_deal_value
  from public.deals d
  where d.contact_id = p_contact_id
    and d.stage not in ('lost', 'won')
    and d.is_active = true;

  v_deal_score := (v_total_deals * 10) + (
    case 
      when v_total_deal_value > 100000 then 20
      when v_total_deal_value > 50000 then 15
      when v_total_deal_value > 10000 then 10
      when v_total_deal_value > 0 then 5
      else 0
    end
  );
  v_deal_score := least(v_deal_score, 50);

  -- Calculate profile score (completeness of contact info)
  select
    (case when c.email is not null then 5 else 0 end) +
    (case when c.phone is not null or c.mobile is not null then 5 else 0 end) +
    (case when c.job_title is not null then 5 else 0 end) +
    (case when c.company_name is not null then 5 else 0 end) +
    (case when c.notes is not null and length(c.notes) > 10 then 5 else 0 end)
  into v_profile_score
  from public.contacts c
  where c.id = p_contact_id;

  v_profile_score := coalesce(v_profile_score, 0);

  -- Calculate recency score (based on last activity)
  select max(a.activity_date) into v_last_activity_at
  from public.activities a
  where a.contact_id = p_contact_id;

  if v_last_activity_at is not null then
    v_recency_score := case
      when extract(day from (now() - v_last_activity_at)) <= 7 then 20
      when extract(day from (now() - v_last_activity_at)) <= 14 then 15
      when extract(day from (now() - v_last_activity_at)) <= 30 then 10
      when extract(day from (now() - v_last_activity_at)) <= 60 then 5
      else 0
    end;
  end if;

  -- Calculate total score
  v_total_score := v_activity_score + v_engagement_score + v_deal_score + v_profile_score + v_recency_score;

  -- Get current score for history tracking
  select total_score into v_old_score
  from public.lead_scores
  where contact_id = p_contact_id;

  -- Calculate grade
  v_grade := public.calculate_lead_grade(v_total_score);

  -- Update or insert lead score
  insert into public.lead_scores (
    company_id,
    contact_id,
    total_score,
    activity_score,
    engagement_score,
    deal_score,
    profile_score,
    recency_score,
    grade,
    last_scored_at,
    last_activity_at,
    total_activities,
    total_deals,
    total_deal_value
  ) values (
    v_company_id,
    p_contact_id,
    v_total_score,
    v_activity_score,
    v_engagement_score,
    v_deal_score,
    v_profile_score,
    v_recency_score,
    v_grade,
    now(),
    v_last_activity_at,
    v_total_activities,
    v_total_deals,
    v_total_deal_value
  )
  on conflict(contact_id) do update set
    total_score = v_total_score,
    activity_score = v_activity_score,
    engagement_score = v_engagement_score,
    deal_score = v_deal_score,
    profile_score = v_profile_score,
    recency_score = v_recency_score,
    grade = v_grade,
    last_scored_at = now(),
    last_activity_at = v_last_activity_at,
    total_activities = v_total_activities,
    total_deals = v_total_deals,
    total_deal_value = v_total_deal_value,
    updated_at = now();

  -- Record score change in history if score changed
  if v_old_score is not null and v_old_score != v_total_score then
    insert into public.lead_score_history (
      company_id,
      contact_id,
      previous_score,
      new_score,
      score_change,
      change_reason,
      created_at
    ) values (
      v_company_id,
      p_contact_id,
      v_old_score,
      v_total_score,
      v_total_score - v_old_score,
      'Automatic recalculation based on activities and deals',
      now()
    );
  end if;
end;
$$ language plpgsql;

-- Trigger to recalculate score when activity is created
create or replace function public.trigger_recalculate_score_on_activity()
returns trigger as $$
begin
  if new.contact_id is not null then
    perform public.recalculate_lead_score(new.contact_id);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger score_recalc_on_activity after insert on public.activities
  for each row execute function public.trigger_recalculate_score_on_activity();

-- Trigger to recalculate score when deal is created/updated
create or replace function public.trigger_recalculate_score_on_deal()
returns trigger as $$
begin
  if new.contact_id is not null then
    perform public.recalculate_lead_score(new.contact_id);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger score_recalc_on_deal after insert or update on public.deals
  for each row execute function public.trigger_recalculate_score_on_deal();

-- Trigger to recalculate score when contact info is updated
create or replace function public.trigger_recalculate_score_on_contact_update()
returns trigger as $$
begin
  perform public.recalculate_lead_score(new.id);
  return new;
end;
$$ language plpgsql;

create trigger score_recalc_on_contact_update after update on public.contacts
  for each row execute function public.trigger_recalculate_score_on_contact_update();
