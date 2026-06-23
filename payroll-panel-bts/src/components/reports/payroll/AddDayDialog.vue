<template>
  <q-dialog v-model="open" persistent>
    <q-card class="add-day-dialog-card">
      <div class="dialog-header bg-primary row items-center justify-between">
        <div class="row items-start justify-between q-col-gutter-md header-content">
            <div class="header-title text-white">
              <div class="header-icon">
                <q-icon name="event_available" size="24px" />
              </div>

              <div>
                <div class="text-h6 text-weight-bold">
                  Agregar día especial
                </div>

                <div class="text-caption">
                  Busca el empleado, selecciona la clasificación y registra uno
                  o varios días dentro del rango.
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
        <div class="info-banner q-mb-md">
          <q-icon name="info" color="primary" size="20px" />
          <div>
            Para evitar cargar todos los empleados, primero filtra por empresa,
            departamento, puesto o proyecto. También puedes buscar el empleado
            escribiendo su nombre, correo o usuario.
          </div>
        </div>

        <!-- FILTROS -->
        <q-card flat bordered class="filters-panel">
          <q-card-section class="q-pa-md">
            <div class="section-title">
              <q-icon name="tune" color="primary" size="19px" />
              Filtros del empleado
            </div>

            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12 col-md-6">
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

                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-avatar color="primary" text-color="white">
                          <q-icon name="business" />
                        </q-avatar>
                      </q-item-section>

                      <q-item-section>
                        <q-item-label class="text-weight-bold">
                          {{ companyOptionLabel(scope.opt) }}
                        </q-item-label>

                        <q-item-label caption v-if="scope.opt?.taxId || scope.opt?.rnc || scope.opt?.code">
                          {{ scope.opt.taxId || scope.opt.rnc || scope.opt.code }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-6">
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

              <div class="col-12 col-md-6">
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

              <div class="col-12 col-md-6">
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
                  @update:model-value="onProjectChange"
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

              <div class="col-12">
                <q-select
                  v-model="state.user"
                  :options="employeeOptions"
                  :option-label="employeeOptionLabel"
                  option-value="_id"
                  outlined
                  dense
                  clearable
                  use-input
                  input-debounce="450"
                  label="Buscar empleado"
                  class="rounded-input employee-select"
                  :loading="employeeSearchLoading"
                  @filter="filterEmployees"
                  @update:model-value="onUserSelected"
                >
                  <template #prepend>
                    <q-icon name="person_search" color="primary" />
                  </template>

                  <template #hint>
                    Escribe al menos 2 letras para buscar en el backend.
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

                  <template #selected-item="scope">
                    <div class="row items-center no-wrap">
                      <q-avatar size="28px" class="q-mr-sm">
                        <img :src="employeeAvatar(scope.opt)" />
                      </q-avatar>

                      <div class="ellipsis">
                        {{ scope.opt?.name || "Empleado" }}
                      </div>
                    </div>
                  </template>

                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        No se encontraron empleados.
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- DATOS DEL DÍA -->
        <q-card flat bordered class="day-panel q-mt-md">
          <q-card-section class="q-pa-md">
            <div class="section-title">
              <q-icon name="event_note" color="primary" size="19px" />
              Configuración del día
            </div>

            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12 col-md-7">
                <q-select
                  v-model="state.classification"
                  :options="dayTypeOptions"
                  outlined
                  dense
                  clearable
                  label="Clasificación del día"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="fact_check" color="primary" />
                  </template>

                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-avatar
                          size="34px"
                          :color="classificationColor(scope.opt)"
                          text-color="white"
                        >
                          <q-icon
                            :name="classificationIcon(scope.opt)"
                            size="18px"
                          />
                        </q-avatar>
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>
                          {{ scope.opt }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-5">
                <q-input
                  v-model.number="state.hours"
                  type="number"
                  min="0"
                  step="0.25"
                  label="Horas por día"
                  outlined
                  dense
                  class="rounded-input"
                  hint="0 = descontar todo el día"
                >
                  <template #prepend>
                    <q-icon name="schedule" color="primary" />
                  </template>
                </q-input>
              </div>

              <div class="col-12">
                <div class="quick-actions">
                  <div class="expected-pill" v-if="state.user">
                    <q-icon name="event_available" color="primary" />
                    <span>Horario esperado:</span>
                    <b>{{ expectedHoursLabel }}</b>
                  </div>

                  <q-btn
                    outline
                    no-caps
                    color="primary"
                    icon="schedule"
                    label="Día completo"
                    class="quick-btn"
                    :disable="!canSetFullDay"
                    @click="setFullDayHours"
                  />

                  <q-btn
                    outline
                    no-caps
                    color="negative"
                    icon="money_off"
                    label="Descontar todo"
                    class="quick-btn"
                    :disable="!state.user"
                    @click="setZeroHours"
                  />

                  <q-space />

                  <div class="minutes-pill">
                    Minutos a enviar:
                    <b>{{ minutesPerDay }}</b>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- CALENDARIO -->
        <q-card flat bordered class="calendar-panel q-mt-md">
          <q-card-section class="q-pa-md">
            <div class="row items-start justify-between q-col-gutter-md">
              <div class="col-12 col-md">
                <div class="section-title">
                  <q-icon name="calendar_month" color="primary" size="19px" />
                  Selección de días
                </div>

                <div class="section-subtitle">
                  Solo se habilitan días dentro del rango, sin WorkSummary
                  conocido y laborables según el horario del empleado.
                </div>
              </div>

              <div class="col-12 col-md-auto">
                <q-badge color="primary" class="selected-count-badge">
                  {{ state.selectedDates.length }} seleccionado{{
                    state.selectedDates.length === 1 ? "" : "s"
                  }}
                </q-badge>
              </div>
            </div>

            <div class="calendar-wrap q-mt-md">
              <q-date
                v-model="state.selectedDates"
                :disable="!state.user"
                :options="isDateSelectable"
                multiple
                minimal
                color="primary"
                class="modern-calendar"
              />
            </div>

            <div v-if="state.selectedDates.length" class="selected-dates q-mt-md">
              <div class="text-caption text-grey-7 q-mb-xs">
                Días seleccionados
              </div>

              <q-chip
                v-for="date in state.selectedDates"
                :key="date"
                dense
                color="primary"
                text-color="white"
                class="date-chip"
              >
                <q-icon name="event" size="15px" class="q-mr-xs" />
                {{ formatShortDate(date) }}
                <span class="date-chip-extra">
                  · {{ chipExpectedLabel(date) }}
                </span>
              </q-chip>
            </div>

            <q-banner
              v-if="state.ignoredInactiveDates.length"
              dense
              class="ignored-banner q-mt-md"
            >
              <template #avatar>
                <q-icon name="warning" color="orange" />
              </template>

              Algunos días fueron removidos automáticamente por ser no laborables:
              <b class="q-ml-xs">
                {{ state.ignoredInactiveDates.map(formatShortDate).join(", ") }}
              </b>
            </q-banner>
          </q-card-section>
        </q-card>
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
          label="Guardar días"
          icon="save"
          color="primary"
          class="save-btn"
          :loading="state.loading"
          @click="saveNewDay"
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
import moment from "moment";
import methodsHttp from "src/api/methodsHttp";

const $q = useQuasar();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  users: { type: Array, default: () => [] },
  filtros: { type: Object, required: true },
  defaultUser: { type: Object, default: null },
  workSummaryDatesByUser: { type: Object, default: () => ({}) },
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
  user: null,
  selectedDates: [],
  classification: null,
  hours: null,
  expectedByDate: {},
  ignoredInactiveDates: [],
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

const employeeSearchLoading = ref(false);

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

const dayTypeOptions = [
  "Trabajo regular",
  "Permiso por nacimiento de hijos",
  "Permiso por matrimonio",
  "Permiso por fallecimiento familiar directo o abuelo",
  "Licencia pre y post natal",
  "Vacaciones",
  "Licencia médica por enfermedad común",
  "Permiso por estudios",
  "Ausencia sin justificación",
  "Ausencia con justificación",
  "Otros tipos de permisos",
];

const normalizeArrayResponse = (response, keys = []) => {
  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
  }

  return [];
};

const getOptionId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;

  return value?._id || value?.id || value?.value || null;
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
  return employee?.img || employee?.image || fallbackAvatar;
};

