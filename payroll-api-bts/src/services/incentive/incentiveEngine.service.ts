import mongoose, { Types } from "mongoose";

import IncentiveRule, {
  IIncentiveRule,
} from "../../model/incentive/incentiveRule";
import IncentiveProgram from "../../model/incentive/incentiveProgram";
import IncentiveScopeSnapshot from "../../model/incentive/incentiveScopeSnapshot";
import IncentiveAchievement from "../../model/incentive/incentiveAchievement";
import Zones from "../../model/zones";
import { isValidMonth } from "../../helper/incentives/month";
import calcAttendancePerfectMonthly from "./calculators/calcAttendancePerfectMonthly";
import calcRemindersCompositionMonthly from "./calculators/calcRemindersCompositionMonthly";
import calcRemindersAttendedTargetMonthly from "./calculators/calcRemindersAttendedTargetMonthly";
import calcEmployeeOfMonthMonthly from "./calculators/calcEmployeeOfMonthMonthly";

// -----------------------------
// Types
// -----------------------------
type RecalcPayload = {
  month: string;
  programId?: string | null;
  userIds?: string[] | null;
  actorUserId?: string | null;

  // ✅ NUEVO: limita recalculo de scopeType=locality a ciertas localidades
  localityCodes?: string[] | null;

  // ✅ NUEVO: para que "Mis metas" no recalculen leaderboard pesado
  excludeRuleTypes?: Array<
    "count" | "ratio" | "composition" | "leaderboard"
  > | null;
};

export type MonthMeta = {
  yyyy: string;
  mm: string;
  prefixYMDSlash: string; // "YYYY/MM"
  prefixYMDDash: string; // "YYYY-MM"
  isCurrentMonth: boolean;

  start: Date; // ✅ inicio del mes
  end: Date; // ✅ inicio del mes siguiente
};

// -----------------------------
// Public API
// -----------------------------
export async function recalcMonth(payload: RecalcPayload) {
  const {
    month,
    programId = null,
    userIds = null,
    actorUserId = null,
  } = payload;

  console.log("EJECUTANDO RECALCULO MONTH")

  if (!isValidMonth(month)) {
    throw new Error(`Mes inválido: ${month}. Debe ser YYYY-MM`);
  }

  const meta = buildMonthMeta(month);

  const programs = await loadPrograms(programId);
  if (!programs.length) {
    return {
      ok: true,
      mensaje: "No hay programas activos para recalcular.",
      month,
      programsProcessed: 0,
      rulesProcessed: 0,
      achievementsUpserted: 0,
    };
  }

  let totalRules = 0;
  let totalUpserts = 0;

  for (const program of programs) {
    const rules = await loadRulesForProgram(program._id, month, {
      excludeRuleTypes: payload.excludeRuleTypes || null,
    });
    totalRules += rules.length;

    if (!rules.length) continue;

    // 1) Asegurar snapshots si alguna regla necesita scopeType != user
    await ensureScopeSnapshotsForProgramMonth({
      programId: program._id,
      month,
      rules,
      actorUserId,
      localityCodes: payload.localityCodes || null,
    });

    // 2) Calcular reglas (operadores, equipos, líderes)
    for (const rule of rules) {
      const upserts = await calcAndUpsertAchievementsForRule({
        rule,
        month,
        meta,
        userIds,
        actorUserId,
      });
      totalUpserts += upserts;
    }
  }

  return {
    ok: true,
    mensaje: "Recalculo completado.",
    month,
    programsProcessed: programs.length,
    rulesProcessed: totalRules,
    achievementsUpserted: totalUpserts,
  };
}

// -----------------------------
// Loaders
// -----------------------------
async function loadPrograms(programId?: string | null) {
  const q: any = { isDeleted: false };
  if (programId && Types.ObjectId.isValid(programId))
    q._id = new Types.ObjectId(programId);
  // Puedes decidir si solo activos:
  q.isActive = true;

  return IncentiveProgram.find(q).lean();
}

