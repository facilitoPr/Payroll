<template>
  <div>
      <PageHeaderCard
      v-if="showNewHeader"
      title="Archivos muertos"
      subtitle="Visualiza los archivos muertos de antiguos empleados"
      icon="folder_off"
    >
      <template #actions>
        <q-input
          outlined
          dense
          debounce="300"
          label="Buscar empleado"
          color="primary"
          v-model="text"
          @update:model-value="search"
          class="header-search"
        >
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
          <template #append>
            <q-btn
              v-if="text"
              flat
              dense
              round
              icon="close"
              @click="
                () => {
                  text = '';
                  search();
                }
              "
            />
          </template>
        </q-input>
      </template>
    </PageHeaderCard>

    <div v-else class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-subtitle1 text-weight-bold">Empleados</div>
        <div class="text-caption text-grey-6">
          Administra usuarios, horarios, documentos y pagos.
        </div>
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-auto">
          <q-btn
            v-if="canManageEmployees"
            color="primary"
            label="Crear empleado"
            icon="add"
            no-caps
            class="header-btn full-width"
            @click="
              () => {
                clear();
                create();
              }
            "
          />
        </div>

        <div class="col-12 col-sm-auto">
          <q-input
            v-model="text"
            outlined
            dense
            rounded
            label="Buscar empleado"
            color="primary"
            @keyup="search"
          >
            <template #append>
              <q-icon name="search" color="primary" />
            </template>
          </q-input>
        </div>
      </div>
    </div>

    <EmployeeFormDialog
      v-model="openModal"
      v-model:form="form"
      v-model:image="image"
      v-model:departmentSelected="departmentSeleted"
      v-model:projectSelected="projectSeleted"
      v-model:jobPositionSelected="jobPositionSelected"
      v-model:salaryTypeSelected="salaryTypeSelected"
      v-model:paymentScheduleSelected="paymentSchedulesSelected"
      v-model:applicationSelected="applicationSelected"
      :is-edit-mode="isEditMode"
      :loading="isLoading"
      :departments="department"
      :projects="project"
      :job-positions="jobPositions"
      :salary-types="salaryType"
      :payment-schedules="paymentSchedules"
      :applications="applications"
      :current-department="currentDepartment"
      :required-department-code="requiredDepartmentCode"
      :special-field-rules="specialFieldRules"
      @department-change="onDepartmentChange"
      @application-selected="onApplicationSelected"
      @save="save"
    />

    <EmployeeScheduleReadOnlyDialog
      v-model="openModalMySchedule"
      :schedule="mySchedule"
    />

    <q-card flat bordered class="tabs-card q-mb-md" v-if="canManageEmployees">
      <q-tabs
        v-model="employeesTab"
        dense
        align="left"
        indicator-color="primary"
        active-color="primary"
        class="text-grey-8"
      >
      <q-tab name="inactive" icon="do_not_disturb_on" label="Inactivos" />
        <q-tab name="active" icon="check_circle" label="Activos" />
      </q-tabs>
    </q-card>

    <q-card flat bordered class="panel-card">
      <q-table
        :loading="tableLoading"
        flat
        bordered
        row-key="_id"
        :rows="rows"
        :columns="employeeTableColumns"
        :rows-per-page-options="[limit]"
        hide-pagination
        class="employees-table"
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
                    v-for="item in menuItemsToUse"
                    :key="item.text"
                    clickable
                    v-close-popup
                    class="action-menu-item"
                    @click="item.action(props.row)"
                  >
                    <q-item-section avatar>
                      <q-avatar
                        size="32px"
                        :color="item.color"
                        text-color="white"
                      >
                        <q-icon :name="item.icon" size="18px" />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>
                        {{ formatActionText(item.text) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </q-td>

            <q-td key="employee" :props="props">
              <div class="employee-cell">
                <q-avatar size="48px" class="employee-table-avatar">
                  <q-img
                    v-if="props.row.img"
                    :src="props.row.img"
                    fit="cover"
                    spinner-color="primary"
                  />
                  <span v-else>{{ getInitials(props.row.name) }}</span>
                </q-avatar>

                <div class="employee-cell-info">
                  <div class="employee-name ellipsis">
                    {{ props.row.name || "Sin nombre" }}
                  </div>
                  <div class="employee-email ellipsis">
                    {{ props.row.email || "Sin correo" }}
                  </div>
                </div>
              </div>
            </q-td>

            <q-td key="position" :props="props">
              <div class="text-weight-bold">
                {{ props.row.jobPosition?.name || "Puesto no definido" }}
              </div>
              <div class="text-caption text-grey-7">
                {{ props.row.department?.name || "Departamento no definido" }}
              </div>
              <div v-if="props.row.project?.name" class="text-caption text-grey-6">
                Proyecto: {{ props.row.project.name }}
              </div>
            </q-td>

            <q-td key="phone" :props="props">
              <div v-if="props.row.phone">
                {{ formatearTelefono(props.row.phone) }}
              </div>
              <q-badge v-else color="grey-4" text-color="grey-8" rounded>
                No definido
              </q-badge>
            </q-td>

            <q-td v-if="canManageEmployees" key="salary" :props="props">
              <div v-if="props.row.salaryType" class="text-weight-bold">
                {{ props.row.salaryType?.name }}
              </div>

              <div v-if="props.row.baseSalary">
                <b class="text-primary">$</b>
                {{ formatter2(props.row.baseSalary) }} neto
              </div>

              <div v-else-if="props.row.hourlyRate">
                <b class="text-primary">$</b>
                {{ formatter2(props.row.hourlyRate) }} hora
              </div>

              <q-badge v-else color="grey-4" text-color="grey-8" rounded>
                No definido
              </q-badge>
            </q-td>

            <q-td key="schedulePayment" :props="props">
              <div v-if="props.row.paymentSchedule">
                <div class="text-weight-bold">
                  {{ props.row.paymentSchedule?.paymentFrequency?.name }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ props.row.paymentSchedule?.name }}
                </div>
              </div>

              <q-badge v-else color="grey-4" text-color="grey-8" rounded>
                No definido
              </q-badge>
            </q-td>

            <q-td v-if="canManageEmployees" key="contractDate" :props="props">
              <div v-if="props.row.hiringDate">
                <div class="text-weight-bold">
                  {{ moment(props.row.hiringDate).format("YYYY/MM/DD") }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ getEmployeeSeniority(props.row.hiringDate) }}
                </div>
              </div>

              <q-badge v-else color="grey-4" text-color="grey-8" rounded>
                No definido
              </q-badge>
            </q-td>

            <q-td
              key="status"
              :props="props"
              :class="canManageEmployees ? 'cursor-pointer' : ''"
              @click="canManageEmployees && updateState(props.row)"
            >
              <q-badge
                rounded
                :color="props.row.isActived ? 'positive' : 'negative'"
                :label="props.row.isActived ? 'Activo' : 'Inactivo'"
                class="status-badge"
              />
            </q-td>
          </q-tr>
        </template>

        <template #no-data>
          <div class="full-width text-center q-pa-xl text-grey-7">
            <q-icon name="people_outline" size="44px" color="grey-5" />
            <div class="text-subtitle1 text-weight-bold q-mt-sm">
              No hay empleados para mostrar
            </div>
            <div class="text-caption">
              Ajusta la búsqueda o crea un nuevo empleado.
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
    <Delete ref="deleteInfo" @deleteGood="getOperators" />

    <ScheduleDialog
      ref="schedule"
      :mySchedule="mySchedule"
      @update:modelValue="getOperators"
      @saved="getOperators"
    />

    <Document
      ref="documento"
      @update:modelValue="getOperators"
    />

    <Contract
      ref="contrato"
      @update:modelValue="getOperators"
    />

    <EmployeeDeduction ref="deduction" />
    <EmployeePaymentDetails ref="paymentDetails" />

    <ClassificationExpedientModal
      v-model="classificationDialog"
      :employee="classificationTarget"
      target="employee"
      @saved="() => console.log('Prueba')"
    />

    <EmployeeBankForm
      v-model="bankDialog.open"
      :employee="bankDialog.employee"
      @saved="() => getOperators({ withSearch: true })"
    />

    <EmployeeAuditTrailDialog
      v-model="auditDialog.open"
      :employee="auditDialog.employee"
    />
  </div>
