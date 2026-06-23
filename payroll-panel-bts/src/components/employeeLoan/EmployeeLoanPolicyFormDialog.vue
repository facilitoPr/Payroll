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
      />

      <q-card-section class="dialog-header bg-primary row items-center justify-between">
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon name="account_balance_wallet" size="28px" />
          </div>

          <div>
            <div class="dialog-title">
              {{ isEdit ? "Editar política de préstamo" : "Nueva política de préstamo" }}
            </div>
            <div class="dialog-subtitle">
              Define límites por sueldo, vacaciones y reglas de garantía.
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
            <q-banner rounded class="bg-blue-1 text-primary">
              <template #avatar>
                <q-icon name="info" color="primary" />
              </template>
              Si no seleccionas compañía, la política será global. Si seleccionas una compañía,
              aplicará solo para esa compañía.
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
                    Identidad, compañía y estado de la política.
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
                    label="Ej: DEFAULT_LOAN_RD"
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
                    label="Ej: Política estándar de préstamos"
                    @update:model-value="updateField('name', $event)"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-card flat bordered class="switch-card">
                    <div>
                      <div class="text-subtitle2 text-weight-bold">
                        Permitir solicitudes
                      </div>
                      <div class="text-caption text-grey-7">
                        Si está apagado, los empleados no podrán solicitar préstamos.
                      </div>
                    </div>

                    <q-toggle
                      :model-value="form.allowEmployeeLoanRequests"
                      color="primary"
                      @update:model-value="
                        updateField('allowEmployeeLoanRequests', $event)
                      "
                    />
                  </q-card>
                </div>

                <div class="col-12 col-md-6">
                  <q-card flat bordered class="switch-card">
                    <div>
                      <div class="text-subtitle2 text-weight-bold">
                        Política activa
                      </div>
                      <div class="text-caption text-grey-7">
                        Solo políticas activas se usan para calcular préstamos.
                      </div>
                    </div>

                    <q-toggle
                      :model-value="form.isActive"
                      color="positive"
                      checked-icon="check"
                      unchecked-icon="close"
                      @update:model-value="updateField('isActive', $event)"
                    />
                  </q-card>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12">
            <div class="section-card">
              <div class="section-card-header">
                <q-avatar color="green-1" text-color="positive" size="38px">
                  <q-icon name="payments" />
                </q-avatar>

                <div>
                  <div class="section-card-title">Límites del préstamo</div>
                  <div class="section-card-subtitle">
                    Controla montos permitidos y capacidad basada en sueldo.
                  </div>
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-3">
                  <div class="field-label required">Monto mínimo</div>
                  <q-input
                    :model-value="form.minLoanAmount"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="0"
                    prefix="RD$"
                    @update:model-value="
                      updateField('minLoanAmount', normalizeNumber($event))
                    "
                  />
                </div>

                <div class="col-12 col-md-3">
                  <div class="field-label required">Monto máximo</div>
                  <q-input
                    :model-value="form.maxLoanAmount"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="0"
                    prefix="RD$"
                    @update:model-value="
                      updateField('maxLoanAmount', normalizeNumber($event))
                    "
                  />
                </div>

                <div class="col-12 col-md-3">
                  <div class="field-label required">Multiplicador sueldo</div>
                  <q-input
                    :model-value="form.maxSalaryMultiplier"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="0"
                    suffix="x"
                    @update:model-value="
                      updateField('maxSalaryMultiplier', normalizeNumber($event))
                    "
                  />
                </div>

                <div class="col-12 col-md-3">
                  <div class="field-label required">% pago mensual</div>
                  <q-input
                    :model-value="form.maxMonthlyPaymentPercent"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="0"
                    max="100"
                    suffix="%"
                    @update:model-value="
                      updateField(
                        'maxMonthlyPaymentPercent',
                        normalizeNumber($event),
                      )
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
                  <q-icon name="beach_access" />
                </q-avatar>

                <div>
                  <div class="section-card-title">Garantía con vacaciones</div>
                  <div class="section-card-subtitle">
                    Define cuántos días puede usar el empleado como garantía y cómo valorarlos.
                  </div>
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-4">
                  <div class="field-label required">Días mínimos requeridos</div>
                  <q-input
                    :model-value="form.minimumVacationDaysRequired"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="0"
                    suffix="día(s)"
                    @update:model-value="
                      updateField(
                        'minimumVacationDaysRequired',
                        normalizeNumber($event),
                      )
                    "
                  />
                </div>

                <div class="col-12 col-md-4">
                  <div class="field-label required">% máximo de garantía</div>
                  <q-input
                    :model-value="form.maxVacationDaysGuaranteePercent"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="0"
                    max="100"
                    suffix="%"
                    @update:model-value="
                      updateField(
                        'maxVacationDaysGuaranteePercent',
                        normalizeNumber($event),
                      )
                    "
                  />
                </div>

                <div class="col-12 col-md-4">
                  <div class="field-label required">Valor del día</div>
                  <q-select
                    :model-value="form.vacationDayValueMode"
                    outlined
                    dense
                    rounded
                    color="primary"
                    :options="vacationValueModeOptions"
                    emit-value
                    map-options
                    label="Modo de cálculo"
                    @update:model-value="
                      updateField('vacationDayValueMode', $event)
                    "
                  />
                </div>

                <div
                  v-if="form.vacationDayValueMode === 'CUSTOM_AMOUNT'"
                  class="col-12 col-md-4"
                >
                  <div class="field-label required">Valor fijo por día</div>
                  <q-input
                    :model-value="form.customVacationDayAmount"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="0"
                    prefix="RD$"
                    @update:model-value="
                      updateField(
                        'customVacationDayAmount',
                        normalizeNumber($event),
                      )
                    "
                  />
                </div>

                <div class="col-12 col-md-4">
                  <q-card flat bordered class="switch-card compact">
                    <div>
                      <div class="text-subtitle2 text-weight-bold">
                        Usar todos los días
                      </div>
                      <div class="text-caption text-grey-7">
                        Permite dejar el balance en 0.
                      </div>
                    </div>

                    <q-toggle
                      :model-value="form.allowUseAllVacationDays"
                      color="warning"
                      @update:model-value="
                        updateField('allowUseAllVacationDays', $event)
                      "
                    />
                  </q-card>
                </div>

                <div class="col-12 col-md-4">
                  <q-card flat bordered class="switch-card compact">
                    <div>
                      <div class="text-subtitle2 text-weight-bold">
                        Sin garantía
                      </div>
                      <div class="text-caption text-grey-7">
                        Permite solicitar sin días de vacaciones.
                      </div>
                    </div>

                    <q-toggle
                      :model-value="form.allowWithoutVacationGuarantee"
                      color="warning"
                      @update:model-value="
                        updateField('allowWithoutVacationGuarantee', $event)
                      "
                    />
                  </q-card>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12">
            <div class="section-card">
              <div class="section-card-header">
                <q-avatar color="purple-1" text-color="purple-8" size="38px">
                  <q-icon name="hub" />
                </q-avatar>

                <div>
                  <div class="section-card-title">Integración externa</div>
                  <div class="section-card-subtitle">
                    Código que luego se enviará a la API externa de préstamos.
                  </div>
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12">
                  <div class="field-label">Código de producto externo</div>
                  <q-input
                    :model-value="form.externalProductCode"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: EMPLOYEE_VACATION_LOAN"
                    @update:model-value="handleExternalProductCodeChange"
                  />
                </div>
              </div>
            </div>
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
          icon="close"
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

