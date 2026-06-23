import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import User from "../../../model/account/user";
import VacationDayReservation from "../../../model/vacation/VacationDayReservation";
import VacationBalanceMovement from "../../../model/vacation/VacationBalanceMovement";
import EmployeeVacationBalance from "../../../model/vacation/EmployeeVacationBalance";
import LeavePolicy from "../../../model/leavePolicy";
import moment from "moment";
import {
  calculateVacationEntitlement,
  getApplicableLeavePolicyForUser,
  recalculateEmployeeVacationBalance,
} from "../../../services/vacation/vacationBalanceAccrual.service";

const getQueryString = (value: unknown): string => {
  if (Array.isArray(value)) return String(value[0] || "").trim();
  if (typeof value === "string") return value.trim();
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const getAuthUserId = (req: Request): Types.ObjectId | null => {
  const authUser = (req as any).user;

  const rawId =
    authUser?._id || authUser?.id || authUser?.uid || (req as any).uid || null;

  if (!rawId || !Types.ObjectId.isValid(String(rawId))) {
    return null;
  }

  return new Types.ObjectId(String(rawId));
};

const getCurrentYear = () => new Date().getFullYear();

const getValidYear = (value: unknown) => {
  const rawValue = getQueryString(value);

  if (!rawValue) return getCurrentYear();

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
    return null;
  }

  return parsed;
};

const getEmployeeCompanyId = (user: any): Types.ObjectId | null => {
  const company = user?.company;

  if (!company) return null;

  const companyId = company?._id || company;

  if (!Types.ObjectId.isValid(String(companyId))) return null;

  return new Types.ObjectId(String(companyId));
};

const getSeniorityYears = (hiringDate?: string) => {
  if (!hiringDate) return 0;

  const start = new Date(hiringDate);

  if (Number.isNaN(start.getTime())) return 0;

  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();

  const hasNotReachedAnniversary =
    now.getMonth() < start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() < start.getDate());

  if (hasNotReachedAnniversary) {
    years -= 1;
  }

  return Math.max(years, 0);
};

