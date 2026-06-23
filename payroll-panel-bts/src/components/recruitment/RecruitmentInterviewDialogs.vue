<template>
  <q-dialog v-model="scheduleOpen" persistent>
    <q-card style="width: 760px; max-width: 96vw">
      <q-card-section class="row items-center justify-between bg-primary">
        <div>
          <div class="text-h6 text-weight-bold text-white">
            Agendar entrevista — {{ target?.candidateName || "—" }}
          </div>
          <div class="text-caption text-white">
            Formulario: {{ target?.formTitle || "—" }}
          </div>
        </div>
        <q-btn dense flat round icon="close" color="white" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <!-- Recomendación IA (screening) -->
        <q-card
          v-if="target?.aiDecision?.interview"
          flat
          bordered
          class="q-pa-md bg-grey-1 rounded-borders q-mb-md"
        >
          <div class="row items-center justify-between q-mb-sm">
            <div>
              <div class="text-subtitle2 text-weight-bold">
                Recomendación IA para la entrevista
              </div>
              <div class="text-caption text-grey-7">
                Sugerencia basada en la evaluación automática del candidato.
              </div>
            </div>

            <q-btn
              dense
              color="deep-purple-6"
              icon="auto_fix_high"
              label="Aplicar sugerencia"
              @click="applyAiInterviewSuggestion"
            />
          </div>

          <div class="row q-col-gutter-md items-start">
            <div class="col-12 col-md-4">
              <div class="text-caption text-grey-7 q-mb-xs">Recomendación</div>
              <q-chip
                dense
                :color="target.aiDecision.interview.recommend ? 'green-6' : 'grey-7'"
                text-color="white"
              >
                {{
                  target.aiDecision.interview.recommend
                    ? "Recomienda entrevistar"
                    : "No recomienda entrevistar"
                }}
              </q-chip>
            </div>

            <div class="col-12 col-md-4">
              <div class="text-caption text-grey-7 q-mb-xs">Prioridad</div>
              <q-chip
                dense
                outline
                :color="
                  target.aiDecision.interview.priority === 'ALTA'
                    ? 'red-6'
                    : target.aiDecision.interview.priority === 'MEDIA'
                    ? 'orange-7'
                    : 'grey-7'
                "
              >
                {{ target.aiDecision.interview.priority }}
              </q-chip>
            </div>

            <div class="col-12 col-md-4">
              <div class="text-caption text-grey-7 q-mb-xs">Modalidad sugerida</div>
              <q-chip dense outline color="primary">
                {{ target.aiDecision.interview.suggestedMode }}
              </q-chip>
            </div>

            <div class="col-12">
              <div class="text-caption text-grey-7 q-mb-xs">Puntos de enfoque sugeridos</div>

              <div
                v-if="Array.isArray(target.aiDecision.interview.focusPoints) && target.aiDecision.interview.focusPoints.length"
                class="row q-col-gutter-xs"
              >
                <div
                  v-for="(fp, i) in target.aiDecision.interview.focusPoints"
                  :key="i"
                  class="col-auto"
                >
                  <q-chip dense outline color="deep-purple-6">
                    {{ fp }}
                  </q-chip>
                </div>
              </div>

              <div v-else class="text-caption text-grey-6">
                Sin puntos específicos sugeridos.
              </div>
            </div>
          </div>
        </q-card>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              outlined
              dense
              type="datetime-local"
              v-model="interviewForm.scheduledAt"
              label="Fecha y hora de la entrevista"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-select
              outlined
              dense
              v-model="interviewForm.mode"
              :options="interviewModeOptionsComputed"
              label="Modalidad"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              outlined
              dense
              v-model="interviewForm.location"
              label="Lugar / Link"
              placeholder="Ej: Oficina central / Google Meet link"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-select
              outlined
              dense
              v-model="interviewForm.evaluators"
              :options="employeesOptions"
              option-label="name"
              option-value="_id"
              label="Empleados evaluadores"
              multiple
              use-chips
              emit-value
              map-options
            />
          </div>

          <div class="col-12">
            <q-input
              outlined
              dense
              autogrow
              type="textarea"
              v-model="interviewForm.notes"
              label="Notas para la entrevista"
              placeholder="Ej: traer documentos originales, prueba técnica, etc."
            />
          </div>
        </div>

        <q-banner class="bg-grey-2 rounded-borders q-mt-md">
          <div class="text-caption text-grey-7">
            * Esto enviará un correo al candidato y a los evaluadores.
          </div>
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cerrar" v-close-popup :disable="scheduleLoading" />

        <q-btn
          v-if="hasExistingInterview"
          color="negative"
          icon="event_busy"
          label="Cancelar entrevista"
          @click="cancelInterview"
          :loading="scheduleLoading"
          :disable="scheduleLoading"
        />

        <q-btn
          color="primary"
          :icon="hasExistingInterview ? 'edit_calendar' : 'send'"
          :label="hasExistingInterview ? 'Modificar entrevista' : 'Agendar entrevista'"
          :disable="!canScheduleInterview || scheduleLoading"
          :loading="scheduleLoading"
          @click="hasExistingInterview ? updateInterview() : scheduleInterview()"
        />

        <q-btn
          color="indigo-7"
          icon="assignment"
          label="Llenar evaluación"
          :disable="!target?.interview?.scheduledAt || scheduleLoading"
          @click="openEvaluation(target)"
        />
      </q-card-actions>

      <q-inner-loading :showing="scheduleLoading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>
    </q-card>
  </q-dialog>

  <!-- =========================
       DIALOG: EVALUACIÓN ENTREVISTA
  ========================== -->
  <q-dialog v-model="evaluationOpen" persistent maximized>
    <q-card class="bg-grey-1">
      <q-card-section class="row items-center justify-between bg-primary">
        <div>
          <div class="text-h6 text-weight-bold text-white">
            Formato de Evaluación de Entrevista — {{ target?.candidateName || "—" }}
          </div>
          <div class="text-caption text-white">
            Completa la evaluación del candidato.
          </div>
        </div>
        <q-btn dense flat round icon="close" color="white" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="target" class="q-pa-md">
        <!-- IA asistida -->
        <q-banner class="bg-grey-2 rounded-borders q-mb-md">
          <div class="row items-center justify-between">
            <div>
              <div class="text-weight-bold">Evaluación asistida por IA</div>
              <div class="text-caption text-grey-7">
                Genera una sugerencia automática usando las respuestas de esta entrevista.
              </div>
            </div>

            <div class="row items-center q-gutter-sm">
              <q-toggle v-model="autoAiOnSave" color="primary" label="Autoevaluar al guardar" dense />

              <q-btn
                color="deep-purple-6"
                icon="smart_toy"
                :loading="aiInterviewLoading"
                :disable="aiInterviewLoading"
                label="Analizar con IA"
                @click="runAiInterviewAnalysis({ applyToForm: true })"
              />
            </div>
          </div>

          <div v-if="target?.interview?.aiEvaluation" class="q-mt-sm text-caption text-grey-8">
            <b>IA:</b> evaluación existente guardada en la entrevista.
          </div>
        </q-banner>

        <!-- Header fields -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input outlined dense v-model="evaluationForm.jobPosition" label="Puesto al que aplica" disable />
          </div>

          <div class="col-12 col-md-4">
            <q-input outlined dense v-model="evaluationForm.date" type="date" label="Fecha" />
          </div>

          <div class="col-12 col-md-4">
            <q-input outlined dense v-model="evaluationForm.candidateName" label="Nombre del candidato" />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              outlined
              dense
              :model-value="evaluationForm?.interviewer?.name || ''"
              label="Entrevistador(es)"
              disable
            />
          </div>
        </div>

        <!-- 1. Competencias Profesionales -->
        <q-card flat bordered class="bg-white q-pa-md q-mt-md rounded-borders">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">
            1. Competencias Profesionales (0–5)
          </div>

          <div class="row q-col-gutter-md">
            <div v-for="c in evaluationForm.professionalCompetencies" :key="c.key" class="col-12 col-md-6">
              <q-card flat bordered class="q-pa-sm rounded-borders">
                <div class="text-body2 text-weight-bold">{{ c.label }}</div>
                <div class="text-caption text-grey-6 q-mb-xs">{{ c.description }}</div>
                <q-slider v-model="c.score" :min="0" :max="5" label label-always />
              </q-card>
            </div>
          </div>
        </q-card>

        <!-- 2. Habilidades Blandas -->
        <q-card flat bordered class="bg-white q-pa-md q-mt-md rounded-borders">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">
            2. Habilidades Blandas (0–5)
          </div>

          <div class="row q-col-gutter-md">
            <div v-for="c in evaluationForm.softSkills" :key="c.key" class="col-12 col-md-6">
              <q-card flat bordered class="q-pa-sm rounded-borders">
                <div class="text-body2 text-weight-bold">{{ c.label }}</div>
                <div class="text-caption text-grey-6 q-mb-xs">{{ c.description }}</div>
                <q-slider v-model="c.score" :min="0" :max="5" label label-always />
              </q-card>
            </div>
          </div>
        </q-card>

        <!-- 3. Evaluación General -->
        <q-card flat bordered class="bg-white q-pa-md q-mt-md rounded-borders">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">
            3. Evaluación General del Candidato (0–5)
          </div>

          <div class="row q-col-gutter-md">
            <div v-for="c in evaluationForm.generalCriteria" :key="c.key" class="col-12 col-md-6">
              <q-card flat bordered class="q-pa-sm rounded-borders">
                <div class="text-body2 text-weight-bold">{{ c.label }}</div>
                <div class="text-caption text-grey-6 q-mb-xs">{{ c.description }}</div>
                <q-slider v-model="c.score" :min="0" :max="5" label label-always />
              </q-card>
            </div>
          </div>
        </q-card>

        <!-- 4. Preguntas clave -->
        <q-card flat bordered class="bg-white q-pa-md q-mt-md rounded-borders">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">
            4. Preguntas Clave de la Entrevista
          </div>

          <div class="row q-col-gutter-md">
            <div v-for="q in evaluationForm.keyQuestions" :key="q.key" class="col-12">
              <q-input outlined dense autogrow type="textarea" :label="q.label" v-model="q.answer" />
            </div>
          </div>
        </q-card>

        <!-- 5. Comentarios -->
        <q-card flat bordered class="bg-white q-pa-md q-mt-md rounded-borders">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">
            5. Comentarios del Entrevistador
          </div>
          <q-input outlined dense autogrow type="textarea" v-model="evaluationForm.comments" />
        </q-card>

        <!-- 6. Recomendación final -->
        <q-card flat bordered class="bg-white q-pa-md q-mt-md rounded-borders">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">
            6. Recomendación Final
          </div>

          <q-option-group v-model="evaluationForm.recommendation" type="radio" :options="recommendationOptions" />
        </q-card>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md bg-white">
        <q-btn flat label="Cancelar" v-close-popup :disable="evaluationLoading || aiInterviewLoading" />
        <q-btn
          color="primary"
          icon="save"
          label="Guardar evaluación"
          @click="saveEvaluation"
          :loading="evaluationLoading"
          :disable="evaluationLoading || aiInterviewLoading"
        />
      </q-card-actions>

      <q-inner-loading :showing="evaluationLoading || aiInterviewLoading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { Notify } from "quasar";
