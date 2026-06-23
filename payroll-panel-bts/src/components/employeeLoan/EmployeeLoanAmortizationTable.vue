<template>
  <q-card v-if="rows.length" flat bordered class="amortization-card">
    <q-card-section>
      <div class="table-title">Tabla de amortización</div>
      <div class="table-subtitle">
        Detalle estimado de los descuentos futuros por nómina.
      </div>
    </q-card-section>

    <q-table
      flat
      bordered
      dense
      :rows="rows"
      :columns="columns"
      row-key="installmentNumber"
      hide-pagination
      :rows-per-page-options="[0]"
    >
      <template #body-cell-dueDate="props">
        <q-td :props="props">
          {{ formatDate(props.row.dueDate) }}
        </q-td>
      </template>

      <template #body-cell-openingBalance="props">
        <q-td :props="props">
          {{ money(props.row.openingBalance) }}
        </q-td>
      </template>

      <template #body-cell-paymentAmount="props">
        <q-td :props="props">
          {{ money(props.row.paymentAmount) }}
        </q-td>
      </template>

      <template #body-cell-principalAmount="props">
        <q-td :props="props">
          {{ money(props.row.principalAmount) }}
        </q-td>
      </template>

      <template #body-cell-interestAmount="props">
        <q-td :props="props">
          {{ money(props.row.interestAmount) }}
        </q-td>
      </template>

      <template #body-cell-closingBalance="props">
        <q-td :props="props">
          {{ money(props.row.closingBalance) }}
        </q-td>
      </template>

      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge rounded :color="statusColor(props.row.status)" text-color="white">
            {{ statusLabel(props.row.status) }}
          </q-badge>
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
import moment from "moment";

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
});

const columns = [
  {
    name: "installmentNumber",
    label: "#",
    align: "center",
    field: "installmentNumber",
  },
  {
    name: "dueDate",
    label: "Fecha",
    align: "left",
    field: "dueDate",
  },
  {
    name: "openingBalance",
    label: "Balance inicial",
    align: "right",
    field: "openingBalance",
  },
  {
    name: "paymentAmount",
    label: "Cuota",
    align: "right",
    field: "paymentAmount",
  },
  {
    name: "principalAmount",
    label: "Capital",
    align: "right",
    field: "principalAmount",
  },
  {
    name: "interestAmount",
    label: "Interés",
    align: "right",
    field: "interestAmount",
  },
  {
    name: "closingBalance",
    label: "Balance final",
    align: "right",
    field: "closingBalance",
  },
  {
    name: "status",
    label: "Estado",
    align: "center",
    field: "status",
  },
];

const money = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "-";
  return moment(value).format("YYYY/MM/DD");
};

const statusLabel = (status) => {
  const map = {
    PENDING: "Pendiente",
    PAID: "Pagada",
    CANCELLED: "Cancelada",
    SKIPPED: "Saltada",
  };

  return map[String(status || "").toUpperCase()] || status || "-";
};

const statusColor = (status) => {
  const map = {
    PENDING: "warning",
    PAID: "positive",
    CANCELLED: "negative",
    SKIPPED: "grey-7",
  };

  return map[String(status || "").toUpperCase()] || "grey-7";
};
</script>

<style scoped>
.amortization-card {
  border-radius: 20px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.table-title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.table-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}
</style>