import mongoose, { Schema, model, Types } from "mongoose";
import moment from "moment";

export type ReminderMarkCode =
  | "CONFIRMACION"
  | "CITA_CRISTAL"
  | "CITA_RECUPERADA"
  | "REAGENDAR"
  | "INCORRECTA"
  // | "NO_INTERESADA";
  | "INGLES"
  | "CANCELADA";

export const REMINDER_MARK_CODES: ReminderMarkCode[] = [
  "CONFIRMACION",
  "CITA_CRISTAL",
  "CITA_RECUPERADA",
  "REAGENDAR",
  "INCORRECTA",
  "INGLES",
  // "NO_INTERESADA",
  "CANCELADA",
];

export interface reminders extends mongoose.Document {
  note: string;
  reminderType: Types.ObjectId;
  patient: Types.ObjectId;
  zone: Types.ObjectId;
  user: Types.ObjectId;
  hour: string;
  date: string;
  img: string;

  status: Types.ObjectId;
  statusCompleted: Types.ObjectId;

  marks: ReminderMarkCode[];
  isRescheduled: boolean;
  noteWroteByOperator: string;
  updatedBy: Types.ObjectId;

  comercial: Types.ObjectId;
  isActived: boolean;
  isDeleted: boolean;
  created_at: string;
}

const remindersSchema = new Schema(
  {
    note: { type: String, require: true },
    reminderType: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: "RemindersType",
    },
    patient: { type: Schema.Types.ObjectId, require: true, ref: "Patient" },
    zone: { type: Schema.Types.ObjectId, require: true, ref: "Zones" },
    user: { type: Schema.Types.ObjectId, require: true, ref: "User" },
    date: { type: String, require: true },
    hour: { type: String, require: true },
    img: { type: String, require: true },

    status: { type: Schema.Types.ObjectId, require: true, ref: "Status" },
    statusCompleted: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: "Status",
    },

    marks: {
      type: [String],
      enum: REMINDER_MARK_CODES,
      default: [],
    },
    isRescheduled: {
      type: Boolean,
      default: false,
    },
    rescheduledFrom: {
      type: Schema.Types.ObjectId,
      require: false,
      ref: "Reminders",
      default: null,
    },

    noteWroteByOperator: { type: String, require: false },

    comercial: { type: Schema.Types.ObjectId, require: true, ref: "Comercial" },

    isActived: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    updatedBy: { type: Schema.Types.ObjectId, require: false, ref: "User" },

    createdByOperatorDate: {
      type: String,
      default: () => moment().format("YYYY/MM/DD"),
    },
    created_at: {
      type: String,
      default: () => moment().format("YYYY/MM/DD"),
      require: true,
    },
  },
  { timestamps: true },
);

remindersSchema.index({ marks: 1 });

export default model<reminders>("Reminders", remindersSchema);
