import { Request, Response } from "express";
import moment from "moment";
import mongoose, { Types } from "mongoose";
import PermissionType from "../../model/punch/PermissionType";
import PermissionRequest from "../../model/punch/permissionRequest";
import PermissionRequestHistory from "../../model/punch/permissionRequestHistory";
import Department from "../../model/rrhh/department";
import User from "../../model/account/user";
import {
  notifyDepartmentManagers,
  notifyRole,
  notifyUsers,
} from "../../services/notification.service";

import {
  applyApprovedVacationRequestToBalance,
} from "../../services/vacation/employeeVacationBalance.service";

import {
  formatYMD,
  isHHmm,
  parseYMDStrict,
} from "../../helper/date";

import { toNum } from "../../helper/parse";
import { escapeRegex } from "../../middlewares/cleanText";
import {  validateDaysRequestAgainstSchedule, validateHoursRequestAgainstSchedule, validateLeaveRequestAdvanceDays } from "../../helper/permissions/permissions.validate";
import { normalizeArrayBody } from "../../helper/normalize";
import { getQueryString } from "../../helper/request/request.query";
import { getEmployeeScheduleMapFromUser } from "../../helper/permissions/permissions.get";
import { ensureWorkSummariesForApprovedPermission, validatePermissionRequestNoOverlap, validateVacationBalanceBeforeSubmit } from "../../services/permissions/permissions.service";
import { buildNotificationDate } from "../../helper/permissions/permissions.build";

const createPermissionTypesBulk = async (req: Request, res: Response) => {
  try {
    const permissions = [
      {
        code: "VACACIONES",
        name: "Vacaciones",
        description: "",
        requiresDocument: true,
        isActive: true,
        category: "VACACIONES",
      },
    ];

    const inserted = await PermissionType.insertMany(permissions, {
      ordered: false,
    });

    return res.status(201).json({
      ok: true,
      data: inserted,
      mensaje: "Tipos de permisos creados correctamente.",
      message: "Permission types created successfully.",
    });
  } catch (error: any) {
    console.error("createPermissionTypesBulk error:", error);

    return res.status(500).json({
      ok: false,
      error: error?.message || error,
      mensaje: "Error interno al insertar tipos de permisos.",
      message: "Internal error creating permission types.",
    });
  }
};

const getPermissionTypes = async (req: Request, res: Response) => {
  try {
    const permissionTypes = await PermissionType.find({
      isActive: true,
    }).sort({ name: 1 });

    return res.status(200).json({
      ok: true,
      permissionTypes,
      permissionType: permissionTypes,
      mensaje: "Tipos de permisos encontrados con éxito.",
      message: "Permission types found successfully.",
    });
  } catch (error) {
    console.log("getPermissionTypes error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
      message: "Oops! Something went wrong.",
    });
  }
};

