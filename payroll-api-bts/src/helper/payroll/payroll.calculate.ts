import moment from "moment";
import { dayKey, DAYS_KEYS, punchStep, RD_FACTOR_DIAS_MES, STEP_ORDER, UserSchedule } from "../../constants/payroll";
import { fmtHHmm } from "../hours";
import { toNum } from "../parse";
import { normalizeExpectedTimeLocal, parseExpectedMoment, parseExpectedMomentLocal, parseHHmmToMinutes } from "./payroll.parse";
import { pickEarliest, pickFirstAfter, pickLatest } from "./payroll.pick";
import { ScheduleDay } from "../../model/account/user";
import { getScheduleDayKeyFromYMD } from "./payroll.get";

interface CalcWorkOpts {
  dateString?: string; // "YYYY-MM-DD"
  expectedEntryTime?: string | null; // "HH:mm" o "HH:mm:ss"
  graceMinutes?: number; // ej: 10
}

const diffMinutes = (start: Date, end: Date, allowOvernight: boolean) => {
  let d = moment(end).diff(moment(start), "minutes"); // floor
  if (d < 0 && allowOvernight) {
    d = moment(end).add(1, "day").diff(moment(start), "minutes");
  }
  return d;
};


export const calcLateInfo = (args: {
  dateString: string;
  expectedTime: string | null;
  timestamp: Date;
  graceMinutes: number;
}) =>{
  const { dateString, expectedTime, timestamp, graceMinutes } = args;
  if (!expectedTime)
    return { isLate: false, lateSecondsTotal: 0, lateSecondsNet: 0 };

  const exp = parseExpectedMoment(dateString, expectedTime);
  const real = moment(timestamp);
  if (!exp.isValid() || !real.isValid()) {
    return { isLate: false, lateSecondsTotal: 0, lateSecondsNet: 0 };
  }

  const lateSecondsTotal = Math.max(0, real.diff(exp, "seconds"));

  // ✅ tarde SOLO si ya cayó en el minuto 11 (con gracia=10)
  const thresholdSeconds = (toNum(graceMinutes, 0) + 1) * 60;
  const isLate = lateSecondsTotal >= thresholdSeconds;

  // ✅ segundos netos (post-gracia)
  const lateSecondsNet = isLate
    ? Math.max(0, lateSecondsTotal - toNum(graceMinutes, 0) * 60)
    : 0;

  return { isLate, lateSecondsTotal, lateSecondsNet };
}

