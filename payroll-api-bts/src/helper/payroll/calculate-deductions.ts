import moment from "moment";
import { round2, toNum } from "../parse";
import { parseExpectedMoment } from "./payroll.parse";

type SalaryCode = "FIJO" | "HORAS" | string;

export function calcAttendanceDeductionsForDay(args: {
  ws: any;
  employee: any;
  entryPunch?: any | null;
  expectedFromSchedule?: { expectedMinutes: number; isActive: boolean } | null;

  salaryCode: SalaryCode;
  graceMinutes: number;

  baseDailyForDiscountFixed: number;

  hourlyRate?: number;

  calcExpectedMinutesForDate?: (
    schedule: any,
    punchType: any,
    dateString: string,
  ) => any;

  calcGrossPayHourlyDay?: (input: {
    workedMinutes: number;
    hourlyRate: number;
  }) => number;
}) {
  const {
    ws,
    employee,
    entryPunch,
    expectedFromSchedule,
    salaryCode,
    graceMinutes,
    baseDailyForDiscountFixed,
    hourlyRate,
    calcExpectedMinutesForDate,
    calcGrossPayHourlyDay,
  } = args;

  const dateString = String(ws?.dateString || "").slice(0, 10);
  if (!dateString) return { skip: true, reason: "NO_DATE" };

  // 1) expectedMinutes (WS -> fallback schedule)
  let expectedMinutes = toNum(ws?.expectedMinutes, 0);
  let isActive = true;

  if (!expectedMinutes || expectedMinutes <= 0) {
    if (expectedFromSchedule) {
      expectedMinutes = toNum(expectedFromSchedule.expectedMinutes, 0);
      isActive = !!expectedFromSchedule.isActive;
    } else if (
      calcExpectedMinutesForDate &&
      employee?.schedule &&
      employee?.punchTypeId
    ) {
      const exp = calcExpectedMinutesForDate(
        employee.schedule,
        employee.punchTypeId,
        dateString,
      );
      expectedMinutes = toNum(exp?.expectedMinutes, 0);
      isActive = !!exp?.isActive;
    }
  }

  if (!isActive || !expectedMinutes || expectedMinutes <= 0) {
    return { skip: true, reason: "NOT_ACTIVE_OR_EXPECTED_0" };
  }

  const workedMinutes = toNum(ws?.totalMinutes, 0);
  const approvedMinutes = toNum(ws?.approvedMinutes, 0);
    const isFullAbsence = workedMinutes === 0 && approvedMinutes === 0;

  const discountOverride = String(ws?.discountOverride || "AUTO").toUpperCase();
  const classification = ws?.classification || "Trabajo regular";

  const payImpactRaw = ws?.payImpact ? String(ws.payImpact).toUpperCase() : "";
  const payImpact =
    payImpactRaw ||
    (classification && classification !== "Trabajo regular"
      ? "DEDUCT"
      : "NONE");

  // 2) tardanza raw (minutos) desde entrada.
  // Algunos flujos consolidados guardan la tardanza en WorkSummary.lateTime
  // aunque el PunchHistory no tenga expectedTime/timestamp completo.
  let entryLateRaw = 0;
  if (entryPunch?.expectedTime && entryPunch?.timestamp) {
    const ltSeconds = toNum(entryPunch?.lateTime, NaN);
    if (Number.isFinite(ltSeconds) && ltSeconds >= 0) {
      entryLateRaw = Math.max(0, Math.floor(ltSeconds / 60));
    } else {
      const exp = parseExpectedMoment(
        dateString,
        String(entryPunch.expectedTime),
      );
      const real = moment(entryPunch.timestamp);
      if (exp.isValid() && real.isValid()) {
        entryLateRaw = Math.max(0, Math.floor(real.diff(exp, "minutes")));
      }
    }
  }

  if (entryLateRaw <= 0) {
    const wsLateSeconds = toNum(ws?.lateTime, NaN);
    if (Number.isFinite(wsLateSeconds) && wsLateSeconds > 0) {
      entryLateRaw = Math.max(0, Math.floor(wsLateSeconds / 60));
    }
  }

  // 3) regla de gracia como UMBRAL para tardanza penalizable
  const lateMinutesForPayroll = entryLateRaw > graceMinutes ? entryLateRaw : 0;
  
  // ============================================================
  // 4) FIJO: calcular paidMinutes usando "pool de gracia" (tolerancia diaria)
  //    - Si lateMinutesForPayroll === 0, entonces se perdona hasta graceMinutes
  //      del faltante total del día (para que 480-10 => 470 no descuente).
  // ============================================================

  let paidMinutesForFixed = workedMinutes; // valor final para nómina
  let paidBaseFixed = workedMinutes; // base sin gracia-pool
  let graceAppliedMinutes = 0; // minutos perdonados por pool
  let notWorkedMinutesFinal = 0;

  if (String(salaryCode).toUpperCase() === "FIJO") {
    if (discountOverride === "FORCE_NO_DEDUCT") {
      paidMinutesForFixed = expectedMinutes;
      paidBaseFixed = expectedMinutes;
      graceAppliedMinutes = 0;
      notWorkedMinutesFinal = 0;
    } else if (discountOverride === "FORCE_DEDUCT") {
      // fuerza descuento => ignora approved y también ignora gracia pool
      paidBaseFixed = workedMinutes;
      paidMinutesForFixed = Math.min(expectedMinutes, paidBaseFixed);
      graceAppliedMinutes = 0;
      notWorkedMinutesFinal = Math.max(
        expectedMinutes - paidMinutesForFixed,
        0,
      );
    } else if (payImpact === "PAID_LEAVE") {
      paidMinutesForFixed = expectedMinutes;
      paidBaseFixed = expectedMinutes;
      graceAppliedMinutes = 0;
      notWorkedMinutesFinal = 0;
    } else {
      // AUTO:
      // base = worked + approved (sin gracia todavía)
      paidBaseFixed = workedMinutes + approvedMinutes;

      // clamp a expected
      paidBaseFixed =
        expectedMinutes > 0
          ? Math.min(expectedMinutes, paidBaseFixed)
          : paidBaseFixed;

      const missingBase =
        expectedMinutes > 0 ? Math.max(expectedMinutes - paidBaseFixed, 0) : 0;

      // ✅ Pool de gracia SOLO si NO hay tardanza penalizable
      // (lateMinutesForPayroll == 0 => entryLateRaw <= graceMinutes)

      // const canUseGracePool = lateMinutesForPayroll === 0 && graceMinutes > 0;
      const canUseGracePool =
        !isFullAbsence && lateMinutesForPayroll === 0 && graceMinutes > 0;

      graceAppliedMinutes = canUseGracePool
        ? Math.min(graceMinutes, missingBase)
        : 0;

      // if(ws.classification != "Trabajo regular") graceAppliedMinutes = 0

      paidMinutesForFixed =
        expectedMinutes > 0
          ? Math.min(expectedMinutes, paidBaseFixed + graceAppliedMinutes)
          : paidBaseFixed + graceAppliedMinutes;

      notWorkedMinutesFinal =
        expectedMinutes > 0
          ? Math.max(expectedMinutes - paidMinutesForFixed, 0)
          : 0;
    }
  } else {
    // HORAS: no usamos notWorked para descontar; se paga por minutos (y aprobados)
    notWorkedMinutesFinal = 0;
  }

  // 5) tardanza se descuenta SOLO si hubo faltante (y solo si tardanza penalizable)
  const tardanzaDeductMinutes = Math.min(
    lateMinutesForPayroll,
    notWorkedMinutesFinal,
  );
  const otherMissingMinutes = Math.max(
    notWorkedMinutesFinal - tardanzaDeductMinutes,
    0,
  );

  // 6) dinero (FIJO)
  let descuentoTardanza = 0;
  let descuentoAusencia = 0;

  if (String(salaryCode).toUpperCase() === "FIJO") {
    const basePorMinuto =
      expectedMinutes > 0 ? baseDailyForDiscountFixed / expectedMinutes : 0;

    descuentoTardanza =
      tardanzaDeductMinutes > 0 ? tardanzaDeductMinutes * basePorMinuto : 0;

    descuentoAusencia =
      otherMissingMinutes > 0 ? otherMissingMinutes * basePorMinuto : 0;
  }

  const descuentoTotal = descuentoTardanza + descuentoAusencia;

  // 7) HORAS
  let paidMinutesHourly = 0;
  let grossPayDay = 0;

  if (String(salaryCode).toUpperCase() === "HORAS") {
    paidMinutesHourly = workedMinutes + approvedMinutes;

    if (discountOverride === "FORCE_NO_DEDUCT" || payImpact === "PAID_LEAVE") {
      paidMinutesHourly = Math.max(paidMinutesHourly, expectedMinutes);
    } else if (discountOverride === "FORCE_DEDUCT") {
      paidMinutesHourly = workedMinutes;
    }

    if (calcGrossPayHourlyDay) {
      grossPayDay = calcGrossPayHourlyDay({
        workedMinutes: paidMinutesHourly,
        hourlyRate: toNum(hourlyRate, 0),
      });
    }
  }

  return {
    skip: false,

    dateString,
    classification,
    payImpact,
    discountOverride,

    expectedMinutes,
    workedMinutes,
    approvedMinutes,

    entryLateRaw,
    // Ahora este campo representa MINUTOS perdonados por el pool (más útil)
    graceExcusedMinutes: graceAppliedMinutes,
    lateMinutesForPayroll,

    paidMinutesFixed: paidMinutesForFixed,
    // faltante final (ya con pool aplicado)
    notWorkedMinutes: notWorkedMinutesFinal,

    tardanzaDeductMinutes,
    otherMissingMinutes,

    descuentoTardanza: round2(descuentoTardanza),
    descuentoAusencia: round2(descuentoAusencia),
    descuentoTotal: round2(descuentoTotal),

    // HORAS
    paidMinutesHourly,
    grossPayDay: round2(grossPayDay),

    // Extra útil para debug/UX
    paidBaseFixed:
      String(salaryCode).toUpperCase() === "FIJO" ? paidBaseFixed : 0,
  };
}
