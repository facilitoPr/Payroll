import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import User from "../../model/account/user";
import PaymentSchedule from "../../model/employee-payment-management/paymentSchedule";
import WorkSummary from "../../model/punch/workSummary";
import PayrollRun from "../../model/employee-payment-management/payrollRun";
import PayrollPayment from "../../model/employee-payment-management/payrollPayment";
import TerminationLoanPayrollPendingPayment from "../../model/employee-termination/terminationLoanPayrollPendingPayment";
import { sendEmail } from "../../utils/sendEmail";
import { buildEmployeePayslipHTML } from "../../helper/payroll/payrollEmailTemplates";
import { buildDateQuery } from "../../helper/date";
import moment from "moment";
import { getSuggestedPeriodFromSchedule } from "../../helper/payroll/getSuggestedPeriod";
import { notifyUsers } from "../../services/notification.service";
import { buildPayrollBankFile } from "../../helper/payrollBankFileBuilder";
import PayrollBankFile from "../../model/payroll/PayrollBankFile";
import CompanyProfile from "../../model/companyProfile";
import {
  getEmployeeBankMissingFields,
  validateClosePeriodPrerequisites,
} from "../../helper/payroll/validate-bank-fields";
import {
  EMAIL_CONCURRENCY,
  EMAIL_TIMEOUT_MS,
  fireAndForget,
  NOTIF_CONCURRENCY,
  NOTIFY_TIMEOUT_MS,
  runWithConcurrency,
  withTimeout,
} from "../../helper/payroll/anti-timeout";
import { escapeRegex, round2, toNum } from "../../helper/parse";
import { parseISODateToYMD } from "../../helper/payroll/payroll.parse";
import { getPeriodDivisor } from "../../helper/payroll/payroll.get";
import { isValidObjectId } from "mongoose";
import { resolveSalaryCode } from "../../services/payroll/salaryType.service";
import {
  buildPayrollLaborBaseSnapshot,
  normalizePayrollEarningsForLabor,
  buildPayrollRunKey,
  ConfirmScopeMode,
  validScopeModes,
  buildPayrollPaymentPeriodMeta,
  attachLaborBaseToPayrollSnapshot,
} from "../../helper/payroll/payroll.build";
import { getMongoIdString } from "../../helper/objectIds";
import { resolvePayrollCloseUserIds } from "../../helper/payroll/payroll.closeScope";
import {
  computeAttendanceDiscountPeriodUsingDayCalc,
  findUnconfirmedDaysByUsers,
  getEmployeePaymentSnapshot,
} from "../../services/payroll/payroll.service";
import { safeEmail } from "../../helper/employee/employee.safe";
import { resolvePayrollCompanyFromUsers } from "../../helper/payroll/payroll.company";
import { patchBankSnapshotAmount } from "../../helper/payroll/payroll.patch";
import {
  getPayrollPolicyConfig,
  buildPayrollPolicySnapshot,
} from "../../helper/payroll/payrollPolicy";
import { ensurePayrollAttendanceSnapshotCompatibility } from "../../helper/payroll/payroll.attendanceCompatibility";
import { buildPayrollFingerprint } from "../../helper/payroll/payroll.fingerprint";
import { appendRunNote } from "../../helper/payroll/payroll.append";
import {
  applyEmployeeLoanDeductionsToPayrollSnapshot,
  finalizeEmployeeLoanDeductionsAfterBankAuthorization,
  markEmployeeLoanDeductionsAsPaidFromSnapshot,
} from "../../helper/payroll/payrolls.employeeLoanDeduction";
import {
  accrueChristmasSalaryForFinanciallyConfirmedPayrollRun,
  reverseChristmasSalaryAccrualsForPayrollRun,
} from "../../services/employee-payment-management/employeeChristmasSalaryLedger.service";

moment.locale("es-do");

// MIGRATE

const normalizeBankCurrencyCode = (value: any) => {
  const code = String(value || "").trim().toUpperCase();

  if (code === "DOP") return "214";
  if (code === "USD") return "840";
  if (code === "EUR") return "978";

  return code || "214";
};

const getSnapshotPayrollDistribution = (snapshot: any) => {
  const totals = snapshot?.totals || {};
  const distribution = snapshot?.paymentDistribution || {};

  const employeeNetToDeposit = round2(toNum(totals.sueldoNetoPeriodo, 0));
  const employeeLoanDeductions = round2(
    toNum(
      distribution.employeeLoanDeductionsTotal,
      toNum(totals.totalPrestamosEmpleadoPeriodo, 0),
    ),
  );
  const thirdPartyPayments = round2(
    toNum(distribution.thirdPartyPaymentsTotal, employeeLoanDeductions),
  );
  const companyDisbursement = round2(
    toNum(
      distribution.totalCompanyDisbursementForEmployee,
      toNum(
        distribution.employeeNetBeforeEmployeeLoan,
        employeeNetToDeposit + employeeLoanDeductions,
      ),
    ),
  );

  return {
    companyDisbursement,
    employeeNetToDeposit,
    employeeLoanDeductions,
    thirdPartyPayments,
  };
};

const normalizePaymentAttendanceForRead = (payment: any) => {
  if (!payment?.snapshot) return payment;

  ensurePayrollAttendanceSnapshotCompatibility(payment.snapshot, {
    calculationMode: "FULL_PERIOD",
    attendanceCutoffDate:
      payment?.snapshot?.period?.end || payment?.payrollRun?.periodEnd || "",
    source: "LEGACY_DEFAULT",
  });

  return payment;
};

const normalizeLoanBankAccountType = (value: any) => {
  const code = String(value || "").trim().toUpperCase();

  if (code === "SAVINGS" || code === "AHORRO" || code === "2") return "2";
  if (code === "CHECKING" || code === "CORRIENTE" || code === "BUSINESS") {
    return "1";
  }

  return code || "2";
};

const getLoanBankOperationCode = (accountType: any) => {
  const normalized = normalizeLoanBankAccountType(accountType);

  if (normalized === "1") return "22";
  if (normalized === "2") return "32";

  return "";
};

const buildLoanThirdPartyBankSnapshot = (thirdPartyPayment: any) => {
  const bank = thirdPartyPayment?.bankAccountSnapshot || {};
  const rawBankCode = String(bank.bankCode || "").trim();
  const accountType = normalizeLoanBankAccountType(bank.accountType);

  return {
    accountNumber: String(bank.accountNumber || "").trim(),
    accountType,
    currency: normalizeBankCurrencyCode(bank.currency),
    bankCode: rawBankCode.slice(0, 8),
    bankDigit:
      String(bank.bankDigit || "").trim() ||
      (rawBankCode.length > 8 ? rawBankCode.slice(8, 9) : ""),
    operationCode:
      String(bank.operationCode || "").trim() ||
      getLoanBankOperationCode(accountType),
    idType: String(bank.idType || "").trim() || "RN",
    idNumber: String(bank.beneficiaryDocument || "").trim(),
    beneficiaryName:
      String(bank.beneficiaryName || "").trim() ||
      String(thirdPartyPayment?.description || "").trim() ||
      "Cuenta prestamo empleado",
    referenceNumber: String(thirdPartyPayment?.reference || "")
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

const expandPayrollPaymentsForBankFile = (payments: any[]) => {
  const expanded: any[] = [];

  for (const payment of payments || []) {
    expanded.push(payment);

    const thirdPartyPayments = Array.isArray(payment?.snapshot?.thirdPartyPayments)
      ? payment.snapshot.thirdPartyPayments
      : [];

    thirdPartyPayments.forEach((thirdPartyPayment: any, index: number) => {
      const amount = round2(toNum(thirdPartyPayment?.amount, 0));

      if (amount <= 0) return;

      expanded.push({
        _id: `${String(payment._id)}-third-party-${index + 1}`,
        user: payment.user,
        employeeName:
          thirdPartyPayment?.bankAccountSnapshot?.beneficiaryName ||
          thirdPartyPayment?.description ||
          `${payment.employeeName || "Empleado"} - prestamo`,
        snapshot: {
          totals: {
            sueldoNetoPeriodo: amount,
          },
        },
        bankSnapshot: buildLoanThirdPartyBankSnapshot(thirdPartyPayment),
        thirdPartyPayment,
        sourcePayrollPayment: payment._id,
      });
    });
  }

  return expanded;
};

const buildTerminationLoanBankFilePayment = (pendingPayment: any) => {
  return {
    _id: `termination-loan-${String(pendingPayment._id)}`,
    user: pendingPayment.loanRequest,
    employeeName:
      pendingPayment?.bankSnapshot?.beneficiaryName ||
      pendingPayment.productName ||
      pendingPayment.description ||
      "Pago préstamo desvinculación",
    snapshot: {
      totals: {
        sueldoNetoPeriodo: round2(toNum(pendingPayment.amount, 0)),
      },
    },
    bankSnapshot: {
      ...(pendingPayment.bankSnapshot || {}),
      statementDescription:
        pendingPayment?.bankSnapshot?.statementDescription ||
        "PAGO PRESTAMO DESV",
    },
    thirdPartyPayment: {
      type: "TERMINATION_EMPLOYEE_LOAN",
      amount: round2(toNum(pendingPayment.amount, 0)),
      description: pendingPayment.description || "Pago préstamo desvinculación",
      loanRequest: String(pendingPayment.loanRequest || ""),
      requestNumber: pendingPayment.requestNumber || "",
      termination: String(pendingPayment.termination || ""),
      pendingPayment: String(pendingPayment._id || ""),
    },
  };
};

const getPendingTerminationLoanPayrollSummary = async ({
  companyId,
  session,
  limit = 10,
}: {
  companyId: string | Types.ObjectId;
  session?: any;
  limit?: number;
}) => {
  const query = {
    company: new Types.ObjectId(String(companyId)),
    status: "PENDING",
    isDeleted: false,
  };

  const [agg, rows] = await Promise.all([
    TerminationLoanPayrollPendingPayment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ]).session(session || null),
    TerminationLoanPayrollPendingPayment.find(query)
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean()
      .session(session || null),
  ]);

  return {
    count: Number(agg?.[0]?.count || 0),
    total: round2(agg?.[0]?.total || 0),
    rows: rows.map((row: any) => ({
      pendingPaymentId: String(row._id),
      employeeName: row.employeeName || "",
      requestNumber: row.requestNumber || "",
      productName: row.productName || "",
      amount: round2(row.amount || 0),
      description: row.description || "",
    })),
  };
};

const claimPendingTerminationLoanPaymentsForRun = async ({
  companyId,
  payrollRunId,
  session,
}: {
  companyId: string | Types.ObjectId;
  payrollRunId: Types.ObjectId;
  session: any;
}) => {
  const pendingRows: any[] = await TerminationLoanPayrollPendingPayment.find({
    company: new Types.ObjectId(String(companyId)),
    status: "PENDING",
    isDeleted: false,
  })
    .sort({ createdAt: 1 })
    .session(session)
    .lean();

  if (!pendingRows.length) {
    return {
      count: 0,
      total: 0,
      rows: [],
    };
  }

  await TerminationLoanPayrollPendingPayment.updateMany(
    {
      _id: { $in: pendingRows.map((row) => row._id) },
      status: "PENDING",
      isDeleted: false,
    },
    {
      $set: {
        status: "CLAIMED",
        payrollRun: payrollRunId,
        claimedAt: new Date(),
      },
    },
    { session },
  );

  return {
    count: pendingRows.length,
    total: round2(
      pendingRows.reduce((sum, row) => sum + toNum(row.amount, 0), 0),
    ),
    rows: pendingRows.map((row) => ({
      pendingPayment: row._id,
      termination: row.termination || null,
      terminationPayment: row.terminationPayment || null,
      loanRequest: row.loanRequest || null,
      employee: row.employee || null,
      employeeName: row.employeeName || "",
      requestNumber: row.requestNumber || "",
      productName: row.productName || "",
      amount: round2(row.amount || 0),
      description: row.description || "",
    })),
  };
};

const markTerminationLoanPendingPaymentsPaidForRun = async ({
  payrollRunId,
  paidAt,
  session,
}: {
  payrollRunId: string | Types.ObjectId;
  paidAt: Date;
  session?: any;
}) => {
  await TerminationLoanPayrollPendingPayment.updateMany(
    {
      payrollRun: new Types.ObjectId(String(payrollRunId)),
      status: "CLAIMED",
      isDeleted: false,
    },
    {
      $set: {
        status: "PAID",
        paidAt,
      },
    },
    { session: session || undefined },
  );
};

const sendPayrollRunPayslipEmails = async ({
  payrollRunId,
}: {
  payrollRunId: Types.ObjectId | string;
}) => {
  const run: any = await PayrollRun.findById(payrollRunId).lean();

  if (!run) {
    return {
      ok: false,
      emailedCount: 0,
      emailFailedCount: 0,
      mensaje: "PayrollRun no encontrado.",
    };
  }

  const paymentsDocs: any[] = await PayrollPayment.find({
    payrollRun: new Types.ObjectId(String(payrollRunId)),
    isDeleted: false,
    $or: [
      { emailStatus: { $in: [null, "", "PENDING"] } },
      { emailStatus: { $exists: false } },
      { emailedAt: { $in: [null, undefined] } },
    ],
  }).lean();

  let emailedCount = 0;
  let emailFailedCount = 0;

  await runWithConcurrency(paymentsDocs, EMAIL_CONCURRENCY, async (p: any) => {
    try {
      const sent = await withTimeout(
        sendEmail({
          to: p.employeeEmail,
          subject: `Volante de pago (${run.periodStart} a ${run.periodEnd})`,
          html: buildEmployeePayslipHTML(p),
        }),
        EMAIL_TIMEOUT_MS,
        `sendEmail employee=${p.employeeEmail}`,
      );

      if (sent) {
        emailedCount++;

        await PayrollPayment.findByIdAndUpdate(p._id, {
          emailStatus: "EMAILED",
          emailedAt: new Date(),
          emailError: "",
        });
      } else {
        emailFailedCount++;

        await PayrollPayment.findByIdAndUpdate(p._id, {
          emailStatus: "EMAIL_FAILED",
          emailedAt: null,
          emailError: "sendEmail retornó false",
        });
      }
    } catch (e: any) {
      emailFailedCount++;

      await PayrollPayment.findByIdAndUpdate(p._id, {
        emailStatus: "EMAIL_FAILED",
        emailedAt: null,
        emailError: String(e?.message || e),
      });
    }
  });

  const okTotal = await PayrollPayment.countDocuments({
    payrollRun: payrollRunId,
    isDeleted: false,
    emailStatus: "EMAILED",
  });
  const failTotal = await PayrollPayment.countDocuments({
    payrollRun: payrollRunId,
    isDeleted: false,
    emailStatus: "EMAIL_FAILED",
  });

  await PayrollRun.findByIdAndUpdate(payrollRunId, {
    $set: {
      emailStats: {
        ...(run.emailStats || {}),
        emailedCount: okTotal,
        emailFailedCount: failTotal,
      },
    },
  });

  return {
    ok: true,
    emailedCount,
    emailFailedCount,
  };
};

