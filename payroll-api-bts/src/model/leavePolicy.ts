import { Schema, model, Document, Types } from "mongoose";

export type VacationCarryOverMode = "NONE" | "LIMITED" | "UNLIMITED";

export interface ILeavePolicy extends Document {
  /** Compañía a la que pertenece esta política. Si es null, es política global. */
  company?: Types.ObjectId | null;

  /** Nombre visible de la política. */
  name: string;

  /** Código interno único de la política. */
  code: string;

  /** Días de vacaciones por defecto. */
  defaultVacationDays: number;

  /**
   * Días base para pago/préstamo luego de cierta antigüedad.
   * Ojo: esto NO significa que el empleado disfrute 18 días.
   */
  seniorityVacationDays: number;

  /** Años necesarios para aplicar seniorityVacationDays. */
  seniorityYears: number;

  /** Días mínimos de antelación para solicitar permisos. */
  permissionAdvanceDays: number;

  /** Días mínimos de antelación para solicitar vacaciones. */
  vacationAdvanceDays: number;

  /**
   * Define si las vacaciones no usadas se acumulan o no.
   * NONE = se pierden al cerrar el ciclo.
   * LIMITED = se acumulan con límite.
   * UNLIMITED = se acumulan sin límite.
   */
  vacationCarryOverMode: VacationCarryOverMode;

  /**
   * Cantidad máxima de años que puede acumular.
   * Ej: 2 significa que puede acumular hasta 2 años.
   * Solo aplica cuando vacationCarryOverMode = LIMITED.
   */
  maxCarryOverYears: number;

  /**
   * Cantidad máxima de días acumulables.
   * Si es 0, se calcula usando defaultVacationDays * maxCarryOverYears.
   * Solo aplica cuando vacationCarryOverMode = LIMITED.
   */
  maxCarryOverDays: number;

  /**
   * Indica si el sistema debe notificar antes de que el ciclo cierre
   * y el empleado pierda vacaciones.
   */
  notifyBeforeVacationExpiration: boolean;

  /**
   * Días antes del cierre del ciclo en que se enviará la notificación.
   * Ej: 30 = avisar un mes antes.
   */
  vacationExpirationReminderDays: number;

  /**
   * Permite usar días acumulados anteriores como base para garantía de préstamo.
   */
  includeCarryOverInLoanGuarantee: boolean;

  /** Permite editar manualmente días de vacaciones por empleado. */
  allowEmployeeOverride: boolean;

  /** Permite que el balance de vacaciones quede negativo. */
  allowNegativeBalance: boolean;

  /** Indica si está activa. */
  isActive: boolean;

  /** Soft delete. */
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const leavePolicySchema = new Schema<ILeavePolicy>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    defaultVacationDays: {
      type: Number,
      required: true,
      default: 14,
      min: 0,
    },

    seniorityVacationDays: {
      type: Number,
      required: true,
      default: 18,
      min: 0,
    },

    seniorityYears: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },

    permissionAdvanceDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    vacationAdvanceDays: {
      type: Number,
      required: true,
      default: 7,
      min: 0,
    },

    vacationCarryOverMode: {
      type: String,
      enum: ["NONE", "LIMITED", "UNLIMITED"],
      required: true,
      default: "NONE",
      index: true,
    },

    maxCarryOverYears: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    maxCarryOverDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    notifyBeforeVacationExpiration: {
      type: Boolean,
      default: true,
    },

    vacationExpirationReminderDays: {
      type: Number,
      required: true,
      default: 30,
      min: 0,
    },

    includeCarryOverInLoanGuarantee: {
      type: Boolean,
      default: true,
    },

    allowEmployeeOverride: {
      type: Boolean,
      default: true,
    },

    allowNegativeBalance: {
      type: Boolean,
      default: false,
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

leavePolicySchema.index(
  { company: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

export default model<ILeavePolicy>("LeavePolicy", leavePolicySchema);