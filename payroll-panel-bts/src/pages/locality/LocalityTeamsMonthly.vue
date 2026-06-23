<template>
  <div class="bg-white q-pa-md">
    <PageHeaderCard
      title="Equipos por zona"
      subtitle="Visualiza la asignación mensual de operadoras por localidad (zonas)."
      icon="groups"
    >
      <template #actions>
        <div class="row items-center q-gutter-sm">
          <q-select
            outlined
            dense
            v-model="month"
            :options="monthOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            style="min-width: 220px"
            label="Mes"
            @update:model-value="reload"
          >
            <template #prepend
              ><q-icon name="calendar_month" color="primary"
            /></template>
          </q-select>

          <q-btn
            color="primary"
            outline
            icon="refresh"
            label="Refrescar"
            :loading="loading"
            @click="reload"
          />

          <q-btn
            v-if="isManager"
            color="primary"
            unelevated
            icon="autorenew"
            label="Ejecutar corrida"
            :loading="runLoading"
            @click="runAutoAssignment"
          />
        </div>
      </template>
    </PageHeaderCard>

    <!-- KPIs -->
    <!-- <q-card flat bordered class="kpi-card q-mb-md">
      <q-card-section class="row q-col-gutter-md">
        <div class="col-12 col-sm-3">
          <KpiMini icon="person" label="Operadores" :value="stats.totalOperators" />
        </div>
        <div class="col-12 col-sm-3">
          <KpiMini icon="check_circle" label="Asignados" :value="stats.assigned" />
        </div>
        <div class="col-12 col-sm-3">
          <KpiMini icon="error" label="Sin asignar" :value="stats.unassigned" />
        </div>
        <div class="col-12 col-sm-3">
          <KpiMini icon="place" label="Zonas activas" :value="zones.length" />
        </div>
      </q-card-section>
    </q-card> -->

    <q-card flat bordered class="main-card">
      <q-card-section class="q-pa-sm">
        <q-tabs
          v-model="tab"
          dense
          active-color="primary"
          indicator-color="primary"
          align="left"
        >
          <q-tab name="byUser" icon="person" label="Por operador" />
          <q-tab name="byZone" icon="place" label="Por zona" />
          <q-tab name="history" icon="history" label="Historial" />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <!-- TAB: Por operador -->
      <q-card-section v-show="tab === 'byUser'" class="q-pa-md">
        <div class="row items-center q-col-gutter-sm q-mb-sm">
          <div class="col-12 col-md-4">
            <q-input
              outlined
              dense
              clearable
              v-model="q"
              label="Buscar operador (nombre/email)"
            >
              <template #prepend
                ><q-icon name="search" color="primary"
              /></template>
            </q-input>
          </div>
        </div>

        <q-table
          flat
          bordered
          row-key="_id"
          :rows="rowsFiltered"
          :columns="columns"
          :loading="loading"
          :rows-per-page-options="[10, 20, 50]"
        >
          <template #body-cell-user="props">
            <q-td :props="props">
              <div class="row items-center no-wrap q-gutter-sm">
                <q-avatar size="34px">
                  <q-img
                    fit="cover"
                    :src="
                      props.row.user?.img ||
                      props.row.user?.image ||
                      fallbackAvatar
                    "
                  />
                </q-avatar>
                <div>
                  <div class="text-weight-medium">
                    {{ props.row.user?.name || "—" }}
                  </div>
                  <div class="text-caption text-grey-7">
                    {{ props.row.user?.email || "—" }}
                  </div>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-zone="props">
            <q-td :props="props">
              <q-chip
                dense
                :color="props.row.zone ? 'primary' : 'grey-6'"
                text-color="white"
                icon="place"
              >
                {{ props.row.zone?.name || "Sin asignar" }}
              </q-chip>
              <span
                v-if="props.row.zone?.code"
                class="text-caption text-grey-7 q-ml-sm"
              >
                ({{ props.row.zone.code }})
              </span>
            </q-td>
          </template>

          <template #body-cell-prevZone="props">
            <q-td :props="props">
              <q-chip
                dense
                outline
                :color="props.row.prevZone ? 'grey-8' : 'grey-6'"
                icon="undo"
              >
                {{ props.row.prevZone?.name || "—" }}
              </q-chip>

              <q-chip
                v-if="props.row.zone && props.row.prevZone"
                dense
                class="q-ml-xs"
                :color="props.row.isRepeat ? 'red-8' : 'green-8'"
                text-color="white"
                :icon="props.row.isRepeat ? 'warning' : 'check'"
              >
                {{ props.row.isRepeat ? "Repitió" : "Rotó" }}
              </q-chip>
            </q-td>
          </template>

          <!-- <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat dense round
                icon="timeline"
                color="primary"
                @click="openHistory(props.row.user)"
              >
                <q-tooltip>Ver historial</q-tooltip>
              </q-btn>
            </q-td>
          </template> -->

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                dense
                round
                icon="edit_location_alt"
                color="primary"
                @click="openEditAssignment(props.row)"
              >
                <q-tooltip>Cambiar zona</q-tooltip>
              </q-btn>

              <q-btn
                flat
                dense
                round
                icon="timeline"
                color="primary"
                class="q-ml-xs"
                @click="openHistory(props.row.user)"
              >
                <q-tooltip>Ver historial</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- TAB: Por zona -->
      <q-card-section v-show="tab === 'byZone'" class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div
            v-for="z in zonesGrouped"
            :key="z.zoneId"
            class="col-12 col-md-4"
          >
            <q-card flat bordered class="zone-card">
              <q-card-section class="row items-center justify-between">
                <div>
                  <div class="text-weight-bold">{{ z.zoneName }}</div>
                  <div class="text-caption text-grey-7">
                    {{ z.zoneCode || "—" }}
                  </div>
                </div>
                <q-chip dense color="primary" text-color="white">
                  {{ z.count }} ops
                </q-chip>
              </q-card-section>

              <q-separator />

              <q-card-section>
                <div class="chips-scroll">
                  <q-chip
                    v-for="u in z.users"
                    :key="u._id"
                    dense
                    color="grey-8"
                    text-color="white"
                    icon="person"
                  >
                    {{ u.name }}
                  </q-chip>
                  <div v-if="!z.users.length" class="text-caption text-grey-6">
                    Sin operadores en esta zona.
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <!-- TAB: Historial -->
      <q-card-section v-show="tab === 'history'" class="q-pa-md">
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-md-5">
            <q-select
              outlined
              dense
              clearable
              v-model="historyUserId"
              :options="operatorsOptions"
              option-label="name"
              option-value="_id"
              emit-value
              map-options
              label="Selecciona un operador"
              @update:model-value="loadUserHistory"
            >
              <template #prepend
                ><q-icon name="person" color="primary"
              /></template>
            </q-select>
          </div>
        </div>

        <q-card v-if="historyRows.length" flat bordered class="q-mt-md">
          <q-card-section>
            <q-timeline color="primary">
              <q-timeline-entry
                v-for="h in historyRows"
                :key="h.month"
                :title="h.monthLabel"
                :subtitle="h.zone?.name || 'Sin asignar'"
                icon="place"
              >
                <q-chip dense outline color="grey-8" icon="info">
                  {{ h.zone?.code || "—" }}
                </q-chip>
              </q-timeline-entry>
            </q-timeline>
          </q-card-section>
        </q-card>

        <div v-else class="text-caption text-grey-7 q-mt-md">
          Selecciona un operador para ver historial.
        </div>
      </q-card-section>
    </q-card>

    <!-- Dialog historial rápido -->
  <q-dialog v-model="historyDlg.open">
    <q-card style="width: 720px; max-width: 95vw; border-radius: 14px">
      <q-card-section class="row items-center justify-between bg-primary">
        <div class="text-white">
          <div class="text-h6">Historial de zonas</div>
          <div class="text-caption opacity-80">
            {{ historyDlg.user?.name || "—" }}
          </div>
        </div>
        <q-btn flat dense round icon="close" color="white" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div v-if="historyDlg.rows.length">
          <q-list bordered separator>
            <q-item v-for="r in historyDlg.rows" :key="r.month">
              <q-item-section>
                <q-item-label class="text-weight-medium">{{
                  r.monthLabel
                }}</q-item-label>
                <q-item-label caption>
                  {{ r.zone?.name || "Sin asignar" }} ({{
                    r.zone?.code || "—"
                  }})
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div v-else class="text-caption text-grey-7">Sin historial.</div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="editDlg.open">
    <q-card style="width: 720px; max-width: 95vw; border-radius: 14px">
      <q-card-section class="row items-center justify-between bg-primary">
        <div class="text-white">
          <div class="text-h6">Cambiar zona</div>
          <div class="text-caption opacity-80">
            {{ editDlg.row?.user?.name || "—" }}
          </div>
        </div>
        <q-btn flat dense round icon="close" color="white" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-sm">
        <q-select
          outlined
          dense
          clearable
          v-model="editDlg.zoneId"
          :options="zones"
          option-label="name"
          option-value="_id"
          emit-value
          map-options
          label="Zona del mes"
        >
          <template #prepend><q-icon name="place" color="primary" /></template>
        </q-select>

        <div class="text-caption text-grey-7">
          Si limpias el campo, el operador quedará <b>Sin asignar</b> para este
          mes.
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn
          color="primary"
          unelevated
          label="Guardar"
          :loading="editDlg.saving"
          @click="saveEditAssignment"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Notify } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import PageHeaderCard from "src/components/PageHeaderCard.vue";

