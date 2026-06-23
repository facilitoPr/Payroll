<template>
  <q-page class="my-trainings-page q-pa-md">
    <PageHeaderCard
      title="Mis entrenamientos"
      subtitle="Visualiza y completa tus lecciones y cuestionarios asignados."
      icon="school"
    >
      <template>
        <q-btn
          unelevated
          color="primary"
          icon="refresh"
          label="Actualizar"
          class="header-btn"
          @click="loadAssignments"
        />

        <q-input
          v-model="search"
          outlined
          dense
          clearable
          label="Buscar entrenamiento"
          color="primary"
          class="header-search"
        >
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
      </template>
    </PageHeaderCard>

    <!-- ========================= -->
    <!-- Cards superiores / Totales -->
    <!-- ========================= -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div
        v-for="card in statsCards"
        :key="card.key"
        class="col-12 col-sm-6 col-lg-3"
      >
        <q-card flat bordered class="metric-card full-height">
          <q-card-section class="metric-card__section">
            <div class="row items-start justify-between no-wrap">
              <div class="metric-card__content">
                <div class="metric-card__label">
                  {{ card.label }}
                </div>

                <div class="metric-card__value q-mt-xs">
                  {{ card.value }}
                </div>
              </div>

              <div class="metric-card__icon-wrap" :class="card.iconBgClass">
                <q-icon :name="card.icon" size="23px" :class="card.iconClass" />
              </div>
            </div>

            <div class="q-mt-md">
              <div class="metric-card__helper">
                {{ card.helper }}
              </div>
            </div>
          </q-card-section>

          <div class="metric-card__bottom-bar" :class="card.barClass" />
        </q-card>
      </div>
    </div>

    <!-- ========================= -->
    <!-- Lista de entrenamientos -->
    <!-- ========================= -->
    <div class="row q-col-gutter-lg">
      <div
        v-for="item in filteredAssignments"
        :key="item._id"
        class="col-12 col-sm-6 col-xl-4"
      >
        <q-card flat bordered class="training-card full-height">
          <q-card-section class="training-card__section">
            <div class="row items-start justify-between no-wrap q-gutter-md">
              <div class="training-card__icon-wrap">
                <q-icon
                  :name="getTrainingTypeIcon(item.training?.type)"
                  size="28px"
                  color="primary"
                />
              </div>

              <div class="col">
                <div class="row items-center q-gutter-sm q-mb-xs">
                  <q-chip
                    dense
                    outline
                    color="primary"
                    text-color="primary"
                    class="training-type-chip"
                  >
                    {{ getTrainingTypeLabel(item.training?.type) }}
                  </q-chip>
                </div>

                <div class="training-card__title ellipsis-2-lines">
                  {{ item.training?.title || "Entrenamiento" }}
                </div>

                <div
                  v-if="item.training?.description"
                  class="training-card__description ellipsis-2-lines q-mt-xs"
                >
                  {{ item.training.description }}
                </div>
              </div>

              <q-chip
                dense
                :color="getStatusColor(item.status)"
                text-color="white"
                class="status-chip"
              >
                <q-icon
                  :name="getStatusIcon(item.status)"
                  size="14px"
                  class="q-mr-xs"
                />
                {{ getStatusLabel(item.status) }}
              </q-chip>
            </div>

            <div class="training-progress q-mt-md">
              <div class="row items-center justify-between q-mb-xs">
                <div class="training-progress__label">Puntuación</div>
                <div class="training-progress__value">
                  {{ item.score || 0 }}%
                </div>
              </div>

              <q-linear-progress
                rounded
                size="8px"
                :value="getScoreProgress(item.score)"
                :color="getScoreColor(item.score, item.passed)"
                track-color="grey-3"
              />
            </div>

            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-6">
                <div class="info-box">
                  <div class="info-box__icon bg-primary-soft">
                    <q-icon name="history" color="primary" size="18px" />
                  </div>

                  <div>
                    <div class="info-box__label">Intentos</div>
                    <div class="info-box__value">
                      {{ item.totalAttemptsUsed || 0 }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-6">
                <div class="info-box">
                  <div
                    class="info-box__icon"
                    :class="item.passed ? 'bg-positive-soft' : 'bg-orange-soft'"
                  >
                    <q-icon
                      :name="item.passed ? 'verified' : 'pending_actions'"
                      :color="item.passed ? 'positive' : 'orange-8'"
                      size="18px"
                    />
                  </div>

                  <div>
                    <div class="info-box__label">Resultado</div>
                    <div
                      class="info-box__value"
                      :class="item.passed ? 'text-positive' : 'text-dark'"
                    >
                      {{ item.passed ? "Aprobado" : "Pendiente" }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="training-meta q-mt-md">
              <div class="training-meta__item">
                <q-icon name="event" size="17px" color="grey-7" />
                <span>
                  Fecha límite:
                  <strong>
                    {{ item.dueDate ? formatDate(item.dueDate) : "Sin límite" }}
                  </strong>
                </span>
              </div>

              <div class="training-meta__item">
                <q-icon name="task_alt" size="17px" color="grey-7" />
                <span>
                  Estado:
                  <strong :class="getStatusTextClass(item.status)">
                    {{ getStatusLabel(item.status) }}
                  </strong>
                </span>
              </div>
            </div>
          </q-card-section>

          <q-separator class="training-card__separator" />

          <q-card-actions align="between" class="training-card__actions">
            <q-btn
              flat
              color="grey-8"
              icon="visibility"
              label="Ver detalle"
              class="training-card__secondary-btn"
              @click="openTraining(item)"
            />

            <q-btn
              color="primary"
              rounded
              unelevated
              icon-right="arrow_forward"
              label="Abrir"
              class="training-card__primary-btn"
              @click="openTraining(item)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <q-card
      v-if="!filteredAssignments.length"
      flat
      bordered
      class="empty-card q-mt-lg"
    >
      <q-card-section class="text-center q-py-xl">
        <div class="empty-card__icon">
          <q-icon name="school" size="54px" color="primary" />
        </div>

        <div class="text-subtitle1 text-weight-bold q-mt-md">
          No tienes entrenamientos asignados
        </div>

        <div class="text-caption text-grey-7 q-mt-sm">
          Cuando se te asignen nuevos entrenamientos, aparecerán aquí.
        </div>
      </q-card-section>
    </q-card>

    <MyTrainingDetailDialog
      v-model="showDetailDialog"
      :training-id="selectedTrainingId"
      @updated="loadAssignments"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useQuasar, date } from "quasar";
import { useTrainingEmployee } from "src/composable/useTrainingEmployee";
import MyTrainingDetailDialog from "src/components/training/employee/MyTrainingDetailDialog.vue";
import PageHeaderCard from "src/components/PageHeaderCard.vue";

const $q = useQuasar();
const { getMyAssignments } = useTrainingEmployee();

const assignments = ref<any[]>([]);
const search = ref("");
const showDetailDialog = ref(false);
const selectedTrainingId = ref<string | null>(null);

const notifyError = (message: string) => {
  $q.notify({ type: "negative", message });
};

const getStatusColor = (status: string) => {
  if (status === "COMPLETED") return "positive";
  if (status === "FAILED") return "negative";
  if (status === "STARTED") return "warning";
  if (status === "EXPIRED") return "grey-7";
  return "primary";
};

const getStatusLabel = (status: string) => {
  if (status === "COMPLETED") return "Completado";
  if (status === "FAILED") return "Fallido";
  if (status === "STARTED") return "En progreso";
  if (status === "EXPIRED") return "Expirado";
  return "Asignado";
};

const getStatusIcon = (status: string) => {
  if (status === "COMPLETED") return "check_circle";
  if (status === "FAILED") return "cancel";
  if (status === "STARTED") return "schedule";
  if (status === "EXPIRED") return "event_busy";
  return "assignment";
};

const getStatusTextClass = (status: string) => {
  if (status === "COMPLETED") return "text-positive";
  if (status === "FAILED") return "text-negative";
  if (status === "STARTED") return "text-warning";
  if (status === "EXPIRED") return "text-grey-7";
  return "text-primary";
};

const getTrainingTypeLabel = (type: string) => {
  if (type === "LESSON") return "Lección";
  if (type === "QUIZ") return "Cuestionario";
  if (type === "MIXED") return "Mixto";
  return type || "-";
};

const getTrainingTypeIcon = (type: string) => {
  if (type === "LESSON") return "menu_book";
  if (type === "QUIZ") return "quiz";
  if (type === "MIXED") return "auto_stories";
  return "school";
};

const getScoreProgress = (score: number) => {
  const value = Number(score || 0);
  if (value <= 0) return 0;
  if (value >= 100) return 1;
  return value / 100;
};

const getScoreColor = (score: number, passed: boolean) => {
  const value = Number(score || 0);

  if (passed) return "positive";
  if (value >= 70) return "positive";
  if (value >= 50) return "warning";
  if (value > 0) return "negative";

  return "grey-5";
};

const formatDate = (value: string) => {
  return date.formatDate(value, "DD/MM/YYYY");
};

const filteredAssignments = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return assignments.value;

  return assignments.value.filter((item) => {
    const training = item.training || {};
    const text = [
      training.title,
      training.description,
      training.type,
      item.status,
      getTrainingTypeLabel(training.type),
      getStatusLabel(item.status),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(term);
  });
});

