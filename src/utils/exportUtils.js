import * as XLSX from "xlsx";

/**
 * Export multiple sheets to an Excel (.xlsx) file with auto-sized columns.
 *
 * @param {Array<{ name: string, data: Array<Object> }>} sheets
 * @param {string} filename - without extension
 */
export function exportToExcel(sheets, filename = "export") {
  const workbook = XLSX.utils.book_new();

  for (const { name, data } of sheets) {
    if (!Array.isArray(data) || data.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([[]]);
      XLSX.utils.book_append_sheet(workbook, ws, name);
      continue;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns based on max content width per column
    const headers = Object.keys(data[0]);
    const colWidths = headers.map((header) => {
      const maxDataLen = data.reduce((max, row) => {
        const val = row[header] == null ? "" : String(row[header]);
        return Math.max(max, val.length);
      }, 0);
      return { wch: Math.max(header.length, maxDataLen) + 2 };
    });
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export an array of objects to a CSV file.
 *
 * @param {Array<Object>} data
 * @param {string} filename - without extension
 */
export function exportToCsv(data, filename = "export") {
  if (!Array.isArray(data) || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const escape = (val) => {
    const str = val == null ? "" : String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const rows = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
