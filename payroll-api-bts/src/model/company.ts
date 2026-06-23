import mongoose, { Schema, model, Types } from "mongoose";

export type CompanyAccountType = "1" | "2";
export type CompanyBankCurrencyCode = "214" | "840" | "978" | string;
export type CompanyFileEncoding = "utf8" | "latin1";
export type CompanyLineEnding = "CRLF" | "LF";
export type CompanyPaddingChar = "0" | " ";

export type NormalizedCompanyPayload = {
  code?: string;
  legalName: string;
  tradeName: string;
  taxId: string;
  businessGroupName: string;
  ownerName: string;

  contactName: string;
  email: string;
  phone: string;
  website: string;

  logo: string;
  logoUrl: string;
  coverUrl: string;
  primaryColor: string;
  secondaryColor: string;

  address: {
    country: string;
    state: string;
    city: string;
    street: string;
    zipCode: string;
    fullAddress: string;
  };

  fiscalInfo: {
    taxRegime: string;
    fiscalAddress: string;
    notes: string;
  };

  settings: {
    timezone: string;
    currency: string;
    language: string;
  };

  banking: {
    originBankName: string;
    originBankCode: string;
    originBankDigit: string;
    originAccountType: "1" | "2";
    originAccountNumber: string;
    currencyCode: string;
  };

  bankFileConfig: {
    agreementCode: string;
    serviceCode: string;
    defaultStatementDescription: string;
    bankFileLayoutVersion: number;
    fileEncoding: "utf8" | "latin1";
    lineEnding: "CRLF" | "LF";
    defaultPaddingChar: "0" | " ";
    lastSequenceDate: string;
    lastSequenceNumber: number;
  };

  publicProfile: {
    headline?: string;
    subtitle?: string;
    aboutTitle?: string;
    aboutDescription?: string;
    aboutSecondDescription?: string;
    trajectoryTitle?: string;
    trajectoryDescription?: string;
    trajectorySecondDescription?: string;
    mission?: string;
    vision?: string;
    valuesDescription?: string;
    values?: {
      title: string;
      icon: string;
      description: string;
    }[];
    stats?: {
      label: string;
      value: string;
    }[];
    images?: {
      main?: string;
      secondary?: string;
      third?: string;
      trajectory?: string;
      hero?: string;
    };
  };

  notes: string;

  isDefault: boolean;
  isActive: boolean;
  showInPublicLanding: boolean;
};

export interface ICompany extends mongoose.Document {
  code: string;

  // =========================
  // DATOS LEGALES
  // =========================
  legalName: string;
  tradeName?: string;
  taxId?: string;
  businessGroupName?: string;
  ownerName?: string;

  // =========================
  // CONTACTO
  // =========================
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;

  // =========================
  // BRANDING / FRONTEND
  // =========================
  logo?: string;
  logoUrl?: string;
  coverUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;

  // =========================
  // DIRECCIÓN
  // =========================
  address?: {
    country?: string;
    state?: string;
    city?: string;
    street?: string;
    zipCode?: string;
    fullAddress?: string;
  };

  // =========================
  // FISCAL
  // =========================
  fiscalInfo?: {
    taxRegime?: string;
    fiscalAddress?: string;
    notes?: string;
  };

  // =========================
  // CONFIG GENERAL
  // =========================
  settings?: {
    timezone?: string;
    currency?: string; // Ej: DOP, USD
    language?: string;
  };

  // =========================
  // DATOS BANCARIOS DE ORIGEN
  // =========================
  banking?: {
    originBankName?: string;
    originBankCode?: string;
    originBankDigit?: string;
    originAccountType?: CompanyAccountType;
    originAccountNumber?: string;

    /**
     * Código numérico bancario / ISO 4217 usado en layouts bancarios.
     * Ej: 214 = DOP, 840 = USD, 978 = EUR.
     */
    currencyCode?: CompanyBankCurrencyCode;
  };

  // =========================
  // CONFIG DE ARCHIVO BANCARIO / NÓMINA
  // =========================
  bankFileConfig?: {
    agreementCode?: string;
    serviceCode?: string;
    defaultStatementDescription?: string;

    bankFileLayoutVersion?: number;
    fileEncoding?: CompanyFileEncoding;
    lineEnding?: CompanyLineEnding;
    defaultPaddingChar?: CompanyPaddingChar;

    lastSequenceDate?: string;
    lastSequenceNumber?: number;
  };

  publicProfile: {
    headline?: string;
    subtitle?: string;
    aboutTitle?: string;
    aboutDescription?: string;
    aboutSecondDescription?: string;
    trajectoryTitle?: string;
    trajectoryDescription?: string;
    trajectorySecondDescription?: string;
    mission?: string;
    vision?: string;
    valuesDescription?: string;
    values?: {
      title: string;
      icon: string;
      description: string;
    }[];
    stats?: {
      label: string;
      value: string;
    }[];
    images?: {
      main?: string;
      secondary?: string;
      third?: string;
      trajectory?: string;
      hero?: string;
    };
  };
  notes?: string;

  showInPublicLanding?: boolean;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;

