import { Router } from "express";
import { check } from "express-validator";
import * as disciplinary from "../controllers/disciplinaryAction.controller";
import { validateJWT } from "../middlewares/validate-jwt";
import { validarFields } from "../middlewares/validate-fields";

const disciplinaryActionRouter = Router();

disciplinaryActionRouter.use(validateJWT);

/** Crear 1 */
disciplinaryActionRouter.post(
  "/createDisciplinaryAction",
  [
    check("userId", "userId es requerido").not().isEmpty(),
    // check("punchHistoryId", "workDateString es requerido (YYYY-MM-DD)")
    // .not()
    // .isEmpty(),
    validarFields,
  ],
  disciplinary.createDisciplinaryAction,
);

/** Crear bulk */
disciplinaryActionRouter.post(
  "/createDisciplinaryAction/bulk",
  [
    check("items", "items debe ser un arreglo con al menos 1").isArray({
      min: 1,
    }),
    // validarFields,
  ],
  disciplinary.createDisciplinaryActionsBulk,
);

/** Listar */
disciplinaryActionRouter.get(
  "/listDisciplinaryActions",
  disciplinary.listDisciplinaryActions,
);

/** Detalle */
disciplinaryActionRouter.get(
  "/getDisciplinaryAction/:id",
  disciplinary.getDisciplinaryAction,
);

/** Acuse */
disciplinaryActionRouter.put(
  "/ackDisciplinaryAction/:id",
  [
    check("id", "id inválido").not().isEmpty(),
    // validarFields
  ],
  disciplinary.acknowledgeDisciplinaryAction,
);

/** Soft delete */
disciplinaryActionRouter.delete(
  "/deleteDisciplinaryAction/:id",
  [
    check("id", "id inválido").not().isEmpty(),
    // validarFields
  ],
  disciplinary.deleteDisciplinaryAction,
);

export default disciplinaryActionRouter;
