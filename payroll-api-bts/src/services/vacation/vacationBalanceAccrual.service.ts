import moment from "moment";
import { Types } from "mongoose";
import VacationBalanceMovement from "../../model/vacation/VacationBalanceMovement";
import EmployeeVacationBalance from "../../model/vacation/EmployeeVacationBalance";
import LeavePolicy from "../../model/leavePolicy";
import User from "../../model/account/user";
import { emitNotificationToUsers } from "../notification.socket.service";

type CalculateVacationEntitlementParams = {
  hiringDate: string | Date;
  asOfDate?: string | Date;
  defaultVacationDays?: number;
  seniorityVacationDays?: number;
  seniorityYears?: number;
};

type RecalculateEmployeeVacationBalanceParams = {
  userId: string | Types.ObjectId;
  asOfDate?: string | Date;
  performedBy?: string | Types.ObjectId | null;
  createMovement?: boolean;

  /** Procesa vacaciones acumuladas o vencidas del ciclo anterior. */
  processCarryOver?: boolean;

  /** Envía alerta si el empleado está cerca de perder vacaciones. */
  notifyExpiration?: boolean;
};

const SYSTEM_PERFORMED_BY = null;

const toObjectId = (value: string | Types.ObjectId) => {
  return typeof value === "string" ? new Types.ObjectId(value) : value;
};

const safeObjectId = (value?: string | Types.ObjectId | null) => {
  if (!value) return undefined;

  const stringValue = String(value);

  if (!Types.ObjectId.isValid(stringValue)) return undefined;

  return typeof value === "string" ? new Types.ObjectId(value) : value;
};

