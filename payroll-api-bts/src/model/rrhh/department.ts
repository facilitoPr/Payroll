import mongoose, { Schema, model, Types } from "mongoose";

export interface IDepartment extends mongoose.Document {
  name: string;
  code: string;
  isActive: boolean;
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  managers: Types.ObjectId[];
  company: Types.ObjectId;
}

const departmentSchema = new Schema({
  name: { type: String, required: true },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  company: {
  type: Schema.Types.ObjectId,
  ref: "Company",
  required: true,
  index: true,
},
  managers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  ],
  isActive: {
    type: Boolean,
    require: true,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    require: true,
    default: false,
  },
  created_at: {
    type: String,
    default: new Date().toISOString(),
  },
  updated_at: {
    type: String,
    default: new Date().toISOString(),
  },
  description: { type: String, required: false },
});

export default model<IDepartment>("Department", departmentSchema);
