import mongoose, { Schema, model, Types } from "mongoose";
import { PunchStep } from "./puncHistory";

export type classification =
  | "Trabajo regular"
  | "Pérmiso por nacimiento de hijos"
  | "Pérmiso por matrimonio"
  | "Pérmiso por fallecimiento familiar directo o abuelo"
  | "Licencia pre y post natal"
  | "Vacaciones"
  | "Licencia médica por enfermedad común"
  | "Permiso por estudios"
  | "Ausencia sin justificación"
  | "Ausencia con justificación"
  | "Otros tipos de permisos";

export type PayImpact = "NONE" | "DEDUCT" | "PAID_LEAVE";
export type DiscountOverride = "AUTO" | "FORCE_NO_DEDUCT" | "FORCE_DEDUCT";

export const dayTypeOptions: classification[] = [
  "Trabajo regular",
  "Pérmiso por nacimiento de hijos",
  "Pérmiso por matrimonio",
  "Pérmiso por fallecimiento familiar directo o abuelo",
  "Licencia pre y post natal",
  "Vacaciones",
  "Licencia médica por enfermedad común",
  "Permiso por estudios",
  "Ausencia sin justificación",
  "Ausencia con justificación",
  "Otros tipos de permisos",
];

const AuditChangeSchema = new Schema(
  {
    field: String,
    from: Schema.Types.Mixed,
    to: Schema.Types.Mixed,
  },
  { _id: false },
);

const AuditEntrySchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: Types.ObjectId, ref: "User" },
    ip: String,
    changes: [AuditChangeSchema],
  },
  { _id: false },
);

export interface IWorkSummary extends mongoose.Document {
  wasAutoClosed: boolean;
  autoClosedReason?: string;

  user: Types.ObjectId;
  date: Date;
  dateString: string;

  // minutos trabajados/pagables base
  totalMinutes: number;

  // ====== cálculo de nómina ======
  expectedMinutes: number; // minutos esperados según horario
  approvedMinutes: number; // minutos aprobados por supervisor
  notWorkedMinutes: number; // faltante para descuento (ya ajustado por override/aprobados)
  payImpact: PayImpact; // NONE/DEDUCT/PAID_LEAVE

  // override de descuento
  discountOverride: DiscountOverride; // AUTO / FORCE_NO_DEDUCT / FORCE_DEDUCT
  overrideReason?: string;
  approvedReason?: string;
  overrideBy?: Types.ObjectId;
  overrideAt?: Date;

  // ====== ponches ======
  isIncomplete: boolean;
  punchSteps: PunchStep[];
  missingSteps?: PunchStep[];
  scheduledExitTime?: string;
  realEntryTime?: string;
  realExitTime?: string;

  // metadata
  classification: classification;
  confirmedToPay: boolean;
  lateTime: number;

  // estándar
  isActive: boolean;
  isDeleted: boolean;

  updatedBy?: Types.ObjectId;
  audit: any[];
  isPaid: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const workSummarySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    dateString: { type: String, required: true }, // YYYY-MM-DD

    totalMinutes: { type: Number, required: true, default: 0 },

    // ====== nómina ======
    expectedMinutes: { type: Number, default: 0 },
    approvedMinutes: { type: Number, default: 0 },
    notWorkedMinutes: { type: Number, default: 0 },
    payImpact: {
      type: String,
      enum: ["NONE", "DEDUCT", "PAID_LEAVE"],
      default: "NONE",
    },

    discountOverride: {
      type: String,
      enum: ["AUTO", "FORCE_NO_DEDUCT", "FORCE_DEDUCT"],
      default: "AUTO",
    },
    overrideReason: { type: String, default: "" },
    approvedReason: { type: String, default: "" },
    overrideBy: { type: Types.ObjectId, ref: "User", default: null },
    overrideAt: { type: Date, default: null },

    // ====== ponches ======
    isIncomplete: { type: Boolean, default: false },
    punchSteps: [
      {
        type: String,
        enum: ["entrada", "salida_almuerzo", "entrada_almuerzo", "salida"],
      },
    ],
    missingSteps: [
      {
        type: String,
        enum: ["entrada", "salida_almuerzo", "entrada_almuerzo", "salida"],
      },
    ],
    wasAutoClosed: { type: Boolean, default: false },
    confirmedToPay: { type: Boolean, default: false },
    autoClosedReason: { type: String, default: "" },
    scheduledExitTime: { type: String, default: "" },
    realEntryTime: { type: String, default: "" },
    realExitTime: { type: String, default: "" },

    classification: {
      type: String,
      enum: [
        "Trabajo regular",
        "Pérmiso por nacimiento de hijos",
        "Pérmiso por matrimonio",
        "Pérmiso por fallecimiento familiar directo o abuelo",
        "Licencia pre y post natal",
        "Vacaciones",
        "Licencia médica por enfermedad común",
        "Permiso por estudios",
        "Ausencia sin justificación",
        "Ausencia con justificación",
        "Otros tipos de permisos",
      ],
      default: "Trabajo regular",
      required: true,
    },

    lateTime: { type: Number, default: 0 },

    // ✅ estándar (arregla el índice único parcial)
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    isPaid: {type: Boolean, default: false},

    updatedBy: { type: Types.ObjectId, ref: "User", default: null },
    audit: [AuditEntrySchema],
  },
  { timestamps: true },
);

// ✅ evita duplicados reales por (user, dateString)
workSummarySchema.index(
  { user: 1, dateString: 1, date: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

export default model<IWorkSummary>("WorkSummary", workSummarySchema);
