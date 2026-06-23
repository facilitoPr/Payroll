<template>
  <div class="bg-white q-pa-md">
    <!-- HEADER -->
    <PageHeaderCard
      title="Ponches del Día"
      subtitle="Revisa tus registros de entrada y salidas por fecha."
      icon="fingerprint"
    >
      <template #actions>
        <!-- Navegación de día -->
        <div class="punch-actions">
          <q-btn
            round
            flat
            icon="chevron_left"
            color="primary"
            class="punch-navBtn"
            @click="changeDay(-1)"
          />

          <!-- Fecha (pill clickeable) -->
          <q-btn
            flat
            no-caps
            class="punch-dateBtn"
            @click="calendarVisible = true"
          >
            <q-icon name="event" color="primary" class="q-mr-sm" />
            <div class="punch-dateText">
              {{ moment(selectedDate).format("dddd, DD MMMM YYYY") }}
            </div>
          </q-btn>

          <q-btn
            round
            flat
            icon="chevron_right"
            color="primary"
            class="punch-navBtn"
            @click="changeDay(1)"
          />

          <q-btn
            outline
            color="primary"
            icon="today"
            label="Hoy"
            class="punch-todayBtn"
            @click="goToday"
          />
        </div>

        <!-- Calendario emergente -->
        <q-dialog v-model="calendarVisible">
          <q-card class="rounded-borders" style="min-width: 320px; max-width: 90vw">
            <div class="bg-primary text-white row items-center justify-between q-pa-sm">
              <div class="row items-center q-gutter-sm">
                <q-icon name="event" />
                <div class="text-subtitle2">Seleccionar fecha</div>
              </div>
              <q-btn flat round dense icon="close" v-close-popup />
            </div>

            <q-separator />

            <q-card-section class="q-pa-sm">
              <q-date
                v-model="selectedDate"
                mask="YYYY-MM-DD"
                :options="disableFutureDates"
                @update:model-value="onDateSelected"
                minimal
                color="primary"
              />
            </q-card-section>
          </q-card>
        </q-dialog>
      </template>
    </PageHeaderCard>

   

    <!-- TABLA -->
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="_id"
      flat
      dense
      bordered
      :rows-per-page-options="[100]"
      class="punch-table"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="dot" style="width: 100px;" :props="props" auto-width>
            <div class="punch-dot" :style="dotStyle(props.row)" />
          </q-td>

          <q-td key="img" :props="props">
            <Imagen :img="props.row?.img" :w="'46px'" class="punch-img" />
          </q-td>

          <q-td key="timestamp" :props="props">
            <div class="text-weight-medium">
              {{ moment(props.row?.timestamp).format("hh:mm:ss A") }}
            </div>
            <div class="text-caption text-grey-7">
              {{ moment(props.row?.timestamp).format("DD/MM/YYYY") }}
            </div>
          </q-td>

          <q-td key="step" :props="props">
            <q-badge
              class="q-px-sm q-py-xs"
              :color="props.row?.punchStep === 'entrada' ? (props.row?.isLate ? 'negative' : 'positive') : 'grey-7'"
              text-color="white"
            >
              {{ (props.row?.punchStep || "").toUpperCase() }}
            </q-badge>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import methodsHttp from "src/api/methodsHttp";
import Imagen from "src/components/utils/Imagen.vue";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import moment from "moment";
import "moment/dist/locale/es";
moment.locale("es");

const rows = ref([]);
const selectedDate = ref(moment().format("YYYY-MM-DD"));
const calendarVisible = ref(false);

const getMyPunchHistory = async () => {
  const resp = await methodsHttp.getApi(
    `punch/getMyPunchHistoryByDate?date=${selectedDate.value}`
  );
  if (resp.ok) rows.value = resp.punch || [];
};

const changeDay = (days) => {
  selectedDate.value = moment(selectedDate.value)
    .add(days, "days")
    .format("YYYY-MM-DD");
  getMyPunchHistory();
};

const goToday = () => {
  selectedDate.value = moment().format("YYYY-MM-DD");
  getMyPunchHistory();
};

const onDateSelected = () => {
  calendarVisible.value = false;
  getMyPunchHistory();
};

const disableFutureDates = (date) => {
  return moment(date).isSameOrBefore(moment(), "day");
};

onMounted(() => {
  getMyPunchHistory();
});

const columns = ref([
  { name: "dot", label: "", align: "left" },
  { name: "img", label: "IMG", align: "left" },
  { name: "timestamp", label: "FECHA Y HORA", align: "left" },
  { name: "step", label: "PASO", align: "left" },
]);

const dotStyle = (p) => {
  const isEntrada = p?.punchStep === "entrada";
  const size = "10px";
  let bg = "#9ca3af"; // gris
  if (isEntrada) bg = p?.isLate ? "#ef4444" : "#22c55e";
  return {
    width: size,
    height: size,
    borderRadius: "50%",
    backgroundColor: bg,
    display: "inline-block",
  };
};
</script>


<style scoped>
.text-h6 {
  text-transform: capitalize;
}

/* Header actions layout */
.punch-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  width: 100%;
}

.punch-navBtn {
  border-radius: 999px;
}

.punch-dateBtn {
  border-radius: 14px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
  min-width: 260px;
  justify-content: center;
}

.punch-dateText {
  font-weight: 700;
  color: var(--q-primary);
  text-transform: capitalize;
}

.punch-todayBtn {
  height: 40px;
  border-radius: 12px;
}

.punch-dot {
  margin-top: 2px;
}

/* Imagen más limpia */
.punch-img :deep(img) {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* Tabla */
.punch-table :deep(.q-table__top) {
  display: none; /* quitamos top de q-table (ya hay header arriba) */
}

/* Mobile: todo centrado y date pill full width */
@media (max-width: 700px) {
  .punch-actions {
    justify-content: center;
  }

  .punch-dateBtn,
  .punch-todayBtn {
    width: 100%;
    max-width: 520px;
  }
}

</style>
