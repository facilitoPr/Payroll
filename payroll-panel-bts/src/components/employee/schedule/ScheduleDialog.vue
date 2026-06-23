<template>
  <q-dialog v-model="modal" persistent :maximized="$q.screen.lt.md">
    <q-card class="schedule-dialog column no-wrap">
      <!-- HEADER -->
      <q-card-section class="dialog-header bg-primary row items-center justify-between">
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon size="30px" name="schedule" color="white" />
          </div>

          <div>
            <div class="dialog-title">
              {{ isEditMode ? "Editar horario" : "Crear horario" }}
            </div>
            <div class="dialog-subtitle">
              Configura el horario semanal del empleado.
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          color="white"
          @click="closeModal"
          aria-label="Cerrar"
        />
      </q-card-section>

      <q-separator />

      <!-- BODY -->
      <q-card-section class="schedule-dialog-body">
        <div class="row q-col-gutter-lg">
          <!-- IZQUIERDA: FORM -->
          <div class="col-12 col-lg-7">
            <q-card flat bordered class="form-section fit">
              <div class="form-section-header row items-center justify-between">
                <div>
                  <div class="form-section-title">Configuración de horario</div>
                  <div class="form-section-subtitle">
                    Selecciona el tipo de ponche y define los días laborales.
                  </div>
                </div>

                <q-badge
                  rounded
                  outline
                  color="primary"
                  :label="punchTypeSelected?.name || 'Sin tipo de ponche'"
                  class="schedule-badge"
                />
              </div>

              <q-separator />

              <q-card-section class="form-scroll">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-5">
                    <div class="field-label required">Tipo de ponche</div>

                    <q-select
                      v-model="punchTypeSelected"
                      :options="punchTypes"
                      option-label="name"
                      option-value="_id"
                      outlined
                      dense
                      rounded
                      color="primary"
                      map-options
                      :loading="loadingPunchTypes"
                      :disable="loadingPunchTypes"
                      @update:model-value="onPunchTypeChange"
                    >
                      <template #prepend>
                        <q-icon name="fingerprint" color="primary" />
                      </template>
                    </q-select>
                  </div>

                  <div class="col-12 col-md-7" v-if="punchTypeSelected">
                    <div class="field-label required">Tipo de horario</div>

                    <q-select
                      v-model="scheduleMode"
                      :options="scheduleModes"
                      outlined
                      dense
                      rounded
                      color="primary"
                      emit-value
                      map-options
                    >
                      <template #prepend>
                        <q-icon name="view_week" color="primary" />
                      </template>
                    </q-select>
                  </div>
                </div>

                <!-- EMPTY STATE -->
                <div v-if="!punchTypeSelected" class="schedule-empty-state">
                  <q-icon name="touch_app" size="44px" color="grey-5" />
                  <div class="text-subtitle1 text-weight-bold q-mt-sm">
                    Selecciona un tipo de ponche
                  </div>
                  <div class="text-caption text-grey-7">
                    Luego podrás configurar el horario manualmente o aplicarlo a varios días.
                  </div>
                </div>

                <!-- MODO GRUPO -->
                <q-card
                  v-if="scheduleMode === 'grupo' && punchTypeSelected"
                  flat
                  bordered
                  class="bulk-card q-mt-md"
                >
                  <q-card-section>
                    <div class="row items-start justify-between q-mb-md">
                      <div>
                        <div class="form-section-title">
                          Aplicar a varios días
                        </div>
                        <div class="form-section-subtitle">
                          Usa este bloque para asignar el mismo horario de forma rápida.
                        </div>
                      </div>

                      <q-icon name="done_all" color="primary" size="28px" />
                    </div>

                    <div class="row q-col-gutter-md items-end">
                      <div class="col-12 col-md-6">
                        <div class="field-label required">Días a configurar</div>

                        <q-select
                          v-model="bulk.days"
                          :options="diasSemana"
                          option-value="key"
                          option-label="label"
                          multiple
                          outlined
                          dense
                          rounded
                          emit-value
                          map-options
                          color="primary"
                          placeholder="Selecciona los días"
                        />
                      </div>

                      <div class="col-12 col-md-3">
                        <div class="field-label required">Entrada</div>

                        <q-input
                          v-model="bulk.entryTime"
                          type="time"
                          outlined
                          dense
                          rounded
                          color="primary"
                        />
                      </div>

                      <div class="col-12 col-md-3" v-if="showLunchToggle2Punch">
                        <div class="toggle-card">
                          <q-toggle
                            v-model="bulk.hasLunchTime"
                            label="Tiene almuerzo"
                            color="primary"
                            dense
                          />
                        </div>
                      </div>

                      <!-- Lunch para 4-punch -->
                      <div class="col-12 col-md-3" v-if="showLunchFields">
                        <div class="field-label">Inicio almuerzo</div>

                        <q-input
                          v-model="bulk.lunchStartTime"
                          type="time"
                          outlined
                          dense
                          rounded
                          color="primary"
                        />
                      </div>

                      <div class="col-12 col-md-3" v-if="showLunchFields">
                        <div class="field-label">Fin almuerzo</div>

                        <q-input
                          v-model="bulk.lunchEndTime"
                          type="time"
                          outlined
                          dense
                          rounded
                          color="primary"
                        />
                      </div>

                      <!-- Lunch para 2-punch con toggle -->
                      <div
                        class="col-12 col-md-3"
                        v-if="showLunchToggle2Punch && bulk.hasLunchTime"
                      >
                        <div class="field-label">Inicio almuerzo</div>

                        <q-input
                          v-model="bulk.lunchStartTime"
                          type="time"
                          outlined
                          dense
                          rounded
                          color="primary"
                        />
                      </div>

                      <div
                        class="col-12 col-md-3"
                        v-if="showLunchToggle2Punch && bulk.hasLunchTime"
                      >
                        <div class="field-label">Fin almuerzo</div>

                        <q-input
                          v-model="bulk.lunchEndTime"
                          type="time"
                          outlined
                          dense
                          rounded
                          color="primary"
                        />
                      </div>

                      <div class="col-12 col-md-3" v-if="showExitField">
                        <div class="field-label">Salida</div>

                        <q-input
                          v-model="bulk.exitTime"
                          type="time"
                          outlined
                          dense
                          rounded
                          color="primary"
                        />
                      </div>

                      <div class="col-12">
                        <q-btn
                          unelevated
                          no-caps
                          color="primary"
                          icon="done_all"
                          label="Aplicar a días"
                          class="rounded-btn"
                          :disable="bulk.days.length === 0 || !bulk.entryTime"
                          @click="applyBulkToDays"
                        />

                        <q-tooltip v-if="bulk.days.length === 0">
                          Selecciona al menos un día
                        </q-tooltip>

                        <q-tooltip v-else-if="!bulk.entryTime">
                          La hora de entrada es obligatoria
                        </q-tooltip>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- MODO MANUAL -->
                <div
                  v-if="scheduleMode === 'manual' && punchTypeSelected"
                  class="row q-col-gutter-md q-mt-md"
                >
                  <div
                    v-for="dia in diasSemana"
                    :key="dia.key"
                    class="col-12 col-sm-6"
                  >
                    <q-card flat bordered class="day-card">
                      <div class="day-card-header">
                        <div>
                          <div class="day-title">{{ dia.label }}</div>
                          <div class="day-subtitle">
                            {{ schedule[dia.key].isActive ? "Día laboral" : "Día libre" }}
                          </div>
                        </div>

                        <q-toggle
                          v-model="schedule[dia.key].isActive"
                          color="primary"
                          checked-icon="check"
                          unchecked-icon="close"
                          dense
                          @update:model-value="onToggleDay(dia.key)"
                        />
                      </div>

                      <q-separator />

                      <q-card-section
                        v-if="schedule[dia.key].isActive"
                        class="q-gutter-sm"
                      >
                        <q-toggle
                          v-if="showLunchToggle2Punch"
                          v-model="schedule[dia.key].hasLunchTime"
                          label="Tiene almuerzo"
                          color="primary"
                          dense
                          @update:model-value="onToggleHasLunch(dia.key)"
                        />

                        <div class="row q-col-gutter-sm">
                          <div
                            :class="[
                              showExitField || showLunchFields ? 'col-6' : 'col-12',
                            ]"
                          >
                            <q-input
                              v-model="schedule[dia.key].entryTime"
                              type="time"
                              label="Entrada"
                              outlined
                              dense
                              rounded
                              color="primary"
                            />
                          </div>

                          <div class="col-6" v-if="showLunchFields">
                            <q-input
                              v-model="schedule[dia.key].lunchStartTime"
                              type="time"
                              label="Inicio almuerzo"
                              outlined
                              dense
                              rounded
                              color="primary"
                            />
                          </div>

                          <div class="col-6" v-if="showLunchFields">
                            <q-input
                              v-model="schedule[dia.key].lunchEndTime"
                              type="time"
                              label="Fin almuerzo"
                              outlined
                              dense
                              rounded
                              color="primary"
                            />
                          </div>

                          <div
                            class="col-6"
                            v-if="
                              showLunchToggle2Punch &&
                              schedule[dia.key].hasLunchTime
                            "
                          >
                            <q-input
                              v-model="schedule[dia.key].lunchStartTime"
                              type="time"
                              label="Inicio almuerzo"
                              outlined
                              dense
                              rounded
                              color="primary"
                            />
                          </div>

                          <div
                            class="col-6"
                            v-if="
                              showLunchToggle2Punch &&
                              schedule[dia.key].hasLunchTime
                            "
                          >
                            <q-input
                              v-model="schedule[dia.key].lunchEndTime"
                              type="time"
                              label="Fin almuerzo"
                              outlined
                              dense
                              rounded
                              color="primary"
                            />
                          </div>

                          <div class="col-6" v-if="showExitField">
                            <q-input
                              v-model="schedule[dia.key].exitTime"
                              type="time"
                              label="Salida"
                              outlined
                              dense
                              rounded
                              color="primary"
                            />
                          </div>
                        </div>

                        <div class="text-caption text-grey-7 q-mt-xs">
                          * La entrada es obligatoria para guardar este día.
                        </div>
                      </q-card-section>

                      <q-card-section v-else class="day-off-state">
                        <q-icon name="event_busy" size="26px" color="grey-5" />
                        <div>No trabaja este día</div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- DERECHA: PREVIEW -->
          <div class="col-12 col-lg-5">
            <q-card flat bordered class="form-section fit">
              <div class="form-section-header row items-center justify-between">
                <div>
                  <div class="form-section-title">Vista previa</div>
                  <div class="form-section-subtitle">
                    Revisa cómo quedará el horario antes de guardar.
                  </div>
                </div>

                <q-icon name="visibility" color="primary" size="28px" />
              </div>

              <q-separator />

              <q-card-section class="preview-scroll">
                <div class="row q-col-gutter-md">
                  <div
                    v-for="dia in diasSemana"
                    :key="dia.key + '-preview'"
                    class="col-12 col-sm-6"
                  >
                    <q-card flat bordered class="preview-day-card">
                      <div class="preview-day-header bg-primary text-white">
                        {{ dia.label }}
                      </div>

                      <q-card-section>
                        <div
                          v-if="preview[dia.key].isActive"
                          class="preview-times"
                        >
                          <div class="preview-time-item">
                            <q-icon name="login" color="primary" />
                            <span>Entrada</span>
                            <b>{{ preview[dia.key].entryTime || "-" }}</b>
                          </div>

                          <div
                            v-if="
                              showLunchFields ||
                              (showLunchToggle2Punch &&
                                preview[dia.key].hasLunchTime)
                            "
                            class="preview-time-item"
                          >
                            <q-icon name="restaurant" color="teal" />
                            <span>Almuerzo</span>
                            <b>
                              {{ preview[dia.key].lunchStartTime || "-" }}
                              -
                              {{ preview[dia.key].lunchEndTime || "-" }}
                            </b>
                          </div>

                          <div v-if="showExitField" class="preview-time-item">
                            <q-icon name="logout" color="deep-orange" />
                            <span>Salida</span>
                            <b>{{ preview[dia.key].exitTime || "-" }}</b>
                          </div>
                        </div>

                        <div v-else class="preview-empty">
                          <q-icon name="event_busy" />
                          <span>No trabaja</span>
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- FOOTER -->
      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          no-caps
          color="negative"
          label="Cancelar"
          icon="cancel"
          class="dialog-action-btn"
          @click="closeModal"
        />

        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Guardar"
          icon="save"
          class="dialog-action-btn"
          :loading="saving"
          :disable="!canSave"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import {
  reactive,
  ref,
  computed,
  onMounted,
  defineEmits,
  defineExpose,
} from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const $q = useQuasar();
const emit = defineEmits(["saved"]);

