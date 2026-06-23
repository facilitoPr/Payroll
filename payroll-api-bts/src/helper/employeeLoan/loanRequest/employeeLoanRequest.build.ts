import mongoose from "mongoose";
import moment from "moment-timezone";
import { PRODUCT_CONFIG_SOURCE } from "../../../constants/loan";
import {
  DEFAULT_CURRENCY,
  RD_FACTOR_DIAS_MES,
} from "../../../constants/payroll";
import { AuthRequest } from "../../../middlewares/validate-jwt";
import { IUser } from "../../../model/account/user";
import EmployeeChristmasSalaryBalance from "../../../model/employee-payment-management/employeeChristmasSalaryBalance";
import {
  EmployeeLoanGuaranteeSource,
  resolveEmployeeLoanGuaranteeSource,
} from "../../../model/employeeLoan/employeeLoanProductConfig";
import { toObjectId, toObjectIdOrNull } from "../../objectIds";
import { round2 } from "../../parse";
import { calculatePeriodSalaryFromMonthly } from "../../payroll/payroll.calculate";
import { getPaymentFrequencyCode } from "../../payroll/payroll.get";
import { getClientIp } from "../../token/client-ip";
import { buildPublicLoanProductConfigResponse } from "../productConfig/employeeLoanProductConfig.validation";
import {
  calculateMaxGuaranteeDays,
  calculateVacationGuaranteeAmount,
} from "./employeeLoanRequest.calculate";
import {
  getAvailableDaysForLoan,
  getNextPaymentDate,
  getPeriodicRate,
} from "./employeeLoanRequest.get";
import {
  ensureEmployeeVacationBalance,
  findActiveVacationBalanceForLoan,
  getEmployeeCompanyId,
} from "../../../services/vacation/employeeVacationBalance.service";
import {
  requiresVacationGuarantee,
  validateProductRequestOrThrow,
} from "./employeeLoanRequest.validate";
import { getCurrentYear } from "../../date";
import {
  getActiveEmployeeLoanProductConfigOrThrow,
  getEmployeeLoanPolicyOrThrow,
} from "../../../services/employeeLoan/employeeLoanRequest.service";
import { buildEmployeeLoanContractPreviewSnapshot } from "./employeeLoanContractDocument";
import {
  buildEmployeeLoanPaymentSchedule,
  getEmployeeLoanPaymentScheduleInfo,
} from "./employeeLoanPaymentSchedule";

export const buildAmortizationSchedule = ({
  principal,
  installments,
  interestRate,
  interestRateType,
  paymentsPerYear,
  firstPaymentDate = new Date(),
  dueDates = [],
}: {
  principal: number;
  installments: number;
  interestRate: number;
  interestRateType: string;
  paymentsPerYear: number;
  firstPaymentDate?: Date;
  dueDates?: Date[];
}) => {
  const cleanPrincipal = round2(principal);
  const cleanInstallments = Math.max(Number(installments || 0), 1);
  const type = String(interestRateType || "ANNUAL").toUpperCase();

  if (cleanPrincipal <= 0) {
    throw {
      statusCode: 400,
      mensaje: "El monto del préstamo debe ser mayor a 0.",
      message: "Principal must be greater than 0.",
    };
  }

  let amortizationSchedule: any[] = [];

  if (type === "FIXED") {
    const totalInterest = round2(
      cleanPrincipal * (Number(interestRate || 0) / 100),
    );
    const totalToPay = round2(cleanPrincipal + totalInterest);
    const installmentAmount = round2(totalToPay / cleanInstallments);

    let remainingPrincipal = cleanPrincipal;

    for (let i = 1; i <= cleanInstallments; i += 1) {
      const openingBalance = round2(remainingPrincipal);
      const interestAmount = round2(totalInterest / cleanInstallments);

      let principalAmount = round2(installmentAmount - interestAmount);
      let paymentAmount = installmentAmount;

      if (i === cleanInstallments) {
        principalAmount = openingBalance;
        paymentAmount = round2(principalAmount + interestAmount);
      }

      remainingPrincipal = round2(openingBalance - principalAmount);

      amortizationSchedule.push({
        installmentNumber: i,
        dueDate:
          dueDates[i - 1] ||
          getNextPaymentDate({
            firstPaymentDate,
            installmentNumber: i,
            paymentsPerYear,
          }),
        openingBalance,
        paymentAmount,
        principalAmount,
        interestAmount,
        closingBalance: remainingPrincipal,
        status: "PENDING",
      });
    }

    return {
      principal: cleanPrincipal,
      installments: cleanInstallments,
      periodicRate: 0,
      installmentAmount,
      totalInterest,
      totalToPay,
      paymentsPerYear,
      firstPaymentDate,
      amortizationSchedule,
    };
  }

  const periodicRate = getPeriodicRate({
    interestRate,
    interestRateType,
    paymentsPerYear,
  });

  let installmentAmount = 0;

  if (periodicRate === 0) {
    installmentAmount = cleanPrincipal / cleanInstallments;
  } else {
    installmentAmount =
      (cleanPrincipal * periodicRate) /
      (1 - Math.pow(1 + periodicRate, -cleanInstallments));
  }

  installmentAmount = round2(installmentAmount);

  let balance = cleanPrincipal;

  for (let i = 1; i <= cleanInstallments; i += 1) {
    const openingBalance = round2(balance);
    const interestAmount = round2(openingBalance * periodicRate);

    let principalAmount = round2(installmentAmount - interestAmount);
    let paymentAmount = installmentAmount;

    if (i === cleanInstallments) {
      principalAmount = openingBalance;
      paymentAmount = round2(principalAmount + interestAmount);
    }

    balance = round2(openingBalance - principalAmount);

    amortizationSchedule.push({
      installmentNumber: i,
      dueDate: getNextPaymentDate({
        firstPaymentDate,
        installmentNumber: i,
        paymentsPerYear,
      }),
      openingBalance,
      paymentAmount,
      principalAmount,
      interestAmount,
      closingBalance: balance,
      status: "PENDING",
    });
  }

  const totalToPay = round2(
    amortizationSchedule.reduce(
      (sum, row) => sum + Number(row.paymentAmount || 0),
      0,
    ),
  );

  const totalInterest = round2(totalToPay - cleanPrincipal);

  return {
    principal: cleanPrincipal,
    installments: cleanInstallments,
    periodicRate,
    installmentAmount,
    totalInterest,
    totalToPay,
    paymentsPerYear,
    firstPaymentDate,
    amortizationSchedule,
  };
};

