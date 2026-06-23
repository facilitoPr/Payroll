export const pickAllowedFields = (payload: any) => {
  const allowed = [
    // Identidad / Branding
    "legalName", // Nombre legal de la empresa (para archivos, recibos)
    "tradeName", // Nombre comercial
    "displayName", // Nombre corto para UI (opcional)
    "taxId", // RNC/Tax ID
    "address", // Dirección
    "phone", // Teléfono
    "email", // Email
    "website", // Website
    "contactName", // Contacto responsable

    "logoUrl", // Logo (URL)
    "coverUrl", // Cover/Banner (URL)
    "primaryColor", // Color primary del theme
    "secondaryColor", // Color secondary del theme

    // Bancario origen (empresa)
    "originBankName", // Nombre banco origen
    "originBankCode", // Código banco (si layout lo requiere)
    "originBankDigit", // Dígito (si aplica)
    "originAccountType", // Tipo cuenta (1 corriente / 2 ahorros)
    "originAccountNumber", // Cuenta origen
    "currency", // Moneda (ej: 214 DOP)

    // Convenios / servicio
    "agreementCode", // Código convenio con banco
    "serviceCode", // Código servicio
    "defaultStatementDescription", // Descripción estado de cuenta

    // Config de archivo
    "bankFileLayoutVersion", // Versión del layout interno
    "fileEncoding", // "utf8" | "latin1"
    "lineEnding", // "LF" | "CRLF"
    "defaultPaddingChar", // "0" | " "
    "notes", // Notas internas
  ];

  const out: any = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, k)) out[k] = payload[k];
  }
  return out;
};