export const calcWorkedMinutesFromPunches = (
  punches: Array<{ punchStep: string; timestamp: Date }>,
  expectedSteps: punchStep[],
  dia: any, // hasLunchTime / lunchMinutes / allowOvernight / entryTime
  opts?: CalcWorkOpts,
) => {
  const allowOvernight = dia?.allowOvernight === true;
  const lunchMinutes = Math.max(0, toNum(dia?.lunchMinutes, 60));

  const dateString = String(opts?.dateString || "").slice(0, 10);
  const graceMinutes = toNum(opts?.graceMinutes, 0);

  // 1) Normalizar y ordenar punches
  const normalized = (Array.isArray(punches) ? punches : [])
    .filter((p) => p?.punchStep && p?.timestamp)
    .map((p) => ({
      punchStep: String(p.punchStep),
      timestamp: new Date(p.timestamp),
    }))
    .filter((p) => !Number.isNaN(p.timestamp.getTime()))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // 2) Agrupar timestamps por step
  const byStep = new Map<string, Date[]>();
  for (const p of normalized) {
    if (!byStep.has(p.punchStep)) byStep.set(p.punchStep, []);
    byStep.get(p.punchStep)!.push(p.timestamp);
  }

  // 3) Elegir “mejores” timestamps por step
  const map: Record<string, Date | null> = {
    entrada: null,
    salida_almuerzo: null,
    entrada_almuerzo: null,
    salida: null,
  };

  map.entrada = pickEarliest("entrada", byStep);
  map.salida = pickLatest("salida", byStep);

  map.salida_almuerzo = pickFirstAfter("salida_almuerzo", map.entrada, byStep);
  map.entrada_almuerzo = pickFirstAfter(
    "entrada_almuerzo",
    map.salida_almuerzo || map.entrada,
    byStep,
  );

  // 4) Calcular totalMinutes
  let total = 0;

  const hasEntryExit = !!map.entrada && !!map.salida;
  const hasLunchBoth = !!map.salida_almuerzo && !!map.entrada_almuerzo;

  const lunchOrderOk =
    hasLunchBoth &&
    map.entrada!?.getTime() <= map.salida_almuerzo!?.getTime() &&
    map.salida_almuerzo!?.getTime() <= map.entrada_almuerzo!?.getTime() &&
    map.entrada_almuerzo!?.getTime() <= map.salida!?.getTime();

  if (hasEntryExit && hasLunchBoth && lunchOrderOk) {
    const seg1 = diffMinutes(
      map.entrada!,
      map.salida_almuerzo!,
      allowOvernight,
    );
    const seg2 = diffMinutes(
      map.entrada_almuerzo!,
      map.salida!,
      allowOvernight,
    );
    if (seg1 > 0) total += seg1;
    if (seg2 > 0) total += seg2;
  } else if (hasEntryExit) {
    const seg = diffMinutes(map.entrada!, map.salida!, allowOvernight);
    if (seg > 0) total += seg;

    if (dia?.hasLunchTime === true && lunchMinutes > 0) {
      total = Math.max(0, total - lunchMinutes);
    }
  } else {
    total = 0;
  }

  // 5) punchSteps (lo que existe en DB)
  const punchSteps = Array.from(byStep.keys());
  punchSteps.sort((a, b) => (STEP_ORDER[a] || 999) - (STEP_ORDER[b] || 999));

  // 6) missingSteps basado en expectedSteps (usa lo “seleccionado”)
  const hasSelected = (s: string) => !!map[s];
  const missingSteps = (
    Array.isArray(expectedSteps) ? expectedSteps : []
  ).filter((s) => !hasSelected(s));

  const isIncomplete = missingSteps.length > 0;

  // ============================================================
  // 7) TARDANZA (alineada con calcAttendanceDeductionsForDay)
  //    - tardanza raw = floor(lateSecondsTotal / 60)
  //    - lateMinutesForPayroll = entryLateRaw > graceMinutes ? entryLateRaw : 0
  //    - isLate = (entryLateRaw > graceMinutes)
  // ============================================================
  let lateSecondsTotal = 0;
  let entryLateRawMinutes = 0;
  let lateMinutesForPayroll = 0;
  let isLate = false;

  const expectedEntryTime =
    normalizeExpectedTimeLocal(opts?.expectedEntryTime) ||
    normalizeExpectedTimeLocal(dia?.entryTime) ||
    null;

  if (dateString && map.entrada && expectedEntryTime) {
    const exp = parseExpectedMomentLocal(dateString, expectedEntryTime);
    const real = moment(map.entrada);

    if (exp.isValid() && real.isValid()) {
      lateSecondsTotal = Math.max(0, real.diff(exp, "seconds"));

      // ✅ EXACTO como tú lo haces (floor a minutos)
      entryLateRawMinutes = Math.max(0, Math.floor(lateSecondsTotal / 60));

      // ✅ Regla de gracia como umbral (tu misma regla)
      lateMinutesForPayroll =
        entryLateRawMinutes > graceMinutes ? entryLateRawMinutes : 0;

      // ✅ Bandera
      isLate = entryLateRawMinutes > graceMinutes;
    }
  }

  return {
    totalMinutes: Math.max(0, total),
    punchSteps,
    missingSteps,
    isIncomplete,

    // útiles para UI / debug
    realEntryTime: map.entrada ? fmtHHmm(map.entrada) : "",
    realExitTime: map.salida ? fmtHHmm(map.salida) : "",
    realEntryAt: map.entrada || null,
    realExitAt: map.salida || null,

    // tardanza alineada
    expectedEntryTime, // HH:mm (normalizada)
    lateSecondsTotal, // segundos totales (sin gracia)
    entryLateRawMinutes, // floor(lateSeconds/60)
    lateMinutesForPayroll, // entryLateRawMinutes > grace ? entryLateRawMinutes : 0
    isLate, // entryLateRawMinutes > grace
  };
};

