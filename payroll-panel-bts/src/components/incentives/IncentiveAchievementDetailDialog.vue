<template>
  <q-dialog v-model="open" persistent>
    <q-card class="dlg-card">
      <!-- HEADER -->
      <q-card-section class="dlg-header row items-center justify-between">
        <div>
          <div class="text-h6 text-white ellipsis">
            {{ title }}
          </div>
          <div class="text-caption text-white opacity-80">
            {{ subtitle }}
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          color="white"
          @click="open = false"
        />
      </q-card-section>

      <q-separator />

      <!-- TABS -->
      <q-card-section class="q-pa-sm">
        <q-tabs
          v-model="tab"
          dense
          active-color="primary"
          indicator-color="primary"
          align="left"
        >
          <q-tab name="resume" icon="insights" label="Resumen" />
          <q-tab name="breakdown" icon="list_alt" label="Desglose" />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <!-- CONTENT -->
      <q-card-section class="q-pa-md scroll-area">
        <!-- RESUMEN -->
        <div v-show="tab === 'resume'">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
              <q-card flat bordered class="mini-card">
                <q-card-section>
                  <div class="row items-center justify-between">
                    <q-chip
                      dense
                      :color="statusMeta(achievement?.status).color"
                      text-color="white"
                      :icon="statusMeta(achievement?.status).icon"
                    >
                      {{ statusMeta(achievement?.status).label }}
                    </q-chip>

                    <q-chip dense outline color="grey-7" icon="calendar_month">
                      {{ achievement?.month || "—" }}
                    </q-chip>
                  </div>

                  <div class="text-subtitle1 text-weight-bold q-mt-sm">
                    {{ achievement?.rule?.name || "Meta" }}
                  </div>

                  <div class="text-caption text-grey-7">
                    {{ achievement?.program?.name || "Programa" }}
                    <span v-if="subjectName"> · {{ subjectName }}</span>
                  </div>

                  <div class="q-mt-md">
                    <q-linear-progress
                      :value="Number(achievement?.progressPercent || 0) / 100"
                      rounded
                      size="10px"
                    />
                    <div class="row items-center justify-between q-mt-xs">
                      <div class="text-caption text-grey-7">Progreso</div>
                      <div class="text-caption text-weight-bold">
                        {{ achievement?.progressPercent || 0 }}%
                      </div>
                    </div>
                  </div>

                  <div class="row items-center q-gutter-sm q-mt-md">
                    <q-chip dense outline color="primary" icon="redeem">
                      {{ achievement?.rewardSnapshot?.label || "—" }}
                    </q-chip>

                    <q-chip
                      v-if="achievement?.subjectLocalityCode"
                      dense
                      outline
                      color="grey-7"
                      icon="place"
                    >
                      Localidad: {{ achievement.subjectLocalityCode }}
                    </q-chip>
                  </div>

                  <q-banner
                    v-if="achievement?.message"
                    rounded
                    class="bg-grey-2 q-mt-md"
                  >
                    {{ achievement.message }}
                  </q-banner>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-4">
              <q-card flat bordered class="mini-card">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-bold">Métricas</div>

                  <div class="q-mt-sm text-caption text-grey-7">
                    <div
                      v-for="line in metricLines"
                      :key="line.label"
                      class="row items-center justify-between q-mt-xs"
                    >
                      <span>{{ line.label }}</span>
                      <b>{{ line.value }}</b>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <!-- DESGLOSE -->
        <div v-show="tab === 'breakdown'">
          <q-card flat bordered class="mini-card">
            <q-card-section>
              <div class="row items-center justify-between">
                <div class="text-subtitle2 text-weight-bold">
                  {{
                    isAttendance
                      ? "Detalle por día"
                      : isRemindersCountAttended
                        ? "Detalle de citas confirmadas"
                        : "Desglose por bucket"
                  }}
                </div>
              </div>

              <!-- ATTENDANCE TABLE -->
              <div v-if="isAttendance" class="q-mt-md">
                <q-skeleton v-if="breakdownLoading" height="180px" />

                <q-table
                  v-else
                  flat
                  bordered
                  :rows="attendanceDays"
                  :columns="[
                    {
                      name: 'date',
                      label: 'Fecha',
                      field: 'date',
                      align: 'left',
                    },
                    {
                      name: 'classification',
                      label: 'Clasificación',
                      field: 'classification',
                      align: 'left',
                    },
                    {
                      name: 'minutesLabel',
                      label: 'Tiempo trabajado',
                      field: 'minutesLabel',
                      align: 'right',
                    },
                    {
                      name: 'late',
                      label: 'Tarde',
                      field: 'isLate',
                      align: 'center',
                    },
                    {
                      name: 'absent',
                      label: 'Ausente',
                      field: 'isAbsent',
                      align: 'center',
                    },
                    {
                      name: 'excluded',
                      label: 'Excluido',
                      field: 'isExcluded',
                      align: 'center',
                    },
                  ]"
                  row-key="date"
                  :rows-per-page-options="[10, 20, 50]"
                >
                  <template #body-cell-late="props">
                    <q-td :props="props">
                      <q-chip
                        dense
                        :color="props.row.isLate ? 'orange-8' : 'grey-5'"
                        text-color="white"
                      >
                        {{
                          props.row.isLate
                            ? `Sí (${Math.floor(props.row?.lateTime / 60) || 0}m)`
                            : "No"
                        }}
                      </q-chip>
                    </q-td>
                  </template>

                  <template #body-cell-absent="props">
                    <q-td :props="props">
                      <q-chip
                        dense
                        :color="props.row.isAbsent ? 'red-8' : 'grey-5'"
                        text-color="white"
                      >
                        {{ props.row.isAbsent ? "Sí" : "No" }}
                      </q-chip>
                    </q-td>
                  </template>

                  <template #body-cell-excluded="props">
                    <q-td :props="props">
                      <q-chip
                        dense
                        :color="props.row.isExcluded ? 'blue-8' : 'grey-5'"
                        text-color="white"
                      >
                        {{ props.row.isExcluded ? "Sí" : "No" }}
                      </q-chip>
                    </q-td>
                  </template>
                </q-table>
              </div>

              <!-- REMINDERS COUNT (240 / team locality) -->
              <div v-else-if="isRemindersCountAttended" class="q-mt-md">
                <div class="row items-center q-col-gutter-sm">
                  <div class="col-12 col-md-auto">
                    <q-btn
                      color="primary"
                      outline
                      icon="refresh"
                      label="Recargar"
                      :loading="remindersLoading"
                      @click="loadRemindersAttended(remindersPage)"
                    />
                  </div>

                  <div class="col-12 col-md-auto">
                    <q-chip dense outline color="grey-7" icon="list">
                      {{ remindersTotal }} citas
                    </q-chip>
                  </div>

                  <div
                    class="col-12 col-md-auto"
                    v-if="achievement?.metrics?.attendedTarget"
                  >
                    <q-chip dense outline color="primary" icon="flag">
                      Meta: {{ Number(achievement.metrics.attendedTarget) }}
                    </q-chip>
                  </div>
                </div>

                <q-card flat bordered class="mini-card q-mt-md">
                  <q-card-section>
                    <div class="row items-center justify-between">
                      <div class="text-subtitle2 text-weight-bold">
                        Citas confirmadas
                      </div>

                      <q-chip dense outline color="grey-7" icon="rule">
                        {{ achievement?.rule?.code || "—" }}
                      </q-chip>
                    </div>

                    <q-skeleton
                      v-if="remindersLoading"
                      height="220px"
                      class="q-mt-md"
                    />

                    <q-table
                      v-else
                      class="q-mt-md"
                      flat
                      bordered
                      :rows="remindersRows"
                      row-key="_id"
                      :rows-per-page-options="[10, 20, 50]"
                      :pagination="{
                        page: remindersPage,
                        rowsPerPage: remindersLimit,
                        rowsNumber: remindersTotal,
                      }"
                      @request="
                        (p) => {
                          remindersLimit = p.pagination.rowsPerPage;
                          loadRemindersAttended(p.pagination.page);
                        }
                      "
                      :columns="
                        [
                          {
                            name: 'when',
                            label: 'Fecha/Hora',
                            field: 'when',
                            align: 'left',
                          },
                          {
                            name: 'comercial',
                            label: 'Paciente',
                            field: 'comercial',
                            align: 'left',
                          },
                          {
                            name: 'zone',
                            label: 'Zona',
                            field: 'zone',
                            align: 'left',
                          },
                          {
                            name: 'marks',
                            label: 'Marca',
                            field: 'marks',
                            align: 'left',
                          },
                          {
                            name: 'user',
                            label: 'Operador',
                            field: 'user',
                            align: 'left',
                          },
                        ].filter(
                          (column) =>
                            achievement?.rule?.code ===
                              'TEAM_PREMIO_LOCALIDAD_500_ASISTENCIAS' ||
                            column.name !== 'user',
                        )
                      "
                    >
                      <template #body-cell-when="props">
                        <q-td :props="props">
                          <div class="text-weight-bold">
                            {{
                              props.row?.date ||
                              props.row?.createdByOperatorDate ||
                              "—"
                            }}
                          </div>
                          <div class="text-caption text-grey-7">
                            {{ props.row?.hour || "—" }}
                          </div>
                        </q-td>
                      </template>

                      <template #body-cell-comercial="props">
                        <q-td :props="props">
                          <div class="text-weight-bold">
                            {{ props.row?.comercial?.MemberFullname || "—" }}
                          </div>
                          <div class="text-caption text-grey-7">
                            {{
                              props.row?.comercial
                                ?.memberIdentificationNumber || ""
                            }}
                            <span v-if="props.row?.comercial?.HomePhone">
                              · {{ props.row.comercial.HomePhone }}
                            </span>
                          </div>
                        </q-td>
                      </template>

                      <template #body-cell-zone="props">
                        <q-td :props="props">
                          <q-chip dense outline color="primary" icon="place">
                            {{ props.row?.zone?.name || "—" }}
                          </q-chip>
                        </q-td>
                      </template>

                      <template #body-cell-marks="props">
                        <q-td :props="props">
                          <div class="row q-gutter-xs">
                            <q-chip
                              v-for="meta in marksUi(props.row)"
                              :key="meta.code"
                              dense
                              :color="meta.color"
                              text-color="white"
                              :icon="meta.icon"
                            >
                              {{ meta.short || meta.label }}
                            </q-chip>

                            <q-chip
                              v-if="!(props.row?.marks || []).length"
                              dense
                              outline
                              color="grey-6"
                            >
                              SIN MARCA
                            </q-chip>
                          </div>
                        </q-td>
                      </template>

                      <template
                        #body-cell-user="props"
                      v-if="achievement?.rule?.code === 'TEAM_PREMIO_LOCALIDAD_500_ASISTENCIAS'"
                      >
                        <q-td :props="props">
                          <div>
                            {{ props.row?.user?.name || "—" }}
                          </div>
                        </q-td>
                      </template>
                    </q-table>
                  </q-card-section>
                </q-card>
              </div>

              <!-- REMINDERS COMPOSITION (bucket) -->
              <div v-else class="q-mt-md">
                <!-- Selector de bucket -->
                <div class="row items-center q-col-gutter-sm">
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="selectedBucketCode"
                      :options="
                        buckets.map((b) => ({
                          label: `${b.label} (${b.count}/${b.minCount})`,
                          value: b.code,
                        }))
                      "
                      emit-value
                      map-options
                      outlined
                      dense
                      label="Ver citas del bucket"
                      @update:model-value="(v) => loadRemindersBucket(v, 1)"
                    />
                  </div>

                  <div class="col-12 col-md-auto">
                    <q-btn
                      color="primary"
                      outline
                      icon="refresh"
                      label="Recargar"
                      :loading="remindersLoading"
                      @click="
                        loadRemindersBucket(selectedBucketCode, remindersPage)
                      "
                    />
                  </div>

                  <div class="col-12 col-md-auto">
                    <q-chip dense outline color="grey-7" icon="list">
                      {{ remindersTotal }} citas
                    </q-chip>
                  </div>
                </div>

                <!-- Tabla de citas bucket -->
                <q-card flat bordered class="mini-card q-mt-md">
                  <q-card-section>
                    <div class="row items-center justify-between">
                      <div class="text-subtitle2 text-weight-bold">
                        Citas del bucket
                      </div>
                      <q-chip dense outline color="grey-7" icon="rule">
                        {{ selectedBucketCode || "—" }}
                      </q-chip>
                    </div>

                    <q-skeleton
                      v-if="remindersLoading"
                      height="220px"
                      class="q-mt-md"
                    />

                    <q-table
                      v-else
                      class="q-mt-md"
                      flat
                      bordered
                      :rows="remindersRows"
                      row-key="_id"
                      :rows-per-page-options="[10, 20, 50]"
                      :pagination="{
                        page: remindersPage,
                        rowsPerPage: remindersLimit,
                        rowsNumber: remindersTotal,
                      }"
                      @request="
                        (p) => {
                          remindersLimit = p.pagination.rowsPerPage;
                          loadRemindersBucket(
                            selectedBucketCode,
                            p.pagination.page,
                          );
                        }
                      "
                      :columns="[
                        {
                          name: 'when',
                          label: 'Fecha/Hora',
                          field: 'when',
                          align: 'left',
                        },
                        {
                          name: 'comercial',
                          label: 'Paciente',
                          field: 'comercial',
                          align: 'left',
                        },
                        {
                          name: 'zone',
                          label: 'Zona',
                          field: 'zone',
                          align: 'left',
                        },
                        {
                          name: 'marks',
                          label: 'Marca',
                          field: 'marks',
                          align: 'left',
                        },
                      
                      ]"
                    >
                      <template #body-cell-when="props">
                        <q-td :props="props">
                          <div class="text-weight-bold">
                            {{
                              props.row?.date ||
                              props.row?.createdByOperatorDate ||
                              "—"
                            }}
                          </div>
                          <div class="text-caption text-grey-7">
                            {{ props.row?.hour || "—" }}
                          </div>
                        </q-td>
                      </template>

                      <template #body-cell-comercial="props">
                        <q-td :props="props">
                          <div class="text-weight-bold">
                            {{ props.row?.comercial?.MemberFullname || "—" }}
                          </div>
                          <div class="text-caption text-grey-7">
                            {{
                              props.row?.comercial
                                ?.memberIdentificationNumber || ""
                            }}
                            <span v-if="props.row?.comercial?.HomePhone">
                              · {{ props.row.comercial.HomePhone }}
                            </span>
                          </div>
                        </q-td>
                      </template>

                      <template #body-cell-zone="props">
                        <q-td :props="props">
                          <q-chip dense outline color="primary" icon="place">
                            {{ props.row?.zone?.name || "—" }}
                          </q-chip>
                        </q-td>
                      </template>

                      <template #body-cell-marks="props">
                        <q-td :props="props">
                          <div class="row q-gutter-xs">
                            <q-chip
                              v-for="meta in marksUi(props.row)"
                              :key="meta.code"
                              dense
                              :color="meta.color"
                              text-color="white"
                              :icon="meta.icon"
                            >
                              {{ meta.short || meta.label }}
                            </q-chip>

                            <q-chip
                              v-if="!(props.row?.marks || []).length"
                              dense
                              outline
                              color="grey-6"
                            >
                              SIN MARCA
                            </q-chip>
                          </div>
                        </q-td>
                      </template>

                      <template #body-cell-user="props">
                        <q-td :props="props">
                          <div class="row q-gutter-xs">
                            {{ props.row?.user?.name }}
                          </div>
                        </q-td>
                      </template>
                    </q-table>
                  </q-card-section>
                </q-card>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cerrar" color="grey-8" @click="open = false" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { Notify, copyToClipboard } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import { MARKS } from "src/data/appointmentMarks";
