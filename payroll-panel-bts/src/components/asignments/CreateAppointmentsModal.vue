<template>
  <q-dialog v-model="modalOpen" persistent>
    <q-card style="width: 700px; max-width: 100vw">
      <q-inner-loading
        :showing="isLoading"
        label="Enviando..."
        label-class="text-blue-11"
        label-style="font-size: 1.1em"
      />
      <div class="bg-primary row justify-between q-pa-md">
        <div class="text-white" style="font-size: 19px; font-weight: 500">
          <div class="row items-center">
            <div class="col-auto q-mx-sm">
              <q-icon size="2em" name="task" color="white" />
            </div>
            <div class="col-auto text-white">
              <b>
                {{
                  editMode
                    ? "EDITAR CITA"
                    : props.isRescheduled
                    ? "RECOORDINAR CITA"
                    : "CREAR CITA"
                }}
              </b>
            </div>
          </div>
        </div>
        <span
          class="material-icons text-white"
          style="font-size: 23px; cursor: pointer"
          @click="closeModal()"
        >
          cancel
        </span>
      </div>

      <q-card-section class="q-pt-sm">
        <div class="col-12 row q-col-gutter-sm">
          <!-- <div class="col-12">
            <label class="row items-center justify-between">
              <b> NOTA </b>
            </label>
  
            <q-editor
              style="border-color: #007ec4"
              toolbar-bg="primary"
              toolbar-text-color="white"
              v-model="form.note"
              :dense="$q.screen.lt.md"
              :toolbar="[
                [
                  {
                    label: $q.lang.editor.align,
                    icon: $q.iconSet.editor.align,
                    fixedLabel: true,
                    list: 'only-icons',
                    options: ['left', 'center', 'right', 'justify'],
                  },
                  {
                    label: $q.lang.editor.align,
                    icon: $q.iconSet.editor.align,
                    fixedLabel: true,
                    options: ['left', 'center', 'right', 'justify'],
                  },
                ],
                [
                  'bold',
                  'italic',
                  'strike',
                  'underline',
                  'subscript',
                  'superscript',
                ],
                ['token', 'hr', 'link', 'custom_btn'],
                [
                  {
                    label: $q.lang.editor.formatting,
                    icon: $q.iconSet.editor.formatting,
                    list: 'no-icons',
                    options: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code'],
                  },
                  {
                    label: $q.lang.editor.fontSize,
                    icon: $q.iconSet.editor.fontSize,
                    fixedLabel: true,
                    fixedIcon: true,
                    list: 'no-icons',
                    options: [
                      'size-1',
                      'size-2',
                      'size-3',
                      'size-4',
                      'size-5',
                      'size-6',
                      'size-7',
                    ],
                  },
                  {
                    label: $q.lang.editor.defaultFont,
                    icon: $q.iconSet.editor.font,
                    fixedIcon: true,
                    list: 'no-icons',
                    options: [
                      'default_font',
                      'arial',
                      'arial_black',
                      'comic_sans',
                      'courier_new',
                      'impact',
                      'lucida_grande',
                      'times_new_roman',
                      'verdana',
                    ],
                  },
                  'removeFormat',
                ],
                ['quote', 'unordered', 'ordered', 'outdent', 'indent'],

                ['undo', 'redo'],
              ]"
              :fonts="{
                arial: 'Arial',
                arial_black: 'Arial Black',
                comic_sans: 'Comic Sans MS',
                courier_new: 'Courier New',
                impact: 'Impact',
                lucida_grande: 'Lucida Grande',
                times_new_roman: 'Times New Roman',
                verdana: 'Verdana',
              }"
            />
          </div> -->

          <div class="col-12 col-md-6">
            <label>
              <b> CLASIFICACIONES </b>
            </label>
            <q-select
              v-model="form.reminderType"
              option-label="name"
              outlined
              dense
              color="primary"
              :options="remindersTypes"
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

          <div class="col-12 col-md-6">
            <label>
              <b> OFICINA MEDICA </b>
            </label>
            <q-select
              use-input
              v-model="form.zone"
              option-label="name"
              outlined
              dense
              color="primary"
              :options="zones"
              @filter="filterPatients"
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

          <div class="col-12 col-md-6">
            <label>
              <b> FECHA </b>
            </label>
            <q-input outlined v-model="form.date" mask="date" dense>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date v-model="form.date">
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

          <div class="col-12 col-md-6">
            <label>
              <b> HORA </b>
            </label>
            <q-input outlined v-model="form.hour" mask="time" dense>
              <template v-slot:append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-time v-model="form.hour">
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

          <div class="col-12">
            <label class="row items-center">
              <b>¿Cita de otro día?</b>
              <q-toggle v-model="useOtherDate" color="primary" />
            </label>

            <q-input
              outlined
              dense
              color="primary"
              v-model="createdByOperatorDate"
              :readonly="!useOtherDate"
              label="Fecha de calendarización"
              mask="####/##/##"
              hint="Formato: YYYY/MM/DD"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer" v-if="useOtherDate">
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date v-model="createdByOperatorDate" mask="YYYY/MM/DD">
                      <div class="row items-center justify-end">
                        <q-btn
                          v-close-popup
                          label="Cerrar"
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

          <div
            class="col-12 q-mt-md"
            v-if="openModalDate"
            style="display: flex; flex-direction: column; gap: 5px"
          >
            <span class="text-bold text-body1">
              {{ orderQuantity }} Citas
            </span>
            <TableReminderAppointments
              :rows="rows"
              :tableLoading="tableLoading"
            />
          </div>

          <div
            class="col-12 q-mt-sm"
            style="display: flex; align-items: center; justify-content: center"
          >
            <q-img
              v-if="imageString"
              :src="imageString"
              spinner-color="white"
              style="
                height: 140px;
                max-width: 150px;
                border: 1px solid black;
                border-radius: 20px;
              "
            />
          </div>

          <div class="col-12 q-my-sm text-center justify-between">
            <q-btn
              type="submit"
              color="negative"
              label="cancelar"
              icon="cancel"
              class="q-mx-sm"
              @click="
                closeModal();
                clear();
              "
            />
            <q-btn
              type="submit"
              color="primary"
              :label="
                editMode
                  ? 'EDITAR'
                  : props.isRescheduled
                  ? 'RECOORDINAR'
                  : 'CREAR'
              "
              icon="save"
              @click="save"
              :disable="
                form.note == '' || form.reminderType == null || isLoading
              "
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <NotificationsVue ref="notify" />
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import NotificationsVue from "src/components/utils/Notifications.vue";
import TableReminderAppointments from "src/components/asignments/TableReminderAppointments.vue";
import HistoryUserModal from "src/components/asignments/HistoryUserModal.vue";
import CreateUserModal from "./CreateUserModal.vue";
import { defineProps, defineEmits, ref, watch, onMounted } from "vue";
import { authStore } from "src/stores/auth-store";

