<template>
  <q-dialog v-model="open" persistent>
    <q-card class="preview-card">
      <div class="dialog-header bg-primary row items-center justify-between">
        <div class="row items-start justify-between q-col-gutter-md header-content">
          <div class="header-title text-white">
            <div class="header-icon">
              <q-icon
                :name="
                  loadingPreview
                    ? 'hourglass_top'
                    : canConfirm
                      ? 'verified'
                      : hasBlockingError
                        ? 'warning'
                        : 'visibility'
                "
                size="24px"
              />
            </div>

            <div>
              <div class="text-h6 text-weight-bold">
                Previsualización del cierre
              </div>

              <div class="text-caption">
                Período:
                <b>{{ payload?.fechaInicio }}</b>
                <span v-if="payload?.fechaFin">
                  → <b>{{ payload.fechaFin }}</b>
                </span>
              </div>
            </div>
          </div>
        </div>

        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          :disable="loadingPreview || closing"
          @click="open = false"
        >
          <q-tooltip>Cerrar</q-tooltip>
        </q-btn>
      </div>

      <q-card-section class="dialog-body">
        <q-banner
          v-if="loadingPreview"
          rounded
          class="info-banner q-mb-md"
        >
          <template #avatar>
            <q-spinner color="primary" size="22px" />
          </template>

          Calculando preview de nómina. No se está creando ningún pago todavía.
        </q-banner>

        <q-banner
          v-if="error409"
          rounded
          class="error-banner q-mb-md"
        >
          <template #avatar>
            <q-icon name="warning" color="negative" />
          </template>

          <div>
            <div class="text-weight-bold">No se puede cerrar la nómina</div>
            <div class="text-caption q-mt-xs error-text">
              {{ error409 }}
            </div>
          </div>
        </q-banner>

        <q-banner
          v-if="canConfirm"
          rounded
          class="success-banner q-mb-md"
        >
          <template #avatar>
            <q-icon name="check_circle" color="positive" />
          </template>

          Preview validado correctamente. Puedes confirmar el cierre real de
          nómina.
        </q-banner>

        <q-banner
          v-if="previewData.terminationLoanPendingPayments.count > 0"
          rounded
          class="warning-banner q-mb-md"
        >
          <template #avatar>
            <q-icon name="account_balance" color="warning" />
          </template>

          <div>
            <div class="text-weight-bold">
              Pagos pendientes a prestamistas por desvinculación
            </div>
            <div class="text-caption q-mt-xs">
              Este cierre incluirá
              <b>{{ previewData.terminationLoanPendingPayments.count }}</b>
              pago(s) por
              <b>{{ money(previewData.terminationLoanPendingPayments.total) }}</b>
              retenidos a ex empleados.
            </div>
          </div>
        </q-banner>

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6 col-md-3">
            <button
              type="button"
              class="metric-card metric-card--button"
              @click="openEmployeeDetail('ALL')"
            >
              <div class="metric-icon metric-icon--employees">
                <q-icon name="groups" />
              </div>

              <div>
                <div class="metric-label">Solicitados</div>
                <div class="metric-value">
                  {{ previewData.requestedCount }}
                </div>
              </div>
            </button>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="metric-card">
              <div class="metric-icon metric-icon--eligible">
                <q-icon name="verified" />
              </div>

              <div>
                <div class="metric-label">Elegibles</div>
                <div class="metric-value">
                  {{ previewData.eligibleCount }}
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <button
              type="button"
              class="metric-card metric-card--button"
              @click="openEmployeeDetail('SKIPPED')"
            >
              <div
                class="metric-icon"
                :class="
                  previewData.skippedCount > 0
                    ? 'metric-icon--warning'
                    : 'metric-icon--ok'
                "
              >
                <q-icon
                  :name="
                    previewData.skippedCount > 0
                      ? 'person_off'
                      : 'check_circle'
                  "
                />
              </div>

              <div>
                <div class="metric-label">Omitidos</div>
                <div class="metric-value">
                  {{ previewData.skippedCount }}
                </div>
              </div>
            </button>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="metric-card">
              <div
                class="metric-icon"
                :class="canConfirm ? 'metric-icon--ok' : 'metric-icon--neutral'"
              >
                <q-icon :name="canConfirm ? 'lock_open' : 'lock'" />
              </div>

              <div>
                <div class="metric-label">Estado</div>
                <div class="metric-value metric-value--small">
                  {{ canConfirm ? "Listo" : "Pendiente" }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <q-card flat bordered class="summary-panel">
          <q-card-section class="q-pa-md">
            <div class="section-title">
              <q-icon name="summarize" color="primary" size="19px" />
              Resumen económico del período
            </div>

            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12 col-md-6">
                <div class="amount-row">
                  <span>Total bruto período</span>
                  <b>{{ money(previewData.totals.grossPeriod) }}</b>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="amount-row">
                  <span>Deducciones legales</span>
                  <b>{{ money(previewData.totals.totalLegalDeductionsPeriod) }}</b>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="amount-row">
                  <span>Otras deducciones</span>
                  <b>{{ money(previewData.totals.displayOtherDeductionsPeriod) }}</b>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="amount-row">
                  <span>Total deducciones</span>
                  <b>{{ money(previewData.totals.displayDeductionsPeriod) }}</b>
                </div>
              </div>

              <div class="col-12">
                <div class="net-row">
                  <div>
                    <div class="net-label">Total a pagar por la empresa</div>
                    <div class="net-caption">
                      Monto neto total de nómina del período.
                    </div>
                  </div>

                  <div class="net-value">
                    {{ money(previewData.totals.companyPayrollTotalPeriod) }}
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="settings-panel q-mt-md">
          <q-card-section class="q-pa-md">
            <div class="section-title">
              <q-icon name="settings" color="primary" size="19px" />
              Parámetros usados
            </div>

            <div class="row q-col-gutter-sm q-mt-sm">
              <div class="col-12 col-md-6">
                <div class="param-pill">
                  <q-icon name="checklist" color="primary" />
                  Requiere días confirmados:
                  <b>{{ payload?.requireConfirmedDays ? "Sí" : "No" }}</b>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="param-pill">
                  <q-icon name="payments" color="primary" />
                  Frecuencia:
                  <b>{{ payload?.frequencyCode || "—" }}</b>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="param-pill">
                  <q-icon name="event_available" color="primary" />
                  Fecha de pago:
                  <b>{{ payload?.payDate || "Hoy" }}</b>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="param-pill">
                  <q-icon name="account_tree" color="primary" />
                  Alcance:
                  <b>{{ scopeLabel }}</b>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          no-caps
          label="Volver"
          color="grey-8"
          class="cancel-btn"
          :disable="loadingPreview || closing"
          @click="open = false"
        />

        <q-btn
          outline
          no-caps
          icon="refresh"
          label="Recalcular preview"
          color="primary"
          class="refresh-btn"
          :loading="loadingPreview"
          :disable="closing"
          @click="fetchPreview"
        />

        <q-btn
          unelevated
          no-caps
          color="dark"
          icon="lock"
          label="Confirmar cierre"
          class="confirm-btn"
          :disable="!canConfirm"
          :loading="closing"
          @click="confirmClose"
        />
      </q-card-actions>

      <q-inner-loading
        :showing="loadingPreview"
        label="Calculando resumen..."
        label-class="text-primary text-weight-bold"
        color="primary"
      />
    </q-card>
  </q-dialog>

  <q-dialog v-model="detailDialog.open">
    <q-card class="detail-dialog-card">
      <div class="confirm-dialog-header bg-primary row items-center justify-between">
        <div class="header-title text-white">
          <div class="header-icon">
            <q-icon :name="detailDialog.icon" size="24px" />
          </div>

          <div>
            <div class="text-h6 text-weight-bold">{{ detailDialog.title }}</div>
            <div class="text-caption">
              {{ detailDialog.rows.length }} empleado(s)
            </div>
          </div>
        </div>

        <q-btn
          outline
          dense
          no-caps
          icon="edit"
          label="Editar selección"
          color="white"
          class="q-mr-sm"
          @click="openSelectionDialog"
        />

        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          @click="detailDialog.open = false"
        />
      </div>

      <q-card-section class="q-pa-md">
        <q-input
          v-model="detailDialog.search"
          outlined
          dense
          clearable
          debounce="350"
          label="Buscar empleado"
          class="rounded-input q-mb-md"
          @update:model-value="() => fetchEmployeeDetail(true)"
        >
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>

        <q-table
          :rows="detailDialog.rows"
          :columns="detailColumns"
          row-key="userId"
          flat
          bordered
          dense
          class="details-table"
          :loading="detailDialog.loading"
          v-model:pagination="detailPagination"
          :rows-per-page-options="[10, 25, 50]"
          @request="onDetailRequest"
          no-data-label="No hay empleados para mostrar."
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.status === 'SKIPPED' ? 'warning' : 'positive'"
                class="status-badge"
              >
                {{ props.row.status === "SKIPPED" ? "Omitido" : "Solicitado" }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                v-if="props.row.status !== 'SKIPPED'"
                flat
                dense
                round
                color="negative"
                icon="person_remove"
                @click="omitEmployeeFromDetail(props.row)"
              >
                <q-tooltip>Omitir de esta nómina</q-tooltip>
              </q-btn>

              <q-btn
                v-else-if="props.row.reason === 'Descartado manualmente para esta nómina.'"
                flat
                dense
                round
                color="positive"
                icon="undo"
                @click="restoreEmployeeFromDetail(props.row)"
              >
                <q-tooltip>Restaurar empleado</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>

  <PayrollEmployeesSelectionDialog
    v-model="selectionDialogOpen"
    :employees="selectionEmployees"
    :excluded-ids="selectionExcludedIds"
    :query-context="selectionQueryContext"
    @apply="applyEmployeeSelection"
  />

  <!-- Dialog bonito de confirmación -->
  <q-dialog v-model="confirmCloseDialogOpen" persistent>
    <q-card class="confirm-close-dialog-card">
      <div class="confirm-dialog-header bg-primary row items-center justify-between">
        <div class="row items-start justify-between q-col-gutter-md header-content">
          <div class="header-title text-white">
            <div class="header-icon">
              <q-icon name="lock" size="24px" />
            </div>

            <div>
              <div class="text-h6 text-weight-bold">
                Confirmar cierre de nómina
              </div>

              <div class="text-caption">
                Esta acción generará los pagos reales del período seleccionado.
              </div>
            </div>
          </div>
        </div>

        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          :disable="closing"
          @click="confirmCloseDialogOpen = false"
        >
          <q-tooltip>Cerrar</q-tooltip>
        </q-btn>
      </div>

      <q-card-section class="confirm-dialog-body">
        <div class="confirm-main-icon">
          <q-icon name="payments" size="34px" />
        </div>

        <div class="confirm-dialog-title">
          ¿Deseas cerrar esta nómina?
        </div>

        <div class="confirm-dialog-subtitle">
          Se generarán pagos para
          <b>{{ previewData.eligibleCount }}</b>
          empleado(s). Esta acción cerrará la nómina del período seleccionado.
        </div>

        <div class="confirm-summary-grid q-mt-md">
          <div class="confirm-summary-item">
            <div class="confirm-summary-label">Período</div>
            <div class="confirm-summary-value">
              {{ payload?.fechaInicio || "—" }}
              <span v-if="payload?.fechaFin">
                → {{ payload.fechaFin }}
              </span>
            </div>
          </div>

          <div class="confirm-summary-item">
            <div class="confirm-summary-label">Elegibles</div>
            <div class="confirm-summary-value">
              {{ previewData.eligibleCount }}
            </div>
          </div>

          <div class="confirm-summary-item">
            <div class="confirm-summary-label">Omitidos</div>
            <div class="confirm-summary-value">
              {{ previewData.skippedCount }}
            </div>
          </div>

          <div class="confirm-summary-item">
            <div class="confirm-summary-label">Total empresa</div>
            <div class="confirm-summary-value">
              {{ money(previewData.totals.companyPayrollTotalPeriod) }}
            </div>
          </div>
        </div>

        <q-banner dense rounded class="confirm-warning-banner q-mt-md">
          <template #avatar>
            <q-icon name="info" color="primary" />
          </template>

          Verifica que el preview sea correcto antes de continuar. Luego de cerrar,
          los pagos quedarán creados para este período.
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="confirm-dialog-actions">
        <q-btn
          flat
          no-caps
          label="Cancelar"
          color="grey-8"
          class="cancel-btn"
          :disable="closing"
          @click="confirmCloseDialogOpen = false"
        />

        <q-btn
          unelevated
          no-caps
          icon="lock"
          label="Sí, cerrar nómina"
          color="dark"
          class="confirm-btn"
          :loading="closing"
          @click="handleConfirmCloseAccepted"
        />
      </q-card-actions>

      <q-inner-loading
        :showing="closing"
        label="Cerrando nómina..."
        label-class="text-primary text-weight-bold"
        color="primary"
      />
    </q-card>
  </q-dialog>

  <!-- Dialog bonito para errores 409 al cerrar -->
  <q-dialog v-model="blockingDialogOpen" persistent>
    <q-card class="blocking-dialog-card">
      <div class="confirm-dialog-header bg-primary row items-center justify-between">
        <div class="row items-start justify-between q-col-gutter-md header-content">
          <div class="header-title text-white">
            <div class="header-icon">
              <q-icon name="warning" size="24px" />
            </div>

            <div>
              <div class="text-h6 text-weight-bold">
                No se puede cerrar la nómina
              </div>

              <div class="text-caption">
                Revisa los datos pendientes antes de volver a intentar.
              </div>
            </div>
          </div>
        </div>

        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          @click="blockingDialogOpen = false"
        >
          <q-tooltip>Cerrar</q-tooltip>
        </q-btn>
      </div>

      <q-card-section class="blocking-dialog-body">
        <div class="blocking-message">
          {{ blockingDialogMessage }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="confirm-dialog-actions">
        <q-btn
          unelevated
          no-caps
          label="Entendido"
          color="primary"
          class="confirm-btn"
          @click="blockingDialogOpen = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import PayrollEmployeesSelectionDialog from "./PayrollEmployeesSelectionDialog.vue";

const $q = useQuasar();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  payload: { type: Object, required: true },
  employeesOptions: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "closed"]);

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const API = {
  preview: "payroll/closePeriodPreview",
  previewEmployees: "payroll/closePeriodPreviewEmployees",
  close: "payroll/closePeriod",
};

const loadingPreview = ref(false);
const closing = ref(false);
const preview = ref(null);
const error409 = ref("");
const effectivePayload = ref({});
const selectionDialogOpen = ref(false);
const manualExcludedEmployees = ref([]);

const confirmCloseDialogOpen = ref(false);
const blockingDialogOpen = ref(false);
const blockingDialogMessage = ref("");
const detailDialog = ref({
  open: false,
  title: "",
  icon: "groups",
  status: "ALL",
  search: "",
  loading: false,
  rows: [],
});
const detailPagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: "name",
  descending: false,
});

