<template>
  <div class="row q-col-gutter-md">
    <div
      v-for="card in displayCards"
      :key="card.key"
      class="col-12 col-sm-6 col-md-4 col-lg-3"
    >
      <q-card flat bordered class="metric-card full-height">
        <q-card-section class="metric-card__section">
          <div class="row items-start justify-between no-wrap">
            <div class="metric-card__content">
              <div v-if="loading" class="q-mb-sm">
                <q-skeleton type="text" width="110px" />
              </div>
              <div v-else class="metric-card__label">
                {{ card.label }}
              </div>

              <div v-if="loading" class="q-mt-sm">
                <q-skeleton type="text" width="90px" height="34px" />
              </div>
              <div v-else class="metric-card__value q-mt-xs">
                {{ card.value }}
              </div>
            </div>

            <div class="metric-card__icon-wrap" :class="card.iconBgClass">
              <q-icon :name="card.icon" size="22px" :class="card.iconClass" />
            </div>
          </div>

          <div class="q-mt-md">
            <div v-if="loading">
              <q-skeleton type="text" width="75%" />
            </div>
            <div v-else-if="card.helper" class="metric-card__helper">
              {{ card.helper }}
            </div>
          </div>
        </q-card-section>

        <div
          v-if="!loading"
          class="metric-card__bottom-bar"
          :class="card.barClass"
        />
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TrainingMetrics } from "src/types/training";

