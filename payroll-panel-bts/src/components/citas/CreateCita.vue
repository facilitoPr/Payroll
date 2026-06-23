<template>
  <div>
    <div class="col-12 row justify-between">
      <div class="col-auto row items-center" style="cursor: pointer">
        <div class="col-auto" @click="selectRequest">
          <q-icon name="arrow_back" color="primary" size="25px" />
        </div>

        <div v-if="requestSeleted.status.code == 'PENDING'" class="col-auto">
          CREAR CITA
        </div>
        <div
          v-if="requestSeleted.status.code == 'PENDINGTOACCEPTPATIENT'"
          class="col-auto"
        >
          PENDIENTE
        </div>
        <div v-if="requestSeleted.status.code == 'CANCELED'" class="col-auto">
          CANCELADA
        </div>
        <div v-if="requestSeleted.status.code == 'REJECTED'" class="col-auto">
          RECHAZADA
        </div>
      </div>

      <div class="col-auto" v-if="requestSeleted.status.code == 'PENDING'">
        <q-btn color="primary" label="guardar" @click="saveCita" />
      </div>

      <div
        class="col-auto"
        v-if="requestSeleted.status.code == 'PENDINGTOACCEPTPATIENT'"
      >
        <q-btn color="primary" label="Actualizar" @click="saveCita" />
      </div>

      <div class="col-auto" v-if="requestSeleted.status.code == 'CANCELED'">
        <q-btn color="negative" label="Eliminar" @click="deleteAppointment" />
      </div>

      <div class="col-auto" v-if="requestSeleted.status.code == 'REJECTED'">
        <q-btn color="primary" label="Actualizar" @click="saveCita" />
      </div>

      <div class="col-auto" v-if="requestSeleted.status.code == 'ACCEPTED'">
        <q-btn color="primary" label="Finalizar turno" @click="finish()" />
      </div>
    </div>
    <div class="col-12 q-my-md">
      <b> DATOS DE LA CITA</b>
    </div>

    <div v-if="requestSeleted.status.code == 'ACCEPTED'">
      <q-checkbox
        v-model="valuePatient"
        label="Confirme la asistencia del paciente"
      />
    </div>

    <div class="body col-12" v-if="requestSeleted.status.code == 'ACCEPTED'">
      <div class="ticket">
        <div>Turno</div>
        <p>
          <span class="field">Nombre del Paciente:</span>
          {{ shifts?.patient?.name }}
        </p>
        <p>
          <span class="field">Código del Turno:</span>
          {{ shifts?.shiftsCode }}
        </p>
        <p><span class="field">Número de Orden:</span> #{{ shifts?.number }}</p>
      </div>
    </div>

    <div class="col-12 q-my-sm">
      <b style="color: #cdcdcd"> ESTADO*</b>
    </div>
    <div
      class="col-12 q-my-sm"
      :class="`status-${requestSeleted?.status?.code}`"
    >
      {{ requestSeleted?.status?.name }}
    </div>
    <div class="col-12 q-my-sm">
      <b style="color: #cdcdcd"> Doctor*</b>
    </div>
    <div class="col-12 q-my-sm">Dr. {{ requestSeleted?.user?.name }}</div>
    <div class="col-12 q-my-sm">
      <b style="color: #cdcdcd"> Paciente*</b>
    </div>
    <div class="col-12 q-my-sm">{{ requestSeleted?.patient?.name }}</div>

    <div class="col-12">
      <q-input
        v-model="title"
        label="Titulo"
        :disable="
          !['PENDING', 'REJECTED', 'PENDINGTOACCEPTPATIENT'].includes(
            requestSeleted.status.code
          )
        "
      />
    </div>

    <div class="col-12 q-my-sm">
      <q-input
        v-model="date"
        mask="date"
        :rules="['date']"
        label="Fecha"
        :disable="
          !['PENDING', 'REJECTED', 'PENDINGTOACCEPTPATIENT'].includes(
            requestSeleted.status.code
          )
        "
      >
        <template v-slot:append>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-date v-model="date">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>
    <div class="col-12 row q-col-gutter-sm">
      <div class="col-6 q-my-sm">
        <q-input
          :disable="
            !['PENDING', 'REJECTED', 'PENDINGTOACCEPTPATIENT'].includes(
              requestSeleted.status.code
            )
          "
          v-model="initHour"
          mask="time"
          :rules="['time']"
          label="Hora inicial"
        >
          <template v-slot:append>
            <q-icon name="access_time" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-time v-model="initHour">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-time>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
      <div class="col-6 q-my-sm">
        <q-input
          :disable="
            !['PENDING', 'REJECTED', 'PENDINGTOACCEPTPATIENT'].includes(
              requestSeleted.status.code
            )
          "
          v-model="finalHour"
          mask="time"
          :rules="['time']"
          label="Hora Final"
        >
          <template v-slot:append>
            <q-icon name="access_time" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-time v-model="finalHour">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-time>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
    </div>

    <div class="col-12 q-my-sm">
      Cita de {{ moment(initHour, "HH:mm").format("h:mm A") }} a
      {{ moment(finalHour, "HH:mm").format("h:mm A") }}
    </div>

    <div class="col-12 q-my-sm">
      <b style="color: #cdcdcd"> Descripción*</b>
    </div>
    <div class="col-12 q-my-sm">
      <q-input
        v-model="description"
        filled
        type="textarea"
        :disable="
          !['PENDING', 'REJECTED', 'PENDINGTOACCEPTPATIENT'].includes(
            requestSeleted.status.code
          )
        "
      />
    </div>
    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch, onMounted } from "vue";