</template>

<script setup>
import moment from "moment";
import { ref, onMounted, watch, computed } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Delete from "src/components/utils/Delete.vue";
import TablePagination from "src/components/table/TablePagination.vue";
import Document from "src/components/utils/Document.vue";
import Contract from "src/components/utils/Contract.vue";
import { formatearTelefono, formatter2 } from "app/utils";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import ClassificationExpedientModal from "src/components/expedient/ClassificationExpedientModal.vue";
import EmployeeBankForm from "src/components/employee/EmployeeBankForm.vue";
import EmployeeAuditTrailDialog from "src/components/employee/EmployeeAuditTrailDialog.vue";
import EmployeeFormDialog from "src/components/employee/EmployeeFormDialog.vue";
import { authStore } from "src/stores/auth-store";
import EmployeeScheduleReadOnlyDialog from "src/components/employee/schedule/EmployeeScheduleReadOnlyDialog.vue";
import ScheduleDialog from "src/components/employee/schedule/ScheduleDialog.vue";
import EmployeeDeduction from "src/components/employee/payment/EmployeeDeduction.vue";
import EmployeePaymentDetails from "src/components/employee/payment/EmployeePaymentDetails.vue";

defineProps({
  showNewHeader: { type: Boolean, default: true },
});

const limit = ref(10);
const initial = ref(0);
const orderQuantity = ref(1);
const initialPagination = ref(1);