export const buildLoanProviderSnapshot = (productConfig: any) => {
  return {
    providerType: "LOCAL",
    productConfig: productConfig._id,
    productCode: productConfig.code,
    productName: productConfig.name,

    interestRate: Number(productConfig.interestRate || 0),
    interestRateType: String(
      productConfig.interestRateType || "ANNUAL",
    ).toUpperCase(),
    defaultPaymentFrequency: String(
      productConfig.defaultPaymentFrequency || "BIWEEKLY",
    ).toUpperCase(),

    interestBankAccount: {
      bankName: productConfig.interestBankName || "",
      bankCode: productConfig.interestBankCode || "",
      accountNumber: productConfig.interestAccountNumber || "",
      accountType: productConfig.interestAccountType || "",
      currency: productConfig.interestCurrency || DEFAULT_CURRENCY,
      beneficiaryName: productConfig.interestBeneficiaryName || "",
      beneficiaryDocument: productConfig.interestBeneficiaryDocument || "",
      paymentInstructions: productConfig.interestPaymentInstructions || "",
    },

    calculatedAt: new Date(),
  };
};

export const buildLoanProviderSnapshotWithSource = (productConfig: any) => {
  const baseSnapshot = buildLoanProviderSnapshot(productConfig);

  return {
    ...baseSnapshot,
    productConfigSource: productConfig?._source || PRODUCT_CONFIG_SOURCE,
    productConfigId: productConfig?._id ? String(productConfig._id) : "",
    productConfigCode:
      productConfig?.code || productConfig?.externalProductCode || "",
  };
};

export const buildSalarySnapshot = (employee: IUser) => {
  const monthlySalary = round2(employee?.baseSalary || 0);
  const frequencyCode = getPaymentFrequencyCode(employee);

  const periodSalary = round2(
    calculatePeriodSalaryFromMonthly({
      monthlySalary,
      frequencyCode,
    }),
  );

  const dailySalary = round2(monthlySalary / RD_FACTOR_DIAS_MES);

  const salaryType = employee?.salaryType;
  const salaryTypeName =
    salaryType && typeof salaryType === "object" && "name" in salaryType
      ? salaryType.name || salaryType.code || ""
      : "";

  const paymentSchedule: any = employee?.paymentSchedule;
  const paymentFrequencySource = paymentSchedule?.paymentFrequency;
  const paymentScheduleInfo = getEmployeeLoanPaymentScheduleInfo(
    employee,
    frequencyCode,
  );

  return {
    salaryType: toObjectIdOrNull(String(employee?.salaryType)),
    salaryTypeName,

    rawSalary: monthlySalary,
    monthlySalary,
    periodSalary,
    dailySalary,

    paymentFrequency: toObjectIdOrNull(paymentFrequencySource),
    paymentFrequencyName:
      paymentScheduleInfo.frequencyCode ||
      paymentFrequencySource?.code ||
      paymentFrequencySource?.name ||
      frequencyCode ||
      "",

    paymentScheduleSupported: paymentScheduleInfo.supported,
    paymentFrequencyLabel: paymentScheduleInfo.frequencyLabel,
    paymentDays: paymentScheduleInfo.paymentDays,
    monthlyPaymentDay: paymentScheduleInfo.monthlyPaymentDay,
    paymentScheduleMessage: paymentScheduleInfo.message,

    currency: DEFAULT_CURRENCY,
  };
};

