export const toNum = (v: any, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export const toBool = (v: any) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string")
    return ["true", "1", "yes", "on"].includes(v.toLowerCase());
  if (typeof v === "number") return v === 1;
  return !!v;
};

export const toStr = (v: any) => (v == null ? "" : String(v)).trim();

export const toArrStr = (v: any) => {
  if (Array.isArray(v)) return v.map(toStr).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
};

//

export const uniqStrings = (arr: string[]) => {
  return Array.from(new Set(arr.filter(Boolean)));
};

export const safeUpper = (x: any) => toStr(x).trim().toUpperCase();
export const safeTrim = (x: any) => toStr(x).trim();

export const parseCsv = (v: any) =>
  safeTrim(v)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export const toSlug = (name: string) =>
  String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

export const parseArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (error) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

export const isNullLike = (value: any) => {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "null" ||
    value === "undefined"
  );
};

export const toOptionalObjectId = (value: any) => {
  return isNullLike(value) ? undefined : value;
};

export const toOptionalBoolean = (value: any) => {
  if (isNullLike(value)) return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

export const toOptionalNumber = (value: any) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? NaN : num;
};

export const toOptionalString = (value: any) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return String(value).trim();
};

export const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const parseQueryList = (value: any): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const parseDateRange = (from?: string, to?: string) => {
  // from/to en formato "YYYY-MM-DD" (o ISO). Lo convertimos a Date.
  const range: any = {};
  if (from) {
    const d = new Date(from);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "from inválido" };
    // inicio del día
    d.setHours(0, 0, 0, 0);
    range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "to inválido" };
    // fin del día
    d.setHours(23, 59, 59, 999);
    range.$lte = d;
  }
  return { ok: true, range: Object.keys(range).length ? range : null };
};

export const tryParseJSON = (value: any) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (typeof value !== "string") {
    return value;
  }

  const cleanValue = value.trim();

  if (!cleanValue) {
    return value;
  }

  const firstChar = cleanValue[0];

  if (firstChar !== "{" && firstChar !== "[") {
    return value;
  }

  try {
    return JSON.parse(cleanValue);
  } catch {
    return null;
  }
};

export const parseBody = (body: any = {}, fields?: string[]) => {
  const parsedBody: any = {};

  const shouldParseField = (key: string) => {
    if (!Array.isArray(fields) || !fields.length) return true;
    return fields.includes(key);
  };

  for (const [key, value] of Object.entries(body || {})) {
    if (!shouldParseField(key)) {
      parsedBody[key] = value;
      continue;
    }

    const parsed = tryParseJSON(value);

    if (parsed === null && typeof value === "string" && value.trim()) {
      return {
        ok: false,
        key,
        data: null,
      };
    }

    parsedBody[key] = parsed;
  }

  return {
    ok: true,
    key: null,
    data: parsedBody,
  };
};

export const round2 = (n: number): number => {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
};