const modal = ref(false);
const isEditMode = ref(false);
const userInfo = ref(null);

const saving = ref(false);
const loadingPunchTypes = ref(false);

const punchTypes = ref([]);
const punchTypeSelected = ref(null);

const scheduleMode = ref("manual");

const scheduleModes = [
  { label: "Manual por día", value: "manual" },
  { label: "Aplicar a varios días", value: "grupo" },
];

const diasSemana = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

const emptyDay = () => ({
  isActive: false,
  hasLunchTime: false,
  entryTime: "",
  lunchStartTime: "",
  lunchEndTime: "",
  exitTime: "",
});

const schedule = reactive({});

function resetSchedule() {
  diasSemana.forEach((d) => {
    schedule[d.key] = emptyDay();
  });
}

resetSchedule();

const bulk = reactive({
  days: [],
  entryTime: "",
  hasLunchTime: false,
  lunchStartTime: "",
  lunchEndTime: "",
  exitTime: "",
});

const punchCode = computed(() => punchTypeSelected.value?.code || "");

const showLunchFields = computed(() => punchCode.value === "4-punch");

const showExitField = computed(() =>
  ["4-punch", "2-punch"].includes(punchCode.value),
);

const showLunchToggle2Punch = computed(() => punchCode.value === "2-punch");

