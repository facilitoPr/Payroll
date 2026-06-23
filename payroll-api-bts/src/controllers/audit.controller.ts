import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import AuditLog from "../model/auditLog";
import User from "../model/account/user";
import { parseDateRange, toNum } from "../helper/parse";
import { escapeRegex } from "../middlewares/cleanText";

const canManageEmployees = (reqUser: any) => {
  const roleCode = reqUser?.rol?.code || "";
  const deptCode = reqUser?.department?.code || "";
  return (
    roleCode === "SUPERADMIN" || roleCode === "ADMIN" || deptCode === "RRHH"
  );
};

export const getUserAuditLogs = async (req: any, res: Response) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).send({ ok: false, mensaje: "userId inválido" });
    }

    // ✅ permisos básicos (ajústalo a tu lógica real)
    // - admins y RRHH pueden ver cualquiera
    // - si no, solo puede ver sus propios logs
    if (
      !canManageEmployees(req.user) &&
      String(req.user?._id) !== String(userId)
    ) {
      return res.status(403).send({ ok: false, mensaje: "No autorizado" });
    }

    // (Opcional) verificar que el empleado exista
    const exists = await User.exists({ _id: userId, isDeleted: false });
    if (!exists) {
      return res
        .status(404)
        .send({ ok: false, mensaje: "Empleado no encontrado" });
    }

    const limitRaw = toNum(req.query.limit, 20);
    const skipRaw = toNum(req.query.skip, 0);

    const limit = Math.min(Math.max(limitRaw, 1), 200);
    const skip = Math.max(skipRaw, 0);

    const entityType = String(req.query.entityType || "all");
    const action = req.query.action ? String(req.query.action) : "";
    const q = req.query.q ? String(req.query.q).trim() : "";

    const from = req.query.from ? String(req.query.from) : "";
    const to = req.query.to ? String(req.query.to) : "";

    const dr = parseDateRange(from || undefined, to || undefined);
    if (!dr.ok) {
      return res.status(400).send({ ok: false, mensaje: dr.error });
    }

    // =========================
    // MATCH
    // =========================
    const match: any = {
      rootUser: userId,
    };

    // multi-tenant (si tu AuditLog tiene system)
    const systemId = req.user?.systemId || req.user?.system || null;
    if (systemId) match.system = systemId;

    if (entityType && entityType !== "all") match.entityType = entityType;
    if (action) match.action = action;
    if (dr.range) match.createdAt = dr.range;

    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      match.$or = [
        { title: rx },
        { subtitle: rx },
        { note: rx },
        { tags: rx },
        { "changes.path": rx },
        { "changes.label": rx },
      ];
    }

    // =========================
    // Query (count + rows)
    // =========================
    const [count, rows] = await Promise.all([
      AuditLog.countDocuments(match),
      AuditLog.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "entityType entityId action title subtitle tags summary changes note changedBy createdAt context",
        )
        .populate({
          path: "changedBy",
          select: "name email img rol",
          populate: { path: "rol", select: "name code" },
        })
        .lean(),
    ]);

    return res.status(200).send({
      ok: true,
      rows,
      count,
      limit,
      skip,
      hasMore: skip + rows.length < count,
    });
  } catch (error) {
    console.error("getUserAuditLogs error:", error);
    return res.status(500).send({
      ok: false,
      mensaje: "Error al cargar auditoría",
    });
  }
};
