import crypto from "crypto";
import { round2, toNum } from "../parse";

const OMIT_KEYS = new Set([
  "_id",
  "__v",
  "createdAt",
  "updatedAt",
  "payrollRun",
  "runId",
  "generatedAt",
  "closedAt",
  "emailedAt",
]);

const normalizeValueForFingerprint = (value: any): any => {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return round2(toNum(value, 0));
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeValueForFingerprint(item))
      .sort((a, b) => {
        return JSON.stringify(a).localeCompare(JSON.stringify(b));
      });
  }

  if (typeof value === "object") {
    if (typeof value.toHexString === "function") {
      return value.toHexString();
    }

    const sorted: Record<string, any> = {};

    Object.keys(value)
      .filter((key) => !OMIT_KEYS.has(key))
      .sort()
      .forEach((key) => {
        sorted[key] = normalizeValueForFingerprint(value[key]);
      });

    return sorted;
  }

  return value;
};

const stableStringify = (value: any) => {
  return JSON.stringify(normalizeValueForFingerprint(value));
};

const getBankAmount = (bankSnapshot: any) => {
  return round2(
    toNum(
      bankSnapshot?.amount ||
        bankSnapshot?.amountPeriod ||
        bankSnapshot?.netAmount ||
        bankSnapshot?.transactionAmount ||
        bankSnapshot?.monto ||
        0,
      0,
    ),
  );
};

const buildPaymentFingerprintItem = ({
  userId,
  snapshot,
  bankSnapshot,
}: {
  userId: string;
  snapshot: any;
  bankSnapshot: any;
}) => {
  return {
    userId: String(userId),

    employee: {
      userId:
        snapshot?.employee?.userId || snapshot?.employee?.id || String(userId),
      name: snapshot?.employee?.name || "",
      email: snapshot?.employee?.email || "",
    },

    totals: snapshot?.totals || {},
    isr: snapshot?.isr || {},

    legalDeductions: snapshot?.legalDeductions || [],
    otherDeductions: snapshot?.otherDeductions || [],
    earnings: snapshot?.earnings || snapshot?.earningEntries || [],

    bankAmount: getBankAmount(bankSnapshot),
  };
};

export const buildPayrollFingerprint = ({
  companyId,
  periodStart,
  periodEnd,
  frequencyCode,
  requestedUserIds,
  payments,
}: {
  companyId: string;
  periodStart: string;
  periodEnd: string;
  frequencyCode?: string | null;
  requestedUserIds: string[];
  payments: Array<{
    userId: string;
    snapshot: any;
    bankSnapshot: any;
  }>;
}) => {
  const payload = {
    companyId: String(companyId),
    periodStart,
    periodEnd,
    frequencyCode: frequencyCode ? String(frequencyCode) : null,

    requestedUserIds: [...requestedUserIds].map(String).sort(),

    payments: payments
      .map((item) => buildPaymentFingerprintItem(item))
      .sort((a, b) => String(a.userId).localeCompare(String(b.userId))),
  };

  return crypto
    .createHash("sha256")
    .update(stableStringify(payload))
    .digest("hex");
};