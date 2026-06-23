import { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Company, { NormalizedCompanyPayload } from "../model/company";
import { AuthRequest } from "../middlewares/validate-jwt";
import { parseBody } from "../helper/parse";
import { cleanString } from "../helper/string/string.clean";
import { normalizeCompanyPayload } from "../helper/company/company.normalize";
import {
  setOnlyOneDefaultCompany,
  validateCompanyUniqueFields,
} from "../services/company/company.service";
import {
  applyPayloadToCompany,
  mapCompanyToProfileResponse,
} from "../helper/company/company.data";
import { ensureEmployeeLoanPolicyForCompany, softDeleteEmployeeLoanPolicyByCompany } from "../services/employeeLoan/employeeLoanRequest.service";

const JSON_FIELDS = [
  "address",
  "fiscalInfo",
  "settings",
  "banking",
  "bankFileConfig",
  "publicProfile",
];

const toBoolean = (value: any) => {
  return value === true || value === "true" || value === "1" || value === 1;
};

const removeAccents = (value: string) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const buildCompanyCodeBase = (value: string) => {
  const clean = removeAccents(value)
    .toUpperCase()
    .trim()
    .replace(/&/g, " Y ")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  return clean || "COMPANY";
};

const generateUniqueCompanyCode = async ({
  name,
  excludeCompanyId,
}: {
  name: string;
  excludeCompanyId?: string;
}) => {
  const baseCode = buildCompanyCodeBase(name);
  let candidate = baseCode;
  let counter = 1;

  while (true) {
    const query: any = {
      code: candidate,
      isDeleted: false,
    };

    if (excludeCompanyId) {
      query._id = { $ne: excludeCompanyId };
    }

    const exists = await Company.exists(query);

    if (!exists) {
      return candidate;
    }

    counter += 1;
    candidate = `${baseCode}_${counter}`;
  }
};

const getUploadedFileUrl = (value: any): string => {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return getUploadedFileUrl(value[0]);
  }

  return (
    value.url ||
    value.location ||
    value.Location ||
    value.path ||
    value.secure_url ||
    ""
  );
};

const ensureObject = (value: any) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
};

const mergeUploadedImagesIntoBody = (req: AuthRequest, body: any = {}) => {
  const uploadedFilesMap = (req as any).uploadedFilesMap || {};

  const nextBody: any = {
    ...body,
  };

  /**
   * Primero procesamos eliminaciones.
   * Si luego viene un archivo nuevo, el archivo nuevo gana.
   */
  if (toBoolean(nextBody.removeLogo)) {
    nextBody.logo = "";
    nextBody.logoUrl = "";
  }

  if (toBoolean(nextBody.removeCover)) {
    nextBody.coverUrl = "";
  }

  /**
   * publicProfile puede venir como JSON string desde FormData.
   */
  let publicProfile: any = nextBody.publicProfile;

  if (typeof publicProfile === "string") {
    try {
      publicProfile = JSON.parse(publicProfile);
    } catch {
      publicProfile = {};
    }
  }

  publicProfile = ensureObject(publicProfile);

  publicProfile.images = {
    ...(publicProfile.images || {}),
  };

  if (toBoolean(nextBody.removePublicMain)) {
    publicProfile.images.main = "";
  }

  if (toBoolean(nextBody.removePublicSecondary)) {
    publicProfile.images.secondary = "";
  }

  if (toBoolean(nextBody.removePublicThird)) {
    publicProfile.images.third = "";
  }

  if (toBoolean(nextBody.removePublicTrajectory)) {
    publicProfile.images.trajectory = "";
  }

  if (toBoolean(nextBody.removePublicHero)) {
    publicProfile.images.hero = "";
  }

  /**
   * Luego procesamos archivos subidos.
   */
  const logoUrl = getUploadedFileUrl(uploadedFilesMap.logo);

  if (logoUrl) {
    nextBody.logo = logoUrl;
    nextBody.logoUrl = logoUrl;
  }

  const coverUrl = getUploadedFileUrl(uploadedFilesMap.cover);

  if (coverUrl) {
    nextBody.coverUrl = coverUrl;
  }

  const publicMainUrl = getUploadedFileUrl(uploadedFilesMap.publicMain);
  const publicSecondaryUrl = getUploadedFileUrl(
    uploadedFilesMap.publicSecondary,
  );
  const publicThirdUrl = getUploadedFileUrl(uploadedFilesMap.publicThird);
  const publicTrajectoryUrl = getUploadedFileUrl(
    uploadedFilesMap.publicTrajectory,
  );
  const publicHeroUrl = getUploadedFileUrl(uploadedFilesMap.publicHero);

  if (publicMainUrl) {
    publicProfile.images.main = publicMainUrl;
  }

  if (publicSecondaryUrl) {
    publicProfile.images.secondary = publicSecondaryUrl;
  }

  if (publicThirdUrl) {
    publicProfile.images.third = publicThirdUrl;
  }

  if (publicTrajectoryUrl) {
    publicProfile.images.trajectory = publicTrajectoryUrl;
  }

  if (publicHeroUrl) {
    publicProfile.images.hero = publicHeroUrl;
  }

  nextBody.publicProfile = publicProfile;

  return nextBody;
};

