<template>
  <q-dialog v-model="open" persistent>
    <q-card style="width: 650px; max-width: 90vw">
      <q-inner-loading
        :showing="isLoading || searchingPatient || loadingAppointments"
        label="Procesando..."
        label-class="text-blue-11"
        label-style="font-size: 1.1em"
      />

      <!-- Header -->
      <div class="bg-primary row justify-between q-pa-md">
        <div class="text-primary" style="font-size: 19px; font-weight: 500">
          <div class="row items-center">
            <div class="col-auto q-mx-sm">
              <q-icon size="2em" name="report_problem" color="white" />
            </div>
            <div class="col-auto text-white">
              <b>CREAR REPORTE DE PROBLEMAS</b>
            </div>
          </div>
        </div>
        <span
          class="material-icons text-white"
          style="font-size: 23px; cursor: pointer"
          @click="closeModal"
        >
          cancel
        </span>
      </div>

      <q-form @submit.prevent="submitReport" ref="formRef">
        <q-card-section class="q-pt-sm">
          <div class="q-pt-sm row q-col-gutter-sm">

            <!-- PACIENTE - dos flujos -->
            <!-- 1) Si viene por props: solo lectura -->
            <template v-if="hasPatientFromProps">
              <div class="col-12 col-md-8">
                <label><b>PACIENTE</b></label>
                <q-input outlined dense color="primary" :model-value="patientFullname" readonly />
              </div>
              <div class="col-12 col-md-4">
                <label><b><b class="text-negative">*</b> FECHA</b></label>
                <q-input
                  outlined dense type="date"
                  v-model="form.date"
                  :rules="[(v) => !!v || 'Fecha requerida']"
                />
              </div>
            </template>

            <!-- 2) Si NO viene por props: buscar por código -->
            <template v-else>
              <div class="col-12 col-md-6">
                <label><b><b class="text-negative">*</b> CÓDIGO PACIENTE</b></label>
                <q-input
                  outlined dense color="primary"
                  v-model="patientCode"
                  :rules="[(v)=>!!v || 'Código requerido']"
                  placeholder="Ej: 001234"
                  @update:model-value="onPatientCodeInput"
                >
                  <template #append>
                    <q-btn dense flat icon="search" @click="findPatientByCode" :loading="searchingPatient" />
                  </template>
                </q-input>
                <div v-if="patientError" class="text-negative q-mt-xs" style="font-size:12px">
                  {{ patientError }}
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label><b><b class="text-negative">*</b> FECHA</b></label>
                <q-input
                  outlined dense type="date"
                  v-model="form.date"
                  :rules="[(v) => !!v || 'Fecha requerida']"
                />
              </div>

              <div class="col-12" v-if="patientFound">
                <q-banner class="bg-grey-2 q-pa-sm rounded-borders">
                  <div class="row items-center justify-between">
                    <div class="col">
                      <div class="text-body2">
                        <b>Paciente:</b> {{ patientFullname }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-btn dense flat icon="edit" label="Cambiar" @click="clearFoundPatient" />
                    </div>
                  </div>
                </q-banner>
              </div>
            </template>

            <!-- Cita (se preselecciona la más reciente) -->
            <div class="col-12">
              <label><b>CITA</b></label>
              <q-select
                v-model="appointmentSelected"
                :options="appointments"
                option-label="label"
                option-value="_id"
                dense outlined
                :disable="!effectivePatientId"
                :loading="loadingAppointments"
                label="Selecciona la cita"
                use-input input-debounce="0"
              >
                <template #option="{ itemProps, opt }">
                  <q-item v-bind="itemProps">
                    <q-item-section>
                      <q-item-label>{{ opt.label }}</q-item-label>
                      <q-item-label caption>{{ opt.caption }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template #selected-item="{ opt }">
                  <div>{{ opt?.label }}</div>
                </template>
              </q-select>
              <div v-if="!effectivePatientId" class="text-grey-8 q-mt-xs" style="font-size:12px">
                Busca y selecciona un paciente para cargar sus citas.
              </div>
            </div>

            <!-- Nota -->
            <div class="col-12">
              <label><b><b class="text-negative">*</b> NOTA</b></label>
              <q-input
                outlined dense type="textarea" autogrow
                v-model="form.note"
                :rules="[
                  (v)=>!!v || 'La nota es requerida',
                  (v)=>(v && v.length>=5) || 'Mínimo 5 caracteres'
                ]"
                placeholder="Describe el problema o incidencia..."
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" @click="closeModal" />
          <q-btn label="Guardar" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted, computed } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const $q = useQuasar();
const emit = defineEmits(["close", "refresh", "update:modelValue"]);

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  // Paciente preseleccionado (opcional)
  patient: {
    type: Object,
    required: false,
    default: null, 
  },
});

const open = ref(props.modelValue);
watch(() => props.modelValue, (val) => {
  open.value = val;
  if (val) {
    resetForm();
    if (effectivePatientId.value) loadAppointments();
  }
});

