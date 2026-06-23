import { Response } from "express";
import { Types } from "mongoose";
import IncentiveAchievement from "../../model/incentive/incentiveAchievement";
import { getCurrentMonth, isValidMonth } from "../../helper/incentives/month";
import IncentiveRecalcLock from "../../model/incentive/incentiveRecalcLock";
import {
  buildMonthMeta,
  recalcMonth,
} from "../../services/incentive/incentiveEngine.service";
import User from "../../model/account/user";
import IncentiveProgram from "../../model/incentive/incentiveProgram";
import IncentiveRule from "../../model/incentive/incentiveRule";
import { buildMonthCondition } from "../../services/incentive/calculators/calcAttendancePerfectMonthly";
import WorkSummary from "../../model/punch/workSummary";
import moment from "moment";
import {
  buildRemindersMonthMatch,
  normalizeCompositionBuckets,
} from "../../services/incentive/calculators/calcRemindersCompositionMonthly";
import IncentiveScopeSnapshot from "../../model/incentive/incentiveScopeSnapshot";
import Reminders from "../../model/reminders";
import {
  buildAttendedMatch,
  buildMonthConditionFlexible,
} from "../../helper/incentives/reminders";
import { toNum } from "../../helper/parse";

const requireManagerOrSuperAdmin = (req: any, res: Response) => {
  const user = req.user;
  if (!user?.isManager && !user?.isSuperAdmin) {
    res.status(403).json({ ok: false, mensaje: "No autorizado." });
    return false;
  }
  return true;
};

function splitCsv(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v))
    return v.map(String).flatMap((x) => String(x).split(","));
  return String(v)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseObjectIdOrFail(id: any, label = "id") {
  const s = String(id || "").trim();
  if (!Types.ObjectId.isValid(s)) {
    return {
      ok: false as const,
      mensaje: `${label} inválido: ${s || "vacío"}`,
    };
  }
  return { ok: true as const, value: new Types.ObjectId(s) };
}

function parseObjectIdArrayOrFail(ids: any, label = "ids") {
  const arr = splitCsv(ids);
  if (!arr.length) return { ok: true as const, value: [] as Types.ObjectId[] };

  const out: Types.ObjectId[] = [];
  for (const s0 of arr) {
    const s = String(s0 || "").trim();
    if (!Types.ObjectId.isValid(s)) {
      return {
        ok: false as const,
        mensaje: `${label} contiene un ObjectId inválido: ${s}`,
      };
    }
    out.push(new Types.ObjectId(s));
  }
  return { ok: true as const, value: out };
}

function parseScopeType(v: any) {
  const s = String(v || "").trim();
  if (!s) return null;
  const allowed = new Set(["user", "locality", "department", "team"]);
  if (!allowed.has(s)) return "__INVALID__";
  return s;
}

