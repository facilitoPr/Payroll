<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="edit-dialog column no-wrap">
      <q-inner-loading
        :showing="loading || saving"
        :label="saving ? 'Guardando cambios...' : 'Cargando datos...'"
        label-class="text-primary"
        label-style="font-size: 1.05em"
      />

      <q-card-section class="dialog-header bg-primary row items-center justify-between">
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon
              :name="mode === 'VACACIONES' ? 'beach_access' : 'edit_note'"
              size="30px"
            />
          </div>

          <div>
            <div class="dialog-title">Modificar solicitud</div>
            <div class="dialog-subtitle">
              Ajusta la solicitud y envíala al empleado como modificada.
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          color="white"
          icon="close"
          :disable="saving"
          @click="closeDialog"
        />
      </q-card-section>

      <q-card-section class="dialog-body">
        <q-card flat bordered class="mode-card q-mb-md">
          <div class="row items-center justify-between q-col-gutter-md">
            <div class="col-12 col-md">
              <div class="section-title">Tipo de solicitud</div>
              <div class="section-subtitle">
                Puedes cambiar entre permiso y vacaciones.
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
          class="vacation-card q-mb-md"
        >
          <q-card-section>
            <div class="row items-center justify-between q-col-gutter-md">
              <div class="col-12 col-md">
                <div class="row items-center no-wrap">
                  <q-avatar color="green-1" text-color="positive" size="44px">
                    <q-icon name="task_alt" />
                  </q-avatar>

                  <div class="q-ml-sm">
                    <div class="section-title">Balance de vacaciones</div>
                    <div class="section-subtitle">
                      Se valida contra los días disponibles del empleado.
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
                  label="Actualizar"
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
                  <div class="balance-label">Reservados</div>
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
              Estás solicitando {{ form.amount }} día(s), pero el empleado solo tiene
              {{ numberValue(vacationBalance?.availableDays) }} disponible(s).
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
                />
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
                />
              </div>

              <div class="col-12 col-md-4">
                <div class="field-label required">
                  {{ durationType === "HORAS" ? "Cantidad de horas" : "Cantidad de días" }}
                </div>
                <q-input
                  v-model.number="form.amount"
                  type="number"
                  outlined
                  dense
                  rounded
                  color="primary"
                  :min="1"
                  label="Cantidad"
                />
              </div>

              <div class="col-12 col-md-4">
                <div class="field-label required">Fecha inicial</div>
                <q-input
                  v-model="form.startDate"
                  type="date"
                  outlined
                  dense
                  rounded
                  color="primary"
                />
              </div>

              <div
                v-if="durationType === 'DIAS' || mode === 'VACACIONES'"
                class="col-12 col-md-4"
              >
                <div class="field-label required">Fecha final</div>
                <q-input
                  v-model="form.endDate"
                  type="date"
                  outlined
                  dense
                  rounded
                  color="primary"
                />
              </div>

              <div v-if="durationType === 'HORAS'" class="col-12 col-md-4">
                <div class="field-label required">Hora inicial</div>
                <q-input
                  v-model="form.startTime"
                  type="time"
                  outlined
                  dense
                  rounded
                  color="primary"
                />
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
                />
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
                  placeholder="Motivo de la solicitud..."
                />
              </div>

              <div class="col-12">
                <div class="field-label required">Comentario para el empleado</div>
                <q-input
                  v-model="adminComment"
                  type="textarea"
                  outlined
                  dense
                  rounded
                  autogrow
                  color="primary"
                  placeholder="Explica qué modificación hiciste..."
                />
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
                    Se guardará como
                    <b>{{ mode === "VACACIONES" ? "Vacaciones" : "Permiso" }}</b>
                    y la solicitud quedará en estado <b>MODIFICADA</b>.
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
          icon="save"
          label="Guardar modificación"
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
const durationOptions = ["HORAS", "DIAS"];

const adminComment = ref("");

const form = ref({
  permissionType: null,
  startDate: "",
  endDate: "",
  startTime: "",
  amount: null,
  reason: "",
});

