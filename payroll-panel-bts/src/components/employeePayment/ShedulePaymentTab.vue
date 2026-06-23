<template>
  <div class="payment-schedule-tab">
    <q-card flat bordered class="section-card q-mb-md">
      <div class="tab-header">
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="row items-center q-gutter-sm">
              <q-avatar color="primary" text-color="white" icon="calendar_month" />

              <div>
                <div class="text-subtitle1 text-weight-bold">
                  Horarios de pagos
                </div>
                <div class="text-caption text-grey-7">
                  Crea y configura los días de pago según la frecuencia de nómina.
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
                label="Agregar día de pago"
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
              v-model="frequencyFilter"
              :options="frequencyFilterOptions"
              emit-value
              map-options
              outlined
              dense
              clearable
              color="primary"
              label="Frecuencia"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="event_repeat" />
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
              placeholder="Buscar por nombre, frecuencia o descripción..."
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
            Los filtros se aplican sobre los horarios cargados.
          </div>

          <q-chip
            dense
            color="primary"
            text-color="white"
            icon="database"
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
        no-data-label="No hay horarios de pago registrados"
        no-results-label="No se encontraron horarios de pago"
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
                icon="calendar_month"
              />

              <div>
                <div class="text-weight-medium">
                  {{ props.row.name }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ getFrequencyName(props.row.paymentFrequency) }}
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-paymentFrequency="props">
          <q-td :props="props" class="text-center">
            <q-chip
              dense
              outline
              color="primary"
              text-color="primary"
              icon="event_repeat"
              class="rounded-chip"
            >
              {{ getFrequencyName(props.row.paymentFrequency) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-days="props">
          <q-td :props="props">
            <div class="row q-gutter-xs">
              <q-chip
                v-for="(item, index) in getScheduleDays(props.row)"
                :key="`day-${props.row._id}-${index}`"
                dense
                color="grey-2"
                text-color="grey-9"
                class="day-chip"
              >
                {{ item }}
              </q-chip>

              <span v-if="!getScheduleDays(props.row).length" class="text-grey-6">
                Sin días
              </span>
            </div>
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

    <PaymentScheduleDialog
      v-model="openDialog"
      :is-edit-mode="isEdit"
      :form-data="form"
      :payment-frequencies="paymentFrequency"
      :loading="saving"
      @save="savePaymentSchedule"
    />

    <NotificationsVue ref="notify" />
    <Delete ref="deleteRef" @deleteGood="getAllPaymentSchedules" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Delete from "src/components/utils/Delete.vue";
import PaymentScheduleDialog from "./dialog/PaymentScheduleDialog.vue";

const emit = defineEmits(["loading"]);

const notify = ref(null);
const deleteRef = ref(null);

const openDialog = ref(false);
const isEdit = ref(false);
const currentId = ref("");

const loading = ref(false);
const saving = ref(false);

const rows = ref([]);
const paymentFrequency = ref([]);

const search = ref("");
const statusFilter = ref("all");
const frequencyFilter = ref(null);

const form = ref(getEmptyForm());

const listDay = [
  { value: 1, name: "Domingo" },
  { value: 2, name: "Lunes" },
  { value: 3, name: "Martes" },
  { value: 4, name: "Miércoles" },
  { value: 5, name: "Jueves" },
  { value: 6, name: "Viernes" },
  { value: 7, name: "Sábado" },
];

const statusOptions = [
  { label: "Todos", value: "all" },
  { label: "Activos", value: "active" },
  { label: "Inactivos", value: "inactive" },
];

const frequencyFilterOptions = computed(() => {
  return paymentFrequency.value.map((item) => ({
    label: item.name,
    value: item._id,
  }));
});

const columns = [
  {
    name: "actions",
    label: "Acciones",
    align: "center",
    field: "actions",
  },
  {
    name: "name",
    label: "Horario",
    align: "left",
    field: "name",
    sortable: true,
  },
  {
    name: "paymentFrequency",
    label: "Frecuencia",
    align: "center",
    field: "paymentFrequency",
  },
  {
    name: "days",
    label: "Días",
    align: "left",
    field: "days",
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
      if (!frequencyFilter.value) return true;
      return getId(item.paymentFrequency) === frequencyFilter.value;
    })
    .filter((item) => {
      if (!term) return true;

      const name = item.name?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";
      const frequencyName = getFrequencyName(item.paymentFrequency).toLowerCase();

      return (
        name.includes(term) ||
        description.includes(term) ||
        frequencyName.includes(term)
      );
    });
});

