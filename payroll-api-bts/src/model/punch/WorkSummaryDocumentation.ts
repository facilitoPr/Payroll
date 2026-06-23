import mongoose, { Schema, model, Types } from "mongoose";


export interface IWorkSummaryDocumentation extends mongoose.Document {
  workSummary: Types.ObjectId; // ref a WorkSummary (1:1)
  note?: string;

  images: string[]; // fotos
  documents: string[]; // docs

  isActive: boolean;
  isDeleted: boolean;

  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedBy?: Types.ObjectId;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const WorkSummaryDocumentationSchema = new Schema<IWorkSummaryDocumentation>(
  {
    workSummary: {
      type: Schema.Types.ObjectId,
      ref: "WorkSummary",
      required: true,
      index: true,
    },

    note: { type: String, default: "" },

    images: { type: [String], default: [] },
    documents: { type: [String], default: [] },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

WorkSummaryDocumentationSchema.index(
  { workSummary: 1 },
  { unique: true }
);

export default model<IWorkSummaryDocumentation>(
  "WorkSummaryDocumentation",
  WorkSummaryDocumentationSchema
);
