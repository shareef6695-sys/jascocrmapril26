import React, { useEffect, useState, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Icon from "../../../components/AppIcon";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { useAuth } from "../../../contexts/AuthContext";
import { dealService } from "../../../services/supabaseService";
import { buildForecast } from "../../../utils/forecastEngine";
import { isSalesRepRole } from "../../../permissions/forecastAccess";

// ─── Chart helpers ────────────────────────────────────────────────────────────

const ACTUAL_COLOR = "#3B82F6";    // blue-500   — historical won revenue
const PIPELINE_COLOR = "#E2E8F0";  // slate-200  — total pipeline capacity
const WEIGHTED_COLOR = "#10B981";  // emerald-500 — probability-weighted line
const CURRENT_COLOR = "#F59E0B";   // amber-500  — current-month highlight

const compactNum = (v) => {
  if (v === null || v === undefined) return "";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

const CustomTooltip = ({ active, payload, label, formatCurrency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: p.color }}
            />
            {p.name}
          </span>
          <span className="font-medium text-gray-800">
            {formatCurrency(p.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="bg-card border border-border rounded-lg p-6 enterprise-shadow animate-pulse">
    <div className="flex items-center justify-between mb-6">
      <div className="h-5 w-32 bg-muted rounded" />
      <div className="h-5 w-5 bg-muted rounded" />
    </div>
    <div className="h-40 bg-muted rounded mb-6" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
    </div>
  </div>
);

// ─── Summary card ─────────────────────────────────────────────────────────────

const MonthCard = ({ title, data, accentColor, formatCurrency }) => (
  <div className="border border-border rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-medium text-card-foreground">{title}</h4>
      <span className="text-xs text-muted-foreground">
        {data.deals} deal{data.deals !== 1 ? "s" : ""}
      </span>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Weighted Forecast</span>
        <span className={`text-sm font-semibold`} style={{ color: accentColor }}>
          {formatCurrency(data.weighted)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Total Pipeline</span>
        <span className="text-sm text-card-foreground">
          {formatCurrency(data.pipeline)}
        </span>
      </div>
    </div>
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Confidence</span>
        <span>{data.confidence}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="rounded-full h-2 transition-all duration-500"
          style={{
            width: `${Math.min(data.confidence, 100)}%`,
            backgroundColor: accentColor,
          }}
        />
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const SalesForecast = ({ scopeUserIds = null, targetAmount = null }) => {
  const { user, userProfile, company } = useAuth();
  const { formatCurrency } = useCurrency();

  const [rawDeals, setRawDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isStaff = isSalesRepRole(userProfile?.role);
  const scopeKey = scopeUserIds ? scopeUserIds.slice().sort().join(",") : "";

  useEffect(() => {
    if (!company?.id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      let opts = {};
      if (scopeUserIds && scopeUserIds.length > 0) {
        opts = { userIds: scopeUserIds };
      } else if (isStaff) {
        opts = { userId: user?.id };
      } else {
        opts = { viewAll: true };
      }

      const { data, error: err } = await dealService.getForecastData(company.id, opts);
      if (!cancelled) {
        if (err) setError(err.message || "Failed to load forecast data");
        else setRawDeals(data || []);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, user?.id, isStaff, scopeKey]);

  const forecast = useMemo(() => buildForecast(rawDeals), [rawDeals]);

  // Calculate category-based forecast summaries
  const categorySummary = useMemo(() => {
    const openDeals = rawDeals.filter((d) => !["won", "lost"].includes(d.stage));

    const categories = {
      commit: { total: 0, weighted: 0, count: 0 },
      best_case: { total: 0, weighted: 0, count: 0 },
      upside: { total: 0, weighted: 0, count: 0 },
    };

    openDeals.forEach((deal) => {
      const cat = deal.forecast_category || "best_case";
      const amount = parseFloat(deal.amount) || 0;
      const weight = (forecast.summary && forecast.summary.weightedTotal > 0)
        ? (amount / forecast.summary.totalPipeline) * forecast.summary.weightedTotal / forecast.summary.totalPipeline
        : 0;

      if (categories[cat]) {
        categories[cat].total += amount;
        categories[cat].weighted += amount * 0.75; // Simplified weight
        categories[cat].count += 1;
      }
    });

    return categories;
  }, [rawDeals, forecast]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 enterprise-shadow">
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
          <Icon name="AlertCircle" size={20} className="text-warning" />
          <p className="text-sm">Could not load forecast data</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  const { chartData, thisMonth, nextMonth, summary, growthPct } = forecast;
  const currentMonthLabel = chartData.find((d) => d.isCurrent)?.label;

  return (
    <div className="bg-card border border-border rounded-lg p-6 enterprise-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Sales Forecast
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {summary.openDeals} open deal{summary.openDeals !== 1 ? "s" : ""} ·{" "}
            {summary.winRate}% historical win rate
          </p>
        </div>
        <Icon name="TrendingUp" size={20} className="text-accent" />
      </div>

      {/* Projection chart */}
      {rawDeals.length > 0 ? (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={compactNum}
                width={40}
              />
              <Tooltip
                content={
                  <CustomTooltip formatCurrency={formatCurrency} />
                }
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />

              {/* Dashed reference line at current month */}
              {currentMonthLabel && (
                <ReferenceLine
                  x={currentMonthLabel}
                  stroke={CURRENT_COLOR}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{
                    value: "Today",
                    position: "insideTopRight",
                    fontSize: 10,
                    fill: CURRENT_COLOR,
                  }}
                />
              )}

              {/* Pipeline capacity — background bar for current/future */}
              <Bar
                dataKey="pipeline"
                name="Pipeline"
                fill={PIPELINE_COLOR}
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              />

              {/* Historical won revenue */}
              <Bar
                dataKey="actual"
                name="Won Revenue"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isCurrent ? CURRENT_COLOR : ACTUAL_COLOR}
                  />
                ))}
              </Bar>

              {/* Weighted forecast line — spans both past and future */}
              <Line
                type="monotone"
                dataKey="weighted"
                name="Weighted Forecast"
                stroke={WEIGHTED_COLOR}
                strokeWidth={2}
                dot={{ r: 3, fill: WEIGHTED_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 mb-6 text-muted-foreground">
          <Icon name="BarChart2" size={28} className="opacity-30 mb-2" />
          <p className="text-sm">No deals in the forecast window</p>
        </div>
      )}

      {/* This Month / Next Month cards */}
      <div className="space-y-4">
        <MonthCard
          title="This Month"
          data={thisMonth}
          accentColor={WEIGHTED_COLOR}
          formatCurrency={formatCurrency}
        />
        <MonthCard
          title="Next Month"
          data={nextMonth}
          accentColor="#6366F1"
          formatCurrency={formatCurrency}
        />
      </div>

      {/* Target attainment — only shown when a target is passed in */}
      {targetAmount > 0 && (() => {
        const won = summary.weightedTotal;
        const pct = Math.round((won / targetAmount) * 100);
        const onTrack = pct >= 75;
        return (
          <div className="mt-4 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-card-foreground">Target Attainment</span>
              <span className="text-sm font-semibold" style={{ color: onTrack ? WEIGHTED_COLOR : "#F59E0B" }}>
                {pct}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="rounded-full h-2 transition-all duration-500"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: onTrack ? WEIGHTED_COLOR : "#F59E0B" }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(won)} won</span>
              <span>Target: {formatCurrency(targetAmount)}</span>
            </div>
          </div>
        );
      })()}

      {/* Category Summary — Commit / Best Case / Upside breakdown */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-card-foreground">Commit</span>
            <span className="text-xs text-muted-foreground">{categorySummary.commit.count}</span>
          </div>
          <div className="text-sm font-semibold text-green-600">
            {formatCurrency(categorySummary.commit.total)}
          </div>
        </div>

        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-card-foreground">Best Case</span>
            <span className="text-xs text-muted-foreground">{categorySummary.best_case.count}</span>
          </div>
          <div className="text-sm font-semibold text-blue-600">
            {formatCurrency(categorySummary.best_case.total)}
          </div>
        </div>

        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-card-foreground">Upside</span>
            <span className="text-xs text-muted-foreground">{categorySummary.upside.count}</span>
          </div>
          <div className="text-sm font-semibold text-purple-600">
            {formatCurrency(categorySummary.upside.total)}
          </div>
        </div>
      </div>

      {/* Growth indicator */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {growthPct >= 0 ? (
              <>
                <Icon name="TrendingUp" size={16} className="text-success" />
                <span className="text-success font-medium">
                  +{growthPct}% growth expected
                </span>
              </>
            ) : (
              <>
                <Icon name="TrendingDown" size={16} className="text-warning" />
                <span className="text-warning font-medium">
                  {growthPct}% decline expected
                </span>
              </>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            Weighted: {formatCurrency(summary.weightedTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesForecast;
