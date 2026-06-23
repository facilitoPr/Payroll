<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="action-dialog">
      <q-inner-loading
        :showing="saving"
        label="Procesando solicitud..."
        label-class="text-primary"
        label-style="font-size: 1.05em"
      />

      <q-card-section
        class="dialog-header row items-center justify-between"
        :class="`bg-${actionMeta.color || 'primary'}`"
      >
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon :name="actionMeta.icon || 'task_alt'" size="28px" />
          </div>

          <div>
            <div class="dialog-title">
              {{ actionMeta.title || "Actualizar solicitud" }}
            </div>
            <div class="dialog-subtitle">
              {{ actionMeta.subtitle || "Confirma la acción a realizar." }}
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          color="white"
          icon="close"
          :disable="saving"
          @click="closeDialog"
        />
      </q-card-section>

      <q-card-section class="dialog-body">
        <q-card flat bordered class="request-summary q-mb-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="summary-label">Empleado</div>
              <div class="summary-value">
                {{ request?.user?.name || "-" }}
              </div>
              <div class="summary-caption">
                {{ request?.user?.email || "" }}
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="summary-label">Solicitud</div>
              <div class="summary-value">
                {{ request?.permissionType?.name || "-" }}
              </div>
              <div class="summary-caption">
                {{ request?.category || "-" }} · {{ request?.status || "-" }}
              </div>
            </div>

            <div class="col-12">
              <div class="summary-label">Fechas</div>
              <div class="summary-value">
                {{ formatDate(request?.startDate) }} -
                {{ formatDate(request?.endDate) }}
              </div>
            </div>
          </div>
        </q-card>

        <q-banner
          rounded
          :class="actionMeta.bannerClass || 'bg-blue-1 text-primary'"
          class="q-mb-md"
        >
          <template #avatar>
            <q-icon :name="actionMeta.icon || 'info'" />
          </template>
          {{ actionMeta.message || "Esta acción actualizará el estado de la solicitud." }}
        </q-banner>

        <div class="field-label" :class="{ required: commentRequired }">
          Comentario
        </div>

        <q-input
          v-model="comment"
          outlined
          rounded
          dense
          type="textarea"
          autogrow
          color="primary"
          :label="commentRequired ? 'Comentario obligatorio' : 'Comentario opcional'"
          placeholder="Escribe una nota para el empleado..."
        />
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          rounded
          no-caps
          color="negative"
          icon="close"
          label="Cancelar"
          :disable="saving"
          @click="closeDialog"
        />

        <q-btn
          unelevated
          rounded
          no-caps
          :color="actionMeta.color || 'primary'"
          :icon="actionMeta.icon || 'save'"
          :label="actionMeta.confirmLabel || 'Confirmar'"
          :loading="saving"
          :disable="saveDisabled"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import moment from "moment";
import { Notify } from "quasar";
import { computed, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  request: {
    type: Object,
    default: null,
  },
  action: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "saved"]);

const saving = ref(false);
const comment = ref("");

const actionMeta = computed(() => {
  return props.action || {};
});

const commentRequired = computed(() => {
  return Boolean(actionMeta.value.requiresComment);
});

const saveDisabled = computed(() => {
  if (saving.value) return true;
  if (!props.request?._id) return true;
  if (!actionMeta.value.code) return true;

  if (commentRequired.value && !String(comment.value || "").trim()) {
    return true;
  }

  return false;
});

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      comment.value = "";
    }
  },
);

const closeDialog = () => {
  if (saving.value) return;

  emit("update:modelValue", false);
};

const formatDate = (value) => {
  if (!value) return "-";

  return moment(value).format("YYYY/MM/DD");
};

const submit = async () => {
  if (!props.request?._id || !actionMeta.value.code) return;

  saving.value = true;

  try {
    const payload = {
      action: actionMeta.value.code,
      comment: String(comment.value || "").trim(),
      previousData: { ...props.request },
      status: props.request.status,
    };

    const resp = await methodsHttp.postApi(
      `permission/requests/${props.request._id}/status`,
      payload,
    );

    if (resp?.ok) {
      Notify.create({
        type: "positive",
        message: resp.mensaje || "Solicitud actualizada correctamente",
      });

      emit("saved", resp);
      closeDialog();
      return;
    }

    Notify.create({
      type: "negative",
      message: resp?.mensaje || "No se pudo actualizar la solicitud",
    });
  } catch (error) {
    console.error("submit action error:", error);

    Notify.create({
      type: "negative",
      message: "Error actualizando la solicitud",
    });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.action-dialog {
  width: 720px;
  max-width: 94vw;
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
  padding: 18px;
  background: #f8fafc;
}

.request-summary {
  border-radius: 18px;
  padding: 14px;
  background: white;
}

.summary-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-value {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
  margin-top: 4px;
}

.summary-caption {
  color: #64748b;
  font-size: 0.78rem;
  margin-top: 2px;
}

.field-label {
  margin-bottom: 6px;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-label.required::before {
  content: "* ";
  color: #e53935;
}

.dialog-actions {
  padding: 14px 18px;
  background: white;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}
</style>