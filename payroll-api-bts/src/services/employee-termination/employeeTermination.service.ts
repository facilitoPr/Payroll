import mongoose, { Types, isValidObjectId } from "mongoose";
import moment from "moment";
import EmployeeTermination, {
  ITerminationCalculationLine,
  TerminationLineCode,
  TerminationLineType,
} from "../../model/employee-termination/employeeTermination";
import TerminationPayment from "../../model/employee-termination/terminationPayment";
import CompanyProfile from "../../model/companyProfile";
import EmployeeSalaryHistory from "../../model/employee-termination/employeeSalaryHistory";
import PayrollAccrual from "../../model/employee-termination/payrollAccrual";
import LaborTerminationPolicyRD, {
  TerminationTypeCode,
} from "../../model/employee-termination/laborTerminationPolicyRD";
import {
  asDate,
  buildEmployeeSnapshot,
  buildSalarySnapshot,
  buildTerminationLine,
  calculateTotalsFromLines,
  normalizeManualTerminationLine,
  resolveInclude,
  roundAmount,
  toObjectIdOrNull,
} from "../../helper/employee-termination/employee-termination.build";
import {
  buildSenioritySnapshot,
  calculateEstimatedOrdinarySalaryEarnedYTD,
  calculatePreNoticeDays,
  calculateSeveranceDays,
  calculateWeightedAverageMonthlySalary,
  getLast12MonthsStart,
  isBeforeProbationEnd,
} from "../../helper/employee-termination/employee-termination.calculate";
import User from "../../model/account/user";
import { calculateTerminationSalaryBases } from "../../helper/employee-termination/employee-termination.payroll-history";
import { getEmployeeLoanTerminationSummary } from "../../helper/employee-termination/employee-termination.loan";
import { buildPayrollBankFile } from "../../helper/payrollBankFileBuilder";
import TerminationLoanPayrollPendingPayment from "../../model/employee-termination/terminationLoanPayrollPendingPayment";
import EmployeeLoanRequest from "../../model/employeeLoan/employeeLoanRequest";
import EmployeeLoanRequestHistory from "../../model/employeeLoan/employeeLoanRequestHistory";
import { releaseVacationLoanReservation } from "../employeeLoan/employeeLoanRequest.service";

export interface CalculateEmployeeTerminationInput {
  companyId: string;
  employeeId: string;

  terminationType: TerminationTypeCode;
  terminationDate: string | Date;
  reason?: string;

  noticeGiven?: boolean;
  noticeDate?: string | Date | null;

  includeOverrides?: {
    includePendingSalary?: boolean | null;
    includeSeverance?: boolean | null;
    includePreNotice?: boolean | null;
    includeVacation?: boolean | null;
    includeChristmasSalary?: boolean | null;
    includeEconomicAssistance?: boolean | null;
    overrideReason?: string;
  };

  pendingSalaryAmount?: number;

  manualLines?: Array<{
    code: TerminationLineCode;
    label?: string;
    type: TerminationLineType;
    amount: number;
    reason?: string;
    notes?: string;
  }>;

  calculatedBy?: string | Types.ObjectId | null;
}

const getAuthObjectId = (value?: any) => {
  if (!value) return null;
  if (value instanceof Types.ObjectId) return value;
  if (Types.ObjectId.isValid(value)) return new Types.ObjectId(value);
  return null;
};

const cleanBankOverride = (value: any) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.keys(value).reduce((acc: any, key) => {
    const item = value[key];
    acc[key] = typeof item === "string" ? item.trim() : item;
    return acc;
  }, {});
};

const getResolvedBankInfo = (employee: any, override: any = {}) => {
  const base = employee?.payrollBank || {};
  const cleanOverride = cleanBankOverride(override);

  return {
    ...base,
    ...cleanOverride,
    beneficiaryName:
      cleanOverride.beneficiaryName ||
      cleanOverride.employeeName ||
      base.beneficiaryName ||
      employee?.name ||
      "",
    emailBenef:
      cleanOverride.emailBenef ||
      base.emailBenef ||
      employee?.email ||
      "",
    faxOrPhoneBenef:
      cleanOverride.faxOrPhoneBenef ||
      base.faxOrPhoneBenef ||
      employee?.phone ||
      "",
  };
};

const getMissingTerminationBankFields = (bank: any) => {
  const required = [
    ["accountNumber", "Número de cuenta destino"],
    ["accountType", "Tipo de cuenta destino"],
    ["bankCode", "Código del banco destino"],
    ["bankDigit", "Dígito del banco destino"],
    ["operationCode", "Código de operación"],
    ["idType", "Tipo de identificación"],
    ["idNumber", "Número de identificación"],
  ];

  return required
    .filter(([field]) => !String(bank?.[field] || "").trim())
    .map(([, label]) => label);
};

const normalizeBankCurrency = (value: any) => {
  const code = String(value || "").trim().toUpperCase();

  if (code === "DOP") return "214";
  if (code === "USD") return "840";
  if (code === "EUR") return "978";

  return code || "214";
};

const normalizeLoanAccountType = (value: any) => {
  const code = String(value || "").trim().toUpperCase();

  if (code === "SAVINGS" || code === "AHORRO" || code === "2") return "2";
  if (code === "CHECKING" || code === "CORRIENTE" || code === "BUSINESS") {
    return "1";
  }

  return code || "2";
};

const getOperationCodeByAccountType = (accountType: any) => {
  const normalized = normalizeLoanAccountType(accountType);

  if (normalized === "1") return "22";
  if (normalized === "2") return "32";

  return "";
};

const buildLoanBankSnapshot = (loan: any, index: number) => {
  const account = loan?.metadata?.interestBankAccount || {};
  const rawBankCode = String(account.bankCode || "").trim();
  const accountType = normalizeLoanAccountType(account.accountType);

  return {
    enabled: true,
    accountNumber: String(account.accountNumber || "").trim(),
    accountType,
    currency: normalizeBankCurrency(account.currency),
    bankCode: rawBankCode.slice(0, 8),
    bankDigit:
      String(account.bankDigit || account.interestBankDigit || "").trim() ||
      (rawBankCode.length > 8 ? rawBankCode.slice(8, 9) : ""),
    operationCode: String(account.operationCode || "").trim() ||
      getOperationCodeByAccountType(accountType),
    idType: String(account.idType || "").trim() || "RN",
    idNumber: String(account.beneficiaryDocument || "").trim(),
    beneficiaryName:
      String(account.beneficiaryName || "").trim() ||
      loan.productName ||
      "Cuenta de prestamo",
    referenceNumber:
      String(loan.requestNumber || `PRESTAMO${index + 1}`)
        .replace(/\s+/g, "")
        .slice(0, 12),
    statementDescription: "PAGO PRESTAMO",
    contactMethod: "",
    emailBenef: "",
    faxOrPhoneBenef: "",
    acquirerId: "00",
    dueDate4: "",
  };
};

