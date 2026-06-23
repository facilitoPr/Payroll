import moment from "moment-timezone";

const TIMEZONE = "America/Santo_Domingo";

export const SUPPORTED_EMPLOYEE_LOAN_PAYMENT_FREQUENCIES = [
  "BIWEEKLY",
  "SEMIMONTHLY",
  "MONTHLY",
] as const;

export type SupportedEmployeeLoanPaymentFrequency =
  (typeof SUPPORTED_EMPLOYEE_LOAN_PAYMENT_FREQUENCIES)[number];

export interface IEmployeeLoanPaymentScheduleInfo {
  supported: boolean;
  frequencyCode: string;
  normalizedFrequency: SupportedEmployeeLoanPaymentFrequency | null;
  frequencyLabel: string;
  paymentsPerYear: number;
  paymentDays: number[];
  monthlyPaymentDay: number | null;
  message: string;
}

export interface IEmployeeLoanPaymentScheduleResult
  extends IEmployeeLoanPaymentScheduleInfo {
  generatedAt: Date;
  firstPaymentDate: Date;
  dueDates: Date[];
}

const toIntegerOrNull = (value: any): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.floor(numericValue);
};

const normalizeDayOfMonth = (
  value: any,
  fallback: number | null = null,
): number | null => {
  const day = toIntegerOrNull(value);

  if (day === null) {
    return fallback;
  }

  return Math.min(31, Math.max(1, day));
};

const uniqueSortedDays = (values: any[]): number[] => {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeDayOfMonth(value))
        .filter((value): value is number => value !== null),
    ),
  ).sort((a, b) => a - b);
};

const extractDayArray = (paymentSchedule: any): number[] => {
  const rawCandidates = [
    paymentSchedule?.paymentDays,
    paymentSchedule?.payDays,
    paymentSchedule?.days,
    paymentSchedule?.daysOfMonth,
    paymentSchedule?.salaryPaymentDays,
    paymentSchedule?.payrollDays,
  ];

  for (const candidate of rawCandidates) {
    if (Array.isArray(candidate)) {
      const result = uniqueSortedDays(candidate);

      if (result.length) {
        return result;
      }
    }
  }

  return [];
};

const extractSemimonthlyDays = (paymentSchedule: any): number[] => {
  const daysFromArray = extractDayArray(paymentSchedule);

  if (daysFromArray.length >= 2) {
    return daysFromArray.slice(0, 2);
  }

  const firstDay = normalizeDayOfMonth(
    paymentSchedule?.firstPaymentDay ??
      paymentSchedule?.firstPayDay ??
      paymentSchedule?.firstDay ??
      paymentSchedule?.paymentDayOne ??
      paymentSchedule?.dayOne,
    15,
  );

  const secondDay = normalizeDayOfMonth(
    paymentSchedule?.secondPaymentDay ??
      paymentSchedule?.secondPayDay ??
      paymentSchedule?.secondDay ??
      paymentSchedule?.paymentDayTwo ??
      paymentSchedule?.dayTwo,
    30,
  );

  return uniqueSortedDays([firstDay, secondDay]);
};

const extractMonthlyPaymentDay = (paymentSchedule: any): number | null => {
  const daysFromArray = extractDayArray(paymentSchedule);

  if (daysFromArray.length) {
    return daysFromArray[0];
  }

  return normalizeDayOfMonth(
    paymentSchedule?.monthlyPaymentDay ??
      paymentSchedule?.monthlyPayDay ??
      paymentSchedule?.paymentDay ??
      paymentSchedule?.payDay ??
      paymentSchedule?.dayOfMonth ??
      paymentSchedule?.monthlyDay ??
      paymentSchedule?.salaryPaymentDay,
  );
};

