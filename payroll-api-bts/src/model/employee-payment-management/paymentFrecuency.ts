import mongoose, { Schema, model, Types } from "mongoose";

const PAYMENT_FRENQUENCY_CODES = [
  "DIARIO",
  "SEMANAL",
  "BISEMANAL",
  "QUINCENAL",
  "MENSUAL",
  "ANUAL",
  "UNICO",
];

export type PaymentFrequencyCode = (typeof PAYMENT_FRENQUENCY_CODES)[number];

export interface IPaymentFrequency extends mongoose.Document {
  name: string;
  description?: string;
  code: PaymentFrequencyCode;
}

const paymentFrequencySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: { type: String },
  code: {
    type: String,
    required: true,
    unique: true,
    enum: PAYMENT_FRENQUENCY_CODES,
  },
});

export default model<IPaymentFrequency>(
  "PaymentFrequency",
  paymentFrequencySchema,
);
