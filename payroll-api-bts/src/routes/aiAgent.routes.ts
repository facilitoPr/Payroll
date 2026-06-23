import express = require("express");
import * as aiAgent from "../controllers/aiAgent.controller";
import { validateJWT } from "../middlewares/validate-jwt";

const aiRouter: any = express.Router();

aiRouter.use(validateJWT);

aiRouter.post("/", aiAgent.createAiAgent);
aiRouter.put("/:id", aiAgent.updateAiAgent);
aiRouter.get("/", aiAgent.getAiAgents);

// DELETE
aiRouter.delete("/:id", aiAgent.deleteAiAgent);

export default aiRouter;