import moment from "moment";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  achievement: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue"]);

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const tab = ref("resume");

// Flags
const isAttendance = computed(
  () => props?.achievement?.rule?.metricSource === "attendance",
);

const isRemindersComposition = computed(
  () =>
    props?.achievement?.rule?.metricSource === "reminders" &&
    props?.achievement?.rule?.ruleType === "composition",
);

const isRemindersCountAttended = computed(
  () =>
    props?.achievement?.rule?.metricSource === "reminders" &&
    props?.achievement?.rule?.ruleType === "count",
);

// Titles
const title = computed(
  () => props?.achievement?.rule?.name || "Detalle de meta",
);
const subtitle = computed(() => {
  const p = props?.achievement?.program?.name || "Programa";
  const m = props?.achievement?.month || "";
  return `${p}${m ? " · " + m : ""}`;
});

// Subject
const subjectName = computed(() => {
  const u = props?.achievement?.subjectUser;
  if (u?.name) return u.name;

  const lc = props?.achievement?.subjectLocalityCode;
  if (lc) return `Localidad: ${lc}`;

  return "";
});

const subjectUserId = computed(() => {
  const su = props?.achievement?.subjectUser;
  return su?._id || su || null;
});

const rewardTotalLabel = computed(() => {
  const amount = Number(props?.achievement?.rewardSnapshot?.amount || 0);
  return amount > 0
    ? `RD$${amount.toLocaleString("es-DO")}`
    : props?.achievement?.rewardSnapshot?.label || "—";
});

