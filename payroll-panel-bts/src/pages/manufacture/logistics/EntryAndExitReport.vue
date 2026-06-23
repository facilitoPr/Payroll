<template>
  <q-page class="q-pa-md logistics-reports-page">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Logística · Reportes de entrada y salida</div>
        <div class="text-grey-7">
          Consulta de registros de acceso de camiones, carga y validaciones.
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-btn
            outline
            color="primary"
            icon="refresh"
            label="Refrescar"
            @click="fakeRefresh"
          />
          <q-btn
            unelevated
            color="primary"
            icon="download"
            label="Exportar"
            @click="fakeExport"
          />
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- KPIS -->
    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="item in reportKpis"
        :key="item.key"
        class="col-12 col-sm-6 col-lg-3"
      >
        <q-card bordered class="bg-white rounded-borders kpi-card">
          <q-card-section class="row items-center q-gutter-md">
            <q-avatar :icon="item.icon" color="primary" text-color="white" size="48px" />
            <div class="col">
              <div class="text-caption text-grey-7">{{ item.label }}</div>
              <div class="text-h6 text-weight-bold">{{ item.value }}</div>
              <div class="text-caption" :class="item.class">
                {{ item.helper }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- FILTERS -->
    <q-card bordered class="bg-white rounded-borders q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-subtitle1 text-weight-bold">Filtros</div>
            <div class="text-caption text-grey-7">
              Filtra por movimiento, estatus, empresa, carga o texto libre.
            </div>
          </div>

          <q-btn
            flat
            color="primary"
            icon="filter_alt_off"
            label="Limpiar filtros"
            @click="clearFilters"
          />
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              outlined
              dense
              debounce="250"
              v-model="filters.search"
              label="Buscar"
              placeholder="Chofer, placa, empresa, referencia..."
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-select
              outlined
              dense
              v-model="filters.recordType"
              :options="recordTypeOptions"
              label="Movimiento"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-select
              outlined
              dense
              v-model="filters.status"
              :options="statusOptions"
              label="Estatus"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-select
              outlined
              dense
              v-model="filters.company"
              :options="companyOptions"
              label="Empresa"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-select
              outlined
              dense
              v-model="filters.cargoType"
              :options="cargoOptions"
              label="Tipo de carga"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              outlined
              dense
              v-model="filters.dateFrom"
              label="Fecha desde"
              type="date"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              outlined
              dense
              v-model="filters.dateTo"
              label="Fecha hasta"
              type="date"
            />
          </div>

          <div class="col-12 col-md-6 flex items-end">
            <div class="row q-gutter-sm full-width justify-end">
              <q-btn
                outline
                color="primary"
                icon="search"
                label="Aplicar filtros"
                @click="fakeApplyFilters"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- TABLE -->
    <q-card bordered class="bg-white rounded-borders">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Listado de registros</div>
          <div class="text-caption text-grey-7">
            {{ filteredRows.length }} resultados encontrados.
          </div>
        </div>

        <q-badge outline color="primary">
          Actualizado hoy
        </q-badge>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <q-table
          flat
          :rows="filteredRows"
          :columns="columns"
          row-key="id"
          :rows-per-page-options="[10, 20, 50]"
          :pagination="{ rowsPerPage: 10 }"
          class="logistics-table"
        >
          <template #body-cell-recordType="props">
            <q-td :props="props">
              <q-badge :color="recordTypeColor(props.row.recordType)" class="q-px-sm">
                {{ props.row.recordType }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="statusColor(props.row.status)" class="q-px-sm">
                {{ props.row.status }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-driver="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.driver }}</div>
              <div class="text-caption text-grey-7">{{ props.row.company }}</div>
            </q-td>
          </template>

          <template #body-cell-vehicle="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.vehicleType }}</div>
              <div class="text-caption text-grey-7">Placa: {{ props.row.plate }}</div>
            </q-td>
          </template>

          <template #body-cell-dateTime="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.date }}</div>
              <div class="text-caption text-grey-7">{{ props.row.time }}</div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                dense
                flat
                round
                color="primary"
                icon="visibility"
                @click="openDetails(props.row)"
              >
                <q-tooltip>Ver detalle</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template #no-data>
            <div class="q-pa-lg text-grey-7">
              No hay registros para mostrar con los filtros actuales.
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- DETAIL DIALOG -->
    <q-dialog v-model="detailDialog">
      <q-card style="width: 100%; max-width: 920px; border-radius: 18px;">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold">Detalle del registro</div>
            <div class="text-caption text-grey-7">
              Información general del acceso logístico.
            </div>
          </div>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedRow">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
              <q-card flat bordered class="rounded-borders">
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <div class="detail-label">Código</div>
                      <div class="detail-value">{{ selectedRow.code }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Movimiento</div>
                      <div class="detail-value">
                        <q-badge :color="recordTypeColor(selectedRow.recordType)">
                          {{ selectedRow.recordType }}
                        </q-badge>
                      </div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Chofer</div>
                      <div class="detail-value">{{ selectedRow.driver }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Empresa</div>
                      <div class="detail-value">{{ selectedRow.company }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Vehículo</div>
                      <div class="detail-value">{{ selectedRow.vehicleType }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Placa</div>
                      <div class="detail-value">{{ selectedRow.plate }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Fecha</div>
                      <div class="detail-value">{{ selectedRow.date }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Hora</div>
                      <div class="detail-value">{{ selectedRow.time }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Tipo de carga</div>
                      <div class="detail-value">{{ selectedRow.cargoType }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Referencia</div>
                      <div class="detail-value">{{ selectedRow.reference }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Guardia</div>
                      <div class="detail-value">{{ selectedRow.guard }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Estatus</div>
                      <div class="detail-value">
                        <q-badge :color="statusColor(selectedRow.status)">
                          {{ selectedRow.status }}
                        </q-badge>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-4">
              <q-card flat bordered class="rounded-borders">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-bold">Notas</div>
                  <div class="text-caption text-grey-7 q-mt-xs">
                    {{ selectedRow.notes || "Sin observaciones." }}
                  </div>

                  <q-separator class="q-my-md" />

                  <div class="text-subtitle2 text-weight-bold">Flags de validación</div>

                  <div class="q-mt-sm q-gutter-sm">
                    <q-badge :color="selectedRow.docsVerified ? 'positive' : 'negative'">
                      {{ selectedRow.docsVerified ? "Documentos verificados" : "Documentos no verificados" }}
                    </q-badge>

                    <q-badge :color="selectedRow.hasCompanion ? 'orange' : 'grey-7'">
                      {{ selectedRow.hasCompanion ? "Con acompañante" : "Sin acompañante" }}
                    </q-badge>

                    <q-badge :color="selectedRow.hazardous ? 'negative' : 'positive'">
                      {{ selectedRow.hazardous ? "Carga peligrosa" : "Carga estándar" }}
                    </q-badge>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat color="grey-8" label="Cerrar" v-close-popup />
          <q-btn
            unelevated
            color="primary"
            icon="print"
            label="Imprimir"
            @click="fakePrint"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();

const detailDialog = ref(false);
const selectedRow = ref(null);

const filters = reactive({
  search: "",
  recordType: "Todos",
  status: "Todos",
  company: "Todas",
  cargoType: "Todos",
  dateFrom: "",
  dateTo: "",
});

const rows = ref([
  {
    id: "r1",
    code: "ACC-0001",
    date: "2026-03-17",
    time: "08:14 AM",
    driver: "Carlos Rivera",
    company: "Express Boricua",
    vehicleType: "Camión Cerrado",
    plate: "E-34567",
    recordType: "Entrada",
    status: "Aprobado",
    cargoType: "Arroz",
    reference: "OC-2026-0142",
    guard: "Miguel Ángel Soto",
    notes: "Ingreso autorizado. Sello y documentación validados.",
    docsVerified: true,
    hasCompanion: false,
    hazardous: false,
  },
  {
    id: "r2",
    code: "ACC-0002",
    date: "2026-03-17",
    time: "09:02 AM",
    driver: "Pedro Castillo",
    company: "Ruta Industrial SRL",
    vehicleType: "Camión Refrigerado",
    plate: "R-10292",
    recordType: "Entrada",
    status: "En proceso",
    cargoType: "Materiales",
    reference: "PO-33920",
    guard: "Miguel Ángel Soto",
    notes: "Pendiente validación completa de temperatura.",
    docsVerified: true,
    hasCompanion: true,
    hazardous: false,
  },
  {
    id: "r3",
    code: "ACC-0003",
    date: "2026-03-17",
    time: "09:48 AM",
    driver: "Javier Núñez",
    company: "North Dock Logistics",
    vehicleType: "Plataforma",
    plate: "A-88412",
    recordType: "Salida",
    status: "Aprobado",
    cargoType: "Equipo",
    reference: "SAL-20014",
    guard: "Saúl González",
    notes: "Salida completada sin incidencias.",
    docsVerified: true,
    hasCompanion: false,
    hazardous: false,
  },
  {
    id: "r4",
    code: "ACC-0004",
    date: "2026-03-16",
    time: "04:15 PM",
    driver: "Luis Moronta",
    company: "Atlantic Cargo",
    vehicleType: "Furgón",
    plate: "L-78211",
    recordType: "Entrada",
    status: "Rechazado",
    cargoType: "Químicos",
    reference: "CHEM-555",
    guard: "Miguel Ángel Soto",
    notes: "Rechazado por inconsistencias en documentación.",
    docsVerified: false,
    hasCompanion: false,
    hazardous: true,
  },
  {
    id: "r5",
    code: "ACC-0005",
    date: "2026-03-16",
    time: "02:30 PM",
    driver: "Rafael Cruz",
    company: "Express Boricua",
    vehicleType: "Camión Cerrado",
    plate: "E-99102",
    recordType: "Salida",
    status: "Aprobado con observación",
    cargoType: "Granos",
    reference: "GR-9920",
    guard: "Diana Santiago",
    notes: "Se detectó retraso en documentación de salida.",
    docsVerified: true,
    hasCompanion: true,
    hazardous: false,
  },
  {
    id: "r6",
    code: "ACC-0006",
    date: "2026-03-15",
    time: "11:10 AM",
    driver: "Mario Sánchez",
    company: "Logística del Este",
    vehicleType: "Camión Tolva",
    plate: "T-10288",
    recordType: "Entrada",
    status: "Aprobado",
    cargoType: "Materiales",
    reference: "MAT-7781",
    guard: "Saúl González",
    notes: "Registro completado correctamente.",
    docsVerified: true,
    hasCompanion: false,
    hazardous: false,
  },
]);

const columns = [
  { name: "code", label: "Código", field: "code", align: "left", sortable: true },
  { name: "dateTime", label: "Fecha / Hora", field: "date", align: "left", sortable: true },
  { name: "driver", label: "Chofer / Empresa", field: "driver", align: "left", sortable: true },
  { name: "vehicle", label: "Vehículo", field: "vehicleType", align: "left", sortable: true },
  { name: "recordType", label: "Movimiento", field: "recordType", align: "left", sortable: true },
  { name: "status", label: "Estatus", field: "status", align: "left", sortable: true },
  { name: "cargoType", label: "Carga", field: "cargoType", align: "left", sortable: true },
  { name: "guard", label: "Guardia", field: "guard", align: "left", sortable: true },
  { name: "actions", label: "Acciones", field: "actions", align: "center" },
];

const recordTypeOptions = ["Todos", "Entrada", "Salida"];
const statusOptions = ["Todos", "Aprobado", "Aprobado con observación", "En proceso", "Rechazado"];
const companyOptions = ["Todas", "Express Boricua", "Atlantic Cargo", "North Dock Logistics", "Ruta Industrial SRL", "Logística del Este"];
const cargoOptions = ["Todos", "Arroz", "Granos", "Materiales", "Químicos", "Equipo"];

const filteredRows = computed(() => {
  return rows.value.filter((row) => {
    const searchText = filters.search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      row.code.toLowerCase().includes(searchText) ||
      row.driver.toLowerCase().includes(searchText) ||
      row.company.toLowerCase().includes(searchText) ||
      row.plate.toLowerCase().includes(searchText) ||
      row.reference.toLowerCase().includes(searchText) ||
      row.guard.toLowerCase().includes(searchText);

    const matchesRecordType =
      filters.recordType === "Todos" || row.recordType === filters.recordType;

    const matchesStatus =
      filters.status === "Todos" || row.status === filters.status;

    const matchesCompany =
      filters.company === "Todas" || row.company === filters.company;

    const matchesCargo =
      filters.cargoType === "Todos" || row.cargoType === filters.cargoType;

    const matchesDateFrom =
      !filters.dateFrom || row.date >= filters.dateFrom;

    const matchesDateTo =
      !filters.dateTo || row.date <= filters.dateTo;

    return (
      matchesSearch &&
      matchesRecordType &&
      matchesStatus &&
      matchesCompany &&
      matchesCargo &&
      matchesDateFrom &&
      matchesDateTo
    );
  });
});

const reportKpis = computed(() => {
  const totalEntries = filteredRows.value.filter((r) => r.recordType === "Entrada").length;
  const totalExits = filteredRows.value.filter((r) => r.recordType === "Salida").length;
  const inProcess = filteredRows.value.filter((r) => r.status === "En proceso").length;
  const rejected = filteredRows.value.filter((r) => r.status === "Rechazado").length;

  return [
    {
      key: "entries",
      icon: "login",
      label: "Entradas",
      value: totalEntries,
      helper: "Movimientos de ingreso",
      class: "text-primary",
    },
    {
      key: "exits",
      icon: "logout",
      label: "Salidas",
      value: totalExits,
      helper: "Movimientos de egreso",
      class: "text-positive",
    },
    {
      key: "process",
      icon: "pending_actions",
      label: "En proceso",
      value: inProcess,
      helper: "Pendientes de validación",
      class: "text-warning",
    },
    {
      key: "rejected",
      icon: "gpp_bad",
      label: "Rechazados",
      value: rejected,
      helper: "Con incidencias o bloqueo",
      class: "text-negative",
    },
  ];
});

function recordTypeColor(type) {
  switch (type) {
    case "Entrada":
      return "green";
    case "Salida":
      return "orange";
    default:
      return "grey";
  }
}

function statusColor(status) {
  switch (status) {
    case "Aprobado":
      return "positive";
    case "Aprobado con observación":
      return "warning";
    case "En proceso":
      return "blue";
    case "Rechazado":
      return "negative";
    default:
      return "grey";
  }
}

function openDetails(row) {
  selectedRow.value = row;
  detailDialog.value = true;
}

function clearFilters() {
  filters.search = "";
  filters.recordType = "Todos";
  filters.status = "Todos";
  filters.company = "Todas";
  filters.cargoType = "Todos";
  filters.dateFrom = "";
  filters.dateTo = "";

  $q.notify({
    color: "primary",
    message: "Filtros limpiados.",
    position: "top",
  });
}

function fakeApplyFilters() {
  $q.notify({
    color: "primary",
    message: "Filtros aplicados.",
    position: "top",
  });
}

function fakeRefresh() {
  $q.notify({
    color: "primary",
    message: "Reporte actualizado.",
    position: "top",
  });
}

function fakeExport() {
  $q.notify({
    color: "positive",
    message: "Exportación simulada correctamente.",
    position: "top",
  });
}

function fakePrint() {
  $q.notify({
    color: "primary",
    message: "Impresión simulada.",
    position: "top",
  });
}
</script>

<style scoped>
.logistics-reports-page {
  background: #f7f8fc;
  min-height: 100%;
}

.rounded-borders {
  border-radius: 16px;
}

.kpi-card {
  min-height: 96px;
}

.logistics-table :deep(.q-table__container) {
  border-radius: 16px;
}

.detail-label {
  font-size: 11px;
  color: #7a7f8a;
  font-weight: 700;
  letter-spacing: 0.4px;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 15px;
  color: #1f2530;
  font-weight: 600;
}

@media (max-width: 768px) {
  .detail-value {
    font-size: 14px;
  }
}
</style>