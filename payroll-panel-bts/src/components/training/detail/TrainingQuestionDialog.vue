<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card style="width: 900px; max-width: 95vw" class="rounded-card">
      <q-card-section class="row items-center justify-between dialog-header">
        <div class="row items-center header-content">
          <div class="header-icon-wrap">
            <q-icon size="lg" name="quiz" color="white" />
          </div>
          <div class="text-h6 text-weight-bold text-white text-uppercase">
            {{ isEdit ? "EDITAR PREGUNTA" : "CREAR PREGUNTA" }}
          </div>
        </div>

        <q-btn
          size="sm"
          round
          dense
          icon="close"
          class="bg-white text-primary"
          @click="closeDialog"
        />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-input
              v-model="form.questionText"
              label="Pregunta"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12 col-md-6">
            <q-select
              v-model="form.type"
              :options="questionTypeOptions"
              label="Tipo"
              outlined
              dense
              rounded
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model.number="form.order"
              type="number"
              label="Orden"
              outlined
              dense
              rounded
            />
          </div>

          <template v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(form.type)">
            <div class="col-12">
              <q-card flat bordered class="rounded-card option-builder-card">
                <q-card-section class="row items-center justify-between">
                  <div class="text-subtitle2 text-weight-bold text-primary">
                    Opciones de respuesta
                  </div>

                  <q-btn
                    color="primary"
                    rounded
                    unelevated
                    icon="add"
                    label="Agregar opción"
                    @click="addQuestionOption"
                  />
                </q-card-section>

                <q-separator />

                <q-card-section class="column q-gutter-md">
                  <div
                    v-for="(option, index) in questionOptions"
                    :key="option.key"
                    class="option-row"
                  >
                    <div class="option-key">
                      {{ option.key }}
                    </div>

                    <div class="option-input">
                      <q-input
                        v-model="option.text"
                        :label="`Texto de la opción ${option.key}`"
                        outlined
                        dense
                        rounded
                      />
                    </div>

                    <div class="option-correct">
                      <q-radio
                        v-if="form.type === 'SINGLE_CHOICE'"
                        v-model="singleCorrectOption"
                        :val="option.key"
                        color="primary"
                        label="Correcta"
                      />

                      <q-checkbox
                        v-else
                        :model-value="selectedCorrectOptions.includes(option.key)"
                        color="primary"
                        label="Correcta"
                        @update:model-value="toggleMultipleCorrectOption(option.key, $event)"
                      />
                    </div>

                    <div class="option-actions">
                      <q-btn
                        flat
                        round
                        dense
                        icon="delete"
                        color="negative"
                        :disable="questionOptions.length <= 2"
                        @click="removeQuestionOption(index)"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </template>

          <template v-if="form.type === 'TRUE_FALSE'">
            <div class="col-12">
              <q-card flat bordered class="rounded-card option-builder-card">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-bold text-primary q-mb-md">
                    Respuesta correcta
                  </div>

                  <q-option-group
                    v-model="trueFalseCorrect"
                    :options="[
                      { label: 'Verdadero', value: true },
                      { label: 'Falso', value: false }
                    ]"
                    type="radio"
                    color="primary"
                    inline
                  />
                </q-card-section>
              </q-card>
            </div>
          </template>

          <template v-if="['SHORT_TEXT', 'LONG_TEXT'].includes(form.type)">
            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.minKeywordMatches"
                type="number"
                label="Mín. coincidencias"
                outlined
                dense
                rounded
                :disable="form.type === 'SHORT_TEXT'"
              />
            </div>

            <div class="col-12 col-md-6 flex items-center">
              <q-toggle
                v-model="form.ignoreAccents"
                label="Ignorar tildes"
                color="primary"
              />
            </div>

            <div class="col-12">
              <q-card flat bordered class="rounded-card option-builder-card">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-bold text-primary q-mb-md">
                    {{ form.type === "SHORT_TEXT" ? "Respuestas válidas" : "Palabras o frases esperadas" }}
                  </div>

                  <div class="row q-col-gutter-sm q-mb-md">
                    <div class="col-12 col-md-10">
                      <q-input
                        v-model="newAcceptedAnswer"
                        :label="form.type === 'SHORT_TEXT'
                          ? 'Agregar respuesta válida'
                          : 'Agregar palabra o frase esperada'"
                        outlined
                        dense
                        rounded
                        @keyup.enter="addAcceptedAnswer"
                      />
                    </div>

                    <div class="col-12 col-md-2">
                      <q-btn
                        color="primary"
                        unelevated
                        rounded
                        icon="add"
                        label="Agregar"
                        class="full-width"
                        @click="addAcceptedAnswer"
                      />
                    </div>
                  </div>

                  <div class="row q-gutter-sm">
                    <q-chip
                      v-for="(answer, index) in acceptedAnswers"
                      :key="`${answer}-${index}`"
                      removable
                      color="primary"
                      text-color="white"
                      @remove="removeAcceptedAnswer(index)"
                    >
                      {{ answer }}
                    </q-chip>
                  </div>

                  <div v-if="!acceptedAnswers.length" class="text-caption text-grey-7">
                    Aún no has agregado respuestas aceptadas.
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </template>

          <div class="col-12">
            <q-toggle
              v-model="form.isRequired"
              label="Obligatoria"
              color="primary"
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="form.explanation"
              label="Explicación"
              type="textarea"
              autogrow
              outlined
              dense
              rounded
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancelar"
          icon="cancel"
          color="negative"
          @click="closeDialog"
        />
        <q-btn
          color="primary"
          unelevated
          label="Guardar"
          icon="save"
          @click="saveQuestion"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { useTrainingAdmin } from "src/composable/useTrainingAdmin";

