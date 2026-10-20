/**
 * SmartComplaintHandler - Safe UTC Date & SLA Utilities
 * Blueprint Reference: V1/M5/frontend/02_sla_countdown_timer.md
 * Role: Ensures timestamps without explicit timezone offsets (naive timestamps from DB)
 *       are parsed as UTC rather than the client browser's local timezone (preventing IST 5.5-hour skew).
 */

export function parseUtcTimestamp(ts) {
  if (!ts) return null;
  if (ts instanceof Date) {
    return isNaN(ts.getTime()) ? null : ts;
  }
  if (typeof ts === 'number') {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }
  let str = String(ts).trim();
  if (!str) return null;

  // Match ISO timestamps without trailing 'Z' or offset (+HH:mm / -HH:mm)
  // e.g., '2026-10-20T14:30:00' or '2026-10-20T14:30:00.123456' or '2026-10-20 14:30:00'
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

export function isDeadlineOverdue(deadline, refDate = new Date()) {
  const d = parseUtcTimestamp(deadline);
  if (!d) return false;
  const ref = parseUtcTimestamp(refDate) || new Date();
  return d.getTime() < ref.getTime();
}

export function calculateRemainingSeconds(deadline, refDate = new Date()) {
  const d = parseUtcTimestamp(deadline);
  if (!d) return null;
  const ref = parseUtcTimestamp(refDate) || new Date();
  return Math.floor((d.getTime() - ref.getTime()) / 1000);
}