const text = ref("");
const notify = ref(null);
const deleteInfo = ref(null);
const schedule = ref(null);
const documento = ref(null);
const contrato = ref(null);
const deduction = ref(null);
const paymentDetails = ref(null);

const openModalMySchedule = ref(false);
const mySchedule = ref(null);

const rows = ref([]);
const TableFilter = ref([]);
const tableLoading = ref(false);
const openModal = ref(false);
const isEditMode = ref(false);
const id = ref(null);
const image = ref(null);

const form = ref({
  hiringDate: "",
  exitDate: "",
  exitNote: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  img: "",
  code: "",
  baseSalary: null,
  hourlyRate: null,
  ext: "",
  rehiring: "NO",
  fromApplication: "SI",
  isActived: true,

  payrollBank: {
    enabled: false,
    accountNumber: "",
    accountType: "",
    currency: "214",
    bankCode: "",
    bankDigit: "",
    operationCode: "",
    idType: "",
    idNumber: "",
    beneficiaryName: "",
    referenceNumber: "",
    statementDescription: "NOMINA",
    contactMethod: "",
    emailBenef: "",
    faxOrPhoneBenef: "",
    acquirerId: "00",
    dueDate4: "",
  },
});

const isLoading = ref(false);

const salaryType = ref([]);
const salaryTypeSelected = ref(null);
const paymentSchedules = ref([]);
const paymentSchedulesSelected = ref(null);

const department = ref([]);
const requiredDepartmentCode = "TRIPLE_S";
const departmentSeleted = ref(null);

const project = ref([]);
const projectSeleted = ref(null);

const jobPositions = ref([]);
const jobPositionSelected = ref(null);

const applications = ref([]);
const applicationSelected = ref(null);

const bankDialog = ref({
  open: false,
  employee: null,
});

const auditDialog = ref({
  open: false,
  employee: null,
});

