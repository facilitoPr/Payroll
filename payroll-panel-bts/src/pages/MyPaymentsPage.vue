<template>
  <div class="my-payroll-page bg-white q-pa-md">
    <PageHeaderCard
      title="Mi nómina"
      subtitle="Consulta tus pagos, volantes y días trabajados"
      icon="payments"
    >
      <template #actions>
        <div class="row q-gutter-sm">
          <q-btn
            outline
            no-caps
            color="primary"
            icon="refresh"
            label="Refrescar"
            class="action-btn"
            :loading="loadingPayments || loadingDays"
            @click="refreshCurrentTab"
          />
        </div>
      </template>
    </PageHeaderCard>

    <div class="row q-col-gutter-md q-mt-md">
      <div class="col-12 col-sm-6 col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-primary text-white">
            <q-icon name="receipt_long" />
          </div>

          <div>
            <div class="metric-label">Pagos</div>
            <div class="metric-value">{{ paymentsMeta.totalCount }}</div>
            <div class="metric-caption">Historial registrado</div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <div class="metric-card highlight">
          <div class="metric-icon bg-positive text-white">
            <q-icon name="payments" />
          </div>

          <div>
            <div class="metric-label">Neto visible</div>
            <div class="metric-value">
              {{ formatCurrency(paymentsSummary.net) }}
            </div>
            <div class="metric-caption">Según la página actual</div>
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
              {{ formatCurrency(paymentsSummary.deductions) }}
            </div>
            <div class="metric-caption">Según la página actual</div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-blue text-white">
            <q-icon name="mark_email_read" />
          </div>

          <div>
            <div class="metric-label">Volantes enviados</div>
            <div class="metric-value">{{ paymentsSummary.emailed }}</div>
            <div class="metric-caption">En esta página</div>
          </div>
        </div>
      </div>
    </div>

    <q-card flat bordered class="main-card q-mt-md">
      <q-card-section class="tabs-wrapper q-pa-none">
        <q-tabs
          v-model="tab"
          dense
          no-caps
          align="left"
          class="main-tabs"
          active-color="primary"
          indicator-color="primary"
        >
          <q-tab name="payments" icon="receipt_long" label="Mis pagos" />
          <q-tab name="days" icon="event_available" label="Mis días trabajados" />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <q-tab-panels v-model="tab" animated class="tab-panels">
        <q-tab-panel name="payments" class="q-pa-md">
          <q-card flat bordered class="filters-card q-mb-md">
            <q-card-section class="q-pa-md">
              <div class="row items-center justify-between q-col-gutter-md">
                <div class="col-12 col-md">
                  <div class="section-title">
                    <q-icon name="filter_alt" color="primary" size="20px" />
                    Filtros de pagos
                  </div>

                  <div class="section-subtitle">
                    Busca tus pagos por período, nota o estado del volante.
                  </div>
                </div>

                <div class="col-12 col-md-auto">
                  <div class="row q-gutter-sm">
                    <q-btn
                      outline
                      no-caps
                      color="grey-8"
                      icon="cleaning_services"
                      label="Limpiar"
                      class="action-btn"
                      :disable="loadingPayments"
                      @click="clearPaymentFilters"
                    />

                    <q-btn
                      unelevated
                      no-caps
                      color="primary"
                      icon="search"
                      label="Buscar"
                      class="action-btn"
                      :loading="loadingPayments"
                      @click="loadPayments(true)"
                    />
                  </div>
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="searchText"
                    outlined
                    dense
                    label="Buscar por período, nota o estado"
                    class="rounded-input"
                    @keyup.enter="loadPayments(true)"
                  >
                    <template #prepend>
                      <q-icon name="search" color="primary" />
                    </template>

                    <template #append>
                      <q-btn
                        v-if="searchText"
                        dense
                        flat
                        round
                        icon="close"
                        @click="clearSearch"
                      />
                    </template>
                  </q-input>
                </div>

                <div class="col-12 col-sm-6 col-md-3">
                  <q-select
                    v-model="paymentsLimit"
                    :options="[10, 20, 50]"
                    outlined
                    dense
                    label="Filas por página"
                    class="rounded-input"
                    @update:model-value="loadPayments(true)"
                  >
                    <template #prepend>
                      <q-icon name="table_rows" color="primary" />
                    </template>
                  </q-select>
                </div>

                <div class="col-12 col-sm-6 col-md-3">
                  <div class="results-card">
                    <div class="results-label">Resultados</div>
                    <div class="results-value">
                      {{ paymentsMeta.totalCount }}
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="table-card">
            <q-table
              :rows="payments"
              :columns="paymentCols"
              row-key="_id"
              flat
              :loading="loadingPayments"
              hide-pagination
              :rows-per-page-options="[0]"
              no-data-label="No tienes pagos registrados."
            >
              <template #body="props">
                <q-tr
                  :props="props"
                  class="cursor-pointer payment-row"
                  @click="openPaymentDetail(props.row)"
                >
                  <q-td key="period" :props="props">
                    <div class="row items-center no-wrap">
                      <q-avatar
                        size="38px"
                        color="primary"
                        text-color="white"
                        class="q-mr-sm"
                      >
                        <q-icon name="date_range" />
                      </q-avatar>

                      <div class="min-width-0">
                        <div class="text-weight-bold ellipsis">
                          {{ getPaymentPeriod(props.row) }}
                        </div>

                        <div class="text-caption text-grey-7 ellipsis">
                          Fecha pago: {{ getPaymentPayDate(props.row) }}
                        </div>
                      </div>
                    </div>
                  </q-td>

                  <q-td key="gross" :props="props" class="text-right">
                    <div class="amount-text">
                      {{ formatCurrency(getPaymentGross(props.row)) }}
                    </div>
                  </q-td>

                  <q-td key="ded" :props="props" class="text-right">
                    <div class="amount-text text-negative">
                      {{ formatCurrency(getPaymentDeductions(props.row)) }}
                    </div>
                  </q-td>

                  <q-td key="net" :props="props" class="text-right">
                    <div class="amount-text text-positive">
                      {{ formatCurrency(getPaymentNet(props.row)) }}
                    </div>
                  </q-td>

                  <q-td key="emailed" :props="props">
                    <q-badge
                      :color="paymentEmailColor(props.row)"
                      class="status-badge"
                    >
                      <q-icon
                        :name="paymentEmailIcon(props.row)"
                        size="14px"
                        class="q-mr-xs"
                      />
                      {{ paymentEmailLabel(props.row) }}
                    </q-badge>

                    <div
                      v-if="props.row?.emailError"
                      class="text-caption text-negative q-mt-xs"
                    >
                      {{ props.row.emailError }}
                    </div>
                  </q-td>

                  <q-td key="actions" :props="props" class="text-right">
                    <q-btn
                      dense
                      flat
                      round
                      color="primary"
                      icon="visibility"
                      @click.stop="openPaymentDetail(props.row)"
                    >
                      <q-tooltip>Ver detalle</q-tooltip>
                    </q-btn>
                  </q-td>
                </q-tr>
              </template>

              <template #loading>
                <q-inner-loading showing color="primary" />
              </template>

              <template #no-data>
                <div class="empty-state">
                  <q-avatar size="56px" color="grey-2" text-color="grey-7">
                    <q-icon name="receipt_long" size="30px" />
                  </q-avatar>

                  <div class="empty-title">No tienes pagos registrados</div>
                  <div class="empty-subtitle">
                    Cuando se genere tu nómina aparecerá aquí.
                  </div>
                </div>
              </template>
            </q-table>
          </q-card>

          <div class="row items-center justify-between q-col-gutter-md q-mt-md">
            <div class="col-12 col-md">
              <div class="pagination-caption">
                Página {{ paymentsPage }} de {{ paymentsMeta.totalPages }}
              </div>
            </div>

            <div class="col-12 col-md-auto">
              <q-pagination
                v-model="paymentsPage"
                :max="paymentsMeta.totalPages"
                :max-pages="8"
                direction-links
                boundary-links
                push
                color="primary"
                active-design="push"
                active-color="primary"
                @update:model-value="loadPayments(false)"
              />
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="days" class="q-pa-md">
          <q-card flat bordered class="filters-card q-mb-md">
            <q-card-section class="q-pa-md">
              <div class="row items-center justify-between q-col-gutter-md">
                <div class="col-12 col-md">
                  <div class="section-title">
                    <q-icon name="calendar_month" color="primary" size="20px" />
                    Rango de días trabajados
                  </div>

                  <div class="section-subtitle">
                    Selecciona un período para consultar tu asistencia y resumen de trabajo.
                  </div>
                </div>

                <div class="col-12 col-md-auto">
                  <q-btn
                    unelevated
                    no-caps
                    color="primary"
                    icon="search"
                    label="Buscar días"
                    class="action-btn"
                    :loading="loadingDays"
                    @click="loadDays"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="daysFilters.fechaInicio"
                    outlined
                    dense
                    label="Desde"
                    mask="####-##-##"
                    class="rounded-input"
                  >
                    <template #prepend>
                      <q-icon name="event" color="primary" />
                    </template>

                    <template #append>
                      <q-icon name="calendar_month" class="cursor-pointer">
                        <q-popup-proxy
                          cover
                          transition-show="scale"
                          transition-hide="scale"
                        >
                          <q-date
                            v-model="daysFilters.fechaInicio"
                            mask="YYYY-MM-DD"
                          />
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>

                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="daysFilters.fechaFin"
                    outlined
                    dense
                    label="Hasta"
                    mask="####-##-##"
                    class="rounded-input"
                  >
                    <template #prepend>
                      <q-icon name="event_available" color="primary" />
                    </template>

                    <template #append>
                      <q-icon name="calendar_month" class="cursor-pointer">
                        <q-popup-proxy
                          cover
                          transition-show="scale"
                          transition-hide="scale"
                        >
                          <q-date
                            v-model="daysFilters.fechaFin"
                            mask="YYYY-MM-DD"
                          />
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>

                <div class="col-12 col-md-6">
                  <div class="days-info-card">
                    <q-icon name="info" color="primary" size="22px" />

                    <div>
                      <div class="days-info-title">Consulta de asistencia</div>
                      <div class="days-info-subtitle">
                        Este resumen se calcula con tus ponches dentro del rango seleccionado.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <div v-if="loadingDays" class="loading-box">
            <q-linear-progress indeterminate color="primary" />

            <div class="text-caption text-grey-7 q-mt-sm">
              Cargando días trabajados...
            </div>
          </div>

          <div v-else>
            <div v-if="!daysEmployee" class="empty-state bordered">
              <q-avatar size="64px" color="grey-2" text-color="grey-7">
                <q-icon name="event_available" size="34px" />
              </q-avatar>

              <div class="empty-title">Consulta tus días trabajados</div>
              <div class="empty-subtitle">
                Selecciona un rango y presiona “Buscar días”.
              </div>
            </div>

            <div v-else>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-sm-6 col-md-3">
                  <div class="metric-card">
                    <div class="metric-icon bg-primary text-white">
                      <q-icon name="schedule" />
                    </div>

                    <div>
                      <div class="metric-label">Minutos trabajados</div>
                      <div class="metric-value">
                        {{ daysEmployee?.totalWorkedMinutes || 0 }}
                      </div>
                      <div class="metric-caption">Dentro del rango</div>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-sm-6 col-md-3">
                  <div class="metric-card">
                    <div class="metric-icon bg-warning text-white">
                      <q-icon name="timer_off" />
                    </div>

                    <div>
                      <div class="metric-label">Descuentos</div>
                      <div class="metric-value">
                        {{ formatCurrency(daysEmployee?.totalDiscounts || 0) }}
                      </div>
                      <div class="metric-caption">Según asistencia</div>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-sm-6 col-md-3">
                  <div class="metric-card">
                    <div class="metric-icon bg-blue text-white">
                      <q-icon name="account_balance_wallet" />
                    </div>

                    <div>
                      <div class="metric-label">Base período</div>
                      <div class="metric-value">
                        {{ formatCurrency(daysEmployee?.netoPeriodoBase || 0) }}
                      </div>
                      <div class="metric-caption">Neto base</div>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-sm-6 col-md-3">
                  <div class="metric-card highlight">
                    <div class="metric-icon bg-positive text-white">
                      <q-icon name="payments" />
                    </div>

                    <div>
                      <div class="metric-label">Neto a depositar</div>
                      <div class="metric-value text-positive">
                        {{ formatCurrency(daysEmployee?.netoADepositar || 0) }}
                      </div>
                      <div class="metric-caption">Calculado</div>
                    </div>
                  </div>
                </div>
              </div>

              <q-card flat bordered class="table-card">
                <q-card-section class="q-pa-md">
                  <div class="section-title">
                    <q-icon name="fact_check" color="primary" size="20px" />
                    Detalle del período
                  </div>

                  <div class="section-subtitle q-mb-md">
                    Revisión de días, horas trabajadas y cálculo del empleado.
                  </div>

                  <TableReportsNominaSingle
                    :item="daysEmployee"
                    :rows="daysRows"
                    :fechaInicio="daysFilters.fechaInicio"
                    :fechaFin="daysFilters.fechaFin"
                    :openModal="openDayDetails"
                    :netoADepositar="daysEmployee?.netoMensual || 0"
                  />
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <PayrollPaymentDetailsDialog
      v-model="detailDialog.open"
      :loading="detailDialog.loading"
      :payment="detailDialog.payment"
    />

    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import moment from "moment";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import PayrollPaymentDetailsDialog from "src/components/reports/payroll/history/PayrollPaymentDetailsDialog.vue";
