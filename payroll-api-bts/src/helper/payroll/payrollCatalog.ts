// helpers/payrollCatalog.ts

export type EarningsCode =
  | "salary_base"
  | "overtime_35"
  | "overtime_100"
  | "night_hours"
  | "incentives"
  | "commissions"
  | "bonus"
  | "retroactive"
  | "paid_vacations"
  | "proportional_bonus"
  | "sisalril_sick"
  | "maternity"
  | "other_earnings";

export const EARNINGS_CATALOG: { code: EarningsCode; label: string }[] = [
  { code: "salary_base", label: "Salario base" },
  { code: "overtime_35", label: "Horas extras 35%" },
  { code: "overtime_100", label: "Horas extras 100%" },
  { code: "night_hours", label: "Horas nocturnas" },
  { code: "incentives", label: "Incentivos" },
  { code: "commissions", label: "Comisiones" },
  { code: "bonus", label: "Bonificación" },
  { code: "retroactive", label: "Retroactivo salarial" },
  { code: "paid_vacations", label: "Vacaciones pagadas" },
  { code: "proportional_bonus", label: "Regalía proporcional" },
  { code: "sisalril_sick", label: "Subsidio por enfermedad (SISALRIL)" },
  { code: "maternity", label: "Subsidio por maternidad" },
  { code: "other_earnings", label: "Otros ingresos" },
];

export type LegalDeductionCode = "AFP" | "SFS" | "ISR" | "INFOTEP";

export const LEGAL_DEDUCTIONS_CATALOG: {
  code: LegalDeductionCode;
  label: string;
}[] = [
  { code: "AFP", label: "AFP (2.87%)" },
  { code: "SFS", label: "SFS (3.04%)" },
  { code: "ISR", label: "ISR" },
  { code: "INFOTEP", label: "INFOTEP (0.40%)" },
];

// tasas (si no quieres depender de DeductionType para estas)
export const LEGAL_RATES = {
  AFP: 0.0287,
  SFS: 0.0304,
  INFOTEP: 0.004,
};