const createPermissionRequest = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const data = { ...req.body };
    const userId = req.uid;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        mensaje: "No autorizado.",
        message: "Unauthorized.",
      });
    }

    const rawStartDate = data.startDate ?? data.fechaInicio;
    const rawEndDate = data.endDate ?? data.fechaFin;
    const rawStartTime = data.startTime ?? data.horaInicio;
    const rawEndTime = data.endTime ?? data.horaFin;

    const totalDays = toNum(data.totalDays ?? data.amountDayOrHour, 0);
    const totalHour = toNum(
      data.totalHour ?? data.totlaHour ?? data.amountDayOrHour,
      0,
    );

    const category = String(data.category || "")
      .trim()
      .toUpperCase();

    const isByDays = totalDays >= 1 || category === "VACACIONES";
    const isByHours = !isByDays && totalHour > 0;

    if (!isByDays && !isByHours) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "Debes enviar totalDays >= 1 para días/vacaciones, o totalHour > 0 para horas.",
        message:
          "You must send totalDays >= 1 for days/vacations, or totalHour > 0 for hours.",
      });
    }

    const start = parseYMDStrict(rawStartDate);

    if (!start) {
      return res.status(400).json({
        ok: false,
        mensaje: "startDate inválida. Usa YYYY-MM-DD.",
        message: "Invalid startDate. Use YYYY-MM-DD.",
      });
    }

    const department = await Department.findOne({
      _id: req.user.department,
      isDeleted: false,
      isActive: true,
    })
      .select("_id")
      .lean();

    if (!department) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se encontró el departamento del empleado.",
        message: "Employee department not found.",
      });
    }

    const employee: any = await User.findById(userId)
      .select("schedule name company hiringDate")
      .lean();

    if (!employee) {
      return res.status(404).json({
        ok: false,
        mensaje: "Empleado no encontrado.",
        message: "Employee not found.",
      });
    }

    const scheduleMap = getEmployeeScheduleMapFromUser(employee);

    if (!scheduleMap) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se encontró un horario asignado al empleado.",
        message: "Employee schedule not found.",
      });
    }

    let totalMinutes: number | undefined = undefined;
    let requestedDates: string[] = [];

    if (isByDays) {
      const end = parseYMDStrict(rawEndDate);

      if (!end) {
        return res.status(400).json({
          ok: false,
          mensaje: "endDate es requerido para solicitudes por días.",
          message: "endDate is required for day-based requests.",
        });
      }

      const validation = validateDaysRequestAgainstSchedule({
        startDate: start.clone().startOf("day"),
        endDate: end.clone().startOf("day"),
        totalDays,
        scheduleMap,
      });

      if (!validation.ok) {
        return res.status(400).json({
          ok: false,
          mensaje: validation.mensaje,
        });
      }

      requestedDates = validation.requestedDates;

      data.totalDays = requestedDates.length;
      data.totalHour = 0;
      data.totalMinutes = 0;
      totalMinutes = undefined;
    }

    if (isByHours) {
      const startTime = String(rawStartTime ?? "").trim();
      const endTime = String(rawEndTime ?? "").trim();

      if (!isHHmm(startTime) || !isHHmm(endTime)) {
        return res.status(400).json({
          ok: false,
          mensaje: "Para permisos por horas debes enviar startTime y endTime.",
          message: "For hourly requests, startTime and endTime are required.",
        });
      }

      const validation = validateHoursRequestAgainstSchedule({
        date: start.clone().startOf("day"),
        startTime,
        endTime,
        scheduleMap,
      });

      if (!validation.ok) {
        return res.status(400).json({
          ok: false,
          mensaje: validation.mensaje,
        });
      }

      const diffMinutes = validation.diffMinutes;
      const byTotalHour = Math.round(totalHour * 60);

      if (byTotalHour > 0 && Math.abs(diffMinutes - byTotalHour) > 1) {
        return res.status(400).json({
          ok: false,
          mensaje: `totalHour (${totalHour}) no coincide con el rango horario (${startTime}-${endTime}). Debe ser ${(
            diffMinutes / 60
          ).toFixed(2)} horas.`,
        });
      }

      totalMinutes = diffMinutes;
      requestedDates = [formatYMD(start)];

      data.totalDays = 0;
      data.totalHour = Number((diffMinutes / 60).toFixed(4));
      data.startTime = startTime;
      data.endTime = endTime;
      data.endDate = data.startDate ?? rawStartDate;
    }

    let permission: any;

    await session.withTransaction(async () => {
        await validateLeaveRequestAdvanceDays({
          employee,
          category,
          startDate: rawStartDate,
          session,
        });

        await validatePermissionRequestNoOverlap({
          userId,
          requestedDates,
          isByDays,
          startTime: data.startTime,
          endTime: data.endTime,
          session,
        });

      await validateVacationBalanceBeforeSubmit({
        userId,
        permissionTypeId: data.permissionType,
        category: data.category,
        startDate: rawStartDate,
        requestedDays: requestedDates.length || totalDays,
        performedBy: userId,
        session,
      });

      permission = new PermissionRequest({
        user: userId,
        totalMinutes,
        requestedDates,
        ...data,
        status: "PENDIENTE",
        performedBy: userId,
      });

      await permission.save({ session });
    });

    await notifyDepartmentManagers({
      departmentId: department._id,
      type: "PERMISSION_REQUEST_SUBMITTED",
      severity: "INFO",
      title: "Nueva solicitud de empleado",
      message: `${req.user.name} ha solicitado ${
        category === "VACACIONES" ? "vacaciones" : "un permiso"
      } para el ${formatYMD(start)}`,
      entityType: "permissionRequest",
      entityId: permission._id,
      createdBy: req.user._id,
      link: `/solicitud/empleado?id=${String(permission._id)}`,
    });

    await notifyRole({
      roleCode: "ADMIN",
      type: "PERMISSION_REQUEST_SUBMITTED",
      severity: "INFO",
      title: "Nueva solicitud de empleado",
      message: `${req.user.name} ha solicitado ${
        category === "VACACIONES" ? "vacaciones" : "un permiso"
      } para el ${formatYMD(start)}`,
      entityType: "permissionRequest",
      entityId: permission._id,
      createdBy: req.user._id,
      link: `/solicitud/empleado?id=${String(permission._id)}`,
    });

    return res.status(201).json({
      ok: true,
      permission,
      permiso: permission,
      mensaje: "Solicitud creada correctamente.",
      message: "Permission request created successfully.",
    });
  } catch (error: any) {
    console.log("createPermissionRequest error:", error);

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        ok: false,
        mensaje: error.mensaje,
        message: error.message,
      });
    }

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
      message: "Oops! Something went wrong.",
    });
  } finally {
    session.endSession();
  }
};

