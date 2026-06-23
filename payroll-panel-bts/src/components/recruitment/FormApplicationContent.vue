<template>
  <div>
    <div class="row items-center justify-between q-mb-sm">
      <div>
        <div class="text-subtitle1 text-weight-bold">Solicitudes recibidas</div>
        <div class="text-caption text-grey-6">
          Marca la decisión y, si aplica, clasifica su expediente.
        </div>
      </div>
    </div>
    <!-- =========================
         FILTROS AVANZADOS
    ========================== -->
    <q-expansion-item
      icon="filter_list"
      label="Filtros avanzados"
      header-class="text-primary text-weight-bold"
      expand-separator
      class="q-mb-md bg-white rounded-borders"
    >
      <q-card flat class="q-pa-md">
        <div v-for="step in filterableSteps" :key="step.name" class="q-mb-md">
          <div class="text-subtitle2 text-weight-bold q-mb-sm">
            {{ step.name }}. {{ step.title }}
          </div>

          <div class="row q-col-gutter-md">
            <div
              v-for="field in step.fields"
              :key="field.key"
              class="col-12 col-md-4"
            >
              <!-- Texto / textarea / number / date -->
              <q-input
                v-if="
                  ['text', 'textarea', 'number', 'date'].includes(field.type)
                "
                outlined
                dense
                :type="
                  field.type === 'number'
                    ? 'number'
                    : field.type === 'date'
                      ? 'date'
                      : 'text'
                "
                :label="field.label"
                v-model="fieldFilters[field.key]"
              />

              <!-- Select / radio -->
              <q-select
                v-else-if="['select', 'radio'].includes(field.type)"
                outlined
                dense
                :label="field.label"
                v-model="fieldFilters[field.key]"
                :options="optionsMap[field.optionsKey] || []"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                clearable
              />

              <!-- Toggle / checkbox -->
              <q-toggle
                v-else-if="
                  ['toggle', 'checkbox', 'boolean'].includes(field.type)
                "
                v-model="fieldFilters[field.key]"
                :label="field.label"
                color="primary"
                dense
              />

              <!-- Fallback genérico: input texto -->
              <q-input
                v-else
                outlined
                dense
                :label="field.label"
                v-model="fieldFilters[field.key]"
              />
            </div>
          </div>
        </div>

        <div class="q-mt-sm row justify-end q-gutter-xs">
          <q-btn
            flat
            dense
            icon="clear_all"
            label="Limpiar filtros"
            @click="
              () => {
                Object.keys(fieldFilters).forEach(
                  (k) => (fieldFilters[k] = null),
                );
                initialPagination.page = 1;
                loadApplications();
              }
            "
          />

          <q-btn
            color="primary"
            dense
            icon="search"
            label="Aplicar filtros"
            @click="applyFilters"
          />
        </div>
      </q-card>
    </q-expansion-item>

    <q-table
      flat
      bordered
      :rows="applications"
      :columns="appsColumns"
      row-key="id"
      :loading="appsLoading"
      no-data-label="No hay solicitudes."
      hide-pagination
      :rows-per-page-options="[initialPagination.rowsPerPage]"
    >
      <template v-slot:body-cell-decision="props">
        <q-td :props="props">
          <q-chip
            v-if="props.row.decision"
            dense
            :color="decisionColor(props.row.decision)"
            text-color="white"
          >
            {{ decisionLabel(props.row.decision) }}
          </q-chip>
          <span v-else class="text-grey-6 text-caption">Sin decisión</span>
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-chip
            dense
            :color="statusColor(props.row.status)"
            text-color="white"
          >
            {{ props.row.status }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <div class="row items-center no-wrap q-gutter-xs">
            <q-btn
              dense
              flat
              round
              icon="article"
              @click="viewApplication(props.row)"
            >
              <q-tooltip>Ver solicitud</q-tooltip>
            </q-btn>

            <q-btn
              dense
              flat
              round
              icon="event"
              color="indigo-6"
              @click="interviewDialogsRef?.openSchedule(props.row)"
              :disable="!isApto(props.row?.decision)"
            >
              <q-tooltip>Agendar entrevista</q-tooltip>
            </q-btn>

            <q-btn
              v-if="allowedToUse"
              dense
              flat
              round
              icon="event_available"
              color="primary"
              @click="setDecision(props.row, 'INTERVIEW')"
            >
              <q-tooltip>Apto para entrevista</q-tooltip>
            </q-btn>

            <q-btn
              v-if="allowedToUse"
              dense
              flat
              round
              icon="how_to_reg"
              color="green-7"
              @click="setDecision(props.row, 'HIRING')"
            >
              <q-tooltip>Apto para contratación</q-tooltip>
            </q-btn>

            <q-btn
              v-if="allowedToUse"
              dense
              flat
              round
              icon="bookmark_add"
              color="orange-7"
              @click="setDecision(props.row, 'POOL')"
            >
              <q-tooltip>Activo en BD (banco de talentos)</q-tooltip>
            </q-btn>

            <q-btn
              v-if="allowedToUse"
              dense
              flat
              round
              icon="folder_shared"
              color="indigo-7"
              :disable="!isApto(props.row?.decision)"
              @click="openClassificationDialog(props.row)"
            >
              <q-tooltip>Clasificar expediente</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-aiSummary="props">
        <q-td :props="props" style="min-width: 220px">
          <div v-if="props.row.aiDecision">
            <div class="row items-center q-gutter-xs q-mb-xs">
              <q-chip
                dense
                :color="aiDecisionColor(props.row.aiRecommendation)"
                text-color="white"
              >
                {{ aiDecisionLabel(props.row.aiRecommendation) }}
              </q-chip>

              <q-chip
                dense
                outline
                :color="aiConfidenceColor(props.row.aiConfidenceLevel)"
              >
                {{ aiConfidenceLabel(props.row.aiConfidenceLevel) }}
              </q-chip>
            </div>

            <div class="text-caption text-grey-7">
              Score:
              <strong>{{ props.row.aiOverallScore ?? "-" }}/100</strong>
            </div>

            <q-linear-progress
              class="q-mt-xs"
              rounded
              size="8px"
              :value="(props.row.aiOverallScore || 0) / 100"
              color="primary"
              track-color="grey-4"
            />
          </div>

          <div v-else class="text-caption text-grey-6">Sin evaluación IA</div>
        </q-td>
      </template>
    </q-table>

    <div class="q-mt-md row justify-end">
      <TablePagination
        v-model="initialPagination.page"
        :orderQuantity="orderQuantity"
        color="light-blue-10"
        active-color="light-blue-5"
        :initialPagination="initialPagination.page"
      />
    </div>

<!-- DIALOG: VER SOLICITUD -->
<q-dialog v-model="applicationDialog">
  <q-card class="application-detail-dialog">
    <!-- HEADER -->
    <q-card-section class="detail-header">
      <div class="row items-center justify-between full-width">
        <div class="row items-center q-gutter-md">
          <div class="detail-header__icon">
            <q-icon name="description" size="30px" color="white" />
          </div>

          <div>
            <div class="text-h6 text-weight-bold text-white">
              Detalle de solicitud
            </div>
            <div class="text-subtitle2 text-white">
              {{ selectedApplication?.candidateName || "Candidato" }}
            </div>
            <div class="text-caption text-white text-white">
              Formulario: {{ selectedApplication?.formTitle || "-" }}
            </div>
          </div>
        </div>

        <q-btn
          dense
          flat
          round
          icon="close"
          color="white"
          v-close-popup
        />
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section
      v-if="selectedApplication"
      class="application-detail-body scroll"
    >
      <!-- RESUMEN SUPERIOR -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-4">
          <q-card flat bordered class="summary-card">
            <div class="text-caption text-grey-7">Candidato</div>
            <div class="text-body1 text-weight-bold">
              {{ selectedApplication?.candidateName || "-" }}
            </div>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card flat bordered class="summary-card">
            <div class="text-caption text-grey-7">Estado actual</div>
            <div class="q-mt-xs">
              <q-chip
                dense
                :color="statusColor(selectedApplication?.status)"
                text-color="white"
              >
                {{ selectedApplication?.status || "-" }}
              </q-chip>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card flat bordered class="summary-card">
            <div class="text-caption text-grey-7">Decisión</div>
            <div class="q-mt-xs">
              <q-chip
                dense
                :color="decisionColor(selectedApplication?.decision)"
                text-color="white"
              >
                {{ decisionLabel(selectedApplication?.decision) }}
              </q-chip>
            </div>
          </q-card>
        </div>
      </div>

      <!-- CAMPOS DEL FORMULARIO AGRUPADOS -->
      <div
        v-for="group in applicationReadablePayloadGrouped(selectedApplication)"
        :key="group.groupKey"
        class="q-mb-lg"
      >
        <div class="section-title q-mb-md">
          <q-icon name="fact_check" size="18px" class="q-mr-sm" />
          <span>{{ group.groupTitle }}</span>
        </div>

        <div class="row q-col-gutter-md">
          <div
            v-for="row in group.rows"
            :key="row.key"
            class="col-12 col-md-6"
          >
            <!-- CAMPOS NORMALES -->
            <q-input
              v-if="row.type !== 'file-select'"
              outlined
              dense
              readonly
              stack-label
              :label="row.label"
              :model-value="row.value"
              class="detail-readonly-field"
            />

            <!-- ARCHIVOS -->
            <q-card
              v-else
              flat
              bordered
              class="file-field-card"
            >
              <div class="row items-center q-col-gutter-md no-wrap">
                <div v-if="row.isImage" class="col-auto">
                  <q-img
                    :src="row.url"
                    style="width: 72px; height: 72px"
                    ratio="1"
                    class="rounded-borders"
                  />
                </div>

                <div class="col">
                  <div class="text-caption text-grey-7 q-mb-xs">
                    {{ row.label }}
                  </div>
                  <div class="text-body2 text-weight-medium ellipsis-2-lines">
                    Documento adjunto disponible
                  </div>
                </div>

                <div class="col-auto">
                  <q-btn
                    dense
                    color="primary"
                    icon="open_in_new"
                    type="a"
                    :href="row.url"
                    target="_blank"
                    unelevated
                    rounded
                    label="Abrir"
                  />
                </div>
              </div>
            </q-card>
          </div>
        </div>
      </div>

      <!-- ESTADO Y DECISIÓN -->
      <q-card flat bordered class="detail-block q-mb-md">
        <div class="section-title q-mb-md">
          <q-icon name="manage_accounts" size="18px" class="q-mr-sm" />
          <span>Gestión de solicitud</span>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-select
              outlined
              dense
              v-model="selectedApplication.status"
              :options="statusOptions"
              label="Estado general"
              :disable="!allowedToUse"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-select
              outlined
              dense
              v-model="selectedApplication.decision"
              :options="decisionOptions"
              emit-value
              map-options
              label="Decisión"
            />
          </div>
        </div>

        <div class="q-mt-sm text-caption text-grey-6">
          * Si la decisión es apto, puedes clasificar el expediente o agendar entrevista.
        </div>
      </q-card>

      <!-- IA -->
      <q-card flat bordered class="detail-block ai-block">
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="section-title q-mb-xs">
              <q-icon name="smart_toy" size="18px" class="q-mr-sm" />
              <span>Análisis IA de reclutamiento</span>
            </div>
            <div class="text-caption text-grey-7">
              Generado por el agente automático de screening.
            </div>
          </div>

          <q-btn
            color="deep-purple-6"
            dense
            icon="smart_toy"
            :loading="aiLoading"
            :disable="aiLoading"
            label="Ejecutar agente IA"
            @click="runAiEvaluation(selectedApplication)"
          />
        </div>

        <div
          v-if="!selectedApplication.aiDecision && !aiLoading"
          class="empty-state-box"
        >
          <q-icon name="psychology" size="24px" color="grey-6" />
          <div class="text-body2 text-grey-7 q-mt-sm">
            Aún no se ha generado una evaluación automática para esta solicitud.
          </div>
        </div>

        <div v-if="selectedApplication.aiDecision" class="q-mt-sm">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-card flat bordered class="summary-card">
                <div class="text-caption text-grey-7">Puntaje global IA</div>
                <div class="text-h6 text-weight-bold">
                  {{ selectedApplication.aiDecision.overallScore }} / 100
                </div>
                <q-linear-progress
                  class="q-mt-xs"
                  rounded
                  :value="
                    (selectedApplication.aiDecision.overallScore || 0) / 100
                  "
                  color="primary"
                  track-color="grey-4"
                />
              </q-card>
            </div>

            <div class="col-12 col-md-4">
              <q-card flat bordered class="summary-card">
                <div class="text-caption text-grey-7 q-mb-xs">
                  Recomendación IA
                </div>
                <q-chip
                  dense
                  :color="
                    aiDecisionColor(
                      selectedApplication.aiDecision.recommendation,
                    )
                  "
                  text-color="white"
                >
                  {{
                    aiDecisionLabel(
                      selectedApplication.aiDecision.recommendation,
                    )
                  }}
                </q-chip>
              </q-card>
            </div>

            <div class="col-12 col-md-4">
              <q-card flat bordered class="summary-card">
                <div class="text-caption text-grey-7 q-mb-xs">
                  Nivel de confianza
                </div>
                <q-chip
                  dense
                  :color="
                    aiConfidenceColor(
                      selectedApplication.aiDecision.confidenceLevel,
                    )
                  "
                  text-color="white"
                >
                  {{
                    aiConfidenceLabel(
                      selectedApplication.aiDecision.confidenceLevel,
                    )
                  }}
                </q-chip>
              </q-card>
            </div>
          </div>

          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <q-card flat bordered class="detail-inner-card full-height">
                <div class="text-subtitle2 text-weight-bold q-mb-sm">
                  Resumen IA
                </div>
                <div class="text-body2">
                  {{
                    selectedApplication.aiDecision.summary ||
                    "Sin resumen disponible."
                  }}
                </div>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card flat bordered class="detail-inner-card full-height">
                <div class="text-subtitle2 text-weight-bold q-mb-sm">
                  Entrevista sugerida
                </div>

                <q-chip
                  dense
                  :color="
                    selectedApplication.aiDecision.interview?.recommend
                      ? 'green-6'
                      : 'grey-6'
                  "
                  text-color="white"
                  class="q-mb-sm"
                >
                  {{
                    selectedApplication.aiDecision.interview?.recommend
                      ? "Recomienda entrevistar"
                      : "No recomienda entrevistar"
                  }}
                </q-chip>

                <div class="text-body2">
                  Prioridad:
                  <strong>
                    {{
                      selectedApplication.aiDecision.interview?.priority || "-"
                    }}
                  </strong>
                </div>
                <div class="text-body2">
                  Modalidad:
                  <strong>
                    {{
                      selectedApplication.aiDecision.interview?.suggestedMode ||
                      "-"
                    }}
                  </strong>
                </div>
              </q-card>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div>
            <div class="text-subtitle2 text-weight-bold q-mb-sm">
              Criterios evaluados
            </div>

            <div
              v-if="selectedApplication.aiDecision.criteriaResults?.length"
              class="row q-col-gutter-md"
            >
              <div
                v-for="(criterion, idx) in selectedApplication.aiDecision.criteriaResults"
                :key="`${criterion.key}-${idx}`"
                class="col-12 col-md-6"
              >
                <q-card flat bordered class="detail-inner-card full-height">
                  <div class="row items-center justify-between">
                    <div class="text-body2 text-weight-medium">
                      {{ criterion.label || criterion.key }}
                    </div>
                    <q-chip dense outline color="primary">
                      {{ criterion.score }}/100
                    </q-chip>
                  </div>

                  <div class="text-caption text-grey-7 q-mt-xs">
                    Peso: {{ criterion.weight ?? 0 }}
                  </div>

                  <div class="text-body2 q-mt-sm">
                    {{ criterion.reasoning || "Sin justificación disponible." }}
                  </div>

                  <div
                    v-if="criterion.evidence && criterion.evidence.length"
                    class="q-mt-sm"
                  >
                    <div class="text-caption text-grey-7 q-mb-xs">
                      Evidencia
                    </div>
                    <ul class="q-pl-md q-my-none">
                      <li
                        v-for="(ev, evIdx) in criterion.evidence"
                        :key="`${criterion.key}-ev-${evIdx}`"
                        class="text-body2"
                      >
                        {{ ev }}
                      </li>
                    </ul>
                  </div>
                </q-card>
              </div>
            </div>

            <div v-else class="text-caption text-grey-6">
              No hay criterios evaluados todavía.
            </div>
          </div>
        </div>
      </q-card>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right" class="q-pa-md">
      <q-btn flat label="Cerrar" v-close-popup />

      <q-btn
        color="primary"
        icon="save"
        label="Guardar cambios"
        :loading="statusSaving"
        :disable="statusSaving || !selectedApplication"
        @click="saveApplicationStatus"
      />

      <q-btn
        color="indigo-6"
        icon="event"
        label="Agendar entrevista"
        @click="interviewDialogsRef?.openSchedule(selectedApplication)"
      />

      <q-btn
        v-if="allowedToUse"
        color="indigo-7"
        icon="folder_shared"
        label="Clasificar expediente"
        :disable="!isApto(selectedApplication?.decision)"
        @click="openClassificationDialog(selectedApplication)"
      />
    </q-card-actions>
  </q-card>
</q-dialog>

    <ClassificationExpedientModal
      v-model="classificationDialog"
      :application="classificationTarget"
      target="application"
      @saved="onClassificationSaved"
    />

    <RecruitmentInterviewDialogs
      ref="interviewDialogsRef"
      :employees-options="employeesOptions"
      @changed="loadApplications"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, watch } from "vue";
