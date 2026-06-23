import { Schema, model, Document, Types } from "mongoose";

export const TRAINING_ATTEMPT_STATUS = [
  "IN_PROGRESS",
  "SUBMITTED",
  "PASSED",
  "FAILED",
  "EXPIRED",
] as const;

export type TrainingAttemptStatus = (typeof TRAINING_ATTEMPT_STATUS)[number];

export interface ITrainingAttempt extends Document {
  /** Entrenamiento relacionado */
  training: Types.ObjectId;

  /** Usuario que realizó el intento */
  user: Types.ObjectId;

  /** Asignación relacionada */
  assignment: Types.ObjectId;

  /** Número de intento */
  attemptNumber: number;

  /** Fecha de inicio del intento */
  startedAt: Date;

  /** Fecha de envío/finalización */
  submittedAt?: Date | null;

  /** Puntaje final en porcentaje */
  score: number;

  /** Total de puntos obtenidos */
  pointsObtained: number;

  /** Total de puntos posibles */
  totalPoints: number;

  /** Indica si aprobó */
  passed: boolean;

  /** Estado actual del intento */
  status: TrainingAttemptStatus;

  /** Tiempo total invertido en segundos */
  durationSeconds: number;

  /** Indica si está activo */
  isActive: boolean;

  /** Indica si fue eliminado lógicamente */
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

const TrainingAttemptSchema = new Schema<ITrainingAttempt>(
  {
    training: {
      type: Schema.Types.ObjectId,
      ref: "Training",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignment: {
      type: Schema.Types.ObjectId,
      ref: "TrainingUserAssignment",
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    pointsObtained: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: TRAINING_ATTEMPT_STATUS,
      required: true,
      default: "IN_PROGRESS",
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
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

TrainingAttemptSchema.index(
  { assignment: 1, attemptNumber: 1 },
  { unique: true },
);

TrainingAttemptSchema.index({ user: 1, training: 1 });
TrainingAttemptSchema.index({ assignment: 1, status: 1 });

export default model<ITrainingAttempt>(
  "TrainingAttempt",
  TrainingAttemptSchema,
);