import { Types } from "mongoose";
import { TerminationTypeCode, SalaryBaseMode } from "../../model/employee-termination/laborTerminationPolicyRD";
import {
  TerminationLineType,
  TerminationLineSource,
  TerminationLineCode,
  ITerminationCalculationLine,
} from "../../model/employee-termination/employeeTermination";

export const toObjectIdOrNull = (value?: any) => {
  if (!value) return null;
  if (value instanceof Types.ObjectId) return value;
  if (Types.ObjectId.isValid(value)) return new Types.ObjectId(value);
  return null;
};

export const asDate = (value: any): Date => {
  if (!value) return new Date();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
};

export const roundAmount = (
  amount: number,
  mode:
    | "NONE"
    | "ROUND_2_DECIMALS"
    | "ROUND_UP"
    | "ROUND_DOWN" = "ROUND_2_DECIMALS",
) => {
  const safeAmount = Number(amount || 0);

  if (mode === "NONE") return safeAmount;
  if (mode === "ROUND_UP") return Math.ceil(safeAmount);
  if (mode === "ROUND_DOWN") return Math.floor(safeAmount);

  return Math.round((safeAmount + Number.EPSILON) * 100) / 100;
};

export const resolveInclude = (
  defaultValue: boolean,
  overrideValue?: boolean | null,
) => {
  if (typeof overrideValue === "boolean") return overrideValue;
  return defaultValue;
};

export const getDisplayName = (value: any) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  return (
    value.name ||
    value.fullName ||
    value.legalName ||
    value.commercialName ||
    value.code ||
    ""
  );
};

export const buildTerminationLine = (payload: {
  code: TerminationLineCode;
  label: string;
  type: TerminationLineType;
  source: TerminationLineSource;
  amount: number;
  days?: number;
  dailySalary?: number;
  baseSalary?: number;
  rate?: number;
  taxable?: boolean;
  affectsNetTotal?: boolean;
  requiresApproval?: boolean;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
  reason?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdBy?: Types.ObjectId | null;
}): ITerminationCalculationLine => {
  return {
    code: payload.code,
    label: payload.label,

    type: payload.type,
    source: payload.source,

    amount: Number(payload.amount || 0),

    days: Number(payload.days || 0),
    dailySalary: Number(payload.dailySalary || 0),
    baseSalary: Number(payload.baseSalary || 0),
    rate: Number(payload.rate || 0),

    taxable: payload.taxable ?? false,
    affectsNetTotal: payload.affectsNetTotal ?? true,

    requiresApproval: payload.requiresApproval ?? false,
    approvedBy: payload.approvedBy || null,
    approvedAt: payload.approvedAt || null,

    reason: payload.reason || "",
    notes: payload.notes || "",

    metadata: payload.metadata || {},

    createdBy: payload.createdBy || null,
    createdAt: new Date(),
  } as ITerminationCalculationLine;
};

export const calculateTotalsFromLines = (
  lines: ITerminationCalculationLine[],
  roundingMode: "NONE" | "ROUND_2_DECIMALS" | "ROUND_UP" | "ROUND_DOWN",
) => {
  const affectedLines = lines.filter((line) => line.affectsNetTotal !== false);

  const automaticIncome = affectedLines
    .filter((line) => line.type === "EARNING" && line.source === "AUTOMATIC")
    .reduce((sum, line) => sum + Number(line.amount || 0), 0);

  const manualIncome = affectedLines
    .filter((line) => line.type === "EARNING" && line.source === "MANUAL")
    .reduce((sum, line) => sum + Number(line.amount || 0), 0);

  const automaticDeductions = affectedLines
    .filter((line) => line.type === "DEDUCTION" && line.source === "AUTOMATIC")
    .reduce((sum, line) => sum + Number(line.amount || 0), 0);

  const manualDeductions = affectedLines
    .filter((line) => line.type === "DEDUCTION" && line.source === "MANUAL")
    .reduce((sum, line) => sum + Number(line.amount || 0), 0);

  const totalIncome = automaticIncome + manualIncome;
  const totalDeductions = automaticDeductions + manualDeductions;
  const netTotal = totalIncome - totalDeductions;

  return {
    automaticIncome: roundAmount(automaticIncome, roundingMode),
    manualIncome: roundAmount(manualIncome, roundingMode),
    totalIncome: roundAmount(totalIncome, roundingMode),

    automaticDeductions: roundAmount(automaticDeductions, roundingMode),
    manualDeductions: roundAmount(manualDeductions, roundingMode),
    totalDeductions: roundAmount(totalDeductions, roundingMode),

    netTotal: roundAmount(netTotal, roundingMode),
  };
};

export const buildEmployeeSnapshot = (employee: any) => {
  return {
    fullName: employee?.name || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    idNumber: employee?.idNumber || "",
    code: employee?.code || "",
    department: getDisplayName(employee?.department),
    jobPosition: getDisplayName(employee?.jobPosition),
    project: getDisplayName(employee?.project),
    company: getDisplayName(employee?.company),
  };
};

