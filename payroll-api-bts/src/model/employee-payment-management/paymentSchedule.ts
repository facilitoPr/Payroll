import mongoose, { Schema, model, Types } from "mongoose";

const PAYMENT_SCHEDULE_CODES = [
  "MENSUAL_DIA_30",
  "MENSUAL_DIA_15",
  "QUINCENAL_15_30",
  "QUINCENAL_15_ULTIMO",
  "SEMANAL_VIERNES",
  "SEMANAL_SABADO",
  "BISEMANAL_VIERNES",
  "DIARIO",
];

export type PaymentScheduleCodes = (typeof PAYMENT_SCHEDULE_CODES)[number];

export interface IPaymentSchedule extends mongoose.Document {
  name: string; // Ej: "Quincenal 5 y 20"
  paymentFrequency: Types.ObjectId; // Ref a PaymentFrequency
  payDays: number[]; // Ej: [5, 20]
  weeklyDays?: number[]; // Días de la semana (para semanal)
  description?: string;
  isActive: Boolean;
  code: PaymentScheduleCodes;
}

const paymentScheduleSchema = new Schema<IPaymentSchedule>({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    enum: PAYMENT_SCHEDULE_CODES,
  },
  paymentFrequency: {
    type: Schema.Types.ObjectId,
    ref: "PaymentFrequency",
    required: true,
  },
  payDays: {
    type: [Number],
    required: true,
    validate: {
      validator: (val: number[]) => val.every((d) => d >= 1 && d <= 31),
      message: "Los días deben estar entre 1 y 31",
    },
  },
  weeklyDays: {
    type: [Number], // 0 = domingo, 6 = sábado
    validate: {
      validator: (val: number[]) => val.every((d) => d >= 0 && d <= 6),
      message: "Los días deben estar entre 0 (domingo) y 6 (sábado)",
    },
  },
  description: { type: String },
  isActive: {
    type: Boolean,
    default: true,
  },
});

export default model<IPaymentSchedule>(
  "PaymentSchedule",
  paymentScheduleSchema
);
