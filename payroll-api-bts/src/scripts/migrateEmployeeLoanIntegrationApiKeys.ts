import mongoose from "mongoose";
import EmployeeLoanIntegrationClient from "../model/employeeLoan/employeeLoanIntegrationClient";
import {
  hashEmployeeLoanIntegrationApiKey,
  isSha256Hash,
} from "../helper/employeeLoan/loanIntegration/employeeLoanIntegration.security";

const MONGO_URI = process.env.DB_CNN;

const run = async () => {
  if (!MONGO_URI) {
    throw new Error("DB_CNN no está configurado.");
  }

  await mongoose.connect(MONGO_URI);

  let migrated = 0;
  let alreadyHashed = 0;
  let skipped = 0;

  const clients = await EmployeeLoanIntegrationClient.find({})
    .select("+apiKeyHash")
    .cursor();

  for await (const client of clients) {
    const currentValue = String(client.apiKeyHash || "").trim();

    if (!currentValue) {
      skipped += 1;

      console.warn(
        `[EmployeeLoanIntegrationMigration] Integración sin API key: ${client.systemCode}`,
      );

      continue;
    }

    if (isSha256Hash(currentValue)) {
      alreadyHashed += 1;
      continue;
    }

    client.apiKeyHash = hashEmployeeLoanIntegrationApiKey(currentValue);

    await client.save();

    migrated += 1;

    console.log(
      `[EmployeeLoanIntegrationMigration] API key migrada: ${client.systemCode}`,
    );
  }

  console.log({
    ok: true,
    migrated,
    alreadyHashed,
    skipped,
  });

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(
    "[EmployeeLoanIntegrationMigration] Error ejecutando migración:",
    error,
  );

  await mongoose.disconnect();

  process.exit(1);
});
