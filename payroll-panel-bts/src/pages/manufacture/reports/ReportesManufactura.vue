<template>
  <q-page class="q-pa-md">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Reportes — Manufactura</div>
        <div class="text-grey-7">
          Vista consolidada de órdenes, producción, compras, inventario, facturas y entregas (simulado).
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-btn outline icon="event" label="Rango de fechas" @click="dateDlg = true" />
          <q-btn flat icon="filter_alt" label="Limpiar filtros" @click="resetFilters()" />
          <q-btn unelevated color="primary" icon="download" label="Exportar " @click="fakeExport()" />
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- FILTER BAR -->
    <q-card bordered class="bg-white rounded-borders q-mb-md">
      <q-card-section class="row q-col-gutter-md items-center">
        <div class="col-12 col-md-3">
          <q-input
            outlined
            dense
            v-model="filters.search"
            debounce="250"
            label="Buscar"
            placeholder="Código, cliente, producto, SKU…"
          >
            <template #prepend><q-icon name="search" /></template>
            <template #append>
              <q-btn v-if="filters.search" flat dense round icon="close" @click="filters.search = ''" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-md-3">
          <q-select
            outlined
            dense
            v-model="filters.status"
            :options="statusOptions"
            emit-value
            map-options
            label="Estatus (Órdenes)"
          />
        </div>

        <div class="col-12 col-md-3">
          <q-select
            outlined
            dense
            v-model="filters.area"
            :options="areaOptions"
            emit-value
            map-options
            label="Área"
          />
        </div>

        <div class="col-12 col-md-3">
          <q-banner class="bg-grey-2 rounded-borders">
            <div class="text-caption text-grey-7">
              Rango:
              <b>{{ filters.dateFrom || "—" }}</b> →
              <b>{{ filters.dateTo || "—" }}</b>
            </div>
          </q-banner>
        </div>
      </q-card-section>
    </q-card>

    <!-- KPI ROW -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="assignment" size="34px" class="text-primary" />
            <div class="col">
              <div class="text-caption text-grey-7">Órdenes</div>
              <div class="text-h6 text-weight-bold">{{ kpi.ordersTotal }}</div>
              <div class="text-caption text-grey-7">en el rango</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="build_circle" size="34px" class="text-orange" />
            <div class="col">
              <div class="text-caption text-grey-7">En proceso</div>
              <div class="text-h6 text-weight-bold">{{ kpi.inProgress }}</div>
              <div class="text-caption text-grey-7">fabricación / ensamblaje</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="local_shipping" size="34px" class="text-primary" />
            <div class="col">
              <div class="text-caption text-grey-7">Listas para entrega</div>
              <div class="text-h6 text-weight-bold">{{ kpi.readyDelivery }}</div>
              <div class="text-caption text-grey-7">pendientes de despacho</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="payments" size="34px" class="text-green" />
            <div class="col">
              <div class="text-caption text-grey-7">Facturado</div>
              <div class="text-h6 text-weight-bold">{{ money(kpi.invoicedAmount) }}</div>
              <div class="text-caption text-grey-7">monto total </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- SECOND ROW: QUICK INSIGHTS -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-lg-4">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Distribución de estatus</div>
              <div class="text-caption text-grey-7">Órdenes por estado (rango)</div>
            </div>
            <q-icon name="donut_large" class="text-primary" />
          </q-card-section>

          <q-separator />

          <q-card-section class="q-gutter-sm">
            <div v-for="s in statusBreakdown" :key="s.key">
              <div class="row items-center justify-between">
                <div class="text-weight-medium">{{ s.label }}</div>
                <div class="text-caption text-grey-7">
                  {{ s.count }} · {{ pct(s.count, kpi.ordersTotal) }}
                </div>
              </div>
              <q-linear-progress :value="ratio(s.count, kpi.ordersTotal)" rounded style="height: 10px" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-4">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Materiales (compras)</div>
              <div class="text-caption text-grey-7">Resumen de compras en rango</div>
            </div>
            <q-icon name="shopping_cart" class="text-primary" />
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-card bordered flat class="bg-grey-1 rounded-borders q-pa-sm">
                  <div class="text-caption text-grey-7">Compras</div>
                  <div class="text-h6 text-weight-bold">{{ kpi.purchasesCount }}</div>
                </q-card>
              </div>
              <div class="col-6">
                <q-card bordered flat class="bg-grey-1 rounded-borders q-pa-sm">
                  <div class="text-caption text-grey-7">Monto</div>
                  <div class="text-h6 text-weight-bold">{{ money(kpi.purchasesAmount) }}</div>
                </q-card>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="text-caption text-grey-7 q-mb-sm">Top materiales comprados</div>
            <q-list bordered class="rounded-borders">
              <q-item v-for="m in topPurchasedMaterials" :key="m.name">
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ m.name }}</q-item-label>
                  <q-item-label caption>{{ m.qty }} {{ m.unit }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge outline color="primary">{{ money(m.amount) }}</q-badge>
                </q-item-section>
              </q-item>

              <q-item v-if="!topPurchasedMaterials.length">
                <q-item-section class="text-grey-7">Sin compras en el rango.</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-4">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Actividad reciente</div>
              <div class="text-caption text-grey-7">Eventos  del sistema</div>
            </div>
            <q-icon name="history" class="text-primary" />
          </q-card-section>

          <q-separator />

          <q-card-section class="q-gutter-sm">
            <q-card
              v-for="e in timeline.slice(0, 6)"
              :key="e.id"
              bordered
              flat
              class="q-pa-sm rounded-borders"
            >
              <div class="row items-center justify-between">
                <div>
                  <div class="text-weight-medium">{{ e.title }}</div>
                  <div class="text-caption text-grey-7">{{ e.when }} · {{ e.by }}</div>
                </div>
                <q-badge :color="eventColor(e.type)">{{ e.type }}</q-badge>
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">{{ e.note }}</div>
            </q-card>

            <q-btn outline class="full-width" icon="open_in_new" label="Ver todo" @click="openTimeline()" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- TABS -->
    <q-card bordered class="bg-white rounded-borders">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Detalle</div>
          <div class="text-caption text-grey-7">
            Cambia de pestaña para ver cada dataset.
          </div>
        </div>
        <q-tabs v-model="tab" dense class="text-grey-8">
          <q-tab name="orders" icon="assignment" label="Órdenes" />
          <q-tab name="production" icon="precision_manufacturing" label="Producción" />
          <q-tab name="purchases" icon="shopping_cart" label="Compras" />
          <q-tab name="inv_mov" icon="swap_vert" label="Mov. inventario" />
          <q-tab name="invoices" icon="receipt_long" label="Facturas" />
          <q-tab name="deliveries" icon="local_shipping" label="Entregas" />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <q-tab-panels v-model="tab" animated>
          <!-- ORDERS -->
          <q-tab-panel name="orders" class="q-pa-none">
            <q-table
              flat
              :rows="filteredOrders"
              :columns="orderColumns"
              row-key="id"
              :rows-per-page-options="[10, 20, 50]"
              :pagination="{ rowsPerPage: 10 }"
              class="rounded-table"
            >
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-badge :color="statusColor(props.row.status)">
                    {{ props.row.status }}
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-code="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ props.row.code }}</div>
                  <div class="text-caption text-grey-7">
                    Cliente: {{ props.row.customer }} · Producto: {{ props.row.product }}
                  </div>
                </q-td>
              </template>

              <template #body-cell-amount="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ money(props.row.amount) }}</div>
                  <div class="text-caption text-grey-7">
                    {{ props.row.items }} ítems
                  </div>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">No hay órdenes con esos filtros.</div>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- PRODUCTION -->
          <q-tab-panel name="production" class="q-pa-none">
            <q-table
              flat
              :rows="filteredProduction"
              :columns="productionColumns"
              row-key="id"
              :rows-per-page-options="[10, 20, 50]"
              :pagination="{ rowsPerPage: 10 }"
              class="rounded-table"
            >
              <template #body-cell-type="props">
                <q-td :props="props">
                  <q-badge :color="props.row.type === 'ENSAMBLAJE' ? 'primary' : 'green'">
                    {{ props.row.type }}
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-ref="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ props.row.ref }}</div>
                  <div class="text-caption text-grey-7">
                    {{ props.row.product }} · {{ props.row.qty }} unidad
                  </div>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">No hay producción en el rango.</div>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- PURCHASES -->
          <q-tab-panel name="purchases" class="q-pa-none">
            <q-table
              flat
              :rows="filteredPurchases"
              :columns="purchaseColumns"
              row-key="id"
              :rows-per-page-options="[10, 20, 50]"
              :pagination="{ rowsPerPage: 10 }"
              class="rounded-table"
            >
              <template #body-cell-total="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ money(props.row.total) }}</div>
                  <div class="text-caption text-grey-7">
                    {{ props.row.items }} ítems · {{ props.row.supplier }}
                  </div>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">No hay compras en el rango.</div>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- INVENTORY MOVEMENTS -->
          <q-tab-panel name="inv_mov" class="q-pa-none">
            <q-table
              flat
              :rows="filteredInvMov"
              :columns="invMovColumns"
              row-key="id"
              :rows-per-page-options="[10, 20, 50]"
              :pagination="{ rowsPerPage: 10 }"
              class="rounded-table"
            >
              <template #body-cell-type="props">
                <q-td :props="props">
                  <q-badge :color="props.row.type === 'IN' ? 'primary' : 'negative'">
                    {{ props.row.type === 'IN' ? 'ENTRADA' : 'SALIDA' }}
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-item="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ props.row.item }}</div>
                  <div class="text-caption text-grey-7">
                    Ref: {{ props.row.ref }} · {{ signed(props.row.type, props.row.qty) }} {{ props.row.unit }}
                  </div>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">No hay movimientos en el rango.</div>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- INVOICES -->
          <q-tab-panel name="invoices" class="q-pa-none">
            <q-table
              flat
              :rows="filteredInvoices"
              :columns="invoiceColumns"
              row-key="id"
              :rows-per-page-options="[10, 20, 50]"
              :pagination="{ rowsPerPage: 10 }"
              class="rounded-table"
            >
              <template #body-cell-total="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ money(props.row.total) }}</div>
                  <div class="text-caption text-grey-7">
                    Orden: {{ props.row.orderCode }} · {{ props.row.customer }}
                  </div>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">No hay facturas en el rango.</div>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- DELIVERIES -->
          <q-tab-panel name="deliveries" class="q-pa-none">
            <q-table
              flat
              :rows="filteredDeliveries"
              :columns="deliveryColumns"
              row-key="id"
              :rows-per-page-options="[10, 20, 50]"
              :pagination="{ rowsPerPage: 10 }"
              class="rounded-table"
            >
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-badge :color="deliveryStatusColor(props.row.status)">
                    {{ props.row.status }}
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-order="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ props.row.orderCode }}</div>
                  <div class="text-caption text-grey-7">
                    {{ props.row.address }}
                  </div>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">No hay entregas en el rango.</div>
              </template>
            </q-table>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>

    <!-- DATE DIALOG -->
    <q-dialog v-model="dateDlg" persistent>
      <q-card style="width: 720px; max-width: 95vw" class="rounded-borders">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">Rango de fechas</div>
          <q-btn dense flat round icon="close" @click="dateDlg = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-date v-model="dateRange" range minimal />
          </div>

          <div class="col-12 col-md-6">
            <q-banner class="bg-grey-2 rounded-borders q-mb-md">
              <div class="text-caption text-grey-7">
                Selecciona inicio/fin y aplica. También puedes usar atajos.
              </div>
            </q-banner>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-btn outline class="full-width" label="Hoy" @click="presetToday()" />
              </div>
              <div class="col-6">
                <q-btn outline class="full-width" label="Últimos 7 días" @click="presetLastDays(7)" />
              </div>
              <div class="col-6">
                <q-btn outline class="full-width" label="Últimos 30 días" @click="presetLastDays(30)" />
              </div>
              <div class="col-6">
                <q-btn outline class="full-width" label="Mes actual" @click="presetThisMonth()" />
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="row items-center justify-between">
              <div class="text-caption text-grey-7">
                Aplicado:
                <b>{{ filters.dateFrom || "—" }}</b> →
                <b>{{ filters.dateTo || "—" }}</b>
              </div>
              <div class="row q-gutter-sm">
                <q-btn flat label="Cancelar" @click="dateDlg = false" />
                <q-btn unelevated color="primary" icon="done" label="Aplicar" @click="applyDate()" />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- TIMELINE DIALOG -->
    <q-dialog v-model="timelineDlg" persistent maximized>
      <q-card class="bg-grey-1">
        <q-card-section class="row items-center justify-between bg-white">
          <div>
            <div class="text-h6 text-weight-bold">Actividad (todo)</div>
            <div class="text-caption text-grey-7">Eventos simulados.</div>
          </div>
          <q-btn dense flat round icon="close" @click="timelineDlg = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <q-table
            flat
            :rows="timeline"
            :columns="timelineColumns"
            row-key="id"
            :rows-per-page-options="[20, 50, 100]"
            :pagination="{ rowsPerPage: 20 }"
            class="rounded-table"
          >
            <template #body-cell-type="props">
              <q-td :props="props">
                <q-badge :color="eventColor(props.row.type)">{{ props.row.type }}</q-badge>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();
const tab = ref<"orders" | "production" | "purchases" | "inv_mov" | "invoices" | "deliveries">("orders");

const dateDlg = ref(false);
const timelineDlg = ref(false);

/** Filtros globales */
const filters = reactive({
  search: "",
  status: "ALL" as "ALL" | OrderStatus,
  area: "ALL" as "ALL" | "MATERIALES" | "ENSAMBLAJE" | "ENTREGA" | "FINANZAS",
  dateFrom: "", // YYYY-MM-DD
  dateTo: "",   // YYYY-MM-DD
});

type OrderStatus =
  | "COTIZACION"
  | "ORDEN_TRABAJO"
  | "EN_PRODUCCION"
  | "LISTA_PARA_ENTREGA"
  | "ENTREGADA"
  | "FACTURADA"
  | "CANCELADA";

const statusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Cotización", value: "COTIZACION" },
  { label: "Orden de trabajo", value: "ORDEN_TRABAJO" },
  { label: "En producción", value: "EN_PRODUCCION" },
  { label: "Lista para entrega", value: "LISTA_PARA_ENTREGA" },
  { label: "Entregada", value: "ENTREGADA" },
  { label: "Facturada", value: "FACTURADA" },
  { label: "Cancelada", value: "CANCELADA" },
];

