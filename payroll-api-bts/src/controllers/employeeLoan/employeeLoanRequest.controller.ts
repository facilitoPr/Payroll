import { Response } from "express";
import mongoose, { Types } from "mongoose";

import User from "../../model/account/user";
import EmployeeLoanRequest from "../../model/employeeLoan/employeeLoanRequest";
import EmployeeVacationBalance from "../../model/vacation/EmployeeVacationBalance";
import EmployeeLoanRequestHistory from "../../model/employeeLoan/employeeLoanRequestHistory";
import VacationDayReservation from "../../model/vacation/VacationDayReservation";
import { resolveEmployeeLoanGuaranteeSource } from "../../model/employeeLoan/employeeLoanProductConfig";

import { escapeRegex, round2, toNum } from "../../helper/parse";
import { getQueryString } from "../../helper/request/request.query";
import { AuthRequest } from "../../middlewares/validate-jwt";
import { toObjectId, toObjectIdOrNull } from "../../helper/objectIds";
import {
  getActiveEmployeeLoanProductConfigOrThrow,
  getEmployeeLoanPolicyOrThrow,
  loadEmployeeForLoan,
  releaseVacationLoanReservation,
  reserveVacationDaysForLoan,
} from "../../services/employeeLoan/employeeLoanRequest.service";
import {
  buildChristmasSalaryGuaranteeEligibility,
  buildEmployeeLoanQuoteContext,
  buildExternalPayloadPreview,
  buildSalarySnapshot,
  calculateEffectiveMaxGuaranteeDays,
} from "../../helper/employeeLoan/loanRequest/employeeLoanRequest.build";
import { recalculateEmployeeVacationBalance } from "../../services/vacation/vacationBalanceAccrual.service";
import { buildPublicLoanProductConfigResponse } from "../../helper/employeeLoan/productConfig/employeeLoanProductConfig.validation";
import { getCurrentYear } from "../../helper/date";
import {
  calculateMaxGuaranteeDays,
  calculateVacationGuaranteeAmount,
  recalculateVacationBalance,
} from "../../helper/employeeLoan/loanRequest/employeeLoanRequest.calculate";
import { PRODUCT_CONFIG_SOURCE } from "../../constants/loan";
import {
  generateEmployeeLoanContractSnapshot,
  getUploadedFileFromRequest,
  getUploadedFileUrlFromRequest,
} from "../../helper/employeeLoan/loanRequest/employeeLoanContractDocument";
import { getEmployeeLoanPaymentScheduleInfo } from "../../helper/employeeLoan/loanRequest/employeeLoanPaymentSchedule";

const normalizeStatuses = (raw: any): string[] => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .flatMap((value) => String(value).split(","))
      .map((status) => status.trim().toUpperCase())
      .filter(Boolean);
  }

  return String(raw)
    .split(",")
    .map((status) => status.trim().toUpperCase())
    .filter(Boolean);
};

const getEmployeeCompanyId = (employee: any): Types.ObjectId | null => {
  const company = employee?.company;

  if (!company) return null;

  const companyId = company?._id || company;

  if (!Types.ObjectId.isValid(String(companyId))) return null;

  return new Types.ObjectId(String(companyId));
};

const generateLoanRequestNumber = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const time = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  const random = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");

  return `EL-${year}${month}${day}-${time}-${random}`;
};

const createLoanHistory = async ({
  loanRequest,
  action,
  fromStatus = null,
  toStatus = null,
  comment = "",
  source = "SYSTEM",
  performedBy = null,
  previousData = {},
  newData = {},
  metadata = {},
  session,
}: {
  loanRequest: any;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  comment?: string;
  source?: string;
  performedBy?: any;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  metadata?: Record<string, any>;
  session?: mongoose.ClientSession;
}) => {
  await EmployeeLoanRequestHistory.create(
    [
      {
        loanRequest,
        action,
        fromStatus,
        toStatus,
        comment,
        source,
        performedBy,
        previousData,
        newData,
        metadata,
      },
    ],
    { session },
  );
};

const populateLoanRequestQuery = (query: any) => {
  return query
    .populate(
      "employee",
      "name email phone img company department jobPosition project employmentStatus terminationDate terminationInfo",
    )
    .populate("company", "legalName commercialName name code")
    .populate("department", "name code")
    .populate("jobPosition", "name code")
    .populate("project", "name code")
    .populate("policy", "name code allowEmployeeLoanRequests")
    .populate("vacationReservation")
    .populate(
      "terminationSettlement.termination",
      "terminationType reason terminationDate status paidAt employeeSnapshot calculation.netTotal loanSnapshot.totalDeducted loanSnapshot.remainingOutstanding",
    )
    .populate(
      "terminationSettlement.terminationPayment",
      "amount paymentDate paymentMethod status referenceNumber bankAuthorizationNumber loanPayrollPendingCount loanPayrollPendingTotal",
    )
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");
};

const getRoleCode = (user: any) => {
  return String(user?.rol?.code || user?.role?.code || user?.rol || user?.role || "")
    .trim()
    .toUpperCase();
};

const getDepartmentCode = (user: any) => {
  return String(user?.department?.code || user?.departmentCode || "")
    .trim()
    .toUpperCase();
};

const canManageEmployeeLoans = (user: any) => {
  const roleCode = getRoleCode(user);
  const departmentCode = getDepartmentCode(user);

  return Boolean(
    user?.isSuperAdmin ||
      ["SUPERADMIN", "SUPER_ADMIN", "ADMIN", "RRHH", "HR"].includes(
        roleCode,
      ) ||
      ["RRHH", "HR", "HUMAN_RESOURCES"].includes(departmentCode),
  );
};

const getActiveLoanInstallments = (loanRequest: any) => {
  const schedule = Array.isArray(loanRequest?.amortizationSchedule)
    ? loanRequest.amortizationSchedule
    : [];

  return schedule.filter((installment: any) =>
    ["PENDING", "SKIPPED"].includes(
      String(installment?.status || "").toUpperCase(),
    ),
  );
};

const getPaidLoanInstallments = (loanRequest: any) => {
  const schedule = Array.isArray(loanRequest?.amortizationSchedule)
    ? loanRequest.amortizationSchedule
    : [];

  return schedule.filter(
    (installment: any) =>
      String(installment?.status || "").toUpperCase() === "PAID",
  );
};

const sumInstallments = (installments: any[], key: string) => {
  return round2(
    installments.reduce((sum, installment) => {
      return sum + toNum(installment?.[key], 0);
    }, 0),
  );
};

const getAdminCancelAvailability = (loanRequest: any) => {
  const status = String(loanRequest?.status || "").toUpperCase();
  const paidInstallments = getPaidLoanInstallments(loanRequest);

  if (["CANCELLED", "CLOSED", "TERMINATED"].includes(status)) {
    return {
      canCancel: false,
      reason:
        "El préstamo ya está cancelado, cerrado o asociado a una desvinculación.",
    };
  }

  if (paidInstallments.length > 0) {
    return {
      canCancel: false,
      reason:
        "El préstamo ya tiene cuotas pagadas. No se puede cancelar sin reversar pagos.",
    };
  }

  return {
    canCancel: true,
    reason: "",
  };
};

