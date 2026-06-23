<template>
  <q-dialog v-model="open" persistent>
    <q-card class="punch-dialog-card">
      <PunchDetailsHeader
        :employee-name="employeeName"
        :employee-ext="employeeExt"
        :employee-avatar="employeeAvatar"
        :formatted-date-long="formattedDateLong"
        :any-late="anyLate"
        :punch-count="punchesSorted.length"
        @close="open = false"
      />

      <q-card-section class="dialog-body">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-lg-8">
            <div class="left-stack">
              <div class="section-shell">
                <div class="section-title-row">
                  <div>
                    <div class="section-title">
                      <q-icon name="calendar_today" color="primary" />
                      Jornada del día
                    </div>
                    <div class="section-subtitle">
                      Horario, clasificación y control de pago.
                    </div>
                  </div>

                  <q-badge
                    v-if="workSummaryClassification"
                    color="primary"
                    outline
                    class="classification-badge"
                  >
                    {{ workSummaryClassification }}
                  </q-badge>
                </div>

                <PunchScheduleCard
                  :day-name="dayName"
                  :schedule-for-day="scheduleForDay"
                  :classification="workSummaryClassification"
                  @change="updateClassification"
                />

                <PayrollControlCard
                  v-if="workSummaryClassification == 'Trabajo regular'"
                  class="q-mt-md"
                  :work-summary-id="props.workSummary"
                  :work-summary-doc="workSummaryDoc"
                  :classification="workSummaryClassification"
                  :expected-fallback-minutes="wsExpectedMinutes"
                  @saved="onPayrollControlSaved"
                />

                <q-card
                  flat
                  bordered
                  class="manual-hours-card q-mt-md"
                  v-if="workSummaryClassification != 'Trabajo regular'"
                >
                  <q-card-section>
                    <div class="row items-center justify-between q-col-gutter-sm">
                      <div class="col-12 col-sm">
                        <div class="manual-title">
                          <q-icon name="edit_calendar" color="primary" />
                          Ajuste del día
                        </div>
                        <div class="manual-subtitle">
                          Cambia las horas pagables cuando el día no es “Trabajo regular”.
                        </div>
                      </div>

                      <div class="col-12 col-sm-auto">
                        <q-badge
                          v-if="canEditManualHours"
                          color="primary"
                          class="pay-impact-badge"
                        >
                          {{ wsPayImpactLabel }}
                        </q-badge>
                      </div>
                    </div>

                    <q-separator class="q-my-md" />

                    <div v-if="!canEditManualHours" class="empty-note">
                      <q-icon name="info" />
                      Para “Trabajo regular” las horas se calculan con los ponches.
                    </div>

                    <div v-else class="row q-col-gutter-md items-end">
                      <div class="col-12 col-md-6">
                        <q-input
                          v-model.number="manualHours"
                          type="number"
                          min="0"
                          step="0.25"
                          label="Horas pagables"
                          outlined
                          dense
                          class="rounded-input"
                          :hint="`Minutos: ${manualMinutes}`"
                        >
                          <template #prepend>
                            <q-icon name="schedule" color="primary" />
                          </template>
                        </q-input>

                        <div class="quick-actions">
                          <q-chip
                            clickable
                            dense
                            color="grey-3"
                            text-color="dark"
                            @click="manualHours = 0"
                          >
                            0h
                          </q-chip>

                          <q-chip
                            clickable
                            dense
                            color="primary"
                            text-color="white"
                            @click="manualHours = wsExpectedHours"
                          >
                            Completo {{ wsExpectedHours }}h
                          </q-chip>

                          <q-chip
                            clickable
                            dense
                            color="grey-3"
                            text-color="dark"
                            @click="manualHours = 4"
                          >
                            4h
                          </q-chip>
                        </div>
                      </div>

                      <div class="col-12 col-md-6">
                        <div class="summary-mini-grid">
                          <div class="summary-mini-item">
                            <span>Esperado</span>
                            <b>{{ wsExpectedHours }}h</b>
                          </div>

                          <div class="summary-mini-item">
                            <span>Faltante</span>
                            <b>{{ wsNotWorkedHours }}h</b>
                          </div>

                          <div class="summary-mini-item full">
                            <span>Clasificación</span>
                            <b>{{ workSummaryClassification || "—" }}</b>
                          </div>
                        </div>
                      </div>

                      <div class="col-12">
                        <div class="row justify-end">
                          <q-btn
                            unelevated
                            no-caps
                            color="primary"
                            icon="save"
                            label="Guardar horas"
                            class="save-hours-btn"
                            :loading="updatingWorkSummary"
                            @click="saveManualHours"
                          />
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="section-shell">
                <div class="section-title-row">
                  <div>
                    <div class="section-title">
                      <q-icon name="timeline" color="primary" />
                      Línea de ponches
                    </div>
                    <div class="section-subtitle">
                      Consulta, edita, elimina o agrega ponches del día.
                    </div>
                  </div>

                  <q-badge color="blue-grey-1" text-color="primary" class="count-badge">
                    {{ punchesSorted.length }} registro{{ punchesSorted.length === 1 ? "" : "s" }}
                  </q-badge>
                </div>

                <PunchTimeline
                  :punches="punchesSorted"
                  :punch-step-options="punchStepOptions"
                  :saving-map="savingMap"
                  :deleting-map="deletingMap"
                  :uploading-map="uploadingMap"
                  :step-meta="stepMeta"
                  :late-label="lateLabel"
                  :format-time="formatTime"
                  @preview-image="previewImage"
                  @start-edit="startEdit"
                  @cancel-edit="cancelEdit"
                  @save-edit="saveEdit"
                  @delete-punch="confirmDeletePunch"
                  @remove-image="confirmRemovePunchImage"
                  @replace-image="replacePunchImage"
                  @add="openAddPunch"
                />
              </div>

              <div v-if="images.length" class="section-shell">
                <div class="section-title-row">
                  <div>
                    <div class="section-title">
                      <q-icon name="photo_library" color="primary" />
                      Capturas
                    </div>
                    <div class="section-subtitle">
                      Evidencias asociadas a los ponches.
                    </div>
                  </div>
                </div>

                <PunchCapturesGallery
                  :images="images"
                  @preview="previewImage"
                />
              </div>

              <AddPunchDialog
                v-model="addPunchOpen"
                :loading="addPunchLoading"
                :date-string="props.dateString"
                :punch-step-options="punchStepOptions"
                :current-step="currentStepToExclude"
                @submit="createPunch"
              />
            </div>
          </div>

          <div class="col-12 col-lg-4">
            <div class="right-stack">
              <div class="side-shell">
                <div class="side-title">
                  <q-icon name="folder_open" color="primary" />
                  Documentación
                </div>

                <DayDocumentationPanel
                  :user-id="props.user._id"
                  :date-string="props.dateString"
                  :work-summary="props.workSummary"
                />
              </div>

              <q-card flat bordered class="audit-card">
                <q-card-section class="audit-header">
                  <div>
                    <div class="side-title">
                      <q-icon name="history" color="primary" />
                      Auditoría
                    </div>
                    <div class="side-subtitle">
                      Historial de cambios del día y ponches.
                    </div>
                  </div>

                  <q-badge
                    v-if="auditCount > 0"
                    color="primary"
                    class="audit-count"
                  >
                    {{ auditCount }}
                  </q-badge>
                </q-card-section>

                <q-separator />

                <q-card-section class="q-gutter-sm">
                  <q-expansion-item
                    dense
                    expand-separator
                    icon="event_note"
                    label="Cambios del día"
                    :caption="
                      wsAudit.length
                        ? `${wsAudit.length} cambio(s)`
                        : 'Sin cambios'
                    "
                    class="audit-expansion"
                  >
                    <q-list dense bordered class="audit-list">
                      <q-item v-if="!wsAudit.length">
                        <q-item-section>
                          <q-item-label caption>
                            No hay auditoría registrada.
                          </q-item-label>
                        </q-item-section>
                      </q-item>

                      <q-item v-for="(a, idx) in wsAudit" :key="`ws-${idx}`">
                        <q-item-section>
                          <q-item-label class="audit-item-title">
                            {{ formatAuditHeader(a) }}
                          </q-item-label>

                          <q-item-label caption>
                            <div v-for="(c, cidx) in a.changes || []" :key="cidx">
                              <b>{{ c.field }}:</b>
                              {{ formatMixed(c.from, c.field) }} →
                              {{ formatMixed(c.to, c.field) }}
                            </div>
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-expansion-item>

                  <q-expansion-item
                    dense
                    expand-separator
                    icon="fingerprint"
                    label="Cambios en ponches"
                    :caption="
                      punchAuditTotal
                        ? `${punchAuditTotal} cambio(s)`
                        : 'Sin cambios'
                    "
                    class="audit-expansion"
                  >
                    <div
                      v-if="!punchAuditPunches.length"
                      class="empty-audit-note"
                    >
                      No hay auditoría registrada en los ponches.
                    </div>

                    <div
                      v-for="p in punchAuditPunches"
                      :key="p._id"
                      class="q-mt-sm"
                    >
                      <q-expansion-item
                        dense
                        expand-separator
                        :label="`${stepMeta(p.punchStep).label} · ${formatTime(p.timestamp)}`"
                        :caption="
                          p.audit?.length ? `${p.audit.length} cambio(s)` : '—'
                        "
                        class="audit-nested"
                      >
                        <q-list dense bordered class="audit-list">
                          <q-item
                            v-for="(a, idx) in p.audit || []"
                            :key="`p-${p._id}-${idx}`"
                          >
                            <q-item-section>
                              <q-item-label class="audit-item-title">
                                {{ formatAuditHeader(a) }}
                              </q-item-label>

                              <q-item-label caption>
                                <div
                                  v-for="(c, cidx) in a.changes || []"
                                  :key="cidx"
                                >
                                  <b>{{ c.field }}:</b>
                                  {{ formatMixed(c.from, c.field) }} →
                                  {{ formatMixed(c.to, c.field) }}
                                </div>
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </q-expansion-item>
                    </div>
                  </q-expansion-item>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-inner-loading
        :showing="loading"
        label="Procesando..."
        label-class="text-primary text-weight-bold"
        color="primary"
      />
    </q-card>
  </q-dialog>

  <q-dialog v-model="imgPreview.open" persistent maximized>
    <q-card class="image-preview-card">
      <div class="image-preview-toolbar">
        <q-btn
          round
          unelevated
          icon="close"
          color="white"
          text-color="dark"
          @click="imgPreview.open = false"
        />
      </div>

      <q-img
        :src="imgPreview.src"
        class="image-preview"
        fit="contain"
      />
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useQuasar } from "quasar";
import moment from "moment";
import "moment/dist/locale/es";
import methodsHttp from "src/api/methodsHttp";

