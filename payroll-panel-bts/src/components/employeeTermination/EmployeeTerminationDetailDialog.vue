<template>
  <div>
    <q-dialog
      :model-value="modelValue"
      persistent
      @update:model-value="emit('update:modelValue', $event)"
    >
      <q-card class="detail-dialog">
        <q-inner-loading
          :showing="loading || actionLoading"
          :label="loadingLabel"
          label-class="text-primary"
          label-style="font-size: 1.05em"
          class="z-max"
        />

        <!-- Header -->

        <q-card-section class="detail-header bg-primary text-white">
          <div class="detail-header-content">
            <div class="row items-center no-wrap detail-header-main">
              <q-avatar
                size="50px"
                color="white"
                text-color="primary"
                icon="person_remove"
              />

              <div class="q-ml-md detail-header-text">
                <div class="detail-title">
                  Detalle de desvinculación
                </div>

                <div class="detail-subtitle">
                  {{ terminationNumber }}
                </div>
              </div>
            </div>

            <div class="row items-center no-wrap q-gutter-sm">
              <q-chip
                v-if="detail"
                dense
                :color="statusConfig.background"
                :text-color="statusConfig.color"
                :icon="statusConfig.icon"
              >
                {{ statusConfig.label }}
              </q-chip>

              <q-btn
                flat
                round
                dense
                color="white"
                icon="close"
                :disable="loading || actionLoading"
                @click="closeDialog"
              />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Contenido -->

        <q-card-section class="detail-body">
          <div v-if="detail">
            <!-- Resumen principal -->

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-5">
                <q-card flat bordered class="employee-card">
                  <div class="row items-center no-wrap">
                    <q-avatar size="56px" class="employee-avatar">
                      <q-img
                        v-if="employeeImage"
                        :src="employeeImage"
                        fit="cover"
                        spinner-color="primary"
                      />

                      <span v-else>
                        {{ getInitials(employeeName) }}
                      </span>
                    </q-avatar>

                    <div class="q-ml-md col employee-information">
                      <div class="employee-name">
                        {{ employeeName }}
                      </div>

                      <div class="text-caption text-grey-7 ellipsis">
                        {{ employeeEmail }}
                      </div>

                      <div class="row q-gutter-xs q-mt-xs">
                        <q-chip
                          dense
                          color="blue-1"
                          text-color="primary"
                          icon="work"
                        >
                          {{ employeeJobPosition }}
                        </q-chip>

                        <q-chip
                          v-if="employeeCode"
                          dense
                          color="grey-2"
                          text-color="grey-9"
                          icon="badge"
                        >
                          {{ employeeCode }}
                        </q-chip>
                      </div>
                    </div>
                  </div>
                </q-card>
              </div>

              <div class="col-12 col-md-7">
                <div class="row q-col-gutter-md full-height">
                  <div class="col-12 col-sm-4">
                    <q-card flat bordered class="metric-card">
                      <div class="metric-label">
                        Total ingresos
                      </div>

                      <div class="metric-value text-positive">
                        {{ money(calculation.totalIncome) }}
                      </div>
                    </q-card>
                  </div>

                  <div class="col-12 col-sm-4">
                    <q-card flat bordered class="metric-card">
                      <div class="metric-label">
                        Deducciones
                      </div>

                      <div class="metric-value text-negative">
                        {{ money(calculation.totalDeductions) }}
                      </div>
                    </q-card>
                  </div>

                  <div class="col-12 col-sm-4">
                    <q-card flat bordered class="metric-card net-metric">
                      <div class="metric-label">
                        Neto a pagar
                      </div>

                      <div class="metric-value text-primary">
                        {{ money(calculation.netTotal) }}
                      </div>
                    </q-card>
                  </div>
                </div>
              </div>
            </div>

            <!-- Advertencia de préstamo pendiente -->

            <q-banner
              v-if="
                loanSnapshot.hasActiveLoans &&
                Number(loanSnapshot.remainingOutstanding || 0) > 0
              "
              class="bg-orange-1 text-orange-10 rounded-banner q-mt-md"
            >
              <template #avatar>
                <q-icon name="warning" color="orange-10" />
              </template>

              <div class="text-weight-bold">
                La liquidación no cubre completamente la deuda del empleado.
              </div>

              <div class="text-caption">
                Después de aplicar
                {{ money(loanSnapshot.totalDeducted) }}, quedará pendiente
                {{ money(loanSnapshot.remainingOutstanding) }}.
              </div>
            </q-banner>

            <!-- Tabs -->

            <q-tabs
              v-model="activeTab"
              dense
              active-color="primary"
              indicator-color="primary"
              align="left"
              narrow-indicator
              class="detail-tabs q-mt-md"
            >
              <q-tab
                name="summary"
                icon="dashboard"
                label="Resumen"
              />

              <q-tab
                name="calculation"
                icon="calculate"
                label="Cálculo"
              />

              <q-tab
                name="loans"
                icon="account_balance_wallet"
                label="Préstamos"
              >
                <q-badge
                  v-if="loanSnapshot.hasActiveLoans"
                  floating
                  color="negative"
                  :label="loanSnapshot.totalLoans || 0"
                />
              </q-tab>

              <q-tab
                name="history"
                icon="history"
                label="Historial"
              />

              <q-tab
                name="payment"
                icon="payments"
                label="Pago"
              />
            </q-tabs>

            <q-tab-panels
              v-model="activeTab"
              animated
              class="bg-transparent q-mt-md"
            >
              <!-- Resumen -->

              <q-tab-panel name="summary" class="q-pa-none">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-card flat bordered class="section-card">
                      <div class="section-header">
                        <q-avatar
                          color="purple-1"
                          text-color="purple-10"
                          icon="assignment"
                          size="40px"
                        />

                        <div>
                          <div class="section-title">
                            Información de salida
                          </div>

                          <div class="section-subtitle">
                            Datos principales de la desvinculación.
                          </div>
                        </div>
                      </div>

                      <div class="detail-grid q-mt-md">
                        <div class="detail-item">
                          <span>Tipo</span>

                          <strong>
                            {{ terminationTypeLabel }}
                          </strong>
                        </div>

                        <div class="detail-item">
                          <span>Código</span>

                          <strong>
                            {{ detail.terminationType || "N/A" }}
                          </strong>
                        </div>

                        <div class="detail-item">
                          <span>Fecha de contratación</span>

                          <strong>
                            {{ formatDate(employeeHiringDate) }}
                          </strong>
                        </div>

                        <div class="detail-item">
                          <span>Fecha de salida</span>

                          <strong>
                            {{ formatDate(detail.terminationDate) }}
                          </strong>
                        </div>

                        <div class="detail-item">
                          <span>Antigüedad</span>

                          <strong>
                            {{ seniorityText }}
                          </strong>
                        </div>

                        <div class="detail-item">
                          <span>Preaviso entregado</span>

                          <strong>
                            {{ detail.noticeGiven ? "Sí" : "No" }}
                          </strong>
                        </div>

                        <div
                          v-if="detail.noticeDate"
                          class="detail-item"
                        >
                          <span>Fecha de preaviso</span>

                          <strong>
                            {{ formatDate(detail.noticeDate) }}
                          </strong>
                        </div>

                        <div class="detail-item">
                          <span>Estado</span>

                          <strong>
                            {{ statusConfig.label }}
                          </strong>
                        </div>
                      </div>
                    </q-card>
                  </div>

                  <div class="col-12 col-md-6">
                    <q-card flat bordered class="section-card">
                      <div class="section-header">
                        <q-avatar
                          color="blue-1"
                          text-color="primary"
                          icon="policy"
                          size="40px"
                        />

                        <div>
                          <div class="section-title">
                            Política y salario
                          </div>

                          <div class="section-subtitle">
                            Configuración usada para generar el cálculo.
                          </div>
                        </div>
                      </div>

                      <div class="detail-grid q-mt-md">
                        <div class="detail-item">
                          <span>Política</span>

                          <strong>
                            {{ policyName }}
                          </strong>
                        </div>

                        <div class="detail-item">
                          <span>Versión</span>

                          <strong>
                            {{ policyVersion }}
                          </strong>
                        </div>

                        <div class="detail-item">
                          <span>Salario diario</span>

                          <strong>
                            {{ money(detail.salarySnapshot?.dailySalary) }}
                          </strong>
                        </div>

                        <div class="detail-item">
                          <span>Salario base</span>

                          <strong>
                            {{ money(selectedMonthlySalary) }}
                          </strong>
                        </div>

                        <div class="detail-item">
                          <span>Divisor diario</span>

                          <strong>
                            {{
                              detail.salarySnapshot?.dailySalaryDivisor ||
                              "N/A"
                            }}
                          </strong>
                        </div>

                        <div class="detail-item">
                          <span>Estrategia salarial</span>

                          <strong>
                            {{ salaryStrategyLabel }}
                          </strong>
                        </div>
                      </div>
                    </q-card>
                  </div>

                  <div class="col-12">
                    <q-card flat bordered class="section-card">
                      <div class="section-header">
                        <q-avatar
                          color="orange-1"
                          text-color="orange-10"
                          icon="notes"
                          size="40px"
                        />

                        <div>
                          <div class="section-title">
                            Razón y comentarios
                          </div>

                          <div class="section-subtitle">
                            Información registrada por Recursos Humanos.
                          </div>
                        </div>
                      </div>

                      <div class="reason-box q-mt-md">
                        {{
                          detail.reason ||
                          "No se registró una razón para esta desvinculación."
                        }}
                      </div>
                    </q-card>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Cálculo -->

              <q-tab-panel name="calculation" class="q-pa-none">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6 col-md-3">
                    <q-card flat bordered class="metric-card">
                      <div class="metric-label">
                        Ingresos automáticos
                      </div>

                      <div class="metric-value text-positive">
                        {{ money(calculation.automaticIncome) }}
                      </div>
                    </q-card>
                  </div>

                  <div class="col-12 col-sm-6 col-md-3">
                    <q-card flat bordered class="metric-card">
                      <div class="metric-label">
                        Ingresos manuales
                      </div>

                      <div class="metric-value text-primary">
                        {{ money(calculation.manualIncome) }}
                      </div>
                    </q-card>
                  </div>

                  <div class="col-12 col-sm-6 col-md-3">
                    <q-card flat bordered class="metric-card">
                      <div class="metric-label">
                        Deducciones
                      </div>

                      <div class="metric-value text-negative">
                        {{ money(calculation.totalDeductions) }}
                      </div>
                    </q-card>
                  </div>

                  <div class="col-12 col-sm-6 col-md-3">
                    <q-card flat bordered class="metric-card net-metric">
                      <div class="metric-label">
                        Neto
                      </div>

                      <div class="metric-value text-primary">
                        {{ money(calculation.netTotal) }}
                      </div>
                    </q-card>
                  </div>

                  <div class="col-12">
                    <q-card flat bordered class="section-card">
                      <div class="section-header q-mb-md">
                        <q-avatar
                          color="blue-1"
                          text-color="primary"
                          icon="format_list_bulleted"
                          size="40px"
                        />

                        <div>
                          <div class="section-title">
                            Detalle del cálculo
                          </div>

                          <div class="section-subtitle">
                            Ingresos y deducciones incluidos en la liquidación.
                          </div>
                        </div>
                      </div>

                      <q-table
                        flat
                        bordered
                        :row-key="getCalculationLineKey"
                        :rows="calculationLines"
                        :columns="calculationColumns"
                        :rows-per-page-options="[0]"
                        hide-pagination
                        class="calculation-table"
                      >
                        <template #no-data>
                          <div class="full-width text-center q-pa-xl">
                            <q-icon
                              name="receipt_long"
                              size="48px"
                              color="grey-5"
                            />

                            <div class="text-grey-7 q-mt-sm">
                              No hay líneas de cálculo disponibles.
                            </div>
                          </div>
                        </template>

                        <template #body-cell-label="tableProps">
                          <q-td :props="tableProps">
                            <div class="text-weight-bold">
                              {{
                                tableProps.row.label ||
                                humanizeCode(tableProps.row.code)
                              }}
                            </div>

                            <div class="text-caption text-grey-7">
                              {{ tableProps.row.code }}
                            </div>

                            <div
                              v-if="tableProps.row.reason"
                              class="text-caption text-grey-7"
                            >
                              {{ tableProps.row.reason }}
                            </div>
                          </q-td>
                        </template>

                        <template #body-cell-type="tableProps">
                          <q-td :props="tableProps">
                            <q-badge
                              rounded
                              :color="
                                tableProps.row.type === 'EARNING'
                                  ? 'positive'
                                  : 'negative'
                              "
                              :label="
                                tableProps.row.type === 'EARNING'
                                  ? 'Ingreso'
                                  : 'Deducción'
                              "
                            />
                          </q-td>
                        </template>

                        <template #body-cell-source="tableProps">
                          <q-td :props="tableProps">
                            <q-badge
                              rounded
                              :color="
                                tableProps.row.source === 'AUTOMATIC'
                                  ? 'primary'
                                  : 'warning'
                              "
                              :label="
                                tableProps.row.source === 'AUTOMATIC'
                                  ? 'Automático'
                                  : 'Manual'
                              "
                            />
                          </q-td>
                        </template>

                        <template #body-cell-days="tableProps">
                          <q-td :props="tableProps">
                            {{ number(tableProps.row.days) }}
                          </q-td>
                        </template>

                        <template #body-cell-amount="tableProps">
                          <q-td
                            :props="tableProps"
                            class="text-right text-weight-bold"
                          >
                            <span
                              :class="
                                tableProps.row.type === 'EARNING'
                                  ? 'text-positive'
                                  : 'text-negative'
                              "
                            >
                              {{
                                tableProps.row.type === "DEDUCTION"
                                  ? "-"
                                  : ""
                              }}
                              {{ money(tableProps.row.amount) }}
                            </span>
                          </q-td>
                        </template>
                      </q-table>
                    </q-card>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Préstamos -->

              <q-tab-panel name="loans" class="q-pa-none">
                <div v-if="loanSnapshot.hasActiveLoans">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-card flat bordered class="loan-metric">
                        <div class="metric-label">
                          Capital pendiente
                        </div>

                        <div class="metric-value">
                          {{
                            money(
                              loanSnapshot.totalPrincipalOutstanding,
                            )
                          }}
                        </div>
                      </q-card>
                    </div>

                    <div class="col-12 col-sm-6 col-md-3">
                      <q-card flat bordered class="loan-metric">
                        <div class="metric-label">
                          Intereses pendientes
                        </div>

                        <div class="metric-value">
                          {{
                            money(
                              loanSnapshot.totalInterestOutstanding,
                            )
                          }}
                        </div>
                      </q-card>
                    </div>

                    <div class="col-12 col-sm-6 col-md-3">
                      <q-card flat bordered class="loan-metric">
                        <div class="metric-label">
                          Descuento aplicado
                        </div>

                        <div class="metric-value text-negative">
                          {{ money(loanSnapshot.totalDeducted) }}
                        </div>
                      </q-card>
                    </div>

                    <div class="col-12 col-sm-6 col-md-3">
                      <q-card flat bordered class="loan-metric">
                        <div class="metric-label">
                          Balance restante
                        </div>

                        <div
                          class="metric-value"
                          :class="
                            Number(
                              loanSnapshot.remainingOutstanding || 0,
                            ) > 0
                              ? 'text-orange-10'
                              : 'text-positive'
                          "
                        >
                          {{
                            money(
                              loanSnapshot.remainingOutstanding,
                            )
                          }}
                        </div>
                      </q-card>
                    </div>

                    <div class="col-12">
                      <q-banner
                        v-if="
                          Number(
                            loanSnapshot.remainingOutstanding || 0,
                          ) > 0
                        "
                        class="bg-orange-1 text-orange-10 rounded-banner"
                      >
                        <template #avatar>
                          <q-icon
                            name="warning"
                            color="orange-10"
                          />
                        </template>

                        La liquidación no cubre completamente la deuda.
                        Quedará pendiente

                        <strong>
                          {{
                            money(
                              loanSnapshot.remainingOutstanding,
                            )
                          }}
                        </strong>.
                      </q-banner>

                      <q-banner
                        v-else
                        class="bg-green-1 text-positive rounded-banner"
                      >
                        <template #avatar>
                          <q-icon
                            name="check_circle"
                            color="positive"
                          />
                        </template>

                        La liquidación cubre completamente el saldo pendiente
                        de los préstamos.
                      </q-banner>
                    </div>

                    <div class="col-12">
                      <q-card flat bordered class="section-card">
                        <div class="section-header q-mb-md">
                          <q-avatar
                            color="orange-1"
                            text-color="orange-10"
                            icon="account_balance_wallet"
                            size="40px"
                          />

                          <div>
                            <div class="section-title">
                              Préstamos incluidos
                            </div>

                            <div class="section-subtitle">
                              Detalle del saldo utilizado al calcular la
                              desvinculación.
                            </div>
                          </div>
                        </div>

                        <q-list
                          bordered
                          separator
                          class="loan-list"
                        >
                          <q-item
                            v-for="(loan, index) in loanSnapshot.loans || []"
                            :key="getLoanKey(loan, index)"
                            class="loan-item"
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
                                {{ loan.pendingInstallments || 0 }}
                                · Garantía:
                                {{ number(loan.guaranteedDays) }}
                                días
                              </q-item-label>

                              <q-item-label
                                v-if="loan.calculationSource"
                                caption
                              >
                                Saldo calculado desde:
                                {{ humanizeCode(loan.calculationSource) }}
                              </q-item-label>
                            </q-item-section>

                            <q-item-section side top>
                              <div class="text-caption text-grey-7">
                                Saldo
                              </div>

                              <div class="text-weight-bold text-negative">
                                {{ money(loan.totalOutstanding) }}
                              </div>

                              <div class="text-caption text-positive">
                                Aplicado:
                                {{ money(loan.amountApplied) }}
                              </div>

                              <div
                                v-if="
                                  Number(
                                    loan.remainingOutstanding || 0,
                                  ) > 0
                                "
                                class="text-caption text-orange-10"
                              >
                                Pendiente:
                                {{ money(loan.remainingOutstanding) }}
                              </div>
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </q-card>
                    </div>
                  </div>
                </div>

                <q-card
                  v-else
                  flat
                  bordered
                  class="empty-tab-card"
                >
                  <q-icon
                    name="account_balance_wallet"
                    size="58px"
                    color="grey-5"
                  />

                  <div class="empty-tab-title">
                    Sin préstamos activos
                  </div>

                  <div class="text-caption text-grey-7">
                    Esta desvinculación no contiene deducciones relacionadas
                    con préstamos.
                  </div>
                </q-card>
              </q-tab-panel>

              <!-- Historial -->

              <q-tab-panel name="history" class="q-pa-none">
                <q-card flat bordered class="section-card">
                  <div class="section-header">
                    <q-avatar
                      color="blue-grey-1"
                      text-color="blue-grey-10"
                      icon="history"
                      size="40px"
                    />

                    <div>
                      <div class="section-title">
                        Historial de acciones
                      </div>

                      <div class="section-subtitle">
                        Cambios de estado y usuarios responsables.
                      </div>
                    </div>
                  </div>

                  <q-timeline
                    v-if="historyEntries.length"
                    color="primary"
                    layout="comfortable"
                    class="q-mt-md"
                  >
                    <q-timeline-entry
                      v-for="item in historyEntries"
                      :key="item.key"
                      :title="item.title"
                      :subtitle="item.formattedDate"
                      :icon="item.icon"
                      :color="item.color"
                    >
                      <div class="history-user">
                        {{ item.user }}
                      </div>

                      <div
                        v-if="item.note"
                        class="text-caption text-grey-7"
                      >
                        {{ item.note }}
                      </div>
                    </q-timeline-entry>
                  </q-timeline>

                  <div
                    v-else
                    class="empty-history"
                  >
                    <q-icon
                      name="history"
                      size="50px"
                      color="grey-5"
                    />

                    <div class="text-grey-7 q-mt-sm">
                      No hay movimientos registrados.
                    </div>
                  </div>
                </q-card>
              </q-tab-panel>

              <!-- Pago -->

              <q-tab-panel name="payment" class="q-pa-none">
                <q-card
                  v-if="paymentData"
                  flat
                  bordered
                  class="section-card"
                >
                  <div class="section-header">
                    <q-avatar
                      color="green-1"
                      text-color="positive"
                      icon="payments"
                      size="40px"
                    />

                    <div>
                      <div class="section-title">
                        Pago registrado
                      </div>

                      <div class="section-subtitle">
                        Información financiera de la liquidación.
                      </div>
                    </div>
                  </div>

                  <div class="detail-grid q-mt-md">
                    <div class="detail-item">
                      <span>Monto pagado</span>

                      <strong class="text-positive">
                        {{ money(paymentAmount) }}
                      </strong>
                    </div>

                    <div class="detail-item">
                      <span>Fecha</span>

                      <strong>
                        {{ formatDate(paymentDate) }}
                      </strong>
                    </div>

                    <div class="detail-item">
                      <span>Método</span>

                      <strong>
                        {{
                          getPaymentMethodLabel(
                            paymentData.paymentMethod,
                          )
                        }}
                      </strong>
                    </div>

                    <div class="detail-item">
                      <span>Referencia</span>

                      <strong>
                        {{
                          paymentData.referenceNumber ||
                          paymentData.reference ||
                          "N/A"
                        }}
                      </strong>
                    </div>

                    <div
                      v-if="paymentData.bankFileName"
                      class="detail-item"
                    >
                      <span>Archivo TXT</span>

                      <strong>
                        {{ paymentData.bankFileName }}
                      </strong>
                    </div>
                  </div>

                  <div
                    v-if="paymentData.notes"
                    class="reason-box q-mt-md"
                  >
                    {{ paymentData.notes }}
                  </div>

                  <q-banner
                    v-if="Number(paymentData.loanPayrollPendingTotal || 0) > 0"
                    class="bg-orange-1 text-orange-10 rounded-banner q-mt-md"
                  >
                    <template #avatar>
                      <q-icon name="account_balance" color="orange-10" />
                    </template>

                    <div class="text-weight-bold">
                      Préstamo pendiente para TXT de nómina
                    </div>

                    <div class="text-caption q-mt-xs">
                      {{ paymentData.loanPayrollPendingCount || 0 }} pago(s)
                      por {{ money(paymentData.loanPayrollPendingTotal) }}
                      quedaron pendientes para enviarse al prestamista cuando
                      se cierre una nómina.
                    </div>
                  </q-banner>

                  <div
                    v-if="isBankTransferPayment"
                    class="row items-center q-gutter-sm q-mt-md"
                  >
                    <q-btn
                      v-if="paymentData.bankFileContent"
                      outline
                      rounded
                      no-caps
                      color="primary"
                      icon="download"
                      label="Descargar TXT"
                      @click="downloadPaymentBankFile"
                    />

                    <q-btn
                      unelevated
                      rounded
                      no-caps
                      color="primary"
                      icon="description"
                      :label="
                        paymentData.bankFileContent
                          ? 'Regenerar TXT'
                          : 'Generar TXT'
                      "
                      @click="openBankFileDialog"
                    />
                  </div>
                </q-card>

                <q-card
                  v-else
                  flat
                  bordered
                  class="empty-tab-card"
                >
                  <q-icon
                    name="payments"
                    size="58px"
                    color="grey-5"
                  />

                  <div class="empty-tab-title">
                    Pago no registrado
                  </div>

                  <div class="text-caption text-grey-7">
                    La desvinculación todavía no ha sido pagada.
                  </div>

                  <q-btn
                    v-if="canPay"
                    unelevated
                    rounded
                    no-caps
                    color="teal"
                    icon="payments"
                    label="Registrar pago"
                    class="q-mt-md"
                    @click="openAction('PAY')"
                  />
                </q-card>
              </q-tab-panel>
            </q-tab-panels>
          </div>

          <div
            v-else-if="!loading"
            class="empty-detail"
          >
            <q-icon
              name="error_outline"
              size="62px"
              color="grey-5"
            />

            <div class="empty-tab-title">
              No se pudo cargar la desvinculación
            </div>

            <q-btn
              outline
              rounded
              no-caps
              color="primary"
              icon="refresh"
              label="Reintentar"
              class="q-mt-md"
              @click="loadDetail"
            />
          </div>
        </q-card-section>

        <q-separator />

        <!-- Acciones -->

        <q-card-actions class="detail-actions">
          <q-btn
            flat
            rounded
            no-caps
            color="grey-8"
            icon="close"
            label="Cerrar"
            :disable="loading || actionLoading"
            @click="closeDialog"
          />

          <q-space />

          <q-btn
            v-if="canCancel"
            outline
            rounded
            no-caps
            color="negative"
            icon="cancel"
            :label="getActionLabel('CANCEL', 'Cancelar')"
            :disable="loading || actionLoading"
            @click="openAction('CANCEL')"
          />

          <q-btn
            v-if="canRecalculate"
            outline
            rounded
            no-caps
            color="primary"
            icon="refresh"
            :label="getActionLabel('RECALCULATE', 'Recalcular')"
            :disable="loading || actionLoading"
            @click="openAction('RECALCULATE')"
          />

          <q-btn
            v-if="canSubmit"
            unelevated
            rounded
            no-caps
            color="primary"
            icon="send"
            :label="getActionLabel('SUBMIT', 'Enviar a aprobación')"
            :disable="loading || actionLoading"
            @click="openAction('SUBMIT')"
          />

          <q-btn
            v-if="canApprove"
            unelevated
            rounded
            no-caps
            color="positive"
            icon="verified"
            :label="getActionLabel('APPROVE', 'Aprobar')"
            :disable="loading || actionLoading"
            @click="openAction('APPROVE')"
          />

          <q-btn
            v-if="canPay"
            unelevated
            rounded
            no-caps
            color="teal"
            icon="payments"
            :label="getActionLabel('PAY', 'Registrar pago')"
            :disable="loading || actionLoading"
            @click="openAction('PAY')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmación de acciones -->

    <q-dialog
      v-model="actionDialogOpen"
      persistent
    >
      <q-card class="action-dialog">
        <q-inner-loading
          :showing="actionLoading"
          label="Procesando acción..."
          label-class="text-primary"
          class="z-max"
        />

        <q-card-section class="action-dialog-header bg-primary">
          <div class="row items-center no-wrap text-white">
            <q-avatar
              color="white"
              text-color="primary"
              :icon="actionConfig.icon || 'check'"
              size="42px"
            />

            <div class="q-ml-md action-header-text">
              <div class="action-dialog-title">
                {{ actionConfig.title }}
              </div>

              <div class="action-dialog-subtitle">
                {{ actionConfig.subtitle }}
              </div>
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            color="white"
            icon="close"
            :disable="actionLoading"
            @click="closeActionDialog"
          />
        </q-card-section>

        <q-card-section class="q-pa-lg">
          <q-banner
            v-if="actionType === 'PAY'"
            class="bg-orange-1 text-orange-10 rounded-banner q-mb-md"
          >
            <template #avatar>
              <q-icon name="warning" color="orange-10" />
            </template>

            Al registrar el pago, el backend completará la desvinculación del
            empleado. Si el método es transferencia, el TXT bancario se genera
            después desde la pestaña Pago.
          </q-banner>

          <div class="confirmation-summary">
            <div class="confirmation-row">
              <span>Empleado</span>

              <strong>
                {{ employeeName }}
              </strong>
            </div>

            <div class="confirmation-row">
              <span>Estado actual</span>

              <strong>
                {{ statusConfig.label }}
              </strong>
            </div>

            <div class="confirmation-row">
              <span>Neto a pagar</span>

              <strong>
                {{ money(calculation.netTotal) }}
              </strong>
            </div>

            <div
              v-if="loanSnapshot.hasActiveLoans"
              class="confirmation-row"
            >
              <span>Préstamos retenidos</span>

              <strong class="text-negative">
                {{ money(loanSnapshot.totalDeducted) }}
              </strong>
            </div>

            <div
              v-if="
                loanSnapshot.hasActiveLoans &&
                Number(loanSnapshot.remainingOutstanding || 0) > 0
              "
              class="confirmation-row"
            >
              <span>Deuda restante</span>

              <strong class="text-orange-10">
                {{ money(loanSnapshot.remainingOutstanding) }}
              </strong>
            </div>
          </div>

          <!-- Formulario de pago -->

          <div
            v-if="actionType === 'PAY'"
            class="row q-col-gutter-md q-mt-sm"
          >
            <div class="col-12">
              <q-card
                flat
                bordered
                class="payment-total-card"
              >
                <div class="metric-label">
                  Total neto a pagar
                </div>

                <div class="payment-total-value">
                  {{ money(calculation.netTotal) }}
                </div>
              </q-card>
            </div>

            <div class="col-12 col-sm-6">
              <div class="field-label required">
                Fecha de pago
              </div>

              <q-input
                v-model="actionForm.paymentDate"
                outlined
                dense
                rounded
                type="date"
                color="primary"
              />
            </div>

            <div class="col-12 col-sm-6">
              <div class="field-label required">
                Método de pago
              </div>

              <q-select
                v-model="actionForm.paymentMethod"
                outlined
                dense
                rounded
                emit-value
                map-options
                color="primary"
                label="Selecciona el método"
                :options="paymentMethodOptions"
                :disable="!paymentMethodOptions.length"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No hay métodos de pago disponibles.
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div
              v-if="shouldQueueLoanPayrollPayment"
              class="col-12"
            >
              <q-banner class="bg-orange-1 text-orange-10 rounded-banner">
                <template #avatar>
                  <q-icon name="account_balance" color="orange-10" />
                </template>

                <div class="text-weight-bold">
                  El préstamo se pagará al prestamista en nómina.
                </div>

                <div class="text-caption q-mt-xs">
                  Al empleado se le pagará el neto de liquidación
                  {{ money(calculation.netTotal) }}. El monto retenido de
                  préstamo, {{ money(loanSnapshot.totalDeducted) }}, quedará
                  pendiente para incluirse en el próximo TXT bancario de nómina.
                </div>
              </q-banner>
            </div>

            <div class="col-12">
              <div class="field-label">
                Referencia
              </div>

              <q-input
                v-model="actionForm.referenceNumber"
                outlined
                dense
                rounded
                color="primary"
                label="Referencia del pago"
              />
            </div>

            <div class="col-12">
              <div class="field-label">
                Notas
              </div>

              <q-input
                v-model="actionForm.notes"
                outlined
                dense
                rounded
                color="primary"
                type="textarea"
                autogrow
                label="Notas del pago"
              />
            </div>
          </div>

          <!-- Notas de otras acciones -->

          <div
            v-else
            class="q-mt-md"
          >
            <div
              class="field-label"
              :class="{
                required: actionType === 'CANCEL',
              }"
            >
              {{
                actionType === "CANCEL"
                  ? "Razón de cancelación"
                  : "Nota"
              }}
            </div>

            <q-input
              v-model="actionForm.notes"
              outlined
              dense
              rounded
              color="primary"
              type="textarea"
              autogrow
              :label="
                actionType === 'CANCEL'
                  ? 'Describe por qué se cancela'
                  : 'Comentario opcional'
              "
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions
          align="right"
          class="q-pa-md"
        >
          <q-btn
            flat
            rounded
            no-caps
            color="grey-8"
            label="Volver"
            :disable="actionLoading"
            @click="closeActionDialog"
          />

          <q-btn
            unelevated
            rounded
            no-caps
            :color="actionConfig.color || 'primary'"
            :icon="actionConfig.icon || 'check'"
            :label="actionConfig.confirmLabel || 'Confirmar'"
            :loading="actionLoading"
            @click="confirmAction"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="bankFileDialogOpen"
      persistent
    >
      <q-card class="action-dialog">
        <q-inner-loading
          :showing="bankFileLoading"
          label="Generando archivo..."
          label-class="text-primary"
          class="z-max"
        />

        <q-card-section class="action-dialog-header bg-primary">
          <div class="row items-center no-wrap text-white">
            <q-avatar
              color="white"
              text-color="primary"
              icon="description"
              size="42px"
            />

            <div class="q-ml-md action-header-text">
              <div class="action-dialog-title">
                Generar TXT bancario
              </div>

              <div class="action-dialog-subtitle">
                Usa la cuenta del empleado o una cuenta alterna para esta transferencia.
              </div>
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            color="white"
            icon="close"
            :disable="bankFileLoading"
            @click="closeBankFileDialog"
          />
        </q-card-section>

        <q-card-section class="q-pa-lg">
          <q-banner class="bg-blue-1 text-primary rounded-banner q-mb-md">
            <template #avatar>
              <q-icon name="info" color="primary" />
            </template>

            Si hay préstamos retenidos, el TXT incluirá líneas separadas hacia
            las cuentas configuradas en el producto del préstamo.
          </q-banner>

          <q-toggle
            v-model="bankFileForm.useOverride"
            color="primary"
            label="Usar cuenta alterna para el pago al empleado"
          />

          <div
            v-if="bankFileForm.useOverride"
            class="row q-col-gutter-md q-mt-sm"
          >
            <div class="col-12 col-sm-6">
              <div class="field-label required">Cuenta destino</div>

              <q-input
                v-model="bankFileForm.accountNumber"
                outlined
                dense
                rounded
                color="primary"
              />
            </div>

            <div class="col-12 col-sm-6">
              <div class="field-label required">Tipo de cuenta</div>

              <q-select
                v-model="bankFileForm.accountType"
                outlined
                dense
                rounded
                emit-value
                map-options
                color="primary"
                :options="bankAccountTypeOptions"
              />
            </div>

            <div class="col-12 col-sm-6">
              <div class="field-label required">Código banco</div>

              <q-input
                v-model="bankFileForm.bankCode"
                outlined
                dense
                rounded
                color="primary"
                maxlength="8"
              />
            </div>

            <div class="col-12 col-sm-6">
              <div class="field-label required">Dígito banco</div>

              <q-input
                v-model="bankFileForm.bankDigit"
                outlined
                dense
                rounded
                color="primary"
                maxlength="1"
              />
            </div>

            <div class="col-12 col-sm-6">
              <div class="field-label required">Operación</div>

              <q-input
                v-model="bankFileForm.operationCode"
                outlined
                dense
                rounded
                color="primary"
                maxlength="2"
              />
            </div>

            <div class="col-12 col-sm-6">
              <div class="field-label">Moneda</div>

              <q-input
                v-model="bankFileForm.currency"
                outlined
                dense
                rounded
                color="primary"
                maxlength="3"
              />
            </div>

            <div class="col-12 col-sm-6">
              <div class="field-label required">Tipo ID</div>

              <q-input
                v-model="bankFileForm.idType"
                outlined
                dense
                rounded
                color="primary"
                maxlength="2"
              />
            </div>

            <div class="col-12 col-sm-6">
              <div class="field-label required">Número ID</div>

              <q-input
                v-model="bankFileForm.idNumber"
                outlined
                dense
                rounded
                color="primary"
              />
            </div>

            <div class="col-12">
              <div class="field-label">Beneficiario</div>

              <q-input
                v-model="bankFileForm.beneficiaryName"
                outlined
                dense
                rounded
                color="primary"
              />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions
          align="right"
          class="q-pa-md"
        >
          <q-btn
            flat
            rounded
            no-caps
            color="grey-8"
            label="Volver"
            :disable="bankFileLoading"
            @click="closeBankFileDialog"
          />

          <q-btn
            unelevated
            rounded
            no-caps
            color="primary"
            icon="description"
            label="Generar TXT"
            :loading="bankFileLoading"
            @click="generatePaymentBankFile"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
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

  termination: {
    type: Object,
    default: null,
  },

  catalogs: {
    type: Object,
    default: () => ({
      statuses: [],
      terminationTypes: [],
      paymentMethods: [],
      actions: [],
      loanFilters: [],
      policy: null,
    }),
  },
});

