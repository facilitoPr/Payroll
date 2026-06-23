<template>
  <q-dialog v-model="open" persistent maximized>
    <q-card class="bg-grey-1">
      <!-- HEADER -->
      <q-card-section
        class="row items-center justify-between bg-primary q-py-sm"
      >
        <div>
          <div class="text-h6 text-weight-bold text-white">
            Producción - Citas
          </div>
          <div class="text-caption text-white">
            Filtra por operadoras, zona, rango de fechas y checkmarks.
          </div>
        </div>

        <div class="row items-center q-gutter-sm">
          <q-btn
            flat
            dense
            icon="refresh"
            label="Limpiar"
            @click="reset()"
            color="white"
          />
          <q-btn flat dense icon="close" round @click="close()" color="white" />
        </div>
      </q-card-section>

      <q-separator />

      <!-- FILTROS -->
      <q-card-section class="q-pa-md bg-white">
        <div class="row q-col-gutter-sm">
          <div
            class="col-12 col-sm-4 col-md-3"
            v-if="auth.user.rol.code != 'EMPLOYEE' || auth.user.isManager"
          >
            <q-select
              v-model="operatorSelected"
              label="OPERADORAS"
              option-label="name"
              option-value="_id"
              outlined
              dense
              color="primary"
              :options="operators"
              multiple
              use-chips
              emit-value
              map-options
              clearable
            />
          </div>

          <div class="col-12 col-sm-4 col-md-3">
            <q-select
              v-model="zoneSelected"
              label="CENTRO PREVENTIVO"
              option-label="name"
              option-value="_id"
              outlined
              dense
              color="primary"
              :options="zones"
              clearable
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-sm-2 col-md-2">
            <q-input
              v-model="date"
              label="Fecha inicio"
              type="date"
              outlined
              dense
            />
          </div>

          <div class="col-12 col-sm-2 col-md-2">
            <q-input
              v-model="endDate"
              label="Fecha fin (opcional)"
              type="date"
              outlined
              dense
            />
          </div>

          <div class="col-12 col-md-10">
            <q-select
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
            >
              <template #selected-item="scope">
                <q-chip
                  dense
                  :color="scope.opt.color"
                  text-color="white"
                  class="q-mr-xs"
                >
                  <q-icon :name="scope.opt.icon" size="16px" class="q-mr-xs" />
                  {{ scope.opt.label }}
                </q-chip>
              </template>
            </q-select>
          </div>

          <!-- ACCIONES -->
          <div class="col-12 col-md-2">
            <q-btn
              color="primary"
              icon="search"
              label="Buscar"
              class="full-width"
              style="height: 40px"
              :loading="loading"
              @click="buscar()"
            />
          </div>

          <div
            class="col-12"
            v-if="auth.user.rol.code != 'EMPLOYEE' || auth.user.isManager"
          >
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-auto">
                <q-btn
                  outline
                  color="primary"
                  icon="table_view"
                  label="Exportar Excel"
                  :loading="loading"
                  @click="exportarExcel()"
                />
              </div>

              <div class="col-12 col-sm-auto">
                <q-btn
                  outline
                  color="primary"
                  icon="print"
                  label="Imprimir"
                  :loading="loading"
                  @click="imprimir()"
                />
              </div>
            </div>
          </div>

          <!-- RESUMEN (KPIs) -->
          <div class="col-12 q-mt-xs">
            <div class="row q-col-gutter-sm items-stretch">
              <!-- Operadoras -->
              <div
                class="col-12 col-sm-4"
                v-if="auth.user.rol.code != 'EMPLOYEE' || auth.user.isManager"
              >
                <q-card flat bordered class="summary-card">
                  <q-card-section class="row items-center no-wrap q-pa-sm">
                    <q-avatar
                      size="38px"
                      class="summary-icon bg-primary text-white"
                    >
                      <q-icon name="support_agent" />
                    </q-avatar>

                    <div class="q-ml-sm">
                      <div class="text-caption text-grey-7">Operadoras</div>
                      <div class="text-h6 text-weight-bold summary-value">
                        <q-skeleton
                          v-if="loadingAppointments"
                          type="text"
                          width="44px"
                        />
                        <template v-else>{{
                          appointments?.length || 0
                        }}</template>
                      </div>
                    </div>

                    <q-space />

                    <q-badge
                      v-if="(operatorSelected?.length || 0) > 0"
                      color="primary"
                      outline
                      class="q-ml-sm"
                    >
                      {{ operatorSelected.length }} sel.
                    </q-badge>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Total citas -->
              <div class="col-12 col-sm-4">
                <q-card flat bordered class="summary-card">
                  <q-card-section class="row items-center no-wrap q-pa-sm">
                    <q-avatar
                      size="38px"
                      class="summary-icon bg-teal text-white"
                    >
                      <q-icon name="event_note" />
                    </q-avatar>

                    <div class="q-ml-sm">
                      <div class="text-caption text-grey-7">Total citas</div>
                      <div class="text-h6 text-weight-bold summary-value">
                        <q-skeleton
                          v-if="loadingAppointments"
                          type="text"
                          width="64px"
                        />
                        <template v-else>{{ totalAppointments || 0 }}</template>
                      </div>
                    </div>

                    <q-space />

                    <q-chip
                      v-if="date"
                      dense
                      outline
                      color="teal"
                      class="q-ml-sm"
                      :title="
                        endDate
                          ? `Rango: ${date} → ${endDate}`
                          : `Fecha: ${date}`
                      "
                    >
                      <q-icon name="calendar_month" class="q-mr-xs" />
                      <span v-if="endDate">{{ date }} → {{ endDate }}</span>
                      <span v-else>{{ date }}</span>
                    </q-chip>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Promedio -->
              <div
                class="col-12 col-sm-4"
                v-if="auth.user.rol.code != 'EMPLOYEE' || auth.user.isManager"
              >
                <q-card flat bordered class="summary-card">
                  <q-card-section class="row items-center no-wrap q-pa-sm">
                    <q-avatar
                      size="38px"
                      class="summary-icon bg-indigo text-white"
                    >
                      <q-icon name="insights" />
                    </q-avatar>

                    <div class="q-ml-sm">
                      <div class="text-caption text-grey-7">
                        Promedio / Operadora
                      </div>
                      <div class="text-h6 text-weight-bold summary-value">
                        <q-skeleton
                          v-if="loadingAppointments"
                          type="text"
                          width="52px"
                        />
                        <template v-else>{{ avgPerOperator }}</template>
                      </div>
                    </div>

                    <q-space />

                    <q-badge
                      v-if="zoneSelected"
                      color="indigo"
                      outline
                      class="q-ml-sm"
                    >
                      Zona
                    </q-badge>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <!-- Chips por operadora (horizontal scroll) -->
          <div
            v-if="
              !loadingAppointments &&
              operatorChips.length &&
              appointments.length > 1
            "
            class="col-12 q-mt-sm"
          >
            <q-card flat bordered class="rounded-borders bg-white q-pa-xs">
              <div class="text-caption text-grey-7 q-px-sm q-pt-xs">
                Distribución por operadora
              </div>

              <q-scroll-area horizontal style="height: 54px">
                <div
                  class="row no-wrap items-center q-gutter-xs q-px-sm q-py-xs"
                >
                  <q-chip
                    v-for="chip in operatorChips"
                    :key="chip.id"
                    square
                    clickable
                    outline
                    color="primary"
                    :title="`${chip.name} — ${chip.count} citas`"
                    class="q-mr-xs"
                  >
                    <q-avatar size="18px" color="primary" text-color="white">
                      {{ (chip.name || "?").substring(0, 1).toUpperCase() }}
                    </q-avatar>
                    <div class="q-ml-xs">
                      <span class="text-weight-medium">{{ chip.name }}</span>
                      <span class="text-grey-7"> · {{ chip.count }}</span>
                    </div>
                  </q-chip>
                </div>
              </q-scroll-area>
            </q-card>
          </div>

          <!-- Chips por zona (horizontal scroll) -->
          <div
            v-if="
              !loadingAppointments &&
              zoneChips.length &&
              appointments.length > 1
            "
            class="col-12 q-mt-sm"
          >
            <q-card flat bordered class="rounded-borders bg-white q-pa-xs">
              <div class="text-caption text-grey-7 q-px-sm q-pt-xs">
                Distribución por zona
              </div>

              <q-scroll-area horizontal style="height: 54px">
                <div
                  class="row no-wrap items-center q-gutter-xs q-px-sm q-py-xs"
                >
                  <q-chip
                    v-for="chip in zoneChips"
                    :key="chip.id"
                    square
                    clickable
                    outline
                    color="secondary"
                    :title="`${chip.name} — ${chip.count} citas`"
                    class="q-mr-xs"
                  >
                    <q-avatar size="18px" color="secondary" text-color="white">
                      {{ (chip.name || "?").substring(0, 1).toUpperCase() }}
                    </q-avatar>
                    <div class="q-ml-xs">
                      <span class="text-weight-medium">{{ chip.name }}</span>
                      <span class="text-grey-7"> · {{ chip.count }}</span>
                    </div>
                  </q-chip>
                </div>
              </q-scroll-area>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- RESULTADOS -->
      <q-card-section class="q-pa-md">
        <div
          class="row q-col-gutter-md column items-center justify-center"
          v-if="appointments?.length > 0"
        >
          <div
            v-for="(item, index) in appointments"
            :key="item?.user?._id || index"
            class="col-12"
          >
            <TableReportOperator
              :item="item.user"
              :rows="item.reminders"
              :date="date"
              :endDate="endDate"
              :zoneSelected="zoneSelected"
              :getReminders="buscar"
            />
          </div>
        </div>

        <div v-else class="column items-center justify-center q-my-xl">
          <q-icon name="event_busy" size="64px" color="grey-5" />
          <div class="text-subtitle1 text-grey-7 q-mt-sm">
            No hay citas para el rango seleccionado
          </div>
          <div class="text-caption text-grey-6">
            Ajusta filtros o cambia el rango de fechas
          </div>
        </div>

        <q-inner-loading
          :showing="loadingAppointments"
          label="Cargando citas..."
          label-class="text-primary"
          label-style="font-size: 1.05em"
          color="primary"
        />
      </q-card-section>
    </q-card>

    <NotificationsVue ref="notify" />
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import "moment/dist/locale/es";
import { Notify } from "quasar";
import { authStore } from "src/stores/auth-store";
import TableReportOperator from "src/components/reports/TableReportOperator.vue";
import NotificationsVue from "src/components/utils/Notifications.vue";
import { MARKS } from "src/data/appointmentMarks";

