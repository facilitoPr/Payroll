import { Request, Response } from "express";

import SalaryType, {
  ISalaryType,
} from "../../model/employee-payment-management/salaryType";

export const createSalaryType = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;

    const salary: ISalaryType = new SalaryType({
      ...data,
    });

    await salary.save();

    return res.status(201).send({
      ok: true,
      mensaje: "Tipo de salario creado exitosamente",
      message: "Tipo de salario creado exitosamente",
      salary,
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
export const getSalalaryType = async (req: Request, res: Response) => {
  try {
    const salaryType = await SalaryType.find();
    res.status(200).send({
      ok: true,
      salaryType,
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
