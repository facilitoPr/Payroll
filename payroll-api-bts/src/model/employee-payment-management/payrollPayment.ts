import mongoose, { Schema, model, Types } from "mongoose";

export type PayrollEarningSource =
  | "BASE_SALARY"
  | "HOURLY"
  | "COMMISSION"
  | "BONUS"
  | "MANUAL"
  | "OTHER";

export type PayrollAttendanceCalculationMode =
  | "FULL_PERIOD"
  | "FULL_PERIOD_WITH_DAY_ADJUSTMENTS"
  | "PAY_SELECTED_DAYS_ONLY"
  | "PAY_SELECTED_HOURS_ONLY";

export interface IPayrollPaymentDeductionLine {
  nombre: string;
  tipo?: string;
  valor?: number;
  modo?: string;
  montoMensual: number;
  montoPeriodo: number;
  isLegal?: boolean;
  type?: string;
  loanRequest?: string;
  requestNumber?: string;
  installmentNumber?: number;
  productCode?: string;
  productName?: string;
  bankAccountSnapshot?: Record<string, any>;
}

export interface IPayrollPaymentEarningLine {
  nombre: string;

  /**
   * Nuevo:
   * Código interno para identificar el concepto.
   * Ej: BASE_SALARY, HOURLY_SALARY, COMMISSION, BONUS, INCENTIVE.
   */
  code?: string;

  /**
   * Nuevo:
   * Tipo o categoría textual si la necesitas para reportes.
   */
  type?: string;

  /**
   * Nuevo:
   * Fuente del ingreso.
   */
  source?: PayrollEarningSource;

  montoMensual: number;
  montoPeriodo: number;

  /**
   * Nuevo:
   * Indica si este ingreso es salario ordinario.
   * Importante para prestaciones laborales.
   */
  isOrdinarySalary?: boolean;

  /**
   * Nuevo:
   * Indica si este ingreso cuenta para promedio de cesantía/preaviso.
   */
  includeForTerminationAverage?: boolean;

  /**
   * Nuevo:
   * Indica si este ingreso cuenta para salario de Navidad.
   */
  includeForChristmasSalary?: boolean;
}

export interface IPayrollLaborBaseSnapshot {
  /**
   * Sumatoria de ingresos ordinarios del período.
   * Este es el valor que luego se usa para promedios reales.
   */
  ordinarySalaryPeriod: number;

  /**
   * Sumatoria mensual equivalente de ingresos ordinarios.
   */
  ordinarySalaryMonthly: number;

  /**
   * Total del período que cuenta para promedio de cesantía/preaviso.
   */
  terminationAverageAmountPeriod: number;

  /**
   * Total del período que cuenta para salario de Navidad.
   */
  christmasSalaryAmountPeriod: number;

  /**
   * Ingresos no ordinarios o excluidos.
   */
  nonOrdinaryAmountPeriod: number;

  /**
   * Nombres/códigos incluidos para trazabilidad.
   */
  includedEarnings: string[];

  /**
   * Nombres/códigos excluidos para trazabilidad.
   */
  excludedEarnings: string[];

  /**
   * Versión de la lógica con la que fue generado este snapshot.
   */
  version: number;
}

export interface IPayrollPaymentSnapshot {
  company: {
    name: string;
    address: string;
    phone: string;
  };

  employee: {
    userId: string;
    name: string;
    email: string;

    departmentName?: string;
    jobPositionName?: string;

    tipoSalario?: string;
    baseSalary?: number;
    hourlyRate?: number;
    horasEstimadas?: number;
  };

  period: {
    start: string;
    end: string;
    payDate: string;
    frecuenciaPago: string;
    diasPago?: any;
  };

  earnings: IPayrollPaymentEarningLine[];

  legalDeductions: IPayrollPaymentDeductionLine[];
  otherDeductions: IPayrollPaymentDeductionLine[];

  detalleDeducciones: IPayrollPaymentDeductionLine[];
  employeeLoanDeductions?: any[];
  thirdPartyPayments?: any[];
  paymentDistribution?: Record<string, any>;
  employeeLoanDeductionDebug?: Record<string, any>;

  /**
   * Nuevo:
   * Snapshot listo para liquidación laboral.
   * Se guarda en el cierre de nómina.
   */
  laborBase?: IPayrollLaborBaseSnapshot;

  isr?: {
    baseISR: number;
    isrMensual: number;
    isrPeriodo: number;
    bracket?: any;
    tableMeta?: { year?: number; version?: number; id?: string };
  };

  attendance?: {
    version?: number;
    calculationMode?: PayrollAttendanceCalculationMode;
    attendanceCutoffDate?: string;
    compatibilityMode?: boolean;
    source?: string;
    generatedAt?: string;
    totals: {
      totalLateMinutes: number;
      totalNotWorkedMinutes: number;
      totalDiscountTardanzaPeriodo: number;
      totalDiscountAusenciaPeriodo: number;
      totalDiscountsPeriodo: number;
    };
    days: any[];
    lateOrAbsentDay: any[];
  };

