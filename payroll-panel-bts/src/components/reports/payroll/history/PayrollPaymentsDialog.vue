<template>
  <AppBaseDialog
    v-model="open"
    title="Pagos del cierre"
    :subtitle="subtitle"
    icon="payments"
    :loading="loading"
    loading-label="Cargando pagos..."
    width="1180px"
    max-width="96vw"
    body-class="payroll-payments-body"
  >
    <div class="payments-dialog-shell">
      <!-- Header actions -->
      <q-card flat bordered class="toolbar-card q-mb-md">
        <q-card-section class="q-pa-md">
          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-md">
              <div class="section-title">
                <q-icon name="receipt_long" color="primary" size="20px" />
                Resumen del cierre
              </div>

              <div class="section-subtitle">
                Revisa empleados pagados, montos, correos y autorización bancaria.
              </div>
            </div>

            <div class="col-12 col-md-auto">
              <div class="row q-gutter-sm">
                <q-btn
                  outline
                  no-caps
                  color="primary"
                  icon="refresh"
                  label="Refrescar"
                  class="action-btn"
                  :loading="loading"
                  @click="emit('refresh')"
                />

                <q-btn
                  unelevated
                  no-caps
                  color="primary"
                  icon="download"
                  label="Archivo banco"
                  class="action-btn"
                  :loading="downloading"
                  :disable="!run?._id || loading"
                  @click="downloadBankFile"
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Metrics -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <div
  class="metric-card clickable-metric"
  role="button"
  tabindex="0"
  @click="openPaidEmployeesDialog"
  @keyup.enter="openPaidEmployeesDialog"
>
  <div class="metric-icon bg-primary text-white">
    <q-icon name="groups" />
  </div>

  <div>
    <div class="metric-label">Empleados</div>
    <div class="metric-value">{{ totalsAll.count }}</div>
    <div class="metric-caption">
      Total empleados
    </div>
  </div>

