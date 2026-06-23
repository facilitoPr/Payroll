import mongoose, { Types } from "mongoose";
import WorkSummary from "../../model/punch/workSummary";
import PunchHistory from "../../model/punch/puncHistory";
import { calcExpectedMinutesForDate } from "../../helper/payroll/payroll.calculate";
import { round2, toNum } from "../../helper/parse";
import {
  parseISODateToYMD,
} from "../../helper/payroll/payroll.parse";
import moment from "moment";
import User from "../../model/account/user";
import { safeEmail } from "../../helper/employee/employee.safe";
import { calcularNetoMensualEmpleado } from "../../helper/payroll/calculate-salary";
import { calcularPagoPorPeriodo } from "../workSummary.service";
import PayrollEarningEntry from "../../model/employee-payment-management/payrollEarningEntry";
import { calcGrossPayHourlyDay, getPeriodDivisor } from "../../helper/payroll/payroll.get";
import { getMongoIdString } from "../../helper/objectIds";
import Company from "../../model/company";
import { buildDateQuery } from "../../helper/date";
import { calcAttendanceDeductionsForDay } from "../../helper/payroll/calculate-deductions";
import { getCompanyAddressString, getCompanyPhoneString } from "../../helper/payroll/validate-bank-fields";
import { applyPayrollPolicyToDayCalc, DEFAULT_PAYROLL_POLICY_CONFIG, getPayrollPolicyConfig, getPolicyGraceMinutes } from "../../helper/payroll/payrollPolicy";
import { ensurePayrollAttendanceSnapshotCompatibility } from "../../helper/payroll/payroll.attendanceCompatibility";

