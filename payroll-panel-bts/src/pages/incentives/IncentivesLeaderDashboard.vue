<template>
  <div class="bg-white q-px-md q-pb-lg">
    <PageHeaderCard
      title="Metas del líder"
      subtitle="Resumen del equipo y etiqueta de incentivo por metas logradas (no se incluye en nómina)."
      icon="emoji_events"
    >
      <template #actions>
        <div class="row items-center q-col-gutter-sm">
          <!-- MES -->
          <div class="col-12 col-sm-4">
            <q-select
              outlined dense
              v-model="month"
              :options="monthOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              label="Mes"
            >
              <template #prepend><q-icon name="calendar_month" color="primary" /></template>
            </q-select>
          </div>

          <!-- PROGRAMA -->
          <div class="col-12 col-sm-4">
            <q-select
              outlined dense clearable
              v-model="programId"
              :options="programs"
              option-label="name"
              option-value="_id"
              emit-value
              map-options
              label="Programa (opcional)"
            >
              <template #prepend><q-icon name="workspace_premium" color="primary" /></template>
            </q-select>
          </div>

          <!-- EQUIPO -->
          <div class="col-12 col-sm-4">
            <q-select
              outlined dense clearable
              v-model="teamUserIds"
              :options="operatorsOptions"
              option-label="name"
              option-value="_id"
              emit-value
              map-options
              multiple
              use-chips
              label="Equipo (opcional)"
            >
              <template #prepend><q-icon name="groups" color="primary" /></template>

              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey-7">
                    No hay usuarios disponibles
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>

        <div class="row items-center q-gutter-sm q-mt-sm">
          <q-btn
            color="primary"
            unelevated
            icon="search"
            label="Buscar"
            :loading="loading"
            @click="loadSummary"
          />
          <q-btn
            color="primary"
            outline
            icon="refresh"
            label="Refrescar"
            :loading="loading"
            @click="loadSummary"
          />

          <q-chip dense outline color="grey-7" icon="info">
            Solo etiqueta · No toca nómina
          </q-chip>
        </div>
      </template>
    </PageHeaderCard>

    <!-- ALERT / NOTA -->
    <q-banner rounded class="bg-grey-2 q-mb-md">
      <div class="row items-center q-col-gutter-sm">
        <div class="col-auto">
          <q-icon name="verified" size="22px" class="text-primary" />
        </div>
        <div class="col">
          <div class="text-weight-medium">Incentivo del líder</div>
          <div class="text-caption text-grey-7">
            Este módulo solo muestra el resultado y la etiqueta de incentivo. El pago (si aplica) es fuera del cierre de nómina.
          </div>
        </div>
      </div>
    </q-banner>

    <!-- KPI -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-3">
        <div class="kpi-box">
          <div class="kpi-head">
            <div class="kpi-icon bg-blue-1 text-blue-10">
              <q-icon name="groups" size="22px" />
            </div>
            <div class="kpi-titles">
              <div class="kpi-title">Empleados en equipo</div>
              <div class="kpi-subtitle">Total considerados</div>
            </div>
          </div>
          <div class="kpi-value">{{ kpis.employeesTotal }}</div>
        </div>
      </div>

      <div class="col-12 col-md-3">
        <div class="kpi-box">
          <div class="kpi-head">
            <div class="kpi-icon bg-green-1 text-green-10">
              <q-icon name="check_circle" size="22px" />
            </div>
            <div class="kpi-titles">
              <div class="kpi-title">Metas logradas</div>
              <div class="kpi-subtitle">Suma de logros</div>
            </div>
          </div>
          <div class="kpi-value">{{ kpis.achievedCount }}</div>
        </div>
      </div>

      <div class="col-12 col-md-3">
        <div class="kpi-box">
          <div class="kpi-head">
            <div class="kpi-icon bg-orange-1 text-orange-10">
              <q-icon name="percent" size="22px" />
            </div>
            <div class="kpi-titles">
              <div class="kpi-title">Cumplimiento</div>
              <div class="kpi-subtitle">Promedio por reglas</div>
            </div>
          </div>
          <div class="kpi-value">{{ kpis.compliancePercent }}%</div>
        </div>
      </div>

      <div class="col-12 col-md-3">
        <div class="kpi-box">
          <div class="kpi-head">
            <div class="kpi-icon bg-purple-1 text-purple-10">
              <q-icon name="redeem" size="22px" />
            </div>
            <div class="kpi-titles">
              <div class="kpi-title">Etiqueta del líder</div>
              <div class="kpi-subtitle">Resultado del mes</div>
            </div>
          </div>

          <div class="kpi-value kpi-value-sm">
            <span v-if="leaderRewardLabel">{{ leaderRewardLabel }}</span>
            <span v-else class="text-grey-6">—</span>
          </div>
        </div>
      </div>
    </div>

    <!-- CONTENT -->
    <div class="row q-col-gutter-md">
      <!-- REGLAS / METAS -->
      <div class="col-12 col-lg-7">
        <q-card flat bordered class="section-card">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Metas del equipo</div>
              <div class="text-caption text-grey-7">
                Haz click en una meta para ver quiénes la lograron.
              </div>
            </div>

            <q-chip dense outline color="grey-7" icon="calendar_month">
              {{ month }}
            </q-chip>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div v-if="loading">
              <div class="row q-col-gutter-md">
                <div v-for="i in 4" :key="i" class="col-12 col-md-6">
                  <q-card flat bordered class="goal-card">
                    <q-card-section>
                      <q-skeleton type="text" width="60%" />
                      <q-skeleton type="text" width="35%" />
                      <q-skeleton type="QLinearProgress" class="q-mt-md" />
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>

            <div v-else class="row q-col-gutter-md">
              <div v-for="r in rulesPretty" :key="r.ruleId" class="col-12 col-md-6">
                <q-card
                  flat
                  bordered
                  class="goal-card cursor-pointer"
                  @click="openRuleDetail(r)"
                >
                  <q-card-section class="row items-start justify-between">
                    <div class="col">
                      <div class="text-subtitle2 text-weight-bold ellipsis">
                        {{ r.ruleName }}
                      </div>
                      <div class="text-caption text-grey-7">
                        {{ r.achievedCount }}/{{ r.employeesTotal }} lograron
                      </div>

                      <div class="row items-center q-gutter-xs q-mt-sm">
                        <q-chip dense outline color="primary" icon="redeem">
                          {{ r.rewardLabel || "—" }}
                        </q-chip>
                        <q-chip dense outline color="grey-7" icon="info">
                          {{ deliveryLabel(r.deliveryChannel) }}
                        </q-chip>
                      </div>

                      <q-linear-progress
                        class="q-mt-md"
                        rounded
                        size="10px"
                        :value="r.percent / 100"
                      />
                      <div class="row items-center justify-between q-mt-xs">
                        <div class="text-caption text-grey-7">Progreso</div>
                        <div class="text-caption text-weight-bold">
                          {{ r.percent }}%
                        </div>
                      </div>
                    </div>

                    <div class="col-auto">
                      <q-circular-progress
                        show-value
                        :value="r.percent"
                        size="64px"
                        thickness="0.16"
                        class="text-primary"
                      >
                        <div class="text-caption text-weight-bold">
                          {{ r.percent }}%
                        </div>
                      </q-circular-progress>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div v-if="!rulesPretty.length" class="col-12">
                <div class="empty-state">
                  <q-icon name="info" size="38px" class="text-grey-5" />
                  <div class="text-subtitle2 text-weight-medium q-mt-sm">
                    No hay metas para mostrar
                  </div>
                  <div class="text-caption text-grey-6">
                    Prueba cambiando el mes o el programa.
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- TABLA EQUIPO -->
      <div class="col-12 col-lg-5">
        <q-card flat bordered class="section-card">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Equipo</div>
              <div class="text-caption text-grey-7">
                Resumen por empleado (logros del mes).
              </div>
            </div>

            <q-input
              dense outlined clearable
              v-model="employeeSearch"
              label="Buscar empleado"
              style="min-width: 220px"
            >
              <template #prepend><q-icon name="search" color="primary" /></template>
            </q-input>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none">
            <q-table
              flat
              :rows="employeesFiltered"
              :columns="employeeColumns"
              row-key="userId"
              :rows-per-page-options="[8, 15, 30]"
              :loading="loading"
            >
              <template #body-cell-name="props">
                <q-td :props="props">
                  <div class="row items-center q-gutter-sm">
                    <q-avatar size="32px" color="primary" text-color="white">
                      {{ (props.row.name || "?").slice(0, 1).toUpperCase() }}
                    </q-avatar>
                    <div>
                      <div class="text-weight-medium">{{ props.row.name || "—" }}</div>
                      <div class="text-caption text-grey-7">{{ props.row.email || "" }}</div>
                    </div>
                  </div>
                </q-td>
              </template>

              <template #body-cell-achievedRules="props">
                <q-td :props="props">
                  <q-chip dense color="green-8" text-color="white" icon="check_circle">
                    {{ props.row.achievedRules || 0 }}
                  </q-chip>
                </q-td>
              </template>

              <template #body-cell-rules="props">
                <q-td :props="props">
                  <div class="chips-scroll">
                    <q-chip
                      v-for="c in (props.row.achievedRuleCodes || []).slice(0, 6)"
                      :key="c"
                      dense
                      outline
                      color="primary"
                    >
                      {{ c }}
                    </q-chip>
                    <q-chip
                      v-if="(props.row.achievedRuleCodes || []).length > 6"
                      dense
                      outline
                      color="grey-7"
                    >
                      +{{ (props.row.achievedRuleCodes || []).length - 6 }}
                    </q-chip>
                  </div>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">
                  No hay datos del equipo para este filtro.
                </div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- DIALOG: DETALLE DE REGLA (QUIÉNES LOGRARON) -->
    <q-dialog v-model="ruleDetail.open" persistent>
      <q-card class="dlg-card">
        <q-card-section class="dlg-header row items-center justify-between">
          <div>
            <div class="text-h6 text-white ellipsis">
              {{ ruleDetail.data?.ruleName || "Detalle de meta" }}
            </div>
            <div class="text-caption text-white opacity-80">
              {{ month }} · {{ ruleDetail.data?.achievedCount || 0 }} lograron
            </div>
          </div>
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div class="row items-center q-gutter-sm">
            <q-chip dense outline color="primary" icon="redeem">
              {{ ruleDetail.data?.rewardLabel || "—" }}
            </q-chip>
            <q-chip dense outline color="grey-7" icon="info">
              {{ deliveryLabel(ruleDetail.data?.deliveryChannel) }}
            </q-chip>
            <q-space />
            <q-chip dense outline color="grey-7" icon="groups">
              {{ ruleDetail.data?.employeesTotal || 0 }} en equipo
            </q-chip>
          </div>

          <q-linear-progress
            class="q-mt-md"
            rounded
            size="10px"
            :value="(ruleDetail.data?.percent || 0) / 100"
          />
          <div class="row items-center justify-between q-mt-xs">
            <div class="text-caption text-grey-7">Progreso</div>
            <div class="text-caption text-weight-bold">
              {{ ruleDetail.data?.percent || 0 }}%
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="text-subtitle2 text-weight-bold">Quiénes lograron</div>
          <div class="text-caption text-grey-7">
            (si el backend envía <b>achievedUsers</b> con nombres)
          </div>

          <div class="q-mt-sm">
            <div v-if="!(ruleDetail.data?.achievedUsers || []).length" class="text-grey-6">
              No hay lista disponible (solo resumen). Si quieres, hacemos que el backend la envíe.
            </div>

            <q-list v-else bordered class="rounded-borders q-mt-sm">
              <q-item v-for="u in ruleDetail.data.achievedUsers" :key="u.userId">
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">
                    {{ (u.name || "?").slice(0, 1).toUpperCase() }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ u.name || "—" }}</q-item-label>
                  <q-item-label caption>{{ u.email || "" }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip dense color="green-8" text-color="white" icon="check_circle">
                    Logró
                  </q-chip>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>

        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="grey-8" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import methodsHttp from "src/api/methodsHttp";
import PageHeaderCard from "src/components/PageHeaderCard.vue";

/**
 * ✅ Esperado del backend (flexible):
 * GET incentives/leader/summary?month=YYYY-MM&programId=...&userIds=...
 *
 * {
 *   ok: true,
 *   month: "2026-02",
 *   leaderReward: { label: "RD$2,000 por metas del equipo", amount: 2000, deliveryChannel:"label_only" },
 *   employeesTotal: 12,
 *   byRule: [
 *     { ruleId, ruleCode, ruleName, rewardLabel, deliveryChannel, achievedCount, employeesTotal, percent, achievedUsers?:[{userId,name,email}] }
 *   ],
 *   byEmployee: [
 *     { userId, name, email, achievedRules, achievedRuleCodes: ["RULE1","RULE2"] }
 *   ]
 * }
 */

const loading = ref(false);

// filters
const month = ref(getCurrentMonth());
const programId = ref(null);
const teamUserIds = ref([]);

// data
const programs = ref([]);
const operatorsOptions = ref([]);
const summary = ref(null);

// local ui
const employeeSearch = ref("");

// dialog
const ruleDetail = ref({
  open: false,
  data: null,
});

const monthOptions = computed(() => buildMonthOptions(24));

const employeeColumns = [
  { name: "name", label: "Empleado", field: "name", align: "left", sortable: true },
  { name: "achievedRules", label: "Metas logradas", field: "achievedRules", align: "left", sortable: true },
  { name: "rules", label: "Reglas", field: "rules", align: "left" },
];

const rulesPretty = computed(() => {
  const arr = summary.value?.byRule || [];
  if (!Array.isArray(arr)) return [];
  return arr.map((r) => ({
    ruleId: r.ruleId || r._id || r.ruleCode,
    ruleCode: r.ruleCode,
    ruleName: r.ruleName || r.name || "Meta",
    rewardLabel: r.rewardLabel || r?.rewardSnapshot?.label || "—",
    deliveryChannel: r.deliveryChannel || r?.rewardSnapshot?.deliveryChannel || "label_only",
    achievedCount: Number(r.achievedCount || 0),
    employeesTotal: Number(r.employeesTotal || summary.value?.employeesTotal || 0),
    percent: Number(r.percent || calcPercent(r.achievedCount, r.employeesTotal || summary.value?.employeesTotal || 0)),
    achievedUsers: Array.isArray(r.achievedUsers) ? r.achievedUsers : [],
  }));
});

const employees = computed(() => {
  const arr = summary.value?.byEmployee || [];
  return Array.isArray(arr) ? arr : [];
});

const employeesFiltered = computed(() => {
  const q = String(employeeSearch.value || "").trim().toLowerCase();
  if (!q) return employees.value;
  return employees.value.filter((x) =>
    String(x.name || "").toLowerCase().includes(q) ||
    String(x.email || "").toLowerCase().includes(q)
  );
});

const leaderRewardLabel = computed(() => {
  return summary.value?.leaderReward?.label || summary.value?.leaderRewardLabel || "";
});

const kpis = computed(() => {
  const employeesTotal = Number(summary.value?.employeesTotal || 0);
  const achievedCount = Number(summary.value?.byRule?.reduce?.((acc, r) => acc + Number(r.achievedCount || 0), 0) || 0);

  // promedio de percent por regla (si hay)
  const percents = rulesPretty.value.map((r) => Number(r.percent || 0));
  const compliancePercent = percents.length
    ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)
    : 0;

  return { employeesTotal, achievedCount, compliancePercent };
});

