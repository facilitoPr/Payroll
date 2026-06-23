import * as comercial from "../controllers/comercial.controller";

const { check } = require("express-validator");
import express = require("express");
import * as token from "../middlewares/validate-jwt";
import { uploadComercialFileMiddleware } from "../middlewares/uploadFile";

const ComercialRouter: express.Router = express.Router();

ComercialRouter.post(
  "/uploadComercialFile",
  uploadComercialFileMiddleware,
  comercial.processUploadedComercialFile,
);
ComercialRouter.post(
  "/createComercial/:zona",
  [token.validateJWT],
  comercial.createComercial,
);
ComercialRouter.post(
  "/createComercialDocumentInfo/:zona/:name",
  [token.validateJWT],
  comercial.createComercialDocumentInfo,
);
ComercialRouter.get(
  "/getComercialDocumentInfo",
  [token.validateJWT],
  comercial.getComercialDocumentInfo,
);
ComercialRouter.post(
  "/createComercialComments/:_id",
  [token.validateJWT],
  comercial.createComercialComments,
);
ComercialRouter.post(
  "/createTypeComercialComments",
  [token.validateJWT],
  comercial.createTypeComercialComments,
);
ComercialRouter.post(
  "/createOrGetComercialRelationship/:number1/:number2/:memberIdentificationNumber",
  [token.validateJWT],
  comercial.createOrGetComercialRelationship,
);
ComercialRouter.post(
  "/addOrRemoveMembersToComercialRelationship/:_id",
  [token.validateJWT],
  comercial.addOrRemoveMembersToComercialRelationship,
);
ComercialRouter.post(
  "/createComercialAdditionalComments/:_id",
  [token.validateJWT],
  comercial.createComercialAdditionalComments,
);

ComercialRouter.get(
  "/getComercial/:limit/:initial/:user/:zona",
  [token.validateJWT],
  comercial.getComercial,
);
ComercialRouter.get(
  "/getComercialBySearch/:limit/:initial/:text/:user/:zona",
  [token.validateJWT],
  comercial.getComercialBySearch,
);
ComercialRouter.get(
  "/getComercialByUser/:limit/:initial/:code/:zona",
  [token.validateJWT],
  comercial.getComercialByUser,
);
// ComercialRouter.get("/getComercialByUser/:limit/:initial/:user_id/:code/:zona", [token.validateJWT], comercial.getComercialByUser);

ComercialRouter.get(
  "/getComercialBySearchAndStatus/:limit/:initial/:text/:user/:code",
  [token.validateJWT],
  comercial.getComercialBySearchAndStatus,
);
ComercialRouter.get(
  "/getPatientHistory/:id",
  [token.validateJWT],
  comercial.getPatientHistory,
);
ComercialRouter.get(
  "/getComercialComments/:_id",
  [token.validateJWT],
  comercial.getComercialComments,
);
ComercialRouter.get(
  "/getComercialById/:id",
  [token.validateJWT],
  comercial.getComercialById,
);
ComercialRouter.get(
  "/getTypeComercialComments",
  [token.validateJWT],
  comercial.getTypeComercialComments,
);
ComercialRouter.get(
  "/getLastAppoitmentComercial/:_id/:code",
  [token.validateJWT],
  comercial.getLastAppoitmentComercial,
);
ComercialRouter.get(
  "/getComercialByPhoneNumber/:limit/:initial/:number1/:number2/:memberIdentificationNumber",
  [token.validateJWT],
  comercial.getComercialByPhoneNumber,
);
ComercialRouter.get(
  "/getComercialBySearchRelationship/:text/:_id",
  [token.validateJWT],
  comercial.getComercialBySearchRelationship,
);
ComercialRouter.get(
  "/getComercialAdditionalComments/:_id",
  [token.validateJWT],
  comercial.getComercialAdditionalComments,
);
ComercialRouter.get(
  "/getComercialForExcel/:doc",
  comercial.getComercialForExcel,
);
ComercialRouter.get(
  "/getComercialByIdentificationNumber/:memberIdentificationNumber",
  comercial.getComercialByIdentificationNumber,
);

ComercialRouter.put(
  "/updateTypeComercialComments/:_id",
  [token.validateJWT],
  comercial.updateTypeComercialComments,
);
ComercialRouter.put(
  "/changeStatusComercial/:_id",
  [token.validateJWT],
  comercial.changeStatusComercial,
);
ComercialRouter.delete(
  "/deleteTypeComercialComments/:_id",
  [token.validateJWT],
  comercial.deleteTypeComercialComments,
);

ComercialRouter.put(
  "/updateComercial/:id",
  [token.validateJWT],
  comercial.updateComercial,
);
ComercialRouter.delete(
  "/deleteComercial/:id",
  [token.validateJWT],
  comercial.deleteComercial,
);

export default ComercialRouter;