const emit = defineEmits([
  "update:modelValue",
  "updated",
]);

const ENDPOINTS = {
  detail: (id) =>
    `employee-termination/terminations/${id}`,

  recalculate: (id) =>
    `employee-termination/terminations/${id}/recalculate`,

  submit: (id) =>
    `employee-termination/terminations/${id}/submit-approval`,

  approve: (id) =>
    `employee-termination/terminations/${id}/approve`,

  pay: (id) =>
    `employee-termination/terminations/${id}/pay`,

  bankFile: (id) =>
    `employee-termination/terminations/${id}/bank-file`,

  cancel: (id) =>
    `employee-termination/terminations/${id}/cancel`,
};

const activeTab = ref("summary");

const loading = ref(false);
const actionLoading = ref(false);

const detail = ref(null);

const actionDialogOpen = ref(false);
const actionType = ref("");
const bankFileDialogOpen = ref(false);
const bankFileLoading = ref(false);

const actionForm = reactive({
  notes: "",
  paymentDate: "",
  paymentMethod: "",
  referenceNumber: "",
});

const bankFileForm = reactive({
  useOverride: false,
  accountNumber: "",
  accountType: "2",
  currency: "214",
  bankCode: "",
  bankDigit: "",
  operationCode: "32",
  idType: "RN",
  idNumber: "",
  beneficiaryName: "",
});