import TableReportsNominaSingle from "src/components/reports/TableReportsNominaSingle.vue";
import { authStore } from "src/stores/auth-store";

defineOptions({
  name: "MyPayrollPage",
});

const auth = authStore();
const route = useRoute();
const notify = ref(null);

const ENDPOINTS = {
  myPayments: "payroll/getMyPayments",
  paymentDetail: (id) => `payroll/payment/${id}`,
  myDaysSummary: "punch/obtenerResumenMensualEmpleado",
};

const tab = ref("payments");

const payments = ref([]);
const loadingPayments = ref(false);
const searchText = ref("");
const paymentsLimit = ref(10);
const paymentsPage = ref(1);

const paymentsMeta = reactive({
  totalCount: 0,
  totalPages: 1,
});

const detailDialog = reactive({
  open: false,
  loading: false,
  payment: null,
});

const loadingDays = ref(false);

const daysFilters = reactive({
  fechaInicio: moment().startOf("month").format("YYYY-MM-DD"),
  fechaFin: moment().endOf("month").format("YYYY-MM-DD"),
});

const daysEmployee = ref(null);
const daysRows = ref([]);
const daysAutoLoaded = ref(false);

const paymentCols = computed(() => [
  {
    name: "period",
    label: "Período",
    align: "left",
    field: "period",
  },
  {
    name: "gross",
    label: "Bruto",
    align: "right",
    field: (row) => getPaymentGross(row),
    sortable: true,
  },
  {
    name: "ded",
    label: "Deducciones",
    align: "right",
    field: (row) => getPaymentDeductions(row),
    sortable: true,
  },
  {
    name: "net",
    label: "Neto",
    align: "right",
    field: (row) => getPaymentNet(row),
    sortable: true,
  },
  {
    name: "emailed",
    label: "Volante",
    align: "left",
    field: (row) => paymentEmailLabel(row),
  },
  {
    name: "actions",
    label: "",
    align: "right",
    field: "actions",
    style: "width: 70px",
  },
]);

