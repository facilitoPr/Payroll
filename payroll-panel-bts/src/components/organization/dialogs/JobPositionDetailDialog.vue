<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="job-position-detail-dialog">
      <q-card-section class="dialog-header row items-start justify-between">
        <div class="row items-center q-gutter-sm">
          <q-avatar color="white" text-color="primary" icon="work" />

          <div>
            <div class="text-h6 text-weight-bold">Detalle del puesto</div>
            <div class="text-caption text-blue-1">
              {{ jobPosition?.name || "Puesto de trabajo" }}
              <span v-if="jobPosition?.code"> — {{ jobPosition.code }}</span>
            </div>
          </div>
        </div>

        <q-btn flat round dense icon="close" color="white" @click="close" />
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
          <q-tab name="requirements" icon="checklist" label="Requisitos" />
          <q-tab
            name="responsibilities"
            icon="assignment"
            label="Responsabilidades"
          />
          <q-tab name="projects" icon="workspaces" label="Proyectos" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <!-- RESUMEN -->
          <q-tab-panel name="summary">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-card flat bordered class="summary-card">
                  <q-avatar color="primary" text-color="white" icon="business" />

                  <div>
                    <div class="text-caption text-grey-7">Compañía</div>
                    <div class="text-subtitle2 text-weight-bold">
                      {{ companyLabel || "Sin compañía" }}
                    </div>
                  </div>
                </q-card>
              </div>

              <div class="col-12 col-md-4">
                <q-card flat bordered class="summary-card">
                  <q-avatar
                    color="secondary"
                    text-color="white"
                    icon="apartment"
                  />

                  <div>
                    <div class="text-caption text-grey-7">Departamento</div>
                    <div class="text-subtitle2 text-weight-bold">
                      {{ departmentLabel || "Sin departamento" }}
                    </div>
                  </div>
                </q-card>
              </div>

              <div class="col-12 col-md-4">
                <q-card flat bordered class="summary-card">
                  <q-avatar
                    color="primary"
                    text-color="white"
                    icon="workspaces"
                  />

                  <div>
                    <div class="text-caption text-grey-7">Proyectos</div>
                    <div class="text-subtitle2 text-weight-bold">
                      {{ projects.length }}
                    </div>
                  </div>
                </q-card>
              </div>

              <div class="col-12">
                <q-card flat bordered class="info-card">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-4">
                      <div class="text-caption text-grey-7">Modalidad</div>
                      <div class="text-body2 text-weight-medium">
                        {{ getModalityLabel(jobPosition?.modality) }}
                      </div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="text-caption text-grey-7">Tipo de empleo</div>
                      <div class="text-body2 text-weight-medium">
                        {{ getEmploymentTypeLabel(jobPosition?.employmentType) }}
                      </div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="text-caption text-grey-7">Estado</div>
                      <q-badge
                        rounded
                        :color="jobPosition?.isActive ? 'secondary' : 'negative'"
                        :label="jobPosition?.isActive ? 'ACTIVO' : 'INACTIVO'"
                      />
                    </div>

                    <div class="col-12">
                      <q-separator class="q-my-md" />

                      <div class="text-subtitle2 text-weight-bold q-mb-xs">
                        Descripción
                      </div>

                      <div class="text-body2 text-grey-8 text-pre-line">
                        {{
                          jobPosition?.description ||
                          "Sin descripción registrada."
                        }}
                      </div>
                    </div>
                  </div>
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <!-- REQUISITOS -->
          <q-tab-panel name="requirements">
            <q-card flat bordered class="info-card">
              <div class="row items-center justify-between q-mb-md">
                <div>
                  <div class="text-subtitle2 text-weight-bold">
                    Requisitos del puesto
                  </div>
                  <div class="text-caption text-grey-7">
                    Condiciones, conocimientos o experiencia necesaria.
                  </div>
                </div>

                <q-chip
                  dense
                  color="primary"
                  text-color="white"
                  icon="checklist"
                >
                  {{ requirements.length }}
                </q-chip>
              </div>

              <q-list
                v-if="requirements.length"
                bordered
                separator
                class="rounded-list"
              >
                <q-item
                  v-for="(item, index) in requirements"
                  :key="`req-${index}`"
                  class="detail-list-item"
                >
                  <q-item-section avatar>
                    <q-avatar size="30px" color="primary" text-color="white">
                      {{ index + 1 }}
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <div class="text-body2 text-pre-line">
                      {{ item }}
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>

              <div v-else class="empty-state">
                <q-icon name="checklist" size="42px" color="grey-5" />
                <div class="text-grey-7 q-mt-sm">
                  Este puesto no tiene requisitos registrados.
                </div>
              </div>
            </q-card>
          </q-tab-panel>

          <!-- RESPONSABILIDADES -->
          <q-tab-panel name="responsibilities">
            <q-card flat bordered class="info-card">
              <div class="row items-center justify-between q-mb-md">
                <div>
                  <div class="text-subtitle2 text-weight-bold">
                    Responsabilidades del puesto
                  </div>
                  <div class="text-caption text-grey-7">
                    Funciones principales que debe realizar la persona en este
                    puesto.
                  </div>
                </div>

                <q-chip
                  dense
                  color="primary"
                  text-color="white"
                  icon="assignment"
                >
                  {{ responsibilities.length }}
                </q-chip>
              </div>

              <q-list
                v-if="responsibilities.length"
                bordered
                separator
                class="rounded-list"
              >
                <q-item
                  v-for="(item, index) in responsibilities"
                  :key="`resp-${index}`"
                  class="detail-list-item"
                >
                  <q-item-section avatar>
                    <q-avatar size="30px" color="primary" text-color="white">
                      {{ index + 1 }}
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <div class="text-body2 text-pre-line">
                      {{ item }}
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>

              <div v-else class="empty-state">
                <q-icon name="assignment" size="42px" color="grey-5" />
                <div class="text-grey-7 q-mt-sm">
                  Este puesto no tiene responsabilidades registradas.
                </div>
              </div>
            </q-card>
          </q-tab-panel>

          <!-- PROYECTOS -->
          <q-tab-panel name="projects">
            <q-card flat bordered class="inner-card">
              <div class="row items-center justify-between q-pa-md">
                <div>
                  <div class="text-subtitle2 text-weight-bold">
                    Proyectos del puesto
                  </div>
                  <div class="text-caption text-grey-7">
                    Crea y administra los proyectos asociados a este puesto.
                  </div>
                </div>

                <div class="row q-gutter-sm items-center">
                  <q-chip
                    dense
                    color="primary"
                    text-color="white"
                    icon="workspaces"
                  >
                    {{ projects.length }}
                  </q-chip>

                  <q-btn
                    unelevated
                    rounded
                    color="primary"
                    icon="add"
                    label="Nuevo proyecto"
                    class="action-btn"
                    @click="openCreateProject"
                  />
                </div>
              </div>

              <q-separator />

              <q-slide-transition>
                <div v-if="projectFormVisible" class="project-inline-form">
                  <q-card flat bordered class="project-form-card">
                    <div class="row items-center justify-between q-mb-md">
                      <div>
                        <div class="text-subtitle2 text-weight-bold">
                          {{
                            projectEditMode
                              ? "Editar proyecto"
                              : "Nuevo proyecto"
                          }}
                        </div>
                        <div class="text-caption text-grey-7">
                          El proyecto se guardará dentro de este puesto.
                        </div>
                      </div>

                      <q-btn
                        flat
                        round
                        dense
                        icon="close"
                        color="grey-7"
                        :disable="savingProject"
                        @click="cancelProjectForm"
                      />
                    </div>

                    <div class="row q-col-gutter-md">
                      <div class="col-12 col-md-8">
                        <q-input
                          v-model="projectForm.name"
                          outlined
                          dense
                          color="primary"
                          label="Nombre del proyecto *"
                          class="rounded-input"
                        >
                          <template #prepend>
                            <q-icon name="workspaces" />
                          </template>
                        </q-input>
                      </div>

                      <div class="col-12 col-md-4">
                        <q-input
                          v-model="projectForm.code"
                          outlined
                          dense
                          color="primary"
                          label="Código"
                          class="rounded-input"
                          hint="Opcional. Si lo dejas vacío, se genera desde el nombre."
                        >
                          <template #prepend>
                            <q-icon name="tag" />
                          </template>
                        </q-input>
                      </div>

                      <div class="col-12 col-md-6">
                        <q-input
                          v-model="projectForm.startDate"
                          outlined
                          dense
                          type="date"
                          color="primary"
                          label="Fecha de inicio *"
                          class="rounded-input"
                        />
                      </div>

                      <div class="col-12 col-md-6">
                        <q-input
                          v-model="projectForm.endDate"
                          outlined
                          dense
                          type="date"
                          color="primary"
                          label="Fecha de fin"
                          class="rounded-input"
                        />
                      </div>

                      <div class="col-12">
                        <q-input
                          v-model="projectForm.description"
                          type="textarea"
                          autogrow
                          outlined
                          dense
                          color="primary"
                          label="Descripción"
                          class="rounded-input"
                        />
                      </div>

                      <div class="col-12">
                        <div class="status-box">
                          <div>
                            <div class="text-subtitle2 text-weight-bold">
                              Estado del proyecto
                            </div>
                            <div class="text-caption text-grey-7">
                              Define si este proyecto está activo.
                            </div>
                          </div>

                          <q-toggle
                            v-model="projectForm.isActive"
                            color="primary"
                            :label="
                              projectForm.isActive ? 'Activo' : 'Inactivo'
                            "
                          />
                        </div>
                      </div>
                    </div>

                    <div class="row justify-end q-gutter-sm q-mt-md">
                      <q-btn
                        flat
                        rounded
                        color="grey-8"
                        label="Cancelar"
                        icon="close"
                        :disable="savingProject"
                        @click="cancelProjectForm"
                      />

                      <q-btn
                        unelevated
                        rounded
                        color="primary"
                        label="Guardar proyecto"
                        icon="save"
                        :loading="savingProject"
                        :disable="!canSaveProject"
                        @click="saveProject"
                      />
                    </div>
                  </q-card>
                </div>
              </q-slide-transition>

              <q-table
                :rows="projects"
                :columns="projectColumns"
                row-key="_id"
                flat
                :loading="loadingProjects"
                :pagination="{ rowsPerPage: 8 }"
                no-data-label="Este puesto no tiene proyectos registrados"
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
                        @click="openEditProject(props.row)"
                      >
                        <q-tooltip>Editar proyecto</q-tooltip>
                      </q-btn>

                      <q-btn
                        flat
                        round
                        dense
                        icon="delete"
                        color="negative"
                        :loading="deletingProject"
                        @click="emit('delete-project', props.row)"
                      >
                        <q-tooltip>Eliminar proyecto</q-tooltip>
                      </q-btn>
                    </div>
                  </q-td>
                </template>

                <template #body-cell-name="props">
                  <q-td :props="props">
                    <div class="row items-center q-gutter-sm no-wrap">
                      <q-avatar
                        size="32px"
                        color="primary"
                        text-color="white"
                        icon="workspaces"
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

                <template #body-cell-description="props">
                  <q-td :props="props">
                    <div class="description-cell">
                      {{ props.row.description || "Sin descripción" }}
                    </div>
                  </q-td>
                </template>

                <template #body-cell-startDate="props">
                  <q-td :props="props" class="text-center">
                    {{ props.row.startDate || "N/A" }}
                  </q-td>
                </template>

                <template #body-cell-endDate="props">
                  <q-td :props="props" class="text-center">
                    {{ props.row.endDate || "N/A" }}
                  </q-td>
                </template>

                <template #body-cell-status="props">
                  <q-td :props="props" class="text-center">
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
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  jobPosition: {
    type: Object,
    default: null,
  },
  companyLabel: {
    type: String,
    default: "",
  },
  departmentLabel: {
    type: String,
    default: "",
  },
  projects: {
    type: Array,
    default: () => [],
  },
  loadingProjects: {
    type: Boolean,
    default: false,
  },
  savingProject: {
    type: Boolean,
    default: false,
  },
  deletingProject: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "create-project",
  "update-project",
  "delete-project",
]);

