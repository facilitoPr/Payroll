import { seedDefaultClassificationTemplate } from "./classificationTemplate.seed";
import { seedPayrollEarningTypes } from "./earningTypes.seed";
import { seedPayrollPolicies } from "./payrollPolicy.seed";
import { seedHrMenusAndPermissions } from "./seedHrMenusAndPermissions";
import { seedDefaultRecruitmentAgent } from "./seedRecruitmentAgent";
import { seedRoles } from "./roles.seed";
import { seedPaymentFrequencies } from "./paymentFrecuency.seed";
import { seedPaymentSchedules } from "./paymentSchedule.seed";
import { seedSalaryTypes } from "./salaryType.seed";
import { seedTestEmployees } from "./employees.seed";
import { seedDemoPunches } from "./demoPunches.seed";

const shouldRunSeeders = () => {
  return (
    String(process.env.RUN_SEEDERS || "")
      .trim()
      .toLowerCase() === "true"
  );
};

export const runSeeds = async () => {
  if (!shouldRunSeeders()) {
    console.log(
      "Seeders omitidos. Para ejecutarlos configura RUN_SEEDERS=true.",
    );
    return;
  }

  console.log("Iniciando ejecución de seeders...");

  try {
    /**
     * Seeders base.
     * El orden es importante porque algunos dependen de otros.
     */

    // await seedRoles();

    await seedPaymentFrequencies();
    await seedPaymentSchedules();
    await seedSalaryTypes();
    await seedPayrollEarningTypes();
    // await seedTestEmployees();

    /**
     * Recruitment.
     */
    await seedDefaultRecruitmentAgent();
    await seedDefaultClassificationTemplate();

    /**
     * HR y Payroll.
     */
    await seedHrMenusAndPermissions();
    await seedPayrollPolicies();
    // await seedDemoPunches();

    /**
     * Seeders opcionales.
     */

    // await seedEmployeeLoanPolicies();
    // await seedEmployeeLoanProviderConfig();
    // await seedRecruitmentFormsForGuimanfer(
    //   "69627414dd87dd17e5e045e2",
    // );
    // await seedRecruitmentAgentsForGuimanferJobs();

    console.log("Todos los seeders fueron ejecutados correctamente.");
  } catch (error) {
    console.error("Error ejecutando los seeders:", error);
    throw error;
  }
};
