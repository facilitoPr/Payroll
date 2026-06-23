<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="employee-dialog column no-wrap">
      <q-inner-loading
        :showing="loading"
        label="Guardando..."
        label-class="text-primary"
        label-style="font-size: 1.1em"
      />

      <q-card-section class="dialog-header bg-primary row items-center justify-between">
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon size="30px" name="people" color="white" />
          </div>

          <div>
            <div class="dialog-title">
              {{ isEditMode ? "Editar empleado" : "Crear empleado" }}
            </div>
            <div class="dialog-subtitle">
              Información laboral, datos personales y configuración de pago.
            </div>
          </div>
        </div>

        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          :disable="loading"
          @click="emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="employee-dialog-body">
        <!-- DATOS PRINCIPALES -->
        <div class="form-section">
          <div class="form-section-header">
            <div>
              <div class="form-section-title">Datos principales</div>
              <div class="form-section-subtitle">
                Información básica del empleado.
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <div class="field-label required">Nombre completo</div>
              <q-input
                v-model="localForm.name"
                outlined
                dense
                rounded
                color="primary"
                placeholder="Nombre completo"
              />
            </div>

            <div class="col-12 col-md-4">
              <div class="field-label required">Email</div>
              <q-input
                v-model="localForm.email"
                outlined
                dense
                rounded
                color="primary"
                type="email"
                placeholder="correo@empresa.com"
              />
            </div>

            <div class="col-12 col-md-4">
              <div class="field-label required">Fecha de contratación</div>
              <q-input
                v-model="localForm.hiringDate"
                type="date"
                dense
                outlined
                rounded
                color="primary"
              />
            </div>

            <div class="col-12 col-md-4">
              <div class="field-label">Teléfono</div>
              <q-input
                v-model="localForm.phone"
                outlined
                dense
                rounded
                color="primary"
                placeholder="Teléfono"
              />
            </div>

            <div class="col-12 col-md-4">
              <div class="field-label">Cédula</div>
              <q-input
                v-model="localForm.nationalId"
                outlined
                dense
                rounded
                color="primary"
                placeholder="Cédula"
              />
            </div>

            <div class="col-12 col-md-4">
              <div class="field-label">Recontratación</div>
              <q-select
                v-model="localForm.rehiring"
                outlined
                rounded
                dense
                color="primary"
                emit-value
                map-options
                option-value="value"
                option-label="label"
                :options="[
                  { value: 'SI', label: 'Sí' },
                  { value: 'NO', label: 'No' },
                ]"
              />
            </div>
          </div>
        </div>

        <!-- ORGANIZACIÓN -->
        <div class="form-section">
          <div class="form-section-header">
            <div>
              <div class="form-section-title">Organización</div>
              <div class="form-section-subtitle">
                Departamento, puesto y proyecto asignado.
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <div class="field-label required">Departamento</div>
              <q-select
                :model-value="departmentSelected"
                option-label="name"
                option-value="_id"
                outlined
                rounded
                dense
                color="primary"
                :options="departments"
                emit-value
                map-options
                @update:model-value="handleDepartmentChange"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No hay resultados
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-md-4">
              <div class="field-label required">Puesto de trabajo</div>
              <q-select
                v-model="localJobPositionSelected"
                option-label="name"
                option-value="_id"
                outlined
                rounded
                dense
                color="primary"
                :options="jobPositions"
                emit-value
                map-options
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No hay resultados
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-md-4">
              <div class="field-label">Proyecto</div>
              <q-select
                v-model="localProjectSelected"
                option-label="name"
                option-value="_id"
                outlined
                rounded
                dense
                color="primary"
                :options="projects"
                emit-value
                map-options
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No hay resultados
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <transition name="fade">
              <div
                v-if="currentDepartment?.code === requiredDepartmentCode"
                class="col-12 col-md-4"
              >
                <div class="field-label required">Extensión</div>
                <q-input
                  v-model="localForm.ext"
                  outlined
                  dense
                  rounded
                  color="primary"
                  :rules="specialFieldRules"
                />
              </div>
            </transition>

            <div class="col-12 col-md-4" v-if="!isEditMode">
              <div class="field-label">Desde formulario</div>
              <q-select
                v-model="localForm.fromApplication"
                outlined
                rounded
                dense
                color="primary"
                emit-value
                map-options
                option-value="value"
                option-label="label"
                :options="[
                  { value: 'SI', label: 'Sí' },
                  { value: 'NO', label: 'No' },
                ]"
              />
            </div>

            <transition name="fade">
              <div
                v-if="localForm.fromApplication === 'SI'"
                class="col-12 col-md-4"
              >
                <div class="field-label">Aplicante</div>
                <q-select
                  :model-value="applicationSelected"
                  outlined
                  rounded
                  dense
                  color="primary"
                  :options="applications"
                  option-label="applicantName"
                  option-value="_id"
                  emit-value
                  map-options
                  @update:model-value="handleApplicationSelected"
                >
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        No hay resultados
                      </q-item-section>
                    </q-item>
                  </template>

                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <div class="text-weight-medium">
                          {{ scope.opt.applicantName }}
                        </div>
                        <div class="text-caption text-grey">
                          {{ scope.opt.form?.title }}
                        </div>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </transition>
          </div>
        </div>

        <!-- PAGO -->
        <div class="form-section">
          <div class="form-section-header">
            <div>
              <div class="form-section-title">Pago y salario</div>
              <div class="form-section-subtitle">
                Configura el tipo de salario y la frecuencia de pago.
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <div class="field-label required">Tipo de salario</div>
              <q-select
                v-model="localSalaryTypeSelected"
                outlined
                rounded
                dense
                color="primary"
                :options="salaryTypes"
                option-value="_id"
                option-label="name"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No hay resultados
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div
              v-if="localSalaryTypeSelected?.code === 'FIJO'"
              class="col-12 col-md-4"
            >
              <div class="field-label required">Sueldo base</div>
              <q-input
                v-model.number="localForm.baseSalary"
                type="number"
                outlined
                dense
                rounded
                color="primary"
                placeholder="0.00"
              />
            </div>

            <div
              v-if="localSalaryTypeSelected?.code === 'HORAS'"
              class="col-12 col-md-4"
            >
              <div class="field-label required">Tarifa por hora</div>
              <q-input
                v-model.number="localForm.hourlyRate"
                type="number"
                outlined
                dense
                rounded
                color="primary"
                placeholder="0.00"
              />
            </div>

            <div class="col-12 col-md-4">
              <div class="field-label required">Días de pago</div>
              <q-select
                v-model="localPaymentScheduleSelected"
                :options="paymentSchedules"
                option-label="name"
                option-value="_id"
                emit-value
                map-options
                outlined
                rounded
                dense
                color="primary"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <div class="text-bold">{{ scope.opt.name }}</div>
                      <div class="text-caption text-grey">
                        {{ scope.opt.paymentFrequency?.name }}
                      </div>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>
        </div>

        <!-- ESTADO -->
        <div class="form-section">
          <div class="form-section-header">
            <div>
              <div class="form-section-title">Estado laboral</div>
              <div class="form-section-subtitle">
                Activa o desactiva el empleado y registra salida si aplica.
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <div class="field-label">Fecha de salida</div>
              <q-input
                v-model="localForm.exitDate"
                type="date"
                dense
                outlined
                rounded
                color="primary"
              />
            </div>

            <div class="col-12 col-md-4">
              <div class="field-label">Estado</div>
              <div class="status-toggle-card">
                <div class="row items-center q-gutter-sm">
                  <q-icon
                    :name="localForm.isActived ? 'check_circle' : 'cancel'"
                    :color="localForm.isActived ? 'positive' : 'negative'"
                  />

                  <div>
                    <div class="text-subtitle2 text-weight-bold">
                      {{
                        localForm.isActived
                          ? "Empleado activo"
                          : "Empleado inactivo"
                      }}
                    </div>
                    <div class="text-caption text-grey-7">
                      Controla el acceso y visibilidad del empleado.
                    </div>
                  </div>
                </div>

                <q-toggle
                  v-model="localForm.isActived"
                  color="primary"
                  checked-icon="check"
                  unchecked-icon="close"
                  dense
                />
              </div>
            </div>

            <div v-if="localForm.exitDate" class="col-12">
              <div class="field-label">Nota de salida</div>
              <q-input
                v-model="localForm.exitNote"
                type="textarea"
                outlined
                dense
                rounded
                autogrow
                color="primary"
                placeholder="Escribe una nota relacionada a la salida..."
              />
            </div>
          </div>
        </div>

        <!-- FOTO -->
        <div class="form-section">
          <div class="form-section-header">
            <div>
              <div class="form-section-title">Foto del empleado</div>
              <div class="form-section-subtitle">
                Si no tiene foto, se mostrará la inicial.
              </div>
            </div>
          </div>

          <q-card flat bordered class="employee-photo-card">
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-md-8">
                <q-file
                  :model-value="image"
                  outlined
                  dense
                  rounded
                  label="Seleccionar imagen del empleado"
                  accept=".jpg,.jpeg,.png"
                  class="employee-photo-file"
                  @update:model-value="handleImageChange"
                >
                  <template #prepend>
                    <q-icon name="photo_camera" color="primary" />
                  </template>

                  <template #append>
                    <q-btn
                      v-if="image || localForm.img"
                      flat
                      round
                      dense
                      icon="delete"
                      color="negative"
                      @click.stop="clearEmployeePhoto"
                    />
                  </template>

                  <template #hint>
                    Tamaño recomendado: 400×400.
                  </template>
                </q-file>

                <q-banner
                  v-if="image"
                  class="bg-blue-1 text-primary q-mt-sm rounded-banner"
                  rounded
                >
                  <template #avatar>
                    <q-icon name="info" color="primary" />
                  </template>
                  Imagen lista para subirse al guardar.
                </q-banner>
              </div>

              <div class="col-12 col-md-4">
                <div class="employee-photo-preview">
                  <q-avatar size="128px" class="employee-photo-avatar">
                    <q-img
                      v-if="localForm.img"
                      :src="localForm.img"
                      spinner-color="white"
                      fit="cover"
                    />
                    <span v-else class="employee-photo-initial">
                      {{ formInitial }}
                    </span>
                  </q-avatar>

                  <div class="text-caption text-grey-7 q-mt-sm">
                    Vista previa
                  </div>
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          no-caps
          color="negative"
          label="Cancelar"
          icon="cancel"
          class="dialog-action-btn"
          :disable="loading"
          @click="emit('update:modelValue', false)"
        />

        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Guardar"
          icon="save"
          class="dialog-action-btn"
          :loading="loading"
          :disable="saveDisabled"
          @click="emit('save')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },

  form: { type: Object, required: true },
  image: { default: null },

  departments: { type: Array, default: () => [] },
  projects: { type: Array, default: () => [] },
  jobPositions: { type: Array, default: () => [] },
  salaryTypes: { type: Array, default: () => [] },
  paymentSchedules: { type: Array, default: () => [] },
  applications: { type: Array, default: () => [] },

  departmentSelected: { default: null },
  projectSelected: { default: null },
  jobPositionSelected: { default: null },
  salaryTypeSelected: { default: null },
  paymentScheduleSelected: { default: null },
  applicationSelected: { default: null },

  currentDepartment: { type: Object, default: null },
  requiredDepartmentCode: { type: String, default: "" },
  specialFieldRules: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "update:modelValue",
  "update:form",
  "update:image",
  "update:departmentSelected",
  "update:projectSelected",
  "update:jobPositionSelected",
  "update:salaryTypeSelected",
  "update:paymentScheduleSelected",
  "update:applicationSelected",
  "department-change",
  "application-selected",
  "save",
]);