const getMyAchievementsByMonth = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    const month = String(req.query.month || "").trim();
    const programCode = "INCENTIVOS_OPERADORES";

    if (!isValidMonth(month)) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "month inválido (YYYY-MM)." });
    }

    const isCurrentMonth = month === getCurrentMonth();
    const program = await IncentiveProgram.findOne({
      code: programCode,
      isActive: true,
      isDeleted: false,
    })
      .select("_id")
      .lean();

    if (!program) {
      return res.status(400).send({
        ok: false,
        mensaje: `Programa de incentivo code=${programCode} no existe`,
      });
    }

    // TTL (minutos) para recalcular en mes actual
    // const ttlMinutes = Number(process.env.INC_ACHIEVEMENTS_TTL_MINUTES || 20);
    // const ttlMs = Math.max(1, ttlMinutes) * 60 * 1000;
    const ttlMs = 0;

    // Resolver localityCode (Zone.code) del usuario (para achievements scopeType=locality)
    const me = await User.findById(userId)
      .populate({ path: "zone", select: "code" })
      .select("_id zone")
      .lean();

    const localityCode = String((me as any)?.zone?.code || "").trim() || null;

    // Query: achievements del usuario + (opcional) locality del usuario
    const baseQ: any = {
      month,
      isDeleted: false,
    };
    if (program._id) baseQ.program = new Types.ObjectId(program._id);

    // Incluye logros del usuario y logros del equipo (locality) si existen
    baseQ.$or = [
      { subjectUser: new Types.ObjectId(userId) },
      ...(localityCode
        ? [{ scopeType: "locality", subjectLocalityCode: localityCode }]
        : []),
    ];

    // ¿Hay data y está fresca?
    const newest = await IncentiveAchievement.findOne(baseQ)
      .sort({ updatedAt: -1 })
      .select("updatedAt")
      .lean();

    const isStale =
      isCurrentMonth &&
      (!newest?.updatedAt ||
        Date.now() - new Date(newest.updatedAt).getTime() > ttlMs);

    // const isStale = true;

    // ✅ Solo auto-recalcular mes actual (mes pasado se “cierra” con cron mensual)
    if (isStale) {
      // Lock para evitar doble recálculo simultáneo por usuario/programa/mes
      // const lockKey = `inc:my:${month}:${program._id || "all"}:${userId}:${localityCode || "nozone"}`;
      // const lockMs = 60 * 1000; // 1 min (suficiente)
      // const expiresAt = new Date(Date.now() + lockMs);

      let acquired = false;
      // try {
      //   await IncentiveRecalcLock.create({ key: lockKey, expiresAt });
      //   acquired = true;
      // } catch (e: any) {
      //   // si ya existe lock, otro request lo está calculando ahora mismo
      //   acquired = false;
      // }

      // if (acquired) {
      // 🔥 Recalcula SOLO lo necesario (usuario + su locality)
      const response = await recalcMonth({
        month,
        programId: String(program._id) || null,
        userIds: [String(userId)],
        // localityCodes: localityCode ? [localityCode] : null, // 👈 nuevo (ver engine abajo)
        actorUserId: String(userId),
        // excludeRuleTypes: ["leaderboard"], // 👈 para que "Mis metas" sea rápida (leaderboard lo maneja cron)
      });

      console.log(response, `RECALCULO INCENTIVO A: ${userId}`);
      // }
    }

    const achievements = await IncentiveAchievement.find(baseQ)
      .populate({
        path: "rule",
        select:
          "name code ui deliveryChannel rewardKind rewardAmount rewardCurrency rewardLabel ruleType metricSource scopeType appliesTo",
      })
      .populate({ path: "program", select: "name code" })
      .sort({ "rule.displayOrder": 1, createdAt: 1 })
      .lean();

    return res.status(200).send({ ok: true, achievements });
  } catch (error) {
    console.error("getMyAchievementsByMonth error:", error);
    return res
      .status(500)
      .send({ ok: false, mensaje: "Error cargando metas." });
  }
};