const detailColumns = [
  {
    name: "name",
    label: "Empleado",
    field: (row) => row?.name || row?.userId || "Empleado",
    align: "left",
    sortable: true,
  },
  {
    name: "email",
    label: "Correo",
    field: (row) => row?.email || "—",
    align: "left",
  },
  {
    name: "salaryType",
    label: "Tipo pago",
    field: (row) => row?.salaryType || "N/A",
    align: "center",
  },
  {
    name: "workedHoursPeriod",
    label: "Horas",
    field: (row) => {
      const worked = Number(row?.workedHoursPeriod || 0).toFixed(2);
      const paid = Number(row?.paidHoursPeriod || 0).toFixed(2);
      return `${worked} / ${paid}`;
    },
    align: "right",
  },
  {
    name: "netPeriod",
    label: "Total",
    field: (row) => money(row?.netPeriod || 0),
    align: "right",
  },
  {
    name: "status",
    label: "Estado",
    field: "status",
    align: "center",
  },
  {
    name: "reason",
    label: "Detalle",
    field: (row) => row?.reason || "—",
    align: "left",
  },
  {
    name: "actions",
    label: "",
    field: "userId",
    align: "right",
  },
];

const scopeLabel = computed(() => {
  const map = {
    COMPANY: "Empresa completa",
    DEPARTMENT: "Departamento completo",
    JOB_POSITION: "Puesto de trabajo completo",
    PROJECT: "Proyecto completo",
    EMPLOYEES: "Empleados específicos",
  };

  const scopeMode =
    effectivePayload.value?.requestedScopeMode ||
    effectivePayload.value?.scopeMode ||
    props.payload?.scopeMode;

  return map[scopeMode] || scopeMode || "—";
});

