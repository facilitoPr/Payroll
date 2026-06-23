<template>
  <q-page class="q-pa-md admin-permissions-page">
    <PageHeaderCard
      title="Solicitudes de permisos y vacaciones"
      subtitle="Gestiona solicitudes, revisa historial y toma acciones desde una vista limpia."
      icon="multiple_stop"
    >
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="refresh"
          label="Actualizar"
          class="header-btn"
          no-caps
          :loading="loading"
          @click="reloadRequests"
        />

        <q-input
          v-model="searchText"
          outlined
          dense
          rounded
          debounce="350"
          label="Buscar"
          placeholder="Empleado, tipo, motivo..."
          color="primary"
          class="header-search"
        >
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>

          <template #append>
            <q-btn
              v-if="searchText"
              flat
              dense
              round
              icon="close"
              @click="searchText = ''"
            />
          </template>
        </q-input>

        <q-select
          v-model="categoryFilter"
          outlined
          dense
          rounded
          clearable
          label="Categoría"
          color="primary"
          class="header-field"
          :options="categoryOptions"
          emit-value
          map-options
        >
          <template #prepend>
            <q-icon name="category" color="primary" />
          </template>
        </q-select>

        <q-select
          v-model="statusFilter"
          outlined
          dense
          rounded
          multiple
          use-chips
          clearable
          label="Estados"
          color="primary"
          class="header-field header-field--wide"
          :options="statusOptions"
        >
          <template #prepend>
            <q-icon name="filter_alt" color="primary" />
          </template>
        </q-select>

        <q-btn
          outline
          rounded
          color="primary"
          icon="restart_alt"
          label="Limpiar"
          no-caps
          class="header-btn"
          @click="resetFilters"
        />
      </template>
    </PageHeaderCard>

    <div class="stats-grid q-mb-md">
      <q-card flat bordered class="stat-card">
        <q-avatar class="stat-icon bg-blue-1 text-primary">
          <q-icon name="assignment" />
        </q-avatar>

        <div>
          <div class="stat-label">Solicitudes</div>
          <div class="stat-value">{{ stats.total }}</div>
        </div>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-avatar class="stat-icon bg-orange-1 text-orange-10">
          <q-icon name="hourglass_empty" />
        </q-avatar>

        <div>
          <div class="stat-label">Pendientes</div>
          <div class="stat-value">{{ stats.pending }}</div>
        </div>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-avatar class="stat-icon bg-green-1 text-positive">
          <q-icon name="check_circle" />
        </q-avatar>

        <div>
          <div class="stat-label">Aprobadas</div>
          <div class="stat-value">{{ stats.approved }}</div>
        </div>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-avatar class="stat-icon bg-red-1 text-negative">
          <q-icon name="cancel" />
        </q-avatar>

        <div>
          <div class="stat-label">Rechazadas</div>
          <div class="stat-value">{{ stats.rejected }}</div>
        </div>
      </q-card>
    </div>

    <q-card flat bordered class="panel-card">
      <q-card-section class="table-header row items-center justify-between">
        <div>
          <div class="table-title">Listado de solicitudes</div>
          <div class="table-subtitle">
            Haz click en una fila o en “Gestionar” para abrir el modal de revisión.
          </div>
        </div>

        <div class="row q-gutter-sm">
          <q-chip dense color="green-1" text-color="positive" icon="beach_access">
            Vacaciones: {{ stats.vacations }}
          </q-chip>

          <q-chip dense color="blue-1" text-color="primary" icon="badge">
            Permisos: {{ stats.permissions }}
          </q-chip>
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        :columns="tableColumns"
        :rows="requests"
        row-key="_id"
        flat
        bordered
        separator="horizontal"
        :loading="loading"
        :rows-per-page-options="[limit]"
        hide-pagination
        class="requests-table"
      >
        <template #body="props">
          <q-tr
            :props="props"
            class="table-row"
            @click="openManageDialog(props.row, 'summary')"
          >
            <q-td key="actions" :props="props" auto-width>
              <div class="row items-center no-wrap q-gutter-xs">
                <q-btn
                  dense
                  rounded
                  unelevated
                  no-caps
                  color="primary"
                  icon="manage_accounts"
                  @click.stop="openManageDialog(props.row, 'summary')"
                />

                <q-btn
                  dense
                  round
                  flat
                  color="primary"
                  icon="history"
                  @click.stop="openManageDialog(props.row, 'history')"
                >
                  <q-tooltip>Ver historial</q-tooltip>
                </q-btn>
              </div>
            </q-td>

            <q-td key="employee" :props="props">
              <div class="employee-cell">
                <q-avatar size="36px" class="employee-avatar">
                  {{ getInitials(props.row.user?.name) }}
                </q-avatar>

                <div>
                  <div class="employee-name">
                    {{ props.row.user?.name || "-" }}
                  </div>
                  <div class="employee-email">
                    {{ props.row.user?.email || "" }}
                  </div>
                </div>
              </div>
            </q-td>

            <q-td key="status" :props="props">
              <q-badge
                rounded
                class="status-badge"
                :color="getStatusColor(props.row.status)"
                text-color="white"
              >
                {{ props.row.status || "-" }}
              </q-badge>
            </q-td>

            <q-td key="request" :props="props">
              <div class="request-type-cell">
                <q-avatar
                  size="34px"
                  :color="
                    props.row.category === 'VACACIONES' ? 'green-1' : 'blue-1'
                  "
                  :text-color="
                    props.row.category === 'VACACIONES' ? 'positive' : 'primary'
                  "
                >
                  <q-icon
                    :name="
                      props.row.category === 'VACACIONES'
                        ? 'beach_access'
                        : 'assignment'
                    "
                    size="18px"
                  />
                </q-avatar>

                <div>
                  <div class="text-weight-bold">
                    {{ props.row.permissionType?.name || "-" }}
                  </div>
                  <div class="text-caption text-grey-7">
                    {{ props.row.category || "-" }}
                  </div>
                </div>
              </div>
            </q-td>

            <q-td key="requestedAt" :props="props">
              <div class="requested-at-cell">
                <div class="text-weight-bold">
                  {{ formatDate(props.row.createdAt) }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ formatTime(props.row.createdAt) }}
                </div>
              </div>
            </q-td>

            <q-td key="dates" :props="props">
              <div class="text-weight-bold">
                {{ formatDate(props.row.startDate) }} -
                {{ formatDate(props.row.endDate) }}
              </div>

              <div v-if="props.row.startTime" class="text-caption text-grey-7">
                {{ props.row.startTime }} - {{ props.row.endTime }}
              </div>
            </q-td>

            <q-td key="duration" :props="props">
              <q-chip
                dense
                color="blue-1"
                text-color="primary"
                class="text-weight-bold"
              >
                {{ getDurationText(props.row) }}
              </q-chip>
            </q-td>

            <q-td key="reason" :props="props">
              <div class="reason-cell">
                {{ props.row.reason || "-" }}
              </div>

              <q-tooltip v-if="props.row.reason">
                <div style="max-width: 420px; white-space: pre-wrap">
                  {{ props.row.reason }}
                </div>
              </q-tooltip>
            </q-td>

            <q-td key="performedBy" :props="props">
              <div class="managed-by-cell">
                {{ props.row.performedBy?.name || "-" }}
              </div>
            </q-td>
          </q-tr>
        </template>

        <template #no-data>
          <div class="full-width text-center q-pa-xl text-grey-7">
            <q-icon name="event_busy" size="44px" color="grey-5" />
            <div class="text-subtitle1 text-weight-bold q-mt-sm">
              No hay solicitudes
            </div>
            <div class="text-caption">
              Cuando los empleados soliciten permisos o vacaciones aparecerán aquí.
            </div>
          </div>
        </template>
      </q-table>

      <div class="pagination-wrap">
        <TablePagination
          v-model="initialPagination"
          :orderQuantity="orderQuantity"
          color="light-blue-10"
          active-color="light-blue-5"
          :maxPages="6"
        />
      </div>
    </q-card>

    <q-dialog v-model="manageDialog.open" persistent>
      <q-card class="manage-dialog column no-wrap">
        <q-card-section class="dialog-header bg-primary row items-center justify-between">
          <div class="row items-center no-wrap text-white">
            <div class="dialog-icon">
              <q-icon name="manage_accounts" size="30px" />
            </div>

            <div>
              <div class="dialog-title">Gestionar solicitud</div>
              <div class="dialog-subtitle">
                Revisa el resumen, historial y acciones disponibles.
              </div>
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            color="white"
            icon="close"
            @click="closeManageDialog"
          />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="manageDialog.row" class="manage-body">
          <q-card flat bordered class="request-hero-card q-mb-md">
            <div class="row items-center q-col-gutter-md">
              <div class="col-12 col-md">
                <div class="row items-center no-wrap">
                  <q-avatar size="56px" class="employee-avatar">
                    {{ getInitials(manageDialog.row.user?.name) }}
                  </q-avatar>

                  <div class="q-ml-md">
                    <div class="hero-title">
                      {{ manageDialog.row.user?.name || "Empleado" }}
                    </div>
                    <div class="hero-subtitle">
                      {{ manageDialog.row.user?.email || "Sin correo" }}
                    </div>
                    <div class="hero-subtitle">
                      {{ manageDialog.row.permissionType?.name || "Solicitud" }}
                      · {{ manageDialog.row.category || "-" }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-auto">
                <q-badge
                  rounded
                  :color="getStatusColor(manageDialog.row.status)"
                  text-color="white"
                  class="status-badge hero-status"
                >
                  {{ manageDialog.row.status || "-" }}
                </q-badge>
              </div>
            </div>

            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-12 col-sm-6 col-md-3">
                <div class="mini-info-card">
                  <div class="mini-info-label">Solicitada</div>
                  <div class="mini-info-value">
                    {{ formatDateTime(manageDialog.row.createdAt) }}
                  </div>
                </div>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <div class="mini-info-card">
                  <div class="mini-info-label">Fechas</div>
                  <div class="mini-info-value">
                    {{ formatDate(manageDialog.row.startDate) }} -
                    {{ formatDate(manageDialog.row.endDate) }}
                  </div>
                </div>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <div class="mini-info-card">
                  <div class="mini-info-label">Duración</div>
                  <div class="mini-info-value">
                    {{ getDurationText(manageDialog.row) }}
                  </div>
                </div>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <div class="mini-info-card">
                  <div class="mini-info-label">Gestionado por</div>
                  <div class="mini-info-value">
                    {{ manageDialog.row.performedBy?.name || "-" }}
                  </div>
                </div>
              </div>
            </div>
          </q-card>

          <q-card flat bordered class="action-card q-mb-md">
            <q-card-section>
              <div class="section-title">Acciones rápidas</div>
              <div class="section-subtitle">
                Ejecuta una acción sobre esta solicitud.
              </div>

              <div class="row q-col-gutter-sm q-mt-md">
                <div class="col-12 col-sm-6 col-md-2" v-if="canApprove(manageDialog.row)">
                  <q-btn
                    unelevated
                    rounded
                    no-caps
                    color="positive"
                    icon="check_circle"
                    label="Aprobar"
                    class="full-width action-btn"
                    @click="openActionDialog(manageDialog.row, actionDefinitions.approve)"
                  />
                </div>

                <div class="col-12 col-sm-6 col-md-2" v-if="canModify(manageDialog.row)">
                  <q-btn
                    unelevated
                    rounded
                    no-caps
                    color="primary"
                    icon="edit"
                    label="Modificar"
                    class="full-width action-btn"
                    @click="openEditDialog(manageDialog.row)"
                  />
                </div>

                <div class="col-12 col-sm-6 col-md-2" v-if="canReject(manageDialog.row)">
                  <q-btn
                    outline
                    rounded
                    no-caps
                    color="negative"
                    icon="cancel"
                    label="Rechazar"
                    class="full-width action-btn"
                    @click="openActionDialog(manageDialog.row, actionDefinitions.reject)"
                  />
                </div>

                <div class="col-12 col-sm-6 col-md-2">
                  <q-btn
                    outline
                    rounded
                    no-caps
                    color="primary"
                    icon="comment"
                    label="Comentar"
                    class="full-width action-btn"
                    @click="openActionDialog(manageDialog.row, actionDefinitions.comment)"
                  />
                </div>

                <div class="col-12 col-sm-6 col-md-2" v-if="canFinalize(manageDialog.row)">
                  <q-btn
                    unelevated
                    rounded
                    no-caps
                    color="green-10"
                    icon="task_alt"
                    label="Finalizar"
                    class="full-width action-btn"
                    @click="openActionDialog(manageDialog.row, actionDefinitions.finalize)"
                  />
                </div>

                <div class="col-12 col-sm-6 col-md-2">
                  <q-btn
                    outline
                    rounded
                    no-caps
                    color="grey-8"
                    icon="open_in_full"
                    label="Detalle"
                    class="full-width action-btn"
                    @click="openDetailsDialog(manageDialog.row)"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="manage-tabs-card">
            <q-tabs
              v-model="manageDialog.tab"
              dense
              active-color="primary"
              indicator-color="primary"
              align="left"
              class="text-grey-8"
            >
              <q-tab name="summary" icon="summarize" label="Resumen" />
              <q-tab name="history" icon="history" label="Historial" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="manageDialog.tab" animated>
              <q-tab-panel name="summary" class="q-pa-md">
                <div class="summary-list">
                  <div class="summary-item">
                    <div class="summary-label">Categoría</div>
                    <div class="summary-value">
                      {{ manageDialog.row.category || "-" }}
                    </div>
                  </div>

                  <div class="summary-item">
                    <div class="summary-label">Horario</div>
                    <div class="summary-value">
                      <span v-if="manageDialog.row.startTime">
                        {{ manageDialog.row.startTime }} -
                        {{ manageDialog.row.endTime || "-" }}
                      </span>
                      <span v-else>—</span>
                    </div>
                  </div>

                  <div class="summary-item summary-item--full">
                    <div class="summary-label">Motivo</div>
                    <div class="summary-text">
                      {{ manageDialog.row.reason || "-" }}
                    </div>
                  </div>

                  <div
                    v-if="manageDialog.row.comment"
                    class="summary-item summary-item--full"
                  >
                    <div class="summary-label">Último comentario</div>
                    <div class="summary-text">
                      {{ manageDialog.row.comment }}
                    </div>
                  </div>

                  <q-banner
                    v-if="manageDialog.row.vacationBalance"
                    rounded
                    class="bg-green-1 text-green-10 q-mt-sm"
                  >
                    <template #avatar>
                      <q-icon name="beach_access" />
                    </template>
                    Esta solicitud está conectada al balance de vacaciones.
                  </q-banner>
                </div>
              </q-tab-panel>

              <q-tab-panel name="history" class="q-pa-md">
                <AdminPermissionRequestHistoryTimeline
                  :request-id="manageDialog.row._id"
                  :history="historyById[manageDialog.row._id] || []"
                  :loading="historyLoading[manageDialog.row._id] || false"
                  :error="historyError[manageDialog.row._id] || ''"
                  @refresh="() => fetchRequestHistory(manageDialog.row._id, true)"
                />
              </q-tab-panel>
            </q-tab-panels>
          </q-card>
        </q-card-section>
      </q-card>
    </q-dialog>

    <AdminPermissionRequestActionDialog
      v-model="actionDialog.open"
      :request="actionDialog.row"
      :action="actionDialog.action"
      @saved="handleDialogSaved"
    />

    <AdminPermissionRequestDetailsDialog
      v-model="detailsDialog.open"
      :request="detailsDialog.row"
    />

    <AdminPermissionRequestEditDialog
      v-model="editDialog.open"
      :request="editDialog.row"
      @saved="handleDialogSaved"
    />
  </q-page>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import moment from "moment";

import methodsHttp from "src/api/methodsHttp";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import TablePagination from "src/components/table/TablePagination.vue";
import AdminPermissionRequestActionDialog from "src/components/permissions/admin/AdminPermissionRequestActionDialog.vue";
import AdminPermissionRequestDetailsDialog from "src/components/permissions/admin/AdminPermissionRequestDetailsDialog.vue";
import AdminPermissionRequestEditDialog from "src/components/permissions/admin/AdminPermissionRequestEditDialog.vue";
import AdminPermissionRequestHistoryTimeline from "src/components/permissions/admin/AdminPermissionRequestHistoryTimeline.vue";

const $q = useQuasar();

const requests = ref([]);
const loading = ref(false);

const stats = ref({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  finalized: 0,
  vacations: 0,
  permissions: 0,
});

const historyById = reactive({});
const historyLoading = reactive({});
const historyError = reactive({});

const searchText = ref("");
const statusFilter = ref([]);
const categoryFilter = ref(null);

const limit = ref(15);
const initial = ref(0);
const orderQuantity = ref(1);
const initialPagination = ref(1);

const manageDialog = ref({
  open: false,
  row: null,
  tab: "summary",
});

const actionDialog = ref({
  open: false,
  row: null,
  action: null,
});

const detailsDialog = ref({
  open: false,
  row: null,
});

const editDialog = ref({
  open: false,
  row: null,
});

const statusOptions = [
  "PENDIENTE",
  "COMENTADA",
  "EDITADA",
  "MODIFICADA",
  "RECHAZADA",
  "APROBADA",
  "ACEPTADA",
  "NO ACEPTADA",
  "FINALIZADA",
];

const categoryOptions = [
  { label: "Permiso", value: "PERMISO" },
  { label: "Vacaciones", value: "VACACIONES" },
];

const actionDefinitions = {
  approve: {
    code: "APROBADA",
    title: "Aprobar solicitud",
    subtitle: "Confirma la aprobación de la solicitud.",
    confirmLabel: "Aprobar",
    icon: "check_circle",
    color: "positive",
    bannerClass: "bg-green-1 text-green-10",
    message:
      "Al aprobar, se procesará el permiso. Si es vacaciones, también se descontará del balance del empleado.",
    requiresComment: false,
  },
  reject: {
    code: "RECHAZADA",
    title: "Rechazar solicitud",
    subtitle: "Indica el motivo del rechazo.",
    confirmLabel: "Rechazar",
    icon: "cancel",
    color: "negative",
    bannerClass: "bg-red-1 text-red-10",
    message: "El empleado será notificado del rechazo.",
    requiresComment: true,
  },
  comment: {
    code: "COMENTADA",
    title: "Comentar solicitud",
    subtitle: "Agrega un comentario para el empleado.",
    confirmLabel: "Guardar comentario",
    icon: "comment",
    color: "primary",
    bannerClass: "bg-blue-1 text-primary",
    message: "El comentario quedará registrado en el historial.",
    requiresComment: true,
  },
  finalize: {
    code: "FINALIZADA",
    title: "Finalizar solicitud",
    subtitle: "Marca la solicitud como finalizada.",
    confirmLabel: "Finalizar",
    icon: "task_alt",
    color: "green-10",
    bannerClass: "bg-green-1 text-green-10",
    message: "Esta acción cerrará el flujo de la solicitud.",
    requiresComment: false,
  },
};

const tableColumns = [
  { name: "actions", label: "Acciones", align: "center", field: () => "" },
  {
    name: "employee",
    label: "Empleado",
    align: "left",
    field: (row) => row?.user?.name || "-",
  },
  {
    name: "status",
    label: "Estado",
    align: "center",
    field: (row) => row?.status || "-",
  },
  {
    name: "request",
    label: "Solicitud",
    align: "left",
    field: (row) => row?.permissionType?.name || "-",
  },
  {
    name: "requestedAt",
    label: "Solicitada",
    align: "left",
    field: (row) => row?.createdAt || "",
  },
  {
    name: "dates",
    label: "Fechas solicitadas",
    align: "left",
    field: (row) => row?.startDate || "",
  },
  {
    name: "duration",
    label: "Duración",
    align: "left",
    field: (row) => row?.totalDays || row?.totalHour || 0,
  },
  {
    name: "reason",
    label: "Motivo",
    align: "left",
    field: (row) => row?.reason || "-",
  },
  {
    name: "performedBy",
    label: "Gestionado por",
    align: "left",
    field: (row) => row?.performedBy?.name || "-",
  },
];

onMounted(async () => {
  await reloadRequests();
});

watch(initialPagination, async (value) => {
  const page = Number(value || 1);
  initial.value = page <= 1 ? 0 : page * limit.value - limit.value;

  await loadRequests();
});

watch(
  [searchText, statusFilter, categoryFilter],
  async () => {
    if (initialPagination.value !== 1) {
      initialPagination.value = 1;
      return;
    }

    initial.value = 0;
    await loadRequests();
  },
  { deep: true },
);

watch(
  () => manageDialog.value.tab,
  async (value) => {
    if (value === "history" && manageDialog.value.row?._id) {
      await fetchRequestHistory(manageDialog.value.row._id, false);
    }
  },
);

const reloadRequests = async () => {
  initial.value = 0;
  initialPagination.value = 1;
  await loadRequests();
};

const loadRequests = async () => {
  loading.value = true;

  try {
    const selectedId = manageDialog.value.row?._id || null;

    const params = new URLSearchParams();

    params.set("limit", String(limit.value));
    params.set("initial", String(initial.value));

    const query = String(searchText.value || "").trim();
    const statuses = (statusFilter.value || []).join(",");

    if (query) params.set("q", query);
    if (statuses) params.set("statuses", statuses);
    if (categoryFilter.value) params.set("category", categoryFilter.value);

    const response = await methodsHttp.getApi(`permission/requests?${params}`);

    if (response?.ok) {
      const list = response.requests || response.data || [];

      requests.value = list;

      stats.value = {
        total: Number(response.stats?.total || 0),
        pending: Number(response.stats?.pending || 0),
        approved: Number(response.stats?.approved || 0),
        rejected: Number(response.stats?.rejected || 0),
        finalized: Number(response.stats?.finalized || 0),
        vacations: Number(response.stats?.vacations || 0),
        permissions: Number(response.stats?.permissions || 0),
      };

      const total = Number(
        response?.meta?.total ?? response?.count ?? response?.total ?? 0,
      );

      orderQuantity.value = Math.max(1, Math.ceil(total / limit.value));

      if (selectedId) {
        const updatedSelected = list.find((item) => item._id === selectedId);

        if (updatedSelected) {
          manageDialog.value.row = updatedSelected;
        }
      }

      return;
    }

    requests.value = [];
    resetStats();
    orderQuantity.value = 1;
  } catch (error) {
    console.error("loadRequests error:", error);

    requests.value = [];
    resetStats();
    orderQuantity.value = 1;

    $q.notify({
      type: "negative",
      message: "Error cargando solicitudes",
    });
  } finally {
    loading.value = false;
  }
};

const resetStats = () => {
  stats.value = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    finalized: 0,
    vacations: 0,
    permissions: 0,
  };
};