const bankAccountTypeOptions = [
  { label: "Corriente", value: "1" },
  { label: "Ahorro", value: "2" },
];

const calculationColumns = [
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

const loadingLabel = computed(() => {
  if (actionLoading.value) {
    return "Procesando acción...";
  }

  return "Cargando desvinculación...";
});

const terminationId = computed(() => {
  return (
    props.termination?._id ||
    props.termination?.id ||
    null
  );
});

const terminationNumber = computed(() => {
  return (
    detail.value?.terminationNumber ||
    detail.value?.code ||
    getShortId(detail.value?._id || terminationId.value)
  );
});

const currentStatus = computed(() => {
  return String(detail.value?.status || "")
    .trim()
    .toUpperCase();
});

const statusConfig = computed(() => {
  return getStatusConfig(currentStatus.value);
});

const currentAllowedActions = computed(() => {
  const statusActions = statusConfig.value?.actions;

  if (Array.isArray(statusActions)) {
    return statusActions;
  }

  const detailActions = detail.value?.allowedActions;

  return Array.isArray(detailActions)
    ? detailActions
    : [];
});

const canPerformAction = (actionCode) => {
  return currentAllowedActions.value.includes(actionCode);
};

const canRecalculate = computed(() => {
  return canPerformAction("RECALCULATE");
});

const canSubmit = computed(() => {
  return canPerformAction("SUBMIT");
});

const canApprove = computed(() => {
  return canPerformAction("APPROVE");
});

const canPay = computed(() => {
  return canPerformAction("PAY");
});

const canCancel = computed(() => {
  return canPerformAction("CANCEL");
});

const employeeSnapshot = computed(() => {
  return (
    detail.value?.employeeSnapshot ||
    detail.value?.employee ||
    detail.value?.user ||
    {}
  );
});

const employeeName = computed(() => {
  return (
    employeeSnapshot.value?.fullName ||
    employeeSnapshot.value?.name ||
    "Empleado sin nombre"
  );
});

const employeeEmail = computed(() => {
  return employeeSnapshot.value?.email || "Sin correo";
});

const employeeCode = computed(() => {
  return employeeSnapshot.value?.code || "";
});

const employeeImage = computed(() => {
  return (
    employeeSnapshot.value?.img ||
    employeeSnapshot.value?.image ||
    ""
  );
});

const employeeHiringDate = computed(() => {
  return (
    employeeSnapshot.value?.hiringDate ||
    detail.value?.employee?.hiringDate ||
    null
  );
});

const employeeJobPosition = computed(() => {
  return (
    employeeSnapshot.value?.jobPosition ||
    employeeSnapshot.value?.jobPosition?.name ||
    detail.value?.employee?.jobPosition?.name ||
    "Puesto no definido"
  );
});

const calculation = computed(() => {
  return {
    automaticIncome: Number(
      detail.value?.calculation?.automaticIncome || 0,
    ),

    manualIncome: Number(
      detail.value?.calculation?.manualIncome || 0,
    ),

    totalIncome: Number(
      detail.value?.calculation?.totalIncome ||
        detail.value?.calculation?.grossTotal ||
        0,
    ),

    totalDeductions: Number(
      detail.value?.calculation?.totalDeductions || 0,
    ),

    netTotal: Number(
      detail.value?.calculation?.netTotal || 0,
    ),
  };
});

const calculationLines = computed(() => {
  const lines = detail.value?.calculation?.lines || [];

  return Array.isArray(lines) ? lines : [];
});

const loanSnapshot = computed(() => {
  return (
    detail.value?.loanSnapshot || {
      hasActiveLoans: false,
      totalLoans: 0,
      totalPendingInstallments: 0,
      totalGuaranteedDays: 0,
      totalPrincipalOutstanding: 0,
      totalInterestOutstanding: 0,
      totalOutstanding: 0,
      totalDeducted: 0,
      remainingOutstanding: 0,
      calculatedAt: null,
      loans: [],
    }
  );
});

const terminationTypeLabel = computed(() => {
  const snapshotLabel =
    detail.value?.terminationTypeLabel ||
    detail.value?.terminationTypeRuleSnapshot?.label ||
    detail.value?.terminationTypeRuleSnapshot?.name;

  if (snapshotLabel) {
    return snapshotLabel;
  }

  const type = String(
    detail.value?.terminationType || "",
  );

  const found = terminationTypeOptions.value.find(
    (item) => String(item.value) === type,
  );

  return (
    found?.label ||
    humanizeCode(type) ||
    "Sin tipo"
  );
});

const terminationTypeOptions = computed(() => {
  return Array.isArray(props.catalogs?.terminationTypes)
    ? props.catalogs.terminationTypes
    : [];
});

const paymentMethodOptions = computed(() => {
  return Array.isArray(props.catalogs?.paymentMethods)
    ? props.catalogs.paymentMethods
    : [];
});

const policyName = computed(() => {
  return (
    detail.value?.policySnapshot?.name ||
    detail.value?.policy?.name ||
    props.catalogs?.policy?.name ||
    "Política de desvinculación"
  );
});

const policyVersion = computed(() => {
  return (
    detail.value?.policySnapshot?.version ||
    detail.value?.policy?.version ||
    props.catalogs?.policy?.version ||
    "N/A"
  );
});

const selectedMonthlySalary = computed(() => {
  return Number(
    detail.value?.salarySnapshot?.averageOrdinarySalary ||
      detail.value?.salarySnapshot?.selectedMonthlySalary ||
      detail.value?.salarySnapshot?.monthlySalary ||
      0,
  );
});

const salaryStrategyLabel = computed(() => {
  const strategy =
    detail.value?.salarySnapshot?.strategy ||
    detail.value?.salarySnapshot?.salaryBaseMode ||
    "";

  return humanizeCode(strategy) || "N/A";
});

const seniorityText = computed(() => {
  return (
    detail.value?.senioritySnapshot?.text ||
    `${Number(
      detail.value?.senioritySnapshot?.totalMonths || 0,
    )} meses`
  );
});

const paymentData = computed(() => {
  return (
    detail.value?.payment ||
    detail.value?.terminationPayment ||
    detail.value?.paymentSnapshot ||
    null
  );
});

const paymentAmount = computed(() => {
  return Number(
    paymentData.value?.amount ||
      paymentData.value?.paidAmount ||
      0,
  );
});

const paymentDate = computed(() => {
  return (
    paymentData.value?.paymentDate ||
    paymentData.value?.paidAt ||
    detail.value?.paidAt ||
    null
  );
});

const isBankTransferPayment = computed(() => {
  return (
    String(paymentData.value?.paymentMethod || "")
      .trim()
      .toUpperCase() === "BANK_TRANSFER"
  );
});

const shouldQueueLoanPayrollPayment = computed(() => {
  const method = String(actionForm.paymentMethod || "")
    .trim()
    .toUpperCase();

  return (
    actionType.value === "PAY" &&
    method &&
    method !== "BANK_TRANSFER" &&
    loanSnapshot.value?.hasActiveLoans &&
    Number(loanSnapshot.value?.totalDeducted || 0) > 0
  );
});

const historyEntries = computed(() => {
  const entries = [];

  const addEntry = ({
    key,
    title,
    date,
    user,
    note,
    icon,
    color,
  }) => {
    if (!date) {
      return;
    }

    const parsedDate = new Date(date);

    entries.push({
      key,
      title,
      rawDate: Number.isNaN(parsedDate.getTime())
        ? 0
        : parsedDate.getTime(),
      formattedDate: formatDateTime(date),
      user,
      note,
      icon,
      color,
    });
  };

  addEntry({
    key: "created",
    title: "Desvinculación creada",
    date: detail.value?.createdAt,
    user: getUserName(
      detail.value?.createdBy,
      "Usuario creador",
    ),
    note: "Se generó el cálculo inicial.",
    icon: "add_circle",
    color: "primary",
  });

  addEntry({
    key: "submitted",
    title: "Enviada a aprobación",
    date:
      detail.value?.submittedAt ||
      detail.value?.sentForApprovalAt,
    user: getUserName(
      detail.value?.submittedBy ||
        detail.value?.sentForApprovalBy,
      "Usuario",
    ),
    note:
      detail.value?.submissionNote ||
      detail.value?.submittedNote ||
      "",
    icon: "send",
    color: "orange",
  });

  addEntry({
    key: "approved",
    title: "Desvinculación aprobada",
    date: detail.value?.approvedAt,
    user: getUserName(
      detail.value?.approvedBy,
      "Usuario aprobador",
    ),
    note: detail.value?.approvalNote || "",
    icon: "verified",
    color: "positive",
  });

  addEntry({
    key: "paid",
    title: "Pago registrado",
    date:
      detail.value?.paidAt ||
      paymentData.value?.paymentDate ||
      paymentData.value?.paidAt,
    user: getUserName(
      detail.value?.paidBy ||
        paymentData.value?.createdBy,
      "Usuario",
    ),
    note:
      paymentData.value?.notes ||
      "La desvinculación fue pagada.",
    icon: "payments",
    color: "teal",
  });

  addEntry({
    key: "cancelled",
    title: "Desvinculación cancelada",
    date: detail.value?.cancelledAt,
    user: getUserName(
      detail.value?.cancelledBy,
      "Usuario",
    ),
    note:
      detail.value?.cancellationReason ||
      detail.value?.cancelReason ||
      "",
    icon: "cancel",
    color: "negative",
  });

  const customHistory = Array.isArray(
    detail.value?.history,
  )
    ? detail.value.history
    : [];

  customHistory.forEach((item, index) => {
    addEntry({
      key: `custom-${item?._id || index}`,
      title:
        item.label ||
        item.actionLabel ||
        humanizeCode(item.action || item.status) ||
        "Acción registrada",
      date:
        item.createdAt ||
        item.date ||
        item.performedAt,
      user: getUserName(
        item.user ||
          item.performedBy ||
          item.createdBy,
        "Usuario",
      ),
      note:
        item.note ||
        item.notes ||
        item.reason ||
        "",
      icon: item.icon || "history",
      color: item.color || "primary",
    });
  });

  return entries.sort(
    (first, second) =>
      first.rawDate - second.rawDate,
  );
});

const actionConfig = computed(() => {
  const found = actionOptions.value.find(
    (item) =>
      String(item.code) ===
      String(actionType.value),
  );

  if (found) {
    return found;
  }

  const fallbackLabel =
    humanizeCode(actionType.value) ||
    "Confirmar acción";

  return {
    code: actionType.value,
    label: fallbackLabel,
    title: fallbackLabel,
    subtitle: "",
    icon: "check",
    color: "primary",
    confirmLabel: "Confirmar",
  };
});

const actionOptions = computed(() => {
  return Array.isArray(props.catalogs?.actions)
    ? props.catalogs.actions
    : [];
});

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      activeTab.value = "summary";
      loadDetail();
    } else {
      resetDialogState();
    }
  },
);