import { Notify } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";
import { recruitmentSteps, optionsMap } from "src/data/recruitmentFormData";
import TablePagination from "src/components/table/TablePagination.vue";
import { isImageUrl } from "app/utils";

import {
  decisionOptions,
  interviewModeOptions,
  statusOptions,
} from "src/data/formApplicationData";
import moment from "moment";
import ClassificationExpedientModal from "../expedient/ClassificationExpedientModal.vue";
import RecruitmentInterviewDialogs from "./RecruitmentInterviewDialogs.vue";

const auth = authStore();

// Evita crashes si auth.user aún no existe
const roleCode = computed(() => auth.user?.rol?.code ?? "");
const deptCode = computed(() => auth.user?.department?.code ?? "");

const allowedToUse = computed(() => {
  return (
    roleCode.value === "SUPERADMIN" ||
    roleCode.value === "ADMIN" ||
    deptCode.value === "RRHH"
  );
});

const employeesOptions = ref([]);
const initialPagination = ref({
  page: 1,
  rowsPerPage: 10, // el mismo que usas en el backend como default
});

const orderQuantity = ref(0);
const interviewDialogsRef = ref(null);

const allFields = recruitmentSteps.flatMap((step) =>
  step.fields.map((f) => ({
    ...f,
    groupKey: `step_${step.name}`,
    groupTitle: `${step.name}. ${step.title}`,
  })),
);

