import { ClientSession, Types } from "mongoose";

import EmployeeLoanRequest from "../../model/employeeLoan/employeeLoanRequest";
import EmployeeLoanRequestHistory from "../../model/employeeLoan/employeeLoanRequestHistory";
import EmployeeLoanGuaranteeReservation from "../../model/employeeLoan/employeeLoanGuaranteeReservation";
import EmployeeLoanProductConfig from "../../model/employeeLoan/employeeLoanProductConfig";
import { round2 } from "../parse";
import PayrollPayment from "../../model/employee-payment-management/payrollPayment";
import PayrollRun from "../../model/employee-payment-management/payrollRun";
import PayrollAccrual from "../../model/employee-termination/payrollAccrual";
import { registerChristmasSalaryMovement } from "../../services/employee-payment-management/employeeChristmasSalaryLedger.service";

export type PayrollLoanDeductionMode = "PREVIEW" | "CLOSE";

/**
 * IMPORTANTE:
 * Si tu flujo todavía deja el préstamo en SUBMITTED después de firmar,
 * incluye SUBMITTED aquí.
 *
 * Cuando ya tengas aprobación formal, deja solo APPROVED.
 */
const PAYROLL_DEDUCTIBLE_LOAN_STATUSES = (
  process.env.EMPLOYEE_LOAN_PAYROLL_STATUSES || "APPROVED,SUBMITTED"
)
  .split(",")
  .map((item) => item.trim().toUpperCase())
  .filter(Boolean);

/**
 * Si true, solo descuenta cuotas con dueDate <= payDate.
 * Si false, descuenta la próxima cuota pendiente aunque dueDate sea futura.
 *
 * Para empezar, recomiendo false porque muchas veces la amortización queda con
 * fechas futuras y por eso no aparece ninguna deducción en nómina.
 */
const DEDUCT_ONLY_DUE_INSTALLMENTS =
  String(process.env.EMPLOYEE_LOAN_DEDUCT_ONLY_DUE || "false").toLowerCase() ===
  "true";

/**
 * Si true, permite que un préstamo con status SUBMITTED se descuente.
 * Útil mientras tu flujo no tenga aprobación formal.
 */
const DEFAULT_LOAN_DEDUCTION_NAME = "Descuento préstamo empleado";

const toNumber = (value: any, fallback = 0) => {
  const n = Number(value);

  if (!Number.isFinite(n)) return fallback;

  return n;
};

const toObjectId = (value: any) => {
  if (!value) return null;

  const raw = value?._id || value;

  if (!Types.ObjectId.isValid(String(raw))) return null;

  return new Types.ObjectId(String(raw));
};

const getDateEndOfDay = (value: any) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    const fallback = new Date();
    fallback.setHours(23, 59, 59, 999);
    return fallback;
  }

  date.setHours(23, 59, 59, 999);
  return date;
};

const getInstallmentAmount = (loan: any, installment: any) => {
  return round2(
    toNumber(installment?.paymentAmount, 0) ||
      toNumber(loan?.loanQuoteSnapshot?.installmentAmount, 0),
  );
};

const getLoanInstallmentSubdocId = (installment: any) => {
  const id = installment?._id;

  return id && Types.ObjectId.isValid(String(id)) ? String(id) : "";
};

const getChristmasGuaranteeCoverageBasisForLoan = async ({
  loan,
  session,
}: {
  loan: any;
  session?: ClientSession | null;
}) => {
  const snapshotBasis = String(
    loan?.christmasSalaryGuaranteeSnapshot?.guaranteeCoverageBasis || "",
  ).toUpperCase();

  if (["OUTSTANDING_BALANCE", "OUTSTANDING_PRINCIPAL"].includes(snapshotBasis)) {
    return snapshotBasis;
  }

  const productConfigId = loan?.loanProviderSnapshot?.productConfig;

  if (productConfigId && Types.ObjectId.isValid(String(productConfigId))) {
    const productConfig = await EmployeeLoanProductConfig.findOne({
      _id: toObjectId(productConfigId),
      isDeleted: false,
    })
      .select("guaranteeCoverageBasis")
      .session(session || null)
      .lean();

    const productBasis = String(
      productConfig?.guaranteeCoverageBasis || "",
    ).toUpperCase();

    if (["OUTSTANDING_BALANCE", "OUTSTANDING_PRINCIPAL"].includes(productBasis)) {
      return productBasis;
    }
  }

  return "OUTSTANDING_BALANCE";
};

