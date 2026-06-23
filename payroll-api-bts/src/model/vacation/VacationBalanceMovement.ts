import { Schema, model, Document, Types } from "mongoose";

const MOVEMENT_TYPES = [
  "INITIAL_ASSIGNMENT",
  "VACATION_APPROVED",
  "VACATION_CANCELLED",
  "MANUAL_ADJUSTMENT",
  "LOAN_RESERVATION",
  "LOAN_RELEASE",
  "LOAN_CONSUMED",
  "VACATION_ACCRUAL_RECALCULATION",
  "VACATION_CARRY_OVER",
  "VACATION_EXPIRED",
] as const;

export type VacationMovementType = typeof MOVEMENT_TYPES[number];

export interface IVacationBalanceMovement extends Document {
  /** Balance anual afectado. */
  balance: Types.ObjectId;

  /** Empleado afectado. */
  user: Types.ObjectId;

  /** Compañía relacionada. */
  company?: Types.ObjectId | null;

  /** Año del balance. */
  year: number;

  /** Tipo de movimiento. */
  type: VacationMovementType;

  /** Cantidad de días del movimiento. */
  days: number;

  /** Días disponibles antes del movimiento. */
  previousAvailableDays: number;

  /** Días disponibles después del movimiento. */
  newAvailableDays: number;

  /** Solicitud de permiso relacionada. */
  permissionRequest?: Types.ObjectId | null;

  /** Solicitud de préstamo relacionada. */
  loanRequest?: Types.ObjectId | null;

  /** Motivo del movimiento. */
  reason: string;

  /** Usuario que ejecutó el movimiento. */
  performedBy: Types.ObjectId;

  /** Información adicional del movimiento. */
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const vacationBalanceMovementSchema = new Schema<IVacationBalanceMovement>(
  {
    balance: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeVacationBalance",
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    year: {
      type: Number,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: MOVEMENT_TYPES,
      required: true,
      index: true,
    },

    days: {
      type: Number,
      required: true,
    },

    previousAvailableDays: {
      type: Number,
      required: true,
    },

    newAvailableDays: {
      type: Number,
      required: true,
    },

    permissionRequest: {
      type: Schema.Types.ObjectId,
      ref: "PermissionRequest",
      default: null,
      index: true,
    },

    loanRequest: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeLoanRequest",
      default: null,
      index: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

export default model<IVacationBalanceMovement>(
  "VacationBalanceMovement",
  vacationBalanceMovementSchema,
);
