<template>
  <q-page class="admin-support-page q-pa-md">
    <PageHeaderCard
      title="Tickets de soporte"
      subtitle="Visualiza y da seguimiento a todas las solicitudes de soporte."
      icon="support_agent"
    >
      <template #actions>
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

    <q-card flat bordered class="panel-card q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
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

          <div class="col-12 col-md-3">
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

          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.user"
              outlined
              dense
              rounded
              clearable
              label="Empleado"
              @keyup.enter="loadTickets"
            >
              <template #prepend>
                <q-icon name="person_search" color="primary" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-btn
                  color="primary"
                  unelevated
                  rounded
                  class="full-width filter-btn"
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
                  class="full-width filter-btn"
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

    <q-card flat bordered class="panel-card">
      <q-table
        flat
        bordered
        :rows="tickets"
        :columns="columns"
        row-key="_id"
        :loading="loading"
        v-model:pagination="pagination"
        @request="onRequest"
      >
        <template #body-cell-user="props">
          <q-td :props="props">
            <div class="text-weight-medium">
              {{ props.row.user?.name || "Sin usuario" }}
            </div>
            <div class="text-caption text-grey-7">
              {{ props.row.user?.email || "Sin correo" }}
            </div>
          </q-td>
        </template>

        <template #body-cell-title="props">
          <q-td :props="props">
            <div class="text-weight-medium">{{ props.row.title }}</div>
            <div class="text-caption text-grey-7 ellipsis-2-lines">
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
            >
              {{ props.row.emailSent ? "Enviado" : "Falló" }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-createdAt="props">
          <q-td :props="props">
            {{ formatDate(props.row.createdAt) }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <div class="row justify-end q-gutter-sm">
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

              <q-btn
                flat
                round
                dense
                icon="edit"
                color="secondary"
                @click="openManageDialog(props.row)"
              >
                <q-tooltip>Gestionar</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <template #no-data>
          <div class="full-width row flex-center q-pa-lg text-grey-7">
            No hay tickets registrados
          </div>
        </template>
      </q-table>
    </q-card>

    <SupportTicketDetailDialog
      v-model="showDetailDialog"
      :ticket="selectedTicket"
      :loading="detailLoading"
    />

    <q-dialog v-model="showManageDialog">
      <q-card class="manage-dialog">
        <q-card-section class="row items-start justify-between bg-primary text-white">
          <div class="row items-center q-gutter-sm">
            <q-icon name="edit_note" size="32px" color="white" />

            <div>
              <div class="text-h6 text-weight-bold">Gestionar ticket</div>
              <div class="text-caption">
                Actualiza el estado y agrega una respuesta
              </div>
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            v-close-popup
          />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input
            :model-value="manageTicket?.title || ''"
            label="Título"
            outlined
            dense
            rounded
            readonly
          />

          <q-select
            v-model="manageForm.status"
            :options="statusOptions"
            label="Estado"
            outlined
            dense
            rounded
            emit-value
            map-options
          />

          <q-input
            v-model="manageForm.responseMessage"
            type="textarea"
            label="Respuesta al usuario"
            outlined
            rounded
            autogrow
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat rounded color="grey-7" label="Cancelar" v-close-popup />

          <q-btn
            color="primary"
            rounded
            unelevated
            :loading="saving"
            label="Guardar cambios"
            @click="saveManageTicket"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
const saving = ref(false);

const tickets = ref<any[]>([]);
const total = ref(0);

const showDetailDialog = ref(false);
const selectedTicket = ref<any | null>(null);

const showManageDialog = ref(false);
const manageTicket = ref<any | null>(null);

const manageForm = reactive({
  status: "OPEN",
  responseMessage: "",
});

const filters = reactive({
  text: "",
  status: "",
  priority: "",
  user: "",
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
    name: "user",
    label: "Empleado",
    field: "user",
    align: "left",
  },
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
  filters.user = "";

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
    if (filters.user) query.append("user", filters.user);

    const resp = await methodsHttp.getApi(
      `/support/admin/tickets${query.toString() ? `?${query.toString()}` : ""}`,
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
    const resp = await methodsHttp.getApi(`/support/admin/tickets/${row._id}`);

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

const openManageDialog = (row: any) => {
  manageTicket.value = row;
  manageForm.status = row.status || "OPEN";
  manageForm.responseMessage = row.responseMessage || "";
  showManageDialog.value = true;
};

const saveManageTicket = async () => {
  if (!manageTicket.value?._id) return;

  saving.value = true;

  try {
    const resp = await methodsHttp.putApi(
      `/support/admin/tickets/${manageTicket.value._id}`,
      {
        status: manageForm.status,
        responseMessage: manageForm.responseMessage?.trim(),
      },
    );

    if (!resp?.ok) {
      throw new Error(resp?.mensaje || "No se pudo actualizar el ticket");
    }

    $q.notify({
      type: "positive",
      message: "Ticket actualizado con éxito",
    });

    showManageDialog.value = false;
    await loadTickets();
  } catch (error: any) {
    $q.notify({
      type: "negative",
      message: error?.message || "No se pudo actualizar el ticket",
    });
  } finally {
    saving.value = false;
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
.admin-support-page {
  min-height: 100%;
}

.header-btn {
  height: 40px;
  border-radius: 12px;
  font-weight: 700;
}

.header-search {
  min-width: 280px;
}

.panel-card {
  border-radius: 22px;
}

.filter-btn {
  min-height: 40px;
  font-weight: 700;
}

.manage-dialog {
  width: 100%;
  max-width: 620px;
  border-radius: 22px;
  overflow: hidden;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
</style>