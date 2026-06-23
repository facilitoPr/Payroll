import crypto from "crypto";
import { Request } from "express";
import EmployeeLoanIntegrationClient from "../../../model/employeeLoan/employeeLoanIntegrationClient";

type IntegrationCapability =
  | "canQuote"
  | "canCreateRequests"
  | "canCheckStatus";

const getHeaderString = (req: Request, headerName: string) => {
  const value = req.headers[headerName.toLowerCase()];

  if (Array.isArray(value)) {
    return String(value[0] || "").trim();
  }

  return String(value || "").trim();
};

const normalizeOrigin = (value: unknown) => {
  const raw = String(value || "").trim();

  if (!raw) return "";

  try {
    const parsed = new URL(raw);

    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return raw.replace(/\/+$/, "").toLowerCase();
  }
};

const normalizeIp = (value: unknown) => {
  const raw = String(value || "")
    .trim()
    .toLowerCase();

  if (!raw) return "";

  if (raw.startsWith("::ffff:")) {
    return raw.replace("::ffff:", "");
  }

  return raw;
};

const getRequestIpCandidates = (req: Request) => {
  const candidates = new Set<string>();

  const forwardedFor = getHeaderString(req, "x-forwarded-for");

  if (forwardedFor) {
    forwardedFor
      .split(",")
      .map((item) => normalizeIp(item))
      .filter(Boolean)
      .forEach((item) => candidates.add(item));
  }

  const requestIp = normalizeIp(req.ip);

  if (requestIp) {
    candidates.add(requestIp);
  }

  const socketIp = normalizeIp(req.socket?.remoteAddress);

  if (socketIp) {
    candidates.add(socketIp);
  }

  return Array.from(candidates);
};

const buildIntegrationError = ({
  statusCode = 401,
  mensaje,
  message,
}: {
  statusCode?: number;
  mensaje: string;
  message: string;
}) => {
  return {
    statusCode,
    mensaje,
    message,
  };
};

export const hashEmployeeLoanIntegrationApiKey = (apiKey: string) => {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
};

export const isSha256Hash = (value: unknown) => {
  return /^[a-f0-9]{64}$/i.test(String(value || "").trim());
};

export const authenticateEmployeeLoanIntegrationRequest = async ({
  req,
  requiredCapabilities = [],
}: {
  req: Request;
  requiredCapabilities?: IntegrationCapability[];
}) => {
  const systemCode = getHeaderString(req, "x-system-code").toUpperCase();
  const apiKey = getHeaderString(req, "x-api-key");

  if (!systemCode) {
    throw buildIntegrationError({
      statusCode: 400,
      mensaje: "Falta el header x-system-code de la integración.",
      message: "Missing x-system-code integration header.",
    });
  }

  if (!apiKey) {
    throw buildIntegrationError({
      statusCode: 401,
      mensaje: "Falta la API key de la integración.",
      message: "Missing integration API key.",
    });
  }

  const apiKeyHash = hashEmployeeLoanIntegrationApiKey(apiKey);

  /**
   * Compatibilidad temporal:
   *
   * Registros viejos guardaban la API key original en apiKeyHash.
   * Esta consulta permite que sigan funcionando mientras se ejecuta
   * la migración. En el primer uso válido se convierten a SHA-256.
   */
  const client = await EmployeeLoanIntegrationClient.findOne({
    systemCode,
    isDeleted: false,
    $or: [
      {
        apiKeyHash,
      },
      {
        apiKeyHash: apiKey,
      },
    ],
  }).select("+apiKeyHash");

  if (!client) {
    throw buildIntegrationError({
      statusCode: 401,
      mensaje: "La integración no existe o las credenciales no son válidas.",
      message: "Integration does not exist or credentials are invalid.",
    });
  }

  if (!client.isActive) {
    throw buildIntegrationError({
      statusCode: 403,
      mensaje: "La integración está desactivada.",
      message: "Integration is disabled.",
    });
  }

  if (client.expiresAt && new Date(client.expiresAt).getTime() <= Date.now()) {
    throw buildIntegrationError({
      statusCode: 403,
      mensaje: "La integración se encuentra vencida.",
      message: "Integration has expired.",
    });
  }

  const requestOrigin = normalizeOrigin(getHeaderString(req, "origin"));

  const allowedOrigins = Array.from(
    new Set(
      (client.allowedOrigins || [])
        .map((origin) => normalizeOrigin(origin))
        .filter(Boolean),
    ),
  );

  if (
    allowedOrigins.length > 0 &&
    !allowedOrigins.includes("*") &&
    (!requestOrigin || !allowedOrigins.includes(requestOrigin))
  ) {
    throw buildIntegrationError({
      statusCode: 403,
      mensaje: "El origen de esta integración no está autorizado.",
      message: "Integration origin is not allowed.",
    });
  }

  const allowedIps = Array.from(
    new Set(
      (client.allowedIps || []).map((ip) => normalizeIp(ip)).filter(Boolean),
    ),
  );

  if (allowedIps.length > 0 && !allowedIps.includes("*")) {
    const requestIps = getRequestIpCandidates(req);

    const hasAllowedIp = requestIps.some((ip) => allowedIps.includes(ip));

    if (!hasAllowedIp) {
      throw buildIntegrationError({
        statusCode: 403,
        mensaje: "La IP de esta integración no está autorizada.",
        message: "Integration IP is not allowed.",
      });
    }
  }

  for (const capability of requiredCapabilities) {
    if (client[capability] !== true) {
      const labels: Record<IntegrationCapability, string> = {
        canQuote: "consultar productos y cotizaciones",
        canCreateRequests: "crear solicitudes de préstamos",
        canCheckStatus: "consultar estados de préstamos",
      };

      throw buildIntegrationError({
        statusCode: 403,
        mensaje: `La integración no tiene permiso para ${labels[capability]}.`,
        message: `Integration does not have permission to ${capability}.`,
      });
    }
  }

  const shouldMigrateLegacyApiKey = client.apiKeyHash === apiKey;

  await EmployeeLoanIntegrationClient.updateOne(
    {
      _id: client._id,
    },
    {
      $set: {
        lastUsedAt: new Date(),
        ...(shouldMigrateLegacyApiKey
          ? {
              apiKeyHash,
            }
          : {}),
      },
      $inc: {
        usageCount: 1,
      },
    },
  );

  return client;
};
