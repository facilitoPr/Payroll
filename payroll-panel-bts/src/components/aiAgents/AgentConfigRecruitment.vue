<template>
  <div>
    <q-tabs v-model="tab" dense class="text-primary">
      <q-tab name="job" label="Perfil del puesto" />
      <q-tab name="rubric" label="Rúbrica" />
      <q-tab name="thresholds" label="Umbrales" />
      <q-tab name="filters" label="Hard filters" />
      <q-tab name="policy" label="Política" />
      <q-tab name="interview" label="Entrevistas" />
      <q-tab name="prompt" label="Prompt / salida" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="job" class="q-pa-none q-pt-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <label class="field-label">
              <b><span class="text-negative">*</span> Título del puesto</b>
            </label>
            <q-input
              outlined
              dense
              color="primary"
              v-model="local.jobProfile.positionTitle"
            />
          </div>

          <div class="col-12 col-md-6">
            <label class="field-label">
              <b><span class="text-negative">*</span> Modalidad</b>
            </label>
            <q-select
              outlined
              dense
              color="primary"
              v-model="local.jobProfile.locationType"
              :options="['Presencial', 'Remoto', 'Híbrido']"
            />
          </div>

          <div class="col-12">
            <label class="field-label">
              <b><span class="text-negative">*</span> Descripción</b>
            </label>
            <q-input
              outlined
              dense
              type="textarea"
              autogrow
              color="primary"
              v-model="local.jobProfile.description"
            />
          </div>

          <div class="col-12 col-md-6">
            <label class="field-label">
              <b><span class="text-negative">*</span> Must-have skills</b>
            </label>
            <q-select
              outlined
              dense
              color="primary"
              v-model="local.jobProfile.mustHaveSkills"
              use-input
              use-chips
              multiple
              new-value-mode="add-unique"
              placeholder="Escribe y Enter"
            />
          </div>

          <div class="col-12 col-md-6">
            <label class="field-label"><b>Nice-to-have skills</b></label>
            <q-select
              outlined
              dense
              color="primary"
              v-model="local.jobProfile.niceToHaveSkills"
              use-input
              use-chips
              multiple
              new-value-mode="add-unique"
              placeholder="Escribe y Enter"
            />
          </div>

          <div class="col-12 col-md-4">
            <label class="field-label">
              <b><span class="text-negative">*</span> Mín. años experiencia</b>
            </label>
            <q-input
              outlined
              dense
              type="number"
              color="primary"
              min="0"
              v-model.number="local.jobProfile.minExperienceYears"
            />
          </div>

          <div class="col-12 col-md-4">
            <label class="field-label">
              <b><span class="text-negative">*</span> Mín. nivel educativo</b>
            </label>
            <q-input
              outlined
              dense
              color="primary"
              v-model="local.jobProfile.minEducationLevel"
              placeholder="Ej: Bachiller"
            />
          </div>

          <div class="col-12 col-md-4">
            <label class="field-label"><b>Industrias preferidas</b></label>
            <q-select
              outlined
              dense
              color="primary"
              v-model="local.jobProfile.preferredIndustries"
              use-input
              use-chips
              multiple
              new-value-mode="add-unique"
              placeholder="Escribe y Enter"
            />
          </div>

          <div class="col-12">
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-weight-bold">Idiomas requeridos</div>
              <q-btn
                dense
                outline
                color="primary"
                icon="add"
                label="Agregar"
                @click="addLanguageRequired"
              />
            </div>

            <div
              v-if="!local.jobProfile.languagesRequired?.length"
              class="text-grey-7"
            >
              No hay idiomas todavía.
            </div>

            <div
              v-for="(lng, idx) in local.jobProfile.languagesRequired"
              :key="idx"
              class="row q-col-gutter-md q-mb-sm"
            >
              <div class="col-12 col-md-6">
                <q-input
                  outlined
                  dense
                  color="primary"
                  v-model="lng.language"
                  label="Idioma"
                />
              </div>

              <div class="col-10 col-md-5">
                <q-select
                  outlined
                  dense
                  color="primary"
                  v-model="lng.level"
                  :options="['Básico','Intermedio','Avanzado','Nativo']"
                  label="Nivel"
                />
              </div>

              <div class="col-2 col-md-1 flex items-center justify-end">
                <q-btn
                  dense
                  round
                  flat
                  icon="delete"
                  color="negative"
                  @click="removeLanguageRequired(idx)"
                />
              </div>
            </div>
          </div>

          <div class="col-12">
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-weight-bold">Rango salarial (opcional)</div>
              <q-toggle v-model="salaryEnabled" color="primary" />
            </div>

            <div v-if="salaryEnabled" class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  dense
                  type="number"
                  color="primary"
                  label="Min"
                  v-model.number="salaryRange.min"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  dense
                  type="number"
                  color="primary"
                  label="Max"
                  v-model.number="salaryRange.max"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  dense
                  color="primary"
                  label="Moneda"
                  v-model="salaryRange.currency"
                  placeholder="DOP / USD"
                />
              </div>
            </div>
          </div>

          <div class="col-12">
            <label class="field-label"><b>Restricciones adicionales</b></label>
            <q-select
              outlined
              dense
              color="primary"
              v-model="local.jobProfile.additionalConstraints"
              use-input
              use-chips
              multiple
              new-value-mode="add-unique"
              placeholder="Ej: Turno nocturno, fines de semana..."
            />
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="rubric" class="q-pa-none q-pt-md">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-weight-bold">Rúbrica de evaluación</div>
          <q-btn
            dense
            outline
            color="primary"
            icon="add"
            label="Agregar criterio"
            @click="addRubricItem"
          />
        </div>

        <div class="text-caption text-grey-7 q-mb-sm">
          Tip: que los pesos sumen ~1.0.
        </div>

        <div v-if="!local.evaluationRubric?.length" class="text-grey-7 q-mt-sm">
          No hay criterios todavía.
        </div>

        <q-card
          v-for="(r, idx) in local.evaluationRubric"
          :key="idx"
          flat
          bordered
          class="q-mb-md q-pa-sm"
        >
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <q-input
                outlined
                dense
                color="primary"
                v-model="r.key"
                label="Key"
                placeholder="technicalFit"
              />
            </div>

            <div class="col-12 col-md-4">
              <q-input
                outlined
                dense
                color="primary"
                v-model="r.label"
                label="Label"
                placeholder="Ajuste técnico"
              />
            </div>

            <div class="col-10 col-md-2">
              <q-input
                outlined
                dense
                type="number"
                color="primary"
                v-model.number="r.weight"
                label="Weight"
                min="0"
                max="1"
                step="0.05"
              />
            </div>

            <div class="col-2 col-md-1 flex items-center justify-end">
              <q-btn
                dense
                round
                flat
                icon="delete"
                color="negative"
                @click="removeRubricItem(idx)"
              />
            </div>

            <div class="col-12">
              <q-input
                outlined
                dense
                color="primary"
                v-model="r.description"
                label="Descripción del criterio"
                type="textarea"
                autogrow
              />
            </div>
          </div>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="thresholds" class="q-pa-none q-pt-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <label class="field-label">
              <b><span class="text-negative">*</span> Auto-reject score</b>
            </label>
            <q-input
              outlined
              dense
              type="number"
              color="primary"
              v-model.number="local.thresholds.autoRejectScore"
              min="0"
              max="100"
            />
          </div>

          <div class="col-12 col-md-4">
            <label class="field-label">
              <b><span class="text-negative">*</span> Auto-interview score</b>
            </label>
            <q-input
              outlined
              dense
              type="number"
              color="primary"
              v-model.number="local.thresholds.autoInterviewScore"
              min="0"
              max="100"
            />
          </div>

          <div class="col-12 col-md-4">
            <label class="field-label"><b>Auto-pool min</b></label>
            <q-input
              outlined
              dense
              type="number"
              color="primary"
              v-model.number="local.thresholds.autoPoolMinScore"
              min="0"
              max="100"
            />
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="filters" class="q-pa-none q-pt-md">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-weight-bold">Hard filters</div>
          <q-btn
            dense
            outline
            color="primary"
            icon="add"
            label="Agregar filtro"
            @click="addHardFilter"
          />
        </div>

        <div v-if="!local.hardFilters?.length" class="text-grey-7">
          No hay hard filters configurados.
        </div>

        <q-card
          v-for="(f, idx) in local.hardFilters"
          :key="idx"
          flat
          bordered
          class="q-mb-md q-pa-sm"
        >
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <q-input
                v-model="f.key"
                outlined
                dense
                color="primary"
                label="Key"
              />
            </div>

            <div class="col-12 col-md-3">
              <q-select
                v-model="f.type"
                :options="[
                  'minimumAge',
                  'requiredLanguage',
                  'requiredField',
                  'minimumExperience'
                ]"
                outlined
                dense
                color="primary"
                label="Tipo"
              />
            </div>

            <div class="col-12 col-md-3">
              <q-select
                v-model="f.onFail"
                :options="['REJECT', 'REVIEW', 'WARN']"
                outlined
                dense
                color="primary"
                label="Si falla"
              />
            </div>

            <div class="col-2 col-md-1 flex items-center justify-end">
              <q-btn
                dense
                round
                flat
                icon="delete"
                color="negative"
                @click="removeHardFilter(idx)"
              />
            </div>

            <div class="col-12 col-md-3">
              <q-input
                v-model.number="f.value"
                outlined
                dense
                type="number"
                color="primary"
                label="Valor"
              />
            </div>

            <div class="col-12 col-md-4">
              <q-input
                v-model="f.language"
                outlined
                dense
                color="primary"
                label="Idioma (si aplica)"
              />
            </div>

            <div class="col-12 col-md-4">
              <q-input
                v-model="f.minLevel"
                outlined
                dense
                color="primary"
                label="Nivel mínimo (si aplica)"
              />
            </div>

            <div class="col-12 col-md-4">
              <q-input
                v-model="f.field"
                outlined
                dense
                color="primary"
                label="Campo requerido (si aplica)"
              />
            </div>
          </div>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="policy" class="q-pa-none q-pt-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-toggle
              v-model="local.decisionPolicy.requireAllMustHaves"
              color="primary"
              label="Exigir todos los must-have"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-toggle
              v-model="local.decisionPolicy.allowInterviewIfMissingInfo"
              color="primary"
              label="Permitir entrevista si falta info"
            />
          </div>

          <div class="col-12 col-md-4">
            <label class="field-label"><b>Máx. risk flags críticos</b></label>
            <q-input
              v-model.number="local.decisionPolicy.maxCriticalRiskFlags"
              outlined
              dense
              type="number"
              color="primary"
              min="0"
            />
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="interview" class="q-pa-none q-pt-md">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-toggle
              v-model="local.interviewConfig.autoSchedule"
              color="primary"
              label="Auto agendar entrevistas"
            />
          </div>

          <div class="col-12 col-md-4">
            <label class="field-label">
              <b><span class="text-negative">*</span> Modo por defecto</b>
            </label>
            <q-select
              outlined
              dense
              color="primary"
              v-model="local.interviewConfig.defaultMode"
              :options="['Presencial', 'Virtual', 'Telefónica']"
            />
          </div>

          <div class="col-12 col-md-8">
            <label class="field-label">
              <b><span class="text-negative">*</span> Ubicación por defecto</b>
            </label>
            <q-input
              outlined
              dense
              color="primary"
              v-model="local.interviewConfig.defaultLocation"
              placeholder="Ej: Oficina principal / Google Meet"
            />
          </div>

          <div class="col-12">
            <label class="field-label"><b>Evaluadores por defecto (IDs)</b></label>
            <q-select
              outlined
              dense
              color="primary"
              v-model="local.interviewConfig.defaultEvaluators"
              use-input
              use-chips
              multiple
              new-value-mode="add-unique"
              placeholder="Pega ObjectId y Enter"
            />
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="prompt" class="q-pa-none q-pt-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <label class="field-label"><b>Estilo del sistema</b></label>
            <q-select
              v-model="local.promptConfig.systemStyle"
              :options="['professional', 'strict', 'balanced']"
              outlined
              dense
              color="primary"
            />
          </div>

          <div class="col-12 col-md-4">
            <label class="field-label"><b>Máx. strengths</b></label>
            <q-input
              v-model.number="local.promptConfig.maxStrengths"
              outlined
              dense
              type="number"
              color="primary"
              min="1"
            />
          </div>

          <div class="col-12 col-md-4">
            <label class="field-label"><b>Máx. weaknesses</b></label>
            <q-input
              v-model.number="local.promptConfig.maxWeaknesses"
              outlined
              dense
              type="number"
              color="primary"
              min="1"
            />
          </div>

          <div class="col-12 col-md-4">
            <label class="field-label"><b>Máx. risk flags</b></label>
            <q-input
              v-model.number="local.promptConfig.maxRiskFlags"
              outlined
              dense
              type="number"
              color="primary"
              min="1"
            />
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