const reduceChristmasSalaryGuaranteeAfterInstallmentPaid = async ({
  loan,
  installment,
  payrollRunId,
  payrollPaymentId,
  bankAuthorizationNumber,
  paidAt,
  actorId,
  loanFullyPaid,
  session,
}: {
  loan: any;
  installment: any;
  payrollRunId: Types.ObjectId;
  payrollPaymentId?: Types.ObjectId | null;
  bankAuthorizationNumber: string;
  paidAt: Date;
  actorId?: Types.ObjectId | null;
  loanFullyPaid: boolean;
  session?: ClientSession | null;
}) => {
  if (String(installment?.status || "").toUpperCase() !== "PAID") {
    return { skipped: true, reason: "INSTALLMENT_NOT_PAID" };
  }

  const installmentId = getLoanInstallmentSubdocId(installment);

  if (!installmentId) {
    return { skipped: true, reason: "MISSING_INSTALLMENT_ID" };
  }

  const loanRequestId = loan?._id;
  const idempotencyKey = `CHRISTMAS_GUARANTEE_REDUCED:${String(
    loanRequestId,
  )}:${installmentId}`;

  const reservationQuery: any = {
    loanRequest: loanRequestId,
    source: "CHRISTMAS_SALARY",
    status: "ACTIVE",
    isActive: true,
    isDeleted: false,
  };

  if (loan.guaranteeReservation) {
    reservationQuery._id = loan.guaranteeReservation;
  }

  const reservation = await EmployeeLoanGuaranteeReservation.findOne(
    reservationQuery,
  ).session(session || null);

  if (!reservation) {
    return { skipped: true, reason: "ACTIVE_RESERVATION_NOT_FOUND" };
  }

  const existingMovement = await PayrollAccrual.findOne({
    type: "CHRISTMAS_SALARY",
    movementType: "CHRISTMAS_GUARANTEE_REDUCED",
    idempotencyKey,
    isDeleted: false,
  }).session(session || null);

  if (existingMovement) {
    return {
      skipped: false,
      idempotent: true,
      movement: existingMovement,
      reservation,
    };
  }

  const remainingReservedAmount = round2(
    Number(reservation.remainingReservedAmount || 0),
  );

  if (remainingReservedAmount <= 0) {
    return { skipped: true, reason: "NO_REMAINING_RESERVATION" };
  }

  const guaranteeCoverageBasis = await getChristmasGuaranteeCoverageBasisForLoan({
    loan,
    session,
  });
  const canonicalPaidCoveredAmount = round2(
    guaranteeCoverageBasis === "OUTSTANDING_PRINCIPAL"
      ? Number(installment.principalAmount || 0)
      : Number(installment.paymentAmount || 0),
  );

  if (canonicalPaidCoveredAmount <= 0) {
    return { skipped: true, reason: "NO_COVERED_PAID_AMOUNT" };
  }

  let reductionAmount = Math.min(
    canonicalPaidCoveredAmount,
    remainingReservedAmount,
  );

  reductionAmount = round2(reductionAmount);

  if (reductionAmount <= 0) {
    return { skipped: true, reason: "NO_REDUCTION_AMOUNT" };
  }

  const movementResult = await registerChristmasSalaryMovement({
    company: reservation.company,
    employee: reservation.employee,
    year: reservation.year,
    month: paidAt.getMonth() + 1,
    periodStart: new Date(reservation.year, 0, 1),
    periodEnd: new Date(reservation.year, 11, 31, 23, 59, 59, 999),
    movementType: "CHRISTMAS_GUARANTEE_REDUCED",
    idempotencyKey,
    payrollRun: payrollRunId,
    payrollPayment: payrollPaymentId || null,
    loanRequest: loanRequestId,
    guaranteeReservation: reservation._id,
    installmentNumber: Number(installment.installmentNumber || 0) || null,
    impact: {
      ordinarySalaryEarnedAmount: 0,
      accruedChristmasSalaryAmount: 0,
      paidChristmasSalaryAmount: 0,
      appliedToTerminationAmount: 0,
      reservedGuaranteeAmount: -reductionAmount,
    },
    source: "SYSTEM",
    effectiveAt: paidAt,
    notes: "Reducción de garantía de salario de Navidad por cuota pagada.",
    metadata: {
      installmentId,
      installmentNumber: installment.installmentNumber,
      guaranteeCoverageBasis,
      canonicalPaidCoveredAmount,
      reductionAmount,
      bankAuthorizationNumber,
    },
    createdBy: actorId || null,
    updatedBy: actorId || null,
    session,
  });

  if (!movementResult.created) {
    return {
      skipped: false,
      idempotent: true,
      movement: movementResult.movement,
      balance: movementResult.balance,
      reservation,
      reductionAmount: 0,
    };
  }

  const reservationAfter = await EmployeeLoanGuaranteeReservation.findOneAndUpdate(
    {
      _id: reservation._id,
      status: "ACTIVE",
      isActive: true,
      isDeleted: false,
      remainingReservedAmount: { $gte: reductionAmount },
    },
    {
      $inc: {
        remainingReservedAmount: -reductionAmount,
      },
      $set: {
        updatedBy: actorId || reservation.updatedBy || null,
        metadata: {
          ...(reservation.metadata || {}),
          lastReducedAt: paidAt,
          lastReductionAmount: reductionAmount,
          lastReducedInstallment: installmentId,
          lastBankAuthorizationNumber: bankAuthorizationNumber,
        },
      },
    },
    {
      new: true,
      session: session || null,
    },
  );

  if (!reservationAfter) {
    throw new Error("La reserva de garantía cambió mientras se reducía.");
  }

  if (
    loanFullyPaid &&
    Number(reservationAfter.remainingReservedAmount || 0) === 0
  ) {
    reservationAfter.status = "CONSUMED";
    reservationAfter.consumedAt = paidAt;
    reservationAfter.consumedBy = actorId || null;
    reservationAfter.updatedBy = actorId || reservationAfter.updatedBy;
    reservationAfter.isActive = false;
    await reservationAfter.save({ session: session || undefined });
  }

  return {
    skipped: false,
    idempotent: !movementResult.created,
    movement: movementResult.movement,
    balance: movementResult.balance,
    reservation: reservationAfter,
    reductionAmount,
  };
};

