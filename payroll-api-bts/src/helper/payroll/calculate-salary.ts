import User from "../../model/account/user";
import {
  calcularISR,
  calcularPagoPorPeriodo,
} from "../../services/workSummary.service";
import EmployeeDeduction from "../../model/employee-payment-management/employeeDeduction";
import IncomeTaxRD, {
  IIncomeTaxBracket,
} from "../../model/employee-payment-management/incomeTaxRD";
import mongoose from "mongoose";
import { round2, toNum } from "../parse";

const normalizeSalaryText = (value: any) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

export const resolveEmployeeSalaryCode = (empleado: any) => {
  const raw =
    empleado?.salaryType?.code ||
    empleado?.salaryType?.name ||
    empleado?.salaryTypeCode ||
    empleado?.tipoSalario ||
    "";

  const value = normalizeSalaryText(raw)
    .replace(/\s+/g, "_")
    .replace(/[+/]/g, "_")
    .replace(/__+/g, "_");

  if (value === "FIJO") return "FIJO";
  if (value === "HORAS" || value.includes("HORA")) return "HORAS";
  if (value === "COMISION" || value.includes("COMISION")) {
    return value.includes("FIJO") ? "FIJO_COMISION" : "COMISION";
  }
  if (value.includes("JORNAL") || value.includes("DIARIO")) {
    return "JORNAL_DIARIO";
  }
  if (value.includes("VARIABLE")) return "VARIABLE";
  if (value.includes("TAREA") || value.includes("DESTAJO")) return "POR_TAREA";

  return value || "FIJO";
};

const getBaseMonthlySalaryFallback = (empleado: any) => {
  return toNum(
    empleado?.baseSalary ??
      empleado?.salaryAmount ??
      empleado?.monthlySalary ??
      empleado?.fixedSalary ??
      empleado?.grossSalary ??
      empleado?.employeeSalary,
    0,
  );
};

// Si quieres mantener la misma convención de “legal”:
type DeductionBreakdownItem = {
  code?: string;
  name?: string;
  isLegal?: boolean;
  amount: number;
  source:
    | "CUSTOM_AMOUNT"
    | "CUSTOM_PERCENTAGE"
    | "TYPE_PERCENTAGE"
    | "TYPE_FIXED_AMOUNT";
  percentageApplied?: number;
  fixedAmountApplied?: number;
};

export function sortBrackets(
  brackets: IIncomeTaxBracket[],
): IIncomeTaxBracket[] {
  return [...(brackets || [])].sort((a, b) => toNum(a.from) - toNum(b.from));
}

/**
 * Para evitar problemas, asume rangos enteros (pesos) si tú lo guardas así.
 * Igual esto funciona con decimales si vinieran.
 */

export function isWithinBracket(income: number, b: IIncomeTaxBracket): boolean {
  const from = toNum(b.from);
  const to = b.to == null ? null : toNum(b.to);
  if (income < from) return false;
  if (to == null) return true;
  return income <= to;
}

//

