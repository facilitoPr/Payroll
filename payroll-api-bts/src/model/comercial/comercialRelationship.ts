import mongoose, { Schema, model, Types } from "mongoose";

export interface comercialRelationship extends mongoose.Document {
  members: Types.ObjectId[];
}

const comercialRelationshipSchema = new Schema({
  members: [
    {
      type: Types.ObjectId,
      ref: "Comercial", 
      required: true, 
    },
  ],
});

export default model<comercialRelationship>("ComercialRelationship", comercialRelationshipSchema);