const getLoanBankAccountSnapshot = (loan: any) => {
  const account = loan?.loanProviderSnapshot?.interestBankAccount || {};

  return {
    bankName: account.bankName || "",
    bankCode: account.bankCode || "",
    accountNumber: account.accountNumber || "",
    accountType: account.accountType || "",
    currency: account.currency || "DOP",
    beneficiaryName: account.beneficiaryName || "",
    beneficiaryDocument: account.beneficiaryDocument || "",
    paymentInstructions: account.paymentInstructions || "",
  };
};

const hasLoanBankAccount = (bank: any) => {
  return Boolean(
    bank?.bankName ||
    bank?.bankCode ||
    bank?.accountNumber ||
    bank?.beneficiaryName,
  );
};

const buildDeductionName = ({
  requestNumber,
  installmentNumber,
}: {
  requestNumber: string;
  installmentNumber: number;
}) => {
  return `${DEFAULT_LOAN_DEDUCTION_NAME} ${requestNumber} - cuota ${installmentNumber}`;
};

const patchBankSnapshotAmount = (bankSnapshot: any, amount: number) => {
  if (!bankSnapshot) return;

  const cleanAmount = round2(Math.max(0, amount));

  /**
   * Como no tengo aquí tu modelo exacto de bankSnapshot,
   * actualizo los nombres más comunes.
   */
  if (typeof bankSnapshot.amount !== "undefined") {
    bankSnapshot.amount = cleanAmount;
  }

  if (typeof bankSnapshot.monto !== "undefined") {
    bankSnapshot.monto = cleanAmount;
  }

  if (typeof bankSnapshot.netAmount !== "undefined") {
    bankSnapshot.netAmount = cleanAmount;
  }

  if (typeof bankSnapshot.amountToPay !== "undefined") {
    bankSnapshot.amountToPay = cleanAmount;
  }

  if (typeof bankSnapshot.paymentAmount !== "undefined") {
    bankSnapshot.paymentAmount = cleanAmount;
  }

  /**
   * Si ninguno existe, dejamos uno estándar para el generador bancario.
   */
  if (
    typeof bankSnapshot.amount === "undefined" &&
    typeof bankSnapshot.monto === "undefined" &&
    typeof bankSnapshot.netAmount === "undefined" &&
    typeof bankSnapshot.amountToPay === "undefined" &&
    typeof bankSnapshot.paymentAmount === "undefined"
  ) {
    bankSnapshot.amount = cleanAmount;
  }
};

