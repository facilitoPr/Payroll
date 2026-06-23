<template>
  <q-page class="q-pa-md payroll-config-page">
    <PageHeaderCard
      title="Configuración de Nómina"
      subtitle="Administra deducciones, ISR, vacaciones y horarios de pago para la nómina."
      icon="settings"
    />

    <q-card flat bordered class="tabs-card">
      <q-tabs
        v-model="tab"
        dense
        class="payroll-tabs text-primary"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="deductions" icon="price_check" label="Deducciones" />
        <q-tab name="isr" icon="account_balance" label="ISR" />
        <q-tab name="leavePolicies" icon="rule" label="Políticas de pérmisos" />
        <q-tab
          name="schedules"
          icon="calendar_month"
          label="Horarios de pagos"
        />
        <q-tab
          name="employeeLoanPolicies"
          icon="account_balance_wallet"
          label="Políticas de préstamos"
        />
      </q-tabs>
    </q-card>

    <q-tab-panels v-model="tab" animated keep-alive class="bg-transparent">
      <q-tab-panel name="deductions" class="q-pa-none q-pt-md">
        <DeductionTypeTab ref="deductionsRef" @loading="setLoading" />
      </q-tab-panel>

      <q-tab-panel name="isr" class="q-pa-none q-pt-md">
        <IncomeTaxRDTab ref="isrRef" @loading="setLoading" />
      </q-tab-panel>

      <q-tab-panel name="leavePolicies" class="q-pa-none q-pt-md">
        <LeavePolicyTab ref="leavePoliciesRef" @loading="setLoading" />
      </q-tab-panel>

      <q-tab-panel name="schedules" class="q-pa-none q-pt-md">
        <ShedulePaymentTab ref="schedulesRef" @loading="setLoading" />
      </q-tab-panel>

      <q-tab-panel name="employeeLoanPolicies" class="q-pa-none q-pt-md">
        <EmployeeLoanPolicyTab
          ref="employeeLoanPoliciesRef"
          @loading="setLoading"
        />
      </q-tab-panel>
    </q-tab-panels>

  </q-page>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";

import DeductionTypeTab from "src/components/employeePayment/DeductionTypeTab.vue";
import IncomeTaxRDTab from "src/components/employeePayment/IncomeTaxRDTab.vue";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import ShedulePaymentTab from "src/components/employeePayment/ShedulePaymentTab.vue";
import LeavePolicyTab from "src/components/employeePayment/LeavePolicyTab.vue";
import EmployeeLoanPolicyTab from "src/components/employeePayment/EmployeeLoanPolicyTab.vue";

const tab = ref("deductions");
const loading = ref(false);

const deductionsRef = ref(null);
const isrRef = ref(null);
const vacationsRef = ref(null);
const schedulesRef = ref(null);
const leavePoliciesRef = ref(null);
const employeeLoanPoliciesRef = ref(null);

const setLoading = (value) => {
  loading.value = value;
};

const reloadActiveTab = async () => {
  await nextTick();

  if (tab.value === "deductions") {
    deductionsRef.value?.reload?.();
  }

  if (tab.value === "isr") {
    isrRef.value?.reload?.();
  }

  if (tab.value === "vacations") {
    vacationsRef.value?.reload?.();
  }

  if (tab.value === "schedules") {
    schedulesRef.value?.reload?.();
  }

  if (tab.value === "leavePolicies") {
    leavePoliciesRef.value?.reload?.();
  }

  if (tab.value === "employeeLoanPolicies") {
    employeeLoanPoliciesRef.value?.reload?.();
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
.payroll-config-page {
  min-height: calc(100vh - 100px);
}

.payroll-tabs {
  border-radius: 16px;
}

.tabs-card {
  border-radius: 18px;
  overflow: hidden;
}
</style>
