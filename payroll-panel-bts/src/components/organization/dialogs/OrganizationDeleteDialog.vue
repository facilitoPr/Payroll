<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="delete-dialog">
      <q-card-section class="delete-header row items-start justify-between">
        <div class="row items-center q-gutter-sm">
          <q-avatar color="negative" text-color="white" :icon="icon" />

          <div>
            <div class="text-h6 text-weight-bold">
              {{ title }}
            </div>
            <div class="text-caption text-grey-7">
              Confirma esta acción antes de continuar.
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-7"
          :disable="loading"
          @click="close"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-lg">
        <div class="text-body2 text-grey-8">
          {{ message }}
        </div>

        <div v-if="itemName" class="delete-target q-mt-md">
          <q-icon name="info" color="negative" />
          <span>
            Se eliminará: <b>{{ itemName }}</b>
          </span>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          rounded
          color="grey-8"
          label="Cancelar"
          icon="close"
          class="dialog-btn"
          :disable="loading"
          @click="close"
        />

        <q-btn
          unelevated
          rounded
          color="negative"
          label="Eliminar"
          icon="delete"
          class="dialog-btn"
          :loading="loading"
          @click="emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "Eliminar registro",
  },
  message: {
    type: String,
    default: "Esta acción no se puede deshacer.",
  },
  itemName: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "warning",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const close = () => {
  emit("update:modelValue", false);
};
</script>

<style scoped>
.delete-dialog {
  width: 520px;
  max-width: 92vw;
  border-radius: 22px;
  overflow: hidden;
}

.delete-header {
  padding: 18px 20px;
  background: #fff;
}

.delete-target {
  border: 1px solid rgba(244, 67, 54, 0.25);
  background: rgba(244, 67, 54, 0.06);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialog-btn {
  text-transform: none;
  font-weight: 600;
  min-width: 120px;
}

@media (max-width: 600px) {
  .dialog-btn {
    width: 100%;
  }
}
</style>