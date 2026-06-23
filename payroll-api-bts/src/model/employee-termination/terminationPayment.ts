import mongoose, { Schema, model, Types } from "mongoose";

export type TerminationPaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CHECK"
  | "PAYROLL"
  | "OTHER";

export type TerminationPaymentStatus = "PENDING" | "PAID" | "CANCELLED";

export interface ITerminationPayment extends mongoose.Document {
  company: Types.ObjectId;
  employee: Types.ObjectId;
  termination: Types.ObjectId;

  amount: number;
  paymentDate: Date;

  paymentMethod: TerminationPaymentMethod;
  status: TerminationPaymentStatus;

  referenceNumber?: string;
  bankAuthorizationNumber?: string;
  bankFileName?: string;
  bankFileContent?: string;
  bankFileSha256?: string;
  bankFileGeneratedAt?: Date | null;
  bankFileGeneratedBy?: Types.ObjectId | null;
  bankFileHeaderSequence?: string;
  bankFileWarnings?: string[];
  bankFileTotals?: {
    countCR: number;
    totalCR: number;
    countDB: number;
    totalDB: number;
  };
  loanPayrollPendingCount?: number;
  loanPayrollPendingTotal?: number;
  bankOverride?: Record<string, any>;

  notes?: string;

  createdBy?: Types.ObjectId | null;
  cancelledBy?: Types.ObjectId | null;
  cancelledAt?: Date | null;
  cancellationReason?: string;

  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const terminationPaymentSchema = new Schema<ITerminationPayment>(
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

    termination: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeTermination",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentDate: {
      type: Date,
      required: true,
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "CHECK", "PAYROLL", "OTHER"],
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED"],
      default: "PAID",
      index: true,
    },

    referenceNumber: {
      type: String,
      default: "",
    },

    bankAuthorizationNumber: {
      type: String,
      default: "",
    },

    bankFileName: {
      type: String,
      default: "",
    },

    bankFileContent: {
      type: String,
      default: "",
    },

    bankFileSha256: {
      type: String,
      default: "",
    },

    bankFileGeneratedAt: {
      type: Date,
      default: null,
    },

    bankFileGeneratedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    bankFileHeaderSequence: {
      type: String,
      default: "",
    },

    bankFileWarnings: {
      type: [String],
      default: [],
    },

    bankFileTotals: {
      countCR: { type: Number, default: 0 },
      totalCR: { type: Number, default: 0 },
      countDB: { type: Number, default: 0 },
      totalDB: { type: Number, default: 0 },
    },

    loanPayrollPendingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    loanPayrollPendingTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    bankOverride: {
      type: Schema.Types.Mixed,
      default: {},
    },

    notes: {
      type: String,
      default: "",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

terminationPaymentSchema.index({
  company: 1,
  termination: 1,
  status: 1,
});

export default model<ITerminationPayment>(
  "TerminationPayment",
  terminationPaymentSchema,
);
