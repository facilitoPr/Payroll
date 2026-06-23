import { Response } from "express";
import { Types } from "mongoose";
import  Expedient from "../../model/expedient/expedient";
import ExpedientAttachment from "../../model/expedient/expedientAttachment";
import { recomputeExpedientProgress, validateSectionItemKeys } from "../../helper/expedient.helpers";

async function uploadToStorage(file: Express.Multer.File) {
  // TODO: Conectar a tu storage real
  // throw new Error("uploadToStorage() no está configurado");
  return {
    url: "", // <- debe venir de tu storage
    storageKey: "",
    mimeType: file.mimetype,
    size: file.size,
    originalName: file.originalname,
    checksum: "",
  };
}

export const addAttachmentByUrl = async (req: any, res: Response) => {
  try {
    const { expedientId } = req.params;
    const {
      sectionKey,
      itemKey,
      url,
      storageKey,
      mimeType,
      size,
      originalName,
      notes,
    } = req.body;

    if (!expedientId || !Types.ObjectId.isValid(expedientId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "expedientId inválido" });
    }
    if (!sectionKey || !itemKey) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "sectionKey y itemKey son requeridos" });
    }
    if (!url || String(url).trim() === "") {
      return res.status(400).json({ ok: false, mensaje: "url es requerido" });
    }

    const exp = await Expedient.findById(expedientId);
    if (!exp || exp.isDeleted) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Expediente no encontrado" });
    }

    const valid = validateSectionItemKeys(
      exp,
      String(sectionKey),
      String(itemKey)
    );
    if (!valid.ok) {
      return res.status(400).json({ ok: false, mensaje: valid.error });
    }

    const att = await ExpedientAttachment.create({
      expedient: exp._id,
      sectionKey: String(sectionKey),
      itemKey: String(itemKey),
      url: String(url),
      storageKey: storageKey ? String(storageKey) : "",
      mimeType: mimeType ? String(mimeType) : "",
      size: size ? Number(size) : 0,
      originalName: originalName ? String(originalName) : "",
      notes: notes ? String(notes) : "",
      uploadedBy: req?.user?.id ? new Types.ObjectId(req.user.id) : undefined,
      uploadedAt: new Date(),
      isActive: true,
      isDeleted: false,
    });

    await recomputeExpedientProgress(String(exp._id));

    return res.status(201).json({
      ok: true,
      attachment: att,
      mensaje: "Adjunto agregado",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

export const uploadAttachment = async (req: any, res: Response) => {
  try {
    const { expedientId } = req.params;
    const { sectionKey, itemKey, notes } = req.body;

    if (!expedientId || !Types.ObjectId.isValid(expedientId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "expedientId inválido" });
    }
    if (!sectionKey || !itemKey) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "sectionKey y itemKey son requeridos" });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "file es requerido (multipart)" });
    }

    const exp = await Expedient.findById(expedientId);
    if (!exp || exp.isDeleted) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Expediente no encontrado" });
    }

    const valid = validateSectionItemKeys(
      exp,
      String(sectionKey),
      String(itemKey)
    );
    if (!valid.ok) {
      return res.status(400).json({ ok: false, mensaje: valid.error });
    }

    const up = await uploadToStorage(req.file);

    if (!up.url) {
      return res.status(500).json({
        ok: false,
        mensaje: "uploadToStorage() no devolvió url. Configura tu storage.",
      });
    }

    const att = await ExpedientAttachment.create({
      expedient: exp._id,
      sectionKey: String(sectionKey),
      itemKey: String(itemKey),
      url: up.url,
      storageKey: up.storageKey || "",
      mimeType: up.mimeType || req.file.mimetype,
      size: up.size || req.file.size,
      originalName: up.originalName || req.file.originalname,
      checksum: up.checksum || "",
      notes: notes ? String(notes) : "",
      uploadedBy: req?.user?.id ? new Types.ObjectId(req.user.id) : undefined,
      uploadedAt: new Date(),
      isActive: true,
      isDeleted: false,
    });

    await recomputeExpedientProgress(String(exp._id));

    return res.status(201).json({
      ok: true,
      attachment: att,
      mensaje: "Archivo subido y adjuntado",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

export const listAttachments = async (req: any, res: Response) => {
  try {
    const { expedientId } = req.params;
    const { sectionKey, itemKey } = req.query as any;

    if (!expedientId || !Types.ObjectId.isValid(expedientId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "expedientId inválido" });
    }

    const filter: any = {
      expedient: new Types.ObjectId(expedientId),
      isDeleted: false,
      isActive: true,
    };

    if (sectionKey) filter.sectionKey = String(sectionKey);
    if (itemKey) filter.itemKey = String(itemKey);

    const items = await ExpedientAttachment.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      ok: true,
      items,
      total: items.length,
      mensaje: "Adjuntos listados",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

export const deleteAttachment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: "id inválido" });
    }

    const att = await ExpedientAttachment.findById(id);
    if (!att || att.isDeleted) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Adjunto no encontrado" });
    }

    att.isDeleted = true;
    att.isActive = false;
    await att.save();

    await recomputeExpedientProgress(String(att.expedient));

    return res.status(200).json({
      ok: true,
      mensaje: "Adjunto eliminado",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

export const attachUploadedFilesToItem = async (req: any, res: Response) => {
  try {
    const { expedientId, sectionKey, itemKey } = req.params;

    if (!Types.ObjectId.isValid(expedientId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "expedientId inválido" });
    }
    if (!sectionKey || !itemKey) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "sectionKey y itemKey son requeridos" });
    }

    const exp = await Expedient.findById(expedientId);
    if (!exp || exp.isDeleted) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Expediente no encontrado" });
    }

    const valid = validateSectionItemKeys(
      exp,
      String(sectionKey),
      String(itemKey)
    );
    if (!valid.ok) {
      return res.status(400).json({ ok: false, mensaje: valid.error });
    }

    const uploadedDocs = (req.uploaded?.docs || []) as Array<{
      fieldname: "documents" | "images";
      originalname: string;
      mimetype: string;
      size: number;
      url: string;
      isImage: boolean;
    }>;

    if (!uploadedDocs.length) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "No se recibieron archivos" });
    }

    const rows = uploadedDocs.map((f) => ({
      expedient: exp._id,
      sectionKey: String(sectionKey),
      itemKey: String(itemKey),
      url: f.url,
      storageKey: "", // si tu upload helper te devuelve key, lo pones aquí
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
      checksum: "",
      notes: "",
      uploadedBy: req?.user?._id ? new Types.ObjectId(req.user._id) : undefined,
      uploadedAt: new Date(),
      isActive: true,
      isDeleted: false,
    }));

    const created = await ExpedientAttachment.insertMany(rows);

    await recomputeExpedientProgress(String(exp._id));

    return res.status(201).json({
      ok: true,
      items: created,
      total: created.length,
      mensaje: "Archivos adjuntados al expediente",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};
