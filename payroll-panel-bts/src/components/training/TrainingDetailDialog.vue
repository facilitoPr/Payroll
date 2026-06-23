<template>
  <q-dialog v-model="dialogModel" maximized persistent>
    <q-card class="training-detail-shell">
      <q-card-section class="row items-center justify-between dialog-header">
        <div class="row items-center header-content">
          <div class="header-icon-wrap">
            <q-icon size="xl" name="school" color="white" />
          </div>

          <div>
            <div class="text-h5 text-weight-bold text-white text-uppercase">
              {{ training?.title || "DETALLE DE ENTRENAMIENTO" }}
            </div>
            <div class="text-caption text-white">
              Gestión de contenido, preguntas, asignaciones y resultados
            </div>
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

      <q-card-section class="q-pa-lg content-wrapper">
        <training-detail-summary
          :training="training"
          :status-color="statusColor"
          class="q-mb-md"
        />

        <q-tabs
          v-model="tab"
          inline-label
          no-caps
          active-color="primary"
          indicator-color="primary"
          class="detail-tabs q-mb-md"
        >
          <q-tab name="general" icon="info" label="General" />
          <q-tab name="content" icon="article" label="Contenido" />
          <q-tab name="questions" icon="quiz" label="Preguntas" />
          <q-tab name="assignments" icon="groups" label="Asignaciones" />
          <q-tab name="results" icon="leaderboard" label="Resultados" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated class="bg-transparent">
          <q-tab-panel name="general" class="q-pa-none">
            <training-general-tab :training="training" />
          </q-tab-panel>

          <q-tab-panel name="content" class="q-pa-none">
            <training-content-tab
              :content-blocks="contentBlocks"
              @add="openBlockDialog()"
              @edit="openBlockDialog"
              @remove="removeBlock"
            />
          </q-tab-panel>

          <q-tab-panel name="questions" class="q-pa-none">
            <training-questions-tab
              :questions="questions"
              @add="openQuestionDialog()"
              @edit="openQuestionDialog"
              @remove="removeQuestion"
            />
          </q-tab-panel>

          <q-tab-panel name="assignments" class="q-pa-none">
            <training-assignments-tab
              :assignments="assignments"
              :assignment-status-color="assignmentStatusColor"
              :format-date="formatDate"
              @open-assign="openAssignDialog"
            />
          </q-tab-panel>

          <q-tab-panel name="results" class="q-pa-none">
            <training-results-tab
              :attempts="attempts"
              :attempt-status-color="attemptStatusColor"
              @view-attempt="openAttemptDetail"
            />
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <training-block-dialog
        v-model="blockDialog"
        :training-id="trainingId"
        :block="selectedBlock"
        @saved="handleSaved"
      />

      <training-question-dialog
        v-model="questionDialog"
        :training-id="trainingId"
        :question="selectedQuestion"
        @saved="handleSaved"
      />

      <training-assign-dialog
        v-model="assignDialog"
        :training-id="trainingId"
        @saved="handleAssignmentsSaved"
      />

      <training-attempt-detail-dialog
        v-model="attemptDialog"
        :attempt="selectedAttempt"
        :question-results="attemptQuestionResults"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuasar, date } from "quasar";
import { useTrainingAdmin } from "src/composable/useTrainingAdmin";
import TrainingAttemptDetailDialog from "src/components/training/TrainingAttemptDetailDialog.vue";
import TrainingDetailSummary from "src/components/training/detail/TrainingDetailSummary.vue";
import TrainingGeneralTab from "src/components/training/detail/TrainingGeneralTab.vue";
import TrainingContentTab from "src/components/training/detail/TrainingContentTab.vue";
import TrainingQuestionsTab from "src/components/training/detail/TrainingQuestionsTab.vue";
import TrainingAssignmentsTab from "src/components/training/detail/TrainingAssignmentsTab.vue";
import TrainingResultsTab from "src/components/training/detail/TrainingResultsTab.vue";
import TrainingBlockDialog from "src/components/training/detail/TrainingBlockDialog.vue";
import TrainingQuestionDialog from "src/components/training/detail/TrainingQuestionDialog.vue";
import TrainingAssignDialog from "src/components/training/detail/TrainingAssignDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  trainingId: string | null;
}>();

const emit = defineEmits(["update:modelValue", "updated"]);

const $q = useQuasar();
const {
  getTrainingById,
  getAssignments,
  getResults,
  deleteBlock,
  deleteQuestion,
  getAttemptDetail,
} = useTrainingAdmin();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const tab = ref("general");

