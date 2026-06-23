import { formatYMD, isHHmm, listDatesInclusive, minutesOfDay } from "../date";
import { dayTypeOptions } from "../../model/punch/workSummary";
import { WeekScheduleMap } from "./permissions.get";
import moment from "moment";
import mongoose from "mongoose";
import { findApplicableLeavePolicy, getEmployeeCompanyId } from "../../services/vacation/employeeVacationBalance.service";

export const isVacationRequest = (permissionType: any, category: any) => {
  const code = String(permissionType?.code || "")
    .trim()
    .toUpperCase();
  const cat = String(category || "")
    .trim()
    .toUpperCase();

  return code === "VACACIONES" || cat === "VACACIONES";
};

export const isFullDayPermissionRequest = (request: any) => {
  const category = String(request?.category || "")
    .trim()
    .toUpperCase();

  if (category === "VACACIONES") return true;

  if (Number(request?.totalDays || 0) >= 1) return true;

  /**
   * Si por alguna razón un permiso viejo no tiene horas,
   * lo tratamos como día completo para evitar duplicados peligrosos.
   */
  if (!request?.startTime || !request?.endTime) return true;

  return false;
};

export const rangesOverlap = ({
  startA,
  endA,
  startB,
  endB,
}: {
  startA: number;
  endA: number;
  startB: number;
  endB: number;
}) => {
  /**
   * Se permite que uno termine exactamente cuando el otro empieza.
   * Ej:
   * 08:00 - 12:00
   * 12:00 - 13:00
   */
  return startA < endB && startB < endA;
};

export const validateDaysRequestAgainstSchedule = ({
  startDate,
  endDate,
  totalDays,
  scheduleMap,
}: {
  startDate: moment.Moment;
  endDate: moment.Moment;
  totalDays: number;
  scheduleMap: WeekScheduleMap;
}) => {
  if (!startDate?.isValid?.() || !endDate?.isValid?.()) {
    return {
      ok: false as const,
      mensaje: "Fechas inválidas. Verifica startDate y endDate.",
    };
  }

  if (endDate.isBefore(startDate, "day")) {
    return {
      ok: false as const,
      mensaje: `La fecha final (${formatYMD(
        endDate,
      )}) no puede ser menor que la fecha inicial (${formatYMD(startDate)}).`,
    };
  }

  const totalDaysNum = Number(totalDays || 0);

  if (!Number.isFinite(totalDaysNum) || totalDaysNum < 1) {
    return {
      ok: false as const,
      mensaje: "totalDays debe ser un número mayor o igual a 1.",
    };
  }

  const startDow = startDate.day();
  const endDow = endDate.day();

  if (!scheduleMap?.[startDow]?.isWorkday) {
    return {
      ok: false as const,
      mensaje: `La fecha inicial (${formatYMD(
        startDate,
      )}) cae fuera de tu horario laboral. Selecciona un día laborable como inicio.`,
    };
  }

  if (!scheduleMap?.[endDow]?.isWorkday) {
    return {
      ok: false as const,
      mensaje: `La fecha final (${formatYMD(
        endDate,
      )}) cae fuera de tu horario laboral. Selecciona un día laborable como fin.`,
    };
  }

  const days = listDatesInclusive(startDate, endDate);

  const requestedDates: string[] = [];

  for (const day of days) {
    const dow = day.day();
    const meta = scheduleMap[dow];

    if (meta?.isWorkday) {
      requestedDates.push(formatYMD(day));
    }
  }

  if (requestedDates.length !== totalDaysNum) {
    return {
      ok: false as const,
      mensaje: `Según tu horario, el rango (${formatYMD(
        startDate,
      )} → ${formatYMD(endDate)}) contiene ${
        requestedDates.length
      } día(s) laborable(s): ${requestedDates.join(
        ", ",
      )}. Pero enviaste totalDays=${totalDaysNum}. Ajusta el rango o la cantidad.`,
    };
  }

  return {
    ok: true as const,
    requestedDates,
  };
};

