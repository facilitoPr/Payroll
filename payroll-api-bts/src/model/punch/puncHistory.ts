import mongoose, { Schema, model, Types } from "mongoose";

const AuditChangeSchema = new Schema(
  {
    field: String,
    from: Schema.Types.Mixed,
    to: Schema.Types.Mixed,
  },
  { _id: false },
);

const AuditEntrySchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: Types.ObjectId, ref: "User" },
    ip: String,
    changes: [AuditChangeSchema],
  },
  { _id: false },
);

export type PunchStep =
  | "entrada"
  | "salida_almuerzo"
  | "entrada_almuerzo"
  | "salida";

export interface IPunchHistory extends mongoose.Document {
  user: Types.ObjectId;
  punchType: Types.ObjectId; // Referencia al tipo de ponche
  punchStep: PunchStep; // Qué paso específico se registró
  timestamp: Date;
  date: string; // YYYY-MM-DD
  expectedTime?: string;
  createdAt: Date;
  updatedAt: Date;
  img: string;
  workSummary?: Types.ObjectId;
  isDeleted: boolean;
  lateTime: number;
}

const punchHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    img: {
      type: String,
      default: "",
    },
    punchType: {
      type: Schema.Types.ObjectId,
      ref: "PunchType",
      required: true,
    },
    punchStep: {
      type: String,
      enum: ["entrada", "salida_almuerzo", "entrada_almuerzo", "salida"],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    date: {
      type: String, // formato YYYY-MM-DD
      required: true,
    },
    isLate: {
      type: Boolean,
      required: false,
    },
    expectedTime: {
      type: String,
      required: false,
    },
    lateTime: {
      type: Number,
      required: false,
      default: 0,
    },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    workSummary: {
      type: Schema.Types.ObjectId,
      ref: "WorkSummary",
      required: false,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    audit: [AuditEntrySchema],
  },
  {
    timestamps: true,
  },
);

punchHistorySchema.index({ workSummary: 1 });

punchHistorySchema.index(
  { user: 1, date: 1, punchStep: 1 },
  {
    unique: true,
    // Para permitir recrear si haces soft delete
    partialFilterExpression: { isDeleted: false },
  },
);

export default model<IPunchHistory>("PunchHistory", punchHistorySchema);
