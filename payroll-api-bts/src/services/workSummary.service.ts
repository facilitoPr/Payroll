import moment from "moment";
import PunchHistory, {
  PunchStep,
  IPunchHistory,
} from "../model/punch/puncHistory";
import WorkSummary from "../model/punch/workSummary";
import { ClientSession, Types } from "mongoose";
import PunchType from "../model/punch/punchTypes";
import User, { ScheduleDay } from "../model/account/user";
import Roles from "../model/role";
import { toNum } from "../utils/date.util";
import { STEP_ORDER } from "../constants/payroll";
import { fmtHHmm, getYMD } from "../helper/hours";
import { getExpectedStepsForDay, getScheduleDayKeyFromYMD } from "../helper/payroll/payroll.get";
import { calcExpectedMinutesForDate, calcLateInfo, calcWorkedMinutesFromPunches } from "../helper/payroll/payroll.calculate";
import { calcAttendanceDeductionsForDay } from "../helper/payroll/calculate-deductions";
import { getSalaryTypeCodeMap } from "./payroll/salaryType.service";
import { applyPayrollPolicyToDayCalc, DEFAULT_PAYROLL_POLICY_CONFIG, getPayrollPolicyConfig } from "../helper/payroll/payrollPolicy";
import { getMongoIdString } from "../helper/objectIds";

interface DaySchedule {
  isActive: boolean;
  entryTime: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
  exitTime: string;
  workHours?: number;
}

interface WeeklySchedule {
  lunes?: DaySchedule;
  martes?: DaySchedule;
  miercoles?: DaySchedule;
  jueves?: DaySchedule;
  viernes?: DaySchedule;
  sabado?: DaySchedule;
  domingo?: DaySchedule;
}

export const normalizeDiaSemanaFromDate = (dateString: string) =>  {
  const rawDia = moment(dateString, "YYYY-MM-DD").format("dddd").toLowerCase();
  const diaSemanaRaw = rawDia.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const dayMap: Record<string, string> = {
      monday: "lunes",
      tuesday: "martes",
      wednesday: "miercoles",
      thursday: "jueves",
      friday: "viernes",
      saturday: "sabado",
      sunday: "domingo",

      lunes: "lunes",
      martes: "martes",
      miercoles: "miercoles",
      jueves: "jueves",
      viernes: "viernes",
      sabado: "sabado",
      domingo: "domingo",
    };

  return dayMap[diaSemanaRaw] || diaSemanaRaw;
}

export const buildExpectedPunchesFromSchedule = (scheduleDia: any): PunchStep[] => {
  const steps: PunchStep[] = [];
  if (scheduleDia?.entryTime) steps.push("entrada");
  if (scheduleDia?.lunchStartTime) steps.push("salida_almuerzo");
  if (scheduleDia?.lunchEndTime) steps.push("entrada_almuerzo");
  if (scheduleDia?.exitTime) steps.push("salida");
  return steps;
}

