<template>
  <q-page class="q-pa-md">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Entregas</div>
        <div class="text-grey-7">
          Gestiona órdenes listas para despacho, cambia estatus y genera recibo de entrega.
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-input
            outlined
            dense
            debounce="250"
            v-model="filters.search"
            placeholder="Buscar por OT, cliente, dirección…"
            style="min-width: 280px"
          >
            <template #prepend><q-icon name="search" /></template>
            <template #append>
              <q-btn v-if="filters.search" flat dense round icon="close" @click="filters.search = ''" />
            </template>
          </q-input>

          <q-select
            outlined
            dense
            v-model="filters.status"
            :options="statusOptions"
            emit-value
            map-options
            label="Estatus"
            style="min-width: 170px"
          />

          <q-btn unelevated color="primary" icon="refresh" label="Refrescar" @click="fakeRefresh" />
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- KPIs -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="inventory" size="34px" class="text-primary" />
            <div class="col">
              <div class="text-caption text-grey-7">Listas</div>
              <div class="text-h6 text-weight-bold">{{ kpi.ready }}</div>
              <div class="text-caption text-grey-7">por entregar</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="receipt_long" size="34px" class="text-orange" />
            <div class="col">
              <div class="text-caption text-grey-7">Para entrega</div>
              <div class="text-h6 text-weight-bold">{{ kpi.forDelivery }}</div>
              <div class="text-caption text-grey-7">requiere recibo</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="local_shipping" size="34px" class="text-primary" />
            <div class="col">
              <div class="text-caption text-grey-7">En ruta</div>
              <div class="text-h6 text-weight-bold">{{ kpi.onRoute }}</div>
              <div class="text-caption text-grey-7">despachadas</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="check_circle" size="34px" class="text-green" />
            <div class="col">
              <div class="text-caption text-grey-7">Entregadas</div>
              <div class="text-h6 text-weight-bold">{{ kpi.delivered }}</div>
              <div class="text-caption text-grey-7">confirmadas</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- TABLE -->
    <q-card bordered class="bg-white rounded-borders">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Órdenes</div>
          <div class="text-caption text-grey-7">
            Cuando una orden pasa a <b>“Para entrega”</b>, se habilita el <b>recibo</b>.
          </div>
        </div>

        <q-badge outline color="primary">
          {{ filteredRows.length }} visibles
        </q-badge>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <q-table
          flat
          :rows="filteredRows"
          :columns="columns"
          row-key="id"
          :rows-per-page-options="[10, 20, 50]"
          :pagination="{ rowsPerPage: 10 }"
          class="rounded-table"
        >
          <template #body-cell-order="props">
            <q-td :props="props">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-weight-bold">{{ props.row.orderCode }}</div>
                  <div class="text-caption text-grey-7">
                    {{ props.row.customer }} · {{ props.row.phone }}
                  </div>
                </div>

                <q-badge :color="statusColor(props.row.status)">
                  {{ statusLabel(props.row.status) }}
                </q-badge>
              </div>

              <div class="text-caption text-grey-7 q-mt-xs">
                <q-icon name="place" size="16px" class="q-mr-xs" />
                {{ props.row.address }}
              </div>

              <div v-if="props.row.receipt" class="text-caption text-green q-mt-xs">
                <q-icon name="verified" size="16px" class="q-mr-xs" />
                Recibo: {{ props.row.receipt.receiverName }} · {{ props.row.receipt.deliveredAt }}
              </div>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-sm">
                <q-btn
                  dense
                  outline
                  icon="chevron_left"
                  :disable="!canPrevStatus(props.row.status)"
                  @click="prevStatus(props.row.id)"
                >
                  <q-tooltip>Retroceder estatus</q-tooltip>
                </q-btn>

                <q-select
                  dense
                  outlined
                  :model-value="props.row.status"
                  :options="statusFlowOptions"
                  emit-value
                  map-options
                  style="min-width: 220px"
                  @update:model-value="(val) => setStatus(props.row.id, val)"
                />

                <q-btn
                  dense
                  unelevated
                  color="primary"
                  icon="chevron_right"
                  :disable="!canNextStatus(props.row.status)"
                  @click="nextStatus(props.row.id)"
                >
                  <q-tooltip>Avanzar estatus</q-tooltip>
                </q-btn>
              </div>

              <div class="text-caption text-grey-7 q-mt-xs">
                Chofer: <b>{{ props.row.driver }}</b>
                <span class="q-ml-sm">·</span>
                Programada: <b>{{ props.row.scheduledAt }}</b>
              </div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                round
                dense
                icon="map"
                @click="openMap(props.row)"
              >
                <q-tooltip>Ver mapa / cómo llegar</q-tooltip>
              </q-btn>

              <q-btn
                class="q-ml-sm"
                :outline="!isReceiptEnabled(props.row.status)"
                :color="isReceiptEnabled(props.row.status) ? 'primary' : 'grey'"
                :disable="!isReceiptEnabled(props.row.status)"
                icon="receipt_long"
                :label="props.row.receipt ? 'Ver recibo' : 'Recibo'"
                dense
                @click="openReceipt(props.row)"
              />

              <q-btn
                v-if="props.row.status === 'DELIVERED'"
                class="q-ml-sm"
                outline
                color="green"
                icon="visibility"
                label="Detalle"
                dense
                @click="openReceipt(props.row)"
              />
            </q-td>
          </template>

          <template #no-data>
            <div class="q-pa-md text-grey-7">No hay órdenes con esos filtros.</div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- RECEIPT DIALOG -->
    <q-dialog v-model="receiptDlg.open" persistent maximized>
      <q-card class="bg-grey-1">
        <q-card-section class="row items-center justify-between bg-white">
          <div>
            <div class="text-h6 text-weight-bold">
              Recibo de entrega — {{ receiptDlg.order?.orderCode || "" }}
            </div>
            <div class="text-caption text-grey-7">
              Completa los datos de recibo para confirmar la entrega.
            </div>
          </div>
          <q-btn dense flat round icon="close" @click="closeReceipt()" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div v-if="receiptDlg.order" class="row q-col-gutter-md">
            <!-- LEFT: ORDER INFO -->
            <div class="col-12 col-lg-5">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">Datos de la orden</div>
                  <div class="text-caption text-grey-7">Información base .</div>
                </q-card-section>

                <q-separator />

                <q-card-section>
                  <div class="q-gutter-sm">
                    <div class="row items-center justify-between">
                      <div class="text-grey-7">Cliente</div>
                      <div class="text-weight-medium">{{ receiptDlg.order.customer }}</div>
                    </div>

                    <div class="row items-center justify-between">
                      <div class="text-grey-7">Teléfono</div>
                      <div class="text-weight-medium">{{ receiptDlg.order.phone }}</div>
                    </div>

                    <div class="row items-start justify-between">
                      <div class="text-grey-7">Dirección</div>
                      <div class="text-weight-medium" style="max-width: 60%; text-align: right">
                        {{ receiptDlg.order.address }}
                      </div>
                    </div>

                    <div class="row items-center justify-between">
                      <div class="text-grey-7">Estatus</div>
                      <q-badge :color="statusColor(receiptDlg.order.status)">
                        {{ statusLabel(receiptDlg.order.status) }}
                      </q-badge>
                    </div>

                    <div class="row items-center justify-between">
                      <div class="text-grey-7">Chofer</div>
                      <div class="text-weight-medium">{{ receiptDlg.order.driver }}</div>
                    </div>

                    <q-separator class="q-my-sm" />

                    <div class="text-caption text-grey-7 q-mb-xs">Items </div>
                    <q-list bordered class="rounded-borders">
                      <q-item v-for="it in receiptDlg.order.items" :key="it.name">
                        <q-item-section>
                          <q-item-label class="text-weight-medium">{{ it.name }}</q-item-label>
                          <q-item-label caption>{{ it.qty }} unidad</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-badge outline color="primary">{{ it.qty }} u</q-badge>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- RIGHT: RECEIPT FORM -->
            <div class="col-12 col-lg-7">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section class="row items-center justify-between">
                  <div>
                    <div class="text-subtitle1 text-weight-bold">Datos del recibo</div>
                    <div class="text-caption text-grey-7">
                      Requerido para marcar como entregada.
                    </div>
                  </div>

                  <q-badge v-if="receiptDlg.order.receipt" color="green">
                    Ya entregada
                  </q-badge>
                </q-card-section>

                <q-separator />

                <q-card-section class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      outlined
                      dense
                      v-model="receiptDlg.form.receiverName"
                      label="Nombre de quien recibe"
                      :disable="!!receiptDlg.order.receipt"
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-input
                      outlined
                      dense
                      v-model="receiptDlg.form.receiverId"
                      label="Identificación (opcional)"
                      :disable="!!receiptDlg.order.receipt"
                    />
                  </div>

                  <div class="col-12">
                    <q-input
                      outlined
                      type="textarea"
                      autogrow
                      v-model="receiptDlg.form.notes"
                      label="Observaciones (opcional)"
                      :disable="!!receiptDlg.order.receipt"
                    />
                  </div>

                  <div class="col-12">
                    <q-banner class="bg-grey-2 rounded-borders">
                      <div class="text-caption text-grey-7">
                        <b>Firma:</b> si no quieres usar firma, puedes solo marcar “Confirmo recibido”.
                      </div>
                    </q-banner>
                  </div>

                  <div class="col-12">
                    <div class="row items-center justify-between q-mb-sm">
                      <div class="text-weight-medium">Firma</div>
                      <div class="row q-gutter-sm">
                        <q-btn
                          outline
                          icon="delete"
                          label="Limpiar"
                          :disable="!!receiptDlg.order.receipt"
                          @click="clearSignature()"
                        />
                      </div>
                    </div>

                    <q-card bordered flat class="rounded-borders q-pa-sm">
                      <q-signature
                        ref="sigRef"
                        class="bg-white"
                        style="height: 220px; width: 100%"
                        :disable="!!receiptDlg.order.receipt"
                      />
                    </q-card>

                    <div class="text-caption text-grey-7 q-mt-xs">
                      (Opcional) Firma del receptor.
                    </div>
                  </div>

                  <div class="col-12">
                    <q-checkbox
                      v-model="receiptDlg.form.confirmed"
                      label="Confirmo recibido"
                      :disable="!!receiptDlg.order.receipt"
                    />
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="row items-center justify-end q-gutter-sm">
                  <q-btn flat label="Cerrar" @click="closeReceipt()" />

                  <q-btn
                    unelevated
                    color="primary"
                    icon="check"
                    label="Confirmar entrega"
                    :disable="!!receiptDlg.order.receipt"
                    @click="confirmDelivery()"
                  />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <div v-else class="text-grey-7 q-pa-md">
            No hay orden seleccionada.
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

