<template>
  <!-- MAIN DIALOG -->
  <q-dialog v-model="open" persistent maximized>
    <q-card class="bg-grey-1">
   <!-- HEADER -->
  <q-card-section class="expedient-main-header bg-primary">
    <div class="row items-center justify-between no-wrap">
      <div class="row items-center no-wrap text-white">
        <div class="expedient-main-icon">
          <q-icon name="folder_shared" size="30px" color="white" />
        </div>

        <div>
          <div class="expedient-main-title">
            Clasificación de expediente
          </div>

          <div class="expedient-main-subtitle">
            {{ applicationName }} · Completa la información de cada documento por sección.
          </div>
        </div>
      </div>

      <q-btn
        round
        dense
        flat
        icon="close"
        color="white"
        @click="close"
      />
    </div>
  </q-card-section>

      <q-separator />

      <!-- BODY -->
<q-card-section class="expedient-dialog-body">
        <!-- LOADING -->
        <div v-if="loadingExpedient">
          <q-card bordered class="bg-white q-pa-md rounded-borders">
            <q-skeleton type="text" width="40%" />
            <q-skeleton type="text" width="65%" class="q-mt-sm" />
            <q-separator class="q-my-md" />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6" v-for="n in 6" :key="n">
                <q-card bordered class="q-pa-md rounded-borders">
                  <div class="row items-center justify-between">
                    <q-skeleton type="text" width="55%" />
                    <q-skeleton type="rect" width="90px" height="26px" />
                  </div>
                  <q-skeleton type="rect" height="38px" class="q-mt-sm" />
                  <q-skeleton type="rect" height="38px" class="q-mt-sm" />
                  <q-skeleton type="rect" height="70px" class="q-mt-sm" />
                  <q-skeleton type="rect" height="80px" class="q-mt-sm" />
                </q-card>
              </div>
            </div>
          </q-card>
        </div>

        <!-- EMPTY -->
        <div v-else-if="!expedient">
          <q-card
            bordered
            class="bg-white q-pa-md rounded-borders row justify-between"
          >
            <div>
              <div class="text-subtitle1 text-weight-bold">Sin expediente</div>
              <div class="text-caption text-grey-6">
                No se pudo cargar el expediente o no existe.
              </div>
            </div>

            <q-btn
              color="primary"
              icon="add"
              label="Crear expediente"
              @click="createExpedient"
            />
          </q-card>
        </div>

        <!-- CONTENT -->
        <div v-else>
          <q-expansion-item
            v-for="section in sectionsToRender"
            :key="section.key"
            expand-separator
            class="bg-white q-mb-sm rounded-borders"
          >
            <!-- HEADER CUSTOM -->
            <template #header>
              <q-item-section avatar>
                <q-icon name="folder" color="primary" />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-bold">
                  {{ section.title }}
                </q-item-label>

                <q-item-label caption class="text-grey-6">
                  {{ sectionStats[section.key]?.received || 0 }}/{{
                    sectionStats[section.key]?.total || 0
                  }}
                  recibidos •
                  {{ sectionStats[section.key]?.withAttachments || 0 }}/{{
                    sectionStats[section.key]?.total || 0
                  }}
                  con adjuntos
                </q-item-label>

                <q-linear-progress
                  rounded
                  size="7px"
                  :value="sectionStats[section.key]?.progress || 0"
                  class="q-mt-xs"
                />
              </q-item-section>

              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <!-- % -->
                  <q-badge outline color="primary" class="q-px-sm">
                    {{
                      Math.round(
                        (sectionStats[section.key]?.progress || 0) * 100,
                      )
                    }}%
                  </q-badge>

                  <!-- Icono adjuntos -->
                  <q-icon
                    name="attach_file"
                    :color="
                      (sectionStats[section.key]?.withAttachments || 0) > 0
                        ? 'primary'
                        : 'grey-5'
                    "
                    size="20px"
                  >
                    <q-tooltip>
                      Adjuntos en
                      {{ sectionStats[section.key]?.withAttachments || 0 }}/{{
                        sectionStats[section.key]?.total || 0
                      }}
                      documentos
                    </q-tooltip>
                  </q-icon>

                  <!-- Icono completo -->
                  <q-icon
                    v-if="sectionStats[section.key]?.complete"
                    name="check_circle"
                    color="positive"
                    size="20px"
                  >
                    <q-tooltip>Sección completa</q-tooltip>
                  </q-icon>
                  <q-icon v-else name="pending" color="grey-6" size="20px">
                    <q-tooltip>Sección pendiente</q-tooltip>
                  </q-icon>

                  <!-- ✅ ADD CUSTOM DOC -->
                  <q-btn
                    dense
                    flat
                    round
                    icon="add"
                    color="grey"
                    @click.stop="openAddDocModal(section.key)"
                  >
                    <q-tooltip>Agregar documento</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </template>

            <q-card flat class="q-pa-sm">
              <div class="row q-col-gutter-md">
                <div
                  v-for="item in section.items"
                  :key="item.key"
                  class="col-12 col-md-6"
                >
                  <q-card flat bordered class="q-pa-md rounded-borders" style="border-radius: 20px;">
                    <div class="row items-center justify-between q-mb-sm">
                      <div class="text-subtitle2 text-weight-bold">
                        {{ item.label }}
                      </div>

                      <div class="row items-center q-gutter-xs">
                        <!-- ✅ Solo custom -->
                        <q-btn
                          v-if="isCustomItem(section.key, item.key)"
                          dense
                          flat
                          round
                          icon="edit"
                          color="primary"
                          @click.stop="openEditDocModal(section.key, item.key)"
                        >
                          <q-tooltip>Editar nombre</q-tooltip>
                        </q-btn>

                        <q-btn
                          v-if="isCustomItem(section.key, item.key)"
                          dense
                          flat
                          round
                          icon="delete"
                          color="negative"
                          @click.stop="confirmDeleteItem(section.key, item.key)"
                        >
                          <q-tooltip>Eliminar documento</q-tooltip>
                        </q-btn>

                        <q-toggle
                          v-model="
                            form.sections[section.key][item.key].received
                          "
                          label="Recibido"
                          color="primary"
                          dense
                          @update:model-value="
                            onToggleReceived(section.key, item.key)
                          "
                        />
                      </div>
                    </div>

                    <div class="row q-col-gutter-sm">
                      <div class="col-12 col-sm-6">
                        <q-input
                        rounded
                          outlined
                          dense
                          type="date"
                          label="Fecha recibido"
                          v-model="form.sections[section.key][item.key].date"
                          :disable="
                            !form.sections[section.key][item.key].received
                          "
                        />
                      </div>

                      <div class="col-12 col-sm-6">
                        <q-select
                        rounded
                          outlined
                          dense
                          label="Estado"
                          v-model="form.sections[section.key][item.key].status"
                          :options="docStatuses"
                          :disable="
                            !form.sections[section.key][item.key].received
                          "
                        />
                      </div>

                      <div class="col-12">
                        <q-input
                        rounded
                          outlined
                          dense
                          autogrow
                          type="textarea"
                          label="Observación / referencia"
                          v-model="form.sections[section.key][item.key].note"
                          placeholder="Ej: guardado en archivo físico, link interno, pendiente firma, etc."
                        />
                      </div>

                      <!-- ADJUNTOS (por item) -->
                      <div class="col-12">
                        <div class="text-caption text-grey-7 q-mb-xs">
                          Adjuntos (imágenes / documentos)
                        </div>

                        <div class="row q-col-gutter-sm items-start">
                          <div class="col-12 col-sm-6">
                            <q-file
                            rounded
                              v-model="
                                pendingUploads[section.key][item.key].images
                              "
                              multiple
                              outlined
                              dense
                              accept="image/*"
                              label="Imágenes"
                              clearable
                            />
                          </div>

                          <div class="col-12 col-sm-6">
                            <q-file
                            rounded
                              v-model="
                                pendingUploads[section.key][item.key].documents
                              "
                              multiple
                              outlined
                              dense
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                              label="Documentos"
                              clearable
                            />
                          </div>

                          <div class="col-12">
                            <div class="row items-center q-gutter-sm">
                              <q-icon name="info" color="primary" />
                              <div class="text-caption text-grey-6">
                                Los adjuntos seleccionados se subirán cuando
                                presiones <b>Guardar clasificación</b>.
                              </div>
                            </div>
                          </div>

                          <div
                            class="col-12"
                            v-if="hasExistingAttachments(section.key, item.key)"
                          >
                            <q-separator class="q-my-sm" />
                            <div class="text-caption text-grey-7 q-mb-xs">
                              Adjuntos existentes
                            </div>

                            <q-list bordered separator dense>
                              <q-item
                                v-for="(a, idx) in getExistingAttachments(
                                  section.key,
                                  item.key,
                                )"
                                :key="a._id || idx"
                                clickable
                                @click="openUrl(a.url)"
                              >
                                <q-item-section avatar>
                                  <q-avatar rounded size="34px">
                                    <q-img
                                      v-if="isImageAttachment(a)"
                                      :src="a.url"
                                      ratio="1"
                                      class="rounded-borders"
                                    />
                                    <q-icon v-else :name="fileIcon(a)" />
                                  </q-avatar>
                                </q-item-section>

                                <q-item-section>
                                  <q-item-label class="ellipsis">
                                    {{ attachmentLabel(a) }}
                                  </q-item-label>
                                  <q-item-label caption class="ellipsis">
                                    {{ attachmentMeta(a) }}
                                  </q-item-label>
                                </q-item-section>

                                <q-item-section side>
                                  <div class="row items-center q-gutter-xs">
                                    <q-btn
                                      dense
                                      flat
                                      round
                                      icon="open_in_new"
                                      @click.stop="openUrl(a.url)"
                                    />
                                    <q-btn
                                      dense
                                      flat
                                      round
                                      icon="delete"
                                      color="negative"
                                      @click.stop="deleteAttachment(a)"
                                    />
                                  </div>
                                </q-item-section>
                              </q-item>
                            </q-list>
                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card>
                </div>
              </div>
            </q-card>

            <div v-if="section.key == 'attendance'">sfdsfsd</div>

            <div v-if="section.key == 'discipline'" class="q-mx-sm q-mb-sm">
              <q-card flat bordered class="bg-grey-1 rounded-borders">
                <q-card-section class="row items-center justify-between">
                  <div class="row items-center">
                    <q-icon name="gpp_maybe" color="primary" class="q-mr-sm" />
                    <div>
                      <div class="text-subtitle2 text-weight-bold">
                        Amonestaciones
                      </div>
                      <div class="text-caption text-grey-7">
                        Consulta rápida de amonestaciones del empleado.
                      </div>
                    </div>
                  </div>

                  <DisciplinaryActionsQuickModal :user-id="targetUserId" />
                </q-card-section>
              </q-card>
            </div>
          </q-expansion-item>

          <q-separator class="q-my-lg" />

          <!-- FOOT FIELDS -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-select
                outlined
                dense
                v-model="form.expedientCode"
                :options="expedientCodeOptions"
                label="Código de expediente"
              />
            </div>

            <div class="col-12 col-md-4">
              <q-select
                outlined
                dense
                v-model="form.owner"
                :options="expedientOwnerOptions"
                label="Responsable / Custodio"
              />
            </div>

            <div class="col-12 col-md-4">
              <q-input
                outlined
                dense
                autogrow
                v-model="form.notes"
                label="Notas generales"
                type="textarea"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- ACTIONS -->
