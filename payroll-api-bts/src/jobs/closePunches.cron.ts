import cron from "node-cron";
import { cerrarPonchesIncompletosDelDia } from "../services/workSummary.service";

const tz = process.env.TZ || "America/Santo_Domingo";

export const initClosePunchesJob = () => {
  cron.schedule(
    "0 0 23 * * *",
    () => {
      cerrarPonchesIncompletosDelDia();
    },
    {
      scheduled: true,
      timezone: tz,
    },
  );

  console.log(`[close punches job] programado (TZ=${tz})`);
};