// Mini KPI local (simple)
const KpiMini = {
  props: ["icon", "label", "value"],
  template: `
    <div class="kpi-mini">
      <div class="kpi-mini__head">
        <div class="kpi-mini__icon">
          <q-icon :name="icon" size="20px" />
        </div>
        <div class="kpi-mini__label">{{ label }}</div>
      </div>
      <div class="kpi-mini__value">{{ value }}</div>
    </div>
  `,
};

const fallbackAvatar =
  "https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp";

const tab = ref("byUser");
const loading = ref(false);
const runLoading = ref(false);

const month = ref(getCurrentMonth());
const monthOptions = computed(() => buildMonthOptions(24));

const q = ref("");

// data
const zones = ref([]);
const operatorsOptions = ref([]);

// assignments (mes seleccionado + mes anterior)
const assignments = ref([]); // month
const prevAssignments = ref([]); // prev month

const stats = ref({
  totalOperators: 0,
  assigned: 0,
  unassigned: 0,
});

const isManager = computed(() => true); // cámbialo si lo sacas de authStore()

const columns = [
  { name: "user", label: "Operador", field: "user", align: "left" },
  { name: "zone", label: "Zona (mes)", field: "zone", align: "left" },
  {
    name: "prevZone",
    label: "Zona mes anterior",
    field: "prevZone",
    align: "left",
  },
  { name: "actions", label: "", field: "actions", align: "right" },
];

