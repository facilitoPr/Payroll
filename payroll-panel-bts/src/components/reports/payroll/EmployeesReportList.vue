<template>
  <div class="employees-report-list">
    <q-card flat bordered class="list-toolbar q-mb-md">
      <q-card-section class="q-pa-md">
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="toolbar-title">
              <q-icon name="groups" color="primary" size="22px" />
              <div>
                <div class="text-subtitle1 text-weight-bold">
                  Empleados en el reporte
                </div>
                <div class="text-caption text-grey-7">
                  Visualiza el detalle de asistencia, descuentos y pagos por empleado.
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="searchText"
              outlined
              dense
              clearable
              debounce="250"
              label="Buscar empleado"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="search" color="primary" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-auto">
            <q-toggle
              v-model="onlyWithLate"
              color="negative"
              label="Solo tardanzas"
              left-label
            />
          </div>
        </div>

        <div class="row q-col-gutter-sm q-mt-md">
          <div class="col-12 col-sm-6 col-md-3">
            <div class="mini-stat">
              <q-icon name="groups" color="primary" />
              <span>Empleados</span>
              <b>{{ employeesReport.length }}</b>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="mini-stat">
              <q-icon name="event_available" color="primary" />
              <span>Días</span>
              <b>{{ totalDays }}</b>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="mini-stat">
              <q-icon name="alarm" color="negative" />
              <span>Tardanzas</span>
              <b>{{ totalLateDays }}</b>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="mini-stat">
              <q-icon name="payments" color="positive" />
              <span>Neto</span>
              <b>{{ money(totalNetToDeposit) }}</b>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div v-if="filteredEmployees.length" class="row q-col-gutter-md">
      <div
        class="col-12"
        v-for="(emp, index) in filteredEmployees"
        :key="emp.userId || emp.empleado?._id || index"
      >
        <TableReportsNominaSingle
          :item="emp"
          :rows="emp.dias"
          :fechaInicio="filtros.fechaInicio"
          :fechaFin="filtros.fechaFin"
          :openModal="(row) => emit('open-details', row)"
          :netoADepositar="emp.netoMensual"
        />
      </div>
    </div>

    <q-card v-else flat bordered class="empty-card">
      <q-card-section class="text-center q-pa-xl">
        <q-avatar size="72px" color="blue-grey-1" text-color="primary">
          <q-icon name="manage_search" size="38px" />
        </q-avatar>

        <div class="text-subtitle1 text-weight-bold q-mt-md">
          No hay empleados para mostrar
        </div>

        <div class="text-caption text-grey-7 q-mt-xs">
          Ajusta los filtros o cambia el texto de búsqueda.
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import TableReportsNominaSingle from "../TableReportsNominaSingle.vue";

const props = defineProps({
  employeesReport: { type: Array, default: () => [] },
  filtros: { type: Object, required: true },
});

const emit = defineEmits(["open-details"]);

const searchText = ref("");
const onlyWithLate = ref(false);

const filteredEmployees = computed(() => {
  const text = String(searchText.value || "").trim().toLowerCase();

  return (props.employeesReport || []).filter((employee) => {
    const name = String(employee?.name || employee?.empleado?.name || "").toLowerCase();
    const email = String(employee?.email || employee?.username || "").toLowerCase();

    const matchesText = !text || name.includes(text) || email.includes(text);

    const hasLate = (employee?.dias || []).some((day) => {
      return Boolean(day?.isLate) || Number(day?.lateMinutesForPayroll || 0) > 0;
    });

    const matchesLate = !onlyWithLate.value || hasLate;

    return matchesText && matchesLate;
  });
});

const totalDays = computed(() => {
  return (props.employeesReport || []).reduce((acc, employee) => {
    return acc + Number(employee?.dias?.length || 0);
  }, 0);
});

const totalLateDays = computed(() => {
  return (props.employeesReport || []).reduce((acc, employee) => {
    const count = (employee?.dias || []).filter((day) => {
      return Boolean(day?.isLate) || Number(day?.lateMinutesForPayroll || 0) > 0;
    }).length;

    return acc + count;
  }, 0);
});

const totalNetToDeposit = computed(() => {
  return (props.employeesReport || []).reduce((acc, employee) => {
    return acc + Number(employee?.netoADepositar || 0);
  }, 0);
});

const money = (value) => {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};
</script>

<style scoped>
.employees-report-list {
  width: 100%;
}

.list-toolbar {
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(23, 141, 210, 0.08), transparent 34%),
    #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.04);
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
  background: #ffffff;
}

.mini-stat {
  min-height: 42px;
  padding: 9px 12px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
}

.mini-stat b {
  margin-left: auto;
  color: #0f172a;
  font-weight: 900;
}

.empty-card {
  border-radius: 22px;
  background: #ffffff;
  border: 1px dashed rgba(15, 23, 42, 0.16);
}
</style>