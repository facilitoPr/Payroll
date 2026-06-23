<template>
  <q-page class="recruitment-page q-pa-md">
    <PageHeaderCard
      title="Reclutamiento"
      subtitle="Gestiona formularios, solicitudes recibidas y empleados desde un solo módulo."
      icon="groups"
    >
      <template>
        <q-chip
          dense
          color="primary"
          text-color="white"
          icon="verified_user"
          class="access-chip"
        >
          {{ allowedToUse ? "Acceso RRHH" : "Solo solicitudes" }}
        </q-chip>
      </template>
    </PageHeaderCard>

    <q-card flat bordered class="tabs-card">
      <q-card-section class="tabs-card__section">
        <q-tabs
          v-model="tab"
          dense
          class="recruitment-tabs text-primary"
          active-color="primary"
          indicator-color="primary"
          align="left"
          no-caps
          outside-arrows
          mobile-arrows
        >
          <q-tab
            v-if="allowedToUse"
            name="formularios"
            label="Formularios"
            icon="description"
          />

          <q-tab
            name="solicitudes"
            label="Solicitudes"
            icon="inbox"
          />

          <q-tab
            v-if="allowedToUse"
            name="empleados"
            label="Empleados"
            icon="groups"
          />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <q-tab-panels
        v-model="tab"
        animated
        class="tab-panels"
      >
        <q-tab-panel
          v-if="allowedToUse"
          name="formularios"
          class="tab-panel"
        >
          <FormContent />
        </q-tab-panel>

        <q-tab-panel
          name="solicitudes"
          class="tab-panel"
        >
          <FormApplicationContent />
        </q-tab-panel>

        <q-tab-panel
          v-if="allowedToUse"
          name="empleados"
          class="tab-panel"
        >
          <Employees :show-new-header="false" />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { authStore } from "src/stores/auth-store";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import FormContent from "src/components/recruitment/FormContent.vue";
import FormApplicationContent from "src/components/recruitment/FormApplicationContent.vue";
import Employees from "./Employees.vue";

const auth = authStore();

const roleCode = computed(() => auth.user?.rol?.code ?? "");
const deptCode = computed(() => auth.user?.department?.code ?? "");

const allowedToUse = computed(() => {
  return (
    roleCode.value === "SUPERADMIN" ||
    roleCode.value === "ADMIN" ||
    deptCode.value === "RRHH"
  );
});

const tab = ref("solicitudes");

const allowedTabs = computed(() =>
  allowedToUse.value
    ? ["formularios", "solicitudes", "empleados"]
    : ["solicitudes"]
);

const defaultTab = computed(() =>
  allowedToUse.value ? "formularios" : "solicitudes"
);

watch(
  allowedToUse,
  () => {
    if (!allowedTabs.value.includes(tab.value)) {
      tab.value = defaultTab.value;
      return;
    }

    tab.value = defaultTab.value;
  },
  { immediate: true }
);
</script>

<style scoped>
.recruitment-page {
  min-height: 100%;
}

.access-chip {
  border-radius: 999px;
  font-weight: 700;
}

.tabs-card {
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
}

.tabs-card__section {
  padding: 10px 14px 0;
}

.recruitment-tabs {
  min-height: 50px;
}

.recruitment-tabs :deep(.q-tab) {
  min-height: 46px;
  border-radius: 14px 14px 0 0;
  padding: 0 18px;
  font-weight: 700;
}

.recruitment-tabs :deep(.q-tab__icon) {
  font-size: 22px;
}

.tab-panels {
  background: transparent;
}

.tab-panel {
  padding: 18px;
}

@media (max-width: 599px) {
  .tabs-card__section {
    padding: 8px 8px 0;
  }

  .recruitment-tabs :deep(.q-tab) {
    padding: 0 12px;
  }

  .tab-panel {
    padding: 12px;
  }
}
</style>