<template>
  <div class="bg-white q-pa-md">
    <PageHeaderCard
      title="Reporte de producción"
      subtitle="Filtra por operadora, zona, rango y checkmarks. Exporta o imprime."
      icon="analytics"
    >
      <template #actions>
        <!-- Operadoras -->
        <q-select
          v-model="operatorSelected"
          label="Operadoras"
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
          class="header-field header-field--wide"
        >
          <template #prepend>
            <q-icon name="support_agent" color="primary" />
          </template>

          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">No results</q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Zona -->
        <q-select
          v-model="zoneSelected"
          label="Centro preventivo"
          option-label="name"
          option-value="_id"
          outlined
          dense
          color="primary"
          :options="zones"
          clearable
          emit-value
          map-options
          class="header-field"
        >
          <template #prepend>
            <q-icon name="place" color="primary" />
          </template>

          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">No results</q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Fecha inicio -->
        <q-input
          outlined
          dense
          v-model="dateFormatted"
          class="header-field"
          label="Fecha inicio"
        >
          <template #prepend>
            <q-icon
              name="schedule"
              class="cursor-pointer"
              @click="date = moment().format('YYYY-MM-DD')"
            />
          </template>

          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date minimal v-model="date" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Cerrar" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <!-- Fecha fin -->
        <q-input
          outlined
          dense
          v-model="endDateFormatted"
          class="header-field"
          label="Fecha fin (opcional)"
          clearable
          @clear="endDate = null"
        >
          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date minimal v-model="endDate" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Cerrar" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <!-- Checkmarks -->
        <q-select
          v-model="marksSelected"
          label="Checkmarks (varios)"
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
          class="header-field header-field--wide"
        >
          <template #prepend>
            <q-icon name="task_alt" color="primary" />
          </template>

          <template #selected-item="scope">
            <q-chip
              dense
              :color="scope.opt.color"
              text-color="white"
              class="q-mr-xs"
            >
              <q-icon :name="scope.opt.icon" size="14px" class="q-mr-xs" />
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
          :loading="loadingAppointments"
          @click="getReminders()"
        />

        <q-btn
          color="primary"
          outline
          icon="more_vert"
          label="Acciones"
          class="header-btn"
          :loading="loading"
        >
          <q-menu>
            <q-list style="min-width: 220px">
              <q-item clickable v-close-popup @click="buscarYExportar()">
                <q-item-section avatar>
                  <q-icon name="table_view" />
                </q-item-section>
                <q-item-section>Buscar y Exportar Excel</q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="buscarImprimir()">
                <q-item-section avatar>
                  <q-icon name="print" />
                </q-item-section>
                <q-item-section>Buscar e Imprimir</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </template>
    </PageHeaderCard>

    <div class="q-my-md">
      <q-separator />
    </div>

    <CreateStoreModal
      :openModal="openModal"
      @update:openModal="openModal = $event"
      :operators="operators"
    />

    <div
      class="row q-col-gutter-md column items-center justify-center"
      v-if="appointments?.length > 0"
    >
      <div
        v-for="(item, index) in appointments"
        :key="item?.user?._id || index"
        class="col-11"
      >
        <TableReportOperator
          :item="item.user"
          :rows="item.reminders"
          :date="date"
          :endDate="endDate"
          :zoneSelected="zoneSelected?._id"
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

    <!-- <ExportExceOperator /> -->
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";

import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import "moment/dist/locale/es"; // Importa el locale español (a veces necesario en Vite)
moment.locale("es-do");
import CreateStoreModal from "../components/reports/CreateReportsModal.vue";
import { Notify } from "quasar";
import { authStore } from "src/stores/auth-store";
import TableReportOperator from "src/components/reports/TableReportOperator.vue";
import { MARKS } from "src/data/appointmentMarks";
import PageHeaderCard from "src/components/PageHeaderCard.vue";

const auth = authStore();

const loading = ref(false);

const loadingAppointments = ref(false);
const date = ref(moment().format("YYYY-MM-DD"));
const endDate = ref(null);
const rows = ref([]);
const operators = ref([]);

const appointments = ref([]);

const operatorSelected = ref([]);
const zones = ref([]);
const zoneSelected = ref(null);
const openModal = ref(false);

const selectedUsersParam = computed(() => {
  const ids = (operatorSelected.value || []).filter(Boolean);
  return ids.length ? ids.join(",") : "null";
});

const marksSelected = ref([]);

const dateFormatted = ref(moment(date.value).format("LL"));
const endDateFormatted = ref(endDate.value ? moment(endDate.value).format("LL") : "");

watch(date, (v) => {
  dateFormatted.value = v ? moment(v).format("LL") : "";
});

watch(endDate, (v) => {
  endDateFormatted.value = v ? moment(v).format("LL") : "";
});

onMounted(() => {
  getReminders();
  getOperators();
  getZonesActived();
});

const getReminders = async () => {
  rows.value = [];
  loadingAppointments.value = true;
  if (operatorSelected?.value) {
    const resp = await methodsHttp.postApi(
      `reminders/getRemindersByOperatorAndDay?users=${selectedUsersParam.value}`,
      {
        date: moment(date.value).format("YYYY/MM/DD"),
        endDate: endDate.value
          ? moment(endDate.value).format("YYYY/MM/DD")
          : undefined,
        zone: zoneSelected?.value?._id,
        marks: marksSelected.value?.length ? marksSelected.value : undefined, // ✅ nuevo filtro
      }
    );

    if (resp.ok) {
      appointments.value = resp.users;
    }
  }
  loadingAppointments.value = false;
};

const getOperators = async () => {
  try {
    const resp = await methodsHttp.getApi(`user/getEmployees?isActived=true`);

    if (resp.ok) {
      operators.value = [{ _id: null, name: "Todos" }, ...resp.employees];
      // operatorSelected.value = resp.operadoras[0];
      // console.log(resp.operadoras);
    }
  } catch (error) {
    console.log(error);
  }
};

const getZonesActived = async () => {
  const resp = await methodsHttp.getApi(`zones/getZonesActived`);

  if (resp.ok) {
    zones.value = resp.zones;
  }
};

const buscarYExportar = async () => {
  if (!date.value) {
    return Notify.create({
      type: "warning",
      message: "Debes seleccionar una fecha de inicio",
    });
  }

  loading.value = true;

  try {
    //   // Usamos methodsHttp con configuración manual para recibir blob
    const response = await methodsHttp.postApi2(
      "reminders/getRemindersGroupedByOperator",
      {
        startDate: date.value.replace(/-/g, "/"),
        endDate: endDate.value ? endDate.value.replace(/-/g, "/") : undefined,
        zone: zoneSelected?.value?._id,
        operadora: operatorSelected?.value?._id
          ? operatorSelected?.value?._id
          : null,
      },
      {
        responseType: "blob",
      }
    );
    // Crear el archivo descargable
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

const buscarImprimir = async () => {
  const data = {
    data: appointments.value,
    date: date.value,
    endDate: endDate.value,
    zone: zoneSelected.value ? zoneSelected.value?._id : null,
  };
  auth.addReportPrint(data);
  goToPage();
};

const goToPage = (url) => {
  window.open(`${window.location.origin}/reportPrint`, "_blank");
};
</script>

<style>
.header-field {
  min-width: 190px;
}

.header-field--wide {
  min-width: 280px;
}

.header-btn {
  height: 40px;
  border-radius: 10px;
}
</style>
