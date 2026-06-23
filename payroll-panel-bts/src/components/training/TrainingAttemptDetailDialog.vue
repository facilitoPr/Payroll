<template>
  <q-dialog v-model="modelValueLocal" maximized persistent>
    <q-card class="attempt-detail-shell">
      <!-- ========================= -->
      <!-- Header -->
      <!-- ========================= -->
      <q-card-section class="dialog-header q-pa-lg">
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="row items-center header-content">
              <div class="header-icon-wrap">
                <q-icon size="30px" name="fact_check" color="white" />
              </div>

              <div>
                <div class="text-h5 text-weight-bold text-white">
                  Detalle del intento
                </div>

                <div class="text-caption text-white">
                  {{ attempt?.training?.title || "Entrenamiento" }}
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-auto text-right">
            <q-btn
              round
              dense
              icon="close"
              class="bg-white text-primary"
              @click="closeDialog"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="content-wrapper q-pa-lg">
        <!-- ========================= -->
        <!-- Resultado principal -->
        <!-- ========================= -->
        <q-card flat bordered class="result-hero-card q-mb-lg">
          <q-card-section class="q-pa-lg">
            <div class="row q-col-gutter-lg items-center">
              <div class="col-12 col-md-4">
                <div class="score-panel">
                  <q-circular-progress
                    show-value
                    font-size="24px"
                    :value="scoreValue"
                    size="160px"
                    :thickness="0.16"
                    :color="attemptPassed ? 'positive' : 'negative'"
                    track-color="grey-3"
                    class="q-mb-md"
                  >
                    <div class="column items-center">
                      <div class="score-main">{{ scoreValue }}%</div>
                      <div class="score-caption">Score</div>
                    </div>
                  </q-circular-progress>

                  <q-chip
                    size="md"
                    :color="attemptStatusColor"
                    text-color="white"
                    class="result-chip"
                  >
                    <q-icon
                      :name="attemptPassed ? 'verified' : attemptFailed ? 'cancel' : 'schedule'"
                      size="17px"
                      class="q-mr-xs"
                    />
                    {{ attemptStatusLabel }}
                  </q-chip>
                </div>
              </div>

              <div class="col-12 col-md-8">
                <div class="result-summary">
                  <div class="text-h5 text-weight-bold text-dark">
                    {{ resultTitle }}
                  </div>

                  <div class="text-body2 text-grey-7 q-mt-xs">
                    {{ resultDescription }}
                  </div>

                  <div class="row q-col-gutter-md q-mt-md">
                    <div class="col-12 col-sm-4">
                      <div class="hero-stat-box">
                        <div class="hero-stat-icon bg-primary-soft">
                          <q-icon name="person" color="primary" size="22px" />
                        </div>

                        <div>
                          <div class="hero-stat-label">Usuario</div>
                          <div class="hero-stat-value ellipsis">
                            {{ attempt?.user?.name || "-" }}
                          </div>
                          <div class="hero-stat-caption ellipsis">
                            {{ attempt?.user?.email || "-" }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-sm-4">
                      <div class="hero-stat-box">
                        <div class="hero-stat-icon bg-indigo-soft">
                          <q-icon name="military_tech" color="indigo" size="22px" />
                        </div>

                        <div>
                          <div class="hero-stat-label">Puntos</div>
                          <div class="hero-stat-value">
                            {{ attempt?.pointsObtained || 0 }}/{{ attempt?.totalPoints || 0 }}
                          </div>
                          <div class="hero-stat-caption">
                            Puntos obtenidos
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-sm-4">
                      <div class="hero-stat-box">
                        <div class="hero-stat-icon bg-amber-soft">
                          <q-icon name="quiz" color="amber-9" size="22px" />
                        </div>

                        <div>
                          <div class="hero-stat-label">Preguntas</div>
                          <div class="hero-stat-value">
                            {{ questionResults.length }}
                          </div>
                          <div class="hero-stat-caption">
                            Evaluadas
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- ========================= -->
        <!-- Cards resumen -->
        <!-- ========================= -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div
            v-for="card in summaryCards"
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
        <!-- Barra de rendimiento -->
        <!-- ========================= -->
        <q-card flat bordered class="rounded-card performance-card q-mb-lg">
          <q-card-section>
            <div class="row items-center justify-between q-col-gutter-md">
              <div class="col-12 col-md">
                <div class="text-subtitle1 text-weight-bold text-dark">
                  Rendimiento del intento
                </div>
                <div class="text-caption text-grey-7">
                  Resumen de respuestas correctas, incorrectas y pendientes.
                </div>
              </div>

              <div class="col-12 col-md-auto">
                <q-chip
                  :color="attemptPassed ? 'positive' : attemptFailed ? 'negative' : 'warning'"
                  text-color="white"
                  class="result-chip"
                >
                  {{ correctPercentage }}% correctas
                </q-chip>
              </div>
            </div>

            <div class="q-mt-md">
              <q-linear-progress
                rounded
                size="12px"
                :value="correctProgressValue"
                :color="attemptPassed ? 'positive' : 'negative'"
                track-color="grey-3"
              />
            </div>

            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-12 col-sm-4">
                <div class="mini-stat-box">
                  <span class="mini-dot bg-positive"></span>
                  <span>Correctas</span>
                  <strong>{{ correctAnswersCount }}</strong>
                </div>
              </div>

              <div class="col-12 col-sm-4">
                <div class="mini-stat-box">
                  <span class="mini-dot bg-negative"></span>
                  <span>Incorrectas</span>
                  <strong>{{ incorrectAnswersCount }}</strong>
                </div>
              </div>

              <div class="col-12 col-sm-4">
                <div class="mini-stat-box">
                  <span class="mini-dot bg-grey-5"></span>
                  <span>Sin respuesta</span>
                  <strong>{{ unansweredCount }}</strong>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- ========================= -->
        <!-- Resultados por pregunta -->
        <!-- ========================= -->
        <q-card flat bordered class="rounded-card questions-section-card">
          <q-card-section class="section-header">
            <div class="row items-center justify-between q-col-gutter-md">
              <div class="col-12 col-md">
                <div class="row items-center q-gutter-sm text-primary">
                  <q-icon name="format_list_numbered" size="md" />
                  <div class="text-h6 text-weight-bold">
                    Revisión de respuestas
                  </div>
                </div>

                <div class="text-caption text-grey-7 q-mt-xs">
                  Detalle de cada pregunta respondida durante el intento.
                </div>
              </div>

              <div class="col-12 col-md-auto">
                <q-chip color="primary" text-color="white">
                  {{ questionResults.length }} pregunta(s)
                </q-chip>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="column q-gutter-md">
            <q-card
              v-for="(item, index) in questionResults"
              :key="item.question._id || index"
              flat
              bordered
              class="question-result-card"
              :class="getQuestionResultClass(item)"
            >
              <q-card-section>
                <div class="row items-start justify-between q-col-gutter-md">
                  <div class="col-12 col-md">
                    <div class="row items-center q-gutter-sm q-mb-sm">
                      <div class="question-number">
                        {{ getQuestionNumber(item, index) }}
                      </div>

                      <q-chip
                        dense
                        outline
                        color="primary"
                        text-color="primary"
                        class="question-type-chip"
                      >
                        {{ getQuestionTypeLabel(item.question.type) }}
                      </q-chip>

                      <q-chip
                        dense
                        :color="getAnswerStatusColor(item)"
                        text-color="white"
                      >
                        <q-icon
                          :name="getAnswerStatusIcon(item)"
                          size="14px"
                          class="q-mr-xs"
                        />
                        {{ getAnswerStatusLabel(item) }}
                      </q-chip>
                    </div>

                    <div class="question-title">
                      {{ item.question.questionText }}
                    </div>

                    <div class="answer-grid q-mt-md">
                      <div class="answer-box">
                        <div class="answer-box__label">
                          Respuesta del usuario
                        </div>

                        <div class="answer-box__value">
                          {{ formatUserAnswer(item) }}
                        </div>
                      </div>

                      <div
                        v-if="showCorrectAnswers"
                        class="answer-box answer-box--correct"
                      >
                        <div class="answer-box__label">
                          Respuesta correcta
                        </div>

                        <div class="answer-box__value">
                          {{ formatCorrectAnswer(item) }}
                        </div>
                      </div>
                    </div>

                    <q-banner
                      v-if="item.question.explanation"
                      class="explanation-banner q-mt-md"
                    >
                      <template #avatar>
                        <q-icon name="lightbulb" color="amber-9" />
                      </template>

                      <div class="text-caption text-grey-7 text-weight-bold q-mb-xs">
                        Explicación
                      </div>

                      <div class="text-body2">
                        {{ item.question.explanation }}
                      </div>
                    </q-banner>
                  </div>

                  <div class="col-12 col-md-auto">
                    <div class="points-box">
                      <div class="points-value">
                        {{ item.answer?.pointsObtained || 0 }}
                      </div>
                      <div class="points-label">
                        de {{ item.question.points || 0 }} pts
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <div v-if="!questionResults.length" class="empty-state">
              No hay resultados de preguntas para este intento.
            </div>
          </q-card-section>
        </q-card>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, useModel } from "vue";
