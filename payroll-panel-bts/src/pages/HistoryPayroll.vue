<template>
  <div class="bg-white q-pa-md">
    <PageHeaderCard
      title="Historial de nómina"
      subtitle="Filtra, revisa y administra los cierres de nómina"
      icon="history"
    >
      <template #actions>
        <div class="col-12 col-sm-auto">
          <q-btn
            color="primary"
            unelevated
            icon="refresh"
            label="Refrescar"
            :loading="loadingRuns"
            @click="loadRuns"
          />
        </div>
      </template>
    </PageHeaderCard>

    <q-card flat bordered class="filters-card q-mb-md">
      <q-card-section class="q-pa-md">
        <div class="row items-center justify-between q-col-gutter-md q-mb-sm">
          <div class="col-12 col-md">
            <div class="section-title">
              <q-icon name="filter_alt" color="primary" size="20px" />
              Filtros del historial
            </div>

            <div class="section-subtitle">
              Busca cierres por empresa, período, fecha de pago, estado, monto o
              notas.
            </div>
          </div>

          <div class="col-12 col-md-auto row q-gutter-sm">
            <q-btn
              outline
              no-caps
              color="grey-8"
              icon="cleaning_services"
              label="Limpiar"
              class="action-btn"
              @click="clearFilters"
            />

            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="search"
              label="Buscar"
              class="action-btn"
              :loading="loadingRuns"
              @click="onSearch"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="filters.q"
              outlined
              dense
              label="Buscar por período, nota, estado o fingerprint"
              class="rounded-input"
              @keyup.enter="onSearch"
            >
              <template #prepend>
                <q-icon name="search" color="primary" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="filters.companyId"
              :options="companies"
              :option-label="companyOptionLabel"
              option-value="_id"
              emit-value
              map-options
              outlined
              dense
              clearable
              use-input
              input-debounce="250"
              label="Empresa"
              class="rounded-input"
              :loading="loadingCompanies"
              @filter="filterCompanies"
            >
              <template #prepend>
                <q-icon name="business" color="primary" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-2">
            <q-select
              v-model="filters.status"
              :options="statusOptions"
              outlined
              dense
              emit-value
              map-options
              label="Estado"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="verified" color="primary" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-2">
            <q-select
              v-model="filters.isActive"
              :options="activeOptions"
              outlined
              dense
              emit-value
              map-options
              label="Actividad"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="toggle_on" color="primary" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.scopeMode"
              :options="scopeOptions"
              outlined
              dense
              emit-value
              map-options
              label="Alcance"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="account_tree" color="primary" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.hasBankAuthorization"
              :options="bankAuthOptions"
              outlined
              dense
              emit-value
              map-options
              label="Autorización bancaria"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="account_balance" color="primary" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.periodStartFrom"
              type="date"
              outlined
              dense
              label="Período desde"
              class="rounded-input"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.periodStartTo"
              type="date"
              outlined
              dense
              label="Período hasta"
              class="rounded-input"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.payDateFrom"
              type="date"
              outlined
              dense
              label="Pago desde"
              class="rounded-input"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.payDateTo"
              type="date"
              outlined
              dense
              label="Pago hasta"
              class="rounded-input"
            />
          </div>

          <div class="col-12 col-md-2">
            <q-input
              v-model.number="filters.minNet"
              type="number"
              outlined
              dense
              label="Neto mín."
              class="rounded-input"
            />
          </div>

          <div class="col-12 col-md-2">
            <q-input
              v-model.number="filters.maxNet"
              type="number"
              outlined
              dense
              label="Neto máx."
              class="rounded-input"
            />
          </div>

          <div class="col-12 col-md-2">
            <q-input
              v-model.number="filters.minEmployees"
              type="number"
              outlined
              dense
              label="Empleados mín."
              class="rounded-input"
            />
          </div>

          <div class="col-12 col-md-2">
            <q-input
              v-model.number="filters.maxEmployees"
              type="number"
              outlined
              dense
              label="Empleados máx."
              class="rounded-input"
            />
          </div>

          <div class="col-12 col-md-2">
            <q-select
              v-model="filters.sortBy"
              :options="sortOptions"
              outlined
              dense
              emit-value
              map-options
              label="Ordenar por"
              class="rounded-input"
            />
          </div>

          <div class="col-12 col-md-2">
            <q-toggle
              v-model="filters.descending"
              color="primary"
              label="Descendente"
            />
          </div>

          <div class="col-12">
            <q-toggle
              v-model="filters.includeDeleted"
              color="negative"
              label="Incluir eliminados/ocultos"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-primary text-white">
            <q-icon name="receipt_long" />
          </div>

          <div>
            <div class="metric-label">Cierres</div>
            <div class="metric-value">{{ summary.totalRuns }}</div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-positive text-white">
            <q-icon name="payments" />
          </div>

          <div>
            <div class="metric-label">Neto filtrado</div>
            <div class="metric-value">
              {{ money(summary.totalNetPeriod) }}
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-orange text-white">
            <q-icon name="groups" />
          </div>

          <div>
            <div class="metric-label">Empleados</div>
            <div class="metric-value">{{ summary.totalEmployees }}</div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-negative text-white">
            <q-icon name="cancel" />
          </div>

          <div>
            <div class="metric-label">Anulados</div>
            <div class="metric-value">{{ summary.cancelledRuns }}</div>
          </div>
        </div>
      </div>
    </div>

    <q-card flat bordered class="table-card">
      <q-table
        :rows="runs"
        :columns="columns"
        row-key="_id"
        flat
        :loading="loadingRuns"
        hide-pagination
        :rows-per-page-options="[0]"
        no-data-label="No hay cierres de nómina para estos filtros."
      >
        <template #body-cell-actions="scope">
          <q-td :props="scope" class="text-left">
            <q-btn dense flat round icon="more_vert" color="grey-8">
              <q-menu>
                <q-list style="min-width: 220px">
                  <q-item
                    clickable
                    v-close-popup
                    @click="openRunPayments(scope.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="visibility" color="primary" />
                    </q-item-section>

                    <q-item-section>Ver pagos</q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    @click="openEditRun(scope.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="edit_note" color="primary" />
                    </q-item-section>

                    <q-item-section>Editar nota / estado</q-item-section>
                  </q-item>

                  <q-separator />

                  <q-item
                    clickable
                    v-close-popup
                    @click="quickToggleActive(scope.row)"
                  >
                    <q-item-section avatar>
                      <q-icon
                        :name="
                          scope.row.isActive ? 'visibility_off' : 'visibility'
                        "
                        color="warning"
                      />
                    </q-item-section>

                    <q-item-section>
                      {{ scope.row.isActive ? "Desactivar" : "Activar" }}
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    @click="confirmCancelRun(scope.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="cancel" color="negative" />
                    </q-item-section>

                    <q-item-section>Anular cierre</q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    @click="confirmSoftDeleteRun(scope.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="delete" color="negative" />
                    </q-item-section>

                    <q-item-section>Ocultar / eliminar</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-td>
        </template>

        <template #body-cell-status="scope">
          <q-td :props="scope">
            <q-badge
              :color="scope.row.status === 'CLOSED' ? 'positive' : 'negative'"
              class="status-badge"
            >
              {{ scope.row.status === "CLOSED" ? "Cerrada" : "Anulada" }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-isActive="scope">
          <q-td :props="scope">
            <q-badge
              :color="scope.row.isActive ? 'primary' : 'grey-7'"
              outline
              class="status-badge"
            >
              {{ scope.row.isActive ? "Activa" : "Inactiva" }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-company="scope">
          <q-td :props="scope">
            <div class="text-weight-bold">
              {{ companyOptionLabel(scope.row.company) }}
            </div>

            <div class="text-caption text-grey-7">
              {{ scope.row.company?.taxId || "—" }}
            </div>
          </q-td>
        </template>

        <template #body-cell-period="scope">
          <q-td :props="scope">
            <div class="text-weight-bold">
              {{ scope.row.periodStart }} → {{ scope.row.periodEnd }}
            </div>

            <div class="text-caption text-grey-7">
              Pago: {{ formatDate(scope.row.payDate) }}
            </div>
          </q-td>
        </template>

        <template #body-cell-scopeMode="scope">
          <q-td :props="scope">
            <q-badge
              color="blue-grey-1"
              text-color="blue-grey-9"
              class="status-badge"
            >
              {{ scopeModeLabel(scope.row?.filters?.scopeMode) }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-netPeriod="scope">
          <q-td :props="scope">
            <b>{{ money(scope.row?.totals?.netPeriod) }}</b>

            <div class="text-caption text-grey-7">
              Bruto: {{ money(scope.row?.totals?.grossPeriod) }}
            </div>
          </q-td>
        </template>

        <template #body-cell-deductions="scope">
          <q-td :props="scope">
            {{ money(scope.row?.totals?.totalDeductionsPeriod) }}
          </q-td>
        </template>

        <template #body-cell-emailStats="scope">
          <q-td :props="scope">
            <div class="row q-gutter-xs">
              <q-badge color="positive" outline>
                OK {{ scope.row?.emailStats?.emailedCount || 0 }}
              </q-badge>

              <q-badge color="negative" outline>
                Fail {{ scope.row?.emailStats?.emailFailedCount || 0 }}
              </q-badge>
            </div>
          </q-td>
        </template>

        <template #body-cell-notes="scope">
          <q-td :props="scope">
            <div class="notes-cell">
              {{ scope.row.notes || "—" }}
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <div class="row justify-center q-mt-md" v-if="pagesCount > 1">
      <TablePagination
        v-model:initialPagination="page"
        :orderQuantity="pagesCount"
        color="primary"
        activeColor="light-blue-5"
        :maxPages="10"
      />
    </div>

    <PayrollPaymentsDialog
  v-model="paymentsDialog.open"
  :run="paymentsDialog.run"
  :rows="paymentsDialog.rows"
  :loading="paymentsDialog.loading"
  @refresh="reloadPayments"
  @run-updated="onRunUpdated"
/>

    <PayrollRunAdminDialog
      v-model="editDialog.open"
      :run="editDialog.run"
      :loading="editDialog.loading"
      @save="saveRunAdminUpdate"
    />

    <AppReasonDialog
      v-model="reasonDialog.open"
      :title="reasonDialog.title"
      :subtitle="reasonDialog.subtitle"
      :icon="reasonDialog.icon"
      :message="reasonDialog.message"
      :confirm-label="reasonDialog.confirmLabel"
      :confirm-icon="reasonDialog.confirmIcon"
      :confirm-color="reasonDialog.confirmColor"
      :tone="reasonDialog.tone"
      :loading="reasonDialog.loading"
      :reason-label="reasonDialog.reasonLabel"
      :reason-placeholder="reasonDialog.reasonPlaceholder"
      @confirm="handleReasonConfirm"
    />

    <NotificationsVue ref="notify" />

    <q-dialog v-model="paidEmployeesDialog.open">
  <q-card class="paid-employees-dialog">
    <q-card-section class="dialog-header bg-primary row items-center justify-between">
      <div class="row items-center no-wrap text-white">
        <div class="dialog-icon">
          <q-icon name="groups" size="28px" />
        </div>

        <div>
          <div class="dialog-title">Empleados pagados</div>
          <div class="dialog-subtitle">
            {{ totalsAll.count }} empleado(s) en este cierre de nómina.
          </div>
        </div>
      </div>

      <q-btn
        flat
        round
        dense
        color="white"
        icon="close"
        @click="paidEmployeesDialog.open = false"
      />
    </q-card-section>

    <q-card-section class="paid-employees-body">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-4">
          <div class="mini-total-card">
            <div class="mini-total-label">Bruto</div>
            <div class="mini-total-value">
              {{ formatCurrencySafe(totalsAll.bruto) }}
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-4">
          <div class="mini-total-card">
            <div class="mini-total-label">Deducciones</div>
            <div class="mini-total-value text-negative">
              {{ formatCurrencySafe(totalsAll.deducciones) }}
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-4">
          <div class="mini-total-card highlight">
            <div class="mini-total-label">Neto</div>
            <div class="mini-total-value text-positive">
              {{ formatCurrencySafe(totalsAll.neto) }}
            </div>
          </div>
        </div>
      </div>

      <q-table
        :rows="filteredRows"
        :columns="paidEmployeesColumns"
        row-key="_id"
        flat
        bordered
        dense
        :rows-per-page-options="[10, 25, 50, 100, 0]"
      >
        <template #body="props">
          <q-tr
            :props="props"
            class="cursor-pointer"
            @click="openDetails(props.row)"
          >
            <q-td key="employee" :props="props">
              <div class="row items-center no-wrap">
                <q-avatar size="34px" class="q-mr-sm">
                  <img :src="employeeAvatar(props.row)" />
                </q-avatar>

                <div class="min-width-0">
                  <div class="text-weight-bold ellipsis">
                    {{ props.row.employeeName || "Empleado" }}
                  </div>

                  <div class="text-caption text-grey-7 ellipsis">
                    {{ props.row.employeeEmail || "Sin correo" }}
                  </div>
                </div>
              </div>
            </q-td>

            <q-td key="department" :props="props">
              {{ getDepartment(props.row) }}
            </q-td>

            <q-td key="jobPosition" :props="props">
              {{ getJobPosition(props.row) }}
            </q-td>

            <q-td key="gross" :props="props" class="text-right">
              {{ formatCurrencySafe(getGross(props.row)) }}
            </q-td>

            <q-td key="deductions" :props="props" class="text-right">
              {{ formatCurrencySafe(getDeductions(props.row)) }}
            </q-td>

            <q-td key="net" :props="props" class="text-right">
              <b>{{ formatCurrencySafe(getNet(props.row)) }}</b>
            </q-td>

            <q-td key="emailStatus" :props="props">
              <q-badge :color="paymentEmailColor(props.row)" class="status-badge">
                {{ paymentEmailLabel(props.row) }}
              </q-badge>
            </q-td>
          </q-tr>
        </template>

        <template #no-data>
          <div class="full-width row flex-center q-pa-lg text-grey-7">
            <q-icon name="info" class="q-mr-sm" />
            No hay empleados pagados para mostrar.
          </div>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import PayrollPaymentsDialog from "src/components/reports/payroll/history/PayrollPaymentsDialog.vue";
import PayrollRunAdminDialog from "src/components/reports/payroll/history/PayrollRunAdminDialog.vue";

import PageHeaderCard from "src/components/PageHeaderCard.vue";
import TablePagination from "src/components/table/TablePagination.vue";
import AppReasonDialog from "src/components/dialog/AppReasonDialog.vue";

const notify = ref(null);

const runs = ref([]);
const loadingRuns = ref(false);

const page = ref(1);
const limit = ref(10);
const total = ref(0);

const companies = ref([]);
const companiesOriginal = ref([]);
const loadingCompanies = ref(false);

const paidEmployeesDialog = ref({
  open: false,
});

const summary = ref({
  totalRuns: 0,
  totalEmployees: 0,
  totalGrossPeriod: 0,
  totalNetPeriod: 0,
  totalDeductionsPeriod: 0,
  activeRuns: 0,
  cancelledRuns: 0,
});

const filters = ref({
  q: "",
  companyId: null,
  status: "ALL",
  isActive: "ALL",
  scopeMode: "ALL",
  hasBankAuthorization: "ALL",

  periodStartFrom: "",
  periodStartTo: "",
  periodEndFrom: "",
  periodEndTo: "",
  payDateFrom: "",
  payDateTo: "",

  minNet: null,
  maxNet: null,
  minEmployees: null,
  maxEmployees: null,

  includeDeleted: false,

  sortBy: "createdAt",
  descending: true,
});

const paymentsDialog = ref({
  open: false,
  loading: false,
  run: null,
  rows: [],
});

const editDialog = ref({
  open: false,
  loading: false,
  run: null,
});

const reasonDialog = ref({
  open: false,
  loading: false,
  action: "",
  run: null,

  title: "",
  subtitle: "",
  icon: "help",
  message: "",

  confirmLabel: "Confirmar",
  confirmIcon: "check",
  confirmColor: "primary",

  reasonLabel: "Motivo",
  reasonPlaceholder: "Escribe el motivo de esta acción...",
  tone: "info",
});

const paidEmployeesColumns = computed(() => [
  {
    name: "employee",
    label: "Empleado",
    align: "left",
    field: "employeeName",
  },
  {
    name: "department",
    label: "Departamento",
    align: "left",
    field: (row) => getDepartment(row),
  },
  {
    name: "jobPosition",
    label: "Puesto",
    align: "left",
    field: (row) => getJobPosition(row),
  },
  {
    name: "gross",
    label: "Bruto",
    align: "right",
    field: (row) => getGross(row),
    sortable: true,
  },
  {
    name: "deductions",
    label: "Deducciones",
    align: "right",
    field: (row) => getDeductions(row),
    sortable: true,
  },
  {
    name: "net",
    label: "Neto",
    align: "right",
    field: (row) => getNet(row),
    sortable: true,
  },
  {
    name: "emailStatus",
    label: "Correo",
    align: "left",
    field: (row) => paymentEmailLabel(row),
  },
]);

const pagesCount = computed(() => {
  const t = Number(total.value || 0);
  const l = Number(limit.value || 10);

  return Math.max(1, Math.ceil(t / l));
});

const columns = [
  {
    name: "actions",
    label: "",
    field: "actions",
    align: "left",
    style: "width: 55px",
  },
  {
    name: "status",
    label: "Estado",
    field: "status",
    align: "left",
  },
  {
    name: "isActive",
    label: "Activo",
    field: "isActive",
    align: "left",
  },
  {
    name: "company",
    label: "Empresa",
    field: "company",
    align: "left",
  },
  {
    name: "period",
    label: "Período / Pago",
    field: "periodStart",
    align: "left",
    sortable: true,
  },
  {
    name: "scopeMode",
    label: "Alcance",
    field: (row) => row?.filters?.scopeMode,
    align: "left",
  },
  {
    name: "employeeCount",
    label: "Empleados",
    field: "employeeCount",
    align: "left",
    sortable: true,
  },
  {
    name: "netPeriod",
    label: "Neto",
    field: (row) => row?.totals?.netPeriod,
    align: "left",
    sortable: true,
  },
  {
    name: "deductions",
    label: "Deducciones",
    field: (row) => row?.totals?.totalDeductionsPeriod,
    align: "left",
  },
  {
    name: "emailStats",
    label: "Correos",
    field: "emailStats",
    align: "left",
  },
  {
    name: "bankAuthorizationNumber",
    label: "Autorización",
    field: "bankAuthorizationNumber",
    align: "left",
  },
];

const statusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Cerrada", value: "CLOSED" },
  { label: "Anulada", value: "CANCELLED" },
];

const activeOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Activos", value: "ACTIVE" },
  { label: "Inactivos", value: "INACTIVE" },
];

const scopeOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Empresa", value: "COMPANY" },
  { label: "Departamento", value: "DEPARTMENT" },
  { label: "Puesto", value: "JOB_POSITION" },
  { label: "Proyecto", value: "PROJECT" },
  { label: "Empleados", value: "EMPLOYEES" },
];

const bankAuthOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Con autorización", value: "TRUE" },
  { label: "Sin autorización", value: "FALSE" },
];

const sortOptions = [
  { label: "Creación", value: "createdAt" },
  { label: "Fecha de pago", value: "payDate" },
  { label: "Inicio período", value: "periodStart" },
  { label: "Fin período", value: "periodEnd" },
  { label: "Empleados", value: "employeeCount" },
  { label: "Neto", value: "netPeriod" },
  { label: "Bruto", value: "grossPeriod" },
  { label: "Estado", value: "status" },
];

onMounted(async () => {
  await loadCompanies();
  await loadRuns();
});

watch(page, () => {
  loadRuns();
});

const companyOptionLabel = (company) => {
  return (
    company?.legalName ||
    company?.commercialName ||
    company?.tradeName ||
    company?.name ||
    company?.code ||
    "Sin empresa"
  );
};

const money = (value) => {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("es-DO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const scopeModeLabel = (value) => {
  const map = {
    COMPANY: "Empresa",
    DEPARTMENT: "Departamento",
    JOB_POSITION: "Puesto",
    PROJECT: "Proyecto",
    EMPLOYEES: "Empleados",
  };

  return map[value] || "—";
};

const normalizeArrayResponse = (response, keys = []) => {
  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
  }

  return [];
};