/**
 * Calcula los minutos laborables de un día:
 * (exit - entry) - (lunchEnd - lunchStart)
 * - Solo si isActive === true
 * - Si lunchStart/lunchEnd no están completos, NO resta almuerzo
 */

export const calcWorkMinutesForDay = (day?: ScheduleDay): number =>  {
  if (!day?.isActive) return 0;

  const entry = parseHHmmToMinutes(day.entryTime);
  const exit = parseHHmmToMinutes(day.exitTime);

  if (entry === null || exit === null) return 0;

  let total = exit - entry;
  if (total < 0) total = 0;

  const lunchStart = parseHHmmToMinutes(day.lunchStartTime);
  const lunchEnd = parseHHmmToMinutes(day.lunchEndTime);

  if (lunchStart !== null && lunchEnd !== null) {
    let lunch = lunchEnd - lunchStart;
    if (lunch < 0) lunch = 0;

    // evita restar más de lo trabajado
    total = Math.max(0, total - Math.min(lunch, total));
  }

  return total;
}

export function calcExpectedMinutesForDate(
  schedule: UserSchedule | undefined,
  punchType: any,
  dateString: string
) {
  const key: dayKey = getScheduleDayKeyFromYMD(dateString);
  const day = schedule?.[key];

  if (!day?.isActive) {
    return {
      shouldWork: false,
      expectedMinutes: 0,
      expectedHours: 0,
      key,
      isActive: false,
    };
  }

  const entry = parseHHmmToMinutes(day.entryTime);
  const exit = parseHHmmToMinutes(day.exitTime);
  if (!entry || !exit) {
    return {
      shouldWork: true,
      expectedMinutes: 0,
      expectedHours: 0,
      key,
      isActive: false,
    };
  }

  let mins = exit - entry;
  if (mins < 0) mins = 0;

  const ls = parseHHmmToMinutes(day.lunchStartTime);
  const le = parseHHmmToMinutes(day.lunchEndTime);

  if (punchType.code == "4-punch") {
    if (!!ls && !!le) {
      let lunch = le - ls;
      if (lunch < 0) lunch = 0;
      mins = Math.max(0, mins - Math.min(lunch, mins));
    }
  } else {
    if (day.hasLunchTime) {
      mins = mins - 60;
    }
  }

  return {
    shouldWork: true,
    expectedMinutes: mins,
    expectedHours: mins / 60,
    key,
    isActive: true,
  };
}

/**
 * ✅ Total semanal del schedule (sin almuerzo)
 */
export function calcularTotalesSemanalesDesdeSchedule(schedule?: UserSchedule) {
  const minutesByDay: Record<string, number> = {};
  let totalWeeklyMinutes = 0;

  for (const k of DAYS_KEYS) {
    const mins = calcWorkMinutesForDay(schedule?.[k]);
    minutesByDay[k] = mins;
    totalWeeklyMinutes += mins;
  }

  const totalWeeklyHours = totalWeeklyMinutes / 60;

  return {
    totalWeeklyMinutes,
    totalWeeklyHours: Number(totalWeeklyHours.toFixed(2)),
    minutesByDay,
  };
}

export const calculatePeriodSalaryFromMonthly = ({
  monthlySalary,
  frequencyCode,
}: {
  monthlySalary: number;
  frequencyCode: string;
}) => {
  const cleanFrequency = String(frequencyCode || "")
    .trim()
    .toUpperCase();

  if (!cleanFrequency) return monthlySalary;

  if (["MONTHLY", "MENSUAL", "MONTH", "MES"].includes(cleanFrequency)) {
    return monthlySalary;
  }

  if (["SEMIMONTHLY", "QUINCENAL", "QUINCENA"].includes(cleanFrequency)) {
    return monthlySalary / 2;
  }

  if (
    ["BIWEEKLY", "CADA_2_SEMANAS", "EVERY_TWO_WEEKS"].includes(cleanFrequency)
  ) {
    return monthlySalary / 2.1667;
  }

  if (["WEEKLY", "SEMANAL", "WEEK"].includes(cleanFrequency)) {
    return monthlySalary / 4.333;
  }

  if (["DAILY", "DIARIO", "DAY"].includes(cleanFrequency)) {
    return monthlySalary / RD_FACTOR_DIAS_MES;
  }

  return monthlySalary;
};