const getAlreadyAppliedLoanDeductionKeys = (snapshot: any) => {
  const rows = Array.isArray(snapshot?.employeeLoanDeductions)
    ? snapshot.employeeLoanDeductions
    : [];

  return new Set(
    rows
      .map((item: any) => {
        return `${String(item.loanRequest || "")}:${Number(
          item.installmentNumber || 0,
        )}`;
      })
      .filter(Boolean),
  );
};

const selectInstallmentsForPayroll = ({
  loan,
  payDate,
}: {
  loan: any;
  payDate: Date;
}) => {
  const cleanPayDate = getDateEndOfDay(payDate);

  const pending = (loan?.amortizationSchedule || [])
    .filter((item: any) => {
      const status = String(item?.status || "").toUpperCase();

      if (status !== "PENDING") return false;

      if (!DEDUCT_ONLY_DUE_INSTALLMENTS) return true;

      const dueDate = getDateEndOfDay(item?.dueDate);

      return dueDate.getTime() <= cleanPayDate.getTime();
    })
    .sort((a: any, b: any) => {
      return (
        Number(a.installmentNumber || 0) - Number(b.installmentNumber || 0)
      );
    });

  /**
   * Por defecto solo descontamos 1 cuota por préstamo en cada nómina.
   */
  return pending.slice(0, 1);
};

export const getEmployeeLoanDeductionsForPayroll = async ({
  employeeId,
  payDate,
  session,
}: {
  employeeId: string | Types.ObjectId;
  payDate: Date;
  session?: ClientSession | null;
}) => {
  const employeeObjectId = toObjectId(employeeId);

  if (!employeeObjectId) {
    return {
      deductions: [],
      totalAmount: 0,
    };
  }

  /**
   * No filtramos por dueDate en Mongo para evitar que no encuentre nada
   * cuando la cuota existe pero su fecha viene futura.
   *
   * La fecha se valida en memoria según DEDUCT_ONLY_DUE_INSTALLMENTS.
   */
  const loans: any[] = await EmployeeLoanRequest.find({
    employee: employeeObjectId,
    status: { $in: PAYROLL_DEDUCTIBLE_LOAN_STATUSES },
    isActive: true,
    isDeleted: false,
    amortizationSchedule: {
      $elemMatch: {
        status: "PENDING",
      },
    },
  })
    .select(
      [
        "_id",
        "requestNumber",
        "employee",
        "status",
        "requestedAmount",
        "loanProviderSnapshot",
        "loanQuoteSnapshot",
        "amortizationSchedule",
      ].join(" "),
    )
    .sort({ createdAt: 1 })
    .session(session || null)
    .lean();

  const deductions: any[] = [];

  for (const loan of loans) {
    const selectedInstallments = selectInstallmentsForPayroll({
      loan,
      payDate,
    });

    const bankAccountSnapshot = getLoanBankAccountSnapshot(loan);

    for (const installment of selectedInstallments) {
      const amount = getInstallmentAmount(loan, installment);

      if (amount <= 0) continue;

      const installmentNumber = Number(installment?.installmentNumber || 0);

      deductions.push({
        type: "EMPLOYEE_LOAN",
        name: buildDeductionName({
          requestNumber: loan.requestNumber,
          installmentNumber,
        }),

        loanRequest: String(loan._id),
        requestNumber: loan.requestNumber,
        loanStatus: loan.status,

        installmentNumber,
        dueDate: installment?.dueDate || null,

        amount,
        principalAmount: round2(toNumber(installment?.principalAmount, 0)),
        interestAmount: round2(toNumber(installment?.interestAmount, 0)),
        openingBalance: round2(toNumber(installment?.openingBalance, 0)),
        closingBalance: round2(toNumber(installment?.closingBalance, 0)),

        productCode: loan?.loanProviderSnapshot?.productCode || "",
        productName: loan?.loanProviderSnapshot?.productName || "",

        bankAccountSnapshot,
        hasBankAccount: hasLoanBankAccount(bankAccountSnapshot),

        /**
         * Este objeto es lo que luego puede usar el generador de archivo bancario
         * para crear una segunda línea de pago hacia la cuenta del préstamo.
         */
        thirdPartyPayment: {
          type: "EMPLOYEE_LOAN",
          amount,
          currency: bankAccountSnapshot.currency || "DOP",
          bankAccountSnapshot,
          reference: `${loan.requestNumber}-CUOTA-${installmentNumber}`,
          description: buildDeductionName({
            requestNumber: loan.requestNumber,
            installmentNumber,
          }),
          loanRequest: String(loan._id),
          requestNumber: loan.requestNumber,
          installmentNumber,
        },
      });
    }
  }

  const totalAmount = round2(
    deductions.reduce((sum, item) => {
      return sum + toNumber(item.amount, 0);
    }, 0),
  );

  return {
    deductions,
    totalAmount,
  };
};

