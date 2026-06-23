import { Response } from "express";
import mongoose, { Types } from "mongoose";
import Expedient from "../../model/expedient/expedient";
import ClassificationTemplate from "../../model/expedient/classificationTemplate";
import { recomputeExpedientProgress } from "../../helper/expedient.helpers";
import ExpedientAttachment from "../../model/expedient/expedientAttachment";
import RecruitmentApplication from "../../model/recruitment/recruitmentApplication";
import User from "../../model/account/user";
import AuditLog from "../../model/auditLog";
import {
  getSectionTitlesFromSnapshot,
  patchExpedientChangeLabels,
} from "../../audits/expedientLabels";
import { getAuditConfig } from "../../audits/audit.config";
import { diffObjects, parseAuditTags } from "../../utils/audit.utils";
import { getClientIp } from "../../helper/token/client-ip";
import { toStr } from "../../helper/parse";

// HELPERS
function buildBaseClassificationFromSnapshot(snapshot: any) {
  const out: any = { sections: {} };

  const secs = snapshot?.sections || [];
  for (const sec of secs) {
    out.sections[sec.key] = out.sections[sec.key] || {};
    for (const it of sec.items || []) {
      out.sections[sec.key][it.key] = {
        received: false,
        date: "",
        status: "Pendiente",
        note: "",
      };
    }
  }

  return out;
}

function ensurePath(classification: any, sectionKey: string, itemKey: string) {
  classification.sections = classification.sections || {};
  classification.sections[sectionKey] =
    classification.sections[sectionKey] || {};
  classification.sections[sectionKey][itemKey] = classification.sections[
    sectionKey
  ][itemKey] || {
    received: false,
    date: "",
    status: "Pendiente",
    note: "",
  };
}

function extractUrls(value: any): string[] {
  const out: string[] = [];

  const pushUrl = (u: any) => {
    if (!u) return;
    if (typeof u === "string") {
      const s = u.trim();
      if (s) out.push(s);
      return;
    }
    if (typeof u === "object") {
      // soporta { url: "..." } o { link: "..." }
      const url = String(u.url || u.link || "").trim();
      if (url) out.push(url);
    }
  };

  if (Array.isArray(value)) {
    value.forEach(pushUrl);
  } else {
    pushUrl(value);
  }

  // unique + limpia
  return [...new Set(out)].filter(Boolean);
}