const resetFilters = async () => {
  searchText.value = "";
  statusFilter.value = [];
  categoryFilter.value = null;
  await reloadRequests();
};

const openManageDialog = async (row, tab = "summary") => {
  manageDialog.value = {
    open: true,
    row,
    tab,
  };

  if (tab === "history") {
    await fetchRequestHistory(row._id, false);
  }
};

const closeManageDialog = () => {
  manageDialog.value = {
    open: false,
    row: null,
    tab: "summary",
  };
};

const openActionDialog = (row, action) => {
  actionDialog.value = {
    open: true,
    row,
    action,
  };
};

const openDetailsDialog = (row) => {
  detailsDialog.value = {
    open: true,
    row,
  };
};

const openEditDialog = (row) => {
  editDialog.value = {
    open: true,
    row,
  };
};

const handleDialogSaved = async () => {
  actionDialog.value = {
    open: false,
    row: null,
    action: null,
  };

  editDialog.value = {
    open: false,
    row: null,
  };

  await loadRequests();

  if (manageDialog.value.row?._id) {
    await fetchRequestHistory(manageDialog.value.row._id, true);
  }
};

const fetchRequestHistory = async (requestId, force = false) => {
  if (!requestId) return;
  if (!force && historyById[requestId]) return;
  if (historyLoading[requestId]) return;

  historyLoading[requestId] = true;
  historyError[requestId] = "";

  try {
    const response = await methodsHttp.getApi(
      `permission/requests/${requestId}/history`,
    );

    if (response?.ok) {
      const list = Array.isArray(response.history) ? response.history : [];

      historyById[requestId] = list.sort((a, b) => {
        const dateA = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
        const dateB = new Date(b?.createdAt || b?.updatedAt || 0).getTime();

        return dateB - dateA;
      });

      return;
    }

    historyById[requestId] = [];
    historyError[requestId] =
      response?.mensaje || "Respuesta inválida del servidor";
  } catch (error) {
    historyById[requestId] = [];
    historyError[requestId] = "Error de red cargando historial";
  } finally {
    historyLoading[requestId] = false;
  }
};

