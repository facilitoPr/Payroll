<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-md-6">
      <q-input outlined dense color="primary" label="Template code"
        v-model="local.templateCode" placeholder="expedient_default_v1" />
    </div>

    <div class="col-12 col-md-6">
      <q-select outlined dense color="primary" label="Idioma"
        v-model="local.language" :options="['es','en']" />
    </div>

    <div class="col-12">
      <q-select outlined dense color="primary" label="Secciones requeridas (keys reales)"
        v-model="local.requiredSections"
        use-input use-chips multiple new-value-mode="add-unique"
        placeholder="personalDocs, legalContracts, recruiting..." />
    </div>

    <div class="col-12 col-md-6">
      <q-toggle v-model="local.rules.strictMode" color="primary" label="Strict mode" />
    </div>
    <div class="col-12 col-md-6">
      <q-toggle v-model="local.rules.requireEvidenceLinks" color="primary" label="Requerir evidencias/links" />
    </div>

    <div class="col-12 col-md-6">
      <q-toggle v-model="local.rules.allowMissingAttachments" color="primary" label="Permitir adjuntos faltantes" />
    </div>
    <div class="col-12 col-md-6">
      <q-input outlined dense type="number" color="primary" min="0" max="1" step="0.05"
        v-model.number="local.rules.minConfidence" label="Min confidence (0-1)" />
    </div>

    <div class="col-12">
      <q-input outlined dense type="textarea" autogrow color="primary"
        v-model="local.systemNotes" label="Instrucciones extra (opcional)" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({ modelValue: { type: Object, required: true } });
const emit = defineEmits(["update:modelValue"]);
const local = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});
</script>
