<template>
  <div>
    <!-- HEADER (PageHeaderCard) -->
    <PageHeaderCard
      :title="isAdminView ? 'Amonestaciones por tardanza' : 'Mis amonestaciones por tardanza'"
      :subtitle="isAdminView
        ? 'Filtra por empleado y rango. Exporta o imprime.'
        : 'Historial de tus amonestaciones. Exporta o imprime.'"
      icon="gpp_maybe"
    >
      <template #actions>
        <!-- Empleado (userId) - solo admin -->
        <q-input
          v-if="isAdminView"
          v-model="filters.userId"
          label="Empleado (userId)"
          outlined
          dense
          color="primary"
          clearable
          class="header-field header-field--wide"
        >
          <template #prepend>
            <q-icon name="person_search" color="primary" />
          </template>
        </q-input>

        <!-- Fecha inicio -->
        <q-input
          outlined
          dense
          v-model="fromFormatted"
          class="header-field"
          label="Fecha inicio"
          clearable
          @clear="filters.from = ''"
        >
          <template #prepend>
            <q-icon
              name="schedule"
              class="cursor-pointer"
              @click="filters.from = moment().format('YYYY-MM-DD')"
            />
          </template>

          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date minimal v-model="filters.from" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Cerrar" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <!-- Fecha fin -->
        <q-input
          outlined
          dense
          v-model="toFormatted"
          class="header-field"
          label="Fecha fin (opcional)"
          clearable
          @clear="filters.to = ''"
        >
          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date minimal v-model="filters.to" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Cerrar" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <!-- Solo sin acuse -->
        <q-toggle
          v-model="filters.onlyPendingAck"
          label="Solo sin acuse"
          dense
          class="header-field"
        />

        <!-- Buscar -->
        <q-btn
          color="primary"
          unelevated
          icon="search"
          label="Buscar"
          class="header-btn"
          :loading="loading"
          @click="reload(true)"
        />

        <!-- Acciones -->
        <q-btn
          color="primary"
          outline
          icon="more_vert"
          label="Acciones"
          class="header-btn"
          :loading="loading"
        >
          <q-menu>
            <q-list style="min-width: 240px">
              <q-item clickable v-close-popup @click="exportCSV()">
                <q-item-section avatar>
                  <q-icon name="table_view" />
                </q-item-section>
                <q-item-section>Exportar Excel (CSV)</q-item-section>
              </q-item>

              <!-- <q-item clickable v-close-popup @click="printTable()">
                <q-item-section avatar>
                  <q-icon name="print" />
                </q-item-section>
                <q-item-section>Imprimir</q-item-section>
              </q-item> -->
            </q-list>
          </q-menu>
        </q-btn>
      </template>
    </PageHeaderCard>

    <!-- TABLA -->
    <q-card flat bordered class="rounded-borders">
      <q-table
        ref="tableRef"
        flat
        :rows="rows"
        :columns="columns"
        row-key="_id"
        :loading="loading"
        v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 50, 100]"
        @request="onRequest"
      >
        <!-- empleado (solo admin) -->
        <template v-if="isAdminView" v-slot:body-cell-user="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar size="28px" color="primary" text-color="white">
                {{ getInitials(props.row?.userSnapshot?.name || 'U') }}
              </q-avatar>
              <div class="q-ml-sm">
                <div class="text-body2">
                  {{ props.row?.userSnapshot?.name || 'Empleado' }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ props.row?.userSnapshot?.email || '' }}
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <!-- tardanza -->
        <template v-slot:body-cell-minutesLate="props">
          <q-td :props="props" class="text-right">
            <q-chip dense color="warning" text-color="black">
              {{ fmtLate(props.row?.evidence?.minutesLate) }}
            </q-chip>
          </q-td>
        </template>

        <!-- acuse -->
        <template v-slot:body-cell-ack="props">
          <q-td :props="props">
            <q-chip
              v-if="props.row?.acknowledgedAt"
              dense
              color="positive"
              text-color="white"
              icon="check_circle"
            >
              Acusada
            </q-chip>
            <q-chip v-else dense color="grey-6" text-color="white" icon="schedule">
              Pendiente
            </q-chip>
          </q-td>
        </template>

        <!-- acciones -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <div class="row items-center justify-end q-gutter-xs">
              <q-btn flat dense icon="visibility" @click.stop="openDetail(props.row)">
                <q-tooltip>Ver detalle</q-tooltip>
              </q-btn>

              <!-- Acuse: solo empleado -->
              <q-btn
                v-if="canAcknowledge && !props.row?.acknowledgedAt"
                flat
                dense
                color="positive"
                icon="task_alt"
                @click.stop="acknowledge(props.row)"
              >
                <q-tooltip>Acusar recibo</q-tooltip>
              </q-btn>

              <!-- Delete: solo admin -->
              <q-btn
                v-if="isAdminView"
                flat
                dense
                color="negative"
                icon="delete"
                @click.stop="removeAction(props.row)"
              >
                <q-tooltip>Borrar</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <template v-slot:no-data>
          <div class="full-width row flex-center q-pa-lg text-grey-7">
            <q-icon name="info" class="q-mr-sm" />
            No hay amonestaciones.
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- DETALLE -->
    <q-dialog v-model="detail.open">
      <q-card style="width: 900px; max-width: 95vw; border-radius: 16px">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-subtitle1 text-weight-bold">Detalle</div>
            <div class="text-caption text-grey-6">
              Amonestación por tardanza
            </div>
          </div>
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="detail.loading">
          <q-skeleton type="text" width="35%" class="q-mb-sm" />
          <q-skeleton type="rect" height="220px" />
        </q-card-section>

        <q-card-section v-else-if="detail.error">
          <q-banner rounded class="bg-red-1 text-red-9">
            {{ detail.error }}
          </q-banner>
        </q-card-section>

        <q-card-section v-else>
          <div class="row q-col-gutter-md">
            <!-- Empleado (solo admin) -->
            <div class="col-12 col-md-6" v-if="isAdminView">
              <q-card flat bordered class="rounded-borders">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-bold q-mb-sm">Empleado</div>
                  <div class="text-body2">{{ detail.item?.userSnapshot?.name || "-" }}</div>
                  <div class="text-caption text-grey-7">{{ detail.item?.userSnapshot?.email || "" }}</div>
                  <div class="text-caption text-grey-7 q-mt-sm">
                    {{ detail.item?.userSnapshot?.department?.name || "-" }}
                    <span v-if="detail.item?.userSnapshot?.jobPosition?.name">
                      • {{ detail.item.userSnapshot.jobPosition.name }}
                    </span>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Evidencia -->
            <div class="col-12" :class="isAdminView ? 'col-md-6' : ''">
              <q-card flat bordered class="rounded-borders">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-bold q-mb-sm">Evidencia</div>

                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-caption text-grey-7">Fecha laboral</span>
                    <span class="text-body2 text-weight-medium">
                      {{ detail.item?.workDateString || "-" }}
                    </span>
                  </div>

                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-caption text-grey-7">Hora esperada</span>
                    <span class="text-body2">{{ fmtDateTime(detail.item?.evidence?.scheduledAt) }}</span>
                  </div>

                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-caption text-grey-7">Hora real</span>
                    <span class="text-body2">{{ fmtDateTime(detail.item?.evidence?.actualAt) }}</span>
                  </div>

                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-caption text-grey-7">Minutos tarde</span>
                    <span class="text-body2 text-weight-bold">
                      {{ fmtLate(detail.item?.evidence?.minutesLate) }}
                    </span>
                  </div>

                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-caption text-grey-7">Minutos gracia</span>
                    <span class="text-body2">{{ detail.item?.evidence?.graceMinutes ?? 0 }}</span>
                  </div>

                  <div class="q-mt-md">
                    <div class="text-caption text-grey-7">Notas</div>
                    <div class="text-body2">{{ detail.item?.notes || "-" }}</div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Auditoría (solo admin) -->
            <div class="col-12" v-if="isAdminView">
              <q-card flat bordered class="rounded-borders">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-bold q-mb-sm">Auditoría</div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-4">
                      <div class="text-caption text-grey-7">Creado por</div>
                      <div class="text-body2">{{ detail.item?.createdBy || "-" }}</div>
                    </div>
                    <div class="col-12 col-md-4">
                      <div class="text-caption text-grey-7">IP</div>
                      <div class="text-body2">{{ detail.item?.audit?.ip || "-" }}</div>
                    </div>
                    <div class="col-12 col-md-4">
                      <div class="text-caption text-grey-7">Vía</div>
                      <div class="text-body2">{{ detail.item?.audit?.createdVia || "-" }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useQuasar, Notify } from "quasar";
