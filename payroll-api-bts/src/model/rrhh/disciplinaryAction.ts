import mongoose, { Schema, model, Types } from "mongoose";

export type DisciplinaryCategory =
  | "LATE_ARRIVAL"
  | "EARLY_DEPARTURE"
  | "NO_SHOW"
  | "MISSING_PUNCH"
  | "UNAUTHORIZED_BREAK"
  | "MISCONDUCT"
  | "INSUBORDINATION"
  | "DRESS_CODE"
  | "POOR_PERFORMANCE"
  | "PROCEDURE_VIOLATION"
  | "SAFETY_VIOLATION"
  | "CUSTOMER_COMPLAINT"
  | "SECURITY_POLICY_VIOLATION"
  | "DATA_MISHANDLING";


export type DisciplinaryScope = "DAY" | "RANGE";

export interface IDisciplinaryAction extends mongoose.Document {
  category: DisciplinaryCategory;
  scope: DisciplinaryScope;

  user: Types.ObjectId;

  userSnapshot: {
    name: string;
    email?: string;
    roleCode?: string;
    department?: { _id?: Types.ObjectId; name?: string; code?: string };
    jobPosition?: { _id?: Types.ObjectId; name?: string };
  };

  /**
   * Para compatibilidad de listados rápidos:
   * - SINGLE_DAY: es el día exacto
   * - RANGE: puede ser el día final del rango (o el día “representativo”)
   */
  workDateString: string; // YYYY-MM-DD
  workDate: Date;

  /**
   * Rango real (solo si scope=RANGE)
   */
  period?: {
    fromDateString: string; // YYYY-MM-DD
    toDateString: string; // YYYY-MM-DD
    fromDate: Date;
    toDate: Date;
  };

  /**
   * Evidencia (para LATE_ARRIVAL es clave).
   * Para otras categorías, puedes dejarlo vacío o solo notes.
   */
  evidence?: {
    graceMinutes?: number;

    // SINGLE_DAY
    minutesLate?: number;
    scheduledAt?: Date;
    actualAt?: Date;

    // RANGE
    totalMinutesLate?: number;
    daysCount?: number;

    // Snapshot por día para auditoría (recomendado)
    breakdown?: Array<{
      workDateString: string;
      workSummary: Types.ObjectId;
      scheduledAt?: Date;
      actualAt?: Date;
      minutesLate: number;
    }>;

    calculatedBy?: "AUTO" | "ADMIN" | "UI";
    timezone?: string;
  };

  /**
   * Relación al/los días.
   * - SINGLE_DAY: puedes usar workSummary (único) o workSummaries con 1 elemento.
   * - RANGE: workSummaries con varios.
   */
  workSummary?: Types.ObjectId;
  workSummaries?: Types.ObjectId[];

  notes?: string;
  createdBy: Types.ObjectId;

  audit: {
    ip?: string;
    createdVia?: "DASHBOARD" | "BULK" | "AUTO" | "MANUAL" | "REPORT";
  };

  acknowledgedAt?: Date;
  acknowledgedBy?: Types.ObjectId;
  acknowledgeNotes?: string;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
};

const DISCIPLINARY_CATEGORIES = [
  "LATE_ARRIVAL",
  "EARLY_DEPARTURE",
  "NO_SHOW",
  "MISSING_PUNCH",
  "UNAUTHORIZED_BREAK",
  "MISCONDUCT",
  "INSUBORDINATION",
  "DRESS_CODE",
  "POOR_PERFORMANCE",
  "PROCEDURE_VIOLATION",
  "SAFETY_VIOLATION",
  "CUSTOMER_COMPLAINT",
  "SECURITY_POLICY_VIOLATION",
  "DATA_MISHANDLING",
] as const;

const DisciplinaryActionSchema = new Schema<IDisciplinaryAction>(
  {
    category: {
      type: String,
      enum: DISCIPLINARY_CATEGORIES,
      required: true,
      index: true,
    },

    scope: {
      type: String,
      enum: ["DAY", "RANGE"],
      default: "DAY",
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userSnapshot: {
      name: { type: String, required: true },
      email: { type: String },
      roleCode: { type: String },
      department: {
        _id: { type: Schema.Types.ObjectId },
        name: { type: String },
        code: { type: String },
      },
      jobPosition: {
        _id: { type: Schema.Types.ObjectId },
        name: { type: String },
      },
    },

    // Fecha “principal”
    workDateString: { type: String, required: true, index: true },
    workDate: { type: Date, required: true, index: true },

    period: {
      fromDateString: { type: String },
      toDateString: { type: String },
      fromDate: { type: Date },
      toDate: { type: Date },
    },

    workSummaries: [{ type: Schema.Types.ObjectId, ref: "WorkSummary" }],

    // Evidencia (flexible)
    evidence: {
      scheduledAt: { type: Date },
      actualAt: { type: Date },
      graceMinutes: { type: Number, default: 0 },

      minutesLate: {
        type: Number,
        min: 0,
        required: function () {
          // solo para tardanza
          return this.category === "LATE_ARRIVAL" && this.scope !== "RANGE";
        },
      },

      totalMinutesLate: { type: Number, min: 0 },
      daysCount: { type: Number, min: 0 },

      calculatedBy: {
        type: String,
        enum: ["AUTO", "ADMIN", "UI"],
        default: "ADMIN",
      },
      timezone: { type: String },
    },

    notes: { type: String, trim: true },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    audit: {
      ip: { type: String },
      createdVia: {
        type: String,
        enum: ["DASHBOARD", "BULK", "AUTO", "MANUAL", "REPORT"],
        default: "DASHBOARD",
      },
    },

    acknowledgedAt: { type: Date },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: "User" },
    acknowledgeNotes: { type: String, trim: true },

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Índices útiles
DisciplinaryActionSchema.index({ category: 1, workDate: -1 });
DisciplinaryActionSchema.index({ user: 1, workDate: -1 });
DisciplinaryActionSchema.index({ user: 1, category: 1, "period.fromDate": -1 });


// Índice útil para auditoría/listado
DisciplinaryActionSchema.index({ category: 1, workDate: -1 });
DisciplinaryActionSchema.index({ user: 1, workDate: -1 });

export const DisciplinaryAction = model<IDisciplinaryAction>(
  "DisciplinaryAction",
  DisciplinaryActionSchema
);
