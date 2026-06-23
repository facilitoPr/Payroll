import mongoose, { Schema, model, Types } from "mongoose";

export interface comercialAdditionalComments extends mongoose.Document {
  comment: string;
  user: Types.ObjectId;
  comercial: Types.ObjectId;
  created_at: string;
}

const comercialAdditionalCommentsSchema = new Schema({
  comment: {
    type: String,
    require: true,
  },
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
  created_at: {
    type: Date,
    default: Date.now,
    require: true,
  },
});

export default model<comercialAdditionalComments>("ComercialAdditionalComments", comercialAdditionalCommentsSchema);