function ensureRecruitmentDefaults(cfg) {
  const out = cfg || {};
  out.kind = out.kind || "recruitment";

  out.jobProfile = out.jobProfile || {};
  out.jobProfile.positionTitle = out.jobProfile.positionTitle || "";
  out.jobProfile.description = out.jobProfile.description || "";
  out.jobProfile.locationType = out.jobProfile.locationType || "Presencial";
  out.jobProfile.mustHaveSkills = out.jobProfile.mustHaveSkills || [];
  out.jobProfile.niceToHaveSkills = out.jobProfile.niceToHaveSkills || [];
  out.jobProfile.minExperienceYears =
    typeof out.jobProfile.minExperienceYears === "number"
      ? out.jobProfile.minExperienceYears
      : 0;
  out.jobProfile.minEducationLevel = out.jobProfile.minEducationLevel || "";
  out.jobProfile.preferredIndustries = out.jobProfile.preferredIndustries || [];
  out.jobProfile.languagesRequired = out.jobProfile.languagesRequired || [];
  out.jobProfile.additionalConstraints = out.jobProfile.additionalConstraints || [];

  out.evaluationRubric = out.evaluationRubric || [
    { key: "technicalFit", label: "Ajuste técnico", weight: 0.4, description: "" },
    { key: "experience", label: "Experiencia", weight: 0.3, description: "" },
    { key: "softSkills", label: "Habilidades blandas", weight: 0.3, description: "" },
  ];

  out.thresholds = out.thresholds || {};
  out.thresholds.autoRejectScore =
    typeof out.thresholds.autoRejectScore === "number"
      ? out.thresholds.autoRejectScore
      : 40;
  out.thresholds.autoInterviewScore =
    typeof out.thresholds.autoInterviewScore === "number"
      ? out.thresholds.autoInterviewScore
      : 60;
  out.thresholds.autoPoolMinScore =
    typeof out.thresholds.autoPoolMinScore === "number"
      ? out.thresholds.autoPoolMinScore
      : 40;

  out.hardFilters = out.hardFilters || [];

  out.decisionPolicy = out.decisionPolicy || {};
  out.decisionPolicy.requireAllMustHaves =
    typeof out.decisionPolicy.requireAllMustHaves === "boolean"
      ? out.decisionPolicy.requireAllMustHaves
      : false;
  out.decisionPolicy.allowInterviewIfMissingInfo =
    typeof out.decisionPolicy.allowInterviewIfMissingInfo === "boolean"
      ? out.decisionPolicy.allowInterviewIfMissingInfo
      : true;
  out.decisionPolicy.maxCriticalRiskFlags =
    typeof out.decisionPolicy.maxCriticalRiskFlags === "number"
      ? out.decisionPolicy.maxCriticalRiskFlags
      : 1;
  out.decisionPolicy.minimumCriterionScores =
    out.decisionPolicy.minimumCriterionScores || {};

  out.interviewConfig = out.interviewConfig || {};
  out.interviewConfig.autoSchedule =
    typeof out.interviewConfig.autoSchedule === "boolean"
      ? out.interviewConfig.autoSchedule
      : false;
  out.interviewConfig.defaultMode = out.interviewConfig.defaultMode || "Virtual";
  out.interviewConfig.defaultLocation =
    out.interviewConfig.defaultLocation || "Google Meet";
  out.interviewConfig.defaultEvaluators =
    out.interviewConfig.defaultEvaluators || [];

  out.promptConfig = out.promptConfig || {};
  out.promptConfig.systemStyle = out.promptConfig.systemStyle || "professional";
  out.promptConfig.maxStrengths =
    typeof out.promptConfig.maxStrengths === "number"
      ? out.promptConfig.maxStrengths
      : 5;
  out.promptConfig.maxWeaknesses =
    typeof out.promptConfig.maxWeaknesses === "number"
      ? out.promptConfig.maxWeaknesses
      : 5;
  out.promptConfig.maxRiskFlags =
    typeof out.promptConfig.maxRiskFlags === "number"
      ? out.promptConfig.maxRiskFlags
      : 5;

  return out;
}

