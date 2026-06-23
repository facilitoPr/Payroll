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
            <q-icon name="gavel" size="28px" />
          </div>

          <div>
            <div class="dialog-title">
              {{ dialogTitle }}
            </div>

            <div class="dialog-subtitle">
              Configura reglas legales y de negocio para liquidaciones laborales.
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

      <q-card-section class="tabs-wrap">
        <q-tabs
          v-model="tab"
          dense
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
          class="bg-white"
        >
          <q-tab name="general" icon="settings" label="General" />
          <q-tab name="preNotice" icon="schedule" label="Preaviso" />
          <q-tab name="severance" icon="payments" label="Cesantía" />
          <q-tab name="benefits" icon="redeem" label="Regalía y vacaciones" />
          <q-tab name="types" icon="rule" label="Tipos" />
          <q-tab name="manual" icon="tune" label="Ajustes" />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <q-card-section class="dialog-body">
        <q-tab-panels v-model="tab" animated class="bg-transparent">
          <q-tab-panel name="general" class="q-pa-none">
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
                        Vigencia, compañía, base salarial y estado.
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
                        :readonly="readOnly"
                        :options="companies"
                        :option-label="companyOptionLabel"
                        option-value="_id"
                        emit-value
                        map-options
                        label="Compañía"
                        @update:model-value="updateField('company', $event)"
                      />
                    </div>

                    <div class="col-12 col-md-3">
                      <div class="field-label required">Año</div>
                      <q-input
                        :model-value="form.year"
                        type="number"
                        outlined
                        dense
                        rounded
                        color="primary"
                        :readonly="readOnly"
                        label="2026"
                        @update:model-value="updateField('year', normalizeNumber($event))"
                      />
                    </div>

                    <div class="col-12 col-md-3">
                      <div class="field-label required">Versión</div>
                      <q-input
                        :model-value="form.version"
                        type="number"
                        outlined
                        dense
                        rounded
                        color="primary"
                        :readonly="readOnly"
                        label="1"
                        @update:model-value="updateField('version', normalizeNumber($event))"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="field-label required">Vigente desde</div>
                      <q-input
                        :model-value="form.effectiveFrom"
                        type="date"
                        outlined
                        dense
                        rounded
                        color="primary"
                        :readonly="readOnly"
                        @update:model-value="updateField('effectiveFrom', $event)"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="field-label">Vigente hasta</div>
                      <q-input
                        :model-value="form.effectiveTo"
                        type="date"
                        outlined
                        dense
                        rounded
                        clearable
                        color="primary"
                        :readonly="readOnly"
                        @update:model-value="updateField('effectiveTo', $event)"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="field-label required">Base salarial</div>
                      <q-select
                        :model-value="form.salaryBaseMode"
                        outlined
                        dense
                        rounded
                        emit-value
                        map-options
                        color="primary"
                        :readonly="readOnly"
                        label="Base salarial"
                        :options="salaryBaseOptions"
                        @update:model-value="updateField('salaryBaseMode', $event)"
                      />
                    </div>

                    <div class="col-12 col-md-3">
                      <div class="field-label required">Divisor diario</div>
                      <q-input
                        :model-value="form.dailySalaryDivisor"
                        type="number"
                        outlined
                        dense
                        rounded
                        color="primary"
                        :readonly="readOnly"
                        label="23.83"
                        @update:model-value="
                          updateField('dailySalaryDivisor', normalizeNumber($event))
                        "
                      />
                    </div>

                    <div class="col-12 col-md-3">
                      <div class="field-label required">Redondeo</div>
                      <q-select
                        :model-value="form.roundingMode"
                        outlined
                        dense
                        rounded
                        emit-value
                        map-options
                        color="primary"
                        :readonly="readOnly"
                        label="Redondeo"
                        :options="roundingOptions"
                        @update:model-value="updateField('roundingMode', $event)"
                      />
                    </div>

                    <div class="col-12">
                      <div class="field-label">Notas</div>
                      <q-input
                        :model-value="form.notes"
                        outlined
                        dense
                        rounded
                        type="textarea"
                        autogrow
                        color="primary"
                        :readonly="readOnly"
                        label="Notas internas"
                        @update:model-value="updateField('notes', $event)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12">
                <q-card flat bordered class="switch-card">
                  <div>
                    <div class="text-subtitle2 text-weight-bold">
                      Estado de la política
                    </div>

                    <div class="text-caption text-grey-7">
                      Solo las políticas activas se usarán para calcular
                      desvinculaciones.
                    </div>
                  </div>

                  <q-toggle
                    :model-value="form.isActive"
                    color="primary"
                    checked-icon="check"
                    unchecked-icon="close"
                    :disable="readOnly"
                    @update:model-value="updateField('isActive', $event)"
                  />
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="preNotice" class="q-pa-none">
            <div class="section-card">
              <div class="section-card-header">
                <q-avatar color="blue-1" text-color="primary" size="38px">
                  <q-icon name="schedule" />
                </q-avatar>

                <div>
                  <div class="section-card-title">Escala de preaviso</div>
                  <div class="section-card-subtitle">
                    Días de preaviso según meses trabajados.
                  </div>
                </div>

                <q-space />

                <q-btn
                  v-if="!readOnly"
                  unelevated
                  rounded
                  no-caps
                  color="primary"
                  icon="add"
                  label="Agregar tramo"
                  @click="addPreNoticeBracket"
                />
              </div>

              <div class="q-mt-md">
                <div
                  v-for="(item, index) in form.preNoticeBrackets"
                  :key="`pre-${index}`"
                  class="array-row"
                >
                  <div class="row q-col-gutter-md items-end">
                    <div class="col-12 col-md-2">
                      <div class="field-label required">Desde meses</div>
                      <q-input
                        :model-value="item.fromMonths"
                        outlined
                        dense
                        rounded
                        type="number"
                        :readonly="readOnly"
                        @update:model-value="
                          updateArrayField('preNoticeBrackets', index, 'fromMonths', normalizeNumber($event))
                        "
                      />
                    </div>

                    <div class="col-12 col-md-2">
                      <div class="field-label">Hasta meses</div>
                      <q-input
                        :model-value="item.toMonths"
                        outlined
                        dense
                        rounded
                        type="number"
                        clearable
                        :readonly="readOnly"
                        hint="Vacío = infinito"
                        @update:model-value="
                          updateArrayField('preNoticeBrackets', index, 'toMonths', normalizeNullableNumber($event))
                        "
                      />
                    </div>

                    <div class="col-12 col-md-2">
                      <div class="field-label required">Días</div>
                      <q-input
                        :model-value="item.days"
                        outlined
                        dense
                        rounded
                        type="number"
                        :readonly="readOnly"
                        @update:model-value="
                          updateArrayField('preNoticeBrackets', index, 'days', normalizeNumber($event))
                        "
                      />
                    </div>

                    <div class="col-12 col-md-5">
                      <div class="field-label">Etiqueta</div>
                      <q-input
                        :model-value="item.label"
                        outlined
                        dense
                        rounded
                        :readonly="readOnly"
                        label="Ej: Más de 1 año"
                        @update:model-value="
                          updateArrayField('preNoticeBrackets', index, 'label', $event)
                        "
                      />
                    </div>

                    <div class="col-12 col-md-1 text-right">
                      <q-btn
                        v-if="!readOnly"
                        flat
                        round
                        dense
                        color="negative"
                        icon="delete"
                        @click="removeArrayItem('preNoticeBrackets', index)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="severance" class="q-pa-none">
            <div class="section-card">
              <div class="section-card-header">
                <q-avatar color="green-1" text-color="positive" size="38px">
                  <q-icon name="payments" />
                </q-avatar>

                <div>
                  <div class="section-card-title">Escala de cesantía</div>
                  <div class="section-card-subtitle">
                    Días fijos o días por año trabajado según la antigüedad.
                  </div>
                </div>

                <q-space />

                <q-btn
                  v-if="!readOnly"
                  unelevated
                  rounded
                  no-caps
                  color="primary"
                  icon="add"
                  label="Agregar tramo"
                  @click="addSeveranceBracket"
                />
              </div>

              <div class="q-mt-md">
                <div
                  v-for="(item, index) in form.severanceBrackets"
                  :key="`sev-${index}`"
                  class="array-row"
                >
                  <div class="row q-col-gutter-md items-end">
                    <div class="col-12 col-md-2">
                      <div class="field-label required">Desde meses</div>
                      <q-input
                        :model-value="item.fromMonths"
                        outlined
                        dense
                        rounded
                        type="number"
                        :readonly="readOnly"
                        @update:model-value="
                          updateArrayField('severanceBrackets', index, 'fromMonths', normalizeNumber($event))
                        "
                      />
                    </div>

                    <div class="col-12 col-md-2">
                      <div class="field-label">Hasta meses</div>
                      <q-input
                        :model-value="item.toMonths"
                        outlined
                        dense
                        rounded
                        type="number"
                        clearable
                        :readonly="readOnly"
                        hint="Vacío = infinito"
                        @update:model-value="
                          updateArrayField('severanceBrackets', index, 'toMonths', normalizeNullableNumber($event))
                        "
                      />
                    </div>

                    <div class="col-12 col-md-2">
                      <div class="field-label required">Días</div>
                      <q-input
                        :model-value="item.days"
                        outlined
                        dense
                        rounded
                        type="number"
                        :readonly="readOnly"
                        @update:model-value="
                          updateArrayField('severanceBrackets', index, 'days', normalizeNumber($event))
                        "
                      />
                    </div>

                    <div class="col-12 col-md-2">
                      <div class="field-label required">Modo</div>
                      <q-select
                        :model-value="item.mode"
                        outlined
                        dense
                        rounded
                        emit-value
                        map-options
                        :readonly="readOnly"
                        :options="severanceModeOptions"
                        @update:model-value="
                          updateArrayField('severanceBrackets', index, 'mode', $event)
                        "
                      />
                    </div>

                    <div class="col-12 col-md-3">
                      <div class="field-label">Etiqueta</div>
                      <q-input
                        :model-value="item.label"
                        outlined
                        dense
                        rounded
                        :readonly="readOnly"
                        label="Ej: Más de 5 años"
                        @update:model-value="
                          updateArrayField('severanceBrackets', index, 'label', $event)
                        "
                      />
                    </div>

                    <div class="col-12 col-md-1 text-right">
                      <q-btn
                        v-if="!readOnly"
                        flat
                        round
                        dense
                        color="negative"
                        icon="delete"
                        @click="removeArrayItem('severanceBrackets', index)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="benefits" class="q-pa-none">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-lg-6">
                <div class="section-card full-height">
                  <div class="section-card-header">
                    <q-avatar color="orange-1" text-color="orange-10" size="38px">
                      <q-icon name="redeem" />
                    </q-avatar>

                    <div>
                      <div class="section-card-title">
                        Regalía pascual / salario de Navidad
                      </div>

                      <div class="section-card-subtitle">
                        Regla para incluir o excluir regalía en liquidación.
                      </div>
                    </div>
                  </div>

                  <div class="row q-col-gutter-md q-mt-sm">
                    <div class="col-12">
                      <q-card flat bordered class="switch-card">
                        <div>
                          <div class="text-subtitle2 text-weight-bold">
                            Habilitar cálculo de regalía
                          </div>
                          <div class="text-caption text-grey-7">
                            Permite calcular regalía automáticamente.
                          </div>
                        </div>

                        <q-toggle
                          :model-value="form.christmasSalaryRule.enabled"
                          color="positive"
                          :disable="readOnly"
                          @update:model-value="
                            updateNestedField('christmasSalaryRule', 'enabled', $event)
                          "
                        />
                      </q-card>
                    </div>

                    <div class="col-12">
                      <q-toggle
                        :model-value="
                          form.christmasSalaryRule.defaultIncludeOnTermination
                        "
                        label="Incluir por defecto en desvinculación"
                        color="primary"
                        :disable="readOnly"
                        @update:model-value="
                          updateNestedField(
                            'christmasSalaryRule',
                            'defaultIncludeOnTermination',
                            $event,
                          )
                        "
                      />
                    </div>

                    <div class="col-12">
                      <div class="field-label required">Modo de cálculo</div>
                      <q-select
                        :model-value="form.christmasSalaryRule.calculationMode"
                        outlined
                        dense
                        rounded
                        emit-value
                        map-options
                        color="primary"
                        :readonly="readOnly"
                        :options="christmasCalculationOptions"
                        @update:model-value="
                          updateNestedField(
                            'christmasSalaryRule',
                            'calculationMode',
                            $event,
                          )
                        "
                      />
                    </div>

                    <div class="col-12">
                      <div class="field-label required">Fuente de acumulado</div>
                      <q-select
                        :model-value="form.christmasSalaryRule.accrualSource"
                        outlined
                        dense
                        rounded
                        emit-value
                        map-options
                        color="primary"
                        :readonly="readOnly"
                        :options="accrualSourceOptions"
                        @update:model-value="
                          updateNestedField(
                            'christmasSalaryRule',
                            'accrualSource',
                            $event,
                          )
                        "
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="field-label">Meses mínimos para pagar</div>
                      <q-input
                        :model-value="
                          form.christmasSalaryRule.minimumWorkedMonthsToPay
                        "
                        outlined
                        dense
                        rounded
                        type="number"
                        color="primary"
                        :readonly="readOnly"
                        @update:model-value="
                          updateNestedField(
                            'christmasSalaryRule',
                            'minimumWorkedMonthsToPay',
                            normalizeNumber($event),
                          )
                        "
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="field-label">Meses de prueba</div>
                      <q-input
                        :model-value="form.christmasSalaryRule.probationMonths"
                        outlined
                        dense
                        rounded
                        type="number"
                        color="primary"
                        :readonly="readOnly"
                        @update:model-value="
                          updateNestedField(
                            'christmasSalaryRule',
                            'probationMonths',
                            normalizeNumber($event),
                          )
                        "
                      />
                    </div>

                    <div class="col-12">
                      <q-toggle
                        :model-value="
                          form.christmasSalaryRule.allowExcludeBeforeProbationEnds
                        "
                        label="Permitir excluir si termina antes del período de prueba"
                        color="warning"
                        :disable="readOnly"
                        @update:model-value="
                          updateNestedField(
                            'christmasSalaryRule',
                            'allowExcludeBeforeProbationEnds',
                            $event,
                          )
                        "
                      />
                    </div>

                    <div class="col-12">
                      <q-toggle
                        :model-value="
                          form.christmasSalaryRule.allowManualOverride
                        "
                        label="Permitir override manual"
                        color="primary"
                        :disable="readOnly"
                        @update:model-value="
                          updateNestedField(
                            'christmasSalaryRule',
                            'allowManualOverride',
                            $event,
                          )
                        "
                      />
                    </div>

                    <div class="col-12">
                      <div class="field-label">Notas</div>
                      <q-input
                        :model-value="form.christmasSalaryRule.notes"
                        outlined
                        dense
                        rounded
                        type="textarea"
                        autogrow
                        color="primary"
                        :readonly="readOnly"
                        @update:model-value="
                          updateNestedField('christmasSalaryRule', 'notes', $event)
                        "
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-lg-6">
                <div class="section-card full-height">
                  <div class="section-card-header">
                    <q-avatar color="green-1" text-color="positive" size="38px">
                      <q-icon name="beach_access" />
                    </q-avatar>

                    <div>
                      <div class="section-card-title">Vacaciones</div>
                      <div class="section-card-subtitle">
                        Fuente y comportamiento del cálculo de vacaciones.
                      </div>
                    </div>
                  </div>

                  <div class="row q-col-gutter-md q-mt-sm">
                    <div class="col-12">
                      <q-card flat bordered class="switch-card">
                        <div>
                          <div class="text-subtitle2 text-weight-bold">
                            Habilitar cálculo de vacaciones
                          </div>
                          <div class="text-caption text-grey-7">
                            Usa el balance del módulo de vacaciones o acumulados.
                          </div>
                        </div>

                        <q-toggle
                          :model-value="form.vacationRule.enabled"
                          color="positive"
                          :disable="readOnly"
                          @update:model-value="
                            updateNestedField('vacationRule', 'enabled', $event)
                          "
                        />
                      </q-card>
                    </div>

                    <div class="col-12">
                      <q-toggle
                        :model-value="form.vacationRule.defaultIncludeOnTermination"
                        label="Incluir por defecto en desvinculación"
                        color="primary"
                        :disable="readOnly"
                        @update:model-value="
                          updateNestedField(
                            'vacationRule',
                            'defaultIncludeOnTermination',
                            $event,
                          )
                        "
                      />
                    </div>

                    <div class="col-12">
                      <div class="field-label required">Modo de cálculo</div>
                      <q-select
                        :model-value="form.vacationRule.calculationMode"
                        outlined
                        dense
                        rounded
                        emit-value
                        map-options
                        color="primary"
                        :readonly="readOnly"
                        :options="vacationCalculationOptions"
                        @update:model-value="
                          updateNestedField('vacationRule', 'calculationMode', $event)
                        "
                      />
                    </div>

                    <div class="col-12">
                      <q-toggle
                        :model-value="form.vacationRule.allowManualOverride"
                        label="Permitir override manual"
                        color="primary"
                        :disable="readOnly"
                        @update:model-value="
                          updateNestedField('vacationRule', 'allowManualOverride', $event)
                        "
                      />
                    </div>

                    <div class="col-12">
                      <div class="field-label">Notas</div>
                      <q-input
                        :model-value="form.vacationRule.notes"
                        outlined
                        dense
                        rounded
                        type="textarea"
                        autogrow
                        color="primary"
                        :readonly="readOnly"
                        @update:model-value="
                          updateNestedField('vacationRule', 'notes', $event)
                        "
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="types" class="q-pa-none">
            <div class="section-card">
              <div class="section-card-header">
                <q-avatar color="purple-1" text-color="purple-10" size="38px">
                  <q-icon name="rule" />
                </q-avatar>

                <div>
                  <div class="section-card-title">
                    Reglas por tipo de desvinculación
                  </div>
                  <div class="section-card-subtitle">
                    Define qué conceptos aplican según el tipo de salida.
                  </div>
                </div>

                <q-space />

                <q-btn
                  v-if="!readOnly"
                  unelevated
                  rounded
                  no-caps
                  color="primary"
                  icon="add"
                  label="Agregar tipo"
                  @click="addTerminationTypeRule"
                />
              </div>

              <div class="q-mt-md">
                <q-expansion-item
                  v-for="(item, index) in form.terminationTypeRules"
                  :key="`type-${index}`"
                  class="type-expansion"
                  expand-separator
                  :label="item.label || item.code || 'Tipo de desvinculación'"
                  :caption="item.code"
                  icon="rule"
                >
                  <q-card flat class="q-pa-md">
                    <div class="row q-col-gutter-md">
                      <div class="col-12 col-md-4">
                        <div class="field-label required">Código</div>
                        <q-select
                          :model-value="item.code"
                          outlined
                          dense
                          rounded
                          emit-value
                          map-options
                          :readonly="readOnly"
                          :options="terminationTypeOptions"
                          @update:model-value="
                            updateArrayField('terminationTypeRules', index, 'code', $event)
                          "
                        />
                      </div>

                      <div class="col-12 col-md-4">
                        <div class="field-label required">Nombre visible</div>
                        <q-input
                          :model-value="item.label"
                          outlined
                          dense
                          rounded
                          :readonly="readOnly"
                          @update:model-value="
                            updateArrayField('terminationTypeRules', index, 'label', $event)
                          "
                        />
                      </div>

                      <div class="col-12 col-md-4">
                        <q-card flat bordered class="switch-card compact">
                          <div>
                            <div class="text-subtitle2 text-weight-bold">
                              Activo
                            </div>
                            <div class="text-caption text-grey-7">
                              Disponible para crear desvinculaciones.
                            </div>
                          </div>

                          <q-toggle
                            :model-value="item.isActive"
                            color="positive"
                            :disable="readOnly"
                            @update:model-value="
                              updateArrayField('terminationTypeRules', index, 'isActive', $event)
                            "
                          />
                        </q-card>
                      </div>

                      <div class="col-12">
                        <div class="field-label">Descripción</div>
                        <q-input
                          :model-value="item.description"
                          outlined
                          dense
                          rounded
                          :readonly="readOnly"
                          @update:model-value="
                            updateArrayField('terminationTypeRules', index, 'description', $event)
                          "
                        />
                      </div>

                      <div class="col-12">
                        <q-separator class="q-my-sm" />
                      </div>

                      <div class="col-12">
                        <div class="text-subtitle2 text-weight-bold q-mb-sm">
                          Conceptos incluidos
                        </div>

                        <div class="row q-col-gutter-sm">
                          <div
                            v-for="field in includedConceptFields"
                            :key="field.name"
                            class="col-12 col-sm-6 col-md-4"
                          >
                            <q-toggle
                              :model-value="item[field.name]"
                              :label="field.label"
                              :disable="readOnly"
                              @update:model-value="
                                updateArrayField('terminationTypeRules', index, field.name, $event)
                              "
                            />
                          </div>
                        </div>
                      </div>

                      <div class="col-12">
                        <q-separator class="q-my-sm" />
                      </div>

                      <div class="col-12">
                        <div class="text-subtitle2 text-weight-bold q-mb-sm">
                          Reglas adicionales
                        </div>

                        <div class="row q-col-gutter-sm">
                          <div
                            v-for="field in additionalRuleFields"
                            :key="field.name"
                            class="col-12 col-sm-6 col-md-4"
                          >
                            <q-toggle
                              :model-value="item[field.name]"
                              :label="field.label"
                              :disable="readOnly"
                              @update:model-value="
                                updateArrayField('terminationTypeRules', index, field.name, $event)
                              "
                            />
                          </div>
                        </div>
                      </div>

                      <div v-if="!readOnly" class="col-12 text-right">
                        <q-btn
                          flat
                          rounded
                          no-caps
                          color="negative"
                          icon="delete"
                          label="Eliminar tipo"
                          @click="removeArrayItem('terminationTypeRules', index)"
                        />
                      </div>
                    </div>
                  </q-card>
                </q-expansion-item>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="manual" class="q-pa-none">
            <div class="section-card">
              <div class="section-card-header">
                <q-avatar color="blue-grey-1" text-color="blue-grey-10" size="38px">
                  <q-icon name="tune" />
                </q-avatar>

                <div>
                  <div class="section-card-title">Ajustes manuales</div>
                  <div class="section-card-subtitle">
                    Permite agregar bonos, pagos adicionales o deducciones.
                  </div>
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-6">
                  <q-card flat bordered class="switch-card">
                    <div>
                      <div class="text-subtitle2 text-weight-bold">
                        Permitir pagos adicionales
                      </div>
                      <div class="text-caption text-grey-7">
                        Bonos, comisiones, incentivos u otros ingresos.
                      </div>
                    </div>

                    <q-toggle
                      :model-value="form.manualAdjustmentRules.allowManualEarnings"
                      color="positive"
                      :disable="readOnly"
                      @update:model-value="
                        updateNestedField('manualAdjustmentRules', 'allowManualEarnings', $event)
                      "
                    />
                  </q-card>
                </div>

                <div class="col-12 col-md-6">
                  <q-card flat bordered class="switch-card">
                    <div>
                      <div class="text-subtitle2 text-weight-bold">
                        Permitir deducciones
                      </div>
                      <div class="text-caption text-grey-7">
                        Préstamos, avances, equipos u otros descuentos.
                      </div>
                    </div>

                    <q-toggle
                      :model-value="form.manualAdjustmentRules.allowManualDeductions"
                      color="negative"
                      :disable="readOnly"
                      @update:model-value="
                        updateNestedField('manualAdjustmentRules', 'allowManualDeductions', $event)
                      "
                    />
                  </q-card>
                </div>

                <div class="col-12 col-md-6">
                  <q-toggle
                    :model-value="
                      form.manualAdjustmentRules.requireReasonForManualAdjustment
                    "
                    label="Requerir razón en ajustes"
                    color="primary"
                    :disable="readOnly"
                    @update:model-value="
                      updateNestedField(
                        'manualAdjustmentRules',
                        'requireReasonForManualAdjustment',
                        $event,
                      )
                    "
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-toggle
                    :model-value="
                      form.manualAdjustmentRules.requireApprovalForManualAdjustment
                    "
                    label="Requerir aprobación en ajustes"
                    color="primary"
                    :disable="readOnly"
                    @update:model-value="
                      updateNestedField(
                        'manualAdjustmentRules',
                        'requireApprovalForManualAdjustment',
                        $event,
                      )
                    "
                  />
                </div>

                <div class="col-12 col-md-6">
                  <div class="field-label">Códigos de ingresos permitidos</div>
                  <q-select
                    :model-value="form.manualAdjustmentRules.allowedEarningCodes"
                    outlined
                    dense
                    rounded
                    multiple
                    use-chips
                    color="primary"
                    :readonly="readOnly"
                    :options="earningCodeOptions"
                    @update:model-value="
                      updateNestedField('manualAdjustmentRules', 'allowedEarningCodes', $event)
                    "
                  />
                </div>

                <div class="col-12 col-md-6">
                  <div class="field-label">Códigos de deducciones permitidos</div>
                  <q-select
                    :model-value="form.manualAdjustmentRules.allowedDeductionCodes"
                    outlined
                    dense
                    rounded
                    multiple
                    use-chips
                    color="primary"
                    :readonly="readOnly"
                    :options="deductionCodeOptions"
                    @update:model-value="
                      updateNestedField('manualAdjustmentRules', 'allowedDeductionCodes', $event)
                    "
                  />
                </div>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          rounded
          no-caps
          color="negative"
          icon="cancel"
          :label="readOnly ? 'Cerrar' : 'Cancelar'"
          :disable="saving"
          @click="emit('update:modelValue', false)"
        />

        <q-btn
          v-if="!readOnly"
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
import { computed, ref } from "vue";

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

  readOnly: {
    type: Boolean,
    default: false,
  },

  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "update:form", "save"]);