const areaOptions = [
  { label: "Todas", value: "ALL" },
  { label: "Materiales", value: "MATERIALES" },
  { label: "Ensamblaje", value: "ENSAMBLAJE" },
  { label: "Entrega", value: "ENTREGA" },
  { label: "Finanzas", value: "FINANZAS" },
];

/** Mock data */
type Order = {
  id: string;
  date: string; // YYYY-MM-DD
  code: string;
  customer: string;
  product: string;
  items: number;
  amount: number;
  status: OrderStatus;
};

const orders = ref<Order[]>([
  { id: uid("ord"), date: ymdMinus(1), code: "OT-00023", customer: "Carlos Pérez", product: "Mesa M1", items: 3, amount: 12500, status: "EN_PRODUCCION" },
  { id: uid("ord"), date: ymdMinus(2), code: "OT-00022", customer: "Ana López", product: "Mesa Pro", items: 2, amount: 14600, status: "LISTA_PARA_ENTREGA" },
  { id: uid("ord"), date: ymdMinus(4), code: "OT-00021", customer: "Miguel Reyes", product: "Silla S1", items: 8, amount: 9800, status: "FACTURADA" },
  { id: uid("ord"), date: ymdMinus(7), code: "COT-00009", customer: "Empresa Norte", product: "Mesa M1", items: 10, amount: 42000, status: "COTIZACION" },
  { id: uid("ord"), date: ymdMinus(10), code: "OT-00020", customer: "Laura Jiménez", product: "Mesa M1", items: 1, amount: 4500, status: "ENTREGADA" },
]);

