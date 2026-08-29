/**
 * CSV cell escaping with spreadsheet formula-injection neutralization.
 * Fields starting with =, +, -, @ (or leading tabs/CRs) get a leading
 * apostrophe so Excel/Sheets treat them as text, not as formulas.
 */

export function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