// FILTROS

const filterableSteps = computed(() =>
  recruitmentSteps
    .map((step) => ({
      ...step,
      fields: step.fields.filter((f) => !["file", "upload"].includes(f.type)),
    }))
    .filter((step) => step.fields.length > 0),
);

const fieldFilters = reactive({});

// Inicializar filtros vacíos
recruitmentSteps.forEach((step) => {
  step.fields.forEach((f) => {
    fieldFilters[f.key] = null;
  });
});

// Helper: construir objeto solo con filtros activos
const buildAnswersFilters = () => {
  const out = {};
  Object.keys(fieldFilters).forEach((key) => {
    const v = fieldFilters[key];
    if (v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)) {
      out[key] = v;
    }
  });
  return out;
};

//
const applications = ref([]);
const appsLoading = ref(false);

const formatDateTime = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

const mapBackendApplication = (a) => {
  const form = a.form || {};
  const answers = a.answers || {};

  return {
    _id: a._id,
    formId: a.formId || form._id || null,
    formTitle: a.formTitle || form.title || "Formulario",
    jobPosition: form?.jobPosition?.name || "Puesto de trabajo",

    candidateName:
      a.candidateName ||
      a.applicantName ||
      answers.fullName ||
      answers.name ||
      "Sin nombre",

    createdAt: formatDateTime(a.createdAt),
    status: a.status || "Pendiente",
    decision: a.decision || null,
    classification: a.classification || null,
    assignedTo: a.assignedTo || null,
    answers,
    interview: a.interview || null,
    files: a.files || {},

    aiDecision: a.aiDecision || null,
    aiAgent: a.aiAgent || null,

    aiRecommendation: a.aiDecision?.recommendation || null,
    aiOverallScore: a.aiDecision?.overallScore ?? null,
    aiConfidenceLevel: a.aiDecision?.confidenceLevel || null,
  };
};