const loadCompanies = async () => {
  loadingCompanies.value = true;

  try {
    const response = await methodsHttp.getApi(
      "company?limit=500&isActive=true",
    );

    const rows = response?.ok
      ? normalizeArrayResponse(response, [
          "companies",
          "company",
          "data",
          "items",
        ])
      : [];

    companies.value = rows;
    companiesOriginal.value = rows;
  } finally {
    loadingCompanies.value = false;
  }
};

const filterCompanies = (value, update) => {
  update(() => {
    if (!value) {
      companies.value = companiesOriginal.value;
      return;
    }

    const needle = String(value).toLowerCase();

    companies.value = companiesOriginal.value.filter((company) => {
      return companyOptionLabel(company).toLowerCase().includes(needle);
    });
  });
};

const buildRunsQuery = () => {
  const query = new URLSearchParams();

  const initial = (Number(page.value) - 1) * Number(limit.value);

  query.set("limit", String(limit.value));
  query.set("initial", String(initial));

  if (filters.value.q) query.set("q", filters.value.q.trim());
  if (filters.value.companyId) query.set("companyId", filters.value.companyId);

  query.set("status", filters.value.status || "ALL");
  query.set("isActive", filters.value.isActive || "ALL");
  query.set("scopeMode", filters.value.scopeMode || "ALL");
  query.set(
    "hasBankAuthorization",
    filters.value.hasBankAuthorization || "ALL",
  );

  if (filters.value.periodStartFrom) {
    query.set("periodStartFrom", filters.value.periodStartFrom);
  }

  if (filters.value.periodStartTo) {
    query.set("periodStartTo", filters.value.periodStartTo);
  }

  if (filters.value.periodEndFrom) {
    query.set("periodEndFrom", filters.value.periodEndFrom);
  }

  if (filters.value.periodEndTo) {
    query.set("periodEndTo", filters.value.periodEndTo);
  }

  if (filters.value.payDateFrom) {
    query.set("payDateFrom", filters.value.payDateFrom);
  }

  if (filters.value.payDateTo) {
    query.set("payDateTo", filters.value.payDateTo);
  }

  if (filters.value.minNet !== null && filters.value.minNet !== "") {
    query.set("minNet", String(filters.value.minNet));
  }

  if (filters.value.maxNet !== null && filters.value.maxNet !== "") {
    query.set("maxNet", String(filters.value.maxNet));
  }

  if (
    filters.value.minEmployees !== null &&
    filters.value.minEmployees !== ""
  ) {
    query.set("minEmployees", String(filters.value.minEmployees));
  }

  if (
    filters.value.maxEmployees !== null &&
    filters.value.maxEmployees !== ""
  ) {
    query.set("maxEmployees", String(filters.value.maxEmployees));
  }

  query.set("includeDeleted", filters.value.includeDeleted ? "true" : "false");
  query.set("sortBy", filters.value.sortBy || "createdAt");
  query.set("descending", filters.value.descending ? "true" : "false");

  return query.toString();
};

