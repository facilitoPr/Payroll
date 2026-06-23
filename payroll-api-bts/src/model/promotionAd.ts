import mongoose, { Schema, model, Types } from "mongoose";

export type PromotionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type PromotionAudience =
  | "PUBLIC"
  | "AUTHENTICATED"
  | "ADMIN"
  | "EMPLOYEE"
  | "ALL";

export type PromotionCtaAction = "NONE" | "URL" | "ROUTE" | "LOGIN" | "SCROLL";

export interface IPromotionAd extends mongoose.Document {
  code: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  description: string;
  badge?: string;
  
  status: PromotionStatus;
  audience: PromotionAudience;

  company?: Types.ObjectId | null;
  companyCode?: string;
  isGlobal: boolean;

  media: {
    desktopImage?: string;
    mobileImage?: string;
    videoUrl?: string;
    alt?: string;
  };

  style: {
    background?: string;
    primaryColor?: string;
    secondaryColor?: string;
    textColor?: string;
    overlayColor?: string;
  };

  cta: {
    label?: string;
    action: PromotionCtaAction;
    url?: string;
    route?: string;
    sectionId?: string;
    openInNewTab?: boolean;
  };

  order: number;
  startsAt?: Date | null;
  endsAt?: Date | null;

  metrics: {
    views: number;
    clicks: number;
  };

  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const promotionAdSchema = new Schema<IPromotionAd>(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    highlight: {
      type: String,
      trim: true,
      default: "",
    },

    subtitle: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    badge: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },

    audience: {
      type: String,
      enum: ["PUBLIC", "AUTHENTICATED", "ADMIN", "EMPLOYEE", "ALL"],
      default: "PUBLIC",
      index: true,
    },

    /**
     * null = anuncio global.
     * Con valor = anuncio específico de una empresa.
     */
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    media: {
      desktopImage: { type: String, trim: true, default: "" },
      mobileImage: { type: String, trim: true, default: "" },
      videoUrl: { type: String, trim: true, default: "" },
      alt: { type: String, trim: true, default: "" },
    },

    style: {
      background: {
        type: String,
        trim: true,
        default:
          "linear-gradient(120deg, #023c3a 0%, #024d48 45%, #1964a2 100%)",
      },
      primaryColor: { type: String, trim: true, default: "#024D48" },
      secondaryColor: { type: String, trim: true, default: "#1964A2" },
      textColor: { type: String, trim: true, default: "#FFFFFF" },
      overlayColor: { type: String, trim: true, default: "rgba(0,0,0,0.18)" },
    },

    cta: {
      label: { type: String, trim: true, default: "Conocer más" },
      action: {
        type: String,
        enum: ["NONE", "URL", "ROUTE", "LOGIN", "SCROLL"],
        default: "NONE",
      },
      url: { type: String, trim: true, default: "" },
      route: { type: String, trim: true, default: "" },
      sectionId: { type: String, trim: true, default: "" },
      openInNewTab: { type: Boolean, default: false },
    },

    order: {
      type: Number,
      default: 0,
      index: true,
    },

    startsAt: {
      type: Date,
      default: null,
      index: true,
    },

    endsAt: {
      type: Date,
      default: null,
      index: true,
    },

    metrics: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
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

    companyCode: {
      type: String,
      default: "",
    },
    isGlobal: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

promotionAdSchema.index({
  status: 1,
  isActive: 1,
  isDeleted: 1,
  startsAt: 1,
  endsAt: 1,
  order: 1,
});

export default model<IPromotionAd>("PromotionAd", promotionAdSchema);