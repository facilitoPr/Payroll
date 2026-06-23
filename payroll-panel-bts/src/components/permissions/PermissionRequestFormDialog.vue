<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="request-dialog column no-wrap">
      <q-inner-loading
        :showing="loading || saving"
        :label="saving ? 'Guardando solicitud...' : 'Cargando datos...'"
        label-class="text-primary"
        label-style="font-size: 1.05em"
        class="z-max"
      />

      <q-card-section class="dialog-header bg-primary row items-center justify-between">
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon
              :name="mode === 'VACACIONES' ? 'beach_access' : 'assignment'"
              size="30px"
            />
          </div>

          <div>
            <div class="dialog-title">
              {{ isEditMode ? "Editar solicitud" : "Nueva solicitud" }}
            </div>
            <div class="dialog-subtitle">
              Solicita permisos por días, por horas o vacaciones.
            </div>
          </div>
        </div>

        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          :disable="saving"
          @click="closeDialog"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="dialog-body">
        <q-card flat bordered class="mode-card q-mb-md">
          <div class="row items-center justify-between q-col-gutter-md">
            <div class="col-12 col-md q-ma-sm">
              <div class="section-title">Tipo de solicitud</div>
              <div class="section-subtitle">
                Selecciona si deseas solicitar un permiso o vacaciones.
              </div>
            </div>

            <div class="col-12 col-md-auto">
              <q-btn-toggle
                v-model="mode"
                unelevated
                rounded
                toggle-color="primary"
                color="grey-2"
                text-color="grey-8"
                toggle-text-color="white"
                :options="[
                  { label: 'Permiso', value: 'PERMISO', icon: 'badge' },
                  {
                    label: 'Vacaciones',
                    value: 'VACACIONES',
                    icon: 'beach_access',
                  },
                ]"
              />
            </div>
          </div>
        </q-card>

        <q-card
          v-if="mode === 'VACACIONES'"
          flat
          bordered
          class="vacation-balance-card q-mb-md"
        >
          <q-card-section>
            <div class="row items-center justify-between q-col-gutter-md">
              <div class="col-12 col-md">
                <div class="row items-center no-wrap">
                  <q-avatar color="green-1" text-color="positive" size="46px">
                    <q-icon name="task_alt" />
                  </q-avatar>

                  <div class="q-ml-sm">
                    <div class="section-title">Balance de vacaciones</div>
                    <div class="section-subtitle">
                      Estos días se validarán contra tu balance disponible.
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-auto">
                <q-btn
                  flat
                  rounded
                  no-caps
                  color="primary"
                  icon="refresh"
                  label="Actualizar balance"
                  :loading="vacationBalanceLoading"
                  @click="loadVacationBalance"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-6 col-md-3">
                <div class="balance-metric">
                  <div class="balance-label">Asignados</div>
                  <div class="balance-value">
                    {{ numberValue(vacationBalance?.assignedDays) }}
                  </div>
                </div>
              </div>

              <div class="col-6 col-md-3">
                <div class="balance-metric">
                  <div class="balance-label">Usados</div>
                  <div class="balance-value text-negative">
                    {{ numberValue(vacationBalance?.usedDays) }}
                  </div>
                </div>
              </div>

              <div class="col-6 col-md-3">
                <div class="balance-metric">
                  <div class="balance-label">Reservados prestamo</div>
                  <div class="balance-value text-orange-10">
                    {{ numberValue(vacationBalance?.reservedDays) }}
                  </div>
                </div>
              </div>

              <div class="col-6 col-md-3">
                <div class="balance-metric balance-metric--available">
                  <div class="balance-label">Disponibles</div>
                  <div class="balance-value text-positive">
                    {{ numberValue(vacationBalance?.availableDays) }}
                  </div>
                </div>
              </div>
            </div>

            <q-banner
              v-if="vacationDaysExceeded"
              rounded
              class="bg-red-1 text-red-10 q-mt-md"
            >
              <template #avatar>
                <q-icon name="warning" color="negative" />
              </template>
              Estás solicitando {{ form.amount }} día(s), pero solo tienes
              {{ numberValue(vacationBalance?.availableDays) }} día(s)
              disponibles.
            </q-banner>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="form-card">
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div v-if="mode === 'PERMISO'" class="col-12 col-md-6">
                <div class="field-label required">Tipo de permiso</div>
                <q-select
                  v-model="form.permissionType"
                  :options="permissionTypes"
                  option-label="name"
                  option-value="_id"
                  emit-value
                  map-options
                  outlined
                  dense
                  rounded
                  clearable
                  color="primary"
                  label="Selecciona un tipo"
                >
                  <template #prepend>
                    <q-icon name="category" color="primary" />
                  </template>
                </q-select>
              </div>

              <div v-if="mode === 'PERMISO'" class="col-12 col-md-6">
                <div class="field-label required">Duración</div>
                <q-select
                  v-model="durationType"
                  :options="durationOptions"
                  outlined
                  dense
                  rounded
                  clearable
                  color="primary"
                  label="Días u horas"
                >
                  <template #prepend>
                    <q-icon name="schedule" color="primary" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-4">
                <div class="field-label required">
                  {{
                    durationType === "HORAS"
                      ? "Cantidad de horas"
                      : "Días laborables a solicitar"
                  }}
                </div>

                <q-input
                  v-model.number="form.amount"
                  type="number"
                  outlined
                  dense
                  rounded
                  color="primary"
                  :min="1"
                  :label="durationType === 'HORAS' ? 'Horas' : 'Días'"
                >
                  <template #prepend>
                    <q-icon
                      :name="durationType === 'HORAS' ? 'timer' : 'event'"
                      color="primary"
                    />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <div class="field-label required">
                  {{
                    mode === "VACACIONES"
                      ? "Inicio de vacaciones"
                      : "Fecha de inicio"
                  }}
                </div>

                <q-input
                  v-model="form.startDate"
                  type="date"
                  outlined
                  dense
                  rounded
                  color="primary"
                >
                  <template #prepend>
                    <q-icon name="calendar_month" color="primary" />
                  </template>
                </q-input>
              </div>

              <div
                v-if="durationType === 'DIAS' || mode === 'VACACIONES'"
                class="col-12 col-md-4"
              >
                <div class="field-label required">
                  {{
                    mode === "VACACIONES"
                      ? "Fin de vacaciones"
                      : "Fecha final"
                  }}
                </div>

                <q-input
                  v-model="form.endDate"
                  type="date"
                  outlined
                  dense
                  rounded
                  color="primary"
                >
                  <template #prepend>
                    <q-icon name="event_available" color="primary" />
                  </template>
                </q-input>
              </div>

              <div v-if="durationType === 'HORAS'" class="col-12 col-md-4">
                <div class="field-label required">Hora de inicio</div>

                <q-input
                  v-model="form.startTime"
                  type="time"
                  outlined
                  dense
                  rounded
                  color="primary"
                >
                  <template #prepend>
                    <q-icon name="access_time" color="primary" />
                  </template>
                </q-input>
              </div>

              <div v-if="durationType === 'HORAS'" class="col-12 col-md-4">
                <div class="field-label">Hora final calculada</div>

                <q-input
                  :model-value="calculatedEndTime"
                  outlined
                  dense
                  rounded
                  readonly
                  color="primary"
                >
                  <template #prepend>
                    <q-icon name="timer" color="primary" />
                  </template>
                </q-input>
              </div>

              <div class="col-12">
                <div class="field-label required">Motivo</div>

                <q-input
                  v-model="form.reason"
                  type="textarea"
                  outlined
                  dense
                  rounded
                  autogrow
                  color="primary"
                  placeholder="Explica brevemente el motivo de tu solicitud..."
                >
                  <template #prepend>
                    <q-icon name="notes" color="primary" />
                  </template>
                </q-input>
              </div>

              <div class="col-12">
                <q-banner rounded class="summary-banner">
                  <template #avatar>
                    <q-icon
                      :name="mode === 'VACACIONES' ? 'beach_access' : 'info'"
                      color="primary"
                    />
                  </template>

                  <div class="text-caption text-grey-8">
                    Estás {{ isEditMode ? "editando" : "enviando" }}:
                    <b>{{ mode === "VACACIONES" ? "Vacaciones" : "Permiso" }}</b>

                    <span v-if="form.startDate">
                      · Inicio: <b>{{ formatDate(form.startDate) }}</b>
                    </span>

                    <span v-if="form.endDate && durationType !== 'HORAS'">
                      · Fin: <b>{{ formatDate(form.endDate) }}</b>
                    </span>

                    <span v-if="form.amount">
                      · Duración:
                      <b>
                        {{ form.amount }}
                        {{ durationType === "HORAS" ? "hora(s)" : "día(s)" }}
                      </b>
                    </span>

                    <span v-if="calendarDays > 0 && durationType !== 'HORAS'">
                      · Rango calendario:
                      <b>{{ calendarDays }} día(s)</b>
                    </span>
                  </div>
                </q-banner>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          rounded
          no-caps
          color="negative"
          icon="close"
          label="Cancelar"
          :disable="saving"
          @click="closeDialog"
        />

        <q-btn
          unelevated
          rounded
          no-caps
          color="primary"
          :icon="isEditMode ? 'save' : 'send'"
          :label="submitLabel"
          :loading="saving"
          :disable="submitDisabled"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import moment from "moment";
