import mongoose, { Schema, model, Types } from "mongoose";

interface DeductionDetail {
  name: string;
  type: "porcentaje" | "montoFijo";
  value: number;
  amount: number;
  isLegal: boolean;
  origin: "por tipo" | "personalizado" | "manual" | "automático";
}

export interface IPaymentPeriod extends mongoose.Document {
  user: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;

  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  deductions: DeductionDetail[];

  status: "draft" | "confirmed" | "paid" | "canceled";
  paidAt?: Date;

  // 🔥 Snapshot / auditoría
  workSummaryIds: Types.ObjectId[]; // días incluidos
  totalMinutesWorked: number;
  totalLateMinutes: number;

  project?: Types.ObjectId;

  createdAt: Date;
}

const deductionDetailSchema = new Schema<DeductionDetail>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["porcentaje", "montoFijo"], required: true },
    value: { type: Number, required: true },
    amount: { type: Number, required: true },
    isLegal: { type: Boolean, required: true },
    origin: {
      type: String,
      enum: ["por tipo", "personalizado", "manual", "automático"],
      required: true,
    },
  },
  { _id: false }
);

const paymentPeriodSchema = new Schema<IPaymentPeriod>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },

  grossSalary: { type: Number, required: true },
  totalDeductions: { type: Number, required: true },
  netSalary: { type: Number, required: true },
  deductions: { type: [deductionDetailSchema], default: [] },

  status: {
    type: String,
    enum: ["draft", "confirmed", "paid", "canceled"],
    default: "draft",
  },
  paidAt: { type: Date },

  workSummaryIds: [{ type: Schema.Types.ObjectId, ref: "WorkSummary" }],
  totalMinutesWorked: { type: Number, default: 0 },
  totalLateMinutes: { type: Number, default: 0 },

  project: { type: Schema.Types.ObjectId, ref: "Project", require: false },

  createdAt: { type: Date, default: Date.now },
});

// ✅ evita duplicados por periodo (muy importante)
paymentPeriodSchema.index(
  { user: 1, periodStart: 1, periodEnd: 1 },
  { unique: true }
);

export default model<IPaymentPeriod>("PaymentPeriod", paymentPeriodSchema);
