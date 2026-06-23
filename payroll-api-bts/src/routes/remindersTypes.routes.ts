import * as reminderType from "../controllers/remindersTypes.controller";

const { check } = require("express-validator");
import express = require("express");

const remindersTypesRouter: express.Router = express.Router();
import * as token from "../middlewares/validate-jwt";

// Post

remindersTypesRouter.post(
  "/createReminderType",
  [
    check("name", "the name is required").not().isEmpty(),
    check("code", "the code is required").not().isEmpty(),
  ],
  // [token.validateJWT],
  reminderType.createReminderType,
);

// Put

remindersTypesRouter.put(
  "/updateReminderType/:_id",
  [
    check("name", "the name is required").not().isEmpty(),
    check("code", "the email is required").not().isEmpty(),
  ],
  [token.validateJWT],
  reminderType.updateReminderType,
);
remindersTypesRouter.post(
  "/getRemindersTypesForReminders",
  [token.validateJWT],
  reminderType.getRemindersTypesForReminders,
);

// Get

remindersTypesRouter.get(
  "/getRemindersTypes",
  [token.validateJWT],
  reminderType.getRemindersTypes,
);
remindersTypesRouter.get(
  "/getRemindersTypesActived",
  [token.validateJWT],
  reminderType.getRemindersTypesActived,
);

// Delete

remindersTypesRouter.delete(
  "/deteleReminderType/:_id",
  [token.validateJWT],
  reminderType.deteleReminderType,
);

export default remindersTypesRouter;