const stats = computed(() => {
  const total = assignments.value.length;

  const completed = assignments.value.filter(
    (item) => item.status === "COMPLETED",
  ).length;

  const started = assignments.value.filter(
    (item) => item.status === "STARTED",
  ).length;

  const failed = assignments.value.filter(
    (item) => item.status === "FAILED",
  ).length;

  const assigned = assignments.value.filter(
    (item) => !["COMPLETED", "STARTED", "FAILED", "EXPIRED"].includes(item.status),
  ).length;

  const expired = assignments.value.filter(
    (item) => item.status === "EXPIRED",
  ).length;

  const passed = assignments.value.filter((item) => item.passed).length;

  const completionRate =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    started,
    failed,
    assigned,
    expired,
    passed,
    completionRate,
  };
});

const statsCards = computed(() => {
  return [
    {
      key: "total",
      label: "Total asignados",
      value: stats.value.total,
      helper: `${stats.value.assigned} pendientes por iniciar`,
      icon: "school",
      iconClass: "text-primary",
      iconBgClass: "bg-primary-soft",
      barClass: "bar-primary",
    },
    {
      key: "completed",
      label: "Completados",
      value: stats.value.completed,
      helper: `${stats.value.completionRate}% de finalización`,
      icon: "assignment_turned_in",
      iconClass: "text-positive",
      iconBgClass: "bg-positive-soft",
      barClass: "bar-positive",
    },
    {
      key: "started",
      label: "En progreso",
      value: stats.value.started,
      helper: `${stats.value.passed} aprobados hasta ahora`,
      icon: "schedule",
      iconClass: "text-amber-9",
      iconBgClass: "bg-amber-soft",
      barClass: "bar-amber",
    },
    {
      key: "failed",
      label: "Fallidos",
      value: stats.value.failed,
      helper:
        stats.value.expired > 0
          ? `${stats.value.expired} expirados`
          : "Sin expirados registrados",
      icon: "cancel",
      iconClass: "text-negative",
      iconBgClass: "bg-negative-soft",
      barClass: "bar-negative",
    },
  ];
});

