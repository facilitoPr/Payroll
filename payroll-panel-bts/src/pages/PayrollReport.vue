<template>
  <div class="q-pa-md">
    <PageHeaderCard
      title="Reporte de nómina"
      subtitle="Consulta ponches, descuentos, horas trabajadas y pagos por empleado."
      icon="payments"
      class="q-mb-md"
    />

    <PayrollFiltersCard
      v-model:filtros="filtros"
      v-model:companySelected="companySelected"
      v-model:departmentSelected="departmentSeleted"
      v-model:jobPositionSelected="jobPositionSelected"
      v-model:projectSelected="projectSeleted"
      v-model:userSelected="userSeleted"
      v-model:paymentScheduleSelected="paymentScheduleSelected"
      :company-options="company"
      :department-options="department"
      :job-position-options="jobPositions"
      :project-options="project"
      :users-options="usuariosFiltrados"
      :payment-schedules="paymentSchedules"
      :employee-search-loading="employeeSearchLoading"
      :is-loading="isLoading"
      :has-resumen="resumen.length > 0"
      :has-employees="employeesReport.length > 0"
      :can-confirm-pay="employeesReport.length > 0"
      :can-close-payroll="employeesReport.length > 0"
      @filter-companies="filterCompanies"
      @filter-department="filterDepartment"
      @filter-job-positions="filterJobPositions"
      @filter-projects="filterProyects"
      @filter-employees="filterEmployess"
      @buscar="onBuscar"
      @open-add-day="openAddDayDialog"
      @open-confirm-pay="openConfirmPayDialog"
      @open-close-payroll="openClosePayrollDialog"
      @apply-suggested-range="applySuggestedRangeFromSchedule"
      @open-earnings="openEarningsDialog"
    />

    <q-banner
      v-if="canViewAdminFilters && !companySelectedId"
      rounded
      class="q-mb-md bg-blue-1 text-blue-10 payroll-banner"
    >
      <template #avatar>
        <q-icon name="business" color="primary" />
      </template>

      Primero selecciona una empresa para cargar departamentos, puestos,
      proyectos, empleados y consultar la nómina.
    </q-banner>

    <PayrollTotalsBar
      :totals="displayTotals"
      :total-gross="displayTotalGross"
      :employees-count="displayEmployeesCount"
      :can-view-deposit="canViewDeposit"
      @open-employees="openPayrollEmployeesDialog"
    />

    <EmployeesReportList
      :employees-report="employeesReport"
      :filtros="filtros"
      @open-details="openModalDetailsFunction"
    />

    <q-card
      v-if="payrollPagination.total > 0"
      flat
      bordered
      class="q-pa-md q-mt-md pagination-card"
    >
      <div class="row items-center q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="text-caption text-grey-7">
            Mostrando
            <b>{{ employeesReport.length }}</b>
            de
            <b>{{ payrollPagination.total }}</b>
            empleados encontrados.
          </div>
        </div>

        <div class="col-12 col-md-auto">
          <q-select
            v-model="payrollPagination.limit"
            :options="[5, 10, 15, 20, 30, 50]"
            dense
            outlined
            label="Por página"
            style="width: 140px"
            @update:model-value="onChangeLimit"
          />
        </div>

        <div class="col-12 col-md-auto">
          <q-pagination
            v-model="payrollPagination.page"
            :max="payrollPagination.totalPages || 1"
            max-pages="6"
            boundary-numbers
            direction-links
            color="primary"
            @update:model-value="onChangePage"
          />
        </div>
      </div>
    </q-card>

    <q-inner-loading :showing="isLoading">
      <q-spinner size="50px" />
    </q-inner-loading>

    <PunchDetailsDialog
      v-model="detailsDialog.open"
      :date-string="detailsDialog.dateString"
      :user="detailsDialog.user"
      :work-summary="detailsDialog.workSummary"
      :classification="detailsDialog.classification"
      :descuentoTotal="detailsDialog.descuentoTotal"
      @update="() => buscarResumen(false)"
    />

    <AddDayDialog
      v-model="addDayDialogOpen"
      :users="user"
      :filtros="filtros"
      :default-user="userSeleted"
      :work-summary-dates-by-user="workSummaryDatesByUser"
      @saved="() => buscarResumen(false)"
    />

    <ConfirmPayDialog
      v-model="confirmPayDialogOpen"
      :filtros="filtros"
      :initial-company-id="companySelectedId || ''"
      :initial-department-id="departmentSelectedId || ''"
      :initial-job-position-id="jobPositionSelectedId || ''"
      :initial-project-id="projectSelectedId || ''"
      :initial-payment-schedule-id="paymentScheduleSelectedId || ''"
      @saved="() => buscarResumen(false)"
    />

    <ClosePayrollDialog
      v-model="closePayrollDialogOpen"
      v-model:requireConfirmedDays="requireConfirmedDays"
      :filtros="filtros"
      :initial-company-id="companySelectedId || ''"
      :initial-department-id="departmentSelectedId || ''"
      :initial-job-position-id="jobPositionSelectedId || ''"
      :initial-project-id="projectSelectedId || ''"
      :initial-payment-schedule-id="paymentScheduleSelectedId || ''"
      :frequencyCode="paymentScheduleSelected?.paymentFrequency?.code || ''"
      :included-employee-ids="includedPayrollEmployeeIds"
      :included-employees="includedPayrollEmployees"
      @closed="() => buscarResumen(false)"
    />

    <PayrollEmployeesSelectionDialog
      v-model="payrollEmployeesDialogOpen"
      :employees="payrollSelectionEmployees"
      :excluded-ids="excludedPayrollEmployeeIds"
      :query-context="payrollEmployeeQueryContext"
      @apply="applyPayrollEmployeeSelection"
    />

    <EarningsDialog
      v-model="earningsDialogOpen"
      :filtros="filtros"
      :initial-company-id="companySelectedId || ''"
      :initial-department-id="departmentSelectedId || ''"
      :initial-job-position-id="jobPositionSelectedId || ''"
      :initial-project-id="projectSelectedId || ''"
      :initial-payment-schedule-id="paymentScheduleSelectedId || ''"
      @changed="() => buscarResumen(false)"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import "moment/dist/locale/es";
