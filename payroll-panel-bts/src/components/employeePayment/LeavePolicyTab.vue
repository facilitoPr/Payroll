<template>
  <div>
    <q-card flat bordered class="leave-panel-card">
      <q-card-section>
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="section-title row items-center no-wrap">
              <q-avatar color="primary" text-color="white" size="42px">
                <q-icon name="rule" />
              </q-avatar>

              <div class="q-ml-sm">
                <div class="text-subtitle1 text-weight-bold">
                  Políticas de permisos y vacaciones
                </div>
                <div class="text-caption text-grey-7">
                  Configura días de vacaciones, antigüedad, antelación y reglas
                  generales de ausencias.
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-auto">
            <q-btn
              color="primary"
              unelevated
              rounded
              no-caps
              icon="add"
              label="Nueva política"
              class="action-btn full-width"
              @click="openCreateDialog"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="filters.text"
              outlined
              dense
              rounded
              debounce="400"
              color="primary"
              label="Buscar política"
              placeholder="Nombre o código"
              @update:model-value="search"
            >
              <template #prepend>
                <q-icon name="search" color="primary" />
              </template>

              <template #append>
                <q-btn
                  v-if="filters.text"
                  flat
                  round
                  dense
                  icon="close"
                  @click="clearTextFilter"
                />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="filters.company"
              outlined
              dense
              rounded
              clearable
              color="primary"
              label="Compañía"
              :options="companies"
              :option-label="companyOptionLabel"
              option-value="_id"
              emit-value
              map-options
              @update:model-value="search"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="filters.isActive"
              outlined
              dense
              rounded
              clearable
              color="primary"
              label="Estado"
              :options="statusOptions"
              emit-value
              map-options
              @update:model-value="search"
            />
          </div>
        </div>
      </q-card-section>

      <q-table
        flat
        bordered
        row-key="_id"
        class="leave-table"
        :loading="tableLoading"
        :rows="rows"
        :columns="columns"
        :rows-per-page-options="[limit]"
        hide-pagination
      >
        <template #body-cell-company="props">
          <q-td :props="props">
            <div class="text-weight-bold">
              {{ getCompanyName(props.row.company) }}
            </div>
            <div class="text-caption text-grey-7">
              {{
                props.row.company ? "Política por compañía" : "Política global"
              }}
            </div>
          </q-td>
        </template>

        <template #body-cell-policy="props">
          <q-td :props="props">
            <div class="text-weight-bold">
              {{ props.row.name }}
            </div>
            <div class="text-caption text-grey-7">
              Código: {{ props.row.code }}
            </div>
          </q-td>
        </template>

        <template #body-cell-vacationDays="props">
          <q-td :props="props">
            <div class="row q-gutter-xs">
              <q-chip
                dense
                color="green-1"
                text-color="positive"
                icon="beach_access"
                class="text-weight-bold"
              >
                Base: {{ getNumber(props.row.defaultVacationDays) }} días
              </q-chip>

              <q-chip
                dense
                color="orange-1"
                text-color="orange-10"
                icon="workspace_premium"
                class="text-weight-bold"
              >
                {{ getNumber(props.row.seniorityVacationDays) }} días /
                {{ getNumber(props.row.seniorityYears) }} años
              </q-chip>
            </div>
          </q-td>
        </template>

        <template #body-cell-advanceDays="props">
          <q-td :props="props">
            <div class="row q-gutter-xs">
              <q-chip
                dense
                color="blue-1"
                text-color="primary"
                icon="assignment"
                class="text-weight-bold"
              >
                Permisos:
                {{ getNumber(props.row.permissionAdvanceDays) }} día(s)
              </q-chip>

              <q-chip
                dense
                color="green-1"
                text-color="positive"
                icon="beach_access"
                class="text-weight-bold"
              >
                Vacaciones:
                {{ getNumber(props.row.vacationAdvanceDays) }} día(s)
              </q-chip>
            </div>
          </q-td>
        </template>

        <template #body-cell-rules="props">
          <q-td :props="props">
            <div class="row q-gutter-xs">
              <q-badge
                rounded
                :color="props.row.allowEmployeeOverride ? 'positive' : 'grey-5'"
                :label="
                  props.row.allowEmployeeOverride
                    ? 'Override permitido'
                    : 'Sin override'
                "
              />

              <q-badge
                rounded
                :color="props.row.allowNegativeBalance ? 'warning' : 'positive'"
                text-color="white"
                :label="
                  props.row.allowNegativeBalance
                    ? 'Balance negativo permitido'
                    : 'Sin balance negativo'
                "
              />
            </div>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge
              rounded
              :color="props.row.isActive ? 'positive' : 'negative'"
              :label="props.row.isActive ? 'Activa' : 'Inactiva'"
              class="status-badge"
            />
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn-dropdown
              dense
              unelevated
              rounded
              no-caps
              color="primary"
              dropdown-icon="expand_more"
              class="table-action-btn"
            >
              <q-list class="actions-menu-list">
                <q-item
                  clickable
                  v-close-popup
                  @click="openEditDialog(props.row)"
                >
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white" size="32px">
                      <q-icon name="edit" size="18px" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>Editar</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="toggleState(props.row)">
                  <q-item-section avatar>
                    <q-avatar
                      :color="props.row.isActive ? 'negative' : 'positive'"
                      text-color="white"
                      size="32px"
                    >
                      <q-icon
                        :name="props.row.isActive ? 'block' : 'check_circle'"
                        size="18px"
                      />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ props.row.isActive ? "Desactivar" : "Activar" }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator spaced />

                <q-item clickable v-close-popup @click="deletePolicy(props.row)">
                  <q-item-section avatar>
                    <q-avatar color="negative" text-color="white" size="32px">
                      <q-icon name="delete" size="18px" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>Eliminar</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </q-td>
        </template>

        <template #no-data>
          <div class="full-width text-center q-pa-xl text-grey-7">
            <q-icon name="rule" size="44px" color="grey-5" />
            <div class="text-subtitle1 text-weight-bold q-mt-sm">
              No hay políticas configuradas
            </div>
            <div class="text-caption">
              Crea una política para controlar permisos, vacaciones y reglas de
              antelación.
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
          :initialPagination="initialPagination"
        />
      </div>
    </q-card>

    <LeavePolicyFormDialog
      v-model="dialog.open"
      v-model:form="form"
      :companies="companies"
      :saving="saving"
      :is-edit="dialog.isEdit"
      @save="savePolicy"
    />

    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import TablePagination from "src/components/table/TablePagination.vue";
