<template>
  <q-dialog v-model="modelValueLocal" persistent>
    <q-card style="width: 900px; max-width: 95vw" class="rounded-card">
      <q-card-section class="row items-center justify-between bg-primary">
        <div class="row items-center text-white">
          <div class="col-auto q-mx-sm">
            <q-icon size="xl" name="assignment_ind" color="white" />
          </div>
          <div class="text-h6 text-weight-bold">
            {{ isEdit ? "EDITAR ENTRENAMIENTO" : "CREAR ENTRENAMIENTO" }}
          </div>
        </div>
        <q-btn
          size="sm"
          round
          dense
          icon="close"
          class="bg-white text-primary"
          @click="closeDialog"
        />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-input
              v-model="form.title"
              label="Título"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="form.description"
              label="Descripción"
              type="textarea"
              autogrow
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="form.type"
              :options="typeOptions"
              label="Tipo"
              outlined
              dense
              rounded
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="form.status"
              :options="statusOptions"
              label="Estado"
              outlined
              dense
              rounded
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model.number="form.estimatedMinutes"
              type="number"
              label="Duración estimada (min)"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model.number="form.passScore"
              type="number"
              label="Puntaje mínimo"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model.number="form.maxAttempts"
              type="number"
              label="Máx. intentos"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12 col-md-4">
            <q-toggle v-model="form.isMandatory" label="Obligatorio" />
          </div>

          <div class="col-12">
            <q-input
              v-model="form.instructions"
              label="Instrucciones"
              type="textarea"
              autogrow
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="form.thumbnail"
              label="Thumbnail URL"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12 col-md-3">
            <q-input
              v-model="form.startDate"
              label="Fecha inicio"
              type="date"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12 col-md-3">
            <q-input
              v-model="form.endDate"
              label="Fecha fin"
              type="date"
              outlined
              dense
              rounded
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancelar"
          icon="cancel"
          color="negative"
          @click="closeDialog"
        />
        <q-btn
          color="primary"
          unelevated
          label="Guardar"
          icon="save"
          :loading="loading"
          @click="handleSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch, useModel } from "vue";

const props = defineProps<{
  modelValue: boolean;
  training?: any | null;
  loading?: boolean;
}>();

const emit = defineEmits(["update:modelValue", "save"]);
const modelValueLocal = useModel(props, "modelValue");

const isEdit = computed(() => !!props.training?._id);

const typeOptions = [
  { label: "Lección", value: "LESSON" },
  { label: "Cuestionario", value: "QUIZ" },
  { label: "Mixto", value: "MIXED" },
];

const statusOptions = [
  { label: "Borrador", value: "DRAFT" },
  { label: "Publicado", value: "PUBLISHED" },
  { label: "Archivado", value: "ARCHIVED" },
];

const emptyForm = () => ({
  title: "",
  code: "",
  description: "",
  type: "MIXED",
  instructions: "",
  thumbnail: "",
  estimatedMinutes: 0,
  passScore: 70,
  maxAttempts: 1,
  isMandatory: false,
  startDate: "",
  endDate: "",
  status: "DRAFT",
});

const form = reactive(emptyForm());

watch(
  () => props.training,
  (value) => {
    Object.assign(form, emptyForm());

    if (value) {
      Object.assign(form, {
        title: value.title || "",
        code: value.code || "",
        description: value.description || "",
        type: value.type || "MIXED",
        instructions: value.instructions || "",
        thumbnail: value.thumbnail || "",
        estimatedMinutes: value.estimatedMinutes || 0,
        passScore: value.passScore || 70,
        maxAttempts: value.maxAttempts || 1,
        isMandatory: !!value.isMandatory,
        startDate: value.startDate ? String(value.startDate).slice(0, 10) : "",
        endDate: value.endDate ? String(value.endDate).slice(0, 10) : "",
        status: value.status || "DRAFT",
      });
    }
  },
  { immediate: true },
);

const closeDialog = () => {
  emit("update:modelValue", false);
};

const handleSave = () => {
  emit("save", {
    ...form,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
  });
};
</script>

<style scoped>
.rounded-card {
  border-radius: 20px;
}
</style>
