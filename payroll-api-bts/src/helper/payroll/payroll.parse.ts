import moment from "moment";

export const parseExpectedMomentLocal = (ymd: string, expectedTime: string) => {
  const t = String(expectedTime || "").trim();
  const formats = ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm"];
  return moment(`${ymd} ${t}`, formats, true);
};

export const normalizeExpectedTimeLocal = (t: any) => {
  const raw = t ? String(t).trim() : "";
  if (!raw) return null;
  const ok =
    moment(raw, "HH:mm", true).isValid() ||
    moment(raw, "HH:mm:ss", true).isValid();
  if (!ok) return null;
  const m = moment(raw, ["HH:mm:ss", "HH:mm"], true);
  return m.isValid() ? m.format("HH:mm") : null;
};

export const parseHHmmToMinutes = (hhmm?: string): number | null => {
  if (!hhmm || typeof hhmm !== "string") return null;
  const m = moment(hhmm, "HH:mm", true);
  if (!m.isValid()) return null;
  return m.hours() * 60 + m.minutes();
};

export const parseExpectedMoment = (dateStr: string, expectedTime: string) => {
  const t = String(expectedTime || "").trim();
  const formats = ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm"];
  return moment(`${dateStr} ${t}`, formats, true);
};

export const normalizeExpectedTime = (t: any) => {
  const raw = t ? String(t).trim() : "";
  if (!raw) return null;

  const ok =
    moment(raw, "HH:mm", true).isValid() ||
    moment(raw, "HH:mm:ss", true).isValid();

  if (!ok) return null;

  // Normalizamos a HH:mm (consistente con el resto)
  const m = moment(raw, ["HH:mm:ss", "HH:mm"], true);
  return m.isValid() ? m.format("HH:mm") : null;
}

export const normalizeDateKey = (value?: string) => {
  if (!value) return "";

  const parsed = moment(value, "YYYY-MM-DD", true);

  if (!parsed.isValid()) return "";

  return parsed.format("YYYY-MM-DD");
};

export function parseISODateToYMD(dateStr: string) {
  // acepta "YYYY-MM-DD" o "YYYY/MM/DD"
  return String(dateStr || "").replace(/\//g, "-");
}