const onSearch = () => {
  page.value = 1;
  loadRuns();
};

const clearFilters = () => {
  filters.value = {
    q: "",
    companyId: null,
    status: "ALL",
    isActive: "ALL",
    scopeMode: "ALL",
    hasBankAuthorization: "ALL",

    periodStartFrom: "",
    periodStartTo: "",
    periodEndFrom: "",
    periodEndTo: "",
    payDateFrom: "",
    payDateTo: "",

    minNet: null,
    maxNet: null,
    minEmployees: null,
    maxEmployees: null,

    includeDeleted: false,

    sortBy: "createdAt",
    descending: true,
  };

  onSearch();
};

const loadRuns = async () => {
  try {
    loadingRuns.value = true;

    const response = await methodsHttp.getApi(
      `payroll/runs?${buildRunsQuery()}`,
    );

    if (response?.ok) {
      runs.value = Array.isArray(response.runs) ? response.runs : [];
      total.value = Number(response.total || 0);
      limit.value = Number(response.limit || limit.value);

      summary.value = {
        totalRuns: Number(response.summary?.totalRuns || 0),
        totalEmployees: Number(response.summary?.totalEmployees || 0),
        totalGrossPeriod: Number(response.summary?.totalGrossPeriod || 0),
        totalNetPeriod: Number(response.summary?.totalNetPeriod || 0),
        totalDeductionsPeriod: Number(
          response.summary?.totalDeductionsPeriod || 0,
        ),
        activeRuns: Number(response.summary?.activeRuns || 0),
        cancelledRuns: Number(response.summary?.cancelledRuns || 0),
      };
    } else {
      runs.value = [];
      total.value = 0;

      notify.value?.notify?.(
        "negative",
        response?.mensaje || "No se pudo cargar el historial.",
      );
    }

    if (page.value > pagesCount.value) {
      page.value = pagesCount.value;
    }
  } catch (error) {
    console.error(error);

    runs.value = [];
    total.value = 0;

    notify.value?.notify?.("negative", "Error cargando historial de nómina.");
  } finally {
    loadingRuns.value = false;
  }
};

