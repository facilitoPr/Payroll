import mongoose, { Schema, model, Types } from "mongoose";

export type LateGraceMode = "FULL_GRACE" | "DEDUCT_AFTER_GRACE";

export interface IPayrollPolicy extends mongoose.Document {
  // Empresa a la que pertenece esta política.
  company: Types.ObjectId;

  // Nombre visible de la política.
  name: string;

  // Código interno opcional para identificar la política.
  code: string;

  // Descripción administrativa de la política.
  description?: string;

  // Indica si se aplican minutos de gracia en tardanzas.
  lateGraceEnabled: boolean;

  // Cantidad de minutos de gracia para tardanzas.
  lateGraceMinutes: number;

  /**
   * FULL_GRACE:
   * - Si llega tarde dentro de la gracia, no descuenta nada.
   * - Si pasa la gracia, descuenta todos los minutos tarde.
   *
   * DEDUCT_AFTER_GRACE:
   * - Si llega tarde 12 min y tiene 5 min de gracia, descuenta 7 min.
   */
  lateGraceMode: LateGraceMode;

  // Indica si se deben descontar tardanzas.
  deductLateArrivals: boolean;

  // Indica si se deben descontar ausencias o tiempo no trabajado.
  deductAbsences: boolean;

  // Factor de días del mes para calcular el valor diario en RD.
  rdFactorDiasMes: number;

  // Indica si los descuentos se calculan usando sueldo bruto.
  useGrossSalaryForDailyDiscount: boolean;

  // Indica si se exige que los días estén confirmados antes de cerrar nómina.
  requireConfirmedDaysDefault: boolean;

  // Permite cerrar nómina aunque haya días incompletos.
  allowIncompleteDaysOnClose: boolean;

  // Indica si los permisos pagados deben marcarse automáticamente como sin descuento.
  autoPaidLeaveNoDeduct: boolean;

  // Notas administrativas.
  notes?: string;

  // Usuario que creó la política.
  createdBy?: Types.ObjectId;

  // Usuario que actualizó la política por última vez.
  updatedBy?: Types.ObjectId;

  // Estado activo.
  isActive: boolean;

  // Soft delete.
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const payrollPolicySchema = new Schema<IPayrollPolicy>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      default: "Política de nómina",
    },

    code: {
      type: String,
      trim: true,
      default: "DEFAULT_PAYROLL_POLICY",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    lateGraceEnabled: {
      type: Boolean,
      default: true,
    },

    lateGraceMinutes: {
      type: Number,
      default: 5,
      min: 0,
    },

    lateGraceMode: {
      type: String,
      enum: ["FULL_GRACE", "DEDUCT_AFTER_GRACE"],
      default: "FULL_GRACE",
    },

    deductLateArrivals: {
      type: Boolean,
      default: true,
    },

    deductAbsences: {
      type: Boolean,
      default: true,
    },

    rdFactorDiasMes: {
      type: Number,
      default: 23.83,
      min: 1,
    },

    useGrossSalaryForDailyDiscount: {
      type: Boolean,
      default: true,
    },

    requireConfirmedDaysDefault: {
      type: Boolean,
      default: true,
    },

    allowIncompleteDaysOnClose: {
      type: Boolean,
      default: false,
    },

    autoPaidLeaveNoDeduct: {
      type: Boolean,
      default: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

payrollPolicySchema.index(
  {
    company: 1,
    isActive: 1,
    isDeleted: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
      isDeleted: false,
    },
  },
);

export default model<IPayrollPolicy>("PayrollPolicy", payrollPolicySchema);