const createTerminationLoanPayrollPendingPayments = async ({
  termination,
  payment,
  userId,
  session,
}: {
  termination: any;
  payment: any;
  userId?: string | Types.ObjectId | null;
  session: any;
}) => {
  const loans = Array.isArray(termination?.loanSnapshot?.loans)
    ? termination.loanSnapshot.loans
    : [];

  const rows: any[] = [];

  for (const [index, loan] of loans.entries()) {
    const amount = roundAmount(loan?.amountApplied || 0);

    if (amount <= 0) continue;

    const bankSnapshot = buildLoanBankSnapshot(loan, index);
    const missingBankFields = [
      !bankSnapshot.accountNumber ? "cuenta" : "",
      !bankSnapshot.bankCode ? "banco" : "",
      !bankSnapshot.operationCode ? "operación" : "",
    ].filter(Boolean);

    if (missingBankFields.length) {
      throw Object.assign(
        new Error(
          `El préstamo ${loan.requestNumber || index + 1} no tiene datos bancarios completos en el producto (${missingBankFields.join(", ")}).`,
        ),
        { status: 400 },
      );
    }

    rows.push({
      company: termination.company,
      employee: termination.employee,
      termination: termination._id,
      terminationPayment: payment._id,
      loanRequest: loan.loanRequest,
      amount,
      status: "PENDING",
      employeeName: termination.employeeSnapshot?.fullName || "",
      requestNumber: loan.requestNumber || "",
      productName: loan.productName || "",
      description: `Pago préstamo por desvinculación ${termination.employeeSnapshot?.fullName || ""}`.trim(),
      bankSnapshot,
      metadata: {
        terminationNumber: termination.terminationNumber || "",
        terminationDate: termination.terminationDate || null,
        paymentMethod: payment.paymentMethod || "",
        pendingInstallmentNumbers:
          loan?.metadata?.pendingInstallmentNumbers || [],
        principalOutstanding: loan.principalOutstanding || 0,
        interestOutstanding: loan.interestOutstanding || 0,
        totalOutstanding: loan.totalOutstanding || 0,
      },
      createdBy: getAuthObjectId(userId),
      updatedBy: getAuthObjectId(userId),
      isDeleted: false,
    });
  }

  if (!rows.length) {
    return {
      count: 0,
      total: 0,
    };
  }

  await TerminationLoanPayrollPendingPayment.create(rows, { session });

  return {
    count: rows.length,
    total: roundAmount(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)),
  };
};

const getTerminationLoanPendingInstallmentNumbers = (
  snapshotLoan: any,
  loanRequest: any,
) => {
  const fromSnapshot = Array.isArray(
    snapshotLoan?.metadata?.pendingInstallmentNumbers,
  )
    ? snapshotLoan.metadata.pendingInstallmentNumbers
    : [];

  if (fromSnapshot.length) {
    return fromSnapshot.map((item: any) => Number(item || 0)).filter(Boolean);
  }

  const schedule = Array.isArray(loanRequest?.amortizationSchedule)
    ? loanRequest.amortizationSchedule
    : [];

  return schedule
    .filter((installment: any) =>
      ["PENDING", "SKIPPED"].includes(
        String(installment?.status || "").toUpperCase(),
      ),
    )
    .map((installment: any) => Number(installment?.installmentNumber || 0))
    .filter(Boolean);
};

const markTerminationCoveredInstallments = ({
  loanRequest,
  amountApplied,
  paidAt,
  forceAll = false,
}: {
  loanRequest: any;
  amountApplied: number;
  paidAt: Date;
  forceAll?: boolean;
}) => {
  const schedule = Array.isArray(loanRequest?.amortizationSchedule)
    ? loanRequest.amortizationSchedule
    : [];

  if (!schedule.length) return 0;

  let availableAmount = roundAmount(amountApplied);
  let paidCount = 0;

  const pendingInstallments = schedule
    .filter((installment: any) =>
      ["PENDING", "SKIPPED"].includes(
        String(installment?.status || "").toUpperCase(),
      ),
    )
    .sort((a: any, b: any) => {
      const numberA = Number(a?.installmentNumber || 0);
      const numberB = Number(b?.installmentNumber || 0);
      return numberA - numberB;
    });

  for (const installment of pendingInstallments) {
    const installmentAmount = roundAmount(
      installment?.paymentAmount ||
        Number(installment?.principalAmount || 0) +
          Number(installment?.interestAmount || 0),
    );

    if (installmentAmount <= 0) continue;

    if (!forceAll && availableAmount + 0.009 < installmentAmount) break;

    installment.status = "PAID";
    installment.paidAt = paidAt;
    installment.payrollRun = null;

    availableAmount = roundAmount(availableAmount - installmentAmount);
    paidCount++;
  }

  if (paidCount > 0) {
    loanRequest.markModified("amortizationSchedule");
  }

  return paidCount;
};

