export function toNum(v: any, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export function normalizeHHmm(v: any): string {
  // soporta "08:00", "08:00:00", Date, etc.
  if (!v) return "";
  if (v instanceof Date) {
    const hh = String(v.getHours()).padStart(2, "0");
    const mm = String(v.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const s = String(v).trim();
  if (!s) return "";
  const parts = s.split(":");
  if (parts.length < 2) return "";
  const hh = String(parts[0]).padStart(2, "0");
  const mm = String(parts[1]).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function makeExpectedDate(dayDate: Date, hhmm: string) {
  const [hRaw, mRaw] = hhmm.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  const d = new Date(dayDate);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

export function diffMinutesRoundedUp(later: Date, earlier: Date): number {
  const ms = later.getTime() - earlier.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 60000);
}

export function formatYMD(d: Date) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