  totals: {
    sueldoBrutoMensual: number;
    sueldoBrutoPeriodo: number;

    totalDeduccionesLegalesMensual: number;
    totalDeduccionesLegalesPeriodo: number;

    totalOtrasDeduccionesMensual: number;
    totalOtrasDeduccionesPeriodo: number;

    totalDeduccionesMensual: number;
    totalDeduccionesPeriodo: number;

    totalPrestamosEmpleadoPeriodo?: number;

    sueldoNetoMensual: number;
    sueldoNetoPeriodoBeforeEmployeeLoan?: number;
    sueldoNetoPeriodo: number;
  };
}

export interface IPayrollBankSnapshot {
  accountNumber: string;
  accountType: string;
  currency: string;
  bankCode: string;
  bankDigit: string;
  operationCode: string;
  idType: string;
  idNumber: string;
  beneficiaryName: string;
  referenceNumber: string;
  statementDescription: string;
  contactMethod: string;
  emailBenef: string;
  faxOrPhoneBenef: string;
  acquirerId: string;
  dueDate4: string;
}

export interface IPayrollPayment extends mongoose.Document {
  /**
   * Nuevo:
   * Compañía del pago. Opcional para no romper pagos viejos.
   */
  company?: Types.ObjectId | null;

  payrollRun: Types.ObjectId;
  user: Types.ObjectId;

  /**
   * Nuevo:
   * Campos indexables para buscar historial de pagos sin depender solo del snapshot.
   * Opcionales para no romper registros anteriores.
   */
  periodStart?: Date | null;
  periodEnd?: Date | null;
  payDate?: Date | null;
  year?: number | null;
  month?: number | null;
  periodKey?: string;

  employeeName: string;
  employeeEmail: string;

  emailedAt?: Date;
  emailError?: string;

  snapshot: IPayrollPaymentSnapshot;
  bankSnapshot?: IPayrollBankSnapshot;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const deductionLineSchema = new Schema<IPayrollPaymentDeductionLine>(
  {
    nombre: { type: String, required: true },
    tipo: { type: String },
    valor: { type: Number },
    modo: { type: String },
    montoMensual: { type: Number, default: 0 },
    montoPeriodo: { type: Number, default: 0 },
    isLegal: { type: Boolean, default: false },
    type: { type: String, default: "" },
    loanRequest: { type: String, default: "" },
    requestNumber: { type: String, default: "" },
    installmentNumber: { type: Number, default: 0 },
    productCode: { type: String, default: "" },
    productName: { type: String, default: "" },
    bankAccountSnapshot: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const earningLineSchema = new Schema<IPayrollPaymentEarningLine>(
  {
    nombre: { type: String, required: true },

    code: { type: String, default: "" },
    type: { type: String, default: "" },

    source: {
      type: String,
      enum: ["BASE_SALARY", "HOURLY", "COMMISSION", "BONUS", "MANUAL", "OTHER"],
      default: "OTHER",
    },

    montoMensual: { type: Number, default: 0 },
    montoPeriodo: { type: Number, default: 0 },

    isOrdinarySalary: { type: Boolean, default: true },
    includeForTerminationAverage: { type: Boolean, default: true },
    includeForChristmasSalary: { type: Boolean, default: true },
  },
  { _id: false },
);

const laborBaseSnapshotSchema = new Schema<IPayrollLaborBaseSnapshot>(
  {
    ordinarySalaryPeriod: { type: Number, default: 0 },
    ordinarySalaryMonthly: { type: Number, default: 0 },

    terminationAverageAmountPeriod: { type: Number, default: 0 },
    christmasSalaryAmountPeriod: { type: Number, default: 0 },

    nonOrdinaryAmountPeriod: { type: Number, default: 0 },

    includedEarnings: { type: [String], default: [] },
    excludedEarnings: { type: [String], default: [] },

    version: { type: Number, default: 1 },
  },
  { _id: false },
);

const snapshotSchema = new Schema<IPayrollPaymentSnapshot>(
  {
    company: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true },
    },

    employee: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },

      departmentName: { type: String },
      jobPositionName: { type: String },

      tipoSalario: { type: String },
      baseSalary: { type: Number },
      hourlyRate: { type: Number },
      horasEstimadas: { type: Number },
    },

    period: {
      start: { type: String, required: true },
      end: { type: String, required: true },
      payDate: { type: String, required: true },
      frecuenciaPago: { type: String, required: true },
      diasPago: { type: Schema.Types.Mixed },
    },

    earnings: { type: [earningLineSchema], default: [] },

    legalDeductions: { type: [deductionLineSchema], default: [] },
    otherDeductions: { type: [deductionLineSchema], default: [] },
    detalleDeducciones: { type: [deductionLineSchema], default: [] },
    employeeLoanDeductions: { type: [Object], default: [] },
    thirdPartyPayments: { type: [Object], default: [] },
    paymentDistribution: { type: Schema.Types.Mixed, default: {} },
    employeeLoanDeductionDebug: { type: Schema.Types.Mixed, default: {} },

