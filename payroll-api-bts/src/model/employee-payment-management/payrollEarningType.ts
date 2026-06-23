import mongoose, { Schema, model } from "mongoose";

export interface IPayrollEarningType extends mongoose.Document {
  code: string; // OVERTIME_35, COMMISSIONS, etc.
  name: string; // "Horas extras 35%", "Comisiones"
  description?: string;
  includeForChristmasSalary?: boolean;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const payrollEarningTypeSchema = new Schema<IPayrollEarningType>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    includeForChristmasSalary: { type: Boolean, default: false, index: true },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

payrollEarningTypeSchema.index({ isActive: 1, isDeleted: 1 });
payrollEarningTypeSchema.index({ code: 1 }, { unique: true });

export default model<IPayrollEarningType>(
  "PayrollEarningType",
  payrollEarningTypeSchema
);
