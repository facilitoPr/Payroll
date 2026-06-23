import { Router } from "express";
import { check } from "express-validator";

import * as employeeLoanPolicy from "../../controllers/employeeLoan/employeeLoanPolicy.controller";
import { validateJWT } from "../../middlewares/validate-jwt";
import { validarFields } from "../../middlewares/validate-fields";

const employeeLoanPolicyRouter: any = Router();

employeeLoanPolicyRouter.use(validateJWT);

employeeLoanPolicyRouter.get("/", employeeLoanPolicy.getEmployeeLoanPolicies);

employeeLoanPolicyRouter.post(
  "/",
  [
    check("name", "El nombre es obligatorio").notEmpty(),
    check("code", "El código es obligatorio").notEmpty(),
    validarFields,
  ],
  employeeLoanPolicy.createEmployeeLoanPolicy,
);

employeeLoanPolicyRouter.put(
  "/:id",
  [check("id", "El ID de la política no es válido").isMongoId(), validarFields],
  employeeLoanPolicy.updateEmployeeLoanPolicy,
);

employeeLoanPolicyRouter.delete(
  "/:id",
  [check("id", "El ID de la política no es válido").isMongoId(), validarFields],
  employeeLoanPolicy.deleteEmployeeLoanPolicy,
);

export default employeeLoanPolicyRouter;