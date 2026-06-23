import { Schema, model, Document, Types } from "mongoose";

export const TRAINING_QUESTION_TYPES = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
] as const;

export type TrainingQuestionType = (typeof TRAINING_QUESTION_TYPES)[number];

export interface ITrainingQuestionOption {
  /** Clave única de la opción, por ejemplo A, B, C */
  key: string;

  /** Texto visible de la opción */
  text: string;
}

export interface ITrainingQuestion extends Document {
  /** Entrenamiento al que pertenece la pregunta */
  training: Types.ObjectId;

  /** Título corto de la pregunta */
  title?: string;

  /** Texto principal de la pregunta */
  questionText: string;

  /** Tipo de pregunta */
  type: TrainingQuestionType;

  /** Lista de opciones visibles cuando aplica */
  options: ITrainingQuestionOption[];

  /** Respuestas correctas para preguntas cerradas */
  correctAnswers: string[];

  /** Respuestas aceptadas para preguntas de texto */
  acceptedAnswers: string[];

  /** Cantidad mínima de coincidencias para preguntas largas */
  minKeywordMatches: number;

  /** Indica si la comparación distingue mayúsculas y minúsculas */
  isCaseSensitive: boolean;

  /** Indica si se deben ignorar tildes al comparar */
  ignoreAccents: boolean;

  /** Indica si se deben normalizar espacios extras */
  ignoreExtraSpaces: boolean;

  /** Orden de visualización */
  order: number;

  /** Indica si la pregunta es obligatoria */
  isRequired: boolean;

  /** Explicación opcional para feedback */
  explanation?: string;

  /** Indica si está activa */
  isActive: boolean;

  /** Indica si fue eliminada lógicamente */
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

const TrainingQuestionOptionSchema = new Schema<ITrainingQuestionOption>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const TrainingQuestionSchema = new Schema<ITrainingQuestion>(
  {
    training: {
      type: Schema.Types.ObjectId,
      ref: "Training",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: null,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: TRAINING_QUESTION_TYPES,
      required: true,
    },
    options: {
      type: [TrainingQuestionOptionSchema],
      default: [],
    },
    correctAnswers: {
      type: [String],
      default: [],
    },
    acceptedAnswers: {
      type: [String],
      default: [],
    },
    minKeywordMatches: {
      type: Number,
      default: 1,
      min: 1,
    },
    isCaseSensitive: {
      type: Boolean,
      default: false,
    },
    ignoreAccents: {
      type: Boolean,
      default: true,
    },
    ignoreExtraSpaces: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    explanation: {
      type: String,
      trim: true,
      default: null,
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

TrainingQuestionSchema.pre("validate", function (next) {
  const question = this as ITrainingQuestion;

  if (
    ["SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(question.type) &&
    (!question.options || question.options.length < 2)
  ) {
    return next(
      new Error("Las preguntas de selección deben tener al menos 2 opciones"),
    );
  }

  if (
    ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"].includes(
      question.type,
    ) &&
    (!question.correctAnswers || question.correctAnswers.length === 0)
  ) {
    return next(
      new Error(
        "Las preguntas cerradas deben tener al menos una respuesta correcta",
      ),
    );
  }

  if (
    ["SHORT_TEXT", "LONG_TEXT"].includes(question.type) &&
    (!question.acceptedAnswers || question.acceptedAnswers.length === 0)
  ) {
    return next(
      new Error(
        "Las preguntas de texto deben tener al menos una respuesta aceptada para evaluación automática",
      ),
    );
  }

  if (
    question.type === "SINGLE_CHOICE" &&
    question.correctAnswers.length !== 1
  ) {
    return next(
      new Error(
        "Las preguntas SINGLE_CHOICE deben tener una sola respuesta correcta",
      ),
    );
  }

  if (question.type === "TRUE_FALSE") {
    const validValues = ["true", "false"];
    const allValid = question.correctAnswers.every((item) =>
      validValues.includes(String(item).toLowerCase()),
    );

    if (!allValid || question.correctAnswers.length !== 1) {
      return next(
        new Error(
          'Las preguntas TRUE_FALSE deben tener una sola respuesta correcta: "true" o "false"',
        ),
      );
    }
  }

  next();
});

TrainingQuestionSchema.index({ training: 1, order: 1 });
TrainingQuestionSchema.index({ training: 1, isDeleted: 1 });

export default model<ITrainingQuestion>(
  "TrainingQuestion",
  TrainingQuestionSchema,
);