const props = defineProps({
  openModal: {
    type: Boolean,
    required: true,
  },
  comercial: {
    type: Object,
    required: true,
    default: null,
  },
  reminderData: {
    type: Object,
    required: false,
  },
  editMode: {
    type: Boolean,
    required: false,
  },
  getPatientHistory: {
    type: Function,
    required: false,
  },
  getReminders: {
    type: Function,
    required: false,
  },
  getRemindersDates: {
    type: Function,
    required: false,
  },
  isRescheduled: {
    type: Boolean,
    required: false,
    default: false,
  },
  rescheduledFromId: {
    type: String,
    required: false,
    default: null,
  },
});

const auth = authStore();
const notify = ref(null);
const limit = ref(10);
const initial = ref(0);
const userData = ref(null);
const isLoading = ref(false);
const form = ref({
  note: "",
  reminderType: null,
  link: "",
  hour: moment(new Date()).format("hh:mm"),
  date: moment(new Date()).format("YYYY/MM/DD")
});
const zones = ref([]);
const remindersTypes = ref([]);
const patients = ref([]);
const patientsFilter = ref([]);
const imageString = ref(null);
const date = ref(moment(new Date()).format("YYYY/MM/DD"));
const openModalDate = ref(false);
const tableLoading = ref(false);
const rows = ref([]);
const orderQuantity = ref(0);
const historyRows = ref([]);
const useOtherDate = ref(false);
const createdByOperatorDate = ref(moment(new Date()).format("YYYY/MM/DD"));

