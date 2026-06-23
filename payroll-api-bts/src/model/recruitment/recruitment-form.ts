import { Schema, model, Document, Types } from "mongoose";
import { JobPosition } from "../rrhh/jobPosition";

export interface IRecruitmentFormField {
  key: string;
  /** grupo/paso del campo, ej: "step_1", "step_2" (coincide con el step en recruitmentSteps) */
  groupKey: string;
  order?: number;
  requiredOverride?: boolean;
}

export interface IRecruitmentForm extends Document {
  title: string;
  publicToken: string;
  description?: string;

  fields: IRecruitmentFormField[];

  createdBy: Types.ObjectId;
  documents: string[];
  images: string[];
  jobPosition: Types.ObjectId;
  aiAgent: Types.ObjectId;

  autoAiEvaluation: boolean;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const RecruitmentFormFieldSchema = new Schema<IRecruitmentFormField>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    groupKey: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    requiredOverride: {
      type: Boolean,
      default: undefined,
    },
  },
  { _id: false },
);

const RecruitmentFormSchema = new Schema<IRecruitmentForm>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    publicToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fields: {
      type: [RecruitmentFormFieldSchema],
      validate: {
        validator: (v: IRecruitmentFormField[]) => v && v.length > 0,
        message: "El formulario debe tener al menos un campo habilitado",
      },
      required: true,
    },
    documents: [
      {
        type: String,
        required: false,
        default: null,
      },
    ],
    images: [
      {
        type: String,
        required: false,
        default: null,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobPosition: {
      type: Schema.Types.ObjectId,
      ref: "JobPosition",
      required: true,
    },
    aiAgent: {
      type: Schema.Types.ObjectId,
      ref: "AiAgent",
      default: null,
    },

    autoAiEvaluation: {
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

// Índices útiles
RecruitmentFormSchema.index({ isActive: 1, isDeleted: 1 });

const RecruitmentForm = model<IRecruitmentForm>(
  "RecruitmentForm",
  RecruitmentFormSchema,
);

export default RecruitmentForm;