const applyDeductionsToSnapshot = ({
  snapshot,
  bankSnapshot,
  deductions,
  totalAmount,
}: {
  snapshot: any;
  bankSnapshot: any;
  deductions: any[];
  totalAmount: number;
}) => {
  if (!deductions.length || totalAmount <= 0) {
    return;
  }

  snapshot.otherDeductions = Array.isArray(snapshot.otherDeductions)
    ? snapshot.otherDeductions
    : [];

  snapshot.employeeLoanDeductions = Array.isArray(
    snapshot.employeeLoanDeductions,
  )
    ? snapshot.employeeLoanDeductions
    : [];

  snapshot.thirdPartyPayments = Array.isArray(snapshot.thirdPartyPayments)
    ? snapshot.thirdPartyPayments
    : [];

  const alreadyAppliedKeys = getAlreadyAppliedLoanDeductionKeys(snapshot);

  const newDeductions = deductions.filter((deduction) => {
    const key = `${String(deduction.loanRequest || "")}:${Number(
      deduction.installmentNumber || 0,
    )}`;

    return !alreadyAppliedKeys.has(key);
  });

  if (!newDeductions.length) {
    return;
  }

  const newTotalAmount = round2(
    newDeductions.reduce((sum, item) => {
      return sum + toNumber(item.amount, 0);
    }, 0),
  );

  for (const deduction of newDeductions) {
    snapshot.otherDeductions.push({
      nombre: deduction.name,
      montoPeriodo: round2(deduction.amount),
      type: "EMPLOYEE_LOAN",
      loanRequest: deduction.loanRequest,
      requestNumber: deduction.requestNumber,
      installmentNumber: deduction.installmentNumber,
      productCode: deduction.productCode,
      productName: deduction.productName,
      bankAccountSnapshot: deduction.bankAccountSnapshot,
    });

    snapshot.employeeLoanDeductions.push(deduction);

    snapshot.thirdPartyPayments.push(deduction.thirdPartyPayment);
  }

  const t = snapshot.totals || {};

  const previousOtherPeriod = toNumber(t.totalOtrasDeduccionesPeriodo, 0);
  const previousTotalPeriod = toNumber(t.totalDeduccionesPeriodo, 0);
  const previousNetPeriod = toNumber(t.sueldoNetoPeriodo, 0);

  const employeeNetAfterLoan = round2(
    Math.max(0, previousNetPeriod - newTotalAmount),
  );

  /**
   * Guardamos la distribución para que el generador bancario sepa que
   * RRHH desembolsa lo mismo, pero dividido en:
   * - empleado
   * - cuenta del préstamo
   */
  snapshot.paymentDistribution = {
    ...(snapshot.paymentDistribution || {}),

    employeeNetBeforeEmployeeLoan: round2(previousNetPeriod),
    employeeNetToDeposit: employeeNetAfterLoan,

    employeeLoanDeductionsTotal: round2(
      toNumber(snapshot.paymentDistribution?.employeeLoanDeductionsTotal, 0) +
        newTotalAmount,
    ),

    thirdPartyPaymentsTotal: round2(
      toNumber(snapshot.paymentDistribution?.thirdPartyPaymentsTotal, 0) +
        newTotalAmount,
    ),

    /**
     * Este total se mantiene igual al neto original antes de préstamos.
     */
    totalCompanyDisbursementForEmployee: round2(previousNetPeriod),
  };

  t.totalOtrasDeduccionesPeriodo = round2(previousOtherPeriod + newTotalAmount);
  t.totalDeduccionesPeriodo = round2(previousTotalPeriod + newTotalAmount);

  t.totalPrestamosEmpleadoPeriodo = round2(
    toNumber(t.totalPrestamosEmpleadoPeriodo, 0) + newTotalAmount,
  );

  t.sueldoNetoPeriodoBeforeEmployeeLoan = round2(previousNetPeriod);
  t.sueldoNetoPeriodo = employeeNetAfterLoan;

  /**
   * Esto es lo que debe recibir el empleado en su cuenta.
   * La diferencia debe ir como thirdPartyPayment a la cuenta del préstamo.
   */
  patchBankSnapshotAmount(bankSnapshot, employeeNetAfterLoan);

  snapshot.totals = t;
};