// onMounted(() => {
//   getRemindersTypes();
//   getPatients();
//   getZonesActived();
//   openModalDateFunct(null);
// });

// Change date and hour for note
const updateNote = () => {
  if (editMode.value) return;

  form.value.note = `
    <b>Saludos</b>: ${props.comercial?.MemberFullname}
    <br>Su cita de cuidados preventivos ha sido pautada para:
    <br><b>Dia</b>: ${form.value.date}
    <br><b>Hora</b>: ${form.value.hour}
    <br><b>Nota:</b> La cita de preventivos debe ser en ayunas. Debe presentar una identificación con foto y la tarjeta del plan médico.
    <br>Centro de cuidados preventivos<br>Cordialmente<br>Coordinadora: ${auth?.user?.name}<br>767-896-1350<br><div>Que tenga un buen día.</div><div></div>`;
};

watch(
  () => useOtherDate.value,
  (boolean) => {
    if (!boolean) {
      createdByOperatorDate.value = moment(new Date()).format("YYYY/MM/DD");
    } else {
      createdByOperatorDate.value = props.reminderData?.createdByOperatorDate
        ? props.reminderData.createdByOperatorDate
        : moment(new Date()).format("YYYY/MM/DD");
    }
  }
);

watch([() => form.value.date, () => form.value.hour], () => {
  if (!editMode.value) {
    updateNote();
  }
});

// watch(
//   () => date.value,
//   (newDate) => {
//     openModalDateFunct(newDate);
//   }
// );

watch(
  () => props.comercial,
  (newComercial) => {
    if (newComercial) {
      updateNote();
    }
  },
  { immediate: true }
);

// const openModalDateFunct = async (newDate) => {
//   openModalDate.value = true;
//   if (newDate) {
//     form.value.date = newDate;
//   }
//   getReminders();
// };

const getZonesActived = async () => {
  const resp = await methodsHttp.getApi(`zones/getZonesActived`);
  if (resp.ok) {
    zones.value = resp.zones;
  }
};

const getPatients = async () => {
  const resp = await methodsHttp.getApi(`patients/getPatientsActived`);
  if (resp.ok) {
    patients.value = resp.patients;
    patientsFilter.value = resp.patients;
  }
};

const getRemindersTypes = async () => {
  const resp = await methodsHttp.postApi(
    `remindersTypes/getRemindersTypesForReminders`,
    { codes: ["FIRSTVISIT", "SECONDVISIT"] }
  );
  if (resp.ok) {
    remindersTypes.value = resp.remindersTypes;
    // form.value.reminderType = resp.remindersTypes[0];
  }
};

const clear = () => {
  form.value.note = "";
  form.value.reminderType = null;
  // form.value.patient = null;
  form.value.date = moment(new Date()).format("YYYY/MM/DD");
  form.value.hour = moment(new Date()).format("hh:mm");
  form.value.date = moment(new Date()).format("YYYY/MM/DD");
};

const save = async () => {
  try {
    let resp;
    isLoading.value = true;

    if (!editMode.value) {
      const data = {
        ...form.value,
        comercial: props.comercial?._id,
        user: auth.user._id,
        code: "NOTCONTACTED",
        memberIdentificationNumber: props.comercial?.memberIdentificationNumber,
        memberFullname: props.comercial?.MemberFullname,
        createdByOperatorDate: createdByOperatorDate.value,

        isRescheduled: !!props.isRescheduled,
        rescheduledFrom: props.rescheduledFromId || null,
      };

      resp = await methodsHttp.postApi("reminders/createReminders", data);
    } else {
      const dataToUpdate = { ...form.value };

      if (createdByOperatorDate.value !== form.value.createdByOperatorDate) {
        dataToUpdate.createdByOperatorDate = createdByOperatorDate.value;
      }

      resp = await methodsHttp.putApi(
        `reminders/updateReminder/${form.value._id}`,
        dataToUpdate
      );
    }

    if (!resp.ok) {
      notify.value?.showNotifyBad(resp.mensaje);
      return;
    }

    closeModal();
    notify.value?.showNotifyGood(
      `Cita ${editMode.value ? "editada" : "creada"} correctamente`
    );

    if (props.getPatientHistory) {
      props.getPatientHistory(props.comercial?._id);
    }

    if (props.getReminders) {
      props.getReminders();
    }

    if (props.getRemindersDates) {
      props.getRemindersDates();
    }

    clear();
  } catch (error) {
    notify.value?.showNotifyBad("Error al crear recordatorio");
  } finally {
    isLoading.value = false;
  }
};

