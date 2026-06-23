import mongoose, { Schema, model } from "mongoose";

export interface IDeductionType extends mongoose.Document {
  name: string;               // Ej: "TSS", "INFOTEP", "Préstamo"
  code: string;               // Ej: "tss", "infotep", "loan"
  deducibleIsr: boolean;      // Ej: "TSS_Dependientes", no reduce la base del ISR
  isLegal: boolean;           // ¿Es un descuento obligatorio por ley?
  percentage?: number;        // Si se aplica como % del salario bruto
  fixedAmount?: number;       // Si es un monto fijo mensual
  isActive: boolean;
  description?: string;
  createdAt: string;
}

const deductionTypeSchema = new Schema<IDeductionType>({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  isLegal: { type: Boolean, required: true },
  percentage: { type: Number }, // Ej: 2.87
  fixedAmount: { type: Number }, // Ej: 1500
  isActive: { type: Boolean, default: true },
  deducibleIsr: { type: Boolean, default: false },

  description: { type: String },

  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

export default model<IDeductionType>("DeductionType", deductionTypeSchema);
