import mongoose, { Schema, model, Types } from "mongoose";
import { IRole } from "../role";
import bcrypt from 'bcrypt';
import { ISalaryType } from "../employee-payment-management/salaryType";
import { IPaymentSchedule } from "../employee-payment-management/paymentSchedule";

export type AccountType =
  | "1" // Cuenta corriente
  | "2" // Cuenta de ahorro
  | "3" // Tarjeta de credito
  | "4" // Prestamo
  | "5" // Cheque
  | "6" // Cuenta contable
  | "7" // Tarjeta de debito popular
  | "8"; // Cuenta wallet

export type Currency =
  | "214" //DOP
  | "840" // USD
  | "978"; // EUR

export type IdType = "RN" | "CE" | "PS" | "OT";
export type ContactMethod =
  | 1 // Email
  | 2 // Fax
  | 3; // Telefono solo para código de Operación 28 o 38

export interface ScheduleDay {
  isActive: boolean;
  hasLunchTime: boolean;
  entryTime: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
  exitTime: string;
  workHours?: number;
}

export interface PayrollBankInfo {
  enabled: boolean;
  accountNumber: string; // (máx 20 chars)
  accountType: AccountType;
  currency: Currency;

  bankCode: string;
  bankDigit: string;

  /**
   * Código de operación (2).
   * Ejemplos comunes según layout:
   * - "22" = Crédito a cuenta corriente
   * - "32" = Crédito a cuenta de ahorro
   * (Debe corresponder al tipo de cuenta y al servicio)
   */
  operationCode: string;
  idType: IdType;
  idNumber: string;

  /**
   * Referencia (12) opcional.
   * En el registro N: "NumeroReferencia (12)".
   * Ej: nómina + runId corto, código interno, etc.
   */
  referenceNumber: string;

  /**
   * Descripción para el estado de cuenta del empleado (40).
   * En el registro N: "Descripcion Estado Destino (40)".
   * Ej: "NOMINA", "PAGO QUINCENA", etc.
   */
  statementDescription: string;


  contactMethod: ContactMethod;
  emailBenef: string;
  faxOrPhoneBenef: string;

  /**
   * Identificador de adquiriente (2) normalmente "00" si no aplica.
   */
  acquirerId: string;

  /**
   * Fecha vencimiento (4) solo aplica para ciertos códigos de operación (ej: 57).
   * Formato depende del banco/layout (en doc es 4 chars).
   */
  dueDate4: string;
}

export type EmploymentStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "ON_LEAVE"
  | "TERMINATED";

export interface EmployeeTerminationInfo {
  lastTermination?: Types.ObjectId | null;
  terminationDate?: string;
  terminationType?: string;
  terminationReason?: string;
  terminatedBy?: Types.ObjectId | null;
  terminatedAt?: Date | null;
}

export interface EmployeeProbationInfo {
  enabled: boolean;
  startDate?: string;
  endDate?: string;
  completedAt?: Date | null;
}

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  address?: string;
  isActived: boolean;
  phone: string;
  password: string;
  img: string;
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  rol: Types.ObjectId | IRole;
  code: string;

  idNumber: string;
  punchTypeId: Types.ObjectId;
  schedule: {
    lunes?: ScheduleDay;
    martes?: ScheduleDay;
    miercoles?: ScheduleDay;
    jueves?: ScheduleDay;
    viernes?: ScheduleDay;
    sabado?: ScheduleDay;
    domingo?: ScheduleDay;
  };

  code_punch: string;
  document: string;
  contract: string;
  hiringDate: string;

  salaryType: Types.ObjectId | ISalaryType;
  paymentSchedule: Types.ObjectId | IPaymentSchedule;
  baseSalary?: number;
  hourlyRate?: number;

  terminationDate?: string;

  company: Types.ObjectId;
  department: Types.ObjectId;
  project: Types.ObjectId;
  jobPosition: Types.ObjectId;

  weeklyWorkHours?: number;
  totalWeeklyMinutes?: number;
  totalWeeklyHours?: number;

  operatorNameNumber?: string;
  ext?: string;
  recruitmentApplication?: Types.ObjectId;
  payrollBank?: PayrollBankInfo;

  employmentStatus: EmploymentStatus;
  terminationInfo?: EmployeeTerminationInfo;
  probation?: EmployeeProbationInfo;

  comparePassword(candidate: string): Promise<boolean>;
}

const scheduleDaySchema = new Schema(
  {
    isActive: { type: Boolean, default: false },
    hasLunchTime: { type: Boolean, default: false },
    entryTime: { type: String },
    lunchStartTime: { type: String },
    lunchEndTime: { type: String },
    exitTime: { type: String },
  },
  { _id: false }
);