import PunchDetailsHeader from "./punch/PunchDetailsHeader.vue";
import PunchScheduleCard from "./punch/PunchScheduleCard.vue";
import PunchTimeline from "./punch/PunchTimeline.vue";
import PunchCapturesGallery from "./punch/PunchCapturesGallery.vue";
import DayDocumentationPanel from "./punch/DayDocumentationPanel.vue";
import AddPunchDialog from "./punch/AddPunchDialog.vue";
import PayrollControlCard from "./PayrollControlCard.vue";

const $q = useQuasar();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  dateString: { type: String, default: "" },
  user: { type: Object, default: null },
  workSummary: { type: String, default: "" },
  classification: { type: String, default: "" },
  descuentoTotal: { type: Number, default: 0 },
});

const emit = defineEmits(["update:modelValue", "update"]);

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const round2 = (n) => Math.round(toNum(n, 0) * 100) / 100;

const loading = ref(false);
const punchData = ref([]);
const workSummaryDoc = ref(null);

const updatingClassification = ref(false);
const updatingWorkSummary = ref(false);

const workSummaryClassification = ref(props.classification || "");

const imgPreview = ref({ open: false, src: "" });

const previewImage = (src) => {
  if (!src) return;
  imgPreview.value = { open: true, src };
};

const API = {
  createPunch: "punch/createPunchData",
  getByDate: (date, user) =>
    `punch/getPunchHistoryByDate?date=${date}&user=${user}`,
  updatePunch: "punch/updatePunchData",
  deletePunch: "punch/deletePunchData",
  removePunchImage: "punch/removePunchImage",
  uploadPunchImage: (id) => `punch/uploadPunchImage/${id}`,
  updateWorkSummaryDayConfig: "punch/updateWorkSummaryDayConfig",
  updateWorkSummaryPayrollControl: "punch/updateWorkSummaryPayrollControl",
};

