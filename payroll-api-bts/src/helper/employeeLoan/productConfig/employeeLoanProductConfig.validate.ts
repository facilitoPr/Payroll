import { EMPLOYEE_LOAN_ACCOUNT_TYPES, EMPLOYEE_LOAN_INTEREST_RATE_TYPE, EMPLOYEE_LOAN_PAYMENT_FREQUENCY, EMPLOYEE_LOAN_VACATION_DAY_VALUE_MODE } from "../../../model/employeeLoan/employeeLoanProductConfig";

export const validateProductPayload = (payload: any): string | null => {
  if (!String(payload.name || "").trim()) {
    return "El nombre es obligatorio.";
  }

  if (!String(payload.code || "").trim()) {
    return "El código es obligatorio.";
  }

  if (Number(payload.minLoanAmount || 0) < 0) {
    return "El monto mínimo no puede ser negativo.";
  }

  if (Number(payload.maxLoanAmount || 0) <= 0) {
    return "El monto máximo debe ser mayor a 0.";
  }

  if (Number(payload.minLoanAmount || 0) > Number(payload.maxLoanAmount || 0)) {
    return "El monto mínimo no puede ser mayor al monto máximo.";
  }

  if (Number(payload.minInstallments || 0) < 1) {
    return "La cantidad mínima de cuotas debe ser mayor o igual a 1.";
  }

  if (
    Number(payload.maxInstallments || 0) < Number(payload.minInstallments || 0)
  ) {
    return "La cantidad máxima de cuotas no puede ser menor que la mínima.";
  }

  if (Number(payload.interestRate || 0) < 0) {
    return "La tasa de interés no puede ser negativa.";
  }

  if (!EMPLOYEE_LOAN_INTEREST_RATE_TYPE.includes(payload.interestRateType)) {
    return "El tipo de tasa no es válido.";
  }

  if (
    !EMPLOYEE_LOAN_PAYMENT_FREQUENCY.includes(payload.defaultPaymentFrequency)
  ) {
    return "La frecuencia de pago no es válida.";
  }

  if (Number(payload.minimumVacationDaysRequired || 0) < 0) {
    return "Los días mínimos de vacaciones no pueden ser negativos.";
  }

  if (
    Number(payload.maxVacationDaysGuaranteePercent || 0) < 0 ||
    Number(payload.maxVacationDaysGuaranteePercent || 0) > 100
  ) {
    return "El porcentaje máximo de garantía debe estar entre 0 y 100.";
  }

  if (
    !EMPLOYEE_LOAN_VACATION_DAY_VALUE_MODE.includes(
      payload.vacationDayValueMode,
    )
  ) {
    return "El modo de valoración de vacaciones no es válido.";
  }

  if (
    payload.vacationDayValueMode === "CUSTOM_AMOUNT" &&
    Number(payload.customVacationDayAmount || 0) <= 0
  ) {
    return "Debes indicar un valor fijo por día mayor a 0.";
  }

  if (!String(payload.interestBankName || "").trim()) {
    return "El banco es obligatorio.";
  }

  if (!String(payload.interestAccountNumber || "").trim()) {
    return "El número de cuenta es obligatorio.";
  }

  if (!EMPLOYEE_LOAN_ACCOUNT_TYPES.includes(payload.interestAccountType)) {
    return "El tipo de cuenta no es válido.";
  }

  if (!String(payload.interestCurrency || "").trim()) {
    return "La moneda es obligatoria.";
  }

  if (!String(payload.interestBeneficiaryName || "").trim()) {
    return "El beneficiario es obligatorio.";
  }

  return null;
};
