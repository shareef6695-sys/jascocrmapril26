/**
 * forecastEngine.js
 *
 * Pure forecast calculation — no side effects, no imports.
 * Input: raw deal rows from getForecastData.
 * Output: chart-ready data + summary metrics.
 *
 * 6-month rolling window:
 *   indices 0-2  → 3 months ago … 1 month ago  (historical actuals)
 *   index   3    → current month                (actual + open pipeline)
 *   indices 4-5  → +1 month … +2 months ahead   (weighted projection)
 */

// Stage → close probability used for weighted forecast
export const STAGE_WEIGHTS = {
  lead: 0.10,
  contact_made: 0.25,
  proposal_sent: 0.50,
  negotiation: 0.75,
  won: 1.00,
  lost: 0.00,
};

const MONTH_LABEL_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
});

/**
 * calculateHistoricalWinRates(deals)
 *
 * Analyze closed deals from the last 3 months to compute win rates by stage.
 * For stages with 10+ samples, uses empirical data; otherwise falls back to STAGE_WEIGHTS.
 * Returns { [stage]: winRate } where winRate is 0–1.
 */
export function calculateHistoricalWinRates(deals = []) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentClosed = deals.filter((d) => {
    const ref = d.closed_at ? new Date(d.closed_at) : null;
    return ref && ref >= threeMonthsAgo && ["won", "lost"].includes(d.stage);
  });

  const rates = {};
  const stages = Object.keys(STAGE_WEIGHTS);

  stages.forEach((stage) => {
    // For historical rates, approximate by grouping closed deals.
    // In reality, we'd want stage progression history, but we infer from final state.
    // Here: treat all closed deals as a cohort and derive overall win probability.
    if (recentClosed.length >= 10) {
      const won = recentClosed.filter((d) => d.stage === "won").length;
      const overallRate = won / recentClosed.length;
      // Adjust per-stage estimate: use stage default * overall win ratio
      rates[stage] = Math.min(STAGE_WEIGHTS[stage] * (overallRate / STAGE_WEIGHTS.won || 1), 1);
    } else {
      rates[stage] = STAGE_WEIGHTS[stage];
    }
  });

  return rates;
}

/**
 * getRepWinRates(deals)
 *
 * Calculate historical win rates per sales rep (owner_id).
 * Uses closed deals from the last 3 months.
 * Returns { [owner_id]: winRate } where winRate is 0–1.
 */
export function getRepWinRates(deals = []) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentClosed = deals.filter((d) => {
    const ref = d.closed_at ? new Date(d.closed_at) : null;
    return ref && ref >= threeMonthsAgo && ["won", "lost"].includes(d.stage);
  });

  const repStats = {};

  recentClosed.forEach((d) => {
    if (!repStats[d.owner_id]) {
      repStats[d.owner_id] = { won: 0, total: 0 };
    }
    repStats[d.owner_id].total += 1;
    if (d.stage === "won") {
      repStats[d.owner_id].won += 1;
    }
  });

  // Convert to win rates
  Object.keys(repStats).forEach((repId) => {
    const { won, total } = repStats[repId];
    repStats[repId] = total > 0 ? won / total : 0;
  });

  return repStats;
}

/**
 * getWeightForDeal(deal, historicalRates, repWinRates)
 *
 * Blend stage rate and rep rate using 60/40 split.
 * Fallback to STAGE_WEIGHTS if insufficient data.
 */
const getWeightForDeal = (deal, historicalRates = null, repWinRates = null) => {
  let stageRate = (historicalRates && historicalRates[deal.stage]) ?? STAGE_WEIGHTS[deal.stage] ?? 0.5;
  let repRate = (repWinRates && repWinRates[deal.owner_id]) ?? null;

  if (repRate !== null && repRate !== undefined) {
    // Blend: 60% stage rate + 40% rep rate
    return stageRate * 0.6 + repRate * 0.4;
  }
  return stageRate;
};


/**
 * Build a slot descriptor for `offset` months from now.
 * offset = -3 → 3 months ago; 0 → current; +2 → 2 months ahead.
 */
const makeSlot = (now, offset) => {
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    label: MONTH_LABEL_FMT.format(d),
    isPast: offset < 0,
    isCurrent: offset === 0,
    isFuture: offset > 0,
  };
};

/**
 * Compute per-slot actual won revenue.
 * Uses closed_at when set (authoritative), falls back to expected_close_date.
 */
const wonInSlot = (deals, slot) =>
  deals
    .filter((d) => {
      if (d.stage !== "won") return false;
      const ref = d.closed_at
        ? new Date(d.closed_at)
        : d.expected_close_date
        ? new Date(d.expected_close_date)
        : null;
      return ref && inMonth(ref, slot.year, slot.month);
    })
    .reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);