export async function calcularResumenDiario(
  userId: Types.ObjectId,
  punches: any[], // IPunchHistory[]
  session?: ClientSession,
): Promise<any | null> {
  if (!Array.isArray(punches) || punches.length === 0) return null;

  // 1) Determinar dateString del día (lo más seguro es usar el campo date si existe)
  const dateString =
    String(punches[0]?.date || "").slice(0, 10) ||
    moment(punches[0]?.timestamp).format("YYYY-MM-DD");

  if (!moment(dateString, "YYYY-MM-DD", true).isValid()) return null;

  // 2) Cargar user con schedule + punchTypeId
  const user = await User.findById(userId)
    .select("_id punchTypeId schedule isDeleted isActived")
    .lean();

  if (
    !user ||
    !user.punchTypeId ||
    user.isDeleted ||
    user.isActived === false
  ) {
    return null;
  }

  // 3) Cargar punchType.expectedPunches
  const punchType = await PunchType.findById(user.punchTypeId)
    .select("_id expectedPunches")
    .lean();

  if (!punchType || !Array.isArray(punchType.expectedPunches)) return null;

  const expectedStepsBase = punchType.expectedPunches as PunchStep[];

  // 4) schedule del día
  const diaSemana = normalizeDiaSemanaFromDate(dateString);
  const scheduleDia = (user.schedule as any)?.[diaSemana] || null;

  // Si el día está inactivo, igual guardamos resumen pero expectedStepsToday vacío (o base)
  const scheduleActive = scheduleDia?.isActive !== false;

  // expectedStepsToday = lo que aplica HOY según schedule, filtrado por punchType
  const expectedTodayRaw = scheduleActive
    ? buildExpectedPunchesFromSchedule(scheduleDia)
    : [];

  const expectedStepsToday: PunchStep[] =
    expectedTodayRaw.length > 0
      ? expectedTodayRaw.filter((s) => expectedStepsBase.includes(s))
      : expectedStepsBase; // fallback por si no hay schedule bien seteado

  const hasLunchTime =
    scheduleDia?.hasLunchTime === true ||
    !!scheduleDia?.lunchStartTime ||
    !!scheduleDia?.lunchEndTime;

  const lunchMinutes = Math.max(0, toNum(scheduleDia?.lunchMinutes, 60));
  const allowOvernight = scheduleDia?.allowOvernight === true;

  // 5) Normalizar + ordenar punches por timestamp
  const normalized = punches
    .filter((p) => p?.punchStep && p?.timestamp)
    .map((p) => ({
      punchStep: String(p.punchStep) as PunchStep,
      timestamp: new Date(p.timestamp),
      lateTime: toNum(p?.lateTime, 0),
      isLate: !!p?.isLate,
    }))
    .filter((p) => !Number.isNaN(p.timestamp?.getTime()))
    .sort((a, b) => a.timestamp?.getTime() - b.timestamp?.getTime());

  // 6) Agrupar timestamps por step
  const byStep = new Map<PunchStep, Date[]>();
  for (const p of normalized) {
    if (!byStep.has(p.punchStep)) byStep.set(p.punchStep, []);
    byStep.get(p.punchStep)!.push(p.timestamp);
  }

  const pickEarliest = (step: PunchStep) => {
    const arr = byStep.get(step) || [];
    return arr.length ? arr[0] : null;
  };

  const pickLatest = (step: PunchStep) => {
    const arr = byStep.get(step) || [];
    return arr.length ? arr[arr.length - 1] : null;
  };

  const pickFirstAfter = (step: PunchStep, after: Date | null) => {
    const arr = byStep.get(step) || [];
    if (!arr.length) return null;
    if (!after) return arr[0];
    const t = after?.getTime();
    return arr.find((d) => d?.getTime() >= t) || null;
  };

  const diffMinutes = (start: Date, end: Date) => {
    let d = moment(end).diff(moment(start), "minutes"); // floor
    if (d < 0 && allowOvernight) {
      d = moment(end).add(1, "day").diff(moment(start), "minutes");
    }
    return d;
  };

  // 7) Seleccionar “mejores” punches del día
  const map: Record<PunchStep, Date | null> = {
    entrada: null,
    salida_almuerzo: null,
    entrada_almuerzo: null,
    salida: null,
  };

  map.entrada = pickEarliest("entrada");
  map.salida = pickLatest("salida");
  map.salida_almuerzo = pickFirstAfter("salida_almuerzo", map.entrada);
  map.entrada_almuerzo = pickFirstAfter(
    "entrada_almuerzo",
    map.salida_almuerzo || map.entrada,
  );

  // 8) Calcular totalMinutes con regla de almuerzo
  let totalMinutes = 0;

  const hasEntryExit = !!map.entrada && !!map.salida;
  const hasLunchBoth = !!map.salida_almuerzo && !!map.entrada_almuerzo;

  const lunchOrderOk =
    hasLunchBoth &&
    map.entrada!?.getTime() <= map.salida_almuerzo!?.getTime() &&
    map.salida_almuerzo!?.getTime() <= map.entrada_almuerzo!?.getTime() &&
    map.entrada_almuerzo!?.getTime() <= map.salida!?.getTime();

  if (hasEntryExit && hasLunchBoth && lunchOrderOk) {
    // Caso completo con almuerzo por punches
    const seg1 = diffMinutes(map.entrada!, map.salida_almuerzo!);
    const seg2 = diffMinutes(map.entrada_almuerzo!, map.salida!);
    if (seg1 > 0) totalMinutes += seg1;
    if (seg2 > 0) totalMinutes += seg2;
  } else if (hasEntryExit) {
    // Sin almuerzo completo: entrada -> salida
    const seg = diffMinutes(map.entrada!, map.salida!);
    if (seg > 0) totalMinutes += seg;

    // Regla negocio: si hoy tiene almuerzo pero no hay 4 punches válidos, restar lunchMinutes
    if (hasLunchTime && lunchMinutes > 0) {
      totalMinutes = Math.max(0, totalMinutes - lunchMinutes);
    }
  } else if (map.entrada && !map.salida) {
    // Solo entrada: hasta ahora si es hoy, si no hasta fin del día
    const start = moment(map.entrada);
    const today = moment().format("YYYY-MM-DD");
    const end =
      dateString === today
        ? moment()
        : moment(dateString, "YYYY-MM-DD").endOf("day");
    const seg = end.diff(start, "minutes");
    totalMinutes = Math.max(0, seg);
  } else {
    totalMinutes = 0;
  }

  // 9) punchSteps y missingSteps (según expectedStepsToday)
  const actualSteps = Array.from(byStep.keys());
  actualSteps.sort((a, b) => (STEP_ORDER[a] || 999) - (STEP_ORDER[b] || 999));

  const hasSelected = (s: PunchStep) => !!map[s];
  const missingSteps = expectedStepsToday.filter((s) => !hasSelected(s));
  const isIncomplete = missingSteps.length > 0;

  // 10) lateTime del WorkSummary: toma el del punch "entrada" si existe (ya calculado en tu flow)
  const entryPunch = normalized.find((p) => p.punchStep === "entrada") || null;
  const wsLateTime = entryPunch ? toNum(entryPunch.lateTime, 0) : 0;

  // 11) Guardar WorkSummary (IMPORTANT: NO uses utc() aquí)
  const dateAtMidnight = moment(dateString, "YYYY-MM-DD")
    .startOf("day")
    .toDate();

  const workSummary = await WorkSummary.findOneAndUpdate(
    { user: userId, dateString },
    {
      user: userId,
      date: dateAtMidnight,
      dateString,
      totalMinutes: Math.max(0, totalMinutes),

      isIncomplete,
      punchSteps: actualSteps,
      missingSteps,

      // útiles si tu schema los tiene:
      realEntryTime: map.entrada ? fmtHHmm(map.entrada) : "",
      realExitTime: map.salida ? fmtHHmm(map.salida) : "",
      lateTime: wsLateTime,
    },
    { upsert: true, new: true, session: session || undefined },
  );

  return workSummary;
}

