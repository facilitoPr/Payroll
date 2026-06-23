import { PermissionFlags } from '../../model/rolePermission';
import { serializeMenu } from '../menu/menu.build';
import {
  normalizePermissions,
  permissionKeys,
} from "./role-permissions.normalize";

export const permissionsEqual = (a: PermissionFlags, b: PermissionFlags) => {
  return permissionKeys.every((key) => Boolean(a[key]) === Boolean(b[key]));
};

export const buildDefaultTemplateRows = (menus: any[], defaultDocs: any[]) => {
  const defaultMap = new Map<string, any>();

  for (const doc of defaultDocs) {
    defaultMap.set(String(doc.menu), doc);
  }

  return menus.map((menu: any) => {
    const defaultDoc = defaultMap.get(String(menu._id));
    const isEnabled = Boolean(defaultDoc?.isEnabled);
    const permissions = normalizePermissions(
      defaultDoc?.permissions,
      isEnabled,
    );

    return {
      menu: serializeMenu(menu),
      isEnabled,
      permissions,
    };
  });
};

export const buildEntityTemplateRows = (
  menus: any[],
  defaultDocs: any[],
  overrideDocs: any[],
) => {
  const defaultMap = new Map<string, any>();
  const overrideMap = new Map<string, any>();

  for (const doc of defaultDocs) {
    defaultMap.set(String(doc.menu), doc);
  }

  for (const doc of overrideDocs) {
    overrideMap.set(String(doc.menu), doc);
  }

  return menus.map((menu: any) => {
    const defaultDoc = defaultMap.get(String(menu._id));
    const overrideDoc = overrideMap.get(String(menu._id));

    const defaultIsEnabled = Boolean(defaultDoc?.isEnabled);
    const defaultPermissions = normalizePermissions(
      defaultDoc?.permissions,
      defaultIsEnabled,
    );

    const effectiveIsEnabled = overrideDoc
      ? Boolean(overrideDoc.isEnabled)
      : defaultIsEnabled;

    const effectivePermissions = overrideDoc
      ? normalizePermissions(overrideDoc.permissions, effectiveIsEnabled)
      : defaultPermissions;

    return {
      menu: serializeMenu(menu),
      default: {
        isEnabled: defaultIsEnabled,
        permissions: defaultPermissions,
      },
      effective: {
        isEnabled: effectiveIsEnabled,
        permissions: effectivePermissions,
      },
      isOverridden: Boolean(overrideDoc),
    };
  });
};