export const computeHourlyGrossPeriodUsingDayCalc = async (args: {
  employee: any;
  employeeId: Types.ObjectId | string;
  startYMD: string;
  endYMD: string;
  payrollPolicyConfig?: any;
  session?: any | null;
}) => {
  const {
    employee,
    employeeId,
    startYMD,
    endYMD,
    payrollPolicyConfig,
    session,
  } = args;

  const dateQuery = buildDateQuery(startYMD, endYMD);

  let wsQuery = WorkSummary.find({
    user:
      employeeId instanceof Types.ObjectId
        ? employeeId
        : new Types.ObjectId(String(employeeId)),
    dateString: dateQuery,
    isDeleted: false,
  })
    .select(
      [
        "_id",
        "dateString",
        "totalMinutes",
        "expectedMinutes",
        "approvedMinutes",
        "lateTime",
        "discountOverride",
        "payImpact",
        "classification",
      ].join(" "),
    )
    .sort({ dateString: 1 })
    .lean();

  if (session) wsQuery = wsQuery.session(session);

  const wsList: any[] = await wsQuery;

  if (!wsList.length) {
    return {
      grossPeriod: 0,
      workedMinutes: 0,
      approvedMinutes: 0,
      paidMinutes: 0,
      days: [],
    };
  }

  const wsIds = wsList.map((w) => w._id);

  let pQuery = PunchHistory.find({
    workSummary: { $in: wsIds },
    punchStep: "entrada",
    isDeleted: false,
  })
    .select("workSummary punchStep expectedTime timestamp date lateTime isLate")
    .lean();

  if (session) pQuery = pQuery.session(session);

  const entryPunches: any[] = await pQuery;
  const earliestEntryByWS = new Map<string, any>();

  for (const p of entryPunches) {
    const wsKey = String(p.workSummary);
    const prev = earliestEntryByWS.get(wsKey);

    if (!prev) {
      earliestEntryByWS.set(wsKey, p);
      continue;
    }

    const tPrev = prev?.timestamp
      ? new Date(prev.timestamp).getTime()
      : Infinity;
    const tNow = p?.timestamp ? new Date(p.timestamp).getTime() : Infinity;

    if (tNow < tPrev) earliestEntryByWS.set(wsKey, p);
  }

  const policyConfig = {
    ...DEFAULT_PAYROLL_POLICY_CONFIG,
    ...(payrollPolicyConfig || {}),
  };

  const graceMinutes =
    policyConfig.lateGraceEnabled === true
      ? Math.max(toNum(policyConfig.lateGraceMinutes, 0), 0)
      : 0;

  const expectedCache = new Map<
    string,
    { expectedMinutes: number; isActive: boolean }
  >();

  const getExpectedFromSchedule = (dateString: string) => {
    const key = String(dateString).slice(0, 10);
    const cached = expectedCache.get(key);
    if (cached) return cached;

    const exp = calcExpectedMinutesForDate(
      employee?.schedule,
      employee?.punchTypeId,
      key,
    );

    const out = {
      expectedMinutes: toNum(exp?.expectedMinutes, 0),
      isActive: !!exp?.isActive,
    };

    expectedCache.set(key, out);
    return out;
  };

  let grossPeriod = 0;
  let workedMinutes = 0;
  let approvedMinutes = 0;
  let paidMinutes = 0;
  const days: any[] = [];

  for (const ws of wsList) {
    const expectedFromSchedule = getExpectedFromSchedule(ws.dateString);
    if (!expectedFromSchedule?.isActive) continue;

    const day = calcAttendanceDeductionsForDay({
      ws,
      employee,
      entryPunch: earliestEntryByWS.get(String(ws._id)) || null,
      expectedFromSchedule,
      salaryCode: "HORAS",
      graceMinutes,
      baseDailyForDiscountFixed: 0,
      hourlyRate: toNum(employee?.hourlyRate, 0),
      calcExpectedMinutesForDate,
      calcGrossPayHourlyDay,
    });

    if (day?.skip) continue;

    grossPeriod += toNum(day.grossPayDay, 0);
    workedMinutes += toNum(day.workedMinutes, 0);
    approvedMinutes += toNum(day.approvedMinutes, 0);
    paidMinutes += toNum(day.paidMinutesHourly, 0);

    days.push({
      dateString: ws.dateString,
      workedMinutes: toNum(day.workedMinutes, 0),
      approvedMinutes: toNum(day.approvedMinutes, 0),
      paidMinutes: toNum(day.paidMinutesHourly, 0),
      grossPayDay: round2(toNum(day.grossPayDay, 0)),
    });
  }

  return {
    grossPeriod: round2(grossPeriod),
    workedMinutes: round2(workedMinutes),
    approvedMinutes: round2(approvedMinutes),
    paidMinutes: round2(paidMinutes),
    days,
  };
};

