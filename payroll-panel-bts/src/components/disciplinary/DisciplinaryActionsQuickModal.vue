<template>
  <div>
    <q-btn
      color="primary"
      outline
      icon="gpp_maybe"
      label="Ver amonestaciones"
      :disable="!userId"
      @click="openModal"
    >
      <q-badge v-if="total > 0" color="negative" floating>
        {{ total }}
      </q-badge>
      <q-tooltip v-if="!userId">No hay userId para consultar</q-tooltip>
    </q-btn>

    <q-dialog v-model="dialog.open" persistent>
      <q-card style="width: 920px; max-width: 95vw; border-radius: 16px">
        <!-- HEADER -->
        <q-card-section class="bg-primary row items-center justify-between">
          <div>
            <div class="text-subtitle1 text-weight-bold text-white">
              Amonestaciones
            </div>
            <div class="text-caption text-white">
              Listado del empleado seleccionado
            </div>
          </div>

          <q-btn flat round icon="close" v-close-popup color="white" />
        </q-card-section>

        <q-separator />

        <!-- BODY -->
        <q-card-section>
          <q-banner
            v-if="dialog.error"
            rounded
            class="bg-red-1 text-red-9 q-mb-md"
          >
            {{ dialog.error }}
          </q-banner>

          <q-skeleton v-if="dialog.loading" type="rect" height="240px" />

          <div v-else>
            <q-table
              flat
              bordered
              row-key="_id"
              :rows="rows"
              :columns="columns"
              :rows-per-page-options="[10, 20, 50]"
              v-model:pagination="pagination"
              @request="onRequest"
              :loading="dialog.loading"
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

              <template v-slot:body-cell-workDate="props">
                <q-td :props="props">
                  <template v-if="props.row?.scope === 'RANGE'">
                    {{ props.row?.period?.fromDateString || "-" }}
                    <span class="text-grey-7">→</span>
                    {{ props.row?.period?.toDateString || "-" }}
                  </template>
                  <template v-else>
                    {{ props.row?.workDateString || "-" }}
                  </template>
                </q-td>
              </template>

              <template v-slot:body-cell-late="props">
                <q-td :props="props" class="text-right">
                  <span v-if="props.row?.category === 'LATE_ARRIVAL'">
                    <q-chip dense color="warning" text-color="black">
                      {{ lateChipText(props.row) }}
                    </q-chip>
                  </span>
                  <span v-else class="text-caption text-grey-7">—</span>
                </q-td>
              </template>

              <template v-slot:body-cell-createdAt="props">
                <q-td :props="props">
                  {{ fmtCreatedAt(props.row?.createdAt) }}
                </q-td>
              </template>

              <template v-slot:no-data>
                <div class="full-width row flex-center q-pa-lg text-grey-7">
                  <q-icon name="info" class="q-mr-sm" />
                  No hay amonestaciones.
                </div>
              </template>
            </q-table>

            <div class="row items-center justify-between q-mt-md">
              <div class="text-caption text-grey-6">
                Total: <b>{{ total }}</b>
              </div>

              <q-btn
                flat
                color="primary"
                icon="open_in_new"
                label="Ir al módulo completo"
                @click="goFullModule"
              />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="bg-white">
          <q-btn flat label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { Notify } from "quasar";
import moment from "moment";
import methodsHttp from "src/api/methodsHttp";
import "moment/dist/locale/es";
import { useRouter } from "vue-router";
moment.locale("es-do");

const router = useRouter();

const props = defineProps({
  userId: { type: String, default: "" },
  // si quieres limitar/ordenar
  defaultLimit: { type: Number, default: 20 },
});

const dialog = ref({
  open: false,
  loading: false,
  error: "",
});

const rows = ref([]);
const total = ref(0);

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

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

function fmtCreatedAt(dt) {
  if (!dt) return "-";
  return moment(dt).locale("es-do").format("dddd DD MMM, YYYY • hh:mm a");
}

const columns = [
  { name: "category", label: "Categoría", field: "category", align: "left" },
  { name: "workDate", label: "Fecha / periodo", field: "workDate", align: "left" },
  { name: "late", label: "Tardanza", field: "late", align: "right" },
  { name: "createdAt", label: "Creada", field: "createdAt", align: "left" },
];

function buildQueryParams(pag = pagination.value) {
  const limit = pag.rowsPerPage || props.defaultLimit;
  const initial = (pag.page - 1) * limit;
  const params = { limit: String(limit), initial: String(initial) };
  if (props.userId) params.userId = props.userId;
  return params;
}

async function fetchRows(pag = pagination.value) {
  if (!props.userId) return;

  dialog.value.loading = true;
  dialog.value.error = "";
  try {
    const params = buildQueryParams(pag);
    const qs = new URLSearchParams(params).toString();

    const resp = await methodsHttp.getApi(
      `disciplinary/listDisciplinaryActions?${qs}`,
    );
    if (!resp?.ok) throw new Error(resp?.mensaje || "No se pudo cargar");

    rows.value = Array.isArray(resp.items) ? resp.items : [];
    total.value = Number(resp.total || rows.value.length || 0);

    pagination.value.rowsNumber = total.value;
  } catch (e) {
    dialog.value.error = e?.message || "Error cargando amonestaciones";
    rows.value = [];
    total.value = 0;
    pagination.value.rowsNumber = 0;

    Notify.create({ type: "negative", message: dialog.value.error });
  } finally {
    dialog.value.loading = false;
  }
}

function onRequest(ctx) {
  pagination.value = ctx.pagination;
  fetchRows(pagination.value);
}

function openModal() {
  if (!props.userId) return;
  dialog.value.open = true;
  pagination.value.page = 1;
  fetchRows(pagination.value);
}

function goFullModule() {
  // opcional: si tienes ruta, navega:
//   router.push({ name: `/rrhh/disciplinary-actions/${props.userId}`, query: { userId: props.userId } })
  router.push(`/rrhh/disciplinary-actions?userId=${props.userId}`)
//   Notify.create({
//     type: "info",
//     message: "Pendiente: navegar al módulo completo (si tienes ruta).",
//   });
}

watch(
  () => props.userId,
  (v) => {
    // si cambia el empleado mientras el modal está abierto, recarga
    if (dialog.value.open && v) fetchRows(pagination.value);
  },
);
</script>