export const applyEmployeeLoanDeductionsToPayrollSnapshot = async ({
  employeeId,
  snapshot,
  bankSnapshot,
  payDate,
  mode,
  session,
}: {
  employeeId: string | Types.ObjectId;
  snapshot: any;
  bankSnapshot: any;
  payDate: Date;
  mode: PayrollLoanDeductionMode;
  session?: ClientSession | null;
}) => {
  const plan = await getEmployeeLoanDeductionsForPayroll({
    employeeId,
    payDate,
    session,
  });

  if (!plan.deductions.length) {
    /**
     * Esto ayuda a depurar rápido por qué no apareció la deducción.
     */
    snapshot.employeeLoanDeductions = snapshot.employeeLoanDeductions || [];
    snapshot.thirdPartyPayments = snapshot.thirdPartyPayments || [];

    snapshot.employeeLoanDeductionDebug = {
      checked: true,
      mode,
      payDate,
      statuses: PAYROLL_DEDUCTIBLE_LOAN_STATUSES,
      deductOnlyDueInstallments: DEDUCT_ONLY_DUE_INSTALLMENTS,
      foundDeductions: 0,
    };

    return {
      snapshot,
      bankSnapshot,
      deductions: [],
      totalAmount: 0,
    };
  }

  applyDeductionsToSnapshot({
    snapshot,
    bankSnapshot,
    deductions: plan.deductions,
    totalAmount: plan.totalAmount,
  });

  snapshot.employeeLoanDeductionDebug = {
    checked: true,
    mode,
    payDate,
    statuses: PAYROLL_DEDUCTIBLE_LOAN_STATUSES,
    deductOnlyDueInstallments: DEDUCT_ONLY_DUE_INSTALLMENTS,
    foundDeductions: plan.deductions.length,
    totalAmount: plan.totalAmount,
  };

  return {
    snapshot,
    bankSnapshot,
    deductions: plan.deductions,
    totalAmount: plan.totalAmount,
  };
};

