<template>
  <q-page class="q-pa-md">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Ensamblaje</div>
        <div class="text-grey-7">
          Ejecuta órdenes, consume materiales y registra producción (simulado).
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-input
            outlined
            dense
            debounce="250"
            v-model="filters.search"
            placeholder="Buscar OT, producto, cliente…"
            style="min-width: 280px"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
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
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- KPI -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-lg-3">
        <KpiCard icon="precision_manufacturing" label="Órdenes" :value="kpi.total" />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <KpiCard icon="schedule" label="En cola" :value="kpi.queued" />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <KpiCard icon="build_circle" label="En progreso" :value="kpi.inProgress" />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <KpiCard icon="check_circle" label="Finalizadas" :value="kpi.done" />
      </div>
    </div>

    <!-- MAIN LAYOUT -->
    <div class="row q-col-gutter-md">
      <!-- LEFT: Queue -->
      <div class="col-12 col-lg-4">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Cola de producción</div>
              <div class="text-caption text-grey-7">
                Selecciona una OT para trabajarla.
              </div>
            </div>

            <q-badge outline color="primary">
              {{ filteredOrders.length }} visibles
            </q-badge>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none">
            <q-list separator>
              <q-item
                v-for="o in filteredOrders"
                :key="o.id"
                clickable
                @click="selectOrder(o.id)"
                :active="selectedId === o.id"
                active-class="bg-blue-1"
              >
                <q-item-section avatar>
                  <q-icon :name="statusIcon(o.status)" :color="statusColor(o.status)" size="28px" />
                </q-item-section>

                <q-item-section>
                  <div class="row items-center justify-between">
                    <div class="text-weight-bold">{{ o.code }}</div>
                    <q-badge :color="statusColor(o.status)">
                      {{ statusLabel(o.status) }}
                    </q-badge>
                  </div>

                  <div class="text-caption text-grey-7">
                    {{ o.productName }} · {{ o.clientName }}
                  </div>

                  <div class="row items-center q-mt-xs">
                    <q-linear-progress
                      :value="progressValue(o)"
                      rounded
                      style="height: 8px; width: 100%"
                    />
                  </div>

                  <div class="text-caption text-grey-7 q-mt-xs">
                    Progreso: <b>{{ o.producedQty }}</b>/<b>{{ o.plannedQty }}</b> ·
                    Merma: <b>{{ o.scrapQty }}</b>
                  </div>
                </q-item-section>
              </q-item>

              <q-item v-if="!filteredOrders.length">
                <q-item-section class="text-grey-7">
                  No hay órdenes con estos filtros.
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <q-card bordered class="bg-white rounded-borders q-mt-md">
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold">Inventario de materiales</div>
            <div class="text-caption text-grey-7">Se descuenta cuando consumes.</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-gutter-sm">
            <q-card
              v-for="m in materials"
              :key="m.id"
              bordered
              flat
              class="q-pa-sm rounded-borders"
            >
              <div class="row items-center justify-between">
                <div>
                  <div class="text-weight-medium">{{ m.name }}</div>
                  <div class="text-caption text-grey-7">
                    Stock: {{ m.stock }} {{ m.unit }} · Min: {{ m.min }} {{ m.unit }}
                  </div>
                </div>
                <q-badge :color="m.stock <= m.min ? 'negative' : 'primary'">
                  {{ m.stock <= m.min ? "BAJO" : "OK" }}
                </q-badge>
              </div>
            </q-card>
          </q-card-section>
        </q-card>
      </div>

      <!-- RIGHT: Detail -->
      <div class="col-12 col-lg-8">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section v-if="!selectedOrder">
            <div class="text-subtitle1 text-weight-bold">Selecciona una OT</div>
            <div class="text-caption text-grey-7">
              Desde la cola de producción podrás abrir la orden y registrar todo el proceso.
            </div>

            <q-banner class="bg-grey-2 rounded-borders q-mt-md">
              <div class="text-caption text-grey-7">
                Esta pantalla es <b>hardcode</b>. Luego la conectamos con tu módulo de
                <b>Órdenes de trabajo</b> y <b>Paquetes de manufactura</b>.
              </div>
            </q-banner>
          </q-card-section>

          <template v-else>
            <!-- Detail Header -->
            <q-card-section class="row items-start justify-between q-col-gutter-md">
              <div class="col-12 col-md">
                <div class="row items-center q-gutter-sm">
                  <div class="text-h6 text-weight-bold">{{ selectedOrder.code }}</div>
                  <q-badge :color="statusColor(selectedOrder.status)">
                    {{ statusLabel(selectedOrder.status) }}
                  </q-badge>
                  <q-badge outline color="primary">
                    Prioridad: {{ selectedOrder.priority }}
                  </q-badge>
                </div>

                <div class="text-caption text-grey-7 q-mt-xs">
                  Producto: <b>{{ selectedOrder.productName }}</b> · Cliente: <b>{{ selectedOrder.clientName }}</b>
                </div>

                <div class="text-caption text-grey-7">
                  Planificado: <b>{{ selectedOrder.plannedQty }}</b> · Producido: <b>{{ selectedOrder.producedQty }}</b> · Merma: <b>{{ selectedOrder.scrapQty }}</b>
                </div>

                <div class="row items-center q-mt-sm">
                  <q-linear-progress
                    :value="progressValue(selectedOrder)"
                    rounded
                    style="height: 10px; width: 100%"
                  />
                </div>

                <div class="text-caption text-grey-7 q-mt-xs">
                  Inicio: <b>{{ selectedOrder.startedAt || "—" }}</b> · Fin: <b>{{ selectedOrder.finishedAt || "—" }}</b>
                </div>
              </div>

              <div class="col-12 col-md-auto">
                <div class="row items-center q-gutter-sm">
                  <q-btn
                    v-if="selectedOrder.status === 'QUEUED' || selectedOrder.status === 'PAUSED'"
                    unelevated
                    color="primary"
                    icon="play_arrow"
                    :label="selectedOrder.status === 'PAUSED' ? 'Reanudar' : 'Iniciar'"
                    @click="startOrResume(selectedOrder.id)"
                  />
                  <q-btn
                    v-if="selectedOrder.status === 'IN_PROGRESS'"
                    outline
                    color="orange"
                    icon="pause"
                    label="Pausar"
                    @click="pauseOrder(selectedOrder.id)"
                  />
                  <q-btn
                    v-if="selectedOrder.status !== 'DONE' && selectedOrder.status !== 'CANCELED'"
                    unelevated
                    color="positive"
                    icon="check_circle"
                    label="Finalizar"
                    @click="finishOrder(selectedOrder.id)"
                  />
                  <q-btn
                    flat
                    icon="more_vert"
                    round
                    dense
                  >
                    <q-menu>
                      <q-list style="min-width: 220px">
                        <q-item clickable v-close-popup @click="openEditMeta(selectedOrder)">
                          <q-item-section avatar><q-icon name="edit" /></q-item-section>
                          <q-item-section>Editar datos</q-item-section>
                        </q-item>

                        <q-item clickable v-close-popup @click="resetOrder(selectedOrder.id)">
                          <q-item-section avatar><q-icon name="restart_alt" /></q-item-section>
                          <q-item-section>Resetear (simulado)</q-item-section>
                        </q-item>

                        <q-separator />

                        <q-item clickable v-close-popup @click="cancelOrder(selectedOrder.id)">
                          <q-item-section avatar><q-icon name="block" color="negative" /></q-item-section>
                          <q-item-section class="text-negative">Cancelar OT</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <!-- Tabs -->
            <q-card-section>
              <q-tabs v-model="detailTab" dense class="text-grey-8">
                <q-tab name="materials" icon="inventory_2" label="Consumo de materiales" />
                <q-tab name="production" icon="factory" label="Registro de producción" />
                <q-tab name="checklist" icon="task_alt" label="Checklist" />
                <q-tab name="log" icon="timeline" label="Bitácora" />
              </q-tabs>

              <q-separator class="q-my-sm" />

              <q-tab-panels v-model="detailTab" animated>
                <!-- =============== Materials =============== -->
                <q-tab-panel name="materials">
                  <div class="row items-center justify-between q-mb-sm">
                    <div>
                      <div class="text-subtitle1 text-weight-bold">Materiales requeridos</div>
                      <div class="text-caption text-grey-7">
                        Requerido total = (qty por unidad × planificado) + merma%.
                      </div>
                    </div>

                    <div class="row items-center q-gutter-sm">
                      <q-btn
                        outline
                        icon="flash_on"
                        label="Consumir todo posible"
                        @click="autoConsumeAll(selectedOrder.id)"
                      />
                      <q-btn
                        flat
                        icon="help_outline"
                        @click="infoMaterials()"
                      >
                        <q-tooltip>Cómo funciona</q-tooltip>
                      </q-btn>
                    </div>
                  </div>

                  <q-table
                    flat
                    :rows="materialRows"
                    :columns="materialColumns"
                    row-key="rowId"
                    hide-bottom
                    class="rounded-table"
                  >
                    <template #body-cell-stock="props">
                      <q-td :props="props">
                        <div class="text-weight-bold">
                          {{ props.row.stock }} {{ props.row.unit }}
                        </div>
                        <div class="text-caption" :class="props.row.stockLow ? 'text-negative' : 'text-grey-7'">
                          {{ props.row.stockLow ? "Stock bajo" : "OK" }}
                        </div>
                      </q-td>
                    </template>

                    <template #body-cell-required="props">
                      <q-td :props="props">
                        <div class="text-weight-bold">
                          {{ props.row.requiredTotal }} {{ props.row.unit }}
                        </div>
                        <div class="text-caption text-grey-7">
                          (merma {{ props.row.wastePct }}%)
                        </div>
                      </q-td>
                    </template>

                    <template #body-cell-consumed="props">
                      <q-td :props="props">
                        <div class="text-weight-bold">
                          {{ props.row.consumed }} {{ props.row.unit }}
                        </div>
                        <div class="text-caption text-grey-7">
                          Restante: {{ props.row.remaining }} {{ props.row.unit }}
                        </div>
                      </q-td>
                    </template>

                    <template #body-cell-consumeNow="props">
                      <q-td :props="props">
                        <q-input
                          dense
                          outlined
                          type="number"
                          v-model.number="props.row.consumeNow"
                          min="0"
                          step="0.01"
                          :disable="selectedOrder.status === 'DONE' || selectedOrder.status === 'CANCELED'"
                        />
                        <div class="text-caption" :class="props.row.canComplete ? 'text-positive' : 'text-grey-7'">
                          {{ props.row.canComplete ? "Alcanza para completar" : "Puede faltar material" }}
                        </div>
                      </q-td>
                    </template>

                    <template #body-cell-actions="props">
                      <q-td :props="props" class="text-right">
                        <q-btn
                          unelevated
                          color="primary"
                          icon="remove_circle"
                          label="Consumir"
                          :disable="selectedOrder.status === 'DONE' || selectedOrder.status === 'CANCELED'"
                          @click="consumeMaterial(selectedOrder.id, props.row.rowId, props.row.consumeNow)"
                        />
                      </q-td>
                    </template>
                  </q-table>

                  <q-banner class="bg-grey-2 rounded-borders q-mt-md">
                    <div class="text-caption text-grey-7">
                      Tip: si conectamos esto con <b>Paquetes de manufactura</b>, los materiales se cargarían automáticamente según la receta.
                    </div>
                  </q-banner>
                </q-tab-panel>

                <!-- =============== Production =============== -->
                <q-tab-panel name="production">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-lg-7">
                      <q-card bordered class="bg-white rounded-borders">
                        <q-card-section>
                          <div class="text-subtitle1 text-weight-bold">Registrar producción</div>
                          <div class="text-caption text-grey-7">
                            Aumenta el producido y suma al inventario de productos.
                          </div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section class="row q-col-gutter-md">
                          <div class="col-12 col-md-6">
                            <q-input
                              outlined
                              dense
                              type="number"
                              v-model.number="prodForm.producedNow"
                              label="Producido ahora"
                              min="0"
                              step="1"
                              :disable="selectedOrder.status === 'DONE' || selectedOrder.status === 'CANCELED'"
                            />
                          </div>
                          <div class="col-12 col-md-6">
                            <q-input
                              outlined
                              dense
                              type="number"
                              v-model.number="prodForm.scrapNow"
                              label="Merma/Rechazo ahora"
                              min="0"
                              step="1"
                              :disable="selectedOrder.status === 'DONE' || selectedOrder.status === 'CANCELED'"
                            />
                          </div>

                          <div class="col-12">
                            <q-input
                              outlined
                              type="textarea"
                              v-model="prodForm.note"
                              label="Nota (opcional)"
                              autogrow
                              :disable="selectedOrder.status === 'DONE' || selectedOrder.status === 'CANCELED'"
                            />
                          </div>
                        </q-card-section>

                        <q-separator />

                        <q-card-section class="row items-center justify-between">
                          <div class="text-caption text-grey-7">
                            Progreso actual: <b>{{ selectedOrder.producedQty }}</b>/<b>{{ selectedOrder.plannedQty }}</b>
                          </div>

                          <div class="row q-gutter-sm">
                            <q-btn flat label="Limpiar" @click="clearProdForm()" />
                            <q-btn
                              unelevated
                              color="primary"
                              icon="save"
                              label="Registrar"
                              :disable="selectedOrder.status === 'DONE' || selectedOrder.status === 'CANCELED'"
                              @click="registerProduction(selectedOrder.id)"
                            />
                          </div>
                        </q-card-section>
                      </q-card>
                    </div>

                    <div class="col-12 col-lg-5">
                      <q-card bordered class="bg-white rounded-borders">
                        <q-card-section>
                          <div class="text-subtitle1 text-weight-bold">Inventario de productos</div>
                          <div class="text-caption text-grey-7">
                            Se incrementa cuando registras producción.
                          </div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section class="q-gutter-sm">
                          <q-card
                            v-for="p in products"
                            :key="p.id"
                            bordered
                            flat
                            class="q-pa-sm rounded-borders"
                          >
                            <div class="row items-center justify-between">
                              <div>
                                <div class="text-weight-medium">{{ p.name }}</div>
                                <div class="text-caption text-grey-7">Stock: {{ p.stock }} unidad</div>
                              </div>
                              <q-badge outline color="primary">{{ p.sku }}</q-badge>
                            </div>
                          </q-card>
                        </q-card-section>
                      </q-card>

                      <q-banner class="bg-grey-2 rounded-borders q-mt-md">
                        <div class="text-caption text-grey-7">
                          Luego esto alimenta tu pantalla: <b>Inventario de productos</b> (la siguiente).
                        </div>
                      </q-banner>
                    </div>
                  </div>
                </q-tab-panel>

                <!-- =============== Checklist =============== -->
                <q-tab-panel name="checklist">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-lg-7">
                      <q-card bordered class="bg-white rounded-borders">
                        <q-card-section>
                          <div class="text-subtitle1 text-weight-bold">Checklist de ensamblaje</div>
                          <div class="text-caption text-grey-7">
                            Marca pasos completados (simulado).
                          </div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section class="q-gutter-sm">
                          <q-checkbox
                            v-for="c in selectedOrder.checklist"
                            :key="c.id"
                            v-model="c.done"
                            :label="c.title"
                            :disable="selectedOrder.status === 'DONE' || selectedOrder.status === 'CANCELED'"
                            @update:model-value="logChecklist(selectedOrder.id, c)"
                          />
                        </q-card-section>
                      </q-card>
                    </div>

                    <div class="col-12 col-lg-5">
                      <q-card bordered class="bg-white rounded-borders">
                        <q-card-section>
                          <div class="text-subtitle2 text-weight-bold">Resumen</div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section>
                          <q-banner class="bg-grey-2 rounded-borders">
                            <div class="text-caption text-grey-7">
                              Completados:
                              <b>{{ checklistDoneCount }}</b>/<b>{{ selectedOrder.checklist.length }}</b>
                            </div>
                          </q-banner>

                          <q-separator class="q-my-md" />

                          <q-btn
                            outline
                            icon="task_alt"
                            label="Marcar todo completado"
                            class="full-width"
                            :disable="selectedOrder.status === 'DONE' || selectedOrder.status === 'CANCELED'"
                            @click="completeAllChecklist(selectedOrder.id)"
                          />
                        </q-card-section>
                      </q-card>
                    </div>
                  </div>
                </q-tab-panel>

                <!-- =============== Log =============== -->
                <q-tab-panel name="log">
                  <q-card bordered class="bg-white rounded-borders">
                    <q-card-section>
                      <div class="text-subtitle1 text-weight-bold">Bitácora</div>
                      <div class="text-caption text-grey-7">
                        Eventos de la orden (simulado).
                      </div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section>
                      <q-timeline color="primary">
                        <q-timeline-entry
                          v-for="h in selectedOrder.history"
                          :key="h.id"
                          :title="h.title"
                          :subtitle="h.when"
                        >
                          <div class="text-caption text-grey-7">{{ h.note }}</div>
                        </q-timeline-entry>
                      </q-timeline>

                      <div v-if="!selectedOrder.history.length" class="text-grey-7">
                        No hay eventos todavía.
                      </div>
                    </q-card-section>
                  </q-card>
                </q-tab-panel>
              </q-tab-panels>
            </q-card-section>
          </template>
        </q-card>
      </div>
    </div>

    <!-- EDIT META DIALOG -->
    <q-dialog v-model="metaDlg.open" persistent>
      <q-card style="width: 720px; max-width: 95vw" class="rounded-borders">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">Editar datos de OT</div>
          <q-btn dense flat round icon="close" @click="metaDlg.open = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input outlined dense v-model="metaDlg.form.clientName" label="Cliente" />
          </div>
          <div class="col-12 col-md-6">
            <q-input outlined dense v-model="metaDlg.form.productName" label="Producto" />
          </div>
          <div class="col-12 col-md-6">
            <q-input outlined dense type="number" v-model.number="metaDlg.form.plannedQty" label="Planificado" min="0" />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              outlined
              dense
              v-model="metaDlg.form.priority"
              :options="priorityOptions"
              emit-value
              map-options
              label="Prioridad"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="row items-center justify-end q-gutter-sm">
          <q-btn flat label="Cancelar" @click="metaDlg.open = false" />
          <q-btn unelevated color="primary" icon="save" label="Guardar" @click="saveMeta()" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref } from "vue";