const classificationDialog = ref(false);
const classificationTarget = ref(null);

const auth = authStore();

const roleCode = computed(() => auth.user?.rol?.code ?? "");
const deptCode = computed(() => auth.user?.department?.code ?? "");

const canManageEmployees = computed(() => {
  return (
    roleCode.value === "SUPERADMIN" ||
    roleCode.value === "ADMIN" ||
    deptCode.value === "RRHH"
  );
});

const employeeTableColumns = computed(() => {
  const baseColumns = [
    {
      name: "actions",
      label: "Acciones",
      align: "center",
      field: "actions",
      style: "width: 120px",
    },
    {
      name: "employee",
      label: "Empleado",
      align: "left",
      field: "name",
      sortable: true,
    },
    {
      name: "position",
      label: "Área / Puesto",
      align: "left",
      field: "department",
    },
    {
      name: "phone",
      label: "Teléfono",
      align: "left",
      field: "phone",
    },
  ];

  if (canManageEmployees.value) {
    baseColumns.push(
      {
        name: "salary",
        label: "Pago",
        align: "left",
        field: "salaryType",
      },
      {
        name: "contractDate",
        label: "Contratación",
        align: "left",
        field: "hiringDate",
      },
    );
  }

  baseColumns.push(
    {
      name: "schedulePayment",
      label: "Frecuencia",
      align: "left",
      field: "paymentSchedule",
    },
    {
      name: "status",
      label: "Estado",
      align: "center",
      field: "isActived",
      style: "width: 110px",
    },
  );

  return baseColumns;
});

const employeesTab = ref("inactive");
const isActivedFilter = computed(() => employeesTab.value === "active");

const currentDepartment = computed(() => {
  return department.value.find((d) => d._id === departmentSeleted.value) || null;
});

const specialFieldRules = computed(() => [
  (val) => {
    if (
      currentDepartment.value?.code === requiredDepartmentCode &&
      (!val || val === "")
    ) {
      return "EXT es requerida para este departamento";
    }

    return true;
  },
]);

watch(employeesTab, async () => {
  initialPagination.value = 1;
  initial.value = 0;
  text.value = "";
  await getOperators({ withSearch: false });
});

watch(salaryTypeSelected, (value) => {
  if (!value) return;

  if (value.code === "FIJO") {
    form.value.hourlyRate = null;
  }

  if (value.code === "HORAS") {
    form.value.baseSalary = null;
  }
});

watch(initialPagination, async (value) => {
  initial.value = value === 1 ? 0 : value * limit.value - limit.value;
  await getOperators({ withSearch: true });
});

onMounted(() => {
  getOperators({ withSearch: true });
  getRecruitmentApplicationsByDecision();
});

const getDepartment = async () => {
  const resp = await methodsHttp.getApi("department/getDepartment");

  if (resp.ok) {
    department.value = resp.department;
  }
};

const getRecruitmentApplicationsByDecision = async () => {
  const resp = await methodsHttp.getApi(
    "recruitment/getRecruitmentAllApplications?decision=HIRING",
  );

  if (resp.ok) {
    applications.value = resp.applications;
  }
};

const getJobPositions = async (departmentId) => {
  if (!departmentId) {
    jobPositions.value = [];
    return;
  }

  const resp = await methodsHttp.getApi(
    `job-position/getJobPositions?department=${departmentId}`,
  );

  if (resp.ok) {
    jobPositions.value = resp.jobPositions;
  }
};

const getProject = async () => {
  const resp = await methodsHttp.getApi("project/getProject");

  if (resp.ok) {
    project.value = resp.project;
  }
};

const getSAllalaryType = async () => {
  const resp = await methodsHttp.getApi(
    "employee-payment-management/getSalalaryType",
  );

  salaryType.value = resp.ok ? resp.salaryType : [];
};