import { Notify } from "quasar";
import { computed, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  request: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "saved"]);

const loading = ref(false);
const saving = ref(false);
const vacationBalanceLoading = ref(false);

const permissionTypes = ref([]);
const vacationPermissionType = ref(null);
const vacationBalance = ref(null);

const mode = ref("PERMISO");
const durationType = ref("DIAS");

const form = ref({
  permissionType: null,
  startDate: "",
  endDate: "",
  startTime: "",
  amount: null,
  reason: "",
});

const durationOptions = ["HORAS", "DIAS"];

const isEditMode = computed(() => Boolean(props.request?._id));

const submitLabel = computed(() => {
  if (isEditMode.value) {
    return mode.value === "VACACIONES"
      ? "Guardar vacaciones"
      : "Guardar permiso";
  }

  return mode.value === "VACACIONES"
    ? "Enviar vacaciones"
    : "Enviar permiso";
});

const calculatedEndTime = computed(() => {
  if (durationType.value !== "HORAS") return "";
  if (!form.value.startTime || !form.value.amount) return "";

  return moment(form.value.startTime, "HH:mm")
    .add(Number(form.value.amount || 0), "hours")
    .format("HH:mm");
});

const calendarDays = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return 0;

  const start = moment(form.value.startDate, "YYYY-MM-DD", true);
  const end = moment(form.value.endDate, "YYYY-MM-DD", true);

  if (!start.isValid() || !end.isValid()) return 0;

  const diff = end.diff(start, "days") + 1;

  return diff > 0 ? diff : 0;
});