onMounted(async () => {
  await Promise.all([loadPrograms(), loadOperators()]);
  await loadSummary();
});

const openRuleDetail = (r) => {
  ruleDetail.value.data = r;
  ruleDetail.value.open = true;
};

const loadPrograms = async () => {
  const resp = await methodsHttp.getApi("incentives/programs");
  programs.value = resp?.ok ? (resp.programs || []) : [];
};

const loadOperators = async () => {
  // Ajusta este endpoint al tuyo (ya lo usas en otras pantallas)
  const resp = await methodsHttp.getApi("user/getEmployees?isActived=true&departmentCode=TRIPLE_S");
  operatorsOptions.value = resp?.ok ? (resp.employees || []) : [];
};

const loadSummary = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.set("month", month.value);

    if (programId.value) params.set("programId", programId.value);

    // si eligió subset del equipo
    if (Array.isArray(teamUserIds.value) && teamUserIds.value.length) {
      // userIds=ID1,ID2...
      params.set("userIds", teamUserIds.value.join(","));
    }

    const resp = await methodsHttp.getApi(`incentives/leader/summary?${params.toString()}`);
    summary.value = resp?.ok ? resp : null;
  } catch (e) {
    summary.value = null;
  } finally {
    loading.value = false;
  }
};

function deliveryLabel(ch) {
  const map = {
    payroll: "Incluye nómina",
    manual_cash: "Pago manual",
    perk: "Beneficio",
    label_only: "Solo etiqueta",
  };
  return map[ch] || ch || "—";
}

function calcPercent(a, total) {
  const aa = Number(a || 0);
  const tt = Number(total || 0);
  if (!tt) return 0;
  return Math.round((aa / tt) * 100);
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
    const label = d.toLocaleDateString("es-DO", { year: "numeric", month: "long" });
    out.push({ label, value });
  }
  return out;
}
</script>

<style scoped>
.section-card {
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

.kpi-titles {
  line-height: 1.15;
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
  font-size: 28px;
  font-weight: 900;
  margin-top: 10px;
  letter-spacing: 0.3px;
  color: #111827;
}
.kpi-value-sm {
  font-size: 14px;
  font-weight: 800;
  margin-top: 12px;
  line-height: 1.2;
}

.goal-card {
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(18, 38, 63, 0.05);
}

.empty-state {
  border: 1px dashed rgba(0,0,0,0.18);
  border-radius: 14px;
  padding: 22px;
  display: flex;
  align-items: center;
  flex-direction: column;
}

.dlg-card {
  width: 820px;
  max-width: 95vw;
  border-radius: 16px;
}
.dlg-header {
  background: var(--q-primary);
}
.opacity-80 {
  opacity: 0.8;
}

/* chips scroll */
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
</style>
