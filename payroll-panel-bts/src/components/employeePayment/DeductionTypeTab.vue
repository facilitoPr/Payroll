<template>
  <div class="deduction-type-tab">
    <q-card flat bordered class="section-card q-mb-md">
      <div class="tab-header">
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="row items-center q-gutter-sm">
              <q-avatar color="primary" text-color="white" icon="price_check" />

              <div>
                <div class="text-subtitle1 text-weight-bold">Deducciones</div>
                <div class="text-caption text-grey-7">
                  Crea y configura las deducciones aplicables a la nómina.
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
                label="Agregar deducción"
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
            <q-select
              v-model="legalFilter"
              :options="legalOptions"
              emit-value
              map-options
              outlined
              dense
              color="primary"
              label="Bajo ley"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="gavel" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md">
            <q-input
              v-model="search"
              outlined
              dense
              clearable
              debounce="300"
              color="primary"
              placeholder="Buscar por nombre, código o descripción..."
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
            Los filtros se aplican sobre las deducciones cargadas.
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
        no-data-label="No hay deducciones registradas"
        no-results-label="No se encontraron deducciones"
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

        <template #body-cell-name="props">
          <q-td :props="props">
            <div class="row items-center no-wrap q-gutter-sm">
              <q-avatar
                size="36px"
                color="primary"
                text-color="white"
                icon="price_check"
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

        <template #body-cell-isLegal="props">
          <q-td :props="props" class="text-center">
            <q-badge
              rounded
              :color="props.row.isLegal ? 'secondary' : 'grey-6'"
              :label="props.row.isLegal ? 'SÍ' : 'NO'"
              class="status-badge"
            />
          </q-td>
        </template>

        <template #body-cell-deducibleIsr="props">
          <q-td :props="props" class="text-center">
            <q-badge
              rounded
              :color="props.row.deducibleIsr ? 'primary' : 'grey-6'"
              :label="props.row.deducibleIsr ? 'SÍ' : 'NO'"
              class="status-badge"
            />
          </q-td>
        </template>

        <template #body-cell-percentage="props">
          <q-td :props="props" class="text-right">
            <q-chip
              dense
              outline
              color="primary"
              text-color="primary"
              class="rounded-chip"
            >
              {{ formatPercentage(props.row.percentage) }}%
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-fixedAmount="props">
          <q-td :props="props" class="text-right">
            <span class="text-weight-bold text-secondary">$</span>
            {{ money.formatter(Number(props.row.fixedAmount || 0)) }}
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

        <template #body-cell-description="props">
          <q-td :props="props">
            <div class="description-cell">
              {{ props.row.description || "Sin descripción" }}
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <DeductionTypeDialog
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
import money from "src/components/utils/formatter";
import Delete from "src/components/utils/Delete.vue";
import DeductionTypeDialog from "./dialog/DeductionTypeDialog.vue";

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
const legalFilter = ref("all");

const form = ref(getEmptyForm());

const statusOptions = [
  { label: "Todos", value: "all" },
  { label: "Activos", value: "active" },
  { label: "Inactivos", value: "inactive" },
];

const legalOptions = [
  { label: "Todos", value: "all" },
  { label: "Bajo ley", value: "legal" },
  { label: "No reglamentarias", value: "notLegal" },
];

const columns = [
  {
    name: "actions",
    label: "Acciones",
    align: "center",
    field: "actions",
  },
  {
    name: "name",
    label: "Deducción",
    align: "left",
    field: "name",
    sortable: true,
  },
  {
    name: "isLegal",
    label: "Bajo ley",
    align: "center",
    field: "isLegal",
    sortable: true,
  },
  {
    name: "deducibleIsr",
    label: "Reduce ISR",
    align: "center",
    field: "deducibleIsr",
    sortable: true,
  },
  {
    name: "percentage",
    label: "Porcentaje",
    align: "right",
    field: "percentage",
    sortable: true,
  },
  {
    name: "fixedAmount",
    label: "Monto fijo",
    align: "right",
    field: "fixedAmount",
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
    name: "description",
    label: "Descripción",
    align: "left",
    field: "description",
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
      if (legalFilter.value === "legal") return item.isLegal === true;
      if (legalFilter.value === "notLegal") return item.isLegal === false;
      return true;
    })
    .filter((item) => {
      if (!term) return true;

      const name = item.name?.toLowerCase() || "";
      const code = item.code?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";

      return (
        name.includes(term) ||
        code.includes(term) ||
        description.includes(term)
      );
    });
});

function getEmptyForm() {
  return {
    name: "",
    code: "",
    isLegal: false,
    percentage: 0,
    isActive: true,
    deducibleIsr: false,
    fixedAmount: 0,
    description: "",
  };
}

const formatPercentage = (value) => {
  const number = Number(value || 0);

  if (Number.isInteger(number)) return number;

  return number.toFixed(2);
};

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
    name: item.name || "",
    code: item.code || "",
    isLegal: !!item.isLegal,
    percentage: Number(item.percentage || 0),
    isActive: item.isActive !== false,
    fixedAmount: Number(item.fixedAmount || 0),
    description: item.description || "",
    deducibleIsr: !!item.deducibleIsr,
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
      "employee-payment-management/getDeductionTypeAdmin"
    );

    if (resp?.ok) {
      rows.value = resp.deductionType || [];
    } else {
      rows.value = [];
      notify.value?.showNotifyBad(
        resp?.mensaje || "No se pudieron cargar las deducciones."
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
        "employee-payment-management/createDeductionType",
        payload
      );
    } else {
      resp = await methodsHttp.putApi(
        `employee-payment-management/updateDeductionType/${currentId.value}`,
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

const openDelete = (item) => {
  const data = {
    id: item._id,
    ruta: `employee-payment-management/deleteDeductionType/${item._id}`,
  };

  deleteRef.value?.openDelete(data, "Deducción");
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
.deduction-type-tab {
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

.description-cell {
  max-width: 420px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #4b5563;
}
</style>