import { useQuasar } from "quasar";

/** -------------------- Inline KPI component -------------------- */
const KpiCard = defineComponent({
  name: "KpiCard",
  props: {
    icon: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
  },
  setup(props) {
    return () =>
      h(
        "div",
        { class: "q-card q-card--bordered bg-white rounded-borders" },
        h("div", { class: "q-card__section row items-center q-gutter-md q-pl-md" }, [
          h("i", { class: "q-icon material-icons text-primary", style: "font-size:34px" }, props.icon),
          h("div", { class: "col" }, [
            h("div", { class: "text-caption text-grey-7" }, props.label),
            h("div", { class: "text-h6 text-weight-bold" }, String(props.value)),
            h("div", { class: "text-caption text-grey-7" }, "Resumen"),
          ]),
        ])
      );
  },
});

const $q = useQuasar();

/** -------------------- Filters / UI -------------------- */
const statusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "En cola", value: "QUEUED" },
  { label: "En progreso", value: "IN_PROGRESS" },
  { label: "Pausada", value: "PAUSED" },
  { label: "Finalizada", value: "DONE" },
  { label: "Cancelada", value: "CANCELED" },
];

const priorityOptions = [
  { label: "Baja", value: "Baja" },
  { label: "Media", value: "Media" },
  { label: "Alta", value: "Alta" },
];