const preview = computed(() => schedule);

const hasAnyActiveDay = computed(() =>
  Object.values(schedule).some((d) => d.isActive),
);

const isValidActiveDays = computed(() => {
  for (const key of Object.keys(schedule)) {
    const day = schedule[key];

    if (!day.isActive) continue;
    if (!day.entryTime) return false;
  }

  return true;
});

const canSave = computed(() => {
  if (!punchTypeSelected.value) return false;
  if (!hasAnyActiveDay.value) return false;
  if (!isValidActiveDays.value) return false;

  return true;
});

async function getPunchTypes() {
  loadingPunchTypes.value = true;

  try {
    const resp = await methodsHttp.getApi("punch/getPunchType");
    punchTypes.value = resp?.ok ? resp.punchType : [];
  } finally {
    loadingPunchTypes.value = false;
  }
}

function onPunchTypeChange() {
  diasSemana.forEach((d) => {
    const day = schedule[d.key];

    if (!day.isActive) return;

    if (!showLunchToggle2Punch.value) {
      day.hasLunchTime = false;
      day.lunchStartTime = "";
      day.lunchEndTime = "";
    }

    if (!showLunchFields.value && !showLunchToggle2Punch.value) {
      day.lunchStartTime = "";
      day.lunchEndTime = "";
    }

    if (!showExitField.value) {
      day.exitTime = "";
    }
  });

  if (!showLunchFields.value) {
    bulk.hasLunchTime = false;
    bulk.lunchStartTime = "";
    bulk.lunchEndTime = "";
  }

  if (!showExitField.value) {
    bulk.exitTime = "";
  }
}