const paymentsSummary = computed(() => {
  return payments.value.reduce(
    (acc, payment) => {
      acc.gross += getPaymentGross(payment);
      acc.deductions += getPaymentDeductions(payment);
      acc.net += getPaymentNet(payment);

      if (payment?.emailedAt) {
        acc.emailed += 1;
      }

      return acc;
    },
    {
      gross: 0,
      deductions: 0,
      net: 0,
      emailed: 0,
    },
  );
});

const clearPaymentFilters = () => {
  searchText.value = "";
  paymentsLimit.value = 10;
  paymentsPage.value = 1;
  loadPayments(true);
};

const clearSearch = () => {
  searchText.value = "";
  loadPayments(true);
};

const loadPayments = async (resetPage = false) => {
  try {
    loadingPayments.value = true;

    if (resetPage) {
      paymentsPage.value = 1;
    }

    const limit = Number(paymentsLimit.value || 10);
    const page = Number(paymentsPage.value || 1);
    const initial = Math.max(0, (page - 1) * limit);
    const q = String(searchText.value || "").trim();

    const url =
      ENDPOINTS.myPayments +
      `?limit=${encodeURIComponent(String(limit))}` +
      `&initial=${encodeURIComponent(String(initial))}` +
      (q ? `&q=${encodeURIComponent(q)}` : "");

    const resp = await methodsHttp.getApi(url);

    if (resp?.ok) {
      payments.value = Array.isArray(resp.payments) ? resp.payments : [];

      paymentsMeta.totalCount = Number(
        resp.totalCount || payments.value.length || 0,
      );

      paymentsMeta.totalPages =
        Number(resp.totalPages || 0) ||
        Math.max(1, Math.ceil(paymentsMeta.totalCount / limit));

      if (route.query.id) {
        const payment = payments.value.find((item) => item._id === route.query.id);

        if (payment) {
          openPaymentDetail(payment);
        }
      }
    } else {
      payments.value = [];
      paymentsMeta.totalCount = 0;
      paymentsMeta.totalPages = 1;

      notify.value?.notify?.(
        "negative",
        resp?.mensaje || "No se pudo cargar tus pagos.",
      );
    }
  } catch (error) {
    console.error("loadPayments error:", error);

    payments.value = [];
    paymentsMeta.totalCount = 0;
    paymentsMeta.totalPages = 1;

    notify.value?.notify?.("negative", "Error cargando tus pagos.");
  } finally {
    loadingPayments.value = false;
  }
};