</div>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="metric-card">
            <div class="metric-icon bg-blue text-white">
              <q-icon name="stacked_line_chart" />
            </div>

            <div>
              <div class="metric-label">Bruto</div>
              <div class="metric-value">{{ formatCurrencySafe(totalsAll.bruto) }}</div>
              <div class="metric-caption">Total período</div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="metric-card">
            <div class="metric-icon bg-negative text-white">
              <q-icon name="remove_circle" />
            </div>

            <div>
              <div class="metric-label">Deducciones</div>
              <div class="metric-value">
                {{ formatCurrencySafe(totalsAll.deducciones) }}
              </div>
              <div class="metric-caption">Legales + otras</div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="metric-card highlight">
            <div class="metric-icon bg-positive text-white">
              <q-icon name="payments" />
            </div>

            <div>
              <div class="metric-label">Neto</div>
              <div class="metric-value">{{ formatCurrencySafe(totalsAll.neto) }}</div>
              <div class="metric-caption">A depositar</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bank + email summary -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-5">
          <q-card flat bordered class="panel-card full-height">
            <q-card-section class="q-pa-md">
              <div class="section-title">
                <q-icon name="account_balance" color="primary" size="20px" />
                Autorización bancaria
              </div>

              <div class="section-subtitle q-mb-md">
                Al guardar el número, el cierre queda marcado como depositado.
              </div>

              <q-input
                v-model="bankAuthNumber"
                outlined
                dense
                label="Número de autorización del banco"
                class="rounded-input"
                :disable="savingBankAuth"
                @keyup.enter="saveBankAuthorization"
              >
                <template #prepend>
                  <q-icon name="verified" color="primary" />
                </template>

                <template #append>
                  <q-btn
                    dense
                    round
                    flat
                    icon="save"
                    color="primary"
                    :loading="savingBankAuth"
                    :disable="!canSaveBankAuth"
                    @click="saveBankAuthorization"
                  >
                    <q-tooltip>Guardar autorización</q-tooltip>
                  </q-btn>
                </template>
              </q-input>

              <q-file
                v-model="bankResponseFile"
                outlined
                dense
                clearable
                label="Archivo de respuesta bancaria"
                class="rounded-input q-mt-md"
                :disable="savingBankAuth"
              >
                <template #prepend>
                  <q-icon name="upload_file" color="primary" />
                </template>
              </q-file>

              <div
                v-if="run?.bankResponseFileName"
                class="text-caption text-grey-7 q-mt-sm"
              >
                Respuesta cargada: <b>{{ run.bankResponseFileName }}</b>
                <span v-if="run?.bankResponseUploadedAt">
                  · {{ formatDateTimeSafe(run.bankResponseUploadedAt) }}
                </span>
              </div>

              <div class="q-mt-md row items-center q-gutter-sm">
                <q-badge
                  :color="isBankClosed ? 'positive' : 'grey-7'"
                  class="status-badge"
                >
                  {{
                    isBankClosed
                      ? "Depositado / cerrado"
                      : "Pendiente depósito"
                  }}
                </q-badge>

                <span v-if="run?.bankDepositedAt" class="text-caption text-grey-7">
                  {{ formatDateTimeSafe(run.bankDepositedAt) }}
                </span>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-7">
          <q-card flat bordered class="panel-card full-height">
            <q-card-section class="q-pa-md">
              <div class="section-title">
                <q-icon name="mark_email_read" color="primary" size="20px" />
                Estado de correos
              </div>

              <div class="section-subtitle q-mb-md">
                Resumen de volantes enviados, pendientes y fallidos.
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-4">
                  <div class="mini-stat">
                    <q-icon name="check_circle" color="positive" size="24px" />
                    <div>
                      <div class="mini-stat-label">Enviados</div>
                      <div class="mini-stat-value">{{ emailStats.sent }}</div>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-sm-4">
                  <div class="mini-stat">
                    <q-icon name="schedule_send" color="grey-7" size="24px" />
                    <div>
                      <div class="mini-stat-label">Pendientes</div>
                      <div class="mini-stat-value">{{ emailStats.pending }}</div>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-sm-4">
                  <div class="mini-stat">
                    <q-icon name="error" color="negative" size="24px" />
                    <div>
                      <div class="mini-stat-label">Fallidos</div>
                      <div class="mini-stat-value">{{ emailStats.failed }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Filters -->
      <q-card flat bordered class="filters-card q-mb-md">
        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md items-center">
            <div class="col-12 col-md-4">
              <q-input
                v-model="filters.text"
                outlined
                dense
                label="Buscar empleado, correo, departamento o puesto"
                class="rounded-input"
              >
                <template #prepend>
                  <q-icon name="search" color="primary" />
                </template>

                <template #append>
                  <q-btn
                    v-if="filters.text"
                    dense
                    flat
                    round
                    icon="close"
                    @click="filters.text = ''"
                  />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <q-select
                v-model="filters.emailStatus"
                :options="emailStatusOptions"
                outlined
                dense
                emit-value
                map-options
                label="Correo"
                class="rounded-input"
              />
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <q-select
                v-model="filters.salaryType"
                :options="salaryTypeOptions"
                outlined
                dense
                emit-value
                map-options
                label="Tipo salario"
                class="rounded-input"
              />
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <q-select
                v-model="groupBy"
                :options="groupByOptions"
                outlined
                dense
                emit-value
                map-options
                label="Agrupar por"
                class="rounded-input"
              />
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <q-btn-toggle
                v-model="viewMode"
                unelevated
                spread
                toggle-color="primary"
                color="grey-2"
                text-color="grey-8"
                :options="[
                  { label: 'Grupos', value: 'groups', icon: 'view_agenda' },
                  { label: 'Tabla', value: 'table', icon: 'table_chart' },
                ]"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Grouped cards -->
      <div v-if="viewMode === 'groups'" class="grouped-view">
        <q-banner
          v-if="!filteredRows.length && !loading"
          rounded
          class="bg-grey-2 text-grey-8 q-pa-md"
        >
          <template #avatar>
            <q-icon name="info" color="grey-7" />
          </template>
          No hay pagos para los filtros seleccionados.
        </q-banner>

        <q-expansion-item
          v-for="group in groupedRows"
          :key="group.key"
          default-opened
          expand-separator
          class="group-expansion q-mb-md"
        >
          <template #header>
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white" size="42px">
                <q-icon :name="groupIcon" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ group.label }}
              </q-item-label>

              <q-item-label caption>
                {{ group.rows.length }} empleado(s) · Neto:
                {{ formatCurrencySafe(group.totals.neto) }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="text-right">
                <div class="text-weight-bold text-positive">
                  {{ formatCurrencySafe(group.totals.neto) }}
                </div>
                <div class="text-caption text-grey-7">
                  Bruto {{ formatCurrencySafe(group.totals.bruto) }}
                </div>
              </div>
            </q-item-section>
          </template>

          <div class="q-pa-md">
            <div class="row q-col-gutter-md">
              <div
                v-for="payment in group.rows"
                :key="payment._id"
                class="col-12 col-md-6 col-lg-4"
              >
                <q-card
                  flat
                  bordered
                  class="employee-payment-card cursor-pointer"
                  @click="openDetails(payment)"
                >
                  <q-card-section class="q-pa-md">
                    <div class="row items-start no-wrap q-gutter-sm">
                      <q-avatar size="44px" class="employee-avatar">
                        <img :src="employeeAvatar(payment)" />
                      </q-avatar>

                      <div class="col min-width-0">
                        <div class="row items-start justify-between no-wrap">
                          <div class="min-width-0">
                            <div class="employee-name ellipsis">
                              {{ payment.employeeName || "Empleado" }}
                            </div>

                            <div class="employee-email ellipsis">
                              {{ payment.employeeEmail || "Sin correo" }}
                            </div>
                          </div>

                          <q-badge
                            :color="paymentEmailColor(payment)"
                            class="status-badge q-ml-sm"
                          >
                            {{ paymentEmailLabel(payment) }}
                          </q-badge>
                        </div>

                        <div class="employee-meta q-mt-sm">
                          <q-chip dense square color="grey-2" text-color="grey-8">
                            <q-icon name="domain" size="15px" class="q-mr-xs" />
                            {{ getDepartment(payment) }}
                          </q-chip>

                          <q-chip dense square color="grey-2" text-color="grey-8">
                            <q-icon name="badge" size="15px" class="q-mr-xs" />
                            {{ getJobPosition(payment) }}
                          </q-chip>

                          <q-chip dense square color="grey-2" text-color="grey-8">
                            <q-icon name="payments" size="15px" class="q-mr-xs" />
                            {{ getSalaryType(payment) }}
                          </q-chip>
                        </div>

                        <q-separator class="q-my-sm" />

                        <div class="row q-col-gutter-sm">
                          <div class="col-4">
                            <div class="amount-label">Bruto</div>
                            <div class="amount-value">
                              {{ formatCurrencyCompact(getGross(payment)) }}
                            </div>
                          </div>

                          <div class="col-4">
                            <div class="amount-label">Deduc.</div>
                            <div class="amount-value text-negative">
                              {{ formatCurrencyCompact(getDeductions(payment)) }}
                            </div>
                          </div>

                          <div class="col-4">
                            <div class="amount-label">Neto</div>
                            <div class="amount-value text-positive">
                              {{ formatCurrencyCompact(getNet(payment)) }}
                            </div>
                          </div>
                        </div>

                        <div
                          v-if="payment.emailError"
                          class="email-error q-mt-sm"
                        >
                          <q-icon name="warning" size="16px" />
                          <span>{{ payment.emailError }}</span>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>
        </q-expansion-item>
      </div>

      <!-- Table view -->
      <q-card v-else flat bordered class="table-card">
        <q-table
          :rows="filteredRows"
          :columns="columns"
          row-key="_id"
          bordered
          flat
          :loading="loading"
          :rows-per-page-options="[10, 25, 50, 100]"
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
                      {{ props.row.employeeName || "—" }}
                    </div>
                    <div class="text-caption text-grey-7 ellipsis">
                      {{ props.row.employeeEmail || "—" }}
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

              <q-td key="payDate" :props="props">
                {{
                  props.row?.snapshot?.period?.payDate
                    ? formatDateTimeSafe(props.row.snapshot.period.payDate)
                    : "—"
                }}
              </q-td>

              <q-td key="grossPeriod" :props="props" class="text-right">
                {{ formatCurrencySafe(getGross(props.row)) }}
              </q-td>

              <q-td key="deductionsPeriod" :props="props" class="text-right">
                {{ formatCurrencySafe(getDeductions(props.row)) }}
              </q-td>

              <q-td key="netPeriod" :props="props" class="text-right">
                <b>{{ formatCurrencySafe(getNet(props.row)) }}</b>
              </q-td>

              <q-td key="emailed" :props="props">
                <q-badge :color="paymentEmailColor(props.row)" class="status-badge">
                  {{ paymentEmailLabel(props.row) }}
                </q-badge>

                <div
                  v-if="props.row.emailError"
                  class="text-caption text-negative q-mt-xs"
                >
                  {{ props.row.emailError }}
                </div>
              </q-td>
            </q-tr>
          </template>

          <template #no-data>
            <div class="full-width row flex-center q-gutter-sm text-grey-7 q-pa-md">
              <q-icon name="info" />
              <span>No hay pagos para este cierre.</span>
            </div>
          </template>
        </q-table>
      </q-card>
    </div>

    <template #actions>
      <q-btn
        flat
        no-caps
        color="grey-8"
        icon="close"
        label="Cerrar"
        class="action-btn"
        @click="open = false"
      />

      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        label="Refrescar pagos"
        class="action-btn"
        :loading="loading"
        @click="emit('refresh')"
      />
    </template>
  </AppBaseDialog>

  <PayrollPaymentDetailsDialog
    v-model="details.open"
    :loading="details.loading"
    :payment="details.payment"
  />
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { formatCurrency, formatDateTime } from "app/utils";
import PayrollPaymentDetailsDialog from "./PayrollPaymentDetailsDialog.vue";
import methodsHttp from "src/api/methodsHttp";
import AppBaseDialog from "src/components/dialog/AppBaseDialog.vue";

const $q = useQuasar();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  run: { type: Object, default: null },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "refresh", "run-updated"]);