export const migrateLegacyPayrollRunFingerprints = async () => {
  const runs = await PayrollRun.find({
    $or: [
      { payrollFingerprint: { $exists: false } },
      { payrollFingerprint: null },
      { payrollFingerprint: "" },
    ],
  }).select("_id payrollFingerprint");

  for (const run of runs) {
    run.payrollFingerprint = `LEGACY_${String(run._id)}`;
    await run.save();
  }

  console.log(
    `[migrateLegacyPayrollRunFingerprints] Actualizados: ${runs.length}`,
  );
};

//

const closePeriod = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  const t0 = Date.now();

  req.on?.("aborted", () => {
    console.error("[closePeriod] request aborted after", Date.now() - t0, "ms");
  });

  res.on?.("close", () => {
    if (!res.writableEnded) {
      console.error(
        "[closePeriod] connection closed WITHOUT response after",
        Date.now() - t0,
        "ms",
      );
    }
  });

  try {
    const {
      userIds = [],
      fechaInicio,
      fechaFin,
      projectId = null,
      companyId = null,
      departmentId = null,
      jobPositionId = null,
      paymentScheduleId = null,
      scopeMode = "EMPLOYEES",
      requestedScopeMode = null,
      wasManuallyAdjusted = false,
      omittedEmployees = [],
      requireConfirmedDays = true,
      payDate,
      frequencyCode,
      excludeUserIds = [],
      additionalUserIds = [],
    } = req.body as any;

    const normalizedScopeMode = String(
      scopeMode || "EMPLOYEES",
    ).toUpperCase() as ConfirmScopeMode;

    if (!validScopeModes.includes(normalizedScopeMode)) {
      return res.status(400).send({
        ok: false,
        mensaje: "scopeMode inválido.",
      });
    }

    const normalizedRequestedScopeMode = requestedScopeMode
      ? (String(requestedScopeMode).toUpperCase() as ConfirmScopeMode)
      : normalizedScopeMode;

    if (!validScopeModes.includes(normalizedRequestedScopeMode)) {
      return res.status(400).send({
        ok: false,
        mensaje: "requestedScopeMode inválido.",
      });
    }

    if (!fechaInicio) {
      return res.status(400).send({
        ok: false,
        mensaje: "Debes enviar fechaInicio.",
      });
    }

    const start = parseISODateToYMD(fechaInicio);
    const end = parseISODateToYMD(fechaFin || fechaInicio);

    const resolved = await resolvePayrollCloseUserIds({
      scopeMode: normalizedScopeMode,
      userIds,
      companyId,
      departmentId,
      jobPositionId,
      projectId,
      paymentScheduleId,
      excludeUserIds,
      additionalUserIds,
    });

    if (!resolved.ok) {
      return res.status(400).send({
        ok: false,
        mensaje: resolved.mensaje,
      });
    }

    const ids = resolved.userIds || [];

    if (!ids.length) {
      return res.status(200).send({
        ok: true,
        canClose: false,
        mensaje: "No se encontraron empleados para el alcance seleccionado.",
        employeeCount: 0,
        unconfirmedCount: 0,
        missingBankCount: 0,
        companyMissingCount: 0,
        createdCount: 0,
        skippedCount: 0,
      });
    }

    const idsSorted = [...ids].sort();

    const companyResp = await resolvePayrollCompanyFromUsers({
      userIds: idsSorted,
      requestedCompanyId: companyId,
    });

    if (!companyResp.ok) {
      return res.status(companyResp.status || 409).send({
        ok: false,
        status: companyResp.status || 409,
        mensaje: companyResp.mensaje,
        employees: (companyResp as any).employees || [],
        companyIds: (companyResp as any).companyIds || [],
      });
    }

    const payrollCompanyId = companyResp.companyId;
    const payrollCompany = companyResp.company;
    const payrollCompanyObjectId = new Types.ObjectId(payrollCompanyId);
    const payrollPolicyResp = await getPayrollPolicyConfig({
      companyId: payrollCompanyId,
    });

    const payrollPolicy = payrollPolicyResp.policy;
    const payrollPolicyConfig = payrollPolicyResp.config;

    const payrollPolicySnapshot = buildPayrollPolicySnapshot(
      payrollPolicy,
      payrollPolicyConfig,
    );

    const projectObjId =
      projectId && getMongoIdString(projectId)
        ? new Types.ObjectId(getMongoIdString(projectId) as string)
        : null;

    const runKey = buildPayrollRunKey({
      companyId: payrollCompanyId,
      start,
      end,
      projectId: projectObjId,
      frequencyCode: frequencyCode ? String(frequencyCode) : null,
      userIds: idsSorted,
    });

    const unconfirmed = requireConfirmedDays
      ? await findUnconfirmedDaysByUsers(idsSorted, start, end)
      : [];

    if (requireConfirmedDays && unconfirmed.length) {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje:
          "Hay días no confirmados para pago. No se puede cerrar la nómina con esta opción activa.",
        unconfirmed,
      });
    }

    const prereq = await validateClosePeriodPrerequisites({
      userIds: idsSorted,
      companyId: payrollCompanyId,
      companyDoc: payrollCompany,
    });

    if (prereq.employeesWrongCompany?.length) {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje:
          "Hay empleados que no pertenecen a la empresa del cierre. No se puede cerrar esta nómina.",
        employees: prereq.employeesWrongCompany,
      });
    }

    if (prereq.notFound?.length) {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje: "Hay empleados que no existen. No se puede cerrar la nómina.",
        notFound: prereq.notFound,
      });
    }

    if (prereq.companyMissing?.length) {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje:
          "Faltan datos requeridos en la empresa. Completa estos campos para cerrar la nómina.",
        missingFields: prereq.companyMissing,
      });
    }

    if (prereq.employeesMissingBank?.length) {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje:
          "Hay empleados sin datos bancarios completos. Completa los campos requeridos para poder cerrar la nómina.",
        employees: prereq.employeesMissingBank,
      });
    }

    const actorIdRaw = req.user?._id;

    if (!actorIdRaw || !getMongoIdString(actorIdRaw)) {
      return res.status(401).send({
        ok: false,
        mensaje: "No autorizado: falta req.user en el token.",
      });
    }

    const actorId = new Types.ObjectId(getMongoIdString(actorIdRaw) as string);

    const finalPayDate = payDate ? new Date(payDate) : new Date();

    if (payDate && Number.isNaN(finalPayDate.getTime())) {
      return res.status(400).send({
        ok: false,
        mensaje: "payDate inválido.",
      });
    }

    const payrollPaymentPeriodMeta = buildPayrollPaymentPeriodMeta({
      start,
      end,
      payDate: finalPayDate,
    });

    const runId = new Types.ObjectId();

    const emailStats = {
      requestedCount: idsSorted.length,
      createdCount: 0,
      skippedCount: 0,
      emailedCount: 0,
      emailFailedCount: 0,
    };
    const skippedEmployeesForRun: any[] = Array.isArray(omittedEmployees)
      ? omittedEmployees.map((employee: any) => ({
          user:
            employee?.userId && Types.ObjectId.isValid(String(employee.userId))
              ? new Types.ObjectId(String(employee.userId))
              : null,
          userId: String(employee?.userId || ""),
          name: String(employee?.name || employee?.label || ""),
          email: String(employee?.email || employee?.username || ""),
          departmentName: String(
            employee?.departmentName || employee?.department?.name || "",
          ),
          jobPositionName: String(
            employee?.jobPositionName || employee?.jobPosition?.name || "",
          ),
          projectName: String(employee?.projectName || employee?.project?.name || ""),
          salaryType: String(employee?.salaryType || employee?.tipoSalario || ""),
          workedHoursPeriod: round2(toNum(employee?.workedHoursPeriod, 0)),
          paidHoursPeriod: round2(toNum(employee?.paidHoursPeriod, 0)),
          netPeriod: round2(toNum(employee?.netPeriod || employee?.netoADepositar, 0)),
          status: "SKIPPED",
          reason:
            String(employee?.reason || "").trim() ||
            "Descartado manualmente para esta nómina.",
          source: "MANUAL",
          createdAt: new Date(),
        }))
      : [];
    let terminationLoanClaimResult: any = {
      count: 0,
      total: 0,
      rows: [],
    };

    await session.withTransaction(async () => {
      const totalsAgg = {
        grossMonthly: 0,
        grossPeriod: 0,
        totalLegalDeductionsMonthly: 0,
        totalLegalDeductionsPeriod: 0,
        totalOtherDeductionsMonthly: 0,
        totalOtherDeductionsPeriod: 0,
        totalDeductionsMonthly: 0,
        totalDeductionsPeriod: 0,
        isrMonthly: 0,
        isrPeriod: 0,
        netMonthly: 0,
        netPeriod: 0,
        companyDisbursementPeriod: 0,
        employeeNetToDepositPeriod: 0,
        employeeLoanDeductionsPeriod: 0,
        thirdPartyPaymentsPeriod: 0,
      };

      const paymentItems: Array<{
        userId: string;
        empId: Types.ObjectId;
        snapshot: any;
        bankSnapshot: any;
      }> = [];

      for (const empIdStr of idsSorted) {
        const empId = new Types.ObjectId(empIdStr);

        const userDoc: any = await User.findById(empId)
          .select(
            "name email username payrollBank schedule punchTypeId salaryType hourlyRate",
          )
          .populate({ path: "punchTypeId" })
          .populate({ path: "salaryType", select: "code" })
          .session(session)
          .lean();

        if (!userDoc) {
          emailStats.skippedCount++;
          skippedEmployeesForRun.push({
            user: null,
            userId: empIdStr,
            name: empIdStr,
            email: "",
            status: "SKIPPED",
            reason: "Empleado no encontrado.",
            source: "SYSTEM",
            createdAt: new Date(),
          });
          continue;
        }

        const employeeEmail = safeEmail(userDoc);

        if (!employeeEmail) {
          emailStats.skippedCount++;
          skippedEmployeesForRun.push({
            user: empId,
            userId: empIdStr,
            name: userDoc.name || empIdStr,
            email: userDoc.email || userDoc.username || "",
            status: "SKIPPED",
            reason: "Empleado sin correo válido.",
            source: "SYSTEM",
            createdAt: new Date(),
          });
          continue;
        }

        const missingBank = getEmployeeBankMissingFields(userDoc.payrollBank);

        if (missingBank.length) {
          throw new Error(
            `Empleado ${
              userDoc?.name || empIdStr
            } no tiene datos bancarios completos: ${missingBank.join(", ")}`,
          );
        }

        const { snapshot, bankSnapshot } = await getEmployeePaymentSnapshot({
          employeeId: empIdStr,
          fechaInicio: start,
          fechaFin: end,
          payDate: finalPayDate,
          frequencyCode,
          session,
          mode: "CLOSE",
          companyDoc: payrollCompany,
          runId,
          payrollPolicyConfig,
        });

        try {
          const salaryCode = await resolveSalaryCode(userDoc);

          if (salaryCode === "FIJO") {
            const divisor = getPeriodDivisor(frequencyCode);
            const t: any = snapshot?.totals || {};

            const brutoMensual = toNum(t.sueldoBrutoMensual, 0);
            const rdFactorDiasMes = Number(
              payrollPolicyConfig.rdFactorDiasMes || 23.83,
            );

            const baseDailyForDiscountFixed =
              rdFactorDiasMes > 0 ? brutoMensual / rdFactorDiasMes : 0;

            const { discountPeriod } =
              await computeAttendanceDiscountPeriodUsingDayCalc({
                employee: userDoc,
                employeeId: empId,
                startYMD: start,
                endYMD: end,
                salaryCode,
                baseDailyForDiscountFixed,
                payrollPolicyConfig,
                session,
              });

            const netPeriodoBase = toNum(t.sueldoNetoPeriodo, 0);

            t.sueldoBrutoPeriodo = round2(brutoMensual / divisor || 0);

            const legalMensual = toNum(t.totalDeduccionesLegalesMensual, 0);
            const otrasMensual = toNum(t.totalOtrasDeduccionesMensual, 0);
            const totalDedMensual = toNum(t.totalDeduccionesMensual, 0);

            snapshot.otherDeductions = snapshot.otherDeductions || [];

            if (discountPeriod > 0) {
              snapshot.otherDeductions.push({
                nombre: "Descuento por asistencia (tardanzas/ausencias)",
                montoPeriodo: round2(discountPeriod),
              });
            }

            t.totalDeduccionesLegalesPeriodo = round2(
              legalMensual / divisor || 0,
            );

            t.totalOtrasDeduccionesPeriodo = round2(
              otrasMensual / divisor + discountPeriod,
            );

            t.totalDeduccionesPeriodo = round2(
              totalDedMensual / divisor + discountPeriod,
            );

            t.sueldoNetoPeriodo = round2(
              Math.max(0, netPeriodoBase - discountPeriod),
            );

            patchBankSnapshotAmount(bankSnapshot, t.sueldoNetoPeriodo);
          }
        } catch (e) {
          console.error(
            "[closePeriod] attendance discount recompute failed:",
            empIdStr,
            e,
          );
        }

        try {
          await applyEmployeeLoanDeductionsToPayrollSnapshot({
            employeeId: empId,
            snapshot,
            bankSnapshot,
            payDate: finalPayDate,
            mode: "PREVIEW",
            session,
          });
        } catch (error) {
          console.error(
            "[closePeriod] employee loan deductions preview failed:",
            empIdStr,
            error,
          );

          throw new Error(
            `No se pudieron validar los préstamos del empleado ${
              userDoc?.name || empIdStr
            }. ${String((error as any)?.message || error)}`,
          );
        }

        /**
         * IMPORTANTE:
         * Esto prepara el PayrollPayment para futuros cálculos de desvinculación.
         *
         * - Normaliza earnings con flags:
         *   isOrdinarySalary
         *   includeForTerminationAverage
         *   includeForChristmasSalary
         *
         * - Guarda snapshot.laborBase:
         *   ordinarySalaryPeriod
         *   terminationAverageAmountPeriod
         *   christmasSalaryAmountPeriod
         *
         * Esto no rompe pagos viejos porque solo agrega campos nuevos.
         */
        attachLaborBaseToPayrollSnapshot(snapshot);

        paymentItems.push({
          userId: empIdStr,
          empId,
          snapshot,
          bankSnapshot,
        });

        emailStats.createdCount++;

        const t = snapshot.totals;

        totalsAgg.grossMonthly += toNum(t.sueldoBrutoMensual, 0);
        totalsAgg.grossPeriod += toNum(t.sueldoBrutoPeriodo, 0);

        totalsAgg.totalLegalDeductionsMonthly += toNum(
          t.totalDeduccionesLegalesMensual,
          0,
        );

        totalsAgg.totalLegalDeductionsPeriod += toNum(
          t.totalDeduccionesLegalesPeriodo,
          0,
        );

        totalsAgg.totalOtherDeductionsMonthly += toNum(
          t.totalOtrasDeduccionesMensual,
          0,
        );

        totalsAgg.totalOtherDeductionsPeriod += toNum(
          t.totalOtrasDeduccionesPeriodo,
          0,
        );

        totalsAgg.totalDeductionsMonthly += toNum(t.totalDeduccionesMensual, 0);

        totalsAgg.totalDeductionsPeriod += toNum(t.totalDeduccionesPeriodo, 0);

        totalsAgg.isrMonthly += toNum(snapshot.isr?.isrMensual, 0);
        totalsAgg.isrPeriod += toNum(snapshot.isr?.isrPeriodo, 0);

        const distribution = getSnapshotPayrollDistribution(snapshot);

        totalsAgg.netMonthly += toNum(t.sueldoNetoMensual, 0);
        totalsAgg.netPeriod += distribution.companyDisbursement;
        totalsAgg.companyDisbursementPeriod += distribution.companyDisbursement;
        totalsAgg.employeeNetToDepositPeriod +=
          distribution.employeeNetToDeposit;
        totalsAgg.employeeLoanDeductionsPeriod +=
          distribution.employeeLoanDeductions;
        totalsAgg.thirdPartyPaymentsPeriod += distribution.thirdPartyPayments;
      }

      const payrollFingerprint = buildPayrollFingerprint({
        companyId: payrollCompanyId,
        periodStart: start,
        periodEnd: end,
        frequencyCode: frequencyCode ? String(frequencyCode) : null,
        requestedUserIds: idsSorted,
        payments: paymentItems.map((item) => ({
          userId: item.userId,
          snapshot: item.snapshot,
          bankSnapshot: item.bankSnapshot,
        })),
      });

      const duplicateRun = await PayrollRun.findOne({
        payrollFingerprint,
        isDeleted: false,
        status: "CLOSED",
      })
        .select("_id payDate employeeCount payrollFingerprint")
        .session(session)
        .lean();

      if (duplicateRun) {
        const err: any = new Error("DUPLICATE_PAYROLL_FINGERPRINT");

        err.httpStatus = 409;
        err.payload = {
          status: 409,
          ok: false,
          mensaje:
            "Ya existe una nómina cerrada con exactamente los mismos empleados, montos, deducciones e incentivos.",
          runId: String(duplicateRun._id),
          payDate: duplicateRun.payDate,
          employeeCount: duplicateRun.employeeCount,
          payrollFingerprint,
        };

        throw err;
      }

      const terminationLoanClaim =
        await claimPendingTerminationLoanPaymentsForRun({
          companyId: payrollCompanyId,
          payrollRunId: runId,
          session,
        });
      terminationLoanClaimResult = terminationLoanClaim;

      const runArr = await PayrollRun.create(
        [
          {
            _id: runId,
            company: payrollCompanyObjectId,
            runKey,
            payrollFingerprint,
            periodStart: start,
            periodEnd: end,
            payDate: finalPayDate,
            requireConfirmedDays: !!requireConfirmedDays,
            policySnapshot: payrollPolicySnapshot,
            filters: {
              companyId: payrollCompanyObjectId,
              departmentId:
                departmentId && getMongoIdString(departmentId)
                  ? new Types.ObjectId(getMongoIdString(departmentId) as string)
                  : null,
              jobPositionId:
                jobPositionId && getMongoIdString(jobPositionId)
                  ? new Types.ObjectId(
                      getMongoIdString(jobPositionId) as string,
                    )
                  : null,
              projectId: projectObjId,
              paymentScheduleId:
                paymentScheduleId && getMongoIdString(paymentScheduleId)
                  ? new Types.ObjectId(
                      getMongoIdString(paymentScheduleId) as string,
                    )
                  : null,
              scopeMode: normalizedRequestedScopeMode,
              executionScopeMode: normalizedScopeMode,
              wasManuallyAdjusted:
                !!wasManuallyAdjusted ||
                normalizedRequestedScopeMode !== normalizedScopeMode,
              userIds: idsSorted.map((x) => new Types.ObjectId(x)),
            },
            createdBy: actorId,
            status: "CLOSED",
            employeeCount: emailStats.createdCount,
            totals: {
              grossMonthly: round2(totalsAgg.grossMonthly),
              grossPeriod: round2(totalsAgg.grossPeriod),
              totalLegalDeductionsMonthly: round2(
                totalsAgg.totalLegalDeductionsMonthly,
              ),
              totalLegalDeductionsPeriod: round2(
                totalsAgg.totalLegalDeductionsPeriod,
              ),
              totalOtherDeductionsMonthly: round2(
                totalsAgg.totalOtherDeductionsMonthly,
              ),
              totalOtherDeductionsPeriod: round2(
                totalsAgg.totalOtherDeductionsPeriod,
              ),
              totalDeductionsMonthly: round2(totalsAgg.totalDeductionsMonthly),
              totalDeductionsPeriod: round2(totalsAgg.totalDeductionsPeriod),
              isrMonthly: round2(totalsAgg.isrMonthly),
              isrPeriod: round2(totalsAgg.isrPeriod),
              netMonthly: round2(totalsAgg.netMonthly),
              netPeriod: round2(totalsAgg.netPeriod),
              companyDisbursementPeriod: round2(
                totalsAgg.companyDisbursementPeriod,
              ),
              employeeNetToDepositPeriod: round2(
                totalsAgg.employeeNetToDepositPeriod,
              ),
              employeeLoanDeductionsPeriod: round2(
                totalsAgg.employeeLoanDeductionsPeriod,
              ),
              thirdPartyPaymentsPeriod: round2(
                totalsAgg.thirdPartyPaymentsPeriod,
              ),
            },
            emailStats: {
              requestedCount: emailStats.requestedCount,
              createdCount: emailStats.createdCount,
              skippedCount: skippedEmployeesForRun.length,
              emailedCount: 0,
              emailFailedCount: 0,
            },
            skippedEmployees: skippedEmployeesForRun,
            terminationLoanPendingPayments: terminationLoanClaimResult.rows,
            terminationLoanPendingPaymentsCount: terminationLoanClaimResult.count,
            terminationLoanPendingPaymentsTotal: terminationLoanClaimResult.total,
          },
        ],
        { session },
      );

      const run: any = runArr[0];

      for (const item of paymentItems) {
        await PayrollPayment.create(
          [
            {
              company: payrollCompanyObjectId,

              payrollRun: run._id,
              user: item.empId,

              periodStart: payrollPaymentPeriodMeta.periodStart,
              periodEnd: payrollPaymentPeriodMeta.periodEnd,
              payDate: payrollPaymentPeriodMeta.payDate,
              year: payrollPaymentPeriodMeta.year,
              month: payrollPaymentPeriodMeta.month,
              periodKey: payrollPaymentPeriodMeta.periodKey,

              employeeName: item.snapshot.employee.name,
              employeeEmail: item.snapshot.employee.email,

              emailStatus: "PENDING",

              snapshot: item.snapshot,
              bankSnapshot: item.bankSnapshot,

              isActive: true,
              isDeleted: false,
            },
          ],
          { session },
        );

     
        const dateQuery = buildDateQuery(fechaInicio, fechaFin);

        await WorkSummary.updateMany(
          {
            user: item.empId,
            isDeleted: false,
            dateString: dateQuery,
          },
          {
            isPaid: true,
          },
          { session },
        );
      }
    });

    res.status(200).send({
      ok: true,
      mensaje:
        "Nómina cerrada. Los volantes se enviarán al registrar la autorización bancaria.",
      runId: String(runId),
      createdCount: emailStats.createdCount,
      skippedCount: skippedEmployeesForRun.length,
      terminationLoanPendingPaymentsCount: terminationLoanClaimResult.count,
      terminationLoanPendingPaymentsTotal: terminationLoanClaimResult.total,
    });

    fireAndForget(async () => {
      const run: any = await PayrollRun.findById(runId).lean();

      if (!run) {
        console.error("[closePeriod][bg] PayrollRun not found", String(runId));
        return;
      }

      const paymentsDocs = await PayrollPayment.find({
        payrollRun: runId,
        isDeleted: false,
        isActive: true,
      })
        .select("_id user employeeEmail snapshot")
        .lean();

      try {
        await runWithConcurrency(
          paymentsDocs,
          NOTIF_CONCURRENCY,
          async (p: any) => {
            try {
              await withTimeout(
                notifyUsers({
                  type: "PAYROLL_RUN_CLOSED",
                  severity: "INFO",
                  title: "Cierre de nómina",
                  message: `Tu pago del periodo ${start} a ${end} está disponible.`,
                  entityType: "PayrollPayment",
                  entityId: p._id,
                  recipientUserIds: [String(p.user)],
                  createdBy: actorId,
                  link: `/my/payments?id=${String(p._id)}`,
                }),
                NOTIFY_TIMEOUT_MS,
                `notifyUsers payment=${String(p._id)}`,
              );
            } catch (e) {
              console.error(
                "[closePeriod][bg] notifyUsers failed:",
                String(p?._id),
                e,
              );
            }
          },
        );
      } catch (e) {
        console.error("[closePeriod][bg] notifyUsers global error:", e);
      }
    });

    return;
  } catch (error: any) {
    if (error?.httpStatus && error?.payload) {
      return res.status(error.httpStatus).send(error.payload);
    }

    if (
      error?.code === 11000 &&
      (error?.keyPattern?.payrollFingerprint ||
        String(error?.message || "").includes("payrollFingerprint"))
    ) {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje:
          "Ya existe una nómina cerrada con exactamente los mismos empleados, montos, deducciones e incentivos.",
      });
    }

    console.log("[closePeriod] error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
    });
  } finally {
    await session.endSession();
  }
};