<q-card-actions align="right" class="expedient-dialog-actions" v-if="expedient">
        <q-btn flat label="Cerrar" @click="close" />
        <q-btn
          color="primary"
          icon="save"
          label="Guardar clasificación"
          :loading="saving"
          :disable="saving || loadingExpedient || (!application && !employee)"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

<!-- ✅ ADD DOC MODAL -->
<q-dialog v-model="addDocModal.open" persistent>
  <q-card class="custom-doc-dialog column no-wrap">
    <q-card-section class="custom-doc-header bg-primary">
      <div class="row items-center justify-between no-wrap">
        <div class="row items-center no-wrap text-white">
          <div class="custom-doc-icon">
            <q-icon name="note_add" size="28px" color="white" />
          </div>

          <div>
            <div class="custom-doc-title">Nuevo documento</div>
            <div class="custom-doc-subtitle">
              Agrega un documento personalizado dentro de esta sección.
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          color="white"
          :disable="addDocModal.loading"
          @click="closeAddDocModal"
        />
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="custom-doc-body">
      <div class="custom-doc-helper">
        <q-icon name="tips_and_updates" color="primary" size="20px" />
        <div>
          Escribe un nombre claro para que el documento sea fácil de identificar
          dentro del expediente.
        </div>
      </div>

      <div class="field-label required q-mt-md">Nombre del documento</div>

      <q-input
        v-model="addDocModal.label"
        outlined
        dense
        rounded
        autofocus
        color="primary"
        placeholder="Ej: Certificación médica, Carta de autorización..."
        :disable="addDocModal.loading"
        @keyup.enter="submitAddDocModal"
      >
        <template #prepend>
          <q-icon name="description" color="primary" />
        </template>
      </q-input>

      <q-banner
        v-if="addDocModal.error"
        rounded
        class="custom-doc-error q-mt-md"
      >
        <template #avatar>
          <q-icon name="error" color="negative" />
        </template>
        {{ addDocModal.error }}
      </q-banner>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right" class="custom-doc-actions">
      <q-btn
        flat
        no-caps
        color="negative"
        label="Cancelar"
        icon="close"
        class="custom-doc-action-btn"
        :disable="addDocModal.loading"
        @click="closeAddDocModal"
      />

      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add"
        label="Crear documento"
        class="custom-doc-action-btn"
        :loading="addDocModal.loading"
        :disable="addDocModal.loading || !addDocModal.label.trim()"
        @click="submitAddDocModal"
      />
    </q-card-actions>
  </q-card>