const getPunchHistoryByDate = async (date, user) => {
  loading.value = true;

  try {
    const resp = await methodsHttp.getApi(API.getByDate(date, user));

    if (resp?.ok) {
      punchData.value = Array.isArray(resp.punch) ? resp.punch : [];
      workSummaryDoc.value = resp.workSummary || null;

      const cls =
        resp.workSummary?.classification || props.classification || "";

      workSummaryClassification.value = cls;
    }
  } catch (error) {
    console.error("getPunchHistoryByDate error:", error);
  } finally {
    loading.value = false;
  }
};

watch(
  () => [open.value, props.dateString, props.user],
  async ([isOpen, d, u]) => {
    if (isOpen && d && u?._id) {
      await getPunchHistoryByDate(d, u._id);
    }
  },
  { immediate: true },
);

watch(
  () => props.classification,
  (v) => {
    if (!workSummaryDoc.value) {
      workSummaryClassification.value = v || "";
    }
  },
);

const punchesSorted = computed(() => {
  const arr = Array.isArray(punchData.value) ? [...punchData.value] : [];
  return arr.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
});

const formatTime = (iso) => (iso ? moment(iso).format("HH:mm:ss") : "—");

const formatDateLong = (iso) =>
  iso ? moment(iso).format("dddd, DD MMM YYYY") : "";

