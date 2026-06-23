<template>
  <q-card flat bordered class="rounded-card section-card">
    <q-card-section class="row items-center justify-between section-header">
      <div class="row items-center q-gutter-sm text-primary">
        <q-icon name="quiz" size="md" />
        <div class="text-h6 text-weight-bold">Preguntas</div>
      </div>

      <q-btn
        color="primary"
        rounded
        unelevated
        icon="add"
        label="Agregar pregunta"
        @click="$emit('add')"
      />
    </q-card-section>

    <q-separator />

    <q-card-section class="column q-gutter-md">
      <q-card
        v-for="question in questions"
        :key="question._id"
        flat
        bordered
        class="rounded-card item-card"
      >
        <q-card-section class="row items-start justify-between">
          <div class="col">
            <div class="text-subtitle2 text-weight-bold">
              {{ question.questionText }}
            </div>

            <div class="row items-center q-gutter-sm q-mt-sm">
              <q-chip dense color="primary" text-color="white">
                {{ getQuestionTypeLabel(question.type) }}
              </q-chip>
              <q-chip dense outline color="grey-7">
                {{ question.isRequired ? "Obligatoria" : "Opcional" }}
              </q-chip>
              <q-chip dense outline color="grey-7">
                Orden {{ question.order }}
              </q-chip>
            </div>
          </div>

          <div class="row q-gutter-sm">
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="secondary"
              @click="$emit('edit', question)"
            />
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              @click="$emit('remove', question)"
            />
          </div>
        </q-card-section>
      </q-card>

      <div v-if="!questions.length" class="empty-state">
        No hay preguntas registradas.
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { getQuestionTypeLabel } from 'src/helpers/catalogs/training.catalog';

defineProps<{
  questions: any[];
}>();

defineEmits(["add", "edit", "remove"]);
</script>

<style scoped>
.rounded-card {
  border-radius: 20px;
}

.section-card,
.item-card {
  background: white;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

.section-header {
  background: #fcfdff;
}

.empty-state {
  padding: 24px;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  text-align: center;
  color: #64748b;
  background: #fff;
}
</style>