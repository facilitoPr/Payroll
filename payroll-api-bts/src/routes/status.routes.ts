import * as status from "../controllers/status.controller";

const { check } = require("express-validator");
import express = require("express");

const statusRouter: express.Router = express.Router();
import * as token from "../middlewares/validate-jwt";

statusRouter.post(
  "/createStatus",
  [
    check("name", "the name is required").not().isEmpty(),
    check("code", "the code is required").not().isEmpty(),
  ],
  // [token.validateJWT],
  status.createStatus,
);

statusRouter.get("/getStatus", [token.validateJWT], status.getStatus);
statusRouter.get(
  "/getReminderStatus",
  [token.validateJWT],
  status.getReminderStatus,
);

export default statusRouter;
