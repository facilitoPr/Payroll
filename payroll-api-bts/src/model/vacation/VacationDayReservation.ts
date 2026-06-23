import { Schema, model, Document, Types } from "mongoose";

export type VacationDayReservationStatus =
  | "ACTIVE"
  | "RELEASED"
  | "CONSUMED"
  | "CANCELLED";

export type VacationDayReservationSource =
  | "LOAN"
  | "MANUAL"
  | "OTHER"
  | "EMPLOYEE_LOAN_REQUEST";

export interface IVacationDayReservation extends Document {
  /** Empleado dueño de la reserva. */
  user: Types.ObjectId;

  /** Compañía relacionada. */
  company?: Types.ObjectId | null;

  /** Balance anual relacionado. */
  balance: Types.ObjectId;

  /** Año del balance. */
  year: number;

  /** Solicitud de préstamo relacionada. */
  loanRequest?: Types.ObjectId | null;

  /** Origen de la reserva. */
  source: VacationDayReservationSource;

  /** Cantidad de días reservados. */
  reservedDays: number;

  /** Estado actual de la reserva. */
  status: VacationDayReservationStatus;

  /** Motivo de la reserva. */
  reason: string;

  /** Fecha en que se reservó. */
  reservedAt: Date;

  /** Fecha en que se liberó. */
  releasedAt?: Date | null;

  /** Fecha en que se consumió. */
  consumedAt?: Date | null;

  /** Fecha en que se canceló. */
  cancelledAt?: Date | null;

  /** Usuario que creó la reserva. */
  createdBy: Types.ObjectId;

  /** Usuario que liberó la reserva. */
  releasedBy?: Types.ObjectId | null;

  /** Usuario que consumió la reserva. */
  consumedBy?: Types.ObjectId | null;

  /** Usuario que canceló la reserva. */
  cancelledBy?: Types.ObjectId | null;

  /** Información adicional. */
  metadata?: Record<string, any>;

  /** Indica si está activa. */
  isActive: boolean;

  /** Soft delete. */
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const vacationDayReservationSchema = new Schema<IVacationDayReservation>(
  {
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

    balance: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeVacationBalance",
      required: true,
      index: true,
    },

    year: {
      type: Number,
      required: true,
      index: true,
    },

    loanRequest: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeLoanRequest",
      default: null,
      index: true,
    },

    source: {
      type: String,
      enum: ["LOAN", "MANUAL", "OTHER", "EMPLOYEE_LOAN_REQUEST"],
      required: true,
      default: "LOAN",
    },

    reservedDays: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "RELEASED", "CONSUMED", "CANCELLED"],
      required: true,
      default: "ACTIVE",
      index: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    reservedAt: {
      type: Date,
      default: Date.now,
    },

    releasedAt: {
      type: Date,
      default: null,
    },

    consumedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    releasedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    consumedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

vacationDayReservationSchema.index({
  user: 1,
  year: 1,
  status: 1,
});

vacationDayReservationSchema.index({
  loanRequest: 1,
  status: 1,
});

export default model<IVacationDayReservation>(
  "VacationDayReservation",
  vacationDayReservationSchema,
);
