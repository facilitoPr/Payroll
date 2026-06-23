import { Types } from "mongoose";
import Reminders from "../../../model/reminders";
import IncentiveRule, {
  IIncentiveRule,
} from "../../../model/incentive/incentiveRule";
import IncentiveAchievement from "../../../model/incentive/incentiveAchievement";
import { escapeRegex } from "../../../middlewares/cleanText";
import { MonthMeta, normalizeObjectIdArray } from "../incentiveEngine.service";
import { buildAttendedMatch, buildMonthConditionFlexible } from "../../../helper/incentives/reminders";

type RequiresItem = {
  ruleCode: string;
};

type RankingConfig = {
  pick?: number; // default 1
  metric?: string; // "attendedPatients"
  minAttended?: number; // default 240
};

type AttendedDefinition = {
  mark?: string | null;
  marksAnyOf?: string[] | null;
};

function upper(s: any) {
  return String(s || "")
    .trim()
    .toUpperCase();
}



/**
 * ✅ Calculadora: Empleado del mes
 * - Requiere reglas previas en achieved (config.requires)
 * - Ranking por cantidad de “asistencias confirmadas” (Reminders)
 * - Mínimo: config.ranking.minAttended (default 240)
 * - Ganadores: config.ranking.pick (default 1)
 */