type Production = {
  id: string;
  date: string;
  type: "ENSAMBLAJE" | "PRODUCCION";
  ref: string; // referencia (OT o ENS)
  product: string;
  qty: number;
  by: string;
};

const production = ref<Production[]>([
  { id: uid("prd"), date: ymdMinus(1), type: "ENSAMBLAJE", ref: "ENS-00014", product: "Mesa M1", qty: 4, by: "Juan" },
  { id: uid("prd"), date: ymdMinus(2), type: "PRODUCCION", ref: "PROD-00006", product: "Silla S1", qty: 10, by: "María" },
  { id: uid("prd"), date: ymdMinus(4), type: "ENSAMBLAJE", ref: "ENS-00013", product: "Mesa Pro", qty: 2, by: "Juan" },
]);

type Purchase = {
  id: string;
  date: string;
  code: string;
  supplier: string;
  items: number;
  total: number;
  lines: { material: string; qty: number; unit: string; amount: number }[];
};

const purchases = ref<Purchase[]>([
  {
    id: uid("buy"),
    date: ymdMinus(2),
    code: "COMP-00031",
    supplier: "Proveedor Norte",
    items: 3,
    total: 9800,
    lines: [
      { material: "Resina epóxica", qty: 8, unit: "kg", amount: 7200 },
      { material: "Lija fina", qty: 20, unit: "unidad", amount: 600 },
      { material: "Pegamento industrial", qty: 2, unit: "unidad", amount: 2000 },
    ],
  },
  {
    id: uid("buy"),
    date: ymdMinus(8),
    code: "COMP-00030",
    supplier: "Ferretería Central",
    items: 1,
    total: 1800,
    lines: [{ material: "Tornillos 2cm", qty: 4, unit: "caja", amount: 1800 }],
  },
]);

