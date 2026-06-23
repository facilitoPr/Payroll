<template>
  <div class="bg-white q-px-md q-pb-lg">
    <PageHeaderCard
      title="Metas del equipo"
      subtitle="Monitorea el progreso del equipo y recalcula resultados."
      icon="support_agent"
    >
      <template #actions>
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
        </q-select> -->

        <!-- ✅ NUEVO: tipo -->
        <q-select
          class="header-field"
          v-model="scopeFilter"
          :options="scopeOptions"
          label="Tipo"
          outlined
          dense
          emit-value
          map-options
          option-label="label"
          option-value="value"
          @update:model-value="reload"
        >
          <template #prepend>
            <q-icon name="tune" color="primary" />
          </template>
        </q-select>

        <!-- Operadoras (solo aplica si Tipo != Localidades) -->
        <q-select
          class="header-search"
          v-model="operatorsSelected"
          :options="operatorsOptions"
          label="Operadoras (varias)"
          outlined
          dense
          multiple
          use-chips
          clearable
          emit-value
          map-options
          option-label="name"
          option-value="_id"
          :disable="scopeFilter === 'locality'"
          @update:model-value="reload"
        >
          <template #prepend>
            <q-icon name="person" color="primary" />
          </template>
        </q-select>

        <!-- ✅ NUEVO: Localidades (solo aplica si Tipo == Localidades o Todas) -->
        <q-select
          class="header-search"
          v-model="localitiesSelected"
          :options="localitiesOptions"
          label="Localidades (varias)"
          outlined
          dense
          multiple
          use-chips
          clearable
          emit-value
          map-options
          option-label="label"
          option-value="value"
          :disable="scopeFilter === 'user'"
          @update:model-value="reload"
        >
          <template #prepend>
            <q-icon name="place" color="primary" />
          </template>
        </q-select>

        <q-select
          class="header-field"
          v-model="status"
          :options="statusOptions"
          label="Status"
          outlined
          dense
          emit-value
          map-options
          option-label="label"
          option-value="value"
          clearable
          @update:model-value="reload"
        >
          <template #prepend>
            <q-icon name="flag" color="primary" />
          </template>
        </q-select>

        <q-btn
          color="primary"
          unelevated
          icon="autorenew"
          label="Recalcular"
          :loading="recalcLoading"
          @click="onRecalc"
        />

        <q-btn
          color="primary"
          outline
          icon="refresh"
          label="Refrescar"
          :loading="loading"
          @click="reload"
        />
      </template>
    </PageHeaderCard>

    <!-- KPIs -->
    <q-card flat bordered class="q-mb-xl totals-card">
      <q-card-section class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-3">
            <div class="kpi-box">
              <div class="kpi-head">
                <div class="kpi-icon bg-primary-1 text-primary">
                  <q-icon name="groups" size="22px" />
                </div>
                <div>
                  <div class="kpi-title">Operadoras con data</div>
                  <div class="kpi-subtitle">este filtro</div>
                </div>
              </div>
              <div class="kpi-value">{{ kpi.users }}</div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="kpi-box">
              <div class="kpi-head">
                <div class="kpi-icon bg-indigo-1 text-indigo-10">
                  <q-icon name="place" size="22px" />
                </div>
                <div>
                  <div class="kpi-title">Localidades con data</div>
                  <div class="kpi-subtitle">scopeType=locality</div>
                </div>
              </div>
              <div class="kpi-value">{{ kpi.localities }}</div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="kpi-box">
              <div class="kpi-head">
                <div class="kpi-icon bg-green-1 text-green-10">
                  <q-icon name="check_circle" size="22px" />
                </div>
                <div>
                  <div class="kpi-title">Metas logradas</div>
                  <div class="kpi-subtitle">achieved/approved/delivered</div>
                </div>
              </div>
              <div class="kpi-value">{{ kpi.achieved }}</div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="kpi-box">
              <div class="kpi-head">
                <div class="kpi-icon bg-grey-3 text-grey-9">
                  <q-icon name="redeem" size="22px" />
                </div>
                <div>
                  <div class="kpi-title">Recompensa total</div>
                  <div class="kpi-subtitle">si hay amounts</div>
                </div>
              </div>
              <div class="kpi-value text-subtitle1 text-weight-bold">
                {{ kpi.rewardLabel }}
              </div>
            </div>
          </div>
        </div>

        <div class="row items-center q-gutter-sm q-mt-md">
          <q-chip dense color="orange-8" text-color="white" icon="pending">
            En progreso: {{ kpi.inProgress }}
          </q-chip>
          <q-chip dense outline color="grey-7" icon="filter_alt">
            Tipo: {{ scopeLabel(scopeFilter) }}
          </q-chip>
        </div>
      </q-card-section>
    </q-card>

    <!-- LISTADO -->
    <div v-if="loading">
      <q-skeleton height="110px" class="q-mb-sm" v-for="i in 5" :key="i" />
    </div>

    <div v-else>
      <div v-if="!achievements.length" class="empty-state">
        <q-icon name="inbox" size="42px" class="text-grey-5" />
        <div class="text-subtitle1 text-weight-medium q-mt-sm">
          No hay resultados para este filtro
        </div>
        <div class="text-caption text-grey-6">
          Prueba otro mes o ejecuta "Recalcular".
        </div>
      </div>

      <div v-else class="q-gutter-md">
        <q-card
          v-for="g in grouped"
          :key="g.groupId"
          flat
          bordered
          class="group-card"
        >
          <q-card-section class="row items-center justify-between">
            <div class="row items-center q-gutter-sm">
              <q-avatar
                size="42px"
                :class="
                  g.kind === 'locality'
                    ? 'bg-indigo-1 text-indigo-10'
                    : 'bg-blue-1 text-blue-10'
                "
              >
                <q-img
                  v-if="g?.groupImage"
                  :src="g?.groupImage"
                  alt="Avatar"
                />
                <q-icon
                  v-else
                  :name="g.kind === 'locality' ? 'place' : 'person'"
                  size="22px"
                />
              </q-avatar>

              <div>
                <div class="text-subtitle1 text-weight-bold">
                  {{ g.groupName }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ g.items.length }} metas · {{ month }}
                </div>
              </div>
            </div>

            <div class="chips-scroll">
              <q-chip
                dense
                color="green-8"
                text-color="white"
                icon="check_circle"
              >
                {{ g.kpi.achieved }}
              </q-chip>
              <q-chip dense color="orange-8" text-color="white" icon="pending">
                {{ g.kpi.inProgress }}
              </q-chip>
              <q-chip dense outline color="grey-7" icon="redeem">
                {{ g.kpi.rewardLabel }}
              </q-chip>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="row q-col-gutter-md">
            <div v-for="a in g.items" :key="a._id" class="col-12 col-md-6">
              <q-card
                flat
                bordered
                class="achievement-card cursor-pointer"
                @click="openDetail(a)"
              >
                <q-card-section class="row items-start q-gutter-sm">
                  <q-avatar size="36px" class="bg-primary-1 text-primary">
                    <q-icon
                      :name="a?.rule?.ui?.icon || 'emoji_events'"
                      size="18px"
                    />
                  </q-avatar>

                  <div class="col">
                    <div class="row items-center justify-between">
                      <div class="text-weight-bold ellipsis">
                        {{ a?.rule?.name || "Meta" }}
                      </div>

                      <div class="row items-center q-gutter-xs">
                        <q-chip
                          v-if="a?.subjectLocalityCode"
                          dense
                          outline
                          color="indigo-10"
                          icon="place"
                        >
                          {{ localityLabel(a.subjectLocalityCode) }}
                        </q-chip>

                        <q-chip
                          dense
                          :color="statusMeta(a.status).color"
                          text-color="white"
                          :icon="statusMeta(a.status).icon"
                        >
                          {{ statusMeta(a.status).label }}
                        </q-chip>
                      </div>
                    </div>

                    <div class="text-caption text-grey-7 q-mt-xs">
                      {{ a?.program?.name || "Programa" }}
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

                    <div class="row items-center q-gutter-sm q-mt-sm">
                      <q-chip
                        dense
                        outline
                        color="primary"
                        icon="redeem"
                        :label="a?.rewardSnapshot?.label || '—'"
                        :title="a?.rewardSnapshot?.label || '—'"
                      >
                        <q-tooltip>
                          {{ a?.rewardSnapshot?.label || "—" }}
                        </q-tooltip>
                      </q-chip>
                      <!-- <q-chip dense outline color="grey-7" icon="info">
                        {{ deliveryLabel(a?.rewardSnapshot?.deliveryChannel) }}
                      </q-chip> -->
                    </div>

                    <div class="text-caption text-grey-7 q-mt-sm">
                      {{ a.message || "—" }}
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog recalcular -->
    <q-dialog v-model="recalcOpen" persistent>
      <q-card style="width: 520px; max-width: 95vw; border-radius: 14px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Recalcular resultados</div>
          <div class="text-caption">
            Esto actualizará los logros del mes <b>{{ month }}</b
            >.
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-banner rounded class="bg-grey-2 text-grey-9">
            Recomendado cuando se ajustan reglas o se cargan citas atrasadas.
          </q-banner>

          <div class="text-caption text-grey-7">
            Se usará el filtro actual:
            <b>{{
              programId ? "Programa seleccionado" : "Todos los programas"
            }}</b
            >, <b>{{ scopeLabel(scopeFilter) }}</b
            >,
            <span v-if="scopeFilter !== 'locality'">
              <b>{{
                operatorsSelected?.length
                  ? "Operadoras seleccionadas"
                  : "Todas las operadoras"
              }}</b>
            </span>
            <span v-else>
              <b>{{
                localitiesSelected?.length
                  ? "Localidades seleccionadas"
                  : "Todas las localidades"
              }}</b>
            </span>
            .
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            unelevated
            label="Recalcular"
            color="primary"
            :loading="recalcLoading"
            @click="doRecalc"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
