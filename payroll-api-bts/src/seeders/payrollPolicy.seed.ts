import Company from "../model/company";
import PayrollPolicy from "../model/employee-payment-management/payrollPolicy";

export const seedPayrollPolicies = async () => {
  const companies = await Company.find({
    isDeleted: { $ne: true },
    isActive: { $ne: false },
  }).select("_id legalName commercialName name");

  for (const company of companies) {
    const exists = await PayrollPolicy.findOne({
      company: company._id,
      isActive: true,
      isDeleted: false,
    });

    if (exists) continue;

    await PayrollPolicy.create({
      company: company._id,
      name: `Política de nómina - ${
        company.legalName || company.tradeName || "Empresa"
      }`,
      code: "DEFAULT_PAYROLL_POLICY",

      lateGraceEnabled: true,
      lateGraceMinutes: 5,
      lateGraceMode: "FULL_GRACE",

      deductLateArrivals: true,
      deductAbsences: true,

      rdFactorDiasMes: 23.83,
      useGrossSalaryForDailyDiscount: true,

      requireConfirmedDaysDefault: true,
      allowIncompleteDaysOnClose: false,
      autoPaidLeaveNoDeduct: true,

      isActive: true,
      isDeleted: false,
    });
  }

  console.log("[seedPayrollPolicies] Políticas de nómina verificadas.");
};