const $q = useQuasar();
const router = useRouter();

type DeliveryStatus = "READY" | "FOR_DELIVERY" | "ON_ROUTE" | "DELIVERED";

type DeliveryRow = {
  id: string;
  orderCode: string;
  customer: string;
  phone: string;
  address: string;
  driver: string;
  scheduledAt: string;
  status: DeliveryStatus;
  items: { name: string; qty: number }[];
  receipt?: {
    receiverName: string;
    receiverId?: string;
    notes?: string;
    deliveredAt: string; // text
    signatureDataUrl?: string;
  };
};

const filters = reactive({
  search: "",
  status: "ALL" as "ALL" | DeliveryStatus,
});

const statusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Lista", value: "READY" },
  { label: "Para entrega", value: "FOR_DELIVERY" },
  { label: "En ruta", value: "ON_ROUTE" },
  { label: "Entregada", value: "DELIVERED" },
];

const statusFlowOptions = [
  { label: "Lista", value: "READY" },
  { label: "Para entrega (Recibo)", value: "FOR_DELIVERY" },
  { label: "En ruta", value: "ON_ROUTE" },
  { label: "Entregada", value: "DELIVERED" },
];

const rows = ref<DeliveryRow[]>([
  {
    id: uid("d"),
    orderCode: "OT-00022",
    customer: "Ana López",
    phone: "809-555-1200",
    address: "Av. Principal #22, Los Prados",
    driver: "Luis",
    scheduledAt: "Hoy 03:00 PM",
    status: "FOR_DELIVERY",
    items: [
      { name: "Mesa M1", qty: 1 },
      { name: "Silla S1", qty: 4 },
    ],
  },
  {
    id: uid("d"),
    orderCode: "OT-00023",
    customer: "Carlos Pérez",
    phone: "829-555-8891",
    address: "Calle 3, Residencial Palma",
    driver: "Luis",
    scheduledAt: "Hoy 05:30 PM",
    status: "READY",
    items: [{ name: "Mesa Pro", qty: 1 }],
  },
  {
    id: uid("d"),
    orderCode: "OT-00020",
    customer: "Laura Jiménez",
    phone: "849-555-7788",
    address: "Zona Industrial, Nave 12",
    driver: "Marcos",
    scheduledAt: "Ayer 04:10 PM",
    status: "DELIVERED",
    items: [{ name: "Silla S1", qty: 6 }],
    receipt: {
      receiverName: "Laura Jiménez",
      receiverId: "001-1234567-8",
      notes: "Entrega sin novedad.",
      deliveredAt: "Ayer 06:15 PM",
    },
  },
]);