export async function calcularNetoMensualEmpleado(
  employeeId: string,
  opts: {
    session?: mongoose.ClientSession;
    employeeDoc?: any;
  } = {},
) {
  const { session, employeeDoc } = opts;

  // 1) empleado
  const empleado: any =
    employeeDoc ??
    (await User.findById(employeeId)
      .populate("salaryType")
      .populate({
        path: "paymentSchedule",
        populate: { path: "paymentFrequency" },
      })
      .session(session || null));

  if (!empleado) throw new Error("Empleado no encontrado");

  const tipoSalario = resolveEmployeeSalaryCode(empleado);

  // 2) sueldo bruto mensual. Para salarios variables se usa la base mensual
  // configurada como referencia de ISR/deducciones; el pago real del periodo
  // puede ser recalculado en el cierre segun ponches/ingresos.
  let sueldoBrutoMensual = 0;
  let horasEstimadas = 0;

  if (tipoSalario === "HORAS") {
    horasEstimadas = toNum(empleado.weeklyWorkHours, 0);
    sueldoBrutoMensual = round2(
      toNum(empleado.hourlyRate, 0) * horasEstimadas * 4,
    );
  } else if (
    [
      "FIJO",
      "FIJO_COMISION",
      "COMISION",
      "JORNAL_DIARIO",
      "VARIABLE",
      "POR_TAREA",
    ].includes(tipoSalario)
  ) {
    sueldoBrutoMensual = getBaseMonthlySalaryFallback(empleado);
  } else {
    sueldoBrutoMensual = getBaseMonthlySalaryFallback(empleado);
  }

  sueldoBrutoMensual = round2(sueldoBrutoMensual);

  // 3) frecuencia de pago + bruto por período
  const paymentFrequency = empleado.paymentSchedule?.paymentFrequency;
  const frecuenciaPago = paymentFrequency?.name?.toLowerCase() || "mensual";

  const sueldoBrutoPeriodo = round2(
    calcularPagoPorPeriodo(frecuenciaPago, sueldoBrutoMensual),
  );

  // 4) deducciones del empleado (con breakdown)
  const deduccionesDocs: any[] = await EmployeeDeduction.find({
    user: employeeId,
    isEnabled: true,
  })
    .populate("deductionType")
    .session(session || null);

  let totalDeduccionesMensual = 0; // pre + post (sin ISR)
  let totalDeduccionesLegalesParaBaseISR = 0; // legales PRE-ISR (según tu regla)
  let totalDeduccionesPreISRMensual = 0;
  let totalDeduccionesPostISRMensual = 0;

  const deduccionesPreISR: DeductionBreakdownItem[] = [];
  const deduccionesPostISR: DeductionBreakdownItem[] = [];

  for (const d of deduccionesDocs) {
    let montoMensual = 0;
    let source: DeductionBreakdownItem["source"] = "TYPE_FIXED_AMOUNT";
    const tipoDeduccion: any = d.deductionType;

    const deducibleIsr =
      typeof d.deducibleIsr === "boolean"
        ? d.deducibleIsr
        : !!tipoDeduccion?.deducibleIsr;

    if (!!d.customAmount) {
      montoMensual = toNum(d.customAmount, 0);
      source = "CUSTOM_AMOUNT";
    } else if (!!d.customPercentage) {
      montoMensual = round2(
        (toNum(d.customPercentage, 0) / 100) * sueldoBrutoMensual,
      );
      source = "CUSTOM_PERCENTAGE";
    } else if (!!tipoDeduccion?.percentage) {
      montoMensual = round2(
        (toNum(tipoDeduccion.percentage, 0) / 100) * sueldoBrutoMensual,
      );
      source = "TYPE_PERCENTAGE";
    } else if (!!tipoDeduccion?.fixedAmount) {
      montoMensual = toNum(tipoDeduccion.fixedAmount, 0);
      source = "TYPE_FIXED_AMOUNT";
    }

    montoMensual = round2(montoMensual);
    if (montoMensual <= 0) continue;

    totalDeduccionesMensual = round2(totalDeduccionesMensual + montoMensual);

    const isLegal = !!tipoDeduccion?.isLegal;

    // ✅ tu regla actual
    const aplicaEnBaseISR = isLegal && !deducibleIsr;
    if (aplicaEnBaseISR) {
      totalDeduccionesLegalesParaBaseISR = round2(
        totalDeduccionesLegalesParaBaseISR + montoMensual,
      );
    }

    const item: DeductionBreakdownItem = {
      code: tipoDeduccion?.code,
      name: tipoDeduccion?.name,
      isLegal,
      amount: montoMensual,
      source,
      percentageApplied:
        source === "CUSTOM_PERCENTAGE"
          ? toNum(d.customPercentage, 0)
          : source === "TYPE_PERCENTAGE"
            ? toNum(tipoDeduccion?.percentage, 0)
            : undefined,
      fixedAmountApplied:
        source === "CUSTOM_AMOUNT"
          ? toNum(d.customAmount, 0)
          : source === "TYPE_FIXED_AMOUNT"
            ? toNum(tipoDeduccion?.fixedAmount, 0)
            : undefined,
      // @ts-ignore
      deducibleIsr,
      // @ts-ignore
      aplicaEnBaseISR,
    };

    if (deducibleIsr) {
      deduccionesPostISR.push(item);
      totalDeduccionesPostISRMensual = round2(
        totalDeduccionesPostISRMensual + montoMensual,
      );
    } else {
      deduccionesPreISR.push(item);
      totalDeduccionesPreISRMensual = round2(
        totalDeduccionesPreISRMensual + montoMensual,
      );
    }
  }

  // 5) Base ISR
  const baseISR = round2(
    Math.max(0, sueldoBrutoMensual - totalDeduccionesLegalesParaBaseISR),
  );

  // 6) tabla ISR
  const isrTable: any = await IncomeTaxRD.findOne({
    isActive: true,
    isDeleted: false,
  })
    .sort({ year: -1, version: -1 })
    .session(session || null)
    .lean();

  if (!isrTable) throw new Error("No existe tabla ISR activa (IncomeTaxRD)");

  const isrInfo = calculateMonthlyISR({
    grossMonthly: baseISR,
    table: isrTable,
  });
  const isrMensual = round2(toNum(isrInfo.amount, 0));

  // 7) total deducciones + ISR
  const totalDeduccionesConISR = round2(totalDeduccionesMensual + isrMensual);

  // 8) neto
  const sueldoNetoMensual = round2(
    Math.max(0, sueldoBrutoMensual - totalDeduccionesConISR),
  );

  const totalDeduccionesPeriodo = round2(
    calcularPagoPorPeriodo(frecuenciaPago, totalDeduccionesConISR),
  );
  const sueldoNetoPeriodo = round2(
    Math.max(0, sueldoBrutoPeriodo - totalDeduccionesPeriodo),
  );

  return {
    employeeId,
    tipoSalario,
    frecuenciaPago,
    sueldoBrutoMensual,
    sueldoBrutoPeriodo,
    horasEstimadas,

    deducciones: [
      ...deduccionesPreISR,
      ...(isrMensual > 0
        ? [
            {
              code: "ISR",
              name: "ISR",
              isLegal: true,
              amount: isrMensual,
              source: "AUTO_ISR",
              // @ts-ignore
              deducibleIsr: false,
              // @ts-ignore
              aplicaEnBaseISR: true,
            },
          ]
        : []),
      ...deduccionesPostISR,
    ],

    totalDeduccionesMensual,
    totalDeduccionesPreISRMensual,
    totalDeduccionesPostISRMensual,
    totalDeduccionesLegalesParaBaseISR,

    baseISR,
    isr: {
      ...isrInfo,
      amount: isrMensual,
      tableMeta: {
        year: isrTable.year,
        version: isrTable.version,
        id: String(isrTable._id),
      },
    },

    totalDeduccionesConISR,
    sueldoNetoMensual,
    sueldoNetoPeriodo,
  };
}

