<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="details-dialog">
      <q-card-section class="dialog-header bg-primary row items-center justify-between">
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon name="assignment_ind" size="28px" />
          </div>

          <div>
            <div class="dialog-title">Detalle de solicitud</div>
            <div class="dialog-subtitle">
              Información del empleado, solicitud, motivo y comentarios.
            </div>
          </div>
        </div>

        <q-btn flat round dense icon="close" color="white" @click="closeDialog" />
      </q-card-section>

      <q-card-section class="dialog-body">
        <div v-if="request" class="row q-col-gutter-md">
          <div class="col-12">
            <q-card flat bordered class="hero-card">
              <div class="row items-center q-col-gutter-md">
                <div class="col-12 col-md">
                  <div class="row items-center no-wrap">
                    <q-avatar size="58px" class="employee-avatar">
                      {{ initials(request?.user?.name) }}
                    </q-avatar>

                    <div class="q-ml-md">
                      <div class="employee-name">
                        {{ request?.user?.name || "Empleado" }}
                      </div>
                      <div class="employee-meta">
                        {{ request?.user?.email || "Sin correo" }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-md-auto">
                  <q-badge
                    rounded
                    :color="statusColor(request?.status)"
                    text-color="white"
                    class="status-badge"
                  >
                    {{ request?.status || "-" }}
                  </q-badge>
                </div>
              </div>
            </q-card>
          </div>

          <div class="col-12 col-md-6">
            <q-card flat bordered class="info-card">
              <q-card-section class="card-title-row">
                <q-icon name="person" color="primary" />
                <div class="text-weight-bold">Empleado</div>
              </q-card-section>

              <q-separator />

              <q-list dense>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Nombre</q-item-label>
                    <q-item-label>{{ val(request?.user?.name) }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Email</q-item-label>
                    <q-item-label>{{ val(request?.user?.email) }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="request?.user?.department?.name">
                  <q-item-section>
                    <q-item-label caption>Departamento</q-item-label>
                    <q-item-label>{{ val(request?.user?.department?.name) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>

          <div class="col-12 col-md-6">
            <q-card flat bordered class="info-card">
              <q-card-section class="card-title-row">
                <q-icon
                  :name="request?.category === 'VACACIONES' ? 'beach_access' : 'assignment'"
                  color="primary"
                />
                <div class="text-weight-bold">Solicitud</div>
              </q-card-section>

              <q-separator />

              <q-list dense>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Tipo</q-item-label>
                    <q-item-label>{{ val(request?.permissionType?.name) }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
  <q-item-section>
    <q-item-label caption>Solicitada el</q-item-label>
    <q-item-label>
      {{ formatDateTime(request?.createdAt) }}
    </q-item-label>
  </q-item-section>
</q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Categoría</q-item-label>
                    <q-item-label>{{ val(request?.category) }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Fechas</q-item-label>
                    <q-item-label>
                      {{ formatDate(request?.startDate) }} -
                      {{ formatDate(request?.endDate) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Duración</q-item-label>
                    <q-item-label>{{ durationText(request) }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="request?.startTime || request?.endTime">
                  <q-item-section>
                    <q-item-label caption>Horario</q-item-label>
                    <q-item-label>
                      {{ val(request?.startTime) }} - {{ val(request?.endTime) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>

          <div class="col-12">
            <q-card flat bordered class="text-card">
              <q-card-section class="card-title-row justify-between">
                <div class="row items-center q-gutter-sm">
                  <q-icon name="description" color="primary" />
                  <div class="text-weight-bold">Motivo</div>
                </div>

                <q-btn
                  v-if="request?.reason"
                  flat
                  round
                  dense
                  icon="content_copy"
                  color="grey-8"
                  @click="copyToClipboard(request.reason)"
                />
              </q-card-section>

              <q-separator />

              <q-card-section class="pre-wrap">
                {{ val(request?.reason) }}
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12">
            <q-card flat bordered class="text-card">
              <q-card-section class="card-title-row justify-between">
                <div class="row items-center q-gutter-sm">
                  <q-icon name="comment" color="primary" />
                  <div class="text-weight-bold">Comentario</div>
                </div>

                <q-btn
                  v-if="request?.comment"
                  flat
                  round
                  dense
                  icon="content_copy"
                  color="grey-8"
                  @click="copyToClipboard(request.comment)"
                />
              </q-card-section>

              <q-separator />

              <q-card-section class="pre-wrap">
                {{ val(request?.comment) }}
              </q-card-section>
            </q-card>
          </div>

          <div v-if="request?.vacationBalance" class="col-12">
            <q-banner rounded class="bg-green-1 text-green-10">
              <template #avatar>
                <q-icon name="beach_access" />
              </template>
              Esta solicitud está conectada al balance de vacaciones del empleado.
            </q-banner>
          </div>
        </div>

        <div v-else class="text-grey-7 q-pa-md">
          No hay información para mostrar.
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import moment from "moment";
import { useQuasar } from "quasar";

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  request: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue"]);

const $q = useQuasar();

const closeDialog = () => {
  emit("update:modelValue", false);
};

const val = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const initials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const formatDate = (value) => {
  if (!value) return "-";

  return moment(value).format("YYYY/MM/DD");
};

const formatDateTime = (value) => {
  if (!value) return "-";

  return moment(value).format("YYYY/MM/DD hh:mm A");
};

const durationText = (row) => {
  const days = Number(row?.totalDays || 0);

  if (days >= 1) {
    return `${days} día(s)`;
  }

  if (row?.totalMinutes != null) {
    const minutes = Number(row.totalMinutes || 0);
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return `${hours}h ${remaining}m`;
  }

  const totalHours = Number(row?.totalHour ?? row?.totlaHour ?? 0) || 0;
  const minutes = Math.round(totalHours * 60);
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return `${hours}h ${remaining}m`;
};

const statusColor = (status) => {
  const value = String(status || "").toUpperCase();

  const map = {
    PENDIENTE: "orange-8",
    COMENTADA: "warning",
    EDITADA: "primary",
    MODIFICADA: "purple-7",
    RECHAZADA: "negative",
    APROBADA: "secondary",
    ACEPTADA: "green-13",
    "NO ACEPTADA": "red-14",
    FINALIZADA: "green-10",
  };

  return map[value] || "grey-7";
};

const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(String(text || ""))
    .then(() => {
      $q.notify({
        message: "Texto copiado",
        color: "primary",
        icon: "content_copy",
        position: "top-right",
      });
    })
    .catch(() => {
      $q.notify({
        message: "Error al copiar",
        color: "negative",
        icon: "error",
      });
    });
};
</script>

<style scoped>
.details-dialog {
  width: 920px;
  max-width: 96vw;
  max-height: 92vh;
  border-radius: 22px;
  overflow: hidden;
}

.dialog-header {
  min-height: 78px;
  padding: 16px 20px;
}

.dialog-icon {
  width: 46px;
  height: 46px;
  min-width: 46px;
  margin-right: 12px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.dialog-title {
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.05;
}

.dialog-subtitle {
  margin-top: 4px;
  font-size: 0.78rem;
  opacity: 0.86;
}

.dialog-body {
  max-height: calc(92vh - 78px);
  overflow-y: auto;
  padding: 18px;
  background: #f8fafc;
}

.hero-card,
.info-card,
.text-card {
  border-radius: 20px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.hero-card {
  padding: 16px;
}

.employee-avatar {
  color: white;
  font-weight: 900;
  background: linear-gradient(135deg, #1a2436, #1964a2);
}

.employee-name {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.employee-meta {
  color: #64748b;
  font-size: 0.8rem;
  margin-top: 2px;
}

.status-badge {
  padding: 7px 12px;
  font-weight: 900;
}

.card-title-row {
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pre-wrap {
  white-space: pre-wrap;
}
</style>