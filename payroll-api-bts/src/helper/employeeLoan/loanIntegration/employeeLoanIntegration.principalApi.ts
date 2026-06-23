const getEnvironmentValue = (...names: string[]) => {
  for (const name of names) {
    const value = String(process.env[name] || "").trim();

    if (value) {
      return value;
    }
  }

  return "";
};

const getBootstrapUrl = () => {
  return getEnvironmentValue(
    "PRINCIPAL_EMPLOYEE_LOAN_BOOTSTRAP_URL",
    "PRINCIPAL_PRODUCT_CONFIG_URL",
  );
};

const getIntegrationSystemCode = () => {
  return getEnvironmentValue(
    "EMPLOYEE_LOAN_INTEGRATION_SYSTEM_CODE",
    "PRINCIPAL_EMPLOYEE_LOAN_SYSTEM_CODE",
  ).toUpperCase();
};

const getIntegrationApiKey = () => {
  return getEnvironmentValue(
    "PRINCIPAL_PRODUCT_CONFIG_API_KEY",
    "EMPLOYEE_LOAN_INTEGRATION_API_KEY",
  );
};

const getTimeoutMs = () => {
  const configured = Number(
    process.env.PRINCIPAL_EMPLOYEE_LOAN_TIMEOUT_MS || 15000,
  );

  if (!Number.isFinite(configured)) {
    return 15000;
  }

  return Math.max(3000, configured);
};

export const hasEmployeeLoanIntegrationConfiguration = () => {
  return Boolean(
    getBootstrapUrl() && getIntegrationSystemCode() && getIntegrationApiKey(),
  );
};

export const getEmployeeLoanPrincipalBootstrap = async () => {
  const url = getBootstrapUrl();
  const systemCode = getIntegrationSystemCode();
  const apiKey = getIntegrationApiKey();

  if (!url) {
    throw {
      statusCode: 500,
      mensaje:
        "No se configuró PRINCIPAL_EMPLOYEE_LOAN_BOOTSTRAP_URL ni PRINCIPAL_PRODUCT_CONFIG_URL.",
      message: "Missing principal employee loan bootstrap URL.",
    };
  }

  if (!systemCode) {
    throw {
      statusCode: 500,
      mensaje:
        "No se configuró EMPLOYEE_LOAN_INTEGRATION_SYSTEM_CODE en el payroll hijo.",
      message: "Missing employee loan integration system code.",
    };
  }

  if (!apiKey) {
    throw {
      statusCode: 500,
      mensaje:
        "No se configuró PRINCIPAL_PRODUCT_CONFIG_API_KEY en el payroll hijo.",
      message: "Missing principal employee loan integration API key.",
    };
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, getTimeoutMs());

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-system-code": systemCode,
        "x-api-key": apiKey,
      },
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.ok === false) {
      throw {
        statusCode: response.status || 502,
        mensaje:
          data?.mensaje ||
          "No se pudo validar la integración de préstamos contra el principal.",
        message:
          data?.message ||
          "Could not validate employee loan integration against principal.",
      };
    }

    const integration = data?.integration || data?.data?.integration;

    const productConfig =
      data?.productConfig ||
      data?.employeeLoanProductConfig ||
      data?.config ||
      data?.data?.productConfig ||
      data?.data?.employeeLoanProductConfig ||
      data?.data?.config ||
      null;

    if (!integration?.systemCode) {
      throw {
        statusCode: 502,
        mensaje:
          "El principal no devolvió información válida de la integración.",
        message: "Principal API did not return valid integration information.",
      };
    }

    if (!productConfig) {
      throw {
        statusCode: 502,
        mensaje:
          "El principal no devolvió una configuración válida de préstamo.",
        message: "Principal API did not return a valid product config.",
      };
    }

    return {
      integration,
      productConfig,
    };
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw {
        statusCode: 504,
        mensaje:
          "La conexión con el principal excedió el tiempo máximo permitido.",
        message: "Principal employee loan API request timed out.",
      };
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};