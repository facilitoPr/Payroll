<template>
  <div>
    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 500px; max-width: 90vw">
          <div class="bg-primary row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="category" color="white" />
                </div>
                <div class="col-auto" v-if="data.status.code != 'ACCEPTED'">
                  <b> EDITAR CITA</b>
                </div>
                <div class="col-auto" v-else>
                  <b> DATOS DE LA CITA</b>
                </div>
              </div>
              <!-- groups -->
            </div>
            <span
              class="material-icons"
              style="color: white; font-size: 23px; cursor: pointer"
              @click="openModal = false"
            >
              cancel
            </span>
          </div>
          <q-card-section>
            <div class="col-12 q-mt-md q-my-sm row">
              <div class="col-12 q-my-md">
                <b> DATOS DE LA CITA</b>
              </div>
             
              <div class="col-12 q-my-sm">
                <b style="color: #cdcdcd"> ESTADO*</b>
              </div>
              <div class="col-12 q-my-sm" :class="`status-${data?.status?.code}`"> {{ data.status.name }}</div>
              <div class="col-12 q-my-sm">
                <b style="color: #cdcdcd"> Doctor*</b>
              </div>
              <div class="col-12 q-my-sm">Dr. {{ data.user.name }}</div>
              <div class="col-12 q-my-sm">
                <b style="color: #cdcdcd"> Paciente*</b>
              </div>
              <div class="col-12 q-my-sm">{{ data.patient?.name ? data.patient?.name : "Ningun paciente ha tomado la cita aún"}}</div>
              <div class="col-12">
                <q-input
                  v-model="title"
                  label="Titulo"
                 
                   :disable="!['PENDING', 'REJECTED', 'PENDINGTOACCEPTPATIENT'].includes(data.status.code)"
                />
              </div>
              <div class="col-12 q-my-sm">
                <q-input
                  :disable="!['PENDING', 'REJECTED', 'PENDINGTOACCEPTPATIENT'].includes(data.status.code)"
                  v-model="date"
                  mask="date"
                  :rules="['date']"
                  label="Fecha"
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
                            <q-btn
                              v-close-popup
                              label="Close"
                              color="primary"
                              flat
                            />
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
                     :disable="!['PENDING', 'REJECTED', 'PENDINGTOACCEPTPATIENT'].includes(data.status.code)"
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
                <div class="col-6 q-my-sm">
                  <q-input
                    :disable="!['PENDING', 'REJECTED', 'PENDINGTOACCEPTPATIENT'].includes(data.status.code)"
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
                  :disable="!['PENDING', 'REJECTED', 'PENDINGTOACCEPTPATIENT'].includes(data.status.code)"
                />
              </div>
            </div>

            <div class="body"  v-if="data.status.code == 'ACCEPTED'">
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
                <p>
                  <span class="field">Número de Orden:</span> #{{
                    shifts?.number
                  }}
                </p>
              </div>
            </div>

            <div v-if="data.status.code == 'ACCEPTED'">
              
              <q-checkbox
                v-model="valuePatient"
                label="Confirme la asistencia del paciente"
              />
            </div>
            <div class="col-12 q-mt-md q-my-sm text-center">
              <q-btn
                type="submit"
                color="negative"
                label="cancelar"
                icon="cancel"
                class="q-mx-sm"
                @click="openModal = false"
              />

              <!-- <q-btn
                type="submit"
                color="primary"
                label="guardar"
                icon="save"
                @click="save"
              /> -->

              <q-btn
                v-if="
                  data.status.code == 'REJECTED' ||
                  data.status.code == 'PENDINGTOACCEPTPATIENT'
                "
                type="submit"
                color="primary"
                label="ACTUALIZAR"
                icon="save"
                @click="save"
              />
              <q-btn
                v-if="data.status.code == 'ACCEPTED'"
                type="submit"
                color="primary"
                label="Finalizar turno"
                icon="save"
                @click="finish(data)"
              />
              <q-btn
                v-if="data.status.code == 'CANCELED'"
                type="submit"
                color="negative"
                label="ELIMINAR"
                icon="delete"
                @click="deleteAppointment(data)"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, defineProps, defineEmits } from "vue";
import moment from "moment";
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";
import NotificationsVue from "src/components/utils/Notifications.vue";

const emit = defineEmits(["updateCalendarAndTable"]);

const auth = authStore();

const notify = ref();

const openModal = ref(false);
const description = ref("");
const initHour = ref("8:00");
const finalHour = ref("15:00");
const date = ref("2024/11/18");
const title = ref("");
const valuePatient = ref(false);
const id = ref(null);

const data = ref({});

const shifts = ref({});

const open = (item) => {
  title.value = item.title;
  initHour.value = item.initHour;
  finalHour.value = item.finalHour;
  description.value = item.description;
  date.value = item?.date?.replace(/-/g, "/");
  id.value = item._id;
  openModal.value = true;
  data.value = item;
  console.log(item?.appointmentsRequest?.schedule, "item");

  getActiveShiftsByPatient(
    item.patient._id,
    item?.appointmentsRequest?.schedule
  );
};

const save = async () => {
  const data = {
    title: title.value,
    description: description.value,
    initHour: initHour.value,
    finalHour: finalHour.value,
    date: date.value.replace(/\//g, "-"),

    // request: props.requestSeleted._id,
  };
  let resp = await methodsHttp.putApi(
    `reminders/updatePatientRemindersPanel/${id.value}`,
    data
  );
  if (resp.ok) {
    await emit("updateCalendarAndTable");
    openModal.value = false;
  }
};

const getActiveShiftsByPatient = async (id, schedule) => {
  let resp = await methodsHttp.getApi(
    `shifts/getActiveShiftsByPatientPanel/${id}/${schedule}`
  );
  console.log(resp, "shift");
  shifts.value = resp.shifts;
};

const finish = async (data) => {
  let url = `reminders/finishAppointment/${shifts.value._id}/${shifts.value.patientReminder}/${data.appointmentsRequest._id}`;
  let resp = await methodsHttp.putApi(url, {
    isArrived: valuePatient.value,
    patient: shifts.value.patient._id,
  });
  if (resp.ok) {
    notify.value?.showNotifyGood(resp.mensaje);
    openModal.value = false;
    await emit("updateCalendarAndTable");
  }
  
};

const deleteAppointment = async (data) => {
  let url = `reminders/deleteAppointment/${shifts.value._id}/${shifts.value.patientReminder}/${data.appointmentsRequest._id}`;
  let resp = await methodsHttp.putApi(url, {});
  if (resp.ok) {
    notify.value?.showNotifyGood(resp.mensaje);
    openModal.value = false;
    await emit("updateCalendarAndTable");
  }
  
};

defineExpose({ open });
</script>

<style  scoped>

</style>