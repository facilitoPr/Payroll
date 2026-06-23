<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="income-tax-dialog">
      <q-card-section class="dialog-header row items-start justify-between">
        <div class="row items-center q-gutter-sm">
          <q-avatar color="white" text-color="primary" icon="account_balance" />

          <div>
            <div class="text-h6 text-weight-bold">
              {{ isEditMode ? "Editar ISR" : "Agregar ISR" }}
            </div>
            <div class="text-caption text-blue-1">
              Define el monto exento y los tramos aplicables para el año fiscal.
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
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="localForm.year"
              outlined
              dense
              color="primary"
              type="number"
              label="Año *"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="calendar_month" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model.number="localForm.exemptAmount"
              outlined
              dense
              color="primary"
              type="number"
              min="0"
              step="0.01"
              label="Monto exento *"
              prefix="$"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="payments" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model.number="localForm.version"
              outlined
              dense
              color="primary"
              type="number"
              min="1"
              label="Versión"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="history" />
              </template>
            </q-input>
          </div>

          <div class="col-12">
            <q-card flat bordered class="options-card">
              <div class="option-box">
                <div>
                  <div class="text-subtitle2 text-weight-bold">
                    Estado de la tabla ISR
                  </div>
                  <div class="text-caption text-grey-7">
                    Solo una tabla ISR debería estar activa para el cálculo vigente.
                  </div>
                </div>

                <q-toggle
                  v-model="localForm.isActive"
                  color="primary"
                  :label="localForm.isActive ? 'Activa' : 'Inactiva'"
                />
              </div>
            </q-card>
          </div>

          <div class="col-12">
            <q-input
              v-model="localForm.notes"
              outlined
              dense
              autogrow
              type="textarea"
              color="primary"
              label="Notas"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="notes" />
              </template>
            </q-input>
          </div>
        </div>

        <q-separator class="q-my-lg" />

        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-subtitle1 text-weight-bold">
              Tramos del ISR
            </div>
            <div class="text-caption text-grey-7">
              Agrega los rangos, tasa y monto fijo correspondiente.
            </div>
          </div>

          <q-btn
            unelevated
            rounded
            color="primary"
            icon="add"
            label="Agregar tramo"
            class="dialog-btn"
            @click="addBracket"
          />
        </div>

        <q-banner
          v-if="!localForm.brackets.length"
          rounded
          class="empty-brackets-banner q-mb-md"
        >
          <template #avatar>
            <q-icon name="segment" color="primary" />
          </template>
          Agrega al menos un tramo para guardar la tabla ISR.
        </q-banner>

        <div
          v-for="(bracket, index) in localForm.brackets"
          :key="`bracket-${index}`"
          class="bracket-card q-mb-md"
        >
          <div class="row items-center justify-between q-mb-md">
            <div class="row items-center q-gutter-sm">
              <q-avatar size="32px" color="primary" text-color="white">
                {{ index + 1 }}
              </q-avatar>

              <div>
                <div class="text-subtitle2 text-weight-bold">
                  Tramo {{ index + 1 }}
                </div>
                <div class="text-caption text-grey-7">
                  Desde {{ formatNumber(bracket.from) }} hasta
                  {{ bracket.to === null || bracket.to === "" ? "∞" : formatNumber(bracket.to) }}
                </div>
              </div>
            </div>

            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              :disable="loading"
              @click="removeBracket(index)"
            >
              <q-tooltip>Eliminar tramo</q-tooltip>
            </q-btn>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <q-input
                v-model.number="bracket.from"
                outlined
                dense
                type="number"
                color="primary"
                label="Desde *"
                class="rounded-input"
              />
            </div>

            <div class="col-12 col-md-3">
              <q-input
                v-model.number="bracket.to"
                outlined
                dense
                type="number"
                color="primary"
                label="Hasta"
                hint="Vacío = infinito"
                class="rounded-input"
                clearable
              />
            </div>

            <div class="col-12 col-md-3">
              <q-input
                v-model.number="bracket.rate"
                outlined
                dense
                type="number"
                color="primary"
                label="Tasa *"
                hint="Ej: 0.15"
                step="0.01"
                class="rounded-input"
              />
            </div>

            <div class="col-12 col-md-3">
              <q-input
                v-model.number="bracket.fixedAmount"
                outlined
                dense
                type="number"
                color="primary"
                label="Valor fijo"
                prefix="$"
                class="rounded-input"
              />
            </div>

            <div class="col-12">
              <q-input
                v-model="bracket.label"
                outlined
                dense
                color="primary"
                label="Etiqueta / Nota del tramo"
                class="rounded-input"
              >
                <template #prepend>
                  <q-icon name="label" />
                </template>
              </q-input>
            </div>
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
import money from "src/components/utils/formatter";

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
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const localForm = ref(getEmptyForm());

