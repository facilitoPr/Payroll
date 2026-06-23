import { Request, Response } from "express";
import { Types } from "mongoose";
import AiAgent from "../model/aiAgent";
import { validateConfigByType } from "../utils/aiAgentConfigGuards";

const ALLOWED_TYPES = ["recruitment", "support", "sales", "generic"] as const;
const ALLOWED_PROVIDERS = ["openai", "dify"] as const;

function normalizeNumber(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const createAiAgent = async (req: any, res: Response) => {
  try {
    const {
      name,
      code,
      type,
      description,
      provider = "openai",
      model = "gpt-4.1-mini",
      temperature = 0.2,
      maxTokens = 1024,
      config,
    } = req.body || {};

    if (!name || !code || !type) {
      return res.status(400).json({
        ok: false,
        mensaje: "name, code y type son requeridos.",
      });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        ok: false,
        mensaje: `type inválido. Usa: ${ALLOWED_TYPES.join(", ")}`,
      });
    }

    if (!ALLOWED_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        ok: false,
        mensaje: `provider no soportado: ${provider}`,
      });
    }

    if (!config) {
      return res.status(400).json({
        ok: false,
        mensaje: "config es requerido (varía según type).",
      });
    }

    const isValid = validateConfigByType(type, config);
    if (!isValid) {
      return res.status(400).json({
        ok: false,
        mensaje: `config inválido para type=${type}`,
      });
    }

    const agent = await AiAgent.create({
      name: String(name).trim(),
      code: String(code).trim(),
      type,
      description:
        typeof description === "string" ? description.trim() : undefined,
      provider,
      model: String(model),
      temperature: normalizeNumber(temperature, 0.2),
      maxTokens: normalizeNumber(maxTokens, 1024),
      config,
      isActive: true,
      isDeleted: false,
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Agente creado correctamente",
      agent,
    });
  } catch (error: any) {
    console.error("Error createAiAgent:", error);
    return res.status(500).json({
      ok: false,
      mensaje: error?.message || "Error inesperado al crear el agente",
    });
  }
};

const updateAiAgent = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: "ID no válido" });
    }

    const agent = await AiAgent.findOne({ _id: id, isDeleted: false });
    if (!agent) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Agente no encontrado" });
    }

    const {
      name,
      code,
      type,
      description,
      provider,
      model,
      temperature,
      maxTokens,
      config,
      isActive,
    } = req.body || {};

    // Campos comunes
    if (typeof name === "string") agent.name = name.trim();
    if (typeof code === "string") agent.code = code.trim();
    if (typeof description === "string") agent.description = description.trim();
    if (typeof model === "string") agent.model = model;
    if (typeof temperature !== "undefined")
      agent.temperature = normalizeNumber(temperature, agent.temperature);
    if (typeof maxTokens !== "undefined")
      agent.maxTokens = normalizeNumber(maxTokens, agent.maxTokens);
    if (typeof isActive === "boolean") agent.isActive = isActive;

    // type/provider (si se quieren permitir cambios)
    if (typeof provider === "string") {
      if (!ALLOWED_PROVIDERS.includes(provider as any)) {
        return res
          .status(400)
          .json({ ok: false, mensaje: `provider no soportado: ${provider}` });
      }
      agent.provider = provider;
    }

    if (typeof type === "string") {
      if (!ALLOWED_TYPES.includes(type as any)) {
        return res
          .status(400)
          .json({ ok: false, mensaje: `type inválido: ${type}` });
      }
      agent.type = type;
    }

    // config depende del type final (ya sea el nuevo o el existente)
    if (typeof config !== "undefined") {
      const finalType = agent.type as any;
      const isValid = validateConfigByType(finalType, config);
      if (!isValid) {
        return res.status(400).json({
          ok: false,
          mensaje: `config inválido para type=${finalType}`,
        });
      }
      agent.config = config;
    }

    await agent.save();

    return res.json({
      ok: true,
      mensaje: "Agente actualizado correctamente",
      agent,
    });
  } catch (error: any) {
    console.error("Error updateAiAgent:", error);
    return res.status(500).json({
      ok: false,
      mensaje: error?.message || "Error inesperado al actualizar el agente",
    });
  }
};

const getAiAgents = async (req: Request, res: Response) => {
  try {
    const {
      type,
      isActive,
      q,
      limit = "50",
      initial = "0",
      includeDeleted = "false",
    } = req.query as any;

    const query: any = {};

    // por defecto: no traer eliminados
    const includeDel = String(includeDeleted) === "true";
    if (!includeDel) query.isDeleted = false;

    if (
      type &&
      ["recruitment", "support", "sales", "generic"].includes(String(type))
    ) {
      query.type = String(type);
    }

    if (typeof isActive !== "undefined") {
      if (String(isActive) === "true") query.isActive = true;
      if (String(isActive) === "false") query.isActive = false;
    }

    const term = String(q || "").trim();
    if (term) {
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { code: { $regex: term, $options: "i" } },
        { model: { $regex: term, $options: "i" } },
        { provider: { $regex: term, $options: "i" } },
      ];
    }

    const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const skip = Math.max(Number(initial) || 0, 0);

    const [agents, total] = await Promise.all([
      AiAgent.find(query).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      AiAgent.countDocuments(query),
    ]);

    return res.json({
      ok: true,
      mensaje: "Agentes cargados",
      agents,
      total,
      limit: lim,
      initial: skip,
    });
  } catch (error: any) {
    console.error("Error getAiAgents:", error);
    return res.status(500).json({
      ok: false,
      mensaje: error?.message || "Error inesperado al cargar agentes",
    });
  }
};

const getAiAgentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: "ID no válido" });
    }

    const agent = await AiAgent.findOne({ _id: id, isDeleted: false }).lean();
    if (!agent) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Agente no encontrado" });
    }

    return res.json({
      ok: true,
      mensaje: "Agente cargado",
      agent,
    });
  } catch (error: any) {
    console.error("Error getAiAgentById:", error);
    return res.status(500).json({
      ok: false,
      mensaje: error?.message || "Error inesperado al cargar agente",
    });
  }
};

const deleteAiAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: "ID no válido" });
    }

    const agent = await AiAgent.findOne({ _id: id, isDeleted: false });
    if (!agent) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Agente no encontrado" });
    }

    // Soft delete (tu estándar)
    agent.isDeleted = true;
    agent.isActive = false;

    await agent.save();

    return res.json({
      ok: true,
      mensaje: "Agente eliminado correctamente",
      agent,
    });
  } catch (error: any) {
    console.error("Error deleteAiAgent:", error);
    return res.status(500).json({
      ok: false,
      mensaje: error?.message || "Error inesperado al eliminar el agente",
    });
  }
};

export {
  createAiAgent,
  updateAiAgent,
  getAiAgents,
  getAiAgentById,
  deleteAiAgent,
};
