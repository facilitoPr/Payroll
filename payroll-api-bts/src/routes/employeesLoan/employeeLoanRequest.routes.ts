import { Router } from "express";
import { check } from "express-validator";

import * as employeeLoanRequest from "../../controllers/employeeLoan/employeeLoanRequest.controller";
import { validateJWT } from "../../middlewares/validate-jwt";
import { validarFields } from "../../middlewares/validate-fields";
import { createUploadFieldsProcessor } from "../../middlewares/upload/createUploadFieldsProcessor";

const employeeLoanRequestRouter: any = Router();

employeeLoanRequestRouter.use(validateJWT);

const uploadCompanyImages = createUploadFieldsProcessor([
  {
    name: "signatureImage",
    maxCount: 1,
    folder: "contracts/signatures",
    kind: "image",
  },
]);

/**
 * Employee portal
 */
employeeLoanRequestRouter.get(
  "/requests/eligibility",
  employeeLoanRequest.getMyEmployeeLoanEligibility,
);

employeeLoanRequestRouter.post(
  "/requests",
  [
    check("requestedAmount", "requestedAmount es obligatorio").notEmpty(),
    check("requestedAmount", "requestedAmount debe ser numérico").isNumeric(),

    check("guaranteedDays", "guaranteedDays debe ser numérico")
      .optional()
      .isNumeric(),

    check("requestedInstallments", "requestedInstallments debe ser numérico")
      .optional()
      .isNumeric(),

    validarFields,
  ],
  employeeLoanRequest.createEmployeeLoanRequest,
);

employeeLoanRequestRouter.get(
  "/requests/mine",
  employeeLoanRequest.getMyEmployeeLoanRequests,
);

employeeLoanRequestRouter.post(
  "/requests/:id/cancel",
  [
    check("id", "El ID de la solicitud no es válido").isMongoId(),
    validarFields,
  ],
  employeeLoanRequest.cancelMyEmployeeLoanRequest,
);

employeeLoanRequestRouter.post(
  "/requests/quote",
  [
    check("requestedAmount", "El monto solicitado es requerido.").isNumeric(),
    check("guaranteedDays", "Los días de garantía son requeridos.").isNumeric(),
    check(
      "requestedInstallments",
      "La cantidad de cuotas es requerida.",
    ).isNumeric(),
    validarFields,
  ],
  employeeLoanRequest.quoteMyEmployeeLoanRequest,
);

employeeLoanRequestRouter.post(
  "/requests/sign-contract",
  [
    uploadCompanyImages,
    check("requestedAmount", "El monto solicitado es requerido.").isNumeric(),
    check("guaranteedDays", "Los días de garantía son requeridos.").isNumeric(),
    check(
      "requestedInstallments",
      "La cantidad de cuotas es requerida.",
    ).isNumeric(),
    check("signatureName", "El nombre de firma es requerido.").notEmpty(),
    validarFields,
  ],
  employeeLoanRequest.signMyEmployeeLoanContract,
);

/**
 * Admin / manager
 */
employeeLoanRequestRouter.get(
  "/requests",
  employeeLoanRequest.getEmployeeLoanRequests,
);

employeeLoanRequestRouter.post(
  "/requests/:id/admin/cancel",
  [
    check("id", "El ID de la solicitud no es válido").isMongoId(),
    validarFields,
  ],
  employeeLoanRequest.cancelEmployeeLoanRequestByAdmin,
);

employeeLoanRequestRouter.get(
  "/requests/:id/history",
  [
    check("id", "El ID de la solicitud no es válido").isMongoId(),
    validarFields,
  ],
  employeeLoanRequest.getEmployeeLoanRequestHistory,
);

employeeLoanRequestRouter.get(
  "/requests/:id",
  [
    check("id", "El ID de la solicitud no es válido").isMongoId(),
    validarFields,
  ],
  employeeLoanRequest.getEmployeeLoanRequestById,
);

export default employeeLoanRequestRouter;