const loadAssignments = async () => {
  try {
    const resp = await getMyAssignments();
    assignments.value = resp.assignments || [];
  } catch (error: any) {
    notifyError(error.message || "No se pudieron cargar tus entrenamientos");
  }
};

const openTraining = (item: any) => {
  const trainingId =
    typeof item.training === "string" ? item.training : item.training?._id;

  selectedTrainingId.value = trainingId || null;
  showDetailDialog.value = true;
};

onMounted(loadAssignments);
</script>

<style scoped>
.my-trainings-page {
  min-height: 100%;
}

/* ========================= */
/* Header actions */
/* ========================= */

.header-btn {
  height: 40px;
  border-radius: 12px;
  font-weight: 700;
}

.header-search {
  min-width: 280px;
}

@media (max-width: 599px) {
  .header-search {
    min-width: 100%;
    width: 100%;
  }

  .header-btn {
    width: 100%;
  }
}

/* ========================= */
/* Metric cards */
/* ========================= */

.metric-card {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
}

.metric-card__section {
  padding: 18px 18px 16px;
}

.metric-card__content {
  min-width: 0;
  flex: 1;
}

.metric-card__label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.02em;
}

.metric-card__value {
  font-size: 1.9rem;
  font-weight: 900;
  line-height: 1.1;
  color: #0f172a;
}

