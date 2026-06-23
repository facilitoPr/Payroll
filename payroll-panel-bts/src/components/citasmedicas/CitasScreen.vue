<template>
  <div>
    <!-- boton -->
    <div class="row q-col-gutter-sm q-mb-sm">
      <div class="col-3 col-xl-2">
        <q-select
          outlined
          dense
          color="primary"
          :options="selectOption"
          v-model="optionSelected"
          option-label="name"
        >
        </q-select>
      </div>
      <div class="col-12 col-sm-auto col-md-auto row items-center">
        <q-btn
          color="primary"
          label="Agregar cita"
          style="width: 100%; height: 40px"
          icon="calendar_month"
          @click="openModal = true"
        />
      </div>

      <AddPatients />
    </div>

    <div class="row">
      <div
        class="col-12 col-sm-12 col-lg-12 bordere"
        v-if="optionSelected.value == 1"
      >
        <Calendar
          :appointments="appoiments"
          @seeAppoimentData="seeAppoimentData"
        />
      </div>

      <div
        class="col-12 col-sm-12 col-lg-12 bordere"
        v-if="optionSelected.value == 2"
      >
        <TableCita
          :appointments="appoiments"
          @seeAppoimentData="seeAppoimentData"
        />
      </div>

      <!-- <div class="col-12 col-sm-3 col-lg-4 bordere"></div> -->
    </div>

    <!-- Modal -->
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
                  <b>AGREGAR CITA</b>
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
                    Este módulo les permite gestionar sus horarios de atención
                    de dos maneras:
                  </div>
                  <div>
                    <ol>
                      <li style="font-size: 15px">
                        <b>Crear citas individuales:</b> Configura manualmente
                        una hora de inicio y finalización para programar una
                        única cita.
                      </li>
                      <li style="font-size: 15px">
                        <b> Crear citas por rango:</b> Define una hora de
                        inicio, una hora de finalización y un rango de tiempo
                        (duración de cada cita). El sistema generará
                        automáticamente todas las citas posibles dentro de ese
                        rango.
                      </li>
                    </ol>
                  </div>
                  <div style="font-size: 17px">
                    El sistema verifica automáticamente si las nuevas citas
                    entran en conflicto con las existentes para garantizar una
                    agenda sin solapamientos.
                  </div>
                </div>
                <div class="row col-12">
                  <div class="col-12 row">
                    <div
                      style="width: 20px; height: 20px; border-radius: 50%"
                      class="bordere bg-primary col-auto"
                    ></div>
                    <div class="col-auto q-mx-sm"> Citas Tomadas por pacientes</div>
                  </div>

                  <div class="col-12 row">
                    <div
                      style="width: 20px; height: 20px; border-radius: 50%"
                      class="bordere bg-secondary col-auto"
                    ></div>
                    <div class="col-auton q-mx-sm "> Citas tomadas por pacientes y en estado caminando</div>
                  </div>

                  <div class="col-12 row">
                    <div
                      style="width: 20px; height: 20px; border-radius: 50%"
                      class="bordere bg-warning col-auto"
                    ></div>
                    <div class="col-auto q-mx-sm"> Citas en estado caminando</div>
                  </div>

                  <div class="col-12 row">
                    <div
                      style="width: 20px; height: 20px; border-radius: 50%"
                      class="bordere  col-auto"
                    ></div>
                    <div class="col-auto q-mx-sm"> Citas en espera para ser tomadas </div>
                  </div>
                  
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
                  />
                </div>
                <!--     :options="optionsFn2" -->

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
                        item.isTaken && item.isWalking
                          ? 'bg-secondary'
                          : item.isTaken
                          ? 'bg-primary text-white'
                          : item.isWalking
                          ? 'bg-warning'
                          : '',
                      ]"
                      style="border-radius: 5px"
                      @click="item.isTaken ? seeAppoimentData(item) : () => {}"
                    >
                      <MenuOption
                        @isWalking="isWalking"
                        @isNoWalking="isNoWalking"
                        @deleteAppoiments="deleteAppoiments"
                        :item="item"
                        v-if="item.isTaken == false"
                      />
                      <div>{{ item.turnNumber }}</div>
                      {{ moment(item.initHour).format("h:mm A") }} -
                      {{ moment(item.finalHour).format("h:mm A") }}
                    </div>
                  </div>
                </div>

                <!-- formularios -->
                <div class="col-12 row q-mt-md q-col-gutter-sm">
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

                  <div class="col-12 col-sm-auto">
                    <label>
                      <b>CREAR CITAS POR RANGO</b>
                    </label>
                    <q-checkbox v-model="validateCreateAppoiments" label="" />
                  </div>

                  <div
                    class="col-12 col-sm-9 col-lg-3"
                    v-if="validateCreateAppoiments"
                  >
                    <label>
                      <b class="text-negative">* </b>
                      <b>RANGO DE TIEMPO DE LAS CITAS</b>
                    </label>
                    <q-input
                      outlined
                      v-model="rango"
                      dense
                      type="number"
                    ></q-input>
                  </div>
                  <div class="col-12 q-my-sm">
                    Cita {{ moment(date).format("YYYY/MM/DD") }}
                    {{ moment(initHour, "HH:mm").format("h:mm A") }} a
                    {{ moment(finalHour, "HH:mm").format("h:mm A") }}
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
    <!-- modal de informacion de la cita -->
    <q-dialog v-model="dialog" position="right">
      <q-card style="width: 500px; max-width: 90vw; height: 100vh">
        <q-card-section class="row items-center no-wrap">
          <CitasInformation
            :data="dataAppoimentsParnetsSelected"
            @closeModalInformation="closeModalInformation"
          />
          <q-space />
        </q-card-section>
      </q-card>
    </q-dialog>
    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Calendar from "./Calendar.vue";
