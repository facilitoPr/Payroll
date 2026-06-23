import { Request, Response } from "express";
import PunchType, { IPunchType } from "../../model/punch/punchTypes";
import moment from "moment";
import User, { IUser } from "../../model/account/user";
import PunchHistory, { IPunchHistory } from "../../model/punch/puncHistory";
import {
  buildExpectedPunchesFromSchedule,
  calcularResumenDiario,
  normalizeDiaSemanaFromDate,
  recalcWorkSummaryDay,
} from "../../services/workSummary.service";
import WorkSummary, { dayTypeOptions } from "../../model/punch/workSummary";
import Roles from "../../model/role";
import mongoose, { isValidObjectId, Types } from "mongoose";
import { sendEmail } from "../../helper/sendEmail";
import { calcularNetoMensualEmpleado } from "../../helper/payroll/calculate-salary";
import { buildDateQuery } from "../../helper/date";
import WorkSummaryDocumentation from "../../model/punch/WorkSummaryDocumentation";
import { calcAttendanceDeductionsForDay } from "../../helper/payroll/calculate-deductions";
import { getClientIp } from "../../helper/token/client-ip";
import { getMongoIdString, toObjectId, uniqueValidObjectIds } from "../../helper/objectIds";
import { DATE_STRING_REGEX } from "../../constants/regex";
import { round2, toNum } from "../../helper/parse";
import {
  STEP_ORDER,
  PUNCH_STEPS,
  punchStep,
} from "../../constants/payroll";
import { AuthRequest } from "../../middlewares/validate-jwt";
import { formatDateYMD, getYMD } from "../../helper/hours";
import { getPeriodDivisor, getScheduleDayKeyFromYMD, calcGrossPayHourlyDay } from '../../helper/payroll/payroll.get';
import { calcExpectedMinutesForDate, calcLateInfo } from "../../helper/payroll/payroll.calculate";
import { getSalaryTypeCodeMap } from "../../services/payroll/salaryType.service";
import { buildEarliestEntryByWS, buildEmployeeQueryFromScope, buildEmptyPayrollResponse, ConfirmScopeMode, validScopeModes } from "../../helper/payroll/payroll.build";
import { normalizeDateKey, normalizeExpectedTime } from "../../helper/payroll/payroll.parse";
import { findEmployeeIdsByFilters } from "../../services/employees.service";
import { getPaymentScheduleOrFail } from "../../services/payroll/paymentSchedule.service";
import { applyPayrollPolicyToDayCalc, DEFAULT_PAYROLL_POLICY_CONFIG, getPayrollPolicyConfig, getPolicyGraceMinutes, resolvePunchPayrollPolicyConfig } from "../../helper/payroll/payrollPolicy";
import { getEmployeeLoanDeductionsForPayroll } from "../../helper/payroll/payrolls.employeeLoanDeduction";
moment.locale("es");