async function loadRulesForProgram(
  programId: Types.ObjectId,
  month: string,
  opts?: { excludeRuleTypes?: string[] | null },
) {
  const q: any = {
    program: programId,
    isDeleted: false,
    isActive: true,
    $and: [
      { $or: [{ startMonth: null }, { startMonth: { $lte: month } }] },
      { $or: [{ endMonth: null }, { endMonth: { $gte: month } }] },
    ],
  };

  if (opts?.excludeRuleTypes?.length) {
    q.ruleType = { $nin: opts.excludeRuleTypes };
  }

  return IncentiveRule.find(q).sort({ displayOrder: 1, createdAt: 1 }).lean();
}

// -----------------------------
// Snapshots (equipos por zona/mes)
// -----------------------------
async function ensureScopeSnapshotsForProgramMonth(args: {
  programId: Types.ObjectId;
  month: string;
  rules: IIncentiveRule[];
  actorUserId?: string | null;
  localityCodes?: string[] | null;
}) {
  const needsLocality = args.rules.some((r) => r.scopeType === "locality");
  const needsDepartment = args.rules.some((r) => r.scopeType === "department");
  const needsTeam = args.rules.some((r) => r.scopeType === "team");

  // ✅ Tu caso actual: locality por Zone.code usando User.zone
  if (needsLocality) {
    // await ensureLocalitySnapshotsFromUserZone(
    //   args.programId,
    //   args.month,
    //   args.actorUserId,
    //   args.localityCodes,
    // );
  }

  // (Opcional futuro)
  if (needsDepartment) {
    // await ensureDepartmentSnapshotsFromUserDepartment(...)
  }
  if (needsTeam) {
    // await ensureTeamSnapshotsFromTeamModel(...)
  }
}

/**
 * Crea snapshots por localidad (Zone.code) usando User.zone (ref a Zone).
 * - Congela miembros del equipo por mes para historial.
 */
async function ensureLocalitySnapshotsFromUserZone(
  programId: Types.ObjectId,
  month: string,
  actorUserId?: string | null,
  localityCodes?: string[] | null,
) {
  const UserModel = mongoose.models.User;
  if (!UserModel) throw new Error("No existe mongoose.models.User");

  // Modelo Zones (según tu remindersSchema ref: "Zones")
  let usersQuery: any = { isDeleted: false };

  // ✅ Si nos pasan localityCodes, resolvemos Zone _id por code y filtramos users por zone
  if (Array.isArray(localityCodes) && localityCodes.length) {
    const zones = await Zones.find({
      code: { $in: localityCodes.map((x) => String(x).trim()) },
    })
      .select("_id code")
      .lean();

    const zoneIds = (zones || []).map((z: any) => z._id).filter(Boolean);
    if (zoneIds.length) {
      usersQuery.zone = { $in: zoneIds };
    } else {
      return; // no hay zones que coincidan
    }
  }

  const users: any[] = await UserModel.find(usersQuery)
    .populate({ path: "zone", select: "code name" })
    .select("_id zone")
    .lean();

  const group = new Map<string, Types.ObjectId[]>();
  for (const u of users) {
    const code = String(u?.zone?.code || "").trim();
    if (!code) continue;
    if (!group.has(code)) group.set(code, []);
    group.get(code)!.push(new Types.ObjectId(u._id));
  }

  if (!group.size) return;

  const ops: any = Array.from(group.entries()).map(
    ([zoneCode, memberUserIds]) => ({
      updateOne: {
        filter: {
          program: programId,
          month,
          scopeType: "locality",
          subjectLocalityCode: zoneCode,
          isDeleted: false,
        },
        update: {
          $set: {
            program: programId,
            month,
            scopeType: "locality",
            subjectLocalityCode: zoneCode,
            memberUserIds,
            source: "user_zone",
            updatedBy:
              actorUserId && Types.ObjectId.isValid(actorUserId)
                ? new Types.ObjectId(actorUserId)
                : null,
            isActive: true,
            isDeleted: false,
          },
          $setOnInsert: {
            createdBy:
              actorUserId && Types.ObjectId.isValid(actorUserId)
                ? new Types.ObjectId(actorUserId)
                : null,
          },
        },
        upsert: true,
      },
    }),
  );

  await IncentiveScopeSnapshot.bulkWrite(ops, { ordered: false });
}

