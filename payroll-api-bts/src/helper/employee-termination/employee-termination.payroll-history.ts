import { ClientSession, Types } from "mongoose";
import PayrollPayment, { IPayrollPayment } from "../../model/employee-payment-management/payrollPayment";

type CalculationSource =
  | "CURRENT_FIXED_SALARY"
  | "PAYROLL_PAYMENT_LABOR_BASE"
  | "PAYROLL_PAYMENT_EARNINGS"
  | "PAYROLL_PAYMENT_TOTALS"
  | "EMPLOYEE_CURRENT_SALARY_FALLBACK";

type SalaryBaseStrategy =
  | "FIXED_CURRENT_SALARY"
  | "VARIABLE_AVERAGE_LAST_12_MONTHS"
  | "FALLBACK_CURRENT_SALARY";

interface CalculateTerminationSalaryBasesParams {
  companyId?: Types.ObjectId | string | null;
  employee: any;
  terminationDate: Date;
  hiringDate?: Date | string | null;
  dailySalaryDivisor?: number;
  salaryBaseMode?: string;
  session?: ClientSession | null;
}

const roundAmount = (value: number) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

const toObjectIdOrNull = (value: any) => {
  if (!value) return null;

  const id =
    typeof value === "object" && value._id ? String(value._id) : String(value);

  if (!Types.ObjectId.isValid(id)) return null;

  return new Types.ObjectId(id);
};

const toDateOrNull = (value: any) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const getStartOfYear = (date: Date) => {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
};

const maxDate = (...dates: (Date | null | undefined)[]) => {
  const validDates = dates.filter(Boolean) as Date[];

  if (!validDates.length) return null;

  return new Date(Math.max(...validDates.map((d) => d.getTime())));
};

const getDateKey = (date: Date | null) => {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
};

const getMonthKeyFromDate = (date: Date | null) => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  return `${year}-${String(month).padStart(2, "0")}`;
};

const normalizeText = (value: any) => {
  return String(value || "")
    .trim()
    .toUpperCase();
};

const includesAny = (value: string, words: string[]) => {
  return words.some((word) => value.includes(word));
};

const getSalaryTypeCode = (employee: any) => {
  return normalizeText(
    employee?.salaryType?.code ||
      employee?.salaryTypeCode ||
      employee?.tipoSalario ||
      employee?.snapshot?.employee?.tipoSalario ||
      "",
  );
};

const isFixedSalaryEmployee = (employee: any) => {
  const code = getSalaryTypeCode(employee);

  if (!code) {
    return Number(employee?.baseSalary || 0) > 0;
  }

  return includesAny(code, ["FIJO", "FIXED", "SALARIO_FIJO", "BASE"]);
};

const isHourlySalaryEmployee = (employee: any) => {
  const code = getSalaryTypeCode(employee);

  return includesAny(code, ["HORA", "HORAS", "HOURLY"]);
};

const isCommissionSalaryEmployee = (employee: any) => {
  const code = getSalaryTypeCode(employee);

  return includesAny(code, ["COMISION", "COMISIÓN", "COMMISSION", "VARIABLE"]);
};

const getPaymentPeriodStart = (payment: any) => {
  return (
    toDateOrNull(payment.periodStart) ||
    toDateOrNull(payment.snapshot?.period?.start) ||
    toDateOrNull(payment.createdAt)
  );
};

const getPaymentPeriodEnd = (payment: any) => {
  return (
    toDateOrNull(payment.periodEnd) ||
    toDateOrNull(payment.snapshot?.period?.end) ||
    toDateOrNull(payment.createdAt)
  );
};

const getPaymentPeriodKey = (payment: any) => {
  if (payment.periodKey) return String(payment.periodKey);

  if (payment.year && payment.month) {
    return `${payment.year}-${String(payment.month).padStart(2, "0")}`;
  }

  return getMonthKeyFromDate(getPaymentPeriodEnd(payment));
};

