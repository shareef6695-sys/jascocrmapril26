import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/ui/Header";
import NavigationBreadcrumbs from "../../components/ui/NavigationBreadcrumbs";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  forecastService,
  handleSupabaseError,
  userService,
} from "../../services/supabaseService";
import { formatLocalDateYMD } from "utils/dateFormat";

const TeamForecastView = ({ view }) => {
  const { company, user, userProfile } = useAuth();
  const { formatCurrency } = useCurrency();
  const [selectedCompany, setSelectedCompany] = useState(company);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [summary, setSummary] = useState(null);
  const [riskDeals, setRiskDeals] = useState([]);
  const [error, setError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedRepId, setSelectedRepId] = useState("");
  const [repBreakdown, setRepBreakdown] = useState([]);

  useEffect(() => {
    setSelectedCompany(company);
  }, [company?.id]);

  const companyId = (selectedCompany || company)?.id || null;

  const title = useMemo(() => {
    if (view === "team-pipeline-health") return "Team Pipeline Health";
    if (view === "team-risk-deals") return "Team Risk Deals";
    if (view === "rep-performance") return "Rep Performance";
    return "Team Forecast";
  }, [view]);

  const breadcrumbs = useMemo(() => {
    const items = [{ label: "Dashboard", href: "/company-dashboard" }];
    if (view === "team-pipeline-health") {
      items.push({ label: "Team Pipeline Health", href: "/management/team-pipeline-health" });
    } else if (view === "team-risk-deals") {
      items.push({ label: "Team Risk Deals", href: "/management/team-risk-deals" });
    } else if (view === "rep-performance") {
      items.push({ label: "Rep Performance", href: "/management/rep-performance" });
    } else {
      items.push({ label: "Team Forecast", href: "/management/team-forecast" });
    }
    return items;
  }, [view]);

  useEffect(() => {
    let cancelled = false;

    const loadTeam = async () => {
      if (!user?.id || !companyId) return;
      const { data } = await userService.getUserSubordinates(user.id);
      if (cancelled) return;
      const filtered =
        (data || []).filter((u) => u.company_id === companyId) || [];
      setTeamMembers(filtered);
    };

    if (
      userProfile &&
      ["team-forecast", "team-pipeline-health", "team-risk-deals", "rep-performance"].includes(
        view,
      )
    ) {
      loadTeam();
    }

    return () => {
      cancelled = true;
    };
  }, [user?.id, userProfile, view, companyId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!companyId || !user?.id) return;
      setLoading(true);
      setError(null);

      const repId = selectedRepId ? selectedRepId : null;

      try {
        if (view === "team-risk-deals") {
          const { data, error: riskError } = await forecastService.getRiskDeals({
            companyId,
            scope: "team",
            repId,
          });
          if (riskError) throw riskError;
          if (cancelled) return;
          setRiskDeals(data || []);
          setKpis(null);
          setSummary(null);
          setRepBreakdown([]);
          return;
        }

        const [
          { data: kpisData, error: kpisError },
          { data: summaryData, error: summaryError },
        ] = await Promise.all([
          forecastService.getKpis({ companyId, scope: "team", repId }),
          forecastService.getForecastSummary({ companyId, scope: "team", repId }),
        ]);

        if (kpisError) throw kpisError;
        if (summaryError) throw summaryError;
        if (cancelled) return;
        setKpis(kpisData);
        setSummary(summaryData);
        setRiskDeals([]);

        if (view === "team-forecast" || view === "rep-performance") {
          const reps = [
            {
              id: user.id,
              full_name: "Me",
              email: userProfile?.email,
            },
            ...teamMembers,
          ].filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx);

          const repResults = await Promise.all(
            reps.map(async (rep) => {
              const { data: repKpis, error: repError } =
                await forecastService.getKpis({
                  companyId,
                  scope: "team",
                  repId: rep.id,
                });
              return {
                rep,
                kpis: repError ? null : repKpis,
                error: repError ? handleSupabaseError(repError, "Failed") : null,
              };
            }),
          );

          if (!cancelled) {
            setRepBreakdown(repResults);
          }
        } else {
          setRepBreakdown([]);
        }
      } catch (e) {
        if (cancelled) return;
        setError(handleSupabaseError(e, "Failed to load team forecast data"));
        setKpis(null);
        setSummary(null);
        setRiskDeals([]);
        setRepBreakdown([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (userProfile && companyId) load();

    return () => {
      cancelled = true;
    };
  }, [companyId, user?.id, userProfile, view, selectedRepId, teamMembers]);

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    );
  }

  const companyChangeEnabled =
    userProfile.role === "admin" ||
    userProfile.role === "director" ||
    userProfile.role === "head";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onCompanyChange={companyChangeEnabled ? setSelectedCompany : undefined}
        selectedCompany={selectedCompany}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <NavigationBreadcrumbs items={breadcrumbs} />
              <div className="mt-4 flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

                {view === "rep-performance" && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Rep</label>
                    <select
                      value={selectedRepId}
                      onChange={(e) => setSelectedRepId(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Entire team</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name || m.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
                  <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ) : error ? (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-red-700 font-medium">Access / Load Error</div>
                  <div className="text-gray-700 mt-2">{error}</div>
                </div>
              ) : view === "team-risk-deals" ? (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="text-sm text-gray-600">
                      {riskDeals.length} deal{riskDeals.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Deal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Expected Close
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {riskDeals.map((d) => (
                          <tr key={d.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {d.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {d.stage}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {d.expected_close_date
                                ? formatLocalDateYMD(d.expected_close_date)
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(Number(d.amount || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="text-sm text-gray-500">Target (This Month)</div>
                      <div className="mt-2 text-xl font-semibold text-gray-900">
                        {formatCurrency(Number(kpis?.target || 0))}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="text-sm text-gray-500">Actual Sales (This Month)</div>
                      <div className="mt-2 text-xl font-semibold text-gray-900">
                        {formatCurrency(Number(kpis?.actual || 0))}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        Achievement {Math.round(Number(kpis?.achievement_pct || 0))}%
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="text-sm text-gray-500">Forecast (This Month)</div>
                      <div className="mt-2 text-xl font-semibold text-gray-900">
                        {formatCurrency(Number(kpis?.forecast || 0))}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        Gap {formatCurrency(Number(kpis?.gap_to_target || 0))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="text-sm text-gray-500">Open Pipeline Value</div>
                      <div className="mt-2 text-xl font-semibold text-gray-900">
                        {formatCurrency(Number(kpis?.pipeline_open || 0))}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        Coverage{" "}
                        {Number(kpis?.gap_to_target || 0) > 0
                          ? Math.round(
                              (Number(kpis?.pipeline_open || 0) /
                                Number(kpis?.gap_to_target || 0)) *
                                100,
                            )
                          : 0}
                        %
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="text-sm text-gray-500">Risk</div>
                      <div className="mt-2 text-xl font-semibold text-gray-900">
                        {formatCurrency(Number(kpis?.risk?.total_amount || 0))}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {Number(kpis?.risk?.deals || 0)} overdue deal
                        {Number(kpis?.risk?.deals || 0) === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  {view === "team-forecast" && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="text-sm font-semibold text-gray-900">
                          Rep Breakdown
                        </div>
                        <div className="text-xs text-gray-600">
                          Period{" "}
                          {kpis?.period_start
                            ? formatLocalDateYMD(kpis.period_start)
                            : "-"}{" "}
                          to{" "}
                          {kpis?.period_end ? formatLocalDateYMD(kpis.period_end) : "-"}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rep
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Target
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actual
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Forecast
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ach%
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Pipeline
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Risk
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {repBreakdown.map((row) => (
                              <tr key={row.rep.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {row.rep.full_name || row.rep.email || row.rep.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {formatCurrency(Number(row.kpis?.target || 0))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {formatCurrency(Number(row.kpis?.actual || 0))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {formatCurrency(Number(row.kpis?.forecast || 0))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                                  {Math.round(Number(row.kpis?.achievement_pct || 0))}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {formatCurrency(Number(row.kpis?.pipeline_open || 0))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                                  {formatCurrency(Number(row.kpis?.risk?.total_amount || 0))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="text-sm text-gray-500">This Month (Weighted)</div>
                      <div className="mt-2 text-xl font-semibold text-gray-900">
                        {formatCurrency(Number(summary?.this_month?.weighted_forecast || 0))}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {Number(summary?.this_month?.deals || 0)} deals • Pipeline{" "}
                        {formatCurrency(Number(summary?.this_month?.total_pipeline || 0))}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="text-sm text-gray-500">Next Month (Weighted)</div>
                      <div className="mt-2 text-xl font-semibold text-gray-900">
                        {formatCurrency(Number(summary?.next_month?.weighted_forecast || 0))}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {Number(summary?.next_month?.deals || 0)} deals • Pipeline{" "}
                        {formatCurrency(Number(summary?.next_month?.total_pipeline || 0))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeamForecastView;