const recalcLoading = ref(false);
const recalcOpen = ref(false);

const achievements = ref([]);

const month = ref(getCurrentMonth());
const programId = ref(null);
const status = ref(null);

// ✅ NUEVO
const scopeFilter = ref("all"); // all | user | locality
const scopeOptions = [
  { label: "Todas", value: "all" },
  { label: "Operadoras", value: "user" },
  { label: "Localidades", value: "locality" },
];

// filtros
const monthOptions = computed(() => buildMonthOptions(12));

const programOptions = ref([]);
const operatorsOptions = ref([]);
const operatorsSelected = ref([]);

const localitiesOptions = ref([]); // {label,value} basado en subjectLocalityCode
const localitiesSelected = ref([]);

const statusOptions = [
  { label: "En progreso", value: "in_progress" },
  { label: "Lograda", value: "achieved" },
  { label: "No lograda", value: "not_achieved" },
  { label: "Aprobada", value: "approved" },
  { label: "Entregada", value: "delivered" },
];

// -----------------------------
// KPIs (sobre achievements filtrados)
// -----------------------------
const kpi = computed(() => {
  const arr = achievements.value || [];

  const usersSet = new Set(
    arr
      .map((x) => x?.subjectUser?._id || x?.subjectUser || null)
      .filter(Boolean),
  );

  // localidades: contamos por subjectLocalityCode (aunque haya leaderUserId)
  const locSet = new Set(
    arr.map((x) => x?.subjectLocalityCode || null).filter(Boolean),
  );

  const achieved = arr.filter((x) =>
    ["achieved", "approved", "delivered"].includes(x.status),
  ).length;

  const inProgress = arr.filter((x) => x.status === "in_progress").length;

  const sum = arr.reduce(
    (acc, x) => acc + (Number(x?.rewardSnapshot?.amount || 0) || 0),
    0,
  );

  const rewardLabel = sum > 0 ? `RD$${sum.toLocaleString("es-DO")}` : "—";

  return {
    users: usersSet.size,
    localities: locSet.size,
    achieved,
    inProgress,
    rewardLabel,
  };
});

