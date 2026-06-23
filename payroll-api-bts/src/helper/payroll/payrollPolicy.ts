import { Types } from "mongoose";
import { getMongoIdString } from "../objectIds";
import PayrollPolicy from "../../model/employee-payment-management/payrollPolicy";
import { round2, toNum } from "../parse";

export const DEFAULT_PAYROLL_POLICY_CONFIG = {
  lateGraceEnabled: true,
  lateGraceMinutes: 10,
  lateGraceMode: "FULL_GRACE",

  deductLateArrivals: true,
  deductAbsences: true,

  rdFactorDiasMes: 23.83,
  useGrossSalaryForDailyDiscount: true,

  requireConfirmedDaysDefault: true,
  allowIncompleteDaysOnClose: false,
  autoPaidLeaveNoDeduct: true,
};

export const getPayrollPolicyConfig = async ({
  companyId,
  session = null,
}: {
  companyId: any;
  session?: any;
}) => {
  const cleanCompanyId = getMongoIdString(companyId);

  if (!cleanCompanyId) {
    return {
      policy: null,
      config: DEFAULT_PAYROLL_POLICY_CONFIG,
    };
  }

  const policy = await PayrollPolicy.findOne({
    company: new Types.ObjectId(cleanCompanyId),
    isActive: true,
    isDeleted: false,
  })
    .session(session)
    .lean();

  if (!policy) {
    return {
      policy: null,
      config: DEFAULT_PAYROLL_POLICY_CONFIG,
    };
  }

  return {
    policy,
    config: {
      lateGraceEnabled:
        policy.lateGraceEnabled ??
        DEFAULT_PAYROLL_POLICY_CONFIG.lateGraceEnabled,

      lateGraceMinutes: Number.isFinite(Number(policy.lateGraceMinutes))
        ? Number(policy.lateGraceMinutes)
        : DEFAULT_PAYROLL_POLICY_CONFIG.lateGraceMinutes,

      lateGraceMode:
        policy.lateGraceMode || DEFAULT_PAYROLL_POLICY_CONFIG.lateGraceMode,

      deductLateArrivals:
        policy.deductLateArrivals ??
        DEFAULT_PAYROLL_POLICY_CONFIG.deductLateArrivals,

      deductAbsences:
        policy.deductAbsences ?? DEFAULT_PAYROLL_POLICY_CONFIG.deductAbsences,

      rdFactorDiasMes: Number.isFinite(Number(policy.rdFactorDiasMes))
        ? Number(policy.rdFactorDiasMes)
        : DEFAULT_PAYROLL_POLICY_CONFIG.rdFactorDiasMes,

      useGrossSalaryForDailyDiscount:
        policy.useGrossSalaryForDailyDiscount ??
        DEFAULT_PAYROLL_POLICY_CONFIG.useGrossSalaryForDailyDiscount,

      requireConfirmedDaysDefault:
        policy.requireConfirmedDaysDefault ??
        DEFAULT_PAYROLL_POLICY_CONFIG.requireConfirmedDaysDefault,

      allowIncompleteDaysOnClose:
        policy.allowIncompleteDaysOnClose ??
        DEFAULT_PAYROLL_POLICY_CONFIG.allowIncompleteDaysOnClose,

      autoPaidLeaveNoDeduct:
        policy.autoPaidLeaveNoDeduct ??
        DEFAULT_PAYROLL_POLICY_CONFIG.autoPaidLeaveNoDeduct,
    },
  };
};

export const buildPayrollPolicySnapshot = (policy: any, config: any) => {
  return {
    policyId: policy?._id || null,
    name: policy?.name || "Política por defecto",
    code: policy?.code || "DEFAULT_PAYROLL_POLICY",

    lateGraceEnabled: !!config.lateGraceEnabled,
    lateGraceMinutes: Number(config.lateGraceMinutes || 0),
    lateGraceMode: config.lateGraceMode || "FULL_GRACE",

    deductLateArrivals: !!config.deductLateArrivals,
    deductAbsences: !!config.deductAbsences,

    rdFactorDiasMes: Number(config.rdFactorDiasMes || 23.83),
    useGrossSalaryForDailyDiscount: !!config.useGrossSalaryForDailyDiscount,

    requireConfirmedDaysDefault: !!config.requireConfirmedDaysDefault,
    allowIncompleteDaysOnClose: !!config.allowIncompleteDaysOnClose,
    autoPaidLeaveNoDeduct: !!config.autoPaidLeaveNoDeduct,
  };
};

