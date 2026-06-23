import { Request, Response } from "express";
import { Types, isValidObjectId } from "mongoose";
import CompanyProfile from "../model/companyProfile";
import { pickAllowedFields } from "../helper/companyProfile/companyProfile.allowed";

const tryParseJSON = (value: any) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};


const getDefaultCompanyProfile = async (req: any, res: Response) => {
  try {
    let profile: any = await CompanyProfile.findOne({
      code: "DEFAULT",
      isDeleted: false,
    }).lean();

    if (!profile) {
      // ✅ Crea stub (no rompe required porque empty string cuenta como "presente")
      const created = await CompanyProfile.create({
        code: "DEFAULT",
        isDefault: true,

        // mínimos (required)
        legalName: "Blue Technology Solution",
        taxId: "123",
        address: "C. Horacio Fombona, Plaza Triemsa. Ensanche Quisquella, Santo Domingo",

        // estándar
        isActive: true,
        isDeleted: false,
      });

      profile = created.toObject();
    }

    return res.status(200).json({
      ok: true,
      mensaje: "CompanyProfile (DEFAULT) cargado.",
      profile,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

const upsertDefaultCompanyProfile = async (req: any, res: Response) => {
  try {
    // ✅ payload puede venir con strings JSON por FormData
    const parsedBody: any = {};
    for (const [k, v] of Object.entries(req.body || {})) {
      const parsed = tryParseJSON(v);
      if (parsed === null) {
        return res.status(400).json({
          ok: false,
          mensaje: `Campo inválido: ${k} (JSON mal formado).`,
        });
      }
      parsedBody[k] = parsed;
    }

    const data = pickAllowedFields(parsedBody);

    // ✅ Asegura que DEFAULT siempre sea default y activo
    data.code = "DEFAULT";
    data.isDefault = true;
    data.isActive = true;
    data.isDeleted = false;

    // (Opcional) si manejas uploads: req.uploaded?.images, puedes mapear:
    // if (req.uploaded?.images?.length) data.logoUrl = req.uploaded.images[0];

    const updated = await CompanyProfile.findOneAndUpdate(
      { code: "DEFAULT", isDeleted: false },
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(200).json({
      ok: true,
      mensaje: "CompanyProfile (DEFAULT) actualizado.",
      profile: updated,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

const getCompanyProfileById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ ok: false, mensaje: "ID inválido" });
    }

    const profile = await CompanyProfile.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    }).lean();

    if (!profile) {
      return res.status(404).json({
        ok: false,
        mensaje: "CompanyProfile no encontrado",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "CompanyProfile cargado.",
      profile,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

const deleteCompanyProfile = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ ok: false, mensaje: "ID inválido" });
    }

    const existing = await CompanyProfile.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existing) {
      return res.status(404).json({ ok: false, mensaje: "No encontrado" });
    }

    if (existing.code === "DEFAULT" || existing.isDefault) {
      return res.status(400).json({
        ok: false,
        mensaje: "No puedes eliminar el CompanyProfile DEFAULT.",
      });
    }

    existing.isDeleted = true;
    existing.isActive = false;
    existing.isDefault = false;
    await existing.save();

    return res.status(200).json({
      ok: true,
      mensaje: "CompanyProfile eliminado (soft delete).",
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

export {
  getDefaultCompanyProfile,
  upsertDefaultCompanyProfile,
  getCompanyProfileById,
  deleteCompanyProfile,
};