export const calculateEffectiveMaxGuaranteeDays = ({
  availableDays,
  dailySalary,
  productConfig,
}: {
  availableDays: number;
  dailySalary: number;
  productConfig: any;
}) => {
  const cleanAvailableDays = Math.max(
    0,
    Math.floor(Number(availableDays || 0)),
  );

  const maxDaysByPercent = Math.max(
    0,
    Math.floor(
      calculateMaxGuaranteeDays({
        availableDays: cleanAvailableDays,
        productConfig,
      }),
    ),
  );

  const configuredMaxDays = Math.max(
    0,
    Math.floor(Number(productConfig?.maxVacationGuaranteeDays || 0)),
  );

  let effectiveMaxDays = Math.min(cleanAvailableDays, maxDaysByPercent);

  if (configuredMaxDays > 0) {
    effectiveMaxDays = Math.min(effectiveMaxDays, configuredMaxDays);
  }

  const valuePerDay = calculateVacationGuaranteeAmount({
    guaranteedDays: 1,
    dailySalary,
    productConfig,
  });

  const productMaxAmount = Number(productConfig?.maxLoanAmount || 0);

  if (valuePerDay <= 0) {
    return 0;
  }

  if (productMaxAmount > 0) {
    const maxDaysByProductAmount = Math.max(
      0,
      Math.floor((productMaxAmount + Number.EPSILON) / valuePerDay),
    );

    effectiveMaxDays = Math.min(effectiveMaxDays, maxDaysByProductAmount);
  }

  return Math.max(0, effectiveMaxDays);
};

export const buildLoanCalculation = ({
  guaranteedDays,
  salarySnapshot,
  vacationBalance,
  productConfig,
}: {
  guaranteedDays: number;
  salarySnapshot: any;
  vacationBalance: any;
  productConfig: any;
}) => {
  const dailySalary = Number(salarySnapshot.dailySalary || 0);

  const availableDays = Math.max(
    0,
    Number(
      vacationBalance?.availableForLoanDays ??
        vacationBalance?.availableDays ??
        0,
    ),
  );

  const appliedGuaranteedDays = Math.max(
    0,
    Math.floor(Number(guaranteedDays || 0)),
  );

  const mode = String(productConfig?.vacationDayValueMode || "DAILY_SALARY")
    .trim()
    .toUpperCase();

  const guaranteeIsRequired = requiresVacationGuarantee(productConfig);

  const productMaxAmount = Number(productConfig?.maxLoanAmount || 0);

  const configuredMaxVacationGuaranteeDays = Math.max(
    0,
    Math.floor(Number(productConfig?.maxVacationGuaranteeDays || 0)),
  );

  const maxGuaranteeDaysByPercent = Math.max(
    0,
    Math.floor(
      calculateMaxGuaranteeDays({
        availableDays,
        productConfig,
      }),
    ),
  );

  const maxGuaranteeDays = calculateEffectiveMaxGuaranteeDays({
    availableDays,
    dailySalary,
    productConfig,
  });

  const vacationDayAmount = calculateVacationGuaranteeAmount({
    guaranteedDays: 1,
    dailySalary,
    productConfig,
  });

  const calculatedRequestedAmount = calculateVacationGuaranteeAmount({
    guaranteedDays: appliedGuaranteedDays,
    dailySalary,
    productConfig,
  });

  const maxPossibleGuaranteeAmount = calculateVacationGuaranteeAmount({
    guaranteedDays: maxGuaranteeDays,
    dailySalary,
    productConfig,
  });

  const productLimit =
    productMaxAmount > 0 ? productMaxAmount : Number.POSITIVE_INFINITY;

  const maxAllowedAmountRaw = Math.min(productLimit, calculatedRequestedAmount);

  const maxAllowedAmountUsingAllAvailableGuaranteeRaw = Math.min(
    productLimit,
    maxPossibleGuaranteeAmount,
  );

  const maxAllowedAmount = Number.isFinite(maxAllowedAmountRaw)
    ? round2(maxAllowedAmountRaw)
    : 0;

  const maxAllowedAmountUsingAllAvailableGuarantee = Number.isFinite(
    maxAllowedAmountUsingAllAvailableGuaranteeRaw,
  )
    ? round2(maxAllowedAmountUsingAllAvailableGuaranteeRaw)
    : 0;

  const availableDaysAfterGuarantee = round2(
    availableDays - appliedGuaranteedDays,
  );

  return {
    requestedAmount: round2(calculatedRequestedAmount),
    calculatedRequestedAmount: round2(calculatedRequestedAmount),
    guaranteedDays: appliedGuaranteedDays,

    maxBySalary: 0,

    guaranteeIsRequired,
    vacationDayValueMode: mode,
    vacationDayAmount: round2(vacationDayAmount),

    maxGuaranteeDaysByPercent,
    configuredMaxVacationGuaranteeDays,
    hasFixedVacationGuaranteeDaysLimit: configuredMaxVacationGuaranteeDays > 0,
    maxGuaranteeDays,

    estimatedGuaranteeAmount: round2(calculatedRequestedAmount),
    maxPossibleGuaranteeAmount: round2(maxPossibleGuaranteeAmount),

    productMaxAmount,
    maxAllowedAmount,
    maxAllowedAmountUsingAllAvailableGuarantee,

    availableDays,
    availableDaysAfterGuarantee,

    dailySalary,
  };
};

const TIMEZONE = "America/Santo_Domingo";

const getCurrentCompanyMonth = () => moment.tz(new Date(), TIMEZONE).month() + 1;

const normalizeConfiguredMonths = (
  months: any,
  fallback: number[],
  guaranteeSource: EmployeeLoanGuaranteeSource,
) => {
  if (Array.isArray(months) && months.length) {
    return Array.from(
      new Set(
        months
          .map((month: any) => Math.floor(Number(month)))
          .filter((month: number) => month >= 1 && month <= 12),
      ),
    );
  }

  return guaranteeSource === "CHRISTMAS_SALARY" ? fallback : [];
};

