<template>
  <q-card flat bordered class="employee-payroll-card">
    <q-card-section class="employee-header">
      <div class="row items-center q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="employee-identity">
            <q-avatar size="56px" class="employee-avatar">
              <q-img
                fit="cover"
                :src="employeeImage"
                alt="avatar"
              />
            </q-avatar>

            <div class="employee-info">
              <div class="row items-center q-gutter-xs no-wrap">
                <div class="employee-name ellipsis">
                  {{ props.item?.name || "Empleado" }}
                </div>

                <q-badge
                  v-if="props.item?.salaryCode"
                  color="primary"
                  text-color="white"
                  class="soft-badge"
                >
                  {{ props.item.salaryCode }}
                </q-badge>
              </div>

              <div class="employee-email ellipsis">
                {{ props.item?.email || props.item?.username || "Sin correo" }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-auto">
          <div class="period-chip">
            <q-icon name="date_range" color="primary" />
            <span>
              {{ fechaInicio || "Sin fecha" }}
              <template v-if="fechaFin"> → {{ fechaFin }}</template>
            </span>
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pa-md">
      <div class="summary-grid q-mb-md">
        <div class="summary-card">
          <div class="summary-icon summary-icon--hours">
            <q-icon name="schedule" />
          </div>

          <div>
            <div class="summary-label">Horas trabajadas</div>
            <div class="summary-value">{{ workedHoursLabel }}</div>
          </div>
        </div>

        <div class="summary-card">
          <div
            class="summary-icon"
            :class="totalLateMinutes > 0 ? 'summary-icon--late' : 'summary-icon--ok'"
          >
            <q-icon :name="totalLateMinutes > 0 ? 'alarm' : 'check_circle'" />
          </div>

          <div>
            <div class="summary-label">Tardanza</div>
            <div class="summary-value">{{ lateHoursLabel }}</div>
            <div v-if="diasConTardanza > 0" class="summary-caption">
              {{ diasConTardanza }} día{{ diasConTardanza === 1 ? "" : "s" }}
            </div>
          </div>
        </div>

        <div v-if="canViewMoney" class="summary-card">
          <div class="summary-icon summary-icon--discount">
            <q-icon name="remove_circle" />
          </div>

          <div>
            <div class="summary-label">Descuentos</div>
            <div class="summary-value text-negative">
              {{ formatCurrency(props.item?.totalDiscounts || 0) }}
            </div>
          </div>
        </div>

        <div v-if="canViewMoney" class="summary-card summary-card--deposit">
          <div class="summary-icon summary-icon--deposit">
            <q-icon name="payments" />
          </div>

          <div>
            <div class="summary-label">Neto a depositar</div>
            <div class="summary-value">
              {{ formatCurrency(props.item?.netoADepositar || props.netoADepositar || 0) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="canViewMoney" class="payroll-details-strip q-mb-md">
        <div class="detail-pill">
          <q-icon name="payments" color="primary" />
          <span>Neto del periodo:</span>
          <b>{{ formatCurrency(props.item?.netoPeriodoBase || 0) }}</b>
        </div>

        <div class="detail-pill">
          <q-icon name="timer_off" color="orange" />
          <span>Tardanza:</span>
          <b>{{ formatCurrency(props.item?.totalDiscountTardanza || 0) }}</b>
        </div>

        <div class="detail-pill">
          <q-icon name="event_busy" color="negative" />
          <span>Ausencia:</span>
          <b>{{ formatCurrency(props.item?.totalDiscountAusencia || 0) }}</b>
        </div>

        <q-space />

        <q-btn
          v-if="!viewOnly && puedeAmonestar"
          unelevated
          no-caps
          color="warning"
          text-color="dark"
          icon="gpp_maybe"
          label="Amonestar tardanza"
          class="warning-btn"
          :loading="warningLoading"
          @click="enviarAmonestacion"
        />
      </div>

      <q-table
        flat
        bordered
        :rows="resumen"
        :columns="columns"
        row-key="workSummary"
        hide-pagination
        :rows-per-page-options="[0]"
        class="payroll-table"
        no-data-label="Sin datos en este rango."
      >
        <template #body="scope">
          <q-tr
            :props="scope"
            :class="rowClass(scope.row)"
            @click="onRowClick(scope.row)"
          >
            <q-td key="status" :props="scope">
              <div class="status-dot" :style="dotStyle(scope.row)" />
            </q-td>

            <q-td key="confirmed" :props="scope">
              <q-badge
                :color="scope.row.confirmedToPay ? 'positive' : 'grey-5'"
                text-color="white"
                class="status-badge"
              >
                <q-icon
                  :name="scope.row.confirmedToPay ? 'check_circle' : 'radio_button_unchecked'"
                  size="14px"
                  class="q-mr-xs"
                />
                {{ scope.row.confirmedToPay ? "Listo" : "Pendiente" }}
              </q-badge>
            </q-td>

            <q-td key="date" :props="scope">
              <div class="date-cell">
                <div class="text-weight-bold">
                  {{ scope.row.dateString || fmt(scope.row.date) }}
                </div>

                <q-badge
                  v-if="scope.row.isPaid"
                  color="blue-grey-1"
                  text-color="grey-8"
                  class="paid-badge"
                >
                  PAGADO
                </q-badge>
              </div>
            </q-td>

            <q-td key="hours" :props="scope">
              <div class="hours-cell">
                <div class="text-weight-bold">
                  {{ minutesLabel(scope.row.workedMinutes) }}
                </div>

                <div class="text-caption text-grey-7">
                  de {{ minutesLabel(scope.row.expectedMinutes) }}
                </div>
              </div>
            </q-td>

            <q-td key="discount" :props="scope">
              <q-badge
                v-if="scope.row.descuentoTotal"
                color="negative"
                text-color="white"
                class="money-badge"
              >
                {{ formatCurrency(scope.row.descuentoTotal) }}
              </q-badge>

              <q-badge
                v-else
                color="positive"
                outline
                class="money-badge"
              >
                Sin descuento
              </q-badge>
            </q-td>

            <q-td key="steps" :props="scope">
              <div class="steps-wrap">
                <q-chip
                  v-for="(step, index) in scope.row.punchSteps || []"
                  :key="index"
                  dense
                  outline
                  square
                  :color="stepColor(step.punchStep)"
                  class="step-chip"
                >
                  <q-icon
                    :name="stepIcon(step.punchStep)"
                    size="15px"
                    class="q-mr-xs"
                  />
                  {{ stepLabel(step.punchStep) }}
                  · {{ moment(step.timestamp).format("LT") }}
                </q-chip>

                <q-badge
                  v-if="!(scope.row.punchSteps || []).length"
                  color="grey-4"
                  text-color="grey-8"
                >
                  Sin ponches
                </q-badge>
              </div>
            </q-td>

            <q-td key="classification" :props="scope">
              <q-badge
                :color="classificationColor(scope.row.classification)"
                text-color="white"
                class="classification-badge"
              >
                {{ scope.row.classification || "Trabajo regular" }}
              </q-badge>
            </q-td>
          </q-tr>
        </template>

        <template #no-data>
          <div class="full-width text-center q-pa-xl text-grey-7">
            <q-avatar size="62px" color="blue-grey-1" text-color="primary">
              <q-icon name="event_busy" size="34px" />
            </q-avatar>

            <div class="text-subtitle1 text-weight-bold q-mt-md">
              Sin datos en este rango
            </div>

            <div class="text-caption q-mt-xs">
              Este empleado no tiene registros para las fechas seleccionadas.
            </div>
          </div>
        </template>
      </q-table>
    </q-card-section>

    <q-inner-loading :showing="isLoading">
      <q-spinner size="34px" color="primary" />
    </q-inner-loading>
  </q-card>
</template>

<script setup>
import { computed, defineProps, ref, watch } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import { formatCurrency } from "app/utils";
import { authStore } from "src/stores/auth-store";

moment.locale("es");

const $q = useQuasar();
const auth = authStore();

const props = defineProps({
  item: { type: Object, default: null },
  rows: { type: Array, default: () => [] },
  netoADepositar: { type: Number, default: 0 },
  fechaInicio: { type: String, default: null },
  fechaFin: { type: String, default: null },
  openModal: { type: Function, default: null },
  viewOnly: { type: Boolean, default: false },
});

const resumen = ref([]);
const isLoading = ref(false);
const warningLoading = ref(false);

watch(
  () => props.rows,
  (value) => {
    resumen.value = Array.isArray(value) ? value : [];
  },
  { immediate: true },
);

const columns = [
  {
    name: "status",
    label: "",
    field: "status",
    align: "center",
    style: "width: 42px",
  },
  {
    name: "confirmed",
    label: "Listo",
    field: "confirmedToPay",
    align: "left",
  },
  {
    name: "date",
    label: "Fecha",
    field: "dateString",
    align: "left",
  },
  {
    name: "hours",
    label: "Horas",
    field: "workedMinutes",
    align: "left",
  },
  {
    name: "discount",
    label: "Descuento",
    field: "descuentoTotal",
    align: "left",
  },
  {
    name: "steps",
    label: "Ponches",
    field: "punchSteps",
    align: "left",
  },
  {
    name: "classification",
    label: "Clasificación",
    field: "classification",
    align: "left",
  },
];

const canViewMoney = computed(() => {
  return (
    auth?.user?.department?.code === "RRHH" ||
    auth?.user?.rol?.code === "ADMIN" ||
    auth?.user?.rol?.code === "SUPERADMIN" ||
    auth?.user?.rol?.code === "SUPER_ADMIN"
  );
});

const employeeImage = computed(() => {
  return (
    props.item?.img ||
    props.item?.image ||
    "https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp"
  );
});

const totalLateMinutes = computed(() => {
  return resumen.value.reduce((acc, row) => {
    return acc + Number(row?.entryLateRaw || row?.lateMinutesForPayroll || 0);
  }, 0);
});

const diasConTardanza = computed(() => {
  return resumen.value.filter((row) => {
    return Boolean(row?.isLate) || Number(row?.lateMinutesForPayroll || 0) > 0;
  }).length;
});

const workedHoursLabel = computed(() => {
  return minutesLabel(props.item?.totalWorkedMinutes || 0);
});

const lateHoursLabel = computed(() => {
  return minutesLabel(totalLateMinutes.value);
});

const puedeAmonestar = computed(() => {
  return Boolean(props.item?.userId) && totalLateMinutes.value > 0;
});

const fmt = (date) => {
  return date ? moment(date).format("YYYY/MM/DD") : "-";
};

const minutesLabel = (minutes) => {
  const total = Number(minutes || 0);
  return `${Math.floor(total / 60)}h ${total % 60}m`;
};

const stepColor = (step) => {
  const map = {
    entrada: "primary",
    salida_almuerzo: "orange",
    entrada_almuerzo: "indigo",
    salida: "teal",
  };

  return map[step] || "grey-7";
};

const stepIcon = (step) => {
  const map = {
    entrada: "login",
    salida_almuerzo: "restaurant",
    entrada_almuerzo: "restaurant_menu",
    salida: "logout",
  };

  return map[step] || "fingerprint";
};

const stepLabel = (step) => {
  const map = {
    entrada: "Entrada",
    salida_almuerzo: "Salida almuerzo",
    entrada_almuerzo: "Entrada almuerzo",
    salida: "Salida",
  };

  return map[step] || "Ponche";
};

const classificationColor = (classification) => {
  const text = String(classification || "Trabajo regular").toLowerCase();

  if (text.includes("trabajo")) return "primary";
  if (text.includes("vacaciones")) return "teal";
  if (text.includes("médica") || text.includes("enfermedad")) return "deep-purple";
  if (text.includes("sin justificación")) return "negative";
  if (text.includes("ausencia")) return "orange";
  if (text.includes("permiso")) return "positive";
  if (text.includes("licencia")) return "indigo";

  return "grey-7";
};

const enviarAmonestacion = async () => {
  if (!puedeAmonestar.value) {
    $q.notify({
      type: "warning",
      message: "No hay tardanzas registradas en este período.",
    });

    return;
  }

  warningLoading.value = true;

  try {
    const body = {
      category: "LATE_ARRIVAL",
      createdVia: "REPORT",
      notes: "Amonestación enviada desde la pantalla de reportes de empleado",
      userId: props.item?.userId,
      from: moment(props.fechaInicio).format("YYYY-MM-DD"),
      to: moment(props.fechaFin || props.fechaInicio).format("YYYY-MM-DD"),
      preventDuplicate: true,
    };

    const response = await methodsHttp.postApi(
      "disciplinary/createDisciplinaryAction",
      body,
    );

    if (response.ok) {
      $q.notify({
        type: "positive",
        message: "Amonestación enviada correctamente.",
      });

      return;
    }

    $q.notify({
      type: "negative",
      message:
        response.mensaje ||
        "No se pudo enviar la amonestación. Inténtalo nuevamente.",
    });
  } catch (error) {
    console.error(error);

    $q.notify({
      type: "negative",
      message: "Error al enviar la amonestación.",
    });
  } finally {
    warningLoading.value = false;
  }
};

const rowClass = (row) => {
  return {
    "row-paid": Boolean(row?.isPaid),
    "row-late": Boolean(row?.isLate) || Number(row?.lateMinutesForPayroll || 0) > 0,
    "cursor-pointer": !props.viewOnly,
  };
};

const onRowClick = (row) => {
  if (!props.openModal) return;

  props.openModal(row);
};

const dotStyle = (row) => {
  let backgroundColor = "#9ca3af";

  if (row?.classification === "Vacaciones") {
    backgroundColor = "#14b8a6";
  } else if (row?.classification === "Trabajo regular" || !row?.classification) {
    backgroundColor =
      row?.isLate || Number(row?.lateMinutesForPayroll || 0) > 0
        ? "#ef4444"
        : "#22c55e";
  } else if (String(row?.classification || "").toLowerCase().includes("ausencia")) {
    backgroundColor = "#f97316";
  } else {
    backgroundColor = "#178DD2";
  }

  return {
    backgroundColor,
  };
};
</script>

<style scoped>
.employee-payroll-card {
  border-radius: 22px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.04);
}

.employee-header {
  padding: 16px;
  background:
    radial-gradient(circle at top left, rgba(23, 141, 210, 0.1), transparent 34%),
    linear-gradient(180deg, #ffffff, #f8fafc);
}

.employee-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.employee-avatar {
  background: #ffffff;
  box-shadow:
    0 0 0 3px #ffffff,
    0 0 0 6px rgba(23, 141, 210, 0.1),
    0 10px 24px rgba(15, 23, 42, 0.12);
}

.employee-info {
  min-width: 0;
}

.employee-name {
  max-width: 360px;
  color: #0f172a;
  font-size: 1.02rem;
  font-weight: 900;
}

.employee-email {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
}

.soft-badge,
.paid-badge,
.status-badge,
.money-badge,
.classification-badge {
  border-radius: 999px;
  font-weight: 800;
}

.period-chip {
  min-height: 36px;
  padding: 8px 11px;
  border-radius: 999px;
  background: rgba(23, 141, 210, 0.08);
  border: 1px solid rgba(23, 141, 210, 0.14);
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.8rem;
  font-weight: 800;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.summary-card {
  min-height: 82px;
  padding: 12px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-card--deposit {
  background:
    radial-gradient(circle at top right, rgba(23, 141, 210, 0.12), transparent 38%),
    #ffffff;
  border-color: rgba(23, 141, 210, 0.16);
}

.summary-icon {
  width: 42px;
  height: 42px;
  min-width: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-icon--hours {
  color: var(--q-primary);
  background: rgba(23, 141, 210, 0.1);
}

.summary-icon--ok {
  color: #21ba45;
  background: rgba(33, 186, 69, 0.1);
}

.summary-icon--late {
  color: #c10015;
  background: rgba(193, 0, 21, 0.08);
}

.summary-icon--discount {
  color: #c10015;
  background: rgba(193, 0, 21, 0.08);
}

.summary-icon--deposit {
  color: #2e7d32;
  background: rgba(46, 125, 50, 0.1);
}

.summary-label {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-value {
  margin-top: 3px;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.summary-caption {
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 700;
}

.payroll-details-strip {
  padding: 10px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-pill {
  min-height: 34px;
  padding: 7px 10px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
}

.detail-pill b {
  color: #0f172a;
  font-weight: 900;
}

.warning-btn {
  min-height: 36px;
  border-radius: 12px;
  font-weight: 800;
}

.payroll-table {
  border-radius: 18px;
  overflow: hidden;
  border-color: rgba(15, 23, 42, 0.08);
}

.payroll-table :deep(thead tr) {
  background: #f8fafc;
}

.payroll-table :deep(th) {
  color: #475569;
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.payroll-table :deep(td) {
  color: #334155;
  font-size: 0.82rem;
}

.payroll-table :deep(tbody tr) {
  transition:
    background 0.16s ease,
    transform 0.16s ease;
}

.payroll-table :deep(tbody tr:hover) {
  background: rgba(23, 141, 210, 0.04);
}

.status-dot {
  width: 11px;
  height: 11px;
  border-radius: 999px;
  box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05);
  margin: 0 auto;
}

.date-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}

.hours-cell {
  line-height: 1.2;
}

.steps-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  max-width: 420px;
}

.step-chip {
  border-radius: 10px;
  font-size: 0.72rem;
}

.row-paid {
  background: #f3f4f6 !important;
}

.row-paid td {
  color: #6b7280 !important;
}

.row-late:not(.row-paid) {
  background: rgba(239, 68, 68, 0.035);
}

@media (max-width: 1023px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .employee-name {
    max-width: 260px;
  }
}

@media (max-width: 599px) {
  .employee-header {
    padding: 14px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .payroll-details-strip {
    align-items: stretch;
  }

  .detail-pill,
  .warning-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>