const buildLoanManagementSummary = (loanRequest: any) => {
  const raw =
    typeof loanRequest?.toObject === "function"
      ? loanRequest.toObject()
      : loanRequest || {};

  const schedule = Array.isArray(raw.amortizationSchedule)
    ? raw.amortizationSchedule
    : [];
  const pendingInstallments = getActiveLoanInstallments(raw);
  const paidInstallments = getPaidLoanInstallments(raw);
  const cancelledInstallments = schedule.filter((installment: any) =>
    ["CANCELLED"].includes(String(installment?.status || "").toUpperCase()),
  );

  const now = new Date();
  const overdueInstallments = pendingInstallments.filter((installment: any) => {
    if (!installment?.dueDate) return false;
    return new Date(installment.dueDate).getTime() < now.getTime();
  });

  const sortedPending = [...pendingInstallments].sort((a: any, b: any) => {
    return (
      new Date(a?.dueDate || 0).getTime() -
      new Date(b?.dueDate || 0).getTime()
    );
  });

  const status = String(raw.status || "").toUpperCase();
  const terminationSettlement = raw.terminationSettlement || {};

  const scheduleOutstanding = sumInstallments(
    pendingInstallments,
    "paymentAmount",
  );

  let outstandingAmount = scheduleOutstanding;

  if (status === "TERMINATED" && terminationSettlement?.isTerminated) {
    outstandingAmount = round2(
      toNum(
        terminationSettlement.remainingOutstanding,
        Math.max(
          0,
          toNum(terminationSettlement.totalOutstandingAtTermination, 0) -
            toNum(terminationSettlement.amountDeducted, 0),
        ),
      ),
    );
  }

  if (status === "CLOSED" || status === "CANCELLED") {
    outstandingAmount = 0;
  }

  const contractSnapshot = raw.contractSnapshot || {};
  const adminCancel = getAdminCancelAvailability(raw);

  return {
    installments: {
      total: schedule.length,
      pending: pendingInstallments.length,
      paid: paidInstallments.length,
      cancelled: cancelledInstallments.length,
      overdue: overdueInstallments.length,
      pendingAmount: outstandingAmount,
      scheduledPendingAmount: scheduleOutstanding,
      paidAmount: sumInstallments(paidInstallments, "paymentAmount"),
      overdueAmount: sumInstallments(overdueInstallments, "paymentAmount"),
      nextDueDate: sortedPending[0]?.dueDate || null,
    },

    amounts: {
      requestedAmount: round2(raw.requestedAmount || 0),
      approvedAmount: round2(raw.approvedAmount || raw.requestedAmount || 0),
      totalToPay: round2(raw.loanQuoteSnapshot?.totalToPay || 0),
      totalInterest: round2(raw.loanQuoteSnapshot?.totalInterest || 0),
      outstandingAmount,
    },

    contract: {
      generationStatus: contractSnapshot.generationStatus || "NOT_GENERATED",
      templateName: contractSnapshot.templateName || "",
      templateVersion: contractSnapshot.templateVersion || "",
      acceptedAt: contractSnapshot.acceptedAt || null,
      signedAt: contractSnapshot.signedAt || null,
      signatureName: contractSnapshot.signatureName || "",
      generatedPdfUrl: contractSnapshot.generatedPdfUrl || "",
      generatedDocxUrl: contractSnapshot.generatedDocxUrl || "",
      generatedPdfFileName: contractSnapshot.generatedPdfFileName || "",
      generatedDocxFileName: contractSnapshot.generatedDocxFileName || "",
    },

    terminationSettlement: {
      isTerminated: Boolean(terminationSettlement?.isTerminated),
      termination: terminationSettlement?.termination || null,
      terminationPayment: terminationSettlement?.terminationPayment || null,
      terminationDate: terminationSettlement?.terminationDate || null,
      settledAt: terminationSettlement?.settledAt || null,
      statusBeforeTermination:
        terminationSettlement?.statusBeforeTermination || "",
      totalOutstandingAtTermination: round2(
        terminationSettlement?.totalOutstandingAtTermination || 0,
      ),
      amountDeducted: round2(terminationSettlement?.amountDeducted || 0),
      remainingOutstanding: round2(
        terminationSettlement?.remainingOutstanding || 0,
      ),
      pendingInstallmentsAtTermination: Number(
        terminationSettlement?.pendingInstallmentsAtTermination || 0,
      ),
      pendingInstallmentNumbers:
        terminationSettlement?.pendingInstallmentNumbers || [],
      paymentMethod: terminationSettlement?.paymentMethod || "",
      notes: terminationSettlement?.notes || "",
    },

    actions: {
      canAdminCancel: adminCancel.canCancel,
      adminCancelReason: adminCancel.reason,
    },
  };
};

const buildLoanRequestDetailPayload = (loanRequest: any) => {
  const payload =
    typeof loanRequest?.toObject === "function"
      ? loanRequest.toObject()
      : { ...(loanRequest || {}) };

  return {
    ...payload,
    managementSummary: buildLoanManagementSummary(payload),
  };
};

