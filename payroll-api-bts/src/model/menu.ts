import mongoose, { Schema, model } from "mongoose";

export type MenuType = "ITEM" | "COLLAPSIBLE" | "GROUP" | "DIVIDER";
export type MenuPosition = "SIDEBAR" | "TOPBAR" | "USER_MENU";

export const MENU_TYPES: MenuType[] = ["ITEM", "COLLAPSIBLE", "GROUP", "DIVIDER"];
export const MENU_POSITIONS: MenuPosition[] = ["SIDEBAR", "TOPBAR", "USER_MENU"];

export interface IMenu extends mongoose.Document {
  /** Nombre visible del menú */
  name: string;

  /** Código único interno del menú */
  code: string;

  /** Tipo de menú */
  type: MenuType;

  /** Ruta interna del frontend */
  path?: string;

  /** Si es un enlace externo */
  externalPath?: string;

  /** Módulo o categoría lógica a la que pertenece */
  module: string;

  /** Icono del menú */
  icon?: string;

  /** Orden de visualización */
  order: number;

  /** Si se muestra o no */
  isVisible: boolean;

  /** Si está activo */
  isActive: boolean;

  /** Soft delete */
  isDeleted: boolean;

  /** Menú padre para construir jerarquía */
  parent?: mongoose.Types.ObjectId | null;

  /** Ubicación donde se mostrará el menú */
  position: MenuPosition;

  /** Indica si abre en nueva pestaña */
  openInNewTab: boolean;

  /** Si requiere permiso para verse */
  requiresPermission: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const menuSchema = new Schema<IMenu>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: MENU_TYPES,
      default: "ITEM",
      required: true,
    },
    path: {
      type: String,
      trim: true,
      default: null,
    },

    /** Ruta externa opcional */
    externalPath: {
      type: String,
      trim: true,
      default: null,
    },

    /** Módulo lógico */
    module: {
      type: String,
      required: true,
      trim: true,
    },

    /** Icono */
    icon: {
      type: String,
      default: "",
      trim: true,
    },

    /** Orden */
    order: {
      type: Number,
      default: 0,
    },

    isVisible: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    /** Menú padre */
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Menu",
      default: null,
    },

    /** Posición en la interfaz */
    position: {
      type: String,
      enum: MENU_POSITIONS,
      default: "SIDEBAR",
    },

    /** Abrir en nueva pestaña */
    openInNewTab: {
      type: Boolean,
      default: false,
    },

    /** Si debe evaluarse contra permisos */
    requiresPermission: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/**
 * Validación:
 * - ITEM debe tener path o externalPath
 * - COLLAPSIBLE / GROUP / DIVIDER no necesitan path
 */
menuSchema.pre("validate", function (next) {
  const menu = this as IMenu;

  if (menu.type === "ITEM") {
    const hasInternalPath = !!menu.path?.trim();
    const hasExternalPath = !!menu.externalPath?.trim();

    if (!hasInternalPath && !hasExternalPath) {
      return next(
        new Error("Un menú de tipo ITEM debe tener path o externalPath"),
      );
    }
  }

  if (menu.type !== "ITEM") {
    menu.path = undefined;
    menu.externalPath = undefined;
  }

  next();
});

menuSchema.index({ parent: 1, order: 1 });
menuSchema.index({ module: 1, position: 1, isVisible: 1, isActive: 1 });
menuSchema.index({ allowedScopes: 1 });

export default model<IMenu>("Menu", menuSchema);
