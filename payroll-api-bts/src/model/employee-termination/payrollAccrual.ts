import mongoose, { Schema, model, Types } from "mongoose";

export type PayrollAccrualType =
  | "VACATION"
  | "CHRISTMAS_SALARY"
  | "BONUS"
  | "COMMISSION"
  | "OTHER";

export type PayrollAccrualStatus =
  | "OPEN"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED";

export type PayrollAccrualSource =
  | "PAYROLL_RUN"
  | "MANUAL"
  | "IMPORT"
  | "SYSTEM";

export const PAYROLL_ACCRUAL_MOVEMENT_TYPES = [
  "CHRISTMAS_ACCRUAL",
  "CHRISTMAS_ACCRUAL_REVERSAL",
  "CHRISTMAS_PAYMENT",
  "CHRISTMAS_TERMINATION_APPLIED",
  "CHRISTMAS_GUARANTEE_RESERVED",
  "CHRISTMAS_GUARANTEE_REDUCED",
  "CHRISTMAS_GUARANTEE_RELEASED",
  "LEGACY_OPENING",
  "MANUAL_ADJUSTMENT",
] as const;

export type PayrollAccrualMovementType =
  (typeof PAYROLL_ACCRUAL_MOVEMENT_TYPES)[number];

export interface IPayrollAccrual extends mongoose.Document {
  company: Types.ObjectId;
  employee: Types.ObjectId;

  type: PayrollAccrualType;

  /** Legacy CHRISTMAS_SALARY records without movementType are treated later as LEGACY_OPENING. */
  movementType?: PayrollAccrualMovementType | null;

  year: number;
  month?: number | null;

  periodStart: Date;
  periodEnd: Date;

  accruedAmount: number;
  paidAmount: number;
  pendingAmount: number;

  accruedDays: number;
  usedDays: number;
  paidDays: number;
  pendingDays: number;

  source: PayrollAccrualSource;

  payrollRun?: Types.ObjectId | null;
  payrollPayment?: Types.ObjectId | null;
  termination?: Types.ObjectId | null;
  loanRequest?: Types.ObjectId | null;
  guaranteeReservation?: Types.ObjectId | null;
  reversesAccrual?: Types.ObjectId | null;

  installmentNumber?: number | null;
  idempotencyKey?: string;

  ordinarySalaryBaseAmount?: number;
  accruedAmountDelta?: number;
  paidAmountDelta?: number;
  appliedToTerminationAmountDelta?: number;
  reservedGuaranteeAmountDelta?: number;

  calculationVersion?: number;
  effectiveAt?: Date | null;

  status: PayrollAccrualStatus;

  notes?: string;
  metadata?: Record<string, any>;

  lastCalculatedAt?: Date | null;

  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;

  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const payrollAccrualSchema = new Schema<IPayrollAccrual>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["VACATION", "CHRISTMAS_SALARY", "BONUS", "COMMISSION", "OTHER"],
      required: true,
      index: true,
    },

    movementType: {
      type: String,
      enum: PAYROLL_ACCRUAL_MOVEMENT_TYPES,
      default: null,
      index: true,
    },

    year: {
      type: Number,
      required: true,
      index: true,
    },

    month: {
      type: Number,
      default: null,
      min: 1,
      max: 12,
    },

    periodStart: {
      type: Date,
      required: true,
      index: true,
    },

    periodEnd: {
      type: Date,
      required: true,
      index: true,
    },

    accruedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    accruedDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    usedDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    pendingDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    source: {
      type: String,
      enum: ["PAYROLL_RUN", "MANUAL", "IMPORT", "SYSTEM"],
      default: "SYSTEM",
    },

    payrollRun: {
      type: Schema.Types.ObjectId,
      ref: "PayrollRun",
      default: null,
    },

    payrollPayment: {
      type: Schema.Types.ObjectId,
      ref: "PayrollPayment",
      default: null,
      index: true,
    },

    termination: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeTermination",
      default: null,
    },

    loanRequest: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeLoanRequest",
      default: null,
      index: true,
    },

    guaranteeReservation: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeLoanGuaranteeReservation",
      default: null,
      index: true,
    },

    reversesAccrual: {
      type: Schema.Types.ObjectId,
      ref: "PayrollAccrual",
      default: null,
    },

    installmentNumber: {
      type: Number,
      default: null,
      min: 1,
    },

    idempotencyKey: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    ordinarySalaryBaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    accruedAmountDelta: {
      type: Number,
      default: 0,
    },

    paidAmountDelta: {
      type: Number,
      default: 0,
    },

    appliedToTerminationAmountDelta: {
      type: Number,
      default: 0,
    },

    reservedGuaranteeAmountDelta: {
      type: Number,
      default: 0,
    },

    calculationVersion: {
      type: Number,
      default: 1,
      min: 1,
    },

    effectiveAt: {
      type: Date,
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["OPEN", "PARTIALLY_PAID", "PAID", "CANCELLED"],
      default: "OPEN",
      index: true,
    },

    notes: {
      type: String,
      default: "",
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    lastCalculatedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

payrollAccrualSchema.index({
  company: 1,
  employee: 1,
  type: 1,
  year: 1,
  month: 1,
});

payrollAccrualSchema.index({
  employee: 1,
  type: 1,
  status: 1,
  isDeleted: 1,
});

payrollAccrualSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      idempotencyKey: { $exists: true, $gt: "" },
    },
  },
);

payrollAccrualSchema.index({
  company: 1,
  employee: 1,
  type: 1,
  movementType: 1,
  year: 1,
  isDeleted: 1,
});

payrollAccrualSchema.index({
  payrollRun: 1,
  payrollPayment: 1,
  type: 1,
  movementType: 1,
  isDeleted: 1,
});

payrollAccrualSchema.index({
  loanRequest: 1,
  type: 1,
  movementType: 1,
  isDeleted: 1,
});

payrollAccrualSchema.index({
  termination: 1,
  type: 1,
  movementType: 1,
  isDeleted: 1,
});

export default model<IPayrollAccrual>("PayrollAccrual", payrollAccrualSchema);
