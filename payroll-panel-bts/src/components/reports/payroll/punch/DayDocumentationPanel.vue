<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle2 text-grey-8">Documentación del día</div>
      <div class="text-caption text-grey-6">
        Nota, fotos y documentos para registrar cualquier novedad.
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-gutter-md">
      <q-input
        v-model="note"
        type="textarea"
        outlined
        dense
        autogrow
        label="Nota del día"
        placeholder="Ej: hubo una incidencia, permiso verbal, reporte de supervisor, etc."
      />

      <q-file
        v-model="photoFiles"
        outlined
        dense
        multiple
        accept="image/*"
        label="Fotos (opcional)"
        counter
      >
        <template #prepend><q-icon name="photo_camera" /></template>
      </q-file>

      <q-file
        v-model="docFiles"
        outlined
        dense
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        label="Documentos (opcional)"
        counter
      >
        <template #prepend><q-icon name="attach_file" /></template>
      </q-file>

      <div class="row justify-end">
        <q-btn
          color="primary"
          icon="save"
          label="Guardar"
          :loading="saving"
          @click="saveDayDoc"
          unelevated
          rounded
          class="q-px-md"
        />
      </div>

      <!-- EXISTENTES -->
      <div v-if="existing.images.length || existing.documents.length">
        <q-separator class="q-my-sm" />
        <div class="text-subtitle2 text-grey-7 q-mb-sm">Archivos guardados</div>

        <div v-if="existing.images.length" class="q-mb-md">
          <div class="text-caption text-grey-6 q-mb-xs">Fotos</div>
          <div class="row q-col-gutter-sm">
            <div class="col-auto" v-for="(f, i) in existing.images" :key="i">
              <q-img
                :src="f"
                style="width: 90px; height: 70px"
                class="rounded-borders cursor-pointer"
                @click="openLink(f)"
              />
              <div class="row justify-center q-mt-xs">
                <q-btn
                  dense
                  flat
                  icon="delete"
                  color="negative"
                  @click="removeFile(f, 'image')"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="existing.documents.length">
          <div class="text-caption text-grey-6 q-mb-xs">Documentos</div>
          <q-list bordered separator>
            <q-item
              v-for="(f, i) in existing.documents"
              :key="i"
              clickable
              @click="openLink(f)"
            >
              <q-item-section avatar>
                <q-icon name="description" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="doc-name-2" lines="2">{{
                  f
                }}</q-item-label>

                <q-item-label caption>Documento</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  dense
                  flat
                  icon="delete"
                  color="negative"
                  @click.stop="removeFile(f, 'document')"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </q-card-section>

    <q-inner-loading :showing="loading" label="Cargando..." />
  </q-card>
</template>

<script setup>
import { ref, watch } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const $q = useQuasar();

const props = defineProps({
  userId: { type: String, default: "" },
  dateString: { type: String, default: "" },
  workSummary: { type: String, default: "" },
});

// ====== ENDPOINTS sugeridos (ajusta a tu backend)
const API = {
  get: (workSummary) => `punch/getWorkSummaryDoc?workSummaryId=${workSummary}`, // GET
  upsert: "punch/upsertWorkSummaryDoc", // POST (FormData)
  removeFile: "punch/removeWorkSummaryDocFile", // DELETE ?id=FILE_ID
};

const loading = ref(false);
const saving = ref(false);

const note = ref("");
const photoFiles = ref([]);
const docFiles = ref([]);

const existing = ref({
  images: [], // [{_id,url,name,type}]
  documents: [], // [{_id,url,name,type}]
});

function openLink(url) {
  if (!url) return;
  window.open(url, "_blank");
}

async function fetchDayDoc() {
  if (!props.userId || !props.dateString) return;
  loading.value = true;
  try {
    const resp = await methodsHttp.getApi(API.get(props.workSummary));
    if (resp?.ok) {
      note.value = resp?.data?.note || "";
      existing.value.images = Array.isArray(resp?.data?.images)
        ? resp.data.images
        : [];
      existing.value.documents = Array.isArray(resp?.data?.documents)
        ? resp.data.documents
        : [];
    }
  } catch (e) {
    // opcional notify
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.userId, props.dateString],
  () => fetchDayDoc(),
  { immediate: true }
);

async function saveDayDoc() {
  if (!props.userId || !props.dateString) return;

  saving.value = true;
  try {
    const fd = new FormData();
    fd.append("workSummaryId", props.workSummary);
    // fd.append("dateString", props.dateString);
    fd.append("note", note.value || "");

    (photoFiles.value || []).forEach((f) => fd.append("images", f));
    (docFiles.value || []).forEach((f) => fd.append("documents", f));

    const resp = await methodsHttp.postApi(API.upsert, fd);
    if (resp?.ok) {
      $q.notify({ type: "positive", message: "Documentación guardada" });
      photoFiles.value = [];
      docFiles.value = [];
      await fetchDayDoc();
    } else {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo guardar",
      });
    }
  } catch (e) {
    $q.notify({ type: "negative", message: "Error guardando documentación" });
  } finally {
    saving.value = false;
  }
}

function removeFile(url, kind) {
  $q.dialog({
    title: "Eliminar archivo",
    message: "¿Deseas eliminar este archivo?",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const resp = await methodsHttp.deleteApi(
        `${API.removeFile}?workSummaryId=${props.workSummary}&kind=${kind}&url=${url}`
      );
      if (resp?.ok) {
        $q.notify({ type: "positive", message: "Archivo eliminado" });
        await fetchDayDoc();
      } else {
        $q.notify({
          type: "negative",
          message: resp?.mensaje || "No se pudo eliminar",
        });
      }
    } catch (e) {
      $q.notify({ type: "negative", message: "Error eliminando archivo" });
    }
  });
}
</script>

<style>
.doc-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