watch(
  () => terminationId.value,
  (value, previousValue) => {
    if (
      props.modelValue &&
      value &&
      value !== previousValue
    ) {
      activeTab.value = "summary";
      loadDetail();
    }
  },
);

watch(
  () => bankFileForm.accountType,
  (value) => {
    if (String(value) === "1") bankFileForm.operationCode = "22";
    if (String(value) === "2") bankFileForm.operationCode = "32";
  },
);

const resetDialogState = () => {
  detail.value = null;
  activeTab.value = "summary";
  actionDialogOpen.value = false;
  bankFileDialogOpen.value = false;
  actionType.value = "";
  resetActionForm();
  resetBankFileForm();
};

const loadDetail = async () => {
  if (!terminationId.value) {
    detail.value = null;
    return;
  }

  loading.value = true;

  try {
    const response = await methodsHttp.getApi(
      ENDPOINTS.detail(terminationId.value),
    );

    if (!response?.ok) {
      detail.value = null;

      Notify.create({
        type: "negative",
        message:
          response?.mensaje ||
          "No se pudo cargar la desvinculación.",
      });

      return;
    }

    detail.value = extractDetailResponse(response);
  } catch (error) {
    console.error("loadDetail error:", error);

    detail.value = null;

    Notify.create({
      type: "negative",
      message:
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        "Error cargando la desvinculación.",
    });
  } finally {
    loading.value = false;
  }
};