const openRunPayments = async (runRow) => {
  paymentsDialog.value.open = true;
  paymentsDialog.value.run = runRow;
  paymentsDialog.value.rows = [];

  await reloadPayments();
};

const reloadPayments = async () => {
  const run = paymentsDialog.value.run;

  if (!run?._id) return;

  try {
    paymentsDialog.value.loading = true;
    paymentsDialog.value.rows = [];

    const allPayments = [];
    const limit = 100;
    let initial = 0;
    let total = 0;
    let keepLoading = true;

    while (keepLoading) {
      const response = await methodsHttp.getApi(
        `payroll/run/${run._id}/payments?limit=${limit}&initial=${initial}`,
      );

      if (!response?.ok) {
        paymentsDialog.value.rows = [];

        notify.value?.notify?.(
          "negative",
          response?.mensaje || "No se pudo cargar pagos.",
        );

        return;
      }

      const payments = Array.isArray(response.payments)
        ? response.payments
        : [];

      total = Number(response.total || payments.length || 0);

      allPayments.push(...payments);

      initial += limit;

      keepLoading = allPayments.length < total && payments.length > 0;
    }

    paymentsDialog.value.rows = allPayments;
  } catch (error) {
    console.error(error);

    paymentsDialog.value.rows = [];

    notify.value?.notify?.("negative", "Error cargando pagos.");
  } finally {
    paymentsDialog.value.loading = false;
  }
};