const isSameCompanyOrMissing = (
  payment: any,
  companyId?: Types.ObjectId | string | null,
) => {
  if (!companyId) return true;

  if (!payment.company) return true;

  return String(payment.company) === String(companyId);
};

const inferEarningSource = (earning: any) => {
  const text = normalizeText(
    `${earning?.nombre || ""} ${earning?.code || ""} ${earning?.type || ""} ${
      earning?.source || ""
    }`,
  );

  if (
    includesAny(text, [
      "BASE_SALARY",
      "SUELDO",
      "SALARIO",
      "BASE",
      "FIJO",
      "FIXED",
    ])
  ) {
    return "BASE_SALARY";
  }

  if (includesAny(text, ["HORA", "HORAS", "HOURLY"])) {
    return "HOURLY";
  }

  if (includesAny(text, ["COMISION", "COMISIÓN", "COMMISSION"])) {
    return "COMMISSION";
  }

  if (includesAny(text, ["BONO", "BONUS", "INCENTIVO", "INCENTIVE"])) {
    return "BONUS";
  }

  if (includesAny(text, ["MANUAL", "AJUSTE", "ADJUSTMENT"])) {
    return "MANUAL";
  }

  return "OTHER";
};

const isVariableOrdinaryEarning = (earning: any) => {
  if (earning?.includeForTerminationAverage === false) return false;
  if (earning?.isOrdinarySalary === false) return false;

  const source = normalizeText(earning?.source || inferEarningSource(earning));

  return ["HOURLY", "COMMISSION", "BONUS", "MANUAL"].includes(source);
};

const paymentHasVariableOrdinaryEarnings = (payment: any) => {
  const earnings = payment.snapshot?.earnings || [];

  if (!Array.isArray(earnings) || !earnings.length) return false;

  return earnings.some((earning: any) => {
    const amount = Number(earning?.montoPeriodo || 0);

    if (amount <= 0) return false;

    return isVariableOrdinaryEarning(earning);
  });
};

const hasVariableOrdinaryPayments = (payments: any[]) => {
  return payments.some((payment) =>
    paymentHasVariableOrdinaryEarnings(payment),
  );
};

const hasUsableLaborBase = (
  payment: any,
  field: "terminationAverageAmountPeriod" | "christmasSalaryAmountPeriod",
) => {
  const laborBase = payment.snapshot?.laborBase;

  if (!laborBase) return false;

  const amount = Number(laborBase[field] || 0);

  const hasIncludedTrace =
    Array.isArray(laborBase.includedEarnings) &&
    laborBase.includedEarnings.length > 0;

  const hasExcludedTrace =
    Array.isArray(laborBase.excludedEarnings) &&
    laborBase.excludedEarnings.length > 0;

  return amount > 0 || hasIncludedTrace || hasExcludedTrace;
};

const isEarningIncludedForTerminationAverage = (earning: any) => {
  if (earning?.includeForTerminationAverage === false) return false;
  if (earning?.includeForTerminationAverage === true) return true;

  if (earning?.isOrdinarySalary === false) return false;

  return true;
};

const isEarningIncludedForChristmasSalary = (earning: any) => {
  if (earning?.includeForChristmasSalary === false) return false;
  if (earning?.includeForChristmasSalary === true) return true;

  if (earning?.isOrdinarySalary === false) return false;

  return true;
};

const sumEarnings = (payment: any, includeFn: (earning: any) => boolean) => {
  const earnings = payment.snapshot?.earnings || [];

  if (!Array.isArray(earnings) || !earnings.length) return null;

  return earnings.reduce((sum: number, earning: any) => {
    if (!includeFn(earning)) return sum;

    return sum + Number(earning.montoPeriodo || 0);
  }, 0);
};