//

const getCompanyPublicList = async (req: Request, res: Response) => {
  try {
    const { search = "" } = req.query as {
      search?: string;
    };

    const query: any = {
      isDeleted: false,
      isActive: true,
      showInPublicLanding: { $ne: false },
    };

    const term = cleanString(search);

    if (term) {
      query.$or = [
        { code: { $regex: term, $options: "i" } },
        { name: { $regex: term, $options: "i" } },
        { legalName: { $regex: term, $options: "i" } },
        { tradeName: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
        { phone: { $regex: term, $options: "i" } },
      ];
    }

    const companies = await Company.find(query)
      .select(
        [
          "_id",
          "code",
          "name",
          "legalName",
          "tradeName",
          "logo",
          "logoUrl",
          "primaryColor",
          "secondaryColor",
          "email",
          "phone",
          "website",
          "isDefault",
          "publicProfile",
        ].join(" "),
      )
      .sort({ isDefault: -1, legalName: 1, tradeName: 1 })
      .lean();

    return res.status(200).json({
      ok: true,
      mensaje: "Compañías públicas obtenidas correctamente.",
      companies: companies.map(normalizeCompanyPayload),
    });
  } catch (error) {
    console.error("getCompanyPublicList error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener las compañías públicas.",
      error,
    });
  }
};

const getCompanyPublicByKey = async (req: Request, res: Response) => {
  try {
    const { companyKey } = req.params;

    const cleanKey = cleanString(companyKey);

    if (!cleanKey) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debe enviar el código o ID de la compañía.",
      });
    }

    const query: any = {
      isDeleted: false,
      isActive: true,
      showInPublicLanding: { $ne: false },
      $or: [{ code: cleanKey }],
    };

    if (Types.ObjectId.isValid(cleanKey)) {
      query.$or.push({ _id: new Types.ObjectId(cleanKey) });
    }

    const company = await Company.findOne(query)
      .select(
        [
          "_id",
          "code",
          "name",
          "legalName",
          "tradeName",
          "logo",
          "logoUrl",
          "primaryColor",
          "secondaryColor",
          "email",
          "phone",
          "website",
          "isDefault",
          "publicProfile",
        ].join(" "),
      )
      .lean();

    if (!company) {
      return res.status(404).json({
        ok: false,
        mensaje: "Compañía no encontrada.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Compañía obtenida correctamente.",
      company: normalizeCompanyPayload(company),
    });
  } catch (error) {
    console.error("getCompanyPublicByKey error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener la compañía.",
      error,
    });
  }
};

const getCompanyAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { search = "", isActive = "" } = req.query as {
      search?: string;
      isActive?: string;
    };

    const query: any = {
      isDeleted: false,
    };

    if (isActive === "true") query.isActive = true;
    if (isActive === "false") query.isActive = false;

    const term = cleanString(search);

    if (term) {
      query.$or = [
        { code: { $regex: term, $options: "i" } },
        { legalName: { $regex: term, $options: "i" } },
        { tradeName: { $regex: term, $options: "i" } },
        { taxId: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
        { phone: { $regex: term, $options: "i" } },
        { businessGroupName: { $regex: term, $options: "i" } },
        { "banking.originBankName": { $regex: term, $options: "i" } },
        { "banking.originAccountNumber": { $regex: term, $options: "i" } },
        { "bankFileConfig.agreementCode": { $regex: term, $options: "i" } },
      ];
    }

    const companies = await Company.find(query)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ isDefault: -1, legalName: 1 });

    return res.status(200).json({
      ok: true,
      mensaje: "Compañías obtenidas correctamente.",
      companies,
    });
  } catch (error) {
    console.error("getCompanyAdmin error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener las compañías.",
      error,
    });
  }
};

const getCompanyById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de compañía inválido.",
      });
    }

    const company = await Company.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!company) {
      return res.status(404).json({
        ok: false,
        mensaje: "Compañía no encontrada.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Compañía obtenida correctamente.",
      company,
      profile: mapCompanyToProfileResponse(company),
      data: company,
    });
  } catch (error) {
    console.error("getCompanyById error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener la compañía.",
      error,
    });
  }
};

