import { Types } from "mongoose";
import { escapeRegex } from "../../../middlewares/cleanText";
import { IIncentiveRule } from "../../../model/incentive/incentiveRule";
import IncentiveScopeSnapshot from "../../../model/incentive/incentiveScopeSnapshot";
import Reminders from "../../../model/reminders";
import { MonthMeta, normalizeObjectIdArray } from "../incentiveEngine.service";

export function normalizeCompositionBuckets(cfg: any) {
  // formato nuevo (engine)
  if (Array.isArray(cfg?.buckets) && cfg.buckets.length) return cfg.buckets;

  // formato seeds (composition.buckets)
  const src = cfg?.composition?.buckets;
  if (!Array.isArray(src) || !src.length) return [];

  const bucketTargets = cfg?.bucketTargets || {};
  const targetTotal = Number(cfg?.targetTotal || 0);

  return src.map((b: any) => {
    const key = String(b?.key || "")
      .trim()
      .toUpperCase();
    const label = String(b?.label || key || "").trim() || key;

    const minCountFromMap = Number(bucketTargets?.[key] || 0);
    const minPercent = Number(b?.minPercent || 0);
    const minCountFromPercent =
      targetTotal > 0 && minPercent > 0
        ? Math.ceil(targetTotal * minPercent)
        : 0;

    const minCount = minCountFromMap || minCountFromPercent || 0;

    const filters = b?.filters || {};
    const marksAnyOf = Array.isArray(filters?.marks)
      ? filters.marks
          .map((x: any) => String(x).trim().toUpperCase())
          .filter(Boolean)
      : [];

    const excludedMarks = Array.isArray(filters?.excludedMarks)
      ? filters.excludedMarks
          .map((x: any) => String(x).trim().toUpperCase())
          .filter(Boolean)
      : [];

    const noMarks = !!filters?.marksEmptyOrMissing;
    const isRescheduled = !!filters.isRescheduled;

    return {
      code: key,
      label,
      minCount,
      marksAnyOf,
      excludedMarks,
      noMarks,
      isRescheduled,
    };
  });
}

export function buildRemindersMonthMatch(meta: MonthMeta, dateField: string) {
  // createdByOperatorDate / created_at = "YYYY/MM/DD"
  if (dateField === "createdByOperatorDate" || dateField === "created_at") {
    return {
      [dateField]: {
        $regex: new RegExp(`^${escapeRegex(meta.prefixYMDSlash)}`),
      },
    };
  }

  // date: puede ser "YYYY/MM/DD" o "YYYY-MM-DD"
  return {
    $or: [
      {
        [dateField]: {
          $regex: new RegExp(`^${escapeRegex(meta.prefixYMDSlash)}`),
        },
      },
      {
        [dateField]: {
          $regex: new RegExp(`^${escapeRegex(meta.prefixYMDDash)}`),
        },
      },
    ],
  };
}

export function evalCompositionBuckets(
  buckets: any[],
  countsByBucket: Record<string, number>,
  allowPartialReward: boolean,
) {
  const perBucketProgress: number[] = [];
  const missing: any[] = [];
  let achievedBuckets = 0;

  const metrics: any = { buckets: [] as any[] };

  for (const b of buckets) {
    const code = String(b?.code || "")
      .trim()
      .toUpperCase();
    const label = String(b?.label || code);
    const minCount = Number(b?.minCount || 0);
    const count = Number(countsByBucket?.[code] || 0);

    const progress = minCount > 0 ? Math.min(100, (count / minCount) * 100) : 0;
    perBucketProgress.push(progress);

    const ok = minCount > 0 ? count >= minCount : false;
    if (ok) achievedBuckets++;
    else missing.push({ code, label, missing: Math.max(0, minCount - count) });

    metrics.buckets.push({
      code,
      label,
      count,
      target: minCount,
      progress: Math.round(progress),
    });
  }

  const progressPercent = perBucketProgress.length
    ? Math.round(
        perBucketProgress.reduce((a, x) => a + x, 0) / perBucketProgress.length,
      )
    : 0;

  const achieved = achievedBuckets === buckets.length;

  // ✅ Solo paga por buckets COMPLETOS
  // Ej: 2 buckets: 0 => 0%, 1 => 50%, 2 => 100%
  const rewardPercent = allowPartialReward
    ? buckets.length
      ? Math.round((achievedBuckets / buckets.length) * 100)
      : 0
    : achieved
      ? 100
      : 0;

  let message = null;
  if (achieved) {
    message = "¡Meta lograda!";
  } else if (allowPartialReward && rewardPercent > 0) {
    message = `Meta parcial: ${rewardPercent}%. Te faltan ${missing.map((m) => `${m.missing} en ${m.label}`)} `;
  } else if (missing.length) {
    message = `Te faltan ${missing.map((m) => `${m.missing} en ${m.label}`).join(" y ")} para lograr la meta.`;
  }

  return { achieved, progressPercent, rewardPercent, metrics, message };
}

/**
 * -----------------------------
 *  REMINDERS: COMPOSITION MONTHLY
 * -----------------------------
 * Config esperado (ejemplo):
 * {
 *   "dateField": "createdByOperatorDate" | "date",
 *   "buckets": [
 *     { "code":"REAG", "label":"Recoordinación", "minCount":150, "marksAnyOf":["REAGENDAR"], "rewardAmount":750 },
 *     { "code":"BASE", "label":"Base de datos", "minCount":150, "noMarks": true, "rewardAmount":750 }
 *   ],
 *   "allowPartialReward": false
 * }
 */