const filters = reactive({
  search: "",
  status: "ALL",
});

const selectedId = ref("");
const detailTab = ref("materials");

/** -------------------- Mock inventory -------------------- */
const materials = ref([
  { id: "m1", name: "Resina epóxica", unit: "kg", stock: 12, min: 12 },
  { id: "m2", name: "Tornillos 2cm", unit: "caja", stock: 6, min: 5 },
  { id: "m3", name: "Lija fina", unit: "unidad", stock: 30, min: 15 },
  { id: "m4", name: "Pegamento industrial", unit: "unidad", stock: 4, min: 3 },
]);

const products = ref([
  { id: "p1", sku: "PRD-MESA-M1", name: "Mesa M1", stock: 12 },
  { id: "p2", sku: "PRD-MESA-PRO", name: "Mesa Pro", stock: 4 },
  { id: "p3", sku: "PRD-SERV-REP", name: "Servicio reparación", stock: 0 },
]);

/** -------------------- Mock orders -------------------- */
const orders = ref([
  {
    id: "o1",
    code: "OT-00141",
    clientName: "María López",
    productId: "p1",
    productName: "Mesa M1",
    plannedQty: 10,
    producedQty: 2,
    scrapQty: 0,
    status: "IN_PROGRESS",
    priority: "Media",
    startedAt: `${todayYMD()} ${nowTime()}`,
    requiredMaterials: [
      { rowId: "rm1", materialId: "m1", qtyPerUnit: 0.6, wastePct: 5, consumed: 2.0 },
      { rowId: "rm2", materialId: "m2", qtyPerUnit: 0.2, wastePct: 0, consumed: 0.0 },
      { rowId: "rm3", materialId: "m3", qtyPerUnit: 1, wastePct: 0, consumed: 2 },
    ],
    checklist: [
      { id: "c1", title: "Revisión de materiales", done: true },
      { id: "c2", title: "Corte / preparación", done: false },
      { id: "c3", title: "Ensamblaje principal", done: false },
      { id: "c4", title: "Acabado / lijado", done: false },
      { id: "c5", title: "Control de calidad", done: false },
    ],
    history: [
      { id: "h1", title: "Orden creada", when: `${todayYMD()} · ${nowTime()}`, note: "OT registrada (simulado)." },
      { id: "h2", title: "Inicio de ensamblaje", when: `${todayYMD()} · ${nowTime()}`, note: "Se inició la producción." },
    ],
  },
  {
    id: "o2",
    code: "OT-00142",
    clientName: "AutoParts SRL",
    productId: "p2",
    productName: "Mesa Pro",
    plannedQty: 6,
    producedQty: 0,
    scrapQty: 0,
    status: "QUEUED",
    priority: "Alta",
    requiredMaterials: [
      { rowId: "rm1", materialId: "m1", qtyPerUnit: 0.9, wastePct: 8, consumed: 0 },
      { rowId: "rm2", materialId: "m2", qtyPerUnit: 0.3, wastePct: 0, consumed: 0 },
      { rowId: "rm3", materialId: "m4", qtyPerUnit: 0.2, wastePct: 10, consumed: 0 },
    ],
    checklist: [
      { id: "c1", title: "Revisión de materiales", done: false },
      { id: "c2", title: "Preparación de superficie", done: false },
      { id: "c3", title: "Ensamblaje", done: false },
      { id: "c4", title: "Control de calidad", done: false },
    ],
    history: [{ id: "h1", title: "Orden creada", when: `${todayYMD()} · ${nowTime()}`, note: "OT en cola." }],
  },
  {
    id: "o3",
    code: "OT-00139",
    clientName: "Carlos Peña",
    productId: "p1",
    productName: "Mesa M1",
    plannedQty: 8,
    producedQty: 8,
    scrapQty: 1,
    status: "DONE",
    priority: "Baja",
    startedAt: `${todayYMD()} 08:10`,
    finishedAt: `${todayYMD()} 12:40`,
    requiredMaterials: [
      { rowId: "rm1", materialId: "m1", qtyPerUnit: 0.6, wastePct: 5, consumed: 5.0 },
      { rowId: "rm2", materialId: "m2", qtyPerUnit: 0.2, wastePct: 0, consumed: 1.0 },
    ],
    checklist: [
      { id: "c1", title: "Revisión de materiales", done: true },
      { id: "c2", title: "Ensamblaje", done: true },
      { id: "c3", title: "Control de calidad", done: true },
    ],
    history: [
      { id: "h1", title: "Orden creada", when: `${todayYMD()} · 08:00`, note: "OT registrada." },
      { id: "h2", title: "Inicio de ensamblaje", when: `${todayYMD()} · 08:10`, note: "Producción iniciada." },
      { id: "h3", title: "Finalizada", when: `${todayYMD()} · 12:40`, note: "Orden finalizada." },
    ],
  },
]);

