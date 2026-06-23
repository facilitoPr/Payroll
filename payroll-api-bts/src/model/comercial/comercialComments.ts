import mongoose, { Schema, model, Types } from "mongoose";

export interface comercialComments extends mongoose.Document {
  user: Types.ObjectId;
  comercial: Types.ObjectId;
  typeComment: Types.ObjectId;
  created_at: string;
}

const comercialCommentsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    require: true,
    ref: "User",
  },
  comercial: {
    type: Schema.Types.ObjectId,
    require: true,
    ref: "Comercial",
  },
  typeComment: {
    type: Schema.Types.ObjectId,
    require: true,
    ref: "TypeComercialComments",
  },
  created_at: {
    type: Date,
    default: Date.now,
    require: true,
  },
});

export default model<comercialComments>("ComercialComments", comercialCommentsSchema);