export const cerrarPonchesIncompletosDelDia = async () => {
  // Obtener la fecha y hora actual
  const now = moment();
  const fecha = now.format("YYYY-MM-DD");
  const horaCierre = now.format("HH:mm");

  // Obtener el nombre del día de la semana en formato sin acentos y en minúscula (ej: "lunes")
    const diaSemana = moment(fecha)
      .format("dddd")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase() as keyof WeeklySchedule;

  // Buscar los roles que nos interesan para evaluar ponches
  const roles = await Roles.find({    
    code: { $in: ["EMPLOYEE"] },
  });

  const roleIds = roles.map((r) => r._id);

  // Buscar todos los usuarios activos que tengan uno de los roles seleccionados
  const users = await User.find({
    isDeleted: false,
    isActived: true,
    rol: { $in: roleIds },
  }).lean();

  // Iterar sobre cada usuario
  for (const user of users) {
    if (!user.punchTypeId) continue; // Saltar si el usuario no tiene tipo de ponche asignado

    const punchType = await PunchType.findById(user.punchTypeId).lean();

    // Obtener los pasos de ponche esperados para ese usuario según su tipo de ponche
    const expectedSteps: string[] = punchType?.expectedPunches || [];

    // Buscar todos los ponches del día para ese usuario, ordenados cronológicamente
    const punches = await PunchHistory.find({
      user: user._id,
      date: fecha,
    }).sort({ timestamp: 1 });

    if (punches.length > 0) {
      // Obtener los pasos de ponche que el usuario sí realizó
      const stepsHechos = punches.map((p) => p.punchStep.toString());

      // Determinar qué pasos faltan comparando contra los esperados
      const missingSteps: string[] = expectedSteps.filter(
        (s: string) => !stepsHechos.includes(s),
      );

      // --- CASO 1: Tipo de ponche es "solo entrada" (entry-only) ---
      if (expectedSteps.length === 1 && expectedSteps[0] === "entrada") {
        const entrada = punches.find(
          (p) => p.punchStep.toString() === "entrada",
        );

        if (!entrada) continue;

        // Calcular los minutos desde la entrada hasta la hora actual (cierre automático)
        const entradaMoment = moment.utc(entrada.timestamp);
        const nowMoment = moment.utc();
        const minutos = nowMoment.diff(entradaMoment, "minutes");

        // Actualizar o crear un resumen de trabajo para ese día, marcando como cerrado automáticamente
        await WorkSummary.findOneAndUpdate(
          { user: user._id, dateString: fecha, wasAutoClosed: false },
          {
            $set: {
              user: user._id,
              date: fecha,
              totalMinutes: minutos,
              isIncomplete: false,
              punchSteps: ["entrada"],
              wasAutoClosed: true,
              autoClosedReason: "entry-only hasta cierre automático",
              realEntryTime: entradaMoment.format("HH:mm"),
              realExitTime: horaCierre,
            },
          },
          { new: true },
        );

        console.log(
          `✅ [${user._id}] Entrada única cerrada automáticamente con ${minutos} min.`,
        );

        continue; // Ir al siguiente usuario
      }

      // --- CASO 2: Faltan pasos esperados (entrada/salida/almuerzo...) ---
      if (missingSteps.length > 0) {
        const entrada = punches.find((p) => p.punchStep === "entrada");

        if (!entrada) continue;

        const dia = user.schedule?.[diaSemana]; // Obtener horario del usuario para ese día

        if (!dia || !dia.exitTime) continue; // Si no tiene hora de salida definida, omitir

        // Calcular minutos trabajados entre la entrada y la hora de salida programada
        const salidaProgramada = moment(`${fecha} ${dia.exitTime}`);
        const entradaMoment = moment(entrada.timestamp);

        if (entradaMoment.isAfter(salidaProgramada)) {
          console.log(
            `⛔ [${user._id}] Entrada posterior a salida programada. Saltando.`,
          );
          continue;
        }
        const minutos = salidaProgramada.diff(entradaMoment, "minutes");

        // Guardar resumen del día como jornada incompleta cerrada automáticamente
        await WorkSummary.findOneAndUpdate(
          { user: user._id, dateString: fecha, wasAutoClosed: false },
          {
            user: user._id,
            date: fecha,
            totalMinutes: minutos,
            isIncomplete: true,
            punchSteps: stepsHechos,
            missingSteps,
            wasAutoClosed: true,
            autoClosedReason: "faltaron pasos esperados",
            scheduledExitTime: dia.exitTime,
            realEntryTime: moment(entrada.timestamp).format("HH:mm"),
            realExitTime: dia.exitTime,
          },
          { new: true },
        );

        console.log(
          `⚠️  [${
            user._id
          }] Jornada incompleta cerrada automáticamente con ${minutos} min. Faltaron: ${missingSteps.join(
            ", ",
          )}`,
        );
      }
    }
  }
};