const updatePermissionRequest = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const data = { ...req.body };
    const editorUserId = req.uid;

    if (!editorUserId) {
      return res.status(401).json({
        ok: false,
        mensaje: "No autorizado.",
        message: "Unauthorized.",
      });
    }

    if (!Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
        message: "Invalid ID.",
      });
    }

    const existing: any = await PermissionRequest.findById(id).lean();

    if (!existing) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud no encontrada.",
        message: "Permission request not found.",
      });
    }

    const isOwner = String(existing.user) === String(editorUserId);
    const isAdmin = Boolean(req.user?.isSuperAdmin);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        ok: false,
        mensaje: "No tienes permiso para editar esta solicitud.",
        message: "You do not have permission to edit this request.",
      });
    }

    const currentStatus = String(existing.status || "")
      .trim()
      .toUpperCase();

    if (currentStatus !== "PENDIENTE") {
      return res.status(400).json({
        ok: false,
        mensaje: "Solo puedes editar solicitudes en estado PENDIENTE.",
        message: "Only PENDING requests can be edited.",
      });
    }

    const merged: any = {
      ...existing,
      ...data,
    };

    const totalDays = toNum(merged.totalDays, 0);
    const totalHour = toNum(merged.totalHour ?? merged.totlaHour, 0);

    const category = String(merged.category || "")
      .trim()
      .toUpperCase();

    const isByDays = totalDays >= 1 || category === "VACACIONES";
    const isByHours = !isByDays && totalHour > 0;

    if (!isByDays && !isByHours) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "Debes enviar totalDays >= 1 para días/vacaciones, o totalHour > 0 para horas.",
        message:
          "You must send totalDays >= 1 for days/vacations, or totalHour > 0 for hours.",
      });
    }

    const start = parseYMDStrict(merged.startDate);

    if (!start) {
      return res.status(400).json({
        ok: false,
        mensaje: "startDate inválida.",
        message: "Invalid startDate.",
      });
    }

    const employee: any = await User.findById(existing.user)
      .select("schedule name company hiringDate")
      .lean();

    if (!employee) {
      return res.status(404).json({
        ok: false,
        mensaje: "Empleado no encontrado.",
        message: "Employee not found.",
      });
    }

    const scheduleMap = getEmployeeScheduleMapFromUser(employee);

    if (!scheduleMap) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se encontró un horario asignado al empleado.",
        message: "Employee schedule not found.",
      });
    }

    let totalMinutes: number | undefined = undefined;
    let requestedDates: string[] = [];

    if (isByDays) {
      const end = parseYMDStrict(merged.endDate);

      if (!end) {
        return res.status(400).json({
          ok: false,
          mensaje: "endDate es requerido para solicitudes por días.",
          message: "endDate is required for day-based requests.",
        });
      }

      const validation = validateDaysRequestAgainstSchedule({
        startDate: start.clone().startOf("day"),
        endDate: end.clone().startOf("day"),
        totalDays,
        scheduleMap,
      });

      if (!validation.ok) {
        return res.status(400).json({
          ok: false,
          mensaje: validation.mensaje,
        });
      }

      requestedDates = validation.requestedDates;
      totalMinutes = undefined;
    }

    if (isByHours) {
      const startTime = merged.startTime;
      const endTime = merged.endTime;

      if (!isHHmm(startTime) || !isHHmm(endTime)) {
        return res.status(400).json({
          ok: false,
          mensaje: "Para permisos por horas debes enviar startTime y endTime.",
          message: "For hourly requests, startTime and endTime are required.",
        });
      }

      const validation = validateHoursRequestAgainstSchedule({
        date: start.clone().startOf("day"),
        startTime,
        endTime,
        scheduleMap,
      });

      if (!validation.ok) {
        return res.status(400).json({
          ok: false,
          mensaje: validation.mensaje,
        });
      }

      const diffMinutes = validation.diffMinutes!;
      const byTotalHour = Math.round(totalHour * 60);

      if (byTotalHour && Math.abs(diffMinutes - byTotalHour) > 1) {
        return res.status(400).json({
          ok: false,
          mensaje: `totalHour (${totalHour}) no coincide con el rango horario (${startTime}-${endTime}). Debe ser ${(
            diffMinutes / 60
          ).toFixed(2)} horas.`,
        });
      }

      totalMinutes = diffMinutes;
      requestedDates = [formatYMD(start)];
    }

    let updated: any;

    await session.withTransaction(async () => {
        await validateLeaveRequestAdvanceDays({
          employee,
          category,
          startDate: merged.startDate,
          session,
        });
        
      await validatePermissionRequestNoOverlap({
        userId: existing.user,
        requestedDates,
        isByDays,
        startTime: merged.startTime,
        endTime: merged.endTime,
        excludeRequestId: id,
        session,
      });

      await validateVacationBalanceBeforeSubmit({
        userId: existing.user,
        permissionTypeId: merged.permissionType,
        category: merged.category,
        startDate: merged.startDate,
        requestedDays: requestedDates.length || totalDays,
        performedBy: editorUserId,
        session,
      });

      const updateData: any = {
        ...data,
        performedBy: editorUserId,
        requestedDates,
      };

      if (isByHours) {
        updateData.totalMinutes = totalMinutes;
        updateData.totalDays = 0;
        updateData.endDate = merged.startDate;
      } else {
        updateData.totalMinutes = undefined;
        updateData.totalHour = 0;
        updateData.totalDays = requestedDates.length || totalDays;
      }

      delete updateData.user;
      delete updateData.status;
      delete updateData.vacationBalance;
      delete updateData.vacationMovement;
      delete updateData.vacationDeductedDays;
      delete updateData.vacationDeductedAt;

      updated = await PermissionRequest.findByIdAndUpdate(id, updateData, {
        new: true,
        session,
      });
    });

    await notifyRole({
      roleCode: "ADMIN",
      type: "PERMISSION_REQUEST_SUBMITTED",
      severity: "INFO",
      title: "Solicitud actualizada",
      message: `${req.user.name} ha actualizado una solicitud.`,
      entityType: "permissionRequest",
      entityId: updated?._id,
      createdBy: req.user._id,
      link: `/solicitud/empleado?id=${String(updated?._id)}`,
    });

    return res.status(200).json({
      ok: true,
      permission: updated,
      permiso: updated,
      mensaje: "Solicitud editada correctamente.",
      message: "Permission request updated successfully.",
    });
  } catch (error: any) {
    console.log("updatePermissionRequest error:", error);

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        ok: false,
        mensaje: error.mensaje,
        message: error.message,
      });
    }

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
      message: "Oops! Something went wrong.",
    });
  } finally {
    session.endSession();
  }
};