import LeavePolicyFormDialog from "./dialog/LeavePolicyFormDialog.vue";

const emit = defineEmits(["loading"]);

const notify = ref(null);

const rows = ref([]);
const companies = ref([]);

const tableLoading = ref(false);
const saving = ref(false);

const limit = ref(10);
const initial = ref(0);
const orderQuantity = ref(1);
const initialPagination = ref(1);

const filters = ref({
  text: "",
  company: null,
  isActive: null,
});

const statusOptions = [
  { label: "Activas", value: "true" },
  { label: "Inactivas", value: "false" },
];

const dialog = ref({
  open: false,
  isEdit: false,
  id: null,
});

const getDefaultForm = () => ({
  company: null,
  name: "",
  code: "DEFAULT_RD",
  defaultVacationDays: 14,
  seniorityVacationDays: 18,
  seniorityYears: 5,
  permissionAdvanceDays: 1,
  vacationAdvanceDays: 7,
  allowEmployeeOverride: true,
  allowNegativeBalance: false,
  isActive: true,
});

const form = ref(getDefaultForm());

const columns = [
  {
    name: "actions",
    label: "Acciones",
    field: "actions",
    align: "center",
    style: "width: 120px",
  },
  {
    name: "policy",
    label: "Política",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "company",
    label: "Compañía",
    field: "company",
    align: "left",
  },
  {
    name: "vacationDays",
    label: "Vacaciones",
    field: "defaultVacationDays",
    align: "left",
  },
  {
    name: "advanceDays",
    label: "Antelación",
    field: "permissionAdvanceDays",
    align: "left",
  },
  {
    name: "rules",
    label: "Reglas",
    field: "allowEmployeeOverride",
    align: "left",
  },
  {
    name: "status",
    label: "Estado",
    field: "isActive",
    align: "center",
    style: "width: 120px",
  },
];