const tab = ref("general");

const dialogTitle = computed(() => {
  if (props.readOnly) return "Detalle de política";
  return props.isEdit ? "Editar política" : "Nueva política";
});

const salaryBaseOptions = [
  {
    label: "Promedio últimos 12 meses ordinarios",
    value: "AVERAGE_LAST_12_MONTHS_ORDINARY",
  },
  { label: "Salario actual", value: "CURRENT_SALARY" },
  { label: "Último salario", value: "LAST_SALARY" },
  { label: "Manual", value: "MANUAL" },
];

const roundingOptions = [
  { label: "Sin redondeo", value: "NONE" },
  { label: "2 decimales", value: "ROUND_2_DECIMALS" },
  { label: "Redondear hacia arriba", value: "ROUND_UP" },
  { label: "Redondear hacia abajo", value: "ROUND_DOWN" },
];

const severanceModeOptions = [
  { label: "Días fijos", value: "FIXED" },
  { label: "Días por año", value: "PER_YEAR" },
];

const christmasCalculationOptions = [
  {
    label: "Salario ordinario devengado en el año / 12",
    value: "ORDINARY_SALARY_EARNED_YEAR_TO_DATE_DIVIDED_BY_12",
  },
  { label: "Desde acumulado de nómina", value: "PAYROLL_ACCRUAL" },
  { label: "Manual", value: "MANUAL" },
];

