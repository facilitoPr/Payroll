<template>
  <q-page class="q-pa-md employee-loan-provider-page">
    <PageHeaderCard
      title="Configuración de préstamos"
      subtitle="Define las reglas principales del préstamo y los sistemas autorizados a consultar esta API."
      icon="account_balance_wallet"
    />

    <q-card flat bordered class="tabs-card">
      <q-tabs
        v-model="tab"
        dense
        class="loan-tabs text-primary"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab
          name="productConfig"
          icon="tune"
          label="Producto de préstamo"
        />

        <q-tab
          name="integrationClients"
          icon="hub"
          label="Integraciones"
        />
      </q-tabs>
    </q-card>

    <q-tab-panels v-model="tab" animated keep-alive class="bg-transparent">
      <q-tab-panel name="productConfig" class="q-pa-none q-pt-md">
        <EmployeeLoanProductConfigTab
          ref="productConfigRef"
          @loading="setLoading"
        />
      </q-tab-panel>

      <q-tab-panel name="integrationClients" class="q-pa-none q-pt-md">
        <EmployeeLoanIntegrationClientTab
          ref="integrationClientsRef"
          @loading="setLoading"
        />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";
import EmployeeLoanIntegrationClientTab from "./config/EmployeeLoanIntegrationClientTab.vue";
import EmployeeLoanProductConfigTab from "./config/EmployeeLoanProductConfigTab.vue";
import PageHeaderCard from "src/components/PageHeaderCard.vue";

const tab = ref("productConfig");
const loading = ref(false);

const productConfigRef = ref(null);
const integrationClientsRef = ref(null);

const setLoading = (value) => {
  loading.value = value;
};

const reloadActiveTab = async () => {
  await nextTick();

  if (tab.value === "productConfig") {
    productConfigRef.value?.reload?.();
  }

  if (tab.value === "integrationClients") {
    integrationClientsRef.value?.reload?.();
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
.employee-loan-provider-page {
  min-height: calc(100vh - 100px);
}

.tabs-card {
  border-radius: 18px;
  overflow: hidden;
}

.loan-tabs {
  border-radius: 16px;
}
</style>