export const getBlockedInstallmentsForLoan = ({
  amortizationSchedule,
  blockedInstallmentMonths,
}: {
  amortizationSchedule: any[];
  blockedInstallmentMonths: number[];
}) => {
  if (!blockedInstallmentMonths.length) return [];

  return (amortizationSchedule || []).filter((installment: any) => {
    if (!installment?.dueDate) return false;

    const dueMonth = moment.tz(installment.dueDate, TIMEZONE).month() + 1;

    return blockedInstallmentMonths.includes(dueMonth);
  });
};

export const buildChristmasSalaryGuaranteeEligibility = async ({
  employee,
  companyId,
  productConfig,
  year,
  amortizationSchedule = [],
  session,
}: {
  employee: any;
  companyId: any;
  productConfig: any;
  year: number;
  amortizationSchedule?: any[];
  session?: mongoose.ClientSession;
}) => {
  const blockedReasons: string[] = [];
  const warnings: string[] = [];
  const blockedLoanRequestMonths = normalizeConfiguredMonths(
    productConfig?.blockedLoanRequestMonths,
    [1, 12],
    "CHRISTMAS_SALARY",
  );
  const blockedInstallmentMonths = normalizeConfiguredMonths(
    productConfig?.blockedInstallmentMonths,
    [12],
    "CHRISTMAS_SALARY",
  );
  const currentMonth = getCurrentCompanyMonth();
  const blockedRequestMonth = blockedLoanRequestMonths.includes(currentMonth);

  if (productConfig?.christmasSalaryGuaranteeEnabled === false) {
    blockedReasons.push(
      "La garant??a por salario de Navidad no est?? habilitada para este producto.",
    );
  }

  if (blockedRequestMonth) {
    blockedReasons.push(
      `No se permiten solicitudes de pr??stamo en el mes ${currentMonth}.`,
    );
  }

  const balance = companyId
    ? await EmployeeChristmasSalaryBalance.findOne({
        company: companyId,
        employee: employee._id,
        year,
        isDeleted: false,
      }).session(session || null)
    : null;

  const ordinarySalaryEarnedAmount = round2(
    balance?.ordinarySalaryEarnedAmount || 0,
  );
  const accruedChristmasSalaryAmount = round2(
    balance?.accruedChristmasSalaryAmount || 0,
  );
  const paidChristmasSalaryAmount = round2(
    balance?.paidChristmasSalaryAmount || 0,
  );
  const appliedToTerminationAmount = round2(
    balance?.appliedToTerminationAmount || 0,
  );
  const reservedGuaranteeAmount = round2(
    balance?.reservedGuaranteeAmount || 0,
  );
  const availableUnreservedChristmasSalaryAmount = round2(
    Math.max(
      0,
      accruedChristmasSalaryAmount -
        paidChristmasSalaryAmount -
        appliedToTerminationAmount -
        reservedGuaranteeAmount,
    ),
  );
  const maxChristmasSalaryGuaranteePercent = Math.min(
    100,
    Math.max(0, Number(productConfig?.maxChristmasSalaryGuaranteePercent ?? 100)),
  );
  const maxByProductPolicy = round2(
    availableUnreservedChristmasSalaryAmount *
      (maxChristmasSalaryGuaranteePercent / 100),
  );
  const productMaxAmount = Number(productConfig?.maxLoanAmount || 0);
  const productLimit =
    productMaxAmount > 0 ? productMaxAmount : Number.POSITIVE_INFINITY;
  const maxAllowedLoanAmountRaw = Math.min(maxByProductPolicy, productLimit);
  const maxAllowedLoanAmount = Number.isFinite(maxAllowedLoanAmountRaw)
    ? round2(maxAllowedLoanAmountRaw)
    : round2(maxByProductPolicy);
  const minimumRequiredAmount = round2(
    productConfig?.minimumChristmasSalaryAccumulatedAmount || 0,
  );

  if (!balance) {
    blockedReasons.push(
      "No existe balance de salario de Navidad para el a??o actual.",
    );
  }

  if (accruedChristmasSalaryAmount <= 0) {
    blockedReasons.push(
      "No hay salario de Navidad acumulado para garantizar el pr??stamo.",
    );
  }

  if (availableUnreservedChristmasSalaryAmount <= 0) {
    blockedReasons.push(
      "No hay salario de Navidad disponible sin reservar.",
    );
  }

  if (
    minimumRequiredAmount > 0 &&
    availableUnreservedChristmasSalaryAmount < minimumRequiredAmount
  ) {
    blockedReasons.push(
      `Debes tener al menos ${minimumRequiredAmount} de salario de Navidad disponible.`,
    );
  }

  const blockedInstallments = getBlockedInstallmentsForLoan({
    amortizationSchedule,
    blockedInstallmentMonths,
  });
  const blockedInstallmentMonth = blockedInstallments.length > 0;

  if (
    productConfig?.requireLoanSettlementBeforeProtectedMonths === true &&
    blockedInstallmentMonth
  ) {
    blockedReasons.push(
      "La tabla de amortizaci??n contiene cuotas en meses protegidos.",
    );
  } else if (blockedInstallmentMonth) {
    warnings.push(
      "La tabla de amortizaci??n contiene cuotas en meses protegidos.",
    );
  }

  return {
    source: "CHRISTMAS_SALARY" as const,
    label: "Salario de Navidad acumulado",
    year,
    balance: balance?._id || null,
    ordinarySalaryEarnedAmount,
    accruedChristmasSalaryAmount,
    paidChristmasSalaryAmount,
    appliedToTerminationAmount,
    reservedGuaranteeAmount,
    availableUnreservedChristmasSalaryAmount,
    maxChristmasSalaryGuaranteePercent,
    maxByProductPolicy,
    maxAllowedLoanAmount,
    minimumRequiredAmount,
    blockedLoanRequestMonths,
    blockedInstallmentMonths,
    blockedRequestMonth,
    blockedInstallmentMonth,
    blockedInstallments: blockedInstallments.map((installment: any) => ({
      installmentNumber: installment.installmentNumber,
      dueDate: installment.dueDate,
    })),
    blockedReasons,
    warnings,
  };
};