const accrualSourceOptions = [
  { label: "Acumulado de nómina", value: "PAYROLL_ACCRUAL" },
  { label: "Historial de nómina", value: "PAYROLL_HISTORY" },
  { label: "Manual", value: "MANUAL" },
];

const vacationCalculationOptions = [
  { label: "Módulo de vacaciones", value: "VACATION_MODULE" },
  { label: "Acumulado de nómina", value: "PAYROLL_ACCRUAL" },
  { label: "Manual", value: "MANUAL" },
];

const terminationTypeOptions = [
  { label: "Desahucio por empleador", value: "EMPLOYER_DESAHUCIO" },
  { label: "Renuncia del empleado", value: "EMPLOYEE_RESIGNATION" },
  { label: "Despido justificado", value: "EMPLOYER_JUSTIFIED_DISMISSAL" },
  { label: "Despido injustificado", value: "EMPLOYER_UNJUSTIFIED_DISMISSAL" },
  { label: "Dimisión justificada", value: "EMPLOYEE_JUSTIFIED_RESIGNATION" },
  { label: "Dimisión injustificada", value: "EMPLOYEE_UNJUSTIFIED_RESIGNATION" },
  { label: "Mutuo acuerdo", value: "MUTUAL_AGREEMENT" },
  { label: "Fin de contrato", value: "CONTRACT_END" },
  { label: "Muerte o discapacidad", value: "DEATH_OR_DISABILITY" },
  { label: "Cierre de empresa", value: "COMPANY_CLOSURE" },
  { label: "Retiro", value: "RETIREMENT" },
  { label: "Otro", value: "OTHER" },
];

