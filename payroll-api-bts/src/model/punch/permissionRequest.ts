import { Schema, model, Document, Types } from "mongoose";
import { IPermissionType } from "./PermissionType";

export const BLOCKING_PERMISSION_STATUSES = [
  "CREADA",
  "EDITADA",
  "COMENTADA",
  "PENDIENTE",
  "MODIFICADA",
  "APROBADA",
  "ACEPTADA",
  "FINALIZADA",
];

export const FULL_DAY_START_MINUTE = 0;
export const FULL_DAY_END_MINUTE = 24 * 60;


export interface IPermissionRequest extends Document {
  user: Types.ObjectId;
  permissionType: Types.ObjectId | IPermissionType | any;
  reason: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm, si aplica
  endTime?: string; // HH:mm, si aplica
  // isFullDay: boolean;
  totalDays: number;
  totalMinutes: number; // tiempo a descontar del total trabajado
  totalHour: number;

  status:
    | "CREADA"
    | "EDITADA"
    | "APROBADA"
    | "RECHAZADA"
    | "COMENTADA"
    | "PENDIENTE"
    | "FINALIZADA"
    | "MODIFICADA"
    | "ACEPTADA"
    | "NO ACEPTADA";
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  comment?: string;
  performedBy: Types.ObjectId; // Usuario que realizó la acción
  requestedDates: string[];

  /** Balance de vacaciones afectado. */
  vacationBalance?: Types.ObjectId | null;

  /** Movimiento de vacaciones generado. */
  vacationMovement?: Types.ObjectId | null;

  /** Días descontados del balance. */
  vacationDeductedDays?: number;

  /** Fecha en que se descontaron los días. */
  vacationDeductedAt?: Date | null;
}

const permissionRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    permissionType: {
      type: Schema.Types.ObjectId,
      ref: "PermissionType",
      required: true,
    },
    reason: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    startTime: { type: String }, // HH:mm
    endTime: { type: String }, // HH:mm
    // isFullDay: { type: Boolean, default: true },
    totalDays: { type: Number, required: true },
    totalMinutes: { type: Number, required: false, default: 0 },
    totalHour: { type: Number, required: false, default: 0 },

    status: {
      type: String,
      enum: [
        "CREADA",
        "EDITADA",
        "APROBADA",
        "RECHAZADA",
        "COMENTADA",
        "PENDIENTE",
        "FINALIZADA",
        "MODIFICADA",
        "ACEPTADA",
        "NO ACEPTADA",
      ],
      required: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },

    category: {
      type: String,
      enum: ["PERMISO", "VACACIONES"],
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: {
      type: String,
    },
    requestedDates: { type: [String], default: [] }, // "YYYY-MM-DD"
    vacationBalance: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeVacationBalance",
      default: null,
    },

    vacationMovement: {
      type: Schema.Types.ObjectId,
      ref: "VacationBalanceMovement",
      default: null,
    },

    vacationDeductedDays: {
      type: Number,
      default: 0,
    },

    vacationDeductedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

permissionRequestSchema.index({ requestedDates: 1 });

export default model<IPermissionRequest>(
  "PermissionRequest",
  permissionRequestSchema,
);