const getTerminationAverageAmountFromPayment = (payment: any) => {
  if (hasUsableLaborBase(payment, "terminationAverageAmountPeriod")) {
    return {
      amount: Number(
        payment.snapshot?.laborBase?.terminationAverageAmountPeriod || 0,
      ),
      source: "PAYROLL_PAYMENT_LABOR_BASE" as CalculationSource,
    };
  }

  const earningsAmount = sumEarnings(
    payment,
    isEarningIncludedForTerminationAverage,
  );

  if (earningsAmount !== null) {
    return {
      amount: Number(earningsAmount || 0),
      source: "PAYROLL_PAYMENT_EARNINGS" as CalculationSource,
    };
  }

  return {
    amount: Number(payment.snapshot?.totals?.sueldoBrutoPeriodo || 0),
    source: "PAYROLL_PAYMENT_TOTALS" as CalculationSource,
  };
};

const getChristmasSalaryAmountFromPayment = (payment: any) => {
  if (hasUsableLaborBase(payment, "christmasSalaryAmountPeriod")) {
    return {
      amount: Number(
        payment.snapshot?.laborBase?.christmasSalaryAmountPeriod || 0,
      ),
      source: "PAYROLL_PAYMENT_LABOR_BASE" as CalculationSource,
    };
  }

  const earningsAmount = sumEarnings(
    payment,
    isEarningIncludedForChristmasSalary,
  );

  if (earningsAmount !== null) {
    return {
      amount: Number(earningsAmount || 0),
      source: "PAYROLL_PAYMENT_EARNINGS" as CalculationSource,
    };
  }

  return {
    amount: Number(payment.snapshot?.totals?.sueldoBrutoPeriodo || 0),
    source: "PAYROLL_PAYMENT_TOTALS" as CalculationSource,
  };
};

const getCurrentEmployeeMonthlySalaryFallback = (employee: any) => {
  const baseSalary = Number(employee?.baseSalary || 0);

  if (baseSalary > 0) return baseSalary;

  const salaryAmount = Number(employee?.salaryAmount || 0);

  if (salaryAmount > 0) return salaryAmount;

  const currentSalary = Number(employee?.currentSalary || 0);

  if (currentSalary > 0) return currentSalary;

  const hourlyRate = Number(employee?.hourlyRate || 0);
  const estimatedHours =
    Number(employee?.horasEstimadas || 0) ||
    Number(employee?.estimatedHours || 0) ||
    Number(employee?.monthlyEstimatedHours || 0);

  if (hourlyRate > 0 && estimatedHours > 0) {
    return hourlyRate * estimatedHours;
  }

  return 0;
};

const getComputedMonthsFromPayments = (
  payments: any[],
  rangeStart: Date,
  rangeEnd: Date,
) => {
  const monthKeys = new Set<string>();

  for (const payment of payments) {
    const periodEnd = getPaymentPeriodEnd(payment);

    if (!periodEnd) continue;

    if (periodEnd < rangeStart || periodEnd > rangeEnd) continue;

    const monthKey = getPaymentPeriodKey(payment);

    if (monthKey) monthKeys.add(monthKey);
  }

  if (monthKeys.size > 0) {
    return Math.min(12, Math.max(1, monthKeys.size));
  }

  const diffMs = rangeEnd.getTime() - rangeStart.getTime();
  const diffDays = Math.max(1, diffMs / (1000 * 60 * 60 * 24));

  return Math.min(12, Math.max(1, Math.ceil(diffDays / 30.4375)));
};

const buildPaymentDetail = (
  payment: any,
  amount: number,
  source: CalculationSource,
) => {
  return {
    payrollPaymentId: String(payment._id || ""),
    periodStart: getDateKey(getPaymentPeriodStart(payment)),
    periodEnd: getDateKey(getPaymentPeriodEnd(payment)),
    periodKey: getPaymentPeriodKey(payment),
    amount: roundAmount(amount),
    source,
  };
};

