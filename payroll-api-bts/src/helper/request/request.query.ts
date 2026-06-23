export const getQueryString = (value: unknown): string => {
  if (Array.isArray(value)) return String(value[0] || "").trim();
  if (typeof value === "string") return value.trim();
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

export const getQueryBoolean = (value: unknown): boolean | undefined => {
  const rawValue = getQueryString(value).toLowerCase();

  if (rawValue === "true") return true;
  if (rawValue === "false") return false;

  return undefined;
};
