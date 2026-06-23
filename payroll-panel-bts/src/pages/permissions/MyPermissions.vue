<template>
  <div class="my-requests-page">
    <PageHeaderCard
      title="Mis solicitudes"
      subtitle="Crea, edita y consulta tus permisos y vacaciones."
      icon="event_note"
    >
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nueva solicitud"
          class="header-btn"
          no-caps
          @click="openCreateRequest"
        />

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

        <q-select
          v-model="permissionTypeFilter"
          :options="permissionTypes"
          option-label="name"
          option-value="_id"
          label="Tipo"
          dense
          outlined
          rounded
          clearable
          color="primary"
          class="header-field"
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

        <q-input
          v-model="searchText"
          outlined
          dense
          rounded
          debounce="350"
          label="Buscar"
          placeholder="Tipo, estado, motivo..."
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

        <q-btn
          color="primary"
          outline
          rounded
          no-caps
          icon="restart_alt"
          label="Limpiar"
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
        <q-avatar class="stat-icon bg-green-1 text-positive">
          <q-icon name="beach_access" />
        </q-avatar>

        <div>
          <div class="stat-label">Vacaciones</div>
          <div class="stat-value">{{ stats.vacations }}</div>
        </div>
      </q-card>
    </div>

    <q-card flat bordered class="panel-card">
      <q-card-section class="table-header row items-center justify-between">
        <div>
          <div class="table-title">Listado de solicitudes</div>
          <div class="table-subtitle">
            Haz click en una fila para ver el resumen, acciones e historial.
          </div>
        </div>

        <q-chip dense color="blue-1" text-color="primary" icon="touch_app">
          Click en una fila para gestionar
        </q-chip>
      </q-card-section>

      <q-separator />

      <q-table
        :loading="loading"
        :columns="tableColumns"
        :rows="requests"
        row-key="_id"
        flat
        bordered
        separator="horizontal"
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
                  icon="visibility"
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

            <q-td key="type" :props="props">
              <div class="type-cell">
                <q-avatar
                  size="36px"
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
              {{ props.row.performedBy?.name || "-" }}
            </q-td>
          </q-tr>
        </template>

        <template #no-data>
          <div class="full-width text-center q-pa-xl text-grey-7">
            <q-icon name="event_busy" size="44px" color="grey-5" />
            <div class="text-subtitle1 text-weight-bold q-mt-sm">
              No tienes solicitudes
            </div>
            <div class="text-caption">
              Crea una solicitud de permiso o vacaciones para comenzar.
            </div>
          </div>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="manageDialog.open" persistent>
      <q-card class="manage-dialog column no-wrap">
        <q-card-section class="dialog-header bg-primary row items-center justify-between">
          <div class="row items-center no-wrap text-white">
            <div class="dialog-icon">
              <q-icon
                :name="
                  manageDialog.row?.category === 'VACACIONES'
                    ? 'beach_access'
                    : 'assignment'
                "
                size="30px"
              />
            </div>

            <div>
              <div class="dialog-title">Detalle de solicitud</div>
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
                  <q-avatar
                    size="56px"
                    :color="
                      manageDialog.row.category === 'VACACIONES'
                        ? 'green-1'
                        : 'blue-1'
                    "
                    :text-color="
                      manageDialog.row.category === 'VACACIONES'
                        ? 'positive'
                        : 'primary'
                    "
                  >
                    <q-icon
                      :name="
                        manageDialog.row.category === 'VACACIONES'
                          ? 'beach_access'
                          : 'assignment'
                      "
                      size="28px"
                    />
                  </q-avatar>

                  <div class="q-ml-md">
                    <div class="hero-title">
                      {{ manageDialog.row.permissionType?.name || "Solicitud" }}
                    </div>
                    <div class="hero-subtitle">
                      {{ manageDialog.row.category || "-" }}
                    </div>
                    <div class="hero-subtitle">
                      Solicitada el {{ formatDateTime(manageDialog.row.createdAt) }}
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
                  <div class="mini-info-label">Horario</div>
                  <div class="mini-info-value">
                    <span v-if="manageDialog.row.startTime">
                      {{ manageDialog.row.startTime }} -
                      {{ manageDialog.row.endTime || "-" }}
                    </span>
                    <span v-else>—</span>
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
              <div class="section-title">Acciones disponibles</div>
              <div class="section-subtitle">
                Puedes editar, comentar o responder modificaciones según el estado.
              </div>

              <div class="row q-col-gutter-sm q-mt-md">
                <div
                  v-if="canAcceptModifiedRequest(manageDialog.row)"
                  class="col-12 col-sm-6 col-md-3"
                >
                  <q-btn
                    unelevated
                    rounded
                    no-caps
                    color="positive"
                    icon="check_circle"
                    label="Aceptar"
                    class="full-width action-btn"
                    @click="acceptModifiedRequest(manageDialog.row)"
                  />
                </div>

                <div
                  v-if="canAcceptModifiedRequest(manageDialog.row)"
                  class="col-12 col-sm-6 col-md-3"
                >
                  <q-btn
                    outline
                    rounded
                    no-caps
                    color="negative"
                    icon="cancel"
                    label="No aceptar"
                    class="full-width action-btn"
                    @click="rejectModifiedRequest(manageDialog.row)"
                  />
                </div>

                <div
                  v-if="canEditRequest(manageDialog.row)"
                  class="col-12 col-sm-6 col-md-3"
                >
                  <q-btn
                    unelevated
                    rounded
                    no-caps
                    color="primary"
                    icon="edit"
                    label="Editar"
                    class="full-width action-btn"
                    @click="openEditRequest(manageDialog.row)"
                  />
                </div>

                <div
                  v-if="canCommentRequest(manageDialog.row)"
                  class="col-12 col-sm-6 col-md-3"
                >
                  <q-btn
                    outline
                    rounded
                    no-caps
                    color="primary"
                    icon="comment"
                    label="Comentar"
                    class="full-width action-btn"
                    @click="openCommentDialog(manageDialog.row)"
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

    <PermissionRequestFormDialog
      v-model="requestDialog.open"
      :request="requestDialog.row"
      @saved="handleRequestSaved"
    />

    <q-dialog v-model="commentDialog.open" persistent>
      <q-card class="comment-card">
        <q-card-section class="comment-header bg-primary row items-center justify-between">
          <div class="row items-center q-gutter-sm text-white">
            <q-icon size="md" name="comment" />
            <div class="text-weight-bold">Comentar solicitud</div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            :disable="commentDialog.saving"
            @click="closeCommentDialog"
          />
        </q-card-section>

        <q-card-section>
          <div class="field-label required">Comentario</div>

          <q-input
            v-model="commentDialog.comment"
            outlined
            rounded
            dense
            type="textarea"
            label="Escribe tu comentario"
            autogrow
            color="primary"
          />

          <div class="row justify-end q-gutter-sm q-mt-md">
            <q-btn
              flat
              rounded
              no-caps
              color="negative"
              label="Cancelar"
              :disable="commentDialog.saving"
              @click="closeCommentDialog"
            />

            <q-btn
              unelevated
              rounded
              no-caps
              color="primary"
              label="Guardar"
              icon="save"
              :loading="commentDialog.saving"
              :disable="!String(commentDialog.comment || '').trim()"
              @click="saveComment"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import moment from "moment";