// -----------------------------
// Rule calculators
// -----------------------------
async function calcAndUpsertAchievementsForRule(args: {
  rule: IIncentiveRule;
  month: string;
  meta: MonthMeta;
  userIds?: string[] | null;
  actorUserId?: string | null;
}) {
  const { rule } = args;

  // ✅ Determinar "status base" según si mes es actual o pasado
  const baseNonAchievedStatus = args.meta.isCurrentMonth
    ? "in_progress"
    : "not_achieved";

  // 1) REMINDERS + COMPOSITION (tu 50/50 REAGENDAR vs base sin marks)
  if (rule.metricSource === "reminders" && rule.ruleType === "composition") {
    const results = await calcRemindersCompositionMonthly(
      rule,
      args.month,
      args.meta,
      args.userIds,
    );

    return upsertAchievementsBulk({
      rule,
      month: args.month,
      baseNonAchievedStatus,
      actorUserId: args.actorUserId,
      results,
    });
  }

  // 2) REMINDERS + COUNT (ej: 240 asistencias confirmadas)
  if (rule.metricSource === "reminders" && rule.ruleType === "count") {
    const results = await calcRemindersAttendedTargetMonthly(
      rule,
      args.month,
      args.meta,
      args.userIds,
    );

    return upsertAchievementsBulk({
      rule,
      month: args.month,
      baseNonAchievedStatus,
      actorUserId: args.actorUserId,
      results,
    });
  }

  // 3) ATTENDANCE (asistencia perfecta mensual)
  if (rule.metricSource === "attendance") {
    const results = await calcAttendancePerfectMonthly(
      rule,
      args.month,
      args.meta,
      args.userIds,
    );

    return upsertAchievementsBulk({
      rule,
      month: args.month,
      baseNonAchievedStatus,
      actorUserId: args.actorUserId,
      results,
    });
  }

  // 3) CUSTOM (ej: líder por equipo basado en achievements del equipo)
  if (rule.metricSource === "custom") {
    const results = await calcCustomRule(rule, args.month, args.meta);

    return upsertAchievementsBulk({
      rule,
      month: args.month,
      baseNonAchievedStatus,
      actorUserId: args.actorUserId,
      results,
    });
  }

  // si no hay calculadora para esa combinación
  return 0;
}

/**
 * -----------------------------
 *  CUSTOM (Leader/Team dependencies)
 * -----------------------------
 * Ejemplo de config:
 * {
 *   "type": "LEADER_BY_TEAM_ACHIEVERS",
 *   "dependsOnRuleCodes": ["OPS_ATTENDANCE_PERFECT", "OPS_300_5050"],
 *   "requireAllMembers": true
 * }
 */
async function calcCustomRule(
  rule: IIncentiveRule,
  month: string,
  meta: MonthMeta,
  userIds?: string[] | null,
) {
  const cfg = rule.config || {};
  const type = String(cfg.type || "")
    .trim()
    .toUpperCase();

  // si lo quieres explícito por type:
  if (rule.code === "OP_EMPLEADO_DEL_MES") {
    return calcEmployeeOfMonthMonthly(rule, month, meta, userIds);
  }

  // fallback automático por seed (leaderboard + ranking.metric attendedPatients)
  const metric = String(cfg?.ranking?.metric || "").trim();
  if (rule.ruleType === "leaderboard" && metric === "attendedPatients") {
    return calcEmployeeOfMonthMonthly(rule, month, meta, userIds);
  }

  if (type === "LEADER_BY_TEAM_ACHIEVERS") {
    return calcLeaderByTeamAchievers(rule, month, meta);
  }

  return [];
}


