<template>
  <div>
    <q-card flat bordered class="loan-policy-panel-card">
      <q-card-section>
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="section-title row items-center no-wrap">
              <q-avatar color="primary" text-color="white" size="42px">
                <q-icon name="account_balance_wallet" />
              </q-avatar>

              <div class="q-ml-sm">
                <div class="text-subtitle1 text-weight-bold">
                  Préstamos para empleados
                </div>
                <div class="text-caption text-grey-7">
                  Activa o desactiva si los empleados de una compañía pueden solicitar préstamos.
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-auto">
            <q-chip
              dense
              color="blue-1"
              text-color="primary"
              icon="verified"
              class="info-chip"
            >
              Las reglas vienen del producto principal
            </q-chip>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-banner rounded class="info-banner">
          <template #avatar>
            <q-avatar color="primary" text-color="white" size="36px">
              <q-icon name="info" />
            </q-avatar>
          </template>

          <div class="text-weight-bold">
            Esta pantalla solo controla disponibilidad por compañía.
          </div>
          <div class="text-caption text-grey-7">
            Los montos, cuotas, intereses, reglas de sueldo, vacaciones y garantía se validan desde
            la configuración principal del producto de préstamo.
          </div>
        </q-banner>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="filters.text"
              outlined
              dense
              rounded
              debounce="400"
              color="primary"
              label="Buscar compañía"
              placeholder="Nombre, código o identificación"
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

          <div class="col-12 col-md-3">
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

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.allowEmployeeLoanRequests"
              outlined
              dense
              rounded
              clearable
              color="primary"
              label="Estado"
              :options="loanRequestStatusOptions"
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
        class="loan-policy-table"
        :loading="tableLoading"
        :rows="rows"
        :columns="columns"
        :rows-per-page-options="[limit]"
        hide-pagination
      >
        <template #body-cell-company="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar color="blue-1" text-color="primary" size="38px">
                <q-icon name="business" />
              </q-avatar>

              <div class="q-ml-sm">
                <div class="text-weight-bold">
                  {{ getCompanyName(props.row.company) }}
                </div>

                <div class="text-caption text-grey-7">
                  {{ getCompanyCode(props.row.company) }}
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-policy="props">
          <q-td :props="props">
            <div class="text-weight-bold">
              {{ props.row.name || "Política de préstamos" }}
            </div>

            <div class="text-caption text-grey-7">
              {{ props.row.code || "EMPLOYEE_LOAN_POLICY" }}
            </div>
          </q-td>
        </template>

        <template #body-cell-access="props">
          <q-td :props="props">
            <q-badge
              rounded
              class="status-badge"
              :color="props.row.allowEmployeeLoanRequests ? 'positive' : 'negative'"
              :label="
                props.row.allowEmployeeLoanRequests
                  ? 'Solicitudes permitidas'
                  : 'Solicitudes desactivadas'
              "
            />

            <div class="text-caption text-grey-7 q-mt-xs">
              {{
                props.row.allowEmployeeLoanRequests
                  ? "Los empleados pueden iniciar solicitudes."
                  : "Los empleados no pueden solicitar préstamos."
              }}
            </div>
          </q-td>
        </template>

        <template #body-cell-rules="props">
          <q-td :props="props">
            <q-chip
              dense
              color="purple-1"
              text-color="purple-8"
              icon="settings"
            >
              Producto principal
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-updatedAt="props">
          <q-td :props="props">
            <div class="text-weight-medium">
              {{ formatDate(props.row.updatedAt || props.row.createdAt) }}
            </div>

            <div class="text-caption text-grey-7">
              Última actualización
            </div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              unelevated
              rounded
              no-caps
              class="toggle-btn"
              :color="props.row.allowEmployeeLoanRequests ? 'negative' : 'positive'"
              :icon="
                props.row.allowEmployeeLoanRequests
                  ? 'block'
                  : 'check_circle'
              "
              :label="
                props.row.allowEmployeeLoanRequests
                  ? 'Desactivar'
                  : 'Activar'
              "
              :loading="savingRowId === props.row._id"
              :disable="saving"
              @click="toggleLoanRequests(props.row)"
            />
          </q-td>
        </template>

        <template #no-data>
          <div class="full-width text-center q-pa-xl text-grey-7">
            <q-icon name="account_balance_wallet" size="44px" color="grey-5" />

            <div class="text-subtitle1 text-weight-bold q-mt-sm">
              No hay políticas creadas
            </div>

            <div class="text-caption">
              Ejecuta el seed para crear una política por compañía.
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

    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";

import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import TablePagination from "src/components/table/TablePagination.vue";

const emit = defineEmits(["loading"]);

const notify = ref(null);

const rows = ref([]);
const companies = ref([]);

const tableLoading = ref(false);
const saving = ref(false);
const savingRowId = ref(null);

const limit = ref(10);
const initial = ref(0);
const orderQuantity = ref(1);
const initialPagination = ref(1);

const filters = ref({
  text: "",
  company: null,
  allowEmployeeLoanRequests: null,
});

