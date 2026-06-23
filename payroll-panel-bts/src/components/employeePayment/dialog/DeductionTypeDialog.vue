<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="deduction-dialog">
      <q-card-section class="dialog-header row items-start justify-between">
        <div class="row items-center q-gutter-sm">
          <q-avatar color="white" text-color="primary" icon="price_check" />

          <div>
            <div class="text-h6 text-weight-bold">
              {{ isEditMode ? "Editar deducción" : "Agregar deducción" }}
            </div>
            <div class="text-caption text-blue-1">
              Define porcentaje, monto fijo y reglas aplicables a la nómina.
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
                <q-icon name="price_check" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="localForm.code"
              outlined
              dense
              color="primary"
              label="Código *"
              class="rounded-input"
              hint="Ej: TSS, ISR, AFP, SFS"
            >
              <template #prepend>
                <q-icon name="tag" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model.number="localForm.percentage"
              outlined
              dense
              color="primary"
              type="number"
              min="0"
              step="0.01"
              label="Porcentaje *"
              class="rounded-input"
              suffix="%"
            >
              <template #prepend>
                <q-icon name="percent" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model.number="localForm.fixedAmount"
              outlined
              dense
              color="primary"
              type="number"
              min="0"
              step="0.01"
              label="Monto fijo *"
              class="rounded-input"
              prefix="$"
            >
              <template #prepend>
                <q-icon name="payments" />
              </template>
            </q-input>
          </div>

          <div class="col-12">
            <q-card flat bordered class="options-card">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                  <div class="option-box">
                    <div>
                      <div class="text-subtitle2 text-weight-bold">
                        Bajo ley
                      </div>
                      <div class="text-caption text-grey-7">
                        Indica si es una deducción reglamentaria.
                      </div>
                    </div>

                    <q-toggle
                      v-model="localForm.isLegal"
                      color="primary"
                      :label="localForm.isLegal ? 'Sí' : 'No'"
                    />
                  </div>
                </div>

                <div class="col-12 col-md-4">
                  <div class="option-box">
                    <div>
                      <div class="text-subtitle2 text-weight-bold">
                        Reduce base ISR
                      </div>
                      <div class="text-caption text-grey-7">
                        Define si reduce la base imponible del ISR.
                      </div>
                    </div>

                    <q-toggle
                      v-model="localForm.deducibleIsr"
                      color="primary"
                      :label="localForm.deducibleIsr ? 'Sí' : 'No'"
                    />
                  </div>
                </div>

                <div class="col-12 col-md-4">
                  <div class="option-box">
                    <div>
                      <div class="text-subtitle2 text-weight-bold">
                        Estado
                      </div>
                      <div class="text-caption text-grey-7">
                        Activa o desactiva esta deducción.
                      </div>
                    </div>

                    <q-toggle
                      v-model="localForm.isActive"
                      color="primary"
                      :label="localForm.isActive ? 'Activo' : 'Inactivo'"
                    />
                  </div>
                </div>
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
              label="Descripción"
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
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const localForm = ref(getEmptyForm());

function getEmptyForm() {
  return {
    name: "",
    code: "",
    isLegal: false,
    percentage: 0,
    isActive: true,
    deducibleIsr: false,
    fixedAmount: 0,
    description: "",
  };
}

const syncForm = () => {
  const base = getEmptyForm();

  localForm.value = {
    ...base,
    ...(props.formData || {}),
    name: props.formData?.name || "",
    code: props.formData?.code || "",
    isLegal: !!props.formData?.isLegal,
    percentage: Number(props.formData?.percentage || 0),
    isActive: props.formData?.isActive !== false,
    deducibleIsr: !!props.formData?.deducibleIsr,
    fixedAmount: Number(props.formData?.fixedAmount || 0),
    description: props.formData?.description || "",
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
  return (
    !!localForm.value.name?.trim() &&
    !!localForm.value.code?.trim() &&
    localForm.value.percentage !== null &&
    localForm.value.percentage !== undefined &&
    localForm.value.fixedAmount !== null &&
    localForm.value.fixedAmount !== undefined
  );
});

const close = () => {
  emit("update:modelValue", false);
};

const save = () => {
  const payload = {
    ...localForm.value,
    name: localForm.value.name?.trim(),
    code: localForm.value.code?.trim()?.toUpperCase(),
    percentage: Number(localForm.value.percentage || 0),
    fixedAmount: Number(localForm.value.fixedAmount || 0),
    description: localForm.value.description?.trim(),
    isLegal: localForm.value.isLegal === true,
    isActive: localForm.value.isActive !== false,
    deducibleIsr: localForm.value.deducibleIsr === true,
  };

  emit("save", payload);
};
</script>

<style scoped>
.deduction-dialog {
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

.options-card {
  border-radius: 18px;
  padding: 14px;
  background: #ffffff;
}

.option-box {
  border-radius: 16px;
  background: #f8fafc;
  padding: 14px;
  min-height: 116px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
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
    flex-direction: column;
  }
}
</style>