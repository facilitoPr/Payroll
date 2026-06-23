<template>
  <q-dialog v-model="open" persistent>
    <q-card class="add-punch-card">
      <q-form ref="formRef" @submit.prevent="submit">
        <div class="dialog-header">
          <div class="header-decoration" />

          <div class="row items-start justify-between q-col-gutter-md header-content">
            <div class="col">
              <div class="header-title">
                <div class="header-icon">
                  <q-icon name="fingerprint" size="24px" />
                </div>

                <div>
                  <div class="text-h6 text-weight-bold">
                    Agregar ponche
                  </div>
                  <div class="text-caption">
                    Día: {{ dateString || "—" }}
                  </div>
                </div>
              </div>
            </div>

            <div class="col-auto">
              <q-btn
                round
                unelevated
                icon="close"
                class="close-btn"
                @click="open = false"
              >
                <q-tooltip>Cerrar</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <q-card-section class="q-pa-md">
          <div class="info-banner">
            <q-icon name="info" color="primary" size="20px" />
            <div>
              Selecciona el tipo de ponche y la hora real. La hora esperada e
              imagen son opcionales.
            </div>
          </div>

          <div class="row q-col-gutter-md q-mt-sm">
            <div class="col-12">
              <q-select
                v-model="form.punchStep"
                :options="filteredPunchStepOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                outlined
                dense
                label="Tipo de ponche"
                class="rounded-input"
                :rules="[(v) => !!v || 'El tipo de ponche es requerido']"
              >
                <template #prepend>
                  <q-icon name="checklist" color="primary" />
                </template>

                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-avatar
                        size="34px"
                        :color="getStepMeta(scope.opt?.value).color"
                        text-color="white"
                      >
                        <q-icon :name="getStepMeta(scope.opt?.value).icon" size="18px" />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-weight-bold">
                        {{ scope.opt?.label || scope.opt }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>

                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No hay pasos disponibles
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.time"
                label="Hora real"
                dense
                outlined
                mask="time"
                class="rounded-input"
                :rules="[(v) => !!v || 'La hora real es requerida']"
              >
                <template #prepend>
                  <q-icon name="access_time" color="primary" />
                </template>

                <template #append>
                  <q-icon name="schedule" class="cursor-pointer" color="primary">
                    <q-popup-proxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-time v-model="form.time" format24h>
                        <div class="row items-center justify-end q-pa-sm">
                          <q-btn v-close-popup label="Listo" color="primary" flat />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.expectedTime"
                label="Hora esperada"
                dense
                outlined
                mask="time"
                class="rounded-input"
                hint="Opcional"
              >
                <template #prepend>
                  <q-icon name="event_available" color="primary" />
                </template>

                <template #append>
                  <q-icon name="schedule" class="cursor-pointer" color="primary">
                    <q-popup-proxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-time v-model="form.expectedTime" format24h>
                        <div class="row items-center justify-end q-pa-sm">
                          <q-btn v-close-popup label="Listo" color="primary" flat />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-12">
              <q-file
                v-model="form.imageFile"
                label="Imagen del ponche"
                outlined
                dense
                accept="image/*"
                clearable
                class="rounded-input"
                hint="Opcional"
              >
                <template #prepend>
                  <q-icon name="image" color="primary" />
                </template>

                <template #append>
                  <q-icon
                    v-if="form.imageFile"
                    name="visibility"
                    color="primary"
                    class="cursor-pointer"
                    @click.stop="previewFile"
                  >
                    <q-tooltip>Vista previa</q-tooltip>
                  </q-icon>
                </template>
              </q-file>
            </div>

            <div v-if="selectedStepMeta" class="col-12">
              <div class="selected-step-card">
                <div
                  class="selected-step-icon"
                  :class="`selected-step-icon--${selectedStepMeta.key}`"
                >
                  <q-icon :name="selectedStepMeta.icon" size="22px" />
                </div>

                <div>
                  <div class="selected-step-title">
                    {{ selectedStepLabel }}
                  </div>
                  <div class="selected-step-subtitle">
                    Este ponche se registrará para el día
                    <b>{{ dateString || "—" }}</b>
                    a las
                    <b>{{ form.time || "—" }}</b>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="dialog-actions">
          <q-btn
            flat
            no-caps
            color="grey-8"
            label="Cancelar"
            class="cancel-btn"
            @click="open = false"
          />

          <q-btn
            color="primary"
            unelevated
            no-caps
            icon="save"
            label="Guardar ponche"
            class="save-btn"
            :loading="loading"
            type="submit"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <q-dialog v-model="preview.open">
    <q-card class="preview-card">
      <q-card-section class="row items-center justify-between">
        <div class="text-subtitle1 text-weight-bold">
          Vista previa
        </div>

        <q-btn
          dense
          flat
          round
          icon="close"
          @click="preview.open = false"
        />
      </q-card-section>

      <q-separator />

      <q-img
        :src="preview.src"
        style="width: 100%; max-height: 70vh"
        fit="contain"
      />
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  dateString: { type: String, default: "" },
  punchStepOptions: { type: Array, default: () => [] },
  currentStep: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const preview = ref({
  open: false,
  src: "",
});

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const form = reactive({
  punchStep: null,
  time: "",
  expectedTime: "",
  imageFile: null,
});

const stepMetaMap = {
  entrada: {
    key: "entrada",
    icon: "login",
    color: "primary",
    label: "Entrada",
  },
  salida_almuerzo: {
    key: "salida_almuerzo",
    icon: "restaurant",
    color: "orange",
    label: "Salida a almuerzo",
  },
  entrada_almuerzo: {
    key: "entrada_almuerzo",
    icon: "restaurant_menu",
    color: "indigo",
    label: "Entrada de almuerzo",
  },
  salida: {
    key: "salida",
    icon: "logout",
    color: "teal",
    label: "Salida",
  },
};

const filteredPunchStepOptions = computed(() => {
  const exclude = String(props.currentStep || "").trim();

  if (!exclude) return props.punchStepOptions;

  return (props.punchStepOptions || []).filter((option) => {
    const value = typeof option === "string" ? option : option?.value;
    return String(value) !== exclude;
  });
});

const selectedStepMeta = computed(() => {
  if (!form.punchStep) return null;

  return getStepMeta(form.punchStep);
});

const selectedStepLabel = computed(() => {
  if (!form.punchStep) return "Paso no seleccionado";

  const option = (props.punchStepOptions || []).find((item) => {
    const value = typeof item === "string" ? item : item?.value;
    return String(value) === String(form.punchStep);
  });

  return option?.label || selectedStepMeta.value?.label || form.punchStep;
});

watch(
  () => open.value,
  (value) => {
    if (value) {
      resetForm();
    }
  },
);

const resetForm = () => {
  form.punchStep = null;
  form.time = "";
  form.expectedTime = "";
  form.imageFile = null;

  preview.value = {
    open: false,
    src: "",
  };
};

const getStepMeta = (step) => {
  return (
    stepMetaMap[step] || {
      key: "default",
      icon: "fingerprint",
      color: "grey-7",
      label: step || "Ponche",
    }
  );
};

const previewFile = () => {
  if (!form.imageFile) return;

  const src = URL.createObjectURL(form.imageFile);

  preview.value = {
    open: true,
    src,
  };
};

const submit = async () => {
  const isValid = await formRef.value?.validate?.();

  if (!isValid) return;

  emit("submit", {
    punchStep: form.punchStep,
    time: form.time,
    expectedTime: form.expectedTime,
    imageFile: form.imageFile,
  });
};
</script>

<style scoped>
.add-punch-card {
  width: 560px;
  max-width: 95vw;
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
}

.dialog-header {
  position: relative;
  overflow: hidden;
  padding: 18px;
  background:
    radial-gradient(circle at top left, rgba(23, 141, 210, 0.16), transparent 34%),
    linear-gradient(135deg, #ffffff, #f8fafc);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.header-decoration {
  position: absolute;
  top: -70px;
  right: -80px;
  width: 210px;
  height: 210px;
  border-radius: 999px;
  background: rgba(23, 141, 210, 0.08);
  pointer-events: none;
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 16px;
  color: var(--q-primary);
  background: rgba(23, 141, 210, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn {
  width: 34px;
  height: 34px;
  min-height: 34px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.info-banner {
  padding: 11px 12px;
  border-radius: 16px;
  background: rgba(23, 141, 210, 0.06);
  border: 1px solid rgba(23, 141, 210, 0.12);
  color: #475569;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 0.82rem;
  font-weight: 600;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
  background: #ffffff;
}

.selected-step-card {
  padding: 13px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-step-icon {
  width: 46px;
  height: 46px;
  min-width: 46px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-step-icon--entrada {
  color: var(--q-primary);
  background: rgba(23, 141, 210, 0.1);
}

.selected-step-icon--salida_almuerzo {
  color: #ef6c00;
  background: rgba(251, 140, 0, 0.12);
}

.selected-step-icon--entrada_almuerzo {
  color: #3f51b5;
  background: rgba(63, 81, 181, 0.11);
}

.selected-step-icon--salida {
  color: #00897b;
  background: rgba(0, 137, 123, 0.11);
}

.selected-step-icon--default {
  color: #475569;
  background: rgba(100, 116, 139, 0.11);
}

.selected-step-title {
  color: #0f172a;
  font-weight: 900;
  line-height: 1.15;
}

.selected-step-subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.78rem;
}

.dialog-actions {
  padding: 14px 18px;
  background: #f8fafc;
}

.cancel-btn,
.save-btn {
  min-height: 40px;
  border-radius: 12px;
  font-weight: 800;
}

.preview-card {
  width: 720px;
  max-width: 95vw;
  border-radius: 20px;
  overflow: hidden;
}

@media (max-width: 599px) {
  .add-punch-card {
    width: 96vw;
    border-radius: 20px;
  }

  .dialog-header {
    padding: 16px;
  }

  .selected-step-card {
    align-items: flex-start;
  }
}
</style>