import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/ui/Header";
import NavigationBreadcrumbs from "../../components/ui/NavigationBreadcrumbs";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { forecastService, handleSupabaseError } from "../../services/supabaseService";
import { formatLocalDateYMD } from "utils/dateFormat";

const MyForecastView = ({ view }) => {
  const { company, user, userProfile } = useAuth();
  const { formatCurrency } = useCurrency();
  const [selectedCompany, setSelectedCompany] = useState(company);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [summary, setSummary] = useState(null);
  const [riskDeals, setRiskDeals] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSelectedCompany(company);
  }, [company?.id]);

  const companyId = (selectedCompany || company)?.id || null;

  const title = useMemo(() => {
    if (view === "pipeline-health") return "My Pipeline Health";
    if (view === "risk-deals") return "My Risk Deals";
    return "My Forecast";
  }, [view]);

  const breadcrumbs = useMemo(() => {
    const items = [{ label: "Dashboard", href: "/company-dashboard" }];
    if (view === "pipeline-health") items.push({ label: "My Pipeline Health", href: "/my-pipeline-health" });
    else if (view === "risk-deals") items.push({ label: "My Risk Deals", href: "/my-risk-deals" });
    else items.push({ label: "My Forecast", href: "/my-forecast" });
    return items;
  }, [view]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!companyId || !user?.id) return;
      setLoading(true);
      setError(null);

      try {
        if (view === "risk-deals") {
          const { data, error: riskError } = await forecastService.getRiskDeals({
            companyId,
            scope: "own",
            repId: user.id,
          });
          if (riskError) throw riskError;
          if (cancelled) return;
          setRiskDeals(data || []);
          setKpis(null);
          setSummary(null);
          return;
        }

        const [{ data: kpisData, error: kpisError }, { data: summaryData, error: summaryError }] =
          await Promise.all([
            forecastService.getKpis({ companyId, scope: "own", repId: user.id }),
            forecastService.getForecastSummary({ companyId, scope: "own", repId: user.id }),
          ]);

        if (kpisError) throw kpisError;
        if (summaryError) throw summaryError;
        if (cancelled) return;
        setKpis(kpisData);
        setSummary(summaryData);
        setRiskDeals([]);
      } catch (e) {
        if (cancelled) return;
        setError(handleSupabaseError(e, "Failed to load forecast data"));
        setKpis(null);
        setSummary(null);
        setRiskDeals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (userProfile && companyId) load();

    return () => {
      cancelled = true;
    };
  }, [companyId, user?.id, userProfile, view]);

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

  if (
    !companyId &&
    userProfile.role !== "admin" &&
    userProfile.role !== "director" &&
    userProfile.role !== "head"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Company Found
          </h2>
          <p className="text-gray-600">
            Please contact your administrator to assign you to a company.
          </p>
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
              <div className="mt-4">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              </div>

              {loading ? (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
                  <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ) : error ? (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-red-700 font-medium">Access / Load Error</div>
                  <div className="text-gray-700 mt-2">{error}</div>
                </div>
              ) : view === "risk-deals" ? (
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
                      <div className="text-sm text-gray-500">Gap to Target</div>
                      <div className="mt-2 text-xl font-semibold text-gray-900">
                        {formatCurrency(Number(kpis?.gap_to_target || 0))}
                      </div>
                    </div>
                  </div>

                  {view === "pipeline-health" ? (
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
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="text-sm text-gray-500">Forecast (This Month)</div>
                        <div className="mt-2 text-xl font-semibold text-gray-900">
                          {formatCurrency(Number(kpis?.forecast || 0))}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          Period{" "}
                          {kpis?.period_start ? formatLocalDateYMD(kpis.period_start) : "-"}{" "}
                          to {kpis?.period_end ? formatLocalDateYMD(kpis.period_end) : "-"}
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="text-sm text-gray-500">Open Pipeline Value</div>
                        <div className="mt-2 text-xl font-semibold text-gray-900">
                          {formatCurrency(Number(kpis?.pipeline_open || 0))}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          Risk {Number(kpis?.risk?.deals || 0)} deal
                          {Number(kpis?.risk?.deals || 0) === 1 ? "" : "s"}
                        </div>
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

export default MyForecastView;