const loanRequestStatusOptions = [
  {
    label: "Solicitudes permitidas",
    value: "true",
  },
  {
    label: "Solicitudes desactivadas",
    value: "false",
  },
];

const columns = [
  {
    name: "company",
    label: "Compañía",
    field: "company",
    align: "left",
    sortable: true,
  },
  {
    name: "policy",
    label: "Política",
    field: "name",
    align: "left",
  },
  {
    name: "access",
    label: "Solicitudes de préstamos",
    field: "allowEmployeeLoanRequests",
    align: "left",
  },
  {
    name: "rules",
    label: "Reglas",
    field: "rules",
    align: "left",
  },
  {
    name: "updatedAt",
    label: "Actualizado",
    field: "updatedAt",
    align: "left",
  },
  {
    name: "actions",
    label: "Acción",
    field: "actions",
    align: "center",
    style: "width: 170px",
  },
];

watch(initialPagination, async (value) => {
  initial.value = value === 1 ? 0 : value * limit.value - limit.value;
  await getPolicies();
});

onMounted(async () => {
  await Promise.all([getCompanies(), getPolicies()]);
});

const normalizeArrayResponse = (resp, keys = []) => {
  for (const key of keys) {
    if (Array.isArray(resp?.[key])) return resp[key];
  }

  return [];
};

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
  if (!company) return "Compañía no asignada";

  return (
    company?.legalName ||
    company?.commercialName ||
    company?.name ||
    company?.code ||
    "Compañía"
  );
};

const getCompanyCode = (company) => {
  if (!company) return "Sin código";

  return company?.code || company?.rnc || company?.taxId || "Sin código";
};

const getCompanies = async () => {
  try {
    const resp = await methodsHttp.getApi("company?limit=500&isActive=true");

    companies.value = resp?.ok
      ? normalizeArrayResponse(resp, ["companies", "company", "data", "items"])
      : [];
  } catch (error) {
    console.error("getCompanies error:", error);
    companies.value = [];
  }
};

const getPolicies = async () => {
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

    if (
      filters.value.allowEmployeeLoanRequests !== null &&
      filters.value.allowEmployeeLoanRequests !== ""
    ) {
      q.set(
        "allowEmployeeLoanRequests",
        filters.value.allowEmployeeLoanRequests,
      );
    }

    const resp = await methodsHttp.getApi(
      `employee-loan/policies?${q.toString()}`,
    );

    if (resp?.ok) {
      rows.value =
        resp.employeeLoanPolicies ||
        resp.policies ||
        resp.data ||
        resp.items ||
        [];

      const total = Number(resp.count || resp.total || resp.meta?.total || 0);

      orderQuantity.value = Math.ceil(total / limit.value) || 1;
      return;
    }

    rows.value = [];
    notify.value?.showNotifyBad(
      resp?.mensaje || "No se pudieron cargar las políticas",
    );
  } catch (error) {
    console.error("getPolicies error:", error);
    rows.value = [];
    notify.value?.showNotifyBad("Error cargando las políticas");
  } finally {
    tableLoading.value = false;
    emit("loading", false);
  }
};

const reload = async () => {
  await getPolicies();
};

const search = async () => {
  initialPagination.value = 1;
  initial.value = 0;
  await getPolicies();
};

const clearTextFilter = async () => {
  filters.value.text = "";
  await search();
};

const toggleLoanRequests = async (row) => {
  saving.value = true;
  savingRowId.value = row._id;
  emit("loading", true);

  try {
    const nextValue = row.allowEmployeeLoanRequests !== true;

    const resp = await methodsHttp.putApi(
      `employee-loan/policies/${row._id}`,
      {
        allowEmployeeLoanRequests: nextValue,
      },
    );

    if (resp?.ok) {
      notify.value?.showNotifyGood(
        resp.mensaje ||
          (nextValue
            ? "Solicitudes de préstamos activadas"
            : "Solicitudes de préstamos desactivadas"),
      );

      await getPolicies();
      return;
    }

    notify.value?.showNotifyBad(
      resp?.mensaje || "No se pudo actualizar la política",
    );
  } catch (error) {
    console.error("toggleLoanRequests error:", error);
    notify.value?.showNotifyBad("Error actualizando la política");
  } finally {
    saving.value = false;
    savingRowId.value = null;
    emit("loading", false);
  }
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

defineExpose({
  reload,
});
</script>

<style scoped>
.loan-policy-panel-card {
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.04);
}

.section-title {
  min-height: 42px;
}

.info-chip {
  min-height: 34px;
  font-weight: 800;
}

.info-banner {
  background: #eff6ff;
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.loan-policy-table {
  background: white;
}

.status-badge {
  padding: 6px 10px;
  font-weight: 800;
}

.toggle-btn {
  min-width: 130px;
  font-weight: 800;
}

.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

:deep(.q-table th) {
  font-weight: 900;
  color: #334155;
  background: #f8fafc;
}

:deep(.q-table tbody td) {
  vertical-align: middle;
}
</style>