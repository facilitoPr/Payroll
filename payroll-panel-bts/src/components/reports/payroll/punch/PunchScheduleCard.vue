<template>
  <q-card flat bordered class="schedule-card">
    <q-card-section class="schedule-header">
      <div class="row items-start justify-between q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="schedule-title">
            <div class="schedule-icon">
              <q-icon name="calendar_today" size="22px" />
            </div>

            <div>
              <div class="text-subtitle1 text-weight-bold text-dark">
                Horario del día
              </div>
              <div class="text-caption text-grey-7">
                {{ formattedDayName }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-auto">
          <q-badge
            :color="scheduleForDay?.isActive ? 'positive' : 'grey-7'"
            class="status-badge"
          >
            <q-icon
              :name="scheduleForDay?.isActive ? 'check_circle' : 'block'"
              size="15px"
              class="q-mr-xs"
            />
            {{ scheduleForDay?.isActive ? "Día activo" : "Día inactivo" }}
          </q-badge>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pa-md">
      <div class="row q-col-gutter-md items-stretch">
        <div class="col-12 col-sm-6 col-md-4">
          <div class="time-card time-card--entry">
            <div class="time-icon">
              <q-icon name="login" size="22px" />
            </div>

            <div class="time-content">
              <div class="time-label">Entrada</div>
              <div class="time-value">
                {{ scheduleForDay?.entryTime || "—" }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-4">
          <div class="time-card time-card--lunch">
            <div class="time-icon">
              <q-icon name="restaurant" size="22px" />
            </div>

            <div class="time-content">
              <div class="time-label">Almuerzo</div>
              <div class="time-value">
                {{ scheduleForDay?.lunchStartTime || "—" }}
                <span class="time-separator">-</span>
                {{ scheduleForDay?.lunchEndTime || "—" }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-4">
          <div class="time-card time-card--exit">
            <div class="time-icon">
              <q-icon name="logout" size="22px" />
            </div>

            <div class="time-content">
              <div class="time-label">Salida</div>
              <div class="time-value">
                {{ scheduleForDay?.exitTime || "—" }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="classification-panel q-mt-md">
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="classification-title">
              <q-icon name="label" color="primary" size="18px" />
              Clasificación del día
            </div>

            <div class="classification-subtitle">
              Define si este día será tratado como trabajo regular, vacaciones,
              permiso o ausencia.
            </div>
          </div>

          <div class="col-12 col-md-5">
            <q-select
              v-model="localClassification"
              :options="dayTypeOptions"
              dense
              outlined
              clearable
              label="Clasificación"
              class="rounded-input"
              popup-content-class="classification-menu"
              @update:model-value="onChange"
            >
              <template #prepend>
                <q-icon name="fact_check" color="primary" />
              </template>

              <template #selected>
                <div class="ellipsis">
                  {{ localClassification || "Sin clasificación" }}
                </div>
              </template>

              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-avatar
                      size="32px"
                      :color="getClassificationColor(scope.opt)"
                      text-color="white"
                    >
                      <q-icon :name="getClassificationIcon(scope.opt)" size="18px" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ scope.opt }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No hay clasificaciones disponibles
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>

        <div v-if="localClassification" class="selected-classification q-mt-md">
          <q-icon
            :name="getClassificationIcon(localClassification)"
            :color="getClassificationColor(localClassification)"
            size="18px"
          />

          <span>
            Clasificación actual:
            <b>{{ localClassification }}</b>
          </span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  dayName: { type: String, default: "" },
  scheduleForDay: { type: Object, default: () => ({}) },
  classification: { type: String, default: "" },
});

const emit = defineEmits(["update:classification", "change"]);

const dayTypeOptions = [
  "Trabajo regular",
  "Permiso por nacimiento de hijos",
  "Permiso por matrimonio",
  "Permiso por fallecimiento familiar directo o abuelo",
  "Licencia pre y post natal",
  "Vacaciones",
  "Licencia médica por enfermedad común",
  "Permiso por estudios",
  "Ausencia sin justificación",
  "Ausencia con justificación",
  "Otros tipos de permisos",
];

const localClassification = ref(props.classification || "");

const formattedDayName = computed(() => {
  if (!props.dayName) return "Día no definido";

  return props.dayName.charAt(0).toUpperCase() + props.dayName.slice(1);
});

watch(
  () => props.classification,
  (value) => {
    localClassification.value = value || "";
  },
);

const getClassificationIcon = (value) => {
  const text = String(value || "").toLowerCase();

  if (text.includes("trabajo")) return "work_history";
  if (text.includes("vacaciones")) return "beach_access";
  if (text.includes("médica") || text.includes("enfermedad")) return "medical_services";
  if (text.includes("ausencia")) return "event_busy";
  if (text.includes("permiso")) return "assignment_turned_in";
  if (text.includes("licencia")) return "fact_check";

  return "label";
};

const getClassificationColor = (value) => {
  const text = String(value || "").toLowerCase();

  if (text.includes("trabajo")) return "primary";
  if (text.includes("vacaciones")) return "teal";
  if (text.includes("médica") || text.includes("enfermedad")) return "deep-purple";
  if (text.includes("sin justificación")) return "negative";
  if (text.includes("ausencia")) return "orange";
  if (text.includes("permiso")) return "positive";
  if (text.includes("licencia")) return "indigo";

  return "grey-7";
};

const onChange = (value) => {
  const next = value || "";

  emit("update:classification", next);
  emit("change", next);
};
</script>

<style scoped>
.schedule-card {
  border-radius: 22px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.04);
}

.schedule-header {
  padding: 16px;
  background:
    radial-gradient(circle at top left, rgba(23, 141, 210, 0.08), transparent 34%),
    linear-gradient(180deg, #ffffff, #f8fafc);
}

.schedule-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.schedule-icon {
  width: 44px;
  height: 44px;
  border-radius: 15px;
  background: rgba(23, 141, 210, 0.1);
  color: var(--q-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-badge {
  min-height: 30px;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
}

.time-card {
  min-height: 88px;
  padding: 14px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  gap: 12px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.time-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
  border-color: rgba(23, 141, 210, 0.18);
}

.time-icon {
  width: 46px;
  height: 46px;
  min-width: 46px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-card--entry .time-icon {
  color: var(--q-primary);
  background: rgba(23, 141, 210, 0.1);
}

.time-card--lunch .time-icon {
  color: #ef6c00;
  background: rgba(251, 140, 0, 0.12);
}

.time-card--exit .time-icon {
  color: #00897b;
  background: rgba(0, 137, 123, 0.11);
}

.time-content {
  min-width: 0;
}

.time-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.time-value {
  margin-top: 4px;
  color: #0f172a;
  font-size: 1.08rem;
  font-weight: 900;
}

.time-separator {
  margin: 0 3px;
  color: #94a3b8;
}

.classification-panel {
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.classification-title {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 900;
}

.classification-subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.78rem;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
  background: #ffffff;
}

.selected-classification {
  min-height: 38px;
  padding: 9px 11px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px dashed rgba(15, 23, 42, 0.12);
  color: #475569;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
}

.selected-classification b {
  color: #0f172a;
}

@media (max-width: 599px) {
  .schedule-header {
    padding: 14px;
  }

  .time-card {
    min-height: 78px;
  }

  .time-value {
    font-size: 1rem;
  }
}
</style>