watch(initialPagination, async (value) => {
  initial.value = value === 1 ? 0 : value * limit.value - limit.value;
  await getLeavePolicies();
});

onMounted(async () => {
  await Promise.all([getCompanies(), getLeavePolicies()]);
});

const companyOptionLabel = (company) => {
  return (
    company?.legalName ||
    company?.commercialName ||
    company?.name ||
    company?.code ||
    "Sin nombre"
  );
};

const getCompanyName = (company) => {
  if (!company) return "Global";

  return (
    company?.legalName ||
    company?.commercialName ||
    company?.name ||
    company?.code ||
    "Compañía"
  );
};

const getNumber = (value, fallback = 0) => {
  const n = Number(value);

  if (!Number.isFinite(n)) return fallback;

  return n;
};

const normalizeArrayResponse = (resp, keys = []) => {
  for (const key of keys) {
    if (Array.isArray(resp?.[key])) return resp[key];
  }

  return [];
};

const getCompanies = async () => {
  const resp = await methodsHttp.getApi("company?limit=500&isActive=true");

  companies.value = resp?.ok
    ? normalizeArrayResponse(resp, ["companies", "company", "data", "items"])
    : [];
};

const getLeavePolicies = async () => {
  tableLoading.value = true;
  emit("loading", true);

  try {
    const q = new URLSearchParams();

    q.set("limit", String(limit.value));
    q.set("initial", String(initial.value));

    if (filters.value.text?.trim()) {
      q.set("text", filters.value.text.trim());
    }

    if (filters.value.company) {
      q.set("company", filters.value.company);
    }

    if (filters.value.isActive !== null && filters.value.isActive !== "") {
      q.set("isActive", filters.value.isActive);
    }

    const resp = await methodsHttp.getApi(`leave-policy?${q.toString()}`);

    if (resp?.ok) {
      rows.value =
        resp.leavePolicies ||
        resp.policies ||
        resp.data ||
        resp.items ||
        [];

      orderQuantity.value =
        Math.ceil(
          Number(resp.count || resp.total || resp.meta?.total || 0) /
            limit.value,
        ) || 1;
    } else {
      rows.value = [];
      notify.value?.showNotifyBad(
        resp?.mensaje || "No se pudieron cargar las políticas",
      );
    }
  } catch (error) {
    console.error("getLeavePolicies error:", error);
    notify.value?.showNotifyBad("Error cargando las políticas");
  } finally {
    tableLoading.value = false;
    emit("loading", false);
  }
};

const reload = async () => {
  await getLeavePolicies();
};

const search = async () => {
  initialPagination.value = 1;
  initial.value = 0;
  await getLeavePolicies();
};

const clearTextFilter = async () => {
  filters.value.text = "";
  await search();
};

const clearForm = () => {
  form.value = getDefaultForm();
};

const openCreateDialog = () => {
  clearForm();

  dialog.value = {
    open: true,
    isEdit: false,
    id: null,
  };
};

const openEditDialog = (row) => {
  form.value = {
    company: row.company?._id || row.company || null,
    name: row.name || "",
    code: row.code || "",
    defaultVacationDays: Number(
      row.defaultVacationDays ?? row.defaultDays ?? 14,
    ),
    seniorityVacationDays: Number(
      row.seniorityVacationDays ?? row.seniorityDays ?? 18,
    ),
    seniorityYears: Number(row.seniorityYears ?? 5),
    permissionAdvanceDays: Number(row.permissionAdvanceDays ?? 1),
    vacationAdvanceDays: Number(row.vacationAdvanceDays ?? 7),
    allowEmployeeOverride: row.allowEmployeeOverride !== false,
    allowNegativeBalance: row.allowNegativeBalance === true,
    isActive: row.isActive !== false,
  };

  dialog.value = {
    open: true,
    isEdit: true,
    id: row._id,
  };
};