function getEmptyForm() {
  return {
    name: "",
    isActive: true,
    description: "",
    weeklyDays: [],
    payDays: [],
    paymentFrequency: null,
  };
}

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id || "";
};

const getFrequencyName = (frequency) => {
  if (!frequency) return "Sin frecuencia";

  if (typeof frequency === "object") {
    return frequency.name || "Sin frecuencia";
  }

  const found = paymentFrequency.value.find((item) => item._id === frequency);
  return found?.name || "Sin frecuencia";
};

const getFrequencyCode = (frequency) => {
  if (!frequency) return "";

  if (typeof frequency === "object") {
    return String(frequency.code || "").toUpperCase();
  }

  const found = paymentFrequency.value.find((item) => item._id === frequency);
  return String(found?.code || "").toUpperCase();
};

const getScheduleDays = (row) => {
  const code = getFrequencyCode(row.paymentFrequency);

  if (code === "SEMANAL") {
    return Array.isArray(row.weeklyDays)
      ? row.weeklyDays
          .map((day) => listDay.find((item) => item.value === Number(day))?.name)
          .filter(Boolean)
      : [];
  }

  if (code === "MENSUAL") {
    return Array.isArray(row.payDays)
      ? row.payDays.map((day) => `Día ${day}`)
      : [];
  }

  if (code === "QUINCENAL" || code === "QUINCENAL") {
    return Array.isArray(row.payDays)
      ? row.payDays.map((day) => `Día ${day}`)
      : [];
  }

  return Array.isArray(row.payDays)
    ? row.payDays.map((day) => `Día ${day}`)
    : [];
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
    isActive: item.isActive !== false,
    description: item.description || "",
    weeklyDays: Array.isArray(item.weeklyDays) ? [...item.weeklyDays] : [],
    payDays: Array.isArray(item.payDays) ? [...item.payDays] : [],
    paymentFrequency: item.paymentFrequency || null,
  };

  currentId.value = item._id;
  isEdit.value = true;
  openDialog.value = true;
};

const closeDialog = () => {
  openDialog.value = false;
  resetForm();
};

const getAllPaymentSchedules = async () => {
  loading.value = true;
  emit("loading", true);

  try {
    const resp = await methodsHttp.getApi(
      "employee-payment-management/getAllPaymentSchedules"
    );

    if (resp?.ok) {
      rows.value = resp.schedules || [];
    } else {
      rows.value = [];
      notify.value?.showNotifyBad(
        resp?.mensaje || "No se pudieron cargar los horarios de pago."
      );
    }
  } finally {
    loading.value = false;
    emit("loading", false);
  }
};

const getAllPaymentFrecuency = async () => {
  const resp = await methodsHttp.getApi(
    "employee-payment-management/getAllPaymentFrecuency"
  );

  if (resp?.ok) {
    paymentFrequency.value = resp.paymentFrequency || [];
  } else {
    paymentFrequency.value = [];
  }
};

const savePaymentSchedule = async (payload) => {
  saving.value = true;
  emit("loading", true);

  try {
    let resp;

    if (!isEdit.value) {
      resp = await methodsHttp.postApi(
        "employee-payment-management/createPaymentSchedule",
        payload
      );
    } else {
      resp = await methodsHttp.putApi(
        `employee-payment-management/updatePaymentSchedule/${currentId.value}`,
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
    await getAllPaymentSchedules();
  } finally {
    saving.value = false;
    emit("loading", false);
  }
};

const openDelete = (item) => {
  const data = {
    id: item._id,
    ruta: `employee-payment-management/deletePaymentSchedule/${item._id}`,
  };

  deleteRef.value?.openDelete(data, "Horario de pago");
};

const reload = async () => {
  await Promise.all([getAllPaymentSchedules(), getAllPaymentFrecuency()]);
};

onMounted(() => {
  reload();
});

defineExpose({
  reload,
});
</script>

<style scoped>
.payment-schedule-tab {
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
.rounded-chip,
.day-chip {
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