<template>
  <q-dialog v-model="open" persistent>
    <q-card class="confirm-pay-card">
      <div class="dialog-header bg-primary row items-center justify-between">
        <div class="row items-start justify-between q-col-gutter-md header-content">
          <div class="header-title text-white">
            <div class="header-icon">
              <q-icon name="payments" size="24px" />
            </div>

            <div>
              <div class="text-h6 text-weight-bold">
                Confirmar pago
              </div>

              <div class="text-caption">
                Marca como listos para pago los días del rango seleccionado,
                sin cargar listas grandes de empleados.
              </div>
            </div>
          </div>
        </div>

        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          :disable="state.loading"
          @click="open = false"
        >
          <q-tooltip>Cerrar</q-tooltip>
        </q-btn>
      </div>

      <q-card-section class="dialog-body">
        <div class="range-banner q-mb-md">
          <q-icon name="date_range" color="primary" size="20px" />

          <div>
            <div class="text-weight-bold">
              Rango de confirmación
            </div>

            <div class="text-caption text-grey-7">
              {{ filtros.fechaInicio || "Sin fecha" }}
              <span v-if="filtros.fechaFin">
                → {{ filtros.fechaFin }}
              </span>
            </div>
          </div>
        </div>

        <q-card flat bordered class="scope-panel">
          <q-card-section class="q-pa-md">
            <div class="section-title">
              <q-icon name="tune" color="primary" size="19px" />
              Alcance de confirmación
            </div>

            <div class="section-subtitle">
              Elige si deseas confirmar una empresa completa, departamento,
              puesto, proyecto o empleados específicos.
            </div>

            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12">
                <q-select
                  v-model="state.scopeMode"
                  :options="scopeOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  outlined
                  dense
                  label="Confirmar por"
                  class="rounded-input"
                  @update:model-value="onScopeModeChange"
                >
                  <template #prepend>
                    <q-icon name="account_tree" color="primary" />
                  </template>

                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-avatar
                          size="34px"
                          :color="scope.opt.color"
                          text-color="white"
                        >
                          <q-icon :name="scope.opt.icon" size="18px" />
                        </q-avatar>
                      </q-item-section>

                      <q-item-section>
                        <q-item-label class="text-weight-bold">
                          {{ scope.opt.label }}
                        </q-item-label>

                        <q-item-label caption>
                          {{ scope.opt.caption }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div
                v-if="requiresCompany"
                class="col-12 col-md-6"
              >
                <q-select
                  v-model="filters.company"
                  :options="companies"
                  :option-label="companyOptionLabel"
                  option-value="_id"
                  emit-value
                  map-options
                  outlined
                  dense
                  clearable
                  use-input
                  input-debounce="250"
                  label="Empresa"
                  class="rounded-input"
                  :loading="catalogLoading.companies"
                  @filter="filterCompanies"
                  @update:model-value="onCompanyChange"
                >
                  <template #prepend>
                    <q-icon name="business" color="primary" />
                  </template>
                </q-select>
              </div>

              <div
                v-if="requiresDepartment"
                class="col-12 col-md-6"
              >
                <q-select
                  v-model="filters.department"
                  :options="departments"
                  option-label="name"
                  option-value="_id"
                  emit-value
                  map-options
                  outlined
                  dense
                  clearable
                  use-input
                  input-debounce="250"
                  label="Departamento"
                  class="rounded-input"
                  :disable="!filters.company"
                  :loading="catalogLoading.departments"
                  @filter="filterDepartments"
                  @update:model-value="onDepartmentChange"
                >
                  <template #prepend>
                    <q-icon name="domain" color="primary" />
                  </template>

                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        {{
                          !filters.company
                            ? "Selecciona una empresa primero"
                            : "No se encontraron departamentos"
                        }}
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div
                v-if="requiresJobPosition"
                class="col-12 col-md-6"
              >
                <q-select
                  v-model="filters.jobPosition"
                  :options="jobPositions"
                  option-label="name"
                  option-value="_id"
                  emit-value
                  map-options
                  outlined
                  dense
                  clearable
                  use-input
                  input-debounce="250"
                  label="Puesto de trabajo"
                  class="rounded-input"
                  :disable="!filters.department"
                  :loading="catalogLoading.jobPositions"
                  @filter="filterJobPositions"
                  @update:model-value="onJobPositionChange"
                >
                  <template #prepend>
                    <q-icon name="badge" color="primary" />
                  </template>

                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        {{
                          !filters.department
                            ? "Selecciona un departamento primero"
                            : "No se encontraron puestos"
                        }}
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div
                v-if="requiresProject"
                class="col-12 col-md-6"
              >
                <q-select
                  v-model="filters.project"
                  :options="projects"
                  option-label="name"
                  option-value="_id"
                  emit-value
                  map-options
                  outlined
                  dense
                  clearable
                  use-input
                  input-debounce="250"
                  label="Proyecto"
                  class="rounded-input"
                  :disable="!filters.jobPosition"
                  :loading="catalogLoading.projects"
                  @filter="filterProjects"
                  @update:model-value="refreshPreview"
                >
                  <template #prepend>
                    <q-icon name="work" color="primary" />
                  </template>

                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        {{
                          !filters.jobPosition
                            ? "Selecciona un puesto primero"
                            : "No se encontraron proyectos"
                        }}
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div
                v-if="state.scopeMode === 'EMPLOYEES'"
                class="col-12"
              >
                <q-select
                  v-model="state.selectedEmployees"
                  :options="employeeOptions"
                  :option-label="employeeOptionLabel"
                  option-value="_id"
                  multiple
                  outlined
                  dense
                  clearable
                  use-input
                  use-chips
                  input-debounce="450"
                  label="Buscar empleados específicos"
                  class="rounded-input employee-select"
                  :loading="employeeSearchLoading"
                  @filter="filterEmployees"
                  @update:model-value="refreshPreview"
                >
                  <template #prepend>
                    <q-icon name="person_search" color="primary" />
                  </template>

                  <template #hint>
                    Busca por nombre, correo o usuario.
                  </template>

                  <template #option="scope">
                    <q-item v-bind="scope.itemProps" class="employee-option">
                      <q-item-section avatar>
                        <q-avatar size="42px">
                          <img :src="employeeAvatar(scope.opt)" />
                        </q-avatar>
                      </q-item-section>

                      <q-item-section>
                        <q-item-label class="text-weight-bold">
                          {{ scope.opt?.name || "Empleado sin nombre" }}
                        </q-item-label>

                        <q-item-label caption>
                          {{ scope.opt?.email || scope.opt?.username || "Sin correo" }}
                        </q-item-label>

                        <q-item-label
                          caption
                          v-if="
                            scope.opt?.department?.name ||
                            scope.opt?.jobPosition?.name ||
                            scope.opt?.project?.name
                          "
                        >
                          <span v-if="scope.opt?.department?.name">
                            {{ scope.opt.department.name }}
                          </span>

                          <span v-if="scope.opt?.jobPosition?.name">
                            · {{ scope.opt.jobPosition.name }}
                          </span>

                          <span v-if="scope.opt?.project?.name">
                            · {{ scope.opt.project.name }}
                          </span>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="preview-panel q-mt-md">
          <q-card-section class="q-pa-md">
            <div class="row q-col-gutter-md items-stretch">
              <div class="col-12 col-sm-4">
                <div class="preview-card">
                  <div class="preview-icon preview-icon--employees">
                    <q-icon name="groups" />
                  </div>

                  <div>
                    <div class="preview-label">Empleados</div>
                    <div class="preview-value">
                      {{ preview.employeesCount }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-sm-4">
                <div class="preview-card">
                  <div class="preview-icon preview-icon--days">
                    <q-icon name="event_available" />
                  </div>

                  <div>
                    <div class="preview-label">Días encontrados</div>
                    <div class="preview-value">
                      {{ preview.matchedCount }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-sm-4">
                <div class="preview-card">
                  <div class="preview-icon preview-icon--scope">
                    <q-icon :name="currentScopeMeta.icon" />
                  </div>

                  <div>
                    <div class="preview-label">Alcance</div>
                    <div class="preview-value preview-value--small">
                      {{ currentScopeMeta.shortLabel }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="preview-actions q-mt-md">
              <div class="text-caption text-grey-7">
                Usa “Calcular afectados” para validar cuántos días se marcarán
                antes de confirmar.
              </div>

              <q-space />

              <q-btn
                outline
                no-caps
                color="primary"
                icon="calculate"
                label="Calcular afectados"
                class="calculate-btn"
                :loading="state.previewLoading"
                :disable="!canPreview"
                @click="previewConfirmPay"
              />
            </div>
          </q-card-section>
        </q-card>

        <q-banner
          v-if="preview.matchedCount > 0"
          class="confirm-warning q-mt-md"
          rounded
        >
          <template #avatar>
            <q-icon name="info" color="primary" />
          </template>

          Se marcarán como listos para pago
          <b>{{ preview.matchedCount }}</b>
          día(s) del rango indicado.
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          no-caps
          label="Cancelar"
          color="grey-8"
          class="cancel-btn"
          :disable="state.loading"
          @click="open = false"
        />

        <q-btn
          unelevated
          no-caps
          label="Confirmar pago"
          icon="check_circle"
          color="positive"
          class="confirm-btn"
          :disable="!canSave"
          :loading="state.loading"
          @click="saveConfirmPay"
        />
      </q-card-actions>

      <q-inner-loading
        :showing="state.loading"
        label="Procesando..."
        label-class="text-primary text-weight-bold"
        color="primary"
      />
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const $q = useQuasar();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  filtros: { type: Object, required: true },

  /**
   * Opcionales para abrir el modal ya ubicado en los filtros actuales del reporte.
   */
  initialCompanyId: { type: String, default: "" },
  initialDepartmentId: { type: String, default: "" },
  initialJobPositionId: { type: String, default: "" },
  initialProjectId: { type: String, default: "" },
  initialPaymentScheduleId: { type: String, default: "" },

  /**
   * Compatibilidad con el flujo viejo.
   * Puedes pasar los empleados visibles de la página actual si quieres,
   * pero ya no es obligatorio.
   */
  employeesOptions: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "saved"]);

const fallbackAvatar =
  "https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp";

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const state = ref({
  loading: false,
  previewLoading: false,
  scopeMode: "COMPANY",
  selectedEmployees: [],
});

const preview = ref({
  employeesCount: 0,
  matchedCount: 0,
  modifiedCount: 0,
});

const filters = ref({
  company: null,
  department: null,
  jobPosition: null,
  project: null,
});

const catalogLoading = ref({
  companies: false,
  departments: false,
  jobPositions: false,
  projects: false,
});

const companies = ref([]);
const companiesOriginal = ref([]);

const departments = ref([]);
const departmentsOriginal = ref([]);

const jobPositions = ref([]);
const jobPositionsOriginal = ref([]);

const projects = ref([]);
const projectsOriginal = ref([]);

const employeeOptions = ref([]);
const employeeOptionsOriginal = ref([]);
const employeeSearchLoading = ref(false);

const scopeOptions = [
  {
    label: "Empresa completa",
    shortLabel: "Empresa",
    value: "COMPANY",
    icon: "business",
    color: "primary",
    caption: "Confirma todos los empleados activos de una empresa.",
  },
  {
    label: "Departamento completo",
    shortLabel: "Departamento",
    value: "DEPARTMENT",
    icon: "domain",
    color: "indigo",
    caption: "Confirma todos los empleados activos de un departamento.",
  },
  {
    label: "Puesto de trabajo completo",
    shortLabel: "Puesto",
    value: "JOB_POSITION",
    icon: "badge",
    color: "teal",
    caption: "Confirma todos los empleados activos de un puesto.",
  },
  {
    label: "Proyecto completo",
    shortLabel: "Proyecto",
    value: "PROJECT",
    icon: "work",
    color: "orange",
    caption: "Confirma todos los empleados activos de un proyecto.",
  },
  {
    label: "Empleados específicos",
    shortLabel: "Empleados",
    value: "EMPLOYEES",
    icon: "group_add",
    color: "positive",
    caption: "Busca y selecciona empleados puntuales.",
  },
];

const currentScopeMeta = computed(() => {
  return (
    scopeOptions.find((item) => item.value === state.value.scopeMode) ||
    scopeOptions[0]
  );
});

const requiresCompany = computed(() => {
  return ["COMPANY", "DEPARTMENT", "JOB_POSITION", "PROJECT", "EMPLOYEES"].includes(
    state.value.scopeMode,
  );
});

const requiresDepartment = computed(() => {
  return ["DEPARTMENT", "JOB_POSITION", "PROJECT", "EMPLOYEES"].includes(
    state.value.scopeMode,
  );
});

const requiresJobPosition = computed(() => {
  return ["JOB_POSITION", "PROJECT", "EMPLOYEES"].includes(
    state.value.scopeMode,
  );
});

const requiresProject = computed(() => {
  return ["PROJECT", "EMPLOYEES"].includes(state.value.scopeMode);
});

const selectedUserIds = computed(() => {
  return (state.value.selectedEmployees || [])
    .map((employee) => employee?._id || employee?.value || employee)
    .filter(Boolean);
});

const canPreview = computed(() => {
  if (!props.filtros?.fechaInicio) return false;

  if (state.value.scopeMode === "COMPANY") return Boolean(filters.value.company);
  if (state.value.scopeMode === "DEPARTMENT") return Boolean(filters.value.department);
  if (state.value.scopeMode === "JOB_POSITION") return Boolean(filters.value.jobPosition);
  if (state.value.scopeMode === "PROJECT") return Boolean(filters.value.project);
  if (state.value.scopeMode === "EMPLOYEES") return selectedUserIds.value.length > 0;

  return false;
});

const canSave = computed(() => {
  return canPreview.value;
});

const normalizeArrayResponse = (response, keys = []) => {
  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
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

const employeeOptionLabel = (employee) => {
  return (
    employee?.name ||
    employee?.email ||
    employee?.username ||
    employee?.code ||
    "Empleado"
  );
};

const employeeAvatar = (employee) => {
  return employee?.img || employee?.image || employee?.avatar || fallbackAvatar;
};

const resetPreview = () => {
  preview.value = {
    employeesCount: 0,
    matchedCount: 0,
    modifiedCount: 0,
  };
};

const loadCompanies = async () => {
  catalogLoading.value.companies = true;

  try {
    const response = await methodsHttp.getApi("company?limit=500&isActive=true");

    const rows = response?.ok
      ? normalizeArrayResponse(response, ["companies", "company", "data", "items"])
      : [];

    companies.value = rows;
    companiesOriginal.value = rows;
  } finally {
    catalogLoading.value.companies = false;
  }
};

const loadDepartments = async (companyId) => {
  departments.value = [];
  departmentsOriginal.value = [];

  if (!companyId) return;

  catalogLoading.value.departments = true;

  try {
    const response = await methodsHttp.getApi(`department/company/${companyId}`);

    const rows = response?.ok
      ? normalizeArrayResponse(response, [
          "departments",
          "department",
          "data",
          "items",
        ])
      : [];

    departments.value = rows;
    departmentsOriginal.value = rows;
  } finally {
    catalogLoading.value.departments = false;
  }
};

const loadJobPositions = async (departmentId) => {
  jobPositions.value = [];
  jobPositionsOriginal.value = [];

  if (!departmentId) return;

  catalogLoading.value.jobPositions = true;

  try {
    const response = await methodsHttp.getApi(
      `job-position/department/${departmentId}`,
    );

    const rows = response?.ok
      ? normalizeArrayResponse(response, [
          "jobPositions",
          "positions",
          "data",
          "items",
        ])
      : [];

    jobPositions.value = rows;
    jobPositionsOriginal.value = rows;
  } finally {
    catalogLoading.value.jobPositions = false;
  }
};

const loadProjects = async (jobPositionId) => {
  projects.value = [];
  projectsOriginal.value = [];

  if (!jobPositionId) return;

  catalogLoading.value.projects = true;

  try {
    const response = await methodsHttp.getApi(
      `job-position/${jobPositionId}/projects`,
    );

    const rows = response?.ok
      ? normalizeArrayResponse(response, ["projects", "project", "data", "items"])
      : [];

    projects.value = rows;
    projectsOriginal.value = rows;
  } finally {
    catalogLoading.value.projects = false;
  }
};

const getEmployees = async (text = "") => {
  const query = new URLSearchParams();

  query.set("isActived", "true");
  query.set("limit", "20");
  query.set("initial", "0");

  if (text && String(text).trim()) {
    query.set("text", String(text).trim());
  }

  if (filters.value.company) query.set("company", filters.value.company);
  if (filters.value.department) query.set("department", filters.value.department);
  if (filters.value.jobPosition) query.set("jobPosition", filters.value.jobPosition);
  if (filters.value.project) query.set("project", filters.value.project);

  const response = await methodsHttp.getApi(`user/getEmployees?${query.toString()}`);

  const rows = response?.ok
    ? normalizeArrayResponse(response, ["employees", "users", "data", "items"])
    : [];

  employeeOptions.value = rows;
  employeeOptionsOriginal.value = rows;

  return rows;
};

const onScopeModeChange = async () => {
  state.value.selectedEmployees = [];
  employeeOptions.value = [];
  employeeOptionsOriginal.value = [];

  resetPreview();

  if (state.value.scopeMode === "COMPANY") {
    filters.value.department = null;
    filters.value.jobPosition = null;
    filters.value.project = null;
  }

  if (state.value.scopeMode === "DEPARTMENT") {
    filters.value.jobPosition = null;
    filters.value.project = null;
  }

  if (state.value.scopeMode === "JOB_POSITION") {
    filters.value.project = null;
  }

  if (state.value.scopeMode === "EMPLOYEES") {
    await getEmployees("");
  }
};

const onCompanyChange = async (companyId) => {
  filters.value.department = null;
  filters.value.jobPosition = null;
  filters.value.project = null;

  departments.value = [];
  departmentsOriginal.value = [];
  jobPositions.value = [];
  jobPositionsOriginal.value = [];
  projects.value = [];
  projectsOriginal.value = [];

  state.value.selectedEmployees = [];
  employeeOptions.value = [];
  employeeOptionsOriginal.value = [];

  resetPreview();

  if (!companyId) return;

  await loadDepartments(companyId);

  if (state.value.scopeMode === "EMPLOYEES") {
    await getEmployees("");
  }
};

const onDepartmentChange = async (departmentId) => {
  filters.value.jobPosition = null;
  filters.value.project = null;

  jobPositions.value = [];
  jobPositionsOriginal.value = [];
  projects.value = [];
  projectsOriginal.value = [];

  state.value.selectedEmployees = [];
  employeeOptions.value = [];
  employeeOptionsOriginal.value = [];

  resetPreview();

  if (!departmentId) {
    if (state.value.scopeMode === "EMPLOYEES") await getEmployees("");
    return;
  }

  await loadJobPositions(departmentId);

  if (state.value.scopeMode === "EMPLOYEES") {
    await getEmployees("");
  }
};

const onJobPositionChange = async (jobPositionId) => {
  filters.value.project = null;

  projects.value = [];
  projectsOriginal.value = [];

  state.value.selectedEmployees = [];
  employeeOptions.value = [];
  employeeOptionsOriginal.value = [];

  resetPreview();

  if (!jobPositionId) {
    if (state.value.scopeMode === "EMPLOYEES") await getEmployees("");
    return;
  }

  await loadProjects(jobPositionId);

  if (state.value.scopeMode === "EMPLOYEES") {
    await getEmployees("");
  }
};

const filterCompanies = (value, update) => {
  update(() => {
    if (!value) {
      companies.value = companiesOriginal.value;
      return;
    }

    const needle = String(value).toLowerCase();

    companies.value = companiesOriginal.value.filter((company) => {
      return companyOptionLabel(company).toLowerCase().includes(needle);
    });
  });
};

const filterDepartments = (value, update) => {
  update(() => {
    if (!value) {
      departments.value = departmentsOriginal.value;
      return;
    }

    const needle = String(value).toLowerCase();

    departments.value = departmentsOriginal.value.filter((department) => {
      return String(department?.name || department?.code || "")
        .toLowerCase()
        .includes(needle);
    });
  });
};

const filterJobPositions = (value, update) => {
  update(() => {
    if (!value) {
      jobPositions.value = jobPositionsOriginal.value;
      return;
    }

    const needle = String(value).toLowerCase();

    jobPositions.value = jobPositionsOriginal.value.filter((jobPosition) => {
      return String(jobPosition?.name || jobPosition?.code || "")
        .toLowerCase()
        .includes(needle);
    });
  });
};

const filterProjects = (value, update) => {
  update(() => {
    if (!value) {
      projects.value = projectsOriginal.value;
      return;
    }

    const needle = String(value).toLowerCase();

    projects.value = projectsOriginal.value.filter((project) => {
      return String(project?.name || project?.code || "")
        .toLowerCase()
        .includes(needle);
    });
  });
};

const filterEmployees = async (value, update, abort) => {
  const text = String(value || "").trim();

  if (text.length > 0 && text.length < 2) {
    update(() => {
      employeeOptions.value = employeeOptionsOriginal.value;
    });

    return;
  }

  employeeSearchLoading.value = true;

  try {
    const rows = await getEmployees(text);

    update(() => {
      employeeOptions.value = rows;
      employeeOptionsOriginal.value = rows;
    });
  } catch (error) {
    console.error("filterEmployees error:", error);

    if (abort) abort();
  } finally {
    employeeSearchLoading.value = false;
  }
};

const buildPayload = (previewOnly = false) => {
  const payload = {
    scopeMode: state.value.scopeMode,
    fechaInicio: props.filtros.fechaInicio,
    fechaFin: props.filtros.fechaFin || props.filtros.fechaInicio,
    previewOnly,
  };

  if (filters.value.company) {
    payload.companyId = filters.value.company;
  }

  if (filters.value.department) {
    payload.departmentId = filters.value.department;
  }

  if (filters.value.jobPosition) {
    payload.jobPositionId = filters.value.jobPosition;
  }

  if (filters.value.project) {
    payload.projectId = filters.value.project;
  }

  if (props.initialPaymentScheduleId) {
    payload.paymentScheduleId = props.initialPaymentScheduleId;
  }

  if (state.value.scopeMode === "EMPLOYEES") {
    payload.userIds = selectedUserIds.value;
  }

  return payload;
};

const previewConfirmPay = async () => {
  if (!canPreview.value) {
    $q.notify({
      type: "warning",
      message: "Completa el alcance antes de calcular.",
    });

    return;
  }

  state.value.previewLoading = true;

  try {
    const response = await methodsHttp.postApi(
      "punch/confirmDaysToPay",
      buildPayload(true),
    );

    if (response?.ok) {
      preview.value = {
        employeesCount: Number(response.employeesCount || 0),
        matchedCount: Number(response.matchedCount || 0),
        modifiedCount: Number(response.modifiedCount || 0),
      };

      if (!response.matchedCount) {
        $q.notify({
          type: "warning",
          message: "No se encontraron días para confirmar en este alcance.",
        });
      }

      return;
    }

    $q.notify({
      type: "negative",
      message: response?.mensaje || "No se pudo calcular la vista previa.",
    });
  } catch (error) {
    console.error("previewConfirmPay error:", error);

    $q.notify({
      type: "negative",
      message: "Error calculando empleados afectados.",
    });
  } finally {
    state.value.previewLoading = false;
  }
};

const saveConfirmPay = async () => {
  try {
    if (!canSave.value) {
      $q.notify({
        type: "warning",
        message: "Completa el alcance antes de confirmar.",
      });

      return;
    }

    if (!props.filtros.fechaInicio) {
      $q.notify({
        type: "warning",
        message: "Debes seleccionar la fecha de inicio.",
      });

      return;
    }

    state.value.loading = true;

    const response = await methodsHttp.postApi(
      "punch/confirmDaysToPay",
      buildPayload(false),
    );

    if (response?.ok) {
      $q.notify({
        type: "positive",
        message:
          response.mensaje ||
          `Se confirmaron ${response.modifiedCount || 0} día(s) correctamente.`,
      });

      open.value = false;
      emit("saved");

      return;
    }

    $q.notify({
      type: "negative",
      message:
        response?.mensaje ||
        "No se pudieron confirmar los pagos. Inténtalo nuevamente.",
    });
  } catch (error) {
    console.error("saveConfirmPay error:", error);

    $q.notify({
      type: "negative",
      message: "Error al confirmar los pagos.",
    });
  } finally {
    state.value.loading = false;
  }
};

const hydrateInitialFilters = async () => {
  if (props.initialCompanyId) {
    filters.value.company = props.initialCompanyId;
    await loadDepartments(props.initialCompanyId);
  }

  if (props.initialDepartmentId) {
    filters.value.department = props.initialDepartmentId;
    await loadJobPositions(props.initialDepartmentId);
  }

  if (props.initialJobPositionId) {
    filters.value.jobPosition = props.initialJobPositionId;
    await loadProjects(props.initialJobPositionId);
  }

  if (props.initialProjectId) {
    filters.value.project = props.initialProjectId;
  }

  if (props.initialProjectId) {
    state.value.scopeMode = "PROJECT";
  } else if (props.initialJobPositionId) {
    state.value.scopeMode = "JOB_POSITION";
  } else if (props.initialDepartmentId) {
    state.value.scopeMode = "DEPARTMENT";
  } else {
    state.value.scopeMode = "COMPANY";
  }
};

const resetDialog = async () => {
  state.value.loading = false;
  state.value.previewLoading = false;
  state.value.scopeMode = "COMPANY";
  state.value.selectedEmployees = [];

  filters.value.company = null;
  filters.value.department = null;
  filters.value.jobPosition = null;
  filters.value.project = null;

  departments.value = [];
  departmentsOriginal.value = [];
  jobPositions.value = [];
  jobPositionsOriginal.value = [];
  projects.value = [];
  projectsOriginal.value = [];

  employeeOptions.value = [];
  employeeOptionsOriginal.value = [];

  resetPreview();

  await loadCompanies();
  await hydrateInitialFilters();

  if (state.value.scopeMode === "EMPLOYEES") {
    await getEmployees("");
  }
};

const refreshPreview = () => {
  resetPreview();
};

watch(
  () => open.value,
  async (value) => {
    if (value) {
      await resetDialog();
    }
  },
);
</script>

<style scoped>
.confirm-pay-card {
  width: 920px;
  max-width: 96vw;
  max-height: 94vh;
  border-radius: 26px;
  overflow: hidden;
  background: #f8fafc;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18);
}

.dialog-header {
  min-height: 78px;
  padding: 16px 20px;
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 50px;
  height: 50px;
  min-width: 50px;
  border-radius: 17px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.dialog-body {
  max-height: calc(94vh - 146px);
  overflow-y: auto;
  padding: 18px;
}

.range-banner,
.confirm-warning {
  padding: 12px;
  border-radius: 16px;
  background: rgba(23, 141, 210, 0.06);
  border: 1px solid rgba(23, 141, 210, 0.12);
  color: #475569;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 0.82rem;
  font-weight: 600;
}

.scope-panel,
.preview-panel {
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.04);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.section-subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
  background: #ffffff;
}

.employee-option {
  min-height: 58px;
}

.employee-select :deep(.q-field__bottom) {
  padding-top: 4px;
}

.preview-card {
  min-height: 80px;
  padding: 13px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  gap: 11px;
}

.preview-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-icon--employees {
  color: var(--q-primary);
  background: rgba(23, 141, 210, 0.1);
}

.preview-icon--days {
  color: #21ba45;
  background: rgba(33, 186, 69, 0.1);
}

.preview-icon--scope {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}

.preview-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.preview-value {
  margin-top: 3px;
  color: #0f172a;
  font-size: 1.2rem;
  font-weight: 900;
}

.preview-value--small {
  font-size: 1rem;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.calculate-btn,
.cancel-btn,
.confirm-btn {
  min-height: 40px;
  border-radius: 12px;
  font-weight: 800;
}

.dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
}

@media (max-width: 768px) {
  .confirm-pay-card {
    width: 96vw;
    max-height: 96vh;
    border-radius: 22px;
  }

  .dialog-body {
    max-height: calc(96vh - 146px);
    padding: 14px;
  }

  .preview-actions {
    align-items: stretch;
  }

  .calculate-btn {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .confirm-pay-card {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }

  .dialog-body {
    max-height: calc(100vh - 146px);
    padding: 12px;
  }

  .header-title {
    align-items: flex-start;
  }

  .cancel-btn,
  .confirm-btn {
    width: 100%;
  }
}
</style>