const formatDate = (value) => {
  if (!value) return "-";

  return moment(value).format("YYYY/MM/DD");
};

const formatTime = (value) => {
  if (!value) return "-";

  return moment(value).format("hh:mm A");
};

const formatDateTime = (value) => {
  if (!value) return "-";

  return moment(value).format("YYYY/MM/DD hh:mm A");
};

const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const getStatusColor = (status) => {
  const value = String(status || "").toUpperCase();

  const map = {
    PENDIENTE: "orange-8",
    COMENTADA: "warning",
    EDITADA: "primary",
    MODIFICADA: "purple-7",
    RECHAZADA: "negative",
    APROBADA: "secondary",
    ACEPTADA: "green-13",
    "NO ACEPTADA": "red-14",
    FINALIZADA: "green-10",
  };

  return map[value] || "grey-7";
};

const getDurationText = (row) => {
  const days = Number(row?.totalDays || 0);

  if (days >= 1) {
    return `${days} día(s)`;
  }

  if (row?.totalMinutes != null) {
    const minutes = Number(row.totalMinutes || 0);
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return `${hours}h ${remaining}m`;
  }

  const totalHours = Number(row?.totalHour ?? row?.totlaHour ?? 0) || 0;
  const minutes = Math.round(totalHours * 60);
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return `${hours}h ${remaining}m`;
};

