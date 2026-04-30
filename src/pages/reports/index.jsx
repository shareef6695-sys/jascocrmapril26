import React, { useState, useEffect, useMemo } from "react";
import Header from "../../components/ui/Header";
import NavigationBreadcrumbs from "../../components/ui/NavigationBreadcrumbs";
import DateRangePicker, {
  resolveDateRange,
} from "../../components/ui/DateRangePicker";
import EmployeeSelector from "../../components/ui/EmployeeSelector";
import Icon from "../../components/AppIcon";
import { useAuth } from "../../contexts/AuthContext";
import {
  dealService,
  salesTargetService,
  activityService,
  userService,
} from "../../services/supabaseService";
import { exportToCsv, exportToExcel } from "../../utils/exportUtils";
import { handlePdfDownload } from "../../components/reports/PipelineReportPDF";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAVY = "#1E3A5F";

const TABS = [
  { id: "pipeline", label: "Pipeline", icon: "TrendingUp" },
  { id: "targets", label: "Targets", icon: "Target" },
  { id: "leaderboard", label: "Leaderboard", icon: "Award" },
  { id: "activity", label: "Activity", icon: "Activity" },
];

const STAGE_LABELS = {
  lead: "Lead",
  contact_made: "Qualified",
  proposal_sent: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const STAGE_COLORS = {
  lead: "bg-gray-100 text-gray-700",
  contact_made: "bg-blue-100 text-blue-700",
  proposal_sent: "bg-yellow-100 text-yellow-700",
  negotiation: "bg-purple-100 text-purple-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

const MANAGER_ROLES = ["manager", "head", "supervisor", "director", "admin"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (amount, currency = "SAR") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return String(d);
  }
};

const isInRange = (dateStr, resolved) => {
  if (!dateStr || resolved?.special === "all") return true;
  const d = new Date(dateStr);
  if (resolved?.startDate && d < resolved.startDate) return false;
  if (resolved?.endDate && d > resolved.endDate) return false;
  return true;
};

// ─── Flatten functions (for CSV / Excel) ─────────────────────────────────────

const flattenDeal = (d) => ({
  Title: d.title || "",
  Contact: d.contact
    ? `${d.contact.first_name || ""} ${d.contact.last_name || ""}`.trim()
    : "",
  "Contact Company": d.contact?.company_name || "",
  Stage: STAGE_LABELS[d.stage] || d.stage || "",
  Amount: d.amount || 0,
  Currency: d.currency || "SAR",
  Owner: d.owner?.full_name || d.owner?.email || "",
  "Expected Close": d.expected_close_date ? fmtDate(d.expected_close_date) : "",
  "Created Date": d.created_at ? fmtDate(d.created_at) : "",
});

const flattenTarget = (t) => ({
  Assignee: t.assignee?.full_name || t.assignee?.email || "",
  Role: t.assignee?.role || "",
  "Assigned By": t.assigner?.full_name || t.assigner?.email || "",
  "Target Amount": t.target_amount || 0,
  Currency: t.currency || "SAR",
  "Period Start": t.period_start ? fmtDate(t.period_start) : "",
  "Period End": t.period_end ? fmtDate(t.period_end) : "",
  "Target Type": t.target_type || "",
});

const flattenLeaderRow = (r) => ({
  Rank: r.rank,
  Name: r.name,
  Role: r.role,
  "Total Deals": r.total,
  "Won Deals": r.won,
  "Total Value": r.totalValue,
  "Won Value": r.wonValue,
  "Win Rate": `${r.winRate}%`,
});

const flattenActivity = (a) => ({
  Date: a.created_at ? fmtDate(a.created_at) : "",
  User: a.owner?.full_name || a.owner?.email || "",
  Type: a.type || "",
  Contact: a.contact
    ? `${a.contact.first_name || ""} ${a.contact.last_name || ""}`.trim()
    : "",
  Deal: a.deal?.title || "",
  Description: a.description || a.notes || "",
});

// ─── Table primitives ─────────────────────────────────────────────────────────

const Th = ({ children, right }) => (
  <th
    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200 whitespace-nowrap ${
      right ? "text-right" : "text-left"
    }`}
  >
    {children}
  </th>
);

const Td = ({ children, right, muted }) => (
  <td
    className={`px-4 py-3 text-sm border-b border-gray-100 ${
      right ? "text-right" : ""
    } ${muted ? "text-gray-400" : "text-gray-800"}`}
  >
    {children}
  </td>
);

// ─── Preview tables ───────────────────────────────────────────────────────────

const PipelineTable = ({ deals }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr>
          <Th>Deal</Th>
          <Th>Contact</Th>
          <Th>Stage</Th>
          <Th right>Amount</Th>
          <Th>Owner</Th>
          <Th right>Close Date</Th>
          <Th right>Created</Th>
        </tr>
      </thead>
      <tbody>
        {deals.map((d, i) => (
          <tr key={d.id || i} className="hover:bg-gray-50 transition-colors">
            <Td>
              <span className="font-medium">{d.title || "Untitled"}</span>
            </Td>
            <Td>
              <div>
                {d.contact
                  ? `${d.contact.first_name || ""} ${d.contact.last_name || ""}`.trim() || "—"
                  : "—"}
              </div>
              {d.contact?.company_name && (
                <div className="text-xs text-gray-400">{d.contact.company_name}</div>
              )}
            </Td>
            <Td>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  STAGE_COLORS[d.stage] || "bg-gray-100 text-gray-700"
                }`}
              >
                {STAGE_LABELS[d.stage] || d.stage || "—"}
              </span>
            </Td>
            <Td right>
              <span className="font-medium tabular-nums">
                {fmt(d.amount, d.currency)}
              </span>
            </Td>
            <Td>{d.owner?.full_name || "—"}</Td>
            <Td right muted={!d.expected_close_date}>
              {fmtDate(d.expected_close_date)}
            </Td>
            <Td right muted>
              {fmtDate(d.created_at)}
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TargetsTable = ({ targets }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr>
          <Th>Assignee</Th>
          <Th>Assigned By</Th>
          <Th>Type</Th>
          <Th right>Target Amount</Th>
          <Th>Period Start</Th>
          <Th>Period End</Th>
        </tr>
      </thead>
      <tbody>
        {targets.map((t, i) => (
          <tr key={t.id || i} className="hover:bg-gray-50 transition-colors">
            <Td>
              <div className="font-medium">
                {t.assignee?.full_name || t.assignee?.email || "—"}
              </div>
              <div className="text-xs text-gray-400 capitalize">
                {t.assignee?.role || ""}
              </div>
            </Td>
            <Td>{t.assigner?.full_name || t.assigner?.email || "—"}</Td>
            <Td>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                {t.target_type || "—"}
              </span>
            </Td>
            <Td right>
              <span className="font-medium tabular-nums">
                {fmt(t.target_amount, t.currency)}
              </span>
            </Td>
            <Td muted>{fmtDate(t.period_start)}</Td>
            <Td muted>{fmtDate(t.period_end)}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const LeaderboardTable = ({ rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr>
          <Th>Rank</Th>
          <Th>Name</Th>
          <Th>Role</Th>
          <Th right>Total Deals</Th>
          <Th right>Won Deals</Th>
          <Th right>Won Value</Th>
          <Th right>Win Rate</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-gray-50 transition-colors">
            <Td>
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                  r.rank === 1
                    ? "bg-yellow-100 text-yellow-700"
                    : r.rank === 2
                    ? "bg-gray-200 text-gray-600"
                    : r.rank === 3
                    ? "bg-orange-100 text-orange-600"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                {r.rank}
              </span>
            </Td>
            <Td>
              <span className="font-medium">{r.name}</span>
            </Td>
            <Td>
              <span className="text-xs capitalize text-gray-500">{r.role}</span>
            </Td>
            <Td right>{r.total}</Td>
            <Td right>{r.won}</Td>
            <Td right>
              <span className="font-medium tabular-nums">{fmt(r.wonValue)}</span>
            </Td>
            <Td right>
              <span
                className={`font-medium ${
                  r.winRate >= 50
                    ? "text-green-600"
                    : r.winRate >= 25
                    ? "text-yellow-600"
                    : "text-red-500"
                }`}
              >
                {r.winRate}%
              </span>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ActivityTable = ({ activities }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr>
          <Th>Date</Th>
          <Th>User</Th>
          <Th>Type</Th>
          <Th>Contact</Th>
          <Th>Deal</Th>
          <Th>Description</Th>
        </tr>
      </thead>
      <tbody>
        {activities.map((a, i) => (
          <tr key={a.id || i} className="hover:bg-gray-50 transition-colors">
            <Td muted>{fmtDate(a.created_at)}</Td>
            <Td>{a.owner?.full_name || a.owner?.email || "—"}</Td>
            <Td>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 capitalize">
                {a.type || "—"}
              </span>
            </Td>
            <Td>
              {a.contact
                ? `${a.contact.first_name || ""} ${a.contact.last_name || ""}`.trim() || "—"
                : "—"}
            </Td>
            <Td>{a.deal?.title || "—"}</Td>
            <Td>
              <span className="text-gray-600 line-clamp-1 max-w-xs block">
                {a.description || a.notes || "—"}
              </span>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-24 text-gray-400">
    <Icon name="FileX" size={40} className="mb-3 opacity-40" />
    <p className="text-sm font-medium">No data for the selected filters</p>
    <p className="text-xs mt-1">Try adjusting the date range or employee filter</p>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ReportsPage = () => {
  const { company, user, userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState("pipeline");
  const [dateRange, setDateRange] = useState("");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Raw data per tab
  const [deals, setDeals] = useState([]);
  const [targets, setTargets] = useState([]);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const isManager = MANAGER_ROLES.includes(userProfile?.role);

  // ── Load subordinates for employee selector ────────────────────────────────
  useEffect(() => {
    if (!company?.id || !isManager || !userProfile?.id) return;
    userService
      .getUserSubordinates(userProfile.id)
      .then(({ data }) => setEmployees(data || []));
  }, [company?.id, userProfile?.id, isManager]);

  // ── Load data when tab or company changes ──────────────────────────────────
  useEffect(() => {
    if (!company?.id) return;
    loadTabData();
  }, [company?.id, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === "pipeline" || activeTab === "leaderboard") {
        const { data } = await dealService.getDeals(
          company.id,
          { viewAll: isManager },
          isManager ? null : user?.id
        );
        setDeals(data || []);
      } else if (activeTab === "targets") {
        const { data } = isManager
          ? await salesTargetService.getAssignedTargets(company.id)
          : await salesTargetService.getMyTargets(company.id, user?.id);
        setTargets(data || []);
      } else if (activeTab === "activity") {
        const { data } = await activityService.getAllActivities(company.id, {
          pageSize: 500,
        });
        setActivities(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Client-side filtering ──────────────────────────────────────────────────
  const resolved = useMemo(
    () => resolveDateRange(dateRange, customRange),
    [dateRange, customRange]
  );

  const filteredDeals = useMemo(() => {
    let rows = deals;
    if (selectedEmployee)
      rows = rows.filter((d) => d.owner_id === selectedEmployee.id);
    return rows.filter((d) =>
      isInRange(d.expected_close_date || d.created_at, resolved)
    );
  }, [deals, selectedEmployee, resolved]);

  const filteredTargets = useMemo(() => {
    let rows = targets;
    if (selectedEmployee)
      rows = rows.filter((t) => t.assigned_to === selectedEmployee.id);
    return rows.filter((t) => isInRange(t.period_start, resolved));
  }, [targets, selectedEmployee, resolved]);

  const filteredActivities = useMemo(() => {
    let rows = activities;
    if (selectedEmployee)
      rows = rows.filter(
        (a) =>
          a.owner_id === selectedEmployee.id ||
          a.user_id === selectedEmployee.id
      );
    return rows.filter((a) => isInRange(a.created_at, resolved));
  }, [activities, selectedEmployee, resolved]);

  // Leaderboard is derived from the (already filtered) deals
  const leaderboard = useMemo(() => {
    const map = {};
    for (const d of filteredDeals) {
      if (!d.owner_id) continue;
      if (!map[d.owner_id]) {
        map[d.owner_id] = {
          id: d.owner_id,
          name: d.owner?.full_name || d.owner?.email || "Unknown",
          role: d.owner?.role || "",
          total: 0,
          won: 0,
          totalValue: 0,
          wonValue: 0,
        };
      }
      map[d.owner_id].total += 1;
      map[d.owner_id].totalValue += parseFloat(d.amount || 0);
      if (d.stage === "won") {
        map[d.owner_id].won += 1;
        map[d.owner_id].wonValue += parseFloat(d.amount || 0);
      }
    }
    return Object.values(map)
      .map((r) => ({
        ...r,
        winRate: r.total ? Math.round((r.won / r.total) * 100) : 0,
      }))
      .sort((a, b) => b.wonValue - a.wonValue)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [filteredDeals]);

  // ── Active data for row count & export ────────────────────────────────────
  const activeData = useMemo(() => {
    if (activeTab === "pipeline") return filteredDeals;
    if (activeTab === "targets") return filteredTargets;
    if (activeTab === "leaderboard") return leaderboard;
    return filteredActivities;
  }, [activeTab, filteredDeals, filteredTargets, filteredActivities, leaderboard]);

  // ── Export ─────────────────────────────────────────────────────────────────
  const getFilename = () =>
    `${activeTab}-report-${new Date().toISOString().slice(0, 10)}`;

  const getFlatData = () => {
    if (activeTab === "pipeline") return filteredDeals.map(flattenDeal);
    if (activeTab === "targets") return filteredTargets.map(flattenTarget);
    if (activeTab === "leaderboard") return leaderboard.map(flattenLeaderRow);
    return filteredActivities.map(flattenActivity);
  };

  const handleCsvExport = () => exportToCsv(getFlatData(), getFilename());

  const handleExcelExport = () =>
    exportToExcel(
      [
        {
          name: TABS.find((t) => t.id === activeTab)?.label || activeTab,
          data: getFlatData(),
        },
      ],
      getFilename()
    );

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await handlePdfDownload({
        data: filteredDeals,
        dateRange:
          resolved?.special === "all"
            ? {}
            : {
                start: resolved?.startDate?.toISOString(),
                end: resolved?.endDate?.toISOString(),
              },
        companyName: company?.name || "",
        filename: getFilename(),
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDateChange = (val, cr) => {
    setDateRange(val);
    setCustomRange(cr);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="p-6 max-w-screen-2xl mx-auto">
        {/* Page header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <NavigationBreadcrumbs
              items={[
                { label: "Dashboard", href: "/company-dashboard" },
                { label: "Reports", href: "/reports" },
              ]}
            />
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Preview and export pipeline, targets, leaderboard, and activity
              data
            </p>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCsvExport}
              disabled={activeData.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="FileText" size={15} />
              CSV
            </button>
            <button
              onClick={handleExcelExport}
              disabled={activeData.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="Table" size={15} />
              Excel
            </button>
            <button
              onClick={handlePdf}
              disabled={
                activeTab !== "pipeline" ||
                filteredDeals.length === 0 ||
                pdfLoading
              }
              title={
                activeTab !== "pipeline"
                  ? "PDF export is available on the Pipeline tab"
                  : undefined
              }
              style={{ backgroundColor: NAVY }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {pdfLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Icon name="FileDown" size={15} />
              )}
              PDF
            </button>
          </div>
        </div>

        {/* Card: tabs + filters + table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center border-b border-gray-200 px-4 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "text-[#1E3A5F] border-[#1E3A5F]"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon name={tab.icon} size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <DateRangePicker
              value={dateRange}
              customRange={customRange}
              onChange={handleDateChange}
              className="w-56"
              placeholder="All Time"
            />
            {isManager && (
              <EmployeeSelector
                employees={employees}
                selectedEmployee={selectedEmployee}
                onEmployeeChange={setSelectedEmployee}
                currentUserId={user?.id}
                showAllOption
                className="w-64"
              />
            )}
            <span className="ml-auto text-sm text-gray-400 tabular-nums">
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  Loading…
                </span>
              ) : (
                `${activeData.length} row${activeData.length !== 1 ? "s" : ""}`
              )}
            </span>
          </div>

          {/* Preview table */}
          {loading ? (
            <div className="flex items-center justify-center py-28">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: NAVY, borderTopColor: "transparent" }}
              />
            </div>
          ) : activeData.length === 0 ? (
            <EmptyState />
          ) : activeTab === "pipeline" ? (
            <PipelineTable deals={filteredDeals} />
          ) : activeTab === "targets" ? (
            <TargetsTable targets={filteredTargets} />
          ) : activeTab === "leaderboard" ? (
            <LeaderboardTable rows={leaderboard} />
          ) : (
            <ActivityTable activities={filteredActivities} />
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
