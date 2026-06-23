import { Router } from "express";

import roleRouter from "./routes/role.routes";
import userRouter from "./routes/user.routes";
import authRouter from "./routes/auth.routes";
import ComercialRouter from "./routes/comercial.routes";
import zonesRouter from "./routes/zones.routes";
import remindersTypesRouter from "./routes/remindersTypes.routes";
import remindersRouter from "./routes/reminders.routes";
import statusRouter from "./routes/status.routes";

import punchRouter from "./routes/punch.routes";
import permission from "./routes/permission.routes";
import employeePaymentManagement from "./routes/employee-payment-management.routes";
import departmentRouter from "./routes/department.routes";
import problemReportRouter from "./routes/problemReport.routes";
import callsReportRouter from "./routes/callsReports.routes";
import recruitmentRouter from "./routes/recruitment.routes";
import dashboardRouter from "./routes/dashboard.routes";
import aiRouter from "./routes/aiAgent.routes";
import jobPositionRouter from "./routes/jobPosition.routes";
import payrollRouter from "./routes/payroll.routes";
import expedientRouter from "./routes/expedient/expedient.routes";
import notificationsRouter from "./routes/notification.routes";
import disciplinaryActionRouter from "./routes/disciplinaryAction.routes";
import companyProfileRouter from "./routes/companyProfile.routes";
import incentiveProgramRouter from "./routes/incentiveProgram.routes";
import zonesTeamsRouter from "./routes/zonesTeams.routes";
import auditRouter from "./routes/audit.routes";
import lateLettersRouter from "./routes/lateLetters.routes";
import trainingRouter from "./routes/training.routes";
import supportRouter from "./routes/support.routes";
import promotionAdRouter from "./routes/promotionAd.routes";
import userSessionRouter from "./routes/userSession.routes";
import companyRouter from "./routes/company.routes";
import employeeVacationRouter from "./routes/vacation/employeeVacation.routes";
import leavePolicyRouter from "./routes/vacation/leavePolicy.routes";
import employeeLoanRequestRouter from "./routes/employeesLoan/employeeLoanRequest.routes";
import employeeLoanPolicyRouter from "./routes/employeesLoan/employeeLoanPolicy.routes";
import payrollPolicyRouter from "./routes/payrollPolicy.routes";
import employeeLoanProviderConfigRouter from "./routes/employeesLoan/employeeLoanProviderConfig.routes";
import employeeTerminationRouter from "./routes/employee-termination.routes";
import * as integrationClient from "./controllers/employeeLoan/employeeLoanIntegrationClient.controller";

const router: Router = Router();
router.use("/user", userRouter);
router.use("/role", roleRouter);
router.use("/auth", authRouter);
router.use("/comercial", ComercialRouter);

router.use("/zones", zonesRouter);

router.use("/remindersTypes", remindersTypesRouter);
router.use("/reminders", remindersRouter);
router.use("/status", statusRouter);

router.use("/reports", problemReportRouter);
router.use("/callsReport", callsReportRouter);
router.use("/recruitment", recruitmentRouter);
router.use("/dashboard", dashboardRouter);
router.use("/ai", aiRouter);
router.use("/job-position", jobPositionRouter);
router.use("/notifications", notificationsRouter);
router.use("/disciplinary", disciplinaryActionRouter);
router.use("/company-profile", companyProfileRouter);
router.use("/training", trainingRouter);
router.use("/support", supportRouter);

// punch
router.use("/punch", punchRouter);
router.use("/permission", permission)

// DEPARTMENT
router.use("/department", departmentRouter);

// EMPLOYEE PAYMENT MANAGMENT
router.use("/employee-payment-management", employeePaymentManagement);
router.use("/payroll", payrollRouter);
router.use("/expedient", expedientRouter);
router.use("/incentives", incentiveProgramRouter);
router.use("/zonesTeams", zonesTeamsRouter);
router.use("/audit", auditRouter);
router.use("/lateLetters", lateLettersRouter);

// LANDING
router.use("/promotion-ads", promotionAdRouter);
router.use("/user-sessions", userSessionRouter);
router.use("/company", companyRouter);
router.use("/leave-policy", leavePolicyRouter);
router.use("/employee-vacation", employeeVacationRouter);

router.get(
  "/employee-loan/integrations/bootstrap",
  integrationClient.getEmployeeLoanIntegrationBootstrap,
);
router.use("/employee-loan", employeeLoanRequestRouter);
router.use("/employee-loan/policies", employeeLoanPolicyRouter);
router.use("/employee-loan", employeeLoanProviderConfigRouter);
router.use("/payroll-policy", payrollPolicyRouter);
router.use("/employee-termination", employeeTerminationRouter);

export default router;