const hasBlockingError = computed(() => {
  return Boolean(error409.value);
});

const canConfirm = computed(() => {
  return Boolean(preview.value) && !error409.value && !loadingPreview.value;
});

const previewData = computed(() => {
  const data = preview.value || {};
  const rawTotals = data?.totals || {};
  const grossPeriod = Number(rawTotals.grossPeriod || 0);
  const totalLegalDeductionsPeriod = Number(
    rawTotals.totalLegalDeductionsPeriod || 0,
  );
  const totalOtherDeductionsPeriod = Number(
    rawTotals.totalOtherDeductionsPeriod || 0,
  );
  const totalDeductionsPeriod = Number(rawTotals.totalDeductionsPeriod || 0);
  const netPeriod = Number(rawTotals.netPeriod || 0);
  const employeeLoanDeductionsPeriod = Number(
    rawTotals.employeeLoanDeductionsPeriod || 0,
  );
  const companyDisbursementPeriod = Number(
    rawTotals.companyDisbursementPeriod ?? netPeriod,
  );
  const companyPayrollTotalPeriod = Math.max(
    companyDisbursementPeriod,
    netPeriod + employeeLoanDeductionsPeriod,
  );
  const displayOtherDeductionsPeriod = Math.max(
    0,
    totalOtherDeductionsPeriod - employeeLoanDeductionsPeriod,
  );
  const displayDeductionsPeriod = Math.max(
    0,
    totalDeductionsPeriod - employeeLoanDeductionsPeriod,
  );

  return {
    requestedCount: Number(data.requestedCount || data.employeeCount || 0),
    eligibleCount: Number(data.eligibleCount || 0),
    skippedCount:
      Number(data.skippedCount || 0) + manualExcludedEmployees.value.length,
    requestedEmployees: Array.isArray(data.requestedEmployees)
      ? data.requestedEmployees
      : [],
    eligibleEmployees: Array.isArray(data.eligibleEmployees)
      ? data.eligibleEmployees
      : [],
    skippedEmployees: [
      ...(Array.isArray(data.skippedEmployees) ? data.skippedEmployees : []),
      ...manualExcludedEmployees.value,
    ],
    terminationLoanPendingPayments: {
      count: Number(data.terminationLoanPendingPayments?.count || 0),
      total: Number(data.terminationLoanPendingPayments?.total || 0),
      rows: Array.isArray(data.terminationLoanPendingPayments?.rows)
        ? data.terminationLoanPendingPayments.rows
        : [],
    },
    totals: {
      grossPeriod,
      totalLegalDeductionsPeriod,
      totalOtherDeductionsPeriod,
      displayOtherDeductionsPeriod,
      totalDeductionsPeriod,
      displayDeductionsPeriod,
      netPeriod,
      companyDisbursementPeriod,
      companyPayrollTotalPeriod,
      employeeNetToDepositPeriod: Number(
        rawTotals.employeeNetToDepositPeriod ?? netPeriod ?? 0,
      ),
      employeeLoanDeductionsPeriod,
      thirdPartyPaymentsPeriod: Number(
        rawTotals.thirdPartyPaymentsPeriod || 0,
      ),
    },
  };
});