const getPunchesToPayroll = async (req: any, res: Response) => {
  try {
    const {
      fechaInicio,
      fechaFin,
      companyId,
      departmentId,
      jobPositionId,
      projectId,
      userId,
      userIds,
      onlySpecialDay,
      paymentSchedule,
      payDate,
      page = 1,
      limit = 10,
    } = req.body as any;

    const pageNum = Math.max(Number(page || 1), 1);
    const limitNum = Math.min(Math.max(Number(limit || 10), 1), 50);
    const skip = (pageNum - 1) * limitNum;

    if (!paymentSchedule) {
      return res.status(400).send({
        ok: false,
        mensaje:
          "Debe enviar paymentSchedule (PaymentScheduleId) para filtrar la corrida.",
      });
    }

    const psResp = await getPaymentScheduleOrFail(paymentSchedule);

    if (!psResp.ok) {
      return res
        .status(psResp.status)
        .send({ ok: false, mensaje: psResp.mensaje });
    }

    const frequencyCode = psResp.frequencyCode;
    const periodDivisor = getPeriodDivisor(frequencyCode);
    const paymentScheduleName = (psResp as any).paymentSchedule?.name;
    const loanPayDate = payDate ? new Date(payDate) : new Date();

    if (Number.isNaN(loanPayDate.getTime())) {
      return res.status(400).send({
        ok: false,
        mensaje: "payDate inválido.",
      });
    }

    /**
     * Seguridad:
     * - RRHH / ADMIN / SUPER_ADMIN ven todos.
     * - Manager ve su departamento.
     * - Otro usuario no ve nada en este reporte.
     */
    const roleCode = String(
      req.user?.rol?.code || req.user?.role?.code || "",
    ).toUpperCase();

    const departmentCode = String(
      req.user?.department?.code || "",
    ).toUpperCase();

    const isAdminOrRrhh =
      departmentCode === "RRHH" ||
      roleCode === "ADMIN" ||
      roleCode === "SUPERADMIN" ||
      roleCode === "SUPER_ADMIN";

    const userDepartmentId =
      req.user?.department?._id || req.user?.department || null;

    const isManager = Boolean(req.user?.isManager);

    if (!isAdminOrRrhh && !isManager) {
      return res.status(200).send(
        buildEmptyPayrollResponse({
          frequencyCode,
          periodDivisor,
          paymentSchedule,
          paymentScheduleName,
          page: pageNum,
          limit: limitNum,
        }),
      );
    }

    const effectiveDepartmentId =
      !isAdminOrRrhh && isManager ? userDepartmentId : departmentId;

    const empResp = await findEmployeeIdsByFilters({
      companyId,
      departmentId: effectiveDepartmentId,
      jobPositionId,
      projectId,
      userId,
      userIds,
      paymentScheduleId: paymentSchedule,
      managerId: !isAdminOrRrhh && isManager ? req.user._id : null,
    });

    if (!empResp.ok) {
      return res
        .status(empResp?.status || 500)
        .send({ ok: false, mensaje: empResp.mensaje });
    }

    const employeeIds = empResp.employeeIds;

    if (!employeeIds?.length) {
      return res.status(200).send(
        buildEmptyPayrollResponse({
          frequencyCode,
          periodDivisor,
          paymentSchedule,
          paymentScheduleName,
          page: pageNum,
          limit: limitNum,
        }),
      );
    }

    const dateQuery = buildDateQuery(fechaInicio, fechaFin);

    const wsQuery: any = {
      user: { $in: employeeIds },
      dateString: dateQuery,
      isDeleted: false,
    };

    if (onlySpecialDay) {
      const excludeValue = "Trabajo regular";
      wsQuery.$and = wsQuery.$and || [];
      wsQuery.$and.push(
        { classification: { $exists: true } },
        { classification: { $nin: [excludeValue, null] } },
      );
    }

    const workSummaries = await WorkSummary.find(wsQuery)
      .select(
        [
          "user",
          "date",
          "dateString",
          "totalMinutes",
          "expectedMinutes",
          "approvedMinutes",
          "notWorkedMinutes",
          "lateTime",
          "payImpact",
          "discountOverride",
          "overrideReason",
          "approvedReason",
          "classification",
          "confirmedToPay",
          "isIncomplete",
          "missingSteps",
          "autoClosedReason",
          "isPaid",
        ].join(" "),
      )
      .sort({ date: 1 })
      .lean();

    if (!workSummaries.length) {
      return res.status(200).send(
        buildEmptyPayrollResponse({
          frequencyCode,
          periodDivisor,
          paymentSchedule,
          paymentScheduleName,
          page: pageNum,
          limit: limitNum,
        }),
      );
    }

    const involvedUserIds = Array.from(
      new Set(workSummaries.map((w: any) => String(w.user))),
    );

    const usersDocs = await User.find({ _id: { $in: involvedUserIds } })
      .select(
        "_id name img image email username schedule punchTypeId salaryType hourlyRate weeklyWorkHours isActived isDeleted company department jobPosition project",
      )
      .populate("punchTypeId")
      .populate("company", "_id name")
      .populate("department", "_id name code")
      .populate("jobPosition", "_id name code")
      .populate("project", "_id name code")
      .lean();

    const usersById = new Map<string, any>();

    for (const u of usersDocs as any[]) {
      if (u && !u.isDeleted && u.isActived !== false) {
        usersById.set(String(u._id), u);
      }
    }

    const activeUsers = Array.from(usersById.values());

    const companyIdsFromUsers = Array.from(
      new Set(
        activeUsers
          .map((u: any) => getMongoIdString(u.company))
          .filter(Boolean) as string[],
      ),
    );

    const requestedCompanyId = getMongoIdString(companyId);

    const policyCompanyId =
      requestedCompanyId ||
      (companyIdsFromUsers.length === 1 ? companyIdsFromUsers[0] : null);

    if (!policyCompanyId && companyIdsFromUsers.length > 1) {
      return res.status(400).send({
        ok: false,
        mensaje:
          "El reporte contiene empleados de empresas diferentes. Selecciona una empresa para aplicar correctamente la política de nómina.",
        companyIds: companyIdsFromUsers,
      });
    }

    const payrollPolicyResp = await getPayrollPolicyConfig({
      companyId: policyCompanyId,
    });

    const payrollPolicy = payrollPolicyResp.policy;

    const payrollPolicyConfig = {
      ...DEFAULT_PAYROLL_POLICY_CONFIG,
      ...(payrollPolicyResp.config || {}),
    };

    const rdFactorDiasMes = Math.max(
      toNum(payrollPolicyConfig.rdFactorDiasMes, 23.83),
      1,
    );

    const policyGraceMinutes =
      payrollPolicyConfig.lateGraceEnabled === true
        ? Math.max(toNum(payrollPolicyConfig.lateGraceMinutes, 0), 0)
        : 0;

    const salaryTypeCodeById = await getSalaryTypeCodeMap(usersDocs);

    const netoMensualByEmp = new Map<string, number>();
    const brutoMensualByEmp = new Map<string, number>();

    const payrollCalcErrors: any[] = [];

    await Promise.all(
      Array.from(usersById.keys()).map(async (empId) => {
        try {
          const info = await calcularNetoMensualEmpleado(empId);
          netoMensualByEmp.set(empId, toNum(info?.sueldoNetoMensual, 0));
          brutoMensualByEmp.set(empId, toNum(info?.sueldoBrutoMensual, 0));
        } catch (error: any) {
          const u = usersById.get(empId);
          payrollCalcErrors.push({
            userId: empId,
            name: u?.name || "",
            salaryType: u?.salaryType || null,
            mensaje: error?.message || "No se pudo calcular el salario.",
          });
        }
      }),
    );

    if (payrollCalcErrors.length) {
      return res.status(409).send({
        ok: false,
        mensaje:
          "No se pudo calcular la nómina para uno o más empleados del rango seleccionado.",
        employees: payrollCalcErrors,
      });
    }

    const wsIds = workSummaries.map((w: any) => w._id);

    const punches: IPunchHistory[] = await PunchHistory.find({
      workSummary: { $in: wsIds },
      isDeleted: false,
    })
      .select(
        "workSummary punchStep expectedTime timestamp isLate date lateTime",
      )
      .lean();

    const punchStepsByWS = new Map<string, any[]>();

    for (const p of punches as any[]) {
      const key = String(p.workSummary);
      const arr = punchStepsByWS.get(key) || [];
      arr.push(p);
      punchStepsByWS.set(key, arr);
    }

    const earliestEntryByWS = buildEarliestEntryByWS(punches);

    const expectedCache = new Map<
      string,
      { expectedMinutes: number; isActive: boolean }
    >();

    const getExpectedFor = (u: any, dateString: string) => {
      const key = `${String(u._id)}|${dateString}`;
      const cached = expectedCache.get(key);
      if (cached) return cached;

      const exp = calcExpectedMinutesForDate(
        u.schedule,
        u.punchTypeId,
        dateString,
      );

      const out = {
        expectedMinutes: toNum(exp?.expectedMinutes, 0),
        isActive: !!exp?.isActive,
      };

      expectedCache.set(key, out);
      return out;
    };

    const dias: any[] = [];
    const employeesMap = new Map<string, any>();

    let totalLateMinutes = 0;
    let totalDiscountTardanza = 0;
    let totalDiscountAusencia = 0;
    let totalDiscounts = 0;
    let totalWorkedHours = 0;

    for (const w of workSummaries as any[]) {
      const u = usersById.get(String(w.user));
      if (!u) continue;

      const empId = String(u._id);

      const { isActive } = getExpectedFor(u, w.dateString);

      if (!isActive) continue;

      const salaryTypeId = u.salaryType ? String(u.salaryType) : "";
      const salaryCode = salaryTypeCodeById.get(salaryTypeId) || "FIJO";
      const salaryCodeUpper = String(salaryCode).toUpperCase();

      const netoMensual = toNum(netoMensualByEmp.get(empId), 0);
      const brutoMensual = toNum(brutoMensualByEmp.get(empId), 0);

      const netoPeriodoBase =
        periodDivisor > 0 ? netoMensual / periodDivisor : 0;

      const monthlyBaseForDiscount =
        payrollPolicyConfig.useGrossSalaryForDailyDiscount === false
          ? netoMensual
          : brutoMensual;

      const baseDiariaParaDescuento =
        rdFactorDiasMes > 0 ? monthlyBaseForDiscount / rdFactorDiasMes : 0;

      const entryPunch = earliestEntryByWS.get(String(w._id)) || null;

      const expectedFromSchedule = getExpectedFor(u, w.dateString);

      const rawDayCalc: any = calcAttendanceDeductionsForDay({
        ws: w,
        employee: u,
        entryPunch,
        expectedFromSchedule,
        salaryCode,
        graceMinutes: policyGraceMinutes,
        baseDailyForDiscountFixed: baseDiariaParaDescuento,
        hourlyRate: toNum(u.hourlyRate, 0),
        calcExpectedMinutesForDate,
        calcGrossPayHourlyDay,
      });

      if (rawDayCalc.skip) continue;

      const dayCalc = applyPayrollPolicyToDayCalc({
        dayCalc: rawDayCalc,
        ws: w,
        salaryCode,
        baseDailyForDiscountFixed: baseDiariaParaDescuento,
        payrollPolicyConfig,
      });

      const punchSteps =
        punchStepsByWS.get(String(w._id))?.sort((a, b) => {
          const ra = STEP_ORDER[String(a?.punchStep)] ?? 999;
          const rb = STEP_ORDER[String(b?.punchStep)] ?? 999;
          return ra - rb;
        }) || [];

      totalLateMinutes += toNum(dayCalc.lateMinutesForPayroll, 0);
      totalDiscountTardanza += toNum(dayCalc.descuentoTardanza, 0);
      totalDiscountAusencia += toNum(dayCalc.descuentoAusencia, 0);
      totalDiscounts += toNum(dayCalc.descuentoTotal, 0);
      totalWorkedHours += toNum(dayCalc.workedMinutes, 0);

      const dia = {
        workSummary: w._id,
        empleado: {
          _id: u._id,
          name: u.name,
          email: u.email || u.username,
          img: u.img || u.image || "",
        },
        date: w.date,
        dateString: w.dateString,

        classification: dayCalc.classification,
        isPaid: w.isPaid,
        confirmedToPay: !!w.confirmedToPay,

        workedMinutes: dayCalc.workedMinutes,
        expectedMinutes: dayCalc.expectedMinutes,
        approvedMinutes: dayCalc.approvedMinutes,

        entryLateRaw: dayCalc.entryLateRaw,
        graceExcusedMinutes: dayCalc.graceExcusedMinutes,
        lateMinutesForPayroll: dayCalc.lateMinutesForPayroll,
        lateMinutes: dayCalc.entryLateRaw,

        paidMinutes:
          salaryCodeUpper === "FIJO"
            ? dayCalc.paidMinutesFixed
            : dayCalc.paidMinutesHourly,

        notWorkedMinutes: dayCalc.notWorkedMinutes,

        payImpact: dayCalc.payImpact,
        discountOverride: dayCalc.discountOverride,

        netoDiario: round2(baseDiariaParaDescuento),
        descuentoTardanza: dayCalc.descuentoTardanza,
        descuentoAusencia: dayCalc.descuentoAusencia,
        descuentoTotal: dayCalc.descuentoTotal,

        hourlyRate:
          salaryCodeUpper === "HORAS" ? round2(toNum(u.hourlyRate, 0)) : 0,

        grossPayDay:
          salaryCodeUpper === "HORAS" ? round2(dayCalc.grossPayDay) : 0,

        isIncomplete: !!w.isIncomplete,
        missingSteps: w.missingSteps || [],
        punchSteps,
        isLate: punchSteps.find((p) => p.punchStep == "entrada")?.isLate,
        autoClosedReason: w.autoClosedReason || "",
        overrideReason: (w as any).overrideReason || "",
        approvedReason: (w as any).approvedReason || "",
      };

      dias.push(dia);

      const agg = employeesMap.get(empId) || {
        userId: empId,
        name: u.name,
        img: u.img || u.image || "",
        email: u.email || u.username || "",

        company: u.company || null,
        department: u.department || null,
        jobPosition: u.jobPosition || null,
        project: u.project || null,

        salaryCode: salaryCode || "FIJO",
        netoMensual: round2(netoMensual),
        netoPeriodoBase: round2(netoPeriodoBase),

        totalLateMinutes: 0,
        totalNotWorkedMinutes: 0,

        totalDiscountTardanza: 0,
        totalDiscountAusencia: 0,
        totalDiscounts: 0,

        totalWorkedMinutes: 0,
        totalApprovedMinutes: 0,
        totalGraceExcusedMinutes: 0,

        hourlyRate:
          salaryCodeUpper === "HORAS" ? round2(toNum(u.hourlyRate, 0)) : 0,

        totalGrossPay: 0,
        netoADepositar: 0,
        dias: [] as any[],
      };

      agg.totalWorkedMinutes += toNum(dayCalc.workedMinutes, 0);
      agg.totalApprovedMinutes += toNum(dayCalc.approvedMinutes, 0);
      agg.totalGraceExcusedMinutes += toNum(dayCalc.graceExcusedMinutes, 0);

      agg.totalLateMinutes += toNum(dayCalc.lateMinutesForPayroll, 0);
      agg.totalNotWorkedMinutes += toNum(dayCalc.notWorkedMinutes, 0);

      agg.totalDiscountTardanza += toNum(dayCalc.descuentoTardanza, 0);
      agg.totalDiscountAusencia += toNum(dayCalc.descuentoAusencia, 0);
      agg.totalDiscounts += toNum(dayCalc.descuentoTotal, 0);

      if (salaryCodeUpper === "HORAS") {
        agg.totalGrossPay += toNum(dayCalc.grossPayDay, 0);
      }

      agg.dias.push(dia);

      const netoADepositar =
        salaryCodeUpper === "FIJO"
          ? Math.max(0, netoMensual / periodDivisor - agg.totalDiscounts)
          : Math.max(0, agg.totalGrossPay);

      agg.netoADepositar = round2(netoADepositar);

      employeesMap.set(empId, agg);
    }

    const allEmployeesWithLoans = await Promise.all(
      Array.from(employeesMap.values()).map(async (e) => {
        const loanPlan = await getEmployeeLoanDeductionsForPayroll({
          employeeId: e.userId,
          payDate: loanPayDate,
          session: null,
        });
        const employeeLoanDeductionsTotal = round2(
          toNum(loanPlan?.totalAmount, 0),
        );
        const employeeNetToDeposit = round2(toNum(e.netoADepositar, 0));
        const companyPayrollTotal = round2(
          employeeNetToDeposit + employeeLoanDeductionsTotal,
        );

        return {
          ...e,
          employeeNetToDeposit,
          employeeLoanDeductionsTotal,
          companyPayrollTotal,
          netoADepositar: companyPayrollTotal,
          totalLateHours: round2(toNum(e.totalLateMinutes, 0) / 60),
        };
      }),
    );

    const allEmployees = allEmployeesWithLoans.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );

    const totalEmployees = allEmployees.length;
    const totalPages = Math.ceil(totalEmployees / limitNum);

    const employeesPage = allEmployees.slice(skip, skip + limitNum);

    const pageEmployeeIds = new Set(
      employeesPage.map((e: any) => String(e.userId)),
    );

    const diasPage = dias.filter((d: any) =>
      pageEmployeeIds.has(String(d?.empleado?._id)),
    );

    const totalNetoADepositar = round2(
      allEmployees.reduce((acc, e) => acc + toNum(e.netoADepositar, 0), 0),
    );
    const totalEmployeeNetToDeposit = round2(
      allEmployees.reduce((acc, e) => acc + toNum(e.employeeNetToDeposit, 0), 0),
    );
    const totalEmployeeLoanDeductions = round2(
      allEmployees.reduce(
        (acc, e) => acc + toNum(e.employeeLoanDeductionsTotal, 0),
        0,
      ),
    );

    const totalGrossPay = round2(
      allEmployees.reduce((acc, e) => acc + toNum(e.totalGrossPay, 0), 0),
    );

    return res.status(200).send({
      ok: true,
      frequencyCode,
      periodDivisor,
      paymentSchedule: {
        _id: paymentSchedule,
        name: paymentScheduleName,
      },
      payrollPolicy: {
        _id: payrollPolicy?._id || null,
        name: payrollPolicy?.name || "Política por defecto",
        code: payrollPolicy?.code || "DEFAULT_PAYROLL_POLICY",
        companyId: policyCompanyId,
        config: payrollPolicyConfig,
      },
      dias: diasPage,
      employees: employeesPage,
      totals: {
        totalLateMinutes: round2(totalLateMinutes),
        totalLateHours: round2(totalLateMinutes / 60),

        totalDiscountTardanza: round2(totalDiscountTardanza),
        totalDiscountAusencia: round2(totalDiscountAusencia),
        totalDiscounts: round2(totalDiscounts),

        totalNetoADepositar,
        totalCompanyPayroll: totalNetoADepositar,
        totalEmployeeNetToDeposit,
        totalEmployeeLoanDeductions,
        totalGrossPay,
        totalWorkedMinutes: round2(totalWorkedHours),
        totalWorkedHours: round2(totalWorkedHours / 60),

        totalEmployees,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalEmployees,
        totalPages,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const obtenerResumenMensualEmpleado = async (req: any, res: Response) => {
  try {
    const { fechaInicio, fechaFin, userId, onlySpecialDay, paymentSchedule } =
      req.body as {
        fechaInicio?: string;
        fechaFin?: string;
        userId?: string;
        onlySpecialDay?: boolean;
        paymentSchedule?: string;
      };

    if (!userId || !Types.ObjectId.isValid(String(userId))) {
      return res.status(400).send({
        ok: false,
        mensaje: "Debe enviar userId válido",
      });
    }

    const u: any = await User.findById(userId)
      .select(
        [
          "_id",
          "name",
          "img",
          "image",
          "email",
          "username",
          "schedule",
          "punchTypeId",
          "salaryType",
          "hourlyRate",
          "weeklyWorkHours",
          "isActived",
          "isDeleted",
          "paymentSchedule",
          "company",
          "department",
          "jobPosition",
          "project",
        ].join(" "),
      )
      .populate({ path: "punchTypeId" })
      .lean();

    if (!u || u.isDeleted || u.isActived === false) {
      return res.status(404).send({
        ok: false,
        mensaje: "Empleado no encontrado o inactivo",
      });
    }

    const payrollPolicyResp = await getPayrollPolicyConfig({
      companyId: getMongoIdString(u.company),
    });

    const payrollPolicy = payrollPolicyResp.policy;

    const payrollPolicyConfig = {
      ...DEFAULT_PAYROLL_POLICY_CONFIG,
      ...(payrollPolicyResp?.config || {}),
    };

    const rdFactorDiasMes = Math.max(
      toNum(payrollPolicyConfig.rdFactorDiasMes, 23.83),
      1,
    );

    const graceMinutes =
      payrollPolicyConfig.lateGraceEnabled === true
        ? Math.max(toNum(payrollPolicyConfig.lateGraceMinutes, 0), 0)
        : 0;

    const psIdToUse = paymentSchedule || u.paymentSchedule;

    if (!psIdToUse) {
      return res.status(400).send({
        ok: false,
        mensaje:
          "El empleado no tiene paymentSchedule y tampoco enviaste paymentSchedule.",
      });
    }

    if (
      paymentSchedule &&
      u.paymentSchedule &&
      String(paymentSchedule) !== String(u.paymentSchedule)
    ) {
      return res.status(400).send({
        ok: false,
        mensaje:
          "El empleado no pertenece a la corrida (paymentSchedule) enviada.",
      });
    }

    const psResp = await getPaymentScheduleOrFail(psIdToUse);

    if (!psResp.ok) {
      return res
        .status(psResp.status)
        .send({ ok: false, mensaje: psResp.mensaje });
    }

    const frequencyCode = psResp.frequencyCode;
    const periodDivisor = getPeriodDivisor(frequencyCode);

    const salaryTypeCodeById = await getSalaryTypeCodeMap([u]);
    const salaryTypeId = u.salaryType ? String(u.salaryType) : "";
    const salaryCode = salaryTypeCodeById.get(salaryTypeId) || "FIJO";
    const salaryCodeUpper = String(salaryCode).toUpperCase();

    const netoBrutoInfo = await calcularNetoMensualEmpleado(String(u._id));
    const netoMensual = toNum(netoBrutoInfo?.sueldoNetoMensual, 0);
    const brutoMensual = toNum(netoBrutoInfo?.sueldoBrutoMensual, 0);

    const netoPeriodoBase = periodDivisor > 0 ? netoMensual / periodDivisor : 0;

    const monthlyBaseForDiscount =
      payrollPolicyConfig.useGrossSalaryForDailyDiscount === false
        ? netoMensual
        : brutoMensual;

    const baseDiariaParaDescuento =
      rdFactorDiasMes > 0 ? monthlyBaseForDiscount / rdFactorDiasMes : 0;

    const dateQuery = buildDateQuery(fechaInicio, fechaFin);

    const wsQuery: any = {
      user: new Types.ObjectId(String(userId)),
      dateString: dateQuery,
      isDeleted: false,
    };

    if (onlySpecialDay) {
      const excludeValue = "Trabajo regular";
      wsQuery.$and = wsQuery.$and || [];
      wsQuery.$and.push(
        { classification: { $exists: true } },
        { classification: { $nin: [excludeValue, null] } },
      );
    }

    const workSummaries: any[] = await WorkSummary.find(wsQuery)
      .select(
        [
          "user",
          "date",
          "dateString",
          "totalMinutes",
          "expectedMinutes",
          "approvedMinutes",
          "notWorkedMinutes",
          "lateTime",
          "payImpact",
          "discountOverride",
          "overrideReason",
          "approvedReason",
          "classification",
          "confirmedToPay",
          "isIncomplete",
          "missingSteps",
          "autoClosedReason",
          "isPaid",
        ].join(" "),
      )
      .sort({ date: 1 })
      .lean();

    const employeeAgg: any = {
      userId: String(u._id),
      name: u.name,
      img: u.img || u.image || "",
      email: u.email || u.username || "",

      company: u.company || null,
      department: u.department || null,
      jobPosition: u.jobPosition || null,
      project: u.project || null,

      salaryCode: salaryCode || "FIJO",
      netoMensual: round2(netoMensual),
      netoPeriodoBase: round2(netoPeriodoBase),

      totalLateMinutes: 0,
      totalNotWorkedMinutes: 0,

      totalDiscountTardanza: 0,
      totalDiscountAusencia: 0,
      totalDiscounts: 0,

      totalWorkedMinutes: 0,
      totalApprovedMinutes: 0,
      totalGraceExcusedMinutes: 0,

      hourlyRate:
        salaryCodeUpper === "HORAS" ? round2(toNum(u.hourlyRate, 0)) : 0,

      totalGrossPay: 0,
      netoADepositar: 0,

      dias: [] as any[],
    };

    if (!workSummaries.length) {
      return res.status(200).send({
        ok: true,
        frequencyCode,
        periodDivisor,
        paymentSchedule: {
          _id: psIdToUse,
          name: (psResp as any).paymentSchedule?.name,
        },
        payrollPolicy: {
          _id: payrollPolicy?._id || null,
          name: payrollPolicy?.name || "Política por defecto",
          code: payrollPolicy?.code || "DEFAULT_PAYROLL_POLICY",
          companyId: getMongoIdString(u.company),
          config: payrollPolicyConfig,
        },
        dias: [],
        employee: {
          ...employeeAgg,
          totalLateHours: round2(0),
          totalWorkedHours: round2(0),
        },
        totals: {
          totalLateMinutes: 0,
          totalLateHours: 0,

          totalDiscountTardanza: 0,
          totalDiscountAusencia: 0,
          totalDiscounts: 0,

          totalNetoADepositar: 0,
          totalWorkedHours: 0,
        },
      });
    }

    const wsIds = workSummaries.map((w) => w._id);

    const punches: IPunchHistory[] = await PunchHistory.find({
      workSummary: { $in: wsIds },
      isDeleted: false,
    })
      .select(
        "workSummary punchStep expectedTime timestamp isLate date lateTime",
      )
      .lean();

    const punchStepsByWS = new Map<string, any[]>();

    for (const p of punches) {
      const key = String(p.workSummary);
      const arr = punchStepsByWS.get(key) || [];
      arr.push(p);
      punchStepsByWS.set(key, arr);
    }

    const earliestEntryByWS = buildEarliestEntryByWS(punches);

    const expectedCache = new Map<
      string,
      { expectedMinutes: number; isActive: boolean }
    >();

    const getExpectedFromSchedule = (dateString: string) => {
      const key = String(dateString).slice(0, 10);
      const cached = expectedCache.get(key);

      if (cached) return cached;

      const exp = calcExpectedMinutesForDate(u?.schedule, u?.punchTypeId, key);

      const out = {
        expectedMinutes: toNum(exp?.expectedMinutes, 0),
        isActive: !!exp?.isActive,
      };

      expectedCache.set(key, out);

      return out;
    };

    const dias: any[] = [];

    let totalLateMinutes = 0;
    let totalDiscountTardanza = 0;
    let totalDiscountAusencia = 0;
    let totalDiscounts = 0;
    let totalWorkedMinutes = 0;

    for (const w of workSummaries) {
      const expectedFromSchedule = getExpectedFromSchedule(w.dateString);

      if (!expectedFromSchedule?.isActive) continue;

      const entryPunch = earliestEntryByWS.get(String(w._id)) || null;

      const rawDayCalc: any = calcAttendanceDeductionsForDay({
        ws: w,
        employee: u,
        entryPunch,
        expectedFromSchedule,
        salaryCode,
        graceMinutes,
        baseDailyForDiscountFixed: baseDiariaParaDescuento,
        hourlyRate: toNum(u.hourlyRate, 0),
        calcExpectedMinutesForDate,
        calcGrossPayHourlyDay,
      });

      if (rawDayCalc?.skip) continue;

      const dayCalc = applyPayrollPolicyToDayCalc({
        dayCalc: rawDayCalc,
        ws: w,
        salaryCode,
        baseDailyForDiscountFixed: baseDiariaParaDescuento,
        payrollPolicyConfig,
      });

      const punchSteps =
        punchStepsByWS.get(String(w._id))?.sort((a, b) => {
          const ra = STEP_ORDER[String(a?.punchStep)] ?? 999;
          const rb = STEP_ORDER[String(b?.punchStep)] ?? 999;
          return ra - rb;
        }) || [];

      totalLateMinutes += toNum(dayCalc.lateMinutesForPayroll, 0);
      totalDiscountTardanza += toNum(dayCalc.descuentoTardanza, 0);
      totalDiscountAusencia += toNum(dayCalc.descuentoAusencia, 0);
      totalDiscounts += toNum(dayCalc.descuentoTotal, 0);
      totalWorkedMinutes += toNum(dayCalc.workedMinutes, 0);

      const dia = {
        workSummary: w._id,
        empleado: {
          _id: u._id,
          name: u.name,
          email: u.email || u.username,
          img: u.img || u.image || "",
        },

        date: w.date,
        dateString: w.dateString,

        classification: dayCalc.classification,
        isPaid: w.isPaid,
        confirmedToPay: !!w.confirmedToPay,

        workedMinutes: dayCalc.workedMinutes,
        expectedMinutes: dayCalc.expectedMinutes,
        approvedMinutes: dayCalc.approvedMinutes,

        entryLateRaw: dayCalc.entryLateRaw,
        graceExcusedMinutes: dayCalc.graceExcusedMinutes,
        lateMinutesForPayroll: dayCalc.lateMinutesForPayroll,
        lateMinutes: dayCalc.entryLateRaw,

        paidMinutes:
          salaryCodeUpper === "FIJO"
            ? dayCalc.paidMinutesFixed
            : dayCalc.paidMinutesHourly,

        notWorkedMinutes: dayCalc.notWorkedMinutes,

        payImpact: dayCalc.payImpact,
        discountOverride: dayCalc.discountOverride,

        netoDiario: round2(baseDiariaParaDescuento),

        descuentoTardanza: dayCalc.descuentoTardanza,
        descuentoAusencia: dayCalc.descuentoAusencia,
        descuentoTotal: dayCalc.descuentoTotal,

        hourlyRate:
          salaryCodeUpper === "HORAS" ? round2(toNum(u.hourlyRate, 0)) : 0,

        grossPayDay:
          salaryCodeUpper === "HORAS" ? round2(dayCalc.grossPayDay) : 0,

        isIncomplete: !!w.isIncomplete,
        missingSteps: w.missingSteps || [],
        punchSteps,
        isLate: punchSteps.find((p) => p.punchStep === "entrada")?.isLate,
        autoClosedReason: w.autoClosedReason || "",
        overrideReason: (w as any).overrideReason || "",
        approvedReason: (w as any).approvedReason || "",
      };

      dias.push(dia);
      employeeAgg.dias.push(dia);

      employeeAgg.totalWorkedMinutes += toNum(dayCalc.workedMinutes, 0);
      employeeAgg.totalApprovedMinutes += toNum(dayCalc.approvedMinutes, 0);
      employeeAgg.totalGraceExcusedMinutes += toNum(
        dayCalc.graceExcusedMinutes,
        0,
      );

      employeeAgg.totalLateMinutes += toNum(dayCalc.lateMinutesForPayroll, 0);
      employeeAgg.totalNotWorkedMinutes += toNum(dayCalc.notWorkedMinutes, 0);

      employeeAgg.totalDiscountTardanza += toNum(dayCalc.descuentoTardanza, 0);
      employeeAgg.totalDiscountAusencia += toNum(dayCalc.descuentoAusencia, 0);
      employeeAgg.totalDiscounts += toNum(dayCalc.descuentoTotal, 0);

      if (salaryCodeUpper === "HORAS") {
        employeeAgg.totalGrossPay += toNum(dayCalc.grossPayDay, 0);
      }

      const netoADepositar =
        salaryCodeUpper === "FIJO"
          ? Math.max(
              0,
              netoMensual / periodDivisor - employeeAgg.totalDiscounts,
            )
          : Math.max(0, employeeAgg.totalGrossPay);

      employeeAgg.netoADepositar = round2(netoADepositar);
    }

    const totalNetoADepositar = round2(toNum(employeeAgg.netoADepositar, 0));

    return res.status(200).send({
      ok: true,
      frequencyCode,
      periodDivisor,
      paymentSchedule: {
        _id: psIdToUse,
        name: (psResp as any).paymentSchedule?.name,
      },
      payrollPolicy: {
        _id: payrollPolicy?._id || null,
        name: payrollPolicy?.name || "Política por defecto",
        code: payrollPolicy?.code || "DEFAULT_PAYROLL_POLICY",
        companyId: getMongoIdString(u.company),
        config: payrollPolicyConfig,
      },
      dias,
      employee: {
        ...employeeAgg,
        totalLateHours: round2(toNum(employeeAgg.totalLateMinutes, 0) / 60),
        totalWorkedHours: round2(toNum(employeeAgg.totalWorkedMinutes, 0) / 60),
      },
      totals: {
        totalLateMinutes: round2(totalLateMinutes),
        totalLateHours: round2(totalLateMinutes / 60),

        totalDiscountTardanza: round2(totalDiscountTardanza),
        totalDiscountAusencia: round2(totalDiscountAusencia),
        totalDiscounts: round2(totalDiscounts),

        totalNetoADepositar,
        totalWorkedHours: round2(totalWorkedMinutes),
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getPunches = async (req: any, res: Response) => {
  try {
    const {
      fechaInicio,
      fechaFin,
      departmentId,
      projectId,
      userId,
      userIds,
      onlySpecialDay,
    } = req.body as any;

    // ✅ Default: si no mandan fechaInicio, usar HOY
    const start = String(fechaInicio || "").trim() || formatDateYMD(new Date());
    const end = String(fechaFin || "").trim();

    // ✅ ya no hay paymentSchedule, pero mantenemos compat
    const frequencyCode = null;
    const periodDivisor = 0;

    // 1) Empleados del grupo (SIN paymentScheduleId)
    const empResp = await findEmployeeIdsByFilters({
      departmentId: req.user.isManager ? req.user.department : departmentId,
      projectId,
      userId,
      userIds,
      managerId: req.user.isManager ? req.user._id : null,
      paymentScheduleId: null,
    });

    if (!empResp.ok) {
      return res
        .status(empResp.status)
        .send({ ok: false, mensaje: empResp.mensaje });
    }

    const employeeIds = empResp.employeeIds || [];
    if (!employeeIds.length) {
      return res.status(200).send({
        ok: true,
        frequencyCode,
        periodDivisor,
        employees: [],
        dias: [],
        totals: {
          totalLateMinutes: 0,
          totalLateHours: 0,
          totalDiscountTardanza: 0,
          totalDiscountAusencia: 0,
          totalDiscounts: 0,
          totalNetoADepositar: 0,
          totalWorkedHours: 0,
        },
      });
    }

    // 2) Query por fecha + empleados
    const dateQuery = buildDateQuery(start, end || undefined);

    const wsQuery: any = {
      user: { $in: employeeIds },
      dateString: dateQuery,
      isDeleted: false,
    };

    if (onlySpecialDay) {
      const excludeValue = "Trabajo regular";
      wsQuery.$and = wsQuery.$and || [];
      wsQuery.$and.push(
        { classification: { $exists: true } },
        { classification: { $nin: [excludeValue, null] } },
      );
    }

    // 3) WorkSummaries (solo lo necesario)
    const workSummaries = await WorkSummary.find(wsQuery)
      .select(
        [
          "user",
          "date",
          "dateString",
          "totalMinutes",
          "expectedMinutes",
          "approvedMinutes",
          "lateTime",
          "classification",
          "confirmedToPay",
          "isIncomplete",
          "missingSteps",
          "autoClosedReason",
          "isPaid",
        ].join(" "),
      )
      .sort({ date: 1 })
      .lean();

    if (!workSummaries.length) {
      return res.status(200).send({
        ok: true,
        frequencyCode,
        periodDivisor,
        employees: [],
        dias: [],
        totals: {
          totalLateMinutes: 0,
          totalLateHours: 0,
          totalDiscountTardanza: 0,
          totalDiscountAusencia: 0,
          totalDiscounts: 0,
          totalNetoADepositar: 0,
          totalWorkedHours: 0,
        },
      });
    }

    // 4) Users involucrados
    const involvedUserIds = Array.from(
      new Set(workSummaries.map((w: any) => String(w.user))),
    );

    const usersDocs = await User.find({ _id: { $in: involvedUserIds } })
      .select("_id name img image email username isActived isDeleted")
      .lean();

    const usersById = new Map<string, any>();
    for (const u of usersDocs as any[]) {
      if (u && !u.isDeleted && u.isActived !== false) {
        usersById.set(String(u._id), u);
      }
    }

    // 5) PunchHistory lote
    const wsIds = workSummaries.map((w: any) => w._id);

    const punches = await PunchHistory.find({
      workSummary: { $in: wsIds },
      isDeleted: false,
    })
      .select("workSummary punchStep expectedTime timestamp isLate lateTime")
      .lean();

    const punchStepsByWS = new Map<string, any[]>();
    for (const p of punches as any[]) {
      const key = String(p.workSummary);
      const arr = punchStepsByWS.get(key) || [];
      arr.push(p);
      punchStepsByWS.set(key, arr);
    }

    // ordenar steps por timestamp
    for (const [k, arr] of punchStepsByWS.entries()) {
      arr.sort((a: any, b: any) => {
        const ta = new Date(a?.timestamp || 0).getTime();
        const tb = new Date(b?.timestamp || 0).getTime();
        return ta - tb;
      });
      punchStepsByWS.set(k, arr);
    }

    // helper: elegir "entrada" si existe, sino el primer punch
    const pickEntryPunch = (steps: any[]) => {
      if (!Array.isArray(steps) || !steps.length) return null;
      const entry = steps.find(
        (s: any) => String(s?.punchStep || "").toLowerCase() === "entrada",
      );
      return entry || steps[0] || null;
    };

    // 6) Construir días + agrupar por empleado
    const dias: any[] = [];
    const employeesMap = new Map<string, any>();

    let totalLateMinutes = 0;
    let totalWorkedMinutes = 0;

    for (const w of workSummaries as any[]) {
      const u = usersById.get(String(w.user));
      if (!u) continue;

      const empId = String(u._id);

      const punchSteps = punchStepsByWS.get(String(w._id)) || [];
      const entryPunch = pickEntryPunch(punchSteps);

      const lateMinutes = toNum(entryPunch?.lateTime, 0);
      const isLate = !!entryPunch?.isLate;

      const workedMinutes = toNum(w.totalMinutes, 0);
      const expectedMinutes = toNum(w.expectedMinutes, 0);
      const approvedMinutes = toNum(w.approvedMinutes, 0);

      totalLateMinutes += lateMinutes;
      totalWorkedMinutes += workedMinutes;

      const dia = {
        workSummary: w._id,

        empleado: {
          _id: u._id,
          name: u.name,
          email: u.email || u.username,
          img: u.img || u.image || "",
        },

        date: w.date,
        dateString: w.dateString,

        classification: w.classification || "Trabajo regular",
        isPaid: !!w.isPaid,
        confirmedToPay: !!w.confirmedToPay,

        // ✅ métricas base (sin dinero)
        workedMinutes,
        expectedMinutes,
        approvedMinutes,

        isLate,
        lateMinutes,

        isIncomplete: !!w.isIncomplete,
        missingSteps: w.missingSteps || [],
        autoClosedReason: w.autoClosedReason || "",

        // ✅ ponches
        punchSteps,

        // ✅ compat para tu PunchDetailsDialog (si lo espera)
        descuentoTotal: 0,
      };

      dias.push(dia);

      const agg = employeesMap.get(empId) || {
        userId: empId,
        name: u.name,
        img: u.img || u.image || "",
        email: u.email || u.username || "",

        totalLateMinutes: 0,
        totalWorkedMinutes: 0,

        // compat UI
        totalDiscountTardanza: 0,
        totalDiscountAusencia: 0,
        totalDiscounts: 0,
        totalGrossPay: 0,
        netoADepositar: 0,

        dias: [] as any[],
      };

      agg.totalLateMinutes += lateMinutes;
      agg.totalWorkedMinutes += workedMinutes;
      agg.dias.push(dia);

      employeesMap.set(empId, agg);
    }

    const employees = Array.from(employeesMap.values()).map((e) => ({
      ...e,
      totalLateHours: round2(toNum(e.totalLateMinutes, 0) / 60),
      totalWorkedHours: round2(toNum(e.totalWorkedMinutes, 0) / 60),
    }));

    return res.status(200).send({
      ok: true,
      frequencyCode,
      periodDivisor,
      dias,
      employees,
      totals: {
        totalLateMinutes: round2(totalLateMinutes),
        totalLateHours: round2(totalLateMinutes / 60),

        // compat (sin dinero)
        totalDiscountTardanza: 0,
        totalDiscountAusencia: 0,
        totalDiscounts: 0,
        totalNetoADepositar: 0,

        totalWorkedHours: round2(totalWorkedMinutes / 60),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

//

export const createPunchType = async (req: Request, res: Response) => {
  try {
    const { code, name, expectedPunches, description } = req.body;

    // Verificar duplicado por código
    const exists = await PunchType.findOne({ code });
    if (exists) {
      return res
        .status(409)
        .json({ error: "Ya existe un tipo de ponche con este código." });
    }

    const punchType: IPunchType = new PunchType({
      code,
      name,
      expectedPunches,
      description,
    });

    await punchType.save();
    return res.status(201).send({
      ok: true,
      mensaje: "Tipo de ponche creado exitosamente",
      message: "Tipo de ponche creado exitosamente",
      punchType,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

export const getPunchType = async (req: Request, res: Response) => {
  try {
    const punchType = await PunchType.find({ isActive: true });
    return res.status(201).send({
      ok: true,
      mensaje: "Tipo de ponche conseguido exitosamente",
      punchType,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

//

export const registrarPonche = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const now = moment();
    const today = now.format("YYYY-MM-DD");

    const { codigo } = req.body;

    let img = null;

    const diaSemana = normalizeDiaSemanaFromDate(today);

    const user = await User.findOne({ code_punch: codigo }).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).send({
        ok: false,
        mensaje: "Codigo no valido.",
      });
    }

    if (!user.isActived) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).send({
        ok: false,
        mensaje: "Usuario desactivado, Comunicante con un administrador",
      });
    }

    if (user.isDeleted) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).send({
        ok: false,
        mensaje: "Usuario Eliminado, Comunicante con un administrador",
      });
    }

    if (req.imageURL) {
      img = req.imageURL;
    } else {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).send({
        ok: false,
        mensaje: "Foto es requerida",
      });
    }

    console.log("Usuario encontrado para ponche:", user.punchTypeId, user.schedule);
    if (!user.punchTypeId || !user.schedule) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).send({
        ok: false,
        mensaje: "Usuario o configuración incompleta.",
      });
    }

    const payrollPolicyConfig = await resolvePunchPayrollPolicyConfig(user);
    const graceMinutes = getPolicyGraceMinutes(payrollPolicyConfig);

    const punchType = await PunchType.findById(user.punchTypeId).session(
      session,
    );

    if (!punchType || !punchType.expectedPunches) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        ok: false,
        mensaje: "Tipo de ponche inválido o sin pasos definidos.",
      });
    }

    const expectedPunchesBase: punchStep[] =
      punchType.expectedPunches as punchStep[];

    const scheduleDia = (user.schedule as any)[diaSemana];

    if (!scheduleDia || !scheduleDia.isActive) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).send({
        ok: false,
        mensaje: "El día no está activo en el horario del usuario.",
      });
    }

    const expectedPunchesTodayRaw = buildExpectedPunchesFromSchedule(scheduleDia);

    const expectedPunchesToday = expectedPunchesTodayRaw.filter((step) =>
      expectedPunchesBase.includes(step),
    );

    if (!expectedPunchesToday.length) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).send({
        ok: false,
        mensaje:
          "Horario del día no tiene horas válidas para registrar ponches.",
      });
    }

    const todayPunches = await PunchHistory.find({
      user: user._id,
      date: today,
      isDeleted: false,
    })
      .sort({ timestamp: 1 })
      .session(session);

    const completedSteps = todayPunches.map((p) => p.punchStep);

    const nextStep = expectedPunchesToday.find(
      (step) => !completedSteps.includes(step),
    );

    if (!nextStep) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).send({
        ok: false,
        mensaje: "Ya se registraron todos los ponches del día.",
      });
    }

    const horaEsperadaMap: Record<punchStep, string | undefined> = {
      entrada: scheduleDia.entryTime,
      salida_almuerzo: scheduleDia.lunchStartTime,
      entrada_almuerzo: scheduleDia.lunchEndTime,
      salida: scheduleDia.exitTime,
    };

    const horaEsperada = horaEsperadaMap[nextStep];

    let isLate = false;
    let lateTime = 0;

    const nowDate = now.toDate();
    const LATE_STEPS: punchStep[] = ["entrada"];

    if (LATE_STEPS.includes(nextStep) && horaEsperada) {
      const late = calcLateInfo({
        dateString: today,
        expectedTime: horaEsperada,
        timestamp: nowDate,
        graceMinutes,
      });

      isLate = !!late.isLate;
      lateTime = toNum(late.lateSecondsTotal, 0);
    }

    const sameTimePunch = todayPunches.find((p) => {
      const punchTime = moment(p.timestamp).format("HH:mm");
      const nowTime = moment(nowDate).format("HH:mm");

      return punchTime === nowTime;
    });

    if (sameTimePunch) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        ok: false,
        mensaje: "Ya existe un ponche registrado a esta misma hora.",
      });
    }

    const [registro] = await PunchHistory.create(
      [
        {
          user: user._id,
          punchType: punchType._id,
          punchStep: nextStep,
          timestamp: now.toDate(),
          date: today,
          img,
          expectedTime: horaEsperada || null,
          isLate,
          lateTime,
        },
      ],
      { session },
    );

    const workSummary = await calcularResumenDiario(
      user._id,
      [...todayPunches, registro],
      session,
    );

    if (workSummary) {
      registro.workSummary = workSummary._id;
      await registro.save({ session });

      if (LATE_STEPS.includes(nextStep) && horaEsperada) {
        workSummary.lateTime = lateTime;
        await workSummary.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).send({
      ok: true,
      mensaje: `Ponche '${nextStep}' registrado exitosamente.`,
      data: registro,
      workSummary,
      horaEsperada,
      payrollPolicy: {
        lateGraceEnabled: payrollPolicyConfig.lateGraceEnabled,
        lateGraceMinutes: graceMinutes,
        lateGraceMode: payrollPolicyConfig.lateGraceMode,
      },
    });
  } catch (error) {
    console.log(error);

    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

export const createPunchData = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  const abortTx = async () => {
    try {
      await session.abortTransaction();
    } catch (_) {}
  };

  try {
    session.startTransaction();

    const uploaderId = req.user?._id;

    const {
      userId,
      punchStep,
      dateString,
      expectedTime,
      timestamp,
      workSummary,
    } = req.body;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      await abortTx();

      return res.status(400).send({
        ok: false,
        mensaje: "userId inválido",
      });
    }

    if (!dateString || !moment(dateString, "YYYY-MM-DD", true).isValid()) {
      await abortTx();

      return res.status(400).send({
        ok: false,
        mensaje: "dateString inválido (YYYY-MM-DD)",
      });
    }

    const ts = moment(timestamp);

    if (!timestamp || !ts.isValid()) {
      await abortTx();

      return res.status(400).send({
        ok: false,
        mensaje: "timestamp inválido",
      });
    }

    if (ts.format("YYYY-MM-DD") !== dateString) {
      await abortTx();

      return res.status(400).send({
        ok: false,
        mensaje: `timestamp inválido: debe pertenecer al día ${dateString}`,
      });
    }

    if (!punchStep || !PUNCH_STEPS.includes(String(punchStep) as any)) {
      await abortTx();

      return res.status(400).send({
        ok: false,
        mensaje: "punchStep inválido",
      });
    }

    const expectedTimeNorm =
      expectedTime !== undefined
        ? normalizeExpectedTime(expectedTime)
        : undefined;

    if (expectedTime !== undefined && expectedTime && !expectedTimeNorm) {
      await abortTx();

      return res.status(400).send({
        ok: false,
        mensaje: "expectedTime inválido. Usa HH:mm o HH:mm:ss",
      });
    }

    const user: any = await User.findById(userId).session(session);

    if (!user) {
      await abortTx();

      return res.status(404).send({
        ok: false,
        mensaje: "Usuario no encontrado",
      });
    }

    const userIsActive = user.isActived ?? true;

    if (!userIsActive || user.isDeleted) {
      await abortTx();

      return res.status(400).json({
        ok: false,
        error: "Este empleado está desactivado",
      });
    }

    const payrollPolicyConfig = await resolvePunchPayrollPolicyConfig(user);
    const graceMinutes = getPolicyGraceMinutes(payrollPolicyConfig);

    const existsSameStep = await PunchHistory.findOne({
      user: user._id,
      date: dateString,
      punchStep: String(punchStep),
      isDeleted: false,
    })
      .select("_id")
      .session(session)
      .lean();

    if (existsSameStep) {
      await abortTx();

      return res.status(400).send({
        ok: false,
        mensaje: `Ya existe un ponche con el step "${punchStep}" en este día`,
      });
    }

    let workSummaryDoc: any = null;

    if (workSummary && Types.ObjectId.isValid(workSummary)) {
      workSummaryDoc = await WorkSummary.findById(workSummary).session(session);

      if (workSummaryDoc) {
        const okUser = String(workSummaryDoc.user) === String(user._id);

        const okDate =
          String(workSummaryDoc.dateString || "").slice(0, 10) ===
          String(dateString).slice(0, 10);

        if (!okUser || !okDate) {
          await abortTx();

          return res.status(400).send({
            ok: false,
            mensaje:
              "workSummary no corresponde al mismo usuario o al mismo dateString",
          });
        }
      }
    }

    if (!workSummaryDoc) {
      workSummaryDoc = await WorkSummary.findOne({
        user: user._id,
        dateString,
        isDeleted: false,
      }).session(session);

      if (!workSummaryDoc) {
        const created = await WorkSummary.create(
          [
            {
              user: user._id,
              date: moment(dateString, "YYYY-MM-DD", true).toDate(),
              dateString,
              totalMinutes: 0,
              expectedMinutes: 0,
              approvedMinutes: 0,
              notWorkedMinutes: 0,
              isIncomplete: true,
              punchSteps: [],
              missingSteps: [],
              classification: "Trabajo regular",
              wasAutoClosed: false,
              confirmedToPay: false,
              payImpact: "NONE",
              discountOverride: "AUTO",
              lateTime: 0,
              isPaid: false,
            },
          ],
          { session },
        );

        workSummaryDoc = Array.isArray(created) ? created[0] : created;
      }
    }

    const dayKey = getScheduleDayKeyFromYMD(dateString);
    const dia = user.schedule?.[dayKey] || null;

    const step = String(punchStep);

    const currentExpectedTime =
      step === "entrada"
        ? (expectedTimeNorm ?? normalizeExpectedTime(dia?.entryTime) ?? null)
        : null;

    const late =
      step === "entrada"
        ? calcLateInfo({
            dateString,
            expectedTime: currentExpectedTime,
            timestamp: ts.toDate(),
            graceMinutes,
          })
        : {
            isLate: false,
            lateSecondsTotal: 0,
          };

    const payload: any = {
      user: user._id,
      punchType: user.punchTypeId,
      punchStep: step,
      date: dateString,
      timestamp: ts.toDate(),
      expectedTime: step === "entrada" ? currentExpectedTime : null,
      isLate: step === "entrada" ? !!late.isLate : false,
      lateTime: step === "entrada" ? toNum(late.lateSecondsTotal, 0) : 0,
      workSummary: workSummaryDoc._id,
      updatedBy: uploaderId,
      img: req.imageURL || null,
      isDeleted: false,
      isActive: true,
    };

    let createdPunch: any;

    try {
      const punchHistory = await PunchHistory.create([payload], { session });

      createdPunch = Array.isArray(punchHistory)
        ? punchHistory[0]
        : punchHistory;
    } catch (err: any) {
      if (err?.code === 11000) {
        await abortTx();

        return res.status(400).send({
          ok: false,
          mensaje: `Ya existe un ponche con el step "${step}" en este día`,
        });
      }

      throw err;
    }

    const updatedWS = await recalcWorkSummaryDay({
      workSummaryId: workSummaryDoc._id,
      session,
    });

    await session.commitTransaction();

    return res.status(201).send({
      ok: true,
      mensaje: "Ponche creado y WorkSummary actualizado",
      message: "Punch created and WorkSummary updated",
      punchHistory: createdPunch,
      workSummary: updatedWS,
      payrollPolicy: {
        lateGraceEnabled: payrollPolicyConfig.lateGraceEnabled,
        lateGraceMinutes: graceMinutes,
        lateGraceMode: payrollPolicyConfig.lateGraceMode,
      },
    });
  } catch (error) {
    console.log(error);

    try {
      await session.abortTransaction();
    } catch (_) {}

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  } finally {
    session.endSession();
  }
};