const getStatusValue = (row) => String(row?.status || "").toUpperCase();

const canApprove = (row) => {
  return !["APROBADA", "RECHAZADA", "FINALIZADA"].includes(
    getStatusValue(row),
  );
};

const canReject = (row) => {
  return !["APROBADA", "RECHAZADA", "FINALIZADA"].includes(
    getStatusValue(row),
  );
};

const canModify = (row) => {
  return !["APROBADA", "RECHAZADA", "FINALIZADA"].includes(
    getStatusValue(row),
  );
};

const canFinalize = (row) => {
  return ["APROBADA", "ACEPTADA"].includes(getStatusValue(row));
};
</script>

<style scoped>
.admin-permissions-page {
  min-height: calc(100vh - 100px);
}

.header-btn {
  height: 40px;
  border-radius: 999px;
  font-weight: 800;
}

.header-field {
  min-width: 210px;
}

.header-field--wide {
  min-width: 270px;
}

.header-search {
  min-width: 300px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 14px;
}

.stat-card {
  min-height: 86px;
  padding: 14px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.04);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 15px;
  font-size: 22px;
}

.stat-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  color: #0f172a;
  font-size: 1.55rem;
  font-weight: 900;
  line-height: 1;
  margin-top: 5px;
}

.panel-card {
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.04);
}

