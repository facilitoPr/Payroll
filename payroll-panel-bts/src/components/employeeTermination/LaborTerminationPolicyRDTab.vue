<template>
  <div class="labor-policy-tab">
    <q-card flat bordered class="termination-panel-card">
      <q-card-section>
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="section-title row items-center no-wrap">
              <q-avatar color="primary" text-color="white" size="42px">
                <q-icon name="gavel" />
              </q-avatar>

              <div class="q-ml-sm">
                <div class="text-subtitle1 text-weight-bold">
                  Políticas de desvinculación laboral RD
                </div>

                <div class="text-caption text-grey-7">
                  Configura preaviso, cesantía, regalía, vacaciones y reglas por
                  tipo de desvinculación.
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
              label="Crear política base"
              class="action-btn full-width"
              :loading="saving"
              @click="openCreateDialog"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.year"
              outlined
              dense
              rounded
              clearable
              color="primary"
              type="number"
              label="Año"
              @keyup.enter="search"
            >
              <template #prepend>
                <q-icon name="event" color="primary" />
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
            >
              <template #prepend>
                <q-icon name="business" color="primary" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3">
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
            >
              <template #prepend>
                <q-icon name="toggle_on" color="primary" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-2">
            <q-btn
              class="full-width action-btn"
              color="primary"
              unelevated
              rounded
              no-caps
              icon="search"
              label="Buscar"
              :loading="tableLoading"
              @click="search"
            />
          </div>
        </div>
      </q-card-section>

      <q-table
        flat
        bordered
        row-key="_id"
        class="termination-table"
        :loading="tableLoading"
        :rows="rows"
        :columns="columns"
        :rows-per-page-options="[limit]"
        hide-pagination
      >
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
                  @click="openViewDialog(props.row)"
                >
                  <q-item-section avatar>
                    <q-avatar color="blue-1" text-color="primary" size="32px">
                      <q-icon name="visibility" size="18px" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>Ver detalle</q-item-label>
                  </q-item-section>
                </q-item>

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

        <template #body-cell-policy="props">
          <q-td :props="props">
            <div class="text-weight-bold">
              Política RD {{ props.row.year }}
            </div>

            <div class="text-caption text-grey-7">
              Versión {{ props.row.version }} · {{ getSalaryBaseLabel(props.row.salaryBaseMode) }}
            </div>
          </q-td>
        </template>

        <template #body-cell-company="props">
          <q-td :props="props">
            <div class="text-weight-bold">
              {{ getCompanyName(props.row.company) }}
            </div>

            <div class="text-caption text-grey-7">
              {{
                props.row.company
                  ? "Política por compañía"
                  : "Política global"
              }}
            </div>
          </q-td>
        </template>

        <template #body-cell-period="props">
          <q-td :props="props">
            <div class="text-weight-bold">
              {{ formatDate(props.row.effectiveFrom) }}
            </div>

            <div class="text-caption text-grey-7">
              hasta
              {{
                props.row.effectiveTo
                  ? formatDate(props.row.effectiveTo)
                  : "indefinido"
              }}
            </div>
          </q-td>
        </template>

        <template #body-cell-rules="props">
          <q-td :props="props">
            <div class="row q-gutter-xs">
              <q-chip
                dense
                color="blue-1"
                text-color="primary"
                icon="schedule"
                class="text-weight-bold"
              >
                Preaviso: {{ props.row.preNoticeBrackets?.length || 0 }}
              </q-chip>

              <q-chip
                dense
                color="green-1"
                text-color="positive"
                icon="payments"
                class="text-weight-bold"
              >
                Cesantía: {{ props.row.severanceBrackets?.length || 0 }}
              </q-chip>

              <q-chip
                dense
                color="orange-1"
                text-color="orange-10"
                icon="rule"
                class="text-weight-bold"
              >
                Tipos: {{ props.row.terminationTypeRules?.length || 0 }}
              </q-chip>
            </div>
          </q-td>
        </template>

        <template #body-cell-benefits="props">
          <q-td :props="props">
            <div class="row q-gutter-xs">
              <q-badge
                rounded
                :color="props.row.christmasSalaryRule?.enabled ? 'positive' : 'grey-5'"
                :label="
                  props.row.christmasSalaryRule?.enabled
                    ? 'Regalía activa'
                    : 'Regalía inactiva'
                "
              />

              <q-badge
                rounded
                :color="props.row.vacationRule?.enabled ? 'positive' : 'grey-5'"
                :label="
                  props.row.vacationRule?.enabled
                    ? 'Vacaciones activas'
                    : 'Vacaciones inactivas'
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

        <template #no-data>
          <div class="full-width text-center q-pa-xl text-grey-7">
            <q-icon name="gavel" size="44px" color="grey-5" />

            <div class="text-subtitle1 text-weight-bold q-mt-sm">
              No hay políticas configuradas
            </div>

            <div class="text-caption">
              Crea una política base para calcular preaviso, cesantía, regalía,
              vacaciones y ajustes manuales.
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

    <LaborTerminationPolicyRDFormDialog
      v-model="dialog.open"
      v-model:form="form"
      :companies="companies"
      :saving="saving"
      :is-edit="dialog.isEdit"
      :read-only="dialog.readOnly"
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
import LaborTerminationPolicyRDFormDialog from "./LaborTerminationPolicyRDFormDialog.vue";

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
  year: new Date().getFullYear(),
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
  readOnly: false,
  id: null,
});

