import { Router } from "express";
import { check, param } from "express-validator";
import * as training from "../controllers/training/training.controller";
import * as trainingMe from "../controllers/training/trainingMe.controller";

import { validarFields } from "../middlewares/validate-fields";
import { validateJWT } from "../middlewares/validate-jwt";
import { createUploadFieldsProcessor } from "../middlewares/upload/createUploadFieldsProcessor";

const trainingRouter: any = Router();

trainingRouter.use(validateJWT);

/**
 * =========================
 * RUTAS DEL USUARIO FINAL
 * =========================
 */

trainingRouter.get("/me/assignments", trainingMe.getMyTrainingAssignments);

trainingRouter.get(
  "/me/:trainingId",
  [param("trainingId", "trainingId inválido").isMongoId(), validarFields],
  trainingMe.getMyTrainingDetail,
);

trainingRouter.post(
  "/me/:trainingId/start",
  [param("trainingId", "trainingId inválido").isMongoId(), validarFields],
  trainingMe.startMyTrainingAttempt,
);

trainingRouter.post(
  "/me/attempts/:attemptId/answers",
  [
    param("attemptId", "attemptId inválido").isMongoId(),
    check("questionId", "questionId es obligatorio").isMongoId(),
    validarFields,
  ],
  trainingMe.saveMyTrainingAnswer,
);

trainingRouter.post(
  "/me/attempts/:attemptId/submit",
  [param("attemptId", "attemptId inválido").isMongoId(), validarFields],
  trainingMe.submitMyTrainingAttempt,
);

/**
 * =========================
 * RUTAS ADMINISTRATIVAS
 * =========================
 */

trainingRouter.post(
  "/",
  [
    check("title", "El título es obligatorio").not().isEmpty(),
    check("type", "El tipo es obligatorio").isIn(["LESSON", "QUIZ", "MIXED"]),
    validarFields,
  ],
  training.createTraining,
);

trainingRouter.get("/", training.getTrainings);

trainingRouter.get(
  "/:id",
  [param("id", "ID inválido").isMongoId(), validarFields],
  training.getTrainingById,
);

trainingRouter.put(
  "/:id",
  [param("id", "ID inválido").isMongoId(), validarFields],
  training.updateTraining,
);

trainingRouter.delete(
  "/:id",
  [param("id", "ID inválido").isMongoId(), validarFields],
  training.deleteTraining,
);

trainingRouter.get("/dashboard/metrics", training.getTrainingDashboardMetrics);

trainingRouter.get(
  "/attempts/:attemptId",
  [param("attemptId", "attemptId inválido").isMongoId(), validarFields],
  training.getTrainingAttemptDetail,
);

trainingRouter.get(
  "/me/attempts/:attemptId",
  [param("attemptId", "attemptId inválido").isMongoId(), validarFields],
  trainingMe.getMyTrainingAttemptDetail,
);

/**
 * CONTENIDO
 */
trainingRouter.post(
  "/:trainingId/blocks",
  [
    createUploadFieldsProcessor([
      {
        name: "file",
        maxCount: 1,
        folder: "training/content",
        kind: "file",
      },
    ]),
    param("trainingId", "trainingId inválido").isMongoId(),
    check("type", "El tipo es obligatorio").isIn([
      "TEXT",
      "YOUTUBE",
      "PDF",
      "IMAGE",
      "FILE",
    ]),
    validarFields,
  ],
  training.createTrainingContentBlock,
);

trainingRouter.put(
  "/blocks/:blockId",
  [
    createUploadFieldsProcessor([
      {
        name: "file",
        maxCount: 1,
        folder: "training/content",
        kind: "file",
      },
    ]),
    param("blockId", "blockId inválido").isMongoId(),
    validarFields,
  ],
  training.updateTrainingContentBlock,
);

trainingRouter.delete(
  "/blocks/:blockId",
  [param("blockId", "blockId inválido").isMongoId(), validarFields],
  training.deleteTrainingContentBlock,
);

/**
 * PREGUNTAS
 */
trainingRouter.post(
  "/:trainingId/questions",
  [
    param("trainingId", "trainingId inválido").isMongoId(),
    check("questionText", "El texto de la pregunta es obligatorio")
      .not()
      .isEmpty(),
    check("type", "El tipo es obligatorio").isIn([
      "SHORT_TEXT",
      "LONG_TEXT",
      "SINGLE_CHOICE",
      "MULTIPLE_CHOICE",
      "TRUE_FALSE",
    ]),
    validarFields,
  ],
  training.createTrainingQuestion,
);

trainingRouter.put(
  "/questions/:questionId",
  [param("questionId", "questionId inválido").isMongoId(), validarFields],
  training.updateTrainingQuestion,
);

trainingRouter.delete(
  "/questions/:questionId",
  [param("questionId", "questionId inválido").isMongoId(), validarFields],
  training.deleteTrainingQuestion,
);

/**
 * ASIGNACIONES
 */
trainingRouter.post(
  "/:trainingId/assign-users",
  [
    param("trainingId", "trainingId inválido").isMongoId(),
    check("userIds", "userIds debe ser un arreglo").isArray({ min: 1 }),
    validarFields,
  ],
  training.assignTrainingToUsers,
);

trainingRouter.get(
  "/:trainingId/assignments",
  [param("trainingId", "trainingId inválido").isMongoId(), validarFields],
  training.getTrainingAssignments,
);

trainingRouter.get(
  "/:trainingId/results",
  [param("trainingId", "trainingId inválido").isMongoId(), validarFields],
  training.getTrainingResults,
);

export default trainingRouter;
