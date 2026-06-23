import mongoose, { Schema, model } from "mongoose";

/**
 * Fases del expediente para mostrar/filtrar secciones según el ciclo.
 */
export type ClassificationPhase = "RECRUITMENT" | "EMPLOYEE" | "TERMINATION";

/**
 * Item dentro de una sección (ej: "cv", "idCopy").
 */
export interface IClassificationTemplateItem {
  key: string;
  label: string;
  order: number;

  /** Si es requerido para completar el expediente (según phase) */
  required: boolean;
  /** Si permite múltiples archivos (ej: addendums, fotos, etc.) */
  multiple: boolean;
  /** Tipos aceptados (mimes o categorías simplificadas) */
  accepts: string[]; // ej: ["image/*", "application/pdf"]
}

/**
 * Sección del template (ej: "personalDocs").
 */
export interface IClassificationTemplateSection {
  /** Key única de la sección (ej: "personalDocs") */
  key: string;

  /** Título visible (ej: "1. Documentos Personales") */
  title: string;

  /** Orden de la sección */
  order: number;

  /** Fase del ciclo donde aplica */
  phase: ClassificationPhase;

  /** Items dentro de la sección */
  items: IClassificationTemplateItem[];
}

/**
 * Template versionado para definir estructura del expediente.
 */
export interface IClassificationTemplate extends mongoose.Document {
  /** Código interno (ej: "default_hr_dossier") */
  code: string;

  /** Nombre visible */
  name: string;

  /** Versión incremental (1,2,3...) */
  version: number;

  /** Indica si es el template activo */
  isActive: boolean;

  /** Soft delete */
  isDeleted: boolean;

  /** Secciones del template */
  sections: IClassificationTemplateSection[];
  createdAt: Date;
  updatedAt: Date;
}

const TemplateItemSchema = new Schema<IClassificationTemplateItem>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    required: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },
    accepts: { type: [String], default: [] },
  },
  { _id: false }
);

const TemplateSectionSchema = new Schema<IClassificationTemplateSection>(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    phase: {
      type: String,
      enum: ["RECRUITMENT", "EMPLOYEE", "TERMINATION"],
      required: true,
    },
    items: { type: [TemplateItemSchema], default: [] },
  },
  { _id: false }
);

const ClassificationTemplateSchema = new Schema<IClassificationTemplate>(
  {
    code: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    version: { type: Number, required: true, default: 1 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    sections: { type: [TemplateSectionSchema], default: [] },
  },
  { timestamps: true }
);

ClassificationTemplateSchema.index({ code: 1, version: 1 }, { unique: true });
ClassificationTemplateSchema.index({ isActive: 1, isDeleted: 1, code: 1 });

export default model<IClassificationTemplate>(
  "ClassificationTemplate",
  ClassificationTemplateSchema
);
