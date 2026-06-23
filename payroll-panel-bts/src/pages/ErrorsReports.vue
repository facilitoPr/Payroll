<template>
  <div class="bg-white q-pa-md">
    <PageHeaderCard
      title="Reporte de errores"
      subtitle="Revisa, clasifica y documenta incidencias reportadas por el equipo."
      icon="warning"
    />
    <div>
      <TableErrors
        :rows="rows"
        :tableLoading="tableLoading"
        :getProblemReports="getProblemReports"
        @open="openDetails"
      />

      <div
        class="col-12 q-mt-sm"
        style="display: flex; align-items: center; justify-content: center"
      >
        <TablePagination
          v-model="initialPagination"
          :orderQuantity="orderQuantity"
          color="light-blue-10"
          active-color="light-blue-5"
        />
      </div>
    </div>
    <!-- Modal Detalle + Edición -->
    <q-dialog v-model="openDetailDialog" persistent>
      <q-card style="width: 980px; max-width: 98vw">
        <q-card-section class="row items-center justify-between bg-primary">
          <div class="text-h6 text-white">Detalle del reporte</div>

          <q-btn icon="close" color="white" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-lg">
            <!-- CARD: Información -->
            <div class="col-12 col-md-5">
              <q-card flat bordered class="rounded-borders">
                <div
                  class="q-pa-sm flex items-center bg-primary text-white rounded-borders"
                >
                  <q-icon name="info" class="q-mr-sm" />
                  <div class="text-subtitle2">Información del reporte</div>
                </div>

                <q-separator />

                <div class="q-pa-md">
                  <div class="q-mb-sm">
                    <div class="text-caption text-grey-7">Creado por</div>
                    <div class="text-body1">
                      {{ selectedRow?.createdBy?.name || "-" }}
                    </div>
                  </div>

                  <div class="q-mb-sm">
                    <div class="text-caption text-grey-7">Comercial</div>
                    <div class="text-body1">
                      {{ selectedRow?.comercial?.MemberFullname || "-" }}
                    </div>
                  </div>

                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6">
                      <div class="text-caption text-grey-7">
                        Fecha recordatorio
                      </div>
                      <div class="text-body1">
                        {{ selectedRow?.reminder?.date || "-" }}
                      </div>
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="text-caption text-grey-7">Fecha reporte</div>
                      <div class="text-body1">
                        {{ moment(selectedRow?.date).format("lll") || "-" }}
                      </div>
                    </div>
                  </div>

                  <div class="q-mt-md">
                    <div class="text-caption text-grey-7">Estatus actual</div>
                    <q-badge
                      class="q-px-sm q-py-xs"
                      :style="getBackgroundColor(badgeStatus(selectedRow))"
                    >
                      {{ badgeStatus(selectedRow)?.name || "—" }}
                    </q-badge>
                  </div>

                  <div class="q-mt-md">
                    <div class="text-caption text-grey-7">Nota</div>
                    <div
                      class="q-pa-sm bg-grey-1 rounded-borders"
                      style="max-height: 240px; overflow: auto"
                    >
                      <div
                        v-if="selectedRow?.note"
                        v-html="selectedRow.note"
                      ></div>
                      <div v-else class="text-grey-7">— Sin nota —</div>
                    </div>
                  </div>

                  <!-- Adjuntos existentes (si el backend los provee en selectedRow.attachments) -->
                  <div
                    class="q-mt-md"
                    v-if="
                      selectedRow?.images?.length ||
                      0 ||
                      selectedRow?.files?.length ||
                      0
                    "
                  >
                    <div class="text-caption text-grey-7 q-mb-xs">
                      Adjuntos existentes
                    </div>

                    <!-- Galería de imágenes -->
                    <div v-if="selectedRow?.images?.length" class="q-mb-md">
                      <div class="row q-col-gutter-sm">
                        <div
                          class="col-6"
                          v-for="(src, idx) in selectedRow.images"
                          :key="'img-' + idx"
                        >
                          <q-img
                            :src="src"
                            :ratio="16 / 9"
                            class="rounded-borders"
                          />
                          <div class="text-caption ellipsis q-mt-xs">
                            <a :href="src" target="_blank" rel="noopener"
                              >Ver imagen</a
                            >
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Lista de documentos -->
                    <div v-if="selectedRow?.files?.length">
                      <div class="row q-col-gutter-sm">
                        <div
                          class="col-12"
                          v-for="(href, idx) in selectedRow.files"
                          :key="'file-' + idx"
                        >
                          <q-chip
                            clickable
                            @click="openLink(href)"
                            icon="attach_file"
                            class="q-mb-xs"
                          >
                            {{ fileName(href) }}
                          </q-chip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </q-card>
            </div>

            <!-- CARD: Editar -->
            <div class="col-12 col-md-7">
              <q-card flat bordered class="rounded-borders relative-position">
                <div
                  class="q-pa-sm flex items-center bg-primary text-white rounded-borders"
                >
                  <q-icon name="edit" class="q-mr-sm" />
                  <div class="text-subtitle2">Editar reporte</div>
                </div>

                <q-inner-loading :showing="saving" label="Guardando..." />

                <q-separator />

                <div class="q-pa-md">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6">
                      <div class="text-caption text-grey-7 q-mb-xs">
                        Nuevo estatus
                      </div>
                      <q-select
                        v-model="form.status"
                        :options="statusOptions"
                        option-label="name"
                        option-value="code"
                        emit-value
                        map-options
                        outlined
                        dense
                        :style="getBackgroundColor(statusByCode(form.status))"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="text-caption text-grey-7 q-mb-xs">
                        Fecha reporte
                      </div>
                      <q-input
                        dense
                        outlined
                        :model-value="moment(selectedRow?.date).format('lll')"
                        disable
                      />
                    </div>
                  </div>

                  <!-- Nota a guardar -->
                  <div class="q-mt-md">
                    <div class="text-caption text-grey-7 q-mb-xs">Nota</div>
                    <q-input
                      outlined
                      dense
                      type="textarea"
                      v-model="form.reviewNote"
                      :rules="[
                        (v) => !!v || 'La nota es requerida',
                        (v) => (v && v.length >= 5) || 'Mínimo 5 caracteres',
                      ]"
                      placeholder="Escribe una nota..."
                    />
                  </div>

                  <!-- Subir nuevos archivos -->
                  <div class="q-mt-md">
                    <div class="text-caption text-grey-7 q-mb-xs">
                      Adjuntar archivos nuevos
                    </div>
                    <q-uploader
                      ref="uploader"
                      label="Arrastra y suelta o haz clic para seleccionar"
                      multiple
                      auto-upload="false"
                      :factory="filesFactory"
                      accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.wav"
                      :max-file-size="50 * 1024 * 1024"
                      @added="onFilesAdded"
                      @removed="onFilesRemoved"
                      style="width: 100%"
                    />
                    <div
                      v-if="files.length"
                      class="text-caption text-grey-7 q-mt-xs"
                    >
                      {{ files.length }} archivo(s) seleccionado(s)
                    </div>

                    <!-- Previews de nuevos archivos -->
                    <!-- <div
                        class="row q-col-gutter-sm q-mt-sm"
                        v-if="files.length"
                      >
                        <div
                          class="col-6"
                          v-for="(file, i) in files"
                          :key="'new-' + i"
                        >
                          <div v-if="isImage(file.type)" class="rounded-borders">
                            <q-img
                              :src="toObjectURL(file)"
                              :ratio="16 / 9"
                              class="rounded-borders"
                            />
                            <div class="text-caption ellipsis q-mt-xs">
                              {{ file.name }}
                            </div>
                          </div>
                          <div v-else>
                            <q-chip icon="insert_drive_file" class="q-mb-xs">
                              {{ file.name }}
                            </q-chip>
                          </div>
                        </div>
                      </div> -->
                  </div>

                  <div class="q-mt-lg flex justify-end">
                    <q-btn flat label="Cancelar" v-close-popup />
                    <q-btn
                      color="primary"
                      :loading="saving"
                      label="Guardar"
                      class="q-ml-sm"
                      @click="saveStatusNoteFiles"
                    />
                  </div>
                </div>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import NotificationsVue from "src/components/utils/Notifications.vue";
