import { Router } from "express";
import * as earnings from "../controllers/employee-payment-management/payrollEarnings.controller";
import { validateJWT } from "../middlewares/validate-jwt";

const payrollRouter = Router();
payrollRouter.use(validateJWT);

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
