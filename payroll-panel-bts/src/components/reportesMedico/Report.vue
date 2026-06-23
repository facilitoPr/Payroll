<template>
  <div>
    <div class="row q-col-gutter-sm">
      <!-- <div>
        <q-input dense outlined v-model="text" />
      </div> -->
      <!-- status -->
      <div class="col-12 col-sm-2">
        <q-select
          v-model="statusSeleted"
          label="Estados"
          option-label="name"
          outlined
          dense
          color="primary"
          :options="status"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <!-- date init -->
      <div class="col-12 col-sm-2">
        <q-input dense outlined v-model="dateInit" label="Desde">
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date v-model="dateInit" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
      <!-- date finish -->
      <div class="col-12 col-sm-2">
        <q-input dense outlined v-model="dateFinish" label="Hasta">
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date v-model="dateFinish" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>

      <!-- boton buscar -->
      <div class="col-12 col-sm-2 col-md-auto">
        <q-btn
          color="primary"
          label="Buscar"
          style="height: 40px; width: 100%"
          icon="search"
          @click="getAllAppointmentByUser"
        />
      </div>

      <!-- boton resetear -->
      <div class="col-12 col-xs-12 col-sm-2 col-md-auto">
        <q-btn
          color="primary"
          label="Limpiar"
          style="height: 40px; width: 100%"
          icon="history"
          @click="clear"
        />
      </div>

      <div class="col-12 col-xs-12 col-sm-2 col-md-auto">
        <q-btn
          color="primary"
          icon-right="archive"
          label="Export to csv"
          style="height: 40px; width: 100%"
          no-caps
          @click="exportTable"
        />
      </div>
    </div>

    <!-- tabla -->
    <div>
      <q-table
        flat
        row-key="name"
        title="CITAS"
        :rows="rows"
        :columns="columns.columnsCitasReport()"
        :bordered="false"
        dense
        :rows-per-page-options="[10000000000]"
        hide-pagination
        :loading="tableLoading"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <!-- <q-td key="name" :props="props">
            <Imagen
              :img="
                props.row.patient?.img
                  ? props.row.patient?.img
                  : 'https://cdn-icons-png.flaticon.com/512/1430/1430453.png'
              "
            />
          </q-td> -->
            <!-- <q-td key="name" :props="props">
              <div v-if="props.row.patients?.name">
                {{ props.row.patients?.name }}
              </div>
              <div class="text-negative" v-else>_</div>
            </q-td> -->
            <q-td
              key="name"
              :props="props"
              class="cursore"
              @click="openModal(props.row)"
            >
              <div v-if="props.row.patients?.name" class="text-primary">
                {{ props.row.patients?.name }}
              </div>
              <div class="text-negative" v-else>_</div>
            </q-td>
            <q-td key="name" :props="props">
              {{
                moment(props.row.date)
                  .locale("es-do")
                  .format("dddd DD MMMM, YYYY")
              }}
            </q-td>
            <q-td key="name" :props="props">
              {{ moment(props.row?.initHour, "HH:mm").format("h:mm A") }}
            </q-td>
            <q-td key="name" :props="props">
              {{ moment(props.row?.finalHour, "HH:mm").format("h:mm A") }}
            </q-td>
            <q-td key="name" :props="props">
              <div v-if="props.row?.description">
                {{ props.row?.description }}
              </div>
              <div class="text-negative" v-else>_</div>
            </q-td>
            <q-td key="name" :props="props">
              <div :class="`status-${props.row?.status?.code}`">
                {{ props.row?.status?.name }}
              </div>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>

    <!-- pagination -->
    <div
      class="col-12 q-mt-sm"
      style="display: flex; align-items: center; justify-content: center"
    >
      <div
        class="col-12 q-mt-sm"
        style="display: flex; align-items: center; justify-content: center"
      >
        <TablePagination
          v-model="initialPagination"
          :orderQuantity="orderQuantity"
          color="light-blue-10"
          active-color="light-blue-5"
          :maxPages="10"
        />

        <q-select class="q-mx-md" v-model="model" :options="options" dense />
      </div>
    </div>

    <!-- modal de informacion de la cita -->
    <q-dialog v-model="dialog" position="right">
      <q-card style="width: 500px; max-width: 90vw; height: 100vh">
        <q-card-section class="row items-center no-wrap">
          <div class="col-12 row justify-between">
            <div class="col-12 q-my-md">
              <b> DATOS DE LA CITA</b>
            </div>

            <div class="col-12 q-my-sm">
              <b style="color: #cdcdcd"> ESTADO*</b>
            </div>

            <div
              class="col-12 q-my-sm"
              :class="`status-${dataInfo?.status?.code}`"
            >
              PENDIENTE
            </div>

            <div class="col-12 q-my-sm">
              <b style="color: #cdcdcd"> Doctor*</b>
            </div>
            <div class="col-12 q-my-sm">Dr. {{ dataInfo?.user?.name }}</div>
            <div class="col-12 q-my-sm">
              <b style="color: #cdcdcd"> Paciente*</b>
            </div>
            <div class="col-12 q-my-sm">{{ dataInfo?.patients?.name }}</div>

            <div class="col-12 q-my-sm">
              <b style="color: #cdcdcd"> Descripcion*</b>
            </div>

            <div class="col-12 q-my-sm">
              {{ dataInfo?.description }}
            </div>
            <div class="col-12 q-my-sm">
              <b style="color: #cdcdcd"> Fecha*</b>
            </div>
            <div class="col-12 q-my-sm">
              {{ moment(dataInfo?.date).format("MM/DD/YYYY") }}
            </div>
            <div class="col-12 q-my-sm">
              <b style="color: #cdcdcd"> Horario*</b>
            </div>
            <div class="col-12 q-my-sm">
              Cita el
              <b style="font-weight: bold">{{
                moment(dataInfo?.date).format("MM/DD/YYYY")
              }}</b>
              de {{ moment(dataInfo?.initHour).format("h:mm A") }} a
              {{ moment(dataInfo?.finalHour).format("h:mm A") }}
            </div>
          </div>

          <q-space />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch, onMounted } from "vue";
