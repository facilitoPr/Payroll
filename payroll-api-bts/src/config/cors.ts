import cors from "cors";

const parseList = (value: unknown) => {
  return Array.from(
    new Set(
      String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
};

const normalizeOrigin = (value: unknown) => {
  const raw = String(value || "")
    .trim()
    .replace(/\/+$/, "");

  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);

    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
};

const normalizeHeaders = (headers: string[]) => {
  return Array.from(
    new Set(
      headers.map((header) => String(header || "").trim()).filter(Boolean),
    ),
  );
};

export const getCorsAllowedOrigins = () => {
  const origins = parseList(process.env.CORS_ALLOWED_ORIGINS);

  return Array.from(
    new Set(origins.map((origin) => normalizeOrigin(origin)).filter(Boolean)),
  );
};

export const createCorsOptions = (): cors.CorsOptions => {
  const allowedOrigins = getCorsAllowedOrigins();

  const allowedHeadersFromEnv = parseList(process.env.CORS_ALLOWED_HEADERS);

  const allowedHeaders = normalizeHeaders([
    "Content-Type",
    "Authorization",
    "x-access-token",
    "x-skip-refresh",
    "x-forwarded-for",
    "x-system-code",
    "x-api-key",
    ...allowedHeadersFromEnv,
  ]);

  return {
    origin: (origin, callback) => {
      /**
       * Permite llamadas server-to-server, Postman, cron jobs,
       * curl y herramientas que no envían Origin.
       */
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `CORS blocked for origin: ${origin}. Configure it in CORS_ALLOWED_ORIGINS.`,
        ),
      );
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],

    allowedHeaders,

    optionsSuccessStatus: 204,
  };
};