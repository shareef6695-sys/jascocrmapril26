import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/ui/Header";
import NavigationBreadcrumbs from "../../components/ui/NavigationBreadcrumbs";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { forecastService, handleSupabaseError } from "../../services/supabaseService";
import { formatLocalDateYMD } from "utils/dateFormat";

const ExecutiveForecastView = ({ view }) => {
  const { company, userProfile } = useAuth();
  const { formatCurrency } = useCurrency();
  const [selectedCompany, setSelectedCompany] = useState(company);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [riskDeals, setRiskDeals] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSelectedCompany(company);
  }, [company?.id]);

  const companyId = (selectedCompany || company)?.id || null;

  const title = useMemo(() => {
    if (view === "pipeline-health") return "Company Pipeline Health";
    if (view === "forecast-snapshots") return "Forecast Snapshots";
    if (view === "risk-overview") return "Company Risk Overview";
    return "Company Forecast";
  }, [view]);

  const breadcrumbs = useMemo(() => {
    const items = [{ label: "Dashboard", href: "/company-dashboard" }];
    if (view === "pipeline-health") items.push({ label: "Pipeline Health", href: "/executive/pipeline-health" });
    else if (view === "forecast-snapshots") items.push({ label: "Forecast Snapshots", href: "/executive/forecast-snapshots" });
    else if (view === "risk-overview") items.push({ label: "Risk Overview", href: "/executive/risk-overview" });
    else items.push({ label: "Company Forecast", href: "/executive/company-forecast" });
    return items;
  }, [view]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!companyId) return;
      setLoading(true);
      setError(null);

      try {
        if (view === "forecast-snapshots") {
          if (cancelled) return;
          setSummary(null);
          setRiskDeals([]);
          return;
        }

        if (view === "risk-overview") {
          const { data, error: riskError } = await forecastService.getRiskDeals({
            companyId,
            scope: "company",
            repId: null,
          });
          if (riskError) throw riskError;
          if (cancelled) return;
          setRiskDeals(data || []);
          setSummary(null);
          return;
        }

        const { data, error: summaryError } = await forecastService.getForecastSummary({
          companyId,
          scope: "company",
          repId: null,
        });
        if (summaryError) throw summaryError;
        if (cancelled) return;
        setSummary(data);
        setRiskDeals([]);
      } catch (e) {
        if (cancelled) return;
        setError(handleSupabaseError(e, "Failed to load executive forecast data"));
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
  }, [companyId, userProfile, view]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCompanyChange={setSelectedCompany} selectedCompany={selectedCompany} />
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
                  <div className="h-4 bg-gray-200 rounded w-56 mb-4 animate-pulse"></div>
                  <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ) : error ? (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-red-700 font-medium">Access / Load Error</div>
                  <div className="text-gray-700 mt-2">{error}</div>
                </div>
              ) : view === "forecast-snapshots" ? (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-gray-900 font-semibold">Not Implemented Yet</div>
                  <div className="text-gray-700 mt-2">
                    Forecast snapshots will be added in a later step using an additive table (no changes to existing deal flows).
                  </div>
                </div>
              ) : view === "risk-overview" ? (
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
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="text-sm text-gray-500">This Month</div>
                    <div className="mt-2 text-xl font-semibold text-gray-900">
                      {formatCurrency(Number(summary?.this_month?.weighted_forecast || 0))}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {Number(summary?.this_month?.deals || 0)} deals • Pipeline{" "}
                      {formatCurrency(Number(summary?.this_month?.total_pipeline || 0))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="text-sm text-gray-500">Next Month</div>
                    <div className="mt-2 text-xl font-semibold text-gray-900">
                      {formatCurrency(Number(summary?.next_month?.weighted_forecast || 0))}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {Number(summary?.next_month?.deals || 0)} deals • Pipeline{" "}
                      {formatCurrency(Number(summary?.next_month?.total_pipeline || 0))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="text-sm text-gray-500">Pipeline</div>
                    <div className="mt-2 text-xl font-semibold text-gray-900">
                      {formatCurrency(Number(summary?.pipeline?.total_amount || 0))}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Weighted{" "}
                      {formatCurrency(Number(summary?.pipeline?.weighted_amount || 0))} •{" "}
                      {Number(summary?.pipeline?.deals || 0)} deals
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="text-sm text-gray-500">Risk</div>
                    <div className="mt-2 text-xl font-semibold text-gray-900">
                      {formatCurrency(Number(summary?.risk?.total_amount || 0))}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {Number(summary?.risk?.deals || 0)} overdue deal
                      {Number(summary?.risk?.deals || 0) === 1 ? "" : "s"}
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

export default ExecutiveForecastView;
