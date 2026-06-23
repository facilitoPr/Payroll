<template>
  <div class="q-pa-md">
    <q-dialog v-model="mostrar" persistent>
      <q-card
        flat
        class="doc-modal"
        style="width: 520px; max-width: 92vw"
      >
        <q-inner-loading
          :showing="isLoading"
          label="Enviando..."
          label-class="text-blue-11"
          label-style="font-size: 1.1em"
        />

        <!-- HEADER estilo form (igual que tus modales) -->
        <div class="bg-primary row justify-between q-pa-md doc-header">
          <div class="text-white" style="font-size: 19px; font-weight: 500">
            <div class="row items-center">
              <div class="col-auto q-mx-sm">
                <q-icon size="2em" name="upload_file" color="white" />
              </div>
              <div class="col-auto text-white">
                <b>SUBIR DOCUMENTO</b>
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
          <!-- Zona de archivo más bonita -->
          <q-card flat bordered class="q-pa-sm doc-drop">
            <q-file
              v-model="documento"
              label="Seleccionar documento"
              outlined
              dense
              :accept="allowedTypes"
              counter
              class="full-width"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>

              <template v-slot:after>
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

            <!-- Detalle del archivo -->
            <div v-if="documento" class="q-mt-sm text-caption text-grey-7">
              <q-icon name="description" class="q-mr-xs" />
              <b>{{ documento.name }}</b>
              <span class="q-ml-sm"
                >• {{ (documento.size / 1024 / 1024).toFixed(2) }} MB</span
              >
            </div>
          </q-card>

          <!-- Errores / éxito (más visual) -->
          <q-banner v-if="error" class="bg-red-1 text-negative q-mt-md" rounded>
            <template v-slot:avatar>
              <q-icon name="error" color="negative" />
            </template>
            {{ error }}
          </q-banner>

          <q-banner
            v-else-if="respuesta"
            class="bg-green-1 text-positive q-mt-md"
            rounded
          >
            <template v-slot:avatar>
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
import { authStore } from "src/stores/auth-store";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";

const auth = authStore();

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

  const formData = new FormData();
  formData.append("document", documento.value);

  const resp = await methodsHttp.putApi(
    `user/updateUserDocument/${id.value}`,
    formData
  );
  if (resp.ok) {
    respuesta.value = "Documento subido correctamente.";
    isLoading.value = false;
    notify.value?.showNotifyGood(resp.mensaje);
    mostrar.value = false;
    emit("update:modelValue");
  } else {
    isLoading.value = false;
    respuesta.value =
      "Error: " + (resp?.mensaje || "No se pudo subir el documento.");
    notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
  }
};

const openModalDocument = (value) => {
  mostrar.value = true;
  id.value = value;
};

defineExpose({ openModalDocument });
</script>

<style scoped>
.doc-modal {
  border-radius: 16px;
  overflow: hidden;
}

.doc-header {
  /* mismo feeling de tus forms */
}

.doc-drop {
  border-radius: 12px;
}

.modern-btn {
  border-radius: 12px;
  height: 42px;
}
</style>

