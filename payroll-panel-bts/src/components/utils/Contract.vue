<template>
  <div class="q-pa-md">
    <q-dialog v-model="mostrar" persistent>
      <q-card flat class="contract-modal" style="width: 520px; max-width: 92vw">
        <q-inner-loading
          :showing="isLoading"
          label="Enviando..."
          label-class="text-blue-11"
          label-style="font-size: 1.1em"
        />

        <!-- HEADER estilo form -->
        <div class="bg-primary row justify-between q-pa-md contract-header">
          <div class="text-white" style="font-size: 19px; font-weight: 500">
            <div class="row items-center">
              <div class="col-auto q-mx-sm">
                <q-icon size="2em" name="assignment" color="white" />
              </div>
              <div class="col-auto text-white">
                <b>SUBIR CONTRATO</b>
              </div>
            </div>

            <div class="text-caption text-blue-1 q-ml-lg q-pl-sm">
              PDF, DOC, DOCX o TXT — máx. {{ maxFileSizeMB }}MB
            </div>
          </div>

          <span
            class="material-icons text-white"
            style="font-size: 23px; cursor: pointer"
            @click="closeModal"
          >
            cancel
          </span>
        </div>

        <!-- BODY -->
        <q-card-section class="q-pt-md">
          <q-card flat bordered class="q-pa-sm contract-drop">
            <q-file
              v-model="documento"
              label="Seleccionar contrato"
              outlined
              dense
              :accept="allowedTypes"
              counter
              class="full-width"
            >
              <template #prepend>
                <q-icon name="attach_file" />
              </template>

              <template #after>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  :disable="!documento"
                  @click="clearFile"
                />
              </template>
            </q-file>

            <div v-if="documento" class="q-mt-sm text-caption text-grey-7">
              <q-icon name="description" class="q-mr-xs" />
              <b>{{ documento.name }}</b>
              <span class="q-ml-sm">• {{ (documento.size / 1024 / 1024).toFixed(2) }} MB</span>
            </div>
          </q-card>

          <!-- Mensajes -->
          <q-banner v-if="error" class="bg-red-1 text-negative q-mt-md" rounded>
            <template #avatar>
              <q-icon name="error" color="negative" />
            </template>
            {{ error }}
          </q-banner>

          <q-banner v-else-if="respuesta" class="bg-green-1 text-positive q-mt-md" rounded>
            <template #avatar>
              <q-icon name="check_circle" color="positive" />
            </template>
            {{ respuesta }}
          </q-banner>

          <!-- Acciones -->
          <div class="row q-col-gutter-sm q-mt-md">
            <div class="col-12 col-sm-6">
              <q-btn
                outline
                color="primary"
                icon="close"
                label="Cerrar"
                class="full-width modern-btn"
                @click="closeModal"
                :disable="isLoading"
              />
            </div>

            <div class="col-12 col-sm-6">
              <q-btn
                color="primary"
                unelevated
                icon="cloud_upload"
                label="Subir"
                class="full-width modern-btn"
                @click="subirDocumento"
                :disable="!documento || !!error || isLoading"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";

const emit = defineEmits(["update:modelValue"]);

const mostrar = ref(false);
const documento = ref(null);
const respuesta = ref("");
const error = ref("");
const allowedTypes = ".pdf,.doc,.docx,.txt";
const maxFileSizeMB = 5;

const notify = ref(null);
const id = ref("");
const isLoading = ref(false);

// Validación automática
watch(documento, (file) => {
  if (!file) {
    error.value = "";
    return;
  }

  const ext = file.name.split(".").pop().toLowerCase();
  const validExtensions = ["pdf", "doc", "docx", "txt"];
  const isValidType = validExtensions.includes(ext);
  const isValidSize = file.size <= maxFileSizeMB * 1024 * 1024;

  if (!isValidType) {
    error.value = "Tipo de archivo no permitido.";
  } else if (!isValidSize) {
    error.value = `Archivo demasiado grande (máx. ${maxFileSizeMB} MB).`;
  } else {
    error.value = "";
  }
});

const clearFile = () => {
  documento.value = null;
  error.value = "";
  respuesta.value = "";
};

const closeModal = () => {
  if (isLoading.value) return;
  mostrar.value = false;
  clearFile();
};

const subirDocumento = async () => {
  if (!documento.value || error.value) return;
  isLoading.value = true;

  try {
    const formData = new FormData();
    formData.append("document", documento.value);

    const resp = await methodsHttp.putApi(
      `user/updateUserContract/${id.value}`,
      formData,
      { isFormData: true } // ✅ si tu helper lo soporta
    );

    if (resp?.ok) {
      respuesta.value = "Contrato subido correctamente.";
      notify.value?.showNotifyGood(resp.mensaje);
      closeModal();
      emit("update:modelValue");
      return;
    }

    respuesta.value = "Error: " + (resp?.mensaje || "No se pudo subir el contrato.");
    notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
  } catch (e) {
    respuesta.value = "Error: No se pudo subir el contrato.";
    notify.value?.showNotifyBad("Error al subir el contrato");
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

const openModalContract = (value) => {
  mostrar.value = true;
  id.value = value;
  clearFile();
};

defineExpose({ openModalContract });
</script>

<style scoped>
.contract-modal {
  border-radius: 16px;
  overflow: hidden;
}

.contract-drop {
  border-radius: 12px;
}

.modern-btn {
  border-radius: 12px;
  height: 42px;
}
</style>
