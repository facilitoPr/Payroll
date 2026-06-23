import { Schema, model, Document } from "mongoose";

export const EMPLOYEE_LOAN_INTEREST_RATE_TYPE = [
  "ANNUAL",
  "MONTHLY",
  "FIXED",
] as const;

export const EMPLOYEE_LOAN_PAYMENT_FREQUENCY = [
  "WEEKLY",
  "BIWEEKLY",
  "SEMIMONTHLY",
  "MONTHLY",
] as const;

export const EMPLOYEE_LOAN_ACCOUNT_TYPES = [
  "CHECKING",
  "SAVINGS",
  "BUSINESS",
  "OTHER",
] as const;

export const EMPLOYEE_LOAN_VACATION_DAY_VALUE_MODE = [
  "DAILY_SALARY",
  "CUSTOM_AMOUNT",
  "NONE",
] as const;

export const EMPLOYEE_LOAN_GUARANTEE_SOURCE = [
  "VACATION_DAYS",
  "CHRISTMAS_SALARY",
] as const;

export const EMPLOYEE_LOAN_GUARANTEE_COVERAGE_BASIS = [
  "OUTSTANDING_BALANCE",
  "OUTSTANDING_PRINCIPAL",
] as const;

export type LoanInterestRateType =
  (typeof EMPLOYEE_LOAN_INTEREST_RATE_TYPE)[number];

export type LoanPaymentFrequency =
  (typeof EMPLOYEE_LOAN_PAYMENT_FREQUENCY)[number];

export type LoanAccountType = (typeof EMPLOYEE_LOAN_ACCOUNT_TYPES)[number];

export type EmployeeLoanVacationDayValueMode =
  (typeof EMPLOYEE_LOAN_VACATION_DAY_VALUE_MODE)[number];

export type EmployeeLoanGuaranteeSource =
  (typeof EMPLOYEE_LOAN_GUARANTEE_SOURCE)[number];

export type EmployeeLoanGuaranteeCoverageBasis =
  (typeof EMPLOYEE_LOAN_GUARANTEE_COVERAGE_BASIS)[number];

export const DEFAULT_LEGACY_EMPLOYEE_LOAN_GUARANTEE_SOURCE: EmployeeLoanGuaranteeSource =
  "VACATION_DAYS";

export const DEFAULT_NEW_EMPLOYEE_LOAN_GUARANTEE_SOURCE: EmployeeLoanGuaranteeSource =
  "CHRISTMAS_SALARY";

export const resolveEmployeeLoanGuaranteeSource = (
  productConfig?: { loanGuaranteeSource?: EmployeeLoanGuaranteeSource | null } | null,
): EmployeeLoanGuaranteeSource =>
  productConfig?.loanGuaranteeSource ||
  DEFAULT_LEGACY_EMPLOYEE_LOAN_GUARANTEE_SOURCE;

const isValidMonthList = (value: number[]) => {
  if (!Array.isArray(value)) return false;

  const normalized = value.map((item) => Number(item));
  const unique = new Set(normalized);

  return (
    unique.size === normalized.length &&
    normalized.every(
      (month) => Number.isInteger(month) && month >= 1 && month <= 12,
    )
  );
};

export interface IEmployeeLoanProductConfig extends Document {
  /** Nombre visible de la configuración o producto de préstamo. */
  name: string;

  /** Código interno único del producto. Ej: EMPLOYEE_LOAN_STANDARD. */
  code: string;

  /** Descripción interna del producto o reglas. */
  description?: string;

  /** Monto mínimo que se puede solicitar. */
  minLoanAmount: number;

  /** Monto máximo absoluto que el sistema principal permite prestar. */
  maxLoanAmount: number;

  /** Cantidad mínima de cuotas permitidas. */
  minInstallments: number;

  /** Cantidad máxima de cuotas permitidas. */
  maxInstallments: number;

  /** Tasa de interés del préstamo. */
  interestRate: number;

  /** Tipo de tasa: ANNUAL, MONTHLY o FIXED. */
  interestRateType: LoanInterestRateType;

  /** Frecuencia base para los pagos. */
  defaultPaymentFrequency: LoanPaymentFrequency;

  /** Indica si el interés se cobra distribuido en cada cuota. */
  distributeInterestInInstallments: boolean;

  /** Indica si el capital se amortiza en cada cuota. */
  amortizePrincipal: boolean;

  /** Fuente de garantia usada por nuevas solicitudes de este producto. */
  loanGuaranteeSource?: EmployeeLoanGuaranteeSource;

  /** Habilita reglas de garantia por salario de Navidad. */
  christmasSalaryGuaranteeEnabled?: boolean;

  /** Porcentaje maximo del saldo disponible de doble sueldo utilizable. */
  maxChristmasSalaryGuaranteePercent?: number;

  /** Monto minimo acumulado requerido para solicitar con doble sueldo. */
  minimumChristmasSalaryAccumulatedAmount?: number;

  /** Meses donde no se aceptan nuevas solicitudes. */
  blockedLoanRequestMonths?: number[];

  /** Meses donde no deben caer cuotas nuevas. */
  blockedInstallmentMonths?: number[];

  /** Exige saldar antes de meses protegidos. */
  requireLoanSettlementBeforeProtectedMonths?: boolean;

  /** Base que cubre la garantia monetaria. */
  guaranteeCoverageBasis?: EmployeeLoanGuaranteeCoverageBasis;

  /** Cantidad mínima de días disponibles requeridos para solicitar. */
  minimumVacationDaysRequired: number;