const findApplicablePolicy = async (companyId: Types.ObjectId | null) => {
  if (companyId) {
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

const calculateAssignedDays = (user: any, policy: any) => {
  const defaultDays = Number(policy?.defaultDays || 14);
  const seniorityDays = Number(policy?.seniorityDays || defaultDays);
  const seniorityYears = Number(policy?.seniorityYears || 5);

  const employeeYears = getSeniorityYears(user?.hiringDate);

  if (employeeYears >= seniorityYears) {
    return seniorityDays;
  }

  return defaultDays;
};

const recalculateBalance = (balance: any) => {
  const enjoyableBase =
    Number(balance.enjoyableDays || 0) +
    Number(balance.carryOverDays || 0) +
    Number(balance.adjustmentDays || 0);

  const paymentBase =
    Number(balance.accruedPaymentDays || 0) +
    Number(balance.carryOverDays || 0) +
    Number(balance.adjustmentDays || 0);

  const usedDays = Number(balance.usedDays || 0);
  const reservedDays = Number(balance.reservedDays || 0);

  /**
   * Las reservas de préstamo son una garantía económica.
   * No bloquean el disfrute normal de las vacaciones.
   */
  balance.availableDays = Math.max(0, enjoyableBase - usedDays);

  /**
   * Las reservas sí reducen la capacidad de garantizar otro préstamo.
   */
  balance.availableForLoanDays = Math.max(
    0,
    paymentBase - usedDays - reservedDays,
  );

  /**
   * El bruto pagable no descuenta garantías activas.
   */
  balance.payableVacationDays = Math.max(0, paymentBase - usedDays);

  /**
   * El neto pagable sí toma en cuenta la garantía comprometida.
   */
  balance.netPayableVacationDays = Math.max(
    0,
    paymentBase - usedDays - reservedDays,
  );

  return balance;
};

const getVacationSummaryPayload = (balance: any) => {
  const availableDays = Number(balance?.availableDays || 0);
  const availableForLoanDays = Number(balance?.availableForLoanDays || 0);
  const accruedPaymentDays = Number(balance?.accruedPaymentDays || 0);
  const enjoyableDays = Number(balance?.enjoyableDays || 0);
  const usedDays = Number(balance?.usedDays || 0);
  const reservedDays = Number(balance?.reservedDays || 0);
  const payableVacationDays = Number(balance?.payableVacationDays || 0);
  const netPayableVacationDays = Number(balance?.netPayableVacationDays || 0);
  const serviceMonths = Number(balance?.serviceMonths || 0);
  const serviceYears = Number(balance?.serviceYears || 0);

  return {
    serviceMonths,
    serviceYears,

    canEnjoyVacations: serviceYears >= 1 && availableDays > 0,
    canUseVacationForLoan: availableForLoanDays > 0,

    availableDays,
    availableForLoanDays,
    accruedPaymentDays,
    enjoyableDays,
    usedDays,
    reservedDays,
    payableVacationDays,
    netPayableVacationDays,

    cycleStartDate: balance?.cycleStartDate || null,
    cycleEndDate: balance?.cycleEndDate || null,
    lastCalculatedAt: balance?.lastCalculatedAt || null,
  };
};

const getEmployeeVacationSummary = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const refresh = String(req.query.refresh || "false") === "true";

    const selectedYearRaw = String(req.query.year || new Date().getFullYear());

    const selectedYear = Number(selectedYearRaw);

    if (!Types.ObjectId.isValid(String(userId))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID del empleado no es válido.",
        message: "Invalid employee ID.",
      });
    }

    if (
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000 ||
      selectedYear > 2100
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "El año no es válido.",
        message: "Invalid year.",
      });
    }

    const employee = await User.findOne({
      _id: userId,
      isDeleted: false,
    })
      .select("-password")
      .populate("company", "legalName commercialName name code")
      .populate("department")
      .populate("jobPosition")
      .populate("project");

    if (!employee) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró el empleado.",
        message: "Employee not found.",
      });
    }

    if (!employee.hiringDate) {
      return res.status(400).json({
        ok: false,
        mensaje: "El empleado no tiene fecha de ingreso registrada.",
        message: "Employee does not have hiring date.",
      });
    }

    const performedBy =
      getAuthUserId(req) || new Types.ObjectId(String(employee._id));

    const currentYear = new Date().getFullYear();

    /**
     * Si el año seleccionado es el año actual, calculamos al día de hoy.
     * Si es un año pasado, calculamos al cierre de ese año.
     *
     * Esto permite ver histórico sin forzar que todo sea el año actual.
     */
    const asOfDate =
      selectedYear === currentYear
        ? new Date()
        : moment(`${selectedYear}-12-31`, "YYYY-MM-DD").endOf("day").toDate();

    const policy = await getApplicableLeavePolicyForUser(employee);

    const defaultVacationDays = Number(policy?.defaultVacationDays || 14);
    const seniorityVacationDays = Number(policy?.seniorityVacationDays || 18);
    const seniorityYears = Number(policy?.seniorityYears || 5);

    /**
     * Esta es la clave:
     * Calculamos el ciclo igual que el servicio, para saber cuál balance.year
     * corresponde realmente al periodo que queremos ver.
     */
    const calculation = calculateVacationEntitlement({
      hiringDate: employee.hiringDate,
      asOfDate,
      defaultVacationDays,
      seniorityVacationDays,
      seniorityYears,
    });

    const targetBalanceYear = moment(
      calculation.cycleStartDate || asOfDate,
    ).year();

    let balance: any = await EmployeeVacationBalance.findOne({
      user: userId,
      year: targetBalanceYear,
      isDeleted: false,
    }).sort({
      updatedAt: -1,
    });

    /**
     * Si no hay balance o si RRHH presiona recalcular:
     * usamos el servicio real que también usa el cronjob.
     */
    if (!balance || refresh) {
      const result = await recalculateEmployeeVacationBalance({
        userId,
        asOfDate,
        performedBy,
        createMovement: true,
        processCarryOver: true,
        notifyExpiration: false,
      });

      if (!result.ok || !result.balance) {
        return res.status(400).json({
          ok: false,
          mensaje:
            result.message || "No se pudo calcular el balance de vacaciones.",
          message:
            result.message || "Vacation balance could not be calculated.",
        });
      }

      /**
       * Muy importante:
       * NO confíes solo en result.balance en memoria.
       * Busca otra vez desde BD usando el _id que el servicio guardó.
       */
      balance = await EmployeeVacationBalance.findById(result.balance._id);
    }

    if (!balance) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró el balance de vacaciones.",
        message: "Vacation balance not found.",
      });
    }

    const populatedBalance = await EmployeeVacationBalance.findById(balance._id)
      .populate("user", "name email img")
      .populate("company", "legalName commercialName name code")
      .populate("policy")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!populatedBalance) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró el balance de vacaciones.",
        message: "Vacation balance not found.",
      });
    }

    const movements = await VacationBalanceMovement.find({
      balance: populatedBalance._id,
    })
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(50);

    const reservations = await VacationDayReservation.find({
      balance: populatedBalance._id,
      isDeleted: false,
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      ok: true,
      employee,
      balance: populatedBalance,
      summary: getVacationSummaryPayload(populatedBalance),
      movements,
      reservations,
      meta: {
        selectedYear,
        targetBalanceYear,
        asOfDate,
        cycleStartDate: calculation.cycleStartDate,
        cycleEndDate: calculation.cycleEndDate,
        refreshed: refresh,
      },
      mensaje: refresh
        ? "Balance de vacaciones recalculado con éxito"
        : "Balance de vacaciones encontrado con éxito",
      message: refresh
        ? "Vacation balance recalculated successfully"
        : "Vacation balance found successfully",
    });
  } catch (error) {
    console.log("getEmployeeVacationSummary error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const getEmployeeVacationMovements = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const year = getValidYear(req.query.year);

    if (!Types.ObjectId.isValid(String(userId))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID del empleado no es válido.",
        message: "Invalid employee ID.",
      });
    }

    if (!year) {
      return res.status(400).json({
        ok: false,
        mensaje: "El año no es válido.",
        message: "Invalid year.",
      });
    }

    const movements = await VacationBalanceMovement.find({
      user: userId,
      year,
    })
      .populate("balance")
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      movements,
      mensaje: "Movimientos encontrados con éxito",
      message: "Vacation movements found successfully",
    });
  } catch (error) {
    console.log("getEmployeeVacationMovements error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const manualAdjustment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { balanceId } = req.params;
    const { days, reason } = req.body;

    if (!Types.ObjectId.isValid(String(balanceId))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID del balance no es válido.",
        message: "Invalid balance ID.",
      });
    }

    const parsedDays = Number(days);

    if (!Number.isFinite(parsedDays) || parsedDays === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "La cantidad de días debe ser diferente de 0.",
        message: "Days must be different from 0.",
      });
    }

    const normalizedReason = String(reason || "").trim();

    if (!normalizedReason) {
      return res.status(400).json({
        ok: false,
        mensaje: "El motivo del ajuste es obligatorio.",
        message: "Adjustment reason is required.",
      });
    }

    const performedBy = getAuthUserId(req);

    if (!performedBy) {
      return res.status(401).json({
        ok: false,
        mensaje: "No autorizado.",
        message: "Unauthorized.",
      });
    }

    let updatedBalance: any;
    let movement: any;

    await session.withTransaction(async () => {
      const balance = await EmployeeVacationBalance.findOne({
        _id: balanceId,
        isDeleted: false,
      }).session(session);

      if (!balance) {
        throw {
          statusCode: 404,
          mensaje: "No se encontró el balance de vacaciones.",
          message: "Vacation balance not found.",
        };
      }

      const employee = await User.findById(balance.user).session(session);

      if (!employee) {
        throw {
          statusCode: 404,
          mensaje: "No se encontró el empleado.",
          message: "Employee not found.",
        };
      }

      const policy = await findApplicablePolicy(getEmployeeCompanyId(employee));

      const previousAvailableDays = Number(balance.availableDays || 0);

      balance.adjustmentDays = Number(balance.adjustmentDays || 0) + parsedDays;
      balance.hasManualOverride = true;
      balance.notes = normalizedReason;
      balance.updatedBy = performedBy;

      recalculateBalance(balance);

      if (
        policy &&
        policy.allowNegativeBalance === false &&
        Number(balance.availableDays || 0) < 0
      ) {
        throw {
          statusCode: 400,
          mensaje:
            "El ajuste dejaría el balance disponible en negativo y la política no lo permite.",
          message:
            "Adjustment would leave available balance negative and policy does not allow it.",
        };
      }

      await balance.save({ session });

      const movements = await VacationBalanceMovement.create(
        [
          {
            balance: balance._id,
            user: balance.user,
            company: balance.company || null,
            year: balance.year,
            type: "MANUAL_ADJUSTMENT",
            days: parsedDays,
            previousAvailableDays,
            newAvailableDays: balance.availableDays,
            reason: normalizedReason,
            performedBy,
            metadata: {
              adjustmentDays: balance.adjustmentDays,
            },
          },
        ],
        { session },
      );

      movement = movements[0];
      updatedBalance = balance;
    });

    const populatedBalance = await EmployeeVacationBalance.findById(
      updatedBalance._id,
    )
      .populate("user", "name email img")
      .populate("company", "legalName commercialName name code")
      .populate("policy")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    return res.status(200).json({
      ok: true,
      balance: populatedBalance,
      movement,
      mensaje: "Ajuste manual aplicado con éxito",
      message: "Manual adjustment applied successfully",
    });
  } catch (error: any) {
    console.log("manualAdjustment error:", error);

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
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  } finally {
    session.endSession();
  }
};

