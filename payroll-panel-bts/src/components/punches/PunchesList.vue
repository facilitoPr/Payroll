<template>
  <div class="row q-col-gutter-md">
    <!-- EMPTY STATE GENERAL -->
    <div v-if="!loading && employeesReport.length === 0" class="col-12">
      <q-card flat bordered class="empty-state-card">
        <q-card-section class="column items-center text-center q-pa-xl">
          <q-avatar size="76px" class="empty-state-icon text-primary">
            <q-icon name="inbox" size="42px" />
          </q-avatar>

          <div class="text-h6 text-weight-bold q-mt-md">
            No hay datos para mostrar
          </div>

          <div class="text-body2 text-grey-7 q-mt-xs empty-state-text">
            No se encontraron reportes de empleados para el rango seleccionado.
            Intenta cambiar las fechas o limpiar los filtros.
          </div>

          <q-chip
            v-if="filtros?.fechaInicio || filtros?.fechaFin"
            outline
            color="primary"
            text-color="primary"
            icon="date_range"
            class="q-mt-md"
          >
            {{ filtros.fechaInicio || "Sin fecha inicial" }}
            <span v-if="filtros.fechaFin">
              &nbsp;→&nbsp;{{ filtros.fechaFin }}
            </span>
          </q-chip>
        </q-card-section>
      </q-card>
    </div>

    <!-- LOADING SKELETON -->
    <template v-else-if="loading">
      <div v-for="item in 2" :key="item" class="col-12">
        <q-card flat bordered class="report-card">
          <q-card-section class="row items-center q-gutter-sm">
            <q-skeleton type="QAvatar" size="42px" />

            <div class="col">
              <q-skeleton type="text" width="180px" />
              <q-skeleton type="text" width="260px" />
            </div>

            <q-skeleton type="QChip" width="180px" />
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-skeleton type="rect" height="220px" />
          </q-card-section>
        </q-card>
      </div>
    </template>

    <!-- DATA -->
    <div
      v-else
      class="col-12"
      v-for="(emp, index) in employeesReport"
      :key="emp.empleado?._id || index"
    >
      <q-card flat bordered class="report-card">
        <!-- HEADER EMPLEADO + RANGO -->
        <q-card-section class="row items-center q-gutter-sm">
          <q-avatar size="42px">
            <q-img
              fit="cover"
              :src="
                emp?.img ||
                emp?.image ||
                'https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp'
              "
              alt="avatar"
            />
          </q-avatar>

          <div class="col">
            <div class="text-subtitle1 text-weight-medium">
              {{ emp?.name || emp?.empleado?.name || "Empleado" }}
            </div>

            <div class="text-caption text-grey-7">
              {{ emp?.email || emp?.username || emp?.empleado?.email || "—" }}
            </div>
          </div>

          <q-space />

          <q-chip
            outline
            icon="date_range"
            color="primary"
            text-color="primary"
            class="q-ml-sm"
          >
            {{ filtros.fechaInicio || "Sin fecha" }}
            <span v-if="filtros.fechaFin">
              &nbsp;→&nbsp;{{ filtros.fechaFin }}
            </span>
          </q-chip>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-markup-table
            flat
            bordered
            wrap-cells
            separator="horizontal"
            class="table-zebra report-table"
          >
            <thead class="bg-grey-2 sticky-th">
              <tr>
                <th class="text-left table-dot-column"></th>
                <th class="text-left">FECHA</th>
                <th class="text-left">PASOS</th>
                <th class="text-left">CLASIFICACIÓN</th>
              </tr>
            </thead>

            <tbody>
              <template v-if="emp?.dias?.length">
                <tr
                  :class="rowClass(r)"
                  v-for="(r, idx) in emp.dias"
                  :key="idx"
                  @click="onRowClick(r)"
                >
                  <td class="table-dot-cell">
                    <div :style="dotStyle(r)" />
                  </td>

                  <td class="text-left">
                    <div class="row items-center no-wrap">
                      <span>{{ r.dateString || fmt(r.date) }}</span>

                      <q-badge
                        v-if="r.isPaid"
                        class="q-ml-sm"
                        outline
                        color="grey-7"
                        text-color="grey-8"
                        label="PAGADO"
                      />
                    </div>
                  </td>

                  <td class="text-left">
                    <div
                      v-if="r.punchSteps?.length"
                      class="q-gutter-xs punch-badges"
                    >
                      <q-badge
                        v-for="(step, stepIndex) in r.punchSteps"
                        :key="stepIndex"
                        :color="stepColor(step.punchStep)"
                        outline
                      >
                        <div class="column">
                          <span>
                            {{ formatPunchStep(step.punchStep) }}
                          </span>
                          <small>
                            {{ moment(step.timestamp).format("LTS") }}
                          </small>
                        </div>
                      </q-badge>
                    </div>

                    <q-badge
                      v-else
                      outline
                      color="grey-6"
                      text-color="grey-7"
                      label="Sin ponches"
                    />
                  </td>

                  <td class="text-left">
                    {{ r.classification ?? "Trabajo regular" }}
                  </td>
                </tr>
              </template>

              <!-- EMPTY STATE POR EMPLEADO -->
              <tr v-else>
                <td colspan="4" class="q-pa-none">
                  <div class="employee-empty-state">
                    <q-avatar size="58px" class="employee-empty-icon">
                      <q-icon name="event_busy" size="32px" />
                    </q-avatar>

                    <div class="text-subtitle2 text-weight-bold q-mt-sm">
                      Sin registros en este rango
                    </div>

                    <div class="text-caption text-grey-7 q-mt-xs">
                      Este empleado no tiene días reportados para las fechas
                      seleccionadas.
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import moment from "moment";