export function calculateMonthlyISR(params: {
  grossMonthly: number;
  table: any;
}) {
  const gross = round2(toNum(params.grossMonthly, 0));
  const table = params.table;

  // Exento mensual (de la tabla)
  const exempt = round2(toNum(table?.exemptAmount, 0));

  // Si está por debajo o igual al exento => 0
  if (gross <= exempt) {
    return {
      amount: 0,
      taxableExcess: 0,
      exemptAmount: exempt,
      tableMeta: {
        year: table.year,
        version: table.version,
        notes: table.notes,
      },
    };
  }

  const brackets = sortBrackets(table?.brackets || []);
  const b = brackets.find((x) => isWithinBracket(gross, x));

  // Si no encuentra tramo (tabla mal configurada), no explota:
  if (!b) {
    return {
      amount: 0,
      taxableExcess: 0,
      exemptAmount: exempt,
      tableMeta: {
        year: table.year,
        version: table.version,
        notes: table.notes,
      },
    };
  }

  const from = round2(toNum(b.from, 0));
  const rate = toNum(b.rate, 0);
  const fixedAmount = round2(toNum(b.fixedAmount, 0));

  const excess = Math.max(0, round2(gross - from));
  const isr = round2(fixedAmount + round2(excess * rate));

  return {
    amount: isr,
    taxableExcess: excess,
    exemptAmount: exempt,
    bracket: {
      from,
      to: b.to ?? null,
      rate,
      fixedAmount,
      label: b.label,
    },
    tableMeta: { year: table.year, version: table.version, notes: table.notes },
  };
}