// -----------------------------
// Grouping (por usuario si existe, si no por localidad)
// -----------------------------
const grouped = computed(() => {
  const map = new Map();

  const locLabelByCode = new Map(
    (localitiesOptions.value || []).map((o) => [o.value, o.label]),
  );

  for (const a of achievements.value || []) {
    const hasUser = !!(a?.subjectUser?._id || a?.subjectUser);
    const locCode = a?.subjectLocalityCode || null;

    let groupId = "";
    let groupName = "";
    let kind = "user";
    let groupImage = null

    if (hasUser) {
      const u = a?.subjectUser?._id || a?.subjectUser;
      const name = a?.subjectUser?.name || "Sin usuario";
      groupId = `USR:${String(u)}`;
      groupName = name;
      groupImage = a.subjectUser?.img || null;
      kind = "user";
    } else if (locCode) {
      groupId = `LOC:${String(locCode)}`;
      groupName = `Localidad: ${locLabelByCode.get(String(locCode)) || String(locCode)}`;
      kind = "locality";
    } else {
      groupId = "UNKNOWN";
      groupName = "Sin sujeto";
      kind = "unknown";
    }

    if (!map.has(groupId))
      map.set(groupId, { groupId, groupName, kind, groupImage, items: [] });
    map.get(groupId).items.push(a);
  }

  const out = Array.from(map.values()).map((g) => {
    const items = g.items || [];
    const achieved = items.filter((x) =>
      ["achieved", "approved", "delivered"].includes(x.status),
    ).length;

    const inProgress = items.filter((x) => x.status === "in_progress").length;

    const sum = items.reduce(
      (acc, x) => acc + (Number(x?.rewardSnapshot?.amount || 0) || 0),
      0,
    );

    const rewardLabel = sum > 0 ? `RD$${sum.toLocaleString("es-DO")}` : "—";

    return { ...g, kpi: { achieved, inProgress, rewardLabel } };
  });

  // ordenar: users primero, luego localidades; por nombre
  return out.sort((a, b) => {
    const ak = a.kind === "user" ? 0 : a.kind === "locality" ? 1 : 2;
    const bk = b.kind === "user" ? 0 : b.kind === "locality" ? 1 : 2;
    if (ak !== bk) return ak - bk;
    return String(a.groupName || "").localeCompare(String(b.groupName || ""));
  });
});

