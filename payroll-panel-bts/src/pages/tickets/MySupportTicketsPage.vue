<template>
  <q-page class="support-tickets-page q-pa-md">
    <PageHeaderCard
      title="Mis tickets de soporte"
      subtitle="Consulta el estado de las solicitudes enviadas al equipo de soporte."
      icon="support_agent"
    >
      <template>
        <q-btn
          unelevated
          color="primary"
          icon="refresh"
          label="Actualizar"
          class="header-btn"
          :loading="loading"
          @click="loadTickets"
        />

        <q-input
          v-model="filters.text"
          outlined
          dense
          clearable
          label="Buscar ticket"
          color="primary"
          class="header-search"
          @keyup.enter="loadTickets"
        >
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
      </template>
    </PageHeaderCard>

    <q-card flat bordered class="panel-card filter-card q-mb-md">
      <q-card-section>
        <div class="row items-end q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="filters.status"
              :options="statusOptions"
              outlined
              dense
              rounded
              clearable
              emit-value
              map-options
              label="Estado"
            >
              <template #prepend>
                <q-icon name="flag" color="primary" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="filters.priority"
              :options="priorityOptions"
              outlined
              dense
              rounded
              clearable
              emit-value
              map-options
              label="Prioridad"
            >
              <template #prepend>
                <q-icon name="priority_high" color="primary" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-4">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-btn
                  color="primary"
                  unelevated
                  rounded
                  class="full-width action-btn"
                  icon="filter_alt"
                  label="Filtrar"
                  :loading="loading"
                  @click="loadTickets"
                />
              </div>

              <div class="col-12 col-sm-6">
                <q-btn
                  outline
                  color="grey-8"
                  rounded
                  class="full-width action-btn"
                  icon="restart_alt"
                  label="Limpiar"
                  :disable="loading"
                  @click="clearFilters"
                />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

      <q-table
        flat
        :rows="tickets"
        :columns="columns"
        row-key="_id"
        :loading="loading"
        v-model:pagination="pagination"
        @request="onRequest"
        bordered
      >
        <template #body-cell-title="props">
          <q-td :props="props">
            <div class="ticket-title">
              {{ props.row.title }}
            </div>

            <div class="ticket-description ellipsis-2-lines">
              {{ props.row.description }}
            </div>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-chip
              dense
              :color="getSupportTicketStatusColor(props.row.status)"
              text-color="white"
              class="status-chip"
            >
              {{ getSupportTicketStatusLabel(props.row.status) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-priority="props">
          <q-td :props="props">
            <q-chip
              dense
              outline
              :color="getSupportTicketPriorityColor(props.row.priority)"
              class="status-chip"
            >
              {{ getSupportTicketPriorityLabel(props.row.priority) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-emailSent="props">
          <q-td :props="props">
            <q-chip
              dense
              :color="props.row.emailSent ? 'positive' : 'negative'"
              text-color="white"
              class="status-chip"
            >
              <q-icon
                :name="props.row.emailSent ? 'mark_email_read' : 'error'"
                size="14px"
                class="q-mr-xs"
              />
              {{ props.row.emailSent ? "Enviado" : "Falló" }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-createdAt="props">
          <q-td :props="props">
            <div class="date-cell">
              <q-icon name="event" size="16px" color="grey-7" />
              <span>{{ formatDate(props.row.createdAt) }}</span>
            </div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              dense
              icon="visibility"
              color="primary"
              @click="openDetailDialog(props.row)"
            >
              <q-tooltip>Ver detalle</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template #no-data>
          <div class="full-width row flex-center q-pa-xl text-grey-7">
            <div class="text-center">
              <div class="empty-icon q-mx-auto q-mb-md">
                <q-icon name="support_agent" size="42px" color="primary" />
              </div>

              <div class="text-subtitle1 text-weight-bold text-dark">
                No tienes tickets registrados
              </div>

              <div class="text-caption text-grey-7 q-mt-xs">
                Cuando envíes una solicitud de soporte, aparecerá aquí.
              </div>
            </div>
          </div>
        </template>
      </q-table>

    <SupportTicketDetailDialog
      v-model="showDetailDialog"
      :ticket="selectedTicket"
      :loading="detailLoading"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { QTableProps } from "quasar";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import SupportTicketDetailDialog from "src/components/support/SupportTicketDetailDialog.vue";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import {
  getSupportTicketPriorityColor,
  getSupportTicketPriorityLabel,
  getSupportTicketStatusColor,
  getSupportTicketStatusLabel,
} from "src/helpers/catalogs/ticket.catalog";

const $q = useQuasar();

const loading = ref(false);
const detailLoading = ref(false);
const tickets = ref<any[]>([]);
const total = ref(0);
const showDetailDialog = ref(false);
const selectedTicket = ref<any | null>(null);

const filters = reactive({
  text: "",
  status: "",
  priority: "",
});

const statusOptions = [
  { label: "Abierto", value: "OPEN" },
  { label: "En proceso", value: "IN_PROGRESS" },
  { label: "Resuelto", value: "RESOLVED" },
  { label: "Cerrado", value: "CLOSED" },
];

const priorityOptions = [
  { label: "Baja", value: "LOW" },
  { label: "Media", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
];

const columns: QTableProps["columns"] = [
  {
    name: "title",
    label: "Ticket",
    field: "title",
    align: "left",
  },
  {
    name: "status",
    label: "Estado",
    field: "status",
    align: "left",
  },
  {
    name: "priority",
    label: "Prioridad",
    field: "priority",
    align: "left",
  },
  {
    name: "emailSent",
    label: "Correo",
    field: "emailSent",
    align: "left",
  },
  {
    name: "createdAt",
    label: "Fecha",
    field: "createdAt",
    align: "left",
  },
  {
    name: "actions",
    label: "Acciones",
    field: "actions",
    align: "right",
  },
];

const pagination = ref({
  sortBy: "createdAt",
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const formatDate = (value?: string | null) => {
  if (!value) return "N/D";

  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

const clearFilters = async () => {
  filters.text = "";
  filters.status = "";
  filters.priority = "";

  pagination.value.page = 1;

  await loadTickets();
};

const loadTickets = async () => {
  loading.value = true;

  try {
    const query = new URLSearchParams();

    query.append("limit", String(pagination.value.rowsPerPage));
    query.append(
      "initial",
      String((pagination.value.page - 1) * pagination.value.rowsPerPage),
    );

    if (filters.text) query.append("text", filters.text);
    if (filters.status) query.append("status", filters.status);
    if (filters.priority) query.append("priority", filters.priority);

    const resp = await methodsHttp.getApi(
      `/support/tickets${query.toString() ? `?${query.toString()}` : ""}`,
    );

    if (!resp?.ok) {
      throw new Error(resp?.mensaje || "No se pudieron cargar los tickets");
    }

    tickets.value = resp.tickets || [];
    total.value = resp.total || 0;
    pagination.value.rowsNumber = resp.total || 0;
  } catch (error: any) {
    $q.notify({
      type: "negative",
      message: error?.message || "No se pudieron cargar los tickets",
    });
  } finally {
    loading.value = false;
  }
};

const openDetailDialog = async (row: any) => {
  showDetailDialog.value = true;
  detailLoading.value = true;
  selectedTicket.value = null;

  try {
    const resp = await methodsHttp.getApi(`/support/tickets/${row._id}`);

    if (!resp?.ok) {
      throw new Error(resp?.mensaje || "No se pudo obtener el ticket");
    }

    selectedTicket.value = resp.ticket || null;
  } catch (error: any) {
    $q.notify({
      type: "negative",
      message: error?.message || "No se pudo obtener el ticket",
    });

    showDetailDialog.value = false;
  } finally {
    detailLoading.value = false;
  }
};

const onRequest: QTableProps["onRequest"] = async (props: any) => {
  pagination.value = props.pagination;
  await loadTickets();
};

onMounted(async () => {
  await loadTickets();
});
</script>

<style scoped>


/* ========================= */
/* Header actions */
/* ========================= */

.header-btn {
  height: 40px;
  border-radius: 12px;
  font-weight: 700;
}

.header-search {
  min-width: 280px;
}

@media (max-width: 599px) {
  .header-search {
    min-width: 100%;
    width: 100%;
  }

  .header-btn {
    width: 100%;
  }
}

/* ========================= */
/* Cards */
/* ========================= */

.panel-card {
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.filter-card {
  overflow: hidden;
}

.table-card {
  overflow: hidden;
}

/* ========================= */
/* Buttons */
/* ========================= */

.action-btn {
  min-height: 40px;
  font-weight: 700;
}

/* ========================= */
/* Table content */
/* ========================= */

.ticket-title {
  font-weight: 800;
  color: #0f172a;
  line-height: 1.25;
}

.ticket-description {
  margin-top: 3px;
  font-size: 0.78rem;
  line-height: 1.4;
  color: #64748b;
}

.status-chip {
  border-radius: 999px;
  font-weight: 700;
}

.date-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
}

.empty-icon {
  width: 78px;
  height: 78px;
  border-radius: 26px;
  background: rgba(25, 118, 210, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ========================= */
/* Helpers */
/* ========================= */

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ========================= */
/* Quasar table polish */
/* ========================= */

.table-card :deep(.q-table__top),
.table-card :deep(.q-table__bottom),
.table-card :deep(thead tr th) {
  background: #f8fafc;
}


.table-card :deep(tbody tr:hover) {
  background: rgba(25, 118, 210, 0.035);
}
</style>