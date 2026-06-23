import { IPayrollPaymentEarningLine } from "../../model/employee-payment-management/payrollPayment";
import { IPunchHistory } from "../../model/punch/puncHistory";
import { toObjectId } from "../objectIds";
import crypto from "crypto";

export type ConfirmScopeMode =
  | "COMPANY"
  | "DEPARTMENT"
  | "JOB_POSITION"
  | "PROJECT"
  | "EMPLOYEES";

export const validScopeModes: ConfirmScopeMode[] = [
  "COMPANY",
  "DEPARTMENT",
  "JOB_POSITION",
  "PROJECT",
  "EMPLOYEES",
];

const normalizeText = (value: any) =>
  String(value || "")
    .trim()
    .toUpperCase();

const toDateFromYMD = (value: string, endOfDay = false) => {
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0,
    ),
  );
};

export const buildEarliestEntryByWS = (punches: IPunchHistory[]) => {
  const earliestEntryByWS = new Map<string, any>();

  for (const p of punches || []) {
    if (!p?.workSummary) continue;
    if (p.punchStep !== "entrada") continue;
    if (!p?.expectedTime || !p?.timestamp) continue;

    const wsKey = String(p.workSummary);
    const prev = earliestEntryByWS.get(wsKey);

    if (!prev) {
      earliestEntryByWS.set(wsKey, p);
      continue;
    }

    const curTs = new Date(p.timestamp).getTime();
    const prevTs = new Date(prev.timestamp).getTime();
    if (curTs < prevTs) earliestEntryByWS.set(wsKey, p);
  }

  return earliestEntryByWS;
};

export const buildEmptyPayrollResponse = ({
  frequencyCode,
  periodDivisor,
  paymentSchedule,
  paymentScheduleName,
  page,
  limit,
}: {
  frequencyCode: string;
  periodDivisor: number;
  paymentSchedule: string;
  paymentScheduleName: string;
  page: number;
  limit: number;
}) => {
  return {
    ok: true,
    frequencyCode,
    periodDivisor,
    paymentSchedule: {
      _id: paymentSchedule,
      name: paymentScheduleName,
    },
    dias: [],
    employees: [],
    totals: {
      totalLateMinutes: 0,
      totalLateHours: 0,
      totalDiscountTardanza: 0,
      totalDiscountAusencia: 0,
      totalDiscounts: 0,
      totalNetoADepositar: 0,
      totalWorkedMinutes: 0,
      totalWorkedHours: 0,
      totalGrossPay: 0,
      totalEmployees: 0,
    },
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  };
};

export const buildEmployeeQueryFromScope = ({
  scopeMode,
  companyId,
  departmentId,
  jobPositionId,
  projectId,
  paymentScheduleId,
  userIds = [],
}: {
  scopeMode: ConfirmScopeMode;
  companyId?: string;
  departmentId?: string;
  jobPositionId?: string;
  projectId?: string;
  paymentScheduleId?: string;
  userIds?: string[];
}) => {
  const query: any = {
    isDeleted: false,
    isActived: true,
  };

  const companyObjectId = toObjectId(String(companyId));
  const departmentObjectId = toObjectId(String(departmentId));
  const jobPositionObjectId = toObjectId(String(jobPositionId));
  const projectObjectId = toObjectId(String(projectId));
  const paymentScheduleObjectId = toObjectId(String(paymentScheduleId));

  if (scopeMode === "COMPANY") {
    if (!companyObjectId) {
      return {
        ok: false,
        mensaje: "Debe enviar companyId para confirmar una empresa completa.",
      };
    }

    query.company = companyObjectId;
  }

  if (scopeMode === "DEPARTMENT") {
    if (!departmentObjectId) {
      return {
        ok: false,
        mensaje:
          "Debe enviar departmentId para confirmar un departamento completo.",
      };
    }

    if (companyObjectId) query.company = companyObjectId;
    query.department = departmentObjectId;
  }

  if (scopeMode === "JOB_POSITION") {
    if (!jobPositionObjectId) {
      return {
        ok: false,
        mensaje:
          "Debe enviar jobPositionId para confirmar un puesto de trabajo completo.",
      };
    }

    if (companyObjectId) query.company = companyObjectId;
    if (departmentObjectId) query.department = departmentObjectId;
    query.jobPosition = jobPositionObjectId;
  }

  if (scopeMode === "PROJECT") {
    if (!projectObjectId) {
      return {
        ok: false,
        mensaje: "Debe enviar projectId para confirmar un proyecto completo.",
      };
    }

    if (companyObjectId) query.company = companyObjectId;
    if (departmentObjectId) query.department = departmentObjectId;
    if (jobPositionObjectId) query.jobPosition = jobPositionObjectId;
    query.project = projectObjectId;
  }

  if (scopeMode === "EMPLOYEES") {
    const ids = (userIds || [])
      .map((id) => toObjectId(String(id)))
      .filter(Boolean);

    if (!ids.length) {
      return {
        ok: false,
        mensaje: "Debe enviar userIds para confirmar empleados específicos.",
      };
    }

    query._id = { $in: ids };

    if (companyObjectId) query.company = companyObjectId;
    if (departmentObjectId) query.department = departmentObjectId;
    if (jobPositionObjectId) query.jobPosition = jobPositionObjectId;
    if (projectObjectId) query.project = projectObjectId;
  }

  if (paymentScheduleObjectId) {
    query.paymentSchedule = paymentScheduleObjectId;
  }

  return {
    ok: true,
    query,
  };
};

