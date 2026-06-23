import dotenv from "dotenv";
import mongoose from "mongoose";
import { seedDemoPunches } from "./demoPunches.seed";

dotenv.config();

const run = async () => {
  if (!process.env.DB_CNN) {
    throw new Error("DB_CNN no está configurado.");
  }

  process.env.RUN_DEMO_PUNCH_SEED = "true";

  await mongoose.set("strictQuery", false);
  await mongoose.connect(process.env.DB_CNN, {
    useNewUrlParser: true,
  } as any);

  await seedDemoPunches();
};

run()
  .then(async () => {
    await mongoose.disconnect();
    console.log("Seeder de ponches demo finalizado.");
  })
  .catch(async (error) => {
    console.error("Error ejecutando seeder de ponches demo:", error);
    await mongoose.disconnect();
    process.exit(1);
  });
