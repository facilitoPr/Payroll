<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="payment-schedule-dialog">
      <q-card-section class="dialog-header row items-start justify-between">
        <div class="row items-center q-gutter-sm">
          <q-avatar color="white" text-color="primary" icon="calendar_month" />

          <div>
            <div class="text-h6 text-weight-bold">
              {{ isEditMode ? "Editar día de pago" : "Agregar día de pago" }}
            </div>
            <div class="text-caption text-blue-1">
              Define la frecuencia y los días en que se generarán los pagos.
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          color="white"
          :disable="loading"
          @click="close"
        />
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="localForm.name"
              outlined
              dense
              color="primary"
              label="Nombre *"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="calendar_month" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <q-select
              v-model="selectedFrequency"
              :options="paymentFrequencies"
              option-label="name"
              outlined
              dense
              color="primary"
              label="Frecuencia de pago *"
              class="rounded-input"
              @update:model-value="handleFrequencyChange"
            >
              <template #prepend>
                <q-icon name="event_repeat" />
              </template>

              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No hay frecuencias disponibles.
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div
            v-if="frequencyCode === 'QUINCENAL'"
            class="col-12"
          >
            <q-card flat bordered class="frequency-card">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">
                Días quincenales
              </div>

              <div class="text-caption text-grey-7 q-mb-md">
                Selecciona el primer día y el sistema calculará el segundo día.
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="firstDay"
                    :options="firstHalfMonthDays"
                    outlined
                    dense
                    color="primary"
                    label="Primer día de pago *"
                    class="rounded-input"
                  >
                    <template #prepend>
                      <q-icon name="looks_one" />
                    </template>
                  </q-select>

                  <div v-if="quincenalError" class="text-negative text-caption q-mt-xs">
                    El primer día debe permitir un segundo pago dentro del mes.
                  </div>
                </div>

                <div class="col-12 col-md-6">
                  <q-select
                    v-model="secondDay"
                    :options="monthDays"
                    outlined
                    dense
                    disable
                    color="primary"
                    label="Segundo día de pago"
                    class="rounded-input"
                  >
                    <template #prepend>
                      <q-icon name="looks_two" />
                    </template>
                  </q-select>
                </div>
              </div>
            </q-card>
          </div>

          <div
            v-if="frequencyCode === 'MENSUAL'"
            class="col-12 col-md-6"
          >
            <q-select
              v-model="firstDay"
              :options="monthDays"
              outlined
              dense
              color="primary"
              label="Día del mes *"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="calendar_today" />
              </template>
            </q-select>
          </div>

          <div
            v-if="frequencyCode === 'SEMANAL'"
            class="col-12 col-md-6"
          >
            <q-select
              v-model="selectedWeekDay"
              :options="weekDays"
              option-label="name"
              outlined
              dense
              color="primary"
              label="Día de la semana *"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="today" />
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <q-card flat bordered class="options-card">
              <div class="option-box">
                <div>
                  <div class="text-subtitle2 text-weight-bold">
                    Estado del horario
                  </div>
                  <div class="text-caption text-grey-7">
                    Activa o desactiva este horario de pago.
                  </div>
                </div>

                <q-toggle
                  v-model="localForm.isActive"
                  color="primary"
                  :label="localForm.isActive ? 'Activo' : 'Inactivo'"
                />
              </div>
            </q-card>
          </div>

          <div class="col-12">
            <q-input
              v-model="localForm.description"
              type="textarea"
              autogrow
              outlined
              dense
              color="primary"
              label="Descripción *"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="notes" />
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          rounded
          color="grey-8"
          icon="close"
          label="Cancelar"
          class="dialog-btn"
          :disable="loading"
          @click="close"
        />

        <q-btn
          unelevated
          rounded
          color="primary"
          icon="save"
          label="Guardar"
          class="dialog-btn"
          :loading="loading"
          :disable="!canSave"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  formData: {
    type: Object,
    default: () => ({}),
  },
  paymentFrequencies: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const localForm = ref(getEmptyForm());
const selectedFrequency = ref(null);
const firstDay = ref(null);
const secondDay = ref(null);
const selectedWeekDay = ref({ value: 6, name: "Viernes" });
const quincenalError = ref(false);

const monthDays = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
];

const firstHalfMonthDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

const weekDays = [
  { value: 1, name: "Domingo" },
  { value: 2, name: "Lunes" },
  { value: 3, name: "Martes" },
  { value: 4, name: "Miércoles" },
  { value: 5, name: "Jueves" },
  { value: 6, name: "Viernes" },
  { value: 7, name: "Sábado" },
];

function getEmptyForm() {
  return {
    name: "",
    isActive: true,
    description: "",
    weeklyDays: [],
    payDays: [],
    paymentFrequency: null,
  };
}

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id || "";
};

const normalizeFrequencyCode = (code) => {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace("QUINCENAL", "QUINCENAL");
};