const findEmployeePayrollPayments = async ({
  companyId,
  employeeId,
  session,
}: {
  companyId?: Types.ObjectId | string | null;
  employeeId: Types.ObjectId;
  session?: ClientSession | null;
}) => {
  const query: any = {
    user: employeeId,
    isDeleted: { $ne: true },
  };

  const payments = await PayrollPayment.find(query)
    .sort({ periodEnd: -1, createdAt: -1 })
    .session(session || null)
    .lean();

  return payments.filter((payment: any) =>
    isSameCompanyOrMissing(payment, companyId),
  );
};

const filterPaymentsByDateRange = (payments: any[], start: Date, end: Date) => {
  return payments.filter((payment) => {
    const periodEnd = getPaymentPeriodEnd(payment);

    if (!periodEnd) return false;

    return periodEnd >= start && periodEnd <= end;
  });
};

const calculateAverageLast12Months = ({
  employee,
  payments,
  rangeStart,
  rangeEnd,
  dailySalaryDivisor,
}: {
  employee: any;
  payments: any[];
  rangeStart: Date;
  rangeEnd: Date;
  dailySalaryDivisor: number;
}) => {
  const details: any[] = [];

  let ordinarySalaryLast12Months = 0;

  for (const payment of payments) {
    const result = getTerminationAverageAmountFromPayment(payment);

    ordinarySalaryLast12Months += Number(result.amount || 0);

    details.push(buildPaymentDetail(payment, result.amount, result.source));
  }

  const monthsComputed = getComputedMonthsFromPayments(
    payments,
    rangeStart,
    rangeEnd,
  );

  let averageMonthlySalary =
    monthsComputed > 0 ? ordinarySalaryLast12Months / monthsComputed : 0;

  let fallbackUsed = false;

  if (averageMonthlySalary <= 0) {
    averageMonthlySalary = getCurrentEmployeeMonthlySalaryFallback(employee);
    ordinarySalaryLast12Months = averageMonthlySalary;
    fallbackUsed = true;
  }

  const averageDailySalary =
    Number(dailySalaryDivisor || 0) > 0
      ? averageMonthlySalary / Number(dailySalaryDivisor)
      : 0;

  const usedSources = new Set(details.map((item) => item.source));

  let source: CalculationSource | "MIXED_PAYROLL_HISTORY" =
    "PAYROLL_PAYMENT_LABOR_BASE";

  if (fallbackUsed) {
    source = "EMPLOYEE_CURRENT_SALARY_FALLBACK";
  } else if (usedSources.size > 1) {
    source = "MIXED_PAYROLL_HISTORY";
  } else if (usedSources.size === 1) {
    source = [...usedSources][0];
  }

  return {
    source,
    fallbackUsed,

    ordinarySalaryLast12Months: roundAmount(ordinarySalaryLast12Months),
    monthsComputed: fallbackUsed ? 1 : monthsComputed,

    averageMonthlySalary: roundAmount(averageMonthlySalary),
    averageDailySalary: roundAmount(averageDailySalary),

    dailySalaryDivisor,
    payrollPaymentsCount: payments.length,
    details,
  };
};

const resolveSalaryBaseStrategy = ({
  employee,
  payments,
}: {
  employee: any;
  payments: any[];
}): SalaryBaseStrategy => {
  const isHourly = isHourlySalaryEmployee(employee);
  const isCommission = isCommissionSalaryEmployee(employee);
  const isFixed = isFixedSalaryEmployee(employee);
  const hasVariablePayments = hasVariableOrdinaryPayments(payments);

  if (isHourly || isCommission || hasVariablePayments) {
    return "VARIABLE_AVERAGE_LAST_12_MONTHS";
  }

  if (isFixed) {
    return "FIXED_CURRENT_SALARY";
  }

  return "VARIABLE_AVERAGE_LAST_12_MONTHS";
};

