<template>
  <q-dialog v-model="open" persistent>
    <q-card class="selection-card">
      <div class="dialog-header bg-primary row items-center justify-between">
        <div class="header-title text-white">
          <div class="header-icon">
            <q-icon name="groups" size="24px" />
          </div>

          <div>
            <div class="text-h6 text-weight-bold">Empleados de la nómina</div>
            <div class="text-caption">
              Revisa, busca y decide quiénes se incluirán en este cierre.
            </div>
          </div>
        </div>

        <q-btn round dense flat icon="close" color="white" @click="open = false">
          <q-tooltip>Cerrar</q-tooltip>
        </q-btn>
      </div>

      <q-card-section class="dialog-body">
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-5">
            <q-input
              v-model="searchText"
              outlined
              dense
              clearable
              debounce="250"
              label="Buscar empleado"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="search" color="primary" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md">
            <q-select
              v-model="candidateToAdd"
              :options="addOptions"
              :option-label="employeeLabel"
              outlined
              dense
              clearable
              use-input
              input-debounce="350"
              label="Agregar empleado"
              class="rounded-input"
              :loading="loadingAddOptions"
              @filter="filterAddOptions"
            >
              <template #prepend>
                <q-icon name="person_add" color="primary" />
              </template>

              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-avatar size="36px">
                      <img :src="employeeAvatar(scope.opt)" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-bold">
                      {{ employeeLabel(scope.opt) }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ employeeMeta(scope.opt) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-auto">
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="add"
              label="Agregar"
              class="action-btn full-height-btn"
              :disable="!candidateToAdd"
              @click="addCandidate"
            />
          </div>
        </div>

        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-12 col-sm-4">
            <div class="mini-stat">
              <q-icon name="groups" color="primary" />
              <span>Incluidos</span>
              <b>{{ includedCount }}</b>
            </div>
          </div>

          <div class="col-12 col-sm-4">
            <div class="mini-stat">
              <q-icon name="person_off" color="negative" />
              <span>Descartados</span>
              <b>{{ excludedCount }}</b>
            </div>
          </div>

          <div class="col-12 col-sm-4">
            <div class="mini-stat mini-stat--strong">
              <q-icon name="payments" color="positive" />
              <span>Total incluido</span>
              <b>{{ money(includedTotal) }}</b>
            </div>
          </div>
        </div>

        <q-table
          :rows="pagedRows"
          :columns="columns"
          row-key="userId"
          flat
          bordered
          dense
          hide-pagination
          class="employees-table"
          no-data-label="No hay empleados para mostrar."
        >
          <template #body-cell-employee="props">
            <q-td :props="props">
              <div class="employee-cell">
                <q-avatar size="38px">
                  <img :src="employeeAvatar(props.row)" />
                </q-avatar>

                <div class="min-width-0">
                  <div class="employee-name ellipsis">
                    {{ employeeLabel(props.row) }}
                  </div>
                  <div class="employee-email ellipsis">
                    {{ props.row.email || props.row.username || "Sin correo" }}
                  </div>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-scope="props">
            <q-td :props="props">
              <div class="scope-lines">
                <span>{{ props.row.department?.name || props.row.departmentName || "Sin departamento" }}</span>
                <small>
                  {{ props.row.jobPosition?.name || props.row.jobPositionName || "Sin puesto" }}
                  <span v-if="props.row.project?.name || props.row.projectName">
                    · {{ props.row.project?.name || props.row.projectName }}
                  </span>
                </small>
              </div>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="isExcluded(props.row.userId) ? 'negative' : 'positive'"
                class="status-badge"
              >
                {{ isExcluded(props.row.userId) ? "Descartado" : "Incluido" }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                v-if="isExcluded(props.row.userId)"
                flat
                dense
                round
                color="positive"
                icon="undo"
                @click="restoreEmployee(props.row.userId)"
              >
                <q-tooltip>Restaurar empleado</q-tooltip>
              </q-btn>

              <q-btn
                v-else
                flat
                dense
                round
                color="negative"
                icon="person_remove"
                @click="discardEmployee(props.row.userId)"
              >
                <q-tooltip>Descartar de esta nómina</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>

        <div class="row items-center justify-between q-mt-md q-col-gutter-sm">
          <div class="col-12 col-md-auto text-caption text-grey-7">
            Mostrando {{ pagedRows.length }} de {{ filteredRows.length }} empleado(s).
          </div>

          <div class="col-12 col-md-auto">
            <q-pagination
              v-model="page"
              :max="totalPages"
              :max-pages="6"
              direction-links
              boundary-links
              color="primary"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          no-caps
          color="grey-8"
          icon="close"
          label="Cancelar"
          class="action-btn"
          @click="open = false"
        />

        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="check"
          label="Aplicar selección"
          class="action-btn"
          @click="applySelection"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  employees: { type: Array, default: () => [] },
  excludedIds: { type: Array, default: () => [] },
  queryContext: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["update:modelValue", "apply"]);

const fallbackAvatar =
  "https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp";

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const rows = ref([]);
const searchText = ref("");
const page = ref(1);
const rowsPerPage = 8;
const localExcludedIds = ref(new Set());
const candidateToAdd = ref(null);
const addOptions = ref([]);
const loadingAddOptions = ref(false);

const columns = [
  {
    name: "employee",
    label: "Empleado",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "scope",
    label: "Área / puesto",
    field: "departmentName",
    align: "left",
  },
  {
    name: "netoADepositar",
    label: "Total",
    field: "netoADepositar",
    align: "right",
    sortable: true,
    format: (value) => money(value),
  },
  {
    name: "salaryType",
    label: "Tipo pago",
    field: "salaryType",
    align: "center",
    format: (value) => value || "N/A",
  },
  {
    name: "workedHoursPeriod",
    label: "Horas",
    field: "workedHoursPeriod",
    align: "right",
    format: (value, row) => {
      const worked = Number(value || 0).toFixed(2);
      const paid = Number(row?.paidHoursPeriod || 0).toFixed(2);
      return `${worked} / ${paid}`;
    },
  },
  {
    name: "status",
    label: "Estado",
    field: "userId",
    align: "center",
  },
  {
    name: "actions",
    label: "",
    field: "userId",
    align: "right",
  },
];

const employeeId = (employee) => {
  return String(
    employee?.userId ||
      employee?._id ||
      employee?.id ||
      employee?.value ||
      employee?.empleado?._id ||
      "",
  );
};

const normalizeEmployee = (employee) => {
  const id = employeeId(employee);

  return {
    ...employee,
    userId: id,
    name: employee?.name || employee?.label || employee?.empleado?.name || "Empleado",
    email:
      employee?.email ||
      employee?.username ||
      employee?.caption ||
      employee?.empleado?.email ||
      "",
    img: employee?.img || employee?.image || employee?.avatar || "",
    netoADepositar: Number(
      employee?.netoADepositar ||
        employee?.companyPayrollTotal ||
        employee?.netPeriod ||
        0,
    ),
    salaryType:
      employee?.salaryType ||
      employee?.tipoSalario ||
      employee?.salary?.tipoSalario ||
      "",
    workedHoursPeriod: Number(
      employee?.workedHoursPeriod || employee?.salary?.workedHoursPeriod || 0,
    ),
    paidHoursPeriod: Number(
      employee?.paidHoursPeriod || employee?.salary?.paidHoursPeriod || 0,
    ),
  };
};

const employeeLabel = (employee) => {
  return employee?.name || employee?.label || employee?.username || "Empleado";
};

const employeeMeta = (employee) => {
  return [
    employee?.email || employee?.username || employee?.caption || "",
    employee?.department?.name || employee?.departmentName || "",
    employee?.jobPosition?.name || employee?.jobPositionName || "",
    employee?.project?.name || employee?.projectName || "",
  ]
    .filter(Boolean)
    .join(" · ");
};

const employeeAvatar = (employee) => {
  return employee?.img || employee?.image || employee?.avatar || fallbackAvatar;
};

const isExcluded = (id) => {
  return localExcludedIds.value.has(String(id));
};

const filteredRows = computed(() => {
  const needle = String(searchText.value || "").trim().toLowerCase();

  if (!needle) return rows.value;

  return rows.value.filter((row) => {
    return [
      row.name,
      row.email,
      row.username,
      row.department?.name,
      row.departmentName,
      row.jobPosition?.name,
      row.jobPositionName,
      row.project?.name,
      row.projectName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredRows.value.length / rowsPerPage));
});

const pagedRows = computed(() => {
  const start = (page.value - 1) * rowsPerPage;
  return filteredRows.value.slice(start, start + rowsPerPage);
});

const includedRows = computed(() => {
  return rows.value.filter((row) => !isExcluded(row.userId));
});

const includedCount = computed(() => includedRows.value.length);
const excludedCount = computed(() => localExcludedIds.value.size);
const includedTotal = computed(() => {
  return includedRows.value.reduce((sum, row) => {
    return sum + Number(row?.netoADepositar || 0);
  }, 0);
});

const money = (value) => {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const syncState = () => {
  const byId = new Map();

  (props.employees || []).forEach((employee) => {
    const normalized = normalizeEmployee(employee);
    if (normalized.userId) byId.set(normalized.userId, normalized);
  });

  rows.value = Array.from(byId.values());
  localExcludedIds.value = new Set((props.excludedIds || []).map(String));
  searchText.value = "";
  page.value = 1;
  candidateToAdd.value = null;
  addOptions.value = [];
};

const discardEmployee = (id) => {
  const next = new Set(localExcludedIds.value);
  next.add(String(id));
  localExcludedIds.value = next;
};

const restoreEmployee = (id) => {
  const next = new Set(localExcludedIds.value);
  next.delete(String(id));
  localExcludedIds.value = next;
};

const fetchPayrollEmployee = async (employee) => {
  const id = employeeId(employee);

  if (!id || !props.queryContext?.fechaInicio || !props.queryContext?.paymentSchedule) {
    return normalizeEmployee(employee);
  }

  const body = {
    fechaInicio: props.queryContext.fechaInicio,
    page: 1,
    limit: 1,
    paymentSchedule: props.queryContext.paymentSchedule,
    userId: id,
  };

  if (props.queryContext.fechaFin) body.fechaFin = props.queryContext.fechaFin;
  if (props.queryContext.companyId) body.companyId = props.queryContext.companyId;
  if (props.queryContext.departmentId) body.departmentId = props.queryContext.departmentId;
  if (props.queryContext.jobPositionId) body.jobPositionId = props.queryContext.jobPositionId;
  if (props.queryContext.projectId) body.projectId = props.queryContext.projectId;

  const response = await methodsHttp.postApi("punch/getPunchesToPayroll", body);
  const row = Array.isArray(response?.employees) ? response.employees[0] : null;

  return normalizeEmployee(row || employee);
};

const addCandidate = async () => {
  if (!candidateToAdd.value) return;

  loadingAddOptions.value = true;

  try {
    const normalized = await fetchPayrollEmployee(candidateToAdd.value);
    const current = new Map(rows.value.map((row) => [row.userId, row]));

    if (normalized.userId) {
      current.set(normalized.userId, normalized);
      restoreEmployee(normalized.userId);
    }

    rows.value = Array.from(current.values()).sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
    candidateToAdd.value = null;
  } finally {
    loadingAddOptions.value = false;
  }
};

const filterAddOptions = async (value, update, abort) => {
  const text = String(value || "").trim();

  if (text.length > 0 && text.length < 2) {
    update(() => {
      addOptions.value = [];
    });
    return;
  }

  loadingAddOptions.value = true;

  try {
    const query = new URLSearchParams();
    query.set("isActived", "true");
    query.set("limit", "20");
    query.set("initial", "0");

    if (text) query.set("text", text);
    if (props.queryContext.companyId) query.set("company", props.queryContext.companyId);
    if (props.queryContext.departmentId) query.set("department", props.queryContext.departmentId);
    if (props.queryContext.jobPositionId) query.set("jobPosition", props.queryContext.jobPositionId);
    if (props.queryContext.projectId) query.set("project", props.queryContext.projectId);

    const response = await methodsHttp.getApi(`user/getEmployees?${query.toString()}`);
    const items = Array.isArray(response?.employees)
      ? response.employees
      : Array.isArray(response?.users)
        ? response.users
        : Array.isArray(response?.data)
          ? response.data
          : [];

    update(() => {
      addOptions.value = items.map(normalizeEmployee);
    });
  } catch (error) {
    console.error("filterAddOptions error:", error);
    if (abort) abort();
  } finally {
    loadingAddOptions.value = false;
  }
};

const applySelection = () => {
  const excluded = Array.from(localExcludedIds.value);

  emit("apply", {
    employees: rows.value,
    excludedIds: excluded,
    includedIds: includedRows.value.map((row) => row.userId),
  });

  open.value = false;
};

watch(
  () => open.value,
  (value) => {
    if (value) syncState();
  },
);

watch(searchText, () => {
  page.value = 1;
});
</script>

<style scoped>
.selection-card {
  width: 1080px;
  max-width: 98vw;
  max-height: 94vh;
  border-radius: 22px;
  overflow: hidden;
  background: #f8fafc;
}

.dialog-header {
  min-height: 76px;
  padding: 16px 20px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.14);
}

.dialog-body {
  max-height: calc(94vh - 146px);
  overflow-y: auto;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 12px;
  background: #ffffff;
}

.action-btn {
  border-radius: 10px;
}

.full-height-btn {
  min-height: 40px;
}

.mini-stat {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid #e8edf5;
  border-radius: 12px;
  background: #ffffff;
}

.mini-stat span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.mini-stat b {
  margin-left: auto;
  color: #111827;
}

.mini-stat--strong {
  border-color: rgba(33, 186, 69, 0.25);
  background: rgba(33, 186, 69, 0.06);
}

.employees-table {
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
}

.employees-table :deep(.q-table thead tr th) {
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 230px;
}

.employee-name {
  font-weight: 800;
  color: #1f2937;
}

.employee-email,
.scope-lines small {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.scope-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 210px;
}

.scope-lines span {
  font-weight: 700;
  color: #1f2937;
}

.status-badge {
  min-height: 24px;
  padding: 4px 9px;
  border-radius: 999px;
  text-transform: none;
  font-weight: 700;
}

.dialog-actions {
  padding: 12px 16px;
  background: #ffffff;
}

.min-width-0 {
  min-width: 0;
}
</style>