const addPunchOpen = ref(false);
const addPunchLoading = ref(false);

const baseDate = computed(
  () => punchesSorted.value[0]?.date || props.dateString || "",
);

const formattedDateLong = computed(() => formatDateLong(baseDate.value));

const employeeObj = computed(() => props.user || null);
const employeeName = computed(() => employeeObj.value?.name || "Empleado");
const employeeExt = computed(() => employeeObj.value?.ext || "");
const employeeAvatar = computed(
  () => employeeObj.value?.img || employeeObj.value?.image || "",
);

const dayName = computed(() => {
  return (
    baseDate.value
      ? moment(baseDate.value)
          .format("dddd")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      : ""
  ).toLowerCase();
});

const scheduleForDay = computed(() => {
  const sch =
    punchesSorted.value[0]?.user?.schedule || props.user?.schedule || {};

  return (
    sch?.[dayName.value] || {
      isActive: false,
      entryTime: "",
      lunchStartTime: "",
      lunchEndTime: "",
      exitTime: "",
    }
  );
});

const images = computed(() =>
  punchesSorted.value.map((p) => p.img).filter(Boolean),
);

const anyLate = computed(() => punchesSorted.value.some((p) => !!p.isLate));

const stepMeta = (step) => {
  const map = {
    entrada: { icon: "login", color: "primary", label: "Entrada" },
    salida_almuerzo: {
      icon: "restaurant",
      color: "orange",
      label: "Salida a almuerzo",
    },
    entrada_almuerzo: {
      icon: "restaurant_menu",
      color: "indigo",
      label: "Entrada de almuerzo",
    },
    salida: { icon: "logout", color: "teal", label: "Salida" },
  };

  return (
    map[step] || { icon: "schedule", color: "grey", label: step || "Ponche" }
  );
};

