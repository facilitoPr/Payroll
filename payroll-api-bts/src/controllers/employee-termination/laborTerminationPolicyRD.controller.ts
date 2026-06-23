import { Request, Response } from "express";
import { Types, isValidObjectId } from "mongoose";
import LaborTerminationPolicyRD from "../../model/employee-termination/laborTerminationPolicyRD";
import {
  buildDefaultLaborTerminationPolicyPayload,
  toObjectIdOrNull,
} from "../../helper/employee-termination/employee-termination.build";

const handleError = (res: Response, error: any) => {
  console.error("[LaborTerminationPolicyRDController]", error);

  return res.status(error.status || 500).json({
    ok: false,
    mensaje: error.message || "Error interno del servidor.",
    message: error.message || "Internal server error.",
  });
};

const getLaborTerminationPolicies = async (
  req: Request,
  res: Response,
) => {
  try {
    const { company, year, isActive, page = 1, limit = 20 } = req.query;

    const filter: any = {
      isDeleted: false,
    };

    if (company && isValidObjectId(String(company))) {
      filter.company = new Types.ObjectId(String(company));
    }

    if (year) {
      filter.year = Number(year);
    }

    if (isActive !== undefined) {
      filter.isActive = String(isActive) === "true";
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 20, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const [policies, total] = await Promise.all([
      LaborTerminationPolicyRD.find(filter)
        .sort({ year: -1, version: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      LaborTerminationPolicyRD.countDocuments(filter),
    ]);

    return res.status(200).json({
      ok: true,
      data: policies,
      total,
      page: pageNumber,
      limit: limitNumber,
      pages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getActiveLaborTerminationPolicy = async (
  req: Request,
  res: Response,
) => {
  try {
    const date = req.query.date ? new Date(String(req.query.date)) : new Date();
    const companyId = toObjectIdOrNull(req.query.company);

    const baseQuery = {
      isActive: true,
      isDeleted: false,
      effectiveFrom: { $lte: date },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: date } }],
    };

    let policy = null;

    if (companyId) {
      policy = await LaborTerminationPolicyRD.findOne({
        ...baseQuery,
        company: companyId,
      }).sort({ effectiveFrom: -1, version: -1 });
    }

    if (!policy) {
      policy = await LaborTerminationPolicyRD.findOne({
        ...baseQuery,
        company: null,
      }).sort({ effectiveFrom: -1, version: -1 });
    }

    if (!policy) {
      return res.status(404).json({
        ok: false,
        mensaje: "No existe una política activa de desvinculación laboral.",
      });
    }

    return res.status(200).json({
      ok: true,
      data: policy,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const createLaborTerminationPolicy = async (
  req: Request,
  res: Response,
) => {
  try {
    const body = req.body || {};

    const company = body.company ? new Types.ObjectId(body.company) : null;

    const payload = {
      ...body,
      company,
    };

    if (payload.isActive) {
      await LaborTerminationPolicyRD.updateMany(
        {
          company: company || null,
          isDeleted: false,
          isActive: true,
        },
        {
          $set: {
            isActive: false,
          },
        },
      );
    }

    const policy = await LaborTerminationPolicyRD.create(payload);

    return res.status(201).json({
      ok: true,
      mensaje: "Política creada correctamente.",
      data: policy,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const createDefaultLaborTerminationPolicy = async (
  req: Request,
  res: Response,
) => {
  try {
    const body = req.body || {};

    const company = body.company ? new Types.ObjectId(body.company) : null;
    const year = Number(body.year || new Date().getFullYear());

    const lastPolicy = await LaborTerminationPolicyRD.findOne({
      company,
      year,
      isDeleted: false,
    }).sort({ version: -1 });

    const version = lastPolicy ? Number(lastPolicy.version || 1) + 1 : 1;

    await LaborTerminationPolicyRD.updateMany(
      {
        company,
        isDeleted: false,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
        },
      },
    );

    const payload = buildDefaultLaborTerminationPolicyPayload({
      company,
      year,
      version,
      effectiveFrom: body.effectiveFrom
        ? new Date(body.effectiveFrom)
        : undefined,
      notes: body.notes || "Política creada automáticamente.",
    });

    const policy = await LaborTerminationPolicyRD.create(payload);

    return res.status(201).json({
      ok: true,
      mensaje: "Política por defecto creada correctamente.",
      data: policy,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateLaborTerminationPolicy = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const policy: any = await LaborTerminationPolicyRD.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!policy) {
      return res.status(404).json({
        ok: false,
        mensaje: "Política no encontrada.",
      });
    }

    const body = req.body || {};

    if (body.isActive === true) {
      await LaborTerminationPolicyRD.updateMany(
        {
          _id: { $ne: policy._id },
          company: policy.company || null,
          isDeleted: false,
          isActive: true,
        },
        {
          $set: {
            isActive: false,
          },
        },
      );
    }

    Object.assign(policy, body);

    if (body.company !== undefined) {
      policy.company = body.company ? new Types.ObjectId(body.company) : null;
    }

    await policy.save();

    return res.status(200).json({
      ok: true,
      mensaje: "Política actualizada correctamente.",
      data: policy,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteLaborTerminationPolicy = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const policy = await LaborTerminationPolicyRD.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          isActive: false,
        },
      },
      {
        new: true,
      },
    );

    if (!policy) {
      return res.status(404).json({
        ok: false,
        mensaje: "Política no encontrada.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Política eliminada correctamente.",
      data: policy,
    });
  } catch (error) {
    return handleError(res, error);
  }
};


export {
  getLaborTerminationPolicies,
  getActiveLaborTerminationPolicy,
  createLaborTerminationPolicy,
  createDefaultLaborTerminationPolicy,
  updateLaborTerminationPolicy,
  deleteLaborTerminationPolicy,
};