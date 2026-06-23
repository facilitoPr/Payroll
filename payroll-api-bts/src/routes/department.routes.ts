import * as department from "../controllers/department.controller";

import express = require("express");
import { validarFields } from "../middlewares/validate-fields";
import { validateJWT } from "../middlewares/validate-jwt";

const { check } = require("express-validator");

const departmentRouter: any = express.Router();

departmentRouter.use(validateJWT);

departmentRouter.post(
  "/",
  [
    check("company", "La compañía es obligatoria.").notEmpty(),
    check("company", "La compañía no es válida.").isMongoId(),
    check("name", "El nombre es obligatorio.").notEmpty(),
    validarFields,
  ],
  department.createDepartment,
);

departmentRouter.get("/", department.getDepartment);

departmentRouter.get("/admin", department.getDepartmentAdmin);


departmentRouter.get(
  "/company/:companyId",
  [
    check("companyId", "El ID de la compañía no es válido.").isMongoId(),
    validarFields,
  ],
  department.getDepartmentsByCompany,
);

departmentRouter.get(
  "/:id",
  [
    check("id", "El ID del departamento no es válido.").isMongoId(),
    validarFields,
  ],
  department.getDepartmentById,
);

departmentRouter.put(
  "/:id",
  [
    check("id", "El ID del departamento no es válido.").isMongoId(),
    check("company", "La compañía es obligatoria.").notEmpty(),
    check("company", "La compañía no es válida.").isMongoId(),
    check("name", "El nombre es obligatorio.").notEmpty(),
    validarFields,
  ],
  department.updateDepartment,
);

departmentRouter.put(
  "/:departmentId/managers",
  [
    check("departmentId", "El ID del departamento no es válido.").isMongoId(),
    validarFields,
  ],
  department.updateDepartmentManagers,
);


departmentRouter.delete(
  "/:id",
  [
    check("id", "El ID del departamento no es válido.").isMongoId(),
    validarFields,
  ],
  department.deleteDepartment,
);

export default departmentRouter;