const pDiff = (p) => {
  if (!p?.expectedTime || !p?.timestamp) return null;

  const d = p.date || punchesSorted.value[0]?.date;

  if (!d) return null;

  const expectedISO = moment(
    `${d} ${p.expectedTime}`,
    "YYYY-MM-DD HH:mm:ss",
  ).toISOString();

  const real = moment(p.timestamp);
  const expected = moment(expectedISO);

  return Math.round(real.diff(expected, "minutes"));
};

const lateLabel = (p) => {
  const diff = pDiff(p);

  if (diff === null) return "Sin hora esperada";
  if (diff > 0) return `Tarde +${diff}m`;
  if (diff < 0) return `Temprano ${Math.abs(diff)}m`;

  return "A tiempo";
};

const punchStepOptions = [
  { label: "Entrada", value: "entrada" },
  { label: "Salida a almuerzo", value: "salida_almuerzo" },
  { label: "Entrada de almuerzo", value: "entrada_almuerzo" },
  { label: "Salida", value: "salida" },
];

const savingMap = ref({});
const deletingMap = ref({});
const uploadingMap = ref({});
const currentStepToExclude = ref("");

const manualHours = ref(null);

const canEditManualHours = computed(() => {
  const cls = (workSummaryClassification.value || "").trim();
  return !!cls && cls !== "Trabajo regular";
});

const wsExpectedMinutes = computed(() => {
  const v = toNum(workSummaryDoc.value?.expectedMinutes, NaN);

  if (Number.isFinite(v)) return v;

  const s = scheduleForDay.value;

  if (!s?.isActive || !s?.entryTime || !s?.exitTime) return 0;

  const toMin = (t) => {
    const [hh, mm] = String(t)
      .split(":")
      .map((x) => parseInt(x, 10));

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;

    return hh * 60 + mm;
  };

  const entry = toMin(s.entryTime);
  const exit = toMin(s.exitTime);

  let total = Math.max(exit - entry, 0);

  if (s.lunchStartTime && s.lunchEndTime) {
    const ls = toMin(s.lunchStartTime);
    const le = toMin(s.lunchEndTime);
    total = Math.max(total - Math.max(le - ls, 0), 0);
  }

  return total;
});

const wsTotalMinutes = computed(() =>
  toNum(workSummaryDoc.value?.totalMinutes, 0),
);

const wsNotWorkedMinutes = computed(() => {
  const v = toNum(workSummaryDoc.value?.notWorkedMinutes, NaN);

  if (Number.isFinite(v)) return v;

  return Math.max(wsExpectedMinutes.value - wsTotalMinutes.value, 0);
});

const wsPayImpact = computed(() => {
  const v = String(workSummaryDoc.value?.payImpact || "").toUpperCase();

  if (v === "NONE" || v === "DEDUCT" || v === "PAID_LEAVE") return v;

  return wsNotWorkedMinutes.value > 0 ? "DEDUCT" : "NONE";
});

const wsExpectedHours = computed(() => round2(wsExpectedMinutes.value / 60));
const wsNotWorkedHours = computed(() => round2(wsNotWorkedMinutes.value / 60));

const manualMinutes = computed(() =>
  Math.round(toNum(manualHours.value, 0) * 60),
);

const wsPayImpactLabel = computed(() => {
  if (wsPayImpact.value === "DEDUCT") return "Descuenta";
  if (wsPayImpact.value === "PAID_LEAVE") return "Permiso pagado";
  return "Sin descuento";
});

watch(
  () => [open.value, workSummaryDoc.value, canEditManualHours.value],
  ([isOpen, ws, canEdit]) => {
    if (!isOpen) return;

    if (canEdit) {
      manualHours.value = round2(toNum(ws?.totalMinutes, 0) / 60);
    } else {
      manualHours.value = null;
    }
  },
  { immediate: true },
);

