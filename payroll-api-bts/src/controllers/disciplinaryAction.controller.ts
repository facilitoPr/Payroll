import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { DisciplinaryAction } from "../model/rrhh/disciplinaryAction";
import User from "../model/account/user";
import PuncHistory from "../model/punch/puncHistory";
import moment from "moment";
import { notifyUsers } from "../services/notification.service";
import {
  getLateWorkSummariesEvidence,
} from "../helper/disciplinary/disciplinary-helpers";
import { getClientIp } from "../helper/token/client-ip";
import { toNum, toStr } from "../helper/parse";

const LATE_GRACE_MINUTES = toNum(process.env.LATE_GRACE_MINUTES);

const isValidObjectId = (id: any) => Types.ObjectId.isValid(String(id));

const formatMinutesHM = (totalMinutes: any) => {
  const m = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;

  if (h > 0 && mm > 0) return `${h}h ${mm}m`;
  if (h > 0) return `${h}h`;
  return `${mm}m`;
};

function parseExpectedDateFromPunch(expected: any, actualDate: Date | null) {
  let expectedDate: Date | null = null;

  // expectedTime: "HH:mm"
  if (typeof expected === "string" && expected.includes(":")) {
    const [hh, mm] = expected.split(":").map((x: string) => parseInt(x, 10));
    expectedDate = new Date(actualDate ?? new Date());
    expectedDate.setHours(hh || 0, mm || 0, 0, 0);
    return expectedDate;
  }

  // expectedTime: Date
  if (expected instanceof Date) {
    expectedDate = new Date(expected);
    return expectedDate;
  }

  return null;
}

function computeMinutesLate(
  expectedDate: Date | null,
  actualDate: Date | null,
) {
  if (!expectedDate || !actualDate) return 0;
  return Math.max(
    0,
    Math.round((actualDate.getTime() - expectedDate.getTime()) / 60000),
  );
}

const buildUserSnapshot = (u: any) => ({
  name: u?.name || "",
  email: u?.email,
  img: u.img || "",
  roleCode: u?.rol?.code || u?.role?.code || u?.rol || u?.role,
  department: u?.department
    ? {
        _id: u.department._id,
        name: u.department.name,
        code: u.department.code,
      }
    : undefined,
  jobPosition: u?.jobPosition
    ? { _id: u.jobPosition._id, name: u.jobPosition.name }
    : undefined,
});

const buildLateArrivalNotes = (args: {
  scope: "DAY" | "RANGE" | string;
  mainYMD: string;
  fromYMD?: string;
  toYMD?: string;
  minutesLate?: number;
  totalMinutesLate?: number;
}) => {
  const base =
    "Te recordamos la importancia de cumplir con los horarios establecidos por la empresa. " +
    "En caso de tener alguna situación particular, por favor comunícala a tu supervisor inmediato.";

  if (args.scope === "RANGE") {
    const total = formatMinutesHM(args.totalMinutesLate);
    return `Se ha detectado un acumulado de ${total} de tardanza del ${args.fromYMD} al ${args.toYMD}. ${base}`;
  }

  const mins = formatMinutesHM(args.minutesLate);
  return `Se ha detectado una tardanza de ${mins} el ${args.mainYMD}. ${base}`;
};

