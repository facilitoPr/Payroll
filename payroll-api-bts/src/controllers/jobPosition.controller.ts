import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { JobPosition, IJobPosition } from "../model/rrhh/jobPosition";
import Project, { IProject } from "../model/rrhh/projects";

const cleanString = (value: any): string => {
  return typeof value === "string" ? value.trim() : "";
};

const cleanUpperString = (value: any): string => {
  return cleanString(value).toUpperCase();
};

const toBoolean = (value: any, defaultValue = true): boolean => {
  if (value === undefined || value === null || value === "")
    return defaultValue;

  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "si", "sí"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }

  return Boolean(value);
};

const toNum = (value: any, defaultValue: number): number => {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) return defaultValue;

  return parsed;
};

const normalizeStringArray = (value: any): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => cleanString(item))
    .filter((item) => item.length > 0);
};

const generateCodeFromName = (name: string): string => {
  return cleanString(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const normalizeJobPositionPayload = (body: any) => {
  const name = cleanString(body.name);

  const code = body.code
    ? cleanUpperString(body.code)
    : generateCodeFromName(name);

  return {
    company: cleanString(body.company),
    department: cleanString(body.department),
    code,
    name,
    description: cleanString(body.description),

    modality: ["Onsite", "Remote", "Hybrid"].includes(body.modality)
      ? body.modality
      : "Onsite",

    employmentType: [
      "FullTime",
      "PartTime",
      "Contract",
      "Internship",
      "Temporary",
    ].includes(body.employmentType)
      ? body.employmentType
      : undefined,

    requirements: normalizeStringArray(body.requirements),
    responsibilities: normalizeStringArray(body.responsibilities),

    isActive:
      body.isActive === undefined ? true : toBoolean(body.isActive, true),
  };
};

const normalizeProjectPayload = (body: any) => {
  const name = cleanString(body.name);

  const code = body.code
    ? cleanUpperString(body.code)
    : generateCodeFromName(name);

  return {
    name,
    code,
    startDate: cleanString(body.startDate),
    endDate: cleanString(body.endDate),
    description: cleanString(body.description),
    isActive:
      body.isActive === undefined ? true : toBoolean(body.isActive, true),
  };
};

const buildJobPositionQuery = (req: Request, onlyActive = false) => {
  const {
    search = "",
    company = "",
    department = "",
    isActive = "",
    modality = "",
    employmentType = "",
  } = req.query as {
    search?: string;
    company?: string;
    department?: string;
    isActive?: string;
    modality?: string;
    employmentType?: string;
  };

  const query: any = {
    isDeleted: false,
  };

  if (onlyActive) {
    query.isActive = true;
  } else {
    if (isActive === "true") query.isActive = true;
    if (isActive === "false") query.isActive = false;
  }

  if (company && isValidObjectId(company)) {
    query.company = company;
  }

  if (department && isValidObjectId(department)) {
    query.department = department;
  }

  if (modality && modality !== "all") {
    query.modality = modality;
  }

  if (employmentType && employmentType !== "all") {
    query.employmentType = employmentType;
  }

  const term = cleanString(search);

  if (term) {
    query.$or = [
      { name: { $regex: term, $options: "i" } },
      { code: { $regex: term, $options: "i" } },
      { description: { $regex: term, $options: "i" } },
      { requirements: { $regex: term, $options: "i" } },
      { responsibilities: { $regex: term, $options: "i" } },
    ];
  }

  return query;
};

const populateJobPosition = (query: any) => {
  return query
    .populate({
      path: "company",
      select: "code legalName tradeName logo logoUrl primaryColor isActive",
    })
    .populate({
      path: "department",
      select: "name code company isActive",
      populate: {
        path: "company",
        select: "code legalName tradeName",
      },
    });
};

const populateProject = (query: any) => {
  return query
    .populate({
      path: "company",
      select: "code legalName tradeName",
    })
    .populate({
      path: "department",
      select: "name code",
    })
    .populate({
      path: "jobPosition",
      select: "name code company department",
    });
};

const attachProjectsCountToJobPositions = async (items: any) => {
  const isArray = Array.isArray(items);
  const list = isArray ? items : items ? [items] : [];

  if (!list.length) {
    return isArray ? [] : null;
  }

  const plainList = list.map((item: any) =>
    typeof item?.toObject === "function" ? item.toObject() : item,
  );

  const ids = plainList.map((item: any) => item._id);

  const stats = await Project.aggregate([
    {
      $match: {
        jobPosition: { $in: ids },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$jobPosition",
        projectsCount: { $sum: 1 },
        activeProjectsCount: {
          $sum: {
            $cond: [{ $eq: ["$isActive", true] }, 1, 0],
          },
        },
        inactiveProjectsCount: {
          $sum: {
            $cond: [{ $eq: ["$isActive", false] }, 1, 0],
          },
        },
      },
    },
  ]);

  const statsMap = new Map(
    stats.map((item: any) => [
      String(item._id),
      {
        projectsCount: item.projectsCount || 0,
        activeProjectsCount: item.activeProjectsCount || 0,
        inactiveProjectsCount: item.inactiveProjectsCount || 0,
      },
    ]),
  );

  const result = plainList.map((item: any) => {
    const counter = statsMap.get(String(item._id)) || {
      projectsCount: 0,
      activeProjectsCount: 0,
      inactiveProjectsCount: 0,
    };

    return {
      ...item,
      ...counter,
    };
  });

  return isArray ? result : result[0];
};

const validateDuplicateJobPositionCode = async ({
  code,
  company,
  department,
  jobPositionId,
}: {
  code: string;
  company: string;
  department: string;
  jobPositionId?: string;
}) => {
  const query: any = {
    code,
    company,
    department,
    isDeleted: false,
  };

  if (jobPositionId) {
    query._id = { $ne: jobPositionId };
  }

  const exists = await JobPosition.findOne(query).lean();

  if (exists) {
    return {
      ok: false,
      mensaje:
        "Ya existe un puesto con ese nombre o código en este departamento.",
    };
  }

  return {
    ok: true,
    mensaje: "",
  };
};

const validateDuplicateProjectCode = async ({
  code,
  jobPosition,
  projectId,
}: {
  code: string;
  jobPosition: string;
  projectId?: string;
}) => {
  const query: any = {
    code,
    jobPosition,
    isDeleted: false,
  };

  if (projectId) {
    query._id = { $ne: projectId };
  }

  const exists = await Project.findOne(query).lean();

  if (exists) {
    return {
      ok: false,
      mensaje: "Ya existe un proyecto con ese nombre en este puesto.",
    };
  }

  return {
    ok: true,
    mensaje: "",
  };
};

// =======================================================
// JOB POSITIONS
// =======================================================

const createJobPosition = async (req: Request, res: Response) => {
  try {
    const data = normalizeJobPositionPayload(req.body);

    if (!data.company || !isValidObjectId(data.company)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes seleccionar una compañía válida.",
      });
    }

    if (!data.department || !isValidObjectId(data.department)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes seleccionar un departamento válido.",
      });
    }

    if (!data.name) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre del puesto es obligatorio.",
      });
    }

    if (!data.code) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se pudo generar el código del puesto.",
      });
    }

    const duplicateValidation = await validateDuplicateJobPositionCode({
      code: data.code,
      company: data.company,
      department: data.department,
    });

    if (!duplicateValidation.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: duplicateValidation.mensaje,
      });
    }

    const jobPosition = await JobPosition.create({
      ...data,
      isDeleted: false,
    });

    const populated = await populateJobPosition(
      JobPosition.findById(jobPosition._id),
    );

    return res.status(201).json({
      ok: true,
      jobPosition: populated,
      jobPositions: populated,
      position: populated,
      data: populated,
      mensaje: "Puesto creado con éxito.",
    });
  } catch (error) {
    console.error("createJobPosition error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
    });
  }
};

