import mongoose, { Schema, model, Types } from "mongoose";

export interface ISalaryType extends mongoose.Document {
  name: string;
  description?: string;
  code:string
}

const salaryTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: { type: String },
  code: { type: String },

});

export default model<ISalaryType>("SalaryType", salaryTypeSchema);