// KEY

export const buildPayrollRunKey = ({
  companyId,
  start,
  end,
  projectId,
  frequencyCode,
  userIds,
}: {
  companyId: string;
  start: string;
  end: string;
  projectId?: any;
  frequencyCode?: string | null;
  userIds: string[];
}) => {
  const normalizedUserIds = [...(userIds || [])].map((id) => String(id)).sort();

  const raw = JSON.stringify({
    companyId: String(companyId),
    start,
    end,
    projectId: projectId ? String(projectId) : null,
    frequencyCode: frequencyCode ? String(frequencyCode) : null,
    userIds: normalizedUserIds,
  });

  return crypto.createHash("sha256").update(raw).digest("hex");
};

//

const includesAny = (value: string, words: string[]) => {
  return words.some((word) => value.includes(word));
};

const roundPayrollAmount = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const inferPayrollEarningSource = (
  earning: Partial<IPayrollPaymentEarningLine>,
): IPayrollPaymentEarningLine["source"] => {
  const name = normalizeText(earning.nombre);
  const code = normalizeText(earning.code);
  const type = normalizeText(earning.type);
  const sourceText = `${name} ${code} ${type}`;

  if (
    includesAny(sourceText, [
      "BASE",
      "SUELDO",
      "SALARIO",
      "FIXED",
      "FIJO",
      "BASE_SALARY",
    ])
  ) {
    return "BASE_SALARY";
  }

  if (
    includesAny(sourceText, [
      "HORA",
      "HORAS",
      "HOURLY",
      "HOURLY_SALARY",
      "POR HORA",
    ])
  ) {
    return "HOURLY";
  }

  if (includesAny(sourceText, ["COMISION", "COMISIÓN", "COMMISSION"])) {
    return "COMMISSION";
  }

  if (includesAny(sourceText, ["BONO", "BONUS", "INCENTIVO", "INCENTIVE"])) {
    return "BONUS";
  }

  if (includesAny(sourceText, ["MANUAL", "AJUSTE", "ADJUSTMENT"])) {
    return "MANUAL";
  }

  return "OTHER";
};

export const shouldExcludeFromOrdinarySalary = (
  earning: Partial<IPayrollPaymentEarningLine>,
) => {
  const name = normalizeText(earning.nombre);
  const code = normalizeText(earning.code);
  const type = normalizeText(earning.type);
  const sourceText = `${name} ${code} ${type}`;

  /**
   * Estos conceptos normalmente NO deberían ser salario ordinario.
   * Puedes ampliar esta lista según tus conceptos reales.
   */
  return includesAny(sourceText, [
    "REEMBOLSO",
    "REIMBURSEMENT",
    "VIATICO",
    "VIÁTICO",
    "DIETA",
    "GASTO",
    "EXPENSE",
    "RETROACTIVO NO ORDINARIO",
    "NO ORDINARIO",
  ]);
};

