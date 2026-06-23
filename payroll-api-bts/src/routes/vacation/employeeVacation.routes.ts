import { Router } from "express";
import { check } from "express-validator";

import * as employeeVacation from "../../controllers/employee-payment-management/vacation/employeeVacation.controller";
import { validateJWT } from "../../middlewares/validate-jwt";
import { validarFields } from "../../middlewares/validate-fields";

const employeeVacationRouter: any = Router();

employeeVacationRouter.use(validateJWT);

employeeVacationRouter.get(
  "/employee/:userId/summary",
  [
    check("userId", "El ID del empleado no es válido").isMongoId(),
    validarFields,
  ],
  employeeVacation.getEmployeeVacationSummary,
);

employeeVacationRouter.get(
  "/employee/:userId/movements",
  [
    check("userId", "El ID del empleado no es válido").isMongoId(),
    validarFields,
  ],
  employeeVacation.getEmployeeVacationMovements,
);

employeeVacationRouter.put(
  "/balance/:balanceId/manual-adjustment",
  [
    check("balanceId", "El ID del balance no es válido").isMongoId(),
    check("days", "La cantidad de días es obligatoria").notEmpty(),
    check("days", "La cantidad de días debe ser numérica").isNumeric(),
    check("reason", "El motivo del ajuste es obligatorio").notEmpty(),
    validarFields,
  ],
  employeeVacation.manualAdjustment,
);

employeeVacationRouter.get(
  "/my-summary",
  employeeVacation.getMyVacationSummary,
);

export default employeeVacationRouter;