import moment from "moment";
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";
import PageHeaderCard from "src/components/PageHeaderCard.vue"; // ajusta si aplica

const props = defineProps({
  mode: { type: String, default: "auto" }, // "mine" | "admin" | "auto"
});

const $q = useQuasar();
const auth = authStore();

const isAdminView = computed(() => {
  if (props.mode === "admin") return true;
  if (props.mode === "mine") return false;
  const code = String(auth?.user?.rol?.code || "").toUpperCase();
  return ["ADMIN", "SUPERADMIN", "RRHH"].includes(code);
});

const canAcknowledge = computed(() => {
  const code = String(auth?.user?.rol?.code || "").toUpperCase();
  return code === "EMPLOYEE" && !isAdminView.value;
});

const filters = ref({
  userId: "",
  from: "",
  to: "",
  onlyPendingAck: false,
});

const fromFormatted = computed({
  get: () => filters.value.from,
  set: (v) => (filters.value.from = v || ""),
});

const toFormatted = computed({
  get: () => filters.value.to,
  set: (v) => (filters.value.to = v || ""),
});

const loading = ref(false);
const rows = ref([]);

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

const columns = computed(() => {
  const cols = [];

  if (isAdminView.value) {
    cols.push({ name: "user", label: "Empleado", field: "user", align: "left" });
  }

  cols.push(
    { name: "workDateString", label: "Fecha", field: "workDateString", align: "left" },
    { name: "minutesLate", label: "Tardanza", field: (r) => r?.evidence?.minutesLate, align: "right" },
    { name: "ack", label: "Acuse", field: "ack", align: "left" },
    { name: "createdAt", label: "Creada", field: "createdAt", align: "left" },
    { name: "actions", label: "", field: "actions", align: "right" }
  );

  return cols;
});

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

