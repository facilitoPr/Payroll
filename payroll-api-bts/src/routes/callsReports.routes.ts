import * as callsReport from "../controllers/callsReports.controller";
import express = require("express");

import * as token from "../middlewares/validate-jwt";
import { uploadComercialFileMiddleware } from "../middlewares/uploadFile";

const callsReportRouter: express.Router = express.Router();

// Post
callsReportRouter.post(
  "/upload",
  [token.validateJWT, uploadComercialFileMiddleware],
  callsReport.processCallsReportFile,
);

callsReportRouter.post(
  "/getCallsReports",
  token.validateJWT,
  callsReport.getCallsReports,
);

callsReportRouter.post(
  "/getTalkingTotals",
  token.validateJWT,
  callsReport.getTalkingTotals,
);

callsReportRouter.post(
  "/exportOutboundAnsweredTalkingExcel",
  token.validateJWT,
  callsReport.exportOutboundAnsweredTalkingExcel,
);

callsReportRouter.post(
  "/exportCallsReportExcel",
  token.validateJWT,
  callsReport.exportCallsReportExcel,
);

callsReportRouter.post(
  "/exportCallsReportDocx",
  token.validateJWT,
  callsReport.exportCallsReportDocx,
);

export default callsReportRouter;
