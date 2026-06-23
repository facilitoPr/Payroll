import { Types } from "mongoose";
import Reminders from "../../../model/reminders";
import { IIncentiveRule } from "../../../model/incentive/incentiveRule";
import IncentiveScopeSnapshot from "../../../model/incentive/incentiveScopeSnapshot";
import { escapeRegex } from "../../../middlewares/cleanText";
import { MonthMeta, normalizeObjectIdArray } from "../incentiveEngine.service";
import { AttendedDefinition, buildAttendedMatch, buildMonthConditionFlexible } from "../../../helper/incentives/reminders";

/**
 * ✅ Calculadora: 240 asistencias confirmadas (monthly)
 * - attendedTarget: 240
 * - evalúa usando marks (ej: "CONFIRMACION") y dateField (date o createdByOperatorDate)
 */
const calcRemindersAttendedTargetMonthly = async (
  rule: IIncentiveRule,
  month: string,
  meta: MonthMeta,
  userIds?: string[] | null,
) => {
  const cfg: any = rule.config || {};
  const dateField = cfg.dateField === "date" ? "date" : "createdByOperatorDate";
  const attendedTarget = Number(cfg.attendedTarget || 0);
  const attendedDef: AttendedDefinition = cfg.attendedDefinition || {};

  const userFilterIds = normalizeObjectIdArray(userIds);

  // -----------------------------
  // 1) Universo de usuarios
  // -----------------------------
  let usersUniverse: string[] = [];

  if (rule.scopeType === "locality") {
    // se suma por snapshot, no necesitamos universo aquí
  } else if (userFilterIds.length) {
    usersUniverse = userFilterIds.map(String);
  } else {
    // usuarios con reminders en el mes (por dateField)
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

  // -----------------------------
  // 2) Conteo de asistidas (aggregate)
  // -----------------------------
  const monthCondAtt = buildMonthConditionFlexible({
    Model: Reminders,
    field: dateField,
    meta,
    stringPrefix: meta.prefixYMDSlash,
  });

  const attendedMatchExtra = await buildAttendedMatch(attendedDef);
  const attendedNever = (attendedMatchExtra as any).__neverMatch === true;

  const attendedCountsByUser: Record<string, number> = {};

  if (!attendedNever) {
    const match: any = {
      isDeleted: false,
      user: { $ne: null },
      ...monthCondAtt,
      ...attendedMatchExtra,
    };

    if (rule.scopeType !== "locality" && usersUniverse.length) {
      match.user = { $in: usersUniverse.map((x) => new Types.ObjectId(x)) };
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

  // -----------------------------
  // 3) scopeType locality (sumar por snapshot)
  // -----------------------------
  if (rule.scopeType === "locality") {
    const snaps = await IncentiveScopeSnapshot.find({
      program: rule.program,
      month,
      scopeType: "locality",
      isDeleted: false,
      isActive: true,
    }).lean();

    return snaps.map((s: any) => {
      const members: string[] = (s?.memberUserIds || []).map((x: any) =>
        String(x),
      );
      const membersCount = Number(s?.membersCount || members.length || 0);

      let attended = 0;
      for (const uid of members) {
        attended += Number(attendedCountsByUser[uid] || 0);
      }

      const progress =
        attendedTarget > 0 ? Math.min(1, attended / attendedTarget) : 0;

      const progressPercent = Math.round(progress * 100);
      const achieved = attendedTarget > 0 && attended >= attendedTarget;

      const message = achieved
        ? `¡Meta lograda! ${attended}/${attendedTarget} asistencias confirmadas.`
        : `Progreso: ${attended}/${attendedTarget} asistencias confirmadas.`;

      return {
        appliesTo: rule.appliesTo,
        scopeType: rule.scopeType,
        subjectUser: null,
        subjectLocalityCode: s.subjectLocalityCode,
        subjectDepartmentCode: null,
        subjectTeamId: null,

        progressPercent,
        status: achieved ? "achieved" : null,
        metrics: {
          dateField,
          attendedTarget,
          attended,
          membersCount,
          attendedDefinition: attendedDef,
        },
        message,
        evidence: {},
      };
    });
  }

  // -----------------------------
  // 4) scopeType user
  // -----------------------------
  if (!usersUniverse.length) return [];

  return usersUniverse.map((uid) => {
    const attended = Number(attendedCountsByUser[uid] || 0);

    const progress =
      attendedTarget > 0 ? Math.min(1, attended / attendedTarget) : 0;

    const progressPercent = Math.round(progress * 100);
    const achieved = attendedTarget > 0 && attended >= attendedTarget;

    const message = achieved
      ? `¡Meta lograda! ${attended}/${attendedTarget} asistencias confirmadas.`
      : `Vas ${attended}/${attendedTarget} asistencias confirmadas.`;

    return {
      appliesTo: rule.appliesTo,
      scopeType: rule.scopeType,
      subjectUser: Types.ObjectId.isValid(uid) ? new Types.ObjectId(uid) : null,
      subjectLocalityCode: null,
      subjectDepartmentCode: null,
      subjectTeamId: null,

      progressPercent,
      status: achieved ? "achieved" : null,
      metrics: {
        dateField,
        attendedTarget,
        attended,
        attendedDefinition: attendedDef,
      },
      message,
      evidence: {},
    };
  });
};

export default calcRemindersAttendedTargetMonthly;
