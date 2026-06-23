<template>
  <q-dialog v-model="dialogModel" maximized persistent>
    <q-card class="training-detail-shell">
      <!-- ========================= -->
      <!-- Header -->
      <!-- ========================= -->
      <q-card-section class="dialog-header q-pa-lg">
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="row items-center q-gutter-sm">
              <div class="header-icon-wrap">
                <q-icon size="30px" name="school" color="white" />
              </div>

              <div>
                <div class="text-h5 text-weight-bold text-white">
                  {{ training?.title || "Detalle del entrenamiento" }}
                </div>
                <div class="text-caption text-white">
                  Visualiza el contenido, inicia la prueba y completa tu entrenamiento.
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

      <q-card-section class="q-pa-lg content-wrapper">
        <!-- ========================= -->
        <!-- Loading -->
        <!-- ========================= -->
        <template v-if="loading">
          <q-card flat bordered class="rounded-card section-card">
            <q-card-section class="q-gutter-md">
              <q-skeleton type="text" width="50%" />
              <q-skeleton type="text" width="30%" />
              <q-skeleton type="rect" height="180px" />
              <q-skeleton type="text" width="70%" />
              <q-skeleton type="rect" height="220px" />
            </q-card-section>
          </q-card>
        </template>

        <template v-else>
          <!-- ========================= -->
          <!-- Top Summary -->
          <!-- ========================= -->
          <q-card flat bordered class="rounded-card top-summary-card q-mb-md">
            <q-card-section class="row q-col-gutter-md">
              <div class="col-12 col-sm-6 col-lg-3">
                <div class="summary-box">
                  <div class="summary-icon bg-primary-soft">
                    <q-icon name="assignment" color="primary" size="22px" />
                  </div>

                  <div>
                    <div class="summary-label">Estado</div>
                    <q-chip dense :color="statusColor" text-color="white">
                      {{ getAssignmentStatusLabel(assignment?.status) }}
                    </q-chip>
                  </div>
                </div>
              </div>

              <div class="col-12 col-sm-6 col-lg-3">
                <div class="summary-box">
                  <div class="summary-icon bg-positive-soft">
                    <q-icon name="verified" color="positive" size="22px" />
                  </div>

                  <div>
                    <div class="summary-label">Pase mínimo</div>
                    <div class="summary-value">{{ training?.passScore || 0 }}%</div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-sm-6 col-lg-3">
                <div class="summary-box">
                  <div class="summary-icon bg-amber-soft">
                    <q-icon name="history" color="amber-9" size="22px" />
                  </div>

                  <div>
                    <div class="summary-label">Intentos usados</div>
                    <div class="summary-value">
                      {{ assignment?.totalAttemptsUsed || 0 }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-sm-6 col-lg-3">
                <div class="summary-box">
                  <div class="summary-icon bg-indigo-soft">
                    <q-icon name="analytics" color="indigo" size="22px" />
                  </div>

                  <div>
                    <div class="summary-label">Mi score</div>
                    <div class="summary-value">{{ assignment?.score || 0 }}%</div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- ========================= -->
          <!-- Tabs -->
          <!-- ========================= -->
          <q-tabs
            v-model="tab"
            inline-label
            no-caps
            active-color="primary"
            indicator-color="primary"
            class="detail-tabs q-mb-md"
          >
            <q-tab name="content" icon="article" label="Contenido" />
            <q-tab name="questions" icon="quiz" label="Prueba" />
          </q-tabs>

          <q-tab-panels v-model="tab" animated class="bg-transparent">
            <!-- ========================= -->
            <!-- Content Tab -->
            <!-- ========================= -->
            <q-tab-panel name="content" class="q-pa-none">
              <q-card flat bordered class="rounded-card section-card">
                <q-card-section
                  class="row items-center justify-between section-header q-col-gutter-md"
                >
                  <div class="col-12 col-md">
                    <div class="row items-center q-gutter-sm text-primary">
                      <q-icon name="article" size="md" />
                      <div class="text-h6 text-weight-bold">Contenido</div>
                    </div>

                    <div class="text-caption text-grey-7 q-mt-xs">
                      Revisa el material antes de iniciar la prueba.
                    </div>
                  </div>

                  <div class="col-12 col-md-auto">
                    <q-btn
                      color="primary"
                      rounded
                      unelevated
                      icon="quiz"
                      :label="currentAttempt ? 'Continuar prueba' : 'Iniciar prueba'"
                      @click="startTestMode"
                    />
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="column q-gutter-md">
                  <q-card
                    v-for="block in contentBlocks"
                    :key="block._id"
                    flat
                    bordered
                    class="rounded-card item-card"
                  >
                    <q-card-section>
                      <div class="row items-start q-gutter-sm no-wrap">
                        <div class="content-block-icon">
                          <q-icon
                            :name="getContentBlockIcon(block.type)"
                            size="22px"
                            color="primary"
                          />
                        </div>

                        <div class="col">
                          <div class="text-subtitle2 text-weight-bold">
                            {{ block.title || getContentBlockLabel(block.type) }}
                          </div>

                          <div
                            v-if="block.description"
                            class="text-caption text-grey-7 q-mt-xs"
                          >
                            {{ block.description }}
                          </div>
                        </div>
                      </div>

                      <div v-if="block.type === 'TEXT'" class="text-body2 q-mt-md">
                        {{ block.content }}
                      </div>

                      <div v-else-if="block.type === 'YOUTUBE'" class="q-mt-md">
                        <div class="youtube-embed-wrap youtube-embed-wrap--fixed">
                          <iframe
                            :src="toYoutubeEmbed(block.url)"
                            frameborder="0"
                            allow="
                              accelerometer;
                              autoplay;
                              clipboard-write;
                              encrypted-media;
                              gyroscope;
                              picture-in-picture;
                              web-share;
                            "
                            allowfullscreen
                            class="youtube-embed-frame"
                          ></iframe>
                        </div>
                      </div>

                      <div v-else-if="block.type === 'IMAGE'" class="q-mt-md">
                        <q-img
                          :src="block.url"
                          fit="contain"
                          style="max-height: 380px"
                          class="rounded-borders"
                        />
                      </div>

                      <div v-else-if="block.type === 'PDF'" class="q-mt-md">
                        <q-card flat bordered class="pdf-preview-card">
                          <q-card-section>
                            <div class="row items-center justify-between q-col-gutter-md">
                              <div class="col">
                                <div class="text-subtitle2 text-weight-medium">
                                  Vista previa del documento
                                </div>
                                <div class="text-caption text-grey-7">
                                  Si no carga correctamente, puedes abrirlo en una nueva pestaña.
                                </div>
                              </div>

                              <div class="col-auto">
                                <q-btn
                                  color="primary"
                                  outline
                                  rounded
                                  icon="open_in_new"
                                  label="Abrir recurso"
                                  :href="block.url"
                                  target="_blank"
                                />
                              </div>
                            </div>

                            <div class="q-mt-md pdf-frame-wrap">
                              <iframe
                                :src="block.url"
                                class="pdf-frame"
                                frameborder="0"
                              />
                            </div>
                          </q-card-section>
                        </q-card>
                      </div>

                      <div v-else class="q-mt-md">
                        <q-btn
                          color="primary"
                          outline
                          rounded
                          icon="open_in_new"
                          label="Abrir recurso"
                          :href="block.url"
                          target="_blank"
                        />
                      </div>
                    </q-card-section>
                  </q-card>

                  <div v-if="!contentBlocks.length" class="empty-state">
                    Este entrenamiento no tiene bloques de contenido.
                  </div>
                </q-card-section>
              </q-card>
            </q-tab-panel>

            <!-- ========================= -->
            <!-- Questions / Test Tab -->
            <!-- ========================= -->
            <q-tab-panel name="questions" class="q-pa-none">
              <!-- Intro -->
              <q-card
                v-if="testMode === 'intro'"
                flat
                bordered
                class="rounded-card intro-card"
              >
                <q-card-section class="intro-header">
                  <div class="row items-center q-col-gutter-lg">
                    <div class="col-12 col-md">
                      <div class="row items-center q-gutter-sm">
                        <div class="intro-icon-wrap">
                          <q-icon name="quiz" size="32px" color="primary" />
                        </div>

                        <div>
                          <div class="text-h5 text-weight-bold text-dark">
                            Prueba de entrenamiento
                          </div>
                          <div class="text-caption text-grey-7">
                            Lee las instrucciones antes de comenzar.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-md-auto">
                      <q-chip
                        color="primary"
                        text-color="white"
                        icon="help"
                        class="intro-chip"
                      >
                        {{ questions.length }} pregunta(s)
                      </q-chip>
                    </div>
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="q-pa-lg">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-4">
                      <div class="intro-stat-box">
                        <q-icon name="verified" color="positive" size="26px" />
                        <div>
                          <div class="intro-stat-label">Pase mínimo</div>
                          <div class="intro-stat-value">
                            {{ training?.passScore || 0 }}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="intro-stat-box">
                        <q-icon name="history" color="amber-9" size="26px" />
                        <div>
                          <div class="intro-stat-label">Intentos usados</div>
                          <div class="intro-stat-value">
                            {{ assignment?.totalAttemptsUsed || 0 }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="intro-stat-box">
                        <q-icon name="assignment" color="primary" size="26px" />
                        <div>
                          <div class="intro-stat-label">Estado actual</div>
                          <div class="intro-stat-value">
                            {{ getAssignmentStatusLabel(assignment?.status) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <q-banner class="instructions-banner q-mt-lg">
                    <template #avatar>
                      <q-icon name="info" color="primary" />
                    </template>

                    <div class="text-subtitle2 text-weight-bold q-mb-xs">
                      Instrucciones
                    </div>

                    <div class="text-body2">
                      Responde cada pregunta con cuidado. Puedes avanzar y regresar entre preguntas
                      antes de enviar el intento. Las respuestas se guardan cuando presionas
                      <strong>Guardar</strong> o <strong>Siguiente</strong>. Al finalizar, confirma
                      el envío para obtener tu resultado.
                    </div>
                  </q-banner>

                  <div v-if="!questions.length" class="empty-state q-mt-lg">
                    Este entrenamiento no tiene preguntas disponibles.
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-actions align="right" class="q-pa-lg">
                  <q-btn
                    color="primary"
                    rounded
                    unelevated
                    icon="play_arrow"
                    :label="currentAttempt ? 'Continuar prueba' : 'Iniciar prueba'"
                    :disable="!questions.length"
                    :loading="startingAttempt"
                    @click="startTestMode"
                  />
                </q-card-actions>
              </q-card>

              <!-- Taking Test -->
              <q-card
                v-else-if="testMode === 'taking'"
                flat
                bordered
                class="rounded-card exam-card"
              >
                <q-card-section class="exam-header">
                  <div class="row items-center justify-between q-col-gutter-md">
                    <div class="col-12 col-md">
                      <div class="text-caption text-grey-7">
                        Pregunta {{ currentQuestionIndex + 1 }} de {{ questions.length }}
                      </div>

                      <div class="text-h6 text-weight-bold">
                        {{ training?.title || "Prueba de entrenamiento" }}
                      </div>
                    </div>

                    <div class="col-12 col-md-auto">
                      <q-chip color="primary" text-color="white" class="progress-chip">
                        {{ progressPercent }}% completado
                      </q-chip>
                    </div>
                  </div>

                  <q-linear-progress
                    rounded
                    size="9px"
                    :value="progressValue"
                    color="primary"
                    track-color="grey-3"
                    class="q-mt-md"
                  />
                </q-card-section>

                <q-separator />

                <q-card-section v-if="currentQuestion" class="exam-question-section">
                  <div class="row q-col-gutter-lg">
                    <div class="col-12 col-md-8">
                      <div class="question-card">
                        <div class="row items-start justify-between q-gutter-sm">
                          <div class="col">
                            <div class="row items-center q-gutter-sm q-mb-sm">
                              <q-chip
                                dense
                                outline
                                color="primary"
                                text-color="primary"
                                class="question-type-chip"
                              >
                                {{ getQuestionTypeLabel(currentQuestion.type) }}
                              </q-chip>

                              <q-chip
                                dense
                                :color="isQuestionAnswered(currentQuestion) ? 'positive' : 'grey-5'"
                                text-color="white"
                              >
                                {{
                                  isQuestionAnswered(currentQuestion)
                                    ? "Respondida"
                                    : "Pendiente"
                                }}
                              </q-chip>
                            </div>

                            <div class="question-title">
                              {{ currentQuestion.questionText }}
                            </div>
                          </div>

                          <q-chip
                            dense
                            :color="currentQuestion.isRequired ? 'primary' : 'grey-6'"
                            text-color="white"
                          >
                            {{
                              currentQuestion.isRequired
                                ? "Obligatoria"
                                : "Opcional"
                            }}
                          </q-chip>
                        </div>

                        <div class="q-mt-lg">
                          <q-input
                            v-if="currentQuestion.type === 'SHORT_TEXT'"
                            v-model="answersMap[currentQuestion._id].answerText"
                            outlined
                            rounded
                            label="Tu respuesta"
                            @blur="saveQuestionAnswer(currentQuestion, false)"
                          />

                          <q-input
                            v-else-if="currentQuestion.type === 'LONG_TEXT'"
                            v-model="answersMap[currentQuestion._id].answerText"
                            type="textarea"
                            autogrow
                            outlined
                            rounded
                            label="Tu respuesta"
                            @blur="saveQuestionAnswer(currentQuestion, false)"
                          />

                          <q-option-group
                            v-else-if="currentQuestion.type === 'SINGLE_CHOICE'"
                            v-model="answersMap[currentQuestion._id].selectedSingle"
                            :options="
                              currentQuestion.options.map((opt: any) => ({
                                label: `${opt.key}. ${opt.text}`,
                                value: opt.key,
                              }))
                            "
                            type="radio"
                            class="option-group-card"
                            @update:model-value="saveQuestionAnswer(currentQuestion, false)"
                          />

                          <q-option-group
                            v-else-if="currentQuestion.type === 'MULTIPLE_CHOICE'"
                            v-model="answersMap[currentQuestion._id].selectedOptions"
                            :options="
                              currentQuestion.options.map((opt: any) => ({
                                label: `${opt.key}. ${opt.text}`,
                                value: opt.key,
                              }))
                            "
                            type="checkbox"
                            class="option-group-card"
                            @update:model-value="saveQuestionAnswer(currentQuestion, false)"
                          />

                          <q-option-group
                            v-else-if="currentQuestion.type === 'TRUE_FALSE'"
                            v-model="answersMap[currentQuestion._id].booleanAnswer"
                            :options="[
                              { label: 'Verdadero', value: true },
                              { label: 'Falso', value: false },
                            ]"
                            type="radio"
                            class="option-group-card"
                            @update:model-value="saveQuestionAnswer(currentQuestion, false)"
                          />
                        </div>

                        <div class="row items-center justify-between q-mt-lg">
                          <div class="text-caption text-grey-7">
                            <q-icon name="save" size="16px" />
                            {{
                              savingQuestionId === currentQuestion._id
                                ? "Guardando respuesta..."
                                : isQuestionAnswered(currentQuestion)
                                  ? "Respuesta registrada"
                                  : "Responde y guarda para continuar"
                            }}
                          </div>

                          <q-btn
                            color="primary"
                            rounded
                            unelevated
                            icon="save"
                            label="Guardar"
                            :disable="!currentAttempt"
                            :loading="savingQuestionId === currentQuestion._id"
                            @click="saveQuestionAnswer(currentQuestion, true)"
                          />
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="question-map-card">
                        <div class="row items-center justify-between q-mb-md">
                          <div>
                            <div class="text-subtitle2 text-weight-bold">
                              Progreso
                            </div>
                            <div class="text-caption text-grey-7">
                              Navega entre preguntas
                            </div>
                          </div>

                          <q-circular-progress
                            show-value
                            font-size="12px"
                            :value="progressPercent"
                            size="58px"
                            :thickness="0.18"
                            color="primary"
                            track-color="grey-3"
                          >
                            {{ progressPercent }}%
                          </q-circular-progress>
                        </div>

                        <div class="question-map">
                          <q-btn
                            v-for="(question, index) in questions"
                            :key="question._id"
                            round
                            unelevated
                            size="sm"
                            :color="getQuestionMapColor(question, index)"
                            :text-color="getQuestionMapTextColor(question, index)"
                            :label="index + 1"
                            @click="goToQuestion(index)"
                          >
                            <q-tooltip>
                              {{
                                isQuestionAnswered(question)
                                  ? "Respondida"
                                  : "Pendiente"
                              }}
                            </q-tooltip>
                          </q-btn>
                        </div>

                        <q-separator class="q-my-md" />

                        <div class="column q-gutter-sm">
                          <div class="row items-center justify-between">
                            <span class="text-caption text-grey-7">Respondidas</span>
                            <strong class="text-positive">
                              {{ answeredQuestionsCount }}
                            </strong>
                          </div>

                          <div class="row items-center justify-between">
                            <span class="text-caption text-grey-7">Pendientes</span>
                            <strong class="text-warning">
                              {{ pendingQuestionsCount }}
                            </strong>
                          </div>

                          <div class="row items-center justify-between">
                            <span class="text-caption text-grey-7">Total</span>
                            <strong>{{ questions.length }}</strong>
                          </div>
                        </div>

                        <q-banner
                          v-if="pendingRequiredQuestionsCount > 0"
                          class="bg-orange-1 text-orange-10 q-mt-md rounded-borders"
                        >
                          Tienes {{ pendingRequiredQuestionsCount }} pregunta(s)
                          obligatoria(s) pendiente(s).
                        </q-banner>
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-actions align="between" class="exam-actions">
                  <q-btn
                    flat
                    color="grey-8"
                    icon="arrow_back"
                    label="Anterior"
                    :disable="currentQuestionIndex === 0"
                    @click="goToPreviousQuestion"
                  />

                  <div class="row q-gutter-sm">
                    <q-btn
                      outline
                      color="primary"
                      rounded
                      icon="article"
                      label="Ver contenido"
                      @click="tab = 'content'"
                    />

                    <q-btn
                      v-if="currentQuestionIndex < questions.length - 1"
                      color="primary"
                      rounded
                      unelevated
                      icon-right="arrow_forward"
                      label="Guardar y siguiente"
                      :loading="savingQuestionId === currentQuestion?._id"
                      @click="saveAndNext"
                    />

                    <q-btn
                      v-else
                      color="positive"
                      rounded
                      unelevated
                      icon-right="send"
                      label="Finalizar prueba"
                      :disable="!currentAttempt"
                      @click="openSubmitConfirm"
                    />
                  </div>
                </q-card-actions>
              </q-card>
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </q-card-section>

      <!-- ========================= -->
      <!-- Confirm Submit Dialog -->
      <!-- ========================= -->
      <q-dialog v-model="showSubmitConfirm" persistent>
        <q-card class="submit-confirm-card">
          <q-card-section class="submit-confirm-header">
            <div class="row items-center q-gutter-sm">
              <div class="submit-confirm-icon">
                <q-icon name="send" color="white" size="26px" />
              </div>

              <div>
                <div class="text-h6 text-weight-bold text-white">
                  Enviar intento
                </div>
                <div class="text-caption text-white">
                  Revisa tu progreso antes de finalizar.
                </div>
              </div>
            </div>
          </q-card-section>

          <q-card-section class="q-pa-lg">
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="confirm-stat-box">
                  <div class="text-caption text-grey-7">Respondidas</div>
                  <div class="text-h5 text-weight-bold text-positive">
                    {{ answeredQuestionsCount }}
                  </div>
                </div>
              </div>

              <div class="col-6">
                <div class="confirm-stat-box">
                  <div class="text-caption text-grey-7">Pendientes</div>
                  <div class="text-h5 text-weight-bold text-warning">
                    {{ pendingQuestionsCount }}
                  </div>
                </div>
              </div>
            </div>

            <q-banner
              v-if="pendingRequiredQuestionsCount > 0"
              class="bg-red-1 text-negative q-mt-md rounded-borders"
            >
              Tienes {{ pendingRequiredQuestionsCount }} pregunta(s) obligatoria(s)
              sin responder. Debes completarlas antes de enviar.
            </q-banner>

            <q-banner
              v-else
              class="bg-orange-1 text-orange-10 q-mt-md rounded-borders"
            >
              Después de enviar el intento, no podrás modificar tus respuestas.
            </q-banner>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              label="Cancelar"
              color="grey-8"
              :disable="submittingAttempt"
              v-close-popup
            />

            <q-btn
              unelevated
              rounded
              color="positive"
              icon="send"
              label="Enviar intento"
              :loading="submittingAttempt"
              :disable="pendingRequiredQuestionsCount > 0"
              @click="submitCurrentAttempt"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <TrainingAttemptDetailDialog
        v-model="showResultDialog"
        :attempt="attemptDetail"
        :question-results="attemptQuestionResults"
        :show-correct-answers="false"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { useTrainingEmployee } from "src/composable/useTrainingEmployee";
import TrainingAttemptDetailDialog from "src/components/training/TrainingAttemptDetailDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  trainingId: string | null;
}>();

const emit = defineEmits(["update:modelValue", "updated"]);

const $q = useQuasar();

const {
  getMyTrainingDetail,
  startAttempt,
  saveAnswer,
  submitAttempt,
  getMyAttemptDetail,
} = useTrainingEmployee();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const tab = ref("content");
const testMode = ref<"intro" | "taking">("intro");
const currentQuestionIndex = ref(0);

const loading = ref(false);
const startingAttempt = ref(false);
const submittingAttempt = ref(false);
const savingQuestionId = ref<string | null>(null);

const training = ref<any>(null);
const assignment = ref<any>(null);
const contentBlocks = ref<any[]>([]);
const questions = ref<any[]>([]);
const attempts = ref<any[]>([]);
const currentAttempt = ref<any>(null);

const attemptDetail = ref<any>(null);
const attemptQuestionResults = ref<any[]>([]);
const showResultDialog = ref(false);
const showSubmitConfirm = ref(false);

const answersMap = reactive<
  Record<
    string,
    {
      answerText: string;
      selectedSingle: string;
      selectedOptions: string[];
      booleanAnswer: boolean | null;
    }
  >
>({});

const notifyError = (message: string) => {
  $q.notify({ type: "negative", message });
};

const notifySuccess = (message: string) => {
  $q.notify({ type: "positive", message });
};

const statusColor = computed(() => {
  if (assignment.value?.status === "COMPLETED") return "positive";
  if (assignment.value?.status === "FAILED") return "negative";
  if (assignment.value?.status === "STARTED") return "warning";
  if (assignment.value?.status === "EXPIRED") return "grey-7";
  return "primary";
});

const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value] || null;
});