import moment from "moment";
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";

const auth = authStore();

const props = defineProps({
  employeesOptions: { type: Array, default: () => [] },
  interviewModeOptions: { type: Array, default: () => ["Presencial", "Virtual", "Telefónica"] },

  // endpoints para no amarrarte:
  endpoints: {
    type: Object,
    default: () => ({
      schedule: (id) => `recruitment/scheduleInterview/${id}`,
      update: (id) => `recruitment/updateInterview/${id}`,
      cancel: (id) => `recruitment/cancelInterview/${id}`,
      saveEvaluation: (id) => `recruitment/saveInterviewEvaluation/${id}`,

      // si lo implementas:
      runInterviewAi: (id) => `recruitment/runInterviewAiForApplication/${id}`,
    }),
  },
});

const emit = defineEmits([
  // dispara en padre para recargar lista o actualizar fila:
  "changed",
]);

function deepClone(v) {
  return JSON.parse(JSON.stringify(v ?? null));
}

function getAppId(app) {
  return app?._id || app?.id || app?.applicationId || null;
}

const target = ref(null);

const scheduleOpen = ref(false);
const evaluationOpen = ref(false);

const scheduleLoading = ref(false);
const evaluationLoading = ref(false);

// IA entrevista
const autoAiOnSave = ref(true);
const aiInterviewLoading = ref(false);