const getIncentiveAchievementsManager = async (req: any, res: Response) => {
  try {
    const month = String(req.query.month || "").trim();
    const programId = String(req.query.programId || "").trim() || null;
    const status = String(req.query.status || "").trim() || null;

    const scopeTypeRaw = parseScopeType(req.query.scopeType);
    if (scopeTypeRaw === "__INVALID__") {
      return res.status(400).send({
        ok: false,
        mensaje: "scopeType inválido. Usa: user, locality, department, team",
      });
    }
    const scopeType = scopeTypeRaw; // null | "user" | "locality" | ...

    if (!isValidMonth(month)) {
      return res.status(400).send({
        ok: false,
        mensaje: `Mes inválido: ${month}. Debe ser YYYY-MM`,
      });
    }

    // Pagination (opcional)
    const limitRaw = toNum(req.query.limit, 500); // por defecto alto para tu UI actual
    const initialRaw = toNum(req.query.initial, 0);

    const limit = Math.min(Math.max(limitRaw, 1), 2000);
    const initial = Math.max(initialRaw, 0);

    // Filtros: userIds / localityCodes
    const userIdsResp = parseObjectIdArrayOrFail(req.query.userIds, "userIds");
    if (!userIdsResp.ok) {
      return res.status(400).send({ ok: false, mensaje: userIdsResp.mensaje });
    }

    const localityCodes = splitCsv(req.query.localityCodes)
      .map((x) => String(x).trim())
      .filter(Boolean);

    // ProgramId
    let programObjectId: Types.ObjectId | null = null;
    if (programId) {
      const pid = parseObjectIdOrFail(programId, "programId");
      if (!pid.ok)
        return res.status(400).send({ ok: false, mensaje: pid.mensaje });
      programObjectId = pid.value;
    }

    // -----------------------------
    // Query base
    // -----------------------------
    const q: any = {
      isDeleted: false,
      // si tú manejas isActive en achievements, deja esto:
      // isActive: true,
      month,
    };

    if (programObjectId) q.program = programObjectId;
    if (status) q.status = status;
    if (scopeType) q.scopeType = scopeType;

    // Si mandan userIds, filtramos subjectUser (aunque scopeType sea all)
    if (userIdsResp.value.length) {
      q.subjectUser = { $in: userIdsResp.value };
    }

    // Si mandan localityCodes, filtramos subjectLocalityCode
    if (localityCodes.length) {
      q.subjectLocalityCode = { $in: localityCodes };
    }

    // -----------------------------
    // DB
    // -----------------------------
    const total = await IncentiveAchievement.countDocuments(q);

    const achievements = await IncentiveAchievement.find(q)
      .sort({
        // primero metas por user, luego locality (si lo deseas cambia orden)
        scopeType: 1,
        subjectLocalityCode: 1,
        subjectUser: 1,
        "rule.displayOrder": 1, // (no siempre aplica porque es populate)
        createdAt: 1,
      })
      .skip(initial)
      .limit(limit)
      .populate({
        path: "rule",
        select:
          "name code ui metricSource ruleType scopeType appliesTo deliveryChannel rewardKind rewardAmount rewardCurrency rewardLabel displayOrder",
      })
      .populate({ path: "program", select: "name code" })
      .populate({
        path: "subjectUser",
        select: "name email username zone department img",
        populate: [
          { path: "zone", select: "code name" },
          { path: "department", select: "code name" },
        ],
      })
      .lean();

    return res.status(200).send({
      ok: true,
      achievements,
      pagination: {
        total,
        limit,
        initial,
        page: Math.floor(initial / limit) + 1,
        pages: limit > 0 ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (error: any) {
    console.error("getIncentiveAchievementsManager error:", error);
    return res.status(500).send({
      ok: false,
      mensaje: "Error cargando metas del equipo.",
    });
  }
};

const updateAchievementStatus = async (req: any, res: Response) => {
  try {
    if (!requireManagerOrSuperAdmin(req, res)) return;

    const { id } = req.params;
    const { status, payrollIncluded } = req.body || {};

    const allowed = [
      "in_progress",
      "achieved",
      "not_achieved",
      "approved",
      "delivered",
    ];
    if (!allowed.includes(String(status))) {
      return res.status(400).json({ ok: false, mensaje: "status inválido." });
    }

    const ach = await IncentiveAchievement.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!ach) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Achievement no encontrado." });
    }

    ach.status = status;
    if (payrollIncluded !== undefined) ach.payrollIncluded = !!payrollIncluded;

    ach.updatedBy = req.user?._id;

    await ach.save();

    return res.status(200).json({
      ok: true,
      mensaje: "Achievement actualizado",
      achievement: ach,
    });
  } catch (error) {
    console.log("updateAchievementStatus error:", error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "¡Ups! Algo salió mal", error });
  }
};

const getAttendanceBreakdown = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { month, ruleId } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(String(month))) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "month inválido (YYYY-MM)" });
    }
    if (!ruleId || !Types.ObjectId.isValid(String(ruleId))) {
      return res.status(400).send({ ok: false, mensaje: "ruleId inválido" });
    }
    if (!userId || !Types.ObjectId.isValid(String(userId))) {
      return res.status(401).send({ ok: false, mensaje: "No autenticado" });
    }

    const rule = await IncentiveRule.findOne({
      _id: new Types.ObjectId(String(ruleId)),
      isDeleted: false,
      isActive: true,
    })
      .select("config metricSource")
      .lean();

    if (!rule) {
      return res
        .status(404)
        .send({ ok: false, mensaje: "Regla no encontrada" });
    }

    if (rule.metricSource !== "attendance") {
      return res
        .status(400)
        .send({ ok: false, mensaje: "Esta regla no es de attendance" });
    }

    const meta = buildMonthMeta(String(month)); // tu función (con start/end)
    const monthCond = buildMonthCondition({
      Model: WorkSummary,
      field: "date",
      meta,
      stringPrefix: meta.prefixYMDDash,
    });

    const cfg = rule.config || {};
    const requireNoLate = cfg?.exclude?.late !== false;
    const excludeLicense = cfg?.exclude?.license !== false; // o soporta medicalLeave también
    const minEligibleDays = Number(cfg?.minEligibleDays || 0);

    const rows = await WorkSummary.find({
      user: new Types.ObjectId(String(userId)),
      ...monthCond,
      isDeleted: false,
    })
      .select("date dateString classification isLate lateTime totalMinutes")
      .sort({ date: 1 })
      .lean();

    // console.log(rows, "Rows")

    const days = (rows || []).map((r: any) => {
      const classification = String(r?.classification || "");
      const isLicense = excludeLicense
        ? classification !== "Trabajo regular"
        : false;

      const totalMinutes = Number(r?.totalMinutes || 0);
      const minutesLabel = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
      const isAbsent = totalMinutes === 0;

      const lateTime = Number(r?.lateTime || 0);
      const isLate = !!(r?.isLate || lateTime > 0);

      return {
        date: r.dateString,
        classification,
        totalMinutes,
        minutesLabel,
        isAbsent,
        isLate,
        lateTime,
        isExcluded: isLicense, // excluido por licencia
      };
    });

    // console.log(days);

    const eligibleDays = days.length;
    const excludedLicenses = days.filter((d: any) => d.isExcluded).length;

    const effectiveEligible = Math.max(
      0,
      eligibleDays - (excludeLicense ? excludedLicenses : 0),
    );

    const lateDays = requireNoLate
      ? days.filter((d: any) => !d.isExcluded && d.isLate).length
      : 0;

    const absentDays = days.filter(
      (d: any) => !d.isExcluded && d.isAbsent,
    ).length;

    const ok =
      effectiveEligible > 0 &&
      (!minEligibleDays || effectiveEligible >= minEligibleDays) &&
      (!requireNoLate || lateDays === 0) &&
      absentDays === 0;

    return res.status(200).send({
      ok: true,
      month,
      ruleId,
      summary: {
        eligibleDays,
        excludedLicenses,
        effectiveEligible,
        lateDays,
        absentDays,
        requireNoLate,
        excludeLicense,
        minEligibleDays,
        achieved: ok,
      },
      days,
    });
  } catch (error: any) {
    console.error("getAttendanceBreakdown error:", error);
    return res
      .status(500)
      .send({ ok: false, mensaje: "Error obteniendo desglose." });
  }
};

