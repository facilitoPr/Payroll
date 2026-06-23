import { Response } from "express";
import mongoose, { isValidObjectId, Types } from "mongoose";
import IncentiveScopeSnapshot from "../model/incentive/incentiveScopeSnapshot";
import User from "../model/account/user";
import Zones from "../model/zones";
import {
  runAutoAssignmentForMonth,
  assertMonthOrThrow,
} from "../services/zonesTeams.service";
import IncentiveProgram from "../model/incentive/incentiveProgram";
import Department from "../model/rrhh/department";

// Ajusta tu tipo real:
type AuthRequest = any;

const getAssignmentsByMonth = async (req: AuthRequest, res: Response) => {
  try {
    const month = assertMonthOrThrow(String(req.query.month || ""));

    const snaps = await IncentiveScopeSnapshot.find({
      month,
      scopeType: "locality",
      isDeleted: false,
    })
      .select("subjectLocalityCode memberUserIds")
      .lean();

    const department = await Department.findOne({
      isActive: true,
      isDeleted: false,
      code: "TRIPLE_S",
    })
      .select("_id managers")
      .lean();

    if (!department) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "Departamento TRIPLE_S no válido" });
    }

    // zones por code
    const codes = Array.from(
      new Set(
        snaps
          .map((s: any) => String(s.subjectLocalityCode || ""))
          .filter(Boolean),
      ),
    );

    const zones = await Zones.find({ code: { $in: codes } })
      .select("_id name code")
      .lean();

    const zoneByCode = new Map<string, any>();
    for (const z of zones) zoneByCode.set(String(z.code), z);

    // users por ids
    const userIds = Array.from(
      new Set(
        snaps
          .flatMap((s: any) =>
            (s.memberUserIds || []).map((x: any) => String(x)),
          )
          .filter(Boolean),
      ),
    );

    const users = await User.find({
      _id: { $in: userIds },
      // isActived: true,
      isDeleted: false,
      department: department._id,
    })
      .select("_id name email img image")
      .lean();

    const userById = new Map<string, any>();
    for (const u of users) userById.set(String(u._id), u);

    const assignments: any[] = [];
    for (const s of snaps) {
      const zone = zoneByCode.get(String(s.subjectLocalityCode)) || null;
      for (const uid of s.memberUserIds || []) {
        const user = userById.get(String(uid));
        if (!user) continue;
        assignments.push({ user, zone });
      }
    }

    return res.status(200).send({ ok: true, assignments });
  } catch (e: any) {
    return res.status(500).send({
      ok: false,
      mensaje: e?.message || "Error cargando asignaciones del mes.",
    });
  }
};

const runAutoAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const month = assertMonthOrThrow(String(req.body?.month || ""));

    const program = await IncentiveProgram.findOne({
      code: "INCENTIVOS_OPERADORES",
      isDeleted: false,
      isActive: true,
    });

    if (!program) {
      return res.status(400).send({
        ok: false,
        mensaje: "Program INCENTIVOS_OPERADORES no existe",
      });
    }

    const force = !!req.body?.force;
    const updateUsersZone = req.body?.updateUsersZone !== false;

    const r = await runAutoAssignmentForMonth({
      month,
      programId: String(program._id),
      createdBy: req.user?._id || null,
      force,
      updateUsersZone,
    });

    return res.status(r.status).send({
      ok: r.ok,
      mensaje: r.mensaje,
      ...(r.data ? { data: r.data } : {}),
      ...(r.details ? { details: r.details } : {}),
    });
  } catch (e: any) {
    return res.status(500).send({
      ok: false,
      mensaje: e?.message || "Error ejecutando corrida.",
    });
  }
};