const detailOpen = ref(false);
const selected = ref(null);

const openDetail = (a) => {
  selected.value = a;
  detailOpen.value = true;
};

onMounted(async () => {
  await Promise.all([loadOperators()]);
  // await reload();
  await doRecalc();
});

const loadPrograms = async () => {
  try {
    const resp = await methodsHttp.getApi("incentives/programs?active=true");
    programOptions.value = resp?.ok ? resp.programs || [] : [];
  } catch (e) {
    programOptions.value = [];
  }
};

const loadOperators = async () => {
  try {
    // ⚠️ Ajusta al endpoint real tuyo
    const resp = await methodsHttp.getApi(
      "user/getEmployees?isActived=true&departmentCode=TRIPLE_S",
    );
    operatorsOptions.value = resp?.ok ? resp.employees || [] : [];
  } catch (e) {
    operatorsOptions.value = [];
  }
};

function syncLocalitiesOptions(baseArr) {
  const codes = new Set(
    (baseArr || [])
      .map((x) =>
        x?.subjectLocalityCode ? String(x.subjectLocalityCode) : null,
      )
      .filter(Boolean),
  );

  const opts = Array.from(codes)
    .sort((a, b) => a.localeCompare(b))
    .map((code) => ({ label: code, value: code }));

  localitiesOptions.value = opts;

  // limpiar selected si ya no existe
  if (localitiesSelected.value?.length) {
    const valid = new Set(opts.map((o) => o.value));
    localitiesSelected.value = localitiesSelected.value.filter((x) =>
      valid.has(String(x)),
    );
  }
}

