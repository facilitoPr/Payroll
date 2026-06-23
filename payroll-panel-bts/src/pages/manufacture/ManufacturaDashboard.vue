<template>
  <q-page class="q-pa-md">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Manufactura</div>
        <div class="text-grey-7">
          Panel general — {{ todayLabel }}
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-input
            outlined
            dense
            debounce="250"
            v-model="search"
            placeholder="Buscar en actividad…"
            style="min-width: 260px"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
            <template #append>
              <q-btn
                v-if="search"
                flat
                dense
                round
                icon="close"
                @click="search = ''"
              />
            </template>
          </q-input>

          <q-btn
            unelevated
            color="primary"
            icon="refresh"
            label="Refrescar"
            @click="fakeRefresh"
          />
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- KPI CARDS -->
    <div class="row q-col-gutter-md">
      <div
        v-for="kpi in kpis"
        :key="kpi.key"
        class="col-12 col-sm-6 col-lg-3"
      >
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon :name="kpi.icon" size="34px" class="text-primary" />
            <div class="col">
              <div class="text-grey-7 text-caption">{{ kpi.label }}</div>
              <div class="text-h6 text-weight-bold">{{ kpi.value }}</div>
              <div class="text-caption" :class="kpi.deltaClass">
                {{ kpi.delta }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- QUICK ACTIONS -->
    <q-card bordered class="bg-white rounded-borders q-mt-md">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Accesos rápidos</div>
          <div class="text-caption text-grey-7">
            Atajos para las acciones más comunes (hardcode por ahora).
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-md-3">
            <q-btn
              outline
              class="full-width"
              icon="shopping_cart"
              label="Nueva compra"
              @click="openQuick('purchase')"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-btn
              outline
              class="full-width"
              icon="inventory_2"
              label="Inventario materiales"
              @click="openQuick('materialsInventory')"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-btn
              outline
              class="full-width"
              icon="precision_manufacturing"
              label="Crear cotización"
              @click="openQuick('quote')"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-btn
              outline
              class="full-width"
              icon="local_shipping"
              label="Ver entregas"
              @click="openQuick('deliveries')"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- MAIN GRID -->
    <div class="row q-col-gutter-md q-mt-md">
      <!-- ACTIVITY -->
      <div class="col-12 col-lg-8">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Actividad reciente</div>
              <div class="text-caption text-grey-7">
                Movimientos simulados (compras, producción, órdenes, entregas).
              </div>
            </div>

            <q-badge outline color="primary">
              {{ filteredActivity.length }} registros
            </q-badge>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none">
            <q-table
              flat
              :rows="filteredActivity"
              :columns="activityColumns"
              row-key="id"
              :rows-per-page-options="[5, 10, 20]"
              :pagination="{ rowsPerPage: 10 }"
              class="manufactura-table"
            >
              <template #body-cell-type="props">
                <q-td :props="props">
                  <q-badge
                    :color="typeColor(props.row.type)"
                    class="q-px-sm"
                  >
                    {{ props.row.type }}
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-ref="props">
                <q-td :props="props">
                  <span class="text-weight-medium">{{ props.row.ref }}</span>
                </q-td>
              </template>

              <template #body-cell-when="props">
                <q-td :props="props">
                  <div class="text-weight-medium">{{ props.row.when }}</div>
                  <div class="text-caption text-grey-7">{{ props.row.by }}</div>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">
                  No hay actividad para mostrar.
                </div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <!-- ALERTS + STATUS -->
      <div class="col-12 col-lg-4">
        <!-- Low stock -->
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Alertas</div>
              <div class="text-caption text-grey-7">Bajo stock y entregas pendientes.</div>
            </div>
            <q-icon name="notifications" class="text-primary" size="24px" />
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-sm">Materiales bajo stock</div>

            <div v-if="lowStock.length" class="q-gutter-sm">
              <q-card
                v-for="m in lowStock"
                :key="m.id"
                flat
                bordered
                class="q-pa-sm rounded-borders"
              >
                <div class="row items-center justify-between">
                  <div>
                    <div class="text-weight-medium">{{ m.name }}</div>
                    <div class="text-caption text-grey-7">
                      Stock: {{ m.stock }} {{ m.unit }} · Mínimo: {{ m.min }} {{ m.unit }}
                    </div>
                  </div>
                  <q-badge color="negative">BAJO</q-badge>
                </div>

                <q-linear-progress
                  :value="Math.min(1, m.stock / Math.max(1, m.min))"
                  class="q-mt-sm"
                />
              </q-card>
            </div>

            <div v-else class="text-grey-7 text-caption q-pa-sm">
              No hay alertas de stock.
            </div>

            <q-separator class="q-my-md" />

            <div class="text-caption text-grey-7 q-mb-sm">Órdenes para entrega</div>

            <div v-if="readyToDeliver.length" class="q-gutter-sm">
              <q-card
                v-for="o in readyToDeliver"
                :key="o.id"
                flat
                bordered
                class="q-pa-sm rounded-borders"
              >
                <div class="row items-center justify-between">
                  <div>
                    <div class="text-weight-medium">OT {{ o.code }}</div>
                    <div class="text-caption text-grey-7">
                      {{ o.client }} · {{ o.address }}
                    </div>
                  </div>
                  <q-btn
                    dense
                    flat
                    icon="arrow_forward"
                    color="primary"
                    @click="openOrder(o.id)"
                  >
                    <q-tooltip>Ver orden</q-tooltip>
                  </q-btn>
                </div>
              </q-card>
            </div>

            <div v-else class="text-grey-7 text-caption q-pa-sm">
              No hay órdenes listas para entrega.
            </div>
          </q-card-section>
        </q-card>

        <!-- Status overview -->
        <q-card bordered class="bg-white rounded-borders q-mt-md">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">Órdenes por estatus</div>
            <div class="text-caption text-grey-7">Distribución simulada.</div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-gutter-md">
            <div v-for="s in statusOverview" :key="s.key">
              <div class="row items-center justify-between">
                <div class="text-weight-medium">{{ s.label }}</div>
                <div class="text-caption text-grey-7">{{ s.value }}</div>
              </div>
              <q-linear-progress :value="s.ratio" class="q-mt-xs" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

const $q = useQuasar();
const router = useRouter();

const todayLabel = new Intl.DateTimeFormat("es-DO", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(new Date());

const search = ref("");

const kpis = ref([
  {
    key: "inProcess",
    icon: "build_circle",
    label: "Órdenes en proceso",
    value: "7",
    delta: "+2 vs ayer",
    deltaClass: "text-positive",
  },
  {
    key: "ready",
    icon: "local_shipping",
    label: "Listas para entrega",
    value: "5",
    delta: "+1 hoy",
    deltaClass: "text-positive",
  },
  {
    key: "lowStock",
    icon: "warning_amber",
    label: "Materiales bajos",
    value: "4",
    delta: "Revisar inventario",
    deltaClass: "text-negative",
  },
  {
    key: "weeklyProd",
    icon: "precision_manufacturing",
    label: "Producción (semana)",
    value: "128 unidad",
    delta: "+12% vs semana pasada",
    deltaClass: "text-positive",
  },
]);

const activity = ref([
  {
    id: "a1",
    when: "Hoy 10:24 AM",
    type: "COMPRA",
    ref: "COMP-00018",
    description: "Compra confirmada: Resina + Tornillería",
    by: "Romantiezer",
  },
  {
    id: "a2",
    when: "Hoy 09:05 AM",
    type: "ORDEN",
    ref: "OT-00142",
    description: "Orden marcada como 'Lista para entrega'",
    by: "María",
  },
  {
    id: "a3",
    when: "Ayer 04:10 PM",
    type: "PRODUCCION",
    ref: "ENS-00055",
    description: "Producción registrada: 20 unidades (Kit Mesa M1)",
    by: "Juan",
  },
  {
    id: "a4",
    when: "Ayer 01:47 PM",
    type: "ORDEN",
    ref: "COT-00311",
    description: "Cotización creada para cliente: Carlos Peña",
    by: "Ana",
  },
  {
    id: "a5",
    when: "Ayer 11:12 AM",
    type: "ENTREGA",
    ref: "ENT-00029",
    description: "Entrega confirmada con recibo (OT-00139)",
    by: "Delivery 02",
  },
]);

const activityColumns = ref([
  { name: "when", label: "Fecha", field: "when", align: "left", sortable: true },
  { name: "type", label: "Tipo", field: "type", align: "left", sortable: true },
  { name: "ref", label: "Ref", field: "ref", align: "left", sortable: true },
  {
    name: "description",
    label: "Descripción",
    field: "description",
    align: "left",
    sortable: false,
  },
]);

const lowStock = ref([
  { id: "m1", name: "Resina epóxica", unit: "kg", stock: 6, min: 12 },
  { id: "m2", name: "Tornillos 2cm", unit: "caja", stock: 2, min: 5 },
  { id: "m3", name: "Lija fina", unit: "unidad", stock: 9, min: 15 },
  { id: "m4", name: "Pegamento industrial", unit: "unidad", stock: 1, min: 3 },
]);

const readyToDeliver = ref([
  { id: "o1", code: "00142", client: "Carlos Peña", address: "Av. 27 Feb #12" },
  { id: "o2", code: "00141", client: "María López", address: "Los Prados, Calle 3" },
  { id: "o3", code: "00140", client: "AutoParts SRL", address: "Zona Industrial" },
]);

const statusOverview = computed(() => {
  const total = 7 + 5 + 3 + 23; // simulación
  const items = [
    { key: "inProd", label: "En producción", value: 7 },
    { key: "ready", label: "Para entrega", value: 5 },
    { key: "pending", label: "Pendientes", value: 3 },
    { key: "delivered", label: "Entregadas", value: 23 },
  ];
  return items.map((x) => ({
    ...x,
    ratio: total ? x.value / total : 0,
  }));
});

const filteredActivity = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return activity.value;
  return activity.value.filter((a) => {
    return (
      a.when.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      a.ref.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.by.toLowerCase().includes(q)
    );
  });
});

