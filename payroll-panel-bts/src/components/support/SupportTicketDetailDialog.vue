<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    persistent
  >
    <q-card class="ticket-detail-dialog">
      <!-- HEADER -->
      <q-card-section class="dialog-header">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center q-gutter-md no-wrap">
            <div class="header-icon-box">
              <q-icon size="30px" name="confirmation_number" color="white" />
            </div>

            <div class="header-text">
              <div class="text-h6 text-weight-bold text-white">
                Detalle del ticket
              </div>
              <div class="text-caption text-white header-caption">
                Información completa de la solicitud de soporte
              </div>
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            @click="emit('update:modelValue', false)"
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- LOADING -->
      <q-card-section v-if="loading" class="q-pa-lg">
        <div class="q-gutter-md">
          <q-skeleton type="text" width="45%" />
          <q-skeleton type="text" width="30%" />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-skeleton type="rect" height="82px" class="rounded-borders" />
            </div>
            <div class="col-12 col-sm-6">
              <q-skeleton type="rect" height="82px" class="rounded-borders" />
            </div>
          </div>

          <q-skeleton type="rect" height="110px" class="rounded-borders" />
          <q-skeleton type="rect" height="110px" class="rounded-borders" />
          <q-skeleton type="rect" height="90px" class="rounded-borders" />
        </div>
      </q-card-section>

      <!-- CONTENT -->
      <q-card-section
        v-else-if="ticket"
        class="dialog-body q-pa-lg"
      >
        <!-- RESUMEN -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-md-4">
            <div class="summary-card">
              <div class="summary-label">Estado</div>
              <div class="q-mt-xs">
                <q-chip
                  dense
                  :color="getSupportTicketStatusColor(ticket.status)"
                  text-color="white"
                  icon="info"
                >
                  {{ getSupportTicketStatusLabel(ticket.status) }}
                </q-chip>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-4">
            <div class="summary-card">
              <div class="summary-label">Prioridad</div>
              <div class="q-mt-xs">
                <q-chip
                  dense
                  :color="getSupportTicketPriorityColor(ticket.priority)"
                  text-color="white"
                  icon="flag"
                >
                  {{ getSupportTicketPriorityLabel(ticket.priority) }}
                </q-chip>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-4">
            <div class="summary-card">
              <div class="summary-label">Correo enviado</div>
              <div class="summary-value">
                {{ ticket.emailSent ? "Sí" : "No" }}
              </div>
            </div>
          </div>
        </div>

        <!-- INFORMACIÓN GENERAL -->
        <div class="section-card q-mb-lg">
          <div class="section-title">
            <q-icon name="article" size="18px" class="q-mr-sm" />
            Información general
          </div>

          <div class="row q-col-gutter-md q-mt-sm">
            <div class="col-12">
              <q-input
                outlined
                dense
                readonly
                stack-label
                label="Título"
                :model-value="ticket.title || 'Sin título'"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                dense
                readonly
                stack-label
                label="Fecha de creación"
                :model-value="formatDate(ticket.createdAt)"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                dense
                readonly
                stack-label
                label="Correo enviado"
                :model-value="ticket.emailSent ? 'Sí' : 'No'"
              />
            </div>

            <div class="col-12">
              <q-input
                outlined
                dense
                readonly
                stack-label
                type="textarea"
                autogrow
                label="Descripción"
                :model-value="ticket.description || 'Sin descripción'"
              />
            </div>
          </div>
        </div>

        <!-- RESPUESTA -->
        <div v-if="ticket.responseMessage" class="section-card response-card q-mb-lg">
          <div class="section-title">
            <q-icon name="reply" size="18px" class="q-mr-sm" />
            Respuesta
          </div>

          <div class="q-mt-sm">
            <q-input
              outlined
              dense
              readonly
              stack-label
              type="textarea"
              autogrow
              label="Mensaje de respuesta"
              :model-value="ticket.responseMessage"
            />
          </div>
        </div>

        <!-- EMPLEADO -->
        <div v-if="ticket.user" class="section-card">
          <div class="section-title">
            <q-icon name="person" size="18px" class="q-mr-sm" />
            Información del empleado
          </div>

          <div class="employee-box q-mt-md">
            <div class="row items-center q-col-gutter-md">
              <div class="col-auto">
                <q-avatar
                  size="52px"
                  color="primary"
                  text-color="white"
                  icon="person"
                />
              </div>

              <div class="col">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      outlined
                      dense
                      readonly
                      stack-label
                      label="Nombre"
                      :model-value="ticket.user.name || 'Sin nombre'"
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-input
                      outlined
                      dense
                      readonly
                      stack-label
                      label="Correo"
                      :model-value="ticket.user.email || 'Sin correo'"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- EMPTY -->
      <q-card-section v-else class="q-pa-xl text-center">
        <q-icon name="error_outline" size="42px" color="grey-5" />
        <div class="text-subtitle1 text-grey-7 q-mt-md">
          No hay información disponible para este ticket
        </div>
      </q-card-section>

      <q-separator />

      <!-- ACTIONS -->
      <q-card-actions align="right" class="q-pa-md dialog-actions">
        <q-btn
          flat
          rounded
          color="grey-7"
          label="Cerrar"
          @click="emit('update:modelValue', false)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import {
  getSupportTicketPriorityColor,
  getSupportTicketPriorityLabel,
  getSupportTicketStatusColor,
  getSupportTicketStatusLabel,
} from "src/helpers/catalogs/ticket.catalog";

defineProps<{
  modelValue: boolean;
  loading?: boolean;
  ticket: any | null;
}>();

const emit = defineEmits(["update:modelValue"]);

const formatDate = (value?: string | null) => {
  if (!value) return "N/D";

  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};
</script>

<style scoped>
.ticket-detail-dialog {
  width: 100%;
  max-width: 940px;
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
}

.dialog-header {
  background: var(--q-primary);
  padding: 18px 22px;
}

.header-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-text {
  min-width: 0;
}

.header-caption {
  opacity: 0.92;
}

.dialog-body {
  background: #fafbfc;
}

.section-card {
  background: white;
  border: 1px solid #edf1f5;
  border-radius: 18px;
  padding: 18px;
}

.section-title {
  display: flex;
  align-items: center;
  color: var(--q-primary);
  font-size: 15px;
  font-weight: 700;
}

.summary-card {
  background: white;
  border: 1px solid #edf1f5;
  border-radius: 16px;
  padding: 16px;
  height: 100%;
}

.summary-label {
  font-size: 12px;
  color: #7b8794;
  font-weight: 600;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 15px;
  color: #1f2937;
  font-weight: 700;
}

.response-card {
  border-left: 4px solid var(--q-primary);
}

.employee-box {
  background: #f8fafc;
  border: 1px solid #edf1f5;
  border-radius: 16px;
  padding: 16px;
}

.dialog-actions {
  background: white;
}

:deep(.q-field__control) {
  border-radius: 14px;
  background: white;
}

:deep(.q-field--outlined .q-field__control:before) {
  border-color: #d8e1ea;
}

:deep(.q-field__label) {
  color: #6b7280;
  font-weight: 500;
}
</style>