  /** Máximo porcentaje de días disponibles que se pueden usar como garantía. */
  maxVacationDaysGuaranteePercent: number;
  maxVacationGuaranteeDays: number;

  /** Forma de valorar cada día de vacaciones. */
  vacationDayValueMode: EmployeeLoanVacationDayValueMode;

  /** Valor fijo por día si vacationDayValueMode es CUSTOM_AMOUNT. */
  customVacationDayAmount?: number;

  /** Permite usar todos los días de vacaciones disponibles como garantía. */
  allowUseAllVacationDays: boolean;

  /** Permite solicitar préstamo sin garantía de vacaciones. */
  allowWithoutVacationGuarantee: boolean;

  /** Código del producto o programa para integración externa. */
  externalProductCode?: string;

  /** Banco donde se depositarán los intereses del préstamo. */
  interestBankName: string;

  /** Código del banco, si aplica. */
  interestBankCode: string;

  /** Número de cuenta donde se depositarán los intereses. */
  interestAccountNumber: string;

  /** Tipo de cuenta bancaria. */
  interestAccountType: LoanAccountType;

  /** Moneda de la cuenta. */
  interestCurrency: string;

  /** Nombre del beneficiario de la cuenta. */
  interestBeneficiaryName: string;

  /** Documento/RNC/Cédula del beneficiario. */
  interestBeneficiaryDocument: string;

  /** Nota interna sobre la cuenta bancaria o instrucciones de pago. */
  interestPaymentInstructions?: string;

  /** Indica si esta configuración es la predeterminada. */
  isDefault: boolean;

  /** Indica si esta configuración está activa. */
  isActive: boolean;

  /** Soft delete. */
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const employeeLoanProductConfigSchema = new Schema<IEmployeeLoanProductConfig>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    minLoanAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    maxLoanAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    minInstallments: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    maxInstallments: {
      type: Number,
      required: true,
      default: 12,
      min: 1,
    },

    interestRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    interestRateType: {
      type: String,
      enum: EMPLOYEE_LOAN_INTEREST_RATE_TYPE,
      required: true,
      default: "ANNUAL",
      index: true,
    },

    defaultPaymentFrequency: {
      type: String,
      enum: EMPLOYEE_LOAN_PAYMENT_FREQUENCY,
      required: true,
      default: "BIWEEKLY",
    },

    distributeInterestInInstallments: {
      type: Boolean,
      default: true,
    },

    amortizePrincipal: {
      type: Boolean,
      default: true,
    },

    loanGuaranteeSource: {
      type: String,
      enum: EMPLOYEE_LOAN_GUARANTEE_SOURCE,
      default: DEFAULT_NEW_EMPLOYEE_LOAN_GUARANTEE_SOURCE,
      required: true,
      index: true,
    },

    christmasSalaryGuaranteeEnabled: {
      type: Boolean,
      default: true,
    },

    maxChristmasSalaryGuaranteePercent: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    minimumChristmasSalaryAccumulatedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    blockedLoanRequestMonths: {
      type: [Number],
      default: [1, 12],
      validate: {
        validator: isValidMonthList,
        message: "Los meses bloqueados para solicitudes deben estar entre 1 y 12 sin duplicados.",
      },
    },

    blockedInstallmentMonths: {
      type: [Number],
      default: [12],
      validate: {
        validator: isValidMonthList,
        message: "Los meses bloqueados para cuotas deben estar entre 1 y 12 sin duplicados.",
      },
    },

    requireLoanSettlementBeforeProtectedMonths: {
      type: Boolean,
      default: true,
    },

    guaranteeCoverageBasis: {
      type: String,
      enum: EMPLOYEE_LOAN_GUARANTEE_COVERAGE_BASIS,
      default: "OUTSTANDING_BALANCE",
    },

    minimumVacationDaysRequired: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },

    maxVacationDaysGuaranteePercent: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
      max: 100,
    },

    maxVacationGuaranteeDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message:
          "La cantidad máxima de días de garantía debe ser un número entero.",
      },
    },

    vacationDayValueMode: {
      type: String,
      enum: EMPLOYEE_LOAN_VACATION_DAY_VALUE_MODE,
      required: true,
      default: "DAILY_SALARY",
    },

    customVacationDayAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    allowUseAllVacationDays: {
      type: Boolean,
      default: false,
    },

    allowWithoutVacationGuarantee: {
      type: Boolean,
      default: false,
    },

    externalProductCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    interestBankName: {
      type: String,
      required: true,
      trim: true,
    },

    interestBankCode: {
      type: String,
      default: "",
      trim: true,
    },

    interestAccountNumber: {
      type: String,
      required: true,
      trim: true,
    },

    interestAccountType: {
      type: String,
      enum: EMPLOYEE_LOAN_ACCOUNT_TYPES,
      required: true,
      default: "SAVINGS",
    },

    interestCurrency: {
      type: String,
      required: true,
      default: "DOP",
      trim: true,
      uppercase: true,
    },

    interestBeneficiaryName: {
      type: String,
      required: true,
      trim: true,
    },

    interestBeneficiaryDocument: {
      type: String,
      default: "",
      trim: true,
    },

    interestPaymentInstructions: {
      type: String,
      default: "",
      trim: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
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
  },
  { timestamps: true },
);

employeeLoanProductConfigSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

employeeLoanProductConfigSchema.index({
  isDefault: 1,
  isActive: 1,
  isDeleted: 1,
});

export default model<IEmployeeLoanProductConfig>(
  "EmployeeLoanProductConfig",
  employeeLoanProductConfigSchema,
);