const getPermissionRequests = async (req: any, res: Response) => {
  try {
    const user = req.user;

    const limitRaw = toNum(req.query.limit, 20);
    const initialRaw = toNum(req.query.initial, 0);

    const limit = Math.min(Math.max(limitRaw, 1), 200);
    const initial = Math.max(initialRaw, 0);

    const statuses = normalizeArrayBody(req.query.statuses);
    const queryText = getQueryString(req.query.q);
    const category = getQueryString(req.query.category).toUpperCase();
    const permissionType = getQueryString(req.query.permissionType);

    /**
     * scopedFilters:
     * Restricciones base según el usuario autenticado.
     * Ej: si es manager, solo empleados de su departamento.
     */
    const scopedFilters: any = {};

    let departmentUserIds: Types.ObjectId[] = [];

    if (user?.isManager) {
      if (!user?.department) {
        return res.status(400).json({
          ok: false,
          mensaje: "El manager no tiene department asignado.",
          message: "Manager has no department assigned.",
        });
      }

      const department = await Department.findOne({
        _id: user.department,
        isActive: true,
        isDeleted: false,
      })
        .select("_id")
        .lean();

      if (!department) {
        return res.status(400).json({
          ok: false,
          mensaje: "Departamento del manager no encontrado o no está activo.",
          message: "Manager department not found or inactive.",
        });
      }

      const departmentUsers = await User.find({
        department: department._id,
        isActived: true,
        isDeleted: false,
      })
        .select("_id name")
        .lean();

      departmentUserIds = departmentUsers.map((item: any) => item._id);

      if (!departmentUserIds.length) {
        return res.status(200).json({
          ok: true,
          data: [],
          requests: [],
          stats: {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            finalized: 0,
            vacations: 0,
            permissions: 0,
          },
          meta: {
            total: 0,
            limit,
            initial,
            returned: 0,
            hasMore: false,
          },
          mensaje: "Solicitudes cargadas correctamente.",
          message: "Permission requests loaded successfully.",
        });
      }

      scopedFilters.user = { $in: departmentUserIds };
    }

    /**
     * statsFilters:
     * Para los stats superiores.
     * Usa búsqueda/categoría/tipo/alcance del usuario,
     * pero NO usa statuses para que los cards siempre muestren el resumen general
     * del contexto actual.
     */
    const statsFilters: any = {
      ...scopedFilters,
    };

    /**
     * filters:
     * Para la tabla/paginación.
     * Incluye también statuses.
     */
    const filters: any = {
      ...scopedFilters,
    };

    if (category) {
      filters.category = category;
      statsFilters.category = category;
    }

    if (permissionType && Types.ObjectId.isValid(permissionType)) {
      filters.permissionType = permissionType;
      statsFilters.permissionType = permissionType;
    }

    if (queryText) {
      const regex = new RegExp(escapeRegex(queryText), "i");

      const userQuery: any = {
        isActived: true,
        isDeleted: false,
        $or: [{ name: regex }, { email: regex }],
      };

      if (user?.isManager && departmentUserIds.length) {
        userQuery._id = { $in: departmentUserIds };
      }

      const matchedUsers = await User.find(userQuery).select("_id").lean();
      const matchedUserIds = matchedUsers.map((item: any) => item._id);

      const matchedPermissionTypes = await PermissionType.find({
        $or: [{ name: regex }, { code: regex }],
      })
        .select("_id")
        .lean();

      const matchedPermissionTypeIds = matchedPermissionTypes.map(
        (item: any) => item._id,
      );

      const or: any[] = [
        { reason: regex },
        { comment: regex },
        { category: regex },
        { status: regex },
      ];

      if (matchedUserIds.length) {
        or.push({ user: { $in: matchedUserIds } });
        or.push({ performedBy: { $in: matchedUserIds } });
      }

      if (matchedPermissionTypeIds.length) {
        or.push({ permissionType: { $in: matchedPermissionTypeIds } });
      }

      filters.$and = (filters.$and || []).concat([{ $or: or }]);
      statsFilters.$and = (statsFilters.$and || []).concat([{ $or: or }]);
    }

    if (statuses.length) {
      filters.status = { $in: statuses };
    }

    const [
      total,
      requests,

      statsTotal,
      statsPending,
      statsApproved,
      statsRejected,
      statsFinalized,
      statsVacations,
      statsPermissions,
    ] = await Promise.all([
      PermissionRequest.countDocuments(filters),

      PermissionRequest.find(filters)
        .populate("user", "name email department")
        .populate("performedBy", "name email")
        .populate("permissionType", "name code category")
        .populate("vacationBalance")
        .populate("vacationMovement")
        .sort({ createdAt: -1 })
        .skip(initial)
        .limit(limit),

      PermissionRequest.countDocuments(statsFilters),

      PermissionRequest.countDocuments({
        ...statsFilters,
        status: "PENDIENTE",
      }),

      PermissionRequest.countDocuments({
        ...statsFilters,
        status: "APROBADA",
      }),

      PermissionRequest.countDocuments({
        ...statsFilters,
        status: "RECHAZADA",
      }),

      PermissionRequest.countDocuments({
        ...statsFilters,
        status: "FINALIZADA",
      }),

      PermissionRequest.countDocuments({
        ...statsFilters,
        category: "VACACIONES",
      }),

      PermissionRequest.countDocuments({
        ...statsFilters,
        category: "PERMISO",
      }),
    ]);

    return res.status(200).json({
      ok: true,
      data: requests,
      requests,
      stats: {
        total: statsTotal,
        pending: statsPending,
        approved: statsApproved,
        rejected: statsRejected,
        finalized: statsFinalized,
        vacations: statsVacations,
        permissions: statsPermissions,
      },
      meta: {
        total,
        limit,
        initial,
        returned: requests.length,
        hasMore: initial + requests.length < total,
      },
      mensaje: "Solicitudes cargadas correctamente.",
      message: "Permission requests loaded successfully.",
    });
  } catch (error) {
    console.error("getPermissionRequests error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener las solicitudes.",
      message: "Error getting permission requests.",
      error,
    });
  }
};

