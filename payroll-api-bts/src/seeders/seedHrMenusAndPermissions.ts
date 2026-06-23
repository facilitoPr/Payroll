import Menu from "../model/menu";
import Role from "../model/role";
import RolePermission from "../model/rolePermission";
import Department from "../model/rrhh/department";
import { JobPosition } from "../model/rrhh/jobPosition";
import { seedRoles, SystemRoleCode } from "./roles.seed";
import { PermissionFlags } from "../model/rolePermission";

type MenuSeed = {
  code: string;
  name: string;
  icon: string;
  path?: string;
  order: number;
  children?: MenuSeed[];
};

type FlatMenuSeed = MenuSeed & {
  parentCode: string | null;
};

const FULL_PERMISSIONS: PermissionFlags = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true,
  manage: true,
  send: true,
  export: true,
};

const ADMIN_PERMISSIONS: PermissionFlags = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true,
  manage: true,
  send: true,
  export: true,
};

const MANAGER_PERMISSIONS: PermissionFlags = {
  view: true,
  create: true,
  edit: true,
  delete: false,
  approve: true,
  manage: true,
  send: false,
  export: true,
};

const VIEW_ONLY_PERMISSIONS: PermissionFlags = {
  view: true,
  create: false,
  edit: false,
  delete: false,
  approve: false,
  manage: false,
  send: false,
  export: false,
};

