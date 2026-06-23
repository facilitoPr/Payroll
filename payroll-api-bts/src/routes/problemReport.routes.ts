import express = require("express");
import { body, param, query } from "express-validator";
import {
  createProblemReport,
  getProblemReportById,
  getProblemReports,
  getReportStatus,
  updateProblemReport,
  getProblemReportsCountNonRead,
} from "../controllers/problemReport.controller";

import { validateJWT } from "../middlewares/validate-jwt";
import { processUploadsArray } from "../middlewares/files";
const problemReportRouter: any = express.Router();

problemReportRouter.use(validateJWT);

// Crear
problemReportRouter.post(
  "/createProblemReport",
  [
    body("comercial", "comercial es requerido").isMongoId(),
    body("reminders", "reminders es requerido").isMongoId(),
    body("date", "date es requerido").notEmpty(),
    body("note", "note es requerido (>=5)").isString().isLength({ min: 5 }),
  ],
  createProblemReport,
);

problemReportRouter.get(
  "/getProblemReportById/:id",
  [param("id", "ID inválido").isMongoId()],
  getProblemReportById,
);
problemReportRouter.get(
  "/getProblemReportsCountNonRead",
  getProblemReportsCountNonRead,
);

problemReportRouter.get("/getReportStatus", getReportStatus);

problemReportRouter.get(
  "/getProblemReports/:limit/:initial",
  [
    query("comercial").optional().isMongoId(),
    query("reminders").optional().isMongoId(),
    query("dateFrom").optional().isISO8601(),
    query("dateTo").optional().isISO8601(),
    query("isActived").optional().isBoolean().toBoolean(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 200 }),
  ],
  getProblemReports,
);

problemReportRouter.put(
  "/updateProblemReport/:id",
  [validateJWT, processUploadsArray("files")],
  updateProblemReport,
);

export default problemReportRouter;