</q-dialog>

<q-dialog v-model="editDocModal.open" persistent>
  <q-card class="custom-doc-dialog column no-wrap">
    <q-card-section class="custom-doc-header bg-primary">
      <div class="row items-center justify-between no-wrap">
        <div class="row items-center no-wrap text-white">
          <div class="custom-doc-icon">
            <q-icon name="edit_document" size="28px" color="white" />
          </div>

          <div>
            <div class="custom-doc-title">Editar documento</div>
            <div class="custom-doc-subtitle">
              Actualiza el nombre visible de este documento personalizado.
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          color="white"
          :disable="editDocModal.loading"
          @click="closeEditDocModal"
        />
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="custom-doc-body">
      <div class="custom-doc-helper">
        <q-icon name="info" color="primary" size="20px" />
        <div>
          Este cambio solo modifica el nombre del documento dentro del expediente.
        </div>
      </div>

      <div class="field-label required q-mt-md">Nombre del documento</div>

      <q-input
        v-model="editDocModal.label"
        outlined
        dense
        rounded
        autofocus
        color="primary"
        placeholder="Nombre del documento"
        :disable="editDocModal.loading"
        @keyup.enter="submitEditDocModal"
      >
        <template #prepend>
          <q-icon name="description" color="primary" />
        </template>
      </q-input>

      <q-banner
        v-if="editDocModal.error"
        rounded
        class="custom-doc-error q-mt-md"
      >
        <template #avatar>
          <q-icon name="error" color="negative" />
        </template>
        {{ editDocModal.error }}
      </q-banner>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right" class="custom-doc-actions">
      <q-btn
        flat
        no-caps
        color="negative"
        label="Cancelar"
        icon="close"
        class="custom-doc-action-btn"
        :disable="editDocModal.loading"
        @click="closeEditDocModal"
      />

      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="save"
        label="Guardar cambios"
        class="custom-doc-action-btn"
        :loading="editDocModal.loading"
        :disable="editDocModal.loading || !editDocModal.label.trim()"
        @click="submitEditDocModal"
      />
    </q-card-actions>
  </q-card>