const answeredQuestionsCount = computed(() => {
  return questions.value.filter((question) => isQuestionAnswered(question)).length;
});

const pendingQuestionsCount = computed(() => {
  return questions.value.length - answeredQuestionsCount.value;
});

const pendingRequiredQuestionsCount = computed(() => {
  return questions.value.filter((question) => {
    return question.isRequired && !isQuestionAnswered(question);
  }).length;
});

const progressValue = computed(() => {
  if (!questions.value.length) return 0;
  return answeredQuestionsCount.value / questions.value.length;
});

const progressPercent = computed(() => {
  return Math.round(progressValue.value * 100);
});

const getAssignmentStatusLabel = (status: string) => {
  if (status === "COMPLETED") return "Completado";
  if (status === "FAILED") return "Fallido";
  if (status === "STARTED") return "En progreso";
  if (status === "EXPIRED") return "Expirado";
  if (status === "ASSIGNED") return "Asignado";
  return status || "-";
};

const getQuestionTypeLabel = (type: string) => {
  if (type === "SHORT_TEXT") return "Texto corto";
  if (type === "LONG_TEXT") return "Texto largo";
  if (type === "SINGLE_CHOICE") return "Una respuesta";
  if (type === "MULTIPLE_CHOICE") return "Selección múltiple";
  if (type === "TRUE_FALSE") return "Verdadero/Falso";
  return type;
};