const extractDetailResponse = (response) => {
  return (
    response?.data?.termination ||
    response?.termination ||
    response?.data?.item ||
    response?.data ||
    null
  );
};

const openAction = (type) => {
  if (!canPerformAction(type)) {
    Notify.create({
      type: "warning",
      message:
        "Esta acción no está disponible para el estado actual.",
    });

    return;
  }

  actionType.value = type;

  resetActionForm();

  actionForm.paymentDate = getToday();

  actionForm.paymentMethod =
    paymentMethodOptions.value[0]?.value || "";

  actionDialogOpen.value = true;
};

const resetActionForm = () => {
  actionForm.notes = "";
  actionForm.paymentDate = "";
  actionForm.paymentMethod = "";
  actionForm.referenceNumber = "";
};

const resetBankFileForm = () => {
  bankFileForm.useOverride = false;
  bankFileForm.accountNumber = "";
  bankFileForm.accountType = "2";
  bankFileForm.currency = "214";
  bankFileForm.bankCode = "";
  bankFileForm.bankDigit = "";
  bankFileForm.operationCode = "32";
  bankFileForm.idType = "RN";
  bankFileForm.idNumber = "";
  bankFileForm.beneficiaryName = "";
};

const closeActionDialog = () => {
  if (actionLoading.value) {
    return;
  }

  actionDialogOpen.value = false;
  actionType.value = "";

  resetActionForm();
};

