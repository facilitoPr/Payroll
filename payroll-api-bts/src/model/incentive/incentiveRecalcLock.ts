import { Schema, model } from "mongoose";

export interface IIncentiveRecalcLock {
  key: string;
  expiresAt: Date;
}

const IncentiveRecalcLockSchema = new Schema<IIncentiveRecalcLock>(
  {
    key: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

// TTL index: se borra solo cuando expire
IncentiveRecalcLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model<IIncentiveRecalcLock>(
  "IncentiveRecalcLock",
  IncentiveRecalcLockSchema,
);
