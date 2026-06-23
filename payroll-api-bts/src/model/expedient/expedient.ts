import mongoose, { Schema, model, Types } from "mongoose";
import type {
  IClassificationTemplateSection,
  ClassificationPhase,
} from "./classificationTemplate";

export type ExpedientEntityType = "RecruitmentApplication" | "User";
export type ExpedientStatus = "OPEN" | "COMPLETE" | "ARCHIVED";

export interface IExpedientTemplateSnapshot {
  code: string;
  name: string;
  version: number;

  /** Secciones (estructura) */
  sections: Array<{
    key: string;
    title: string;
    order: number;
    phase: ClassificationPhase;
    items: Array<{
      key: string;
      label: string;
      order: number;
      required: boolean;
      multiple: boolean;
      accepts: string[];
    }>;
  }>;
}

export interface IExpedient extends mongoose.Document {
  application?: Types.ObjectId;
  user?: Types.ObjectId;

  /** Template base */
  template: Types.ObjectId;

  /** Snapshot del template usado */
  templateSnapshot: IExpedientTemplateSnapshot;
  status: ExpedientStatus;
  classification?: IExpedientClassification;

  /** Nota general */
  notes?: string;

  /** Campos de progreso (opcional, recalculable) */
  requiredTotal: number;
  requiredCompleted: number;

  /** Quién creó/actualizó */
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  /** Soft delete */
  isActive: boolean;
  isDeleted: boolean;

  /** Fechas */
  createdAt: Date;
  updatedAt: Date;
}

export type ExpedientDocStatus =
  | "Original"
  | "Copia"
  | "Digital"
  | "Pendiente"
  | "No aplica";

export interface IExpedientItemClassification {
  received: boolean;
  date?: Date | null; // en BD Date, en UI tú usas string; convertimos al guardar
  status: ExpedientDocStatus;
  note: string;

  // ✅ extras para items agregados desde UI
  label?: string;
  isCustom?: boolean;
}

export interface IExpedientClassification {
  expedientCode: string;
  owner: string;
  notes: string;

  // sections[sectionKey][itemKey] => estado del documento
  sections: Record<string, Record<string, IExpedientItemClassification>>;
}

const SnapshotItemSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    required: { type: Boolean, required: true, default: false },
    multiple: { type: Boolean, required: true, default: false },
    accepts: { type: [String], default: () => [] },
  },
  { _id: false }
);

const SnapshotSectionSchema = new Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    phase: { type: String, required: true },
    items: { type: [SnapshotItemSchema], default: () => [] },
  },
  { _id: false }
);

const ExpedientTemplateSnapshotSchema = new Schema<IExpedientTemplateSnapshot>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    version: { type: Number, required: true },
    sections: { type: [SnapshotSectionSchema], default: [] }, // estructura controlada por tu app
  },
  { _id: false }
);

const ExpedientSchema = new Schema<IExpedient>(
  {
    application: { type: Schema.Types.ObjectId, ref: "RecruitmentApplication" },
    user: { type: Schema.Types.ObjectId, ref: "User" },

    template: {
      type: Schema.Types.ObjectId,
      ref: "ClassificationTemplate",
      required: true,
    },
    templateSnapshot: { type: ExpedientTemplateSnapshotSchema, required: true },

    status: {
      type: String,
      enum: ["OPEN", "COMPLETE", "ARCHIVED"],
      default: "OPEN",
      index: true,
    },

    notes: { type: String, default: "" },

    classification: {
      expedientCode: { type: String, default: "EXP-NEW" },
      owner: { type: String, default: "RRHH" },
      notes: { type: String, default: "" },
      sections: { type: Schema.Types.Mixed, default: {} },
    },

    requiredTotal: { type: Number, default: 0 },
    requiredCompleted: { type: Number, default: 0 },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Índices para consultas típicas
ExpedientSchema.index({ application: 1, isDeleted: 1 });
ExpedientSchema.index({ user: 1, isDeleted: 1 });

// Evitar tener 2 expedientes activos por application/user (opcional)
// Si quieres permitir varios, quita estos índices y controla en lógica.
ExpedientSchema.index(
  { application: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: {
      application: { $exists: true },
      isDeleted: false,
    },
  }
);
ExpedientSchema.index(
  { user: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { user: { $exists: true }, isDeleted: false },
  }
);

export default model<IExpedient>("Expedient", ExpedientSchema);
