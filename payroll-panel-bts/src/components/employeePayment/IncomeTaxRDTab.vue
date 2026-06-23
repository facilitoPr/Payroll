<template>
  <div class="income-tax-tab">
    <q-card flat bordered class="section-card q-mb-md">
      <div class="tab-header">
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="row items-center q-gutter-sm">
              <q-avatar color="primary" text-color="white" icon="account_balance" />

              <div>
                <div class="text-subtitle1 text-weight-bold">
                  Impuestos sobre la renta (ISR)
                </div>
                <div class="text-caption text-grey-7">
                  Configura las tablas anuales del ISR y sus tramos fiscales.
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-auto">
            <div class="row q-gutter-sm justify-end">
              <q-btn
                outline
                rounded
                color="primary"
                icon="refresh"
                label="Recargar"
                class="action-btn"
                :loading="loading"
                @click="reload"
              />

              <q-btn
                unelevated
                rounded
                color="primary"
                icon="add"
                label="Agregar ISR"
                class="action-btn"
                @click="openCreate"
              />
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md">
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
            >
              <template #prepend>
                <q-icon name="filter_alt" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3">
            <q-input
              v-model.number="yearFilter"
              outlined
              dense
              clearable
              type="number"
              color="primary"
              label="Año"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="calendar_month" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md">
            <q-input
              v-model="search"
              outlined
              dense
              clearable
              debounce="300"
              color="primary"
              placeholder="Buscar por año, versión o notas..."
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>

        <div class="row items-center justify-between q-mt-md">
          <div class="text-caption text-grey-7">
            Los filtros se aplican sobre las tablas ISR cargadas.
          </div>

          <q-chip
            dense
            color="primary"
            text-color="white"
            class="summary-chip"
          >
            Total: {{ filteredRows.length }}
          </q-chip>
        </div>
      </div>
    </q-card>

    <q-card flat bordered class="table-card">
      <q-table
        :rows="filteredRows"
        :columns="columns"
        row-key="_id"
        flat
        :loading="loading"
        :pagination="{ rowsPerPage: 10 }"
        :rows-per-page-options="[10, 20, 50, 100]"
        no-data-label="No hay tablas ISR registradas"
        no-results-label="No se encontraron tablas ISR"
        class="modern-table"
      >
        <template #body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <div class="row justify-center q-gutter-xs no-wrap">
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
                icon="check_circle"
                color="secondary"
                class="table-action-btn"
                :disable="props.row.isActive"
                @click="activate(props.row)"
              >
                <q-tooltip>
                  {{ props.row.isActive ? "Ya está activa" : "Activar" }}
                </q-tooltip>
              </q-btn>

              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                class="table-action-btn"
                @click="openDelete(props.row)"
              >
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <template #body-cell-year="props">
          <q-td :props="props" class="text-center">
            <div class="row items-center justify-center q-gutter-sm no-wrap">
              <q-avatar
                size="34px"
                color="primary"
                text-color="white"
                icon="calendar_month"
              />

              <div>
                <div class="text-weight-medium">
                  {{ props.row.year }}
                </div>
                <div class="text-caption text-grey-7">
                  Versión {{ props.row.version || 1 }}
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-exemptAmount="props">
          <q-td :props="props" class="text-right">
            <span class="text-weight-bold text-secondary">$</span>
            {{ money.formatter(Number(props.row.exemptAmount || 0)) }}
          </q-td>
        </template>

        <template #body-cell-brackets="props">
          <q-td :props="props" class="text-center">
            <q-chip
              dense
              outline
              color="primary"
              text-color="primary"
              icon="segment"
              class="rounded-chip"
            >
              {{ props.row.brackets?.length || 0 }} tramos
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-isActive="props">
          <q-td :props="props" class="text-center">
            <q-badge
              rounded
              :color="props.row.isActive ? 'secondary' : 'negative'"
              :label="props.row.isActive ? 'ACTIVA' : 'INACTIVA'"
              class="status-badge"
            />
          </q-td>
        </template>

        <template #body-cell-notes="props">
          <q-td :props="props">
            <div class="notes-cell">
              {{ props.row.notes || "Sin notas" }}
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <IncomeTaxRDDialog
      v-model="openDialog"
      :is-edit-mode="isEdit"
      :form-data="form"
      :loading="saving"
      @save="save"
    />

    <NotificationsVue ref="notify" />
    <Delete ref="deleteRef" @deleteGood="getAll" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Delete from "src/components/utils/Delete.vue";
import money from "src/components/utils/formatter";
import IncomeTaxRDDialog from "./dialog/IncomeTaxRDDialog.vue";

const emit = defineEmits(["loading"]);

const notify = ref(null);
const deleteRef = ref(null);

const openDialog = ref(false);
const isEdit = ref(false);
const currentId = ref("");

const loading = ref(false);
const saving = ref(false);

const rows = ref([]);
const search = ref("");
const statusFilter = ref("all");
const yearFilter = ref(null);

const form = ref(getEmptyForm());

const statusOptions = [
  { label: "Todas", value: "all" },
  { label: "Activas", value: "active" },
  { label: "Inactivas", value: "inactive" },
];