const vacationValueModeOptions = [
  {
    label: "Sueldo diario",
    value: "DAILY_SALARY",
  },
  {
    label: "Monto fijo",
    value: "CUSTOM_AMOUNT",
  },
  {
    label: "No usar valor de vacaciones",
    value: "NONE",
  },
];

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
    return 0;
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
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  updateField("code", normalized);
};

const handleExternalProductCodeChange = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  updateField("externalProductCode", normalized);
};

const isInvalidNumber = (value) => {
  return value === null || value === undefined || Number(value) < 0;
};

const saveDisabled = computed(() => {
  if (props.saving) return true;

  if (!props.form.name || !props.form.code) return true;

  if (isInvalidNumber(props.form.minLoanAmount)) return true;
  if (isInvalidNumber(props.form.maxLoanAmount)) return true;
  if (isInvalidNumber(props.form.maxSalaryMultiplier)) return true;
  if (isInvalidNumber(props.form.maxMonthlyPaymentPercent)) return true;
  if (isInvalidNumber(props.form.minimumVacationDaysRequired)) return true;
  if (isInvalidNumber(props.form.maxVacationDaysGuaranteePercent)) return true;

  if (
    Number(props.form.maxLoanAmount || 0) > 0 &&
    Number(props.form.minLoanAmount || 0) >
      Number(props.form.maxLoanAmount || 0)
  ) {
    return true;
  }

  if (
    Number(props.form.maxMonthlyPaymentPercent || 0) < 0 ||
    Number(props.form.maxMonthlyPaymentPercent || 0) > 100
  ) {
    return true;
  }

  if (
    Number(props.form.maxVacationDaysGuaranteePercent || 0) < 0 ||
    Number(props.form.maxVacationDaysGuaranteePercent || 0) > 100
  ) {
    return true;
  }

  if (
    props.form.vacationDayValueMode === "CUSTOM_AMOUNT" &&
    Number(props.form.customVacationDayAmount || 0) <= 0
  ) {
    return true;
  }

  return false;
});
</script>

<style scoped>
.policy-dialog {
  width: 980px;
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

.switch-card.compact {
  min-height: 86px;
  background: #f8fafc;
}

.dialog-actions {
  padding: 14px 18px;
  background: white;
}

:deep(.q-field--outlined .q-field__control) {
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