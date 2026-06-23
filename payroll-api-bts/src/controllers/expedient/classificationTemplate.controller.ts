import { Request, Response } from "express";
import ClassificationTemplate from "../../model/expedient/classificationTemplate";

export const getActiveTemplate = async (req: Request, res: Response) => {
  try {
    const { code } = req.query as any;

    const filter: any = { isDeleted: false, isActive: true };
    if (code && String(code).trim() !== "") filter.code = String(code).trim();

    const tpl = await ClassificationTemplate.findOne(filter)
      .sort({ version: -1 })
      .lean();

    return res.status(200).json({
      ok: true,
      template: tpl || null,
      mensaje: tpl ? "Template activo encontrado" : "No hay template activo",
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

export const createTemplateVersion = async (req: any, res: Response) => {
  try {
    const { code, name, sections } = req.body;

    if (!code || !name) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "code y name son requeridos" });
    }

    const last = await ClassificationTemplate.findOne({
      code,
      isDeleted: false,
    })
      .sort({ version: -1 })
      .lean();

    const nextVersion = (last?.version || 0) + 1;

    // Desactiva los anteriores activos de ese code (opcional, recomendado)
    await ClassificationTemplate.updateMany(
      { code, isDeleted: false, isActive: true },
      { isActive: false }
    );

    const tpl = await ClassificationTemplate.create({
      code,
      name,
      version: nextVersion,
      isActive: true,
      isDeleted: false,
      sections: Array.isArray(sections) ? sections : [],
    });

    return res.status(201).json({
      ok: true,
      template: tpl,
      mensaje: "Template creado (nueva versión)",
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};