const safeNumber = (value: any, defaultValue = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

const getStartOfDay = (date?: string | Date) => {
  if (!date) return moment().startOf("day");

  return moment(date).startOf("day");
};

const getCompletedYears = (
  hiringDate: moment.Moment,
  asOfDate: moment.Moment,
) => {
  if (!hiringDate.isValid()) return 0;

  return Math.max(0, asOfDate.diff(hiringDate, "years"));
};

const getCompletedMonths = (
  hiringDate: moment.Moment,
  asOfDate: moment.Moment,
) => {
  if (!hiringDate.isValid()) return 0;

  return Math.max(0, asOfDate.diff(hiringDate, "months"));
};

/**
 * Regla de negocio:
 * Cuando cumple 5 meses, ya se le reconocen 6 días pagables/garantizables.
 *
 * Si luego decides aplicar literalmente "más de 5 meses",
 * cambiamos isSameOrAfter por isAfter.
 */
const hasCompletedMonthThreshold = ({
  hiringDate,
  asOfDate,
  months,
}: {
  hiringDate: moment.Moment;
  asOfDate: moment.Moment;
  months: number;
}) => {
  const thresholdDate = hiringDate.clone().add(months, "months").startOf("day");

  return asOfDate.isSameOrAfter(thresholdDate, "day");
};

const getProportionalPaymentDays = ({
  hiringDate,
  asOfDate,
}: {
  hiringDate: moment.Moment;
  asOfDate: moment.Moment;
}) => {
  if (hasCompletedMonthThreshold({ hiringDate, asOfDate, months: 11 })) {
    return 12;
  }

  if (hasCompletedMonthThreshold({ hiringDate, asOfDate, months: 10 })) {
    return 11;
  }

  if (hasCompletedMonthThreshold({ hiringDate, asOfDate, months: 9 })) {
    return 10;
  }

  if (hasCompletedMonthThreshold({ hiringDate, asOfDate, months: 8 })) {
    return 9;
  }

  if (hasCompletedMonthThreshold({ hiringDate, asOfDate, months: 7 })) {
    return 8;
  }

  if (hasCompletedMonthThreshold({ hiringDate, asOfDate, months: 6 })) {
    return 7;
  }

  if (hasCompletedMonthThreshold({ hiringDate, asOfDate, months: 5 })) {
    return 6;
  }

  return 0;
};

const getCurrentCycleDates = ({
  hiringDate,
  asOfDate,
}: {
  hiringDate: moment.Moment;
  asOfDate: moment.Moment;
}) => {
  if (!hiringDate.isValid()) {
    return {
      cycleStartDate: null,
      cycleEndDate: null,
    };
  }

  const years = Math.max(0, asOfDate.diff(hiringDate, "years"));

  let cycleStart = hiringDate.clone().add(years, "years").startOf("day");

  if (cycleStart.isAfter(asOfDate, "day")) {
    cycleStart = hiringDate
      .clone()
      .add(years - 1, "years")
      .startOf("day");
  }

  const cycleEnd = cycleStart
    .clone()
    .add(1, "year")
    .subtract(1, "day")
    .endOf("day");

  return {
    cycleStartDate: cycleStart.toDate(),
    cycleEndDate: cycleEnd.toDate(),
  };
};

const calculateCarryOverDays = ({
  availableDays,
  policy,
}: {
  availableDays: number;
  policy: any;
}) => {
  const cleanAvailableDays = Math.max(0, safeNumber(availableDays, 0));

  const carryOverMode = String(policy?.vacationCarryOverMode || "NONE");

  if (carryOverMode === "NONE") {
    return {
      carryOverDays: 0,
      expiredDays: cleanAvailableDays,
    };
  }

  if (carryOverMode === "UNLIMITED") {
    return {
      carryOverDays: cleanAvailableDays,
      expiredDays: 0,
    };
  }

  const defaultVacationDays = safeNumber(policy?.defaultVacationDays, 14);
  const maxCarryOverYears = safeNumber(policy?.maxCarryOverYears, 0);
  const explicitMaxCarryOverDays = safeNumber(policy?.maxCarryOverDays, 0);

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

const notifyVacationExpirationIfNeeded = async ({
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
  if (!policy?.notifyBeforeVacationExpiration) return;

  const carryOverMode = String(policy?.vacationCarryOverMode || "NONE");

  if (carryOverMode === "UNLIMITED") return;

  if (!balance?.cycleEndDate) return;

  const availableDays = safeNumber(balance.availableDays, 0);

  if (availableDays <= 0) return;

  /**
   * Evita enviar la misma notificación todos los días.
   */
  if (balance.vacationExpirationReminderSentAt) return;

  const reminderDays = safeNumber(policy?.vacationExpirationReminderDays, 30);

  const today = moment(asOfDate).startOf("day");
  const cycleEnd = moment(balance.cycleEndDate).startOf("day");

  const daysUntilExpiration = cycleEnd.diff(today, "days");

  if (daysUntilExpiration < 0) return;

  if (daysUntilExpiration > reminderDays) return;

  let daysAtRisk = availableDays;

  if (carryOverMode === "LIMITED") {
    const result = calculateCarryOverDays({
      availableDays,
      policy,
    });

    daysAtRisk = result.expiredDays;
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
        userId: user._id,
        availableDays,
        daysAtRisk,
        daysUntilExpiration,
        carryOverMode,
        cycleStartDate: balance.cycleStartDate,
        cycleEndDate: balance.cycleEndDate,
      },
    },
  });

  balance.vacationExpirationReminderSentAt = new Date();
  await balance.save();
};

