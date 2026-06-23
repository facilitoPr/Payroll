<template>
  <q-dialog v-model="open" persistent>
    <q-card class="earnings-dialog-card">
      <div class="dialog-header bg-primary row items-center justify-between">
        <div class="row items-start justify-between q-col-gutter-md header-content">
          <div class="header-title text-white">
            <div class="header-icon">
              <q-icon name="paid" size="24px" />
            </div>

            <div>
              <div class="text-h6 text-weight-bold">
                Incentivos del período
              </div>

              <div class="text-caption">
                Agrega un incentivo o ingreso extra a uno o varios empleados.
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
        <div class="period-banner q-mb-md">
          <q-icon name="date_range" color="primary" size="20px" />

          <div>
            <div class="text-weight-bold">Período seleccionado</div>
            <div class="text-caption text-grey-7">
              {{ periodStart || "Sin fecha" }}
              <span v-if="periodEnd"> → {{ periodEnd }}</span>
            </div>
          </div>

          <q-space />

          <q-badge color="primary" class="period-badge">
            {{ state.selectedEmployees.length }} empleado{{
              state.selectedEmployees.length === 1 ? "" : "s"
            }}
          </q-badge>
        </div>

        <q-card flat bordered class="selector-panel">
          <q-card-section class="q-pa-md">
            <div class="section-title">
              <q-icon name="manage_search" color="primary" size="19px" />
              Buscar empleados
            </div>

            <div class="section-subtitle">
              Filtra por empresa, departamento, puesto, proyecto o escribe el
              nombre/correo del empleado. Solo se cargan resultados limitados.
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
                        <q-item-label caption v-if="scope.opt?.taxId || scope.opt?.rnc">
                          {{ scope.opt.taxId || scope.opt.rnc }}
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
                  label="Buscar y seleccionar empleados"
                  class="rounded-input employee-select"
                  :loading="employeeSearchLoading"
                  @filter="filterEmployees"
                >
                  <template #prepend>
                    <q-icon name="person_search" color="primary" />
                  </template>

                  <template #hint>
                    Escribe al menos 2 letras o usa los filtros para cargar empleados.
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
                    <q-chip
                      removable
                      dense
                      color="primary"
                      text-color="white"
                      @remove="scope.removeAtIndex(scope.index)"
                    >
                      {{ scope.opt?.name || "Empleado" }}
                    </q-chip>
                  </template>

                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        No se encontraron empleados.
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>

                <div class="selector-actions q-mt-sm">
                  <q-btn
                    outline
                    no-caps
                    dense
                    color="primary"
                    icon="playlist_add_check"
                    label="Agregar resultados visibles"
                    class="small-action"
                    :disable="!employeeOptions.length"
                    @click="addVisibleEmployees"
                  />

                  <q-btn
                    flat
                    no-caps
                    dense
                    color="negative"
                    icon="delete_sweep"
                    label="Limpiar selección"
                    class="small-action"
                    :disable="!state.selectedEmployees.length"
                    @click="clearSelectedEmployees"
                  />

                  <q-space />

                  <div class="text-caption text-grey-7">
                    Mostrando {{ employeeOptions.length }} resultado(s)
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="earning-panel q-mt-md">
          <q-card-section class="q-pa-md">
            <div class="section-title">
              <q-icon name="add_card" color="primary" size="19px" />
              Datos del incentivo
            </div>

            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12 col-md-5">
                <q-select
                  v-model="state.form.earningTypeId"
                  :options="state.typesOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  outlined
                  dense
                  label="Tipo de ingreso"
                  class="rounded-input"
                  :loading="state.loadingTypes"
                >
                  <template #prepend>
                    <q-icon name="category" color="primary" />
                  </template>

                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-avatar color="warning" text-color="dark">
                          <q-icon name="paid" />
                        </q-avatar>
                      </q-item-section>

                      <q-item-section>
                        <q-item-label class="text-weight-bold">
                          {{ scope.opt.label }}
                        </q-item-label>
                        <q-item-label caption>
                          {{ scope.opt.caption || "Ingreso extra" }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  v-model.number="state.form.amountPeriod"
                  type="number"
                  outlined
                  dense
                  min="0"
                  step="0.01"
                  label="Monto del período"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="payments" color="primary" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <div class="amount-preview">
                  <div>
                    <div class="amount-label">Total a agregar</div>
                    <div class="amount-value">
                      {{ money(totalToApply) }}
                    </div>
                  </div>

                  <q-icon name="calculate" color="primary" size="26px" />
                </div>
              </div>

              <div class="col-12">
                <q-input
                  v-model="state.form.notes"
                  type="textarea"
                  outlined
                  dense
                  autogrow
                  label="Notas"
                  placeholder="Ej: incentivo por productividad, bono especial, comisión..."
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="edit_note" color="primary" />
                  </template>
                </q-input>
              </div>
            </div>

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn
                outline
                no-caps
                color="primary"
                icon="refresh"
                label="Refrescar"
                class="action-btn"
                :loading="state.loading"
                @click="loadEarningsEntries"
              />

              <q-btn
                unelevated
                no-caps
                color="primary"
                icon="save"
                label="Guardar incentivo"
                class="action-btn"
                :loading="state.loading"
                :disable="!canSave"
                @click="saveEarningBatch"
              />
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="entries-panel q-mt-md">
          <q-card-section class="q-pa-md">
            <div class="row items-center justify-between q-col-gutter-md q-mb-sm">
              <div class="col">
                <div class="section-title">
                  <q-icon name="receipt_long" color="primary" size="19px" />
                  Incentivos guardados
                </div>
                <div class="section-subtitle">
                  Se muestran los ingresos no reclamados de este período.
                </div>
              </div>

              <div class="col-auto">
                <q-badge color="primary" class="period-badge">
                  {{ state.entries.length }} registro(s)
                </q-badge>
              </div>
            </div>

            <q-table
              :rows="state.entries"
              :columns="columns"
              row-key="_id"
              flat
              bordered
              :loading="state.loading"
              :pagination="{ rowsPerPage: 10 }"
              class="entries-table"
              no-data-label="No hay incentivos guardados en este período."
            >
              <template #body-cell-user="scope">
                <q-td :props="scope">
                  <div class="row items-center no-wrap">
                    <q-avatar size="30px" class="q-mr-sm">
                      <img :src="employeeAvatar(scope.row?.user)" />
                    </q-avatar>

                    <div>
                      <div class="text-weight-bold">
                        {{ scope.row?.user?.name || "Empleado" }}
                      </div>
                      <div class="text-caption text-grey-7">
                        {{ scope.row?.user?.email || scope.row?.user?.username || "" }}
                      </div>
                    </div>
                  </div>
                </q-td>
              </template>

              <template #body-cell-earningType="scope">
                <q-td :props="scope">
                  <q-badge color="warning" text-color="dark" class="type-badge">
                    {{ scope.row?.earningType?.name || "Ingreso" }}
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-amountPeriod="scope">
                <q-td :props="scope">
                  <b>{{ money(scope.row.amountPeriod) }}</b>
                </q-td>
              </template>

              <template #body-cell-notes="scope">
                <q-td :props="scope">
                  <span class="text-grey-8">
                    {{ scope.row.notes || "—" }}
                  </span>
                </q-td>
              </template>

              <template #body-cell-actions="scope">
                <q-td :props="scope" class="text-right">
                  <q-btn
                    dense
                    round
                    flat
                    icon="delete"
                    color="negative"
                    :disable="scope.row?.isClaimed"
                    @click="deleteEarning(scope.row)"
                  >
                    <q-tooltip>Eliminar incentivo</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          no-caps
          label="Cerrar"
          color="grey-8"
          class="action-btn"
          :disable="state.loading"
          @click="open = false"
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

  <q-dialog v-model="deleteConfirmOpen" persistent>
    <q-card class="delete-confirm-card">
      <div class="confirm-dialog-header bg-primary row items-center justify-between">
        <div class="row items-start justify-between q-col-gutter-md header-content">
          <div class="header-title text-white">
            <div class="header-icon">
              <q-icon name="delete" size="24px" />
            </div>

            <div>
              <div class="text-h6 text-weight-bold">
                Eliminar incentivo
              </div>

              <div class="text-caption">
                Confirma si deseas eliminar este incentivo del período.
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
          @click="closeDeleteDialog"
        >
          <q-tooltip>Cerrar</q-tooltip>
        </q-btn>
      </div>

      <q-card-section class="delete-confirm-body">
        <div class="delete-main-icon">
          <q-icon name="delete_forever" size="34px" />
        </div>

        <div class="delete-confirm-title">
          ¿Deseas eliminar este incentivo?
        </div>

        <div class="delete-confirm-subtitle">
          Esta acción quitará el incentivo del período seleccionado. Si ya fue
          reclamado o usado en nómina, no debería eliminarse.
        </div>

        <div class="delete-summary q-mt-md">
          <div class="delete-summary-row">
            <span>Empleado</span>
            <b>{{ selectedEarningRow?.user?.name || "Empleado" }}</b>
          </div>

          <div class="delete-summary-row">
            <span>Tipo</span>
            <b>{{ selectedEarningRow?.earningType?.name || "Ingreso" }}</b>
          </div>

          <div class="delete-summary-row">
            <span>Monto</span>
            <b>{{ money(selectedEarningRow?.amountPeriod || 0) }}</b>
          </div>
        </div>

        <q-banner dense rounded class="delete-warning q-mt-md">
          <template #avatar>
            <q-icon name="warning" color="negative" />
          </template>

          Esta acción no se puede deshacer desde esta pantalla.
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="delete-confirm-actions">
        <q-btn
          flat
          no-caps
          label="Cancelar"
          color="grey-8"
          class="action-btn"
          :disable="state.loading"
          @click="closeDeleteDialog"
        />

        <q-btn
          unelevated
          no-caps
          icon="delete"
          label="Eliminar"
          color="negative"
          class="action-btn"
          :loading="state.loading"
          @click="confirmDeleteEarning"
        />
      </q-card-actions>

      <q-inner-loading
        :showing="state.loading"
        label="Eliminando..."
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

  initialCompanyId: { type: String, default: "" },
  initialDepartmentId: { type: String, default: "" },
  initialJobPositionId: { type: String, default: "" },
  initialProjectId: { type: String, default: "" },
  initialPaymentScheduleId: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "changed"]);