export const calculateTerminationSalaryBaseForSeveranceAndNotice = async ({
  companyId,
  employee,
  terminationDate,
  hiringDate,
  dailySalaryDivisor = 23.83,
  session,
}: CalculateTerminationSalaryBasesParams) => {
  const employeeId = toObjectIdOrNull(employee?._id || employee?.id);

  if (!employeeId) {
    throw new Error("Empleado inválido para calcular salario base.");
  }

  const safeTerminationDate = endOfDay(terminationDate);
  const rawStart12 = startOfDay(addMonths(safeTerminationDate, -12));

  const employeeHiringDate = toDateOrNull(hiringDate || employee?.hiringDate);

  const rangeStart =
    maxDate(
      rawStart12,
      employeeHiringDate ? startOfDay(employeeHiringDate) : null,
    ) || rawStart12;

  const allPayments = await findEmployeePayrollPayments({
    companyId,
    employeeId,
    session,
  });

  const payments = filterPaymentsByDateRange(
    allPayments,
    rangeStart,
    safeTerminationDate,
  );

  const strategy = resolveSalaryBaseStrategy({
    employee,
    payments,
  });

  if (strategy === "FIXED_CURRENT_SALARY") {
    const selectedMonthlySalary =
      getCurrentEmployeeMonthlySalaryFallback(employee);

    if (selectedMonthlySalary > 0) {
      const dailySalary =
        selectedMonthlySalary / Number(dailySalaryDivisor || 23.83);

      return {
        strategy,
        source: "CURRENT_FIXED_SALARY" as CalculationSource,
        fallbackUsed: false,

        rangeStart,
        rangeEnd: safeTerminationDate,

        selectedMonthlySalary: roundAmount(selectedMonthlySalary),
        averageMonthlySalary: roundAmount(selectedMonthlySalary),

        dailySalary: roundAmount(dailySalary),
        averageDailySalary: roundAmount(dailySalary),

        dailySalaryDivisor: Number(dailySalaryDivisor || 23.83),

        ordinarySalaryLast12Months: roundAmount(selectedMonthlySalary),
        monthsComputed: 1,

        payrollPaymentsCount: payments.length,
        details: [],
      };
    }
  }

  const averageResult = calculateAverageLast12Months({
    employee,
    payments,
    rangeStart,
    rangeEnd: safeTerminationDate,
    dailySalaryDivisor: Number(dailySalaryDivisor || 23.83),
  });

  return {
    strategy:
      strategy === "FIXED_CURRENT_SALARY"
        ? "FALLBACK_CURRENT_SALARY"
        : strategy,
    source: averageResult.source,
    fallbackUsed: averageResult.fallbackUsed,

    rangeStart,
    rangeEnd: safeTerminationDate,

    selectedMonthlySalary: averageResult.averageMonthlySalary,
    averageMonthlySalary: averageResult.averageMonthlySalary,

    dailySalary: averageResult.averageDailySalary,
    averageDailySalary: averageResult.averageDailySalary,

    dailySalaryDivisor: Number(dailySalaryDivisor || 23.83),

    ordinarySalaryLast12Months: averageResult.ordinarySalaryLast12Months,
    monthsComputed: averageResult.monthsComputed,

    payrollPaymentsCount: averageResult.payrollPaymentsCount,
    details: averageResult.details,
  };
};

