<template>
  <q-page class="q-pa-md org-page">
    <PageHeaderCard
      title="Organización"
      subtitle="Administra compañías, departamentos y puestos de trabajo"
      icon="business"
    />

    <q-card flat bordered class="tabs-card">
      <q-tabs
        v-model="tab"
        dense
        class="organization-tabs text-primary"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="companies" icon="business" label="Compañías" />
        <q-tab name="departments" icon="apartment" label="Departamentos" />
        <q-tab name="positions" icon="work" label="Puestos" />
      </q-tabs>
    </q-card>

    <q-tab-panels v-model="tab" animated keep-alive class="bg-transparent">
      <q-tab-panel name="companies" class="q-pa-none q-pt-md">
        <CompaniesTab ref="companiesRef" @loading="setLoading" />
      </q-tab-panel>

      <q-tab-panel name="departments" class="q-pa-none q-pt-md">
        <DepartmentsTab ref="departmentsRef" @loading="setLoading" />
      </q-tab-panel>

      <q-tab-panel name="positions" class="q-pa-none q-pt-md">
        <JobPositionsTab ref="positionsRef" @loading="setLoading" />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";
import CompaniesTab from "src/components/organization/CompaniesTab.vue";
import DepartmentsTab from "src/components/organization/DepartmentsTab.vue";
import JobPositionsTab from "src/components/organization/JobPositionsTab.vue";
import PageHeaderCard from "src/components/PageHeaderCard.vue";

const tab = ref("companies");
const loading = ref(false);

const companiesRef = ref(null);
const departmentsRef = ref(null);
const positionsRef = ref(null);

const setLoading = (value) => {
  loading.value = value;
};

const reloadActiveTab = async () => {
  await nextTick();

  if (tab.value === "companies") {
    companiesRef.value?.reload?.();
  }

  if (tab.value === "departments") {
    departmentsRef.value?.reload?.();
  }

  if (tab.value === "positions") {
    positionsRef.value?.reload?.();
  }
};

watch(tab, async () => {
  await reloadActiveTab();
});

defineExpose({
  reloadActiveTab,
});
</script>

<style scoped>
.org-page {
  min-height: calc(100vh - 100px);
}

.organization-tabs {
  border-radius: 16px;
}

.tabs-card {
  border-radius: 18px;
  overflow: hidden;
}
</style>
