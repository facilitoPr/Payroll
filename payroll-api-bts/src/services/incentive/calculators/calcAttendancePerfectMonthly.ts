
import mongoose, { Types } from "mongoose";
import { IIncentiveRule } from "../../../model/incentive/incentiveRule";
import { MonthMeta, normalizeObjectIdArray } from "../incentiveEngine.service";
import IncentiveScopeSnapshot from "../../../model/incentive/incentiveScopeSnapshot";
import { escapeRegex } from "../../../middlewares/cleanText";
import WorkSummary from "../../../model/punch/workSummary";
import { buildAttendanceMessage } from "../../../helper/incentives/attendance";

function isSchemaDateField(Model: any, field: string) {
  try {
    const p = Model?.schema?.path(field);
    return p?.instance === "Date";
  } catch {
    return false;
  }
}

export function buildMonthCondition(args: {
  Model: any;
  field: string;
  meta: MonthMeta;
  stringPrefix: string; // ej: "YYYY-MM" o "YYYY/MM"
}) {
  const { Model, field, meta, stringPrefix } = args;

  // ✅ Si el schema dice Date => rango
  if (isSchemaDateField(Model, field)) {
    return { [field]: { $gte: meta.start, $lt: meta.end } };
  }

  // ✅ Si es string => regex prefix
  return { [field]: { $regex: new RegExp(`^${escapeRegex(stringPrefix)}`) } };
}

const calcAttendancePerfectMonthly = async (
  rule: IIncentiveRule,
  month: string,
  meta: MonthMeta,
  userIds?: string[] | null,
) => {
  const cfg = rule.config || {};
  const requireNoLate = cfg?.exclude?.late !== false; // default true
  const excludeLincense = cfg?.exclude?.license !== false; // default true
  const minEligibleDays = Number(cfg?.minEligibleDays || 0);

  const userFilterIds = normalizeObjectIdArray(userIds);

  // Universo de usuarios a evaluar:
  // - si hay filtro -> esos
  // - si scopeType=locality -> miembros del snapshot
  // - si no -> usuarios que tengan WorkSummary/PuncHistory en el mes (si quieres, podrías ampliar)
  let usersUniverse: Types.ObjectId[] = [];

  if (rule.scopeType === "locality") {
    const snaps = await IncentiveScopeSnapshot.find({
      program: rule.program,
      month,
      scopeType: "locality",
      isDeleted: false,
      isActive: true,
    }).lean();

    const set = new Set<string>();
    for (const s of snaps) {
      for (const u of (s as any)?.memberUserIds || []) set.add(String(u));
    }
    usersUniverse = Array.from(set)
      .filter((x) => Types.ObjectId.isValid(x))
      .map((x) => new Types.ObjectId(x));
  } else if (userFilterIds.length) {
    usersUniverse = userFilterIds;
  } else {
    // si no hay filtro, intenta sacar universo desde WorkSummary si existe
    const WorkSummaryModel = mongoose.models.WorkSummary;
    if (WorkSummaryModel) {
      const monthCond = buildMonthCondition({
        Model: WorkSummaryModel,
        field: "date",
        meta,
        stringPrefix: meta.prefixYMDDash, // "YYYY-MM"
      });

      const ids = await WorkSummaryModel.distinct("user", {
        ...monthCond,
      });
      usersUniverse = (ids || [])
        .map(String)
        .filter((x: string) => Types.ObjectId.isValid(x))
        .map((x: string) => new Types.ObjectId(x));
    }
  }

  // Si aún no hay universo, no calculamos
  if (!usersUniverse.length) return [];


  const monthCond = buildMonthCondition({
    Model: WorkSummary,
    field: "date",
    meta,
    stringPrefix: meta.prefixYMDDash,
  });

  const rows: any[] = await WorkSummary.find({
    user: { $in: usersUniverse },
    ...monthCond,
    isDeleted: false,
  })
    .select("user date lateTime classification totalMinutes")
    .lean();

  const perUser: Record<string, any> = {};

  for (const r of rows) {
    const uid = String(r?.user || "");
    if (!uid) continue;
    if (!perUser[uid]) {
      perUser[uid] = {
        eligibleDays: 0,
        excludedLincenses: 0,
        lateDays: 0,
        absentDays: 0,
      };
    }

    // heurísticas seguras
    const isLicense = r.classification != "Trabajo regular";
    const isLate = !!(Number(r?.lateTime || 0) > 0);
    const isAbsent = r.totalMinutes == 0

    // asumimos que WorkSummary representa un día "laborable" para esa persona (si existe registro)
    perUser[uid].eligibleDays += 1;

    if (excludeLincense && isLicense) perUser[uid].excludedLincenses += 1;
    if (requireNoLate && isLate) perUser[uid].lateDays += 1;
    if (isAbsent) perUser[uid].absentDays += 1;
  }

  // armar resultados
  return usersUniverse.map((uidObj) => {
    const uid = String(uidObj);
    const m = perUser[uid] || {
      eligibleDays: 0,
      excludedLincenses: 0,
      lateDays: 0,
      absentDays: 0,
    };

    const effectiveEligible = Math.max(
      0,
      m.eligibleDays - (excludeLincense ? m.excludedLincenses : 0),
    );

    const ok =
      effectiveEligible > 0 &&
      (!minEligibleDays || effectiveEligible >= minEligibleDays) &&
      (!requireNoLate || m.lateDays === 0) &&
      m.absentDays === 0;

    const progressPercent =
      effectiveEligible > 0
        ? Math.round(
            ((effectiveEligible - m.lateDays - m.absentDays) /
              effectiveEligible) *
              100,
          )
        : 0;

    const message = ok
      ? "¡Asistencia perfecta lograda!"
      : buildAttendanceMessage(m, {
          requireNoLate,
          excludeLincense,
          minEligibleDays,
        });

    return {
      appliesTo: rule.appliesTo,
      scopeType: rule.scopeType,
      subjectUser: uidObj,
      subjectLocalityCode: null,
      subjectDepartmentCode: null,
      subjectTeamId: null,

      progressPercent,
      status: ok ? "achieved" : null,
      metrics: {
        eligibleDays: m.eligibleDays,
        excludedLincenses: m.excludedLincenses,
        effectiveEligible,
        lateDays: m.lateDays,
        absentDays: m.absentDays,
        requireNoLate,
        excludeLincense,
        minEligibleDays,
      },
      message,
      evidence: {},
    };
  });
}

export default calcAttendancePerfectMonthly;