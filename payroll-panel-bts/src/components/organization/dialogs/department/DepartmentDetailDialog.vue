<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="department-detail-dialog">
      <q-card-section class="dialog-header row items-start justify-between">
        <div class="row items-center q-gutter-sm">
          <q-avatar color="white" text-color="primary" icon="apartment" />

          <div>
            <div class="text-h6 text-weight-bold">
              Detalle del departamento
            </div>
            <div class="text-caption text-blue-1">
              {{ department?.name || "Departamento" }}
              <span v-if="department?.code"> — {{ department.code }}</span>
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          color="white"
          @click="close"
        />
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-tabs
          v-model="tab"
          dense
          align="left"
          class="text-primary detail-tabs"
          active-color="primary"
          indicator-color="primary"
          narrow-indicator
        >
          <q-tab name="summary" icon="dashboard" label="Resumen" />
          <q-tab name="positions" icon="work" label="Puestos" />
          <q-tab name="employees" icon="groups" label="Integrantes" />
          <q-tab name="managers" icon="supervisor_account" label="Gerentes" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="summary">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-card flat bordered class="summary-card">
                  <q-avatar color="primary" text-color="white" icon="business" />

                  <div>
                    <div class="text-caption text-grey-7">
                      Compañía
                    </div>
                    <div class="text-subtitle2 text-weight-bold">
                      {{ department?.companyLabel || "Sin compañía" }}
                    </div>
                  </div>
                </q-card>
              </div>

              <div class="col-12 col-md-4">
                <q-card flat bordered class="summary-card">
                  <q-avatar color="secondary" text-color="white" icon="work" />

                  <div>
                    <div class="text-caption text-grey-7">
                      Puestos
                    </div>
                    <div class="text-subtitle2 text-weight-bold">
                      {{ positions.length }}
                    </div>
                  </div>
                </q-card>
              </div>

              <div class="col-12 col-md-4">
                <q-card flat bordered class="summary-card">
                  <q-avatar color="primary" text-color="white" icon="groups" />

                  <div>
                    <div class="text-caption text-grey-7">
                      Integrantes
                    </div>
                    <div class="text-subtitle2 text-weight-bold">
                      {{ employees.length }}
                    </div>
                  </div>
                </q-card>
              </div>

              <div class="col-12">
                <q-card flat bordered class="description-card">
                  <div class="text-subtitle2 text-weight-bold q-mb-xs">
                    Descripción
                  </div>

                  <div class="text-body2 text-grey-8">
                    {{ department?.description || "Sin descripción registrada." }}
                  </div>
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="positions">
            <q-card flat bordered class="inner-card">
              <div class="row items-center justify-between q-pa-md">
                <div>
                  <div class="text-subtitle2 text-weight-bold">
                    Puestos de trabajo
                  </div>
                  <div class="text-caption text-grey-7">
                    Puestos creados dentro de este departamento.
                  </div>
                </div>

                <q-chip dense color="primary" text-color="white">
                  {{ positions.length }}
                </q-chip>
              </div>

              <q-separator />

              <q-table
                :rows="positions"
                :columns="positionColumns"
                row-key="_id"
                flat
                :loading="loadingPositions"
                :pagination="{ rowsPerPage: 8 }"
                no-data-label="No hay puestos registrados para este departamento"
              >
                <template #body-cell-name="props">
                  <q-td :props="props">
                    <div class="row items-center q-gutter-sm no-wrap">
                      <q-avatar
                        size="32px"
                        color="primary"
                        text-color="white"
                        icon="work"
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

                <template #body-cell-modality="props">
                  <q-td :props="props">
                    <q-badge
                      rounded
                      outline
                      color="primary"
                      :label="props.row.modality || 'Onsite'"
                    />
                  </q-td>
                </template>

                <template #body-cell-status="props">
                  <q-td :props="props">
                    <q-badge
                      rounded
                      :color="props.row.isActive ? 'secondary' : 'negative'"
                      :label="props.row.isActive ? 'ACTIVO' : 'INACTIVO'"
                    />
                  </q-td>
                </template>
              </q-table>
            </q-card>
          </q-tab-panel>

          <q-tab-panel name="employees">
            <q-card flat bordered class="inner-card">
              <div class="row items-center justify-between q-pa-md">
                <div>
                  <div class="text-subtitle2 text-weight-bold">
                    Integrantes
                  </div>
                  <div class="text-caption text-grey-7">
                    Empleados asignados a este departamento.
                  </div>
                </div>

                <q-chip dense color="primary" text-color="white">
                  {{ employees.length }}
                </q-chip>
              </div>

              <q-separator />

              <q-table
                :rows="employees"
                :columns="employeeColumns"
                row-key="_id"
                flat
                :loading="loadingEmployees"
                :pagination="{ rowsPerPage: 8 }"
                no-data-label="No hay empleados asignados a este departamento"
              />
            </q-card>
          </q-tab-panel>

          <q-tab-panel name="managers">
            <q-card flat bordered class="manager-card">
              <div class="row q-col-gutter-md items-start">
                <div class="col-12 col-md">
                  <div class="text-subtitle2 text-weight-bold">
                    Gerentes del departamento
                  </div>

                  <div class="text-caption text-grey-7 q-mb-md">
                    Selecciona uno o varios gerentes entre los integrantes del
                    departamento.
                  </div>

                  <q-select
                    v-model="managersModel"
                    outlined
                    dense
                    multiple
                    use-chips
                    emit-value
                    map-options
                    option-label="name"
                    option-value="_id"
                    :options="employees"
                    color="primary"
                    label="Selecciona gerentes"
                    class="rounded-input"
                  >
                    <template #prepend>
                      <q-icon name="supervisor_account" />
                    </template>
                  </q-select>
                </div>

                <div class="col-12 col-md-auto">
                  <q-btn
                    unelevated
                    rounded
                    color="primary"
                    icon="save"
                    label="Guardar gerentes"
                    class="save-manager-btn"
                    :loading="savingManagers"
                    :disable="!department?._id"
                    @click="emit('save-managers')"
                  />
                </div>
              </div>
            </q-card>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  department: {
    type: Object,
    default: null,
  },
  employees: {
    type: Array,
    default: () => [],
  },
  positions: {
    type: Array,
    default: () => [],
  },
  selectedManagers: {
    type: Array,
    default: () => [],
  },
  loadingEmployees: {
    type: Boolean,
    default: false,
  },
  loadingPositions: {
    type: Boolean,
    default: false,
  },
  savingManagers: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "update:selectedManagers",
  "save-managers",
]);

