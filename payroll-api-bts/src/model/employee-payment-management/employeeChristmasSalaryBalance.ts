import { Schema, model, Document, Types } from "mongoose";

export interface IEmployeeChristmasSalaryBalance extends Document {
  company: Types.ObjectId;
  employee: Types.ObjectId;
  year: number;

  ordinarySalaryEarnedAmount: number;
  accruedChristmasSalaryAmount: number;
  paidChristmasSalaryAmount: number;
  appliedToTerminationAmount: number;
  reservedGuaranteeAmount: number;

  availableUnreservedChristmasSalaryAmount: number;
  pendingChristmasSalaryPayable: number;

  lastMovementAt?: Date | null;
  lastRebuiltAt?: Date | null;
  calculationVersion: number;

  metadata?: Record<string, any>;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const employeeChristmasSalaryBalanceSchema =
  new Schema<IEmployeeChristmasSalaryBalance>(
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

      year: {
        type: Number,
        required: true,
        index: true,
      },

      ordinarySalaryEarnedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      accruedChristmasSalaryAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      paidChristmasSalaryAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      appliedToTerminationAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      reservedGuaranteeAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      availableUnreservedChristmasSalaryAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      pendingChristmasSalaryPayable: {
        type: Number,
        default: 0,
        min: 0,
      },

      lastMovementAt: {
        type: Date,
        default: null,
      },

      lastRebuiltAt: {
        type: Date,
        default: null,
      },

      calculationVersion: {
        type: Number,
        default: 1,
        min: 1,
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

employeeChristmasSalaryBalanceSchema.pre("validate", function (next) {
  const accrued = Number(this.accruedChristmasSalaryAmount || 0);
  const paid = Number(this.paidChristmasSalaryAmount || 0);
  const applied = Number(this.appliedToTerminationAmount || 0);
  const reserved = Number(this.reservedGuaranteeAmount || 0);

  this.pendingChristmasSalaryPayable = Math.max(0, accrued - paid - applied);

  this.availableUnreservedChristmasSalaryAmount = Math.max(
    0,
    accrued - paid - applied - reserved,
  );

  next();
});

employeeChristmasSalaryBalanceSchema.index(
  {
    company: 1,
    employee: 1,
    year: 1,
  },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);

employeeChristmasSalaryBalanceSchema.index({
  employee: 1,
  year: 1,
  isActive: 1,
  isDeleted: 1,
});

employeeChristmasSalaryBalanceSchema.index({
  company: 1,
  year: 1,
  isDeleted: 1,
});

export default model<IEmployeeChristmasSalaryBalance>(
  "EmployeeChristmasSalaryBalance",
  employeeChristmasSalaryBalanceSchema,
);