export const normalizePayrollEarningsForLabor = (
  earnings: Partial<IPayrollPaymentEarningLine>[] = [],
): IPayrollPaymentEarningLine[] => {
  return earnings.map((earning) => {
    const source = earning.source || inferPayrollEarningSource(earning);

    const excluded = shouldExcludeFromOrdinarySalary(earning);

    const isOrdinarySalary =
      earning.isOrdinarySalary !== undefined
        ? earning.isOrdinarySalary
        : !excluded;

    const includeForTerminationAverage =
      earning.includeForTerminationAverage !== undefined
        ? earning.includeForTerminationAverage
        : isOrdinarySalary;

    const includeForChristmasSalary =
      earning.includeForChristmasSalary !== undefined
        ? earning.includeForChristmasSalary === true
        : isOrdinarySalary &&
          ["BASE_SALARY", "HOURLY", "COMMISSION"].includes(source || "");

    return {
      nombre: String(earning.nombre || "Ingreso").trim(),

      code: earning.code || source || "OTHER",
      type: earning.type || "",

      source,

      montoMensual: Number(earning.montoMensual || 0),
      montoPeriodo: Number(earning.montoPeriodo || 0),

      isOrdinarySalary,
      includeForTerminationAverage,
      includeForChristmasSalary,
    };
  });
};

export const buildPayrollLaborBaseSnapshot = (
  earnings: IPayrollPaymentEarningLine[] = [],
) => {
  let ordinarySalaryPeriod = 0;
  let ordinarySalaryMonthly = 0;

  let terminationAverageAmountPeriod = 0;
  let christmasSalaryAmountPeriod = 0;
  let nonOrdinaryAmountPeriod = 0;

  const includedEarnings: string[] = [];
  const excludedEarnings: string[] = [];

  for (const earning of earnings) {
    const amountPeriod = Number(earning.montoPeriodo || 0);
    const amountMonthly = Number(earning.montoMensual || 0);

    const label = earning.code
      ? `${earning.code} - ${earning.nombre}`
      : earning.nombre;

    if (earning.isOrdinarySalary !== false) {
      ordinarySalaryPeriod += amountPeriod;
      ordinarySalaryMonthly += amountMonthly;
      includedEarnings.push(label);
    } else {
      nonOrdinaryAmountPeriod += amountPeriod;
      excludedEarnings.push(label);
    }

    if (earning.includeForTerminationAverage !== false) {
      terminationAverageAmountPeriod += amountPeriod;
    }

    if (earning.includeForChristmasSalary === true) {
      christmasSalaryAmountPeriod += amountPeriod;
    }
  }

  const christmasSalaryEligibleOrdinaryEarningsAmountPeriod =
    roundPayrollAmount(christmasSalaryAmountPeriod);
  const christmasSalaryAccrualAmountPeriod = roundPayrollAmount(
    christmasSalaryEligibleOrdinaryEarningsAmountPeriod / 12,
  );

  return {
    ordinarySalaryPeriod,
    ordinarySalaryMonthly,

    terminationAverageAmountPeriod,
    christmasSalaryAmountPeriod: christmasSalaryEligibleOrdinaryEarningsAmountPeriod,
    christmasSalaryEligibleOrdinaryEarningsAmountPeriod,
    christmasSalaryAccrualAmountPeriod,

    nonOrdinaryAmountPeriod,

    includedEarnings,
    excludedEarnings,

    version: 2,
  };
};

export const buildPayrollPaymentPeriodMeta = ({
  start,
  end,
  payDate,
}: {
  start: string;
  end: string;
  payDate: Date;
}) => {
  const periodStart = toDateFromYMD(start, false);
  const periodEnd = toDateFromYMD(end, true);

  const year = periodEnd.getUTCFullYear();
  const month = periodEnd.getUTCMonth() + 1;

  return {
    periodStart,
    periodEnd,
    payDate,
    year,
    month,
    periodKey: `${year}-${String(month).padStart(2, "0")}`,
  };
};

export const attachLaborBaseToPayrollSnapshot = (snapshot: any) => {
  const normalizedEarnings = normalizePayrollEarningsForLabor(
    snapshot?.earnings || [],
  );

  snapshot.earnings = normalizedEarnings;
  snapshot.laborBase = buildPayrollLaborBaseSnapshot(normalizedEarnings);

  return snapshot;
};