const normalizeSelectionEmployee = (employee) => {
  const id = String(employee?.userId || employee?._id || employee?.value || "");

  return {
    ...employee,
    userId: id,
    name: employee?.name || employee?.label || id || "Empleado",
    email: employee?.email || employee?.username || employee?.caption || "",
    departmentName: employee?.departmentName || employee?.department?.name || "",
    jobPositionName:
      employee?.jobPositionName || employee?.jobPosition?.name || "",
    projectName: employee?.projectName || employee?.project?.name || "",
    salaryType:
      employee?.salaryType ||
      employee?.tipoSalario ||
      employee?.salary?.tipoSalario ||
      "",
    workedHoursPeriod: Number(
      employee?.workedHoursPeriod || employee?.salary?.workedHoursPeriod || 0,
    ),
    paidHoursPeriod: Number(
      employee?.paidHoursPeriod || employee?.salary?.paidHoursPeriod || 0,
    ),
    netoADepositar: Number(
      employee?.netoADepositar ||
        employee?.netPeriod ||
        employee?.companyPayrollTotal ||
        employee?.companyDisbursement ||
        0,
    ),
  };
};

const selectionEmployees = computed(() => {
  const byId = new Map();

  [
    ...previewData.value.requestedEmployees,
    ...previewData.value.eligibleEmployees,
    ...previewData.value.skippedEmployees,
  ].forEach((employee) => {
    const normalized = normalizeSelectionEmployee(employee);
    if (normalized.userId) byId.set(normalized.userId, normalized);
  });

  return Array.from(byId.values()).sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || "")),
  );
});

