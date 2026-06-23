<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-md-6">
      <q-input outlined dense color="primary" label="Title" v-model="local.ui.title" />
    </div>

    <div class="col-12 col-md-6">
      <q-select outlined dense color="primary" label="Position"
        v-model="local.ui.position" :options="['bottom-right','bottom-left']" />
    </div>

    <div class="col-12">
      <q-input outlined dense type="textarea" autogrow color="primary"
        label="Welcome message" v-model="local.ui.welcomeMessage" />
    </div>

    <div class="col-12 col-md-4">
      <q-select outlined dense color="primary" label="Language"
        v-model="local.behavior.language" :options="['es','en']" />
    </div>

    <div class="col-12 col-md-4">
      <q-select outlined dense color="primary" label="Tone"
        v-model="local.behavior.tone" :options="['formal','friendly','salesy','technical']" />
    </div>

    <div class="col-12 col-md-4">
      <q-toggle v-model="local.behavior.strictMode" color="primary" label="Strict mode" />
    </div>

    <div class="col-12">
      <q-input outlined dense type="textarea" autogrow color="primary"
        label="Fallback message" v-model="local.behavior.fallbackMessage" />
    </div>

    <div class="col-12">
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-weight-bold">Knowledge chunks</div>
        <q-btn dense outline color="primary" icon="add" label="Agregar"
          @click="addChunk" />
      </div>

      <div v-if="!local.knowledge?.chunks?.length" class="text-grey-7">
        No hay chunks todavía.
      </div>

      <q-expansion-item
        v-for="(ch, idx) in local.knowledge.chunks"
        :key="idx"
        expand-separator
        :label="ch.title?.trim()?.length ? ch.title : `Chunk #${idx + 1}`"
        icon="description"
        class="q-mb-sm"
      >
        <div class="row q-col-gutter-md q-pt-sm">
          <div class="col-12 col-md-6">
            <q-input outlined dense color="primary" label="Título" v-model="ch.title" />
          </div>
          <div class="col-12 col-md-6 flex items-center justify-end">
            <q-btn dense flat color="negative" icon="delete" label="Eliminar" @click="removeChunk(idx)" />
          </div>
          <div class="col-12">
            <q-input outlined dense type="textarea" autogrow color="primary"
              label="Contenido" v-model="ch.text" />
          </div>
        </div>
      </q-expansion-item>
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

function addChunk() {
  if (!local.value.knowledge) local.value.knowledge = { chunks: [], retrieval: { topK: 5, minScore: 0.2 } };
  if (!local.value.knowledge.chunks) local.value.knowledge.chunks = [];
  local.value.knowledge.chunks.push({ title: "", text: "" });
}
function removeChunk(idx) {
  local.value.knowledge?.chunks?.splice(idx, 1);
}
</script>