moment.locale("es-do");

const auth = authStore();
const notify = ref(null);

const props = defineProps({
  openModal: { type: Boolean, default: false },
  operators: { type: Array, default: () => [] },
  zones: { type: Array, default: () => [] },
  date: { type: String, default: moment().format("YYYY-MM-DD") },
  endDate: { type: String, default: null },
});

const emit = defineEmits(["update:openModal"]);

const open = computed({
  get: () => props.openModal,
  set: (v) => emit("update:openModal", v),
});

const loading = ref(false);
const loadingAppointments = ref(false);

const date = ref(props.date);
const endDate = ref(props.endDate);

const operatorSelected = ref([]);
const zoneSelected = ref(null);
const marksSelected = ref([]);

const appointments = ref([]);
const appointmentsZone = ref([]);
const totalAppointments = ref(0);

const avgPerOperator = computed(() => {
  const ops = appointments?.value?.length || 0;
  if (!ops) return 0;
  return Math.round(totalAppointments.value / ops);
});

const operatorChips = computed(() => {
  if (!appointments?.value?.length) return [];
  return appointments.value
    .map((it) => ({
      id: it?.user?._id || Math.random().toString(36).slice(2),
      name: it?.user?.name || "Operadora",
      count: it?.reminders?.length || 0,
    }))
    .sort((a, b) => b.count - a.count); // opcional: ordenar por mayor cantidad
});

