import mongoose from "mongoose";
import Company from "../model/company";
import EmployeeLoanPolicy from "../model/employeeLoan/employeeLoanPolicy";
import { EMPLOYEE_LOAN_POLICY_CODE } from "../constants/loan";
import { buildDefaultEmployeeLoanPolicyPayload } from "../helper/employeeLoan/employeeLoanPolicy.build";

const MONGO_URI =
  process.env.DB_CNN ||
  "mongodb+srv://doadmin:i4Q81o7f390Pp6OX@bts-development-e8365da0.mongo.ondigitalocean.com/bts-payroll?authSource=admin&replicaSet=bts-development&tls=true";

export const seedEmployeeLoanPoliciesForCompanies = async () => {
  console.log("Iniciando seed de políticas de préstamos por compañía...");

  const companies = await Company.find({
    isDeleted: false,
  }).select("_id legalName commercialName name code isActive isDeleted");

  let created = 0;
  let existing = 0;
  let failed = 0;

  for (const company of companies) {
    try {
      const currentPolicy = await EmployeeLoanPolicy.findOne({
        company: company._id,
        code: EMPLOYEE_LOAN_POLICY_CODE,
        isDeleted: false,
      });

      if (currentPolicy) {
        existing += 1;
        continue;
      }

      await EmployeeLoanPolicy.create(
        buildDefaultEmployeeLoanPolicyPayload(company._id),
      );

      created += 1;

      console.log(
        `Política creada para compañía: ${
          company.tradeName ||
          company.legalName ||
          company.code ||
          company._id
        }`,
      );
    } catch (error) {
      failed += 1;

      console.error("Error creando política para compañía:", {
        companyId: company._id,
        error,
      });
    }
  }

  console.log("Seed finalizado:", {
    companies: companies.length,
    created,
    existing,
    failed,
  });

  return {
    ok: true,
    companies: companies.length,
    created,
    existing,
    failed,
  };
};

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    await seedEmployeeLoanPoliciesForCompanies();

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("Error ejecutando seed de políticas de préstamos:", error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

if (require.main === module) {
  run();
}
