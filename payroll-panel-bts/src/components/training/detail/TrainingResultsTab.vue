<template>
  <q-card flat bordered class="rounded-card section-card">
    <q-card-section class="row items-center q-gutter-sm section-header text-primary">
      <q-icon name="leaderboard" size="md" />
      <div class="text-h6 text-weight-bold">Resultados</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-table flat :rows="attempts" :columns="columns" row-key="_id">
        <template #body-cell-user="props">
          <q-td :props="props">
            <div class="text-weight-medium">{{ props.row.user?.name || "-" }}</div>
            <div class="text-caption text-grey-7">{{ props.row.user?.email || "-" }}</div>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-chip
              dense
              :color="attemptStatusColor(props.row.status)"
              text-color="white"
            >
              {{ props.row.status }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-score="props">
          <q-td :props="props">
            <div class="text-weight-bold">{{ props.row.score }}%</div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              dense
              icon="visibility"
              color="primary"
              @click="$emit('view-attempt', props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  attempts: any[];
  attemptStatusColor: (status: string) => string;
}>();

defineEmits(["view-attempt"]);

const columns: any = [
  { name: "user", label: "Usuario", field: "user", align: "left" },
  {
    name: "attemptNumber",
    label: "Intento",
    field: "attemptNumber",
    align: "left",
  },
  { name: "status", label: "Estado", field: "status", align: "left" },
  { name: "score", label: "Score", field: "score", align: "left" },
  { name: "actions", label: "Acciones", field: "actions", align: "right" },
];
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
</style>