import mongoose, { Schema, model, Types } from "mongoose";
import moment from "moment";

export interface comercialDocumenInfo extends mongoose.Document {
  name: string;
  zones: Types.ObjectId;
  isFederal: boolean;
  created_at: string;
  updated_at: string;
}

const comercialDocumenInfoSchema = new Schema({
  name: { type: String, required: true },
  isFederal: { type: Boolean, required: false },
  zones: { type: Schema.Types.ObjectId, ref: "Zone", required: true },
  created_at: { type: String, default: moment().format("YYYY-MM-DD HH:mm:ss") },
  updated_at: { type: String, default: moment().format("YYYY-MM-DD HH:mmss") },
});

export default model<comercialDocumenInfo>(
  "ComercialDocumenInfo",
  comercialDocumenInfoSchema
);
