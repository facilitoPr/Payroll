import { ClientSession, Types } from "mongoose";
import PayrollAccrual, {
  PayrollAccrualMovementType,
  PayrollAccrualSource,
  PayrollAccrualStatus,
} from "../../model/employee-termination/payrollAccrual";
import EmployeeChristmasSalaryBalance from "../../model/employee-payment-management/employeeChristmasSalaryBalance";

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
    const balance = await getEmployeeChristmasSalaryBalance({
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
        const balance = await getEmployeeChristmasSalaryBalance({
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