const closeDialog = () => {
  dialog.value.open = false;
  dialog.value.isEdit = false;
  dialog.value.id = null;
};

const buildPayload = () => {
  return {
    company: form.value.company || null,
    name: String(form.value.name || "").trim(),
    code: String(form.value.code || "").trim().toUpperCase(),
    defaultVacationDays: Number(form.value.defaultVacationDays || 0),
    seniorityVacationDays: Number(form.value.seniorityVacationDays || 0),
    seniorityYears: Number(form.value.seniorityYears || 0),
    permissionAdvanceDays: Number(form.value.permissionAdvanceDays || 0),
    vacationAdvanceDays: Number(form.value.vacationAdvanceDays || 0),
    allowEmployeeOverride: form.value.allowEmployeeOverride === true,
    allowNegativeBalance: form.value.allowNegativeBalance === true,
    isActive: form.value.isActive === true,
  };
};

const savePolicy = async () => {
  saving.value = true;
  emit("loading", true);

  try {
    const payload = buildPayload();

    const resp = dialog.value.isEdit
      ? await methodsHttp.putApi(`leave-policy/${dialog.value.id}`, payload)
      : await methodsHttp.postApi("leave-policy", payload);

    if (resp?.ok) {
      notify.value?.showNotifyGood(resp.mensaje || "Política guardada");
      closeDialog();
      await getLeavePolicies();
      return;
    }

    notify.value?.showNotifyBad(resp?.mensaje || "No se pudo guardar");
  } catch (error) {
    console.error("savePolicy error:", error);
    notify.value?.showNotifyBad("Error guardando la política");
  } finally {
    saving.value = false;
    emit("loading", false);
  }
};

const toggleState = async (row) => {
  saving.value = true;
  emit("loading", true);

  try {
    const resp = await methodsHttp.putApi(`leave-policy/${row._id}`, {
      isActive: !row.isActive,
    });

    if (resp?.ok) {
      notify.value?.showNotifyGood(resp.mensaje || "Estado actualizado");
      await getLeavePolicies();
      return;
    }

    notify.value?.showNotifyBad(resp?.mensaje || "No se pudo actualizar");
  } catch (error) {
    console.error("toggleState error:", error);
    notify.value?.showNotifyBad("Error actualizando el estado");
  } finally {
    saving.value = false;
    emit("loading", false);
  }
};

const deletePolicy = async (row) => {
  saving.value = true;
  emit("loading", true);

  try {
    const resp = await methodsHttp.deleteApi(`leave-policy/${row._id}`);

    if (resp?.ok) {
      notify.value?.showNotifyGood(resp.mensaje || "Política eliminada");
      await getLeavePolicies();
      return;
    }

    notify.value?.showNotifyBad(resp?.mensaje || "No se pudo eliminar");
  } catch (error) {
    console.error("deletePolicy error:", error);
    notify.value?.showNotifyBad("Error eliminando la política");
  } finally {
    saving.value = false;
    emit("loading", false);
  }
};

defineExpose({
  reload,
});
</script>

<style scoped>
.leave-panel-card {
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.04);
}

.section-title {
  min-height: 42px;
}

.action-btn {
  min-height: 40px;
  font-weight: 800;
}

.leave-table {
  background: white;
}

.status-badge {
  padding: 6px 10px;
  font-weight: 800;
}

.table-action-btn {
  border-radius: 999px;
  font-weight: 800;
}

.actions-menu-list {
  min-width: 220px;
  padding: 8px;
}

.actions-menu-list .q-item {
  border-radius: 14px;
}

.actions-menu-list .q-item:hover {
  background: rgba(25, 100, 162, 0.06);
}

.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}
</style>