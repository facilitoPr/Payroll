import { Router } from "express";
import { check } from "express-validator";
import * as payrollPolicy from "../controllers/employee-payment-management/payrollPolicy.controller";
import { validateJWT } from "../middlewares/validate-jwt";
import { validarFields } from "../middlewares/validate-fields";

const payrollPolicyRouter: any = Router();

payrollPolicyRouter.use(validateJWT);

payrollPolicyRouter.get(
  "/company/:companyId",
  [check("companyId", "companyId es requerido").not().isEmpty(), validarFields],
  payrollPolicy.getPayrollPolicyByCompany,
);

payrollPolicyRouter.post(
  "/upsert",
  [
    check("companyId", "companyId es requerido").not().isEmpty(),
    check("rdFactorDiasMes", "rdFactorDiasMes debe ser numérico")
      .optional()
      .isNumeric(),
    check("lateGraceMinutes", "lateGraceMinutes debe ser numérico")
      .optional()
      .isNumeric(),
    validarFields,
  ],
  payrollPolicy.upsertPayrollPolicy,
);

payrollPolicyRouter.delete(
  "/:id",
  [check("id", "id es requerido").not().isEmpty(), validarFields],
  payrollPolicy.deletePayrollPolicy,
);

export default payrollPolicyRouter;