const vacationDaysExceeded = computed(() => {
  if (mode.value !== "VACACIONES") return false;

  const requested = Number(form.value.amount || 0);
  const available = Number(vacationBalance.value?.availableDays ?? 0);

  if (!requested) return false;

  return requested > available;
});

const submitDisabled = computed(() => {
  if (saving.value || loading.value) return true;

  if (!form.value.reason || !form.value.startDate || !form.value.amount) {
    return true;
  }

  if (mode.value === "PERMISO") {
    if (!form.value.permissionType) return true;
    if (!durationType.value) return true;

    if (durationType.value === "DIAS" && !form.value.endDate) return true;
    if (durationType.value === "HORAS" && !form.value.startTime) return true;
  }

  if (mode.value === "VACACIONES") {
    if (!vacationPermissionType.value?._id) return true;
    if (!form.value.endDate) return true;
    if (vacationDaysExceeded.value) return true;
  }

  return false;
});

watch(
  () => props.modelValue,
  async (value) => {
    if (!value) return;

    await initDialog();
  },
);

watch(
  () => mode.value,
  async (value) => {
    if (value === "VACACIONES") {
      durationType.value = "DIAS";
      form.value.permissionType = null;
      await loadVacationBalance();
    }

    if (value === "PERMISO" && !durationType.value) {
      durationType.value = "DIAS";
    }
  },
);

