import mongoose, { Schema, model } from "mongoose";
import type { IAiAgentBase } from "../types/aiAgent";

export interface IAiAgent
  extends mongoose.Document, Omit<IAiAgentBase, "config"> {
  config: any;
  version: number;
  configChecksum?: string;
}

const AiAgentSchema = new Schema<IAiAgent>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, index: true },

    type: { type: String, required: true, index: true },
    description: { type: String, default: "" },

    provider: { type: String, required: true, default: "openai" },
    model: { type: String, required: true, default: "gpt-4.1-mini" },
    temperature: { type: Number, default: 0.2 },
    maxTokens: { type: Number, default: 1024 },

    config: { type: Schema.Types.Mixed, required: true, default: {} },

    /** Versión del agente para trazabilidad histórica */
    version: { type: Number, required: true, default: 1 },

    /** Hash/checksum opcional de config para comparar cambios */
    configChecksum: { type: String, required: false, default: null },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

AiAgentSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

AiAgentSchema.index({ type: 1, isActive: 1, isDeleted: 1 });

const AiAgent = model<IAiAgent>("AiAgent", AiAgentSchema);
export default AiAgent;