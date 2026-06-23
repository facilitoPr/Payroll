<template>
  <div>
    <q-dialog v-model="open" persistent :maximized="$q.screen.lt.sm">
      <q-card class="audit-dialog column no-wrap">
        <!-- HEADER -->
        <q-card-section
          class="dialog-header bg-primary row items-center justify-between"
        >
          <div class="row items-center no-wrap text-white">
            <div class="dialog-icon">
              <q-icon size="30px" name="history" color="white" />
            </div>

            <div>
              <div class="dialog-title">Historial de cambios</div>
              <div class="dialog-subtitle">
                {{ employee?.name || "Empleado" }} ·
                {{ employee?.email || "Sin correo" }}
              </div>
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            :disable="loading"
            @click="open = false"
          />
        </q-card-section>

        <q-separator />

        <!-- FILTERS -->
        <q-card-section class="audit-filters">
          <q-card flat bordered class="filters-card">
            <div class="filters-title-row">
              <div>
                <div class="filters-title">Filtros del historial</div>
                <div class="filters-subtitle">
                  Busca cambios por campo, acción o tipo de entidad.
                </div>
              </div>

              <q-btn
                flat
                dense
                round
                color="primary"
                icon="refresh"
                :loading="loading"
                @click="reload"
              >
                <q-tooltip>Actualizar historial</q-tooltip>
              </q-btn>
            </div>

            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12 col-md-5">
                <q-input
                  v-model="filters.q"
                  outlined
                  dense
                  rounded
                  color="primary"
                  label="Buscar en historial"
                  placeholder="Campo, nota, etiqueta..."
                  debounce="300"
                  :disable="loading"
                  @update:model-value="reload"
                >
                  <template #prepend>
                    <q-icon name="search" color="primary" />
                  </template>

                  <template #append>
                    <q-btn
                      v-if="filters.q"
                      flat
                      dense
                      round
                      icon="close"
                      :disable="loading"
                      @click="clearQ"
                    />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-3">
                <q-select
                  v-model="filters.entityType"
                  :options="entityTypeOptions"
                  outlined
                  dense
                  rounded
                  color="primary"
                  label="Entidad"
                  emit-value
                  map-options
                  :disable="loading"
                  @update:model-value="reload"
                >
                  <template #prepend>
                    <q-icon name="category" color="primary" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-3">
                <q-select
                  v-model="filters.action"
                  :options="actionOptions"
                  outlined
                  dense
                  rounded
                  color="primary"
                  label="Acción"
                  clearable
                  emit-value
                  map-options
                  :disable="loading"
                  @update:model-value="reload"
                >
                  <template #prepend>
                    <q-icon name="manage_history" color="primary" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-1">
                <q-btn
                  unelevated
                  no-caps
                  color="primary"
                  icon="search"
                  class="filter-search-btn full-width"
                  :loading="loading"
                  @click="reload"
                />
              </div>
            </div>
          </q-card>
        </q-card-section>

        <q-separator />

        <!-- BODY -->
        <q-card-section class="audit-body">
          <template v-if="loading && rows.length === 0">
            <div class="q-gutter-md">
              <q-skeleton
                v-for="item in 5"
                :key="item"
                height="120px"
                class="rounded-skeleton"
              />
            </div>
          </template>

          <template v-else-if="rows.length === 0">
            <div class="empty-state">
              <q-icon name="history" size="56px" color="grey-5" />

              <div class="text-subtitle1 text-weight-bold q-mt-sm">
                No hay cambios registrados
              </div>

              <div class="text-caption text-grey-7">
                No se encontraron registros con los filtros seleccionados.
              </div>
            </div>
          </template>

          <template v-else>
            <div class="timeline-wrap">
              <q-timeline color="primary" class="audit-timeline">
                <q-timeline-entry
                  v-for="item in rows"
                  :key="item._id"
                  :icon="iconByAction(item.action)"
                  :color="colorByAction(item.action)"
                >
                  <template #title>
                    <div class="timeline-title">
                      {{ item.title || fallbackTitle(item) }}
                    </div>
                  </template>

                  <template #subtitle>
                    <div class="timeline-subtitle">
                      {{ formatSubtitle(item) }}
                    </div>
                  </template>

                  <q-card flat bordered class="timeline-card">
                    <q-card-section>
                      <div class="row items-center q-gutter-xs q-mb-sm">
                        <q-chip
                          dense
                          outline
                          :color="chipColorByEntity(item.entityType)"
                          class="chip-strong"
                        >
                          {{ formatEntityType(item.entityType) }}
                        </q-chip>

                        <q-chip
                          dense
                          :color="colorByAction(item.action)"
                          text-color="white"
                          class="chip-strong"
                        >
                          {{ item.action || "UPDATE" }}
                        </q-chip>

                        <q-chip
                          v-for="tag in item.tags || []"
                          :key="tag"
                          dense
                          color="grey-2"
                          text-color="grey-9"
                        >
                          {{ tag }}
                        </q-chip>
                      </div>

                      <div
                        v-if="item.summary?.length"
                        class="summary-chips q-mb-sm"
                      >
                        <q-chip
                          v-for="(summary, index) in item.summary.slice(0, 4)"
                          :key="index"
                          dense
                          color="blue-1"
                          text-color="blue-10"
                          class="summary-chip"
                        >
                          <b class="q-mr-xs">{{ summary.label }}:</b>
                          {{ summary.value }}
                        </q-chip>

                        <q-chip
                          v-if="(item.changes?.length || 0) > 4"
                          dense
                          color="grey-3"
                          text-color="grey-9"
                          class="summary-chip"
                        >
                          +{{ item.changes.length - 4 }} más
                        </q-chip>
                      </div>

                      <div
                        v-if="item.changes?.length"
                        class="changes-preview q-mt-sm"
                      >
                        <div
                          v-for="change in item.changes.slice(0, 3)"
                          :key="change.path"
                          class="change-preview-row"
                        >
                          <q-icon name="fiber_manual_record" size="9px" />
                          <span class="change-path">
                            {{ labelByPath(change.path) || change.path }}
                          </span>
                          <span class="change-values">
                            {{ formatValue(change.from, change.masked) }}
                            →
                            {{ formatValue(change.to, change.masked) }}
                          </span>
                        </div>
                      </div>

                      <div class="row justify-end q-mt-md">
                        <q-btn
                          flat
                          no-caps
                          color="primary"
                          icon="visibility"
                          label="Ver detalle"
                          class="rounded-action"
                          @click="openDetail(item)"
                        />
                      </div>
                    </q-card-section>
                  </q-card>
                </q-timeline-entry>
              </q-timeline>
            </div>

            <div class="row justify-center q-mt-md" v-if="hasMore">
              <q-btn
                outline
                no-caps
                color="primary"
                icon="expand_more"
                label="Cargar más"
                class="rounded-action"
                :loading="loading"
                @click="loadMore"
              />
            </div>

            <q-inner-loading
              :showing="loading && rows.length > 0"
              label="Actualizando historial..."
              label-class="text-primary"
            />
          </template>
        </q-card-section>

        <q-separator />

        <!-- ACTIONS -->
        <q-card-actions align="right" class="dialog-actions">
          <q-btn
            flat
            no-caps
            color="negative"
            label="Cerrar"
            icon="close"
            class="dialog-action-btn"
            :disable="loading"
            @click="open = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DETAIL DIALOG -->
    <q-dialog v-model="detail.open" persistent :maximized="$q.screen.lt.sm">
      <q-card class="detail-dialog column no-wrap">
        <!-- DETAIL HEADER -->
        <q-card-section
          class="dialog-header bg-primary row items-center justify-between"
        >
          <div class="row items-center no-wrap text-white">
            <div class="dialog-icon">
              <q-icon size="30px" name="visibility" color="white" />
            </div>

            <div>
              <div class="dialog-title">
                {{ detail.item?.title || fallbackTitle(detail.item) }}
              </div>
              <div class="dialog-subtitle">
                {{ formatSubtitle(detail.item) }}
              </div>
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            @click="detail.open = false"
          />
        </q-card-section>

        <q-separator />

        <q-card-section class="detail-body">
          <q-card flat bordered class="detail-summary-card q-mb-md">
            <div class="row items-center justify-between q-col-gutter-md">
              <div class="col-12 col-md">
                <div class="row items-center q-gutter-xs">
                  <q-chip
                    outline
                    :color="chipColorByEntity(detail.item?.entityType)"
                    class="chip-strong"
                  >
                    {{ formatEntityType(detail.item?.entityType) }}
                  </q-chip>

                  <q-chip
                    :color="colorByAction(detail.item?.action)"
                    text-color="white"
                    class="chip-strong"
                  >
                    {{ detail.item?.action || "UPDATE" }}
                  </q-chip>
                </div>
              </div>

              <div class="col-12 col-md-auto">
                <q-btn
                  flat
                  no-caps
                  color="primary"
                  icon="content_copy"
                  label="Copiar JSON"
                  class="rounded-action"
                  @click="copyJson(detail.item)"
                />
              </div>
            </div>
          </q-card>

          <q-card flat bordered class="changes-table-card">
            <q-card-section>
              <div class="section-title">Cambios registrados</div>
              <div class="section-subtitle">
                Comparación de valores antes y después del cambio.
              </div>
            </q-card-section>

            <q-separator />

            <q-table
              flat
              bordered
              :rows="detail.item?.changes || []"
              :columns="changeCols"
              row-key="path"
              :pagination="{ rowsPerPage: 20 }"
              class="changes-table"
            >
              <template #body-cell-path="props">
                <q-td :props="props">
                  <div class="text-weight-bold text-grey-9">
                    {{ props.row.path }}
                  </div>

                  <div
                    class="text-caption text-grey-7"
                    v-if="labelByPath(props.row.path)"
                  >
                    {{ labelByPath(props.row.path) }}
                  </div>
                </q-td>
              </template>

              <template #body-cell-from="props">
                <q-td :props="props">
                  <div class="value-box value-box--from">
                    {{ formatValue(props.row.from, props.row.masked) }}
                  </div>
                </q-td>
              </template>

              <template #body-cell-to="props">
                <q-td :props="props">
                  <div class="value-box value-box--to">
                    {{ formatValue(props.row.to, props.row.masked) }}
                  </div>
                </q-td>
              </template>

              <template #no-data>
                <div class="full-width text-center q-pa-lg text-grey-7">
                  No hay cambios detallados para mostrar.
                </div>
              </template>
            </q-table>
          </q-card>

          <q-expansion-item
            v-if="detail.item?.context"
            icon="info"
            label="Contexto técnico"
            class="context-expansion q-mt-md"
          >
            <pre class="context-pre">{{ formatJson(detail.item.context) }}</pre>
          </q-expansion-item>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="dialog-actions">
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Cerrar"
            icon="check"
            class="dialog-action-btn"
            @click="detail.open = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { copyToClipboard, useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const $q = useQuasar();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  employee: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue"]);

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const loading = ref(false);
const rows = ref([]);
const skip = ref(0);
const limit = ref(50);
const hasMore = ref(false);

