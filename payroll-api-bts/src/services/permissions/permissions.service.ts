import mongoose, { Types } from "mongoose";
import PermissionRequest, { BLOCKING_PERMISSION_STATUSES } from "../../model/punch/permissionRequest";
import PermissionType from "../../model/punch/PermissionType";
import { isVacationRequest, rangesOverlap, resolveWorkSummaryClassification } from "../../helper/permissions/permissions.validate";
import User from "../../model/account/user";
import { ensureEmployeeVacationBalance } from "../vacation/employeeVacationBalance.service";
import { getEmployeeScheduleMapFromUser, getExistingRequestTimeRange, getNewRequestTimeRange, getRequestDatesFromExistingRequest, getRequestYearFromStartDate } from "../../helper/permissions/permissions.get";
import WorkSummary from "../../model/punch/workSummary";
import { expectedMinutesFromSchedule, parseYMDToLocalDate } from "../../helper/date";
import { buildDateOverlapQuery } from "../../helper/permissions/permissions.build";

export const validatePermissionRequestNoOverlap = async ({
  userId,
  requestedDates,
  isByDays,
  startTime,
  endTime,
  excludeRequestId,
  session,
}: {
  userId: any;
  requestedDates: string[];
  isByDays: boolean;
  startTime?: string;
  endTime?: string;
  excludeRequestId?: any;
  session?: mongoose.ClientSession;
}) => {
  if (!userId || !Types.ObjectId.isValid(String(userId))) {
    throw {
      statusCode: 400,
      mensaje: "El empleado de la solicitud no es válido.",
      message: "Invalid request employee.",
    };
  }

  const cleanRequestedDates = requestedDates
    .map((date) => String(date || "").trim())
    .filter(Boolean);

  if (!cleanRequestedDates.length) {
    throw {
      statusCode: 400,
      mensaje: "La solicitud no tiene fechas válidas para validar conflictos.",
      message: "Request has no valid dates to validate conflicts.",
    };
  }

  const query: any = {
    user: userId,
    status: { $in: BLOCKING_PERMISSION_STATUSES },
    $or: buildDateOverlapQuery(cleanRequestedDates),
  };

  if (excludeRequestId && Types.ObjectId.isValid(String(excludeRequestId))) {
    query._id = { $ne: new Types.ObjectId(String(excludeRequestId)) };
  }

  const existingRequests = await PermissionRequest.find(query)
    .populate("permissionType", "name code category")
    .select(
      "_id permissionType category status startDate endDate startTime endTime totalDays totalHour totalMinutes requestedDates reason createdAt",
    )
    .session(session || null);

  if (!existingRequests.length) {
    return {
      ok: true,
      hasConflict: false,
    };
  }

  const newRange = getNewRequestTimeRange({
    isByDays,
    startTime,
    endTime,
  });

  for (const existingRequest of existingRequests) {
    const existingDates = getRequestDatesFromExistingRequest(existingRequest);

    const intersectedDates = cleanRequestedDates.filter((date) =>
      existingDates.includes(date),
    );

    if (!intersectedDates.length) continue;

    const existingRange = getExistingRequestTimeRange(existingRequest);

    const hasTimeConflict =
      newRange.isFullDay ||
      existingRange.isFullDay ||
      rangesOverlap({
        startA: newRange.startMinute,
        endA: newRange.endMinute,
        startB: existingRange.startMinute,
        endB: existingRange.endMinute,
      });

    if (!hasTimeConflict) continue;

    const permissionTypeName =
      typeof existingRequest.permissionType === "object"
        ? existingRequest.permissionType?.name
        : "otra solicitud";

    const existingRangeText = existingRange.isFullDay
      ? "día completo"
      : `${existingRequest.startTime} - ${existingRequest.endTime}`;

    throw {
      statusCode: 400,
      mensaje: `Ya tienes una solicitud que ocupa ${intersectedDates.join(
        ", ",
      )} (${existingRangeText}). No puedes solicitar otro permiso o vacaciones en el mismo día u horario.`,
      message: "Permission request overlaps with an existing request.",
      conflict: {
        requestId: existingRequest._id,
        permissionType: permissionTypeName,
        category: existingRequest.category,
        status: existingRequest.status,
        dates: intersectedDates,
        range: existingRangeText,
      },
    };
  }

  return {
    ok: true,
    hasConflict: false,
  };
};

