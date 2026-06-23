import cron from "node-cron";
import User from "../model/account/user";
import {
  recalculateEmployeeVacationBalance,
  getApplicableLeavePolicyForUser,
} from "../services/vacation/vacationBalanceAccrual.service";

let isRunning = false;

export const startVacationBalanceCron = () => {
  cron.schedule(
    "10 0 * * *",
    async () => {
      if (isRunning) {
        console.warn(
          "[VacationBalanceCron] Ya hay una ejecución activa. Se omite esta corrida.",
        );
        return;
      }

      isRunning = true;

      try {
        console.log("[VacationBalanceCron] Iniciando proceso diario...");

        const cursor = User.find({
          isDeleted: false,
          isActived: true,
          hiringDate: { $exists: true, $ne: "" },
        })
          .select("_id name company hiringDate isDeleted isActived")
          .cursor();

        let processed = 0;
        let updated = 0;
        let failed = 0;

        const asOfDate = new Date();

        for await (const user of cursor) {
          processed += 1;

          try {
            const policy = await getApplicableLeavePolicyForUser(user);

            if (!policy) {
              failed += 1;
              continue;
            }

            const result = await recalculateEmployeeVacationBalance({
              userId: user._id,
              asOfDate,
              performedBy: user._id,
              createMovement: true,
              processCarryOver: true,
              notifyExpiration: true,
            });

            if (result.ok) {
              updated += 1;
            } else {
              failed += 1;
            }
          } catch (error) {
            failed += 1;

            console.error("[VacationBalanceCron] Error procesando empleado:", {
              userId: user._id,
              error,
            });
          }
        }

        console.log("[VacationBalanceCron] Proceso finalizado:", {
          processed,
          updated,
          failed,
        });
      } catch (error) {
        console.error("[VacationBalanceCron] Error general:", error);
      } finally {
        isRunning = false;
      }
    },
    {
      timezone: "America/Santo_Domingo",
    },
  );

  console.log("[VacationBalanceCron] Registrado: 10 0 * * *");
};