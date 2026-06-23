<template>
  <q-card flat bordered class="rounded-card top-summary-card">
    <q-card-section class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="summary-box">
          <div class="summary-label">Tipo</div>
          <div class="summary-value">{{ getTrainingTypeLabel(training?.type) || "-" }}</div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="summary-box">
          <div class="summary-label">Estado</div>
          <q-chip dense :color="statusColor" text-color="white">
            {{ getTrainingStatusLabel(training?.status) || "-" }}
          </q-chip>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="summary-box">
          <div class="summary-label">Puntaje mínimo</div>
          <div class="summary-value">{{ training?.passScore || 0 }}%</div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="summary-box">
          <div class="summary-label">Intentos máximos</div>
          <div class="summary-value">{{ training?.maxAttempts || 0 }}</div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { getTrainingStatusLabel, getTrainingTypeLabel } from 'src/helpers/catalogs/training.catalog';

defineProps<{
  training: any;
  statusColor: string;
}>();
</script>

<style scoped>
.rounded-card {
  border-radius: 20px;
}

.top-summary-card {
  background: white;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

.summary-box {
  background: #f8fafc;
  border-radius: 16px;
  padding: 14px 16px;
  min-height: 90px;
}

.summary-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}
</style>