const getAllPaymentSchedules = async () => {
  const resp = await methodsHttp.getApi(
    "employee-payment-management/getAllPaymentSchedules",
  );

  paymentSchedules.value = resp.ok ? resp.schedules : [];
};

const getOperators = async ({ withSearch = true } = {}) => {
  tableLoading.value = true;

  try {
    const q = new URLSearchParams();

    q.set("limit", String(limit.value));
    q.set("initial", String(initial.value));
    q.set("isActived", isActivedFilter.value ? "true" : "false");

    if (withSearch && text.value && text.value.trim()) {
      q.set("text", text.value.trim());
    }

    const resp = await methodsHttp.getApi(`user/getEmployees?${q.toString()}`);

    if (resp.ok) {
      rows.value = resp.employees;
      TableFilter.value = resp.employees;
      orderQuantity.value = Math.ceil(resp.count / limit.value);
    }
  } finally {
    tableLoading.value = false;
  }
};

const onDepartmentChange = async (departmentId) => {
  await getJobPositions(departmentId);

  const dep = department.value.find((d) => d._id === departmentId);

  if (dep?.code !== requiredDepartmentCode) {
    form.value.ext = "";
  }
};

const preloadFromApplication = async (app) => {
  if (!app) return;
  if (isEditMode.value) return;

  departmentSeleted.value = app.form?.jobPosition?.department?._id || null;
  jobPositionSelected.value = app.form?.jobPosition?._id || null;

  if (!department.value.length) await getDepartment();

  if (app.form?.jobPosition?.department?._id) {
    await getJobPositions(app.form.jobPosition.department._id);
  }

  if (app?.applicantName) form.value.name = app.applicantName;
  if (app?.applicantEmail) form.value.email = app.applicantEmail;
  if (app?.applicantPhone) form.value.phone = app.applicantPhone;
};

const onApplicationSelected = async (appId) => {
  if (!appId) return;

  const app = applications.value.find((a) => String(a._id) === String(appId));

  await preloadFromApplication(app);
};

const getAllData = async () => {
  await Promise.all([
    getSAllalaryType(),
    getAllPaymentSchedules(),
    getDepartment(),
    getProject(),
  ]);
};

const create = async () => {
  isEditMode.value = false;
  openModal.value = true;
  await getAllData();
};

const openModalEdit = async (item) => {
  await getAllData();

  if (item?.department?._id) {
    await getJobPositions(item.department._id);
  }

  form.value.name = item.name || "";
  form.value.email = item.email || "";
  form.value.phone = item.phone || "";
  form.value.img = item.img || "";
  form.value.ext = item.ext || "";
  form.value.hiringDate = formatDateInput(item.hiringDate);
  form.value.exitDate = formatDateInput(item.exitDate);
  form.value.exitNote = item.exitNote || "";
  form.value.baseSalary = item.baseSalary || null;
  form.value.hourlyRate = item.hourlyRate || null;
  form.value.isActived = item.isActived !== false;
  form.value.fromApplication = "NO";
  form.value.rehiring = item.rehiring || "NO";

  salaryTypeSelected.value = item.salaryType || null;
  paymentSchedulesSelected.value = item.paymentSchedule?._id || null;
  departmentSeleted.value = item?.department?._id || null;
  projectSeleted.value = item?.project?._id || null;
  jobPositionSelected.value = item.jobPosition?._id || null;

  form.value.payrollBank = {
    ...form.value.payrollBank,
    ...(item.payrollBank || {}),
  };

  isEditMode.value = true;
  openModal.value = true;
  id.value = item._id;
};

