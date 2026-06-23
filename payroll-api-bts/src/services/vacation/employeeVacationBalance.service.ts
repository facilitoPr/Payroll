import mongoose, { Types } from "mongoose";
import User from "../../model/account/user";
import VacationBalanceMovement from "../../model/vacation/VacationBalanceMovement";
import EmployeeVacationBalance from "../../model/vacation/EmployeeVacationBalance";
import PermissionRequest from "../../model/punch/permissionRequest";
import LeavePolicy from "../../model/leavePolicy";
import { emitNotificationToUsers } from "../notification.socket.service";

export const getEmployeeCompanyId = (user: any): Types.ObjectId | null => {
  const company = user?.company;

  if (!company) return null;

  const companyId = company?._id || company;

  if (!Types.ObjectId.isValid(String(companyId))) {
    return null;
  }

  return new Types.ObjectId(String(companyId));
};

const calculateCarryOverDays = ({
  availableDays,
  policy,
}: {
  availableDays: number;
  policy: any;
}) => {
  const cleanAvailableDays = Math.max(0, Number(availableDays || 0));

  if (policy.vacationCarryOverMode === "NONE") {
    return {
      carryOverDays: 0,
      expiredDays: cleanAvailableDays,
    };
  }

  if (policy.vacationCarryOverMode === "UNLIMITED") {
    return {
      carryOverDays: cleanAvailableDays,
      expiredDays: 0,
    };
  }

  const defaultVacationDays = Number(policy.defaultVacationDays || 14);
  const maxCarryOverYears = Number(policy.maxCarryOverYears || 0);
  const explicitMaxCarryOverDays = Number(policy.maxCarryOverDays || 0);

  const maxAllowedDays =
    explicitMaxCarryOverDays > 0
      ? explicitMaxCarryOverDays
      : defaultVacationDays * maxCarryOverYears;

  const carryOverDays = Math.min(cleanAvailableDays, maxAllowedDays);
  const expiredDays = Math.max(0, cleanAvailableDays - carryOverDays);

  return {
    carryOverDays,
    expiredDays,
  };
};

const getSeniorityYears = (hiringDate?: string | Date | null) => {
  if (!hiringDate) return 0;

  const startDate = new Date(hiringDate);

  if (Number.isNaN(startDate.getTime())) return 0;

  const today = new Date();

  let years = today.getFullYear() - startDate.getFullYear();

  const hasNotReachedAnniversary =
    today.getMonth() < startDate.getMonth() ||
    (today.getMonth() === startDate.getMonth() &&
      today.getDate() < startDate.getDate());

  if (hasNotReachedAnniversary) {
    years -= 1;
  }

  return Math.max(years, 0);
};