const columns = [
  {
    name: "actions",
    label: "Acciones",
    align: "center",
    field: "actions",
  },
  {
    name: "year",
    label: "Año",
    align: "center",
    field: "year",
    sortable: true,
  },
  {
    name: "exemptAmount",
    label: "Monto exento",
    align: "right",
    field: "exemptAmount",
    sortable: true,
  },
  {
    name: "brackets",
    label: "Tramos",
    align: "center",
    field: (row) => row.brackets?.length || 0,
    sortable: true,
  },
  {
    name: "isActive",
    label: "Estado",
    align: "center",
    field: "isActive",
    sortable: true,
  },
  {
    name: "notes",
    label: "Notas",
    align: "left",
    field: "notes",
  },
];

const filteredRows = computed(() => {
  const term = search.value?.toLowerCase().trim();

  return rows.value
    .filter((item) => {
      if (statusFilter.value === "active") return item.isActive === true;
      if (statusFilter.value === "inactive") return item.isActive === false;
      return true;
    })
    .filter((item) => {
      if (!yearFilter.value) return true;
      return Number(item.year) === Number(yearFilter.value);
    })
    .filter((item) => {
      if (!term) return true;

      const year = String(item.year || "").toLowerCase();
      const version = String(item.version || "").toLowerCase();
      const notes = item.notes?.toLowerCase() || "";

      return (
        year.includes(term) ||
        version.includes(term) ||
        notes.includes(term)
      );
    });
});

function getEmptyForm() {
  return {
    year: new Date().getFullYear(),
    exemptAmount: 0,
    version: 1,
    isActive: true,
    notes: "",
    brackets: [],
  };
}

const resetForm = () => {
  form.value = getEmptyForm();
  currentId.value = "";
  isEdit.value = false;
};

const openCreate = () => {
  resetForm();
  openDialog.value = true;
};

const openEdit = (item) => {
  form.value = {
    year: Number(item.year || new Date().getFullYear()),
    exemptAmount: Number(item.exemptAmount || 0),
    version: Number(item.version || 1),
    isActive: item.isActive !== false,
    notes: item.notes || "",
    brackets: Array.isArray(item.brackets)
      ? item.brackets.map((bracket) => ({
          from: Number(bracket.from || 0),
          to:
            bracket.to === null ||
            bracket.to === undefined ||
            bracket.to === ""
              ? null
              : Number(bracket.to),
          rate: Number(bracket.rate || 0),
          fixedAmount: Number(bracket.fixedAmount || 0),
          label: bracket.label || "",
        }))
      : [],
  };

  currentId.value = item._id;
  isEdit.value = true;
  openDialog.value = true;
};

const closeDialog = () => {
  openDialog.value = false;
  resetForm();
};

const getAll = async () => {
  loading.value = true;
  emit("loading", true);

  try {
    const resp = await methodsHttp.getApi(
      "employee-payment-management/getIncomeTaxRD"
    );

    if (resp?.ok) {
      rows.value = resp.records || resp.data || [];
    } else {
      rows.value = [];
      notify.value?.showNotifyBad(
        resp?.mensaje || "No se pudieron cargar las tablas ISR."
      );
    }
  } finally {
    loading.value = false;
    emit("loading", false);
  }
};

const save = async (payload) => {
  saving.value = true;
  emit("loading", true);

  try {
    let resp;

    if (!isEdit.value) {
      resp = await methodsHttp.postApi(
        "employee-payment-management/createIncomeTaxRD",
        payload
      );
    } else {
      resp = await methodsHttp.putApi(
        `employee-payment-management/updateIncomeTaxRD/${currentId.value}`,
        payload
      );
    }

    if (!resp?.ok) {
      notify.value?.showNotifyBad(resp?.mensaje || "No se pudo guardar.");
      return;
    }

    notify.value?.showNotifyGood(
      resp.mensaje || (isEdit.value ? "Actualizado" : "Creado")
    );

    closeDialog();
    await getAll();
  } finally {
    saving.value = false;
    emit("loading", false);
  }
};

const activate = async (item) => {
  if (!item?._id || item.isActive) return;

  loading.value = true;
  emit("loading", true);

  try {
    const resp = await methodsHttp.putApi(
      `employee-payment-management/activateIncomeTaxRD/${item._id}`,
      {}
    );

    if (!resp?.ok) {
      notify.value?.showNotifyBad(resp?.mensaje || "No se pudo activar.");
      return;
    }

    notify.value?.showNotifyGood(resp.mensaje || "ISR activado.");
    await getAll();
  } finally {
    loading.value = false;
    emit("loading", false);
  }
};

const openDelete = (item) => {
  const data = {
    id: item._id,
    ruta: `employee-payment-management/deleteIncomeTaxRD/${item._id}`,
  };

  deleteRef.value?.openDelete(data, "ISR");
};

const reload = async () => {
  await getAll();
};

onMounted(() => {
  getAll();
});

defineExpose({
  reload,
});
</script>

<style scoped>
.income-tax-tab {
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

.tab-header {
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

.summary-chip,
.rounded-chip {
  border-radius: 999px;
}

.notes-cell {
  max-width: 420px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #4b5563;
}
</style>