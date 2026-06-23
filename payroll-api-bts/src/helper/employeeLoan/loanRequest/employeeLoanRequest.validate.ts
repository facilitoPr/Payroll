import { validateLoanRequestAgainstProductConfig } from "../productConfig/employeeLoanProductConfig.validation";

export const validateProductRequestOrThrow = ({
  productConfig,
  requestedAmount,
  requestedInstallments,
}: {
  productConfig: any;
  requestedAmount: number;
  requestedInstallments: number;
}) => {
  const productValidation = validateLoanRequestAgainstProductConfig({
    productConfig,
    requestedAmount,
    requestedInstallments,
  });

  if (!productValidation.ok) {
    throw {
      statusCode: productValidation.statusCode,
      mensaje: productValidation.mensaje,
    };
  }
};

export const requiresVacationGuarantee = (productConfig: any) => {
  const mode = String(productConfig?.vacationDayValueMode || "DAILY_SALARY")
    .trim()
    .toUpperCase();

  return (
    productConfig?.allowWithoutVacationGuarantee !== true && mode !== "NONE"
  );
};