// src/models/employee-termination/employeeTermination.ts

import mongoose, { Schema, model, Types } from "mongoose";
import {
  SalaryBaseMode,
  TerminationTypeCode,
  TERMINATION_TYPE_CODES,
} from "./laborTerminationPolicyRD";

export type EmployeeTerminationStatus =
  | "DRAFT"
  | "CALCULATED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PAID"
  | "CANCELLED";

export type TerminationLineType = "EARNING" | "DEDUCTION";

export type TerminationLineSource = "AUTOMATIC" | "MANUAL";

export type TerminationLineCode =
  | "PENDING_SALARY"
  | "PRE_NOTICE"
  | "SEVERANCE"
  | "VACATION"
  | "CHRISTMAS_SALARY"
  | "ECONOMIC_ASSISTANCE"
  | "BONUS"
  | "COMMISSION"
  | "INCENTIVE"
  | "PENDING_PAYMENT"
  | "EMPLOYEE_LOAN"
  | "SALARY_ADVANCE"
  | "EQUIPMENT_DEDUCTION"
  | "ABSENCE_DEDUCTION"
  | "MANUAL_ADJUSTMENT"
  | "MANUAL_DEDUCTION"
  | "OTHER_EARNING"
  | "OTHER_DEDUCTION";

export type TerminationLoanCalculationSource =
  | "AMORTIZATION_SCHEDULE"
  | "LOAN_QUOTE_SNAPSHOT"
  | "APPROVED_AMOUNT";

export interface ITerminationAttachment {
  name: string;
  url: string;
  type: string;
  uploadedAt: Date;
  uploadedBy?: Types.ObjectId | null;
}

export interface ITerminationCalculationLine {
  code: TerminationLineCode;
  label: string;

  type: TerminationLineType;
  source: TerminationLineSource;

  amount: number;

  days?: number;
  dailySalary?: number;
  baseSalary?: number;
  rate?: number;

  taxable: boolean;
  affectsNetTotal: boolean;

  requiresApproval: boolean;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;

  reason?: string;
  notes?: string;

  metadata?: Record<string, any>;

  createdBy?: Types.ObjectId | null;
  createdAt: Date;
}

export interface ITerminationLoanSnapshotItem {
  loanRequest: Types.ObjectId;

  requestNumber: string;
  status: string;

  providerType: string;
  productCode: string;
  productName: string;

  approvedAmount: number;
  guaranteedDays: number;

  principalOutstanding: number;
  interestOutstanding: number;
  totalOutstanding: number;

  amountApplied: number;
  remainingOutstanding: number;

  pendingInstallments: number;

  calculationSource: TerminationLoanCalculationSource;

  metadata?: Record<string, any>;
}

export interface ITerminationLoanSnapshot {
  hasActiveLoans: boolean;

  totalLoans: number;
  totalPendingInstallments: number;
  totalGuaranteedDays: number;

  totalPrincipalOutstanding: number;
  totalInterestOutstanding: number;
  totalOutstanding: number;

  totalDeducted: number;
  remainingOutstanding: number;

  calculatedAt?: Date | null;

  loans: ITerminationLoanSnapshotItem[];
}

export interface IChristmasSalarySettlementSnapshot {
  year: number;
  confirmedChristmasSalaryAmount: number;
  projectedChristmasSalaryFromUnpostedEarnings: number;
  actualChristmasSalaryTerminationAmount: number;
  paidChristmasSalaryAmountBefore: number;
  appliedToTerminationAmountBefore: number;
  appliedToTerminationAmountAfter: number;
  pendingChristmasSalaryPayableBefore: number;
  pendingChristmasSalaryPayableAfter: number;
  movement?: Types.ObjectId | null;
  idempotencyKey?: string;
  createdAt?: Date | null;
  metadata?: Record<string, any>;
}

export interface IEmployeeTermination extends mongoose.Document {
  company: Types.ObjectId;
  employee: Types.ObjectId;

  policy: Types.ObjectId;
  policyVersion: number;

  terminationType: TerminationTypeCode;
  reason?: string;

  hiringDate: Date;
  terminationDate: Date;

  noticeGiven: boolean;
  noticeDate?: Date | null;

  status: EmployeeTerminationStatus;

  includeOverrides: {
    includePendingSalary?: boolean | null;
    includeSeverance?: boolean | null;
    includePreNotice?: boolean | null;
    includeVacation?: boolean | null;
    includeChristmasSalary?: boolean | null;
    includeEconomicAssistance?: boolean | null;
    overrideReason?: string;
  };

  employeeSnapshot: {
    fullName: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    code?: string;
    department?: string;
    jobPosition?: string;
    project?: string;
    company?: string;
  };

  salarySnapshot: {
    salaryBaseMode: SalaryBaseMode;
    currentSalary: number;
    lastSalary: number;
    averageOrdinarySalary: number;
    dailySalary: number;
    dailySalaryDivisor: number;
    hourlyRate?: number;
    paymentSchedule?: string;
    salaryType?: string;
  };

