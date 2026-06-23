import { Document, Schema, model } from "mongoose";

export interface IEmployeeLoanIntegrationClient extends Document {
  systemCode: string;
  name: string;
  description: string;

  /**
   * Si está vacío, puede usar el producto predeterminado activo.
   * Si contiene códigos, solamente podrá consultar esos productos.
   */
  allowedProductCodes: string[];

  canQuote: boolean;
  canCreateRequests: boolean;
  canCheckStatus: boolean;

  /**
   * Restricciones opcionales.
   * Si están vacías, no se aplican restricciones por origen/IP.
   */
  allowedOrigins: string[];
  allowedIps: string[];

  /**
   * SHA-256 de la API key.
   * Nunca debe devolverse al frontend.
   */
  apiKeyHash: string;

  expiresAt?: Date | null;

  lastUsedAt?: Date | null;
  usageCount: number;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const employeeLoanIntegrationClientSchema =
  new Schema<IEmployeeLoanIntegrationClient>(
    {
      systemCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        trim: true,
        default: "",
      },

      allowedProductCodes: {
        type: [String],
        default: [],
        set: (values: unknown[]) =>
          Array.from(
            new Set(
              (Array.isArray(values) ? values : [])
                .map((value) =>
                  String(value || "")
                    .trim()
                    .toUpperCase(),
                )
                .filter(Boolean),
            ),
          ),
      },

      canQuote: {
        type: Boolean,
        default: true,
      },

      canCreateRequests: {
        type: Boolean,
        default: true,
      },

      canCheckStatus: {
        type: Boolean,
        default: true,
      },

      allowedOrigins: {
        type: [String],
        default: [],
      },

      allowedIps: {
        type: [String],
        default: [],
      },

      apiKeyHash: {
        type: String,
        required: true,
        trim: true,
        select: false,
      },

      expiresAt: {
        type: Date,
        default: null,
      },

      lastUsedAt: {
        type: Date,
        default: null,
      },

      usageCount: {
        type: Number,
        default: 0,
        min: 0,
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
    },
  );

employeeLoanIntegrationClientSchema.index(
  {
    systemCode: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

employeeLoanIntegrationClientSchema.index({
  isActive: 1,
  isDeleted: 1,
  expiresAt: 1,
});

export default model<IEmployeeLoanIntegrationClient>(
  "EmployeeLoanIntegrationClient",
  employeeLoanIntegrationClientSchema,
);