export const getEmployeePaymentSnapshot = async ({
  employeeId,
  fechaInicio,
  fechaFin,
  payDate,
  frequencyCode,
  session,
  mode = "CLOSE",
  companyDoc = null,
  runId = null,
  payrollPolicyConfig = null,
}: {
  employeeId: string;
  fechaInicio: string;
  fechaFin: string;
  payDate: Date;
  frequencyCode: string;
  session?: mongoose.ClientSession | null;
  mode?: "CLOSE" | "PREVIEW";
  companyDoc?: any;
  runId?: string | Types.ObjectId | null;
  payrollPolicyConfig?: any;
}) => {
  // =========================
  // 1) EMPLEADO (con populate)
  // =========================
  const empleado: any = await User.findById(employeeId)
    .populate("company")
    .populate("salaryType")
    .populate("department")
    .populate("jobPosition")
    .populate("punchTypeId")
    .populate({
      path: "paymentSchedule",
      populate: { path: "paymentFrequency" },
    })
    .session(session || null);

  if (!empleado) throw new Error("Empleado no encontrado");

  // =========================
  // 2) DATOS EMPRESA
  // =========================
  let company: any = companyDoc || null;

  if (!company) {
    const populatedCompany = (empleado as any).company;

    if (populatedCompany && typeof populatedCompany === "object") {
      company = populatedCompany;
    }
  }

  if (!company) {
    const companyId = getMongoIdString((empleado as any).company);

    if (!companyId) {
      throw new Error("El empleado no tiene empresa asignada");
    }

    company = await Company.findOne({
      _id: new Types.ObjectId(companyId),
      isDeleted: { $ne: true },
    })
      .session(session || null)
      .lean();
  }

  if (!company) {
    throw new Error("Datos de la empresa no encontrados");
  }

  // =========================
  // 2.1) PAYROLL POLICY
  // =========================
  let resolvedPayrollPolicyConfig = payrollPolicyConfig || null;

  if (!resolvedPayrollPolicyConfig) {
    const policyResp = await getPayrollPolicyConfig({
      companyId: getMongoIdString(company?._id),
      session: session || null,
    });

    resolvedPayrollPolicyConfig = policyResp?.config || {};
  }

  const policyConfig = {
    ...DEFAULT_PAYROLL_POLICY_CONFIG,
    ...(resolvedPayrollPolicyConfig || {}),
  };

  // =========================
  // 3) SUELDO + DEDUCCIONES + ISR
  // =========================
  const payCalc = await calcularNetoMensualEmpleado(employeeId, {
    session: session ?? undefined,
    employeeDoc: empleado,
  });

  const tipoSalario = String(payCalc.tipoSalario || "").toUpperCase();

  const paymentFrequency = (empleado.paymentSchedule as any)?.paymentFrequency;

  const frecuenciaPago = String(
    payCalc.frecuenciaPago || paymentFrequency?.name || "mensual",
  ).toLowerCase();

  const sueldoBrutoMensual = round2(toNum(payCalc.sueldoBrutoMensual, 0));
  let sueldoBrutoPeriodoBase = round2(toNum(payCalc.sueldoBrutoPeriodo, 0));
  const horasEstimadas = round2(toNum(payCalc.horasEstimadas, 0));

  let hourlyPeriodCalc: any = null;

  if (tipoSalario === "HORAS") {
    hourlyPeriodCalc = await computeHourlyGrossPeriodUsingDayCalc({
      employee: empleado,
      employeeId: empleado._id,
      startYMD: fechaInicio,
      endYMD: fechaFin,
      payrollPolicyConfig: policyConfig,
      session,
    });

    sueldoBrutoPeriodoBase = round2(toNum(hourlyPeriodCalc?.grossPeriod, 0));
  }

  let detalleDeducciones: any[] = (payCalc.deducciones || []).map((it: any) => {
    const montoMensual = round2(toNum(it.amount, 0));
    const montoPeriodo = round2(
      calcularPagoPorPeriodo(frecuenciaPago, montoMensual),
    );

    let tipo = "montoFijo";
    let valor = 0;
    let modo = "";

    switch (it.source) {
      case "CUSTOM_AMOUNT":
        tipo = "montoFijo";
        valor = toNum(it.fixedAmountApplied ?? montoMensual, 0);
        modo = "personalizado";
        break;

      case "CUSTOM_PERCENTAGE":
        tipo = "porcentaje";
        valor = toNum(it.percentageApplied ?? 0, 0);
        modo = "personalizado";
        break;

      case "TYPE_PERCENTAGE":
        tipo = "porcentaje";
        valor = toNum(it.percentageApplied ?? 0, 0);
        modo = "por tipo";
        break;

      case "TYPE_FIXED_AMOUNT":
        tipo = "montoFijo";
        valor = toNum(it.fixedAmountApplied ?? montoMensual, 0);
        modo = "por tipo";
        break;

      case "AUTO_ISR":
        tipo = "porcentaje";
        valor = 0;
        modo = "automático";
        break;

      default:
        tipo = "montoFijo";
        valor = 0;
        modo = "";
        break;
    }

    return {
      code: it.code || "",
      nombre: it.name || "Deducción",
      tipo,
      valor,
      modo,
      isLegal: !!it.isLegal,
      montoMensual,
      montoPeriodo,
    };
  });

  let totalDeduccionesMensual = round2(
    detalleDeducciones.reduce((acc, x) => acc + toNum(x.montoMensual, 0), 0),
  );

  let totalDeduccionesPeriodo = round2(
    detalleDeducciones.reduce((acc, x) => acc + toNum(x.montoPeriodo, 0), 0),
  );

  let totalDeduccionesLegalesMensual = round2(
    detalleDeducciones
      .filter((x) => x.isLegal)
      .reduce((acc, x) => acc + toNum(x.montoMensual, 0), 0),
  );

  let totalDeduccionesLegalesPeriodo = round2(
    detalleDeducciones
      .filter((x) => x.isLegal)
      .reduce((acc, x) => acc + toNum(x.montoPeriodo, 0), 0),
  );

  const baseISR = round2(toNum(payCalc.baseISR, 0));
  const isrMensual = round2(toNum(payCalc.isr?.amount, 0));
  const isrPeriodo = round2(calcularPagoPorPeriodo(frecuenciaPago, isrMensual));

  const legalDeductions = detalleDeducciones.filter((x) => x.isLegal);
  const otherDeductions = detalleDeducciones.filter((x) => !x.isLegal);

  // =========================
  // 4) INGRESOS (BASE + OTROS)
  // =========================
  const earningsBase = [
    {
      code: "BASE_SALARY",
      nombre: "Salario base",
      montoMensual: round2(sueldoBrutoMensual),
      montoPeriodo: round2(sueldoBrutoPeriodoBase),
      notes: "",
    },
  ];

  const earningEntries = await PayrollEarningEntry.find({
    user: empleado._id,
    periodStart: fechaInicio,
    periodEnd: fechaFin,
    isActive: true,
    isDeleted: false,
    isClaimed: false,
  })
    .populate({ path: "earningType", select: "code name" })
    .session(session || null)
    .lean();

  const otherEarnings = (earningEntries as any[]).map((e) => {
    const code = e?.earningType?.code || "EARNING";
    const name = e?.earningType?.name || "Ingreso";
    const amountPeriodo = round2(toNum(e.amountPeriod ?? e.amount, 0));
    const amountMensual = round2(0);

    return {
      id: String(e._id),
      code,
      nombre: name,
      montoPeriodo: amountPeriodo,
      montoMensual: amountMensual,
      notes: e.notes || "",
    };
  });

  /**
   * Importante:
   * En PREVIEW no se marca como usado.
   * En CLOSE sí se marca dentro de la transacción.
   */
  if (mode === "CLOSE" && earningEntries.length) {
    await PayrollEarningEntry.updateMany(
      {
        _id: {
          $in: earningEntries.map((entry: any) => entry._id),
        },
        isActive: true,
        isDeleted: false,
        isClaimed: false,
      },
      {
        $set: {
          isClaimed: true,
          claimedAt: new Date(),
          claimedInPayrollRun: runId || null,
        },
      },
      { session },
    );
  }

  const totalOtherEarningsPeriodo = round2(
    otherEarnings.reduce((acc, x) => acc + toNum(x.montoPeriodo, 0), 0),
  );

  const totalOtherEarningsMensual = round2(
    otherEarnings.reduce((acc, x) => acc + toNum(x.montoMensual, 0), 0),
  );

  const grossMensual = round2(sueldoBrutoMensual + totalOtherEarningsMensual);
  const grossPeriodo = round2(
    sueldoBrutoPeriodoBase + totalOtherEarningsPeriodo,
  );

  const earnings = [...earningsBase, ...otherEarnings];

  /**
   * Neto final base del snapshot.
   * Aquí ya se incluyen incentivos/otros ingresos del período.
   * Luego closePeriod/preview pueden restar descuentos de asistencia encima.
   */
  let sueldoNetoMensual = round2(
    Math.max(0, grossMensual - totalDeduccionesMensual),
  );

  let sueldoNetoPeriodo = round2(
    Math.max(0, grossPeriodo - totalDeduccionesPeriodo),
  );

  // =========================
  // 5) SNAPSHOT FINAL
  // =========================
  const snapshot = {
    company: {
      companyId: String(company._id),
      name: company.legalName || company.tradeName || company.name || "",
      commercialName:
        company.tradeName || company.commercialName || company.name || "",
      address: getCompanyAddressString(company),
      taxId: company.taxId || company.rnc || "",
      phone: getCompanyPhoneString(company),
      email: company.email || "",
    },

    policy: {
      lateGraceEnabled: !!policyConfig.lateGraceEnabled,
      lateGraceMinutes: Number(policyConfig.lateGraceMinutes || 0),
      lateGraceMode: policyConfig.lateGraceMode || "FULL_GRACE",

      deductLateArrivals: policyConfig.deductLateArrivals !== false,
      deductAbsences: policyConfig.deductAbsences !== false,

      rdFactorDiasMes: Number(policyConfig.rdFactorDiasMes || 23.83),
      useGrossSalaryForDailyDiscount:
        policyConfig.useGrossSalaryForDailyDiscount !== false,

      requireConfirmedDaysDefault:
        policyConfig.requireConfirmedDaysDefault !== false,

      allowIncompleteDaysOnClose: !!policyConfig.allowIncompleteDaysOnClose,
      autoPaidLeaveNoDeduct: policyConfig.autoPaidLeaveNoDeduct !== false,
    },

    employee: {
      userId: String(empleado._id),
      name: String(empleado.name || "Empleado"),
      email: safeEmail(empleado),
      departmentName: (empleado.department as any)?.name || "",
      jobPositionName: (empleado.jobPosition as any)?.name || "",
      tipoSalario,
      baseSalary: Number(empleado.baseSalary || 0),
      hourlyRate: Number(empleado.hourlyRate || 0),
      horasEstimadas,
      workedHoursPeriod: round2(toNum(hourlyPeriodCalc?.workedMinutes, 0) / 60),
      paidHoursPeriod: round2(toNum(hourlyPeriodCalc?.paidMinutes, 0) / 60),
      
    },

    period: {
      start: fechaInicio,
      end: fechaFin,
      payDate: payDate.toISOString(),
      frecuenciaPago,
      diasPago:
        (empleado.paymentSchedule as any)?.payDays ??
        ((empleado.paymentSchedule as any)?.weeklyDays || []),
    },

    earnings,
    legalDeductions,
    otherDeductions,
    detalleDeducciones,
    attendance: undefined as any,

    isr: {
      baseISR: round2(baseISR),
      isrMensual: round2(isrMensual),
      isrPeriodo: round2(isrPeriodo),
      bracket: payCalc.isr?.bracket,
      tableMeta: payCalc.isr?.tableMeta || null,
    },

    totals: {
      sueldoBrutoMensual: round2(sueldoBrutoMensual),
      sueldoBrutoPeriodo: round2(sueldoBrutoPeriodoBase),

      totalEarningsMensual: round2(grossMensual),
      totalEarningsPeriodo: round2(grossPeriodo),

      totalDeduccionesLegalesMensual: round2(totalDeduccionesLegalesMensual),
      totalDeduccionesLegalesPeriodo: round2(totalDeduccionesLegalesPeriodo),

      totalOtrasDeduccionesMensual: round2(
        totalDeduccionesMensual - totalDeduccionesLegalesMensual,
      ),
      totalOtrasDeduccionesPeriodo: round2(
        totalDeduccionesPeriodo - totalDeduccionesLegalesPeriodo,
      ),

      totalDeduccionesMensual: round2(totalDeduccionesMensual),
      totalDeduccionesPeriodo: round2(totalDeduccionesPeriodo),

      sueldoNetoMensual: round2(sueldoNetoMensual),
      sueldoNetoPeriodo: round2(sueldoNetoPeriodo),
    },
  };

  ensurePayrollAttendanceSnapshotCompatibility(snapshot, {
    calculationMode: "FULL_PERIOD",
    attendanceCutoffDate: fechaFin,
    source: mode === "PREVIEW" ? "PAYROLL_PREVIEW" : "PAYROLL_CLOSE",
    generatedAt: new Date(),
  });

  // =========================
  // 6) BANK SNAPSHOT
  // =========================
  const pb = (empleado as any)?.payrollBank || {};

  const bankSnapshot = {
    accountNumber: pb.accountNumber,
    accountType: pb.accountType || "1",
    currency: pb.currency || "240",
    bankCode: pb.bankCode || "10101070",
    bankDigit: pb.bankDigit || "8",
    idType: pb.idType || "CE",
    idNumber: pb.idNumber || "",
    operationCode: pb.operationCode || "22",
    referenceNumber: pb.referenceNumber || "",
    statementDescription: pb.statementDescription || "NOMINA AUTOMATICA",
    contactMethod: pb.contactMethod,
    emailBenef: pb.emailBenef,
    acquirerId: pb.acquirerId,
    dueDate4: pb.dueDate4,

    amount: round2(sueldoNetoPeriodo),
    amountPeriod: round2(sueldoNetoPeriodo),
    netAmount: round2(sueldoNetoPeriodo),
  };

  return {
    empleado,
    snapshot,
    bankSnapshot,
  };
};

