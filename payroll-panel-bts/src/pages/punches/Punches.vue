<template>
  <div class="bg-white q-px-md q-pb-lg">
    <PageHeaderCard
      title="Ponches"
      subtitle="Filtra por fechas y revisa el detalle de ponches por día."
      icon="fingerprint"
    >
      <template #actions>
        <!-- Fecha inicio -->
        <div class="col-12 col-sm-6 col-md-2">
          <q-input
            class="header-field"
            v-model="filters.startDate"
            label="Fecha inicio (requerido)"
            type="date"
            outlined
            dense
            @update:model-value="scheduleReload"
          />
        </div>

        <!-- Fecha fin -->
        <div class="col-12 col-sm-6 col-md-2">
          <q-input
            class="header-field"
            v-model="filters.endDate"
            label="Fecha fin (opcional)"
            type="date"
            outlined
            dense
            @update:model-value="scheduleReload"
          />
        </div>

        <!-- Empleado -->
        <div class="col-12 col-md-4">
          <q-select
            class="header-search"
            v-model="employeeSelected"
            :options="employeesOptions"
            option-label="name"
            outlined
            dense
            use-input
            fill-input
            hide-selected
            clearable
            label="Empleado (opcional)"
            popup-content-class="q-pa-none"
            @filter="filterEmployees"
            @update:model-value="scheduleReload"
          />
        </div>

        <!-- Departamento -->
        <div class="col-12 col-md-4" v-if="canSeeDepartment">
          <q-select
            class="header-search"
            v-model="departmentSelected"
            :options="departmentsOptions"
            option-label="name"
            outlined
            dense
            use-input
            fill-input
            hide-selected
            clearable
            label="Departamento (opcional)"
            popup-content-class="q-pa-none"
            @filter="filterDepartments"
            @update:model-value="scheduleReload"
          />
        </div>

        <!-- Proyecto -->
        <div class="col-12 col-md-4">
          <q-select
            class="header-field"
            v-model="projectSelected"
            :options="projectsOptions"
            option-label="name"
            outlined
            dense
            use-input
            fill-input
            hide-selected
            clearable
            label="Proyectos (opcional)"
            popup-content-class="q-pa-none"
            @filter="filterProjects"
            @update:model-value="scheduleReload"
          />
        </div>

        <!-- Descargar Cartas MT (ZIP) -->
        <div class="col-12 col-md-auto">
          <q-btn
            class="header-btn"
            color="primary"
            unelevated
            icon="file_download"
            label="Cartas tardanza (MT)"
            :loading="exportLoading"
            :disable="!filters.startDate || exportLoading || isLoading"
            @click="downloadLateLettersZip"
          >
            <q-tooltip>
              Genera un ZIP con 1 carta por hora de entrada (08:00, 09:00, etc.)
            </q-tooltip>
          </q-btn>
        </div>
      </template>
    </PageHeaderCard>

    <PunchesList
      :employees-report="employeesReport"
      :filtros="filtrosCompat"
      :loading="isLoading"
      @open-details="openPunchDayDetails"
    />

    <q-inner-loading :showing="isLoading">
      <q-spinner size="50px" />
    </q-inner-loading>

    <PunchDetailsDialog
      v-model="detailsDialog.open"
      :date-string="detailsDialog.dateString"
      :user="detailsDialog.user"
      :work-summary="detailsDialog.workSummary"
      :classification="detailsDialog.classification"
      :descuentoTotal="detailsDialog.discountTotal"
      @update="fetchPunchesSummary"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import moment from "moment";
import "moment/dist/locale/es";
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";

import PageHeaderCard from "src/components/PageHeaderCard.vue";
import PunchesList from "src/components/punches/PunchesList.vue";
import PunchDetailsDialog from "src/components/reports/payroll/PunchDetailsDialog.vue";
import { useQuasar } from "quasar";

moment.locale("es");

const auth = authStore();
const $q = useQuasar();

const isLoading = ref(false);
const days = ref([]);
const employeesReport = ref([]);
const exportLoading = ref(false);

const filters = ref({
  startDate: moment().format("YYYY-MM-DD"), // ✅ HOY por default
  endDate: "",
});

// Selections
const employeeSelected = ref(null);
const departmentSelected = ref(null);
const projectSelected = ref(null);

// Options + backups
const employeesAll = ref([]);
const employeesOptions = ref([]);

const departmentsAll = ref([]);
const departmentsOptions = ref([]);

const projectsAll = ref([]);
const projectsOptions = ref([]);

const detailsDialog = ref({
  open: false,
  dateString: "",
  user: {},
  classification: "",
  workSummary: null,
  discountTotal: 0, // será 0 (porque backend ya no calcula)
});

const canSeeDepartment = computed(() => {
  const dep = auth?.user?.department?.code;
  const role = auth?.user?.rol?.code;
  return dep === "RRHH" || role === "ADMIN" || role === "SUPERADMIN";
});

const filtrosCompat = computed(() => ({
  fechaInicio: filters.value.startDate,
  fechaFin: filters.value.endDate,
}));

let reloadTimer = null;
function scheduleReload() {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    fetchPunchesSummary();
  }, 250);
}

