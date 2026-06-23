import * as salary from "../controllers/employee-payment-management/salary.controller";
import * as paymentFrecuency from "../controllers/employee-payment-management/paymentFrecuency.controller";
import * as paymentSchedule from "../controllers/employee-payment-management/paymentSchedule.controller";
import * as deduction from "../controllers/employee-payment-management/deductionType.controller";
import * as payroll from "../controllers/employee-payment-management/payroll.controller";
import * as ISR from "../controllers/employee-payment-management/incomeTaxRD.controller";

const { check } = require("express-validator");

import express = require("express");

import * as token from "../middlewares/validate-jwt";
const employeePaymentManagement: express.Router = express.Router();
employeePaymentManagement.use(token.validateJWT);

// salary
employeePaymentManagement.post(
  "/createSalaryType",
  //   [token.validateJWT],
  salary.createSalaryType,
);

employeePaymentManagement.get(
  "/getSalalaryType",
  // [token.validateJWT],
  salary.getSalalaryType,
);

// frecuencias de pagos
employeePaymentManagement.post(
  "/createPaymentFrecuency",
  //   [token.validateJWT],
  paymentFrecuency.createPaymentFrecuency,
);

employeePaymentManagement.get(
  "/getEmployeesWithPayToday",
  //   [token.validateJWT],
  paymentFrecuency.getEmployeesWithPayToday,
);

employeePaymentManagement.get(
  "/getAllPaymentFrecuency",
  // [token.validateJWT],
  paymentFrecuency.getAllPaymentFrecuency,
);

//horarios de pagos
employeePaymentManagement.post(
  "/createPaymentSchedule",
  //   [token.validateJWT],
  paymentSchedule.createPaymentSchedule,
);

employeePaymentManagement.get(
  "/getAllPaymentSchedules",
  //   [token.validateJWT],
  paymentSchedule.getAllPaymentSchedules,
);

employeePaymentManagement.put(
  "/updatePaymentSchedule/:id",
  [token.validateJWT],
  paymentSchedule.updatePaymentSchedule,
);

// deduction

employeePaymentManagement.post(
  "/createDeductionType",
  [token.validateJWT],
  deduction.createDeductionType,
);

employeePaymentManagement.get(
  "/getDeductionType",
  [token.validateJWT],
  deduction.getDeductionType,
);

employeePaymentManagement.get(
  "/getDeductionTypeAdmin",
  [token.validateJWT],
  deduction.getDeductionTypeAdmin,
);

employeePaymentManagement.put(
  "/updateDeductionType/:id",
  [token.validateJWT],
  deduction.updateDeductionType,
);

employeePaymentManagement.get(
  "/getUserDeductionByUser/:id",
  [token.validateJWT],
  deduction.getUserDeductionByUser,
);

employeePaymentManagement.post(
  "/upsertEmployeeDeduction",
  [token.validateJWT],
  deduction.upsertEmployeeDeduction,
);

employeePaymentManagement.post(
  "/registerEmployeePayment",
  // [token.validateJWT],
  deduction.registerEmployeePayment,
);

employeePaymentManagement.post(
  "/registerEmployeePayment",
  // [token.validateJWT],
  deduction.registerEmployeePayment,
);

employeePaymentManagement.get(
  "/getEmployeePaymentSummary/:employeeId",
  // [token.validateJWT],
  deduction.getEmployeePaymentSummary,
);

// todo fintro de todos los empleados individuales
// todo ex empleado

employeePaymentManagement.get(
  "/getEmployeePayment/",
  // [token.validateJWT],
  deduction.getEmployeePayment,
);

// upsertEmployeeDeduction

employeePaymentManagement.get(
  "/suggestedPeriodBySchedule",
  payroll.suggestedPeriodBySchedule,
);

// ISR

employeePaymentManagement.post("/createIncomeTaxRD", ISR.createIncomeTaxRD);
employeePaymentManagement.get("/getIncomeTaxRD", ISR.getIncomeTaxRD);
employeePaymentManagement.get(
  "/getActiveIncomeTaxByYear/:year",
  ISR.getActiveIncomeTaxByYear,
);
employeePaymentManagement.put("/updateIncomeTaxRD/:id", ISR.updateIncomeTaxRD);
employeePaymentManagement.delete(
  "/deleteIncomeTaxRD/:id",
  ISR.deleteIncomeTaxRD,
);

export default employeePaymentManagement;
