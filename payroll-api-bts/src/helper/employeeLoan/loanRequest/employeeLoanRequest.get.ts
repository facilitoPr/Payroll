export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const getAvailableDaysForLoan = (balance: any) => {
  return Math.max(
    0,
    Number(balance?.availableForLoanDays ?? balance?.availableDays ?? 0),
  );
};

export const getPaymentsPerYearFromFrequency = (frequency: string) => {
  const code = String(frequency || "")
    .trim()
    .toUpperCase();

  if (["WEEKLY", "SEMANAL", "WEEK"].includes(code)) return 52;

  if (["BIWEEKLY", "CADA_2_SEMANAS", "EVERY_TWO_WEEKS"].includes(code)) {
    return 26;
  }

  if (["SEMIMONTHLY", "QUINCENAL", "QUINCENA"].includes(code)) {
    return 24;
  }

  if (["MONTHLY", "MENSUAL", "MONTH", "MES"].includes(code)) {
    return 12;
  }

  return 24;
};

export const getNextPaymentDate = ({
  firstPaymentDate,
  installmentNumber,
  paymentsPerYear,
}: {
  firstPaymentDate: Date;
  installmentNumber: number;
  paymentsPerYear: number;
}) => {
  if (paymentsPerYear === 52) {
    return addDays(firstPaymentDate, 7 * (installmentNumber - 1));
  }

  if (paymentsPerYear === 26) {
    return addDays(firstPaymentDate, 14 * (installmentNumber - 1));
  }

  if (paymentsPerYear === 24) {
    return addDays(firstPaymentDate, 15 * (installmentNumber - 1));
  }

  const date = new Date(firstPaymentDate);
  date.setMonth(date.getMonth() + installmentNumber - 1);
  return date;
};

export const getPeriodicRate = ({
  interestRate,
  interestRateType,
  paymentsPerYear,
}: {
  interestRate: number;
  interestRateType: string;
  paymentsPerYear: number;
}) => {
  const rate = Number(interestRate || 0) / 100;
  const type = String(interestRateType || "ANNUAL").toUpperCase();

  if (type === "ANNUAL") {
    return rate / paymentsPerYear;
  }

  if (type === "MONTHLY") {
    const paymentsPerMonth = paymentsPerYear / 12;
    return rate / paymentsPerMonth;
  }

  return 0;
};
