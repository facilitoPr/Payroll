import type { QIconProps } from "quasar";

export type AccessPermissionKey =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "manage"
  | "send"
  | "export";

export type AppMenuCode =
  | "PLATFORM_DASHBOARD"
  | "PLATFORM_ENTITIES"
  | "PLATFORM_USERS"
  | "PLATFORM_ROLES"
  | "PLATFORM_MENUS"
  | "PLATFORM_ROLE_PERMISSIONS"
  | "PLATFORM_CUSTOMERS"
  | "PLATFORM_AI_AGENTS"
  | "BANK_DASHBOARD"
  | "BANK_EMPLOYEES"
  | "BANK_LOAN_PARAMETERS"
  | "BANK_APPLICATIONS"
  | "BANK_MARKETING"
  | "BANK_ROLE_PERMISSIONS";

export interface IMenuItemConfig {
  code: AppMenuCode;
  name: string;
  path: string;
  module?: string;
  icon: QIconProps["name"] | string;
  order: number;
}

export interface IUserAccess {
  rolePermissionId: string;
  menuId: string;
  menuCode: AppMenuCode;
  menuName: string;
  module?: string;
  path: string;
  icon: string;
  order: number;
  isVisible: boolean;
  permissions: Partial<Record<AccessPermissionKey, boolean>>;
}

export const MENU_CATALOG: IMenuItemConfig[] = [
  {
    code: "PLATFORM_DASHBOARD",
    name: "Dashboard Plataforma",
    path: "/admin/dashboard",
    module: "DASHBOARD",
    icon: "dashboard",
    order: 1,
  },
  {
    code: "PLATFORM_ENTITIES",
    name: "Entidades",
    path: "/admin/entities",
    module: "ENTITIES",
    icon: "business",
    order: 2,
  },
  {
    code: "PLATFORM_USERS",
    name: "Usuarios (Tenants)",
    path: "/admin/users",
    module: "USERS",
    icon: "business_center",
    order: 3,
  },
  {
    code: "PLATFORM_CUSTOMERS",
    name: "Usuarios (Clientes)",
    path: "/admin/customers",
    module: "USERS",
    icon: "group",
    order: 4,
  },
  {
    code: "PLATFORM_ROLES",
    name: "Roles",
    path: "/admin/roles",
    module: "ROLES",
    icon: "admin_panel_settings",
    order: 5,
  },
  {
    code: "PLATFORM_MENUS",
    name: "Menús",
    path: "/admin/menus",
    module: "MENUS",
    icon: "menu",
    order: 6,
  },
  {
    code: "PLATFORM_ROLE_PERMISSIONS",
    name: "Permisos por Rol",
    path: "/admin/role-permissions/defaults",
    module: "ROLE_PERMISSIONS",
    icon: "verified_user",
    order: 7,
  },
  {
    code: "PLATFORM_AI_AGENTS",
    name: "Agentes de IA",
    path: "/admin/ai-agents",
    module: "AI",
    icon: "model_training",
    order: 7,
  },
];

export const BANK_ADMIN_MENUS: IMenuItemConfig[] = [
  {
    code: "BANK_DASHBOARD",
    name: "Dashboard",
    icon: "space_dashboard",
    path: "/bank/dashboard",
    order: 1,
  },
  {
    code: "BANK_EMPLOYEES",
    name: "Empleados",
    icon: "groups",
    path: "/bank/employees",
    order: 2,
  },
  {
    code: "BANK_LOAN_PARAMETERS",
    name: "Parámetros de préstamos",
    icon: "tune",
    path: "/bank/loan-parameters",
    order: 3,
  },
  {
    code: "BANK_APPLICATIONS",
    name: "Solicitudes de financiamiento",
    icon: "description",
    path: "/bank/applications",
    order: 4,
  },
  {
    code: "BANK_MARKETING",
    name: "Marketing",
    icon: "campaign",
    path: "/bank/marketing",
    order: 5,
  },
];
