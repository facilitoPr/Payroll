import { escapeRegex } from "../../middlewares/cleanText";
import { MonthMeta } from "../../services/incentive/incentiveEngine.service";

export type AttendedDefinition = {
  // definición basada en marks (tu caso: "CONFIRMACION")
  mark?: string | null;
  marksAnyOf?: string[] | null;
};

function upper(s: any) {
  return String(s || "")
    .trim()
    .toUpperCase();
}

export const buildAttendedMatch = async (def: AttendedDefinition) => {
  const ors: any[] = [];

  // mark único
  const mark = upper(def?.mark);
  if (mark) ors.push({ marks: { $in: [mark] } });

  // varios marks
  const marksAnyOf = Array.isArray(def?.marksAnyOf)
    ? def!.marksAnyOf!.map(upper).filter(Boolean)
    : [];
  if (marksAnyOf.length) ors.push({ marks: { $in: marksAnyOf } });

  // si no hay definición => 0 asistidas (seguro)
  if (!ors.length) return { __neverMatch: true };

  // un solo criterio => devolverlo directo
  if (ors.length === 1) return ors[0];

  // varios => OR
  return { $or: ors };
}

export const buildMonthConditionFlexible = (args: {
  Model: any;
  field: string;
  meta: MonthMeta;
  stringPrefix?: string;
}) => {
  const { Model, field, meta } = args;

  const schemaPath: any = Model?.schema?.path?.(field);
  const instance = schemaPath?.instance;

  if (instance === "Date") {
    return { [field]: { $gte: meta.start, $lt: meta.end } };
  }

  const prefix = args.stringPrefix || meta.prefixYMDSlash; // "YYYY/MM"
  return {
    [field]: { $regex: new RegExp(`^${escapeRegex(prefix)}`) },
  };
}
