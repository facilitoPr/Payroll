import { computed } from "vue";
import { useRoute } from "vue-router";
import { authStore } from "src/stores/auth-store";

export type MenuType = "ITEM" | "COLLAPSIBLE" | "GROUP" | "DIVIDER";
export type MenuPosition = "SIDEBAR" | "TOPBAR" | "USER_MENU";

export interface AppMenuNode {
  _id: string;
  code: string;
  menuCode: string;
  name: string;
  label?: string;
  type: MenuType;
  path?: string | null;
  externalPath?: string | null;
  module?: string;
  icon?: string;
  img?: string;
  order: number;
  isVisible: boolean;
  isActive: boolean;
  openInNewTab?: boolean;
  requiresPermission?: boolean;
  position: MenuPosition;
  parent?: string | null;
  parentCode?: string | null;
  children: AppMenuNode[];
}

const normalizeMenuType = (value: any): MenuType => {
  const normalized = String(value || "ITEM")
    .trim()
    .toUpperCase();

  if (
    normalized === "ITEM" ||
    normalized === "COLLAPSIBLE" ||
    normalized === "GROUP" ||
    normalized === "DIVIDER"
  ) {
    return normalized;
  }

  return "ITEM";
};

const normalizeMenuPosition = (value: any): MenuPosition => {
  const normalized = String(value || "SIDEBAR")
    .trim()
    .toUpperCase();

  if (
    normalized === "SIDEBAR" ||
    normalized === "TOPBAR" ||
    normalized === "USER_MENU"
  ) {
    return normalized;
  }

  return "SIDEBAR";
};

const removeDuplicatedSlashes = (value: string): string => {
  return value.replace(/\/+/g, "/");
};

const normalizeAbsolutePath = (path?: string | null): string | null => {
  if (!path) return null;

  let cleanPath = String(path).trim();

  if (!cleanPath) return null;

  cleanPath = removeDuplicatedSlashes(cleanPath);

  if (!cleanPath.startsWith("/")) {
    cleanPath = `/${cleanPath}`;
  }

  if (!cleanPath.startsWith("/portal/") && cleanPath !== "/portal") {
    cleanPath = `/portal${cleanPath}`;
  }

  return removeDuplicatedSlashes(cleanPath);
};

const normalizeParentCode = (item: any): string | null => {
  if (item?.parentCode) return String(item.parentCode);

  if (typeof item?.parent === "object" && item?.parent?.code) {
    return String(item.parent.code);
  }

  if (typeof item?.parent === "string") {
    return item.parent;
  }

  return null;
};

const normalizeMenuItem = (item: any): AppMenuNode => {
  const code = item?.code || item?.menuCode || "";

  return {
    _id: String(item?._id || item?.menuId || code),
    code,
    menuCode: code,
    name: item?.name || item?.label || item?.menuName || code,
    label: item?.label || item?.name || item?.menuName || code,
    type: normalizeMenuType(item?.type || item?.menuType),
    path: normalizeAbsolutePath(item?.path || item?.url || null),
    externalPath: item?.externalPath || null,
    module: item?.module || "",
    icon: item?.icon || item?.img || "circle",
    img: item?.img || item?.icon || "circle",
    order: Number(item?.order || 0),
    isVisible: item?.isVisible !== false,
    isActive: item?.isActive !== false,
    openInNewTab: Boolean(item?.openInNewTab),
    requiresPermission: item?.requiresPermission !== false,
    position: normalizeMenuPosition(item?.position),
    parent: normalizeParentCode(item),
    parentCode: normalizeParentCode(item),
    children: [],
  };
};

const buildTree = (items: AppMenuNode[]) => {
  const map = new Map<string, AppMenuNode>();
  const roots: AppMenuNode[] = [];

  const clones = items.map((item) => ({
    ...item,
    children: [],
  }));

  for (const item of clones) {
    map.set(item.code, item);
  }

  for (const item of clones) {
    const parentCode = item.parentCode || item.parent || null;

    if (parentCode && map.has(parentCode)) {
      map.get(parentCode)!.children.push(item);
      continue;
    }

    roots.push(item);
  }

  const sortTree = (nodes: AppMenuNode[]) => {
    nodes.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    nodes.forEach((node) => sortTree(node.children));
  };

  sortTree(roots);

  return roots.filter((item) => {
    if (item.type === "DIVIDER" || item.type === "GROUP") return true;
    if (item.path || item.externalPath) return true;
    if (item.children.length) return true;

    return false;
  });
};

export function useAppMenus() {
  const auth = authStore();
  const route = useRoute();

  const rawMenus = computed<AppMenuNode[]>(() => {
    const accesses = Array.isArray(auth.visibleAccesses)
      ? auth.visibleAccesses
      : [];

    return accesses
      .filter((item: any) => {
        const hasViewAccess = Boolean(item?.permissions?.view);
        const isVisible = item?.isVisible !== false;
        const isActive = item?.isActive !== false;

        return hasViewAccess && isVisible && isActive;
      })
      .map(normalizeMenuItem);
  });

  const menusByPosition = (position: MenuPosition) =>
    computed(() =>
      buildTree(rawMenus.value.filter((item) => item.position === position)),
    );

  const sidebarMenus = menusByPosition("SIDEBAR");
  const topbarMenus = menusByPosition("TOPBAR");
  const userMenus = menusByPosition("USER_MENU");

  const isInternalItem = (item: AppMenuNode) => {
    return item.type === "ITEM" && !!item.path?.trim();
  };

  const isExternalItem = (item: AppMenuNode) => {
    return item.type === "ITEM" && !!item.externalPath?.trim();
  };

  const isCollapsible = (item: AppMenuNode) => {
    return item.type === "COLLAPSIBLE" || item.children.length > 0;
  };

  const isRouteActive = (path?: string | null) => {
    if (!path) return false;

    const cleanPath = normalizeAbsolutePath(path);

    if (!cleanPath) return false;

    return route.path === cleanPath || route.path.startsWith(`${cleanPath}/`);
  };

  const treeHasActive = (item: AppMenuNode): boolean => {
    if (item.path && isRouteActive(item.path)) return true;
    if (!item.children?.length) return false;

    return item.children.some((child) => treeHasActive(child));
  };

  return {
    auth,
    sidebarMenus,
    topbarMenus,
    userMenus,
    isInternalItem,
    isExternalItem,
    isCollapsible,
    isRouteActive,
    treeHasActive,
  };
}