const getContentBlockLabel = (type: string) => {
  if (type === "TEXT") return "Texto";
  if (type === "YOUTUBE") return "Video";
  if (type === "IMAGE") return "Imagen";
  if (type === "PDF") return "Documento PDF";
  return "Recurso";
};

const getContentBlockIcon = (type: string) => {
  if (type === "TEXT") return "article";
  if (type === "YOUTUBE") return "play_circle";
  if (type === "IMAGE") return "image";
  if (type === "PDF") return "picture_as_pdf";
  return "open_in_new";
};

const toYoutubeEmbed = (url: string) => {
  const raw = String(url || "");

  const watchId = raw.includes("watch?v=")
    ? raw.split("watch?v=")[1]?.split("&")[0]
    : raw.includes("youtu.be/")
      ? raw.split("youtu.be/")[1]?.split("?")[0]
      : raw.includes("/embed/")
        ? raw.split("/embed/")[1]?.split("?")[0]
        : raw;

  return `https://www.youtube.com/embed/${watchId}`;
};

const ensureAnswerState = () => {
  questions.value.forEach((question) => {
    if (!answersMap[question._id]) {
      answersMap[question._id] = {
        answerText: "",
        selectedSingle: "",
        selectedOptions: [],
        booleanAnswer: null,
      };
    }
  });
};