const getMyVacationSummary = async (req: Request, res: Response) => {
  try {
    const authUserId = getAuthUserId(req);

    if (!authUserId) {
      return res.status(401).json({
        ok: false,
        mensaje: "No autorizado.",
        message: "Unauthorized.",
      });
    }

    const refresh = String(req.query.refresh || "false") === "true";

    const employee = await User.findOne({
      _id: authUserId,
      isDeleted: false,
    })
      .select("-password")
      .populate("company", "legalName commercialName name code")
      .populate("department")
      .populate("jobPosition")
      .populate("project");

    if (!employee) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró el empleado.",
        message: "Employee not found.",
      });
    }

    if (!employee.hiringDate) {
      return res.status(400).json({
        ok: false,
        mensaje: "El empleado no tiene fecha de ingreso registrada.",
        message: "Employee does not have hiring date.",
      });
    }

    const asOfDate = new Date();

    /**
     * Buscamos la política igual que el servicio de recálculo.
     */
    const policy = await getApplicableLeavePolicyForUser(employee);

    const defaultVacationDays = Number(policy?.defaultVacationDays || 14);
    const seniorityVacationDays = Number(policy?.seniorityVacationDays || 18);
    const seniorityYears = Number(policy?.seniorityYears || 5);

    /**
     * Clave:
     * Calculamos el ciclo actual igual que recalculateEmployeeVacationBalance.
     * Así sabemos cuál balance.year debe leerse realmente.
     */
    const calculation = calculateVacationEntitlement({
      hiringDate: employee.hiringDate,
      asOfDate,
      defaultVacationDays,
      seniorityVacationDays,
      seniorityYears,
    });

    const targetBalanceYear = moment(
      calculation.cycleStartDate || asOfDate,
    ).year();

    /**
     * No buscamos "cualquier balance".
     * Buscamos exactamente el balance del ciclo actual.
     */
    let balance: any = await EmployeeVacationBalance.findOne({
      user: authUserId,
      year: targetBalanceYear,
      isDeleted: false,
    }).sort({
      updatedAt: -1,
    });

    /**
     * Si no existe o si el empleado fuerza refresh,
     * recalculamos usando el mismo servicio del cronjob.
     */
    if (!balance || refresh) {
      const result = await recalculateEmployeeVacationBalance({
        userId: authUserId,
        asOfDate,
        performedBy: authUserId,

        /**
         * true para que si hay cambio, el servicio cree movimiento.
         * El servicio ya valida si realmente cambió algo.
         */
        createMovement: true,

        /**
         * Para el endpoint del empleado puedes dejarlo false si no quieres
         * que abrir el perfil procese arrastres.
         *
         * Si quieres que el botón "Actualizar balance" del empleado también
         * procese arrastres, cámbialo a true.
         */
        processCarryOver: false,

        /**
         * Las notificaciones deben quedarse en el cronjob.
         */
        notifyExpiration: false,
      });

      if (!result.ok || !result.balance) {
        return res.status(400).json({
          ok: false,
          mensaje:
            result.message || "No se pudo calcular el balance de vacaciones.",
          message:
            result.message || "Vacation balance could not be calculated.",
        });
      }

      /**
       * Muy importante:
       * Después de recalcular, buscamos de nuevo desde BD.
       * No dependemos del objeto en memoria.
       */
      balance = await EmployeeVacationBalance.findById(result.balance._id);
    }

    if (!balance) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró el balance de vacaciones.",
        message: "Vacation balance not found.",
      });
    }

    const populatedBalance = await EmployeeVacationBalance.findById(balance._id)
      .populate("user", "name email img")
      .populate("company", "legalName commercialName name code")
      .populate("policy")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!populatedBalance) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró el balance de vacaciones.",
        message: "Vacation balance not found.",
      });
    }

    const movements = await VacationBalanceMovement.find({
      balance: populatedBalance._id,
    })
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      ok: true,
      employee,
      balance: populatedBalance,
      summary: getVacationSummaryPayload(populatedBalance),
      movements,
      meta: {
        targetBalanceYear,
        asOfDate,
        cycleStartDate: calculation.cycleStartDate,
        cycleEndDate: calculation.cycleEndDate,
        refreshed: refresh,
      },
      mensaje: refresh
        ? "Balance de vacaciones recalculado con éxito"
        : "Balance de vacaciones encontrado con éxito",
      message: refresh
        ? "Vacation balance recalculated successfully"
        : "Vacation balance found successfully",
    });
  } catch (error) {
    console.log("getMyVacationSummary error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

export {
  getEmployeeVacationSummary,
  getEmployeeVacationMovements,
  manualAdjustment,
  getMyVacationSummary,
};