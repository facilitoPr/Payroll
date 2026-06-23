<template>
  <div class="bg-white q-px-md q-pb-lg">
    <PageHeaderCard
      title="Mis metas"
      subtitle="Revisa tu progreso mensual y las recompensas asociadas."
      icon="emoji_events"
    >
      <template #actions>
        <!-- Mes -->
        <q-select
          class="header-field"
          v-model="month"
          :options="monthOptions"
          label="Mes"
          outlined
          dense
          emit-value
          map-options
          option-label="label"
          option-value="value"
          @update:model-value="reload"
        >
          <template #prepend>
            <q-icon name="calendar_month" color="primary" />
          </template>
        </q-select>

        <!-- Programa -->
        <!-- <q-select
          class="header-field"
          v-model="programId"
          :options="programOptions"
          label="Programa"
          outlined
          dense
          emit-value
          map-options
          option-label="name"
          option-value="_id"
          clearable
          @update:model-value="reload"
        >
          <template #prepend>
            <q-icon name="workspace_premium" color="primary" />
          </template>

          <template #no-option>
            <q-item>
              <q-item-section class="text-grey-7">
                No hay programas activos
              </q-item-section>
            </q-item>
          </template>
        </q-select> -->

        <!-- Refrescar -->
        <q-btn
          color="primary"
          unelevated
          icon="refresh"
          label="Refrescar"
          :loading="loading"
          @click="reload"
        />
      </template>
    </PageHeaderCard>

    <!-- KPIs -->
    <q-card flat bordered class="q-mb-md totals-card">
      <q-card-section class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-3">
            <div class="kpi-box">
              <div class="kpi-head">
                <div class="kpi-icon bg-primary-1 text-primary">
                  <q-icon name="flag" size="22px" />
                </div>
                <div class="kpi-titles">
                  <div class="kpi-title">Total metas</div>
                  <div class="kpi-subtitle">Este mes</div>
                </div>
              </div>
              <div class="kpi-value">{{ kpi.total }}</div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="kpi-box">
              <div class="kpi-head">
                <div class="kpi-icon bg-green-1 text-green-10">
                  <q-icon name="check_circle" size="22px" />
                </div>
                <div class="kpi-titles">
                  <div class="kpi-title">Logradas</div>
                  <div class="kpi-subtitle">achieved/approved/delivered</div>
                </div>
              </div>
              <div class="kpi-value">{{ kpi.achieved }}</div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="kpi-box">
              <div class="kpi-head">
                <div class="kpi-icon bg-orange-1 text-orange-10">
                  <q-icon name="pending" size="22px" />
                </div>
                <div class="kpi-titles">
                  <div class="kpi-title">En progreso</div>
                  <div class="kpi-subtitle">in_progress</div>
                </div>
              </div>
              <div class="kpi-value">{{ kpi.inProgress }}</div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="kpi-box">
              <div class="kpi-head">
                <div class="kpi-icon bg-grey-3 text-grey-9">
                  <q-icon name="redeem" size="22px" />
                </div>
                <div class="kpi-titles">
                  <div class="kpi-title">Recompensas logradas</div>
                  <div class="kpi-subtitle">según rewardSnapshot</div>
                </div>
              </div>

              <div class="kpi-value text-subtitle1 text-weight-bold">
                {{ kpi.rewardSummary }}
              </div>

              <div
                v-if="kpi.perksCount"
                class="text-caption text-grey-7 q-mt-xs"
              >
                Perks: {{ kpi.perksCount }}
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- LISTADO -->
    <div v-if="loading" class="q-mt-md">
      <q-skeleton height="90px" class="q-mb-sm" v-for="i in 4" :key="i" />
    </div>

    <div v-else>
      <div v-if="!achievements.length" class="empty-state">
        <q-icon name="inbox" size="42px" class="text-grey-5" />
        <div class="text-subtitle1 text-weight-medium q-mt-sm">
          No hay metas para este mes / filtro
        </div>
        <div class="text-caption text-grey-6">
          Verifica el mes, programa o si ya se ejecutó el recalculo.
        </div>
      </div>

      <div class="row q-col-gutter-md" v-else>
        <div v-for="a in achievements" :key="a._id" class="col-12 col-md-6">
          <q-card
            flat
            bordered
            class="achievement-card cursor-pointer"
            @click="openDetail(a)"
          >
            <q-card-section class="row items-start q-gutter-sm">
              <div class="left">
                <q-avatar size="42px" class="bg-primary-1 text-primary">
                  <q-icon :name="getRuleIcon(a)" size="22px" />
                </q-avatar>
              </div>

              <div class="col">
                <div class="row items-center justify-between">
                  <div class="text-subtitle1 text-weight-bold ellipsis">
                    {{ getRuleName(a) }}
                  </div>

                  <q-chip
                    dense
                    :color="statusMeta(a.status).color"
                    text-color="white"
                    :icon="statusMeta(a.status).icon"
                  >
                    {{ statusMeta(a.status).label }}
                  </q-chip>
                </div>

                <div class="text-caption text-grey-7 q-mt-xs">
                  {{ getProgramName(a) }} · {{ a.month }} · {{ scopeLabel(a) }}
                </div>

                <div class="row items-center q-gutter-sm q-mt-sm">
                  <q-chip
                    dense
                    outline
                    color="primary"
                    icon="redeem"
                    :label="rewardLabelPretty(a)"
                    :title="rewardLabelPretty(a)"
                  >
                    <q-tooltip> {{ rewardLabelPretty(a) }}</q-tooltip>
                  </q-chip>

                  <!-- <q-chip
                    v-if="a?.rewardSnapshot?.deliveryChannel"
                    dense
                    outline
                    color="grey-7"
                    icon="info"
                  >
                    {{ deliveryLabel(a?.rewardSnapshot?.deliveryChannel) }}
                  </q-chip> -->
                </div>

                <div class="q-mt-sm">
                  <q-linear-progress
                    :value="Number(a.progressPercent || 0) / 100"
                    rounded
                    size="10px"
                  />
                  <div class="row items-center justify-between q-mt-xs">
                    <div class="text-caption text-grey-7">Progreso</div>
                    <div class="text-caption text-weight-bold">
                      {{ a.progressPercent || 0 }}%
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="q-pt-sm">
              <div class="text-body2">
                {{ a.message || metricSummary(a) || "—" }}
              </div>

              <!-- Breakdown para composición (metrics.buckets) -->
              <div class="chips-scroll q-mt-sm" v-if="bucketPretty(a).length">
                <q-chip
                  v-for="b in bucketPretty(a)"
                  :key="b.code"
                  dense
                  :color="b.met ? 'green-8' : 'primary'"
                  text-color="white"
                >
                  {{ b.label }}: {{ b.count }}/{{ b.target }}
                </q-chip>
              </div>

              <!-- Breakdown simple para asistencia (si no hay buckets) -->
              <div
                v-else-if="attendancePretty(a)"
                class="row q-col-gutter-sm q-mt-sm"
              >
                <div class="col-auto">
                  <q-chip dense outline color="grey-7" icon="event_available">
                    Días elegibles: {{ attendancePretty(a).effectiveEligible }}
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-chip dense outline color="orange-8" icon="schedule">
                    Tardanzas: {{ attendancePretty(a).lateDays }}
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-chip dense outline color="grey-8" icon="cancel">
                    Ausencias: {{ attendancePretty(a).absentDays }}
                  </q-chip>
                </div>

                <div class="col-auto">
                  <q-chip dense outline color="grey-8" icon="cancel">
                    Permisos: {{ attendancePretty(a).excludedLincenses }}
                  </q-chip>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <IncentiveAchievementDetailDialog
      v-model="detailOpen"
      :achievement="selected"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Notify } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import IncentiveAchievementDetailDialog from "src/components/incentives/IncentiveAchievementDetailDialog.vue";

