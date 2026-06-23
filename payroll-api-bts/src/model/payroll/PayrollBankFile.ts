import mongoose, { Schema, model, Types } from "mongoose";

export type PayrollBankFileStatus =
  | "GENERATED"
  | "SENT"
  | "CONFIRMED"
  | "REJECTED";

export interface IPayrollBankFileTotals {
  /** CantidadCR (11) en Header H: número de créditos (depósitos). */
  countCR: number;
  /** MontoTotalCR (13 N2) en Header H: suma de créditos en centavos. */
  totalCR: number; // en centavos

  /** CantidadDB (11) en Header H: normalmente 0 para nómina. */
  countDB: number;
  /** MontoTotalDB (13 N2) en Header H: normalmente 0 para nómina. */
  totalDB: number; // en centavos
}

export interface IPayrollBankFile extends mongoose.Document {
  /** Nómina asociada */
  payrollRun: Types.ObjectId;

  /** Perfil usado para construir el archivo */
  profile: Types.ObjectId;

  /** TipoServicio (2): para nómina automática "01" */
  tipoServicio: string;

  /** Secuencia Header (7) usada en H y en N */
  headerSequence: string;

  /** Moneda (3): 214/840/978 */
  currency: string;

  /** Nombre del archivo: PE + 5 + TS + MMDD + Seq(7) + E.TXT */
  fileName: string;

  /** Contenido TXT (ASCII) completo */
  content: string;

  /** Hash SHA-256 del contenido para integridad */
  sha256: string;

  /** Totales que deben cuadrar con el header */
  totals: IPayrollBankFileTotals;

  /** Fecha/hora de generación */
  generatedAt: Date;

  /** Estado del ciclo de vida */
  status: PayrollBankFileStatus;

  /** Warnings (por ejemplo: empleados con data bancaria en blanco, etc.) */
  warnings: string[];

  /** Soft delete */
  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const totalsSchema = new Schema<IPayrollBankFileTotals>(
  {
    countCR: { type: Number, default: 0 },
    totalCR: { type: Number, default: 0 },
    countDB: { type: Number, default: 0 },
    totalDB: { type: Number, default: 0 },
  },
  { _id: false }
);

const payrollBankFileSchema = new Schema<IPayrollBankFile>(
  {
    payrollRun: {
      type: Schema.Types.ObjectId,
      ref: "PayrollRun",
      required: true,
      index: true,
    },
    profile: {
      type: Schema.Types.ObjectId,
      ref: "BankFileProfile",
      required: false,
    },

    tipoServicio: { type: String, required: true },
    headerSequence: { type: String, required: true },
    currency: { type: String, required: true },

    fileName: { type: String, required: true, index: true },
    content: { type: String, required: true },
    sha256: { type: String, required: true, index: true },

    totals: { type: totalsSchema, default: () => ({}) },
    generatedAt: { type: Date, default: () => new Date(), index: true },

    status: {
      type: String,
      enum: ["GENERATED", "SENT", "CONFIRMED", "REJECTED"],
      default: "GENERATED",
      index: true,
    },

    warnings: { type: [String], default: [] },

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

payrollBankFileSchema.index({ payrollRun: 1, isDeleted: 1 }, { unique: false });

export default model<IPayrollBankFile>(
  "PayrollBankFile",
  payrollBankFileSchema
);