const createDisciplinaryAction = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const actorId = req.user?._id;

    const {
      category = "LATE_ARRIVAL",
      createdVia = "DASHBOARD",
      userId,

      // ✅ notes SÍ puede venir del frontend (para otras categorías)
      notes: notesFromFrontend = "",

      preventDuplicate = true,

      // tardanza:
      workDateString, // DAY
      from, // RANGE
      to, // RANGE
    } = req.body as any;

    // ... tus validaciones ...

    const ip = getClientIp(req);
    let disciplinaryAction: any = null;

    await session.withTransaction(async () => {
      const user = await User.findOne({
        _id: new Types.ObjectId(userId),
        isDeleted: false,
      })
        .populate({ path: "department", select: "name code" })
        .populate({ path: "jobPosition", select: "name" })
        .select("name email department jobPosition rol role")
        .session(session);

      if (!user) throw new Error("Empleado no encontrado");

      // ✅ baseDoc NO fija notes aquí; se define por categoría
      const baseDoc: any = {
        category,
        user: new Types.ObjectId(userId),
        userSnapshot: buildUserSnapshot(user),
        createdBy: new Types.ObjectId(actorId),
        audit: { ip, createdVia },
        isActive: true,
        isDeleted: false,
      };

      // =========================
      // LATE_ARRIVAL (IGNORA notes del frontend)
      // =========================
      if (category === "LATE_ARRIVAL") {
        const ev = await getLateWorkSummariesEvidence({
          userId,
          workDateString,
          from,
          to,
          session,
        });

        const mainYMD = ev.scope === "RANGE" ? ev.toYMD : ev.fromYMD;

        if (preventDuplicate) {
          const dupFilter: any = {
            category: "LATE_ARRIVAL",
            user: new Types.ObjectId(userId),
            isDeleted: false,
          };

          if (ev.scope === "DAY") {
            dupFilter.scope = "DAY";
            dupFilter.workDateString = mainYMD;
          } else {
            dupFilter.scope = "RANGE";
            dupFilter["period.fromDateString"] = ev.fromYMD;
            dupFilter["period.toDateString"] = ev.toYMD;
          }

          const exists = await DisciplinaryAction.findOne(dupFilter)
            .select("_id")
            .session(session);

          if (exists) {
            throw new Error(
              "Ya existe una amonestación de tardanza para ese día/rango",
            );
          }
        }

        // ✅ notes SIEMPRE generado (no usa notesFromFrontend)
        const notes = buildLateArrivalNotes({
          scope: ev.scope,
          mainYMD,
          fromYMD: ev.fromYMD,
          toYMD: ev.toYMD,
          minutesLate:
            ev.scope === "DAY" ? ev.perDay?.[0]?.lateMinutes : undefined,
          totalMinutesLate:
            ev.scope === "RANGE" ? ev.totalLateMinutes : undefined,
        });

        const docLate: any = {
          ...baseDoc,
          notes,

          scope: ev.scope,
          workDateString: mainYMD,
          workDate: moment(mainYMD, "YYYY-MM-DD").startOf("day").toDate(),

          workSummary: ev.scope === "DAY" ? ev.ids[0] : undefined,
          workSummaries: ev.scope === "RANGE" ? ev.ids : undefined,

          period:
            ev.scope === "RANGE"
              ? {
                  fromDateString: ev.fromYMD,
                  toDateString: ev.toYMD,
                  fromDate: ev.start,
                  toDate: ev.end,
                }
              : undefined,

          evidence: {
            graceMinutes: LATE_GRACE_MINUTES,
            calculatedBy: "ADMIN",
            timezone: "America/Santo_Domingo",
            minutesLate:
              ev.scope === "DAY" ? ev.perDay?.[0]?.lateMinutes : undefined,
            totalMinutesLate:
              ev.scope === "RANGE" ? ev.totalLateMinutes : undefined,
            daysCount: ev.scope === "RANGE" ? ev.daysCount : undefined,
          },
        };

        const createdDoc = await DisciplinaryAction.create([docLate], {
          session,
        });
        disciplinaryAction = createdDoc?.[0];
        return;
      }

      // =========================
      // OTRAS CATEGORÍAS (notes puede venir del frontend)
      // =========================
      if (!workDateString)
        throw new Error("workDateString es requerido para esta categoría");

      const ymd = moment(workDateString, ["YYYY-MM-DD", "YYYY/MM/DD"], true);
      if (!ymd.isValid())
        throw new Error("workDateString inválido (YYYY-MM-DD)");

      if (preventDuplicate) {
        const exists = await DisciplinaryAction.findOne({
          category,
          user: new Types.ObjectId(userId),
          workDateString: ymd.format("YYYY-MM-DD"),
          isDeleted: false,
        })
          .select("_id")
          .session(session);

        if (exists) {
          throw new Error(
            "Ya existe una amonestación para este usuario en esa fecha",
          );
        }
      }

      // ✅ aquí sí respetas notes del frontend (y si viene vacío, puedes dejarlo vacío)
      const finalNotes = String(notesFromFrontend || "").trim();

      const docOther: any = {
        ...baseDoc,
        notes: finalNotes, // o puedes poner fallback si quieres
        scope: "DAY",
        workDateString: ymd.format("YYYY-MM-DD"),
        workDate: ymd.startOf("day").toDate(),
      };

      const createdDoc = await DisciplinaryAction.create([docOther], {
        session,
      });
      disciplinaryAction = createdDoc?.[0];
    });

    // ... notify y respuesta ...
    return res.status(201).send({ ok: true, mensaje: "Amonestación creada" });
  } catch (error: any) {
    return res.status(500).send({
      ok: false,
      mensaje: error?.message || "¡Ups! Algo salió mal",
      error,
    });
  } finally {
    session.endSession();
  }
};

