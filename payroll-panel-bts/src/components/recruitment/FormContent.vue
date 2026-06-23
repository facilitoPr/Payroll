<template>
  <div>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-subtitle1 text-weight-bold">
          Formularios de reclutamiento
        </div>
        <div class="text-caption text-grey-6">
          Crea formularios seleccionando campos.
        </div>
      </div>

      <q-btn
        color="primary"
        icon="add"
        label="Crear formulario"
        @click="openCreateDialog"
      />
    </div>

    <q-table
      flat
      bordered
      :rows="forms"
      :columns="formsColumns"
      row-key="_id"
      :loading="tableLoading"
      no-data-label="No hay formularios creados."
    >
      <template v-slot:body-cell-fieldsCount="props">
        <q-td :props="props">
          <q-chip dense color="primary" text-color="white">
            {{ props.row.fields.length }} campos
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-link="props">
        <q-td :props="props">
          <div class="row items-center no-wrap q-gutter-sm">
            <q-input
              dense
              outlined
              readonly
              style="min-width: 260px; max-width: 360px"
              :model-value="props.row.link"
            />
            <q-btn
              dense
              flat
              round
              icon="content_copy"
              @click="copyLink(props.row.link)"
            >
              <q-tooltip>Copiar link</q-tooltip>
            </q-btn>
            <q-btn
              dense
              flat
              round
              icon="open_in_new"
              @click="previewForm(props.row)"
            >
              <q-tooltip>Previsualizar</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-autoAiEvaluation="props">
        <q-td :props="props" class="text-center">
          <q-icon
            name="smart_toy"
            :color="props.row.autoAiEvaluation ? 'deep-purple-5' : 'grey-5'"
          >
            <q-tooltip>
              {{
                props.row.autoAiEvaluation
                  ? "Evaluación automática con IA activada"
                  : "Evaluación solo manual"
              }}
            </q-tooltip>
          </q-icon>
        </q-td>
      </template>

      <template v-slot:body-cell-isActive="props">
        <q-td :props="props">
          <q-badge :color="props.row.isActive ? 'green-6' : 'grey-6'" rounded>
            {{ props.row.isActive ? "Activo" : "Inactivo" }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            dense
            flat
            round
            icon="visibility"
            @click="previewForm(props.row)"
          >
            <q-tooltip>Ver campos</q-tooltip>
          </q-btn>

          <q-btn
            dense
            flat
            round
            icon="edit"
            color="primary"
            @click="openEditDialog(props.row)"
          >
            <q-tooltip>Editar formulario</q-tooltip>
          </q-btn>

          <q-btn
            dense
            flat
            round
            icon="delete"
            color="negative"
            @click="openConfirmDeleteForm(props.row)"
          >
            <q-tooltip>Eliminar</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- DIALOG: CREAR / EDITAR FORM -->
    <q-dialog v-model="createDialog" persistent>
      <q-card style="width: 960px; max-width: 96vw">
        <q-card-section class="row items-center justify-between bg-primary text-white">
            <div class="row items-center text-white q-gutter-x-sm">
          <div class="col-auto">
            <q-icon size="xl" name="description" color="white" />
          </div>

          <div>
            <div class="text-h6 text-weight-bold">
              {{
                isEditMode
                  ? "Editar formulario de reclutamiento"
                  : "Crear formulario de reclutamiento"
              }}
            </div>
            <div class="text-caption">
              Selecciona los campos que quieres habilitar.
            </div>
          </div>
          </div>
          <q-btn dense flat round icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-input
            v-model="newForm.title"
            outlined
            dense
            label="Título del formulario"
            class="q-mb-md"
          />

          <q-select
            v-model="newForm.jobPosition"
            outlined
            dense
            label="Puesto de trabajo"
            class="q-mb-md"
            :options="jobPositionOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            clearable
            :loading="loadingJobPositions"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ scope.opt.label }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ scope.opt.departmentName }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <!-- opcional: cómo se ve el valor seleccionado -->
            <template v-slot:selected-item="scope">
              <div class="column">
                <div class="text-weight-medium">{{ scope.opt.label }}</div>
                <div class="text-caption text-grey-7">
                  {{ scope.opt.departmentName }}
                </div>
              </div>
            </template>
          </q-select>

          <q-toggle
            v-model="newForm.autoAiEvaluation"
            color="primary"
            left-label
            label="Evaluar automáticamente con IA al recibir una solicitud"
          />

          <div class="text-caption text-grey-6 q-mb-md">
            Si está activo, cada vez que un candidato complete este formulario,
            el sistema ejecutará el agente de IA de reclutamiento y guardará la
            evaluación en la solicitud automáticamente.
          </div>

          <q-select
            v-model="newForm.aiAgent"
            outlined
            dense
            label="Agente IA de reclutamiento"
            class="q-mb-md q-mt-sm"
            :options="recruitmentAgents"
            option-label="name"
            option-value="_id"
            emit-value
            map-options
            clearable
            :disable="!newForm.autoAiEvaluation"
            :loading="loadingAgents"
          />

          <q-separator class="q-my-md" />

          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6">
              <q-file
                v-model="documentsFiles"
                outlined
                dense
                label="Documentos"
                multiple
                counter
                use-chips
                clearable
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              >
                <template v-slot:prepend>
                  <q-icon name="description" />
                </template>
              </q-file>

              <!-- EXISTENTES -->
              <div
                v-if="
                  Array.isArray(newForm.documents) && newForm.documents.length
                "
                class="q-mt-sm"
              >
                <div class="text-caption text-grey-7 q-mb-xs">
                  Documentos actuales
                </div>

                <q-list bordered separator class="rounded-borders">
                  <q-item v-for="(doc, idx) in newForm.documents" :key="idx">
                    <q-item-section avatar>
                      <q-icon name="insert_drive_file" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-weight-medium">
                        {{ getFileName(doc) }}
                      </q-item-label>
                      <q-item-label caption>Documento</q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <div class="row q-gutter-xs">
                        <q-btn
                          dense
                          flat
                          round
                          icon="open_in_new"
                          @click="openUrl(doc)"
                        >
                          <q-tooltip>Ver</q-tooltip>
                        </q-btn>
                        <q-btn
                          dense
                          flat
                          round
                          icon="delete"
                          color="negative"
                          @click="removeExistingDocument(idx)"
                        >
                          <q-tooltip>Quitar</q-tooltip>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>

            <div class="col-12 col-md-6">
              <q-file
                v-model="imagesFiles"
                outlined
                dense
                label="Imágenes"
                multiple
                counter
                use-chips
                clearable
                accept="image/*"
              >
                <template v-slot:prepend>
                  <q-icon name="image" />
                </template>
              </q-file>

              <!-- EXISTENTES -->
              <div
                v-if="Array.isArray(newForm.images) && newForm.images.length"
                class="q-mt-sm"
              >
                <div class="text-caption text-grey-7 q-mb-xs">
                  Imágenes actuales
                </div>

                <div class="row q-col-gutter-sm">
                  <div
                    v-for="(img, idx) in newForm.images"
                    :key="idx"
                    class="col-6 col-sm-4 col-md-6 col-lg-4"
                  >
                    <div class="image-tile">
                      <q-img
                        :src="getUrl(img)"
                        ratio="1"
                        spinner-color="primary"
                        class="rounded-borders"
                      />
                      <div class="image-actions">
                        <q-btn
                          dense
                          round
                          flat
                          icon="open_in_new"
                          color="white"
                          @click="openUrl(img)"
                        />
                        <q-btn
                          dense
                          round
                          flat
                          icon="delete"
                          color="negative"
                          @click="removeExistingImage(idx)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div
              v-for="group in fieldGroups"
              :key="group.key"
              class="col-12 col-md-6"
            >
              <q-card flat bordered class="q-pa-sm">
                <div class="row items-center justify-between q-mb-xs">
                  <div class="text-subtitle2 text-weight-bold">
                    {{ group.title }}
                  </div>
                  <div class="row items-center q-gutter-xs">
                    <q-btn
                      dense
                      flat
                      icon="done_all"
                      label="Todos"
                      @click="selectAllInGroup(group.key)"
                    />
                    <q-btn
                      dense
                      flat
                      icon="remove_done"
                      label="Ninguno"
                      @click="clearAllInGroup(group.key)"
                    />
                  </div>
                </div>

                <q-separator class="q-mb-sm" />

                <q-option-group
                  v-model="newForm.selectedFields"
                  type="checkbox"
                  :options="
                    group.fields.map((f) => ({ label: f.label, value: f.key }))
                  "
                />
              </q-card>
            </div>
          </div>

          <div class="col-12 q-mt-md">
            <label>
              <b> NOTA DEL PUESTO </b>
            </label>
            <q-input
              v-model="newForm.description"
              type="textarea"
              outlined
              dense
              color="primary"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            :icon="isEditMode ? 'save' : 'add_circle'"
            :label="isEditMode ? 'Guardar cambios' : 'Crear'"
            :loading="savingForm"
            :disable="!canCreate || savingForm"
            @click="createOrUpdateForm"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIALOG: LINK CREADO -->
    <q-dialog v-model="linkDialog">
      <q-card style="width: 520px; max-width: 92vw">
        <q-card-section>
          <div class="text-h6 text-weight-bold">
            Formulario {{ isEditMode ? "actualizado" : "creado" }}
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">
            Comparte este enlace para que los candidatos lo llenen.
          </div>
        </q-card-section>

        <q-card-section>
          <q-input
            outlined
            dense
            readonly
            :model-value="createdLink"
            label="Link público"
          >
            <template v-slot:append>
              <q-btn
                dense
                flat
                round
                icon="content_copy"
                @click="copyLink(createdLink)"
              />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
          <q-btn
            color="primary"
            label="Previsualizar"
            @click="previewFormByLink"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIALOG: PREVIEW FORM -->
    <q-dialog v-model="previewDialog" maximized>
      <q-card class="bg-grey-1">
        <q-card-section class="row items-center justify-between bg-white">
          <div class="row items-center q-gutter-md">
            <q-avatar color="primary" text-color="white" icon="description" />
            <div>
              <div class="text-h6 text-weight-bold">
                {{ previewFormData?.title }}
              </div>
              <div class="text-caption text-grey-6">
                Vista previa del formulario público con los campos
                seleccionados.
              </div>
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-btn dense flat round icon="close" v-close-popup />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section v-if="previewFormData" class="q-pa-md">
          <div class="row justify-center">
            <div style="width: 900px; max-width: 100%">
              <q-banner class="bg-primary text-white rounded-borders q-mb-md">
                <div class="row items-center justify-between">
                  <div class="text-body2">
                    Link público:
                    <span class="text-weight-bold">
                      {{ previewFormData.link }}
                    </span>
                  </div>
                  <q-btn
                    dense
                    flat
                    round
                    icon="content_copy"
                    text-color="white"
                    @click="copyLink(previewFormData.link)"
                  />
                </div>
              </q-banner>

              <q-expansion-item
                v-for="group in previewGroupedFields"
                :key="group.groupKey"
                :label="group.groupTitle"
                icon="folder"
                default-opened
                expand-separator
                class="bg-white rounded-borders q-mb-sm"
                header-class="text-weight-bold"
              >
                <q-card flat class="q-pa-md">
                  <div class="row q-col-gutter-md">
                    <div
                      v-for="f in group.fields"
                      :key="f.key"
                      :class="previewColClass(f.type)"
                    >
                      <q-input
                        v-if="['text', 'email', 'number'].includes(f.type)"
                        outlined
                        dense
                        :label="f.label"
                        :type="
                          f.type === 'email'
                            ? 'email'
                            : f.type === 'number'
                            ? 'number'
                            : 'text'
                        "
                        :placeholder="f.placeholder"
                        readonly
                      >
                        <template v-slot:append>
                          <q-badge
                            v-if="f.required"
                            color="red-6"
                            rounded
                            label="Req."
                          />
                        </template>
                      </q-input>

                      <q-input
                        v-else-if="f.type === 'date'"
                        outlined
                        dense
                        type="date"
                        :label="f.label"
                        readonly
                      >
                        <template v-slot:append>
                          <q-badge
                            v-if="f.required"
                            color="red-6"
                            rounded
                            label="Req."
                          />
                        </template>
                      </q-input>

                      <q-input
                        v-else-if="f.type === 'textarea'"
                        outlined
                        dense
                        autogrow
                        type="textarea"
                        :label="f.label"
                        :placeholder="f.placeholder"
                        readonly
                      >
                        <template v-slot:append>
                          <q-badge
                            v-if="f.required"
                            color="red-6"
                            rounded
                            label="Req."
                          />
                        </template>
                      </q-input>

                      <q-select
                        v-else-if="
                          ['select', 'yesno', 'file-select'].includes(f.type)
                        "
                        outlined
                        dense
                        :label="f.label"
                        readonly
                        :options="optionsForField(f)"
                      >
                        <template v-slot:append>
                          <q-badge
                            v-if="f.required"
                            color="red-6"
                            rounded
                            label="Req."
                          />
                        </template>

                        <template v-if="f.type === 'file-select'" v-slot:hint>
                          * Campo de archivo (selección mock)
                        </template>
                      </q-select>

                      <q-checkbox
                        v-else-if="f.type === 'checkbox'"
                        :label="f.label"
                        disable
                      />
                    </div>
                  </div>
                </q-card>
              </q-expansion-item>

              <q-card
                flat
                bordered
                class="bg-white q-pa-md q-mt-md rounded-borders"
              >
                <div class="row items-center justify-between">
                  <div class="text-caption text-grey-7">
                    * Esto es solo una vista previa estética.
                  </div>
                  <q-btn
                    color="primary"
                    label="Cerrar vista previa"
                    v-close-popup
                  />
                </div>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- DIALOG: SUBIR DOCUMENTO REQUISITOS -->
    <q-dialog v-model="uploadDialog" persistent>
      <q-card style="width: 480px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Documento de requisitos</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Sube un archivo con los requisitos del puesto (PDF, Word, etc.).
          </div>
        </q-card-section>

        <q-card-section>
          <q-file
            v-model="requirementFile"
            outlined
            dense
            label="Seleccionar archivo"
            counter
            :clearable="!uploadingRequirement"
            :disable="uploadingRequirement"
            accept="*"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>

          <div class="text-caption text-grey-6 q-mt-sm">
            Tamaño recomendado: máximo 5–10 MB. Solo un archivo.
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            label="Cancelar"
            :disable="uploadingRequirement"
            v-close-popup
          />
          <q-btn
            color="primary"
            label="Subir"
            :loading="uploadingRequirement"
            @click="handleUploadRequirement"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIALOG: CONFIRMAR ELIMINACIÓN FORMULARIO -->
    <q-dialog v-model="confirmDeleteFormDialog">
      <q-card style="width: 420px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Eliminar formulario</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            ¿Seguro que deseas eliminar este formulario de reclutamiento? Esta
            acción no se puede deshacer.
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="negative"
            label="Eliminar"
            :loading="deletingForm"
            @click="confirmRemoveForm"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIALOG: CONFIRMAR ELIMINACIÓN DOCUMENTO -->
    <q-dialog v-model="confirmDeleteDocDialog">
      <q-card style="width: 420px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Eliminar documento</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            ¿Seguro que deseas eliminar el documento de requisitos asociado a
            este formulario?
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="negative"
            label="Eliminar"
            :loading="deletingRequirementDoc"
            @click="confirmDeleteRequirementDoc"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { Notify, copyToClipboard } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import { recruitmentSteps, optionsMap } from "src/data/recruitmentFormData";