/** CARGA DE DATOS */
const loadApplications = async () => {
  appsLoading.value = true;
  try {
    const { page, rowsPerPage } = initialPagination.value;

    const answersFilters = buildAnswersFilters();
    const params = new URLSearchParams();

    params.set("page", String(page || 1));
    params.set("limit", String(rowsPerPage || 20));

    if (Object.keys(answersFilters).length) {
      params.set("answersFilters", JSON.stringify(answersFilters));
    }

    const resp = await methodsHttp.getApi(
      `recruitment/getRecruitmentApplications?${params.toString()}`,
    );

    if (!resp.ok) {
      throw new Error(resp.mensaje || "No se pudieron cargar las solicitudes");
    }

    const backendApps = resp.applications || [];
    applications.value = backendApps.map(mapBackendApplication);
    orderQuantity.value = Math.ceil(resp.total / 10);

    // sincronizar page/limit por si backend te devuelve algo diferente
    if (resp.page) initialPagination.value.page = resp.page;
    if (resp.limit) initialPagination.value.rowsPerPage = resp.limit;
  } catch (error) {
    console.error("Error loadApplications:", error);
    Notify.create({
      type: "negative",
      message: error.message || "Error al cargar solicitudes",
    });
  } finally {
    appsLoading.value = false;
  }
};

