<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    :maximized="$q.screen.lt.md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="agent-dialog column no-wrap">
      <q-inner-loading
        :showing="saving"
        label="Guardando agente..."
        label-class="text-primary"
        label-style="font-size: 1rem"
      />

      <!-- HEADER -->
      <q-card-section
        class="dialog-header bg-primary row items-center justify-between"
      >
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon size="30px" name="smart_toy" color="white" />
          </div>

          <div>
            <div class="dialog-title">
              {{ isEditMode ? "Editar agente IA" : "Crear agente IA" }}
            </div>

            <div class="dialog-subtitle">
              Configura el proveedor, modelo, comportamiento y parámetros del agente.
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          color="white"
          :disable="saving"
          @click="emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-separator />

      <!-- BODY -->
      <q-card-section class="agent-dialog-body">
        <div class="row q-col-gutter-lg">
          <!-- FORM -->
          <div class="col-12 col-lg-7">
            <q-card flat bordered class="form-section">
              <div class="form-section-header">
                <div>
                  <div class="form-section-title">Datos principales</div>
                  <div class="form-section-subtitle">
                    Información básica para identificar y ejecutar el agente.
                  </div>
                </div>

                <q-badge
                  rounded
                  :color="form.isActive ? 'positive' : 'grey-7'"
                  class="status-badge"
                >
                  {{ form.isActive ? "Activo" : "Inactivo" }}
                </q-badge>
              </div>

              <q-separator />

              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <div class="field-label required">Nombre</div>
                    <q-input
                      v-model="form.name"
                      outlined
                      rounded
                      dense
                      color="primary"
                      placeholder="Ej: Agente IA Reclutamiento General"
                      :disable="saving"
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="field-label required">Código</div>
                    <q-input
                      v-model="form.code"
                      outlined
                      rounded
                      dense
                      color="primary"
                      placeholder="Ej: recruitment_default_v1"
                      hint="Único. Sin espacios. Usa snake_case."
                      :disable="saving || isEditMode"
                    />
                  </div>

                  <div class="col-12 col-md-4">
                    <div class="field-label required">Tipo</div>
                    <q-select
                      v-model="form.type"
                      :options="agentTypes"
                      outlined
                      rounded
                      dense
                      color="primary"
                      emit-value
                      map-options
                      option-label="label"
                      option-value="value"
                      :disable="saving"
                      @update:model-value="onTypeChange"
                    >
                      <template #prepend>
                        <q-icon name="category" color="primary" />
                      </template>
                    </q-select>
                  </div>

                  <div class="col-12 col-md-4">
                    <div class="field-label required">Proveedor</div>
                    <q-select
                      v-model="form.provider"
                      :options="providerOptions"
                      outlined
                      rounded
                      dense
                      color="primary"
                      emit-value
                      map-options
                      option-label="label"
                      option-value="value"
                      :disable="saving"
                    >
                      <template #prepend>
                        <q-icon name="hub" color="primary" />
                      </template>
                    </q-select>
                  </div>

                  <div class="col-12 col-md-4">
                    <div class="field-label required">
                      {{ form.provider === "dify" ? "Modelo / App" : "Modelo" }}
                    </div>

                    <q-input
                      v-model="form.model"
                      outlined
                      rounded
                      dense
                      color="primary"
                      :placeholder="
                        form.provider === 'dify'
                          ? 'Ej: dify-workflow-recruitment'
                          : 'Ej: gpt-4.1-mini'
                      "
                      :disable="saving"
                    >
                      <template #prepend>
                        <q-icon
                          :name="form.provider === 'dify' ? 'account_tree' : 'psychology'"
                          color="primary"
                        />
                      </template>
                    </q-input>
                  </div>

                  <div class="col-12">
                    <div class="field-label">Descripción</div>
                    <q-input
                      v-model="form.description"
                      outlined
                      rounded
                      dense
                      type="textarea"
                      autogrow
                      color="primary"
                      placeholder="Describe para qué se usará este agente."
                      :disable="saving"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card flat bordered class="form-section q-mt-md">
              <div class="form-section-header">
                <div>
                  <div class="form-section-title">Parámetros de ejecución</div>
                  <div class="form-section-subtitle">
                    Ajusta creatividad, límite de respuesta, versión y estado.
                  </div>
                </div>
              </div>

              <q-separator />

              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <div class="field-label">Temperature</div>
                    <q-input
                      v-model.number="form.temperature"
                      outlined
                      rounded
                      dense
                      type="number"
                      color="primary"
                      min="0"
                      max="1"
                      step="0.1"
                      :disable="saving"
                    />
                  </div>

                  <div class="col-12 col-md-4">
                    <div class="field-label">Max tokens</div>
                    <q-input
                      v-model.number="form.maxTokens"
                      outlined
                      rounded
                      dense
                      type="number"
                      color="primary"
                      min="64"
                      step="64"
                      :disable="saving"
                    />
                  </div>

                  <div class="col-12 col-md-4">
                    <div class="field-label">Versión</div>
                    <q-input
                      v-model.number="form.version"
                      outlined
                      rounded
                      dense
                      type="number"
                      color="primary"
                      min="1"
                      :disable="saving"
                    />
                  </div>

                  <div class="col-12">
                    <div class="status-toggle-card">
                      <div class="row items-center q-gutter-sm">
                        <q-icon
                          :name="form.isActive ? 'check_circle' : 'block'"
                          :color="form.isActive ? 'positive' : 'grey-7'"
                        />

                        <div>
                          <div class="text-subtitle2 text-weight-bold">
                            {{ form.isActive ? "Agente activo" : "Agente inactivo" }}
                          </div>
                          <div class="text-caption text-grey-7">
                            Controla si este agente puede ser usado por el sistema.
                          </div>
                        </div>
                      </div>

                      <q-toggle
                        v-model="form.isActive"
                        color="primary"
                        checked-icon="check"
                        unchecked-icon="close"
                        :disable="saving"
                      />
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card flat bordered class="form-section q-mt-md">
              <div class="form-section-header">
                <div>
                  <div class="form-section-title">Configuración del agente</div>
                  <div class="form-section-subtitle">
                    Usa el formulario guiado o edita la configuración en JSON.
                  </div>
                </div>

                <q-toggle
                  v-model="advancedJsonMode"
                  color="primary"
                  label="JSON"
                  left-label
                  :disable="saving"
                />
              </div>

              <q-separator />

              <q-card-section>
                <q-banner
                  v-if="advancedJsonMode"
                  rounded
                  class="json-warning q-mb-md"
                >
                  <template #avatar>
                    <q-icon name="data_object" color="primary" />
                  </template>

                  El JSON debe ser válido y compatible con el tipo de agente seleccionado.
                </q-banner>

                <q-input
                  v-if="advancedJsonMode"
                  v-model="configJson"
                  outlined
                  rounded
                  dense
                  type="textarea"
                  autogrow
                  color="primary"
                  placeholder='{"jobProfile":{"positionTitle":"..."} }'
                  :disable="saving"
                  :error="!jsonIsValid"
                  error-message="El JSON no es válido."
                />

                <component
                  v-else
                  :is="configComponent"
                  v-model="activeConfig"
                />
              </q-card-section>
            </q-card>
          </div>

          <!-- PREVIEW / HELP -->
          <div class="col-12 col-lg-5">
            <div class="preview-sticky">
              <q-card flat bordered class="preview-card">
                <q-card-section>
                  <div class="preview-header">
                    <q-avatar color="primary" text-color="white" size="52px">
                      <q-icon name="smart_toy" size="28px" />
                    </q-avatar>

                    <div>
                      <div class="preview-title">
                        {{ form.name || "Nuevo agente IA" }}
                      </div>

                      <div class="preview-subtitle">
                        {{ getTypeLabel(form.type) }}
                      </div>
                    </div>
                  </div>

                  <q-separator class="q-my-md" />

                  <div class="preview-grid">
                    <div class="preview-item">
                      <div class="preview-label">Proveedor</div>
                      <div class="preview-value">
                        {{ getProviderLabel(form.provider) }}
                      </div>
                    </div>

                    <div class="preview-item">
                      <div class="preview-label">Modelo</div>
                      <div class="preview-value">
                        {{ form.model || "No definido" }}
                      </div>
                    </div>

                    <div class="preview-item">
                      <div class="preview-label">Código</div>
                      <div class="preview-value">
                        {{ form.code || "No definido" }}
                      </div>
                    </div>

                    <div class="preview-item">
                      <div class="preview-label">Versión</div>
                      <div class="preview-value">
                        v{{ form.version || 1 }}
                      </div>
                    </div>

                    <div class="preview-item">
                      <div class="preview-label">Temperature</div>
                      <div class="preview-value">
                        {{ form.temperature }}
                      </div>
                    </div>

                    <div class="preview-item">
                      <div class="preview-label">Max tokens</div>
                      <div class="preview-value">
                        {{ form.maxTokens }}
                      </div>
                    </div>
                  </div>

                  <q-banner rounded class="provider-help q-mt-md">
                    <template #avatar>
                      <q-icon
                        :name="form.provider === 'dify' ? 'account_tree' : 'psychology'"
                        color="primary"
                      />
                    </template>

                    <div class="text-weight-bold">
                      {{ form.provider === "dify" ? "Proveedor Dify" : "Proveedor OpenAI" }}
                    </div>

                    <div class="text-caption">
                      {{
                        form.provider === "dify"
                          ? "Usa este proveedor cuando el backend llamará a un workflow o app configurada en Dify."
                          : "Usa este proveedor cuando el backend llamará directamente a modelos de OpenAI."
                      }}
                    </div>
                  </q-banner>
                </q-card-section>
              </q-card>

              <q-card flat bordered class="requirements-card q-mt-md">
                <q-card-section>
                  <div class="requirements-title">Requisitos para guardar</div>

                  <q-list dense class="q-mt-sm">
                    <q-item>
                      <q-item-section avatar>
                        <q-icon
                          :name="basicInfoOk ? 'check_circle' : 'radio_button_unchecked'"
                          :color="basicInfoOk ? 'positive' : 'grey-5'"
                        />
                      </q-item-section>
                      <q-item-section>
                        Nombre, código, tipo, proveedor y modelo completos.
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section avatar>
                        <q-icon
                          :name="configOk ? 'check_circle' : 'radio_button_unchecked'"
                          :color="configOk ? 'positive' : 'grey-5'"
                        />
                      </q-item-section>
                      <q-item-section>
                        Configuración del agente válida.
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- ACTIONS -->
      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          no-caps
          color="negative"
          label="Cancelar"
          icon="cancel"
          class="dialog-action-btn"
          :disable="saving"
          @click="emit('update:modelValue', false)"
        />

        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Guardar"
          icon="save"
          class="dialog-action-btn"
          :loading="saving"
          :disable="!canSave || saving"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useQuasar } from "quasar";