const scheduleSchema = new Schema(
  {
    lunes: { type: scheduleDaySchema, default: () => ({}) },
    martes: { type: scheduleDaySchema, default: () => ({}) },
    miercoles: { type: scheduleDaySchema, default: () => ({}) },
    jueves: { type: scheduleDaySchema, default: () => ({}) },
    viernes: { type: scheduleDaySchema, default: () => ({}) },
    sabado: { type: scheduleDaySchema, default: () => ({}) },
    domingo: { type: scheduleDaySchema, default: () => ({}) },
  },
  { _id: false, minimize: false }
);

const payrollBankSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    accountNumber: { type: String, default: "" },
    accountType: { type: String, default: "1" },
    currency: { type: String, default: "214", maxLength: 3 },
    bankCode: { type: String, default: "10101070", maxLength: 8 },

    // Dígito verificador banco (1)
    bankDigit: { type: String, default: "", maxLength: 1 },

    // Código operación (2): "22", "32", etc.
    operationCode: { type: String, default: "" },

    // Tipo identificación (2): RN/CE/PS/OT
    idType: { type: String, default: "" },

    // Identificación (15): cédula/RNC/pasaporte
    idNumber: { type: String, default: "" },

    // Referencia (12)
    referenceNumber: { type: String, default: "" },

    // Descripción (40) para estado de cuenta
    statementDescription: { type: String, default: "NOMINA" },

    // Contacto (1): "", "1", "2", "3"
    contactMethod: { type: String, default: "" },

    // Email beneficiario (40)
    emailBenef: { type: String, default: "" },

    // Fax/Teléfono (12)
    faxOrPhoneBenef: { type: String, default: "" },

    // Adquiriente (2) normalmente "00"
    acquirerId: { type: String, default: "00" },

  },
  { _id: false }
);

const employeeTerminationInfoSchema = new Schema(
  {
    lastTermination: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeTermination",
      default: null,
    },
    terminationDate: { type: String, default: "" },
    terminationType: { type: String, default: "" },
    terminationReason: { type: String, default: "" },
    terminatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    terminatedAt: { type: Date, default: null },
  },
  { _id: false },
);

const employeeProbationSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    completedAt: { type: Date, default: null },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      unique: true,
      require: false,
    },
    phone: {
      type: String,
      require: false,
      default: "",
    },
    password: {
      type: String,
      require: true,
    },
    img: {
      type: String,
      require: false,
      default: "",
    },
    document: {
      type: String,
      require: false,
      default: "",
    },
    contract: {
      type: String,
      require: false,
      default: "",
    },
    code: {
      type: String,
      require: false,
      default: "",
    },
    code_punch: {
      type: String,
      require: false,
      default: "",
    },
    isActived: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    rol: {
      type: Schema.Types.ObjectId,
      ref: "Roles",
      require: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
      require: false,
    },

    created_at: {
      type: String,
      default: new Date().toISOString(),
      require: true,
    },
    updated_at: {
      type: String,
      default: new Date().toISOString(),
      require: true,
    },

    schedule: { type: scheduleSchema, default: () => ({}) },
    payrollBank: { type: payrollBankSchema, default: () => ({}) },

    punchTypeId: {
      type: Schema.Types.ObjectId,
      ref: "PunchType",
      required: false,
    },
    hiringDate: {
      type: String,
      default: new Date().toISOString(),
      require: false,
    },

    salaryType: {
      type: Schema.Types.ObjectId,
      ref: "SalaryType",
      required: true,
    },

    paymentSchedule: {
      type: Schema.Types.ObjectId,
      ref: "PaymentSchedule",
      required: true,
    },

    baseSalary: {
      type: Number,
      required: function (this: any) {
        return this.salaryType?.code === "FIJO";
      },
    },

    hourlyRate: {
      type: Number,
      required: function (this: any) {
        return this.salaryType?.code === "HORAS";
      },
    },

    terminationDate: { type: String },

    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      require: false,
    },
    jobPosition: {
      type: Schema.Types.ObjectId,
      ref: "JobPosition",
      require: false,
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      require: false,
    },

    weeklyWorkHours: { type: Number, default: 0 },
    totalWeeklyMinutes: { type: Number, default: 0 },
    totalWeeklyHours: { type: Number, default: 0 },
    idNumber: { type: String, default: "" },
    address: { type: String, default: "" },

    operatorNameNumber: {
      type: String,
    },
    ext: {
      type: String,
      require: false,
      default: null,
    },
    recruitmentApplication: {
      type: Schema.Types.ObjectId,
      ref: "RecruitmentApplication",
      require: false,
      default: null,
    },
    employmentStatus: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "ON_LEAVE", "TERMINATED"],
      default: "ACTIVE",
      index: true,
    },

    terminationInfo: {
      type: employeeTerminationInfoSchema,
      default: () => ({}),
    },

    probation: {
      type: employeeProbationSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  // @ts-ignore
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string) {
  if (!candidate) {
    throw new Error("Candidate password is required");
  }

  if (!this.password) {
    throw new Error("Stored password hash not found");
  }

  return bcrypt.compare(candidate, this.password);
};

export default model<IUser>("User", userSchema);