const getEmployees = async () => {
  try {
    const resp = await methodsHttp.getApi(
      "user/getEmployees?code=ADMIN&isActived=true",
    );

    if (resp.ok) {
      employeesOptions.value = resp.employees;
    } else {
      employeesOptions.value = [];
    }
  } catch (error) {
    console.error("Error loadApplications:", error);
  }
};

/** COLUMNAS TABLE */
const appsColumns = [
    { name: "actions", label: "Acciones", field: "actions", align: "left" },
  {
    name: "candidateName",
    label: "Candidato",
    field: "candidateName",
    align: "left",
    sortable: true,
  },
  {
    name: "formTitle",
    label: "Formulario",
    field: "formTitle",
    align: "left",
    sortable: true,
  },
  {
    name: "status",
    label: "Estado",
    field: "status",
    align: "left",
    sortable: true,
  },
  {
    name: "decision",
    label: "Decisión",
    field: "decision",
    align: "left",
    sortable: true,
  },
  {
    name: "aiSummary",
    label: "IA",
    field: "aiSummary",
    align: "left",
    sortable: false,
  },
  {
    name: "createdAt",
    label: "Fecha",
    field: "createdAt",
    align: "left",
    sortable: true,
  },
];

/** Payload legible según recruitmentSteps */
function applicationReadablePayload(app) {
  const answers = app?.answers || {};
  const rows = [];

  // Recorremos todos los campos en el orden definido en recruitmentSteps
  allFields.forEach((def) => {
    const key = def.key;
    const type = def.type;

    // Campo de archivo (file-select)
    if (type === "file-select") {
      const fileMeta = answers[key];
      if (!fileMeta) return;

      // Puede venir como string (URL) o como objeto { url, ... }
      const url =
        typeof fileMeta === "string" ? fileMeta : fileMeta?.url || null;
      if (!url) return;

      rows.push({
        key,
        type: "file-select",
        url,
        label: def.label || key,
        isImage: isImageUrl(url),
      });
      return;
    }

    // Campo normal (texto, select, etc.)
    const value = answers[key];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return; // no mostrar vacíos
    }

    rows.push({
      key,
      label: def.label || key,
      type: "field",
      value,
    });
  });

  return rows;
}

