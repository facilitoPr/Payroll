import dotenv from "dotenv";

dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import * as morgan from "morgan";

import { initializeSocket } from "./config/socket";
import { createCorsOptions, getCorsAllowedOrigins } from "./config/cors";
import { runSeeds } from "./seeders";

const { dbConnection } = require("./config/mongoose");

const app: express.Application = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT || 3000);
const corsOptions = createCorsOptions();

/**
 * TRUST_PROXY puede ser:
 * - loopback
 * - 1
 * - true
 * - false
 * - IP específica o subnet
 */
app.set("trust proxy", process.env.TRUST_PROXY || "loopback");

/**
 * Cookies y body parsers.
 */
app.use(cookieParser());

app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.JSON_BODY_LIMIT || "10mb",
  }),
);

/**
 * CORS controlado desde .env.
 */
app.use(cors(corsOptions));

/**
 * Preflight para navegadores.
 */
app.options("*", cors(corsOptions));

/**
 * Logs HTTP.
 */
app.use(morgan.default(process.env.HTTP_LOG_FORMAT || "dev"));

/**
 * Archivos públicos.
 */
app.use(express.static(path.join(__dirname, "public")));

initializeSocket(server);

/**
 * API principal.
 *
 * Aquí debe quedar registrada la ruta:
 * GET /api/employee-loan/integrations/bootstrap
 *
 * Esa ruta será llamada por los payrolls hijos usando:
 * - x-system-code
 * - x-api-key
 */
const routerModule = require("./routes");
const router = routerModule.default || routerModule;

app.use("/api", router);

const startApplication = async () => {
  try {
    console.log("[App] Connecting to MongoDB...");

    await dbConnection();

    console.log("[App] MongoDB connected successfully.");

    /**
     * Seeds del sistema principal.
     *
     * Aquí sí pueden quedar los seeds de:
     * - productos de préstamo,
     * - catálogos,
     * - permisos,
     * - menús,
     * - configuraciones principales.
     *
     * No necesitas usar el seed de EmployeeLoanPolicy del payroll hijo,
     * porque esa política se crea en cada sistema hijo.
     */
    await runSeeds();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      console.log("[CORS] Allowed origins:", getCorsAllowedOrigins());

      console.log(
        `[EmployeeLoanIntegration] Bootstrap endpoint expected at /api/employee-loan/integrations/bootstrap`,
      );
    });
  } catch (error) {
    console.error("[App] Failed to start application:", error);

    process.exit(1);
  }
};

startApplication();
