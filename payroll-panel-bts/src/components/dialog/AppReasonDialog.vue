<template>
  <AppBaseDialog
    :model-value="modelValue"
    :title="title"
    :subtitle="subtitle"
    :icon="icon"
    :loading="loading"
    :loading-label="loadingLabel"
    :width="width"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="reason-dialog-content">
      <q-banner
        v-if="message"
        rounded
        class="reason-banner"
        :class="bannerClass"
      >
        <template #avatar>
          <q-icon :name="bannerIcon" :color="bannerIconColor" />
        </template>

        {{ message }}
      </q-banner>

      <div class="form-section">
        <div class="form-section-header">
          <div>
            <div class="form-section-title">
              {{ reasonTitle }}
            </div>
            <div class="form-section-subtitle">
              {{ reasonSubtitle }}
            </div>
          </div>
        </div>

        <q-input
          v-model="reason"
          type="textarea"
          outlined
          dense
          rounded
          autogrow
          color="primary"
          :label="reasonLabel"
          :placeholder="reasonPlaceholder"
          :disable="loading"
        />
      </div>
    </div>

    <template #actions>
      <q-btn
        flat
        no-caps
        color="negative"
        icon="cancel"
        label="Cancelar"
        class="dialog-action-btn"
        :disable="loading"
        @click="close"
      />

      <q-btn
        unelevated
        no-caps
        :color="confirmColor"
        :icon="confirmIcon"
        :label="confirmLabel"
        class="dialog-action-btn"
        :loading="loading"
        :disable="!canConfirm"
        @click="confirm"
      />
    </template>
  </AppBaseDialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import AppBaseDialog from "./AppBaseDialog.vue";


const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "Confirmar acción" },
  subtitle: { type: String, default: "Registra una nota para auditoría." },
  icon: { type: String, default: "help" },

  message: { type: String, default: "" },

  reasonTitle: { type: String, default: "Nota de auditoría" },
  reasonSubtitle: {
    type: String,
    default: "Esta nota quedará registrada en el cierre.",
  },
  reasonLabel: { type: String, default: "Motivo" },
  reasonPlaceholder: {
    type: String,
    default: "Escribe el motivo de esta acción...",
  },

  confirmLabel: { type: String, default: "Confirmar" },
  confirmIcon: { type: String, default: "check" },
  confirmColor: { type: String, default: "primary" },

  loading: { type: Boolean, default: false },
  loadingLabel: { type: String, default: "Procesando..." },

  requireReason: { type: Boolean, default: true },
  minReasonChars: { type: Number, default: 3 },

  width: { type: String, default: "620px" },

  tone: {
    type: String,
    default: "info", // info | warning | negative | positive
  },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const reason = ref("");

const canConfirm = computed(() => {
  if (!props.requireReason) return true;

  return String(reason.value || "").trim().length >= props.minReasonChars;
});

const bannerClass = computed(() => {
  const map = {
    info: "bg-blue-1 text-blue-grey-9",
    warning: "bg-orange-1 text-orange-10",
    negative: "bg-red-1 text-red-10",
    positive: "bg-green-1 text-green-10",
  };

  return map[props.tone] || map.info;
});

const bannerIcon = computed(() => {
  const map = {
    info: "info",
    warning: "warning",
    negative: "error",
    positive: "check_circle",
  };

  return map[props.tone] || "info";
});

const bannerIconColor = computed(() => {
  const map = {
    info: "primary",
    warning: "orange",
    negative: "negative",
    positive: "positive",
  };

  return map[props.tone] || "primary";
});

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      reason.value = "";
    }
  },
);

const close = () => {
  emit("update:modelValue", false);
};

const confirm = () => {
  if (!canConfirm.value) return;

  emit("confirm", String(reason.value || "").trim());
};
</script>

<style scoped>
.reason-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reason-banner {
  border-radius: 18px;
  font-weight: 600;
}

.form-section {
  padding: 16px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.form-section-header {
  margin-bottom: 14px;
}

.form-section-title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.form-section-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.dialog-action-btn {
  border-radius: 999px;
  padding-left: 18px;
  padding-right: 18px;
  font-weight: 800;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}
</style>