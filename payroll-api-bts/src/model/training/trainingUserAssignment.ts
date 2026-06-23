import { Schema, model, Document, Types } from "mongoose";

export const TRAINING_ASSIGNMENT_STATUS = [
  "ASSIGNED",
  "STARTED",
  "COMPLETED",
  "FAILED",
  "EXPIRED",
] as const;

export type TrainingAssignmentStatus =
  (typeof TRAINING_ASSIGNMENT_STATUS)[number];

export interface ITrainingUserAssignment extends Document {
  /** Entrenamiento asignado */
  training: Types.ObjectId;

  /** Usuario al que se le asigna el entrenamiento */
  user: Types.ObjectId;

  /** Usuario administrador que realizó la asignación */
  assignedBy: Types.ObjectId;

  /** Fecha en que se realizó la asignación */
  assignedAt: Date;

  /** Fecha desde la que puede iniciar */
  availableFrom?: Date | null;

  /** Fecha límite para completar */
  dueDate?: Date | null;

  /** Fecha hasta la que seguirá visible/disponible */
  availableUntil?: Date | null;

  /** Estado actual de la asignación */
  status: TrainingAssignmentStatus;

  /** Último puntaje obtenido */
  score: number;

  /** Indica si aprobó */
  passed: boolean;

  /** Fecha de completado */
  completedAt?: Date | null;

  /** Cantidad de intentos utilizados */
  totalAttemptsUsed: number;

  /** Indica si está activa */
  isActive: boolean;

  /** Indica si fue eliminada lógicamente */
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

const TrainingUserAssignmentSchema = new Schema<ITrainingUserAssignment>(
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
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    availableFrom: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    availableUntil: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: TRAINING_ASSIGNMENT_STATUS,
      required: true,
      default: "ASSIGNED",
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    totalAttemptsUsed: {
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

TrainingUserAssignmentSchema.index(
  { training: 1, user: 1, isDeleted: 1 },
  { unique: true },
);

TrainingUserAssignmentSchema.index({ user: 1, status: 1 });

export default model<ITrainingUserAssignment>(
  "TrainingUserAssignment",
  TrainingUserAssignmentSchema,
);