import type {
  TrainingAttempt,
  TrainingAttemptQuestionResult,
} from "src/types/training";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    attempt: TrainingAttempt | null;
    questionResults: TrainingAttemptQuestionResult[];
    showCorrectAnswers?: boolean;
  }>(),
  {
    showCorrectAnswers: true,
  },
);

const emit = defineEmits(["update:modelValue"]);
const modelValueLocal = useModel(props, "modelValue");

const scoreValue = computed(() => {
  const value = Number(props.attempt?.score || 0);
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
});

const attemptPassed = computed(() => {
  return props.attempt?.status === "PASSED";
});

const attemptFailed = computed(() => {
  return props.attempt?.status === "FAILED";
});

const attemptStatusColor = computed(() => {
  if (props.attempt?.status === "PASSED") return "positive";
  if (props.attempt?.status === "FAILED") return "negative";
  if (props.attempt?.status === "IN_PROGRESS") return "warning";
  return "primary";
});

const attemptStatusLabel = computed(() => {
  if (props.attempt?.status === "PASSED") return "Aprobado";
  if (props.attempt?.status === "FAILED") return "Fallido";
  if (props.attempt?.status === "IN_PROGRESS") return "En progreso";
  if (props.attempt?.status === "SUBMITTED") return "Enviado";
  return props.attempt?.status || "-";
});

