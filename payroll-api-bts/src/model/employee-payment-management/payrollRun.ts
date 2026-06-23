import mongoose, { Schema, model, Types } from "mongoose";

export type PayrollRunStatus = "CLOSED" | "CANCELLED";

export type PayrollRunScopeMode =
  | "COMPANY"
  | "DEPARTMENT"
  | "JOB_POSITION"
  | "PROJECT"
  | "EMPLOYEES";

export interface IPayrollRunTotals {
  grossMonthly: number;
  grossPeriod: number;

  totalLegalDeductionsMonthly: number;
  totalLegalDeductionsPeriod: number;

  totalOtherDeductionsMonthly: number;
  totalOtherDeductionsPeriod: number;

  totalDeductionsMonthly: number;
  totalDeductionsPeriod: number;

  isrMonthly: number;
  isrPeriod: number;

  netMonthly: number;
  netPeriod: number;

  companyDisbursementPeriod?: number;
  employeeNetToDepositPeriod?: number;
  employeeLoanDeductionsPeriod?: number;
  thirdPartyPaymentsPeriod?: number;
}

export interface IPayrollRunPolicySnapshot {
  policyId?: Types.ObjectId | null;
  name: string;
  code: string;

  lateGraceEnabled: boolean;
  lateGraceMinutes: number;
  lateGraceMode: "FULL_GRACE" | "DEDUCT_AFTER_GRACE";

  deductLateArrivals: boolean;
  deductAbsences: boolean;

  rdFactorDiasMes: number;
  useGrossSalaryForDailyDiscount: boolean;

  requireConfirmedDaysDefault: boolean;
  allowIncompleteDaysOnClose: boolean;
  autoPaidLeaveNoDeduct: boolean;
}

export interface IPayrollRunSkippedEmployee {
  user?: Types.ObjectId | null;
  userId?: string;
  name: string;
  email?: string;
  departmentName?: string;
  jobPositionName?: string;
  projectName?: string;
  salaryType?: string;
  workedHoursPeriod?: number;
  paidHoursPeriod?: number;
  netPeriod?: number;
  status: "SKIPPED";
  reason: string;
  source: "SYSTEM" | "MANUAL";
  createdAt?: Date;
}

export interface IPayrollRunTerminationLoanPayment {
  pendingPayment: Types.ObjectId;
  termination?: Types.ObjectId | null;
  terminationPayment?: Types.ObjectId | null;
  loanRequest?: Types.ObjectId | null;
  employee?: Types.ObjectId | null;
  employeeName?: string;
  requestNumber?: string;
  productName?: string;
  amount: number;
  description?: string;
}

export interface IPayrollRun extends mongoose.Document {
  company: Types.ObjectId;

  periodStart: string;
  periodEnd: string;
  payDate: Date;

  requireConfirmedDays: boolean;

  filters?: {
    companyId?: Types.ObjectId | null;
    departmentId?: Types.ObjectId | null;
    jobPositionId?: Types.ObjectId | null;
    projectId?: Types.ObjectId | null;
    paymentScheduleId?: Types.ObjectId | null;
    scopeMode?: PayrollRunScopeMode;
    executionScopeMode?: PayrollRunScopeMode;
    wasManuallyAdjusted?: boolean;
    userIds?: Types.ObjectId[];
  };

  createdBy: Types.ObjectId;

  status: PayrollRunStatus;

  employeeCount: number;
  runKey: string;
  payrollFingerprint: string;

  totals: IPayrollRunTotals;

  notes?: string;

  isActive: boolean;
  isDeleted: boolean;

  emailStats: {
    requestedCount: number;
    createdCount: number;
    skippedCount: number;
    emailedCount: number;
    emailFailedCount: number;
  };

  skippedEmployees?: IPayrollRunSkippedEmployee[];
  terminationLoanPendingPayments?: IPayrollRunTerminationLoanPayment[];
  terminationLoanPendingPaymentsTotal?: number;
  terminationLoanPendingPaymentsCount?: number;