const interviewModeOptionsComputed = computed(() => props.interviewModeOptions);

const interviewForm = reactive({
  scheduledAt: "",
  mode: "Presencial",
  location: "",
  evaluators: [],
  notes: "",
});

const hasExistingInterview = computed(() => {
  return !!target.value?.interview?.scheduledAt;
});

const canScheduleInterview = computed(() => {
  return (
    !!interviewForm.scheduledAt &&
    !!interviewForm.mode &&
    !!interviewForm.location &&
    Array.isArray(interviewForm.evaluators) &&
    interviewForm.evaluators.length > 0
  );
});

function resetInterviewForm() {
  interviewForm.scheduledAt = "";
  interviewForm.mode = "Presencial";
  interviewForm.location = "";
  interviewForm.evaluators = [];
  interviewForm.notes = "";
}

/** =========================
 *  API: abrir diálogos
 * ========================= */
function openSchedule(app) {
  target.value = deepClone(app);

  const itv = target.value?.interview || null;
  if (itv?.scheduledAt) {
    // datetime-local requiere "YYYY-MM-DDTHH:mm"
    interviewForm.scheduledAt = moment(itv.scheduledAt).format("YYYY-MM-DDTHH:mm");
    interviewForm.mode = itv.mode || "Presencial";
    interviewForm.location = itv.location || "";
    interviewForm.evaluators = Array.isArray(itv.evaluators) ? [...itv.evaluators] : [];
    interviewForm.notes = itv.notes || "";
  } else {
    resetInterviewForm();
  }

  scheduleOpen.value = true;
}