const calcEmployeeOfMonthMonthly = async (
  rule: IIncentiveRule,
  month: string,
  meta: MonthMeta,
  userIds?: string[] | null,
) => {
  const cfg: any = rule.config || {};
  const ranking: RankingConfig = cfg.ranking || {};
  const requires: RequiresItem[] = Array.isArray(cfg.requires)
    ? cfg.requires
    : [];

  const pick = Math.max(1, Number(ranking.pick || 1));
  const minAttended = Math.max(0, Number(ranking.minAttended ?? 240));

  // dateField para Reminders (tu seed suele usar date)
  const dateField =
    cfg.dateField === "createdByOperatorDate"
      ? "createdByOperatorDate"
      : "date";

  // definición de “asistió” (default CONFIRMACION si no viene nada)
  const attendedDef: AttendedDefinition = cfg.attendedDefinition || {};
  const attendedMatchExtra = await buildAttendedMatch(attendedDef);

  const userFilterIds = normalizeObjectIdArray(userIds);

  // ------------------------------------------------
  // 1) Universo de users
  // ------------------------------------------------
  let usersUniverse: string[] = [];

  if (userFilterIds.length) {
    usersUniverse = userFilterIds.map(String);
  } else {
    // Usuarios con reminders del mes (por dateField)
    const monthCond = buildMonthConditionFlexible({
      Model: Reminders,
      field: dateField,
      meta,
      stringPrefix: meta.prefixYMDSlash,
    });

    const ids = await Reminders.distinct("user", {
      isDeleted: false,
      user: { $ne: null },
      ...monthCond,
    });

    usersUniverse = (ids || [])
      .map(String)
      .filter((x) => Types.ObjectId.isValid(x));
  }

  // ------------------------------------------------
  // 2) requires: cada ruleCode debe estar achieved
  // ------------------------------------------------
  const requiresCodes = requires.map((r) => upper(r?.ruleCode)).filter(Boolean);

  // map: userId -> { [ruleCode]: boolean }
  const requiresByUser: Record<string, Record<string, boolean>> = {};
  const requiresRuleIdByCode = new Map<string, Types.ObjectId>();

  if (requiresCodes.length) {
    const reqRules = await IncentiveRule.find({
      program: rule.program,
      code: { $in: requiresCodes },
      isDeleted: false,
    })
      .select("_id code")
      .lean();

    for (const rr of reqRules) {
      const code = upper(rr?.code);
      if (code && rr?._id) requiresRuleIdByCode.set(code, rr._id as any);
    }

    const reqRuleIds = Array.from(requiresRuleIdByCode.values());

    if (reqRuleIds.length) {
      const match: any = {
        program: rule.program,
        month,
        rule: { $in: reqRuleIds },
        status: "achieved",
        subjectUser: { $ne: null },
        isDeleted: false,
      };

      if (usersUniverse.length) {
        match.subjectUser = {
          $in: usersUniverse.map((u) => new Types.ObjectId(u)),
        };
      }

      const achievedRows = await IncentiveAchievement.find(match)
        .select("rule subjectUser")
        .lean();

      const ruleCodeById = new Map<string, string>();
      for (const [code, rid] of requiresRuleIdByCode.entries()) {
        ruleCodeById.set(String(rid), code);
      }

      for (const row of achievedRows) {
        const uid = row?.subjectUser ? String(row.subjectUser) : "";
        const rid = row?.rule ? String(row.rule) : "";
        if (!uid || !rid) continue;

        const code = ruleCodeById.get(rid) || "";
        if (!code) continue;

        if (!requiresByUser[uid]) requiresByUser[uid] = {};
        requiresByUser[uid][code] = true;
      }
    }

    // si no habíamos tenido universe (poco probable), lo completamos con los que salieron en requires
    if (!userFilterIds.length) {
      const extra = Object.keys(requiresByUser);
      if (extra.length) {
        const set = new Set(usersUniverse);
        for (const u of extra) set.add(u);
        usersUniverse = Array.from(set);
      }
    }
  }

  // ------------------------------------------------
  // 3) Conteo de asistencias por user (Reminders)
  // ------------------------------------------------
  const monthCondAtt = buildMonthConditionFlexible({
    Model: Reminders,
    field: dateField,
    meta,
    stringPrefix: meta.prefixYMDSlash,
  });

  const attendedCountsByUser: Record<string, number> = {};

  {
    const match: any = {
      isDeleted: false,
      user: { $ne: null },
      ...monthCondAtt,
      ...attendedMatchExtra,
    };

    if (usersUniverse.length) {
      match.user = { $in: usersUniverse.map((u) => new Types.ObjectId(u)) };
    }

    const agg = await Reminders.aggregate([
      { $match: match },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);

    for (const row of agg) {
      const u = String(row?._id || "");
      if (!u) continue;
      attendedCountsByUser[u] = Number(row?.count || 0);
    }
  }

  if (!usersUniverse.length) return [];

  // ------------------------------------------------
  // 4) Ranking & ganador(es)
  // ------------------------------------------------
  const rowsForRanking = usersUniverse.map((uid) => {
    const attended = Number(attendedCountsByUser[uid] || 0);

    // requiresMet = todos los requiresCodes en true
    const reqMap = requiresByUser[uid] || {};
    const requiresMet =
      !requiresCodes.length ||
      requiresCodes.every((code) => reqMap[code] === true);

    return {
      uid,
      attended,
      requiresMet,
    };
  });

  // candidatos elegibles (cumple requires y mínimo)
  const eligible = rowsForRanking
    .filter(
      (r) => r.requiresMet && (minAttended ? r.attended >= minAttended : true),
    )
    .sort((a, b) => {
      // tieBreaker: highest_attended (default)
      if (b.attended !== a.attended) return b.attended - a.attended;
      return String(a.uid).localeCompare(String(b.uid)); // estable
    });

  const winners = eligible.slice(0, pick);
  const winnersSet = new Set(winners.map((x) => x.uid));

  // ranking position para mensajes (solo si está en eligible)
  const rankByUser: Record<string, number> = {};
  for (let i = 0; i < eligible.length; i++) {
    rankByUser[eligible[i].uid] = i + 1;
  }

  // ------------------------------------------------
  // 5) Resultados por user
  // ------------------------------------------------
  return usersUniverse.map((uid) => {
    const attended = Number(attendedCountsByUser[uid] || 0);
    const reqMap = requiresByUser[uid] || {};
    const requiresBreakdown = requiresCodes.map((code) => ({
      ruleCode: code,
      achieved: reqMap[code] === true,
    }));

    const requiresMet =
      !requiresCodes.length ||
      requiresCodes.every((code) => reqMap[code] === true);

    // progreso: NO puede llegar a 100 si no cumple requires
    const attendedProgress =
      minAttended > 0 ? Math.min(1, attended / minAttended) : 0;
    const combinedProgress = requiresMet ? attendedProgress : 0;
    const progressPercent = Math.round(combinedProgress * 100);

    const isWinner = winnersSet.has(uid);
    const myRank = rankByUser[uid] || null;

    let message = "";
    if (isWinner) {
      message = `¡Felicidades! Eres el Empleado del Mes con ${attended} asistencias confirmadas.`;
    } else if (!requiresMet) {
      message = `Debes cumplir con la asistencia perfecta para participar. (${attended}/${minAttended} asistencias confirmadas)`;
    } else if (minAttended > 0 && attended < minAttended) {
      message = `Vas ${attended}/${minAttended} asistencias confirmadas.`;
    } else if (myRank) {
      message = `Cumples los requisitos, pero no quedaste #1. Tu posición actual: #${myRank} (${attended} asistencias).`;
    } else {
      message = `Cumples los requisitos, pero no entraste en el ranking final. (${attended} asistencias)`;
    }

    return {
      appliesTo: rule.appliesTo,
      scopeType: rule.scopeType,

      subjectUser: Types.ObjectId.isValid(uid) ? new Types.ObjectId(uid) : null,
      subjectLocalityCode: null,
      subjectDepartmentCode: null,
      subjectTeamId: null,

      progressPercent,
      status: isWinner ? "achieved" : null,
      metrics: {
        dateField,
        attendedPatients: attended,
        minAttended,
        pick,
        isWinner,
        rank: myRank,
        eligibleCount: eligible.length,
        requiresMet,
        requires: requiresBreakdown,
        attendedDefinition: attendedDef,
      },
      message,
      evidence: {},
    };
  });
};

export default calcEmployeeOfMonthMonthly;