/** DIALOG: VER SOLICITUD */
const applicationDialog = ref(false);
const selectedApplication = ref(null);

function viewApplication(app) {
  selectedApplication.value = app;
  applicationDialog.value = true;
}

/** DECISIONES */
const setDecision = async (app, decision) => {
  app.decision = decision;

  if (decision === "INTERVIEW" || decision === "HIRING") {
    app.status = "Aprobada";
  }

  // TODO: endpoint backend
  const resp = await methodsHttp.putApi(
    `recruitment/changeApplicationStatus/${app._id}`,
    {
      decision: app.decision,
      status: app.status,
    },
  );
  if (!resp.ok) {
    return Notify.create({
      type: "negative",
      message: "Ha ocurrido un error",
    });
  }

  loadApplications();
  Notify.create({
    type: "info",
    message: `Decisión: ${decisionLabel(decision)}.`,
  });
};

const isApto = (decision) => {
  return (
    decision === "INTERVIEW" || decision === "HIRING" || decision === "HIRED"
  );
};

const decisionLabel = (decision) => {
  if (decision === "INTERVIEW") return "Apto para entrevista";
  if (decision === "HIRING") return "Apto para contratación";
  if (decision === "HIRED") return "Contratado";
  if (decision === "POOL") return "Activo en BD";
  if (decision === "REJECTED") return "Rechazado";
  return decision || "Sin decisión";
};

