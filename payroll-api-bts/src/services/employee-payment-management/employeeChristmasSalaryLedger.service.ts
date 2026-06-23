import { ClientSession, Types } from "mongoose";
import PayrollAccrual, {
  PayrollAccrualMovementType,
  PayrollAccrualSource,
  PayrollAccrualStatus,
} from "../../model/employee-termination/payrollAccrual";
import EmployeeChristmasSalaryBalance from "../../model/employee-payment-management/employeeChristmasSalaryBalance";
import PayrollPayment from "../../model/employee-payment-management/payrollPayment";

export type ChristmasSalaryMovementImpact = {
  ordinarySalaryEarnedAmount: number;
  accruedChristmasSalaryAmount: number;
  paidChristmasSalaryAmount: number;
  appliedToTerminationAmount: number;
  reservedGuaranteeAmount: number;
};

type ChristmasSalaryReferenceIds = {
  payrollRun?: Types.ObjectId | string | null;
  payrollPayment?: Types.ObjectId | string | null;
  termination?: Types.ObjectId | string | null;
  loanRequest?: Types.ObjectId | string | null;
  guaranteeReservation?: Types.ObjectId | string | null;
  reversesAccrual?: Types.ObjectId | string | null;
};

type RegisterChristmasSalaryMovementInput = ChristmasSalaryReferenceIds & {
  company: Types.ObjectId | string;
  employee: Types.ObjectId | string;
  year: number;
  month?: number | null;
  periodStart: Date;
  periodEnd: Date;
  movementType: PayrollAccrualMovementType;
  idempotencyKey: string;
  impact: ChristmasSalaryMovementImpact;
  source?: PayrollAccrualSource;
  status?: PayrollAccrualStatus;
  installmentNumber?: number | null;
  effectiveAt?: Date | null;
  notes?: string;
  metadata?: Record<string, any>;
  createdBy?: Types.ObjectId | string | null;
  updatedBy?: Types.ObjectId | string | null;
  session?: ClientSession | null;
};

type BalanceLookupInput = {
  company: Types.ObjectId | string;
  employee: Types.ObjectId | string;
  year: number;
  session?: ClientSession | null;
};

const toObjectId = (value: Types.ObjectId | string | null | undefined) => {
  if (!value) return null;

  if (!Types.ObjectId.isValid(String(value))) {
    throw new Error("Invalid ObjectId value.");
  }

  return new Types.ObjectId(String(value));
};

const round2 = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const toDateOrNull = (value: any) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const sameObjectId = (left: any, right: any) => {
  const leftId = left?._id || left;
  const rightId = right?._id || right;

  return Boolean(leftId && rightId && String(leftId) === String(rightId));
};

const getPayrollPaymentPeriodDates = (payrollRun: any, payrollPayment: any) => {
  const periodStart =
    toDateOrNull(payrollPayment?.periodStart) ||
    toDateOrNull(payrollPayment?.snapshot?.period?.start) ||
    toDateOrNull(payrollRun?.periodStart) ||
    toDateOrNull(payrollRun?.payDate) ||
    new Date();

  const periodEnd =
    toDateOrNull(payrollPayment?.periodEnd) ||
    toDateOrNull(payrollPayment?.snapshot?.period?.end) ||
    toDateOrNull(payrollRun?.periodEnd) ||
    toDateOrNull(payrollRun?.payDate) ||
    periodStart;

  return {
    periodStart,
    periodEnd,
  };
};

const getChristmasSalaryAccrualYear = (payrollRun: any, payrollPayment: any) => {
  const rawYear = Number(payrollPayment?.year || 0);

  if (Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100) {
    return rawYear;
  }

  const { periodEnd } = getPayrollPaymentPeriodDates(payrollRun, payrollPayment);

  return periodEnd.getFullYear();
};

