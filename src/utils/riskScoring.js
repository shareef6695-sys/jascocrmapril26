/**
 * riskScoring.js
 *
 * Deal risk assessment based on multiple factors:
 * - Deal age in current stage
 * - Expected close date vs today
 * - Deal amount relative to average
 * - Current stage risk profile
 */

const STAGE_RISK_PROFILE = {
  lead: 4, // Very high risk
  contact_made: 3, // High risk
  proposal_sent: 2, // Medium risk
  negotiation: 1, // Low risk
  won: 0, // No risk
  lost: 0, // Already lost
};

const STAGE_AGING_THRESHOLD = {
  lead: 90, // 90 days in lead is concerning
  contact_made: 60, // 60 days in contact_made is concerning
  proposal_sent: 45, // 45 days in proposal_sent is concerning
  negotiation: 30, // 30 days in negotiation is concerning
};

/**
 * scoreDealRisk(deal, allDeals)
 *
 * Calculate risk score (0-100) and return risk factors.
 *
 * @param {Object} deal - The deal to score
 * @param {Array} allDeals - All deals (for context: average amount, aging patterns)
 * @returns {{
 *   score: number,           // 0-100, higher = riskier
 *   level: string,           // 'low', 'medium', 'high', 'critical'
 *   flags: Array<string>,    // Specific risk reasons
 * }}
 */
export function scoreDealRisk(deal, allDeals = []) {
  let score = 0;
  const flags = [];

  if (!deal) {
    return { score: 0, level: "low", flags: [] };
  }

  // Already closed — no active risk
  if (["won", "lost"].includes(deal.stage)) {
    return { score: 0, level: "low", flags: [] };
  }

  // ── 1. Stage-based risk (inherent risk of stage)
  const stageRisk = STAGE_RISK_PROFILE[deal.stage] || 2;
  score += stageRisk * 10;
  if (stageRisk >= 3) flags.push(`Early-stage risk (${deal.stage})`);

  // ── 2. Expected close date risk
  if (deal.expected_close_date) {
    const today = new Date();
    const closeDate = new Date(deal.expected_close_date);
    const daysUntilClose = Math.ceil((closeDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilClose < 0) {
      score += 25; // Overdue is critical
      flags.push(`Overdue by ${Math.abs(daysUntilClose)} days`);
    } else if (daysUntilClose <= 7) {
      score += 15;
      flags.push(`Closing in ${daysUntilClose} days`);
    }
  }

  // ── 3. Deal age in current stage
  if (deal.created_at) {
    const today = new Date();
    const created = new Date(deal.created_at);
    const ageInDays = Math.ceil((today - created) / (1000 * 60 * 60 * 24));
    const threshold = STAGE_AGING_THRESHOLD[deal.stage] || 60;

    if (ageInDays > threshold) {
      score += 15;
      flags.push(`Stuck in ${deal.stage} for ${ageInDays} days`);
    }
  }

  // ── 4. Deal amount outliers
  if (allDeals && allDeals.length > 0) {
    const openDeals = allDeals.filter(
      (d) => !["won", "lost"].includes(d.stage)
    );
    if (openDeals.length > 2) {
      const amounts = openDeals
        .map((d) => parseFloat(d.amount) || 0)
        .filter((a) => a > 0);
      if (amounts.length > 0) {
        const avgAmount = amounts.reduce((a, b) => a + b) / amounts.length;
        const dealAmount = parseFloat(deal.amount) || 0;

        if (dealAmount > avgAmount * 3) {
          score += 10;
          flags.push("High-value deal (concentration risk)");
        } else if (dealAmount < avgAmount * 0.25 && dealAmount > 0) {
          score += 5;
          flags.push("Low-value deal (ROI risk)");
        }
      }
    }
  }

  // Clamp score to 0-100
  score = Math.min(Math.max(score, 0), 100);

  // Determine risk level
  let level = "low";
  if (score >= 80) level = "critical";
  else if (score >= 60) level = "high";
  else if (score >= 40) level = "medium";

  return { score, level, flags };
}

/**
 * getRiskColor(level)
 *
 * Get Tailwind color class for risk level.
 */
export function getRiskColor(level) {
  const map = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };
  return map[level] || "bg-gray-100 text-gray-700";
}

/**
 * getRiskBgColor(level)
 *
 * Get background color for risk level.
 */
export function getRiskBgColor(level) {
  const map = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  };
  return map[level] || "bg-gray-500";
}
