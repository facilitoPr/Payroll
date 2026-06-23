<template>
  <div class="bg-white q-px-md">
    <PageHeaderCard
      title="Citas"
      subtitle="Gestiona, filtra y exporta las citas del rango."
      icon="event"
    >
      <template #actions>
        <!-- OPERADORAS (MANAGER) o SWITCH (NO MANAGER) -->
        <template v-if="isManager">
          <q-select
            class="header-search"
            v-model="operatorsSelected"
            label="Operadoras (puedes elegir varias)"
            outlined
            dense
            color="primary"
            :options="operatorsOptions"
            option-label="name"
            option-value="_id"
            emit-value
            map-options
            multiple
            use-chips
            clearable
            @update:model-value="onFiltersChange"
          >
            <template #prepend>
              <q-icon name="support_agent" color="primary" />
            </template>

            <template #no-option>
              <q-item>
                <q-item-section class="text-grey-7">
                  No hay operadoras disponibles
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </template>

        <template v-else>
          <div class="row items-center q-gutter-sm header-search">
            <q-icon name="person" color="primary" />
            <q-toggle
              v-model="onlyMine"
              color="primary"
              label="Solo mis citas"
              @update:model-value="onFiltersChange"
            />
          </div>
        </template>

        <!-- ✅ FECHA (DÍA o RANGO) -->
        <div class="row items-center q-gutter-sm header-field">
          <q-tabs
            v-model="dateMode"
            dense
            no-caps
            inline-label
            class="date-seg"
            active-color="white"
            indicator-color="transparent"
            @update:model-value="onFiltersChange"
          >
            <q-tab name="day" icon="today" label="Día" />
            <q-tab name="range" icon="date_range" label="Rango" />
          </q-tabs>

          <q-input
            outlined
            dense
            readonly
            clearable
            class="col"
            :label="dateMode === 'day' ? 'Día' : 'Rango de fecha'"
            :model-value="dateRangePretty"
            @clear="clearDateRange"
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <!-- MODO DÍA -->
                  <q-date
                    v-if="dateMode === 'day'"
                    v-model="selectedDay"
                    mask="YYYY/MM/DD"
                  >
                    <div
                      class="row items-center justify-end q-gutter-sm q-pa-sm"
                    >
                      <q-btn
                        flat
                        label="Hoy"
                        color="grey-8"
                        @click="setTodayRange"
                      />
                      <q-btn
                        flat
                        label="Cerrar"
                        color="primary"
                        v-close-popup
                      />
                      <q-btn
                        unelevated
                        label="Aplicar"
                        color="primary"
                        @click="applyDateRange"
                        v-close-popup
                      />
                    </div>
                  </q-date>

                  <!-- MODO RANGO -->
                  <q-date v-else v-model="dateRange" range mask="YYYY/MM/DD">
                    <div
                      class="row items-center justify-end q-gutter-sm q-pa-sm"
                    >
                      <q-btn
                        flat
                        label="Hoy"
                        color="grey-8"
                        @click="setTodayRange"
                      />
                      <q-btn
                        flat
                        label="Cerrar"
                        color="primary"
                        v-close-popup
                      />
                      <q-btn
                        unelevated
                        label="Aplicar"
                        color="primary"
                        @click="applyDateRange"
                        v-close-popup
                      />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>

            <template #before>
              <q-icon
                name="schedule"
                class="cursor-pointer"
                @click="setTodayRange"
              />
            </template>
          </q-input>
        </div>

        <!-- Zona -->
        <q-select
          v-model="zoneSelected"
          :options="zonesOptions"
          option-label="name"
          option-value="_id"
          emit-value
          map-options
          outlined
          dense
          clearable
          label="Zona"
          color="primary"
          class="header-field"
          @update:model-value="onFiltersChange"
        >
          <template #prepend>
            <q-icon name="place" color="primary" />
          </template>
        </q-select>

        <!-- Buscar -->
        <q-input
          outlined
          dense
          label="Buscar"
          color="primary"
          v-model="text"
          clearable
          class="header-search"
          @keyup.enter="searchByText"
          @clear="onClearSearch"
        >
          <template #append>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>

        <!-- CHECKMARKS -->
        <q-select
          class="header-search"
          v-model="marksSelected"
          label="CHECKMARKS (puedes elegir varios)"
          outlined
          dense
          color="primary"
          :options="MARKS"
          option-label="label"
          option-value="code"
          emit-value
          map-options
          multiple
          use-chips
          clearable
          @update:model-value="onFiltersChange"
        >
          <template #selected-item="scope">
            <q-chip
              dense
              :color="scope.opt.color"
              text-color="white"
              class="q-mr-xs"
            >
              <q-icon :name="scope.opt.icon" size="10px" class="q-mr-xs" />
              {{ scope.opt.label }}
            </q-chip>
          </template>
        </q-select>

        <!-- Botones -->
        <q-btn
          color="primary"
          unelevated
          icon="search"
          label="Buscar"
          class="header-btn"
          @click="searchByText"
        />
      </template>
    </PageHeaderCard>

    <!-- SELECTOR DE GRUPOS (VISUAL MODERNO) -->
    <q-card flat bordered class="q-mb-md group-switcher">
      <q-card-section class="q-pa-sm">
        <div class="row items-center justify-between q-col-gutter-sm">
          <div class="col-12 col-md">
            <q-tabs
              v-model="activeGroup"
              dense
              no-caps
              inline-label
              align="left"
              class="text-primary"
              active-color="primary"
              indicator-color="primary"
            >
              <q-tab
                name="appointment"
                icon="event_available"
                label="Citas del rango"
              >
                <q-badge color="primary" floating>{{
                  countAppointment
                }}</q-badge>
                <q-tooltip>Filtra por date (día de asistencia)</q-tooltip>
              </q-tab>

              <q-tab
                name="created"
                icon="edit_calendar"
                label="Calendarizadas en rango"
              >
                <q-badge color="deep-orange" floating>{{
                  countCreated
                }}</q-badge>
                <q-tooltip>
                  Filtra por createdByOperatorDate (día que la operadora la
                  creó)
                </q-tooltip>
              </q-tab>
            </q-tabs>
          </div>

          <div class="col-12 col-md-auto">
            <q-chip
              outline
              color="primary"
              text-color="primary"
              icon="calendar_today"
              class="q-mt-xs q-mt-md-none"
            >
              {{ dateRangePretty }}
            </q-chip>
          </div>
        </div>

        <q-separator class="q-mt-sm" />

        <q-banner rounded class="q-mt-sm bg-grey-1 text-grey-9 group-banner">
          <div class="row items-center q-gutter-sm">
            <q-icon
              :name="activeGroup === 'appointment' ? 'event' : 'schedule'"
              color="primary"
              size="20px"
            />
            <div class="text-body2">
              <template v-if="activeGroup === 'appointment'">
                Mostrando citas cuyo <b>día de asistencia</b> está entre
                <b>{{ dateRangePretty }}</b
                >.
              </template>
              <template v-else>
                Mostrando citas que fueron
                <b>calendarizadas por la operadora</b> entre
                <b>{{ dateRangePretty }}</b
                >.
              </template>
            </div>
            <q-space />
            <q-chip dense color="grey-3" text-color="grey-9">
              Total: <b class="q-ml-xs">{{ countToRender }}</b>
            </q-chip>
          </div>
        </q-banner>
      </q-card-section>
    </q-card>

    <!-- TOTALES (UI moderna) -->
    <q-card flat bordered class="q-mb-md totals-card">
      <q-card-section class="q-pa-md">
        <div class="row q-col-gutter-md">
          <!-- Total General -->
          <div class="col-12 col-md-2">
            <div class="kpi-box">
              <div class="kpi-head">
                <div class="kpi-icon bg-primary-1 text-primary">
                  <q-icon
                    :name="
                      activeGroup === 'appointment' ? 'event' : 'edit_calendar'
                    "
                    size="22px"
                  />
                </div>
                <div class="kpi-titles">
                  <div class="kpi-title">
                    {{
                      activeGroup === "appointment"
                        ? "Total de citas"
                        : "Total calendarizadas"
                    }}
                  </div>
                  <div class="kpi-subtitle">
                    Página: <b>{{ rowsToRender.length }}</b> /
                    <b>{{ limit }}</b>
                  </div>
                </div>
              </div>

              <div class="kpi-value">{{ totalsToRender.countTotal }}</div>
            </div>
          </div>

          <!-- Por Zona -->
          <div class="col-12 col-md-5">
            <div class="kpi-box">
              <div class="kpi-head">
                <div class="kpi-icon bg-grey-3 text-grey-9">
                  <q-icon name="place" size="22px" />
                </div>
                <div class="kpi-titles">
                  <div class="kpi-title">Por zona</div>
                  <div class="kpi-subtitle">
                    {{ totalsToRender.totalsByZone?.length || 0 }} zonas
                  </div>
                </div>
              </div>

              <div class="chips-scroll">
                <q-chip
                  v-for="z in totalsToRender.totalsByZone"
                  :key="z.zoneId || z.name"
                  dense
                  color="grey-8"
                  text-color="white"
                  class="q-mr-xs"
                >
                  {{ z.name }}: {{ z.count }}
                </q-chip>

                <div
                  v-if="!(totalsToRender.totalsByZone || []).length"
                  class="text-caption text-grey-6 q-pa-sm"
                >
                  No hay datos
                </div>
              </div>
            </div>
          </div>

          <!-- Por Marks -->
          <div class="col-12 col-md-5">
            <div class="kpi-box">
              <div class="kpi-head">
                <div class="kpi-icon bg-green-1 text-green-10">
                  <q-icon name="task_alt" size="22px" />
                </div>
                <div class="kpi-titles">
                  <div class="kpi-title">Por checkmarks</div>
                  <div class="kpi-subtitle">
                    {{ totalsMarksPrettyToRender?.length || 0 }} checkmarks con
                    data
                  </div>
                </div>
              </div>

              <div class="chips-scroll">
                <q-chip
                  v-for="m in totalsMarksPrettyToRender"
                  :key="m.code"
                  dense
                  :color="m.color"
                  text-color="white"
                  class="q-mr-xs"
                >
                  <q-icon :name="m.icon" size="16px" class="q-mr-xs" />
                  {{ m.label }}: {{ m.count }}
                </q-chip>

                <div
                  v-if="!totalsMarksPrettyToRender.length"
                  class="text-caption text-grey-6 q-pa-sm"
                >
                  No hay datos de checkmarks para este filtro
                </div>
              </div>
            </div>
          </div>

          <!-- Por Operadora -->
          <div class="col-12" v-if="showOperatorTotals">
            <div class="kpi-box">
              <div class="kpi-head">
                <div class="kpi-icon bg-blue-1 text-blue-10">
                  <q-icon name="support_agent" size="22px" />
                </div>
                <div class="kpi-titles">
                  <div class="kpi-title">Por operadora</div>
                  <div class="kpi-subtitle">
                    {{ totalsToRender.totalsByOperator?.length || 0 }}
                    operadoras
                  </div>
                </div>
              </div>

              <div class="q-mt-sm">
                <q-chip
                  v-for="o in totalsToRender.totalsByOperator"
                  :key="o.userId || o.name"
                  dense
                  color="primary"
                  text-color="white"
                  class="q-mr-xs"
                >
                  {{ o.name }}: {{ o.count }}
                </q-chip>

                <div
                  v-if="!(totalsToRender.totalsByOperator || []).length"
                  class="text-caption text-grey-6 q-pa-sm"
                >
                  No hay datos
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <TableReminders
      :rows="rowsToRender"
      :tableLoading="tableLoading"
      :getReminders="getReminders"
    />

    <div
      class="col-12 q-mt-sm"
      style="display: flex; align-items: center; justify-content: center"
    >
      <TablePagination
        v-model="initialPagination"
        :orderQuantity="orderQuantityToRender"
        color="light-blue-10"
        active-color="light-blue-5"
      />
    </div>
  </div>
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import "moment/dist/locale/es";
moment.locale("es-do");
import { ref, onMounted, watch, computed } from "vue";
import TablePagination from "src/components/table/TablePagination.vue";
import TableReminders from "../components/reminders/TableReminders.vue";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import { MARKS } from "src/data/appointmentMarks";
import { authStore } from "src/stores/auth-store";