const createDisciplinaryActionsBulk = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const actorId = req.user?._id;

    const {
      category = "LATE_ARRIVAL",
      createdVia = "BULK",
      preventDuplicate = true,
      items = [],
    } = req.body as any;

    if (!actorId || !isValidObjectId(actorId)) {
      return res.status(401).send({ ok: false, mensaje: "Sesión inválida" });
    }

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).send({
        ok: false,
        mensaje: "items debe ser un array con al menos 1 elemento",
      });
    }

    // 1) Normaliza/valida ids
    const cleanItems = items
      .map((it: any) => ({
        userId: String(it?.userId || ""),
        punchHistoryId: String(it?.punchHistoryId || ""),
        notes: String(it?.notes || ""),
      }))
      .filter(
        (it: any) =>
          isValidObjectId(it.userId) && isValidObjectId(it.punchHistoryId),
      );

    if (!cleanItems.length) {
      return res.status(400).send({
        ok: false,
        mensaje: "No hay items válidos (userId/punchHistoryId)",
      });
    }

    const ip = getClientIp(req);

    // para notificar después
    const createdActions: any[] = [];
    const skipped: any[] = [];

    await session.withTransaction(async () => {
      // 2) Prefetch PunchHistory (solo tardanzas)
      const punchIds = Array.from(
        new Set(cleanItems.map((x: any) => x.punchHistoryId)),
      ).map((x: string) => new Types.ObjectId(x));

      const punches = await PuncHistory.find({
        _id: { $in: punchIds },
        isLate: true,
        // isDeleted: false,  // si aplica en tu modelo
      })
        .select("_id createdAt expectedTime workSummary user")
        .session(session)
        .lean();

      const punchById = new Map<string, any>();
      for (const p of punches) punchById.set(String(p._id), p);

      // 3) Prefetch Users para snapshot
      const userIds = Array.from(
        new Set(cleanItems.map((x: any) => x.userId)),
      ).map((x: string) => new Types.ObjectId(x));

      const users = await User.find({
        _id: { $in: userIds },
        isDeleted: false,
      })
        .populate({ path: "department", select: "name code" })
        .populate({ path: "jobPosition", select: "name" })
        .select("name email department jobPosition rol role")
        .session(session);

      const userById = new Map<string, any>();
      for (const u of users) userById.set(String(u._id), u);

      // 4) Construye docs candidatos + keys para duplicados
      const candidates: any[] = [];
      const keysWanted: string[] = [];
      const uniqueDates = new Set<string>();

      for (const it of cleanItems) {
        const punch = punchById.get(String(it.punchHistoryId));
        const user = userById.get(String(it.userId));

        if (!punch) {
          skipped.push({
            ...it,
            reason: "PunchHistory no encontrado o no es tardanza (isLate=true)",
          });
          continue;
        }
        if (!user) {
          skipped.push({ ...it, reason: "Usuario no encontrado" });
          continue;
        }

        // opcional: validar que el punch es del mismo user (si tu punch tiene user)
        if (punch.user && String(punch.user) !== String(it.userId)) {
          skipped.push({
            ...it,
            reason: "punchHistoryId no pertenece a ese userId",
          });
          continue;
        }

        const actualDate = punch.createdAt ? new Date(punch.createdAt) : null;
        const workDateString = moment(actualDate ?? new Date()).format(
          "YYYY-MM-DD",
        );
        const expectedDate = parseExpectedDateFromPunch(
          punch.expectedTime,
          actualDate,
        );
        const minutesLate = computeMinutesLate(expectedDate, actualDate);

        const key = `${String(it.userId)}|${workDateString}|${category}`;

        keysWanted.push(key);
        uniqueDates.add(workDateString);

        candidates.push({
          userId: it.userId,
          punchHistoryId: it.punchHistoryId,
          notes: it.notes,
          workDateString,
          expectedDate,
          actualDate,
          minutesLate,
          workSummary: punch.workSummary,
          userDoc: user,
          punchDoc: punch,
        });
      }

      if (!candidates.length) {
        // no creamos nada, pero no tiramos error para que salga skipped
        return;
      }

      // 5) Duplicados (si aplica)
      const existingKeys = new Set<string>();

      if (preventDuplicate) {
        const dateList = Array.from(uniqueDates);

        const existing = await DisciplinaryAction.find({
          category,
          isDeleted: false,
          user: { $in: userIds },
          workDateString: { $in: dateList },
        })
          .select("user workDateString category")
          .session(session)
          .lean();

        for (const e of existing) {
          existingKeys.add(
            `${String(e.user)}|${String(e.workDateString)}|${String(
              e.category,
            )}`,
          );
        }
      }

      // 6) InsertMany
      const docsToInsert: any[] = [];

      for (const c of candidates) {
        const key = `${String(c.userId)}|${String(
          c.workDateString,
        )}|${category}`;

        if (preventDuplicate && existingKeys.has(key)) {
          skipped.push({
            userId: c.userId,
            punchHistoryId: c.punchHistoryId,
            reason: "Duplicado (ya existe ese día)",
          });
          continue;
        }

        // ✅ Aquí usamos workDate medianoche UTC para filtros consistentes
        const workDate = new Date(`${c.workDateString}T00:00:00.000Z`);

        docsToInsert.push({
          category,
          user: new Types.ObjectId(c.userId),
          userSnapshot: buildUserSnapshot(c.userDoc),
          workDateString: c.workDateString,
          workDate,
          evidence: {
            scheduledAt: c.expectedDate ? new Date(c.expectedDate) : undefined,
            actualAt: c.actualDate ? new Date(c.actualDate) : undefined,
            graceMinutes: LATE_GRACE_MINUTES,
            minutesLate: c.minutesLate,
            calculatedBy: "ADMIN",
          },
          workSummary: c.workSummary,
          punchHistory: new Types.ObjectId(c.punchHistoryId), // asegúrate de tenerlo en el schema si lo quieres tipado
          notes: c.notes || "",
          createdBy: new Types.ObjectId(actorId),
          audit: { ip, createdVia },
          isActive: true,
          isDeleted: false,
        });

        if (preventDuplicate && existingKeys.has(key)) {
          throw new Error(
            `Duplicado: userId=${c.userId} date=${c.workDateString}`,
          );
        }
      }

      if (!docsToInsert.length) return;

      const inserted = await DisciplinaryAction.insertMany(docsToInsert, {
        session,
      });
      createdActions.push(...inserted);
    });

    console.log("Created actions", createdActions);
    console.log("Skipped", skipped);

    // 7) Notificaciones (fuera de la transacción, igual que tu versión 1)
    //    (si falla alguna notificación, NO tumba el bulk)

    const response = await Promise.allSettled(
      createdActions.map(async (a: any) => {
        const minutesLate = Number(a?.evidence?.minutesLate || 0);
        const totalHours = Math.floor(minutesLate / 60);
        const totalMinutesRest = minutesLate % 60;

        return notifyUsers({
          type: "DISCIPLINARY_WARNING_CREATED",
          severity: "WARNING",
          title: "Amonestación por tardanza",
          message: `Se ha detectado una tardanza de: ${totalHours}h ${totalMinutesRest}m. Te recordamos la importancia de cumplir con los horarios establecidos por la empresa`,
          entityType: "DisciplinaryAction",
          entityId: a._id,
          recipientUserIds: [String(a.user)],
          createdBy: actorId,
          link: `/my/lateWarnings?id=${String(a._id)}`,
        });
      }),
    );

    console.log(response);

    return res.status(201).send({
      ok: true,
      mensaje: "Proceso bulk finalizado",
      totalCreated: createdActions.length,
      totalSkipped: skipped.length,
      createdActions,
      skipped,
    });
  } catch (error: any) {
    return res.status(500).send({
      ok: false,
      mensaje: error?.message || "¡Ups! Algo salió mal",
      error,
    });
  } finally {
    session.endSession();
  }
};