const decisionColor = (decision) => {
  if (decision === "INTERVIEW") return "primary";
  if (decision === "HIRING") return "green-5";
  if (decision === "HIRED") return "green-8";
  if (decision === "POOL") return "orange-7";
  if (decision === "REJECTED") return "red-7";
  return "grey-6";
};

const statusColor = (status) => {
  if (status === "Aprobada") return "green-7";
  if (status === "Rechazada") return "red-7";
  return "orange-7";
};

/** CLASIFICACIÓN DE EXPEDIENTE */
const classificationDialog = ref(false);
const classificationTarget = ref(null);

function openClassificationDialog(app) {
  classificationTarget.value = app;
  classificationDialog.value = true;
}

function onClassificationSaved(payload) {
  // Opcional: reflejar cambios en tu lista/table sin recargar
  if (classificationTarget.value) {
    classificationTarget.value.classification = payload;
  }
}

//

const applyFilters = () => {
  initialPagination.value.page = 1;
  loadApplications();
};

const statusSaving = ref(false);

const saveApplicationStatus = async () => {
  if (!selectedApplication.value) return;

  statusSaving.value = true;
  try {
    const payload = {
      status: selectedApplication.value.status,
      decision: selectedApplication.value.decision,
    };

    const resp = await methodsHttp.putApi(
      `recruitment/changeApplicationStatus/${selectedApplication.value._id}`,
      payload,
    );

    if (!resp.ok) {
      Notify.create({
        type: "negative",
        message: resp.mensaje || "Error al guardar el estado de la solicitud",
      });
      return;
    }

    // Actualizar también la fila en la tabla
    const idx = applications.value.findIndex(
      (a) => a._id === selectedApplication.value._id,
    );
    if (idx !== -1) {
      applications.value[idx].status = selectedApplication.value.status;
      applications.value[idx].decision = selectedApplication.value.decision;
    }

    Notify.create({
      type: "positive",
      message: "Estado y decisión de la solicitud guardados.",
    });
  } catch (error) {
    console.error("saveApplicationStatus error:", error);
    Notify.create({
      type: "negative",
      message: "Error al guardar el estado de la solicitud.",
    });
  } finally {
    statusSaving.value = false;
  }
};

const aiLoading = ref(false);

const aiDecisionLabel = (recommendation) => {
  if (recommendation === "REJECT") return "Rechazar";
  if (recommendation === "INTERVIEW") return "Apto para entrevista";
  if (recommendation === "POOL") return "Mantener en base de datos";
  if (recommendation === "HIRING") return "Apto para contratación";
  return recommendation || "Sin recomendación";
};

const aiDecisionColor = (recommendation) => {
  if (recommendation === "REJECT") return "red-7";
  if (recommendation === "INTERVIEW") return "primary";
  if (recommendation === "POOL") return "orange-7";
  if (recommendation === "HIRING") return "green-7";
  return "grey-6";
};