type InvMov = {
  id: string;
  date: string;
  type: "IN" | "OUT";
  item: string; // material o producto
  unit: string;
  qty: number;
  ref: string; // COMP/ENS/OT/AJU
  by: string;
};

const inventoryMovements = ref<InvMov[]>([
  { id: uid("mov"), date: ymdMinus(2), type: "IN", item: "Resina epóxica", unit: "kg", qty: 8, ref: "COMP-00031", by: "Osiris" },
  { id: uid("mov"), date: ymdMinus(1), type: "OUT", item: "Resina epóxica", unit: "kg", qty: 3, ref: "ENS-00014", by: "Juan" },
  { id: uid("mov"), date: ymdMinus(1), type: "IN", item: "Mesa M1", unit: "unidad", qty: 4, ref: "ENS-00014", by: "Juan" },
  { id: uid("mov"), date: ymdMinus(3), type: "OUT", item: "Mesa Pro", unit: "unidad", qty: 1, ref: "FAC-00088", by: "María" },
]);

type Invoice = {
  id: string;
  date: string;
  code: string;
  orderCode: string;
  customer: string;
  total: number;
  status: "EMITIDA" | "ANULADA";
};

const invoices = ref<Invoice[]>([
  { id: uid("fac"), date: ymdMinus(4), code: "FAC-00088", orderCode: "OT-00021", customer: "Miguel Reyes", total: 9800, status: "EMITIDA" },
  { id: uid("fac"), date: ymdMinus(9), code: "FAC-00087", orderCode: "OT-00019", customer: "Cliente X", total: 6400, status: "EMITIDA" },
]);

