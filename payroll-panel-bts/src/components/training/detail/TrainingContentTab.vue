<template>
  <q-card flat bordered class="rounded-card section-card">
    <q-card-section class="row items-center justify-between section-header">
      <div class="row items-center q-gutter-sm text-primary">
        <q-icon name="article" size="md" />
        <div class="text-h6 text-weight-bold">Bloques de contenido</div>
      </div>

      <q-btn
        color="primary"
        rounded
        unelevated
        icon="add"
        label="Agregar bloque"
        @click="$emit('add')"
      />
    </q-card-section>

    <q-separator />

    <q-card-section class="column q-gutter-md">
      <q-card
        v-for="block in contentBlocks"
        :key="block._id"
        flat
        bordered
        class="rounded-card item-card"
      >
        <q-card-section class="row items-start justify-between">
          <div class="col">
            <div class="row items-center q-gutter-sm">
              <q-chip dense color="primary" text-color="white">
                {{ block.type }}
              </q-chip>
              <div class="text-subtitle2 text-weight-bold">
                {{ block.title || "Bloque sin título" }}
              </div>
            </div>

            <div class="text-caption text-grey-7 q-mt-xs">
              Orden {{ block.order }}
            </div>

            <div class="text-body2 q-mt-sm" v-if="block.description">
              {{ block.description }}
            </div>

            <div class="q-mt-md" v-if="block.type === 'IMAGE' && block.url">
              <q-img
                :src="block.url"
                fit="cover"
                style="max-width: 240px; height: 150px; border-radius: 14px"
              />
            </div>

            <div class="q-mt-md" v-else-if="block.type === 'PDF' && block.url">
              <q-btn
                color="primary"
                outline
                rounded
                icon="picture_as_pdf"
                label="Abrir PDF"
                :href="block.url"
                target="_blank"
              />
            </div>

            <div class="q-mt-md" v-else-if="block.type === 'FILE' && block.url">
              <q-btn
                color="primary"
                outline
                rounded
                icon="attach_file"
                label="Abrir archivo"
                :href="block.url"
                target="_blank"
              />
            </div>

            <div class="q-mt-md" v-else-if="block.type === 'YOUTUBE' && block.url">
              <q-btn
                color="red"
                outline
                rounded
                icon="smart_display"
                label="Ver video"
                :href="block.url"
                target="_blank"
              />
            </div>

            <div class="text-body2 q-mt-sm" v-else-if="block.type === 'TEXT'">
              {{ block.content || "-" }}
            </div>
          </div>

          <div class="row q-gutter-sm">
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="secondary"
              @click="$emit('edit', block)"
            />
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              @click="$emit('remove', block)"
            />
          </div>
        </q-card-section>
      </q-card>

      <div v-if="!contentBlocks.length" class="empty-state">
        No hay bloques de contenido registrados.
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  contentBlocks: any[];
}>();

defineEmits(["add", "edit", "remove"]);
</script>

<style scoped>
.rounded-card {
  border-radius: 20px;
}

.section-card,
.item-card {
  background: white;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

.section-header {
  background: #fcfdff;
}

.empty-state {
  padding: 24px;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  text-align: center;
  color: #64748b;
  background: #fff;
}
</style>