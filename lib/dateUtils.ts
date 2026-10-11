/**
 * Deterministic date and time formatters that produce identical output on both
 * server (Node.js) and client (browser) regardless of user locale or timezone,
 * preventing React hydration mismatches.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function formatDisplayDate(dateString?: string | null): string {
  if (!dateString) return 'Bulk CSV';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);
  const month = MONTHS[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

export function formatDisplayTime(dateString?: string | null): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds} UTC`;
}

export function formatDisplayDateTime(dateString?: string | null): string {
  if (!dateString) return 'Not provided in dataset';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);
  const month = MONTHS[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} ${hours}:${minutes} UTC`;
}

/**
 * Deterministic integer and decimal number formatting without locale dependence,
 * preventing SSR/client comma vs dot hydration differences.
 */
export function formatDisplayNumber(num: number | string): string {
  if (num === null || num === undefined) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  const parts = String(n).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