const reload = async () => {
  loading.value = true;

  try {
    const q = new URLSearchParams();
    q.set("month", month.value);
    if (programId.value) q.set("programId", programId.value);

    // ✅ si tu backend lo soporta, ya va; si no, igual filtramos abajo
    if (status.value) q.set("status", status.value);
    if (scopeFilter.value !== "all") q.set("scopeType", scopeFilter.value);

    // usuarios (si backend soporta)
    if (scopeFilter.value !== "locality" && operatorsSelected.value?.length) {
      q.set("userIds", operatorsSelected.value.join(","));
    }

    // localidades (si backend soporta)
    if (scopeFilter.value !== "user" && localitiesSelected.value?.length) {
      q.set("localityCodes", localitiesSelected.value.join(","));
    }

    const resp = await methodsHttp.getApi(
      `incentives/getAchievementsManager?${q.toString()}`,
    );

    if (!resp?.ok) {
      achievements.value = [];
      Notify.create({
        type: "negative",
        message: resp?.mensaje || "No se pudo cargar.",
      });
      return;
    }

    const baseArr = resp.achievements || [];
    syncLocalitiesOptions(baseArr);

    let arr = baseArr;

    // -------------------------
    // Fallback client-side filters
    // -------------------------

    // tipo
    if (scopeFilter.value === "user") {
      arr = arr.filter((x) => !!(x?.subjectUser?._id || x?.subjectUser));
    } else if (scopeFilter.value === "locality") {
      arr = arr.filter((x) => !!x?.subjectLocalityCode);
    }

    // operadoras
    if (scopeFilter.value !== "locality" && operatorsSelected.value?.length) {
      const set = new Set(operatorsSelected.value.map(String));
      arr = arr.filter((x) => {
        const id = x?.subjectUser?._id || x?.subjectUser;
        return id ? set.has(String(id)) : false;
      });
    }

    // localidades
    if (scopeFilter.value !== "user" && localitiesSelected.value?.length) {
      const set = new Set(localitiesSelected.value.map(String));
      arr = arr.filter((x) =>
        x?.subjectLocalityCode ? set.has(String(x.subjectLocalityCode)) : false,
      );
    }

    // status
    if (status.value) {
      arr = arr.filter((x) => x.status === status.value);
    }

    achievements.value = arr;
  } catch (e) {
    achievements.value = [];
    Notify.create({ type: "negative", message: "Error cargando resultados." });
  } finally {
    loading.value = false;
  }
};

const onRecalc = () => {
  recalcOpen.value = true;
};

const doRecalc = async () => {
  recalcLoading.value = true;
  try {
    const payload = {
      month: month.value,
      programId: programId.value || null,

      // ✅ si estás en operadoras (o all) y seleccionaste operadoras
      userIds:
        scopeFilter.value !== "locality" && operatorsSelected.value?.length
          ? operatorsSelected.value
          : null,

      // ✅ si estás en localidades (o all) y seleccionaste localidades
      localityCodes:
        scopeFilter.value !== "user" && localitiesSelected.value?.length
          ? localitiesSelected.value
          : null,
    };

    const resp = await methodsHttp.postApi(
      "incentives/recalcIncentivesMonth",
      payload,
    );

    if (!resp?.ok) {
      Notify.create({
        type: "negative",
        message: resp?.mensaje || "No se pudo recalcular.",
      });
      return;
    }

    const upserts =
      resp.achievementsUpserted ?? resp.upserts ?? resp.modified ?? 0;

    Notify.create({
      type: "positive",
      message: `Recalculo listo. Upserts: ${upserts}`,
    });

    recalcOpen.value = false;
    await reload();
  } catch (e) {
    Notify.create({ type: "negative", message: "Error recalculando." });
  } finally {
    recalcLoading.value = false;
  }
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
  return map[ch] || ch || "—";
};

function scopeLabel(v) {
  if (v === "user") return "Operadoras";
  if (v === "locality") return "Localidades";
  return "Todas";
}

function localityLabel(code) {
  const map = new Map(
    (localitiesOptions.value || []).map((o) => [String(o.value), o.label]),
  );
  return map.get(String(code)) || String(code || "—");
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

.group-card {
  border-radius: 14px;
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