const openEditRun = (run) => {
  editDialog.value.open = true;
  editDialog.value.run = run;
};

const saveRunAdminUpdate = async (form) => {
  const run = editDialog.value.run;

  if (!run?._id) return;

  editDialog.value.loading = true;

  try {
    const response = await methodsHttp.postApi(
      `payroll/run/${run._id}/admin-update`,
      {
        status: form.status,
        isActive: form.isActive,
        notes: form.notes,
        adminNote: form.adminNote,
        bankAuthorizationNumber: form.bankAuthorizationNumber,
      },
    );

    if (response?.ok) {
      notify.value?.notify?.("positive", "Cierre actualizado correctamente.");

      onRunUpdated(response.run);

      editDialog.value.open = false;

      await loadRuns();
    } else {
      notify.value?.notify?.(
        "negative",
        response?.mensaje || "No se pudo actualizar.",
      );
    }
  } catch (error) {
    console.error(error);

    notify.value?.notify?.("negative", "Error actualizando cierre.");
  } finally {
    editDialog.value.loading = false;
  }
};

const openReasonDialog = ({
  action,
  run,
  title,
  subtitle,
  icon,
  message,
  confirmLabel,
  confirmIcon,
  confirmColor,
  reasonLabel,
  reasonPlaceholder,
  tone,
}) => {
  reasonDialog.value.open = true;
  reasonDialog.value.loading = false;
  reasonDialog.value.action = action;
  reasonDialog.value.run = run;

  reasonDialog.value.title = title;
  reasonDialog.value.subtitle = subtitle;
  reasonDialog.value.icon = icon;
  reasonDialog.value.message = message;

  reasonDialog.value.confirmLabel = confirmLabel;
  reasonDialog.value.confirmIcon = confirmIcon;
  reasonDialog.value.confirmColor = confirmColor;

  reasonDialog.value.reasonLabel = reasonLabel;
  reasonDialog.value.reasonPlaceholder = reasonPlaceholder;
  reasonDialog.value.tone = tone;
};

