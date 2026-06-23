import mongoose, { Schema, model } from "mongoose";

export interface IIncomeTaxBracket {
  from: number; // Límite inferior del tramo
  to?: number | null; // Límite superior (null = infinito)
  rate: number; // Porcentaje (0.15 = 15%)
  fixedAmount?: number; // Monto fijo acumulado (opcional)
  label?: string; // Texto para UI
}

export interface IIncomeTaxRD extends mongoose.Document {
  year: number; // Año fiscal (ej: 2025)
  exemptAmount: number; // Monto exento
  brackets: IIncomeTaxBracket[];

  version: number; // Versión de la tabla
  isActive: boolean;
  isDeleted: boolean;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const incomeTaxBracketSchema = new Schema<IIncomeTaxBracket>(
  {
    from: { type: Number, required: true, min: 0 },
    to: { type: Number, default: null },
    rate: { type: Number, required: true, min: 0, max: 1 },
    fixedAmount: { type: Number, default: 0 },
    label: { type: String },
  },
  { _id: false }
);

const incomeTaxRDSchema = new Schema<IIncomeTaxRD>(
  {
    year: {
      type: Number,
      required: true,
      index: true,
    },

    exemptAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    brackets: {
      type: [incomeTaxBracketSchema],
      required: true,
      validate: {
        validator: (arr: IIncomeTaxBracket[]) =>
          Array.isArray(arr) && arr.length > 0,
        message: "Debe incluir al menos un tramo ISR.",
      },
    },

    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

incomeTaxRDSchema.index({ year: 1, version: -1 });
incomeTaxRDSchema.index({ isActive: 1, isDeleted: 1 });

export default model<IIncomeTaxRD>("IncomeTaxRD", incomeTaxRDSchema);