const getJobPosition = async (req: Request, res: Response) => {
  try {
    const query = buildJobPositionQuery(req, true);

    const jobPositionsRaw = await populateJobPosition(
      JobPosition.find(query).sort({ name: 1 }),
    );

    const jobPositions =
      await attachProjectsCountToJobPositions(jobPositionsRaw);

    return res.status(200).json({
      ok: true,
      jobPositions,
      positions: jobPositions,
      data: jobPositions,
      mensaje: "Puestos obtenidos con éxito.",
    });
  } catch (error) {
    console.error("getJobPosition error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
    });
  }
};
const getJobPositionAdmin = async (req: Request, res: Response) => {
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

    const query = buildJobPositionQuery(req, false);

    const allowedSortFields = [
      "name",
      "code",
      "modality",
      "employmentType",
      "isActive",
      "createdAt",
      "updatedAt",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "name";
    const sortDirection = descending === "true" ? -1 : 1;

    const [jobPositionsRaw, total] = await Promise.all([
      populateJobPosition(
        JobPosition.find(query)
          .sort({ [safeSortBy]: sortDirection })
          .skip(skip)
          .limit(perPage),
      ),
      JobPosition.countDocuments(query),
    ]);

    const jobPositions =
      await attachProjectsCountToJobPositions(jobPositionsRaw);

    return res.status(200).json({
      ok: true,
      jobPositions,
      positions: jobPositions,
      data: jobPositions,
      pagination: {
        page: currentPage,
        limit: perPage,
        rowsNumber: total,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      mensaje: "Puestos obtenidos con éxito.",
    });
  } catch (error) {
    console.error("getJobPositionAdmin error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
    });
  }
};

const getJobPositionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de puesto inválido.",
      });
    }

    const jobPositionRaw = await populateJobPosition(
      JobPosition.findOne({
        _id: id,
        isDeleted: false,
      }),
    );

    if (!jobPositionRaw) {
      return res.status(404).json({
        ok: false,
        mensaje: "Puesto no encontrado.",
      });
    }

    const jobPosition = await attachProjectsCountToJobPositions(jobPositionRaw);

    return res.status(200).json({
      ok: true,
      jobPosition,
      position: jobPosition,
      data: jobPosition,
      mensaje: "Puesto obtenido con éxito.",
    });
  } catch (error) {
    console.error("getJobPositionById error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
    });
  }
};

const getJobPositionsByCompany = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    if (!isValidObjectId(companyId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de compañía inválido.",
      });
    }

    const jobPositionsRaw = await populateJobPosition(
      JobPosition.find({
        company: companyId,
        isDeleted: false,
        isActive: true,
      }).sort({ name: 1 }),
    );

    const jobPositions =
      await attachProjectsCountToJobPositions(jobPositionsRaw);

    return res.status(200).json({
      ok: true,
      jobPositions,
      positions: jobPositions,
      data: jobPositions,
      mensaje: "Puestos de la compañía obtenidos con éxito.",
    });
  } catch (error) {
    console.error("getJobPositionsByCompany error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
    });
  }
};

const getJobPositionsByDepartment = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;

    if (!isValidObjectId(departmentId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de departamento inválido.",
      });
    }

    const jobPositionsRaw = await populateJobPosition(
      JobPosition.find({
        department: departmentId,
        isDeleted: false,
        isActive: true,
      }).sort({ name: 1 }),
    );

    const jobPositions =
      await attachProjectsCountToJobPositions(jobPositionsRaw);

    return res.status(200).json({
      ok: true,
      jobPositions,
      positions: jobPositions,
      data: jobPositions,
      mensaje: "Puestos del departamento obtenidos con éxito.",
    });
  } catch (error) {
    console.error("getJobPositionsByDepartment error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
    });
  }
};

const updateJobPosition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de puesto inválido.",
      });
    }

    const existing = await JobPosition.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existing) {
      return res.status(404).json({
        ok: false,
        mensaje: "Puesto no encontrado.",
      });
    }

    const data = normalizeJobPositionPayload(req.body);

    if (!data.company || !isValidObjectId(data.company)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes seleccionar una compañía válida.",
      });
    }

    if (!data.department || !isValidObjectId(data.department)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes seleccionar un departamento válido.",
      });
    }

    if (!data.name) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre del puesto es obligatorio.",
      });
    }

    if (!data.code) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se pudo generar el código del puesto.",
      });
    }

    const duplicateValidation = await validateDuplicateJobPositionCode({
      code: data.code,
      company: data.company,
      department: data.department,
      jobPositionId: id,
    });

    if (!duplicateValidation.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: duplicateValidation.mensaje,
      });
    }

    const jobPosition = await populateJobPosition(
      JobPosition.findByIdAndUpdate(
        id,
        {
          ...data,
        },
        { new: true },
      ),
    );

    return res.status(200).json({
      ok: true,
      jobPosition,
      position: jobPosition,
      data: jobPosition,
      mensaje: "Puesto actualizado con éxito.",
    });
  } catch (error) {
    console.error("updateJobPosition error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
    });
  }
};

const deleteJobPosition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de puesto inválido.",
      });
    }

    const jobPosition = await JobPosition.findOneAndUpdate(
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

    if (!jobPosition) {
      return res.status(404).json({
        ok: false,
        mensaje: "Puesto no encontrado.",
      });
    }

    return res.status(200).json({
      ok: true,
      jobPosition,
      position: jobPosition,
      data: jobPosition,
      mensaje: "Puesto eliminado con éxito.",
    });
  } catch (error) {
    console.error("deleteJobPosition error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
    });
  }
};

