import { Router } from "express";
import * as userSession from "../controllers/userSession.controller";
import { validateJWT } from "../middlewares/validate-jwt";

const userSessionRouter: any = Router();

userSessionRouter.use(validateJWT);

userSessionRouter.get("/:userId", userSession.getUserSessions);

userSessionRouter.put("/:sessionId/revoke", userSession.revokeUserSession);

userSessionRouter.put(
  "/user/:userId/revoke-all",
  userSession.revokeAllUserSessions,
);

export default userSessionRouter;