watch(open, (val) => {
  emit("update:modelValue", val);
  if (!val) resetForm(false);
});

// ---------- Estado paciente ----------
const hasPatientFromProps = computed(() => !!props.patient && !!props.patient._id);

const patientFullname = computed(() => {
  const p = hasPatientFromProps.value ? props.patient : patientFound.value;
  return p?.MemberFullname || p?.name || p?.fullName || "";
});

const effectivePatientId = computed(() => {
  if (hasPatientFromProps.value) return props.patient._id;
  return patientFound.value?._id || null;
});

const patientCode = ref("");
const searchingPatient = ref(false);
const patientFound = ref(null);
const patientError = ref("");

// Búsqueda: cuando el usuario escribe código, intentar buscar (debounce manual simple)
let codeTimeout = null;

const onPatientCodeInput = () => {
  patientError.value = "";
  patientFound.value = null;
  if (codeTimeout) clearTimeout(codeTimeout);
  if (!patientCode.value) return;
  codeTimeout = setTimeout(() => {
    findPatientByCode();
  }, 500);
};

const findPatientByCode = async () => {
  if (!patientCode.value) {
    patientError.value = "Código requerido";
    return;
  }
  searchingPatient.value = true;
  patientError.value = "";
  try {
    // Ajusta este endpoint a tu API real
    const resp = await methodsHttp.getApi(`comercial/getComercialByIdentificationNumber/${encodeURIComponent(patientCode.value)}`);
    const p = resp?.comercial || null;

    if (!p || !p._id) {
      patientFound.value = null;
      throw new Error("Paciente no encontrado");
    }

    patientFound.value = p;
    // Al encontrar paciente, cargar sus citas
    await loadAppointments();
  } catch (e) {
    patientFound.value = null;
    patientError.value = e?.message || "No se pudo encontrar el paciente";
    appointments.value = [];
    appointmentSelected.value = null;
  } finally {
    searchingPatient.value = false;
  }
};

const clearFoundPatient = () => {
  patientFound.value = null;
  patientCode.value = "";
  appointments.value = [];
  appointmentSelected.value = null;
};

// ---------- Form ----------
const formRef = ref(null);
const isLoading = ref(false);

const form = ref({
  date: null,
  note: "",
});

// ---------- Citas ----------
const appointments = ref([]);
const appointmentSelected = ref(null);
const loadingAppointments = ref(false);

const loadAppointments = async () => {
  const pid = effectivePatientId.value;
  if (!pid) return;
  loadingAppointments.value = true;
  try {
    const resp = await methodsHttp.getApi(`reminders/getRemindersByComercial/${pid}`);
    const appts = Array.isArray(resp?.reminders) ? resp.reminders : [];

    const normalized = appts
      .map((a) => {
        return {
          ...a,
          label: `${a?.date} - ${a?.hour}`,
          caption: `Operador: ${a?.user.name}`,
          date: a.date,
        };
      })
      .sort((x, y) => y.date - x.date);

    appointments.value = normalized;
    appointmentSelected.value = normalized[0] || null;
  } catch (e) {
    console.error(e);
    $q.notify({ type: "negative", message: "No se pudieron cargar las citas." });
  } finally {
    loadingAppointments.value = false;
  }
};

// ---------- Submit ----------
const submitReport = async () => {
  const valid = await formRef.value.validate();
  if (!valid) return;

  if (!effectivePatientId.value) {
    $q.notify({ type: "negative", message: "Debes seleccionar un paciente válido." });
    return;
  }
  // if (!appointmentSelected.value) {
  //   $q.notify({ type: "negative", message: "La cita es obligatoria." });
  //   return;
  // }

  isLoading.value = true;
  try {
    const payload = {
      comercial: effectivePatientId.value,
      reminder: appointmentSelected.value?._id || null,
      note: form.value.note,
      date: form.value.date, // <-- fecha única
    };

    const resp = await methodsHttp.postApi("reports/createProblemReport", payload);
    if (resp?.ok) {
      $q.notify({ type: "positive", message: resp?.mensaje || "Reporte creado." });
      emit("refresh", resp?.report || payload);
      open.value = false;
    } else {
      throw new Error(resp?.mensaje || "Error al crear el reporte.");
    }
  } catch (e) {
    console.error(e);
    $q.notify({ type: "negative", message: e?.message || "Error al crear el reporte." });
  } finally {
    isLoading.value = false;
  }
};

// ---------- Misc ----------
const closeModal = () => {
  open.value = false;
};

const resetForm = () => {
  form.value = {
    date: null,
    note: "",
  };
  // Si no viene por props, limpiar selección dinámica
  if (!hasPatientFromProps.value) {
    patientCode.value = "";
    patientFound.value = null;
  }
  appointments.value = [];
  appointmentSelected.value = null;
};

// Si entra abierto, preparar estado
onMounted(() => {
  if (open.value && effectivePatientId.value) {
    loadAppointments();
  }
});
</script>