function fmtLate(mins) {
  const m = Number(mins || 0);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r}m`;
  return `${h}h ${r}m`;
}

function fmtDateTime(d) {
  if (!d) return "-";
  return moment(d).format("YYYY-MM-DD HH:mm");
}

function buildQueryParams(pag = pagination.value) {
  const limit = pag.rowsPerPage;
  const initial = (pag.page - 1) * pag.rowsPerPage;

  const params = { limit, initial, category: "LATE_ARRIVAL" };

  if (isAdminView.value) {
    if (filters.value.userId) params.userId = filters.value.userId;
  } else {
    params.userId = String(auth?.user?._id || auth?.user?.id || "");
  }

  if (filters.value.from) params.from = filters.value.from;
  if (filters.value.to) params.to = filters.value.to;

  return params;
}

async function fetchRows(pag = pagination.value) {
  loading.value = true;
  try {
    const params = buildQueryParams(pag);
    const qs = new URLSearchParams(params).toString();

    const resp = await methodsHttp.getApi(`disciplinary?${qs}`);
    if (!resp?.ok) throw new Error(resp?.mensaje || "No se pudo cargar");

    let list = Array.isArray(resp.items) ? resp.items : [];
    if (filters.value.onlyPendingAck) list = list.filter((x) => !x.acknowledgedAt);

    rows.value = list;
    pagination.value.rowsNumber = Number(resp.total || 0);
  } catch (e) {
    Notify.create({ type: "negative", message: e?.message || "Error cargando amonestaciones" });
    rows.value = [];
    pagination.value.rowsNumber = 0;
  } finally {
    loading.value = false;
  }
}

function onRequest(ctx) {
  pagination.value = ctx.pagination;
  fetchRows(pagination.value);
}

function reload(resetPage = false) {
  if (resetPage) pagination.value.page = 1;
  fetchRows(pagination.value);
}

// detalle
const detail = ref({
  open: false,
  loading: false,
  error: "",
  item: null,
});

async function openDetail(row) {
  detail.value.open = true;
  detail.value.loading = true;
  detail.value.error = "";
  detail.value.item = null;

  try {
    const resp = await methodsHttp.getApi(`disciplinary/${row?._id}`);
    if (!resp?.ok) throw new Error(resp?.mensaje || "No se pudo cargar el detalle");
    detail.value.item = resp.disciplinaryAction || null;
  } catch (e) {
    detail.value.error = e?.message || "Error cargando detalle";
  } finally {
    detail.value.loading = false;
  }
}

async function acknowledge(row) {
  $q.dialog({
    title: "Acusar recibo",
    message: "¿Confirmas que deseas acusar recibo de esta amonestación?",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const resp = await methodsHttp.putApi(`disciplinary/${row?._id}/ack`, {
        acknowledgeNotes: "",
      });

      if (!resp?.ok) throw new Error(resp?.mensaje || "No se pudo acusar recibo");

      Notify.create({ type: "positive", message: "Acuse registrado" });
      await reload();
    } catch (e) {
      Notify.create({ type: "negative", message: e?.message || "Error acusando recibo" });
    }
  });
}

async function removeAction(row) {
  $q.dialog({
    title: "Borrar amonestación",
    message: "Esto hará soft delete. ¿Deseas continuar?",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const del = methodsHttp.deleteApi || methodsHttp.delApi;
      if (!del) throw new Error("No existe método deleteApi/delApi en methodsHttp");

      const resp = await del(`disciplinary/${row?._id}`);
      if (!resp?.ok) throw new Error(resp?.mensaje || "No se pudo borrar");

      Notify.create({ type: "positive", message: "Amonestación eliminada" });
      await reload(true);
    } catch (e) {
      Notify.create({ type: "negative", message: e?.message || "Error borrando" });
    }
  });
}

// EXPORT CSV (Excel)
function exportCSV() {
  const data = rows.value.map((r) => ({
    Fecha: r.workDateString,
    MinutosTarde: r?.evidence?.minutesLate ?? 0,
    HoraEsperada: r?.evidence?.scheduledAt ? moment(r.evidence.scheduledAt).format("YYYY-MM-DD HH:mm") : "",
    HoraReal: r?.evidence?.actualAt ? moment(r.evidence.actualAt).format("YYYY-MM-DD HH:mm") : "",
    GraciaMin: r?.evidence?.graceMinutes ?? 0,
    Acusada: r?.acknowledgedAt ? "SI" : "NO",
    ...(isAdminView.value
      ? {
          Empleado: r?.userSnapshot?.name || "",
          Email: r?.userSnapshot?.email || "",
          Departamento: r?.userSnapshot?.department?.name || "",
          Puesto: r?.userSnapshot?.jobPosition?.name || "",
        }
      : {}),
    Notas: r?.notes || "",
  }));

  if (!data.length) {
    Notify.create({ type: "warning", message: "No hay datos para exportar" });
    return;
  }

  const headers = Object.keys(data[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(","),
    ...data.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `amonestaciones_tardanza_${moment().format("YYYYMMDD_HHmm")}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

