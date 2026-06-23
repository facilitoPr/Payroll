const normalizeUpper = (value: any, fallback = "") => {
  return String(value || fallback)
    .trim()
    .toUpperCase();
};

const normalizeString = (value: any, fallback = "") => {
  return String(value || fallback).trim();
};

const normalizeNumber = (value: any, fallback = 0) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return number;
};

const normalizeBoolean = (value: any, fallback = false) => {
  if (typeof value === "boolean") return value;

  if (value === "true") return true;
  if (value === "false") return false;

  return fallback;
};

export const buildProductPayload = (body: any) => {
  return {
    name: normalizeString(body.name),
    code: normalizeUpper(body.code),
    description: normalizeString(body.description),

    minLoanAmount: normalizeNumber(body.minLoanAmount, 0),
    maxLoanAmount: normalizeNumber(body.maxLoanAmount, 0),

    minInstallments: normalizeNumber(body.minInstallments, 1),
    maxInstallments: normalizeNumber(body.maxInstallments, 12),

    interestRate: normalizeNumber(body.interestRate, 0),
    interestRateType: normalizeUpper(body.interestRateType, "ANNUAL"),
    defaultPaymentFrequency: normalizeUpper(
      body.defaultPaymentFrequency,
      "BIWEEKLY",
    ),

    distributeInterestInInstallments: normalizeBoolean(
      body.distributeInterestInInstallments,
      true,
    ),

    amortizePrincipal: normalizeBoolean(body.amortizePrincipal, true),

    minimumVacationDaysRequired: normalizeNumber(
      body.minimumVacationDaysRequired,
      1,
    ),

    maxVacationDaysGuaranteePercent: normalizeNumber(
      body.maxVacationDaysGuaranteePercent,
      100,
    ),

    vacationDayValueMode: normalizeUpper(
      body.vacationDayValueMode,
      "DAILY_SALARY",
    ),

    customVacationDayAmount: normalizeNumber(body.customVacationDayAmount, 0),
    maxVacationGuaranteeDays: normalizeNumber(body.maxVacationGuaranteeDays, 0),

    allowUseAllVacationDays: normalizeBoolean(
      body.allowUseAllVacationDays,
      false,
    ),

    allowWithoutVacationGuarantee: normalizeBoolean(
      body.allowWithoutVacationGuarantee,
      false,
    ),

    externalProductCode: normalizeUpper(body.externalProductCode),

    interestBankName: normalizeString(body.interestBankName),
    interestBankCode: normalizeString(body.interestBankCode),
    interestAccountNumber: normalizeString(body.interestAccountNumber),
    interestAccountType: normalizeUpper(body.interestAccountType, "SAVINGS"),
    interestCurrency: normalizeUpper(body.interestCurrency, "DOP"),
    interestBeneficiaryName: normalizeString(body.interestBeneficiaryName),
    interestBeneficiaryDocument: normalizeString(
      body.interestBeneficiaryDocument,
    ),
    interestPaymentInstructions: normalizeString(
      body.interestPaymentInstructions,
    ),

    isDefault: normalizeBoolean(body.isDefault, false),
    isActive: normalizeBoolean(body.isActive, true),
    isDeleted: normalizeBoolean(body.isDeleted, false),
  };
};