// Metrics panel (dinámico)
const metricLines = computed(() => {
  const m = props?.achievement?.metrics || {};

  if (isRemindersCountAttended.value) {
    const attended = Number(m.attended || m.attendedPatients || 0);
    const target = Number(m.attendedTarget || 0);
    const dateField = m.dateField || "date";
    const remaining = target > 0 ? Math.max(0, target - attended) : 0;

    return [
      { label: "Asistencias", value: attended },
      { label: "Meta", value: target || "—" },
      { label: "Faltan", value: target ? remaining : "—" },
      { label: "Recompensa", value: rewardTotalLabel.value },
    ];
  }

  if (isAttendance.value) {
    const absentDays = Number(m.absentDays || 0);
    const effectiveEligible = Number(m.effectiveEligible || 0);
    const lateDays = Number(m.lateDays || 0);

    return [
      { label: "Asistencias", value: effectiveEligible },
      { label: "Ausencias", value: absentDays || 0 },
      { label: "Tardanzas", value: lateDays || 0 },
      { label: "Recompensa", value: rewardTotalLabel.value },
    ];
  }

  if (isRemindersComposition.value) {
    return m.buckets.map((b) => {
      return {
        label: b.label,
        value: `${b.count} de ${b.target} (${b.progress}%)`,
      };
    });
  }

  // fallback general (lo que ya tenías)
  return [
    { label: "Total en período", value: Number(m.total || 0) },
    { label: "Campo fecha", value: m.dateField || "—" },
    { label: "Recompensa", value: rewardTotalLabel.value },
  ];
});

