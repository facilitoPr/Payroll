<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="job-position-dialog">
      <q-card-section class="dialog-header row items-start justify-between">
        <div class="row items-center q-gutter-sm">
          <q-avatar color="white" text-color="primary" icon="work" />

          <div>
            <div class="text-h6 text-weight-bold">
              {{ isEditMode ? "Editar puesto de trabajo" : "Crear puesto de trabajo" }}
            </div>
            <div class="text-caption text-blue-1">
              Define el puesto, su departamento y sus requisitos.
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
              @update:model-value="handleCompanyChange"
            >
              <template #prepend>
                <q-icon name="business" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-6">
            <q-select
              v-model="localForm.department"
              :options="departments"
              option-label="name"
              option-value="_id"
              emit-value
              map-options
              outlined
              dense
              clearable
              color="primary"
              label="Departamento *"
              class="rounded-input"
              :loading="loadingDepartments"
              :disable="!localForm.company || loadingDepartments"
              :hint="
                !localForm.company
                  ? 'Selecciona una compañía para cargar sus departamentos.'
                  : ''
              "
            >
              <template #prepend>
                <q-icon name="apartment" />
              </template>

              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No hay departamentos para esta compañía.
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="localForm.code"
              outlined
              dense
              color="primary"
              label="Código"
              class="rounded-input"
              maxlength="50"
              hint="Opcional. Si lo dejas vacío, se genera desde el nombre."
            >
              <template #prepend>
                <q-icon name="tag" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-8">
            <q-input
              v-model="localForm.name"
              outlined
              dense
              color="primary"
              label="Nombre del puesto *"
              class="rounded-input"
              maxlength="120"
              counter
            >
              <template #prepend>
                <q-icon name="work" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <q-select
              v-model="localForm.modality"
              :options="modalityOptions"
              emit-value
              map-options
              outlined
              dense
              color="primary"
              label="Modalidad"
              class="rounded-input"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-select
              v-model="localForm.employmentType"
              :options="employmentTypeOptions"
              emit-value
              map-options
              outlined
              dense
              clearable
              color="primary"
              label="Tipo de empleo"
              class="rounded-input"
            />
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
              maxlength="3000"
              counter
            />
          </div>

          <div class="col-12 col-md-6">
            <q-card flat bordered class="list-editor-card">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">
                Requisitos
              </div>

              <q-input
                v-model="reqInput"
                outlined
                dense
                color="primary"
                label="Agregar requisito"
                class="rounded-input"
                @keyup.enter="addRequirement"
              >
                <template #append>
                  <q-btn
                    flat
                    round
                    dense
                    icon="add"
                    color="primary"
                    @click="addRequirement"
                  />
                </template>
              </q-input>

              <div class="q-mt-sm">
                <q-chip
                  v-for="(item, index) in localForm.requirements"
                  :key="`req-${index}`"
                  removable
                  color="primary"
                  text-color="white"
                  @remove="removeRequirement(index)"
                >
                  {{ item }}
                </q-chip>

                <div
                  v-if="!localForm.requirements.length"
                  class="text-caption text-grey-6 q-mt-sm"
                >
                  No hay requisitos agregados.
                </div>
              </div>
            </q-card>
          </div>

          <div class="col-12 col-md-6">
            <q-card flat bordered class="list-editor-card">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">
                Responsabilidades
              </div>

              <q-input
                v-model="respInput"
                outlined
                dense
                color="primary"
                label="Agregar responsabilidad"
                class="rounded-input"
                @keyup.enter="addResponsibility"
              >
                <template #append>
                  <q-btn
                    flat
                    round
                    dense
                    icon="add"
                    color="primary"
                    @click="addResponsibility"
                  />
                </template>
              </q-input>

              <div class="q-mt-sm">
                <q-chip
                  v-for="(item, index) in localForm.responsibilities"
                  :key="`resp-${index}`"
                  removable
                  color="primary"
                  text-color="white"
                  @remove="removeResponsibility(index)"
                >
                  {{ item }}
                </q-chip>

                <div
                  v-if="!localForm.responsibilities.length"
                  class="text-caption text-grey-6 q-mt-sm"
                >
                  No hay responsabilidades agregadas.
                </div>
              </div>
            </q-card>
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
                    Estado del puesto
                  </div>
                  <div class="text-caption text-grey-7">
                    Define si este puesto estará disponible para proyectos y empleados.
                  </div>
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
          :label="isEditMode ? 'Guardar' : 'Crear'"
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
  companies: {
    type: Array,
    default: () => [],
  },
  departments: {
    type: Array,
    default: () => [],
  },
  loadingDepartments: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save", "company-change"]);

const localForm = ref(getEmptyForm());
const reqInput = ref("");
const respInput = ref("");

const modalityOptions = [
  { label: "Presencial", value: "Onsite" },
  { label: "Remoto", value: "Remote" },
  { label: "Híbrido", value: "Hybrid" },
];

const employmentTypeOptions = [
  { label: "Tiempo completo", value: "FullTime" },
  { label: "Medio tiempo", value: "PartTime" },
  { label: "Contrato", value: "Contract" },
  { label: "Pasantía", value: "Internship" },
  { label: "Temporal", value: "Temporary" },
];

function getEmptyForm() {
  return {
    company: "",
    department: "",
    code: "",
    name: "",
    description: "",
    modality: "Onsite",
    employmentType: "",
    requirements: [],
    responsibilities: [],
    isActive: true,
  };
}

const canSave = computed(() => {
  return (
    !!localForm.value.company &&
    !!localForm.value.department &&
    !!localForm.value.name?.trim()
  );
});

const syncForm = () => {
  localForm.value = {
    ...getEmptyForm(),
    ...(props.formData || {}),
    requirements: Array.isArray(props.formData?.requirements)
      ? [...props.formData.requirements]
      : [],
    responsibilities: Array.isArray(props.formData?.responsibilities)
      ? [...props.formData.responsibilities]
      : [],
    isActive: props.formData?.isActive !== false,
  };

  reqInput.value = "";
  respInput.value = "";
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

const handleCompanyChange = (companyId) => {
  localForm.value.department = "";
  emit("company-change", companyId);
};

const addRequirement = () => {
  const value = reqInput.value.trim();
  if (!value) return;

  localForm.value.requirements.push(value);
  reqInput.value = "";
};

const removeRequirement = (index) => {
  localForm.value.requirements.splice(index, 1);
};

const addResponsibility = () => {
  const value = respInput.value.trim();
  if (!value) return;

  localForm.value.responsibilities.push(value);
  respInput.value = "";
};

const removeResponsibility = (index) => {
  localForm.value.responsibilities.splice(index, 1);
};

const close = () => {
  emit("update:modelValue", false);
};

const save = () => {
  emit("save", {
    ...localForm.value,
    code: localForm.value.code?.trim()?.toUpperCase(),
    name: localForm.value.name?.trim(),
    description: localForm.value.description?.trim(),
    employmentType: localForm.value.employmentType || undefined,
  });
};
</script>

<style scoped>
.job-position-dialog {
  width: 980px;
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

.status-box,
.list-editor-card {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.11);
  background: #ffffff;
}

.status-box {
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.list-editor-card {
  padding: 14px;
  min-height: 170px;
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