const quickToggleActive = (run) => {
  openReasonDialog({
    action: "TOGGLE_ACTIVE",
    run,
    title: run.isActive ? "Desactivar cierre" : "Activar cierre",
    subtitle: "Registra una nota para auditoría.",
    icon: run.isActive ? "visibility_off" : "visibility",
    message: run.isActive
      ? "Este cierre quedará inactivo y no se tomará en cuenta en reportes operativos."
      : "Este cierre volverá a estar activo.",
    confirmLabel: run.isActive ? "Desactivar" : "Activar",
    confirmIcon: run.isActive ? "visibility_off" : "visibility",
    confirmColor: run.isActive ? "warning" : "primary",
    reasonLabel: "Nota de auditoría",
    reasonPlaceholder:
      "Ej: Se desactiva porque se creó una nueva versión corregida...",
    tone: run.isActive ? "warning" : "info",
  });
};

const confirmCancelRun = (run) => {
  openReasonDialog({
    action: "CANCEL_RUN",
    run,
    title: "Anular cierre de nómina",
    subtitle: "Este cierre se conservará para auditoría.",
    icon: "cancel",
    message:
      "Este cierre quedará en estado ANULADO e inactivo. No se borrará físicamente.",
    confirmLabel: "Anular cierre",
    confirmIcon: "cancel",
    confirmColor: "negative",
    reasonLabel: "Motivo de anulación",
    reasonPlaceholder:
      "Ej: Se anula porque faltó un empleado / faltó un incentivo / se cerró por error...",
    tone: "negative",
  });
};

