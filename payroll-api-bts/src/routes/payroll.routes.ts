import { Router } from "express";
import { check } from "express-validator";
import { validateJWT } from "../middlewares/validate-jwt";
import { validarFields } from "../middlewares/validate-fields";

import * as payroll from "../controllers/employee-payment-management/payroll.controller";
import * as earnings from "../controllers/employee-payment-management/payrollEarnings.controller";

const payrollRouter: any = Router();
payrollRouter.use(validateJWT);

// cerrar periodo
payrollRouter.post(
  "/closePeriod",
  //   [
  //     check("userIds", "userIds debe ser un array con empleados").isArray({
  //       min: 1,
  //     }),
  //     check("fechaInicio", "fechaInicio es obligatorio").not().isEmpty(),
  //     // fechaFin opcional
  //     // projectId opcional
  //     // requireConfirmedDays opcional
  //     // payDate opcional
  //     validarFields,
  //   ],
  payroll.closePeriod,
);

payrollRouter.post("/closePeriodPreview", payroll.closePeriodPreview);
payrollRouter.post(
  "/closePeriodPreviewEmployees",
  payroll.closePeriodPreviewEmployees,
);
payrollRouter.post("/generateBankFileByRun", payroll.generateBankFileByRun);
payrollRouter.put(
  "/setRunBankAuthorization/:id",
  payroll.setRunBankAuthorization,
);

// ver corrida
payrollRouter.get("/run/:runId", payroll.getRunById);

// setRunBankAuthorization;
payrollRouter.get("/runs", payroll.getPayrollRuns);
payrollRouter.post("/run/:id/admin-update", payroll.updatePayrollRunAdmin);
payrollRouter.post("/run/:id/soft-delete", payroll.softDeletePayrollRun);
payrollRouter.get(
  "/run/:runId/payments-overview",
  payroll.getPayrollRunPaymentsOverview,
);
payrollRouter.get("/run/:runId/payments-page", payroll.getPayrollRunPaymentsPage);

// listar pagos por corrida
payrollRouter.get("/run/:runId/payments", payroll.listPaymentsByRun);

// ver pago individual
payrollRouter.get("/payment/:paymentId", payroll.getPaymentById);
payrollRouter.get("/getMyPayments", payroll.listMyPayrollPayments);

// reintentar emails fallidos
payrollRouter.post(
  "/run/:runId/resendFailedEmails",
  payroll.resendFailedEmails,
);

//

// upsert masivo de ingresos por periodo
payrollRouter.post("/upsert", earnings.upsertEarningsForPeriod);

// listar ingresos por periodo (opcional por userId)
payrollRouter.get("/list", earnings.listEarningsForPeriod);

payrollRouter.get("/earning-types", earnings.listEarningTypes);

// Entries por periodo
payrollRouter.get("/earnings", earnings.getEarningsByPeriod);
payrollRouter.post("/earnings/upsert-batch", earnings.upsertEarningsBatch);
payrollRouter.delete("/earnings/:id", earnings.softDeleteEarningEntry);

export default payrollRouter;