import { authStore } from "src/stores/auth-store";

import PageHeaderCard from "src/components/PageHeaderCard.vue";
import EarningsDialog from "src/components/reports/payroll/EarningsDialog.vue";
import ClosePayrollDialog from "src/components/reports/payroll/ClosePayrollDialog.vue";
import ConfirmPayDialog from "src/components/reports/payroll/ConfirmPayDialog.vue";
import AddDayDialog from "src/components/reports/payroll/AddDayDialog.vue";
import PunchDetailsDialog from "src/components/reports/payroll/PunchDetailsDialog.vue";
import EmployeesReportList from "src/components/reports/payroll/EmployeesReportList.vue";
import PayrollTotalsBar from "src/components/reports/payroll/PayrollTotalsBar.vue";
import PayrollFiltersCard from "src/components/reports/payroll/PayrollFiltersCard.vue";
import PayrollEmployeesSelectionDialog from "src/components/reports/payroll/PayrollEmployeesSelectionDialog.vue";
moment.locale("es");

const auth = authStore();

const resumen = ref([]);
const employeesReport = ref([]);

const totals = ref({
  totalLateMinutes: 0,
  totalLateHours: 0,
  totalDiscountTardanza: 0,
  totalDiscountAusencia: 0,
  totalDiscounts: 0,
  totalNetoADepositar: 0,
  totalWorkedHours: 0,
  totalGrossPay: 0,
  totalEmployees: 0,
});

const isLoading = ref(false);

const company = ref([]);
const companyFilter = ref([]);
const companySelected = ref(null);

const department = ref([]);
const departmentFilter = ref([]);
const departmentSeleted = ref(null);

const jobPositions = ref([]);
const jobPositionsFilter = ref([]);
const jobPositionSelected = ref(null);

const project = ref([]);
const projectFilter = ref([]);
const projectSeleted = ref(null);

const user = ref([]);
const employessFilter = ref([]);
const userSeleted = ref(null);
const employeeSearchLoading = ref(false);