  isDefault: boolean;
  isActive: boolean;
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

const companySchema = new Schema<ICompany>(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // =========================
    // DATOS LEGALES
    // =========================
    legalName: {
      type: String,
      required: true,
      trim: true,
    },

    tradeName: {
      type: String,
      trim: true,
      default: "",
    },

    taxId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    businessGroupName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    ownerName: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // CONTACTO
    // =========================
    contactName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    website: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // BRANDING
    // =========================
    logo: {
      type: String,
      trim: true,
      default: "",
    },

    /**
     * Se deja por compatibilidad con CompanyProfile anterior.
     * Puedes usar logo como principal y logoUrl como alias.
     */
    logoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    coverUrl: {
      type: String,
      trim: true,
      default: "",
    },

    primaryColor: {
      type: String,
      trim: true,
      default: "#024D48",
    },

    secondaryColor: {
      type: String,
      trim: true,
      default: "#1964A2",
    },

    // =========================
    // DIRECCIÓN
    // =========================
    address: {
      country: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      street: { type: String, trim: true, default: "" },
      zipCode: { type: String, trim: true, default: "" },
      fullAddress: { type: String, trim: true, default: "" },
    },

    // =========================
    // FISCAL
    // =========================
    fiscalInfo: {
      taxRegime: { type: String, trim: true, default: "" },
      fiscalAddress: { type: String, trim: true, default: "" },
      notes: { type: String, trim: true, default: "" },
    },

    // =========================
    // CONFIG GENERAL
    // =========================
    settings: {
      timezone: {
        type: String,
        trim: true,
        default: "America/Santo_Domingo",
      },
      currency: {
        type: String,
        trim: true,
        default: "DOP",
      },
      language: {
        type: String,
        trim: true,
        default: "es",
      },
    },

    // =========================
    // DATOS BANCARIOS
    // =========================
    banking: {
      originBankName: { type: String, trim: true, default: "" },
      originBankCode: { type: String, trim: true, default: "" },
      originBankDigit: { type: String, trim: true, default: "" },
      originAccountType: {
        type: String,
        enum: ["1", "2"],
        default: "1",
      },
      originAccountNumber: { type: String, trim: true, default: "" },

      /**
       * Código numérico bancario:
       * 214 = DOP
       * 840 = USD
       * 978 = EUR
       */
      currencyCode: {
        type: String,
        trim: true,
        default: "214",
      },
    },

    // =========================
    // CONFIG ARCHIVO BANCARIO
    // =========================
    bankFileConfig: {
      agreementCode: { type: String, trim: true, default: "" },
      serviceCode: { type: String, trim: true, default: "" },
      defaultStatementDescription: {
        type: String,
        trim: true,
        default: "NOMINA",
      },

      bankFileLayoutVersion: {
        type: Number,
        default: 1,
      },

      fileEncoding: {
        type: String,
        enum: ["utf8", "latin1"],
        default: "utf8",
      },

      lineEnding: {
        type: String,
        enum: ["CRLF", "LF"],
        default: "LF",
      },

      defaultPaddingChar: {
        type: String,
        enum: ["0", " "],
        default: " ",
      },

      lastSequenceDate: {
        type: String,
        trim: true,
        default: "",
      },

      lastSequenceNumber: {
        type: Number,
        default: 0,
      },
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    publicProfile: {
      headline: {
        type: String,
        default: "",
      },
      subtitle: {
        type: String,
        default: "",
      },
      aboutTitle: {
        type: String,
        default: "",
      },
      aboutDescription: {
        type: String,
        default: "",
      },
      aboutSecondDescription: {
        type: String,
        default: "",
      },
      trajectoryTitle: {
        type: String,
        default: "",
      },
      trajectoryDescription: {
        type: String,
        default: "",
      },
      trajectorySecondDescription: {
        type: String,
        default: "",
      },
      mission: {
        type: String,
        default: "",
      },
      vision: {
        type: String,
        default: "",
      },
      valuesDescription: {
        type: String,
        default: "",
      },
      values: [
        {
          title: { type: String, required: true },
          icon: { type: String, default: "check_circle" },
          description: { type: String, default: "" },
        },
      ],
      stats: [
        {
          label: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
      images: {
        main: { type: String, default: "" },
        secondary: { type: String, default: "" },
        third: { type: String, default: "" },
        trajectory: { type: String, default: "" },
        hero: { type: String, default: "" },
      },
    },
    showInPublicLanding: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/**
 * Código único solo entre compañías no eliminadas.
 * Esto permite soft delete sin bloquear el código para siempre.
 */
companySchema.index(
  { code: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

/**
 * Tax ID único solo si no está vacío y la compañía no está eliminada.
 */
companySchema.index(
  { taxId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      taxId: {
        $type: "string",
        $ne: "",
      },
      isDeleted: false,
    },
  },
);

/**
 * Solo una compañía principal activa/no eliminada.
 */
companySchema.index(
  { isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDefault: true,
      isDeleted: false,
    },
  },
);

companySchema.index({ businessGroupName: 1, isDeleted: 1 });
companySchema.index({ legalName: 1, isDeleted: 1 });
companySchema.index({ isActive: 1, isDeleted: 1 });

export default model<ICompany>("Company", companySchema);