/**
 * Derivar fieldGroups desde recruitmentSteps
 */
const fieldGroups = recruitmentSteps.map((s) => ({
  key: `step_${s.name}`,
  title: `${s.name}. ${s.title}`,
  fields: s.fields,
}));

/**
 * Flat allFields también desde recruitmentSteps
 */
const allFields = recruitmentSteps.flatMap((step) =>
  step.fields.map((f) => ({
    ...f,
    groupKey: `step_${step.name}`,
    groupTitle: `${step.name}. ${step.title}`,
  }))
);

/** URL base del FRONT para armar link público */
const frontendUrl = window.location.hostname.includes("localhost")
  ? `http://localhost:9000`
  : `https://guimanfer-payroll.netlify.app`;

/** STATE */
const forms = ref([]);
const tableLoading = ref(false);
const savingForm = ref(false);

/** Crear / Editar */
const createDialog = ref(false);
const linkDialog = ref(false);
const previewDialog = ref(false);
const createdLink = ref("");
const previewFormData = ref(null);

const isEditMode = ref(false);
const editingFormId = ref(null);

const jobPositions = ref([]);
const loadingJobPositions = ref(false);

const newForm = reactive({
  title: "Formulario de Reclutamiento",
  selectedFields: [],
  jobPosition: null,
  aiAgent: null,
  description: "",
  documents: [],
  images: [],
  autoAiEvaluation: false,
});

