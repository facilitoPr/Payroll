import { Schema, model, Document, Types } from "mongoose";

export interface IPermissionRequestHistory extends Document {
  permissionRequest: Types.ObjectId; // ID de la solicitud principal
  action:
    | "CREADA"
    | "EDITADA"
    | "APROBADA"
    | "RECHAZADA"
    | "COMENTADA"
    | "FINALIZADA"
    | "MODIFICADA"
    | "ACEPTADO"
    | "NO ACEPTADO";
  comment?: string;
  previousData?: any; // Estado previo de la solicitud

  performedAt: Date;
  status:
    | "CREADA"
    | "EDITADA"
    | "APROBADA"
    | "RECHAZADA"
    | "COMENTADA"
    | "PENDIENTE"
    | "FINALIZADA"
    | "MODIFICADA"
    | "ACEPTADA"
    | "NO ACEPTADA";

  createdAt: Date;
  updatedAt: Date;
  performedBy: Types.ObjectId;
}

const permissionRequestHistorySchema = new Schema<IPermissionRequestHistory>(
  {
    permissionRequest: {
      type: Schema.Types.ObjectId,
      ref: "PermissionRequest",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "CREADA",
        "EDITADA",
        "APROBADA",
        "RECHAZADA",
        "COMENTADA",
        "PENDIENTE",
        "FINALIZADA",
        "MODIFICADA",
        "ACEPTADA",
        "NO ACEPTADA",
      ],
      required: true,
    },
    comment: {
      type: String,
    },
    previousData: {
      type: Schema.Types.Mixed, // Puede guardar un snapshot completo de la solicitud
    },

    performedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        "CREADA",
        "EDITADA",
        "APROBADA",
        "RECHAZADA",
        "COMENTADA",
        "PENDIENTE",
        "FINALIZADA",
        "MODIFICADA",
        "ACEPTADA",
        "NO ACEPTADA"
      ],
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",  
      required: true,
    },
  },
  { timestamps: true }
);

export default model<IPermissionRequestHistory>(
  "PermissionRequestHistory",
  permissionRequestHistorySchema
);
