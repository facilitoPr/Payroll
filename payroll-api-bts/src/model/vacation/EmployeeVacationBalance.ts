import { Schema, model, Document, Types } from "mongoose";

export interface IEmployeeVacationBalance extends Document {
  /** Empleado dueño del balance. */
  user: Types.ObjectId;

  /** Compañía del empleado. */
  company?: Types.ObjectId | null;

  /** Año del balance. */
  year: number;

  /** Política aplicada al balance. */
  policy?: Types.ObjectId | null;

  /**
   * Días disfrutables asignados.
   * En tu regla de negocio, aunque tenga 5+ años, puede quedarse en 14.
   */
  assignedDays: number;

  /**
   * Base legal/económica para pago de vacaciones.
   * Ej: 14 antes de 5 años, 18 luego de 5 años.
   */
  paymentBaseDays: number;

  /**
   * Días causados para pago, liquidación o garantía.
   * Ej: 5 meses = 6, 6 meses = 7, 7 meses = 8.
   */
  accruedPaymentDays: number;

  /**
   * Días realmente disfrutables.
   * Antes de cumplir el año puede ser 0.
   */
  enjoyableDays: number;

  /** Días usados por vacaciones aprobadas. */
  usedDays: number;

  /** Ajustes manuales realizados por RRHH. */
  adjustmentDays: number;

  /**
   * Días comprometidos como garantía económica de préstamos.
   *
   * IMPORTANTE:
   * Estos días no bloquean el disfrute normal de las vacaciones.
   * Solamente reducen la capacidad de solicitar otro préstamo y el
   * monto neto pagable en una liquidación mientras la reserva esté activa.
   */
  reservedDays: number;

  /**
   * Días disponibles para disfrutar vacaciones.
   *
   * Las reservas de préstamo NO se descuentan aquí.
   * Fórmula:
   * enjoyableDays + carryOverDays + adjustmentDays - usedDays
   */
  availableDays: number;

  /**
   * Días disponibles para garantizar nuevos préstamos.
   *
   * Las reservas activas SÍ se descuentan aquí para impedir que los mismos
   * días se utilicen como garantía en más de un préstamo.
   * Fórmula:
   * accruedPaymentDays + carryOverDays + adjustmentDays
   * - usedDays - reservedDays
   */
  availableForLoanDays: number;

  /**
   * Días pagables brutos si se desvincula.
   * Fórmula:
   * accruedPaymentDays + carryOverDays + adjustmentDays - usedDays
   */
  payableVacationDays: number;

  /**
   * Días pagables netos tomando en cuenta garantías activas.
   * Fórmula:
   * accruedPaymentDays + carryOverDays + adjustmentDays
   * - usedDays - reservedDays
   */
  netPayableVacationDays: number;

  /** Meses cumplidos desde la fecha de ingreso. */
  serviceMonths: number;

  /** Años cumplidos desde la fecha de ingreso. */
  serviceYears: number;

  /** Fecha de inicio del ciclo laboral actual. */
  cycleStartDate?: Date | null;

  /** Fecha de fin del ciclo laboral actual. */
  cycleEndDate?: Date | null;

  /** Última fecha en que se recalculó este balance. */
  lastCalculatedAt?: Date | null;

  /** Indica si RRHH modificó manualmente el balance. */
  hasManualOverride: boolean;

  /** Nota interna del balance o último ajuste. */
  notes?: string;

  /** Usuario que creó el balance. */
  createdBy?: Types.ObjectId;

  /** Usuario que actualizó el balance. */
  updatedBy?: Types.ObjectId;

  /** Días arrastrados desde ciclos anteriores. */
  carryOverDays: number;

  /** Días que se perdieron porque la política no permite acumularlos. */
  expiredDays: number;

  /** Fecha en que se procesó el arrastre o pérdida del ciclo. */
  carryOverProcessedAt?: Date | null;

  /** Indica si ya se envió alerta de vencimiento para este ciclo. */
  vacationExpirationReminderSentAt?: Date | null;

  /** Indica si está activo. */
  isActive: boolean;

  /** Soft delete. */
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const employeeVacationBalanceSchema = new Schema<IEmployeeVacationBalance>(
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

    year: {
      type: Number,
      required: true,
      index: true,
    },

    policy: {
      type: Schema.Types.ObjectId,
      ref: "LeavePolicy",
      default: null,
    },

    assignedDays: {
      type: Number,
      required: true,
      default: 14,
      min: 0,
    },

    paymentBaseDays: {
      type: Number,
      required: true,
      default: 14,
      min: 0,
    },

    accruedPaymentDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    enjoyableDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    usedDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    adjustmentDays: {
      type: Number,
      required: true,
      default: 0,
    },

    reservedDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    availableDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    availableForLoanDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    payableVacationDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    netPayableVacationDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    serviceMonths: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    serviceYears: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    cycleStartDate: {
      type: Date,
      default: null,
    },

    cycleEndDate: {
      type: Date,
      default: null,
    },

    lastCalculatedAt: {
      type: Date,
      default: null,
    },

    hasManualOverride: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      default: "",
    },

    carryOverDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    expiredDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    carryOverProcessedAt: {
      type: Date,
      default: null,
    },

    vacationExpirationReminderSentAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

/**
 * Recalcula todos los campos derivados antes de guardar.
 *
 * REGLA PRINCIPAL:
 * reservedDays representa una garantía económica del préstamo.
 * No reduce availableDays, porque el empleado puede disfrutar sus vacaciones
 * normalmente aunque tenga días comprometidos como garantía.
 */
employeeVacationBalanceSchema.pre("save", function (next) {
  const enjoyableBase =
    Number(this.enjoyableDays || 0) +
    Number(this.carryOverDays || 0) +
    Number(this.adjustmentDays || 0);

  const paymentBase =
    Number(this.accruedPaymentDays || 0) +
    Number(this.carryOverDays || 0) +
    Number(this.adjustmentDays || 0);

  const usedDays = Number(this.usedDays || 0);
  const reservedDays = Number(this.reservedDays || 0);

  /**
   * Disfrute normal de vacaciones.
   * No se descuentan reservas de préstamo.
   */
  this.availableDays = Math.max(0, enjoyableBase - usedDays);

  /**
   * Capacidad restante para garantizar otro préstamo.
   * Sí se descuentan las reservas activas.
   */
  this.availableForLoanDays = Math.max(
    0,
    paymentBase - usedDays - reservedDays,
  );

  /**
   * Valor bruto pagable de vacaciones.
   */
  this.payableVacationDays = Math.max(0, paymentBase - usedDays);

  /**
   * Valor neto pagable luego de considerar garantías activas.
   */
  this.netPayableVacationDays = Math.max(
    0,
    paymentBase - usedDays - reservedDays,
  );

  next();
});

employeeVacationBalanceSchema.index(
  { user: 1, year: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

export default model<IEmployeeVacationBalance>(
  "EmployeeVacationBalance",
  employeeVacationBalanceSchema,
);