const getMyEmployeeLoanEligibility = async (
  req: AuthRequest,
  res: Response,
) => {
  const session = await mongoose.startSession();

  try {
    const authUserId = req.uid;

    const year = toNum(req.query.year, getCurrentYear());

    const employee = await loadEmployeeForLoan({
      authUserId,
      session,
    });

    if (!employee) {
      return res.status(404).json({
        ok: false,
        mensaje: "Empleado no encontrado.",
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

    const companyId = getEmployeeCompanyId(employee);

    const policy = await getEmployeeLoanPolicyOrThrow({
      companyId,
      session,
    });

    const productConfig =
      await getActiveEmployeeLoanProductConfigOrThrow(session);

    const salarySnapshot = buildSalarySnapshot(employee);
    const paymentScheduleInfo = getEmployeeLoanPaymentScheduleInfo(
      employee,
      salarySnapshot.paymentFrequencyName,
    );

    if (salarySnapshot.monthlySalary <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se encontró un sueldo válido para calcular el préstamo.",
        message: "No valid salary found to calculate loan eligibility.",
      });
    }

    const performedByObjectId = toObjectId(String(authUserId));

    if (!performedByObjectId) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de usuario no es válido.",
        message: "Invalid user ID.",
      });
    }

    const guaranteeSource = resolveEmployeeLoanGuaranteeSource(productConfig);

    if (guaranteeSource === "CHRISTMAS_SALARY") {
      const guarantee = await buildChristmasSalaryGuaranteeEligibility({
        employee,
        companyId,
        productConfig,
        year,
        session,
      });

      const minLoanAmount = Number(productConfig.minLoanAmount || 0);
      const canRequestLoan =
        paymentScheduleInfo.supported &&
        guarantee.blockedReasons.length === 0 &&
        guarantee.maxAllowedLoanAmount >= minLoanAmount;

      return res.status(200).json({
        ok: true,
        employee,
        policy,
        productConfig,
        productRules: buildPublicLoanProductConfigResponse(productConfig),
        salarySnapshot,
        paymentSchedule: paymentScheduleInfo,
        vacationBalance: null,
        vacationSummary: {
          serviceMonths: 0,
          serviceYears: 0,
          canEnjoyVacations: false,
          canUseVacationForLoan: false,
          enjoyableDays: 0,
          availableDays: 0,
          accruedPaymentDays: 0,
          availableForLoanDays: 0,
          payableVacationDays: 0,
          netPayableVacationDays: 0,
          usedDays: 0,
          reservedDays: 0,
          adjustmentDays: 0,
          cycleStartDate: null,
          cycleEndDate: null,
          lastCalculatedAt: null,
        },
        eligibility: {
          maxBySalary: 0,
          maxGuaranteeDaysByPercent: 0,
          maxGuaranteeDays: 0,
          maxGuaranteeAmount: guarantee.maxAllowedLoanAmount,
          maxAllowedAmount: guarantee.maxAllowedLoanAmount,
          vacationDayAmount: 0,
          minimumGuaranteeDaysByAmount: 0,
          canRequestLoan,
          paymentScheduleSupported: paymentScheduleInfo.supported,
          paymentFrequency: paymentScheduleInfo.normalizedFrequency,
          paymentFrequencyCode: paymentScheduleInfo.frequencyCode,
          paymentFrequencyLabel: paymentScheduleInfo.frequencyLabel,
          paymentDays: paymentScheduleInfo.paymentDays,
          monthlyPaymentDay: paymentScheduleInfo.monthlyPaymentDay,
          paymentScheduleMessage: paymentScheduleInfo.message,
          maxVacationGuaranteeDays: 0,
          hasFixedVacationGuaranteeDaysLimit: false,
          minimumVacationDaysRequired: 0,
          minLoanAmount,
          maxLoanAmount: Number(productConfig.maxLoanAmount || 0),
          minInstallments: Number(productConfig.minInstallments || 1),
          maxInstallments: Number(productConfig.maxInstallments || 1),
          availableForLoanDays: 0,
          accruedPaymentDays: 0,
          payableVacationDays: 0,
          netPayableVacationDays: 0,
          productConfigSource: productConfig?._source || PRODUCT_CONFIG_SOURCE,
        },
        guarantee,
        meta: {
          year,
          recalculated: false,
          recalculatedAt: new Date(),
        },
        mensaje: "Elegibilidad calculada correctamente.",
        message: "Eligibility calculated successfully.",
      });
    }

    const vacationResult = await recalculateEmployeeVacationBalance({
      userId: String(authUserId),
      asOfDate: new Date(),
      performedBy: performedByObjectId,
      createMovement: true,
      processCarryOver: true,
      notifyExpiration: false,
    });

    if (!vacationResult.ok || !vacationResult.balance) {
      return res.status(400).json({
        ok: false,
        mensaje:
          vacationResult.message ||
          "No se pudo calcular el balance de vacaciones.",
        message:
          vacationResult.message || "Vacation balance could not be calculated.",
      });
    }

    const balance = await EmployeeVacationBalance.findById(
      vacationResult.balance._id,
    )
      .populate("policy")
      .session(session);

    if (!balance) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró el balance de vacaciones.",
        message: "Vacation balance not found.",
      });
    }

    const availableForLoanDays = Number(
      balance.availableForLoanDays ?? balance.availableDays ?? 0,
    );

    const accruedPaymentDays = Number(balance.accruedPaymentDays || 0);
    const payableVacationDays = Number(balance.payableVacationDays || 0);
    const netPayableVacationDays = Number(balance.netPayableVacationDays || 0);

    const maxGuaranteeDaysByPercent = Math.max(
      0,
      Math.floor(
        calculateMaxGuaranteeDays({
          availableDays: availableForLoanDays,
          productConfig,
        }),
      ),
    );

    const configuredMaxVacationGuaranteeDays = Math.max(
      0,
      Math.floor(Number(productConfig.maxVacationGuaranteeDays || 0)),
    );

    const vacationDayAmount = calculateVacationGuaranteeAmount({
      guaranteedDays: 1,
      dailySalary: salarySnapshot.dailySalary,
      productConfig,
    });

    const maxGuaranteeDays = calculateEffectiveMaxGuaranteeDays({
      availableDays: availableForLoanDays,
      dailySalary: salarySnapshot.dailySalary,
      productConfig,
    });

    const maxGuaranteeAmount = calculateVacationGuaranteeAmount({
      guaranteedDays: maxGuaranteeDays,
      dailySalary: salarySnapshot.dailySalary,
      productConfig,
    });

    const productMaxAmount = Number(productConfig.maxLoanAmount || 0);

    const productLimit =
      productMaxAmount > 0 ? productMaxAmount : Number.POSITIVE_INFINITY;

    const maxAllowedAmountRaw = Math.min(productLimit, maxGuaranteeAmount);

    const maxAllowedAmount = Number.isFinite(maxAllowedAmountRaw)
      ? round2(maxAllowedAmountRaw)
      : 0;

    const minLoanAmount = Number(productConfig.minLoanAmount || 0);

    const minimumGuaranteeDaysByAmount =
      vacationDayAmount > 0 && minLoanAmount > 0
        ? Math.max(
            1,
            Math.ceil((minLoanAmount - Number.EPSILON) / vacationDayAmount),
          )
        : vacationDayAmount > 0
          ? 1
          : 0;

    const canRequestLoan =
      paymentScheduleInfo.supported &&
      vacationDayAmount > 0 &&
      maxGuaranteeDays > 0 &&
      maxAllowedAmount >= minLoanAmount &&
      maxGuaranteeDays >= minimumGuaranteeDaysByAmount;

    return res.status(200).json({
      ok: true,

      employee,
      policy,

      productConfig,
      productRules: buildPublicLoanProductConfigResponse(productConfig),

      salarySnapshot,
      paymentSchedule: paymentScheduleInfo,
      vacationBalance: balance,

      vacationSummary: {
        serviceMonths: Number(balance.serviceMonths || 0),
        serviceYears: Number(balance.serviceYears || 0),

        canEnjoyVacations:
          Number(balance.serviceYears || 0) >= 1 &&
          Number(balance.availableDays || 0) > 0,

        canUseVacationForLoan: availableForLoanDays > 0,

        enjoyableDays: Number(balance.enjoyableDays || 0),
        availableDays: Number(balance.availableDays || 0),

        accruedPaymentDays,
        availableForLoanDays,
        payableVacationDays,
        netPayableVacationDays,

        usedDays: Number(balance.usedDays || 0),
        reservedDays: Number(balance.reservedDays || 0),
        adjustmentDays: Number(balance.adjustmentDays || 0),

        cycleStartDate: balance.cycleStartDate || null,
        cycleEndDate: balance.cycleEndDate || null,
        lastCalculatedAt: balance.lastCalculatedAt || null,
      },

      eligibility: {
        maxBySalary: 0,

        maxGuaranteeDaysByPercent,
        maxGuaranteeDays,
        maxGuaranteeAmount,
        maxAllowedAmount,
        vacationDayAmount,
        minimumGuaranteeDaysByAmount,
        canRequestLoan,

        paymentScheduleSupported: paymentScheduleInfo.supported,
        paymentFrequency: paymentScheduleInfo.normalizedFrequency,
        paymentFrequencyCode: paymentScheduleInfo.frequencyCode,
        paymentFrequencyLabel: paymentScheduleInfo.frequencyLabel,
        paymentDays: paymentScheduleInfo.paymentDays,
        monthlyPaymentDay: paymentScheduleInfo.monthlyPaymentDay,
        paymentScheduleMessage: paymentScheduleInfo.message,

        maxVacationGuaranteeDays: configuredMaxVacationGuaranteeDays,

        hasFixedVacationGuaranteeDaysLimit:
          configuredMaxVacationGuaranteeDays > 0,

        minimumVacationDaysRequired: Number(
          productConfig.minimumVacationDaysRequired || 0,
        ),

        minLoanAmount: Number(productConfig.minLoanAmount || 0),
        maxLoanAmount: Number(productConfig.maxLoanAmount || 0),
        minInstallments: Number(productConfig.minInstallments || 1),
        maxInstallments: Number(productConfig.maxInstallments || 1),

        availableForLoanDays,
        accruedPaymentDays,
        payableVacationDays,
        netPayableVacationDays,

        productConfigSource: productConfig?._source || PRODUCT_CONFIG_SOURCE,
      },

      meta: {
        year,
        recalculated: true,
        recalculatedAt: new Date(),
      },

      mensaje: "Elegibilidad calculada correctamente.",
      message: "Eligibility calculated successfully.",
    });
  } catch (error: any) {
    console.error("getMyEmployeeLoanEligibility error:", error);

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
      mensaje: "Error calculando la elegibilidad del préstamo.",
      message: "Error calculating loan eligibility.",
    });
  } finally {
    session.endSession();
  }
};