const applyTerminationLoanSettlement = async ({
  termination,
  payment,
  userId,
  session,
}: {
  termination: any;
  payment: any;
  userId?: string | Types.ObjectId | null;
  session: mongoose.ClientSession;
}) => {
  const loans = Array.isArray(termination?.loanSnapshot?.loans)
    ? termination.loanSnapshot.loans
    : [];

  const actorObjectId =
    getAuthObjectId(userId) ||
    getAuthObjectId(termination?.updatedBy) ||
    getAuthObjectId(termination?.createdBy);

  for (const snapshotLoan of loans) {
    const amountApplied = roundAmount(snapshotLoan?.amountApplied || 0);

    if (amountApplied <= 0 || !isValidObjectId(snapshotLoan?.loanRequest)) {
      continue;
    }

    const loanRequest: any = await EmployeeLoanRequest.findOne({
      _id: snapshotLoan.loanRequest,
      isDeleted: false,
    }).session(session);

    if (!loanRequest) continue;

    const previousData = loanRequest.toObject();
    const previousStatus = String(loanRequest.status || "").toUpperCase();

    if (["CANCELLED", "CLOSED", "TERMINATED"].includes(previousStatus)) {
      continue;
    }

    const paidAt = payment?.paymentDate || termination?.paidAt || new Date();
    const totalOutstanding = roundAmount(snapshotLoan?.totalOutstanding || 0);
    const remainingOutstanding = roundAmount(
      snapshotLoan?.remainingOutstanding ??
        Math.max(0, totalOutstanding - amountApplied),
    );
    const pendingInstallmentNumbers =
      getTerminationLoanPendingInstallmentNumbers(snapshotLoan, loanRequest);

    markTerminationCoveredInstallments({
      loanRequest,
      amountApplied,
      paidAt,
      forceAll: remainingOutstanding <= 0,
    });

    const hasPendingInstallments = (
      loanRequest.amortizationSchedule || []
    ).some((installment: any) =>
      ["PENDING", "SKIPPED"].includes(
        String(installment?.status || "").toUpperCase(),
      ),
    );

    const isFullyCovered =
      remainingOutstanding <= 0 || (totalOutstanding > 0 && !hasPendingInstallments);
    const nextStatus = isFullyCovered ? "CLOSED" : "TERMINATED";

    loanRequest.status = nextStatus;
    loanRequest.updatedBy = actorObjectId || loanRequest.updatedBy;
    loanRequest.decidedAt =
      nextStatus === "CLOSED"
        ? loanRequest.decidedAt || new Date()
        : loanRequest.decidedAt;

    loanRequest.terminationSettlement = {
      isTerminated: true,
      termination: termination._id,
      terminationPayment: payment?._id || null,
      terminationDate: termination?.terminationDate || null,
      settledAt: new Date(),
      statusBeforeTermination: previousStatus,
      totalOutstandingAtTermination: totalOutstanding,
      amountDeducted: amountApplied,
      remainingOutstanding,
      pendingInstallmentsAtTermination: Number(
        snapshotLoan?.pendingInstallments || pendingInstallmentNumbers.length || 0,
      ),
      pendingInstallmentNumbers,
      paymentMethod: String(payment?.paymentMethod || "").toUpperCase(),
      notes: isFullyCovered
        ? "El balance pendiente fue retenido en la desvinculación."
        : "La desvinculación retuvo parte del balance; queda deuda pendiente fuera de nómina.",
    };

    loanRequest.markModified("terminationSettlement");

    if (actorObjectId) {
      try {
        await releaseVacationLoanReservation({
          loanRequest,
          authUserId: actorObjectId,
          session,
          reason: `Garantía liberada por desvinculación del empleado. Préstamo ${loanRequest.requestNumber}.`,
        });
      } catch (error: any) {
        loanRequest.terminationSettlement.notes = [
          loanRequest.terminationSettlement.notes,
          `No se pudo liberar la garantía automáticamente: ${
            error?.mensaje || error?.message || "error desconocido"
          }`,
        ]
          .filter(Boolean)
          .join(" ");
      }
    }

    await loanRequest.save({ session });

    await EmployeeLoanRequestHistory.create(
      [
        {
          loanRequest: loanRequest._id,
          action: nextStatus === "CLOSED" ? "CLOSED" : "STATUS_CHANGED",
          fromStatus: previousStatus,
          toStatus: nextStatus,
          comment: isFullyCovered
            ? "Préstamo cerrado por retención en la desvinculación del empleado."
            : "Préstamo marcado como desvinculado; quedó balance pendiente fuera de nómina.",
          source: "SYSTEM",
          performedBy: actorObjectId,
          previousData: {
            status: previousData.status,
            terminationSettlement: previousData.terminationSettlement || null,
          },
          newData: {
            status: loanRequest.status,
            terminationSettlement: loanRequest.terminationSettlement,
          },
          metadata: {
            termination: termination._id,
            terminationPayment: payment?._id || null,
            amountApplied,
            totalOutstanding,
            remainingOutstanding,
            requestNumber: loanRequest.requestNumber,
          },
        },
      ],
      { session },
    );
  }
};

export const findActiveLaborTerminationPolicyRD = async (payload: {
  company?: string | Types.ObjectId | null;
  date?: Date;
}) => {
  const date = payload.date || new Date();
  const companyId = toObjectIdOrNull(payload.company);

  const baseQuery = {
    isActive: true,
    isDeleted: false,
    effectiveFrom: { $lte: date },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: date } }],
  };

  if (companyId) {
    const companyPolicy = await LaborTerminationPolicyRD.findOne({
      ...baseQuery,
      company: companyId,
    }).sort({ effectiveFrom: -1, version: -1 });

    if (companyPolicy) return companyPolicy;
  }

  return LaborTerminationPolicyRD.findOne({
    ...baseQuery,
    company: null,
  }).sort({ effectiveFrom: -1, version: -1 });
};

const getEmployeeOrThrow = async (employeeId: string) => {
  if (!isValidObjectId(employeeId)) {
    throw Object.assign(new Error("Empleado inválido."), { status: 400 });
  }

  const employee = await User.findOne({
    _id: employeeId,
    isDeleted: false,
  })
    .select("-password")
    .populate("company")
    .populate("department")
    .populate("jobPosition")
    .populate("project")
    .populate("salaryType")
    .populate("paymentSchedule");

  if (!employee) {
    throw Object.assign(new Error("Empleado no encontrado."), { status: 404 });
  }

  return employee as any;
};

const getRuleOrThrow = (policy: any, terminationType: TerminationTypeCode) => {
  const rule = policy.terminationTypeRules?.find(
    (item: any) => item.code === terminationType && item.isActive !== false,
  );

  if (!rule) {
    throw Object.assign(
      new Error("No hay una regla activa para este tipo de desvinculación."),
      { status: 400 },
    );
  }

  return rule;
};

const calculateSalaryInfo = async (payload: {
  employee: any;
  companyId: string;
  terminationDate: Date;
  salaryBaseMode: string;
  dailySalaryDivisor: number;
}) => {
  const currentSalary = Number(payload.employee?.baseSalary || 0);
  const hourlyRate = Number(payload.employee?.hourlyRate || 0);
  const last12MonthsStart = getLast12MonthsStart(payload.terminationDate);

  const histories = await EmployeeSalaryHistory.find({
    company: payload.companyId,
    employee: payload.employee._id,
    isDeleted: false,
    isOrdinarySalary: true,
    effectiveFrom: { $lte: payload.terminationDate },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: last12MonthsStart } }],
  }).sort({ effectiveFrom: 1 });

  const lastHistory = await EmployeeSalaryHistory.findOne({
    company: payload.companyId,
    employee: payload.employee._id,
    isDeleted: false,
    effectiveFrom: { $lte: payload.terminationDate },
  }).sort({ effectiveFrom: -1 });

  const lastSalary = Number(
    lastHistory?.salaryAmount || lastHistory?.baseSalary || currentSalary || 0,
  );

  const averageOrdinarySalary = calculateWeightedAverageMonthlySalary({
    histories,
    periodStart: last12MonthsStart,
    periodEnd: payload.terminationDate,
    fallbackSalary: currentSalary || lastSalary,
  });

  let selectedMonthlySalary = currentSalary;

  if (payload.salaryBaseMode === "AVERAGE_LAST_12_MONTHS_ORDINARY") {
    selectedMonthlySalary = averageOrdinarySalary;
  }

  if (payload.salaryBaseMode === "LAST_SALARY") {
    selectedMonthlySalary = lastSalary;
  }

  if (payload.salaryBaseMode === "CURRENT_SALARY") {
    selectedMonthlySalary = currentSalary;
  }

  const dailySalary =
    selectedMonthlySalary / Number(payload.dailySalaryDivisor || 23.83);

  return {
    currentSalary,
    lastSalary,
    averageOrdinarySalary,
    selectedMonthlySalary,
    dailySalary,
    hourlyRate,
  };
};

