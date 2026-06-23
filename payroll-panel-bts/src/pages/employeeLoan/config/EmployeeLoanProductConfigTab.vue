<template>
  <div class="loan-config-tab">
    <q-card flat bordered class="panel-card">
      <q-card-section
        class="panel-header row items-center justify-between"
      >
        <div>
          <div class="panel-title">
            Producto principal de préstamo
          </div>

          <div class="panel-subtitle">
            Configura límites, cuotas, tasa de interés, garantía de
            vacaciones y cuenta bancaria para recibir los intereses.
          </div>
        </div>

        <div class="row items-center q-gutter-sm">
          <q-btn
            unelevated
            rounded
            no-caps
            color="primary"
            icon="add"
            label="Nueva configuración"
            @click="openDialog()"
          />

          <q-btn
            unelevated
            rounded
            no-caps
            color="primary"
            icon="refresh"
            label="Actualizar"
            :loading="loading"
            @click="reload"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        flat
        bordered
        row-key="_id"
        class="main-table"
        :rows="rows"
        :columns="columns"
        :loading="loading"
        hide-pagination
        :rows-per-page-options="[0]"
      >
        <template #body-cell-name="props">
          <q-td :props="props">
            <div class="text-weight-bold text-dark">
              {{ props.row.name }}
            </div>

            <div class="text-caption text-grey-7">
              {{ props.row.code }}
            </div>

            <div
              v-if="props.row.externalProductCode"
              class="text-caption text-grey-7"
            >
              Externo: {{ props.row.externalProductCode }}
            </div>
          </q-td>
        </template>

        <template #body-cell-interestRate="props">
          <q-td :props="props">
            <q-chip
              dense
              color="blue-1"
              text-color="primary"
              icon="percent"
            >
              {{ numberValue(props.row.interestRate) }}%
              {{
                interestRateTypeLabel(
                  props.row.interestRateType,
                )
              }}
            </q-chip>

            <div class="text-caption text-grey-7 q-mt-xs">
              {{
                paymentFrequencyLabel(
                  props.row.defaultPaymentFrequency,
                )
              }}
            </div>
          </q-td>
        </template>

        <template #body-cell-amounts="props">
          <q-td :props="props">
            <div class="amount-text">
              {{ money(props.row.minLoanAmount) }}
              -
              {{ money(props.row.maxLoanAmount) }}
            </div>

            <div class="text-caption text-grey-7">
              Máximo absoluto del producto
            </div>
          </q-td>
        </template>

        <template #body-cell-installments="props">
          <q-td :props="props">
            <q-chip
              dense
              color="indigo-1"
              text-color="indigo-8"
              icon="format_list_numbered"
            >
              {{ props.row.minInstallments }}
              -
              {{ props.row.maxInstallments }}
              cuotas
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-vacationRules="props">
          <q-td :props="props">
            <div class="column q-gutter-xs">
              <q-chip
                dense
                color="orange-1"
                text-color="orange-10"
                icon="percent"
              >
                Garantía
                {{
                  numberValue(
                    props.row
                      .maxVacationDaysGuaranteePercent,
                  )
                }}%
              </q-chip>

              <q-chip
                dense
                color="deep-orange-1"
                text-color="deep-orange-10"
                icon="event_busy"
              >
                {{
                  fixedGuaranteeDaysLabel(
                    props.row.maxVacationGuaranteeDays,
                  )
                }}
              </q-chip>

              <q-chip
                dense
                color="green-1"
                text-color="positive"
                icon="event_available"
              >
                Mín.
                {{
                  numberValue(
                    props.row.minimumVacationDaysRequired,
                  )
                }}
                día(s)
              </q-chip>

              <q-chip
                dense
                color="purple-1"
                text-color="purple-8"
                icon="calculate"
              >
                {{
                  vacationDayValueModeLabel(
                    props.row.vacationDayValueMode,
                  )
                }}
              </q-chip>
            </div>
          </q-td>
        </template>

        <template #body-cell-options="props">
          <q-td :props="props">
            <div class="column q-gutter-xs">
              <q-badge
                rounded
                :color="
                  props.row.distributeInterestInInstallments
                    ? 'positive'
                    : 'grey-7'
                "
                text-color="white"
              >
                {{
                  props.row.distributeInterestInInstallments
                    ? "Interés en cuotas"
                    : "Interés no distribuido"
                }}
              </q-badge>

              <q-badge
                rounded
                :color="
                  props.row.amortizePrincipal
                    ? 'positive'
                    : 'grey-7'
                "
                text-color="white"
              >
                {{
                  props.row.amortizePrincipal
                    ? "Amortiza capital"
                    : "No amortiza capital"
                }}
              </q-badge>

              <q-badge
                rounded
                :color="
                  props.row.allowWithoutVacationGuarantee
                    ? 'orange-10'
                    : 'grey-7'
                "
                text-color="white"
              >
                {{
                  props.row.allowWithoutVacationGuarantee
                    ? "Permite sin garantía"
                    : "Requiere garantía"
                }}
              </q-badge>
            </div>
          </q-td>
        </template>

        <template #body-cell-bank="props">
          <q-td :props="props">
            <div class="text-weight-bold">
              {{ props.row.interestBankName || "-" }}
            </div>

            <div class="text-caption text-grey-7">
              {{
                maskAccount(
                  props.row.interestAccountNumber,
                )
              }}
            </div>

            <div class="text-caption text-grey-7">
              {{
                accountTypeLabel(
                  props.row.interestAccountType,
                )
              }}
              ·
              {{ props.row.interestCurrency || "DOP" }}
            </div>
          </q-td>
        </template>

        <template #body-cell-isDefault="props">
          <q-td :props="props">
            <q-badge
              rounded
              :color="
                props.row.isDefault
                  ? 'positive'
                  : 'grey-7'
              "
              text-color="white"
            >
              {{
                props.row.isDefault
                  ? "Predeterminada"
                  : "No"
              }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-isActive="props">
          <q-td :props="props">
            <q-badge
              rounded
              :color="
                props.row.isActive
                  ? 'positive'
                  : 'negative'
              "
              text-color="white"
            >
              {{
                props.row.isActive
                  ? "Activa"
                  : "Inactiva"
              }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" auto-width>
            <div
              class="row items-center no-wrap q-gutter-xs"
            >
              <q-btn
                dense
                round
                flat
                color="primary"
                icon="edit"
                @click="openDialog(props.row)"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>

              <q-btn
                dense
                round
                flat
                color="negative"
                icon="delete"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <template #no-data>
          <div
            class="full-width text-center q-pa-xl text-grey-7"
          >
            <q-icon
              name="account_balance_wallet"
              size="46px"
              color="grey-5"
            />

            <div
              class="text-subtitle1 text-weight-bold q-mt-sm"
            >
              No hay configuraciones registradas
            </div>

            <div class="text-caption">
              Crea la configuración principal para los
              préstamos de empleados.
            </div>
          </div>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialog.open" persistent>
      <q-card class="form-dialog">
        <q-inner-loading
          :showing="saving"
          label="Guardando configuración..."
          label-class="text-primary"
        />

        <q-card-section
          class="dialog-header bg-primary row items-center justify-between"
        >
          <div class="row items-center no-wrap text-white">
            <div class="dialog-icon">
              <q-icon
                name="account_balance_wallet"
                size="30px"
              />
            </div>

            <div>
              <div class="dialog-title">
                {{
                  dialog.isEdit
                    ? "Editar producto de préstamo"
                    : "Nuevo producto de préstamo"
                }}
              </div>

              <div class="dialog-subtitle">
                Define las reglas que usará el sistema
                principal para cotizar préstamos.
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
            @click="closeDialog"
          />
        </q-card-section>

        <q-card-section class="dialog-body">
          <q-banner
            v-if="formErrorMessage"
            rounded
            class="bg-red-1 text-red-10 q-mb-md"
          >
            <template #avatar>
              <q-icon
                name="warning"
                color="negative"
              />
            </template>

            {{ formErrorMessage }}
          </q-banner>

          <q-banner
            rounded
            class="bg-blue-1 text-primary q-mb-md"
          >
            <template #avatar>
              <q-icon
                name="info"
                color="primary"
              />
            </template>

            El monto máximo real del empleado se calcula
            utilizando los días permitidos por porcentaje, el
            límite fijo configurado y el salario diario. El
            campo “Monto máximo absoluto” funciona como límite
            monetario final del producto.
          </q-banner>

          <q-card
            flat
            bordered
            class="section-card q-mb-md"
          >
            <q-card-section>
              <div class="section-title">
                Datos generales
              </div>

              <div class="section-subtitle">
                Información base del producto de préstamo.
              </div>

              <div
                class="row q-col-gutter-md q-mt-sm"
              >
                <div class="col-12 col-md-6">
                  <div class="field-label required">
                    Nombre
                  </div>

                  <q-input
                    v-model="form.name"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: Préstamo estándar empleados"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <div class="field-label required">
                    Código
                  </div>

                  <q-input
                    v-model="form.code"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: EMPLOYEE_LOAN_STANDARD"
                    :disable="dialog.isEdit"
                    @update:model-value="
                      form.code = normalizeCode($event)
                    "
                  />
                </div>

                <div class="col-12">
                  <div class="field-label">
                    Descripción
                  </div>

                  <q-input
                    v-model="form.description"
                    outlined
                    dense
                    rounded
                    autogrow
                    color="primary"
                    type="textarea"
                    label="Descripción interna de esta configuración"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <div class="field-label">
                    Código producto externo
                  </div>

                  <q-input
                    v-model="form.externalProductCode"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: EMPLOYEE_VACATION_LOAN"
                    @update:model-value="
                      form.externalProductCode =
                        normalizeCode($event)
                    "
                  />
                </div>

                <div class="col-12 col-md-4">
                  <q-card
                    flat
                    bordered
                    class="switch-card"
                  >
                    <div>
                      <div
                        class="text-subtitle2 text-weight-bold"
                      >
                        Configuración predeterminada
                      </div>

                      <div
                        class="text-caption text-grey-7"
                      >
                        Se usará como configuración principal
                        activa.
                      </div>
                    </div>

                    <q-toggle
                      v-model="form.isDefault"
                      color="primary"
                    />
                  </q-card>
                </div>

                <div class="col-12 col-md-4">
                  <q-card
                    flat
                    bordered
                    class="switch-card"
                  >
                    <div>
                      <div
                        class="text-subtitle2 text-weight-bold"
                      >
                        Configuración activa
                      </div>

                      <div
                        class="text-caption text-grey-7"
                      >
                        Permite usar este producto en los
                        cálculos.
                      </div>
                    </div>

                    <q-toggle
                      v-model="form.isActive"
                      color="positive"
                    />
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card
            flat
            bordered
            class="section-card q-mb-md"
          >
            <q-card-section>
              <div class="section-title">
                Límites, cuotas e interés
              </div>

              <div class="section-subtitle">
                Define el rango del préstamo, cantidad de
                cuotas y forma de cobrar intereses.
              </div>

              <div
                class="row q-col-gutter-md q-mt-sm"
              >
                <div class="col-12 col-md-3">
                  <div class="field-label required">
                    Monto mínimo
                  </div>

                  <q-input
                    v-model.number="form.minLoanAmount"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    prefix="RD$"
                    min="0"
                  />
                </div>

                <div class="col-12 col-md-3">
                  <div class="field-label required">
                    Monto máximo absoluto
                  </div>

                  <q-input
                    v-model.number="form.maxLoanAmount"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    prefix="RD$"
                    min="0"
                  />

                  <div class="hint-text">
                    Este es el tope del producto, no el
                    cálculo por empleado.
                  </div>
                </div>

                <div class="col-12 col-md-3">
                  <div class="field-label required">
                    Cuotas mínimas
                  </div>

                  <q-input
                    v-model.number="form.minInstallments"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="1"
                    step="1"
                  />
                </div>

                <div class="col-12 col-md-3">
                  <div class="field-label required">
                    Cuotas máximas
                  </div>

                  <q-input
                    v-model.number="form.maxInstallments"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    min="1"
                    step="1"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <div class="field-label required">
                    Tasa de interés
                  </div>

                  <q-input
                    v-model.number="form.interestRate"
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    suffix="%"
                    min="0"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <div class="field-label required">
                    Tipo de tasa
                  </div>

                  <q-select
                    v-model="form.interestRateType"
                    outlined
                    dense
                    rounded
                    emit-value
                    map-options
                    color="primary"
                    :options="interestRateTypeOptions"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <div class="field-label required">
                    Frecuencia base de pago
                  </div>

                  <q-select
                    v-model="
                      form.defaultPaymentFrequency
                    "
                    outlined
                    dense
                    rounded
                    emit-value
                    map-options
                    color="primary"
                    :options="paymentFrequencyOptions"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-card
                    flat
                    bordered
                    class="switch-card"
                  >
                    <div>
                      <div
                        class="text-subtitle2 text-weight-bold"
                      >
                        Distribuir interés en cuotas
                      </div>

                      <div
                        class="text-caption text-grey-7"
                      >
                        El interés se reparte entre las cuotas
                        del préstamo.
                      </div>
                    </div>

                    <q-toggle
                      v-model="
                        form.distributeInterestInInstallments
                      "
                      color="primary"
                    />
                  </q-card>
                </div>

                <div class="col-12 col-md-6">
                  <q-card
                    flat
                    bordered
                    class="switch-card"
                  >
                    <div>
                      <div
                        class="text-subtitle2 text-weight-bold"
                      >
                        Amortizar capital
                      </div>

                      <div
                        class="text-caption text-grey-7"
                      >
                        Cada cuota reduce parte del capital
                        adeudado.
                      </div>
                    </div>

                    <q-toggle
                      v-model="form.amortizePrincipal"
                      color="primary"
                    />
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card
            flat
            bordered
            class="section-card q-mb-md"
          >
            <q-card-section>
              <div class="section-title">
                Garantía con vacaciones
              </div>

              <div class="section-subtitle">
                Controla cuántos días disponibles se pueden
                usar como garantía y cómo se valoran.
              </div>

              <div
                class="row q-col-gutter-md q-mt-sm"
              >
                <div class="col-12 col-sm-6 col-md-3">
                  <div class="field-label required">
                    Días mínimos requeridos
                  </div>

                  <q-input
                    v-model.number="
                      form.minimumVacationDaysRequired
                    "
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    suffix="día(s)"
                    min="0"
                    step="1"
                  />

                  <div class="hint-text">
                    Días disponibles que debe tener el
                    empleado para poder solicitar.
                  </div>
                </div>

                <div class="col-12 col-sm-6 col-md-3">
                  <div class="field-label required">
                    % máximo de garantía
                  </div>

                  <q-input
                    v-model.number="
                      form.maxVacationDaysGuaranteePercent
                    "
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    suffix="%"
                    min="0"
                    max="100"
                  />

                  <div class="hint-text">
                    Ej: 50 permite utilizar hasta el 50% de
                    los días disponibles.
                  </div>
                </div>

                <div class="col-12 col-sm-6 col-md-3">
                  <div class="field-label required">
                    Cantidad máxima de días
                  </div>

                  <q-input
                    v-model.number="
                      form.maxVacationGuaranteeDays
                    "
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    suffix="día(s)"
                    min="0"
                    step="1"
                  />

                  <div class="hint-text">
                    Es el tope fijo. Usa 0 para no establecer
                    un límite fijo.
                  </div>
                </div>

                <div class="col-12 col-sm-6 col-md-3">
                  <div class="field-label required">
                    Valor del día
                  </div>

                  <q-select
                    v-model="form.vacationDayValueMode"
                    outlined
                    dense
                    rounded
                    emit-value
                    map-options
                    color="primary"
                    :options="
                      vacationDayValueModeOptions
                    "
                  />
                </div>

                <div
                  v-if="
                    form.vacationDayValueMode ===
                    'CUSTOM_AMOUNT'
                  "
                  class="col-12 col-sm-6 col-md-3"
                >
                  <div class="field-label required">
                    Valor fijo por día
                  </div>

                  <q-input
                    v-model.number="
                      form.customVacationDayAmount
                    "
                    type="number"
                    outlined
                    dense
                    rounded
                    color="primary"
                    prefix="RD$"
                    min="0"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-card
                    flat
                    bordered
                    class="switch-card"
                  >
                    <div>
                      <div
                        class="text-subtitle2 text-weight-bold"
                      >
                        Permitir usar todos los días
                      </div>

                      <div
                        class="text-caption text-grey-7"
                      >
                        Permite utilizar el último día
                        disponible cuando los demás límites
                        también lo permitan.
                      </div>
                    </div>

                    <q-toggle
                      v-model="
                        form.allowUseAllVacationDays
                      "
                      color="warning"
                    />
                  </q-card>
                </div>

                <div class="col-12 col-md-6">
                  <q-card
                    flat
                    bordered
                    class="switch-card"
                  >
                    <div>
                      <div
                        class="text-subtitle2 text-weight-bold"
                      >
                        Permitir sin garantía
                      </div>

                      <div
                        class="text-caption text-grey-7"
                      >
                        Permite préstamo aunque no se usen
                        vacaciones como garantía.
                      </div>
                    </div>

                    <q-toggle
                      v-model="
                        form.allowWithoutVacationGuarantee
                      "
                      color="warning"
                    />
                  </q-card>
                </div>

                <div class="col-12">
                  <q-banner
                    rounded
                    class="bg-orange-1 text-orange-10"
                  >
                    <template #avatar>
                      <q-icon
                        name="calculate"
                        color="orange-10"
                      />
                    </template>

                    Ejemplo con 10 días disponibles: el
                    porcentaje permite utilizar
                    <b>
                      {{ guaranteeExampleByPercent }}
                      día(s)
                    </b>
                    y el resultado final, después de aplicar
                    el límite fijo, es
                    <b>
                      {{ guaranteeExampleDays }}
                      día(s)
                    </b>.
                  </q-banner>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card
            flat
            bordered
            class="section-card"
          >
            <q-card-section>
              <div class="section-title">
                Datos bancarios para intereses
              </div>

              <div class="section-subtitle">
                Cuenta donde se depositarán los intereses
                generados por los préstamos.
              </div>

              <div
                class="row q-col-gutter-md q-mt-sm"
              >
                <div class="col-12 col-md-6">
                  <div class="field-label required">
                    Banco
                  </div>

                  <q-input
                    v-model="form.interestBankName"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: Banco Popular"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <div class="field-label">
                    Código banco
                  </div>

                  <q-input
                    v-model="form.interestBankCode"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: 10101070"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <div class="field-label required">
                    Número de cuenta
                  </div>

                  <q-input
                    v-model="
                      form.interestAccountNumber
                    "
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Número de cuenta"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <div class="field-label required">
                    Tipo de cuenta
                  </div>

                  <q-select
                    v-model="
                      form.interestAccountType
                    "
                    outlined
                    dense
                    rounded
                    emit-value
                    map-options
                    color="primary"
                    :options="accountTypeOptions"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <div class="field-label required">
                    Moneda
                  </div>

                  <q-input
                    v-model="form.interestCurrency"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: DOP"
                    @update:model-value="
                      form.interestCurrency =
                        normalizeCurrency($event)
                    "
                  />
                </div>

                <div class="col-12 col-md-6">
                  <div class="field-label required">
                    Beneficiario
                  </div>

                  <q-input
                    v-model="
                      form.interestBeneficiaryName
                    "
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Nombre del beneficiario"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <div class="field-label">
                    Documento / RNC
                  </div>

                  <q-input
                    v-model="
                      form.interestBeneficiaryDocument
                    "
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Cédula, RNC o documento"
                  />
                </div>

                <div class="col-12">
                  <div class="field-label">
                    Instrucciones de pago
                  </div>

                  <q-input
                    v-model="
                      form.interestPaymentInstructions
                    "
                    outlined
                    dense
                    rounded
                    autogrow
                    color="primary"
                    type="textarea"
                    label="Notas internas o instrucciones para el depósito"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
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
            icon="close"
            label="Cancelar"
            :disable="saving"
            @click="closeDialog"
          />

          <q-btn
            unelevated
            rounded
            no-caps
            color="primary"
            icon="save"
            label="Guardar"
            :loading="saving"
            :disable="formHasError"
            @click="save"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref,
} from "vue";
import { useQuasar } from "quasar";

import methodsHttp from "src/api/methodsHttp";

const emit = defineEmits(["loading"]);

const $q = useQuasar();

const API_BASE = "employee-loan/product-config";

const loading = ref(false);
const saving = ref(false);
const rows = ref([]);

const dialog = ref({
  open: false,
  isEdit: false,
  id: null,
});

const defaultForm = () => ({
  name: "",
  code: "EMPLOYEE_LOAN_STANDARD",
  description: "",

  minLoanAmount: 1000,
  maxLoanAmount: 50000,

  minInstallments: 1,
  maxInstallments: 12,

  interestRate: 0,
  interestRateType: "ANNUAL",
  defaultPaymentFrequency: "BIWEEKLY",

  distributeInterestInInstallments: true,
  amortizePrincipal: true,

  minimumVacationDaysRequired: 1,

  maxVacationDaysGuaranteePercent: 100,

  /**
   * 0 significa que no existe un límite fijo.
   * En ese caso solamente se aplica el porcentaje.
   */
  maxVacationGuaranteeDays: 0,

  vacationDayValueMode: "DAILY_SALARY",
  customVacationDayAmount: 0,

  allowUseAllVacationDays: false,
  allowWithoutVacationGuarantee: false,

  externalProductCode:
    "EMPLOYEE_VACATION_LOAN",

  interestBankName: "",
  interestBankCode: "",
  interestAccountNumber: "",
  interestAccountType: "SAVINGS",
  interestCurrency: "DOP",
  interestBeneficiaryName: "",
  interestBeneficiaryDocument: "",
  interestPaymentInstructions: "",

  isDefault: true,
  isActive: true,
});

const form = ref(defaultForm());

const columns = [
  {
    name: "actions",
    label: "Acciones",
    align: "center",
    field: () => "",
  },
  {
    name: "name",
    label: "Producto",
    align: "left",
    field: "name",
  },
  {
    name: "interestRate",
    label: "Tasa",
    align: "left",
    field: "interestRate",
  },
  {
    name: "amounts",
    label: "Montos",
    align: "left",
    field: "maxLoanAmount",
  },
  {
    name: "installments",
    label: "Cuotas",
    align: "center",
    field: () => "",
  },
  {
    name: "vacationRules",
    label: "Vacaciones",
    align: "left",
    field: () => "",
  },
  {
    name: "options",
    label: "Opciones",
    align: "left",
    field: () => "",
  },
  {
    name: "bank",
    label: "Banco",
    align: "left",
    field: "interestBankName",
  },
  {
    name: "isDefault",
    label: "Default",
    align: "center",
    field: "isDefault",
  },
  {
    name: "isActive",
    label: "Estado",
    align: "center",
    field: "isActive",
  },
];

const interestRateTypeOptions = [
  {
    label: "Anual",
    value: "ANNUAL",
  },
  {
    label: "Mensual",
    value: "MONTHLY",
  },
  {
    label: "Fija",
    value: "FIXED",
  },
];

const paymentFrequencyOptions = [
  {
    label: "Semanal",
    value: "WEEKLY",
  },
  {
    label: "Quincenal",
    value: "BIWEEKLY",
  },
  {
    label: "Semi mensual",
    value: "SEMIMONTHLY",
  },
  {
    label: "Mensual",
    value: "MONTHLY",
  },
];

const vacationDayValueModeOptions = [
  {
    label: "Sueldo diario del empleado",
    value: "DAILY_SALARY",
  },
  {
    label: "Monto fijo por día",
    value: "CUSTOM_AMOUNT",
  },
  {
    label: "No valorar vacaciones",
    value: "NONE",
  },
];

const accountTypeOptions = [
  {
    label: "Cuenta corriente",
    value: "CHECKING",
  },
  {
    label: "Cuenta de ahorro",
    value: "SAVINGS",
  },
  {
    label: "Cuenta empresarial",
    value: "BUSINESS",
  },
  {
    label: "Otra",
    value: "OTHER",
  },
];

const formErrorMessage = computed(() => {
  if (!String(form.value.name || "").trim()) {
    return "El nombre es requerido.";
  }

  if (!String(form.value.code || "").trim()) {
    return "El código es requerido.";
  }

  if (
    Number(form.value.minLoanAmount || 0) < 0
  ) {
    return "El monto mínimo no puede ser negativo.";
  }

  if (
    Number(form.value.maxLoanAmount || 0) <= 0
  ) {
    return "El monto máximo debe ser mayor a 0.";
  }

  if (
    Number(form.value.minLoanAmount || 0) >
    Number(form.value.maxLoanAmount || 0)
  ) {
    return "El monto mínimo no puede ser mayor que el monto máximo.";
  }

  const minInstallments = Number(
    form.value.minInstallments || 0,
  );

  const maxInstallments = Number(
    form.value.maxInstallments || 0,
  );

  if (
    minInstallments < 1 ||
    !Number.isInteger(minInstallments)
  ) {
    return "Las cuotas mínimas deben ser un número entero mayor o igual a 1.";
  }

  if (
    maxInstallments < minInstallments ||
    !Number.isInteger(maxInstallments)
  ) {
    return "Las cuotas máximas deben ser un número entero mayor o igual a las cuotas mínimas.";
  }

  if (
    Number(form.value.interestRate || 0) < 0
  ) {
    return "La tasa de interés no puede ser negativa.";
  }

  const minimumVacationDaysRequired = Number(
    form.value.minimumVacationDaysRequired || 0,
  );

  if (
    minimumVacationDaysRequired < 0 ||
    !Number.isInteger(
      minimumVacationDaysRequired,
    )
  ) {
    return "Los días mínimos requeridos deben ser un número entero mayor o igual a 0.";
  }

  const guaranteePercent = Number(
    form.value
      .maxVacationDaysGuaranteePercent || 0,
  );

  if (
    guaranteePercent < 0 ||
    guaranteePercent > 100
  ) {
    return "El porcentaje máximo de garantía debe estar entre 0 y 100.";
  }

  const maxVacationGuaranteeDays = Number(
    form.value.maxVacationGuaranteeDays || 0,
  );

  if (
    maxVacationGuaranteeDays < 0 ||
    !Number.isInteger(
      maxVacationGuaranteeDays,
    )
  ) {
    return "La cantidad máxima de días debe ser un número entero mayor o igual a 0.";
  }

  if (
    form.value.vacationDayValueMode ===
      "CUSTOM_AMOUNT" &&
    Number(
      form.value.customVacationDayAmount || 0,
    ) <= 0
  ) {
    return "Debes indicar un valor fijo por día mayor a 0.";
  }

  if (
    !String(
      form.value.interestBankName || "",
    ).trim()
  ) {
    return "El banco es requerido.";
  }

  if (
    !String(
      form.value.interestAccountNumber || "",
    ).trim()
  ) {
    return "El número de cuenta es requerido.";
  }

  if (
    !String(
      form.value.interestCurrency || "",
    ).trim()
  ) {
    return "La moneda es requerida.";
  }

  if (
    !String(
      form.value.interestBeneficiaryName || "",
    ).trim()
  ) {
    return "El beneficiario es requerido.";
  }

  return "";
});

const formHasError = computed(() =>
  Boolean(formErrorMessage.value),
);

const guaranteeExampleByPercent = computed(() => {
  const availableDays = 10;

  const percent = Math.min(
    100,
    Math.max(
      0,
      Number(
        form.value
          .maxVacationDaysGuaranteePercent || 0,
      ),
    ),
  );

  let result = Math.floor(
    (availableDays * percent) / 100,
  );

  if (!form.value.allowUseAllVacationDays) {
    result = Math.min(
      result,
      Math.max(availableDays - 1, 0),
    );
  }

  return Math.max(0, result);
});

const guaranteeExampleDays = computed(() => {
  const maxByPercent =
    guaranteeExampleByPercent.value;

  const fixedLimit = Math.max(
    0,
    Math.floor(
      Number(
        form.value.maxVacationGuaranteeDays ||
          0,
      ),
    ),
  );

  if (fixedLimit <= 0) {
    return maxByPercent;
  }

  return Math.min(maxByPercent, fixedLimit);
});

onMounted(async () => {
  await reload();
});

const reload = async () => {
  loading.value = true;
  emit("loading", true);

  try {
    const resp =
      await methodsHttp.getApi(API_BASE);

    if (resp?.ok) {
      rows.value =
        resp.configs || resp.data || [];

      return;
    }

    rows.value = [];
  } catch (error) {
    console.error(
      "reload product config error:",
      error,
    );

    rows.value = [];

    $q.notify({
      type: "negative",
      message:
        "Error cargando configuración de préstamos.",
    });
  } finally {
    loading.value = false;
    emit("loading", false);
  }
};

const openDialog = (row = null) => {
  if (row) {
    dialog.value = {
      open: true,
      isEdit: true,
      id: row._id,
    };

    form.value = {
      ...defaultForm(),
      ...row,

      code: normalizeCode(row.code),

      externalProductCode: normalizeCode(
        row.externalProductCode,
      ),

      interestCurrency: normalizeCurrency(
        row.interestCurrency || "DOP",
      ),

      maxVacationGuaranteeDays: Math.max(
        0,
        Math.floor(
          Number(
            row.maxVacationGuaranteeDays ||
              0,
          ),
        ),
      ),
    };

    return;
  }

  dialog.value = {
    open: true,
    isEdit: false,
    id: null,
  };

  form.value = defaultForm();
};

const resetDialog = () => {
  dialog.value = {
    open: false,
    isEdit: false,
    id: null,
  };

  form.value = defaultForm();
};

const closeDialog = () => {
  if (saving.value) return;

  resetDialog();
};

const normalizeCode = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
};