const createEmployeeLoanRequest = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const authUserId = req.uid;

    if (!authUserId) {
      return res.status(401).json({
        ok: false,
        mensaje: "No autorizado.",
        message: "Unauthorized.",
      });
    }

    const requestedInstallments = Number(
      toNum(req.body.requestedInstallments, 1),
    );

    const guaranteedDays = Number(toNum(req.body.guaranteedDays, 0));

    const purpose = String(req.body.purpose || "").trim();
    const employeeComment = String(req.body.employeeComment || "").trim();

    let savedLoanRequest: any = null;

    await session.withTransaction(async () => {
      const employee = await loadEmployeeForLoan({
        authUserId,
        session,
      });

      if (!employee) {
        throw {
          statusCode: 404,
          mensaje: "Empleado no encontrado.",
          message: "Employee not found.",
        };
      }

      const quoteContext = await buildEmployeeLoanQuoteContext({
        req,
        employee,
        authUserId,
        requestedInstallments,
        guaranteedDays,
        session,
      });

      const requestedAmount = quoteContext.calculatedRequestedAmount;
      const appliedInstallments = quoteContext.requestedInstallments;

      const requestNumber = generateLoanRequestNumber();

      const loanRequest = new EmployeeLoanRequest({
        requestNumber,

        employee: employee._id,
        company: quoteContext.companyId,
        department: toObjectIdOrNull(employee.department),
        jobPosition: toObjectIdOrNull(employee.jobPosition),
        project: toObjectIdOrNull(employee.project),

        policy: quoteContext.policy._id,

        status: "SUBMITTED",
        source: "EMPLOYEE_PORTAL",

        requestedAmount,
        maxAllowedAmount: quoteContext.loanCalculation.maxAllowedAmount,
        requestedInstallments: appliedInstallments,

        purpose,
        employeeComment,

        salarySnapshot: quoteContext.salarySnapshot,
        vacationSnapshot: quoteContext.vacationSnapshot,
        guaranteeSourceSnapshot: quoteContext.guaranteeSource,
        christmasSalaryGuaranteeSnapshot: quoteContext.christmasSalaryGuarantee
          ? {
              year: quoteContext.christmasSalaryGuarantee.year,
              accruedChristmasSalaryAmount:
                quoteContext.christmasSalaryGuarantee
                  .accruedChristmasSalaryAmount,
              reservedGuaranteeAmount:
                quoteContext.christmasSalaryGuarantee.reservedGuaranteeAmount,
              availableUnreservedChristmasSalaryAmount:
                quoteContext.christmasSalaryGuarantee
                  .availableUnreservedChristmasSalaryAmount,
              maxAllowedLoanAmount:
                quoteContext.christmasSalaryGuarantee.maxAllowedLoanAmount,
              maxChristmasSalaryGuaranteePercent:
                quoteContext.christmasSalaryGuarantee
                  .maxChristmasSalaryGuaranteePercent,
              guaranteeCoverageBasis:
                quoteContext.productConfig.guaranteeCoverageBasis ||
                "OUTSTANDING_BALANCE",
            }
          : undefined,

        loanProviderSnapshot: quoteContext.loanProviderSnapshot,
        loanQuoteSnapshot: quoteContext.loanQuoteSnapshot,
        amortizationSchedule: quoteContext.loanQuote.amortizationSchedule,

        externalSystemCode:
          quoteContext.productConfig.externalProductCode ||
          quoteContext.productConfig.code ||
          "",
        externalSyncStatus: "NOT_REQUIRED",

        submittedAt: new Date(),
        createdBy: authUserId,
        updatedBy: authUserId,

        isActive: true,
        isDeleted: false,
      });

      loanRequest.externalPayload = buildExternalPayloadPreview({
        loanRequest,
        employee,
        productConfig: quoteContext.productConfig,
        loanProviderSnapshot: quoteContext.loanProviderSnapshot,
      });

      await loanRequest.save({ session });

      const vacationReservation =
        quoteContext.guaranteeSource === "VACATION_DAYS"
          ? await reserveVacationDaysForLoan({
              loanRequest,
              employee,
              companyId: quoteContext.companyId,
              vacationBalance: quoteContext.vacationBalance,
              year: quoteContext.vacationSnapshot.year,
              guaranteedDays: quoteContext.loanCalculation.guaranteedDays,
              authUserId,
              session,
            })
          : null;

      await createLoanHistory({
        loanRequest: loanRequest._id,
        action: "CREATED",
        fromStatus: null,
        toStatus: "SUBMITTED",
        comment: "Solicitud de préstamo creada por el empleado.",
        source: "EMPLOYEE_PORTAL",
        performedBy: authUserId,
        newData: loanRequest.toObject(),
        metadata: {
          vacationReservation: vacationReservation?._id || null,
          guaranteedDays: quoteContext.loanCalculation.guaranteedDays,
          requestedAmount,
          maxAllowedAmount: quoteContext.loanCalculation.maxAllowedAmount,
          amountCalculatedFromVacationDays: quoteContext.guaranteeSource === "VACATION_DAYS",
          guaranteeSource: quoteContext.guaranteeSource,
          christmasSalaryGuarantee:
            quoteContext.christmasSalaryGuarantee || null,
          productConfigSource:
            quoteContext.productConfig?._source || PRODUCT_CONFIG_SOURCE,
        },
        session,
      });

      savedLoanRequest = loanRequest;
    });

    const populated = await populateLoanRequestQuery(
      EmployeeLoanRequest.findById(savedLoanRequest._id),
    );

    return res.status(201).json({
      ok: true,
      loanRequest: populated,
      request: populated,
      mensaje: "Solicitud de préstamo creada correctamente.",
      message: "Employee loan request created successfully.",
    });
  } catch (error: any) {
    console.error("createEmployeeLoanRequest error:", error);

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        ok: false,
        mensaje: error.mensaje,
        message: error.message,
        conflict: error.conflict,
        data: error.data,
      });
    }

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error creando la solicitud de préstamo.",
      message: "Error creating employee loan request.",
    });
  } finally {
    session.endSession();
  }
};