const loading = ref(false);
const achievements = ref([]);

const month = ref(getCurrentMonth());
const programId = ref(null);

const programOptions = ref([]);
const monthOptions = computed(() => buildMonthOptions(18));

const detailOpen = ref(false);
const selected = ref(null);

const openDetail = (a) => {
  if (a.rule.code == "OP_EMPLEADO_DEL_MES") return;
  selected.value = a;
  detailOpen.value = true;
};

onMounted(async () => {
  await loadPrograms();
  await reload();
});

const loadPrograms = async () => {
  try {
    const resp = await methodsHttp.getApi(
      "incentives/getIncentivePrograms?active=true",
    );
    programOptions.value = resp?.ok ? resp.programs || [] : [];
  } catch (e) {
    programOptions.value = [];
  }
};

const reload = async () => {
  loading.value = true;
  try {
    const q = new URLSearchParams();
    q.set("month", month.value);
    if (programId.value) q.set("programId", programId.value);

    const resp = await methodsHttp.getApi(
      `incentives/getMyAchievementsByMonth?${q.toString()}`,
    );

    if (resp?.ok) {
      achievements.value = Array.isArray(resp.achievements)
        ? resp.achievements
        : [];
    } else {
      achievements.value = [];
      Notify.create({
        type: "negative",
        message: resp?.mensaje || "No se pudo cargar metas.",
      });
    }
  } catch (e) {
    achievements.value = [];
    Notify.create({ type: "negative", message: "Error cargando metas." });
  } finally {
    loading.value = false;
  }
};

