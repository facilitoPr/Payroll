<template>
  <q-page class="q-pa-md termination-config-page">
    <PageHeaderCard
      title="Configuración de Desvinculación Laboral"
      subtitle="Administra reglas de preaviso, cesantía, regalía, vacaciones y ajustes manuales para liquidaciones."
      icon="person_remove"
    />

    <q-card flat bordered class="tabs-card q-mt-md">
      <q-tabs
        v-model="tab"
        dense
        class="termination-tabs text-primary"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="policies" icon="gavel" label="Política legal" />
      </q-tabs>
    </q-card>

    <q-tab-panels v-model="tab" animated keep-alive class="bg-transparent">
      <q-tab-panel name="policies" class="q-pa-none q-pt-md">
        <LaborTerminationPolicyRDTab
          ref="policyRef"
          @loading="setLoading"
        />
      </q-tab-panel>
    </q-tab-panels>

    <q-inner-loading :showing="loading">
      <q-spinner size="42px" color="primary" />
    </q-inner-loading>
  </q-page>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";

import PageHeaderCard from "src/components/PageHeaderCard.vue";
import LaborTerminationPolicyRDTab from "src/components/employeeTermination/LaborTerminationPolicyRDTab.vue";

const tab = ref("policies");
const loading = ref(false);
const policyRef = ref(null);

const setLoading = (value) => {
  loading.value = value;
};

const reloadActiveTab = async () => {
  await nextTick();

  if (tab.value === "policies") {
    policyRef.value?.reload?.();
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
.termination-config-page {
  min-height: calc(100vh - 100px);
}

.termination-tabs {
  border-radius: 16px;
}

.tabs-card {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.04);
}

.help-card,
.info-box {
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.04);
}
</style>