import { Response } from "express";
import { Types } from "mongoose";
import RecruitmentForm from "../../model/recruitment/recruitment-form";
import AiAgent from "../../model/aiAgent";

const safeJsonParseArray = (value: any) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseBooleanFromFormData = (value: any) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "boolean" ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const createRecruitmentForm = async (req: any, res: Response) => {
  try {
    const { ...data } = req.body;

    const fields = JSON.parse(data.fields);

    if (!req.user) {
      return res.status(401).json({
        ok: false,
        mensaje: "Usuario no autenticado",
      });
    }

    if (!fields || fields.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El formulario debe tener al menos un campo",
      });
    }

    if (req.uploaded) {
      data.documents = req.uploaded.files;
      data.images = req.uploaded.images;
    }

    // 👉 Parsear autoAiEvaluation (viene como "true"/"false" o JSON)
    let autoAiEvaluation = false;

    if (typeof data.autoAiEvaluation !== "undefined") {
      if (typeof data.autoAiEvaluation === "string") {
        try {
          // si viene como "true"/"false" o "null"
          autoAiEvaluation = JSON.parse(data.autoAiEvaluation);
        } catch {
          // fallback por si acaso
          autoAiEvaluation = data.autoAiEvaluation === "true";
        }
      } else if (typeof data.autoAiEvaluation === "boolean") {
        autoAiEvaluation = data.autoAiEvaluation;
      }
    }

    if (autoAiEvaluation === true && !data.aiAgent) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "Debes seleccionar un agente IA si activas la evaluación automática.",
      });
    }

    if (data.aiAgent && !Types.ObjectId.isValid(data.aiAgent)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Agente de IA Requerido",
      });
    }

    const publicToken = new Types.ObjectId().toHexString();

    const form = await RecruitmentForm.create({
      title: data.title.trim(),
      publicToken,
      description: data.description?.trim() || undefined,
      fields: fields.map((f: any, index: number) => ({
        key: f.key,
        groupKey: f.groupKey,
        order: typeof f.order === "number" ? f.order : index,
        requiredOverride:
          typeof f.requiredOverride === "boolean"
            ? f.requiredOverride
            : undefined,
      })),
      documents: data.documents,
      images: data.images,
      jobPosition: data.jobPosition,
      autoAiEvaluation,
      createdBy: req.user._id,
      isActive: true,
      isDeleted: false,
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Formulario creado correctamente",
      form,
      link: `${req.protocol}://${req.get("host")}/reclutamiento/${
        form.publicToken
      }`,
    });
  } catch (error) {
    console.error("Error createRecruitmentForm:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error inesperado al crear el formulario",
    });
  }
};

const getRecruitmentForms = async (req: any, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        mensaje: "Usuario no autenticado",
      });
    }

    const { includeDeleted = "false", onlyActive = "false" } = req.query as {
      includeDeleted?: string;
      onlyActive?: string;
    };

    const filters: any = {};

    if (onlyActive === "true") {
      filters.isActive = true;
    }

    if (includeDeleted !== "true") {
      filters.isDeleted = false;
    }

    const forms = await RecruitmentForm.find(filters)
      .populate("jobPosition")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      mensaje: "Formularios obtenidos correctamente",
      forms,
    });
  } catch (error) {
    console.error("Error getRecruitmentForms:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error inesperado al obtener formularios",
    });
  }
};

const getRecruitmentFormById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID no válido",
      });
    }

    const form = await RecruitmentForm.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!form) {
      return res.status(404).json({
        ok: false,
        mensaje: "Formulario no encontrado",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Formulario obtenido correctamente",
      form,
    });
  } catch (error) {
    console.error("Error getRecruitmentFormById:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error inesperado al obtener el formulario",
    });
  }
};

const getRecruitmentFormByToken = async (req: any, res: Response) => {
  try {
    const { token } = req.params;

    const form = await RecruitmentForm.findOne({
      publicToken: token,
      isActive: true,
      isDeleted: false,
    })
      .populate("jobPosition")
      .select("-createdBy -isDeleted")
      .lean();

    if (!form) {
      return res.status(404).json({
        ok: false,
        mensaje: "Formulario no disponible",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Formulario público obtenido correctamente",
      form,
    });
  } catch (error) {
    console.error("Error getRecruitmentFormByToken:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error inesperado al obtener el formulario público",
    });
  }
};