const openPaymentDetail = async (row) => {
  detailDialog.open = true;
  detailDialog.payment = row || null;

  const id = row?._id;

  if (!id) return;

  try {
    detailDialog.loading = true;

    const resp = await methodsHttp.getApi(ENDPOINTS.paymentDetail(id));

    if (resp?.ok && resp.payment) {
      detailDialog.payment = resp.payment;
    }
  } catch (error) {
    console.error("openPaymentDetail error:", error);
  } finally {
    detailDialog.loading = false;
  }
};

const loadDays = async () => {
  try {
    loadingDays.value = true;

    const body = {
      fechaInicio: daysFilters.fechaInicio,
      fechaFin: daysFilters.fechaFin,
      userId: auth.user._id,
    };

    const resp = await methodsHttp.postApi(ENDPOINTS.myDaysSummary, body);

    if (resp?.ok) {
      const emp =
        resp.employee ||
        (Array.isArray(resp.employees) ? resp.employees[0] : null) ||
        null;

      daysEmployee.value = emp
        ? {
            _id: emp.userId || emp?._id,
            name: emp.name,
            img: emp.img || emp.image || "",
            email: emp.email || emp.username || "",
            salaryCode: emp.salaryCode,
            netoMensual: emp.netoMensual,
            netoPeriodoBase: emp.netoPeriodoBase,
            totalDiscounts: emp.totalDiscounts,
            totalWorkedMinutes: emp.totalWorkedMinutes,
            netoADepositar: emp.netoADepositar,
          }
        : null;

      daysRows.value = Array.isArray(emp?.dias) ? emp.dias : [];
    } else {
      daysEmployee.value = null;
      daysRows.value = [];

      notify.value?.notify?.(
        "negative",
        resp?.mensaje || "No se pudo cargar tus días.",
      );
    }
  } catch (error) {
    console.error("loadDays error:", error);

    daysEmployee.value = null;
    daysRows.value = [];

    notify.value?.notify?.("negative", "Error cargando tus días.");
  } finally {
    loadingDays.value = false;
  }
};

