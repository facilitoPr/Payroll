<template>
  <q-page class="q-pa-md employee-loan-page">
    <PageHeaderCard
      title="Solicitudes de préstamos"
      subtitle="Consulta y gestiona las solicitudes creadas por empleados desde la plataforma principal."
      icon="payments"
    >
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="refresh"
          label="Actualizar"
          class="header-btn"
          no-caps
          :loading="loading"
          @click="reloadRequests"
        />

        <q-input
          v-model="filters.q"
          outlined
          dense
          rounded
          debounce="350"
          label="Buscar"
          placeholder="Empleado, número, estado..."
          color="primary"
          class="header-search"
        >
          <template #prepend>
            <q-icon name="search" color="primary" />
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
        />

        <q-select
          v-model="filters.externalSyncStatus"
          outlined
          dense
          rounded
          clearable
          label="Sync"
          color="primary"
          class="header-field"
          :options="syncOptions"
        />
      </template>
    </PageHeaderCard>

    <div class="stats-grid q-mb-md">
      <q-card flat bordered class="stat-card">
        <q-avatar class="stat-icon bg-blue-1 text-primary">
          <q-icon name="payments" />
        </q-avatar>
        <div>
          <div class="stat-label">Total</div>
          <div class="stat-value">{{ stats.total }}</div>
        </div>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-avatar class="stat-icon bg-orange-1 text-orange-10">
          <q-icon name="hourglass_empty" />
        </q-avatar>
        <div>
          <div class="stat-label">Enviadas</div>
          <div class="stat-value">{{ stats.submitted }}</div>
        </div>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-avatar class="stat-icon bg-green-1 text-positive">
          <q-icon name="check_circle" />
        </q-avatar>
        <div>
          <div class="stat-label">Aprobadas</div>
          <div class="stat-value">{{ stats.approved }}</div>
        </div>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-avatar class="stat-icon bg-purple-1 text-purple-9">
          <q-icon name="work_off" />
        </q-avatar>
        <div>
          <div class="stat-label">Desvinculados</div>
          <div class="stat-value">{{ stats.terminated }}</div>
        </div>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-avatar class="stat-icon bg-red-1 text-negative">
          <q-icon name="cancel" />
        </q-avatar>
        <div>
          <div class="stat-label">Rechazadas</div>
          <div class="stat-value">{{ stats.rejected }}</div>
        </div>
      </q-card>
    </div>

    <q-card flat bordered class="panel-card">
      <q-card-section class="table-header row items-center justify-between">
        <div>
          <div class="table-title">Listado de solicitudes</div>
          <div class="table-subtitle">
            Revisa contrato, cuotas pendientes, pagos y estados de cada préstamo.
          </div>
        </div>

        <q-chip dense color="blue-1" text-color="primary" icon="admin_panel_settings">
          Plataforma principal
        </q-chip>
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
        :rows-per-page-options="[limit]"
        hide-pagination
        class="loan-table"
      >
        <template #body="props">
          <q-tr
            :props="props"
            class="table-row"
            @click="openDetailDialog(props.row, 'summary')"
          >
            <q-td key="actions" :props="props">
              <q-btn
                dense
                rounded
                unelevated
                no-caps
                color="primary"
                icon="visibility"
                @click.stop="openDetailDialog(props.row, 'summary')"
              />
            </q-td>

            <q-td key="employee" :props="props">
              <div class="employee-cell">
                <q-avatar size="36px" class="employee-avatar">
                  {{ initials(props.row.employee?.name) }}
                </q-avatar>
                <div>
                  <div class="employee-name">
                    {{ props.row.employee?.name || "-" }}
                  </div>
                  <div class="employee-email">
                    {{ props.row.employee?.email || "" }}
                  </div>
                </div>
              </div>
            </q-td>

            <q-td key="requestNumber" :props="props">
              <div class="text-weight-bold">
                {{ props.row.requestNumber }}
              </div>
              <div class="text-caption text-grey-7">
                {{ formatDateTime(props.row.createdAt) }}
              </div>
            </q-td>

            <q-td key="status" :props="props">
              <q-badge
                rounded
                :color="statusColor(props.row.status)"
                text-color="white"
                class="status-badge"
              >
                {{ statusLabel(props.row.status) }}
              </q-badge>
            </q-td>

            <q-td key="amount" :props="props">
              <div class="amount-text">
                {{ money(props.row.requestedAmount) }}
              </div>
            </q-td>

            <q-td key="guarantee" :props="props">
              <q-chip dense color="green-1" text-color="positive" icon="beach_access">
                {{ numberValue(props.row.vacationSnapshot?.guaranteedDays) }} día(s)
              </q-chip>
            </q-td>

            <q-td key="sync" :props="props">
              <q-badge
                rounded
                :color="syncColor(props.row.externalSyncStatus)"
                text-color="white"
              >
                {{ props.row.externalSyncStatus || "NOT_SENT" }}
              </q-badge>
            </q-td>
          </q-tr>
        </template>

        <template #no-data>
          <div class="full-width text-center q-pa-xl text-grey-7">
            <q-icon name="payments" size="44px" color="grey-5" />
            <div class="text-subtitle1 text-weight-bold q-mt-sm">
              No hay solicitudes
            </div>
            <div class="text-caption">
              Cuando los empleados soliciten préstamos aparecerán aquí.
            </div>
          </div>
        </template>
      </q-table>

      <div class="pagination-wrap">
        <TablePagination
          v-model="initialPagination"
          :orderQuantity="orderQuantity"
          color="light-blue-10"
          active-color="light-blue-5"
          :maxPages="6"
        />
      </div>
    </q-card>

    <q-dialog v-model="detailDialog.open" persistent>
      <q-card class="manage-dialog">
        <q-card-section class="dialog-header bg-primary row items-center justify-between">
          <div class="row items-center no-wrap text-white">
            <div class="dialog-icon">
              <q-icon name="payments" size="30px" />
            </div>
            <div>
              <div class="dialog-title">Detalle de solicitud</div>
              <div class="dialog-subtitle">
                Consulta información del empleado, sueldo, garantía e historial.
              </div>
            </div>
          </div>

          <q-btn flat round dense color="white" icon="close" @click="closeDetailDialog" />
        </q-card-section>

        <q-card-section v-if="detailDialog.row" class="dialog-body">
          <q-inner-loading :showing="detailLoading">
            <q-spinner color="primary" size="42px" />
          </q-inner-loading>

          <q-card flat bordered class="detail-card q-mb-md">
            <q-card-section>
              <div class="row items-center justify-between q-col-gutter-md">
                <div class="col-12 col-md">
                  <div class="row items-center no-wrap">
                    <q-avatar size="54px" class="employee-avatar">
                      {{ initials(detailDialog.row.employee?.name) }}
                    </q-avatar>
                    <div class="q-ml-md">
                      <div class="text-h6 text-weight-bold">
                        {{ detailDialog.row.employee?.name || "Empleado" }}
                      </div>
                      <div class="text-caption text-grey-7">
                        {{ detailDialog.row.employee?.email || "" }}
                      </div>
                      <div class="text-caption text-grey-7">
                        Solicitud: {{ detailDialog.row.requestNumber }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-md-auto row items-center q-gutter-sm">
                  <q-badge
                    rounded
                    :color="statusColor(detailDialog.row.status)"
                    text-color="white"
                    class="status-badge hero-status"
                  >
                    {{ statusLabel(detailDialog.row.status) }}
                  </q-badge>

                  <q-btn
                    v-if="canAdminCancel(detailDialog.row)"
                    unelevated
                    no-caps
                    dense
                    color="negative"
                    icon="cancel"
                    label="Cancelar"
                    :loading="actionLoading"
                    @click="confirmAdminCancel(detailDialog.row)"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-md">
                <div class="col-12 col-md-3">
                  <div class="mini-info-card">
                    <div class="mini-label">Monto solicitado</div>
                    <div class="mini-value">
                      {{ money(detailDialog.row.requestedAmount) }}
                    </div>
                  </div>
                </div>

                <div class="col-12 col-md-3">
                  <div class="mini-info-card">
                    <div class="mini-label">Máximo calculado</div>
                    <div class="mini-value">
                      {{ money(detailDialog.row.maxAllowedAmount) }}
                    </div>
                  </div>
                </div>

                <div class="col-12 col-md-3">
                  <div class="mini-info-card">
                    <div class="mini-label">Días garantía</div>
                    <div class="mini-value">
                      {{ numberValue(detailDialog.row.vacationSnapshot?.guaranteedDays) }}
                    </div>
                  </div>
                </div>

                <div class="col-12 col-md-3">
                  <div class="mini-info-card">
                    <div class="mini-label">Valor garantía</div>
                    <div class="mini-value">
                      {{ money(detailDialog.row.vacationSnapshot?.estimatedGuaranteeAmount) }}
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-banner
            v-if="isTerminatedLoan(detailDialog.row)"
            rounded
            class="bg-purple-1 text-purple-10 q-mb-md"
          >
            <template #avatar>
              <q-icon name="work_off" color="purple-9" />
            </template>
            Este préstamo fue alcanzado por una desvinculación. Se retuvo
            {{ money(terminationSummary(detailDialog.row).amountDeducted) }}
            de la liquidación y queda pendiente
            {{ money(terminationSummary(detailDialog.row).remainingOutstanding) }}.
          </q-banner>

          <q-tabs
            v-model="detailDialog.tab"
            dense
            active-color="primary"
            indicator-color="primary"
            align="left"
            class="tabs-card text-grey-8"
          >
            <q-tab name="summary" icon="summarize" label="Resumen" />
            <q-tab name="contract" icon="description" label="Contrato" />
            <q-tab name="payments" icon="receipt_long" label="Cuotas" />
            <q-tab name="termination" icon="work_off" label="Desvinculación" />
            <q-tab name="history" icon="history" label="Historial" />
          </q-tabs>

          <q-tab-panels v-model="detailDialog.tab" animated class="bg-transparent">
            <q-tab-panel name="summary" class="q-pa-none q-pt-md">
              <div class="summary-list">
                <div class="summary-item">
                  <div class="summary-label">Sueldo mensual usado</div>
                  <div class="summary-value">
                    {{ money(detailDialog.row.salarySnapshot?.monthlySalary) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Sueldo diario usado</div>
                  <div class="summary-value">
                    {{ money(detailDialog.row.salarySnapshot?.dailySalary) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Producto</div>
                  <div class="summary-value">
                    {{ detailDialog.row.loanProviderSnapshot?.productName || "-" }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Monto aprobado</div>
                  <div class="summary-value">
                    {{ money(detailDialog.row.approvedAmount || detailDialog.row.requestedAmount) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Total a pagar</div>
                  <div class="summary-value">
                    {{ money(detailDialog.row.loanQuoteSnapshot?.totalToPay) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Interés total</div>
                  <div class="summary-value">
                    {{ money(detailDialog.row.loanQuoteSnapshot?.totalInterest) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Días antes de garantía</div>
                  <div class="summary-value">
                    {{ numberValue(detailDialog.row.vacationSnapshot?.availableDaysBeforeRequest) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Días luego de garantía</div>
                  <div class="summary-value">
                    {{ numberValue(detailDialog.row.vacationSnapshot?.availableDaysAfterGuarantee) }}
                  </div>
                </div>

                <div class="summary-item summary-item--full">
                  <div class="summary-label">Propósito</div>
                  <div class="summary-text">
                    {{ detailDialog.row.purpose || "-" }}
                  </div>
                </div>

                <div class="summary-item summary-item--full">
                  <div class="summary-label">Comentario empleado</div>
                  <div class="summary-text">
                    {{ detailDialog.row.employeeComment || "-" }}
                  </div>
                </div>

                <div class="summary-item summary-item--full">
                  <div class="summary-label">Cuenta del prestamista</div>
                  <div class="summary-text">
                    {{ lenderBankDescription(detailDialog.row) }}
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="contract" class="q-pa-none q-pt-md">
              <div class="summary-list">
                <div class="summary-item">
                  <div class="summary-label">Estado generación</div>
                  <div class="summary-value">
                    {{ contractGenerationStatusLabel(detailDialog.row) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Plantilla</div>
                  <div class="summary-value">
                    {{ detailDialog.row.contractSnapshot?.templateName || "-" }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Aceptado</div>
                  <div class="summary-value">
                    {{ formatDateTime(detailDialog.row.contractSnapshot?.acceptedAt) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Firmado</div>
                  <div class="summary-value">
                    {{ formatDateTime(detailDialog.row.contractSnapshot?.signedAt) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Nombre firma</div>
                  <div class="summary-value">
                    {{ detailDialog.row.contractSnapshot?.signatureName || "-" }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Documento firma</div>
                  <div class="summary-value">
                    {{ detailDialog.row.contractSnapshot?.signatureDocument || "-" }}
                  </div>
                </div>

                <div class="summary-item summary-item--full">
                  <div class="summary-label">Archivos</div>
                  <div class="row q-gutter-sm q-mt-sm">
                    <q-btn
                      v-if="contractPdfUrl(detailDialog.row)"
                      unelevated
                      no-caps
                      color="primary"
                      icon="picture_as_pdf"
                      label="PDF"
                      :href="contractPdfUrl(detailDialog.row)"
                      target="_blank"
                    />
                    <q-btn
                      v-if="contractDocxUrl(detailDialog.row)"
                      unelevated
                      no-caps
                      color="secondary"
                      icon="article"
                      label="DOCX"
                      :href="contractDocxUrl(detailDialog.row)"
                      target="_blank"
                    />
                    <q-chip
                      v-if="!contractPdfUrl(detailDialog.row) && !contractDocxUrl(detailDialog.row)"
                      dense
                      color="grey-2"
                      text-color="grey-8"
                    >
                      Sin archivo generado
                    </q-chip>
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="payments" class="q-pa-none q-pt-md">
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-md-3">
                  <div class="mini-info-card">
                    <div class="mini-label">Pendiente</div>
                    <div class="mini-value">
                      {{ money(installmentSummary(detailDialog.row).pendingAmount) }}
                    </div>
                  </div>
                </div>
                <div class="col-12 col-md-3">
                  <div class="mini-info-card">
                    <div class="mini-label">Cuotas pendientes</div>
                    <div class="mini-value">
                      {{ installmentSummary(detailDialog.row).pending }}
                    </div>
                  </div>
                </div>
                <div class="col-12 col-md-3">
                  <div class="mini-info-card">
                    <div class="mini-label">Vencidas</div>
                    <div class="mini-value">
                      {{ installmentSummary(detailDialog.row).overdue }}
                    </div>
                  </div>
                </div>
                <div class="col-12 col-md-3">
                  <div class="mini-info-card">
                    <div class="mini-label">Próxima cuota</div>
                    <div class="mini-value">
                      {{ formatDate(installmentSummary(detailDialog.row).nextDueDate) }}
                    </div>
                  </div>
                </div>
              </div>

              <EmployeeLoanAmortizationTable
                :rows="detailDialog.row.amortizationSchedule || []"
              />

              <q-banner
                v-if="!(detailDialog.row.amortizationSchedule || []).length"
                rounded
                class="bg-grey-2 text-grey-8"
              >
                <template #avatar>
                  <q-icon name="receipt_long" color="grey-7" />
                </template>
                No hay tabla de amortización registrada para esta solicitud.
              </q-banner>
            </q-tab-panel>

            <q-tab-panel name="termination" class="q-pa-none q-pt-md">
              <div v-if="isTerminatedLoan(detailDialog.row)" class="summary-list">
                <div class="summary-item">
                  <div class="summary-label">Estado anterior</div>
                  <div class="summary-value">
                    {{ statusLabel(terminationSummary(detailDialog.row).statusBeforeTermination) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Fecha salida</div>
                  <div class="summary-value">
                    {{ formatDate(terminationSummary(detailDialog.row).terminationDate) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Retenido</div>
                  <div class="summary-value">
                    {{ money(terminationSummary(detailDialog.row).amountDeducted) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Balance restante</div>
                  <div class="summary-value">
                    {{ money(terminationSummary(detailDialog.row).remainingOutstanding) }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Cuotas afectadas</div>
                  <div class="summary-value">
                    {{ (terminationSummary(detailDialog.row).pendingInstallmentNumbers || []).join(", ") || "-" }}
                  </div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Método pago liquidación</div>
                  <div class="summary-value">
                    {{ terminationSummary(detailDialog.row).paymentMethod || "-" }}
                  </div>
                </div>

                <div class="summary-item summary-item--full">
                  <div class="summary-label">Notas</div>
                  <div class="summary-text">
                    {{ terminationSummary(detailDialog.row).notes || "-" }}
                  </div>
                </div>
              </div>

              <q-banner v-else rounded class="bg-grey-2 text-grey-8">
                <template #avatar>
                  <q-icon name="work" color="grey-7" />
                </template>
                Este préstamo no está asociado a una desvinculación.
              </q-banner>
            </q-tab-panel>

            <q-tab-panel name="history" class="q-pa-none q-pt-md">
              <EmployeeLoanHistoryTimeline
                :history="historyById[detailDialog.row._id] || []"
                :loading="historyLoading[detailDialog.row._id] || false"
                :error="historyError[detailDialog.row._id] || ''"
                @refresh="() => fetchHistory(detailDialog.row._id, true)"
              />
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import moment from "moment";

import methodsHttp from "src/api/methodsHttp";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import TablePagination from "src/components/table/TablePagination.vue";
import EmployeeLoanHistoryTimeline from "src/components/employeeLoan/EmployeeLoanHistoryTimeline.vue";
import EmployeeLoanAmortizationTable from "src/components/employeeLoan/EmployeeLoanAmortizationTable.vue";

const $q = useQuasar();

const rows = ref([]);
const loading = ref(false);
const detailLoading = ref(false);
const actionLoading = ref(false);

const stats = ref({
  total: 0,
  submitted: 0,
  sentToExternal: 0,
  underReview: 0,
  approved: 0,
  rejected: 0,
  cancelled: 0,
  terminated: 0,
  closed: 0,
  error: 0,
});

const filters = ref({
  q: "",
  statuses: [],
  externalSyncStatus: null,
});

const limit = ref(15);
const initial = ref(0);
const initialPagination = ref(1);
const orderQuantity = ref(1);

const detailDialog = ref({
  open: false,
  row: null,
  tab: "summary",
});

const historyById = reactive({});
const historyLoading = reactive({});
const historyError = reactive({});

const statusOptions = [
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

const syncOptions = ["NOT_SENT", "PENDING", "SENT", "SYNCED", "FAILED"];

const columns = [
  { name: "actions", label: "Acciones", align: "center", field: () => "" },
  { name: "employee", label: "Empleado", align: "left", field: "employee" },
  {
    name: "requestNumber",
    label: "Solicitud",
    align: "left",
    field: "requestNumber",
  },
  { name: "status", label: "Estado", align: "center", field: "status" },
  { name: "amount", label: "Monto", align: "left", field: "requestedAmount" },
  {
    name: "guarantee",
    label: "Garantía",
    align: "left",
    field: (row) => row?.vacationSnapshot?.guaranteedDays || 0,
  },
  { name: "sync", label: "Sync", align: "center", field: "externalSyncStatus" },
];

onMounted(async () => {
  await reloadRequests();
});

watch(initialPagination, async (value) => {
  const page = Number(value || 1);
  initial.value = page <= 1 ? 0 : page * limit.value - limit.value;
  await loadRequests();
});

watch(
  () => [filters.value.q, filters.value.statuses, filters.value.externalSyncStatus],
  async () => {
    initial.value = 0;
    initialPagination.value = 1;
    await loadRequests();
  },
  { deep: true },
);

watch(
  () => detailDialog.value.tab,
  async (value) => {
    if (value === "history" && detailDialog.value.row?._id) {
      await fetchHistory(detailDialog.value.row._id, false);
    }
  },
);

const reloadRequests = async () => {
  initial.value = 0;
  initialPagination.value = 1;
  await loadRequests();
};

const loadRequests = async () => {
  loading.value = true;

  try {
    const selectedId = detailDialog.value.row?._id || null;
    const params = new URLSearchParams();

    params.set("limit", String(limit.value));
    params.set("initial", String(initial.value));

    if (filters.value.q?.trim()) params.set("q", filters.value.q.trim());

    const statuses = (filters.value.statuses || []).join(",");
    if (statuses) params.set("statuses", statuses);

    if (filters.value.externalSyncStatus) {
      params.set("externalSyncStatus", filters.value.externalSyncStatus);
    }

    const resp = await methodsHttp.getApi(`employee-loan/requests?${params}`);

    if (resp?.ok) {
      rows.value = resp.loanRequests || resp.requests || resp.data || [];

      stats.value = {
        total: Number(resp.stats?.total || 0),
        submitted: Number(resp.stats?.submitted || 0),
        sentToExternal: Number(resp.stats?.sentToExternal || 0),
        underReview: Number(resp.stats?.underReview || 0),
        approved: Number(resp.stats?.approved || 0),
        rejected: Number(resp.stats?.rejected || 0),
        cancelled: Number(resp.stats?.cancelled || 0),
        terminated: Number(resp.stats?.terminated || 0),
        closed: Number(resp.stats?.closed || 0),
        error: Number(resp.stats?.error || 0),
      };

      const total = Number(resp.meta?.total || 0);
      orderQuantity.value = Math.max(1, Math.ceil(total / limit.value));

      if (selectedId) {
        const found = rows.value.find((item) => item._id === selectedId);
        if (found) {
          detailDialog.value.row = {
            ...found,
            ...(detailDialog.value.row || {}),
          };
        }
      }

      return;
    }

    rows.value = [];
    orderQuantity.value = 1;
  } catch (error) {
    console.error("loadRequests error:", error);
    rows.value = [];
    orderQuantity.value = 1;

    $q.notify({
      type: "negative",
      message: "Error cargando solicitudes.",
    });
  } finally {
    loading.value = false;
  }
};

const openDetailDialog = async (row, tab = "summary") => {
  detailDialog.value = {
    open: true,
    row,
    tab,
  };

  await loadLoanDetail(row._id);

  if (tab === "history") {
    await fetchHistory(row._id, false);
  }
};

const loadLoanDetail = async (id) => {
  if (!id) return;

  detailLoading.value = true;

  try {
    const resp = await methodsHttp.getApi(`employee-loan/requests/${id}`);

    if (resp?.ok) {
      detailDialog.value.row = resp.loanRequest || resp.request || resp.data;
      return;
    }

    $q.notify({
      type: "negative",
      message: resp?.mensaje || "No se pudo cargar el detalle del préstamo.",
    });
  } catch (error) {
    console.error("loadLoanDetail error:", error);
    $q.notify({
      type: "negative",
      message: "Error cargando el detalle del préstamo.",
    });
  } finally {
    detailLoading.value = false;
  }
};

const closeDetailDialog = () => {
  detailDialog.value = {
    open: false,
    row: null,
    tab: "summary",
  };
};

const fetchHistory = async (id, force = false) => {
  if (!id) return;
  if (!force && historyById[id]) return;
  if (historyLoading[id]) return;

  historyLoading[id] = true;
  historyError[id] = "";

  try {
    const resp = await methodsHttp.getApi(`employee-loan/requests/${id}/history`);

    if (resp?.ok) {
      historyById[id] = resp.history || [];
      return;
    }

    historyById[id] = [];
    historyError[id] = resp?.mensaje || "No se pudo cargar el historial.";
  } catch (error) {
    historyById[id] = [];
    historyError[id] = "Error cargando historial.";
  } finally {
    historyLoading[id] = false;
  }
};

const initials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
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
  const n = Number(value || 0);
  return Number.isInteger(n) ? n : n.toFixed(2);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return moment(value).format("YYYY/MM/DD hh:mm A");
};

const formatDate = (value) => {
  if (!value) return "-";
  return moment(value).format("YYYY/MM/DD");
};

const statusLabel = (status) => {
  const map = {
    SUBMITTED: "Enviada",
    SENT_TO_EXTERNAL: "Enviada externo",
    EXTERNAL_RECEIVED: "Recibida externo",
    UNDER_REVIEW: "En revisión",
    APPROVED: "Aprobada",
    REJECTED: "Rechazada",
    CANCELLED: "Cancelada",
    TERMINATED: "Desvinculado",
    ERROR: "Error",
    CLOSED: "Cerrada",
  };

  return map[String(status || "").toUpperCase()] || status || "-";
};

const statusColor = (status) => {
  const map = {
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

  return map[String(status || "").toUpperCase()] || "grey-7";
};

const syncColor = (status) => {
  const map = {
    NOT_SENT: "grey-7",
    PENDING: "warning",
    SENT: "blue-8",
    SYNCED: "positive",
    FAILED: "negative",
  };

  return map[String(status || "").toUpperCase()] || "grey-7";
};

const installmentSummary = (row) => {
  return (
    row?.managementSummary?.installments || {
      total: 0,
      pending: 0,
      paid: 0,
      cancelled: 0,
      overdue: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      nextDueDate: null,
    }
  );
};

const terminationSummary = (row) => {
  return (
    row?.managementSummary?.terminationSettlement ||
    row?.terminationSettlement || {
      isTerminated: false,
      amountDeducted: 0,
      remainingOutstanding: 0,
      pendingInstallmentNumbers: [],
    }
  );
};

const isTerminatedLoan = (row) => {
  return Boolean(
    terminationSummary(row)?.isTerminated ||
      String(row?.status || "").toUpperCase() === "TERMINATED",
  );
};

const canAdminCancel = (row) => {
  if (!row) return false;
  const actionSummary = row?.managementSummary?.actions;

  if (actionSummary && actionSummary.canAdminCancel === false) {
    return false;
  }

  const status = String(row.status || "").toUpperCase();
  return !["CANCELLED", "CLOSED", "TERMINATED"].includes(status);
};

const confirmAdminCancel = (row) => {
  $q.dialog({
    title: "Cancelar préstamo",
    message: `Indica el motivo para cancelar ${row?.requestNumber || "esta solicitud"}.`,
    prompt: {
      model: "",
      type: "textarea",
      label: "Motivo",
      isValid: (value) => String(value || "").trim().length >= 3,
    },
    cancel: true,
    persistent: true,
  }).onOk(async (comment) => {
    await adminCancelRequest(row, comment);
  });
};

const adminCancelRequest = async (row, comment = "") => {
  if (!row?._id) return;

  actionLoading.value = true;

  try {
    const resp = await methodsHttp.postApi(
      `employee-loan/requests/${row._id}/admin/cancel`,
      { comment },
    );

    if (resp?.ok) {
      $q.notify({
        type: "positive",
        message: resp.mensaje || "Préstamo cancelado.",
      });

      detailDialog.value.row = resp.loanRequest || resp.request || row;
      await fetchHistory(row._id, true);
      await loadRequests();
      return;
    }

    $q.notify({
      type: "negative",
      message: resp?.mensaje || "No se pudo cancelar el préstamo.",
    });
  } catch (error) {
    console.error("adminCancelRequest error:", error);
    $q.notify({
      type: "negative",
      message: "Error cancelando el préstamo.",
    });
  } finally {
    actionLoading.value = false;
  }
};

const lenderBankDescription = (row) => {
  const bank = row?.loanProviderSnapshot?.interestBankAccount || {};
  const parts = [
    bank.beneficiaryName,
    bank.bankName,
    bank.accountNumber,
    bank.accountType,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return parts.length ? parts.join(" - ") : "-";
};

const contractPdfUrl = (row) => {
  return String(row?.contractSnapshot?.generatedPdfUrl || "");
};

const contractDocxUrl = (row) => {
  return String(row?.contractSnapshot?.generatedDocxUrl || "");
};

const contractGenerationStatusLabel = (row) => {
  const status = String(
    row?.contractSnapshot?.generationStatus || "",
  ).toUpperCase();

  const map = {
    NOT_GENERATED: "No generado",
    GENERATING: "Generando",
    GENERATED: "Generado",
    FAILED: "Falló",
  };

  return map[status] || status || "-";
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
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
}

.stat-card {
  min-height: 86px;
  padding: 14px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.04);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 15px;
  font-size: 22px;
}

.stat-label,
.mini-label,
.summary-label,
.field-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  color: #0f172a;
  font-size: 1.45rem;
  font-weight: 900;
  line-height: 1;
  margin-top: 5px;
}

.panel-card {
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.04);
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
  background: rgba(15, 23, 42, 0.025);
}

.employee-cell {
  min-width: 230px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.employee-avatar {
  color: white;
  font-weight: 900;
  background: linear-gradient(135deg, #1a2436, #1964a2);
}

.employee-name {
  color: #0f172a;
  font-weight: 900;
  line-height: 1.1;
}

.employee-email {
  color: #64748b;
  font-size: 0.76rem;
  margin-top: 2px;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.form-dialog,
.manage-dialog {
  width: 1080px;
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

.dialog-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(92vh - 78px);
  padding: 18px;
  background: #f8fafc;
}

.eligibility-card,
.detail-card,
.tabs-card {
  border-radius: 20px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.mini-value,
.summary-value {
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 900;
  margin-top: 4px;
}

.mini-info-card {
  min-height: 64px;
  padding: 12px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.summary-list {
  display: grid;
  gap: 10px;
}

.summary-item {
  padding: 12px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.summary-text {
  margin-top: 5px;
  color: #0f172a;
  font-size: 0.86rem;
  line-height: 1.35;
  white-space: pre-wrap;
}

.field-label {
  margin-bottom: 6px;
}

.field-label.required::before {
  content: "* ";
  color: #e53935;
}

.dialog-actions {
  padding: 14px 18px;
  background: white;
}

.hero-status {
  padding: 8px 12px;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
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

  .form-dialog,
  .manage-dialog {
    width: 96vw;
    max-height: 94vh;
  }

  .dialog-body {
    max-height: calc(94vh - 78px);
    padding: 12px;
  }
}
</style>
