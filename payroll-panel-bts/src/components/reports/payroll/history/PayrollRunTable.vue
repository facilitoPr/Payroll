<template>
  <q-table
    :rows="rows"
    :columns="columns"
    row-key="_id"
    flat
    dense
    bordered
    :loading="loading"
    hide-pagination
    :rows-per-page-options="[10]"
  >
    <template #body="props">
      <q-tr
        :props="props"
        class="cursor-pointer"
        :class="{
          'bg-grey-2 text-grey-8': hasBankAuth(props.row),
          'opacity-80': hasBankAuth(props.row),
        }"
        @click="emit('open', props.row)"
      >
        <q-td key="period" :props="props">
          <div class="text-weight-medium">
            {{ props.row.periodStart }} → {{ props.row.periodEnd }}
          </div>

          <div class="text-caption text-grey-7">
            Pago: {{ formatDate(props.row.payDate) }}
          </div>

          <!-- opcional: mostrar auth en pequeño -->
          <div v-if="props.row.bankAuthorizationNumber" class="text-caption text-grey-7">
            Auth banco: {{ props.row.bankAuthorizationNumber }}
          </div>
        </q-td>

        <q-td key="status" :props="props">
          <q-badge :color="props.row.status === 'CLOSED' ? 'positive' : 'grey-7'">
            {{ props.row.status || "—" }}
          </q-badge>
        </q-td>

        <q-td key="employees" :props="props" class="text-center">
          {{ Number(props.row.employeeCount || 0) }}
        </q-td>

        <!-- ✅ TOTAL PAGADO -->
        <q-td key="totalPaid" :props="props" class="text-right">
          {{ formatCurrency(props.row?.totals?.netPeriod) }}
        </q-td>

        <!-- ✅ BANCO (check/pendiente) -->
        <q-td key="bank" :props="props" class="text-center">
          <q-icon
            :name="hasBankAuth(props.row) ? 'check_circle' : 'hourglass_empty'"
            :color="hasBankAuth(props.row) ? 'positive' : 'grey-6'"
            size="20px"
          >
            <q-tooltip v-if="hasBankAuth(props.row)">
              Autorización: {{ props.row.bankAuthorizationNumber }}
            </q-tooltip>
            <q-tooltip v-else>
              Sin autorización bancaria
            </q-tooltip>
          </q-icon>
        </q-td>

        <!-- si luego quieres notas, lo reactivas -->
        <!--
        <q-td key="notes" :props="props">
          <span class="text-grey-8">{{ props.row.notes || "—" }}</span>
        </q-td>
        -->
      </q-tr>
    </template>

    <template #no-data>
      <div class="full-width row flex-center q-gutter-sm text-grey-7 q-pa-md">
        <q-icon name="info" />
        <span>No hay cierres de nómina.</span>
      </div>
    </template>
  </q-table>
</template>

<script setup>
import { computed } from "vue";
import moment from "moment";
import { formatCurrency } from "app/utils";

const props = defineProps({
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["open"]);

const columns = computed(() => [
  { name: "period", label: "PERÍODO", align: "left", field: "periodStart" },
  { name: "status", label: "STATUS", align: "left", field: "status" },
  { name: "employees", label: "EMPLEADOS", align: "center", field: "employeeCount" },

  // ✅ más claro que "NETO (PERÍODO)"
  {
    name: "totalPaid",
    label: "TOTAL PAGADO",
    align: "right",
    field: (r) => r?.totals?.netPeriod || 0,
  },

  // ✅ indicador banco
  {
    name: "bank",
    label: "BANCO",
    align: "center",
    field: (r) => r?.bankAuthorizationNumber || "",
  },

  // { name: "notes", label: "NOTAS", align: "left", field: "notes" },
]);

function formatDate(d) {
  if (!d) return "—";
  return moment(d).format("YYYY/MM/DD");
}

function hasBankAuth(row) {
  return !!(row?.bankAuthorizationNumber && String(row.bankAuthorizationNumber).trim());
}
</script>