export const updatePunchData = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  const abortTx = async () => {
    try {
      await session.abortTransaction();
    } catch (_) {}
  };

  try {
    session.startTransaction();

    const { id, timestamp, punchStep, expectedTime } = req.body;

    if (!id || !Types.ObjectId.isValid(id)) {
      await abortTx();

      return res.status(400).send({
        ok: false,
        mensaje: "id inválido",
      });
    }

    const userId = req.user?._id || null;

    const prev: any = await PunchHistory.findById(id).session(session).lean();

    if (!prev || prev.isDeleted === true) {
      await abortTx();

      return res.status(404).send({
        ok: false,
        mensaje: "Ponche no encontrado",
      });
    }

    const punchUser: any = await User.findById(prev.user)
      .select("_id company")
      .session(session)
      .lean();

    const payrollPolicyConfig =
      await resolvePunchPayrollPolicyConfig(punchUser);

    const graceMinutes = getPolicyGraceMinutes(payrollPolicyConfig);

    const prevDateYMD = getYMD(prev.date);

    const updates: Record<string, any> = {};

    if (timestamp !== undefined) {
      const m = moment(timestamp);

      if (!m.isValid()) {
        await abortTx();

        return res.status(400).send({
          ok: false,
          mensaje: "timestamp inválido",
        });
      }

      if (m.format("YYYY-MM-DD") !== prevDateYMD) {
        await abortTx();

        return res.status(400).send({
          ok: false,
          mensaje: `timestamp inválido: debe pertenecer al mismo día ${prevDateYMD}`,
        });
      }

      updates.timestamp = m.toDate();
    }

    if (punchStep !== undefined) {
      const nextStep = String(punchStep);

      if (!PUNCH_STEPS.includes(nextStep as any)) {
        await abortTx();

        return res.status(400).send({
          ok: false,
          mensaje: "punchStep inválido",
        });
      }

      updates.punchStep = nextStep;
    }

    if (expectedTime !== undefined) {
      const timeNorm = normalizeExpectedTime(expectedTime);

      if (!expectedTime) {
        delete updates.expectedTime;
      } else if (!timeNorm) {
        await abortTx();

        return res.status(400).send({
          ok: false,
          mensaje: "expectedTime inválido. Usa HH:mm o HH:mm:ss",
        });
      } else {
        updates.expectedTime = timeNorm;
      }
    }

    if (Object.keys(updates).length === 0) {
      await abortTx();

      return res.status(200).send({
        ok: true,
        mensaje: "Sin cambios",
        punchHistory: prev,
      });
    }

    const finalStep = updates.punchStep ?? prev.punchStep;

    if (updates.punchStep) {
      const duplicated = await PunchHistory.findOne({
        _id: { $ne: prev._id },
        user: prev.user,
        date: prev.date,
        punchStep: finalStep,
        isDeleted: false,
      })
        .select("_id")
        .session(session)
        .lean();

      if (duplicated) {
        await abortTx();

        return res.status(400).send({
          ok: false,
          mensaje: `Ya existe un ponche con el step "${finalStep}" en este día`,
        });
      }
    }

    const changes: Array<{ field: string; from: any; to: any }> = [];

    const norm = (value: any) => {
      return value === undefined ? null : value;
    };

    for (const key of Object.keys(updates)) {
      const fromVal = prev[key];
      const toVal = updates[key];

      if (JSON.stringify(norm(fromVal)) !== JSON.stringify(norm(toVal))) {
        changes.push({
          field: key,
          from: fromVal ?? null,
          to: toVal ?? null,
        });
      }
    }

    const finalTimestamp: Date = updates.timestamp ?? prev.timestamp;

    const finalExpectedTime: string | null =
      updates.expectedTime ?? prev.expectedTime ?? null;

    if (finalStep !== "entrada") {
      if (prev.expectedTime !== null || updates.expectedTime !== undefined) {
        updates.expectedTime = null;

        changes.push({
          field: "expectedTime",
          from: prev.expectedTime ?? null,
          to: null,
        });
      }

      if ((prev.isLate ?? false) !== false) {
        updates.isLate = false;

        changes.push({
          field: "isLate",
          from: prev.isLate ?? null,
          to: false,
        });
      }

      if (toNum(prev.lateTime, 0) !== 0) {
        updates.lateTime = 0;

        changes.push({
          field: "lateTime",
          from: prev.lateTime ?? 0,
          to: 0,
        });
      }
    } else {
      if (!finalExpectedTime || !finalTimestamp) {
        const nextLate = false;
        const nextLateTime = 0;

        if ((prev.isLate ?? false) !== nextLate) {
          updates.isLate = nextLate;

          changes.push({
            field: "isLate",
            from: prev.isLate ?? null,
            to: nextLate,
          });
        }

        if (toNum(prev.lateTime, 0) !== nextLateTime) {
          updates.lateTime = nextLateTime;

          changes.push({
            field: "lateTime",
            from: prev.lateTime ?? 0,
            to: nextLateTime,
          });
        }
      } else {
        const late = calcLateInfo({
          dateString: prevDateYMD,
          expectedTime: String(finalExpectedTime),
          timestamp: new Date(finalTimestamp),
          graceMinutes,
        });

        const nextLate = !!late.isLate;
        const nextLateTime = toNum(late.lateSecondsTotal, 0);

        if ((prev.isLate ?? false) !== nextLate) {
          updates.isLate = nextLate;

          changes.push({
            field: "isLate",
            from: prev.isLate ?? null,
            to: nextLate,
          });
        }

        if (toNum(prev.lateTime, 0) !== nextLateTime) {
          updates.lateTime = nextLateTime;

          changes.push({
            field: "lateTime",
            from: prev.lateTime ?? 0,
            to: nextLateTime,
          });
        }
      }
    }

    if (changes.length === 0) {
      await abortTx();

      return res.status(200).send({
        ok: true,
        mensaje: "Sin cambios efectivos",
        punchHistory: prev,
      });
    }

    const now = new Date();

    const updateDoc: any = {
      $set: {
        ...updates,
        updatedBy: userId,
        updatedAt: now,
      },
      $push: {
        audit: {
          at: now,
          by: userId,
          ip: req.ip,
          action: "update",
          changes,
        },
      },
    };

    const punchHistory: any = await PunchHistory.findByIdAndUpdate(
      id,
      updateDoc,
      {
        new: true,
        session,
      },
    );

    let updatedWS: any = null;

    if (punchHistory?.workSummary) {
      updatedWS = await recalcWorkSummaryDay({
        workSummaryId: punchHistory.workSummary,
        session,
      });
    }

    await session.commitTransaction();

    return res.status(200).send({
      ok: true,
      punchHistory,
      workSummary: updatedWS,
      mensaje: "Ponche actualizado correctamente",
      message: "Punch updated successfully",
      payrollPolicy: {
        lateGraceEnabled: payrollPolicyConfig.lateGraceEnabled,
        lateGraceMinutes: graceMinutes,
        lateGraceMode: payrollPolicyConfig.lateGraceMode,
      },
    });
  } catch (error) {
    console.log(error);

    try {
      await session.abortTransaction();
    } catch (_) {}

    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
      error,
    });
  } finally {
    session.endSession();
  }
};