// ======================
// KPI alineado a rewardSnapshot
// ======================
const kpi = computed(() => {
  const arr = achievements.value || [];
  const total = arr.length;

  const achievedArr = arr.filter((x) =>
    ["achieved", "approved", "delivered"].includes(String(x?.status || "")),
  );
  const achieved = achievedArr.length;

  const inProgress = arr.filter((x) => x.status === "in_progress").length;

  // sum solo de logros logrados
  const moneySum = achievedArr.reduce((acc, x) => {
    const kind = String(x?.rewardSnapshot?.rewardKind || "");
    const amount = Number(x?.rewardSnapshot?.amount || 0);
    if (kind === "money" && Number.isFinite(amount) && amount > 0)
      return acc + amount;
    return acc;
  }, 0);

  const perksCount = achievedArr.filter(
    (x) => String(x?.rewardSnapshot?.rewardKind || "") === "perk",
  ).length;

  const rewardSummary =
    moneySum > 0
      ? formatMoney(moneySum, "DOP")
      : perksCount > 0
        ? "Perks logrados"
        : "—";

  return { total, achieved, inProgress, rewardSummary, perksCount };
});

// ======================
// UI helpers (rule/program)
/// ======================
const getRuleName = (a) => a?.rule?.name || a?.ruleName || "Meta";
const getProgramName = (a) => a?.program?.name || a?.programName || "Programa";
const getRuleIcon = (a) => a?.rule?.ui?.icon || "emoji_events";

const scopeLabel = (a) => {
  const t = String(a?.scopeType || "");
  if (t === "locality") return `Localidad: ${a?.subjectLocalityCode || "—"}`;
  if (t === "department") return `Depto: ${a?.subjectDepartmentCode || "—"}`;
  if (t === "team") return "Equipo";
  return "Personal";
};

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

const deliveryLabel = (ch) => {
  const map = {
    payroll: "Incluye nómina",
    manual_cash: "Pago manual",
    perk: "Beneficio",
    label_only: "Solo etiqueta",
  };
  return map[ch] || ch;
};