function typeColor(type) {
  switch (type) {
    case "COMPRA":
      return "blue";
    case "PRODUCCION":
      return "purple";
    case "ORDEN":
      return "teal";
    case "ENTREGA":
      return "green";
    default:
      return "grey";
  }
}

function fakeRefresh() {
  $q.notify({
    message: "Dashboard refrescado.",
    color: "primary",
    position: "top",
  });
}

function openQuick(key) {
  // Aquí luego conectamos rutas reales.
  // Por ahora: intenta navegar y si no existe, muestra aviso.
  const map = {
    purchase: "/manufacture/materials",
    materialsInventory: "/manufacture/inventory",
    quote: "/manufacture/workorders",
    deliveries: "/manufacture/package",
  };

  const path = map[key];
  if (!path) return;

  router
    .push(path)
    .catch(() => {
      $q.notify({
        message:
          "Ruta no configurada aún. (Hardcode) Puedes crearla luego en el router.",
        color: "orange",
        position: "top",
      });
    });
}

function openOrder(orderId) {
  // Placeholder a futuro
  $q.notify({
    message: `Abrir detalle de orden (${orderId}) — simulado.`,
    color: "primary",
    position: "top",
  });
}
</script>

<style scoped>
.rounded-borders {
  border-radius: 14px;
}
.manufactura-table :deep(.q-table__container) {
  border-radius: 14px;
}
</style>
