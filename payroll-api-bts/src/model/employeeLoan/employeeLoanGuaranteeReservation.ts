import { Schema, model, Document, Types } from "mongoose";

export const EMPLOYEE_LOAN_GUARANTEE_RESERVATION_SOURCE = [
  "CHRISTMAS_SALARY",
] as const;

export const EMPLOYEE_LOAN_GUARANTEE_RESERVATION_STATUS = [
  "ACTIVE",
  "RELEASED",
  "CONSUMED",
  "CANCELLED",
] as const;

export type EmployeeLoanGuaranteeReservationSource =
  (typeof EMPLOYEE_LOAN_GUARANTEE_RESERVATION_SOURCE)[number];

export type EmployeeLoanGuaranteeReservationStatus =
  (typeof EMPLOYEE_LOAN_GUARANTEE_RESERVATION_STATUS)[number];

export interface IEmployeeLoanGuaranteeReservation extends Document {
  company: Types.ObjectId;
  employee: Types.ObjectId;
  loanRequest: Types.ObjectId;

  source: EmployeeLoanGuaranteeReservationSource;
  year: number;

  reservedAmount: number;
  remainingReservedAmount: number;

  status: EmployeeLoanGuaranteeReservationStatus;
  reason: string;

  reservedAt: Date;
  releasedAt?: Date | null;
  consumedAt?: Date | null;
  cancelledAt?: Date | null;

  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  releasedBy?: Types.ObjectId | null;
  consumedBy?: Types.ObjectId | null;
  cancelledBy?: Types.ObjectId | null;

  metadata?: Record<string, any>;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const employeeLoanGuaranteeReservationSchema =
  new Schema<IEmployeeLoanGuaranteeReservation>(
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

      loanRequest: {
        type: Schema.Types.ObjectId,
        ref: "EmployeeLoanRequest",
        required: true,
        index: true,
      },

      source: {
        type: String,
        enum: EMPLOYEE_LOAN_GUARANTEE_RESERVATION_SOURCE,
        required: true,
        default: "CHRISTMAS_SALARY",
        index: true,
      },

      year: {
        type: Number,
        required: true,
        index: true,
      },

      reservedAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      remainingReservedAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      status: {
        type: String,
        enum: EMPLOYEE_LOAN_GUARANTEE_RESERVATION_STATUS,
        required: true,
        default: "ACTIVE",
        index: true,
      },

      reason: {
        type: String,
        required: true,
        trim: true,
      },

      reservedAt: {
        type: Date,
        default: Date.now,
      },

      releasedAt: {
        type: Date,
        default: null,
      },

      consumedAt: {
        type: Date,
        default: null,
      },

      cancelledAt: {
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

      releasedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      consumedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      cancelledBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
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

employeeLoanGuaranteeReservationSchema.pre("validate", function (next) {
  const reserved = Math.max(0, Number(this.reservedAmount || 0));
  const remaining = Math.max(0, Number(this.remainingReservedAmount || 0));

  this.remainingReservedAmount = Math.min(remaining, reserved);

  next();
});

employeeLoanGuaranteeReservationSchema.index(
  {
    loanRequest: 1,
    source: 1,
  },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);

employeeLoanGuaranteeReservationSchema.index(
  {
    loanRequest: 1,
    source: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      status: "ACTIVE",
    },
  },
);

employeeLoanGuaranteeReservationSchema.index({
  employee: 1,
  source: 1,
  year: 1,
  status: 1,
  isDeleted: 1,
});

employeeLoanGuaranteeReservationSchema.index({
  company: 1,
  source: 1,
  year: 1,
  status: 1,
  isDeleted: 1,
});

export default model<IEmployeeLoanGuaranteeReservation>(
  "EmployeeLoanGuaranteeReservation",
  employeeLoanGuaranteeReservationSchema,
);
