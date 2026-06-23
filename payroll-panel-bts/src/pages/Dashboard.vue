<template>
  <div class="q-pa-md dashboard-page">

    <!-- KPIs PRINCIPALES -->
    <div class="row q-col-gutter-md q-mb-md">
      <!-- Skeletons -->
      <div v-if="dashboardLoading && !kpiCards.length" class="col-12">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-3" v-for="n in 8" :key="n">
            <q-card class="kpi-card" flat>
              <q-card-section class="row items-center no-wrap">
                <div class="kpi-icon flex flex-center">
                  <q-skeleton type="QAvatar" />
                </div>
                <div class="q-ml-md col">
                  <q-skeleton type="text" width="80%" class="q-mb-xs" />
                  <q-skeleton type="text" width="50%" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- KPIs reales -->
      <div
        v-else
        class="col-12 col-sm-6 col-md-3"
        v-for="card in kpiCards"
        :key="card.key"
      >
        <q-card class="kpi-card" flat clickable @click="openKpiModal(card)">
          <q-card-section class="row items-center no-wrap">
            <div class="kpi-icon flex flex-center">
              <q-icon :name="card.icon" size="26px" />
            </div>
            <div class="q-ml-md">
              <div class="text-caption text-grey-5 text-uppercase">
                {{ card.label }}
              </div>
              <div class="text-h5 text-weight-bold">
                {{ card.value }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- CUARTA FILA – PONCHES -->
    <div
      class="row q-col-gutter-md q-mb-md"
      v-if="auth.user.rol.code != 'EMPLOYEE'"
    >
      <div class="col-12">
        <q-card flat bordered class="rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">
                Registro de Ponches — Hoy
              </div>
              <div class="text-caption text-grey-6">
                Estado general del personal en turno.
              </div>
            </div>
            <q-btn
              dense
              flat
              icon="visibility"
              label="Ver más"
              @click="router.push('/punch/history')"
            />
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none">
            <q-table
              flat
              :rows="punchesToday"
              :columns="punchesColumns"
              row-key="id"
              dense
              hide-bottom
            >
              <template v-slot:body-cell-employee="props">
                <q-td :props="props">
                  <div class="row items-center no-wrap">
                    <q-avatar size="28px" color="teal" text-color="white">
                      <q-img
                        v-if="!!props.row.img"
                        :src="props.row.img"
                        fit="cover"
                      />
                      <div v-else>
                        {{ props.row.initials }}
                      </div>
                    </q-avatar>
                    <div class="q-ml-sm">
                      <div class="text-body2">{{ props.row.employee }}</div>
                      <div class="text-caption text-grey-6">
                        {{ props.row.rol }}
                      </div>
                    </div>
                  </div>
                </q-td>
              </template>

              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    :color="props.row.statusColor"
                    text-color="white"
                  >
                    {{ props.row.status }}
                  </q-chip>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- TERCERA FILA: ÚLTIMOS REGISTROS -->
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card flat bordered class="rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">
                Últimos candidatos recibidos
              </div>
              <div class="text-caption text-grey-6">
                Resumen de las últimas solicitudes de empleo.
              </div>
            </div>
            <q-btn
              dense
              flat
              icon="visibility"
              label="Ver todos"
              @click="router.push('/reclutamiento')"
            />
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none">
            <q-table
              flat
              :rows="lastCandidates"
              :columns="candidatesColumns"
              row-key="id"
              hide-bottom
              dense
            >
              <template v-slot:body-cell-name="props">
                <q-td :props="props">
                  <div class="row items-center no-wrap">
                    <q-avatar size="28px" color="primary" text-color="white">
                      {{ props.row.initials }}
                    </q-avatar>
                    <div class="q-ml-sm">
                      <div class="text-body2">
                        {{ props.row.name }}
                      </div>
                      <div class="text-caption text-grey-6">
                        {{ props.row.email }}
                      </div>
                    </div>
                  </div>
                </q-td>
              </template>

              <template v-slot:body-cell-position="props">
                <q-td :props="props">
                  <div class="row items-center no-wrap">
                    {{ props.row.position }}
                  </div>
                </q-td>
              </template>

              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    :color="props.row.statusColor"
                    text-color="white"
                  >
                    {{ props.row.status }}
                  </q-chip>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- SEGUNDA FILA: ENTREVISTAS + PROGRESO -->
    <div class="row q-col-gutter-md q-mt-sm">
      <!-- Próximas entrevistas -->
      <div class="col-12 col-md-7">
        <q-card flat bordered class="rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">
                Próximas entrevistas
              </div>
              <div class="text-caption text-grey-6">
                Agenda de las próximas 24–48 horas.
              </div>
            </div>
            <q-btn dense flat icon="event" label="Ver agenda" />
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none">
            <q-list separator>
              <q-item v-for="item in interviews" :key="item.id" clickable>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">
                    {{ item.candidateInitials }}
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label>{{ item.candidate }}</q-item-label>
                  <q-item-label caption>
                    {{ item.position }} • {{ item.mode }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side top>
                  <div class="text-caption text-grey-7 text-right">
                    {{ item.date }}<br />
                    <span class="text-weight-bold">{{ item.time }}</span>
                  </div>
                </q-item-section>
              </q-item>

              <q-item v-if="!interviews.length">
                <q-item-section>
                  <q-item-label caption class="text-grey-6">
                    No hay entrevistas agendadas.
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Progreso & Distribución -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="rounded-borders q-mb-md">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold q-mb-xs">
              Progreso de reclutamiento
            </div>
            <div class="text-caption text-grey-6 q-mb-md">
              Candidatos avanzando en el pipeline actual.
            </div>

            <div class="q-mb-sm">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-grey-7">
                  Porcentaje de candidatos evaluados
                </span>
                <span class="text-caption text-primary text-weight-medium">
                  {{ recruitmentProgress.evaluated }}%
                </span>
              </div>
              <q-linear-progress
                rounded
                size="10px"
                :value="recruitmentProgress.evaluated / 100"
                color="primary"
              />
            </div>

            <div class="q-mt-md">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-grey-7">
                  Expedientes completos
                </span>
                <span class="text-caption text-positive text-weight-medium">
                  {{ recruitmentProgress.completed }}%
                </span>
              </div>
              <q-linear-progress
                rounded
                size="10px"
                :value="recruitmentProgress.completed / 100"
                color="positive"
              />
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="rounded-borders">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-subtitle2 text-weight-bold">
                  Distribución de candidatos
                </div>
                <div class="text-caption text-grey-6">
                  Estado actual del funnel de reclutamiento.
                </div>
              </div>
            </div>

            <div class="q-mt-md">
              <div
                v-for="item in distribution"
                :key="item.label"
                class="q-mb-sm"
              >
                <div class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-grey-7">
                    {{ item.label }}
                  </span>
                  <span class="text-caption text-weight-medium">
                    {{ item.count }} ({{ item.percent }}%)
                  </span>
                </div>
                <q-linear-progress
                  rounded
                  size="8px"
                  :value="item.percent / 100"
                  :color="item.color"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="kpiModal.open" persistent>
      <q-card style="width: 1000px; max-width: 95vw; border-radius: 16px">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-subtitle1 text-weight-bold">
              {{ kpiModal.title }}
            </div>
            <div class="text-caption text-grey-6">
              {{ kpiModal.subtitle }}
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <!-- SOLO para tardanzas -->
            <!-- <q-btn
              v-if="isLateArrivalsModal"
              flat
              color="warning"
              icon="gpp_maybe"
              label="Amonestar todos"
              no-caps
              :disable="kpiModal.loading || !kpiModal.rows.length"
              :loading="warnState.all"
              @click="warnAllLateArrivals"
            >
              <q-tooltip
                >Amonesta a todos los empleados listados como tardíos</q-tooltip
              >
            </q-btn> -->

            <q-btn flat round icon="close" @click="kpiModal.open = false" />
          </div>
        </q-card-section>

        <q-separator />

        <!-- Loading -->
        <q-card-section v-if="kpiModal.loading">
          <q-skeleton type="text" width="30%" class="q-mb-sm" />
          <q-skeleton type="rect" height="220px" />
        </q-card-section>

        <!-- Error -->
        <q-card-section v-else-if="kpiModal.error">
          <q-banner rounded class="bg-red-1 text-red-9">
            {{ kpiModal.error }}
          </q-banner>
        </q-card-section>

        <!-- Table -->
        <q-card-section v-else class="q-pa-none">
          <q-table
            flat
            :rows="kpiModal.rows"
            :columns="kpiModal.columns"
            row-key="_id"
            dense
            :rows-per-page-options="[10, 20, 50, 100]"
          >
            <!-- Botón por fila (SOLO tardanzas) -->
            <template
              v-if="isLateArrivalsModal"
              v-slot:body-cell-action="props"
            >
              <q-td :props="props" class="text-right">
                <q-btn
                  flat
                  dense
                  color="warning"
                  icon="gpp_maybe"
                  label="Amonestar"
                  no-caps
                  :disable="kpiModal.loading"
                  @click.stop="warnLateEmployee(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" @click="kpiModal.open = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { Notify, useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import { buildInitials } from "app/utils";
import { useRouter } from "vue-router";
import { authStore } from "src/stores/auth-store";
import moment from "moment";

const $q = useQuasar();
const auth = authStore();
const router = useRouter();

const dashboardLoading = ref(false);

// KPIs
const kpiCards = ref([]);

// Progreso de reclutamiento
const recruitmentProgress = ref({
  evaluated: 0,
  completed: 0,
});

const distribution = ref([]);
const interviews = ref([]);
const lastCandidates = ref([]);
const punchesToday = ref([]);
const candidatesColumns = [
  {
    name: "name",
    label: "Candidato",
    field: "name",
    align: "left",
  },
  {
    name: "position",
    label: "Puesto",
    field: "position",
    align: "left",
  },
  {
    name: "source",
    label: "Fuente",
    field: "source",
    align: "left",
  },
  {
    name: "status",
    label: "Estado",
    field: "status",
    align: "left",
  },
  {
    name: "createdAt",
    label: "Fecha",
    field: "createdAt",
    align: "right",
  },
];

const punchesColumns = [
  { name: "employee", label: "Empleado", field: "employee", align: "left" },
  { name: "time", label: "Hora de entrada", field: "time", align: "center" },
  { name: "status", label: "Estado", field: "status", align: "center" },
  {
    name: "department",
    label: "Departamento",
    field: "department",
    align: "left",
  },
];

// MODAL

const kpiModal = ref({
  open: false,
  key: "",
  title: "",
  subtitle: "",
  loading: false,
  error: "",
  rows: [],
  columns: [],
});

const KPI_DETAIL_MAP = {
  activeEmployees: {
    title: "Empleados activos",
    subtitle: "Listado del personal marcado como activo.",
    endpoint: "dashboard/getActiveEmployees",
    columns: [
      { name: "name", label: "Nombre", field: "name", align: "left" },
      {
        name: "department",
        label: "Departamento",
        field: "department",
        align: "left",
      },
      {
        name: "jobPosition",
        label: "Puesto de trabajo",
        field: "jobPosition",
        align: "left",
      },
    ],
  },

  newRequests: {
    title: "Solicitudes nuevas",
    subtitle: "Aplicaciones recibidas recientemente.",
    endpoint: "dashboard/getApplicationsToday",
    columns: [
      {
        name: "applicantName",
        label: "Candidato",
        field: "applicantName",
        align: "left",
      },
      { name: "position", label: "Puesto", field: "position", align: "left" },
      { name: "form", label: "Fuente", field: "form", align: "left" },
      { name: "createdAt", label: "Fecha", field: "createdAt", align: "left" },
    ],
  },

  todayInterviews: {
    title: "Entrevistas de hoy",
    subtitle: "Agenda del día (entrevistas programadas).",
    endpoint: "dashboard/getInterviewsToday",
    columns: [
      {
        name: "candidate",
        label: "Candidato",
        field: "candidate",
        align: "left",
      },
      { name: "position", label: "Puesto", field: "position", align: "left" },
      { name: "time", label: "Hora", field: "time", align: "left" },
      { name: "mode", label: "Modalidad", field: "mode", align: "left" },
    ],
  },

  lateArrivals: {
    title: "Llegadas tarde",
    subtitle: "Empleados que registraron entrada fuera de horario.",
    endpoint: "dashboard/getLateEmployees",

    // 👇 AJUSTA ESTOS ENDPOINTS A LOS REALES DE TU API
    warnEndpoint: "disciplinary/createDisciplinaryAction", // POST: amonestar 1
    warnAllEndpoint: "disciplinary/createDisciplinaryAction/bulk", // POST: amonestar varios

    columns: [
      { name: "employee", label: "Empleado", field: "employee", align: "left" },
      {
        name: "department",
        label: "Departamento",
        field: "department",
        align: "left",
      },
      {
        name: "scheduled",
        label: "Hora esperada",
        field: "scheduled",
        align: "left",
      },
      { name: "actual", label: "Hora real", field: "actual", align: "left" },
      {
        name: "minutesLate",
        label: "Min tarde",
        field: "minutesLate",
        align: "right",
      },
      { name: "action", label: "Acción", field: "action", align: "right" },
    ],
  },

  absentEmployees: {
    title: "Ausentes",
    subtitle: "Personal sin ponche/entrada registrada hoy.",
    endpoint: "dashboard/getAbsentEmployees",
    columns: [
      { name: "employee", label: "Empleado", field: "employee", align: "left" },
      {
        name: "department",
        label: "Departamento",
        field: "department",
        align: "left",
      },
      // { name: "reason", label: "Motivo", field: "reason", align: "left" },
      // { name: "status", label: "Estado", field: "status", align: "left" },
    ],
  },

  errorReports: {
    title: "Reportes de errores",
    subtitle: "Incidencias reportadas por los usuarios (pendientes).",
    endpoint: "dashboard/getErrorsReports",
    columns: [
      {
        name: "patient",
        label: "Paciente",
        field: (row) => row.comercial.MemberFullname || "—",
        align: "left",
      },
      {
        name: "createdBy",
        label: "Sometido por",
        field: (row) => row.createdBy.name || "—",
        align: "left",
      },
      {
        name: "createdAt",
        label: "Fecha",
        field: "createdAt",
        align: "right",
        field: (row) => moment(row.createdAt).format("LLL") || "—",
      },
      { name: "action", label: "", field: "action", align: "right" },
    ],
  },

  pendingPemissions: {
    title: "Solicitudes pendientes de permisos",
    subtitle: "Solicitudes de licencias o permisos (pendientes).",
    endpoint: "dashboard/getPendingPermissions",
    columns: [
      {
        name: "user",
        label: "Empleado",
        field: (row) => row.user.name || "—",
        align: "left",
      },
      {
        name: "permissionType",
        label: "Tipo de permiso",
        field: (row) => row.permissionType.name || "—",
        align: "left",
      },
      {
        name: "category",
        label: "Categoría",
        field: "category",
        align: "right",
      },
      // { name: "action", label: "", field: "action", align: "right" },
      { name: "status", label: "Estado", field: "status", align: "right" },
      {
        name: "createdAt",
        label: "Fecha",
        field: "createdAt",
        align: "right",
        field: (row) => moment(row.createdAt).format("LLL") || "—",
      },
    ],
  },
};

const openKpiModal = async (card) => {
  // card.key debe coincidir con las keys de KPI_DETAIL_MAP
  const cfg = KPI_DETAIL_MAP[card.key];

  if (!cfg) {
    return;
    Notify.create({
      type: "warning",
      message: `No hay configuración de detalle para: ${card.key}`,
    });
  }

  kpiModal.value.open = true;
  kpiModal.value.key = card.key;
  kpiModal.value.title = cfg.title;
  kpiModal.value.subtitle = cfg.subtitle;
  kpiModal.value.columns = cfg.columns;
  kpiModal.value.rows = [];
  kpiModal.value.error = "";
  kpiModal.value.loading = true;

  try {
    const resp = await methodsHttp.getApi(cfg.endpoint);

    if (!resp?.ok) {
      throw new Error(resp?.mensaje || "No se pudieron cargar los detalles");
    }

    // Soporta varias formas de payload
    const rows = resp.rows || resp.data || resp.items || [];
    kpiModal.value.rows = Array.isArray(rows) ? rows : [];
  } catch (e) {
    console.error(e);
    kpiModal.value.error = e?.message || "Error cargando detalle";
  } finally {
    kpiModal.value.loading = false;
  }
};

const loadDashboard = async () => {
  dashboardLoading.value = true;
  try {
    const resp = await methodsHttp.getApi("dashboard");

    if (!resp.ok) {
      throw new Error(resp.mensaje || "No se pudo cargar el dashboard");
    }

    // KPIs
    kpiCards.value = resp.kpis || [];

    // Progreso
    recruitmentProgress.value = {
      evaluated: resp.recruitmentProgress?.evaluated ?? 0,
      completed: resp.recruitmentProgress?.completed ?? 0,
    };

    // Distribución
    distribution.value = resp.distribution || [];

    // Entrevistas
    interviews.value = (resp.interviews || []).map((it) => ({
      id: it.id,
      candidate: it.candidate,
      candidateInitials: it.candidateInitials || buildInitials(it.candidate),
      position: it.position,
      mode: it.mode,
      date: it.date,
      time: it.time,
    }));

    // Últimos candidatos
    lastCandidates.value = (resp.lastCandidates || []).map((c) => ({
      id: c.id,
      initials: c.initials || buildInitials(c.name),
      name: c.name,
      email: c.email,
      position: c.position,
      source: c.source,
      status: c.status,
      statusColor: c.statusColor || "primary",
      createdAt: c.createdAt,
    }));

    // Ponches de hoy
    punchesToday.value = resp.punchesToday || [];
  } catch (error) {
    console.error("Error loadDashboard:", error);
    Notify.create({
      type: "negative",
      message: "Error al cargar el dashboard",
    });
  } finally {
    dashboardLoading.value = false;
  }
};

const warnState = ref({
  all: false,
  byId: {}, // { [id]: true/false }
});

const isLateArrivalsModal = computed(
  () => kpiModal.value.key === "lateArrivals",
);

const warnLateEmployee = async (row) => {
  const cfg = KPI_DETAIL_MAP[kpiModal.value.key];

  if (!cfg?.warnEndpoint) {
    return Notify.create({
      type: "warning",
      message: "No hay endpoint configurado para amonestar (warnEndpoint).",
    });
  }

  const ok = await new Promise((resolve) => {
    $q.dialog({
      title: "Confirmar amonestación",
      message: `¿Quieres enviar una amonestación a "${
        row.employee || "este empleado"
      }"?`,
      cancel: true,
      persistent: true,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });

  if (!ok) return;

  try {
    const payload = {
      category: "LATE_ARRIVAL",
      createdVia: "DASHBOARD",
      userId: row.employeeId,
      notes: "Amonestación creada desde el dashboard",
      preventDuplicate: true,
      workDateString: moment().format("YYYY-MM-DD"),
    };

    const resp = await methodsHttp.postApi(cfg.warnEndpoint, payload);

    if (!resp?.ok)
      throw new Error(resp?.mensaje || "No se pudo enviar la amonestación.");

    Notify.create({ type: "positive", message: "Amonestación enviada." });
  } catch (e) {
    Notify.create({
      type: "negative",
      message: e?.message || "Error enviando amonestación.",
    });
  }
};

const warnAllLateArrivals = async () => {
  const cfg = KPI_DETAIL_MAP[kpiModal.value.key];

  if (!cfg?.warnAllEndpoint) {
    return Notify.create({
      type: "warning",
      message:
        "No hay endpoint configurado para amonestar en lote (warnAllEndpoint).",
    });
  }

  const items = (kpiModal.value.rows || [])
    .map((r) => {
      return {
        userId: r.employeeId,
        punchHistoryId: r._id,
      };
    })
    .filter(Boolean);

  if (!items.length) {
    return Notify.create({
      type: "warning",
      message: "No hay usuarios válidos para amonestar.",
    });
  }

  const ok = await new Promise((resolve) => {
    $q.dialog({
      title: "Confirmar amonestación masiva",
      message: `¿Enviar amonestación a ${items.length} empleados por tardanza?`,
      cancel: true,
      persistent: true,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });

  if (!ok) return;

  try {
    warnState.value.all = true;

    // 👇 AJUSTA EL BODY SEGÚN TU BACKEND
    const payload = {
      items,
    };

    const resp = await methodsHttp.postApi(cfg.warnAllEndpoint, payload);

    if (!resp?.ok)
      throw new Error(
        resp?.mensaje || "No se pudo enviar la amonestación masiva.",
      );

    Notify.create({ type: "positive", message: "Amonestaciones enviadas." });

    // opcional: refrescar la tabla
    // await openKpiModal({ key: "lateArrivals" })
  } catch (e) {
    Notify.create({
      type: "negative",
      message: e?.message || "Error enviando amonestaciones.",
    });
  } finally {
    warnState.value.all = false;
  }
};

/** INIT */
onMounted(() => {
  loadDashboard();
});
</script>

<style scoped>


/* KPIs */
.kpi-card {
  border-radius: 16px;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: white;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.35);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.45);
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.2);
}

/* Cards */
.rounded-borders {
  border-radius: 16px;
}
</style>