const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    const mergedBody = mergeUploadedImagesIntoBody(req, req.body);
    const parsed = parseBody(mergedBody, JSON_FIELDS);

    if (!parsed.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: `Campo inválido: ${parsed.key} (JSON mal formado).`,
      });
    }

    const userId = req.uid;
    const payload = normalizeCompanyPayload(parsed.data);

    if (!payload.legalName) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre legal de la compañía es obligatorio.",
      });
    }

    const nameForCode =
      payload.tradeName ||
      payload.legalName ||
      parsed.data.tradeName ||
      parsed.data.legalName;

    payload.code = await generateUniqueCompanyCode({
      name: nameForCode,
    });

    const uniqueValidation = await validateCompanyUniqueFields({
      code: payload?.code,
      taxId: payload.taxId,
    });

    if (!uniqueValidation.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: uniqueValidation.mensaje,
      });
    }

    const totalCompanies = await Company.countDocuments({
      isDeleted: false,
    });

    const company = new Company({
      ...payload,
      isDefault: totalCompanies === 0 ? true : payload.isDefault,
      createdBy: userId,
      updatedBy: userId,
    });

    await company.save();

    if (company.isDefault) {
      await setOnlyOneDefaultCompany(company._id);
    }

    const loanPolicyResult = await ensureEmployeeLoanPolicyForCompany({
      companyId: company._id,
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Compañía creada correctamente.",
      company,
      profile: mapCompanyToProfileResponse(company),
      data: company,
      employeeLoanPolicy: loanPolicyResult.policy,
    });
  } catch (error: any) {
    console.error("createCompany error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ya existe una compañía con esos datos únicos.",
        error: error.keyValue,
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: "Error al crear la compañía.",
      error,
    });
  }
};

const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de compañía inválido.",
      });
    }

    const mergedBody = mergeUploadedImagesIntoBody(req, req.body);
    const parsed = parseBody(mergedBody, JSON_FIELDS);
    console.log(parsed);

    if (!parsed.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: `Campo inválido: ${parsed.key} (JSON mal formado).`,
      });
    }

    const userId = req.uid;
    const payload = normalizeCompanyPayload(parsed.data);

    if (!payload.legalName) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre legal de la compañía es obligatorio.",
      });
    }

    const company = await Company.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        ok: false,
        mensaje: "Compañía no encontrada.",
      });
    }

    const finalCode =
      company.code ||
      (await generateUniqueCompanyCode({
        name: payload.tradeName || payload.legalName,
        excludeCompanyId: id,
      }));

    const uniqueValidation = await validateCompanyUniqueFields({
      companyId: id,
      code: finalCode,
      taxId: payload.taxId,
    });

    if (!uniqueValidation.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: uniqueValidation.mensaje,
      });
    }

    applyPayloadToCompany({
      company,
      payload,
      includeCode: false,
      userId: String(userId),
    });

    if (!company.code) {
      company.code = finalCode;
    }

    await company.save();

    if (company.isDefault) {
      await setOnlyOneDefaultCompany(company._id);
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Compañía actualizada correctamente.",
      company,
      profile: mapCompanyToProfileResponse(company),
      data: company,
    });
  } catch (error: any) {
    console.error("updateCompany error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ya existe una compañía con esos datos únicos.",
        error: error.keyValue,
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar la compañía.",
      error,
    });
  }
};

const deleteCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.uid;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de compañía inválido.",
      });
    }

    const company = await Company.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        ok: false,
        mensaje: "Compañía no encontrada.",
      });
    }

    company.isDeleted = true;
    company.isActive = false;
    company.isDefault = false;
    company.updatedBy = userId as any;

    await company.save();

    await softDeleteEmployeeLoanPolicyByCompany({
      companyId: company._id,
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Compañía eliminada correctamente.",
      company,
      data: company,
    });
  } catch (error) {
    console.error("deleteCompany error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar la compañía.",
      error,
    });
  }
};

const changeCompanyStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.uid;
    const { isActive } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de compañía inválido.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        ok: false,
        mensaje: "El campo isActive debe ser booleano.",
      });
    }

    const company = await Company.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        ok: false,
        mensaje: "Compañía no encontrada.",
      });
    }

    company.isActive = isActive;
    company.updatedBy = userId as any;

    if (!isActive) {
      company.isDefault = false;
    }

    await company.save();

    return res.status(200).json({
      ok: true,
      mensaje: isActive
        ? "Compañía activada correctamente."
        : "Compañía desactivada correctamente.",
      company,
      profile: mapCompanyToProfileResponse(company),
      data: company,
    });
  } catch (error) {
    console.error("changeCompanyStatus error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al cambiar el estado de la compañía.",
      error,
    });
  }
};

const setDefaultCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.uid;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de compañía inválido.",
      });
    }

    const company = await Company.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        ok: false,
        mensaje: "Compañía no encontrada.",
      });
    }

    if (!company.isActive) {
      return res.status(400).json({
        ok: false,
        mensaje: "No puedes marcar como principal una compañía inactiva.",
      });
    }

    await setOnlyOneDefaultCompany(company._id);

    company.isDefault = true;
    company.updatedBy = userId as any;

    await company.save();

    return res.status(200).json({
      ok: true,
      mensaje: "Compañía marcada como principal correctamente.",
      company,
      profile: mapCompanyToProfileResponse(company),
      data: company,
    });
  } catch (error) {
    console.error("setDefaultCompany error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al marcar la compañía como principal.",
      error,
    });
  }
};

// =======================================================
// COMPANY PROFILE COMPATIBILITY
// =======================================================

export const getDefaultCompanyProfile = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    let company: any = await Company.findOne({
      isDefault: true,
      isDeleted: false,
    });

    if (!company) {
      company = await Company.findOne({
        isDeleted: false,
      }).sort({ createdAt: 1 });
    }

    if (!company) {
      const userId = req.uid;

      company = await Company.create({
        code: "DEFAULT",
        legalName: "Blue Technology Solution",
        tradeName: "Blue Technology Solution",
        taxId: "123",

        contactName: "",
        email: "",
        phone: "",
        website: "",

        logo: "",
        logoUrl: "",
        coverUrl: "",
        primaryColor: "#024D48",
        secondaryColor: "#1964A2",

        address: {
          country: "República Dominicana",
          state: "Distrito Nacional",
          city: "Santo Domingo",
          street: "",
          zipCode: "",
          fullAddress:
            "C. Horacio Fombona, Plaza Triemsa. Ensanche Quisqueya, Santo Domingo",
        },

        fiscalInfo: {
          taxRegime: "",
          fiscalAddress: "",
          notes: "",
        },

        settings: {
          timezone: "America/Santo_Domingo",
          currency: "DOP",
          language: "es",
        },

        banking: {
          originBankName: "",
          originBankCode: "",
          originBankDigit: "",
          originAccountType: "1",
          originAccountNumber: "",
          currencyCode: "214",
        },

        bankFileConfig: {
          agreementCode: "",
          serviceCode: "",
          defaultStatementDescription: "NOMINA",
          bankFileLayoutVersion: 1,
          fileEncoding: "utf8",
          lineEnding: "LF",
          defaultPaddingChar: " ",
          lastSequenceDate: "",
          lastSequenceNumber: 0,
        },

        notes: "",

        createdBy: userId,
        updatedBy: userId,

        isDefault: true,
        isActive: true,
        isDeleted: false,
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Perfil de compañía principal cargado.",
      company,
      profile: mapCompanyToProfileResponse(company),
      data: company,
    });
  } catch (error: any) {
    console.error("getDefaultCompanyProfile error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

export const upsertDefaultCompanyProfile = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const mergedBody = mergeUploadedImagesIntoBody(req, req.body);
    const parsed = parseBody(mergedBody);

    if (!parsed.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: `Campo inválido: ${parsed.key} (JSON mal formado).`,
      });
    }

    const userId = req.uid;
    const payload = normalizeCompanyPayload(parsed.data);

    let company: any = await Company.findOne({
      isDefault: true,
      isDeleted: false,
    });

    if (!company) {
      company = await Company.findOne({
        isDeleted: false,
      }).sort({ createdAt: 1 });
    }

    if (!company) {
      if (!payload.legalName) payload.legalName = "Blue Technology Solution";
      if (!payload.taxId) payload.taxId = "123";

      company = new Company({
        ...payload,
        isDefault: true,
        isActive: true,
        isDeleted: false,
        createdBy: userId,
        updatedBy: userId,
      });
    } else {
      if (!payload.legalName) {
        payload.legalName = company.legalName;
      }

      applyPayloadToCompany({
        company,
        payload,
        includeCode: false,
        userId: String(userId),
      });

      company.isDefault = true;
      company.isActive = true;
      company.isDeleted = false;
    }

    await company.save();

    await setOnlyOneDefaultCompany(company._id);

    return res.status(200).json({
      ok: true,
      mensaje: "Perfil de compañía principal actualizado.",
      company,
      profile: mapCompanyToProfileResponse(company),
      data: company,
    });
  } catch (error: any) {
    console.error("upsertDefaultCompanyProfile error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ya existe una compañía con esos datos únicos.",
        error: error.keyValue,
      });
    }

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

