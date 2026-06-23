import { Router } from "express";
import * as audit from "../controllers/audit.controller";
import { validateJWT } from "../middlewares/validate-jwt";

const auditRouter = Router();

auditRouter.use(validateJWT);

auditRouter.get("/getUserAuditLogs/:userId", audit.getUserAuditLogs);

export default auditRouter;