const getMyEmployeeLoanRequests = async (req: AuthRequest, res: Response) => {
  try {
    const authUserId = req.uid;

    if (!authUserId) {
      return res.status(401).json({
        ok: false,
        mensaje: "No autorizado.",
        message: "Unauthorized.",
      });
    }

    const statuses = normalizeStatuses(req.query.statuses);
    const queryText = getQueryString(req.query.q);

    const filters: any = {
      employee: authUserId,
      isDeleted: false,
    };

    if (statuses.length) {
      filters.status = { $in: statuses };
    }

    if (queryText) {
      const regex = new RegExp(escapeRegex(queryText), "i");

      filters.$or = [
        { requestNumber: regex },
        { status: regex },
        { purpose: regex },
        { employeeComment: regex },
        { externalComment: regex },
      ];
    }

    const loanRequests = await populateLoanRequestQuery(
      EmployeeLoanRequest.find(filters).sort({ createdAt: -1 }),
    );

    return res.status(200).json({
      ok: true,
      loanRequests,
      requests: loanRequests,
      data: loanRequests,
      mensaje: "Solicitudes de préstamos cargadas correctamente.",
      message: "Employee loan requests loaded successfully.",
    });
  } catch (error) {
    console.error("getMyEmployeeLoanRequests error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error cargando tus solicitudes de préstamos.",
      message: "Error loading my employee loan requests.",
    });
  }
};

const getEmployeeLoanRequests = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    const limitRaw = toNum(req.query.limit, 20);
    const initialRaw = toNum(req.query.initial, 0);

    const limit = Math.min(Math.max(limitRaw, 1), 200);
    const initial = Math.max(initialRaw, 0);

    const statuses = normalizeStatuses(req.query.statuses);
    const externalSyncStatus = getQueryString(
      req.query.externalSyncStatus,
    ).toUpperCase();
    const company = getQueryString(req.query.company);
    const queryText = getQueryString(req.query.q);

    const filters: any = {
      isDeleted: false,
    };

    let departmentUserIds: Types.ObjectId[] = [];

    if (user?.isManager) {
      if (!user?.department) {
        return res.status(400).json({
          ok: false,
          mensaje: "El manager no tiene department asignado.",
          message: "Manager has no department assigned.",
        });
      }

      const departmentUsers = await User.find({
        department: user.department,
        isDeleted: false,
      })
        .select("_id")
        .lean();

      departmentUserIds = departmentUsers.map((item: any) => item._id);

      filters.employee = { $in: departmentUserIds };
    }

    if (statuses.length) {
      filters.status = { $in: statuses };
    }

    if (externalSyncStatus) {
      filters.externalSyncStatus = externalSyncStatus;
    }

    if (company && Types.ObjectId.isValid(company)) {
      filters.company = new Types.ObjectId(company);
    }

    if (queryText) {
      const regex = new RegExp(escapeRegex(queryText), "i");

      const userQuery: any = {
        isDeleted: false,
        $or: [{ name: regex }, { email: regex }, { phone: regex }],
      };

      if (user?.isManager && departmentUserIds.length) {
        userQuery._id = { $in: departmentUserIds };
      }

      const matchedUsers = await User.find(userQuery).select("_id").lean();
      const matchedUserIds = matchedUsers.map((item: any) => item._id);

      const or: any[] = [
        { requestNumber: regex },
        { status: regex },
        { purpose: regex },
        { employeeComment: regex },
        { externalComment: regex },
        { externalRequestId: regex },
      ];

      if (matchedUserIds.length) {
        or.push({ employee: { $in: matchedUserIds } });
      }

      filters.$or = or;
    }

    const statsFilters = { ...filters };

    const [
      total,
      loanRequests,

      statsTotal,
      statsSubmitted,
      statsSentToExternal,
      statsUnderReview,
      statsApproved,
      statsRejected,
      statsCancelled,
      statsTerminated,
      statsClosed,
      statsError,
    ] = await Promise.all([
      EmployeeLoanRequest.countDocuments(filters),

      populateLoanRequestQuery(
        EmployeeLoanRequest.find(filters)
          .sort({ createdAt: -1 })
          .skip(initial)
          .limit(limit),
      ),

      EmployeeLoanRequest.countDocuments(statsFilters),

      EmployeeLoanRequest.countDocuments({
        ...statsFilters,
        status: "SUBMITTED",
      }),

      EmployeeLoanRequest.countDocuments({
        ...statsFilters,
        status: "SENT_TO_EXTERNAL",
      }),

      EmployeeLoanRequest.countDocuments({
        ...statsFilters,
        status: "UNDER_REVIEW",
      }),

      EmployeeLoanRequest.countDocuments({
        ...statsFilters,
        status: "APPROVED",
      }),

      EmployeeLoanRequest.countDocuments({
        ...statsFilters,
        status: "REJECTED",
      }),

      EmployeeLoanRequest.countDocuments({
        ...statsFilters,
        status: "CANCELLED",
      }),

      EmployeeLoanRequest.countDocuments({
        ...statsFilters,
        status: "TERMINATED",
      }),

      EmployeeLoanRequest.countDocuments({
        ...statsFilters,
        status: "CLOSED",
      }),

      EmployeeLoanRequest.countDocuments({
        ...statsFilters,
        status: "ERROR",
      }),
    ]);

    return res.status(200).json({
      ok: true,
      loanRequests,
      requests: loanRequests,
      data: loanRequests,
      stats: {
        total: statsTotal,
        submitted: statsSubmitted,
        sentToExternal: statsSentToExternal,
        underReview: statsUnderReview,
        approved: statsApproved,
        rejected: statsRejected,
        cancelled: statsCancelled,
        terminated: statsTerminated,
        closed: statsClosed,
        error: statsError,
      },
      meta: {
        total,
        limit,
        initial,
        returned: loanRequests.length,
        hasMore: initial + loanRequests.length < total,
      },
      mensaje: "Solicitudes de préstamos cargadas correctamente.",
      message: "Employee loan requests loaded successfully.",
    });
  } catch (error) {
    console.error("getEmployeeLoanRequests error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error cargando solicitudes de préstamos.",
      message: "Error loading employee loan requests.",
    });
  }
};

const getEmployeeLoanRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const authUserId = req.uid;

    if (!Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de la solicitud no es válido.",
        message: "Invalid loan request ID.",
      });
    }

    const loanRequest = await populateLoanRequestQuery(
      EmployeeLoanRequest.findOne({
        _id: id,
        isDeleted: false,
      }),
    );

    if (!loanRequest) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud de préstamo no encontrada.",
        message: "Employee loan request not found.",
      });
    }

    const isOwner =
      String(loanRequest.employee?._id || loanRequest.employee) ===
      String(authUserId);

    const canViewAsAdmin = Boolean(
      req.user?.isSuperAdmin || req.user?.isManager || canManageEmployeeLoans(req.user),
    );

    if (!isOwner && !canViewAsAdmin) {
      return res.status(403).json({
        ok: false,
        mensaje: "No tienes permiso para ver esta solicitud.",
        message: "You do not have permission to view this loan request.",
      });
    }

    const loanRequestPayload = buildLoanRequestDetailPayload(loanRequest);

    return res.status(200).json({
      ok: true,
      loanRequest: loanRequestPayload,
      request: loanRequestPayload,
      mensaje: "Solicitud de préstamo encontrada correctamente.",
      message: "Employee loan request found successfully.",
    });
  } catch (error) {
    console.error("getEmployeeLoanRequestById error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error cargando la solicitud de préstamo.",
      message: "Error loading employee loan request.",
    });
  }
};

const getEmployeeLoanRequestHistory = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const authUserId = req.uid;

    if (!Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de la solicitud no es válido.",
        message: "Invalid loan request ID.",
      });
    }

    const loanRequest = await EmployeeLoanRequest.findOne({
      _id: id,
      isDeleted: false,
    }).select("employee");

    if (!loanRequest) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud de préstamo no encontrada.",
        message: "Employee loan request not found.",
      });
    }

    const isOwner = String(loanRequest.employee) === String(authUserId);

    const canViewAsAdmin = Boolean(
      req.user?.isSuperAdmin || req.user?.isManager || canManageEmployeeLoans(req.user),
    );

    if (!isOwner && !canViewAsAdmin) {
      return res.status(403).json({
        ok: false,
        mensaje: "No tienes permiso para ver el historial.",
        message: "You do not have permission to view this history.",
      });
    }

    const history = await EmployeeLoanRequestHistory.find({
      loanRequest: id,
    })
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      history,
      mensaje: "Historial cargado correctamente.",
      message: "Loan request history loaded successfully.",
    });
  } catch (error) {
    console.error("getEmployeeLoanRequestHistory error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error cargando el historial.",
      message: "Error loading loan request history.",
    });
  }
};

const cancelMyEmployeeLoanRequest = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const authUserId = req.uid;

    if (!authUserId) {
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
        message: "Invalid loan request ID.",
      });
    }

    let updatedLoanRequest: any = null;

    await session.withTransaction(async () => {
      const loanRequest = await EmployeeLoanRequest.findOne({
        _id: id,
        employee: authUserId,
        isDeleted: false,
      }).session(session);

      if (!loanRequest) {
        throw {
          statusCode: 404,
          mensaje: "Solicitud de préstamo no encontrada.",
          message: "Employee loan request not found.",
        };
      }

      const currentStatus = String(loanRequest.status || "").toUpperCase();

      const canCancel =
        ["SUBMITTED", "ERROR"].includes(currentStatus) &&
        !["APPROVED", "REJECTED", "CANCELLED"].includes(currentStatus);

      if (!canCancel) {
        throw {
          statusCode: 400,
          mensaje:
            "Esta solicitud ya fue aprobada, rechazada o procesada. No puede ser cancelada desde esta plataforma.",
          message:
            "This request has already been approved, rejected, or processed and cannot be cancelled here.",
        };
      }

      const previousData = loanRequest.toObject();

      if (loanRequest.vacationReservation) {
        const reservation = await VacationDayReservation.findById(
          loanRequest.vacationReservation,
        ).session(session);

        if (
          reservation &&
          String(reservation.status || "").toUpperCase() === "ACTIVE"
        ) {
          reservation.status = "CANCELLED";
          reservation.reason = `${reservation.reason || ""} | Cancelada por solicitud de préstamo cancelada`;

          await reservation.save({ session });

          const balance = await EmployeeVacationBalance.findById(
            reservation.balance,
          ).session(session);

          if (balance) {
            balance.reservedDays = Math.max(
              Number(balance.reservedDays || 0) -
                Number(reservation.reservedDays || 0),
              0,
            );

            recalculateVacationBalance(balance);

            await balance.save({ session });
          }
        }
      }

      loanRequest.status = "CANCELLED";
      loanRequest.updatedBy = toObjectId(String(authUserId));

      await loanRequest.save({ session });

      await createLoanHistory({
        loanRequest: loanRequest._id,
        action: "CANCELLED",
        fromStatus: currentStatus,
        toStatus: "CANCELLED",
        comment: "Solicitud cancelada por el empleado.",
        source: "EMPLOYEE_PORTAL",
        performedBy: authUserId,
        previousData,
        newData: loanRequest.toObject(),
        session,
      });

      updatedLoanRequest = loanRequest;
    });

    const populated = await populateLoanRequestQuery(
      EmployeeLoanRequest.findById(updatedLoanRequest._id),
    );

    return res.status(200).json({
      ok: true,
      loanRequest: populated,
      request: populated,
      mensaje: "Solicitud cancelada correctamente.",
      message: "Employee loan request cancelled successfully.",
    });
  } catch (error: any) {
    console.error("cancelMyEmployeeLoanRequest error:", error);

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
      mensaje: "Error cancelando la solicitud.",
      message: "Error cancelling employee loan request.",
    });
  } finally {
    session.endSession();
  }
};