const columns = [
  { name: "order", label: "Orden / Cliente", field: "orderCode", align: "left", sortable: true },
  { name: "status", label: "Estatus", field: "status", align: "left", sortable: false },
  { name: "actions", label: "", field: "actions", align: "right", sortable: false },
];

const filteredRows = computed(() => {
  const q = filters.search.trim().toLowerCase();
  const st = filters.status;

  return rows.value.filter((r) => {
    if (st !== "ALL" && r.status !== st) return false;
    if (!q) return true;

    return (
      r.orderCode.toLowerCase().includes(q) ||
      r.customer.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.driver.toLowerCase().includes(q)
    );
  });
});

const kpi = computed(() => {
  const all = rows.value;
  return {
    ready: all.filter((x) => x.status === "READY").length,
    forDelivery: all.filter((x) => x.status === "FOR_DELIVERY").length,
    onRoute: all.filter((x) => x.status === "ON_ROUTE").length,
    delivered: all.filter((x) => x.status === "DELIVERED").length,
  };
});

/** Status helpers */
function statusLabel(s: DeliveryStatus) {
  switch (s) {
    case "READY": return "Lista";
    case "FOR_DELIVERY": return "Para entrega";
    case "ON_ROUTE": return "En ruta";
    case "DELIVERED": return "Entregada";
  }
}
function statusColor(s: DeliveryStatus) {
  switch (s) {
    case "READY": return "grey";
    case "FOR_DELIVERY": return "orange";
    case "ON_ROUTE": return "primary";
    case "DELIVERED": return "green";
  }
}