// =======================================================
// PROJECTS INSIDE JOB POSITION CONTROLLER
// =======================================================

const getProjectsByJobPosition = async (req: Request, res: Response) => {
  try {
    const { jobPositionId } = req.params;

    if (!isValidObjectId(jobPositionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de puesto inválido.",
      });
    }

    const projects = await populateProject(
      Project.find({
        jobPosition: jobPositionId,
        isDeleted: false,
      }).sort({ isActive: -1, name: 1 }),
    );

    return res.status(200).json({
      ok: true,
      projects,
      project: projects,
      data: projects,
      mensaje: "Proyectos obtenidos con éxito.",
    });
  } catch (error) {
    console.error("getProjectsByJobPosition error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error obteniendo proyectos.",
    });
  }
};

const createProjectForJobPosition = async (req: Request, res: Response) => {
  try {
    const { jobPositionId } = req.params;

    if (!isValidObjectId(jobPositionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de puesto inválido.",
      });
    }

    const jobPosition: any = await JobPosition.findOne({
      _id: jobPositionId,
      isDeleted: false,
    }).lean();

    if (!jobPosition) {
      return res.status(404).json({
        ok: false,
        mensaje: "Puesto no encontrado.",
      });
    }

    const data = normalizeProjectPayload(req.body);

    if (!data.name) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre del proyecto es obligatorio.",
      });
    }

    if (!data.startDate) {
      return res.status(400).json({
        ok: false,
        mensaje: "La fecha de inicio es obligatoria.",
      });
    }

    if (!data.code) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se pudo generar el código del proyecto.",
      });
    }

    const duplicateValidation = await validateDuplicateProjectCode({
      code: data.code,
      jobPosition: jobPositionId,
    });

    if (!duplicateValidation.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: duplicateValidation.mensaje,
      });
    }

    const project: IProject = new Project({
      ...data,
      company: jobPosition.company,
      department: jobPosition.department,
      jobPosition: jobPosition._id,
      isDeleted: false,
    });

    await project.save();

    const populated = await populateProject(Project.findById(project._id));

    return res.status(201).json({
      ok: true,
      project: populated,
      data: populated,
      mensaje: "Proyecto creado con éxito.",
    });
  } catch (error) {
    console.error("createProjectForJobPosition error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error creando proyecto.",
    });
  }
};

const updateProjectForJobPosition = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de proyecto inválido.",
      });
    }

    const existing: any = await Project.findOne({
      _id: projectId,
      isDeleted: false,
    }).lean();

    if (!existing) {
      return res.status(404).json({
        ok: false,
        mensaje: "Proyecto no encontrado.",
      });
    }

    const data = normalizeProjectPayload(req.body);

    if (!data.name) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre del proyecto es obligatorio.",
      });
    }

    if (!data.startDate) {
      return res.status(400).json({
        ok: false,
        mensaje: "La fecha de inicio es obligatoria.",
      });
    }

    const duplicateValidation = await validateDuplicateProjectCode({
      code: data.code,
      jobPosition: String(existing.jobPosition),
      projectId,
    });

    if (!duplicateValidation.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: duplicateValidation.mensaje,
      });
    }

    const project = await populateProject(
      Project.findByIdAndUpdate(
        projectId,
        {
          ...data,
        },
        { new: true },
      ),
    );

    return res.status(200).json({
      ok: true,
      project,
      data: project,
      mensaje: "Proyecto actualizado con éxito.",
    });
  } catch (error) {
    console.error("updateProjectForJobPosition error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error actualizando proyecto.",
    });
  }
};

const deleteProjectForJobPosition = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de proyecto inválido.",
      });
    }

    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        isDeleted: false,
      },
      {
        isActive: false,
        isDeleted: true,
      },
      { new: true },
    );

    if (!project) {
      return res.status(404).json({
        ok: false,
        mensaje: "Proyecto no encontrado.",
      });
    }

    return res.status(200).json({
      ok: true,
      project,
      data: project,
      mensaje: "Proyecto eliminado con éxito.",
    });
  } catch (error) {
    console.error("deleteProjectForJobPosition error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "Error eliminando proyecto.",
    });
  }
};

export {
  createJobPosition,
  getJobPosition,
  getJobPositionAdmin,
  getJobPositionById,
  getJobPositionsByCompany,
  getJobPositionsByDepartment,
  updateJobPosition,
  deleteJobPosition,
  getProjectsByJobPosition,
  createProjectForJobPosition,
  updateProjectForJobPosition,
  deleteProjectForJobPosition,
};