const auth = authStore();

const limit = ref(10);
const initial = ref(0);
const initialPagination = ref(1);

const tableLoading = ref(false);
const rows = ref([]); // (no se usa directamente, pero puedes dejarlo)
const text = ref("");

const zonesOptions = ref([]);
const statusOptions = ref([]);

const zoneSelected = ref(null);
const statusSelected = ref(null);

const marksSelected = ref([]);

const onlyMine = ref(false);
const operatorsOptions = ref([]);
const operatorsSelected = ref([]);

const activeGroup = ref("appointment"); // 'appointment' | 'created'

// ✅ isManager corregido (tu expresión anterior tenía un bug)
const isManager = computed(() => {
  const role = auth?.user?.rol?.code;
  return !!auth?.user?.isManager || role === "ADMIN" || role === "SUPERADMIN";
});

const todayStr = () => moment(new Date()).format("YYYY/MM/DD");
const dateMode = ref("range");
const selectedDay = ref(todayStr());

// Por default: hoy -> hoy
const dateRange = ref({
  from: todayStr(),
  to: todayStr(),
});

const normalizeYMD = (v) => {
  const s = String(v || "").trim();
  if (!s) return "";
  const parts = s.includes("/") ? s.split("/") : s.split("-");
  if (parts.length !== 3) return "";
  const [yy, mmRaw, ddRaw] = parts;
  if (!/^\d{4}$/.test(yy)) return "";
  const mm = String(mmRaw || "").padStart(2, "0");
  const dd = String(ddRaw || "").padStart(2, "0");
  if (!/^\d{2}$/.test(mm) || !/^\d{2}$/.test(dd)) return "";
  return `${yy}/${mm}/${dd}`;
};