const filters = ref({
  q: "",
  entityType: "all",
  action: null,
  from: "",
  to: "",
});

const entityTypeOptions = [
  { label: "Todos", value: "all" },
  { label: "Usuario", value: "User" },
  { label: "Expediente", value: "Expedient" },
];

const actionOptions = [
  { label: "Crear", value: "CREATE" },
  { label: "Actualizar", value: "UPDATE" },
  { label: "Eliminar", value: "SOFT_DELETE" },
  { label: "Restaurar", value: "RESTORE" },
];

const changeCols = [
  { name: "path", label: "Campo", field: "path", align: "left" },
  { name: "from", label: "Antes", field: "from", align: "left" },
  { name: "to", label: "Después", field: "to", align: "left" },
];

const detail = ref({
  open: false,
  item: null,
});

watch(
  () => open.value,
  async (value) => {
    if (value && props.employee?._id) {
      await reload();
    }
  },
);

watch(
  () => props.employee?._id,
  async (employeeId) => {
    if (open.value && employeeId) {
      await reload();
    }
  },
);

function clearQ() {
  filters.value.q = "";
  reload();
}

async function reload() {
  skip.value = 0;
  rows.value = [];
  await fetchLogs({ append: false });
}

async function loadMore() {
  await fetchLogs({ append: true });
}

