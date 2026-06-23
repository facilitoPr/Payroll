import mongoose, { Schema, model, Types } from "mongoose";
import { ISalaryType } from "../employee-payment-management/salaryType";
import { IPaymentSchedule } from "../employee-payment-management/paymentSchedule";

export type SalaryHistoryFrequency =
  | "MONTHLY"
  | "BIWEEKLY"
  | "WEEKLY"
  | "DAILY"
  | "HOURLY";

export type SalaryHistoryReason =
  | "HIRING"
  | "SALARY_INCREASE"
  | "SALARY_DECREASE"
  | "POSITION_CHANGE"
  | "PAYMENT_TYPE_CHANGE"
  | "MANUAL_ADJUSTMENT"
  | "OTHER";

export interface IEmployeeSalaryHistory extends mongoose.Document {
  company: Types.ObjectId;
  employee: Types.ObjectId;

  salaryType?: Types.ObjectId | ISalaryType;
  paymentSchedule?: Types.ObjectId | IPaymentSchedule;

  salaryFrequency: SalaryHistoryFrequency;

  baseSalary: number;
  hourlyRate: number;

  /**
   * Monto normalizado que puedes usar para cálculos.
   * Ejemplo:
   * - Si es fijo mensual, salaryAmount = baseSalary mensual.
   * - Si es por hora, salaryAmount puede ser estimado mensual o 0,
   *   dependiendo de tu lógica.
   */
  salaryAmount: number;

  isOrdinarySalary: boolean;

  effectiveFrom: Date;
  effectiveTo?: Date | null;

  reason: SalaryHistoryReason;
  notes?: string;

  createdBy?: Types.ObjectId | null;

  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const employeeSalaryHistorySchema = new Schema<IEmployeeSalaryHistory>(
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

    salaryType: {
      type: Schema.Types.ObjectId,
      ref: "SalaryType",
      default: null,
    },

    paymentSchedule: {
      type: Schema.Types.ObjectId,
      ref: "PaymentSchedule",
      default: null,
    },

    salaryFrequency: {
      type: String,
      enum: ["MONTHLY", "BIWEEKLY", "WEEKLY", "DAILY", "HOURLY"],
      default: "MONTHLY",
    },

    baseSalary: {
      type: Number,
      default: 0,
      min: 0,
    },

    hourlyRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    salaryAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isOrdinarySalary: {
      type: Boolean,
      default: true,
    },

    effectiveFrom: {
      type: Date,
      required: true,
      index: true,
    },

    effectiveTo: {
      type: Date,
      default: null,
      index: true,
    },

    reason: {
      type: String,
      enum: [
        "HIRING",
        "SALARY_INCREASE",
        "SALARY_DECREASE",
        "POSITION_CHANGE",
        "PAYMENT_TYPE_CHANGE",
        "MANUAL_ADJUSTMENT",
        "OTHER",
      ],
      default: "OTHER",
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

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

employeeSalaryHistorySchema.index({
  company: 1,
  employee: 1,
  effectiveFrom: -1,
});

employeeSalaryHistorySchema.index({
  employee: 1,
  isDeleted: 1,
  effectiveFrom: -1,
});

export default model<IEmployeeSalaryHistory>(
  "EmployeeSalaryHistory",
  employeeSalaryHistorySchema,
);