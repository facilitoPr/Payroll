import type { AccessPermissionKey, IUserAccess } from "src/config/menu.config";

export const EMPTY_PERMISSIONS: Record<AccessPermissionKey, boolean> = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  approve: false,
  manage: false,
  send: false,
  export: false,
};

export const normalizePermissions = (
  permissions?: Partial<Record<AccessPermissionKey, boolean>> | null,
): Record<AccessPermissionKey, boolean> => {
  return {
    view: Boolean(permissions?.view),
    create: Boolean(permissions?.create),
    edit: Boolean(permissions?.edit),
    delete: Boolean(permissions?.delete),
    approve: Boolean(permissions?.approve),
    manage: Boolean(permissions?.manage),
    send: Boolean(permissions?.send),
    export: Boolean(permissions?.export),
  };
};

export const normalizeAccess = (access: IUserAccess): IUserAccess => {
  return {
    ...access,
    isVisible: access.isVisible !== false,
    permissions: normalizePermissions(access.permissions),
  };
};

export const normalizeAccesses = (
  accesses: IUserAccess[] = [],
): IUserAccess[] => {
  if (!Array.isArray(accesses)) return [];

  return accesses
    .filter((item) => !!item?.menuCode)
    .map((item) => normalizeAccess(item));
};

export const getAccessByMenuCode = (
  accesses: IUserAccess[] = [],
  menuCode: string,
): IUserAccess | null => {
  const normalized = normalizeAccesses(accesses);

  return normalized.find((item) => item.menuCode === menuCode) || null;
};

export const getPermissionsFromAccesses = (
  accesses: IUserAccess[] = [],
  menuCode: string,
): Record<AccessPermissionKey, boolean> => {
  const found = getAccessByMenuCode(accesses, menuCode);

  if (!found) return { ...EMPTY_PERMISSIONS };

  if (!found.isVisible) return { ...EMPTY_PERMISSIONS };

  return normalizePermissions(found.permissions);
};

export const canFromAccesses = (
  accesses: IUserAccess[] = [],
  menuCode: string,
  permission: AccessPermissionKey = "view",
): boolean => {
  const permissions = getPermissionsFromAccesses(accesses, menuCode);

  return Boolean(permissions[permission]);
};

export const getVisibleAccesses = (
  accesses: IUserAccess[] = [],
): IUserAccess[] => {
  return normalizeAccesses(accesses)
    .filter((item) => item.isVisible !== false)
    .filter((item) => normalizePermissions(item.permissions).view)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
};