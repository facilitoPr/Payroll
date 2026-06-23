import EmployeeLoanProductConfig from "../model/employeeLoan/employeeLoanProductConfig";
import EmployeeLoanIntegrationClient from "../model/employeeLoan/employeeLoanIntegrationClient";

const PRODUCT_CODE = "EMPLOYEE_LOAN_STANDARD";
const GUIMANFER_SYSTEM_CODE = "GUIMANFER_PAYROLL";

/**
 * API key que Guimanfer usará para consultar la API principal.
 *
 * En producción, pásala por variable de entorno:
 * GUIMANFER_LOAN_API_KEY="clave-segura"
 */
const GUIMANFER_API_KEY =
  process.env.GUIMANFER_LOAN_API_KEY || "guimanfer-loan-dev-key-2026";

export const seedEmployeeLoanProviderConfig = async () => {
  console.log("Iniciando seed de configuración de préstamos...");

  /**
   * 1. Crear/actualizar configuración principal del producto de préstamo.
   */
  const productConfig = await EmployeeLoanProductConfig.findOneAndUpdate(
    {
      code: PRODUCT_CODE,
      isDeleted: false,
    },
    {
      $set: {
        name: "Préstamo estándar empleados",
        code: PRODUCT_CODE,
        description:
          "Configuración estándar para préstamos de empleados usando vacaciones como garantía.",

        minLoanAmount: 1000,
        maxLoanAmount: 50000,

        minInstallments: 1,
        maxInstallments: 12,

        interestRate: 18,
        interestRateType: "ANNUAL",
        defaultPaymentFrequency: "BIWEEKLY",

        distributeInterestInInstallments: true,
        amortizePrincipal: true,

        interestBankName: "Banco Popular",
        interestBankCode: "10101070",
        interestAccountNumber: "0000000000",
        interestAccountType: "SAVINGS",
        interestCurrency: "DOP",
        interestBeneficiaryName: "Blue Technology Solution",
        interestBeneficiaryDocument: "",
        interestPaymentInstructions:
          "Depositar los intereses generados por préstamos de empleados a esta cuenta.",

        isDefault: true,
        isActive: true,
        isDeleted: false,
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  );

  /**
   * Si esta configuración es default, desmarcamos otras configuraciones default.
   */
  await EmployeeLoanProductConfig.updateMany(
    {
      _id: { $ne: productConfig._id },
      isDeleted: false,
    },
    {
      $set: {
        isDefault: false,
      },
    },
  );

  console.log("Producto de préstamo creado/actualizado:", productConfig.code);

  /**
   * 2. Crear integración para Guimanfer.
   *
   * Importante:
   * - Si ya existe, NO reseteamos la apiKey automáticamente.
   * - Si no existe, se crea con apiKeyHash en texto plano y el pre('save')
   *   del modelo la convierte a hash.
   */
  let guimanferClient = await EmployeeLoanIntegrationClient.findOne({
    systemCode: GUIMANFER_SYSTEM_CODE,
    isDeleted: false,
  });

  if (!guimanferClient) {
    guimanferClient = new EmployeeLoanIntegrationClient({
      systemCode: GUIMANFER_SYSTEM_CODE,
      name: "Guimanfer Payroll",
      description:
        "Integración autorizada para que Guimanfer consulte configuraciones de préstamos desde el sistema principal.",

      apiKeyHash: GUIMANFER_API_KEY,

      allowedProductCodes: [PRODUCT_CODE],

      canQuote: true,
      canCreateRequests: true,
      canCheckStatus: true,

      allowedOrigins: [],
      allowedIps: [],

      expiresAt: null,
      lastUsedAt: null,
      usageCount: 0,

      isActive: true,
      isDeleted: false,
    });

    await guimanferClient.save();

    console.log("Integración Guimanfer creada.");
    console.log("API KEY PARA GUIMANFER:", GUIMANFER_API_KEY);
    console.log(
      "Guarda esta API key. Luego no se podrá recuperar porque queda hasheada.",
    );
  } else {
    guimanferClient.name = "Guimanfer Payroll";
    guimanferClient.description =
      "Integración autorizada para que Guimanfer consulte configuraciones de préstamos desde el sistema principal.";

    guimanferClient.allowedProductCodes = [PRODUCT_CODE];

    guimanferClient.canQuote = true;
    guimanferClient.canCreateRequests = true;
    guimanferClient.canCheckStatus = true;

    guimanferClient.isActive = true;
    guimanferClient.isDeleted = false;

    await guimanferClient.save();

    console.log("Integración Guimanfer actualizada.");
    console.log(
      "La API key existente no fue modificada para evitar romper la integración.",
    );
  }

  console.log("Seed de configuración de préstamos finalizado.");

  return {
    productConfig,
    guimanferClient,
  };
};