import AgentConfigRecruitment from "src/components/aiAgents/AgentConfigRecruitment.vue";
import AgentConfigInterviewAnalyst from "src/components/aiAgents/AgentConfigInterviewAnalyst.vue";
import AgentConfigExpedienteAnalyst from "src/components/aiAgents/AgentConfigExpedienteAnalyst.vue";
import AgentConfigChatbot from "src/components/aiAgents/AgentConfigChatbot.vue";

const $q = useQuasar();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  agent: { type: Object, default: null },
  saving: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "save"]);

const deepClone = (obj) => JSON.parse(JSON.stringify(obj || {}));

function isValidJson(str) {
  try {
    const parsed = JSON.parse(str || "{}");
    return parsed && typeof parsed === "object";
  } catch {
    return false;
  }
}

const agentTypes = [
  { label: "Reclutamiento", value: "recruitment" },
  { label: "Analista de entrevistas", value: "interviewAnalyst" },
  { label: "Analista de expediente", value: "expedienteAnalyst" },
  { label: "Chatbot", value: "chatbot" },
];

const providerOptions = [
  { label: "OpenAI", value: "openai" },
  { label: "Dify", value: "dify" },
];

const DEFAULT_INTERVIEW_ANALYST = {
  kind: "recruitment",
  language: "es",
  strictMode: true,
  evaluationTemplate: {
    professionalCompetencies: [
      {
        key: "technical_knowledge",
        label: "Conocimientos técnicos",
        description: "Evalúa dominio del stack, conceptos y fundamentos.",
      },
      {
        key: "problem_solving",
        label: "Resolución de problemas",
        description: "Capacidad para analizar, proponer y ejecutar soluciones.",
      },
    ],
    softSkills: [
      {
        key: "communication",
        label: "Comunicación",
        description: "Claridad, orden al explicar y escucha activa.",
      },
      {
        key: "teamwork",
        label: "Trabajo en equipo",
        description: "Colaboración, respeto, y manejo de feedback.",
      },
    ],
    generalCriteria: [
      {
        key: "culture_fit",
        label: "Ajuste cultural",
        description: "Valores, actitud, ética, alineación con la empresa.",
      },
      {
        key: "seniority_fit",
        label: "Nivel / Seniority",
        description: "Si el nivel se corresponde con el rol y expectativas.",
      },
    ],
    keyQuestions: [
      {
        key: "motivation",
        label: "Motivación",
        description: "¿Por qué quiere este puesto y qué busca lograr?",
      },
      {
        key: "availability",
        label: "Disponibilidad",
        description: "Horario, inicio, modalidad, restricciones.",
      },
    ],
    scoring: { min: 0, max: 5 },
    recommendationOptions: ["CONTRATAR", "SEGUNDA_ENTREVISTA", "POOL", "NO_CONTINUAR"],
    requireComments: true,
  },
  output: {
    format: "json",
    includeEvidence: false,
  },
  systemNotes: "",
};