function openEvaluation(app) {
  target.value = deepClone(app);

  // si no hay interview, crea contenedor
  if (!target.value.interview) target.value.interview = {};

  // si ya existe evaluation, clonarla
  if (target.value?.interview?.evaluation) {
    Object.assign(evaluationForm, deepClone(target.value.interview.evaluation));
  } else {
    Object.assign(evaluationForm, baseEvaluationForm());
    evaluationForm.candidateName = target.value?.candidateName || target.value?.answers?.fullName || "";
    evaluationForm.jobPosition = target.value?.jobPosition || "";
    evaluationForm.interviewer = target.value?.interview?.interviewer || auth?.user || { name: "" };
  }

  // Siempre setear jobPosition desde app
  evaluationForm.jobPosition = target.value?.jobPosition || evaluationForm.jobPosition || "";

  evaluationOpen.value = true;
}

defineExpose({
  openSchedule,
  openEvaluation,
});

/** =========================
 *  IA suggestion para scheduling
 * ========================= */
function applyAiInterviewSuggestion() {
  const aiInterview = target.value?.aiDecision?.interview;
  if (!aiInterview) return;

  interviewForm.mode = aiInterview.suggestedMode || interviewForm.mode;

  const points = Array.isArray(aiInterview.focusPoints) ? aiInterview.focusPoints : [];
  const header = `Sugerencia IA:\n- Prioridad: ${aiInterview.priority}\n- Modalidad sugerida: ${aiInterview.suggestedMode}\n`;
  const focus = points.length ? `\nPuntos de enfoque:\n${points.map((p) => `- ${p}`).join("\n")}\n` : "";

  interviewForm.notes =
    (interviewForm.notes?.trim() ? interviewForm.notes.trim() + "\n\n" : "") + header + focus;

  Notify.create({ type: "info", message: "Sugerencia IA aplicada al formulario." });
}

/** =========================
 *  Actions: schedule / update / cancel
 * ========================= */
async function scheduleInterview() {
  const id = getAppId(target.value);
  if (!id) return;

  scheduleLoading.value = true;
  try {
    const payload = {
      scheduledAt: interviewForm.scheduledAt,
      mode: interviewForm.mode,
      location: interviewForm.location,
      evaluators: [...interviewForm.evaluators],
      notes: interviewForm.notes,
    };

    const resp = await methodsHttp.postApi(props.endpoints.schedule(id), payload);

    if (!resp?.ok) {
      Notify.create({ type: "negative", message: resp?.mensaje || "Error al agendar entrevista" });
      return;
    }

    // actualizar target local (para que habilite “Llenar evaluación”)
    if (!target.value.interview) target.value.interview = {};
    Object.assign(target.value.interview, payload);

    Notify.create({ type: "positive", message: "Entrevista agendada y correo enviado." });
    scheduleOpen.value = false;
    emit("changed", { id, action: "scheduled", application: resp?.application || null });
  } catch (e) {
    console.error(e);
    Notify.create({ type: "negative", message: "Error al agendar la entrevista." });
  } finally {
    scheduleLoading.value = false;
  }
}

