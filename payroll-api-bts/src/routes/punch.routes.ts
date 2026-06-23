import * as punch from "../controllers/punch/punchType.controller";

const { check } = require("express-validator");
import express = require("express");
import { validarFields } from "../middlewares/validate-fields";
import {  processImagePonche } from "../middlewares/imagen";
import { processUploadsGeneral } from "../middlewares/files";
import { validateJWT } from "../middlewares/validate-jwt";

const punchRouter: any = express.Router();
punchRouter.use(validateJWT);

// POST
punchRouter.post(
  "/createPunchType",
  [
    check("code", "the code is required").not().isEmpty(),
    check("name", "the name is required").not().isEmpty(),
    validarFields,
  ],
  punch.createPunchType,
);

punchRouter.post(
  "/createPunchData",
  
  processImagePonche,
  punch.createPunchData,
);

punchRouter.post(
  "/upsertWorkSummaryDoc",
  
  processUploadsGeneral({ basePrefix: "ponches" }),
  punch.upsertWorkSummaryDoc,
);

punchRouter.delete("/removeWorkSummaryDocFile", punch.removeWorkSummaryDocFile);
// punchRouter.delete("/removePunchImage", punch.removePunchImage);

// removeFile;

punchRouter.get("/getPunchType", punch.getPunchType);
punchRouter.get("/getWorkSummaryDoc", punch.getWorkSummaryDoc);

punchRouter.post(
  "/registrarPonche",
  [processImagePonche],
  punch.registrarPonche,
);

// PUT
punchRouter.put(
  "/uploadPunchImage/:id",
  
  processUploadsGeneral({ basePrefix: "ponches" }),
  punch.uploadPunchImage,
);

punchRouter.put("/updatePunchData",  punch.updatePunchData);
punchRouter.put(
  "/updateWorkSummaryClassification",
  
  punch.updateWorkSummaryClassification,
);
punchRouter.put(
  "/updateWorkSummaryPayrollControl",
  
  punch.updateWorkSummaryPayrollControl,
);

punchRouter.delete(
  "/deletePunchData/:id",
  
  punch.deletePunchData,
);

// GET
punchRouter.get("/getPunchOfDay/:id",  punch.getPunchOfDay);

punchRouter.post(
  "/getPunchesToPayroll",
  
  punch.getPunchesToPayroll,
);

punchRouter.post(
  "/obtenerResumenMensualEmpleado",
  
  punch.obtenerResumenMensualEmpleado,
);

punchRouter.post("/getPunches",  punch.getPunches);

punchRouter.get("/getPunchHistory", punch.getPunchHistory);
punchRouter.get(
  "/getMyPunchHistory",
  
  punch.getMyPunchHistory,
);
punchRouter.get(
  "/getPunchHistoryByDate",
  
  punch.getPunchHistoryByDate,
);
punchRouter.get(
  "/getPunchHistoryByDateGrouped",
  
  punch.getPunchHistoryByDateGrouped,
);

punchRouter.get(
  "/getMyPunchHistoryByDate",
  
  punch.getMyPunchHistoryByDate,
);

punchRouter.post(
  "/cerrarPonchesIncompletosDelDia",
  
  punch.cerrarPonchesIncompletosDelDia,
);

punchRouter.post(
  "/sendLateWarning",
  
  punch.sendLateWarning,
);
punchRouter.post("/addSpecialDays",  punch.addSpecialDays);
punchRouter.post(
  "/getExpectedMinutesForDates",
  
  punch.getExpectedMinutesForDates,
);
punchRouter.put(
  "/updateWorkSummaryDayConfig",
  
  punch.updateWorkSummaryDayConfig,
);

punchRouter.post(
  "/confirmDaysToPay",
  
  punch.confirmDaysToPay,
);

export default punchRouter;