type Delivery = {
  id: string;
  date: string;
  orderCode: string;
  status: "PENDIENTE" | "EN_RUTA" | "ENTREGADA";
  address: string;
  driver: string;
};

const deliveries = ref<Delivery[]>([
  { id: uid("del"), date: ymdMinus(2), orderCode: "OT-00022", status: "PENDIENTE", address: "Av. Principal #22", driver: "Luis" },
  { id: uid("del"), date: ymdMinus(10), orderCode: "OT-00020", status: "ENTREGADA", address: "Calle 3, Res. Palma", driver: "Luis" },
]);

type TimelineEvent = {
  id: string;
  when: string;
  type: "ORDER" | "PROD" | "BUY" | "INV" | "INVOC" | "DELIVERY";
  title: string;
  note: string;
  by: string;
};

const timeline = computed<TimelineEvent[]>(() => {
  const out: TimelineEvent[] = [];

  for (const o of orders.value) {
    out.push({
      id: uid("t"),
      when: `${o.date} 09:10`,
      type: "ORDER",
      title: `Orden ${o.code} — ${o.status}`,
      note: `Cliente: ${o.customer} · Producto: ${o.product}`,
      by: "Sistema",
    });
  }

  for (const p of production.value) {
    out.push({
      id: uid("t"),
      when: `${p.date} 11:20`,
      type: "PROD",
      title: `${p.type} — ${p.ref}`,
      note: `${p.product} · ${p.qty} unidad · Por: ${p.by}`,
      by: p.by,
    });
  }

  for (const b of purchases.value) {
    out.push({
      id: uid("t"),
      when: `${b.date} 14:05`,
      type: "BUY",
      title: `Compra ${b.code}`,
      note: `${b.supplier} · ${b.items} ítems · Total ${money(b.total)}`,
      by: "Osiris",
    });
  }

  for (const m of inventoryMovements.value) {
    out.push({
      id: uid("t"),
      when: `${m.date} 15:40`,
      type: "INV",
      title: `Movimiento — ${m.type === "IN" ? "Entrada" : "Salida"}`,
      note: `${m.item} · ${signed(m.type, m.qty)} ${m.unit} · Ref ${m.ref}`,
      by: m.by,
    });
  }

  for (const f of invoices.value) {
    out.push({
      id: uid("t"),
      when: `${f.date} 16:10`,
      type: "INVOC",
      title: `Factura ${f.code}`,
      note: `Orden ${f.orderCode} · ${f.customer} · ${money(f.total)}`,
      by: "María",
    });
  }

  for (const d of deliveries.value) {
    out.push({
      id: uid("t"),
      when: `${d.date} 17:00`,
      type: "DELIVERY",
      title: `Entrega ${d.orderCode} — ${d.status}`,
      note: `${d.address} · Chofer: ${d.driver}`,
      by: d.driver,
    });
  }

  return out.sort((a, b) => (a.when < b.when ? 1 : -1));
});

