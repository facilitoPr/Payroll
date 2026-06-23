<template>
  <div>
    <div class="row items-center justify-between q-mb-sm">
      <div>
        <div class="text-weight-bold">{{ title }}</div>
        <div class="text-caption text-grey-7">{{ subtitle }}</div>
      </div>

      <q-btn dense outline color="primary" icon="add" label="Agregar" @click="add" />
    </div>

    <div v-if="!items.length" class="text-grey-7">
      No hay items todavía.
    </div>

    <div v-for="(r, idx) in items" :key="idx" class="q-mb-sm">
      <q-card bordered class="bg-white">
        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                outlined
                dense
                color="primary"
                v-model="r.key"
                label="Key"
                placeholder="key"
              />
            </div>

            <div class="col-12 col-md-7">
              <q-input
                outlined
                dense
                color="primary"
                v-model="r.label"
                label="Label"
                placeholder="Label"
              />
            </div>

            <div class="col-12 col-md-1 flex items-center justify-end">
              <q-btn dense round flat icon="delete" color="negative" @click="remove(idx)" />
            </div>

            <div class="col-12">
              <q-input
                outlined
                dense
                type="textarea"
                autogrow
                color="primary"
                v-model="r.description"
                :label="(itemLabel || 'Item') + ' - descripción / guía'"
                placeholder="Qué debe evaluar / señales / ejemplos..."
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  itemLabel: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);

const items = computed({
  get: () => props.modelValue || [],
  set: (v) => emit("update:modelValue", v),
});

function add() {
  const next = [...items.value];
  next.push({ key: "", label: "", description: "" });
  items.value = next;
}

function remove(i) {
  const next = [...items.value];
  next.splice(i, 1);
  items.value = next;
}
</script>