export const validateHoursRequestAgainstSchedule = ({
  date,
  startTime,
  endTime,
  scheduleMap,
}: {
  date: moment.Moment;
  startTime: string;
  endTime: string;
  scheduleMap: WeekScheduleMap;
}) => {
  const dow = date.day();
  const meta = scheduleMap[dow];

  if (!meta?.isWorkday) {
    return {
      ok: false as const,
      mensaje: `La fecha ${formatYMD(
        date,
      )} no es un día laborable según tu horario.`,
    };
  }

  if (!isHHmm(startTime) || !isHHmm(endTime)) {
    return {
      ok: false as const,
      mensaje: "startTime y endTime deben tener formato HH:mm.",
    };
  }

  const startMinutes = minutesOfDay(startTime);
  const endMinutes = minutesOfDay(endTime);

  if (endMinutes <= startMinutes) {
    return {
      ok: false as const,
      mensaje: "endTime debe ser mayor que startTime.",
    };
  }

  if (
    meta.entryTime &&
    meta.exitTime &&
    isHHmm(meta.entryTime) &&
    isHHmm(meta.exitTime)
  ) {
    const scheduleStart = minutesOfDay(meta.entryTime);
    const scheduleEnd = minutesOfDay(meta.exitTime);

    if (startMinutes < scheduleStart || endMinutes > scheduleEnd) {
      return {
        ok: false as const,
        mensaje: `El rango (${startTime}-${endTime}) está fuera de tu horario (${meta.entryTime}-${meta.exitTime}) para ese día.`,
      };
    }
  } else {
    return {
      ok: false as const,
      mensaje:
        "No hay entryTime/exitTime configurados en tu horario para validar ese día.",
    };
  }

  return {
    ok: true as const,
    diffMinutes: endMinutes - startMinutes,
  };
};

export const resolveWorkSummaryClassification = (permission: any) => {
  const name = String(permission?.permissionType?.name || "").trim();
  const code = String(permission?.permissionType?.code || "")
    .trim()
    .toUpperCase();
  const category = String(permission?.category || "")
    .trim()
    .toUpperCase();

  if (name && dayTypeOptions.includes(name as any)) return name;
  if (code === "VACACIONES" || category === "VACACIONES") return "Vacaciones";

  return "Otros tipos de permisos";
};

export const validateLeaveRequestAdvanceDays = async ({
  employee,
  category,
  startDate,
  session,
}: {
  employee: any;
  category: string;
  startDate: string;
  session?: mongoose.ClientSession;
}) => {
  const cleanCategory = String(category || "")
    .trim()
    .toUpperCase();

  const companyId = getEmployeeCompanyId(employee);

  const policy = await findApplicableLeavePolicy(companyId, session);

  if (!policy) {
    /**
     * Si no hay política, no bloqueamos.
     * También podrías bloquear si quieres obligar a configurar política.
     */
    return {
      ok: true,
      skipped: true,
      reason: "No hay política configurada.",
    };
  }

  const requiredAdvanceDays =
    cleanCategory === "VACACIONES"
      ? Number(policy.vacationAdvanceDays || 0)
      : Number(policy.permissionAdvanceDays || 0);

  if (requiredAdvanceDays <= 0) {
    return {
      ok: true,
      skipped: false,
      requiredAdvanceDays,
    };
  }

  const today = moment().startOf("day");
  const requestStartDate = moment(startDate, "YYYY-MM-DD", true).startOf("day");

  if (!requestStartDate.isValid()) {
    throw {
      statusCode: 400,
      mensaje: "La fecha inicial no es válida.",
      message: "Invalid start date.",
    };
  }

  const minimumAllowedDate = today.clone().add(requiredAdvanceDays, "days");

  if (requestStartDate.isBefore(minimumAllowedDate, "day")) {
    const label = cleanCategory === "VACACIONES" ? "vacaciones" : "permisos";

    throw {
      statusCode: 400,
      mensaje: `Debes solicitar ${label} con al menos ${requiredAdvanceDays} día(s) de antelación. La fecha mínima permitida es ${minimumAllowedDate.format(
        "YYYY-MM-DD",
      )}.`,
      message: "Request does not meet minimum advance days.",
    };
  }

  return {
    ok: true,
    skipped: false,
    requiredAdvanceDays,
    minimumAllowedDate: minimumAllowedDate.format("YYYY-MM-DD"),
  };
};