import RolePermission from "../../model/rolePermission";

const toId = (value: any): string | null => {
  if (!value) return null;

  if (value?._id) return String(value._id);

  return String(value);
};

const normalizePermissions = (permissions: any = {}) => {
  return {
    view: Boolean(permissions.view),
    create: Boolean(permissions.create),
    edit: Boolean(permissions.edit),
    delete: Boolean(permissions.delete),
    approve: Boolean(permissions.approve),
    manage: Boolean(permissions.manage),
    send: Boolean(permissions.send),
    export: Boolean(permissions.export),
  };
};

const getSpecificityScore = (permission: any): number => {
  let score = 0;

  if (permission.department) score += 10;
  if (permission.jobPosition) score += 10;
  if (typeof permission.isManager === "boolean") score += 5;

  return score;
};

const matchesUserConditions = (permission: any, user: any): boolean => {
  const userDepartmentId = toId(user.department);
  const userJobPositionId = toId(user.jobPosition);
  const userIsManager = Boolean(user.isManager);

  const permissionDepartmentId = toId(permission.department);
  const permissionJobPositionId = toId(permission.jobPosition);

  if (permissionDepartmentId && permissionDepartmentId !== userDepartmentId) {
    return false;
  }

  if (
    permissionJobPositionId &&
    permissionJobPositionId !== userJobPositionId
  ) {
    return false;
  }

  if (
    typeof permission.isManager === "boolean" &&
    permission.isManager !== userIsManager
  ) {
    return false;
  }

  return true;
};

export const buildUserAccesses = async (user: any) => {
  const roleId = toId(user.rol || user.role);

  if (!roleId) return [];

  const permissions = await RolePermission.find({
    role: roleId,
    isEnabled: true,
  })
    .populate({
      path: "menu",
      populate: {
        path: "parent",
        select: "code name path icon order",
      },
    })
    .lean();

  const matchingPermissions = permissions
    .filter((permission: any) => permission.menu)
    .filter((permission: any) => {
      const menu = permission.menu;

      if (menu.isDeleted === true) return false;
      if (menu.isActive === false) return false;
      if (menu.isVisible === false) return false;

      return matchesUserConditions(permission, user);
    })
    .sort((a: any, b: any) => {
      return getSpecificityScore(b) - getSpecificityScore(a);
    });

  const accessMap = new Map<string, any>();

  for (const permission of matchingPermissions) {
    const menu: any = permission.menu;
    const menuCode = menu.code;

    if (!menuCode) continue;

    /**
     * Si ya existe un permiso para ese menú, no lo reemplazamos,
     * porque arriba ordenamos del más específico al más general.
     */
    if (accessMap.has(menuCode)) continue;

    accessMap.set(menuCode, {
      menuId: String(menu._id),
      menuCode: menu.code,
      name: menu.name,
      label: menu.label || menu.name,
      icon: menu.icon,
      path: menu.path,
      order: menu.order || 0,
      parentCode: menu.parent?.code || menu.parentCode || null,
      isVisible: menu.isVisible !== false,
      permissions: normalizePermissions(permission.permissions),
    });
  }

  return Array.from(accessMap.values()).sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );
};