const props = defineProps<{
  modelValue: boolean;
  trainingId: string | null;
  question?: any | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const { createQuestion, updateQuestion } = useTrainingAdmin();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const isEdit = computed(() => !!props.question?._id);

const form = reactive({
  questionText: "",
  type: "SINGLE_CHOICE",
  order: 0,
  isRequired: true,
  explanation: "",
  minKeywordMatches: 1,
  ignoreAccents: true,
});

const questionOptions = ref<{ key: string; text: string }[]>([]);
const selectedCorrectOptions = ref<string[]>([]);
const trueFalseCorrect = ref<boolean | null>(null);
const acceptedAnswers = ref<string[]>([]);
const newAcceptedAnswer = ref("");

const questionTypeOptions = [
  { label: "Texto corto", value: "SHORT_TEXT" },
  { label: "Texto largo", value: "LONG_TEXT" },
  { label: "Una respuesta", value: "SINGLE_CHOICE" },
  { label: "Múltiple", value: "MULTIPLE_CHOICE" },
  { label: "Verdadero/Falso", value: "TRUE_FALSE" },
];

const optionLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const singleCorrectOption = computed({
  get: () => selectedCorrectOptions.value[0] || "",
  set: (value: string) => {
    selectedCorrectOptions.value = value ? [value] : [];
  },
});

const notifyError = (message: string) => {
  $q.notify({ type: "negative", message });
};

const notifySuccess = (message: string) => {
  $q.notify({ type: "positive", message });
};

const getNextOptionKey = () => {
  const index = questionOptions.value.length;
  return optionLetters[index] || `OPC_${index + 1}`;
};

const createEmptyOption = () => ({
  key: getNextOptionKey(),
  text: "",
});

const resetQuestionDynamicFields = () => {
  questionOptions.value = [];
  selectedCorrectOptions.value = [];
  trueFalseCorrect.value = null;
  acceptedAnswers.value = [];
  newAcceptedAnswer.value = "";
};

const resetForm = () => {
  form.questionText = "";
  form.type = "SINGLE_CHOICE";
  form.order = 0;
  form.isRequired = true;
  form.explanation = "";
  form.minKeywordMatches = 1;
  form.ignoreAccents = true;

  selectedCorrectOptions.value = [];
  trueFalseCorrect.value = null;
  acceptedAnswers.value = [];
  newAcceptedAnswer.value = "";

  questionOptions.value = getDefaultOptions();
};

const addQuestionOption = () => {
  questionOptions.value.push(createEmptyOption());
};

const removeQuestionOption = (index: number) => {
  const removed = questionOptions.value[index];
  questionOptions.value.splice(index, 1);

  if (removed?.key) {
    selectedCorrectOptions.value = selectedCorrectOptions.value.filter(
      (item) => item !== removed.key,
    );
  }

  questionOptions.value = questionOptions.value.map((item, idx) => ({
    ...item,
    key: optionLetters[idx] || `OPC_${idx + 1}`,
  }));

  selectedCorrectOptions.value = selectedCorrectOptions.value.filter((key) =>
    questionOptions.value.some((item) => item.key === key),
  );
};

const toggleMultipleCorrectOption = (key: string, checked: boolean) => {
  if (checked) {
    if (!selectedCorrectOptions.value.includes(key)) {
      selectedCorrectOptions.value.push(key);
    }
  } else {
    selectedCorrectOptions.value = selectedCorrectOptions.value.filter(
      (item) => item !== key,
    );
  }
};

const addAcceptedAnswer = () => {
  const value = String(newAcceptedAnswer.value || "").trim();
  if (!value) return;

  if (!acceptedAnswers.value.includes(value)) {
    acceptedAnswers.value.push(value);
  }

  newAcceptedAnswer.value = "";
};

const removeAcceptedAnswer = (index: number) => {
  acceptedAnswers.value.splice(index, 1);
};

const isHydratingForm = ref(false);

const getDefaultOptions = () => [
  { key: "A", text: "" },
  { key: "B", text: "" },
];

const normalizeQuestionOptions = () => {
  const cleanOptions = questionOptions.value
    .map((item, index) => ({
      key: optionLetters[index] || `OPC_${index + 1}`,
      text: item.text || "",
    }));

  questionOptions.value = cleanOptions.length
    ? cleanOptions
    : getDefaultOptions();

  selectedCorrectOptions.value = [...new Set(selectedCorrectOptions.value)].filter(
    (key) => questionOptions.value.some((item) => item.key === key),
  );

  if (form.type === "SINGLE_CHOICE" && selectedCorrectOptions.value.length > 1) {
    selectedCorrectOptions.value = [selectedCorrectOptions.value[0]];
  }
};

watch(
  () => form.type,
  (type, previousType) => {
    if (isHydratingForm.value) return;

    if (["SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(type)) {
      if (!["SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(previousType || "")) {
        questionOptions.value = getDefaultOptions();
        selectedCorrectOptions.value = [];
      } else {
        normalizeQuestionOptions();
      }

      trueFalseCorrect.value = null;
      acceptedAnswers.value = [];
      newAcceptedAnswer.value = "";
      return;
    }

    if (type === "TRUE_FALSE") {
      questionOptions.value = [];
      selectedCorrectOptions.value = [];
      trueFalseCorrect.value = null;
      acceptedAnswers.value = [];
      newAcceptedAnswer.value = "";
      return;
    }

    if (["SHORT_TEXT", "LONG_TEXT"].includes(type)) {
      questionOptions.value = [];
      selectedCorrectOptions.value = [];
      trueFalseCorrect.value = null;

      if (type === "SHORT_TEXT") {
        form.minKeywordMatches = 1;
      }
    }
  },
);

watch(
  () => [props.modelValue, props.question],
  ([isOpen]) => {
    if (!isOpen) return;

    isHydratingForm.value = true;

    resetForm();

    if (props.question) {
      form.questionText = props.question.questionText || "";
      form.type = props.question.type || "SINGLE_CHOICE";
      form.order = props.question.order || 0;
      form.isRequired = props.question.isRequired ?? true;
      form.explanation = props.question.explanation || "";
      form.minKeywordMatches = props.question.minKeywordMatches || 1;
      form.ignoreAccents = props.question.ignoreAccents ?? true;

      if (
        props.question.type === "SINGLE_CHOICE" ||
        props.question.type === "MULTIPLE_CHOICE"
      ) {
        questionOptions.value =
          props.question.options?.length > 0
            ? props.question.options.map((item: any, index: number) => ({
                key: item.key || optionLetters[index] || `OPC_${index + 1}`,
                text: item.text || "",
              }))
            : getDefaultOptions();

        selectedCorrectOptions.value = [...new Set(props.question.correctAnswers || [])].filter(
          (key): key is string =>
            typeof key === "string" &&
            questionOptions.value.some((item) => item.key === key),
        );

        if (
          props.question.type === "SINGLE_CHOICE" &&
          selectedCorrectOptions.value.length > 1
        ) {
          selectedCorrectOptions.value = [selectedCorrectOptions.value[0]];
        }
      }

      if (props.question.type === "TRUE_FALSE") {
        const value = String(props.question.correctAnswers?.[0] || "").toLowerCase();
        if (value === "true") trueFalseCorrect.value = true;
        if (value === "false") trueFalseCorrect.value = false;
      }

      if (
        props.question.type === "SHORT_TEXT" ||
        props.question.type === "LONG_TEXT"
      ) {
        acceptedAnswers.value = [...(props.question.acceptedAnswers || [])];
      }
    } else {
      questionOptions.value = getDefaultOptions();
    }

    isHydratingForm.value = false;
  },
  { immediate: true },
);

const closeDialog = () => {
  emit("update:modelValue", false);
};

const saveQuestion = async () => {
  if (!props.trainingId) return;

  try {
    const payload: any = {
      questionText: form.questionText,
      type: form.type,
      order: form.order,
      isRequired: form.isRequired,
      explanation: form.explanation,
    };

if (["SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(form.type)) {
  const cleanOptions = questionOptions.value
    .map((item) => ({
      key: item.key,
      text: String(item.text || "").trim(),
    }))
    .filter((item) => item.text);

  if (cleanOptions.length < 2) {
    notifyError("Debes agregar al menos 2 opciones válidas");
    return;
  }

  const cleanCorrectAnswers = [...new Set(selectedCorrectOptions.value)].filter(
    (key) => cleanOptions.some((item) => item.key === key),
  );

  if (!cleanCorrectAnswers.length) {
    notifyError("Debes marcar al menos una respuesta correcta");
    return;
  }

  if (form.type === "SINGLE_CHOICE" && cleanCorrectAnswers.length > 1) {
    payload.correctAnswers = [cleanCorrectAnswers[0]];
  } else {
    payload.correctAnswers = cleanCorrectAnswers;
  }

  payload.options = cleanOptions;
}

    if (form.type === "TRUE_FALSE") {
      if (trueFalseCorrect.value === null) {
        notifyError("Debes indicar si la respuesta correcta es verdadero o falso");
        return;
      }

      payload.correctAnswers = [String(trueFalseCorrect.value)];
    }

    if (["SHORT_TEXT", "LONG_TEXT"].includes(form.type)) {
      if (!acceptedAnswers.value.length) {
        notifyError("Debes agregar al menos una respuesta aceptada");
        return;
      }

      payload.acceptedAnswers = [...acceptedAnswers.value];
      payload.minKeywordMatches =
        form.type === "LONG_TEXT" ? Number(form.minKeywordMatches || 1) : 1;
      payload.ignoreAccents = form.ignoreAccents;
      payload.isCaseSensitive = false;
      payload.ignoreExtraSpaces = true;
    }

    if (props.question?._id) {
      await updateQuestion(props.question._id, payload);
      notifySuccess("Pregunta actualizada con éxito");
    } else {
      await createQuestion(props.trainingId, payload);
      notifySuccess("Pregunta creada con éxito");
    }

    emit("saved");
  } catch (error: any) {
    notifyError(error.message || "No se pudo guardar la pregunta");
  }
};
</script>

<style scoped>
.rounded-card {
  border-radius: 20px;
}

.dialog-header {
  background: var(--q-primary);
  color: white;
}

.header-content {
  gap: 12px;
}

.header-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-builder-card {
  background: #fbfdff;
}

.option-row {
  display: grid;
  grid-template-columns: 56px 1fr auto auto;
  gap: 12px;
  align-items: center;
}

.option-key {
  width: 56px;
  height: 44px;
  border-radius: 12px;
  background: #eff6ff;
  color: var(--q-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.option-input {
  min-width: 0;
}

.option-correct {
  min-width: 120px;
}

.option-actions {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .option-row {
    grid-template-columns: 1fr;
  }

  .option-key {
    width: 100%;
  }

  .option-correct,
  .option-actions {
    justify-content: flex-start;
  }
}
</style>