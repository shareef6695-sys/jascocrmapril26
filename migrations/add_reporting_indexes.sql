-- Reporting indexes
--
-- These composite indexes target the three main report queries in the
-- /reports page and the forecast RPCs.  Each replaces a slower
-- multi-index bitmap-AND scan with a single B-tree range scan.
--
-- Safe to run multiple times (IF NOT EXISTS on every statement).
-- Does not modify any table structure or data.

-- ─── deals ────────────────────────────────────────────────────────────────────

-- Pipeline report: filters by company + stage, then sorts/ranges on closed_at.
-- Column order: company_id (equality) → stage (equality) → closed_at (range).
create index if not exists idx_deals_company_stage_closed_at
    on public.deals (company_id, stage, closed_at);

-- Partial index for closed-deal queries (won/lost stage reporting and velocity
-- calculations).  Skips the ~majority of rows that have closed_at = NULL,
-- keeping the index small and fast.
create index if not exists idx_deals_closed_at_not_null
    on public.deals (company_id, closed_at)
    where closed_at is not null;

-- Leaderboard report: groups deals by owner within a company.
-- Also speeds up the deal-service owner-visibility filter.
create index if not exists idx_deals_company_owner_stage
    on public.deals (company_id, owner_id, stage);

-- Pipeline report date filter uses expected_close_date for open deals.
create index if not exists idx_deals_company_expected_close
    on public.deals (company_id, expected_close_date);

-- ─── activities ───────────────────────────────────────────────────────────────

-- Activity report: filters by company, then ranges on created_at.
-- Supersedes the existing single-column idx_activities_company_id for
-- any query that also filters or sorts on created_at.
create index if not exists idx_activities_company_created_at
    on public.activities (company_id, created_at desc);

-- Activity report with employee filter: company + owner lookup + date range.
create index if not exists idx_activities_company_owner_created_at
    on public.activities (company_id, owner_id, created_at desc);

-- ─── sales_targets ────────────────────────────────────────────────────────────

-- Target report and forecast RPCs: filter by company, then range on period
-- boundaries.  Column order matches the WHERE/ORDER BY pattern:
--   WHERE company_id = $1 AND period_start >= $2 AND period_end <= $3
create index if not exists idx_sales_targets_company_period
    on public.sales_targets (company_id, period_start, period_end);

-- Target report with employee filter: company + assignee + period.
create index if not exists idx_sales_targets_company_assignee_period
    on public.sales_targets (company_id, assigned_to, period_start);