const training = ref<any>(null);
const contentBlocks = ref<any[]>([]);
const questions = ref<any[]>([]);
const assignments = ref<any[]>([]);
const attempts = ref<any[]>([]);

const blockDialog = ref(false);
const questionDialog = ref(false);
const assignDialog = ref(false);
const attemptDialog = ref(false);

const selectedBlock = ref<any | null>(null);
const selectedQuestion = ref<any | null>(null);
const selectedAttempt = ref<any | null>(null);
const attemptQuestionResults = ref<any[]>([]);

const statusColor = computed(() => {
  if (training.value?.status === "PUBLISHED") return "positive";
  if (training.value?.status === "DRAFT") return "warning";
  return "grey-7";
});

const notifyError = (message: string) => {
  $q.notify({ type: "negative", message });
};

const notifySuccess = (message: string) => {
  $q.notify({ type: "positive", message });
};

const assignmentStatusColor = (status: string) => {
  if (status === "COMPLETED") return "positive";
  if (status === "FAILED") return "negative";
  if (status === "STARTED") return "warning";
  return "primary";
};

const attemptStatusColor = (status: string) => {
  if (status === "PASSED") return "positive";
  if (status === "FAILED") return "negative";
  if (status === "IN_PROGRESS") return "warning";
  return "primary";
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return date.formatDate(value, "DD/MM/YYYY");
};

const loadTraining = async () => {
  if (!props.trainingId) return;

  try {
    const resp = await getTrainingById(props.trainingId);
    training.value = resp.training;
    contentBlocks.value = resp.contentBlocks || [];
    questions.value = resp.questions || [];
  } catch (error: any) {
    notifyError(error.message || "No se pudo cargar el entrenamiento");
  }
};

const loadAssignments = async () => {
  if (!props.trainingId) return;

  try {
    const resp = await getAssignments(props.trainingId);
    assignments.value = resp.assignments || [];
  } catch (error: any) {
    notifyError(error.message || "No se pudieron cargar las asignaciones");
  }
};

const loadResults = async () => {
  if (!props.trainingId) return;

  try {
    const resp = await getResults(props.trainingId);
    attempts.value = resp.attempts || [];
  } catch (error: any) {
    notifyError(error.message || "No se pudieron cargar los resultados");
  }
};

const loadAll = async () => {
  await Promise.all([loadTraining(), loadAssignments(), loadResults()]);
};

const closeDialog = () => {
  emit("update:modelValue", false);
};

const openBlockDialog = (block?: any) => {
  selectedBlock.value = block || null;
  blockDialog.value = true;
};

const openQuestionDialog = (question?: any) => {
  selectedQuestion.value = question || null;
  questionDialog.value = true;
};

const openAssignDialog = () => {
  assignDialog.value = true;
};

const removeBlock = (block: any) => {
  $q.dialog({
    title: "Eliminar bloque",
    message: `¿Deseas eliminar "${block.title || "este bloque"}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await deleteBlock(block._id);
      notifySuccess("Bloque eliminado con éxito");
      await loadTraining();
      emit("updated");
    } catch (error: any) {
      notifyError(error.message || "No se pudo eliminar el bloque");
    }
  });
};

const removeQuestion = (question: any) => {
  $q.dialog({
    title: "Eliminar pregunta",
    message: "¿Deseas eliminar esta pregunta?",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await deleteQuestion(question._id);
      notifySuccess("Pregunta eliminada con éxito");
      await loadTraining();
      emit("updated");
    } catch (error: any) {
      notifyError(error.message || "No se pudo eliminar la pregunta");
    }
  });
};

const openAttemptDetail = async (attempt: any) => {
  try {
    const resp = await getAttemptDetail(attempt._id);
    selectedAttempt.value = resp.attempt;
    attemptQuestionResults.value = resp.questionResults || [];
    attemptDialog.value = true;
  } catch (error: any) {
    notifyError(error.message || "No se pudo cargar el detalle del intento");
  }
};

const handleSaved = async () => {
  blockDialog.value = false;
  questionDialog.value = false;
  selectedBlock.value = null;
  selectedQuestion.value = null;
  await loadTraining();
  emit("updated");
};

const handleAssignmentsSaved = async () => {
  assignDialog.value = false;
  await loadAssignments();
  emit("updated");
};

watch(
  () => [props.modelValue, props.trainingId],
  async ([isOpen, trainingId]) => {
    if (isOpen && trainingId) {
      tab.value = "general";
      await loadAll();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.training-detail-shell {
  background: #f5f7fb;
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

.content-wrapper {
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
}

.detail-tabs {
  background: white;
  border-radius: 16px;
  padding: 6px 8px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
</style>