</q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { Notify, useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import DisciplinaryActionsQuickModal from "../disciplinary/DisciplinaryActionsQuickModal.vue";

const $q = useQuasar();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  application: { type: Object, default: null },
  employee: { type: Object, default: null },

  target: { type: String, default: "employee" },

  docStatuses: { type: Array, default: null },
  expedientCodeOptions: { type: Array, default: null },
  expedientOwnerOptions: { type: Array, default: null },
});

const emit = defineEmits(["update:modelValue", "saved"]);

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const applicationName = computed(() => {
  return props.target == "employee"
    ? props.employee?.name || "N/A"
    : props.application?.candidateName || "N/A";
});

const targetUserId = computed(() => {
  // empleado
  if (props.target === "employee") return props.employee?._id || "";

  // application (ajusta según tu modelo real)
  return props.application?.userId || props.application?.candidateUserId || "";
});

const docStatuses = computed(() => {
  return (
    props.docStatuses || [
      "Original",
      "Copia",
      "Digital",
      "Pendiente",
      "No aplica",
    ]
  );
});

const expedientCodeOptions = computed(() => {
  return (
    props.expedientCodeOptions || ["EXP-NEW", "EXP-TRANSFER", "EXP-REHIRE"]
  );
});

const expedientOwnerOptions = computed(() => {
  return props.expedientOwnerOptions || ["RRHH", "Gerencia", "Supervisor"];
});

const loadingExpedient = ref(false);
const saving = ref(false);

const expedient = ref(null);

// attachments
const attachments = ref([]);
const attachmentsByItem = ref({});

const form = reactive({
  sections: {},
  expedientCode: "EXP-NEW",
  owner: "RRHH",
  notes: "",
});

const pendingUploads = reactive({});

// -------------------------
// ✅ MODAL STATE (ADD DOC)
// -------------------------
const addDocModal = reactive({
  open: false,
  sectionKey: "",
  label: "",
  loading: false,
  error: "",
});

const editDocModal = reactive({
  open: false,
  sectionKey: "",
  itemKey: "",
  label: "",
  loading: false,
  error: "",
});

// -------------------------
// HELPERS
// -------------------------
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function buildSectionsFormFromSnapshot(snapshot) {
  const sections = {};
  const secs = snapshot?.sections || [];

  secs.forEach((sec) => {
    sections[sec.key] = {};
    (sec.items || []).forEach((it) => {
      sections[sec.key][it.key] = {
        received: false,
        date: "",
        status: "Pendiente",
        note: "",
        // label opcional, útil para custom también
        label: it.label || "",
        isCustom: false,
      };
    });
  });

  return sections;
}

function buildPendingUploadsFromFormSections(sectionsObj) {
  const p = {};
  Object.keys(sectionsObj || {}).forEach((secKey) => {
    p[secKey] = {};
    Object.keys(sectionsObj?.[secKey] || {}).forEach((itemKey) => {
      p[secKey][itemKey] = { images: null, documents: null };
    });
  });
  return p;
}

function mergeClassificationOverBase(base, existing) {
  const merged = deepClone(base);

  if (existing?.sections) {
    Object.keys(existing.sections).forEach((secKey) => {
      merged.sections[secKey] = merged.sections[secKey] || {};

      Object.keys(existing.sections[secKey]).forEach((itemKey) => {
        const rawDate = existing.sections[secKey][itemKey]?.date;

        merged.sections[secKey][itemKey] = {
          ...(merged.sections[secKey][itemKey] || {}),
          ...(existing.sections[secKey][itemKey] || {}),
          date: rawDate ? moment(rawDate).format("YYYY-MM-DD") : "",
        };
      });
    });
  }

  merged.expedientCode = existing?.expedientCode || merged.expedientCode;
  merged.owner = existing?.owner || merged.owner;
  merged.notes = existing?.notes || merged.notes;

  return merged;
}

function onToggleReceived(sectionKey, itemKey) {
  const it = form.sections?.[sectionKey]?.[itemKey];
  if (!it) return;

  if (it.received && !it.date) {
    it.date = new Date().toISOString().slice(0, 10);
  }
  if (!it.received) {
    it.status = "Pendiente";
  }
}

function close() {
  // cierra todo
  addDocModal.open = false;
  open.value = false;
}

function openUrl(url) {
  window.open(url, "_blank");
}

function countFiles(v) {
  if (!v) return 0;
  if (Array.isArray(v)) return v.length;
  if (typeof v === "object" && typeof v.length === "number") return v.length;
  return 0;
}

function itemHasAnyAttachment(sectionKey, itemKey) {
  const existing = (
    attachmentsByItem.value?.[sectionKey]?.[itemKey] || []
  ).filter((a) => a && !a.isDeleted);
  if (existing.length) return true;

  const p = pendingUploads?.[sectionKey]?.[itemKey];
  const imgsCount = countFiles(p?.images);
  const docsCount = countFiles(p?.documents);

  return imgsCount + docsCount > 0;
}