const DEFAULT_EXPEDIENTE_ANALYST = {
  kind: "expedienteAnalyst",
  language: "es",
  templateCode: "expedient_default_v1",
  requiredSections: ["personalDocs", "legalContracts", "recruiting"],
  rules: {
    strictMode: true,
    allowMissingAttachments: false,
    requireEvidenceLinks: true,
    minConfidence: 0.4,
  },
  output: {
    format: "json",
    detailLevel: "standard",
    includeChecklist: true,
    includeObservations: true,
    includeSectionBySection: true,
  },
  summaryGoal: "",
  systemNotes: "",
};

const DEFAULT_RECRUITMENT = {
  kind: "recruitment",
  jobProfile: {
    positionTitle: "",
    description: "",
    mustHaveSkills: [],
    niceToHaveSkills: [],
    minExperienceYears: 0,
    preferredIndustries: [],
    minEducationLevel: "",
    languagesRequired: [],
    locationType: "Presencial",
    salaryRange: undefined,
    additionalConstraints: [],
  },
  evaluationRubric: [
    {
      key: "technicalFit",
      label: "Ajuste técnico",
      weight: 0.4,
      description: "Evalúa si el perfil encaja técnicamente con el puesto.",
    },
    {
      key: "experience",
      label: "Experiencia",
      weight: 0.3,
      description: "Evalúa experiencia previa, años y cercanía al rol.",
    },
    {
      key: "softSkills",
      label: "Habilidades blandas",
      weight: 0.3,
      description: "Evalúa comunicación, actitud y habilidades interpersonales.",
    },
  ],
  thresholds: {
    autoRejectScore: 40,
    autoInterviewScore: 60,
    autoPoolMinScore: 40,
  },
  hardFilters: [],
  decisionPolicy: {
    requireAllMustHaves: false,
    allowInterviewIfMissingInfo: true,
    maxCriticalRiskFlags: 1,
    minimumCriterionScores: {},
  },
  interviewConfig: {
    autoSchedule: false,
    defaultMode: "Virtual",
    defaultLocation: "Google Meet",
    defaultEvaluators: [],
  },
  promptConfig: {
    systemStyle: "professional",
    maxStrengths: 5,
    maxWeaknesses: 5,
    maxRiskFlags: 5,
  },
};

