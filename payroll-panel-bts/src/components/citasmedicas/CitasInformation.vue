<template>
  <div class="col-12 row justify-between">
    <div class="col-12 q-my-md">
      <b> DATOS DE LA CITA</b>
    </div>

    <div class="col-12 q-my-sm">
      <b style="color: #cdcdcd"> ESTADO*</b>
    </div>
    <div class="col-12 q-my-sm" :class="`status-${data?.status?.code}`">
      PENDIENTE
    </div>
    <div class="col-12 row" v-if="data?.isVirtual">
      <div class="col-12 q-my-sm">
        <b style="color: #cdcdcd"> Enlace de reunion*</b>
      </div>
      <div class="col-12 q-my-sm" :class="`status-${data?.status?.code}`">
        <a :href="`https://meet.jit.si/${data?.code}`">Click aqui para aceder a la reunion virtual</a>
      </div>
    </div>

    <div class="col-12 q-my-sm">
      <b style="color: #cdcdcd"> Doctor*</b>
    </div>
    <div class="col-12 q-my-sm">Dr. {{ data.user?.name }}</div>

    <div class="col-12 q-my-sm">
      <b style="color: #cdcdcd"> Paciente*</b>
    </div>
    <div class="col-12 q-my-sm">{{ data.patients?.name ? data.patients?.name : "Ningun paciente ha tomado la cita aún"}}</div>

    <div class="col-12 q-my-sm">
      <b style="color: #cdcdcd"> Descripcion*</b>
    </div>
    <div class="col-12 q-my-sm">
      {{ data?.description }}
    </div>
    <div class="col-12 q-my-sm">
      <b style="color: #cdcdcd"> Código*</b>
    </div>
    <div class="col-12 q-my-sm">
      {{ data.code }}
    </div>
    <div class="col-12 q-my-sm">
      <b style="color: #cdcdcd"> Número de turno*</b>
    </div>
    <div class="col-12 q-my-sm"># {{ data?.turnNumber }}</div>
    <div class="col-12 q-my-sm">
      <b style="color: #cdcdcd"> Fecha*</b>
    </div>
    <div class="col-12 q-my-sm">
      {{ moment(data?.date).format("DD-MM-YYYY") }}
    </div>
    <div class="col-12 q-my-sm">
      <b style="color: #cdcdcd"> Horario*</b>
    </div>

    <div class="col-12 q-my-sm">
      Cita el
      <b style="font-weight: bold">{{
        moment(data.date).format("MM/DD/YYYY")
      }}</b>
      de {{ moment(data.initHour).format("h:mm A") }} a
      {{ moment(data.finalHour).format("h:mm A") }}
    </div>

    <div class="col-12 q-my-sm">
      <q-checkbox
        label="Marque esta opción para confirmar que el paciente ha llegado y finalizar la cita.."
        v-model="isArrived"
      />
    </div>

    <div class="col-12 row q-my-md justify-between">
      <div class="col-auto" v-if="!isArrived">
        <ReprogramarCita :data="data" @closeModal="closeModal" />
      </div>
      <div class="col-auto" v-if="isArrived">
        <q-btn
          color="secondary"
          label="Finalizar cita"
          style="width: 100%; height: 40px"
          @click="finishAppoiments"
        />
      </div>
      <div class="col-auto">
        <q-btn
          color="negative"
          label="Cancelar"
          style="width: 100%; height: 40px"
          @click="cancelAppoiments"
        />
      </div>
    </div>
    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch, onMounted } from "vue";
import moment from "moment";
import ReprogramarCita from "./ReprogramarCita.vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";

const isArrived = ref(false);

const emit = defineEmits(["closeModalInformation"]);

const notify = ref();

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: {},
  },
});

const closeModal = async () => {
  await emit("closeModalInformation");
};

const finishAppoiments = async () => {
  console.log(props.data._id, "props.data._id");
  let resp = await methodsHttp.putApi(
    `appointment/finishAppoiments/${props.data._id}`,
    {}
  );
  if (resp.ok) {
    notify.value?.showNotifyGood(resp.mensaje);
    await emit("closeModalInformation");
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
};

const cancelAppoiments = async () => {
  console.log(props.data._id, "props.data._id");
  let resp = await methodsHttp.putApi(
    `appointment/cancelAppoiments/${props.data._id}`,
    {}
  );
  if (resp.ok) {
    notify.value?.showNotifyGood(resp.mensaje);
    await emit("closeModalInformation");
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
};

cancelAppoiments;
</script>