<template>
  <q-dialog
    v-model="dialogModel"
    persistent
    :maximized="$q.screen.lt.md"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="paid-service-modal bg-grey-1">
      <!-- HEADER -->
      <div class="modal-header">
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="col">
            <div class="row items-center no-wrap q-gutter-md">
              <q-avatar size="64px" rounded class="shadow-1">
                <q-img :src="serviceImage" fit="cover" />
              </q-avatar>

              <div class="ellipsis">
                <div class="text-overline text-primary text-weight-bold">
                  Servicio pagado
                </div>

                <div class="text-h5 text-weight-bold ellipsis">
                  {{ data?.services?.name || "Servicio sin nombre" }}
                </div>

                <div class="row items-center q-gutter-sm q-mt-xs">
                  <q-chip
                    dense
                    class="text-white"
                    :style="{
                      background: statusColor,
                    }"
                  >
                    {{ data?.status?.name || "Sin estado" }}
                  </q-chip>

                  <q-chip dense outline color="primary" icon="person">
                    {{ patientFullName }}
                  </q-chip>

                  <q-chip dense outline color="green" icon="payments">
                    {{ amountPaidFormatted }}
                  </q-chip>
                </div>
              </div>
            </div>
          </div>

          <div class="col-auto">
            <div class="row q-gutter-sm justify-end">
              <q-btn
                flat
                color="primary"
                icon="description"
                label="Ver PDFs"
                @click="showPdfModalFunct"
              />

              <q-btn
                color="primary"
                icon="picture_as_pdf"
                label="Generar PDF"
                @click="openDocumentModalFunct"
              />

              <q-btn
                color="green"
                icon="send"
                label="Enviar al cliente"
                :disable="data?.status?.code === 'FINISHED'"
                @click="handleSend"
              />

              <q-btn
                flat
                round
                dense
                icon="close"
                color="negative"
                @click="closeModal"
              />
            </div>
          </div>
        </div>
      </div>

      <q-separator />

      <!-- CONTENT -->
      <div class="modal-content">
        <!-- MOBILE TABS -->
        <q-tabs
          v-if="isMobile"
          v-model="activeTab"
          dense
          inline-label
          class="bg-white rounded-borders q-mb-md shadow-1"
          active-color="primary"
          indicator-color="primary"
        >
          <q-tab name="answers" icon="quiz" label="Respuestas" />
          <q-tab name="patient" icon="person" label="Paciente" />
        </q-tabs>

        <div class="row q-col-gutter-md full-height">
          <!-- LEFT SIDE -->
          <div
            v-show="!isMobile || activeTab === 'answers'"
            :class="isMobile ? 'col-12' : 'col-7'"
            class="column full-height"
          >
            <!-- RESUMEN -->
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12 col-sm-6 col-md-4">
                <q-card flat bordered class="summary-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-sm q-mb-sm">
                      <q-icon name="medical_services" color="primary" size="22px" />
                      <div class="text-subtitle2 text-weight-bold">Servicio</div>
                    </div>

                    <div class="text-body1 text-weight-medium">
                      {{ data?.services?.name || "-" }}
                    </div>

                    <div class="text-caption text-grey-7 q-mt-xs">
                      ID: {{ data?._id || "-" }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-4">
                <q-card flat bordered class="summary-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-sm q-mb-sm">
                      <q-icon name="person" color="primary" size="22px" />
                      <div class="text-subtitle2 text-weight-bold">Paciente</div>
                    </div>

                    <div class="text-body1 text-weight-medium">
                      {{ patientFullName }}
                    </div>

                    <div class="text-caption text-grey-7 q-mt-xs">
                      {{ data?.patient?.email || "-" }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-12 col-md-4">
                <q-card flat bordered class="summary-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-sm q-mb-sm">
                      <q-icon name="calendar_month" color="primary" size="22px" />
                      <div class="text-subtitle2 text-weight-bold">Fechas</div>
                    </div>

                    <div class="text-caption text-grey-7">Creado</div>
                    <div class="text-body2 q-mb-sm">
                      {{ createdAtFormatted }}
                    </div>

                    <div class="text-caption text-grey-7">Actualizado</div>
                    <div class="text-body2">
                      {{ updatedAtFormatted }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <!-- RESPUESTAS -->
            <div class="content-scroll">
              <q-card flat bordered class="section-card">
                <q-card-section class="row items-center justify-between">
                  <div>
                    <div class="text-h6 text-weight-bold">Respuestas del formulario</div>
                    <div class="text-caption text-grey-7">
                      Aquí se muestran todas las respuestas capturadas del paciente.
                    </div>
                  </div>

                  <q-chip color="primary" text-color="white" icon="quiz">
                    {{ answers.length }} respuesta{{ answers.length === 1 ? "" : "s" }}
                  </q-chip>
                </q-card-section>

                <q-separator />

                <q-card-section>
                  <div v-if="answers.length" class="q-gutter-md">
                    <q-card
                      v-for="(answer, index) in answers"
                      :key="index"
                      flat
                      bordered
                      class="answer-card"
                    >
                      <q-card-section>
                        <div class="text-subtitle1 text-weight-bold q-mb-sm">
                          {{ answer?.form?.label || "Pregunta sin título" }}
                        </div>

                        <!-- TEXT / NUMBER / DATE / TEXTAREA / DROPDOWN -->
                        <q-input
                          v-if="
                            ['TEXT', 'NUMBER', 'DATE', 'TEXTAREA', 'DROPDOWN', ''].includes(
                              getAnswerType(answer)
                            )
                          "
                          :model-value="getReadableAnswerValue(answer)"
                          :type="getAnswerType(answer) === 'TEXTAREA' ? 'textarea' : 'text'"
                          outlined
                          readonly
                          autogrow
                          color="primary"
                        />

                        <!-- RADIO -->
                        <q-option-group
                          v-else-if="getAnswerType(answer) === 'RADIO'"
                          :options="buildOptions(answer?.form?.options || [])"
                          :model-value="getSingleSelectedKey(answer?.value)"
                          type="radio"
                          color="primary"
                          disable
                        />

                        <!-- CHECKBOX -->
                        <q-option-group
                          v-else-if="getAnswerType(answer) === 'CHECKBOX'"
                          :options="buildOptions(answer?.form?.options || [])"
                          :model-value="getSelectedKeys(answer?.value)"
                          type="checkbox"
                          color="primary"
                          disable
                        />

                        <!-- FALLBACK -->
                        <q-input
                          v-else
                          :model-value="getReadableAnswerValue(answer)"
                          outlined
                          readonly
                          autogrow
                          color="primary"
                        />
                      </q-card-section>
                    </q-card>
                  </div>

                  <q-banner
                    v-else
                    rounded
                    class="bg-blue-1 text-primary"
                    inline-actions
                  >
                    Este formulario no tiene respuestas registradas.
                  </q-banner>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- RIGHT SIDE -->
          <div
            v-show="!isMobile || activeTab === 'patient'"
            :class="isMobile ? 'col-12' : 'col-5'"
            class="column full-height"
          >
            <div class="content-scroll">
              <q-card flat bordered class="section-card">
                <q-card-section class="row items-center justify-between">
                  <div>
                    <div class="text-h6 text-weight-bold">Datos del paciente</div>
                    <div class="text-caption text-grey-7">
                      Información personal, identificación, salud y contacto.
                    </div>
                  </div>

                  <q-avatar color="primary" text-color="white" icon="person" />
                </q-card-section>

                <q-separator />

                <q-card-section class="q-gutter-md">
                  <q-card
                    v-for="(group, index) in patientGroups"
                    :key="index"
                    flat
                    bordered
                    class="patient-group-card"
                  >
                    <q-card-section>
                      <div class="row items-center q-gutter-sm q-mb-md">
                        <q-icon :name="group.icon" color="primary" size="20px" />
                        <div class="text-subtitle1 text-weight-bold">
                          {{ group.title }}
                        </div>
                      </div>

                      <div class="q-gutter-sm">
                        <div
                          v-for="(item, itemIndex) in group.items"
                          :key="itemIndex"
                          class="info-row"
                        >
                          <div class="info-label">{{ item.label }}</div>

                          <div class="info-value">
                            <template v-if="Array.isArray(item.value)">
                              <div v-if="item.value.length" class="q-gutter-xs">
                                <q-chip
                                  v-for="(tag, tagIndex) in item.value"
                                  :key="tagIndex"
                                  dense
                                  outline
                                  color="primary"
                                >
                                  {{ tag }}
                                </q-chip>
                              </div>
                              <span v-else>-</span>
                            </template>

                            <template v-else>
                              {{ formatValue(item.value) }}
                            </template>
                          </div>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </q-dialog>

  <GenerateDocumentModal v-model="openDocumentModal" :data="data" />
  <SeePdfModal v-model:show="showPdfModal" :answerId="data?._id" />
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from "vue";
import { useQuasar } from "quasar";
import GenerateDocumentModal from "./GenerateDocumentModal.vue";
import SeePdfModal from "./SeePdfModal.vue";
import money from "src/components/utils/formatter";
import moment from "moment";

const $q = useQuasar();

const props = defineProps({
  openModal: {
    type: Boolean,
    required: true,
  },
  data: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  confirmFinish: {
    type: Function,
    required: false,
  },
});

const emit = defineEmits(["update:openModal"]);

const openDocumentModal = ref(false);
const showPdfModal = ref(false);
const activeTab = ref("answers");

const dialogModel = computed({
  get: () => props.openModal,
  set: (val) => emit("update:openModal", val),
});

const isMobile = computed(() => $q.screen.lt.md);

const answers = computed(() => {
  return Array.isArray(props.data?.answer) ? props.data.answer : [];
});

const serviceImage = computed(() => {
  return (
    props.data?.services?.img ||
    "https://prorpeties-file.sfo3.digitaloceanspaces.com/conjunto-vacio.png"
  );
});

const patientFullName = computed(() => {
  const patient = props.data?.patient || {};
  const parts = [
    patient.name,
    patient.secondName,
    patient.firstLastName,
    patient.secondLastName,
  ].filter(Boolean);

  return parts.length ? parts.join(" ") : "Paciente no disponible";
});

const amountPaidFormatted = computed(() => {
  return money.formatter(Number(props.data?.amountPaid || 0));
});

const createdAtFormatted = computed(() => {
  return props.data?.created_at ? moment(props.data.created_at).format("LL") : "-";
});

const updatedAtFormatted = computed(() => {
  return props.data?.updated_at ? moment(props.data.updated_at).format("LL") : "-";
});

const statusColor = computed(() => {
  return props.data?.status?.color || "#1976D2";
});

const patientGroups = computed(() => {
  const p = props.data?.patient || {};

  return [
    {
      title: "Información personal",
      icon: "badge",
      items: [
        { label: "Primer nombre", value: p.name },
        { label: "Segundo nombre", value: p.secondName },
        { label: "Apellido paterno", value: p.firstLastName },
        { label: "Apellido materno", value: p.secondLastName },
        { label: "Género", value: p.gender?.name },
        { label: "Fecha de nacimiento", value: p.birthDate },
        { label: "Estado civil", value: p.maritalStatus },
      ],
    },
    {
      title: "Identificación",
      icon: "fingerprint",
      items: [
        { label: "No. Seguro Social", value: p.socialNumber },
        { label: "Tipo de identificación", value: p.typeOfIdentification },
        { label: "Número de identificación", value: p.identificationNumber },
      ],
    },
    {
      title: "Datos de salud y físicos",
      icon: "monitor_heart",
      items: [
        { label: "Peso (kg)", value: p.weight },
        { label: "Altura (cm)", value: p.height },
        { label: "Estado de fumador", value: p.smokingStatus },
        { label: "Alergias", value: Array.isArray(p.alergies) ? p.alergies : [] },
      ],
    },
    {
      title: "Información de contacto",
      icon: "contact_phone",
      items: [
        { label: "Dirección", value: p.address },
        { label: "Código Postal", value: p.postalCode },
        { label: "Teléfono", value: p.phone },
        { label: "Ciudad", value: p.city?.name },
        { label: "Email", value: p.email },
      ],
    },
  ];
});

watch(
  () => props.openModal,
  (val) => {
    if (val) {
      activeTab.value = "answers";
    }
  }
);

const closeModal = () => {
  dialogModel.value = false;
};

const openDocumentModalFunct = () => {
  openDocumentModal.value = true;
};

const showPdfModalFunct = () => {
  showPdfModal.value = true;
};

const handleSend = () => {
  if (typeof props.confirmFinish === "function") {
    props.confirmFinish(props.data);
  }
  dialogModel.value = false;
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return value;
};

const getAnswerType = (answer) => {
  return answer?.form?.typeOfForm?.code || "TEXT";
};

const getOptionKey = (option) => {
  if (option && typeof option === "object") {
    return option.value ?? option._id ?? option.label ?? String(option);
  }
  return String(option);
};

const buildOptions = (options) => {
  return (options || []).map((option) => ({
    label: option?.label ?? String(option),
    value: getOptionKey(option),
  }));
};

const getSingleSelectedKey = (value) => {
  if (value === null || value === undefined || value === "") return null;

  if (value && typeof value === "object") {
    return value.value ?? value._id ?? value.label ?? String(value);
  }

  return String(value);
};

const getSelectedKeys = (value) => {
  if (!value) return [];

  const arr = Array.isArray(value) ? value : [value];

  return arr.map((item) => {
    if (item && typeof item === "object") {
      return item.value ?? item._id ?? item.label ?? String(item);
    }
    return String(item);
  });
};

const getReadableAnswerValue = (answer) => {
  const type = getAnswerType(answer);
  const value = answer?.value;

  if (value === null || value === undefined || value === "") return "-";

  if (type === "DATE") {
    return moment(value).isValid() ? moment(value).format("LL") : value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          return item.label ?? item.value ?? item._id ?? String(item);
        }
        return String(item);
      })
      .join(", ");
  }

  if (typeof value === "object") {
    return value.label ?? value.value ?? value._id ?? JSON.stringify(value);
  }

  return String(value);
};
</script>

<style scoped>
.paid-service-modal {
  width: 1280px;
  max-width: 96vw;
  height: 92vh;
  border-radius: 24px;
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, #ffffff 0%, #f6f9ff 100%);
  padding: 20px;
}

.modal-content {
  padding: 16px;
  height: calc(92vh - 105px);
  overflow: hidden;
}

.summary-card,
.section-card,
.answer-card,
.patient-group-card {
  border-radius: 18px;
  background: #ffffff;
}

.content-scroll {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.info-row {
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 12px;
  color: #7b8794;
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
  word-break: break-word;
}

@media (max-width: 1023px) {
  .paid-service-modal {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    border-radius: 0;
  }

  .modal-content {
    height: calc(100vh - 96px);
    padding: 12px;
  }

  .modal-header {
    padding: 14px;
  }
}
</style>