export const findUnconfirmedDaysByUsers = async (
  userIds: string[],
  fechaInicio: string,
  fechaFin: string,
) => {
  const start = parseISODateToYMD(fechaInicio);
  const end = parseISODateToYMD(fechaFin);

  const ws = await WorkSummary.find({
    user: { $in: userIds.map((x) => new Types.ObjectId(x)) },
    dateString: { $gte: start, $lte: end },
    $or: [{ confirmedToPay: { $exists: false } }, { confirmedToPay: false }],
  })
    .select(
      "user dateString confirmedToPay classification isIncomplete missingSteps",
    )
    .populate({
      path: "user",
      select: "name email username department jobPosition project company",
      populate: [
        { path: "department", select: "name code" },
        { path: "jobPosition", select: "name code" },
        { path: "project", select: "name code" },
        { path: "company", select: "legalName commercialName name code" },
      ],
    })
    .lean();

  if (!ws.length) return [];

  // map user -> dates
  const byUser: Record<string, any> = {};
  for (const w of ws as any[]) {
    const user = w.user || {};
    const uid = String(user?._id || w.user);
    byUser[uid] = byUser[uid] || {
      userId: uid,
      name: user?.name || "",
      email: user?.email || user?.username || "",
      department: user?.department
        ? {
            _id: String(user.department?._id || ""),
            name: user.department?.name || "",
            code: user.department?.code || "",
          }
        : null,
      jobPosition: user?.jobPosition
        ? {
            _id: String(user.jobPosition?._id || ""),
            name: user.jobPosition?.name || "",
            code: user.jobPosition?.code || "",
          }
        : null,
      project: user?.project
        ? {
            _id: String(user.project?._id || ""),
            name: user.project?.name || "",
            code: user.project?.code || "",
          }
        : null,
      company: user?.company
        ? {
            _id: String(user.company?._id || ""),
            name:
              user.company?.legalName ||
              user.company?.commercialName ||
              user.company?.name ||
              "",
            code: user.company?.code || "",
          }
        : null,
      dates: [] as any[],
    };
    byUser[uid].dates.push({
      dateString: w.dateString,
      classification: w.classification || "",
      isIncomplete: !!w.isIncomplete,
      missingSteps: w.missingSteps || [],
    });
  }

  return Object.values(byUser);
};

