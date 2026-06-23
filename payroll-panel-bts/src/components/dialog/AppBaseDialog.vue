<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="persistent"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card
      class="app-base-dialog column no-wrap"
      :style="{
        width,
        maxWidth,
      }"
    >
      <q-inner-loading
        :showing="loading"
        :label="loadingLabel"
        label-class="text-primary"
        label-style="font-size: 1.05em"
        class="z-max"
      />

      <q-card-section
        class="app-dialog-header bg-primary row items-center justify-between"
      >
        <div class="row items-center no-wrap text-white">
          <div class="app-dialog-icon">
            <q-icon :name="icon" size="30px" color="white" />
          </div>

          <div>
            <div class="app-dialog-title">
              {{ title }}
            </div>

            <div v-if="subtitle" class="app-dialog-subtitle">
              {{ subtitle }}
            </div>
          </div>
        </div>

        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          :disable="loading"
          @click="emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="app-dialog-body" :class="bodyClass">
        <slot />
      </q-card-section>

      <template v-if="$slots.actions">
        <q-separator />

        <q-card-actions align="right" class="app-dialog-actions">
          <slot name="actions" />
        </q-card-actions>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  icon: { type: String, default: "info" },
  loading: { type: Boolean, default: false },
  loadingLabel: { type: String, default: "Procesando..." },
  persistent: { type: Boolean, default: true },
  width: { type: String, default: "720px" },
  maxWidth: { type: String, default: "96vw" },
  bodyClass: { type: [String, Array, Object], default: "" },
});

const emit = defineEmits(["update:modelValue"]);
</script>

<style scoped>
.app-base-dialog {
  max-height: 92vh;
  border-radius: 22px;
  overflow: hidden;
}

.app-dialog-header {
  min-height: 78px;
  padding: 16px 20px;
}

.app-dialog-icon {
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

.app-dialog-title {
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.05;
}

.app-dialog-subtitle {
  margin-top: 4px;
  font-size: 0.78rem;
  opacity: 0.86;
}

.app-dialog-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(92vh - 154px);
  padding: 18px;
  background: #f8fafc;
}

.app-dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
}

@media (max-width: 768px) {
  .app-base-dialog {
    width: 96vw !important;
    max-height: 94vh;
  }

  .app-dialog-body {
    max-height: calc(94vh - 154px);
    padding: 12px;
  }
}
</style>