const openDayDetails = (row) => {
  console.log("Día:", row);
};

const refreshCurrentTab = () => {
  if (tab.value === "payments") {
    return loadPayments(false);
  }

  return loadDays();
};

const getPaymentGross = (payment) => {
  return Number(
    payment?.snapshot?.totals?.sueldoBrutoPeriodo ??
      payment?.grossPeriod ??
      payment?.totals?.grossPeriod ??
      0,
  );
};

const getPaymentNet = (payment) => {
  return Number(
    payment?.snapshot?.totals?.sueldoNetoPeriodo ??
      payment?.netPeriod ??
      payment?.totals?.netPeriod ??
      0,
  );
};

const getPaymentDeductions = (payment) => {
  return Number(
    payment?.snapshot?.totals?.totalDeduccionesPeriodo ??
      payment?.totalDeductionsPeriod ??
      payment?.totals?.totalDeductionsPeriod ??
      0,
  );
};

const getPaymentPeriod = (payment) => {
  const start = payment?.snapshot?.period?.start || payment?.periodStart || "—";
  const end = payment?.snapshot?.period?.end || payment?.periodEnd || "—";

  return `${start} → ${end}`;
};

const getPaymentPayDate = (payment) => {
  const date = payment?.snapshot?.period?.payDate || payment?.payDate || "";

  return date ? formatDate(date) : "—";
};