const calculateVacationLine = async (payload: {
  companyId: string;
  employeeId: string;
  terminationDate: Date;
  dailySalary: number;
  createdBy?: Types.ObjectId | null;
}) => {
  const accruals = await PayrollAccrual.find({
    company: payload.companyId,
    employee: payload.employeeId,
    type: "VACATION",
    isDeleted: false,
    status: { $in: ["OPEN", "PARTIALLY_PAID"] },
    periodStart: { $lte: payload.terminationDate },
  });

  const pendingAmount = accruals.reduce(
    (sum, item) => sum + Number(item.pendingAmount || 0),
    0,
  );

  const pendingDays = accruals.reduce(
    (sum, item) => sum + Number(item.pendingDays || 0),
    0,
  );

  if (pendingAmount <= 0 && pendingDays <= 0) return null;

  const amount =
    pendingAmount > 0 ? pendingAmount : pendingDays * payload.dailySalary;

  return buildTerminationLine({
    code: "VACATION",
    label: "Vacaciones pendientes",
    type: "EARNING",
    source: "AUTOMATIC",
    amount,
    days: pendingDays,
    dailySalary: payload.dailySalary,
    baseSalary: amount,
    createdBy: payload.createdBy || null,
    notes: "Calculado desde acumulados de vacaciones.",
    metadata: {
      accrualIds: accruals.map((item) => item._id),
    },
  });
};

const calculateChristmasSalaryLine = async (payload: {
  companyId: string;
  employeeId: string;
  hiringDate: Date;
  terminationDate: Date;
  monthlySalary: number;
  christmasSalaryRule: any;
  seniorityTotalMonths: number;
  createdBy?: Types.ObjectId | null;
}) => {
  const rule = payload.christmasSalaryRule;

  if (!rule?.enabled) return null;

  if (
    Number(rule.minimumWorkedMonthsToPay || 0) > 0 &&
    payload.seniorityTotalMonths < Number(rule.minimumWorkedMonthsToPay)
  ) {
    return null;
  }

  if (
    rule.allowExcludeBeforeProbationEnds &&
    isBeforeProbationEnd({
      hiringDate: payload.hiringDate,
      terminationDate: payload.terminationDate,
      probationMonths: Number(rule.probationMonths || 3),
    })
  ) {
    return null;
  }

  const year = payload.terminationDate.getFullYear();

  const accruals = await PayrollAccrual.find({
    company: payload.companyId,
    employee: payload.employeeId,
    type: "CHRISTMAS_SALARY",
    year,
    isDeleted: false,
    status: { $in: ["OPEN", "PARTIALLY_PAID"] },
  });

  const pendingFromAccrual = accruals.reduce(
    (sum, item) => sum + Number(item.pendingAmount || 0),
    0,
  );

  let amount = pendingFromAccrual;

  if (amount <= 0) {
    const ordinarySalaryEarned = calculateEstimatedOrdinarySalaryEarnedYTD({
      hiringDate: payload.hiringDate,
      terminationDate: payload.terminationDate,
      monthlySalary: payload.monthlySalary,
    });

    amount = ordinarySalaryEarned / 12;
  }

  if (amount <= 0) return null;

  return buildTerminationLine({
    code: "CHRISTMAS_SALARY",
    label: "Regalía pascual / salario de Navidad",
    type: "EARNING",
    source: "AUTOMATIC",
    amount,
    baseSalary: payload.monthlySalary,
    createdBy: payload.createdBy || null,
    notes:
      pendingFromAccrual > 0
        ? "Calculado desde acumulados de regalía."
        : "Estimado como salario ordinario devengado en el año / 12.",
    metadata: {
      year,
      accrualIds: accruals.map((item) => item._id),
      usedAccrual: pendingFromAccrual > 0,
    },
  });
};

const validateAndBuildManualLines = (payload: {
  manualLines?: CalculateEmployeeTerminationInput["manualLines"];
  manualAdjustmentRules: any;
  createdBy?: Types.ObjectId | null;
}) => {
  const lines: ITerminationCalculationLine[] = [];

  for (const item of payload.manualLines || []) {
    const amount = Number(item.amount || 0);

    if (amount <= 0) continue;

    if (item.code === "EMPLOYEE_LOAN") {
      throw Object.assign(
        new Error(
          "El préstamo del empleado se calcula automáticamente y no puede agregarse manualmente.",
        ),
        {
          status: 400,
        },
      );
    }

    if (item.type === "EARNING") {
      if (!payload.manualAdjustmentRules?.allowManualEarnings) {
        throw Object.assign(
          new Error("La política no permite pagos adicionales manuales."),
          { status: 400 },
        );
      }

      const allowed = payload.manualAdjustmentRules?.allowedEarningCodes || [];

      if (!allowed.includes(item.code)) {
        throw Object.assign(
          new Error(
            `El concepto ${item.code} no está permitido como ingreso manual.`,
          ),
          { status: 400 },
        );
      }
    }

    if (item.type === "DEDUCTION") {
      if (!payload.manualAdjustmentRules?.allowManualDeductions) {
        throw Object.assign(
          new Error("La política no permite deducciones manuales."),
          { status: 400 },
        );
      }

      const allowed =
        payload.manualAdjustmentRules?.allowedDeductionCodes || [];

      if (!allowed.includes(item.code)) {
        throw Object.assign(
          new Error(
            `El concepto ${item.code} no está permitido como deducción manual.`,
          ),
          { status: 400 },
        );
      }
    }

    if (
      payload.manualAdjustmentRules?.requireReasonForManualAdjustment &&
      !item.reason
    ) {
      throw Object.assign(
        new Error("Debe indicar una razón para cada ajuste manual."),
        { status: 400 },
      );
    }

    lines.push(
      normalizeManualTerminationLine({
        code: item.code,
        label: item.label,
        type: item.type,
        amount,
        reason: item.reason || "",
        notes: item.notes || "",
        createdBy: payload.createdBy || null,
        requiresApproval:
          payload.manualAdjustmentRules?.requireApprovalForManualAdjustment ??
          true,
      }),
    );
  }

  return lines;
};