const dateRangePretty = computed(() => {
  const day = normalizeYMD(selectedDay.value);

  const from = normalizeYMD(dateRange.value?.from);
  const to = normalizeYMD(dateRange.value?.to);

  // según modo
  const finalFrom = dateMode.value === "day" ? day : from || to;
  const finalTo = dateMode.value === "day" ? day : to || from;

  if (!finalFrom && !finalTo) return "—";

  const fromLL = finalFrom ? moment(finalFrom, "YYYY/MM/DD").format("LL") : "—";
  const toLL = finalTo ? moment(finalTo, "YYYY/MM/DD").format("LL") : "";

  if (finalFrom && finalTo) {
    if (finalFrom === finalTo) return fromLL;
    return `${fromLL} → ${toLL}`;
  }

  return fromLL || toLL || "—";
});

const setTodayRange = () => {
  const t = todayStr();

  if (dateMode.value === "day") {
    selectedDay.value = t;
  } else {
    dateRange.value = { from: t, to: t };
  }

  onFiltersChange();
};

const clearDateRange = () => {
  // volvemos a "hoy" en ambos modos
  setTodayRange();
};

const applyDateRange = () => {
  onFiltersChange();
};

/** =========================
 * Helpers Totals
 * ========================= */
const emptyTotals = () => ({
  countTotal: 0,
  totalsByOperator: [],
  totalsByZone: [],
  totalsByMarks: [],
});