export const calcularPagoPorPeriodo = (
  frecuencia: string,
  sueldoBruto: number,
): number => {
  switch (frecuencia.toLowerCase()) {
    case "mensual":
      return sueldoBruto;
    case "quincenal":
      return sueldoBruto / 2;
    case "semanal":
      return sueldoBruto / 4;
    default:
      return sueldoBruto;
  }
};

export const calcularISR = (baseImponibleMensual: number): number => {
  const sueldoAnual = baseImponibleMensual * 12;
  let isrAnual = 0;

  if (sueldoAnual <= 416220.0) {
    isrAnual = 0;
  } else if (sueldoAnual <= 624329.0) {
    isrAnual = (sueldoAnual - 416220.01) * 0.15;
  } else if (sueldoAnual <= 867123.0) {
    isrAnual = (sueldoAnual - 624329.01) * 0.2 + 31216.0;
  } else {
    isrAnual = (sueldoAnual - 867123.01) * 0.25 + 79776.0;
  }

  return Number((isrAnual / 12).toFixed(2));
};

export const calcularHorasSemanales = (schedule: WeeklySchedule): number => {
  const dias = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
    "domingo",
  ];

  // console.log(schedule)

  let totalMinutos = 0;

  for (const dia of dias) {
    const diaHorario = schedule[dia as keyof WeeklySchedule];
    if (diaHorario?.entryTime && diaHorario?.exitTime) {
      const [h1, m1] = diaHorario.entryTime.split(":").map(Number);
      const [h2, m2] = diaHorario.exitTime.split(":").map(Number);

      let minutos = h2 * 60 + m2 - (h1 * 60 + m1);

      // Descontar 1 hora de almuerzo
      minutos -= 60;

      if (minutos > 0) {
        totalMinutos += minutos;
      }
    }
  }

  return Number((totalMinutos / 60).toFixed(2)); // retorna horas con 2 decimales
};

