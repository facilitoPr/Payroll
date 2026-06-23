import { Schema, model, Types } from "mongoose";

export interface IIncentiveProgram {
  name: string;

  /** Código corto interno (ej: "OPERADORES_2026") - útil para buscar y versionar */
  code: string;
  description?: string;

  /**
   * Mes de inicio en formato YYYY-MM (ej: "2026-02")
   * Sirve para limitar cálculos / dashboards por vigencia.
   */
  startMonth: string;

  /**
   * Mes de fin en formato YYYY-MM (ej: "2026-12")
   * Opcional: si no se define, se asume “indefinido”.
   */
  endMonth?: string;

  /**
   * Si quieres limitar el programa a ciertos departamentos/localidades/equipos.
   * Ej: ["TRIPLE_S"] o ["SANTO_DOMINGO_1", "SANTIAGO"]
   */
  scopeCodes?: string[];

  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  isActive: boolean;
  isDeleted: boolean;
}

const IncentiveProgramSchema = new Schema<IIncentiveProgram>(
  {
    name: { type: String, required: true, trim: true },

    code: { type: String, required: true, trim: true, uppercase: true },

    description: { type: String, default: null, trim: true },

    startMonth: { type: String, required: true, trim: true }, // "YYYY-MM"
    endMonth: { type: String, default: null, trim: true }, // "YYYY-MM"

    scopeCodes: { type: [String], default: [] },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

IncentiveProgramSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

IncentiveProgramSchema.index({ isActive: 1, isDeleted: 1 });

const IncentiveProgram = model<IIncentiveProgram>(
  "IncentiveProgram",
  IncentiveProgramSchema,
);
export default IncentiveProgram;

