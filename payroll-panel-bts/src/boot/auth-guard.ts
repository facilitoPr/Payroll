import { boot } from "quasar/wrappers";
import type { AccessPermissionKey } from "src/config/menu.config";
import { authStore } from "src/stores/auth-store";

export default boot(({ router }) => {
  router.beforeEach(async (to) => {
    const auth = authStore();

    const requiresAuth = Boolean(to.meta.requiresAuth);
    const guestOnly = Boolean(to.meta.guestOnly);

    const menuCode = to.meta.menuCode as string | undefined;
    const menuCodes = to.meta.menuCodes as string[] | undefined;

    const permission =
      (to.meta.permission as AccessPermissionKey | undefined) || "view";

    /**
     * Hidratamos la sesión solo una vez.
     */
    if (!auth.hydrated) {
      await auth.refreshMe();
    }

    /**
     * Si entra al login estando logueado,
     * lo mandamos directo al portal.
     */
    if (guestOnly && auth.loggedIn) {
      return auth.defaultHomeRoute || "/portal/dashboard";
    }

    /**
     * Si intenta entrar a una ruta privada sin sesión,
     * lo mandamos al login.
     */
    if (requiresAuth && !auth.loggedIn) {
      return {
        path: "/login",
        query: {
          redirect: to.fullPath,
        },
      };
    }

    /**
     * Evita loop si la pantalla actual ya es unauthorized.
     */
    if (to.path === "/unauthorized") {
      return true;
    }

    /**
     * Validación por permisos.
     *
     * Soporta:
     * meta.menuCode = "EMPLOYEES"
     * meta.menuCodes = ["APPOINTMENTS", "APPOINTMENTS_REPORT"]
     */
    if (requiresAuth) {
      const codesToCheck =
        Array.isArray(menuCodes) && menuCodes.length > 0
          ? menuCodes
          : menuCode
            ? [menuCode]
            : [];

      if (codesToCheck.length > 0) {
        const hasPermission = codesToCheck.some((code) =>
          auth.can(code, permission),
        );

        console.log(codesToCheck, permission, hasPermission);

        if (!hasPermission) {
          return "/unauthorized";
        }
      }
    }

    return true;
  });
});
