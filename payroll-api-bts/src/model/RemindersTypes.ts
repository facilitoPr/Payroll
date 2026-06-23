import mongoose, { Schema, model } from "mongoose";

export interface remindersType extends mongoose.Document {
  name: string;
  code: string;
  description: string;
  icon: string;
  isActived: boolean;
  isDeleted: boolean;
}

const remindersTypesSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  code: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    require: true,
  },
  icon: {
    type: String,
    require: true,
  },
  isActived: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

export default model<remindersType>("RemindersType", remindersTypesSchema);
