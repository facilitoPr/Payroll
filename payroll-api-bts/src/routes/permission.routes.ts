import { Router } from "express";
import { check } from "express-validator";

import * as permission from "../controllers/employee-payment-management/permissions.controller";
import { validateJWT } from "../middlewares/validate-jwt";
import { validarFields } from "../middlewares/validate-fields";

const permissionRouter: any = Router();

permissionRouter.use(validateJWT);

/**
 * Permission types
 */
permissionRouter.get("/types", permission.getPermissionTypes);

permissionRouter.post("/types/bulk", permission.createPermissionTypesBulk);

/**
 * Employee self-service requests
 */
permissionRouter.post(
  "/requests",
  [
    check("permissionType", "permissionType es obligatorio").notEmpty(),
    check("reason", "reason es obligatorio").notEmpty(),
    check("startDate", "startDate es obligatorio").notEmpty(),
    check("category", "category es obligatorio").notEmpty(),
    validarFields,
  ],
  permission.createPermissionRequest,
);

permissionRouter.put(
  "/requests/:id",
  [
    check("id", "El ID de la solicitud no es válido").isMongoId(),
    validarFields,
  ],
  permission.updatePermissionRequest,
);

permissionRouter.get("/requests/mine", permission.getMyPermissionRequests);

permissionRouter.get(
  "/requests/:id/history",
  [
    check("id", "El ID de la solicitud no es válido").isMongoId(),
    validarFields,
  ],
  permission.getPermissionRequestHistory,
);

/**
 * Admin / manager requests
 */
permissionRouter.get("/requests", permission.getPermissionRequests);

permissionRouter.post(
  "/requests/:id/status",
  [
    check("id", "El ID de la solicitud no es válido").isMongoId(),
    check("action", "action es obligatorio").notEmpty(),
    validarFields,
  ],
  permission.changePermissionRequestStatus,
);

export default permissionRouter;