const normalizeCurrency = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
};

const buildPayload = () => ({
  name: String(form.value.name || "").trim(),

  code: normalizeCode(form.value.code),

  description: String(
    form.value.description || "",
  ).trim(),

  minLoanAmount: Number(
    form.value.minLoanAmount || 0,
  ),

  maxLoanAmount: Number(
    form.value.maxLoanAmount || 0,
  ),

  minInstallments: Math.floor(
    Number(form.value.minInstallments || 1),
  ),

  maxInstallments: Math.floor(
    Number(form.value.maxInstallments || 1),
  ),

  interestRate: Number(
    form.value.interestRate || 0,
  ),

  interestRateType: String(
    form.value.interestRateType || "ANNUAL",
  ).toUpperCase(),

  defaultPaymentFrequency: String(
    form.value.defaultPaymentFrequency ||
      "BIWEEKLY",
  ).toUpperCase(),

  distributeInterestInInstallments: Boolean(
    form.value
      .distributeInterestInInstallments,
  ),

  amortizePrincipal: Boolean(
    form.value.amortizePrincipal,
  ),

  minimumVacationDaysRequired: Math.max(
    0,
    Math.floor(
      Number(
        form.value
          .minimumVacationDaysRequired || 0,
      ),
    ),
  ),

  maxVacationDaysGuaranteePercent: Number(
    form.value
      .maxVacationDaysGuaranteePercent || 0,
  ),

  maxVacationGuaranteeDays: Math.max(
    0,
    Math.floor(
      Number(
        form.value.maxVacationGuaranteeDays ||
          0,
      ),
    ),
  ),

  vacationDayValueMode: String(
    form.value.vacationDayValueMode ||
      "DAILY_SALARY",
  ).toUpperCase(),

  customVacationDayAmount: Number(
    form.value.customVacationDayAmount || 0,
  ),

  allowUseAllVacationDays: Boolean(
    form.value.allowUseAllVacationDays,
  ),

  allowWithoutVacationGuarantee: Boolean(
    form.value
      .allowWithoutVacationGuarantee,
  ),

  externalProductCode: normalizeCode(
    form.value.externalProductCode,
  ),

  interestBankName: String(
    form.value.interestBankName || "",
  ).trim(),

  interestBankCode: String(
    form.value.interestBankCode || "",
  ).trim(),

  interestAccountNumber: String(
    form.value.interestAccountNumber || "",
  ).trim(),

  interestAccountType: String(
    form.value.interestAccountType ||
      "SAVINGS",
  ).toUpperCase(),

  interestCurrency: normalizeCurrency(
    form.value.interestCurrency || "DOP",
  ),

  interestBeneficiaryName: String(
    form.value.interestBeneficiaryName || "",
  ).trim(),

  interestBeneficiaryDocument: String(
    form.value.interestBeneficiaryDocument ||
      "",
  ).trim(),

  interestPaymentInstructions: String(
    form.value.interestPaymentInstructions ||
      "",
  ).trim(),

  isDefault: Boolean(form.value.isDefault),

  isActive: Boolean(form.value.isActive),
});