const groupAppointment = ref({
  rows: [],
  count: 0,
  totals: emptyTotals(),
});

const groupCreated = ref({
  rows: [],
  count: 0,
  totals: emptyTotals(),
});

// badges
const countAppointment = computed(() => groupAppointment.value.count || 0);
const countCreated = computed(() => groupCreated.value.count || 0);

// group actual
const rowsToRender = computed(() =>
  activeGroup.value === "appointment"
    ? groupAppointment.value.rows
    : groupCreated.value.rows,
);

const totalsToRender = computed(() =>
  activeGroup.value === "appointment"
    ? groupAppointment.value.totals
    : groupCreated.value.totals,
);

const countToRender = computed(() =>
  activeGroup.value === "appointment"
    ? groupAppointment.value.count
    : groupCreated.value.count,
);

const orderQuantityToRender = computed(() =>
  Math.ceil((countToRender.value || 0) / limit.value),
);

// mostrar totales por operadora
const showOperatorTotals = computed(() => {
  if (isManager.value) return true;
  return !onlyMine.value;
});

// helper: pretty marks
const buildPrettyMarks = (totalsByMarks = []) => {
  const arr = Array.isArray(totalsByMarks) ? totalsByMarks : [];
  if (!arr.length) return [];

  const map = new Map(MARKS.map((m) => [m.code, m]));

  return arr
    .map((x) => {
      const code = String(x?.mark || x?.code || "").toUpperCase();
      const meta = map.get(code);
      return meta
        ? { ...meta, count: x.count || 0 }
        : {
            code,
            label: code,
            icon: "label",
            color: "grey-7",
            count: x.count || 0,
          };
    })
    .sort((a, b) => b.count - a.count);
};

const totalsMarksPrettyToRender = computed(() =>
  buildPrettyMarks(totalsToRender.value?.totalsByMarks || []),
);

// ✅ usuarios a enviar
const usersToSend = computed(() => {
  if (isManager.value) {
    return operatorsSelected.value?.length ? operatorsSelected.value : null;
  }

  const myId = auth?.user?._id || auth?.user?.id;
  if (!myId) return null;
  return onlyMine.value ? [myId] : null;
});