const fallbackAvatar =
  "https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp";

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const periodStart = computed(() => props.filtros?.fechaInicio || "");
const periodEnd = computed(() => {
  return props.filtros?.fechaFin || props.filtros?.fechaInicio || "";
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

const deleteConfirmOpen = ref(false);
const selectedEarningRow = ref(null);

const state = ref({
  loading: false,
  loadingTypes: false,

  selectedEmployees: [],

  types: [],
  typesOptions: [],

  entries: [],

  form: {
    earningTypeId: null,
    amountPeriod: 0,
    notes: "",
  },
});

const columns = [
  {
    name: "actions",
    label: "",
    field: "actions",
    align: "center",
    style: "width: 52px",
  },
  {
    name: "user",
    label: "Empleado",
    field: "user",
    align: "left",
    sortable: true,
  },
  {
    name: "earningType",
    label: "Tipo",
    field: "earningType",
    align: "left",
    sortable: true,
  },
  {
    name: "amountPeriod",
    label: "Monto",
    field: "amountPeriod",
    align: "left",
    sortable: true,
  },
  {
    name: "notes",
    label: "Notas",
    field: "notes",
    align: "left",
  },
];

const selectedUserIds = computed(() => {
  return (state.value.selectedEmployees || [])
    .map((employee) => employee?._id || employee?.value || employee)
    .filter(Boolean);
});

const totalToApply = computed(() => {
  return (
    Number(state.value.form.amountPeriod || 0) *
    Number(state.value.selectedEmployees.length || 0)
  );
});

const canSave = computed(() => {
  return (
    selectedUserIds.value.length > 0 &&
    Boolean(state.value.form.earningTypeId) &&
    Number(state.value.form.amountPeriod || 0) > 0 &&
    Boolean(periodStart.value) &&
    Boolean(periodEnd.value)
  );
});

const normalizeArrayResponse = (response, keys = []) => {
  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
  }

  return [];
};

const money = (value) => {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const companyOptionLabel = (company) => {
  return (
    company?.legalName ||
    company?.commercialName ||
    company?.tradeName ||
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

const resetEmployeeSelection = () => {
  state.value.selectedEmployees = [];
  employeeOptions.value = [];
  employeeOptionsOriginal.value = [];
};

const addVisibleEmployees = () => {
  const selectedMap = new Map();

  for (const employee of state.value.selectedEmployees || []) {
    const id = String(employee?._id || employee?.value || employee);
    if (id) selectedMap.set(id, employee);
  }

  for (const employee of employeeOptions.value || []) {
    const id = String(employee?._id || employee?.value || employee);
    if (id && !selectedMap.has(id)) {
      selectedMap.set(id, employee);
    }
  }

  state.value.selectedEmployees = Array.from(selectedMap.values());
};

const clearSelectedEmployees = () => {
  state.value.selectedEmployees = [];
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

  if (String(text || "").trim()) {
    query.set("text", String(text || "").trim());
  }

  if (filters.value.company) query.set("company", filters.value.company);
  if (filters.value.department) query.set("department", filters.value.department);
  if (filters.value.jobPosition) query.set("jobPosition", filters.value.jobPosition);
  if (filters.value.project) query.set("project", filters.value.project);

  if (props.initialPaymentScheduleId) {
    query.set("paymentSchedule", props.initialPaymentScheduleId);
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
  filters.value.department = null;
  filters.value.jobPosition = null;
  filters.value.project = null;

  departments.value = [];
  departmentsOriginal.value = [];
  jobPositions.value = [];
  jobPositionsOriginal.value = [];
  projects.value = [];
  projectsOriginal.value = [];

  resetEmployeeSelection();

  if (!companyId) return;

  await loadDepartments(companyId);
  await getEmployees("");
  await loadEarningsEntries();
};

const onDepartmentChange = async (departmentId) => {
  filters.value.jobPosition = null;
  filters.value.project = null;

  jobPositions.value = [];
  jobPositionsOriginal.value = [];
  projects.value = [];
  projectsOriginal.value = [];

  resetEmployeeSelection();

  if (!departmentId) {
    await getEmployees("");
    await loadEarningsEntries();
    return;
  }

  await loadJobPositions(departmentId);
  await getEmployees("");
  await loadEarningsEntries();
};

const onJobPositionChange = async (jobPositionId) => {
  filters.value.project = null;

  projects.value = [];
  projectsOriginal.value = [];

  resetEmployeeSelection();

  if (!jobPositionId) {
    await getEmployees("");
    await loadEarningsEntries();
    return;
  }

  await loadProjects(jobPositionId);
  await getEmployees("");
  await loadEarningsEntries();
};

const onProjectChange = async () => {
  resetEmployeeSelection();
  await getEmployees("");
  await loadEarningsEntries();
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

const loadEarningTypes = async () => {
  state.value.loadingTypes = true;

  try {
    const response = await methodsHttp.getApi("payroll/earning-types");

    if (response?.ok) {
      const types = response.types || [];

      state.value.types = types;
      state.value.typesOptions = types.map((type) => ({
        label: type.name,
        value: type._id,
        caption: type.code || type.description || "",
      }));
    }
  } finally {
    state.value.loadingTypes = false;
  }
};

const buildEntriesQuery = () => {
  const query = new URLSearchParams();

  query.set("periodStart", periodStart.value);
  query.set("periodEnd", periodEnd.value);

  if (filters.value.company) query.set("companyId", filters.value.company);
  if (filters.value.department) query.set("departmentId", filters.value.department);
  if (filters.value.jobPosition) query.set("jobPositionId", filters.value.jobPosition);
  if (filters.value.project) query.set("projectId", filters.value.project);
  if (props.initialPaymentScheduleId) {
    query.set("paymentScheduleId", props.initialPaymentScheduleId);
  }

  return query.toString();
};

const loadEarningsEntries = async () => {
  if (!periodStart.value || !periodEnd.value) return;

  state.value.loading = true;

  try {
    const response = await methodsHttp.getApi(
      `payroll/earnings?${buildEntriesQuery()}`,
    );

    state.value.entries = response?.ok && Array.isArray(response.entries)
      ? response.entries
      : [];
  } finally {
    state.value.loading = false;
  }
};

const saveEarningBatch = async () => {
  try {
    if (!selectedUserIds.value.length) {
      $q.notify({
        type: "warning",
        message: "Selecciona al menos un empleado.",
      });
      return;
    }

    if (!state.value.form.earningTypeId) {
      $q.notify({
        type: "warning",
        message: "Selecciona un tipo de ingreso.",
      });
      return;
    }

    if (Number(state.value.form.amountPeriod || 0) <= 0) {
      $q.notify({
        type: "warning",
        message: "El monto debe ser mayor que 0.",
      });
      return;
    }

    state.value.loading = true;

    const items = selectedUserIds.value.map((userId) => ({
      userId,
      earningTypeId: state.value.form.earningTypeId,
      amountPeriod: Number(state.value.form.amountPeriod || 0),
      notes: state.value.form.notes || "",
    }));

    const response = await methodsHttp.postApi("payroll/earnings/upsert-batch", {
      periodStart: periodStart.value,
      periodEnd: periodEnd.value,
      items,
    });

    if (response?.ok) {
      const errors = Array.isArray(response.errors) ? response.errors : [];

      $q.notify({
        type: errors.length ? "warning" : "positive",
        message: errors.length
          ? `Guardados: ${response.upserted || 0}. Con errores: ${errors.length}.`
          : "Incentivos guardados correctamente.",
      });

      state.value.form.amountPeriod = 0;
      state.value.form.notes = "";
      state.value.selectedEmployees = [];

      await loadEarningsEntries();

      emit("changed");
      return;
    }

    $q.notify({
      type: "negative",
      message: response?.mensaje || "No se pudo guardar el incentivo.",
    });
  } catch (error) {
    console.error("saveEarningBatch error:", error);

    $q.notify({
      type: "negative",
      message: "Error guardando incentivos.",
    });
  } finally {
    state.value.loading = false;
  }
};

const deleteEarning = (row) => {
  if (!row?._id) return;

  selectedEarningRow.value = row;
  deleteConfirmOpen.value = true;
};

const closeDeleteDialog = () => {
  if (state.value.loading) return;

  deleteConfirmOpen.value = false;
  selectedEarningRow.value = null;
};

const confirmDeleteEarning = async () => {
  if (!selectedEarningRow.value?._id) return;

  state.value.loading = true;

  try {
    const response = await methodsHttp.deleteApi(
      `payroll/earnings/${selectedEarningRow.value._id}`,
    );

    if (response?.ok) {
      $q.notify({
        type: "positive",
        message: "Incentivo eliminado.",
      });

      deleteConfirmOpen.value = false;
      selectedEarningRow.value = null;

      await loadEarningsEntries();
      emit("changed");
      return;
    }

    $q.notify({
      type: "negative",
      message: response?.mensaje || "No se pudo eliminar.",
    });
  } catch (error) {
    console.error("confirmDeleteEarning error:", error);

    $q.notify({
      type: "negative",
      message: "Error eliminando incentivo.",
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
};

const resetDialog = async () => {
  state.value.loading = false;
  state.value.loadingTypes = false;
  state.value.selectedEmployees = [];
  state.value.entries = [];

  state.value.form = {
    earningTypeId: null,
    amountPeriod: 0,
    notes: "",
  };

  deleteConfirmOpen.value = false;
  selectedEarningRow.value = null;

  filters.value.company = null;
  filters.value.department = null;
  filters.value.jobPosition = null;
  filters.value.project = null;

  companies.value = [];
  companiesOriginal.value = [];
  departments.value = [];
  departmentsOriginal.value = [];
  jobPositions.value = [];
  jobPositionsOriginal.value = [];
  projects.value = [];
  projectsOriginal.value = [];
  employeeOptions.value = [];
  employeeOptionsOriginal.value = [];

  await loadCompanies();
  await hydrateInitialFilters();

  if (filters.value.company) {
    await getEmployees("");
  }

  await Promise.all([loadEarningTypes(), loadEarningsEntries()]);
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
.earnings-dialog-card {
  width: 1080px;
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

.period-banner {
  padding: 12px;
  border-radius: 16px;
  background: rgba(23, 141, 210, 0.06);
  border: 1px solid rgba(23, 141, 210, 0.12);
  color: #475569;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 0.82rem;
  font-weight: 600;
}

.period-badge {
  min-height: 30px;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
}

.selector-panel,
.earning-panel,
.entries-panel {
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

.selector-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.small-action,
.action-btn {
  min-height: 38px;
  border-radius: 12px;
  font-weight: 800;
}

.amount-preview {
  min-height: 40px;
  padding: 9px 12px;
  border-radius: 16px;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent 34%),
    #ffffff;
  border: 1px solid rgba(245, 158, 11, 0.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.amount-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.amount-value {
  margin-top: 2px;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.entries-table {
  border-radius: 18px;
  overflow: hidden;
  border-color: rgba(15, 23, 42, 0.08);
}

.entries-table :deep(thead tr) {
  background: #f8fafc;
}

.entries-table :deep(th) {
  color: #475569;
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.type-badge {
  border-radius: 999px;
  font-weight: 900;
}

.dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
}

/* Dialog de confirmación */
.delete-confirm-card {
  width: 520px;
  max-width: 94vw;
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
}

.confirm-dialog-header {
  min-height: 78px;
  padding: 16px 20px;
}

.delete-confirm-body {
  padding: 22px;
}

.delete-main-icon {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  color: #c10015;
  background: rgba(193, 0, 21, 0.08);
  border: 1px solid rgba(193, 0, 21, 0.12);
  margin-bottom: 14px;
}

.delete-confirm-title {
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 900;
}

.delete-confirm-subtitle {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.45;
}

.delete-summary {
  padding: 12px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.delete-summary-row {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.delete-summary-row + .delete-summary-row {
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.delete-summary-row span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.delete-summary-row b {
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 900;
  text-align: right;
}

.delete-warning {
  padding: 11px;
  border-radius: 16px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.14);
  color: #7f1d1d;
  font-size: 0.8rem;
  font-weight: 700;
}

.delete-confirm-actions {
  padding: 14px 18px;
  background: #ffffff;
}

@media (max-width: 768px) {
  .earnings-dialog-card {
    width: 96vw;
    max-height: 96vh;
    border-radius: 22px;
  }

  .dialog-body {
    max-height: calc(96vh - 146px);
    padding: 14px;
  }

  .selector-actions {
    align-items: stretch;
  }

  .small-action {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 599px) {
  .earnings-dialog-card {
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

  .action-btn {
    width: 100%;
  }

  .delete-confirm-card {
    width: 96vw;
    border-radius: 22px;
  }

  .delete-confirm-actions .action-btn {
    width: 100%;
  }

  .delete-summary-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
    padding: 8px 0;
  }

  .delete-summary-row b {
    text-align: left;
  }
}
</style>