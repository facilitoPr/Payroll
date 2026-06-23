<template>
  <q-btn unelevated no-caps rounded class="user-menu-trigger">
    <div class="row items-center no-wrap">
      <q-avatar size="42px" class="user-avatar">
        {{ userInitial }}
      </q-avatar>

      <div class="q-ml-sm text-left gt-xs">
        <div class="text-weight-bold ellipsis user-name">
          {{ userName }}
        </div>

        <div class="text-caption user-email">
          {{ userEmail }}
        </div>
      </div>

      <q-icon name="expand_more" size="18px" class="q-ml-sm text-grey-6" />
    </div>

    <q-menu
      anchor="bottom right"
      self="top right"
      :offset="[0, 12]"
      class="user-menu-popup"
    >
      <div class="user-menu-card">
        <div class="user-menu-card__head">
          <q-avatar size="56px" class="user-avatar user-avatar--large">
            {{ userInitial }}
          </q-avatar>

          <div class="user-menu-meta">
            <div class="user-menu-meta__name ellipsis">{{ userName }}</div>
            <div class="user-menu-meta__email ellipsis">{{ userEmail }}</div>

            <q-chip dense square icon="verified_user" class="role-chip q-mt-sm">
              {{ roleLabel }}
            </q-chip>
          </div>
        </div>

        <q-separator class="q-my-sm" />

        <q-list padding>
          <template v-for="item in menus" :key="item.code">
            <q-item
              v-if="isInternalItem(item)"
              clickable
              v-close-popup
              class="user-menu-item"
              @click="router.push(item.path!)"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon || 'chevron_right'" color="primary" />
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ item.name }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              v-else-if="isExternalItem(item)"
              clickable
              tag="a"
              :target="item.openInNewTab ? '_blank' : '_self'"
              :href="item.externalPath!"
              class="user-menu-item"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon || 'open_in_new'" color="primary" />
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ item.name }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-expansion-item
              v-else-if="isCollapsible(item)"
              dense
              dense-toggle
              expand-separator
              class="user-menu-expansion"
              :icon="item.icon || 'folder'"
              :label="item.name"
            >
              <q-list class="q-pl-md q-pr-sm q-pb-sm">
                <q-item
                  v-for="child in item.children"
                  :key="child.code"
                  clickable
                  v-close-popup
                  class="user-menu-item"
                  @click="navigateMenu(child)"
                >
                  <q-item-section avatar>
                    <q-icon
                      :name="child.icon || 'chevron_right'"
                      color="primary"
                    />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>{{ child.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </template>

          <q-item
            clickable
            v-close-popup
            class="user-menu-item"
            @click="goToDashboard"
          >
            <q-item-section avatar>
              <q-icon name="dashboard" color="primary" />
            </q-item-section>

            <q-item-section>
              <q-item-label>Ir al dashboard</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-sm" />

          <q-item
            clickable
            v-close-popup
            class="user-menu-item user-menu-item--danger"
            @click="handleLogout"
          >
            <q-item-section avatar>
              <q-icon name="logout" color="negative" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-negative">
                Cerrar sesión
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { authStore } from "src/stores/auth-store";
import { AppMenuNode } from '../../composable/useAppMenus';

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

  if (!rol) return "Sin rol";
  if (typeof rol === "string") return rol;

  return rol.name || rol.code || "Sin rol";
});

const navigateMenu = (item: AppMenuNode) => {
  if (props.isInternalItem(item) && item.path) {
    router.push(item.path);
    return;
  }

  if (props.isExternalItem(item) && item.externalPath) {
    window.open(item.externalPath, item.openInNewTab ? "_blank" : "_self");
  }
};

const goToDashboard = () => {
  router.push(auth.defaultHomeRoute || "/portal/dashboard");
};

const handleLogout = async () => {
  await auth.logout();
  await router.replace("/login");
};
</script>

<style scoped lang="scss">
.user-menu-trigger {
  background: rgba(255, 255, 255, 0.82);
  color: $dark;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 4px 8px;
}

.user-menu-trigger:hover {
  background: #ffffff;
}

.user-avatar {
  color: #ffffff;
  background: linear-gradient(135deg, #024d48, #1964a2);
  font-weight: 900;
  box-shadow: 0 10px 22px rgba($primary, 0.24);
}

.user-avatar--large {
  min-width: 56px;
}

.user-name {
  max-width: 180px;
}

.user-email {
  color: rgba(15, 23, 42, 0.56);
}

.user-menu-card {
  width: 320px;
  padding: 12px;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
}

.user-menu-card__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 6px;
}

.user-menu-meta {
  min-width: 0;
  flex: 1;
}

.user-menu-meta__name {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.user-menu-meta__email {
  margin-top: 4px;
  font-size: 0.82rem;
  color: rgba(15, 23, 42, 0.56);
}

.role-chip {
  background: rgba($primary, 0.08);
  color: $primary;
  border: 1px solid rgba($primary, 0.14);
  font-weight: 700;
}

.user-menu-item {
  min-height: 48px;
  border-radius: 14px;
}

.user-menu-item:hover {
  background: rgba($primary, 0.06);
}

.user-menu-item--danger:hover {
  background: rgba($negative, 0.06);
}

.user-menu-expansion {
  border-radius: 14px;
  overflow: hidden;
}
</style>