import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Department, { IDepartment } from "../model/rrhh/department";
import { toNum } from "../helper/parse";
import { normalizeObjectIdArray } from "../helper/normalize";
import { normalizeDepartmentPayload } from "../helper/code/department/department.normalize";
import { populateDepartment, validateDuplicateCode } from "../services/company/department.service";
import { buildDepartmentQuery } from "../helper/code/department/deparment.build";

const createDepartment = async (req: Request, res: Response) => {
  try {
    const data = normalizeDepartmentPayload(req.body);

    if (!data.company || !isValidObjectId(data.company)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes seleccionar una compañía válida.",
        message: "You must select a valid company.",
      });
    }

    if (!data.name) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre del departamento es obligatorio.",
        message: "Department name is required.",
      });
    }

    if (!data.code) {
      return res.status(400).json({
        ok: false,
        mensaje: "El código del departamento es obligatorio.",
        message: "Department code is required.",
      });
    }

    const duplicateValidation = await validateDuplicateCode({
      code: data.code,
      company: data.company,
    });

    if (!duplicateValidation.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: duplicateValidation.mensaje,
      });
    }

    const department: IDepartment = new Department({
      ...data,
      isDeleted: false,
    });

    await department.save();

    const populated = await populateDepartment(
      Department.findById(department._id),
    );

    return res.status(201).json({
      ok: true,
      department: populated,
      data: populated,
      mensaje: "Departamento creado con éxito.",
      message: "Department created successfully.",
    });
  } catch (error) {
    console.error("createDepartment error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
      message: "Ups! Something went wrong.",
    });
  }
};

const getDepartment = async (req: Request, res: Response) => {
  try {
    const query = buildDepartmentQuery(req, true);

    const departments = await populateDepartment(
      Department.find(query).sort({ name: 1 }),
    );

    return res.status(200).json({
      ok: true,
departments,
      mensaje: "Departamentos obtenidos con éxito.",
      message: "Departments loaded successfully.",
    });
  } catch (error) {
    console.error("getDepartment error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
      message: "Ups! Something went wrong.",
    });
  }
};

const getDepartmentAdmin = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      sortBy = "name",
      descending = "false",
    } = req.query as {
      page?: string;
      limit?: string;
      sortBy?: string;
      descending?: string;
    };

    const currentPage = toNum(page, 1);
    const perPage = toNum(limit, 10);
    const skip = (currentPage - 1) * perPage;

    const query = buildDepartmentQuery(req, false);

    const allowedSortFields = [
      "name",
      "code",
      "isActive",
      "createdAt",
      "updatedAt",
    ];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "name";
    const sortDirection = descending === "true" ? -1 : 1;

    const [department, total] = await Promise.all([
      populateDepartment(
        Department.find(query)
          .sort({ [safeSortBy]: sortDirection })
          .skip(skip)
          .limit(perPage),
      ),
      Department.countDocuments(query),
    ]);

    return res.status(200).json({
      ok: true,
      department,
      departments: department,
      data: department,
      pagination: {
        page: currentPage,
        limit: perPage,
        rowsNumber: total,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      mensaje: "Departamentos obtenidos con éxito.",
      message: "Departments loaded successfully.",
    });
  } catch (error) {
    console.error("getDepartmentAdmin error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
      message: "Ups! Something went wrong.",
    });
  }
};

const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de departamento inválido.",
      });
    }

    const department = await populateDepartment(
      Department.findOne({
        _id: id,
        isDeleted: false,
      }),
    );

    if (!department) {
      return res.status(404).json({
        ok: false,
        mensaje: "Departamento no encontrado.",
      });
    }

    return res.status(200).json({
      ok: true,
      department,
      data: department,
      mensaje: "Departamento obtenido con éxito.",
    });
  } catch (error) {
    console.error("getDepartmentById error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
    });
  }
};

const getDepartmentsByCompany = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    if (!isValidObjectId(companyId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de compañía inválido.",
      });
    }

    const department = await populateDepartment(
      Department.find({
        company: companyId,
        isDeleted: false,
        isActive: true,
      }).sort({ name: 1 }),
    );

    return res.status(200).json({
      ok: true,
      department,
      departments: department,
      data: department,
      mensaje: "Departamentos de la compañía obtenidos con éxito.",
    });
  } catch (error) {
    console.error("getDepartmentsByCompany error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
    });
  }
};

const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de departamento inválido.",
      });
    }

    const existing = await Department.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existing) {
      return res.status(404).json({
        ok: false,
        mensaje: "Departamento no encontrado.",
      });
    }

    const data = normalizeDepartmentPayload(req.body);

    if (!data.company || !isValidObjectId(data.company)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes seleccionar una compañía válida.",
      });
    }

    if (!data.name) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre del departamento es obligatorio.",
      });
    }

    const duplicateValidation = await validateDuplicateCode({
      code: data.code,
      company: data.company,
      departmentId: id,
    });

    if (!duplicateValidation.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: duplicateValidation.mensaje,
      });
    }

    const department = await populateDepartment(
      Department.findByIdAndUpdate(
        id,
        {
          ...data,
        },
        { new: true },
      ),
    );

    return res.status(200).json({
      ok: true,
      department,
      data: department,
      mensaje: "Departamento actualizado con éxito.",
      message: "Department updated successfully.",
    });
  } catch (error) {
    console.error("updateDepartment error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
      message: "Ups! Something went wrong.",
    });
  }
};

const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de departamento inválido.",
      });
    }

    const department = await Department.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        isActive: false,
        isDeleted: true,
      },
      { new: true },
    );

    if (!department) {
      return res.status(404).json({
        ok: false,
        mensaje: "Departamento no encontrado.",
      });
    }

    return res.status(200).json({
      ok: true,
      department,
      data: department,
      mensaje: "Departamento eliminado con éxito.",
      message: "Department deleted successfully.",
    });
  } catch (error) {
    console.error("deleteDepartment error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
      message: "Ups! Something went wrong.",
    });
  }
};

const updateDepartmentManagers = async (req: Request, res: Response) => {
  try {
    const departmentId = req.params.departmentId || req.params.id;
    const { managers } = req.body as { managers?: string[] };

    if (!isValidObjectId(departmentId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de departamento inválido.",
      });
    }

    const safeManagers = normalizeObjectIdArray(managers);

    const department = await populateDepartment(
      Department.findOneAndUpdate(
        {
          _id: departmentId,
          isDeleted: false,
        },
        {
          managers: safeManagers,
        },
        { new: true },
      ),
    );

    if (!department) {
      return res.status(404).json({
        ok: false,
        mensaje: "Departamento no encontrado.",
      });
    }

    return res.status(200).json({
      ok: true,
      department,
      data: department,
      mensaje: "Gerentes actualizados con éxito.",
    });
  } catch (error) {
    console.error("updateDepartmentManagers error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error actualizando gerentes.",
    });
  }
};

export {
  createDepartment,
  getDepartment,
  getDepartmentAdmin,
  getDepartmentById,
  getDepartmentsByCompany,
  updateDepartment,
  deleteDepartment,
  updateDepartmentManagers,
};