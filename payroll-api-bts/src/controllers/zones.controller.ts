import { Request, Response } from "express";
import Zones, { zone } from "../model/zones";

const createZone = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;
    const createZone: zone = await new Zones({ ...data });
    await createZone.save();

    res.status(201).send({
      ok: true,
      zone: createZone,
      mensaje: "Zona creado con éxito",
      message: "Zona created successfully",
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

const getZones = async (req: Request, res: Response) => {
  try {
    const zones = await Zones.find({ isDeleted: false });

    res.status(200).send({
      ok: true,
      zones,
      mensaje: "Todos las zones",
      message: "All zones",
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

const getZonesActived = async (req: Request, res: Response) => {
  try {
    const zones = await Zones.find({ isDeleted: false, isActived: true });

    res.status(200).send({
      ok: true,
      zones,
      mensaje: "Todos las zones",
      message: "All zones",
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

const updateZone = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const { ...data } = req.body;
    const zone = await Zones.updateOne({ _id }, data);

    res.status(201).send({
      ok: true,
      zone,
      mensaje: "Zona actualizada con éxito",
      message: "Zone created successfully",
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

const deleteZone = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    await Zones.updateOne({ _id }, { isDeleted: true });

    res.status(201).send({
      ok: true,
      mensaje: "Zona eliminada con éxito",
      message: "Zone deleted successfully",
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

export { createZone, getZones, updateZone, deleteZone, getZonesActived };
