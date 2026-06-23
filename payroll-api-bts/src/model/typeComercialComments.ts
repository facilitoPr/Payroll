import mongoose, { Schema, model } from "mongoose";

export interface typeComercialComments extends mongoose.Document {
  name: string;
  created_at: string;
}

const typeComercialCommentsSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  created_at: {
    type: String,
    default: new Date(),
    require: true,
  },
});

export default model<typeComercialComments>("TypeComercialComments", typeComercialCommentsSchema);
