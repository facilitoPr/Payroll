<template>
  <div class="bg-white">
    <div>
      <q-table
        title="Pagos de hoy"
        :rows="rows"
        :columns="columns"
        row-key="name"
        :bordered="false"
        flat
        :rows-per-page-options="[10]"
        dense
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="name" :props="props">
              {{ props.row.nombre }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.department?.name }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.project?.name }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.metodoPago }}
            </q-td>

            <q-td key="name" :props="props">
              <q-badge
                :color="props.row?.yaFuePagadoHoy ? 'green' : 'orange'"
                :label="
                  props.row?.yaFuePagadoHoy ? '✅ Pagado' : '🕒 Pendiente'
                "
                dense
                class="text-subtitle2"
              />
            </q-td>
            <q-td key="actions" :props="props">
              <q-icon
                name="menu"
                color="primary"
                size="25px"
                style="cursor: pointer"
              >
                <q-menu
                  transition-show="flip-right"
                  transition-hide="flip-left"
                >
                  <q-list style="min-width: 100px">
                    <!-- <q-item
                      clickable
                      class="row items-center"
                      @click="openModalPaymentDetail(props.row)"
                    >
                      <div class="col-auto">
                        <q-icon name="list" color="primary" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">DETALLE DE PAGO</div>
                    </q-item> -->

                    <q-item
                      clickable
                      class="row items-center"
                      @click="verDetalle(props.row)"
                      v-if="!props.row?.yaFuePagadoHoy"
                    >
                      <div class="col-auto">
                        <q-icon name="list" color="secondary" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">PAGAR</div>
                    </q-item>
                  </q-list>
                </q-menu></q-icon
              >
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>

    <q-dialog v-model="dialog">
      <q-card style="min-width: 500px; max-width: 600px">
        <q-card-section>
          <div class="text-h6">Detalle de Pago</div>
        </q-card-section>

        <q-separator />

        <q-card-section v-if="loading" class="text-center">
          <q-spinner-dots color="primary" size="40px" />
        </q-card-section>

        <q-card-section v-else-if="pago">
          <div><b>Nombre:</b> {{ pago.empleado.nombre }}</div>
          <div><b>Tipo de Salario:</b> {{ pago.empleado.tipoSalario }}</div>
          <div>
            <b>Frecuencia de Pago:</b> {{ pago.sueldoPeriodo.frecuencia }}
          </div>

          <!-- <q-separator class="q-my-sm" /> -->
          <!-- <div class="text-subtitle2 q-mt-sm">💰 Sueldo Mensual</div> -->
          <!-- <q-list bordered dense>
            <q-item>
              <q-item-section>Sueldo Bruto</q-item-section>
              <q-item-section>{{
                formatCurrency(pago.sueldoMensual.bruto)
              }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Deducciones</q-item-section>
              <q-item-section>{{
                formatCurrency(pago.sueldoMensual.deducciones)
              }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Sueldo Neto</q-item-section>
              <q-item-section>{{
                formatCurrency(pago.sueldoMensual.neto)
              }}</q-item-section>
            </q-item>
          </q-list> -->

          <q-separator class="q-my-sm" />
          <div class="text-subtitle2 q-mt-sm">📆 Sueldo por Periodo</div>
          <q-list bordered dense>
            <q-item v-for="([k, v], i) in sueldoPeriodoSinFrecuencia" :key="i">
              <q-item-section>{{ k }}</q-item-section>
              <q-item-section>{{ formatCurrency(v) }}</q-item-section>
            </q-item>
          </q-list>

          <q-separator class="q-my-sm" />
          <div class="text-subtitle2 q-mt-sm">📉 Deducciones</div>
          <q-list bordered dense>
            <q-item v-for="(d, i) in pago.detalleDeducciones" :key="i">
              <q-item-section> {{ d.nombre }} ({{ d.modo }}) </q-item-section>
              <q-item-section side>
                {{ formatCurrency(d.montoPeriodo) }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator class="q-my-sm" />

        <q-card-section>
          <div>
            <label>
              <b> <b class="text-negative">* </b> CANTIDAD A DESCONTAR </b>
            </label>
            <q-input
              outlined
              dense
              type="number"
              v-model="form.descuentoManual"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="pagar"
            color="secondary"
            v-close-popup
            @click="pagarSueldo"
          />
          <q-btn flat label="Cerrar" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <NotificationsVue ref="notify" />

    <!-- <PaymentDetails ref="paymentDetails" /> -->
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";


// import PaymentDetails from "./PaymentDetails.vue";

const paymentDetails = ref(null);

const rows = ref([]);
const dialog = ref(false);
const loading = ref(false);
const pago = ref(null);
const notify = ref(null);


const form = ref({
  employeeId: "",
  descuentoManual: 0,
});

onMounted(() => {
  getEmployeesWithPayToday();
});

const sueldoPeriodoSinFrecuencia = computed(() => {
  if (!pago.value?.sueldoPeriodo) return [];
  const { frecuencia, ...resto } = pago.value.sueldoPeriodo;
  return Object.entries(resto);
});

function formatCurrency(val) {
  return val?.toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
  });
}

async function verDetalle(item) {
  dialog.value = true;
  loading.value = true;

  form.value.employeeId = item._id;

  const resp = await methodsHttp.getApi(
    `employee-payment-management/getEmployeePaymentSummary/${item._id}`
  );
  if (resp.ok) {
    const { ...data } = resp;

    pago.value = data;
  }
  loading.value = false;
}

const getEmployeesWithPayToday = async () => {
  let resp =
    await methodsHttp.getApi(`employee-payment-management/getEmployeesWithPayToday
`);
  if (resp.ok) {
    rows.value = resp.empleados;
    // console.log(resp.empleados);
  }
};

const columns = ref([
  { name: "name", label: "NOMBRE", align: "center" },
  { name: "name", label: "DEPARTAMENTO", align: "center" },
  { name: "name", label: "PROYECTO", align: "center" },
  { name: "name", label: "METODO DE PAGO", align: "center" },
  { name: "name", label: "PAGO REALIZADO", align: "center" },

  { name: "actions", label: "ACTIONS", align: "center" },
]);

const openModalPaymentDetail = (item) => {
  console.log(item);
  paymentDetails.value?.verDetalle(item);
};

const pagarSueldo = async () => {
  loading.value = true;
  const resp = await methodsHttp.postApi(
    `employee-payment-management/registerEmployeePayment`,
    form.value
  );

  if (resp.ok) {
    notify.value?.showNotifyGood(resp.mensaje);

    getEmployeesWithPayToday();
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
};
</script>