const selectionExcludedIds = computed(() => {
  return previewData.value.skippedEmployees
    .map((employee) => employee?.userId)
    .filter(Boolean);
});

const selectionQueryContext = computed(() => {
  const payload = effectivePayload.value || {};

  return {
    fechaInicio: payload.fechaInicio,
    fechaFin: payload.fechaFin,
    paymentSchedule: payload.paymentScheduleId,
    companyId: payload.companyId,
    departmentId: payload.departmentId,
    jobPositionId: payload.jobPositionId,
    projectId: payload.projectId,
  };
});

const openSelectionDialog = () => {
  if (!preview.value || loadingPreview.value) return;
  selectionDialogOpen.value = true;
};

const applyEmployeeSelection = async ({
  employees = [],
  excludedIds = [],
  includedIds = [],
}) => {
  const includedSet = new Set((includedIds || []).map(String));
  const excludedSet = new Set((excludedIds || []).map(String));
  const currentPayload = effectivePayload.value || props.payload || {};
  const requestedScopeMode =
    currentPayload.requestedScopeMode || currentPayload.scopeMode || "EMPLOYEES";

  manualExcludedEmployees.value = (employees || [])
    .map(normalizeSelectionEmployee)
    .filter((employee) => {
      return employee.userId && excludedSet.has(employee.userId);
    })
    .map((employee) => ({
      ...employee,
      status: "SKIPPED",
      reason: employee.reason || "Descartado manualmente para esta nómina.",
    }));

  if (!includedSet.size) {
    $q.notify({
      type: "warning",
      message: "Selecciona al menos un empleado para recalcular el cierre.",
    });
    return;
  }

  effectivePayload.value = {
    ...currentPayload,
    requestedScopeMode,
    scopeMode: "EMPLOYEES",
    wasManuallyAdjusted: true,
    userIds: Array.from(includedSet),
    excludeUserIds: Array.from(excludedSet),
    omittedEmployees: manualExcludedEmployees.value,
  };

  await fetchPreview();
};

const buildManualOmittedPayload = () => {
  return manualExcludedEmployees.value.map((employee) => ({
    userId: employee.userId,
    name: employee.name,
    email: employee.email,
    departmentName: employee.departmentName,
    jobPositionName: employee.jobPositionName,
    projectName: employee.projectName,
    salaryType: employee.salaryType,
    workedHoursPeriod: employee.workedHoursPeriod,
    paidHoursPeriod: employee.paidHoursPeriod,
    netPeriod: employee.netPeriod || employee.netoADepositar || 0,
    reason: employee.reason || "Descartado manualmente para esta nómina.",
  }));
};

