import mongoose, { Schema, model, Types } from "mongoose";

export type SalaryBaseMode =
  | "AVERAGE_LAST_12_MONTHS_ORDINARY"
  | "CURRENT_SALARY"
  | "LAST_SALARY"
  | "MANUAL";

export type SeveranceCalculationMode = "FIXED" | "PER_YEAR";

export type RoundingMode =
  | "NONE"
  | "ROUND_2_DECIMALS"
  | "ROUND_UP"
  | "ROUND_DOWN";

export type AccrualSource = "PAYROLL_ACCRUAL" | "PAYROLL_HISTORY" | "MANUAL";

export type ChristmasSalaryCalculationMode =
  | "ORDINARY_SALARY_EARNED_YEAR_TO_DATE_DIVIDED_BY_12"
  | "PAYROLL_ACCRUAL"
  | "MANUAL";

export type VacationCalculationMode =
  | "VACATION_MODULE"
  | "PAYROLL_ACCRUAL"
  | "MANUAL";

export type TerminationTypeCode =
  | "EMPLOYER_DESAHUCIO"
  | "EMPLOYEE_RESIGNATION"
  | "EMPLOYER_JUSTIFIED_DISMISSAL"
  | "EMPLOYER_UNJUSTIFIED_DISMISSAL"
  | "EMPLOYEE_JUSTIFIED_RESIGNATION"
  | "EMPLOYEE_UNJUSTIFIED_RESIGNATION"
  | "MUTUAL_AGREEMENT"
  | "CONTRACT_END"
  | "DEATH_OR_DISABILITY"
  | "COMPANY_CLOSURE"
  | "RETIREMENT"
  | "OTHER";

export const TERMINATION_TYPE_CODES: TerminationTypeCode[] = [
  "EMPLOYER_DESAHUCIO",
  "EMPLOYEE_RESIGNATION",
  "EMPLOYER_JUSTIFIED_DISMISSAL",
  "EMPLOYER_UNJUSTIFIED_DISMISSAL",
  "EMPLOYEE_JUSTIFIED_RESIGNATION",
  "EMPLOYEE_UNJUSTIFIED_RESIGNATION",
  "MUTUAL_AGREEMENT",
  "CONTRACT_END",
  "DEATH_OR_DISABILITY",
  "COMPANY_CLOSURE",
  "RETIREMENT",
  "OTHER",
];

export interface IPreNoticeBracket {
  fromMonths: number;
  toMonths?: number | null;
  days: number;
  label?: string;
}

export interface ISeveranceBracket {
  fromMonths: number;
  toMonths?: number | null;
  days: number;
  mode: SeveranceCalculationMode;
  label?: string;
}

export interface IChristmasSalaryRule {
  enabled: boolean;

  /**
   * Si está true, el sistema incluye regalía en la liquidación automáticamente
   * cuando el tipo de desvinculación lo permita.
   */
  defaultIncludeOnTermination: boolean;

  /**
   * Fórmula o fuente del cálculo.
   */
  calculationMode: ChristmasSalaryCalculationMode;

  /**
   * De dónde se toma el acumulado si ya existe en nómina.
   */
  accrualSource: AccrualSource;

  /**
   * Por defecto recomiendo 0.
   * Si la empresa decide no pagar regalía antes de cierto tiempo,
   * puede colocar 3 meses aquí.
   */
  minimumWorkedMonthsToPay: number;

  /**
   * Regla especial para período probatorio.
   * No lo quemes en código; déjalo auditable.
   */
  allowExcludeBeforeProbationEnds: boolean;

  probationMonths: number;

  /**
   * Permite que RRHH cambie manualmente si incluye o no la regalía.
   */
  allowManualOverride: boolean;

  notes?: string;
}

export interface IVacationRule {
  enabled: boolean;

  /**
   * Recomendado: usar tu módulo actual de vacaciones.
   */
  calculationMode: VacationCalculationMode;

  defaultIncludeOnTermination: boolean;
  allowManualOverride: boolean;

  notes?: string;
}