const save = async () => {
  if (formHasError.value) {
    $q.notify({
      type: "warning",
      message: formErrorMessage.value,
    });

    return;
  }

  saving.value = true;

  try {
    const payload = buildPayload();

    const resp = dialog.value.isEdit
      ? await methodsHttp.putApi(
          `${API_BASE}/${dialog.value.id}`,
          payload,
        )
      : await methodsHttp.postApi(
          API_BASE,
          payload,
        );

    if (resp?.ok) {
      $q.notify({
        type: "positive",
        message:
          resp.mensaje ||
          "Configuración guardada correctamente.",
      });

      resetDialog();
      await reload();

      return;
    }

    $q.notify({
      type: "negative",
      message:
        resp?.mensaje ||
        "No se pudo guardar la configuración.",
    });
  } catch (error) {
    console.error(
      "save product config error:",
      error,
    );

    $q.notify({
      type: "negative",
      message:
        error?.response?.data?.mensaje ||
        "Error guardando configuración.",
    });
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (row) => {
  $q.dialog({
    title: "Eliminar configuración",

    message:
      `¿Seguro que deseas eliminar la configuración ${row.name}?`,

    cancel: true,
    persistent: true,

    ok: {
      label: "Eliminar",
      color: "negative",
      rounded: true,
      unelevated: true,
      noCaps: true,
    },

    cancel: {
      label: "Cancelar",
      flat: true,
      rounded: true,
      noCaps: true,
    },
  }).onOk(async () => {
    await remove(row);
  });
};

const remove = async (row) => {
  if (!row?._id) return;

  loading.value = true;

  try {
    const resp =
      await methodsHttp.deleteApi(
        `${API_BASE}/${row._id}`,
      );

    if (resp?.ok) {
      $q.notify({
        type: "positive",
        message:
          resp.mensaje ||
          "Configuración eliminada correctamente.",
      });

      await reload();

      return;
    }

    $q.notify({
      type: "negative",
      message:
        resp?.mensaje ||
        "No se pudo eliminar la configuración.",
    });
  } catch (error) {
    console.error(
      "delete product config error:",
      error,
    );

    $q.notify({
      type: "negative",
      message:
        error?.response?.data?.mensaje ||
        "Error eliminando configuración.",
    });
  } finally {
    loading.value = false;
  }
};

const money = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount);
};