export const calculateEmployeeTerminationData = async (
  input: CalculateEmployeeTerminationInput,
) => {
  if (!isValidObjectId(input.companyId)) {
    throw Object.assign(new Error("Compañía inválida."), { status: 400 });
  }

  if (!isValidObjectId(input.employeeId)) {
    throw Object.assign(new Error("Empleado inválido."), { status: 400 });
  }

  const companyId = new Types.ObjectId(input.companyId);
  const employeeId = new Types.ObjectId(input.employeeId);
  const calculatedBy = getAuthObjectId(input.calculatedBy);

  const terminationDate = asDate(input.terminationDate);
  const noticeDate = input.noticeDate ? asDate(input.noticeDate) : null;

  const employee = await getEmployeeOrThrow(input.employeeId);

  const policy = await findActiveLaborTerminationPolicyRD({
    company: companyId,
    date: terminationDate,
  });

  if (!policy) {
    throw Object.assign(
      new Error("No existe una política activa de desvinculación laboral."),
      { status: 400 },
    );
  }

  const rule = getRuleOrThrow(policy, input.terminationType);
  const hiringDate = asDate(employee.hiringDate);
  const senioritySnapshot = buildSenioritySnapshot(hiringDate, terminationDate);

  //   const salaryInfo = await calculateSalaryInfo({
  //     employee,
  //     companyId: input.companyId,
  //     terminationDate,
  //     salaryBaseMode: policy.salaryBaseMode,
  //     dailySalaryDivisor: policy.dailySalaryDivisor,
  //   });

  const salaryInfo = await calculateTerminationSalaryBases({
    companyId: input.companyId,
    employee,
    hiringDate,
    terminationDate,
    dailySalaryDivisor: Number(policy.dailySalaryDivisor || 23.83),
    salaryBaseMode: policy.salaryBaseMode,
  });

  const salarySnapshot = buildSalarySnapshot({
    salaryBaseMode: salaryInfo.salaryBaseMode || policy.salaryBaseMode,

    currentSalary:
      salaryInfo.selectedMonthlySalary ||
      employee?.baseSalary ||
      employee?.salaryAmount ||
      0,

    lastSalary:
      salaryInfo.selectedMonthlySalary || salaryInfo.averageOrdinarySalary || 0,

    selectedMonthlySalary: salaryInfo.selectedMonthlySalary,
    averageOrdinarySalary: salaryInfo.averageOrdinarySalary,
    dailySalary: salaryInfo.dailySalary,
    dailySalaryDivisor: Number(policy.dailySalaryDivisor || 23.83),

    hourlyRate: employee?.hourlyRate || 0,

    paymentSchedule:
      employee?.paymentSchedule?.name || employee?.paymentSchedule?.code || "",

    salaryType: employee?.salaryType?.name || employee?.salaryType?.code || "",

    strategy: salaryInfo.strategy,
    source: salaryInfo.source,
    fallbackUsed: salaryInfo.fallbackUsed,

    ordinarySalaryLast12Months: salaryInfo.ordinarySalaryLast12Months,
    monthsComputed: salaryInfo.monthsComputed,

    christmasSalaryEarnedYTD: salaryInfo.christmasSalaryEarnedYTD,
    christmasSalaryAmount: salaryInfo.christmasSalaryAmount,
    christmasSalarySource: salaryInfo.christmasSalarySource,

    payrollPaymentsCount: salaryInfo.payrollPaymentsCount,
    christmasPayrollPaymentsCount: salaryInfo.christmasPayrollPaymentsCount,

    terminationAverageDetails: salaryInfo.terminationAverageDetails,
    christmasSalaryDetails: salaryInfo.christmasSalaryDetails,
  });

  const includeOverrides = input.includeOverrides || {};

  const includePendingSalary = resolveInclude(
    rule.includePendingSalary,
    includeOverrides.includePendingSalary,
  );

  const includeSeverance = resolveInclude(
    rule.includeSeverance,
    includeOverrides.includeSeverance,
  );

  const includePreNotice = resolveInclude(
    rule.includePreNotice,
    includeOverrides.includePreNotice,
  );

  const includeVacation = resolveInclude(
    rule.includeVacation,
    includeOverrides.includeVacation,
  );

  const includeChristmasSalary = resolveInclude(
    rule.includeChristmasSalary,
    includeOverrides.includeChristmasSalary,
  );

  const includeEconomicAssistance = resolveInclude(
    rule.includeEconomicAssistance,
    includeOverrides.includeEconomicAssistance,
  );

  const lines: ITerminationCalculationLine[] = [];

  if (includePendingSalary && Number(input.pendingSalaryAmount || 0) > 0) {
    lines.push(
      buildTerminationLine({
        code: "PENDING_SALARY",
        label: "Salario pendiente",
        type: "EARNING",
        source: "AUTOMATIC",
        amount: Number(input.pendingSalaryAmount || 0),
        createdBy: calculatedBy,
        notes: "Monto recibido desde el input.",
      }),
    );
  }

  if (includePreNotice) {
    const preNoticeDays = calculatePreNoticeDays(
      policy.preNoticeBrackets || [],
      senioritySnapshot.totalMonths,
    );

    const shouldPayPreNotice =
      includeOverrides.includePreNotice === true || !input.noticeGiven;

    if (preNoticeDays > 0 && shouldPayPreNotice) {
      lines.push(
        buildTerminationLine({
          code: "PRE_NOTICE",
          label: "Preaviso",
          type: "EARNING",
          source: "AUTOMATIC",
          amount: preNoticeDays * salaryInfo.dailySalary,
          days: preNoticeDays,
          dailySalary: salaryInfo.dailySalary,
          baseSalary: salaryInfo.selectedMonthlySalary,
          createdBy: calculatedBy,
          notes: "Calculado según escala de preaviso.",
        }),
      );
    }
  }

  if (rule.deductPreNoticeIfEmployeeDidNotNotify && !input.noticeGiven) {
    const preNoticeDays = calculatePreNoticeDays(
      policy.preNoticeBrackets || [],
      senioritySnapshot.totalMonths,
    );

    if (preNoticeDays > 0) {
      lines.push(
        buildTerminationLine({
          code: "PRE_NOTICE",
          label: "Descuento por falta de preaviso",
          type: "DEDUCTION",
          source: "AUTOMATIC",
          amount: preNoticeDays * salaryInfo.dailySalary,
          days: preNoticeDays,
          dailySalary: salaryInfo.dailySalary,
          baseSalary: salaryInfo.selectedMonthlySalary,
          createdBy: calculatedBy,
          notes:
            "Aplicado porque la política descuenta preaviso cuando el empleado no notifica.",
        }),
      );
    }
  }

  if (includeSeverance) {
    const severanceDays = calculateSeveranceDays({
      brackets: policy.severanceBrackets || [],
      totalMonths: senioritySnapshot.totalMonths,
      totalDays: senioritySnapshot.totalDays,
    });

    if (severanceDays > 0) {
      lines.push(
        buildTerminationLine({
          code: "SEVERANCE",
          label: "Cesantía",
          type: "EARNING",
          source: "AUTOMATIC",
          amount: severanceDays * salaryInfo.dailySalary,
          days: severanceDays,
          dailySalary: salaryInfo.dailySalary,
          baseSalary: salaryInfo.selectedMonthlySalary,
          createdBy: calculatedBy,
          notes: "Calculado según escala de cesantía.",
        }),
      );
    }
  }

  if (includeVacation && policy.vacationRule?.enabled) {
    const vacationLine = await calculateVacationLine({
      companyId: input.companyId,
      employeeId: input.employeeId,
      terminationDate,
      dailySalary: salaryInfo.dailySalary,
      createdBy: calculatedBy,
    });

    if (vacationLine) lines.push(vacationLine);
  }

  if (includeChristmasSalary && policy.christmasSalaryRule?.enabled) {
    const christmasLine = await calculateChristmasSalaryLine({
      companyId: input.companyId,
      employeeId: input.employeeId,
      hiringDate,
      terminationDate,
      monthlySalary: salaryInfo.selectedMonthlySalary,
      christmasSalaryRule: policy.christmasSalaryRule,
      seniorityTotalMonths: senioritySnapshot.totalMonths,
      createdBy: calculatedBy,
    });

    if (christmasLine) lines.push(christmasLine);
  }

  if (includeEconomicAssistance) {
    // Aquí se conecta la lógica de asistencia económica si luego decides agregarla.
  }

  const manualLines = validateAndBuildManualLines({
    manualLines: input.manualLines,
    manualAdjustmentRules: policy.manualAdjustmentRules,
    createdBy: calculatedBy,
  });

  lines.push(...manualLines);

  /**
   * Primero calculamos los totales sin incluir préstamos.
   * Esto permite limitar la deducción al dinero realmente disponible
   * y evitar que el neto resulte negativo.
   */
  const roundedLinesBeforeLoan = lines.map((line) => ({
    ...line,

    amount: roundAmount(line.amount, policy.roundingMode),

    days: roundAmount(Number(line.days || 0), "ROUND_2_DECIMALS"),

    dailySalary: roundAmount(
      Number(line.dailySalary || 0),
      policy.roundingMode,
    ),

    baseSalary: roundAmount(Number(line.baseSalary || 0), policy.roundingMode),
  }));

  const totalsBeforeLoan = calculateTotalsFromLines(
    roundedLinesBeforeLoan,
    policy.roundingMode,
  );

  const availableForLoanDeduction = Math.max(
    0,
    roundAmount(
      Number(totalsBeforeLoan.totalIncome || 0) -
        Number(totalsBeforeLoan.totalDeductions || 0),
      policy.roundingMode,
    ),
  );

  const loanSnapshot = await getEmployeeLoanTerminationSummary({
    companyId,
    employeeId,
    maximumDeductionAmount: availableForLoanDeduction,
  });

  if (
    loanSnapshot.hasActiveLoans &&
    Number(loanSnapshot.totalDeducted || 0) > 0
  ) {
    lines.push(
      buildTerminationLine({
        code: "EMPLOYEE_LOAN",
        label:
          loanSnapshot.totalLoans > 1
            ? "Balance pendiente de préstamos"
            : "Balance pendiente de préstamo",

        type: "DEDUCTION",
        source: "AUTOMATIC",

        amount: loanSnapshot.totalDeducted,

        taxable: false,
        affectsNetTotal: true,
        requiresApproval: false,

        createdBy: calculatedBy,

        reason:
          "Descuento automático del balance pendiente de préstamos activos.",

        notes:
          loanSnapshot.remainingOutstanding > 0
            ? `La liquidación no cubre la deuda completa. Balance restante: ${loanSnapshot.remainingOutstanding}.`
            : "La liquidación cubre el balance pendiente de los préstamos.",

        metadata: {
          loanIds: loanSnapshot.loans.map((loan: any) => loan.loanRequest),

          requestNumbers: loanSnapshot.loans.map(
            (loan: any) => loan.requestNumber,
          ),

          totalLoans: loanSnapshot.totalLoans,

          totalPrincipalOutstanding: loanSnapshot.totalPrincipalOutstanding,

          totalInterestOutstanding: loanSnapshot.totalInterestOutstanding,

          totalOutstanding: loanSnapshot.totalOutstanding,

          totalDeducted: loanSnapshot.totalDeducted,

          remainingOutstanding: loanSnapshot.remainingOutstanding,

          totalPendingInstallments: loanSnapshot.totalPendingInstallments,

          totalGuaranteedDays: loanSnapshot.totalGuaranteedDays,
        },
      }),
    );
  }

  const roundedLines = lines.map((line) => ({
    ...line,

    amount: roundAmount(line.amount, policy.roundingMode),

    days: roundAmount(Number(line.days || 0), "ROUND_2_DECIMALS"),

    dailySalary: roundAmount(
      Number(line.dailySalary || 0),
      policy.roundingMode,
    ),

    baseSalary: roundAmount(Number(line.baseSalary || 0), policy.roundingMode),
  }));

  const totals = calculateTotalsFromLines(roundedLines, policy.roundingMode);

  return {
    employee,
    policy,
    rule,
    terminationPayload: {
      company: companyId,
      employee: employeeId,

      policy: policy._id,
      policyVersion: policy.version,

      terminationType: input.terminationType,
      reason: input.reason || "",

      hiringDate,
      terminationDate,

      noticeGiven: Boolean(input.noticeGiven),
      noticeDate,

      includeOverrides: {
        includePendingSalary: includeOverrides.includePendingSalary ?? null,
        includeSeverance: includeOverrides.includeSeverance ?? null,
        includePreNotice: includeOverrides.includePreNotice ?? null,
        includeVacation: includeOverrides.includeVacation ?? null,
        includeChristmasSalary: includeOverrides.includeChristmasSalary ?? null,
        includeEconomicAssistance:
          includeOverrides.includeEconomicAssistance ?? null,
        overrideReason: includeOverrides.overrideReason || "",
      },

      employeeSnapshot: buildEmployeeSnapshot(employee),
      salarySnapshot,
      senioritySnapshot,
      loanSnapshot,

      calculation: {
        ...totals,
        lines: roundedLines,
        calculatedAt: new Date(),
        calculatedBy,
      },
    },
  };
};