  senioritySnapshot: {
    years: number;
    months: number;
    days: number;
    totalMonths: number;
    totalDays: number;
    text: string;
  };

  loanSnapshot: ITerminationLoanSnapshot;

  christmasSalarySettlementSnapshot?: IChristmasSalarySettlementSnapshot | null;

  calculation: {
    automaticIncome: number;
    manualIncome: number;
    totalIncome: number;

    automaticDeductions: number;
    manualDeductions: number;
    totalDeductions: number;

    netTotal: number;

    lines: ITerminationCalculationLine[];

    calculatedAt?: Date | null;
    calculatedBy?: Types.ObjectId | null;
  };

  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;

  paidAt?: Date | null;
  payrollRun?: Types.ObjectId | null;

  cancelledBy?: Types.ObjectId | null;
  cancelledAt?: Date | null;
  cancellationReason?: string;

  attachments: ITerminationAttachment[];

  notes?: string;

  isDeleted: boolean;

  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const terminationAttachmentSchema = new Schema<ITerminationAttachment>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { _id: true },
);

const terminationCalculationLineSchema =
  new Schema<ITerminationCalculationLine>(
    {
      code: {
        type: String,
        enum: [
          "PENDING_SALARY",
          "PRE_NOTICE",
          "SEVERANCE",
          "VACATION",
          "CHRISTMAS_SALARY",
          "ECONOMIC_ASSISTANCE",
          "BONUS",
          "COMMISSION",
          "INCENTIVE",
          "PENDING_PAYMENT",
          "EMPLOYEE_LOAN",
          "SALARY_ADVANCE",
          "EQUIPMENT_DEDUCTION",
          "ABSENCE_DEDUCTION",
          "MANUAL_ADJUSTMENT",
          "MANUAL_DEDUCTION",
          "OTHER_EARNING",
          "OTHER_DEDUCTION",
        ],
        required: true,
      },

      label: { type: String, required: true },

      type: {
        type: String,
        enum: ["EARNING", "DEDUCTION"],
        required: true,
      },

      source: {
        type: String,
        enum: ["AUTOMATIC", "MANUAL"],
        required: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      days: { type: Number, default: 0 },
      dailySalary: { type: Number, default: 0 },
      baseSalary: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },

      taxable: { type: Boolean, default: false },
      affectsNetTotal: { type: Boolean, default: true },

      requiresApproval: { type: Boolean, default: false },

      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      approvedAt: { type: Date, default: null },

      reason: { type: String, default: "" },
      notes: { type: String, default: "" },

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    { _id: true },
  );


const terminationLoanSnapshotItemSchema =
  new Schema<ITerminationLoanSnapshotItem>(
    {
      loanRequest: {
        type: Schema.Types.ObjectId,
        ref: "EmployeeLoanRequest",
        required: true,
      },

      requestNumber: {
        type: String,
        default: "",
        trim: true,
      },

      status: {
        type: String,
        default: "",
        trim: true,
      },

      providerType: {
        type: String,
        default: "",
        trim: true,
      },

      productCode: {
        type: String,
        default: "",
        trim: true,
      },

      productName: {
        type: String,
        default: "",
        trim: true,
      },

      approvedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      guaranteedDays: {
        type: Number,
        default: 0,
        min: 0,
      },

      principalOutstanding: {
        type: Number,
        default: 0,
        min: 0,
      },

      interestOutstanding: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalOutstanding: {
        type: Number,
        default: 0,
        min: 0,
      },

      amountApplied: {
        type: Number,
        default: 0,
        min: 0,
      },

      remainingOutstanding: {
        type: Number,
        default: 0,
        min: 0,
      },

      pendingInstallments: {
        type: Number,
        default: 0,
        min: 0,
      },

      calculationSource: {
        type: String,
        enum: [
          "AMORTIZATION_SCHEDULE",
          "LOAN_QUOTE_SNAPSHOT",
          "APPROVED_AMOUNT",
        ],
        default: "AMORTIZATION_SCHEDULE",
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    {
      _id: false,
    },
  );

const terminationLoanSnapshotSchema = new Schema<ITerminationLoanSnapshot>(
  {
    hasActiveLoans: {
      type: Boolean,
      default: false,
    },

    totalLoans: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPendingInstallments: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalGuaranteedDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPrincipalOutstanding: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalInterestOutstanding: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalOutstanding: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalDeducted: {
      type: Number,
      default: 0,
      min: 0,
    },

    remainingOutstanding: {
      type: Number,
      default: 0,
      min: 0,
    },

    calculatedAt: {
      type: Date,
      default: null,
    },

    loans: {
      type: [terminationLoanSnapshotItemSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const christmasSalarySettlementSnapshotSchema =
  new Schema<IChristmasSalarySettlementSnapshot>(
    {
      year: { type: Number, required: true },
      confirmedChristmasSalaryAmount: { type: Number, default: 0, min: 0 },
      projectedChristmasSalaryFromUnpostedEarnings: {
        type: Number,
        default: 0,
        min: 0,
      },
      actualChristmasSalaryTerminationAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      paidChristmasSalaryAmountBefore: { type: Number, default: 0, min: 0 },
      appliedToTerminationAmountBefore: { type: Number, default: 0, min: 0 },
      appliedToTerminationAmountAfter: { type: Number, default: 0, min: 0 },
      pendingChristmasSalaryPayableBefore: { type: Number, default: 0, min: 0 },
      pendingChristmasSalaryPayableAfter: { type: Number, default: 0, min: 0 },
      movement: {
        type: Schema.Types.ObjectId,
        ref: "PayrollAccrual",
        default: null,
      },
      idempotencyKey: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now },
      metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { _id: false },
  );

const employeeTerminationSchema = new Schema<IEmployeeTermination>(
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

    policy: {
      type: Schema.Types.ObjectId,
      ref: "LaborTerminationPolicyRD",
      required: true,
    },

    policyVersion: {
      type: Number,
      required: true,
      min: 1,
    },

    terminationType: {
      type: String,
      enum: TERMINATION_TYPE_CODES,
      required: true,
      index: true,
    },

    reason: {
      type: String,
      default: "",
    },

    hiringDate: {
      type: Date,
      required: true,
    },

    terminationDate: {
      type: Date,
      required: true,
      index: true,
    },

    noticeGiven: {
      type: Boolean,
      default: false,
    },

    noticeDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "CALCULATED",
        "PENDING_APPROVAL",
        "APPROVED",
        "PAID",
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true,
    },

    includeOverrides: {
      includePendingSalary: { type: Boolean, default: null },
      includeSeverance: { type: Boolean, default: null },
      includePreNotice: { type: Boolean, default: null },
      includeVacation: { type: Boolean, default: null },
      includeChristmasSalary: { type: Boolean, default: null },
      includeEconomicAssistance: { type: Boolean, default: null },
      overrideReason: { type: String, default: "" },
    },

    employeeSnapshot: {
      fullName: { type: String, required: true },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      idNumber: { type: String, default: "" },
      code: { type: String, default: "" },
      department: { type: String, default: "" },
      jobPosition: { type: String, default: "" },
      project: { type: String, default: "" },
      company: { type: String, default: "" },
    },

    salarySnapshot: {
      salaryBaseMode: {
        type: String,
        enum: [
          "AVERAGE_LAST_12_MONTHS_ORDINARY",
          "CURRENT_SALARY",
          "LAST_SALARY",
          "MANUAL",
        ],
        required: true,
      },

      currentSalary: { type: Number, default: 0 },
      lastSalary: { type: Number, default: 0 },
      averageOrdinarySalary: { type: Number, default: 0 },
      dailySalary: { type: Number, default: 0 },
      dailySalaryDivisor: { type: Number, default: 23.83 },

      hourlyRate: { type: Number, default: 0 },
      paymentSchedule: { type: String, default: "" },
      salaryType: { type: String, default: "" },
    },

    senioritySnapshot: {
      years: { type: Number, default: 0 },
      months: { type: Number, default: 0 },
      days: { type: Number, default: 0 },
      totalMonths: { type: Number, default: 0 },
      totalDays: { type: Number, default: 0 },
      text: { type: String, default: "" },
    },

    loanSnapshot: {
      type: terminationLoanSnapshotSchema,
      default: () => ({
        hasActiveLoans: false,

        totalLoans: 0,
        totalPendingInstallments: 0,
        totalGuaranteedDays: 0,

        totalPrincipalOutstanding: 0,
        totalInterestOutstanding: 0,
        totalOutstanding: 0,

        totalDeducted: 0,
        remainingOutstanding: 0,

        calculatedAt: null,
        loans: [],
      }),
    },

    christmasSalarySettlementSnapshot: {
      type: christmasSalarySettlementSnapshotSchema,
      default: null,
    },

    calculation: {
      automaticIncome: { type: Number, default: 0 },
      manualIncome: { type: Number, default: 0 },
      totalIncome: { type: Number, default: 0 },

      automaticDeductions: { type: Number, default: 0 },
      manualDeductions: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },

      netTotal: { type: Number, default: 0 },

      lines: {
        type: [terminationCalculationLineSchema],
        default: [],
      },

      calculatedAt: { type: Date, default: null },

      calculatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    payrollRun: {
      type: Schema.Types.ObjectId,
      ref: "PayrollRun",
      default: null,
    },

    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
    },

    attachments: {
      type: [terminationAttachmentSchema],
      default: [],
    },

    notes: {
      type: String,
      default: "",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
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
  },
  { timestamps: true },
);

employeeTerminationSchema.index({
  company: 1,
  employee: 1,
  terminationDate: -1,
});

employeeTerminationSchema.index({
  company: 1,
  status: 1,
  isDeleted: 1,
});

export default model<IEmployeeTermination>(
  "EmployeeTermination",
  employeeTerminationSchema,
);
