export const EMPLOYEE_LOAN_POLICY_CODE =
  process.env.EMPLOYEE_LOAN_POLICY_CODE || "EMPLOYEE_LOAN_POLICY";

export const PRODUCT_CONFIG_SOURCE = String(
  process.env.EMPLOYEE_LOAN_PRODUCT_CONFIG_SOURCE || "LOCAL",
)
  .trim()
  .toUpperCase();

export const PRINCIPAL_PRODUCT_CONFIG_URL = String(
  process.env.PRINCIPAL_EMPLOYEE_LOAN_PRODUCT_CONFIG_URL || "",
).trim();

export const PRINCIPAL_PRODUCT_CONFIG_API_KEY = String(
  process.env.PRINCIPAL_EMPLOYEE_LOAN_PRODUCT_CONFIG_API_KEY || "",
).trim();