export const computeAttendanceDiscountPeriodUsingDayCalc = async (args: {
  employee: any; // User lean con schedule, punchTypeId populated, salaryType, hourlyRate
  employeeId: Types.ObjectId;
  startYMD: string;
  endYMD: string;
  salaryCode: "FIJO" | "HORAS" | string;
  baseDailyForDiscountFixed: number; // brutoMensual/30
  payrollPolicyConfig?: any;
  session?: any | null;
}) => {
  const {
    employee,
    employeeId,
    startYMD,
    endYMD,
    salaryCode,
    baseDailyForDiscountFixed,
    payrollPolicyConfig,
    session,
  } = args;

  const policyConfig = {
    ...DEFAULT_PAYROLL_POLICY_CONFIG,
    ...(payrollPolicyConfig || {}),
  };

  const graceMinutes = getPolicyGraceMinutes(policyConfig);

  const dateQuery = buildDateQuery(startYMD, endYMD);

  // 1) WS del período
  let wsQuery = WorkSummary.find({
    user: employeeId,
    dateString: dateQuery,
    isDeleted: false,
  })
    .select(
      [
        "_id",
        "date",
        "dateString",
        "totalMinutes",
        "expectedMinutes",
        "approvedMinutes",
        "notWorkedMinutes",
        "lateTime",
        "discountOverride",
        "payImpact",
        "classification",
        "confirmedToPay",
        "isIncomplete",
        "missingSteps",
        "autoClosedReason",
        "overrideReason",
        "approvedReason",
      ].join(" "),
    )
    .sort({ date: 1 })
    .lean();

  if (session) wsQuery = wsQuery.session(session);

  const wsList: any[] = await wsQuery;
  if (!wsList.length) return { discountPeriod: 0 };

  // 2) Ponches de entrada (traer todos y escoger el más temprano por WS)
  const wsIds = wsList.map((w) => w._id);

  let pQuery = PunchHistory.find({
    workSummary: { $in: wsIds },
    punchStep: "entrada",
    isDeleted: false,
  })
    .select("workSummary punchStep expectedTime timestamp date lateTime isLate")
    .lean();

  if (session) pQuery = pQuery.session(session);

  const entryPunches: any[] = await pQuery;

  const earliestEntryByWS = new Map<string, any>();
  for (const p of entryPunches) {
    const wsKey = String(p.workSummary);
    const prev = earliestEntryByWS.get(wsKey);

    if (!prev) {
      earliestEntryByWS.set(wsKey, p);
      continue;
    }

    const tPrev = prev?.timestamp
      ? new Date(prev.timestamp).getTime()
      : Infinity;
    const tNow = p?.timestamp ? new Date(p.timestamp).getTime() : Infinity;

    if (tNow < tPrev) earliestEntryByWS.set(wsKey, p);
  }

  // 3) expectedFromSchedule cache (para no recalcular por cada ws)
  const expectedCache = new Map<
    string,
    { expectedMinutes: number; isActive: boolean }
  >();

  const getExpectedFromSchedule = (dateString: string) => {
    const key = String(dateString).slice(0, 10);
    const cached = expectedCache.get(key);
    if (cached) return cached;

    const exp = calcExpectedMinutesForDate(
      employee?.schedule,
      employee?.punchTypeId,
      key,
    );

    const out = {
      expectedMinutes: toNum(exp?.expectedMinutes, 0),
      isActive: !!exp?.isActive,
    };

    expectedCache.set(key, out);
    return out;
  };

  // 4) Sumar descuento por día usando calcAttendanceDeductionsForDay
  let discountPeriod = 0;

  for (const ws of wsList) {
    const wsKey = String(ws._id);
    const entryPunch = earliestEntryByWS.get(wsKey) || null;

    const expectedFromSchedule = getExpectedFromSchedule(ws.dateString);

    const day = calcAttendanceDeductionsForDay({
      ws,
      employee,
      entryPunch,
      expectedFromSchedule,

      salaryCode: String(salaryCode).toUpperCase() as any,
      graceMinutes,

      baseDailyForDiscountFixed,

      hourlyRate: toNum(employee?.hourlyRate, 0),

      calcExpectedMinutesForDate,
      calcGrossPayHourlyDay,
    });

    if (day?.skip) continue;

    const policyDay = applyPayrollPolicyToDayCalc({
      dayCalc: day,
      ws,
      salaryCode: String(salaryCode).toUpperCase(),
      baseDailyForDiscountFixed,
      payrollPolicyConfig: policyConfig,
    });

    discountPeriod += toNum(policyDay?.descuentoTotal, 0);
  }

  return { discountPeriod: round2(discountPeriod) };
};