const closePeriodPreview = async (req: any, res: any) => {
  try {
    const {
      userIds = [],
      fechaInicio,
      fechaFin,
      projectId = null,
      companyId = null,
      departmentId = null,
      jobPositionId = null,
      paymentScheduleId = null,
      scopeMode = "EMPLOYEES",
      requestedScopeMode = null,
      wasManuallyAdjusted = false,
      requireConfirmedDays = true,
      payDate,
      frequencyCode,
      excludeUserIds = [],
      additionalUserIds = [],
    } = req.body as any;

    const normalizedScopeMode = String(
      scopeMode || "EMPLOYEES",
    ).toUpperCase() as ConfirmScopeMode;

    if (!validScopeModes.includes(normalizedScopeMode)) {
      return res.status(400).send({
        ok: false,
        mensaje: "scopeMode inválido.",
      });
    }

    const normalizedRequestedScopeMode = requestedScopeMode
      ? (String(requestedScopeMode).toUpperCase() as ConfirmScopeMode)
      : normalizedScopeMode;

    if (!validScopeModes.includes(normalizedRequestedScopeMode)) {
      return res.status(400).send({
        ok: false,
        mensaje: "requestedScopeMode inválido.",
      });
    }

    if (!fechaInicio) {
      return res.status(400).send({
        ok: false,
        mensaje: "Debes enviar fechaInicio.",
      });
    }

    const start = parseISODateToYMD(fechaInicio);
    const end = parseISODateToYMD(fechaFin || fechaInicio);

    const actorIdRaw = req.uid;

    if (!actorIdRaw || !getMongoIdString(actorIdRaw)) {
      return res.status(401).send({
        ok: false,
        mensaje: "No autorizado: falta req.user en el token.",
      });
    }

    const finalPayDate = payDate ? new Date(payDate) : new Date();

    if (payDate && Number.isNaN(finalPayDate.getTime())) {
      return res.status(400).send({
        ok: false,
        mensaje: "payDate inválido.",
      });
    }

    const resolved = await resolvePayrollCloseUserIds({
      scopeMode: normalizedScopeMode,
      userIds,
      companyId,
      departmentId,
      jobPositionId,
      projectId,
      paymentScheduleId,
      excludeUserIds,
      additionalUserIds,
    });

    if (!resolved.ok) {
      return res.status(400).send({
        ok: false,
        mensaje: resolved.mensaje,
      });
    }

    const ids = resolved.userIds || [];

    if (!ids.length) {
      return res.status(200).send({
        ok: true,
        preview: {
          runKey: "",
          payrollFingerprint: "",
          previousScopeRuns: [],
          periodStart: start,
          periodEnd: end,
          payDate: finalPayDate,
          requestedCount: 0,
          eligibleCount: 0,
          skippedCount: 0,
          skippedBreakdown: {
            noUser: 0,
            noEmail: 0,
          },
          totals: {
            grossMonthly: 0,
            grossPeriod: 0,
            totalLegalDeductionsMonthly: 0,
            totalLegalDeductionsPeriod: 0,
            totalOtherDeductionsMonthly: 0,
            totalOtherDeductionsPeriod: 0,
            totalDeductionsMonthly: 0,
            totalDeductionsPeriod: 0,
            isrMonthly: 0,
            isrPeriod: 0,
            netMonthly: 0,
            netPeriod: 0,
          },
        },
        mensaje: "No se encontraron empleados para el alcance seleccionado.",
      });
    }

    const idsSorted = [...ids].sort();

    const companyResp = await resolvePayrollCompanyFromUsers({
      userIds: idsSorted,
      requestedCompanyId: companyId,
    });

    if (!companyResp.ok) {
      return res.status(companyResp.status || 409).send({
        ok: false,
        status: companyResp.status || 409,
        mensaje: companyResp.mensaje,
        employees: (companyResp as any).employees || [],
        companyIds: (companyResp as any).companyIds || [],
      });
    }

    const payrollCompanyId = companyResp.companyId;
    const payrollCompany = companyResp.company;
    const payrollCompanyObjectId = new Types.ObjectId(payrollCompanyId);

    const payrollPolicyResp = await getPayrollPolicyConfig({
      companyId: payrollCompanyId,
    });

    const payrollPolicyConfig: any = payrollPolicyResp.config;
    const terminationLoanPendingSummary =
      await getPendingTerminationLoanPayrollSummary({
        companyId: payrollCompanyId,
      });

    const projectObjId =
      projectId && getMongoIdString(projectId)
        ? new Types.ObjectId(getMongoIdString(projectId) as string)
        : null;

    if (requireConfirmedDays) {
      const unconfirmed = await findUnconfirmedDaysByUsers(
        idsSorted,
        start,
        end,
      );

      if (unconfirmed.length) {
        return res.status(409).send({
          status: 409,
          ok: false,
          mensaje:
            "Hay días no confirmados para pago. No se puede cerrar la nómina con esta opción activa.",
          unconfirmed,
        });
      }
    }

    const runKey = buildPayrollRunKey({
      companyId: payrollCompanyId,
      start,
      end,
      projectId: projectObjId,
      frequencyCode: frequencyCode ? String(frequencyCode) : null,
      userIds: idsSorted,
    });

    const prereq = await validateClosePeriodPrerequisites({
      userIds: idsSorted,
      companyId: payrollCompanyId,
      companyDoc: payrollCompany,
    });

    if (prereq.employeesWrongCompany?.length) {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje:
          "Hay empleados que no pertenecen a la empresa del cierre. No se puede cerrar esta nómina.",
        employees: prereq.employeesWrongCompany,
      });
    }

    if (prereq.notFound?.length) {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje: "Hay empleados que no existen. No se puede cerrar la nómina.",
        notFound: prereq.notFound,
      });
    }

    if (prereq.companyMissing?.length) {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje:
          "Faltan datos requeridos en la empresa. Completa estos campos para cerrar la nómina.",
        missingFields: prereq.companyMissing,
      });
    }

    if (prereq.employeesMissingBank?.length) {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje:
          "Hay empleados sin datos bancarios completos. Completa los campos requeridos para poder cerrar la nómina.",
        employees: prereq.employeesMissingBank,
      });
    }

    const totalsAgg = {
      grossMonthly: 0,
      grossPeriod: 0,
      totalLegalDeductionsMonthly: 0,
      totalLegalDeductionsPeriod: 0,
      totalOtherDeductionsMonthly: 0,
      totalOtherDeductionsPeriod: 0,
      totalDeductionsMonthly: 0,
      totalDeductionsPeriod: 0,
      isrMonthly: 0,
      isrPeriod: 0,
      netMonthly: 0,
      netPeriod: 0,
      companyDisbursementPeriod: 0,
      employeeNetToDepositPeriod: 0,
      employeeLoanDeductionsPeriod: 0,
      thirdPartyPaymentsPeriod: 0,
    };

    const skipped = {
      noUser: 0,
      noEmail: 0,
    };

    let eligibleCount = 0;
    const requestedEmployees = idsSorted.map((userId) => ({
      userId,
      name: "",
      email: "",
      status: "REQUESTED",
      reason: "",
    }));
    const requestedById = new Map(
      requestedEmployees.map((item) => [item.userId, item]),
    );
    const eligibleEmployees: any[] = [];
    const skippedEmployees: any[] = [];

    const paymentFingerprintItems: Array<{
      userId: string;
      snapshot: any;
      bankSnapshot: any;
    }> = [];

    const CONCURRENCY = Number(process.env.PREVIEW_CONCURRENCY || 5);

    await runWithConcurrency(
      idsSorted,
      CONCURRENCY,
      async (empIdStr: string) => {
        const empId = new Types.ObjectId(empIdStr);

        const userDoc: any = await User.findById(empId)
          .select(
            "name email username payrollBank schedule punchTypeId salaryType hourlyRate",
          )
          .populate({ path: "punchTypeId" })
          .populate({ path: "salaryType", select: "code" })
          .lean();

        if (!userDoc) {
          skipped.noUser++;
          skippedEmployees.push({
            userId: empIdStr,
            name: empIdStr,
            email: "",
            status: "SKIPPED",
            reason: "Empleado no encontrado.",
          });
          return;
        }

        const requestedItem = requestedById.get(empIdStr);

        if (requestedItem) {
          requestedItem.name = userDoc.name || "";
          requestedItem.email = userDoc.email || userDoc.username || "";
        }

        const employeeEmail = safeEmail(userDoc);

        if (!employeeEmail) {
          skipped.noEmail++;
          skippedEmployees.push({
            userId: empIdStr,
            name: userDoc.name || empIdStr,
            email: userDoc.email || userDoc.username || "",
            status: "SKIPPED",
            reason: "Empleado sin correo válido.",
          });
          return;
        }

        const missingBank = getEmployeeBankMissingFields(userDoc.payrollBank);

        if (missingBank.length) {
          const err: any = new Error("BANK_MISSING");

          err.httpStatus = 409;
          err.payload = {
            status: 409,
            ok: false,
            mensaje:
              "Se detectó un empleado sin datos bancarios completos mientras se previsualizaba.",
            employees: [
              {
                userId: empIdStr,
                name: userDoc.name,
                missingFields: missingBank,
              },
            ],
          };

          throw err;
        }

        const { snapshot, bankSnapshot } = await getEmployeePaymentSnapshot({
          employeeId: empIdStr,
          fechaInicio: start,
          fechaFin: end,
          payDate: finalPayDate,
          frequencyCode,
          session: null,
          mode: "PREVIEW",
          companyDoc: payrollCompany,
          payrollPolicyConfig,
        });

        try {
          const salaryCode = await resolveSalaryCode(userDoc);

          if (salaryCode === "FIJO") {
            const divisor = getPeriodDivisor(frequencyCode);
            const t: any = snapshot?.totals || {};

            const brutoMensual = toNum(t.sueldoBrutoMensual, 0);
            const rdFactorDiasMes = Number(
              payrollPolicyConfig.rdFactorDiasMes || 23.83,
            );

            const baseDailyForDiscountFixed =
              rdFactorDiasMes > 0 ? brutoMensual / rdFactorDiasMes : 0;

            const { discountPeriod } =
              await computeAttendanceDiscountPeriodUsingDayCalc({
                employee: userDoc,
                employeeId: empId,
                startYMD: start,
                endYMD: end,
                salaryCode,
                baseDailyForDiscountFixed,
                payrollPolicyConfig,
              });

            const netPeriodoBase = toNum(t.sueldoNetoPeriodo, 0);

            t.sueldoBrutoPeriodo = round2(brutoMensual / divisor || 0);

            const legalMensual = toNum(t.totalDeduccionesLegalesMensual, 0);
            const otrasMensual = toNum(t.totalOtrasDeduccionesMensual, 0);
            const totalDedMensual = toNum(t.totalDeduccionesMensual, 0);

            snapshot.otherDeductions = snapshot.otherDeductions || [];

            if (discountPeriod > 0) {
              snapshot.otherDeductions.push({
                nombre: "Descuento por asistencia (tardanzas/ausencias)",
                montoPeriodo: round2(discountPeriod),
              });
            }

            t.totalDeduccionesLegalesPeriodo = round2(
              legalMensual / divisor || 0,
            );

            t.totalOtrasDeduccionesPeriodo = round2(
              otrasMensual / divisor + discountPeriod,
            );

            t.totalDeduccionesPeriodo = round2(
              totalDedMensual / divisor + discountPeriod,
            );

            t.sueldoNetoPeriodo = round2(
              Math.max(0, netPeriodoBase - discountPeriod),
            );

            patchBankSnapshotAmount(bankSnapshot, t.sueldoNetoPeriodo);
          }
        } catch (error) {
          console.error(
            "[closePeriodPreview] attendance discount recompute failed:",
            empIdStr,
            error,
          );
        }

        try {
          await applyEmployeeLoanDeductionsToPayrollSnapshot({
            employeeId: empId,
            snapshot,
            bankSnapshot,
            payDate: finalPayDate,
            mode: "PREVIEW",
            session: null,
          });
        } catch (error) {
          console.error(
            "[closePeriodPreview] employee loan deductions failed:",
            empIdStr,
            error,
          );

          const err: any = new Error("EMPLOYEE_LOAN_DEDUCTION_ERROR");

          err.httpStatus = 409;
          err.payload = {
            status: 409,
            ok: false,
            mensaje:
              "No se pudieron validar las deducciones de préstamos de empleados durante la previsualización.",
            employeeId: empIdStr,
            error: String((error as any)?.message || error),
          };

          throw err;
        }

        eligibleCount++;
        eligibleEmployees.push({
          userId: empIdStr,
          name: userDoc.name || empIdStr,
          email: employeeEmail,
          status: "ELIGIBLE",
          reason: "",
          netPeriod: round2(
            getSnapshotPayrollDistribution(snapshot).companyDisbursement,
          ),
        });

        paymentFingerprintItems.push({
          userId: empIdStr,
          snapshot,
          bankSnapshot,
        });

        const t = snapshot.totals;

        totalsAgg.grossMonthly += toNum(t.sueldoBrutoMensual, 0);
        totalsAgg.grossPeriod += toNum(t.sueldoBrutoPeriodo, 0);

        totalsAgg.totalLegalDeductionsMonthly += toNum(
          t.totalDeduccionesLegalesMensual,
          0,
        );

        totalsAgg.totalLegalDeductionsPeriod += toNum(
          t.totalDeduccionesLegalesPeriodo,
          0,
        );

        totalsAgg.totalOtherDeductionsMonthly += toNum(
          t.totalOtrasDeduccionesMensual,
          0,
        );

        totalsAgg.totalOtherDeductionsPeriod += toNum(
          t.totalOtrasDeduccionesPeriodo,
          0,
        );

        totalsAgg.totalDeductionsMonthly += toNum(t.totalDeduccionesMensual, 0);

        totalsAgg.totalDeductionsPeriod += toNum(t.totalDeduccionesPeriodo, 0);

        totalsAgg.isrMonthly += toNum(snapshot?.isr?.isrMensual, 0);
        totalsAgg.isrPeriod += toNum(snapshot?.isr?.isrPeriodo, 0);

        const distribution = getSnapshotPayrollDistribution(snapshot);

        totalsAgg.netMonthly += toNum(t.sueldoNetoMensual, 0);
        totalsAgg.netPeriod += distribution.companyDisbursement;
        totalsAgg.companyDisbursementPeriod += distribution.companyDisbursement;
        totalsAgg.employeeNetToDepositPeriod +=
          distribution.employeeNetToDeposit;
        totalsAgg.employeeLoanDeductionsPeriod +=
          distribution.employeeLoanDeductions;
        totalsAgg.thirdPartyPaymentsPeriod += distribution.thirdPartyPayments;
      },
    );

    const payrollFingerprint = buildPayrollFingerprint({
      companyId: payrollCompanyId,
      periodStart: start,
      periodEnd: end,
      frequencyCode: frequencyCode ? String(frequencyCode) : null,
      requestedUserIds: idsSorted,
      payments: paymentFingerprintItems,
    });

    const duplicateRun = await PayrollRun.findOne({
      payrollFingerprint,
      isDeleted: false,
      status: "CLOSED",
    })
      .select(
        "_id status payDate employeeCount company payrollFingerprint runKey",
      )
      .lean();

    if (duplicateRun) {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje:
          "Ya existe una nómina cerrada con exactamente los mismos empleados, montos, deducciones e incentivos.",
        runId: String(duplicateRun._id),
        payDate: duplicateRun.payDate,
        employeeCount: duplicateRun.employeeCount,
        payrollFingerprint,
      });
    }

    const previousScopeRuns = await PayrollRun.find({
      company: payrollCompanyObjectId,
      runKey,
      isDeleted: false,
      status: "CLOSED",
    })
      .select("_id payDate employeeCount totals.netPeriod payrollFingerprint")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const requestedCount = idsSorted.length;
    const skippedCount = skipped.noUser + skipped.noEmail;

    return res.status(200).send({
      ok: true,
      preview: {
        runKey,
        payrollFingerprint,
        previousScopeRuns: previousScopeRuns.map((run: any) => ({
          runId: String(run._id),
          payDate: run.payDate,
          employeeCount: run.employeeCount,
          netPeriod: run?.totals?.netPeriod || 0,
        })),
        periodStart: start,
        periodEnd: end,
        payDate: finalPayDate,
        scopeMode: normalizedScopeMode,
        requestedScopeMode: normalizedRequestedScopeMode,
        wasManuallyAdjusted:
          !!wasManuallyAdjusted ||
          normalizedRequestedScopeMode !== normalizedScopeMode,
        requestedCount,
        eligibleCount,
        skippedCount,
        skippedBreakdown: skipped,
        requestedEmployees,
        eligibleEmployees,
        skippedEmployees,
        totals: {
          grossMonthly: round2(totalsAgg.grossMonthly),
          grossPeriod: round2(totalsAgg.grossPeriod),
          totalLegalDeductionsMonthly: round2(
            totalsAgg.totalLegalDeductionsMonthly,
          ),
          totalLegalDeductionsPeriod: round2(
            totalsAgg.totalLegalDeductionsPeriod,
          ),
          totalOtherDeductionsMonthly: round2(
            totalsAgg.totalOtherDeductionsMonthly,
          ),
          totalOtherDeductionsPeriod: round2(
            totalsAgg.totalOtherDeductionsPeriod,
          ),
          totalDeductionsMonthly: round2(totalsAgg.totalDeductionsMonthly),
          totalDeductionsPeriod: round2(totalsAgg.totalDeductionsPeriod),
          isrMonthly: round2(totalsAgg.isrMonthly),
          isrPeriod: round2(totalsAgg.isrPeriod),
          netMonthly: round2(totalsAgg.netMonthly),
          netPeriod: round2(totalsAgg.netPeriod),
          companyDisbursementPeriod: round2(
            totalsAgg.companyDisbursementPeriod,
          ),
          employeeNetToDepositPeriod: round2(
            totalsAgg.employeeNetToDepositPeriod,
          ),
          employeeLoanDeductionsPeriod: round2(
            totalsAgg.employeeLoanDeductionsPeriod,
          ),
          thirdPartyPaymentsPeriod: round2(totalsAgg.thirdPartyPaymentsPeriod),
        },
        company: {
          _id: payrollCompanyId,
          name: payrollCompany?.tradeName || payrollCompany?.legalName || "",
        },
        terminationLoanPendingPayments: terminationLoanPendingSummary,
      },
    });
  } catch (error: any) {
    if (error?.httpStatus && error?.payload) {
      return res.status(error.httpStatus).send(error.payload);
    }

    console.log(error);

    return res.status(500).send({
      ok: false,
      mensaje: "Error generando previsualización del cierre",
      error: String(error?.message || error),
    });
  }
};