const findApplicableVacationPolicy = async (
  companyId: Types.ObjectId | null,
  session?: mongoose.ClientSession,
) => {
  if (companyId) {
    const companyPolicy = await LeavePolicy.findOne({
      company: companyId,
      isActive: true,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .session(session || null);

    if (companyPolicy) {
      return companyPolicy;
    }
  }

  const globalPolicy = await LeavePolicy.findOne({
    company: null,
    isActive: true,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .session(session || null);

  return globalPolicy;
};

const calculateAssignedVacationDays = (user: any, policy: any) => {
  const defaultDays = Number(policy?.defaultDays || 14);
  const seniorityDays = Number(policy?.seniorityDays || defaultDays);
  const seniorityYears = Number(policy?.seniorityYears || 5);

  const employeeYears = getSeniorityYears(user?.hiringDate);

  if (employeeYears >= seniorityYears) {
    return seniorityDays;
  }

  return defaultDays;
};

const recalculateVacationBalance = (balance: any) => {
  balance.availableDays =
    Number(balance.assignedDays || 0) +
    Number(balance.adjustmentDays || 0) -
    Number(balance.usedDays || 0) -
    Number(balance.reservedDays || 0);

  return balance;
};

const getPermissionUserId = (permission: any): Types.ObjectId | null => {
  const rawUserId =
    typeof permission?.user === "object"
      ? permission?.user?._id
      : permission?.user;

  if (!rawUserId || !Types.ObjectId.isValid(String(rawUserId))) {
    return null;
  }

  return new Types.ObjectId(String(rawUserId));
};

const getVacationRequestYear = (permission: any) => {
  const startDate = String(permission?.startDate || "");

  const year = Number(startDate.slice(0, 4));

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return new Date().getFullYear();
  }

  return year;
};

const getVacationDaysToDiscount = (permission: any) => {
  const requestedDates = Array.isArray(permission?.requestedDates)
    ? permission.requestedDates
    : [];

  if (requestedDates.length > 0) {
    return requestedDates.length;
  }

  return Number(permission?.totalDays || 0);
};

const isVacationPermission = (permission: any) => {
  const category = String(permission?.category || "")
    .trim()
    .toUpperCase();

  const permissionTypeCode = String(permission?.permissionType?.code || "")
    .trim()
    .toUpperCase();

  return category === "VACACIONES" || permissionTypeCode === "VACACIONES";
};

export const findApplicableLeavePolicy = async (
  companyId: Types.ObjectId | null,
  session?: mongoose.ClientSession,
) => {
  if (companyId) {
    const companyPolicy = await LeavePolicy.findOne({
      company: companyId,
      isActive: true,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .session(session || null);

    if (companyPolicy) {
      return companyPolicy;
    }
  }

  return LeavePolicy.findOne({
    company: null,
    isActive: true,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .session(session || null);
};

export const ensureEmployeeVacationBalance = async ({
  user,
  year,
  performedBy,
  session,
}: {
  user: any;
  year: number;
  performedBy: Types.ObjectId;
  session?: mongoose.ClientSession;
}) => {
  if (!user?._id || !Types.ObjectId.isValid(String(user._id))) {
    throw {
      statusCode: 400,
      mensaje: "El empleado no es válido.",
      message: "Invalid employee.",
    };
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw {
      statusCode: 400,
      mensaje: "El año del balance no es válido.",
      message: "Invalid vacation balance year.",
    };
  }

  const existingBalance = await EmployeeVacationBalance.findOne({
    user: user._id,
    year,
    isDeleted: false,
  }).session(session || null);

  if (existingBalance) {
    return existingBalance;
  }

  const companyId = getEmployeeCompanyId(user);

  const policy = await findApplicableVacationPolicy(companyId, session);

  const assignedDays = calculateAssignedVacationDays(user, policy);

  const balance = new EmployeeVacationBalance({
    user: user._id,
    company: companyId,
    year,
    policy: policy?._id || null,

    assignedDays,
    usedDays: 0,
    adjustmentDays: 0,
    reservedDays: 0,
    availableDays: assignedDays,

    hasManualOverride: false,
    notes: "",

    createdBy: performedBy,
    updatedBy: performedBy,

    isActive: true,
    isDeleted: false,
  });

  await balance.save({ session });

  await VacationBalanceMovement.create(
    [
      {
        balance: balance._id,
        user: user._id,
        company: companyId,
        year,
        type: "INITIAL_ASSIGNMENT",
        days: assignedDays,
        previousAvailableDays: 0,
        newAvailableDays: assignedDays,
        reason: "Asignación inicial de vacaciones",
        performedBy,
        metadata: {
          policy: policy?._id || null,
          policyName: policy?.name || null,
          defaultDays: policy?.defaultVacationDays || 14,
          seniorityDays: policy?.seniorityVacationDays || null,
          seniorityYears: policy?.seniorityYears || null,
          employeeSeniorityYears: getSeniorityYears(user?.hiringDate),
        },
      },
    ],
    { session },
  );

  return balance;
};

export const applyApprovedVacationRequestToBalance = async ({
  permission,
  performedById,
  session,
}: {
  permission: any;
  performedById: Types.ObjectId;
  session?: mongoose.ClientSession;
}) => {
  if (!permission?._id) {
    throw {
      statusCode: 400,
      mensaje: "La solicitud no es válida.",
      message: "Invalid permission request.",
    };
  }

  if (!performedById || !Types.ObjectId.isValid(String(performedById))) {
    throw {
      statusCode: 401,
      mensaje: "No autorizado.",
      message: "Unauthorized.",
    };
  }

  if (!isVacationPermission(permission)) {
    return {
      ok: true,
      skipped: true,
      reason: "La solicitud no es de vacaciones.",
      message: "Request is not a vacation request.",
    };
  }

  if (permission?.vacationMovement) {
    return {
      ok: true,
      skipped: true,
      reason: "La solicitud ya fue descontada anteriormente.",
      message: "Vacation request was already deducted.",
      vacationMovement: permission.vacationMovement,
    };
  }

  const userId = getPermissionUserId(permission);

  if (!userId) {
    throw {
      statusCode: 400,
      mensaje: "La solicitud no tiene un empleado válido.",
      message: "Permission request has no valid employee.",
    };
  }

  const employee = await User.findById(userId)
    .select("name email company department jobPosition hiringDate schedule")
    .session(session || null);

  if (!employee) {
    throw {
      statusCode: 404,
      mensaje: "No se encontró el empleado de la solicitud.",
      message: "Employee not found.",
    };
  }

  const year = getVacationRequestYear(permission);

  const daysToDiscount = getVacationDaysToDiscount(permission);

  if (!Number.isFinite(daysToDiscount) || daysToDiscount <= 0) {
    throw {
      statusCode: 400,
      mensaje:
        "La solicitud de vacaciones no tiene días válidos para descontar.",
      message: "Vacation request has no valid days to discount.",
    };
  }

  const balance = await ensureEmployeeVacationBalance({
    user: employee,
    year,
    performedBy: performedById,
    session,
  });

  const companyId = getEmployeeCompanyId(employee);

  const policy = await findApplicableVacationPolicy(companyId, session);

  const previousAvailableDays = Number(balance.availableDays || 0);

  if (
    policy &&
    policy.allowNegativeBalance === false &&
    previousAvailableDays < daysToDiscount
  ) {
    throw {
      statusCode: 400,
      mensaje: `El empleado no tiene días suficientes de vacaciones. Disponible: ${previousAvailableDays}, solicitado: ${daysToDiscount}.`,
      message: "Employee does not have enough vacation days.",
    };
  }

  balance.usedDays = Number(balance.usedDays || 0) + daysToDiscount;
  balance.updatedBy = performedById;

  recalculateVacationBalance(balance);

  await balance.save({ session });

  const requestedDates = Array.isArray(permission?.requestedDates)
    ? permission.requestedDates
    : [];

  const movements = await VacationBalanceMovement.create(
    [
      {
        balance: balance._id,
        user: employee._id,
        company: balance.company || companyId || null,
        year,
        type: "VACATION_APPROVED",
        days: -Math.abs(daysToDiscount),
        previousAvailableDays,
        newAvailableDays: balance.availableDays,
        permissionRequest: permission._id,
        reason: "Descuento por solicitud de vacaciones aprobada",
        performedBy: performedById,
        metadata: {
          requestedDates,
          totalDays: Number(permission?.totalDays || 0),
          startDate: permission?.startDate || null,
          endDate: permission?.endDate || null,
          policy: policy?._id || null,
          policyName: policy?.name || null,
        },
      },
    ],
    { session },
  );

  const movement = movements[0];

  await PermissionRequest.findByIdAndUpdate(
    permission._id,
    {
      vacationBalance: balance._id,
      vacationMovement: movement._id,
      vacationDeductedDays: daysToDiscount,
      vacationDeductedAt: new Date(),
    },
    {
      session,
      new: true,
    },
  );

  return {
    ok: true,
    skipped: false,
    balance,
    movement,
    daysToDiscount,
    previousAvailableDays,
    newAvailableDays: balance.availableDays,
    mensaje: "Vacaciones descontadas correctamente.",
    message: "Vacation days deducted successfully.",
  };
};

export const notifyVacationExpirationIfNeeded = async ({
  user,
  balance,
  policy,
  asOfDate,
}: {
  user: any;
  balance: any;
  policy: any;
  asOfDate: Date;
}) => {
  if (!policy.notifyBeforeVacationExpiration) return;

  if (policy.vacationCarryOverMode === "UNLIMITED") return;

  if (!balance.cycleEndDate) return;

  const availableDays = Number(balance.availableDays || 0);

  if (availableDays <= 0) return;

  if (balance.vacationExpirationReminderSentAt) return;

  const reminderDays = Number(policy.vacationExpirationReminderDays || 30);

  const today = new Date(asOfDate);
  today.setHours(0, 0, 0, 0);

  const cycleEnd = new Date(balance.cycleEndDate);
  cycleEnd.setHours(0, 0, 0, 0);

  const diffMs = cycleEnd.getTime() - today.getTime();
  const daysUntilExpiration = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysUntilExpiration < 0) return;

  if (daysUntilExpiration > reminderDays) return;

  let daysAtRisk = availableDays;

  if (policy.vacationCarryOverMode === "LIMITED") {
    const carryOverResult = calculateCarryOverDays({
      availableDays,
      policy,
    });

    daysAtRisk = carryOverResult.expiredDays;
  }

  if (daysAtRisk <= 0) return;

  emitNotificationToUsers({
    userIds: [user._id],
    payload: {
      type: "VACATION_EXPIRATION_WARNING",
      severity: "WARNING",
      title: "Vacaciones próximas a vencer",
      message: `Tienes ${daysAtRisk} día(s) de vacaciones que podrían vencer en ${daysUntilExpiration} día(s). Solicítalas antes de que cierre tu ciclo.`,
      entityType: "EmployeeVacationBalance",
      entityId: String(balance._id),
      createdAt: new Date(),
      meta: {
        balanceId: balance._id,
        cycleStartDate: balance.cycleStartDate,
        cycleEndDate: balance.cycleEndDate,
        availableDays,
        daysAtRisk,
        daysUntilExpiration,
        carryOverMode: policy.vacationCarryOverMode,
      },
    },
  });

  balance.vacationExpirationReminderSentAt = new Date();
  await balance.save();
};

export const processPreviousCycleCarryOver = async ({
  user,
  currentBalance,
  policy,
  asOfDate,
}: {
  user: any;
  currentBalance: any;
  policy: any;
  asOfDate: Date;
}) => {
  if (!currentBalance.cycleStartDate) return currentBalance;

  const previousBalance = await EmployeeVacationBalance.findOne({
    user: user._id,
    isDeleted: false,
    _id: { $ne: currentBalance._id },
    cycleEndDate: { $lt: currentBalance.cycleStartDate },
    carryOverProcessedAt: null,
  }).sort({ cycleEndDate: -1 });

  if (!previousBalance) return currentBalance;

  const result = calculateCarryOverDays({
    availableDays: previousBalance.availableDays,
    policy,
  });

  currentBalance.carryOverDays =
    Number(currentBalance.carryOverDays || 0) + result.carryOverDays;

  previousBalance.expiredDays =
    Number(previousBalance.expiredDays || 0) + result.expiredDays;

  previousBalance.carryOverProcessedAt = new Date(asOfDate);

  await previousBalance.save();
  await currentBalance.save();

  await VacationBalanceMovement.create({
    balance: currentBalance._id,
    user: user._id,
    company: user.company || null,
    year: currentBalance.year,
    type: "VACATION_CARRY_OVER",
    days: result.carryOverDays,
    previousAvailableDays: 0,
    newAvailableDays: currentBalance.availableDays,
    permissionRequest: null,
    loanRequest: null,
    reason: "Arrastre automático de vacaciones desde el ciclo anterior.",
    performedBy: user._id,
    metadata: {
      previousBalance: previousBalance._id,
      carryOverDays: result.carryOverDays,
      expiredDays: result.expiredDays,
      carryOverMode: policy.vacationCarryOverMode,
      processedAt: new Date(asOfDate),
    },
  });

  if (result.expiredDays > 0) {
    await VacationBalanceMovement.create({
      balance: previousBalance._id,
      user: user._id,
      company: user.company || null,
      year: previousBalance.year,
      type: "VACATION_EXPIRED",
      days: result.expiredDays,
      previousAvailableDays: previousBalance.availableDays,
      newAvailableDays: previousBalance.availableDays,
      permissionRequest: null,
      loanRequest: null,
      reason: "Días de vacaciones vencidos por política de acumulación.",
      performedBy: user._id,
      metadata: {
        currentBalance: currentBalance._id,
        expiredDays: result.expiredDays,
        carryOverMode: policy.vacationCarryOverMode,
        processedAt: new Date(asOfDate),
      },
    });
  }

  return currentBalance;
};

export const findActiveVacationBalanceForLoan = async ({
  userId,
  companyId,
  asOfDate = new Date(),
  session,
}: {
  userId: any;
  companyId?: any;
  asOfDate?: Date;
  session?: any;
}) => {
  const filter: any = {
    user: userId,
    isActive: true,
    isDeleted: false,
    cycleStartDate: { $lte: asOfDate },
    cycleEndDate: { $gte: asOfDate },
  };

  if (companyId) {
    filter.company = companyId;
  }

  const balance = await EmployeeVacationBalance.findOne(filter)
    .sort({
      availableForLoanDays: -1,
      netPayableVacationDays: -1,
      payableVacationDays: -1,
      lastCalculatedAt: -1,
      updatedAt: -1,
    })
    .session(session || null);

  return balance;
};