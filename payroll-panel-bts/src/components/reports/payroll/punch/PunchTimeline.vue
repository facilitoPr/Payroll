<template>
  <q-card flat bordered class="q-px-md">
    <q-card-section>
      <div class="row justify-between items-start">
        <div class="text-subtitle2 text-grey-7 q-mb-sm">
          Registro de ponches
        </div>
        <q-btn
          color="primary"
          unelevated
          icon="add"
          label="Agregar ponche"
          @click="$emit('add')"
        />
      </div>

      <div>
        <div class="row items-start">
          <q-timeline color="primary" v-if="punches.length > 0">
            <q-timeline-entry
              v-for="(p, idx) in punches"
              :key="p._id || idx"
              :icon="stepMeta(p.edit?.punchStep ?? p.punchStep).icon"
              :color="stepMeta(p.edit?.punchStep ?? p.punchStep).color"
              :title="stepMeta(p.edit?.punchStep ?? p.punchStep).label"
              :subtitle="formatTime(p.edit?.timestamp ?? p.timestamp)"
            >
              <div class="column">
                <!-- MODO LECTURA -->
                <div v-if="!p._editing" class="row items-center q-gutter-x-sm">
                  <q-badge outline :color="stepMeta(p.punchStep).color">
                    Esperado: {{ p.expectedTime || "—" }}
                  </q-badge>

                  <q-badge :color="p.isLate ? 'negative' : 'positive'" outline>
                    {{ lateLabel(p) }}
                  </q-badge>

                  <q-badge
                    v-if="p.img"
                    color="grey-8"
                    outline
                    class="cursor-pointer"
                    @click="$emit('preview-image', p.img)"
                  >
                    Ver captura
                  </q-badge>

                  <q-space />

                  <q-btn
                    dense
                    flat
                    icon="edit"
                    color="primary"
                    @click="$emit('start-edit', p)"
                  />
                  <q-btn
                    dense
                    flat
                    icon="delete"
                    color="negative"
                    :loading="deletingMap?.[p._id]"
                    @click="$emit('delete-punch', p)"
                  />
                </div>

                <!-- MODO EDICIÓN -->
                <div
                  v-else
                  class="q-pa-md q-gutter-sm bg-grey-2 rounded-borders"
                >
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-4">
                      <q-select
                        v-model="p.edit.punchStep"
                        :options="punchStepOptions"
                        option-label="label"
                        option-value="value"
                        label="Paso"
                        dense
                        outlined
                        clearable
                        emit-value
                      />
                    </div>

                    <div class="col-6 col-md-4">
                      <q-input
                        v-model="p.editTime"
                        label="Hora real"
                        dense
                        outlined
                        mask="fulltime"
                        fill-mask="0"
                        :rules="[(val) => !!val || 'Requerido']"
                        hint="HH:MM:SS"
                      >
                        <template #append>
                          <q-icon name="access_time" class="cursor-pointer">
                            <q-popup-proxy
                              cover
                              transition-show="scale"
                              transition-hide="scale"
                            >
                              <q-time v-model="p.editTime" />
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>

                    <div class="col-12 col-md-4">
                      <q-toggle
                        v-model="p.edit.isLate"
                        color="negative"
                        label="Tarde"
                      />
                    </div>

                    <!-- Imagen -->
                    <div class="col-12">
                      <div class="row items-center q-gutter-sm">
                        <q-badge
                          v-if="p.img"
                          color="grey-8"
                          outline
                          class="cursor-pointer"
                          @click="$emit('preview-image', p.img)"
                        >
                          Ver imagen actual
                        </q-badge>

                        <q-btn
                          v-if="p.img"
                          dense
                          outline
                          icon="delete"
                          color="negative"
                          label="Eliminar imagen"
                          @click="$emit('remove-image', p)"
                        />

                        <q-file
                          v-model="p.editImageFile"
                          dense
                          outlined
                          label="Reemplazar imagen (opcional)"
                          accept="image/*"
                          @update:model-value="
                            (f) => f && $emit('replace-image', p, f)
                          "
                          style="min-width: 260px"
                        >
                          <template #prepend>
                            <q-icon name="image" />
                          </template>
                        </q-file>

                        <q-badge
                          v-if="uploadingMap?.[p._id]"
                          color="primary"
                          outline
                        >
                          Subiendo imagen...
                        </q-badge>
                      </div>
                    </div>
                  </div>

                  <div class="row justify-between q-gutter-sm q-mt-sm">
                    <q-btn
                      dense
                      flat
                      icon="delete"
                      color="negative"
                      label="Eliminar ponche"
                      :loading="deletingMap?.[p._id]"
                      @click="$emit('delete-punch', p)"
                    />

                    <div class="row q-gutter-sm">
                      <q-btn
                        dense
                        outline
                        icon="cancel"
                        color="grey-8"
                        label="Cancelar"
                        @click="$emit('cancel-edit', p)"
                        rounded
                        class="q-px-md"
                      />
                      <q-btn
                        dense
                        color="primary"
                        icon="save"
                        label="Guardar"
                        :loading="savingMap?.[p._id]"
                        @click="$emit('save-edit', p)"
                        rounded
                        class="q-px-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </q-timeline-entry>
          </q-timeline>

          <div class="row items-center q-gutter-md" v-else>
            <q-icon name="info" size="32px" color="primary" />
            <div class="col">
              <div class="text-subtitle1 text-weight-medium">
                No hay ponches registrados para este día
              </div>
              <div class="text-caption text-grey-7">
                Puedes agregar un ponche manualmente si es necesario.
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  punches: { type: Array, default: () => [] },
  punchStepOptions: { type: Array, default: () => [] },
  savingMap: { type: Object, default: () => ({}) },
  deletingMap: { type: Object, default: () => ({}) },
  uploadingMap: { type: Object, default: () => ({}) },
  stepMeta: { type: Function, required: true },
  lateLabel: { type: Function, required: true },
  formatTime: { type: Function, required: true },
});

defineEmits([
  "preview-image",
  "start-edit",
  "cancel-edit",
  "save-edit",
  "delete-punch",
  "remove-image",
  "replace-image",
  "add",
]);
</script>