const clearAnswersMap = () => {
  Object.keys(answersMap).forEach((key) => {
    delete answersMap[key];
  });
};

const isQuestionAnswered = (question: any) => {
  const answer = answersMap[question._id];

  if (!answer) return false;

  if (["SHORT_TEXT", "LONG_TEXT"].includes(question.type)) {
    return !!answer.answerText?.trim();
  }

  if (question.type === "SINGLE_CHOICE") {
    return !!answer.selectedSingle;
  }

  if (question.type === "MULTIPLE_CHOICE") {
    return Array.isArray(answer.selectedOptions) && answer.selectedOptions.length > 0;
  }

  if (question.type === "TRUE_FALSE") {
    return answer.booleanAnswer !== null;
  }

  return false;
};

const getQuestionMapColor = (question: any, index: number) => {
  if (index === currentQuestionIndex.value) return "primary";
  if (isQuestionAnswered(question)) return "positive";
  if (question.isRequired) return "orange-4";
  return "grey-4";
};

const getQuestionMapTextColor = (question: any, index: number) => {
  if (index === currentQuestionIndex.value) return "white";
  if (isQuestionAnswered(question)) return "white";
  if (question.isRequired) return "white";
  return "grey-8";
};

const hydrateAnswersFromAttemptDetail = async (attemptId: string) => {
  try {
    const resp = await getMyAttemptDetail(attemptId);

    attemptDetail.value = resp.attempt;
    attemptQuestionResults.value = resp.questionResults || [];

    resp.questionResults.forEach((item: any) => {
      const questionId = item.question?._id || item.question;

      if (!questionId) return;

      if (!answersMap[questionId]) {
        answersMap[questionId] = {
          answerText: "",
          selectedSingle: "",
          selectedOptions: [],
          booleanAnswer: null,
        };
      }

      if (item.answer) {
        answersMap[questionId].answerText = item.answer.answerText || "";
        answersMap[questionId].selectedOptions = item.answer.selectedOptions || [];
        answersMap[questionId].selectedSingle =
          item.answer.selectedOptions?.[0] || "";
        answersMap[questionId].booleanAnswer =
          item.answer.booleanAnswer === undefined
            ? null
            : item.answer.booleanAnswer;
      }
    });
  } catch (error: any) {
    notifyError(error.message || "No se pudo cargar el detalle del intento");
  }
};

