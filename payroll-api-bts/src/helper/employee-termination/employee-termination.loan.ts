import { ClientSession, Types, isValidObjectId } from "mongoose";
import {
  ITerminationLoanSnapshot,
  ITerminationLoanSnapshotItem,
  TerminationLoanCalculationSource,
} from "../../model/employee-termination/employeeTermination";
import EmployeeLoanRequest from "../../model/employeeLoan/employeeLoanRequest";
import { toObjectId } from "../objectIds";
import { round2 } from "../parse";

const ACTIVE_INSTALLMENT_STATUSES = ["PENDING", "SKIPPED"];

const getLoanCalculation = (
  loan: any,
): {
  principalOutstanding: number;
  interestOutstanding: number;
  totalOutstanding: number;
  pendingInstallments: number;
  calculationSource: TerminationLoanCalculationSource;
  pendingInstallmentNumbers: number[];
} => {
  const schedule = Array.isArray(loan?.amortizationSchedule)
    ? loan.amortizationSchedule
    : [];

  const pendingSchedule = schedule.filter((installment: any) =>
    ACTIVE_INSTALLMENT_STATUSES.includes(String(installment?.status || "")),
  );

  if (pendingSchedule.length) {
    const principalOutstanding = round2(
      pendingSchedule.reduce(
        (sum: number, installment: any) =>
          sum + Number(installment?.principalAmount || 0),
        0,
      ),
    );

    const interestOutstanding = round2(
      pendingSchedule.reduce(
        (sum: number, installment: any) =>
          sum + Number(installment?.interestAmount || 0),
        0,
      ),
    );

    let totalOutstanding = round2(
      pendingSchedule.reduce(
        (sum: number, installment: any) =>
          sum + Number(installment?.paymentAmount || 0),
        0,
      ),
    );

    if (totalOutstanding <= 0) {
      totalOutstanding = round2(principalOutstanding + interestOutstanding);
    }

    return {
      principalOutstanding,
      interestOutstanding,
      totalOutstanding,
      pendingInstallments: pendingSchedule.length,
      calculationSource: "AMORTIZATION_SCHEDULE",
      pendingInstallmentNumbers: pendingSchedule.map((item: any) =>
        Number(item?.installmentNumber || 0),
      ),
    };
  }

  const totalToPay = round2(loan?.loanQuoteSnapshot?.totalToPay || 0);

  if (totalToPay > 0) {
    const principalOutstanding = round2(
      loan?.loanQuoteSnapshot?.principal || loan?.approvedAmount || 0,
    );

    const interestOutstanding = round2(
      Math.max(0, totalToPay - principalOutstanding),
    );

    return {
      principalOutstanding,
      interestOutstanding,
      totalOutstanding: totalToPay,
      pendingInstallments: Number(
        loan?.loanQuoteSnapshot?.installments ||
          loan?.approvedInstallments ||
          0,
      ),
      calculationSource: "LOAN_QUOTE_SNAPSHOT",
      pendingInstallmentNumbers: [],
    };
  }

  const approvedAmount = round2(
    loan?.approvedAmount || loan?.requestedAmount || 0,
  );

  return {
    principalOutstanding: approvedAmount,
    interestOutstanding: 0,
    totalOutstanding: approvedAmount,
    pendingInstallments: Number(loan?.approvedInstallments || 0),
    calculationSource: "APPROVED_AMOUNT",
    pendingInstallmentNumbers: [],
  };
};

