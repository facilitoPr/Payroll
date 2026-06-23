import { Request, Response } from "express";
import { Types } from "mongoose";
import EmployeeLoanProductConfig from "../../model/employeeLoan/employeeLoanProductConfig";
import { buildProductPayload } from "../../helper/employeeLoan/productConfig/employeeLoanProductConfig.build";
import { validateProductPayload } from "../../helper/employeeLoan/productConfig/employeeLoanProductConfig.validate";

const unsetOtherDefaults = async (currentId: any) => {
  await EmployeeLoanProductConfig.updateMany(
    {
      _id: { $ne: currentId },
      isDeleted: false,
    },
    {
      $set: {
        isDefault: false,
      },
    },
  );
};

const getEmployeeLoanProductConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await EmployeeLoanProductConfig.find({
      isDeleted: false,
    }).sort({
      isDefault: -1,
      isActive: -1,
      createdAt: -1,
    });

    return res.json({
      ok: true,
      configs,
    });
  } catch (error) {
    console.error("[getEmployeeLoanProductConfigs]", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error cargando configuraciones de préstamos.",
    });
  }
};

const getDefaultEmployeeLoanProductConfig = async (
  req: Request,
  res: Response,
) => {
  try {
    const config = await EmployeeLoanProductConfig.findOne({
      isDefault: true,
      isActive: true,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    if (!config) {
      return res.status(404).json({
        ok: false,
        mensaje: "No hay una configuración predeterminada activa.",
      });
    }

    return res.json({
      ok: true,
      config,
    });
  } catch (error) {
    console.error("[getDefaultEmployeeLoanProductConfig]", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error cargando configuración predeterminada.",
    });
  }
};

const createEmployeeLoanProductConfig = async (req: Request, res: Response) => {
  try {
    const payload = buildProductPayload(req.body);
    const validationError = validateProductPayload(payload);

    if (validationError) {
      return res.status(400).json({
        ok: false,
        mensaje: validationError,
      });
    }

    const exists = await EmployeeLoanProductConfig.findOne({
      code: payload.code,
      isDeleted: false,
    });

    if (exists) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ya existe una configuración con ese código.",
      });
    }

    const activeCount = await EmployeeLoanProductConfig.countDocuments({
      isDeleted: false,
    });

    if (activeCount === 0) {
      payload.isDefault = true;
    }

    const config = await EmployeeLoanProductConfig.create(payload);

    if (config.isDefault) {
      await unsetOtherDefaults(config._id);
    }

    return res.status(201).json({
      ok: true,
      mensaje: "Configuración creada correctamente.",
      config,
    });
  } catch (error: any) {
    console.error("[createEmployeeLoanProductConfig]", error);

    return res.status(500).json({
      ok: false,
      mensaje: error?.message || "Error creando configuración.",
    });
  }
};

const updateEmployeeLoanProductConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const config = await EmployeeLoanProductConfig.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!config) {
      return res.status(404).json({
        ok: false,
        mensaje: "Configuración no encontrada.",
      });
    }

    const payload = buildProductPayload({
      ...config.toObject(),
      ...req.body,
      code: config.code,
    });

    const validationError = validateProductPayload(payload);

    if (validationError) {
      return res.status(400).json({
        ok: false,
        mensaje: validationError,
      });
    }

    Object.assign(config, payload);

    await config.save();

    if (config.isDefault) {
      await unsetOtherDefaults(config._id);
    }

    return res.json({
      ok: true,
      mensaje: "Configuración actualizada correctamente.",
      config,
    });
  } catch (error: any) {
    console.error("[updateEmployeeLoanProductConfig]", error);

    return res.status(500).json({
      ok: false,
      mensaje: error?.message || "Error actualizando configuración.",
    });
  }
};

const deleteEmployeeLoanProductConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const config = await EmployeeLoanProductConfig.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!config) {
      return res.status(404).json({
        ok: false,
        mensaje: "Configuración no encontrada.",
      });
    }

    config.isDeleted = true;
    config.isActive = false;
    config.isDefault = false;

    await config.save();

    return res.json({
      ok: true,
      mensaje: "Configuración eliminada correctamente.",
    });
  } catch (error) {
    console.error("[deleteEmployeeLoanProductConfig]", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error eliminando configuración.",
    });
  }
};

export {
  getEmployeeLoanProductConfigs,
  getDefaultEmployeeLoanProductConfig,
  createEmployeeLoanProductConfig,
  updateEmployeeLoanProductConfig,
  deleteEmployeeLoanProductConfig,
};