const getReminders = async () => {
  tableLoading.value = true;
  const resp = await methodsHttp.postApi(
    `reminders/getReminders/${limit.value}/${initial.value}`,
    { date: form.value.date }
  );

  if (resp.ok) {
    // const dates = resp.reminders.map(item => item.date)
    // reminders.value = dates;
    rows.value = resp.reminders;
    orderQuantity.value = resp.count;
  } else {
    rows.value = [];
    orderQuantity.value = 0;
  }
  tableLoading.value = false;
};

// const getHistoryUserQuotes = async () => {
//   tableLoading.value = true;
//   const resp = await methodsHttp.getApi(
//     `reminders/getHistoryUserQuotes/${props.comercial?.memberIdentificationNumber}`
//   );

//   if (resp.ok) {
//     historyRows.value = resp.history;
//   } else {
//     historyRows.value = [];
//   }
//   tableLoading.value = false;
// };

const filterPatients = (val, update) => {
  update(
    () => {
      if (val == "") {
        patients.value = patientsFilter.value;
      } else {
        const needle = val.toLowerCase();
        patients.value = patientsFilter.value.filter(
          (v) => v.name.toLowerCase().indexOf(needle) > -1
        );
      }
    },

    // "ref" is the Vue reference to the QSelect
    (ref) => {
      if (val !== "" && patients.length > 0) {
        ref.setOptionIndex(-1); // reset optionIndex in case there is something selected
        ref.moveOptionSelection(1, true); // focus the first selectable option and do not update the input-value
      }
    }
  );
};

//

const emit = defineEmits(["update:openModal", "update:editMode"]);
const modalOpen = ref(props.openModal);
const editMode = ref(props.editMode);

// Sincroniza el modal abierto con el valor que viene del padre
watch(
  () => props.openModal,
  (newVal) => {
    modalOpen.value = newVal;
  }
);

watch(
  () => props.editMode,
  (newVal) => {
    editMode.value = newVal;
  }
);

watch(
  [() => props.reminderData, () => props.isRescheduled],
  ([newVal, isReco]) => {
    if (!newVal) return;

    // copia segura
    form.value = { ...newVal };

    // ✅ cuando es recoordinación: no queremos arrastrar el _id ni fecha de calendarización vieja
    if (isReco) {
      delete form.value._id;
      useOtherDate.value = false;
      createdByOperatorDate.value = moment(new Date()).format("YYYY/MM/DD");
    } else {
      createdByOperatorDate.value = newVal.createdByOperatorDate
        ? newVal.createdByOperatorDate
        : moment(new Date()).format("YYYY/MM/DD");
    }

    form.value.date = newVal?.date || moment(new Date()).format("YYYY/MM/DD");
  }
);

// Emite el evento para cerrar el modal y sincroniza el estado del modal en el hijo
const closeModal = () => {
  emit("update:openModal", false);
  modalOpen.value = false;
  historyRows.value = [];
  rows.value = [];
  orderQuantity.value = 0;
  form.value = {
    
  }
};

// Observa cambios para asegurarse de que el valor en el padre también se sincronice si cambia en el hijo

watch(editMode, (newVal) => {
  emit("update:editMode", newVal);
});

watch(modalOpen, (newVal) => {
  emit("update:openModal", newVal);
  if (newVal) {
    getRemindersTypes();
    getPatients();
    getZonesActived();
    // openModalDateFunct(null);
  }
  userData.value = {
    name: props.comercial?.MemberFullname,
    phone: props.comercial?.HomePhone,
    email: props.comercial?.Email,
    address: `${props.comercial?.PhysicalAddressState} - ${props.comercial?.PhysicalAddressCity}, ${props.comercial?.PhysicalAddressZipCode}`,
  };
});
</script>