const confirmSoftDeleteRun = (run) => {
  openReasonDialog({
    action: "SOFT_DELETE_RUN",
    run,
    title: "Ocultar cierre",
    subtitle: "El cierre será eliminado lógicamente.",
    icon: "delete",
    message:
      "El cierre será ocultado de la lista normal. No se borrará físicamente de la base de datos.",
    confirmLabel: "Ocultar",
    confirmIcon: "delete",
    confirmColor: "negative",
    reasonLabel: "Motivo",
    reasonPlaceholder:
      "Ej: Se oculta porque fue reemplazado por un cierre corregido...",
    tone: "negative",
  });
};

const handleReasonConfirm = async (note) => {
  const { action, run } = reasonDialog.value;

  if (!run?._id || !action) return;

  reasonDialog.value.loading = true;

  try {
    let response = null;

    if (action === "TOGGLE_ACTIVE") {
      response = await methodsHttp.postApi(
        `payroll/run/${run._id}/admin-update`,
        {
          isActive: !run.isActive,
          adminNote: note,
        },
      );
    }

    if (action === "CANCEL_RUN") {
      response = await methodsHttp.postApi(
        `payroll/run/${run._id}/admin-update`,
        {
          status: "CANCELLED",
          isActive: false,
          adminNote: note,
        },
      );
    }

    if (action === "SOFT_DELETE_RUN") {
      response = await methodsHttp.postApi(
        `payroll/run/${run._id}/soft-delete`,
        {
          note,
        },
      );
    }

    if (response?.ok) {
      const successMessage =
        action === "TOGGLE_ACTIVE"
          ? "Cierre actualizado."
          : action === "CANCEL_RUN"
            ? "Cierre anulado."
            : "Cierre ocultado.";

      notify.value?.notify?.("positive", successMessage);

      if (response.run) {
        onRunUpdated(response.run);
      }

      reasonDialog.value.open = false;

      await loadRuns();
    } else {
      notify.value?.notify?.(
        "negative",
        response?.mensaje || "No se pudo completar la acción.",
      );
    }
  } catch (error) {
    console.error(error);

    notify.value?.notify?.("negative", "Error ejecutando la acción.");
  } finally {
    reasonDialog.value.loading = false;
  }
};

const onRunUpdated = (updatedRun) => {
  if (!updatedRun?._id) return;

  const idx = runs.value.findIndex((run) => run._id === updatedRun._id);

  if (idx >= 0) {
    runs.value[idx] = {
      ...runs.value[idx],
      ...updatedRun,
    };
  }

  if (paymentsDialog.value.run?._id === updatedRun._id) {
    paymentsDialog.value.run = {
      ...paymentsDialog.value.run,
      ...updatedRun,
    };
  }
};

const openPaidEmployeesDialog = () => {
  paidEmployeesDialog.value.open = true;
};

</script>

<style scoped>
.filters-card,
.table-card {
  border-radius: 22px;
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

.section-subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
  background: #ffffff;
}

.action-btn {
  min-height: 38px;
  border-radius: 12px;
  font-weight: 800;
}

.metric-card {
  min-height: 82px;
  padding: 13px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  gap: 11px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.04);
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
  font-size: 1.05rem;
  font-weight: 900;
}

.status-badge {
  border-radius: 999px;
  padding: 6px 9px;
  font-weight: 900;
}

.notes-cell {
  max-width: 260px;
  white-space: pre-line;
  color: #475569;
  font-size: 0.78rem;
}

.clickable-metric {
  position: relative;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.clickable-metric:hover {
  transform: translateY(-2px);
  border-color: rgba(33, 158, 188, 0.35);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.metric-open-icon {
  position: absolute;
  right: 12px;
  top: 12px;
  opacity: 0.8;
}

.paid-employees-dialog {
  width: 1120px;
  max-width: 96vw;
  max-height: 92vh;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

.paid-employees-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
  background: #f8fafc;
}

.mini-total-card {
  min-height: 78px;
  padding: 14px;
  border-radius: 18px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.04);
}

.mini-total-card.highlight {
  background:
    radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent 34%),
    white;
}

.mini-total-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mini-total-value {
  margin-top: 5px;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 900;
}

@media (max-width: 599px) {
  .paid-employees-dialog {
    width: 96vw;
    max-height: 94vh;
  }

  .paid-employees-body {
    padding: 12px;
  }
}
</style>