const getChristmasSalaryAccrualMonth = (
  payrollRun: any,
  payrollPayment: any,
) => {
  const rawMonth = Number(payrollPayment?.month || 0);

  if (Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12) {
    return rawMonth;
  }

  const { periodEnd } = getPayrollPaymentPeriodDates(payrollRun, payrollPayment);

  return periodEnd.getMonth() + 1;
};

export const isPayrollFinanciallyConfirmed = (
  payrollRun: any,
  payrollPayment: any,
) => {
  const cleanAuthorization = String(
    payrollRun?.bankAuthorizationNumber || "",
  ).trim();

  const depositedAt = toDateOrNull(payrollRun?.bankDepositedAt);

  const runIsConfirmed = Boolean(
    payrollRun &&
      String(payrollRun.status || "").toUpperCase() === "CLOSED" &&
      payrollRun.isDeleted !== true &&
      payrollRun.isActive !== false &&
      cleanAuthorization &&
      depositedAt,
  );

  if (!runIsConfirmed) return false;

  const paymentIsValid = Boolean(
    payrollPayment &&
      payrollPayment.isDeleted !== true &&
      payrollPayment.isActive !== false,
  );

  if (!paymentIsValid) return false;

  if (payrollPayment?.payrollRun && payrollRun?._id) {
    return sameObjectId(payrollPayment.payrollRun, payrollRun._id);
  }

  return true;
};

const cleanImpact = (
  impact?: Partial<ChristmasSalaryMovementImpact>,
): ChristmasSalaryMovementImpact => ({
  ordinarySalaryEarnedAmount: round2(impact?.ordinarySalaryEarnedAmount || 0),
  accruedChristmasSalaryAmount: round2(
    impact?.accruedChristmasSalaryAmount || 0,
  ),
  paidChristmasSalaryAmount: round2(impact?.paidChristmasSalaryAmount || 0),
  appliedToTerminationAmount: round2(
    impact?.appliedToTerminationAmount || 0,
  ),
  reservedGuaranteeAmount: round2(impact?.reservedGuaranteeAmount || 0),
});

const getMovementImpact = (movement: any): ChristmasSalaryMovementImpact => {
  const isLegacyOpening =
    movement?.type === "CHRISTMAS_SALARY" && !movement?.movementType;

  if (isLegacyOpening) {
    return cleanImpact({
      ordinarySalaryEarnedAmount:
        movement.ordinarySalaryEarnedAmountDelta ??
        movement.ordinarySalaryBaseAmount ??
        0,
      accruedChristmasSalaryAmount:
        movement.accruedAmountDelta ?? movement.accruedAmount ?? 0,
      paidChristmasSalaryAmount:
        movement.paidAmountDelta ?? movement.paidAmount ?? 0,
      appliedToTerminationAmount:
        movement.appliedToTerminationAmountDelta ?? 0,
      reservedGuaranteeAmount: movement.reservedGuaranteeAmountDelta ?? 0,
    });
  }

  return cleanImpact({
    ordinarySalaryEarnedAmount: movement.ordinarySalaryEarnedAmountDelta || 0,
    accruedChristmasSalaryAmount: movement.accruedAmountDelta || 0,
    paidChristmasSalaryAmount: movement.paidAmountDelta || 0,
    appliedToTerminationAmount: movement.appliedToTerminationAmountDelta || 0,
    reservedGuaranteeAmount: movement.reservedGuaranteeAmountDelta || 0,
  });
};

