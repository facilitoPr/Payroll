import { normalizeBoolean, normalizeStringArray } from "../../normalize";

export const buildClientPayload = (body: any) => {
  return {
    systemCode: String(body.systemCode || "")
      .trim()
      .toUpperCase(),

    name: String(body.name || "").trim(),

    description: String(body.description || "").trim(),

    allowedProductCodes: normalizeStringArray(body.allowedProductCodes).map(
      (item) => item.toUpperCase(),
    ),

    canQuote: normalizeBoolean(body.canQuote, true),

    canCreateRequests: normalizeBoolean(body.canCreateRequests, true),

    canCheckStatus: normalizeBoolean(body.canCheckStatus, true),

    allowedOrigins: normalizeStringArray(body.allowedOrigins),

    allowedIps: normalizeStringArray(body.allowedIps),

    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,

    isActive: normalizeBoolean(body.isActive, true),

    isDeleted: false,
  };
};