const loadTraining = async () => {
  if (!props.trainingId) return;

  try {
    loading.value = true;

    clearAnswersMap();

    const resp = await getMyTrainingDetail(props.trainingId);

    training.value = resp.training;
    assignment.value = resp.assignment;
    contentBlocks.value = resp.contentBlocks || [];
    questions.value = resp.questions || [];
    attempts.value = resp.attempts || [];

    ensureAnswerState();

    currentAttempt.value =
      attempts.value.find((item: any) => item.status === "IN_PROGRESS") || null;

    if (currentAttempt.value?._id) {
      await hydrateAnswersFromAttemptDetail(currentAttempt.value._id);
    }
  } catch (error: any) {
    notifyError(error.message || "No se pudo cargar el entrenamiento");
  } finally {
    loading.value = false;
  }
};

const ensureAttempt = async () => {
  try {
    if (currentAttempt.value?._id) return currentAttempt.value;

    if (!props.trainingId) {
      notifyError("No se encontró el entrenamiento");
      return null;
    }

    startingAttempt.value = true;

    const resp = await startAttempt(props.trainingId);

    currentAttempt.value = resp.attempt;
    notifySuccess(resp.mensaje || "Intento iniciado");

    if (currentAttempt.value?._id) {
      await hydrateAnswersFromAttemptDetail(currentAttempt.value._id);
    }

    return currentAttempt.value;
  } catch (error: any) {
    notifyError(error.message || "No se pudo iniciar el intento");
    return null;
  } finally {
    startingAttempt.value = false;
  }
};

