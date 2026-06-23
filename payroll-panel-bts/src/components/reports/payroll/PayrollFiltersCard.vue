<template>
  <q-card flat bordered class="filters-card q-mb-md">
    <q-card-section class="filters-header">
      <div class="row items-start justify-between q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="filters-title">
            <q-icon name="tune" color="primary" size="22px" />
            <div>
              <div class="text-subtitle1 text-weight-bold">
                Filtros del reporte
              </div>
              <div class="text-caption text-grey-7">
                Filtra por empresa, departamento, puesto, proyecto, empleado y
                frecuencia de pago.
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-auto">
          <div class="row q-col-gutter-sm justify-end">
            <div class="col-12 col-sm-auto">
              <q-btn
                outline
                no-caps
                class="action-btn full-width"
                color="primary"
                icon="auto_fix_high"
                label="Rango sugerido"
                :disable="!paymentScheduleSelected?._id"
                @click="emit('apply-suggested-range')"
              />
            </div>

            <div class="col-12 col-sm-auto">
              <q-btn
                unelevated
                no-caps
                class="action-btn action-btn--primary full-width"
                icon="search"
                label="Buscar"
                :loading="isLoading"
                @click="emit('buscar')"
              />
            </div>
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pa-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-lg-2">
          <q-input
            :model-value="filtros.fechaInicio"
            @update:model-value="setFechaInicio"
            label="Fecha inicio"
            type="date"
            outlined
            dense
            class="filter-control"
          >
            <template #prepend>
              <q-icon name="event" color="primary" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6 col-lg-2">
          <q-input
            :model-value="filtros.fechaFin"
            @update:model-value="setFechaFin"
            label="Fecha fin"
            type="date"
            outlined
            dense
            class="filter-control"
          >
            <template #prepend>
              <q-icon name="event_available" color="primary" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-md-6 col-lg-4" v-if="canViewAdminFilters">
          <q-select
            :model-value="companySelected"
            @update:model-value="(v) => emit('update:companySelected', v)"
            :options="companyOptions"
            :option-label="getCompanyLabel"
            option-value="_id"
            outlined
            dense
            use-input
            input-debounce="250"
            clearable
            label="Empresa"
            class="filter-control"
            @filter="(val, update) => emit('filter-companies', val, update)"
            popup-content-class="q-pa-none"
          >
            <template #prepend>
              <q-icon name="business" color="primary" />
            </template>

            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-avatar
                    color="primary"
                    text-color="white"
                    icon="business"
                  />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-bold">
                    {{ getCompanyLabel(scope.opt) }}
                  </q-item-label>

                  <q-item-label caption v-if="scope.opt?.taxId || scope.opt?.rnc || scope.opt?.code">
                    {{ scope.opt.taxId || scope.opt.rnc || scope.opt.code }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <template #selected-item="scope">
              <div class="row items-center no-wrap">
                <q-icon name="business" color="primary" class="q-mr-sm" />
                <div class="ellipsis">{{ getCompanyLabel(scope.opt) }}</div>
              </div>
            </template>

            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">
                  No se encontraron empresas
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-md-6 col-lg-4">
          <q-select
            :model-value="departmentSelected"
            @update:model-value="(v) => emit('update:departmentSelected', v)"
            :options="departmentOptions"
            option-label="name"
            option-value="_id"
            outlined
            dense
            use-input
            input-debounce="250"
            clearable
            label="Departamento"
            class="filter-control"
            :disable="canViewAdminFilters && !companySelected"
            @filter="(val, update) => emit('filter-department', val, update)"
            popup-content-class="q-pa-none"
          >
            <template #prepend>
              <q-icon name="domain" color="primary" />
            </template>

            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-avatar color="blue-grey-1" text-color="primary">
                    <q-icon name="domain" />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-bold">
                    {{ scope.opt?.name || "Departamento" }}
                  </q-item-label>

                  <q-item-label caption v-if="scope.opt?.code">
                    Código: {{ scope.opt.code }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">
                  {{
                    canViewAdminFilters && !companySelected
                      ? "Selecciona una empresa primero"
                      : "No se encontraron departamentos"
                  }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-md-6 col-lg-4">
          <q-select
            :model-value="jobPositionSelected"
            @update:model-value="(v) => emit('update:jobPositionSelected', v)"
            :options="jobPositionOptions"
            option-label="name"
            option-value="_id"
            outlined
            dense
            use-input
            input-debounce="250"
            clearable
            label="Puesto de trabajo"
            class="filter-control"
            :disable="!departmentSelected"
            @filter="(val, update) => emit('filter-job-positions', val, update)"
            popup-content-class="q-pa-none"
          >
            <template #prepend>
              <q-icon name="badge" color="primary" />
            </template>

            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-avatar color="blue-grey-1" text-color="primary">
                    <q-icon name="badge" />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-bold">
                    {{ scope.opt?.name || "Puesto" }}
                  </q-item-label>

                  <q-item-label caption v-if="scope.opt?.description">
                    {{ scope.opt.description }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">
                  {{
                    !departmentSelected
                      ? "Selecciona un departamento primero"
                      : "No se encontraron puestos"
                  }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-md-6 col-lg-4">
          <q-select
            :model-value="projectSelected"
            @update:model-value="(v) => emit('update:projectSelected', v)"
            :options="projectOptions"
            option-label="name"
            option-value="_id"
            outlined
            dense
            use-input
            input-debounce="250"
            clearable
            label="Proyecto"
            class="filter-control"
            :disable="!jobPositionSelected"
            @filter="(val, update) => emit('filter-projects', val, update)"
            popup-content-class="q-pa-none"
          >
            <template #prepend>
              <q-icon name="work" color="primary" />
            </template>

            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-avatar color="blue-grey-1" text-color="primary">
                    <q-icon name="work" />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-bold">
                    {{ scope.opt?.name || "Proyecto" }}
                  </q-item-label>

                  <q-item-label caption v-if="scope.opt?.code">
                    Código: {{ scope.opt.code }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">
                  {{
                    !jobPositionSelected
                      ? "Selecciona un puesto primero"
                      : "No se encontraron proyectos"
                  }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-md-6 col-lg-4">
          <q-select
            :model-value="userSelected"
            @update:model-value="(v) => emit('update:userSelected', v)"
            :options="usersOptions"
            :option-label="getEmployeeLabel"
            option-value="_id"
            outlined
            dense
            use-input
            input-debounce="400"
            clearable
            label="Empleado"
            class="filter-control"
            :loading="employeeSearchLoading"
            :disable="canViewAdminFilters && !companySelected"
            @filter="
              (val, update, abort) =>
                emit('filter-employees', val, update, abort)
            "
            popup-content-class="q-pa-none"
          >
            <template #prepend>
              <q-icon name="person_search" color="primary" />
            </template>

            <template #option="scope">
              <q-item v-bind="scope.itemProps" class="employee-option">
                <q-item-section avatar>
                  <q-avatar size="42px">
                    <img
                      :src="
                        scope.opt.img ||
                        scope.opt.image ||
                        'https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp'
                      "
                      alt="avatar"
                    />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-bold">
                    {{ scope.opt.name || "Empleado sin nombre" }}
                  </q-item-label>

                  <q-item-label caption>
                    {{ scope.opt.email || scope.opt.username || "Sin correo" }}
                  </q-item-label>

                  <q-item-label
                    caption
                    v-if="
                      scope.opt.department?.name ||
                      scope.opt.jobPosition?.name ||
                      scope.opt.project?.name
                    "
                  >
                    <span v-if="scope.opt.department?.name">
                      {{ scope.opt.department.name }}
                    </span>

                    <span v-if="scope.opt.jobPosition?.name">
                      · {{ scope.opt.jobPosition.name }}
                    </span>

                    <span v-if="scope.opt.project?.name">
                      · {{ scope.opt.project.name }}
                    </span>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <template #selected-item="scope">
              <div class="row items-center no-wrap">
                <q-avatar size="28px" class="q-mr-sm">
                  <img
                    :src="
                      scope.opt.img ||
                      scope.opt.image ||
                      'https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp'
                    "
                    alt="avatar"
                  />
                </q-avatar>

                <div class="ellipsis">
                  {{ scope.opt.name || "Empleado" }}
                </div>
              </div>
            </template>

            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">
                  {{
                    canViewAdminFilters && !companySelected
                      ? "Selecciona una empresa primero"
                      : "No se encontraron empleados"
                  }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-md-6 col-lg-4">
          <q-select
            :model-value="paymentScheduleSelected"
            @update:model-value="
              (v) => emit('update:paymentScheduleSelected', v)
            "
            :options="paymentSchedules"
            option-label="name"
            option-value="_id"
            outlined
            dense
            clearable
            label="Horario de pago"
            class="filter-control"
          >
            <template #prepend>
              <q-icon name="calendar_month" color="primary" />
            </template>

            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-avatar color="blue-grey-1" text-color="primary">
                    <q-icon name="calendar_month" />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-bold">
                    {{ scope.opt?.name || "Horario" }}
                  </q-item-label>

                  <q-item-label caption v-if="scope.opt?.paymentFrequency?.name">
                    {{ scope.opt.paymentFrequency.name }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12">
          <div class="filters-actions">
            <q-btn
              unelevated
              no-caps
              icon="event_available"
              label="Agregar día"
              color="primary"
              class="rounded-action"
              @click="emit('open-add-day')"
            />

            <q-btn
              unelevated
              no-caps
              icon="payments"
              label="Confirmar pago"
              color="positive"
              class="rounded-action"
              :disable="!canConfirmPay"
              @click="emit('open-confirm-pay')"
            />

            <q-btn
              v-if="canViewAdminFilters"
              unelevated
              no-caps
              icon="lock"
              label="Cerrar nómina"
              color="dark"
              class="rounded-action"
              :disable="!canClosePayroll"
              @click="emit('open-close-payroll')"
            />

            <q-btn
              v-if="canViewAdminFilters"
              unelevated
              no-caps
              icon="paid"
              label="Ingresos"
              color="warning"
              class="rounded-action"
              @click="emit('open-earnings')"
            />

          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from "vue";
import { authStore } from "src/stores/auth-store";

const auth = authStore();

const props = defineProps({
  filtros: { type: Object, required: true },

  companyOptions: { type: Array, default: () => [] },
  companySelected: { type: Object, default: null },

  departmentOptions: { type: Array, default: () => [] },
  departmentSelected: { type: Object, default: null },

  jobPositionOptions: { type: Array, default: () => [] },
  jobPositionSelected: { type: Object, default: null },

  projectOptions: { type: Array, default: () => [] },
  projectSelected: { type: Object, default: null },

  usersOptions: { type: Array, default: () => [] },
  userSelected: { type: Object, default: null },

  paymentSchedules: { type: Array, default: () => [] },
  paymentScheduleSelected: { type: Object, default: null },

  employeeSearchLoading: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  hasResumen: { type: Boolean, default: false },
  hasEmployees: { type: Boolean, default: false },
  canConfirmPay: { type: Boolean, default: true },
  canClosePayroll: { type: Boolean, default: true },
});

const emit = defineEmits([
  "update:filtros",

  "update:companySelected",
  "update:departmentSelected",
  "update:jobPositionSelected",
  "update:projectSelected",
  "update:userSelected",
  "update:paymentScheduleSelected",

  "filter-companies",
  "filter-department",
  "filter-job-positions",
  "filter-projects",
  "filter-employees",

  "buscar",
  "open-add-day",
  "open-confirm-pay",
  "open-close-payroll",
  "apply-suggested-range",
  "open-earnings",
]);

const canViewAdminFilters = computed(() => {
  return (
    auth?.user?.department?.code === "RRHH" ||
    auth?.user?.rol?.code === "ADMIN" ||
    auth?.user?.rol?.code === "SUPERADMIN" ||
    auth?.user?.rol?.code === "SUPER_ADMIN"
  );
});

const getCompanyLabel = (company) => {
  if (!company) return "";

  return (
    company.legalName ||
    company.commercialName ||
    company.name ||
    company.code ||
    "Empresa"
  );
};

const getEmployeeLabel = (employee) => {
  if (!employee) return "";

  return (
    employee.name ||
    employee.email ||
    employee.username ||
    employee.code ||
    "Empleado"
  );
};

const setFechaInicio = (v) => {
  emit("update:filtros", { ...props.filtros, fechaInicio: v });
};

const setFechaFin = (v) => {
  emit("update:filtros", { ...props.filtros, fechaFin: v });
};
</script>

<style scoped>
.filters-card {
  border-radius: 22px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
}

.filters-header {
  padding: 16px;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
}

.filters-title {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.filter-control :deep(.q-field__control) {
  min-height: 42px;
  border-radius: 14px;
  background: #ffffff;
}

.filter-control :deep(.q-field__label) {
  font-weight: 600;
}

.employee-option {
  min-height: 58px;
}

.filters-actions {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn,
.rounded-action {
  min-height: 42px;
  border-radius: 12px;
  font-weight: 700;
}

.action-btn--primary {
  background: #1a2436;
  color: #ffffff;
}

@media (max-width: 768px) {
  .filters-header {
    padding: 12px;
  }

  .filters-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .rounded-action,
  .action-btn {
    width: 100%;
  }
}
</style>