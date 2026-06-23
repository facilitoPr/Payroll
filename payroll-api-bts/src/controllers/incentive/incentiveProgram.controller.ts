import { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import IncentiveProgram from "../../model/incentive/incentiveProgram";
import { recalcMonth } from "../../services/incentive/incentiveEngine.service";
import User from "../../model/account/user";
import Department from "../../model/rrhh/department";

const requireManagerOrSuperAdmin = (req: any, res: Response) => {
  const user = req.user;
  if (!user?.isManager && !user?.isSuperAdmin) {
    res.status(403).json({ ok: false, mensaje: "No autorizado." });
    return false;
  }
  return true;
};

const createIncentiveProgram = async (req: any, res: Response) => {
  try {
    if (!requireManagerOrSuperAdmin(req, res)) return;

    const {
      name,
      code,
      description = null,
      startMonth,
      endMonth = null,
      scopeCodes = [],
    } = req.body || {};

    const program = new IncentiveProgram({
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      description,
      startMonth: String(startMonth).trim(),
      endMonth: endMonth ? String(endMonth).trim() : null,
      scopeCodes: Array.isArray(scopeCodes) ? scopeCodes : [],

      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    await program.save();

    return res.status(201).json({
      ok: true,
      mensaje: "Programa creado",
      program,
    });
  } catch (error: any) {
    console.log("createIncentiveProgram error:", error);
    return res.status(500).json({
      ok: false,
      mensaje:
        error?.code === 11000
          ? "Ya existe un programa con ese código."
          : "¡Ups! Algo salió mal",
      error,
    });
  }
};

const getIncentivePrograms = async (req: any, res: Response) => {
  try {
    const active = String(req.query.active || "").toLowerCase();

    const query: any = { isDeleted: false };
    if (active === "true") query.isActive = true;
    if (active === "false") query.isActive = false;

    const programs = await IncentiveProgram.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      ok: true,
      mensaje: "Programas",
      programs,
    });
  } catch (error) {
    console.log("getIncentivePrograms error:", error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "¡Ups! Algo salió mal", error });
  }
};

const getIncentiveProgramById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const program = await IncentiveProgram.findOne({
      _id: id,

      isDeleted: false,
    });

    if (!program) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Programa no encontrado." });
    }

    return res.status(200).json({ ok: true, mensaje: "Programa", program });
  } catch (error) {
    console.log("getIncentiveProgramById error:", error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "¡Ups! Algo salió mal", error });
  }
};

const updateIncentiveProgram = async (req: any, res: Response) => {
  try {
    if (!requireManagerOrSuperAdmin(req, res)) return;

    const { id } = req.params;

    const {
      name,
      code,
      description,
      startMonth,
      endMonth,
      scopeCodes,
      isActive,
    } = req.body || {};

    const program = await IncentiveProgram.findOne({
      _id: id,

      isDeleted: false,
    });
    if (!program) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Programa no encontrado." });
    }

    if (name !== undefined) program.name = String(name).trim();
    if (code !== undefined) program.code = String(code).trim().toUpperCase();
    if (description !== undefined) program.description = description;
    if (startMonth !== undefined)
      program.startMonth = String(startMonth).trim();
    if (endMonth !== undefined)
      program.endMonth = endMonth ? String(endMonth).trim() : null;
    if (scopeCodes !== undefined)
      program.scopeCodes = Array.isArray(scopeCodes) ? scopeCodes : [];
    if (isActive !== undefined) program.isActive = !!isActive;

    program.updatedBy = req.user?._id;

    await program.save();

    return res
      .status(200)
      .json({ ok: true, mensaje: "Programa actualizado", program });
  } catch (error: any) {
    console.log("updateIncentiveProgram error:", error);
    return res.status(500).json({
      ok: false,
      mensaje:
        error?.code === 11000
          ? "Ya existe un programa con ese código."
          : "¡Ups! Algo salió mal",
      error,
    });
  }
};

const deleteIncentiveProgram = async (req: any, res: Response) => {
  try {
    if (!requireManagerOrSuperAdmin(req, res)) return;

    const { id } = req.params;

    const program = await IncentiveProgram.findOne({
      _id: id,

      isDeleted: false,
    });
    if (!program) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Programa no encontrado." });
    }

    program.isDeleted = true;
    program.isActive = false;
    program.updatedBy = req.user?._id;

    await program.save();

    return res
      .status(200)
      .json({ ok: true, mensaje: "Programa eliminado", programId: id });
  } catch (error) {
    console.log("deleteIncentiveProgram error:", error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "¡Ups! Algo salió mal", error });
  }
};

const recalcIncentivesMonth = async (req: any, res: Response) => {
  try {
    const { month, programId, userIds } = req.body as {
      month: string;
      programId?: string;
      userIds?: any[];
    };

    if (!month) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "Debes enviar month." });
    }

    let finalUserIds: string[] = [];

    // Si NO envían userIds => usar TRIPLE_S sin managers
    if (!Array.isArray(userIds) || userIds.length === 0) {
      const department = await Department.findOne({
        isActive: true,
        isDeleted: false,
        code: "TRIPLE_S",
      })
        .select("_id managers")
        .lean();

      if (!department) {
        return res
          .status(400)
          .send({ ok: false, mensaje: "Departamento TRIPLE_S no válido" });
      }

      // managers puede ser 1 id o array
      const managersRaw = Array.isArray(department.managers)
        ? department.managers
        : department.managers
          ? [department.managers]
          : [];

      const managerIds = managersRaw
        .map((x: any) => (typeof x === "string" ? x : x?._id || x?.id || x))
        .filter((id: any) => isValidObjectId(id))
        .map((id: any) => new Types.ObjectId(String(id)));

      const query: any = {
        isDeleted: false,
        isActived: true,
        department: department._id,
      };

      // Excluir managers SOLO si hay managers
      if (managerIds.length) {
        query._id = { $nin: managerIds };
      }

      const users = await User.find(query).select("_id").lean();

      finalUserIds = users.map((u: any) => String(u._id));
    } else {
      // Si envían userIds => normalizar/validar
      finalUserIds = userIds;
    }

    const program = await IncentiveProgram.findOne({
      code: "INCENTIVOS_OPERADORES",
    })
      .select("_id")
      .lean();

    const resp = await recalcMonth({
      month,
      programId: program ? String(program._id) : null,
      userIds: finalUserIds,
    });

    return res.status(200).send({ ok: true, ...resp });
  } catch (error: any) {
    console.error("recalcIncentivesMonth error:", error);
    return res.status(500).send({
      ok: false,
      mensaje: error?.message || "Error recalculando incentivos",
    });
  }
};

export {
  createIncentiveProgram,
  getIncentivePrograms,
  getIncentiveProgramById,
  updateIncentiveProgram,
  deleteIncentiveProgram,
  recalcIncentivesMonth,
};