const tab = ref("summary");

const projectFormVisible = ref(false);
const projectEditMode = ref(false);
const selectedProject = ref(null);
const projectForm = ref(getEmptyProjectForm());

const normalizeTextList = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => normalizeTextList(item))
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "object") {
    const possibleText =
      value.text ||
      value.name ||
      value.label ||
      value.description ||
      value.value ||
      "";

    return normalizeTextList(possibleText);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) return [];

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeTextList(parsed);
      } catch {
        // continúa abajo
      }
    }

    return trimmed
      .split(/\r?\n|•|;|\|/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [String(value).trim()].filter(Boolean);
};

const requirements = computed(() => {
  return normalizeTextList(props.jobPosition?.requirements);
});

const responsibilities = computed(() => {
  return normalizeTextList(props.jobPosition?.responsibilities);
});

const canSaveProject = computed(() => {
  return !!projectForm.value.name?.trim() && !!projectForm.value.startDate;
});

const projectColumns = [
  {
    name: "actions",
    label: "Acciones",
    field: "actions",
    align: "center",
  },
  {
    name: "name",
    label: "Proyecto",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "description",
    label: "Descripción",
    field: "description",
    align: "left",
  },
  {
    name: "startDate",
    label: "Inicio",
    field: "startDate",
    align: "center",
  },
  {
    name: "endDate",
    label: "Fin",
    field: "endDate",
    align: "center",
  },
  {
    name: "status",
    label: "Estado",
    field: "isActive",
    align: "center",
  },
];

