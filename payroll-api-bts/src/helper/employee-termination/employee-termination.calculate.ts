import {
  IPreNoticeBracket,
  ISeveranceBracket,
} from "../../model/employee-termination/laborTerminationPolicyRD";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const getDaysBetween = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY),
  );
};

export const buildSenioritySnapshot = (
  hiringDate: Date,
  terminationDate: Date,
) => {
  const start = new Date(hiringDate);
  const end = new Date(terminationDate);

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;

    const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += previousMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  years = Math.max(0, years);
  months = Math.max(0, months);
  days = Math.max(0, days);

  const totalDays = getDaysBetween(start, end);
  const totalMonths = Math.round((totalDays / 30.4375) * 100) / 100;

  const textParts: string[] = [];

  if (years > 0) textParts.push(`${years} año${years === 1 ? "" : "s"}`);
  if (months > 0) textParts.push(`${months} mes${months === 1 ? "" : "es"}`);
  if (days > 0) textParts.push(`${days} día${days === 1 ? "" : "s"}`);

  return {
    years,
    months,
    days,
    totalMonths,
    totalDays,
    text: textParts.length ? textParts.join(", ") : "0 días",
  };
};

export const findPreNoticeBracket = (
  brackets: IPreNoticeBracket[],
  totalMonths: number,
) => {
  return [...brackets]
    .sort((a, b) => a.fromMonths - b.fromMonths)
    .find((bracket) => {
      const fromOk = totalMonths >= Number(bracket.fromMonths || 0);
      const toOk =
        bracket.toMonths === null ||
        bracket.toMonths === undefined ||
        totalMonths <= Number(bracket.toMonths);

      return fromOk && toOk;
    });
};

export const findSeveranceBracket = (
  brackets: ISeveranceBracket[],
  totalMonths: number,
) => {
  return [...brackets]
    .sort((a, b) => a.fromMonths - b.fromMonths)
    .find((bracket) => {
      const fromOk = totalMonths >= Number(bracket.fromMonths || 0);
      const toOk =
        bracket.toMonths === null ||
        bracket.toMonths === undefined ||
        totalMonths <= Number(bracket.toMonths);

      return fromOk && toOk;
    });
};

export const calculatePreNoticeDays = (
  brackets: IPreNoticeBracket[],
  totalMonths: number,
) => {
  const bracket = findPreNoticeBracket(brackets, totalMonths);
  if (!bracket) return 0;

  return Number(bracket.days || 0);
};

export const calculateSeveranceDays = (payload: {
  brackets: ISeveranceBracket[];
  totalMonths: number;
  totalDays: number;
}) => {
  const bracket = findSeveranceBracket(payload.brackets, payload.totalMonths);

  if (!bracket) return 0;

  if (bracket.mode === "FIXED") {
    return Number(bracket.days || 0);
  }

  const yearsWorked = Number(payload.totalDays || 0) / 365;
  return Number(bracket.days || 0) * yearsWorked;
};

export const calculateWeightedAverageMonthlySalary = (payload: {
  histories: any[];
  periodStart: Date;
  periodEnd: Date;
  fallbackSalary: number;
}) => {
  const periodStart = new Date(payload.periodStart);
  const periodEnd = new Date(payload.periodEnd);

  let weightedAmount = 0;
  let weightedDays = 0;

  for (const history of payload.histories || []) {
    const historyStart = new Date(history.effectiveFrom);
    const historyEnd = history.effectiveTo
      ? new Date(history.effectiveTo)
      : periodEnd;

    const overlapStart =
      historyStart.getTime() > periodStart.getTime()
        ? historyStart
        : periodStart;

    const overlapEnd =
      historyEnd.getTime() < periodEnd.getTime() ? historyEnd : periodEnd;

    if (overlapEnd.getTime() < overlapStart.getTime()) continue;

    const days = getDaysBetween(overlapStart, overlapEnd) + 1;
    const salaryAmount = Number(
      history.salaryAmount || history.baseSalary || 0,
    );

    weightedAmount += salaryAmount * days;
    weightedDays += days;
  }

  if (!weightedDays) return Number(payload.fallbackSalary || 0);

  return weightedAmount / weightedDays;
};

export const getStartOfYear = (date: Date) => {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
};

export const getLast12MonthsStart = (date: Date) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() - 12);
  return result;
};

export const calculateEstimatedOrdinarySalaryEarnedYTD = (payload: {
  hiringDate: Date;
  terminationDate: Date;
  monthlySalary: number;
}) => {
  const yearStart = getStartOfYear(payload.terminationDate);

  const start =
    payload.hiringDate.getTime() > yearStart.getTime()
      ? payload.hiringDate
      : yearStart;

  const daysWorked = getDaysBetween(start, payload.terminationDate) + 1;

  const dailyEstimatedSalary = Number(payload.monthlySalary || 0) / 30;

  return dailyEstimatedSalary * daysWorked;
};

export const isBeforeProbationEnd = (payload: {
  hiringDate: Date;
  terminationDate: Date;
  probationMonths: number;
}) => {
  const probationEnd = new Date(payload.hiringDate);
  probationEnd.setMonth(
    probationEnd.getMonth() + Number(payload.probationMonths || 0),
  );

  return payload.terminationDate.getTime() < probationEnd.getTime();
};