const closePeriodPreviewEmployees = async (req: any, res: any) => {
  try {
    const {
      userIds = [],
      fechaInicio,
      fechaFin,
      projectId = null,
      companyId = null,
      departmentId = null,
      jobPositionId = null,
      paymentScheduleId = null,
      scopeMode = "EMPLOYEES",
      payDate,
      frequencyCode,
      status = "ALL",
      text = "",
      page = 1,
      limit = 10,
      omittedEmployees = [],
      excludeUserIds = [],
      additionalUserIds = [],
    } = req.body as any;

    const normalizedScopeMode = String(
      scopeMode || "EMPLOYEES",
    ).toUpperCase() as ConfirmScopeMode;

    if (!validScopeModes.includes(normalizedScopeMode)) {
      return res.status(400).send({
        ok: false,
        mensaje: "scopeMode inválido.",
      });
    }

    if (!fechaInicio) {
      return res.status(400).send({
        ok: false,
        mensaje: "Debes enviar fechaInicio.",
      });
    }

    const start = parseISODateToYMD(fechaInicio);
    const end = parseISODateToYMD(fechaFin || fechaInicio);
    const finalPayDate = payDate ? new Date(payDate) : new Date();

    const resolved = await resolvePayrollCloseUserIds({
      scopeMode: normalizedScopeMode,
      userIds,
      companyId,
      departmentId,
      jobPositionId,
      projectId,
      paymentScheduleId,
      excludeUserIds,
      additionalUserIds,
    });

    if (!resolved.ok) {
      return res.status(400).send({
        ok: false,
        mensaje: resolved.mensaje,
      });
    }

    const ids = (resolved.userIds || []).map(String);
    const pageNum = Math.max(1, Number(page || 1));
    const limitNum = Math.min(50, Math.max(1, Number(limit || 10)));
    const skipNum = (pageNum - 1) * limitNum;
    const cleanStatus = String(status || "ALL").toUpperCase();
    const cleanText = String(text || "").trim();
    const rx = cleanText ? new RegExp(escapeRegex(cleanText), "i") : null;

    const companyResp = await resolvePayrollCompanyFromUsers({
      userIds: ids,
      requestedCompanyId: companyId,
    });

    if (!companyResp.ok) {
      return res.status(companyResp.status || 409).send({
        ok: false,
        status: companyResp.status || 409,
        mensaje: companyResp.mensaje,
      });
    }

    const payrollPolicyResp = await getPayrollPolicyConfig({
      companyId: companyResp.companyId,
    });

    const userQuery: any = {
      _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
      isDeleted: { $ne: true },
    };

    if (rx) {
      userQuery.$or = [{ name: rx }, { email: rx }, { username: rx }];
    }

    const manualRows = (Array.isArray(omittedEmployees) ? omittedEmployees : [])
      .map((employee: any) => ({
        userId: String(employee?.userId || ""),
        name: String(employee?.name || employee?.label || "Empleado"),
        email: String(employee?.email || employee?.username || ""),
        departmentName: String(employee?.departmentName || employee?.department?.name || ""),
        jobPositionName: String(employee?.jobPositionName || employee?.jobPosition?.name || ""),
        projectName: String(employee?.projectName || employee?.project?.name || ""),
        salaryType: String(employee?.salaryType || employee?.tipoSalario || ""),
        workedHoursPeriod: round2(toNum(employee?.workedHoursPeriod, 0)),
        paidHoursPeriod: round2(toNum(employee?.paidHoursPeriod, 0)),
        netPeriod: round2(toNum(employee?.netPeriod || employee?.netoADepositar, 0)),
        status: "SKIPPED",
        reason:
          String(employee?.reason || "").trim() ||
          "Descartado manualmente para esta nómina.",
      }))
      .filter((row: any) => {
        if (!rx) return true;
        return rx.test(
          [
            row.name,
            row.email,
            row.departmentName,
            row.jobPositionName,
            row.projectName,
          ].join(" "),
        );
      });

    const includeUsers = cleanStatus !== "SKIPPED";
    const manualOffsetRows =
      cleanStatus === "ELIGIBLE" || cleanStatus === "REQUESTED"
        ? []
        : manualRows;
    const userSkip = Math.max(0, skipNum - manualOffsetRows.length);
    const userLimit = includeUsers
      ? Math.max(0, limitNum - Math.max(0, manualOffsetRows.length - skipNum))
      : 0;

    const [totalUsers, userDocs] = includeUsers
      ? await Promise.all([
          User.countDocuments(userQuery),
          User.find(userQuery)
            .select(
              "name email username payrollBank schedule punchTypeId salaryType hourlyRate baseSalary department jobPosition project paymentSchedule",
            )
            .populate({ path: "punchTypeId" })
            .populate({ path: "salaryType", select: "code name" })
            .populate({ path: "department", select: "name code" })
            .populate({ path: "jobPosition", select: "name code" })
            .populate({ path: "project", select: "name code" })
            .sort({ name: 1 })
            .skip(userSkip)
            .limit(userLimit)
            .lean(),
        ])
      : [0, []];

    const rows = manualOffsetRows.slice(skipNum, skipNum + limitNum);

    await runWithConcurrency(userDocs as any[], 3, async (userDoc: any) => {
      const employeeEmail = safeEmail(userDoc);

      if (!employeeEmail) {
        if (cleanStatus === "ALL" || cleanStatus === "SKIPPED") {
          rows.push({
            userId: String(userDoc._id),
            name: userDoc.name || String(userDoc._id),
            email: userDoc.email || userDoc.username || "",
            departmentName: userDoc.department?.name || "",
            jobPositionName: userDoc.jobPosition?.name || "",
            projectName: userDoc.project?.name || "",
            salaryType: userDoc.salaryType?.code || "",
            workedHoursPeriod: 0,
            paidHoursPeriod: 0,
            netPeriod: 0,
            status: "SKIPPED",
            reason: "Empleado sin correo válido.",
          });
        }
        return;
      }

      const { snapshot } = await getEmployeePaymentSnapshot({
        employeeId: String(userDoc._id),
        fechaInicio: start,
        fechaFin: end,
        payDate: finalPayDate,
        frequencyCode,
        session: null,
        mode: "PREVIEW",
        companyDoc: companyResp.company,
        payrollPolicyConfig: payrollPolicyResp.config,
      });

      rows.push({
        userId: String(userDoc._id),
        name: userDoc.name || String(userDoc._id),
        email: employeeEmail,
        departmentName:
          snapshot?.employee?.departmentName || userDoc.department?.name || "",
        jobPositionName:
          snapshot?.employee?.jobPositionName || userDoc.jobPosition?.name || "",
        projectName: userDoc.project?.name || "",
        salaryType:
          snapshot?.employee?.tipoSalario ||
          userDoc.salaryType?.code ||
          "",
        workedHoursPeriod: round2(snapshot?.employee?.workedHoursPeriod || 0),
        paidHoursPeriod: round2(snapshot?.employee?.paidHoursPeriod || 0),
        netPeriod: round2(
          getSnapshotPayrollDistribution(snapshot).companyDisbursement,
        ),
        status: "ELIGIBLE",
        reason: "",
      });
    });

    const total =
      cleanStatus === "ELIGIBLE" || cleanStatus === "REQUESTED"
        ? totalUsers
        : manualRows.length + totalUsers;

    return res.status(200).send({
      ok: true,
      rows: rows.slice(0, limitNum),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (error: any) {
    console.error("[closePeriodPreviewEmployees]", error);

    return res.status(error?.httpStatus || 500).send({
      ok: false,
      mensaje: error?.payload?.mensaje || error?.message || "¡Ups! Algo salió mal",
    });
  }
};

const getRunById = async (req: any, res: Response) => {
  try {
    const { runId } = req.params;
    if (!runId || !isValidObjectId(runId)) {
      return res.status(400).send({ ok: false, mensaje: "runId inválido" });
    }

    const run = await PayrollRun.findById(runId)
      .populate("createdBy", "name email username")
      .lean();

    if (!run)
      return res
        .status(404)
        .send({ ok: false, mensaje: "PayrollRun no encontrado" });

    return res.status(200).send({ ok: true, run });
  } catch (error: any) {
    console.log(error);
    return res.status(500).send({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const getPayrollRuns = async (req: any, res: Response) => {
  try {
    const {
      q = "",
      limit = "10",
      initial = "0",

      companyId = "",
      status = "",
      scopeMode = "",

      isActive = "",
      includeDeleted = "false",

      periodStartFrom = "",
      periodStartTo = "",
      periodEndFrom = "",
      periodEndTo = "",

      payDateFrom = "",
      payDateTo = "",

      minNet = "",
      maxNet = "",
      minEmployees = "",
      maxEmployees = "",

      hasBankAuthorization = "",

      sortBy = "createdAt",
      descending = "true",
    } = req.query as any;

    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit)) || 10));
    const initialNum = Math.max(0, parseInt(String(initial)) || 0);

    const filter: any = {};

    /**
     * Por defecto NO mostramos eliminados.
     * Si includeDeleted=true, se muestran todos.
     */
    if (String(includeDeleted) !== "true") {
      filter.isDeleted = false;
    }

    const cleanCompanyId = getMongoIdString(companyId);

    if (cleanCompanyId) {
      filter.company = new Types.ObjectId(cleanCompanyId);
    }

    const cleanStatus = String(status || "")
      .trim()
      .toUpperCase();

    if (cleanStatus && cleanStatus !== "ALL") {
      if (!["CLOSED", "CANCELLED"].includes(cleanStatus)) {
        return res.status(400).send({
          ok: false,
          mensaje: "status inválido.",
        });
      }

      filter.status = cleanStatus;
    }

    const cleanScopeMode = String(scopeMode || "")
      .trim()
      .toUpperCase();

    if (cleanScopeMode && cleanScopeMode !== "ALL") {
      if (!validScopeModes.includes(cleanScopeMode as ConfirmScopeMode)) {
        return res.status(400).send({
          ok: false,
          mensaje: "scopeMode inválido.",
        });
      }

      filter["filters.scopeMode"] = cleanScopeMode;
    }

    const activeValue = String(isActive || "")
      .trim()
      .toUpperCase();

    if (activeValue === "TRUE" || activeValue === "ACTIVE") {
      filter.isActive = true;
    }

    if (activeValue === "FALSE" || activeValue === "INACTIVE") {
      filter.isActive = false;
    }

    if (periodStartFrom || periodStartTo) {
      filter.periodStart = {};

      if (periodStartFrom) {
        filter.periodStart.$gte = String(periodStartFrom).slice(0, 10);
      }

      if (periodStartTo) {
        filter.periodStart.$lte = String(periodStartTo).slice(0, 10);
      }
    }

    if (periodEndFrom || periodEndTo) {
      filter.periodEnd = {};

      if (periodEndFrom) {
        filter.periodEnd.$gte = String(periodEndFrom).slice(0, 10);
      }

      if (periodEndTo) {
        filter.periodEnd.$lte = String(periodEndTo).slice(0, 10);
      }
    }

    if (payDateFrom || payDateTo) {
      filter.payDate = {};

      if (payDateFrom) {
        filter.payDate.$gte = moment(
          String(payDateFrom).slice(0, 10),
          "YYYY-MM-DD",
        )
          .startOf("day")
          .toDate();
      }

      if (payDateTo) {
        filter.payDate.$lte = moment(
          String(payDateTo).slice(0, 10),
          "YYYY-MM-DD",
        )
          .endOf("day")
          .toDate();
      }
    }

    if (minNet || maxNet) {
      filter["totals.netPeriod"] = {};

      if (minNet && !Number.isNaN(Number(minNet))) {
        filter["totals.netPeriod"].$gte = Number(minNet);
      }

      if (maxNet && !Number.isNaN(Number(maxNet))) {
        filter["totals.netPeriod"].$lte = Number(maxNet);
      }
    }

    if (minEmployees || maxEmployees) {
      filter.employeeCount = {};

      if (minEmployees && !Number.isNaN(Number(minEmployees))) {
        filter.employeeCount.$gte = Number(minEmployees);
      }

      if (maxEmployees && !Number.isNaN(Number(maxEmployees))) {
        filter.employeeCount.$lte = Number(maxEmployees);
      }
    }

    const bankAuthValue = String(hasBankAuthorization || "")
      .trim()
      .toUpperCase();

    if (bankAuthValue === "TRUE" || bankAuthValue === "YES") {
      filter.bankAuthorizationNumber = {
        $nin: [null, ""],
      };
    }

    if (bankAuthValue === "FALSE" || bankAuthValue === "NO") {
      filter.$or = filter.$or || [];
      filter.$or.push(
        { bankAuthorizationNumber: { $exists: false } },
        { bankAuthorizationNumber: null },
        { bankAuthorizationNumber: "" },
      );
    }

    const qTrim = String(q || "").trim();

    if (qTrim) {
      const rx = new RegExp(escapeRegex(qTrim), "i");

      const searchOr = [
        { periodStart: rx },
        { periodEnd: rx },
        { status: rx },
        { notes: rx },
        { runKey: rx },
        { payrollFingerprint: rx },
        { bankAuthorizationNumber: rx },
        { "filters.scopeMode": rx },
      ];

      if (filter.$or?.length) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: filter.$or });
        filter.$and.push({ $or: searchOr });
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      payDate: "payDate",
      periodStart: "periodStart",
      periodEnd: "periodEnd",
      employeeCount: "employeeCount",
      netPeriod: "totals.netPeriod",
      grossPeriod: "totals.grossPeriod",
      status: "status",
    };

    const sortField = allowedSortFields[String(sortBy)] || "createdAt";
    const sortValue = String(descending) === "false" ? 1 : -1;

    const [total, runs] = await Promise.all([
      PayrollRun.countDocuments(filter),
      PayrollRun.find(filter)
        .select(
          [
            "company",
            "periodStart",
            "periodEnd",
            "payDate",
            "requireConfirmedDays",
            "status",
            "employeeCount",
            "runKey",
            "payrollFingerprint",
            "totals",
            "notes",
            "policySnapshot",
            "filters",
            "emailStats",
            "skippedEmployees",
            "terminationLoanPendingPayments",
            "terminationLoanPendingPaymentsTotal",
            "terminationLoanPendingPaymentsCount",
            "isActive",
            "isDeleted",
            "createdBy",
            "createdAt",
            "updatedAt",
            "bankAuthorizationNumber",
            "bankDepositedAt",
            "bankDepositedBy",
            "bankResponseFileName",
            "bankResponseFileMimeType",
            "bankResponseFileSize",
            "bankResponseUploadedAt",
            "bankResponseUploadedBy",
            "cancelledAt",
            "cancelledBy",
            "deletedAt",
            "deletedBy",
          ].join(" "),
        )
        .populate({
          path: "company",
          select: "legalName commercialName tradeName name taxId",
        })
        .populate({
          path: "createdBy",
          select: "name email username",
        })
        .populate({
          path: "bankDepositedBy",
          select: "name email username",
        })
        .populate({
          path: "bankResponseUploadedBy",
          select: "name email username",
        })
        .populate({
          path: "cancelledBy",
          select: "name email username",
        })
        .populate({
          path: "deletedBy",
          select: "name email username",
        })
        .sort({ [sortField]: sortValue })
        .skip(initialNum)
        .limit(limitNum)
        .lean(),
    ]);

    const summaryAgg = await PayrollRun.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRuns: { $sum: 1 },
          totalEmployees: { $sum: "$employeeCount" },
          totalGrossPeriod: { $sum: "$totals.grossPeriod" },
          totalNetPeriod: { $sum: "$totals.netPeriod" },
          totalDeductionsPeriod: { $sum: "$totals.totalDeductionsPeriod" },
          activeRuns: {
            $sum: {
              $cond: [{ $eq: ["$isActive", true] }, 1, 0],
            },
          },
          cancelledRuns: {
            $sum: {
              $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const summary = summaryAgg?.[0] || {
      totalRuns: 0,
      totalEmployees: 0,
      totalGrossPeriod: 0,
      totalNetPeriod: 0,
      totalDeductionsPeriod: 0,
      activeRuns: 0,
      cancelledRuns: 0,
    };

    return res.status(200).send({
      ok: true,
      mensaje: "Cierres de nómina obtenidos.",
      message: "Payroll runs fetched.",
      runs,
      total,
      limit: limitNum,
      initial: initialNum,
      summary: {
        totalRuns: Number(summary.totalRuns || 0),
        totalEmployees: Number(summary.totalEmployees || 0),
        totalGrossPeriod: round2(summary.totalGrossPeriod || 0),
        totalNetPeriod: round2(summary.totalNetPeriod || 0),
        totalDeductionsPeriod: round2(summary.totalDeductionsPeriod || 0),
        activeRuns: Number(summary.activeRuns || 0),
        cancelledRuns: Number(summary.cancelledRuns || 0),
      },
    });
  } catch (error) {
    console.error("[getPayrollRuns]", error);

    return res.status(500).send({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const updatePayrollRunAdmin = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    const {
      status,
      isActive,
      notes,
      adminNote,
      bankAuthorizationNumber,
      bankResponseFile,
    } =
      req.body as any;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).send({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    let updatedRun: any = null;
    let loanFinalizeResult: any = null;
    let christmasSalaryAccrualResult: any = null;
    let shouldSendPayslipEmails = false;

    await session.withTransaction(async () => {
      const run: any = await PayrollRun.findOne({
        _id: id,
        isDeleted: { $ne: true },
      }).session(session);

      if (!run) {
        const err: any = new Error("PAYROLL_RUN_NOT_FOUND");

        err.httpStatus = 404;
        err.payload = {
          ok: false,
          mensaje: "Cierre de nómina no encontrado.",
        };

        throw err;
      }

      /**
       * IMPORTANTE:
       * Los PayrollRun viejos fueron creados antes de agregar payrollFingerprint.
       * Como el schema ahora lo exige, cualquier run.save() fallará si no existe.
       *
       * Este valor legacy evita romper actualizaciones administrativas.
       * Los cierres nuevos sí deben traer el fingerprint real desde closePeriod.
       */
      if (!run.payrollFingerprint) {
        run.payrollFingerprint = `LEGACY_${String(run._id)}`;
      }

      const actorName =
        req.user?.name || req.user?.email || req.user?.username || "Usuario";

      const actorId =
        req.user?._id && isValidObjectId(String(req.user._id))
          ? req.user._id
          : null;

      if (status !== undefined) {
        const nextStatus = String(status || "").toUpperCase();

        if (!["CLOSED", "CANCELLED"].includes(nextStatus)) {
          const err: any = new Error("INVALID_PAYROLL_RUN_STATUS");

          err.httpStatus = 400;
          err.payload = {
            ok: false,
            mensaje: "status inválido.",
          };

          throw err;
        }

        const previousStatus = run.status;

        run.status = nextStatus;

        if (nextStatus === "CANCELLED") {
          /**
           * Si ya tiene autorización bancaria, no conviene permitir anular
           * porque las cuotas de préstamos pudieron haber sido finalizadas.
           */
          if (
            run.bankAuthorizationNumber &&
            String(run.bankAuthorizationNumber || "").trim()
          ) {
            const err: any = new Error("PAYROLL_RUN_ALREADY_DEPOSITED");

            err.httpStatus = 409;
            err.payload = {
              ok: false,
              mensaje:
                "No puedes anular un cierre que ya tiene autorización bancaria registrada.",
            };

            throw err;
          }

          run.isActive = false;
          run.cancelledAt = run.cancelledAt || new Date();

          if (actorId) {
            run.cancelledBy = run.cancelledBy || actorId;
          }

          if (previousStatus !== "CANCELLED") {
            run.notes = appendRunNote({
              currentNotes: run.notes,
              note: "Cierre marcado como anulado.",
              actorName,
            });
          }
        }

        if (nextStatus === "CLOSED" && previousStatus === "CANCELLED") {
          run.cancelledAt = null;
          run.cancelledBy = null;

          run.notes = appendRunNote({
            currentNotes: run.notes,
            note: "Cierre restaurado a estado cerrado.",
            actorName,
          });
        }
      }

      if (isActive !== undefined) {
        const nextIsActive = Boolean(isActive);

        if (run.isActive !== nextIsActive) {
          run.notes = appendRunNote({
            currentNotes: run.notes,
            note: nextIsActive
              ? "Cierre marcado como activo."
              : "Cierre marcado como inactivo.",
            actorName,
          });
        }

        run.isActive = nextIsActive;
      }

      if (notes !== undefined) {
        run.notes = String(notes || "").trim();
      }

      if (adminNote !== undefined && String(adminNote || "").trim()) {
        run.notes = appendRunNote({
          currentNotes: run.notes,
          note: adminNote,
          actorName,
        });
      }

      if (bankAuthorizationNumber !== undefined) {
        const previousBankAuthorizationNumber = String(
          run.bankAuthorizationNumber || "",
        ).trim();

        const wasAlreadyDeposited = Boolean(
          previousBankAuthorizationNumber && run.bankDepositedAt,
        );

        const nextBankAuthorizationNumber = String(
          bankAuthorizationNumber || "",
        ).trim();

        /**
         * Si viene vacío y ya estaba depositado, no lo dejamos borrar.
         * Borrar la autorización después de haber marcado cuotas de préstamos
         * como pagadas puede dejar el sistema inconsistente.
         */
        if (!nextBankAuthorizationNumber && wasAlreadyDeposited) {
          const err: any = new Error("BANK_AUTHORIZATION_ALREADY_FINALIZED");

          err.httpStatus = 409;
          err.payload = {
            ok: false,
            mensaje:
              "No puedes borrar la autorización bancaria porque este cierre ya fue marcado como depositado.",
          };

          throw err;
        }

        /**
         * Si viene vacío y todavía no estaba depositado, mantenemos el comportamiento anterior.
         */
        if (!nextBankAuthorizationNumber) {
          run.bankAuthorizationNumber = "";
          run.bankDepositedAt = null;
          run.bankDepositedBy = null;

          run.notes = appendRunNote({
            currentNotes: run.notes,
            note: "Autorización bancaria eliminada.",
            actorName,
          });
        }

        /**
         * Si viene número de autorización, aquí es donde se finaliza el proceso:
         * 1. Se marca el cierre como depositado.
         * 2. Se recorren los PayrollPayment del cierre.
         * 3. Se marcan como PAID las cuotas de préstamos que estaban en el snapshot.
         */
        if (nextBankAuthorizationNumber) {
          const shouldFinalizeLoanDeductions = !wasAlreadyDeposited;
          shouldSendPayslipEmails = shouldSendPayslipEmails || !wasAlreadyDeposited;

          const paidAt = run.bankDepositedAt || new Date();

          if (shouldFinalizeLoanDeductions) {
            loanFinalizeResult =
              await finalizeEmployeeLoanDeductionsAfterBankAuthorization({
                payrollRunId: run._id,
                bankAuthorizationNumber: nextBankAuthorizationNumber,
                actorId,
                paidAt,
                session,
              });
            await markTerminationLoanPendingPaymentsPaidForRun({
              payrollRunId: run._id,
              paidAt,
              session,
            });
          } else {
            loanFinalizeResult = {
              alreadyFinalized: true,
              updatedInstallments: 0,
              closedLoans: 0,
              skippedInstallments: 0,
            };
          }

          run.bankAuthorizationNumber = nextBankAuthorizationNumber;
          run.bankDepositedAt = paidAt;

          if (actorId) {
            run.bankDepositedBy = run.bankDepositedBy || actorId;
          }

          if (shouldFinalizeLoanDeductions) {
            christmasSalaryAccrualResult =
              await accrueChristmasSalaryForFinanciallyConfirmedPayrollRun({
                payrollRun: run,
                actorId,
                effectiveAt: paidAt,
                session,
              });
          }

          if (!previousBankAuthorizationNumber) {
            run.notes = appendRunNote({
              currentNotes: run.notes,
              note: `Autorización bancaria registrada: ${nextBankAuthorizationNumber}.`,
              actorName,
            });
          } else if (
            previousBankAuthorizationNumber !== nextBankAuthorizationNumber
          ) {
            run.notes = appendRunNote({
              currentNotes: run.notes,
              note: `Autorización bancaria actualizada de ${previousBankAuthorizationNumber} a ${nextBankAuthorizationNumber}.`,
              actorName,
            });
          }
        }
      }

      if (bankResponseFile !== undefined && bankResponseFile) {
        const fileName = String(bankResponseFile.fileName || "").trim();
        const contentBase64 = String(bankResponseFile.contentBase64 || "").trim();
        const mimeType = String(bankResponseFile.mimeType || "").trim();
        const size = Number(bankResponseFile.size || 0);

        if (!fileName || !contentBase64) {
          const err: any = new Error("INVALID_BANK_RESPONSE_FILE");

          err.httpStatus = 400;
          err.payload = {
            ok: false,
            mensaje: "Archivo de respuesta bancaria inválido.",
          };

          throw err;
        }

        run.bankResponseFileName = fileName;
        run.bankResponseFileMimeType = mimeType || "text/plain";
        run.bankResponseFileSize = Number.isFinite(size) ? size : 0;
        run.bankResponseFileContentBase64 = contentBase64;
        run.bankResponseUploadedAt = new Date();

        if (actorId) {
          run.bankResponseUploadedBy = actorId;
        }

        run.notes = appendRunNote({
          currentNotes: run.notes,
          note: `Archivo de respuesta bancaria cargado: ${fileName}.`,
          actorName,
        });

        if (run.bankAuthorizationNumber && String(run.bankAuthorizationNumber).trim()) {
          shouldSendPayslipEmails = true;
        }
      }

      await run.save({ session });

      updatedRun = await PayrollRun.findById(run._id)
        .populate({
          path: "company",
          select: "legalName commercialName tradeName name taxId",
        })
        .populate({
          path: "createdBy",
          select: "name email username",
        })
        .populate({
          path: "bankDepositedBy",
          select: "name email username",
        })
        .populate({
          path: "cancelledBy",
          select: "name email username",
        })
        .populate({
          path: "deletedBy",
          select: "name email username",
        })
        .session(session)
        .lean();
    });

    if (shouldSendPayslipEmails) {
      fireAndForget(async () => {
        try {
          await sendPayrollRunPayslipEmails({ payrollRunId: id });
        } catch (e) {
          console.error("[updatePayrollRunAdmin] email dispatch failed:", e);
        }
      });
    }

    return res.status(200).send({
      ok: true,
      mensaje: "Cierre de nómina actualizado correctamente.",
      run: updatedRun,
      loanFinalizeResult,
      christmasSalaryAccrualResult,
      emailDispatchQueued: shouldSendPayslipEmails,
    });
  } catch (error: any) {
    console.error("[updatePayrollRunAdmin]", error);

    if (error?.httpStatus && error?.payload) {
      return res.status(error.httpStatus).send(error.payload);
    }

    if (
      error?.code === 11000 &&
      (error?.keyPattern?.payrollFingerprint ||
        String(error?.message || "").includes("payrollFingerprint"))
    ) {
      return res.status(409).send({
        ok: false,
        mensaje:
          "Ya existe otro cierre con el mismo payrollFingerprint. Revisa los cierres antiguos o ejecuta la migración de fingerprints.",
      });
    }

    return res.status(500).send({
      ok: false,
      mensaje: "Error actualizando el cierre de nómina.",
      error,
    });
  } finally {
    await session.endSession();
  }
};

const softDeletePayrollRun = async (req: any, res: Response) => {
  try {
    let christmasSalaryReversalResult: any = null;
    const { id } = req.params;
    const { note = "" } = req.body as any;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).send({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const run: any = await PayrollRun.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!run) {
      return res.status(404).send({
        ok: false,
        mensaje: "Cierre de nómina no encontrado.",
      });
    }

    /**
     * IMPORTANTE:
     * Los PayrollRun viejos fueron creados antes de agregar payrollFingerprint.
     * Como el schema ahora lo exige, cualquier run.save() fallará si no existe.
     *
     * Este valor legacy evita romper acciones administrativas sobre cierres antiguos.
     * Los cierres nuevos deben seguir generando el fingerprint real desde closePeriod.
     */
    if (!run.payrollFingerprint) {
      run.payrollFingerprint = `LEGACY_${String(run._id)}`;
    }

    const actorName =
      req.user?.name || req.user?.email || req.user?.username || "Usuario";

    const actorId =
      req.user?._id && isValidObjectId(String(req.user._id))
        ? req.user._id
        : null;

    const wasFinanciallyConfirmed = Boolean(
      run.status === "CLOSED" &&
        run.isDeleted !== true &&
        run.isActive !== false &&
        run.bankAuthorizationNumber &&
        String(run.bankAuthorizationNumber || "").trim() &&
        run.bankDepositedAt,
    );

    if (wasFinanciallyConfirmed) {
      christmasSalaryReversalResult =
        await reverseChristmasSalaryAccrualsForPayrollRun({
          payrollRun: run,
          actorId,
          effectiveAt: new Date(),
        });
    }

    run.status = "CANCELLED";
    run.isActive = false;
    run.isDeleted = true;
    run.deletedAt = new Date();
    run.cancelledAt = run.cancelledAt || new Date();

    if (actorId) {
      run.deletedBy = actorId;
      run.cancelledBy = run.cancelledBy || actorId;
    }

    run.notes = appendRunNote({
      currentNotes: run.notes,
      note:
        String(note || "").trim() ||
        "Cierre ocultado/eliminado lógicamente desde historial de nómina.",
      actorName,
    });

    await run.save();

    const updatedRun = await PayrollRun.findById(run._id)
      .populate({
        path: "company",
        select: "legalName commercialName tradeName name taxId",
      })
      .populate({
        path: "createdBy",
        select: "name email username",
      })
      .populate({
        path: "bankDepositedBy",
        select: "name email username",
      })
      .populate({
        path: "cancelledBy",
        select: "name email username",
      })
      .populate({
        path: "deletedBy",
        select: "name email username",
      })
      .lean();

    return res.status(200).send({
      ok: true,
      mensaje: "Cierre de nómina ocultado correctamente.",
      run: updatedRun,
      christmasSalaryReversalResult,
    });
  } catch (error: any) {
    console.error("[softDeletePayrollRun]", error);

    if (
      error?.code === 11000 &&
      (error?.keyPattern?.payrollFingerprint ||
        String(error?.message || "").includes("payrollFingerprint"))
    ) {
      return res.status(409).send({
        ok: false,
        mensaje:
          "Ya existe otro cierre con el mismo payrollFingerprint. Revisa los cierres antiguos o ejecuta la migración de fingerprints.",
      });
    }

    return res.status(500).send({
      ok: false,
      mensaje: "Error ocultando el cierre de nómina.",
      error,
    });
  }
};

const listPaymentsByRun = async (req: any, res: Response) => {
  try {
    const { runId } = req.params;
    const { limit = "20", initial = "0", status } = req.query as any;

    if (!runId || !isValidObjectId(runId)) {
      return res.status(400).send({ ok: false, mensaje: "runId inválido" });
    }

    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit)) || 20));
    const initialNum = Math.max(0, parseInt(String(initial)) || 0);

    const filter: any = {
      payrollRun: new Types.ObjectId(runId),
      isDeleted: false,
    };
    if (
      status &&
      ["PENDING", "EMAILED", "EMAIL_FAILED"].includes(String(status))
    ) {
      filter.emailStatus = String(status);
    }

    const [items, total] = await Promise.all([
      PayrollPayment.find(filter)
        .select(
          "employeeName employeeEmail emailStatus emailedAt snapshot",
        )
        .sort({ employeeName: 1 })
        .skip(initialNum)
        .limit(limitNum)
        .lean(),
      PayrollPayment.countDocuments(filter),
    ]);

    return res.status(200).send({
      ok: true,
      total,
      payments: items.map(normalizePaymentAttendanceForRead),
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).send({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const listMyPayrollPayments = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId || !isValidObjectId(String(userId))) {
      return res.status(401).send({ ok: false, mensaje: "No autenticado" });
    }

    const { limit = "20", initial = "0", status, q } = req.query as any;

    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit)) || 20));
    const initialNum = Math.max(0, parseInt(String(initial)) || 0);

    const filter: any = {
      user: new Types.ObjectId(String(userId)),
      // user: userId,
      isDeleted: false,
    };

    if (
      status &&
      ["PENDING", "EMAILED", "EMAIL_FAILED"].includes(String(status))
    ) {
      filter.emailStatus = String(status);
    }

    // búsqueda opcional por texto (periodo/notas/status/email/name)
    const query = String(q || "").trim();
    if (query) {
      const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { employeeName: rx },
        { employeeEmail: rx },
        { emailStatus: rx },
        { "snapshot.period.start": rx },
        { "snapshot.period.end": rx },
        { "snapshot.period.payDate": rx },
        { notes: rx },
      ];
    }

    const [items, total] = await Promise.all([
      PayrollPayment.find(filter)
        .select(
          "employeeName employeeEmail emailStatus emailedAt snapshot.totals snapshot.period snapshot.attendance payrollRun createdAt",
        )
        .sort({ createdAt: -1 })
        .skip(initialNum)
        .limit(limitNum)
        .lean(),
      PayrollPayment.countDocuments(filter),
    ]);

    return res.status(200).send({
      ok: true,
      total,
      payments: items.map(normalizePaymentAttendanceForRead),
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).send({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const getPaymentById = async (req: any, res: Response) => {
  try {
    const { paymentId } = req.params;
    if (!paymentId || !isValidObjectId(paymentId)) {
      return res.status(400).send({ ok: false, mensaje: "paymentId inválido" });
    }

    const payment = await PayrollPayment.findById(paymentId)
      .populate("user", "name email username")
      .populate(
        "payrollRun",
        "periodStart periodEnd payDate requireConfirmedDays",
      )
      .lean();

    if (!payment)
      return res
        .status(404)
        .send({ ok: false, mensaje: "PayrollPayment no encontrado" });

    normalizePaymentAttendanceForRead(payment);

    return res.status(200).send({ ok: true, payment });
  } catch (error: any) {
    console.log(error);
    return res.status(500).send({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const resendFailedEmails = async (req: any, res: Response) => {
  try {
    const { runId } = req.params;
    if (!runId || !isValidObjectId(runId)) {
      return res.status(400).send({ ok: false, mensaje: "runId inválido" });
    }

    const run: any = await PayrollRun.findById(runId).lean();
    if (!run)
      return res
        .status(404)
        .send({ ok: false, mensaje: "PayrollRun no encontrado" });

    const failed = await PayrollPayment.find({
      payrollRun: new Types.ObjectId(runId),
      isDeleted: false,
      emailStatus: "EMAIL_FAILED",
    }).lean();

    if (!failed.length) {
      return res.status(200).send({
        ok: true,
        mensaje: "No hay emails fallidos para reenviar.",
        resent: 0,
      });
    }

    let okCount = 0;
    let failCount = 0;

    for (const p of failed as any[]) {
      const sent = await sendEmail({
        to: p.employeeEmail,
        subject: `Volante de pago (${run.periodStart} a ${run.periodEnd})`,
        html: buildEmployeePayslipHTML(p),
      });

      if (sent) {
        okCount++;
        await PayrollPayment.findByIdAndUpdate(p._id, {
          emailStatus: "EMAILED",
          emailedAt: new Date(),
          emailError: "",
        });
      } else {
        failCount++;
      }
    }

    // refrescar stats
    const okTotal = await PayrollPayment.countDocuments({
      payrollRun: runId,
      isDeleted: false,
      emailStatus: "EMAILED",
    });
    const failTotal = await PayrollPayment.countDocuments({
      payrollRun: runId,
      isDeleted: false,
      emailStatus: "EMAIL_FAILED",
    });

    await PayrollRun.findByIdAndUpdate(runId, {
      emailStats: {
        ...(run.emailStats || {}),
        employeesEmailOk: okTotal,
        employeesEmailFail: failTotal,
      },
    });

    return res.status(200).send({
      ok: true,
      mensaje: "Reintento de emails completado.",
      resentOk: okCount,
      resentFail: failCount,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).send({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const suggestedPeriodBySchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.query;

    if (!scheduleId) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "scheduleId es requerido" });
    }

    const schedule = await PaymentSchedule.findOne({
      _id: scheduleId,
      isActive: true,
    })
      .select("_id code name payDays weeklyDays")
      .lean();

    if (!schedule) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "PaymentSchedule no encontrado" });
    }

    const suggested = getSuggestedPeriodFromSchedule({
      payDays: schedule.payDays,
      weeklyDays: schedule.weeklyDays || [],
    });

    return res.status(200).json({
      ok: true,
      schedule,
      suggested,
      mensaje: "Rango sugerido generado",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

const generateBankFileByRun = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { runId, profileId, tipoServicio } = req.body as any;

    if (!runId || !isValidObjectId(runId)) {
      return res.status(400).send({ ok: false, mensaje: "runId inválido." });
    }

    if (profileId && !isValidObjectId(profileId)) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "profileId inválido." });
    }

    // 1) Buscar run
    const run: any = await PayrollRun.findById(runId).lean();
    if (!run || run.isDeleted) {
      return res
        .status(404)
        .send({ ok: false, mensaje: "PayrollRun no existe." });
    }

    if (run.status !== "CLOSED") {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje: "El run debe estar CLOSED para generar archivo.",
      });
    }

    // 2) Perfil banco
    const profile: any = profileId
      ? await CompanyProfile.findOne({
          _id: profileId,
          isDeleted: false,
        }).lean()
      : await CompanyProfile.findOne({
          code: "DEFAULT",
          isDeleted: false,
        }).lean();

    if (!profile) {
      return res.status(404).send({
        ok: false,
        mensaje:
          "No existe CompanyProfile activo (default o disponible) para generar archivo.",
      });
    }

    if (!profile) {
      return res.status(404).send({
        ok: false,
        mensaje: "No existe BankFileProfile activo para este sistema.",
      });
    }

    // 3) Determinar secuencia header (7) y actualizar contador diario
    // Se hace en txn para evitar colisiones si dos admins generan al mismo tiempo
    const nowYYYYMMDD = require("moment")().format("YYYYMMDD");
    let headerSeqNum = 1;
    let payDateFormatted = moment(run?.payDate)
      .locale("es")
      .format("D [de] MMM YYYY");

    await session.withTransaction(async () => {
      // 🔒 Releer el perfil dentro de la txn para evitar colisiones
      const prof: any = await CompanyProfile.findById(profile._id).session(
        session,
      );

      // Si los campos no existen, quedarán undefined y caerá en defaults.
      const lastDate = String((prof as any)?.lastSequenceDate || "");
      const lastNum = Number((prof as any)?.lastSequenceNumber || 0);

      // ✅ Si hoy ya se generó, incrementa; si no, reinicia en 1
      headerSeqNum = lastDate === nowYYYYMMDD ? lastNum + 1 : 1;

      // ✅ Guardar contador diario (requiere agregar estos campos al schema)
      (prof as any).lastSequenceDate = nowYYYYMMDD;
      (prof as any).lastSequenceNumber = headerSeqNum;

      await prof.save({ session });
    });

    const headerSequence7 = String(headerSeqNum).padStart(7, "0");

    // 4) Payments
    const payments = await PayrollPayment.find({
      payrollRun: run._id,
      isDeleted: false,
      isActive: true,
    })
      .select("_id user employeeName snapshot bankSnapshot")
      .lean();

    if (!payments.length) {
      return res.status(409).send({
        status: 409,
        ok: false,
        mensaje: "No hay PayrollPayment activos para este run.",
      });
    }

    const terminationLoanPendingPayments =
      await TerminationLoanPayrollPendingPayment.find({
        payrollRun: run._id,
        status: { $in: ["CLAIMED", "PAID"] },
        isDeleted: false,
      })
        .sort({ createdAt: 1 })
        .lean();

    const bankFilePayments = [
      ...expandPayrollPaymentsForBankFile(payments),
      ...terminationLoanPendingPayments.map(buildTerminationLoanBankFilePayment),
    ];

    // 5) Construir archivo
    const companyAssignedNumber5 = String(profile.agreementCode || "").trim();
    const companyRNC15 = String(profile.taxId || "")
      .trim()
      .replace(/\D/g, "");
    const companyName35 = String(
      profile.legalName || profile.tradeName || "",
    ).trim();
    const resultsEmail40 = String(profile.email || "").trim();
    // const companyAccountToUse1 = String(
    //   profile.originAccountType || " ",
    // ).trim();
    const defaultCurrency3 = String(profile.currency || "214").trim();

    const tipoServicio2 = String(tipoServicio || profile.serviceCode || "01")
      .trim()
      .slice(0, 2)
      .padStart(2, "0") as any;

    const effectiveDateYYYYMMDD = require("moment")(run.payDate).format(
      "YYYYMMDD",
    );

    const result = await buildPayrollBankFile({
      companyAssignedNumber5: companyAssignedNumber5 || "",

      header: {
        companyRNC: companyRNC15 || "",
        companyName: companyName35 || "",
        headerSequence7,
        tipoServicio2,
        effectiveDateYYYYMMDD,
        resultsEmail40: resultsEmail40 || "",
        // companyAccountToUse1: companyAccountToUse1 || " ",
        companyAccountToUse1: " ",

        // (15) Solo TS=03 (lo dejamos blank como pediste)
        numeroAfiliacion15: "",

        // Los pone el builder:
        sendDateYYYYMMDD: "",
        sendTimeHHMM: "",
      },
      payments: bankFilePayments,
      includeZeroNet: false, // recomendado: no depositar net=0

      bankResolver: (p) => {
        // 1) Si ya guardaste bankSnapshot al cerrar, úsalo
        const b = p.bankSnapshot || {};

        // Devuelve BLANCO si falta (como pediste)
        return {
          accountNumber20: b.accountNumber || "",
          accountType1: b.accountType || "",
          currency3: b.currency || profile.defaultCurrency || "",
          bankCode8: b.bankCode || "",
          bankDigit1: b.bankDigit || "",
          operationCode2: b.operationCode || "",

          idType2: b.idType || "",
          idNumber15: b.idNumber || "",
          beneficiaryName35: b.beneficiaryName || p.employeeName || "",

          reference12: b.referenceNumber || "",
          description40:
            b.statementDescription ||
            (p.thirdPartyPayment
              ? String(p.thirdPartyPayment.description || "PAGO PRESTAMO")
              : `Nómina BlueTech ${payDateFormatted}`),
          dueDate4: b.dueDate4 || "",

          contactMethod1: b.contactMethod || "",
          emailBenef40: b.emailBenef || "",
          faxOrPhone12: b.faxOrPhoneBenef || "",
          acquirerId2: b.acquirerId || "00",
        };
      },
    });

    // 6) Guardar en DB ligado al run
    const bankFileDoc = await PayrollBankFile.create([
      {
        payrollRun: run._id,
        profile: profile._id,
        tipoServicio: tipoServicio2,
        headerSequence: headerSequence7,
        currency: defaultCurrency3 || "214",

        fileName: result.fileName,
        content: result.content,
        sha256: result.sha256,
        totals: {
          countCR: result.totals.countCR,
          totalCR: result.totals.totalCR,
          countDB: result.totals.countDB,
          totalDB: result.totals.totalDB,
        },
        generatedAt: new Date(),
        status: "GENERATED",
        warnings: result.warnings,
        isActive: true,
        isDeleted: false,
      },
    ]);

    return res.status(200).send({
      ok: true,
      mensaje: "Archivo del banco generado y guardado.",
      bankFileId: String(bankFileDoc[0]._id),
      fileName: result.fileName,
      sha256: result.sha256,
      totals: result.totals,
      warnings: result.warnings,
      // Si quieres devolver el contenido para descargar en frontend:
      content: result.content,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal generando el archivo del banco.",
      error: String(error?.message || error),
    });
  } finally {
    await session.endSession();
  }
};

const setRunBankAuthorization = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { bankAuthorizationNumber } = req.body as any;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ ok: false, mensaje: "ID inválido" });
    }

    const val = String(bankAuthorizationNumber || "").trim();
    if (!val) {
      return res.status(400).send({
        ok: false,
        mensaje: "Debe enviar bankAuthorizationNumber",
      });
    }

    const run = await PayrollRun.findOne({ _id: id, isDeleted: false });
    if (!run) {
      return res.status(404).send({ ok: false, mensaje: "Run no encontrado" });
    }

    run.bankAuthorizationNumber = val;
    if (!run.bankDepositedAt) run.bankDepositedAt = new Date();
    if (!run.bankDepositedBy && req.user?._id)
      run.bankDepositedBy = req.user._id;

    await run.save();

    const christmasSalaryAccrualResult =
      await accrueChristmasSalaryForFinanciallyConfirmedPayrollRun({
        payrollRun: run,
        actorId: req.user?._id || null,
        effectiveAt: run.bankDepositedAt || new Date(),
      });

    await markTerminationLoanPendingPaymentsPaidForRun({
      payrollRunId: id,
      paidAt: run.bankDepositedAt || new Date(),
    });

    fireAndForget(async () => {
      try {
        await sendPayrollRunPayslipEmails({ payrollRunId: id });
      } catch (e) {
        console.error("[setRunBankAuthorization] email dispatch failed:", e);
      }
    });

    return res.status(200).send({
      ok: true,
      mensaje: "Autorización bancaria guardada",
      run,
      christmasSalaryAccrualResult,
    });
  } catch (error) {
    console.error("setRunBankAuthorization error:", error);
    return res.status(500).send({
      ok: false,
      mensaje: "Error guardando autorización bancaria",
    });
  }
};