const fallbackAvatar =
  "https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/profile_avatar.png";

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const details = ref({
  open: false,
  loading: false,
  payment: null,
});

const downloading = ref(false);
const bankAuthNumber = ref("");
const bankResponseFile = ref(null);
const savingBankAuth = ref(false);

const viewMode = ref("groups");
const groupBy = ref("department");

const filters = reactive({
  text: "",
  emailStatus: "ALL",
  salaryType: "ALL",
});

const overviewLoading = ref(false);
const paymentsLoading = ref(false);

const overview = ref({
  summary: {
    count: 0,
    bruto: 0,
    deducciones: 0,
    neto: 0,
    email: {
      sent: 0,
      pending: 0,
      failed: 0,
    },
  },
  groups: [],
});

const selectedGroup = ref(null);

const payments = ref([]);
const paymentsTotal = ref(0);
const paymentsPage = ref(1);
const paymentsLimit = ref(20);


const subtitle = computed(() => {
  return `Período: ${props.run?.periodStart || "—"} → ${
    props.run?.periodEnd || "—"
  } · Empleados: ${Number(props.run?.employeeCount || props.rows?.length || 0)}`;
});

const groupByOptions = [
  { label: "Departamento", value: "department" },
  { label: "Puesto", value: "jobPosition" },
  { label: "Estado de correo", value: "emailStatus" },
  { label: "Tipo de salario", value: "salaryType" },
  { label: "Banco", value: "bank" },
];

const emailStatusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Enviados", value: "SENT" },
  { label: "Pendientes", value: "PENDING" },
  { label: "Fallidos", value: "FAILED" },
];

const salaryTypeOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Fijo", value: "FIJO" },
  { label: "Horas", value: "HORAS" },
  { label: "Otros", value: "OTHER" },
];

const columns = computed(() => [
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
    name: "payDate",
    label: "Fecha pago",
    align: "left",
    field: (row) => row?.snapshot?.period?.payDate || "",
  },
  {
    name: "grossPeriod",
    label: "Bruto",
    align: "right",
    field: (row) => getGross(row),
    sortable: true,
  },
  {
    name: "deductionsPeriod",
    label: "Deducciones",
    align: "right",
    field: (row) => getDeductions(row),
    sortable: true,
  },
  {
    name: "netPeriod",
    label: "Neto",
    align: "right",
    field: (row) => getNet(row),
    sortable: true,
  },
  {
    name: "emailed",
    label: "Email",
    align: "left",
    field: (row) => paymentEmailLabel(row),
  },
]);

const groupIcon = computed(() => {
  const map = {
    department: "domain",
    jobPosition: "badge",
    emailStatus: "mark_email_read",
    salaryType: "payments",
    bank: "account_balance",
  };

  return map[groupBy.value] || "folder";
});