// function printTable() {
//   if (!rows.value.length) {
//     Notify.create({ type: "warning", message: "No hay datos para imprimir" });
//     return;
//   }

//   const w = window.open("", "_blank");
//   if (!w) return;

//   const title = isAdminView.value
//     ? "Amonestaciones por tardanza (Global)"
//     : "Mis amonestaciones por tardanza";

//   const cols = isAdminView.value
//     ? ["Empleado", "Fecha", "Minutos tarde", "Esperada", "Real", "Acusada", "Notas"]
//     : ["Fecha", "Minutos tarde", "Esperada", "Real", "Acusada", "Notas"];

//   const rowsHtml = rows.value
//     .map((r) => {
//       const expected = r?.evidence?.scheduledAt ? moment(r.evidence.scheduledAt).format("YYYY-MM-DD HH:mm") : "";
//       const actual = r?.evidence?.actualAt ? moment(r.evidence.actualAt).format("YYYY-MM-DD HH:mm") : "";
//       const ack = r?.acknowledgedAt ? "SI" : "NO";

//       const tds = isAdminView.value
//         ? [
//             r?.userSnapshot?.name || "",
//             r.workDateString || "",
//             String(r?.evidence?.minutesLate ?? 0),
//             expected,
//             actual,
//             ack,
//             r?.notes || "",
//           ]
//         : [
//             r.workDateString || "",
//             String(r?.evidence?.minutesLate ?? 0),
//             expected,
//             actual,
//             ack,
//             r?.notes || "",
//           ];

//       return `<tr>${tds.map((x) => `<td>${String(x ?? "")}</td>`).join("")}</tr>`;
//     })
//     .join("");

//   w.document.write(`
//     <html>
//       <head>
//         <title>${title}</title>
//         <style>
//           body{ font-family: Arial, sans-serif; padding: 16px; }
//           h2{ margin: 0 0 12px 0; }
//           table{ width:100%; border-collapse: collapse; }
//           th,td{ border:1px solid #ddd; padding:8px; font-size: 12px; }
//           th{ background:#f5f5f5; text-align:left; }
//         </style>
//       </head>
//       <body>
//         <h2>${title}</h2>
//         <div style="margin-bottom:10px; color:#666; font-size:12px;">
//           Generado: ${moment().format("YYYY-MM-DD HH:mm")}
//         </div>
//         <table>
//           <thead>
//             <tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>
//           </thead>
//           <tbody>
//             ${rowsHtml}
//           </tbody>
//         </table>

//           window.onload = () => window.print();

//       </body>
//     </html>
//   `);
//   w.document.close();
// }

// debounce filtros
let t = null;
watch(
  () => ({ ...filters.value, admin: isAdminView.value }),
  () => {
    clearTimeout(t);
    t = setTimeout(() => reload(true), 350);
  },
  { deep: true }
);

onMounted(() => {
  reload(true);
});
</script>

<style scoped>
.rounded-borders {
  border-radius: 16px;
}

/* Si ya tienes estos estilos globales en tu header, omite esto */
.header-field {
  min-width: 190px;
}
.header-field--wide {
  min-width: 260px;
}
.header-btn {
  height: 40px;
}
</style>