export const deletePunchData = async (req: any, res: Response) => {
  const session = await mongoose.startSession();
  const abortTx = async () => {
    try {
      await session.abortTransaction();
    } catch (_) {}
  };

  try {
    session.startTransaction();

    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) {
      await abortTx();
      return res.status(400).send({ ok: false, mensaje: "id inválido" });
    }

    const userId = req.user?._id || null;

    const prev: any = await PunchHistory.findById(id).session(session).lean();
    if (!prev) {
      await abortTx();
      return res
        .status(404)
        .send({ ok: false, mensaje: "Ponche no encontrado" });
    }

    if (prev.isDeleted === true) {
      await abortTx();
      return res.status(200).send({
        ok: true,
        mensaje: "El ponche ya estaba eliminado",
        punchHistory: prev,
      });
    }

    const now = new Date();

    const changes: Array<{ field: string; from: any; to: any }> = [
      { field: "isDeleted", from: prev.isDeleted ?? false, to: true },
      { field: "isActive", from: prev.isActive ?? true, to: false },
      { field: "deletedAt", from: prev.deletedAt ?? null, to: now },
      { field: "deletedBy", from: prev.deletedBy ?? null, to: userId },
    ];

    const updateDoc: any = {
      $set: {
        isDeleted: true,
        isActive: false,
        deletedAt: now,
        deletedBy: userId,
        updatedAt: now,
        updatedBy: userId,
      },
      $push: {
        audit: {
          at: now,
          by: userId,
          ip: req.ip,
          action: "delete",
          changes,
        },
      },
    };

    const punchHistory: any = await PunchHistory.findByIdAndUpdate(
      id,
      updateDoc,
      {
        new: true,
        session,
      },
    );

    // ✅ Recalcular WorkSummary
    let updatedWS: any = null;
    if (prev.workSummary) {
      updatedWS = await recalcWorkSummaryDay({
        workSummaryId: prev.workSummary,
        session,
      });
    } else {
      // fallback (por si acaso): buscar WS por user + date
      const ymd = getYMD(prev.date);
      const wsFallback = await WorkSummary.findOne({
        user: prev.user,
        dateString: ymd,
        isDeleted: false,
      })
        .select("_id")
        .session(session)
        .lean();

      if (wsFallback?._id) {
        updatedWS = await recalcWorkSummaryDay({
          workSummaryId: wsFallback._id,
          session,
        });
      }
    }

    await session.commitTransaction();

    return res.status(200).send({
      ok: true,
      punchHistory,
      workSummary: updatedWS,
      mensaje: "Ponche eliminado correctamente",
      message: "Punch deleted successfully",
    });
  } catch (error) {
    console.log(error);
    try {
      await session.abortTransaction();
    } catch (_) {}

    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
      error,
    });
  } finally {
    session.endSession();
  }
};