function getEmptyProjectForm() {
  return {
    name: "",
    code: "",
    startDate: "",
    endDate: "",
    description: "",
    isActive: true,
  };
}

const resetProjectForm = () => {
  selectedProject.value = null;
  projectEditMode.value = false;
  projectForm.value = getEmptyProjectForm();
};

const openCreateProject = () => {
  tab.value = "projects";
  resetProjectForm();
  projectFormVisible.value = true;
};

const openEditProject = (project) => {
  tab.value = "projects";
  projectEditMode.value = true;
  selectedProject.value = project;

  projectForm.value = {
    name: project?.name || "",
    code: project?.code || "",
    startDate: project?.startDate || "",
    endDate: project?.endDate || "",
    description: project?.description || "",
    isActive: project?.isActive !== false,
  };

  projectFormVisible.value = true;
};

const cancelProjectForm = () => {
  projectFormVisible.value = false;
  resetProjectForm();
};

const saveProject = () => {
  const payload = {
    ...projectForm.value,
    name: projectForm.value.name?.trim(),
    code: projectForm.value.code?.trim()?.toUpperCase(),
    startDate: projectForm.value.startDate,
    endDate: projectForm.value.endDate || "",
    description: projectForm.value.description?.trim(),
    isActive: projectForm.value.isActive !== false,
  };

  if (projectEditMode.value && selectedProject.value?._id) {
    emit("update-project", {
      projectId: selectedProject.value._id,
      payload,
    });
  } else {
    emit("create-project", payload);
  }

  projectFormVisible.value = false;
  resetProjectForm();
};

