<template>
  <div class="recruit-page q-pa-md">
    <div class="recruit-wrapper">
      <!-- HERO -->
      <div class="hero-card q-mb-md">
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="row items-center q-gutter-sm q-mb-sm">
              <div class="brand-pill row items-center q-gutter-xs">
                <q-icon name="work" size="18px" />
                <span class="text-caption text-weight-medium">
                  Portal de Reclutamiento
                </span>
              </div>

              <q-chip
                v-if="formMeta?.jobPosition?.name"
                dense
                outline
                color="primary"
                text-color="primary"
                icon="badge"
              >
                {{ formMeta.jobPosition.name }}
              </q-chip>
            </div>

            <div class="text-h4 text-weight-bold text-dark">
              {{ formMeta?.title || "Formulario de Reclutamiento" }}
            </div>

            <div
              v-if="formMeta?.description"
              class="text-body2 text-grey-7 q-mt-sm hero-description"
            >
              {{ formMeta.description }}
            </div>

            <div class="text-caption text-grey-6 q-mt-sm">
              Completa tu información con calma. Tus datos serán tratados de
              forma confidencial.
            </div>
          </div>

          <div class="col-12 col-md-auto">
            <div class="hero-side-card">
              <div class="text-caption text-grey-6">Estado</div>
              <div class="text-subtitle1 text-weight-bold">
                {{
                  loadingForm
                    ? "Cargando..."
                    : loadError
                    ? "No disponible"
                    : "Disponible"
                }}
              </div>

              <div class="q-mt-sm text-caption text-grey-6">Progreso</div>
              <div class="text-subtitle2 text-weight-medium">
                Paso {{ currentStepIndex + 1 }} de {{ stepsNames.length || 1 }}
              </div>

              <q-linear-progress
                class="q-mt-sm rounded-borders"
                size="8px"
                :value="progressValue"
                color="primary"
                track-color="blue-1"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN CARD -->
      <q-card flat bordered class="main-card q-pa-md q-pa-lg-md">
        <q-inner-loading :showing="loadingForm">
          <q-spinner color="primary" size="40px" />
        </q-inner-loading>

        <!-- ERROR -->
        <div v-if="!loadingForm && loadError" class="q-pa-md">
          <q-banner class="bg-red-1 text-red-9" rounded>
            <div class="row items-center q-gutter-sm">
              <q-icon name="error_outline" />
              <span>{{ loadError }}</span>
            </div>
          </q-banner>
        </div>

        <!-- EMPTY -->
        <div
          v-else-if="!loadingForm && !loadError && !stepsForForm.length"
          class="q-pa-md"
        >
          <q-banner class="bg-orange-1 text-orange-9" rounded>
            <div class="row items-center q-gutter-sm">
              <q-icon name="info" />
              <span>
                Este formulario no tiene campos configurados o no está
                disponible.
              </span>
            </div>
          </q-banner>
        </div>

        <!-- SUCCESS VIEW -->
        <div
          v-else-if="!loadingForm && !loadError && submitted"
          class="success-state"
        >
          <q-avatar
            size="72px"
            color="green-5"
            text-color="white"
            icon="check_circle"
          />
          <div class="text-h5 text-weight-bold q-mt-md">
            Solicitud enviada correctamente
          </div>
          <div class="text-body2 text-grey-7 q-mt-sm success-copy">
            Gracias, {{ lastSubmittedName || "candidato" }}. Nuestro equipo de
            reclutamiento revisará tu perfil y te contactará si avanzas al
            siguiente paso.
          </div>

          <div class="row justify-center q-gutter-sm q-mt-lg">
            <q-btn
              unelevated
              color="primary"
              label="Enviar otra solicitud"
              class="btn-primary-rounded"
              @click="resetToStart"
            />
          </div>
        </div>

        <!-- CONTENT -->
        <template
          v-else-if="!loadingForm && !loadError && stepsForForm.length"
        >
          <!-- REQUIREMENT DOC -->
          <q-banner
            v-if="formMeta?.requirementDoc?.url"
            class="req-banner q-mb-md"
            rounded
          >
            <div class="row items-center justify-between q-col-gutter-md">
              <div class="col">
                <div class="text-body2 text-weight-bold">
                  Requisitos del puesto
                </div>
                <div class="text-caption text-grey-8 q-mt-xs">
                  Te recomendamos revisar el documento antes de enviar tu
                  solicitud.
                </div>
              </div>

              <div class="col-12 col-sm-auto">
                <q-btn
                  unelevated
                  color="primary"
                  icon="open_in_new"
                  label="Ver requisitos"
                  class="btn-primary-rounded full-width-sm"
                  @click="openAsset(formMeta.requirementDoc.url)"
                />
              </div>
            </div>
          </q-banner>

          <!-- ATTACHMENTS -->
          <div
            v-if="documents.length || images.length"
            class="attachments-wrap q-mb-md"
          >
            <div class="row q-col-gutter-md">
              <!-- DOCS -->
              <div class="col-12 col-md-6">
                <q-card flat bordered class="attachment-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-sm q-mb-sm">
                      <q-avatar
                        icon="description"
                        color="blue-1"
                        text-color="primary"
                      />
                      <div>
                        <div class="text-subtitle2 text-weight-bold">
                          Documentos
                        </div>
                        <div class="text-caption text-grey-6">
                          Revisa los adjuntos del puesto.
                        </div>
                      </div>
                    </div>

                    <div v-if="!documents.length" class="text-caption text-grey-6">
                      No hay documentos.
                    </div>

                    <div v-else class="column q-gutter-sm">
                      <q-btn
                        v-for="(doc, idx) in documents"
                        :key="`${doc}-${idx}`"
                        flat
                        no-caps
                        class="doc-btn justify-start"
                        icon="attach_file"
                        :label="`Documento ${idx + 1}`"
                        @click="openAsset(doc)"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <!-- IMAGES -->
              <div class="col-12 col-md-6">
                <q-card flat bordered class="attachment-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-sm q-mb-sm">
                      <q-avatar
                        icon="image"
                        color="purple-1"
                        text-color="purple-8"
                      />
                      <div>
                        <div class="text-subtitle2 text-weight-bold">
                          Imágenes
                        </div>
                        <div class="text-caption text-grey-6">
                          Vista previa del material relacionado.
                        </div>
                      </div>
                    </div>

                    <div v-if="!images.length" class="text-caption text-grey-6">
                      No hay imágenes.
                    </div>

                    <div v-else class="image-grid">
                      <button
                        v-for="(img, idx) in images"
                        :key="`${img}-${idx}`"
                        type="button"
                        class="image-thumb-btn"
                        @click="previewImage(img)"
                      >
                        <q-img
                          :src="img"
                          :ratio="1"
                          class="image-thumb"
                          spinner-color="primary"
                        />
                      </button>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <!-- TOP PROGRESS -->
          <div class="progress-card q-mb-md">
            <div class="row items-center justify-between q-col-gutter-md">
              <div class="col-12 col-md">
                <div class="text-caption text-grey-6">
                  Paso {{ currentStepIndex + 1 }} de {{ stepsNames.length || 1 }}
                </div>
                <div class="text-subtitle1 text-weight-bold text-dark">
                  {{ currentStepTitle }}
                </div>
              </div>

              <div class="col-12 col-md-auto">
                <div class="text-caption text-grey-6 text-md-right">
                  Progreso
                </div>
                <div class="text-subtitle2 text-weight-bold text-md-right">
                  {{ Math.round(progressValue * 100) }}%
                </div>
              </div>
            </div>

            <q-linear-progress
              class="q-mt-sm rounded-borders"
              size="10px"
              :value="progressValue"
              color="primary"
              track-color="blue-1"
            />
          </div>

          <!-- FORM -->
          <q-form @submit.prevent="submitForm">
            <q-stepper
              v-model="step"
              animated
              flat
              header-nav
              alternative-labels
              color="primary"
              class="recruit-stepper"
            >
              <q-step
                v-for="s in stepsForForm"
                :key="s.name"
                :name="s.name"
                :title="s.title"
                :icon="s.icon"
                :done="isStepDone(s.name)"
              >
                <div class="step-body-card">
                  <div class="text-subtitle1 text-weight-bold text-dark">
                    {{ s.title }}
                  </div>
                  <div class="text-caption text-grey-6 q-mt-xs">
                    Completa los campos de esta sección antes de continuar.
                  </div>

                  <div class="row q-col-gutter-md q-mt-md">
                    <div
                      v-for="f in s.fields"
                      :key="f.key"
                      v-show="canShow(f)"
                      :class="fieldColClass(f.type)"
                    >
                      <!-- text / email / number -->
                      <q-input
                        v-if="['text', 'email', 'number'].includes(f.type)"
                        :model-value="form[f.key]"
                        @update:model-value="(val) => updateAnswer(f.key, val)"
                        outlined
                        dense
                        :type="
                          f.type === 'email'
                            ? 'email'
                            : f.type === 'number'
                            ? 'number'
                            : 'text'
                        "
                        :label="labelWithRequired(f)"
                        :placeholder="f.placeholder"
                        class="field-modern"
                        lazy-rules
                      />

                      <!-- date -->
                      <q-input
                        v-else-if="f.type === 'date'"
                        :model-value="form[f.key]"
                        @update:model-value="(val) => updateAnswer(f.key, val)"
                        outlined
                        dense
                        type="date"
                        :label="labelWithRequired(f)"
                        class="field-modern"
                      />

                      <!-- textarea -->
                      <q-input
                        v-else-if="f.type === 'textarea'"
                        :model-value="form[f.key]"
                        @update:model-value="(val) => updateAnswer(f.key, val)"
                        outlined
                        dense
                        autogrow
                        type="textarea"
                        :label="labelWithRequired(f)"
                        :placeholder="f.placeholder"
                        class="field-modern"
                      />

                      <!-- yesno / select -->
                      <q-select
                        v-else-if="['yesno', 'select'].includes(f.type)"
                        :model-value="form[f.key]"
                        @update:model-value="(val) => updateAnswer(f.key, val)"
                        outlined
                        dense
                        emit-value
                        map-options
                        option-label="label"
                        option-value="value"
                        :options="getFieldOptions(f)"
                        :label="labelWithRequired(f)"
                        class="field-modern"
                        clearable
                      />

                      <!-- file -->
                      <div v-else-if="f.type === 'file-select'" class="file-box">
                        <div class="text-body2 text-weight-medium text-dark">
                          {{ labelWithRequired(f) }}
                        </div>
                        <div class="text-caption text-grey-6 q-mt-xs">
                          {{ fileHint(f) }}
                        </div>

                        <q-file
                          class="q-mt-sm field-modern"
                          :model-value="fileFields[f.key] || null"
                          @update:model-value="
                            (val) => updateFileField(f.key, val)
                          "
                          outlined
                          dense
                          clearable
                          use-chips
                          :counter="true"
                          :accept="getFileAccept(f)"
                        >
                          <template #prepend>
                            <q-icon name="upload_file" />
                          </template>
                        </q-file>

                        <div
                          v-if="fileFields[f.key]"
                          class="row items-center q-gutter-sm q-mt-sm"
                        >
                          <q-chip
                            dense
                            color="blue-1"
                            text-color="primary"
                            icon="description"
                          >
                            {{ fileFields[f.key]?.name }}
                          </q-chip>

                          <q-btn
                            flat
                            dense
                            color="negative"
                            icon="close"
                            label="Quitar"
                            @click="removeFileField(f.key)"
                          />
                        </div>
                      </div>

                      <!-- checkbox -->
                      <q-checkbox
                        v-else-if="f.type === 'checkbox'"
                        :model-value="!!form[f.key]"
                        @update:model-value="(val) => updateAnswer(f.key, val)"
                        :label="labelWithRequired(f)"
                        class="modern-checkbox"
                      />
                    </div>
                  </div>
                </div>

                <q-stepper-navigation class="q-mt-lg nav-wrap">
                  <div class="text-caption text-grey-6">
                    Paso {{ getStepNumber(s.name) }} de
                    {{ stepsNames.length || 1 }}
                  </div>

                  <q-space />

                  <q-btn
                    v-if="hasPrevStep(s.name)"
                    flat
                    label="Atrás"
                    icon="arrow_back"
                    class="q-mr-sm btn-secondary-rounded"
                    @click="goPrevStep(s.name)"
                  />

                  <q-btn
                    v-if="hasNextStep(s.name)"
                    color="primary"
                    unelevated
                    label="Continuar"
                    icon-right="arrow_forward"
                    class="btn-primary-rounded"
                    @click="goNextStep(s.name)"
                  />

                  <q-btn
                    v-else
                    color="primary"
                    unelevated
                    label="Enviar solicitud"
                    icon-right="send"
                    type="submit"
                    :loading="submitting"
                    class="btn-primary-rounded"
                  />
                </q-stepper-navigation>
              </q-step>
            </q-stepper>
          </q-form>
        </template>
      </q-card>

      <!-- SUCCESS DIALOG -->
      <q-dialog v-model="successDialog">
        <q-card class="success-dialog-card">
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-avatar
                icon="check_circle"
                color="green-5"
                text-color="white"
              />
              <div>
                <div class="text-h6 text-weight-bold">Solicitud enviada</div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  Tu información ha sido registrada correctamente.
                </div>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-banner class="bg-green-1 text-green-9" rounded>
              Gracias, {{ lastSubmittedName || "candidato" }}. Nuestro equipo de
              reclutamiento revisará tu perfil y te contactará si avanzas al
              siguiente paso.
            </q-banner>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cerrar" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- IMAGE PREVIEW -->
      <q-dialog v-model="imagePreviewDialog" maximized>
        <q-card class="bg-black text-white">
          <q-bar class="bg-black text-white">
            <q-space />
            <q-btn dense flat icon="close" v-close-popup />
          </q-bar>
          <q-card-section class="fullscreen-image-wrap">
            <q-img
              v-if="selectedPreviewImage"
              :src="selectedPreviewImage"
              fit="contain"
              class="fullscreen-image"
            />
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { Notify } from "quasar";
import methodsHttp from "src/api/methodsHttp";