const paymentEmailLabel = (payment) => {
  const status = String(payment?.emailStatus || "").toUpperCase();

  if (payment?.emailError || status === "EMAIL_FAILED") return "Fallido";
  if (payment?.emailedAt || status === "EMAILED") return "Enviado";

  return "Pendiente";
};

const paymentEmailColor = (payment) => {
  const label = paymentEmailLabel(payment);

  if (label === "Enviado") return "positive";
  if (label === "Fallido") return "negative";

  return "grey-7";
};

const paymentEmailIcon = (payment) => {
  const label = paymentEmailLabel(payment);

  if (label === "Enviado") return "check_circle";
  if (label === "Fallido") return "error";

  return "schedule_send";
};

const formatDate = (date) => {
  if (!date) return "—";

  return moment(date).format("YYYY/MM/DD");
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

watch(
  () => tab.value,
  (currentTab) => {
    if (currentTab === "days" && !daysAutoLoaded.value) {
      daysAutoLoaded.value = true;
      loadDays();
    }
  },
);

onMounted(() => {
  loadPayments(true);
});
</script>

<style scoped>
.my-payroll-page {
  min-height: 100%;
}

.main-card,
.filters-card,
.table-card {
  border-radius: 18px;
  border: 1px solid #e8edf5;
  background: #ffffff;
}

.main-card {
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.tabs-wrapper {
  background: #f8fafc;
}

.main-tabs {
  padding: 8px;
}

.tab-panels {
  background: #ffffff;
}

.metric-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-height: 112px;
  padding: 18px;
  border: 1px solid #e8edf5;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.metric-card.highlight {
  border-color: rgba(33, 186, 69, 0.25);
  background: linear-gradient(135deg, rgba(33, 186, 69, 0.08), #ffffff);
}

.metric-icon {
  display: flex;
  flex: 0 0 46px;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  font-size: 22px;
}

.metric-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value {
  margin-top: 3px;
  font-size: 20px;
  font-weight: 800;
  color: #111827;
  line-height: 1.25;
}

.metric-caption {
  margin-top: 4px;
  font-size: 12px;
  color: #7b8794;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;
  color: #1f2937;
}

.section-subtitle {
  margin-top: 3px;
  font-size: 13px;
  color: #64748b;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 12px;
}

.action-btn {
  border-radius: 10px;
}

.results-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid #e8edf5;
  border-radius: 12px;
  background: #f8fafc;
}

.results-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.results-value {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
}

.table-card {
  overflow: hidden;
}

.table-card :deep(.q-table thead tr th) {
  font-size: 12px;
  font-weight: 800;
  color: #475569;
  background: #f8fafc;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.table-card :deep(.q-table tbody tr:hover) {
  background: #f8fafc;
}

.payment-row {
  transition: background 0.2s ease;
}

.amount-text {
  font-size: 14px;
  font-weight: 800;
  color: #111827;
}

.status-badge {
  min-height: 26px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: none;
}

.pagination-caption {
  font-size: 13px;
  color: #64748b;
}

.days-info-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 40px;
  padding: 12px 14px;
  border: 1px solid #e8edf5;
  border-radius: 14px;
  background: #f8fafc;
}

.days-info-title {
  font-size: 13px;
  font-weight: 800;
  color: #1f2937;
}

.days-info-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: #64748b;
}

.loading-box {
  padding: 20px;
  border: 1px dashed #d7deea;
  border-radius: 16px;
  background: #f8fafc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: 32px;
  text-align: center;
}

.empty-state.bordered {
  border: 1px dashed #d7deea;
  border-radius: 18px;
  background: #f8fafc;
}

.empty-title {
  margin-top: 14px;
  font-size: 18px;
  font-weight: 800;
  color: #1f2937;
}

.empty-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.min-width-0 {
  min-width: 0;
}

@media (max-width: 600px) {
  .metric-card {
    min-height: auto;
  }

  .metric-value {
    font-size: 18px;
  }

  .main-tabs {
    overflow-x: auto;
  }
}
</style>