const DEFAULT_CHATBOT = {
  kind: "chatbot",
  ui: {
    title: "Asistente",
    subtitle: "",
    welcomeMessage: "Hola 👋 ¿En qué puedo ayudarte?",
    avatarUrl: "",
    theme: {
      primaryColor: "#222C5B",
      accentColor: "",
      backgroundColor: "",
      textColor: "",
    },
    position: "bottom-right",
    branding: { showPoweredBy: false, brandName: "" },
  },
  behavior: {
    language: "es",
    tone: "friendly",
    strictMode: true,
    fallbackMessage: "No estoy seguro. ¿Puedes darme más detalles?",
    handoff: {
      enabled: false,
      contactCtaLabel: "Hablar con un humano",
      contactFieldsRequired: ["name", "email", "message"],
    },
  },
  knowledge: { chunks: [], retrieval: { topK: 5, minScore: 0.2 } },
  routing: { allowedDomains: [] },
  memory: { sessionMemory: "summary", storePII: false, retentionDays: 30 },
  publicToken: "",
};

const form = ref({
  name: "",
  code: "",
  type: "recruitment",
  description: "",
  provider: "openai",
  model: "gpt-4.1-mini",
  temperature: 0.2,
  maxTokens: 1024,
  version: 1,
  isActive: true,
});

