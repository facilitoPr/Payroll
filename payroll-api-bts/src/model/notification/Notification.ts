import mongoose, { Schema, model, Types } from "mongoose";

/**
 * Tipos de notificación (códigos estables, NO uses textos de UI aquí)
 */
export type NotificationType =
  | "GENERAL_NOTIFICATION"
  | "TRIPLE_S_ERROR_REPORT"
  | "DISCIPLINARY_WARNING_CREATED"
  | "PAYROLL_RUN_CLOSED"
  | "PERMISSION_REQUEST_SUBMITTED"
  | "PERMISSION_REQUEST_APPROVED"
  | "PERMISSION_REQUEST_REJECTED"
  | "PERMISSION_REQUEST_STATUS_CHANGED"
  | "PERMISSION_REQUEST_FINALIZED"
  | "RECRUITMENT_FORM_SUBMITTED"
  | "TRIPLE_S_APPOINTMENT_CREATED";

export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export interface INotification extends mongoose.Document {
  /** Código del tipo de notificación */
  type: NotificationType;

  /** Severidad para UI (badge/colores) */
  severity: NotificationSeverity;

  /** Título corto (ej: "Amonestación registrada") */
  title: string;

  /** Mensaje más detallado (puede ir a UI como snippet) */
  message?: string;

  /**
   * Relación polimórfica al “evento origen”:
   * - entityType: nombre del modelo/entidad (ej: "DisciplinaryAction", "PayrollRun", "PermissionRequest", etc.)
   * - entityId: id de esa entidad
   */
  entityType?: string;
  entityId?: Types.ObjectId;

  /** Link directo del frontend (ruta o URL) */
  link?: string;

  /** Metadata libre para UI o auditoría (no crítica) */
  meta?: Record<string, any>;


  /** Auditoría */
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  /** Estándar */
  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "GENERAL_NOTIFICATION",
        "TRIPLE_S_ERROR_REPORT",
        "DISCIPLINARY_WARNING_CREATED",
        "PAYROLL_RUN_CLOSED",
        "PERMISSION_REQUEST_SUBMITTED",
        "PERMISSION_REQUEST_APPROVED",
        "PERMISSION_REQUEST_REJECTED",
        "PERMISSION_REQUEST_STATUS_CHANGED",
        "PERMISSION_REQUEST_FINALIZED",
        "RECRUITMENT_FORM_SUBMITTED",
        "TRIPLE_S_APPOINTMENT_CREATED",
      ],
    },
    severity: {
      type: String,
      required: true,
      enum: ["INFO", "SUCCESS", "WARNING", "ERROR"],
      default: "INFO",
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: false, trim: true },

    entityType: { type: String, required: false, trim: true },
    entityId: { type: Schema.Types.ObjectId, required: false },

    link: { type: String, required: false, trim: true },
    meta: { type: Schema.Types.Mixed, required: false },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Índices típicos
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ entityType: 1, entityId: 1 });

export const Notification = model<INotification>(
  "Notification",
  NotificationSchema
);