export const buildSalarySnapshot = (payload: {
  salaryBaseMode: SalaryBaseMode | string;

  currentSalary?: number;
  lastSalary?: number;
  selectedMonthlySalary?: number;

  averageOrdinarySalary?: number;
  dailySalary?: number;
  dailySalaryDivisor?: number;
  hourlyRate?: number;

  paymentSchedule?: string;
  salaryType?: string;

  strategy?: string;
  source?: string;
  fallbackUsed?: boolean;

  ordinarySalaryLast12Months?: number;
  monthsComputed?: number;

  christmasSalaryEarnedYTD?: number;
  christmasSalaryAmount?: number;
  christmasSalarySource?: string;

  payrollPaymentsCount?: number;
  christmasPayrollPaymentsCount?: number;

  terminationAverageDetails?: any[];
  christmasSalaryDetails?: any[];
}) => {
  return {
    salaryBaseMode: payload.salaryBaseMode,

    currentSalary: Number(payload.currentSalary || 0),
    lastSalary: Number(payload.lastSalary || 0),
    selectedMonthlySalary: Number(payload.selectedMonthlySalary || 0),

    averageOrdinarySalary: Number(payload.averageOrdinarySalary || 0),
    dailySalary: Number(payload.dailySalary || 0),
    dailySalaryDivisor: Number(payload.dailySalaryDivisor || 23.83),
    hourlyRate: Number(payload.hourlyRate || 0),

    paymentSchedule: payload.paymentSchedule || "",
    salaryType: payload.salaryType || "",

    strategy: payload.strategy || "",
    source: payload.source || "",
    fallbackUsed: Boolean(payload.fallbackUsed),

    ordinarySalaryLast12Months: Number(payload.ordinarySalaryLast12Months || 0),
    monthsComputed: Number(payload.monthsComputed || 0),

    christmasSalaryEarnedYTD: Number(payload.christmasSalaryEarnedYTD || 0),
    christmasSalaryAmount: Number(payload.christmasSalaryAmount || 0),
    christmasSalarySource: payload.christmasSalarySource || "",

    payrollPaymentsCount: Number(payload.payrollPaymentsCount || 0),
    christmasPayrollPaymentsCount: Number(
      payload.christmasPayrollPaymentsCount || 0,
    ),

    terminationAverageDetails: payload.terminationAverageDetails || [],
    christmasSalaryDetails: payload.christmasSalaryDetails || [],
  };
};

export const normalizeManualTerminationLine = (payload: {
  code: TerminationLineCode;
  label?: string;
  type: TerminationLineType;
  amount: number;
  reason?: string;
  notes?: string;
  createdBy?: Types.ObjectId | null;
  requiresApproval?: boolean;
}) => {
  return buildTerminationLine({
    code: payload.code,
    label: payload.label || payload.code,
    type: payload.type,
    source: "MANUAL",
    amount: payload.amount,
    reason: payload.reason || "",
    notes: payload.notes || "",
    createdBy: payload.createdBy || null,
    requiresApproval: payload.requiresApproval ?? true,
  });
};