const validateAction = () => {
  if (!actionType.value) {
    Notify.create({
      type: "negative",
      message: "No se ha seleccionado ninguna acción.",
    });

    return false;
  }

  if (!canPerformAction(actionType.value)) {
    Notify.create({
      type: "negative",
      message:
        "La acción seleccionada no está permitida para el estado actual.",
    });

    return false;
  }

  if (
    actionType.value === "CANCEL" &&
    !String(actionForm.notes || "").trim()
  ) {
    Notify.create({
      type: "negative",
      message:
        "Debes indicar la razón de cancelación.",
    });

    return false;
  }

  if (actionType.value === "PAY") {
    if (!actionForm.paymentDate) {
      Notify.create({
        type: "negative",
        message:
          "Selecciona la fecha de pago.",
      });

      return false;
    }

    if (!actionForm.paymentMethod) {
      Notify.create({
        type: "negative",
        message:
          "Selecciona el método de pago.",
      });

      return false;
    }

  }

  return true;
};

const confirmAction = async () => {
  if (
    !validateAction() ||
    !detail.value?._id
  ) {
    return;
  }

  const endpoint = getActionEndpoint();

  if (!endpoint) {
    Notify.create({
      type: "negative",
      message:
        "No se encontró el endpoint para ejecutar esta acción.",
    });

    return;
  }

  actionLoading.value = true;

  try {
    const response = await methodsHttp.putApi(
      endpoint,
      buildActionPayload(),
    );

    if (!response?.ok) {
      Notify.create({
        type: "negative",
        message:
          response?.mensaje ||
          "No se pudo completar la acción.",
      });

      return;
    }

    Notify.create({
      type: "positive",
      message:
        response?.mensaje ||
        actionConfig.value.successMessage ||
        `${actionConfig.value.label || "Acción"} completada correctamente.`,
    });

    actionDialogOpen.value = false;
    actionType.value = "";

    resetActionForm();

    await loadDetail();

    emit("updated", detail.value);
  } catch (error) {
    console.error("confirmAction error:", error);

    Notify.create({
      type: "negative",
      message:
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        "Error procesando la acción.",
    });
  } finally {
    actionLoading.value = false;
  }
};