/** Modal de upload */
const uploadDialog = ref(false);
const requirementFile = ref(null);
const uploadingRequirement = ref(false);

const documentsFiles = ref([]); // múltiples docs
const imagesFiles = ref([]); // múltiples imágenes

/** Helpers */
const canCreate = computed(
  () =>
    newForm.title.trim().length > 3 &&
    newForm.selectedFields.length > 0 &&
    newForm.jobPosition != null
);

const formsColumns = [
  { name: "actions", label: "Acciones", field: "actions", align: "left" },
  {
    name: "title",
    label: "Título",
    field: "title",
    align: "left",
    sortable: true,
  },
  { name: "fieldsCount", label: "Campos", field: "fieldsCount", align: "left" },
  {
    name: "createdAt",
    label: "Creado",
    field: "createdAt",
    align: "left",
    sortable: true,
  },
  {
    name: "autoAiEvaluation",
    label: "IA auto",
    field: "autoAiEvaluation",
    align: "center",
  },
  { name: "isActive", label: "Estado", field: "isActive", align: "left" },
  { name: "link", label: "Link público", field: "link", align: "left" },
];

const formatDate = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
};

/**
 * Enriquecer los fields que vienen del backend
 */
const enrichFieldsFromBackend = (backendFields = []) => {
  return backendFields
    .map((bf, index) => {
      const meta = allFields.find((m) => m.key === bf.key) || {};
      return {
        ...meta,
        key: bf.key,
        groupKey: bf.groupKey || meta.groupKey,
        groupTitle: meta.groupTitle || "Otros",
        required:
          typeof bf.requiredOverride === "boolean"
            ? bf.requiredOverride
            : meta.required ?? false,
        order:
          typeof bf.order === "number"
            ? bf.order
            : typeof meta.order === "number"
            ? meta.order
            : index,
      };
    })
    .sort((a, b) => a.order - b.order);
};