const menus: MenuSeed[] = [
  /**
   * SUPER ADMIN
   */
  {
    code: "SYSTEM_ADMIN",
    name: "Administración",
    icon: "admin_panel_settings",
    order: 1,
    children: [
      {
        code: "USERS",
        name: "Usuarios",
        icon: "people",
        path: "/portal/users",
        order: 1,
      },
      {
        code: "APPLICATIONS",
        name: "Aplicaciones",
        icon: "apps",
        path: "/portal/applications",
        order: 2,
      },
      {
        code: "DEPARTMENTS",
        name: "Departamentos",
        icon: "domain",
        path: "/portal/departamentos",
        order: 3,
      },
      {
        code: "PROJECTS",
        name: "Proyectos",
        icon: "work",
        path: "/portal/projectos",
        order: 4,
      },
    ],
  },

  /**
   * ADMIN / RRHH
   */
  {
    code: "DASHBOARD",
    name: "Dashboard",
    icon: "dashboard",
    path: "/portal/dashboard",
    order: 10,
  },
  {
    code: "RRHH",
    name: "Recursos Humanos",
    icon: "people",
    order: 15,
    children: [
      {
        code: "RECRUITMENT",
        name: "Reclutamiento",
        icon: "groups",
        path: "/portal/recruitment",
        order: 1,
      },
      {
        code: "EMPLOYEES",
        name: "Empleados",
        icon: "person",
        path: "/portal/employees",
        order: 2,
      },
      {
        code: "EMPLOYEES_INACTIVE",
        name: "Archivo muerto",
        icon: "folder_off",
        path: "/portal/rrhh/employees-inactive",
        order: 3,
      },
      {
        code: "PUNCH_ADMIN",
        name: "Ponches",
        icon: "alarm",
        path: "/portal/punch/admin",
        order: 4,
      },
    ],
  },
  {
    code: "TRAINING",
    name: "Entrenamiento",
    icon: "school",
    path: "/portal/training",
    order: 70,
  },
  {
    code: "SUPPORT_TICKETS",
    name: "Tickets de soporte",
    icon: "confirmation_number",
    path: "/portal/tickets",
    order: 80,
  },
  {
    code: "ADMIN_EMPLOYEE_LOAN_REQUESTS",
    name: "Solicitudes de préstamos",
    path: "/portal/employee-loans",
    icon: "account_balance_wallet",
    order: 81,
  },
  {
    code: "EMPLOYEE_TERMINATION",
    name: "Desvinculaciones de empleados",
    path: "/portal/employee-terminations",
    icon: "person_remove",
    order: 82,
  },
  {
    code: "PAYROLL",
    name: "Nómina",
    icon: "payments",
    order: 90,
    children: [
      {
        code: "PAYROLL_CREATE",
        name: "Hacer nómina",
        icon: "calendar_month",
        path: "/portal/payroll",
        order: 1,
      },
      {
        code: "PAYROLL_HISTORY",
        name: "Historial de nómina",
        icon: "history",
        path: "/portal/payroll/history",
        order: 2,
      },
    ],
  },
  {
    code: "DISCIPLINARY_ADMIN",
    name: "Amonestaciones",
    icon: "gpp_maybe",
    path: "/portal/rrhh/disciplinary-actions",
    order: 100,
  },
  {
    code: "EMPLOYEE_REQUESTS",
    name: "Solicitudes de empleados",
    icon: "multiple_stop",
    path: "/portal/permissions",
    order: 110,
  },
  {
    code: "REPORTS",
    name: "Reportes",
    icon: "summarize",
    order: 120,
    children: [
      {
        code: "PUNCH_HISTORY",
        name: "Ponches del día",
        icon: "list_alt",
        path: "/portal/punch/history",
        order: 1,
      },
      {
        code: "CALLS_REPORTS",
        name: "Reportes de llamadas",
        icon: "call",
        path: "/portal/callsReports",
        order: 2,
      },
      {
        code: "APPOINTMENTS_REPORT",
        name: "Reporte de citas",
        icon: "analytics",
        path: "/portal/appointments",
        order: 3,
      },
      {
        code: "INCENTIVES_MANAGER",
        name: "Metas de incentivos",
        icon: "redeem",
        path: "/portal/incentives/manager",
        order: 4,
      },
      {
        code: "ERROR_REPORTS",
        name: "Reportes de errores",
        icon: "warning",
        path: "/portal/errorReports",
        order: 5,
      },
      {
        code: "PRODUCTION_REPORTS",
        name: "Reporte de producción",
        icon: "analytics",
        path: "/portal/reports",
        order: 6,
      },
    ],
  },
  {
    code: "SETTINGS",
    name: "Configuración de sistema",
    icon: "settings",
    order: 130,
    children: [
      {
        code: "ORGANIZATION_SETTINGS",
        name: "Organización",
        icon: "account_tree",
        path: "/portal/settings/organization",
        order: 1,
      },
      {
        code: "PAYROLL_SETTINGS",
        name: "Configuración de nómina",
        icon: "paid",
        path: "/portal/settings/payroll",
        order: 2,
      },
      {
        code: "LOAN_SETTINGS",
        name: "Configuración de prestamos",
        icon: "attach_money",
        path: "/portal/settings/loan",
        order: 3,
      },
      {
        code: "TERMINATION_SETTINGS",
        name: "Administrar Desvinculación Laboral",
        icon: "gavel",
        path: "/portal/settings/employee-termination",
        order: 4,
      },
      {
        code: "AI_AGENTS",
        name: "Agentes IA",
        icon: "model_training",
        path: "/portal/settings/agents",
        order: 5,
      },
      {
        code: "INCENTIVES_ADMIN",
        name: "Configuración Programa de Incentivos",
        icon: "settings_applications",
        path: "/portal/incentives/admin",
        order: 6,
      },
      {
        code: "LOCALITY_TEAMS",
        name: "Equipos por localidad",
        icon: "groups",
        path: "/portal/locality/teams",
        order: 7,
      },
      {
        code: "PROMOTION_ADS",
        name: "Promociones",
        icon: "campaign",
        path: "/portal/promotion-ads",
        order: 8,
      },
    ],
  },
  // {
  //   code: "ADMIN_POS",
  //   name: "Punto de venta",
  //   icon: "point_of_sale",
  //   path: "/portal/pos",
  //   order: 140,
  // },

  /**
   * EMPLOYEE
   */
  {
    code: "MY_TRAININGS",
    name: "Entrenamiento",
    icon: "school",
    path: "/portal/my-trainings",
    order: 200,
  },
  {
    code: "MY_PERMISSIONS",
    name: "Mis permisos",
    icon: "hail",
    path: "/portal/my-permissions",
    order: 210,
  },
  {
    code: "EMPLOYEE_LOAN_MY_REQUESTS",
    name: "Mis préstamos",
    path: "/portal/loans",
    icon: "payments",
    order: 211,
  },
  {
    code: "MY_DISCIPLINARY_ACTIONS",
    name: "Amonestaciones",
    icon: "gpp_maybe",
    path: "/portal/my/disciplinary-actions",
    order: 220,
  },
  {
    code: "PUNCH_MY",
    name: "Ponches del día",
    icon: "list_alt",
    path: "/portal/punch/my",
    order: 230,
  },
  {
    code: "MY_PAYMENTS",
    name: "Mis pagos",
    icon: "payments",
    path: "/portal/my/payments",
    order: 240,
  },
  {
    code: "MY_TICKETS",
    name: "Mis tickets",
    icon: "confirmation_number",
    path: "/portal/my-tickets",
    order: 250,
  },

  /**
   * EMPLOYEE por departamento / manager
   */
  {
    code: "ASSIGNMENTS",
    name: "Asignaciones",
    icon: "task",
    path: "/portal/assignments",
    order: 300,
  },
  {
    code: "APPOINTMENTS",
    name: "Citas",
    icon: "calendar_month",
    path: "/portal/appointments",
    order: 310,
  },
  {
    code: "CONWASTE",
    name: "Conwaste",
    icon: "payment",
    path: "/portal/conwaste",
    order: 320,
  },
  {
    code: "INCENTIVES_MY",
    name: "Mis metas",
    icon: "analytics",
    path: "/portal/incentives/my",
    order: 330,
  },
  {
    code: "INCENTIVES_LEADER",
    name: "Metas del equipo",
    icon: "analytics",
    path: "/portal/incentives/leader",
    order: 340,
  },
];

