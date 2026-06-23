import crypto from "crypto";
import { Request, Response } from "express";
import { Types } from "mongoose";
import EmployeeLoanProductConfig from "../../model/employeeLoan/employeeLoanProductConfig";
import EmployeeLoanIntegrationClient from "../../model/employeeLoan/employeeLoanIntegrationClient";
import {
  authenticateEmployeeLoanIntegrationRequest,
  hashEmployeeLoanIntegrationApiKey,
} from "../../helper/employeeLoan/loanIntegration/employeeLoanIntegration.security";
import { buildClientPayload } from "../../helper/employeeLoan/loanIntegration/employeeLoanIntegration.build";
import { validateClientPayload } from "../../helper/employeeLoan/loanIntegration/employeeLoanIntegration.validate";

const generateApiKey = () => {
  const prefix = "eln";
  const random = crypto.randomBytes(32).toString("hex");

  return `${prefix}_${random}`;
};

const cleanClientForResponse = (client: any) => {
  const plain = client?.toObject ? client.toObject() : { ...client };

  delete plain.apiKeyHash;

  return plain;
};

const getIntegrationProductConfig = async (client: any) => {
  const filters: any = {
    isActive: true,
    isDeleted: false,
  };

  const allowedProductCodes = Array.from(
    new Set(
      (client.allowedProductCodes || [])
        .map((item: string) =>
          String(item || "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean),
    ),
  );

  if (allowedProductCodes.length > 0) {
    filters.code = {
      $in: allowedProductCodes,
    };
  }

  const config = await EmployeeLoanProductConfig.findOne(filters).sort({
    isDefault: -1,
    createdAt: -1,
  });

  if (!config) {
    throw {
      statusCode: 404,
      mensaje:
        allowedProductCodes.length > 0
          ? "No hay un producto de préstamo activo permitido para esta integración."
          : "No hay una configuración de préstamo activa disponible.",
      message:
        "No active employee loan product configuration is available for this integration.",
    };
  }

  return config;
};

const sendKnownError = (res: Response, error: any, fallbackMessage: string) => {
  const statusCode =
    Number(error?.statusCode || error?.status || 500) >= 400
      ? Number(error?.statusCode || error?.status || 500)
      : 500;

  return res.status(statusCode).json({
    ok: false,
    mensaje: error?.mensaje || fallbackMessage,
    message: error?.message || fallbackMessage,
  });
};

const getEmployeeLoanIntegrationClients = async (
  req: Request,
  res: Response,
) => {
  try {
    const clients = await EmployeeLoanIntegrationClient.find({
      isDeleted: false,
    })
      .select("-apiKeyHash")
      .sort({
        isActive: -1,
        createdAt: -1,
      });

    return res.json({
      ok: true,
      clients,
    });
  } catch (error) {
    console.error("[getEmployeeLoanIntegrationClients]", error);

    return sendKnownError(res, error, "Error cargando integraciones.");
  }
};

const createEmployeeLoanIntegrationClient = async (
  req: Request,
  res: Response,
) => {
  try {
    const payload = buildClientPayload(req.body);

    const validationError = await validateClientPayload(payload);

    if (validationError) {
      return res.status(400).json({
        ok: false,
        mensaje: validationError,
        message: validationError,
      });
    }

    const exists = await EmployeeLoanIntegrationClient.findOne({
      systemCode: payload.systemCode,
      isDeleted: false,
    });

    if (exists) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ya existe una integración con ese código de sistema.",
        message: "An integration with this system code already exists.",
      });
    }

    const generatedApiKey = generateApiKey();

    const client = new EmployeeLoanIntegrationClient({
      ...payload,
      apiKeyHash: hashEmployeeLoanIntegrationApiKey(generatedApiKey),
      lastUsedAt: null,
      usageCount: 0,
    });

    await client.save();

    return res.status(201).json({
      ok: true,
      mensaje:
        "Integración creada correctamente. Guarda la API key, solo se mostrará una vez.",
      message:
        "Integration created successfully. Save the API key; it will only be shown once.",
      client: cleanClientForResponse(client),
      generatedApiKey,
    });
  } catch (error: any) {
    console.error("[createEmployeeLoanIntegrationClient]", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ya existe una integración con ese código de sistema.",
        message: "An integration with this system code already exists.",
      });
    }

    return sendKnownError(res, error, "Error creando integración.");
  }
};