export const normalizeEmployeeLoanPaymentFrequency = (
  value: any,
): SupportedEmployeeLoanPaymentFrequency | null => {
  const normalizedValue = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[ÁÀÄÂ]/g, "A")
    .replace(/[ÉÈËÊ]/g, "E")
    .replace(/[ÍÌÏÎ]/g, "I")
    .replace(/[ÓÒÖÔ]/g, "O")
    .replace(/[ÚÙÜÛ]/g, "U")
    .replace(/Ñ/g, "N")
    .replace(/[\s-]+/g, "_");

  const aliases: Record<string, SupportedEmployeeLoanPaymentFrequency> = {
    BIWEEKLY: "BIWEEKLY",
    BI_WEEKLY: "BIWEEKLY",
    FORTNIGHTLY: "BIWEEKLY",
    QUINCENAL: "BIWEEKLY",
    QUINCENA: "BIWEEKLY",

    SEMIMONTHLY: "SEMIMONTHLY",
    SEMI_MONTHLY: "SEMIMONTHLY",
    DOS_VECES_AL_MES: "SEMIMONTHLY",

    MONTHLY: "MONTHLY",
    MENSUAL: "MONTHLY",
    MES: "MONTHLY",
  };

  return aliases[normalizedValue] || null;
};

const getRawFrequencyCode = (employee: any): string => {
  const paymentSchedule = employee?.paymentSchedule || {};
  const paymentFrequency = paymentSchedule?.paymentFrequency;

  return String(
    paymentFrequency?.code ??
      paymentFrequency?.name ??
      paymentSchedule?.frequencyCode ??
      paymentSchedule?.frequency ??
      employee?.paymentFrequencyCode ??
      employee?.paymentFrequency ??
      "",
  )
    .trim()
    .toUpperCase();
};

export const getEmployeeLoanPaymentScheduleInfo = (
  employee: any,
  frequencyOverride?: any,
): IEmployeeLoanPaymentScheduleInfo => {
  const paymentSchedule = employee?.paymentSchedule || {};
  const frequencyCode = String(
    frequencyOverride || getRawFrequencyCode(employee),
  )
    .trim()
    .toUpperCase();
  const normalizedFrequency = normalizeEmployeeLoanPaymentFrequency(
    frequencyCode,
  );

  if (!normalizedFrequency) {
    return {
      supported: false,
      frequencyCode,
      normalizedFrequency: null,
      frequencyLabel: frequencyCode || "Sin frecuencia configurada",
      paymentsPerYear: 0,
      paymentDays: [],
      monthlyPaymentDay: null,
      message:
        "Los préstamos solo están disponibles para empleados con pago quincenal o mensual.",
    };
  }

  if (
    normalizedFrequency === "BIWEEKLY" ||
    normalizedFrequency === "SEMIMONTHLY"
  ) {
    const paymentDays = extractSemimonthlyDays(paymentSchedule);

    return {
      supported: true,
      frequencyCode,
      normalizedFrequency,
      frequencyLabel: "Quincenal",
      paymentsPerYear: 24,
      paymentDays,
      monthlyPaymentDay: null,
      message: "Fechas de pago quincenales configuradas correctamente.",
    };
  }

  const monthlyPaymentDay = extractMonthlyPaymentDay(paymentSchedule);

  if (!monthlyPaymentDay) {
    return {
      supported: false,
      frequencyCode,
      normalizedFrequency,
      frequencyLabel: "Mensual",
      paymentsPerYear: 12,
      paymentDays: [],
      monthlyPaymentDay: null,
      message:
        "El empleado tiene pago mensual, pero no tiene configurado el día de pago mensual.",
    };
  }

  return {
    supported: true,
    frequencyCode,
    normalizedFrequency,
    frequencyLabel: "Mensual",
    paymentsPerYear: 12,
    paymentDays: [monthlyPaymentDay],
    monthlyPaymentDay,
    message: "Fecha de pago mensual configurada correctamente.",
  };
};