export const markEmployeeLoanDeductionsAsPaidFromSnapshot = async ({
  employeeId,
  snapshot,
  payrollRunId,
  payrollPaymentId,
  actorId,
  payDate,
  session,
}: {
  employeeId: string | Types.ObjectId;
  snapshot: any;
  payrollRunId: string | Types.ObjectId;
  payrollPaymentId: string | Types.ObjectId;
  actorId?: string | Types.ObjectId | null;
  payDate: Date;
  session?: ClientSession | null;
}) => {
  const employeeObjectId = toObjectId(employeeId);
  const payrollRunObjectId = toObjectId(payrollRunId);
  const payrollPaymentObjectId = toObjectId(payrollPaymentId);
  const actorObjectId = actorId ? toObjectId(actorId) : null;

  if (!employeeObjectId || !payrollRunObjectId || !payrollPaymentObjectId) {
    return {
      updatedCount: 0,
    };
  }

  const deductions = Array.isArray(snapshot?.employeeLoanDeductions)
    ? snapshot.employeeLoanDeductions
    : [];

  let updatedCount = 0;

  for (const deduction of deductions) {
    const loanObjectId = toObjectId(deduction.loanRequest);
    const installmentNumber = Number(deduction.installmentNumber || 0);

    if (!loanObjectId || !installmentNumber) continue;

    const beforeLoan: any = await EmployeeLoanRequest.findOne({
      _id: loanObjectId,
      employee: employeeObjectId,
      status: { $in: PAYROLL_DEDUCTIBLE_LOAN_STATUSES },
      isActive: true,
      isDeleted: false,
      amortizationSchedule: {
        $elemMatch: {
          installmentNumber,
          status: "PENDING",
        },
      },
    })
      .session(session || null)
      .lean();

    if (!beforeLoan) {
      continue;
    }

    const updatedLoan: any = await EmployeeLoanRequest.findOneAndUpdate(
      {
        _id: loanObjectId,
        employee: employeeObjectId,
        status: { $in: PAYROLL_DEDUCTIBLE_LOAN_STATUSES },
        isActive: true,
        isDeleted: false,
        amortizationSchedule: {
          $elemMatch: {
            installmentNumber,
            status: "PENDING",
          },
        },
      },
      {
        $set: {
          "amortizationSchedule.$.status": "PAID",
          "amortizationSchedule.$.payrollRun": payrollRunObjectId,
          "amortizationSchedule.$.paidAt": payDate,
          updatedBy: actorObjectId,
        },
      },
      {
        new: true,
        session: session || null,
      },
    );

    if (!updatedLoan) continue;

    updatedCount++;

    const stillHasPending = (updatedLoan.amortizationSchedule || []).some(
      (item: any) => String(item.status || "").toUpperCase() === "PENDING",
    );

    const oldStatus = updatedLoan.status;

    if (!stillHasPending) {
      updatedLoan.status = "CLOSED";
      updatedLoan.updatedBy = actorObjectId || updatedLoan.updatedBy;
      await updatedLoan.save({ session: session || undefined });
    }

    await EmployeeLoanRequestHistory.create(
      [
        {
          loanRequest: loanObjectId,
          action: stillHasPending ? "COMMENTED" : "CLOSED",
          fromStatus: oldStatus,
          toStatus: stillHasPending ? oldStatus : "CLOSED",
          comment: stillHasPending
            ? `Cuota ${installmentNumber} descontada en nómina.`
            : `Última cuota descontada en nómina. Préstamo cerrado.`,
          source: "SYSTEM",
          performedBy: actorObjectId,
          previousData: {
            status: beforeLoan.status,
          },
          newData: {
            payrollRun: payrollRunObjectId,
            payrollPayment: payrollPaymentObjectId,
            deduction,
          },
          metadata: {
            payDate,
            amount: deduction.amount,
            installmentNumber,
            requestNumber: deduction.requestNumber,
          },
        },
      ],
      { session: session || undefined },
    );
  }

  return {
    updatedCount,
  };
};

