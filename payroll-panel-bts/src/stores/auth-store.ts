import { defineStore } from "pinia";
import { logoutHttp, getMeHttp } from "src/api/methodsHttp";
import type { AccessPermissionKey, IUserAccess } from "src/config/menu.config";
import {
  canFromAccesses,
  getVisibleAccesses,
  normalizeAccesses,
  normalizePermissions,
} from "src/utils/access";

export interface IUserRole {
  _id?: string;
  code?: string;
  name?: string;
}

export interface IUser {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  img?: string;
  isOwner?: boolean;
  isActive?: boolean;
  isActived?: boolean;
  isDeleted?: boolean;
  mustChangePassword?: boolean;
  role?: IUserRole | string | null;
  rol?: IUserRole | string | null;
  accesses?: IUserAccess[];

  /**
   * Campos opcionales que tu sistema actual usa en algunos módulos.
   * Puedes borrar los que no uses.
   */
  department?: any;
  jobPosition?: any;
  city?: any;
  specialties?: any[];
  application?: any;
  paymentSchedule?: any;
  salaryType?: any;
  project?: any;
  isManager?: boolean;
}

interface IAuthState {
  token: string | null;
  user: IUser | null;
  accesses: IUserAccess[];
  hydrated: boolean;
  lastMeSyncAt: number;
}

const safeParse = <T = any>(value: string | null): T | null => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const normalizeUser = (user: IUser | null): IUser | null => {
  if (!user) return null;

  return {
    ...user,
    accesses: normalizeAccesses(user.accesses || []),
  };
};

const getUserRole = (user: IUser | null): IUserRole | string | null => {
  if (!user) return null;

  /**
   * Soporta ambos nombres:
   * - role: estructura nueva
   * - rol: estructura vieja
   */
  return user.role || user.rol || null;
};

const getUserRoleCode = (user: IUser | null): string | null => {
  const role = getUserRole(user);

  if (!role) return null;

  if (typeof role === "string") return role;

  return role.code || null;
};

const storedUser = normalizeUser(
  safeParse<IUser>(localStorage.getItem("user")),
);

const storedToken = localStorage.getItem("token");

let refreshMePromise: Promise<boolean> | null = null;

export const authStore = defineStore("auth", {
  state: (): IAuthState => ({
    token: storedToken || null,
    user: storedUser,
    accesses: normalizeAccesses(storedUser?.accesses || []),
    hydrated: false,
    lastMeSyncAt: 0,
  }),

  getters: {
    loggedIn: (state): boolean => Boolean(state.token),

    roleCode: (state): string | null => {
      return getUserRoleCode(state.user);
    },

    isSuperAdmin(): boolean {
      return this.roleCode === "SUPER_ADMIN" || this.roleCode === "SUPERADMIN";
    },

    accessesMap: (
      state,
    ): Record<string, Record<AccessPermissionKey, boolean>> => {
      const map: Record<string, Record<AccessPermissionKey, boolean>> = {};

      for (const item of state.accesses || []) {
        if (!item?.menuCode) continue;

        map[item.menuCode] = normalizePermissions(item.permissions);
      }

      return map;
    },

    visibleAccesses(): IUserAccess[] {
      return getVisibleAccesses(this.accesses);
    },

    defaultHomeRoute(): string {
      const firstVisible = this.visibleAccesses[0];

      if (firstVisible?.path) {
        if (firstVisible.path.startsWith("/portal")) {
          return firstVisible.path;
        }

        if (firstVisible.path.startsWith("/")) {
          return `/portal${firstVisible.path}`;
        }

        return `/portal/${firstVisible.path}`;
      }

      return "/portal/profile";
    },

    can() {
      return (
        menuCode: string,
        permission: AccessPermissionKey = "view",
      ): boolean => {
        if (this.roleCode === "SUPER_ADMIN" || this.roleCode === "SUPERADMIN") {
          return true;
        }

        return canFromAccesses(this.accesses, menuCode, permission);
      };
    },
  },

  actions: {
    getAccess(menuCode: string): IUserAccess | null {
      return this.accesses.find((item) => item.menuCode === menuCode) || null;
    },

    setSession(user: IUser, token: string | null) {
      const normalizedUser = normalizeUser(user);

      const normalizedAccesses = normalizeAccesses(
        normalizedUser?.accesses || [],
      );

      this.user = normalizedUser
        ? {
            ...normalizedUser,
            accesses: normalizedAccesses,
          }
        : null;

      this.accesses = normalizedAccesses;
      this.token = token;
      this.hydrated = true;

      if (this.user) {
        localStorage.setItem("user", JSON.stringify(this.user));
      } else {
        localStorage.removeItem("user");
      }

      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    },

    setUserOnly(user: IUser | null) {
      const normalizedUser = normalizeUser(user);

      const normalizedAccesses = normalizeAccesses(
        normalizedUser?.accesses || [],
      );

      this.user = normalizedUser
        ? {
            ...normalizedUser,
            accesses: normalizedAccesses,
          }
        : null;

      this.accesses = normalizedAccesses;

      if (this.user) {
        localStorage.setItem("user", JSON.stringify(this.user));
      } else {
        localStorage.removeItem("user");
      }
    },

    setAccesses(accesses: IUserAccess[] = []) {
      const normalizedAccesses = normalizeAccesses(accesses);

      this.accesses = normalizedAccesses;

      if (this.user) {
        this.user = {
          ...this.user,
          accesses: normalizedAccesses,
        };

        localStorage.setItem("user", JSON.stringify(this.user));
      }
    },

    setToken(token: string | null) {
      this.token = token;

      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    },

    clearSession() {
      this.user = null;
      this.accesses = [];
      this.token = null;
      this.hydrated = true;

      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },

    async logout() {
      try {
        await logoutHttp();
      } catch (error) {
        console.error("Error al cerrar sesión en backend:", error);
      } finally {
        this.clearSession();
      }
    },

    async refreshMe(options?: { force?: boolean; maxAgeMs?: number }) {
      const force = options?.force === true;
      const maxAgeMs = options?.maxAgeMs ?? 60_000;

      if (refreshMePromise && !force) {
        return refreshMePromise;
      }

      const now = Date.now();

      if (
        !force &&
        this.hydrated &&
        this.lastMeSyncAt &&
        now - this.lastMeSyncAt < maxAgeMs
      ) {
        return true;
      }

      refreshMePromise = (async () => {
        try {
          if (!this.token) {
            this.clearSession();
            return false;
          }

          /**
           * Usa aquí tu helper real.
           * Si tienes getMeHttp(), úsalo.
           */
          const resp = await getMeHttp();

          if (!resp?.ok || !resp?.user) {
            await this.logout();
            return false;
          }

          const user = normalizeUser(resp.user || null);

          if (!user) {
            await this.logout();
            return false;
          }

          const incomingAccesses = normalizeAccesses(
            resp.accesses || user.accesses || [],
          );

          this.user = {
            ...user,
            accesses: incomingAccesses,
          };

          this.accesses = incomingAccesses;
          this.hydrated = true;
          this.lastMeSyncAt = Date.now();

          localStorage.setItem("user", JSON.stringify(this.user));

          if (resp.token) {
            this.token = resp.token;
            localStorage.setItem("token", resp.token);
          }

          return true;
        } catch (error) {
          console.error("Error en refreshMe:", error);
          this.clearSession();
          return false;
        } finally {
          refreshMePromise = null;
        }
      })();

      return refreshMePromise;
    },
  },
});
