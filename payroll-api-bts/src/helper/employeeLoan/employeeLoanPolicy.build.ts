import { Types } from "mongoose";
import { toNum } from "../parse";
import { EMPLOYEE_LOAN_POLICY_CODE } from "../../constants/loan";

export const buildPolicyPayload = (body: any) => {
  return {
    company:
      body.company && Types.ObjectId.isValid(String(body.company))
        ? new Types.ObjectId(String(body.company))
        : null,

    name: String(body.name || "").trim(),

    code: String(body.code || "")
      .trim()
      .toUpperCase(),

    allowEmployeeLoanRequests:
      body.allowEmployeeLoanRequests === undefined
        ? true
        : body.allowEmployeeLoanRequests === true,

    minLoanAmount: toNum(body.minLoanAmount, 0),
    maxLoanAmount: toNum(body.maxLoanAmount, 0),
    maxMonthlyPaymentPercent: toNum(body.maxMonthlyPaymentPercent, 0),

    minimumVacationDaysRequired: toNum(body.minimumVacationDaysRequired, 0),

    maxVacationDaysGuaranteePercent: toNum(
      body.maxVacationDaysGuaranteePercent,
      0,
    ),

    vacationDayValueMode: String(body.vacationDayValueMode || "DAILY_SALARY")
      .trim()
      .toUpperCase(),

    customVacationDayAmount: toNum(body.customVacationDayAmount, 0),

    allowUseAllVacationDays: body.allowUseAllVacationDays === true,

    allowWithoutVacationGuarantee: body.allowWithoutVacationGuarantee === true,

    externalProductCode: String(body.externalProductCode || "")
      .trim()
      .toUpperCase(),

    isActive: body.isActive === undefined ? true : body.isActive === true,

    isDeleted: false,
  };
};

export const buildDefaultEmployeeLoanPolicyPayload = (
  companyId: Types.ObjectId,
) => {
  return {
    company: companyId,
    name: "Política de préstamos para empleados",
    code: EMPLOYEE_LOAN_POLICY_CODE,
    allowEmployeeLoanRequests: true,
    isActive: true,
    isDeleted: false,
  };
};