import { Schema, model, Document, Types } from "mongoose";

export const TRAINING_CONTENT_TYPES = [
  "TEXT",
  "YOUTUBE",
  "PDF",
  "IMAGE",
  "FILE",
] as const;

export type TrainingContentType = (typeof TRAINING_CONTENT_TYPES)[number];

export interface ITrainingContentBlock extends Document {
  /** Entrenamiento al que pertenece este bloque */
  training: Types.ObjectId;

  /** Tipo de bloque */
  type: TrainingContentType;

  /** Título del bloque */
  title?: string | null;

  /** Descripción corta del bloque */
  description?: string | null;

  /** Contenido en texto enriquecido o HTML si el tipo es TEXT */
  content?: string | null;

  /** URL del recurso, por ejemplo YouTube o archivo alojado */
  url?: string | null;

  /** Orden de visualización dentro del entrenamiento */
  order: number;

  /** Indica si este bloque debe verse obligatoriamente */
  isRequired: boolean;

  /** Indica si está activo */
  isActive: boolean;

  /** Indica si fue eliminado lógicamente */
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

const TrainingContentBlockSchema = new Schema<ITrainingContentBlock>(
  {
    training: {
      type: Schema.Types.ObjectId,
      ref: "Training",
      required: true,
    },
    type: {
      type: String,
      enum: TRAINING_CONTENT_TYPES,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    content: {
      type: String,
      default: null,
    },
    url: {
      type: String,
      default: null,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    isRequired: {
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
  {
    timestamps: true,
  },
);

TrainingContentBlockSchema.pre("validate", function (next) {
  const block = this as ITrainingContentBlock;

  if (block.type === "TEXT" && !block.content) {
    return next(new Error("El bloque de tipo TEXT requiere content"));
  }

  if (["YOUTUBE", "PDF", "IMAGE", "FILE"].includes(block.type) && !block.url) {
    return next(new Error(`El bloque de tipo ${block.type} requiere url`));
  }

  next();
});

TrainingContentBlockSchema.index({ training: 1, order: 1 });
TrainingContentBlockSchema.index({ training: 1, isDeleted: 1 });

export default model<ITrainingContentBlock>(
  "TrainingContentBlock",
  TrainingContentBlockSchema,
);