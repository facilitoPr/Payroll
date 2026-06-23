import { Schema, model, Document, Types } from "mongoose";
import {
  EMPLOYEE_LOAN_REQUEST_STATUS,
  EmployeeLoanRequestStatus,
} from "./employeeLoanRequest";

/**
 * Acciones posibles dentro del historial de una solicitud de préstamo.
 */
export const EMPLOYEE_LOAN_REQUEST_HISTORY_ACTION = [
  "CREATED",
  "SUBMITTED",
  "CONTRACT_SIGNED",
  "SENT_TO_EXTERNAL",
  "EXTERNAL_RECEIVED",
  "STATUS_CHANGED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "ERROR",
  "SYNC_FAILED",
  "SYNCED",
  "COMMENTED",
  "CLOSED",
] as const;

export type EmployeeLoanRequestHistoryAction =
  (typeof EMPLOYEE_LOAN_REQUEST_HISTORY_ACTION)[number];

/**
 * Fuente que generó el evento del historial.
 */
export const EMPLOYEE_LOAN_REQUEST_HISTORY_SOURCE = [
  "EMPLOYEE_PORTAL",
  "ADMIN_PORTAL",
  "EXTERNAL_API",
  "SYSTEM",
] as const;

export type EmployeeLoanRequestHistorySource =
  (typeof EMPLOYEE_LOAN_REQUEST_HISTORY_SOURCE)[number];

export interface IEmployeeLoanRequestHistory extends Document {
  /** Solicitud de préstamo relacionada. */
  loanRequest: Types.ObjectId;

  /** Acción registrada. */
  action: EmployeeLoanRequestHistoryAction;

  /** Estado anterior de la solicitud. */
  fromStatus?: EmployeeLoanRequestStatus | null;

  /** Estado nuevo de la solicitud. */
  toStatus?: EmployeeLoanRequestStatus | null;

  /** Comentario asociado al cambio. */
  comment?: string;

  /** Fuente que generó el evento. */
  source: EmployeeLoanRequestHistorySource;

  /** Usuario que ejecutó la acción, si aplica. */
  performedBy?: Types.ObjectId | null;

  /** Snapshot anterior o datos relevantes antes del cambio. */
  previousData?: Record<string, any>;

  /** Datos nuevos o respuesta externa relacionada al evento. */
  newData?: Record<string, any>;

  /** Metadata adicional. */
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const employeeLoanRequestHistorySchema =
  new Schema<IEmployeeLoanRequestHistory>(
    {
      loanRequest: {
        type: Schema.Types.ObjectId,
        ref: "EmployeeLoanRequest",
        required: true,
        index: true,
      },

      action: {
        type: String,
        enum: EMPLOYEE_LOAN_REQUEST_HISTORY_ACTION,
        required: true,
        index: true,
      },

      fromStatus: {
        type: String,
        enum: [...EMPLOYEE_LOAN_REQUEST_STATUS, null],
        default: null,
        index: true,
      },

      toStatus: {
        type: String,
        enum: [...EMPLOYEE_LOAN_REQUEST_STATUS, null],
        default: null,
        index: true,
      },

      comment: {
        type: String,
        trim: true,
        default: "",
      },

      source: {
        type: String,
        enum: EMPLOYEE_LOAN_REQUEST_HISTORY_SOURCE,
        default: "SYSTEM",
        required: true,
        index: true,
      },

      performedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      previousData: {
        type: Schema.Types.Mixed,
        default: {},
      },

      newData: {
        type: Schema.Types.Mixed,
        default: {},
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    { timestamps: true },
  );

employeeLoanRequestHistorySchema.index({
  loanRequest: 1,
  createdAt: -1,
});

employeeLoanRequestHistorySchema.index({
  loanRequest: 1,
  action: 1,
  createdAt: -1,
});

employeeLoanRequestHistorySchema.index({
  source: 1,
  createdAt: -1,
});

employeeLoanRequestHistorySchema.index({
  performedBy: 1,
  createdAt: -1,
});

export default model<IEmployeeLoanRequestHistory>(
  "EmployeeLoanRequestHistory",
  employeeLoanRequestHistorySchema,
);