const rows = computed(() => {
  // map prev zone por usuario
  const prevMap = new Map();
  for (const a of prevAssignments.value || []) {
    const uid = a?.user?._id || a?.user;
    if (uid) prevMap.set(String(uid), a.zone || null);
  }

  // map current assignment por usuario
  const curMap = new Map();
  for (const a of assignments.value || []) {
    const uid = a?.user?._id || a?.user;
    if (uid) curMap.set(String(uid), a.zone || null);
  }

  // construye rows por lista de operadores (para ver también “sin asignar”)
  const out = (operatorsOptions.value || []).map((u) => {
    const z = curMap.get(String(u._id)) || null;
    const pz = prevMap.get(String(u._id)) || null;

    const isRepeat = z && pz && String(z._id || z) === String(pz._id || pz);

    return {
      _id: String(u._id),
      user: u,
      zone: z,
      prevZone: pz,
      isRepeat,
    };
  });

  const assigned = out.filter((r) => !!r.zone).length;
  stats.value = {
    totalOperators: out.length,
    assigned,
    unassigned: out.length - assigned,
  };

  return out;
});

const rowsFiltered = computed(() => {
  const txt = String(q.value || "")
    .trim()
    .toLowerCase();
  if (!txt) return rows.value;
  return rows.value.filter((r) => {
    const name = String(r.user?.name || "").toLowerCase();
    const email = String(r.user?.email || "").toLowerCase();
    return name.includes(txt) || email.includes(txt);
  });
});

const zonesGrouped = computed(() => {
  const zoneMap = new Map();
  for (const z of zones.value || []) {
    zoneMap.set(String(z._id), {
      zoneId: String(z._id),
      zoneName: z.name,
      zoneCode: z.code,
      count: 0,
      users: [],
    });
  }

  for (const r of rows.value) {
    if (!r.zone?._id) continue;
    const zid = String(r.zone._id);
    const item = zoneMap.get(zid) || {
      zoneId: zid,
      zoneName: r.zone?.name || "Zona",
      zoneCode: r.zone?.code || null,
      count: 0,
      users: [],
    };
    item.count++;
    item.users.push({ _id: r.user._id, name: r.user.name });
    zoneMap.set(zid, item);
  }

  return Array.from(zoneMap.values()).sort((a, b) =>
    String(a.zoneName).localeCompare(String(b.zoneName)),
  );
});

/** Historial tab */
const historyUserId = ref(null);
const historyRows = ref([]);

const historyDlg = ref({
  open: false,
  user: null,
  rows: [],
});

const editDlg = ref({
  open: false,
  row: null,
  zoneId: null, // emit-value => _id
  saving: false,
});

onMounted(async () => {
  await reload();
});

async function reload() {
  loading.value = true;
  try {
    await Promise.all([loadZones(), loadOperators()]);
    await loadMonthAssignments();
  } finally {
    loading.value = false;
  }
}

async function loadZones() {
  const resp = await methodsHttp.getApi("zones/getZonesActived");
  zones.value = resp?.ok ? resp.zones || [] : [];
}