const calculateDerivedBalanceAmounts = ({
  accruedChristmasSalaryAmount,
  paidChristmasSalaryAmount,
  appliedToTerminationAmount,
  reservedGuaranteeAmount,
}: Pick<
  ChristmasSalaryMovementImpact,
  | "accruedChristmasSalaryAmount"
  | "paidChristmasSalaryAmount"
  | "appliedToTerminationAmount"
  | "reservedGuaranteeAmount"
>) => {
  const pendingChristmasSalaryPayable = Math.max(
    0,
    accruedChristmasSalaryAmount -
      paidChristmasSalaryAmount -
      appliedToTerminationAmount,
  );

  const availableUnreservedChristmasSalaryAmount = Math.max(
    0,
    accruedChristmasSalaryAmount -
      paidChristmasSalaryAmount -
      appliedToTerminationAmount -
      reservedGuaranteeAmount,
  );

  return {
    pendingChristmasSalaryPayable: round2(pendingChristmasSalaryPayable),
    availableUnreservedChristmasSalaryAmount: round2(
      availableUnreservedChristmasSalaryAmount,
    ),
  };
};

export const rebuildEmployeeChristmasSalaryBalance = async ({
  company,
  employee,
  year,
  session,
}: BalanceLookupInput) => {
  const companyId = toObjectId(company);
  const employeeId = toObjectId(employee);

  if (!companyId || !employeeId) {
    throw new Error("Company and employee are required.");
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Invalid Christmas salary balance year.");
  }

  const movements = await PayrollAccrual.find({
    company: companyId,
    employee: employeeId,
    year,
    type: "CHRISTMAS_SALARY",
    isDeleted: false,
  })
    .sort({ effectiveAt: 1, createdAt: 1, _id: 1 })
    .session(session || null);

  const totals = movements.reduce<ChristmasSalaryMovementImpact>(
    (acc, movement) => {
      const impact = getMovementImpact(movement);

      acc.ordinarySalaryEarnedAmount += impact.ordinarySalaryEarnedAmount;
      acc.accruedChristmasSalaryAmount += impact.accruedChristmasSalaryAmount;
      acc.paidChristmasSalaryAmount += impact.paidChristmasSalaryAmount;
      acc.appliedToTerminationAmount += impact.appliedToTerminationAmount;
      acc.reservedGuaranteeAmount += impact.reservedGuaranteeAmount;

      return acc;
    },
    {
      ordinarySalaryEarnedAmount: 0,
      accruedChristmasSalaryAmount: 0,
      paidChristmasSalaryAmount: 0,
      appliedToTerminationAmount: 0,
      reservedGuaranteeAmount: 0,
    },
  );

  const normalizedTotals = {
    ordinarySalaryEarnedAmount: round2(
      Math.max(0, totals.ordinarySalaryEarnedAmount),
    ),
    accruedChristmasSalaryAmount: round2(
      Math.max(0, totals.accruedChristmasSalaryAmount),
    ),
    paidChristmasSalaryAmount: round2(
      Math.max(0, totals.paidChristmasSalaryAmount),
    ),
    appliedToTerminationAmount: round2(
      Math.max(0, totals.appliedToTerminationAmount),
    ),
    reservedGuaranteeAmount: round2(
      Math.max(0, totals.reservedGuaranteeAmount),
    ),
  };

  const derived = calculateDerivedBalanceAmounts(normalizedTotals);
  const lastMovement = movements[movements.length - 1];

  return EmployeeChristmasSalaryBalance.findOneAndUpdate(
    {
      company: companyId,
      employee: employeeId,
      year,
      isDeleted: false,
    },
    {
      $set: {
        ...normalizedTotals,
        ...derived,
        lastMovementAt:
          lastMovement?.effectiveAt || lastMovement?.createdAt || null,
        lastRebuiltAt: new Date(),
        calculationVersion: 1,
        isActive: true,
      },
      $setOnInsert: {
        company: companyId,
        employee: employeeId,
        year,
        isDeleted: false,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session: session || null,
    },
  );
};

export const getEmployeeChristmasSalaryBalance = async ({
  company,
  employee,
  year,
  session,
}: BalanceLookupInput) => {
  const companyId = toObjectId(company);
  const employeeId = toObjectId(employee);

  if (!companyId || !employeeId) {
    throw new Error("Company and employee are required.");
  }

  const existingBalance = await EmployeeChristmasSalaryBalance.findOne({
    company: companyId,
    employee: employeeId,
    year,
    isDeleted: false,
  }).session(session || null);

  if (existingBalance) {
    return existingBalance;
  }

  return rebuildEmployeeChristmasSalaryBalance({
    company: companyId,
    employee: employeeId,
    year,
    session,
  });
};

export const registerChristmasSalaryMovement = async (
  input: RegisterChristmasSalaryMovementInput,
) => {
  const companyId = toObjectId(input.company);
  const employeeId = toObjectId(input.employee);
  const idempotencyKey = String(input.idempotencyKey || "").trim();
  const session = input.session || null;

  if (!companyId || !employeeId) {
    throw new Error("Company and employee are required.");
  }

  if (!idempotencyKey) {
    throw new Error("Christmas salary movement idempotencyKey is required.");
  }

  const existingMovement = await PayrollAccrual.findOne({
    type: "CHRISTMAS_SALARY",
    idempotencyKey,
    isDeleted: false,
  }).session(session);

  if (existingMovement) {
    const balance = await rebuildEmployeeChristmasSalaryBalance({
      company: existingMovement.company,
      employee: existingMovement.employee,
      year: existingMovement.year,
      session,
    });

    return {
      movement: existingMovement,
      balance,
      created: false,
    };
  }

  const impact = cleanImpact(input.impact);

  const movement = new PayrollAccrual({
    company: companyId,
    employee: employeeId,
    type: "CHRISTMAS_SALARY",
    movementType: input.movementType,
    year: input.year,
    month: input.month || null,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    accruedAmount: Math.max(0, impact.accruedChristmasSalaryAmount),
    paidAmount: Math.max(0, impact.paidChristmasSalaryAmount),
    pendingAmount: Math.max(0, impact.accruedChristmasSalaryAmount),
    source: input.source || "SYSTEM",
    payrollRun: toObjectId(input.payrollRun),
    payrollPayment: toObjectId(input.payrollPayment),
    termination: toObjectId(input.termination),
    loanRequest: toObjectId(input.loanRequest),
    guaranteeReservation: toObjectId(input.guaranteeReservation),
    reversesAccrual: toObjectId(input.reversesAccrual),
    installmentNumber: input.installmentNumber || null,
    idempotencyKey,
    ordinarySalaryBaseAmount: Math.max(
      0,
      impact.ordinarySalaryEarnedAmount,
    ),
    ordinarySalaryEarnedAmountDelta: impact.ordinarySalaryEarnedAmount,
    accruedAmountDelta: impact.accruedChristmasSalaryAmount,
    paidAmountDelta: impact.paidChristmasSalaryAmount,
    appliedToTerminationAmountDelta: impact.appliedToTerminationAmount,
    reservedGuaranteeAmountDelta: impact.reservedGuaranteeAmount,
    calculationVersion: 1,
    effectiveAt: input.effectiveAt || new Date(),
    status: input.status || "OPEN",
    notes: input.notes || "",
    metadata: input.metadata || {},
    createdBy: toObjectId(input.createdBy),
    updatedBy: toObjectId(input.updatedBy),
    isDeleted: false,
  });

  try {
    await movement.save({ session: session || undefined });
  } catch (error: any) {
    if (error?.code === 11000) {
      const duplicateMovement = await PayrollAccrual.findOne({
        type: "CHRISTMAS_SALARY",
        idempotencyKey,
        isDeleted: false,
      }).session(session);

      if (duplicateMovement) {
        const balance = await rebuildEmployeeChristmasSalaryBalance({
          company: duplicateMovement.company,
          employee: duplicateMovement.employee,
          year: duplicateMovement.year,
          session,
        });

        return {
          movement: duplicateMovement,
          balance,
          created: false,
        };
      }
    }

    throw error;
  }

  const balance = await rebuildEmployeeChristmasSalaryBalance({
    company: companyId,
    employee: employeeId,
    year: input.year,
    session,
  });

  return {
    movement,
    balance,
    created: true,
  };
};
type PayrollRunChristmasSalaryAccrualInput = {
  payrollRun: any;
  actorId?: Types.ObjectId | string | null;
  effectiveAt?: Date | null;
  session?: ClientSession | null;
};

export const registerPayrollPaymentChristmasSalaryAccrual = async ({
  payrollRun,
  payrollPayment,
  actorId,
  effectiveAt,
  session,
}: PayrollRunChristmasSalaryAccrualInput & { payrollPayment: any }) => {
  if (!isPayrollFinanciallyConfirmed(payrollRun, payrollPayment)) {
    return {
      created: false,
      skipped: true,
      reason: "PAYROLL_NOT_FINANCIALLY_CONFIRMED",
    };
  }

  const laborBase = payrollPayment?.snapshot?.laborBase || {};
  const ordinarySalaryEarnedAmountDelta = round2(
    laborBase.christmasSalaryEligibleOrdinaryEarningsAmountPeriod || 0,
  );
  const accruedAmountDelta = round2(
    laborBase.christmasSalaryAccrualAmountPeriod || 0,
  );

  if (ordinarySalaryEarnedAmountDelta <= 0 && accruedAmountDelta <= 0) {
    return {
      created: false,
      skipped: true,
      reason: "NO_CHRISTMAS_SALARY_ACCRUAL_AMOUNT",
    };
  }

  const company = payrollPayment.company || payrollRun.company;
  const employee = payrollPayment.user;
  const year = getChristmasSalaryAccrualYear(payrollRun, payrollPayment);
  const month = getChristmasSalaryAccrualMonth(payrollRun, payrollPayment);
  const { periodStart, periodEnd } = getPayrollPaymentPeriodDates(
    payrollRun,
    payrollPayment,
  );

  return registerChristmasSalaryMovement({
    company,
    employee,
    year,
    month,
    periodStart,
    periodEnd,
    payrollRun: payrollRun._id,
    payrollPayment: payrollPayment._id,
    movementType: "CHRISTMAS_ACCRUAL",
    idempotencyKey: `CHRISTMAS_ACCRUAL:${String(payrollPayment._id)}`,
    impact: {
      ordinarySalaryEarnedAmount: ordinarySalaryEarnedAmountDelta,
      accruedChristmasSalaryAmount: accruedAmountDelta,
      paidChristmasSalaryAmount: 0,
      appliedToTerminationAmount: 0,
      reservedGuaranteeAmount: 0,
    },
    source: "PAYROLL_RUN",
    effectiveAt: effectiveAt || payrollRun.bankDepositedAt || new Date(),
    notes:
      "Acumulacion de doble sueldo generada por confirmacion financiera de nomina.",
    metadata: {
      bankAuthorizationNumber: payrollRun.bankAuthorizationNumber || "",
      ordinarySalaryEarnedAmountDelta,
      accruedAmountDelta,
    },
    createdBy: actorId,
    updatedBy: actorId,
    session,
  });
};

export const accrueChristmasSalaryForFinanciallyConfirmedPayrollRun = async ({
  payrollRun,
  actorId,
  effectiveAt,
  session,
}: PayrollRunChristmasSalaryAccrualInput) => {
  const payments = await PayrollPayment.find({
    payrollRun: payrollRun._id,
    isDeleted: false,
    isActive: true,
  })
    .select(
      "_id company payrollRun user periodStart periodEnd payDate year month snapshot isActive isDeleted",
    )
    .session(session || null)
    .lean();

  let createdCount = 0;
  let existingCount = 0;
  let skippedCount = 0;

  for (const payrollPayment of payments) {
    const result = await registerPayrollPaymentChristmasSalaryAccrual({
      payrollRun,
      payrollPayment,
      actorId,
      effectiveAt,
      session,
    });

    if ((result as any).created) createdCount++;
    else if ((result as any).skipped) skippedCount++;
    else existingCount++;
  }

  return {
    createdCount,
    existingCount,
    skippedCount,
    processedCount: payments.length,
  };
};

export const reversePayrollPaymentChristmasSalaryAccrual = async ({
  payrollRun,
  payrollPayment,
  actorId,
  effectiveAt,
  session,
}: PayrollRunChristmasSalaryAccrualInput & { payrollPayment: any }) => {
  if (!isPayrollFinanciallyConfirmed(payrollRun, payrollPayment)) {
    return {
      created: false,
      skipped: true,
      reason: "PAYROLL_NOT_FINANCIALLY_CONFIRMED",
    };
  }

  const accrualMovement = await PayrollAccrual.findOne({
    type: "CHRISTMAS_SALARY",
    movementType: "CHRISTMAS_ACCRUAL",
    payrollPayment: payrollPayment._id,
    idempotencyKey: `CHRISTMAS_ACCRUAL:${String(payrollPayment._id)}`,
    isDeleted: false,
  }).session(session || null);

  if (!accrualMovement) {
    return { created: false, skipped: true, reason: "ORIGINAL_ACCRUAL_NOT_FOUND" };
  }

  const originalImpact = getMovementImpact(accrualMovement);
  const { periodStart, periodEnd } = getPayrollPaymentPeriodDates(
    payrollRun,
    payrollPayment,
  );

  return registerChristmasSalaryMovement({
    company: accrualMovement.company,
    employee: accrualMovement.employee,
    year: accrualMovement.year,
    month:
      accrualMovement.month ||
      getChristmasSalaryAccrualMonth(payrollRun, payrollPayment),
    periodStart,
    periodEnd,
    payrollRun: payrollRun._id,
    payrollPayment: payrollPayment._id,
    reversesAccrual: accrualMovement._id,
    movementType: "CHRISTMAS_ACCRUAL_REVERSAL",
    idempotencyKey: `CHRISTMAS_ACCRUAL_REVERSAL:${String(payrollPayment._id)}`,
    impact: {
      ordinarySalaryEarnedAmount: -originalImpact.ordinarySalaryEarnedAmount,
      accruedChristmasSalaryAmount: -originalImpact.accruedChristmasSalaryAmount,
      paidChristmasSalaryAmount: 0,
      appliedToTerminationAmount: 0,
      reservedGuaranteeAmount: 0,
    },
    source: "PAYROLL_RUN",
    effectiveAt: effectiveAt || new Date(),
    notes:
      "Reverso de acumulacion de doble sueldo por anulacion formal de nomina confirmada financieramente.",
    metadata: {
      bankAuthorizationNumber: payrollRun.bankAuthorizationNumber || "",
      originalAccrualId: String(accrualMovement._id),
    },
    createdBy: actorId,
    updatedBy: actorId,
    session,
  });
};

export const reverseChristmasSalaryAccrualsForPayrollRun = async ({
  payrollRun,
  actorId,
  effectiveAt,
  session,
}: PayrollRunChristmasSalaryAccrualInput) => {
  const payments = await PayrollPayment.find({
    payrollRun: payrollRun._id,
    isDeleted: false,
    isActive: true,
  })
    .select(
      "_id company payrollRun user periodStart periodEnd payDate year month snapshot isActive isDeleted",
    )
    .session(session || null)
    .lean();

  let createdCount = 0;
  let existingCount = 0;
  let skippedCount = 0;

  for (const payrollPayment of payments) {
    const result = await reversePayrollPaymentChristmasSalaryAccrual({
      payrollRun,
      payrollPayment,
      actorId,
      effectiveAt,
      session,
    });

    if ((result as any).created) createdCount++;
    else if ((result as any).skipped) skippedCount++;
    else existingCount++;
  }

  return {
    createdCount,
    existingCount,
    skippedCount,
    processedCount: payments.length,
  };
};