const calculatedEndTime = computed(() => {
  if (durationType.value !== "HORAS") return "";
  if (!form.value.startTime || !form.value.amount) return "";

  return moment(form.value.startTime, "HH:mm")
    .add(Number(form.value.amount || 0), "hours")
    .format("HH:mm");
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

  if (!props.request?._id) return true;
  if (!form.value.reason || !form.value.startDate || !form.value.amount) return true;
  if (!String(adminComment.value || "").trim()) return true;

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
    if (value) {
      await initDialog();
    }
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
  const resp = await methodsHttp.getApi("permission/types");

  const allTypes = resp?.ok
    ? resp.permissionTypes || resp.permissionType || []
    : [];

  vacationPermissionType.value =
    allTypes.find(
      (item) => String(item?.code || "").toUpperCase() === "VACACIONES",
    ) || null;

  permissionTypes.value = allTypes.filter(
    (item) => String(item?.code || "").toUpperCase() !== "VACACIONES",
  );
};

const hydrateForm = () => {
  const request = props.request;

  if (!request?._id) {
    clearForm();
    return;
  }

  mode.value = request.category || "PERMISO";

  const isByDays = Number(request.totalDays || 0) >= 1;

  durationType.value =
    mode.value === "VACACIONES" ? "DIAS" : isByDays ? "DIAS" : "HORAS";

  const permissionType =
    typeof request.permissionType === "object"
      ? request.permissionType?._id
      : request.permissionType;

  form.value = {
    permissionType: mode.value === "PERMISO" ? permissionType || null : null,
    startDate: safeYMD(request.startDate),
    endDate: safeYMD(request.endDate),
    startTime: safeHHmm(request.startTime),
    amount: isByDays
      ? Number(request.totalDays || 0)
      : Number(request.totalHour || 0),
    reason: request.reason || "",
  };

  adminComment.value = "";
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

  adminComment.value = "";
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

const getEmployeeId = () => {
  const user = props.request?.user;

  return typeof user === "object" ? user?._id : user;
};

const getVacationYear = () => {
  if (!form.value.startDate) return new Date().getFullYear();

  const year = Number(String(form.value.startDate).slice(0, 4));

  return Number.isInteger(year) ? year : new Date().getFullYear();
};

const loadVacationBalance = async () => {
  const employeeId = getEmployeeId();

  if (!employeeId) return;

  vacationBalanceLoading.value = true;

  try {
    const year = getVacationYear();

    const resp = await methodsHttp.getApi(
      `employee-vacation/employee/${employeeId}/summary?year=${year}`,
    );

    vacationBalance.value = resp?.ok ? resp.balance || null : null;
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
    totalMinutes: 0,
    category: "PERMISO",
  };
};

const submit = async () => {
  if (!props.request?._id) return;

  saving.value = true;

  try {
    const payload = buildPayload();

    const updateResp = await methodsHttp.putApi(
      `permission/requests/${props.request._id}`,
      payload,
    );

    if (!updateResp?.ok) {
      Notify.create({
        type: "negative",
        message: updateResp?.mensaje || "No se pudo modificar la solicitud",
      });
      return;
    }

    const statusResp = await methodsHttp.postApi(
      `permission/requests/${props.request._id}/status`,
      {
        action: "MODIFICADA",
        comment: String(adminComment.value || "").trim(),
        previousData: { ...props.request },
        status: props.request.status,
      },
    );

    if (statusResp?.ok) {
      Notify.create({
        type: "positive",
        message: statusResp.mensaje || "Solicitud modificada correctamente",
      });

      emit("saved");
      closeDialog();
      return;
    }

    Notify.create({
      type: "negative",
      message:
        statusResp?.mensaje ||
        "La solicitud se actualizó, pero no se pudo cambiar a MODIFICADA",
    });
  } catch (error) {
    console.error("submit edit error:", error);

    Notify.create({
      type: "negative",
      message: "Error modificando la solicitud",
    });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.edit-dialog {
  width: 920px;
  max-width: 96vw;
  max-height: 92vh;
  border-radius: 22px;
  overflow: hidden;
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
.vacation-card {
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
</style>