const getModalityLabel = (value) => {
  if (value === "Onsite") return "Presencial";
  if (value === "Remote") return "Remoto";
  if (value === "Hybrid") return "Híbrido";

  return "N/A";
};

const getEmploymentTypeLabel = (value) => {
  if (value === "FullTime") return "Tiempo completo";
  if (value === "PartTime") return "Medio tiempo";
  if (value === "Contract") return "Contrato";
  if (value === "Internship") return "Pasantía";
  if (value === "Temporary") return "Temporal";

  return "N/A";
};

const close = () => {
  emit("update:modelValue", false);
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      tab.value = "summary";
      projectFormVisible.value = false;
      resetProjectForm();
    }
  }
);
</script>

<style scoped>
.job-position-detail-dialog {
  width: 1080px;
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
.info-card,
.inner-card,
.project-form-card {
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

.info-card {
  padding: 16px;
}

.inner-card {
  overflow: hidden;
}

.project-inline-form {
  padding: 16px;
  background: #f8fafc;
}

.project-form-card {
  padding: 16px;
  background: #ffffff;
}

.rounded-list {
  border-radius: 16px;
  overflow: hidden;
}

.detail-list-item {
  align-items: flex-start;
}

.empty-state {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
}

.status-box {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.11);
  background: #ffffff;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-btn {
  text-transform: none;
  font-weight: 600;
}

.description-cell {
  max-width: 340px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #4b5563;
}

.text-pre-line {
  white-space: pre-line;
}

@media (max-width: 600px) {
  .status-box {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>