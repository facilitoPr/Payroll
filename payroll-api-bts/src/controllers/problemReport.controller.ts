import { Request, Response } from "express";
import { Types } from "mongoose";
import ProblemReport from "../model/problemReport";
import Comercial from "../model/comercial/comercial";
import Status, { status } from "../model/status";
import { CustomRequest } from "../types/CustomRequest";
import { getSocketIO } from "../config/socket";
import { notifyDepartmentManagers } from "../services/notification.service";
import Department from "../model/rrhh/department";

const isValidObjectId = (id?: string) => !!id && Types.ObjectId.isValid(id);

const normalizeDate = (d: any) => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt;
};

const createProblemReport = async (req: any, res: Response) => {
  try {
    const io = getSocketIO();
    const { comercial = null, reminder = null, date, note } = req.body;

    if (reminder && !isValidObjectId(reminder)) {
      return res.status(400).send({
        ok: false,
        mensaje: "El ID de reminder no es válido",
      });
    }

    const dateObj = normalizeDate(date);
    if (!dateObj) {
      return res.status(400).send({
        ok: false,
        mensaje: "La fecha es requerida o no es válida",
      });
    }

    if (!note || String(note).trim().length < 5) {
      return res.status(400).send({
        ok: false,
        mensaje: "La nota es requerida (mínimo 5 caracteres)",
      });
    }

    const status: status = await Status.findOne({ code: "PENDING" });
    if (!status) {
      return res.status(400).send({
        ok: false,
        mensaje: "Status not found",
      });
    }

    const payload: any = {
      comercial,
      reminder: reminder ?? null,
      date: dateObj,
      note: String(note).trim(),
      status: status._id,
      createdBy: req.user?._id || undefined,
    };

    const department = await Department.findOne({
      code: "TRIPLE_S",
      isDeleted: false,
      isActive: true,
    });

    if (!department) {
      return res.status(400).send({
        ok: false,
        mensaje: "Error al encontrar departamento Triple S",
      });
    }

    const comercialData = await Comercial.findOne({ _id: comercial }).select(
      "_id MemberFullname memberIdentificationNumber",
    );
    if (!comercialData) {
      return res.status(400).send({
        ok: false,
        mensaje: "Este paciente no existe",
      });
    }

    const report = await ProblemReport.create(payload);

    await notifyDepartmentManagers({
      departmentId: department._id,
      type: "TRIPLE_S_ERROR_REPORT",
      severity: "INFO",
      title: "Un nuevo error ha sido reportado",
      message: `Se ha reportado un error del paciente: ${comercialData.MemberFullname}`,
      entityType: "ProblemReport",
      entityId: report._id,
      createdBy: req.user._id,
      link: `/errorReports?id=${String(report._id)}`,
    });

    // io.to(`role:ADMIN`).emit(`problemReport:created`, { data: report });

    return res.status(201).send({
      ok: true,
      mensaje: "Reporte creado correctamente",
      report,
    });
  } catch (error) {
    console.error("[createProblemReport] ", error);
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal al crear el reporte",
      error,
    });
  }
};

const getProblemReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({
        ok: false,
        mensaje: "El ID del reporte no es válido",
      });
    }

    // populate opcional por query (?populate=true)
    const { populate } = req.query as { populate?: string };
    const baseQuery = ProblemReport.findById(id);

    if (populate === "true") {
      baseQuery
        .populate("comercial")
        .populate("reminder")
        .populate("createdBy", "name email");
    }

    const report = await baseQuery.lean();

    if (!report) {
      return res.status(404).send({
        ok: false,
        mensaje: "Reporte no encontrado",
      });
    }

    return res.status(200).send({
      ok: true,
      mensaje: "Reporte obtenido correctamente",
      report,
    });
  } catch (error) {
    console.error("[getProblemReportById] ", error);
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal al obtener el reporte",
      error,
    });
  }
};

const getProblemReports = async (req: Request, res: Response) => {
  try {
    const { limit, initial } = req.params;

    const limitNum = parseInt(String(limit)) || 10;
    const initialNum = parseInt(String(initial)) || 0;

    const q: any = { isDeleted: false };

    const [reports, count] = await Promise.all([
      ProblemReport.find(q)
        .sort({ createdAt: -1, _id: -1 }) // más recientes primero
        .skip(initialNum)
        .limit(limitNum)
        .populate("comercial")
        .populate("reminder")
        .populate("status")
        .populate("createdBy", "name email")
        .lean(),
      ProblemReport.countDocuments(q),
    ]);

    await ProblemReport.updateMany({ isRead: true });

    return res.status(200).send({
      ok: true,
      mensaje: "Reportes obtenidos correctamente",
      count,
      reports,
    });
  } catch (error) {
    console.error("[getProblemReports] ", error);
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal al listar los reportes",
      error,
    });
  }
};
const getProblemReportsCountNonRead = async (req: Request, res: Response) => {
  try {
    const count = await ProblemReport.count({ isRead: false });

    return res.status(200).send({
      ok: true,
      count,
    });
  } catch (error) {
    console.error("[getProblemReports] ", error);
    return res.status(500).send({
      ok: false,
    });
  }
};

const getReportStatus = async (req: Request, res: Response) => {
  try {
    const codes = [
      "PENDING",
      "PROCESSING",
      "DOCUMENTED",
      "TRAINING",
      "FINISHED",
    ];
    const status = await Status.find({ code: codes });

    res.status(200).send({
      ok: true,
      status,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const updateProblemReport = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ ok: false, mensaje: "ID inválido" });
    }

    const { reviewNote, code } = req.body;

    if (!code) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "Status es requerido" });
    }

    const status = await Status.findOne({ code });
    if (!status) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ha ocurrido un error al actualizar error",
      });
    }

    // Lo que subió el middleware
    const images = req.uploaded?.images || [];
    const files = req.uploaded?.files || [];

    const $set: any = {};
    const $push: any = {};

    if (reviewNote) $set.reviewNote = reviewNote;
    $set.status = status._id;

    if (images.length) $push.images = { $each: images };
    if (files.length) $push.files = { $each: files };

    const updateOps: any = {};
    if (Object.keys($set).length) updateOps.$set = $set;
    if (Object.keys($push).length) updateOps.$push = $push;

    const updated = await ProblemReport.findByIdAndUpdate(id, updateOps, {
      new: true,
      lean: true,
    })
      .populate("comercial")
      .populate("reminder")
      .populate("createdBy", "name email");

    if (!updated) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Reporte no encontrado" });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Reporte actualizado correctamente",
      report: updated,
    });
  } catch (error) {
    console.error("[updateProblemReport] ", error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

export {
  createProblemReport,
  getProblemReportById,
  getProblemReports,
  getReportStatus,
  updateProblemReport,
  getProblemReportsCountNonRead,
};