function toYMD(d: any) {
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    return dt.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function computeRequiredProgress(snapshot: any, classification: any) {
  const secs = snapshot?.sections || [];
  let requiredTotal = 0;
  let requiredCompleted = 0;

  for (const sec of secs) {
    for (const it of sec.items || []) {
      if (it.required) {
        requiredTotal++;
        const rec =
          classification?.sections?.[sec.key]?.[it.key]?.received === true;
        if (rec) requiredCompleted++;
      }
    }
  }

  return { requiredTotal, requiredCompleted };
}

function fileNameFromUrl(url: string) {
  try {
    const s = String(url || "");
    const noQuery = s.split("?")[0];
    const name = noQuery.split("/").pop();
    return name || "archivo";
  } catch {
    return "archivo";
  }
}

function inferMimeTypeFromUrl(url: string) {
  const u = String(url || "")
    .toLowerCase()
    .split("?")[0];

  if (u.endsWith(".pdf")) return "application/pdf";
  if (u.endsWith(".doc")) return "application/msword";
  if (u.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (u.endsWith(".xls")) return "application/vnd.ms-excel";
  if (u.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (u.endsWith(".csv")) return "text/csv";

  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "image/jpeg";
  if (u.endsWith(".webp")) return "image/webp";
  if (u.endsWith(".gif")) return "image/gif";

  return "application/octet-stream";
}

function safeParseJSON(v: any) {
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
}

function slugifyKey(label: string) {
  return String(label || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function isSafeMongoKey(k: any) {
  const s = String(k || "");
  if (!s) return false;
  if (s.includes(".") || s.includes("$")) return false;
  // puedes endurecer si quieres:
  // if (!/^[a-zA-Z0-9_-]{1,64}$/.test(s)) return false;
  return true;
}

function toDateFlexible(v: any) {
  if (!v) return null;

  // Date ya
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

  // "YYYY-MM-DD"
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00.000Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO o algo parseable
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeClassificationFromSnapshot(snapshot: any, payload: any) {
  const out: any = {
    expedientCode: String(payload?.expedientCode || "EXP-NEW"),
    owner: String(payload?.owner || "RRHH"),
    notes: String(payload?.notes || ""),
    sections: {},
  };

  const secs = snapshot?.sections || [];
  const incomingSections =
    payload?.sections && typeof payload.sections === "object"
      ? payload.sections
      : {};

  // 1) ✅ base desde snapshot (igual que hoy)
  for (const sec of secs) {
    const secKey = sec?.key;
    if (!secKey || !isSafeMongoKey(secKey)) continue;

    out.sections[secKey] = {};
    const incomingItems =
      incomingSections?.[secKey] && typeof incomingSections[secKey] === "object"
        ? incomingSections[secKey]
        : {};

    for (const it of sec?.items || []) {
      const itemKey = it?.key;
      if (!itemKey || !isSafeMongoKey(itemKey)) continue;

      const raw = incomingItems?.[itemKey] || {};
      const received = Boolean(raw?.received);

      out.sections[secKey][itemKey] = {
        received,
        date: received ? toDateFlexible(raw?.date) : null,
        status: received ? String(raw?.status || "Pendiente") : "Pendiente",
        note: String(raw?.note || ""),

        // label del snapshot (si quieres guardarlo también)
        label: String(raw?.label || it?.label || ""),
        isCustom: false,
      };
    }
  }

  // 2) ✅ agregar items extras (custom) que vienen del UI
  for (const secKey of Object.keys(incomingSections || {})) {
    if (!isSafeMongoKey(secKey)) continue;

    const incomingItems = incomingSections?.[secKey];
    if (!incomingItems || typeof incomingItems !== "object") continue;

    out.sections[secKey] = out.sections[secKey] || {};

    for (const itemKey of Object.keys(incomingItems)) {
      if (!isSafeMongoKey(itemKey)) continue;

      // si ya existe (snapshot), no lo duplicamos
      if (out.sections[secKey]?.[itemKey]) continue;

      const raw = incomingItems?.[itemKey] || {};
      const received = Boolean(raw?.received);

      out.sections[secKey][itemKey] = {
        received,
        date: received ? toDateFlexible(raw?.date) : null,
        status: received ? String(raw?.status || "Pendiente") : "Pendiente",
        note: String(raw?.note || ""),

        // ✅ label para mostrar en UI
        label: String(raw?.label || raw?.name || itemKey),
        isCustom: true,
      };
    }
  }

  return out;
}

// 

const createExpedient = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { applicationId, userId, templateCode, notes } = req.body;

    const hasApp = Boolean(applicationId);
    const hasUser = Boolean(userId);

    if (!hasApp && !hasUser) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "Debe enviar applicationId o userId (al menos uno es obligatorio)",
      });
    }

    if (hasApp && !Types.ObjectId.isValid(applicationId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "applicationId inválido" });
    }

    if (hasUser && !Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ ok: false, mensaje: "userId inválido" });
    }

    const userCreatorId =
      req?.user?._id && Types.ObjectId.isValid(String(req.user._id))
        ? new Types.ObjectId(req.user._id)
        : undefined;

    // -------------------------------------------------------
    // 0) RESOLVER application REAL (si viene por user también)
    // -------------------------------------------------------
    let application: any = null;
    let resolvedApplicationId: Types.ObjectId | null = null;
    const userObjectId = hasUser ? new Types.ObjectId(userId) : null;

    // (A) Si viene applicationId -> cargarla
    if (hasApp) {
      resolvedApplicationId = new Types.ObjectId(applicationId);

      application = await RecruitmentApplication.findOne({
        _id: resolvedApplicationId,
        isActive: true,
        isDeleted: false,
      }).lean();

      if (!application) {
        return res.status(400).json({
          ok: false,
          mensaje: "Solicitud no válida para expediente",
        });
      }
    } else if (hasUser && userObjectId) {
      // (B) Si no viene applicationId pero viene userId -> intentar encontrar application del user
      // 1) Si tu User guarda el id de la application, úsalo aquí (opcional)
      const userDoc = await User.findOne({
        _id: userObjectId,
        isDeleted: false,
      })
        .select("_id document recruitmentApplication applicationId application")
        .lean();

      const possibleAppId =
        (userDoc as any)?.recruitmentApplication ||
        (userDoc as any)?.applicationId;

      if (possibleAppId && Types.ObjectId.isValid(String(possibleAppId))) {
        resolvedApplicationId = new Types.ObjectId(String(possibleAppId));
        application = await RecruitmentApplication.findOne({
          _id: resolvedApplicationId,
          isActive: true,
          isDeleted: false,
        }).lean();
      }

      // // 2) Si no hay id directo, buscar la última application asociada al user
      // if (!application) {
      //   application = await findLatestApplicationForUser(userObjectId);
      //   if (
      //     application?._id &&
      //     Types.ObjectId.isValid(String(application._id))
      //   ) {
      //     resolvedApplicationId = new Types.ObjectId(String(application._id));
      //   }
      // }
    }

    // -------------------------------------------------------
    // 1) EVITAR DUPLICADOS
    // - Si hay application resuelta => busca por application
    // - Si no => busca por user sin application
    // -------------------------------------------------------
    let existing: any = null;

    if (resolvedApplicationId) {
      existing = await Expedient.findOne({
        application: resolvedApplicationId,
        isDeleted: false,
      });
    } else if (hasUser && userObjectId) {
      existing = await Expedient.findOne({
        user: userObjectId,
        isDeleted: false,
        $or: [{ application: { $exists: false } }, { application: null }],
      });
    }

    if (existing) {
      return res.status(200).json({
        ok: true,
        expedient: existing,
        attachments: [],
        mensaje: resolvedApplicationId
          ? "El expediente ya existe para esta aplicación"
          : "El expediente ya existe para este usuario",
      });
    }

    // -------------------------------------------------------
    // 2) TEMPLATE
    // -------------------------------------------------------
    const tpl = await ClassificationTemplate.findOne({
      isDeleted: false,
      isActive: true,
      ...(templateCode ? { code: String(templateCode) } : {}),
    })
      .sort({ version: -1 })
      .lean();

    if (!tpl) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "No hay template activo" });
    }

    const snapshot = {
      code: tpl.code,
      name: tpl.name,
      version: tpl.version,
      sections: tpl.sections || [],
    };

    // -------------------------------------------------------
    // 3) CLASIFICACIÓN BASE
    // -------------------------------------------------------
    const baseClassification = buildBaseClassificationFromSnapshot(snapshot);

    // -------------------------------------------------------
    // 4) PREFILL DESDE application.answers (si existe)
    // -------------------------------------------------------
    const prefillMap = [
      { answerKey: "idCopy", sectionKey: "personalDocs", itemKey: "idCopy" },
      { answerKey: "cv", sectionKey: "recruiting", itemKey: "cv" },
      {
        answerKey: "certificates",
        sectionKey: "educationCerts",
        itemKey: "professionalCerts",
      },
    ];

    const attachmentsToCreate: Array<{
      sectionKey: string;
      itemKey: string;
      url: string;
      note?: string;
    }> = [];

    // Guardaremos un cvUrl para actualizar User.document
    let cvUrlToSet: string | null = null;

    if (application) {
      const answers = application?.answers || {};
      const dateFromApp =
        application?.createdAt || application?.submittedAt || new Date();

      for (const m of prefillMap) {
        const urls = extractUrls(answers?.[m.answerKey]);
        if (!urls.length) continue;

        ensurePath(baseClassification, m.sectionKey, m.itemKey);

        baseClassification.sections[m.sectionKey][m.itemKey].received = true;
        baseClassification.sections[m.sectionKey][m.itemKey].status = "Digital";
        baseClassification.sections[m.sectionKey][m.itemKey].date =
          toYMD(dateFromApp);
        baseClassification.sections[m.sectionKey][m.itemKey].note =
          "Cargado desde el formulario de reclutamiento.";

        for (const url of urls) {
          attachmentsToCreate.push({
            sectionKey: m.sectionKey,
            itemKey: m.itemKey,
            url,
            note: "Cargado desde el formulario de reclutamiento.",
          });
        }

        // si es cv, toma el primero (o el último si prefieres)
        if (m.answerKey === "cv" && !cvUrlToSet) {
          cvUrlToSet = urls[0] || null;
        }
      }
    }

    // Normaliza
    const normalizedClassification = normalizeClassificationFromSnapshot(
      snapshot,
      baseClassification,
    );

    const { requiredTotal, requiredCompleted } = computeRequiredProgress(
      snapshot,
      normalizedClassification,
    );

    // -------------------------------------------------------
    // 5) ARMAR PAYLOAD
    // -------------------------------------------------------
    const payload: any = {
      template: tpl._id,
      templateSnapshot: snapshot,
      classification: normalizedClassification,
      notes: notes || "",
      status: "OPEN",
      requiredTotal,
      requiredCompleted,
      isActive: true,
      isDeleted: false,
      createdBy: userCreatorId,
      updatedBy: userCreatorId,
    };

    // Linkear user si viene
    if (hasUser && userObjectId) payload.user = userObjectId;

    // Linkear application si se resolvió
    if (resolvedApplicationId) payload.application = resolvedApplicationId;

    let exp: any = null;

    // -------------------------------------------------------
    // 6) TRANSACCIÓN: crear exp + attachments + update user.document
    // -------------------------------------------------------
    await session.withTransaction(async () => {
      exp = new Expedient(payload);
      await exp.save({ session });

      if (attachmentsToCreate.length) {
        const rows = attachmentsToCreate.map((a) => ({
          expedient: exp._id,
          sectionKey: String(a.sectionKey),
          itemKey: String(a.itemKey),
          url: String(a.url),
          storageKey: "",
          originalName: fileNameFromUrl(a.url),
          mimeType: inferMimeTypeFromUrl(a.url),
          size: 0,
          checksum: "",
          notes: a.note || "",
          uploadedBy: userCreatorId,
          uploadedAt: new Date(),
          isActive: true,
          isDeleted: false,
        }));

        await ExpedientAttachment.insertMany(rows, { session });
      }

      // ✅ Si hay CV y hay userId, actualiza User.document
      // (si no vino userId, intenta inferirlo desde la application)
      const userToUpdate = (hasUser && userObjectId) || null;

      if (cvUrlToSet && userToUpdate) {
        await User.updateOne(
          { _id: userToUpdate, isDeleted: false },
          { $set: { document: cvUrlToSet } },
          { session },
        );
      }
    });

    await recomputeExpedientProgress(String(exp._id));

    const atts = await ExpedientAttachment.find({
      expedient: exp._id,
      isDeleted: false,
    })
      .sort({ uploadedAt: -1, createdAt: -1 })
      .lean();

    return res.status(201).json({
      ok: true,
      expedient: exp,
      attachments: atts,
      mensaje: "Expediente creado con éxito",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  } finally {
    session.endSession();
  }
};