const cancelEmployeeLoanRequestByAdmin = async (
  req: AuthRequest,
  res: Response,
) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const authUserId = req.uid || req.user?._id;

    if (!authUserId || !Types.ObjectId.isValid(String(authUserId))) {
      return res.status(401).json({
        ok: false,
        mensaje: "No autorizado.",
        message: "Unauthorized.",
      });
    }

    if (!canManageEmployeeLoans(req.user)) {
      return res.status(403).json({
        ok: false,
        mensaje: "No tienes permiso para cancelar préstamos.",
        message: "You do not have permission to cancel employee loans.",
      });
    }

    if (!Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de la solicitud no es válido.",
        message: "Invalid loan request ID.",
      });
    }

    const adminComment = String(req.body?.comment || req.body?.notes || "")
      .trim()
      .slice(0, 1000);

    let updatedLoanRequest: any = null;

    await session.withTransaction(async () => {
      const loanRequest: any = await EmployeeLoanRequest.findOne({
        _id: id,
        isDeleted: false,
      }).session(session);

      if (!loanRequest) {
        throw {
          statusCode: 404,
          mensaje: "Solicitud de préstamo no encontrada.",
          message: "Employee loan request not found.",
        };
      }

      const currentStatus = String(loanRequest.status || "").toUpperCase();
      const availability = getAdminCancelAvailability(loanRequest);

      if (!availability.canCancel) {
        throw {
          statusCode: 400,
          mensaje: availability.reason || "El préstamo no puede cancelarse.",
          message: availability.reason || "Loan request cannot be cancelled.",
        };
      }

      const previousData = loanRequest.toObject();

      await releaseVacationLoanReservation({
        loanRequest,
        authUserId,
        session,
        reason:
          adminComment ||
          `Garantía liberada por cancelación administrativa del préstamo ${loanRequest.requestNumber}.`,
      });

      loanRequest.status = "CANCELLED";
      loanRequest.updatedBy = toObjectId(String(authUserId));
      loanRequest.decidedAt = loanRequest.decidedAt || new Date();

      if (Array.isArray(loanRequest.amortizationSchedule)) {
        loanRequest.amortizationSchedule.forEach((installment: any) => {
          const installmentStatus = String(
            installment?.status || "",
          ).toUpperCase();

          if (["PENDING", "SKIPPED"].includes(installmentStatus)) {
            installment.status = "CANCELLED";
          }
        });

        loanRequest.markModified("amortizationSchedule");
      }

      await loanRequest.save({ session });

      await createLoanHistory({
        loanRequest: loanRequest._id,
        action: "CANCELLED",
        fromStatus: currentStatus,
        toStatus: "CANCELLED",
        comment:
          adminComment || "Solicitud cancelada por administración/RRHH.",
        source: "ADMIN_PORTAL",
        performedBy: authUserId,
        previousData,
        newData: loanRequest.toObject(),
        metadata: {
          adminCancellation: true,
        },
        session,
      });

      updatedLoanRequest = loanRequest;
    });

    const populated = await populateLoanRequestQuery(
      EmployeeLoanRequest.findById(updatedLoanRequest._id),
    );
    const payload = buildLoanRequestDetailPayload(populated);

    return res.status(200).json({
      ok: true,
      loanRequest: payload,
      request: payload,
      mensaje: "Préstamo cancelado correctamente.",
      message: "Employee loan request cancelled successfully.",
    });
  } catch (error: any) {
    console.error("cancelEmployeeLoanRequestByAdmin error:", error);

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
      mensaje: "Error cancelando el préstamo.",
      message: "Error cancelling employee loan request.",
    });
  } finally {
    session.endSession();
  }
};

const quoteMyEmployeeLoanRequest = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const authUserId = req.uid;

    const requestedInstallments = Number(
      toNum(req.body.requestedInstallments, 1),
    );

    const guaranteedDays = Number(toNum(req.body.guaranteedDays, 0));

    const employee = await loadEmployeeForLoan({
      authUserId,
      session,
    });

    if (!employee) {
      return res.status(404).json({
        ok: false,
        mensaje: "Empleado no encontrado.",
      });
    }

    const quoteContext = await buildEmployeeLoanQuoteContext({
      req,
      employee,
      authUserId,
      requestedInstallments,
      guaranteedDays,
      session,
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Cotización calculada correctamente.",

      employee,
      policy: quoteContext.policy,

      productConfig: quoteContext.productConfig,
      productRules: quoteContext.productRules,

      salarySnapshot: quoteContext.salarySnapshot,
      vacationBalance: quoteContext.vacationBalance,

      requestedAmount: quoteContext.calculatedRequestedAmount,
      calculatedRequestedAmount: quoteContext.calculatedRequestedAmount,
      requestedInstallments: quoteContext.requestedInstallments,
      guaranteedDays: quoteContext.loanCalculation.guaranteedDays,

      eligibility: {
        maxBySalary: 0,
        guaranteeIsRequired: quoteContext.loanCalculation.guaranteeIsRequired,
        vacationDayAmount: quoteContext.loanCalculation.vacationDayAmount,
        maxGuaranteeDaysByPercent:
          quoteContext.loanCalculation.maxGuaranteeDaysByPercent,
        maxVacationGuaranteeDays:
          quoteContext.loanCalculation.configuredMaxVacationGuaranteeDays,
        hasFixedVacationGuaranteeDaysLimit:
          quoteContext.loanCalculation.hasFixedVacationGuaranteeDaysLimit,
        maxGuaranteeDays: quoteContext.loanCalculation.maxGuaranteeDays,
        maxGuaranteeAmount:
          quoteContext.loanCalculation.maxPossibleGuaranteeAmount,
        maxAllowedAmount:
          quoteContext.loanCalculation
            .maxAllowedAmountUsingAllAvailableGuarantee,
        selectedLoanAmount: quoteContext.calculatedRequestedAmount,
        estimatedGuaranteeAmount:
          quoteContext.loanCalculation.estimatedGuaranteeAmount,
        productMaxAmount: quoteContext.loanCalculation.productMaxAmount,
        dailySalary: quoteContext.loanCalculation.dailySalary,

        minLoanAmount: Number(quoteContext.productConfig.minLoanAmount || 0),
        maxLoanAmount: Number(quoteContext.productConfig.maxLoanAmount || 0),
        minInstallments: Number(
          quoteContext.productConfig.minInstallments || 1,
        ),
        maxInstallments: Number(
          quoteContext.productConfig.maxInstallments || 1,
        ),

        availableForLoanDays: quoteContext.availableForLoanDays,
        productConfigSource:
          quoteContext.productConfig?._source || PRODUCT_CONFIG_SOURCE,
      },

      paymentConfig: quoteContext.paymentConfig,

      loanProviderSnapshot: quoteContext.loanProviderSnapshot,

      loanQuote: quoteContext.loanQuoteSnapshot,

      vacationSnapshot: quoteContext.vacationSnapshot,
      guarantee: quoteContext.christmasSalaryGuarantee || {
        source: quoteContext.guaranteeSource,
        label: "D??as de vacaciones",
        warnings: [],
        blockedReasons: [],
      },
      amortizationSchedule: quoteContext.loanQuote.amortizationSchedule,

      contract: quoteContext.contract,
    });
  } catch (error: any) {
    console.error("quoteMyEmployeeLoanRequest error:", error);

    return res.status(error?.statusCode || 500).json({
      ok: false,
      mensaje: error?.mensaje || "Error calculando cotización del préstamo.",
      message: error?.message,
      data: error?.data,
    });
  } finally {
    session.endSession();
  }
};

