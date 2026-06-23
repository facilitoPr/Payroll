import { Schema, model, Types } from "mongoose";

export interface IJobPosition {

  /** Código interno opcional (ej: CC_AGENT, SUPERVISOR) */
  code?: string;
  name: string;
  description?: string;
  department: Types.ObjectId;
  company: Types.ObjectId;
  modality?: "Onsite" | "Remote" | "Hybrid";

  /** Tipo de empleo (tiempo completo, medio tiempo, etc.) */
  employmentType?:
    | "FullTime"
    | "PartTime"
    | "Contract"
    | "Internship"
    | "Temporary";

  /** Requisitos (lista de bullets) */
  requirements?: string[];

  /** Responsabilidades (lista de bullets) */
  responsibilities?: string[];

  isActive: boolean;
  isDeleted: boolean;

  /** Timestamps */
  createdAt?: Date;
  updatedAt?: Date;
}

const JobPositionSchema = new Schema<IJobPosition>(
  {
    code: {
      type: String,
      trim: true,
      maxlength: 50,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
    },

    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    modality: {
      type: String,
      enum: ["Onsite", "Remote", "Hybrid"],
      default: "Onsite",
      index: true,
    },

    employmentType: {
      type: String,
      enum: ["FullTime", "PartTime", "Contract", "Internship", "Temporary"],
      index: true,
    },

    requirements: {
      type: [String],
      default: [],
    },

    responsibilities: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

// Único por code 
JobPositionSchema.index(
  { code: 1 },
  {
    unique: true,
    partialFilterExpression: { code: { $type: "string" }, isDeleted: false },
  }
);

// Búsqueda rápida por nombre dentro del sistema
JobPositionSchema.index({ name: 1, isDeleted: 1 });

export const JobPosition = model<IJobPosition>(
  "JobPosition",
  JobPositionSchema
);