const toNum = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getGross = (payment) => {
  return toNum(payment?.snapshot?.totals?.sueldoBrutoPeriodo, 0);
};

const getDeductions = (payment) => {
  return toNum(payment?.snapshot?.totals?.totalDeduccionesPeriodo, 0);
};

const getNet = (payment) => {
  return toNum(payment?.snapshot?.totals?.sueldoNetoPeriodo, 0);
};

const getDepartment = (payment) => {
  console.log("getDepartment", payment);
  return (
    payment?.snapshot?.employee?.departmentName ||
    payment?.employee?.department?.name ||
    payment?.user?.department?.name ||
    "Sin departamento"
  );
};

const getJobPosition = (payment) => {
  return (
    payment?.snapshot?.employee?.jobPositionName ||
    payment?.employee?.jobPosition?.name ||
    payment?.user?.jobPosition?.name ||
    "Sin puesto"
  );
};

const getSalaryType = (payment) => {
  return String(
    payment?.snapshot?.employee?.tipoSalario ||
      payment?.snapshot?.employee?.salaryType ||
      "Sin tipo",
  ).toUpperCase();
};

const getBank = (payment) => {
  return (
    payment?.bankSnapshot?.bankCode ||
    payment?.snapshot?.bankSnapshot?.bankCode ||
    "Sin banco"
  );
};

const employeeAvatar = (payment) => {
  return (
    payment?.user?.img ||
    payment?.user?.image ||
    payment?.employee?.img ||
    payment?.employee?.image ||
    payment?.snapshot?.employee?.img ||
    fallbackAvatar
  );
};

const paymentEmailLabel = (payment) => {
  const status = String(payment?.emailStatus || "").toUpperCase();

  if (payment?.emailedAt || status === "EMAILED") return "Enviado";
  if (payment?.emailError || status === "EMAIL_FAILED") return "Fallido";

  return "Pendiente";
};

const paymentEmailColor = (payment) => {
  const label = paymentEmailLabel(payment);

  if (label === "Enviado") return "positive";
  if (label === "Fallido") return "negative";

  return "grey-7";
};

const getEmailStatusFilterValue = (payment) => {
  const label = paymentEmailLabel(payment);

  if (label === "Enviado") return "SENT";
  if (label === "Fallido") return "FAILED";

  return "PENDING";
};