const updateEmployeeLoanIntegrationClient = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
        message: "Invalid ID.",
      });
    }

    const client = await EmployeeLoanIntegrationClient.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!client) {
      return res.status(404).json({
        ok: false,
        mensaje: "Integración no encontrada.",
        message: "Integration not found.",
      });
    }

    const payload = buildClientPayload({
      ...client.toObject(),
      ...req.body,
      systemCode: client.systemCode,
    });

    const validationError = await validateClientPayload(payload);

    if (validationError) {
      return res.status(400).json({
        ok: false,
        mensaje: validationError,
        message: validationError,
      });
    }

    client.name = payload.name;
    client.description = payload.description;
    client.allowedProductCodes = payload.allowedProductCodes;
    client.canQuote = payload.canQuote;
    client.canCreateRequests = payload.canCreateRequests;
    client.canCheckStatus = payload.canCheckStatus;
    client.allowedOrigins = payload.allowedOrigins;
    client.allowedIps = payload.allowedIps;
    client.expiresAt = payload.expiresAt;
    client.isActive = payload.isActive;
    client.isDeleted = false;

    await client.save();

    return res.json({
      ok: true,
      mensaje: "Integración actualizada correctamente.",
      message: "Integration updated successfully.",
      client: cleanClientForResponse(client),
    });
  } catch (error: any) {
    console.error("[updateEmployeeLoanIntegrationClient]", error);

    return sendKnownError(res, error, "Error actualizando integración.");
  }
};

const regenerateEmployeeLoanIntegrationApiKey = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
        message: "Invalid ID.",
      });
    }

    const client = await EmployeeLoanIntegrationClient.findOne({
      _id: id,
      isDeleted: false,
    }).select("+apiKeyHash");

    if (!client) {
      return res.status(404).json({
        ok: false,
        mensaje: "Integración no encontrada.",
        message: "Integration not found.",
      });
    }

    const generatedApiKey = generateApiKey();

    client.apiKeyHash = hashEmployeeLoanIntegrationApiKey(generatedApiKey);

    await client.save();

    return res.json({
      ok: true,
      mensaje:
        "API key regenerada correctamente. Guarda la nueva clave, solo se mostrará una vez.",
      message:
        "API key regenerated successfully. Save the new key; it will only be shown once.",
      client: cleanClientForResponse(client),
      generatedApiKey,
    });
  } catch (error: any) {
    console.error("[regenerateEmployeeLoanIntegrationApiKey]", error);

    return sendKnownError(res, error, "Error regenerando API key.");
  }
};

const deleteEmployeeLoanIntegrationClient = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
        message: "Invalid ID.",
      });
    }

    const client = await EmployeeLoanIntegrationClient.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!client) {
      return res.status(404).json({
        ok: false,
        mensaje: "Integración no encontrada.",
        message: "Integration not found.",
      });
    }

    client.isDeleted = true;
    client.isActive = false;

    await client.save();

    return res.json({
      ok: true,
      mensaje: "Integración eliminada correctamente.",
      message: "Integration deleted successfully.",
    });
  } catch (error) {
    console.error("[deleteEmployeeLoanIntegrationClient]", error);

    return sendKnownError(res, error, "Error eliminando integración.");
  }
};

/**
 * Endpoint para payrolls hijos.
 *
 * Valida:
 * - x-system-code
 * - x-api-key
 * - isActive
 * - expiresAt
 * - origin/IP opcionales
 * - canQuote
 * - canCreateRequests
 *
 * Luego devuelve el producto permitido para esa integración.
 */
const getEmployeeLoanIntegrationBootstrap = async (
  req: Request,
  res: Response,
) => {
  try {
    const client = await authenticateEmployeeLoanIntegrationRequest({
      req,
      requiredCapabilities: ["canQuote", "canCreateRequests"],
    });

    const productConfig = await getIntegrationProductConfig(client);

    return res.status(200).json({
      ok: true,
      integration: {
        id: client._id,
        systemCode: client.systemCode,
        name: client.name,
        description: client.description,
        allowedProductCodes: client.allowedProductCodes || [],
        canQuote: client.canQuote,
        canCreateRequests: client.canCreateRequests,
        canCheckStatus: client.canCheckStatus,
        expiresAt: client.expiresAt || null,
      },
      productConfig,
      employeeLoanProductConfig: productConfig,
      config: productConfig,
      mensaje: "Integración validada correctamente.",
      message: "Integration validated successfully.",
    });
  } catch (error: any) {
    console.error("[getEmployeeLoanIntegrationBootstrap]", {
      statusCode: error?.statusCode,
      mensaje: error?.mensaje,
      message: error?.message,
    });

    return sendKnownError(
      res,
      error,
      "No se pudo validar la integración de préstamos.",
    );
  }
};

export {
  getEmployeeLoanIntegrationClients,
  createEmployeeLoanIntegrationClient,
  updateEmployeeLoanIntegrationClient,
  regenerateEmployeeLoanIntegrationApiKey,
  deleteEmployeeLoanIntegrationClient,
  getEmployeeLoanIntegrationBootstrap,
};