const saveManualHours = async () => {
  try {
    if (!props.workSummary) {
      $q.notify({
        type: "negative",
        message: "No se encontró WorkSummaryId para este día",
      });

      return;
    }

    if (!canEditManualHours.value) {
      $q.notify({
        type: "warning",
        message: "Solo se ajusta en días que no sean Trabajo regular.",
      });

      return;
    }

    const hrs = toNum(manualHours.value, 0);

    if (hrs < 0) {
      $q.notify({ type: "warning", message: "Horas inválidas." });
      return;
    }

    updatingWorkSummary.value = true;

    const payload = {
      workSummaryId: props.workSummary,
      classification: workSummaryClassification.value,
      totalMinutes: manualMinutes.value,
    };

    const resp = await methodsHttp.putApi(
      API.updateWorkSummaryDayConfig,
      payload,
    );

    if (!resp?.ok) {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo guardar el ajuste.",
      });

      return;
    }

    workSummaryDoc.value = resp.workSummary || workSummaryDoc.value;

    workSummaryClassification.value =
      resp?.workSummary?.classification || workSummaryClassification.value;

    $q.notify({ type: "positive", message: "Horas del día actualizadas." });

    emit("update");
  } catch (error) {
    $q.notify({
      type: "negative",
      message: error?.message || "Error guardando horas del día.",
    });
  } finally {
    updatingWorkSummary.value = false;
  }
};

const wsAudit = computed(() =>
  Array.isArray(workSummaryDoc.value?.audit) ? workSummaryDoc.value.audit : [],
);

const punchAuditPunches = computed(() => {
  return punchesSorted.value.filter(
    (p) => Array.isArray(p.audit) && p.audit.length,
  );
});

const punchAuditTotal = computed(() => {
  return punchAuditPunches.value.reduce(
    (acc, p) => acc + (p.audit?.length || 0),
    0,
  );
});

const auditCount = computed(() => wsAudit.value.length + punchAuditTotal.value);

const formatMixed = (v, type) => {
  if (type == "timestamp") {
    return moment(v).format("HH:mm:ss");
  }

  if (v === null || v === undefined || v === "") return "—";

  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }

  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const formatAuditBy = (by) => {
  if (!by) return "—";
  if (typeof by === "string") return by;

  return by?.name || by?.email || by?._id || "—";
};

const formatAuditHeader = (a) => {
  const at = a?.at ? moment(a.at).format("DD/MM/YYYY HH:mm") : "—";
  const by = formatAuditBy(a?.by);
  const ip = a?.ip ? ` · ${a.ip}` : "";

  return `${at} · ${by}${ip}`;
};

const startEdit = (p) => {
  if (p._editing) return;

  p._editing = true;
  p._original = JSON.parse(JSON.stringify(p));

  p.edit = {
    punchStep: p.punchStep,
    expectedTime: p.expectedTime || "",
    isLate: !!p.isLate,
    img: p.img || "",
    timestamp: p.timestamp,
  };

  p.editTime = formatTime(p.timestamp);
  p.editImageFile = null;
  p.removeImage = false;

  currentStepToExclude.value = p.punchStep || "";
};

const cancelEdit = (p) => {
  Object.assign(p, p._original || {});

  p._editing = false;

  delete p._original;
  delete p.edit;
  delete p.editTime;
  delete p.editImageFile;
  delete p.removeImage;

  currentStepToExclude.value = "";
};

const uploadPunchImage = async (punchId, file) => {
  const fd = new FormData();

  fd.append("punchId", punchId);
  fd.append("images", file);

  const resp = await methodsHttp.putApi(API.uploadPunchImage(punchId), fd);

  if (!resp?.ok) throw new Error("No se pudo subir la imagen");

  return resp?.url || resp?.img || resp?.fileUrl;
};

