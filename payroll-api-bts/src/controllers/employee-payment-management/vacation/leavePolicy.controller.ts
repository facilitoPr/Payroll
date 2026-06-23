import { Request, Response } from "express";
import { Types } from "mongoose";
import LeavePolicy from "../../../model/leavePolicy";
import { getQueryBoolean, getQueryString } from "../../../helper/request/request.query";


const normalizeCompanyValue = (value: unknown) => {
  const rawValue = getQueryString(value);

  if (!rawValue || rawValue === "null" || rawValue === "undefined") {
    return null;
  }

  if (!Types.ObjectId.isValid(rawValue)) {
    return "INVALID_OBJECT_ID";
  }

  return new Types.ObjectId(rawValue);
};

const getVacationPolicies = async (req: Request, res: Response) => {
  try {
    const { limit, initial, text = "", company, isActive } = req.query;

    const filter: Record<string, any> = {
      isDeleted: false,
    };

    const companyValue = getQueryString(company);

    if (companyValue) {
      if (!Types.ObjectId.isValid(companyValue)) {
        return res.status(400).json({
          ok: false,
          mensaje: "El parámetro 'company' no es un ObjectId válido.",
          message: "'company' is not a valid ObjectId.",
        });
      }

      filter.company = new Types.ObjectId(companyValue);
    }

    const activeValue = getQueryBoolean(isActive);

    if (typeof activeValue === "boolean") {
      filter.isActive = activeValue;
    }

    const searchText = getQueryString(text);

    if (searchText) {
      const regex = new RegExp(searchText, "i");

      filter.$or = [{ name: regex }, { code: regex }];
    }

    const hasPagination = limit !== undefined || initial !== undefined;

    let limitNum: number | undefined;
    let initialNum = 0;

    if (hasPagination) {
      if (initial !== undefined) {
        initialNum = Math.max(0, parseInt(String(initial), 10) || 0);
      }

      if (limit !== undefined) {
        const parsedLimit = parseInt(String(limit), 10);

        if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
          return res.status(400).json({
            ok: false,
            mensaje: "El parámetro 'limit' debe ser un número mayor a 0.",
            message: "'limit' must be a number greater than 0.",
          });
        }

        limitNum = Math.min(200, parsedLimit);
      }
    }

    let query = LeavePolicy.find(filter)
      .populate("company", "legalName commercialName name code")
      .sort({ createdAt: -1 });

    if (hasPagination) {
      query = query.skip(initialNum);

      if (limitNum !== undefined) {
        query = query.limit(limitNum);
      }
    }

    const [policies, count] = await Promise.all([
      query,
      LeavePolicy.countDocuments(filter),
    ]);

    return res.status(200).json({
      ok: true,
      count,
      policies,
      pagination: hasPagination
        ? {
            initial: initialNum,
            limit: limitNum ?? null,
          }
        : null,
      mensaje: "Políticas de vacaciones encontradas con éxito",
      message: "Vacation policies found successfully",
    });
  } catch (error) {
    console.log("getVacationPolicies error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const getVacationPolicyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de la política no es válido.",
        message: "Invalid vacation policy ID.",
      });
    }

    const policy = await LeavePolicy.findOne({
      _id: id,
      isDeleted: false,
    }).populate("company", "legalName commercialName name code");

    if (!policy) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró la política de vacaciones.",
        message: "Vacation policy not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      policy,
      mensaje: "Política de vacaciones encontrada con éxito",
      message: "Vacation policy found successfully",
    });
  } catch (error) {
    console.log("getVacationPolicyById error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const createVacationPolicy = async (req: Request, res: Response) => {
  try {
    const {
      company,
      name,
      code,
      defaultDays = 14,
      seniorityDays = 18,
      seniorityYears = 5,
      allowEmployeeOverride = true,
      allowNegativeBalance = false,
      isActive = true,
    } = req.body;

    const normalizedName = String(name || "").trim();
    const normalizedCode = String(code || "")
      .trim()
      .toUpperCase();

    if (!normalizedName) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre de la política es obligatorio.",
        message: "Policy name is required.",
      });
    }

    if (!normalizedCode) {
      return res.status(400).json({
        ok: false,
        mensaje: "El código de la política es obligatorio.",
        message: "Policy code is required.",
      });
    }

    const companyNormalized = normalizeCompanyValue(company);

    if (companyNormalized === "INVALID_OBJECT_ID") {
      return res.status(400).json({
        ok: false,
        mensaje: "La compañía no es un ObjectId válido.",
        message: "Company is not a valid ObjectId.",
      });
    }

    const duplicate = await LeavePolicy.findOne({
      company: companyNormalized,
      code: normalizedCode,
      isDeleted: false,
    });

    if (duplicate) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "Ya existe una política de vacaciones con ese código para esa compañía.",
        message:
          "A vacation policy with that code already exists for that company.",
      });
    }

    const policy = await LeavePolicy.create({
      company: companyNormalized,
      name: normalizedName,
      code: normalizedCode,
      defaultDays: Number(defaultDays || 0),
      seniorityDays: Number(seniorityDays || 0),
      seniorityYears: Number(seniorityYears || 0),
      allowEmployeeOverride: Boolean(allowEmployeeOverride),
      allowNegativeBalance: Boolean(allowNegativeBalance),
      isActive: Boolean(isActive),
      isDeleted: false,
    });

    const populatedPolicy = await LeavePolicy.findById(policy._id).populate(
      "company",
      "legalName commercialName name code",
    );

    return res.status(201).json({
      ok: true,
      policy: populatedPolicy,
      mensaje: "Política de vacaciones creada con éxito",
      message: "Vacation policy created successfully",
    });
  } catch (error: any) {
    console.log("createVacationPolicy error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ya existe una política con ese código.",
        message: "A policy with that code already exists.",
      });
    }

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const updateVacationPolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de la política no es válido.",
        message: "Invalid vacation policy ID.",
      });
    }

    const currentPolicy = await LeavePolicy.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!currentPolicy) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró la política de vacaciones.",
        message: "Vacation policy not found.",
      });
    }

    const updateData: Record<string, any> = {};

    if (Object.prototype.hasOwnProperty.call(req.body, "company")) {
      const companyNormalized = normalizeCompanyValue(req.body.company);

      if (companyNormalized === "INVALID_OBJECT_ID") {
        return res.status(400).json({
          ok: false,
          mensaje: "La compañía no es un ObjectId válido.",
          message: "Company is not a valid ObjectId.",
        });
      }

      updateData.company = companyNormalized;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
      const name = String(req.body.name || "").trim();

      if (!name) {
        return res.status(400).json({
          ok: false,
          mensaje: "El nombre de la política es obligatorio.",
          message: "Policy name is required.",
        });
      }

      updateData.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "code")) {
      const code = String(req.body.code || "")
        .trim()
        .toUpperCase();

      if (!code) {
        return res.status(400).json({
          ok: false,
          mensaje: "El código de la política es obligatorio.",
          message: "Policy code is required.",
        });
      }

      updateData.code = code;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "defaultDays")) {
      updateData.defaultDays = Number(req.body.defaultDays || 0);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "seniorityDays")) {
      updateData.seniorityDays = Number(req.body.seniorityDays || 0);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "seniorityYears")) {
      updateData.seniorityYears = Number(req.body.seniorityYears || 0);
    }

    if (
      Object.prototype.hasOwnProperty.call(req.body, "allowEmployeeOverride")
    ) {
      updateData.allowEmployeeOverride =
        req.body.allowEmployeeOverride === true ||
        req.body.allowEmployeeOverride === "true";
    }

    if (
      Object.prototype.hasOwnProperty.call(req.body, "allowNegativeBalance")
    ) {
      updateData.allowNegativeBalance =
        req.body.allowNegativeBalance === true ||
        req.body.allowNegativeBalance === "true";
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
      updateData.isActive =
        req.body.isActive === true || req.body.isActive === "true";
    }

    const finalCompany = Object.prototype.hasOwnProperty.call(
      updateData,
      "company",
    )
      ? updateData.company
      : currentPolicy.company || null;

    const finalCode = updateData.code || currentPolicy.code;

    const duplicate = await LeavePolicy.findOne({
      _id: { $ne: currentPolicy._id },
      company: finalCompany,
      code: finalCode,
      isDeleted: false,
    });

    if (duplicate) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "Ya existe otra política de vacaciones con ese código para esa compañía.",
        message:
          "Another vacation policy with that code already exists for that company.",
      });
    }

    const policy = await LeavePolicy.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("company", "legalName commercialName name code");

    return res.status(200).json({
      ok: true,
      policy,
      mensaje: "Política de vacaciones actualizada con éxito",
      message: "Vacation policy updated successfully",
    });
  } catch (error: any) {
    console.log("updateVacationPolicy error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ya existe una política con ese código.",
        message: "A policy with that code already exists.",
      });
    }

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const deleteVacationPolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de la política no es válido.",
        message: "Invalid vacation policy ID.",
      });
    }

    const policy = await LeavePolicy.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        isDeleted: true,
        isActive: false,
      },
      { new: true },
    );

    if (!policy) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró la política de vacaciones.",
        message: "Vacation policy not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      policy,
      mensaje: "Política de vacaciones eliminada con éxito",
      message: "Vacation policy deleted successfully",
    });
  } catch (error) {
    console.log("deleteVacationPolicy error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

export {
  getVacationPolicies,
  getVacationPolicyById,
  createVacationPolicy,
  updateVacationPolicy,
  deleteVacationPolicy
}