const calcRemindersCompositionMonthly = async (
  rule: IIncentiveRule,
  month: string,
  meta: MonthMeta,
  userIds?: string[] | null,
) => {
  const cfg: any = rule?.config || {};
  const dateField = cfg.dateField === "date" ? "date" : "createdByOperatorDate";
  const allowPartialReward = !!cfg.allowPartialReward;

  const buckets = normalizeCompositionBuckets(cfg) || [];
  if (!buckets.length) return [];

  const userFilterIds = normalizeObjectIdArray(userIds) || [];

  // 1) calcular counts por bucket y por user
  const bucketCountsByUser: Record<string, Record<string, number>> = {}; // userId -> bucketCode -> count

  for (const b of buckets) {
    const bucketCode = String(b?.code || "")
      .trim()
      .toUpperCase();
    if (!bucketCode) continue;

    const monthMatch = buildRemindersMonthMatch(meta, dateField) || {};

    const match: any = {
      isDeleted: false,
      user: { $ne: null },
      ...monthMatch,
    };

    if (userFilterIds.length) {
      match.user = { $in: userFilterIds };
    }

    // ✅ REAGENDAR => marksAnyOf
    const filtersMarks = Array.isArray(b?.marksAnyOf)
      ? b.marksAnyOf
          .map((x: any) =>
            String(x || "")
              .trim()
              .toUpperCase(),
          )
          .filter(Boolean)
      : [];

    const excludedMarks = Array.isArray(b?.excludedMarks)
      ? b.excludedMarks
          .map((x: any) =>
            String(x || "")
              .trim()
              .toUpperCase(),
          )
          .filter(Boolean)
      : [];

    if (filtersMarks.length) {
      match.marks = { $in: filtersMarks };
    }

    if (excludedMarks.length) {
      match.marks = { $nin: excludedMarks };
    }

    // aggregate
    const agg = await Reminders.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$user",
          count: { $sum: 1 },
          comercial: { $first: "$comercial" },
        },
      },
    ]);

    if (Array.isArray(agg) && agg.length) {
      await Reminders.populate(agg, {
        path: "comercial",
        select: "MemberFullname memberIdentificationNumber HomePhone",
      });
    }

    for (const row of agg || []) {
      const u = String(row?._id || "");
      if (!u) continue;
      if (!bucketCountsByUser[u]) bucketCountsByUser[u] = {};
      bucketCountsByUser[u][bucketCode] = Number(row?.count || 0);
    }
  }

  // 2) Determinar universo de users (los que aparecen en algún bucket)
  const userKeys = Object.keys(bucketCountsByUser);

  // 3) Si scopeType = locality/team/department => sumar usando snapshots
  if (rule.scopeType === "locality") {
    const snaps = await IncentiveScopeSnapshot.find({
      program: rule.program,
      month,
      scopeType: "locality",
      isDeleted: false,
      isActive: true,
    }).lean();

    return (snaps || []).map((s: any) => {
      const members: string[] = (s?.memberUserIds || []).map((x: any) =>
        String(x),
      );

      const sums: Record<string, number> = {};
      for (const b of buckets) {
        const code = String(b?.code || "")
          .trim()
          .toUpperCase();
        if (code) sums[code] = 0;
      }

      for (const uid of members) {
        const perUser = bucketCountsByUser[uid] || {};
        for (const code of Object.keys(sums)) {
          sums[code] += Number(perUser[code] || 0);
        }
      }

      const evalRes = evalCompositionBuckets(buckets, sums, allowPartialReward);

      const fullReward = Number(rule?.rewardAmount || 0);
      const rewardEarned = allowPartialReward
        ? Math.round((fullReward * Number(evalRes.rewardPercent || 0)) / 100)
        : evalRes.achieved
          ? fullReward
          : 0;

      return {
        appliesTo: rule.appliesTo,
        scopeType: rule.scopeType,
        subjectUser: null,
        subjectLocalityCode: s?.subjectLocalityCode ?? null,
        subjectDepartmentCode: null,
        subjectTeamId: null,

        progressPercent: evalRes.progressPercent,
        status: evalRes.achieved
          ? "achieved"
          : evalRes.rewardPercent > 0
            ? "partial"
            : null,

        metrics: evalRes.metrics,
        message: evalRes.message,
        evidence: {
          bucketSums: sums,
          rewardPercent: evalRes.rewardPercent,
          rewardEarned,
          rewardFull: fullReward,
        },
      };
    });
  }

  // ✅ scopeType = user (operadora)
  const usersUniverse = userFilterIds.length
    ? userFilterIds.map(String)
    : userKeys;

  return usersUniverse.map((uid) => {
    const sums: Record<string, number> = {};
    for (const b of buckets) {
      const code = String(b?.code || "")
        .trim()
        .toUpperCase();
      if (!code) continue;
      sums[code] = Number(bucketCountsByUser[uid]?.[code] || 0);
    }

    const evalRes = evalCompositionBuckets(buckets, sums, allowPartialReward);
    const fullReward = Number(rule?.rewardAmount || 0);
    const rewardEarned = allowPartialReward
      ? Math.round((fullReward * Number(evalRes.rewardPercent || 0)) / 100)
      : evalRes.achieved
        ? fullReward
        : 0;

    return {
      appliesTo: rule.appliesTo,
      scopeType: rule.scopeType,
      subjectUser: Types.ObjectId.isValid(uid) ? new Types.ObjectId(uid) : null,
      subjectLocalityCode: null,
      subjectDepartmentCode: null,
      subjectTeamId: null,

      progressPercent: evalRes.progressPercent,
      status: evalRes.achieved
        ? "achieved"
        : evalRes.rewardPercent > 0
          ? "partial"
          : null,

      metrics: evalRes.metrics,
      message: evalRes.message,
      evidence: {
        bucketSums: sums,
        rewardPercent: evalRes.rewardPercent,
        rewardEarned,
        rewardFull: fullReward,
      },
    };
  });
};

export default calcRemindersCompositionMonthly;