const mapBackendForm = (f) => {
  return {
    id: f._id,
    title: f.title,
    description: f.description || "",
    link: `${frontendUrl}/recruitment/${f.publicToken}`,
    isActive: f.isActive,
    createdAt: formatDate(f.createdAt),
    fields: enrichFieldsFromBackend(f.fields),
    autoAiEvaluation: !!f.autoAiEvaluation,
    aiAgent: f.aiAgent || null,

    jobPosition:
      typeof f.jobPosition === "object"
        ? f.jobPosition?._id
        : f.jobPosition || null,
    documents: f.documents || [],
    images: f.images || [],
  };
};

const loadForms = async () => {
  tableLoading.value = true;
  try {
    const resp = await methodsHttp.getApi("recruitment/getRecruitmentForms");

    if (resp.ok) {
      forms.value = (resp.forms || []).map(mapBackendForm);
    } else {
      forms.value = [];
    }
  } catch (error) {
    console.error("Error loadForms:", error);
    Notify.create({
      type: "negative",
      message: "Error al cargar formularios",
    });
  } finally {
    tableLoading.value = false;
  }
};

/** UI HANDLERS */
const resetFormState = () => {
  newForm.title = "Formulario de Reclutamiento";
  newForm.selectedFields = [];
  newForm.jobPosition = null;
  newForm.description = "";
    newForm.aiAgent = null;

  // newForm.document = null;
  isEditMode.value = false;
  editingFormId.value = null;
  newForm.autoAiEvaluation = false;
  documentsFiles.value = [];
  imagesFiles.value = [];
};

