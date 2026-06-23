import mongoose, { Schema, model, Types } from "mongoose";

export interface IPayrollEarningEntry extends mongoose.Document {
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  user: Types.ObjectId;

  earningType: Types.ObjectId; // PayrollEarningType
  amountPeriod: number; // monto para ESTE período (quincena/semana/mes)

  notes?: string;

  createdBy: Types.ObjectId;
  isClaimed: boolean;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
  claimedAt?: Date;
  claimedInPayrollRun?: Types.ObjectId;
}

const earningEntrySchema = new Schema<IPayrollEarningEntry>(
  {
    periodStart: { type: String, required: true, index: true },
    periodEnd: { type: String, required: true, index: true },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    earningType: {
      type: Schema.Types.ObjectId,
      ref: "PayrollEarningType",
      required: true,
    },

    amountPeriod: { type: Number, required: true, min: 0, default: 0 },

    notes: { type: String },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isClaimed: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    claimedAt: { type: Date, default: null },
    claimedInPayrollRun: {
      type: Schema.Types.ObjectId,
      ref: "PayrollRun",
      default: null,
    },
  },
  { timestamps: true },
);

earningEntrySchema.index(
  { user: 1, earningType: 1, periodStart: 1, periodEnd: 1 },
  { unique: true },
);

earningEntrySchema.index({ isActive: 1, isDeleted: 1 });

export default model<IPayrollEarningEntry>(
  "PayrollEarningEntry",
  earningEntrySchema
);