function onToggleDay(dayKey) {
  if (!schedule[dayKey].isActive) {
    schedule[dayKey] = emptyDay();
  }
}

function onToggleHasLunch(dayKey) {
  if (!schedule[dayKey].hasLunchTime) {
    schedule[dayKey].lunchStartTime = "";
    schedule[dayKey].lunchEndTime = "";
  }
}

function applyBulkToDays() {
  bulk.days.forEach((dayKey) => {
    schedule[dayKey].isActive = true;
    schedule[dayKey].entryTime = bulk.entryTime;

    if (showLunchToggle2Punch.value) {
      schedule[dayKey].hasLunchTime = Boolean(bulk.hasLunchTime);
      schedule[dayKey].lunchStartTime = bulk.hasLunchTime
        ? bulk.lunchStartTime
        : "";
      schedule[dayKey].lunchEndTime = bulk.hasLunchTime
        ? bulk.lunchEndTime
        : "";
    } else {
      schedule[dayKey].hasLunchTime = false;
      schedule[dayKey].lunchStartTime = "";
      schedule[dayKey].lunchEndTime = "";
    }

    if (showLunchFields.value) {
      schedule[dayKey].lunchStartTime = bulk.lunchStartTime;
      schedule[dayKey].lunchEndTime = bulk.lunchEndTime;
    }

    schedule[dayKey].exitTime = showExitField.value ? bulk.exitTime : "";
  });

  $q.notify({
    type: "positive",
    message: "Horario aplicado a los días seleccionados.",
  });
}

function resetBulk() {
  bulk.days = [];
  bulk.entryTime = "";
  bulk.hasLunchTime = false;
  bulk.lunchStartTime = "";
  bulk.lunchEndTime = "";
  bulk.exitTime = "";
}

