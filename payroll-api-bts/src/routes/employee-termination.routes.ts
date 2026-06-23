import { Router } from "express";
import * as laborTerminationPolicyRD from "../controllers/employee-termination/laborTerminationPolicyRD.controller";
import * as employeeTermination from "../controllers/employee-termination/employeeTermination.controller";

const employeeTerminationRouter = Router();

/**
 * Políticas.
 */
employeeTerminationRouter.get(
  "/policies",
  laborTerminationPolicyRD.getLaborTerminationPolicies,
);

employeeTerminationRouter.get(
  "/policies/active",
  laborTerminationPolicyRD.getActiveLaborTerminationPolicy,
);

employeeTerminationRouter.post(
  "/policies",
  laborTerminationPolicyRD.createLaborTerminationPolicy,
);

employeeTerminationRouter.post(
  "/policies/default",
  laborTerminationPolicyRD.createDefaultLaborTerminationPolicy,
);

employeeTerminationRouter.put(
  "/policies/:id",
  laborTerminationPolicyRD.updateLaborTerminationPolicy,
);

employeeTerminationRouter.delete(
  "/policies/:id",
  laborTerminationPolicyRD.deleteLaborTerminationPolicy,
);

/**
 * Préstamos relacionados con desvinculación.
 */
employeeTerminationRouter.get(
  "/employees/:employeeId/loan-summary",
  employeeTermination.getTerminationLoanSummary,
);

/**
 * Catálogos.
 *
 * Debe estar antes de /terminations/:id.
 */
employeeTerminationRouter.get(
  "/terminations/catalogs",
  employeeTermination.getTerminationCatalogs,
);

/**
 * Desvinculaciones.
 */
employeeTerminationRouter.post(
  "/terminations/preview",
  employeeTermination.previewTermination,
);

employeeTerminationRouter.post(
  "/terminations",
  employeeTermination.createTermination,
);

employeeTerminationRouter.get(
  "/terminations",
  employeeTermination.listTerminations,
);

employeeTerminationRouter.get(
  "/terminations/:id",
  employeeTermination.getTerminationById,
);

employeeTerminationRouter.put(
  "/terminations/:id/recalculate",
  employeeTermination.recalculateTermination,
);

employeeTerminationRouter.put(
  "/terminations/:id/manual-lines",
  employeeTermination.replaceManualLines,
);

employeeTerminationRouter.put(
  "/terminations/:id/submit-approval",
  employeeTermination.submitForApproval,
);

employeeTerminationRouter.put(
  "/terminations/:id/approve",
  employeeTermination.approveTermination,
);

employeeTerminationRouter.put(
  "/terminations/:id/pay",
  employeeTermination.payTermination,
);

employeeTerminationRouter.post(
  "/terminations/:id/bank-file",
  employeeTermination.generateTerminationBankFile,
);

employeeTerminationRouter.put(
  "/terminations/:id/cancel",
  employeeTermination.cancelTermination,
);

employeeTerminationRouter.delete(
  "/terminations/:id",
  employeeTermination.deleteTermination,
);

export default employeeTerminationRouter;
