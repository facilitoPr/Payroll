import { FilterQuery, Types } from "mongoose";
import { monthToRange } from "../../../helper/incentives/month";

/**
 * ⚠️ AJUSTA ESTOS IMPORTS A TUS MODELOS REALES
 * Ej:
 * import Reminders from "../../model/reminders";
 */
const Reminders: any = null;

/**
 * Construye filtro mensual usando:
 * - dateField string tipo "YYYY-MM-DD" => regex ^YYYY-MM-
 * - dateField Date => rango [start, end)
 *
 * Si no estás seguro, usa string (regex) y guarda tus fechas como "YYYY-MM-DD".
 */
function buildMonthFilter(
  month: string,
  dateField: string,
  dateFieldType?: "string_ymd" | "date",
) {
  if (dateFieldType === "date") {
    const { start, end } = monthToRange(month);
    return { [dateField]: { $gte: start, $lt: end } };
  }
  // default string: "YYYY-MM-DD"
  return { [dateField]: { $regex: `^${month}-` } };
}

/**
 * Filtros genéricos para marks/status/etc.
 * AJUSTA a tus campos:
 * - marks: array de string (ej: ["REAGENDAR"])
 * - statusCode: string (ej: "ATTENDED")
 */
function applyGenericFilters(base: any, filters: any) {
  const q: any = { ...base };

  if (!filters) return q;

  // marks exactos o "contiene alguno"
  if (Array.isArray(filters.marksAnyOf) && filters.marksAnyOf.length) {
    q.marks = { $in: filters.marksAnyOf };
  }

  // marks vacío o inexistente
  if (filters.marksEmptyOrMissing) {
    q.$or = [
      { marks: { $exists: false } },
      { marks: { $size: 0 } },
      { marks: null },
    ];
  }

  // status anyOf (ATTENDED, IMPACTED, etc.)
  if (Array.isArray(filters.statusAnyOf) && filters.statusAnyOf.length) {
    // AJUSTA: aquí asumo campo statusCode
    q.statusCode = { $in: filters.statusAnyOf };
  }

  // filtro extra libre (match Mongo directo)
  if (filters.raw && typeof filters.raw === "object") {
    Object.assign(q, filters.raw);
  }

  return q;
}

export async function countRemindersForUser(args: {
  month: string;
  userId: Types.ObjectId;
  dateField: string;
  dateFieldType?: "string_ymd" | "date";
  filters?: any;
}) {
  if (!Reminders) {
    throw new Error(
      "Reminders model no está configurado en reminders.datasource.ts",
    );
  }

  const { month, userId, dateField, dateFieldType, filters } = args;

  let q: FilterQuery<any> = {
    createdBy: userId, // AJUSTA: si tu campo es createdByOperator / operator / user
    isDeleted: false, // si aplica
  };

  q = { ...q, ...buildMonthFilter(month, dateField, dateFieldType) };
  q = applyGenericFilters(q, filters);

  return Reminders.countDocuments(q);
}

export async function countRemindersForUsers(args: {
  month: string;
  userIds: Types.ObjectId[];
  dateField: string;
  dateFieldType?: "string_ymd" | "date";
  filters?: any;
}) {
  if (!Reminders) {
    throw new Error(
      "Reminders model no está configurado en reminders.datasource.ts",
    );
  }

  const { month, userIds, dateField, dateFieldType, filters } = args;

  let q: FilterQuery<any> = {
    createdBy: { $in: userIds }, // AJUSTA
    isDeleted: false,
  };

  q = { ...q, ...buildMonthFilter(month, dateField, dateFieldType) };
  q = applyGenericFilters(q, filters);

  return Reminders.countDocuments(q);
}