import "moment/dist/locale/es";
moment.locale("es");

import { ref, onMounted, watch } from "vue";
import TablePagination from "src/components/table/TablePagination.vue";
import TableErrors from "src/components/errors/TableErrors.vue";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import { useRoute } from "vue-router";

const route = useRoute();
const limit = ref(10);
const initial = ref(0);
const orderQuantity = ref(1);
const initialPagination = ref(1);

const notify = ref(null);
const tableLoading = ref(false);

const date = ref(moment(new Date()).format("YYYY/MM/DD")); // opcional
const dateFormatted = ref(moment(new Date()).format("LL")); // opcional
const rows = ref([]);

const openDetailDialog = ref(false);
const selectedRow = ref(null);

const saving = ref(false);
const files = ref([]); // File[]

const form = ref({
  status: null,
  reviewNote: "",
});

const statusOptions = ref([]);

onMounted(() => {
  getStatus();
  getProblemReports();
});

// Si ya no filtras por fecha, puedes eliminar este watch.
watch(date, (value) => {
  if (value) {
    dateFormatted.value = moment(value).format("LL");
    getProblemReports();
  }
});

watch(initialPagination, (value) => {
  // página 1 -> initial = 0; página n -> (n*limit) - limit
  if (value === 1) {
    initial.value = 0;
  } else {
    initial.value = value * limit.value - limit.value;
  }
  getProblemReports();
});

