<template>
  <q-header class="app-header bg-white">
    <q-toolbar class="toolbar-main">
      <!-- LEFT -->
      <div class="row items-center no-wrap q-gutter-sm">
        <q-btn
          dense
          round
          unelevated
          color="primary"
          :icon="leftDrawerOpen ? 'chevron_left' : 'menu'"
          text-color="white"
          class="drawer-btn"
          @click="$emit('toggle-left-drawer')"
        />

        <div class="header-title-wrap gt-sm">
          <div class="header-title ellipsis">
            {{ pageTitle }}
          </div>
          <div class="header-subtitle ellipsis">
            Gestión central · {{ roleLabel }}
          </div>
        </div>
      </div>

      <!-- CENTER TOPBAR -->
      <div v-if="topbarMenus.length" class="header-center desktop-only">
        <AppTopbarMenu
          :menus="topbarMenus"
          :is-internal-item="isInternalItem"
          :is-external-item="isExternalItem"
          :is-collapsible="isCollapsible"
          :is-route-active="isRouteActive"
          :tree-has-active="treeHasActive"
        />
      </div>

      <q-space />

      <!-- RIGHT -->
      <div class="row items-center no-wrap q-gutter-sm">
        <q-btn
          flat
          round
          dense
          color="primary"
          icon="support_agent"
          class="header-icon-btn"
          @click="showSupportDialog = true"
        >
          <q-tooltip>Help Desk</q-tooltip>
        </q-btn>

        <q-btn
          flat
          round
          dense
          color="primary"
          icon="corporate_fare"
          class="header-icon-btn"
          @click="showCompanyDialog = true"
        >
          <q-tooltip>Quiénes somos</q-tooltip>
        </q-btn>

        <NotificationBell />

        <AppUserMenu
          :menus="userMenus"
          :is-internal-item="isInternalItem"
          :is-external-item="isExternalItem"
          :is-collapsible="isCollapsible"
        />
      </div>
    </q-toolbar>

    <CompanyIdentityDialog v-model="showCompanyDialog" />

    <SupportTicketDialog
      v-model="showSupportDialog"
      @created="handleSupportCreated"
    />
  </q-header>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import NotificationBell from "src/components/notifications/NotificationBell.vue";
import CompanyIdentityDialog from "src/components/header/CompanyIdentityDialog.vue";
import SupportTicketDialog from "src/components/support/SupportTicketDialog.vue";
import AppTopbarMenu from "./AppTopbarMenu.vue";
import AppUserMenu from "./AppUserMenu.vue";
import { useAppMenus } from "src/composable/useAppMenus";

defineProps<{
  leftDrawerOpen: boolean;
}>();

defineEmits<{
  (e: "toggle-left-drawer"): void;
}>();

const route = useRoute();

const showCompanyDialog = ref(false);
const showSupportDialog = ref(false);

const {
  auth,
  topbarMenus,
  userMenus,
  isInternalItem,
  isExternalItem,
  isCollapsible,
  isRouteActive,
  treeHasActive,
} = useAppMenus();

const roleLabel = computed(() => {
  const rol = auth.user?.rol || auth.user?.role;

  if (!rol) return "Sin rol";
  if (typeof rol === "string") return rol;

  return rol.name || rol.code || "Sin rol";
});

const pageTitle = computed(() => {
  const metaTitle = route.meta?.title;

  if (typeof metaTitle === "string" && metaTitle.trim()) return metaTitle;
  if (typeof route.name === "string" && route.name.trim()) return route.name;

  return "Dashboard";
});

const handleSupportCreated = () => {
  // Aquí puedes refrescar contador/lista de tickets si luego lo necesitas.
};
</script>

<style scoped lang="scss">
.app-header {
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  border-bottom-left-radius: 10px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
}

.toolbar-main {
  min-height: 64px;
  padding: 0 14px;
  display: flex;
  align-items: center;
}

.drawer-btn {
  box-shadow: 0 10px 24px rgba($primary, 0.22);
}

.header-title-wrap {
  min-width: 0;
}

.header-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.05;
}

.header-subtitle {
  margin-top: 3px;
  font-size: 0.76rem;
  color: rgba(15, 23, 42, 0.52);
  line-height: 1.15;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
  padding: 0 18px;
}

.header-icon-btn {
  border-radius: 14px;
  background: rgba($primary, 0.06);
  border: 1px solid rgba($primary, 0.08);
  transition: all 0.2s ease;
}

.header-icon-btn:hover {
  background: rgba($primary, 0.12);
  transform: translateY(-1px);
}

@media (max-width: 1023px) {
  .desktop-only {
    display: none !important;
  }

  .toolbar-main {
    min-height: 66px;
    padding: 0 10px;
  }
}
</style>