export const buildDefaultLaborTerminationPolicyPayload = (payload: {
  company?: Types.ObjectId | null;
  year: number;
  version?: number;
  effectiveFrom?: Date;
  notes?: string;
}) => {
  return {
    company: payload.company || null,
    country: "DO",
    year: payload.year,
    version: payload.version || 1,

    effectiveFrom:
      payload.effectiveFrom || new Date(`${payload.year}-01-01T00:00:00.000Z`),
    effectiveTo: null,

    salaryBaseMode: "AVERAGE_LAST_12_MONTHS_ORDINARY",
    dailySalaryDivisor: 23.83,

    preNoticeBrackets: [
      {
        fromMonths: 3,
        toMonths: 6,
        days: 7,
        label: "De 3 a 6 meses",
      },
      {
        fromMonths: 6,
        toMonths: 12,
        days: 14,
        label: "Más de 6 meses y hasta 1 año",
      },
      {
        fromMonths: 12,
        toMonths: null,
        days: 28,
        label: "Más de 1 año",
      },
    ],

    severanceBrackets: [
      {
        fromMonths: 3,
        toMonths: 6,
        days: 6,
        mode: "FIXED",
        label: "De 3 a 6 meses",
      },
      {
        fromMonths: 6,
        toMonths: 12,
        days: 13,
        mode: "FIXED",
        label: "Más de 6 meses y menos de 1 año",
      },
      {
        fromMonths: 12,
        toMonths: 60,
        days: 21,
        mode: "PER_YEAR",
        label: "Más de 1 año y menos de 5 años",
      },
      {
        fromMonths: 60,
        toMonths: null,
        days: 23,
        mode: "PER_YEAR",
        label: "Más de 5 años",
      },
    ],

    christmasSalaryRule: {
      enabled: true,
      defaultIncludeOnTermination: true,
      calculationMode: "ORDINARY_SALARY_EARNED_YEAR_TO_DATE_DIVIDED_BY_12",
      accrualSource: "PAYROLL_ACCRUAL",
      minimumWorkedMonthsToPay: 0,
      allowExcludeBeforeProbationEnds: false,
      probationMonths: 3,
      allowManualOverride: true,
      notes:
        "Por defecto se calcula proporcional. Si la empresa quiere excluir antes del período probatorio, debe activarlo explícitamente.",
    },

    vacationRule: {
      enabled: true,
      calculationMode: "VACATION_MODULE",
      defaultIncludeOnTermination: true,
      allowManualOverride: true,
      notes:
        "Por defecto se toma del módulo actual de vacaciones o acumulados.",
    },

    terminationTypeRules: [
      {
        code: "EMPLOYER_DESAHUCIO" as TerminationTypeCode,
        label: "Desahucio por parte del empleador",
        includePendingSalary: true,
        includeSeverance: true,
        includePreNotice: true,
        includeVacation: true,
        includeChristmasSalary: true,
        includeEconomicAssistance: false,
        allowManualEarnings: true,
        allowManualDeductions: true,
        deductPreNoticeIfEmployeeDidNotNotify: false,
        requiresReason: true,
        requiresDocument: false,
        requiresApproval: true,
        isActive: true,
      },
      {
        code: "EMPLOYEE_RESIGNATION" as TerminationTypeCode,
        label: "Renuncia del empleado",
        includePendingSalary: true,
        includeSeverance: false,
        includePreNotice: false,
        includeVacation: true,
        includeChristmasSalary: true,
        includeEconomicAssistance: false,
        allowManualEarnings: true,
        allowManualDeductions: true,
        deductPreNoticeIfEmployeeDidNotNotify: true,
        requiresReason: false,
        requiresDocument: true,
        requiresApproval: true,
        isActive: true,
      },
      {
        code: "EMPLOYER_JUSTIFIED_DISMISSAL" as TerminationTypeCode,
        label: "Despido justificado",
        includePendingSalary: true,
        includeSeverance: false,
        includePreNotice: false,
        includeVacation: true,
        includeChristmasSalary: true,
        includeEconomicAssistance: false,
        allowManualEarnings: true,
        allowManualDeductions: true,
        deductPreNoticeIfEmployeeDidNotNotify: false,
        requiresReason: true,
        requiresDocument: true,
        requiresApproval: true,
        isActive: true,
      },
      {
        code: "EMPLOYER_UNJUSTIFIED_DISMISSAL" as TerminationTypeCode,
        label: "Despido injustificado",
        includePendingSalary: true,
        includeSeverance: true,
        includePreNotice: true,
        includeVacation: true,
        includeChristmasSalary: true,
        includeEconomicAssistance: false,
        allowManualEarnings: true,
        allowManualDeductions: true,
        deductPreNoticeIfEmployeeDidNotNotify: false,
        requiresReason: true,
        requiresDocument: true,
        requiresApproval: true,
        isActive: true,
      },
      {
        code: "EMPLOYEE_JUSTIFIED_RESIGNATION" as TerminationTypeCode,
        label: "Dimisión justificada",
        includePendingSalary: true,
        includeSeverance: true,
        includePreNotice: true,
        includeVacation: true,
        includeChristmasSalary: true,
        includeEconomicAssistance: false,
        allowManualEarnings: true,
        allowManualDeductions: true,
        deductPreNoticeIfEmployeeDidNotNotify: false,
        requiresReason: true,
        requiresDocument: true,
        requiresApproval: true,
        isActive: true,
      },
      {
        code: "MUTUAL_AGREEMENT" as TerminationTypeCode,
        label: "Mutuo acuerdo",
        includePendingSalary: true,
        includeSeverance: false,
        includePreNotice: false,
        includeVacation: true,
        includeChristmasSalary: true,
        includeEconomicAssistance: false,
        allowManualEarnings: true,
        allowManualDeductions: true,
        deductPreNoticeIfEmployeeDidNotNotify: false,
        requiresReason: true,
        requiresDocument: true,
        requiresApproval: true,
        isActive: true,
      },
    ],

    manualAdjustmentRules: {
      allowManualEarnings: true,
      allowManualDeductions: true,
      requireReasonForManualAdjustment: true,
      requireApprovalForManualAdjustment: true,
      allowedEarningCodes: [
        "BONUS",
        "COMMISSION",
        "INCENTIVE",
        "PENDING_PAYMENT",
        "MANUAL_ADJUSTMENT",
        "OTHER_EARNING",
      ],
      allowedDeductionCodes: [
        "EMPLOYEE_LOAN",
        "SALARY_ADVANCE",
        "EQUIPMENT_DEDUCTION",
        "ABSENCE_DEDUCTION",
        "MANUAL_DEDUCTION",
        "OTHER_DEDUCTION",
      ],
    },

    roundingMode: "ROUND_2_DECIMALS",

    isActive: true,
    isDeleted: false,
    notes: payload.notes || "",
  };
};