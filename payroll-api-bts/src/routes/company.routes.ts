import { Router } from "express";
import { check } from "express-validator";
import * as company from "../controllers/company.controller";
import { validarFields } from "../middlewares/validate-fields";
import { validateJWT } from "../middlewares/validate-jwt";
import { createUploadFieldsProcessor } from "../middlewares/upload/createUploadFieldsProcessor";

const companyRouter: any = Router();

/**
 * Rutas públicas
 */
companyRouter.get("/public/list", company.getCompanyPublicList);
companyRouter.get("/public/:companyKey", company.getCompanyPublicByKey);

companyRouter.use(validateJWT);

/**
 * Imágenes de Company.
 *
 * logo            -> logo / logoUrl
 * cover           -> coverUrl
 * publicMain      -> publicProfile.images.main
 * publicSecondary -> publicProfile.images.secondary
 * publicThird     -> publicProfile.images.third
 * publicTrajectory-> publicProfile.images.trajectory
 * publicHero      -> publicProfile.images.hero
 */
const uploadCompanyImages = createUploadFieldsProcessor([
  {
    name: "logo",
    maxCount: 1,
    folder: "company/logos",
    kind: "image",
    imageOptions: {
      maxWidth: 700,
      format: "png",
    },
  },
  {
    name: "cover",
    maxCount: 1,
    folder: "company/covers",
    kind: "image",
    imageOptions: {
      maxWidth: 1800,
      format: "jpeg",
      quality: 92,
    },
  },
  {
    name: "publicMain",
    maxCount: 1,
    folder: "company/public/main",
    kind: "image",
    imageOptions: {
      maxWidth: 1600,
      format: "jpeg",
      quality: 92,
    },
  },
  {
    name: "publicSecondary",
    maxCount: 1,
    folder: "company/public/secondary",
    kind: "image",
    imageOptions: {
      maxWidth: 1400,
      format: "jpeg",
      quality: 90,
    },
  },
  {
    name: "publicThird",
    maxCount: 1,
    folder: "company/public/third",
    kind: "image",
    imageOptions: {
      maxWidth: 1400,
      format: "jpeg",
      quality: 90,
    },
  },
  {
    name: "publicTrajectory",
    maxCount: 1,
    folder: "company/public/trajectory",
    kind: "image",
    imageOptions: {
      maxWidth: 1600,
      format: "jpeg",
      quality: 92,
    },
  },
  {
    name: "publicHero",
    maxCount: 1,
    folder: "company/public/hero",
    kind: "image",
    imageOptions: {
      maxWidth: 1920,
      format: "jpeg",
      quality: 94,
    },
  },
]);
companyRouter.get("/", company.getCompanyAdmin);

companyRouter.get(
  "/:id",
  [
    check("id", "El ID de la compañía no es válido.").isMongoId(),
    validarFields,
  ],
  company.getCompanyById,
);

companyRouter.post(
  "/",
  uploadCompanyImages,
  [
    check("legalName", "El nombre legal es obligatorio.").notEmpty(),
    check("email", "El email no es válido.")
      .optional({ checkFalsy: true })
      .isEmail(),
    check("primaryColor", "El color primario debe ser hexadecimal.")
      .optional({ checkFalsy: true })
      .isHexColor(),
    check("secondaryColor", "El color secundario debe ser hexadecimal.")
      .optional({ checkFalsy: true })
      .isHexColor(),
    validarFields,
  ],
  company.createCompany,
);

companyRouter.put(
  "/:id",
  uploadCompanyImages,
  [
    check("id", "El ID de la compañía no es válido.").isMongoId(),
    check("legalName", "El nombre legal es obligatorio.").notEmpty(),
    check("email", "El email no es válido.")
      .optional({ checkFalsy: true })
      .isEmail(),
    check("primaryColor", "El color primario debe ser hexadecimal.")
      .optional({ checkFalsy: true })
      .isHexColor(),
    check("secondaryColor", "El color secundario debe ser hexadecimal.")
      .optional({ checkFalsy: true })
      .isHexColor(),
    validarFields,
  ],
  company.updateCompany,
);

companyRouter.delete(
  "/:id",
  [
    check("id", "El ID de la compañía no es válido.").isMongoId(),
    validarFields,
  ],
  company.deleteCompany,
);

companyRouter.patch(
  "/:id/change-status",
  [
    check("id", "El ID de la compañía no es válido.").isMongoId(),
    check("isActive", "El campo isActive debe ser booleano.").isBoolean(),
    validarFields,
  ],
  company.changeCompanyStatus,
);

companyRouter.patch(
  "/:id/default",
  [
    check("id", "El ID de la compañía no es válido.").isMongoId(),
    validarFields,
  ],
  company.setDefaultCompany,
);

/**
 * Compatibilidad con CompanyProfile anterior
 */
companyRouter.get("/profile/default", company.getDefaultCompanyProfile);

companyRouter.put(
  "/profile/default",
  uploadCompanyImages,
  company.upsertDefaultCompanyProfile,
);

companyRouter.get(
  "/profile/company/:companyId",
  [
    check("companyId", "El ID de la compañía no es válido.").isMongoId(),
    validarFields,
  ],
  company.getCompanyProfileByCompanyId,
);

companyRouter.put(
  "/profile/company/:companyId",
  uploadCompanyImages,
  [
    check("companyId", "El ID de la compañía no es válido.").isMongoId(),
    validarFields,
  ],
  company.upsertCompanyProfileByCompanyId,
);

companyRouter.get(
  "/profile/:id",
  [check("id", "El ID del perfil no es válido.").isMongoId(), validarFields],
  company.getCompanyProfileById,
);

companyRouter.delete(
  "/profile/:id",
  [check("id", "El ID del perfil no es válido.").isMongoId(), validarFields],
  company.deleteCompanyProfile,
);

/**
 * Secuencia bancaria
 */
companyRouter.post(
  "/bank-file-sequence/:companyId",
  [
    check("companyId", "El ID de la compañía no es válido.").isMongoId(),
    validarFields,
  ],
  company.getNextCompanyBankFileSequence,
);

export default companyRouter;