.metric-card__helper {
  font-size: 0.8rem;
  line-height: 1.45;
  color: #475569;
}

.metric-card__icon-wrap {
  width: 46px;
  height: 46px;
  min-width: 46px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-card__bottom-bar {
  height: 4px;
  width: 100%;
}

/* ========================= */
/* Training cards */
/* ========================= */

.training-card {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background:
    radial-gradient(circle at top right, rgba(25, 118, 210, 0.08), transparent 32%),
    linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.training-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 46px rgba(15, 23, 42, 0.1);
  border-color: rgba(25, 118, 210, 0.24);
}

.training-card__section {
  padding: 20px;
}

.training-card__icon-wrap {
  width: 54px;
  height: 54px;
  min-width: 54px;
  border-radius: 18px;
  background: rgba(25, 118, 210, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.training-card__title {
  font-size: 1.02rem;
  font-weight: 800;
  line-height: 1.25;
  color: #0f172a;
}

.training-card__description {
  font-size: 0.82rem;
  line-height: 1.45;
  color: #64748b;
}

.training-card__separator {
  background: rgba(148, 163, 184, 0.16);
}

.training-card__actions {
  padding: 14px 18px 18px;
  gap: 8px;
}

.training-card__primary-btn {
  min-height: 38px;
  padding: 0 18px;
  font-weight: 700;
}

.training-card__secondary-btn {
  border-radius: 12px;
  font-weight: 700;
}

.training-type-chip {
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.72rem;
}

.status-chip {
  white-space: nowrap;
  border-radius: 999px;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

/* ========================= */
/* Progress */
/* ========================= */

.training-progress {
  padding: 14px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.86);
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.training-progress__label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
}

.training-progress__value {
  font-size: 0.9rem;
  font-weight: 900;
  color: #0f172a;
}

/* ========================= */
/* Info boxes */
/* ========================= */

.info-box {
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.95);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-box__icon {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-box__label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  line-height: 1.2;
}

.info-box__value {
  font-size: 0.92rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.2;
}

/* ========================= */
/* Metadata */
/* ========================= */

.training-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(241, 245, 249, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.training-meta__item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #64748b;
}

.training-meta__item strong {
  color: #0f172a;
  font-weight: 800;
}

/* ========================= */
/* Empty card */
/* ========================= */

.empty-card {
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.06);
}

.empty-card__icon {
  width: 86px;
  height: 86px;
  margin: 0 auto;
  border-radius: 28px;
  background: rgba(25, 118, 210, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ========================= */
/* Helpers */
/* ========================= */

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Soft backgrounds */

.bg-primary-soft {
  background: rgba(25, 118, 210, 0.1);
}

.bg-positive-soft {
  background: rgba(33, 186, 69, 0.1);
}

.bg-orange-soft {
  background: rgba(245, 124, 0, 0.1);
}

.bg-amber-soft {
  background: rgba(217, 119, 6, 0.1);
}

.bg-negative-soft {
  background: rgba(193, 32, 38, 0.1);
}

/* Bottom bars */

.bar-primary {
  background: linear-gradient(90deg, #1976d2, #42a5f5);
}

.bar-positive {
  background: linear-gradient(90deg, #21ba45, #6ddf7e);
}

.bar-amber {
  background: linear-gradient(90deg, #d97706, #fbbf24);
}

.bar-negative {
  background: linear-gradient(90deg, #c12026, #ef4444);
}

/* Responsive */

@media (max-width: 599px) {
  .training-card__section {
    padding: 16px;
  }

  .training-card__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .training-card__actions :deep(.q-btn) {
    width: 100%;
  }

  .status-chip {
    max-width: 120px;
  }
}
</style>