export const applyPayrollPolicyToDayCalc = ({
  dayCalc,
  ws,
  salaryCode,
  baseDailyForDiscountFixed,
  payrollPolicyConfig,
}: {
  dayCalc: any;
  ws: any;
  salaryCode: string;
  baseDailyForDiscountFixed: number;
  payrollPolicyConfig: any;
}) => {
  const policy = {
    ...DEFAULT_PAYROLL_POLICY_CONFIG,
    ...(payrollPolicyConfig || {}),
  };

  const classification = String(
    dayCalc?.classification || ws?.classification || "Trabajo regular",
  ).trim();

  const isRegularDay = classification === "Trabajo regular";

  const discountOverride = String(
    dayCalc?.discountOverride || ws?.discountOverride || "AUTO",
  ).toUpperCase();

  const salaryCodeUpper = String(salaryCode || "").toUpperCase();

  const expectedMinutes = toNum(dayCalc?.expectedMinutes, 0);
  const originalNotWorkedMinutes = Math.max(
    toNum(dayCalc?.notWorkedMinutes, 0),
    0,
  );

  const rawLateMinutes = Math.max(toNum(dayCalc?.entryLateRaw, 0), 0);

  const originalLateForPayroll = Math.max(
    toNum(dayCalc?.lateMinutesForPayroll, 0),
    0,
  );

  const nonLateNotWorkedMinutes = Math.max(
    originalNotWorkedMinutes - originalLateForPayroll,
    0,
  );

  const graceEnabled = policy.lateGraceEnabled === true;

  const graceMinutes = graceEnabled
    ? Math.max(toNum(policy.lateGraceMinutes, 0), 0)
    : 0;

  const deductLateArrivals = policy.deductLateArrivals !== false;
  const deductAbsences = policy.deductAbsences !== false;

  let graceExcusedMinutes = 0;
  let lateMinutesForPayroll = 0;

  if (!deductLateArrivals) {
    graceExcusedMinutes = rawLateMinutes;
    lateMinutesForPayroll = 0;
  } else if (!graceEnabled || graceMinutes <= 0) {
    graceExcusedMinutes = 0;
    lateMinutesForPayroll = rawLateMinutes;
  } else if (policy.lateGraceMode === "DEDUCT_AFTER_GRACE") {
    graceExcusedMinutes = Math.min(rawLateMinutes, graceMinutes);
    lateMinutesForPayroll = Math.max(rawLateMinutes - graceMinutes, 0);
  } else {
    /**
     * FULL_GRACE:
     * - Si llega dentro de la gracia, no descuenta.
     * - Si se pasa de la gracia, descuenta todo el tiempo tarde.
     */
    graceExcusedMinutes =
      rawLateMinutes > 0 && rawLateMinutes <= graceMinutes ? rawLateMinutes : 0;

    lateMinutesForPayroll = rawLateMinutes > graceMinutes ? rawLateMinutes : 0;
  }

  const shouldAutoNoDeduct =
    policy.autoPaidLeaveNoDeduct === true &&
    !isRegularDay &&
    discountOverride !== "FORCE_DEDUCT";

  const shouldForceNoDeduct = discountOverride === "FORCE_NO_DEDUCT";

  const shouldNoDeduct = shouldAutoNoDeduct || shouldForceNoDeduct;

  const notWorkedMinutes = shouldNoDeduct
    ? 0
    : nonLateNotWorkedMinutes + lateMinutesForPayroll;

  let descuentoTardanza = toNum(dayCalc?.descuentoTardanza, 0);
  let descuentoAusencia = toNum(dayCalc?.descuentoAusencia, 0);
  let descuentoTotal = toNum(dayCalc?.descuentoTotal, 0);

  if (salaryCodeUpper === "FIJO") {
    const basePerMinute =
      expectedMinutes > 0
        ? toNum(baseDailyForDiscountFixed, 0) / expectedMinutes
        : 0;

    if (shouldNoDeduct) {
      descuentoTardanza = 0;
      descuentoAusencia = 0;
      descuentoTotal = 0;
    } else {
      descuentoTardanza = deductLateArrivals
        ? lateMinutesForPayroll * basePerMinute
        : 0;

      descuentoAusencia = deductAbsences
        ? nonLateNotWorkedMinutes * basePerMinute
        : 0;

      descuentoTotal = descuentoTardanza + descuentoAusencia;
    }
  }

  const paidMinutesFixed =
    salaryCodeUpper === "FIJO"
      ? Math.max(expectedMinutes - notWorkedMinutes, 0)
      : toNum(dayCalc?.paidMinutesFixed, 0);

  const payImpact =
    descuentoTotal > 0 ? "DEDUCT" : shouldAutoNoDeduct ? "PAID_LEAVE" : "NONE";

  return {
    ...dayCalc,

    classification,

    graceExcusedMinutes,
    lateMinutesForPayroll,

    notWorkedMinutes,
    paidMinutesFixed,

    descuentoTardanza: round2(descuentoTardanza),
    descuentoAusencia: round2(descuentoAusencia),
    descuentoTotal: round2(descuentoTotal),

    payImpact,
  };
};

export const resolvePunchPayrollPolicyConfig = async (user: any) => {
  const companyId = getMongoIdString(user?.company);

  const payrollPolicyResp = await getPayrollPolicyConfig({
    companyId,
  });

  return {
    ...DEFAULT_PAYROLL_POLICY_CONFIG,
    ...(payrollPolicyResp?.config || {}),
  };
};

export const getPolicyGraceMinutes = (payrollPolicyConfig: any) => {
  if (payrollPolicyConfig?.lateGraceEnabled !== true) {
    return 0;
  }

  return Math.max(toNum(payrollPolicyConfig?.lateGraceMinutes, 0), 0);
};