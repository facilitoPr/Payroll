<template>
  <q-page class="training-admin-page q-pa-md">
    <PageHeaderCard
      title="Módulo de entrenamiento"
      subtitle="Administra entrenamientos, asignaciones y resultados."
      icon="school"
    >
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nuevo entrenamiento"
          class="header-btn"
          @click="openCreateDialog"
        />

        <q-btn
          outline
          color="primary"
          icon="refresh"
          label="Actualizar"
          class="header-btn"
          :loading="loading"
          @click="refreshPage"
        />
      </template>
    </PageHeaderCard>

    <training-metrics-cards
      :metrics="metrics"
      :loading="loading"
      class="q-mb-lg"
    />

    <q-card flat bordered class="rounded-card q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="filters.text"
              label="Buscar"
              outlined
              dense
              rounded
              clearable
              @keyup.enter="loadTrainings"
            >
              <template #prepend>
                <q-icon name="search" color="primary" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.type"
              :options="trainingTypeOptions"
              label="Tipo"
              outlined
              dense
              rounded
              emit-value
              map-options
              clearable
            >
              <template #prepend>
                <q-icon name="category" color="primary" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.status"
              :options="trainingStatusOptions"
              label="Estado"
              outlined
              dense
              rounded
              emit-value
              map-options
              clearable
            >
              <template #prepend>
                <q-icon name="flag" color="primary" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-2 flex items-center">
            <q-btn
              color="primary"
              unelevated
              rounded
              class="full-width filter-btn"
              icon="filter_alt"
              label="Filtrar"
              @click="loadTrainings"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-table
      flat
      bordered
      :rows="trainings"
      :columns="columns"
      row-key="_id"
      :loading="loading"
      hide-pagination
    >
      <template #body-cell-title="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.row.title }}</div>
          <div class="text-caption text-grey-7">
            {{ props.row.code || "Sin código" }}
          </div>
        </q-td>
      </template>

      <template #body-cell-type="props">
        <q-td :props="props">
          {{ getTrainingTypeLabel(props.row.type) }}
        </q-td>
      </template>

      <template #body-cell-status="props">
        <q-td :props="props">
          <q-chip
            dense
            :color="getTrainingStatusColor(props.row.status)"
            text-color="white"
          >
            {{ getTrainingStatusLabel(props.row.status) }}
          </q-chip>
        </q-td>
      </template>

      <template #body-cell-isMandatory="props">
        <q-td :props="props">
          <q-chip
            dense
            :color="props.row.isMandatory ? 'primary' : 'grey-6'"
            text-color="white"
          >
            {{ props.row.isMandatory ? "Sí" : "No" }}
          </q-chip>
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <div class="row q-gutter-sm justify-end">
            <q-btn
              flat
              round
              dense
              icon="visibility"
              color="primary"
              @click="openDetailDialog(props.row)"
            >
              <q-tooltip>Ver detalle</q-tooltip>
            </q-btn>

            <q-btn
              flat
              round
              dense
              icon="edit"
              color="secondary"
              @click="openEditDialog(props.row)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>

            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              @click="confirmDelete(props.row)"
            >
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>

      <template #no-data>
        <div class="full-width row flex-center q-pa-lg text-grey-7">
          No hay entrenamientos registrados
        </div>
      </template>
    </q-table>

    <training-form-dialog
      v-model="showFormDialog"
      :training="selectedTraining"
      :loading="saving"
      @save="handleSaveTraining"
    />

    <training-detail-dialog
      v-model="showDetailDialog"
      :training-id="selectedDetailTrainingId"
      @updated="handleDetailUpdated"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import type { TrainingMetrics, TrainingRow } from "src/types/training";
import { useTrainingAdmin } from "src/composable/useTrainingAdmin";
import TrainingMetricsCards from "src/components/training/TrainingMetricsCards.vue";
import TrainingFormDialog from "src/components/training/TrainingFormDialog.vue";
import TrainingDetailDialog from "src/components/training/TrainingDetailDialog.vue";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import {
  trainingTypeOptions,
  trainingStatusOptions,
  getTrainingTypeLabel,
  getTrainingStatusColor,
  getTrainingStatusLabel,
} from "src/helpers/catalogs/training.catalog";