const rewardLabelPretty = (a) => {
  const snap = a?.rewardSnapshot || {};
  const kind = String(snap?.rewardKind || "");
  const amount = Number(snap?.amount || 0);
  const label = snap?.label || "";

  if (kind === "money" && Number.isFinite(amount) && amount > 0) {
    return `${label ? `${label}` : ""}`;
  }

  // perk o label_only
  return label || "—";
};

// ======================
// Metrics helpers (alineado a engine actual)
// ======================
const bucketPretty = (a) => {
  const buckets = a?.metrics?.buckets || [];
  if (!Array.isArray(buckets) || !buckets.length) return [];
  return buckets.map((b) => {
    const count = Number(b.count || 0);
    const target = Number(b.target || 0);
    return {
      code: b.code,
      label: b.label || b.code,
      count,
      target,
      met: target > 0 ? count >= target : false,
    };
  });
};

const attendancePretty = (a) => {
  // engine guarda metrics: eligibleDays, excludedMedical, effectiveEligible, lateDays, absentDays...
  const m = a?.metrics;
  if (!m || typeof m !== "object") return null;

  const hasAttendanceKeys =
    "effectiveEligible" in m ||
    "eligibleDays" in m ||
    "lateDays" in m ||
    "excludedLincenses" in m ||
    "absentDays" in m;

  if (!hasAttendanceKeys) return null;

  return {
    effectiveEligible: Number(m?.effectiveEligible ?? 0) || 0,
    lateDays: Number(m?.lateDays ?? 0) || 0,
    absentDays: Number(m?.absentDays ?? 0) || 0,
    excludedLincenses: Number(m?.excludedLincenses ?? 0) || 0,
  };
};

const metricSummary = (a) => {
  // Si el mensaje viene del engine, eso manda.
  // Esto es solo fallback para achievements sin message.
  const buckets = bucketPretty(a);
  if (buckets.length) {
    const parts = buckets.map((b) => `${b.label}: ${b.count}/${b.target}`);
    return parts.join(" · ");
  }

  const att = attendancePretty(a);
  if (att) {
    return `Días elegibles: ${att.effectiveEligible} · Tardanzas: ${att.lateDays} · Ausencias: ${att.absentDays}`;
  }

  // custom: intenta mostrar algo común si existe
  const m = a?.metrics || {};
  if (m?.membersCount != null && m?.totalAchievers != null) {
    return `Progreso equipo: ${m.totalAchievers}/${m.membersCount}`;
  }

  return "";
};

// ======================
// Utils
// ======================
function formatMoney(amount, currency = "DOP") {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return "—";

  // Si solo manejas DOP por ahora:
  const prefix =
    String(currency || "DOP").toUpperCase() === "DOP" ? "RD$" : `${currency} `;
  return `${prefix}${Math.round(n).toLocaleString("es-DO")}`;
}

function getCurrentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function buildMonthOptions(count = 12) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const value = `${y}-${m}`;
    const label = d.toLocaleDateString("es-DO", {
      year: "numeric",
      month: "long",
    });
    out.push({ label, value });
  }
  return out;
}
</script>

<style scoped>
.totals-card {
  border-radius: 14px;
}

.kpi-box {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 6px 18px rgba(18, 38, 63, 0.06);
}

.kpi-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kpi-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-title {
  font-weight: 800;
  font-size: 13px;
  color: #263238;
}

.kpi-subtitle {
  font-size: 12px;
  color: #607d8b;
  margin-top: 2px;
}

.kpi-value {
  font-size: 32px;
  font-weight: 900;
  margin-top: 10px;
  letter-spacing: 0.3px;
  color: #111827;
}

.achievement-card {
  border-radius: 14px;
}

.chips-scroll {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: thin;
}
.chips-scroll::-webkit-scrollbar {
  height: 6px;
}
.chips-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
}

.empty-state {
  border: 1px dashed rgba(0, 0, 0, 0.18);
  border-radius: 14px;
  padding: 28px;
  display: flex;
  align-items: center;
  flex-direction: column;
}
</style>
