<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="policy-dialog">
      <q-inner-loading
        :showing="saving"
        label="Guardando política..."
        label-class="text-primary"
        label-style="font-size: 1.1em"
      />

      <q-card-section
        class="dialog-header bg-primary row items-center justify-between"
      >
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon name="rule" size="28px" />
          </div>

          <div>
            <div class="dialog-title">
              {{ isEdit ? "Editar política" : "Nueva política" }}
            </div>
            <div class="dialog-subtitle">
              Define reglas generales para permisos y vacaciones.
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
          @click="emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="dialog-body">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-banner class="bg-blue-1 text-primary rounded-banner">
              <template #avatar>
                <q-icon name="info" color="primary" />
              </template>

              Si no seleccionas compañía, la política será global. Si
              seleccionas una compañía, aplicará solo para esa compañía.
            </q-banner>
          </div>

          <div class="col-12">
            <div class="section-card">
              <div class="section-card-header">
                <q-avatar color="blue-1" text-color="primary" size="38px">
                  <q-icon name="business" />
                </q-avatar>

                <div>
                  <div class="section-card-title">Información general</div>
                  <div class="section-card-subtitle">
                    Identidad y alcance de la política.
                  </div>
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-6">
                  <div class="field-label">Compañía</div>
                  <q-select
                    :model-value="form.company"
                    outlined
                    dense
                    rounded
                    clearable
                    color="primary"
                    :options="companies"
                    :option-label="companyOptionLabel"
                    option-value="_id"
                    emit-value
                    map-options
                    label="Compañía"
                    @update:model-value="updateField('company', $event)"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <div class="field-label required">Código</div>
                  <q-input
                    :model-value="form.code"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: DEFAULT_RD"
                    @update:model-value="handleCodeChange"
                  />
                </div>

                <div class="col-12">
                  <div class="field-label required">Nombre</div>
                  <q-input
                    :model-value="form.name"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: Política estándar RD"
                    @update:model-value="updateField('name', $event)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="col-12">
            <div class="section-card">
              <div class="section-card-header">
                <q-avatar color="green-1" text-color="positive" size="38px">
                  <q-icon name="beach_access" />
                </q-avatar>

                <div>
                  <div class="section-card-title">Reglas de vacaciones</div>
                  <div class="section-card-subtitle">
                    Días asignados por defecto y por antigüedad.
                  </div>
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-4">
                  <div class="field-label required">Días base de vacaciones</div>
                  <q-input
                    :model-value="form.defaultVacationDays"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="0"
                    label="14"
                    @update:model-value="
                      updateField('defaultVacationDays', normalizeNumber($event))
                    "
                  />
                </div>

                <div class="col-12 col-md-4">
                  <div class="field-label required">
                    Días por antigüedad
                  </div>
                  <q-input
                    :model-value="form.seniorityVacationDays"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="0"
                    label="18"
                    @update:model-value="
                      updateField(
                        'seniorityVacationDays',
                        normalizeNumber($event),
                      )
                    "
                  />
                </div>

                <div class="col-12 col-md-4">
                  <div class="field-label required">Años para antigüedad</div>
                  <q-input
                    :model-value="form.seniorityYears"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="0"
                    label="5"
                    @update:model-value="
                      updateField('seniorityYears', normalizeNumber($event))
                    "
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="col-12">
            <div class="section-card">
              <div class="section-card-header">
                <q-avatar color="orange-1" text-color="orange-10" size="38px">
                  <q-icon name="event_upcoming" />
                </q-avatar>

                <div>
                  <div class="section-card-title">Días de antelación</div>
                  <div class="section-card-subtitle">
                    Controla con cuántos días de anticipación se pueden solicitar
                    permisos y vacaciones.
                  </div>
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-6">
                  <div class="field-label required">
                    Antelación para permisos
                  </div>
                  <q-input
                    :model-value="form.permissionAdvanceDays"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="0"
                    label="Ej: 1"
                    suffix="día(s)"
                    @update:model-value="
                      updateField('permissionAdvanceDays', normalizeNumber($event))
                    "
                  >
                    <template #prepend>
                      <q-icon name="assignment" color="primary" />
                    </template>
                  </q-input>
                </div>

                <div class="col-12 col-md-6">
                  <div class="field-label required">
                    Antelación para vacaciones
                  </div>
                  <q-input
                    :model-value="form.vacationAdvanceDays"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="0"
                    label="Ej: 7"
                    suffix="día(s)"
                    @update:model-value="
                      updateField('vacationAdvanceDays', normalizeNumber($event))
                    "
                  >
                    <template #prepend>
                      <q-icon name="beach_access" color="primary" />
                    </template>
                  </q-input>
                </div>

                <div class="col-12">
                  <q-banner rounded class="bg-orange-1 text-orange-10">
                    <template #avatar>
                      <q-icon name="warning" color="orange-10" />
                    </template>

                    Si colocas 0, el empleado podrá solicitar para el mismo día,
                    siempre que no choque con otra solicitud existente.
                  </q-banner>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-6">
            <q-card flat bordered class="switch-card">
              <div>
                <div class="text-subtitle2 text-weight-bold">
                  Permitir override por empleado
                </div>
                <div class="text-caption text-grey-7">
                  RRHH podrá cambiar manualmente los días de un empleado.
                </div>
              </div>

              <q-toggle
                :model-value="form.allowEmployeeOverride"
                color="primary"
                @update:model-value="
                  updateField('allowEmployeeOverride', $event)
                "
              />
            </q-card>
          </div>

          <div class="col-12 col-md-6">
            <q-card flat bordered class="switch-card">
              <div>
                <div class="text-subtitle2 text-weight-bold">
                  Permitir balance negativo
                </div>
                <div class="text-caption text-grey-7">
                  Recomendado mantenerlo apagado.
                </div>
              </div>

              <q-toggle
                :model-value="form.allowNegativeBalance"
                color="warning"
                @update:model-value="
                  updateField('allowNegativeBalance', $event)
                "
              />
            </q-card>
          </div>

          <div class="col-12">
            <q-card flat bordered class="switch-card">
              <div>
                <div class="text-subtitle2 text-weight-bold">
                  Estado de la política
                </div>
                <div class="text-caption text-grey-7">
                  Solo las políticas activas se usarán para validar permisos,
                  vacaciones y balances.
                </div>
              </div>

              <q-toggle
                :model-value="form.isActive"
                color="primary"
                checked-icon="check"
                unchecked-icon="close"
                @update:model-value="updateField('isActive', $event)"
              />
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          rounded
          no-caps
          color="negative"
          icon="cancel"
          label="Cancelar"
          :disable="saving"
          @click="emit('update:modelValue', false)"
        />

        <q-btn
          unelevated
          rounded
          no-caps
          color="primary"
          icon="save"
          label="Guardar"
          :loading="saving"
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
  modelValue: {
    type: Boolean,
    default: false,
  },

  form: {
    type: Object,
    required: true,
  },

  companies: {
    type: Array,
    default: () => [],
  },

  isEdit: {
    type: Boolean,
    default: false,
  },

  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "update:form", "save"]);