async function calcLeaderByTeamAchievers(
  rule: IIncentiveRule,
  month: string,
  meta: MonthMeta,
) {
  const cfg = rule.config || {};
  const dependsOnRuleCodes: string[] = Array.isArray(cfg.dependsOnRuleCodes)
    ? cfg.dependsOnRuleCodes
        .map((x: any) =>
          String(x || "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean)
    : [];

  const requireAllMembers = cfg.requireAllMembers !== false; // default true
  const minAchievers = Number(cfg.minAchievers || 0);

  if (!dependsOnRuleCodes.length) return [];

  // snapshots por locality (tu caso)
  const snaps = await IncentiveScopeSnapshot.find({
    program: rule.program,
    month,
    scopeType: "locality",
    isDeleted: false,
    isActive: true,
  }).lean();

  if (!snaps.length) return [];

  // cargar rules dependientes (por code)
  const depRules = await IncentiveRule.find({
    program: rule.program,
    code: { $in: dependsOnRuleCodes },
    isDeleted: false,
  })
    .select("_id code")
    .lean();

  const depRuleIds = depRules.map((r) => r._id);
  const depIdToCode = new Map(
    depRules.map((r) => [String(r._id), String(r.code)]),
  );

  if (!depRuleIds.length) return [];

  // achievements achieved por usuario (para esos rules)
  const achievedRows = await IncentiveAchievement.find({
    program: rule.program,
    month,
    rule: { $in: depRuleIds },
    status: "achieved",
    subjectUser: { $ne: null },
    isDeleted: false,
  })
    .select("rule subjectUser")
    .lean();

  const achievedSetByRule: Record<string, Set<string>> = {};
  for (const row of achievedRows) {
    const rid = String(row.rule);
    const uid = String(row.subjectUser);
    if (!rid || !uid) continue;
    if (!achievedSetByRule[rid]) achievedSetByRule[rid] = new Set();
    achievedSetByRule[rid].add(uid);
  }

  // construir resultado por snapshot
  return snaps.map((s: any) => {
    const members: string[] = (s?.memberUserIds || []).map((x: any) =>
      String(x),
    );
    const membersCount = Number(s?.membersCount || members.length || 0);

    // por cada regla dependiente, contar achievers
    const breakdown: any[] = depRuleIds.map((rid) => {
      const set = achievedSetByRule[String(rid)] || new Set<string>();
      let count = 0;
      for (const uid of members) if (set.has(uid)) count++;
      return {
        ruleId: String(rid),
        code: depIdToCode.get(String(rid)) || "",
        achievers: count,
      };
    });

    // condición global
    const totalAchievers = requireAllMembers
      ? Math.min(...breakdown.map((b) => b.achievers)) // si requiere todos, el mínimo por regla manda
      : Math.max(...breakdown.map((b) => b.achievers)); // si no, el máximo

    const achieved =
      membersCount > 0 &&
      (requireAllMembers
        ? breakdown.every((b) => b.achievers === membersCount)
        : totalAchievers > 0) &&
      (!minAchievers || totalAchievers >= minAchievers);

    const progressPercent =
      membersCount > 0 ? Math.round((totalAchievers / membersCount) * 100) : 0;

    const message = achieved
      ? "¡El equipo alcanzó la meta! (Incentivo de líder)"
      : `Progreso equipo: ${totalAchievers}/${membersCount}`;

    // ✅ aplicaTo leader: se espera subjectUser = leaderUserId
    const leaderUserId = s?.leaderUserId
      ? new Types.ObjectId(s.leaderUserId)
      : null;

    return {
      appliesTo: rule.appliesTo,
      scopeType: rule.scopeType,
      subjectUser: leaderUserId, // puede ser null si aún no asignas líderes
      subjectLocalityCode: s.subjectLocalityCode,
      subjectDepartmentCode: null,
      subjectTeamId: null,

      progressPercent,
      status: achieved ? "achieved" : null,
      metrics: {
        membersCount,
        totalAchievers,
        requireAllMembers,
        minAchievers,
        breakdown,
      },
      message: leaderUserId
        ? message
        : "Falta asignar líder para esta localidad (snapshot.leaderUserId).",
      evidence: { snapshotId: String(s._id) },
    };
  });
}

// -----------------------------
// Achievements upsert (bulk)
// -----------------------------
async function upsertAchievementsBulk(args: {
  rule: IIncentiveRule;
  month: string;
  baseNonAchievedStatus: "in_progress" | "not_achieved";
  actorUserId?: string | null;
  results: any[];
}) {
  const { rule, month, baseNonAchievedStatus, actorUserId, results } = args;
  if (!Array.isArray(results) || !results.length) return 0;

  const rewardSnapshot = buildRewardSnapshotFromRule(rule);

  const actorId =
    actorUserId && Types.ObjectId.isValid(actorUserId)
      ? new Types.ObjectId(actorUserId)
      : null;

  const ops = results.map((r) => {
    const finalStatus = r.status || baseNonAchievedStatus;

    return {
      updateOne: {
        filter: {
          rule: rule._id,
          program: rule.program,
          month,
          subjectUser: r.subjectUser ?? null,
          subjectLocalityCode: r.subjectLocalityCode ?? null,
          subjectDepartmentCode: r.subjectDepartmentCode ?? null,
          subjectTeamId: r.subjectTeamId ?? null,
          isDeleted: false,
        },
        update: {
          $set: {
            rule: rule._id,
            program: rule.program,
            month,
            appliesTo: rule.appliesTo,
            scopeType: rule.scopeType,

            subjectUser: r.subjectUser ?? null,
            subjectLocalityCode: r.subjectLocalityCode ?? null,
            subjectDepartmentCode: r.subjectDepartmentCode ?? null,
            subjectTeamId: r.subjectTeamId ?? null,

            status: finalStatus,
            progressPercent: clamp0to100(Number(r.progressPercent || 0)),
            metrics: r.metrics || {},
            evidence: r.evidence || {},
            message: r.message || null,

            rewardSnapshot,

            updatedBy: actorId,
            isActive: true,
            isDeleted: false,
          },
          $setOnInsert: {
            createdBy: actorId,
          },
        },
        upsert: true,
      },
    };
  });

  const resp = await IncentiveAchievement.bulkWrite(ops, { ordered: false });
  return (resp?.upsertedCount || 0) + (resp?.modifiedCount || 0);
}

function buildRewardSnapshotFromRule(rule: IIncentiveRule) {
  return {
    deliveryChannel: rule.deliveryChannel,
    rewardKind: rule.rewardKind,
    amount: rule.rewardKind === "money" ? (rule.rewardAmount ?? null) : null,
    currency:
      rule.rewardKind === "money"
        ? rule.rewardCurrency || "DOP"
        : rule.rewardCurrency || "DOP",
    label: rule.rewardLabel || rule.name || null,
  };
}

// -----------------------------
// Helpers
// -----------------------------

export function buildMonthMeta(month: string): MonthMeta {
  const [yyyy, mm] = month.split("-");
  const prefixYMDSlash = `${yyyy}/${mm}`; // reminders "YYYY/MM/DD"
  const prefixYMDDash = `${yyyy}-${mm}`; // HR string "YYYY-MM-DD"

  const start = new Date(Number(yyyy), Number(mm) - 1, 1, 0, 0, 0, 0);
  const end = new Date(Number(yyyy), Number(mm), 1, 0, 0, 0, 0);

  const now = new Date();
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return {
    yyyy,
    mm,
    prefixYMDSlash,
    prefixYMDDash,
    isCurrentMonth: cur === month,
    start,
    end,
  };
}

export function normalizeObjectIdArray(
  arr?: string[] | null,
): Types.ObjectId[] {
  if (!Array.isArray(arr) || !arr.length) return [];
  const out: Types.ObjectId[] = [];
  for (const x of arr) {
    const s = String(x || "").trim();
    if (Types.ObjectId.isValid(s)) out.push(new Types.ObjectId(s));
  }
  return out;
}

function clamp0to100(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
