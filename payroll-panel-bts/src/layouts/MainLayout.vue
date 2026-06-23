<template>
  <q-layout view="lHh Lpr lFf" class="main-layout">
    <AppHeader
      :left-drawer-open="leftDrawerOpen"
      @toggle-left-drawer="toggleLeftDrawer"
    />

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="310"
      :breakpoint="1024"
      class="app-drawer"
      bordered
    >
      <AppSideBar />
    </q-drawer>

    <q-page-container class="page-container">
      <div class="page-shell">
        <router-view class="page-view" />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { authStore } from "src/stores/auth-store";
import AppHeader from "./partials/AppHeader.vue";
import AppSideBar from "./AppSidebar.vue";

const $q = useQuasar();
const route = useRoute();
const auth = authStore();

const leftDrawerOpen = ref(false);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const handleVisibilityChange = async () => {
  if (document.visibilityState === "visible") {
    await auth.refreshMe({
      force: false,
      maxAgeMs: 60_000,
    });
  }
};

watch(
  () => route.fullPath,
  () => {
    if ($q.screen.lt.md) {
      leftDrawerOpen.value = false;
    }
  },
);

onMounted(async () => {
  /**
   * Esto queda como respaldo.
   * El boot/guard ya debió cargar la sesión antes.
   */
  await auth.refreshMe({
    force: false,
    maxAgeMs: 30_000,
  });

  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<style scoped lang="scss">
.main-layout {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(2, 77, 72, 0.08), transparent 28%),
    linear-gradient(135deg, #f4f7fb 0%, #eef4f7 48%, #ffffff 100%);
}

.app-drawer {
  background: #f4f7fb;
  border-right: 1px solid rgba(15, 23, 42, 0.08);
}

:deep(.q-drawer) {
  background: #f4f7fb;
}

.page-container {
  min-height: 100vh;
  overflow: hidden;
}

.page-shell {
  width: 100%;
}

.page-view {
  min-height: calc(100vh - 92px);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 5px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 20px 55px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(16px);
  margin-top: 5px;
}

@media (max-width: 1023px) {
  .page-container {
    padding-top: 4px;
  }

  .page-shell {
    padding: 10px;
  }

  .page-view {
    min-height: calc(100vh - 78px);
    border-radius: 18px;
    padding: 12px;
  }
}

@media (max-width: 600px) {
  .page-shell {
    padding: 8px;
  }

  .page-view {
    min-height: calc(100vh - 72px);
    border-radius: 16px;
    padding: 10px;
  }
}
</style>
