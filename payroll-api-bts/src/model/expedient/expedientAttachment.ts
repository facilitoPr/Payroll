import mongoose, { Schema, model, Types } from "mongoose";

/**
 * Archivo adjunto dentro de un expediente, asociado a un item (sectionKey + itemKey).
 */
export interface IExpedientAttachment extends mongoose.Document {
  /** Expediente dueño */
  expedient: Types.ObjectId;

  /** Key de la sección del template */
  sectionKey: string;

  /** Key del item del template */
  itemKey: string;

  /** URL pública/privada según tu storage */
  url: string;

  /** Key interna en tu storage (path en bucket), si aplica */
  storageKey?: string;

  /** Nombre original del archivo */
  originalName?: string;

  /** MimeType (ej: application/pdf, image/png) */
  mimeType?: string;

  /** Tamaño en bytes */
  size?: number;

  /** Hash para evitar duplicados (opcional) */
  checksum?: string;

  /** Nota del adjunto (opcional) */
  notes?: string;

  /** Quién subió */
  uploadedBy?: Types.ObjectId;

  /** Fecha de subida */
  uploadedAt?: Date;

  /** Soft delete */
  isActive: boolean;
  isDeleted: boolean;

  /** Fechas */
  createdAt: Date;
  updatedAt: Date;
}

const ExpedientAttachmentSchema = new Schema<IExpedientAttachment>(
  {
    expedient: {
      type: Schema.Types.ObjectId,
      ref: "Expedient",
      required: true,
      index: true,
    },

    sectionKey: { type: String, required: true, trim: true },
    itemKey: { type: String, required: true, trim: true },

    url: { type: String, required: true, trim: true },
    storageKey: { type: String, default: "" },

    originalName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    checksum: { type: String, default: "" },
    notes: { type: String, default: "" },

    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    uploadedAt: { type: Date, default: Date.now },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ExpedientAttachmentSchema.index({
  expedient: 1,
  sectionKey: 1,
  itemKey: 1,
  isDeleted: 1,
});

export default model<IExpedientAttachment>(
  "ExpedientAttachment",
  ExpedientAttachmentSchema
);