export const previewEmployeeTermination = async (
  input: CalculateEmployeeTerminationInput,
) => {
  const data = await calculateEmployeeTerminationData(input);

  return {
    policy: data.policy,
    rule: data.rule,

    employeeSnapshot: data.terminationPayload.employeeSnapshot,

    salarySnapshot: data.terminationPayload.salarySnapshot,

    senioritySnapshot: data.terminationPayload.senioritySnapshot,

    loanSnapshot: data.terminationPayload.loanSnapshot,

    calculation: data.terminationPayload.calculation,
  };
};

export const createEmployeeTermination = async (
  input: CalculateEmployeeTerminationInput,
) => {
  const data = await calculateEmployeeTerminationData(input);

  return EmployeeTermination.create({
    ...data.terminationPayload,
    status: "CALCULATED",
    isDeleted: false,
    createdBy: getAuthObjectId(input.calculatedBy),
  });
};

export const recalculateEmployeeTermination = async (
  id: string,
  body: any,
  userId?: string | Types.ObjectId | null,
) => {
  if (!isValidObjectId(id)) {
    throw Object.assign(new Error("ID inválido."), { status: 400 });
  }

  const termination: any = await EmployeeTermination.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!termination) {
    throw Object.assign(new Error("Desvinculación no encontrada."), {
      status: 404,
    });
  }

  if (["APPROVED", "PAID", "CANCELLED"].includes(termination.status)) {
    throw Object.assign(
      new Error(
        "No se puede recalcular una desvinculación aprobada, pagada o cancelada.",
      ),
      { status: 400 },
    );
  }

  const input: CalculateEmployeeTerminationInput = {
    companyId: String(termination.company),
    employeeId: String(termination.employee),
    terminationType: body.terminationType || termination.terminationType,
    terminationDate: body.terminationDate || termination.terminationDate,
    reason: body.reason ?? termination.reason,
    noticeGiven: body.noticeGiven ?? termination.noticeGiven,
    noticeDate: body.noticeDate ?? termination.noticeDate,
    includeOverrides: body.includeOverrides || termination.includeOverrides,
    pendingSalaryAmount: body.pendingSalaryAmount || 0,
    manualLines:
      body.manualLines ||
      termination.calculation.lines.filter(
        (line: any) => line.source === "MANUAL",
      ),
    calculatedBy: userId || null,
  };

  const data = await calculateEmployeeTerminationData(input);

  termination.set({
    ...data.terminationPayload,
    status: "CALCULATED",
    updatedBy: getAuthObjectId(userId),
  });

  await termination.save();

  return termination;
};

