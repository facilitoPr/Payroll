import { Types } from "mongoose";
import Expedient from "../../model/expedient/expedient";
import ClassificationTemplate from "../../model/expedient/classificationTemplate";

function buildSnapshotFromTemplate(tpl: any) {
  return {
    code: tpl.code,
    name: tpl.name,
    version: tpl.version,
    sections: (tpl.sections || []).map((s: any) => ({
      key: s.key,
      title: s.title,
      order: Number(s.order || 0),
      phase: s.phase,
      items: (s.items || []).map((i: any) => ({
        key: i.key,
        label: i.label,
        order: Number(i.order || 0),
        required: !!i.required,
        multiple: !!i.multiple,
        accepts: Array.isArray(i.accepts) ? i.accepts : [],
      })),
    })),
  };
}

function countRequired(snapshot: any) {
  let total = 0;
  for (const sec of snapshot?.sections || []) {
    for (const it of sec?.items || []) {
      if (it?.required) total += 1;
    }
  }
  return total;
}

export async function ensureExpedientForApplication(opts: {
  applicationId: string;
  actorUserId?: string;
  session?: any;
}) {
  const { applicationId, actorUserId, session } = opts;

  if (!applicationId || !Types.ObjectId.isValid(applicationId)) {
    throw new Error("applicationId inválido");
  }

  // 1) si ya existe => devolver
  const existing = await Expedient.findOne({
    application: new Types.ObjectId(applicationId),
    isDeleted: false,
  }).session(session || null);

  if (existing) return existing;

  // 2) template activo del code
  const tpl = await ClassificationTemplate.findOne({
    code: "default_hr_dossier",
    isActive: true,
    isDeleted: false,
  })
    .sort({ version: -1 })
    .lean()
    .session(session || null);

  if (!tpl) {
    throw new Error(
      'No existe un ClassificationTemplate activo con code="default_hr_dossier".'
    );
  }

  const snapshot = buildSnapshotFromTemplate(tpl);
  const requiredTotal = countRequired(snapshot);

  // 3) crear expediente (maneja posible carrera por índice unique)
  try {
    const created = await Expedient.create(
      [
        {
          application: new Types.ObjectId(applicationId),
          template: new Types.ObjectId(tpl._id),
          templateSnapshot: snapshot,
          status: "OPEN",
          notes: "",
          requiredTotal,
          requiredCompleted: 0,
          createdBy:
            actorUserId && Types.ObjectId.isValid(actorUserId)
              ? new Types.ObjectId(actorUserId)
              : undefined,
          updatedBy:
            actorUserId && Types.ObjectId.isValid(actorUserId)
              ? new Types.ObjectId(actorUserId)
              : undefined,
        },
      ],
      { session }
    );

    return created[0];
  } catch (e: any) {
    // Si hubo carrera (duplicate key), solo leer y devolver
    if (String(e?.code) === "11000") {
      const again = await Expedient.findOne({
        application: new Types.ObjectId(applicationId),
        isDeleted: false,
      }).session(session || null);

      if (again) return again;
    }
    throw e;
  }
}
