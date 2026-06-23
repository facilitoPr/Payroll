import mongoose, { Schema, model } from "mongoose";

export interface zone extends mongoose.Document {
  name: string;
  code: string;
  link: string;
  isActived: boolean;
  isDeleted: boolean;
}

const zonesSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  code: {
    type: String,
    require: true,
  },
  link: {
    type: String,
    require: false,
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

export default model<zone>("Zones", zonesSchema);