async function fetchLogs({ append }) {
  if (!props.employee?._id) return;

  loading.value = true;

  try {
    const query = new URLSearchParams();

    query.set("limit", String(limit.value));
    query.set("skip", String(skip.value));

    if (filters.value.entityType && filters.value.entityType !== "all") {
      query.set("entityType", filters.value.entityType);
    }

    if (filters.value.action) {
      query.set("action", filters.value.action);
    }

    if (filters.value.q) {
      query.set("q", filters.value.q.trim());
    }

    if (filters.value.from) {
      query.set("from", filters.value.from);
    }

    if (filters.value.to) {
      query.set("to", filters.value.to);
    }

    const resp = await methodsHttp.getApi(
      `audit/getUserAuditLogs/${props.employee._id}?${query.toString()}`,
    );

    if (resp?.ok) {
      const newRows = resp.rows || [];
      rows.value = append ? [...rows.value, ...newRows] : newRows;

      const total = Number(resp.count || rows.value.length);
      skip.value = rows.value.length;
      hasMore.value = rows.value.length < total;
      return;
    }

    hasMore.value = false;
  } catch (error) {
    console.error("fetchLogs error:", error);

    $q.notify({
      type: "negative",
      message: "Error cargando el historial de cambios.",
    });

    hasMore.value = false;
  } finally {
    loading.value = false;
  }
}

function openDetail(item) {
  detail.value.item = item;
  detail.value.open = true;
}

async function copyJson(item) {
  await copyToClipboard(JSON.stringify(item, null, 2));

  $q.notify({
    type: "positive",
    message: "JSON copiado correctamente.",
  });
}

function iconByAction(action) {
  if (action === "CREATE") return "add_circle";
  if (action === "SOFT_DELETE") return "delete";
  if (action === "RESTORE") return "restore";
  return "edit";
}