/** Auto-select first order */
if (!selectedId.value && orders.value.length) selectedId.value = orders.value[0].id;

/** -------------------- Computed -------------------- */
const filteredOrders = computed(() => {
  const q = filters.search.trim().toLowerCase();
  const st = filters.status;

  return orders.value.filter((o) => {
    if (st !== "ALL" && o.status !== st) return false;
    if (!q) return true;
    return (
      o.code.toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q) ||
      o.clientName.toLowerCase().includes(q)
    );
  });
});

const selectedOrder = computed(() => orders.value.find((x) => x.id === selectedId.value) || null);

const kpi = computed(() => {
  const total = orders.value.length;
  const queued = orders.value.filter((x) => x.status === "QUEUED").length;
  const inProgress = orders.value.filter((x) => x.status === "IN_PROGRESS").length;
  const done = orders.value.filter((x) => x.status === "DONE").length;
  return { total, queued, inProgress, done };
});

function progressValue(o) {
  if (!o.plannedQty) return 0;
  return Math.min(1, Math.max(0, o.producedQty / o.plannedQty));
}

/** Material table rows for selected order */
const materialColumns = [
  { name: "material", label: "Material", field: "materialName", align: "left" },
  { name: "stock", label: "Stock", field: "stock", align: "left" },
  { name: "required", label: "Requerido", field: "requiredTotal", align: "left" },
  { name: "consumed", label: "Consumido", field: "consumed", align: "left" },
  { name: "consumeNow", label: "Consumir ahora", field: "consumeNow", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" },
];

const materialRows = computed(() => {
  const o = selectedOrder.value;
  if (!o) return [];

  return o.requiredMaterials.map((rm) => {
    const m = materials.value.find((x) => x.id === rm.materialId);
    const unit = m?.unit || "";
    const stock = Number(m?.stock || 0);
    const requiredBase = (Number(rm.qtyPerUnit) || 0) * (Number(o.plannedQty) || 0);
    const requiredTotal = round2(requiredBase * (1 + (Number(rm.wastePct) || 0) / 100));
    const consumed = round2(Number(rm.consumed) || 0);
    const remaining = round2(Math.max(0, requiredTotal - consumed));
    const stockLow = stock <= (m?.min || 0);

    // canComplete: si con stock actual alcanza para terminar todo lo restante
    const canComplete = stock >= remaining;

    return {
      rowId: rm.rowId,
      materialId: rm.materialId,
      materialName: m?.name || "—",
      unit,
      stock: round2(stock),
      min: m?.min || 0,
      stockLow,
      qtyPerUnit: rm.qtyPerUnit,
      wastePct: rm.wastePct,
      requiredTotal,
      consumed,
      remaining,
      canComplete,
      consumeNow: 0, // input UI
    };
  });
});

const checklistDoneCount = computed(() => {
  const o = selectedOrder.value;
  if (!o) return 0;
  return o.checklist.filter((c) => c.done).length;
});

/** -------------------- Production form -------------------- */
const prodForm = reactive({
  producedNow: 0,
  scrapNow: 0,
  note: "",
});

/** -------------------- Actions -------------------- */
function selectOrder(id) {
  selectedId.value = id;
  detailTab.value = "materials";
  clearProdForm();
}

function startOrResume(orderId) {
  const o = orders.value.find((x) => x.id === orderId);
  if (!o) return;

  if (o.status === "DONE" || o.status === "CANCELED") return;

  if (!o.startedAt) o.startedAt = `${todayYMD()} ${nowTime()}`;
  o.status = "IN_PROGRESS";
  pushHistory(o, "Inicio/Reanudación", "Se puso en progreso.");
  $q.notify({ message: "Orden en progreso.", color: "primary", position: "top" });
}

function pauseOrder(orderId) {
  const o = orders.value.find((x) => x.id === orderId);
  if (!o) return;
  if (o.status !== "IN_PROGRESS") return;

  o.status = "PAUSED";
  pushHistory(o, "Pausada", "Se pausó la producción.");
  $q.notify({ message: "Orden pausada.", color: "orange", position: "top" });
}

function finishOrder(orderId) {
  const o = orders.value.find((x) => x.id === orderId);
  if (!o) return;

  if (o.status === "DONE" || o.status === "CANCELED") return;

  $q.dialog({
    title: "Finalizar orden",
    message: "¿Seguro que deseas finalizar esta orden?",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    o.status = "DONE";
    o.finishedAt = `${todayYMD()} ${nowTime()}`;
    pushHistory(o, "Finalizada", "Orden finalizada (simulado).");
    $q.notify({ message: "Orden finalizada.", color: "positive", position: "top" });
  });
}

function cancelOrder(orderId) {
  const o = orders.value.find((x) => x.id === orderId);
  if (!o) return;

  if (o.status === "DONE") {
    return $q.notify({ message: "No puedes cancelar una orden finalizada.", color: "negative", position: "top" });
  }

  $q.dialog({
    title: "Cancelar orden",
    message: "Esto marcará la OT como cancelada (simulado).",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    o.status = "CANCELED";
    pushHistory(o, "Cancelada", "Orden cancelada (simulado).");
    $q.notify({ message: "Orden cancelada.", color: "negative", position: "top" });
  });
}

function resetOrder(orderId) {
  const o = orders.value.find((x) => x.id === orderId);
  if (!o) return;

  $q.dialog({
    title: "Resetear orden",
    message: "Volverá a cola, pondrá producido/merma en 0 (simulado).",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    o.status = "QUEUED";
    o.producedQty = 0;
    o.scrapQty = 0;
    o.startedAt = undefined;
    o.finishedAt = undefined;
    o.requiredMaterials.forEach((rm) => (rm.consumed = 0));
    o.checklist.forEach((c) => (c.done = false));
    o.history = [{ id: uid("h"), title: "Reseteada", when: `${todayYMD()} · ${nowTime()}`, note: "Se reseteó la orden." }];
    clearProdForm();
    $q.notify({ message: "Orden reseteada.", color: "primary", position: "top" });
  });
}

function consumeMaterial(orderId, rowId, qty) {
  const o = orders.value.find((x) => x.id === orderId);
  if (!o) return;

  if (o.status === "DONE" || o.status === "CANCELED") return;

  const rm = o.requiredMaterials.find((x) => x.rowId === rowId);
  if (!rm) return;

  const m = materials.value.find((x) => x.id === rm.materialId);
  if (!m) return;

  const q = round2(Number(qty) || 0);
  if (q <= 0) return notifyErr("Cantidad inválida.");

  const requiredBase = (Number(rm.qtyPerUnit) || 0) * (Number(o.plannedQty) || 0);
  const requiredTotal = round2(requiredBase * (1 + (Number(rm.wastePct) || 0) / 100));
  const remaining = round2(Math.max(0, requiredTotal - (Number(rm.consumed) || 0)));

  if (q > remaining) return notifyErr("No puedes consumir más que lo restante.");
  if (q > m.stock) return notifyErr("Stock insuficiente.");

  rm.consumed = round2((Number(rm.consumed) || 0) + q);
  m.stock = round2(m.stock - q);

  pushHistory(o, "Consumo de material", `Consumido: ${q} ${m.unit} de ${m.name}.`);
  $q.notify({ message: "Material consumido.", color: "positive", position: "top" });
}

function autoConsumeAll(orderId) {
  const o = orders.value.find((x) => x.id === orderId);
  if (!o) return;

  if (o.status === "DONE" || o.status === "CANCELED") return;

  // intenta consumir lo restante donde alcance stock
  let any = false;

  for (const rm of o.requiredMaterials) {
    const m = materials.value.find((x) => x.id === rm.materialId);
    if (!m) continue;

    const requiredBase = (Number(rm.qtyPerUnit) || 0) * (Number(o.plannedQty) || 0);
    const requiredTotal = round2(requiredBase * (1 + (Number(rm.wastePct) || 0) / 100));
    const remaining = round2(Math.max(0, requiredTotal - (Number(rm.consumed) || 0)));

    if (remaining <= 0) continue;

    const can = Math.min(remaining, m.stock);
    if (can <= 0) continue;

    rm.consumed = round2((Number(rm.consumed) || 0) + can);
    m.stock = round2(m.stock - can);
    any = true;
  }

  if (!any) return $q.notify({ message: "No hay nada que consumir o no hay stock.", color: "orange", position: "top" });

  pushHistory(o, "Auto-consumo", "Se consumió lo máximo posible según stock actual.");
  $q.notify({ message: "Auto-consumo aplicado.", color: "primary", position: "top" });
}

function registerProduction(orderId) {
  const o = orders.value.find((x) => x.id === orderId);
  if (!o) return;

  if (o.status === "DONE" || o.status === "CANCELED") return;

  const producedNow = Math.max(0, Math.floor(Number(prodForm.producedNow) || 0));
  const scrapNow = Math.max(0, Math.floor(Number(prodForm.scrapNow) || 0));
  if (producedNow <= 0 && scrapNow <= 0) return notifyErr("Registra al menos producido o merma.");

  // actualizar orden
  o.producedQty = Math.max(0, o.producedQty + producedNow);
  o.scrapQty = Math.max(0, o.scrapQty + scrapNow);

  // sumar inventario de producto
  const p = products.value.find((x) => x.id === o.productId);
  if (p) p.stock = Math.max(0, p.stock + producedNow);

  pushHistory(
    o,
    "Registro de producción",
    `Producido: ${producedNow} · Merma: ${scrapNow}${prodForm.note ? ` · Nota: ${prodForm.note}` : ""}`
  );

  clearProdForm();
  $q.notify({ message: "Producción registrada.", color: "positive", position: "top" });
}

function clearProdForm() {
  prodForm.producedNow = 0;
  prodForm.scrapNow = 0;
  prodForm.note = "";
}

function logChecklist(orderId, item) {
  const o = orders.value.find((x) => x.id === orderId);
  if (!o) return;

  pushHistory(o, "Checklist", `${item.done ? "Completado" : "Desmarcado"}: ${item.title}`);
}

function completeAllChecklist(orderId) {
  const o = orders.value.find((x) => x.id === orderId);
  if (!o) return;

  o.checklist.forEach((c) => (c.done = true));
  pushHistory(o, "Checklist", "Se marcó todo como completado.");
  $q.notify({ message: "Checklist completado.", color: "primary", position: "top" });
}

/** -------------------- Meta edit dialog -------------------- */
const metaDlg = reactive({
  open: false,
  orderId: "",
  form: {
    clientName: "",
    productName: "",
    plannedQty: 0,
    priority: "Media" ,
  },
});

function openEditMeta(o) {
  metaDlg.open = true;
  metaDlg.orderId = o.id;
  metaDlg.form.clientName = o.clientName;
  metaDlg.form.productName = o.productName;
  metaDlg.form.plannedQty = o.plannedQty;
  metaDlg.form.priority = o.priority;
}

function saveMeta() {
  const o = orders.value.find((x) => x.id === metaDlg.orderId);
  if (!o) return;

  o.clientName = metaDlg.form.clientName.trim() || o.clientName;
  o.productName = metaDlg.form.productName.trim() || o.productName;
  o.plannedQty = Math.max(0, Math.floor(Number(metaDlg.form.plannedQty) || o.plannedQty));
  o.priority = metaDlg.form.priority;

  pushHistory(o, "Edición", "Se actualizaron datos de la OT.");
  metaDlg.open = false;
  $q.notify({ message: "Datos actualizados.", color: "positive", position: "top" });
}

/** -------------------- Helpers -------------------- */
function statusLabel(s) {
  switch (s) {
    case "QUEUED": return "EN COLA";
    case "IN_PROGRESS": return "EN PROGRESO";
    case "PAUSED": return "PAUSADA";
    case "DONE": return "FINALIZADA";
    case "CANCELED": return "CANCELADA";
  }
}
function statusColor(s) {
  switch (s) {
    case "QUEUED": return "grey";
    case "IN_PROGRESS": return "primary";
    case "PAUSED": return "orange";
    case "DONE": return "green";
    case "CANCELED": return "negative";
  }
}
function statusIcon(s) {
  switch (s) {
    case "QUEUED": return "schedule";
    case "IN_PROGRESS": return "precision_manufacturing";
    case "PAUSED": return "pause_circle";
    case "DONE": return "check_circle";
    case "CANCELED": return "block";
  }
}

function materialName(id) {
  return materials.value.find((x) => x.id === id)?.name || "—";
}

function pushHistory(o, title, note) {
  o.history.unshift({
    id: uid("h"),
    title,
    when: `${todayYMD()} · ${nowTime()}`,
    note,
  });
}

function infoMaterials() {
  $q.dialog({
    title: "Consumo de materiales",
    message:
      "El requerido total se calcula con (qty por unidad × planificado) y se aplica merma%. Luego consumes y se descuenta del inventario mock.",
    ok: true,
  });
}

function notifyErr(msg) {
  $q.notify({ message: msg, color: "negative", position: "top" });
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function nowTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
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