const props = defineProps({
  modelValue: { type: Object, required: true },
});
const emit = defineEmits(["update:modelValue"]);

const tab = ref("job");
const local = ref(ensureRecruitmentDefaults(deepClone(props.modelValue)));

const salaryEnabled = ref(!!local.value?.jobProfile?.salaryRange);
const salaryRange = ref(
  local.value?.jobProfile?.salaryRange
    ? {
        min: Number(local.value.jobProfile.salaryRange.min ?? 0),
        max: Number(local.value.jobProfile.salaryRange.max ?? 0),
        currency: String(local.value.jobProfile.salaryRange.currency ?? "DOP"),
      }
    : { min: 0, max: 0, currency: "DOP" }
);

watch(
  () => props.modelValue,
  (v) => {
    local.value = ensureRecruitmentDefaults(deepClone(v));
    salaryEnabled.value = !!local.value?.jobProfile?.salaryRange;
    salaryRange.value = local.value?.jobProfile?.salaryRange
      ? {
          min: Number(local.value.jobProfile.salaryRange.min ?? 0),
          max: Number(local.value.jobProfile.salaryRange.max ?? 0),
          currency: String(local.value.jobProfile.salaryRange.currency ?? "DOP"),
        }
      : { min: 0, max: 0, currency: "DOP" };
  },
  { deep: true }
);