const buildAnswerPayload = (question: any) => {
  const answerState = answersMap[question._id];

  const payload: any = {
    questionId: question._id,
  };

  if (["SHORT_TEXT", "LONG_TEXT"].includes(question.type)) {
    payload.answerText = answerState.answerText;
  }

  if (question.type === "SINGLE_CHOICE") {
    payload.selectedOptions = answerState.selectedSingle
      ? [answerState.selectedSingle]
      : [];
  }

  if (question.type === "MULTIPLE_CHOICE") {
    payload.selectedOptions = answerState.selectedOptions || [];
  }

  if (question.type === "TRUE_FALSE") {
    payload.booleanAnswer = answerState.booleanAnswer;
  }

  return payload;
};

const saveQuestionAnswer = async (question: any, showNotify = true) => {
  try {
    if (!question?._id) return;

    const attempt = await ensureAttempt();

    if (!attempt?._id) return;

    savingQuestionId.value = question._id;

    const payload = buildAnswerPayload(question);

    await saveAnswer(attempt._id, payload);

    if (showNotify) {
      notifySuccess("Respuesta guardada");
    }
  } catch (error: any) {
    notifyError(error.message || "No se pudo guardar la respuesta");
  } finally {
    savingQuestionId.value = null;
  }
};

const saveAndNext = async () => {
  if (!currentQuestion.value) return;

  await saveQuestionAnswer(currentQuestion.value, false);

  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
  }
};