export const finalizeEmployeeLoanDeductionsAfterBankAuthorization = async ({
  payrollRunId,
  bankAuthorizationNumber,
  actorId,
  paidAt = new Date(),
  session,
}: {
  payrollRunId: string | Types.ObjectId;
  bankAuthorizationNumber: string;
  actorId?: string | Types.ObjectId | null;
  paidAt?: Date;
  session?: ClientSession | null;
}) => {
  const runObjectId = toObjectId(payrollRunId);
  const actorObjectId = actorId ? toObjectId(actorId) : null;

  if (!runObjectId) {
    throw new Error("ID de cierre de nómina inválido.");
  }

  const cleanAuthorization = String(bankAuthorizationNumber || "").trim();

  if (!cleanAuthorization) {
    throw new Error("Debes enviar el número de autorización bancaria.");
  }

  const run: any = await PayrollRun.findOne({
    _id: runObjectId,
    isDeleted: false,
  }).session(session || null);

  if (!run) {
    throw new Error("No se encontró el cierre de nómina.");
  }

  /**
   * Si ya fue depositado, no volvemos a marcar cuotas.
   * Esto evita duplicidad si el usuario presiona guardar varias veces.
   */
  if (
    run.bankAuthorizationNumber &&
    String(run.bankAuthorizationNumber).trim() &&
    run.bankDepositedAt
  ) {
    return {
      alreadyFinalized: true,
      updatedInstallments: 0,
      closedLoans: 0,
      skippedInstallments: 0,
    };
  }

  const payments: any[] = await PayrollPayment.find({
    payrollRun: runObjectId,
    isDeleted: false,
    isActive: true,
    "snapshot.employeeLoanDeductions.0": { $exists: true },
  })
    .select("_id user employeeName snapshot")
    .session(session || null)
    .lean();

  let updatedInstallments = 0;
  let skippedInstallments = 0;
  let closedLoans = 0;

  for (const payment of payments) {
    const deductions = Array.isArray(payment?.snapshot?.employeeLoanDeductions)
      ? payment.snapshot.employeeLoanDeductions
      : [];

    for (const deduction of deductions) {
      const loanObjectId = toObjectId(deduction.loanRequest);
      const employeeObjectId = toObjectId(payment.user);
      const installmentNumber = Number(deduction.installmentNumber || 0);

      if (!loanObjectId || !employeeObjectId || !installmentNumber) {
        skippedInstallments++;
        continue;
      }

      const beforeLoan: any = await EmployeeLoanRequest.findOne({
        _id: loanObjectId,
        employee: employeeObjectId,
        isActive: true,
        isDeleted: false,
        amortizationSchedule: {
          $elemMatch: {
            installmentNumber,
            status: "PENDING",
          },
        },
      })
        .session(session || null)
        .lean();

      if (!beforeLoan) {
        skippedInstallments++;
        continue;
      }

      const updatedLoan: any = await EmployeeLoanRequest.findOneAndUpdate(
        {
          _id: loanObjectId,
          employee: employeeObjectId,
          isActive: true,
          isDeleted: false,
          amortizationSchedule: {
            $elemMatch: {
              installmentNumber,
              status: "PENDING",
            },
          },
        },
        {
          $set: {
            "amortizationSchedule.$.status": "PAID",
            "amortizationSchedule.$.payrollRun": runObjectId,
            "amortizationSchedule.$.paidAt": paidAt,
            updatedBy: actorObjectId,
          },
        },
        {
          new: true,
          session: session || null,
        },
      );

      if (!updatedLoan) {
        skippedInstallments++;
        continue;
      }

      updatedInstallments++;

      const stillHasPending = (updatedLoan.amortizationSchedule || []).some(
        (item: any) =>
          ["PENDING", "SKIPPED"].includes(
            String(item.status || "").toUpperCase(),
          ),
      );

      const paidInstallment = (updatedLoan.amortizationSchedule || []).find(
        (item: any) =>
          Number(item.installmentNumber || 0) === installmentNumber &&
          String(item.status || "").toUpperCase() === "PAID",
      );

      if (paidInstallment) {
        await reduceChristmasSalaryGuaranteeAfterInstallmentPaid({
          loan: updatedLoan,
          installment: paidInstallment,
          payrollRunId: runObjectId,
          payrollPaymentId: payment._id,
          bankAuthorizationNumber: cleanAuthorization,
          paidAt,
          actorId: actorObjectId,
          loanFullyPaid: !stillHasPending,
          session,
        });
      }

      const oldStatus = beforeLoan.status;

      if (!stillHasPending) {
        updatedLoan.status = "CLOSED";
        updatedLoan.updatedBy = actorObjectId || updatedLoan.updatedBy;
        updatedLoan.decidedAt = updatedLoan.decidedAt || new Date();

        await updatedLoan.save({
          session: session || undefined,
        });

        closedLoans++;
      }

      await EmployeeLoanRequestHistory.create(
        [
          {
            loanRequest: loanObjectId,
            action: stillHasPending ? "COMMENTED" : "CLOSED",
            fromStatus: oldStatus,
            toStatus: stillHasPending ? oldStatus : "CLOSED",
            comment: stillHasPending
              ? `Cuota ${installmentNumber} confirmada como pagada mediante autorización bancaria ${cleanAuthorization}.`
              : `Última cuota confirmada mediante autorización bancaria ${cleanAuthorization}. Préstamo cerrado.`,
            source: "SYSTEM",
            performedBy: actorObjectId,
            previousData: {
              status: beforeLoan.status,
            },
            newData: {
              payrollRun: runObjectId,
              payrollPayment: payment._id,
              bankAuthorizationNumber: cleanAuthorization,
              deduction,
            },
            metadata: {
              paidAt,
              amount: deduction.amount,
              installmentNumber,
              requestNumber: deduction.requestNumber,
              bankAuthorizationNumber: cleanAuthorization,
            },
          },
        ],
        { session: session || undefined },
      );
    }
  }

  return {
    alreadyFinalized: false,
    updatedInstallments,
    closedLoans,
    skippedInstallments,
  };
};