  bankAuthorizationNumber?: string | null;
  bankDepositedAt?: Date | null;
  bankDepositedBy?: Types.ObjectId | null;
  bankResponseFileName?: string | null;
  bankResponseFileMimeType?: string | null;
  bankResponseFileSize?: number;
  bankResponseFileContentBase64?: string | null;
  bankResponseUploadedAt?: Date | null;
  bankResponseUploadedBy?: Types.ObjectId | null;
  policySnapshot?: IPayrollRunPolicySnapshot;

  cancelledAt?: Date | null;
  cancelledBy?: Types.ObjectId | null;

  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const totalsSchema = new Schema<IPayrollRunTotals>(
  {
    grossMonthly: { type: Number, default: 0 },
    grossPeriod: { type: Number, default: 0 },

    totalLegalDeductionsMonthly: { type: Number, default: 0 },
    totalLegalDeductionsPeriod: { type: Number, default: 0 },

    totalOtherDeductionsMonthly: { type: Number, default: 0 },
    totalOtherDeductionsPeriod: { type: Number, default: 0 },

    totalDeductionsMonthly: { type: Number, default: 0 },
    totalDeductionsPeriod: { type: Number, default: 0 },

    isrMonthly: { type: Number, default: 0 },
    isrPeriod: { type: Number, default: 0 },

    netMonthly: { type: Number, default: 0 },
    netPeriod: { type: Number, default: 0 },

    companyDisbursementPeriod: { type: Number, default: 0 },
    employeeNetToDepositPeriod: { type: Number, default: 0 },
    employeeLoanDeductionsPeriod: { type: Number, default: 0 },
    thirdPartyPaymentsPeriod: { type: Number, default: 0 },
  },
  { _id: false },
);

const policySnapshotSchema = new Schema<IPayrollRunPolicySnapshot>(
  {
    policyId: {
      type: Schema.Types.ObjectId,
      ref: "PayrollPolicy",
      default: null,
    },

    name: { type: String, default: "Política por defecto" },
    code: { type: String, default: "DEFAULT_PAYROLL_POLICY" },

    lateGraceEnabled: { type: Boolean, default: true },
    lateGraceMinutes: { type: Number, default: 5 },
    lateGraceMode: {
      type: String,
      enum: ["FULL_GRACE", "DEDUCT_AFTER_GRACE"],
      default: "FULL_GRACE",
    },

    deductLateArrivals: { type: Boolean, default: true },
    deductAbsences: { type: Boolean, default: true },

    rdFactorDiasMes: { type: Number, default: 23.83 },
    useGrossSalaryForDailyDiscount: { type: Boolean, default: true },

    requireConfirmedDaysDefault: { type: Boolean, default: true },
    allowIncompleteDaysOnClose: { type: Boolean, default: false },
    autoPaidLeaveNoDeduct: { type: Boolean, default: true },
  },
  { _id: false },
);

const skippedEmployeeSchema = new Schema<IPayrollRunSkippedEmployee>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userId: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    departmentName: { type: String, default: "" },
    jobPositionName: { type: String, default: "" },
    projectName: { type: String, default: "" },
    salaryType: { type: String, default: "" },
    workedHoursPeriod: { type: Number, default: 0 },
    paidHoursPeriod: { type: Number, default: 0 },
    netPeriod: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["SKIPPED"],
      default: "SKIPPED",
    },
    reason: { type: String, default: "" },
    source: {
      type: String,
      enum: ["SYSTEM", "MANUAL"],
      default: "SYSTEM",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const terminationLoanPaymentSchema =
  new Schema<IPayrollRunTerminationLoanPayment>(
    {
      pendingPayment: {
        type: Schema.Types.ObjectId,
        ref: "TerminationLoanPayrollPendingPayment",
        required: true,
      },
      termination: {
        type: Schema.Types.ObjectId,
        ref: "EmployeeTermination",
        default: null,
      },
      terminationPayment: {
        type: Schema.Types.ObjectId,
        ref: "TerminationPayment",
        default: null,
      },
      loanRequest: {
        type: Schema.Types.ObjectId,
        ref: "EmployeeLoanRequest",
        default: null,
      },
      employee: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      employeeName: { type: String, default: "" },
      requestNumber: { type: String, default: "" },
      productName: { type: String, default: "" },
      amount: { type: Number, default: 0, min: 0 },
      description: { type: String, default: "" },
    },
    { _id: false },
  );

const payrollRunSchema = new Schema<IPayrollRun>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    periodStart: { type: String, required: true, index: true },
    periodEnd: { type: String, required: true, index: true },
    payDate: { type: Date, required: true, index: true },

    requireConfirmedDays: { type: Boolean, default: true },

    filters: {
      companyId: {
        type: Schema.Types.ObjectId,
        ref: "Company",
        default: null,
      },
      departmentId: {
        type: Schema.Types.ObjectId,
        ref: "Department",
        default: null,
      },
      jobPositionId: {
        type: Schema.Types.ObjectId,
        ref: "JobPosition",
        default: null,
      },
      projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        default: null,
      },
      paymentScheduleId: {
        type: Schema.Types.ObjectId,
        ref: "PaymentSchedule",
        default: null,
      },
      scopeMode: {
        type: String,
        enum: ["COMPANY", "DEPARTMENT", "JOB_POSITION", "PROJECT", "EMPLOYEES"],
        default: "EMPLOYEES",
      },
      executionScopeMode: {
        type: String,
        enum: ["COMPANY", "DEPARTMENT", "JOB_POSITION", "PROJECT", "EMPLOYEES"],
        default: "EMPLOYEES",
      },
      wasManuallyAdjusted: { type: Boolean, default: false },
      userIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },

    runKey: { type: String, required: true, index: true },
    payrollFingerprint: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["CLOSED", "CANCELLED"],
      default: "CLOSED",
      index: true,
    },

    employeeCount: { type: Number, default: 0 },

    totals: { type: totalsSchema, default: () => ({}) },
    policySnapshot: { type: policySnapshotSchema, default: () => ({}) },

    notes: { type: String },

    emailStats: {
      requestedCount: { type: Number, default: 0 },
      createdCount: { type: Number, default: 0 },
      skippedCount: { type: Number, default: 0 },
      emailedCount: { type: Number, default: 0 },
      emailFailedCount: { type: Number, default: 0 },
    },

    skippedEmployees: {
      type: [skippedEmployeeSchema],
      default: [],
    },

    terminationLoanPendingPayments: {
      type: [terminationLoanPaymentSchema],
      default: [],
    },

    terminationLoanPendingPaymentsTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    terminationLoanPendingPaymentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    bankAuthorizationNumber: { type: String, default: null },
    bankDepositedAt: { type: Date, default: null },
    bankDepositedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    bankResponseFileName: { type: String, default: null },
    bankResponseFileMimeType: { type: String, default: null },
    bankResponseFileSize: { type: Number, default: 0 },
    bankResponseFileContentBase64: { type: String, default: null },
    bankResponseUploadedAt: { type: Date, default: null },
    bankResponseUploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledAt: { type: Date, default: null },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

payrollRunSchema.index({
  company: 1,
  periodStart: 1,
  periodEnd: 1,
  status: 1,
  isDeleted: 1,
});

payrollRunSchema.index({ runKey: 1 });

payrollRunSchema.index(
  { payrollFingerprint: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      status: "CLOSED",
    },
  },
);

payrollRunSchema.index({
  company: 1,
  payDate: 1,
  status: 1,
  isDeleted: 1,
});

export default model<IPayrollRun>("PayrollRun", payrollRunSchema);
