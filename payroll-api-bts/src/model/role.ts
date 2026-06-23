import mongoose, { Schema, model } from "mongoose";

export interface IRole extends mongoose.Document {
  _id: string;
  name: string;
  code: string;

  createdAt: Date;
  updatedAt: Date;

  isActive: boolean;
  isDeleted: boolean;
}

const roleSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
    },
    code: {
      type: String,
      require: true,
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
  {
    timestamps: true,
    versionKey: false,
  },
);

export default model<IRole>("Roles", roleSchema);