const assertChristmasSalaryLoanRequestIsAllowed = ({
  requestedAmount,
  guarantee,
}: {
  requestedAmount: number;
  guarantee: Awaited<ReturnType<typeof buildChristmasSalaryGuaranteeEligibility>>;
}) => {
  if (guarantee.blockedReasons.length) {
    throw {
      statusCode: 400,
      mensaje: guarantee.blockedReasons[0],
      message: "Christmas salary loan guarantee is not eligible.",
      data: { guarantee },
    };
  }

  if (round2(requestedAmount) > round2(guarantee.maxAllowedLoanAmount)) {
    throw {
      statusCode: 400,
      mensaje: `El monto solicitado supera el m??ximo permitido por salario de Navidad (${guarantee.maxAllowedLoanAmount}).`,
      message: "Requested amount exceeds Christmas salary guarantee limit.",
      data: {
        requestedAmount,
        maxAllowedLoanAmount: guarantee.maxAllowedLoanAmount,
        guarantee,
      },
    };
  }
};

export const buildEmployeeLoanQuoteContext = async ({
  req,
  employee,
  authUserId,
  requestedInstallments,
  guaranteedDays,
  session,
}: {
  req: AuthRequest;
  employee: any;
  authUserId: any;
  requestedInstallments: number;
  guaranteedDays: number;
  session: mongoose.ClientSession;
}) => {
  const companyId = getEmployeeCompanyId(employee);

  const policy = await getEmployeeLoanPolicyOrThrow({
    companyId,
    session,
  });

  const productConfig =
    await getActiveEmployeeLoanProductConfigOrThrow(session);
  const guaranteeSource = resolveEmployeeLoanGuaranteeSource(productConfig);

  const salarySnapshot = buildSalarySnapshot(employee);

  if (salarySnapshot.monthlySalary <= 0) {
    throw {
      statusCode: 400,
      mensaje: "No se encontr?? un sueldo v??lido para calcular el pr??stamo.",
      message: "No valid salary found to calculate loan request.",
    };
  }

  const year = getCurrentYear();
  const performedBy = toObjectId(String(authUserId));

  if (!performedBy) {
    throw {
      statusCode: 400,
      mensaje: "El ID de usuario no es v??lido.",
      message: "Invalid user ID.",
    };
  }

  const appliedInstallments = Math.floor(Number(requestedInstallments || 0));

  if (appliedInstallments <= 0) {
    throw {
      statusCode: 400,
      mensaje: "La cantidad de cuotas debe ser mayor a 0.",
      message: "Installments must be greater than 0.",
    };
  }

  if (!Number.isInteger(Number(requestedInstallments))) {
    throw {
      statusCode: 400,
      mensaje: "La cantidad de cuotas debe ser un n??mero entero.",
      message: "Installments must be an integer.",
    };
  }

  if (guaranteeSource === "CHRISTMAS_SALARY") {
    const requestedAmount = round2(req.body?.requestedAmount || 0);

    validateProductRequestOrThrow({
      productConfig,
      requestedAmount,
      requestedInstallments: appliedInstallments,
    });

    const employeePaymentSchedule = buildEmployeeLoanPaymentSchedule({
      employee,
      installments: appliedInstallments,
      fromDate: new Date(),
      frequencyOverride: salarySnapshot.paymentFrequencyName,
    });

    const paymentFrequency = employeePaymentSchedule.normalizedFrequency;
    const paymentsPerYear = employeePaymentSchedule.paymentsPerYear;
    const firstPaymentDate = employeePaymentSchedule.firstPaymentDate;

    const loanQuote = buildAmortizationSchedule({
      principal: requestedAmount,
      installments: appliedInstallments,
      interestRate: Number(productConfig.interestRate || 0),
      interestRateType: String(productConfig.interestRateType || "ANNUAL"),
      paymentsPerYear,
      firstPaymentDate,
      dueDates: employeePaymentSchedule.dueDates,
    });

    const christmasSalaryGuarantee = await buildChristmasSalaryGuaranteeEligibility({
      employee,
      companyId,
      productConfig,
      year,
      amortizationSchedule: loanQuote.amortizationSchedule,
      session,
    });

    assertChristmasSalaryLoanRequestIsAllowed({
      requestedAmount,
      guarantee: christmasSalaryGuarantee,
    });

    const loanProviderSnapshot =
      buildLoanProviderSnapshotWithSource(productConfig);

    const vacationSnapshot = {
      year,
      balance: null,
      assignedDays: 0,
      usedDays: 0,
      reservedDays: 0,
      adjustmentDays: 0,
      availableDaysBeforeRequest: 0,
      guaranteedDays: 0,
      availableDaysAfterGuarantee: 0,
      estimatedGuaranteeAmount: 0,
    };

    const loanCalculation = {
      requestedAmount,
      calculatedRequestedAmount: requestedAmount,
      guaranteedDays: 0,
      maxBySalary: 0,
      guaranteeIsRequired: true,
      vacationDayValueMode: "NONE",
      vacationDayAmount: 0,
      maxGuaranteeDaysByPercent: 0,
      configuredMaxVacationGuaranteeDays: 0,
      hasFixedVacationGuaranteeDaysLimit: false,
      maxGuaranteeDays: 0,
      estimatedGuaranteeAmount: requestedAmount,
      maxPossibleGuaranteeAmount: christmasSalaryGuarantee.maxAllowedLoanAmount,
      productMaxAmount: Number(productConfig?.maxLoanAmount || 0),
      maxAllowedAmount: christmasSalaryGuarantee.maxAllowedLoanAmount,
      maxAllowedAmountUsingAllAvailableGuarantee:
        christmasSalaryGuarantee.maxAllowedLoanAmount,
      availableDays: 0,
      availableDaysAfterGuarantee: 0,
      dailySalary: salarySnapshot.dailySalary,
    };

    return {
      companyId,
      policy,
      productConfig,
      productRules: buildPublicLoanProductConfigResponse(productConfig),
      guaranteeSource,

      salarySnapshot,
      vacationBalance: null,
      availableForLoanDays: 0,
      christmasSalaryGuarantee,

      requestedAmount,
      calculatedRequestedAmount: requestedAmount,
      requestedInstallments: appliedInstallments,

      loanCalculation,

      paymentConfig: {
        configuredFrequency: productConfig.defaultPaymentFrequency,
        employeeFrequency: salarySnapshot.paymentFrequencyName,
        appliedFrequency: paymentFrequency,
        frequencyLabel: employeePaymentSchedule.frequencyLabel,
        paymentsPerYear,
        paymentDays: employeePaymentSchedule.paymentDays,
        monthlyPaymentDay: employeePaymentSchedule.monthlyPaymentDay,
        firstPaymentDate,
        dueDates: employeePaymentSchedule.dueDates,
        interestRate: Number(productConfig.interestRate || 0),
        interestRateType: String(productConfig.interestRateType || "ANNUAL"),
      },

      loanProviderSnapshot,

      loanQuote,
      loanQuoteSnapshot: {
        principal: loanQuote.principal,
        installments: loanQuote.installments,
        periodicRate: loanQuote.periodicRate,
        installmentAmount: loanQuote.installmentAmount,
        totalInterest: loanQuote.totalInterest,
        totalToPay: loanQuote.totalToPay,
        paymentsPerYear: loanQuote.paymentsPerYear,
        paymentFrequency,
        paymentDays: employeePaymentSchedule.paymentDays,
        monthlyPaymentDay: employeePaymentSchedule.monthlyPaymentDay,
        firstPaymentDate: loanQuote.firstPaymentDate,
      },

      vacationSnapshot,

      contract: buildEmployeeLoanContractPreviewSnapshot({
        employee,
        company: employee?.company,
        loanQuote,
        loanProviderSnapshot,
        vacationSnapshot,
        salarySnapshot,
        productConfig,
        sourcePlatformCode:
          productConfig?.externalProductCode ||
          productConfig?.code ||
          loanProviderSnapshot?.productCode,
        sourcePlatformName: "Payroll System",
      }),

      signatureMeta: {
        signatureIpAddress: getClientIp(req),
        signatureUserAgent: String(req.headers["user-agent"] || ""),
      },

      guaranteeIsRequired: true,
    };
  }

  await ensureEmployeeVacationBalance({
    user: employee,
    year,
    performedBy,
    session,
  });

  let vacationBalance = await findActiveVacationBalanceForLoan({
    userId: employee._id,
    companyId,
    asOfDate: new Date(),
    session,
  });

  if (!vacationBalance) {
    vacationBalance = await ensureEmployeeVacationBalance({
      user: employee,
      year,
      performedBy,
      session,
    });
  }

  const availableForLoanDays = getAvailableDaysForLoan(vacationBalance);

  const vacationBalancePlain =
    typeof vacationBalance?.toObject === "function"
      ? vacationBalance.toObject()
      : vacationBalance;

  const guaranteeIsRequired = requiresVacationGuarantee(productConfig);

  const minimumVacationDaysRequired = Math.max(
    0,
    Math.floor(Number(productConfig?.minimumVacationDaysRequired || 0)),
  );

  if (
    minimumVacationDaysRequired > 0 &&
    availableForLoanDays < minimumVacationDaysRequired
  ) {
    throw {
      statusCode: 400,
      mensaje: `Debes tener al menos ${minimumVacationDaysRequired} d??a(s) de vacaciones disponibles para solicitar este pr??stamo.`,
      message: "Not enough vacation days available.",
      data: {
        minimumVacationDaysRequired,
        availableForLoanDays,
      },
    };
  }

  const appliedGuaranteedDays = Math.floor(Number(guaranteedDays || 0));

  if (appliedGuaranteedDays <= 0) {
    throw {
      statusCode: 400,
      mensaje: "Debes indicar al menos un d??a para solicitar el pr??stamo.",
      message: "At least one vacation day is required.",
    };
  }

  if (!Number.isInteger(Number(guaranteedDays))) {
    throw {
      statusCode: 400,
      mensaje: "La cantidad de d??as debe ser un n??mero entero.",
      message: "Guaranteed days must be an integer.",
    };
  }

  const vacationDayAmount = calculateVacationGuaranteeAmount({
    guaranteedDays: 1,
    dailySalary: salarySnapshot.dailySalary,
    productConfig,
  });

  if (vacationDayAmount <= 0) {
    throw {
      statusCode: 400,
      mensaje:
        "La configuraci??n del pr??stamo no tiene un valor v??lido para cada d??a de vacaciones.",
      message: "Loan product does not have a valid vacation day value.",
    };
  }

  const maxGuaranteeDays = calculateEffectiveMaxGuaranteeDays({
    availableDays: availableForLoanDays,
    dailySalary: salarySnapshot.dailySalary,
    productConfig,
  });

  if (maxGuaranteeDays <= 0) {
    throw {
      statusCode: 400,
      mensaje:
        "Actualmente no tienes d??as disponibles para solicitar este pr??stamo.",
      message: "No vacation days are currently available for this loan.",
    };
  }

  if (appliedGuaranteedDays > maxGuaranteeDays) {
    throw {
      statusCode: 400,
      mensaje: `Solo puedes utilizar hasta ${maxGuaranteeDays} d??a(s) para solicitar este pr??stamo.`,
      message: "Selected vacation days exceed allowed maximum.",
      data: {
        guaranteedDays: appliedGuaranteedDays,
        maxGuaranteeDays,
        availableForLoanDays,
        configuredMaxVacationGuaranteeDays: Math.max(
          0,
          Math.floor(Number(productConfig?.maxVacationGuaranteeDays || 0)),
        ),
        maxVacationDaysGuaranteePercent: Number(
          productConfig?.maxVacationDaysGuaranteePercent || 0,
        ),
      },
    };
  }

  const loanCalculation = buildLoanCalculation({
    guaranteedDays: appliedGuaranteedDays,
    salarySnapshot,
    vacationBalance: {
      ...vacationBalancePlain,
      availableDays: availableForLoanDays,
      availableForLoanDays,
    },
    productConfig,
  });

  const calculatedRequestedAmount = round2(
    loanCalculation.calculatedRequestedAmount,
  );

  if (loanCalculation.availableDaysAfterGuarantee < 0) {
    throw {
      statusCode: 400,
      mensaje: "No tienes suficientes d??as disponibles para esa solicitud.",
      message: "Not enough available vacation days.",
    };
  }

  validateProductRequestOrThrow({
    productConfig,
    requestedAmount: calculatedRequestedAmount,
    requestedInstallments: appliedInstallments,
  });

  const employeePaymentSchedule = buildEmployeeLoanPaymentSchedule({
    employee,
    installments: appliedInstallments,
    fromDate: new Date(),
    frequencyOverride: salarySnapshot.paymentFrequencyName,
  });

  const paymentFrequency = employeePaymentSchedule.normalizedFrequency;
  const paymentsPerYear = employeePaymentSchedule.paymentsPerYear;
  const firstPaymentDate = employeePaymentSchedule.firstPaymentDate;

  const loanQuote = buildAmortizationSchedule({
    principal: calculatedRequestedAmount,
    installments: appliedInstallments,
    interestRate: Number(productConfig.interestRate || 0),
    interestRateType: String(productConfig.interestRateType || "ANNUAL"),
    paymentsPerYear,
    firstPaymentDate,
    dueDates: employeePaymentSchedule.dueDates,
  });

  const loanProviderSnapshot =
    buildLoanProviderSnapshotWithSource(productConfig);

  const vacationSnapshot = {
    year,
    balance: vacationBalance._id,
    assignedDays: Number(vacationBalance.assignedDays || 0),
    usedDays: Number(vacationBalance.usedDays || 0),
    reservedDays: Number(vacationBalance.reservedDays || 0),
    adjustmentDays: Number(vacationBalance.adjustmentDays || 0),
    availableDaysBeforeRequest: loanCalculation.availableDays,
    guaranteedDays: loanCalculation.guaranteedDays,
    availableDaysAfterGuarantee: loanCalculation.availableDaysAfterGuarantee,
    estimatedGuaranteeAmount: loanCalculation.estimatedGuaranteeAmount,
  };

  return {
    companyId,
    policy,
    productConfig,
    productRules: buildPublicLoanProductConfigResponse(productConfig),
    guaranteeSource,

    salarySnapshot,
    vacationBalance,
    availableForLoanDays,

    requestedAmount: calculatedRequestedAmount,
    calculatedRequestedAmount,
    requestedInstallments: appliedInstallments,

    loanCalculation,

    paymentConfig: {
      configuredFrequency: productConfig.defaultPaymentFrequency,
      employeeFrequency: salarySnapshot.paymentFrequencyName,
      appliedFrequency: paymentFrequency,
      frequencyLabel: employeePaymentSchedule.frequencyLabel,
      paymentsPerYear,
      paymentDays: employeePaymentSchedule.paymentDays,
      monthlyPaymentDay: employeePaymentSchedule.monthlyPaymentDay,
      firstPaymentDate,
      dueDates: employeePaymentSchedule.dueDates,
      interestRate: Number(productConfig.interestRate || 0),
      interestRateType: String(productConfig.interestRateType || "ANNUAL"),
    },

    loanProviderSnapshot,

    loanQuote,
    loanQuoteSnapshot: {
      principal: loanQuote.principal,
      installments: loanQuote.installments,
      periodicRate: loanQuote.periodicRate,
      installmentAmount: loanQuote.installmentAmount,
      totalInterest: loanQuote.totalInterest,
      totalToPay: loanQuote.totalToPay,
      paymentsPerYear: loanQuote.paymentsPerYear,
      paymentFrequency,
      paymentDays: employeePaymentSchedule.paymentDays,
      monthlyPaymentDay: employeePaymentSchedule.monthlyPaymentDay,
      firstPaymentDate: loanQuote.firstPaymentDate,
    },

    vacationSnapshot,

    contract: buildEmployeeLoanContractPreviewSnapshot({
      employee,
      company: employee?.company,
      loanQuote,
      loanProviderSnapshot,
      vacationSnapshot,
      salarySnapshot,
      productConfig,
      sourcePlatformCode:
        productConfig?.externalProductCode ||
        productConfig?.code ||
        loanProviderSnapshot?.productCode,
      sourcePlatformName: "Payroll System",
    }),

    signatureMeta: {
      signatureIpAddress: getClientIp(req),
      signatureUserAgent: String(req.headers["user-agent"] || ""),
    },

    guaranteeIsRequired,
  };
};

