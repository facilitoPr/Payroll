import mongoose, { Schema, model, Types } from "mongoose";

export type TerminationLoanPayrollPendingPaymentStatus =
  | "PENDING"
  | "CLAIMED"
  | "PAID"
  | "CANCELLED";

export interface ITerminationLoanPayrollPendingPayment
  extends mongoose.Document {
  company: Types.ObjectId;
  employee: Types.ObjectId;
  termination: Types.ObjectId;
  terminationPayment: Types.ObjectId;
  loanRequest: Types.ObjectId;

  payrollRun?: Types.ObjectId | null;

  amount: number;
  status: TerminationLoanPayrollPendingPaymentStatus;

  employeeName?: string;
  requestNumber?: string;
  productName?: string;
  description?: string;
  bankSnapshot?: Record<string, any>;
  metadata?: Record<string, any>;

  claimedAt?: Date | null;
  paidAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string;

  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const terminationLoanPayrollPendingPaymentSchema =
  new Schema<ITerminationLoanPayrollPendingPayment>(
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
      terminationPayment: {
        type: Schema.Types.ObjectId,
        ref: "TerminationPayment",
        required: true,
        index: true,
      },
      loanRequest: {
        type: Schema.Types.ObjectId,
        ref: "EmployeeLoanRequest",
        required: true,
        index: true,
      },
      payrollRun: {
        type: Schema.Types.ObjectId,
        ref: "PayrollRun",
        default: null,
        index: true,
      },

      amount: { type: Number, required: true, min: 0 },
      status: {
        type: String,
        enum: ["PENDING", "CLAIMED", "PAID", "CANCELLED"],
        default: "PENDING",
        index: true,
      },

      employeeName: { type: String, default: "" },
      requestNumber: { type: String, default: "" },
      productName: { type: String, default: "" },
      description: { type: String, default: "" },
      bankSnapshot: { type: Schema.Types.Mixed, default: {} },
      metadata: { type: Schema.Types.Mixed, default: {} },

      claimedAt: { type: Date, default: null },
      paidAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
      cancellationReason: { type: String, default: "" },

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
      isDeleted: { type: Boolean, default: false, index: true },
    },
    { timestamps: true },
  );

terminationLoanPayrollPendingPaymentSchema.index({
  company: 1,
  status: 1,
  isDeleted: 1,
});

terminationLoanPayrollPendingPaymentSchema.index({
  termination: 1,
  loanRequest: 1,
  status: 1,
});

export default model<ITerminationLoanPayrollPendingPayment>(
  "TerminationLoanPayrollPendingPayment",
  terminationLoanPayrollPendingPaymentSchema,
);