const saveEdit = async (p) => {
  const id = p._id;

  if (!id) return;

  try {
    savingMap.value[id] = true;

    const date = p.date || punchesSorted.value[0]?.date || props.dateString;
    const hhmm = p.editTime;

    const newTs = moment(
      `${date} ${hhmm}`,
      "YYYY-MM-DD HH:mm:ss",
    ).toISOString();

    let newImg = p.img || "";

    if (p.removeImage) {
      await methodsHttp.putApi(API.removePunchImage, { id });
      newImg = "";
    } else if (p.editImageFile) {
      uploadingMap.value[id] = true;
      newImg = await uploadPunchImage(id, p.editImageFile);
    }

    const payload = {
      id,
      punchStep: p.edit.punchStep,
      timestamp: newTs,
      expectedTime: p.edit.expectedTime || null,
      img: newImg || null,
    };

    const resp = await methodsHttp.putApi(API.updatePunch, payload);

    if (resp?.ok) {
      p.punchStep = payload.punchStep;
      p.timestamp = payload.timestamp;
      p.expectedTime = payload.expectedTime || "";
      p.img = newImg || "";
      p.isLate = resp.punchHistory?.isLate ?? p.isLate;

      p._editing = false;

      delete p._original;
      delete p.edit;
      delete p.editTime;
      delete p.editImageFile;
      delete p.removeImage;

      currentStepToExclude.value = "";

      await getPunchHistoryByDate(props.dateString, props.user._id);

      emit("update");
    } else {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo actualizar el ponche",
      });
    }
  } catch (error) {
    $q.notify({
      type: "negative",
      message: error?.message || "Error guardando cambios",
    });
  } finally {
    savingMap.value[id] = false;
    uploadingMap.value[id] = false;
  }
};

const confirmDeletePunch = (p) => {
  $q.dialog({
    title: "Eliminar ponche",
    message:
      "¿Seguro que deseas eliminar este ponche? Esta acción no se puede deshacer.",
    cancel: true,
    persistent: true,
  }).onOk(() => deletePunch(p));
};

const deletePunch = async (p) => {
  const id = p?._id;

  if (!id) return;

  try {
    deletingMap.value[id] = true;

    const resp = await methodsHttp.deleteApi(`${API.deletePunch}/${id}`);

    if (resp?.ok) {
      emit("update");
      await getPunchHistoryByDate(props.dateString, props.user._id);

      $q.notify({ type: "positive", message: "Ponche eliminado" });
    } else {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo eliminar",
      });
    }
  } catch (error) {
    $q.notify({ type: "negative", message: "Error eliminando ponche" });
  } finally {
    deletingMap.value[id] = false;
  }
};

const confirmRemovePunchImage = (p) => {
  $q.dialog({
    title: "Eliminar imagen",
    message: "¿Deseas eliminar la captura de este ponche?",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    if (p._editing) {
      p.removeImage = true;
    } else {
      startEdit(p);
      p.removeImage = true;
      saveEdit(p);
    }
  });
};

const replacePunchImage = (p, file) => {
  if (!p._editing) startEdit(p);

  p.editImageFile = file;
  p.removeImage = false;
};

const openAddPunch = () => {
  addPunchOpen.value = true;
};

const createPunch = async (form) => {
  try {
    addPunchLoading.value = true;

    const ts = moment(
      `${props.dateString} ${form.time}`,
      "YYYY-MM-DD HH:mm:ss",
    ).toISOString();

    const fd = new FormData();

    fd.append("userId", props.user._id);
    fd.append("workSummary", props.workSummary);
    fd.append("dateString", props.dateString);
    fd.append("punchStep", form.punchStep);
    fd.append("timestamp", ts);

    if (form.expectedTime) fd.append("expectedTime", form.expectedTime);
    if (form.imageFile) fd.append("image", form.imageFile);

    const resp = await methodsHttp.postApi(API.createPunch, fd);

    if (!resp?.ok) {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo crear el ponche",
      });

      return;
    }

    addPunchOpen.value = false;

    emit("update");

    await getPunchHistoryByDate(props.dateString, props.user._id);

    $q.notify({ type: "positive", message: "Ponche agregado" });
  } catch (error) {
    $q.notify({
      type: "negative",
      message: error?.message || "Error agregando ponche",
    });
  } finally {
    addPunchLoading.value = false;
  }
};

