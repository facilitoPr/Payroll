import moment from "moment";
import {
  dayKey,
  DAYS_KEYS,
  NON_LUNCH_PUNCH_STEPS,
  nonLunchPunchStep,
  PUNCH_STEPS,
  punchStep,
  WEEKS_PER_MONTH,
} from "../../constants/payroll";
import { ScheduleDay } from "../../model/account/user";
import { round2 } from "../parse";

export const getExpectedStepsForDay = (
  dia: ScheduleDay | null,
): punchStep[] | nonLunchPunchStep[] => {
  // si el horario incluye almuerzo, esperamos 4 pasos
  const hasLunch = !!(dia?.lunchStartTime && dia?.lunchEndTime);
  return hasLunch ? [...PUNCH_STEPS] : [...NON_LUNCH_PUNCH_STEPS];
};

export const getScheduleDayKeyFromYMD = (dateString: string): dayKey => {
  const iso = moment(dateString, "YYYY-MM-DD", true).isoWeekday(); // 1..7 (Mon..Sun)
  return DAYS_KEYS[Math.max(0, Math.min(6, (iso || 1) - 1))];
};

export const getPeriodDivisor = (paymentFrequencyCode: string) => {
  const code = String(paymentFrequencyCode || "").toUpperCase();
  if (code === "MENSUAL") return 1;
  if (code === "QUINCENAL") return 2;
  if (code === "SEMANAL") return WEEKS_PER_MONTH;
  // fallback: mensual
  return 1;
}

export const calcGrossPayHourlyDay = (params: {
  workedMinutes: number;
  hourlyRate: number;
}) => {
  const workedHours = params.workedMinutes > 0 ? params.workedMinutes / 60 : 0;
  const amount = workedHours * params.hourlyRate;
  return round2(amount);
}

export const getPaymentFrequencyCode = (employee: any) => {
  return String(
    employee?.paymentSchedule?.paymentFrequency?.code ||
      employee?.paymentSchedule?.paymentFrequency?.name ||
      employee?.paymentFrequency?.code ||
      employee?.paymentFrequency?.name ||
      "",
  )
    .trim()
    .toUpperCase();
};