const getGroupValue = (payment) => {
  if (groupBy.value === "department") return getDepartment(payment);
  if (groupBy.value === "jobPosition") return getJobPosition(payment);
  if (groupBy.value === "emailStatus") return paymentEmailLabel(payment);
  if (groupBy.value === "salaryType") return getSalaryType(payment);
  if (groupBy.value === "bank") return getBank(payment);

  return "Otros";
};

const filteredRows = computed(() => {
  const text = String(filters.text || "").trim().toLowerCase();

  return (props.rows || []).filter((payment) => {
    const haystack = [
      payment?.employeeName,
      payment?.employeeEmail,
      getDepartment(payment),
      getJobPosition(payment),
      getSalaryType(payment),
      getBank(payment),
      paymentEmailLabel(payment),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchText = !text || haystack.includes(text);

    const matchEmailStatus =
      filters.emailStatus === "ALL" ||
      getEmailStatusFilterValue(payment) === filters.emailStatus;

    const salaryType = getSalaryType(payment);

    const matchSalaryType =
      filters.salaryType === "ALL" ||
      (filters.salaryType === "OTHER"
        ? !["FIJO", "HORAS"].includes(salaryType)
        : salaryType === filters.salaryType);

    return matchText && matchEmailStatus && matchSalaryType;
  });
});

const totalsAll = computed(() => {
  let bruto = 0;
  let deducciones = 0;
  let neto = 0;

  for (const payment of filteredRows.value || []) {
    bruto += getGross(payment);
    deducciones += getDeductions(payment);
    neto += getNet(payment);
  }

  return {
    count: filteredRows.value.length,
    bruto,
    deducciones,
    neto,
  };
});

const emailStats = computed(() => {
  let sent = 0;
  let pending = 0;
  let failed = 0;

  for (const payment of filteredRows.value || []) {
    const status = getEmailStatusFilterValue(payment);

    if (status === "SENT") sent++;
    else if (status === "FAILED") failed++;
    else pending++;
  }

  return {
    sent,
    pending,
    failed,
  };
});

const groupedRows = computed(() => {
  const map = new Map();

  for (const payment of filteredRows.value || []) {
    const groupValue = getGroupValue(payment);
    const key = String(groupValue || "Sin grupo");

    if (!map.has(key)) {
      map.set(key, {
        key,
        label: key,
        rows: [],
        totals: {
          bruto: 0,
          deducciones: 0,
          neto: 0,
        },
      });
    }

    const group = map.get(key);

    group.rows.push(payment);
    group.totals.bruto += getGross(payment);
    group.totals.deducciones += getDeductions(payment);
    group.totals.neto += getNet(payment);
  }

  return Array.from(map.values()).sort((a, b) => {
    return String(a.label).localeCompare(String(b.label));
  });
});

const isBankClosed = computed(() => {
  return !!(
    props.run?.bankAuthorizationNumber &&
    String(props.run.bankAuthorizationNumber).trim()
  );
});

const canSaveBankAuth = computed(() => {
  const value = String(bankAuthNumber.value || "").trim();

  return !!props.run?._id && (!!value || !!bankResponseFile.value) && !savingBankAuth.value;
});

const formatCurrencySafe = (value) => {
  try {
    return formatCurrency(value);
  } catch (_) {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }
};

const formatCurrencyCompact = (value) => {
  const number = Number(value || 0);

  if (Math.abs(number) >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (Math.abs(number) >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }

  return formatCurrencySafe(number);
};

const formatDateTimeSafe = (value) => {
  if (!value) return "—";

  try {
    return formatDateTime(value);
  } catch (_) {
    return new Date(value).toLocaleString("es-DO");
  }
};

watch(
  () => props.run,
  (run) => {
    bankAuthNumber.value = run?.bankAuthorizationNumber || "";
    bankResponseFile.value = null;
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      filters.text = "";
      filters.emailStatus = "ALL";
      filters.salaryType = "ALL";
      groupBy.value = "department";
      viewMode.value = "groups";
      bankAuthNumber.value = props.run?.bankAuthorizationNumber || "";
      bankResponseFile.value = null;
    }
  },
);

const openDetails = async (row) => {
  if (!row?._id) return;

  try {
    details.value.open = true;
    details.value.loading = true;
    details.value.payment = null;

    const response = await methodsHttp.getApi(`payroll/payment/${row._id}`);

    if (response?.ok) {
      details.value.payment = response.payment;
    } else {
      details.value.payment = null;

      $q.notify({
        type: "negative",
        message: response?.mensaje || "No se pudo cargar el detalle del pago.",
      });
    }
  } catch (error) {
    console.error("openDetails error:", error);

    details.value.payment = null;

    $q.notify({
      type: "negative",
      message: "Error cargando detalle del pago.",
    });
  } finally {
    details.value.loading = false;
  }
};

const downloadTextFile = (content, fileName = "bankfile.txt") => {
  const blob = new Blob([content], { type: "text/plain;charset=ascii" });
  const url = window.URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(url);
};

const downloadBankFile = async () => {
  if (!props.run?._id) return;

  downloading.value = true;

  try {
    const response = await methodsHttp.postApi("payroll/generateBankFileByRun", {
      runId: props.run._id,
    });

    if (!response?.ok) {
      $q.notify({
        type: "negative",
        message: response?.mensaje || "No se pudo generar el archivo del banco.",
      });

      return;
    }

    if (response.fileUrl) {
      window.open(response.fileUrl, "_blank");
      return;
    }

    const content = response.content || "";
    const fileName =
      response.fileName ||
      `nomina_${props.run.periodStart || ""}_${props.run.periodEnd || ""}.txt`;

    if (!content) {
      $q.notify({
        type: "warning",
        message: "El backend respondió correctamente, pero no devolvió contenido.",
      });

      return;
    }

    downloadTextFile(content, fileName);

    $q.notify({
      type: "positive",
      message: "Archivo del banco generado correctamente.",
    });
  } catch (error) {
    console.error("downloadBankFile error:", error);

    $q.notify({
      type: "negative",
      message: "Error generando archivo del banco.",
    });
  } finally {
    downloading.value = false;
  }
};

const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

const saveBankAuthorization = async () => {
  if (!props.run?._id) return;

  const value = String(bankAuthNumber.value || "").trim();

  if (!value && !bankResponseFile.value) return;

  savingBankAuth.value = true;

  try {
    const payload = {
      bankAuthorizationNumber: value || props.run?.bankAuthorizationNumber || "",
      adminNote: value
        ? `Autorización bancaria registrada: ${value}`
        : "Archivo de respuesta bancaria cargado.",
    };

    if (bankResponseFile.value) {
      payload.bankResponseFile = {
        fileName: bankResponseFile.value.name,
        mimeType: bankResponseFile.value.type || "text/plain",
        size: bankResponseFile.value.size || 0,
        contentBase64: await readFileAsBase64(bankResponseFile.value),
      };
    }

    const response = await methodsHttp.postApi(
      `payroll/run/${props.run._id}/admin-update`,
      payload,
    );

    if (response?.ok) {
      emit("run-updated", response.run);
      emit("refresh");
      bankResponseFile.value = null;

      $q.notify({
        type: "positive",
        message: response.emailDispatchQueued
          ? "Información bancaria guardada. Volantes pendientes en proceso de envío."
          : "Información bancaria guardada correctamente.",
      });
    } else {
      $q.notify({
        type: "negative",
        message:
          response?.mensaje || "No se pudo guardar la autorización bancaria.",
      });
    }
  } catch (error) {
    console.error("saveBankAuthorization error:", error);

    $q.notify({
      type: "negative",
      message: "Error guardando autorización bancaria.",
    });
  } finally {
    savingBankAuth.value = false;
  }
};

const loadOverview = async () => {
  if (!props.run?._id) return;

  overviewLoading.value = true;

  try {
    const query = new URLSearchParams();

    query.set("groupBy", groupBy.value);

    if (filters.text) {
      query.set("text", filters.text.trim());
    }

    const resp = await methodsHttp.getApi(
      `payroll/run/${props.run._id}/payments-overview?${query.toString()}`,
    );

    if (resp?.ok) {
      overview.value = {
        summary: resp.summary,
        groups: resp.groups || [],
      };
    }
  } finally {
    overviewLoading.value = false;
  }
};

const openGroup = async (group) => {
  selectedGroup.value = group;
  paymentsPage.value = 1;
  await loadGroupPayments();
};

const loadGroupPayments = async () => {
  if (!props.run?._id || !selectedGroup.value) return;

  paymentsLoading.value = true;

  try {
    const initial = (paymentsPage.value - 1) * paymentsLimit.value;

    const query = new URLSearchParams();

    query.set("groupBy", groupBy.value);
    query.set("groupValue", selectedGroup.value.key);
    query.set("limit", String(paymentsLimit.value));
    query.set("initial", String(initial));
    query.set("emailStatus", filters.emailStatus || "ALL");
    query.set("salaryType", filters.salaryType || "ALL");

    if (filters.text) {
      query.set("text", filters.text.trim());
    }

    const resp = await methodsHttp.getApi(
      `payroll/run/${props.run._id}/payments-page?${query.toString()}`,
    );

    if (resp?.ok) {
      payments.value = resp.payments || [];
      paymentsTotal.value = Number(resp.total || 0);
    }
  } finally {
    paymentsLoading.value = false;
  }
};

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && props.run?._id) {
      selectedGroup.value = null;
      payments.value = [];
      paymentsPage.value = 1;
      await loadOverview();
    }
  },
);
</script>