export function calculateDeductions(params: {
  gross: number;
  afterISR: number;
  deductions: any[];
}): any[] {
  const gross = round2(toNum(params.gross, 0));
  const afterISR = round2(toNum(params.afterISR, 0));
  const list = Array.isArray(params.deductions) ? params.deductions : [];

  const results: any[] = [];

  for (const d of list) {
    if (!d?.isEnabled) continue;

    const baseUsed = d.base || "GROSS";
    const baseValue = baseUsed === "AFTER_ISR" ? afterISR : gross;

    const mode = d.mode || "BOTH";
    const pct = Math.max(0, toNum(d.percentage, 0)); // en %
    const fixed = Math.max(0, toNum(d.amount, 0));

    let pctAmount = 0;
    let fixedAmount = 0;

    if (mode === "PERCENTAGE" || mode === "BOTH") {
      pctAmount = round2(baseValue * (pct / 100));
    }
    if (mode === "FIXED" || mode === "BOTH") {
      fixedAmount = round2(fixed);
    }

    const total = round2(pctAmount + fixedAmount);

    results.push({
      code: d.code,
      name: d.name,
      baseUsed,
      percentageApplied: pct,
      fixedAmountApplied: fixedAmount,
      amount: total,
      description: d.description,
    });
  }

  return results;
}

export function buildMonthlyPayrollSettlement(params: {
  grossMonthly: number; // sueldo bruto del mes (o base imponible si así lo decides)
  isrTable: any; // tabla ISR activa mensual
  deductions?: any[]; // otras deducciones (TSS, INFOTEP, etc.)
}): any {
  const gross = round2(toNum(params.grossMonthly, 0));

  // 1) ISR
  const isr = calculateMonthlyISR({
    grossMonthly: gross,
    table: params.isrTable,
  });

  // 2) Base después de ISR
  const afterISR = round2(Math.max(0, gross - isr.amount));

  // 3) Otras deducciones
  const deductions = calculateDeductions({
    gross,
    afterISR,
    deductions: params.deductions || [],
  });

  const totalDeductions = round2(
    deductions.reduce((acc, x) => acc + toNum(x.amount, 0), 0),
  );

  // 4) Neto final
  const net = round2(Math.max(0, gross - isr.amount - totalDeductions));

  return {
    gross,
    isr,
    deductions,
    totalDeductions,
    net,
    totals: {
      afterISR,
      afterAllDeductions: net,
    },
  };
}

// export async function calcularPagoNetoRDPorRango(params: {
//   empleado: any; // el user ya poblado en tu loop (r.user)
//   dateString: string; // r.dateString
//   workedMinutes: number; // r.totalMinutes
// }) {
//   const { empleado, dateString, workedMinutes } = params;

//   // 1) neto mensual real (bruto - deducciones - ISR)
//   const netoInfo = await calcularNetoMensualEmpleado(String(empleado._id));
//   const netoMensual = Number(netoInfo.sueldoNetoMensual || 0);

//   // 2) neto diario RD
//   const netoDiario = netoMensual / RD_WORK_DAYS_FACTOR;

//   // 3) expected day hours (según schedule) + shouldWork
//   const expected = calcExpectedMinutesForDate(empleado.schedule, dateString);

//   const workedHours = workedMinutes / 60;
//   const expectedHours = expected.expectedHours;

//   // Si no debía trabajar, por defecto 0 (a menos que quieras pagar “día especial”)
//   if (!expected.shouldWork || expectedHours <= 0) {
//     return {
//       netoMensual: round2(netoMensual),
//       netoDiario: round2(netoDiario),
//       expectedHours: round2(expectedHours),
//       workedHours: round2(workedHours),
//       ratio: 0,
//       netoDiaPagado: 0,
//       shouldWork: expected.shouldWork,
//     };
//   }

//   // 4) proporcional
//   let ratio = workedHours / expectedHours;

//   // ✅ recomendado: cap a 1 para no pagar más de 1 día neto (si overtime va aparte)
//   if (ratio > 1) ratio = 1;
//   if (ratio < 0) ratio = 0;

//   const netoDiaPagado = netoDiario * ratio;

//   return {
//     netoMensual: round2(netoMensual),
//     netoDiario: round2(netoDiario),
//     expectedHours: round2(expectedHours),
//     workedHours: round2(workedHours),
//     ratio: round2(ratio),
//     netoDiaPagado: round2(netoDiaPagado),
//     shouldWork: true,
//   };
// }