import {
  recruitmentSteps,
  optionsMap,
  initialRecruitmentForm,
} from "src/data/recruitmentFormData";

const route = useRoute();

const step = ref(1);
const successDialog = ref(false);
const imagePreviewDialog = ref(false);
const selectedPreviewImage = ref(null);

const loadingForm = ref(true);
const loadError = ref(null);
const submitting = ref(false);
const submitted = ref(false);

const formMeta = ref(null);
const lastSubmittedName = ref("");

const form = reactive({ ...initialRecruitmentForm });
const fileFields = reactive({});

const fieldConfigMap = computed(() => {
  const map = new Map();
  (formMeta.value?.fields || []).forEach((f, index) => {
    map.set(f.key, {
      ...f,
      _index: index,
    });
  });
  return map;
});

const activeFieldKeys = computed(() => {
  const keys = (formMeta.value?.fields || []).map((f) => f.key);
  return new Set(keys);
});

const fieldDefinitionMap = computed(() => {
  const map = new Map();

  recruitmentSteps.forEach((stepDef) => {
    stepDef.fields.forEach((field, index) => {
      map.set(field.key, {
        ...field,
        _originalIndex: index,
      });
    });
  });

  return map;
});

const stepsForForm = computed(() => {
  const keys = activeFieldKeys.value;

  return recruitmentSteps
    .map((stepDef) => {
      const filteredFields = stepDef.fields
        .filter((f) => keys.has(f.key))
        .map((f) => {
          const cfg = fieldConfigMap.value.get(f.key);
          return {
            ...f,
            required:
              typeof cfg?.requiredOverride === "boolean"
                ? cfg.requiredOverride
                : f.required,
            _order:
              typeof cfg?.order === "number" ? cfg.order : f._originalIndex ?? 0,
          };
        })
        .sort((a, b) => (a._order || 0) - (b._order || 0));

      return {
        ...stepDef,
        fields: filteredFields,
      };
    })
    .filter((s) => s.fields.length > 0);
});

