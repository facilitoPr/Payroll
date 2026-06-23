import mongoose, { Schema, model, Types } from "mongoose";

export interface IProblemReport extends mongoose.Document {
  comercial: Types.ObjectId;
  reminder: Types.ObjectId;
  date: Date;
  note: string;
  reviewNote?: string;

  images?: string[];
  files?: string[];

  createdBy?: Types.ObjectId; // ref: "User"
  status: Types.ObjectId;

  isRead: boolean;
  isActived: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const stringArrayTrimSetter = (arr?: string[]) =>
  Array.isArray(arr)
    ? arr.map((s) => (typeof s === "string" ? s.trim() : s))
    : arr;

const ProblemReportSchema = new Schema<IProblemReport>(
  {
    comercial: {
      type: Schema.Types.ObjectId,
      ref: "Comercial",
      required: false,
      index: true,
      default: null
    },
    reminder: {
      type: Schema.Types.ObjectId,
      ref: "Reminders",
      required: false,
      index: true,
      default: null
    },
    date: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 5000,
    },
    reviewNote: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },

    images: {
      type: [String],
      default: [],
      set: stringArrayTrimSetter,
    },
    files: {
      type: [String],
      default: [],
      set: stringArrayTrimSetter,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    status: {
      type: Schema.Types.ObjectId,
      ref: "Status",
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isActived: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices compuestos útiles
ProblemReportSchema.index({ comercial: 1, date: -1 });

export default model<IProblemReport>("ProblemReport", ProblemReportSchema);