export interface ITerminationTypeRule {
  code: TerminationTypeCode;
  label: string;
  description?: string;

  includePendingSalary: boolean;
  includeSeverance: boolean;
  includePreNotice: boolean;
  includeVacation: boolean;
  includeChristmasSalary: boolean;
  includeEconomicAssistance: boolean;

  allowManualEarnings: boolean;
  allowManualDeductions: boolean;

  /**
   * Para casos donde el empleado renuncia sin dar preaviso.
   */
  deductPreNoticeIfEmployeeDidNotNotify: boolean;

  requiresReason: boolean;
  requiresDocument: boolean;
  requiresApproval: boolean;

  isActive: boolean;
}

export interface IManualAdjustmentRules {
  allowManualEarnings: boolean;
  allowManualDeductions: boolean;

  requireReasonForManualAdjustment: boolean;
  requireApprovalForManualAdjustment: boolean;

  allowedEarningCodes: string[];
  allowedDeductionCodes: string[];
}

export interface ILaborTerminationPolicyRD extends mongoose.Document {
  company?: Types.ObjectId | null;

  country: "DO";
  year: number;
  version: number;

  effectiveFrom: Date;
  effectiveTo?: Date | null;

  salaryBaseMode: SalaryBaseMode;
  dailySalaryDivisor: number;

  preNoticeBrackets: IPreNoticeBracket[];
  severanceBrackets: ISeveranceBracket[];

  christmasSalaryRule: IChristmasSalaryRule;
  vacationRule: IVacationRule;

  terminationTypeRules: ITerminationTypeRule[];
  manualAdjustmentRules: IManualAdjustmentRules;

  roundingMode: RoundingMode;

