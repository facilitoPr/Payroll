export const portalRoutes = [
  {
    path: "/portal",
    redirect: "/portal/dashboard",
    component: () => import("layouts/MainLayout.vue"),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: "home",
        name: "PortalHome",
        component: () => import("pages/Home.vue"),
        meta: {
          title: "Inicio",
        },
      },
      {
        path: "profile",
        name: "Perfil",
        component: () => import("src/pages/Profile.vue"),
        meta: {
          title: "Perfil",
        },
      },

      /**
       * SUPER ADMIN
       */
      {
        path: "users",
        name: "Usuarios",
        component: () => import("src/pages/Users.vue"),
        meta: {
          title: "Usuarios",
          menuCode: "USERS",
          permission: "view",
        },
      },

      /**
       * ADMIN / RRHH
       */
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("src/pages/Dashboard.vue"),
        meta: {
          title: "Dashboard",
          menuCode: "DASHBOARD",
          permission: "view",
        },
      },
      {
        path: "recruitment",
        name: "Recruitment",
        component: () => import("src/pages/Reclutamiento.vue"),
        meta: {
          title: "Reclutamiento",
          menuCode: "RECRUITMENT",
          permission: "view",
        },
      },
      {
        path: "employees",
        name: "Empleados",
        component: () => import("src/pages/Employees.vue"),
        meta: {
          title: "Empleados",
          menuCode: "EMPLOYEES",
          permission: "view",
        },
      },
      {
        path: "rrhh/employees-inactive",
        name: "EmpleadosInactivos",
        component: () => import("src/pages/EmployeesInactive.vue"),
        meta: {
          title: "Empleados inactivos",
          menuCode: "EMPLOYEES_INACTIVE",
          permission: "view",
        },
      },
      {
        path: "punch/admin",
        name: "PunchesAdmin",
        component: () => import("src/pages/punches/Punches.vue"),
        meta: {
          title: "Administrar ponches",
          menuCode: "PUNCH_ADMIN",
          permission: "view",
        },
      },
      {
        path: "training",
        name: "TrainingDashboard",
        component: () => import("src/pages/training/TrainingDashboardPage.vue"),
        meta: {
          title: "Entrenamientos",
          menuCode: "TRAINING",
          permission: "view",
        },
      },
      {
        path: "tickets",
        name: "Tickets",
        component: () =>
          import("src/pages/tickets/AdminSupportTicketsPage.vue"),
        meta: {
          title: "Tickets de soporte",
          menuCode: "SUPPORT_TICKETS",
          permission: "view",
        },
      },
      {
        path: "payroll",
        name: "PayrollReport",
        component: () => import("src/pages/PayrollReport.vue"),
        meta: {
          title: "Hacer nómina",
          menuCode: "PAYROLL_CREATE",
          permission: "view",
        },
      },
      {
        path: "payroll/history",
        name: "PayrollHistory",
        component: () => import("src/pages/HistoryPayroll.vue"),
        meta: {
          title: "Historial de nómina",
          menuCode: "PAYROLL_HISTORY",
          permission: "view",
        },
      },
      {
        path: "rrhh/disciplinary-actions",
        name: "DisciplinaryActions",
        component: () =>
          import("src/pages/disciplinary/DisciplinaryActionsPage.vue"),
        meta: {
          title: "Amonestaciones",
          menuCode: "DISCIPLINARY_ADMIN",
          permission: "view",
        },
      },
      {
        path: "permissions",
        name: "Permissions",
        component: () => import("src/pages/permissions/Permissions.vue"),
        meta: {
          title: "Solicitudes de empleados",
          menuCode: "EMPLOYEE_REQUESTS",
          permission: "view",
        },
      },

      /**
       * REPORTES
       */
      {
        path: "punch/history",
        name: "PunchHistory",
        component: () => import("src/pages/punches/HistoryAdmin.vue"),
        meta: {
          title: "Ponches del día",
          menuCode: "PUNCH_HISTORY",
          permission: "view",
        },
      },
      {
        path: "callsReports",
        name: "CallsReports",
        component: () => import("src/pages/CallsReports.vue"),
        meta: {
          title: "Reportes de llamadas",
          menuCode: "CALLS_REPORTS",
          permission: "view",
        },
      },
      {
        path: "appointments",
        name: "Citas",
        component: () => import("src/pages/Appointments.vue"),
        meta: {
          title: "Citas",
          /**
           * En el seed tienes dos menús apuntando a /portal/appointments:
           * - APPOINTMENTS
           * - APPOINTMENTS_REPORT
           *
           * Por eso usamos menuCodes para permitir acceso si el usuario tiene cualquiera.
           */
          menuCodes: ["APPOINTMENTS", "APPOINTMENTS_REPORT"],
          permission: "view",
        },
      },
      {
        path: "incentives/manager",
        name: "IncentivesManager",
        component: () =>
          import("src/pages/incentives/IncentivesManagerDashboard.vue"),
        meta: {
          title: "Metas de incentivos",
          menuCode: "INCENTIVES_MANAGER",
          permission: "view",
        },
      },
      {
        path: "errorReports",
        name: "ErrorReports",
        component: () => import("src/pages/ErrorsReports.vue"),
        meta: {
          title: "Reportes de errores",
          menuCode: "ERROR_REPORTS",
          permission: "view",
        },
      },
      {
        path: "reports",
        name: "Reports",
        component: () => import("src/pages/Reports.vue"),
        meta: {
          title: "Reporte de producción",
          menuCode: "PRODUCTION_REPORTS",
          permission: "view",
        },
      },

      /**
       * SETTINGS
       */
      {
        path: "settings/organization",
        name: "Organization",
        component: () => import("src/pages/Organization.vue"),
        meta: {
          title: "Organización",
          menuCode: "ORGANIZATION_SETTINGS",
          permission: "view",
        },
      },
      {
        path: "settings/payroll",
        name: "SettingsPayroll",
        component: () => import("src/pages/EmployeePaymentConfigTabs.vue"),
        meta: {
          title: "Configuración de nómina",
          menuCode: "PAYROLL_SETTINGS",
          permission: "view",
        },
      },
      {
        path: "settings/loan",
        name: "SettingsLoan",
        component: () =>
          import("src/pages/employeeLoan/EmployeeLoanProviderConfigPage.vue"),
        meta: {
          title: "Configuración de préstamos",
          menuCode: "LOAN_SETTINGS",
          permission: "view",
        },
      },
      {
        path: "settings/agents",
        name: "Agents",
        component: () => import("src/pages/Agents.vue"),
        meta: {
          title: "Agentes IA",
          menuCode: "AI_AGENTS",
          permission: "view",
        },
      },
      {
        path: "incentives/admin",
        name: "IncentivesAdmin",
        component: () => import("src/pages/incentives/IncentivesAdmin.vue"),
        meta: {
          title: "Configuración Programa de Incentivos",
          menuCode: "INCENTIVES_ADMIN",
          permission: "view",
        },
      },
      {
        path: "locality/teams",
        name: "LocalityTeams",
        component: () => import("src/pages/locality/LocalityTeamsMonthly.vue"),
        meta: {
          title: "Equipos por localidad",
          menuCode: "LOCALITY_TEAMS",
          permission: "view",
        },
      },
      {
        path: "promotion-ads",
        name: "PromotionAds",
        component: () => import("src/pages/PromotionAdsPage.vue"),
        meta: {
          title: "Promociones",
          menuCode: "PROMOTION_ADS",
          permission: "view",
        },
      },

      /**
       * EMPLOYEE
       */
      {
        path: "my-trainings",
        name: "MyTrainings",
        component: () => import("src/pages/training/MyTrainingsPage.vue"),
        meta: {
          title: "Entrenamiento",
          menuCode: "MY_TRAININGS",
          permission: "view",
        },
      },
      {
        path: "my-permissions",
        alias: "my-permissions",
        name: "MyPermissions",
        component: () => import("src/pages/permissions/MyPermissions.vue"),
        meta: {
          title: "Mis permisos",
          menuCode: "MY_PERMISSIONS",
          permission: "view",
        },
      },
      {
        path: "my/disciplinary-actions",
        name: "MyDisciplinaryActions",
        component: () =>
          import("src/pages/disciplinary/MyDisciplinaryActionsPage.vue"),
        meta: {
          title: "Amonestaciones",
          menuCode: "MY_DISCIPLINARY_ACTIONS",
          permission: "view",
        },
      },
      {
        path: "punch/my",
        name: "MyPunch",
        component: () => import("src/pages/punches/MyPunch.vue"),
        meta: {
          title: "Ponches del día",
          menuCode: "PUNCH_MY",
          permission: "view",
        },
      },
      {
        path: "my/payments",
        name: "MyPayments",
        component: () => import("src/pages/MyPaymentsPage.vue"),
        meta: {
          title: "Mis pagos",
          menuCode: "MY_PAYMENTS",
          permission: "view",
        },
      },
      {
        path: "my-tickets",
        name: "MyTickets",
        component: () => import("src/pages/tickets/MySupportTicketsPage.vue"),
        meta: {
          title: "Mis tickets",
          menuCode: "MY_TICKETS",
          permission: "view",
        },
      },
      {
        path: "loans",
        name: "employee-loans",
        component: () =>
          import("src/pages/employeeLoan/MyEmployeeLoanRequests.vue"),
        meta: {
          title: "Mis préstamos",
          menuCode: "EMPLOYEE_LOAN_MY_REQUESTS",
          permission: "view",
        },
      },
      {
        path: "employee-loans",
        name: "admin-employee-loans",
        component: () =>
          import("src/pages/employeeLoan/AdminEmployeeLoanRequests.vue"),
        meta: {
          title: "Administrar préstamos",
          menuCode: "ADMIN_EMPLOYEE_LOAN_REQUESTS",
          permission: "view",
        },
      },

      /**
       * EMPLOYEE POR DEPARTAMENTO / MANAGER
       */
      {
        path: "assignments",
        name: "Asignaciones",
        component: () => import("src/pages/Assignments.vue"),
        meta: {
          title: "Asignaciones",
          menuCode: "ASSIGNMENTS",
          permission: "view",
        },
      },
      {
        path: "conwaste",
        name: "Conwaste",
        component: () => import("src/components/conwaste/Conwaste.vue"),
        meta: {
          title: "Conwaste",
          menuCode: "CONWASTE",
          permission: "view",
        },
      },
      {
        path: "incentives/my",
        name: "IncentivesMy",
        component: () =>
          import("src/pages/incentives/IncentivesMyDashboard.vue"),
        meta: {
          title: "Mis metas",
          menuCode: "INCENTIVES_MY",
          permission: "view",
        },
      },
      {
        path: "incentives/leader",
        name: "IncentivesLeader",
        component: () =>
          import("src/pages/incentives/IncentivesLeaderDashboard.vue"),
        meta: {
          title: "Metas del equipo",
          menuCode: "INCENTIVES_LEADER",
          permission: "view",
        },
      },

      /**
       * RUTAS EXISTENTES SIN MENÚ EN EL SEED ACTUAL
       * Las dejo sin menuCode para no bloquearlas con un código inexistente.
       */
      {
        path: "zones",
        name: "Zonas",
        component: () => import("src/components/zones/Zones.vue"),
        meta: {
          title: "Zonas",
        },
      },
      {
        path: "patients",
        name: "Pacientes",
        component: () => import("src/components/patients/Patients.vue"),
        meta: {
          title: "Pacientes",
        },
      },
      {
        path: "comertial",
        name: "Comertial",
        component: () => import("src/pages/Comertial.vue"),
        meta: {
          title: "Comercial",
        },
      },

      {
        path: "pagos/hoy",
        name: "PagosHoy",
        component: () => import("src/pages/PaymentToday.vue"),
        meta: {
          title: "Pagos de hoy",
        },
      },
      {
        path: "settings/employee-termination",
        name: "EmployeeTerminationConfig",
        component: () =>
          import("pages/employee-termination/EmployeeTerminationConfigPage.vue"),
        meta: {
          title: "Administrar Desvinculación Laboral",
          menuCode: "TERMINATION_SETTINGS",
          permission: "view",
        },
      },

      {
        path: "employee-terminations",
        name: "employee-terminations",
        component: () => import("pages/employee-termination/EmployeeTerminationListPage.vue"),
        meta: {
          title: "Desvinculaciones",
          permission: "view",
          menuCode: "EMPLOYEE_TERMINATION"
        },
      },

      /**
       * MANUFACTURE
       * Estas pantallas no aparecen en el seed actual.
       */
      {
        path: "manufacture/dashboard",
        name: "ManufactureDashboard",
        component: () =>
          import("src/pages/manufacture/ManufacturaDashboard.vue"),
        meta: {
          title: "Manufactura",
        },
      },
      {
        path: "manufacture/materials/catalog",
        name: "ManufactureMaterialsCatalog",
        component: () =>
          import("src/pages/manufacture/materials/MaterialsCatalog.vue"),
        meta: {
          title: "Catálogo de materiales",
        },
      },
      {
        path: "manufacture/materials",
        name: "ManufactureMaterials",
        component: () =>
          import("src/pages/manufacture/materials/MaterialsPurchases.vue"),
        meta: {
          title: "Materiales",
        },
      },
      {
        path: "manufacture/inventory",
        name: "ManufactureInventory",
        component: () =>
          import("src/pages/manufacture/materials/MaterialsInventory.vue"),
        meta: {
          title: "Inventario",
        },
      },
      {
        path: "manufacture/package",
        name: "ManufacturePackage",
        component: () =>
          import("src/pages/manufacture/materials/ManufacturingPackages.vue"),
        meta: {
          title: "Paquetes",
        },
      },
      {
        path: "manufacture/workorders",
        name: "ManufactureWorkorders",
        component: () =>
          import("src/pages/manufacture/assembly/WorkOrders.vue"),
        meta: {
          title: "Órdenes de trabajo",
        },
      },
      {
        path: "manufacture/assembly",
        name: "ManufactureAssembly",
        component: () => import("src/pages/manufacture/assembly/Assembly.vue"),
        meta: {
          title: "Ensamblaje",
        },
      },
      {
        path: "manufacture/assembly/inventory",
        name: "ManufactureAssemblyInventory",
        component: () => import("src/pages/manufacture/assembly/Inventory.vue"),
        meta: {
          title: "Inventario de ensamblaje",
        },
      },
      {
        path: "manufacture/reports",
        name: "ManufactureReports",
        component: () =>
          import("src/pages/manufacture/reports/ReportesManufactura.vue"),
        meta: {
          title: "Reportes de manufactura",
        },
      },
      {
        path: "manufacture/ready",
        name: "ManufactureDeliveryReady",
        component: () =>
          import("src/pages/manufacture/delivery/EntregasLista.vue"),
        meta: {
          title: "Entregas listas",
        },
      },
      {
        path: "manufacture/maps",
        name: "ManufactureDeliveryMaps",
        component: () =>
          import("src/pages/manufacture/delivery/MapaEntrega.vue"),
        meta: {
          title: "Mapa de entrega",
        },
      },
      {
        path: "manufacture/entryandexit",
        name: "ManufactureEntryAndExit",
        component: () =>
          import("src/pages/manufacture/logistics/EntryAndExit.vue"),
        meta: {
          title: "Entrada y salida",
        },
      },
      {
        path: "manufacture/entryandexit/report",
        name: "ManufactureEntryAndExitReport",
        component: () =>
          import("src/pages/manufacture/logistics/EntryAndExitReport.vue"),
        meta: {
          title: "Reporte entrada y salida",
        },
      },
      {
        path: "manufacture/visits",
        name: "ManufactureVisits",
        component: () => import("src/pages/manufacture/logistics/Visits.vue"),
        meta: {
          title: "Visitas",
        },
      },

      {
        path: "vehicle",
        name: "Vehicle",
        component: () => import("src/pages/Vehicle.vue"),
        meta: {
          title: "Vehículos",
        },
      },
    ],
  },
];
