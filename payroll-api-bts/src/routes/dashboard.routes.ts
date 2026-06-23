import { Router } from "express";

import * as dashboard from "../controllers/dashboard.controller";
import { validateJWT } from "../middlewares/validate-jwt";

const dashboardRouter = Router();

dashboardRouter.use(validateJWT);

dashboardRouter.get("/", validateJWT, dashboard.getHrDashboardSummary);

dashboardRouter.get("/getActiveEmployees", dashboard.getActiveEmployees);
dashboardRouter.get("/getApplicationsToday", dashboard.getApplicationsToday);
dashboardRouter.get("/getInterviewsToday", dashboard.getInterviewsToday);
dashboardRouter.get("/getLateEmployees", dashboard.getLateEmployees);
dashboardRouter.get("/getAbsentEmployees", dashboard.getAbsentEmployees);
dashboardRouter.get("/getErrorsReports", dashboard.getErrorsReports);
dashboardRouter.get("/getPendingPermissions", dashboard.getPendingPermissions);

export default dashboardRouter;