const openDetails = (row) => {
  selectedRow.value = row;
  form.value.status =
    typeof row?.status === "object" ? row.status.code : row?.status || null;
  files.value = [];
  form.value.reviewNote = row.reviewNote;
  openDetailDialog.value = true;
};

const getProblemReports = async () => {
  try {
    tableLoading.value = true;
    const resp = await methodsHttp.getApi(
      `reports/getProblemReports/${limit.value}/${initial.value}`
    );

    if (resp?.ok) {
      // Ahora viene en resp.reports y resp.count
      rows.value = Array.isArray(resp.reports) ? resp.reports : [];
      // total de páginas
      orderQuantity.value = Math.max(
        1,
        Math.ceil((resp.count || 0) / limit.value)
      );

      if (route.query.id) {
        const error = rows.value.find(
          (item) => item._id === route.query.id
        );
        if (error) openDetails(error);
      }
    } else {
      rows.value = [];
      orderQuantity.value = 1;
    }
  } catch (e) {
    console.error(e);
    rows.value = [];
    orderQuantity.value = 1;
  } finally {
    tableLoading.value = false;
  }
};

const getStatus = async () => {
  const resp = await methodsHttp.getApi(`reports/getReportStatus`);
  statusOptions.value = resp?.ok ? resp.status || [] : [];
};

// QUploader: evitamos subida automática; manejamos FormData manual
const filesFactory = () => null;

const onFilesAdded = (added) => {
  added.forEach((f) => files.value.push(f.__file || f));
};

const onFilesRemoved = (removed) => {
  removed.forEach((f) => {
    const file = f.__file || f;
    files.value = files.value.filter((x) => x !== file);
  });
};

// Helpers de UI
const fileName = (url) => {
  try {
    return (url || "").split("?")[0].split("/").pop() || "archivo";
  } catch {
    return "archivo";
  }
};
const openLink = (url) => window.open(url, "_blank");

// Guardar: status + nota + archivos
const saveStatusNoteFiles = async () => {
  try {
    if (!selectedRow.value?._id) {
      notify.value?.showNotifyBad("No se encontró el reporte npm a actualizar");
      return;
    }
    saving.value = true;

    const fd = new FormData();
    fd.append("code", form.value.status || "");
    fd.append("reviewNote", form.value.reviewNote || "");
    files.value.forEach((f) => fd.append("files", f)); // backend debe aceptar "files"[])

    // Ajusta a tu ruta real (ProblemReport recomendado)
    const url = `reports/updateProblemReport/${selectedRow.value._id}`;

    const resp = await methodsHttp.putApi(url, fd);

    if (resp?.ok) {
      selectedRow.value.status =
        statusByCode(form.value.status) || form.value.status;
      selectedRow.value.reviewNote = form.value.reviewNote;

      // 🔁 refrescar adjuntos en la UI si backend los retorna
      if (resp.report) {
        selectedRow.value.images =
          resp.report.images || selectedRow.value.images || [];
        selectedRow.value.files =
          resp.report.files || selectedRow.value.files || [];
      }

      notify.value?.showNotifyGood("Reporte actualizado correctamente");
      openDetailDialog.value = false;
      // emit("refresh");
    } else {
      notify.value?.showNotifyBad(
        resp?.mensaje || "No se pudo actualizar el reporte"
      );
    }
  } catch (e) {
    console.error(e);
    notify.value?.showNotifyBad("Error al guardar cambios");
  } finally {
    saving.value = false;
  }
};

// UI

const badgeStatus = (row) => {
  if (!row) return null;
  if (row.status && typeof row.status === "object") return row.status;
  if (typeof row.status === "string") return statusByCode(row.status);
  return null;
};

const statusByCode = (code) =>
  (statusOptions.value || []).find((s) => s.code === code) || null;

const getBackgroundColor = (statusObj) => {
  const code = (statusObj?.code || statusObj || "").toString().toUpperCase();
  switch (code) {
    case "PENDING":
      return { backgroundColor: "#d3c769" };
    case "PROCESSING":
      return { backgroundColor: "#FFE08A" };
    case "DOCUMENTED":
      return { backgroundColor: "#A7C7E7" };
    case "TRAINING":
      return { backgroundColor: "#C7B8EA" };
    case "FINISHED":
      return { backgroundColor: "#A8E6A3" };
    default:
      return { backgroundColor: "#FFFFFF" };
  }
};
</script>

<style scoped>
.rounded-borders {
  border-radius: 12px;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
