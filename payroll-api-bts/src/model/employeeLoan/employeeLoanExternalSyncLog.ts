import { Schema, model, Document, Types } from "mongoose";

export type EmployeeLoanExternalSyncLogStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED";

export type EmployeeLoanExternalSyncLogDirection = "OUTBOUND" | "INBOUND";

export interface IEmployeeLoanExternalSyncLog extends Document {
  /** Solicitud de préstamo relacionada. */
  loanRequest: Types.ObjectId;

  /** Sistema externo al que se envió o del que se recibió información. */
  externalSystemCode: string;

  /** Dirección del intercambio. */
  direction: EmployeeLoanExternalSyncLogDirection;

  /** Endpoint externo usado. */
  endpoint?: string;

  /** Método HTTP usado. */
  method?: string;

  /** Payload enviado o recibido. */
  payload?: Record<string, any>;

  /** Respuesta recibida. */
  response?: Record<string, any>;

  /** Código HTTP de la respuesta. */
  statusCode?: number;

  /** Estado del intento. */
  status: EmployeeLoanExternalSyncLogStatus;

  /** Mensaje de error, si falló. */
  errorMessage?: string;

  /** Fecha del intento. */
  attemptedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const employeeLoanExternalSyncLogSchema =
  new Schema<IEmployeeLoanExternalSyncLog>(
    {
      loanRequest: {
        type: Schema.Types.ObjectId,
        ref: "EmployeeLoanRequest",
        required: true,
        index: true,
      },

      externalSystemCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      direction: {
        type: String,
        enum: ["OUTBOUND", "INBOUND"],
        default: "OUTBOUND",
        required: true,
      },

      endpoint: {
        type: String,
        trim: true,
        default: "",
      },

      method: {
        type: String,
        trim: true,
        uppercase: true,
        default: "POST",
      },

      payload: {
        type: Schema.Types.Mixed,
        default: {},
      },

      response: {
        type: Schema.Types.Mixed,
        default: {},
      },

      statusCode: {
        type: Number,
        default: 0,
      },

      status: {
        type: String,
        enum: ["PENDING", "SUCCESS", "FAILED"],
        default: "PENDING",
        required: true,
        index: true,
      },

      errorMessage: {
        type: String,
        trim: true,
        default: "",
      },

      attemptedAt: {
        type: Date,
        default: Date.now,
      },
    },
    { timestamps: true },
  );

employeeLoanExternalSyncLogSchema.index({
  loanRequest: 1,
  createdAt: -1,
});

employeeLoanExternalSyncLogSchema.index({
  externalSystemCode: 1,
  status: 1,
  createdAt: -1,
});

export default model<IEmployeeLoanExternalSyncLog>(
  "EmployeeLoanExternalSyncLog",
  employeeLoanExternalSyncLogSchema,
);