watch(
  () => form.value.startDate,
  async () => {
    if (mode.value === "VACACIONES") {
      await loadVacationBalance();
    }
  },
);

const initDialog = async () => {
  loading.value = true;

  try {
    await getPermissionTypes();
    hydrateForm();

    if (mode.value === "VACACIONES") {
      await loadVacationBalance();
    }
  } finally {
    loading.value = false;
  }
};

const getPermissionTypes = async () => {
  const res = await methodsHttp.getApi("permission/types");

  if (!res?.ok) {
    permissionTypes.value = [];
    vacationPermissionType.value = null;
    return;
  }

  const allTypes = res.permissionType || [];

  vacationPermissionType.value =
    allTypes.find((item) => String(item?.code || "").toUpperCase() === "VACACIONES") ||
    null;

  permissionTypes.value = allTypes.filter(
    (item) => String(item?.code || "").toUpperCase() !== "VACACIONES",
  );
};

const hydrateForm = () => {
  if (!props.request?._id) {
    clearForm();
    return;
  }

  const request = props.request;

  mode.value = request.category || "PERMISO";

  const isByDays = Number(request.totalDays || 0) >= 1;

  durationType.value = mode.value === "VACACIONES" ? "DIAS" : isByDays ? "DIAS" : "HORAS";

  const permissionType =
    typeof request.permissionType === "object"
      ? request.permissionType?._id
      : request.permissionType;

  form.value = {
    permissionType: mode.value === "PERMISO" ? permissionType || null : null,
    startDate: safeYMD(request.startDate),
    endDate: safeYMD(request.endDate),
    startTime: safeHHmm(request.startTime),
    amount: isByDays ? Number(request.totalDays || 0) : Number(request.totalHour || 0),
    reason: request.reason || "",
  };
};

const clearForm = () => {
  mode.value = "PERMISO";
  durationType.value = "DIAS";

  form.value = {
    permissionType: null,
    startDate: "",
    endDate: "",
    startTime: "",
    amount: null,
    reason: "",
  };

  vacationBalance.value = null;
};

const closeDialog = () => {
  if (saving.value) return;

  emit("update:modelValue", false);
  clearForm();
};

const safeYMD = (value) => {
  if (!value) return "";

  const parsed = moment(value);

  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : String(value).slice(0, 10);
};

const safeHHmm = (value) => {
  if (!value) return "";

  const parsed = moment(value, ["HH:mm", "HH:mm:ss", moment.ISO_8601], true);

  return parsed.isValid() ? parsed.format("HH:mm") : String(value).slice(0, 5);
};

const formatDate = (value) => {
  if (!value) return "-";

  return moment(value).format("YYYY/MM/DD");
};

const getVacationYear = () => {
  if (!form.value.startDate) return new Date().getFullYear();

  const year = Number(String(form.value.startDate).slice(0, 4));

  return Number.isInteger(year) ? year : new Date().getFullYear();
};

const loadVacationBalance = async () => {
  vacationBalanceLoading.value = true;

  try {
    const year = getVacationYear();

    const resp = await methodsHttp.getApi(
      `employee-vacation/my-summary?year=${year}`,
    );

    if (resp?.ok) {
      vacationBalance.value = resp.balance || null;
      return;
    }

    vacationBalance.value = null;
  } catch (error) {
    console.error("loadVacationBalance error:", error);
    vacationBalance.value = null;
  } finally {
    vacationBalanceLoading.value = false;
  }
};

const numberValue = (value) => {
  const n = Number(value || 0);

  return Number.isInteger(n) ? n : n.toFixed(2);
};