async function updateInterview() {
  const id = getAppId(target.value);
  if (!id) return;

  scheduleLoading.value = true;
  try {
    const payload = {
      scheduledAt: interviewForm.scheduledAt,
      mode: interviewForm.mode,
      location: interviewForm.location,
      evaluators: [...interviewForm.evaluators],
      notes: interviewForm.notes,
    };

    const resp = await methodsHttp.putApi(props.endpoints.update(id), payload);

    if (!resp?.ok) {
      Notify.create({ type: "negative", message: resp?.mensaje || "Error al modificar entrevista" });
      return;
    }

    if (!target.value.interview) target.value.interview = {};
    Object.assign(target.value.interview, payload);

    Notify.create({ type: "positive", message: "Entrevista modificada y correo enviado." });
    scheduleOpen.value = false;
    emit("changed", { id, action: "updated", application: resp?.application || null });
  } catch (e) {
    console.error(e);
    Notify.create({ type: "negative", message: "Error al modificar la entrevista." });
  } finally {
    scheduleLoading.value = false;
  }
}

async function cancelInterview() {
  const id = getAppId(target.value);
  if (!id) return;

  scheduleLoading.value = true;
  try {
    const resp = await methodsHttp.putApi(props.endpoints.cancel(id), {});

    if (!resp?.ok) {
      Notify.create({ type: "negative", message: resp?.mensaje || "Error al cancelar entrevista" });
      return;
    }

    target.value.interview = null;
    resetInterviewForm();

    Notify.create({ type: "info", message: "Entrevista cancelada." });
    scheduleOpen.value = false;
    emit("changed", { id, action: "canceled", application: resp?.application || null });
  } catch (e) {
    console.error(e);
    Notify.create({ type: "negative", message: "Error al cancelar la entrevista." });
  } finally {
    scheduleLoading.value = false;
  }
}

/** =========================
 *  Evaluation form
 * ========================= */
const recommendationOptions = [
  { label: "✔️ Contratar", value: "CONTRATAR" },
  { label: "✔️ Considerar para segunda entrevista", value: "SEGUNDA_ENTREVISTA" },
  { label: "✔️ Mantener en base de datos", value: "POOL" },
  { label: "❌ No continuar con el proceso", value: "NO_CONTINUAR" },
];

function baseEvaluationForm() {
  return {
    position: "",
    candidateName: "",
    date: new Date().toISOString().slice(0, 10),
    interviewer: auth?.user || { name: "" },
    jobPosition: "",

    professionalCompetencies: [
      { key: "relevantExperience", label: "Experiencia relevante", description: "Años y calidad de experiencia acorde al puesto.", score: 0 },
      { key: "technicalKnowledge", label: "Conocimientos técnicos", description: "Dominio de herramientas, procesos o tecnologías necesarias.", score: 0 },
      { key: "problemSolving", label: "Resolución de problemas", description: "Capacidad para analizar y resolver situaciones reales.", score: 0 },
      { key: "timeOrganization", label: "Organización y manejo del tiempo", description: "Capacidad de priorizar tareas y entregar resultados.", score: 0 },
      { key: "adaptability", label: "Adaptación y aprendizaje", description: "Flexibilidad ante cambios; apertura a capacitarse.", score: 0 },
    ],

    softSkills: [
      { key: "communication", label: "Comunicación", description: "Claridad, capacidad de escuchar, expresar ideas.", score: 0 },
      { key: "attitude", label: "Actitud y motivación", description: "Interés en el rol y en la empresa; disposición.", score: 0 },
      { key: "teamwork", label: "Trabajo en equipo", description: "Capacidad de colaborar y relacionarse con otros.", score: 0 },
      { key: "customerService", label: "Servicio al cliente", description: "Manejo de clientes, empatía y habilidades interpersonales.", score: 0 },
      { key: "professionalism", label: "Profesionalismo", description: "Puntualidad, presencia, ética.", score: 0 },
    ],

    generalCriteria: [
      { key: "presentation", label: "Presentación personal", description: "Apariencia profesional, lenguaje corporal.", score: 0 },
      { key: "careerClarity", label: "Claridad en explicar su trayectoria", description: "Orden, coherencia y claridad al explicar su experiencia laboral.", score: 0 },
      { key: "salaryExpectation", label: "Expectativa salarial", description: "Alineación con lo que ofrece la empresa.", score: 0 },
      { key: "availability", label: "Disponibilidad", description: "Inmediata, parcial, con preaviso.", score: 0 },
    ],

    keyQuestions: [
      { key: "q1", label: "Cuéntame sobre tu experiencia más reciente y cómo se relaciona con este puesto.", answer: "" },
      { key: "q2", label: "Descríbeme un reto laboral que enfrentaste y cómo lo solucionaste.", answer: "" },
      { key: "q3", label: "¿Por qué deseas unirte a nuestra empresa?", answer: "" },
      { key: "q4", label: "¿Cómo manejas el trabajo bajo presión?", answer: "" },
      { key: "q5", label: "¿Cuáles son tus objetivos a corto y largo plazo?", answer: "" },
      { key: "q6", label: "¿Cómo te visualizas en 5 años?", answer: "" },
    ],

    comments: "",
    recommendation: "SEGUNDA_ENTREVISTA",
  };
}