const stepsNames = computed(() => stepsForForm.value.map((s) => s.name));

const currentStepIndex = computed(() => {
  const idx = stepsNames.value.indexOf(step.value);
  return idx >= 0 ? idx : 0;
});

const currentStepTitle = computed(() => {
  return (
    stepsForForm.value.find((s) => s.name === step.value)?.title ||
    "Formulario"
  );
});

const progressValue = computed(() => {
  if (!stepsNames.value.length) return 0;
  return (currentStepIndex.value + 1) / stepsNames.value.length;
});

const documents = computed(() => formMeta.value?.documents || []);
const images = computed(() => formMeta.value?.images || []);

watch(
  () => stepsNames.value,
  (names) => {
    if (!names.length) {
      step.value = 1;
      return;
    }

    if (!names.includes(step.value)) {
      step.value = names[0];
    }
  },
  { immediate: true },
);

const getStepNumber = (stepName) => {
  const idx = stepsNames.value.indexOf(stepName);
  return idx >= 0 ? idx + 1 : 1;
};

const isStepDone = (stepName) => {
  return stepsNames.value.indexOf(step.value) > stepsNames.value.indexOf(stepName);
};

const hasPrevStep = (currentName) => {
  const idx = stepsNames.value.indexOf(currentName);
  return idx > 0;
};