const numberValue = (value) => {
  const number = Number(value || 0);

  return Number.isInteger(number)
    ? number
    : number.toFixed(2);
};

const interestRateTypeLabel = (value) => {
  const map = {
    ANNUAL: "anual",
    MONTHLY: "mensual",
    FIXED: "fija",
  };

  return (
    map[
      String(value || "").toUpperCase()
    ] || ""
  );
};

const paymentFrequencyLabel = (value) => {
  const map = {
    WEEKLY: "Pago semanal",
    BIWEEKLY: "Pago quincenal",
    SEMIMONTHLY: "Pago semi mensual",
    MONTHLY: "Pago mensual",
  };

  return (
    map[
      String(value || "").toUpperCase()
    ] || "-"
  );
};

const vacationDayValueModeLabel = (
  value,
) => {
  const map = {
    DAILY_SALARY: "Sueldo diario",
    CUSTOM_AMOUNT: "Monto fijo",
    NONE: "Sin valoración",
  };

  return (
    map[
      String(value || "").toUpperCase()
    ] || "-"
  );
};

const accountTypeLabel = (value) => {
  const map = {
    CHECKING: "Corriente",
    SAVINGS: "Ahorro",
    BUSINESS: "Empresarial",
    OTHER: "Otra",
  };

  return (
    map[
      String(value || "").toUpperCase()
    ] || "-"
  );
};

