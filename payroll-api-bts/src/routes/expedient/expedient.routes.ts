import { Router } from "express";
import * as exp from "../../controllers/expedient/expedient.controller";
import * as attch from "../../controllers/expedient/expedientAttachment.controller";
import { validateJWT } from "../../middlewares/validate-jwt";
import { processUploadsGeneral } from "../../middlewares/files";

const expedientRouter = Router();
expedientRouter.use(validateJWT);

expedientRouter.post("/createExpedient", exp.createExpedient);
expedientRouter.post(
  "/addCustomItem/:expedientId",
  validateJWT,
  exp.addCustomItemToExpedient,
);
expedientRouter.put(
  "/updateCustomItemLabel/:expedientId",
  validateJWT,
  exp.updateCustomItemLabel,
);
expedientRouter.post(
  "/deleteCustomItem/:expedientId",
  validateJWT,
  exp.deleteCustomItemFromExpedient,
);

expedientRouter.get("/getExpedient", exp.getExpedient);

expedientRouter.put(
  "/saveExpedientClassification/:expedientId",
  validateJWT,
  processUploadsGeneral({
    folderParamName: "folder",
    basePrefix: "recruitment/expedients",
    maxDocuments: 50,
    maxImages: 50,
  }),
  exp.saveExpedientClassification,
);

// eliminar adjunto (soft delete)
expedientRouter.delete("/deleteAttachment/:id", attch.deleteAttachment);

export default expedientRouter;
