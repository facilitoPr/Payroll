import { Schema, model, Document, Types} from 'mongoose';

export interface IPermissionType extends Document {
  code: string;
  name: string;
  description?: string;
  requiresDocument?: boolean; // Si requiere evidencia médica, etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category:string
}

const permissionTypeSchema = new Schema<IPermissionType>(
  {
    code: { type: String, required: true, unique: true }, // Ej: 'VACATION'
    name: { type: String, required: true }, // Ej: 'Vacaciones'
    description: { type: String },
    requiresDocument: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    category: {
    type: String,
    enum: ["PERMISO", "VACACIONES"],
    required: true,
  },
  },

  { timestamps: true }
);

export default model<IPermissionType>('PermissionType', permissionTypeSchema);