onMounted(async () => {
  await getZones();
  await getReminders();

  if (isManager.value) {
    await getOperators();
  }
});

// paginación
watch(initialPagination, async (page) => {
  initial.value = (page - 1) * limit.value;
  getReminders();
});

// si cambias de tab, reinicia paginación (no hace falta recargar, pero lo dejo como lo tenías)
watch(activeGroup, () => {
  changePaginationValues();
  getReminders();
});

/**
 * ✅ getReminders ahora acepta extra:
 * - desde TableReminders: getReminders({ dateRange: {from,to}, ... })
 * - o desde aquí sin extra: usa dateRange del padre
 */
const getReminders = async (extra = {}) => {
  tableLoading.value = true;

  const extraDay = normalizeYMD(extra?.date || extra?.day || "");
  const extraFrom = normalizeYMD(extra?.dateRange?.from);
  const extraTo = normalizeYMD(extra?.dateRange?.to);

  let finalFrom = "";
  let finalTo = "";

  if (extraDay) {
    finalFrom = extraDay;
    finalTo = extraDay;
  } else if (dateMode.value === "day") {
    const d = normalizeYMD(selectedDay.value);
    finalFrom = d;
    finalTo = d;
  } else {
    const from = extraFrom || normalizeYMD(dateRange.value?.from);
    const to = extraTo || normalizeYMD(dateRange.value?.to);
    finalFrom = from || to;
    finalTo = to || from;
  }

  const payload = {
    dateRange: finalFrom && finalTo ? { from: finalFrom, to: finalTo } : null,
    zone: zoneSelected.value || null,
    status: statusSelected.value || null,
    text: (text.value || "").trim() || null,
    marks: marksSelected.value?.length ? marksSelected.value : null,
    users: usersToSend.value,
    ...extra,
  };

  // evita duplicados innecesarios
  delete payload.date;
  delete payload.day;

  const resp = await methodsHttp.postApi(
    `reminders/getReminders/${limit.value}/${initial.value}`,
    payload,
  );

  if (resp?.ok) {
    const a = resp.byAppointmentDate || {};
    const b = resp.byCreatedByOperatorDate || {};

    groupAppointment.value = {
      rows: a.reminders || [],
      count: a.count || 0,
      totals: {
        countTotal: a.count || 0,
        totalsByOperator: a.totalsByOperator || [],
        totalsByZone: a.totalsByZone || [],
        totalsByMarks: a.totalsByMarks || [],
      },
    };

    groupCreated.value = {
      rows: b.reminders || [],
      count: b.count || 0,
      totals: {
        countTotal: b.count || 0,
        totalsByOperator: b.totalsByOperator || [],
        totalsByZone: b.totalsByZone || [],
        totalsByMarks: b.totalsByMarks || [],
      },
    };
  } else {
    groupAppointment.value = { rows: [], count: 0, totals: emptyTotals() };
    groupCreated.value = { rows: [], count: 0, totals: emptyTotals() };
  }

  tableLoading.value = false;
};

const getZones = async () => {
  const resp = await methodsHttp.getApi("zones/getZonesActived");
  zonesOptions.value = resp?.ok ? resp.zones || [] : [];
};

const getOperators = async () => {
  const resp = await methodsHttp.getApi(
    "user/getEmployees?isActived=true&departmentCode=TRIPLE_S",
  );
  operatorsOptions.value = resp?.ok
    ? resp.employees || resp.operators || []
    : [];
};

const onFiltersChange = () => {
  changePaginationValues();
  getReminders();
};

const changePaginationValues = () => {
  initial.value = 0;
  initialPagination.value = 1;
};

const searchByText = async () => {
  changePaginationValues();
  getReminders();
};

const onClearSearch = () => {
  text.value = "";
  changePaginationValues();
  getReminders();
};
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
  font-size: 32px;
  font-weight: 900;
  margin-top: 10px;
  letter-spacing: 0.3px;
  color: #111827;
}

.chips-scroll {
  margin-top: 10px;
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

.group-switcher {
  border-radius: 14px;
}

.group-banner {
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/*  */
.date-seg {
  background: #f3f4f6; /* gris suave */
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 4px;
}

.date-seg :deep(.q-tab) {
  border-radius: 10px;
  min-height: 34px;
  padding: 0 12px;
  color: #374151;
}

.date-seg :deep(.q-tab--active) {
  background: #178DD2;
  box-shadow: 0 6px 16px rgba(17, 24, 39, 0.08);
}
</style>
