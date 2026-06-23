import * as jobPosition from "../controllers/jobPosition.controller";

import express = require("express");
import { validarFields } from "../middlewares/validate-fields";
import { validateJWT } from "../middlewares/validate-jwt";

const { check } = require("express-validator");

const jobPositionRouter: any = express.Router();

jobPositionRouter.use(validateJWT);

jobPositionRouter.post(
  "/",
  [
    check("company", "La compañía es obligatoria.").notEmpty(),
    check("company", "La compañía no es válida.").isMongoId(),
    check("department", "El departamento es obligatorio.").notEmpty(),
    check("department", "El departamento no es válido.").isMongoId(),
    check("name", "El nombre es obligatorio.").notEmpty(),
    validarFields,
  ],
  jobPosition.createJobPosition,
);

jobPositionRouter.get("/", jobPosition.getJobPosition);

jobPositionRouter.get("/admin", jobPosition.getJobPositionAdmin);

jobPositionRouter.get(
  "/company/:companyId",
  [
    check("companyId", "El ID de la compañía no es válido.").isMongoId(),
    validarFields,
  ],
  jobPosition.getJobPositionsByCompany,
);

jobPositionRouter.get(
  "/department/:departmentId",
  [
    check("departmentId", "El ID del departamento no es válido.").isMongoId(),
    validarFields,
  ],
  jobPosition.getJobPositionsByDepartment,
);

/**
 * Proyectos del puesto.
 * Van antes de "/:id" para evitar choques con rutas dinámicas.
 */
jobPositionRouter.get(
  "/:jobPositionId/projects",
  [
    check("jobPositionId", "El ID del puesto no es válido.").isMongoId(),
    validarFields,
  ],
  jobPosition.getProjectsByJobPosition,
);

jobPositionRouter.post(
  "/:jobPositionId/projects",
  [
    check("jobPositionId", "El ID del puesto no es válido.").isMongoId(),
    check("name", "El nombre del proyecto es obligatorio.").notEmpty(),
    check("startDate", "La fecha de inicio es obligatoria.").notEmpty(),
    validarFields,
  ],
  jobPosition.createProjectForJobPosition,
);

jobPositionRouter.put(
  "/projects/:projectId",
  [
    check("projectId", "El ID del proyecto no es válido.").isMongoId(),
    check("name", "El nombre del proyecto es obligatorio.").notEmpty(),
    check("startDate", "La fecha de inicio es obligatoria.").notEmpty(),
    validarFields,
  ],
  jobPosition.updateProjectForJobPosition,
);

jobPositionRouter.delete(
  "/projects/:projectId",
  [
    check("projectId", "El ID del proyecto no es válido.").isMongoId(),
    validarFields,
  ],
  jobPosition.deleteProjectForJobPosition,
);

jobPositionRouter.get(
  "/:id",
  [check("id", "El ID del puesto no es válido.").isMongoId(), validarFields],
  jobPosition.getJobPositionById,
);

jobPositionRouter.put(
  "/:id",
  [
    check("id", "El ID del puesto no es válido.").isMongoId(),
    check("company", "La compañía es obligatoria.").notEmpty(),
    check("company", "La compañía no es válida.").isMongoId(),
    check("department", "El departamento es obligatorio.").notEmpty(),
    check("department", "El departamento no es válido.").isMongoId(),
    check("name", "El nombre es obligatorio.").notEmpty(),
    validarFields,
  ],
  jobPosition.updateJobPosition,
);

jobPositionRouter.delete(
  "/:id",
  [check("id", "El ID del puesto no es válido.").isMongoId(), validarFields],
  jobPosition.deleteJobPosition,
);

export default jobPositionRouter;