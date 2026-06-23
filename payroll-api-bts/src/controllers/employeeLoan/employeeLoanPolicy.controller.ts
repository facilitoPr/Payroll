import { Request, Response } from "express";
import { Types } from "mongoose";
import EmployeeLoanPolicy from "../../model/employeeLoan/employeeLoanPolicy";
import { toNum } from "../../helper/parse";
import { escapeRegex } from "../../middlewares/cleanText";
import { getQueryBoolean, getQueryString } from "../../helper/request/request.query";
import { validatePolicyPayload } from "../../helper/employeeLoan/employeeLoanPolicy.validate";
import { buildPolicyPayload } from "../../helper/employeeLoan/employeeLoanPolicy.build";

const getEmployeeLoanPolicies = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(toNum(req.query.limit, 10), 1), 200);
    const initial = Math.max(toNum(req.query.initial, 0), 0);

    const text = getQueryString(req.query.text);
    const company = getQueryString(req.query.company);
    const isActive = getQueryBoolean(req.query.isActive);

    const filters: any = {
      isDeleted: false,
    };

    if (company && Types.ObjectId.isValid(company)) {
      filters.company = new Types.ObjectId(company);
    }

    if (typeof isActive === "boolean") {
      filters.isActive = isActive;
    }

    if (text) {
      const regex = new RegExp(escapeRegex(text), "i");

      filters.$or = [
        { name: regex },
        { code: regex },
        { externalProductCode: regex },
      ];
    }

    const [count, policies] = await Promise.all([
      EmployeeLoanPolicy.countDocuments(filters),
      EmployeeLoanPolicy.find(filters)
        .populate("company", "legalName commercialName name code")
        .sort({ createdAt: -1 })
        .skip(initial)
        .limit(limit),
    ]);

    return res.status(200).json({
      ok: true,
      count,
      total: count,
      policies,
      employeeLoanPolicies: policies,
      data: policies,
      meta: {
        total: count,
        limit,
        initial,
        returned: policies.length,
        hasMore: initial + policies.length < count,
      },
      mensaje: "Políticas de préstamos cargadas correctamente.",
      message: "Employee loan policies loaded successfully.",
    });
  } catch (error) {
    console.error("getEmployeeLoanPolicies error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error cargando políticas de préstamos.",
      message: "Error loading employee loan policies.",
    });
  }
};

const createEmployeeLoanPolicy = async (req: Request, res: Response) => {
  try {
    const payload = buildPolicyPayload(req.body);

    const validationError = validatePolicyPayload(payload);

    if (validationError) {
      return res.status(400).json({
        ok: false,
        mensaje: validationError,
        message: validationError,
      });
    }

    const policy = new EmployeeLoanPolicy(payload);

    await policy.save();

    const populated = await EmployeeLoanPolicy.findById(policy._id).populate(
      "company",
      "legalName commercialName name code",
    );

    return res.status(201).json({
      ok: true,
      policy: populated,
      employeeLoanPolicy: populated,
      mensaje: "Política de préstamo creada correctamente.",
      message: "Employee loan policy created successfully.",
    });
  } catch (error: any) {
    console.error("createEmployeeLoanPolicy error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "Ya existe una política con ese código para esa compañía/global.",
        message: "Policy code already exists for this company/global scope.",
      });
    }

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error creando política de préstamo.",
      message: "Error creating employee loan policy.",
    });
  }
};

const updateEmployeeLoanPolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de la política no es válido.",
        message: "Invalid policy ID.",
      });
    }

    const existing = await EmployeeLoanPolicy.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existing) {
      return res.status(404).json({
        ok: false,
        mensaje: "Política de préstamo no encontrada.",
        message: "Employee loan policy not found.",
      });
    }

    const payload = buildPolicyPayload({
      ...existing.toObject(),
      ...req.body,
    });

    const validationError = validatePolicyPayload(payload);

    if (validationError) {
      return res.status(400).json({
        ok: false,
        mensaje: validationError,
        message: validationError,
      });
    }

    const policy = await EmployeeLoanPolicy.findByIdAndUpdate(id, payload, {
      new: true,
    }).populate("company", "legalName commercialName name code");

    return res.status(200).json({
      ok: true,
      policy,
      employeeLoanPolicy: policy,
      mensaje: "Política de préstamo actualizada correctamente.",
      message: "Employee loan policy updated successfully.",
    });
  } catch (error: any) {
    console.error("updateEmployeeLoanPolicy error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "Ya existe una política con ese código para esa compañía/global.",
        message: "Policy code already exists for this company/global scope.",
      });
    }

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error actualizando política de préstamo.",
      message: "Error updating employee loan policy.",
    });
  }
};

const deleteEmployeeLoanPolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de la política no es válido.",
        message: "Invalid policy ID.",
      });
    }

    const policy = await EmployeeLoanPolicy.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        isDeleted: true,
        isActive: false,
      },
      {
        new: true,
      },
    );

    if (!policy) {
      return res.status(404).json({
        ok: false,
        mensaje: "Política de préstamo no encontrada.",
        message: "Employee loan policy not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      policy,
      mensaje: "Política de préstamo eliminada correctamente.",
      message: "Employee loan policy deleted successfully.",
    });
  } catch (error) {
    console.error("deleteEmployeeLoanPolicy error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error eliminando política de préstamo.",
      message: "Error deleting employee loan policy.",
    });
  }
};

export {
  getEmployeeLoanPolicies,
  createEmployeeLoanPolicy,
  updateEmployeeLoanPolicy,
  deleteEmployeeLoanPolicy
}
