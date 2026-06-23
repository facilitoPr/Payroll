import SalaryType from "../model/employee-payment-management/salaryType";

export type SalaryTypeCode =
  | "FIJO"
  | "HORAS"
  | "COMISION"
  | "FIJO_COMISION"
  | "JORNAL_DIARIO"
  | "VARIABLE"
  | "POR_TAREA";

const salaryTypes: Array<{
  code: SalaryTypeCode;
  name: string;
  description: string;
  legacyCodes?: string[];
  legacyNames?: string[];
}> = [
  {
    code: "FIJO",
    name: "Fijo",
    description:
      "Empleado con salario fijo mensual. Para cesantía y preaviso se puede usar el salario actual.",
  },
  {
    code: "HORAS",
    name: "Horas",
    description:
      "Empleado pagado por horas trabajadas. Para prestaciones se usa el promedio de ingresos ordinarios.",
    legacyNames: ["Horas de pagos por hora"],
  },
  {
    code: "COMISION",
    name: "Comisión",
    description:
      "Empleado pagado principalmente por comisiones. Para prestaciones se usa el promedio de ingresos ordinarios.",
  },
  {
    code: "FIJO_COMISION",
    name: "Fijo + comisión",
    description:
      "Empleado con salario fijo más comisiones ordinarias. Para prestaciones se usa el promedio de ingresos ordinarios.",
  },
  {
    code: "JORNAL_DIARIO",
    name: "Jornal / diario",
    description:
      "Empleado pagado por día o jornal trabajado. Útil para operaciones, construcción, campo o servicios temporales.",
  },
  {
    code: "VARIABLE",
    name: "Variable",
    description:
      "Empleado con ingresos variables recurrentes. Para prestaciones se usa el promedio de ingresos ordinarios.",
  },
  {
    code: "POR_TAREA",
    name: "Por tarea / destajo",
    description:
      "Empleado pagado por tarea, producción o unidad completada. Útil para trabajos por producción.",
  },
];

export const seedSalaryTypes = async () => {
  for (const salaryType of salaryTypes) {
    const existing = await SalaryType.findOne({
      $or: [
        { code: salaryType.code },
        { name: salaryType.name },
        ...(salaryType.legacyCodes?.length
          ? [{ code: { $in: salaryType.legacyCodes } }]
          : []),
        ...(salaryType.legacyNames?.length
          ? [{ name: { $in: salaryType.legacyNames } }]
          : []),
      ],
    });

    const payload = {
      code: salaryType.code,
      name: salaryType.name,
      description: salaryType.description,
    };

    if (existing) {
      await SalaryType.findByIdAndUpdate(
        existing._id,
        {
          $set: payload,
        },
        {
          new: true,
          setDefaultsOnInsert: true,
        },
      );

      continue;
    }

    await SalaryType.create(payload);
  }

  console.log("[seedSalaryTypes]: Seed completado");
};