const earningCodeOptions = [
  "BONUS",
  "COMMISSION",
  "INCENTIVE",
  "PENDING_PAYMENT",
  "MANUAL_ADJUSTMENT",
  "OTHER_EARNING",
];

const deductionCodeOptions = [
  "EMPLOYEE_LOAN",
  "SALARY_ADVANCE",
  "EQUIPMENT_DEDUCTION",
  "ABSENCE_DEDUCTION",
  "MANUAL_DEDUCTION",
  "OTHER_DEDUCTION",
];

const includedConceptFields = [
  { name: "includePendingSalary", label: "Salario pendiente" },
  { name: "includeSeverance", label: "Cesantía" },
  { name: "includePreNotice", label: "Preaviso" },
  { name: "includeVacation", label: "Vacaciones" },
  { name: "includeChristmasSalary", label: "Regalía" },
  { name: "includeEconomicAssistance", label: "Asistencia económica" },
];

const additionalRuleFields = [
  { name: "allowManualEarnings", label: "Permitir ingresos manuales" },
  { name: "allowManualDeductions", label: "Permitir deducciones manuales" },
  {
    name: "deductPreNoticeIfEmployeeDidNotNotify",
    label: "Descontar preaviso si no notificó",
  },
  { name: "requiresReason", label: "Requiere razón" },
  { name: "requiresDocument", label: "Requiere documento" },
  { name: "requiresApproval", label: "Requiere aprobación" },
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
  if (value === "" || value === null || value === undefined) return 0;
  return Number(value);
};

const normalizeNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
};

const updateForm = (newForm) => {
  emit("update:form", newForm);
};

const updateField = (field, value) => {
  updateForm({
    ...props.form,
    [field]: value,
  });
};

const updateNestedField = (section, field, value) => {
  updateForm({
    ...props.form,
    [section]: {
      ...(props.form[section] || {}),
      [field]: value,
    },
  });
};

const updateArrayField = (arrayName, index, field, value) => {
  const list = [...(props.form[arrayName] || [])];

  list[index] = {
    ...list[index],
    [field]: value,
  };

  updateForm({
    ...props.form,
    [arrayName]: list,
  });
};

const removeArrayItem = (arrayName, index) => {
  const list = [...(props.form[arrayName] || [])];

  list.splice(index, 1);

  updateForm({
    ...props.form,
    [arrayName]: list,
  });
};

const addPreNoticeBracket = () => {
  updateForm({
    ...props.form,
    preNoticeBrackets: [
      ...(props.form.preNoticeBrackets || []),
      {
        fromMonths: 0,
        toMonths: null,
        days: 0,
        label: "",
      },
    ],
  });
};

const addSeveranceBracket = () => {
  updateForm({
    ...props.form,
    severanceBrackets: [
      ...(props.form.severanceBrackets || []),
      {
        fromMonths: 0,
        toMonths: null,
        days: 0,
        mode: "FIXED",
        label: "",
      },
    ],
  });
};