export const validateVacationBalanceBeforeSubmit = async ({
  userId,
  permissionTypeId,
  category,
  startDate,
  requestedDays,
  performedBy,
  session,
}: {
  userId: any;
  permissionTypeId: any;
  category: string;
  startDate: string;
  requestedDays: number;
  performedBy: any;
  session?: mongoose.ClientSession;
}) => {
  const permissionType = await PermissionType.findById(permissionTypeId)
    .lean()
    .session(session || null);

  if (!permissionType) {
    throw {
      statusCode: 404,
      mensaje: "No se encontró el tipo de permiso.",
      message: "Permission type not found.",
    };
  }

  if (!isVacationRequest(permissionType, category)) {
    return {
      ok: true,
      isVacation: false,
      balance: null,
    };
  }

  const employee = await User.findById(userId)
    .select("name email company department jobPosition hiringDate schedule")
    .session(session || null);

  if (!employee) {
    throw {
      statusCode: 404,
      mensaje: "Empleado no encontrado.",
      message: "Employee not found.",
    };
  }

  const year = getRequestYearFromStartDate(startDate);

  const balance = await ensureEmployeeVacationBalance({
    user: employee,
    year,
    performedBy,
    session,
  });

  const availableDays = Number(balance?.availableDays || 0);
  const days = Number(requestedDays || 0);

  if (!Number.isFinite(days) || days <= 0) {
    throw {
      statusCode: 400,
      mensaje: "La solicitud de vacaciones debe tener días válidos.",
      message: "Vacation request must have valid days.",
    };
  }

  if (availableDays < days) {
    throw {
      statusCode: 400,
      mensaje: `No tienes días suficientes de vacaciones. Disponible: ${availableDays}, solicitado: ${days}.`,
      message: "Not enough vacation days available.",
    };
  }

  return {
    ok: true,
    isVacation: true,
    balance,
  };
};

export const ensureWorkSummariesForApprovedPermission = async ({
  permission,
  performedById,
  session,
}: {
  permission: any;
  performedById: any;
  session?: mongoose.ClientSession;
}) => {
  const userId =
    typeof permission?.user === "object"
      ? permission?.user?._id
      : permission?.user;

  if (!userId) {
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      mensaje: "La solicitud no tiene empleado asociado.",
    };
  }

  const requestedDates: string[] = Array.isArray(permission?.requestedDates)
    ? permission.requestedDates
    : [];

  if (!requestedDates.length) {
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      mensaje: "La solicitud no tiene requestedDates.",
    };
  }

  const employee = await User.findById(userId)
    .select("schedule")
    .lean()
    .session(session || null);

  const scheduleMap = getEmployeeScheduleMapFromUser(employee);

  if (!scheduleMap) {
    return {
      created: 0,
      updated: 0,
      skipped: requestedDates.length,
      mensaje: "El empleado no tiene horario configurado.",
    };
  }

  const classification = resolveWorkSummaryClassification(permission);

  const permissionMinutes = Number(permission?.totalMinutes || 0) || 0;
  const isByDays = Number(permission?.totalDays || 0) >= 1;

  const existing = await WorkSummary.find({
    user: userId,
    dateString: { $in: requestedDates },
    isDeleted: false,
  })
    .select("dateString confirmedToPay")
    .lean()
    .session(session || null);

  const existingByDate = new Map<string, any>();

  for (const workSummary of existing) {
    existingByDate.set(workSummary.dateString, workSummary);
  }

  const operations: any[] = [];
  let skipped = 0;

  for (const ymd of requestedDates) {
    const existingSummary = existingByDate.get(ymd);

    if (existingSummary?.confirmedToPay) {
      skipped++;
      continue;
    }

    const dateObj = parseYMDToLocalDate(ymd);
    const dow = dateObj.getDay();
    const expectedMinutes = expectedMinutesFromSchedule(scheduleMap[dow]);

    const approvedMinutes = isByDays
      ? expectedMinutes
      : Math.min(permissionMinutes, expectedMinutes || permissionMinutes);

    operations.push({
      updateOne: {
        filter: {
          user: userId,
          dateString: ymd,
          isDeleted: false,
        },
        update: {
          $setOnInsert: {
            user: userId,
            date: dateObj,
            dateString: ymd,
            isActive: true,
            isDeleted: false,
            confirmedToPay: false,
            punchSteps: [],
            missingSteps: [],
            totalMinutes: 0,
          },
          $set: {
            classification,
            expectedMinutes,
            approvedMinutes,
            payImpact: "PAID_LEAVE",
            discountOverride: isByDays ? "FORCE_NO_DEDUCT" : "AUTO",
            overrideBy: performedById,
            overrideAt: new Date(),
            overrideReason: `Permiso aprobado (${permission?._id})`,
            updatedBy: performedById,
          },
        },
        upsert: true,
      },
    });
  }

  if (!operations.length) {
    return {
      created: 0,
      updated: 0,
      skipped,
      mensaje: "Nada que crear o actualizar.",
    };
  }

  const bulkResult = await WorkSummary.bulkWrite(operations, {
    ordered: false,
    session: session || undefined,
  });

  return {
    created: Number(bulkResult?.upsertedCount || 0),
    updated: Number(bulkResult?.modifiedCount || 0),
    skipped,
    mensaje: "WorkSummaries procesados.",
  };
};