<template>
  <q-page class="q-pa-md employee-loan-page">
    <PageHeaderCard
      title="Mis solicitudes de préstamo"
      subtitle="Solicita un préstamo seleccionando los días de vacaciones que deseas utilizar."
      icon="payments"
    >
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nueva solicitud"
          class="header-btn"
          no-caps
          :disable="!canCreateLoanRequest"
          @click="openCreateDialog"
        >
          <q-tooltip v-if="!canCreateLoanRequest">
            Actualmente no tienes días disponibles para solicitar.
          </q-tooltip>
        </q-btn>

        <q-btn
          unelevated
          color="primary"
          icon="refresh"
          label="Actualizar"
          class="header-btn"
          no-caps
          :loading="loading"
          @click="reloadPage"
        />

        <q-input
          v-model="filters.q"
          outlined
          dense
          rounded
          debounce="350"
          label="Buscar"
          placeholder="Número, estado, propósito..."
          color="primary"
          class="header-search"
        >
          <template #prepend>
            <q-icon
              name="search"
              color="primary"
            />
          </template>

          <template #append>
            <q-btn
              v-if="filters.q"
              flat
              dense
              round
              icon="close"
              @click="filters.q = ''"
            />
          </template>
        </q-input>

        <q-select
          v-model="filters.statuses"
          outlined
          dense
          rounded
          multiple
          use-chips
          clearable
          label="Estados"
          color="primary"
          class="header-field"
          :options="statusOptions"
        >
          <template #prepend>
            <q-icon
              name="filter_alt"
              color="primary"
            />
          </template>
        </q-select>
      </template>
    </PageHeaderCard>

    <div class="stats-grid q-mb-md">
      <q-card
        flat
        bordered
        class="stat-card"
      >
        <q-avatar
          class="stat-icon bg-blue-1 text-primary"
        >
          <q-icon name="payments" />
        </q-avatar>

        <div>
          <div class="stat-label">
            Máximo equivalente
          </div>

          <div class="stat-value">
            {{
              money(
                eligibility?.eligibility
                  ?.maxAllowedAmount || 0
              )
            }}
          </div>
        </div>
      </q-card>

      <q-card
        flat
        bordered
        class="stat-card"
      >
        <q-avatar
          class="stat-icon bg-green-1 text-positive"
        >
          <q-icon name="beach_access" />
        </q-avatar>

        <div>
          <div class="stat-label">
            Días disponibles
          </div>

          <div class="stat-value">
            {{ numberValue(loanVacationDays) }}
          </div>
        </div>
      </q-card>

      <q-card
        flat
        bordered
        class="stat-card"
      >
        <q-avatar
          class="stat-icon bg-orange-1 text-orange-10"
        >
          <q-icon name="lock" />
        </q-avatar>

        <div>
          <div class="stat-label">
            Máx. días prestables
          </div>

          <div class="stat-value">
            {{ numberValue(maxGuaranteeDays) }}
          </div>
        </div>
      </q-card>

      <q-card
        flat
        bordered
        class="stat-card"
      >
        <q-avatar
          class="stat-icon bg-purple-1 text-purple-8"
        >
          <q-icon name="price_check" />
        </q-avatar>

        <div>
          <div class="stat-label">
            Valor por día
          </div>

          <div class="stat-value">
            {{ money(vacationDayAmount) }}
          </div>
        </div>
      </q-card>
    </div>

    <q-banner
      v-if="eligibilityError"
      rounded
      class="bg-red-1 text-red-10 q-mb-md"
    >
      <template #avatar>
        <q-icon
          name="warning"
          color="negative"
        />
      </template>

      {{ eligibilityError }}
    </q-banner>

    <q-banner
      v-else-if="
        eligibility &&
        maxGuaranteeDays <= 0
      "
      rounded
      class="bg-orange-1 text-orange-10 q-mb-md"
    >
      <template #avatar>
        <q-icon
          name="info"
          color="orange-10"
        />
      </template>

      Actualmente no tienes días disponibles para solicitar
      un préstamo.
    </q-banner>

    <q-card
      flat
      bordered
      class="panel-card"
    >
      <q-card-section
        class="table-header row items-center justify-between"
      >
        <div>
          <div class="table-title">
            Mis solicitudes
          </div>

          <div class="table-subtitle">
            Haz clic en una fila para ver el resumen,
            amortización, contrato e historial.
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        :columns="columns"
        :rows="rows"
        row-key="_id"
        flat
        bordered
        separator="horizontal"
        :loading="loading"
        hide-pagination
        class="loan-table"
      >
        <template #body="props">
          <q-tr
            :props="props"
            class="table-row"
            @click="
              openManageDialog(
                props.row,
                'summary'
              )
            "
          >
            <q-td
              key="actions"
              :props="props"
              auto-width
            >
              <div
                class="row items-center no-wrap q-gutter-xs"
              >
                <q-btn
                  dense
                  rounded
                  unelevated
                  no-caps
                  color="primary"
                  icon="visibility"
                  @click.stop="
                    openManageDialog(
                      props.row,
                      'summary'
                    )
                  "
                />

                <q-btn
                  v-if="canCancel(props.row)"
                  dense
                  round
                  flat
                  color="negative"
                  icon="cancel"
                  @click.stop="
                    confirmCancel(props.row)
                  "
                >
                  <q-tooltip>
                    Cancelar solicitud
                  </q-tooltip>
                </q-btn>
              </div>
            </q-td>

            <q-td
              key="requestNumber"
              :props="props"
            >
              <div class="text-weight-bold">
                {{ props.row.requestNumber }}
              </div>

              <div
                class="text-caption text-grey-7"
              >
                {{
                  formatDateTime(
                    props.row.createdAt
                  )
                }}
              </div>
            </q-td>

            <q-td
              key="status"
              :props="props"
            >
              <q-badge
                rounded
                :color="
                  statusColor(
                    props.row.status
                  )
                "
                text-color="white"
                class="status-badge"
              >
                {{
                  statusLabel(
                    props.row.status
                  )
                }}
              </q-badge>
            </q-td>

            <q-td
              key="requestedAmount"
              :props="props"
            >
              <div class="amount-text">
                {{
                  money(
                    props.row.requestedAmount
                  )
                }}
              </div>
            </q-td>

            <q-td
              key="installment"
              :props="props"
            >
              <div class="amount-text">
                {{
                  money(
                    props.row
                      .loanQuoteSnapshot
                      ?.installmentAmount || 0
                  )
                }}
              </div>

              <div
                class="text-caption text-grey-7"
              >
                {{
                  numberValue(
                    props.row
                      .loanQuoteSnapshot
                      ?.installments ||
                      props.row
                        .requestedInstallments ||
                      0
                  )
                }}
                cuota(s)
              </div>
            </q-td>

            <q-td
              key="guarantee"
              :props="props"
            >
              <q-chip
                dense
                color="green-1"
                text-color="positive"
                icon="beach_access"
              >
                {{
                  numberValue(
                    props.row
                      .vacationSnapshot
                      ?.guaranteedDays
                  )
                }}
                día(s)
              </q-chip>
            </q-td>

            <q-td
              key="purpose"
              :props="props"
            >
              <div class="truncate-cell">
                {{
                  props.row.purpose ||
                  props.row.employeeComment ||
                  "-"
                }}
              </div>
            </q-td>
          </q-tr>
        </template>

        <template #no-data>
          <div
            class="full-width text-center q-pa-xl text-grey-7"
          >
            <q-icon
              name="payments"
              size="44px"
              color="grey-5"
            />

            <div
              class="text-subtitle1 text-weight-bold q-mt-sm"
            >
              No tienes solicitudes
            </div>

            <div class="text-caption">
              Crea tu primera solicitud de préstamo.
            </div>
          </div>
        </template>
      </q-table>
    </q-card>

    <EmployeeLoanCreateRequestDialog
      v-model="createDialogOpen"
      :eligibility="eligibility"
      @created="handleLoanCreated"
    />

    <q-dialog
      v-model="manageDialog.open"
      persistent
    >
      <q-card class="manage-dialog">
        <q-card-section
          class="dialog-header bg-primary row items-center justify-between"
        >
          <div
            class="row items-center no-wrap text-white"
          >
            <div class="dialog-icon">
              <q-icon
                name="payments"
                size="30px"
              />
            </div>

            <div>
              <div class="dialog-title">
                Detalle de solicitud
              </div>

              <div class="dialog-subtitle">
                Resumen, amortización, contrato
                e historial.
              </div>
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            color="white"
            icon="close"
            @click="closeManageDialog"
          />
        </q-card-section>

        <q-card-section
          v-if="manageDialog.row"
          class="dialog-body"
        >
          <q-card
            flat
            bordered
            class="detail-card q-mb-md"
          >
            <q-card-section>
              <div
                class="row items-center justify-between q-col-gutter-md"
              >
                <div class="col-12 col-md">
                  <div
                    class="text-h6 text-weight-bold"
                  >
                    {{
                      manageDialog.row
                        .requestNumber
                    }}
                  </div>

                  <div
                    class="text-caption text-grey-7"
                  >
                    Solicitada el
                    {{
                      formatDateTime(
                        manageDialog.row
                          .createdAt
                      )
                    }}
                  </div>
                </div>

                <div
                  class="col-12 col-md-auto"
                >
                  <q-badge
                    rounded
                    :color="
                      statusColor(
                        manageDialog.row
                          .status
                      )
                    "
                    text-color="white"
                    class="status-badge hero-status"
                  >
                    {{
                      statusLabel(
                        manageDialog.row
                          .status
                      )
                    }}
                  </q-badge>
                </div>
              </div>

              <div
                class="row q-col-gutter-md q-mt-md"
              >
                <div
                  class="col-12 col-md-3"
                >
                  <div class="mini-info-card">
                    <div class="mini-label">
                      Monto equivalente
                    </div>

                    <div class="mini-value">
                      {{
                        money(
                          manageDialog.row
                            .requestedAmount
                        )
                      }}
                    </div>
                  </div>
                </div>

                <div
                  class="col-12 col-md-3"
                >
                  <div class="mini-info-card">
                    <div class="mini-label">
                      Cuota
                    </div>

                    <div class="mini-value">
                      {{
                        money(
                          manageDialog.row
                            .loanQuoteSnapshot
                            ?.installmentAmount
                        )
                      }}
                    </div>
                  </div>
                </div>

                <div
                  class="col-12 col-md-3"
                >
                  <div class="mini-info-card">
                    <div class="mini-label">
                      Total intereses
                    </div>

                    <div class="mini-value">
                      {{
                        money(
                          manageDialog.row
                            .loanQuoteSnapshot
                            ?.totalInterest
                        )
                      }}
                    </div>
                  </div>
                </div>

                <div
                  class="col-12 col-md-3"
                >
                  <div class="mini-info-card">
                    <div class="mini-label">
                      Total a pagar
                    </div>

                    <div class="mini-value">
                      {{
                        money(
                          manageDialog.row
                            .loanQuoteSnapshot
                            ?.totalToPay
                        )
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-tabs
            v-model="manageDialog.tab"
            dense
            active-color="primary"
            indicator-color="primary"
            align="left"
            class="tabs-card text-grey-8"
          >
            <q-tab
              name="summary"
              icon="summarize"
              label="Resumen"
            />

            <q-tab
              name="amortization"
              icon="table_chart"
              label="Amortización"
            />

            <q-tab
              name="contract"
              icon="article"
              label="Contrato"
            />

            <q-tab
              name="history"
              icon="history"
              label="Historial"
            />
          </q-tabs>

          <q-tab-panels
            v-model="manageDialog.tab"
            animated
            class="bg-transparent"
          >
            <q-tab-panel
              name="summary"
              class="q-pa-none q-pt-md"
            >
              <div class="summary-list">
                <div class="summary-item">
                  <div class="summary-label">
                    Sueldo mensual usado
                  </div>

                  <div class="summary-value">
                    {{
                      money(
                        manageDialog.row
                          .salarySnapshot
                          ?.monthlySalary
                      )
                    }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">
                    Valor diario usado
                  </div>

                  <div class="summary-value">
                    {{
                      money(
                        manageDialog.row
                          .salarySnapshot
                          ?.dailySalary
                      )
                    }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">
                    Días utilizados
                  </div>

                  <div class="summary-value">
                    {{
                      numberValue(
                        manageDialog.row
                          .vacationSnapshot
                          ?.guaranteedDays
                      )
                    }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">
                    Monto equivalente
                  </div>

                  <div class="summary-value">
                    {{
                      money(
                        manageDialog.row
                          .vacationSnapshot
                          ?.estimatedGuaranteeAmount
                      )
                    }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">
                    Tasa
                  </div>

                  <div class="summary-value">
                    {{
                      numberValue(
                        manageDialog.row
                          .loanProviderSnapshot
                          ?.interestRate
                      )
                    }}%
                    {{
                      getLoanRateTypeText(
                        manageDialog.row
                          .loanProviderSnapshot
                          ?.interestRateType
                      ) || ""
                    }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">
                    Producto
                  </div>

                  <div class="summary-value">
                    {{
                      manageDialog.row
                        .loanProviderSnapshot
                        ?.productName || "-"
                    }}
                  </div>
                </div>

                <div
                  class="summary-item summary-item--full"
                >
                  <div class="summary-label">
                    Propósito
                  </div>

                  <div class="summary-text">
                    {{
                      manageDialog.row
                        .purpose || "-"
                    }}
                  </div>
                </div>

                <div
                  class="summary-item summary-item--full"
                >
                  <div class="summary-label">
                    Comentario
                  </div>

                  <div class="summary-text">
                    {{
                      manageDialog.row
                        .employeeComment || "-"
                    }}
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel
              name="amortization"
              class="q-pa-none q-pt-md"
            >
              <EmployeeLoanAmortizationTable
                :rows="
                  manageDialog.row
                    .amortizationSchedule || []
                "
              />
            </q-tab-panel>

            <q-tab-panel
              name="contract"
              class="q-pa-none q-pt-md"
            >
              <q-card
                flat
                bordered
                class="contract-card"
              >
                <q-card-section>
                  <div class="contract-header-row">
                    <div>
                      <div class="table-title">
                        Contrato firmado
                      </div>

                      <div class="table-subtitle">
                        Firmado el
                        {{
                          formatDateTime(
                            manageDialog.row
                              .contractSnapshot
                              ?.signedAt
                          )
                        }}
                      </div>
                    </div>

                    <q-badge
                      rounded
                      :color="
                        contractGenerationStatusColor(
                          manageDialog.row
                        )
                      "
                      text-color="white"
                      class="status-badge"
                    >
                      {{
                        contractGenerationStatusLabel(
                          manageDialog.row
                        )
                      }}
                    </q-badge>
                  </div>

                  <div
                    v-if="
                      hasGeneratedContract(
                        manageDialog.row
                      )
                    "
                    class="contract-actions q-mt-md"
                  >
                    <q-btn
                      v-if="
                        contractPdfUrl(
                          manageDialog.row
                        )
                      "
                      unelevated
                      rounded
                      no-caps
                      color="primary"
                      icon="picture_as_pdf"
                      label="Abrir PDF"
                      :href="
                        contractPdfUrl(
                          manageDialog.row
                        )
                      "
                      target="_blank"
                    />

                    <q-btn
                      v-if="
                        contractPdfUrl(
                          manageDialog.row
                        )
                      "
                      flat
                      rounded
                      no-caps
                      color="primary"
                      icon="download"
                      label="Descargar"
                      :href="
                        contractPdfUrl(
                          manageDialog.row
                        )
                      "
                      target="_blank"
                    />

                    <q-btn
                      v-if="
                        contractHtmlUrl(
                          manageDialog.row
                        )
                      "
                      flat
                      rounded
                      no-caps
                      color="secondary"
                      icon="code"
                      label="Ver HTML"
                      :href="
                        contractHtmlUrl(
                          manageDialog.row
                        )
                      "
                      target="_blank"
                    />
                  </div>

                  <div
                    v-if="
                      hasGeneratedContract(
                        manageDialog.row
                      )
                    "
                    class="contract-info-grid q-mt-md"
                  >
                    <div class="contract-info-item">
                      <div class="mini-label">
                        Documento
                      </div>

                      <div class="mini-value">
                        {{
                          contractFileName(
                            manageDialog.row
                          )
                        }}
                      </div>
                    </div>

                    <div class="contract-info-item">
                      <div class="mini-label">
                        Plantilla
                      </div>

                      <div class="mini-value">
                        {{
                          manageDialog.row
                            .contractSnapshot
                            ?.templateCode || "-"
                        }}
                      </div>
                    </div>

                    <div class="contract-info-item">
                      <div class="mini-label">
                        Firmado por
                      </div>

                      <div class="mini-value">
                        {{
                          manageDialog.row
                            .contractSnapshot
                            ?.signatureName || "-"
                        }}
                      </div>
                    </div>

                    <div class="contract-info-item">
                      <div class="mini-label">
                        Documento firma
                      </div>

                      <div class="mini-value">
                        {{
                          manageDialog.row
                            .contractSnapshot
                            ?.signatureDocument ||
                          "-"
                        }}
                      </div>
                    </div>

                    <div class="contract-info-item">
                      <div class="mini-label">
                        Plataforma origen
                      </div>

                      <div class="mini-value">
                        {{
                          manageDialog.row
                            .contractSnapshot
                            ?.sourcePlatformCode ||
                          "-"
                        }}
                      </div>
                    </div>

                    <div class="contract-info-item">
                      <div class="mini-label">
                        Checksum
                      </div>

                      <div
                        class="mini-value contract-checksum"
                      >
                        {{
                          manageDialog.row
                            .contractSnapshot
                            ?.checksum || "-"
                        }}
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="
                      hasGeneratedContract(
                        manageDialog.row
                      )
                    "
                    class="contract-viewer-shell q-mt-md"
                  >
                    <iframe
                      v-if="
                        contractPreviewUrl(
                          manageDialog.row
                        )
                      "
                      class="contract-viewer-frame"
                      :src="
                        contractPreviewUrl(
                          manageDialog.row
                        )
                      "
                      title="Contrato firmado"
                    />

                    <div
                      v-else
                      class="contract-empty-state"
                    >
                      <q-icon
                        name="description"
                        size="46px"
                        color="grey-5"
                      />

                      <div
                        class="text-subtitle1 text-weight-bold q-mt-sm"
                      >
                        No se pudo cargar la vista previa
                      </div>

                      <div
                        class="text-caption text-grey-7"
                      >
                        El contrato existe, pero no tiene una URL
                        disponible para visualizar.
                      </div>
                    </div>
                  </div>

                  <div
                    v-else
                    class="contract-empty-state q-mt-md"
                  >
                    <q-icon
                      name="description"
                      size="46px"
                      color="grey-5"
                    />

                    <div
                      class="text-subtitle1 text-weight-bold q-mt-sm"
                    >
                      Esta solicitud no tiene contrato generado
                    </div>

                    <div
                      class="text-caption text-grey-7"
                    >
                      Cuando el empleado firme el contrato, aquí
                      se mostrará el PDF generado.
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </q-tab-panel>

            <q-tab-panel
              name="history"
              class="q-pa-none q-pt-md"
            >
              <EmployeeLoanHistoryTimeline
                :history="
                  historyById[
                    manageDialog.row._id
                  ] || []
                "
                :loading="
                  historyLoading[
                    manageDialog.row._id
                  ] || false
                "
                :error="
                  historyError[
                    manageDialog.row._id
                  ] || ''
                "
                @refresh="
                  () =>
                    fetchHistory(
                      manageDialog.row._id,
                      true
                    )
                "
              />
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useQuasar } from "quasar";
import moment from "moment";

import methodsHttp from "src/api/methodsHttp";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import EmployeeLoanHistoryTimeline from "src/components/employeeLoan/EmployeeLoanHistoryTimeline.vue";
import EmployeeLoanAmortizationTable from "src/components/employeeLoan/EmployeeLoanAmortizationTable.vue";
import EmployeeLoanCreateRequestDialog from "src/components/employeeLoan/EmployeeLoanCreateRequestDialog.vue";
import { getLoanRateTypeText } from "src/helpers/catalogs/loan.catalog";

const $q = useQuasar();

const loading = ref(false);
const rows = ref([]);

const eligibility = ref(null);
const eligibilityError = ref("");

const createDialogOpen = ref(false);

const filters = ref({
  q: "",
  statuses: [],
});

const manageDialog = ref({
  open: false,
  row: null,
  tab: "summary",
});

const historyById = reactive({});
const historyLoading = reactive({});
const historyError = reactive({});

const statusOptions = [
  "DRAFT",
  "SUBMITTED",
  "SENT_TO_EXTERNAL",
  "EXTERNAL_RECEIVED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "TERMINATED",
  "ERROR",
  "CLOSED",
];

const columns = [
  {
    name: "actions",
    label: "Acciones",
    align: "center",
    field: () => "",
  },
  {
    name: "requestNumber",
    label: "Solicitud",
    align: "left",
    field: "requestNumber",
  },
  {
    name: "status",
    label: "Estado",
    align: "center",
    field: "status",
  },
  {
    name: "requestedAmount",
    label: "Monto equivalente",
    align: "left",
    field: "requestedAmount",
  },
  {
    name: "installment",
    label: "Cuota",
    align: "left",
    field: (row) =>
      row?.loanQuoteSnapshot
        ?.installmentAmount || 0,
  },
  {
    name: "guarantee",
    label: "Días utilizados",
    align: "left",
    field: (row) =>
      row?.vacationSnapshot
        ?.guaranteedDays || 0,
  },
  {
    name: "purpose",
    label: "Propósito / comentario",
    align: "left",
    field: "purpose",
  },
];

const loanVacationDays = computed(() => {
  return Number(
    eligibility.value?.vacationSummary
      ?.availableForLoanDays ??
      eligibility.value?.eligibility
        ?.availableForLoanDays ??
      eligibility.value?.vacationBalance
        ?.availableForLoanDays ??
      eligibility.value?.vacationBalance
        ?.availableDays ??
      0,
  );
});

const maxGuaranteeDays = computed(() => {
  return Math.max(
    0,
    Math.floor(
      Number(
        eligibility.value?.eligibility
          ?.maxGuaranteeDays || 0,
      ),
    ),
  );
});

const vacationDayAmount = computed(() => {
  const config =
    eligibility.value?.productRules ||
    eligibility.value?.productConfig ||
    {};

  const mode = String(
    config.vacationDayValueMode ||
      "DAILY_SALARY",
  ).toUpperCase();

  if (mode === "NONE") {
    return 0;
  }

  if (mode === "CUSTOM_AMOUNT") {
    return Number(
      config.customVacationDayAmount || 0,
    );
  }

  return Number(
    eligibility.value?.salarySnapshot
      ?.dailySalary || 0,
  );
});

const canCreateLoanRequest = computed(() => {
  return Boolean(
    eligibility.value &&
      maxGuaranteeDays.value > 0 &&
      vacationDayAmount.value > 0,
  );
});

onMounted(async () => {
  await reloadPage();
});

watch(
  () => [
    filters.value.q,
    filters.value.statuses,
  ],
  async () => {
    await loadMyRequests();
  },
  {
    deep: true,
  },
);

watch(
  () => manageDialog.value.tab,
  async (value) => {
    if (
      value === "history" &&
      manageDialog.value.row?._id
    ) {
      await fetchHistory(
        manageDialog.value.row._id,
        false,
      );
    }
  },
);

const reloadPage = async () => {
  await Promise.all([
    loadEligibility(),
    loadMyRequests(),
  ]);
};

const loadEligibility = async () => {
  try {
    const resp =
      await methodsHttp.getApi(
        "employee-loan/requests/eligibility",
      );

    if (resp?.ok) {
      eligibility.value = resp;
      eligibilityError.value = "";
      return;
    }

    eligibility.value = null;

    eligibilityError.value =
      resp?.mensaje ||
      "No se pudo calcular tu elegibilidad.";
  } catch (error) {
    console.error(
      "loadEligibility error:",
      error,
    );

    eligibility.value = null;

    eligibilityError.value =
      error?.response?.data?.mensaje ||
      "Error calculando elegibilidad.";
  }
};

const loadMyRequests = async () => {
  loading.value = true;

  try {
    const selectedId =
      manageDialog.value.row?._id || null;

    const params = new URLSearchParams();

    if (filters.value.q?.trim()) {
      params.set(
        "q",
        filters.value.q.trim(),
      );
    }

    const statuses = (
      filters.value.statuses || []
    ).join(",");

    if (statuses) {
      params.set("statuses", statuses);
    }

    const url = params.toString()
      ? `employee-loan/requests/mine?${params.toString()}`
      : "employee-loan/requests/mine";

    const resp =
      await methodsHttp.getApi(url);

    if (resp?.ok) {
      rows.value =
        resp.loanRequests ||
        resp.requests ||
        resp.data ||
        [];

      if (selectedId) {
        const found = rows.value.find(
          (item) =>
            item._id === selectedId,
        );

        if (found) {
          manageDialog.value.row = found;
        }
      }

      return;
    }

    rows.value = [];
  } catch (error) {
    console.error(
      "loadMyRequests error:",
      error,
    );

    rows.value = [];

    $q.notify({
      type: "negative",
      message:
        "Error cargando tus solicitudes.",
    });
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  if (!canCreateLoanRequest.value) {
    $q.notify({
      type: "warning",
      message:
        "Actualmente no puedes crear una solicitud.",
    });

    return;
  }

  createDialogOpen.value = true;
};

const handleLoanCreated = async () => {
  await reloadPage();
};

const openManageDialog = async (
  row,
  tab = "summary",
) => {
  manageDialog.value = {
    open: true,
    row,
    tab,
  };

  if (tab === "history") {
    await fetchHistory(
      row._id,
      false,
    );
  }
};

const closeManageDialog = () => {
  manageDialog.value = {
    open: false,
    row: null,
    tab: "summary",
  };
};

const fetchHistory = async (
  id,
  force = false,
) => {
  if (!id) return;
  if (!force && historyById[id]) return;
  if (historyLoading[id]) return;

  historyLoading[id] = true;
  historyError[id] = "";

  try {
    const resp =
      await methodsHttp.getApi(
        `employee-loan/requests/${id}/history`,
      );

    if (resp?.ok) {
      historyById[id] =
        resp.history || [];

      return;
    }

    historyById[id] = [];

    historyError[id] =
      resp?.mensaje ||
      "No se pudo cargar el historial.";
  } catch (error) {
    console.error(
      "fetchHistory error:",
      error,
    );

    historyById[id] = [];

    historyError[id] =
      "Error cargando historial.";
  } finally {
    historyLoading[id] = false;
  }
};

const canCancel = (row) => {
  const status = String(
    row?.status || "",
  ).toUpperCase();

  const sync = String(
    row?.externalSyncStatus ||
      "NOT_SENT",
  ).toUpperCase();

  return (
    [
      "SUBMITTED",
      "ERROR",
      "DRAFT",
    ].includes(status) &&
    ["NOT_SENT"].includes(sync)
  );
};

const confirmCancel = (row) => {
  $q.dialog({
    title: "Cancelar solicitud",

    message:
      `¿Seguro que deseas cancelar la solicitud ${row.requestNumber}?`,

    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await cancelRequest(row);
  });
};

const cancelRequest = async (row) => {
  try {
    const resp =
      await methodsHttp.postApi(
        `employee-loan/requests/${row._id}/cancel`,
        {},
      );

    if (resp?.ok) {
      $q.notify({
        type: "positive",
        message:
          resp.mensaje ||
          "Solicitud cancelada.",
      });

      await reloadPage();

      await fetchHistory(
        row._id,
        true,
      );

      return;
    }

    $q.notify({
      type: "negative",
      message:
        resp?.mensaje ||
        "No se pudo cancelar.",
    });
  } catch (error) {
    console.error(
      "cancelRequest error:",
      error,
    );

    $q.notify({
      type: "negative",
      message:
        error?.response?.data?.mensaje ||
        "Error cancelando solicitud.",
    });
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

const formatDateTime = (value) => {
  if (!value) return "-";

  return moment(value).format(
    "YYYY/MM/DD hh:mm A",
  );
};

const statusLabel = (status) => {
  const map = {
    DRAFT: "Borrador",
    SUBMITTED: "Enviada",
    SENT_TO_EXTERNAL:
      "Enviada externo",
    EXTERNAL_RECEIVED:
      "Recibida externo",
    UNDER_REVIEW: "En revisión",
    APPROVED: "Aprobada",
    REJECTED: "Rechazada",
    CANCELLED: "Cancelada",
    TERMINATED: "Desvinculado",
    ERROR: "Error",
    CLOSED: "Cerrada",
  };

  return (
    map[
      String(status || "").toUpperCase()
    ] ||
    status ||
    "-"
  );
};

const statusColor = (status) => {
  const map = {
    DRAFT: "grey-7",
    SUBMITTED: "primary",
    SENT_TO_EXTERNAL: "blue-8",
    EXTERNAL_RECEIVED: "blue-10",
    UNDER_REVIEW: "warning",
    APPROVED: "positive",
    REJECTED: "negative",
    CANCELLED: "grey-7",
    TERMINATED: "purple-8",
    ERROR: "negative",
    CLOSED: "green-10",
  };

  return (
    map[
      String(status || "").toUpperCase()
    ] || "grey-7"
  );
};

const contractPdfUrl = (row) => {
  return String(
    row?.contractSnapshot
      ?.generatedPdfUrl || "",
  );
};

const contractHtmlUrl = (row) => {
  return String(
    row?.contractSnapshot?.metadata
      ?.generatedHtmlUrl || "",
  );
};

const contractPreviewUrl = (row) => {
  return (
    contractPdfUrl(row) ||
    contractHtmlUrl(row)
  );
};

const hasGeneratedContract = (row) => {
  return Boolean(
    row?.contractSnapshot &&
      (
        row.contractSnapshot
          .generatedPdfUrl ||
        row.contractSnapshot.metadata
          ?.generatedHtmlUrl
      ),
  );
};

const contractFileName = (row) => {
  return (
    row?.contractSnapshot
      ?.generatedPdfFileName ||
    row?.contractSnapshot?.metadata
      ?.generatedHtmlFileName ||
    "contrato-generado"
  );
};

const contractGenerationStatusLabel = (
  row,
) => {
  const status = String(
    row?.contractSnapshot
      ?.generationStatus || "",
  ).toUpperCase();

  const map = {
    NOT_GENERATED: "No generado",
    GENERATING: "Generando",
    GENERATED: "Generado",
    FAILED: "Falló",
  };

  return map[status] || "Sin contrato";
};

const contractGenerationStatusColor = (
  row,
) => {
  const status = String(
    row?.contractSnapshot
      ?.generationStatus || "",
  ).toUpperCase();

  const map = {
    NOT_GENERATED: "grey-7",
    GENERATING: "warning",
    GENERATED: "positive",
    FAILED: "negative",
  };

  return map[status] || "grey-7";
};
</script>

<style scoped>
.employee-loan-page {
  min-height: calc(100vh - 100px);
}

.header-btn {
  height: 40px;
  border-radius: 999px;
  font-weight: 800;
}

.header-field {
  min-width: 250px;
}

.header-search {
  min-width: 300px;
}

.stats-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(160px, 1fr));
  gap: 14px;
}

.stat-card {
  display: flex;
  min-width: 0;
  min-height: 86px;
  padding: 14px;
  align-items: center;
  gap: 12px;
  border-radius: 20px;
  background: white;
  box-shadow:
    0 14px 34px rgba(15, 23, 42, 0.04);
}

.stat-icon {
  width: 44px;
  min-width: 44px;
  height: 44px;
  border-radius: 15px;
  font-size: 22px;
}

.stat-label,
.mini-label,
.summary-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.stat-value {
  margin-top: 5px;
  overflow: hidden;
  color: #0f172a;
  font-size: clamp(
    1rem,
    1.4vw,
    1.45rem
  );
  font-weight: 900;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-card {
  overflow: hidden;
  border-radius: 22px;
  box-shadow:
    0 16px 44px rgba(15, 23, 42, 0.04);
}

.table-header {
  min-height: 76px;
  background: white;
}

.table-title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.table-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}

.loan-table {
  background: white;
}

.table-row {
  cursor: pointer;
  transition: background 0.2s ease;
}

.table-row:hover {
  background:
    rgba(15, 23, 42, 0.025);
}

.amount-text {
  color: #0f172a;
  font-weight: 900;
}

.status-badge {
  padding: 6px 10px;
  font-weight: 800;
}

.truncate-cell {
  max-width: 340px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manage-dialog {
  width: 1080px;
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
  flex: 1;
  max-height: calc(92vh - 78px);
  overflow-y: auto;
  padding: 18px;
  background: #fff;
}

.detail-card,
.tabs-card,
.contract-card {
  border: 1px solid
    rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background: white;
  box-shadow:
    0 14px 32px rgba(15, 23, 42, 0.04);
}

.mini-value,
.summary-value {
  margin-top: 4px;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 900;
}

.mini-info-card {
  min-height: 64px;
  padding: 12px;
  border: 1px solid
    rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  background: #f8fafc;
}

.summary-list {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.summary-item {
  padding: 12px;
  border: 1px solid
    rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  background: #f8fafc;
}

.summary-item--full {
  grid-column: 1 / -1;
}

.summary-text {
  margin-top: 5px;
  color: #0f172a;
  font-size: 0.86rem;
  line-height: 1.35;
  white-space: pre-wrap;
}

.hero-status {
  padding: 8px 12px;
}

.contract-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.contract-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.contract-info-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.contract-info-item {
  min-height: 64px;
  padding: 12px;
  border: 1px solid
    rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  background: #f8fafc;
}

.contract-checksum {
  word-break: break-all;
  font-size: 0.72rem;
  line-height: 1.35;
}

.contract-viewer-shell {
  height: 720px;
  overflow: hidden;
  border: 1px solid
    rgba(15, 23, 42, 0.1);
  border-radius: 18px;
  background: #0f172a;
}

.contract-viewer-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: white;
}

.contract-empty-state {
  display: grid;
  min-height: 260px;
  padding: 32px 18px;
  place-items: center;
  border: 1px dashed
    rgba(15, 23, 42, 0.16);
  border-radius: 18px;
  text-align: center;
  background: #f8fafc;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns:
      repeat(2, minmax(140px, 1fr));
  }
}

@media (max-width: 900px) {
  .summary-list {
    grid-template-columns: 1fr;
  }

  .contract-info-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .contract-viewer-shell {
    height: 620px;
  }
}

@media (max-width: 599px) {
  .header-field,
  .header-search {
    width: 100%;
    min-width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .manage-dialog {
    width: 96vw;
    max-height: 94vh;
  }

  .dialog-body {
    max-height: calc(94vh - 78px);
    padding: 12px;
  }

  .contract-header-row {
    flex-direction: column;
  }

  .contract-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .contract-actions .q-btn {
    width: 100%;
  }

  .contract-info-grid {
    grid-template-columns: 1fr;
  }

  .contract-viewer-shell {
    height: 560px;
  }
}
</style>
