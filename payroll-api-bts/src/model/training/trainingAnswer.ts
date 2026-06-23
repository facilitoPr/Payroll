import { Schema, model, Document, Types } from "mongoose";

export interface ITrainingAnswer extends Document {
  /** Entrenamiento relacionado */
  training: Types.ObjectId;

  /** Pregunta relacionada */
  question: Types.ObjectId;

  /** Intento al que pertenece esta respuesta */
  attempt: Types.ObjectId;

  /** Usuario que respondió */
  user: Types.ObjectId;

  /** Respuesta en texto libre */
  answerText?: string;

  /** Respuesta para selección simple o múltiple */
  selectedOptions: string[];

  /** Respuesta booleana para verdadero/falso */
  booleanAnswer?: boolean | null;

  /** Valor normalizado de respuesta en texto para comparación */
  normalizedAnswer?: string;

  /** Indica si la respuesta fue correcta */
  isCorrect: boolean;

  /** Puntos obtenidos en esta respuesta */
  pointsObtained: number;

  /** Indica si está activa */
  isActive: boolean;

  /** Indica si fue eliminada lógicamente */
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

const TrainingAnswerSchema = new Schema<ITrainingAnswer>(
  {
    training: {
      type: Schema.Types.ObjectId,
      ref: "Training",
      required: true,
    },
    question: {
      type: Schema.Types.ObjectId,
      ref: "TrainingQuestion",
      required: true,
    },
    attempt: {
      type: Schema.Types.ObjectId,
      ref: "TrainingAttempt",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answerText: {
      type: String,
      default: null,
    },
    selectedOptions: {
      type: [String],
      default: [],
    },
    booleanAnswer: {
      type: Boolean,
      default: null,
    },
    normalizedAnswer: {
      type: String,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    pointsObtained: {
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

TrainingAnswerSchema.index({ attempt: 1, question: 1 }, { unique: true });

TrainingAnswerSchema.index({ user: 1, training: 1 });

export default model<ITrainingAnswer>("TrainingAnswer", TrainingAnswerSchema);