const updateState = async (item) => {
  tableLoading.value = true;

  try {
    const resp = await methodsHttp.putApi(`user/updateUser/${item._id}`, {
      isActived: !item.isActived,
    });

    if (resp.ok) {
      notify.value?.showNotifyGood(resp.mensaje);
      await getOperators();
      clear();
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  } finally {
    tableLoading.value = false;
  }
};

const clear = () => {
  form.value.name = "";
  form.value.email = "";
  form.value.phone = "";
  form.value.password = "";
  form.value.img = null;
  form.value.isActived = true;
  image.value = null;
  form.value.baseSalary = null;
  form.value.hourlyRate = null;
  form.value.ext = "";
  form.value.fromApplication = "SI";
  form.value.rehiring = "NO";
  form.value.exitDate = "";
  form.value.exitNote = "";
  salaryTypeSelected.value = null;
  paymentSchedulesSelected.value = null;
  departmentSeleted.value = null;
  projectSeleted.value = null;
  jobPositionSelected.value = null;
  form.value.hiringDate = "";
  applicationSelected.value = null;

  form.value.payrollBank = {
    enabled: false,
    accountNumber: "",
    accountType: "",
    currency: "214",
    bankCode: "",
    bankDigit: "",
    operationCode: "",
    idType: "",
    idNumber: "",
    beneficiaryName: "",
    referenceNumber: "",
    statementDescription: "NOMINA",
    contactMethod: "",
    emailBenef: "",
    faxOrPhoneBenef: "",
    acquirerId: "00",
    dueDate4: "",
  };
};

const openModalDelete = (item) => {
  deleteInfo.value?.openDelete({
    id: item._id,
    ruta: "user/deleteUser",
  });
};

const openModalSchedule = (item) => {
  schedule.value?.openModal(item);
  mySchedule.value = item.schedule;
};

const openModalDocument = (item) => {
  documento.value?.openModalDocument(item._id);
};

const openModalContract = (item) => {
  contrato.value?.openModalContract(item._id);
};

const openModalDeduction = (item) => {
  deduction.value?.openModalDeduction(item);
};

const openModalPaymentDetail = (item) => {
  paymentDetails.value?.verDetalle(item);
};

const openBankDialog = (item) => {
  bankDialog.value.employee = item;
  bankDialog.value.open = true;
};

const openClassificationDialog = (item) => {
  classificationTarget.value = item;
  classificationDialog.value = true;
};

const openModalScheduleReadOnly = (item) => {
  mySchedule.value = item.schedule || null;
  openModalMySchedule.value = true;
};

const openScheduleSafe = (item) => {
  if (!canManageEmployees.value) {
    openModalScheduleReadOnly(item);
    return;
  }

  openModalSchedule(item);
};

const openAuditDialog = (item) => {
  auditDialog.value.open = true;
  auditDialog.value.employee = item;
};

const save = async () => {
  try {
    isLoading.value = true;

    if (salaryTypeSelected.value !== null) {
      if (salaryTypeSelected.value.code === "HORAS") {
        if (!form.value.hourlyRate) {
          notify.value?.showNotifyBad("Sueldo por hora es obligatorio");
          return;
        }
      }

      if (salaryTypeSelected.value.code === "FIJO") {
        if (!form.value.baseSalary) {
          notify.value?.showNotifyBad("Sueldo base es obligatorio");
          return;
        }
      }
    }

    const payload = {
      ...form.value,
      salaryType: salaryTypeSelected.value?._id || null,
      paymentSchedule: paymentSchedulesSelected.value || null,
      department: departmentSeleted.value || null,
      project: projectSeleted.value || null,
      jobPosition: jobPositionSelected.value || null,
      departmentCode: currentDepartment.value?.code || null,
      recruitmentApplication: applicationSelected.value || null,
    };

    delete payload.payrollBank;

    const formData = new FormData();

    if (image.value) {
      formData.append("images", image.value);
    }

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (typeof value === "number" || typeof value === "boolean") {
        formData.append(key, String(value));
        return;
      }

      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
        return;
      }

      formData.append(key, value);
    });

    const resp = !isEditMode.value
      ? await methodsHttp.postApi("user/createEmployee", formData)
      : await methodsHttp.putApi(`user/updateEmployee/${id.value}`, formData);

    if (resp?.ok) {
      openModal.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
      await getOperators();
      clear();
    } else {
      notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
    }
  } catch (error) {
    console.error("Error en save:", error);
    notify.value?.showNotifyBad("Error al guardar el empleado");
  } finally {
    isLoading.value = false;
  }
};

