import { Router } from "express";
import { check } from "express-validator";
import * as productConfig from "../../controllers/employeeLoan/employeeLoanProductConfig.controller";
import * as integrationClient from "../../controllers/employeeLoan/employeeLoanIntegrationClient.controller";
import { validateJWT } from "../../middlewares/validate-jwt";
import { validarFields } from "../../middlewares/validate-fields";

const employeeLoanProviderConfigRouter: any = Router();

employeeLoanProviderConfigRouter.use(validateJWT);

/**
 * PRODUCT CONFIG
 */

employeeLoanProviderConfigRouter.get(
  "/product-config",
  productConfig.getEmployeeLoanProductConfigs,
);

employeeLoanProviderConfigRouter.get(
  "/product-config/default",
  productConfig.getDefaultEmployeeLoanProductConfig,
);

employeeLoanProviderConfigRouter.post(
  "/product-config",
  [
    check("name", "El nombre es requerido.").notEmpty(),
    check("code", "El código es requerido.").notEmpty(),
    check("maxLoanAmount", "El monto máximo es requerido.").isNumeric(),
    check("interestRate", "La tasa de interés es requerida.").isNumeric(),
    check("interestBankName", "El banco es requerido.").notEmpty(),
    check(
      "interestAccountNumber",
      "El número de cuenta es requerido.",
    ).notEmpty(),
    check(
      "interestBeneficiaryName",
      "El beneficiario es requerido.",
    ).notEmpty(),
    validarFields,
  ],
  productConfig.createEmployeeLoanProductConfig,
);

employeeLoanProviderConfigRouter.put(
  "/product-config/:id",
  [
    check("id", "ID inválido.").isMongoId(),
    check("name", "El nombre es requerido.").optional().notEmpty(),
    check("maxLoanAmount", "El monto máximo debe ser numérico.")
      .optional()
      .isNumeric(),
    check("interestRate", "La tasa de interés debe ser numérica.")
      .optional()
      .isNumeric(),
    validarFields,
  ],
  productConfig.updateEmployeeLoanProductConfig,
);

employeeLoanProviderConfigRouter.delete(
  "/product-config/:id",
  [check("id", "ID inválido.").isMongoId(), validarFields],
  productConfig.deleteEmployeeLoanProductConfig,
);

/**
 * INTEGRATION CLIENTS
 */

employeeLoanProviderConfigRouter.get(
  "/integration-clients",
  integrationClient.getEmployeeLoanIntegrationClients,
);

employeeLoanProviderConfigRouter.post(
  "/integration-clients",
  [
    check("systemCode", "El código del sistema es requerido.").notEmpty(),
    check("name", "El nombre es requerido.").notEmpty(),
    validarFields,
  ],
  integrationClient.createEmployeeLoanIntegrationClient,
);

employeeLoanProviderConfigRouter.put(
  "/integration-clients/:id",
  [
    check("id", "ID inválido.").isMongoId(),
    check("name", "El nombre es requerido.").optional().notEmpty(),
    validarFields,
  ],
  integrationClient.updateEmployeeLoanIntegrationClient,
);

employeeLoanProviderConfigRouter.post(
  "/integration-clients/:id/regenerate-api-key",
  [check("id", "ID inválido.").isMongoId(), validarFields],
  integrationClient.regenerateEmployeeLoanIntegrationApiKey,
);

employeeLoanProviderConfigRouter.delete(
  "/integration-clients/:id",
  [check("id", "ID inválido.").isMongoId(), validarFields],
  integrationClient.deleteEmployeeLoanIntegrationClient,
);

export default employeeLoanProviderConfigRouter;