export const markEmployeeTerminationAsPaid = async (
  id: string,
  body: any,
  userId?: string | Types.ObjectId | null,
) => {
  if (!isValidObjectId(id)) {
    throw Object.assign(new Error("ID inválido."), { status: 400 });
  }

  const session = await mongoose.startSession();

  try {
    let result: any = null;

    await session.withTransaction(async () => {
      const termination: any = await EmployeeTermination.findOne({
        _id: id,
        isDeleted: false,
      }).session(session);

      if (!termination) {
        throw Object.assign(new Error("Desvinculación no encontrada."), {
          status: 404,
        });
      }

      if (termination.status !== "APPROVED") {
        throw Object.assign(
          new Error(
            "Solo se puede marcar como pagada una desvinculación aprobada.",
          ),
          { status: 400 },
        );
      }

      const paymentAmount = Number(
        body.amount || termination.calculation.netTotal || 0,
      );

      if (paymentAmount <= 0) {
        throw Object.assign(
          new Error("El monto de pago debe ser mayor a cero."),
          { status: 400 },
        );
      }

      const [payment] = await TerminationPayment.create(
        [
          {
            company: termination.company,
            employee: termination.employee,
            termination: termination._id,

            amount: paymentAmount,
            paymentDate: body.paymentDate
              ? new Date(body.paymentDate)
              : new Date(),

            paymentMethod: body.paymentMethod || "PAYROLL",
            status: "PAID",

            referenceNumber: body.referenceNumber || "",
            bankAuthorizationNumber: "",
            notes: body.notes || "",

            createdBy: getAuthObjectId(userId),
            isDeleted: false,
          },
        ],
        { session },
      );

      if (payment.paymentMethod !== "BANK_TRANSFER") {
        const pendingLoanPayment =
          await createTerminationLoanPayrollPendingPayments({
            termination,
            payment,
            userId,
            session,
          });

        payment.loanPayrollPendingCount = pendingLoanPayment.count;
        payment.loanPayrollPendingTotal = pendingLoanPayment.total;

        if (pendingLoanPayment.count > 0) {
          payment.notes = [
            payment.notes,
            `${pendingLoanPayment.count} pago(s) de préstamo por ${roundAmount(
              pendingLoanPayment.total,
            )} quedaron pendientes para enviarse al prestamista en el próximo TXT de nómina.`,
          ]
            .filter(Boolean)
            .join("\n");
        }

        await payment.save({ session });
      }

      await applyTerminationLoanSettlement({
        termination,
        payment,
        userId,
        session,
      });

      termination.status = "PAID";
      termination.paidAt = body.paymentDate
        ? new Date(body.paymentDate)
        : new Date();
      termination.updatedBy = getAuthObjectId(userId) as any;

      await termination.save({ session });

      await User.updateOne(
        { _id: termination.employee },
        {
          $set: {
            employmentStatus: "TERMINATED",
            isActived: false,
            terminationDate: termination.terminationDate.toISOString(),
            terminationInfo: {
              lastTermination: termination._id,
              terminationDate: termination.terminationDate.toISOString(),
              terminationType: termination.terminationType,
              terminationReason: termination.reason || "",
              terminatedBy: getAuthObjectId(userId),
              terminatedAt: new Date(),
            },
          },
        },
        { session },
      );

      result = {
        termination,
        payment,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const generateEmployeeTerminationBankFile = async (
  id: string,
  body: any = {},
  userId?: string | Types.ObjectId | null,
) => {
  if (!isValidObjectId(id)) {
    throw Object.assign(new Error("ID inválido."), { status: 400 });
  }

  const session = await mongoose.startSession();

  try {
    let result: any = null;

    await session.withTransaction(async () => {
      const termination: any = await EmployeeTermination.findOne({
        _id: id,
        isDeleted: false,
      }).session(session);

      if (!termination) {
        throw Object.assign(new Error("Desvinculación no encontrada."), {
          status: 404,
        });
      }

      if (termination.status !== "PAID") {
        throw Object.assign(
          new Error("Debe registrar el pago antes de generar el TXT bancario."),
          { status: 400 },
        );
      }

      const payment: any = await TerminationPayment.findOne({
        termination: termination._id,
        isDeleted: false,
        status: "PAID",
      })
        .sort({ createdAt: -1 })
        .session(session);

      if (!payment) {
        throw Object.assign(
          new Error("No hay un pago registrado para esta desvinculación."),
          { status: 404 },
        );
      }

      if (payment.paymentMethod !== "BANK_TRANSFER") {
        throw Object.assign(
          new Error("El TXT bancario solo aplica para pagos por transferencia."),
          { status: 400 },
        );
      }

      const employee: any = await User.findOne({
        _id: termination.employee,
        isDeleted: false,
      })
        .lean()
        .select("-password")
        .session(session);

      if (!employee) {
        throw Object.assign(new Error("Empleado no encontrado."), {
          status: 404,
        });
      }

      const bankOverride = cleanBankOverride(body.bankOverride || body.bank || {});
      const bank = getResolvedBankInfo(employee, bankOverride);

      const missingBankFields = getMissingTerminationBankFields(bank);

      if (missingBankFields.length) {
        throw Object.assign(
          new Error(
            `Faltan datos bancarios para generar el TXT: ${missingBankFields.join(", ")}.`,
          ),
          { status: 400 },
        );
      }

      const profileId = body.profileId;

      if (profileId && !isValidObjectId(profileId)) {
        throw Object.assign(new Error("profileId inválido."), { status: 400 });
      }

      const profile: any = profileId
        ? await CompanyProfile.findOne({
            _id: profileId,
            isDeleted: false,
          }).session(session)
        : await CompanyProfile.findOne({
            code: "DEFAULT",
            isDeleted: false,
          }).session(session);

      if (!profile) {
        throw Object.assign(
          new Error(
            "No existe CompanyProfile activo para generar el archivo bancario.",
          ),
          { status: 404 },
        );
      }

      const nowYYYYMMDD = moment().format("YYYYMMDD");
      const lastDate = String(profile.lastSequenceDate || "");
      const lastNum = Number(profile.lastSequenceNumber || 0);
      const headerSeqNum = lastDate === nowYYYYMMDD ? lastNum + 1 : 1;
      const headerSequence7 = String(headerSeqNum).padStart(7, "0");

      profile.lastSequenceDate = nowYYYYMMDD;
      profile.lastSequenceNumber = headerSeqNum;
      await profile.save({ session });

      const paymentDate = payment.paymentDate || termination.paidAt || new Date();
      const paymentDateFormatted = moment(paymentDate)
        .locale("es")
        .format("D [de] MMM YYYY");

      const tipoServicio2 = String(body.tipoServicio || profile.serviceCode || "01")
        .trim()
        .slice(0, 2)
        .padStart(2, "0") as any;

      const bankFilePayments: any[] = [
        {
          _id: payment._id,
          user: employee._id,
          employeeName:
            bank.beneficiaryName ||
            termination.employeeSnapshot?.fullName ||
            employee.name ||
            "",
          snapshot: {
            totals: {
              sueldoNetoPeriodo: Number(payment.amount || 0),
            },
          },
          bankSnapshot: bank,
        },
      ];

      for (const [index, loan] of (termination.loanSnapshot?.loans || []).entries()) {
        const amountApplied = Number(loan?.amountApplied || 0);

        if (amountApplied <= 0) continue;

        const loanBank = buildLoanBankSnapshot(loan, index);
        const missingLoanBankFields = [
          !loanBank.accountNumber ? "cuenta" : "",
          !loanBank.bankCode ? "banco" : "",
          !loanBank.operationCode ? "operación" : "",
        ].filter(Boolean);

        if (missingLoanBankFields.length) {
          throw Object.assign(
            new Error(
              `El préstamo ${loan.requestNumber || index + 1} no tiene datos bancarios completos en el producto (${missingLoanBankFields.join(", ")}).`,
            ),
            { status: 400 },
          );
        }

        bankFilePayments.push({
          _id: `${payment._id}-loan-${index + 1}`,
          user: loan.loanRequest,
          employeeName:
            loan?.metadata?.interestBankAccount?.beneficiaryName ||
            loan.productName ||
            `Prestamo ${index + 1}`,
          snapshot: {
            totals: {
              sueldoNetoPeriodo: amountApplied,
            },
          },
          bankSnapshot: loanBank,
        });
      }

      const file = await buildPayrollBankFile({
        companyAssignedNumber5: String(profile.agreementCode || "").trim(),

        header: {
          companyRNC: String(profile.taxId || "").trim().replace(/\D/g, ""),
          companyName: String(
            profile.legalName || profile.tradeName || "",
          ).trim(),
          headerSequence7,
          tipoServicio2,
          effectiveDateYYYYMMDD: moment(paymentDate).format("YYYYMMDD"),
          resultsEmail40: String(profile.email || "").trim(),
          companyAccountToUse1: " ",
          numeroAfiliacion15: "",
          sendDateYYYYMMDD: "",
          sendTimeHHMM: "",
        },

        payments: bankFilePayments,
        includeZeroNet: false,

        bankResolver: (p) => {
          const b = p.bankSnapshot || {};

          return {
            accountNumber20: b.accountNumber || "",
            accountType1: b.accountType || "",
            currency3: b.currency || profile.currency || "214",
            bankCode8: b.bankCode || "",
            bankDigit1: b.bankDigit || "",
            operationCode2: b.operationCode || "",

            idType2: b.idType || "",
            idNumber15: b.idNumber || "",
            beneficiaryName35: b.beneficiaryName || p.employeeName || "",

            reference12:
              String(body.referenceNumber || payment.referenceNumber || b.referenceNumber || "")
                .trim()
                .slice(0, 12),
            description40:
              String(body.description || b.statementDescription || "")
                .trim()
                .slice(0, 40) ||
              `Pago desvinculacion ${paymentDateFormatted}`,
            dueDate4: b.dueDate4 || "",

            contactMethod1: b.contactMethod || "",
            emailBenef40: b.emailBenef || "",
            faxOrPhone12: b.faxOrPhoneBenef || "",
            acquirerId2: b.acquirerId || "00",
          };
        },
      });

      payment.bankFileName = file.fileName;
      payment.bankFileContent = file.content;
      payment.bankFileSha256 = file.sha256;
      payment.bankFileGeneratedAt = new Date();
      payment.bankFileGeneratedBy = getAuthObjectId(userId);
      payment.bankFileHeaderSequence = headerSequence7;
      payment.bankFileWarnings = file.warnings;
      payment.bankFileTotals = file.totals;
      payment.bankOverride = bankOverride;

      await payment.save({ session });

      result = {
        termination,
        payment,
        bankFile: {
          fileName: file.fileName,
          content: file.content,
          sha256: file.sha256,
          totals: file.totals,
          warnings: file.warnings,
          generatedAt: payment.bankFileGeneratedAt,
        },
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const getEmployeeTerminationLoanSummary = async (payload: {
  companyId: string;
  employeeId: string;
}) => {
  if (!isValidObjectId(payload.companyId)) {
    throw Object.assign(new Error("Compañía inválida."), {
      status: 400,
    });
  }

  if (!isValidObjectId(payload.employeeId)) {
    throw Object.assign(new Error("Empleado inválido."), {
      status: 400,
    });
  }

  return getEmployeeLoanTerminationSummary({
    companyId: payload.companyId,
    employeeId: payload.employeeId,
  });
};