// -------------------------
// ✅ sectionsToRender (snapshot + custom items guardados en form.sections)
// -------------------------
const sectionsToRender = computed(() => {
  const snapshotSecs = expedient.value?.templateSnapshot?.sections || [];

  return [...snapshotSecs]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((sec) => {
      const secKey = sec.key;

      const snapshotItems = sec.items || [];
      const snapshotKeys = new Set(snapshotItems.map((x) => x.key));

      const formItemsObj = form.sections?.[secKey] || {};
      const extraKeys = Object.keys(formItemsObj).filter(
        (k) => !snapshotKeys.has(k),
      );

      const extraItems = extraKeys.map((k, idx) => ({
        key: k,
        label: formItemsObj?.[k]?.label || k,
        order: 10000 + idx,
        required: false,
        multiple: true,
        accepts: [],
      }));

      return {
        ...sec,
        items: [...snapshotItems, ...extraItems].sort(
          (a, b) => (a.order || 0) - (b.order || 0),
        ),
      };
    });
});

const sectionStats = computed(() => {
  const out = {};
  const secs = sectionsToRender.value || [];

  secs.forEach((sec) => {
    const sKey = sec.key;
    const items = sec.items || [];
    const total = items.length;

    let received = 0;
    let withAttachments = 0;

    items.forEach((it) => {
      const iKey = it.key;
      const state = form.sections?.[sKey]?.[iKey];

      if (state?.received) received++;
      if (itemHasAnyAttachment(sKey, iKey)) withAttachments++;
    });

    const progress = total ? received / total : 0;

    out[sKey] = {
      total,
      received,
      withAttachments,
      progress,
      complete: total > 0 && received === total,
    };
  });

  return out;
});

// -------------------------
// FETCH
// -------------------------
async function fetchExpedient() {
  loadingExpedient.value = true;
  const params = new URLSearchParams();

  if (props.target == "employee") {
    params.set("employeeId", props.employee?._id);
  }
  if (props.target == "application") {
    params.set("applicationId", props.application?._id);
  }

  if (!props.application?._id && !props.employee?._id) return;

  try {
    const resp = await methodsHttp.getApi(
      `expedient/getExpedient?${params.toString()}`,
    );

    if (!resp?.ok)
      throw new Error(resp?.mensaje || "No se pudo cargar el expediente");

    expedient.value = resp.expedient || null;

    attachments.value = Array.isArray(resp.attachments) ? resp.attachments : [];
    attachmentsByItem.value =
      resp.attachmentsByItem && typeof resp.attachmentsByItem === "object"
        ? resp.attachmentsByItem
        : buildAttachmentsByItem(attachments.value);

    // base snapshot
    const snapshot = expedient.value?.templateSnapshot;
    const base = {
      sections: buildSectionsFormFromSnapshot(snapshot),
      expedientCode: "EXP-NEW",
      owner: "RRHH",
      notes: "",
    };

    const existing = expedient.value?.classification || null;
    const merged = mergeClassificationOverBase(base, existing);

    form.sections = merged.sections;
    form.expedientCode = merged.expedientCode;
    form.owner = merged.owner;
    form.notes = merged.notes;

    // ✅ pendingUploads debe incluir custom items también
    Object.assign(
      pendingUploads,
      buildPendingUploadsFromFormSections(form.sections),
    );
  } catch (e) {
    console.error(e);
    expedient.value = null;
    Notify.create({
      type: "negative",
      message: e?.message || "Error cargando expediente",
    });
  } finally {
    loadingExpedient.value = false;
  }
}

watch(
  () => open.value,
  (v) => {
    if (v) fetchExpedient();
    else {
      expedient.value = null;
      attachments.value = [];
      attachmentsByItem.value = {};
      form.sections = {};
      saving.value = false;
      loadingExpedient.value = false;

      addDocModal.open = false;
      addDocModal.sectionKey = "";
      addDocModal.label = "";
      addDocModal.loading = false;
      addDocModal.error = "";
    }
  },
);

// -------------------------
// SAVE
// -------------------------
function buildClassificationPayload() {
  return deepClone({
    sections: form.sections,
    expedientCode: form.expedientCode,
    owner: form.owner,
    notes: form.notes,
  });
}

const appendAllPendingUploads = (fd) => {
  const secs = sectionsToRender.value || [];

  // docs
  secs.forEach((sec) => {
    const sectionKey = sec.key;
    (sec.items || []).forEach((it) => {
      const itemKey = it.key;
      const p = pendingUploads?.[sectionKey]?.[itemKey];
      const docs = Array.isArray(p?.documents) ? p.documents : [];

      docs.forEach((file) => {
        fd.append("documents", file);
        fd.append("attachmentMetas", JSON.stringify({ sectionKey, itemKey }));
      });
    });
  });

  // images
  secs.forEach((sec) => {
    const sectionKey = sec.key;
    (sec.items || []).forEach((it) => {
      const itemKey = it.key;
      const p = pendingUploads?.[sectionKey]?.[itemKey];
      const imgs = Array.isArray(p?.images) ? p.images : [];

      imgs.forEach((file) => {
        fd.append("images", file);
        fd.append("attachmentMetas", JSON.stringify({ sectionKey, itemKey }));
      });
    });
  });
};

const clearAllPendingUploads = () => {
  const secs = sectionsToRender.value || [];
  secs.forEach((sec) => {
    const s = sec.key;
    (sec.items || []).forEach((it) => {
      const i = it.key;
      if (!pendingUploads?.[s]?.[i]) return;
      pendingUploads[s][i].images = null;
      pendingUploads[s][i].documents = null;
    });
  });
};