const companyOptionLabel = (company) => {
  return (
    company?.legalName ||
    company?.commercialName ||
    company?.name ||
    company?.code ||
    "Sin nombre"
  );
};

const normalizeNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

const updateField = (field, value) => {
  emit("update:form", {
    ...props.form,
    [field]: value,
  });
};

const handleCodeChange = (value) => {
  const normalizedCode = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  updateField("code", normalizedCode);
};

const isInvalidNumber = (value) => {
  return value === null || value === undefined || Number(value) < 0;
};

const saveDisabled = computed(() => {
  return (
    props.saving ||
    !props.form.name ||
    !props.form.code ||
    isInvalidNumber(props.form.defaultVacationDays) ||
    isInvalidNumber(props.form.seniorityVacationDays) ||
    isInvalidNumber(props.form.seniorityYears) ||
    isInvalidNumber(props.form.permissionAdvanceDays) ||
    isInvalidNumber(props.form.vacationAdvanceDays)
  );
});
</script>

<style scoped>
.policy-dialog {
  width: 920px;
  max-width: 96vw;
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
  max-height: calc(92vh - 154px);
  overflow-y: auto;
  background: #f8fafc;
  padding: 18px;
}

.section-card {
  padding: 16px;
  border-radius: 20px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.section-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-card-title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.section-card-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.78rem;
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

.switch-card {
  min-height: 74px;
  padding: 14px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: white;
}

.rounded-banner {
  border-radius: 16px;
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
  .policy-dialog {
    width: 96vw;
  }

  .switch-card {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>