const signMyEmployeeLoanContract = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const authUserId = req.uid;

    const requestedInstallments = Number(
      toNum(req.body.requestedInstallments, 1),
    );

    const guaranteedDays = Number(toNum(req.body.guaranteedDays, 0));

    const purpose = String(req.body.purpose || "").trim();
    const employeeComment = String(req.body.employeeComment || "").trim();

    const signatureName = String(req.body.signatureName || "").trim();
    const signatureDocument = String(req.body.signatureDocument || "").trim();

    if (!signatureName) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes escribir tu nombre para firmar el contrato.",
      });
    }

    let savedLoanRequest: any = null;

    await session.withTransaction(async () => {
      const employee = await loadEmployeeForLoan({
        authUserId,
        session,
      });

      if (!employee) {
        throw {
          statusCode: 404,
          mensaje: "Empleado no encontrado.",
        };
      }

      const quoteContext = await buildEmployeeLoanQuoteContext({
        req,
        employee,
        authUserId,
        requestedInstallments,
        guaranteedDays,
        session,
      });

      const requestedAmount = quoteContext.calculatedRequestedAmount;
      const appliedInstallments = quoteContext.requestedInstallments;

      const requestNumber = generateLoanRequestNumber();

      const signatureImageFile = getUploadedFileFromRequest(
        req,
        "signatureImage",
      );

      const signatureImageUrl = getUploadedFileUrlFromRequest(
        req,
        "signatureImage",
      );

      const contractSnapshot = await generateEmployeeLoanContractSnapshot({
        employee,
        company: employee?.company,
        loanQuote: quoteContext.loanQuote,
        loanProviderSnapshot: quoteContext.loanProviderSnapshot,
        vacationSnapshot: quoteContext.vacationSnapshot,
        salarySnapshot: quoteContext.salarySnapshot,
        productConfig: quoteContext.productConfig,
        requestNumber,

        signatureName,
        signatureDocument,
        signatureIpAddress: quoteContext.signatureMeta.signatureIpAddress,
        signatureUserAgent: quoteContext.signatureMeta.signatureUserAgent,

        signatureImageFile,
        signatureImageUrl,
        signatureImageBase64: req.body.signatureImageBase64,

        sourcePlatformCode:
          quoteContext.productConfig?.externalProductCode ||
          quoteContext.productConfig?.code ||
          quoteContext.loanProviderSnapshot?.productCode,

        sourcePlatformName: "Payroll System",
        sourceSystemId: String(req.user?.system || ""),
      });

      const loanRequest = new EmployeeLoanRequest({
        requestNumber,

        employee: employee._id,
        company: quoteContext.companyId,
        department: toObjectIdOrNull(employee.department),
        jobPosition: toObjectIdOrNull(employee.jobPosition),
        project: toObjectIdOrNull(employee.project),

        policy: quoteContext.policy._id,

        status: "APPROVED",
        source: "EMPLOYEE_PORTAL",

        requestedAmount,
        maxAllowedAmount: quoteContext.loanCalculation.maxAllowedAmount,
        requestedInstallments: appliedInstallments,

        purpose,
        employeeComment,

        salarySnapshot: quoteContext.salarySnapshot,
        vacationSnapshot: quoteContext.vacationSnapshot,
        guaranteeSourceSnapshot: quoteContext.guaranteeSource,
        christmasSalaryGuaranteeSnapshot: quoteContext.christmasSalaryGuarantee
          ? {
              year: quoteContext.christmasSalaryGuarantee.year,
              accruedChristmasSalaryAmount:
                quoteContext.christmasSalaryGuarantee
                  .accruedChristmasSalaryAmount,
              reservedGuaranteeAmount:
                quoteContext.christmasSalaryGuarantee.reservedGuaranteeAmount,
              availableUnreservedChristmasSalaryAmount:
                quoteContext.christmasSalaryGuarantee
                  .availableUnreservedChristmasSalaryAmount,
              maxAllowedLoanAmount:
                quoteContext.christmasSalaryGuarantee.maxAllowedLoanAmount,
              maxChristmasSalaryGuaranteePercent:
                quoteContext.christmasSalaryGuarantee
                  .maxChristmasSalaryGuaranteePercent,
              guaranteeCoverageBasis:
                quoteContext.productConfig.guaranteeCoverageBasis ||
                "OUTSTANDING_BALANCE",
            }
          : undefined,

        loanProviderSnapshot: quoteContext.loanProviderSnapshot,
        loanQuoteSnapshot: quoteContext.loanQuoteSnapshot,
        amortizationSchedule: quoteContext.loanQuote.amortizationSchedule,

        contractSnapshot,

        externalSystemCode:
          quoteContext.productConfig.externalProductCode ||
          quoteContext.productConfig.code ||
          "",
        externalSyncStatus: "NOT_REQUIRED",

        submittedAt: new Date(),
        approvedAt: new Date(),
        createdBy: authUserId,
        updatedBy: authUserId,

        isActive: true,
        isDeleted: false,
      });

      loanRequest.externalPayload = buildExternalPayloadPreview({
        loanRequest,
        employee,
        productConfig: quoteContext.productConfig,
        loanProviderSnapshot: quoteContext.loanProviderSnapshot,
      });

      await loanRequest.save({ session });

      const vacationReservation =
        quoteContext.guaranteeSource === "VACATION_DAYS"
          ? await reserveVacationDaysForLoan({
              loanRequest,
              employee,
              companyId: quoteContext.companyId,
              vacationBalance: quoteContext.vacationBalance,
              year: quoteContext.vacationSnapshot.year,
              guaranteedDays: quoteContext.loanCalculation.guaranteedDays,
              authUserId,
              session,
            })
          : null;

      await createLoanHistory({
        loanRequest: loanRequest._id,
        action: "CONTRACT_SIGNED",
        fromStatus: null,
        toStatus: "APPROVED",
        comment: "Contrato firmado digitalmente por el empleado.",
        source: "EMPLOYEE_PORTAL",
        performedBy: authUserId,
        newData: loanRequest.toObject(),
        metadata: {
          vacationReservation: vacationReservation?._id || null,
          guaranteedDays: quoteContext.loanCalculation.guaranteedDays,
          requestedAmount,
          totalToPay: quoteContext.loanQuote.totalToPay,
          totalInterest: quoteContext.loanQuote.totalInterest,
          signatureName,
          amountCalculatedFromVacationDays: quoteContext.guaranteeSource === "VACATION_DAYS",
          guaranteeSource: quoteContext.guaranteeSource,
          christmasSalaryGuarantee:
            quoteContext.christmasSalaryGuarantee || null,
          productConfigSource:
            quoteContext.productConfig?._source || PRODUCT_CONFIG_SOURCE,
        },
        session,
      });

      savedLoanRequest = loanRequest;
    });

    const populated = await populateLoanRequestQuery(
      EmployeeLoanRequest.findById(savedLoanRequest._id),
    );

    return res.status(201).json({
      ok: true,
      loanRequest: populated,
      request: populated,
      mensaje: "Préstamo aceptado y contrato firmado correctamente.",
    });
  } catch (error: any) {
    console.error("signMyEmployeeLoanContract error:", error);

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        ok: false,
        mensaje: error.mensaje,
        message: error.message,
        data: error.data,
      });
    }

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error firmando el contrato del préstamo.",
    });
  } finally {
    session.endSession();
  }
};

export {
  getMyEmployeeLoanEligibility,
  createEmployeeLoanRequest,
  getMyEmployeeLoanRequests,
  getEmployeeLoanRequests,
  getEmployeeLoanRequestById,
  getEmployeeLoanRequestHistory,
  cancelMyEmployeeLoanRequest,
  cancelEmployeeLoanRequestByAdmin,
  quoteMyEmployeeLoanRequest,
  signMyEmployeeLoanContract,
};
