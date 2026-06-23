import moment from "moment";

export const hmsFromSec = (sec = 0) => {
  const s = Math.max(0, Math.floor(sec));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

export const hmsToSec = (s: any): number => {
  if (s == null) return 0;
  const str = String(s).trim();
  if (!str) return 0;
  const parts = str.includes(":") ? str.split(":") : [str];
  let acc = 0;
  for (const p of parts) {
    const n = parseInt(String(p).trim(), 10);
    acc = acc * 60 + (Number.isFinite(n) ? n : 0);
  }
  return acc;
};

export const fmtHHmm = (d: Date) => moment(d).format("HH:mm");

export const formatYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const formatDateYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getYMD = (v: any): string => {
  if (!v) return "";
  const m = moment(v);
  if (m.isValid()) return m.format("YYYY-MM-DD");
  return String(v).slice(0, 10);
};