const resultTitle = computed(() => {
  if (attemptPassed.value) return "Intento aprobado";
  if (attemptFailed.value) return "Intento no aprobado";
  if (props.attempt?.status === "IN_PROGRESS") return "Intento en progreso";
  return "Resultado del intento";
});

const resultDescription = computed(() => {
  if (attemptPassed.value) {
    return "El usuario alcanzó el puntaje requerido para aprobar este entrenamiento.";
  }

  if (attemptFailed.value) {
    return "El usuario no alcanzó el puntaje requerido en este intento.";
  }

  if (props.attempt?.status === "IN_PROGRESS") {
    return "Este intento todavía no ha sido finalizado.";
  }

  return "Resumen general del desempeño obtenido en este intento.";
});

const correctAnswersCount = computed(() => {
  return props.questionResults.filter((item) => item.answer?.isCorrect).length;
});

const unansweredCount = computed(() => {
  return props.questionResults.filter((item) => !hasUserAnswer(item)).length;
});

const incorrectAnswersCount = computed(() => {
  return props.questionResults.filter((item) => {
    return hasUserAnswer(item) && !item.answer?.isCorrect;
  }).length;
});

const correctPercentage = computed(() => {
  if (!props.questionResults.length) return 0;
  return Math.round((correctAnswersCount.value / props.questionResults.length) * 100);
});

const correctProgressValue = computed(() => {
  if (!props.questionResults.length) return 0;
  return correctAnswersCount.value / props.questionResults.length;
});

