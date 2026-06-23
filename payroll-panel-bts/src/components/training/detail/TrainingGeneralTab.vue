<template>
  <q-card flat bordered class="rounded-card section-card">
    <q-card-section class="section-header">
      <div class="row items-center q-gutter-sm text-primary">
        <q-icon name="info" size="md" />
        <div class="text-h6 text-weight-bold">Información general</div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row q-col-gutter-lg">
        <div class="col-12 col-md-6">
          <div class="detail-field">
            <div class="detail-label">Título</div>
            <div class="detail-value">{{ training?.title || "-" }}</div>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <div class="detail-field">
            <div class="detail-label">Descripción</div>
            <div class="detail-value">{{ training?.description || "-" }}</div>
          </div>
        </div>

        <div class="col-12">
          <div class="detail-field">
            <div class="detail-label">Instrucciones</div>
            <div class="detail-value">{{ training?.instructions || "-" }}</div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  training: any;
}>();
</script>

<style scoped>
.rounded-card {
  border-radius: 20px;
}

.section-card {
  background: white;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

.section-header {
  background: #fcfdff;
}

.detail-field {
  background: #f8fafc;
  border-radius: 16px;
  padding: 14px 16px;
  height: 100%;
}

.detail-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.detail-value {
  font-size: 14px;
  color: #0f172a;
  white-space: pre-wrap;
}
</style>