const getExpedient = async (req: any, res: Response) => {
  try {
    const { applicationId, employeeId } = req.query as {
      applicationId?: string;
      employeeId?: string;
    };

    // 1) Debe venir UNO de los dos
    const hasApplication = !!applicationId;
    const hasEmployee = !!employeeId;

    if (!hasApplication && !hasEmployee) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes enviar applicationId o employeeId",
      });
    }

    // 2) Validar el que venga (si vienen ambos, validamos ambos)
    if (hasApplication && !Types.ObjectId.isValid(applicationId!)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "applicationId inválido" });
    }

    if (hasEmployee && !Types.ObjectId.isValid(employeeId!)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "employeeId inválido" });
    }

    // 3) Construir filtro dinámico
    const filter: any = { isDeleted: false };

    // Prioridad: applicationId si viene, si no user por employeeId
    if (hasApplication) {
      filter.application = new Types.ObjectId(applicationId!);
    } else {
      filter.user = new Types.ObjectId(employeeId!);
    }

    const exp = await Expedient.findOne(filter).lean();

    if (!exp) {
      return res.status(200).json({
        ok: true,
        expedient: null,
        attachmentsByItem: {},
        attachments: [],
        mensaje: "Expediente no encontrado",
      });
    }

    // 4) Traer adjuntos del expediente
    const attachments = await ExpedientAttachment.find({
      expedient: exp._id,
      isDeleted: false,
    })
      .select(
        "sectionKey itemKey url storageKey originalName mimeType size checksum notes uploadedBy uploadedAt createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();

    // 5) Agrupar por sectionKey/itemKey para el frontend
    const attachmentsByItem: Record<string, Record<string, any[]>> = {};

    for (const a of attachments) {
      const sKey = a.sectionKey;
      const iKey = a.itemKey;

      if (!attachmentsByItem[sKey]) attachmentsByItem[sKey] = {};
      if (!attachmentsByItem[sKey][iKey]) attachmentsByItem[sKey][iKey] = [];

      attachmentsByItem[sKey][iKey].push(a);
    }

    return res.status(200).json({
      ok: true,
      expedient: exp,
      attachments,
      attachmentsByItem,
      mensaje: "Expediente encontrado",
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

const getExpedientByUser = async (req: any, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ ok: false, mensaje: "userId inválido" });
    }

    const exp = await Expedient.findOne({
      user: new Types.ObjectId(userId),
      isDeleted: false,
    }).lean();

    return res.status(200).json({
      ok: true,
      expedient: exp || null,
      mensaje: exp ? "Expediente encontrado" : "Expediente no encontrado",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

const promoteExpedientToUser = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, keepApplication = true } = req.body;

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: "id inválido" });
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ ok: false, mensaje: "userId inválido" });
    }

    const exp = await Expedient.findById(id);
    if (!exp || exp.isDeleted) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Expediente no encontrado" });
    }

    exp.user = new Types.ObjectId(userId);
    if (!keepApplication) exp.application = undefined;

    if (req?.user?.id) exp.updatedBy = new Types.ObjectId(req.user._id);

    await exp.save();

    return res.status(200).json({
      ok: true,
      expedient: exp,
      mensaje: "Expediente promovido a empleado (User)",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

const updateExpedient = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: "id inválido" });
    }

    const update: any = {};
    if (status && ["OPEN", "COMPLETE", "ARCHIVED"].includes(String(status))) {
      update.status = String(status);
    }
    if (typeof notes === "string") update.notes = notes;

    if (req?.user?._id) update.updatedBy = new Types.ObjectId(req.user._id);

    const exp = await Expedient.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();
    if (!exp || exp.isDeleted) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Expediente no encontrado" });
    }

    return res.status(200).json({
      ok: true,
      expedient: exp,
      mensaje: "Expediente actualizado",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

const saveExpedientClassification = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { expedientId } = req.params;

    if (!expedientId || !Types.ObjectId.isValid(expedientId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "expedientId inválido" });
    }

    // ✅ classification viene como string JSON
    const classificationRaw = safeParseJSON(req.body?.classification);
    if (!classificationRaw) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "classification inválido" });
    }

    // ✅ uploadedDocs
    const uploadedDocs = (req.uploaded?.docs || []) as Array<{
      originalname: string;
      mimetype: string;
      size: number;
      url: string;
      storageKey?: string;
      isImage: boolean;
    }>;

    // ✅ metas por índice
    const metasRaw = req.body?.attachmentMetas;
    const metasArr = Array.isArray(metasRaw)
      ? metasRaw
      : metasRaw
        ? [metasRaw]
        : [];
    const metas = metasArr.map((m) => safeParseJSON(m)).filter(Boolean);

    if (uploadedDocs.length && uploadedDocs.length !== metas.length) {
      return res.status(400).json({
        ok: false,
        mensaje: "Metas no coinciden con cantidad de archivos",
      });
    }

    const auditNote = req.body?.auditNote;
    const auditTags = parseAuditTags(req.body?.auditTags);

    let outExp: any = null;
    let outAtts: any[] = [];

    await session.withTransaction(async () => {
      // 1) Expediente actual (dentro de txn)
      const exp = await Expedient.findOne({
        _id: new Types.ObjectId(expedientId),
        isDeleted: false,
      }).session(session);

      if (!exp) {
        // IMPORTANTE: lanzar error para abortar txn
        throw Object.assign(new Error("Expediente no encontrado"), {
          status: 404,
        });
      }

      const beforeExp = exp.toObject({ depopulate: true });

      // 2) Normaliza
      const normalized = normalizeClassificationFromSnapshot(
        exp.templateSnapshot,
        classificationRaw,
      );

      let contractToSet: string | null = null;
      let contractChanged = false;
      let contractBefore: string | null = null;

      // 3) Guardar clasificación + progreso
      exp.classification = normalized;
      exp.notes = String(normalized?.notes || exp.notes || "");

      if (req?.user?._id && Types.ObjectId.isValid(String(req.user._id))) {
        exp.updatedBy = new Types.ObjectId(req.user._id);
      }

      const secs = exp.templateSnapshot?.sections || [];
      let requiredTotal = 0;
      let requiredCompleted = 0;

      for (const sec of secs) {
        for (const it of sec.items || []) {
          if (!it.required) continue;
          requiredTotal++;
          if (normalized?.sections?.[sec.key]?.[it.key]?.received) {
            requiredCompleted++;
          }
        }
      }

      exp.requiredTotal = requiredTotal;
      exp.requiredCompleted = requiredCompleted;

      await exp.save({ session });

      // 4) Adjuntos (si hay)
      let insertedRows: any[] = [];
      if (uploadedDocs.length) {
        const rows = uploadedDocs
          .map((f, idx) => {
            const meta = metas[idx] || {};

            // contrato: marca url si aplica
            if (meta.sectionKey === "legalContracts" && !contractToSet) {
              contractToSet = f.url || null;
            }

            return {
              expedient: exp._id,
              sectionKey: String(meta.sectionKey || ""),
              itemKey: String(meta.itemKey || ""),
              url: f.url,
              storageKey: String(f.storageKey || ""),
              originalName: f.originalname || "",
              mimeType: f.mimetype || "",
              size: f.size || 0,
              checksum: "",
              notes: "",
              uploadedBy:
                req?.user?._id && Types.ObjectId.isValid(String(req.user._id))
                  ? new Types.ObjectId(req.user._id)
                  : undefined,
              uploadedAt: new Date(),
              isActive: true,
              isDeleted: false,
            };
          })
          .filter((r) => r.sectionKey && r.itemKey && r.url);

        if (rows.length) {
          insertedRows = await ExpedientAttachment.insertMany(rows, {
            session,
          });
        }
      }

      // 5) Si subieron contrato, actualiza User.contract (dentro txn)
      if (contractToSet && exp.user) {
        const u = await User.findOne({ _id: exp.user, isDeleted: false })
          .select("contract")
          .lean()
          .session(session);

        contractBefore = (u?.contract as any) ? String(u.contract) : null;
        if (contractBefore !== contractToSet) {
          contractChanged = true;
          await User.updateOne(
            { _id: exp.user, isDeleted: false },
            { $set: { contract: contractToSet } },
            { session },
          );
        }
      }

      // 6) AFTER snapshot
      const afterExp = exp.toObject({ depopulate: true });

      // 7) Audit (Expedient)
      const cfg = getAuditConfig("Expedient");
      let changes = diffObjects(beforeExp, afterExp, cfg);

      // agrega "changes" manuales por adjuntos (porque no están en exp doc)
      if (uploadedDocs.length) {
        const attachChanges = uploadedDocs.map((f, idx) => {
          const meta = metas[idx] || {};
          const secKey = String(meta.sectionKey || "");
          const itemKey = String(meta.itemKey || "");
          return {
            path: `attachments.${secKey}.${itemKey}`,
            from: null,
            to: {
              url: f.url,
              originalName: f.originalname,
              mimeType: f.mimetype,
              size: f.size,
            },
            masked: false,
            label: `Adjunto · ${secKey} · ${itemKey}`,
          };
        });

        changes = [...changes, ...attachChanges];
      }

      // labels dinámicos en classification
      patchExpedientChangeLabels({
        changes,
        templateSnapshot: exp.templateSnapshot as any,
        classification: exp.classification as any,
      });

      if (changes.length) {
        const ip = getClientIp(req);

        const tagsBase = new Set<string>(["expedient"]);
        if (changes.some((c) => String(c.path).startsWith("classification.")))
          tagsBase.add("classification");
        if (uploadedDocs.length) tagsBase.add("attachments");
        if (contractChanged) tagsBase.add("contract");

        const title =
          uploadedDocs.length &&
          changes.some((c) => String(c.path).startsWith("classification."))
            ? "Actualizó expediente y adjuntó documentos"
            : uploadedDocs.length
              ? "Adjuntó documentos al expediente"
              : "Actualizó expediente";

        const summary = [
          {
            label: "Progreso",
            value: `${requiredCompleted}/${requiredTotal}`,
          },
          ...(uploadedDocs.length
            ? [{ label: "Adjuntos", value: String(uploadedDocs.length) }]
            : []),
        ];

        await AuditLog.create(
          [
            {
              rootUser: exp.user || null,
              entityType: "Expedient",
              entityId: exp._id,
              action: "UPDATE",
              title,
              subtitle: "",
              tags: Array.from(
                new Set([...Array.from(tagsBase), ...auditTags]),
              ),
              summary,
              changes,
              note: auditNote ? String(auditNote).slice(0, 500) : "",
              changedBy:
                req?.user?._id && Types.ObjectId.isValid(String(req.user._id))
                  ? new Types.ObjectId(req.user._id)
                  : null,
              context: {
                route: req.originalUrl || req.url || "",
                method: req.method || "",
                ip,
                userAgent: toStr(req.headers["user-agent"]),
                requestId:
                  req.requestId || req.id || req.headers["x-request-id"] || "",
                statusCode: 200,
                meta: {
                  expedientId: String(exp._id),
                  templateCode: String(exp.templateSnapshot?.code || ""),
                  contractChanged,
                  contractBefore,
                  contractToSet,
                },
              },
            },
          ],
          { session },
        );

        // (Opcional) audit extra para User si cambió contrato y quieres verlo filtrando entityType=User
        if (contractChanged && exp.user) {
          const ip2 = getClientIp(req);
          await AuditLog.create(
            [
              {
                rootUser: exp.user,
                entityType: "User",
                entityId: exp.user,
                action: "UPDATE",
                title: "Actualizó contrato (desde expediente)",
                subtitle: "",
                tags: ["contract", "expedient"],
                summary: [{ label: "Contrato", value: "Actualizado" }],
                changes: [
                  {
                    path: "contract",
                    from: contractBefore,
                    to: contractToSet,
                    masked: false,
                    label: "Contrato",
                  },
                ],
                note: auditNote ? String(auditNote).slice(0, 500) : "",
                changedBy:
                  req?.user?._id && Types.ObjectId.isValid(String(req.user._id))
                    ? new Types.ObjectId(req.user._id)
                    : null,
                context: {
                  route: req.originalUrl || req.url || "",
                  method: req.method || "",
                  ip: ip2,
                  userAgent: toStr(req.headers["user-agent"]),
                  requestId:
                    req.requestId ||
                    req.id ||
                    req.headers["x-request-id"] ||
                    "",
                  statusCode: 200,
                  meta: { expedientId: String(exp._id) },
                },
              },
            ],
            { session },
          );
        }
      }

      // 8) salida
      outExp = exp;
      outAtts = await ExpedientAttachment.find({
        expedient: exp._id,
        isDeleted: false,
      })
        .sort({ uploadedAt: -1, createdAt: -1 })
        .lean()
        .session(session);
    });

    return res.status(200).json({
      ok: true,
      expedient: outExp,
      attachments: outAtts,
      mensaje: "Clasificación y adjuntos guardados con éxito",
    });
  } catch (error: any) {
    console.error(error);

    if (error?.status === 404) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Expediente no encontrado" });
    }

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  } finally {
    session.endSession();
  }
};