defineProps({
  employeesReport: { type: Array, default: () => [] },
  filtros: { type: Object, required: true },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["open-details"]);

const rowClass = (r) => {
  return {
    "row-paid": !!r?.isPaid,
    "cursor-pointer": true,
  };
};

const onRowClick = (r) => {
  emit("open-details", r);
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

const formatPunchStep = (step) => {
  const map = {
    entrada: "Entrada",
    salida_almuerzo: "Salida almuerzo",
    entrada_almuerzo: "Entrada almuerzo",
    salida: "Salida",
  };

  return map[step] || step || "Ponche";
};

const fmt = (date) => {
  if (!date) return "Sin fecha";

  return moment(date).format("DD/MM/YYYY");
};

const dotStyle = (r) => {
  const size = "10px";
  let bg = "#9ca3af";

  if (r.classification == "Vacaciones") {
    bg = "#008cff";
  }

  if (r.classification == "Trabajo regular") {
    bg = r.isLate ? "#ef4444" : "#22c55e";
  }

  return {
    width: size,
    height: size,
    borderRadius: "50%",
    backgroundColor: bg,
    display: "inline-block",
  };
};
</script>

<style scoped>
.report-card {
  border-radius: 18px;
  overflow: hidden;
  background: #ffffff;
}

.empty-state-card {
  border-radius: 22px;
  border: 1px dashed rgba(2, 77, 72, 0.28);
  background: linear-gradient(
    135deg,
    rgba(2, 77, 72, 0.06),
    rgba(255, 255, 255, 1)
  );
}

.empty-state-icon {
  background: rgba(2, 77, 72, 0.1);
}

.empty-state-text {
  max-width: 480px;
}

.employee-empty-state {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(
      circle at center,
      rgba(2, 77, 72, 0.06),
      transparent 60%
    ),
    #ffffff;
  text-align: center;
  padding: 32px 16px;
}

.employee-empty-icon {
  color: #024d48;
  background: rgba(2, 77, 72, 0.08);
}

.table-zebra tbody tr:nth-child(even) {
  background: #fafafa;
}

.sticky-th th {
  position: sticky;
  top: 0;
  z-index: 1;
}

.report-table {
  border-radius: 14px;
  overflow: hidden;
}

.table-dot-column {
  width: 44px;
}

.table-dot-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.punch-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

td,
th {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* PAGADO */
.row-paid {
  background: #f3f4f6 !important;
}

.row-paid td {
  color: #6b7280;
}

.row-paid:hover {
  background: #eef2f7 !important;
}
</style>