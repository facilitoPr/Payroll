import { Router } from "express";
import { check } from "express-validator";

import * as recruitment from "../controllers/recruitment/recruitment-form.controller";
import * as application from "../controllers/recruitment/recruitmentApplication.controller";
import * as ai from "../controllers/recruitment/recruitmentAi.controller";

import { validateJWT } from "../middlewares/validate-jwt";
import { validarFields } from "../middlewares/validate-fields";
import {
  processDocumentUpload,
  processUploadsAny,
  processUploadsArray,
  processUploadsGeneral,
} from "../middlewares/files";

const recruitmentFormRouter = Router();

recruitmentFormRouter.get(
  "/public/:token",
  recruitment.getRecruitmentFormByToken,
);

// recruitmentFormRouter.use(validateJWT);

recruitmentFormRouter.post(
  "/createRecruitmentForm",
  [
    // check("title", "El título es obligatorio").not().isEmpty(),
    // check("fields", "Debe enviar un arreglo de campos").isArray({ min: 1 }),
    // check("fields.*.key", "Cada campo debe tener 'key'")
    //   .isString()
    //   .not()
    //   .isEmpty(),
    // check("fields.*.groupKey", "Cada campo debe tener 'groupKey'")
    //   .isString()
    //   .not()
    //   .isEmpty(),
    // validarFields,
    // processDocumentUpload,
    processUploadsGeneral({ basePrefix: "recruitment" }),
    validateJWT,
  ],
  recruitment.createRecruitmentForm,
);

recruitmentFormRouter.get(
  "/getRecruitmentForms",
  validateJWT,
  recruitment.getRecruitmentForms,
);

recruitmentFormRouter.get(
  "/getRecruitmentFormById/:id",
  validateJWT,
  recruitment.getRecruitmentFormById,
);

recruitmentFormRouter.put(
  "/updateRecruitmentForm/:id",
  [
    // todos opcionales, pero si vienen se validan un poco
    check("title").optional().isString().withMessage("title debe ser texto"),
    check("fields")
      .optional()
      .isArray({ min: 1 })
      .withMessage("fields debe ser un arreglo con al menos un elemento"),
    check("fields.*.key").optional().isString(),
    check("fields.*.groupKey").optional().isString(),
    check("isActive").optional().isBoolean(),
    validarFields,
    processUploadsGeneral({ basePrefix: "recruitment" }),
    validateJWT,
  ],
  recruitment.updateRecruitmentForm,
);

recruitmentFormRouter.delete(
  "/deleteRecruitmentForm/:id",
  validateJWT,
  recruitment.deleteRecruitmentForm,
);

recruitmentFormRouter.delete(
  "/deleteFormDocument/:id",
  validateJWT,
  recruitment.deleteFormDocument,
);

// APPLICATION

recruitmentFormRouter.post(
  "/submitRecruitmentApplication",
  // TODO: agregar middleware de upload cuando lo tengas listo
  processUploadsAny(),
  application.submitRecruitmentApplication,
);

recruitmentFormRouter.get(
  "/getRecruitmentApplications",
  validateJWT,
  application.getRecruitmentApplications,
);

recruitmentFormRouter.post(
  "/saveApplicationClassification/:id",
  validateJWT,
  application.saveApplicationClassification,
);

recruitmentFormRouter.put(
  "/changeApplicationStatus/:id",
  validateJWT,
  application.changeApplicationStatus,
);

recruitmentFormRouter.post(
  "/scheduleInterview/:id",
  validateJWT,
  application.scheduleInterview,
);

recruitmentFormRouter.put(
  "/updateInterview/:id",
  validateJWT,
  application.updateInterview,
);

recruitmentFormRouter.put(
  "/cancelInterview/:id",
  validateJWT,
  application.cancelInterview,
);

recruitmentFormRouter.put(
  "/saveInterviewEvaluation/:id",
  validateJWT,
  application.saveInterviewEvaluation,
);

recruitmentFormRouter.post(
  "/runRecruitmentAiForApplication/:applicationId",
  validateJWT,
  ai.runRecruitmentAiForApplication,
);

recruitmentFormRouter.get(
  "/getRecruitmentAllApplications",
  validateJWT,
  application.getRecruitmentAllApplications,
);

recruitmentFormRouter.post(
  "/runInterviewAiForApplication/:id",
  validateJWT,
  application.runInterviewAiForApplication,
);

// recruitmentFormRouter.patch(
//   "/applications/:id/status",
//   validateJWT,
//   application.updateRecruitmentApplicationStatus
// );

// recruitmentFormRouter.delete(
//   "/applications/:id",
//   validarFields,
//   application.deleteRecruitmentApplication
// );

export default recruitmentFormRouter;