import methodsHttp from "src/api/methodsHttp";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import PermissionRequestFormDialog from "src/components/permissions/PermissionRequestFormDialog.vue";
import AdminPermissionRequestHistoryTimeline from "src/components/permissions/admin/AdminPermissionRequestHistoryTimeline.vue";

const $q = useQuasar();

const requests = ref([]);
const loading = ref(false);

const permissionTypeFilter = ref(null);
const permissionTypes = ref([]);

const searchText = ref("");
const statusFilter = ref([]);

const requestDialog = ref({
  open: false,
  row: null,
});

const manageDialog = ref({
  open: false,
  row: null,
  tab: "summary",
});

const commentDialog = ref({
  open: false,
  row: null,
  comment: "",
  saving: false,
});

const historyById = reactive({});
const historyLoading = reactive({});
const historyError = reactive({});

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

const tableColumns = [
  { name: "actions", label: "Acciones", align: "center", field: () => "" },
  {
    name: "type",
    label: "Solicitud",
    align: "left",
    field: (row) => row?.permissionType?.name || "-",
  },
  {
    name: "status",
    label: "Estado",
    align: "center",
    field: (row) => row?.status || "-",
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

const stats = computed(() => {
  const list = Array.isArray(requests.value) ? requests.value : [];

  return {
    total: list.length,
    pending: list.filter((item) => getStatusValue(item) === "PENDIENTE").length,
    approved: list.filter((item) => getStatusValue(item) === "APROBADA").length,
    vacations: list.filter(
      (item) => String(item?.category || "").toUpperCase() === "VACACIONES",
    ).length,
  };
});

onMounted(async () => {
  await Promise.all([loadPermissionTypes(), reloadRequests()]);
});

watch(
  [searchText, statusFilter, permissionTypeFilter],
  async () => {
    await loadMyRequests();
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

const loadPermissionTypes = async () => {
  const response = await methodsHttp.getApi("permission/types");

  if (response?.ok) {
    permissionTypes.value = response.permissionTypes || response.permissionType || [];
  }
};

const reloadRequests = async () => {
  await loadMyRequests();
};

const loadMyRequests = async () => {
  loading.value = true;

  try {
    const selectedId = manageDialog.value.row?._id || null;
    const params = new URLSearchParams();

    const query = String(searchText.value || "").trim();
    const statuses = (statusFilter.value || []).join(",");

    if (query) params.set("q", query);
    if (statuses) params.set("statuses", statuses);
    if (permissionTypeFilter.value) {
      params.set("permissionType", permissionTypeFilter.value);
    }

    const url = params.toString()
      ? `permission/requests/mine?${params.toString()}`
      : "permission/requests/mine";

    const response = await methodsHttp.getApi(url);

    if (response?.ok) {
      const list = response.requests || response.data || [];

      requests.value = list;

      if (selectedId) {
        const updatedSelected = list.find((item) => item._id === selectedId);

        if (updatedSelected) {
          manageDialog.value.row = updatedSelected;
        }
      }

      return;
    }

    requests.value = [];
  } catch (error) {
    console.error("loadMyRequests error:", error);

    requests.value = [];

    $q.notify({
      type: "negative",
      message: "Error cargando tus solicitudes",
    });
  } finally {
    loading.value = false;
  }
};

const resetFilters = async () => {
  permissionTypeFilter.value = null;
  statusFilter.value = [];
  searchText.value = "";
  await reloadRequests();
};

const openCreateRequest = () => {
  requestDialog.value = {
    open: true,
    row: null,
  };
};

const openEditRequest = (row) => {
  requestDialog.value = {
    open: true,
    row,
  };
};

const handleRequestSaved = async () => {
  requestDialog.value = {
    open: false,
    row: null,
  };

  await reloadRequests();

  if (manageDialog.value.row?._id) {
    await fetchRequestHistory(manageDialog.value.row._id, true);
  }
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

const openCommentDialog = (row) => {
  commentDialog.value = {
    open: true,
    row,
    comment: "",
    saving: false,
  };
};

const closeCommentDialog = () => {
  if (commentDialog.value.saving) return;

  commentDialog.value = {
    open: false,
    row: null,
    comment: "",
    saving: false,
  };
};

const saveComment = async () => {
  const row = commentDialog.value.row;

  if (!row?._id) return;

  commentDialog.value.saving = true;

  try {
    const response = await methodsHttp.postApi(
      `permission/requests/${row._id}/status`,
      {
        comment: String(commentDialog.value.comment || "").trim(),
        previousData: { ...row },
        action: "COMENTADA",
        status: row.status,
      },
    );

    if (response?.ok) {
      $q.notify({
        type: "positive",
        message: response.mensaje || "Comentario guardado",
      });

      closeCommentDialog();
      await reloadRequests();
      await fetchRequestHistory(row._id, true);

      return;
    }

    $q.notify({
      type: "negative",
      message: response?.mensaje || "Error al comentar",
    });
  } catch (error) {
    console.error("saveComment error:", error);

    $q.notify({
      type: "negative",
      message: "Error al comentar",
    });
  } finally {
    commentDialog.value.saving = false;
  }
};

const acceptModifiedRequest = async (row) => {
  await changeRequestStatus(row, "ACEPTADA");
};

const rejectModifiedRequest = async (row) => {
  await changeRequestStatus(row, "NO ACEPTADA");
};

const changeRequestStatus = async (row, action) => {
  if (!row?._id) return;

  try {
    const response = await methodsHttp.postApi(
      `permission/requests/${row._id}/status`,
      {
        comment: "",
        previousData: { ...row },
        action,
        status: row.status,
      },
    );

    if (response?.ok) {
      $q.notify({
        type: "positive",
        message: response.mensaje || "Solicitud actualizada",
      });

      await reloadRequests();
      await fetchRequestHistory(row._id, true);

      return;
    }

    $q.notify({
      type: "negative",
      message: response?.mensaje || "Error al actualizar",
    });
  } catch (error) {
    console.error("changeRequestStatus error:", error);

    $q.notify({
      type: "negative",
      message: "Error al actualizar la solicitud",
    });
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

const getStatusValue = (row) => String(row?.status || "").toUpperCase();

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
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
  }

  const totalHours = Number(row?.totalHour ?? row?.totlaHour ?? 0) || 0;
  const minutes = Math.round(totalHours * 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
};

const canAcceptModifiedRequest = (row) => {
  return getStatusValue(row) === "MODIFICADA";
};

const canEditRequest = (row) => {
  return !["APROBADA", "FINALIZADA"].includes(getStatusValue(row));
};

const canCommentRequest = (row) => {
  return !["PENDIENTE", "APROBADA", "FINALIZADA"].includes(getStatusValue(row));
};
</script>

<style scoped>
.my-requests-page {
  min-height: calc(100vh - 100px);
}

.header-btn {
  height: 40px;
  border-radius: 999px;
  font-weight: 800;
}

.header-field {
  min-width: 220px;
}

.header-field--wide {
  min-width: 260px;
}

.header-search {
  min-width: 280px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
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
  background: #ffffff;
}

.table-row {
  cursor: pointer;
  transition: background 0.2s ease;
}

.table-row:hover {
  background: rgba(15, 23, 42, 0.025);
}

.type-cell {
  min-width: 220px;
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
  max-width: 340px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.manage-dialog {
  width: 1080px;
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

.summary-text {
  margin-top: 5px;
  color: #0f172a;
  font-size: 0.86rem;
  line-height: 1.35;
  white-space: pre-wrap;
}

.comment-card {
  width: 720px;
  max-width: 92vw;
  border-radius: 18px;
  overflow: hidden;
}

.comment-header {
  min-height: 58px;
}

.field-label {
  margin-bottom: 6px;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-label.required::before {
  content: "* ";
  color: #e53935;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

:deep(.q-field--outlined.q-field--rounded .q-field__control) {
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