const paymentSchedules = ref([]);
const paymentScheduleSelected = ref(null);

const payrollPagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const filtros = ref({
  fechaInicio: moment().format("YYYY-MM-DD"),
  fechaFin: "",
});

const detailsDialog = ref({
  open: false,
  dateString: "",
  user: {},
  classification: "",
  workSummary: null,
  descuentoTotal: 0,
});

const addDayDialogOpen = ref(false);
const confirmPayDialogOpen = ref(false);
const closePayrollDialogOpen = ref(false);
const earningsDialogOpen = ref(false);
const requireConfirmedDays = ref(true);
const payrollEmployeesDialogOpen = ref(false);
const payrollSelectionEmployees = ref([]);
const excludedPayrollEmployeeIds = ref([]);

const isChangingCompany = ref(false);
const isChangingDepartment = ref(false);
const isChangingJobPosition = ref(false);
const isChangingProject = ref(false);

const roleCode = computed(() => {
  return String(auth?.user?.rol?.code || auth?.user?.role?.code || "");
});

const departmentCode = computed(() => {
  return String(auth?.user?.department?.code || "");
});

const canViewAdminFilters = computed(() => {
  return (
    departmentCode.value === "RRHH" ||
    roleCode.value === "ADMIN" ||
    roleCode.value === "SUPERADMIN" ||
    roleCode.value === "SUPER_ADMIN"
  );
});

const canViewDeposit = computed(() => {
  return canViewAdminFilters.value;
});

const companySelectedId = computed(() => {
  return getOptionId(companySelected.value);
});

const departmentSelectedId = computed(() => {
  return getOptionId(departmentSeleted.value);
});

const jobPositionSelectedId = computed(() => {
  return getOptionId(jobPositionSelected.value);
});

const projectSelectedId = computed(() => {
  return getOptionId(projectSeleted.value);
});

const userSelectedId = computed(() => {
  return getOptionId(userSeleted.value);
});

const paymentScheduleSelectedId = computed(() => {
  return getOptionId(paymentScheduleSelected.value);
});

const totalGross = computed(() => {
  return Number(totals.value?.totalGrossPay || 0);
});

const excludedPayrollEmployeeIdSet = computed(() => {
  return new Set((excludedPayrollEmployeeIds.value || []).map(String));
});

const includedPayrollEmployees = computed(() => {
  return (payrollSelectionEmployees.value || []).filter((employee) => {
    return !excludedPayrollEmployeeIdSet.value.has(String(employee?.userId || ""));
  });
});

const includedPayrollEmployeeIds = computed(() => {
  return includedPayrollEmployees.value
    .map((employee) => String(employee?.userId || ""))
    .filter(Boolean);
});

const hasManualPayrollSelection = computed(() => {
  return payrollSelectionEmployees.value.length > 0;
});

const displayEmployeesCount = computed(() => {
  if (hasManualPayrollSelection.value) return includedPayrollEmployees.value.length;
  return payrollPagination.value.total;
});

const sumIncluded = (field, fallbackField = "") => {
  return includedPayrollEmployees.value.reduce((sum, employee) => {
    return sum + Number(employee?.[field] || employee?.[fallbackField] || 0);
  }, 0);
};

const displayTotals = computed(() => {
  if (!hasManualPayrollSelection.value) return totals.value;

  const totalWorkedMinutes = sumIncluded("totalWorkedMinutes");

  return {
    ...totals.value,
    totalEmployees: includedPayrollEmployees.value.length,
    totalNetoADepositar: sumIncluded("netoADepositar"),
    totalCompanyPayroll: sumIncluded("companyPayrollTotal", "netoADepositar"),
    totalEmployeeNetToDeposit: sumIncluded("employeeNetToDeposit", "netoADepositar"),
    totalEmployeeLoanDeductions: sumIncluded("employeeLoanDeductionsTotal"),
    totalDiscountTardanza: sumIncluded("totalDiscountTardanza"),
    totalDiscountAusencia: sumIncluded("totalDiscountAusencia"),
    totalDiscounts: sumIncluded("totalDiscounts"),
    totalWorkedMinutes,
    totalWorkedHours: totalWorkedMinutes,
    totalGrossPay: sumIncluded("totalGrossPay"),
  };
});

