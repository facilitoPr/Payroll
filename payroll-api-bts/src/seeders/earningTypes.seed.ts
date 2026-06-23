import PayrollEarningType from "../model/employee-payment-management/payrollEarningType";

const payrollEarningTypes = [
  {
    code: "OVERTIME_35",
    includeForChristmasSalary: false,
    name: "Horas extras 35%",
    description: "Horas extras pagadas con recargo de 35%.",
  },
  {
    code: "OVERTIME_100",
    includeForChristmasSalary: false,
    name: "Horas extras 100%",
    description: "Horas extras pagadas con recargo de 100%.",
  },
  {
    code: "NIGHT_HOURS",
    includeForChristmasSalary: false,
    name: "Horas nocturnas",
    description: "Recargo por horario nocturno.",
  },
  {
    code: "INCENTIVES",
    includeForChristmasSalary: false,
    name: "Incentivos",
    description: "Incentivos especiales aplicados al período.",
  },
  {
    code: "COMMISSIONS",
    includeForChristmasSalary: true,
    name: "Comisiones",
    description: "Comisiones generadas durante el período.",
  },
  {
    code: "BONUS",
    includeForChristmasSalary: false,
    name: "Bonificación",
    description: "Bonificación o bono general.",
  },
  {
    code: "SALARY_BACKPAY",
    includeForChristmasSalary: true,
    name: "Retroactivo salarial",
    description: "Ajustes retroactivos de salario.",
  },
  {
    code: "PAID_VACATIONS",
    includeForChristmasSalary: false,
    name: "Vacaciones pagadas",
    description: "Pago correspondiente a vacaciones.",
  },
  {
    code: "PROPORTIONAL_13TH",
    includeForChristmasSalary: false,
    name: "Regalía proporcional",
    description: "Regalía pascual proporcional del período.",
  },
  {
    code: "SICKNESS_SUBSIDY",
    includeForChristmasSalary: false,
    name: "Subsidio por enfermedad",
    description: "Subsidio por enfermedad común o SISALRIL.",
  },
  {
    code: "MATERNITY_SUBSIDY",
    includeForChristmasSalary: false,
    name: "Subsidio por maternidad",
    description: "Subsidio por maternidad.",
  },
  {
    code: "OTHER_INCOME",
    includeForChristmasSalary: false,
    name: "Otros ingresos",
    description: "Cualquier otro ingreso no clasificado.",
  },

  // Nuevos tipos útiles
  {
    code: "ATTENDANCE_BONUS",
    includeForChristmasSalary: false,
    name: "Bono por asistencia",
    description:
      "Bono otorgado por asistencia completa o buen récord de asistencia.",
  },
  {
    code: "PUNCTUALITY_BONUS",
    includeForChristmasSalary: false,
    name: "Bono por puntualidad",
    description: "Bono otorgado por puntualidad durante el período.",
  },
  {
    code: "PRODUCTIVITY_BONUS",
    includeForChristmasSalary: false,
    name: "Bono por productividad",
    description:
      "Bono otorgado por productividad, rendimiento o cumplimiento de metas.",
  },
  {
    code: "PERFORMANCE_BONUS",
    includeForChristmasSalary: false,
    name: "Bono por desempeño",
    description:
      "Bono especial por desempeño individual o evaluación positiva.",
  },
  {
    code: "TRANSPORT_ALLOWANCE",
    includeForChristmasSalary: false,
    name: "Ayuda de transporte",
    description: "Monto otorgado como ayuda o compensación de transporte.",
  },
  {
    code: "MEAL_ALLOWANCE",
    includeForChristmasSalary: false,
    name: "Dieta o alimentación",
    description: "Monto otorgado para alimentación o dieta.",
  },
  {
    code: "FUEL_ALLOWANCE",
    includeForChristmasSalary: false,
    name: "Ayuda de combustible",
    description: "Monto otorgado para combustible o movilidad.",
  },
  {
    code: "REFERRAL_BONUS",
    includeForChristmasSalary: false,
    name: "Bono por referimiento",
    description: "Bono otorgado por referir personal, clientes o negocios.",
  },
  {
    code: "HOLIDAY_PAY",
    includeForChristmasSalary: false,
    name: "Pago día feriado",
    description: "Pago adicional por trabajo en día feriado.",
  },
  {
    code: "TRAINING_ALLOWANCE",
    includeForChristmasSalary: false,
    name: "Pago por capacitación",
    description:
      "Pago o compensación por capacitación, talleres o entrenamientos.",
  },
  {
    code: "TRAVEL_ALLOWANCE",
    includeForChristmasSalary: false,
    name: "Viáticos",
    description:
      "Monto otorgado por viajes, gestiones o representación fuera de oficina.",
  },
  {
    code: "SPECIAL_PROJECT_BONUS",
    includeForChristmasSalary: false,
    name: "Bono por proyecto especial",
    description: "Bono aplicado por participación en proyectos especiales.",
  },
  {
    code: "POSITIVE_ADJUSTMENT",
    includeForChristmasSalary: false,
    name: "Ajuste positivo",
    description: "Ajuste manual positivo aplicado al período.",
  },
];

export const seedPayrollEarningTypes = async () => {
  try {
    let created = 0;
    let updated = 0;

    for (const item of payrollEarningTypes) {
      const existing = await PayrollEarningType.findOne({
        code: item.code,
      });

      if (existing) {
        existing.name = item.name;
        existing.description = item.description;
        existing.includeForChristmasSalary = item.includeForChristmasSalary;
        existing.isActive = true;
        existing.isDeleted = false;

        await existing.save();
        updated++;
        continue;
      }

      await PayrollEarningType.create({
        code: item.code,
        name: item.name,
        description: item.description,
        includeForChristmasSalary: item.includeForChristmasSalary,
        isActive: true,
        isDeleted: false,
      });

      created++;
    }

    console.log("[seedPayrollEarningTypes] Seed completado:", {
      created,
      updated,
      total: payrollEarningTypes.length,
    });
  } catch (error) {
    console.error("[seedPayrollEarningTypes] Error:", error);
    throw error;
  }
};