//

export const uploadPunchImage = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send({ ok: false, mensaje: "punchId inválido" });
    }

    const userId = req.user?._id || null;

    const prev = await PunchHistory.findById(id).lean();
    if (!prev || (prev as any).isDeleted === true) {
      return res
        .status(404)
        .send({ ok: false, mensaje: "Ponche no encontrado" });
    }

    const now = new Date();
    let url = null;

    if (req.uploaded) {
      url = req.uploaded.images[0];
    }

    const changes = [
      { field: "img", from: (prev as any).img ?? null, to: String(url) },
    ];

    const updateDoc: any = {
      $set: {
        img: String(url),
        updatedBy: userId,
        updatedAt: now,
      },
      $push: {
        audit: {
          at: now,
          by: userId,
          ip: req.ip,
          action: "upload_image",
          changes,
        },
      },
    };

    const punchHistory = await PunchHistory.findByIdAndUpdate(id, updateDoc, {
      new: true,
    });

    return res.status(200).send({
      ok: true,
      mensaje: "Imagen subida correctamente",
      message: "Image uploaded successfully",
      url: String(url),
      punchHistory,
    });
  } catch (error) {
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
      error,
    });
  }
};

export const getPunchOfDay = async (req: Request, res: Response) => {
  const { id } = req.params;
  const today = moment().format("YYYY-MM-DD");

  try {
    const ponches = await PunchHistory.find({
      user: id,
      date: today,
    }).sort({ timestamp: 1 });

    return res.status(200).json({
      date: today,
      count: ponches.length,
      ponches,
    });
  } catch (error) {
    console.error("Error al obtener los ponches:", error);
    return res
      .status(500)
      .json({ error: "Error al consultar los ponches del día." });
  }
};

