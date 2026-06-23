<template>
  <div class="col-auto">
    <q-btn
      flat
      round
      dense
      icon="apps"
      class="header-icon-btn"
      size="18px"
      color="primary"
      aria-label="Abrir menú de cuenta"
    />

    <q-menu
      anchor="bottom right"
      self="top right"
      transition-show="jump-down"
      transition-hide="jump-up"
      class="account-menu"
      :offset="[0, 10]"
      bordered
    >
      <q-card flat class="shadow-2 overflow-hidden account-card">
        <!-- HEADER -->
        <div class="account-header q-pa-md">
          <div class="column items-center">
            <q-avatar size="76px" class="ring-avatar">
              <q-img
                v-if="auth.user?.img"
                :src="auth.user.img"
                alt="Avatar"
              />

              <div v-else>
                {{ userInitial }}
              </div>
            </q-avatar>

            <div class="text-subtitle1 q-mt-sm text-weight-bold text-center ellipsis-2-lines">
              {{ userName }}
            </div>

            <div class="text-caption text-grey-7 text-center">
              {{ roleLabel }}
            </div>
          </div>
        </div>

        <q-separator />

        <q-card-section class="q-pt-sm q-pb-none">
          <div class="text-body2 text-weight-medium text-grey-8 q-mb-xs text-center">
            Account Info
          </div>
        </q-card-section>

        <q-list padding class="q-pt-none">
          <!-- PERFIL -->
          <q-item clickable v-ripple class="menu-item" @click="goToProfile">
            <q-item-section avatar>
              <q-icon name="person" color="primary" size="24px" />
            </q-item-section>

            <q-item-section>
              <div class="text-body1">Perfil</div>
              <div class="text-caption text-grey-7">
                Datos y seguridad
              </div>
            </q-item-section>

            <q-item-section side>
              <q-icon name="chevron_right" color="grey-6" />
            </q-item-section>
          </q-item>

          <!-- PONCHAR -->
          <q-item clickable v-ripple class="menu-item" @click="goToPunch">
            <q-item-section avatar>
              <q-icon name="fingerprint" color="primary" size="24px" />
            </q-item-section>

            <q-item-section>
              <div class="text-body1">Ponchar</div>
              <div class="text-caption text-grey-7">
                Registrar entrada/salida
              </div>
            </q-item-section>

            <q-item-section side>
              <q-icon name="chevron_right" color="grey-6" />
            </q-item-section>
          </q-item>

          <!-- MENÚS DINÁMICOS DEL USER MENU -->
          <template v-for="item in menus" :key="item.code">
            <q-item
              v-if="isInternalItem(item)"
              clickable
              v-ripple
              class="menu-item"
              @click="router.push(item.path!)"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon || 'chevron_right'" color="primary" size="24px" />
              </q-item-section>

              <q-item-section>
                <div class="text-body1">{{ item.name }}</div>
                <div class="text-caption text-grey-7">
                  Acceso rápido
                </div>
              </q-item-section>

              <q-item-section side>
                <q-icon name="chevron_right" color="grey-6" />
              </q-item-section>
            </q-item>

            <q-item
              v-else-if="isExternalItem(item)"
              clickable
              v-ripple
              tag="a"
              :href="item.externalPath!"
              :target="item.openInNewTab ? '_blank' : '_self'"
              class="menu-item"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon || 'open_in_new'" color="primary" size="24px" />
              </q-item-section>

              <q-item-section>
                <div class="text-body1">{{ item.name }}</div>
                <div class="text-caption text-grey-7">
                  Enlace externo
                </div>
              </q-item-section>

              <q-item-section side>
                <q-icon name="chevron_right" color="grey-6" />
              </q-item-section>
            </q-item>

            <q-expansion-item
              v-else-if="isCollapsible(item)"
              dense
              dense-toggle
              expand-separator
              class="menu-expansion"
              :icon="item.icon || 'folder'"
              :label="item.name"
            >
              <q-list class="q-pl-md q-pr-sm q-pb-sm">
                <q-item
                  v-for="child in item.children"
                  :key="child.code"
                  clickable
                  v-ripple
                  class="menu-item"
                  @click="navigateMenu(child)"
                >
                  <q-item-section avatar>
                    <q-icon
                      :name="child.icon || 'chevron_right'"
                      color="primary"
                      size="22px"
                    />
                  </q-item-section>

                  <q-item-section>
                    <div class="text-body2">{{ child.name }}</div>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </template>

          <q-item clickable v-ripple class="menu-item" @click="goToDashboard">
            <q-item-section avatar>
              <q-icon name="dashboard" color="primary" size="24px" />
            </q-item-section>

            <q-item-section>
              <div class="text-body1">Dashboard</div>
              <div class="text-caption text-grey-7">
                Volver al panel principal
              </div>
            </q-item-section>

            <q-item-section side>
              <q-icon name="chevron_right" color="grey-6" />
            </q-item-section>
          </q-item>
        </q-list>

        <q-separator spaced />

        <q-card-actions align="between" class="q-px-md q-pb-md q-pt-xs">
          <div class="text-caption text-grey-6">Sesión activa</div>

          <q-btn
            flat
            color="negative"
            class="menu-signout"
            icon="exit_to_app"
            label="Sign out"
            no-caps
            @click="handleLogout"
          />
        </q-card-actions>
      </q-card>
    </q-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { authStore } from "src/stores/auth-store";