import TableCita from "./TableCitas.vue";
import CitasInformation from "./CitasInformation.vue";
import MenuOption from "./menuOptions.vue";
import AddPatients from "./AddPatients.vue";

import { authStore } from "src/stores/auth-store";

const hoverIndex = ref(null);

const auth = authStore();
const openModal = ref(false);
const dialog = ref(false);

const loading = ref(false);

const notify = ref();

const date = ref(moment().format("YYYY/MM/DD"));
const initHour = ref("08:00");
const finalHour = ref("08:30");
const rango = ref(0);
const citas = ref([]);
const appoiments = ref([]);
const events = ref([{}, {}]);

const optionsFn2 = (item) => {
  const toDay = moment().format("YYYY/MM/DD");
  return item >= toDay;
};

const validateCreateAppoiments = ref(false);

const dataAppoimentsParnetsSelected = ref({});

const selectOption = ref([
  { name: "CALENDARIO", value: 1 },
  { name: "TABLA", value: 2 },
]);

const optionSelected = ref({ name: "CALENDARIO", value: 1 });

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
      // if (e.isTaken) {
        appoiments.value.push({
          ...e,
          title: e?.patients?.name ? e?.patients?.name : "No tomada",
          date: moment(e.date).format("YYYY-MM-DD"),
        });
      // }

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
    // events.value = response.citas.map(e=>{
    //     return moment(e.date).format("YYYY/MM/DD")
    //     // console.log(moment(e.date).format("YYYY/MM/DD"), 'calendario')
    // })
  }
};

const add = async () => {
  loading.value = true;
  const today = moment().format("YYYY-MM-DD");
  const data = {
    date: date.value,
    initHour: moment(`${today} ${initHour.value}`, "YYYY-MM-DD HH:mm").toDate(),
    finalHour: moment(
      `${today} ${finalHour.value}`,
      "YYYY-MM-DD HH:mm"
    ).toDate(),
    user: auth.userAssociate,
    rango: rango.value,
  };

  if (validateCreateAppoiments.value) {
    let resp = await methodsHttp.postApi(
      `appointment/generateAppointments`,
      data
    );
    if (resp.ok) {
      getAppointmentByUser();
      getAppointmentByUserDate();
      notify.value?.showNotifyGood(resp.mensaje);
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  } else {
    let resp = await methodsHttp.postApi(`appointment/createAppointment`, data);
    if (resp.ok) {
      getAppointmentByUser();
      getAppointmentByUserDate();
      notify.value?.showNotifyGood(resp.mensaje);
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  }

  loading.value = false;
};

const seeAppoimentData = async (item) => {
  dataAppoimentsParnetsSelected.value = item;
  dialog.value = true;
};

watch(date, (value) => {
  citas.value = [];
  getAppointmentByUserDate();
});

const closeModalInformation = () => {
  appoiments.value = [];
  events.value = [];
  dialog.value = false;
  getAppointmentByUserDate();
  getAppointmentByUser();
};

const isWalking = async (item) => {
  loading.value = true;
  let resp = await methodsHttp.putApi(
    `appointment/isWalkingAppoiments/${item._id}`,
    {}
  );
  if (resp.ok) {
    getAppointmentByUserDate();
    getAppointmentByUser();
    notify.value?.showNotifyGood(resp.mensaje);
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
  loading.value = false;
};

const isNoWalking = async (item) => {
  loading.value = true;
  let resp = await methodsHttp.putApi(
    `appointment/isNoWalkingAppoiments/${item._id}`,
    {}
  );
  if (resp.ok) {
    getAppointmentByUserDate();
    getAppointmentByUser();
    notify.value?.showNotifyGood(resp.mensaje);
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
  loading.value = false;
};

const deleteAppoiments = async (item) => {
  loading.value = true;
  let resp = await methodsHttp.putApi(
    `appointment/deleteAppoiments/${item._id}`,
    { ...item }
  );
  if (resp.ok) {
    getAppointmentByUserDate();
    getAppointmentByUser();
    notify.value?.showNotifyGood(resp.mensaje);
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
  loading.value = false;
};
</script>
<style scoped>
.cursore {
  cursor: pointer;
}
</style>