// Buckets
const buckets = computed(() => {
  const arr = props?.achievement?.metrics?.buckets || [];
  if (!Array.isArray(arr)) return [];
  return arr.map((b) => ({
    code: b.code,
    label: b.label || b.code,
    count: Number(b.count || 0),
    minCount: Number(b.target || 0),
    met: !!b.met,
  }));
});

// Status meta
const statusMeta = (status) => {
  const map = {
    in_progress: { label: "En progreso", color: "orange-8", icon: "pending" },
    achieved: { label: "Lograda", color: "green-8", icon: "check_circle" },
    not_achieved: { label: "No lograda", color: "grey-7", icon: "cancel" },
    partial: {
      label: "Parcialmente lograda",
      color: "blue-8",
      icon: "verified",
    },
    approved: { label: "Aprobada", color: "blue-8", icon: "verified" },
    delivered: { label: "Entregada", color: "teal-8", icon: "task_alt" },
  };
  return (
    map[status] || { label: status || "—", color: "grey-7", icon: "label" }
  );
};

// MARKS UI
const MARK_BY_CODE = new Map(MARKS.map((m) => [m.code, m]));
const marksUi = (row) => {
  const arr = row?.marks || [];
  return arr.map((x) => {
    const code = typeof x === "string" ? x : x?.code;
    const meta = (code && MARK_BY_CODE.get(code)) || null;

    return (
      meta || {
        code: code || "UNKNOWN",
        label: code || "SIN MARCA",
        short: code || "",
        icon: "label",
        color: "grey-8",
      }
    );
  });
};