export const getCompanyProfileByCompanyId = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { companyId } = req.params;

    if (!isValidObjectId(companyId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de compañía inválido.",
      });
    }

    const company = await Company.findOne({
      _id: companyId,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        ok: false,
        mensaje: "Compañía no encontrada.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Perfil de compañía cargado correctamente.",
      company,
      profile: mapCompanyToProfileResponse(company),
      data: company,
    });
  } catch (error: any) {
    console.error("getCompanyProfileByCompanyId error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

export const upsertCompanyProfileByCompanyId = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { companyId } = req.params;

    if (!isValidObjectId(companyId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de compañía inválido.",
      });
    }

    const mergedBody = mergeUploadedImagesIntoBody(req, req.body);
    const parsed = parseBody(mergedBody);

    if (!parsed.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: `Campo inválido: ${parsed.key} (JSON mal formado).`,
      });
    }

    const userId = req.uid;
    const payload = normalizeCompanyPayload(parsed.data);

    const company = await Company.findOne({
      _id: companyId,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        ok: false,
        mensaje: "Compañía no encontrada.",
      });
    }

    if (!payload.legalName) {
      payload.legalName = company.legalName;
    }

    if (payload.taxId) {
      const taxIdExists = await Company.findOne({
        _id: { $ne: companyId },
        taxId: payload.taxId,
        isDeleted: false,
      });

      if (taxIdExists) {
        return res.status(400).json({
          ok: false,
          mensaje: "Ya existe otra compañía con ese RNC / Tax ID.",
        });
      }
    }

    applyPayloadToCompany({
      company,
      payload,
      includeCode: false,
      userId: String(userId),
    });

    await company.save();

    if (company.isDefault) {
      await setOnlyOneDefaultCompany(company._id);
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Perfil de compañía actualizado correctamente.",
      company,
      profile: mapCompanyToProfileResponse(company),
      data: company,
    });
  } catch (error: any) {
    console.error("upsertCompanyProfileByCompanyId error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ya existe una compañía con esos datos únicos.",
        error: error.keyValue,
      });
    }

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

export const getCompanyProfileById = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const company = await Company.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        ok: false,
        mensaje: "Perfil de compañía no encontrado.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Perfil de compañía cargado.",
      company,
      profile: mapCompanyToProfileResponse(company),
      data: company,
    });
  } catch (error: any) {
    console.error("getCompanyProfileById error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

export const deleteCompanyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.uid;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const company = await Company.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        ok: false,
        mensaje: "No encontrado.",
      });
    }

    if (company.isDefault) {
      return res.status(400).json({
        ok: false,
        mensaje: "No puedes eliminar la compañía principal.",
      });
    }

    company.isDeleted = true;
    company.isActive = false;
    company.isDefault = false;
    company.updatedBy = userId as any;

    await company.save();

    return res.status(200).json({
      ok: true,
      mensaje: "Perfil de compañía eliminado correctamente.",
      company,
      data: company,
    });
  } catch (error: any) {
    console.error("deleteCompanyProfile error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

// =======================================================
// SECUENCIA BANCARIA / ARCHIVO DE NÓMINA
// =======================================================

export const getNextCompanyBankFileSequence = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { companyId } = req.params;

    if (!isValidObjectId(companyId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de compañía inválido.",
      });
    }

    const company: any = await Company.findOne({
      _id: companyId,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        ok: false,
        mensaje: "Compañía no encontrada.",
      });
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const today = `${yyyy}${mm}${dd}`;

    const currentDate = company.bankFileConfig?.lastSequenceDate || "";
    const currentNumber = company.bankFileConfig?.lastSequenceNumber || 0;

    const nextNumber = currentDate === today ? currentNumber + 1 : 1;

    company.bankFileConfig = {
      ...(company.bankFileConfig || {}),
      lastSequenceDate: today,
      lastSequenceNumber: nextNumber,
    };

    await company.save();

    return res.status(200).json({
      ok: true,
      mensaje: "Secuencia generada correctamente.",
      sequenceDate: today,
      sequenceNumber: nextNumber,
      company,
      profile: mapCompanyToProfileResponse(company),
      data: {
        sequenceDate: today,
        sequenceNumber: nextNumber,
      },
    });
  } catch (error: any) {
    console.error("getNextCompanyBankFileSequence error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error al generar la secuencia bancaria.",
    });
  }
};

export {
  getCompanyPublicList,
  getCompanyPublicByKey,
  getCompanyAdmin,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  changeCompanyStatus,
  setDefaultCompany,
};