export const getPunchHistory = async (req: Request, res: Response) => {
  try {
    const punch = await PunchHistory.find()
      .populate("user")
      .populate("punchType")
      .sort({ createdAt: -1 });

    return res.status(201).send({
      ok: true,
      mensaje: "Ponche obtenido exitosamente",
      message: "Ponche obtenido exitosamente",
      punch,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

export const getMyPunchHistory = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user._id;

    const punch = await PunchHistory.find({ user })
      .populate("user")
      .populate("punchType")
      .sort({ createdAt: -1 });

    return res.status(201).send({
      ok: true,
      mensaje: "Ponche obtenido exitosamente",
      message: "Ponche obtenido exitosamente",
      punch,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

export const cerrarPonchesIncompletosDelDia = async (req: AuthRequest, res: Response) => {
  // Obtener la fecha y hora actual
  try {
    const now = moment();
    const fecha = now.format("YYYY-MM-DD");
    const horaCierre = now.format("HH:mm");

    console.log(now, "now");
    // Obtener el nombre del día de la semana en formato sin acentos y en minúscula (ej: "lunes")
    const diaSemana = moment(fecha)
      .format("dddd")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();

    // Buscar los roles que nos interesan para evaluar ponches
    const roles = await Roles.find({
      code: { $in: ["EMPLOYEE"] },
    });

    const roleIds = roles.map((r) => r._id);

    // Buscar todos los usuarios activos que tengan uno de los roles seleccionados
    const users = await User.find({
      isDeleted: false,
      rol: { $in: roleIds },
    }).lean();

    // Iterar sobre cada usuario
    for (const user of users) {
      if (!user.punchTypeId) continue; // Saltar si el usuario no tiene tipo de ponche asignado

      const punchType = await PunchType.findById(user.punchTypeId).lean();

      // Obtener los pasos de ponche esperados para ese usuario según su tipo de ponche
      const expectedSteps: string[] = punchType?.expectedPunches || [];

      // Buscar todos los ponches del día para ese usuario, ordenados cronológicamente
      const punches = await PunchHistory.find({
        user: user._id,
        date: fecha,
      }).sort({ timestamp: 1 });

      if (punches.length > 0) {
        // Obtener los pasos de ponche que el usuario sí realizó
        const stepsHechos = punches.map((p) => p.punchStep.toString());

        // Determinar qué pasos faltan comparando contra los esperados
        const missingSteps: string[] = expectedSteps.filter(
          (s: string) => !stepsHechos.includes(s),
        );

        // --- CASO 1: Tipo de ponche es "solo entrada" (entry-only) ---
        if (expectedSteps.length === 1 && expectedSteps[0] === "entrada") {
          const entrada = punches.find(
            (p) => p.punchStep.toString() === "entrada",
          );

          if (!entrada) continue;

          // Calcular los minutos desde la entrada hasta la hora actual (cierre automático)
          const entradaMoment = moment.utc(entrada.timestamp);
          const nowMoment = moment.utc();
          const minutos = nowMoment.diff(entradaMoment, "minutes");

          // Actualizar o crear un resumen de trabajo para ese día, marcando como cerrado automáticamente
          await WorkSummary.findOneAndUpdate(
            { user: user._id, dateString: fecha, wasAutoClosed: false },
            {
              $set: {
                user: user._id,
                date: fecha,
                totalMinutes: minutos,
                isIncomplete: false,
                punchSteps: ["entrada"],
                wasAutoClosed: true,
                autoClosedReason: "entry-only hasta cierre automático",
                realEntryTime: entradaMoment.format("HH:mm"),
                realExitTime: horaCierre,
              },
            },
            { new: true },
          );

          console.log(
            `✅ [${user._id}] Entrada única cerrada automáticamente con ${minutos} min.`,
          );

          continue; // Ir al siguiente usuario
        }

        // --- CASO 2: Faltan pasos esperados (entrada/salida/almuerzo...) ---
        if (missingSteps.length > 0) {
          const entrada = punches.find((p) => p.punchStep === "entrada");

          if (!entrada) continue;

          const dia = user.schedule?.[diaSemana]; // Obtener horario del usuario para ese día

          if (!dia || !dia.exitTime) continue; // Si no tiene hora de salida definida, omitir

          // Calcular minutos trabajados entre la entrada y la hora de salida programada
          const salidaProgramada = moment(`${fecha} ${dia.exitTime}`);
          const entradaMoment = moment(entrada.timestamp);

          if (entradaMoment.isAfter(salidaProgramada)) {
            console.log(
              `⛔ [${user._id}] Entrada posterior a salida programada. Saltando.`,
            );
            continue;
          }
          const minutos = salidaProgramada.diff(entradaMoment, "minutes");

          // Guardar resumen del día como jornada incompleta cerrada automáticamente
          await WorkSummary.findOneAndUpdate(
            { user: user._id, dateString: fecha, wasAutoClosed: false },
            {
              user: user._id,
              date: fecha,
              totalMinutes: minutos,
              isIncomplete: true,
              punchSteps: stepsHechos,
              missingSteps,
              wasAutoClosed: true,
              autoClosedReason: "Faltaron pasos esperados",
              scheduledExitTime: dia.exitTime,
              realEntryTime: moment(entrada.timestamp).format("HH:mm"),
              realExitTime: dia.exitTime,
            },
            { new: true },
          );

          console.log(
            `⚠️  [${
              user._id
            }] Jornada incompleta cerrada automáticamente con ${minutos} min. Faltaron: ${missingSteps.join(
              ", ",
            )}`,
          );
        }
      }
    }
    return res.status(201).send({
      ok: true,
      mensaje: "Todo bien exitosamente",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

export const getPunchHistoryByDate = async (req: Request, res: Response) => {
  try {
    const { date, user } = req.query as any;

    if (!date || !user) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "date y user son requeridos" });
    }

    const punches = await PunchHistory.find({
      user,
      date,
      isDeleted: false,
    })
      .populate({ path: "audit.by", select: "name email" })
      .populate({ path: "updatedBy", select: "name email" })
      .populate({ path: "user", select: "name email schedule" })
      .lean();

    const ws = await WorkSummary.findOne({
      user,
      dateString: date,
      isDeleted: false,
    })
      .populate({ path: "audit.by", select: "name email" })
      .lean();

    return res.status(200).json({
      ok: true,
      punch: punches, // 👈 mantiene tu contrato actual
      workSummary: ws, // 👈 nuevo para UI
    });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: "Error", error: e });
  }
};

export const getMyPunchHistoryByDate = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user._id;
    const { date } = req.query;

    const filter: any = { user, isDeleted: false };

    if (date) {
      const start = moment(date as string)
        .startOf("day")
        .toDate();
      const end = moment(date as string)
        .endOf("day")
        .toDate();

      filter.createdAt = { $gte: start, $lte: end };
    }

    const punch = await PunchHistory.find(filter)
      .populate("user")
      .populate("punchType")
      .sort({ createdAt: 1 });

    return res.status(201).send({
      ok: true,
      mensaje: "Ponche obtenido exitosamente",
      message: "Ponche obtenido exitosamente",
      punch,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

export const getPunchHistoryByDateGrouped = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      date,
      userId,
      skip = 0,
      limit = 100,
    } = req.query as {
      date?: string;
      userId?: string;
      skip?: string;
      limit?: string;
    };

    // 1) Filtro por fecha
    const match: any = { isDeleted: false };
    if (date) {
      // Preferimos tu campo "date" (YYYY-MM-DD) grabado en PunchHistory
      match.date = date;
    } else {
      // Fallback por createdAt (día actual del servidor si no llega 'date')
      const start = moment().startOf("day").toDate();
      const end = moment().endOf("day").toDate();
      match.createdAt = { $gte: start, $lte: end };
    }

    // 2) Filtro opcional por usuario
    if (userId) {
      match.user = new Types.ObjectId(userId);
    }

    const pipeline: any[] = [
      { $match: match },
      // ordenamos antes de agrupar para que $push conserve asc por timestamp
      { $sort: { timestamp: 1, createdAt: 1 } },
      // join user
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      // join punchType
      {
        $lookup: {
          from: "punchtypes",
          localField: "punchType",
          foreignField: "_id",
          as: "punchType",
        },
      },
      { $unwind: { path: "$punchType", preserveNullAndEmptyArrays: true } },

      // agrupamos por usuario
      {
        $group: {
          _id: "$user._id",
          user: { $first: "$user" },
          total: { $sum: 1 },
          lateCount: {
            $sum: {
              $cond: [{ $eq: ["$isLate", true] }, 1, 0],
            },
          },
          punches: {
            $push: {
              _id: "$_id",
              timestamp: "$timestamp",
              date: "$date",
              punchStep: "$punchStep",
              expectedTime: "$expectedTime",
              isLate: "$isLate",
              img: "$img",
              punchType: {
                _id: "$punchType._id",
                name: "$punchType.name",
              },
            },
          },
        },
      },

      // proyección limpia
      {
        $project: {
          _id: 0,
          user: {
            _id: "$user._id",
            name: "$user.name",
            email: "$user.email",
            code_punch: "$user.code_punch",
            img: "$user.img",
          },
          stats: {
            total: "$total",
            lateCount: "$lateCount",
          },
          punches: 1,
        },
      },

      // ordenar por nombre (si no lo tienes, por _id)
      { $sort: { "user.name": 1 } },

      // paginar usuarios
      { $skip: Number(skip) },
      { $limit: Number(limit) },
    ];

    const users = await PunchHistory.aggregate(pipeline);

    return res.status(200).send({
      ok: true,
      mensaje: "Ponches agrupados por usuario",
      date: date || moment().format("YYYY-MM-DD"),
      count: users.length,
      users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

export const sendLateWarning = async (req: Request, res: Response) => {
  try {
    const { userId, fechaInicio, fechaFin } = req.body;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        mensaje: "userId es requerido.",
      });
    }

    const user = await User.findById(userId).lean();
    if (!user || !user.email) {
      return res.status(404).json({
        ok: false,
        mensaje: "Empleado no encontrado o sin correo configurado.",
      });
    }

    // ----- RANGO DE FECHAS -----
    // Si no vienen, asumimos el día de hoy
    const startDate = fechaInicio || moment().format("YYYY-MM-DD");
    const endDate = fechaFin || moment().format("YYYY-MM-DD");

    const rangoTexto =
      startDate === endDate
        ? `el día ${startDate}`
        : `del ${startDate} al ${endDate}`;

    // ----- WORKSUMMARY DEL RANGO -----
    const summaryQuery: any = {
      user: userId,
      dateString: { $gte: startDate, $lte: endDate },
    };

    const summaries = await WorkSummary.find(summaryQuery).select(
      "_id date dateString",
    );

    if (!summaries.length) {
      return res.status(200).json({
        ok: false,
        mensaje: "No hay registros de trabajo en el rango indicado.",
      });
    }

    const workSummaryIds = summaries.map((s) => s._id);

    // ----- PUNCHES TARDÍOS DE ESE RANGO -----
    const latePunches = await PunchHistory.find({
      user: userId,
      workSummary: { $in: workSummaryIds },
      isLate: true,
    })
      .sort({ date: 1, timestamp: 1 })
      .lean();

    if (!latePunches.length) {
      return res.status(200).json({
        ok: false,
        mensaje: "No hay tardanzas registradas en el rango indicado.",
      });
    }

    // ----- CALCULAR DETALLE POR PONCHE -----
    type LateDayRow = {
      dateString: string;
      expectedTime: string;
      arrivalTime: string;
      lateMinutes: number;
    };

    const lateRows: LateDayRow[] = [];
    let totalLateMinutes = 0;

    for (const p of latePunches as any[]) {
      if (!p.expectedTime || !p.date) continue;

      const dateString = p.date; // asumes "YYYY-MM-DD" en PunchHistory.date
      const expectedTime = p.expectedTime as string; // "HH:mm"
      const expectedMoment = moment(
        `${dateString} ${expectedTime}`,
        "YYYY-MM-DD HH:mm",
      );

      const punchMoment = moment(p.timestamp);
      let diffMinutes = punchMoment.diff(expectedMoment, "minutes");
      if (diffMinutes < 0) diffMinutes = 0; // por seguridad

      totalLateMinutes += diffMinutes;

      const row: LateDayRow = {
        dateString,
        expectedTime,
        arrivalTime: punchMoment.format("HH:mm"),
        lateMinutes: diffMinutes,
      };

      lateRows.push(row);
    }

    if (!lateRows.length) {
      return res.status(200).json({
        ok: false,
        mensaje: "No se encontraron tardanzas con horas esperadas definidas.",
      });
    }

    const totalHours = Math.floor(totalLateMinutes / 60);
    const totalMinutesRest = totalLateMinutes % 60;

    // ----- ARMAR HTML DEL CORREO (ESTILO IGUAL AL EJEMPLO) -----

    const BRAND = "#0361A6";
    const INK = "#0e2741";
    const SOFT_BG = "#f6f8fb";
    const subject = "Amonestación por tardanzas acumuladas";

    // Tabla de días con tardanza
    const rowsHtml = lateRows
      .map(
        (r) => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:13px;">
            ${r.dateString}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:13px;">
            ${r.expectedTime}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:13px;">
            ${r.arrivalTime}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:13px;">
            ${r.lateMinutes} min
          </td>
        </tr>
      `,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${subject}</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;background:${SOFT_BG};margin:0;padding:20px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;
    box-shadow:0 6px 18px rgba(0,0,0,0.10);">
    
    <!-- Header -->
    <tr>
      <td style="background:${INK};padding:16px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td align="left" style="color:#ffffff;font-weight:700;font-size:15px;">
              Blue Technology Solution
            </td>
            <td align="right" style="color:#ffffff;font-weight:600;font-size:13px;">
              Tardanzas registradas
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:20px 20px 16px 20px;color:#334155;">
        <p style="margin:0 0 10px 0;">Hola ${user.name || ""},</p>

        <p style="margin:0 0 10px 0;line-height:1.6;">
          Se ha detectado un acumulado de 
          <strong>${totalHours}h ${totalMinutesRest}m</strong> de tardanza ${rangoTexto}.
        </p>

        <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;line-height:1.6;">
          A continuación se detalla cada día en el que se registró una llegada tardía
          según el horario configurado:
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="border-collapse:collapse;margin-top:8px;margin-bottom:8px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:left;">
                Fecha
              </th>
              <th style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:left;">
                Hora esperada
              </th>
              <th style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:left;">
                Hora de llegada
              </th>
              <th style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:left;">
                Tardanza
              </th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <p style="margin:10px 0 0 0;font-size:13px;color:#64748b;line-height:1.6;">
          Te recordamos la importancia de cumplir con los horarios establecidos por la empresa.
          En caso de tener alguna situación particular, por favor comunícala a tu supervisor inmediato.
        </p>

   
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#f8fafc;color:#94a3b8;padding:10px 20px;font-size:11px;text-align:center;">
        © ${new Date().getFullYear()} Blue Technology Solution. Todos los derechos reservados.
      </td>
    </tr>
  </table>
</body>
</html>`;

    const enviado = await sendEmail({
      to: user.email,
      subject,
      html,
      fromName: "Control de asistencia",
    });

    if (!enviado) {
      return res.status(500).json({
        ok: false,
        mensaje: "No se pudo enviar el correo de amonestación.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Amonestación enviada correctamente.",
      totalLateMinutes,
      detalles: lateRows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno al enviar la amonestación.",
    });
  }
};

export const addSpecialDays = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      dates, // ["2025-11-01", ...]
      classification,
      minutes, // minutos por día (frontend)
      fechaInicio,
      fechaFin,
    } = req.body;

    // -------- VALIDACIONES BÁSICAS ----------
    if (!userId) {
      return res.status(400).json({
        ok: false,
        mensaje: "El userId es requerido.",
        message: "userId is required.",
      });
    }

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debe enviar al menos un día.",
        message: "At least one date is required.",
      });
    }

    if (!classification || typeof classification !== "string") {
      return res.status(400).json({
        ok: false,
        mensaje: "La clasificación del día es requerida.",
        message: "Classification is required.",
      });
    }

    const minutesNumber = Number(minutes);
    if (!Number.isFinite(minutesNumber) || minutesNumber < 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "La cantidad de minutos debe ser 0 o mayor.",
        message: "Minutes must be 0 or greater.",
      });
    }

    // -------- VALIDAR QUE EL USUARIO EXISTA ----------
    const user: any = await User.findById(userId)
      .select("_id name isActive isActived isDeleted schedule punchTypeId")
      .populate({ path: "punchTypeId", model: "PunchType" })
      .lean();

    const inactive =
      !user ||
      user.isDeleted ||
      user.isActive === false ||
      user.isActived === false;

    if (inactive) {
      return res.status(404).json({
        ok: false,
        mensaje: "Empleado no encontrado o inactivo.",
        message: "Employee not found or inactive.",
      });
    }

    // -------- NORMALIZAR FECHAS A 'YYYY-MM-DD' ----------
    const normalizedDates = dates
      .map((d: string) =>
        moment(d, ["YYYY-MM-DD", "YYYY/MM/DD"], true).isValid()
          ? moment(d).format("YYYY-MM-DD")
          : null,
      )
      .filter(Boolean) as string[];

    if (!normalizedDates.length) {
      return res.status(400).json({
        ok: false,
        mensaje: "Las fechas enviadas no son válidas.",
        message: "Provided dates are not valid.",
      });
    }

    // -------- BUSCAR WORKSUMMARY EXISTENTES EN ESAS FECHAS ----------
    const existingSummaries = await WorkSummary.find({
      user: userId,
      dateString: { $in: normalizedDates },
    })
      .select("dateString")
      .lean();

    const occupiedDates = new Set(
      existingSummaries.map((ws: any) => ws.dateString),
    );
    const freeDates = normalizedDates.filter((d) => !occupiedDates.has(d));
    if (freeDates.length === 0) {
      return res.status(409).json({
        ok: false,
        code: "DATES_ALREADY_HAVE_RECORDS",
        created: 0,
        daysCreated: [],
        mensaje:
          "No se encontraron días libres (ya existen registros para todas esas fechas).",
        message:
          "There are no free days in the given range (all dates already have records).",
      });
    }

    const ignoredInactiveDates: string[] = [];

    // -------- PREPARAR DOCS PARA INSERTAR ----------
    const docsToInsert = freeDates
      .map((d) => {
        // minutos esperados según horario real del empleado
        const expected = calcExpectedMinutesForDate(
          user.schedule,
          user.punchTypeId,
          d,
        );
        const expectedMinutes = Number(expected?.expectedMinutes || 0);
        const isActiveDay = !!expected?.isActive;

        // Si el día no es laborable según el horario, lo ignoramos
        if (!isActiveDay) {
          ignoredInactiveDates.push(d);
          return null;
        }

        // ✅ REGLA PRINCIPAL:
        // totalMinutes = EXACTAMENTE lo que manda el frontend
        // (si manda 0 => guarda 0 y se descuenta todo lo esperado)
        let totalMinutes = minutesNumber;

        // Opcional recomendado: evitar pagar más de lo esperado (cap)
        if (expectedMinutes > 0) {
          totalMinutes = Math.min(totalMinutes, expectedMinutes);
        }

        const notWorkedMinutes =
          expectedMinutes > 0 ? Math.max(expectedMinutes - totalMinutes, 0) : 0;

        const payImpact = notWorkedMinutes > 0 ? "DEDUCT" : "NONE";

        return {
          user: userId,
          date: moment(d, "YYYY-MM-DD").toDate(),
          dateString: d,

          totalMinutes,
          expectedMinutes,
          notWorkedMinutes,
          payImpact,

          isIncomplete: false,
          punchSteps: [],
          missingSteps: [],
          wasAutoClosed: true,
          autoClosedReason: `Día especial: ${classification}`,
          classification,
        };
      })
      .filter(Boolean);

    if (!docsToInsert.length) {
      return res.status(200).json({
        ok: true,
        created: 0,
        daysCreated: [],
        ignoredInactiveDates,
        mensaje:
          "No se crearon días porque todas las fechas caen en días inactivos/no laborables según el horario.",
        message:
          "No days created because all dates are inactive/non-working days per schedule.",
      });
    }

    const created = await WorkSummary.insertMany(docsToInsert);

    return res.status(200).json({
      ok: true,
      created: created.length,
      daysCreated: created.map((c: any) => c.dateString),
      ignoredInactiveDates,
      mensaje: "Días especiales guardados correctamente.",
      message: "Special days saved successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal al registrar los días especiales.",
      message: "Ups! Something went wrong while saving special days.",
    });
  }
};

