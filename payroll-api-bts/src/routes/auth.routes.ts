import * as auth from "../controllers/auth.controller";

const { check } = require("express-validator");
import express = require("express");
import { validateJWT } from "../middlewares/validate-jwt";
import { validarFields } from "../middlewares/validate-fields";
import { body } from "express-validator";

const authRouter: any = express.Router();

authRouter.post(
  "/login",
  [
    check("email", "the email is required").not().isEmpty(),
    check("password", "the code is required").not().isEmpty(),
    validarFields,
  ],
  auth.loginPanel,
);

authRouter.post(
  "/refresh",
  [
    body("deviceId", "deviceId es requerido").notEmpty(),
    body("platform", "platform inválido").isIn(["ios", "android", "web"]),
    validarFields,
  ],
  auth.refresh,
);

authRouter.use(validateJWT);

authRouter.get("/me", auth.getMe);

// LOGOUT (con validateJWT)
authRouter.post(
  "/logout",
  [
    body("deviceId", "deviceId es requerido").notEmpty(),
    body("platform", "platform inválido").isIn(["ios", "android", "web"]),
    validarFields,
  ],
  auth.logout,
);

// LOGOUT ALL (con validateJWT)
authRouter.post("/logout-all", auth.logoutAll);

// DELETE ACCOUNT (soft delete) (con validateJWT)
authRouter.post("/delete-account", auth.deleteAccount);

export default authRouter;
