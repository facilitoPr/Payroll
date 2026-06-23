<template>
  <div class="image-upload-card">
    <div class="image-upload-top">
      <div class="image-upload-title">
        {{ title }}
      </div>

      <q-btn
        v-if="removed"
        flat
        dense
        rounded
        no-caps
        color="primary"
        icon="restore"
        label="Restaurar"
        class="image-action-btn"
        @click="emit('restore')"
      />

      <q-btn
        v-else-if="previewUrl"
        flat
        dense
        rounded
        no-caps
        color="negative"
        icon="delete"
        label="Eliminar actual"
        class="image-action-btn"
        @click="emit('remove')"
      />
    </div>

    <div v-if="removed" class="image-upload-removed">
      <q-icon name="delete" size="34px" />
      <span>Esta imagen se eliminará al guardar</span>
    </div>

    <q-img
      v-else-if="previewUrl"
      :src="previewUrl"
      :alt="title"
      :fit="fit || 'cover'"
      class="image-upload-preview"
    />

    <div v-else class="image-upload-empty">
      <q-icon name="image" size="34px" />
      <span>Sin imagen</span>
    </div>

    <div class="image-upload-fields">
      <q-input
        :model-value="url"
        outlined
        dense
        clearable
        color="primary"
        :label="urlLabel"
        class="rounded-input"
        :disable="removed"
        @update:model-value="emit('update:url', $event || '')"
      >
        <template #prepend>
          <q-icon name="link" />
        </template>
      </q-input>

      <q-file
        :model-value="file"
        outlined
        dense
        clearable
        color="primary"
        accept="image/*"
        :label="fileLabel"
        class="rounded-input"
        :disable="removed"
        @update:model-value="emit('update:file', $event || null)"
      >
        <template #prepend>
          <q-icon name="upload" />
        </template>

        <template #append>
          <q-icon name="image" />
        </template>
      </q-file>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  urlLabel: {
    type: String,
    default: "URL de imagen",
  },
  fileLabel: {
    type: String,
    default: "Subir imagen",
  },
  url: {
    type: String,
    default: "",
  },
  file: {
    type: [File, Object, null],
    default: null,
  },
  previewUrl: {
    type: String,
    default: "",
  },
  removed: {
    type: Boolean,
    default: false,
  },
  fit: {
    type: String,
    default: "cover"
  }
});

const emit = defineEmits(["update:url", "update:file", "remove", "restore"]);
</script>

<style scoped>
.image-upload-card {
  padding: 14px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.1);
}

.image-upload-top {
  min-height: 32px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.image-upload-title {
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.image-action-btn {
  font-size: 0.72rem;
  font-weight: 800;
}

.image-upload-preview {
  width: 100%;
  height: 180px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  margin-bottom: 12px;
  background: #f8fafc;
  overflow: hidden;
}

.image-upload-empty,
.image-upload-removed {
  height: 180px;
  border-radius: 16px;
  margin-bottom: 12px;
  display: grid;
  place-items: center;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px dashed rgba(15, 23, 42, 0.16);
  font-size: 0.86rem;
  font-weight: 700;
  text-align: center;
}

.image-upload-removed {
  color: #c10015;
  background: rgba(193, 0, 21, 0.04);
  border-color: rgba(193, 0, 21, 0.18);
}

.image-upload-empty span,
.image-upload-removed span {
  display: block;
}

.image-upload-fields {
  display: grid;
  gap: 10px;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
}

@media (max-width: 768px) {
  .image-upload-preview,
  .image-upload-empty,
  .image-upload-removed {
    height: 150px;
  }
}
</style>