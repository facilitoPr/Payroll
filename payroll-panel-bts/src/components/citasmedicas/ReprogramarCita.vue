<template>
  <div>
    <q-btn
      color="primary"
      label="REagenar cita"
      style="width: 100%; height: 40px"
      @click="openModal = true"
    />

    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 1400px; max-width: 90vw">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="calendar_month" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b>REAGENDAR CITA</b>
                </div>
              </div>

              <!-- groups -->
            </div>
            <span
              class="material-icons text-negative"
              style="font-size: 23px; cursor: pointer"
              @click="openModal = false"
            >
              cancel
            </span>
          </div>

          <q-card-section class="q-pt-sm">
            <q-inner-loading
              :showing="loading"
              label="Please wait..."
              label-class="text-blue-11"
              label-style="font-size: 1.5em"
              style="z-index: 9999"
              color="primary"
            />
            <q-form>
              <div class="q-pt-sm row q-col-gutter-sm items-start">
                <!-- informacion -->
                <div class="col-10 q-mb-md">
                  <div style="font-weight: 700; font-size: 17px">
                    Este módulo les permite Reagendar sus cita de atención para
                    este usuario
                  </div>
                  <div class="col-12 q-my-sm">
                    <b style="color: #cdcdcd"> Paciente*</b>
                  </div>
                  <div class="col-12 q-my-sm">{{ data.patients?.name }}</div>
                </div>

                <!-- calendario -->
                <div class="col-5 q-mb-md">
                  <label>
                    <b class="text-negative">* </b>
                    <b>SELECIONA LA FECHA</b>
                  </label>
                  <q-date
                    style="width: 90%"
                    v-model="date"
                    landscape
                    :events="events"
                    event-color="negative"
                    :options="optionsFn2"
                  />
                </div>

                <!-- citas -->
                <div class="col-6 row">
                  <label class="col-12 q-mb-sm">
                    <b>CITAS</b>
                  </label>
                  <div
                    class="col-12 row q-col-gutter-sm"
                    style="max-height: 310px; overflow-y: scroll"
                    v-if="citas.length > 0"
                  >
                    <div
                      v-for="(item, index) in citas"
                      :key="index"
                      class="col-3 bordere q-pa-sm text-center cursore"
                      :class="[
                        item.isTaken && 'bg-primary text-white',
                        item.isWalking && 'bg-warning',
                        
                      ]"
                      style="border-radius: 5px"
                      @click="item.isTaken ? () => {} : selectCita(item)"
                    >
                      {{ moment(item.initHour).format("h:mm A") }} -
                      {{ moment(item.finalHour).format("h:mm A") }}
                    </div>
                  </div>
                </div>

                <!-- formularios -->
                <div
                  class="col-12 row q-mt-md q-col-gutter-sm"
                  v-if="dataAppoimentsParnetsSelected == null"
                >
                  <div class="col-12 col-sm-9 col-lg-3">
                    <label>
                      <b class="text-negative">* </b>
                      <b>HORA DE INICIO</b>
                    </label>
                    <q-input outlined v-model="initHour" dense mask="time">
                      <template v-slot:append>
                        <q-icon
                          name="access_time"
                          color="primary"
                          class="cursor-pointer"
                        >
                          <q-popup-proxy
                            cover
                            transition-show="scale"
                            transition-hide="scale"
                          >
                            <q-time v-model="initHour">
                              <div class="row items-center justify-end">
                                <q-btn
                                  v-close-popup
                                  label="Close"
                                  color="primary"
                                  flat
                                />
                              </div>
                            </q-time>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-sm-9 col-lg-3">
                    <label>
                      <b class="text-negative">* </b>
                      <b>HORA DE FINAL</b>
                    </label>
                    <q-input outlined v-model="finalHour" dense mask="time">
                      <template v-slot:append>
                        <q-icon
                          name="access_time"
                          color="primary"
                          class="cursor-pointer"
                        >
                          <q-popup-proxy
                            cover
                            transition-show="scale"
                            transition-hide="scale"
                          >
                            <q-time v-model="finalHour">
                              <div class="row items-center justify-end">
                                <q-btn
                                  v-close-popup
                                  label="Close"
                                  color="primary"
                                  flat
                                />
                              </div>
                            </q-time>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>

                  <div class="col-12 q-my-sm">
                    Agendar Cita {{ moment(date).format("YYYY/MM/DD") }} a las
                    {{ moment(initHour, "HH:mm").format("h:mm A") }} hasta
                    {{ moment(finalHour, "HH:mm").format("h:mm A") }}
                  </div>
                </div>
                <!-- cita selecionada -->
                <div
                  class="col-12 q-my-sm row"
                  v-if="dataAppoimentsParnetsSelected != null"
                >
                  <div class="col-12 q-my-sm">
                    <b style="color: #cdcdcd"> Cita selecionada*</b>
                  </div>

                  <div
                    class="col-auto bordere q-pa-sm text-center"
                    style="border-radius: 5px; position: relative"
                  >
                    {{
                      moment(dataAppoimentsParnetsSelected.initHour).format(
                        "h:mm A"
                      )
                    }}
                    -
                    {{
                      moment(dataAppoimentsParnetsSelected.finalHour).format(
                        "h:mm A"
                      )
                    }}

                    <div
                      class="bg-negative text-white"
                      @click="closeTime"
                      style="
                        position: absolute;
                        top: 0%; /* Centra verticalmente */
                        right: -10px; /* Ajusta la distancia del borde derecho */
                        transform: translateY(
                          -50%
                        ); /* Centra el ícono verticalmente */
                        border-radius: 50%;
                        height: 20px;
                        width: 20px;
                        display: flex; /* Activar Flexbox */
                        justify-content: center; /* Centrar horizontalmente */
                        align-items: center; /* Centrar verticalmente */
                        cursor: pointer;
                        background-color: #f44336; /* Color de fondo (bg-negative) */
                        color: white;
                      "
                    >
                      <q-icon size="1em" name="close" color="#5F6063" />
                    </div>
                  </div>
                </div>

                <!-- botones -->
                <div class="col-12 row q-my-md">
                  <div class="col-auto q-mr-sm">
                    <q-btn
                      color="negative"
                      label="Cancelar"
                      style="width: 100%; height: 40px"
                      @click="openModal = false"
                    />
                  </div>
                  <div class="col-auto">
                    <q-btn
                      color="primary"
                      label="agregar"
                      style="width: 100%; height: 40px"
                      @click="add"
                    />
                  </div>
                </div>
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>

    <!-- {{ data }} -->
    <NotificationsVue ref="notify" />
  </div>
