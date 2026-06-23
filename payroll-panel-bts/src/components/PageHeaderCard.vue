<template>
  <q-card class="ph-card q-mb-md" flat bordered>
    <div class="ph-bg">
      <div class="row items-center justify-between q-col-gutter-md q-pa-md ph-row">
        <!-- Title -->
        <div class="col-12 col-md-5 ph-left">
          <div class="row items-center q-gutter-x-sm ph-titleRow">
            <q-avatar :size="avatarSize" class="ph-avatar">
              <q-icon :name="icon" size="24px" :color="iconColor" />
            </q-avatar>

            <div class="ph-text">
              <div class="text-h6 text-weight-bold ph-title">
                {{ title }}
              </div>
              <div v-if="subtitle" class="text-caption text-grey-7 ph-subtitle">
                {{ subtitle }}
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="col-12 col-md-7 ph-actionsWrap">
          <div class="ph-actions">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  icon: { type: String, required: true },
  iconColor: { type: String, default: "primary" },
  avatarSize: { type: String, default: "42px" },
});
</script>

<style scoped>
.ph-card {
  border-radius: 16px;
  overflow: hidden;
}

.ph-bg {
  background: linear-gradient(
    135deg,
    rgba(34, 44, 91, 0.08),
    rgba(0, 166, 231, 0.08)
  );
}

.ph-avatar {
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.ph-left {
  min-width: 0;
}

.ph-text {
  min-width: 0;
}

.ph-title,
.ph-subtitle {
  word-break: break-word;
}

/* ✅ Desktop: acciones organizadas, wrap bonito */
.ph-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

/* 👇 Anchos mínimos para que inputs/selects no se vean “aplastados” */
.ph-actions :deep(.q-field) {
  min-width: 200px;
}

.ph-actions :deep(.q-btn) {
  white-space: nowrap;
}

.ph-actions :deep(.header-search) { min-width: 260px; }
.ph-actions :deep(.header-field) { min-width: 200px; }

/* Si tienes muchos controles, esto evita que se peguen */
.ph-actions :deep(.q-field__control),
.ph-actions :deep(.q-btn) {
  border-radius: 12px;
}

/* ✅ Mobile: centrado + stack + ancho agradable */
@media (max-width: 700px) {
  .ph-row {
    text-align: center;
  }

  .ph-left {
    display: flex;
    justify-content: center;
  }

  /* icon arriba, texto abajo */
  .ph-titleRow {
    justify-content: center;
    flex-direction: column;
    gap: 8px;
  }

  .ph-text {
    text-align: center;
  }

  .ph-actionsWrap {
    display: flex;
    justify-content: center;
  }

  .ph-actions {
    justify-content: center;
    flex-direction: column;
    align-items: stretch;
    max-width: 520px; /* ✅ evita que se vea “gigante” en pantallas medianas */
  }

  .ph-actions :deep(.q-btn),
  .ph-actions :deep(.q-field) {
    width: 100%;
    min-width: unset; /* en mobile no queremos min-width */
  }
}
</style>
