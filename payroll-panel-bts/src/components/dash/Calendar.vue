<template>
  <div>
    <div class="text-primary text-bold q-ma-md" style="font-size: 1.4rem">
      Calendario
    </div>
  </div>

  <div class="row" style="height: 328px">
    <div class="q-mx-md q-mb-md">
      <q-date
        v-model="days"
        minimal
        flat
        :events="events"
        style="width: 100%; height: 100%; background: #eceffd"
        event-color="secondary"
       
      />
    </div>
  </div>
</template>
  
  <script setup>
import { defineProps, defineEmits, ref, watch, onMounted } from "vue";
import moment from "moment";
import methodsHttp from "src/api/methodsHttp";

import { authStore } from "src/stores/auth-store";
const auth = authStore();

const appoiments = ref([]);
const events = ref([]);

const days = ref([]);

onMounted(() => {
  getAppointmentByUser();
});

const getAppointmentByUser = async () => {
  const response = await methodsHttp.getApi(
    `appointment/getAppointmentByUser/${auth.userAssociate}`
  );

  if (response.ok) {
    let nuevo = response.citas.map((e) => {
      if (e.isTaken) {
        appoiments.value.push({
          date: moment(e.date).format("YYYY-MM-DD"),
        });
      }

      return moment(e.date).format("YYYY/MM/DD");
    });

    events.value = nuevo;
    days.value = nuevo;
  }
};
</script>




<style>
/* .q-date__view{
    background: red;
} */
</style>