const displayTotalGross = computed(() => {
  return Number(displayTotals.value?.totalGrossPay || 0);
});

const payrollEmployeeQueryContext = computed(() => {
  return {
    fechaInicio: filtros.value.fechaInicio,
    fechaFin: filtros.value.fechaFin,
    paymentSchedule: paymentScheduleSelectedId.value,
    companyId: companySelectedId.value,
    departmentId: departmentSelectedId.value,
    jobPositionId: jobPositionSelectedId.value,
    projectId: projectSelectedId.value,
  };
});

const usuariosFiltrados = computed(() => {
  return user.value;
});

const employeesConfirmOptions = computed(() => {
  const source = hasManualPayrollSelection.value
    ? includedPayrollEmployees.value
    : employeesReport.value || [];

  return source.map((emp) => {
    return {
      label: emp.name || "Empleado",
      value: String(emp.userId),
      caption: emp.email || emp.username || "",
      avatar: emp.img || emp.image || "",
    };
  });
});

const workSummaryDatesByUser = computed(() => {
  const map = {};

  for (const emp of employeesReport.value || []) {
    const id = emp.userId;
    if (!id) continue;

    const set = new Set();

    (emp.dias || []).forEach((d) => {
      const raw =
        d.dateString || (d.date ? moment(d.date).format("YYYY-MM-DD") : null);

      if (raw) set.add(raw);
    });

    map[id] = set;
  }

  return map;
});

watch(companySelected, async (value) => {
  if (isChangingCompany.value) return;
  await onCompanyChange(value);
});

watch(departmentSeleted, async (value) => {
  if (isChangingDepartment.value) return;
  await onDepartmentChange(value);
});

watch(jobPositionSelected, async (value) => {
  if (isChangingJobPosition.value) return;
  await onJobPositionChange(value);
});

watch(projectSeleted, async () => {
  if (isChangingProject.value) return;

  userSeleted.value = null;
  payrollPagination.value.page = 1;

  await getEmployees("");
});

onMounted(async () => {
  await getCompanies();
  await getPaymentSchedules();
});

const getOptionId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;

  return value?._id || value?.id || value?.value || null;
};

const companyOptionLabel = (item) => {
  return (
    item?.legalName ||
    item?.commercialName ||
    item?.name ||
    item?.code ||
    "Sin nombre"
  );
};

const normalizeArrayResponse = (resp, keys = []) => {
  for (const key of keys) {
    if (Array.isArray(resp?.[key])) return resp[key];
  }

  return [];
};

const clearReport = () => {
  resumen.value = [];
  employeesReport.value = [];
  payrollSelectionEmployees.value = [];
  excludedPayrollEmployeeIds.value = [];

  totals.value = {
    totalLateMinutes: 0,
    totalLateHours: 0,
    totalDiscountTardanza: 0,
    totalDiscountAusencia: 0,
    totalDiscounts: 0,
    totalNetoADepositar: 0,
    totalWorkedHours: 0,
    totalGrossPay: 0,
    totalEmployees: 0,
  };

  payrollPagination.value.total = 0;
  payrollPagination.value.totalPages = 0;
};

const resetPayrollPagination = () => {
  payrollPagination.value.page = 1;
};

const buildPayrollRequestBody = ({
  page = payrollPagination.value.page,
  limit = payrollPagination.value.limit,
} = {}) => {
  const body = {
    fechaInicio: filtros.value.fechaInicio,
    page,
    limit,
    paymentSchedule: paymentScheduleSelectedId.value,
  };

  if (filtros.value.fechaFin) {
    body.fechaFin = filtros.value.fechaFin;
  }

  if (companySelectedId.value) {
    body.companyId = companySelectedId.value;
    body.company = companySelectedId.value;
  }

  if (departmentSelectedId.value) {
    body.departmentId = departmentSelectedId.value;
    body.department = departmentSelectedId.value;
  }

  if (jobPositionSelectedId.value) {
    body.jobPositionId = jobPositionSelectedId.value;
    body.jobPosition = jobPositionSelectedId.value;
  }

  if (projectSelectedId.value) {
    body.projectId = projectSelectedId.value;
    body.project = projectSelectedId.value;
  }

  if (userSelectedId.value) {
    body.userId = userSelectedId.value;
  }

  return body;
};

