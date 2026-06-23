<template>
  <div class="q-pa-md">
    <PageHeaderCard
      title="Mis amonestaciones"
      subtitle="Revisa tus amonestaciones, filtra por categoría y rango de fechas, y confirma el acuse de recibo."
      icon="gpp_maybe"
    >
      <template #actions>
        <!-- Categoria -->
        <q-select
          v-model="filters.category"
          label="Categoría"
          outlined
          dense
          color="primary"
          :options="CATEGORY_OPTIONS"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          clearable
          class="header-field header-field--wide"
        >
          <template #prepend>
            <q-icon name="category" color="primary" />
          </template>
        </q-select>

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
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
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
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date minimal v-model="filters.to" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Cerrar" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

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
      </template>
    </PageHeaderCard>

    <!-- TABLA -->
    <q-card flat bordered class="rounded-borders">
      <q-table
        flat
        :rows="rows"
        :columns="columns"
        row-key="_id"
        :loading="loading"
        v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 50, 100]"
        @request="onRequest"
      >
        <template v-slot:body-cell-category="props">
          <q-td :props="props">
            <q-chip dense color="blue-grey-1" text-color="blue-grey-9">
              {{ categoryLabel(props.row?.category) }}
            </q-chip>
            <q-chip
              v-if="props.row?.scope === 'RANGE'"
              dense
              color="purple-1"
              text-color="purple-9"
              class="q-ml-sm"
            >
              Rango
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-workDateString="props">
          <q-td :props="props">
            <div class="text-body2">{{ props.row?.workDateString || "-" }}</div>
            <div
              v-if="props.row?.scope === 'RANGE'"
              class="text-caption text-grey-7"
            >
              {{ props.row?.period?.fromDateString }} →
              {{ props.row?.period?.toDateString }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-minutesLate="props">
          <q-td :props="props" class="text-right">
            <span v-if="props.row?.category === 'LATE_ARRIVAL'">
              <q-chip dense color="warning" text-color="black">
                {{ lateChipText(props.row) }}
              </q-chip>
            </span>
            <span v-else class="text-caption text-grey-7">—</span>
          </q-td>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-chip
              v-if="props.row?.acknowledgedAt"
              dense
              color="green-1"
              text-color="green-9"
              icon="check_circle"
            >
              Acusada
            </q-chip>
            <q-chip
              v-else
              dense
              color="orange-1"
              text-color="orange-9"
              icon="schedule"
            >
              Pendiente
            </q-chip>

            <div
              v-if="props.row?.acknowledgedAt"
              class="text-caption text-grey-7 q-mt-xs"
            >
              {{ fmtDate(props.row?.acknowledgedAt) }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-left">
            <div class="row items-center justify-start q-gutter-xs">
              <q-btn
                flat
                dense
                icon="visibility"
                @click.stop="openDetail(props.row)"
              >
                <q-tooltip>Ver detalle</q-tooltip>
              </q-btn>

              <q-btn
                v-if="!props.row?.acknowledgedAt"
                color="primary"
                class="q-px-md"
                dense
                unelevated
                icon="assignment_turned_in"
                label="Acusar"
                @click.stop="openAck(props.row)"
              />
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

    <!-- DIALOG DETALLE -->
    <q-dialog v-model="detail.open">
      <q-card style="width: 900px; max-width: 95vw; border-radius: 16px">
        <q-card-section class="bg-primary row items-center justify-between">
          <div>
            <div class="text-subtitle1 text-weight-bold text-white">
              Detalle de amonestación
            </div>
            <div class="text-caption text-white">
              {{ categoryLabel(detail.item?.category) }}
            </div>
          </div>
          <q-btn flat round icon="close" v-close-popup color="white" />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="detail.loading">
          <q-skeleton type="text" width="35%" class="q-mb-sm" />
          <q-skeleton type="rect" height="220px" />
        </q-card-section>

        <q-card-section v-else-if="detail.error">
          <q-banner rounded class="bg-red-1 text-red-9">{{
            detail.error
          }}</q-banner>
        </q-card-section>

        <q-card-section v-else>
          <q-card flat bordered class="rounded-borders">
            <q-card-section>
              <div class="text-subtitle2 text-weight-bold q-mb-sm">
                Información
              </div>

              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-grey-7">Fecha</span>
                <span class="text-body2 text-weight-medium">
                  {{ detail.item?.workDateString || "-" }}
                </span>
              </div>

              <div
                v-if="detail.item?.scope === 'RANGE'"
                class="row items-center justify-between q-mb-xs"
              >
                <span class="text-caption text-grey-7">Período</span>
                <span class="text-body2 text-weight-medium">
                  {{ detail.item?.period?.fromDateString }} →
                  {{ detail.item?.period?.toDateString }}
                </span>
              </div>

              <div
                v-if="detail.item?.category === 'LATE_ARRIVAL'"
                class="q-mt-md"
              >
                <div
                  v-if="detail.item?.scope === 'RANGE'"
                  class="row items-center justify-between q-mb-xs"
                >
                  <span class="text-caption text-grey-7"
                    >Tardanza acumulada</span
                  >
                  <span class="text-body2 text-weight-bold">
                    {{ fmtLate(detail.item?.evidence?.totalMinutesLate) }}
                    <span class="text-caption text-grey-7">
                      ({{ detail.item?.evidence?.daysCount || 0 }} días)
                    </span>
                  </span>
                </div>

                <div v-else class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-grey-7">Minutos tarde</span>
                  <span class="text-body2 text-weight-bold">
                    {{ fmtLate(detail.item?.evidence?.minutesLate) }}
                  </span>
                </div>
              </div>

              <div class="row items-start justify-between q-mb-xs q-mt-md">
                <span class="text-caption text-grey-7">Notas</span>
                <span
                  class="text-body2"
                  style="max-width: 70%; text-align: right"
                >
                  {{ detail.item?.notes || "-" }}
                </span>
              </div>

              <div class="q-mt-md">
                <div class="text-caption text-grey-7">Estado</div>
                <q-chip
                  v-if="detail.item?.acknowledgedAt"
                  dense
                  color="green-1"
                  text-color="green-9"
                  icon="check_circle"
                >
                  Acusada • {{ fmtDate(detail.item?.acknowledgedAt) }}
                </q-chip>
                <q-chip
                  v-else
                  dense
                  color="orange-1"
                  text-color="orange-9"
                  icon="schedule"
                >
                  Pendiente
                </q-chip>
              </div>
            </q-card-section>
          </q-card>
        </q-card-section>

        <q-separator />
        <q-card-actions align="right" class="q-px-md q-py-sm">
          <q-btn flat label="Cerrar" v-close-popup />
          <q-btn
            v-if="!detail.item?.acknowledgedAt && detail.item?._id"
            color="primary"
            unelevated
            icon="assignment_turned_in"
            label="Acusar recibo"
            :loading="ack.loading"
            @click="openAck(detail.item)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIALOG ACK -->
    <q-dialog v-model="ack.open" persistent>
      <q-card style="width: 620px; max-width: 95vw; border-radius: 16px">
        <div class="bg-primary row justify-between q-pa-md">
          <div class="text-white" style="font-size: 18px; font-weight: 600">
            <q-icon name="assignment_turned_in" class="q-mr-sm" />
            Acusar recibo
          </div>
          <span
            class="material-icons text-white"
            style="font-size: 23px; cursor: pointer"
            @click="ack.open = false"
          >
            cancel
          </span>
        </div>

        <q-card-section>
          <q-banner rounded class="bg-blue-1 text-blue-9 q-mb-md">
            Al acusar recibo confirmas que has leído esta amonestación.
          </q-banner>

          <div class="text-caption text-grey-7 q-mb-xs">
            Comentario (opcional)
          </div>
          <q-input
            v-model="ack.notes"
            type="textarea"
            outlined
            autogrow
            placeholder="Escribe un comentario si lo deseas…"
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-px-md q-py-sm">
          <q-btn flat label="Cancelar" @click="ack.open = false" />
          <q-btn
            color="primary"
            unelevated
            label="Confirmar"
            :loading="ack.loading"
            @click="confirmAck()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { Notify, useQuasar } from "quasar";
import moment from "moment";
import methodsHttp from "src/api/methodsHttp";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import "moment/dist/locale/es";
moment.locale("es-do");

const $q = useQuasar();

const CATEGORY_OPTIONS = [
  { label: "Llegada tarde", value: "LATE_ARRIVAL" },
  { label: "Salida temprano", value: "EARLY_DEPARTURE" },
  { label: "No se presentó", value: "NO_SHOW" },
  { label: "Ponche faltante", value: "MISSING_PUNCH" },
  { label: "Pausa no autorizada", value: "UNAUTHORIZED_BREAK" },
  { label: "Conducta inapropiada", value: "MISCONDUCT" },
  { label: "Insubordinación", value: "INSUBORDINATION" },
  { label: "Código de vestimenta", value: "DRESS_CODE" },
  { label: "Bajo desempeño", value: "POOR_PERFORMANCE" },
  { label: "Violación de procedimiento", value: "PROCEDURE_VIOLATION" },
  { label: "Violación de seguridad", value: "SAFETY_VIOLATION" },
  { label: "Queja de cliente", value: "CUSTOMER_COMPLAINT" },
  { label: "Violación política seguridad", value: "SECURITY_POLICY_VIOLATION" },
  { label: "Manejo indebido de datos", value: "DATA_MISHANDLING" },
];

function categoryLabel(v) {
  return CATEGORY_OPTIONS.find((x) => x.value === v)?.label || v || "-";
}

function fmtLate(mins) {
  const m = Number(mins || 0);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r}m`;
  return `${h}h ${r}m`;
}

function lateChipText(row) {
  if (!row) return "0m";
  if (row.scope === "RANGE") {
    return `${fmtLate(row?.evidence?.totalMinutesLate)} • ${
      row?.evidence?.daysCount || 0
    } días`;
  }
  return fmtLate(row?.evidence?.minutesLate);
}

function fmtDate(d) {
  if (!d) return "-";
  return moment(d).locale("es-do").format("dddd DD MMMM, YYYY");
}

/* ------------------- helpers fechas ------------------- */
function normalizeYMD(s) {
  const m = moment(String(s || "").trim(), ["YYYY-MM-DD", "YYYY/MM/DD"], true);
  return m.isValid() ? m.format("YYYY-MM-DD") : "";
}

/* ------------------- filtros header ------------------- */
const filters = ref({
  category: "",
  from: "",
  to: "",
});

const fromFormatted = computed({
  get: () => filters.value.from,
  set: (v) => (filters.value.from = v || ""),
});
const toFormatted = computed({
  get: () => filters.value.to,
  set: (v) => (filters.value.to = v || ""),
});

/* ------------------- tabla ------------------- */
const loading = ref(false);
const rows = ref([]);

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

const columns = [
  { name: "actions", label: "", field: "actions", align: "left" },
  { name: "category", label: "Categoría", field: "category", align: "left" },
  {
    name: "workDateString",
    label: "Fecha",
    field: "workDateString",
    align: "left",
  },
  {
    name: "minutesLate",
    label: "Tardanza",
    field: (r) => r?.evidence?.minutesLate,
    align: "right",
  },
  {
    name: "status",
    label: "Estado",
    field: (r) => (r?.acknowledgedAt ? "ACK" : "PENDING"),
    align: "left",
  },
  {
    name: "createdAt",
    label: "Creada",
    field: (r) =>
      moment(r?.createdAt).locale("es-do").format("dddd DD MMMM, YYYY"),
    align: "left",
  },
];

function buildQueryParams(pag = pagination.value) {
  const limit = pag.rowsPerPage;
  const initial = (pag.page - 1) * pag.rowsPerPage;

  const params = { limit: String(limit), initial: String(initial) };

  if (filters.value.category) params.category = filters.value.category;

  const f = normalizeYMD(filters.value.from);
  const t = normalizeYMD(filters.value.to);
  if (f) params.from = f;
  if (t) params.to = t;

  return params;
}

async function fetchRows(pag = pagination.value) {
  loading.value = true;
  try {
    const params = buildQueryParams(pag);
    const qs = new URLSearchParams(params).toString();

    const resp = await methodsHttp.getApi(
      `disciplinary/listDisciplinaryActions?${qs}`
    );

    rows.value = Array.isArray(resp.items) ? resp.items : [];
    pagination.value.rowsNumber = Number(resp.total || 0);
  } catch (e) {
    Notify.create({
      type: "negative",
      message: e?.message || "Error cargando amonestaciones",
    });
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

/* ------------------- detalle ------------------- */
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
    const resp = await methodsHttp.getApi(
      `disciplinary/getDisciplinaryAction/${row?._id}`
    );
    if (!resp?.ok)
      throw new Error(resp?.mensaje || "No se pudo cargar el detalle");
    detail.value.item = resp.disciplinaryAction || null;
  } catch (e) {
    detail.value.error = e?.message || "Error cargando detalle";
  } finally {
    detail.value.loading = false;
  }
}

/* ------------------- ACK ------------------- */
const ack = ref({
  open: false,
  loading: false,
  id: "",
  notes: "",
});

function openAck(row) {
  if (!row?._id) return;
  ack.value.open = true;
  ack.value.id = row._id;
  ack.value.notes = "";

  // si el detalle está abierto, nos aseguramos que el id coincide
  if (detail.value.open && detail.value.item?._id === row._id) {
    // ok
  }
}

async function confirmAck() {
  if (!ack.value.id) return;

  ack.value.loading = true;
  try {
    const payload = { acknowledgeNotes: ack.value.notes || "" };
    const resp = await methodsHttp.putApi(
      `disciplinary/ackDisciplinaryAction/${ack.value.id}`,
      payload
    );
    if (!resp?.ok) throw new Error(resp?.mensaje || "No se pudo acusar recibo");

    Notify.create({ type: "positive", message: "Acuse registrado" });
    ack.value.open = false;

    // refrescar tabla
    await reload(false);

    // refrescar detalle si aplica
    if (detail.value.open && detail.value.item?._id === ack.value.id) {
      await openDetail({ _id: ack.value.id });
    }
  } catch (e) {
    Notify.create({
      type: "negative",
      message: e?.message || "Error registrando acuse",
    });
  } finally {
    ack.value.loading = false;
  }
}

/* ------------------- init ------------------- */
onMounted(async () => {
  await reload(true);
});
</script>

<style scoped>
.rounded-borders {
  border-radius: 16px;
}

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