const processPreviousCycleCarryOver = async ({
  user,
  currentBalance,
  policy,
  asOfDate,
  performedBy,
}: {
  user: any;
  currentBalance: any;
  policy: any;
  asOfDate: Date;
  performedBy?: Types.ObjectId;
}) => {
  if (!currentBalance?.cycleStartDate) return currentBalance;

  const previousBalance = await EmployeeVacationBalance.findOne({
    user: user._id,
    isDeleted: false,
    _id: { $ne: currentBalance._id },
    cycleEndDate: { $lt: currentBalance.cycleStartDate },
    carryOverProcessedAt: null,
  }).sort({ cycleEndDate: -1 });

  if (!previousBalance) return currentBalance;

  const previousAvailableDays = safeNumber(previousBalance.availableDays, 0);

  if (previousAvailableDays <= 0) {
    previousBalance.carryOverProcessedAt = new Date(asOfDate);
    await previousBalance.save();
    return currentBalance;
  }

  const result = calculateCarryOverDays({
    availableDays: previousAvailableDays,
    policy,
  });

  const actor = performedBy || user._id;

  if (result.carryOverDays > 0) {
    currentBalance.carryOverDays =
      safeNumber(currentBalance.carryOverDays, 0) + result.carryOverDays;
  }

  if (result.expiredDays > 0) {
    previousBalance.expiredDays =
      safeNumber(previousBalance.expiredDays, 0) + result.expiredDays;
  }

  previousBalance.carryOverProcessedAt = new Date(asOfDate);

  await previousBalance.save();
  await currentBalance.save();

  if (result.carryOverDays > 0) {
    await VacationBalanceMovement.create({
      balance: currentBalance._id,
      user: user._id,
      company: user.company || null,
      year: currentBalance.year,
      type: "VACATION_CARRY_OVER",
      days: result.carryOverDays,
      previousAvailableDays: 0,
      newAvailableDays: safeNumber(currentBalance.availableDays, 0),
      permissionRequest: null,
      loanRequest: null,
      reason: "Arrastre automático de vacaciones desde el ciclo anterior.",
      performedBy: actor,
      metadata: {
        previousBalance: previousBalance._id,
        carryOverDays: result.carryOverDays,
        expiredDays: result.expiredDays,
        carryOverMode: policy?.vacationCarryOverMode || "NONE",
        processedAt: new Date(asOfDate),
      },
    });
  }

  if (result.expiredDays > 0) {
    await VacationBalanceMovement.create({
      balance: previousBalance._id,
      user: user._id,
      company: user.company || null,
      year: previousBalance.year,
      type: "VACATION_EXPIRED",
      days: result.expiredDays,
      previousAvailableDays,
      newAvailableDays: safeNumber(previousBalance.availableDays, 0),
      permissionRequest: null,
      loanRequest: null,
      reason: "Días de vacaciones vencidos por política de acumulación.",
      performedBy: actor,
      metadata: {
        currentBalance: currentBalance._id,
        expiredDays: result.expiredDays,
        carryOverMode: policy?.vacationCarryOverMode || "NONE",
        processedAt: new Date(asOfDate),
      },
    });
  }

  return currentBalance;
};

export const calculateVacationEntitlement = ({
  hiringDate,
  asOfDate,
  defaultVacationDays = 14,
  seniorityVacationDays = 18,
  seniorityYears = 5,
}: CalculateVacationEntitlementParams) => {
  const hiring = moment(hiringDate).startOf("day");
  const asOf = getStartOfDay(asOfDate);

  const serviceYears = getCompletedYears(hiring, asOf);
  const serviceMonths = getCompletedMonths(hiring, asOf);

  const paymentBaseDays =
    serviceYears >= seniorityYears
      ? seniorityVacationDays
      : defaultVacationDays;

  /**
   * Regla clave:
   * - La base económica puede subir a 18.
   * - Pero los días disfrutables siguen en defaultVacationDays.
   */
  const enjoyableDays = serviceYears >= 1 ? defaultVacationDays : 0;

  const accruedPaymentDays =
    serviceYears >= 1
      ? paymentBaseDays
      : getProportionalPaymentDays({
          hiringDate: hiring,
          asOfDate: asOf,
        });

  const { cycleStartDate, cycleEndDate } = getCurrentCycleDates({
    hiringDate: hiring,
    asOfDate: asOf,
  });

  return {
    serviceYears,
    serviceMonths,
    paymentBaseDays,
    accruedPaymentDays,
    enjoyableDays,
    assignedDays: enjoyableDays,
    cycleStartDate,
    cycleEndDate,
    calculatedAt: asOf.toDate(),
  };
};