const fixedGuaranteeDaysLabel = (value) => {
  const days = Math.max(
    0,
    Math.floor(Number(value || 0)),
  );

  if (days <= 0) {
    return "Sin tope fijo";
  }

  return `Máx. ${days} día(s)`;
};

const maskAccount = (value) => {
  const text = String(value || "");

  if (!text) return "-";

  if (text.length <= 4) {
    return text;
  }

  return `****${text.slice(-4)}`;
};

defineExpose({
  reload,
});
</script>

<style scoped>
.loan-config-tab {
  min-height: 400px;
}

.panel-card {
  overflow: hidden;
  border-radius: 22px;
  background: white;
  box-shadow:
    0 16px 44px rgba(15, 23, 42, 0.04);
}

.panel-header {
  min-height: 82px;
  background: white;
}

.panel-title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.panel-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}

.main-table {
  background: white;
}

.amount-text {
  color: #0f172a;
  font-weight: 900;
}

.form-dialog {
  width: 1160px;
  max-width: 96vw;
  max-height: 92vh;
  overflow: hidden;
  border-radius: 22px;
}

.dialog-header {
  min-height: 78px;
  padding: 16px 20px;
}

.dialog-icon {
  display: grid;
  width: 46px;
  min-width: 46px;
  height: 46px;
  margin-right: 12px;
  place-items: center;
  border: 1px solid
    rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  background:
    rgba(255, 255, 255, 0.14);
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
  max-height: calc(92vh - 150px);
  overflow-y: auto;
  padding: 18px;
  background: #f8fafc;
}

.dialog-actions {
  padding: 14px 18px;
  background: white;
}

.section-card {
  border: 1px solid
    rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background: white;
  box-shadow:
    0 14px 32px rgba(15, 23, 42, 0.04);
}

.section-title {
  color: #0f172a;
  font-size: 0.98rem;
  font-weight: 900;
}

.section-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}

.field-label {
  margin-bottom: 6px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.field-label.required::before {
  color: #e53935;
  content: "* ";
}

.hint-text {
  margin-top: 5px;
  color: #64748b;
  font-size: 0.76rem;
}

.switch-card {
  display: flex;
  min-height: 86px;
  padding: 14px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: 18px;
  background: #f8fafc;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .panel-header > .row {
    width: 100%;
  }

  .panel-header > .row .q-btn {
    flex: 1;
  }

  .switch-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .dialog-header {
    align-items: flex-start;
  }

  .dialog-subtitle {
    max-width: 70vw;
  }
}
</style>