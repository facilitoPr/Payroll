import mongoose, { Schema, model, Types } from "mongoose";
export interface days extends mongoose.Document {
  day: string;
  isActive: boolean;
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  order: number;
}

const daysSchema = new Schema(
  {
    day: {
      type: String,
      require: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      require: true,
    },
    created_at: {
      type: String,
      default: new Date().toISOString(),
      require: true,
    },
    updated_at: {
      type: String,
      default: new Date().toISOString(),
      require: true,
    },
  },
  { timestamps: true },
);

export default model<days>("Days", daysSchema);
