import * as zone from "../controllers/zones.controller";

const { check } = require("express-validator");
import express = require("express");

const zonesRouter: express.Router = express.Router();
import * as token from "../middlewares/validate-jwt";

// Post

zonesRouter.post(
  "/createZone",
  [
    check("name", "the name is required").not().isEmpty(),
    check("code", "the code is required").not().isEmpty(),
  ],
  [token.validateJWT],
  zone.createZone,
);

// Put

zonesRouter.put(
  "/updateZone/:_id",
  [
    check("name", "the name is required").not().isEmpty(),
    check("code", "the email is required").not().isEmpty(),
  ],
  [token.validateJWT],
  zone.updateZone,
);

// Get

zonesRouter.get("/getZones", [token.validateJWT], zone.getZones);
zonesRouter.get("/getZonesActived", zone.getZonesActived);

// Delete

zonesRouter.delete("/deleteZone/:_id", [token.validateJWT], zone.deleteZone);

export default zonesRouter;