const addTerminationTypeRule = () => {
  updateForm({
    ...props.form,
    terminationTypeRules: [
      ...(props.form.terminationTypeRules || []),
      {
        code: "OTHER",
        label: "Otro",
        description: "",
        includePendingSalary: true,
        includeSeverance: false,
        includePreNotice: false,
        includeVacation: true,
        includeChristmasSalary: true,
        includeEconomicAssistance: false,
        allowManualEarnings: true,
        allowManualDeductions: true,
        deductPreNoticeIfEmployeeDidNotNotify: false,
        requiresReason: true,
        requiresDocument: false,
        requiresApproval: true,
        isActive: true,
      },
    ],
  });
};

const isInvalidNumber = (value) => {
  return value === null || value === undefined || Number(value) < 0;
};

const saveDisabled = computed(() => {
  return (
    props.saving ||
    props.readOnly ||
    isInvalidNumber(props.form.year) ||
    isInvalidNumber(props.form.version) ||
    isInvalidNumber(props.form.dailySalaryDivisor) ||
    !props.form.effectiveFrom ||
    !props.form.salaryBaseMode ||
    !props.form.roundingMode ||
    !Array.isArray(props.form.preNoticeBrackets) ||
    !Array.isArray(props.form.severanceBrackets) ||
    !Array.isArray(props.form.terminationTypeRules)
  );
});
</script>

<style scoped>
.policy-dialog {
  width: 1180px;
  max-width: 98vw;
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

.tabs-wrap {
  padding: 0;
}

.dialog-body {
  max-height: calc(92vh - 206px);
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
  min-height: 56px;
}

.rounded-banner {
  border-radius: 16px;
}

.array-row {
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 14px;
  margin-bottom: 12px;
}

.type-expansion {
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  margin-bottom: 12px;
  overflow: hidden;
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
    width: 98vw;
  }

  .switch-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .section-card-header {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>