const $q = useQuasar();

const {
  loading,
  getDashboardMetrics,
  getTrainings,
  createTraining,
  updateTraining,
  deleteTraining,
} = useTrainingAdmin();

const metrics = ref<TrainingMetrics | null>(null);
const trainings = ref<TrainingRow[]>([]);
const saving = ref(false);
const showFormDialog = ref(false);
const showDetailDialog = ref(false);
const selectedTraining = ref<TrainingRow | null>(null);
const selectedDetailTrainingId = ref<string | null>(null);

const filters = reactive({
  text: "",
  type: "",
  status: "",
});

const columns: any = [
  { name: "title", label: "Entrenamiento", field: "title", align: "left" },
  { name: "type", label: "Tipo", field: "type", align: "left" },
  { name: "status", label: "Estado", field: "status", align: "left" },
  {
    name: "estimatedMinutes",
    label: "Minutos",
    field: "estimatedMinutes",
    align: "left",
  },
  { name: "passScore", label: "Pase (%)", field: "passScore", align: "left" },
  {
    name: "isMandatory",
    label: "Obligatorio",
    field: "isMandatory",
    align: "left",
  },
  { name: "actions", label: "Acciones", field: "actions", align: "right" },
];

const notifyError = (message: string) => {
  $q.notify({ type: "negative", message });
};

const notifySuccess = (message: string) => {
  $q.notify({ type: "positive", message });
};

const loadMetrics = async () => {
  try {
    const resp = await getDashboardMetrics();
    metrics.value = resp.metrics;
  } catch (error: any) {
    notifyError(error.message || "No se pudieron cargar las métricas");
  }
};

const loadTrainings = async () => {
  try {
    const resp = await getTrainings({
      text: filters.text,
      type: filters.type,
      status: filters.status,
      limit: 100,
      initial: 0,
    });

    trainings.value = resp.trainings || [];
  } catch (error: any) {
    notifyError(error.message || "No se pudieron cargar los entrenamientos");
  }
};

const refreshPage = async () => {
  await Promise.all([loadMetrics(), loadTrainings()]);
};

const openCreateDialog = () => {
  selectedTraining.value = null;
  showFormDialog.value = true;
};

const openEditDialog = (row: TrainingRow) => {
  selectedTraining.value = row;
  showFormDialog.value = true;
};

const openDetailDialog = (row: TrainingRow) => {
  selectedDetailTrainingId.value = row._id;
  showDetailDialog.value = true;
};

const handleSaveTraining = async (payload: any) => {
  saving.value = true;

  try {
    if (selectedTraining.value?._id) {
      await updateTraining(selectedTraining.value._id, payload);
      notifySuccess("Entrenamiento actualizado con éxito");
    } else {
      await createTraining(payload);
      notifySuccess("Entrenamiento creado con éxito");
    }

    showFormDialog.value = false;
    await refreshPage();
  } catch (error: any) {
    notifyError(error.message || "No se pudo guardar el entrenamiento");
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (row: TrainingRow) => {
  $q.dialog({
    title: "Eliminar entrenamiento",
    message: `¿Deseas eliminar "${row.title}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await deleteTraining(row._id);
      notifySuccess("Entrenamiento eliminado con éxito");
      await refreshPage();
    } catch (error: any) {
      notifyError(error.message || "No se pudo eliminar el entrenamiento");
    }
  });
};

const handleDetailUpdated = async () => {
  await refreshPage();
};

onMounted(async () => {
  await refreshPage();
});
</script>

<style scoped>
.training-admin-page {
  min-height: 100%;
}

.header-btn {
  height: 40px;
  border-radius: 12px;
  font-weight: 700;
}

.rounded-card {
  border-radius: 20px;
}

.filter-btn {
  min-height: 40px;
  font-weight: 700;
}

@media (max-width: 599px) {
  .header-btn {
    width: 100%;
  }
}
</style>