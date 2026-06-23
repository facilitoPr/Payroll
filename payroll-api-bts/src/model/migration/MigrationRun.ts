import mongoose, { Schema, model, Types } from "mongoose";

export type MigrationRunStatus =
  | "DRY_RUN"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "ROLLED_BACK";

export interface IMigrationRun extends mongoose.Document {
  migrationKey: string;
  startedAt: Date;
  finishedAt?: Date | null;
  status: MigrationRunStatus;
  databaseName: string;
  executedBy: string;
  createdCounts: Record<string, number>;
  updatedCounts: Record<string, number>;
  skippedCounts: Record<string, number>;
  warningCounts: Record<string, number>;
  errorItems: Array<{
    collection?: string;
    documentId?: string;
    message: string;
  }>;
  reportPath?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const MigrationRunSchema = new Schema<IMigrationRun>(
  {
    migrationKey: { type: String, required: true, index: true },
    startedAt: { type: Date, required: true, default: Date.now },
    finishedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["DRY_RUN", "RUNNING", "COMPLETED", "FAILED", "ROLLED_BACK"],
      required: true,
      index: true,
    },
    databaseName: { type: String, required: true, index: true },
    executedBy: { type: String, default: "script" },
    createdCounts: { type: Schema.Types.Mixed, default: {} },
    updatedCounts: { type: Schema.Types.Mixed, default: {} },
    skippedCounts: { type: Schema.Types.Mixed, default: {} },
    warningCounts: { type: Schema.Types.Mixed, default: {} },
    errorItems: {
      type: [
        {
          collection: { type: String, default: "" },
          documentId: { type: String, default: "" },
          message: { type: String, required: true },
        },
      ],
      default: [],
    },
    reportPath: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

MigrationRunSchema.index({ migrationKey: 1, databaseName: 1, startedAt: -1 });

export default model<IMigrationRun>("MigrationRun", MigrationRunSchema);