const evaluationForm = reactive(baseEvaluationForm());

async function saveEvaluation() {
  const id = getAppId(target.value);
  if (!id) return;

  evaluationLoading.value = true;
  try {
    // Guardar en memoria local
    if (!target.value.interview) target.value.interview = {};
    target.value.interview.evaluation = deepClone(evaluationForm);
    target.value.interview.evaluationUpdatedAt = new Date().toISOString();

    // (opcional) si quieres ajustar decision según recomendación
    // if (evaluationForm.recommendation === "CONTRATAR") { ... }

    const resp = await methodsHttp.putApi(props.endpoints.saveEvaluation(id), deepClone(evaluationForm));

    if (!resp?.ok) {
      Notify.create({ type: "negative", message: resp?.mensaje || "Error al guardar evaluación" });
      return;
    }

    Notify.create({ type: "positive", message: "Evaluación guardada." });

    // Auto IA al guardar (sin pisar sliders, solo guardar aiEvaluation)
    if (autoAiOnSave.value) {
      await runAiInterviewAnalysis({ applyToForm: false });
    }

    evaluationOpen.value = false;
    emit("changed", { id, action: "evaluation_saved", application: resp?.application || null });
  } catch (e) {
    console.error(e);
    Notify.create({ type: "negative", message: "Error al guardar la evaluación." });
  } finally {
    evaluationLoading.value = false;
  }
}

/** =========================
 *  IA: analizar entrevista (opcional)
 *  Requiere endpoint backend: recruitment/runInterviewAiForApplication/:id
 * ========================= */
async function runAiInterviewAnalysis({ applyToForm = true } = {}) {
  const id = getAppId(target.value);
  if (!id) return;

  aiInterviewLoading.value = true;
  try {
    const payload = {
      agentCode: "INTERVIEW_ANALYST_DEFAULT",   // usa tu code real
      evaluationDraft: deepClone(evaluationForm), // ✅ AQUI van las respuestas
      applyDraft: true,                           // ✅ aplicar/guardar respuestas antes de analizar
    };

    const resp = await methodsHttp.postApi(props.endpoints.runInterviewAi(id), payload);

    if (!resp?.ok) {
      Notify.create({ type: "negative", message: resp?.mensaje || "No se pudo analizar la entrevista con IA." });
      return;
    }

    // ✅ tu backend devuelve aiEvaluation directamente
    const aiEval =
      resp?.aiEvaluation ||
      resp?.application?.interview?.aiEvaluation ||
      null;

    if (!aiEval) {
      Notify.create({ type: "warning", message: "La IA respondió, pero no llegó aiEvaluation." });
      return;
    }

    if (!target.value.interview) target.value.interview = {};
    target.value.interview.aiEvaluation = aiEval;

    if (applyToForm) {
      const applySection = (targetArr, aiArr) => {
        const map = new Map((aiArr || []).map((x) => [x.key, x]));
        (targetArr || []).forEach((item) => {
          const found = map.get(item.key);
          if (found && typeof found.score === "number") item.score = found.score;
        });
      };

      applySection(evaluationForm.professionalCompetencies, aiEval.professionalCompetencies);
      applySection(evaluationForm.softSkills, aiEval.softSkills);
      applySection(evaluationForm.generalCriteria, aiEval.generalCriteria);

      if (aiEval.comments) evaluationForm.comments = aiEval.comments;
      if (aiEval.recommendation) evaluationForm.recommendation = aiEval.recommendation;

      // ⚠️ NO tocamos keyQuestions: se mantienen tus respuestas tal cual
    }

    Notify.create({ type: "positive", message: "Análisis IA generado (usando tus respuestas)." });
  } catch (e) {
    console.error(e);
    Notify.create({ type: "negative", message: "Error al ejecutar análisis IA de entrevista." });
  } finally {
    aiInterviewLoading.value = false;
  }
}

</script>