const getActionEndpoint = () => {
  const id = detail.value?._id;

  if (!id) {
    return "";
  }

  const endpoints = {
    RECALCULATE: ENDPOINTS.recalculate(id),
    SUBMIT: ENDPOINTS.submit(id),
    APPROVE: ENDPOINTS.approve(id),
    PAY: ENDPOINTS.pay(id),
    CANCEL: ENDPOINTS.cancel(id),
  };

  return endpoints[actionType.value] || "";
};

const buildActionPayload = () => {
  const notes = String(
    actionForm.notes || "",
  ).trim();

  if (actionType.value === "PAY") {
    const amount = Number(
      calculation.value.netTotal || 0,
    );

    return {
      paymentDate: actionForm.paymentDate,
      paymentMethod: actionForm.paymentMethod,

      amount,
      paidAmount: amount,

      referenceNumber: String(
        actionForm.referenceNumber || "",
      ).trim(),

      reference: String(
        actionForm.referenceNumber || "",
      ).trim(),

      notes,
    };
  }

  if (actionType.value === "CANCEL") {
    return {
      reason: notes,
      cancellationReason: notes,
      cancelReason: notes,
      notes,
    };
  }

  if (actionType.value === "APPROVE") {
    return {
      approvalNote: notes,
      note: notes,
      notes,
    };
  }

  if (actionType.value === "SUBMIT") {
    return {
      submissionNote: notes,
      note: notes,
      notes,
    };
  }

  return {
    note: notes,
    notes,
    reason: notes,
  };
};

const openBankFileDialog = () => {
  if (!paymentData.value) {
    Notify.create({
      type: "warning",
      message: "Primero registra el pago de la desvinculación.",
    });

    return;
  }

  if (!isBankTransferPayment.value) {
    Notify.create({
      type: "warning",
      message: "El TXT bancario solo aplica para transferencia bancaria.",
    });

    return;
  }

  resetBankFileForm();
  bankFileDialogOpen.value = true;
};

const closeBankFileDialog = () => {
  if (bankFileLoading.value) return;

  bankFileDialogOpen.value = false;
  resetBankFileForm();
};

const buildBankFilePayload = () => {
  if (!bankFileForm.useOverride) {
    return {};
  }

  return {
    bankOverride: {
      accountNumber: String(bankFileForm.accountNumber || "").trim(),
      accountType: String(bankFileForm.accountType || "").trim(),
      currency: String(bankFileForm.currency || "").trim(),
      bankCode: String(bankFileForm.bankCode || "").trim(),
      bankDigit: String(bankFileForm.bankDigit || "").trim(),
      operationCode: String(bankFileForm.operationCode || "").trim(),
      idType: String(bankFileForm.idType || "").trim(),
      idNumber: String(bankFileForm.idNumber || "").trim(),
      beneficiaryName: String(bankFileForm.beneficiaryName || "").trim(),
    },
  };
};

const validateBankFileForm = () => {
  if (!bankFileForm.useOverride) return true;

  const required = [
    ["accountNumber", "Cuenta destino"],
    ["accountType", "Tipo de cuenta"],
    ["bankCode", "Código banco"],
    ["bankDigit", "Dígito banco"],
    ["operationCode", "Operación"],
    ["idType", "Tipo ID"],
    ["idNumber", "Número ID"],
  ];

  const missing = required
    .filter(([field]) => !String(bankFileForm[field] || "").trim())
    .map(([, label]) => label);

  if (missing.length) {
    Notify.create({
      type: "negative",
      message: `Completa: ${missing.join(", ")}.`,
    });

    return false;
  }

  return true;
};

const generatePaymentBankFile = async () => {
  if (!detail.value?._id || !validateBankFileForm()) return;

  bankFileLoading.value = true;

  try {
    const response = await methodsHttp.postApi(
      ENDPOINTS.bankFile(detail.value._id),
      buildBankFilePayload(),
    );

    if (!response?.ok) {
      Notify.create({
        type: "negative",
        message:
          response?.mensaje ||
          "No se pudo generar el archivo TXT.",
      });

      return;
    }

    const bankFile =
      response?.bankFile ||
      response?.data?.bankFile ||
      response?.data?.payment?.bankFile ||
      null;

    if (bankFile?.content) {
      downloadTextFile(bankFile.content, bankFile.fileName || "desvinculacion.txt");
    }

    Notify.create({
      type: "positive",
      message:
        response?.mensaje ||
        "Archivo TXT generado correctamente.",
    });

    bankFileDialogOpen.value = false;
    resetBankFileForm();
    await loadDetail();
    emit("updated", detail.value);
  } catch (error) {
    console.error("generatePaymentBankFile error:", error);

    Notify.create({
      type: "negative",
      message:
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        "Error generando el archivo TXT.",
    });
  } finally {
    bankFileLoading.value = false;
  }
};