async function loadOperators() {
  // tu endpoint real
  const resp = await methodsHttp.getApi(
    "user/getEmployees?isActived=true&departmentCode=TRIPLE_S",
  );
  operatorsOptions.value = resp?.ok ? resp.employees || [] : [];
}

async function saveEditAssignment() {
  const row = editDlg.value.row;
  if (!row?.user?._id) return;

  editDlg.value.saving = true;
  try {
    const resp = await methodsHttp.postApi("zonesTeams/setManualAssignment", {
      month: month.value,
      userId: row.user._id,
      zoneId: editDlg.value.zoneId || null, // null = sin asignar
      updateUsersZone: true,
    });

    if (!resp?.ok) {
      Notify.create({
        type: "negative",
        message: resp?.mensaje || "No se pudo actualizar.",
      });
      return;
    }

    Notify.create({ type: "positive", message: "Asignación guardada." });
    editDlg.value.open = false;

    // refrescar asignaciones
    await loadMonthAssignments();
  } catch (e) {
    Notify.create({ type: "negative", message: "Error guardando asignación." });
  } finally {
    editDlg.value.saving = false;
  }
}

/**
 * ⚠️ Estos endpoints los crearás en backend cuando hagamos el módulo:
 * - zonesTeams/getAssignmentsByMonth?month=YYYY-MM
 *   -> devuelve assignments con populate user+zone
 */
async function loadMonthAssignments() {
  const prev = prevMonth(month.value);

  const [curResp, prevResp] = await Promise.all([
    methodsHttp.getApi(`zonesTeams/getAssignmentsByMonth?month=${month.value}`),
    methodsHttp.getApi(`zonesTeams/getAssignmentsByMonth?month=${prev}`),
  ]);

  assignments.value = curResp?.ok ? curResp.assignments || [] : [];
  prevAssignments.value = prevResp?.ok ? prevResp.assignments || [] : [];
}

async function runAutoAssignment() {
  runLoading.value = true;
  try {
    // ⚠️ Endpoint backend a crear:
    // POST zonesTeams/runAutoAssignment  { month }
    const resp = await methodsHttp.postApi("zonesTeams/runAutoAssignment", {
      month: month.value,
      // force: true
    });

    if (!resp?.ok) {
      Notify.create({
        type: "negative",
        message: resp?.mensaje || "No se pudo ejecutar la corrida.",
      });
      return;
    }

    Notify.create({ type: "positive", message: "Corrida ejecutada." });
    await loadMonthAssignments();
  } catch (e) {
    Notify.create({ type: "negative", message: "Error ejecutando corrida." });
  } finally {
    runLoading.value = false;
  }
}

async function openHistory(user) {
  historyDlg.value.open = true;
  historyDlg.value.user = user;
  await loadUserHistory(user?._id, true);
}

async function loadUserHistory(userId, intoDialog = false) {
  if (!userId) return;

  // ⚠️ Endpoint backend a crear:
  // GET zonesTeams/getUserHistory?userId=...&months=12
  const resp = await methodsHttp.getApi(
    `zonesTeams/getUserHistory?userId=${userId}&months=12`,
  );

  const arr = resp?.ok ? resp.history || [] : [];
  const mapped = arr.map((x) => ({
    month: x.month,
    monthLabel: monthLabel(x.month),
    zone: x.zone || null,
  }));

  if (intoDialog) historyDlg.value.rows = mapped;
  else historyRows.value = mapped;
}

function getCurrentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function prevMonth(m) {
  const [yy, mm] = m.split("-").map((x) => parseInt(x, 10));
  const d = new Date(yy, mm - 2, 1); // mes anterior
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${mo}`;
}

function buildMonthOptions(count = 12) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const value = `${y}-${m}`;
    out.push({ value, label: monthLabel(value) });
  }
  return out;
}

function monthLabel(value) {
  const [y, m] = value.split("-").map((x) => parseInt(x, 10));
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-DO", { year: "numeric", month: "long" });
}

function openEditAssignment(row) {
  editDlg.value.open = true;
  editDlg.value.row = row;
  editDlg.value.zoneId = row?.zone?._id || null;
}
</script>

<style scoped>
.kpi-card,
.main-card {
  border-radius: 14px;
}

.kpi-mini {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 6px 18px rgba(18, 38, 63, 0.06);
}
.kpi-mini__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.kpi-mini__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(25, 118, 210, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--q-primary);
}
.kpi-mini__label {
  font-weight: 800;
  font-size: 13px;
  color: #263238;
}
.kpi-mini__value {
  font-size: 28px;
  font-weight: 900;
  margin-top: 8px;
  color: #111827;
}

.zone-card {
  border-radius: 14px;
}

.chips-scroll {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.opacity-80 {
  opacity: 0.8;
}
</style>
