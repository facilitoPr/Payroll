import mongoose, { Schema, model, Types } from "mongoose";

export interface IMigrationBackup extends mongoose.Document {
  migrationKey: string;
  migrationRun: Types.ObjectId;
  databaseName: string;
  collectionName: string;
  documentId: Types.ObjectId;
  operation: "UPDATE" | "CREATE" | "DELETE";
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  restoredAt?: Date | null;
  restoredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MigrationBackupSchema = new Schema<IMigrationBackup>(
  {
    migrationKey: { type: String, required: true, index: true },
    migrationRun: {
      type: Schema.Types.ObjectId,
      ref: "MigrationRun",
      required: true,
      index: true,
    },
    databaseName: { type: String, required: true, index: true },
    collectionName: { type: String, required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, required: true, index: true },
    operation: {
      type: String,
      enum: ["UPDATE", "CREATE", "DELETE"],
      required: true,
      index: true,
    },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    restoredAt: { type: Date, default: null },
    restoredBy: { type: String, default: "" },
  },
  { timestamps: true },
);

MigrationBackupSchema.index({
  migrationRun: 1,
  collectionName: 1,
  documentId: 1,
});

export default model<IMigrationBackup>(
  "MigrationBackup",
  MigrationBackupSchema,
);