const hasNextStep = (currentName) => {
  const idx = stepsNames.value.indexOf(currentName);
  return idx >= 0 && idx < stepsNames.value.length - 1;
};

const goPrevStep = (currentName) => {
  const idx = stepsNames.value.indexOf(currentName);
  if (idx > 0) {
    step.value = stepsNames.value[idx - 1];
  }
};

const goNextStep = (currentName) => {
  const idx = stepsNames.value.indexOf(currentName);
  if (idx >= 0 && idx < stepsNames.value.length - 1) {
    step.value = stepsNames.value[idx + 1];
  }
};

const labelWithRequired = (f) => {
  return f.required ? `${f.label} *` : f.label;
};

const canShow = (f) => {
  if (!activeFieldKeys.value.has(f.key)) return false;
  if (!f.showIf) return true;
  return form[f.showIf.field] === f.showIf.equals;
};

const fieldColClass = (type) => {
  if (type === "textarea") return "col-12";
  if (type === "checkbox") return "col-12";
  if (type === "file-select") return "col-12 col-md-6";
  return "col-12 col-md-6";
};

const isEmptyValue = (value, fieldType) => {
  if (value === null || value === undefined) return true;
  if (value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "boolean" && value === false && fieldType !== "checkbox") {
    return true;
  }
  return false;
};