<style scoped>
.payments-dialog-shell {
  width: 100%;
}

.toolbar-card,
.panel-card,
.filters-card,
.table-card {
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.04);
  background: #ffffff;
}

.full-height {
  height: 100%;
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

.action-btn {
  min-height: 38px;
  border-radius: 12px;
  font-weight: 800;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
  background: #ffffff;
}

.metric-card {
  min-height: 92px;
  padding: 14px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.04);
}

.metric-card.highlight {
  background:
    radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent 34%),
    #ffffff;
}

.metric-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 16px;
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
  font-size: 1.03rem;
  font-weight: 900;
}

.metric-caption {
  margin-top: 2px;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 600;
}

.mini-stat {
  min-height: 58px;
  padding: 11px 12px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  gap: 10px;
}

.mini-stat-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mini-stat-value {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.status-badge {
  border-radius: 999px;
  padding: 5px 9px;
  font-weight: 900;
  white-space: nowrap;
}

.group-expansion {
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #ffffff;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.04);
}

.group-expansion :deep(.q-item) {
  min-height: 74px;
}

.employee-payment-card {
  min-height: 190px;
  border-radius: 20px;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.employee-payment-card:hover {
  transform: translateY(-2px);
  border-color: rgba(25, 118, 210, 0.28);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.1);
}

.employee-avatar {
  background: #f1f5f9;
}

.employee-name {
  color: #0f172a;
  font-size: 0.96rem;
  font-weight: 900;
  line-height: 1.1;
}

.employee-email {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 500;
}

.employee-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.amount-label {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.amount-value {
  margin-top: 2px;
  color: #0f172a;
  font-size: 0.84rem;
  font-weight: 900;
}

.email-error {
  padding: 7px 9px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
  font-size: 0.74rem;
  font-weight: 700;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.min-width-0 {
  min-width: 0;
}

:deep(.q-table th) {
  color: #475569;
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

:deep(.q-table tbody td) {
  font-size: 0.82rem;
}

@media (max-width: 768px) {
  .action-btn {
    width: 100%;
  }

  .metric-card {
    min-height: 82px;
  }

  .group-expansion :deep(.q-item__section--side) {
    display: none;
  }
}
</style>