function isReceiptEnabled(s: DeliveryStatus) {
  // “al estar para entrega” => recibo habilitado.
  return s === "FOR_DELIVERY" || s === "ON_ROUTE" || s === "DELIVERED";
}

function canNextStatus(s: DeliveryStatus) {
  return s !== "DELIVERED";
}
function canPrevStatus(s: DeliveryStatus) {
  return s !== "READY";
}

function setStatus(id: string, status: DeliveryStatus) {
  const r = rows.value.find((x) => x.id === id);
  if (!r) return;

  // Regla simple: no dejar poner "Entregada" sin recibo
  if (status === "DELIVERED" && !r.receipt) {
    $q.notify({
      message: "Para marcar como entregada, completa el recibo primero.",
      color: "orange",
      position: "top",
    });
    return;
  }

  r.status = status;
}

function nextStatus(id: string) {
  const r = rows.value.find((x) => x.id === id);
  if (!r) return;

  const flow: DeliveryStatus[] = ["READY", "FOR_DELIVERY", "ON_ROUTE", "DELIVERED"];
  const idx = flow.indexOf(r.status);
  const next = flow[Math.min(flow.length - 1, idx + 1)];

  if (next === "DELIVERED" && !r.receipt) {
    $q.notify({
      message: "Antes de entregar, genera/llena el recibo.",
      color: "orange",
      position: "top",
    });
    openReceipt(r);
    return;
  }

  r.status = next;
}