import moment from "moment";
const emit = defineEmits([
  "updateRequest",
  "getAppointment",
  "getRequest",
  "updateCalendarAndTable",
]);
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";
import NotificationsVue from "src/components/utils/Notifications.vue";

const auth = authStore();

const valuePatient = ref(false);

const description = ref("");
const initHour = ref("8:00");
const finalHour = ref("15:00");
const date = ref(moment().format("YYYY/MM/DD"));
const title = ref("");

const today = ref(moment());

const shifts = ref({});

const notify = ref();

const id = ref(null);
const props = defineProps({
  requestSeleted: {
    type: Object,
    required: true,
    default: {},
  },
  editable: {
    type: Boolean,
    required: true,
    default: false,
  },
  cita: {
    type: Object,
    required: true,
    default: {},
  },
});

onMounted(async () => {
  if (props.editable) {
    title.value = props.cita.title;
    initHour.value = props.cita.initHour;
    finalHour.value = props.cita.finalHour;
    description.value = props.cita.description;
    date.value = props.cita.date.replace(/-/g, "/");
    id.value = props.cita.patientReminder._id;

    await getActiveShiftsByPatient(
      props.cita.patient._id,
      props.cita.schedule._id
    );
  } else {
    console.log("no es editable");
  }
});

const getActiveShiftsByPatient = async (id, schedule) => {
  let resp = await methodsHttp.getApi(
    `shifts/getActiveShiftsByPatientPanel/${id}/${schedule}`
  );

  shifts.value = resp.shifts;
};

const selectRequest = (item) => {
  emit("updateRequest", {});
};

const saveCita = async () => {
  if (validarFechaSeleccionada()) {
    if (props.editable == true) {
      const data = {
        title: title.value,
        description: description.value,
        initHour: initHour.value,
        finalHour: finalHour.value,
        date: date.value.replace(/\//g, "-"),
        request: props.requestSeleted._id,
      };
      let resp = await methodsHttp.putApi(
        `reminders/updatePatientRemindersPanel/${id.value}`,
        data
      );

      if (resp.ok) {
        await emit("updateCalendarAndTable");
        await emit("updateRequest", {});
      }
    } else {
      const data = {
        title: title.value,
        description: description.value,
        initHour: initHour.value,
        finalHour: finalHour.value,
        date: date.value.replace(/\//g, "-"),
        user: auth.userAssociate,
        patient: props.requestSeleted.patient._id,
        request: props.requestSeleted._id,
      };
      let resp = await methodsHttp.postApi(
        `reminders/createPatientRemindersPanel`,
        data
      );
      if (resp.ok) {
        await emit("getAppointment");
        await emit("updateRequest", {});
      }
    }
  }
};

const finish = async () => {
  let url = `reminders/finishAppointment/${shifts.value._id}/${shifts.value.patientReminder}/${props.cita.appointmentsRequest}`;
  console.log(url);
  let resp = await methodsHttp.putApi(url, {
    isArrived: valuePatient.value,
    patient: shifts.value.patient._id,
  });
  if (resp.ok) {
    notify.value?.showNotifyGood(resp.mensaje);
    emit("updateRequest", {});
    emit("updateCalendarAndTable");
  }
  console.log(resp);
};

const deleteAppointment = async () => {
  let url = `reminders/deleteAppointment/${shifts.value._id}/${shifts.value.patientReminder}/${props.cita.appointmentsRequest}`;
  let resp = await methodsHttp.putApi(url, {
    isArrived: valuePatient.value,
    patient: shifts.value.patient._id,
  });
  if (resp.ok) {
    notify.value?.showNotifyGood(resp.mensaje);
    emit("updateRequest", {});
    emit("updateCalendarAndTable");
  }
  console.log(resp);
};

const validarFechaSeleccionada = () => {
  const fecha = moment(date.value, "YYYY-MM-DD");
  // Verifica si la fecha seleccionada es menor a la fecha de hoy
  if (fecha.isBefore(today.value, "day")) {
    notify.value?.showNotifyBad("No se puede tomar una fecha anterior a hoy.");
    return false;
  }
  return true;
};
</script>