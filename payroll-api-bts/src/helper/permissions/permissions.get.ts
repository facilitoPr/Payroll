import {
  FULL_DAY_END_MINUTE,
  FULL_DAY_START_MINUTE,
} from "../../model/punch/permissionRequest";
import {
  formatYMD,
  isHHmm,
  listDatesInclusive,
  minutesOfDay,
  parseYMDStrict,
} from "../date";
import { isFullDayPermissionRequest } from "./permissions.validate";

export type DaySchedule = {
  isWorkday: boolean;
  entryTime?: string;
  exitTime?: string;
  hasLunchTime?: boolean;
  lunchStartTime?: string;
  lunchEndTime?: string;
};

export type WeekScheduleMap = Record<number, DaySchedule>;

export const dayKeyByDow: Record<number, string> = {
  0: "domingo",
  1: "lunes",
  2: "martes",
  3: "miercoles",
  4: "jueves",
  5: "viernes",
  6: "sabado",
};

export const getRequestDatesFromExistingRequest = (request: any): string[] => {
  if (Array.isArray(request?.requestedDates) && request.requestedDates.length) {
    return request.requestedDates
      .map((date: any) => String(date || "").trim())
      .filter(Boolean);
  }

  const start = parseYMDStrict(request?.startDate);
  const end = parseYMDStrict(request?.endDate || request?.startDate);

  if (!start || !end) {
    return request?.startDate ? [String(request.startDate).slice(0, 10)] : [];
  }

  return listDatesInclusive(start, end).map((date) => formatYMD(date));
};

export const getExistingRequestTimeRange = (request: any) => {
  if (isFullDayPermissionRequest(request)) {
    return {
      startMinute: FULL_DAY_START_MINUTE,
      endMinute: FULL_DAY_END_MINUTE,
      isFullDay: true,
    };
  }

  const startTime = String(request?.startTime || "").trim();
  const endTime = String(request?.endTime || "").trim();

  if (!isHHmm(startTime) || !isHHmm(endTime)) {
    return {
      startMinute: FULL_DAY_START_MINUTE,
      endMinute: FULL_DAY_END_MINUTE,
      isFullDay: true,
    };
  }

  return {
    startMinute: minutesOfDay(startTime),
    endMinute: minutesOfDay(endTime),
    isFullDay: false,
  };
};

export const getNewRequestTimeRange = ({
  isByDays,
  startTime,
  endTime,
}: {
  isByDays: boolean;
  startTime?: string;
  endTime?: string;
}) => {
  if (isByDays) {
    return {
      startMinute: FULL_DAY_START_MINUTE,
      endMinute: FULL_DAY_END_MINUTE,
      isFullDay: true,
    };
  }

  const normalizedStartTime = String(startTime || "").trim();
  const normalizedEndTime = String(endTime || "").trim();

  if (!isHHmm(normalizedStartTime) || !isHHmm(normalizedEndTime)) {
    return {
      startMinute: FULL_DAY_START_MINUTE,
      endMinute: FULL_DAY_END_MINUTE,
      isFullDay: true,
    };
  }

  return {
    startMinute: minutesOfDay(normalizedStartTime),
    endMinute: minutesOfDay(normalizedEndTime),
    isFullDay: false,
  };
};

export const getRequestYearFromStartDate = (startDate: string) => {
  const year = Number(String(startDate || "").slice(0, 4));

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return new Date().getFullYear();
  }

  return year;
};

export const getEmployeeScheduleMapFromUser = (
  employee: any,
): WeekScheduleMap | null => {
  const schedule = employee?.schedule;

  if (!schedule) return null;

  const map: WeekScheduleMap = {
    0: { isWorkday: false },
    1: { isWorkday: false },
    2: { isWorkday: false },
    3: { isWorkday: false },
    4: { isWorkday: false },
    5: { isWorkday: false },
    6: { isWorkday: false },
  };

  for (let dow = 0; dow <= 6; dow++) {
    const key = dayKeyByDow[dow];
    const day = schedule?.[key];

    map[dow] = {
      isWorkday: Boolean(day?.isActive),
      entryTime: day?.entryTime,
      exitTime: day?.exitTime,
      hasLunchTime: Boolean(day?.hasLunchTime),
      lunchStartTime: day?.lunchStartTime,
      lunchEndTime: day?.lunchEndTime,
    };
  }

  return map;
};