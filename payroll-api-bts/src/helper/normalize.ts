import { isValidObjectId } from "mongoose";

export const parseBoolean = (value: any): boolean => {
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();

  return ["true", "1", "yes", "on"].includes(normalized);
};

export const normalizeNullableString = (value: any) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized === "" ? "" : normalized;
};

export const normalizeNullableEnum = (value: any) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized === "" ? null : normalized;
};

export const normalizeNullableNumber = (value: any) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized === "" ? null : Number(normalized);
};

export const normalizeNullableDate = (value: any) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized === "" ? null : new Date(normalized);
};

export const normalizeCode = (value: string) => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
};

export const normalizeObjectIdArray = (value: any): string[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((item) => isValidObjectId(item));
};

export const normalizeArrayBody = (raw: any): string[] => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .flatMap((value) => String(value).split(","))
      .map((status) => status.trim().toUpperCase())
      .filter(Boolean);
  }

  return String(raw)
    .split(",")
    .map((status) => status.trim().toUpperCase())
    .filter(Boolean);
};


export const normalizeBoolean = (value: any, defaultValue = false) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
};

export const normalizeProductConfig = (
  raw: any,
  source: "LOCAL" | "PRINCIPAL_API",
) => {
  if (!raw) return null;

  const obj = typeof raw?.toObject === "function" ? raw.toObject() : raw;

  return {
    ...obj,
    _source: source,
  };
};

export const normalizeStringArray = (value: any) => {
  const values = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((item) => item.trim());

  return Array.from(
    new Set(values.map((item) => String(item || "").trim()).filter(Boolean)),
  );
};