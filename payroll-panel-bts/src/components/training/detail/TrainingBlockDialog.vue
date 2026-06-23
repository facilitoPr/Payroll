<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card style="width: 760px; max-width: 95vw" class="rounded-card">
      <q-card-section class="row items-center justify-between dialog-header">
        <div class="row items-center header-content">
          <div class="header-icon-wrap">
            <q-icon size="lg" name="article" color="white" />
          </div>
          <div class="text-h6 text-weight-bold text-white text-uppercase">
            {{ isEdit ? "EDITAR BLOQUE" : "CREAR BLOQUE" }}
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
          <div class="col-12 col-md-4">
            <q-select
              v-model="form.type"
              :options="blockTypeOptions"
              label="Tipo"
              outlined
              dense
              rounded
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="form.title"
              label="Título"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model.number="form.order"
              type="number"
              label="Orden"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="form.description"
              label="Descripción"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12" v-if="form.type === 'TEXT'">
            <q-input
              v-model="form.content"
              type="textarea"
              autogrow
              label="Contenido"
              outlined
              dense
              rounded
            />
          </div>

          <div class="col-12" v-else-if="form.type === 'YOUTUBE'">
            <q-input
              v-model="form.url"
              label="URL de YouTube"
              outlined
              dense
              rounded
            />
          </div>

          <template v-else>
            <div class="col-12">
              <q-file
                v-model="blockFile"
                :accept="blockFileAccept"
                label="Seleccionar archivo"
                outlined
                dense
                rounded
                clearable
                use-chips
              />
            </div>

            <div class="col-12" v-if="block?.url">
              <q-banner rounded class="bg-blue-1 text-primary">
                Ya existe un archivo cargado para este bloque.
                <template #action>
                  <q-btn
                    flat
                    color="primary"
                    label="Abrir"
                    :href="block.url"
                    target="_blank"
                  />
                </template>
              </q-banner>
            </div>

            <div class="col-12">
              <q-input
                v-model="form.url"
                label="O URL externa del archivo"
                outlined
                dense
                rounded
              />
            </div>
          </template>

          <div class="col-12">
            <q-toggle
              v-model="form.isRequired"
              label="Obligatorio"
              color="primary"
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
          @click="saveBlock"
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
  block?: any | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const { createBlock, updateBlock } = useTrainingAdmin();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const isEdit = computed(() => !!props.block?._id);

const form = reactive({
  type: "TEXT",
  title: "",
  description: "",
  content: "",
  url: "",
  order: 0,
  isRequired: false,
});

const blockFile = ref<File | null>(null);

const blockTypeOptions = [
  { label: "Texto", value: "TEXT" },
  { label: "YouTube", value: "YOUTUBE" },
  { label: "PDF", value: "PDF" },
  { label: "Imagen", value: "IMAGE" },
  { label: "Archivo", value: "FILE" },
];

const blockFileAccept = computed(() => {
  if (form.type === "IMAGE") return "image/*";
  if (form.type === "PDF") return ".pdf,application/pdf";
  if (form.type === "FILE") return "*";
  return "";
});

const notifyError = (message: string) => {
  $q.notify({ type: "negative", message });
};

const notifySuccess = (message: string) => {
  $q.notify({ type: "positive", message });
};

const resetForm = () => {
  form.type = "TEXT";
  form.title = "";
  form.description = "";
  form.content = "";
  form.url = "";
  form.order = 0;
  form.isRequired = false;
  blockFile.value = null;
};

watch(
  () => [props.modelValue, props.block],
  ([isOpen]) => {
    if (!isOpen) return;

    resetForm();

    if (props.block) {
      form.type = props.block.type || "TEXT";
      form.title = props.block.title || "";
      form.description = props.block.description || "";
      form.content = props.block.content || "";
      form.url = props.block.url || "";
      form.order = props.block.order || 0;
      form.isRequired = !!props.block.isRequired;
    }
  },
  { immediate: true },
);

const closeDialog = () => {
  emit("update:modelValue", false);
};

const saveBlock = async () => {
  if (!props.trainingId) return;

  try {
    const isFileType = ["IMAGE", "PDF", "FILE"].includes(form.type);
    let payload: any;

    if (isFileType) {
      const formData = new FormData();
      formData.append("type", form.type);
      formData.append("title", form.title || "");
      formData.append("description", form.description || "");
      formData.append("order", String(form.order || 0));
      formData.append("isRequired", String(!!form.isRequired));

      if (form.url) formData.append("url", form.url);
      if (blockFile.value) formData.append("file", blockFile.value);

      payload = formData;
    } else {
      payload = {
        type: form.type,
        title: form.title,
        description: form.description,
        content: form.type === "TEXT" ? form.content : null,
        url: form.type === "YOUTUBE" ? form.url : null,
        order: form.order,
        isRequired: form.isRequired,
      };
    }

    if (props.block?._id) {
      await updateBlock(props.block._id, payload);
      notifySuccess("Bloque actualizado con éxito");
    } else {
      await createBlock(props.trainingId, payload);
      notifySuccess("Bloque creado con éxito");
    }

    emit("saved");
  } catch (error: any) {
    notifyError(error.message || "No se pudo guardar el bloque");
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
</style>