const save = async () => {
  const expedientId = expedient.value?._id;
  if (!expedientId) return;

  saving.value = true;
  try {
    const classification = buildClassificationPayload();

    const fd = new FormData();
    fd.append("classification", JSON.stringify(classification));
    fd.append("folder", `recruitment/expedients/${expedientId}`);

    appendAllPendingUploads(fd);

    const resp =
      typeof methodsHttp.putFormData === "function"
        ? await methodsHttp.putFormData(
            `expedient/saveExpedientClassification/${expedientId}`,
            fd,
          )
        : await methodsHttp.putApi(
            `expedient/saveExpedientClassification/${expedientId}`,
            fd,
          );

    if (!resp?.ok) {
      return Notify.create({
        type: "negative",
        message: resp?.mensaje || "Error al guardar clasificación",
      });
    }

    if (resp.expedient) expedient.value = resp.expedient;

    if (Array.isArray(resp.attachments)) {
      attachments.value = resp.attachments;
      attachmentsByItem.value = buildAttachmentsByItem(attachments.value);
    }

    clearAllPendingUploads();

    Notify.create({ type: "positive", message: "Clasificación guardada." });
    emit("saved", classification);
    open.value = false;
  } catch (e) {
    console.error(e);
    Notify.create({ type: "negative", message: "Error al guardar." });
  } finally {
    saving.value = false;
  }
};

// -------------------------
// CREATE EXPEDIENT
// -------------------------
const createExpedient = async () => {
  const applicationId = props.application?._id;
  const userId = props.employee?._id;

  if (!applicationId && !userId) {
    return Notify.create({
      type: "negative",
      message: "No hay applicationId o employeeId para crear el expediente.",
    });
  }

  saving.value = true;
  try {
    const payload = {
      applicationId,
      userId,
      templateCode: null,
      notes: "",
    };

    const resp = await methodsHttp.postApi(
      "expedient/createExpedient",
      payload,
    );

    if (!resp?.ok) {
      return Notify.create({
        type: "negative",
        message: resp?.mensaje || "No se pudo crear el expediente",
      });
    }

    expedient.value = resp.expedient || null;

    attachments.value = Array.isArray(resp.attachments) ? resp.attachments : [];
    attachmentsByItem.value =
      resp.attachmentsByItem && typeof resp.attachmentsByItem === "object"
        ? resp.attachmentsByItem
        : buildAttachmentsByItem(attachments.value);

    const snapshot = expedient.value?.templateSnapshot;

    const base = {
      sections: buildSectionsFormFromSnapshot(snapshot),
      expedientCode: "EXP-NEW",
      owner: "RRHH",
      notes: expedient.value?.notes || "",
    };

    const existing = expedient.value?.classification || null;
    const merged = mergeClassificationOverBase(base, existing);

    form.sections = merged.sections;
    form.expedientCode = merged.expedientCode;
    form.owner = merged.owner;
    form.notes = merged.notes;

    Object.assign(
      pendingUploads,
      buildPendingUploadsFromFormSections(form.sections),
    );

    Notify.create({
      type: "positive",
      message: resp?.mensaje || "Expediente creado con éxito.",
    });
  } catch (e) {
    console.error(e);
    Notify.create({ type: "negative", message: "Error creando expediente." });
  } finally {
    saving.value = false;
  }
};

// -------------------------
// DELETE ATTACHMENT
// -------------------------
const deleteAttachment = async (a) => {
  try {
    const id = a?._id;
    if (!id) return;

    const ok = await new Promise((resolve) => {
      $q.dialog({
        title: "Eliminar adjunto",
        message: "¿Seguro que deseas eliminar este archivo?",
        cancel: true,
        persistent: true,
      })
        .onOk(() => resolve(true))
        .onCancel(() => resolve(false));
    });

    if (!ok) return;

    const resp = await methodsHttp.deleteApi(
      `expedient/deleteAttachment/${id}`,
    );

    if (!resp?.ok) {
      return Notify.create({
        type: "negative",
        message: resp?.mensaje || "No se pudo eliminar el adjunto",
      });
    }

    attachments.value = (attachments.value || []).filter((x) => x?._id !== id);
    attachmentsByItem.value = buildAttachmentsByItem(attachments.value);

    Notify.create({ type: "positive", message: "Adjunto eliminado." });
  } catch (e) {
    console.error(e);
    Notify.create({ type: "negative", message: "Error eliminando adjunto." });
  }
};

// -------------------------
// ✅ ADD CUSTOM ITEM (modal + endpoint)
// -------------------------
function openAddDocModal(sectionKey) {
  addDocModal.sectionKey = sectionKey;
  addDocModal.label = "";
  addDocModal.error = "";
  addDocModal.open = true;
}

function closeAddDocModal() {
  // if(addDocModal.loading) return;
  addDocModal.open = false;
  addDocModal.sectionKey = "";
  addDocModal.label = "";
  addDocModal.error = "";
}

