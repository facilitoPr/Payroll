import mongoose, { Schema, model, Types } from "mongoose";

export interface IProject extends mongoose.Document {
  name: string;
  code: string;
  startDate: string;
  endDate?: string;
  description?: string;

  company: Types.ObjectId;
  department: Types.ObjectId;
  jobPosition: Types.ObjectId;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    startDate: {
      type: String,
      required: true,
    },

    endDate: {
      type: String,
      required: false,
      default: "",
    },

    description: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },

    jobPosition: {
      type: Schema.Types.ObjectId,
      ref: "JobPosition",
      required: true,
      index: true,
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

projectSchema.index(
  { jobPosition: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

projectSchema.index({ company: 1, isDeleted: 1 });
projectSchema.index({ department: 1, isDeleted: 1 });
projectSchema.index({ jobPosition: 1, isDeleted: 1 });

export default model<IProject>("Project", projectSchema);