export const calculateChristmasSalaryFromPayrollHistory = async ({
  companyId,
  employee,
  terminationDate,
  hiringDate,
  session,
}: CalculateTerminationSalaryBasesParams) => {
  const employeeId = toObjectIdOrNull(employee?._id || employee?.id);

  if (!employeeId) {
    throw new Error("Empleado inválido para calcular salario de Navidad.");
  }

  const safeTerminationDate = endOfDay(terminationDate);
  const yearStart = startOfDay(getStartOfYear(safeTerminationDate));

  const employeeHiringDate = toDateOrNull(hiringDate || employee?.hiringDate);

  const rangeStart =
    maxDate(
      yearStart,
      employeeHiringDate ? startOfDay(employeeHiringDate) : null,
    ) || yearStart;

  const allPayments = await findEmployeePayrollPayments({
    companyId,
    employeeId,
    session,
  });

  const payments = filterPaymentsByDateRange(
    allPayments,
    rangeStart,
    safeTerminationDate,
  );

  const details: any[] = [];

  let ordinarySalaryEarnedYTD = 0;

  for (const payment of payments) {
    const result = getChristmasSalaryAmountFromPayment(payment);

    ordinarySalaryEarnedYTD += Number(result.amount || 0);

    details.push(buildPaymentDetail(payment, result.amount, result.source));
  }

  const usedSources = new Set(details.map((item) => item.source));

  let source: CalculationSource | "MIXED_PAYROLL_HISTORY" =
    "PAYROLL_PAYMENT_LABOR_BASE";

  if (usedSources.size > 1) {
    source = "MIXED_PAYROLL_HISTORY";
  } else if (usedSources.size === 1) {
    source = [...usedSources][0];
  }

  let fallbackUsed = false;

  if (ordinarySalaryEarnedYTD <= 0) {
    const monthlySalary = getCurrentEmployeeMonthlySalaryFallback(employee);

    const diffMs = safeTerminationDate.getTime() - rangeStart.getTime();
    const diffDays = Math.max(1, diffMs / (1000 * 60 * 60 * 24));
    const estimatedMonths = Math.max(1 / 30.4375, diffDays / 30.4375);

    ordinarySalaryEarnedYTD = monthlySalary * estimatedMonths;

    fallbackUsed = true;
    source = "EMPLOYEE_CURRENT_SALARY_FALLBACK";
  }

  const christmasSalaryAmount = ordinarySalaryEarnedYTD / 12;

  return {
    source,
    fallbackUsed,

    rangeStart,
    rangeEnd: safeTerminationDate,

    ordinarySalaryEarnedYTD: roundAmount(ordinarySalaryEarnedYTD),
    christmasSalaryAmount: roundAmount(christmasSalaryAmount),

    payrollPaymentsCount: payments.length,
    details,
  };
};

export const calculateTerminationSalaryBases = async (
  params: CalculateTerminationSalaryBasesParams,
) => {
  const dailySalaryDivisor = Number(params.dailySalaryDivisor || 23.83);

  const severanceAndNoticeBase =
    await calculateTerminationSalaryBaseForSeveranceAndNotice({
      ...params,
      dailySalaryDivisor,
    });

  const christmasSalary =
    await calculateChristmasSalaryFromPayrollHistory(params);

  return {
    salaryBaseMode:
      severanceAndNoticeBase.strategy === "FIXED_CURRENT_SALARY"
        ? "CURRENT_SALARY"
        : "AVERAGE_LAST_12_MONTHS_ORDINARY",

    strategy: severanceAndNoticeBase.strategy,

    selectedMonthlySalary: severanceAndNoticeBase.selectedMonthlySalary,
    averageOrdinarySalary: severanceAndNoticeBase.averageMonthlySalary,

    dailySalary: severanceAndNoticeBase.dailySalary,
    averageDailySalary: severanceAndNoticeBase.averageDailySalary,
    dailySalaryDivisor,

    ordinarySalaryLast12Months:
      severanceAndNoticeBase.ordinarySalaryLast12Months,

    monthsComputed: severanceAndNoticeBase.monthsComputed,

    christmasSalaryEarnedYTD: christmasSalary.ordinarySalaryEarnedYTD,

    christmasSalaryAmount: christmasSalary.christmasSalaryAmount,

    source: severanceAndNoticeBase.source,
    christmasSalarySource: christmasSalary.source,

    payrollPaymentsCount: severanceAndNoticeBase.payrollPaymentsCount,
    christmasPayrollPaymentsCount: christmasSalary.payrollPaymentsCount,

    fallbackUsed:
      severanceAndNoticeBase.fallbackUsed || christmasSalary.fallbackUsed,

    terminationAverageDetails: severanceAndNoticeBase.details,
    christmasSalaryDetails: christmasSalary.details,
  };
};