const startTestMode = async () => {
  const attempt = await ensureAttempt();

  if (!attempt?._id) return;

  tab.value = "questions";
  testMode.value = "taking";

  if (currentQuestionIndex.value >= questions.value.length) {
    currentQuestionIndex.value = 0;
  }
};

const goToPreviousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
};

const goToQuestion = (index: number) => {
  if (index < 0 || index >= questions.value.length) return;
  currentQuestionIndex.value = index;
};

const openSubmitConfirm = async () => {
  if (currentQuestion.value) {
    await saveQuestionAnswer(currentQuestion.value, false);
  }

  showSubmitConfirm.value = true;
};

const submitCurrentAttempt = async () => {
  try {
    if (!currentAttempt.value?._id) {
      notifyError("Primero debes iniciar el intento");
      return;
    }

    if (pendingRequiredQuestionsCount.value > 0) {
      notifyError(
        `Tienes ${pendingRequiredQuestionsCount.value} pregunta(s) obligatoria(s) sin responder.`,
      );
      return;
    }

    submittingAttempt.value = true;

    const resp = await submitAttempt(currentAttempt.value._id);

    notifySuccess(resp?.mensaje || "Intento enviado");

    showSubmitConfirm.value = false;

    await hydrateAnswersFromAttemptDetail(currentAttempt.value._id);

    showResultDialog.value = true;

    await loadTraining();

    testMode.value = "intro";
    currentQuestionIndex.value = 0;

    emit("updated");
  } catch (error: any) {
    notifyError(error.message || "No se pudo enviar el intento");
  } finally {
    submittingAttempt.value = false;
  }
};

const closeDialog = () => {
  emit("update:modelValue", false);
};