export const getApplicableLeavePolicyForUser = async (user: any) => {
  const companyId = user?.company || null;

  if (companyId && Types.ObjectId.isValid(String(companyId))) {
    const companyPolicy = await LeavePolicy.findOne({
      company: companyId,
      isActive: true,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    if (companyPolicy) return companyPolicy;
  }

  return LeavePolicy.findOne({
    company: null,
    isActive: true,
    isDeleted: false,
  }).sort({ createdAt: -1 });
};

export const recalculateEmployeeVacationBalance = async ({
  userId,
  asOfDate,
  performedBy = SYSTEM_PERFORMED_BY,
  createMovement = true,
  processCarryOver = false,
  notifyExpiration = false,
}: RecalculateEmployeeVacationBalanceParams) => {
  const userObjectId = toObjectId(userId);

  const user = await User.findOne({
    _id: userObjectId,
    isDeleted: false,
    isActived: true,
  });

  if (!user) {
    return {
      ok: false,
      message: "Empleado no encontrado o inactivo.",
      balance: null,
    };
  }

  if (!user.hiringDate) {
    return {
      ok: false,
      message: "El empleado no tiene fecha de ingreso.",
      balance: null,
    };
  }

  const policy = await getApplicableLeavePolicyForUser(user);

  const defaultVacationDays = safeNumber(policy?.defaultVacationDays, 14);
  const seniorityVacationDays = safeNumber(policy?.seniorityVacationDays, 18);
  const seniorityYears = safeNumber(policy?.seniorityYears, 5);

  const calculation = calculateVacationEntitlement({
    hiringDate: user.hiringDate,
    asOfDate,
    defaultVacationDays,
    seniorityVacationDays,
    seniorityYears,
  });

  /**
   * Importante:
   * Usamos el año del ciclo, no necesariamente el año calendario actual.
   */
  const year = moment(
    calculation.cycleStartDate || asOfDate || undefined,
  ).year();

  let balance = await EmployeeVacationBalance.findOne({
    user: user._id,
    year,
    isDeleted: false,
  });

  const wasNew = !balance;

  const actor = safeObjectId(performedBy) || user._id;

  if (!balance) {
    balance = new EmployeeVacationBalance({
      user: user._id,
      company: user.company || null,
      year,
      policy: policy?._id || null,

      assignedDays: calculation.assignedDays,
      paymentBaseDays: calculation.paymentBaseDays,
      accruedPaymentDays: calculation.accruedPaymentDays,
      enjoyableDays: calculation.enjoyableDays,

      usedDays: 0,
      adjustmentDays: 0,
      reservedDays: 0,

      carryOverDays: 0,
      expiredDays: 0,
      carryOverProcessedAt: null,
      vacationExpirationReminderSentAt: null,

      serviceMonths: calculation.serviceMonths,
      serviceYears: calculation.serviceYears,
      cycleStartDate: calculation.cycleStartDate,
      cycleEndDate: calculation.cycleEndDate,
      lastCalculatedAt: calculation.calculatedAt,

      createdBy: actor,
      updatedBy: actor,

      isActive: true,
      isDeleted: false,
    });
  }

  const previousAvailableForLoanDays = safeNumber(
    balance.availableForLoanDays,
    0,
  );

  const previousPayableVacationDays = safeNumber(
    balance.payableVacationDays,
    0,
  );

  const previousAccruedPaymentDays = safeNumber(balance.accruedPaymentDays, 0);

  balance.company = user.company || null;
  balance.policy = policy?._id || null;

  /**
   * Este campo representa lo disfrutable.
   * No sube a 18 por antigüedad.
   */
  balance.assignedDays = calculation.assignedDays;
  balance.enjoyableDays = calculation.enjoyableDays;

  /**
   * Estos campos representan pago / liquidación / garantía.
   * Aquí sí puede subir a 18.
   */
  balance.paymentBaseDays = calculation.paymentBaseDays;
  balance.accruedPaymentDays = calculation.accruedPaymentDays;

  balance.serviceMonths = calculation.serviceMonths;
  balance.serviceYears = calculation.serviceYears;
  balance.cycleStartDate = calculation.cycleStartDate;
  balance.cycleEndDate = calculation.cycleEndDate;
  balance.lastCalculatedAt = calculation.calculatedAt;
  balance.updatedBy = actor;

  await balance.save();

  if (processCarryOver && policy) {
    balance = await processPreviousCycleCarryOver({
      user,
      currentBalance: balance,
      policy,
      asOfDate: calculation.calculatedAt,
      performedBy: actor,
    });
  }

  if (notifyExpiration && policy) {
    await notifyVacationExpirationIfNeeded({
      user,
      balance,
      policy,
      asOfDate: calculation.calculatedAt,
    });
  }

  const accruedChanged =
    previousAccruedPaymentDays !== safeNumber(balance?.accruedPaymentDays, 0);

  const payableChanged =
    previousPayableVacationDays !== safeNumber(balance?.payableVacationDays, 0);

  const loanAvailableChanged =
    previousAvailableForLoanDays !==
    safeNumber(balance?.availableForLoanDays, 0);

  if (
    createMovement &&
    (wasNew || accruedChanged || payableChanged || loanAvailableChanged)
  ) {
    await VacationBalanceMovement.create({
      balance: balance?._id,
      user: user._id,
      company: user.company || null,
      year,
      type: wasNew ? "INITIAL_ASSIGNMENT" : "VACATION_ACCRUAL_RECALCULATION",
      days: safeNumber(balance?.accruedPaymentDays, 0),
      previousAvailableDays: previousAvailableForLoanDays,
      newAvailableDays: safeNumber(balance?.availableForLoanDays, 0),
      permissionRequest: null,
      loanRequest: null,
      reason: wasNew
        ? "Balance inicial de vacaciones generado automáticamente."
        : "Recalculo automático de vacaciones causadas para pago/préstamo.",
      performedBy: actor,
      metadata: {
        source: "DAILY_CRON",
        assignedDays: balance?.assignedDays,
        enjoyableDays: balance?.enjoyableDays,
        paymentBaseDays: balance?.paymentBaseDays,
        accruedPaymentDays: balance?.accruedPaymentDays,
        carryOverDays: balance?.carryOverDays,
        expiredDays: balance?.expiredDays,
        availableDays: balance?.availableDays,
        availableForLoanDays: balance?.availableForLoanDays,
        payableVacationDays: balance?.payableVacationDays,
        netPayableVacationDays: balance?.netPayableVacationDays,
        serviceMonths: balance?.serviceMonths,
        serviceYears: balance?.serviceYears,
        cycleStartDate: balance?.cycleStartDate,
        cycleEndDate: balance?.cycleEndDate,
        lastCalculatedAt: balance?.lastCalculatedAt,
      },
    });
  }

  return {
    ok: true,
    message: "Balance recalculado correctamente.",
    balance,
  };
};

export const recalculateVacationBalancesForAllActiveEmployees = async ({
  asOfDate,
  createMovement = true,
  processCarryOver = true,
  notifyExpiration = true,
}: {
  asOfDate?: string | Date;
  createMovement?: boolean;
  processCarryOver?: boolean;
  notifyExpiration?: boolean;
}) => {
  const cursor = User.find({
    isDeleted: false,
    isActived: true,
    hiringDate: { $exists: true, $ne: "" },
  })
    .select("_id name company hiringDate isDeleted isActived")
    .cursor();

  let processed = 0;
  let updated = 0;
  let failed = 0;

  for await (const user of cursor) {
    processed += 1;

    try {
      const result = await recalculateEmployeeVacationBalance({
        userId: user._id,
        asOfDate,
        performedBy: null,
        createMovement,
        processCarryOver,
        notifyExpiration,
      });

      if (result.ok) updated += 1;
      else failed += 1;
    } catch (error) {
      failed += 1;

      console.error("[VacationBalanceAccrual] Error recalculando empleado:", {
        userId: user._id,
        error,
      });
    }
  }

  return {
    ok: true,
    processed,
    updated,
    failed,
  };
};