.table-header {
  min-height: 76px;
  background: white;
}

.table-title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.table-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}

.requests-table {
  background: white;
}

.table-row {
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.table-row:hover {
  background: rgba(15, 23, 42, 0.025);
}

.employee-cell {
  min-width: 240px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.employee-avatar {
  color: white;
  font-weight: 900;
  background: linear-gradient(135deg, #1a2436, #1964a2);
}

.employee-name {
  color: #0f172a;
  font-weight: 900;
  line-height: 1.1;
}

.employee-email {
  color: #64748b;
  font-size: 0.76rem;
  margin-top: 2px;
}

.request-type-cell {
  min-width: 210px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.requested-at-cell {
  min-width: 120px;
}

.status-badge {
  padding: 6px 10px;
  font-weight: 800;
}

.reason-cell {
  max-width: 360px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.managed-by-cell {
  min-width: 130px;
}

.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.manage-dialog {
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

.manage-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(92vh - 78px);
  padding: 18px;
  background: #f8fafc;
}

.request-hero-card,
.action-card,
.manage-tabs-card {
  border-radius: 20px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.request-hero-card {
  padding: 16px;
}

.hero-title {
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.1;
}

.hero-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.82rem;
}

.hero-status {
  padding: 8px 12px;
}

.mini-info-card {
  min-height: 64px;
  padding: 12px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.mini-info-label {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 5px;
}

.mini-info-value {
  color: #0f172a;
  font-size: 0.85rem;
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
}

.action-btn {
  min-height: 38px;
  font-weight: 800;
}

.summary-list {
  display: grid;
  gap: 10px;
}

.summary-item {
  padding: 12px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.summary-label {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-value {
  margin-top: 4px;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 900;
}

.summary-text {
  margin-top: 5px;
  color: #0f172a;
  font-size: 0.86rem;
  line-height: 1.35;
  white-space: pre-wrap;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
  }
}

@media (max-width: 599px) {
  .header-field,
  .header-field--wide,
  .header-search {
    width: 100%;
    min-width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .manage-dialog {
    width: 96vw;
    max-height: 94vh;
  }

  .manage-body {
    max-height: calc(94vh - 78px);
    padding: 12px;
  }
}
</style>