// Attendance breakdown (igual que tú)
const breakdownLoading = ref(false);
const attendanceDays = ref([]);
const attendanceSummary = ref(null);

const loadAttendanceBreakdown = async () => {
  if (!props?.achievement?._id) return;
  if (!isAttendance.value) return;

  const month = props?.achievement?.month;
  const ruleId = props?.achievement?.rule?._id;
  if (!month || !ruleId) return;

  breakdownLoading.value = true;
  try {
    const q = new URLSearchParams();
    q.set("month", month);
    q.set("ruleId", ruleId);

    const resp = await methodsHttp.getApi(
      `incentives/getAttendanceBreakdown/${subjectUserId.value}?${q.toString()}`,
    );

    if (resp?.ok) {
      attendanceDays.value = resp.days || [];
      attendanceSummary.value = resp.summary || null;
    } else {
      attendanceDays.value = [];
      attendanceSummary.value = null;
    }
  } finally {
    breakdownLoading.value = false;
  }
};

// Reminders shared state
const remindersLoading = ref(false);
const remindersRows = ref([]);
const remindersPage = ref(1);
const remindersLimit = ref(20);
const remindersTotal = ref(0);

// Composition (bucket)
const selectedBucketCode = ref(null);

const loadRemindersBucket = async (bucketCode, page = 1) => {
  if (!bucketCode) return;
  const month = props?.achievement?.month;
  const ruleId = props?.achievement?.rule?._id;
  if (!month || !ruleId) return;

  remindersLoading.value = true;
  try {
    const q = new URLSearchParams();
    q.set("month", month);
    q.set("ruleId", ruleId);
    q.set("bucketCode", bucketCode);
    q.set("page", String(page));
    q.set("limit", String(remindersLimit.value));

    // scope user
    if (subjectUserId.value)
      q.set("subjectUserId", String(subjectUserId.value));

    // scope locality
    if (!subjectUserId.value && props?.achievement?.subjectLocalityCode) {
      q.set(
        "subjectLocalityCode",
        String(props.achievement.subjectLocalityCode),
      );
    }

    const resp = await methodsHttp.getApi(
      `incentives/getRemindersBucketBreakdown?${q.toString()}`,
    );

    if (resp?.ok) {
      remindersRows.value = resp.reminders || [];
      remindersTotal.value = Number(resp?.pagination?.total || 0);
      remindersPage.value = Number(resp?.pagination?.page || page);
    } else {
      remindersRows.value = [];
      remindersTotal.value = 0;
    }
  } finally {
    remindersLoading.value = false;
  }
};