const openCreateDialog = () => {
  resetFormState();
  createDialog.value = true;
};

const openEditDialog = (row) => {
  isEditMode.value = true;
  editingFormId.value = row.id;

  newForm.title = row.title;
  newForm.description = row.description || "";
  newForm.selectedFields = row.fields.map((f) => f.key);
  newForm.documents = row.documents || null;
  newForm.images = row.images || null;

  newForm.autoAiEvaluation = row.autoAiEvaluation ?? false;
  newForm.aiAgent = row.aiAgent || null;

  // ✅ job position seleccionado
  newForm.jobPosition = row.jobPosition || null;

  // ✅ adjuntos existentes
  newForm.documents = Array.isArray(row.documents) ? [...row.documents] : [];
  newForm.images = Array.isArray(row.images) ? [...row.images] : [];

  // ✅ reset de nuevos archivos por subir
  documentsFiles.value = [];
  imagesFiles.value = [];

  // ✅ reset de los “para eliminar”
  removedDocuments.value = [];
  removedImages.value = [];

  createDialog.value = true;
};

const removedDocuments = ref([]); // urls/ids a eliminar en update
const removedImages = ref([]);

// soporta string o {url,name}
const getUrl = (file) => (typeof file === "string" ? file : file?.url);
const getFileName = (file) => {
  if (typeof file === "string") return file.split("/").pop() || "Documento";
  return (
    file?.name ||
    file?.originalname ||
    file?.url?.split("/")?.pop() ||
    "Documento"
  );
};