/**
 * All open (non-lost) deals with expected_close_date in the given slot.
 * Won deals already in the slot are included for the weighted line so
 * the projection connects smoothly with actuals.
 */
const pipelineInSlot = (deals, slot) =>
  deals.filter((d) => {
    if (d.stage === "lost") return false;
    if (!d.expected_close_date) return false;
    const ref = new Date(d.expected_close_date);
    return inMonth(ref, slot.year, slot.month);
  });

/**
 * buildForecast(deals, historicalRates, repWinRates)
 *
 * @param {Array}   deals - Raw deal objects from getForecastData
 * @param {Object}  historicalRates - Optional: win rates by stage (from calculateHistoricalWinRates)
 * @param {Object}  repWinRates - Optional: win rates per rep (from getRepWinRates)
 * @returns {{
 *   chartData:  Array,   // 6 entries — one per month in the window
 *   thisMonth:  Object,  // summary for current month
 *   nextMonth:  Object,  // summary for next month
 *   summary:    Object,  // total open pipeline stats
 *   growthPct:  number,  // next-month vs this-month weighted growth %
 * }}
 */
export function buildForecast(deals = [], historicalRates = null, repWinRates = null) {
  const now = new Date();

  // ── Build 6 month slots ─────────────────────────────────────────────────────
  const slots = [-3, -2, -1, 0, 1, 2].map((offset) => makeSlot(now, offset));

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = slots.map((slot) => {
    const actual = wonInSlot(deals, slot);
    const pipe = pipelineInSlot(deals, slot);
    const pipeline = pipe.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
    const weighted = pipe.reduce(
      (s, d) =>
        s + (parseFloat(d.amount) || 0) * getWeightForDeal(d, historicalRates, repWinRates),
      0
    );

    return {
      label: slot.label,
      // Past months: show actual won revenue (bar)
      actual: slot.isPast ? Math.round(actual) : null,
      // Current + future: show total pipeline capacity (background bar)
      pipeline: !slot.isPast ? Math.round(pipeline) : null,
      // All months: weighted forecast line (connects actuals to projections)
      weighted: Math.round(slot.isPast ? actual : weighted),
      dealCount: pipe.length,
      isCurrent: slot.isCurrent,
    };
  });

  // ── Per-month summaries ─────────────────────────────────────────────────────
  const buildMonthSummary = (slotIndex) => {
    const slot = slots[slotIndex];
    const pipe = pipelineInSlot(deals, slot);
    const pipeline = pipe.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
    const weighted = pipe.reduce(
      (s, d) =>
        s + (parseFloat(d.amount) || 0) * getWeightForDeal(d, historicalRates, repWinRates),
      0
    );
    const confidence =
      pipeline > 0 ? Math.round((weighted / pipeline) * 100) : 0;
    return {
      deals: pipe.length,
      weighted: Math.round(weighted),
      pipeline: Math.round(pipeline),
      confidence,
    };
  };

  const THIS_MONTH_IDX = 3;
  const thisMonth = buildMonthSummary(THIS_MONTH_IDX);
  const nextMonth = buildMonthSummary(THIS_MONTH_IDX + 1);

  // ── Historical win rate (last 3 months of closed deals) ────────────────────
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const recentClosed = deals.filter((d) => {
    const ref = d.closed_at ? new Date(d.closed_at) : null;
    return ref && ref >= threeMonthsAgo && ["won", "lost"].includes(d.stage);
  });
  const winRate =
    recentClosed.length > 0
      ? Math.round(
          (recentClosed.filter((d) => d.stage === "won").length /
            recentClosed.length) *
            100
        )
      : 0;

  // ── Open pipeline summary ───────────────────────────────────────────────────
  const openDeals = deals.filter(
    (d) => !["won", "lost"].includes(d.stage)
  );
  const totalPipeline = openDeals.reduce(
    (s, d) => s + (parseFloat(d.amount) || 0),
    0
  );
  const weightedTotal = openDeals.reduce(
    (s, d) =>
      s + (parseFloat(d.amount) || 0) * getWeightForDeal(d, historicalRates, repWinRates),
    0
  );
  const avgDealSize =
    openDeals.length > 0 ? totalPipeline / openDeals.length : 0;

  // ── Month-over-month growth ─────────────────────────────────────────────────
  const growthPct =
    thisMonth.weighted > 0
      ? Math.round(
          ((nextMonth.weighted - thisMonth.weighted) / thisMonth.weighted) * 100
        )
      : nextMonth.weighted > 0
      ? 100
      : 0;

  return {
    chartData,
    thisMonth,
    nextMonth,
    summary: {
      totalPipeline: Math.round(totalPipeline),
      weightedTotal: Math.round(weightedTotal),
      avgDealSize: Math.round(avgDealSize),
      winRate,
      openDeals: openDeals.length,
    },
    growthPct,
  };
}
