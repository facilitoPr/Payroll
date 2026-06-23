import { Router } from "express";
import { check } from "express-validator";

import * as vacationPolicy from "../../controllers/employee-payment-management/vacation/leavePolicy.controller";
import { validateJWT } from "../../middlewares/validate-jwt";
import { validarFields } from "../../middlewares/validate-fields";

const leavePolicyRouter: any = Router();

leavePolicyRouter.use(validateJWT);

leavePolicyRouter.get(
  "/",
  vacationPolicy.getVacationPolicies,
);

leavePolicyRouter.get(
  "/:id",
  [check("id", "El ID de la política no es válido").isMongoId(), validarFields],
  vacationPolicy.getVacationPolicyById,
);

leavePolicyRouter.post(
  "/",
  [
    check("name", "El nombre de la política es obligatorio").notEmpty(),
    check("code", "El código de la política es obligatorio").notEmpty(),
    check("defaultDays", "Los días base deben ser un número")
      .optional()
      .isNumeric(),
    check("seniorityDays", "Los días por antigüedad deben ser un número")
      .optional()
      .isNumeric(),
    check("seniorityYears", "Los años de antigüedad deben ser un número")
      .optional()
      .isNumeric(),
    validarFields,
  ],
  vacationPolicy.createVacationPolicy,
);

leavePolicyRouter.put(
  "/:id",
  [
    check("id", "El ID de la política no es válido").isMongoId(),
    check("defaultDays", "Los días base deben ser un número")
      .optional()
      .isNumeric(),
    check("seniorityDays", "Los días por antigüedad deben ser un número")
      .optional()
      .isNumeric(),
    check("seniorityYears", "Los años de antigüedad deben ser un número")
      .optional()
      .isNumeric(),
    validarFields,
  ],
  vacationPolicy.updateVacationPolicy,
);

leavePolicyRouter.delete(
  "/:id",
  [check("id", "El ID de la política no es válido").isMongoId(), validarFields],
  vacationPolicy.deleteVacationPolicy,
);

export default leavePolicyRouter;
