import { PermissionFlags } from '../../model/rolePermission';

export const permissionKeys: (keyof PermissionFlags)[] = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  // "manage",
  // "send",
  // "export",
];

export const emptyPermissions = (): PermissionFlags => ({
  view: false,
  create: false,
  edit: false,
  delete: false,
  approve: false,
  // manage: false,
  // send: false,
  // export: false,
});

export const fullPermissions = (): PermissionFlags => ({
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true,
  // manage: true,
  // send: true,
  // export: true,
});

export const normalizePermissions = (
  permissions: any,
  isEnabled = true,
): PermissionFlags => {
  const normalized: PermissionFlags = {
    view: Boolean(permissions?.view),
    create: Boolean(permissions?.create),
    edit: Boolean(permissions?.edit),
    delete: Boolean(permissions?.delete),
    approve: Boolean(permissions?.approve),
    // manage: Boolean(permissions?.manage),
    // send: Boolean(permissions?.send),
    // export: Boolean(permissions?.export),
  };

  if (!isEnabled) {
    return emptyPermissions();
  }

  const hasAdvancedPermission =
    normalized.create ||
    normalized.edit ||
    normalized.delete ||
    normalized.approve ||
    normalized.manage ||
    normalized.send ||
    normalized.export;

  if (hasAdvancedPermission) {
    normalized.view = true;
  }

  if (!normalized.view) {
    return emptyPermissions();
  }

  return normalized;
};