const openUrl = (file) => {
  const url = getUrl(file);
  if (url) window.open(url, "_blank");
};

const removeExistingDocument = (idx) => {
  const item = newForm.documents[idx];
  const url = getUrl(item);
  if (url) removedDocuments.value.push(url);
  newForm.documents.splice(idx, 1);
};

const removeExistingImage = (idx) => {
  const item = newForm.images[idx];
  const url = getUrl(item);
  if (url) removedImages.value.push(url);
  newForm.images.splice(idx, 1);
};

const handleUploadRequirement = () => {
  if (!requirementFile.value) {
    Notify.create({
      type: "warning",
      message: "Selecciona un archivo primero.",
    });
    return;
  }

  const file = requirementFile.value;

  // newForm.document = {
  //   name: file.name,
  //   size: file.size,
  //   mimeType: file.type,
  // };

  Notify.create({
    type: "positive",
    message: "Archivo listo para enviarse con el formulario.",
  });

  uploadDialog.value = false;
};

/**
 * Crear o actualizar formulario
 */
const createOrUpdateForm = async () => {
  if (!canCreate.value) return;

  savingForm.value = true;
  try {
    const selected = allFields.filter((f) =>
      newForm.selectedFields.includes(f.key)
    );

    // Campos "normales" del formulario
    const payload = {
      title: newForm.title.trim(),
      description: newForm.description?.trim() || "",
      jobPosition: newForm.jobPosition || null,
      fields: selected.map((f, index) => ({
        key: f.key,
        groupKey: f.groupKey,
        order: index,
      })),
      autoAiEvaluation: newForm.autoAiEvaluation,
      aiAgent: newForm.aiAgent,
    };

    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("jobPosition", payload.jobPosition || "");
    formData.append("aiAgent", payload.aiAgent || null);
    formData.append("fields", JSON.stringify(payload.fields));
    formData.append(
      "autoAiEvaluation",
      JSON.stringify(payload.autoAiEvaluation)
    );

    if (Array.isArray(documentsFiles.value) && documentsFiles.value.length) {
      documentsFiles.value.forEach((f) => {
        formData.append("documents", f);
      });
    }

    if (Array.isArray(imagesFiles.value) && imagesFiles.value.length) {
      imagesFiles.value.forEach((f) => {
        formData.append("images", f);
      });
    }

    let resp;

    if (isEditMode.value && editingFormId.value) {
      formData.append(
        "removedDocuments",
        JSON.stringify(removedDocuments.value || [])
      );
      formData.append(
        "removedImages",
        JSON.stringify(removedImages.value || [])
      );

      // UPDATE
      resp = await methodsHttp.putApi(
        `recruitment/updateRecruitmentForm/${editingFormId.value}`,
        formData
      );
    } else {
      // CREATE
      resp = await methodsHttp.postApi(
        "recruitment/createRecruitmentForm",
        formData
      );
    }

    if (!resp.ok) {
      throw new Error(resp.mensaje || "No se pudo guardar el formulario");
    }

    const mapped = mapBackendForm(resp.form);

    if (isEditMode.value) {
      const idx = forms.value.findIndex((f) => f.id === mapped.id);
      if (idx >= 0) {
        forms.value[idx] = mapped;
      }
      createdLink.value = mapped.link;
      Notify.create({
        type: "positive",
        message: "Formulario actualizado correctamente.",
      });
    } else {
      forms.value.unshift(mapped);
      createdLink.value = resp.link || mapped.link;
      Notify.create({
        type: "positive",
        message: "Formulario creado correctamente.",
      });
    }

    // limpiar archivo temporal después de guardar
    requirementFile.value = null;

    createDialog.value = false;
    linkDialog.value = true;
  } catch (error) {
    console.error("Error createOrUpdateForm:", error);
    Notify.create({
      type: "negative",
      message: error.message || "Error al guardar el formulario",
    });
  } finally {
    savingForm.value = false;
  }
};

