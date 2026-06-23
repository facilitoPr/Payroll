import { IEmployeeLoanProductConfig } from "../../../model/employeeLoan/employeeLoanProductConfig";
import { round2 } from "../../parse";

export const recalculateVacationBalance = (balance: any) => {
  const enjoyableBase =
    Number(balance.enjoyableDays || 0) +
    Number(balance.carryOverDays || 0) +
    Number(balance.adjustmentDays || 0);

  const paymentBase =
    Number(balance.accruedPaymentDays || 0) +
    Number(balance.carryOverDays || 0) +
    Number(balance.adjustmentDays || 0);

  const usedDays = Number(balance.usedDays || 0);
  const reservedDays = Number(balance.reservedDays || 0);

  balance.availableDays = Math.max(0, enjoyableBase - usedDays);
  balance.availableForLoanDays = Math.max(
    0,
    paymentBase - usedDays - reservedDays,
  );
  balance.payableVacationDays = Math.max(0, paymentBase - usedDays);
  balance.netPayableVacationDays = Math.max(
    0,
    paymentBase - usedDays - reservedDays,
  );

  return balance;
};

export const calculateVacationGuaranteeAmount = ({
  guaranteedDays,
  dailySalary,
  productConfig,
}: {
  guaranteedDays: number;
  dailySalary: number;
  productConfig: any;
}) => {
  const mode = String(productConfig?.vacationDayValueMode || "DAILY_SALARY")
    .trim()
    .toUpperCase();

  if (mode === "NONE") return 0;

  if (mode === "CUSTOM_AMOUNT") {
    return round2(
      guaranteedDays * Number(productConfig?.customVacationDayAmount || 0),
    );
  }

  return round2(guaranteedDays * dailySalary);
};

export const calculateMaxGuaranteeDays = ({
  availableDays,
  productConfig,
}: {
  availableDays: number;
  productConfig: IEmployeeLoanProductConfig;
}) => {
  const percent = Number(productConfig?.maxVacationDaysGuaranteePercent || 0);

  let maxByPercent = Math.floor((Number(availableDays || 0) * percent) / 100);

  if (productConfig?.allowUseAllVacationDays !== true) {
    maxByPercent = Math.min(
      maxByPercent,
      Math.max(Number(availableDays || 0) - 1, 0),
    );
  }

  return Math.max(maxByPercent, 0);
};

export const calculateRequiredGuaranteeDaysByAmount = ({
  requestedAmount,
  dailySalary,
  productConfig,
}: {
  requestedAmount: number;
  dailySalary: number;
  productConfig: any;
}) => {
  const amount = Number(requestedAmount || 0);

  if (amount <= 0) return 0;

  const mode = String(productConfig?.vacationDayValueMode || "DAILY_SALARY")
    .trim()
    .toUpperCase();

  if (mode === "NONE") return 0;

  if (mode === "CUSTOM_AMOUNT") {
    const customDayAmount = Number(productConfig?.customVacationDayAmount || 0);

    if (customDayAmount <= 0) return 0;

    return Math.ceil(amount / customDayAmount);
  }

  const cleanDailySalary = Number(dailySalary || 0);

  if (cleanDailySalary <= 0) return 0;

  return Math.ceil(amount / cleanDailySalary);
};
