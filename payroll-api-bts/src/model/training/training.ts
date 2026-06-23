import { Schema, model, Document, Types } from "mongoose";

export const TRAINING_TYPES = ["LESSON", "QUIZ", "MIXED"] as const;
export const TRAINING_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type TrainingType = (typeof TRAINING_TYPES)[number];
export type TrainingStatus = (typeof TRAINING_STATUS)[number];

export interface ITraining extends Document {
  /** Título principal del entrenamiento */
  title: string;

  /** Código interno opcional para identificar el entrenamiento */
  code?: string;

  /** Descripción general del entrenamiento */
  description?: string;

  /** Tipo de entrenamiento: solo lección, solo cuestionario o mixto */
  type: TrainingType;

  /** Instrucciones generales para el usuario */
  instructions?: string;

  /** Imagen de portada o miniatura */
  thumbnail?: string | null;

  /** Tiempo estimado en minutos */
  estimatedMinutes: number;

  /** Puntaje mínimo para aprobar en porcentaje (0-100) */
  passScore: number;

  /** Cantidad máxima de intentos permitidos; 0 = ilimitado */
  maxAttempts: number;

  /** Indica si este entrenamiento es obligatorio */
  isMandatory: boolean;

  /** Fecha desde la que estará disponible */
  startDate?: Date | null;

  /** Fecha límite o fecha final de disponibilidad */
  endDate?: Date | null;

  /** Estado del entrenamiento */
  status: TrainingStatus;

  /** Usuario que creó el entrenamiento */
  createdBy: Types.ObjectId;

  /** Indica si está activo */
  isActive: boolean;

  /** Indica si fue eliminado lógicamente */
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

const TrainingSchema = new Schema<ITraining>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    type: {
      type: String,
      enum: TRAINING_TYPES,
      required: true,
      default: "MIXED",
    },
    instructions: {
      type: String,
      trim: true,
      default: null,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    estimatedMinutes: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    passScore: {
      type: Number,
      required: true,
      default: 70,
      min: 0,
      max: 100,
    },
    maxAttempts: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    isMandatory: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: TRAINING_STATUS,
      required: true,
      default: "DRAFT",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

TrainingSchema.index({ status: 1, isDeleted: 1 });
TrainingSchema.index({ type: 1, isDeleted: 1 });
TrainingSchema.index({ title: 1 });

export default model<ITraining>("Training", TrainingSchema);