const advancedJsonMode = ref(false);
const configJson = ref("{}");

const recruitmentConfig = ref(deepClone(DEFAULT_RECRUITMENT));
const interviewAnalystConfig = ref(deepClone(DEFAULT_INTERVIEW_ANALYST));
const expedienteAnalystConfig = ref(deepClone(DEFAULT_EXPEDIENTE_ANALYST));
const chatbotConfig = ref(deepClone(DEFAULT_CHATBOT));

const isEditMode = computed(() => Boolean(props.agent?._id && !props.agent?.isHardcoded));

const jsonIsValid = computed(() => {
  if (!advancedJsonMode.value) return true;
  return isValidJson(configJson.value);
});

function getConfigRef(type) {
  if (type === "recruitment") return recruitmentConfig;
  if (type === "interviewAnalyst") return interviewAnalystConfig;
  if (type === "expedienteAnalyst") return expedienteAnalystConfig;
  return chatbotConfig;
}

const activeConfig = computed({
  get: () => getConfigRef(form.value.type).value,
  set: (value) => {
    getConfigRef(form.value.type).value = value;
  },
});

const configComponent = computed(() => {
  if (form.value.type === "recruitment") return AgentConfigRecruitment;
  if (form.value.type === "interviewAnalyst") return AgentConfigInterviewAnalyst;
  if (form.value.type === "expedienteAnalyst") return AgentConfigExpedienteAnalyst;
  return AgentConfigChatbot;
});

const basicInfoOk = computed(() => {
  return (
    String(form.value.name || "").trim().length >= 3 &&
    String(form.value.code || "").trim().length >= 3 &&
    !!form.value.type &&
    !!form.value.provider &&
    String(form.value.model || "").trim().length > 0 &&
    Number(form.value.version || 1) >= 1
  );
});

const configOk = computed(() => {
  if (advancedJsonMode.value) return isValidJson(configJson.value);

  if (form.value.type === "interviewAnalyst") {
    const cfg = interviewAnalystConfig.value || {};
    const tpl = cfg.evaluationTemplate || {};
    return (
      (tpl.professionalCompetencies || []).length > 0 &&
      (tpl.softSkills || []).length > 0 &&
      (tpl.generalCriteria || []).length > 0 &&
      (tpl.keyQuestions || []).length > 0 &&
      !!cfg.output?.format
    );
  }

  if (form.value.type === "expedienteAnalyst") {
    return String(expedienteAnalystConfig.value.templateCode || "").trim().length >= 3;
  }

  if (form.value.type === "recruitment") {
    const cfg = recruitmentConfig.value || {};
    return (
      String(cfg.jobProfile?.positionTitle || "").trim().length >= 2 &&
      String(cfg.jobProfile?.description || "").trim().length >= 10 &&
      Array.isArray(cfg.evaluationRubric) &&
      cfg.evaluationRubric.length > 0
    );
  }

  const hasTitle = String(chatbotConfig.value.ui?.title || "").trim().length >= 2;
  const hasAnyKnowledge = (chatbotConfig.value.knowledge?.chunks || []).some(
    (chunk) => String(chunk?.text || "").trim().length >= 20,
  );

  return hasTitle && hasAnyKnowledge;
});

const canSave = computed(() => basicInfoOk.value && configOk.value);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      fillForm();
    }
  },
);

watch(advancedJsonMode, (isOn) => {
  if (isOn) {
    configJson.value = JSON.stringify(activeConfig.value || {}, null, 2);
    return;
  }

  if (isValidJson(configJson.value)) {
    activeConfig.value = JSON.parse(configJson.value || "{}");
  }
});

function resetConfigByType(type) {
  advancedJsonMode.value = false;
  configJson.value = "{}";

  if (type === "recruitment") {
    recruitmentConfig.value = deepClone(DEFAULT_RECRUITMENT);
  } else if (type === "interviewAnalyst") {
    interviewAnalystConfig.value = deepClone(DEFAULT_INTERVIEW_ANALYST);
  } else if (type === "expedienteAnalyst") {
    expedienteAnalystConfig.value = deepClone(DEFAULT_EXPEDIENTE_ANALYST);
  } else {
    chatbotConfig.value = deepClone(DEFAULT_CHATBOT);
  }
}