const getPayrollRunPaymentsOverview = async (req: any, res: Response) => {
  try {
    const { runId } = req.params;
    const { groupBy = "department", text = "" } = req.query as any;

    if (!runId || !isValidObjectId(runId)) {
      return res.status(400).send({
        ok: false,
        mensaje: "runId inválido.",
      });
    }

    const validGroupBy = [
      "department",
      "jobPosition",
      "emailStatus",
      "salaryType",
      "bank",
    ];

    if (!validGroupBy.includes(String(groupBy))) {
      return res.status(400).send({
        ok: false,
        mensaje: "groupBy inválido.",
      });
    }

    const run = await PayrollRun.findById(runId)
      .select(
        "periodStart periodEnd payDate employeeCount totals emailStats bankAuthorizationNumber bankDepositedAt status isActive",
      )
      .lean();

    if (!run) {
      return res.status(404).send({
        ok: false,
        mensaje: "Cierre de nómina no encontrado.",
      });
    }

    const match: any = {
      payrollRun: new Types.ObjectId(runId),
      isDeleted: { $ne: true },
      isActive: { $ne: false },
    };

    const cleanText = String(text || "").trim();

    if (cleanText) {
      const rx = new RegExp(
        cleanText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      match.$or = [
        { employeeName: rx },
        { employeeEmail: rx },
        { "snapshot.employee.departmentName": rx },
        { "snapshot.employee.jobPositionName": rx },
        { "snapshot.employee.tipoSalario": rx },
        { "bankSnapshot.bankCode": rx },
      ];
    }

    const groupExpressionMap: Record<string, any> = {
      department: {
        $ifNull: ["$snapshot.employee.departmentName", "Sin departamento"],
      },
      jobPosition: {
        $ifNull: ["$snapshot.employee.jobPositionName", "Sin puesto"],
      },
      salaryType: {
        $ifNull: ["$snapshot.employee.tipoSalario", "Sin tipo"],
      },
      bank: {
        $ifNull: ["$bankSnapshot.bankCode", "Sin banco"],
      },
      emailStatus: {
        $switch: {
          branches: [
            {
              case: {
                $or: [
                  { $eq: ["$emailStatus", "EMAILED"] },
                  { $ne: ["$emailedAt", null] },
                ],
              },
              then: "Enviado",
            },
            {
              case: {
                $or: [
                  { $eq: ["$emailStatus", "EMAIL_FAILED"] },
                  { $ne: ["$emailError", ""] },
                ],
              },
              then: "Fallido",
            },
          ],
          default: "Pendiente",
        },
      },
    };

    const [summaryAgg, groups] = await Promise.all([
      PayrollPayment.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            bruto: { $sum: "$snapshot.totals.sueldoBrutoPeriodo" },
            deducciones: {
              $sum: "$snapshot.totals.totalDeduccionesPeriodo",
            },
            neto: { $sum: "$snapshot.totals.sueldoNetoPeriodo" },
            sent: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$emailStatus", "EMAILED"] },
                      { $ne: ["$emailedAt", null] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            failed: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$emailStatus", "EMAIL_FAILED"] },
                      {
                        $and: [
                          { $ne: ["$emailError", null] },
                          { $ne: ["$emailError", ""] },
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      PayrollPayment.aggregate([
        { $match: match },
        {
          $group: {
            _id: groupExpressionMap[String(groupBy)],
            count: { $sum: 1 },
            bruto: { $sum: "$snapshot.totals.sueldoBrutoPeriodo" },
            deducciones: {
              $sum: "$snapshot.totals.totalDeduccionesPeriodo",
            },
            neto: { $sum: "$snapshot.totals.sueldoNetoPeriodo" },
          },
        },
        {
          $project: {
            _id: 0,
            key: { $toString: "$_id" },
            label: { $toString: "$_id" },
            count: 1,
            bruto: { $round: ["$bruto", 2] },
            deducciones: { $round: ["$deducciones", 2] },
            neto: { $round: ["$neto", 2] },
          },
        },
        { $sort: { label: 1 } },
      ]),
    ]);

    const summaryRaw = summaryAgg?.[0] || {
      count: 0,
      bruto: 0,
      deducciones: 0,
      neto: 0,
      sent: 0,
      failed: 0,
    };

    const sent = Number(summaryRaw.sent || 0);
    const failed = Number(summaryRaw.failed || 0);
    const count = Number(summaryRaw.count || 0);

    return res.status(200).send({
      ok: true,
      run,
      groupBy,
      summary: {
        count,
        bruto: round2(summaryRaw.bruto || 0),
        deducciones: round2(summaryRaw.deducciones || 0),
        neto: round2(summaryRaw.neto || 0),
        email: {
          sent,
          failed,
          pending: Math.max(0, count - sent - failed),
        },
      },
      groups,
    });
  } catch (error) {
    console.error("[getPayrollRunPaymentsOverview]", error);

    return res.status(500).send({
      ok: false,
      mensaje: "Error obteniendo resumen de pagos del cierre.",
      error,
    });
  }
};

const getPayrollRunPaymentsPage = async (req: any, res: Response) => {
  try {
    const { runId } = req.params;

    const {
      groupBy = "",
      groupValue = "",
      text = "",
      emailStatus = "ALL",
      salaryType = "ALL",
      limit = "20",
      initial = "0",
      sortBy = "employeeName",
      descending = "false",
    } = req.query as any;

    if (!runId || !isValidObjectId(runId)) {
      return res.status(400).send({
        ok: false,
        mensaje: "runId inválido.",
      });
    }

    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit)) || 20));
    const initialNum = Math.max(0, parseInt(String(initial)) || 0);

    const query: any = {
      payrollRun: new Types.ObjectId(runId),
      isDeleted: { $ne: true },
      isActive: { $ne: false },
    };

    const cleanGroupBy = String(groupBy || "").trim();
    const cleanGroupValue = String(groupValue || "").trim();

    if (cleanGroupBy && cleanGroupValue) {
      if (cleanGroupBy === "department") {
        query["snapshot.employee.departmentName"] = cleanGroupValue;
      }

      if (cleanGroupBy === "jobPosition") {
        query["snapshot.employee.jobPositionName"] = cleanGroupValue;
      }

      if (cleanGroupBy === "salaryType") {
        query["snapshot.employee.tipoSalario"] = cleanGroupValue;
      }

      if (cleanGroupBy === "bank") {
        query["bankSnapshot.bankCode"] = cleanGroupValue;
      }

      if (cleanGroupBy === "emailStatus") {
        if (cleanGroupValue === "Enviado") {
          query.$or = [
            { emailStatus: "EMAILED" },
            { emailedAt: { $ne: null } },
          ];
        }

        if (cleanGroupValue === "Fallido") {
          query.$or = [
            { emailStatus: "EMAIL_FAILED" },
            { emailError: { $nin: [null, ""] } },
          ];
        }

        if (cleanGroupValue === "Pendiente") {
          query.$and = query.$and || [];
          query.$and.push(
            { emailStatus: { $nin: ["EMAILED", "EMAIL_FAILED"] } },
            { emailedAt: { $in: [null, undefined] } },
            { emailError: { $in: [null, ""] } },
          );
        }
      }
    }

    const cleanEmailStatus = String(emailStatus || "ALL").toUpperCase();

    if (cleanEmailStatus !== "ALL") {
      query.$and = query.$and || [];

      if (cleanEmailStatus === "SENT") {
        query.$and.push({
          $or: [{ emailStatus: "EMAILED" }, { emailedAt: { $ne: null } }],
        });
      }

      if (cleanEmailStatus === "FAILED") {
        query.$and.push({
          $or: [
            { emailStatus: "EMAIL_FAILED" },
            { emailError: { $nin: [null, ""] } },
          ],
        });
      }

      if (cleanEmailStatus === "PENDING") {
        query.$and.push(
          { emailStatus: { $nin: ["EMAILED", "EMAIL_FAILED"] } },
          { emailedAt: { $in: [null, undefined] } },
          { emailError: { $in: [null, ""] } },
        );
      }
    }

    const cleanSalaryType = String(salaryType || "ALL").toUpperCase();

    if (cleanSalaryType !== "ALL") {
      if (cleanSalaryType === "OTHER") {
        query["snapshot.employee.tipoSalario"] = {
          $nin: ["FIJO", "HORAS"],
        };
      } else {
        query["snapshot.employee.tipoSalario"] = cleanSalaryType;
      }
    }

    const cleanText = String(text || "").trim();

    if (cleanText) {
      const rx = new RegExp(
        cleanText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { employeeName: rx },
          { employeeEmail: rx },
          { "snapshot.employee.departmentName": rx },
          { "snapshot.employee.jobPositionName": rx },
          { "snapshot.employee.tipoSalario": rx },
          { "bankSnapshot.bankCode": rx },
        ],
      });
    }

    const allowedSort: Record<string, string> = {
      employeeName: "employeeName",
      employeeEmail: "employeeEmail",
      netPeriod: "snapshot.totals.sueldoNetoPeriodo",
      grossPeriod: "snapshot.totals.sueldoBrutoPeriodo",
      deductionsPeriod: "snapshot.totals.totalDeduccionesPeriodo",
      emailStatus: "emailStatus",
    };

    const sortField = allowedSort[String(sortBy)] || "employeeName";
    const sortValue = String(descending) === "true" ? -1 : 1;

    const [total, payments] = await Promise.all([
      PayrollPayment.countDocuments(query),
      PayrollPayment.find(query)
        .select(
          [
            "_id",
            "user",
            "employeeName",
            "employeeEmail",
            "emailStatus",
            "emailedAt",
            "emailError",
            "bankSnapshot",
            "snapshot.employee",
            "snapshot.period",
            "snapshot.totals",
            "snapshot.attendance",
          ].join(" "),
        )
        .sort({ [sortField]: sortValue })
        .skip(initialNum)
        .limit(limitNum)
        .lean(),
    ]);

    return res.status(200).send({
      ok: true,
      total,
      limit: limitNum,
      initial: initialNum,
      payments: payments.map(normalizePaymentAttendanceForRead),
    });
  } catch (error) {
    console.error("[getPayrollRunPaymentsPage]", error);

    return res.status(500).send({
      ok: false,
      mensaje: "Error obteniendo pagos del cierre.",
      error,
    });
  }
};

export {
  closePeriod,
  getRunById,
  getPayrollRuns,
  updatePayrollRunAdmin,
  softDeletePayrollRun,
  listPaymentsByRun,
  getPaymentById,
  resendFailedEmails,
  suggestedPeriodBySchedule,
  listMyPayrollPayments,
  generateBankFileByRun,
  closePeriodPreview,
  closePeriodPreviewEmployees,
  setRunBankAuthorization,
  getPayrollRunPaymentsOverview,
  getPayrollRunPaymentsPage,
};
