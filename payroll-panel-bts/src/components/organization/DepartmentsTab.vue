<template>
  <div class="departments-tab">
    <q-card flat bordered class="section-card q-mb-md">
      <div class="department-header">
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="row items-center q-gutter-sm">
              <q-avatar color="primary" text-color="white" icon="apartment" />

              <div>
                <div class="text-subtitle1 text-weight-bold">
                  Departamentos
                </div>
                <div class="text-caption text-grey-7">
                  Administra departamentos por compañía, estado y búsqueda.
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-auto">
            <div class="row q-gutter-sm justify-end">

              <q-btn
                unelevated
                rounded
                color="primary"
                icon="add"
                label="Agregar departamento"
                class="action-btn"
                @click="openModalAdd"
              />
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="companyFilter"
              :options="companyOptions"
              option-label="label"
              option-value="_id"
              emit-value
              map-options
              outlined
              dense
              clearable
              color="primary"
              label="Compañía"
              class="rounded-input"
              @update:model-value="handleFiltersChange"
            >
              <template #prepend>
                <q-icon name="business" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              emit-value
              map-options
              outlined
              dense
              color="primary"
              label="Estado"
              class="rounded-input"
              @update:model-value="handleFiltersChange"
            >
              <template #prepend>
                <q-icon name="filter_alt" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md">
            <q-input
              v-model="search"
              outlined
              dense
              clearable
              debounce="500"
              color="primary"
              placeholder="Buscar por nombre, código o descripción..."
              class="rounded-input"
              @update:model-value="handleFiltersChange"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>

        <div class="row items-center justify-between q-mt-md">
          <div class="text-caption text-grey-7">

          </div>

          <q-chip
            dense
            color="primary"
            text-color="white"
            class="summary-chip"
          >
            Total: {{ pagination.rowsNumber }}
          </q-chip>
        </div>
      </div>
    </q-card>

    <q-card flat bordered class="table-card">
      <q-table
        v-model:pagination="pagination"
        :rows="rows"
        :columns="columns"
        row-key="_id"
        flat
        binary-state-sort
        :loading="loadingTable"
        :rows-per-page-options="[10, 20, 50, 100]"
        no-data-label="No hay departamentos registrados"
        no-results-label="No se encontraron departamentos"
        class="modern-table"
        @request="onRequest"
      >
        <template #body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <div class="row justify-center q-gutter-xs no-wrap">
              <q-btn
                flat
                round
                dense
                icon="visibility"
                color="primary"
                class="table-action-btn"
                @click="openDepartmentDetail(props.row)"
              >
                <q-tooltip>Detalle</q-tooltip>
              </q-btn>

              <q-btn
                flat
                round
                dense
                icon="edit"
                color="primary"
                class="table-action-btn"
                @click="openModalEditDepartment(props.row)"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>

              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                class="table-action-btn"
                @click="openModalDeleteDepartment(props.row)"
              >
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <template #body-cell-name="props">
          <q-td :props="props">
            <div class="row items-center no-wrap q-gutter-sm">
              <q-avatar
                size="34px"
                color="primary"
                text-color="white"
                icon="apartment"
              />

              <div>
                <div class="text-weight-medium">
                  {{ props.row.name }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ props.row.code || "Sin código" }}
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-company="props">
          <q-td :props="props">
            <q-chip
              dense
              outline
              color="primary"
              text-color="primary"
              icon="business"
              class="company-chip"
            >
              {{ getCompanyLabel(props.row.company) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-description="props">
          <q-td :props="props">
            <div class="description-cell">
              {{ props.row.description || "Sin descripción" }}
            </div>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props" class="text-center">
            <q-badge
              rounded
              :color="props.row.isActive ? 'secondary' : 'negative'"
              :label="props.row.isActive ? 'ACTIVO' : 'INACTIVO'"
              class="status-badge"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <DepartmentFormDialog
      v-model="openModal"
      :is-edit-mode="isEditMode"
      :form-data="form"
      :companies="companyOptions"
      :loading="saving"
      @save="saveDepartment"
    />

    <DepartmentDetailDialog
      v-model="openDetail"
      v-model:selected-managers="selectedManagers"
      :department="detailDepartment"
      :employees="employeesOfDepartment"
      :positions="positionsOfDepartment"
      :loading-employees="loadingEmployees"
      :loading-positions="loadingPositions"
      :saving-managers="savingManagers"
      @save-managers="saveManagers"
    />

    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo" @deleteGood="getDepartmentAdmin" />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Delete from "src/components/utils/Delete.vue";
import DepartmentFormDialog from "./dialogs/department/DepartmentFormDialog.vue";
import DepartmentDetailDialog from "./dialogs/department/DepartmentDetailDialog.vue";

const emit = defineEmits(["loading"]);

const deleteInfo = ref(null);
const notify = ref(null);

const openModal = ref(false);
const openDetail = ref(false);

const isEditMode = ref(false);
const id = ref("");

const rows = ref([]);
const companyOptions = ref([]);

const search = ref("");
const companyFilter = ref(null);
const statusFilter = ref("all");

const loadingTable = ref(false);
const loadingEmployees = ref(false);
const loadingPositions = ref(false);
const saving = ref(false);
const savingManagers = ref(false);

const employeesOfDepartment = ref([]);
const positionsOfDepartment = ref([]);

const detailDepartment = ref(null);
const selectedManagers = ref([]);

const pagination = ref({
  sortBy: "name",
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const form = ref({
  company: "",
  name: "",
  code: "",
  isActive: true,
  description: "",
});

const statusOptions = [
  { label: "Todos", value: "all" },
  { label: "Activos", value: "true" },
  { label: "Inactivos", value: "false" },
];

const columns = [
  {
    name: "actions",
    label: "Acciones",
    align: "center",
    field: "actions",
  },
  {
    name: "name",
    label: "Departamento",
    align: "left",
    field: "name",
    sortable: true,
  },
  {
    name: "company",
    label: "Compañía",
    align: "left",
    field: "company",
  },
  {
    name: "description",
    label: "Descripción",
    align: "left",
    field: "description",
  },
  {
    name: "status",
    label: "Estado",
    align: "center",
    field: "isActive",
    sortable: true,
  },
];

const normalizeList = (resp, keys = []) => {
  for (const key of keys) {
    if (Array.isArray(resp?.[key])) return resp[key];
  }

  if (Array.isArray(resp?.data)) return resp.data;
  return [];
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id || "";
};

const buildCompanyLabel = (company) => {
  if (!company) return "Sin compañía";

  const tradeName = company.tradeName || "";
  const legalName = company.legalName || "";
  const name = company.name || "";
  const code = company.code || "";

  const mainName = tradeName || legalName || name || "Compañía";

  return code ? `${mainName} (${code})` : mainName;
};

const getCompanyLabel = (companyValue) => {
  if (!companyValue) return "Sin compañía";

  if (typeof companyValue === "object") {
    return buildCompanyLabel(companyValue);
  }

  const found = companyOptions.value.find(
    (company) => getId(company) === companyValue
  );

  return found?.label || "Sin compañía";
};

const buildQueryParams = () => {
  const params = new URLSearchParams();

  params.set("page", String(pagination.value.page || 1));
  params.set("limit", String(pagination.value.rowsPerPage || 10));
  params.set("sortBy", pagination.value.sortBy || "name");
  params.set("descending", pagination.value.descending ? "true" : "false");

  if (companyFilter.value) {
    params.set("company", companyFilter.value);
  }

  if (statusFilter.value !== "all") {
    params.set("isActive", statusFilter.value);
  }

  if (search.value?.trim()) {
    params.set("search", search.value.trim());
  }

  return params.toString();
};

onMounted(async () => {
  await getCompanies();
  await getDepartmentAdmin();
});

const getCompanies = async () => {
  let resp = await methodsHttp.getApi("company");

  if (!resp?.ok) {
    resp = await methodsHttp.getApi("company");
  }

  if (!resp?.ok) {
    companyOptions.value = [];
    return;
  }

  const companies = normalizeList(resp, ["companies", "company", "data"]);

  companyOptions.value = companies.map((company) => ({
    ...company,
    label: buildCompanyLabel(company),
  }));
};

const getDepartmentAdmin = async () => {
  loadingTable.value = true;
  emit("loading", true);

  try {
    const query = buildQueryParams();

    const resp = await methodsHttp.getApi(
      `department/admin?${query}`
    );

    if (resp?.ok) {
      rows.value = normalizeList(resp, ["departments", "department", "data"]);

      const serverPagination = resp.pagination || {};

      pagination.value = {
        ...pagination.value,
        page: serverPagination.page || pagination.value.page,
        rowsPerPage: serverPagination.limit || pagination.value.rowsPerPage,
        rowsNumber:
          serverPagination.rowsNumber ||
          serverPagination.total ||
          rows.value.length,
      };
    } else {
      rows.value = [];
      pagination.value.rowsNumber = 0;

      notify.value?.showNotifyBad(
        resp?.mensaje || "No se pudieron cargar los departamentos"
      );
    }
  } finally {
    loadingTable.value = false;
    emit("loading", false);
  }
};

const onRequest = async (props) => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination;

  pagination.value = {
    ...pagination.value,
    page,
    rowsPerPage,
    sortBy: sortBy || "name",
    descending: !!descending,
  };

  await getDepartmentAdmin();
};

const handleFiltersChange = async () => {
  pagination.value.page = 1;
  await getDepartmentAdmin();
};

const loadEmployeesOfDepartment = async (departmentId) => {
  loadingEmployees.value = true;

  try {
    const resp = await methodsHttp.getApi(
      `user/getEmployeesByDepartment/${departmentId}`
    );

    if (resp?.ok) {
      employeesOfDepartment.value = normalizeList(resp, [
        "employees",
        "users",
        "data",
      ]);
    } else {
      employeesOfDepartment.value = [];
      notify.value?.showNotifyBad(
        resp?.mensaje || "No se pudieron cargar empleados"
      );
    }
  } finally {
    loadingEmployees.value = false;
  }
};

const loadPositionsOfDepartment = async (departmentId) => {
  loadingPositions.value = true;

  try {
    const resp = await methodsHttp.getApi(
      `jobPosition/getJobPositionsByDepartment/${departmentId}`
    );

    if (resp?.ok) {
      positionsOfDepartment.value = normalizeList(resp, [
        "positions",
        "jobPositions",
        "data",
      ]);
    } else {
      positionsOfDepartment.value = [];
    }
  } finally {
    loadingPositions.value = false;
  }
};

const saveDepartment = async (payload) => {
  if (!payload.company) {
    notify.value?.showNotifyBad("Debes seleccionar una compañía.");
    return;
  }

  saving.value = true;

  try {
    if (!isEditMode.value) {
      const resp = await methodsHttp.postApi(
        "department",
        payload
      );

      if (resp?.ok) {
        openModal.value = false;
        notify.value?.showNotifyGood(resp.mensaje || "Departamento creado");
        await getDepartmentAdmin();
      } else {
        notify.value?.showNotifyBad(
          resp?.mensaje || "Error creando departamento"
        );
      }

      return;
    }

    const resp = await methodsHttp.putApi(
      `department/${id.value}`,
      payload
    );

    if (!resp?.ok) {
      notify.value?.showNotifyBad(
        resp?.mensaje || "Error actualizando departamento"
      );
      return;
    }

    openModal.value = false;
    notify.value?.showNotifyGood(
      resp.mensaje || "Departamento actualizado con éxito"
    );

    await getDepartmentAdmin();
  } finally {
    saving.value = false;
  }
};

const openModalAdd = () => {
  isEditMode.value = false;
  id.value = "";

  form.value = {
    company: companyFilter.value || "",
    name: "",
    code: "",
    isActive: true,
    description: "",
  };

  openModal.value = true;
};

const openModalEditDepartment = (item) => {
  id.value = item._id;
  isEditMode.value = true;

  form.value = {
    company: getId(item.company),
    name: item.name || "",
    code: item.code || "",
    isActive: item.isActive !== false,
    description: item.description || "",
  };

  openModal.value = true;
};

const openModalDeleteDepartment = (item) => {
  id.value = item._id;

  const data = {
    id: item._id,
    ruta: "department",
  };

  deleteInfo.value?.openDelete(data, "Departamento");
};

const openDepartmentDetail = async (row) => {
  detailDepartment.value = {
    ...row,
    companyLabel: getCompanyLabel(row.company),
  };

  openDetail.value = true;

  employeesOfDepartment.value = [];
  positionsOfDepartment.value = [];

  selectedManagers.value = Array.isArray(row.managers)
    ? row.managers
        .map((manager) =>
          typeof manager === "string" ? manager : manager?._id
        )
        .filter(Boolean)
    : [];

  await Promise.all([
    loadEmployeesOfDepartment(row._id),
    loadPositionsOfDepartment(row._id),
  ]);
};

const saveManagers = async () => {
  if (!detailDepartment.value?._id) return;

  savingManagers.value = true;

  try {
    const resp = await methodsHttp.putApi(
      `department/${detailDepartment.value._id}/managers`,
      { managers: selectedManagers.value }
    );

    if (!resp?.ok) {
      notify.value?.showNotifyBad(
        resp?.mensaje || "No se pudieron guardar los gerentes"
      );
      return;
    }

    notify.value?.showNotifyGood(
      resp?.mensaje || "Gerentes guardados con éxito"
    );

    await getDepartmentAdmin();
  } finally {
    savingManagers.value = false;
  }
};

const reload = async () => {
  await Promise.all([getCompanies(), getDepartmentAdmin()]);
};

defineExpose({
  reload,
});
</script>

<style scoped>
.departments-tab {
  width: 100%;
}

.section-card,
.table-card {
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.section-card {
  padding: 18px;
}

.department-header {
  width: 100%;
}

.table-card {
  overflow: hidden;
}

.action-btn {
  min-height: 40px;
  font-weight: 600;
  text-transform: none;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
}

.modern-table :deep(.q-table__top),
.modern-table :deep(.q-table__bottom) {
  padding-left: 16px;
  padding-right: 16px;
}

.modern-table :deep(th) {
  font-weight: 700;
  color: #374151;
  background: #f8fafc;
}

.modern-table :deep(td) {
  vertical-align: middle;
}

.table-action-btn {
  border-radius: 12px;
}

.company-chip {
  border-radius: 999px;
}

.status-badge {
  padding: 6px 10px;
  font-weight: 700;
}

.summary-chip {
  border-radius: 999px;
}

.description-cell {
  max-width: 420px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #4b5563;
}
</style>