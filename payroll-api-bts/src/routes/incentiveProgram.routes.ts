import { Router } from "express";
import { check } from "express-validator";
import { validateJWT } from "../middlewares/validate-jwt";
import { validarFields } from "../middlewares/validate-fields";
import * as incentiveProgram from "../controllers/incentive/incentiveProgram.controller";
import * as incentiveRule from "../controllers/incentive/incentiveRule.controller";
import * as incentiveAchievement from "../controllers/incentive/incentiveAchievement.controller";

const incentiveProgramRouter = Router();

incentiveProgramRouter.use(validateJWT);

// PROGRAM

incentiveProgramRouter.get(
  "/getIncentivePrograms",
  incentiveProgram.getIncentivePrograms,
);
incentiveProgramRouter.post(
  "/recalcIncentivesMonth",
  incentiveProgram.recalcIncentivesMonth,
);
incentiveProgramRouter.get(
  "/getIncentiveProgramById/:id",
  [check("id", "ID inválido").isMongoId(), validarFields],
  incentiveProgram.getIncentiveProgramById,
);
incentiveProgramRouter.post(
  "/createIncentiveProgram",
  [
    check("name", "name es requerido").not().isEmpty(),
    check("code", "code es requerido").not().isEmpty(),
    check("startMonth", "startMonth es requerido (YYYY-MM)").matches(
      /^\d{4}-\d{2}$/,
    ),
    // endMonth opcional
    validarFields,
  ],
  incentiveProgram.createIncentiveProgram,
);

incentiveProgramRouter.put(
  "/updateIncentiveProgram/:id",
  [
    check("id", "ID inválido").isMongoId(),
    // si mandan startMonth o endMonth, validar formato
    check("startMonth")
      .optional()
      .matches(/^\d{4}-\d{2}$/),
    check("endMonth")
      .optional()
      .matches(/^\d{4}-\d{2}$/),
    validarFields,
  ],
  incentiveProgram.updateIncentiveProgram,
);

incentiveProgramRouter.delete(
  "/deleteIncentiveProgram/:id",
  [check("id", "ID inválido").isMongoId(), validarFields],
  incentiveProgram.deleteIncentiveProgram,
);

// RULE

incentiveProgramRouter.get(
  "/getIncentiveRules",
  incentiveRule.getIncentiveRules,
);
incentiveProgramRouter.get(
  "/getIncentiveRules/:id",
  [check("id", "ID inválido").isMongoId(), validarFields],
  incentiveRule.getIncentiveRuleById,
);

incentiveProgramRouter.post(
  "/createIncentiveRule",
  [
    check("program", "program es requerido").isMongoId(),
    check("name", "name es requerido").not().isEmpty(),
    check("code", "code es requerido").not().isEmpty(),

    check("appliesTo", "appliesTo inválido").isIn([
      "operator",
      "leader",
      "team",
    ]),
    check("scopeType", "scopeType inválido").isIn([
      "user",
      "locality",
      "department",
      "team",
    ]),
    check("deliveryChannel", "deliveryChannel inválido").isIn([
      "payroll",
      "manual_cash",
      "perk",
      "label_only",
    ]),
    check("rewardKind", "rewardKind inválido").isIn(["money", "perk"]),
    check("ruleType", "ruleType inválido").isIn([
      "count",
      "ratio",
      "composition",
      "leaderboard",
    ]),
    check("metricSource", "metricSource inválido").isIn([
      "reminders",
      "attendance",
      "custom",
    ]),

    // config es requerido (puede ser {})
    check("config", "config es requerido").exists(),

    // startMonth/endMonth opcionales
    check("startMonth")
      .optional()
      .matches(/^\d{4}-\d{2}$/),
    check("endMonth")
      .optional()
      .matches(/^\d{4}-\d{2}$/),

    validarFields,
  ],
  incentiveRule.createIncentiveRule,
);

incentiveProgramRouter.put(
  "/updateIncentiveRule/:id",
  [
    check("id", "ID inválido").isMongoId(),
    check("startMonth")
      .optional()
      .matches(/^\d{4}-\d{2}$/),
    check("endMonth")
      .optional()
      .matches(/^\d{4}-\d{2}$/),
    validarFields,
  ],
  incentiveRule.updateIncentiveRule,
);

incentiveProgramRouter.delete(
  "/deleteIncentiveRule/:id",
  [check("id", "ID inválido").isMongoId(), validarFields],
  incentiveRule.deleteIncentiveRule,
);

// ACHIVEMENT

incentiveProgramRouter.get(
  "/getMyAchievementsByMonth",
  incentiveAchievement.getMyAchievementsByMonth,
);
// getAchievementsManager;
incentiveProgramRouter.get(
  "/getAttendanceBreakdown/:userId",
  incentiveAchievement.getAttendanceBreakdown,
);
incentiveProgramRouter.get(
  "/getRemindersBucketBreakdown",
  incentiveAchievement.getRemindersBucketBreakdown,
);
incentiveProgramRouter.get(
  "/getRemindersAttendedBreakdown",
  incentiveAchievement.getRemindersAttendedBreakdown,
);
incentiveProgramRouter.get(
  "/getAchievementsManager",
  incentiveAchievement.getIncentiveAchievementsManager,
);
incentiveProgramRouter.patch(
  "/updateAchievementStatus/:id",
  [check("id", "ID inválido").isMongoId(), validarFields],
  incentiveAchievement.updateAchievementStatus,
);

export default incentiveProgramRouter;