function resetForm() {
  form.value = {
    name: "",
    code: "",
    type: "recruitment",
    description: "",
    provider: "openai",
    model: "gpt-4.1-mini",
    temperature: 0.2,
    maxTokens: 1024,
    version: 1,
    isActive: true,
  };

  resetConfigByType(form.value.type);
}

function fillForm() {
  resetForm();

  const row = props.agent;

  if (!row) return;

  form.value = {
    name: row.name || "",
    code: row.code || "",
    type: row.type || "recruitment",
    description: row.description || "",
    provider: row.provider || "openai",
    model: row.model || "gpt-4.1-mini",
    temperature: typeof row.temperature === "number" ? row.temperature : 0.2,
    maxTokens: typeof row.maxTokens === "number" ? row.maxTokens : 1024,
    version: typeof row.version === "number" ? row.version : 1,
    isActive: typeof row.isActive === "boolean" ? row.isActive : true,
  };

  resetConfigByType(form.value.type);

  if (row?.config && typeof row.config === "object") {
    activeConfig.value = deepClone(row.config);
  }

  configJson.value = JSON.stringify(activeConfig.value || {}, null, 2);
}

function onTypeChange(type) {
  resetConfigByType(type);
}

function buildConfigForSave() {
  if (advancedJsonMode.value) {
    return JSON.parse(configJson.value || "{}");
  }

  return deepClone(activeConfig.value);
}

function getTypeLabel(type) {
  return agentTypes.find((item) => item.value === type)?.label || type;
}

function getProviderLabel(provider) {
  return providerOptions.find((item) => item.value === provider)?.label || provider;
}

function submit() {
  if (!canSave.value) {
    $q.notify({
      type: "warning",
      message: "Completa los campos requeridos antes de guardar.",
    });
    return;
  }

  const payload = {
    name: form.value.name.trim(),
    code: form.value.code.trim(),
    type: form.value.type,
    description: form.value.description?.trim() || "",
    provider: form.value.provider,
    model: form.value.model,
    temperature: Number(form.value.temperature ?? 0.2),
    maxTokens: Number(form.value.maxTokens ?? 1024),
    version: Number(form.value.version ?? 1),
    config: buildConfigForSave(),
    isActive: Boolean(form.value.isActive),
  };

  emit("save", payload);
}
</script>

<style scoped>
.agent-dialog {
  width: 1280px;
  max-width: 98vw;
  max-height: 92vh;
  border-radius: 22px;
  overflow: hidden;
}

.dialog-header {
  min-height: 78px;
  padding: 16px 20px;
}

.dialog-icon {
  width: 46px;
  height: 46px;
  min-width: 46px;
  margin-right: 12px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.dialog-title {
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.05;
}

.dialog-subtitle {
  margin-top: 4px;
  max-width: 760px;
  font-size: 0.78rem;
  opacity: 0.86;
}

.agent-dialog-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(92vh - 154px);
  padding: 18px;
  background: #f8fafc;
}

.form-section,
.preview-card,
.requirements-card {
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.form-section-header {
  min-height: 70px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.form-section-title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.form-section-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.field-label {
  margin-bottom: 6px;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-label.required::before {
  content: "* ";
  color: #e53935;
}

.status-badge {
  padding: 7px 12px;
  font-weight: 800;
}

.status-toggle-card {
  min-height: 54px;
  padding: 10px 12px;
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.json-warning,
.provider-help {
  color: #1e3a8a;
  background: #dbeafe;
  border: 1px solid rgba(37, 99, 235, 0.14);
}

.preview-sticky {
  position: sticky;
  top: 0;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-title {
  color: #0f172a;
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.1;
}

.preview-subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 700;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.preview-item {
  padding: 12px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.preview-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.preview-value {
  margin-top: 5px;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 900;
  word-break: break-word;
}

.requirements-title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
  box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.04);
}

.dialog-action-btn {
  border-radius: 999px;
  padding-left: 18px;
  padding-right: 18px;
  font-weight: 800;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

:deep(.q-field--outlined.q-field--rounded .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 1023px) {
  .agent-dialog {
    width: 100%;
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .agent-dialog-body {
    max-height: calc(100vh - 154px);
    padding: 12px;
  }

  .preview-sticky {
    position: static;
  }
}

@media (max-width: 600px) {
  .preview-grid {
    grid-template-columns: 1fr;
  }
}
</style>