const search = async () => {
  initialPagination.value = 1;
  initial.value = 0;
  await getOperators({ withSearch: true });
};

const abrirDocumento = (url) => {
  window.open(url, "_blank");
};

const getInitials = (value) => {
  const text = String(value || "").trim();

  if (!text) return "U";

  const parts = text.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const formatActionText = (text) => {
  const value = String(text || "").trim().toLowerCase();

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getEmployeeSeniority = (date) => {
  if (!date) return "Sin fecha";

  const now = moment();
  const hiring = moment(date);
  const diff = moment.duration(now.diff(hiring));

  return `${diff.years()} años, ${diff.months()} meses, ${diff.days()} días`;
};

const formatDateInput = (value) => {
  if (!value) return "";
  return moment(value).format("YYYY-MM-DD");
};

const menuItemsFull = [
  { icon: "edit", text: "EDITAR", color: "primary", action: openModalEdit },
  {
    icon: "account_balance",
    text: "DATOS BANCARIOS",
    color: "primary",
    action: openBankDialog,
  },
  {
    icon: "folder_shared",
    text: "EXPEDIENTE",
    color: "primary",
    action: openClassificationDialog,
  },
  {
    icon: "calendar_month",
    text: "HORARIO",
    color: "primary",
    action: openScheduleSafe,
  },
  {
    icon: "price_check",
    text: "DEDUCCIONES",
    color: "secondary",
    action: openModalDeduction,
  },
  {
    icon: "money",
    text: "DETALLE DE PAGO",
    color: "secondary",
    action: openModalPaymentDetail,
  },
  {
    icon: "history",
    text: "HISTORIAL DE CAMBIOS",
    color: "secondary",
    action: openAuditDialog,
  },
  {
    icon: "delete",
    text: "ELIMINAR",
    color: "negative",
    action: openModalDelete,
  },
];

const menuItemsRestricted = [
  {
    icon: "calendar_month",
    text: "HORARIO",
    color: "primary",
    action: openScheduleSafe,
  },
];

const menuItemsToUse = computed(() => {
  return canManageEmployees.value ? menuItemsFull : menuItemsRestricted;
});
</script>

<style scoped>
.header-btn {
  height: 40px;
  border-radius: 999px;
  font-weight: 800;
}

.header-search {
  width: 340px;
  max-width: 100%;
}

.tabs-card {
  border-radius: 18px;
  overflow: hidden;
}

.panel-card {
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.04);
}

.employees-table {
  background: #ffffff;
}

.employee-cell {
  min-width: 260px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.employee-table-avatar {
  color: white;
  font-weight: 900;
  background: linear-gradient(135deg, #1a2436, #1964a2);
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 4px rgba(25, 100, 162, 0.12);
}

.employee-cell-info {
  min-width: 0;
}

.employee-name {
  max-width: 240px;
  color: #0f172a;
  font-weight: 900;
  line-height: 1.1;
}

.employee-email {
  max-width: 240px;
  color: #64748b;
  font-size: 0.78rem;
  margin-top: 3px;
}

.table-actions-btn {
  border-radius: 999px;
  font-weight: 800;
}

.actions-menu-list {
  min-width: 240px;
  padding: 8px;
}

.action-menu-item {
  border-radius: 14px;
  margin-bottom: 3px;
}

.action-menu-item:hover {
  background: rgba(25, 100, 162, 0.06);
}

.status-badge {
  padding: 6px 10px;
  font-weight: 800;
}

.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

@media (max-width: 599px) {
  .header-search {
    width: 100%;
  }

  .employee-cell {
    min-width: 220px;
  }
}
</style>