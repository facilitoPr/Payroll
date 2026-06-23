<template>
  <q-card flat bordered class="rounded-card section-card">
    <q-card-section class="row items-center justify-between section-header">
      <div class="row items-center q-gutter-sm text-primary">
        <q-icon name="groups" size="md" />
        <div class="text-h6 text-weight-bold">Asignar empleados</div>
      </div>

      <q-btn
        color="primary"
        rounded
        unelevated
        icon="person_add"
        label="Asignar"
        @click="$emit('open-assign')"
      />
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-table flat :rows="assignments" :columns="columns" row-key="_id">
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
              :color="assignmentStatusColor(props.row.status)"
              text-color="white"
            >
              {{ props.row.status }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-dates="props">
          <q-td :props="props">
            <div class="text-caption">
              <div><strong>Desde:</strong> {{ formatDate(props.row.availableFrom) }}</div>
              <div><strong>Hasta:</strong> {{ formatDate(props.row.availableUntil) }}</div>
              <div><strong>Límite:</strong> {{ formatDate(props.row.dueDate) }}</div>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  assignments: any[];
  assignmentStatusColor: (status: string) => string;
  formatDate: (value?: string | null) => string;
}>();

defineEmits(["open-assign"]);

const columns: any = [
  { name: "user", label: "Usuario", field: "user", align: "left" },
  { name: "status", label: "Estado", field: "status", align: "left" },
  { name: "score", label: "Score", field: "score", align: "left" },
  {
    name: "totalAttemptsUsed",
    label: "Intentos",
    field: "totalAttemptsUsed",
    align: "left",
  },
  { name: "dates", label: "Fechas", field: "dates", align: "left" },
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