const buildDateForMonth = ({
  year,
  month,
  day,
}: {
  year: number;
  month: number;
  day: number;
}) => {
  const monthReference = moment
    .tz({ year, month, day: 1 }, TIMEZONE)
    .startOf("day");

  const lastDayOfMonth = monthReference.daysInMonth();
  const safeDay = Math.min(Math.max(day, 1), lastDayOfMonth);

  return monthReference.date(safeDay).startOf("day");
};

const buildSemimonthlyDueDates = ({
  fromDate,
  installments,
  paymentDays,
}: {
  fromDate: Date;
  installments: number;
  paymentDays: number[];
}): Date[] => {
  const dueDates: Date[] = [];
  const cleanInstallments = Math.max(1, Math.floor(installments));
  const start = moment.tz(fromDate, TIMEZONE).startOf("day");
  const cleanPaymentDays =
    paymentDays.length >= 2 ? paymentDays.slice(0, 2) : [15, 30];

  let monthCursor = start.clone().startOf("month");
  let safetyCounter = 0;

  while (dueDates.length < cleanInstallments && safetyCounter < 240) {
    for (const paymentDay of cleanPaymentDays) {
      const candidate = buildDateForMonth({
        year: monthCursor.year(),
        month: monthCursor.month(),
        day: paymentDay,
      });

      if (candidate.isAfter(start, "day")) {
        dueDates.push(candidate.toDate());
      }

      if (dueDates.length >= cleanInstallments) {
        break;
      }
    }

    monthCursor = monthCursor.add(1, "month").startOf("month");
    safetyCounter += 1;
  }

  return dueDates;
};

const buildMonthlyDueDates = ({
  fromDate,
  installments,
  monthlyPaymentDay,
}: {
  fromDate: Date;
  installments: number;
  monthlyPaymentDay: number;
}): Date[] => {
  const dueDates: Date[] = [];
  const cleanInstallments = Math.max(1, Math.floor(installments));
  const start = moment.tz(fromDate, TIMEZONE).startOf("day");

  let monthCursor = start.clone().startOf("month");
  let safetyCounter = 0;

  while (dueDates.length < cleanInstallments && safetyCounter < 240) {
    const candidate = buildDateForMonth({
      year: monthCursor.year(),
      month: monthCursor.month(),
      day: monthlyPaymentDay,
    });

    if (candidate.isAfter(start, "day")) {
      dueDates.push(candidate.toDate());
    }

    monthCursor = monthCursor.add(1, "month").startOf("month");
    safetyCounter += 1;
  }

  return dueDates;
};

export const buildEmployeeLoanPaymentSchedule = ({
  employee,
  installments,
  fromDate = new Date(),
  frequencyOverride,
}: {
  employee: any;
  installments: number;
  fromDate?: Date;
  frequencyOverride?: any;
}): IEmployeeLoanPaymentScheduleResult => {
  const info = getEmployeeLoanPaymentScheduleInfo(
    employee,
    frequencyOverride,
  );

  if (!info.supported || !info.normalizedFrequency) {
    throw {
      statusCode: 400,
      mensaje: info.message,
      message: "Employee payment frequency is not supported for loans.",
      data: info,
    };
  }

  const cleanInstallments = Math.max(1, Math.floor(Number(installments || 0)));

  const dueDates =
    info.normalizedFrequency === "MONTHLY"
      ? buildMonthlyDueDates({
          fromDate,
          installments: cleanInstallments,
          monthlyPaymentDay: Number(info.monthlyPaymentDay),
        })
      : buildSemimonthlyDueDates({
          fromDate,
          installments: cleanInstallments,
          paymentDays: info.paymentDays,
        });

  if (dueDates.length !== cleanInstallments) {
    throw {
      statusCode: 400,
      mensaje: "No se pudieron generar todas las fechas de pago del préstamo.",
      message: "Could not generate all loan payment dates.",
    };
  }

  return {
    ...info,
    generatedAt: new Date(),
    firstPaymentDate: dueDates[0],
    dueDates,
  };
};