const getRemindersBucketBreakdown = async (req: any, res: Response) => {
  try {
    const {
      month,
      ruleId,
      bucketCode,
      page = 1,
      limit = 20,
      subjectUserId,
      subjectLocalityCode,
    } = req.query as any;

    if (!month || !isValidMonth(month)) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "month inválido (YYYY-MM)" });
    }
    if (!ruleId || !Types.ObjectId.isValid(String(ruleId))) {
      return res.status(400).send({ ok: false, mensaje: "ruleId inválido" });
    }
    const bucketKey = String(bucketCode || "")
      .trim()
      .toUpperCase();
    if (!bucketKey) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "bucketCode requerido" });
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(5, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // cargar regla para leer config (dateField + buckets)
    const rule = await IncentiveRule.findOne({
      _id: new Types.ObjectId(String(ruleId)),
      isDeleted: false,
      isActive: true,
    })
      .select("program config metricSource ruleType scopeType")
      .lean();

    if (!rule) {
      return res
        .status(404)
        .send({ ok: false, mensaje: "Regla no encontrada" });
    }
    if (rule.metricSource !== "reminders" || rule.ruleType !== "composition") {
      return res
        .status(400)
        .send({ ok: false, mensaje: "Esta regla no es reminders/composition" });
    }

    const cfg = rule.config || {};
    const dateField =
      cfg.dateField === "date" ? "date" : "createdByOperatorDate";
    const buckets = normalizeCompositionBuckets(cfg);

    const bucket = buckets.find((b: any) => b.code === bucketKey);
    if (!bucket) {
      return res
        .status(404)
        .send({ ok: false, mensaje: `Bucket no existe: ${bucketKey}` });
    }

    // Resolver universo de users para filtrar
    let userIds: Types.ObjectId[] = [];

    if (subjectUserId && Types.ObjectId.isValid(String(subjectUserId))) {
      // Seguridad: si no eres admin/manager, solo puedes ver tu propio userId
      const me = String(req.user?._id || "");
      const requested = String(subjectUserId);
      const canViewOther =
        req.user?.rol.code == "ADMIN" ||
        req.user?.rol.code == "SUPERADMIN" ||
        req.user?.department.code == "RRHH" ||
        !!req.user?.isManager;
      if (!canViewOther && me !== requested) {
        return res
          .status(403)
          .send({ ok: false, mensaje: "No autorizado para ver otro usuario." });
      }

      userIds = [new Types.ObjectId(requested)];
    } else if (subjectLocalityCode) {
      const code = String(subjectLocalityCode || "").trim();
      const snap = await IncentiveScopeSnapshot.findOne({
        program: rule.program,
        month,
        scopeType: "locality",
        subjectLocalityCode: code,
        isDeleted: false,
        isActive: true,
      })
        .select("memberUserIds")
        .lean();

      const members = (snap as any)?.memberUserIds || [];
      userIds = members
        .map((x: any) => String(x))
        .filter((x: string) => Types.ObjectId.isValid(x))
        .map((x: string) => new Types.ObjectId(x));
    } else {
      return res.status(400).send({
        ok: false,
        mensaje: "Debes enviar subjectUserId o subjectLocalityCode.",
      });
    }

    const meta = buildMonthMeta(month);

    const match: any = {
      isDeleted: false,
      user: { $in: userIds },
      ...buildRemindersMonthMatch(meta, dateField),
    };

    // aplicar bucket filter EXACTO igual al cálculo
    if (bucket.marksAnyOf?.length) {
      match.marks = { $in: bucket.marksAnyOf };
    }

    if (bucket.excludedMarks?.length) {
      match.marks = { $nin: bucket.excludedMarks };
    }

    // if (bucket.noMarks) {
    //   match.$or = [
    //     { marks: { $exists: false } },
    //     { marks: { $size: 0 } },
    //     { marks: null },
    //   ];
    // }

    const [total, rows] = await Promise.all([
      Reminders.countDocuments(match),
      Reminders.find(match)
        .select(
          "note patient zone user date hour marks status statusCompleted comercial createdByOperatorDate img",
        )
        .populate({
          path: "comercial",
          select: "MemberFullname memberIdentificationNumber HomePhone",
        })
        .populate({ path: "zone", select: "name code" })
        .populate({ path: "user", select: "name email" })
        .populate({ path: "status", select: "name code color" })
        .sort({ createdByOperatorDate: -1, hour: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return res.status(200).send({
      ok: true,
      month,
      ruleId,
      dateField,
      bucket: {
        code: bucket.code,
        label: bucket.label,
        minCount: bucket.minCount,
        marksAnyOf: bucket.marksAnyOf,
        noMarks: bucket.noMarks,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      reminders: rows,
    });
  } catch (error: any) {
    console.error("getRemindersBucketBreakdown error:", error);
    return res
      .status(500)
      .send({ ok: false, mensaje: "Error obteniendo citas del bucket." });
  }
};

const getRemindersAttendedBreakdown = async (req: any, res: Response) => {
  try {
    const month = String(req.query.month || "").trim();
    const ruleId = String(req.query.ruleId || "").trim();

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const subjectUserId = String(req.query.subjectUserId || "").trim();
    const subjectLocalityCode = String(
      req.query.subjectLocalityCode || "",
    ).trim();

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "month inválido (YYYY-MM)" });
    }
    if (!Types.ObjectId.isValid(ruleId)) {
      return res.status(400).send({ ok: false, mensaje: "ruleId inválido" });
    }

    const rule = await IncentiveRule.findOne({
      _id: new Types.ObjectId(ruleId),
      isDeleted: false,
    }).lean();

    if (!rule) {
      return res.status(404).send({ ok: false, mensaje: "Rule no encontrada" });
    }

    // debe ser reminders count (tu caso 240)
    if (!(rule.metricSource === "reminders" && rule.ruleType === "count")) {
      return res.status(409).send({
        ok: false,
        mensaje:
          "Esta regla no es reminders/count (no aplica breakdown attended).",
      });
    }

    const meta = buildMonthMeta(month);

    const cfg: any = rule.config || {};
    const dateField =
      cfg.dateField === "createdByOperatorDate"
        ? "createdByOperatorDate"
        : "date";

    const attendedDef = cfg.attendedDefinition || {};
    const attendedMatchExtra = await buildAttendedMatch(attendedDef);

    // month condition
    const monthCond = buildMonthConditionFlexible({
      Model: Reminders,
      field: dateField,
      meta,
      stringPrefix: meta.prefixYMDSlash, // "YYYY/MM"
    });

    // scope filter: user o locality
    let userIdsToMatch: Types.ObjectId[] | null = null;

    if (subjectUserId && Types.ObjectId.isValid(subjectUserId)) {
      userIdsToMatch = [new Types.ObjectId(subjectUserId)];
    } else if (subjectLocalityCode) {
      const snap = await IncentiveScopeSnapshot.findOne({
        program: rule.program,
        month,
        scopeType: "locality",
        subjectLocalityCode,
        isDeleted: false,
        isActive: true,
      })
        .select("memberUserIds")
        .lean();

      const members = (snap?.memberUserIds || [])
        .map((x: any) => String(x))
        .filter((x: string) => Types.ObjectId.isValid(x))
        .map((x: string) => new Types.ObjectId(x));

      userIdsToMatch = members.length ? members : [];
    }

    const match: any = {
      isDeleted: false,
      user: { $ne: null },
      ...monthCond,
      ...attendedMatchExtra,
    };

    if (userIdsToMatch) {
      match.user = userIdsToMatch.length ? { $in: userIdsToMatch } : "__none__";
    }

    const [total, reminders] = await Promise.all([
      Reminders.countDocuments(match),
      Reminders.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "user", select: "name" })
        .populate({ path: "zone", select: "name code" })
        .populate({
          path: "comercial",
          select: "MemberFullname memberIdentificationNumber HomePhone",
        })
        .select("date createdByOperatorDate hour marks zone comercial user")
        .lean(),
    ]);

    return res.status(200).send({
      ok: true,
      month,
      ruleId,
      dateField,
      attendedDefinition: attendedDef,
      reminders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("getRemindersAttendedBreakdown error:", error);
    return res
      .status(500)
      .send({ ok: false, mensaje: "Error al cargar el detalle de citas" });
  }
};

export {
  getMyAchievementsByMonth,
  getIncentiveAchievementsManager,
  updateAchievementStatus,
  getAttendanceBreakdown,
  getRemindersBucketBreakdown,
  getRemindersAttendedBreakdown,
};