watch(
  () => [props.modelValue, props.trainingId],
  async ([isOpen, trainingId]) => {
    if (isOpen && trainingId) {
      tab.value = "content";
      testMode.value = "intro";
      currentQuestionIndex.value = 0;
      showSubmitConfirm.value = false;
      showResultDialog.value = false;
      await loadTraining();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.training-detail-shell {
  background:
    radial-gradient(circle at top left, rgba(25, 118, 210, 0.06), transparent 34%),
    linear-gradient(180deg, #f5f7fb 0%, #eef2f7 100%);
}

.dialog-header {
  background: var(--q-primary);
  color: white;
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

.top-summary-card,
.section-card,
.item-card,
.pdf-preview-card,
.intro-card,
.exam-card {
  background: white;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

/* ========================= */
/* Summary */
.summary-box {
  background: #f8fafc;
  border-radius: 18px;
  padding: 14px 16px;
  min-height: 94px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.summary-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
  font-weight: 700;
}

.summary-value {
  font-size: 21px;
  font-weight: 900;
  color: #0f172a;
}

/* ========================= */
/* Tabs */
.detail-tabs {
  background: white;
  border-radius: 16px;
  padding: 6px 8px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}

.section-header {
  background:
    radial-gradient(circle at top right, rgba(25, 118, 210, 0.08), transparent 32%),
    #fcfdff;
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
/* Content */
.item-card {
  overflow: hidden;
}

.content-block-icon {
  width: 42px;
  height: 42px;
  min-width: 42px;
  border-radius: 15px;
  background: rgba(25, 118, 210, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.youtube-embed-wrap {
  position: relative;
  width: 100%;
  border-radius: 18px;
  overflow: hidden;
  background: #000;
  isolation: isolate;
}

.youtube-embed-wrap--fixed {
  height: clamp(220px, 45vw, 500px);
}

.youtube-embed-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.pdf-frame-wrap {
  width: 100%;
  height: 520px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.pdf-frame {
  width: 100%;
  height: 100%;
  display: block;
}

/* ========================= */
/* Intro */
.intro-header {
  background:
    radial-gradient(circle at top right, rgba(25, 118, 210, 0.1), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
}

.intro-icon-wrap {
  width: 58px;
  height: 58px;
  min-width: 58px;
  border-radius: 20px;
  background: rgba(25, 118, 210, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.intro-chip {
  border-radius: 999px;
  font-weight: 800;
}

.intro-stat-box {
  min-height: 92px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.95);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.intro-stat-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
}

.intro-stat-value {
  font-size: 1.15rem;
  font-weight: 900;
  color: #0f172a;
}

.instructions-banner {
  border-radius: 18px;
  background: rgba(25, 118, 210, 0.08);
  color: #0f172a;
  border: 1px solid rgba(25, 118, 210, 0.14);
}

/* ========================= */
/* Exam */
.exam-card {
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.08);
}

.exam-header {
  background:
    radial-gradient(circle at top right, rgba(25, 118, 210, 0.1), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
}

.progress-chip {
  border-radius: 999px;
  font-weight: 800;
}

.exam-question-section {
  padding: 24px;
}

.question-card {
  min-height: 390px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #ffffff;
  padding: 24px;
}

.question-title {
  font-size: 1.2rem;
  font-weight: 900;
  line-height: 1.35;
  color: #0f172a;
}

.question-type-chip {
  border-radius: 999px;
  font-weight: 800;
}

.question-map-card {
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #f8fafc;
  padding: 18px;
  position: sticky;
  top: 16px;
}

.question-map {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-group-card {
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.95);
  padding: 12px 14px;
}

.option-group-card :deep(.q-radio),
.option-group-card :deep(.q-checkbox) {
  border-radius: 14px;
  padding: 8px;
}

.exam-actions {
  padding: 16px 20px 20px;
  gap: 10px;
}

/* ========================= */
/* Submit confirm */
.submit-confirm-card {
  width: 100%;
  max-width: 560px;
  border-radius: 24px;
  overflow: hidden;
}

.submit-confirm-header {
  background: var(--q-primary);
}

.submit-confirm-icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-stat-box {
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.95);
  padding: 16px;
}

/* ========================= */
/* Soft colors */
.bg-primary-soft {
  background: rgba(25, 118, 210, 0.1);
}

.bg-positive-soft {
  background: rgba(33, 186, 69, 0.1);
}

.bg-amber-soft {
  background: rgba(217, 119, 6, 0.1);
}

.bg-indigo-soft {
  background: rgba(99, 102, 241, 0.1);
}

/* ========================= */
/* Responsive */
@media (max-width: 1024px) {
  .youtube-embed-wrap--fixed {
    height: clamp(220px, 50vw, 420px);
  }
}

@media (max-width: 768px) {
  .exam-question-section {
    padding: 16px;
  }

  .question-card {
    padding: 18px;
    min-height: auto;
  }

  .question-map-card {
    position: relative;
    top: 0;
  }

  .exam-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .exam-actions :deep(.q-btn) {
    width: 100%;
  }

  .pdf-frame-wrap {
    height: 360px;
  }

  .youtube-embed-wrap--fixed {
    height: clamp(200px, 56vw, 320px);
    border-radius: 14px;
  }
}

@media (max-width: 480px) {
  .dialog-header {
    padding: 18px !important;
  }

  .content-wrapper {
    padding: 14px !important;
  }

  .summary-box {
    min-height: auto;
  }

  .youtube-embed-wrap--fixed {
    height: clamp(180px, 58vw, 240px);
    border-radius: 12px;
  }
}
</style>