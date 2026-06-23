import { round2, toNum } from "../parse";

export type PayrollAttendanceCalculationMode =
  | "FULL_PERIOD"
  | "FULL_PERIOD_WITH_DAY_ADJUSTMENTS"
  | "PAY_SELECTED_DAYS_ONLY"
  | "PAY_SELECTED_HOURS_ONLY";

export type PayrollAttendanceSnapshotSource =
  | "PAYROLL_PREVIEW"
  | "PAYROLL_CLOSE"
  | "PAYROLL_PAYMENT_READ"
  | "LEGACY_DEFAULT";

export const PAYROLL_ATTENDANCE_SNAPSHOT_VERSION = 1;
export const DEFAULT_PAYROLL_ATTENDANCE_MODE: PayrollAttendanceCalculationMode =
  "FULL_PERIOD";

export const normalizePayrollAttendanceSnapshot = (
  attendance: any,
  options: {
    calculationMode?: PayrollAttendanceCalculationMode | string;
    attendanceCutoffDate?: string;
    source?: PayrollAttendanceSnapshotSource;
    generatedAt?: Date | string;
  } = {},
) => {
  const current = attendance && typeof attendance === "object" ? attendance : {};
  const hasModernMetadata = Boolean(
    current.version || current.calculationMode || current.source,
  );
  const totals = current.totals || {};

  return {
    version: toNum(current.version, PAYROLL_ATTENDANCE_SNAPSHOT_VERSION),
    calculationMode:
      current.calculationMode ||
      options.calculationMode ||
      DEFAULT_PAYROLL_ATTENDANCE_MODE,
    attendanceCutoffDate:
      current.attendanceCutoffDate || options.attendanceCutoffDate || "",
    compatibilityMode:
      typeof current.compatibilityMode === "boolean"
        ? current.compatibilityMode
        : !hasModernMetadata,
    source:
      current.source ||
      options.source ||
      (hasModernMetadata ? "PAYROLL_PAYMENT_READ" : "LEGACY_DEFAULT"),
    generatedAt:
      current.generatedAt ||
      (options.generatedAt instanceof Date
        ? options.generatedAt.toISOString()
        : options.generatedAt) ||
      new Date().toISOString(),
    totals: {
      totalLateMinutes: round2(toNum(totals.totalLateMinutes, 0)),
      totalNotWorkedMinutes: round2(toNum(totals.totalNotWorkedMinutes, 0)),
      totalDiscountTardanzaPeriodo: round2(
        toNum(totals.totalDiscountTardanzaPeriodo, 0),
      ),
      totalDiscountAusenciaPeriodo: round2(
        toNum(totals.totalDiscountAusenciaPeriodo, 0),
      ),
      totalDiscountsPeriodo: round2(toNum(totals.totalDiscountsPeriodo, 0)),
    },
    days: Array.isArray(current.days) ? current.days : [],
    lateOrAbsentDay: Array.isArray(current.lateOrAbsentDay)
      ? current.lateOrAbsentDay
      : [],
  };
};

export const ensurePayrollAttendanceSnapshotCompatibility = (
  snapshot: any,
  options: {
    calculationMode?: PayrollAttendanceCalculationMode | string;
    attendanceCutoffDate?: string;
    source?: PayrollAttendanceSnapshotSource;
    generatedAt?: Date | string;
  } = {},
) => {
  if (!snapshot || typeof snapshot !== "object") return snapshot;

  snapshot.attendance = normalizePayrollAttendanceSnapshot(
    snapshot.attendance,
    options,
  );

  return snapshot;
};