const getCompanies = async () => {
  const resp = await methodsHttp.getApi("company?limit=500&isActive=true");

  const rows = resp?.ok
    ? normalizeArrayResponse(resp, ["companies", "company", "data", "items"])
    : [];

  company.value = rows;
  companyFilter.value = rows;
};

const getDepartments = async (companyId = companySelectedId.value) => {
  department.value = [];
  departmentFilter.value = [];

  if (!companyId) return [];

  const resp = await methodsHttp.getApi(`department/company/${companyId}`);

  const rows = resp?.ok
    ? normalizeArrayResponse(resp, [
        "departments",
        "department",
        "data",
        "items",
      ])
    : [];

  department.value = rows;
  departmentFilter.value = rows;

  return rows;
};

const getJobPositions = async ({
  companyId = companySelectedId.value,
  departmentId = departmentSelectedId.value,
} = {}) => {
  jobPositions.value = [];
  jobPositionsFilter.value = [];

  if (!companyId || !departmentId) return [];

  const resp = await methodsHttp.getApi(
    `job-position/department/${departmentId}`,
  );

  const rows = resp?.ok
    ? normalizeArrayResponse(resp, [
        "jobPositions",
        "positions",
        "data",
        "items",
      ])
    : [];

  jobPositions.value = rows;
  jobPositionsFilter.value = rows;

  return rows;
};

const getProyects = async ({
  companyId = companySelectedId.value,
  departmentId = departmentSelectedId.value,
  jobPositionId = jobPositionSelectedId.value,
} = {}) => {
  project.value = [];
  projectFilter.value = [];

  if (!companyId || !departmentId || !jobPositionId) return [];

  const resp = await methodsHttp.getApi(
    `job-position/${jobPositionId}/projects`,
  );

  const rows = resp?.ok
    ? normalizeArrayResponse(resp, ["projects", "project", "data", "items"])
    : [];

  project.value = rows;
  projectFilter.value = rows;

  return rows;
};

const getEmployees = async (searchText = "") => {
  const companyId = companySelectedId.value;
  const departmentId = departmentSelectedId.value;
  const jobPositionId = jobPositionSelectedId.value;
  const projectId = projectSelectedId.value;

  user.value = [];
  employessFilter.value = [];

  if (canViewAdminFilters.value && !companyId) return [];

  const q = new URLSearchParams();

  q.set("isActived", "true");
  q.set("limit", "20");
  q.set("initial", "0");

  if (searchText && String(searchText).trim()) {
    q.set("text", String(searchText).trim());
  }

  if (companyId) q.set("company", companyId);
  if (departmentId) q.set("department", departmentId);
  if (jobPositionId) q.set("jobPosition", jobPositionId);
  if (projectId) q.set("project", projectId);

  const resp = await methodsHttp.getApi(`user/getEmployees?${q.toString()}`);

  const rows = resp?.ok
    ? normalizeArrayResponse(resp, ["employees", "users", "data", "items"])
    : [];

  user.value = rows;
  employessFilter.value = rows;

  return rows;
};

const getPaymentSchedules = async () => {
  isLoading.value = true;

  try {
    const resp = await methodsHttp.getApi(
      "employee-payment-management/getAllPaymentSchedules",
    );

    if (resp.ok) {
      paymentSchedules.value = resp.schedules || [];
      paymentScheduleSelected.value = resp.schedules?.[0] || null;

      if (resp.suggested) {
        filtros.value.fechaInicio = resp.suggested.periodStartString;
        filtros.value.fechaFin = resp.suggested.periodEndString;
      }
    }
  } finally {
    isLoading.value = false;
  }
};

