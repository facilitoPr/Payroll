import { isValidObjectId } from "mongoose";
import { AuthRequest } from "../../middlewares/validate-jwt";
import {
  IMenu,
  MENU_POSITIONS,
  MENU_TYPES,
  MenuPosition,
  MenuType,
} from "../../model/menu";
import { normalizeMenuPosition, normalizeMenuType } from "./menu.normalize";
import { validateItemRoute } from "./menu.validate";
import { escapeRegex, toBool, toNum, toStr } from "../parse";
import { normalizeNullableString } from "../normalize";
import { getValidParentMenu } from "../../services/menu.service";

export const normalizeAllowedScopes = (value: any) => {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((item) =>
      String(item || "")
        .trim()
        .toUpperCase(),
    )

  return [...new Set(normalized)];
};

export const serializeMenu = (menu: any) => {
  const row = menu?.toObject ? menu.toObject() : menu;

  return {
    _id: row?._id,
    name: row?.name || "",
    code: row?.code || "",
    type: row?.type || "ITEM",
    path: row?.path || null,
    externalPath: row?.externalPath || null,
    module: row?.module || "",
    icon: row?.icon || "",
    order: Number(row?.order || 0),
    isVisible: row?.isVisible !== false,
    isActive: row?.isActive !== false,
    isDeleted: row?.isDeleted === true,
    allowedScopes: Array.isArray(row?.allowedScopes) ? row.allowedScopes : [],
    position: row?.position || "SIDEBAR",
    openInNewTab: Boolean(row?.openInNewTab),
    requiresPermission: row?.requiresPermission !== false,
    parent: row?.parent
      ? {
          _id: row.parent._id || row.parent,
          name: row.parent.name || "",
          code: row.parent.code || "",
          type: row.parent.type || "",
          position: row.parent.position || "",
          allowedScopes: Array.isArray(row.parent.allowedScopes)
            ? row.parent.allowedScopes
            : [],
          isVisible: row.parent.isVisible !== false,
          isActive: row.parent.isActive !== false,
        }
      : null,
    createdAt: row?.createdAt,
    updatedAt: row?.updatedAt,
  };
};

export const buildMenusQuery = (req: AuthRequest) => {
  const search = toStr(req.query.search);
  const status = toStr(req.query.status).toUpperCase();
  const moduleValue = toStr(req.query.module);
  const type = toStr(req.query.type).toUpperCase();
  const position = toStr(req.query.position).toUpperCase();
  const scope = toStr(req.query.scope).toUpperCase();
  const parent = toStr(req.query.parent);
  const rootOnly = String(req.query.rootOnly || "false") === "true";

  const query: Record<string, any> = {
    isDeleted: { $ne: true },
  };

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { name: regex },
      { code: regex },
      { path: regex },
      { externalPath: regex },
      { module: regex },
      { icon: regex },
    ];
  }

  if (status === "VISIBLE") {
    query.isVisible = true;
  }

  if (status === "HIDDEN") {
    query.isVisible = false;
  }

  if (moduleValue) {
    query.module = new RegExp(`^${escapeRegex(moduleValue)}$`, "i");
  }

  if (MENU_TYPES.includes(type as MenuType)) {
    query.type = type;
  }

  if (MENU_POSITIONS.includes(position as MenuPosition)) {
    query.position = position;
  }

  if (["PLATFORM", "BANK", "DEALER"].includes(scope)) {
    query.allowedScopes = scope;
  }

  if (rootOnly) {
    query.parent = null;
  }

  if (parent) {
    if (parent === "ROOT") {
      query.parent = null;
    } else if (isValidObjectId(parent)) {
      query.parent = parent;
    }
  }

  return query;
};

export const buildMenuPayload = async (body: IMenu, currentMenuId?: string | null) => {
  const name = toStr(body.name);
  const code = toStr(body.code).toUpperCase();
  const type = normalizeMenuType(body.type);
  const path = normalizeNullableString(body.path);
  const externalPath = normalizeNullableString(body.externalPath);
  const moduleValue = toStr(body.module);
  const icon = toStr(body.icon);
  const order = toNum(body.order, 0);
  const isVisible = toBool(body.isVisible);
  const isActive = toBool(body.isActive);
  const openInNewTab =
    type === "ITEM" ? toBool(body.openInNewTab) : false;
  const requiresPermission = toBool(body.requiresPermission);
  const requestedPosition = normalizeMenuPosition(body.position);
  const parentId = body.parent ? String(body.parent) : null;

  if (!name) {
    throw new Error("El nombre es requerido");
  }

  if (!code) {
    throw new Error("El código es requerido");
  }

  if (!moduleValue) {
    throw new Error("El módulo es requerido");
  }

  const itemRouteError = validateItemRoute(type, path, externalPath);

  if (itemRouteError) {
    throw new Error(itemRouteError);
  }

  const parentMenu = await getValidParentMenu(parentId, currentMenuId || null);
  const finalPosition = parentMenu?.position || requestedPosition;

  return {
    name,
    code,
    type,
    path: type === "ITEM" ? path : null,
    externalPath: type === "ITEM" ? externalPath : null,
    module: moduleValue,
    icon,
    order,
    isVisible,
    isActive,
    openInNewTab,
    requiresPermission,
    position: finalPosition,
    parent: parentMenu?._id || null,
  };
};