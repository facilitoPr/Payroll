<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="department-dialog">
      <q-card-section class="dialog-header row items-start justify-between">
        <div class="row items-center q-gutter-sm">
          <q-avatar color="white" text-color="primary" icon="apartment" />

          <div>
            <div class="text-h6 text-weight-bold">
              {{ isEditMode ? "Editar departamento" : "Agregar departamento" }}
            </div>
            <div class="text-caption text-blue-1">
              Completa la información del departamento.
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
          <div class="col-12">
            <q-select
              v-model="localForm.company"
              :options="companies"
              option-label="label"
              option-value="_id"
              emit-value
              map-options
              outlined
              dense
              color="primary"
              label="Compañía *"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="business" />
              </template>
            </q-select>
          </div>

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
                <q-icon name="apartment" />
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
              disable
            >
              <template #prepend>
                <q-icon name="tag" />
              </template>
            </q-input>
          </div>

          <div class="col-12">
            <div class="status-box">
              <div class="row items-center q-gutter-sm">
                <q-avatar
                  size="36px"
                  :color="localForm.isActive ? 'secondary' : 'negative'"
                  text-color="white"
                  :icon="localForm.isActive ? 'check_circle' : 'cancel'"
                />

                <div>
                  <div class="text-subtitle2 text-weight-bold">
                    Estado del departamento
                  </div>
                  <div class="text-caption text-grey-7">
                    Define si este departamento estará disponible en el sistema.
                  </div>
                </div>
              </div>

              <q-toggle
                v-model="localForm.isActive"
                color="primary"
                checked-icon="check"
                unchecked-icon="close"
                :label="localForm.isActive ? 'Activo' : 'Inactivo'"
                left-label
              />
            </div>
          </div>

          <div class="col-12">
            <q-input
              v-model="localForm.description"
              type="textarea"
              outlined
              dense
              autogrow
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
    default: () => ({
      company: "",
      name: "",
      code: "",
      isActive: true,
      description: "",
    }),
  },
  companies: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const localForm = ref({
  company: "",
  name: "",
  code: "",
  isActive: true,
  description: "",
});

const syncForm = () => {
  localForm.value = {
    company: props.formData?.company || "",
    name: props.formData?.name || "",
    code: props.formData?.code || "",
    isActive: props.formData?.isActive !== false,
    description: props.formData?.description || "",
  };
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) syncForm();
  }
);

watch(
  () => props.formData,
  () => syncForm(),
  { deep: true }
);

const canSave = computed(() => {
  return (
    !!localForm.value.company &&
    !!localForm.value.name?.trim() 
  );
});

const close = () => {
  emit("update:modelValue", false);
};

const save = () => {
  emit("save", {
    ...localForm.value,
    name: localForm.value.name?.trim(),
    description: localForm.value.description?.trim(),
  });
};
</script>

<style scoped>
.department-dialog {
  width: 820px;
  max-width: 94vw;
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

.status-box {
  border: 1px solid rgba(0, 0, 0, 0.11);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #ffffff;
}

.dialog-btn {
  text-transform: none;
  font-weight: 600;
  min-width: 120px;
}

@media (max-width: 600px) {
  .status-box {
    align-items: flex-start;
    flex-direction: column;
  }

  .dialog-btn {
    width: 100%;
  }
}
</style>