function getEmptyForm() {
  return {
    year: new Date().getFullYear(),
    exemptAmount: 0,
    version: 1,
    isActive: true,
    notes: "",
    brackets: [],
  };
}

const syncForm = () => {
  const base = getEmptyForm();

  localForm.value = {
    ...base,
    ...(props.formData || {}),
    year: Number(props.formData?.year || new Date().getFullYear()),
    exemptAmount: Number(props.formData?.exemptAmount || 0),
    version: Number(props.formData?.version || 1),
    isActive: props.formData?.isActive !== false,
    notes: props.formData?.notes || "",
    brackets: Array.isArray(props.formData?.brackets)
      ? props.formData.brackets.map((bracket) => ({
          from: Number(bracket.from || 0),
          to:
            bracket.to === null ||
            bracket.to === undefined ||
            bracket.to === ""
              ? null
              : Number(bracket.to),
          rate: Number(bracket.rate || 0),
          fixedAmount: Number(bracket.fixedAmount || 0),
          label: bracket.label || "",
        }))
      : [],
  };
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

const canSave = computed(() => {
  if (!localForm.value.year || Number(localForm.value.year) < 2000) {
    return false;
  }

  if (
    localForm.value.exemptAmount === null ||
    Number(localForm.value.exemptAmount) < 0
  ) {
    return false;
  }

  if (
    !Array.isArray(localForm.value.brackets) ||
    localForm.value.brackets.length === 0
  ) {
    return false;
  }

  return localForm.value.brackets.every((bracket) => {
    return (
      bracket.from !== null &&
      bracket.from !== undefined &&
      typeof Number(bracket.from) === "number" &&
      !Number.isNaN(Number(bracket.from)) &&
      bracket.rate !== null &&
      bracket.rate !== undefined &&
      typeof Number(bracket.rate) === "number" &&
      !Number.isNaN(Number(bracket.rate))
    );
  });
});

const addBracket = () => {
  const lastBracket = localForm.value.brackets.at(-1);

  localForm.value.brackets.push({
    from: lastBracket?.to ? Number(lastBracket.to) : 0,
    to: null,
    rate: 0,
    fixedAmount: 0,
    label: "",
  });
};

const removeBracket = (index) => {
  localForm.value.brackets.splice(index, 1);
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "0";
  return money.formatter(Number(value || 0));
};

const normalizeBrackets = () => {
  return localForm.value.brackets.map((bracket) => ({
    from: Number(bracket.from || 0),
    to:
      bracket.to === null ||
      bracket.to === undefined ||
      bracket.to === ""
        ? null
        : Number(bracket.to),
    rate: Number(bracket.rate || 0),
    fixedAmount: Number(bracket.fixedAmount || 0),
    label: bracket.label?.trim() || "",
  }));
};

const close = () => {
  emit("update:modelValue", false);
};

const save = () => {
  const payload = {
    ...localForm.value,
    year: Number(localForm.value.year),
    exemptAmount: Number(localForm.value.exemptAmount || 0),
    version: Number(localForm.value.version || 1),
    isActive: localForm.value.isActive !== false,
    notes: localForm.value.notes?.trim() || "",
    brackets: normalizeBrackets(),
  };

  emit("save", payload);
};
</script>

<style scoped>
.income-tax-dialog {
  width: 980px;
  max-width: 96vw;
  border-radius: 22px;
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
.bracket-card {
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.options-card {
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

.bracket-card {
  padding: 16px;
}

.empty-brackets-banner {
  background: #f8fafc;
  color: #374151;
  border: 1px solid rgba(0, 0, 0, 0.06);
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