const localForm = computed({
  get: () => props.form,
  set: (value) => emit("update:form", value),
});

const localProjectSelected = computed({
  get: () => props.projectSelected,
  set: (value) => emit("update:projectSelected", value),
});

const localJobPositionSelected = computed({
  get: () => props.jobPositionSelected,
  set: (value) => emit("update:jobPositionSelected", value),
});

const localSalaryTypeSelected = computed({
  get: () => props.salaryTypeSelected,
  set: (value) => emit("update:salaryTypeSelected", value),
});

const localPaymentScheduleSelected = computed({
  get: () => props.paymentScheduleSelected,
  set: (value) => emit("update:paymentScheduleSelected", value),
});

const formInitial = computed(() => {
  return getInitials(localForm.value?.name || localForm.value?.email || "U");
});

const saveDisabled = computed(() => {
  return (
    !localForm.value.name ||
    !localForm.value.email ||
    !localForm.value.hiringDate ||
    props.departmentSelected == null ||
    props.jobPositionSelected == null ||
    props.salaryTypeSelected == null ||
    props.paymentScheduleSelected == null
  );
});

const getInitials = (value) => {
  const text = String(value || "").trim();

  if (!text) return "U";

  const parts = text.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const handleDepartmentChange = (value) => {
  emit("update:departmentSelected", value);
  emit("department-change", value);
};

const handleApplicationSelected = (value) => {
  emit("update:applicationSelected", value);
  emit("application-selected", value);
};

const handleImageChange = (file) => {
  emit("update:image", file || null);

  if (file) {
    localForm.value.img = URL.createObjectURL(file);
  }
};

const clearEmployeePhoto = () => {
  emit("update:image", null);
  localForm.value.img = null;
};
</script>

<style scoped>
.employee-dialog {
  width: 1120px;
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

.employee-dialog-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(92vh - 154px);
  padding: 18px;
  background: #f8fafc;
}

.form-section {
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.form-section-header {
  margin-bottom: 14px;
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

.status-toggle-card {
  min-height: 44px;
  padding: 9px 12px;
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
}

.employee-photo-card {
  padding: 14px;
  border-radius: 20px;
  background: #ffffff;
}

.employee-photo-preview {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #64748b;
}

.employee-photo-avatar {
  border: 4px solid #ffffff;
  background: linear-gradient(135deg, #1a2436, #1964a2);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18);
}

.employee-photo-initial {
  color: white;
  font-size: 2.3rem;
  font-weight: 900;
}

.rounded-banner {
  border-radius: 16px;
}

.dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
}

.dialog-action-btn {
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

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 768px) {
  .employee-dialog {
    width: 96vw;
    max-height: 94vh;
  }

  .employee-dialog-body {
    max-height: calc(94vh - 154px);
    padding: 12px;
  }

  .form-section {
    padding: 12px;
  }
}
</style>