const onCompanyChange = async (value) => {
  const companyId = getOptionId(value);

  isChangingCompany.value = true;

  try {
    departmentSeleted.value = null;
    jobPositionSelected.value = null;
    projectSeleted.value = null;
    userSeleted.value = null;

    department.value = [];
    departmentFilter.value = [];
    jobPositions.value = [];
    jobPositionsFilter.value = [];
    project.value = [];
    projectFilter.value = [];
    user.value = [];
    employessFilter.value = [];

    resetPayrollPagination();
    clearReport();

    if (!companyId) return;

    await getDepartments(companyId);
    await getEmployees("");
  } finally {
    isChangingCompany.value = false;
  }
};

const onDepartmentChange = async (value) => {
  const companyId = companySelectedId.value;
  const departmentId = getOptionId(value);

  isChangingDepartment.value = true;

  try {
    jobPositionSelected.value = null;
    projectSeleted.value = null;
    userSeleted.value = null;

    jobPositions.value = [];
    jobPositionsFilter.value = [];
    project.value = [];
    projectFilter.value = [];
    user.value = [];
    employessFilter.value = [];

    resetPayrollPagination();
    clearReport();

    if (!companyId || !departmentId) {
      await getEmployees("");
      return;
    }

    await getJobPositions({
      companyId,
      departmentId,
    });

    await getEmployees("");
  } finally {
    isChangingDepartment.value = false;
  }
};

const onJobPositionChange = async (value) => {
  const companyId = companySelectedId.value;
  const departmentId = departmentSelectedId.value;
  const jobPositionId = getOptionId(value);

  isChangingJobPosition.value = true;

  try {
    projectSeleted.value = null;
    userSeleted.value = null;

    project.value = [];
    projectFilter.value = [];
    user.value = [];
    employessFilter.value = [];

    resetPayrollPagination();
    clearReport();

    if (!companyId || !departmentId || !jobPositionId) {
      await getEmployees("");
      return;
    }

    await getProyects({
      companyId,
      departmentId,
      jobPositionId,
    });

    await getEmployees("");
  } finally {
    isChangingJobPosition.value = false;
  }
};

const onBuscar = () => {
  buscarResumen(true);
};

const buscarResumen = async (resetPage = false) => {
  try {
    if (canViewAdminFilters.value && !companySelectedId.value) {
      clearReport();
      return;
    }

    if (!paymentScheduleSelectedId.value) {
      clearReport();
      return;
    }

    isLoading.value = true;

    if (resetPage) {
      resetPayrollPagination();
    }

    const body = buildPayrollRequestBody();
    const resp = await methodsHttp.postApi("punch/getPunchesToPayroll", body);

    if (resp.ok) {
      employeesReport.value = Array.isArray(resp.employees)
        ? resp.employees
        : [];

      resumen.value = employeesReport.value.flatMap((emp) => emp.dias || []);

      totals.value = {
        ...totals.value,
        ...(resp.totals || {}),
      };

      payrollPagination.value = {
        page: resp.pagination?.page || 1,
        limit: resp.pagination?.limit || payrollPagination.value.limit,
        total: resp.pagination?.total || 0,
        totalPages: resp.pagination?.totalPages || 0,
      };

      payrollSelectionEmployees.value = [];
      excludedPayrollEmployeeIds.value = [];

      return;
    }

    clearReport();
  } finally {
    isLoading.value = false;
  }
};

const onChangePage = () => {
  buscarResumen(false);
};

const onChangeLimit = () => {
  resetPayrollPagination();
  buscarResumen(false);
};

const filterCompanies = (val, update) => {
  update(() => {
    if (!val) {
      company.value = companyFilter.value;
      return;
    }

    const needle = String(val).toLowerCase();

    company.value = companyFilter.value.filter((item) => {
      return companyOptionLabel(item).toLowerCase().includes(needle);
    });
  });
};

const filterDepartment = (val, update) => {
  update(() => {
    if (!val) {
      department.value = departmentFilter.value;
      return;
    }

    const needle = String(val).toLowerCase();

    department.value = departmentFilter.value.filter((item) => {
      const label = String(item?.name || item?.code || "").toLowerCase();
      return label.includes(needle);
    });
  });
};

const filterJobPositions = (val, update) => {
  update(() => {
    if (!val) {
      jobPositions.value = jobPositionsFilter.value;
      return;
    }

    const needle = String(val).toLowerCase();

    jobPositions.value = jobPositionsFilter.value.filter((item) => {
      const label = String(item?.name || item?.code || "").toLowerCase();
      return label.includes(needle);
    });
  });
};