/** Date range UI */
const dateRange = ref<any>({ from: "", to: "" });

function presetToday() {
  const t = todayYMD();
  dateRange.value = { from: t, to: t };
}
function presetLastDays(n: number) {
  const to = todayYMD();
  const from = ymdMinus(n - 1);
  dateRange.value = { from, to };
}
function presetThisMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const from = `${y}-${m}-01`;
  const to = todayYMD();
  dateRange.value = { from, to };
}
function applyDate() {
  const from = dateRange.value?.from || "";
  const to = dateRange.value?.to || "";
  filters.dateFrom = from;
  filters.dateTo = to;
  dateDlg.value = false;
}

/** Filtrado por fecha */
function inRange(date: string) {
  const from = filters.dateFrom;
  const to = filters.dateTo;
  if (!from && !to) return true;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function qMatch(...vals: string[]) {
  const q = filters.search.trim().toLowerCase();
  if (!q) return true;
  return vals.some((v) => String(v || "").toLowerCase().includes(q));
}

/** Filtered datasets */
const filteredOrders = computed(() => {
  return orders.value.filter((o) => {
    if (!inRange(o.date)) return false;
    if (filters.status !== "ALL" && o.status !== filters.status) return false;
    if (filters.area !== "ALL" && filters.area !== "ENSAMBLAJE") return false; // órdenes son de ensamblaje
    return qMatch(o.code, o.customer, o.product, o.status);
  });
});

const filteredProduction = computed(() => {
  return production.value.filter((p) => {
    if (!inRange(p.date)) return false;
    if (filters.area !== "ALL" && filters.area !== "ENSAMBLAJE") return false;
    return qMatch(p.ref, p.product, p.type, p.by);
  });
});

const filteredPurchases = computed(() => {
  return purchases.value.filter((b) => {
    if (!inRange(b.date)) return false;
    if (filters.area !== "ALL" && filters.area !== "MATERIALES") return false;
    return qMatch(b.code, b.supplier, String(b.total));
  });
});

const filteredInvMov = computed(() => {
  return inventoryMovements.value.filter((m) => {
    if (!inRange(m.date)) return false;
    if (filters.area !== "ALL") {
      // Heurística simple:
      // si item parece producto (tiene "Mesa"/"Silla") lo consideramos ENSAMBLAJE, si no, MATERIALES
      const isProduct = /mesa|silla|kit/i.test(m.item);
      if (filters.area === "ENSAMBLAJE" && !isProduct) return false;
      if (filters.area === "MATERIALES" && isProduct) return false;
      if (filters.area === "ENTREGA" || filters.area === "FINANZAS") return false;
    }
    return qMatch(m.item, m.ref, m.by, m.type);
  });
});

const filteredInvoices = computed(() => {
  return invoices.value.filter((f) => {
    if (!inRange(f.date)) return false;
    if (filters.area !== "ALL" && filters.area !== "FINANZAS") return false;
    return qMatch(f.code, f.orderCode, f.customer, f.status, String(f.total));
  });
});

const filteredDeliveries = computed(() => {
  return deliveries.value.filter((d) => {
    if (!inRange(d.date)) return false;
    if (filters.area !== "ALL" && filters.area !== "ENTREGA") return false;
    return qMatch(d.orderCode, d.status, d.address, d.driver);
  });
});

/** KPI */
const kpi = computed(() => {
  const os = filteredOrders.value;
  const ordersTotal = os.length;
  const inProgress = os.filter((o) => ["ORDEN_TRABAJO", "EN_PRODUCCION"].includes(o.status)).length;
  const readyDelivery = os.filter((o) => o.status === "LISTA_PARA_ENTREGA").length;

  const inv = filteredInvoices.value.filter((x) => x.status === "EMITIDA");
  const invoicedAmount = inv.reduce((acc, x) => acc + (x.total || 0), 0);

  const buys = filteredPurchases.value;
  const purchasesCount = buys.length;
  const purchasesAmount = buys.reduce((acc, x) => acc + (x.total || 0), 0);

  return {
    ordersTotal,
    inProgress,
    readyDelivery,
    invoicedAmount: round2(invoicedAmount),
    purchasesCount,
    purchasesAmount: round2(purchasesAmount),
  };
});

const statusBreakdown = computed(() => {
  const map: Record<string, number> = {};
  for (const o of filteredOrders.value) {
    map[o.status] = (map[o.status] || 0) + 1;
  }
  const order: OrderStatus[] = [
    "COTIZACION",
    "ORDEN_TRABAJO",
    "EN_PRODUCCION",
    "LISTA_PARA_ENTREGA",
    "ENTREGADA",
    "FACTURADA",
    "CANCELADA",
  ];
  return order.map((k) => ({ key: k, label: k.replaceAll("_", " "), count: map[k] || 0 }));
});

const topPurchasedMaterials = computed(() => {
  const agg = new Map<string, { name: string; qty: number; unit: string; amount: number }>();
  for (const b of filteredPurchases.value) {
    for (const l of b.lines) {
      const key = `${l.material}|${l.unit}`;
      const cur = agg.get(key) || { name: l.material, qty: 0, unit: l.unit, amount: 0 };
      cur.qty += l.qty;
      cur.amount += l.amount;
      agg.set(key, cur);
    }
  }
  return Array.from(agg.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((x) => ({ ...x, qty: round2(x.qty), amount: round2(x.amount) }));
});

/** Columns */
const orderColumns = [
  { name: "date", label: "Fecha", field: "date", align: "left", sortable: true },
  { name: "code", label: "Orden", field: "code", align: "left", sortable: true },
  { name: "status", label: "Estatus", field: "status", align: "left", sortable: true },
  { name: "amount", label: "Monto", field: "amount", align: "left", sortable: true },
];

const productionColumns = [
  { name: "date", label: "Fecha", field: "date", align: "left", sortable: true },
  { name: "type", label: "Tipo", field: "type", align: "left", sortable: true },
  { name: "ref", label: "Referencia", field: "ref", align: "left", sortable: true },
  { name: "by", label: "Por", field: "by", align: "left", sortable: true },
];

const purchaseColumns = [
  { name: "date", label: "Fecha", field: "date", align: "left", sortable: true },
  { name: "code", label: "Compra", field: "code", align: "left", sortable: true },
  { name: "supplier", label: "Proveedor", field: "supplier", align: "left", sortable: true },
  { name: "total", label: "Total", field: "total", align: "left", sortable: true },
];

const invMovColumns = [
  { name: "date", label: "Fecha", field: "date", align: "left", sortable: true },
  { name: "type", label: "Tipo", field: "type", align: "left", sortable: true },
  { name: "item", label: "Item", field: "item", align: "left", sortable: true },
  { name: "by", label: "Por", field: "by", align: "left", sortable: true },
];

const invoiceColumns = [
  { name: "date", label: "Fecha", field: "date", align: "left", sortable: true },
  { name: "code", label: "Factura", field: "code", align: "left", sortable: true },
  { name: "orderCode", label: "Orden", field: "orderCode", align: "left", sortable: true },
  { name: "status", label: "Estatus", field: "status", align: "left", sortable: true },
  { name: "total", label: "Total", field: "total", align: "left", sortable: true },
];

const deliveryColumns = [
  { name: "date", label: "Fecha", field: "date", align: "left", sortable: true },
  { name: "order", label: "Orden / Dirección", field: "orderCode", align: "left", sortable: true },
  { name: "status", label: "Estatus", field: "status", align: "left", sortable: true },
  { name: "driver", label: "Chofer", field: "driver", align: "left", sortable: true },
];

const timelineColumns = [
  { name: "when", label: "Fecha/hora", field: "when", align: "left", sortable: true },
  { name: "type", label: "Tipo", field: "type", align: "left", sortable: true },
  { name: "title", label: "Evento", field: "title", align: "left", sortable: true },
  { name: "by", label: "Por", field: "by", align: "left", sortable: true },
  { name: "note", label: "Detalle", field: "note", align: "left", sortable: false },
];

/** UI helpers */
function statusColor(s: OrderStatus) {
  switch (s) {
    case "COTIZACION": return "grey";
    case "ORDEN_TRABAJO": return "primary";
    case "EN_PRODUCCION": return "orange";
    case "LISTA_PARA_ENTREGA": return "blue";
    case "ENTREGADA": return "green";
    case "FACTURADA": return "green";
    case "CANCELADA": return "negative";
  }
}

function deliveryStatusColor(s: Delivery["status"]) {
  if (s === "PENDIENTE") return "orange";
  if (s === "EN_RUTA") return "primary";
  return "green";
}

function eventColor(t: TimelineEvent["type"]) {
  switch (t) {
    case "ORDER": return "primary";
    case "PROD": return "green";
    case "BUY": return "purple";
    case "INV": return "grey";
    case "INVOC": return "teal";
    case "DELIVERY": return "blue";
  }
}

function ratio(a: number, b: number) {
  if (!b) return 0;
  return Math.min(1, Math.max(0, a / b));
}

function pct(a: number, b: number) {
  if (!b) return "0%";
  return `${Math.round((a / b) * 100)}%`;
}

function signed(type: "IN" | "OUT", qty: number) {
  const q = Math.abs(Number(qty) || 0);
  return type === "IN" ? `+${q}` : `-${q}`;
}

/** Actions */
function resetFilters() {
  filters.search = "";
  filters.status = "ALL";
  filters.area = "ALL";
  filters.dateFrom = "";
  filters.dateTo = "";
  dateRange.value = { from: "", to: "" };
  $q.notify({ message: "Filtros limpiados.", color: "primary", position: "top" });
}

function fakeExport() {
  $q.notify({ message: "Exportación simulada.", color: "primary", position: "top" });
}

function openTimeline() {
  timelineDlg.value = true;
}

/** Utils */
function money(n: number) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" }).format(v);
}
function round2(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function ymdMinus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
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
