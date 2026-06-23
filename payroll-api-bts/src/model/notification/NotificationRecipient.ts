import mongoose, { Schema, model, Types } from "mongoose";

export interface INotificationRecipient extends mongoose.Document {
  notification: Types.ObjectId;
  user: Types.ObjectId;

  seenAt?: Date;
  readAt?: Date;
  archivedAt?: Date;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const NotificationRecipientSchema = new Schema<INotificationRecipient>(
  {
    notification: {
      type: Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    seenAt: { type: Date, required: false },
    readAt: { type: Date, required: false },
    archivedAt: { type: Date, required: false },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Evita duplicados por usuario
NotificationRecipientSchema.index(
  { notification: 1, user: 1 },
  { unique: true }
);

// Inbox rápido
NotificationRecipientSchema.index({ user: 1, readAt: 1, createdAt: -1 });
NotificationRecipientSchema.index({ user: 1, archivedAt: 1, createdAt: -1 });

export const NotificationRecipient = model<INotificationRecipient>(
  "NotificationRecipient",
  NotificationRecipientSchema
);
