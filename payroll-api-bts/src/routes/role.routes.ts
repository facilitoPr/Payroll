import * as rol from "../controllers/role.controller";

const { check } = require("express-validator");
import express = require("express");
import { validateJWT } from "../middlewares/validate-jwt";
const roleRouter: any = express.Router();

roleRouter.use(validateJWT)

roleRouter.post(
  "/",
  [
    check("name", "the name is required").not().isEmpty(),
    check("code", "the code is required").not().isEmpty(),
  ],
  rol.createRole
);

roleRouter.get("/", rol.getRoles);

export default roleRouter;