const getMyPermissionRequests = async (req: any, res: Response) => {
  try {
    const permissionType = getQueryString(req.query.permissionType);
    const category = getQueryString(req.query.category).toUpperCase();
    const statuses = normalizeArrayBody(req.query.statuses);
    const queryText = getQueryString(req.query.q);

    const filters: any = {
      user: req.user._id,
    };

    if (permissionType && Types.ObjectId.isValid(permissionType)) {
      filters.permissionType = permissionType;
    }

    if (category) {
      filters.category = category;
    }

    if (statuses.length) {
      filters.status = { $in: statuses };
    }

    if (queryText) {
      const regex = new RegExp(escapeRegex(queryText), "i");

      const matchedPermissionTypes = await PermissionType.find({
        $or: [{ name: regex }, { code: regex }],
      })
        .select("_id")
        .lean();

      const matchedPermissionTypeIds = matchedPermissionTypes.map(
        (item: any) => item._id,
      );

      const or: any[] = [
        { reason: regex },
        { comment: regex },
        { category: regex },
        { status: regex },
      ];

      if (matchedPermissionTypeIds.length) {
        or.push({ permissionType: { $in: matchedPermissionTypeIds } });
      }

      filters.$or = or;
    }

    const requests = await PermissionRequest.find(filters)
      .populate("user", "name email")
      .populate("permissionType", "name code category")
      .populate("performedBy", "name email")
      .populate("vacationBalance")
      .populate("vacationMovement")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      data: requests,
      requests,
      mensaje: "Solicitudes cargadas correctamente.",
      message: "Permission requests loaded successfully.",
    });
  } catch (error) {
    console.error("getMyPermissionRequests error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener las solicitudes.",
      message: "Error getting permission requests.",
      error,
    });
  }
};

