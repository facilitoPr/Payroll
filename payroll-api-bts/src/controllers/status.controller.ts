import { Request, Response } from "express";
import Status, { status } from "../model/status";

const createStatus = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;
    const createStatus: status = await new Status({ ...data });
    await createStatus.save();

    res.status(201).send({
      ok: true,
      status: createStatus,
      mensaje: "Status creado con éxito",
      message: "Status created successfully",
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

const getStatus = async (req: Request, res: Response) => {
  try {
    const codes = [
      "PATIENTLIST",
      "NOTANSWERED",
      "SCHEDULED",
      "APPOINTMENT",
      "NOINTERESTED",
    ];
    const status = await Status.find({ code: { $in: codes } });

    // Ordena los resultados según el orden en `codes`
    const sortedStatus = status.sort((a, b) => {
      return codes.indexOf(a.code) - codes.indexOf(b.code);
    });

    res.status(200).send({
      ok: true,
      status: sortedStatus,
      mensaje: "Todos los roles",
      message: "All services",
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

const getReminderStatus = async (req: Request, res: Response) => {
  try {
    const codes = ["NOTCONTACTED", "CONFIRMED", "NOTCONFIRMED", "NOTRESPONDED"];
    const codesCompleted = ["RECORDCOMPLETED", "NOTARRIVED", "ARRIVED"];
    const status = await Status.find({ code: codes });
    // const statusCompleted = await Status.find({ code: codesCompleted });

    res.status(200).send({
      ok: true,
      status,
      // statusCompleted,
      mensaje: "Todos los roles",
      message: "All services",
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


export { createStatus, getStatus, getReminderStatus };