const removeForm = async (id) => {
  try {
    const resp = await methodsHttp.deleteApi(
      `recruitment/deleteRecruitmentForm/${id}`
    );
    const data = resp.data || resp;

    if (!data.ok) {
      throw new Error(data.mensaje || "No se pudo eliminar");
    }

    forms.value = forms.value.filter((f) => f.id !== id);

    Notify.create({
      type: "warning",
      message: "Formulario eliminado",
    });
  } catch (error) {
    console.error("Error removeForm:", error);
    Notify.create({
      type: "negative",
      message: error.message || "Error al eliminar formulario",
    });
  }
};

const previewForm = (form) => {
  previewFormData.value = form;
  previewDialog.value = true;
};

const previewFormByLink = () => {
  const form = forms.value.find((f) => f.link === createdLink.value);
  if (form) previewForm(form);
};

const copyLink = async (link) => {
  try {
    await copyToClipboard(link);
    Notify.create({ type: "positive", message: "Link copiado." });
  } catch {
    Notify.create({ type: "negative", message: "No se pudo copiar." });
  }
};

/** Preview grouping */
const previewGroupedFields = computed(() => {
  if (!previewFormData.value?.fields) return [];
  const map = {};

  previewFormData.value.fields.forEach((f) => {
    const key = f.groupKey || "otros";
    if (!map[key]) {
      map[key] = {
        groupKey: key,
        groupTitle: f.groupTitle || "Otros",
        fields: [],
      };
    }
    map[key].fields.push(f);
  });

  return Object.values(map);
});

/** Opciones de select */
const optionsForField = (field) => {
  if (!field.optionsKey) return [];
  return optionsMap[field.optionsKey] || [];
};

const previewColClass = (type) => {
  if (type === "textarea") return "col-12";
  if (type === "checkbox") return "col-12";
  if (type === "file-select") return "col-12 col-md-6";
  return "col-12 col-md-6";
};

