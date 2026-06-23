import { Request, Response } from "express";
import IncomeTaxRD from "../../model/employee-payment-management/incomeTaxRD";

const createIncomeTaxRD = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const record = await IncomeTaxRD.create(data);

    res.status(201).json({
      ok: true,
      mensaje: "Tabla ISR creada correctamente",
      record,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error creando tabla ISR",
      error,
    });
  }
};

const getIncomeTaxRD = async (req: Request, res: Response) => {
  try {
    const records = await IncomeTaxRD.find({ isDeleted: false }).sort({
      year: -1,
      version: -1,
    });

    res.json({
      ok: true,
      records,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error obteniendo tablas ISR",
      error,
    });
  }
};

const getActiveIncomeTaxByYear = async (req: Request, res: Response) => {
  try {
    const { year } = req.params;

    const record = await IncomeTaxRD.findOne({
      year: Number(year),
      isActive: true,
      isDeleted: false,
    }).sort({ version: -1 });

    if (!record) {
      return res.status(404).json({
        ok: false,
        mensaje: "No existe tabla ISR activa para ese año",
      });
    }

    res.json({
      ok: true,
      record,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error obteniendo tabla ISR",
      error,
    });
  }
};

const updateIncomeTaxRD = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const record = await IncomeTaxRD.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!record) {
      return res.status(404).json({
        ok: false,
        mensaje: "Tabla ISR no encontrada",
      });
    }

    res.json({
      ok: true,
      mensaje: "Tabla ISR actualizada",
      record,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error actualizando tabla ISR",
      error,
    });
  }
};

const deleteIncomeTaxRD = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const record = await IncomeTaxRD.findByIdAndUpdate(
      id,
      { isDeleted: true, isActive: false },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({
        ok: false,
        mensaje: "Tabla ISR no encontrada",
      });
    }

    res.json({
      ok: true,
      mensaje: "Tabla ISR eliminada",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error eliminando tabla ISR",
      error,
    });
  }
};

export {
  createIncomeTaxRD,
  getIncomeTaxRD,
  getActiveIncomeTaxByYear,
  updateIncomeTaxRD,
  deleteIncomeTaxRD,
};
