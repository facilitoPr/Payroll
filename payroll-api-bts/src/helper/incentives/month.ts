export function isValidMonth(ym: string) {
  return /^\d{4}-\d{2}$/.test(String(ym || "").trim());
}

export function monthToRange(ym: string) {
  // ym: YYYY-MM
  const [y, m] = ym.split("-").map((x) => Number(x));
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0, 0);
  return { start, end };
}

export function getCurrentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function isMonthInProgress(ym: string) {
  return ym === getCurrentMonth();
}

// clamp 0..100
export function clampPercent(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, v));
}

