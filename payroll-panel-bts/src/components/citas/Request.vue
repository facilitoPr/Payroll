<template>
  <div
    class="col-12 col-lg-12 col-xl-6 row justify-center q-pa-sm"
    style="cursor: pointer"
    v-for="(item, index) in getAppointments"
    :key="index"
    @click="selectRequest(item)"
  >
    <q-card class="bordere col-12 q-pa-md" style="border-radius: 5px">
      <div class="" style="margin-top: 5px">
        <b style="font-size: 15px" class="text-dark">{{
          item?.patient?.name
        }}</b>
      </div>
      <div class="q-my-sm">Horario de apertura</div>
      <div style="margin-top: 5px">
        <q-icon name="calendar_month" color="primary" size="25px" />
        <b style="font-size: 12px; color: #999999"> {{ item?.day?.day }}</b>
      </div>

      <div style="margin-top: 5px">
        <q-icon name="alarm" color="primary" size="25px" />
        <b style="font-size: 12px; color: #999999">
          {{ moment(item?.schedule?.initHour, "HH:mm").format("h:mm A") }} -
          {{ moment(item?.schedule?.finalHour, "HH:mm").format("h:mm A") }}</b
        >
      </div>
      <div
        style="
          margin-top: 5px;
          font-size: 12px;
          text-justify: center;
          color: #999999;
        "
      >
        <b>
          {{ item?.note }}
        </b>
      </div>

      <!-- <div class="col-auto text-secondary q-mt-sm">
        {{ item.status.name }}
      </div> -->
      <div :class="`status-${item.status.code}`" class="col-auto q-mt-sm">
        {{ item.status.name }}
      </div>

      <div class="text-right">
        <q-avatar size="30px" class="col-auto">
          <img :src="item.patient.img" />
        </q-avatar>
      </div>
    </q-card>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch, onMounted } from "vue";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";

const emit = defineEmits(["updateRequest"]);

const selectRequest = (item) => {
  emit("updateRequest", item);
};

const props = defineProps({
  getAppointments: {
    type: Array,
    required: true,
  },
});

// const getAppointments = ref([]);

onMounted(async () => {
  //   const resp = await methodsHttp.getApi(`reminders/getAppointmentRequest`);
  //   getAppointments.value = resp.getAppointments;
  //   console.log(resp.getAppointments);
});
</script>

<style>

</style>