<template>
  <div>
    <div class="row items-center justify-between q-mb-sm">
      <div>
        <div class="text-caption text-grey-7">
          Config global. El agente analiza <b>solo lo que le mandas en el interview</b> (preguntas, respuestas, notas, transcript, puesto, etc.).
          Aquí NO se define la rúbrica.
        </div>
      </div>

      <q-btn
        dense
        outline
        color="primary"
        icon="restart_alt"
        label="Restaurar defaults"
        @click="setDefaultConfig"
      />
    </div>

    <q-card bordered class="bg-white">
      <q-card-section class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-select
              outlined
              dense
              color="primary"
              label="Idioma"
              v-model="local.language"
              :options="['es', 'en']"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              outlined
              dense
              color="primary"
              label="Formato de salida"
              v-model="local.output.format"
              :options="['json', 'markdown']"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-toggle
              v-model="local.strictMode"
              color="primary"
              label="Strict mode (no inventar)"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-select
              outlined
              dense
              color="primary"
              label="Escala de puntuación"
              v-model="local.scoreScale"
              :options="['0-5', '0-10', '0-100']"
              hint="Debe coincidir con cómo guardas interview.evaluation."
            />
          </div>

          <div class="col-12 col-md-6">
            <q-toggle
              v-model="local.includeEvidence"
              color="primary"
              label="Incluir evidencia por item"
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              Si está activo, el agente intentará explicar brevemente por qué puso cada score (sin inventar).
            </div>
          </div>

          <div class="col-12">
            <div class="text-weight-bold q-mb-xs">Opciones de recomendación</div>
            <q-select
              outlined
              dense
              color="primary"
              v-model="local.recommendationOptions"
              :options="['CONTRATAR', 'SEGUNDA_ENTREVISTA', 'POOL', 'NO_CONTINUAR']"
              multiple
              use-chips
            />
          </div>

          <div class="col-12">
            <q-input
              outlined
              dense
              type="textarea"
              autogrow
              color="primary"
              v-model="local.systemNotes"
              label="Instrucciones extra (opcional)"
              placeholder="Ej: Sé duro con inconsistencias. Prioriza evidencia concreta. Si faltan datos, baja scores."
            />
          </div>

          <div class="col-12">
            <q-banner class="bg-grey-2 text-grey-9" rounded>
              <div class="text-weight-bold">Qué evalúa el bot</div>
              <div class="text-caption text-grey-8 q-mt-xs">
                Todo lo que se evalúa (preguntas y respuestas, notas, transcript, puesto, etc.) debe venir en el <b>payload del interview</b>.
                El agente solo aplica este “estilo” global.
              </div>
            </q-banner>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

/**
 * ✅ Config SIMPLE (sin rúbricas)
 * - No define criterios
 * - Solo controla comportamiento global
 */
const DEFAULT_INTERVIEW_AGENT_CONFIG = {
  kind: "interviewAnalyst",
  language: "es",
  strictMode: true,
  output: { format: "json" },

  // escala recomendada si guardas score 0..5 (como habías planteado)
  scoreScale: "0-5",

  // si quieres que por cada item ponga una frase corta de evidencia
  includeEvidence: true,

  recommendationOptions: ["CONTRATAR", "SEGUNDA_ENTREVISTA", "POOL", "NO_CONTINUAR"],
  systemNotes: "",
};

function ensureDefaults(v) {
  const base = deepClone(DEFAULT_INTERVIEW_AGENT_CONFIG);
  const o = v && typeof v === "object" ? deepClone(v) : {};

  const next = {
    ...base,
    ...o,
    output: { ...base.output, ...(o.output || {}) },
  };

  // defensivo
  next.kind = "interviewAnalyst";
  next.output = next.output || { format: "json" };
  next.scoreScale = next.scoreScale || "0-5";
  next.recommendationOptions =
    next.recommendationOptions || base.recommendationOptions;

  return next;
}

const props = defineProps({
  modelValue: { type: Object, required: true },
});
const emit = defineEmits(["update:modelValue"]);

// local state (no muta props)
const local = ref(ensureDefaults(deepClone(props.modelValue)));

watch(
  () => props.modelValue,
  (v) => {
    local.value = ensureDefaults(deepClone(v));
  },
  { deep: true }
);

watch(
  local,
  (v) => {
    emit("update:modelValue", ensureDefaults(deepClone(v)));
  },
  { deep: true }
);

function setDefaultConfig() {
  local.value = deepClone(DEFAULT_INTERVIEW_AGENT_CONFIG);
}
</script>
