import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAVY = "#1E3A5F";
const NAVY_LIGHT = "#2E5282";
const GRAY_BG = "#F5F7FA";
const GRAY_BORDER = "#D1D9E0";
const TEXT_DARK = "#1A202C";
const TEXT_MUTED = "#64748B";
const WHITE = "#FFFFFF";

const STAGE_LABELS = {
  lead: "Lead",
  contact_made: "Qualified",
  proposal_sent: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const STAGE_ORDER = ["lead", "contact_made", "proposal_sent", "negotiation", "won", "lost"];

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: TEXT_DARK,
    backgroundColor: WHITE,
    paddingBottom: 40,
  },

  // Header
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    color: WHITE,
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "#A8C4E0",
    fontSize: 10,
    marginTop: 4,
  },
  headerMeta: {
    alignItems: "flex-end",
  },
  headerMetaText: {
    color: "#A8C4E0",
    fontSize: 8,
    marginBottom: 2,
  },
  headerMetaBold: {
    color: WHITE,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  headerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: NAVY_LIGHT,
    marginTop: 16,
  },

  // Body
  body: {
    paddingHorizontal: 32,
    paddingTop: 20,
  },

  // Section
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: NAVY,
  },
  section: {
    marginBottom: 20,
  },

  // Summary cards row
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: GRAY_BG,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: NAVY,
    padding: 10,
  },
  summaryLabel: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  summarySubValue: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    marginTop: 2,
  },

  // Stage breakdown table
  stageTable: {
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    borderRadius: 4,
    overflow: "hidden",
  },
  stageTableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  stageTableHeaderText: {
    color: WHITE,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  stageTableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
  },
  stageTableRowAlt: {
    backgroundColor: GRAY_BG,
  },
  stageTableCell: {
    flex: 1,
    fontSize: 8.5,
    color: TEXT_DARK,
  },
  stageTableCellRight: {
    flex: 1,
    fontSize: 8.5,
    color: TEXT_DARK,
    textAlign: "right",
  },

  // Deals table
  dealsTable: {
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    borderRadius: 4,
    overflow: "hidden",
  },
  dealsHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  dealsHeaderText: {
    color: WHITE,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  dealsRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
    alignItems: "center",
  },
  dealsRowAlt: {
    backgroundColor: GRAY_BG,
  },
  dealCell: {
    fontSize: 8,
    color: TEXT_DARK,
  },
  dealCellMuted: {
    fontSize: 7.5,
    color: TEXT_MUTED,
  },
  stageBadge: {
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  stageBadgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: GRAY_BORDER,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7.5,
    color: TEXT_MUTED,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (amount, currency = "SAR") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const stageBadgeColor = (stage) => {
  const map = {
    lead: "#64748B",
    contact_made: "#3B82F6",
    proposal_sent: "#F59E0B",
    negotiation: "#8B5CF6",
    won: "#10B981",
    lost: "#EF4444",
  };
  return map[stage] || "#64748B";
};

const buildStageSummary = (deals) => {
  const map = {};
  for (const deal of deals) {
    const s = deal.stage || "lead";
    if (!map[s]) map[s] = { count: 0, total: 0, currency: deal.currency || "SAR" };
    map[s].count += 1;
    map[s].total += parseFloat(deal.amount || 0);
  }
  return STAGE_ORDER.filter((s) => map[s]).map((s) => ({ stage: s, ...map[s] }));
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Header = ({ companyName, dateRange }) => (
  <View style={styles.header}>
    <View style={styles.headerTop}>
      <View>
        <Text style={styles.headerTitle}>Pipeline Report</Text>
        <Text style={styles.headerSubtitle}>{companyName || "Jasco CRM"}</Text>
      </View>
      <View style={styles.headerMeta}>
        {dateRange?.start && (
          <Text style={styles.headerMetaText}>
            {fmtDate(dateRange.start)} — {fmtDate(dateRange.end)}
          </Text>
        )}
        <Text style={styles.headerMetaText}>
          Generated: {fmtDate(new Date().toISOString())}
        </Text>
      </View>
    </View>
    <View style={styles.headerDivider} />
  </View>
);

const SummaryCards = ({ deals }) => {
  const total = deals.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const won = deals.filter((d) => d.stage === "won");
  const wonValue = won.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const open = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const openValue = open.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const winRate = deals.length ? Math.round((won.length / deals.length) * 100) : 0;
  const currency = deals[0]?.currency || "SAR";

  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Pipeline</Text>
        <Text style={styles.summaryValue}>{fmt(total, currency)}</Text>
        <Text style={styles.summarySubValue}>{deals.length} deals</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Open Pipeline</Text>
        <Text style={styles.summaryValue}>{fmt(openValue, currency)}</Text>
        <Text style={styles.summarySubValue}>{open.length} deals</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Won Revenue</Text>
        <Text style={styles.summaryValue}>{fmt(wonValue, currency)}</Text>
        <Text style={styles.summarySubValue}>{won.length} deals closed</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Win Rate</Text>
        <Text style={styles.summaryValue}>{winRate}%</Text>
        <Text style={styles.summarySubValue}>of all deals</Text>
      </View>
    </View>
  );
};

const StageBreakdown = ({ deals }) => {
  const summary = buildStageSummary(deals);
  const totalValue = deals.reduce((s, d) => s + parseFloat(d.amount || 0), 0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Stage Breakdown</Text>
      <View style={styles.stageTable}>
        <View style={styles.stageTableHeader}>
          <Text style={[styles.stageTableHeaderText, { flex: 2 }]}>Stage</Text>
          <Text style={[styles.stageTableHeaderText, { textAlign: "right" }]}>Deals</Text>
          <Text style={[styles.stageTableHeaderText, { textAlign: "right" }]}>Value</Text>
          <Text style={[styles.stageTableHeaderText, { textAlign: "right" }]}>% of Total</Text>
        </View>
        {summary.map((row, i) => (
          <View
            key={row.stage}
            style={[styles.stageTableRow, i % 2 === 1 && styles.stageTableRowAlt]}
          >
            <Text style={[styles.stageTableCell, { flex: 2, fontFamily: "Helvetica-Bold" }]}>
              {STAGE_LABELS[row.stage] || row.stage}
            </Text>
            <Text style={styles.stageTableCellRight}>{row.count}</Text>
            <Text style={styles.stageTableCellRight}>{fmt(row.total, row.currency)}</Text>
            <Text style={styles.stageTableCellRight}>
              {totalValue ? Math.round((row.total / totalValue) * 100) : 0}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const DealsTable = ({ deals }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Deal Details</Text>
    <View style={styles.dealsTable}>
      <View style={styles.dealsHeader}>
        <Text style={[styles.dealsHeaderText, { flex: 3 }]}>Deal Title</Text>
        <Text style={[styles.dealsHeaderText, { flex: 2 }]}>Contact</Text>
        <Text style={[styles.dealsHeaderText, { flex: 1.5 }]}>Owner</Text>
        <Text style={[styles.dealsHeaderText, { flex: 1.5, textAlign: "right" }]}>Amount</Text>
        <Text style={[styles.dealsHeaderText, { flex: 1.5 }]}>  Stage</Text>
        <Text style={[styles.dealsHeaderText, { flex: 1.5, textAlign: "right" }]}>Close Date</Text>
      </View>
      {deals.map((deal, i) => {
        const contactName = deal.contact
          ? `${deal.contact.first_name || ""} ${deal.contact.last_name || ""}`.trim()
          : deal.contact_name || "—";
        const contactCompany = deal.contact?.company_name || "";
        const ownerName = deal.owner?.full_name || "Unassigned";
        return (
          <View
            key={deal.id || i}
            style={[styles.dealsRow, i % 2 === 1 && styles.dealsRowAlt]}
          >
            <Text style={[styles.dealCell, { flex: 3, fontFamily: "Helvetica-Bold" }]} numberOfLines={1}>
              {deal.title || "Untitled"}
            </Text>
            <View style={{ flex: 2 }}>
              <Text style={styles.dealCell} numberOfLines={1}>{contactName}</Text>
              {contactCompany ? (
                <Text style={styles.dealCellMuted} numberOfLines={1}>{contactCompany}</Text>
              ) : null}
            </View>
            <Text style={[styles.dealCell, { flex: 1.5 }]} numberOfLines={1}>{ownerName}</Text>
            <Text style={[styles.dealCell, { flex: 1.5, textAlign: "right" }]}>
              {fmt(deal.amount, deal.currency)}
            </Text>
            <View style={{ flex: 1.5, alignItems: "flex-start" }}>
              <View style={[styles.stageBadge, { backgroundColor: stageBadgeColor(deal.stage) }]}>
                <Text style={styles.stageBadgeText}>
                  {STAGE_LABELS[deal.stage] || deal.stage || "—"}
                </Text>
              </View>
            </View>
            <Text style={[styles.dealCell, { flex: 1.5, textAlign: "right" }]}>
              {fmtDate(deal.expected_close_date)}
            </Text>
          </View>
        );
      })}
    </View>
  </View>
);

const Footer = ({ companyName }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>{companyName || "Jasco CRM"} — Pipeline Report</Text>
    <Text
      style={styles.footerText}
      render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
    />
  </View>
);

// ─── Document ─────────────────────────────────────────────────────────────────

const PipelineReportPDF = ({ data = [], dateRange = {}, companyName = "" }) => (
  <Document title={`Pipeline Report — ${companyName}`} author="Jasco CRM">
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Header companyName={companyName} dateRange={dateRange} />

      <View style={styles.body}>
        <SummaryCards deals={data} />
        <StageBreakdown deals={data} />
        {data.length > 0 && <DealsTable deals={data} />}
        {data.length === 0 && (
          <Text style={{ color: TEXT_MUTED, fontSize: 10, textAlign: "center", marginTop: 40 }}>
            No deals found for the selected period.
          </Text>
        )}
      </View>

      <Footer companyName={companyName} />
    </Page>
  </Document>
);

export default PipelineReportPDF;

// ─── Download helper ──────────────────────────────────────────────────────────

/**
 * Generates and triggers a PDF download of the pipeline report.
 *
 * @param {Object} params
 * @param {Array}  params.data        - Array of deal objects
 * @param {Object} params.dateRange   - { start: string, end: string }
 * @param {string} params.companyName - Display name for the company
 * @param {string} [params.filename]  - Optional filename override (without extension)
 */
export async function handlePdfDownload({ data, dateRange, companyName, filename }) {
  const blob = await pdf(
    <PipelineReportPDF data={data} dateRange={dateRange} companyName={companyName} />
  ).toBlob();

  const name = filename || `pipeline-report-${new Date().toISOString().slice(0, 10)}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