/** Confirmación de eliminación de formulario */
const confirmDeleteFormDialog = ref(false);
const formToDeleteId = ref(null);
const deletingForm = ref(false);

const openConfirmDeleteForm = (row) => {
  formToDeleteId.value = row.id;
  confirmDeleteFormDialog.value = true;
};

const confirmRemoveForm = async () => {
  if (!formToDeleteId.value) return;

  deletingForm.value = true;
  try {
    await removeForm(formToDeleteId.value);
    confirmDeleteFormDialog.value = false;
    formToDeleteId.value = null;
  } finally {
    deletingForm.value = false;
  }
};

function selectAllInGroup(groupKey) {
  const group = fieldGroups.find((g) => g.key === groupKey);
  if (!group) return;
  const keys = group.fields.map((f) => f.key);
  newForm.selectedFields = Array.from(
    new Set([...newForm.selectedFields, ...keys])
  );
}

function clearAllInGroup(groupKey) {
  const group = fieldGroups.find((g) => g.key === groupKey);
  if (!group) return;
  const keys = new Set(group.fields.map((f) => f.key));
  newForm.selectedFields = newForm.selectedFields.filter((k) => !keys.has(k));
}

/** Confirmación de eliminación de documento */
const confirmDeleteDocDialog = ref(false);
const deletingRequirementDoc = ref(false);

const confirmDeleteRequirementDoc = async () => {
  if (!editingFormId.value) {
    confirmDeleteDocDialog.value = false;
    return;
  }

  deletingRequirementDoc.value = true;
  try {
    // Ajusta el endpoint al que definas en tu backend
    const resp = await methodsHttp.deleteApi(
      `recruitment/deleteFormDocument/${editingFormId.value}`
    );
    const data = resp.data || resp;

    if (!data.ok) {
      throw new Error(data.mensaje || "No se pudo eliminar el documento.");
    }

    // limpiar en el formulario actual
    // newForm.document = null;
    requirementFile.value = null;

    // actualizar también la tabla si ya tenía documento
    const idx = forms.value.findIndex((f) => f.id === editingFormId.value);
    if (idx >= 0) {
      forms.value[idx].document = null;
    }

    Notify.create({
      type: "positive",
      message: "Documento eliminado correctamente.",
    });

    confirmDeleteDocDialog.value = false;
  } catch (error) {
    console.error("Error confirmDeleteRequirementDoc:", error);
    Notify.create({
      type: "negative",
      message: error.message || "Error al eliminar el documento.",
    });
  } finally {
    deletingRequirementDoc.value = false;
  }
};

//

const getJobPositions = async () => {
  loadingJobPositions.value = true;
  try {
    const resp = await methodsHttp.getApi(`job-position/getJobPositions`);
    if (resp?.ok) {
      jobPositions.value = resp.jobPositions || [];
    } else {
      jobPositions.value = [];
    }
  } finally {
    loadingJobPositions.value = false;
  }
};

const jobPositionOptions = computed(() => {
  return (jobPositions.value || []).map((p) => {
    const departmentName =
      (typeof p.department === "object" && p.department?.name) ||
      p.departmentName ||
      "N/A";

    return {
      label: p.name,
      value: p._id,
      departmentName,
    };
  });
});

const recruitmentAgents = ref([]);
const loadingAgents = ref(false);

const getRecruitmentAgents = async () => {
  loadingAgents.value = true;
  try {
    const resp = await methodsHttp.getApi("ai/?type=recruitment");
    if (resp?.ok) {
      recruitmentAgents.value = resp.agents || [];
    } else {
      recruitmentAgents.value = [];
    }
  } finally {
    loadingAgents.value = false;
  }
};


/** Carga inicial */
onMounted(() => {
  loadForms();
  getJobPositions();
  getRecruitmentAgents();
});
</script>

<style scoped>
:deep(.q-expansion-item__container) {
  border-radius: 12px;
}
:deep(.q-field--outlined .q-field__control) {
  border-radius: 10px;
}
</style>
