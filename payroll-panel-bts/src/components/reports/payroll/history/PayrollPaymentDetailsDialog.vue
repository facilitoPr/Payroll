<template>
  <AppBaseDialog
    v-model="open"
    title="Detalle del pago"
    :subtitle="dialogSubtitle"
    icon="payments"
    :loading="loading"
    loading-label="Cargando detalle..."
    width="1120px"
    max-width="98vw"
    body-class="payment-details-body"
  >
    <div v-if="!payment && !loading" class="empty-state">
      <q-avatar size="64px" color="grey-2" text-color="grey-7">
        <q-icon name="info" size="34px" />
      </q-avatar>

      <div class="empty-title">No se pudo cargar el detalle</div>
      <div class="empty-subtitle">
        Intenta cerrar este modal y volver a abrir el pago.
      </div>
    </div>

    <div v-else class="payment-details-shell">
      <q-card flat bordered class="employee-hero-card q-mb-md">
        <q-card-section class="q-pa-md">
          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-md">
              <div class="row items-center no-wrap">
                <q-avatar size="58px" class="employee-avatar q-mr-md">
                  <q-img :src="employeeAvatar" />
                </q-avatar>

                <div class="min-width-0">
                  <div class="hero-label">Empleado</div>

                  <div class="hero-title ellipsis">
                    {{ employeeName }}
                  </div>

                  <div class="hero-subtitle ellipsis">
                    <q-icon name="mail" size="16px" class="q-mr-xs" />
                    {{ employeeEmail }}
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-md-auto">
              <div class="row q-gutter-sm justify-start justify-md-end">
                <q-badge :color="emailStatusColor" class="status-badge">
                  <q-icon :name="emailStatusIcon" size="14px" class="q-mr-xs" />
                  {{ emailStatusLabel }}
                </q-badge>

                <q-badge color="blue-grey-1" text-color="blue-grey-9" class="status-badge">
                  <q-icon name="event" size="14px" class="q-mr-xs" />
                  {{ payDateLabel }}
                </q-badge>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <div class="metric-card">
            <div class="metric-icon bg-primary text-white">
              <q-icon name="date_range" />
            </div>

            <div class="metric-content">
              <div class="metric-label">Período</div>
              <div class="metric-value small">
                {{ periodStartLabel }} → {{ periodEndLabel }}
              </div>
              <div class="metric-caption">Fecha de pago: {{ payDateLabel }}</div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="metric-card">
            <div class="metric-icon bg-blue text-white">
              <q-icon name="stacked_line_chart" />
            </div>

            <div class="metric-content">
              <div class="metric-label">Bruto</div>
              <div class="metric-value">
                {{ formatCurrencySafe(totalGross) }}
              </div>
              <div class="metric-caption">Total devengado</div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="metric-card">
            <div class="metric-icon bg-negative text-white">
              <q-icon name="remove_circle" />
            </div>

            <div class="metric-content">
              <div class="metric-label">Deducciones</div>
              <div class="metric-value">
                {{ formatCurrencySafe(totalDeductions) }}
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

            <div class="metric-content">
              <div class="metric-label">Neto</div>
              <div class="metric-value text-positive">
                {{ formatCurrencySafe(totalNet) }}
              </div>
              <div class="metric-caption">A depositar</div>
            </div>
          </div>
        </div>
      </div>

      <q-card flat bordered class="tabs-card q-mb-md">
        <q-tabs
          v-model="tab"
          dense
          no-caps
          align="left"
          class="details-tabs"
          active-color="primary"
          indicator-color="primary"
        >
          <q-tab name="summary" icon="dashboard" label="Resumen" />
          <q-tab name="earnings" icon="add_circle" label="Ingresos" />
          <q-tab name="legal" icon="gavel" label="Deducciones" />
          <q-tab name="other" icon="remove_circle" label="Otras deducciones" />
          <q-tab
            v-if="loanPaymentRows.length"
            name="loans"
            icon="account_balance"
            label="Préstamos"
          />
          <q-tab name="days" icon="calendar_month" label="Detalle de días" />
        </q-tabs>
      </q-card>

      <q-tab-panels v-model="tab" animated class="tab-panels">
        <q-tab-panel name="summary" class="q-pa-none">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-5">
              <q-card flat bordered class="panel-card full-height">
                <q-card-section class="q-pa-md">
                  <div class="section-title">
                    <q-icon name="person" color="primary" size="20px" />
                    Información del pago
                  </div>

                  <div class="section-subtitle q-mb-md">
                    Datos principales del empleado, período y estado del volante.
                  </div>

                  <q-list separator>
                    <q-item class="info-row">
                      <q-item-section avatar>
                        <q-icon name="badge" color="primary" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label caption>Empleado</q-item-label>
                        <q-item-label>{{ employeeName }}</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item class="info-row">
                      <q-item-section avatar>
                        <q-icon name="mail" color="primary" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label caption>Correo</q-item-label>
                        <q-item-label>{{ employeeEmail }}</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item class="info-row">
                      <q-item-section avatar>
                        <q-icon name="date_range" color="primary" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label caption>Período trabajado</q-item-label>
                        <q-item-label>
                          {{ periodStartLabel }} → {{ periodEndLabel }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item class="info-row">
                      <q-item-section avatar>
                        <q-icon name="event_available" color="primary" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label caption>Fecha de pago</q-item-label>
                        <q-item-label>{{ payDateLabel }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-7">
              <q-card flat bordered class="panel-card full-height">
                <q-card-section class="q-pa-md">
                  <div class="section-title">
                    <q-icon name="receipt_long" color="primary" size="20px" />
                    Resumen monetario
                  </div>

                  <div class="section-subtitle q-mb-md">
                    Desglose general del pago calculado para este período.
                  </div>

                  <div class="money-breakdown">
                    <div class="money-row">
                      <div>
                        <div class="money-label">Bruto del período</div>
                        <div class="money-caption">Total antes de deducciones</div>
                      </div>

                      <div class="money-value">
                        {{ formatCurrencySafe(totalGross) }}
                      </div>
                    </div>

                    <div class="money-row">
                      <div>
                        <div class="money-label">Total deducciones</div>
                        <div class="money-caption">Legales, ISR y otras deducciones</div>
                      </div>

                      <div class="money-value text-negative">
                        {{ formatCurrencySafe(totalDeductions) }}
                      </div>
                    </div>

                    <div class="money-row">
                      <div>
                        <div class="money-label">ISR del período</div>
                        <div class="money-caption">Impuesto sobre la renta calculado</div>
                      </div>

                      <div class="money-value">
                        {{ formatCurrencySafe(isrPeriod) }}
                      </div>
                    </div>

                    <q-separator />

                    <div class="money-row total">
                      <div>
                        <div class="money-label">Neto a depositar</div>
                        <div class="money-caption">Monto final para el empleado</div>
                      </div>

                      <div class="money-value text-positive">
                        {{ formatCurrencySafe(totalNet) }}
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div v-if="loanPaymentRows.length" class="col-12">
              <q-card flat bordered class="panel-card loan-summary-card">
                <q-card-section class="q-pa-md">
                  <div class="section-title">
                    <q-icon name="account_balance" color="primary" size="20px" />
                    Distribución por préstamo
                  </div>

                  <div class="section-subtitle q-mb-md">
                    Parte del neto del empleado fue retenida y aplicada a su préstamo.
                  </div>

                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-4">
                      <div class="mini-stat">
                        <q-icon name="payments" color="positive" size="26px" />

                        <div>
                          <div class="mini-stat-label">Al empleado</div>
                          <div class="mini-stat-value">
                            {{ formatCurrencySafe(employeeNetAfterLoan) }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="mini-stat">
                        <q-icon name="account_balance" color="primary" size="26px" />

                        <div>
                          <div class="mini-stat-label">A préstamo</div>
                          <div class="mini-stat-value">
                            {{ formatCurrencySafe(totalEmployeeLoanDeductions) }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="mini-stat">
                        <q-icon name="receipt_long" color="grey-7" size="26px" />

                        <div>
                          <div class="mini-stat-label">Neto original</div>
                          <div class="mini-stat-value">
                            {{ formatCurrencySafe(employeeNetBeforeLoan) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12">
              <q-card flat bordered class="panel-card">
                <q-card-section class="q-pa-md">
                  <div class="section-title">
                    <q-icon name="mark_email_read" color="primary" size="20px" />
                    Estado del correo
                  </div>

                  <div class="section-subtitle q-mb-md">
                    Verifica si el volante fue enviado correctamente al empleado.
                  </div>

                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-4">
                      <div class="mini-stat">
                        <q-icon :name="emailStatusIcon" :color="emailStatusColor" size="26px" />

                        <div>
                          <div class="mini-stat-label">Estado</div>
                          <div class="mini-stat-value">{{ emailStatusLabel }}</div>
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-sm-4">
                      <div class="mini-stat">
                        <q-icon name="schedule" color="grey-7" size="26px" />

                        <div>
                          <div class="mini-stat-label">Enviado en</div>
                          <div class="mini-stat-value">
                            {{ emailedAtLabel }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-sm-4">
                      <div class="mini-stat">
                        <q-icon
                          :name="payment?.emailError ? 'warning' : 'check_circle'"
                          :color="payment?.emailError ? 'negative' : 'positive'"
                          size="26px"
                        />

                        <div>
                          <div class="mini-stat-label">Resultado</div>
                          <div class="mini-stat-value">
                            {{ payment?.emailError ? "Con error" : "Sin error" }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <q-banner
                    v-if="payment?.emailError"
                    rounded
                    class="bg-red-1 text-negative q-mt-md"
                  >
                    <template #avatar>
                      <q-icon name="warning" color="negative" />
                    </template>

                    {{ payment.emailError }}
                  </q-banner>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="earnings" class="q-pa-none">
          <q-card flat bordered class="panel-card">
            <q-card-section class="q-pa-md">
              <div class="row items-center justify-between q-col-gutter-md q-mb-md">
                <div class="col-12 col-md">
                  <div class="section-title">
                    <q-icon name="add_circle" color="positive" size="20px" />
                    Ingresos
                  </div>

                  <div class="section-subtitle">
                    Conceptos que suman al salario del empleado en este período.
                  </div>
                </div>

                <div class="col-12 col-md-auto">
                  <q-badge color="positive" class="status-badge">
                    Total: {{ formatCurrencySafe(earningsTotal) }}
                  </q-badge>
                </div>
              </div>

              <q-table
                :rows="earningsRows"
                :columns="earningCols"
                row-key="nombre"
                flat
                bordered
                dense
                class="details-table"
                :rows-per-page-options="[10, 25, 50, 0]"
                no-data-label="No hay ingresos registrados."
              />
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <q-tab-panel name="legal" class="q-pa-none">
          <q-card flat bordered class="panel-card">
            <q-card-section class="q-pa-md">
              <div class="row items-center justify-between q-col-gutter-md q-mb-md">
                <div class="col-12 col-md">
                  <div class="section-title">
                    <q-icon name="gavel" color="negative" size="20px" />
                    Deducciones legales
                  </div>

                  <div class="section-subtitle">
                    Deducciones obligatorias aplicadas al pago del empleado.
                  </div>
                </div>

                <div class="col-12 col-md-auto">
                  <q-badge color="negative" class="status-badge">
                    Total: {{ formatCurrencySafe(legalDeductionsTotal) }}
                  </q-badge>
                </div>
              </div>

              <q-table
                :rows="legalDeductionsRows"
                :columns="dedCols"
                row-key="nombre"
                flat
                bordered
                dense
                class="details-table"
                :rows-per-page-options="[10, 25, 50, 0]"
                no-data-label="No hay deducciones legales registradas."
              />
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <q-tab-panel name="other" class="q-pa-none">
          <q-card flat bordered class="panel-card">
            <q-card-section class="q-pa-md">
              <div class="row items-center justify-between q-col-gutter-md q-mb-md">
                <div class="col-12 col-md">
                  <div class="section-title">
                    <q-icon name="remove_circle" color="warning" size="20px" />
                    Otras deducciones
                  </div>

                  <div class="section-subtitle">
                    Descuentos adicionales aplicados fuera de las deducciones legales.
                  </div>
                </div>

                <div class="col-12 col-md-auto">
                  <q-badge color="warning" class="status-badge">
                    Total: {{ formatCurrencySafe(otherDeductionsTotal) }}
                  </q-badge>
                </div>
              </div>

              <q-table
                :rows="otherDeductionsRows"
                :columns="dedCols"
                row-key="nombre"
                flat
                bordered
                dense
                class="details-table"
                :rows-per-page-options="[10, 25, 50, 0]"
                no-data-label="No hay otras deducciones registradas."
              />
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <q-tab-panel v-if="loanPaymentRows.length" name="loans" class="q-pa-none">
          <q-card flat bordered class="panel-card">
            <q-card-section class="q-pa-md">
              <div class="row items-center justify-between q-col-gutter-md q-mb-md">
                <div class="col-12 col-md">
                  <div class="section-title">
                    <q-icon name="account_balance" color="primary" size="20px" />
                    Pagos aplicados a préstamos
                  </div>

                  <div class="section-subtitle">
                    Cuotas retenidas del neto del empleado y pagadas al prestamista.
                  </div>
                </div>

                <div class="col-12 col-md-auto">
                  <q-badge color="primary" class="status-badge">
                    Total: {{ formatCurrencySafe(totalEmployeeLoanDeductions) }}
                  </q-badge>
                </div>
              </div>

              <q-table
                :rows="loanPaymentRows"
                :columns="loanCols"
                row-key="id"
                flat
                bordered
                dense
                class="details-table"
                :rows-per-page-options="[10, 25, 50, 0]"
                no-data-label="No hay pagos a préstamos registrados."
              />
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <q-tab-panel name="days" class="q-pa-none">
          <q-card flat bordered class="panel-card">
            <q-card-section class="q-pa-md">
              <div class="section-title">
                <q-icon name="calendar_month" color="primary" size="20px" />
                Detalle de días
              </div>

              <div class="section-subtitle q-mb-md">
                Revisión de asistencia, horas trabajadas y cálculo diario del período.
              </div>

              <div v-if="daysLoading" class="loading-box">
                <q-linear-progress indeterminate color="primary" />
                <div class="text-caption text-grey-7 q-mt-sm">
                  Cargando días del período...
                </div>
              </div>

              <div v-else>
                <q-banner
                  v-if="attendanceCompatibilityNotice"
                  rounded
                  class="bg-blue-1 text-blue-10 q-mb-md"
                >
                  <template #avatar>
                    <q-icon name="info" color="primary" />
                  </template>

                  {{ attendanceCompatibilityNotice }}
                </q-banner>

                <table-reports-nomina-single
                  :item="employeeItem"
                  :rows="daysRows"
                  :fechaInicio="filtros.fechaInicio"
                  :fechaFin="filtros.fechaFin"
                  :openModal="() => {}"
                  :netoADepositar="employeeItem?.netoADepositar || 0"
                  :viewOnly="true"
                />
              </div>
            </q-card-section>
          </q-card>
        </q-tab-panel>
      </q-tab-panels>
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
    </template>
  </AppBaseDialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import moment from "moment";
import { formatCurrency, formatDateTime } from "app/utils";
import TableReportsNominaSingle from "../../TableReportsNominaSingle.vue";
import AppBaseDialog from "src/components/dialog/AppBaseDialog.vue";

defineOptions({
  name: "PayrollPaymentDetailsDialog",
});

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  payment: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue"]);

const fallbackAvatar =
  "https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/profile_avatar.png";

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const tab = ref("summary");

const employeeAgg = ref(null);
const daysRows = ref([]);
const daysLoading = ref(false);
const daysLoadedForPaymentId = ref("");

const filtros = computed(() => ({
  fechaInicio: props.payment?.snapshot?.period?.start || "",
  fechaFin: props.payment?.snapshot?.period?.end || "",
}));

const employeeName = computed(() => {
  return (
    props.payment?.employeeName ||
    props.payment?.snapshot?.employee?.name ||
    props.payment?.employee?.name ||
    props.payment?.user?.name ||
    "Empleado"
  );
});

const employeeEmail = computed(() => {
  return (
    props.payment?.employeeEmail ||
    props.payment?.snapshot?.employee?.email ||
    props.payment?.employee?.email ||
    props.payment?.user?.email ||
    "Sin correo"
  );
});

const employeeAvatar = computed(() => {
  return (
    props.payment?.user?.img ||
    props.payment?.user?.image ||
    props.payment?.employee?.img ||
    props.payment?.employee?.image ||
    props.payment?.snapshot?.employee?.img ||
    fallbackAvatar
  );
});

const dialogSubtitle = computed(() => {
  return `${employeeName.value} · ${employeeEmail.value}`;
});

const periodStart = computed(() => props.payment?.snapshot?.period?.start || "");
const periodEnd = computed(() => props.payment?.snapshot?.period?.end || "");
const payDate = computed(() => props.payment?.snapshot?.period?.payDate || "");

const periodStartLabel = computed(() => formatDate(periodStart.value));
const periodEndLabel = computed(() => formatDate(periodEnd.value));
const payDateLabel = computed(() => formatDate(payDate.value));

const snapshot = computed(() => props.payment?.snapshot || {});
const totals = computed(() => snapshot.value?.totals || {});
const isr = computed(() => snapshot.value?.isr || {});
const attendanceSnapshot = computed(() => snapshot.value?.attendance || {});
const snapshotAttendanceDays = computed(() => {
  return Array.isArray(attendanceSnapshot.value?.days)
    ? attendanceSnapshot.value.days
    : [];
});
const hasSnapshotAttendanceDays = computed(() => {
  return snapshotAttendanceDays.value.length > 0;
});
const attendanceCompatibilityNotice = computed(() => {
  if (daysLoading.value || hasSnapshotAttendanceDays.value) return "";

  const mode = attendanceSnapshot.value?.calculationMode || "FULL_PERIOD";

  if (mode === "FULL_PERIOD") {
    return "Este pago se conserva como período completo. No tiene un ledger diario guardado, por eso no se reconstruyen ponches históricos desde datos actuales.";
  }

  return "Este pago no tiene detalle diario guardado.";
});
const paymentDistribution = computed(() => {
  return snapshot.value?.paymentDistribution || {};
});

const totalGross = computed(() => {
  return toNum(totals.value?.sueldoBrutoPeriodo);
});

const totalDeductions = computed(() => {
  return toNum(totals.value?.totalDeduccionesPeriodo);
});

const totalNet = computed(() => {
  return toNum(totals.value?.sueldoNetoPeriodo);
});

const isrPeriod = computed(() => {
  return toNum(isr.value?.isrPeriodo);
});

const earningsRows = computed(() => {
  return Array.isArray(props.payment?.snapshot?.earnings)
    ? props.payment.snapshot.earnings
    : [];
});

const legalDeductionsRows = computed(() => {
  return Array.isArray(props.payment?.snapshot?.legalDeductions)
    ? props.payment.snapshot.legalDeductions
    : [];
});

const otherDeductionsRows = computed(() => {
  return Array.isArray(props.payment?.snapshot?.otherDeductions)
    ? props.payment.snapshot.otherDeductions
    : [];
});

const earningsTotal = computed(() => {
  return sumRowsByPeriodAmount(earningsRows.value);
});

const legalDeductionsTotal = computed(() => {
  return sumRowsByPeriodAmount(legalDeductionsRows.value);
});

const otherDeductionsTotal = computed(() => {
  return sumRowsByPeriodAmount(otherDeductionsRows.value);
});

const loanPaymentRows = computed(() => {
  const rows = Array.isArray(snapshot.value?.employeeLoanDeductions)
    ? snapshot.value.employeeLoanDeductions
    : [];

  return rows.map((row, index) => {
    const thirdPartyPayment = row?.thirdPartyPayment || {};
    const bank =
      row?.bankAccountSnapshot ||
      thirdPartyPayment?.bankAccountSnapshot ||
      {};

    return {
      id: [
        row?.loanRequest || row?.requestNumber || "loan",
        row?.installmentNumber || index,
      ].join("-"),
      requestNumber: row?.requestNumber || "—",
      installmentNumber: row?.installmentNumber || "—",
      dueDate: row?.dueDate || null,
      productName: row?.productName || row?.productCode || "Préstamo",
      beneficiaryName: bank?.beneficiaryName || "Prestamista",
      bankName: bank?.bankName || "—",
      accountNumber: bank?.accountNumber || "—",
      principalAmount: toNum(row?.principalAmount),
      interestAmount: toNum(row?.interestAmount),
      amount: toNum(row?.amount || thirdPartyPayment?.amount),
    };
  });
});

const totalEmployeeLoanDeductions = computed(() => {
  const fromRows = loanPaymentRows.value.reduce((sum, row) => {
    return sum + toNum(row?.amount);
  }, 0);
  const fromDistribution = toNum(
    paymentDistribution.value?.employeeLoanDeductionsTotal,
    -1,
  );

  return fromDistribution > 0 ? fromDistribution : fromRows;
});

const employeeNetAfterLoan = computed(() => {
  return toNum(paymentDistribution.value?.employeeNetToDeposit, totalNet.value);
});

const employeeNetBeforeLoan = computed(() => {
  return toNum(
    paymentDistribution.value?.employeeNetBeforeEmployeeLoan,
    employeeNetAfterLoan.value + totalEmployeeLoanDeductions.value,
  );
});

const emailStatusLabel = computed(() => {
  const status = String(props.payment?.emailStatus || "").toUpperCase();

  if (props.payment?.emailError || status === "EMAIL_FAILED") return "Fallido";
  if (props.payment?.emailedAt || status === "EMAILED") return "Enviado";

  return "Pendiente";
});

const emailStatusColor = computed(() => {
  if (emailStatusLabel.value === "Enviado") return "positive";
  if (emailStatusLabel.value === "Fallido") return "negative";

  return "grey-7";
});

const emailStatusIcon = computed(() => {
  if (emailStatusLabel.value === "Enviado") return "check_circle";
  if (emailStatusLabel.value === "Fallido") return "error";

  return "schedule_send";
});

const emailedAtLabel = computed(() => {
  return props.payment?.emailedAt ? formatDateTimeSafe(props.payment.emailedAt) : "—";
});

const employeeItem = computed(() => {
  if (employeeAgg.value) {
    return {
      _id: employeeAgg.value.userId || employeeAgg.value._id || "",
      name: employeeAgg.value.name || "Empleado",
      email: employeeAgg.value.email || employeeAgg.value.username || "—",
      username: employeeAgg.value.username || "",
      img: employeeAgg.value.img || employeeAgg.value.image || "",
      salaryCode: employeeAgg.value.salaryCode || "",
      netoPeriodoBase: Number(employeeAgg.value.netoPeriodoBase || 0),
      totalDiscounts: Number(employeeAgg.value.totalDiscounts || 0),
      netoADepositar: Number(employeeAgg.value.netoADepositar || 0),
      totalWorkedMinutes: Number(employeeAgg.value.totalWorkedMinutes || 0),
      totalLateMinutes: Number(employeeAgg.value.totalLateMinutes || 0),
    };
  }

  return {
    _id:
      props.payment?.user?._id ||
      props.payment?.user ||
      props.payment?.snapshot?.employee?.userId ||
      props.payment?.snapshot?.employee?._id ||
      "",
    name: employeeName.value,
    email: employeeEmail.value,
    img: employeeAvatar.value,
    salaryCode: "",
    netoPeriodoBase: 0,
    totalDiscounts: 0,
    netoADepositar: 0,
    totalWorkedMinutes: 0,
    totalLateMinutes: 0,
  };
});

const earningCols = [
  {
    name: "nombre",
    label: "Nombre",
    field: "nombre",
    align: "left",
  },
  {
    name: "montoPeriodo",
    label: "Monto período",
    field: "montoPeriodo",
    align: "right",
    sortable: true,
    format: (v) => formatCurrencySafe(v),
  },
  {
    name: "montoMensual",
    label: "Monto mensual",
    field: "montoMensual",
    align: "right",
    sortable: true,
    format: (v) => formatCurrencySafe(v),
  },
];

const dedCols = [
  {
    name: "nombre",
    label: "Nombre",
    field: "nombre",
    align: "left",
  },
  {
    name: "montoPeriodo",
    label: "Monto período",
    field: "montoPeriodo",
    align: "right",
    sortable: true,
    format: (v) => formatCurrencySafe(v),
  },
  {
    name: "montoMensual",
    label: "Monto mensual",
    field: "montoMensual",
    align: "right",
    sortable: true,
    format: (v) => formatCurrencySafe(v),
  },
];

const loanCols = [
  {
    name: "requestNumber",
    label: "Solicitud",
    field: "requestNumber",
    align: "left",
    sortable: true,
  },
  {
    name: "installmentNumber",
    label: "Cuota",
    field: "installmentNumber",
    align: "center",
    sortable: true,
  },
  {
    name: "dueDate",
    label: "Vence",
    field: "dueDate",
    align: "left",
    sortable: true,
    format: (v) => formatDate(v),
  },
  {
    name: "productName",
    label: "Producto",
    field: "productName",
    align: "left",
  },
  {
    name: "beneficiaryName",
    label: "Beneficiario",
    field: "beneficiaryName",
    align: "left",
  },
  {
    name: "bankName",
    label: "Banco",
    field: "bankName",
    align: "left",
  },
  {
    name: "accountNumber",
    label: "Cuenta",
    field: "accountNumber",
    align: "left",
  },
  {
    name: "principalAmount",
    label: "Capital",
    field: "principalAmount",
    align: "right",
    sortable: true,
    format: (v) => formatCurrencySafe(v),
  },
  {
    name: "interestAmount",
    label: "Interés",
    field: "interestAmount",
    align: "right",
    sortable: true,
    format: (v) => formatCurrencySafe(v),
  },
  {
    name: "amount",
    label: "Aplicado",
    field: "amount",
    align: "right",
    sortable: true,
    format: (v) => formatCurrencySafe(v),
  },
];

const toNum = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const sumRowsByPeriodAmount = (rows = []) => {
  return rows.reduce((sum, row) => {
    return sum + toNum(row?.montoPeriodo);
  }, 0);
};

const formatCurrencySafe = (value) => {
  try {
    return formatCurrency(Number(value || 0));
  } catch (_) {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }
};

const formatDateTimeSafe = (value) => {
  if (!value) return "—";

  try {
    return formatDateTime(value);
  } catch (_) {
    return new Date(value).toLocaleString("es-DO");
  }
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = moment(value);

  if (!date.isValid()) return String(value);

  return date.format("YYYY/MM/DD");
};

const getPaymentUserId = () => {
  return (
    props.payment?.user?._id ||
    props.payment?.user ||
    props.payment?.snapshot?.employee?.userId ||
    props.payment?.snapshot?.employee?._id ||
    ""
  );
};

const buildEmployeeAggFromSnapshot = () => {
  const employee = snapshot.value?.employee || {};

  return {
    userId: getPaymentUserId(),
    name: employeeName.value,
    email: employeeEmail.value,
    username: employeeEmail.value,
    img: employeeAvatar.value,
    salaryCode: employee?.tipoSalario || "",
    netoPeriodoBase: toNum(
      totals.value?.sueldoNetoPeriodoBeforeEmployeeLoan,
      totals.value?.sueldoNetoPeriodo,
    ),
    totalDiscounts: toNum(totals.value?.totalDeduccionesPeriodo),
    netoADepositar: toNum(totals.value?.sueldoNetoPeriodo),
    totalWorkedMinutes: toNum(employee?.workedHoursPeriod) * 60,
    totalLateMinutes: toNum(attendanceSnapshot.value?.totals?.totalLateMinutes),
  };
};

const normalizeSnapshotDayRow = (day) => {
  const employee = snapshot.value?.employee || {};
  const paidMinutes =
    day?.paidMinutes ??
    day?.paidMinutesFixed ??
    day?.paidMinutesHourly ??
    day?.workedMinutes ??
    0;

  return {
    ...day,
    workSummary:
      day?.workSummary ||
      day?.workSummaryId ||
      `${props.payment?._id}-${day?.dateString || day?.date || ""}`,
    empleado: {
      _id: getPaymentUserId(),
      name: employeeName.value,
      email: employeeEmail.value,
      img: employeeAvatar.value,
    },
    date: day?.date || day?.dateString || "",
    dateString: day?.dateString || day?.date || "",
    classification:
      day?.classification ||
      day?.statusLabel ||
      day?.status ||
      "Trabajo regular",
    isPaid: true,
    confirmedToPay: true,
    workedMinutes: toNum(day?.workedMinutes),
    expectedMinutes: toNum(day?.expectedMinutes),
    approvedMinutes: toNum(day?.approvedMinutes),
    paidMinutes: toNum(paidMinutes),
    notWorkedMinutes: toNum(day?.notWorkedMinutes),
    payImpact: day?.payImpact || "",
    discountOverride: day?.discountOverride || "",
    descuentoTardanza: toNum(day?.descuentoTardanza || day?.lateDiscountAmount),
    descuentoAusencia: toNum(
      day?.descuentoAusencia || day?.absenceDiscountAmount,
    ),
    descuentoTotal: toNum(day?.descuentoTotal || day?.discountAmount),
    grossPayDay: toNum(day?.grossPayDay),
    punchSteps: Array.isArray(day?.punchSteps) ? day.punchSteps : [],
    missingSteps: Array.isArray(day?.missingSteps) ? day.missingSteps : [],
    isIncomplete: Boolean(day?.isIncomplete),
    autoClosedReason: day?.autoClosedReason || "",
    overrideReason: day?.overrideReason || "",
    approvedReason: day?.approvedReason || "",
    hourlyRate: toNum(day?.hourlyRate || employee?.hourlyRate),
  };
};

const loadDays = async () => {
  const paymentId = props.payment?._id;

  if (!paymentId) return;

  employeeAgg.value = buildEmployeeAggFromSnapshot();

  if (hasSnapshotAttendanceDays.value) {
    daysRows.value = snapshotAttendanceDays.value.map(normalizeSnapshotDayRow);
    daysLoadedForPaymentId.value = String(paymentId);
    return;
  }

  const userId = getPaymentUserId();
  const fechaInicio = filtros.value.fechaInicio;
  const fechaFin = filtros.value.fechaFin;

  if (!userId || !fechaInicio || !fechaFin) {
    daysRows.value = [];
    daysLoadedForPaymentId.value = String(paymentId);
    return;
  }

  daysRows.value = [];
  daysLoadedForPaymentId.value = String(paymentId);
};

watch(
  () => [open.value, tab.value, props.payment?._id],
  async ([isOpen, selectedTab, paymentId]) => {
    if (!isOpen) return;
    if (selectedTab !== "days") return;
    if (!paymentId) return;

    if (daysLoadedForPaymentId.value !== String(paymentId)) {
      await loadDays();
    }
  },
);

watch(
  () => props.payment?._id,
  () => {
    daysLoadedForPaymentId.value = "";
    daysRows.value = [];
    employeeAgg.value = null;
    tab.value = "summary";
  },
);
</script>

<style scoped>
.payment-details-shell {
  width: 100%;
}

.employee-hero-card,
.panel-card,
.tabs-card {
  border-radius: 18px;
  border: 1px solid #e8edf5;
  background: #ffffff;
}

.employee-hero-card {
  background:
    linear-gradient(135deg, rgba(34, 44, 91, 0.06), rgba(33, 158, 188, 0.06)),
    #ffffff;
}

.employee-avatar {
  /* border: 3px solid #ffffff; */
  /* box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12); */
}

.hero-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hero-title {
  font-size: 22px;
  font-weight: 800;
  color: #1f2937;
  line-height: 1.2;
}

.hero-subtitle {
  display: flex;
  align-items: center;
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.metric-card {
  position: relative;
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

.metric-content {
  min-width: 0;
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

.metric-value.small {
  font-size: 15px;
}

.metric-caption {
  margin-top: 4px;
  font-size: 12px;
  color: #7b8794;
}

.tabs-card {
  overflow: hidden;
}

.details-tabs {
  padding: 8px;
  background: #f8fafc;
}

.tab-panels {
  background: transparent;
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

.status-badge {
  min-height: 26px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: none;
}

.info-row {
  padding-left: 0;
  padding-right: 0;
}

.money-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.money-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  background: #f8fafc;
}

.money-row.total {
  border-color: rgba(33, 186, 69, 0.25);
  background: rgba(33, 186, 69, 0.06);
}

.money-label {
  font-size: 14px;
  font-weight: 800;
  color: #1f2937;
}

.money-caption {
  margin-top: 2px;
  font-size: 12px;
  color: #64748b;
}

.money-value {
  white-space: nowrap;
  font-size: 17px;
  font-weight: 800;
  color: #111827;
}

.mini-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 74px;
  padding: 14px;
  border: 1px solid #eef2f7;
  border-radius: 16px;
  background: #f8fafc;
}

.mini-stat-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mini-stat-value {
  margin-top: 2px;
  font-size: 14px;
  font-weight: 800;
  color: #111827;
}

.details-table {
  border-radius: 14px;
  overflow: hidden;
}

.details-table :deep(.q-table thead tr th) {
  font-size: 12px;
  font-weight: 800;
  color: #475569;
  background: #f8fafc;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.details-table :deep(.q-table tbody tr:hover) {
  background: #f8fafc;
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
  min-height: 260px;
  padding: 32px;
  text-align: center;
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

.action-btn {
  border-radius: 10px;
}

.min-width-0 {
  min-width: 0;
}

.full-height {
  height: 100%;
}

@media (max-width: 600px) {
  .hero-title {
    font-size: 18px;
  }

  .metric-card {
    min-height: auto;
  }

  .money-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .money-value {
    white-space: normal;
  }
}
</style>