const tab = ref("summary");

const managersModel = computed({
  get() {
    return props.selectedManagers;
  },
  set(value) {
    emit("update:selectedManagers", value);
  },
});

const employeeColumns = [
  {
    name: "name",
    label: "Nombre",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "email",
    label: "Email",
    field: "email",
    align: "left",
  },
  {
    name: "jobPosition",
    label: "Puesto",
    field: (row) => row.jobPosition?.name || row.jobPosition || "Sin puesto",
    align: "left",
  },
];

const positionColumns = [
  {
    name: "name",
    label: "Puesto",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "modality",
    label: "Modalidad",
    field: "modality",
    align: "center",
  },
  {
    name: "employmentType",
    label: "Tipo",
    field: "employmentType",
    align: "center",
  },
  {
    name: "status",
    label: "Estado",
    field: "isActive",
    align: "center",
  },
];

const close = () => {
  emit("update:modelValue", false);
};
</script>

<style scoped>
.department-detail-dialog {
  width: 1050px;
  max-width: 96vw;
  border-radius: 22px;
  overflow: hidden;
}

.dialog-header {
  background: var(--q-primary);
  color: white;
  padding: 18px 20px;
}

.detail-tabs {
  padding: 4px 12px 0;
}

.summary-card,
.description-card,
.inner-card,
.manager-card {
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.summary-card {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 92px;
}

.description-card,
.manager-card {
  padding: 16px;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
}

.save-manager-btn {
  min-height: 40px;
  margin-top: 28px;
  text-transform: none;
  font-weight: 600;
}

@media (max-width: 600px) {
  .save-manager-btn {
    width: 100%;
    margin-top: 0;
  }
}
</style>