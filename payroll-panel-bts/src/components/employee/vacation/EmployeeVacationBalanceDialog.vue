<template>
  <q-dialog v-model="open" persistent>
    <q-card class="vacation-dialog column no-wrap">
      <q-inner-loading
        :showing="loading"
        label="Cargando balance de vacaciones..."
        label-class="text-primary"
        label-style="font-size: 1.05em"
        class="z-max"
      />

      <q-card-section
        class="dialog-header bg-primary row items-center justify-between"
      >
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon name="beach_access" size="30px" />
          </div>

          <div>
            <div class="dialog-title">Balance de vacaciones</div>
            <div class="dialog-subtitle">
              Consulta días acumulados, disfrutables, reservados, disponibles
              para préstamo y movimientos.
            </div>
          </div>
        </div>

        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          :disable="saving || recalculating"
          @click="closeModal"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="dialog-body">
        <!-- EMPLEADO -->
        <q-card flat bordered class="employee-card q-mb-md">
          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-md">
              <div class="row items-center no-wrap">
                <q-avatar size="58px" class="employee-avatar">
                  <q-img
                    v-if="employee?.img"
                    :src="employee.img"
                    fit="cover"
                    spinner-color="primary"
                  />

                  <span v-else>{{ getInitials(employee?.name) }}</span>
                </q-avatar>

                <div class="q-ml-md">
                  <div class="employee-name">
                    {{ employee?.name || "Empleado" }}
                  </div>

                  <div class="employee-meta">
                    {{ employee?.email || "Sin correo" }}
                  </div>

                  <div class="employee-meta">
                    {{ employee?.department?.name || "Sin departamento" }}

                    <span v-if="employee?.jobPosition?.name">
                      · {{ employee.jobPosition.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-md-4">
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm">
                  <q-select
                    v-model="year"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Año"
                    :options="yearOptions"
                    emit-value
                    map-options
                    @update:model-value="() => loadSummary()"
                  />
                </div>

                <div class="col-12 col-sm-auto">
                  <q-btn
                    v-if="canManage"
                    unelevated
                    rounded
                    no-caps
                    color="primary"
                    icon="calculate"
                    label="Recalcular"
                    class="full-width action-btn"
                    :loading="recalculating"
                    :disable="loading || saving"
                    @click="recalculateEmployeeBalance"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-card>

        <!-- MÉTRICAS PRINCIPALES -->
        <div class="row q-col-gutter-md q-mb-md">
          <div
            v-for="item in vacationMetricCards"
            :key="item.key"
            class="col-12 col-sm-6 col-md-3"
          >
            <q-card
              flat
              bordered
              class="metric-card metric-card-modern"
              :class="item.class"
            >
              <q-avatar class="metric-avatar" :class="item.avatarClass">
                <q-icon :name="item.icon" />
              </q-avatar>

              <div class="metric-content">
                <div class="metric-label">
                  {{ item.label }}
                </div>

                <div class="metric-value" :class="item.valueClass">
                  {{ formatDays(item.value) }}
                </div>

                <div class="metric-caption">
                  {{ item.caption }}
                </div>
              </div>
            </q-card>
          </div>
        </div>

        <!-- DETALLE DEL CÁLCULO -->
        <q-card flat bordered class="summary-card q-mb-md">
          <q-card-section>
            <div class="row items-center justify-between q-col-gutter-md q-mb-md">
              <div class="col-12 col-md">
                <div class="section-title">Detalle del cálculo</div>
                <div class="section-subtitle">
                  Información generada según la fecha de ingreso, política
                  aplicada y acumulación actual.
                </div>
              </div>

              <div class="col-12 col-md-auto">
                <div class="row q-gutter-sm">
                  <q-chip
                    dense
                    :color="canEnjoyVacations ? 'positive' : 'warning'"
                    text-color="white"
                    :icon="canEnjoyVacations ? 'check_circle' : 'schedule'"
                    class="summary-status-chip"
                  >
                    {{
                      canEnjoyVacations
                        ? "Puede disfrutar vacaciones"
                        : "Aún no cumple el año"
                    }}
                  </q-chip>

                  <q-chip
                    dense
                    :color="canUseVacationForLoan ? 'primary' : 'grey-7'"
                    text-color="white"
                    icon="account_balance_wallet"
                    class="summary-status-chip"
                  >
                    {{
                      canUseVacationForLoan
                        ? "Disponible para préstamo"
                        : "Sin balance para préstamo"
                    }}
                  </q-chip>
                </div>
              </div>
            </div>

            <div class="vacation-progress-box q-mb-md">
              <div class="row items-center justify-between q-mb-xs">
                <div class="text-caption text-weight-bold text-grey-8">
                  Antigüedad del empleado
                </div>

                <div class="text-caption text-weight-bold text-primary">
                  {{ serviceYears }} años · {{ serviceMonths }} meses
                </div>
              </div>

              <q-linear-progress
                rounded
                size="10px"
                color="primary"
                track-color="blue-grey-1"
                :value="serviceProgress"
              />

              <div class="text-caption text-grey-7 q-mt-sm">
                Progreso del primer año:
                <b>{{ Math.min(serviceMonths, 12) }} / 12 meses</b>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div
                v-for="item in vacationDetailItems"
                :key="item.label"
                class="col-12 col-sm-6 col-md-3"
              >
                <div class="detail-tile">
                  <q-avatar size="36px" class="detail-icon">
                    <q-icon :name="item.icon" size="19px" />
                  </q-avatar>

                  <div>
                    <div class="detail-label">
                      {{ item.label }}
                    </div>

                    <div class="detail-value">
                      {{ item.value }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-3">
                <div class="summary-label">Política aplicada</div>
                <div class="summary-value">
                  {{ balance?.policy?.name || "Sin política" }}
                </div>
              </div>

              <div class="col-12 col-md-3">
                <div class="summary-label">Ciclo actual</div>
                <div class="summary-value">
                  {{ vacationCycleLabel }}
                </div>
              </div>

              <div class="col-12 col-md-3">
                <div class="summary-label">Último cálculo</div>
                <div class="summary-value">
                  {{ lastCalculatedLabel }}
                </div>
              </div>

              <div class="col-12 col-md-3">
                <div class="summary-label">Override manual</div>

                <q-badge
                  rounded
                  :color="balance?.hasManualOverride ? 'warning' : 'positive'"
                  text-color="white"
                  :label="balance?.hasManualOverride ? 'Sí' : 'No'"
                  class="summary-badge"
                />
              </div>

              <div v-if="balance?.notes" class="col-12">
                <q-banner rounded class="bg-grey-2 text-grey-9">
                  <template #avatar>
                    <q-icon name="notes" color="primary" />
                  </template>

                  {{ balance.notes }}
                </q-banner>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- AJUSTE MANUAL -->
        <q-card v-if="canManage" flat bordered class="adjust-card q-mb-md">
          <q-card-section>
            <div class="row items-center justify-between q-col-gutter-md q-mb-md">
              <div class="col-12 col-md">
                <div class="section-title">Ajuste manual</div>
                <div class="section-subtitle">
                  Suma o resta días al balance del empleado. Luego puedes
                  recalcular para refrescar los datos.
                </div>
              </div>

              <div class="col-12 col-md-auto">
                <q-chip dense color="blue-1" text-color="primary" icon="info">
                  Usa negativo para restar
                </q-chip>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-3">
                <q-input
                  v-model.number="adjustmentForm.days"
                  type="number"
                  outlined
                  dense
                  rounded
                  color="primary"
                  label="Días"
                  placeholder="Ej: 2 o -1"
                />
              </div>

              <div class="col-12 col-md-7">
                <q-input
                  v-model="adjustmentForm.reason"
                  outlined
                  dense
                  rounded
                  color="primary"
                  label="Motivo del ajuste"
                  placeholder="Ej: Ajuste autorizado por RRHH"
                />
              </div>

              <div class="col-12 col-md-2">
                <q-btn
                  unelevated
                  rounded
                  no-caps
                  color="primary"
                  icon="save"
                  label="Aplicar"
                  class="full-width action-btn"
                  :loading="saving"
                  :disable="adjustDisabled"
                  @click="applyManualAdjustment"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- MOVIMIENTOS / RESERVAS -->
        <q-card flat bordered class="tabs-card">
          <q-tabs
            v-model="tab"
            dense
            align="left"
            indicator-color="primary"
            active-color="primary"
            class="text-grey-8"
          >
            <q-tab name="movements" icon="history" label="Movimientos" />
            <q-tab name="reservations" icon="lock" label="Reservas" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated class="bg-white">
            <q-tab-panel name="movements" class="q-pa-none">
              <q-table
                flat
                bordered
                row-key="_id"
                :rows="movements"
                :columns="movementColumns"
                :rows-per-page-options="[10]"
                hide-pagination
              >
                <template #body-cell-type="props">
                  <q-td :props="props">
                    <q-chip
                      dense
                      :color="getMovementColor(props.row.type)"
                      text-color="white"
                      class="text-weight-bold"
                    >
                      {{ getMovementLabel(props.row.type) }}
                    </q-chip>
                  </q-td>
                </template>

                <template #body-cell-days="props">
                  <q-td :props="props">
                    <span :class="getDaysClass(props.row.days)">
                      {{ Number(props.row.days) >= 0 ? "+" : "" }}
                      {{ numberValue(props.row.days) }}
                    </span>
                  </q-td>
                </template>

                <template #body-cell-previousAvailableDays="props">
                  <q-td :props="props">
                    {{ numberValue(props.row.previousAvailableDays) }}
                  </q-td>
                </template>

                <template #body-cell-newAvailableDays="props">
                  <q-td :props="props">
                    {{ numberValue(props.row.newAvailableDays) }}
                  </q-td>
                </template>

                <template #body-cell-createdAt="props">
                  <q-td :props="props">
                    {{ formatDateTime(props.row.createdAt) }}
                  </q-td>
                </template>

                <template #no-data>
                  <EmptyState
                    icon="history"
                    title="No hay movimientos"
                    subtitle="Cuando se creen asignaciones, ajustes, recálculos o descuentos, aparecerán aquí."
                  />
                </template>
              </q-table>
            </q-tab-panel>

            <q-tab-panel name="reservations" class="q-pa-none">
              <q-table
                flat
                bordered
                row-key="_id"
                :rows="reservations"
                :columns="reservationColumns"
                :rows-per-page-options="[10]"
                hide-pagination
              >
                <template #body-cell-status="props">
                  <q-td :props="props">
                    <q-badge
                      rounded
                      :color="getReservationStatusColor(props.row.status)"
                      :label="getReservationStatusLabel(props.row.status)"
                    />
                  </q-td>
                </template>

                <template #body-cell-reservedDays="props">
                  <q-td :props="props">
                    {{ formatDays(props.row.reservedDays) }}
                  </q-td>
                </template>

                <template #body-cell-createdAt="props">
                  <q-td :props="props">
                    {{ formatDateTime(props.row.createdAt) }}
                  </q-td>
                </template>

                <template #no-data>
                  <EmptyState
                    icon="lock_open"
                    title="No hay reservas"
                    subtitle="Los días reservados por préstamos aparecerán aquí."
                  />
                </template>
              </q-table>
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          rounded
          no-caps
          color="primary"
          icon="refresh"
          label="Recargar"
          :disable="loading || saving || recalculating"
          @click="() => loadSummary()"
        />

        <q-btn
          v-if="canManage"
          unelevated
          rounded
          no-caps
          color="secondary"
          icon="calculate"
          label="Recalcular balance"
          :loading="recalculating"
          :disable="loading || saving"
          @click="recalculateEmployeeBalance"
        />

        <q-btn
          unelevated
          rounded
          no-caps
          color="primary"
          icon="check"
          label="Cerrar"
          :disable="saving || recalculating"
          @click="closeModal"
        />
      </q-card-actions>

      <NotificationsVue ref="notify" />
    </q-card>
  </q-dialog>
</template>

<script setup>
import moment from "moment";
import { computed, defineComponent, h, ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";

defineProps({
  canManage: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["saved"]);

const EmptyState = defineComponent({
  name: "EmptyState",
  props: {
    icon: {
      type: String,
      default: "info",
    },
    title: {
      type: String,
      default: "Sin información",
    },
    subtitle: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    return () =>
      h("div", { class: "full-width text-center q-pa-xl text-grey-7" }, [
        h(
          "i",
          {
            class: "q-icon material-icons text-grey-5",
            style: "font-size: 42px",
          },
          props.icon,
        ),
        h(
          "div",
          { class: "text-subtitle1 text-weight-bold q-mt-sm" },
          props.title,
        ),
        h("div", { class: "text-caption" }, props.subtitle),
      ]);
  },
});

const notify = ref(null);

const open = ref(false);
const loading = ref(false);
const saving = ref(false);
const recalculating = ref(false);
const tab = ref("movements");

const employee = ref(null);
const balance = ref(null);
const summary = ref(null);
const movements = ref([]);
const reservations = ref([]);

const year = ref(new Date().getFullYear());

const adjustmentForm = ref({
  days: null,
  reason: "",
});

const yearOptions = computed(() => {
  const current = new Date().getFullYear();

  return [
    {
      label: String(current - 1),
      value: current - 1,
    },
    {
      label: String(current),
      value: current,
    },
    {
      label: String(current + 1),
      value: current + 1,
    },
  ];
});

const adjustDisabled = computed(() => {
  return (
    saving.value ||
    recalculating.value ||
    !balance.value?._id ||
    adjustmentForm.value.days === null ||
    adjustmentForm.value.days === undefined ||
    Number(adjustmentForm.value.days) === 0 ||
    !String(adjustmentForm.value.reason || "").trim()
  );
});

const balanceSummary = computed(() => {
  return summary.value || {};
});

const serviceYears = computed(() => {
  return Number(
    balanceSummary.value?.serviceYears ?? balance.value?.serviceYears ?? 0,
  );
});

const serviceMonths = computed(() => {
  return Number(
    balanceSummary.value?.serviceMonths ?? balance.value?.serviceMonths ?? 0,
  );
});

const serviceProgress = computed(() => {
  return Math.min(serviceMonths.value / 12, 1);
});

const canEnjoyVacations = computed(() => {
  return Boolean(
    balanceSummary.value?.canEnjoyVacations ??
      (serviceYears.value >= 1 && Number(balance.value?.availableDays || 0) > 0),
  );
});

const canUseVacationForLoan = computed(() => {
  return Boolean(
    balanceSummary.value?.canUseVacationForLoan ??
      Number(balance.value?.availableForLoanDays || 0) > 0,
  );
});

const vacationCycleLabel = computed(() => {
  if (!balance.value?.cycleStartDate || !balance.value?.cycleEndDate) {
    return "No definido";
  }

  return `${formatDate(balance.value.cycleStartDate)} - ${formatDate(
    balance.value.cycleEndDate,
  )}`;
});

const lastCalculatedLabel = computed(() => {
  if (!balance.value?.lastCalculatedAt) return "No calculado";

  return moment(balance.value.lastCalculatedAt).format("YYYY/MM/DD hh:mm A");
});

const vacationMetricCards = computed(() => {
  const item = balance.value || {};

  return [
    {
      key: "availableDays",
      icon: "beach_access",
      label: "Disponible para disfrutar",
      value: item.availableDays,
      caption: "Días que el empleado puede tomar como vacaciones.",
      class: "available-card",
      avatarClass: "bg-green-1 text-positive",
      valueClass: "text-positive",
    },
    {
      key: "accruedPaymentDays",
      icon: "trending_up",
      label: "Acumulado causado",
      value: item.accruedPaymentDays,
      caption: "Días acumulados para pago, liquidación o garantía.",
      class: "accrued-card",
      avatarClass: "bg-blue-1 text-primary",
      valueClass: "text-primary",
    },
    {
      key: "availableForLoanDays",
      icon: "account_balance_wallet",
      label: "Disponible para préstamo",
      value: item.availableForLoanDays,
      caption: "Balance que puede servir como respaldo para préstamos.",
      class: "loan-card",
      avatarClass: "bg-purple-1 text-purple-8",
      valueClass: "text-purple-8",
    },
    {
      key: "usedReserved",
      icon: "lock_clock",
      label: "Usados / reservados",
      value: Number(item.usedDays || 0) + Number(item.reservedDays || 0),
      caption: `${formatDays(item.usedDays)} usados · ${formatDays(
        item.reservedDays,
      )} reservados`,
      class: "reserved-card",
      avatarClass: "bg-orange-1 text-orange-10",
      valueClass: "text-orange-10",
    },
  ];
});

const vacationDetailItems = computed(() => {
  const item = balance.value || {};

  return [
    {
      icon: "event_available",
      label: "Días disfrutables asignados",
      value: formatDays(item.enjoyableDays),
    },
    {
      icon: "paid",
      label: "Base para pago",
      value: formatDays(item.paymentBaseDays),
    },
    {
      icon: "event_busy",
      label: "Días usados",
      value: formatDays(item.usedDays),
    },
    {
      icon: "lock",
      label: "Días reservados",
      value: formatDays(item.reservedDays),
    },
    {
      icon: "add_circle",
      label: "Ajustes manuales",
      value: formatDays(item.adjustmentDays),
    },
    {
      icon: "redo",
      label: "Arrastre",
      value: formatDays(item.carryOverDays),
    },
    {
      icon: "warning",
      label: "Días vencidos",
      value: formatDays(item.expiredDays),
    },
    {
      icon: "payments",
      label: "Días pagables netos",
      value: formatDays(item.netPayableVacationDays),
    },
  ];
});

const movementColumns = [
  {
    name: "type",
    label: "Tipo",
    field: "type",
    align: "left",
  },
  {
    name: "days",
    label: "Días",
    field: "days",
    align: "center",
  },
  {
    name: "previousAvailableDays",
    label: "Antes",
    field: "previousAvailableDays",
    align: "center",
  },
  {
    name: "newAvailableDays",
    label: "Después",
    field: "newAvailableDays",
    align: "center",
  },
  {
    name: "reason",
    label: "Motivo",
    field: "reason",
    align: "left",
  },
  {
    name: "createdAt",
    label: "Fecha",
    field: "createdAt",
    align: "left",
  },
];

const reservationColumns = [
  {
    name: "source",
    label: "Origen",
    field: "source",
    align: "left",
  },
  {
    name: "reservedDays",
    label: "Días",
    field: "reservedDays",
    align: "center",
  },
  {
    name: "status",
    label: "Estado",
    field: "status",
    align: "center",
  },
  {
    name: "reason",
    label: "Motivo",
    field: "reason",
    align: "left",
  },
  {
    name: "createdAt",
    label: "Fecha",
    field: "createdAt",
    align: "left",
  },
];

const openModal = async (item) => {
  employee.value = item;
  year.value = new Date().getFullYear();
  tab.value = "movements";

  balance.value = null;
  summary.value = null;
  movements.value = [];
  reservations.value = [];

  adjustmentForm.value = {
    days: null,
    reason: "",
  };

  open.value = true;

  await loadSummary();
};

const closeModal = () => {
  if (saving.value || recalculating.value) return;

  open.value = false;
};

const loadSummary = async ({ refresh = false } = {}) => {
  if (!employee.value?._id) return;

  loading.value = !refresh;
  recalculating.value = refresh;

  try {
    const q = new URLSearchParams();

    q.set("year", String(year.value));

    if (refresh) {
      q.set("refresh", "true");
    }

    const resp = await methodsHttp.getApi(
      `employee-vacation/employee/${employee.value._id}/summary?${q.toString()}`,
    );

    if (resp?.ok) {
      balance.value = resp.balance || null;
      summary.value = resp.summary || null;
      movements.value = resp.movements || [];
      reservations.value = resp.reservations || [];

      if (refresh) {
        notify.value?.showNotifyGood(
          resp?.mensaje || "Balance recalculado correctamente",
        );

        emit("saved");
      }

      return;
    }

    notify.value?.showNotifyBad(
      resp?.mensaje || "No se pudo cargar el balance de vacaciones",
    );
  } catch (error) {
    console.error("loadSummary error:", error);
    notify.value?.showNotifyBad("Error cargando las vacaciones del empleado");
  } finally {
    loading.value = false;
    recalculating.value = false;
  }
};

const recalculateEmployeeBalance = async () => {
  await loadSummary({
    refresh: true,
  });
};

const applyManualAdjustment = async () => {
  if (!balance.value?._id) return;

  saving.value = true;

  try {
    const resp = await methodsHttp.putApi(
      `employee-vacation/balance/${balance.value._id}/manual-adjustment`,
      {
        days: Number(adjustmentForm.value.days),
        reason: String(adjustmentForm.value.reason || "").trim(),
      },
    );

    if (resp?.ok) {
      notify.value?.showNotifyGood(resp.mensaje || "Ajuste aplicado");

      adjustmentForm.value = {
        days: null,
        reason: "",
      };

      await loadSummary();
      emit("saved");
      return;
    }

    notify.value?.showNotifyBad(resp?.mensaje || "No se pudo aplicar el ajuste");
  } catch (error) {
    console.error("applyManualAdjustment error:", error);
    notify.value?.showNotifyBad("Error aplicando el ajuste manual");
  } finally {
    saving.value = false;
  }
};

const numberValue = (value) => {
  const n = Number(value || 0);

  return Number.isInteger(n) ? n : n.toFixed(2);
};

const formatDays = (value) => {
  const n = Number(value || 0);

  return `${Number.isInteger(n) ? n : n.toFixed(2)} días`;
};

const formatDate = (value) => {
  if (!value) return "Sin fecha";

  return moment(value).format("YYYY/MM/DD");
};

const getInitials = (value) => {
  const text = String(value || "").trim();

  if (!text) return "U";

  const parts = text.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const formatDateTime = (value) => {
  if (!value) return "Sin fecha";

  return moment(value).format("YYYY/MM/DD hh:mm A");
};

const getDaysClass = (days) => {
  return Number(days) >= 0
    ? "text-positive text-weight-bold"
    : "text-negative text-weight-bold";
};

const getMovementLabel = (type) => {
  const labels = {
    INITIAL_ASSIGNMENT: "Asignación inicial",
    VACATION_ACCRUAL_RECALCULATION: "Recálculo",
    VACATION_APPROVED: "Vacación aprobada",
    VACATION_CANCELLED: "Vacación cancelada",
    VACATION_CARRY_OVER: "Arrastre",
    VACATION_EXPIRED: "Vencimiento",
    MANUAL_ADJUSTMENT: "Ajuste manual",
    LOAN_RESERVATION: "Reserva préstamo",
    LOAN_RELEASE: "Liberación préstamo",
    LOAN_CONSUMED: "Consumido por préstamo",
  };

  return labels[type] || type || "Movimiento";
};

const getMovementColor = (type) => {
  const colors = {
    INITIAL_ASSIGNMENT: "primary",
    VACATION_ACCRUAL_RECALCULATION: "secondary",
    VACATION_APPROVED: "negative",
    VACATION_CANCELLED: "positive",
    VACATION_CARRY_OVER: "primary",
    VACATION_EXPIRED: "negative",
    MANUAL_ADJUSTMENT: "secondary",
    LOAN_RESERVATION: "warning",
    LOAN_RELEASE: "positive",
    LOAN_CONSUMED: "negative",
  };

  return colors[type] || "grey";
};

const getReservationStatusLabel = (status) => {
  const labels = {
    ACTIVE: "Activa",
    RELEASED: "Liberada",
    CONSUMED: "Consumida",
    CANCELLED: "Cancelada",
  };

  return labels[status] || status || "Sin estado";
};

const getReservationStatusColor = (status) => {
  const colors = {
    ACTIVE: "warning",
    RELEASED: "positive",
    CONSUMED: "negative",
    CANCELLED: "grey",
  };

  return colors[status] || "grey";
};

defineExpose({
  openModal,
});
</script>

<style scoped>
.vacation-dialog {
  width: 1180px;
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
  max-height: calc(92vh - 154px);
  padding: 18px;
  background: #f8fafc;
}

.employee-card,
.summary-card,
.adjust-card,
.tabs-card,
.metric-card {
  border-radius: 20px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.employee-card {
  padding: 16px;
}

.employee-avatar {
  color: white;
  font-weight: 900;
  background: linear-gradient(135deg, #1a2436, #1964a2);
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 4px rgba(25, 100, 162, 0.12);
}

.employee-name {
  color: #0f172a;
  font-weight: 900;
  line-height: 1.1;
}

.employee-meta {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}

.metric-card {
  min-height: 94px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.metric-card-modern {
  align-items: flex-start;
  min-height: 132px;
}

.metric-avatar {
  width: 46px;
  height: 46px;
  min-width: 46px;
  border-radius: 16px;
  font-size: 24px;
}

.metric-content {
  min-width: 0;
}

.metric-label,
.summary-label {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value {
  color: #0f172a;
  font-size: 1.65rem;
  font-weight: 900;
  line-height: 1;
  margin-top: 5px;
}

.metric-caption {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.74rem;
  line-height: 1.25;
}

.available-card {
  border-color: rgba(76, 175, 80, 0.22);
}

.accrued-card {
  border-color: rgba(25, 100, 162, 0.2);
}

.loan-card {
  border-color: rgba(126, 34, 206, 0.2);
}

.reserved-card {
  border-color: rgba(249, 115, 22, 0.22);
}

.summary-value {
  margin-top: 4px;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.summary-badge {
  margin-top: 5px;
  padding: 6px 10px;
  font-weight: 800;
}

.summary-status-chip {
  font-weight: 800;
}

.vacation-progress-box {
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.detail-tile {
  min-height: 82px;
  padding: 13px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.detail-icon {
  background: rgba(2, 77, 72, 0.1);
  color: var(--q-primary);
}

.detail-label {
  color: #64748b;
  font-size: 0.73rem;
  font-weight: 800;
}

.detail-value {
  margin-top: 3px;
  color: #0f172a;
  font-size: 0.93rem;
  font-weight: 900;
}

.section-title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.section-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.action-btn {
  min-height: 40px;
  font-weight: 800;
}

.dialog-actions {
  padding: 14px 18px;
  background: white;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

:deep(.q-field--outlined.q-field--rounded .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 768px) {
  .vacation-dialog {
    width: 96vw;
    max-height: 94vh;
  }

  .dialog-body {
    max-height: calc(94vh - 154px);
    padding: 12px;
  }

  .metric-value {
    font-size: 1.45rem;
  }
}
</style>