</template>
<script setup>
import { onMounted, ref, watch, defineEmits } from "vue";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import NotificationsVue from "src/components/utils/Notifications.vue";
import { authStore } from "src/stores/auth-store";

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: {},
  },
});

const emit = defineEmits(["closeModal"]);

const loading = ref(false);

const openModal = ref(false);
const auth = authStore();
const notify = ref();

const date = ref(moment().format("YYYY/MM/DD"));
const initHour = ref("08:30");
const finalHour = ref("17:50");

const citas = ref([]);
const appoiments = ref([]);
const events = ref([]);

const dataAppoimentsParnetsSelected = ref(null);
const typeSave = ref(false);

const optionsFn2 = (item) => {
  const toDay = moment().format("YYYY/MM/DD");
  return item >= toDay;
};

onMounted(() => {
  getAppointmentByUserDate();
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
          ...e,
          title: e?.patients?.name ? e?.patients?.name : "",
          date: moment(e.date).format("YYYY-MM-DD"),
        });
      }

      return moment(e.date).format("YYYY/MM/DD");
    });
    events.value = nuevo;
  }
};

const getAppointmentByUserDate = async () => {
  const response = await methodsHttp.postApi(
    `appointment/getAppointmentByUserDate/${auth.userAssociate}`,
    { date: date.value }
  );
  if (response?.ok) {
    citas.value = response.citas;
  }
};

const selectCita = (item) => {
  dataAppoimentsParnetsSelected.value = item;
  typeSave.value = true;
};

const closeTime = () => {
  dataAppoimentsParnetsSelected.value = null;
  typeSave.value = false;
};

watch(date, (value) => {
  citas.value = [];
 if(value){
  getAppointmentByUserDate();
  typeSave.value = false;
  dataAppoimentsParnetsSelected.value = null;
 }
});

const add = async () => {
  loading.value = true;
  if (typeSave.value) {
    const data = {
      ...dataAppoimentsParnetsSelected.value,
      isPaid: true,
      isRescheduled: true,
      isTaken: true,
      patients: props?.data?.patients?._id,
      appoimentsId: props.data._id,
    };

    let resp = await methodsHttp.postApi(
      `appointment/reagendarAppointmentsSeleted`,
      data
    );
    if (resp.ok) {
      openModal.value = false;
      //   getAppointmentByUser();
      //   getAppointmentByUserDate();
      notify.value?.showNotifyGood(resp.mensaje);
      await emit("closeModal");
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  } else {
    const today = moment().format("YYYY-MM-DD");
    const data = {
      date: date.value,
      initHour: moment(
        `${today} ${initHour.value}`,
        "YYYY-MM-DD HH:mm"
      ).toDate(),
      finalHour: moment(
        `${today} ${finalHour.value}`,
        "YYYY-MM-DD HH:mm"
      ).toDate(),
      user: auth.userAssociate,
      patients: props?.data?.patients?._id,
      isTaken: true,
      isPaid: true,
      appoimentsId: props.data._id,
    };
    let resp = await methodsHttp.postApi(
      `appointment/reagendarAppointments`,
      data
    );
    if (resp.ok) {
      openModal.value = false;
      //   getAppointmentByUser();
      //   getAppointmentByUserDate();
      notify.value?.showNotifyGood(resp.mensaje);
      await emit("closeModal");

      // getSchedule();
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  }
  loading.value = true;
};
</script>