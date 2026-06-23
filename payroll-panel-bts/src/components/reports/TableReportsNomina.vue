<template>
  <div class="q-pa-sm">
    <!-- Resumen arriba -->
    <div
      v-if="resumen.length"
      class="q-mb-sm row items-center justify-between text-caption text-grey-8"
    >
    
    <div class="column">
        <div>
          <q-icon name="schedule" class="q-mr-xs" />
          Total horas trabajadas:
          <span class="text-weight-bold">{{ totalHoras }}</span>
        </div>

          <div>
            <q-icon name="alarm" class="q-mr-xs" />
            Total horas de tardanza:
            <span class="text-weight-bold text-negative">
              {{ totalLateLabel }}
            </span>
  
            <span v-if="diasConTardanza > 0" class="q-ml-sm">
              ({{ diasConTardanza }} día
              {{ diasConTardanza === 1 ? "" : "s" }} con tardanza)
            </span>
          </div>

        
        <!-- BOTÓN AMONESTACIÓN -->
    </div>

      <q-btn
        v-if="puedeAmonestar"
        dense
        outline
        color="negative"
        icon="mail"
        label="Amonestación"
        class="q-ml-sm"
        :disable="!puedeAmonestar"
        @click="enviarAmonestacion"
      />
    </div>

    <q-markup-table
      flat
      bordered
      wrap-cells
      separator="horizontal"
      class="table-zebra"
    >
      <thead class="bg-grey-2 sticky-th">
        <tr>
          <th class="text-left"></th>
          <th class="text-left">FECHA</th>
          <th class="text-left">HORAS TRABAJADAS</th>
          <th class="text-left">PASOS COMPLETOS</th>
        </tr>
      </thead>

      <tbody>
        <tr
          style="cursor: pointer"
          v-for="(r, idx) in resumen"
          :key="idx"
          @click="() => openModal(r)"
        >
          <td
            style="display: flex; justify-content: center; align-items: center"
          >
            <div :style="dotStyle(r)" />
          </td>
          <td class="text-left">{{ r.dateString || fmt(r.date) }}</td>
          <td class="text-left">
            {{ Math.floor(r.minutes / 60) }}h {{ r.minutes % 60 }}m
          </td>
          <td class="text-left">
            <q-badge
              :color="!r.isIncomplete ? 'positive' : 'negative'"
              :label="!r.isIncomplete ? 'Sí' : 'No'"
              outline
            />
          </td>
        </tr>

        <tr v-if="!isLoading && resumen.length === 0">
          <td colspan="4" class="text-center text-grey-7">
            <q-icon name="info" class="q-mr-xs" /> Sin datos en este rango.
          </td>
        </tr>
      </tbody>

      <tfoot v-if="resumen.length">
        <tr class="bg-grey-1">
          <th class="text-left"></th>
          <td class="text-left text-weight-bold">Totales</td>
          <td class="text-left text-weight-bold">{{ totalHoras }}</td>
          <td></td>
        </tr>
      </tfoot>
    </q-markup-table>

    <q-inner-loading :showing="isLoading">
      <q-spinner size="32px" />
    </q-inner-loading>
  </div>
</template>

<script setup>
import { defineProps, onMounted, ref, computed } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
moment.locale("es-do");

const $q = useQuasar();

const props = defineProps({
  item: { type: Object, default: null }, // empleado
  fechaInicio: { type: String, default: null },
  fechaFin: { type: String, default: null },
  department: { type: String, default: null },
  project: { type: String, default: null },
  openModal: { type: Function, default: null },
});

const resumen = ref([]);
const isLoading = ref(false);
const totalEarnings = ref(0);
const totalLateMinutes = ref(0);

const totalHoras = computed(() => {
  const total = resumen.value.reduce((acc, item) => acc + item.minutes, 0);
  return `${Math.floor(total / 60)}h ${total % 60}m`;
});

const totalLateLabel = computed(() => {
  const minutes = totalLateMinutes.value || 0;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
});

// Días con tardanza (asumo que el backend manda lateMinutes por día)
const diasConTardanza = computed(() =>
  resumen.value.filter((r) => (Number(r.isLate) || 0) > 0).length
);

// Habilitar botón: debe haber empleado, minutos de tardanza > 0
const puedeAmonestar = computed(() => {
  return !!props.item?._id && totalLateMinutes.value > 0;
});

const fmt = (d) => (d ? moment(d).format("YYYY/MM/DD") : "-");

onMounted(() => {
  buscarResumen();
});

async function buscarResumen() {
  const body = { fechaInicio: props.fechaInicio };
  if (props.fechaFin) body.fechaFin = props.fechaFin;
  if (props.item?._id) body.userId = props.item._id;
  
   if (props.department) body.departmentId = props.department
   if (props.project) body.projectId = props.project

  isLoading.value = true;
  try {
    const respo = await methodsHttp.postApi(
      `punch/obtenerResumenMensual`,
      body
    );
    if (respo.ok) {
      totalEarnings.value = respo.totalEarnings || 0;
      totalLateMinutes.value = respo.totalLateMinutes || 0;
      resumen.value = Array.isArray(respo.dias) ? respo.dias : [];
    } else {
      resumen.value = [];
      totalLateMinutes.value = 0;
    }
  } finally {
    isLoading.value = false;
  }
}

async function enviarAmonestacion() {
  if (!puedeAmonestar.value) {
    $q.notify({
      type: "warning",
      message: "No hay tardanzas registradas en este período.",
    });
    return;
  }

  try {
    const body = {
      userId: props.item._id,
      fechaInicio: props.fechaInicio,
      fechaFin: props.fechaFin,
      totalLateMinutes: totalLateMinutes.value,
      lateDays: diasConTardanza.value,
    };

    const res = await methodsHttp.postApi(
      "punch/sendLateWarning",
      body
    );

    if (res.ok) {
      $q.notify({
        type: "positive",
        message: "Amonestación enviada correctamente.",
      });
    } else {
      $q.notify({
        type: "negative",
        message:
          res.mensaje ||
          "No se pudo enviar la amonestación. Inténtalo nuevamente.",
      });
    }
  } catch (error) {
    console.error(error);
    $q.notify({
      type: "negative",
      message: "Error al enviar la amonestación.",
    });
  }
}

const dotStyle = (r) => {
  const size = "10px";
  const completed = r?.isIncomplete === false;
  const minutes = Number(r?.minutes) || 0;

  let bg = "#9ca3af"; // gris
  if (completed) {
    bg = minutes >= 470 ? "#22c55e" : "#ef4444"; // verde si 7h50+, rojo si menos
  }

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
.table-zebra tbody tr:nth-child(even) {
  background: #fafafa;
}
.sticky-th th {
  position: sticky;
  top: 0;
  z-index: 1;
}
td,
th {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
