<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="termination-dialog">
      <q-inner-loading
        :showing="isBusy"
        :label="loadingLabel"
        label-class="text-primary"
        label-style="font-size: 1.1em"
      />

      <q-card-section
        class="dialog-header bg-negative row items-center justify-between"
      >
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon name="person_remove" size="30px" />
          </div>

          <div>
            <div class="dialog-title">Desvincular empleado</div>

            <div class="dialog-subtitle">
              Calcula prestaciones, derechos adquiridos, pagos adicionales y
              deducciones.
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          color="white"
          icon="close"
          :disable="isBusy"
          @click="closeDialog"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="dialog-body">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-banner class="bg-red-1 text-negative rounded-banner">
              <template #avatar>
                <q-icon name="warning" color="negative" />
              </template>

              Esta acción no inactiva al empleado inmediatamente. Primero se
              crea la desvinculación en estado calculado. Luego RRHH puede
              aprobarla y pagarla desde el módulo de desvinculaciones.
            </q-banner>
          </div>

          <!-- Política -->

          <div v-if="policyError" class="col-12">
            <q-banner class="bg-orange-1 text-orange-10 rounded-banner">
              <template #avatar>
                <q-icon name="error" color="orange-10" />
              </template>

              {{ policyError }}

              <template #action>
                <q-btn
                  flat
                  dense
                  no-caps
                  color="orange-10"
                  icon="refresh"
                  label="Reintentar"
                  :loading="policyLoading"
                  @click="loadActivePolicy"
                />
              </template>
            </q-banner>
          </div>

          <div v-if="activePolicy" class="col-12">
            <q-banner class="bg-blue-1 text-primary rounded-banner">
              <template #avatar>
                <q-icon name="policy" color="primary" />
              </template>

              <div class="text-weight-bold">
                Política activa:
                {{
                  activePolicy.name ||
                  activePolicy.code ||
                  "Política de desvinculación"
                }}
              </div>

              <div class="text-caption">
                Versión {{ activePolicy.version || 1 }} · Año
                {{ activePolicy.year || "" }}

                <span v-if="activePolicy.effectiveFrom">
                  · Vigente desde
                  {{ formatDate(activePolicy.effectiveFrom) }}
                </span>
              </div>
            </q-banner>
          </div>

          <!-- Empleado -->

          <div class="col-12">
            <div class="section-card">
              <div class="section-card-header">
                <q-avatar color="blue-1" text-color="primary" size="42px">
                  <q-icon name="badge" />
                </q-avatar>

                <div>
                  <div class="section-card-title">Empleado seleccionado</div>

                  <div class="section-card-subtitle">
                    Información base usada para calcular la desvinculación.
                  </div>
                </div>
              </div>

              <div class="employee-summary q-mt-md">
                <q-avatar size="54px" class="employee-avatar">
                  <q-img
                    v-if="employee?.img"
                    :src="employee.img"
                    fit="cover"
                    spinner-color="primary"
                  />

                  <span v-else>
                    {{ getInitials(employee?.name) }}
                  </span>
                </q-avatar>

                <div class="employee-summary-info">
                  <div class="employee-name">
                    {{ employee?.name || "Empleado sin nombre" }}
                  </div>

                  <div class="text-caption text-grey-7">
                    {{ employee?.email || "Sin correo" }}
                  </div>

                  <div class="row q-gutter-xs q-mt-xs">
                    <q-chip
                      dense
                      color="blue-1"
                      text-color="primary"
                      icon="business"
                    >
                      {{ getCompanyName(employee?.company) }}
                    </q-chip>

                    <q-chip
                      dense
                      color="green-1"
                      text-color="positive"
                      icon="work"
                    >
                    {{ employee }}
                      {{
                        employee?.jobPosition?.name || "Puesto no definido"
                      }}
                    </q-chip>

                    <q-chip
                      dense
                      color="orange-1"
                      text-color="orange-10"
                      icon="event"
                    >
                      Contratado:
                      {{ formatDate(employee?.hiringDate) || "Sin fecha" }}
                    </q-chip>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error consultando préstamos -->

          <div v-if="loanError" class="col-12">
            <q-banner class="bg-orange-1 text-orange-10 rounded-banner">
              <template #avatar>
                <q-icon name="account_balance_wallet" color="orange-10" />
              </template>

              <div class="text-weight-bold">
                No se pudieron consultar los préstamos del empleado.
              </div>

              <div class="text-caption">
                {{ loanError }}
              </div>

              <template #action>
                <q-btn
                  flat
                  dense
                  no-caps
                  color="orange-10"
                  icon="refresh"
                  label="Reintentar"
                  :loading="loanLoading"
                  @click="loadLoanSummary"
                />
              </template>
            </q-banner>
          </div>

          <!-- Préstamos activos -->

          <div
            v-if="loanSummary?.hasActiveLoans"
            class="col-12"
          >
            <div class="section-card loan-summary-card">
              <div class="section-card-header">
                <q-avatar
                  color="orange-1"
                  text-color="orange-10"
                  size="42px"
                >
                  <q-icon name="account_balance_wallet" />
                </q-avatar>

                <div>
                  <div class="section-card-title">
                    Préstamos activos detectados
                  </div>

                  <div class="section-card-subtitle">
                    El saldo pendiente se descontará automáticamente de la
                    liquidación hasta el monto disponible.
                  </div>
                </div>

                <q-space />

                <q-badge
                  rounded
                  color="orange-10"
                  class="loan-count-badge"
                  :label="`${getNumber(
                    loanSummary.totalLoans,
                  )} préstamo(s)`"
                />
              </div>

              <div class="row q-col-gutter-md q-mt-md">
                <div class="col-6 col-md-3">
                  <div class="loan-metric">
                    <div class="loan-metric-label">
                      Capital pendiente
                    </div>

                    <div class="loan-metric-value">
                      {{
                        money(
                          loanSummary.totalPrincipalOutstanding,
                        )
                      }}
                    </div>
                  </div>
                </div>

                <div class="col-6 col-md-3">
                  <div class="loan-metric">
                    <div class="loan-metric-label">
                      Intereses pendientes
                    </div>

                    <div class="loan-metric-value">
                      {{
                        money(
                          loanSummary.totalInterestOutstanding,
                        )
                      }}
                    </div>
                  </div>
                </div>

                <div class="col-6 col-md-3">
                  <div class="loan-metric">
                    <div class="loan-metric-label">
                      Saldo total pendiente
                    </div>

                    <div class="loan-metric-value text-negative">
                      {{ money(loanSummary.totalOutstanding) }}
                    </div>
                  </div>
                </div>

                <div class="col-6 col-md-3">
                  <div class="loan-metric">
                    <div class="loan-metric-label">
                      Cuotas pendientes
                    </div>

                    <div class="loan-metric-value">
                      {{
                        getNumber(
                          loanSummary.totalPendingInstallments,
                        )
                      }}
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="Number(loanSummary.totalGuaranteedDays || 0) > 0"
                class="q-mt-md"
              >
                <q-chip
                  dense
                  color="blue-1"
                  text-color="primary"
                  icon="event_available"
                >
                  Días utilizados como garantía:
                  {{ getNumber(loanSummary.totalGuaranteedDays) }}
                </q-chip>
              </div>

              <q-expansion-item
                v-if="loanSummary.loans?.length"
                class="q-mt-md loan-expansion"
                icon="list_alt"
                label="Ver detalle de préstamos"
                header-class="text-weight-bold"
              >
                <q-list separator>
                  <q-item
                    v-for="(loan, index) in loanSummary.loans"
                    :key="getLoanKey(loan, index)"
                    class="loan-list-item"
                  >
                    <q-item-section avatar>
                      <q-avatar
                        color="orange-1"
                        text-color="orange-10"
                        icon="request_quote"
                      />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-weight-bold">
                        {{
                          loan.requestNumber ||
                          `Préstamo ${index + 1}`
                        }}
                      </q-item-label>

                      <q-item-label caption>
                        {{
                          loan.productName ||
                          loan.productCode ||
                          "Producto no especificado"
                        }}
                      </q-item-label>

                      <q-item-label caption>
                        Cuotas pendientes:
                        {{ getNumber(loan.pendingInstallments) }}
                        · Días garantizados:
                        {{ getNumber(loan.guaranteedDays) }}
                      </q-item-label>

                      <q-item-label
                        v-if="loan.calculationSource"
                        caption
                      >
                        Fuente del saldo:
                        {{ getLoanSourceLabel(loan.calculationSource) }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side top>
                      <div class="text-caption text-grey-7">
                        Saldo pendiente
                      </div>

                      <div class="text-weight-bold text-negative">
                        {{ money(loan.totalOutstanding) }}
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </div>
          </div>

          <!-- Sin préstamos -->

          <div
            v-else-if="
              loanSummary &&
              !loanLoading &&
              !loanError
            "
            class="col-12"
          >
            <q-banner class="bg-green-1 text-positive rounded-banner">
              <template #avatar>
                <q-icon name="check_circle" color="positive" />
              </template>

              El empleado no tiene préstamos activos con balance pendiente.
            </q-banner>
          </div>

          <!-- Tabs -->

          <div class="col-12">
            <q-tabs
              v-model="tab"
              dense
              active-color="primary"
              indicator-color="primary"
              align="left"
              narrow-indicator
              class="tabs-bar"
            >
              <q-tab name="general" icon="assignment" label="Datos" />

              <q-tab
                name="adjustments"
                icon="tune"
                label="Ajustes"
              />

              <q-tab
                name="preview"
                icon="receipt_long"
                label="Cálculo"
              />
            </q-tabs>
          </div>

          <div class="col-12">
            <q-tab-panels
              v-model="tab"
              animated
              class="bg-transparent"
            >
              <!-- Datos generales -->

              <q-tab-panel name="general" class="q-pa-none">
                <div class="section-card">
                  <div class="section-card-header">
                    <q-avatar
                      color="purple-1"
                      text-color="purple-10"
                      size="42px"
                    >
                      <q-icon name="assignment" />
                    </q-avatar>

                    <div>
                      <div class="section-card-title">
                        Datos de la desvinculación
                      </div>

                      <div class="section-card-subtitle">
                        Tipo, fecha de salida, razón y configuración del
                        preaviso.
                      </div>
                    </div>
                  </div>

                  <div class="row q-col-gutter-md q-mt-md">
                    <div class="col-12 col-md-6">
                      <div class="field-label required">
                        Tipo de desvinculación
                      </div>

                      <q-select
                        v-model="form.terminationType"
                        outlined
                        dense
                        rounded
                        color="primary"
                        emit-value
                        map-options
                        label="Selecciona el tipo"
                        :options="terminationTypeOptions"
                        :loading="policyLoading"
                        :disable="
                          policyLoading ||
                          !terminationTypeOptions.length
                        "
                      >
                        <template #no-option>
                          <q-item>
                            <q-item-section class="text-grey">
                              No hay tipos activos en la política.
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-select>
                    </div>

                    <div class="col-12 col-md-3">
                      <div class="field-label required">
                        Fecha de salida
                      </div>

                      <q-input
                        v-model="form.terminationDate"
                        outlined
                        dense
                        rounded
                        color="primary"
                        type="date"
                      />
                    </div>

                    <div class="col-12 col-md-3">
                      <div class="field-label">
                        Salario pendiente
                      </div>

                      <q-input
                        v-model.number="form.pendingSalaryAmount"
                        outlined
                        dense
                        rounded
                        color="primary"
                        type="number"
                        min="0"
                        prefix="RD$"
                        label="0.00"
                      />
                    </div>

                    <div
                      v-if="selectedTerminationRule"
                      class="col-12"
                    >
                      <div class="rule-summary">
                        <div class="row q-col-gutter-md items-start">
                          <div class="col-12 col-md-4">
                            <div class="text-caption text-grey-7">
                              Regla seleccionada
                            </div>

                            <div
                              class="text-subtitle2 text-weight-bold text-primary"
                            >
                              {{
                                selectedTerminationRule.label ||
                                selectedTerminationRule.code
                              }}
                            </div>

                            <div class="text-caption text-grey-7">
                              Código:
                              {{ selectedTerminationRule.code }}
                            </div>
                          </div>

                          <div class="col-12 col-md-8">
                            <div class="rule-chip-grid">
                              <q-chip
                                dense
                                :color="
                                  ruleIncludes('includeSeverance')
                                    ? 'green-1'
                                    : 'grey-3'
                                "
                                :text-color="
                                  ruleIncludes('includeSeverance')
                                    ? 'positive'
                                    : 'grey-8'
                                "
                              >
                                Cesantía:
                                {{ ruleText("includeSeverance") }}
                              </q-chip>

                              <q-chip
                                dense
                                :color="
                                  ruleIncludes('includePreNotice')
                                    ? 'green-1'
                                    : 'grey-3'
                                "
                                :text-color="
                                  ruleIncludes('includePreNotice')
                                    ? 'positive'
                                    : 'grey-8'
                                "
                              >
                                Preaviso:
                                {{ ruleText("includePreNotice") }}
                              </q-chip>

                              <q-chip
                                dense
                                :color="
                                  ruleIncludes('includeVacation')
                                    ? 'green-1'
                                    : 'grey-3'
                                "
                                :text-color="
                                  ruleIncludes('includeVacation')
                                    ? 'positive'
                                    : 'grey-8'
                                "
                              >
                                Vacaciones:
                                {{ ruleText("includeVacation") }}
                              </q-chip>

                              <q-chip
                                dense
                                :color="
                                  ruleIncludes(
                                    'includeChristmasSalary',
                                  )
                                    ? 'green-1'
                                    : 'grey-3'
                                "
                                :text-color="
                                  ruleIncludes(
                                    'includeChristmasSalary',
                                  )
                                    ? 'positive'
                                    : 'grey-8'
                                "
                              >
                                Regalía:
                                {{
                                  ruleText(
                                    "includeChristmasSalary",
                                  )
                                }}
                              </q-chip>

                              <q-chip
                                dense
                                :color="
                                  canAddManualEarnings
                                    ? 'blue-1'
                                    : 'grey-3'
                                "
                                :text-color="
                                  canAddManualEarnings
                                    ? 'primary'
                                    : 'grey-8'
                                "
                              >
                                Ingresos manuales:
                                {{
                                  canAddManualEarnings
                                    ? "Permitidos"
                                    : "No permitidos"
                                }}
                              </q-chip>

                              <q-chip
                                dense
                                :color="
                                  canAddManualDeductions
                                    ? 'red-1'
                                    : 'grey-3'
                                "
                                :text-color="
                                  canAddManualDeductions
                                    ? 'negative'
                                    : 'grey-8'
                                "
                              >
                                Deducciones manuales:
                                {{
                                  canAddManualDeductions
                                    ? "Permitidas"
                                    : "No permitidas"
                                }}
                              </q-chip>
                            </div>
                          </div>

                          <div
                            v-if="
                              selectedTerminationRule.description
                            "
                            class="col-12"
                          >
                            <div class="text-caption text-grey-7">
                              {{
                                selectedTerminationRule.description
                              }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-12">
                      <div
                        class="field-label"
                        :class="{
                          required:
                            selectedTerminationRule?.requiresReason,
                        }"
                      >
                        Razón / comentario
                      </div>

                      <q-input
                        v-model="form.reason"
                        outlined
                        dense
                        rounded
                        color="primary"
                        type="textarea"
                        autogrow
                        label="Describe la razón de la desvinculación"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-card flat bordered class="switch-card">
                        <div>
                          <div class="text-subtitle2 text-weight-bold">
                            ¿El empleado fue preavisado?
                          </div>

                          <div class="text-caption text-grey-7">
                            Si no fue preavisado, el sistema puede calcular
                            preaviso según la política.
                          </div>
                        </div>

                        <q-toggle
                          v-model="form.noticeGiven"
                          color="primary"
                          checked-icon="check"
                          unchecked-icon="close"
                        />
                      </q-card>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="field-label">
                        Fecha de preaviso
                      </div>

                      <q-input
                        v-model="form.noticeDate"
                        outlined
                        dense
                        rounded
                        color="primary"
                        type="date"
                        :disable="!form.noticeGiven"
                        clearable
                      />
                    </div>
                  </div>
                </div>

                <div class="section-card q-mt-md">
                  <div class="section-card-header">
                    <q-avatar
                      color="blue-grey-1"
                      text-color="blue-grey-10"
                      size="42px"
                    >
                      <q-icon name="rule" />
                    </q-avatar>

                    <div>
                      <div class="section-card-title">
                        Overrides opcionales
                      </div>

                      <div class="section-card-subtitle">
                        Déjalo en “Según política” para respetar la regla
                        seleccionada.
                      </div>
                    </div>
                  </div>

                  <div class="row q-col-gutter-md q-mt-md">
                    <div
                      v-for="item in overrideFields"
                      :key="item.field"
                      class="col-12 col-md-4"
                    >
                      <div class="field-label">
                        {{ item.label }}
                      </div>

                      <q-select
                        :model-value="
                          form.includeOverrides[item.field]
                        "
                        outlined
                        dense
                        rounded
                        color="primary"
                        emit-value
                        map-options
                        clearable
                        :options="overrideOptions"
                        label="Según política"
                        @update:model-value="
                          form.includeOverrides[item.field] =
                            $event
                        "
                      />

                      <div class="text-caption text-grey-7 q-mt-xs">
                        Regla:

                        <span class="text-weight-bold">
                          {{
                            getRuleBaseText(item.ruleField)
                          }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Ajustes -->

              <q-tab-panel name="adjustments" class="q-pa-none">
                <div class="section-card">
                  <div class="section-card-header">
                    <q-avatar
                      color="green-1"
                      text-color="positive"
                      size="42px"
                    >
                      <q-icon name="add_card" />
                    </q-avatar>

                    <div>
                      <div class="section-card-title">
                        Pagos adicionales y deducciones
                      </div>

                      <div class="section-card-subtitle">
                        Los códigos permitidos vienen desde la política
                        activa. Los préstamos se calculan
                        automáticamente.
                      </div>
                    </div>

                    <q-space />

                    <q-btn
                      unelevated
                      rounded
                      no-caps
                      color="positive"
                      icon="add"
                      label="Pago adicional"
                      :disable="!canAddManualEarnings"
                      @click="addManualLine('EARNING')"
                    />

                    <q-btn
                      unelevated
                      rounded
                      no-caps
                      color="negative"
                      icon="remove"
                      label="Deducción"
                      :disable="!canAddManualDeductions"
                      @click="addManualLine('DEDUCTION')"
                    />
                  </div>

                  <q-banner
                    v-if="
                      !canAddManualEarnings ||
                      !canAddManualDeductions
                    "
                    class="bg-grey-2 text-grey-9 rounded-banner q-mt-md"
                  >
                    <template #avatar>
                      <q-icon name="info" color="grey-8" />
                    </template>

                    Algunas opciones manuales están bloqueadas porque la
                    regla seleccionada o la política activa no las
                    permite.
                  </q-banner>

                  <q-banner
                    v-if="loanSummary?.hasActiveLoans"
                    class="bg-orange-1 text-orange-10 rounded-banner q-mt-md"
                  >
                    <template #avatar>
                      <q-icon
                        name="account_balance_wallet"
                        color="orange-10"
                      />
                    </template>

                    El préstamo pendiente no debe agregarse manualmente.
                    El backend lo incluirá como una deducción automática
                    al generar el cálculo.
                  </q-banner>

                  <div
                    v-if="!form.manualLines.length"
                    class="empty-adjustments"
                  >
                    <q-icon
                      name="tune"
                      size="44px"
                      color="grey-5"
                    />

                    <div
                      class="text-subtitle2 text-weight-bold q-mt-sm"
                    >
                      No hay ajustes manuales
                    </div>

                    <div class="text-caption text-grey-7">
                      Puedes agregar pagos adicionales o deducciones si
                      la regla lo permite.
                    </div>
                  </div>

                  <div
                    v-for="(line, index) in form.manualLines"
                    :key="`manual-${index}`"
                    class="manual-line-card q-mt-md"
                  >
                    <div class="row q-col-gutter-md items-end">
                      <div class="col-12 col-md-2">
                        <q-badge
                          rounded
                          :color="
                            line.type === 'EARNING'
                              ? 'positive'
                              : 'negative'
                          "
                          :label="
                            line.type === 'EARNING'
                              ? 'Ingreso'
                              : 'Deducción'
                          "
                          class="type-badge"
                        />
                      </div>

                      <div class="col-12 col-md-3">
                        <div class="field-label required">
                          Código
                        </div>

                        <q-select
                          v-model="line.code"
                          outlined
                          dense
                          rounded
                          color="primary"
                          emit-value
                          map-options
                          :options="
                            line.type === 'EARNING'
                              ? earningCodeOptions
                              : deductionCodeOptions
                          "
                          label="Concepto"
                          @update:model-value="
                            syncManualLineLabel(index)
                          "
                        />
                      </div>

                      <div class="col-12 col-md-3">
                        <div class="field-label">
                          Etiqueta
                        </div>

                        <q-input
                          v-model="line.label"
                          outlined
                          dense
                          rounded
                          color="primary"
                          label="Nombre visible"
                        />
                      </div>

                      <div class="col-12 col-md-2">
                        <div class="field-label required">
                          Monto
                        </div>

                        <q-input
                          v-model.number="line.amount"
                          outlined
                          dense
                          rounded
                          color="primary"
                          type="number"
                          min="0"
                          prefix="RD$"
                        />
                      </div>

                      <div class="col-12 col-md-2 text-right">
                        <q-btn
                          flat
                          round
                          dense
                          color="negative"
                          icon="delete"
                          @click="removeManualLine(index)"
                        />
                      </div>

                      <div class="col-12 col-md-6">
                        <div class="field-label required">
                          Razón
                        </div>

                        <q-input
                          v-model="line.reason"
                          outlined
                          dense
                          rounded
                          color="primary"
                          label="Razón del ajuste"
                        />
                      </div>

                      <div class="col-12 col-md-6">
                        <div class="field-label">
                          Notas
                        </div>

                        <q-input
                          v-model="line.notes"
                          outlined
                          dense
                          rounded
                          color="primary"
                          label="Notas internas"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Vista previa -->

              <q-tab-panel name="preview" class="q-pa-none">
                <div
                  v-if="!preview"
                  class="section-card text-center q-pa-xl"
                >
                  <q-icon
                    name="receipt_long"
                    size="54px"
                    color="grey-5"
                  />

                  <div
                    class="text-subtitle1 text-weight-bold q-mt-sm"
                  >
                    Todavía no hay cálculo generado
                  </div>

                  <div class="text-caption text-grey-7 q-mb-md">
                    Completa los datos y presiona “Calcular vista
                    previa”.
                  </div>

                  <q-btn
                    color="primary"
                    unelevated
                    rounded
                    no-caps
                    icon="calculate"
                    label="Calcular vista previa"
                    :loading="loading"
                    :disable="!canCalculate || loanLoading"
                    @click="calculatePreview"
                  />
                </div>

                <div v-else>
                  <div class="row q-col-gutter-md">
                    <!-- Préstamo aplicado al cálculo -->

                    <div
                      v-if="preview.loanSnapshot?.hasActiveLoans"
                      class="col-12"
                    >
                      <q-card
                        flat
                        bordered
                        class="loan-preview-card"
                      >
                        <div class="section-card-header">
                          <q-avatar
                            color="orange-1"
                            text-color="orange-10"
                            size="42px"
                          >
                            <q-icon
                              name="account_balance_wallet"
                            />
                          </q-avatar>

                          <div>
                            <div class="section-card-title">
                              Descuento de préstamos
                            </div>

                            <div class="section-card-subtitle">
                              El saldo se calculó nuevamente al generar
                              esta vista previa.
                            </div>
                          </div>

                          <q-space />

                          <q-badge
                            rounded
                            color="orange-10"
                            label="Deducción automática"
                          />
                        </div>

                        <div class="row q-col-gutter-md q-mt-md">
                          <div class="col-12 col-md-4">
                            <div class="loan-preview-metric">
                              <div class="total-label">
                                Deuda total
                              </div>

                              <div
                                class="total-value text-negative"
                              >
                                {{
                                  money(
                                    preview.loanSnapshot
                                      .totalOutstanding,
                                  )
                                }}
                              </div>
                            </div>
                          </div>

                          <div class="col-12 col-md-4">
                            <div class="loan-preview-metric">
                              <div class="total-label">
                                Descuento aplicado
                              </div>

                              <div
                                class="total-value text-orange-10"
                              >
                                {{
                                  money(
                                    preview.loanSnapshot
                                      .totalDeducted,
                                  )
                                }}
                              </div>
                            </div>
                          </div>

                          <div class="col-12 col-md-4">
                            <div class="loan-preview-metric">
                              <div class="total-label">
                                Balance restante
                              </div>

                              <div class="total-value">
                                {{
                                  money(
                                    preview.loanSnapshot
                                      .remainingOutstanding,
                                  )
                                }}
                              </div>
                            </div>
                          </div>
                        </div>

                        <q-banner
                          v-if="
                            Number(
                              preview.loanSnapshot
                                .remainingOutstanding || 0,
                            ) > 0
                          "
                          class="bg-orange-1 text-orange-10 rounded-banner q-mt-md"
                        >
                          <template #avatar>
                            <q-icon
                              name="warning"
                              color="orange-10"
                            />
                          </template>

                          La liquidación no cubre completamente el saldo
                          de los préstamos. Después de aplicar la
                          deducción quedará un balance pendiente de

                          <strong>
                            {{
                              money(
                                preview.loanSnapshot
                                  .remainingOutstanding,
                              )
                            }}
                          </strong>.
                        </q-banner>

                        <q-banner
                          v-else
                          class="bg-green-1 text-positive rounded-banner q-mt-md"
                        >
                          <template #avatar>
                            <q-icon
                              name="check_circle"
                              color="positive"
                            />
                          </template>

                          La liquidación cubre completamente el balance
                          pendiente de los préstamos.
                        </q-banner>
                      </q-card>
                    </div>

                    <!-- Totales -->

                    <div class="col-12 col-md-4">
                      <q-card flat bordered class="total-card">
                        <div class="total-label">
                          Ingresos automáticos
                        </div>

                        <div class="total-value text-positive">
                          {{
                            money(
                              preview.calculation
                                ?.automaticIncome,
                            )
                          }}
                        </div>
                      </q-card>
                    </div>

                    <div class="col-12 col-md-4">
                      <q-card flat bordered class="total-card">
                        <div class="total-label">
                          Ingresos manuales
                        </div>

                        <div class="total-value text-primary">
                          {{
                            money(
                              preview.calculation?.manualIncome,
                            )
                          }}
                        </div>
                      </q-card>
                    </div>

                    <div class="col-12 col-md-4">
                      <q-card flat bordered class="total-card">
                        <div class="total-label">
                          Deducciones
                        </div>

                        <div class="total-value text-negative">
                          {{
                            money(
                              preview.calculation
                                ?.totalDeductions,
                            )
                          }}
                        </div>
                      </q-card>
                    </div>

                    <div class="col-12">
                      <q-card flat bordered class="net-card">
                        <div>
                          <div class="text-caption text-grey-7">
                            Total neto estimado a pagar
                          </div>

                          <div class="net-value">
                            {{
                              money(
                                preview.calculation?.netTotal,
                              )
                            }}
                          </div>
                        </div>

                        <q-btn
                          outline
                          rounded
                          no-caps
                          color="primary"
                          icon="refresh"
                          label="Recalcular"
                          :loading="loading"
                          :disable="loanLoading"
                          @click="calculatePreview"
                        />
                      </q-card>
                    </div>

                    <!-- Snapshots -->

                    <div class="col-12 col-md-4">
                      <q-card flat bordered class="snapshot-card">
                        <div class="snapshot-title">
                          Antigüedad
                        </div>

                        <div class="snapshot-value">
                          {{
                            preview.senioritySnapshot?.text ||
                            "N/A"
                          }}
                        </div>

                        <div class="text-caption text-grey-7">
                          {{
                            preview.senioritySnapshot
                              ?.totalMonths || 0
                          }}
                          meses
                        </div>
                      </q-card>
                    </div>

                    <div class="col-12 col-md-4">
                      <q-card flat bordered class="snapshot-card">
                        <div class="snapshot-title">
                          Salario diario
                        </div>

                        <div class="snapshot-value">
                          {{
                            money(
                              preview.salarySnapshot?.dailySalary,
                            )
                          }}
                        </div>

                        <div class="text-caption text-grey-7">
                          Divisor:
                          {{
                            preview.salarySnapshot
                              ?.dailySalaryDivisor || 0
                          }}
                        </div>
                      </q-card>
                    </div>

                    <div class="col-12 col-md-4">
                      <q-card flat bordered class="snapshot-card">
                        <div class="snapshot-title">
                          Salario base promedio
                        </div>

                        <div class="snapshot-value">
                          {{
                            money(
                              preview.salarySnapshot
                                ?.averageOrdinarySalary,
                            )
                          }}
                        </div>

                        <div class="text-caption text-grey-7">
                          {{
                            preview.salarySnapshot
                              ?.salaryBaseMode || ""
                          }}
                        </div>
                      </q-card>
                    </div>

                    <!-- Tabla -->

                    <div class="col-12">
                      <q-card
                        flat
                        bordered
                        class="section-card"
                      >
                        <div
                          class="section-card-header q-mb-md"
                        >
                          <q-avatar
                            color="blue-1"
                            text-color="primary"
                            size="38px"
                          >
                            <q-icon
                              name="format_list_bulleted"
                            />
                          </q-avatar>

                          <div>
                            <div class="section-card-title">
                              Detalle del cálculo
                            </div>

                            <div class="section-card-subtitle">
                              Conceptos calculados automáticamente y
                              ajustes manuales.
                            </div>
                          </div>
                        </div>

                        <q-table
                          flat
                          bordered
                          row-key="_id"
                          :rows="
                            preview.calculation?.lines || []
                          "
                          :columns="lineColumns"
                          :rows-per-page-options="[0]"
                          hide-pagination
                        >
                          <template #body-cell-label="props">
                            <q-td :props="props">
                              <div class="text-weight-bold">
                                {{ props.row.label }}
                              </div>

                              <div
                                v-if="
                                  props.row.code ===
                                  'EMPLOYEE_LOAN'
                                "
                                class="text-caption text-orange-10"
                              >
                                Saldo consultado automáticamente
                              </div>

                              <div
                                v-else-if="props.row.notes"
                                class="text-caption text-grey-7"
                              >
                                {{ props.row.notes }}
                              </div>
                            </q-td>
                          </template>

                          <template #body-cell-type="props">
                            <q-td :props="props">
                              <q-badge
                                rounded
                                :color="
                                  props.row.type ===
                                  'EARNING'
                                    ? 'positive'
                                    : 'negative'
                                "
                                :label="
                                  props.row.type ===
                                  'EARNING'
                                    ? 'Ingreso'
                                    : 'Deducción'
                                "
                              />
                            </q-td>
                          </template>

                          <template #body-cell-source="props">
                            <q-td :props="props">
                              <q-badge
                                rounded
                                :color="
                                  props.row.source ===
                                  'AUTOMATIC'
                                    ? 'primary'
                                    : 'warning'
                                "
                                :label="
                                  props.row.source ===
                                  'AUTOMATIC'
                                    ? 'Automático'
                                    : 'Manual'
                                "
                              />
                            </q-td>
                          </template>

                          <template #body-cell-days="props">
                            <q-td :props="props">
                              {{ getNumber(props.row.days) }}
                            </q-td>
                          </template>

                          <template #body-cell-amount="props">
                            <q-td
                              :props="props"
                              class="text-weight-bold"
                            >
                              <span
                                :class="
                                  props.row.type ===
                                  'EARNING'
                                    ? 'text-positive'
                                    : 'text-negative'
                                "
                              >
                                {{
                                  props.row.type ===
                                  "DEDUCTION"
                                    ? "-"
                                    : ""
                                }}
                                {{ money(props.row.amount) }}
                              </span>
                            </q-td>
                          </template>
                        </q-table>
                      </q-card>
                    </div>
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions
        align="right"
        class="dialog-actions"
      >
        <q-btn
          flat
          rounded
          no-caps
          color="negative"
          icon="cancel"
          label="Cancelar"
          :disable="isBusy"
          @click="closeDialog"
        />

        <q-btn
          outline
          rounded
          no-caps
          color="primary"
          icon="calculate"
          label="Calcular vista previa"
          :loading="loading"
          :disable="
            policyLoading ||
            loanLoading ||
            saving ||
            !canCalculate
          "
          @click="calculatePreview"
        />

        <q-btn
          unelevated
          rounded
          no-caps
          color="negative"
          icon="person_remove"
          label="Guardar desvinculación"
          :loading="saving"
          :disable="
            policyLoading ||
            loanLoading ||
            loading ||
            !canSave
          "
          @click="saveTermination"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { Notify } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },

  employee: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "saved",
]);

const tab = ref("general");

const policyLoading = ref(false);
const loanLoading = ref(false);
const loading = ref(false);
const saving = ref(false);

const preview = ref(null);

const activePolicy = ref(null);
const policyError = ref("");

const loanSummary = ref(null);
const loanError = ref("");

const form = reactive({
  terminationType: "",
  terminationDate: "",
  reason: "",
  noticeGiven: false,
  noticeDate: "",
  pendingSalaryAmount: 0,

  includeOverrides: {
    includePendingSalary: null,
    includeSeverance: null,
    includePreNotice: null,
    includeVacation: null,
    includeChristmasSalary: null,
    includeEconomicAssistance: null,
    overrideReason: "",
  },

  manualLines: [],
});

const knownCodeLabels = {
  EMPLOYER_DESAHUCIO: "Desahucio por empleador",
  EMPLOYEE_RESIGNATION: "Renuncia del empleado",
  EMPLOYER_JUSTIFIED_DISMISSAL: "Despido justificado",
  EMPLOYER_UNJUSTIFIED_DISMISSAL: "Despido injustificado",
  EMPLOYEE_JUSTIFIED_RESIGNATION: "Dimisión justificada",
  EMPLOYEE_UNJUSTIFIED_RESIGNATION: "Dimisión injustificada",
  MUTUAL_AGREEMENT: "Mutuo acuerdo",
  CONTRACT_END: "Fin de contrato",
  DEATH_OR_DISABILITY: "Muerte o discapacidad",
  COMPANY_CLOSURE: "Cierre de empresa",
  RETIREMENT: "Retiro",
  OTHER: "Otro",

  BONUS: "Bono",
  COMMISSION: "Comisión",
  INCENTIVE: "Incentivo",
  PENDING_PAYMENT: "Pago pendiente",
  MANUAL_ADJUSTMENT: "Ajuste manual",
  OTHER_EARNING: "Otro ingreso",

  EMPLOYEE_LOAN: "Préstamo empleado",
  SALARY_ADVANCE: "Avance de salario",
  EQUIPMENT_DEDUCTION: "Descuento de equipo",
  ABSENCE_DEDUCTION: "Descuento por ausencia",
  MANUAL_DEDUCTION: "Deducción manual",
  OTHER_DEDUCTION: "Otra deducción",
};

const defaultEarningCodeOptions = [
  "BONUS",
  "COMMISSION",
  "INCENTIVE",
  "PENDING_PAYMENT",
  "MANUAL_ADJUSTMENT",
  "OTHER_EARNING",
];

/**
 * EMPLOYEE_LOAN no se incluye.
 * El préstamo se calcula automáticamente desde el backend.
 */
const defaultDeductionCodeOptions = [
  "SALARY_ADVANCE",
  "EQUIPMENT_DEDUCTION",
  "ABSENCE_DEDUCTION",
  "MANUAL_DEDUCTION",
  "OTHER_DEDUCTION",
];

const overrideOptions = [
  {
    label: "Según política",
    value: null,
  },
  {
    label: "Incluir",
    value: true,
  },
  {
    label: "Excluir",
    value: false,
  },
];

const overrideFields = [
  {
    field: "includePendingSalary",
    ruleField: "includePendingSalary",
    label: "Salario pendiente",
  },
  {
    field: "includeSeverance",
    ruleField: "includeSeverance",
    label: "Cesantía",
  },
  {
    field: "includePreNotice",
    ruleField: "includePreNotice",
    label: "Preaviso",
  },
  {
    field: "includeVacation",
    ruleField: "includeVacation",
    label: "Vacaciones",
  },
  {
    field: "includeChristmasSalary",
    ruleField: "includeChristmasSalary",
    label: "Regalía",
  },
  {
    field: "includeEconomicAssistance",
    ruleField: "includeEconomicAssistance",
    label: "Asistencia económica",
  },
];

const lineColumns = [
  {
    name: "label",
    label: "Concepto",
    field: "label",
    align: "left",
  },
  {
    name: "type",
    label: "Tipo",
    field: "type",
    align: "center",
  },
  {
    name: "source",
    label: "Fuente",
    field: "source",
    align: "center",
  },
  {
    name: "days",
    label: "Días",
    field: "days",
    align: "center",
  },
  {
    name: "amount",
    label: "Monto",
    field: "amount",
    align: "right",
  },
];

const isBusy = computed(() => {
  return (
    policyLoading.value ||
    loanLoading.value ||
    loading.value ||
    saving.value
  );
});

const loadingLabel = computed(() => {
  if (saving.value) {
    return "Guardando desvinculación...";
  }

  if (loading.value) {
    return "Calculando vista previa...";
  }

  if (loanLoading.value) {
    return "Consultando préstamos activos...";
  }

  if (policyLoading.value) {
    return "Cargando política activa...";
  }

  return "Procesando...";
});

const companyId = computed(() => {
  return (
    props.employee?.company?._id ||
    props.employee?.company ||
    null
  );
});

const employeeId = computed(() => {
  return props.employee?._id || null;
});

const terminationRules = computed(() => {
  const rules =
    activePolicy.value?.terminationTypeRules || [];

  if (!Array.isArray(rules)) {
    return [];
  }

  return rules
    .filter((item) => item?.isActive !== false)
    .filter((item) => item?.code)
    .map((item) => ({
      ...item,

      code: String(item.code || "").trim(),

      label:
        item.label ||
        item.name ||
        knownCodeLabels[item.code] ||
        item.code ||
        "Tipo de desvinculación",
    }));
});

const terminationTypeOptions = computed(() => {
  return terminationRules.value.map((item) => ({
    label: item.label,
    value: item.code,
  }));
});

const selectedTerminationRule = computed(() => {
  if (!form.terminationType) {
    return null;
  }

  return (
    terminationRules.value.find(
      (item) =>
        String(item.code) ===
        String(form.terminationType),
    ) || null
  );
});

const manualAdjustmentRules = computed(() => {
  return activePolicy.value?.manualAdjustmentRules || {};
});

const earningCodeOptions = computed(() => {
  return normalizeCodeOptions(
    manualAdjustmentRules.value
      .allowedEarningCodes ||
      manualAdjustmentRules.value.earningCodes,
    defaultEarningCodeOptions,
  );
});

const deductionCodeOptions = computed(() => {
  return normalizeCodeOptions(
    manualAdjustmentRules.value
      .allowedDeductionCodes ||
      manualAdjustmentRules.value.deductionCodes,
    defaultDeductionCodeOptions,
  ).filter((item) => {
    return (
      String(item.value || "")
        .trim()
        .toUpperCase() !== "EMPLOYEE_LOAN"
    );
  });
});

const canAddManualEarnings = computed(() => {
  if (!selectedTerminationRule.value) {
    return false;
  }

  if (
    selectedTerminationRule.value
      .allowManualEarnings === false
  ) {
    return false;
  }

  if (
    manualAdjustmentRules.value
      .allowManualEarnings === false
  ) {
    return false;
  }

  return earningCodeOptions.value.length > 0;
});

const canAddManualDeductions = computed(() => {
  if (!selectedTerminationRule.value) {
    return false;
  }

  if (
    selectedTerminationRule.value
      .allowManualDeductions === false
  ) {
    return false;
  }

  if (
    manualAdjustmentRules.value
      .allowManualDeductions === false
  ) {
    return false;
  }

  return deductionCodeOptions.value.length > 0;
});

const canCalculate = computed(() => {
  return (
    !!employeeId.value &&
    !!companyId.value &&
    !!props.employee?.hiringDate &&
    !!activePolicy.value &&
    !!selectedTerminationRule.value &&
    !!form.terminationType &&
    !!form.terminationDate
  );
});

const canSave = computed(() => {
  return canCalculate.value && !!preview.value;
});

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      initializeDialog();
    }
  },
);

watch(
  () => props.employee,
  () => {
    if (props.modelValue) {
      initializeDialog();
    }
  },
);

watch(
  () => [
    form.terminationType,
    form.terminationDate,
    form.noticeGiven,
    form.noticeDate,
    form.pendingSalaryAmount,
    form.reason,
    JSON.stringify(form.includeOverrides),
    JSON.stringify(form.manualLines),
  ],
  () => {
    preview.value = null;
  },
);

const initializeDialog = async () => {
  resetForm();

  await Promise.all([
    loadActivePolicy(),
    loadLoanSummary(),
  ]);
};

const resetForm = () => {
  const today = new Date()
    .toISOString()
    .slice(0, 10);

  form.terminationType = "";
  form.terminationDate = today;
  form.reason = "";
  form.noticeGiven = false;
  form.noticeDate = "";
  form.pendingSalaryAmount = 0;

  form.includeOverrides = {
    includePendingSalary: null,
    includeSeverance: null,
    includePreNotice: null,
    includeVacation: null,
    includeChristmasSalary: null,
    includeEconomicAssistance: null,
    overrideReason: "",
  };

  form.manualLines = [];

  activePolicy.value = null;
  policyError.value = "";

  loanSummary.value = null;
  loanError.value = "";

  preview.value = null;
  tab.value = "general";
};

const loadActivePolicy = async () => {
  if (!companyId.value) {
    policyError.value =
      "El empleado no tiene compañía asignada.";
    return;
  }

  policyLoading.value = true;
  policyError.value = "";

  try {
    const resp = await methodsHttp.getApi(
      `employee-termination/policies/active?company=${companyId.value}`,
    );

    if (!resp?.ok) {
      activePolicy.value = null;

      policyError.value =
        resp?.mensaje ||
        "No se pudo cargar la política activa.";

      return;
    }

    const policy =
      extractPolicyFromResponse(resp);

    if (!policy) {
      activePolicy.value = null;

      policyError.value =
        "No se encontró una política activa para esta compañía.";

      return;
    }

    activePolicy.value = policy;

    ensureDefaultTerminationType();
  } catch (error) {
    console.error(
      "loadActivePolicy error:",
      error,
    );

    activePolicy.value = null;

    policyError.value =
      error?.response?.data?.mensaje ||
      "Error cargando la política activa de desvinculación.";
  } finally {
    policyLoading.value = false;
  }
};

const loadLoanSummary = async () => {
  if (!employeeId.value || !companyId.value) {
    loanSummary.value = null;
    loanError.value = "";
    return;
  }

  loanLoading.value = true;
  loanError.value = "";

  try {
    const resp = await methodsHttp.getApi(
      `employee-termination/employees/${employeeId.value}/loan-summary?companyId=${companyId.value}`,
    );

    if (!resp?.ok) {
      loanSummary.value = null;

      loanError.value =
        resp?.mensaje ||
        "No se pudieron consultar los préstamos del empleado.";

      return;
    }

    loanSummary.value =
      extractLoanSummaryFromResponse(resp);
  } catch (error) {
    console.error(
      "loadLoanSummary error:",
      error,
    );

    loanSummary.value = null;

    loanError.value =
      error?.response?.data?.mensaje ||
      error?.response?.data?.message ||
      "Error consultando los préstamos activos.";
  } finally {
    loanLoading.value = false;
  }
};

const extractPolicyFromResponse = (resp) => {
  const data =
    resp?.data?.policy ||
    resp?.policy ||
    resp?.data?.item ||
    resp?.data;

  if (Array.isArray(data)) {
    return data[0] || null;
  }

  return data || null;
};

const extractLoanSummaryFromResponse = (resp) => {
  const data =
    resp?.data?.loanSummary ||
    resp?.data?.summary ||
    resp?.loanSummary ||
    resp?.summary ||
    resp?.data ||
    null;

  if (Array.isArray(data)) {
    return data[0] || null;
  }

  return data;
};

const ensureDefaultTerminationType = () => {
  const exists =
    terminationTypeOptions.value.some(
      (item) =>
        String(item.value) ===
        String(form.terminationType),
    );

  if (exists) {
    return;
  }

  form.terminationType =
    terminationTypeOptions.value[0]?.value || "";
};

const normalizeCodeOptions = (
  value,
  fallback = [],
) => {
  const list =
    Array.isArray(value) && value.length
      ? value
      : fallback;

  return list
    .map((item) => {
      if (typeof item === "string") {
        return {
          label:
            knownCodeLabels[item] || item,
          value: item,
        };
      }

      const rawValue =
        item?.value ||
        item?.code ||
        item?.name ||
        item?.label;

      if (!rawValue) {
        return null;
      }

      return {
        label:
          item?.label ||
          item?.name ||
          knownCodeLabels[rawValue] ||
          String(rawValue),

        value: String(rawValue),
      };
    })
    .filter(Boolean);
};

const clonePlain = (value) => {
  try {
    return JSON.parse(
      JSON.stringify(value || null),
    );
  } catch (error) {
    return null;
  }
};

const closeDialog = () => {
  emit("update:modelValue", false);
};

const buildPayload = () => {
  return {
    companyId: companyId.value,
    employeeId: employeeId.value,

    policyId:
      activePolicy.value?._id ||
      activePolicy.value?.id ||
      null,

    terminationType: form.terminationType,

    terminationTypeLabel:
      selectedTerminationRule.value?.label ||
      form.terminationType,

    terminationTypeRuleSnapshot: clonePlain(
      selectedTerminationRule.value,
    ),

    terminationDate: form.terminationDate,

    reason: String(
      form.reason || "",
    ).trim(),

    noticeGiven:
      form.noticeGiven === true,

    noticeDate:
      form.noticeGiven && form.noticeDate
        ? form.noticeDate
        : null,

    pendingSalaryAmount: Number(
      form.pendingSalaryAmount || 0,
    ),

    includeOverrides: {
      includePendingSalary:
        form.includeOverrides
          .includePendingSalary,

      includeSeverance:
        form.includeOverrides.includeSeverance,

      includePreNotice:
        form.includeOverrides.includePreNotice,

      includeVacation:
        form.includeOverrides.includeVacation,

      includeChristmasSalary:
        form.includeOverrides
          .includeChristmasSalary,

      includeEconomicAssistance:
        form.includeOverrides
          .includeEconomicAssistance,

      overrideReason: String(
        form.includeOverrides
          .overrideReason || "",
      ).trim(),
    },

    manualLines: form.manualLines
      .filter(
        (item) =>
          Number(item.amount || 0) > 0,
      )
      .map((item) => ({
        code: item.code,

        label:
          item.label ||
          getManualCodeLabel(
            item.code,
            item.type,
          ),

        type: item.type,

        amount: Number(
          item.amount || 0,
        ),

        reason: String(
          item.reason || "",
        ).trim(),

        notes: String(
          item.notes || "",
        ).trim(),
      })),
  };
};

const validatePayload = () => {
  if (!employeeId.value) {
    Notify.create({
      type: "negative",
      message: "Empleado inválido.",
    });

    return false;
  }

  if (!companyId.value) {
    Notify.create({
      type: "negative",
      message:
        "El empleado no tiene compañía asignada.",
    });

    return false;
  }

  if (!props.employee?.hiringDate) {
    Notify.create({
      type: "negative",
      message:
        "El empleado no tiene fecha de contratación.",
    });

    return false;
  }

  if (!activePolicy.value) {
    Notify.create({
      type: "negative",
      message:
        "No hay una política activa cargada.",
    });

    return false;
  }

  if (
    !form.terminationType ||
    !selectedTerminationRule.value
  ) {
    Notify.create({
      type: "negative",
      message:
        "Selecciona un tipo de desvinculación válido.",
    });

    return false;
  }

  if (!form.terminationDate) {
    Notify.create({
      type: "negative",
      message:
        "Selecciona la fecha de salida.",
    });

    return false;
  }

  if (
    selectedTerminationRule.value
      ?.requiresReason === true &&
    !String(form.reason || "").trim()
  ) {
    Notify.create({
      type: "negative",
      message:
        "La regla seleccionada requiere una razón o comentario.",
    });

    tab.value = "general";

    return false;
  }

  const hasEmployeeLoanManualLine =
    form.manualLines.some((item) => {
      return (
        String(item.code || "")
          .trim()
          .toUpperCase() ===
        "EMPLOYEE_LOAN"
      );
    });

  if (hasEmployeeLoanManualLine) {
    Notify.create({
      type: "negative",
      message:
        "El préstamo del empleado se calcula automáticamente y no puede agregarse como una deducción manual.",
    });

    tab.value = "adjustments";

    return false;
  }

  const hasManualEarnings =
    form.manualLines.some(
      (item) => item.type === "EARNING",
    );

  const hasManualDeductions =
    form.manualLines.some(
      (item) => item.type === "DEDUCTION",
    );

  if (
    hasManualEarnings &&
    !canAddManualEarnings.value
  ) {
    Notify.create({
      type: "negative",
      message:
        "La regla seleccionada no permite pagos adicionales manuales.",
    });

    tab.value = "adjustments";

    return false;
  }

  if (
    hasManualDeductions &&
    !canAddManualDeductions.value
  ) {
    Notify.create({
      type: "negative",
      message:
        "La regla seleccionada no permite deducciones manuales.",
    });

    tab.value = "adjustments";

    return false;
  }

  const invalidManualLine =
    form.manualLines.find((item) => {
      return (
        !item.code ||
        !item.type ||
        Number(item.amount || 0) <= 0 ||
        !String(
          item.reason || "",
        ).trim()
      );
    });

  if (invalidManualLine) {
    Notify.create({
      type: "negative",
      message:
        "Cada ajuste manual debe tener código, monto mayor a cero y razón.",
    });

    tab.value = "adjustments";

    return false;
  }

  return true;
};

const calculatePreview = async () => {
  if (!validatePayload()) {
    return;
  }

  loading.value = true;

  try {
    const resp =
      await methodsHttp.postApi(
        "employee-termination/terminations/preview",
        buildPayload(),
      );

    if (resp?.ok) {
      const result =
        extractPreviewFromResponse(resp);

      preview.value = result;

      /**
       * Mantiene el resumen superior sincronizado
       * con el saldo que realmente usó la vista previa.
       */
      if (result?.loanSnapshot) {
        loanSummary.value =
          clonePlain(result.loanSnapshot);
      }

      tab.value = "preview";

      Notify.create({
        type: "positive",
        message:
          resp.mensaje ||
          "Vista previa generada correctamente.",
      });

      return;
    }

    Notify.create({
      type: "negative",
      message:
        resp?.mensaje ||
        "No se pudo calcular la vista previa.",
    });
  } catch (error) {
    console.error(
      "calculatePreview error:",
      error,
    );

    Notify.create({
      type: "negative",
      message:
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        "Error calculando la vista previa.",
    });
  } finally {
    loading.value = false;
  }
};

const extractPreviewFromResponse = (resp) => {
  return (
    resp?.data?.preview ||
    resp?.preview ||
    resp?.data ||
    null
  );
};

const saveTermination = async () => {
  if (!validatePayload()) {
    return;
  }

  if (!preview.value) {
    await calculatePreview();

    if (!preview.value) {
      return;
    }
  }

  saving.value = true;

  try {
    const resp =
      await methodsHttp.postApi(
        "employee-termination/terminations",
        buildPayload(),
      );

    if (resp?.ok) {
      Notify.create({
        type: "positive",
        message:
          resp.mensaje ||
          "Desvinculación creada correctamente.",
      });

      emit("saved", resp.data);

      emit(
        "update:modelValue",
        false,
      );

      return;
    }

    Notify.create({
      type: "negative",
      message:
        resp?.mensaje ||
        "No se pudo crear la desvinculación.",
    });
  } catch (error) {
    console.error(
      "saveTermination error:",
      error,
    );

    Notify.create({
      type: "negative",
      message:
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        "Error guardando la desvinculación.",
    });
  } finally {
    saving.value = false;
  }
};

const addManualLine = (type) => {
  if (
    type === "EARNING" &&
    !canAddManualEarnings.value
  ) {
    Notify.create({
      type: "warning",
      message:
        "Esta regla no permite pagos adicionales manuales.",
    });

    return;
  }

  if (
    type === "DEDUCTION" &&
    !canAddManualDeductions.value
  ) {
    Notify.create({
      type: "warning",
      message:
        "Esta regla no permite deducciones manuales.",
    });

    return;
  }

  const options =
    type === "EARNING"
      ? earningCodeOptions.value
      : deductionCodeOptions.value;

  const defaultCode =
    options[0]?.value || "";

  if (!defaultCode) {
    Notify.create({
      type: "warning",
      message:
        "No hay códigos permitidos para este tipo de ajuste.",
    });

    return;
  }

  form.manualLines.push({
    code: defaultCode,

    label: getManualCodeLabel(
      defaultCode,
      type,
    ),

    type,
    amount: 0,
    reason: "",
    notes: "",
  });

  tab.value = "adjustments";
};

const removeManualLine = (index) => {
  form.manualLines.splice(index, 1);
};

const syncManualLineLabel = (index) => {
  const line =
    form.manualLines[index];

  if (!line) {
    return;
  }

  line.label =
    getManualCodeLabel(
      line.code,
      line.type,
    );
};

const getManualCodeLabel = (
  code,
  type,
) => {
  const source =
    type === "EARNING"
      ? earningCodeOptions.value
      : deductionCodeOptions.value;

  const found = source.find(
    (item) =>
      String(item.value) ===
      String(code),
  );

  return (
    found?.label ||
    knownCodeLabels[code] ||
    code ||
    ""
  );
};

const ruleIncludes = (field) => {
  if (!selectedTerminationRule.value) {
    return false;
  }

  return (
    selectedTerminationRule.value[field] ===
    true
  );
};

const ruleText = (field) => {
  if (!selectedTerminationRule.value) {
    return "N/A";
  }

  return selectedTerminationRule.value[
    field
  ] === true
    ? "Incluye"
    : "No incluye";
};

const getRuleBaseText = (field) => {
  if (!selectedTerminationRule.value) {
    return "Sin regla";
  }

  return selectedTerminationRule.value[
    field
  ] === true
    ? "Incluido"
    : "No incluido";
};

const getCompanyName = (company) => {
  if (!company) {
    return "Sin compañía";
  }

  if (typeof company === "string") {
    return company;
  }

  return (
    company.legalName ||
    company.commercialName ||
    company.name ||
    company.code ||
    "Compañía"
  );
};

const getLoanKey = (loan, index) => {
  const id =
    loan?.loanRequest?._id ||
    loan?.loanRequest ||
    loan?._id ||
    loan?.requestNumber;

  return id
    ? String(id)
    : `loan-${index}`;
};

const getLoanSourceLabel = (source) => {
  const labels = {
    AMORTIZATION_SCHEDULE:
      "Tabla de amortización",

    LOAN_QUOTE_SNAPSHOT:
      "Cotización del préstamo",

    APPROVED_AMOUNT:
      "Monto aprobado",
  };

  return labels[source] || source || "";
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
  ) {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
};

const getInitials = (value) => {
  const text = String(
    value || "",
  ).trim();

  if (!text) {
    return "U";
  }

  const parts = text
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return `${parts[0].charAt(
    0,
  )}${parts[1].charAt(0)}`.toUpperCase();
};

const getNumber = (value) => {
  const number = Number(value || 0);

  return (
    Math.round(
      (number + Number.EPSILON) * 100,
    ) / 100
  );
};

const money = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat(
    "es-DO",
    {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(number);
};
</script>

<style scoped>
.termination-dialog {
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
  width: 48px;
  height: 48px;
  min-width: 48px;
  margin-right: 12px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.dialog-title {
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.05;
}

.dialog-subtitle {
  margin-top: 4px;
  font-size: 0.8rem;
  opacity: 0.9;
}

.dialog-body {
  max-height: calc(92vh - 154px);
  overflow-y: auto;
  background: #f8fafc;
  padding: 18px;
}

.rounded-banner {
  border-radius: 16px;
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
  font-size: 0.96rem;
  font-weight: 900;
}

.section-card-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.78rem;
}

.employee-summary {
  display: flex;
  align-items: center;
  gap: 14px;
}

.employee-avatar {
  color: white;
  font-weight: 900;
  background: linear-gradient(135deg, #1a2436, #1964a2);
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 4px rgba(25, 100, 162, 0.12);
}

.employee-summary-info {
  min-width: 0;
}

.employee-name {
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.1;
}

.tabs-bar {
  border-radius: 18px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  overflow: hidden;
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

.rule-summary {
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.rule-chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.switch-card {
  min-height: 76px;
  padding: 14px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: white;
}

.empty-adjustments {
  min-height: 180px;
  display: grid;
  place-items: center;
  text-align: center;
  color: #64748b;
}

.manual-line-card {
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 14px;
}

.type-badge {
  padding: 7px 12px;
  font-weight: 900;
}

.total-card,
.snapshot-card {
  min-height: 96px;
  padding: 16px;
  border-radius: 18px;
  background: white;
}

.total-label,
.snapshot-title {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.total-value {
  margin-top: 8px;
  font-size: 1.35rem;
  font-weight: 900;
}

.snapshot-value {
  margin-top: 8px;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 900;
}

.net-card {
  min-height: 104px;
  padding: 18px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.net-value {
  color: #0f172a;
  font-size: 1.85rem;
  font-weight: 950;
  line-height: 1.1;
}

/* Préstamos */

.loan-summary-card {
  border-color: rgba(245, 124, 0, 0.26);
  background: linear-gradient(
    135deg,
    #ffffff,
    #fffaf2
  );
}

.loan-count-badge {
  padding: 7px 12px;
  font-weight: 900;
}

.loan-metric {
  min-height: 82px;
  padding: 12px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.loan-metric-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.loan-metric-value {
  margin-top: 7px;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.loan-expansion {
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.loan-list-item {
  min-height: 86px;
}

.loan-preview-card {
  padding: 18px;
  border-radius: 20px;
  border-color: rgba(245, 124, 0, 0.26);
  background: linear-gradient(
    135deg,
    #fffaf2,
    #ffffff
  );
}

.loan-preview-metric {
  min-height: 96px;
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.dialog-actions {
  padding: 14px 18px;
  background: white;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

:deep(
  .q-field--outlined.q-field--rounded
    .q-field__control
) {
  border-radius: 28px;
}

@media (max-width: 768px) {
  .termination-dialog {
    width: 98vw;
  }

  .employee-summary {
    align-items: flex-start;
  }

  .switch-card,
  .net-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .section-card-header {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .loan-count-badge {
    margin-top: 8px;
  }
}
</style>