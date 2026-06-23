import mongoose, { Schema, model, Types } from "mongoose";

export type AuditEntityType =
  | "User"
  | "Expedient"
  | "RecruitmentApplication"
  | "PaymentPeriod"
  | "PayrollRun"
  | "Other";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "SOFT_DELETE"
  | "DELETE"
  | "RESTORE"
  | "HARD_DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "EXPORT"
  | "OTHER";


export interface IAuditChange {
  /** Ruta del campo cambiado. Ej: "payrollBank.accountNumber" */
  path: string;
  from?: any;
  to?: any;

  /** Si true, en UI se muestra "****" o algo enmascarado */
  masked?: boolean;

  /** Label opcional para UI (si quieres ahorrar mapeo por path en frontend) */
  label?: string;
}

/**
 * Summary UI-friendly: chips/lista corta
 */
export interface IAuditSummaryItem {
  label: string;
  value: string;
}

/**
 * Contexto técnico (debug / compliance)
 */
export interface IAuditContext {
  route?: string; // "/api/user/updateEmployee/:id"
  method?: string; // "PUT", "POST"
  ip?: string;
  userAgent?: string;
  requestId?: string; // ideal si tienes middleware que lo genera
  statusCode?: number; // 200/400/500 etc
  meta?: Record<string, any>; // cualquier extra que quieras
}

export interface IAuditLog extends mongoose.Document {
  /**
   * ✅ rootUser = el empleado “dueño” del historial (para timeline unificado).
   * - Si cambias User => rootUser = userId
   * - Si cambias Expedient => rootUser = expedient.user
   */
  rootUser: Types.ObjectId;

  /** Entidad afectada */
  entityType: AuditEntityType;
  entityId: Types.ObjectId;

  /** Acción realizada */
  action: AuditAction;

  /**
   * UI-ready (opcional pero recomendado)
   * title: "Actualizó datos bancarios"
   * subtitle: "Cuenta/operación"
   */
  title?: string;
  subtitle?: string;

  /** Tags para filtrar y chips en UI */
  tags: string[];

  /** Chips/resumen para timeline */
  summary: IAuditSummaryItem[];

  /** Cambios puntuales */
  changes: IAuditChange[];

  /** Nota libre (si el usuario escribe un motivo) */
  note?: string;

  /** Usuario que ejecutó la acción */
  changedBy?: Types.ObjectId;

  /** Soft delete */
  isActive: boolean;
  isDeleted: boolean;

  /** Contexto técnico */
  context?: IAuditContext;

  createdAt: Date;
  updatedAt: Date;
}

const AuditChangeSchema = new Schema<IAuditChange>(
  {
    path: { type: String, required: true, index: true },
    from: { type: Schema.Types.Mixed, required: false },
    to: { type: Schema.Types.Mixed, required: false },
    masked: { type: Boolean, default: false },
    label: { type: String, default: "" },
  },
  { _id: false },
);

const AuditSummaryItemSchema = new Schema<IAuditSummaryItem>(
  {
    label: { type: String, required: true, maxLength: 60 },
    value: { type: String, required: true, maxLength: 180 },
  },
  { _id: false },
);

const AuditContextSchema = new Schema<IAuditContext>(
  {
    route: { type: String, default: "" },
    method: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    requestId: { type: String, default: "" },
    statusCode: { type: Number, default: 0 },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const AuditLogSchema = new Schema<IAuditLog>(
  {
    rootUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      required: true,
      enum: [
        "User",
        "Expedient",
        "RecruitmentApplication",
        "PaymentPeriod",
        "PayrollRun",
        "Other",
      ],
      index: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },

    // ============
    // Acción
    // ============
    action: {
      type: String,
      required: true,
      enum: [
        "CREATE",
        "UPDATE",
        "SOFT_DELETE",
        "DELETE",
        "RESTORE",
        "HARD_DELETE",
        "LOGIN",
        "LOGOUT",
        "EXPORT",
        "OTHER",
      ],
      index: true,
    },

    // ============
    // UI-friendly
    // ============
    title: { type: String, default: "", maxLength: 120 },
    subtitle: { type: String, default: "", maxLength: 180 },
    tags: { type: [String], default: () => [], index: true },
    summary: { type: [AuditSummaryItemSchema], default: () => [] },

    changes: { type: [AuditChangeSchema], default: () => [] },
    note: { type: String, default: "", maxLength: 500 },

    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },


    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },

    context: { type: AuditContextSchema, default: () => ({}) },
  },
  { timestamps: true },
);

// Timeline del empleado (lo más usado)
AuditLogSchema.index({ rootUser: 1, createdAt: -1, isDeleted: 1 });

// Historial por entidad específica
AuditLogSchema.index({
  entityType: 1,
  entityId: 1,
  createdAt: -1,
  isDeleted: 1,
});

// Auditoría por usuario que cambió
AuditLogSchema.index({ changedBy: 1, createdAt: -1, isDeleted: 1 });

export default model<IAuditLog>("AuditLog", AuditLogSchema);