export const getWorkSummaryDoc = async (req: any, res: Response) => {
  try {
    const { workSummaryId } = req.query as any;

    if (!workSummaryId || !Types.ObjectId.isValid(workSummaryId)) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "workSummaryId inválido" });
    }

    const data = await WorkSummaryDocumentation.findOne({
      workSummary: workSummaryId,
      isDeleted: false,
    }).lean();

    return res.status(200).send({
      ok: true,
      mensaje: "Documentación obtenida",
      message: "Documentation fetched",
      data: data || null,
    });
  } catch (error) {
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
      error,
    });
  }
};

export const upsertWorkSummaryDoc = async (req: any, res: Response) => {
  try {
    const { workSummaryId, note } = req.body;

    if (!workSummaryId || !Types.ObjectId.isValid(workSummaryId)) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "workSummaryId inválido" });
    }

    const userId = req.user?._id;

    // Validar que WorkSummary exista y pertenezca al system
    const ws = await WorkSummary.findOne({
      _id: workSummaryId,
    })
      .select("_id")
      .lean();
    if (!ws) {
      return res
        .status(404)
        .send({ ok: false, mensaje: "WorkSummary no encontrado" });
    }

    // Archivos (separados)
    // Con multer.fields([{name:'images'},{name:'documents'}]) => req.files.images / req.files.documents

    const imagesUploaded = req?.uploaded?.images || [];
    const docsUploaded = req?.uploaded?.files || [];

    const update: any = {
      $set: {
        note: typeof note === "string" ? note : "",
        updatedBy: userId,
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
      },
    };

    // Solo push si llegaron archivos
    if (imagesUploaded.length || docsUploaded.length) {
      update.$push = {};
      if (imagesUploaded.length)
        update.$push.images = { $each: imagesUploaded };
      if (docsUploaded.length) update.$push.documents = { $each: docsUploaded };
    }

    const doc = await WorkSummaryDocumentation.findOneAndUpdate(
      { workSummary: workSummaryId },
      {
        $setOnInsert: {
          workSummary: workSummaryId,
          createdBy: userId,
        },
        ...update,
      },
      { new: true, upsert: true },
    );

    return res.status(200).send({
      ok: true,
      mensaje: "Documentación guardada correctamente",
      message: "Documentation saved successfully",
      data: doc,
    });
  } catch (error: any) {
    // si choca índice único por carrera: reintentar 1 vez (opcional)
    console.log(error);
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
      error,
    });
  }
};

export const removeWorkSummaryDocFile = async (req: any, res: Response) => {
  try {
    const { workSummaryId, kind, url } = req.query as any;

    if (!workSummaryId || !Types.ObjectId.isValid(workSummaryId)) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "workSummaryId inválido" });
    }
    if (kind !== "image" && kind !== "document") {
      return res
        .status(400)
        .send({ ok: false, mensaje: "kind inválido (image|document)" });
    }
    if (!url || typeof url !== "string") {
      return res.status(400).send({ ok: false, mensaje: "url requerida" });
    }

    const userId = req.user?._id || null;
    const now = new Date();

    const pull = kind === "image" ? { images: url } : { documents: url };

    const doc = await WorkSummaryDocumentation.findOneAndUpdate(
      { workSummary: workSummaryId, isDeleted: false },
      {
        $pull: pull,
        $set: { updatedBy: userId, updatedAt: now },
      },
      { new: true },
    );

    return res.status(200).send({
      ok: true,
      mensaje: "Archivo eliminado",
      message: "File removed",
      data: doc || null,
    });
  } catch (error) {
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
      error,
    });
  }
};

export const updateWorkSummaryClassification = async (
  req: any,
  res: Response,
) => {
  try {
    const { workSummaryId, classification } = req.body;

    if (!workSummaryId || !Types.ObjectId.isValid(workSummaryId)) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "workSummaryId inválido" });
    }

    const next: any = String(classification || "").trim();

    // Si permites vacío (reset), cambia esta lógica.
    if (!next) {
      return res.status(400).send({
        ok: false,
        mensaje: "classification es requerida",
        message: "classification is required",
      });
    }

    // Validación contra lista
    if (!dayTypeOptions.includes(next)) {
      return res.status(400).send({
        ok: false,
        mensaje: "classification no es válida",
        message: "Invalid classification",
      });
    }

    const userId = req.user?._id || null;

    // Importante: filtrar por system si WorkSummary tiene system
    const query: any = { _id: workSummaryId };

    const prev = await WorkSummary.findOne(query).lean();
    if (!prev) {
      return res.status(404).send({
        ok: false,
        mensaje: "WorkSummary no encontrado",
        message: "WorkSummary not found",
      });
    }

    // Si tienes soft delete en WorkSummary, valida aquí:
    if ((prev as any).isDeleted === true) {
      return res.status(404).send({
        ok: false,
        mensaje: "WorkSummary no encontrado",
        message: "WorkSummary not found",
      });
    }

    const now = new Date();

    // Update (sin audit para no chocar si tu schema no tiene audit)
    const workSummary = await WorkSummary.findOneAndUpdate(
      query,
      {
        $set: {
          classification: next,
          updatedAt: now,
          updatedBy: userId,
        },
      },
      { new: true },
    );

    return res.status(200).send({
      ok: true,
      mensaje: "Clasificación actualizada correctamente",
      message: "Classification updated successfully",
      workSummary,
    });
  } catch (error) {
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
      error,
    });
  }
};

export const getExpectedMinutesForDates = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId, dates } = req.body;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        mensaje: "El userId es requerido.",
        message: "userId is required.",
      });
    }

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debe enviar al menos un día.",
        message: "At least one date is required.",
      });
    }

    const user: any = await User.findById(userId)
      .select("_id name isActive isActived isDeleted schedule punchTypeId")
      .populate({ path: "punchTypeId", model: "PunchType" })
      .lean();

    const inactive =
      !user ||
      user.isDeleted ||
      user.isActive === false ||
      user.isActived === false;

    if (inactive) {
      return res.status(404).json({
        ok: false,
        mensaje: "Empleado no encontrado o inactivo.",
        message: "Employee not found or inactive.",
      });
    }

    const normalizedDates = dates
      .map((d: string) => {
        const m = moment(d, ["YYYY-MM-DD", "YYYY/MM/DD"], true);
        return m.isValid() ? m.format("YYYY-MM-DD") : null;
      })
      .filter(Boolean) as string[];

    const expectedByDate: Record<
      string,
      { expectedMinutes: number; isActive: boolean }
    > = {};

    for (const d of normalizedDates) {
      const expected = calcExpectedMinutesForDate(
        user.schedule,
        user.punchTypeId,
        d,
      );
      expectedByDate[d] = {
        expectedMinutes: Number(expected?.expectedMinutes || 0),
        isActive: !!expected?.isActive,
      };
    }

    return res.status(200).json({
      ok: true,
      expectedByDate,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error calculando minutos esperados.",
      message: "Error calculating expected minutes.",
    });
  }
};

