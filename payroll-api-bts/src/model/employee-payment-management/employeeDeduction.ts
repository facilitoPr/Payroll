import mongoose, { Schema, model, Types } from "mongoose";

export interface IEmployeeDeduction extends mongoose.Document {
  user: Types.ObjectId;          // Referencia al empleado
  deductionType: Types.ObjectId;     // Referencia al tipo de deducción

  isEnabled: boolean;                // Si está activo para este empleado

  customPercentage?: number;         // Si se quiere un % distinto al de DeductionType
  customAmount?: number;             // Si se quiere un monto fijo distinto

  createdAt: string;
  updatedAt: string;
}

const employeeDeductionSchema = new Schema<IEmployeeDeduction>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deductionType: {
    type: Schema.Types.ObjectId,
    ref: "DeductionType",
    required: true,
  },
  isEnabled: {
    type: Boolean,
    default: true,
    required: true,
  },
  customPercentage: {
    type: Number,
  },
  customAmount: {
    type: Number,
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
  updatedAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

export default model<IEmployeeDeduction>("EmployeeDeduction", employeeDeductionSchema);