const updateRecruitmentForm = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      fields,
      isActive,
      autoAiEvaluation,
      jobPosition,
      aiAgent,
    } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: "ID no válido" });
    }

    const form = await RecruitmentForm.findOne({ _id: id, isDeleted: false });
    if (!form) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Formulario no encontrado" });
    }

    // ---------- TITLE / DESCRIPTION ----------
    if (typeof title === "string" && title.trim().length)
      form.title = title.trim();
    if (typeof description === "string") form.description = description.trim();

    // ---------- JOB POSITION ----------
    // (permite setearlo o quitarlo)
    if (typeof jobPosition !== "undefined") {
      if (jobPosition === "" || jobPosition === null) {
        form.jobPosition = undefined;
      } else {
        if (!Types.ObjectId.isValid(jobPosition)) {
          return res
            .status(400)
            .json({ ok: false, mensaje: "jobPosition no es ObjectId válido" });
        }
        form.jobPosition = new Types.ObjectId(jobPosition);
      }
    }

    if (typeof aiAgent !== "undefined") {
      if (aiAgent === "" || aiAgent === null) {
        form.aiAgent = null;
      } else {
        if (!Types.ObjectId.isValid(aiAgent)) {
          return res.status(400).json({
            ok: false,
            mensaje: "aiAgent no es ObjectId válido",
          });
        }
        form.aiAgent = new Types.ObjectId(aiAgent);
      }
    }

    // ---------- FIELDS ----------
    let parsedFields: any[] | null = null;

    if (typeof fields === "string") {
      try {
        parsedFields = JSON.parse(fields);
      } catch (e) {
        console.error("Error parseando fields en updateRecruitmentForm:", e);
        return res
          .status(400)
          .json({ ok: false, mensaje: "Formato de fields inválido" });
      }
    } else if (Array.isArray(fields)) {
      parsedFields = fields;
    }

    if (Array.isArray(parsedFields) && parsedFields.length > 0) {
      form.fields = parsedFields.map((f: any, index: number) => ({
        key: f.key,
        groupKey: f.groupKey,
        order: typeof f.order === "number" ? f.order : index,
        requiredOverride:
          typeof f.requiredOverride === "boolean"
            ? f.requiredOverride
            : undefined,
      })) as any;
    }

    // ---------- isActive ----------
    const parsedIsActive = parseBooleanFromFormData(isActive);
    if (typeof parsedIsActive === "boolean") form.isActive = parsedIsActive;

    // ---------- autoAiEvaluation ----------
    const parsedAutoAiEvaluation = parseBooleanFromFormData(autoAiEvaluation);
    if (typeof parsedAutoAiEvaluation === "boolean")
      form.autoAiEvaluation = parsedAutoAiEvaluation;

    // ---------- REMOVE EXISTING (docs/images) ----------
    const removedDocuments = safeJsonParseArray(req.body.removedDocuments);
    const removedImages = safeJsonParseArray(req.body.removedImages);

    // Aquí asumo que guardas strings (urls). Si guardas objetos {url}, dímelo y lo ajusto.
    if (Array.isArray(form.documents)) {
      form.documents = form.documents.filter(
        (u: any) => !removedDocuments.includes(u)
      );
    }
    if (Array.isArray(form.images)) {
      form.images = form.images.filter((u: any) => !removedImages.includes(u));
    }

    // ---------- ADD NEW UPLOADS ----------
    const newDocs = Array.isArray(req.uploaded?.files)
      ? req.uploaded.files
      : [];
    const newImgs = Array.isArray(req.uploaded?.images)
      ? req.uploaded.images
      : [];

    if (!Array.isArray(form.documents)) form.documents = [];
    if (!Array.isArray(form.images)) form.images = [];

    // evita duplicados
    newDocs.forEach((u: string) => {
      if (u && !form.documents.includes(u)) form.documents.push(u);
    });
    newImgs.forEach((u: string) => {
      if (u && !form.images.includes(u)) form.images.push(u);
    });

    await form.save();

    return res.json({
      ok: true,
      mensaje: "Formulario actualizado correctamente",
      form,
    });
  } catch (error) {
    console.error("Error updateRecruitmentForm:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error inesperado al actualizar el formulario",
    });
  }
};

const deleteRecruitmentForm = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID no válido",
      });
    }

    const form = await RecruitmentForm.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!form) {
      return res.status(404).json({
        ok: false,
        mensaje: "Formulario no encontrado",
      });
    }

    form.isDeleted = true;
    form.isActive = false;
    await form.save();

    return res.json({
      ok: true,
      mensaje: "Formulario eliminado correctamente",
    });
  } catch (error) {
    console.error("Error deleteRecruitmentForm:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error inesperado al eliminar el formulario",
    });
  }
};

const deleteFormDocument = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        mensaje: "Id no valido",
      });
    }

    const form = await RecruitmentForm.findByIdAndUpdate(id, {
      document: null,
    });

    if (!form) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ha ocurrido un error",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Documento eliminado correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Error inesperado al eliminar el formulario",
    });
  }
};

export {
  createRecruitmentForm,
  getRecruitmentForms,
  getRecruitmentFormById,
  getRecruitmentFormByToken,
  updateRecruitmentForm,
  deleteRecruitmentForm,
  deleteFormDocument,
};
