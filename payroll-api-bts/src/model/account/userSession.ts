import { Schema, model, Types, Document } from "mongoose";

export type Platform = "ios" | "android" | "web";

export interface IAccountSession extends Document {
  user: Types.ObjectId;

  deviceId: string;
  platform: Platform;

  expoPushToken?: string | null;

  /** Suscripción web push */
  webPushSubscription?: {
    endpoint?: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };

  refreshTokenHash: string;
  ip?: string;
  userAgent?: string;

  lastUsedAt: Date;
  revokedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const AccountSessionSchema = new Schema<IAccountSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "User"
    },

    deviceId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ["ios", "android", "web"],
      required: true,
      index: true,
    },

    expoPushToken: {
      type: String,
      default: null,
      trim: true,
    },

    webPushSubscription: {
      endpoint: { type: String, trim: true },
      keys: {
        p256dh: { type: String, trim: true },
        auth: { type: String, trim: true },
      },
    },

    refreshTokenHash: {
      type: String,
      required: true,
    },

    ip: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
      trim: true,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

AccountSessionSchema.index(
  { user: 1, deviceId: 1, platform: 1 },
  { unique: true },
);
AccountSessionSchema.index({ user: 1, revokedAt: 1 });

export default model<IAccountSession>("AccountSession", AccountSessionSchema);