<template>
  <div>
    <label>
      <b> <b :class="[props.require ? 'r' : 'w']">*</b> {{ props.title }} </b>
    </label>

    <q-input
      type="textarea"
      outlined
      dense
      color="primary"
      v-model="inputTextarea"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();

const props = defineProps({
  title: {
    type: String,
  },
  require: {
    type: Boolean,
  },
});

const inputTextarea = ref("");

const emit = defineEmits(["inputTextarea"]);

watch(inputTextarea, () => {
  emit("inputTextarea", inputTextarea.value);
});
</script>

<style scoped>
.r {
  color: #c10015;
}
.w {
  color: #ffffff;
}
</style>