const summaryCards = computed(() => {
  return [
    {
      key: "score",
      label: "Puntuación",
      value: `${scoreValue.value}%`,
      helper: attemptPassed.value ? "Puntaje aprobado" : "Puntaje obtenido",
      icon: "analytics",
      iconClass: attemptPassed.value ? "text-positive" : "text-negative",
      iconBgClass: attemptPassed.value ? "bg-positive-soft" : "bg-negative-soft",
      barClass: attemptPassed.value ? "bar-positive" : "bar-negative",
    },
    {
      key: "correct",
      label: "Correctas",
      value: correctAnswersCount.value,
      helper: `${correctPercentage.value}% del total`,
      icon: "check_circle",
      iconClass: "text-positive",
      iconBgClass: "bg-positive-soft",
      barClass: "bar-positive",
    },
    {
      key: "incorrect",
      label: "Incorrectas",
      value: incorrectAnswersCount.value,
      helper: `${unansweredCount.value} sin respuesta`,
      icon: "cancel",
      iconClass: "text-negative",
      iconBgClass: "bg-negative-soft",
      barClass: "bar-negative",
    },
    {
      key: "points",
      label: "Puntos",
      value: `${props.attempt?.pointsObtained || 0}/${props.attempt?.totalPoints || 0}`,
      helper: "Puntos acumulados",
      icon: "military_tech",
      iconClass: "text-indigo",
      iconBgClass: "bg-indigo-soft",
      barClass: "bar-indigo",
    },
  ];
});

const closeDialog = () => {
  emit("update:modelValue", false);
};

const getQuestionNumber = (item: TrainingAttemptQuestionResult, index: number) => {
  const order = Number(item.question?.order);

  if (Number.isFinite(order)) {
    return order + 1;
  }

  return index + 1;
};

const getQuestionTypeLabel = (type: string) => {
  if (type === "SHORT_TEXT") return "Texto corto";
  if (type === "LONG_TEXT") return "Texto largo";
  if (type === "SINGLE_CHOICE") return "Una respuesta";
  if (type === "MULTIPLE_CHOICE") return "Selección múltiple";
  if (type === "TRUE_FALSE") return "Verdadero/Falso";
  return type || "-";
};

const hasUserAnswer = (item: TrainingAttemptQuestionResult) => {
  const answer = item.answer;

  if (!answer) return false;

  if (answer.answerText && String(answer.answerText).trim()) return true;

  if (
    Array.isArray(answer.selectedOptions) &&
    answer.selectedOptions.length > 0
  ) {
    return true;
  }

  if (answer.booleanAnswer !== null && answer.booleanAnswer !== undefined) {
    return true;
  }

  return false;
};

const getAnswerStatusColor = (item: TrainingAttemptQuestionResult) => {
  if (!hasUserAnswer(item)) return "grey-6";
  return item.answer?.isCorrect ? "positive" : "negative";
};

const getAnswerStatusIcon = (item: TrainingAttemptQuestionResult) => {
  if (!hasUserAnswer(item)) return "help";
  return item.answer?.isCorrect ? "check_circle" : "cancel";
};

const getAnswerStatusLabel = (item: TrainingAttemptQuestionResult) => {
  if (!hasUserAnswer(item)) return "Sin respuesta";
  return item.answer?.isCorrect ? "Correcta" : "Incorrecta";
};

const getQuestionResultClass = (item: TrainingAttemptQuestionResult) => {
  if (!hasUserAnswer(item)) return "question-result-card--empty";
  return item.answer?.isCorrect
    ? "question-result-card--correct"
    : "question-result-card--incorrect";
};

const formatUserAnswer = (item: TrainingAttemptQuestionResult) => {
  const answer = item.answer;

  if (!answer) return "Sin respuesta";

  if (answer.answerText && String(answer.answerText).trim()) {
    return answer.answerText;
  }

  if (
    Array.isArray(answer.selectedOptions) &&
    answer.selectedOptions.length > 0
  ) {
    return answer.selectedOptions.join(", ");
  }

  if (answer.booleanAnswer !== null && answer.booleanAnswer !== undefined) {
    return answer.booleanAnswer ? "Verdadero" : "Falso";
  }

  return "Sin respuesta";
};

const formatCorrectAnswer = (item: TrainingAttemptQuestionResult) => {
  const question: any = item.question;

  if (Array.isArray(question.correctAnswers) && question.correctAnswers.length) {
    return question.correctAnswers.join(", ");
  }

  if (Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length) {
    return question.acceptedAnswers.join(", ");
  }

  if (question.correctBooleanAnswer !== null && question.correctBooleanAnswer !== undefined) {
    return question.correctBooleanAnswer ? "Verdadero" : "Falso";
  }

  return "-";
};
</script>