const toISO = (qDateString) => {
  return String(qDateString || "").replace(/\//g, "-");
};

const formatShortDate = (qDateString) => {
  const iso = toISO(qDateString);
  return moment(iso, "YYYY-MM-DD").format("DD/MM/YYYY");
};

const buildRangeDates = (start, end) => {
  const startDate = moment(start, "YYYY-MM-DD", true);
  const endDate = moment(end, "YYYY-MM-DD", true);

  if (!startDate.isValid() || !endDate.isValid()) return [];

  const dates = [];
  const current = startDate.clone();

  while (current.isSameOrBefore(endDate, "day")) {
    dates.push(current.format("YYYY-MM-DD"));
    current.add(1, "day");
  }

  return dates;
};

const minutesPerDay = computed(() => {
  const hours = Number(state.value.hours);

  if (!Number.isFinite(hours) || hours < 0) return 0;

  return Math.round(hours * 60);
});

const uniqueExpectedMinutesSelected = computed(() => {
  const map = state.value.expectedByDate || {};
  const set = new Set();

  for (const qDate of state.value.selectedDates) {
    const iso = toISO(qDate);
    const expected = map[iso]?.expectedMinutes;

    if (Number.isFinite(expected)) {
      set.add(expected);
    }
  }

  return Array.from(set).sort((a, b) => a - b);
});

const expectedHoursLabel = computed(() => {
  if (!state.value.user) return "—";
  if (!state.value.selectedDates.length) return "Selecciona días";

  const values = uniqueExpectedMinutesSelected.value;

  if (!values.length) return "—";

  if (values.length === 1) {
    const hours = (values[0] / 60).toFixed(2).replace(/\.00$/, "");
    return `${hours} h`;
  }

  const examples = values.slice(0, 3).map((minutes) => {
    return `${(minutes / 60).toFixed(2).replace(/\.00$/, "")}h`;
  });

  return `Varía (${examples.join(", ")}${values.length > 3 ? ", ..." : ""})`;
});

const canSetFullDay = computed(() => {
  return Boolean(state.value.user) && uniqueExpectedMinutesSelected.value.length > 0;
});

const chipExpectedLabel = (qDateString) => {
  const iso = toISO(qDateString);
  const expected = state.value.expectedByDate?.[iso]?.expectedMinutes;

  if (!Number.isFinite(expected)) return "sin horario";

  const hours = (expected / 60).toFixed(2).replace(/\.00$/, "");

  return `${hours}h`;
};

const classificationIcon = (value) => {
  const text = String(value || "").toLowerCase();

  if (text.includes("trabajo")) return "work_history";
  if (text.includes("vacaciones")) return "beach_access";
  if (text.includes("médica") || text.includes("enfermedad")) return "medical_services";
  if (text.includes("sin justificación")) return "event_busy";
  if (text.includes("ausencia")) return "event_busy";
  if (text.includes("permiso")) return "assignment_turned_in";
  if (text.includes("licencia")) return "fact_check";

  return "label";
};

const classificationColor = (value) => {
  const text = String(value || "").toLowerCase();

  if (text.includes("trabajo")) return "primary";
  if (text.includes("vacaciones")) return "teal";
  if (text.includes("médica") || text.includes("enfermedad")) return "deep-purple";
  if (text.includes("sin justificación")) return "negative";
  if (text.includes("ausencia")) return "orange";
  if (text.includes("permiso")) return "positive";
  if (text.includes("licencia")) return "indigo";

  return "grey-7";
};

const isDateSelectable = (dateString) => {
  const date = toISO(dateString);
  const start = props.filtros.fechaInicio;
  const end = props.filtros.fechaFin || props.filtros.fechaInicio;

  if (!start) return false;
  if (moment(date).isBefore(start, "day")) return false;
  if (moment(date).isAfter(end, "day")) return false;

  const userId = state.value.user?._id;

  if (userId && props.workSummaryDatesByUser[userId]) {
    if (props.workSummaryDatesByUser[userId].has(date)) return false;
  }

  const expected = state.value.expectedByDate?.[date];

  if (expected && expected.isActive === false) return false;

  return true;
};

const clearDownstreamFilters = (level) => {
  if (level === "company") {
    filters.value.department = null;
    filters.value.jobPosition = null;
    filters.value.project = null;

    departments.value = [];
    departmentsOriginal.value = [];
    jobPositions.value = [];
    jobPositionsOriginal.value = [];
    projects.value = [];
    projectsOriginal.value = [];
  }

  if (level === "department") {
    filters.value.jobPosition = null;
    filters.value.project = null;

    jobPositions.value = [];
    jobPositionsOriginal.value = [];
    projects.value = [];
    projectsOriginal.value = [];
  }

  if (level === "jobPosition") {
    filters.value.project = null;

    projects.value = [];
    projectsOriginal.value = [];
  }

  state.value.user = null;
  employeeOptions.value = [];
  employeeOptionsOriginal.value = [];
  resetDaySelection();
};

const resetDaySelection = () => {
  state.value.selectedDates = [];
  state.value.expectedByDate = {};
  state.value.ignoredInactiveDates = [];
  state.value.hours = null;
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

const getEmployees = async (searchText = "") => {
  const query = new URLSearchParams();

  query.set("isActived", "true");
  query.set("limit", "20");
  query.set("initial", "0");

  if (searchText && String(searchText).trim()) {
    query.set("text", String(searchText).trim());
  }

  if (filters.value.company) {
    query.set("company", filters.value.company);
  }

  if (filters.value.department) {
    query.set("department", filters.value.department);
  }

  if (filters.value.jobPosition) {
    query.set("jobPosition", filters.value.jobPosition);
  }

  if (filters.value.project) {
    query.set("project", filters.value.project);
  }

  const response = await methodsHttp.getApi(`user/getEmployees?${query.toString()}`);

  const rows = response?.ok
    ? normalizeArrayResponse(response, ["employees", "users", "data", "items"])
    : [];

  employeeOptions.value = rows;
  employeeOptionsOriginal.value = rows;

  return rows;
};

const onCompanyChange = async (companyId) => {
  clearDownstreamFilters("company");

  if (!companyId) return;

  await loadDepartments(companyId);
  await getEmployees("");
};

const onDepartmentChange = async (departmentId) => {
  clearDownstreamFilters("department");

  if (!departmentId) {
    await getEmployees("");
    return;
  }

  await loadJobPositions(departmentId);
  await getEmployees("");
};

const onJobPositionChange = async (jobPositionId) => {
  clearDownstreamFilters("jobPosition");

  if (!jobPositionId) {
    await getEmployees("");
    return;
  }

  await loadProjects(jobPositionId);
  await getEmployees("");
};

const onProjectChange = async () => {
  state.value.user = null;
  employeeOptions.value = [];
  employeeOptionsOriginal.value = [];
  resetDaySelection();

  await getEmployees("");
};

const onUserSelected = async (user) => {
  resetDaySelection();

  if (user?._id) {
    await fetchExpectedForRange();
  }
};

const filterCompanies = (value, update) => {
  update(() => {
    if (!value) {
      companies.value = companiesOriginal.value;
      return;
    }

    const needle = String(value).toLowerCase();

    companies.value = companiesOriginal.value.filter((item) => {
      return companyOptionLabel(item).toLowerCase().includes(needle);
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

    departments.value = departmentsOriginal.value.filter((item) => {
      return String(item?.name || item?.code || "").toLowerCase().includes(needle);
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

    jobPositions.value = jobPositionsOriginal.value.filter((item) => {
      return String(item?.name || item?.code || "").toLowerCase().includes(needle);
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

    projects.value = projectsOriginal.value.filter((item) => {
      return String(item?.name || item?.code || "").toLowerCase().includes(needle);
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

const setZeroHours = () => {
  state.value.hours = 0;
};

const setFullDayHours = () => {
  const firstDate = state.value.selectedDates?.[0];

  if (!firstDate) return;

  const iso = toISO(firstDate);
  const expected = state.value.expectedByDate?.[iso]?.expectedMinutes;

  if (Number.isFinite(expected) && expected > 0) {
    state.value.hours = Number((expected / 60).toFixed(2));
    return;
  }

  state.value.hours = 8;
};

const fetchExpectedForRange = async () => {
  try {
    state.value.expectedByDate = {};
    state.value.ignoredInactiveDates = [];

    const userId = state.value.user?._id;

    if (!userId) return;

    const start = props.filtros.fechaInicio;
    const end = props.filtros.fechaFin || props.filtros.fechaInicio;

    if (!start || !end) return;

    const dates = buildRangeDates(start, end);

    const response = await methodsHttp.postApi("punch/getExpectedMinutesForDates", {
      userId,
      dates,
    });

    if (response?.ok) {
      state.value.expectedByDate = response.expectedByDate || {};

      const filtered = (state.value.selectedDates || []).filter(isDateSelectable);

      const removed = (state.value.selectedDates || []).filter((date) => {
        return !filtered.includes(date);
      });

      if (removed.length) {
        state.value.ignoredInactiveDates = removed;
      }

      state.value.selectedDates = filtered;

      if (state.value.hours === null || state.value.hours === undefined) {
        const startExpected = state.value.expectedByDate?.[start]?.expectedMinutes;

        if (Number.isFinite(startExpected) && startExpected > 0) {
          state.value.hours = Number((startExpected / 60).toFixed(2));
        } else {
          state.value.hours = 8;
        }
      }
    }
  } catch (error) {
    console.error("fetchExpectedForRange error:", error);
  }
};

const hydrateFiltersFromDefaultUser = async () => {
  const defaultUser = props.defaultUser;

  if (!defaultUser?._id) return;

  const companyId = getOptionId(defaultUser.company || defaultUser.companyId);
  const departmentId = getOptionId(defaultUser.department || defaultUser.departmentId);
  const jobPositionId = getOptionId(defaultUser.jobPosition || defaultUser.jobPositionId);
  const projectId = getOptionId(defaultUser.project || defaultUser.projectId);

  if (companyId) {
    filters.value.company = companyId;
    await loadDepartments(companyId);
  }

  if (departmentId) {
    filters.value.department = departmentId;
    await loadJobPositions(departmentId);
  }

  if (jobPositionId) {
    filters.value.jobPosition = jobPositionId;
    await loadProjects(jobPositionId);
  }

  if (projectId) {
    filters.value.project = projectId;
  }

  state.value.user = defaultUser;
  employeeOptions.value = [defaultUser];
  employeeOptionsOriginal.value = [defaultUser];

  await fetchExpectedForRange();
};

const resetDialog = async () => {
  state.value.loading = false;
  state.value.user = null;
  state.value.selectedDates = [];
  state.value.classification = null;
  state.value.hours = null;
  state.value.expectedByDate = {};
  state.value.ignoredInactiveDates = [];

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

  employeeOptions.value = Array.isArray(props.users) ? props.users.slice(0, 20) : [];
  employeeOptionsOriginal.value = employeeOptions.value;

  await loadCompanies();

  if (props.defaultUser?._id) {
    await hydrateFiltersFromDefaultUser();
    return;
  }

  if (employeeOptions.value.length) {
    employeeOptionsOriginal.value = employeeOptions.value;
  }
};

watch(
  () => open.value,
  async (value) => {
    if (value) {
      await resetDialog();
    }
  },
);

watch(
  () => [props.filtros.fechaInicio, props.filtros.fechaFin],
  async () => {
    if (open.value && state.value.user?._id) {
      resetDaySelection();
      await fetchExpectedForRange();
    }
  },
);

const saveNewDay = async () => {
  try {
    if (!state.value.user?._id) {
      $q.notify({
        type: "warning",
        message: "Selecciona un empleado.",
      });

      return;
    }

    if (!state.value.classification) {
      $q.notify({
        type: "warning",
        message: "Selecciona una clasificación del día.",
      });

      return;
    }

    if (state.value.hours === null || state.value.hours === undefined) {
      $q.notify({
        type: "warning",
        message: "Indica las horas. Usa 0 para descontar todo.",
      });

      return;
    }

    const hours = Number(state.value.hours);

    if (!Number.isFinite(hours) || hours < 0) {
      $q.notify({
        type: "warning",
        message: "Las horas deben ser 0 o mayor.",
      });

      return;
    }

    if (!state.value.selectedDates.length) {
      $q.notify({
        type: "warning",
        message: "Selecciona al menos un día en el calendario.",
      });

      return;
    }

    state.value.loading = true;

    const dates = state.value.selectedDates.map((date) => toISO(date));

    const payload = {
      userId: state.value.user._id,
      dates,
      classification: state.value.classification,
      minutes: Math.round(hours * 60),
      fechaInicio: props.filtros.fechaInicio,
      fechaFin: props.filtros.fechaFin || props.filtros.fechaInicio,
    };

    const response = await methodsHttp.postApi("punch/addSpecialDays", payload);

    if (response?.ok) {
      const created = Number(response.created || 0);

      if (created === 0) {
        $q.notify({
          type: "warning",
          message:
            response.mensaje ||
            "No se creó ningún día. Es posible que ya existan registros para esas fechas.",
        });

        return;
      }

      $q.notify({
        type: "positive",
        message: `Se registraron ${created} día(s) correctamente.`,
      });

      open.value = false;
      emit("saved");

      return;
    }

    $q.notify({
      type: "negative",
      message:
        response?.mensaje ||
        "No se pudieron registrar los días. Inténtalo nuevamente.",
    });
  } catch (error) {
    console.error("saveNewDay error:", error);

    $q.notify({
      type: "negative",
      message: "Error al registrar los días.",
    });
  } finally {
    state.value.loading = false;
  }
};
</script>

<style scoped>
.add-day-dialog-card {
  width: 980px;
  max-width: 96vw;
  max-height: 94vh;
  border-radius: 22px;
  overflow: hidden;
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

.close-btn {
  width: 34px;
  height: 34px;
  min-height: 34px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.dialog-body {
  max-height: calc(94vh - 146px);
  overflow-y: auto;
  padding: 18px;
}

.info-banner {
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

.filters-panel,
.day-panel,
.calendar-panel {
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

.quick-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.expected-pill,
.minutes-pill {
  min-height: 34px;
  padding: 7px 10px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 800;
}

.expected-pill b,
.minutes-pill b {
  color: #0f172a;
}

.quick-btn {
  min-height: 36px;
  border-radius: 12px;
  font-weight: 800;
}

.selected-count-badge {
  min-height: 30px;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
}

.calendar-wrap {
  display: flex;
  justify-content: center;
  padding: 12px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.modern-calendar {
  box-shadow: none;
  border-radius: 18px;
}

.selected-dates {
  padding: 12px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px dashed rgba(15, 23, 42, 0.14);
}

.date-chip {
  border-radius: 999px;
  margin-right: 6px;
  margin-bottom: 6px;
  font-weight: 800;
}

.date-chip-extra {
  opacity: 0.82;
  font-size: 0.72rem;
}

.ignored-banner {
  border-radius: 16px;
  background: rgba(251, 140, 0, 0.1);
  color: #8a4b00;
  border: 1px solid rgba(251, 140, 0, 0.18);
}

.dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
}

.cancel-btn,
.save-btn {
  min-height: 40px;
  border-radius: 12px;
  font-weight: 800;
}

@media (max-width: 768px) {
  .add-day-dialog-card {
    width: 96vw;
    max-height: 96vh;
    border-radius: 22px;
  }

  .dialog-body {
    max-height: calc(96vh - 146px);
    padding: 14px;
  }

  .quick-actions {
    align-items: stretch;
  }

  .expected-pill,
  .minutes-pill,
  .quick-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 599px) {
  .add-day-dialog-card {
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

  .calendar-wrap {
    padding: 6px;
  }
}
</style>