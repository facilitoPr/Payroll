import { Schema, model, Document, Types } from "mongoose";

export interface ISupportTicket extends Document {
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  user: Types.ObjectId;
  emailSent: boolean;
  emailSentAt?: Date | null;
  responseMessage?: string | null;
  resolvedAt?: Date | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: Types.ObjectId;
  internalNotes: string;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    responseMessage: {
      type: String,
      default: null,
      trim: true,
    },
    resolvedAt: {
      type: Date,
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
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    internalNotes: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);

export default model<ISupportTicket>("SupportTicket", SupportTicketSchema);