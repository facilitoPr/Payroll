<template>
  <div>
    <q-tabs
      v-model="tab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab
        v-for="(item, index) in status"
        :key="index"
        :name="item.code"
        :label="item.name"
      />
      <!-- <q-tab name="scheduled" label="Llamadas calendarizadas" /> -->
      <!-- <q-tab name="notanswered" label="Llamadas no contestadas" /> -->
      <!-- <q-tab name="quotes" label="Confirmacion de citas" /> -->
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="PATIENTLIST">
        <!-- <div class="text-h6">Pendientes</div> -->
        <TablaAssignments
          status="PATIENTLIST"
          title="ASIGNACIONES PENDIENTES"
        />
      </q-tab-panel>

      <q-tab-panel name="NOTANSWERED">
        <TablaAssignments
          status="NOTANSWERED"
          title="LLAMADAS NO CONTESTADAS"
        />
      </q-tab-panel>

      <q-tab-panel name="SCHEDULED">
        <TablaAssignments status="SCHEDULED" title="LLAMADAS CALENDARIZADAS" />
      </q-tab-panel>

      <q-tab-panel name="APPOINTMENT">
        <TablaAssignments status="APPOINTMENT" title="CONFIRMACION DE CITAS" />
      </q-tab-panel>

      <q-tab-panel name="NOINTERESTED">
        <TablaAssignments status="NOINTERESTED" title="NO INTERESADOS" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import TablaAssignments from "src/components/asignments/TablaAssignments.vue";
import { ref, onMounted } from "vue";

const tab = ref("PATIENTLIST");
const status = ref([]);

onMounted(() => {
  getStatus();
});

const getStatus = async () => {
  let resp = await methodsHttp.getApi(`status/getStatus`);

  if (resp.ok) {
    status.value = resp.status;
  }
};
</script>