//
const listDisciplinaryActions = async (req: any, res: Response) => {
  try {
    const {
      limit = "20",
      initial = "0",
      userId,
      category,
      from,
      to,
    } = req.query as any;
    const user = req.user;

    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit)) || 20));
    const initialNum = Math.max(0, parseInt(String(initial)) || 0);

    const filter: any = { isDeleted: false };

    if (category) filter.category = String(category);

    if (userId && isValidObjectId(userId)) {
      filter.user = new Types.ObjectId(userId);
    }

    if (user.rol.code == "EMPLOYEE") {
      filter.user = user._id;
    }

    if (from || to) {
      filter.workDate = {};
      if (from)
        filter.workDate.$gte = new Date(`${String(from)}T00:00:00.000Z`);
      if (to) filter.workDate.$lte = new Date(`${String(to)}T23:59:59.999Z`);
    }

    const [items, total] = await Promise.all([
      DisciplinaryAction.find(filter)
        .sort({ workDate: -1, createdAt: -1 })
        .skip(initialNum)
        .limit(limitNum)
        .lean(),
      DisciplinaryAction.countDocuments(filter),
    ]);

    return res.status(200).send({
      ok: true,
      mensaje: "Listado de amonestaciones",
      items,
      total,
      limit: limitNum,
      initial: initialNum,
    });
  } catch (error: any) {
    return res.status(500).send({
      ok: false,
      mensaje: error?.message || "¡Ups! Algo salió mal",
      error,
    });
  }
};