function parseTimeToMinutes(t?: string) {
  if (!t || typeof t !== "string") return null;
  const parts = t.split(":").map((x) => Number(x));
  if (parts.length < 2) return null;
  const [hh, mm] = parts;
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

// calcula minutos de almuerzo según reglas
function calcLunchMinutes(
  entryMin: number,
  exitMin: number,
  day: ScheduleDay,
  punchTypeCode: string,
) {
  // 4-punch: almuerzo “existe” (siempre, en tu UI)
  // 2-punch: almuerzo solo si hasLunchTime === true
  const allowLunch =
    punchTypeCode === "4-punch" ||
    (punchTypeCode === "2-punch" && day.hasLunchTime === true);

  if (!allowLunch) return 0;

  const ls = parseTimeToMinutes(day.lunchStartTime);
  const le = parseTimeToMinutes(day.lunchEndTime);

  // Si me mandan horas explícitas, descuento exactamente eso (validando rangos)
  if (ls !== null && le !== null && le > ls) {
    // clamp dentro del rango de trabajo del día
    const start = Math.max(ls, entryMin);
    const end = Math.min(le, exitMin);
    const diff = end - start;
    return diff > 0 ? diff : 0;
  }

  // Fallback: tu regla vieja (12-13) PERO aplicando allowLunch
  // "Descontar 1 hora solo si entra antes de las 12 y sale después de la 1"
  if (entryMin < 12 * 60 && exitMin > 13 * 60) return 60;

  return 0;
}

export const procesarHorarioConHoras = (
  horario: Record<string, ScheduleDay>,
  punchTypeCode: string,
) => {
  let totalMinutes = 0;

  const resultado: Record<
    string,
    ScheduleDay & { workMinutes: number; workHours: number }
  > = {};

  Object.entries(horario).forEach(([dia, data]) => {
    // normalizamos por si viene undefined
    const day: ScheduleDay = {
      isActive: !!data?.isActive,
      hasLunchTime: !!data?.hasLunchTime,
      entryTime: data?.entryTime || "",
      lunchStartTime: data?.lunchStartTime || "",
      lunchEndTime: data?.lunchEndTime || "",
      exitTime: data?.exitTime || "",
    };

    // Solo calculamos si tiene entrada y salida
    const entryMin = parseTimeToMinutes(day.entryTime);
    const exitMin = parseTimeToMinutes(day.exitTime);

    if (day.isActive && entryMin !== null && exitMin !== null) {
      let minutosDia = exitMin - entryMin;

      // si la salida es menor (horario inválido), lo dejamos en 0
      if (minutosDia < 0) minutosDia = 0;

      // descuento de almuerzo según tipo de ponche
      const lunchMinutes = calcLunchMinutes(
        entryMin,
        exitMin,
        day,
        punchTypeCode,
      );
      minutosDia = Math.max(0, minutosDia - lunchMinutes);

      totalMinutes += minutosDia;

      resultado[dia] = {
        ...day,
        workMinutes: minutosDia,
        workHours: parseFloat((minutosDia / 60).toFixed(2)),
      };
    } else {
      // si no está activo o no tiene horas completas, no trabaja
      // y limpiamos lunch si no aplica por tipo de ponche
      if (punchTypeCode !== "2-punch") {
        day.hasLunchTime = false;
      }
      resultado[dia] = {
        ...day,
        workMinutes: 0,
        workHours: 0,
      };
    }
  });

  const totalHours = parseFloat((totalMinutes / 60).toFixed(2));

  return {
    horarioConHoras: resultado,
    totalMinutes,
    totalHours,
  };
};


/**
 * Recalcula TODO lo necesario del WorkSummary para ese día:
 * - totalMinutes/punchSteps/missingSteps/isIncomplete/realEntryTime/realExitTime
 * - expectedMinutes (por schedule)
 * - lateTime (segundos) basado en punch entrada
 * - notWorkedMinutes usando la MISMA lógica base (calcAttendanceDeductionsForDay)
 */
export const recalcWorkSummaryDay = async (args: {
  workSummaryId: any;
  session: any;
}) => {
  const { workSummaryId, session } = args;

  const ws: any = await WorkSummary.findById(workSummaryId).session(session);
  if (!ws) return null;

  const dateString =
    String(ws.dateString || "").slice(0, 10) || getYMD(ws.date);

  if (!dateString) return ws;

  if (!ws.date && dateString) {
    ws.date = moment(dateString, "YYYY-MM-DD", true).toDate();
  }

  const user: any = await User.findById(ws.user)
    .select(
      "_id schedule punchTypeId salaryType hourlyRate isActived isDeleted company",
    )
    .populate({ path: "punchTypeId" })
    .session(session)
    .lean();

  if (!user || user.isDeleted || user.isActived === false) {
    ws.expectedMinutes = 0;
    ws.notWorkedMinutes = 0;
    ws.lateTime = 0;
    await ws.save({ session });
    return ws;
  }

  const payrollPolicyResp = await getPayrollPolicyConfig({
    companyId: getMongoIdString(user.company),
    session,
  });

  const payrollPolicyConfig = {
    ...DEFAULT_PAYROLL_POLICY_CONFIG,
    ...(payrollPolicyResp?.config || {}),
  };

  const graceMinutes =
    payrollPolicyConfig.lateGraceEnabled === true
      ? Math.max(toNum(payrollPolicyConfig.lateGraceMinutes, 0), 0)
      : 0;

  const punches: any[] = await PunchHistory.find({
    workSummary: ws._id,
    isDeleted: false,
  })
    .select("_id punchStep timestamp expectedTime isLate lateTime")
    .session(session)
    .lean();

  const dayKey = getScheduleDayKeyFromYMD(dateString);
  const dia: ScheduleDay | null = user?.schedule?.[dayKey] || null;
  const expectedSteps = getExpectedStepsForDay(dia);

  const calc = calcWorkedMinutesFromPunches(
    punches.map((p: any) => ({
      punchStep: p.punchStep,
      timestamp: p.timestamp,
    })),
    expectedSteps,
    dia,
  );

  ws.totalMinutes = toNum(calc.totalMinutes, 0);
  ws.punchSteps = calc.punchSteps;
  ws.missingSteps = calc.missingSteps;
  ws.isIncomplete = !!calc.isIncomplete;
  ws.realEntryTime = calc.realEntryTime || null;
  ws.realExitTime = calc.realExitTime || null;

  const expObj = calcExpectedMinutesForDate(
    user?.schedule,
    user?.punchTypeId,
    dateString,
  );

  const expectedMinutes = toNum(expObj?.expectedMinutes, 0);
  const isActive = !!expObj?.isActive;

  ws.expectedMinutes = isActive ? expectedMinutes : 0;

  const entryPunch = punches
    .filter((p: any) => p.punchStep === "entrada" && p.timestamp)
    .sort(
      (a: any, b: any) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )[0];

  if (entryPunch && entryPunch.expectedTime && entryPunch.timestamp) {
    const late = calcLateInfo({
      dateString,
      expectedTime: String(entryPunch.expectedTime),
      timestamp: new Date(entryPunch.timestamp),
      graceMinutes,
    });

    const nextLateTime = toNum(late.lateSecondsTotal, 0);
    const nextIsLate = !!late.isLate;

    if (
      toNum(entryPunch.lateTime, -1) !== nextLateTime ||
      !!entryPunch.isLate !== nextIsLate
    ) {
      await PunchHistory.updateOne(
        { _id: entryPunch._id },
        {
          $set: {
            lateTime: nextLateTime,
            isLate: nextIsLate,
          },
        },
        { session },
      );

      entryPunch.lateTime = nextLateTime;
      entryPunch.isLate = nextIsLate;
    }
  } else if (entryPunch) {
    if (toNum(entryPunch.lateTime, 0) !== 0 || entryPunch.isLate !== false) {
      await PunchHistory.updateOne(
        { _id: entryPunch._id },
        {
          $set: {
            lateTime: 0,
            isLate: false,
          },
        },
        { session },
      );

      entryPunch.lateTime = 0;
      entryPunch.isLate = false;
    }
  }

  ws.lateTime = entryPunch ? toNum(entryPunch.lateTime, 0) : 0;

  const salaryTypeCodeById = await getSalaryTypeCodeMap([user]);
  const salaryTypeId = user.salaryType ? String(user.salaryType) : "";
  const salaryCode = salaryTypeCodeById.get(salaryTypeId) || "FIJO";

  const rawDayCalc: any = calcAttendanceDeductionsForDay({
    ws,
    employee: user,
    entryPunch: entryPunch
      ? {
          expectedTime: entryPunch.expectedTime,
          timestamp: entryPunch.timestamp,
          lateTime: entryPunch.lateTime,
        }
      : null,
    expectedFromSchedule: {
      expectedMinutes,
      isActive,
    },
    salaryCode,
    graceMinutes,
    baseDailyForDiscountFixed: 0,
    hourlyRate: toNum(user.hourlyRate, 0),
    calcExpectedMinutesForDate,
  });

  const dayCalc = rawDayCalc?.skip
    ? rawDayCalc
    : applyPayrollPolicyToDayCalc({
        dayCalc: rawDayCalc,
        ws,
        salaryCode,
        baseDailyForDiscountFixed: 0,
        payrollPolicyConfig,
      });

  ws.notWorkedMinutes = dayCalc?.skip ? 0 : toNum(dayCalc.notWorkedMinutes, 0);

  await ws.save({ session });
  return ws;
};
