<template>
  <div>
    <PageHeaderCard
      title="Mis agentes IA"
      subtitle="Controla, ajusta y crea agentes de IA."
      icon="smart_toy"
    >
      <template #actions>
        <q-input
          v-model="searchText"
          outlined
          rounded
          dense
          debounce="300"
          label="Buscar agente"
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
          class="header-btn"
          unelevated
          no-caps
          label="Crear agente"
          icon="add"
          @click="openCreate"
        />
      </template>
    </PageHeaderCard>

    <AiAgentFormDialog
      v-model="openModal"
      :agent="selectedAgent"
      :saving="saving"
      @save="saveAgent"
    />

    <q-card flat bordered class="panel-card">
      <q-table
        :rows="filteredAgents"
        :columns="columns"
        row-key="_id"
        flat
        :loading="tableLoading"
        bordered
        class="agents-table"
        no-data-label="No hay agentes."
      >
        <template #body="props">
          <q-tr :props="props">
            <q-td key="actions" :props="props">
              <q-btn-dropdown
                dense
                unelevated
                no-caps
                rounded
                color="primary"
                dropdown-icon="expand_more"
                class="table-actions-btn"
              >
                <q-list class="actions-menu-list">
                  <q-item
                    clickable
                    v-close-popup
                    class="action-menu-item"
                    @click="editAgent(props.row)"
                  >
                    <q-item-section avatar>
                      <q-avatar size="32px" color="primary" text-color="white">
                        <q-icon
                          :name="props.row.isHardcoded ? 'content_copy' : 'edit'"
                          size="18px"
                        />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>
                        {{ props.row.isHardcoded ? "Usar plantilla" : "Editar" }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    class="action-menu-item"
                    :disable="Boolean(props.row.isHardcoded)"
                    @click="confirmDelete(props.row)"
                  >
                    <q-item-section avatar>
                      <q-avatar
                        size="32px"
                        :color="props.row.isHardcoded ? 'grey-5' : 'negative'"
                        text-color="white"
                      >
                        <q-icon name="delete" size="18px" />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>Eliminar</q-item-label>
                      <q-item-label
                        v-if="props.row.isHardcoded"
                        caption
                        class="text-grey-7"
                      >
                        Las plantillas no se eliminan.
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </q-td>

            <q-td key="name" :props="props">
              <div class="agent-cell">
                <q-avatar size="44px" color="primary" text-color="white">
                  <q-icon name="smart_toy" size="24px" />
                </q-avatar>

                <div class="agent-cell-info">
                  <div class="agent-name ellipsis">
                    {{ props.row.name }}
                  </div>

                  <div class="agent-code ellipsis">
                    {{ props.row.code }}
                  </div>

                  <div class="row q-gutter-xs q-mt-xs">
                    <q-badge
                      v-if="props.row.isHardcoded"
                      rounded
                      color="orange-7"
                    >
                      Plantilla
                    </q-badge>

                    <q-badge rounded outline color="primary">
                      {{ props.row.type }}
                    </q-badge>
                  </div>
                </div>
              </div>
            </q-td>

            <q-td key="provider" :props="props">
              <q-chip
                dense
                :color="getProviderColor(props.row.provider)"
                text-color="white"
                class="provider-chip"
              >
                <q-icon
                  :name="props.row.provider === 'dify' ? 'account_tree' : 'psychology'"
                  size="16px"
                  class="q-mr-xs"
                />
                {{ getProviderLabel(props.row.provider) }}
              </q-chip>
            </q-td>

            <q-td key="model" :props="props">
              <div class="text-weight-bold text-grey-9">
                {{ props.row.model || "No definido" }}
              </div>

              <div class="text-caption text-grey-7">
                v{{ props.row.version || 1 }}
              </div>
            </q-td>

            <q-td key="params" :props="props">
              <div class="params-wrap">
                <q-badge rounded color="blue-1" text-color="blue-10">
                  Temp: {{ props.row.temperature ?? 0.2 }}
                </q-badge>

                <q-badge rounded color="grey-2" text-color="grey-9">
                  Tokens: {{ props.row.maxTokens ?? 1024 }}
                </q-badge>
              </div>
            </q-td>

            <q-td key="isActive" :props="props">
              <q-badge
                :color="props.row.isActive ? 'positive' : 'grey-7'"
                rounded
                class="status-badge"
              >
                {{ props.row.isActive ? "Activo" : "Inactivo" }}
              </q-badge>
            </q-td>

            <q-td key="createdAt" :props="props">
              <div class="text-weight-bold text-grey-9">
                {{ formatDate(props.row.createdAt) }}
              </div>
            </q-td>
          </q-tr>
        </template>

        <template #no-data>
          <div class="full-width text-center q-pa-xl text-grey-7">
            <q-icon name="smart_toy" size="48px" color="grey-5" />

            <div class="text-subtitle1 text-weight-bold q-mt-sm">
              No hay agentes IA
            </div>

            <div class="text-caption">
              Crea tu primer agente para comenzar a automatizar procesos.
            </div>
          </div>
        </template>

        <template #loading>
          <q-inner-loading showing>
            <q-spinner size="42px" color="primary" />
          </q-inner-loading>
        </template>
      </q-table>
    </q-card>

    <!-- DELETE DIALOG -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card class="delete-dialog">
        <q-card-section class="delete-header">
          <q-avatar size="70px" color="negative" text-color="white">
            <q-icon name="delete" size="36px" />
          </q-avatar>

          <div class="delete-title">Eliminar agente</div>

          <div class="delete-subtitle">
            ¿Seguro que deseas eliminar
            <b>{{ deletingTarget?.name }}</b>?
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="delete-actions">
          <q-btn
            flat
            no-caps
            color="grey-8"
            label="Cancelar"
            class="rounded-action"
            :disable="deleting"
            @click="deleteDialog = false"
          />

          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Eliminar"
            icon="delete"
            class="rounded-action"
            :loading="deleting"
            @click="deleteAgent"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { Notify } from "quasar";
import methodsHttp from "src/api/methodsHttp";

import PageHeaderCard from "src/components/PageHeaderCard.vue";
import AiAgentFormDialog from "src/components/aiAgents/AiAgentFormDialog.vue";

const searchText = ref("");
const tableLoading = ref(false);
const saving = ref(false);
const agents = ref([]);

const openModal = ref(false);
const selectedAgent = ref(null);

const deleteDialog = ref(false);
const deleting = ref(false);
const deletingTarget = ref(null);

const columns = [
  {
    name: "actions",
    label: "Acciones",
    align: "center",
    field: "actions",
    style: "width: 110px",
  },
  {
    name: "name",
    label: "Agente",
    align: "left",
    field: "name",
    sortable: true,
  },
  {
    name: "provider",
    label: "Proveedor",
    align: "left",
    field: "provider",
  },
  {
    name: "model",
    label: "Modelo / Versión",
    align: "left",
    field: "model",
  },
  {
    name: "params",
    label: "Parámetros",
    align: "left",
    field: "params",
  },
  {
    name: "isActive",
    label: "Estado",
    align: "center",
    field: "isActive",
  },
  {
    name: "createdAt",
    label: "Creado",
    align: "left",
    field: "createdAt",
  },
];

const filteredAgents = computed(() => {
  const term = String(searchText.value || "").trim().toLowerCase();

  if (!term) return agents.value;

  return agents.value.filter((agent) => {
    const name = String(agent?.name || "").toLowerCase();
    const code = String(agent?.code || "").toLowerCase();
    const type = String(agent?.type || "").toLowerCase();
    const model = String(agent?.model || "").toLowerCase();
    const provider = String(agent?.provider || "").toLowerCase();
    const version = String(agent?.version || "").toLowerCase();

    return (
      name.includes(term) ||
      code.includes(term) ||
      type.includes(term) ||
      model.includes(term) ||
      provider.includes(term) ||
      version.includes(term)
    );
  });
});

function openCreate() {
  selectedAgent.value = null;
  openModal.value = true;
}

function editAgent(row) {
  selectedAgent.value = row;
  openModal.value = true;
}

async function loadAgents() {
  tableLoading.value = true;

  try {
    const resp = await methodsHttp.getApi("ai");

    if (!resp?.ok) {
      throw new Error(resp?.mensaje || "No se pudieron cargar los agentes");
    }

    agents.value = resp.agents || [];
  } catch (error) {
    console.error(error);

    Notify.create({
      type: "negative",
      message: error?.message || "Error cargando agentes",
    });

    agents.value = [];
  } finally {
    tableLoading.value = false;
  }
}

async function saveAgent(payload) {
  saving.value = true;

  try {
    const shouldUpdate = Boolean(
      selectedAgent.value?._id && !selectedAgent.value?.isHardcoded,
    );

    const resp = shouldUpdate
      ? await methodsHttp.putApi(
          `ai/${selectedAgent.value._id}`,
          payload,
        )
      : await methodsHttp.postApi("ai", payload);

    if (!resp?.ok) {
      throw new Error(resp?.mensaje || "No se pudo guardar el agente");
    }

    Notify.create({
      type: "positive",
      message: shouldUpdate ? "Agente actualizado." : "Agente creado.",
    });

    openModal.value = false;
    selectedAgent.value = null;
    await loadAgents();
  } catch (error) {
    console.error(error);

    Notify.create({
      type: "negative",
      message: error?.message || "Error guardando agente",
    });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(row) {
  if (row?.isHardcoded) return;

  deletingTarget.value = row;
  deleteDialog.value = true;
}

async function deleteAgent() {
  if (!deletingTarget.value?._id) return;

  deleting.value = true;

  try {
    const resp = await methodsHttp.deleteApi(
      `ai/${deletingTarget.value._id}`,
    );

    const data = resp?.data || resp;

    if (!data?.ok) {
      throw new Error(data?.mensaje || "No se pudo eliminar el agente");
    }

    Notify.create({
      type: "warning",
      message: "Agente eliminado.",
    });

    deleteDialog.value = false;
    deletingTarget.value = null;
    await loadAgents();
  } catch (error) {
    console.error(error);

    Notify.create({
      type: "negative",
      message: error?.message || "Error eliminando agente",
    });
  } finally {
    deleting.value = false;
  }
}

function getProviderLabel(provider) {
  const map = {
    openai: "OpenAI",
    dify: "Dify",
  };

  return map[provider] || provider || "OpenAI";
}

function getProviderColor(provider) {
  if (provider === "dify") return "deep-purple";
  return "primary";
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("es-DO", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

onMounted(loadAgents);
</script>

<style scoped>
.header-btn {
  height: 40px;
  border-radius: 999px;
  font-weight: 800;
}

.header-search {
  width: 320px;
  max-width: 100%;
}

.panel-card {
  border-radius: 22px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.04);
}

.agents-table {
  background: #ffffff;
}

.table-actions-btn {
  border-radius: 999px;
  font-weight: 800;
}

.actions-menu-list {
  min-width: 230px;
  padding: 8px;
}

.action-menu-item {
  border-radius: 14px;
  margin-bottom: 3px;
}

.action-menu-item:hover {
  background: rgba(25, 100, 162, 0.06);
}

.agent-cell {
  min-width: 260px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-cell-info {
  min-width: 0;
}

.agent-name {
  max-width: 260px;
  color: #0f172a;
  font-weight: 900;
  line-height: 1.1;
}

.agent-code {
  max-width: 260px;
  color: #64748b;
  font-size: 0.78rem;
  margin-top: 3px;
}

.provider-chip {
  font-weight: 800;
}

.params-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.status-badge {
  padding: 6px 10px;
  font-weight: 800;
}

.delete-dialog {
  width: 430px;
  max-width: 94vw;
  border-radius: 24px;
  overflow: hidden;
}

.delete-header {
  padding: 28px 24px 22px;
  text-align: center;
  background:
    radial-gradient(circle at top, rgba(193, 0, 21, 0.12), transparent 38%),
    linear-gradient(180deg, #ffffff 0%, #fff7f7 100%);
}

.delete-title {
  margin-top: 14px;
  color: #0f172a;
  font-size: 1.08rem;
  font-weight: 950;
}

.delete-subtitle {
  margin-top: 7px;
  color: #64748b;
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.45;
}

.delete-actions {
  padding: 16px 18px;
  background: #ffffff;
}

.rounded-action {
  border-radius: 999px;
  padding-left: 16px;
  padding-right: 16px;
  font-weight: 800;
}

@media (max-width: 600px) {
  .header-search {
    width: 100%;
  }

  .agent-cell {
    min-width: 220px;
  }
}
</style>