const getDefaultForm = () => ({
  _id: null,
  company: null,
  country: "DO",
  year: new Date().getFullYear(),
  version: 1,
  effectiveFrom: `${new Date().getFullYear()}-01-01`,
  effectiveTo: "",
  salaryBaseMode: "AVERAGE_LAST_12_MONTHS_ORDINARY",
  dailySalaryDivisor: 23.83,

  preNoticeBrackets: [
    {
      fromMonths: 3,
      toMonths: 6,
      days: 7,
      label: "De 3 a 6 meses",
    },
    {
      fromMonths: 6,
      toMonths: 12,
      days: 14,
      label: "Más de 6 meses y hasta 1 año",
    },
    {
      fromMonths: 12,
      toMonths: null,
      days: 28,
      label: "Más de 1 año",
    },
  ],

  severanceBrackets: [
    {
      fromMonths: 3,
      toMonths: 6,
      days: 6,
      mode: "FIXED",
      label: "De 3 a 6 meses",
    },
    {
      fromMonths: 6,
      toMonths: 12,
      days: 13,
      mode: "FIXED",
      label: "Más de 6 meses y menos de 1 año",
    },
    {
      fromMonths: 12,
      toMonths: 60,
      days: 21,
      mode: "PER_YEAR",
      label: "Más de 1 año y menos de 5 años",
    },
    {
      fromMonths: 60,
      toMonths: null,
      days: 23,
      mode: "PER_YEAR",
      label: "Más de 5 años",
    },
  ],

  christmasSalaryRule: {
    enabled: true,
    defaultIncludeOnTermination: true,
    calculationMode: "ORDINARY_SALARY_EARNED_YEAR_TO_DATE_DIVIDED_BY_12",
    accrualSource: "PAYROLL_ACCRUAL",
    minimumWorkedMonthsToPay: 0,
    allowExcludeBeforeProbationEnds: false,
    probationMonths: 3,
    allowManualOverride: true,
    notes:
      "Por defecto se calcula proporcional. Si la empresa quiere excluir antes del período probatorio, debe activarlo explícitamente.",
  },

  vacationRule: {
    enabled: true,
    calculationMode: "VACATION_MODULE",
    defaultIncludeOnTermination: true,
    allowManualOverride: true,
    notes: "Por defecto se toma del módulo actual de vacaciones o acumulados.",
  },

  terminationTypeRules: [
    {
      code: "EMPLOYER_DESAHUCIO",
      label: "Desahucio por parte del empleador",
      description: "",
      includePendingSalary: true,
      includeSeverance: true,
      includePreNotice: true,
      includeVacation: true,
      includeChristmasSalary: true,
      includeEconomicAssistance: false,
      allowManualEarnings: true,
      allowManualDeductions: true,
      deductPreNoticeIfEmployeeDidNotNotify: false,
      requiresReason: true,
      requiresDocument: false,
      requiresApproval: true,
      isActive: true,
    },
    {
      code: "EMPLOYEE_RESIGNATION",
      label: "Renuncia del empleado",
      description: "",
      includePendingSalary: true,
      includeSeverance: false,
      includePreNotice: false,
      includeVacation: true,
      includeChristmasSalary: true,
      includeEconomicAssistance: false,
      allowManualEarnings: true,
      allowManualDeductions: true,
      deductPreNoticeIfEmployeeDidNotNotify: true,
      requiresReason: false,
      requiresDocument: true,
      requiresApproval: true,
      isActive: true,
    },
    {
      code: "EMPLOYER_JUSTIFIED_DISMISSAL",
      label: "Despido justificado",
      description: "",
      includePendingSalary: true,
      includeSeverance: false,
      includePreNotice: false,
      includeVacation: true,
      includeChristmasSalary: true,
      includeEconomicAssistance: false,
      allowManualEarnings: true,
      allowManualDeductions: true,
      deductPreNoticeIfEmployeeDidNotNotify: false,
      requiresReason: true,
      requiresDocument: true,
      requiresApproval: true,
      isActive: true,
    },
    {
      code: "EMPLOYER_UNJUSTIFIED_DISMISSAL",
      label: "Despido injustificado",
      description: "",
      includePendingSalary: true,
      includeSeverance: true,
      includePreNotice: true,
      includeVacation: true,
      includeChristmasSalary: true,
      includeEconomicAssistance: false,
      allowManualEarnings: true,
      allowManualDeductions: true,
      deductPreNoticeIfEmployeeDidNotNotify: false,
      requiresReason: true,
      requiresDocument: true,
      requiresApproval: true,
      isActive: true,
    },
  ],

  manualAdjustmentRules: {
    allowManualEarnings: true,
    allowManualDeductions: true,
    requireReasonForManualAdjustment: true,
    requireApprovalForManualAdjustment: true,
    allowedEarningCodes: [
      "BONUS",
      "COMMISSION",
      "INCENTIVE",
      "PENDING_PAYMENT",
      "MANUAL_ADJUSTMENT",
      "OTHER_EARNING",
    ],
    allowedDeductionCodes: [
      "EMPLOYEE_LOAN",
      "SALARY_ADVANCE",
      "EQUIPMENT_DEDUCTION",
      "ABSENCE_DEDUCTION",
      "MANUAL_DEDUCTION",
      "OTHER_DEDUCTION",
    ],
  },

  roundingMode: "ROUND_2_DECIMALS",
  isActive: true,
  notes: "Política inicial de prestaciones laborales RD.",
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
    field: "year",
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
    name: "period",
    label: "Vigencia",
    field: "effectiveFrom",
    align: "left",
  },
  {
    name: "rules",
    label: "Reglas",
    field: "preNoticeBrackets",
    align: "left",
  },
  {
    name: "benefits",
    label: "Beneficios",
    field: "christmasSalaryRule",
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
  if (!company) return "Global";

  if (typeof company === "string") {
    const found = companies.value.find((item) => item._id === company);
    return found ? companyOptionLabel(found) : company;
  }

  return companyOptionLabel(company);
};

const getSalaryBaseLabel = (value) => {
  const map = {
    AVERAGE_LAST_12_MONTHS_ORDINARY: "Promedio 12 meses",
    CURRENT_SALARY: "Salario actual",
    LAST_SALARY: "Último salario",
    MANUAL: "Manual",
  };

  return map[value] || value || "";
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const setLoading = (value) => {
  tableLoading.value = value;
  emit("loading", value);
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
  setLoading(true);

  try {
    const q = new URLSearchParams();

    q.set("limit", String(limit.value));
    q.set("page", String(initialPagination.value));

    if (filters.value.year) {
      q.set("year", String(filters.value.year));
    }

    if (filters.value.company) {
      q.set("company", filters.value.company);
    }

    if (filters.value.isActive !== null && filters.value.isActive !== "") {
      q.set("isActive", filters.value.isActive);
    }

    const resp = await methodsHttp.getApi(
      `employee-termination/policies?${q.toString()}`,
    );

    if (resp?.ok) {
      rows.value = resp.data || resp.policies || resp.items || [];

      orderQuantity.value =
        Math.ceil(
          Number(resp.total || resp.count || resp.meta?.total || 0) /
            limit.value,
        ) || 1;

      return;
    }

    rows.value = [];
    notify.value?.showNotifyBad(
      resp?.mensaje || "No se pudieron cargar las políticas",
    );
  } catch (error) {
    console.error("getPolicies error:", error);
    notify.value?.showNotifyBad("Error cargando las políticas");
  } finally {
    setLoading(false);
  }
};

const reload = async () => {
  await Promise.all([getCompanies(), getPolicies()]);
};

const search = async () => {
  initialPagination.value = 1;
  initial.value = 0;
  await getPolicies();
};

const clearForm = () => {
  form.value = getDefaultForm();
};

const openCreateDialog = () => {
  clearForm();

  dialog.value = {
    open: true,
    isEdit: false,
    readOnly: false,
    id: null,
  };
};

const openViewDialog = (row) => {
  hydrateForm(row);

  dialog.value = {
    open: true,
    isEdit: true,
    readOnly: true,
    id: row._id,
  };
};

const openEditDialog = (row) => {
  hydrateForm(row);

  dialog.value = {
    open: true,
    isEdit: true,
    readOnly: false,
    id: row._id,
  };
};

const hydrateForm = (row) => {
  const defaultForm = getDefaultForm();

  form.value = {
    ...defaultForm,
    ...JSON.parse(JSON.stringify(row)),
    company: row.company?._id || row.company || null,
    effectiveFrom: formatDate(row.effectiveFrom) || defaultForm.effectiveFrom,
    effectiveTo: formatDate(row.effectiveTo) || "",
    christmasSalaryRule: {
      ...defaultForm.christmasSalaryRule,
      ...(row.christmasSalaryRule || {}),
    },
    vacationRule: {
      ...defaultForm.vacationRule,
      ...(row.vacationRule || {}),
    },
    manualAdjustmentRules: {
      ...defaultForm.manualAdjustmentRules,
      ...(row.manualAdjustmentRules || {}),
    },
    preNoticeBrackets: row.preNoticeBrackets || [],
    severanceBrackets: row.severanceBrackets || [],
    terminationTypeRules: row.terminationTypeRules || [],
  };
};

const closeDialog = () => {
  dialog.value.open = false;
  dialog.value.isEdit = false;
  dialog.value.readOnly = false;
  dialog.value.id = null;
};

const buildPayload = () => {
  const payload = JSON.parse(JSON.stringify(form.value));

  payload.company = payload.company || null;

  payload.year = Number(payload.year || new Date().getFullYear());
  payload.version = Number(payload.version || 1);
  payload.dailySalaryDivisor = Number(payload.dailySalaryDivisor || 23.83);

  payload.effectiveFrom = payload.effectiveFrom
    ? new Date(`${payload.effectiveFrom}T00:00:00`)
    : new Date(`${payload.year}-01-01T00:00:00`);

  payload.effectiveTo = payload.effectiveTo
    ? new Date(`${payload.effectiveTo}T23:59:59`)
    : null;

  payload.preNoticeBrackets = (payload.preNoticeBrackets || []).map((item) => ({
    fromMonths: Number(item.fromMonths || 0),
    toMonths:
      item.toMonths === "" || item.toMonths === null || item.toMonths === undefined
        ? null
        : Number(item.toMonths),
    days: Number(item.days || 0),
    label: item.label || "",
  }));

  payload.severanceBrackets = (payload.severanceBrackets || []).map((item) => ({
    fromMonths: Number(item.fromMonths || 0),
    toMonths:
      item.toMonths === "" || item.toMonths === null || item.toMonths === undefined
        ? null
        : Number(item.toMonths),
    days: Number(item.days || 0),
    mode: item.mode || "FIXED",
    label: item.label || "",
  }));

  payload.christmasSalaryRule.minimumWorkedMonthsToPay = Number(
    payload.christmasSalaryRule.minimumWorkedMonthsToPay || 0,
  );

  payload.christmasSalaryRule.probationMonths = Number(
    payload.christmasSalaryRule.probationMonths || 3,
  );

  delete payload._id;
  delete payload.__v;
  delete payload.createdAt;
  delete payload.updatedAt;
  delete payload.isDeleted;

  return payload;
};

const savePolicy = async () => {
  saving.value = true;
  emit("loading", true);

  try {
    const payload = buildPayload();

    const resp = dialog.value.isEdit
      ? await methodsHttp.putApi(
          `employee-termination/policies/${dialog.value.id}`,
          payload,
        )
      : await methodsHttp.postApi("employee-termination/policies", payload);

    if (resp?.ok) {
      notify.value?.showNotifyGood(resp.mensaje || "Política guardada");
      closeDialog();
      await getPolicies();
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
    const resp = await methodsHttp.putApi(
      `employee-termination/policies/${row._id}`,
      {
        isActive: !row.isActive,
      },
    );

    if (resp?.ok) {
      notify.value?.showNotifyGood(resp.mensaje || "Estado actualizado");
      await getPolicies();
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
    const resp = await methodsHttp.deleteApi(
      `employee-termination/policies/${row._id}`,
    );

    if (resp?.ok) {
      notify.value?.showNotifyGood(resp.mensaje || "Política eliminada");
      await getPolicies();
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
.labor-policy-tab {
  width: 100%;
}

.termination-panel-card {
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

.termination-table {
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