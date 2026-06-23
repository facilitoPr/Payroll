import { Request, Response } from "express";
import RemindersType, { remindersType } from "../model/RemindersTypes";

const createReminderType = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;
    const createReminderType: remindersType = await new RemindersType({
      ...data,
    });
    await createReminderType.save();

    res.status(201).send({
      ok: true,
      remindersType: createReminderType,
      mensaje: "Tipo de recordatorio creado con éxito",
      message: "Reminder type created successfully",
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

const getRemindersTypes = async (req: Request, res: Response) => {
  try {
    const remindersTypes = await RemindersType.find({ isDeleted: false });

    res.status(200).send({
      ok: true,
      remindersTypes,
      mensaje: "Todos las tipos de recordatorios",
      message: "All remindersTypes",
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

const getRemindersTypesForReminders = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;

    const remindersTypes = await RemindersType.find({
      isDeleted: false,
      code: [...data.codes],
    }).sort()

    res.status(200).send({
      ok: true,
      remindersTypes,
      mensaje: "Todos las tipos de recordatorios",
      message: "All remindersTypes",
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

const getRemindersTypesActived = async (req: Request, res: Response) => {
  try {
    const remindersTypes = await RemindersType.find({
      isDeleted: false,
      isActived: true,
    });

    res.status(200).send({
      ok: true,
      remindersTypes,
      mensaje: "Todos las tipos de recordatorios",
      message: "All remindersTypes",
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

const updateReminderType = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const { ...data } = req.body;
    const remindersType = await RemindersType.updateOne({ _id }, data);

    res.status(201).send({
      ok: true,
      remindersType,
      mensaje: "Tipo de recordatorio actualizado con éxito",
      message: "Reminder type updated successfully",
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

const deteleReminderType = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    await RemindersType.updateOne({ _id }, { isDeleted: true });

    res.status(201).send({
      ok: true,
      mensaje: "Tipo de recordatorio eliminado con éxito",
      message: "Reminder type deleted successfully",
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

const getRemindersTypesMobile = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;
    const remindersTypes = await RemindersType.find({
      isActived: true,
      isDeleted: false,
      code: [...data.codes],
    });

    res.status(200).send({
      ok: true,
      remindersTypes,
      mensaje: "Todos las tipos de recordatorios",
      message: "All remindersTypes",
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

export {
  createReminderType,
  getRemindersTypes,
  getRemindersTypesForReminders,
  updateReminderType,
  deteleReminderType,
  getRemindersTypesActived,
  getRemindersTypesMobile,
};
