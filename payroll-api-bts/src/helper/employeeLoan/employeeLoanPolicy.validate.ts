export const validatePolicyPayload = (payload: any) => {
  if (!payload.name) {
    return "El nombre de la política es obligatorio.";
  }

  if (!payload.code) {
    return "El código de la política es obligatorio.";
  }

  if (payload.minLoanAmount < 0) {
    return "El monto mínimo no puede ser negativo.";
  }

  if (payload.maxLoanAmount < 0) {
    return "El monto máximo no puede ser negativo.";
  }

  if (
    payload.maxLoanAmount > 0 &&
    payload.minLoanAmount > payload.maxLoanAmount
  ) {
    return "El monto mínimo no puede ser mayor que el monto máximo.";
  }

  if (
    payload.maxMonthlyPaymentPercent < 0 ||
    payload.maxMonthlyPaymentPercent > 100
  ) {
    return "El porcentaje máximo de pago mensual debe estar entre 0 y 100.";
  }

  if (payload.minimumVacationDaysRequired < 0) {
    return "Los días mínimos de vacaciones no pueden ser negativos.";
  }

  if (
    payload.maxVacationDaysGuaranteePercent < 0 ||
    payload.maxVacationDaysGuaranteePercent > 100
  ) {
    return "El porcentaje máximo de garantía debe estar entre 0 y 100.";
  }

  if (
    !["DAILY_SALARY", "CUSTOM_AMOUNT", "NONE"].includes(
      payload.vacationDayValueMode,
    )
  ) {
    return "El modo de valoración de vacaciones no es válido.";
  }

  if (
    payload.vacationDayValueMode === "CUSTOM_AMOUNT" &&
    payload.customVacationDayAmount <= 0
  ) {
    return "Debes indicar un valor fijo por día de vacaciones.";
  }

  return "";
};