const getDisciplinaryAction = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).send({ ok: false, mensaje: "id inválido" });
    }

    const doc = await DisciplinaryAction.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    }).lean();

    if (!doc) {
      return res
        .status(404)
        .send({ ok: false, mensaje: "Amonestación no encontrada" });
    }

    return res
      .status(200)
      .send({ ok: true, mensaje: "Detalle", disciplinaryAction: doc });
  } catch (error: any) {
    return res
      .status(500)
      .send({ ok: false, mensaje: "¡Ups! Algo salió mal", error });
  }
};

const acknowledgeDisciplinaryAction = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const actorId = req.user?._id;
    const { id } = req.params;
    const { acknowledgeNotes = "" } = req.body as any;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).send({ ok: false, mensaje: "id inválido" });
    }

    const updated = await session.withTransaction(async () => {
      const doc = await DisciplinaryAction.findOne({
        _id: new Types.ObjectId(id),
        isDeleted: false,
      }).session(session);

      if (!doc) throw new Error("Amonestación no encontrada");

      // Solo el dueño o roles altos (si quieres)
      const roleCode = toStr(req.user?.rol?.code || req.user?.role?.code || "");
      const isAdmin = ["ADMIN", "SUPERADMIN", "RRHH"].includes(
        roleCode.toUpperCase(),
      );

      if (String(doc.user) !== String(actorId) && !isAdmin) {
        throw new Error("No autorizado");
      }

      doc.acknowledgedAt = new Date();
      doc.acknowledgedBy = new Types.ObjectId(actorId);
      doc.acknowledgeNotes = acknowledgeNotes;

      await doc.save({ session });
      return doc;
    });

    return res.status(200).send({
      ok: true,
      mensaje: "Amonestación acusada",
      disciplinaryAction: updated,
    });
  } catch (error: any) {
    return res.status(500).send({
      ok: false,
      mensaje: error?.message || "¡Ups! Algo salió mal",
      error,
    });
  } finally {
    session.endSession();
  }
};

const deleteDisciplinaryAction = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).send({ ok: false, mensaje: "id inválido" });
    }

    // Permisos (ajusta a tu gusto)
    const roleCode = toStr(req.user?.rol?.code || req.user?.role?.code || "");
    const isAdmin = ["ADMIN", "SUPERADMIN", "RRHH"].includes(
      roleCode.toUpperCase(),
    );
    if (!isAdmin) {
      return res.status(403).send({ ok: false, mensaje: "No autorizado" });
    }

    await session.withTransaction(async () => {
      const doc = await DisciplinaryAction.findOne({
        _id: new Types.ObjectId(id),
        isDeleted: false,
      }).session(session);

      if (!doc) throw new Error("Amonestación no encontrada");

      doc.isDeleted = true;
      doc.isActive = false;

      await doc.save({ session });
    });

    return res
      .status(200)
      .send({ ok: true, mensaje: "Amonestación eliminada" });
  } catch (error: any) {
    return res.status(500).send({
      ok: false,
      mensaje: error?.message || "¡Ups! Algo salió mal",
      error,
    });
  } finally {
    session.endSession();
  }
};

export {
  createDisciplinaryAction,
  createDisciplinaryActionsBulk,
  listDisciplinaryActions,
  getDisciplinaryAction,
  acknowledgeDisciplinaryAction,
  deleteDisciplinaryAction,
};