const validateForm = () => {
  if (!form.value.reason || !form.value.startDate || !form.value.amount) {
    Notify.create({
      type: "warning",
      message: "Completa los campos obligatorios.",
    });

    return false;
  }

  if (mode.value === "PERMISO") {
    if (!form.value.permissionType) {
      Notify.create({
        type: "warning",
        message: "Selecciona el tipo de permiso.",
      });

      return false;
    }

    if (durationType.value === "DIAS" && !form.value.endDate) {
      Notify.create({
        type: "warning",
        message: "Selecciona la fecha final.",
      });

      return false;
    }

    if (durationType.value === "HORAS" && !form.value.startTime) {
      Notify.create({
        type: "warning",
        message: "Selecciona la hora de inicio.",
      });

      return false;
    }
  }

  if (mode.value === "VACACIONES") {
    if (!vacationPermissionType.value?._id) {
      Notify.create({
        type: "negative",
        message: "No se encontró el tipo de permiso VACACIONES.",
      });

      return false;
    }

    if (!form.value.endDate) {
      Notify.create({
        type: "warning",
        message: "Selecciona la fecha final de vacaciones.",
      });

      return false;
    }

    if (vacationDaysExceeded.value) {
      Notify.create({
        type: "negative",
        message: "No tienes días suficientes disponibles para esa solicitud.",
      });

      return false;
    }
  }

  return true;
};

const buildPayload = () => {
  if (mode.value === "VACACIONES") {
    return {
      permissionType: vacationPermissionType.value?._id,
      reason: String(form.value.reason || "").trim(),
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      totalDays: Number(form.value.amount || 0),
      totalHour: 0,
      totalMinutes: 0,
      category: "VACACIONES",
    };
  }

  const isHours = durationType.value === "HORAS";

  return {
    permissionType: form.value.permissionType,
    reason: String(form.value.reason || "").trim(),
    startDate: form.value.startDate,
    endDate: isHours ? form.value.startDate : form.value.endDate,
    startTime: isHours ? form.value.startTime : "",
    endTime: isHours ? calculatedEndTime.value : "",
    totalDays: isHours ? 0 : Number(form.value.amount || 0),
    totalHour: isHours ? Number(form.value.amount || 0) : 0,
    category: "PERMISO",
  };
};

const submit = async () => {
  if (!validateForm()) return;

  saving.value = true;

  try {
    const payload = buildPayload();

    const resp = isEditMode.value
      ? await methodsHttp.putApi(
          `permission/requests/${props.request._id}`,
          payload,
        )
      : await methodsHttp.postApi("permission/requests", payload);

    if (resp?.ok) {
      Notify.create({
        type: "positive",
        message: isEditMode.value
          ? "Solicitud actualizada con éxito"
          : "Solicitud enviada con éxito",
      });

      emit("saved");
      closeDialog();
      return;
    }

    Notify.create({
      type: "negative",
      message: resp?.mensaje || "No se pudo guardar la solicitud.",
    });
  } catch (error) {
    console.error("submit request error:", error);

    Notify.create({
      type: "negative",
      message: "Error al guardar la solicitud.",
    });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.request-dialog {
  width: 920px;
  max-width: 96vw;
  max-height: 92vh;
  border-radius: 22px;
}

.dialog-header {
  min-height: 78px;
  padding: 16px 20px;
}

.dialog-icon {
  width: 46px;
  height: 46px;
  min-width: 46px;
  margin-right: 12px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.dialog-title {
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.05;
}

.dialog-subtitle {
  margin-top: 4px;
  font-size: 0.78rem;
  opacity: 0.86;
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(92vh - 154px);
  padding: 18px;
  background: #f8fafc;
}

.mode-card,
.form-card,
.vacation-balance-card {
  border-radius: 20px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.section-title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.section-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.field-label {
  margin-bottom: 6px;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-label.required::before {
  content: "* ";
  color: #e53935;
}

.balance-metric {
  padding: 12px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.balance-metric--available {
  background: #f0fdf4;
  border-color: rgba(76, 175, 80, 0.24);
}

.balance-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.balance-value {
  margin-top: 4px;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
}

.summary-banner {
  border-radius: 16px;
  background: #f1f5f9;
}

.dialog-actions {
  padding: 14px 18px;
  background: white;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

:deep(.q-field--outlined.q-field--rounded .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 768px) {
  .request-dialog {
    width: 96vw;
    max-height: 94vh;
  }

  .dialog-body {
    max-height: calc(94vh - 154px);
    padding: 12px;
  }
}
</style>