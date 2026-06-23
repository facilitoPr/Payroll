import { Response } from "express";
import { Types } from "mongoose";
import IncentiveProgram from "../../model/incentive/incentiveProgram";
import IncentiveRule from "../../model/incentive/incentiveRule";

const requireManagerOrSuperAdmin = (req: any, res: Response) => {
  const user = req.user;
  if (!user?.isManager && !user?.isSuperAdmin) {
    res.status(403).json({ ok: false, mensaje: "No autorizado." });
    return false;
  }
  return true;
};

const createIncentiveRule = async (req: any, res: Response) => {
  try {
    if (!requireManagerOrSuperAdmin(req, res)) return;

    const {
      program,
      name,
      code,
      description = null,
      appliesTo,
      scopeType,
      deliveryChannel,
      rewardKind,
      rewardAmount = null,
      rewardCurrency = "DOP",
      rewardLabel = null,
      ruleType,
      metricSource,
      config = {},
      version = 1,
      rootRule = null,
      startMonth = null,
      endMonth = null,
      displayOrder = 0,
      ui = {},
    } = req.body || {};

    // Validar programa
    const programDoc = await IncentiveProgram.findOne({
      _id: program,
      isDeleted: false,
    });

    if (!programDoc) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Programa no encontrado." });
    }

    const rule = new IncentiveRule({
      program,
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      description,
      appliesTo,
      scopeType,
      deliveryChannel,
      rewardKind,
      rewardAmount,
      rewardCurrency,
      rewardLabel,
      ruleType,
      metricSource,
      config,
      version: Number(version) || 1,
      rootRule:
        rootRule && Types.ObjectId.isValid(String(rootRule)) ? rootRule : null,
      startMonth: startMonth ? String(startMonth).trim() : null,
      endMonth: endMonth ? String(endMonth).trim() : null,
      displayOrder: Number(displayOrder) || 0,
      ui,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    await rule.save();

    return res.status(201).json({ ok: true, mensaje: "Regla creada", rule });
  } catch (error: any) {
    console.log("createIncentiveRule error:", error);
    return res.status(500).json({
      ok: false,
      mensaje:
        error?.code === 11000
          ? "Ya existe una regla con ese code/version en este programa."
          : "¡Ups! Algo salió mal",
      error,
    });
  }
};

const getIncentiveRules = async (req: any, res: Response) => {
  try {
    const { programId, active } = req.query;

    const query: any = { isDeleted: false };
    if (programId && Types.ObjectId.isValid(String(programId))) {
      query.program = new Types.ObjectId(String(programId));
    }
    if (String(active).toLowerCase() === "true") query.isActive = true;
    if (String(active).toLowerCase() === "false") query.isActive = false;

    const rules = await IncentiveRule.find(query)
        .populate("program")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({ ok: true, mensaje: "Reglas", rules });
  } catch (error) {
    console.log("getIncentiveRules error:", error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "¡Ups! Algo salió mal", error });
  }
};

const getIncentiveRuleById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const rule = await IncentiveRule.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate("program")
      .lean();

    if (!rule) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Regla no encontrada." });
    }

    return res.status(200).json({ ok: true, mensaje: "Regla", rule });
  } catch (error) {
    console.log("getIncentiveRuleById error:", error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "¡Ups! Algo salió mal", error });
  }
};

const updateIncentiveRule = async (req: any, res: Response) => {
  try {
    if (!requireManagerOrSuperAdmin(req, res)) return;
    const { id } = req.params;

    const rule = await IncentiveRule.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!rule) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Regla no encontrada." });
    }

    const body = req.body || {};

    // Nota: si cambias config “de verdad” en producción, lo ideal es crear una nueva versión.
    // Aquí permitimos update directo por simplicidad.
    const fields = [
      "name",
      "code",
      "description",
      "appliesTo",
      "scopeType",
      "deliveryChannel",
      "rewardKind",
      "rewardAmount",
      "rewardCurrency",
      "rewardLabel",
      "ruleType",
      "metricSource",
      "config",
      "version",
      "rootRule",
      "startMonth",
      "endMonth",
      "displayOrder",
      "ui",
      "isActive",
    ] as const;

    for (const f of fields) {
      if (body[f] !== undefined) {
        // @ts-ignore
        rule[f] = f === "code" ? String(body[f]).trim().toUpperCase() : body[f];
      }
    }

    rule.updatedBy = req.user?._id;

    await rule.save();

    return res
      .status(200)
      .json({ ok: true, mensaje: "Regla actualizada", rule });
  } catch (error: any) {
    console.log("updateIncentiveRule error:", error);
    return res.status(500).json({
      ok: false,
      mensaje:
        error?.code === 11000
          ? "Ya existe una regla con ese code/version en este programa."
          : "¡Ups! Algo salió mal",
      error,
    });
  }
};

const deleteIncentiveRule = async (req: any, res: Response) => {
  try {
    if (!requireManagerOrSuperAdmin(req, res)) return;
    const { id } = req.params;

    const rule = await IncentiveRule.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!rule) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Regla no encontrada." });
    }

    rule.isDeleted = true;
    rule.isActive = false;
    rule.updatedBy = req.user?._id;

    await rule.save();

    return res
      .status(200)
      .json({ ok: true, mensaje: "Regla eliminada", ruleId: id });
  } catch (error) {
    console.log("deleteIncentiveRule error:", error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "¡Ups! Algo salió mal", error });
  }
};

export {
  createIncentiveRule,
  getIncentiveRules,
  getIncentiveRuleById,
  updateIncentiveRule,
  deleteIncentiveRule,
};
