import mongoose, { Types, isValidObjectId } from "mongoose";
import IncentiveScopeSnapshot from "../model/incentive/incentiveScopeSnapshot";
import User from "../model/account/user";
import Rol from "../model/role";
import Zones from "../model/zones";
import Department from "../model/rrhh/department";

type RunAutoAssignmentArgs = {
  programId: string; // requerido (o por ENV en controller)
  month: string; // "YYYY-MM"
  createdBy?: Types.ObjectId | null;
  force?: boolean; // si true, rehace el mes aunque ya exista
  updateUsersZone?: boolean; // si true, actualiza User.zone al nuevo zone
};

/** ✅ "YYYY-MM" */
export function assertMonthOrThrow(month: string) {
  const m = String(month || "").trim();
  const ok = /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
  if (!ok)
    throw new Error(
      `Mes inválido: "${month}". Usa formato YYYY-MM (ej: 2026-02).`,
    );
  return m;
}

export function getPrevMonth(month: string) {
  const [yy, mm] = month.split("-").map((x) => parseInt(x, 10));
  const d = new Date(yy, mm - 2, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * ✅ Corrida mensual:
 * - Toma operadoras (rol OPERADORA)
 * - Toma zonas activas
 * - Evita repetir zona del mes anterior (si hay +1 zona)
 * - Guarda snapshots por zona (subjectLocalityCode = Zone.code)
 * - (Opcional) actualiza User.zone para “zona actual”
 */
export async function runAutoAssignmentForMonth(args: RunAutoAssignmentArgs) {
  const month = assertMonthOrThrow(args.month);
  const prevMonth = getPrevMonth(month);

  if (!args.programId || !isValidObjectId(args.programId)) {
    return {
      ok: false,
      status: 400,
      mensaje: "programId inválido o no enviado.",
    };
  }

  const force = !!args.force;
  const updateUsersZone = args.updateUsersZone !== false; // default true
  const program = new Types.ObjectId(args.programId);

  // 1) Zonas activas
  const zones = await Zones.find({ isDeleted: false, isActived: true })
    .select("_id name code")
    .lean();

  if (!zones.length) {
    return {
      ok: false,
      status: 409,
      mensaje: "No hay zonas activas para asignar.",
    };
  }

  const zoneByCode = new Map<string, any>();
  const zoneById = new Map<string, any>();
  for (const z of zones) {
    if (z?.code) zoneByCode.set(String(z.code), z);
    zoneById.set(String(z._id), z);
  }

  // 2) Departments
  const department = await Department.findOne({ code: "TRIPLE_S" })
    .select("_id managers")
    .lean();
  if (!department?._id) {
    return {
      ok: false,
      status: 409,
      mensaje: 'No existe el departamento code="TRIPLE_S".',
    };
  }

  // 3) Operadoras
  const role = await Rol.findOne({ code: "EMPLOYEE" }).select("_id").lean();
  if (!role?._id) {
    return {
      ok: false,
      status: 409,
      mensaje: 'No existe el rol code="EMPLOYEE".',
    };
  }

  const operators = await User.find({
    _id: { $nin: department.managers ?? [] },
    isDeleted: false,
    isActived: true,
    rol: role._id, // ajusta si tu campo es "rol" en vez de "role"
    department: department._id,
  })
    .select("_id name email img image zone")
    .populate({ path: "zone", select: "_id code name" })
    .lean();

  if (!operators.length) {
    return {
      ok: false,
      status: 409,
      mensaje: "No hay operadoras activas para asignar.",
    };
  }

  // 3) Si ya existe snapshot del mes (y no force) -> 409
  const existingCount = await IncentiveScopeSnapshot.countDocuments({
    program,
    month,
    scopeType: "locality",
    isDeleted: false,
  });

  if (existingCount > 0 && !force) {
    return {
      ok: false,
      status: 409,
      mensaje: `Ya existen asignaciones para ${month}. Usa force=true si deseas rehacerlas.`,
      details: { existingCount },
    };
  }

  // 4) Prev assignments (desde snapshots del mes anterior); fallback: User.zone actual
  const prevSnaps = await IncentiveScopeSnapshot.find({
    program,
    month: prevMonth,
    scopeType: "locality",
    isDeleted: false,
  })
    .select("subjectLocalityCode memberUserIds")
    .lean();

  const prevLocalityByUser = new Map<string, string>(); // userId -> zone.code
  for (const s of prevSnaps) {
    const code = String(s.subjectLocalityCode || "");
    if (!code) continue;
    for (const uid of s.memberUserIds || []) {
      prevLocalityByUser.set(String(uid), code);
    }
  }

  // fallback a User.zone.code si no hay snapshot previo
  for (const u of operators) {
    const uid = String(u._id);
    if (prevLocalityByUser.has(uid)) continue;
    const z = (u as any).zone;
    const code = z?.code ? String(z.code) : null;
    if (code) prevLocalityByUser.set(uid, code);
  }

  // 5) Asignación evitando repetir
  const counts = new Map<string, number>(); // zoneId -> count
  for (const z of zones) counts.set(String(z._id), 0);

  const assignmentByUser = new Map<string, any>(); // userId -> zone
  const shuffled = shuffle(operators);

  let repeatedCount = 0;

  for (const u of shuffled) {
    const uid = String(u._id);
    const prevCode = prevLocalityByUser.get(uid) || null;

    // candidatos: todas menos la anterior (si hay más de 1 zona)
    let candidates = zones;
    if (zones.length > 1 && prevCode) {
      candidates = zones.filter((z) => String(z.code) !== String(prevCode));
    }

    // si por alguna razón queda vacío (ej: 1 sola zona), usamos todas
    if (!candidates.length) candidates = zones;

    // elegir la menos cargada (balance simple)
    let best = candidates[0];
    let bestCount = counts.get(String(best._id)) ?? 0;

    for (const z of candidates) {
      const c = counts.get(String(z._id)) ?? 0;
      if (c < bestCount) {
        best = z;
        bestCount = c;
      }
    }

    // tie-break aleatorio si varias tienen el mismo count
    const minCount = bestCount;
    const tied = candidates.filter(
      (z) => (counts.get(String(z._id)) ?? 0) === minCount,
    );
    const chosen =
      tied.length > 1 ? tied[Math.floor(Math.random() * tied.length)] : best;

    // repetición (solo puede ocurrir si hay 1 zona activa)
    if (prevCode && String(chosen.code) === String(prevCode)) repeatedCount++;

    assignmentByUser.set(uid, chosen);
    counts.set(String(chosen._id), (counts.get(String(chosen._id)) ?? 0) + 1);
  }

  // 6) Agrupar por zona para guardar snapshots
  const membersByZoneCode = new Map<string, Types.ObjectId[]>();
  for (const z of zones) membersByZoneCode.set(String(z.code), []);

  for (const u of operators) {
    const uid = String(u._id);
    const chosen = assignmentByUser.get(uid);
    const code = String(chosen?.code || "");
    if (!code) continue;
    membersByZoneCode.get(code)!.push(new Types.ObjectId(u._id));
  }

  // 7) Persistir en transacción
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // si force, marcamos como deleted los existentes del mes (limpieza)
    if (force && existingCount > 0) {
      await IncentiveScopeSnapshot.updateMany(
        { program, month, scopeType: "locality", isDeleted: false },
        {
          $set: {
            isDeleted: true,
            isActive: false,
            updatedBy: args.createdBy ?? null,
          },
        },
        { session },
      );
    }

    // upsert snapshot por cada zona activa (incluye vacías)
    const bulkSnaps: any[] = [];
    for (const z of zones) {
      const code = String(z.code);
      const members = membersByZoneCode.get(code) || [];

      bulkSnaps.push({
        updateOne: {
          filter: {
            program,
            month,
            scopeType: "locality",
            subjectLocalityCode: code,
            isDeleted: false,
          },
          update: {
            $set: {
              memberUserIds: members,
              source: "zone_assignment",
              updatedBy: args.createdBy ?? null,
              isActive: true,
              isDeleted: false,
            },
            $setOnInsert: {
              createdBy: args.createdBy ?? null,
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkSnaps.length) {
      await IncentiveScopeSnapshot.bulkWrite(bulkSnaps, { session });
    }

    // (opcional) actualizar User.zone
    if (updateUsersZone) {
      const bulkUsers: any[] = [];
      for (const u of operators) {
        const chosen = assignmentByUser.get(String(u._id));
        if (!chosen?._id) continue;

        bulkUsers.push({
          updateOne: {
            filter: { _id: u._id },
            update: { $set: { zone: chosen._id } },
          },
        });
      }
      if (bulkUsers.length) {
        await User.bulkWrite(bulkUsers, { session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return {
      ok: true,
      status: 200,
      mensaje: `Asignación mensual creada para ${month}.`,
      data: {
        month,
        prevMonth,
        totalOperators: operators.length,
        zonesCount: zones.length,
        repeatedCount, // debería ser 0 si hay +1 zona
        updateUsersZone,
      },
    };
  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();
    return {
      ok: false,
      status: 500,
      mensaje: e?.message || "Error en corrida mensual.",
    };
  }
}