watch(
  local,
  (v) => {
    const next = ensureRecruitmentDefaults(deepClone(v));

    if (salaryEnabled.value) {
      next.jobProfile.salaryRange = {
        min: Number(salaryRange.value.min || 0),
        max: Number(salaryRange.value.max || 0),
        currency: String(salaryRange.value.currency || "DOP"),
      };
    } else {
      delete next.jobProfile.salaryRange;
    }

    emit("update:modelValue", next);
  },
  { deep: true }
);

watch(
  salaryEnabled,
  (val) => {
    if (!val) salaryRange.value = { min: 0, max: 0, currency: "DOP" };
    const next = ensureRecruitmentDefaults(deepClone(local.value));
    if (val) {
      next.jobProfile.salaryRange = {
        min: Number(salaryRange.value.min || 0),
        max: Number(salaryRange.value.max || 0),
        currency: String(salaryRange.value.currency || "DOP"),
      };
    } else {
      delete next.jobProfile.salaryRange;
    }
    local.value = next;
  }
);

watch(
  salaryRange,
  () => {
    if (!salaryEnabled.value) return;
    const next = ensureRecruitmentDefaults(deepClone(local.value));
    next.jobProfile.salaryRange = {
      min: Number(salaryRange.value.min || 0),
      max: Number(salaryRange.value.max || 0),
      currency: String(salaryRange.value.currency || "DOP"),
    };
    local.value = next;
  },
  { deep: true }
);

function addLanguageRequired() {
  local.value.jobProfile.languagesRequired.push({
    language: "",
    level: "Intermedio",
  });
}
function removeLanguageRequired(idx) {
  local.value.jobProfile.languagesRequired.splice(idx, 1);
}

function addRubricItem() {
  local.value.evaluationRubric.push({
    key: "",
    label: "",
    weight: 0.1,
    description: "",
  });
}
function removeRubricItem(idx) {
  local.value.evaluationRubric.splice(idx, 1);
}

function addHardFilter() {
  local.value.hardFilters.push({
    key: "",
    type: "requiredField",
    value: 0,
    language: "",
    minLevel: "",
    field: "",
    onFail: "REVIEW",
  });
}
function removeHardFilter(idx) {
  local.value.hardFilters.splice(idx, 1);
}
</script>

<style scoped>
.q-tab-panel {
  padding-bottom: 4px;
}
.field-label {
  display: inline-block;
  margin-bottom: 6px;
}
</style>