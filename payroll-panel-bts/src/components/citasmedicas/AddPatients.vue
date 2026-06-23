<template>
  <div>
    <div class="col-12 col-sm-auto col-md-auto row items-center">
      <q-btn
        color="primary"
        label="Agregar paciente"
        style="width: 100%; height: 40px"
        icon="person"
        @click="openModal = true"
      />
    </div>

    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 1400px; max-width: 90vw">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="person" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b>AGREGAR PACIENTE</b>
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
                <!-- calendario -->
                <!-- <div class="col-5 q-mb-md">
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
                </div> -->
                <!-- NOMBRE -->
                <div class="col-12 col-md-3">
                  <label>
                    <b> <b class="text-negative">* </b> NOMBRE </b>
                  </label>
                  <q-input outlined dense color="primary" v-model="form.name">
                  </q-input>
                </div>
                <!-- CORREO -->
                <!-- <div class="col-12 col-md-3">
                  <label>
                    <b> <b class="text-negative">* </b> CORREO </b>
                  </label>
                  <q-input
                    type="email"
                    outlined
                    dense
                    color="primary"
                    v-model="form.email"
                  >
                  </q-input>
                </div> -->
                <!-- CONTRASÑA -->
                <!-- <div class="col-12 col-md-3">
                  <label>
                    <b> <b class="text-negative">* </b> CONTRASÑA </b>
                  </label>
                  <q-input
                    type="password"
                    outlined
                    dense
                    color="primary"
                    v-model="form.password"
                  >
                  </q-input>
                </div> -->
                <!-- address -->
                <div class="col-12 col-md-3">
                  <label>
                    <b> <b class="text-negative">* </b> ADDRESS </b>
                  </label>
                  <q-input
                    type="text"
                    outlined
                    dense
                    color="primary"
                    v-model="form.address"
                  >
                  </q-input>
                </div>
                <!-- Gender -->
                <div class="col-12 col-sm-3 col-md-3">
                  <label>
                    <b> <b class="text-negative">* </b> GENERO </b>
                  </label>
                  <q-select
                    v-model="genderSelected"
                    option-label="name"
                    outlined
                    dense
                    color="primary"
                    :options="gender"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No results
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <!-- zona -->
                <div class="col-12 col-sm-3 col-md-3">
                  <label>
                    <b> <b class="text-negative">* </b> PUEBLO </b>
                  </label>
                  <q-select
                    v-model="citySelected"
                    option-label="name"
                    outlined
                    dense
                    color="primary"
                    :options="city"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No results
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>

                <div class="col-12 q-pt-xl row q-col-gutter-sm items-start">
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
                          item.isTaken && 'bg-primary text-white ',
                          item.isWalking && 'bg-warning',
                        ]"
                        style="border-radius: 5px"
                        @click="selectCita(item)"
                      >
                        {{ moment(item.initHour).format("h:mm A") }} -
                        {{ moment(item.finalHour).format("h:mm A") }}
                      </div>
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
                        :disable="
                          form.name == '' ||
                          form.address == '' ||
                          genderSelected == null ||
                          citySelected == null ||
                          dataAppoimentsParnetsSelected == null
                        "
                      />
                    </div>
                  </div>
                </div>
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import NotificationsVue from "src/components/utils/Notifications.vue";

import { authStore } from "src/stores/auth-store";

const auth = authStore();
const openModal = ref(false);
const loading = ref(false);

const date = ref(moment().format("YYYY/MM/DD"));
const dataAppoimentsParnetsSelected = ref(null);

const citas = ref([]);

const form = ref({
  name: "",
  address: "",
});

const gender = ref([]);
const genderSelected = ref(null);
const city = ref([]);
const citySelected = ref(null);

const events = ref([]);
const appoiments = ref([]);

const notify = ref();

onMounted(() => {
  getGenders();
  getZones();
  getAppointmentByUserDateWolking();
  getAppointmentByUserWolking();
});
const getGenders = async () => {
  let resp = await methodsHttp.getApi(`gender/getGenders`);
  if (resp.ok) {
    gender.value = resp.gender;
  }
};

const getZones = async () => {
  let resp = await methodsHttp.getApi(`city/getCity`);
  if (resp.ok) {
    city.value = resp.city;
  }
};

watch(date, (value) => {
  citas.value = [];
  if (value) {
    getAppointmentByUserDateWolking();
  }
});

const getAppointmentByUserDateWolking = async () => {
  const response = await methodsHttp.postApi(
    `appointment/getAppointmentByUserDateWolking/${auth.userAssociate}`,
    { date: date.value }
  );
  if (response.ok) {
    citas.value = response.citas;
  }
};

const getAppointmentByUserWolking = async () => {
  const response = await methodsHttp.getApi(
    `appointment/getAppointmentByUserWolking/${auth.userAssociate}`
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

const selectCita = (item) => {
  dataAppoimentsParnetsSelected.value = item;
};

const closeTime = () => {
  dataAppoimentsParnetsSelected.value = null;
};

const add = async () => {
  loading.value = true;
  const data = {
    name: form.value.name,
    address: form.value.address,
    city: citySelected.value._id,
    gender: genderSelected.value._id,
    appoimentsId: dataAppoimentsParnetsSelected.value._id,
  };

  let resp = await methodsHttp.postApi(
    `appointment/agendarAppoimentsCreatePatients`,
    data
  );
  if (resp.ok) {
    getAppointmentByUserDateWolking();
    getAppointmentByUserWolking();
    notify.value?.showNotifyGood(resp.mensaje);
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
  loading.value = false;
};

//agendarAppoimentsCreatePatients
</script>