import type { AppMenuNode } from "../../composable/useAppMenus";

const props = defineProps<{
  menus: AppMenuNode[];
  isInternalItem: (item: AppMenuNode) => boolean;
  isExternalItem: (item: AppMenuNode) => boolean;
  isCollapsible: (item: AppMenuNode) => boolean;
}>();

const router = useRouter();
const auth = authStore();

const userName = computed(() => auth.user?.name || "Usuario");
const userEmail = computed(() => auth.user?.email || "Sin correo");

const userInitial = computed(() => {
  const name = auth.user?.name?.trim() || "U";
  return name.charAt(0).toUpperCase();
});

const roleLabel = computed(() => {
  const rol = auth.user?.rol || auth.user?.role;

  if (!rol) return "Empleado";
  if (typeof rol === "string") return rol;

  return rol.name || rol.code || "Empleado";
});

const goToProfile = () => {
  router.push("/portal/profile");
};

const goToPunch = () => {
  router.push("/punch");
};

const goToDashboard = () => {
  router.push(auth.defaultHomeRoute || "/portal/dashboard");
};

const navigateMenu = (item: AppMenuNode) => {
  if (props.isInternalItem(item) && item.path) {
    router.push(item.path);
    return;
  }

  if (props.isExternalItem(item) && item.externalPath) {
    window.open(item.externalPath, item.openInNewTab ? "_blank" : "_self");
  }
};

const handleLogout = async () => {
  await auth.logout();
  await router.replace("/login");
};
</script>

<style scoped>
.header-icon-btn {
  border-radius: 14px;
  background: rgba(37, 99, 235, 0.06);
}

.account-menu {
  color: #111;
}

.account-card {
  min-width: 310px;
  max-width: 340px;
  border-radius: 22px;
}

.account-header {
  background: linear-gradient(
    135deg,
    rgba(33, 150, 243, 0.1),
    rgba(76, 175, 80, 0.06)
  );
  backdrop-filter: saturate(120%) blur(4px);
}

.ring-avatar {
  color: white;
  font-weight: 800;
  background: linear-gradient(135deg, #1a2436, #1964a2);
  box-shadow:
    0 0 0 2px #fff,
    0 0 0 4px rgba(33, 150, 243, 0.35);
  border-radius: 9999px;
}

.menu-item {
  border-radius: 14px;
  margin: 4px 8px;
  padding: 8px 10px;
  transition:
    transform 0.08s ease,
    background-color 0.2s ease;
}

.menu-item:hover {
  background: rgba(0, 0, 0, 0.035);
  transform: translateY(-1px);
}

.menu-expansion {
  border-radius: 14px;
  overflow: hidden;
}

.menu-signout {
  border-radius: 10px;
  padding: 4px 10px;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.q-item__section--avatar) {
  min-width: 36px;
}

@media (max-width: 480px) {
  .account-card {
    min-width: min(310px, calc(100vw - 24px));
    max-width: calc(100vw - 24px);
  }
}
</style>