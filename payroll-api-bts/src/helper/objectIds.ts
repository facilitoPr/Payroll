import mongoose, { Types } from "mongoose";
import { MONGO_ID_REGEX } from "../constants/payroll";

type ObjIdLike = string | Types.ObjectId;

export const getObjectIdString = (value: any): string | null => {
  if (!value) return null;

  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === "object") {
    const possibleId =
      value._id || value.id || value.value || value.$oid || null;

    if (!possibleId) return null;

    return getObjectIdString(possibleId);
  }

  const id = String(value).trim();

  if (!id) return null;
  if (id === "null") return null;
  if (id === "undefined") return null;
  if (id === "[object Object]") return null;

  /**
   * Mejor validar 24 hex exactos.
   * Así evitamos que ObjectId.isValid acepte strings raros de 12 caracteres.
   */
  const isMongoId = /^[a-fA-F0-9]{24}$/.test(id);

  if (!isMongoId) return null;

  return id;
};

export const toObjectId = (value: any): Types.ObjectId | null => {
  const id = getObjectIdString(value);

  if (!id) return null;

  return new Types.ObjectId(id);
};

export const toObjectIdOrNull = (id: ObjIdLike): Types.ObjectId | null => {
  const s = String(id);
  return Types.ObjectId.isValid(s) ? new Types.ObjectId(s) : null;
};

export const uniqObjectIds = (ids: (string | Types.ObjectId)[]) => {
  const set = new Set<string>();
  const out: Types.ObjectId[] = [];

  for (const id of ids) {
    const s = String(id);
    if (!Types.ObjectId.isValid(s)) continue;
    if (set.has(s)) continue;
    set.add(s);
    out.push(new Types.ObjectId(s));
  }
  return out;
};

export const getObjectId = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value?._id) return String(value._id);
  return String(value);
};

export const uniqueValidObjectIds = (values: any[] = []) => {
  const unique = new Set<string>();

  values.forEach((value) => {
    if (Types.ObjectId.isValid(String(value))) {
      unique.add(String(value));
    }
  });

  return Array.from(unique).map((id) => new Types.ObjectId(id));
};

export const getMongoIdString = (value: any): string | null => {
  if (!value) return null;

  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === "object") {
    const possibleId =
      value._id || value.id || value.value || value.$oid || null;

    if (!possibleId) return null;

    return getMongoIdString(possibleId);
  }

  const id = String(value).trim();

  if (!id) return null;
  if (id === "null") return null;
  if (id === "undefined") return null;
  if (id === "[object Object]") return null;

  if (!MONGO_ID_REGEX.test(id)) return null;

  return id;
};

export const uniqValidIdStrings = (values: any[] = []) => {
  const ids = new Set<string>();

  for (const value of values || []) {
    const id = getMongoIdString(value);
    if (id) ids.add(id);
  }

  return Array.from(ids);
};