export const getEmployeeLoanTerminationSummary = async (payload: {
  companyId: string | Types.ObjectId;
  employeeId: string | Types.ObjectId;
  maximumDeductionAmount?: number | null;
  session?: ClientSession | null;
}): Promise<ITerminationLoanSnapshot> => {
  const companyId = toObjectId(payload.companyId);
  const employeeId = toObjectId(payload.employeeId);

  const query = EmployeeLoanRequest.find({
    company: companyId,
    employee: employeeId,

    status: "APPROVED",

    isActive: { $ne: false },
    isDeleted: false,
  }).sort({
    approvedAt: 1,
    createdAt: 1,
  });

  if (payload.session) {
    query.session(payload.session);
  }

  const loans = await query.lean();

  const calculatedLoans: ITerminationLoanSnapshotItem[] = [];

  for (const loan of loans) {
    const calculation = getLoanCalculation(loan);

    if (calculation.totalOutstanding <= 0) {
      continue;
    }

    calculatedLoans.push({
      loanRequest: loan._id,

      requestNumber: String(loan.requestNumber || ""),
      status: String(loan.status || ""),

      providerType: String(loan.loanProviderSnapshot?.providerType || ""),

      productCode: String(loan.loanProviderSnapshot?.productCode || ""),

      productName: String(loan.loanProviderSnapshot?.productName || ""),

      approvedAmount: round2(loan.approvedAmount || loan.requestedAmount || 0),

      guaranteedDays: round2(loan.vacationSnapshot?.guaranteedDays || 0),

      principalOutstanding: calculation.principalOutstanding,
      interestOutstanding: calculation.interestOutstanding,
      totalOutstanding: calculation.totalOutstanding,

      amountApplied: 0,
      remainingOutstanding: calculation.totalOutstanding,

      pendingInstallments: calculation.pendingInstallments,
      calculationSource: calculation.calculationSource,

      metadata: {
        vacationReservation: loan.vacationReservation || null,

        productConfig: loan.loanProviderSnapshot?.productConfig || null,
        interestBankAccount:
          loan.loanProviderSnapshot?.interestBankAccount || null,

        pendingInstallmentNumbers: calculation.pendingInstallmentNumbers,

        source: loan.source || "",
        externalSystemCode: loan.externalSystemCode || "",
        externalRequestId: loan.externalRequestId || "",
      },
    });
  }

  const totalPrincipalOutstanding = round2(
    calculatedLoans.reduce((sum, loan) => sum + loan.principalOutstanding, 0),
  );

  const totalInterestOutstanding = round2(
    calculatedLoans.reduce((sum, loan) => sum + loan.interestOutstanding, 0),
  );

  const totalOutstanding = round2(
    calculatedLoans.reduce((sum, loan) => sum + loan.totalOutstanding, 0),
  );

  const totalPendingInstallments = calculatedLoans.reduce(
    (sum, loan) => sum + loan.pendingInstallments,
    0,
  );

  const totalGuaranteedDays = round2(
    calculatedLoans.reduce((sum, loan) => sum + loan.guaranteedDays, 0),
  );

  const hasMaximumDeduction =
    payload.maximumDeductionAmount !== undefined &&
    payload.maximumDeductionAmount !== null;

  let availableAmount = hasMaximumDeduction
    ? Math.max(0, round2(Number(payload.maximumDeductionAmount ?? 0)))
    : totalOutstanding;

  for (const loan of calculatedLoans) {
    const amountApplied = round2(
      Math.min(loan.totalOutstanding, availableAmount),
    );

    loan.amountApplied = amountApplied;
    loan.remainingOutstanding = round2(
      Math.max(0, loan.totalOutstanding - amountApplied),
    );

    availableAmount = round2(Math.max(0, availableAmount - amountApplied));
  }

  const totalDeducted = round2(
    calculatedLoans.reduce((sum, loan) => sum + loan.amountApplied, 0),
  );

  const remainingOutstanding = round2(
    Math.max(0, totalOutstanding - totalDeducted),
  );

  return {
    hasActiveLoans: calculatedLoans.length > 0,

    totalLoans: calculatedLoans.length,
    totalPendingInstallments,
    totalGuaranteedDays,

    totalPrincipalOutstanding,
    totalInterestOutstanding,
    totalOutstanding,

    totalDeducted,
    remainingOutstanding,

    calculatedAt: new Date(),

    loans: calculatedLoans,
  };
};