const syncOmittedPayload = () => {
  const currentPayload = effectivePayload.value || {};
  const excludedIds = manualExcludedEmployees.value
    .map((employee) => employee.userId)
    .filter(Boolean);

  effectivePayload.value = {
    ...currentPayload,
    wasManuallyAdjusted:
      Boolean(currentPayload.wasManuallyAdjusted) || excludedIds.length > 0,
    excludeUserIds: excludedIds,
    omittedEmployees: buildManualOmittedPayload(),
  };
};

const fetchEmployeeDetail = async (resetPage = false) => {
  if (!detailDialog.value.open) return;

  if (resetPage === true) {
    detailPagination.value.page = 1;
  }

  detailDialog.value.loading = true;

  try {
    const payload = {
      ...(effectivePayload.value || {}),
      status: detailDialog.value.status,
      text: detailDialog.value.search,
      page: detailPagination.value.page,
      limit: detailPagination.value.rowsPerPage,
      omittedEmployees: buildManualOmittedPayload(),
    };

    const response = await methodsHttp.postApi(API.previewEmployees, payload);

    if (response?.ok) {
      detailDialog.value.rows = Array.isArray(response.rows)
        ? response.rows
        : [];
      detailPagination.value.rowsNumber = Number(response.total || 0);
    } else {
      detailDialog.value.rows = [];
      detailPagination.value.rowsNumber = 0;
    }
  } catch (error) {
    console.error("fetchEmployeeDetail error:", error);
    detailDialog.value.rows = [];
    detailPagination.value.rowsNumber = 0;
  } finally {
    detailDialog.value.loading = false;
  }
};

const openEmployeeDetail = async (status) => {
  const cleanStatus = String(status || "ALL").toUpperCase();

  detailDialog.value = {
    open: true,
    title:
      cleanStatus === "SKIPPED"
        ? "Empleados omitidos"
        : "Detalle de empleados",
    icon: cleanStatus === "SKIPPED" ? "person_off" : "groups",
    status: cleanStatus,
    search: "",
    loading: false,
    rows: [],
  };

  detailPagination.value = {
    ...detailPagination.value,
    page: 1,
    rowsPerPage: detailPagination.value.rowsPerPage || 10,
    rowsNumber: 0,
  };

  await fetchEmployeeDetail();
};

const onDetailRequest = async ({ pagination }) => {
  detailPagination.value = {
    ...detailPagination.value,
    ...pagination,
  };

  await fetchEmployeeDetail();
};

const omitEmployeeFromDetail = async (row) => {
  const normalized = normalizeSelectionEmployee(row);

  if (!normalized.userId) return;

  const exists = manualExcludedEmployees.value.some((employee) => {
    return employee.userId === normalized.userId;
  });

  if (!exists) {
    manualExcludedEmployees.value = [
      ...manualExcludedEmployees.value,
      {
        ...normalized,
        status: "SKIPPED",
        reason: "Descartado manualmente para esta nómina.",
      },
    ];
  }

  syncOmittedPayload();
  await fetchPreview();
  await fetchEmployeeDetail();
};

const restoreEmployeeFromDetail = async (row) => {
  const userId = String(row?.userId || "");

  if (!userId) return;

  manualExcludedEmployees.value = manualExcludedEmployees.value.filter(
    (employee) => employee.userId !== userId,
  );

  const currentPayload = effectivePayload.value || {};

  if (currentPayload.scopeMode === "EMPLOYEES") {
    const currentIds = new Set((currentPayload.userIds || []).map(String));
    currentIds.add(userId);
    effectivePayload.value = {
      ...currentPayload,
      userIds: Array.from(currentIds),
    };
  }

  syncOmittedPayload();
  await fetchPreview();
  await fetchEmployeeDetail();
};
const prettyField = (field) => {
  const map = {
    legalName: "Nombre legal",
    taxId: "RNC / Identificación fiscal",
    "address.fullAddress": "Dirección completa",
    "banking.originBankCode": "Código del banco origen",
    "banking.originBankDigit": "Dígito del banco origen",
    "banking.originAccountType": "Tipo de cuenta origen",
    "banking.originAccountNumber": "Número de cuenta origen",
    "banking.currencyCode": "Código de moneda bancaria",

    idType: "Tipo de identificación",
    idNumber: "Número de identificación",
    bankCode: "Código del banco",
    bankDigit: "Dígito del banco",
    accountType: "Tipo de cuenta",
    accountNumber: "Número de cuenta",
    phone: "Teléfono de la empresa",
  };

  return map[field] || field;
};