const filterProyects = (val, update) => {
  update(() => {
    if (!val) {
      project.value = projectFilter.value;
      return;
    }

    const needle = String(val).toLowerCase();

    project.value = projectFilter.value.filter((item) => {
      const label = String(item?.name || item?.code || "").toLowerCase();
      return label.includes(needle);
    });
  });
};

const filterEmployess = async (val, update, abort) => {
  if (canViewAdminFilters.value && !companySelectedId.value) {
    update(() => {
      user.value = [];
      employessFilter.value = [];
    });

    return;
  }

  employeeSearchLoading.value = true;

  try {
    const rows = await getEmployees(val);

    update(() => {
      user.value = rows;
      employessFilter.value = rows;
    });
  } catch (error) {
    console.error("filterEmployess error:", error);
    if (abort) abort();
  } finally {
    employeeSearchLoading.value = false;
  }
};

const openModalDetailsFunction = (dayRow) => {
  detailsDialog.value.open = true;
  detailsDialog.value.dateString = dayRow?.dateString;
  detailsDialog.value.user = dayRow?.empleado;
  detailsDialog.value.classification = dayRow?.classification;
  detailsDialog.value.workSummary = dayRow?.workSummary;
  detailsDialog.value.descuentoTotal = dayRow?.descuentoTotal;
};

const openAddDayDialog = () => {
  addDayDialogOpen.value = true;
};

const openConfirmPayDialog = () => {
  confirmPayDialogOpen.value = true;
};

const openClosePayrollDialog = () => {
  closePayrollDialogOpen.value = true;
};

const openEarningsDialog = () => {
  earningsDialogOpen.value = true;
};

const loadPayrollEmployeesForSelection = async () => {
  if (!payrollPagination.value.total) return [];

  const limit = 50;
  const first = await methodsHttp.postApi(
    "punch/getPunchesToPayroll",
    buildPayrollRequestBody({ page: 1, limit }),
  );

  if (!first?.ok) return [];

  const rows = Array.isArray(first.employees) ? [...first.employees] : [];
  const totalPages = Number(first.pagination?.totalPages || 1);

  for (let page = 2; page <= totalPages; page += 1) {
    const response = await methodsHttp.postApi(
      "punch/getPunchesToPayroll",
      buildPayrollRequestBody({ page, limit }),
    );

    if (response?.ok && Array.isArray(response.employees)) {
      rows.push(...response.employees);
    }
  }

  const byId = new Map();

  rows.forEach((employee) => {
    if (employee?.userId) byId.set(String(employee.userId), employee);
  });

  return Array.from(byId.values());
};

const openPayrollEmployeesDialog = async () => {
  if (!payrollPagination.value.total) return;

  isLoading.value = true;

  try {
    if (!payrollSelectionEmployees.value.length) {
      payrollSelectionEmployees.value = await loadPayrollEmployeesForSelection();
    }

    payrollEmployeesDialogOpen.value = true;
  } finally {
    isLoading.value = false;
  }
};

const applyPayrollEmployeeSelection = ({ employees = [], excludedIds = [] }) => {
  payrollSelectionEmployees.value = employees;
  excludedPayrollEmployeeIds.value = excludedIds;
};

const applySuggestedRangeFromSchedule = async () => {
  try {
    if (!paymentScheduleSelectedId.value) return;

    const resp = await methodsHttp.getApi(
      `employee-payment-management/suggestedPeriodBySchedule?scheduleId=${paymentScheduleSelectedId.value}`,
    );

    if (resp.ok && resp.suggested) {
      filtros.value.fechaInicio = resp.suggested.periodStartString;
      filtros.value.fechaFin = resp.suggested.periodEndString;

      await buscarResumen(true);
    }
  } catch (error) {
    console.error("applySuggestedRangeFromSchedule error:", error);
  }
};
</script>

<style scoped>
.pagination-card {
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #ffffff;
}

.payroll-banner {
  border: 1px solid rgba(23, 141, 210, 0.16);
}
</style>
