import mongoose, { Schema, model, Types } from "mongoose";

export interface IPunchType extends mongoose.Document {
  code: string; // Ej: "4-punch"
  name: string; // Nombre descriptivo
  expectedPunches: string[]; // Ej: ["entrada", "salida_almuerzo", ...]
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const PunchTypeSchema = new Schema<IPunchType>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      enum: ["4-punch", "2-punch", "entry-only"], // opcional, lo puedes omitir para dejar abierto
    },
    name: {
      type: String,
      required: true,
    },
    expectedPunches: {
      type: [String],
      required: true,
      // Ej: ["entrada", "salida_almuerzo", "entrada_almuerzo", "salida"]
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// export default model<IBanner>("Banner", bannerSchema);
export default model<IPunchType>("PunchType", PunchTypeSchema);