function closeModal() {
  modal.value = false;

  setTimeout(() => {
    userInfo.value = null;
    isEditMode.value = false;
    punchTypeSelected.value = null;
    scheduleMode.value = "manual";
    resetBulk();
    resetSchedule();
  }, 150);
}

function resolvePunchType(data) {
  const incoming = data?.punchTypeId || data?.punchType || null;

  if (!incoming) return null;

  if (typeof incoming === "object") return incoming;

  return punchTypes.value.find((item) => String(item._id) === String(incoming)) || null;
}

function openModal(data, opts = { edit: false }) {
  modal.value = true;
  userInfo.value = data || null;
  isEditMode.value = Boolean(opts?.edit);

  resetSchedule();
  resetBulk();
  scheduleMode.value = "manual";

  punchTypeSelected.value = resolvePunchType(data);

  if (data?.schedule && typeof data.schedule === "object") {
    diasSemana.forEach((d) => {
      const incoming = data.schedule[d.key];

      if (incoming) {
        schedule[d.key] = {
          ...emptyDay(),
          ...incoming,
          isActive: Boolean(incoming.isActive),
        };
      }
    });
  }
}

async function save() {
  if (!userInfo.value?._id) {
    $q.notify({
      type: "negative",
      message: "No se encontró el empleado.",
    });
    return;
  }

  saving.value = true;

  try {
    const payload = {
      punchTypeId: punchTypeSelected.value?._id,
      schedule,
      scheduleMode: scheduleMode.value,
    };

    const resp = await methodsHttp.putApi(
      `user/updateSchedule/${userInfo.value._id}`,
      payload,
    );

    if (resp?.ok) {
      $q.notify({
        type: "positive",
        message: "Horario guardado correctamente.",
      });

      emit("saved", resp);
      closeModal();
      return;
    }

    $q.notify({
      type: "negative",
      message: resp?.mensaje || "No se pudo guardar.",
    });
  } catch (error) {
    console.error("save schedule error:", error);

    $q.notify({
      type: "negative",
      message: "Error guardando el horario.",
    });
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  getPunchTypes();
});

defineExpose({ openModal });
</script>

<style scoped>
.schedule-dialog {
  width: 1220px;
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

.schedule-dialog-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(92vh - 154px);
  padding: 18px;
  background: #f8fafc;
}

.form-section {
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.form-section-header {
  padding: 16px;
}

.form-section-title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.form-section-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.schedule-badge {
  font-weight: 800;
  padding: 6px 10px;
}

.form-scroll,
.preview-scroll {
  max-height: calc(92vh - 260px);
  overflow-y: auto;
  padding: 16px;
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

.schedule-empty-state {
  min-height: 320px;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  color: #64748b;
}

.bulk-card,
.day-card,
.preview-day-card {
  border-radius: 18px;
  overflow: hidden;
  background: #ffffff;
}

.toggle-card {
  min-height: 40px;
  padding: 6px 10px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
}

.day-card-header {
  min-height: 58px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
}

.day-title {
  color: #0f172a;
  font-weight: 900;
}

.day-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 600;
}

.day-off-state {
  min-height: 100px;
  display: grid;
  place-items: center;
  gap: 6px;
  text-align: center;
  color: #94a3b8;
  font-weight: 700;
}

.preview-day-header {
  padding: 8px;
  text-align: center;
  font-weight: 900;
}

.preview-times {
  display: grid;
  gap: 10px;
}

.preview-time-item {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  gap: 8px;
  align-items: center;
  color: #475569;
  font-size: 0.86rem;
}

.preview-time-item b {
  color: #0f172a;
}

.preview-empty {
  min-height: 74px;
  display: grid;
  place-items: center;
  gap: 4px;
  color: #94a3b8;
  font-weight: 700;
}

.dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
  box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.06);
}

.dialog-action-btn,
.rounded-btn {
  border-radius: 999px;
  padding-left: 18px;
  padding-right: 18px;
  font-weight: 800;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

:deep(.q-field--outlined.q-field--rounded .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 1023px) {
  .schedule-dialog {
    width: 100%;
    max-width: 100%;
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
  }

  .schedule-dialog-body {
    max-height: calc(100vh - 154px);
    padding: 12px;
  }

  .form-scroll,
  .preview-scroll {
    max-height: none;
  }
}
</style>