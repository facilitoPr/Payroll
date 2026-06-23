<template>
  <div class="job-positions-tab">
    <q-card flat bordered class="section-card q-mb-md">
      <div class="job-position-header">
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="row items-center q-gutter-sm">
              <q-avatar color="primary" text-color="white" icon="work" />

              <div>
                <div class="text-subtitle1 text-weight-bold">
                  Puestos de trabajo
                </div>
                <div class="text-caption text-grey-7">
                  Administra puestos por compañía, departamento, modalidad y
                  estado.
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
                label="Nuevo puesto"
                class="action-btn"
                @click="openCreate"
              />
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-3">
            <q-select
              v-model="companyFilter"
              :options="companyOptions"
              option-label="label"
              option-value="_id"
              emit-value
              map-options
              clearable
              outlined
              dense
              color="primary"
              label="Compañía"
              class="rounded-input"
              @update:model-value="handleCompanyFilterChange"
            >
              <template #prepend>
                <q-icon name="business" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="departmentFilter"
              :options="filteredDepartmentOptions"
              option-label="name"
              option-value="_id"
              emit-value
              map-options
              clearable
              outlined
              dense
              color="primary"
              label="Departamento"
              class="rounded-input"
              :loading="loadingFilterDepartments"
              :disable="!companyFilter || loadingFilterDepartments"
              :hint="
                !companyFilter
                  ? 'Selecciona una compañía para cargar sus departamentos.'
                  : ''
              "
              @update:model-value="handleFiltersChange"
            >
              <template #prepend>
                <q-icon name="apartment" />
              </template>

              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No hay departamentos para esta compañía.
                  </q-item-section>
                </q-item>
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

          <div class="col-12 col-md-3">
            <q-select
              v-model="modalityFilter"
              :options="modalityFilterOptions"
              emit-value
              map-options
              outlined
              dense
              color="primary"
              label="Modalidad"
              class="rounded-input"
              @update:model-value="handleFiltersChange"
            >
              <template #prepend>
                <q-icon name="work_history" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="employmentTypeFilter"
              :options="employmentTypeFilterOptions"
              emit-value
              map-options
              outlined
              dense
              color="primary"
              label="Tipo de empleo"
              class="rounded-input"
              @update:model-value="handleFiltersChange"
            >
              <template #prepend>
                <q-icon name="badge" />
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
              placeholder="Buscar por nombre, código, descripción, requisitos..."
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
            Los filtros se consultan directamente en la base de datos.
          </div>

          <q-chip dense color="primary" text-color="white" class="summary-chip">
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
        :loading="loading"
        :rows-per-page-options="[10, 20, 50, 100]"
        no-data-label="No hay puestos registrados"
        no-results-label="No se encontraron puestos"
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
                @click="openDetail(props.row)"
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
                @click="openEdit(props.row)"
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
                @click="openDeleteConfirm(props.row)"
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
                size="36px"
                color="primary"
                text-color="white"
                icon="work"
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
              class="rounded-chip"
            >
              {{ getCompanyLabel(props.row.company) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-department="props">
          <q-td :props="props">
            <q-chip
              dense
              outline
              color="primary"
              text-color="primary"
              icon="apartment"
              class="rounded-chip"
            >
              {{ getDepartmentName(props.row.department) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-modality="props">
          <q-td :props="props" class="text-center">
            <q-badge rounded outline color="primary">
              {{ getModalityLabel(props.row.modality) }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-employmentType="props">
          <q-td :props="props">
            {{ getEmploymentTypeLabel(props.row.employmentType) }}
          </q-td>
        </template>

        <template #body-cell-projects="props">
          <q-td :props="props" class="text-center">
            <q-chip dense color="primary" text-color="white" icon="workspaces">
              {{ props.row.projectsCount || 0 }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-isActive="props">
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

    <JobPositionFormDialog
      v-model="openFormDialog"
      :is-edit-mode="isEditing"
      :form-data="form"
      :companies="companyOptions"
      :departments="formDepartments"
      :loading-departments="loadingFormDepartments"
      :loading="saving"
      @company-change="handleFormCompanyChange"
      @save="saveJobPosition"
    />

    <JobPositionDetailDialog
      v-model="openDetailDialog"
      :job-position="selected"
      :company-label="getCompanyLabel(selected?.company)"
      :department-label="getDepartmentName(selected?.department)"
      :projects="selectedProjects"
      :loading-projects="loadingProjects"
      :saving-project="savingProject"
      :deleting-project="deletingProject"
      @create-project="createProject"
      @update-project="updateProject"
      @delete-project="deleteProject"
    />

    <OrganizationDeleteDialog
      v-model="openDeleteDialog"
      title="Eliminar puesto"
      icon="work"
      :item-name="selected?.name"
      :loading="deleting"
      message="Esta acción hará un soft delete del puesto seleccionado."
      @confirm="deleteJobPosition"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import JobPositionFormDialog from "./dialogs/JobPositionFormDialog.vue";
import JobPositionDetailDialog from "./dialogs/JobPositionDetailDialog.vue";
import OrganizationDeleteDialog from "./dialogs/OrganizationDeleteDialog.vue";

const emit = defineEmits(["loading"]);

const $q = useQuasar();

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const loadingProjects = ref(false);

const rows = ref([]);
const companies = ref([]);
const departments = ref([]);

const search = ref("");
const companyFilter = ref(null);
const departmentFilter = ref(null);
const statusFilter = ref("all");
const modalityFilter = ref("all");
const employmentTypeFilter = ref("all");

const openFormDialog = ref(false);
const openDetailDialog = ref(false);
const openDeleteDialog = ref(false);

const isEditing = ref(false);
const selected = ref(null);

const pagination = ref({
  sortBy: "name",
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const filterDepartments = ref([]);
const formDepartments = ref([]);
const selectedProjects = ref([]);

const loadingFilterDepartments = ref(false);
const loadingFormDepartments = ref(false);
const savingProject = ref(false);
const deletingProject = ref(false);

const form = ref(getEmptyForm());

const statusOptions = [
  { label: "Todos", value: "all" },
  { label: "Activos", value: "true" },
  { label: "Inactivos", value: "false" },
];

const modalityOptions = [
  { label: "Presencial", value: "Onsite" },
  { label: "Remoto", value: "Remote" },
  { label: "Híbrido", value: "Hybrid" },
];

const modalityFilterOptions = [
  { label: "Todas", value: "all" },
  ...modalityOptions,
];

const employmentTypeOptions = [
  { label: "Tiempo completo", value: "FullTime" },
  { label: "Medio tiempo", value: "PartTime" },
  { label: "Contrato", value: "Contract" },
  { label: "Pasantía", value: "Internship" },
  { label: "Temporal", value: "Temporary" },
];

const employmentTypeFilterOptions = [
  { label: "Todos", value: "all" },
  ...employmentTypeOptions,
];

const columns = [
  {
    name: "actions",
    label: "Acciones",
    field: "actions",
    align: "center",
  },
  {
    name: "name",
    label: "Puesto",
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
    name: "department",
    label: "Departamento",
    field: "department",
    align: "left",
  },
  {
    name: "modality",
    label: "Modalidad",
    field: "modality",
    align: "center",
    sortable: true,
  },
  {
    name: "employmentType",
    label: "Tipo",
    field: "employmentType",
    align: "left",
    sortable: true,
  },
  {
    name: "projects",
    label: "Proyectos",
    field: "projects",
    align: "center",
  },
  {
    name: "isActive",
    label: "Estado",
    field: "isActive",
    align: "center",
    sortable: true,
  },
];

const companyOptions = computed(() =>
  companies.value.map((company) => ({
    ...company,
    label: getCompanyOptionLabel(company),
  })),
);

const filteredDepartmentOptions = computed(() => {
  return filterDepartments.value;
});

function getEmptyForm() {
  return {
    company: "",
    department: "",
    code: "",
    name: "",
    description: "",
    modality: "Onsite",
    employmentType: "",
    requirements: [],
    responsibilities: [],
    isActive: true,
  };
}

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

const getCompanyOptionLabel = (company) => {
  const name =
    company?.tradeName || company?.legalName || company?.name || "Compañía";

  return company?.code ? `${name} (${company.code})` : name;
};

const getCompanyLabel = (companyValue) => {
  if (!companyValue) return "Sin compañía";

  if (typeof companyValue === "object") {
    return getCompanyOptionLabel(companyValue);
  }

  const company = companies.value.find((item) => item._id === companyValue);

  return company ? getCompanyOptionLabel(company) : "Sin compañía";
};

const getDepartmentName = (departmentValue) => {
  if (!departmentValue) return "Sin departamento";

  if (typeof departmentValue === "object") {
    return departmentValue?.name || "Sin departamento";
  }

  const department = departments.value.find(
    (item) => item._id === departmentValue,
  );

  return department?.name || "Sin departamento";
};

const getModalityLabel = (value) => {
  if (value === "Onsite") return "Presencial";
  if (value === "Remote") return "Remoto";
  if (value === "Hybrid") return "Híbrido";

  return "N/A";
};

const getEmploymentTypeLabel = (value) => {
  if (value === "FullTime") return "Tiempo completo";
  if (value === "PartTime") return "Medio tiempo";
  if (value === "Contract") return "Contrato";
  if (value === "Internship") return "Pasantía";
  if (value === "Temporary") return "Temporal";

  return "N/A";
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

  if (departmentFilter.value) {
    params.set("department", departmentFilter.value);
  }

  if (statusFilter.value !== "all") {
    params.set("isActive", statusFilter.value);
  }

  if (modalityFilter.value !== "all") {
    params.set("modality", modalityFilter.value);
  }

  if (employmentTypeFilter.value !== "all") {
    params.set("employmentType", employmentTypeFilter.value);
  }

  if (search.value?.trim()) {
    params.set("search", search.value.trim());
  }

  return params.toString();
};

const getCompanies = async () => {
  const resp = await methodsHttp.getApi("company");

  if (resp?.ok) {
    companies.value = normalizeList(resp, ["companies", "company", "data"]);
  } else {
    companies.value = [];
  }
};

const getDepartments = async () => {
  const resp = await methodsHttp.getApi("department");

  if (resp?.ok) {
    departments.value = normalizeList(resp, [
      "departments",
      "department",
      "data",
    ]);
  } else {
    departments.value = [];
  }
};

const getJobPositions = async () => {
  loading.value = true;
  emit("loading", true);

  try {
    const query = buildQueryParams();

    const resp = await methodsHttp.getApi(`job-position/admin?${query}`);

    if (resp?.ok) {
      rows.value = normalizeList(resp, ["jobPositions", "positions", "data"]);

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

      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudieron cargar los puestos.",
      });
    }
  } finally {
    loading.value = false;
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

  await getJobPositions();
};

const handleFiltersChange = async () => {
  pagination.value.page = 1;
  await getJobPositions();
};

const handleCompanyFilterChange = async () => {
  departmentFilter.value = null;
  filterDepartments.value = [];

  if (companyFilter.value) {
    await loadDepartmentsByCompany(companyFilter.value, "filter");
  }

  await handleFiltersChange();
};

const handleFormCompanyChange = async (companyId) => {
  form.value.department = "";
  formDepartments.value = [];

  if (!companyId) return;

  await loadDepartmentsByCompany(companyId, "form");
};

//

const loadDepartmentsByCompany = async (companyId, target = "filter") => {
  if (target === "filter") {
    filterDepartments.value = [];
  }

  if (target === "form") {
    formDepartments.value = [];
  }

  if (!companyId) return;

  if (target === "filter") {
    loadingFilterDepartments.value = true;
  }

  if (target === "form") {
    loadingFormDepartments.value = true;
  }

  try {
    const resp = await methodsHttp.getApi(`department/company/${companyId}`);

    const list = resp?.ok
      ? normalizeList(resp, ["departments", "department", "data"])
      : [];

    if (target === "filter") {
      filterDepartments.value = list;
    }

    if (target === "form") {
      formDepartments.value = list;
    }
  } finally {
    loadingFilterDepartments.value = false;
    loadingFormDepartments.value = false;
  }
};

const loadProjectsByJobPosition = async (jobPositionId) => {
  selectedProjects.value = [];

  if (!jobPositionId) return;

  loadingProjects.value = true;

  try {
    const resp = await methodsHttp.getApi(
      `job-position/${jobPositionId}/projects`
    );

    selectedProjects.value = resp?.ok
      ? normalizeList(resp, ["projects", "project", "data"])
      : [];
  } finally {
    loadingProjects.value = false;
  }
};

const createProject = async (payload) => {
  if (!selected.value?._id) return;

  savingProject.value = true;

  try {
    const resp = await methodsHttp.postApi(
      `job-position/${selected.value._id}/projects`,
      payload,
    );

    if (!resp?.ok) {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo crear el proyecto.",
      });
      return;
    }

    $q.notify({
      type: "positive",
      message: resp?.mensaje || "Proyecto creado correctamente.",
    });

    await loadProjectsByJobPosition(selected.value._id);
    await getJobPositions();
  } finally {
    savingProject.value = false;
  }
};

const updateProject = async ({ projectId, payload }) => {
  if (!projectId) return;

  savingProject.value = true;

  try {
    const resp = await methodsHttp.putApi(
      `job-position/projects/${projectId}`,
      payload,
    );

    if (!resp?.ok) {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo actualizar el proyecto.",
      });
      return;
    }

    $q.notify({
      type: "positive",
      message: resp?.mensaje || "Proyecto actualizado correctamente.",
    });

    await loadProjectsByJobPosition(selected.value._id);
    await getJobPositions();
  } finally {
    savingProject.value = false;
  }
};

const deleteProject = async (project) => {
  if (!project?._id) return;

  deletingProject.value = true;

  try {
    const resp = await methodsHttp.deleteApi(
      `job-position/projects/${project._id}`,
    );

    if (!resp?.ok) {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo eliminar el proyecto.",
      });
      return;
    }

    $q.notify({
      type: "positive",
      message: resp?.mensaje || "Proyecto eliminado correctamente.",
    });

    await loadProjectsByJobPosition(selected.value._id);
    await getJobPositions();
  } finally {
    deletingProject.value = false;
  }
};

//

const openCreate = async () => {
  isEditing.value = false;
  selected.value = null;

  form.value = {
    ...getEmptyForm(),
    company: companyFilter.value || "",
    department: departmentFilter.value || "",
  };

  formDepartments.value = [];

  if (form.value.company) {
    await loadDepartmentsByCompany(form.value.company, "form");
  }

  openFormDialog.value = true;
};

const openEdit = async (row) => {
  isEditing.value = true;
  selected.value = row;

  const companyId = getId(row.company);

  form.value = {
    ...getEmptyForm(),
    company: companyId,
    department: getId(row.department),
    code: row.code || "",
    name: row.name || "",
    description: row.description || "",
    modality: row.modality || "Onsite",
    employmentType: row.employmentType || "",
    requirements: Array.isArray(row.requirements) ? [...row.requirements] : [],
    responsibilities: Array.isArray(row.responsibilities)
      ? [...row.responsibilities]
      : [],
    isActive: row.isActive !== false,
  };

  formDepartments.value = [];

  if (companyId) {
    await loadDepartmentsByCompany(companyId, "form");
  }

  openFormDialog.value = true;
};

const openDetail = async (row) => {
  selected.value = row;
  selectedProjects.value = [];
  openDetailDialog.value = true;

  await loadProjectsByJobPosition(row._id);
};

const openDeleteConfirm = (row) => {
  selected.value = row;
  openDeleteDialog.value = true;
};

const saveJobPosition = async (payload) => {
  saving.value = true;
  emit("loading", true);

  try {
    let resp;

    if (isEditing.value && selected.value?._id) {
      resp = await methodsHttp.putApi(
        `job-position/${selected.value._id}`,
        payload,
      );
    } else {
      resp = await methodsHttp.postApi("job-position", payload);
    }

    if (!resp?.ok) {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo guardar el puesto.",
      });

      return;
    }

    $q.notify({
      type: "positive",
      message: resp?.mensaje || "Puesto guardado correctamente.",
    });

    openFormDialog.value = false;
    await getJobPositions();
  } finally {
    saving.value = false;
    emit("loading", false);
  }
};

const deleteJobPosition = async () => {
  if (!selected.value?._id) return;

  deleting.value = true;
  emit("loading", true);

  try {
    const resp = await methodsHttp.deleteApi(
      `job-position/${selected.value._id}`,
    );

    if (!resp?.ok) {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo eliminar el puesto.",
      });

      return;
    }

    $q.notify({
      type: "positive",
      message: resp?.mensaje || "Puesto eliminado correctamente.",
    });

    openDeleteDialog.value = false;
    await getJobPositions();
  } finally {
    deleting.value = false;
    emit("loading", false);
  }
};

const reload = async () => {
  await Promise.all([getCompanies(), getDepartments(), getJobPositions()]);
};

onMounted(async () => {
  await reload();
});

defineExpose({
  reload,
});
</script>

<style scoped>
.job-positions-tab {
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

.job-position-header {
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

.status-badge {
  padding: 6px 10px;
  font-weight: 700;
}

.rounded-chip {
  border-radius: 999px;
}

.summary-chip {
  border-radius: 999px;
}
</style>
