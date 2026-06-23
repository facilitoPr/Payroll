import { Router } from "express";
import { query, body } from "express-validator";

import * as zonesTeams from "../controllers/zonesTeams.controller";
import { validateJWT } from "../middlewares/validate-jwt";
import { validarFields } from "../middlewares/validate-fields";

const zonesTeamsRouter = Router();

zonesTeamsRouter.use(validateJWT);

// GET zonesTeams/getAssignmentsByMonth?month=YYYY-MM&programId=...
zonesTeamsRouter.get(
  "/getAssignmentsByMonth",
  [
    query("month")
      .notEmpty()
      .withMessage("month es requerido (YYYY-MM).")
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage("month debe ser YYYY-MM."),
    // programId opcional si usas ENV ZONE_TEAMS_PROGRAM_ID
    query("programId")
      .optional()
      .isMongoId()
      .withMessage("programId inválido."),
    validarFields,
  ],
  zonesTeams.getAssignmentsByMonth,
);

// POST zonesTeams/runAutoAssignment  { month, programId?, force?, updateUsersZone? }
zonesTeamsRouter.post(
  "/runAutoAssignment",
  [
    body("month")
      .notEmpty()
      .withMessage("month es requerido (YYYY-MM).")
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage("month debe ser YYYY-MM."),
    body("programId").optional().isMongoId().withMessage("programId inválido."),
    body("force").optional().isBoolean().withMessage("force debe ser boolean."),
    body("updateUsersZone")
      .optional()
      .isBoolean()
      .withMessage("updateUsersZone debe ser boolean."),
    validarFields,
  ],
  zonesTeams.runAutoAssignment,
);

// GET zonesTeams/getUserHistory?userId=...&months=12&programId=...
zonesTeamsRouter.get(
  "/getUserHistory",
  [
    query("userId").notEmpty().isMongoId().withMessage("userId inválido."),
    query("months")
      .optional()
      .isInt({ min: 1, max: 60 })
      .withMessage("months inválido."),
    query("programId")
      .optional()
      .isMongoId()
      .withMessage("programId inválido."),
    validarFields,
  ],
  zonesTeams.getUserHistory,
);

zonesTeamsRouter.post("/setManualAssignment", zonesTeams.setManualAssignment);

export default zonesTeamsRouter;