  isActive: boolean;
  isDeleted: boolean;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const preNoticeBracketSchema = new Schema<IPreNoticeBracket>(
  {
    fromMonths: { type: Number, required: true, min: 0 },
    toMonths: { type: Number, default: null },
    days: { type: Number, required: true, min: 0 },
    label: { type: String, default: "" },
  },
  { _id: false },
);

const severanceBracketSchema = new Schema<ISeveranceBracket>(
  {
    fromMonths: { type: Number, required: true, min: 0 },
    toMonths: { type: Number, default: null },
    days: { type: Number, required: true, min: 0 },
    mode: {
      type: String,
      enum: ["FIXED", "PER_YEAR"],
      required: true,
    },
    label: { type: String, default: "" },
  },
  { _id: false },
);

const christmasSalaryRuleSchema = new Schema<IChristmasSalaryRule>(
  {
    enabled: { type: Boolean, default: true },

    defaultIncludeOnTermination: { type: Boolean, default: true },

    calculationMode: {
      type: String,
      enum: [
        "ORDINARY_SALARY_EARNED_YEAR_TO_DATE_DIVIDED_BY_12",
        "PAYROLL_ACCRUAL",
        "MANUAL",
      ],
      default: "ORDINARY_SALARY_EARNED_YEAR_TO_DATE_DIVIDED_BY_12",
    },

    accrualSource: {
      type: String,
      enum: ["PAYROLL_ACCRUAL", "PAYROLL_HISTORY", "MANUAL"],
      default: "PAYROLL_ACCRUAL",
    },

    minimumWorkedMonthsToPay: {
      type: Number,
      default: 0,
      min: 0,
    },

    allowExcludeBeforeProbationEnds: {
      type: Boolean,
      default: false,
    },

    probationMonths: {
      type: Number,
      default: 3,
      min: 0,
    },

    allowManualOverride: {
      type: Boolean,
      default: true,
    },

    notes: { type: String, default: "" },
  },
  { _id: false },
);

const vacationRuleSchema = new Schema<IVacationRule>(
  {
    enabled: { type: Boolean, default: true },

    calculationMode: {
      type: String,
      enum: ["VACATION_MODULE", "PAYROLL_ACCRUAL", "MANUAL"],
      default: "VACATION_MODULE",
    },

    defaultIncludeOnTermination: {
      type: Boolean,
      default: true,
    },

    allowManualOverride: {
      type: Boolean,
      default: true,
    },

    notes: { type: String, default: "" },
  },
  { _id: false },
);

const terminationTypeRuleSchema = new Schema<ITerminationTypeRule>(
  {
    code: {
      type: String,
      enum: TERMINATION_TYPE_CODES,
      required: true,
    },

    label: { type: String, required: true },
    description: { type: String, default: "" },

    includePendingSalary: { type: Boolean, default: true },
    includeSeverance: { type: Boolean, default: false },
    includePreNotice: { type: Boolean, default: false },
    includeVacation: { type: Boolean, default: true },
    includeChristmasSalary: { type: Boolean, default: true },
    includeEconomicAssistance: { type: Boolean, default: false },

    allowManualEarnings: { type: Boolean, default: true },
    allowManualDeductions: { type: Boolean, default: true },

    deductPreNoticeIfEmployeeDidNotNotify: { type: Boolean, default: false },

    requiresReason: { type: Boolean, default: false },
    requiresDocument: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: true },

    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const manualAdjustmentRulesSchema = new Schema<IManualAdjustmentRules>(
  {
    allowManualEarnings: { type: Boolean, default: true },
    allowManualDeductions: { type: Boolean, default: true },

    requireReasonForManualAdjustment: { type: Boolean, default: true },
    requireApprovalForManualAdjustment: { type: Boolean, default: true },

    allowedEarningCodes: {
      type: [String],
      default: [
        "BONUS",
        "COMMISSION",
        "INCENTIVE",
        "PENDING_PAYMENT",
        "MANUAL_ADJUSTMENT",
        "OTHER_EARNING",
      ],
    },

    allowedDeductionCodes: {
      type: [String],
      default: [
        "EMPLOYEE_LOAN",
        "SALARY_ADVANCE",
        "EQUIPMENT_DEDUCTION",
        "ABSENCE_DEDUCTION",
        "MANUAL_DEDUCTION",
        "OTHER_DEDUCTION",
      ],
    },
  },
  { _id: false },
);

const laborTerminationPolicyRDSchema = new Schema<ILaborTerminationPolicyRD>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    country: {
      type: String,
      enum: ["DO"],
      default: "DO",
      required: true,
    },

    year: {
      type: Number,
      required: true,
      index: true,
    },

    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    effectiveFrom: {
      type: Date,
      required: true,
    },

    effectiveTo: {
      type: Date,
      default: null,
    },

    salaryBaseMode: {
      type: String,
      enum: [
        "AVERAGE_LAST_12_MONTHS_ORDINARY",
        "CURRENT_SALARY",
        "LAST_SALARY",
        "MANUAL",
      ],
      default: "AVERAGE_LAST_12_MONTHS_ORDINARY",
    },

    dailySalaryDivisor: {
      type: Number,
      default: 23.83,
      min: 1,
    },

    preNoticeBrackets: {
      type: [preNoticeBracketSchema],
      default: [],
    },

    severanceBrackets: {
      type: [severanceBracketSchema],
      default: [],
    },

    christmasSalaryRule: {
      type: christmasSalaryRuleSchema,
      default: () => ({}),
    },

    vacationRule: {
      type: vacationRuleSchema,
      default: () => ({}),
    },

    terminationTypeRules: {
      type: [terminationTypeRuleSchema],
      default: [],
    },

    manualAdjustmentRules: {
      type: manualAdjustmentRulesSchema,
      default: () => ({}),
    },

    roundingMode: {
      type: String,
      enum: ["NONE", "ROUND_2_DECIMALS", "ROUND_UP", "ROUND_DOWN"],
      default: "ROUND_2_DECIMALS",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

laborTerminationPolicyRDSchema.index({
  company: 1,
  year: 1,
  version: -1,
});

laborTerminationPolicyRDSchema.index({
  company: 1,
  isActive: 1,
  isDeleted: 1,
  effectiveFrom: -1,
});

export default model<ILaborTerminationPolicyRD>(
  "LaborTerminationPolicyRD",
  laborTerminationPolicyRDSchema,
);