function buildMonthListFromNow(months: number) {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}`);
  }
  return out;
}

const getUserHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.query.userId || "").trim();
    const monthsRaw = Number(req.query.months || 12);
    const months = Math.min(Math.max(monthsRaw, 1), 60);

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).send({ ok: false, mensaje: "userId inválido." });
    }

    const monthList = buildMonthListFromNow(months);

    const snaps = await IncentiveScopeSnapshot.find({
      scopeType: "locality",
      isDeleted: false,
      month: { $in: monthList },
      memberUserIds: userId, // multikey
    })
      .select("month subjectLocalityCode")
      .lean();

    // map month -> zoneCode
    const codeByMonth = new Map<string, string>();
    for (const s of snaps) {
      const m = String(s.month);
      const code = String(s.subjectLocalityCode || "");
      if (!m) continue;
      if (!codeByMonth.has(m)) codeByMonth.set(m, code);
    }

    const codes = Array.from(
      new Set(Array.from(codeByMonth.values()).filter(Boolean)),
    );

    const zones = await Zones.find({ code: { $in: codes } })
      .select("_id name code")
      .lean();

    const zoneByCode = new Map<string, any>();
    for (const z of zones) zoneByCode.set(String(z.code), z);

    // responder en orden DESC (más reciente primero)
    const history = monthList.map((m) => {
      const code = codeByMonth.get(m) || null;
      const zone = code ? zoneByCode.get(code) || null : null;
      return { month: m, zone };
    });

    return res.status(200).send({ ok: true, history });
  } catch (e: any) {
    return res.status(500).send({
      ok: false,
      mensaje: e?.message || "Error cargando historial.",
    });
  }
};

const setManualAssignment = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const month = assertMonthOrThrow(String(req.body?.month || ""));

    const userId = String(req.body?.userId || "").trim();
    const zoneId = req.body?.zoneId ? String(req.body.zoneId).trim() : null;
    const zoneCodeRaw = req.body?.zoneCode
      ? String(req.body.zoneCode).trim()
      : null;

    const updateUsersZone = req.body?.updateUsersZone !== false;

    if (!userId || !isValidObjectId(userId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ ok: false, mensaje: "userId inválido." });
    }

    const program = await IncentiveProgram.findOne({
      code: "INCENTIVOS_OPERADORES",
      isDeleted: false,
      isActive: true,
    })
      .select("_id")
      .session(session)
      .lean();

    if (!program) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({
        ok: false,
        mensaje: "Program INCENTIVOS_OPERADORES no existe",
      });
    }

    const department = await Department.findOne({
      isActive: true,
      isDeleted: false,
      code: "TRIPLE_S",
    })
      .select("_id")
      .session(session)
      .lean();

    if (!department) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({
        ok: false,
        mensaje: "Departamento TRIPLE_S no válido",
      });
    }

    // validar usuario (solo TRIPLE_S)
    const user = await User.findOne({
      _id: userId,
      isDeleted: false,
      department: department._id,
    })
      .select("_id name email zone")
      .session(session)
      .lean();

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({
        ok: false,
        mensaje: "Empleado no encontrado o no pertenece a TRIPLE_S.",
      });
    }

    // Resolver zona destino (puede ser null => sin asignar)
    let zone: any = null;

    if (zoneId) {
      if (!isValidObjectId(zoneId)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).send({ ok: false, mensaje: "zoneId inválido." });
      }

      zone = await Zones.findOne({
        _id: zoneId,
        isDeleted: false,
        isActived: true,
      })
        .select("_id name code")
        .session(session)
        .lean();
    } else if (zoneCodeRaw) {
      zone = await Zones.findOne({
        code: zoneCodeRaw,
        isDeleted: false,
        isActived: true,
      })
        .select("_id name code")
        .session(session)
        .lean();
    }

    if ((zoneId || zoneCodeRaw) && !zone) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({
        ok: false,
        mensaje: "Zona no válida o inactiva.",
      });
    }

    const userObjId = new Types.ObjectId(userId);

    // Snapshot anterior (si existe)
    const prevSnap = await IncentiveScopeSnapshot.findOne({
      program: program._id,
      month,
      scopeType: "locality",
      isDeleted: false,
      memberUserIds: userObjId,
    })
      .select("subjectLocalityCode")
      .session(session)
      .lean();

    const fromZoneCode = prevSnap?.subjectLocalityCode
      ? String(prevSnap.subjectLocalityCode)
      : null;

    // 1) Sacar el user de cualquier snapshot del mes (por seguridad)
    await IncentiveScopeSnapshot.updateMany(
      {
        program: program._id,
        month,
        scopeType: "locality",
        isDeleted: false,
        memberUserIds: userObjId,
      },
      {
        $pull: { memberUserIds: userObjId },
        $set: { updatedBy: req.user?._id || null },
      },
      { session },
    );

    // 2) Meterlo en la zona destino (si aplica)
    let toZoneCode: string | null = null;

    if (zone?.code) {
      toZoneCode = String(zone.code);

      await IncentiveScopeSnapshot.findOneAndUpdate(
        {
          program: program._id,
          month,
          scopeType: "locality",
          subjectLocalityCode: toZoneCode,
          isDeleted: false,
        },
        {
          $setOnInsert: {
            program: program._id,
            month,
            scopeType: "locality",
            subjectLocalityCode: toZoneCode,
            createdBy: req.user?._id || null,
            // isActive: true,
            isDeleted: false,
          },
          $set: {
            updatedBy: req.user?._id || null,
            // isActive: true,
          },
          $addToSet: { memberUserIds: userObjId },
        },
        { new: true, upsert: true, session },
      );
    }

    // 3) Recalcular membersCount en snapshots afectados (from/to)
    const orList: any[] = [];
    if (fromZoneCode) orList.push({ subjectLocalityCode: fromZoneCode });
    if (toZoneCode && toZoneCode !== fromZoneCode)
      orList.push({ subjectLocalityCode: toZoneCode });

    if (orList.length) {
      const affected = await IncentiveScopeSnapshot.find({
        program: program._id,
        month,
        scopeType: "locality",
        isDeleted: false,
        $or: orList,
      })
        .select("_id")
        .session(session)
        .lean();

      const ids = affected.map((x: any) => x._id);

      if (ids.length) {
        await IncentiveScopeSnapshot.updateMany(
          { _id: { $in: ids } },
          [{ $set: { membersCount: { $size: "$memberUserIds" } } }],
          { session },
        );
      }
    }

    // 4) (Opcional) reflejarlo en User.zone
    if (updateUsersZone) {
      await User.updateOne(
        { _id: userObjId },
        { $set: { zone: zone?._id || null } },
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).send({
      ok: true,
      mensaje: "Asignación actualizada.",
      data: {
        month,
        userId,
        fromZoneCode,
        toZone: zone
          ? { _id: zone._id, name: zone.name, code: zone.code }
          : null,
      },
    });
  } catch (e: any) {
    console.log(e);
    try {
      await session.abortTransaction();
    } catch {}
    session.endSession();

    return res.status(500).send({
      ok: false,
      mensaje: e?.message || "Error actualizando asignación.",
    });
  }
};

export {
  getAssignmentsByMonth,
  runAutoAssignment,
  getUserHistory,
  setManualAssignment,
};