export const buildExternalPayloadPreview = ({
  loanRequest,
  employee,
  productConfig,
  loanProviderSnapshot,
}: {
  loanRequest: any;
  employee: any;
  productConfig?: any;
  loanProviderSnapshot?: any;
}) => {
  return {
    requestNumber: loanRequest.requestNumber,

    sourcePlatform: {
      code:
        loanRequest.contractSnapshot?.sourcePlatformCode ||
        loanRequest.externalSystemCode ||
        productConfig?.externalProductCode ||
        productConfig?.code ||
        "",
      name: loanRequest.contractSnapshot?.sourcePlatformName || "",
      sourceSystemId: loanRequest.contractSnapshot?.sourceSystemId || "",
    },

    employee: {
      id: String(employee?._id || loanRequest.employee),
      name: employee?.name || "",
      email: employee?.email || "",
      company: loanRequest.company ? String(loanRequest.company) : null,
      department: loanRequest.department
        ? String(loanRequest.department)
        : null,
      jobPosition: loanRequest.jobPosition
        ? String(loanRequest.jobPosition)
        : null,
      project: loanRequest.project ? String(loanRequest.project) : null,
    },

    loan: {
      requestedAmount: loanRequest.requestedAmount,
      requestedInstallments: loanRequest.requestedInstallments,
      maxAllowedAmount: loanRequest.maxAllowedAmount,
      purpose: loanRequest.purpose,
      employeeComment: loanRequest.employeeComment,
    },

    productConfig: productConfig
      ? {
          source: productConfig?._source || PRODUCT_CONFIG_SOURCE,
          id: productConfig?._id ? String(productConfig._id) : "",
          code: productConfig?.code || "",
          externalProductCode: productConfig?.externalProductCode || "",
          name: productConfig?.name || "",
        }
      : null,

    loanProviderSnapshot: loanProviderSnapshot || null,

    salarySnapshot: loanRequest.salarySnapshot,
    vacationSnapshot: loanRequest.vacationSnapshot,

    contract: loanRequest.contractSnapshot
      ? {
          contractVersion: loanRequest.contractSnapshot.contractVersion,
          generationStatus: loanRequest.contractSnapshot.generationStatus,

          templateCode: loanRequest.contractSnapshot.templateCode,
          templateName: loanRequest.contractSnapshot.templateName,
          templateVersion: loanRequest.contractSnapshot.templateVersion,

          generatedDocxFileName:
            loanRequest.contractSnapshot.generatedDocxFileName,
          generatedDocxUrl: loanRequest.contractSnapshot.generatedDocxUrl,
          generatedDocxStorageKey:
            loanRequest.contractSnapshot.generatedDocxStorageKey,

          generatedPdfFileName:
            loanRequest.contractSnapshot.generatedPdfFileName,
          generatedPdfUrl: loanRequest.contractSnapshot.generatedPdfUrl,
          generatedPdfStorageKey:
            loanRequest.contractSnapshot.generatedPdfStorageKey,

          signedAt: loanRequest.contractSnapshot.signedAt,
          acceptedAt: loanRequest.contractSnapshot.acceptedAt,

          signatureName: loanRequest.contractSnapshot.signatureName,
          signatureDocument: loanRequest.contractSnapshot.signatureDocument,
          signatureImageUrl: loanRequest.contractSnapshot.signatureImageUrl,

          sourcePlatformCode: loanRequest.contractSnapshot.sourcePlatformCode,
          sourcePlatformName: loanRequest.contractSnapshot.sourcePlatformName,
          sourceProductCode: loanRequest.contractSnapshot.sourceProductCode,

          checksum: loanRequest.contractSnapshot.checksum,
        }
      : null,
  };
};