    laborBase: {
      type: laborBaseSnapshotSchema,
      default: () => ({
        ordinarySalaryPeriod: 0,
        ordinarySalaryMonthly: 0,
        terminationAverageAmountPeriod: 0,
        christmasSalaryAmountPeriod: 0,
        nonOrdinaryAmountPeriod: 0,
        includedEarnings: [],
        excludedEarnings: [],
        version: 1,
      }),
    },

    isr: {
      baseISR: { type: Number, default: 0 },
      isrMensual: { type: Number, default: 0 },
      isrPeriodo: { type: Number, default: 0 },
      bracket: { type: Schema.Types.Mixed },
      tableMeta: { type: Schema.Types.Mixed },
    },

    attendance: {
      version: { type: Number, default: 1 },
      calculationMode: {
        type: String,
        enum: [
          "FULL_PERIOD",
          "FULL_PERIOD_WITH_DAY_ADJUSTMENTS",
          "PAY_SELECTED_DAYS_ONLY",
          "PAY_SELECTED_HOURS_ONLY",
        ],
        default: "FULL_PERIOD",
      },
      attendanceCutoffDate: { type: String, default: "" },
      compatibilityMode: { type: Boolean, default: true },
      source: { type: String, default: "PAYROLL_CLOSE" },
      generatedAt: { type: String, default: "" },
      totals: {
        totalLateMinutes: { type: Number, default: 0 },
        totalNotWorkedMinutes: { type: Number, default: 0 },
        totalDiscountTardanzaPeriodo: { type: Number, default: 0 },
        totalDiscountAusenciaPeriodo: { type: Number, default: 0 },
        totalDiscountsPeriodo: { type: Number, default: 0 },
      },
      days: { type: [], default: [] },
      lateOrAbsentDay: { type: [], default: [] },
    },

    totals: {
      sueldoBrutoMensual: { type: Number, default: 0 },
      sueldoBrutoPeriodo: { type: Number, default: 0 },

      totalDeduccionesLegalesMensual: { type: Number, default: 0 },
      totalDeduccionesLegalesPeriodo: { type: Number, default: 0 },

      totalOtrasDeduccionesMensual: { type: Number, default: 0 },
      totalOtrasDeduccionesPeriodo: { type: Number, default: 0 },

      totalDeduccionesMensual: { type: Number, default: 0 },
      totalDeduccionesPeriodo: { type: Number, default: 0 },

      totalPrestamosEmpleadoPeriodo: { type: Number, default: 0 },

      sueldoNetoMensual: { type: Number, default: 0 },
      sueldoNetoPeriodoBeforeEmployeeLoan: { type: Number, default: 0 },
      sueldoNetoPeriodo: { type: Number, default: 0 },
    },
  },
  { _id: false },
);

const bankSnapshotSchema = new Schema<IPayrollBankSnapshot>(
  {
    accountNumber: { type: String, default: "" },
    accountType: { type: String, default: "" },
    currency: { type: String, default: "" },
    bankCode: { type: String, default: "" },
    bankDigit: { type: String, default: "" },
    operationCode: { type: String, default: "" },
    idType: { type: String, default: "" },
    idNumber: { type: String, default: "" },
    beneficiaryName: { type: String, default: "" },
    referenceNumber: { type: String, default: "" },
    statementDescription: { type: String, default: "" },
    contactMethod: { type: String, default: "" },
    emailBenef: { type: String, default: "" },
    faxOrPhoneBenef: { type: String, default: "" },
    acquirerId: { type: String, default: "00" },
    dueDate4: { type: String, default: "" },
  },
  { _id: false },
);

const payrollPaymentSchema = new Schema<IPayrollPayment>(
  {
    /**
     * Nuevo y opcional.
     * No tiene required para no romper pagos viejos.
     */
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    payrollRun: {
      type: Schema.Types.ObjectId,
      ref: "PayrollRun",
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * Nuevos y opcionales.
     */
    periodStart: {
      type: Date,
      default: null,
      index: true,
    },

    periodEnd: {
      type: Date,
      default: null,
      index: true,
    },

    payDate: {
      type: Date,
      default: null,
      index: true,
    },

    year: {
      type: Number,
      default: null,
      index: true,
    },

    month: {
      type: Number,
      default: null,
      index: true,
    },

    periodKey: {
      type: String,
      default: "",
      index: true,
    },

    employeeName: { type: String, required: true },
    employeeEmail: { type: String, required: true, index: true },
    emailedAt: { type: Date },
    emailError: { type: String },

    bankSnapshot: { type: bankSnapshotSchema, default: () => ({}) },
    snapshot: { type: snapshotSchema, required: true },

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

payrollPaymentSchema.index(
  { payrollRun: 1, user: 1, isDeleted: 1 },
  { unique: false },
);

payrollPaymentSchema.index({
  company: 1,
  user: 1,
  periodEnd: -1,
  isDeleted: 1,
});

payrollPaymentSchema.index({
  user: 1,
  year: 1,
  month: 1,
  isDeleted: 1,
});

payrollPaymentSchema.index({
  company: 1,
  year: 1,
  month: 1,
  isDeleted: 1,
});

export default model<IPayrollPayment>("PayrollPayment", payrollPaymentSchema);