const zoneChips = computed(() => {
  if (!appointmentsZone?.value?.length) return [];
  return appointmentsZone.value
    .map((it) => ({
      id: it?.zoneId || Math.random().toString(36).slice(2),
      name: it?.zoneName || "Zona",
      count: it?.count || 0,
    }))
    .sort((a, b) => b.count - a.count); // opcional: ordenar por mayor cantidad
});

watch(open, (newValue) => {
  if (newValue) {
    date.value = props.date
    endDate.value = props.endDate
    buscar();
  } 
});

const selectedUsersParam = computed(() => {
  const ids = (operatorSelected.value || []).filter(Boolean);
  return ids.length ? ids.join(",") : "null";
});

const toYMDSlash = (v) => {
  const s = String(v || "").trim();
  if (!s) return "";
  const parts = s.includes("/") ? s.split("/") : s.split("-");
  if (parts.length !== 3) return "";
  const [yy, mmRaw, ddRaw] = parts;
  const mm = String(mmRaw).padStart(2, "0");
  const dd = String(ddRaw).padStart(2, "0");
  return `${yy}/${mm}/${dd}`;
};

const getDatePayload = () => {
  const start = toYMDSlash(date.value);
  const end = endDate.value ? toYMDSlash(endDate.value) : "";

  if (!start) {
    return { ok: false, msg: "Debes seleccionar una fecha de inicio" };
  }

  // Comparación segura porque es YYYY/MM/DD
  if (end && end < start) {
    return { ok: false, msg: "La fecha fin no puede ser menor que la fecha inicio" };
  }

  return { ok: true, start, end, hasEnd: !!end };
};