const props = withDefaults(
  defineProps<{
    metrics: TrainingMetrics | null;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

type MetricCard = {
  key: string;
  label: string;
  value: string | number;
  helper?: string;
  icon: string;
  iconClass: string;
  iconBgClass: string;
  barClass: string;
};

const skeletonCards: MetricCard[] = [
  {
    key: "s1",
    label: "",
    value: "",
    helper: "",
    icon: "school",
    iconClass: "text-primary",
    iconBgClass: "bg-primary-soft",
    barClass: "bar-primary",
  },
  {
    key: "s2",
    label: "",
    value: "",
    helper: "",
    icon: "assignment_turned_in",
    iconClass: "text-positive",
    iconBgClass: "bg-positive-soft",
    barClass: "bar-positive",
  },
  {
    key: "s3",
    label: "",
    value: "",
    helper: "",
    icon: "schedule",
    iconClass: "text-orange",
    iconBgClass: "bg-orange-soft",
    barClass: "bar-orange",
  },
  {
    key: "s4",
    label: "",
    value: "",
    helper: "",
    icon: "analytics",
    iconClass: "text-purple",
    iconBgClass: "bg-purple-soft",
    barClass: "bar-purple",
  },
  {
    key: "s5",
    label: "",
    value: "",
    helper: "",
    icon: "check_circle",
    iconClass: "text-teal",
    iconBgClass: "bg-teal-soft",
    barClass: "bar-teal",
  },
  {
    key: "s6",
    label: "",
    value: "",
    helper: "",
    icon: "cancel",
    iconClass: "text-negative",
    iconBgClass: "bg-negative-soft",
    barClass: "bar-negative",
  },
  {
    key: "s7",
    label: "",
    value: "",
    helper: "",
    icon: "trending_up",
    iconClass: "text-indigo",
    iconBgClass: "bg-indigo-soft",
    barClass: "bar-indigo",
  },
  {
    key: "s8",
    label: "",
    value: "",
    helper: "",
    icon: "workspace_premium",
    iconClass: "text-cyan",
    iconBgClass: "bg-cyan-soft",
    barClass: "bar-cyan",
  },
];

const cards = computed<MetricCard[]>(() => {
  const m = props.metrics;

  if (!m) return [];

  return [
    {
      key: "total-trainings",
      label: "Total entrenamientos",
      value: m.totalTrainings,
      helper: `${m.publishedTrainings} publicados`,
      icon: "school",
      iconClass: "text-primary",
      iconBgClass: "bg-primary-soft",
      barClass: "bar-primary",
    },
    {
      key: "published",
      label: "Publicados",
      value: m.publishedTrainings,
      helper: `${m.draftTrainings} borradores`,
      icon: "public",
      iconClass: "text-positive",
      iconBgClass: "bg-positive-soft",
      barClass: "bar-positive",
    },
    {
      key: "drafts",
      label: "Borradores",
      value: m.draftTrainings,
      helper: `${m.archivedTrainings} archivados`,
      icon: "edit_note",
      iconClass: "text-orange",
      iconBgClass: "bg-orange-soft",
      barClass: "bar-orange",
    },
    {
      key: "archived",
      label: "Archivados",
      value: m.archivedTrainings,
      helper: `${m.totalTrainings - m.archivedTrainings} activos`,
      icon: "inventory_2",
      iconClass: "text-grey-8",
      iconBgClass: "bg-grey-soft",
      barClass: "bar-grey",
    },
    {
      key: "assignments",
      label: "Asignaciones",
      value: m.totalAssignments,
      helper: `${m.completedAssignments} completados`,
      icon: "assignment",
      iconClass: "text-indigo",
      iconBgClass: "bg-indigo-soft",
      barClass: "bar-indigo",
    },
    {
      key: "completed",
      label: "Completados",
      value: m.completedAssignments,
      helper: `${m.failedAssignments} fallidos`,
      icon: "assignment_turned_in",
      iconClass: "text-teal",
      iconBgClass: "bg-teal-soft",
      barClass: "bar-teal",
    },
    {
      key: "failed",
      label: "Fallidos",
      value: m.failedAssignments,
      helper: `${m.totalAssignments - m.failedAssignments} en progreso`,
      icon: "cancel",
      iconClass: "text-negative",
      iconBgClass: "bg-negative-soft",
      barClass: "bar-negative",
    },
    {
      key: "in-progress",
      label: "En progreso",
      value: m.startedAssignments,
      helper: `${m.totalAssignments - m.startedAssignments} sin iniciar`,
      icon: "schedule",
      iconClass: "text-amber-9",
      iconBgClass: "bg-amber-soft",
      barClass: "bar-amber",
    },
    {
      key: "attempts",
      label: "Intentos",
      value: m.totalAttempts,
      helper: `${m.passedAttempts} aprobados`,
      icon: "history_edu",
      iconClass: "text-purple",
      iconBgClass: "bg-purple-soft",
      barClass: "bar-purple",
    },
    {
      key: "passed-attempts",
      label: "Intentos aprobados",
      value: m.passedAttempts,
      helper: `${m.failedAttempts} fallidos`,
      icon: "check_circle",
      iconClass: "text-positive",
      iconBgClass: "bg-positive-soft",
      barClass: "bar-positive",
    },
    {
      key: "failed-attempts",
      label: "Intentos fallidos",
      value: m.failedAttempts,
      helper: `${m.totalAttempts - m.failedAttempts} en progreso`,
      icon: "dangerous",
      iconClass: "text-negative",
      iconBgClass: "bg-negative-soft",
      barClass: "bar-negative",
    },
    {
      key: "completion-rate",
      label: "Tasa de finalización",
      value: `${m.completionRate}%`,
      helper: `${m.completedAssignments} de ${m.totalAssignments} asignaciones completadas`,
      icon: "trending_up",
      iconClass: "text-cyan",
      iconBgClass: "bg-cyan-soft",
      barClass: "bar-cyan",
    },
    {
      key: "approval-rate",
      label: "Tasa de aprobación",
      value: `${m.approvalRate}%`,
      helper: `${m.passedAttempts} de ${m.totalAttempts} intentos aprobados`,
      icon: "workspace_premium",
      iconClass: "text-deep-purple",
      iconBgClass: "bg-deep-purple-soft",
      barClass: "bar-deep-purple",
    },
  ];
});

const displayCards = computed(() => {
  if (props.loading) return skeletonCards;
  return cards.value;
});
</script>

<style scoped>
.metric-card {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
}

.metric-card__section {
  padding: 18px 18px 16px;
}

.metric-card__content {
  min-width: 0;
  flex: 1;
}

.metric-card__label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.02em;
}

.metric-card__value {
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1.1;
  color: #0f172a;
}

.metric-card__helper {
  font-size: 0.8rem;
  line-height: 1.45;
  color: #475569;
}

.metric-card__icon-wrap {
  width: 46px;
  height: 46px;
  min-width: 46px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-card__bottom-bar {
  height: 4px;
  width: 100%;
}

.bg-primary-soft {
  background: rgba(25, 118, 210, 0.1);
}

.bg-positive-soft {
  background: rgba(33, 186, 69, 0.1);
}

.bg-orange-soft {
  background: rgba(245, 124, 0, 0.1);
}

.bg-grey-soft {
  background: rgba(100, 116, 139, 0.12);
}

.bg-indigo-soft {
  background: rgba(99, 102, 241, 0.1);
}

.bg-teal-soft {
  background: rgba(13, 148, 136, 0.1);
}

.bg-negative-soft {
  background: rgba(193, 32, 38, 0.1);
}

.bg-amber-soft {
  background: rgba(217, 119, 6, 0.1);
}

.bg-purple-soft {
  background: rgba(147, 51, 234, 0.1);
}

.bg-cyan-soft {
  background: rgba(8, 145, 178, 0.1);
}

.bg-deep-purple-soft {
  background: rgba(109, 40, 217, 0.1);
}

.bar-primary {
  background: linear-gradient(90deg, #1976d2, #42a5f5);
}

.bar-positive {
  background: linear-gradient(90deg, #21ba45, #6ddf7e);
}

.bar-orange {
  background: linear-gradient(90deg, #f57c00, #ffb74d);
}

.bar-grey {
  background: linear-gradient(90deg, #64748b, #94a3b8);
}

.bar-indigo {
  background: linear-gradient(90deg, #6366f1, #818cf8);
}

.bar-teal {
  background: linear-gradient(90deg, #0d9488, #2dd4bf);
}

.bar-negative {
  background: linear-gradient(90deg, #c12026, #ef4444);
}

.bar-amber {
  background: linear-gradient(90deg, #d97706, #fbbf24);
}

.bar-purple {
  background: linear-gradient(90deg, #9333ea, #c084fc);
}

.bar-cyan {
  background: linear-gradient(90deg, #0891b2, #22d3ee);
}

.bar-deep-purple {
  background: linear-gradient(90deg, #6d28d9, #8b5cf6);
}
</style>