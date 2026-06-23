<template>
  <q-pagination
    v-model="model"
    :max="orderQuantity ? orderQuantity : 1"
    :max-pages="maxPages"
    direction-links
    push
    :color="color"
    active-design="push"
    :active-color="activeColor"
  />
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  initialPagination: { type: Number, default: 1 },
  orderQuantity: { type: Number, required: true },
  color: { type: String, required: true },
  activeColor: { type: String, required: true },
  maxPages: { type: Number, default: 10 },
});

const emit = defineEmits(["update:initialPagination"]);

const model = computed({
  get: () => props.initialPagination,
  set: (v) => emit("update:initialPagination", v),
});
</script>