const frequencyCode = computed(() => {
  return normalizeFrequencyCode(selectedFrequency.value?.code);
});

const canSave = computed(() => {
  if (!localForm.value.name?.trim()) return false;
  if (!selectedFrequency.value?._id) return false;
  if (!localForm.value.description?.trim()) return false;

  if (frequencyCode.value === "QUINCENAL") {
    return !!firstDay.value && !!secondDay.value && !quincenalError.value;
  }

  if (frequencyCode.value === "MENSUAL") {
    return !!firstDay.value;
  }

  if (frequencyCode.value === "SEMANAL") {
    return !!selectedWeekDay.value?.value;
  }

  return true;
});

const findFrequencyById = (id) => {
  if (!id) return null;

  return props.paymentFrequencies.find((item) => item._id === id) || null;
};

const calculateSecondQuincenalDay = (value) => {
  const day = Number(value || 0);

  if (!day || day < 1 || day > 15) return null;

  const result = day + 15;

  if (result > 30) return null;

  return result;
};

const syncForm = () => {
  const base = getEmptyForm();

  localForm.value = {
    ...base,
    ...(props.formData || {}),
    name: props.formData?.name || "",
    isActive: props.formData?.isActive !== false,
    description: props.formData?.description || "",
    weeklyDays: Array.isArray(props.formData?.weeklyDays)
      ? [...props.formData.weeklyDays]
      : [],
    payDays: Array.isArray(props.formData?.payDays)
      ? [...props.formData.payDays]
      : [],
    paymentFrequency: props.formData?.paymentFrequency || null,
  };

  selectedFrequency.value =
    typeof props.formData?.paymentFrequency === "object"
      ? props.formData.paymentFrequency
      : findFrequencyById(props.formData?.paymentFrequency);

  const code = normalizeFrequencyCode(selectedFrequency.value?.code);

  firstDay.value = null;
  secondDay.value = null;
  selectedWeekDay.value = { value: 6, name: "Viernes" };
  quincenalError.value = false;

  if (code === "QUINCENAL") {
    firstDay.value = localForm.value.payDays?.[0] || null;
    secondDay.value =
      localForm.value.payDays?.[1] ||
      calculateSecondQuincenalDay(firstDay.value);
  }

  if (code === "MENSUAL") {
    firstDay.value = localForm.value.payDays?.[0] || null;
  }

  if (code === "SEMANAL") {
    const savedDay = localForm.value.weeklyDays?.[0] || 6;
    selectedWeekDay.value =
      weekDays.find((item) => item.value === Number(savedDay)) ||
      weekDays.find((item) => item.value === 6);
  }
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      syncForm();
    }
  }
);

watch(
  () => props.formData,
  () => syncForm(),
  { deep: true }
);

watch(
  () => props.paymentFrequencies,
  () => {
    if (props.modelValue) {
      syncForm();
    }
  },
  { deep: true }
);

watch(firstDay, (value) => {
  if (frequencyCode.value !== "QUINCENAL") return;

  const result = calculateSecondQuincenalDay(value);

  if (!result) {
    quincenalError.value = true;
    secondDay.value = null;
    return;
  }

  quincenalError.value = false;
  secondDay.value = result;
});

const handleFrequencyChange = () => {
  firstDay.value = null;
  secondDay.value = null;
  selectedWeekDay.value = { value: 6, name: "Viernes" };
  quincenalError.value = false;
};

const close = () => {
  emit("update:modelValue", false);
};

const save = () => {
  const payload = {
    name: localForm.value.name?.trim(),
    isActive: localForm.value.isActive !== false,
    description: localForm.value.description?.trim(),
    weeklyDays: [],
    payDays: [],
    paymentFrequency: selectedFrequency.value._id,
  };

  if (frequencyCode.value === "QUINCENAL") {
    payload.payDays = [Number(firstDay.value), Number(secondDay.value)];
  }

  if (frequencyCode.value === "MENSUAL") {
    payload.payDays = [Number(firstDay.value)];
  }

  if (frequencyCode.value === "SEMANAL") {
    payload.weeklyDays = [Number(selectedWeekDay.value.value)];
  }

  emit("save", payload);
};
</script>

<style scoped>
.payment-schedule-dialog {
  width: 860px;
  max-width: 96vw;
  border-radius: 22px;
  overflow: hidden;
}

.dialog-header {
  background: var(--q-primary);
  color: white;
  padding: 18px 20px;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
}

.options-card,
.frequency-card {
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.options-card,
.frequency-card {
  padding: 14px;
}

.option-box {
  border-radius: 16px;
  background: #f8fafc;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.dialog-btn {
  text-transform: none;
  font-weight: 600;
  min-width: 120px;
}

@media (max-width: 600px) {
  .dialog-btn {
    width: 100%;
  }

  .option-box {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>