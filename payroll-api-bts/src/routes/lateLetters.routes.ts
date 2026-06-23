import { Router } from "express";
import { validateJWT } from "../middlewares/validate-jwt";
import {
  previewLateLetters,
  exportLateLetters,
} from "../controllers/punch/lateLetters.controller";

const lateLettersRouter = Router();

lateLettersRouter.use(validateJWT);

lateLettersRouter.post("/preview", previewLateLetters);
lateLettersRouter.post("/export", exportLateLetters);

export default lateLettersRouter;