const getFieldOptions = (f) => {
  const raw = optionsMap?.[f.optionsKey] || [];

  return raw.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        label: opt.label ?? String(opt.value ?? ""),
        value: opt.value ?? opt.label ?? "",
      };
    }

    return {
      label: String(opt),
      value: opt,
    };
  });
};

const updateAnswer = (key, value) => {
  form[key] = value;
};

const normalizeSelectedFile = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return val[0] || null;
  return val;
};

const updateFileField = (key, val) => {
  fileFields[key] = normalizeSelectedFile(val);
};

const removeFileField = (key) => {
  fileFields[key] = null;
};

const getFileAccept = (f) => {
  return (
    f.accept ||
    "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
};

const fileHint = (f) => {
  const accept = getFileAccept(f);

  if (accept.includes("image/")) {
    return "Sube una imagen válida según el formato permitido.";
  }

  if (accept.includes("pdf") || accept.includes("word") || accept.includes("document")) {
    return "Sube tu archivo en formato PDF o Word.";
  }

  return "Sube el archivo correspondiente según el formato permitido.";
};

const openAsset = (url) => {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
};

const previewImage = (url) => {
  selectedPreviewImage.value = url;
  imagePreviewDialog.value = true;
};

const loadPublicForm = async () => {
  loadingForm.value = true;
  loadError.value = null;

  const token = route.params.token;

  try {
    const resp = await methodsHttp.getApi(`recruitment/public/${token}`);

    if (!resp?.ok || !resp?.form) {
      throw new Error(resp?.mensaje || "Formulario no disponible o inactivo.");
    }

    if (!resp.form.isActive) {
      throw new Error("Este formulario está inactivo.");
    }

    formMeta.value = resp.form;
  } catch (error) {
    console.error("Error loadPublicForm:", error);
    loadError.value =
      error?.message || "No se pudo cargar el formulario de reclutamiento.";
  } finally {
    loadingForm.value = false;
  }
};

const validateRequiredFields = () => {
  let firstStepWithError;

  for (const s of stepsForForm.value) {
    for (const f of s.fields) {
      if (!canShow(f)) continue;
      if (!f.required) continue;

      if (f.type === "file-select") {
        const fileVal = fileFields[f.key];
        if (!fileVal) {
          if (firstStepWithError === undefined) {
            firstStepWithError = s.name;
          }
        }
        continue;
      }

      const value = form[f.key];

      if (isEmptyValue(value, f.type)) {
        if (firstStepWithError === undefined) {
          firstStepWithError = s.name;
        }
      }
    }
  }

  return {
    ok: firstStepWithError === undefined,
    firstStepWithError,
  };
};

const buildAnswersPayload = () => {
  const answers = {};

  activeFieldKeys.value.forEach((key) => {
    const fieldDef = fieldDefinitionMap.value.get(key);

    if (fieldDef && !canShow(fieldDef)) {
      answers[key] = null;
      return;
    }

    answers[key] = form[key] ?? null;
  });

  return answers;
};

const resetFormFields = () => {
  activeFieldKeys.value.forEach((key) => {
    form[key] = initialRecruitmentForm[key] ?? "";
  });

  Object.keys(fileFields).forEach((key) => {
    fileFields[key] = null;
  });

  step.value = stepsNames.value.length ? stepsNames.value[0] : 1;
};

const resetToStart = () => {
  submitted.value = false;
  successDialog.value = false;
  resetFormFields();
};

const submitForm = async () => {
  if (!formMeta.value) {
    Notify.create({
      type: "negative",
      message: "Formulario no disponible.",
    });
    return;
  }

  const validation = validateRequiredFields();
  if (!validation.ok) {
    Notify.create({
      type: "negative",
      message: "Por favor completa todos los campos requeridos.",
    });

    if (validation.firstStepWithError !== undefined) {
      step.value = validation.firstStepWithError;
    }
    return;
  }

  submitting.value = true;

  try {
    const answers = buildAnswersPayload();
    const formData = new FormData();

    formData.append("formId", formMeta.value._id);
    formData.append("publicToken", formMeta.value.publicToken);
    formData.append("answers", JSON.stringify(answers));

    stepsForForm.value.forEach((s) => {
      s.fields.forEach((f) => {
        if (f.type === "file-select" && canShow(f)) {
          const file = normalizeSelectedFile(fileFields[f.key]);
          if (file) {
            formData.append(f.key, file);
          }
        }
      });
    });

    const resp = await methodsHttp.postApi(
      "recruitment/submitRecruitmentApplication",
      formData,
    );

    if (!resp?.ok) {
      throw new Error(resp?.mensaje || "No se pudo enviar la solicitud.");
    }

    lastSubmittedName.value = String(form.fullName || "candidato");
    submitted.value = true;
    successDialog.value = true;

    Notify.create({
      type: "positive",
      message: "Solicitud enviada correctamente.",
    });

    resetFormFields();
  } catch (error) {
    console.error("Error submitForm:", error);
    Notify.create({
      type: "negative",
      message: error?.message || "Error al enviar la solicitud.",
    });
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadPublicForm();
});
</script>

<style scoped>
.recruit-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background:
    radial-gradient(circle at top left, #e0f2fe 0, #eef2ff 40%, #f9fafb 100%);
}

.recruit-wrapper {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.hero-card {
  border-radius: 26px;
  padding: 22px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}

.hero-description {
  max-width: 760px;
  line-height: 1.65;
}

.hero-side-card {
  min-width: 220px;
  border-radius: 20px;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid rgba(59, 130, 246, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.brand-pill {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.94);
  color: #e5e7eb;
  font-size: 11px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
}

.main-card {
  border-radius: 26px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 22px 55px rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(18px);
}

.req-banner {
  background: linear-gradient(135deg, #eef2ff, #dbeafe);
  color: #1e293b;
  border-radius: 18px;
  border: 1px solid rgba(129, 140, 248, 0.28);
}

.attachments-wrap {
  margin-bottom: 4px;
}

.attachment-card {
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  height: 100%;
}

.doc-btn {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #fff;
}

.doc-btn:hover {
  background: #f8fbff;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.image-thumb-btn {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.image-thumb {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.image-thumb:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

.progress-card {
  border-radius: 18px;
  padding: 16px 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.recruit-stepper :deep(.q-stepper__header) {
  padding: 8px;
  gap: 8px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.92);
  position: sticky;
  top: 8px;
  z-index: 3;
  border: 1px solid rgba(148, 163, 184, 0.12);
  margin-bottom: 8px;
}

.recruit-stepper :deep(.q-stepper__tab) {
  padding: 8px 10px;
  min-height: 52px;
  border-radius: 16px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.recruit-stepper :deep(.q-stepper__tab:hover) {
  background: rgba(255, 255, 255, 0.96);
}

.recruit-stepper :deep(.q-stepper__tab--active) {
  background: white;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.recruit-stepper :deep(.q-stepper__dot) {
  width: 28px;
  height: 28px;
  font-size: 12px;
}

.recruit-stepper :deep(.q-stepper__dot .q-icon) {
  font-size: 16px;
}

.recruit-stepper :deep(.q-stepper__title) {
  font-size: 12px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.step-body-card {
  border-radius: 20px;
  padding: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
  border: 1px solid rgba(148, 163, 184, 0.15);
}

.field-modern :deep(.q-field__control) {
  border-radius: 14px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.field-modern :deep(.q-field__control:hover) {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.16);
}

.field-modern :deep(.q-field__native),
.field-modern :deep(.q-field__input) {
  min-height: 22px;
}

.file-box {
  border-radius: 18px;
  border: 1px dashed rgba(59, 130, 246, 0.28);
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  padding: 14px;
}

.modern-checkbox {
  border-radius: 14px;
  padding: 8px 10px;
  background: rgba(248, 250, 252, 0.8);
}

.nav-wrap {
  align-items: center;
}

.btn-primary-rounded {
  border-radius: 999px;
  padding-left: 22px;
  padding-right: 22px;
  min-height: 42px;
}

.btn-secondary-rounded {
  border-radius: 999px;
}

.success-dialog-card {
  width: 520px;
  max-width: 92vw;
  border-radius: 22px;
}

.success-state {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 28px 16px;
}

.success-copy {
  max-width: 640px;
  line-height: 1.7;
}

.fullscreen-image-wrap {
  height: calc(100vh - 52px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.fullscreen-image {
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .recruit-page {
    padding: 12px;
  }

  .hero-card,
  .main-card {
    border-radius: 22px;
  }

  .hero-side-card {
    min-width: 100%;
  }

  .image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .recruit-stepper :deep(.q-stepper__header) {
    padding: 6px;
    gap: 4px;
  }

  .recruit-stepper :deep(.q-stepper__tab) {
    min-height: 42px;
    padding: 6px;
  }

  .recruit-stepper :deep(.q-stepper__title) {
    font-size: 10.5px;
  }

  .recruit-stepper :deep(.q-stepper__dot) {
    width: 24px;
    height: 24px;
  }
}

@media (max-width: 600px) {
  .image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>