import {
  ALLOWED_DATABASE_NAME,
  MIGRATION_KEY,
  assertExecuteAllowed,
  connectMongoClientToAllowedDb,
  mdTable,
  parseArgs,
  timestampForFile,
  writeReportFiles,
} from "./prodCopyMigrationCommon";

const { ObjectId } = require("mongodb");

const objectIdToString = (value: any) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value.toHexString) return value.toHexString();
  return String(value);
};

const getMigrationRunId = () => {
  const args = parseArgs();
  const raw = String(args["migration-run"] || "");

  if (!raw || !ObjectId.isValid(raw)) {
    throw new Error("Missing valid --migration-run=<ObjectId>.");
  }

  return new ObjectId(raw);
};

const rollbackBackups = async (client: any, db: any, migrationRunId: any) => {
  const session = client.startSession();
  const restored: Array<{
    backupId: string;
    collectionName: string;
    documentId: string;
    operation: string;
  }> = [];

  try {
    await session.withTransaction(async () => {
      const backups = await db
        .collection("migrationbackups")
        .find({
          migrationKey: MIGRATION_KEY,
          migrationRun: migrationRunId,
          restoredAt: { $exists: false },
        })
        .sort({ createdAt: -1, _id: -1 })
        .toArray();

      for (const backup of backups) {
        if (backup.operation === "UPDATE") {
          if (!backup.before?._id) {
            throw new Error(
              `Backup ${objectIdToString(backup._id)} no tiene documento before._id.`,
            );
          }

          await db
            .collection(backup.collectionName)
            .replaceOne({ _id: backup.before._id }, backup.before, { session });
        } else if (backup.operation === "CREATE") {
          await db
            .collection(backup.collectionName)
            .deleteOne({ _id: backup.documentId }, { session });
        } else if (backup.operation === "DELETE") {
          await db
            .collection(backup.collectionName)
            .insertOne(backup.before, { session });
        } else {
          throw new Error(`Operación de rollback no soportada: ${backup.operation}`);
        }

        await db.collection("migrationbackups").updateOne(
          { _id: backup._id },
          {
            $set: {
              restoredAt: new Date(),
              restoredBy: "scripts/migrations/rollbackBtsPayrollProdCopyMigration.ts",
              updatedAt: new Date(),
            },
          },
          { session },
        );

        restored.push({
          backupId: objectIdToString(backup._id),
          collectionName: backup.collectionName,
          documentId: objectIdToString(backup.documentId),
          operation: backup.operation,
        });
      }

      await db.collection("migrationruns").updateOne(
        { _id: migrationRunId, migrationKey: MIGRATION_KEY },
        {
          $set: {
            status: "ROLLED_BACK",
            finishedAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  return restored;
};

const buildMarkdown = (migrationRunId: any, restored: any[]) => {
  const rows = restored.map((item) => [
    item.operation,
    item.collectionName,
    item.documentId,
    item.backupId,
  ]);

  return [
    `# Rollback ${ALLOWED_DATABASE_NAME}`,
    "",
    `- Migración: \`${MIGRATION_KEY}\``,
    `- MigrationRun: \`${objectIdToString(migrationRunId)}\``,
    `- Restaurados: ${restored.length}`,
    `- Generado: ${new Date().toISOString()}`,
    "",
    rows.length
      ? mdTable(["Operación Original", "Colección", "Documento", "Backup"], rows)
      : "No había backups pendientes de restaurar para este MigrationRun.",
    "",
  ].join("\n");
};

const main = async () => {
  assertExecuteAllowed();

  const migrationRunId = getMigrationRunId();
  const { client, db } = await connectMongoClientToAllowedDb();

  try {
    const run = await db.collection("migrationruns").findOne({
      _id: migrationRunId,
      migrationKey: MIGRATION_KEY,
      databaseName: ALLOWED_DATABASE_NAME,
    });

    if (!run) {
      throw new Error(
        `No se encontró MigrationRun ${objectIdToString(migrationRunId)} para ${MIGRATION_KEY}.`,
      );
    }

    const restored = await rollbackBackups(client, db, migrationRunId);
    const report = {
      migrationKey: MIGRATION_KEY,
      databaseName: db.databaseName,
      migrationRunId: objectIdToString(migrationRunId),
      restoredCount: restored.length,
      restored,
      generatedAt: new Date().toISOString(),
    };
    const stamp = timestampForFile();
    const files = writeReportFiles(
      report,
      `bts-payroll-prod-copy-rollback-${stamp}`,
      buildMarkdown(migrationRunId, restored),
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          database: db.databaseName,
          migrationRunId: objectIdToString(migrationRunId),
          restoredCount: restored.length,
          jsonPath: files.jsonPath,
          mdPath: files.mdPath,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
