import { toNum } from "../helper/parse";
import { ScheduleDay } from "../model/account/user";

export const DEFAULT_CURRENCY = "DOP";
export const MONGO_ID_REGEX = /^[a-fA-F0-9]{24}$/;

export const RD_FACTOR_DIAS_MES = toNum(process.env.RD_FACTOR_DIAS_MES ?? 23.83); 
export const WEEKS_PER_MONTH = toNum(process.env.WEEKS_PER_MONTH ?? 4.33); // promedio (52/12)
export const LATE_GRACE_MINUTES = toNum(process.env.LATE_GRACE_MINUTES, 10);

export const STEP_ORDER: Record<string, number> = {
  entrada: 1,
  salida_almuerzo: 2,
  entrada_almuerzo: 3,
  salida: 4,
};

export const PUNCH_STEPS = [
  "entrada",
  "salida_almuerzo",
  "entrada_almuerzo",
  "salida",
] as const;

export const NON_LUNCH_PUNCH_STEPS = ["entrada", "salida"] as const;

export type punchStep = (typeof PUNCH_STEPS)[number];
export type nonLunchPunchStep = (typeof NON_LUNCH_PUNCH_STEPS)[number];

export type UserSchedule = {
  lunes?: ScheduleDay;
  martes?: ScheduleDay;
  miercoles?: ScheduleDay;
  jueves?: ScheduleDay;
  viernes?: ScheduleDay;
  sabado?: ScheduleDay;
  domingo?: ScheduleDay;
};

export const DAYS_KEYS: (keyof UserSchedule)[] = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

export type dayKey = (typeof DAYS_KEYS)[number];