const aiConfidenceLabel = (level) => {
  if (level === "HIGH") return "Alta";
  if (level === "MEDIUM") return "Media";
  if (level === "LOW") return "Baja";
  return "No definida";
};

const aiConfidenceColor = (level) => {
  if (level === "HIGH") return "green-6";
  if (level === "MEDIUM") return "orange-6";
  if (level === "LOW") return "red-6";
  return "grey-6";
};

const runAiEvaluation = async (app) => {
  if (!app) return;
  aiLoading.value = true;

  try {
    const resp = await methodsHttp.postApi(
      `recruitment/runRecruitmentAiForApplication/${app._id}`,
      // {
      //   agentCode: "RECRUITMENT_CALLCENTER_DEFAULT",
      // },
    );

    if (!resp.ok) {
      let msg = resp.mensaje || "No se pudo evaluar con IA.";
      if (resp.errorCode === "INSUFFICIENT_QUOTA") {
        msg =
          "No se pudo ejecutar el agente de IA porque la cuenta de OpenAI no tiene cuota disponible. Revisa tu plan o método de pago en OpenAI.";
      }
      Notify.create({ type: "negative", message: msg });
      return;
    }

    const updated = mapBackendApplication(resp.application);

    const idx = applications.value.findIndex((x) => x._id === updated._id);
    if (idx !== -1) {
      applications.value[idx] = { ...applications.value[idx], ...updated };
      selectedApplication.value = applications.value[idx];
    } else {
      selectedApplication.value = updated;
    }

    Notify.create({
      type: "positive",
      message: "Evaluación IA generada correctamente.",
    });
  } catch (error) {
    console.error("runAiEvaluation error:", error);
    Notify.create({
      type: "negative",
      message: "Error al ejecutar el agente de reclutamiento.",
    });
  } finally {
    aiLoading.value = false;
  }
};

watch(
  () => initialPagination.value.page,
  () => {
    loadApplications();
  },
);

/** INIT */
onMounted(() => {
  loadApplications();
  getEmployees();
});

function applicationReadablePayloadGrouped(app) {
  const answers = app?.answers || {};
  const groupsMap = new Map();

  allFields.forEach((def) => {
    const key = def.key;
    const type = def.type;

    if (!groupsMap.has(def.groupKey)) {
      groupsMap.set(def.groupKey, {
        groupKey: def.groupKey,
        groupTitle: def.groupTitle,
        rows: [],
      });
    }

    const group = groupsMap.get(def.groupKey);

    if (type === "file-select") {
      const fileMeta = answers[key];
      if (!fileMeta) return;

      const url =
        typeof fileMeta === "string" ? fileMeta : fileMeta?.url || null;
      if (!url) return;

      group.rows.push({
        key,
        type: "file-select",
        url,
        label: def.label || key,
        isImage: isImageUrl(url),
      });
      return;
    }

    const value = answers[key];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    group.rows.push({
      key,
      label: def.label || key,
      type: "field",
      value: Array.isArray(value) ? value.join(", ") : value,
    });
  });

  return Array.from(groupsMap.values()).filter((group) => group.rows.length);
}
</script>

<style scoped>
.application-detail-dialog {
  width: 1180px;
  max-width: 98vw;
  border-radius: 22px;
  overflow: hidden;
}

.detail-header {
  background: var(--q-primary);
  padding: 18px 22px;
}

.detail-header__icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.application-detail-body {
  max-height: 70vh;
  padding: 20px;
  background: #fafafa;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--q-primary);
}

.summary-card {
  padding: 14px;
  border-radius: 16px;
  background: white;
}

.detail-block {
  padding: 16px;
  border-radius: 18px;
  background: white;
}

.detail-inner-card {
  padding: 14px;
  border-radius: 16px;
  background: white;
}

.file-field-card {
  padding: 12px;
  border-radius: 14px;
  background: white;
  min-height: 84px;
}

.detail-readonly-field :deep(.q-field__control) {
  border-radius: 14px;
  background: white;
}

.empty-state-box {
  border: 1px dashed #c7c7c7;
  border-radius: 16px;
  padding: 24px;
  background: #fcfcfc;
  text-align: center;
}

.full-height {
  height: 100%;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.q-card) {
  box-shadow: none;
}
</style>
