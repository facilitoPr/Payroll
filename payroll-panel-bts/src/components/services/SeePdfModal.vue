<template>
  <q-dialog v-model="internalShow" persistent @hide="emitClose">
    <q-card class="q-pa-md" style="width: 500px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">Documentos PDF Generados</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-list v-if="pdfList.length">
          <q-item v-for="(pdf, index) in pdfList" :key="pdf._id">
            <q-item-section avatar>
              <q-checkbox v-model="selectedPDFs" :val="pdf._id" />
            </q-item-section>
            <q-item-section>
              {{ index + 1 }} - {{ pdf.serviceAnswer.services.name }}
            </q-item-section>
            <q-item-section side>
              <q-btn icon="download" round flat @click="downloadPDF(pdf)" />
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="text-grey text-center">
          No hay documentos disponibles.
        </div>
      </q-card-section>

      <q-card-actions align="between">
        <q-btn
          flat
          label="Eliminar seleccionados"
          color="negative"
          @click="deleteSelectedPDFs"
          :disable="!selectedPDFs.length"
        />
        <q-btn
          flat
          label="Cerrar"
          color="primary"
          @click="internalShow = false"
        />
      </q-card-actions>

      <q-inner-loading
      :showing="modalLoading"
      label="Please wait..."
      label-class="text-blue-11"
      label-style="font-size: 1.5em"
    />
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { useQuasar, Dialog } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const props = defineProps({
  show: Boolean,
  answerId: String,
});

const emit = defineEmits(["update:show"]);
const $q = useQuasar();
const internalShow = ref(props.show);
const pdfList = ref([]);
const selectedPDFs = ref([]);
const modalLoading = ref(false);

watch(
  () => props.show,
  (val) => {
    internalShow.value = val;
    if (val) fetchPDFs();
  }
);

watch(internalShow, (val) => {
  if (!val) emit("update:show", false);
});

const fetchPDFs = async () => {
  modalLoading.value = true;
  try {
    const response = await methodsHttp.getApi(
      `services/getServiceDocuments/${props.answerId}`
    );
    if (response.ok) {
      pdfList.value = response.documents;
    } else {
      $q.notify({ type: "negative", message: "Error al obtener documentos" });
    }
  } catch (error) {
    console.error(error);
    $q.notify({
      type: "negative",
      message: "Error de red al obtener documentos",
    });
  }
  modalLoading.value = false;
};

const downloadPDF = (pdf) => {
  try {
    // Convertir base64 a un array de bytes
    const byteCharacters = atob(pdf.pdfFile);
    const byteNumbers = new Array(byteCharacters.length)
      .fill(0)
      .map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);

    // Crear Blob
    const blob = new Blob([byteArray], { type: "application/pdf" }); // cambia el MIME si no es PDF

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      pdf.filename || `documento_${pdf.serviceAnswer.services.name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al descargar PDF:", error);
  }
};

const deleteSelectedPDFs = async () => {
  if (!selectedPDFs.value.length) return;

  Dialog.create({
    title: "Confirmar eliminación",
    message:
      "¿Estás seguro de que deseas eliminar los documentos seleccionados?",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    // Si el usuario confirma, eliminamos los documentos
    performDeleteSelectedPDFs();
  });
};

const performDeleteSelectedPDFs = async () => {
  try {
    console.log(selectedPDFs.value)
    const response = await methodsHttp.putApi(
      "services/deleteServicesDocuments",
      {
        documentIds: selectedPDFs.value,
      }
    );

    if (response.ok) {
      $q.notify({
        type: "positive",
        message: "Documentos eliminados con éxito",
      });
      selectedPDFs.value = [];
      fetchPDFs(); // recarga lista
    } else {
      $q.notify({
        type: "negative",
        message: "No se pudieron eliminar los documentos",
      });
    }
  } catch (error) {
    console.error(error);
    $q.notify({
      type: "negative",
      message: "Error de red al eliminar documentos",
    });
  }
};

const emitClose = () => {
  emit("update:show", false);
};
</script>
