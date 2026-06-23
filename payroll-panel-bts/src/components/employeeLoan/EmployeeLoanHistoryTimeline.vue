<template>
  <q-card flat bordered class="history-card">
    <q-card-section class="history-header row items-center justify-between">
      <div>
        <div class="history-title">Historial de la solicitud</div>
        <div class="history-subtitle">
          Seguimiento de eventos, sincronización y cambios de estado.
        </div>
      </div>

      <q-btn
        flat
        rounded
        dense
        no-caps
        color="primary"
        icon="refresh"
        label="Recargar"
        :loading="loading"
        @click="emit('refresh')"
      />
    </q-card-section>

    <q-separator />

    <q-card-section v-if="loading" class="q-pa-md">
      <q-skeleton type="QToolbar" class="q-mb-sm" />
      <q-skeleton type="text" width="75%" />
      <q-skeleton type="text" width="55%" />
    </q-card-section>

    <q-card-section v-else-if="error" class="q-pa-md">
      <q-banner rounded class="bg-red-1 text-red-10">
        <template #avatar>
          <q-icon name="error" color="negative" />
        </template>
        {{ error }}
      </q-banner>
    </q-card-section>

    <q-card-section v-else-if="!history.length" class="empty-history">
      <q-icon name="history" size="42px" color="grey-5" />
      <div class="text-subtitle1 text-weight-bold q-mt-sm">
        Sin historial
      </div>
      <div class="text-caption text-grey-7">
        Esta solicitud todavía no tiene movimientos registrados.
      </div>
    </q-card-section>

    <q-card-section v-else class="timeline-wrap">
      <q-timeline color="primary" layout="dense">
        <q-timeline-entry
          v-for="item in normalizedHistory"
          :key="item._id || item.createdAt || item.action"
          :icon="item.meta.icon"
          :color="item.meta.color"
        >
          <template #title>
            <div class="timeline-title-row">
              <q-chip
                dense
                square
                :color="item.meta.color"
                text-color="white"
                class="timeline-chip"
              >
                {{ getLoanHistoryActionsText(item.meta.label) }}
              </q-chip>

              <span class="timeline-date">
                {{ formatDateTime(item.createdAt || item.updatedAt) }}
              </span>
            </div>
          </template>

          <template #subtitle>
            <div class="timeline-subtitle">
              <q-icon name="person" size="16px" />
              <span>{{ getActorName(item) }}</span>

              <!-- <q-chip
                dense
                color="blue-1"
                text-color="primary"
                class="q-ml-xs"
              >
                {{ item.source || "SYSTEM" }}
              </q-chip> -->
            </div>
          </template>

          <q-card flat bordered class="timeline-detail-card">
            <q-card-section class="q-pa-md">
              <div v-if="hasComment(item)" class="comment-box q-mb-sm">
                <div class="comment-label">Comentario</div>
                <div class="comment-text">
                  {{ item.comment }}
                </div>
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-12 col-md-4">
                  <div class="detail-label">Estado anterior</div>
                  <div class="detail-value">
                    {{ getEmployeeLoanRequestStatusText(item.fromStatus) || "-" }}
                  </div>
                </div>

                <div class="col-12 col-md-4">
                  <div class="detail-label">Estado nuevo</div>
                  <div class="detail-value">
                    {{ getEmployeeLoanRequestStatusText(item.toStatus) || "-" }}
                  </div>
                </div>

                <div class="col-12 col-md-4">
                  <div class="detail-label">Acción</div>
                  <div class="detail-value">
                    {{ getLoanHistoryActionsText(item.action) || "-" }}
                  </div>
                </div>
              </div>

              <!-- <q-expansion-item
                v-if="item.metadata && Object.keys(item.metadata).length"
                dense
                dense-toggle
                expand-separator
                icon="data_object"
                label="Ver metadata"
                class="snapshot-expansion q-mt-sm"
              >
                <pre class="snapshot-json">{{ stringifySnapshot(item.metadata) }}</pre>
              </q-expansion-item> -->
            </q-card-section>
          </q-card>
        </q-timeline-entry>
      </q-timeline>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { getEmployeeLoanRequestStatusText, getLoanHistoryActionsText } from "src/helpers/catalogs/loan.catalog";
import moment from "moment";
import { computed } from "vue";

const props = defineProps({
  history: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["refresh"]);

const actionMeta = (action) => {
  const value = String(action || "").toUpperCase();

  const map = {
    CREATED: { label: "Creada", color: "primary", icon: "add_circle" },
    SUBMITTED: { label: "Enviada", color: "primary", icon: "send" },
    SENT_TO_EXTERNAL: {
      label: "Enviada externo",
      color: "blue-8",
      icon: "cloud_upload",
    },
    EXTERNAL_RECEIVED: {
      label: "Recibida externo",
      color: "blue-10",
      icon: "cloud_done",
    },
    STATUS_CHANGED: {
      label: "Cambio de estado",
      color: "purple-7",
      icon: "sync_alt",
    },
    APPROVED: { label: "Aprobada", color: "positive", icon: "check_circle" },
    REJECTED: { label: "Rechazada", color: "negative", icon: "cancel" },
    CANCELLED: { label: "Cancelada", color: "grey-7", icon: "block" },
    ERROR: { label: "Error", color: "negative", icon: "error" },
    SYNC_FAILED: { label: "Sync falló", color: "negative", icon: "cloud_off" },
    SYNCED: { label: "Sincronizada", color: "positive", icon: "verified" },
    COMMENTED: { label: "Comentada", color: "warning", icon: "comment" },
    CLOSED: { label: "Cerrada", color: "green-10", icon: "task_alt" },
  };

  return map[value] || {
    label: value || "Evento",
    color: "grey-7",
    icon: "history",
  };
};

const normalizedHistory = computed(() => {
  return [...props.history].map((item) => ({
    ...item,
    meta: actionMeta(item.action),
  }));
});

const hasComment = (item) => {
  const comment = String(item?.comment || "").trim();
  return comment && comment !== "-";
};

const getActorName = (item) => {
  return item?.performedBy?.name || "Sistema";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return moment(value).format("YYYY/MM/DD hh:mm A");
};

const stringifySnapshot = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value || "");
  }
};
</script>

<style scoped>
.history-card {
  border-radius: 20px;
  overflow: hidden;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.history-header {
  min-height: 72px;
  background: #ffffff;
}

.history-title {
  color: #0f172a;
  font-size: 0.98rem;
  font-weight: 900;
}

.history-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}

.empty-history {
  text-align: center;
  padding: 28px;
  color: #64748b;
}

.timeline-wrap {
  padding: 18px 30px 4px;
  background: #f8fafc;
}

.timeline-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.timeline-chip {
  font-weight: 900;
}

.timeline-date {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}

.timeline-subtitle {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #64748b;
  font-size: 0.78rem;
  flex-wrap: wrap;
}

.timeline-detail-card {
  border-radius: 18px;
  background: white;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.comment-box {
  padding: 12px;
  border-radius: 14px;
  background: #f1f5f9;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.comment-label,
.detail-label {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.comment-text {
  margin-top: 4px;
  color: #0f172a;
  white-space: pre-wrap;
}

.detail-value {
  margin-top: 3px;
  color: #0f172a;
  font-size: 0.86rem;
  font-weight: 800;
}

.snapshot-expansion {
  border-radius: 14px;
  background: #f8fafc;
}

.snapshot-json {
  max-height: 260px;
  overflow: auto;
  margin: 0;
  padding: 12px;
  border-radius: 12px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 0.75rem;
}
</style>