async function fetchPunchesSummary() {
  try {
    if (!filters.value.startDate) return;

    isLoading.value = true;

    const body = {
      fechaInicio: filters.value.startDate,
    };

    if (filters.value.endDate) body.fechaFin = filters.value.endDate;
    if (employeeSelected.value?._id) body.userId = employeeSelected.value._id;
    if (departmentSelected.value?._id)
      body.departmentId = departmentSelected.value._id;
    if (projectSelected.value?._id) body.projectId = projectSelected.value._id;

    const resp = await methodsHttp.postApi("punch/getPunches", body);

    if (resp?.ok) {
      employeesReport.value = Array.isArray(resp.employees)
        ? resp.employees
        : [];
      days.value = employeesReport.value.flatMap((emp) => emp.dias || []);
    } else {
      employeesReport.value = [];
      days.value = [];
    }
  } finally {
    isLoading.value = false;
  }
}

// Catalogs
async function getEmployees() {
  const resp = await methodsHttp.getApi("user/getEmployees?isActived=true");
  if (resp?.ok) {
    employeesAll.value = resp.employees || [];
    employeesOptions.value = resp.employees || [];
  }
}

async function getDepartments() {
  const resp = await methodsHttp.getApi("department/getDepartment");
  if (resp?.ok) {
    departmentsAll.value = resp.department || [];
    departmentsOptions.value = resp.department || [];
  }
}

async function getProjects() {
  const resp = await methodsHttp.getApi("project/getProject");
  if (resp?.ok) {
    projectsAll.value = resp.project || [];
    projectsOptions.value = resp.project || [];
  }
}

// Quasar filters
function filterEmployees(val, update) {
  update(() => {
    if (!val) return (employeesOptions.value = employeesAll.value);
    const needle = val.toLowerCase();
    employeesOptions.value = employeesAll.value.filter((v) =>
      String(v?.name || "")
        .toLowerCase()
        .includes(needle),
    );
  });
}

function filterDepartments(val, update) {
  update(() => {
    if (!val) return (departmentsOptions.value = departmentsAll.value);
    const needle = val.toLowerCase();
    departmentsOptions.value = departmentsAll.value.filter((v) =>
      String(v?.name || "")
        .toLowerCase()
        .includes(needle),
    );
  });
}

function filterProjects(val, update) {
  update(() => {
    if (!val) return (projectsOptions.value = projectsAll.value);
    const needle = val.toLowerCase();
    projectsOptions.value = projectsAll.value.filter((v) =>
      String(v?.name || "")
        .toLowerCase()
        .includes(needle),
    );
  });
}

// UI
function openPunchDayDetails(dayRow) {
  console.log(dayRow)
  detailsDialog.value.open = true;
  detailsDialog.value.dateString = dayRow?.dateString || "";
  detailsDialog.value.user = dayRow?.empleado || {};
  detailsDialog.value.classification = dayRow?.classification || "";
  detailsDialog.value.workSummary = dayRow?.workSummary || null;
  detailsDialog.value.discountTotal = Number(dayRow?.descuentoTotal || 0);
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

async function downloadLateLettersZip() {
  try {
    if (!filters.value.startDate) return;

    exportLoading.value = true;

    const body = {
      fechaInicio: filters.value.startDate,
    };

    if (filters.value.endDate) body.fechaFin = filters.value.endDate;
    if (employeeSelected.value?._id) body.userId = employeeSelected.value._id;
    if (departmentSelected.value?._id) body.departmentId = departmentSelected.value._id;
    if (projectSelected.value?._id) body.projectId = projectSelected.value._id;

    // Opciones (te las dejo listas para futuro)
    body.graceMinutes = 10;
    body.letterDateStrategy = "useEndDate"; // useEndDate | useFirstLateDay | useIssueDate
    body.includeEvidence = false; // luego lo prendes

    // Datos empresa (si quieres, luego lo sacas de DB/settings)
    body.cityLine = "Santo Domingo, D. N.";
    body.rnc = "";
    body.address = "";
    body.signerName = "";
    body.signerRole = "";

    // ✅ IMPORTANTE: necesitas un POST que devuelva Blob (ZIP)
    // Te dejo abajo cómo agregar methodsHttp.postBlob(...)
    const resp = await methodsHttp.postBlob("lateLetters/export", body);

    // resp puede venir como { blob, contentType } si decides devolver meta
    const blob = resp?.blob instanceof Blob ? resp.blob : resp;

    // Si el backend devolvió JSON (ej: no hay tardanzas), el blob será application/json
    const type = String(blob?.type || "").toLowerCase();
    if (type.includes("application/json")) {
      const txt = await blob.text();
      let msg = "No se pudo generar el ZIP.";
      try {
        const parsed = JSON.parse(txt);
        msg = parsed?.mensaje || parsed?.message || msg;
      } catch (e) {}
      $q.notify({ type: "warning", message: msg });
      return;
    }

    const from = filters.value.startDate;
    const to = filters.value.endDate || filters.value.startDate;
    const filename = `Cartas_Tardanzas_${from}_a_${to}.zip`;

    downloadBlob(blob, filename);

    $q.notify({ type: "positive", message: "ZIP generado y descargado." });
  } catch (err) {
    console.log(err);
    $q.notify({ type: "negative", message: "Error descargando el ZIP." });
  } finally {
    exportLoading.value = false;
  }
}

// async function postBlob(url, body) {
//   const resp = await api.post(url, body, {
//     responseType: "blob",
//   });
//   return resp.data; // Blob
// }

// export default {
//   // ...lo que ya tienes
//   postBlob,
// };


onMounted(async () => {
  getEmployees();
  getDepartments();
  getProjects();

  // ✅ primera carga: hoy
  await fetchPunchesSummary();
});

</script>
