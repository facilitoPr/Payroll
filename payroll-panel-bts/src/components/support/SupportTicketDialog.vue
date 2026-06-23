<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    persistent
  >
    <q-card class="support-dialog">
      <q-card-section
        class="row items-start justify-between bg-primary text-white"
      >
        <div class="row items-center text-white q-gutter-x-sm">
          <div class="col-auto">
            <q-icon size="xl" name="support_agent" color="white" />
          </div>

          <div>
            <div class="text-h6 text-weight-bold">Help Desk</div>
            <div class="text-caption">
              Cuéntanos el problema y nuestro equipo lo revisará.
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          color="white"
          :disable="loading"
          @click="emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <q-input
          v-model="form.title"
          label="Título del problema"
          outlined
          dense
          rounded
          maxlength="120"
          counter
          :disable="loading"
        />

        <q-select
          v-model="form.priority"
          :options="priorityOptions"
          label="Prioridad"
          outlined
          dense
          rounded
          emit-value
          map-options
          :disable="loading"
        />

        <q-input
          v-model="form.description"
          type="textarea"
          label="Descripción"
          outlined
          rounded
          autogrow
          maxlength="1500"
          counter
          :disable="loading"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          rounded
          label="Cancelar"
          color="grey-7"
          :disable="loading"
          @click="emit('update:modelValue', false)"
        />
        <q-btn
          color="primary"
          unelevated
          rounded
          :loading="loading"
          label="Enviar solicitud"
          @click="submitForm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(["update:modelValue", "created"]);

const $q = useQuasar();
const loading = ref(false);

const priorityOptions = [
  { label: "Baja", value: "LOW" },
  { label: "Media", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
];

const getInitialForm = () => ({
  title: "",
  description: "",
  priority: "MEDIUM",
});

const form = reactive(getInitialForm());

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      Object.assign(form, getInitialForm());
    }
  },
);

const submitForm = async () => {
  const payload = {
    title: form.title?.trim(),
    description: form.description?.trim(),
    priority: form.priority,
  };

  if (!payload.title) {
    return $q.notify({
      type: "warning",
      message: "Debes escribir un título",
    });
  }

  if (!payload.description || payload.description.length < 10) {
    return $q.notify({
      type: "warning",
      message: "La descripción debe tener al menos 10 caracteres",
    });
  }

  loading.value = true;

  try {
    const resp = await methodsHttp.postApi("/support/tickets", payload);

    if (!resp?.ok) {
      return $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo enviar la solicitud",
      });
    }

    $q.notify({
      type: "positive",
      message: resp?.mensaje || "Tu solicitud fue enviada correctamente",
    });

    emit("created", resp?.ticket || null);
    emit("update:modelValue", false);
    Object.assign(form, getInitialForm());
  } catch (error: any) {
    $q.notify({
      type: "negative",
      message: error?.message || "No se pudo enviar la solicitud",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.support-dialog {
  width: 100%;
  max-width: 620px;
  border-radius: 22px;
}
</style>