const downloadTextFile = (content, fileName = "desvinculacion.txt") => {
  const blob = new Blob([content], {
    type: "text/plain;charset=ascii",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadPaymentBankFile = () => {
  if (!paymentData.value?.bankFileContent) {
    Notify.create({
      type: "warning",
      message: "No hay contenido TXT disponible para descargar.",
    });

    return;
  }

  downloadTextFile(
    paymentData.value.bankFileContent,
    paymentData.value.bankFileName || "desvinculacion.txt",
  );
};

const closeDialog = () => {
  if (loading.value || actionLoading.value) {
    return;
  }

  emit("update:modelValue", false);
};

const getStatusConfig = (status) => {
  const code = String(status || "")
    .trim()
    .toUpperCase();

  const found = statusOptions.value.find(
    (item) =>
      String(item.value || "")
        .trim()
        .toUpperCase() === code,
  );

  return (
    found || {
      value: code,
      label: humanizeCode(code || "UNKNOWN"),
      color: "grey-9",
      background: "grey-3",
      icon: "help",
      actions: [],
      primaryAction: null,
    }
  );
};

const statusOptions = computed(() => {
  return Array.isArray(props.catalogs?.statuses)
    ? props.catalogs.statuses
    : [];
});

const getActionLabel = (
  actionCode,
  fallback,
) => {
  const found = actionOptions.value.find(
    (item) => item.code === actionCode,
  );

  return found?.label || fallback;
};

const getPaymentMethodLabel = (method) => {
  const found = paymentMethodOptions.value.find(
    (item) =>
      String(item.value) === String(method),
  );

  return (
    found?.label ||
    humanizeCode(method) ||
    "N/A"
  );
};

const getUserName = (
  user,
  fallback,
) => {
  if (!user) {
    return fallback;
  }

  if (typeof user === "string") {
    return user;
  }

  return (
    user.fullName ||
    user.name ||
    user.email ||
    fallback
  );
};

const getLoanKey = (
  loan,
  index,
) => {
  return String(
    loan?.loanRequest?._id ||
      loan?.loanRequest ||
      loan?._id ||
      loan?.requestNumber ||
      `loan-${index}`,
  );
};

const getCalculationLineKey = (
  line,
) => {
  return String(
    line?._id ||
      `${line?.code || "line"}-${line?.source || ""}-${line?.type || ""}`,
  );
};

const getShortId = (value) => {
  const id = String(value || "");

  if (!id) {
    return "N/A";
  }

  return `#${id.slice(-8).toUpperCase()}`;
};

const getInitials = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1]
    .charAt(0)}`.toUpperCase();
};

const humanizeCode = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (item) =>
        item.charAt(0).toUpperCase() +
        item.slice(1),
    )
    .join(" ");
};

const number = (value) => {
  const numericValue = Number(value || 0);

  return (
    Math.round(
      (numericValue + Number.EPSILON) * 100,
    ) / 100
  );
};

const formatDate = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getToday = () => {
  const date = new Date();
  const timezoneOffset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - timezoneOffset,
  )
    .toISOString()
    .slice(0, 10);
};

const money = (value) => {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};
</script>

<style scoped>
.detail-dialog {
  width: 1240px;
  max-width: 98vw;
  border-radius: 24px;
  overflow: hidden;
}

.detail-header {
  padding: 18px 20px;
}

.detail-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.detail-header-main,
.detail-header-text {
  min-width: 0;
}

.detail-title {
  color: #ffffff;
  font-size: 1.08rem;
  font-weight: 950;
}

.detail-subtitle {
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.78rem;
}

.detail-body {
  max-height: calc(94vh - 160px);
  overflow-y: auto;
  padding: 18px;
  background: #f8fafc;
}

.employee-card,
.metric-card,
.section-card,
.loan-metric {
  height: 100%;
  padding: 16px;
  border-radius: 20px;
  background: #ffffff;
}

.employee-information {
  min-width: 0;
}

.employee-avatar {
  flex: 0 0 auto;
  color: white;
  font-weight: 900;
  background: linear-gradient(
    135deg,
    #1a2436,
    #1964a2
  );
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 4px rgba(25, 100, 162, 0.12);
}

.employee-name {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.metric-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value {
  margin-top: 8px;
  color: #0f172a;
  font-size: 1.2rem;
  font-weight: 950;
  overflow-wrap: anywhere;
}

.net-metric {
  border-color: rgba(25, 118, 210, 0.24);
  background: linear-gradient(
    135deg,
    #ffffff,
    #f2f8ff
  );
}

.detail-tabs {
  border-radius: 18px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  color: #0f172a;
  font-size: 0.94rem;
  font-weight: 900;
}

.section-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.76rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(
    2,
    minmax(0, 1fr)
  );
  gap: 11px;
}

.detail-item {
  min-height: 64px;
  padding: 11px 13px;
  border-radius: 15px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.detail-item span {
  display: block;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-item strong {
  display: block;
  margin-top: 5px;
  color: #0f172a;
  font-size: 0.84rem;
  overflow-wrap: anywhere;
}

.reason-box {
  min-height: 76px;
  padding: 14px;
  border-radius: 16px;
  color: #334155;
  line-height: 1.5;
  white-space: pre-wrap;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.07);
}

.rounded-banner {
  border-radius: 16px;
}

.loan-list {
  border-radius: 16px;
  overflow: hidden;
}

.loan-item {
  min-height: 88px;
}

.history-user {
  color: #334155;
  font-weight: 800;
}

.empty-history {
  min-height: 220px;
  display: grid;
  place-items: center;
  align-content: center;
}

.empty-tab-card,
.empty-detail {
  min-height: 280px;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  padding: 36px;
  border-radius: 20px;
}

.empty-tab-title {
  margin-top: 10px;
  color: #334155;
  font-size: 1rem;
  font-weight: 900;
}

.calculation-table {
  border-radius: 16px;
  overflow: hidden;
}

.detail-actions {
  padding: 14px 18px;
  background: #ffffff;
}

.action-dialog {
  width: 620px;
  max-width: 96vw;
  border-radius: 22px;
  overflow: hidden;
}

.action-dialog-header {
  min-height: 76px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.action-header-text {
  min-width: 0;
}

.action-dialog-title {
  font-size: 1rem;
  font-weight: 900;
}

.action-dialog-subtitle {
  margin-top: 3px;
  font-size: 0.76rem;
  opacity: 0.9;
}

.confirmation-summary {
  padding: 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.07);
}

.confirmation-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 10px;
  color: #64748b;
  font-size: 0.83rem;
}

.confirmation-row:last-child {
  margin-bottom: 0;
}

.confirmation-row strong {
  color: #0f172a;
  text-align: right;
}

.payment-total-card {
  padding: 16px;
  border-radius: 18px;
  text-align: center;
  background: linear-gradient(
    135deg,
    #f0fff5,
    #ffffff
  );
}

.payment-total-value {
  margin-top: 6px;
  color: #16803c;
  font-size: 1.7rem;
  font-weight: 950;
}

.field-label {
  margin-bottom: 6px;
  color: #334155;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-label.required::before {
  content: "* ";
  color: #e53935;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 24px;
}

:deep(.q-table th) {
  color: #475569;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #f8fafc;
}

:deep(.q-timeline__title) {
  color: #0f172a;
  font-weight: 850;
}

@media (max-width: 768px) {
  .detail-dialog {
    width: 98vw;
  }

  .detail-header-content {
    align-items: flex-start;
  }

  .detail-header-main {
    align-items: flex-start;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .detail-actions .q-btn {
    flex: 1 1 auto;
  }

  .detail-body {
    padding: 12px;
  }

  .action-dialog-header {
    align-items: flex-start;
  }
}
</style>
