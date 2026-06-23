import { Router } from "express";
import * as companyProfile from "../controllers/companyProfile.controller";
import { validateJWT } from "../middlewares/validate-jwt";

const companyProfileRouter = Router();

companyProfileRouter.use(validateJWT);

companyProfileRouter.get("/default", companyProfile.getDefaultCompanyProfile);
companyProfileRouter.put(
  "/default",
  companyProfile.upsertDefaultCompanyProfile,
);

// Utilidad/admin
companyProfileRouter.get(
  "/getCompanyProfileById/:id",
  companyProfile.getCompanyProfileById,
);
companyProfileRouter.delete(
  "/deleteCompanyProfile/:id",
  companyProfile.deleteCompanyProfile,
);

export default companyProfileRouter;