const buscar = async () => {
  const dp = getDatePayload();
  if (!dp.ok) {
    return Notify.create({ type: "warning", message: dp.msg });
  }

  loadingAppointments.value = true;

  try {
    const resp = await methodsHttp.postApi(
      `reminders/getRemindersByOperatorAndDay?users=${selectedUsersParam.value}`,
      {
        // ✅ manda ambos (compatibilidad)
        dateFrom: dp.start,  // estándar

        // ✅ solo manda endDate si existe
        endDate: dp.hasEnd ? dp.end : undefined,

        zone: zoneSelected?.value?._id || zoneSelected.value || null,
        marks: marksSelected.value?.length ? marksSelected.value : undefined,
      }
    );

    if (resp?.ok) {
      appointments.value = resp.users || [];
      totalAppointments.value = resp.total || 0;
      appointmentsZone.value = resp.zonesSummary || [];
    } else {
      appointments.value = [];
      totalAppointments.value = 0;
      appointmentsZone.value = [];
      notify.value?.showNotifyBad(resp?.mensaje || "Error al buscar");
    }
  } catch (e) {
    appointments.value = [];
    notify.value?.showNotifyBad("Error al buscar citas");
    console.error(e);
  } finally {
    loadingAppointments.value = false;
  }
};


const exportarExcel = async () => {
  const dp = getDatePayload();
  if (!dp.ok) {
    return Notify.create({ type: "warning", message: dp.msg });
  }

  loading.value = true;
  try {
    const response = await methodsHttp.postApi2(
      "reminders/getRemindersGroupedByOperator",
      {
        startDate: dp.start,
        endDate: dp.hasEnd ? dp.end : undefined,
        zone: zoneSelected?.value?._id || zoneSelected.value || null,
        operadora: operatorSelected.value?.length ? operatorSelected.value : null,
        marks: marksSelected.value?.length ? marksSelected.value : undefined,
      },
      { responseType: "blob" }
    );

    const blob = new Blob([response], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "reporte-citas.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error(error);
    Notify.create({ type: "negative", message: "Error al generar el Excel" });
  } finally {
    loading.value = false;
  }
};


const imprimir = async () => {
  const data = {
    data: appointments.value,
    date: date.value,
    endDate: endDate.value,
    zone: zoneSelected.value
      ? zoneSelected.value?._id || zoneSelected.value
      : null,
    marks: marksSelected.value || [],
    operatorSelected: operatorSelected.value || [],
  };

  auth.addReportPrint(data);
  window.open(`${window.location.origin}/reportPrint`, "_blank");
};

const reset = () => {
  operatorSelected.value = [];
  zoneSelected.value = null;
  marksSelected.value = [];
  date.value = moment().format("YYYY-MM-DD");
  endDate.value = null;
  appointments.value = [];
};

const close = () => {
  open.value = false;
};


</script>

<style>
.summary-card {
  border-radius: 14px;
  background: #fff;
}

.summary-icon {
  border-radius: 12px;
}

.summary-value {
  line-height: 1.1;
}
</style>
