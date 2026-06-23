<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card style="width: 1040px; max-width: 96vw" class="rounded-card">
      <q-card-section class="row items-center justify-between dialog-header">
        <div class="row items-center header-content">
          <div class="header-icon-wrap">
            <q-icon size="lg" name="groups" color="white" />
          </div>
          <div class="text-h6 text-weight-bold text-white text-uppercase">
            ASIGNAR EMPLEADOS
          </div>
        </div>

        <q-btn
          size="sm"
          round
          dense
          icon="close"
          class="bg-white text-primary"
          @click="closeDialog"
        />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-8">
            <q-select
              v-model="selectedEmployeeIds"
              :options="employeeOptions"
              multiple
              use-chips
              emit-value
              map-options
              outlined
              dense
              rounded
              clearable
              label="Seleccionar empleados"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="employeeSearch"
              outlined
              dense
              rounded
              clearable
              label="Buscar empleado"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="assignForm.availableFrom"
              type="date"
              label="Disponible desde"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="assignForm.availableUntil"
              type="date"
              label="Disponible hasta"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="assignForm.dueDate"
              type="date"
              label="Fecha límite"
              outlined
              dense
              rounded
            />
          </div>
        </div>

        <q-card flat bordered class="rounded-card employee-list-card">
          <q-card-section class="q-pa-none">
            <div class="employee-list">
              <div
                v-for="employee in filteredEmployees"
                :key="employee._id"
                class="employee-item"
              >
                <q-checkbox
                  :model-value="selectedEmployeeIds.includes(employee._id)"
                  color="primary"
                  @update:model-value="toggleEmployee(employee._id)"
                />

                <div class="employee-avatar">
                  <q-icon name="person" color="primary" size="24px" />
                </div>

                <div class="employee-content">
                  <div class="text-body1 text-weight-medium">
                    {{ employee.name || employee.fullname || "Sin nombre" }}
                  </div>
                  <div class="text-caption text-grey-7">
                    {{ employee.email || employee.identificationNumber || "-" }}
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <div class="text-caption text-grey-7 q-mt-sm">
          Seleccionados: {{ selectedEmployeeIds.length }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancelar"
          icon="cancel"
          color="negative"
          @click="closeDialog"
        />
        <q-btn
          color="primary"
          unelevated
          label="Asignar"
          icon="how_to_reg"
          :disable="!selectedEmployeeIds.length"
          @click="saveAssignments"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { useTrainingAdmin } from "src/composable/useTrainingAdmin";

const props = defineProps<{
  modelValue: boolean;
  trainingId: string | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const { getEmployees, assignUsers } = useTrainingAdmin();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const employees = ref<any[]>([]);
const selectedEmployeeIds = ref<string[]>([]);
const employeeSearch = ref("");

const assignForm = reactive({
  availableFrom: "",
  availableUntil: "",
  dueDate: "",
});

const employeeOptions = computed(() =>
  employees.value.map((employee) => ({
    label: employee.name || employee.fullname || employee.email || "Empleado",
    value: employee._id,
  })),
);

const filteredEmployees = computed(() => {
  const term = employeeSearch.value.trim().toLowerCase();
  if (!term) return employees.value;

  return employees.value.filter((employee) => {
    const text = [
      employee.name,
      employee.fullname,
      employee.email,
      employee.identificationNumber,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(term);
  });
});

const notifyError = (message: string) => {
  $q.notify({ type: "negative", message });
};

const notifySuccess = (message: string) => {
  $q.notify({ type: "positive", message });
};

const resetForm = () => {
  selectedEmployeeIds.value = [];
  employeeSearch.value = "";
  assignForm.availableFrom = "";
  assignForm.availableUntil = "";
  assignForm.dueDate = "";
};

const loadEmployees = async () => {
  try {
    const resp = await getEmployees();
    employees.value = resp.employees || [];
  } catch (error: any) {
    notifyError(error.message || "No se pudieron cargar los empleados");
  }
};

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      resetForm();
      await loadEmployees();
    }
  },
  { immediate: true },
);

const toggleEmployee = (employeeId: string) => {
  const exists = selectedEmployeeIds.value.includes(employeeId);

  if (exists) {
    selectedEmployeeIds.value = selectedEmployeeIds.value.filter(
      (id) => id !== employeeId,
    );
  } else {
    selectedEmployeeIds.value = [...selectedEmployeeIds.value, employeeId];
  }
};

const closeDialog = () => {
  emit("update:modelValue", false);
};

const saveAssignments = async () => {
  if (!props.trainingId) return;

  try {
    await assignUsers(props.trainingId, {
      userIds: selectedEmployeeIds.value,
      availableFrom: assignForm.availableFrom || null,
      availableUntil: assignForm.availableUntil || null,
      dueDate: assignForm.dueDate || null,
    });

    notifySuccess("Usuarios asignados con éxito");
    emit("saved");
  } catch (error: any) {
    notifyError(error.message || "No se pudieron asignar los usuarios");
  }
};
</script>

<style scoped>
.rounded-card {
  border-radius: 20px;
}

.dialog-header {
  background: var(--q-primary);
  color: white;
}

.header-content {
  gap: 12px;
}

.header-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}

.employee-list-card {
  background: white;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

.employee-list {
  max-height: 420px;
  overflow: auto;
}

.employee-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #eef2f7;
}

.employee-avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.employee-content {
  min-width: 0;
}
</style>