export const updateWorkSummaryDayConfig = async (req: any, res: Response) => {
  try {
    const { workSummaryId, classification, totalMinutes } = req.body;

    if (!workSummaryId) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "workSummaryId es requerido" });
    }

    const ws: any = await WorkSummary.findById(workSummaryId);
    if (!ws) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "WorkSummary no encontrado" });
    }

    const changes: any[] = [];

    // 1) clasificación
    if (typeof classification === "string" && classification.trim()) {
      const nextCls = classification.trim();
      if (nextCls !== ws.classification) {
        changes.push({
          field: "classification",
          from: ws.classification,
          to: nextCls,
        });
        ws.classification = nextCls;
      }
    }

    const finalCls = ws.classification;

    // 2) Solo permitir editar minutos si NO es "Trabajo regular"
    const canEditMinutes = finalCls && finalCls !== "Trabajo regular";

    if (totalMinutes !== undefined && totalMinutes !== null) {
      const nextMin = Number(totalMinutes);

      if (!Number.isFinite(nextMin) || nextMin < 0) {
        return res
          .status(400)
          .json({ ok: false, mensaje: "totalMinutes inválido" });
      }

      if (!canEditMinutes) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "Solo se pueden editar horas si la clasificación no es Trabajo regular.",
        });
      }

      // expectedMinutes: si no está, intenta calcularlo desde user schedule (opcional)
      let expected = Number(ws.expectedMinutes || 0);

      if (!expected || expected <= 0) {
        const u: any = await User.findById(ws.user)
          .select("schedule punchTypeId")
          .populate({ path: "punchTypeId", model: "PunchType" })
          .lean();

        // si tienes calcExpectedMinutesForDate en backend:
        if (u?.schedule && u?.punchTypeId && ws.dateString) {
          const exp = calcExpectedMinutesForDate(
            u.schedule,
            u.punchTypeId,
            ws.dateString,
          );
          expected = Number(exp?.expectedMinutes || 0);
        }
      }

      if (expected > 0 && nextMin > expected) {
        // opcional: cap al esperado
        // si tú quieres permitir más, quita este if
        // return res.status(400).json({ ok:false, mensaje:"No puede exceder expectedMinutes" })
      }

      if (nextMin !== ws.totalMinutes) {
        changes.push({
          field: "totalMinutes",
          from: ws.totalMinutes,
          to: nextMin,
        });
        ws.totalMinutes = nextMin;
      }

      if (expected > 0 && expected !== ws.expectedMinutes) {
        changes.push({
          field: "expectedMinutes",
          from: ws.expectedMinutes,
          to: expected,
        });
        ws.expectedMinutes = expected;
      }

      const notWorked =
        expected > 0 ? Math.max(expected - ws.totalMinutes, 0) : 0;
      if (notWorked !== ws.notWorkedMinutes) {
        changes.push({
          field: "notWorkedMinutes",
          from: ws.notWorkedMinutes,
          to: notWorked,
        });
        ws.notWorkedMinutes = notWorked;
      }

      let nextImpact: "NONE" | "DEDUCT" | "PAID_LEAVE" = "NONE";
      if (finalCls !== "Trabajo regular") {
        nextImpact = ws.notWorkedMinutes > 0 ? "DEDUCT" : "PAID_LEAVE";
        if (finalCls === "Ausencia sin justificación") nextImpact = "DEDUCT";
      }

      if (nextImpact !== ws.payImpact) {
        changes.push({
          field: "payImpact",
          from: ws.payImpact,
          to: nextImpact,
        });
        ws.payImpact = nextImpact;
      }
    }

    if (!changes.length) {
      return res
        .status(200)
        .json({ ok: true, mensaje: "Sin cambios", workSummary: ws });
    }

    // 3) auditoría
    ws.updatedBy = req.user?._id || null;
    ws.audit = ws.audit || [];
    ws.audit.push({
      at: new Date(),
      by: req.user?._id || null,
      ip: getClientIp(req),
      changes,
    });

    await ws.save();

    // opcional: populate de audit.by para UI
    const populated = await WorkSummary.findById(ws._id)
      .populate({ path: "audit.by", select: "name email" })
      .lean();

    return res.status(200).json({
      ok: true,
      mensaje: "WorkSummary actualizado",
      workSummary: populated || ws,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error actualizando WorkSummary", error });
  }
};

export const updateWorkSummaryPayrollControl = async (
  req: any,
  res: Response,
) => {
  try {
    const {
      workSummaryId,
      discountOverride, // "AUTO" | "FORCE_NO_DEDUCT" | "FORCE_DEDUCT"
      overrideReason,
      approvedMinutes, // number
      approvedReason,
    } = req.body;

    if (!workSummaryId) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "workSummaryId es requerido" });
    }

    const ws: any = await WorkSummary.findById(workSummaryId);
    if (!ws || ws.isDeleted) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "WorkSummary no encontrado" });
    }

    const changes: any[] = [];

    // 1) override
    const nextOverride = (
      discountOverride ||
      ws.discountOverride ||
      "AUTO"
    ).toString();
    const allowed = ["AUTO", "FORCE_NO_DEDUCT", "FORCE_DEDUCT"];
    if (!allowed.includes(nextOverride)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "discountOverride inválido" });
    }

    if (nextOverride !== ws.discountOverride) {
      changes.push({
        field: "discountOverride",
        from: ws.discountOverride,
        to: nextOverride,
      });
      ws.discountOverride = nextOverride;
    }

    // overrideReason solo si NO es AUTO
    const nextOverrideReason = (overrideReason || "").toString().trim();
    if (ws.discountOverride !== "AUTO" && !nextOverrideReason) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "Debe indicar un motivo si seleccionas No descontar / Forzar descuento.",
      });
    }

    if (nextOverrideReason !== (ws.overrideReason || "")) {
      changes.push({
        field: "overrideReason",
        from: ws.overrideReason || "",
        to: nextOverrideReason,
      });
      ws.overrideReason = nextOverrideReason;
    }

    // 2) approvedMinutes
    const nextApproved =
      approvedMinutes === undefined || approvedMinutes === null
        ? ws.approvedMinutes
        : toNum(approvedMinutes, 0);

    if (!Number.isFinite(nextApproved) || nextApproved < 0) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "approvedMinutes inválido" });
    }

    if (nextApproved !== ws.approvedMinutes) {
      changes.push({
        field: "approvedMinutes",
        from: ws.approvedMinutes,
        to: nextApproved,
      });
      ws.approvedMinutes = nextApproved;
    }

    const nextApprovedReason = (approvedReason || "").toString().trim();
    if (nextApproved > 0 && !nextApprovedReason) {
      return res.status(400).json({
        ok: false,
        mensaje: "Si apruebas minutos, debes indicar un motivo.",
      });
    }

    if (nextApprovedReason !== (ws.approvedReason || "")) {
      changes.push({
        field: "approvedReason",
        from: ws.approvedReason || "",
        to: nextApprovedReason,
      });
      ws.approvedReason = nextApprovedReason;
    }

    // 3) recomputar expected/notWorked/payImpact
    // expectedMinutes: si no está, lo calculamos desde horario
    let expected = toNum(ws.expectedMinutes, 0);

    if (!expected || expected <= 0) {
      const u: any = await User.findById(ws.user)
        .select("schedule punchTypeId")
        .populate({ path: "punchTypeId", model: "PunchType" })
        .lean();

      if (u?.schedule && u?.punchTypeId && ws.dateString) {
        const exp = calcExpectedMinutesForDate(
          u.schedule,
          u.punchTypeId,
          ws.dateString,
        );
        expected = toNum(exp?.expectedMinutes, 0);
      }
    }

    if (expected !== ws.expectedMinutes) {
      changes.push({
        field: "expectedMinutes",
        from: ws.expectedMinutes,
        to: expected,
      });
      ws.expectedMinutes = expected;
    }

    const worked = toNum(ws.totalMinutes, 0);
    const approved = toNum(ws.approvedMinutes, 0);

    let paid = worked;

    if (ws.discountOverride === "FORCE_NO_DEDUCT") {
      paid = expected; // FIJO: paga completo el día
      ws.overrideBy = req.user?._id || null;
      ws.overrideAt = new Date();
    } else if (ws.discountOverride === "FORCE_DEDUCT") {
      paid = worked; // ignora aprobados
      ws.overrideBy = req.user?._id || null;
      ws.overrideAt = new Date();
    } else {
      // AUTO
      paid = Math.min(expected, worked + approved);
      // si expected=0 (día inactivo), deja paid=worked
      if (!expected) paid = worked + approved;
      ws.overrideBy = null;
      ws.overrideAt = null;
    }

    const notWorked = expected > 0 ? Math.max(expected - paid, 0) : 0;

    if (notWorked !== ws.notWorkedMinutes) {
      changes.push({
        field: "notWorkedMinutes",
        from: ws.notWorkedMinutes,
        to: notWorked,
      });
      ws.notWorkedMinutes = notWorked;
    }

    // payImpact
    let impact: "NONE" | "DEDUCT" | "PAID_LEAVE" = "NONE";
    if (ws.discountOverride === "FORCE_NO_DEDUCT") {
      impact = "NONE";
    } else if (ws.notWorkedMinutes > 0) {
      impact = "DEDUCT";
    } else if ((ws.classification || "") !== "Trabajo regular") {
      impact = "PAID_LEAVE";
    } else {
      impact = "NONE";
    }

    if (impact !== ws.payImpact) {
      changes.push({ field: "payImpact", from: ws.payImpact, to: impact });
      ws.payImpact = impact;
    }

    if (!changes.length) {
      const populated0 = await WorkSummary.findById(ws._id)
        .populate({ path: "audit.by", select: "name email" })
        .populate({ path: "overrideBy", select: "name email" })
        .lean();

      return res.status(200).json({
        ok: true,
        mensaje: "Sin cambios",
        workSummary: populated0 || ws,
      });
    }

    ws.updatedBy = req.user?._id || null;
    ws.audit = ws.audit || [];
    ws.audit.push({
      at: new Date(),
      by: req.user?._id || null,
      ip: getClientIp(req),
      changes,
    });

    await ws.save();

    const populated = await WorkSummary.findById(ws._id)
      .populate({ path: "audit.by", select: "name email" })
      .populate({ path: "overrideBy", select: "name email" })
      .lean();

    return res.status(200).json({
      ok: true,
      mensaje: "Control de nómina del día actualizado",
      workSummary: populated || ws,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, mensaje: "Error", error });
  }
};

export const confirmDaysToPay = async (req: Request, res: Response) => {
  try {
    const {
      scopeMode = "EMPLOYEES",
      userIds = [],
      fechaInicio,
      fechaFin,
      companyId,
      departmentId,
      jobPositionId,
      projectId,
      paymentScheduleId,
      previewOnly = false,
    } = req.body as {
      scopeMode?: ConfirmScopeMode;
      userIds?: string[];
      fechaInicio?: string;
      fechaFin?: string;
      companyId?: string;
      departmentId?: string;
      jobPositionId?: string;
      projectId?: string;
      paymentScheduleId?: string;
      previewOnly?: boolean;
    };

    if (!fechaInicio) {
      return res.status(400).json({
        ok: false,
        mensaje: "La fechaInicio es requerida.",
      });
    }

    const from = normalizeDateKey(fechaInicio);
    const to = fechaFin ? normalizeDateKey(fechaFin) : from;

    if (!from || !to) {
      return res.status(400).json({
        ok: false,
        mensaje: "El rango de fechas no es válido. Usa formato YYYY-MM-DD.",
      });
    }

    if (!DATE_STRING_REGEX.test(from) || !DATE_STRING_REGEX.test(to)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El rango de fechas debe estar en formato YYYY-MM-DD.",
      });
    }

    if (moment(from).isAfter(moment(to))) {
      return res.status(400).json({
        ok: false,
        mensaje: "La fechaInicio no puede ser mayor que la fechaFin.",
      });
    }

    if (!validScopeModes.includes(scopeMode)) {
      return res.status(400).json({
        ok: false,
        mensaje: "scopeMode inválido.",
      });
    }

    let employeeObjectIds: Types.ObjectId[] = [];

    if (scopeMode === "EMPLOYEES") {
      employeeObjectIds = uniqueValidObjectIds(userIds);

      if (!employeeObjectIds.length) {
        return res.status(400).json({
          ok: false,
          mensaje: "Debes enviar al menos un empleado válido.",
        });
      }
    } else {
      const queryResp = buildEmployeeQueryFromScope({
        scopeMode,
        companyId,
        departmentId,
        jobPositionId,
        projectId,
        paymentScheduleId,
      });

      if (!queryResp.ok) {
        return res.status(400).json({
          ok: false,
          mensaje: queryResp.mensaje,
        });
      }

      const ids = await User.distinct("_id", queryResp.query);

      employeeObjectIds = ids.map((id: any) => new Types.ObjectId(String(id)));

      if (!employeeObjectIds.length) {
        return res.status(200).json({
          ok: true,
          mensaje: "No se encontraron empleados para el alcance seleccionado.",
          previewOnly,
          employeesCount: 0,
          matchedCount: 0,
          modifiedCount: 0,
          from,
          to,
          scopeMode,
        });
      }
    }

    const workSummaryQuery: any = {
      user: { $in: employeeObjectIds },
      dateString: {
        $gte: from,
        $lte: to,
      },
      isDeleted: { $ne: true },
    };

    const matchedCount = await WorkSummary.countDocuments(workSummaryQuery);

    if (previewOnly) {
      return res.status(200).json({
        ok: true,
        previewOnly: true,
        mensaje: "Vista previa calculada correctamente.",
        employeesCount: employeeObjectIds.length,
        matchedCount,
        modifiedCount: 0,
        from,
        to,
        scopeMode,
      });
    }

    const update: any = {
      confirmedToPay: true,
      confirmedToPayAt: new Date(),
    };

    /**
     * Si usas AuthRequest y tienes req.user:
     *
     * const authReq = req as any;
     * if (authReq.user?._id || authReq.user?.id) {
     *   update.confirmedToPayBy = authReq.user._id || authReq.user.id;
     * }
     */

    const result: any = await WorkSummary.updateMany(workSummaryQuery, {
      $set: update,
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Días marcados como listos para pago correctamente.",
      employeesCount: employeeObjectIds.length,
      matchedCount: result.matchedCount ?? result.n ?? matchedCount,
      modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
      from,
      to,
      scopeMode,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      mensaje: "Ups! Algo salió mal al confirmar los pagos.",
      error,
    });
  }
};

export { getPunchesToPayroll, obtenerResumenMensualEmpleado, getPunches };