import moment from "moment";
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import Imagen from "src/components/utils/Imagen.vue";
import TablePagination from "src/components/table/TablePagination.vue";
import { Loading } from "quasar";
import { exportFile, useQuasar } from "quasar";

const rows = ref([]);
const dataTable = ref([]);

const options = ref([
  15,
  25,
  50,
  100,
  500,
  1000,
  1500,
  2000,
  5000,
  100000,
  "All",
]);

const model = ref(25);
const dialog = ref(false);
const auth = authStore();

const dataInfo = ref({});
const limit = ref(25);
const initial = ref(0);
const orderQuantity = ref(1);
const initialPagination = ref(1);

const status = ref([]);
const statusSeleted = ref(null);

const dateInit = ref(null);
const dateFinish = ref(null);

const text = ref("");

const tableLoading = ref(false);

const columns2 = ref(columns.columnsCitasReport2());

onMounted(async () => {
  getAllAppointmentByUser();
  getStatusAppoiments();
});

watch(model, async (value) => {
  console.log(value);
  limit.value = value;
  getAllAppointmentByUser();
});

const getAllAppointmentByUser = async () => {
  tableLoading.value = true;
  const response = await methodsHttp.getApi(
    `appointment/getAllAppointmentByUser/${auth.userAssociate}/${limit.value}/${
      initial.value
    }/${statusSeleted.value && statusSeleted.value._id}/${
      dateInit.value && dateInit.value
    }/${dateFinish.value && dateFinish.value}`
  );
  if (response.ok) {
    rows.value = response.citas;
    dataTable.value = response.citas;
    console.log(response, "llklk");
    orderQuantity.value = Math.ceil(response.count / limit.value);
  } else {
    rows.value = [];
    dataTable.value = [];
  }
  tableLoading.value = false;
};

const getStatusAppoiments = async () => {
  const response = await methodsHttp.getApi(`appointment/getStatusAppoiments`);
  status.value = response.status;
};

const changePaginationValues = async () => {
  initial.value = 0;
  limit.value = 25;
  initialPagination.value = 1;
  statusSeleted.value = await null;
  dateInit.value = null;
  dateFinish.value = null;
};

const clear = async () => {
  await changePaginationValues();
  await getAllAppointmentByUser();
};

watch(initialPagination, async (value) => {
  initial.value = (await value) * limit.value;
  if (value == 1) {
    initial.value = 0;
    getAllAppointmentByUser();
  } else {
    initial.value = value * limit.value - limit.value;
    getAllAppointmentByUser();
  }
});

function wrapCsvValue(val, row) {
  let formatted = val;

  // Si el valor no existe, devuelve un guion.
  if (formatted === null || formatted === undefined) {
    return `"-"`;
  }

  // Si el valor es un objeto, intenta extraer la propiedad 'name'.
  if (typeof formatted === "object") {
    formatted = formatted.name || "-";
  }

  // Si el valor es una fecha en formato ISO, formatea según el campo.
  if (typeof formatted === "string" && Date.parse(formatted)) {
    if (row && row.date === val) {
      // Formato para el campo 'date': "DD/MM/YYYY".
      formatted = moment(formatted).format("DD/MM/YYYY");
    } else if (row && (row.initHour === val || row.finalHour === val)) {
      // Formato para 'initHour' y 'finalHour': "h:mm A".
      formatted = moment(formatted).format("h:mm A");
    }
  }

  // Asegúrate de que el valor sea una cadena.
  formatted = String(formatted);

  // Escapa las comillas dobles.
  formatted = formatted.split('"').join('""');

  // Devuelve el valor envuelto en comillas dobles.
  return `"${formatted}"`;
}

const exportTable = async () => {
  const content = await [columns2.value.map((col) => wrapCsvValue(col.label))]
    .concat(
      dataTable.value.map((row) =>
        columns2.value.map((col) => wrapCsvValue(row[col.name], row)).join(",")
      )
    )
    .join("\r\n");

  const status = await exportFile("table-export.csv", content, "text/csv");
};

const openModal = (item) => {
  dataInfo.value = item;
  dialog.value = true;
};
</script>