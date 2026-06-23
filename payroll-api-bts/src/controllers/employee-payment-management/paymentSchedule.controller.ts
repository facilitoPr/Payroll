import { Request, Response } from "express";

import PaymentSchedule, {
  IPaymentSchedule,
} from "../../model/employee-payment-management/paymentSchedule";
import { getSuggestedPeriodFromSchedule } from "../../helper/payroll/getSuggestedPeriod";

export const createPaymentSchedule = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;

    const paymentSchedule: IPaymentSchedule = new PaymentSchedule({
      ...data,
    });

    await paymentSchedule.save();

    return res.status(201).send({
      ok: true,
      mensaje: "Tipo de salario creado exitosamente",
      message: "Tipo de salario creado exitosamente",
      paymentSchedule,
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

// Obtener todos los registros
export const getAllPaymentSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await PaymentSchedule.find({
      isActive: true,
    })
      .populate("paymentFrequency")
      .select("_id code name payDays weeklyDays isActive description")
      .lean();

    if (!schedules) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "PaymentSchedule no encontrado" });
    }

    const suggested = getSuggestedPeriodFromSchedule({
      payDays: schedules[0].payDays,
      weeklyDays: schedules[0].weeklyDays || [],
    });

    res.status(200).send({
      ok: true,
      schedules,
      suggested,
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

// Actualizar
export const updatePaymentSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ...data } = req.body;

    const updated = await PaymentSchedule.findByIdAndUpdate(
      id,
      { ...data },
      {
        new: true,
      }
    );
    if (!updated) return res.status(404).json({ message: "No encontrado" });
    res.status(200).json({
      ok: true,
      updated,
      mensaje: "pago de horarios modificado exitosamente",
      message: "Tipo de salario creado exitosamente",
    });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar", error });
  }
};

// Eliminar
export const deletePaymentSchedule = async (req: Request, res: Response) => {
  try {
    const deleted = await PaymentSchedule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "No encontrado" });
    res.status(200).json({ message: "Eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar", error });
  }
};