const changePermissionRequestStatus = async (
  req: any,
  res: Response,
) => {
  const session = await mongoose.startSession();

  try {
    const performedById = req.user?._id;
    const { id } = req.params;

    const { comment: rawComment, previousData, action, status } = req.body;

    if (!performedById) {
      return res.status(401).json({
        ok: false,
        mensaje: "No autorizado.",
        message: "Unauthorized.",
      });
    }

    if (!Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de la solicitud no es válido.",
        message: "Invalid permission request ID.",
      });
    }

    if (!action) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes enviar action.",
        message: "action is required.",
      });
    }

    const actionNormalized = String(action || "")
      .trim()
      .toUpperCase();
    const commentNormalized = String(rawComment ?? "").trim();

    if (actionNormalized === "COMENTADA" && !commentNormalized) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes escribir un comentario.",
        message: "Comment is required.",
      });
    }

    let permission: any = null;
    let workSummariesResult: any = null;
    let vacationBalanceResult: any = null;

    await session.withTransaction(async () => {
      const currentPermission = await PermissionRequest.findById(id)
        .populate("user", "_id name email")
        .populate("permissionType", "_id name code")
        .session(session);

      if (!currentPermission) {
        throw {
          statusCode: 404,
          mensaje: "Solicitud no encontrada.",
          message: "Permission request not found.",
        };
      }

      const history = new PermissionRequestHistory({
        permissionRequest: id,
        comment: commentNormalized || "-",
        previousData: previousData || currentPermission.toObject(),
        action: actionNormalized,
        status: status || currentPermission.status,
        performedBy: performedById,
      });

      await history.save({ session });

      permission = await PermissionRequest.findByIdAndUpdate(
        id,
        {
          comment: commentNormalized || "-",
          status: actionNormalized,
          performedBy: performedById,
          reviewedBy: ["APROBADA", "RECHAZADA", "FINALIZADA"].includes(
            actionNormalized,
          )
            ? performedById
            : currentPermission.reviewedBy,
          reviewedAt: ["APROBADA", "RECHAZADA", "FINALIZADA"].includes(
            actionNormalized,
          )
            ? new Date()
            : currentPermission.reviewedAt,
        },
        {
          new: true,
          session,
        },
      )
        .populate("user", "_id name email")
        .populate("permissionType", "_id name code");

      if (!permission) {
        throw {
          statusCode: 404,
          mensaje: "Solicitud no encontrada.",
          message: "Permission request not found.",
        };
      }

      if (actionNormalized === "APROBADA") {
        workSummariesResult = await ensureWorkSummariesForApprovedPermission({
          permission,
          performedById,
          session,
        });

        vacationBalanceResult = await applyApprovedVacationRequestToBalance({
          permission,
          performedById,
          session,
        });
      }
    });

    const typeName = permission?.permissionType?.name || "solicitud";
    const start = buildNotificationDate(permission?.startDate);
    const end = buildNotificationDate(permission?.endDate);
    const dateRange = start && end ? `${start} — ${end}` : "";
    const actorName = req.user?.name || "Un usuario";

    const notificationMap: Record<
      string,
      {
        type: any;
        title: string;
        message: string;
        severity?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
      }
    > = {
      APROBADA: {
        type: "PERMISSION_REQUEST_APPROVED",
        severity: "SUCCESS",
        title: "Solicitud aprobada",
        message: `${actorName} aprobó tu solicitud de ${typeName}${
          dateRange ? ` (${dateRange})` : ""
        }.`,
      },
      RECHAZADA: {
        type: "PERMISSION_REQUEST_REJECTED",
        severity: "ERROR",
        title: "Solicitud rechazada",
        message: `${actorName} rechazó tu solicitud de ${typeName}${
          dateRange ? ` (${dateRange})` : ""
        }.`,
      },
      COMENTADA: {
        type: "PERMISSION_REQUEST_STATUS_CHANGED",
        severity: "INFO",
        title: "Nuevo comentario en tu solicitud",
        message: `${actorName} comentó tu solicitud de ${typeName}${
          dateRange ? ` (${dateRange})` : ""
        }.`,
      },
      MODIFICADA: {
        type: "PERMISSION_REQUEST_STATUS_CHANGED",
        severity: "INFO",
        title: "Solicitud modificada",
        message: `${actorName} modificó tu solicitud de ${typeName}${
          dateRange ? ` (${dateRange})` : ""
        }.`,
      },
      FINALIZADA: {
        type: "PERMISSION_REQUEST_FINALIZED",
        severity: "SUCCESS",
        title: "Solicitud finalizada",
        message: `${actorName} finalizó tu solicitud de ${typeName}${
          dateRange ? ` (${dateRange})` : ""
        }.`,
      },
      ACEPTADA: {
        type: "PERMISSION_REQUEST_STATUS_CHANGED",
        severity: "SUCCESS",
        title: "Solicitud aceptada",
        message: `${actorName} aceptó la modificación de tu solicitud de ${typeName}${
          dateRange ? ` (${dateRange})` : ""
        }.`,
      },
      "NO ACEPTADA": {
        type: "PERMISSION_REQUEST_STATUS_CHANGED",
        severity: "WARNING",
        title: "Solicitud no aceptada",
        message: `${actorName} no aceptó la modificación de tu solicitud de ${typeName}${
          dateRange ? ` (${dateRange})` : ""
        }.`,
      },
    };

    const notification = notificationMap[actionNormalized] || {
      type: "PERMISSION_REQUEST_STATUS_CHANGED",
      severity: "INFO",
      title: "Actualización de solicitud",
      message: `${actorName} actualizó tu solicitud de ${typeName}.`,
    };

    const recipientId =
      typeof permission?.user === "object"
        ? permission?.user?._id
        : permission?.user;

    if (recipientId) {
      await notifyUsers({
        recipientUserIds: [recipientId],
        type: notification.type,
        severity: notification.severity || "INFO",
        title: notification.title,
        message: notification.message,
        entityType: "permissionRequest",
        entityId: permission._id,
        createdBy: performedById,
        link: `/mis/permisos?id=${String(permission._id)}`,
      });
    }

    return res.status(200).json({
      ok: true,
      permission,
      workSummaries: workSummariesResult,
      vacationBalance: vacationBalanceResult,
      mensaje: "Solicitud actualizada correctamente.",
      message: "Permission request updated successfully.",
    });
  } catch (error: any) {
    console.error("changePermissionRequestStatus error:", error);

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        ok: false,
        mensaje: error.mensaje,
        message: error.message,
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: "Ocurrió un error al actualizar la solicitud.",
      message: "Error updating permission request.",
    });
  } finally {
    session.endSession();
  }
};

const getPermissionRequestHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de la solicitud no es válido.",
        message: "Invalid permission request ID.",
      });
    }

    const history = await PermissionRequestHistory.find({
      permissionRequest: id,
    })
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      history,
      mensaje: "Historial cargado correctamente.",
      message: "History loaded successfully.",
    });
  } catch (error) {
    console.error("getPermissionRequestHistory error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener el historial.",
      message: "Error getting history.",
      error,
    });
  }
};

export {
  createPermissionTypesBulk,
  getPermissionTypes,
  createPermissionRequest,
  updatePermissionRequest,
  getPermissionRequests,
  getMyPermissionRequests,
  changePermissionRequestStatus,
  getPermissionRequestHistory,
};