<style scoped>
.attempt-detail-shell {
  background:
    radial-gradient(circle at top left, rgba(25, 118, 210, 0.06), transparent 34%),
    linear-gradient(180deg, #f5f7fb 0%, #eef2f7 100%);
}

.dialog-header {
  background: var(--q-primary);
  color: white;
}

.header-content {
  gap: 12px;
}

.header-icon-wrap {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-wrapper {
  max-width: 1500px;
  width: 100%;
  margin: 0 auto;
}

.rounded-card {
  border-radius: 22px;
}

/* ========================= */
/* Result hero */
/* ========================= */

.result-hero-card {
  border-radius: 26px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    radial-gradient(circle at top right, rgba(25, 118, 210, 0.1), transparent 36%),
    linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.07);
  overflow: hidden;
}

.score-panel {
  min-height: 260px;
  border-radius: 24px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.score-main {
  font-size: 1.8rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1;
}

.score-caption {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  margin-top: 3px;
}

.result-chip {
  border-radius: 999px;
  font-weight: 800;
}

.result-summary {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-stat-box {
  min-height: 100px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.95);
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-stat-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-stat-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: #64748b;
}

.hero-stat-value {
  font-size: 1rem;
  font-weight: 900;
  color: #0f172a;
  max-width: 180px;
}

.hero-stat-caption {
  font-size: 0.72rem;
  color: #64748b;
  max-width: 180px;
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
  font-size: 1.65rem;
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
/* Performance */
.performance-card,
.questions-section-card {
  background: white;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.mini-stat-box {
  min-height: 48px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.95);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 0.82rem;
}

.mini-stat-box strong {
  margin-left: auto;
  color: #0f172a;
  font-size: 0.95rem;
}

.mini-dot {
  width: 10px;
  height: 10px;
  min-width: 10px;
  border-radius: 999px;
}

/* ========================= */
/* Questions */
.section-header {
  background:
    radial-gradient(circle at top right, rgba(25, 118, 210, 0.08), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
}

.question-result-card {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.question-result-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: #94a3b8;
}

.question-result-card--correct::before {
  background: #21ba45;
}

.question-result-card--incorrect::before {
  background: #c12026;
}

.question-result-card--empty::before {
  background: #94a3b8;
}

.question-number {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: rgba(25, 118, 210, 0.1);
  color: var(--q-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
}

.question-type-chip {
  border-radius: 999px;
  font-weight: 800;
}

.question-title {
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.35;
  color: #0f172a;
}

.answer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.answer-box {
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.95);
  padding: 14px;
}

.answer-box--correct {
  background: rgba(33, 186, 69, 0.06);
  border-color: rgba(33, 186, 69, 0.18);
}

.answer-box__label {
  font-size: 0.76rem;
  font-weight: 800;
  color: #64748b;
  margin-bottom: 5px;
}

.answer-box__value {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #0f172a;
  white-space: pre-wrap;
}

.explanation-banner {
  border-radius: 18px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  color: #0f172a;
}

.points-box {
  width: 110px;
  min-height: 86px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.points-value {
  font-size: 1.5rem;
  font-weight: 900;
  line-height: 1;
  color: #0f172a;
}

.points-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  margin-top: 5px;
}

.empty-state {
  padding: 24px;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  text-align: center;
  color: #64748b;
  background: #fff;
}

/* ========================= */
/* Soft colors */
.bg-primary-soft {
  background: rgba(25, 118, 210, 0.1);
}

.bg-positive-soft {
  background: rgba(33, 186, 69, 0.1);
}

.bg-negative-soft {
  background: rgba(193, 32, 38, 0.1);
}

.bg-indigo-soft {
  background: rgba(99, 102, 241, 0.1);
}

.bg-amber-soft {
  background: rgba(217, 119, 6, 0.1);
}

/* ========================= */
/* Bars */
.bar-positive {
  background: linear-gradient(90deg, #21ba45, #6ddf7e);
}

.bar-negative {
  background: linear-gradient(90deg, #c12026, #ef4444);
}

.bar-indigo {
  background: linear-gradient(90deg, #6366f1, #818cf8);
}

/* ========================= */
/* Responsive */
@media (min-width: 768px) {
  .answer-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .dialog-header {
    padding: 18px !important;
  }

  .content-wrapper {
    padding: 14px !important;
  }

  .score-panel {
    min-height: 220px;
  }

  .result-summary {
    min-height: auto;
  }

  .points-box {
    width: 100%;
    min-height: 72px;
  }
}
</style>