function colorByAction(action) {
  if (action === "CREATE") return "positive";
  if (action === "SOFT_DELETE") return "negative";
  if (action === "RESTORE") return "teal";
  return "primary";
}

function chipColorByEntity(entityType) {
  return entityType === "Expedient" ? "deep-purple" : "indigo";
}

function formatEntityType(entityType) {
  const map = {
    User: "Usuario",
    Expedient: "Expediente",
  };

  return map[entityType] || entityType || "Entidad";
}

function formatSubtitle(item) {
  const date = item?.createdAt ? new Date(item.createdAt).toLocaleString() : "—";
  const changedBy = item?.changedBy?.name || "—";

  return `${date} · ${changedBy}`;
}

function formatValue(value, masked) {
  if (masked) return "****";
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function fallbackTitle(item) {
  const entityType = item?.entityType || "Entidad";
  const action = item?.action || "UPDATE";

  return `${action} · ${formatEntityType(entityType)}`;
}

function formatJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value || "");
  }
}

function labelByPath(path) {
  const map = {
    name: "Nombre",
    email: "Email",
    phone: "Teléfono",
    salaryType: "Tipo de salario",
    baseSalary: "Sueldo base",
    hourlyRate: "Tarifa por hora",
    paymentSchedule: "Forma de pago",
    department: "Departamento",
    jobPosition: "Puesto",
    project: "Proyecto",
    "payrollBank.accountNumber": "Cuenta bancaria",
    "payrollBank.operationCode": "Código operación",
    "schedule.lunes.entryTime": "Lunes: entrada",
    "classification.sections": "Documentos del expediente",
  };

  return map[path] || "";
}
</script>

<style scoped>
.audit-dialog,
.detail-dialog {
  width: 1040px;
  max-width: 96vw;
  max-height: 92vh;
  border-radius: 22px;
  overflow: hidden;
}

.detail-dialog {
  width: 980px;
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
  max-width: 720px;
  font-size: 0.78rem;
  opacity: 0.86;
}

.audit-filters {
  padding: 16px 18px;
  background: #ffffff;
}

.filters-card {
  padding: 16px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.filters-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.filters-title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.filters-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.filter-search-btn {
  height: 40px;
  border-radius: 999px;
}

.audit-body,
.detail-body {
  position: relative;
  flex: 1;
  overflow-y: auto;
  max-height: calc(92vh - 250px);
  padding: 18px;
  background: #f8fafc;
}

.detail-body {
  max-height: calc(92vh - 154px);
}

.rounded-skeleton {
  border-radius: 18px;
}

.empty-state {
  min-height: 360px;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  color: #64748b;
}

.timeline-wrap {
  max-width: 920px;
  margin: 0 auto;
}

.audit-timeline {
  padding-right: 6px;
}

.timeline-title {
  color: #0f172a;
  font-size: 0.96rem;
  font-weight: 900;
}

.timeline-subtitle {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.timeline-card,
.detail-summary-card,
.changes-table-card {
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.timeline-card {
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.timeline-card:hover {
  transform: translateY(-2px);
  border-color: rgba(25, 100, 162, 0.18);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.chip-strong {
  font-weight: 800;
}

.summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.summary-chip {
  max-width: 100%;
}

.changes-preview {
  display: grid;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.change-preview-row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: #64748b;
  font-size: 0.8rem;
}

.change-path {
  color: #0f172a;
  font-weight: 800;
}

.change-values {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rounded-action,
.dialog-action-btn {
  border-radius: 999px;
  font-weight: 800;
}

.dialog-action-btn {
  padding-left: 18px;
  padding-right: 18px;
}

.dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
  box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.04);
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

.changes-table-card {
  overflow: hidden;
}

.changes-table {
  background: #ffffff;
}

.value-box {
  max-width: 360px;
  padding: 8px 10px;
  border-radius: 12px;
  word-break: break-word;
  font-size: 0.82rem;
  font-weight: 700;
}

.value-box--from {
  color: #475569;
  background: #f1f5f9;
}

.value-box--to {
  color: #0f172a;
  background: #e0f2fe;
}

.context-expansion {
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.context-pre {
  margin: 0;
  padding: 14px;
  max-height: 260px;
  overflow: auto;
  border-radius: 14px;
  color: #334155;
  background: #f1f5f9;
  font-size: 0.78rem;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

:deep(.q-field--outlined.q-field--rounded .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 768px) {
  .audit-dialog,
  .detail-dialog {
    width: 100%;
    max-width: 100%;
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
  }

  .audit-body,
  .detail-body {
    max-height: calc(100vh - 250px);
    padding: 12px;
  }

  .detail-body {
    max-height: calc(100vh - 154px);
  }

  .audit-filters {
    padding: 12px;
  }

  .filters-card {
    padding: 12px;
  }

  .timeline-wrap {
    max-width: 100%;
  }
}
</style>