// Count attended (240 / locality team)
const loadRemindersAttended = async (page = 1) => {
  const month = props?.achievement?.month;
  const ruleId = props?.achievement?.rule?._id;
  if (!month || !ruleId) return;

  remindersLoading.value = true;
  try {
    const q = new URLSearchParams();
    q.set("month", month);
    q.set("ruleId", ruleId);
    q.set("page", String(page));
    q.set("limit", String(remindersLimit.value));

    // scope user
    if (subjectUserId.value)
      q.set("subjectUserId", String(subjectUserId.value));

    // scope locality
    if (!subjectUserId.value && props?.achievement?.subjectLocalityCode) {
      q.set(
        "subjectLocalityCode",
        String(props.achievement.subjectLocalityCode),
      );
    }

    const resp = await methodsHttp.getApi(
      `incentives/getRemindersAttendedBreakdown?${q.toString()}`,
    );

    if (resp?.ok) {
      remindersRows.value = resp.reminders || [];
      remindersTotal.value = Number(resp?.pagination?.total || 0);
      remindersPage.value = Number(resp?.pagination?.page || page);
    } else {
      remindersRows.value = [];
      remindersTotal.value = 0;
    }
  } finally {
    remindersLoading.value = false;
  }
};

// Watch: carga automática cuando abre y vas a breakdown
watch(
  () => [open.value, tab.value, props?.achievement?._id],
  async ([isOpen, t]) => {
    if (!isOpen) return;

    // Attendance
    if (t === "breakdown" && isAttendance.value) {
      await loadAttendanceBreakdown();
      return;
    }

    // Reminders composition
    if (
      t === "breakdown" &&
      isRemindersComposition.value &&
      buckets.value.length
    ) {
      if (!selectedBucketCode.value)
        selectedBucketCode.value = buckets.value[0].code;
      await loadRemindersBucket(selectedBucketCode.value, 1);
      return;
    }

    // Reminders count attended (240 / locality)
    if (t === "breakdown" && isRemindersCountAttended.value) {
      await loadRemindersAttended(1);
      return;
    }
  },
);
</script>

<style scoped>
.dlg-card {
  width: 980px;
  max-width: 95vw;
  border-radius: 16px;
}
.dlg-header {
  background: var(--q-primary);
}
.scroll-area {
  max-height: 70vh;
  overflow: auto;
}
.mini-card {
  border-radius: 14px;
}
.bucket-row {
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  margin-bottom: 10px;
  box-shadow: 0 6px 18px rgba(18, 38, 63, 0.04);
}
.empty-state {
  border: 1px dashed rgba(0, 0, 0, 0.18);
  border-radius: 14px;
  padding: 22px;
  display: flex;
  align-items: center;
  flex-direction: column;
}
.opacity-80 {
  opacity: 0.8;
}
</style>
