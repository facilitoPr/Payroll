import {
  EMPLOYEE_LOAN_INTEREST_RATE_TYPE,
  EMPLOYEE_LOAN_PAYMENT_FREQUENCY,
  EMPLOYEE_LOAN_ACCOUNT_TYPES,
} from "../../../model/employeeLoan/employeeLoanProductConfig";


export type LoanProductValidationResult = {
  ok: boolean;
  statusCode: number;
  mensaje: string;
};

const isEmpty = (value: any) => {
  return !String(value || "").trim();
};

const isValidNumber = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n);
};

export const validateEmployeeLoanProductConfig = (
  productConfig: any,
): LoanProductValidationResult => {
  if (!productConfig) {
    return {
      ok: false,
      statusCode: 404,
      mensaje: "No hay una configuración principal activa para préstamos.",
    };
  }

  if (productConfig.isActive !== true || productConfig.isDeleted === true) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "La configuración principal de préstamos no está activa.",
    };
  }

  if (isEmpty(productConfig.name)) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "La configuración de préstamo no tiene nombre.",
    };
  }

  if (isEmpty(productConfig.code)) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "La configuración de préstamo no tiene código.",
    };
  }

  if (!isValidNumber(productConfig.minLoanAmount)) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "El monto mínimo de préstamo no es válido.",
    };
  }

  if (!isValidNumber(productConfig.maxLoanAmount)) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "El monto máximo de préstamo no es válido.",
    };
  }

  if (Number(productConfig.minLoanAmount || 0) < 0) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "El monto mínimo de préstamo no puede ser negativo.",
    };
  }

  if (Number(productConfig.maxLoanAmount || 0) <= 0) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "El monto máximo de préstamo debe ser mayor a 0.",
    };
  }

  if (
    Number(productConfig.maxLoanAmount || 0) <
    Number(productConfig.minLoanAmount || 0)
  ) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "El monto máximo no puede ser menor que el monto mínimo.",
    };
  }

  if (!isValidNumber(productConfig.minInstallments)) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "La cantidad mínima de cuotas no es válida.",
    };
  }

  if (!isValidNumber(productConfig.maxInstallments)) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "La cantidad máxima de cuotas no es válida.",
    };
  }

  if (Number(productConfig.minInstallments || 0) < 1) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "La cantidad mínima de cuotas debe ser mayor o igual a 1.",
    };
  }

  if (
    Number(productConfig.maxInstallments || 0) <
    Number(productConfig.minInstallments || 0)
  ) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "La cantidad máxima de cuotas no puede ser menor que la mínima.",
    };
  }

  if (!isValidNumber(productConfig.interestRate)) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "La tasa de interés no es válida.",
    };
  }

  if (Number(productConfig.interestRate || 0) < 0) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "La tasa de interés no puede ser negativa.",
    };
  }

  if (
    !EMPLOYEE_LOAN_INTEREST_RATE_TYPE.includes(
      String(productConfig.interestRateType || "").toUpperCase() as any,
    )
  ) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "El tipo de tasa de interés no es válido.",
    };
  }

  if (
    !EMPLOYEE_LOAN_PAYMENT_FREQUENCY.includes(
      String(productConfig.defaultPaymentFrequency || "").toUpperCase() as any,
    )
  ) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "La frecuencia base de pago no es válida.",
    };
  }

  if (isEmpty(productConfig.interestBankName)) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "El banco para depositar intereses es requerido.",
    };
  }

  if (isEmpty(productConfig.interestAccountNumber)) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "El número de cuenta para intereses es requerido.",
    };
  }

  if (
    !EMPLOYEE_LOAN_ACCOUNT_TYPES.includes(
      String(productConfig.interestAccountType || "").toUpperCase() as any,
    )
  ) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "El tipo de cuenta bancaria no es válido.",
    };
  }

  if (isEmpty(productConfig.interestCurrency)) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "La moneda de la cuenta bancaria es requerida.",
    };
  }

  if (isEmpty(productConfig.interestBeneficiaryName)) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "El beneficiario de la cuenta bancaria es requerido.",
    };
  }

  return {
    ok: true,
    statusCode: 200,
    mensaje: "Configuración válida.",
  };
};

export const validateLoanRequestAgainstProductConfig = ({
  productConfig,
  requestedAmount,
  requestedInstallments,
}: {
  productConfig: any;
  requestedAmount: number;
  requestedInstallments: number;
}): LoanProductValidationResult => {
  const configValidation = validateEmployeeLoanProductConfig(productConfig);

  if (!configValidation.ok) return configValidation;

  if (Number(requestedAmount || 0) <= 0) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: "El monto solicitado debe ser mayor a 0.",
    };
  }

  if (requestedAmount < Number(productConfig.minLoanAmount || 0)) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: `El monto mínimo permitido es ${Number(
        productConfig.minLoanAmount || 0,
      )}.`,
    };
  }

  if (
    Number(productConfig.maxLoanAmount || 0) > 0 &&
    requestedAmount > Number(productConfig.maxLoanAmount || 0)
  ) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: `El monto máximo permitido es ${Number(
        productConfig.maxLoanAmount || 0,
      )}.`,
    };
  }

  if (
    Number(requestedInstallments || 0) <
    Number(productConfig.minInstallments || 1)
  ) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: `La cantidad mínima de cuotas es ${Number(
        productConfig.minInstallments || 1,
      )}.`,
    };
  }

  if (
    Number(requestedInstallments || 0) >
    Number(productConfig.maxInstallments || 1)
  ) {
    return {
      ok: false,
      statusCode: 400,
      mensaje: `La cantidad máxima de cuotas es ${Number(
        productConfig.maxInstallments || 1,
      )}.`,
    };
  }

  return {
    ok: true,
    statusCode: 200,
    mensaje: "Solicitud válida.",
  };
};

export const buildPublicLoanProductConfigResponse = (productConfig: any) => {
  return {
    productConfigId: String(productConfig._id || ""),
    productCode: productConfig.code || "",
    productName: productConfig.name || "",
    description: productConfig.description || "",

    minLoanAmount: Number(productConfig.minLoanAmount || 0),
    maxLoanAmount: Number(productConfig.maxLoanAmount || 0),

    minInstallments: Number(productConfig.minInstallments || 1),
    maxInstallments: Number(productConfig.maxInstallments || 1),

    interestRate: Number(productConfig.interestRate || 0),
    interestRateType: String(
      productConfig.interestRateType || "ANNUAL",
    ).toUpperCase(),

    defaultPaymentFrequency: String(
      productConfig.defaultPaymentFrequency || "BIWEEKLY",
    ).toUpperCase(),

    distributeInterestInInstallments: Boolean(
      productConfig.distributeInterestInInstallments,
    ),

    amortizePrincipal: Boolean(productConfig.amortizePrincipal),

    interestBankAccount: {
      bankName: productConfig.interestBankName || "",
      bankCode: productConfig.interestBankCode || "",
      accountNumber: productConfig.interestAccountNumber || "",
      accountType: productConfig.interestAccountType || "",
      currency: productConfig.interestCurrency || "DOP",
      beneficiaryName: productConfig.interestBeneficiaryName || "",
      beneficiaryDocument: productConfig.interestBeneficiaryDocument || "",
      paymentInstructions: productConfig.interestPaymentInstructions || "",
    },
  };
};
