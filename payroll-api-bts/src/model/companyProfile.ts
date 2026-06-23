import mongoose, { Schema, model } from "mongoose";

export type CompanyAccountType = "1" | "2";
export type CompanyCurrencyCode = "214" | "840" | "978" | string;

export interface ICompanyProfile extends mongoose.Document {
  code: string;
  isDefault: boolean;
  legalName: string;
  tradeName?: string;

  taxId: string;
  address: string;

  phone?: string;
  email?: string;
  contactName?: string;

  // =========================
  // DATOS BANCARIOS DE ORIGEN
  // =========================

  originBankName?: string;

  /** Código del banco origen (si el layout lo requiere) */
  originBankCode?: string;
  /** Dígito verificador del banco origen (si aplica al layout) */
  originBankDigit?: string;

  originAccountType?: CompanyAccountType;
  originAccountNumber?: string;
  currency?: CompanyCurrencyCode;

  /**
   * Código de convenio/servicio con el banco (si el banco lo requiere)
   * Ej: contrato empresarial, acuerdo de nómina, etc.
   */
  agreementCode?: string;

  /**
   * Código de servicio / producto (si el banco lo requiere)
   * Ej: NOMINA, PAGOMASIVO, etc.
   */
  serviceCode?: string;
  defaultStatementDescription?: string;

  // =========================
  // CONFIG DE ARCHIVO (DEFAULTS)
  // =========================

  /**
   * Versión interna del layout que estás usando
   * (te ayuda cuando cambie el formato del banco)
   */
  bankFileLayoutVersion?: number;

  /**
   * Charset/encoding del archivo (muy importante)
   * Ej: "utf8" o "latin1" según el banco.
   */
  fileEncoding?: "utf8" | "latin1";

  /**
   * Separador de líneas (windows/unix)
   * "\r\n" o "\n"
   */
  lineEnding?: "CRLF" | "LF";

  /** Si el banco exige “relleno” con ceros/espacios */
  defaultPaddingChar?: "0" | " ";

  lastSequenceDate: string;
  lastSequenceNumber: number;

  notes?: string;

  // ✅ Branding / Identidad visual (frontend)
  logoUrl?: string;
  coverUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  website?: string;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const companyProfileSchema = new Schema<ICompanyProfile>(
  {
    code: {
      type: String,
      required: true,
      default: "DEFAULT",
      index: true,
    },

    // Si es el perfil principal
    isDefault: { type: Boolean, default: true, index: true },

    // Datos legales
    legalName: { type: String, required: true },
    tradeName: { type: String, default: "" },
    taxId: { type: String, required: true, index: true },
    address: { type: String, required: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    contactName: { type: String, default: "" },

    // Datos bancarios origen
    originBankName: { type: String, default: "" },
    originBankCode: { type: String, default: "" },
    originBankDigit: { type: String, default: "" },
    originAccountType: { type: String, enum: ["1", "2"], default: "1" },
    originAccountNumber: { type: String, default: "" },
    currency: { type: String, default: "214" },

    // Contratos / convenios con el banco
    agreementCode: { type: String, default: "" },
    serviceCode: { type: String, default: "" },
    defaultStatementDescription: { type: String, default: "NOMINA" },

    // Config para generación de archivo
    bankFileLayoutVersion: { type: Number, default: 1 },
    fileEncoding: { type: String, enum: ["utf8", "latin1"], default: "utf8" },
    lineEnding: { type: String, enum: ["CRLF", "LF"], default: "LF" },
    defaultPaddingChar: { type: String, enum: ["0", " "], default: " " },

    // UI
    logoUrl: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    primaryColor: { type: String, default: "" },
    secondaryColor: { type: String, default: "" },
    website: { type: String, default: "" },

    notes: { type: String, default: "" },

    lastSequenceDate: { type: String, default: "" }, // "YYYYMMDD"
    lastSequenceNumber: { type: Number, default: 0 }, // contador diario

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);


companyProfileSchema.index(
  { isDefault: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true, isDeleted: false },
  }
);

/**
 * ✅ También puedes asegurar code único (siempre que no lo borres con otro code igual)
 * Si prefieres permitir historial por code, quita este índice.
 */
companyProfileSchema.index({ code: 1, isDeleted: 1 }, { unique: true });

export default model<ICompanyProfile>("CompanyProfile", companyProfileSchema);