function slugifyKey(label) {
  return String(label || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function buildLocalCustomKey(sectionKey, label) {
  const base = slugifyKey(label) || "doc";
  let key = `custom_${base}`;
  const secObj = (form.sections[sectionKey] = form.sections[sectionKey] || {});
  if (secObj[key]) key = `custom_${base}_${Date.now().toString().slice(-6)}`;
  return key;
}

async function submitAddDocModal() {
  const expedientId = expedient.value?._id;
  const sectionKey = addDocModal.sectionKey;
  const label = String(addDocModal.label || "").trim();

  if (!expedientId || !sectionKey || !label) return;

  addDocModal.loading = true;
  addDocModal.error = "";

  try {
    // ✅ ENDPOINT (debes crearlo en backend)
    // Espera: { ok:true, itemKey:"custom_xxx", label:"...", expedient?:..., mensaje?:... }
    const resp = await methodsHttp.postApi(
      `expedient/addCustomItem/${expedientId}`,
      { sectionKey, label },
    );

    if (!resp?.ok) {
      throw new Error(resp?.mensaje || "No se pudo crear el documento.");
    }

    const itemKey = resp?.itemKey || resp?.item?.key || null;
    const finalKey = itemKey || buildLocalCustomKey(sectionKey, label);
    const finalLabel = resp?.label || label;

    // ✅ crea estado en form (si el backend devolvió key, úsalo)
    form.sections[sectionKey] = form.sections[sectionKey] || {};
    if (!form.sections[sectionKey][finalKey]) {
      form.sections[sectionKey][finalKey] = {
        received: false,
        date: "",
        status: "Pendiente",
        note: "",
        label: finalLabel,
        isCustom: true,
      };
    } else {
      // si ya existía, solo asegura label
      form.sections[sectionKey][finalKey].label =
        form.sections[sectionKey][finalKey].label || finalLabel;
      form.sections[sectionKey][finalKey].isCustom = true;
    }

    // ✅ crea espacio en pendingUploads
    pendingUploads[sectionKey] = pendingUploads[sectionKey] || {};
    if (!pendingUploads[sectionKey][finalKey]) {
      pendingUploads[sectionKey][finalKey] = { images: null, documents: null };
    }

    if (resp?.expedient) {
      expedient.value = resp.expedient;
    }

    Notify.create({ type: "positive", message: "Documento agregado." });
    closeAddDocModal();
  } catch (e) {
    console.error(e);
    addDocModal.error = e?.message || "Error creando el documento.";
    Notify.create({ type: "negative", message: addDocModal.error });
  } finally {
    addDocModal.loading = false;
  }
}

function isCustomItem(sectionKey, itemKey) {
  const node = form.sections?.[sectionKey]?.[itemKey];
  return !!node?.isCustom || String(itemKey || "").startsWith("custom_");
}

function openEditDocModal(sectionKey, itemKey) {
  editDocModal.sectionKey = sectionKey;
  editDocModal.itemKey = itemKey;
  editDocModal.label = form.sections?.[sectionKey]?.[itemKey]?.label || "";
  editDocModal.error = "";
  editDocModal.open = true;
}

function closeEditDocModal() {
  editDocModal.open = false;
  editDocModal.sectionKey = "";
  editDocModal.itemKey = "";
  editDocModal.label = "";
  editDocModal.loading = false;
  editDocModal.error = "";
}

async function submitEditDocModal() {
  const expedientId = expedient.value?._id;
  const sectionKey = editDocModal.sectionKey;
  const itemKey = editDocModal.itemKey;
  const label = String(editDocModal.label || "").trim();

  if (!expedientId || !sectionKey || !itemKey || !label) return;

  editDocModal.loading = true;
  editDocModal.error = "";

  try {
    const resp = await methodsHttp.putApi(
      `expedient/updateCustomItemLabel/${expedientId}`,
      { sectionKey, itemKey, label },
    );

    if (!resp?.ok)
      throw new Error(resp?.mensaje || "No se pudo actualizar el nombre.");

    // ✅ actualiza local
    if (form.sections?.[sectionKey]?.[itemKey]) {
      form.sections[sectionKey][itemKey].label = label;
      form.sections[sectionKey][itemKey].isCustom = true;
    }

    if (resp?.expedient) expedient.value = resp.expedient;

    Notify.create({ type: "positive", message: "Nombre actualizado." });
    closeEditDocModal();
  } catch (e) {
    console.error(e);
    editDocModal.error = e?.message || "Error actualizando.";
    Notify.create({ type: "negative", message: editDocModal.error });
  } finally {
    editDocModal.loading = false;
  }
}

async function confirmDeleteItem(sectionKey, itemKey) {
  const expedientId = expedient.value?._id;
  if (!expedientId) return;

  const ok = await new Promise((resolve) => {
    $q.dialog({
      title: "Eliminar documento",
      message: "¿Seguro que deseas eliminar este documento?",
      cancel: true,
      persistent: true,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });

  if (!ok) return;

  try {
    const resp = await methodsHttp.postApi(
      `expedient/deleteCustomItem/${expedientId}`,
      { sectionKey, itemKey },
    );

    if (!resp?.ok) throw new Error(resp?.mensaje || "No se pudo eliminar.");

    // ✅ limpia local form
    if (form.sections?.[sectionKey]?.[itemKey]) {
      delete form.sections[sectionKey][itemKey];
    }

    // ✅ limpia pendingUploads
    if (pendingUploads?.[sectionKey]?.[itemKey]) {
      delete pendingUploads[sectionKey][itemKey];
    }

    // ✅ limpia attachments (si existían)
    attachments.value = (attachments.value || []).filter(
      (a) => !(a?.sectionKey === sectionKey && a?.itemKey === itemKey),
    );
    attachmentsByItem.value = buildAttachmentsByItem(attachments.value);

    if (resp?.expedient) expedient.value = resp.expedient;

    Notify.create({ type: "positive", message: "Documento eliminado." });
  } catch (e) {
    console.error(e);
    Notify.create({
      type: "negative",
      message: e?.message || "Error eliminando.",
    });
  }
}

// -------------------------
// ATTACHMENTS HELPERS
// -------------------------
function buildAttachmentsByItem(list) {
  const map = {};
  (list || []).forEach((a) => {
    if (!a || a.isDeleted) return;
    const s = a.sectionKey;
    const i = a.itemKey;
    if (!s || !i) return;

    if (!map[s]) map[s] = {};
    if (!map[s][i]) map[s][i] = [];
    map[s][i].push(a);
  });

  Object.keys(map).forEach((s) => {
    Object.keys(map[s]).forEach((i) => {
      map[s][i].sort((x, y) => {
        const dx = new Date(x.uploadedAt || x.createdAt || 0).getTime();
        const dy = new Date(y.uploadedAt || y.createdAt || 0).getTime();
        return dy - dx;
      });
    });
  });

  return map;
}

function getExistingAttachments(sectionKey, itemKey) {
  return attachmentsByItem.value?.[sectionKey]?.[itemKey] || [];
}

function hasExistingAttachments(sectionKey, itemKey) {
  return getExistingAttachments(sectionKey, itemKey).length > 0;
}

function isImageUrl(url) {
  return /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(url || "");
}

function fileNameFromUrl(url) {
  try {
    const s = String(url || "");
    const noQuery = s.split("?")[0];
    return noQuery.split("/").pop() || s;
  } catch {
    return url;
  }
}

function isImageAttachment(a) {
  const mt = String(a?.mimeType || "").toLowerCase();
  if (mt.startsWith("image/")) return true;
  return isImageUrl(a?.url);
}

function attachmentLabel(a) {
  return a?.originalName || fileNameFromUrl(a?.url) || "Archivo";
}

function attachmentMeta(a) {
  const mt = a?.mimeType ? a.mimeType : "Archivo";
  const sz = a?.size ? formatBytes(a.size) : "";
  const dt =
    a?.uploadedAt || a?.createdAt
      ? formatDate(a.uploadedAt || a.createdAt)
      : "";
  return [mt, sz, dt].filter(Boolean).join(" • ");
}

function fileIcon(a) {
  const mt = String(a?.mimeType || "").toLowerCase();
  const name = String(a?.originalName || "").toLowerCase();

  if (mt.includes("pdf") || name.endsWith(".pdf")) return "picture_as_pdf";
  if (mt.includes("word") || name.endsWith(".doc") || name.endsWith(".docx"))
    return "description";
  if (
    mt.includes("excel") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".csv")
  )
    return "grid_on";
  if (
    mt.includes("zip") ||
    name.endsWith(".zip") ||
    name.endsWith(".rar") ||
    name.endsWith(".7z")
  )
    return "folder_zip";
  if (mt.startsWith("image/") || isImageUrl(a?.url)) return "image";
  return "attach_file";
}

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (!n) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v = v / 1024;
    u++;
  }
  const fixed = u === 0 ? 0 : 1;
  return `${v.toFixed(fixed)} ${units[u]}`;
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return String(iso || "");
  }
}
</script>