const updateClassification = async (newVal) => {
  try {
    if (!props.workSummary) {
      $q.notify({
        type: "negative",
        message: "No se encontró WorkSummaryId para este día",
      });

      return;
    }

    const current = (workSummaryClassification.value || "").trim();
    const next = (newVal || "").trim();

    if (current === next) return;

    updatingClassification.value = true;

    workSummaryClassification.value = next;

    const resp = await methodsHttp.putApi(
      "punch/updateWorkSummaryClassification",
      {
        workSummaryId: props.workSummary,
        classification: next,
      },
    );

    if (!resp?.ok) {
      workSummaryClassification.value = current;

      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo actualizar la clasificación",
      });

      return;
    }

    if (workSummaryDoc.value) {
      workSummaryDoc.value.classification = next;
    }

    emit("update");

    $q.notify({ type: "positive", message: "Clasificación actualizada" });
  } catch (error) {
    $q.notify({
      type: "negative",
      message: error?.message || "Error actualizando clasificación",
    });
  } finally {
    updatingClassification.value = false;
  }
};

const onPayrollControlSaved = async (updatedWs) => {
  if (updatedWs) workSummaryDoc.value = updatedWs;

  await getPunchHistoryByDate(props.dateString, props.user._id);

  emit("update");
};
</script>

<style scoped>
.punch-dialog-card {
  width: 1180px;
  max-width: 96vw;
  max-height: 94vh;
  border-radius: 26px;
  overflow: hidden;
  background: #f8fafc;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18);
}

.dialog-body {
  max-height: calc(94vh - 98px);
  overflow-y: auto;
  padding: 18px;
}

.left-stack,
.right-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-shell,
.side-shell,
.audit-card {
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.04);
}

.section-shell {
  padding: 16px;
}

.side-shell {
  padding: 14px;
}

.section-title-row,
.audit-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-title,
.side-title,
.manual-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-size: 0.96rem;
  font-weight: 900;
}

.section-subtitle,
.side-subtitle,
.manual-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
}

.classification-badge,
.count-badge,
.audit-count,
.pay-impact-badge {
  border-radius: 999px;
  padding: 6px 9px;
  font-weight: 900;
}

.manual-hours-card {
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(23, 141, 210, 0.08), transparent 34%),
    #ffffff;
  border: 1px solid rgba(23, 141, 210, 0.12);
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
}

.quick-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;
}

.summary-mini-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.summary-mini-item {
  min-height: 58px;
  padding: 10px 12px;
  border-radius: 15px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.summary-mini-item.full {
  grid-column: 1 / -1;
}

.summary-mini-item span {
  display: block;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.summary-mini-item b {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.save-hours-btn {
  min-height: 40px;
  border-radius: 12px;
  font-weight: 800;
}

.empty-note,
.empty-audit-note {
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(23, 141, 210, 0.06);
  color: #475569;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
}

.audit-card {
  overflow: hidden;
}

.audit-header {
  margin-bottom: 0;
  padding: 14px;
}

.audit-expansion,
.audit-nested {
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.audit-list {
  border-radius: 14px;
  overflow: hidden;
  border-color: rgba(15, 23, 42, 0.08);
}

.audit-item-title {
  color: #0f172a;
  font-weight: 800;
  font-size: 0.82rem;
}

.image-preview-card {
  height: 100vh;
  width: 100vw;
  background: rgba(15, 23, 42, 0.94);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview-toolbar {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 2;
}

.image-preview {
  width: 92vw;
  height: 86vh;
  max-width: 1200px;
  max-height: 760px;
  border-radius: 18px;
  overflow: hidden;
}

@media (max-width: 1023px) {
  .punch-dialog-card {
    width: 96vw;
    max-height: 96vh;
    border-radius: 22px;
  }

  .dialog-body {
    max-height: calc(96vh - 98px);
    padding: 14px;
  }
}

@media (max-width: 599px) {
  .punch-dialog-card {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }

  .dialog-body {
    max-height: calc(100vh - 108px);
    padding: 12px;
  }

  .section-shell,
  .side-shell,
  .audit-card {
    border-radius: 18px;
  }

  .section-title-row,
  .audit-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-mini-grid {
    grid-template-columns: 1fr;
  }

  .summary-mini-item.full {
    grid-column: auto;
  }

  .image-preview {
    width: 94vw;
    height: 78vh;
  }
}
</style>