const getEmployeeLabel = (userId) => {
  const opt = (props.employeesOptions || []).find((item) => {
    return String(item.value) === String(userId);
  });

  return opt?.label || userId;
};

const build409Message = (response) => {
  const parts = [];

  if (Array.isArray(response?.missingFields) && response.missingFields.length) {
    parts.push(
      `Empresa: faltan ${response.missingFields.map(prettyField).join(", ")}`,
    );
  }

  if (Array.isArray(response?.notFound) && response.notFound.length) {
    parts.push(
      `Empleados no encontrados: ${response.notFound
        .map(getEmployeeLabel)
        .join(", ")}`,
    );
  }

  if (Array.isArray(response?.employees) && response.employees.length) {
    const lines = response.employees.map((employee) => {
      const name = employee?.name || getEmployeeLabel(employee?.userId);
      const missing = (employee?.missingFields || [])
        .map(prettyField)
        .join(", ");

      return `• ${name}: ${missing}`;
    });

    parts.push(`Empleados con datos incompletos:\n${lines.join("\n")}`);
  }

  if (Array.isArray(response?.unconfirmed) && response.unconfirmed.length) {
    parts.push(
      `Días no confirmados:\n• ${response.unconfirmed.length} registro(s)`,
    );
  }

  if (response?.existingRun || response?.runId) {
    parts.push(
      `Ya existe una nómina cerrada para este alcance. Run: ${
        response?.existingRun?.runId || response?.runId
      }`,
    );
  }

  return parts.join("\n\n") || response?.mensaje || "No se pudo procesar.";
};

const money = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(number);
};

const fetchPreview = async () => {
  error409.value = "";
  preview.value = null;

  const payload = effectivePayload.value || {};

  if (!payload?.fechaInicio) {
    error409.value = "Debes seleccionar una fecha de inicio.";
    return;
  }

  loadingPreview.value = true;

  try {
    const response = await methodsHttp.postApi(API.preview, payload);

    if (response?.ok) {
      preview.value = response.preview || response.summary || response;
      return;
    }

    if (response?.status === 409) {
      error409.value = build409Message(response);
      return;
    }

    error409.value =
      response?.mensaje || "No se pudo calcular el resumen del cierre.";
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 409) {
      error409.value = build409Message(data || {});
      return;
    }

    console.error("fetchPreview error:", error);

    error409.value = "Error calculando el resumen del cierre.";
  } finally {
    loadingPreview.value = false;
  }
};

const confirmClose = () => {
  if (!preview.value || error409.value) return;

  confirmCloseDialogOpen.value = true;
};

const handleConfirmCloseAccepted = async () => {
  await closePayroll();
};

const closePayroll = async () => {
  closing.value = true;

  try {
    const response = await methodsHttp.postApi(API.close, effectivePayload.value);

    if (response?.ok) {
      $q.notify({
        type: "positive",
        message: `Nómina cerrada. Creados: ${
          response.createdCount || 0
        }, Omitidos: ${response.skippedCount || 0}`,
      });

      confirmCloseDialogOpen.value = false;
      open.value = false;
      emit("closed", response);
      return;
    }

    if (response?.status === 409) {
      confirmCloseDialogOpen.value = false;
      blockingDialogMessage.value = build409Message(response);
      blockingDialogOpen.value = true;
      return;
    }

    confirmCloseDialogOpen.value = false;

    $q.notify({
      type: "negative",
      message: response?.mensaje || "No se pudo cerrar la nómina.",
    });
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 409) {
      confirmCloseDialogOpen.value = false;
      blockingDialogMessage.value = build409Message(data || {});
      blockingDialogOpen.value = true;
      return;
    }

    console.error("closePayroll error:", error);

    confirmCloseDialogOpen.value = false;

    $q.notify({
      type: "negative",
      message: "Error cerrando nómina.",
    });
  } finally {
    closing.value = false;
  }
};

watch(
  () => open.value,
  async (value) => {
    if (value) {
      effectivePayload.value = { ...(props.payload || {}) };
      manualExcludedEmployees.value = [];
      await fetchPreview();
    } else {
      preview.value = null;
      error409.value = "";
      loadingPreview.value = false;
      closing.value = false;
      effectivePayload.value = {};
      selectionDialogOpen.value = false;
      manualExcludedEmployees.value = [];
      confirmCloseDialogOpen.value = false;
      blockingDialogOpen.value = false;
      blockingDialogMessage.value = "";
    }
  },
);
</script>

<style scoped>
.preview-card {
  width: 860px;
  max-width: 96vw;
  max-height: 94vh;
  border-radius: 26px;
  overflow: hidden;
  background: #f8fafc;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18);
}