function prevStatus(id: string) {
  const r = rows.value.find((x) => x.id === id);
  if (!r) return;

  const flow: DeliveryStatus[] = ["READY", "FOR_DELIVERY", "ON_ROUTE", "DELIVERED"];
  const idx = flow.indexOf(r.status);
  const prev = flow[Math.max(0, idx - 1)];
  r.status = prev;
}

/** Receipt dialog */
const sigRef = ref<any>(null);

const receiptDlg = reactive({
  open: false,
  order: null as DeliveryRow | null,
  form: {
    receiverName: "",
    receiverId: "",
    notes: "",
    confirmed: false,
  },
});

function openReceipt(row: DeliveryRow) {
  receiptDlg.open = true;
  receiptDlg.order = row;

  // Si ya existe recibo, mostramos readonly (form queda como vista)
  if (row.receipt) {
    receiptDlg.form.receiverName = row.receipt.receiverName || "";
    receiptDlg.form.receiverId = row.receipt.receiverId || "";
    receiptDlg.form.notes = row.receipt.notes || "";
    receiptDlg.form.confirmed = true;
  } else {
    receiptDlg.form.receiverName = row.customer || "";
    receiptDlg.form.receiverId = "";
    receiptDlg.form.notes = "";
    receiptDlg.form.confirmed = false;
  }

  // limpiar firma al abrir (si no hay recibo)
  if (!row.receipt) clearSignature();
}

function closeReceipt() {
  receiptDlg.open = false;
  receiptDlg.order = null;
}

function clearSignature() {
  try {
    sigRef.value?.reset?.();
  } catch (e) {}
}

function confirmDelivery() {
  const order = receiptDlg.order;
  if (!order) return;

  if (!receiptDlg.form.receiverName.trim()) {
    $q.notify({ message: "Debes indicar el nombre de quien recibe.", color: "negative", position: "top" });
    return;
  }
  if (!receiptDlg.form.confirmed) {
    $q.notify({ message: "Debes marcar “Confirmo recibido”.", color: "negative", position: "top" });
    return;
  }

  // Intentar capturar firma (opcional)
  let signatureDataUrl: string | undefined;
  try {
    signatureDataUrl = sigRef.value?.save?.();
  } catch (e) {
    signatureDataUrl = undefined;
  }

  order.receipt = {
    receiverName: receiptDlg.form.receiverName.trim(),
    receiverId: receiptDlg.form.receiverId.trim() || undefined,
    notes: receiptDlg.form.notes.trim() || undefined,
    deliveredAt: humanNow(),
    signatureDataUrl,
  };

  order.status = "DELIVERED";

  $q.notify({ message: "Entrega confirmada (simulado).", color: "positive", position: "top" });
  closeReceipt();
}

/** Map */
function openMap(row: DeliveryRow) {
  // Si no tienes la ruta aún, dejamos aviso (igual que hicimos antes).
  // Puedes crear /manufactura/entregas/mapa y pasar query.
  router.push({ path: "/manufactura/entregas/mapa", query: { id: row.id } }).catch(() => {
    $q.notify({
      message: "Ruta de mapa no configurada aún. Ahora creamos esa pantalla.",
      color: "orange",
      position: "top",
    });
  });
}

/** Misc */
function fakeRefresh() {
  $q.notify({ message: "Refrescado (simulado).", color: "primary", position: "top" });
}

function humanNow() {
  const d = new Date();
  return new Intl.DateTimeFormat("es-DO", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
</script>

<style scoped>
.rounded-borders {
  border-radius: 14px;
}
.rounded-table :deep(.q-table__container) {
  border-radius: 14px;
}
</style>