const addCustomItemToExpedient = async (req: any, res: any) => {
  try {
    const { expedientId } = req.params;
    const { sectionKey, label, auditNote, auditTags } = req.body;

    if (!expedientId || !Types.ObjectId.isValid(expedientId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "expedientId inválido" });
    }

    const sKey = String(sectionKey || "").trim();
    const lab = String(label || "").trim();

    if (!sKey || !lab) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "sectionKey y label son requeridos" });
    }

    const exp = await Expedient.findOne({
      _id: new Types.ObjectId(expedientId),
      isDeleted: false,
    }).select("_id user classification templateSnapshot");

    if (!exp) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Expediente no encontrado" });
    }

    const beforeExp = exp.toObject({ depopulate: true });

    // ✅ buscar title de sección desde snapshot y limpiarlo
    const { raw: sectionTitleRaw, clean: sectionTitleClean } =
      getSectionTitlesFromSnapshot(exp.templateSnapshot as any, sKey);

    // generar itemKey unique
    const currentSec = exp.classification?.sections?.[sKey] || {};
    const base = slugifyKey(lab) || "doc";
    let itemKey = `custom_${base}`;
    if (currentSec?.[itemKey]) {
      itemKey = `custom_${base}_${Date.now().toString().slice(-6)}`;
    }

    const itemObj = {
      received: false,
      date: null,
      status: "Pendiente",
      note: "",
      label: lab,
      isCustom: true,
    };

    const setPath = `classification.sections.${sKey}.${itemKey}`;

    await Expedient.updateOne(
      { _id: exp._id, isDeleted: false },
      {
        $set: {
          [setPath]: itemObj,
          ...(req?.user?._id && Types.ObjectId.isValid(String(req.user._id))
            ? { updatedBy: new Types.ObjectId(req.user._id) }
            : {}),
        },
      },
    );

    const after = await Expedient.findById(exp._id)
      .select("_id user classification templateSnapshot")
      .lean();

    if (after) {
      const cfg = getAuditConfig("Expedient");
      let changes = diffObjects(beforeExp, after, cfg);

      patchExpedientChangeLabels({
        changes,
        templateSnapshot: after.templateSnapshot as any,
        classification: after.classification as any,
      });

      if (changes.length) {
        const ip = getClientIp(req);

        await AuditLog.create({
          rootUser: after.user || null,
          entityType: "Expedient",
          entityId: after._id,
          action: "CREATE",

          // ✅ title fijo + subtitle con la sección (ya limpio)
          title: "Agregó documento custom al expediente",
          subtitle: sectionTitleClean,

          tags: Array.from(
            new Set(["expedient", "custom-item", ...parseAuditTags(auditTags)]),
          ),

          // ✅ summary ahora incluye sectionKey + sectionTitle limpio
          summary: [
            { label: "Sección", value: sectionTitleClean },
            { label: "Documento", value: lab },
          ],

          changes,

          note: auditNote ? String(auditNote).slice(0, 500) : "",

          changedBy:
            req?.user?._id && Types.ObjectId.isValid(String(req.user._id))
              ? new Types.ObjectId(req.user._id)
              : null,

          context: {
            route: req.originalUrl || req.url || "",
            method: req.method || "",
            ip,
            userAgent: toStr(req.headers["user-agent"]),
            requestId:
              req.requestId || req.id || req.headers["x-request-id"] || "",
            statusCode: 200,
            meta: {
              sectionKey: sKey,
              sectionTitleRaw, // "1. Documentos Personales"
              sectionTitleClean, // "Documentos Personales"
              itemKey,
              label: lab,
            },
          },
        });
      }
    }

    return res.status(200).json({
      ok: true,
      itemKey,
      label: lab,
      mensaje: "Documento agregado a la sección",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

const updateCustomItemLabel = async (req: any, res: Response) => {
  try {
    const { expedientId } = req.params;
    const { sectionKey, itemKey, label, auditNote, auditTags } = req.body;

    if (!expedientId || !Types.ObjectId.isValid(expedientId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "expedientId inválido" });
    }

    const sKey = String(sectionKey || "").trim();
    const iKey = String(itemKey || "").trim();
    const lab = String(label || "").trim();

    if (!sKey || !iKey || !lab) {
      return res.status(400).json({
        ok: false,
        mensaje: "sectionKey, itemKey y label son requeridos",
      });
    }

    if (!isSafeMongoKey(sKey) || !isSafeMongoKey(iKey)) {
      return res.status(400).json({ ok: false, mensaje: "Keys inválidas" });
    }

    const exp = await Expedient.findOne({
      _id: new Types.ObjectId(expedientId),
      isDeleted: false,
    }).select("_id user classification templateSnapshot updatedBy");

    if (!exp) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Expediente no encontrado" });
    }

    const beforeExp = exp.toObject({ depopulate: true });

    // ✅ título sección (raw + clean)
    const { raw: sectionTitleRaw, clean: sectionTitleClean } =
      getSectionTitlesFromSnapshot(exp.templateSnapshot as any, sKey);

    const node = exp?.classification?.sections?.[sKey]?.[iKey];
    if (!node) {
      return res.status(404).json({ ok: false, mensaje: "Item no encontrado" });
    }

    // ✅ Seguridad: solo permitir editar items custom
    const isCustom = !!node?.isCustom || String(iKey).startsWith("custom_");
    if (!isCustom) {
      return res
        .status(403)
        .json({ ok: false, mensaje: "Solo puedes editar items custom" });
    }

    const oldLabel = String(node?.label || iKey);

    node.label = lab;
    node.isCustom = true;

    if (req?.user?._id && Types.ObjectId.isValid(String(req.user._id))) {
      exp.updatedBy = new Types.ObjectId(req.user._id);
    }

    exp.markModified("classification");
    await exp.save();

    // ✅ snapshot AFTER (lean)
    const after = await Expedient.findById(exp._id)
      .select("_id user classification templateSnapshot")
      .lean();

    // ✅ Audit (si hubo cambios reales)
    if (after) {
      const cfg = getAuditConfig("Expedient");
      let changes = diffObjects(beforeExp, after, cfg);

      patchExpedientChangeLabels({
        changes,
        templateSnapshot: after.templateSnapshot as any,
        classification: after.classification as any,
      });

      if (changes.length) {
        const ip = getClientIp(req);

        await AuditLog.create({
          rootUser: after.user || null,
          entityType: "Expedient",
          entityId: after._id,
          action: "UPDATE",
          title: "Actualizó nombre de documento en el expediente",
          subtitle: sectionTitleClean,
          tags: Array.from(
            new Set([
              "expedient",
              "custom-item",
              "label",
              ...parseAuditTags(auditTags),
            ]),
          ),
          summary: [
            { label: "Sección", value: sectionTitleClean },
            { label: "Documento", value: `${oldLabel} → ${lab}` },
          ],
          changes,
          note: auditNote ? String(auditNote).slice(0, 500) : "",
          changedBy:
            req?.user?._id && Types.ObjectId.isValid(String(req.user._id))
              ? new Types.ObjectId(req.user._id)
              : null,
          context: {
            route: req.originalUrl || req.url || "",
            method: req.method || "",
            ip,
            userAgent: toStr(req.headers["user-agent"]),
            requestId:
              req.requestId || req.id || req.headers["x-request-id"] || "",
            statusCode: 200,
            meta: {
              sectionKey: sKey,
              sectionTitleRaw,
              sectionTitleClean,
              itemKey: iKey,
              oldLabel,
              newLabel: lab,
            },
          },
        });
      }
    }

    return res.status(200).json({
      ok: true,
      expedient: exp,
      itemKey: iKey,
      label: lab,
      sectionKey: sKey,
      sectionTitle: sectionTitleClean,
      mensaje: "Label actualizado",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

const deleteCustomItemFromExpedient = async (
  req: any,
  res: Response,
) => {
  try {
    const { expedientId } = req.params;
    const { sectionKey, itemKey, auditNote, auditTags } = req.body;

    if (!expedientId || !Types.ObjectId.isValid(expedientId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "expedientId inválido" });
    }

    const sKey = String(sectionKey || "").trim();
    const iKey = String(itemKey || "").trim();

    if (!sKey || !iKey) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "sectionKey y itemKey son requeridos" });
    }

    if (!isSafeMongoKey(sKey) || !isSafeMongoKey(iKey)) {
      return res.status(400).json({ ok: false, mensaje: "Keys inválidas" });
    }

    const exp = await Expedient.findOne({
      _id: new Types.ObjectId(expedientId),
      isDeleted: false,
    }).select("_id user classification templateSnapshot updatedBy");

    if (!exp) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Expediente no encontrado" });
    }

    const beforeExp = exp.toObject({ depopulate: true });

    // ✅ título sección (raw + clean)
    const { raw: sectionTitleRaw, clean: sectionTitleClean } =
      getSectionTitlesFromSnapshot(exp.templateSnapshot as any, sKey);

    const node = exp?.classification?.sections?.[sKey]?.[iKey];
    if (!node) {
      return res.status(404).json({ ok: false, mensaje: "Item no encontrado" });
    }

    const isCustom = !!node?.isCustom || String(iKey).startsWith("custom_");
    if (!isCustom) {
      return res
        .status(403)
        .json({ ok: false, mensaje: "Solo puedes eliminar items custom" });
    }

    const docLabel = String(node?.label || iKey);

    // ✅ borrar del objeto
    delete exp.classification.sections[sKey][iKey];

    if (req?.user?._id && Types.ObjectId.isValid(String(req.user._id))) {
      exp.updatedBy = new Types.ObjectId(req.user._id);
    }

    exp.markModified("classification");
    await exp.save();

    // ✅ marcar adjuntos de ese item como borrados (tu lógica)
    await ExpedientAttachment.updateMany(
      {
        expedient: exp._id,
        sectionKey: sKey,
        itemKey: iKey,
        isDeleted: false,
      },
      { $set: { isDeleted: true, isActive: false } },
    );

    // ✅ snapshot AFTER (lean)
    const after = await Expedient.findById(exp._id)
      .select("_id user classification templateSnapshot")
      .lean();

    // ✅ Audit (si hubo cambios reales)
    if (after) {
      const cfg = getAuditConfig("Expedient");
      let changes = diffObjects(beforeExp, after, cfg);

      patchExpedientChangeLabels({
        changes,
        templateSnapshot: after.templateSnapshot as any,
        classification: after.classification as any,
      });

      if (changes.length) {
        const ip = getClientIp(req);

        await AuditLog.create({
          rootUser: after.user || null,
          entityType: "Expedient",
          entityId: after._id,
          action: "DELETE",
          title: "Eliminó documento del expediente",
          subtitle: sectionTitleClean,
          tags: Array.from(
            new Set([
              "expedient",
              "custom-item",
              "delete",
              ...parseAuditTags(auditTags),
            ]),
          ),
          summary: [
            { label: "Sección", value: sectionTitleClean },
            { label: "Documento", value: docLabel },
          ],
          changes,
          note: auditNote ? String(auditNote).slice(0, 500) : "",
          changedBy:
            req?.user?._id && Types.ObjectId.isValid(String(req.user._id))
              ? new Types.ObjectId(req.user._id)
              : null,
          context: {
            route: req.originalUrl || req.url || "",
            method: req.method || "",
            ip,
            userAgent: toStr(req.headers["user-agent"]),
            requestId:
              req.requestId || req.id || req.headers["x-request-id"] || "",
            statusCode: 200,
            meta: {
              sectionKey: sKey,
              sectionTitleRaw,
              sectionTitleClean,
              itemKey: iKey,
              label: docLabel,
            },
          },
        });
      }
    }

    return res.status(200).json({
      ok: true,
      expedient: exp,
      sectionKey: sKey,
      sectionTitle: sectionTitleClean,
      itemKey: iKey,
      mensaje: "Documento eliminado",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

export {
  createExpedient,
  getExpedient,
  getExpedientByUser,
  promoteExpedientToUser,
  updateExpedient,
  saveExpedientClassification,
  addCustomItemToExpedient,
  updateCustomItemLabel,
  deleteCustomItemFromExpedient,
};