.dialog-header {
  min-height: 78px;
  padding: 16px 20px;
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 50px;
  height: 50px;
  min-width: 50px;
  border-radius: 17px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.dialog-body {
  max-height: calc(94vh - 146px);
  overflow-y: auto;
  padding: 18px;
}

.info-banner,
.success-banner,
.error-banner,
.warning-banner {
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #475569;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 0.82rem;
  font-weight: 600;
}

.info-banner {
  background: rgba(23, 141, 210, 0.06);
  border-color: rgba(23, 141, 210, 0.12);
}

.success-banner {
  background: rgba(33, 186, 69, 0.08);
  border-color: rgba(33, 186, 69, 0.16);
}

.error-banner {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.14);
}

.warning-banner {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.18);
}

.error-text {
  white-space: pre-wrap;
}

.metric-card {
  width: 100%;
  min-height: 82px;
  padding: 13px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  gap: 11px;
}

.metric-card--button {
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.metric-card--button:hover {
  transform: translateY(-1px);
  border-color: rgba(23, 141, 210, 0.28);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.metric-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-icon--employees {
  color: var(--q-primary);
  background: rgba(23, 141, 210, 0.1);
}

.metric-icon--eligible,
.metric-icon--ok {
  color: #21ba45;
  background: rgba(33, 186, 69, 0.1);
}

.metric-icon--warning {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}

.metric-icon--neutral {
  color: #64748b;
  background: rgba(100, 116, 139, 0.12);
}

.metric-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value {
  margin-top: 3px;
  color: #0f172a;
  font-size: 1.18rem;
  font-weight: 900;
}

.metric-value--small {
  font-size: 0.95rem;
}

.summary-panel,
.settings-panel {
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.04);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.amount-row {
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 15px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.amount-row span {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
}

.amount-row b {
  color: #0f172a;
  font-weight: 900;
}

.net-row {
  padding: 16px;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(33, 186, 69, 0.12), transparent 36%),
    #ffffff;
  border: 1px solid rgba(33, 186, 69, 0.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.net-label {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.net-caption {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}

.net-value {
  color: #137333;
  font-size: 1.25rem;
  font-weight: 900;
  white-space: nowrap;
}

.param-pill {
  min-height: 38px;
  padding: 9px 11px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  color: #475569;
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.78rem;
  font-weight: 700;
}

.param-pill b {
  color: #0f172a;
  margin-left: auto;
}

.dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
}

.cancel-btn,
.refresh-btn,
.confirm-btn {
  min-height: 40px;
  border-radius: 12px;
  font-weight: 800;
}

/* Dialog de confirmación */
.confirm-close-dialog-card,
.blocking-dialog-card,
.detail-dialog-card {
  width: 540px;
  max-width: 94vw;
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
}

.detail-dialog-card {
  width: 820px;
}

.details-table {
  border-radius: 14px;
  overflow: hidden;
}

.details-table :deep(.q-table thead tr th) {
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.status-badge {
  min-height: 24px;
  padding: 4px 9px;
  border-radius: 999px;
  font-weight: 700;
  text-transform: none;
}

.confirm-dialog-header {
  min-height: 78px;
  padding: 16px 20px;
}

.confirm-dialog-body,
.blocking-dialog-body {
  padding: 22px;
}

.confirm-main-icon {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  color: var(--q-primary);
  background: rgba(23, 141, 210, 0.1);
  border: 1px solid rgba(23, 141, 210, 0.12);
  margin-bottom: 14px;
}

.confirm-dialog-title {
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 900;
}

.confirm-dialog-subtitle {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.45;
}

.confirm-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.confirm-summary-item {
  padding: 11px 12px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.confirm-summary-label {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.confirm-summary-value {
  margin-top: 4px;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 900;
}

.confirm-warning-banner {
  padding: 11px;
  border-radius: 16px;
  background: rgba(23, 141, 210, 0.06);
  border: 1px solid rgba(23, 141, 210, 0.12);
  color: #475569;
  font-size: 0.8rem;
  font-weight: 700;
}

.confirm-dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
}

.blocking-message {
  white-space: pre-wrap;
  color: #475569;
  font-size: 0.88rem;
  font-weight: 650;
  line-height: 1.5;
  padding: 13px;
  border-radius: 16px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.14);
}

@media (max-width: 768px) {
  .preview-card {
    width: 96vw;
    max-height: 96vh;
    border-radius: 22px;
  }

  .dialog-body {
    max-height: calc(96vh - 146px);
    padding: 14px;
  }

  .net-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .net-value {
    white-space: normal;
  }
}

@media (max-width: 599px) {
  .preview-card {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }

  .dialog-body {
    max-height: calc(100vh - 146px);
    padding: 12px;
  }

  .header-title {
    align-items: flex-start;
  }

  .cancel-btn,
  .refresh-btn,
  .confirm-btn {
    width: 100%;
  }

  .confirm-close-dialog-card,
  .blocking-dialog-card {
    width: 96vw;
    border-radius: 22px;
  }

  .confirm-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
