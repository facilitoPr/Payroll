import * as reminder from "../controllers/reminders.controller";

const { check } = require("express-validator");
import express = require("express");

const remindersRouter: any = express.Router();
import * as token from "../middlewares/validate-jwt";

// Post

remindersRouter.post(
  "/createReminders",
  [
    check("note", "the note is required").not().isEmpty(),
    check("reminderType", "the reminderType is required").not().isEmpty(),
    check("hour", "the hour is required").not().isEmpty(),
    check("date", "the date is required").not().isEmpty(),
  ],
  [token.validateJWT],
  reminder.createReminders,
);

remindersRouter.post(
  "/exportRemindersExcel",
  [token.validateJWT],
  reminder.exportRemindersExcel,
);

//

remindersRouter.post(
  "/getReminders/:limit/:initial",
  [token.validateJWT],
  reminder.getReminders,
);
remindersRouter.post(
  "/getRemindersByOperatorAndDay",
  [token.validateJWT],
  reminder.getRemindersByOperatorAndDay,
);

remindersRouter.post(
  "/getRemindersGroupedByOperator",
  // [token.validateJWT],
  reminder.getRemindersGroupedByOperator,
);
remindersRouter.post(
  "/getRemindersFilterDate",
  [token.validateJWT],
  reminder.getRemindersFilterDate,
);

// Put

remindersRouter.put(
  "/updateReminder/:_id",
  [
    check("note", "the note is required").not().isEmpty(),
    check("reminderType", "the reminderType is required").not().isEmpty(),
    check("hour", "the hour is required").not().isEmpty(),
    check("date", "the date is required").not().isEmpty(),
  ],
  [token.validateJWT],
  reminder.updateReminder,
);

remindersRouter.put(
  "/updateReminderImage/:_id",
  [token.validateJWT],
  reminder.updateReminderImage,
);

// Get

remindersRouter.get(
  "/getRemindersActived",
  [token.validateJWT],
  reminder.getRemindersActived,
);
remindersRouter.get(
  "/getRemindersDates",
  [token.validateJWT],
  reminder.getRemindersDates,
);
remindersRouter.get(
  "/getRemindersSearch/:limit/:initial/:text",
  [token.validateJWT],
  reminder.getRemindersSearch,
);

remindersRouter.get(
  "/getRemindersByComercial/:comercial",
  [token.validateJWT],
  reminder.getRemindersByComercial,
);

// Delete

remindersRouter.delete(
  "/deteleReminder/:_id",
  [token.validateJWT],
  reminder.deteleReminder,
);

export default remindersRouter;