<style scoped>
.expedient-dialog {
  min-height: 100vh;
  background: #f8fafc;
}

.expedient-main-header {
  min-height: 82px;
  padding: 16px 22px;
  color: white;
}

.expedient-main-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  margin-right: 14px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.expedient-main-title {
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.05;
}

.expedient-main-subtitle {
  margin-top: 5px;
  max-width: 900px;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.88;
}

.expedient-dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  background:
    radial-gradient(circle at top right, rgba(25, 100, 162, 0.08), transparent 24%),
    #f8fafc;
}

.expedient-dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
}

.expedient-dialog-actions .q-btn {
  border-radius: 999px;
  font-weight: 800;
  padding-left: 18px;
  padding-right: 18px;
}

.custom-doc-dialog {
  width: 560px;
  max-width: 94vw;
  border-radius: 22px;
  overflow: hidden;
}

.custom-doc-header {
  min-height: 78px;
  padding: 16px 20px;
  color: white;
}

.custom-doc-icon {
  width: 46px;
  height: 46px;
  min-width: 46px;
  margin-right: 12px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.custom-doc-title {
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.05;
}

.custom-doc-subtitle {
  margin-top: 4px;
  max-width: 380px;
  font-size: 0.78rem;
  font-weight: 600;
  opacity: 0.86;
}

.custom-doc-body {
  padding: 18px;
  background: #f8fafc;
}

.custom-doc-helper {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 18px;
  color: #475569;
  background: rgba(25, 100, 162, 0.06);
  border: 1px solid rgba(25, 100, 162, 0.1);
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.45;
}

.field-label {
  margin-bottom: 6px;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-label.required::before {
  content: "* ";
  color: #e53935;
}

.custom-doc-error {
  color: #991b1b;
  background: #fee2e2;
  border: 1px solid rgba(239, 68, 68, 0.18);
}

.custom-doc-actions {
  padding: 14px 18px;
  background: #ffffff;
}

.custom-doc-action-btn {
  border-radius: 999px;
  padding-left: 18px;
  padding-right: 18px;
  font-weight: 800;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

:deep(.q-field--outlined.q-field--rounded .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 600px) {
  .expedient-main-header,
  .custom-doc-header {
    padding: 14px;
  }

  .expedient-main-subtitle,
  .custom-doc-subtitle {
    max-width: 240px;
  }

  .expedient-dialog-body {
    padding: 12px;
  }

  .custom-doc-body {
    padding: 14px;
  }
}
</style>