const flattenMenus = (
  items: MenuSeed[],
  parentCode: string | null = null,
): FlatMenuSeed[] => {
  const result: FlatMenuSeed[] = [];

  for (const item of items) {
    result.push({
      ...item,
      parentCode,
    });

    if (item.children?.length) {
      result.push(...flattenMenus(item.children, item.code));
    }
  }

  return result;
};

const getParentMap = (flatMenus: FlatMenuSeed[]) => {
  const parentMap = new Map<string, string | null>();

  for (const item of flatMenus) {
    parentMap.set(item.code, item.parentCode);
  }

  return parentMap;
};

const includeParentCodes = (
  menuCodes: string[],
  parentMap: Map<string, string | null>,
): string[] => {
  const result = new Set<string>();

  for (const code of menuCodes) {
    result.add(code);

    let parentCode = parentMap.get(code) || null;

    while (parentCode) {
      result.add(parentCode);
      parentCode = parentMap.get(parentCode) || null;
    }
  }

  return Array.from(result);
};

const normalizePath = (path?: string) => {
  if (!path) return "";

  return path.replace(/\/+/g, "/");
};

const upsertRole = async (code: SystemRoleCode, name: string) => {
  return Role.findOneAndUpdate(
    { code },
    {
      $set: {
        code,
        name,
        isActive: true,
        isDeleted: false,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
};

const upsertMenus = async () => {
  const flatMenus = flattenMenus(menus);
  const menuMap = new Map<string, any>();

  for (const item of flatMenus) {
    const parent = item.parentCode ? menuMap.get(item.parentCode) : null;

    const menu = await Menu.findOneAndUpdate(
      { code: item.code },
      {
        $set: {
          code: item.code,
          name: item.name,
          label: item.name,
          icon: item.icon,
          path: normalizePath(item.path || ""),
          parent: parent?._id || null,
          parentCode: item.parentCode,
          order: item.order,
          isVisible: true,
          isActive: true,
          isDeleted: false,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    menuMap.set(item.code, menu);
  }

  return {
    menuMap,
    flatMenus,
    parentMap: getParentMap(flatMenus),
  };
};

const findDepartment = async (code: string) => {
  return Department.findOne({
    code,
    isDeleted: false,
  });
};

const findJobPosition = async (code: string) => {
  return JobPosition.findOne({
    code,
    isDeleted: false,
  });
};

const dropIndexIfExists = async (indexName: string) => {
  try {
    const indexes = await RolePermission.collection.indexes();
    const exists = indexes.some((index) => index.name === indexName);

    if (exists) {
      await RolePermission.collection.dropIndex(indexName);
      console.log(`Índice viejo eliminado: ${indexName}`);
    }
  } catch (error: any) {
    console.warn(`No se pudo eliminar el índice ${indexName}:`, error.message);
  }
};

const ensureRolePermissionIndexes = async () => {
  /**
   * Estos índices viejos causan errores cuando quieres tener varios permisos
   * para el mismo role + menu, pero con department/jobPosition/isManager distinto.
   */
  await dropIndexIfExists("role_1_menu_1");
  await dropIndexIfExists("role_1_menu_1_entity_1");

  await RolePermission.collection.createIndex(
    {
      role: 1,
      menu: 1,
      department: 1,
      jobPosition: 1,
      isManager: 1,
    },
    {
      unique: true,
      name: "role_menu_department_job_manager_unique",
    },
  );
};

const grantMenus = async ({
  role,
  menuMap,
  parentMap,
  menuCodes,
  permissions,
  department = null,
  jobPosition = null,
  isManager = null,
}: {
  role: any;
  menuMap: Map<string, any>;
  parentMap: Map<string, string | null>;
  menuCodes: string[];
  permissions: PermissionFlags;
  department?: any | null;
  jobPosition?: any | null;
  isManager?: boolean | null;
}) => {
  const codesWithParents = includeParentCodes(menuCodes, parentMap);

  for (const menuCode of codesWithParents) {
    const menu = menuMap.get(menuCode);

    if (!menu) {
      console.warn(`Menú no encontrado en seed: ${menuCode}`);
      continue;
    }

    await RolePermission.findOneAndUpdate(
      {
        role: role._id,
        menu: menu._id,
        department: department?._id || null,
        jobPosition: jobPosition?._id || null,
        isManager,
      },
      {
        $set: {
          role: role._id,
          menu: menu._id,
          department: department?._id || null,
          jobPosition: jobPosition?._id || null,
          isManager,
          isEnabled: true,
          permissions,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }
};

export const seedHrMenusAndPermissions = async () => {
  await seedRoles();
  await ensureRolePermissionIndexes();

  const superAdminRole = await upsertRole("SUPER_ADMIN", "Super Admin");
  const adminRole = await upsertRole("ADMIN", "Admin");
  const employeeRole = await upsertRole("EMPLOYEE", "Employee");

  const { menuMap, parentMap } = await upsertMenus();

  const allMenuCodes = Array.from(menuMap.keys());

  /**
   * SUPER_ADMIN
   * Acceso total a todas las pantallas.
   */
  await grantMenus({
    role: superAdminRole,
    menuMap,
    parentMap,
    menuCodes: allMenuCodes,
    permissions: FULL_PERMISSIONS,
  });

  /**
   * ADMIN
   * Acceso a módulos administrativos/RRHH.
   * No incluye el grupo SYSTEM_ADMIN.
   */
  await grantMenus({
    role: adminRole,
    menuMap,
    parentMap,
    menuCodes: [
      "DASHBOARD",
      "RECRUITMENT",
      "EMPLOYEES",
      "EMPLOYEES_INACTIVE",
      "PUNCH_ADMIN",
      "TRAINING",
      "SUPPORT_TICKETS",
      "PAYROLL_CREATE",
      "PAYROLL_HISTORY",
      "DISCIPLINARY_ADMIN",
      "EMPLOYEE_REQUESTS",
      "ADMIN_EMPLOYEE_LOAN_REQUESTS",
      "PUNCH_HISTORY",
      "CALLS_REPORTS",
      "APPOINTMENTS_REPORT",
      "INCENTIVES_MANAGER",
      "ERROR_REPORTS",
      "PRODUCTION_REPORTS",
      "ORGANIZATION_SETTINGS",
      "PAYROLL_SETTINGS",
      "AI_AGENTS",
      "INCENTIVES_ADMIN",
      "LOCALITY_TEAMS",
      "PROMOTION_ADS",
      "ADMIN_POS",
      "LOAN_SETTINGS",
      "TERMINATION_SETTINGS",
      "EMPLOYEE_TERMINATION"
    ],
    permissions: ADMIN_PERMISSIONS,
  });

  /**
   * EMPLOYEE base.
   */
  await grantMenus({
    role: employeeRole,
    menuMap,
    parentMap,
    menuCodes: [
      "MY_TRAININGS",
      "MY_PERMISSIONS",
      "EMPLOYEE_LOAN_MY_REQUESTS",
      "MY_DISCIPLINARY_ACTIONS",
      "PUNCH_MY",
      "MY_PAYMENTS",
      "MY_TICKETS",
    ],
    permissions: VIEW_ONLY_PERMISSIONS,
  });

  /**
   * EMPLOYEE manager general.
   */
  await grantMenus({
    role: employeeRole,
    menuMap,
    parentMap,
    menuCodes: [
      "DASHBOARD",
      "MY_TRAININGS",
      "RECRUITMENT",
      "EMPLOYEES",
      "MY_PERMISSIONS",
      "EMPLOYEE_LOAN_MY_REQUESTS",
      "MY_DISCIPLINARY_ACTIONS",
      "EMPLOYEE_REQUESTS",
      "PAYROLL_CREATE",
      "PUNCH_MY",
      "MY_PAYMENTS",
      "MY_TICKETS",
    ],
    permissions: MANAGER_PERMISSIONS,
    isManager: true,
  });

  /**
   * EMPLOYEE departamento TRIPLE_S.
   */
  const tripleS = await findDepartment("TRIPLE_S");

  if (tripleS) {
    await grantMenus({
      role: employeeRole,
      menuMap,
      parentMap,
      menuCodes: [
        "ASSIGNMENTS",
        "APPOINTMENTS",
        "MY_PERMISSIONS",
        "EMPLOYEE_LOAN_MY_REQUESTS",
        "MY_DISCIPLINARY_ACTIONS",
        "INCENTIVES_MY",
        "CALLS_REPORTS",
        "PUNCH_MY",
        "MY_PAYMENTS",
        "MY_TICKETS",
      ],
      permissions: VIEW_ONLY_PERMISSIONS,
      department: tripleS,
      isManager: false,
    });

    await grantMenus({
      role: employeeRole,
      menuMap,
      parentMap,
      menuCodes: [
        "DASHBOARD",
        "ASSIGNMENTS",
        "APPOINTMENTS",
        "RECRUITMENT",
        "EMPLOYEES",
        "EMPLOYEE_REQUESTS",
        "INCENTIVES_MANAGER",
        "INCENTIVES_LEADER",
        "LOCALITY_TEAMS",
        "CALLS_REPORTS",
        "PRODUCTION_REPORTS",
        "PAYROLL_CREATE",
        "ERROR_REPORTS",
        "PUNCH_MY",
      ],
      permissions: MANAGER_PERMISSIONS,
      department: tripleS,
      isManager: true,
    });
  } else {
    console.warn(
      "No existe el departamento TRIPLE_S. Se omitieron permisos condicionales.",
    );
  }

  /**
   * EMPLOYEE departamento CONWASTE.
   */
  const conwaste = await findDepartment("CONWASTE");

  if (conwaste) {
    await grantMenus({
      role: employeeRole,
      menuMap,
      parentMap,
      menuCodes: [
        "CONWASTE",
        "MY_PERMISSIONS",
        "EMPLOYEE_LOAN_MY_REQUESTS",
        "MY_DISCIPLINARY_ACTIONS",
        "PUNCH_MY",
        "MY_PAYMENTS",
        "MY_TICKETS",
      ],
      permissions: VIEW_ONLY_PERMISSIONS,
      department: conwaste,
      isManager: false,
    });

    await grantMenus({
      role: employeeRole,
      menuMap,
      parentMap,
      menuCodes: [
        "DASHBOARD",
        "ASSIGNMENTS",
        "RECRUITMENT",
        "EMPLOYEES",
        "EMPLOYEE_REQUESTS",
        "CONWASTE",
        "PAYROLL_CREATE",
        "PUNCH_MY",
        "MY_PAYMENTS",
        "MY_TICKETS",
      ],
      permissions: MANAGER_PERMISSIONS,
      department: conwaste,
      isManager: true,
    });
  } else {
    console.warn(
      "No existe el departamento CONWASTE. Se omitieron permisos condicionales.",
    );
  }

  /**
   * EMPLOYEE departamento PROGRAMACION.
   */
  const programacion = await findDepartment("PROGRAMACION");

  if (programacion) {
    await grantMenus({
      role: employeeRole,
      menuMap,
      parentMap,
      menuCodes: [
        "RECRUITMENT",
        "MY_PERMISSIONS",
        "EMPLOYEE_LOAN_MY_REQUESTS",
        "MY_DISCIPLINARY_ACTIONS",
        "CALLS_REPORTS",
        "PUNCH_MY",
        "MY_PAYMENTS",
        "MY_TICKETS",
        "ERROR_REPORTS",
      ],
      permissions: VIEW_ONLY_PERMISSIONS,
      department: programacion,
    });
  } else {
    console.warn(
      "No existe el departamento PROGRAMACION. Se omitieron permisos condicionales.",
    );
  }

  /**
   * Ejemplo por puesto.
   * Si no existe el puesto SUPERVISOR, simplemente no hace nada.
   */
  const supervisor = await findJobPosition("SUPERVISOR");

  if (supervisor) {
    await grantMenus({
      role: employeeRole,
      menuMap,
      parentMap,
      menuCodes: [
        "EMPLOYEES",
        "EMPLOYEE_REQUESTS",
        "PAYROLL_CREATE",
        "CALLS_REPORTS",
      ],
      permissions: MANAGER_PERMISSIONS,
      jobPosition: supervisor,
    });
  }

  console.log("Seed de menús y permisos ejecutado correctamente.");
};
