<template>
  <q-page class="q-pa-md">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Inventario de materiales</div>
        <div class="text-grey-7">
          Control de stock y movimientos (simulado).
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-input
            outlined
            dense
            debounce="250"
            v-model="filters.search"
            placeholder="Buscar material…"
            style="min-width: 260px"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
            <template #append>
              <q-btn
                v-if="filters.search"
                flat
                dense
                round
                icon="close"
                @click="filters.search = ''"
              />
            </template>
          </q-input>

          <q-select
            outlined
            dense
            v-model="filters.warehouseId"
            :options="warehouseOptions"
            label="Almacén"
            emit-value
            map-options
            style="min-width: 160px"
          />

          <q-toggle
            v-model="filters.onlyLow"
            label="Solo bajo stock"
          />

          <q-btn
            unelevated
            color="primary"
            icon="swap_horiz"
            label="Registrar movimiento"
            @click="openMovementDialog()"
          />
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- KPI -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="inventory_2" size="34px" class="text-primary" />
            <div class="col">
              <div class="text-caption text-grey-7">Materiales</div>
              <div class="text-h6 text-weight-bold">{{ kpi.totalMaterials }}</div>
              <div class="text-caption text-grey-7">Total registrados</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="warning_amber" size="34px" class="text-negative" />
            <div class="col">
              <div class="text-caption text-grey-7">Bajo stock</div>
              <div class="text-h6 text-weight-bold">{{ kpi.lowStock }}</div>
              <div class="text-caption text-grey-7">Requieren compra</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="attach_money" size="34px" class="text-primary" />
            <div class="col">
              <div class="text-caption text-grey-7">Valor estimado</div>
              <div class="text-h6 text-weight-bold">{{ money(kpi.estimatedValue) }}</div>
              <div class="text-caption text-grey-7">Stock × costo prom.</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="receipt_long" size="34px" class="text-primary" />
            <div class="col">
              <div class="text-caption text-grey-7">Movimientos (7 días)</div>
              <div class="text-h6 text-weight-bold">{{ kpi.weekMovements }}</div>
              <div class="text-caption text-grey-7">Entradas/salidas/ajustes</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- TABLE -->
    <q-card bordered class="bg-white rounded-borders q-mt-md">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Materiales</div>
          <div class="text-caption text-grey-7">
            Click en un material para ver detalle + kardex.
          </div>
        </div>

        <q-badge outline color="primary">
          {{ filteredMaterials.length }} visibles
        </q-badge>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <q-table
          flat
          :rows="filteredMaterials"
          :columns="columns"
          row-key="id"
          :rows-per-page-options="[10, 20, 50]"
          :pagination="{ rowsPerPage: 10 }"
          class="rounded-table"
          @row-click="(_, row) => openMaterial(row.id)"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.row.isLow ? 'negative' : 'primary'">
                {{ props.row.isLow ? 'BAJO' : 'OK' }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-stock="props">
            <q-td :props="props">
              <div class="text-weight-bold">
                {{ props.row.stock }} {{ props.row.unit }}
              </div>
              <div class="text-caption text-grey-7">
                Min: {{ props.row.min }} {{ props.row.unit }}
              </div>
              <q-linear-progress
                :value="Math.min(1, props.row.stock / Math.max(1, props.row.min))"
                class="q-mt-xs"
              />
            </q-td>
          </template>

          <template #body-cell-cost="props">
            <q-td :props="props">
              <div class="text-weight-bold">{{ money(props.row.avgCost) }}</div>
              <div class="text-caption text-grey-7">costo prom.</div>
            </q-td>
          </template>

          <template #body-cell-lastMove="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.lastMove || '—' }}</div>
              <div class="text-caption text-grey-7">{{ props.row.lastRef || '' }}</div>
            </q-td>
          </template>

          <template #no-data>
            <div class="q-pa-md text-grey-7">
              No hay materiales para mostrar con estos filtros.
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- MATERIAL DETAIL -->
    <q-dialog v-model="materialDlg.open" persistent maximized>
      <q-card class="bg-grey-1">
        <q-card-section class="row items-center justify-between bg-white">
          <div>
            <div class="text-h6 text-weight-bold">
              {{ selectedMaterial?.name || "Material" }}
            </div>
            <div class="text-caption text-grey-7">
              Unidad: {{ selectedMaterial?.unit || "—" }} ·
              Stock total: {{ totalStockSelected }} {{ selectedMaterial?.unit || "" }}
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-badge
              v-if="selectedMaterial"
              :color="isLowSelected ? 'negative' : 'primary'"
              outline
            >
              {{ isLowSelected ? "BAJO STOCK" : "OK" }}
            </q-badge>

            <q-btn
              outline
              icon="swap_horiz"
              label="Movimiento"
              @click="openMovementDialog(selectedMaterial?.id)"
            />

            <q-btn dense flat round icon="close" @click="materialDlg.open = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md">
            <!-- LEFT -->
            <div class="col-12 col-lg-8">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="row items-center justify-between">
                    <div>
                      <div class="text-subtitle1 text-weight-bold">Detalle</div>
                      <div class="text-caption text-grey-7">
                        Resumen y movimientos del material.
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section>
                  <q-tabs v-model="materialDlg.tab" dense class="text-grey-8">
                    <q-tab name="overview" label="Resumen" icon="info" />
                    <q-tab name="kardex" label="Kardex" icon="receipt_long" />
                    <q-tab name="moves" label="Movimientos" icon="sync_alt" />
                  </q-tabs>

                  <q-separator class="q-my-sm" />

                  <q-tab-panels v-model="materialDlg.tab" animated>
                    <!-- OVERVIEW -->
                    <q-tab-panel name="overview">
                      <div class="row q-col-gutter-md">
                        <div class="col-12 col-md-6">
                          <q-card bordered flat class="bg-grey-1 rounded-borders q-pa-sm">
                            <div class="text-caption text-grey-7">Stock total</div>
                            <div class="text-h6 text-weight-bold">
                              {{ totalStockSelected }} {{ selectedMaterial?.unit || "" }}
                            </div>
                            <div class="text-caption text-grey-7">
                              Mínimo sugerido: {{ selectedMaterial?.min || 0 }} {{ selectedMaterial?.unit || "" }}
                            </div>
                          </q-card>
                        </div>

                        <div class="col-12 col-md-6">
                          <q-card bordered flat class="bg-grey-1 rounded-borders q-pa-sm">
                            <div class="text-caption text-grey-7">Costo promedio</div>
                            <div class="text-h6 text-weight-bold">
                              {{ money(selectedMaterial?.avgCost || 0) }}
                            </div>
                            <div class="text-caption text-grey-7">
                              Valor estimado: {{ money((selectedMaterial?.avgCost || 0) * totalStockSelected) }}
                            </div>
                          </q-card>
                        </div>

                        <div class="col-12">
                          <div class="text-subtitle2 text-weight-bold q-mb-sm">
                            Existencias por almacén
                          </div>

                          <q-card
                            v-for="w in warehouses"
                            :key="w.id"
                            bordered
                            flat
                            class="q-pa-sm rounded-borders q-mb-sm"
                          >
                            <div class="row items-center justify-between">
                              <div>
                                <div class="text-weight-medium">{{ w.name }}</div>
                                <div class="text-caption text-grey-7">
                                  Stock: {{ stockInWarehouse(selectedMaterial?.id, w.id) }} {{ selectedMaterial?.unit || "" }}
                                </div>
                              </div>

                              <q-badge outline color="primary">
                                {{ stockInWarehouse(selectedMaterial?.id, w.id) }}
                              </q-badge>
                            </div>
                          </q-card>
                        </div>
                      </div>
                    </q-tab-panel>

                    <!-- KARDEX -->
                    <q-tab-panel name="kardex">
                      <q-table
                        flat
                        :rows="kardexRows"
                        :columns="kardexColumns"
                        row-key="id"
                        :rows-per-page-options="[10, 20, 50]"
                        :pagination="{ rowsPerPage: 10 }"
                        class="rounded-table"
                      >
                        <template #body-cell-type="props">
                          <q-td :props="props">
                            <q-badge :color="moveTypeColor(props.row.type)">
                              {{ props.row.type }}
                            </q-badge>
                          </q-td>
                        </template>

                        <template #body-cell-qty="props">
                          <q-td :props="props">
                            <span class="text-weight-bold">{{ props.row.qty }}</span>
                            <span class="text-grey-7"> {{ selectedMaterial?.unit || "" }}</span>
                          </q-td>
                        </template>

                        <template #body-cell-balance="props">
                          <q-td :props="props">
                            <span class="text-weight-bold">{{ props.row.balance }}</span>
                            <span class="text-grey-7"> {{ selectedMaterial?.unit || "" }}</span>
                          </q-td>
                        </template>

                        <template #no-data>
                          <div class="q-pa-md text-grey-7">
                            No hay movimientos para este material.
                          </div>
                        </template>
                      </q-table>
                    </q-tab-panel>

                    <!-- MOVES -->
                    <q-tab-panel name="moves">
                      <div class="row items-center justify-between q-mb-sm">
                        <div class="text-caption text-grey-7">
                          Lista simple de movimientos (sin balance).
                        </div>
                        <q-btn
                          outline
                          icon="add"
                          label="Nuevo movimiento"
                          @click="openMovementDialog(selectedMaterial?.id)"
                        />
                      </div>

                      <q-card
                        v-for="m in selectedMoves"
                        :key="m.id"
                        bordered
                        flat
                        class="q-pa-sm rounded-borders q-mb-sm"
                      >
                        <div class="row items-center justify-between">
                          <div>
                            <div class="text-weight-medium">
                              <q-badge :color="moveTypeColor(m.type)" class="q-mr-sm">
                                {{ m.type }}
                              </q-badge>
                              {{ m.ref || "Sin referencia" }}
                            </div>
                            <div class="text-caption text-grey-7">
                              {{ m.date }} · Almacén: {{ warehouseName(m.warehouseId) }} ·
                              Por: {{ m.by || "—" }}
                            </div>
                            <div class="text-caption text-grey-7" v-if="m.note">
                              Nota: {{ m.note }}
                            </div>
                          </div>

                          <div class="text-right">
                            <div class="text-weight-bold">
                              {{ signedQty(m.type, m.qty) }} {{ selectedMaterial?.unit || "" }}
                            </div>
                            <div class="text-caption text-grey-7">
                              Costo: {{ money(m.cost || 0) }}
                            </div>
                          </div>
                        </div>
                      </q-card>

                      <div v-if="!selectedMoves.length" class="text-grey-7 text-caption q-pa-sm">
                        No hay movimientos registrados.
                      </div>
                    </q-tab-panel>
                  </q-tab-panels>
                </q-card-section>
              </q-card>
            </div>

            <!-- RIGHT -->
            <div class="col-12 col-lg-4">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">Acciones rápidas</div>
                  <div class="text-caption text-grey-7">
                    Operaciones comunes para este material.
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="q-gutter-sm">
                  <q-btn
                    class="full-width"
                    outline
                    icon="call_received"
                    label="Entrada"
                    @click="openMovementDialog(selectedMaterial?.id, 'ENTRY')"
                  />
                  <q-btn
                    class="full-width"
                    outline
                    icon="call_made"
                    label="Salida"
                    @click="openMovementDialog(selectedMaterial?.id, 'EXIT')"
                  />
                  <q-btn
                    class="full-width"
                    outline
                    icon="tune"
                    label="Ajuste"
                    @click="openMovementDialog(selectedMaterial?.id, 'ADJUST')"
                  />

                  <q-separator />

                  <q-banner class="bg-grey-2 rounded-borders">
                    <div class="text-caption text-grey-7">
                      Todo esto es hardcode. Luego lo conectamos a Pinia + API
                      para que el inventario sea global.
                    </div>
                  </q-banner>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- MOVEMENT DIALOG -->
    <q-dialog v-model="moveDlg.open" persistent>
      <q-card class="rounded-borders" style="min-width: 520px; max-width: 95vw;">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-subtitle1 text-weight-bold">Registrar movimiento</div>
            <div class="text-caption text-grey-7">
              Entrada / salida / ajuste (simulado).
            </div>
          </div>
          <q-btn dense flat round icon="close" @click="moveDlg.open = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-md q-pa-lg">
            <div class="col-12 col-md-6">
              <q-select
                outlined
                dense
                v-model="moveDlg.form.type"
                :options="moveTypeOptions"
                label="Tipo"
                emit-value
                map-options
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                dense
                v-model="moveDlg.form.date"
                label="Fecha"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="moveDlg.form.date" mask="YYYY-MM-DD" minimal>
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Cerrar" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-12">
              <q-select
                outlined
                dense
                v-model="moveDlg.form.materialId"
                :options="materialOptions"
                label="Material"
                emit-value
                map-options
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                outlined
                dense
                v-model="moveDlg.form.warehouseId"
                :options="warehouseOptionsOnly"
                label="Almacén"
                emit-value
                map-options
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                dense
                type="number"
                v-model.number="moveDlg.form.qty"
                label="Cantidad"
                min="0"
                step="0.01"
              />
              <div class="text-caption text-grey-7 q-mt-xs">
                Unidad: {{ selectedUnitForMove }}
              </div>
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                dense
                type="number"
                v-model.number="moveDlg.form.cost"
                label="Costo unitario"
                min="0"
                step="0.01"
                prefix="$"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                dense
                v-model="moveDlg.form.ref"
                label="Referencia"
                placeholder="Ej: COMP-00019 / ENS-00012"
              />
            </div>

            <div class="col-12">
              <q-input
                outlined
                dense
                type="textarea"
                v-model="moveDlg.form.note"
                label="Nota"
                autogrow
              />
            </div>

            <div class="col-12">
              <q-banner class="bg-grey-2 rounded-borders">
                <div class="text-caption text-grey-7">
                  Stock actual en el almacén:
                  <b>{{ currentWarehouseStockForMove }}</b>
                  {{ selectedUnitForMove }}
                </div>
              </q-banner>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            unelevated
            color="primary"
            label="Guardar"
            icon="save"
            @click="saveMovement()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();

/** Mock warehouses */
const warehouses = ref([
  { id: "w_all", name: "Todos" },
  { id: "w1", name: "Almacén principal" },
  { id: "w2", name: "Producción" },
]);

/** Materials (base info) */
const materials = ref([
  { id: "m1", name: "Resina epóxica", unit: "kg", min: 12, avgCost: 420 },
  { id: "m2", name: "Tornillos 2cm", unit: "caja", min: 5, avgCost: 180 },
  { id: "m3", name: "Lija fina", unit: "unidad", min: 15, avgCost: 35 },
  { id: "m4", name: "Pegamento industrial", unit: "unidad", min: 3, avgCost: 250 },
]);

/** Stock per warehouse */
const stockByWarehouse = ref([
  { materialId: "m1", warehouseId: "w1", stock: 4 },
  { materialId: "m1", warehouseId: "w2", stock: 2 },

  { materialId: "m2", warehouseId: "w1", stock: 2 },
  { materialId: "m2", warehouseId: "w2", stock: 0 },

  { materialId: "m3", warehouseId: "w1", stock: 7 },
  { materialId: "m3", warehouseId: "w2", stock: 2 },

  { materialId: "m4", warehouseId: "w1", stock: 1 },
  { materialId: "m4", warehouseId: "w2", stock: 0 },
]);

/** Movements */
const movements = ref([
  {
    id: "mv1",
    date: todayMinus(0),
    type: "ENTRY",
    materialId: "m1",
    warehouseId: "w1",
    qty: 6,
    cost: 410,
    ref: "COMP-00018",
    note: "Compra confirmada",
    by: "Romantiezer",
  },
  {
    id: "mv2",
    date: todayMinus(1),
    type: "EXIT",
    materialId: "m1",
    warehouseId: "w2",
    qty: 2,
    cost: 0,
    ref: "ENS-00055",
    note: "Consumo en producción",
    by: "Juan",
  },
  {
    id: "mv3",
    date: todayMinus(1),
    type: "ENTRY",
    materialId: "m3",
    warehouseId: "w1",
    qty: 10,
    cost: 30,
    ref: "COMP-00017",
    note: "",
    by: "María",
  },
  {
    id: "mv4",
    date: todayMinus(3),
    type: "ADJUST",
    materialId: "m4",
    warehouseId: "w1",
    qty: 1,
    cost: 0,
    ref: "AJ-0003",
    note: "Ajuste por conteo físico",
    by: "Romantiezer",
  },
]);

/** Filters */
const filters = reactive({
  search: "",
  warehouseId: "w_all",
  onlyLow: false,
});

/** Table columns */
const columns = [
  { name: "name", label: "Material", field: "name", align: "left", sortable: true },
  { name: "unit", label: "Unidad", field: "unit", align: "left", sortable: true },
  { name: "stock", label: "Stock", field: "stock", align: "left", sortable: false },
  { name: "status", label: "Estado", field: "status", align: "left", sortable: false },
  { name: "cost", label: "Costo", field: "avgCost", align: "left", sortable: true },
  { name: "lastMove", label: "Último mov.", field: "lastMove", align: "left", sortable: false },
];

/** Options */
const warehouseOptions = computed(() =>
  warehouses.value.map((w) => ({ label: w.name, value: w.id }))
);
const warehouseOptionsOnly = computed(() =>
  warehouses.value
    .filter((w) => w.id !== "w_all")
    .map((w) => ({ label: w.name, value: w.id }))
);

const materialOptions = computed(() =>
  materials.value.map((m) => ({ label: m.name, value: m.id }))
);

const moveTypeOptions = [
  { label: "Entrada", value: "ENTRY" },
  { label: "Salida", value: "EXIT" },
  { label: "Ajuste (+/-)", value: "ADJUST" },
];

/** Computed material rows for the table */
const enrichedMaterials = computed(() => {
  return materials.value.map((m) => {
    const stock = totalStock(m.id, filters.warehouseId);
    const isLow = stock <= m.min;

    const last = lastMovement(m.id);
    return {
      ...m,
      stock,
      isLow,
      lastMove: last?.date || "",
      lastRef: last?.ref || "",
    };
  });
});

const filteredMaterials = computed(() => {
  const q = filters.search.trim().toLowerCase();
  return enrichedMaterials.value.filter((m) => {
    if (filters.onlyLow && !m.isLow) return false;

    if (q) {
      const match =
        m.name.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
});

/** KPI */
const kpi = computed(() => {
  const low = enrichedMaterials.value.filter((m) => m.isLow).length;

  const estimatedValue = enrichedMaterials.value.reduce((sum, m) => {
    return sum + (Number(m.stock) || 0) * (Number(m.avgCost) || 0);
  }, 0);

  // movimientos de los últimos 7 días (simple)
  const weekMovements = movements.value.filter((mv) => daysDiff(mv.date, todayYMD()) <= 7).length;

  return {
    totalMaterials: materials.value.length,
    lowStock: low,
    estimatedValue,
    weekMovements,
  };
});

/** Material detail dialog */
const materialDlg = reactive({
  open: false,
  materialId: "",
  tab: "overview",
});

const selectedMaterial = computed(() =>
  materials.value.find((m) => m.id === materialDlg.materialId) || null
);

const totalStockSelected = computed(() => {
  if (!selectedMaterial.value) return 0;
  return totalStock(selectedMaterial.value.id, "w_all");
});

const isLowSelected = computed(() => {
  if (!selectedMaterial.value) return false;
  return totalStockSelected.value <= selectedMaterial.value.min;
});

const selectedMoves = computed(() => {
  const mid = materialDlg.materialId;
  return movements.value
    .filter((mv) => mv.materialId === mid)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));
});

/** Kardex */
const kardexColumns = [
  { name: "date", label: "Fecha", field: "date", align: "left", sortable: true },
  { name: "type", label: "Tipo", field: "type", align: "left", sortable: true },
  { name: "ref", label: "Ref", field: "ref", align: "left", sortable: false },
  { name: "qty", label: "Cantidad", field: "qty", align: "left", sortable: false },
  { name: "balance", label: "Balance", field: "balance", align: "left", sortable: false },
];

const kardexRows = computed(() => {
  const mid = materialDlg.materialId;
  const list = movements.value
    .filter((mv) => mv.materialId === mid)
    .slice()
    .sort((a, b) => (a.date > b.date ? 1 : -1)); // asc para calcular balance

  let balance = 0;
  const rows = list.map((mv) => {
    const signed = signedQtyNumber(mv.type, mv.qty);
    balance = round2(balance + signed);

    return {
      id: mv.id,
      date: mv.date,
      type: mv.type,
      ref: mv.ref,
      qty: round2(mv.qty),
      balance: round2(balance),
    };
  });

  // Mostrar desc (más reciente arriba)
  return rows.reverse();
});

/** Movement dialog */
const moveDlg = reactive({
  open: false,
  form: emptyMoveForm(),
});

const selectedUnitForMove = computed(() => {
  const m = materials.value.find((x) => x.id === moveDlg.form.materialId);
  return m?.unit || "";
});

const currentWarehouseStockForMove = computed(() => {
  const mid = moveDlg.form.materialId;
  const wid = moveDlg.form.warehouseId;
  if (!mid || !wid) return 0;
  return stockInWarehouse(mid, wid);
});

/** Actions */
function openMaterial(materialId) {
  materialDlg.open = true;
  materialDlg.materialId = materialId;
  materialDlg.tab = "overview";
}

function openMovementDialog(materialId, type) {
  moveDlg.open = true;
  moveDlg.form = emptyMoveForm();

  if (materialId) moveDlg.form.materialId = materialId;
  if (type) moveDlg.form.type = type;

  // default warehouse: principal
  moveDlg.form.warehouseId = "w1";

  // default cost: material avg
  if (moveDlg.form.materialId) {
    const m = materials.value.find((x) => x.id === moveDlg.form.materialId);
    if (m) moveDlg.form.cost = m.avgCost;
  }
}

function saveMovement() {
  const f = moveDlg.form;

  if (!f.type) return notifyErr("Tipo requerido");
  if (!f.date) return notifyErr("Fecha requerida");
  if (!f.materialId) return notifyErr("Material requerido");
  if (!f.warehouseId) return notifyErr("Almacén requerido");

  const qty = Number(f.qty) || 0;
  if (qty <= 0) return notifyErr("Cantidad inválida");

  // Validar stock si es salida
  if (f.type === "EXIT") {
    const curr = stockInWarehouse(f.materialId, f.warehouseId);
    if (qty > curr) return notifyErr(`Stock insuficiente. Disponible: ${curr}`);
  }

  // Ajuste: permitimos que qty represente “cambio absoluto” con signo vía selector simple:
  // - ENTRY suma
  // - EXIT resta
  // - ADJUST suma o resta según toggle "adjustSign"
  // Para simplificar: ADJUST usa el campo adjustSign
  let signed = signedQtyNumber(f.type, qty, f.adjustSign);

  // Impactar stock por almacén
  setStockInWarehouse(f.materialId, f.warehouseId, round2(stockInWarehouse(f.materialId, f.warehouseId) + signed));

  // Registrar movimiento
  movements.value.push({
    id: uid("mv"),
    date: f.date,
    type: f.type,
    materialId: f.materialId,
    warehouseId: f.warehouseId,
    qty: round2(qty),
    cost: round2(Number(f.cost) || 0),
    ref: f.ref || "",
    note: f.note || "",
    by: f.by || "Romantiezer",
  });

  // Si es entrada y trae costo, refrescar avgCost (simple: promedio entre actual y nuevo)
  const mat = materials.value.find((m) => m.id === f.materialId);
  if (mat && f.type === "ENTRY" && (Number(f.cost) || 0) > 0) {
    mat.avgCost = round2((mat.avgCost + Number(f.cost)) / 2);
  }

  moveDlg.open = false;
  $q.notify({ message: "Movimiento guardado (simulado).", color: "positive", position: "top" });
}

/** Utils */
function emptyMoveForm() {
  return {
    type: "ENTRY",
    date: todayYMD(),
    materialId: "",
    warehouseId: "w1",
    qty: 1,
    cost: 0,
    ref: "",
    note: "",
    by: "Romantiezer",
    adjustSign: -1, // para ADJUST: -1 resta, +1 suma
  };
}

function notifyErr(msg) {
  $q.notify({ message: msg, color: "negative", position: "top" });
}

function moveTypeColor(t) {
  switch (t) {
    case "ENTRY": return "green";
    case "EXIT": return "negative";
    case "ADJUST": return "orange";
    default: return "grey";
  }
}

function warehouseName(id) {
  return warehouses.value.find((w) => w.id === id)?.name || "—";
}

function signedQty(type, qty) {
  const n = signedQtyNumber(type, qty);
  const sign = n >= 0 ? "+" : "";
  return `${sign}${round2(n)}`;
}

function signedQtyNumber(type, qty, adjustSign) {
  const q = Number(qty) || 0;
  if (type === "ENTRY") return q;
  if (type === "EXIT") return -q;
  // ADJUST
  return adjustSign === 1 ? q : -q;
}

function totalStock(materialId, warehouseId) {
  if (warehouseId && warehouseId !== "w_all") {
    return stockInWarehouse(materialId, warehouseId);
  }
  return stockByWarehouse.value
    .filter((x) => x.materialId === materialId && x.warehouseId !== "w_all")
    .reduce((sum, x) => sum + (Number(x.stock) || 0), 0);
}

function stockInWarehouse(materialId, warehouseId) {
  const row = stockByWarehouse.value.find(
    (x) => x.materialId === materialId && x.warehouseId === warehouseId
  );
  return row ? Number(row.stock) || 0 : 0;
}

function setStockInWarehouse(materialId, warehouseId, newStock) {
  let row = stockByWarehouse.value.find(
    (x) => x.materialId === materialId && x.warehouseId === warehouseId
  );
  if (!row) {
    row = { materialId, warehouseId, stock: 0 };
    stockByWarehouse.value.push(row);
  }
  row.stock = Math.max(0, round2(newStock));
}

function stockInWarehouseForSelected(materialId, warehouseId) {
  if (!materialId) return 0;
  return stockInWarehouse(materialId, warehouseId);
}
function stockInWarehouseProxy(materialId, warehouseId) {
  return stockInWarehouseForSelected(materialId, warehouseId);
}
// alias usado en template:
const stockInWarehouseFn = stockInWarehouseProxy;
// para evitar confusión en template:
function stockInWarehouseTpl(materialId, warehouseId) {
  return stockInWarehouseForSelected(materialId, warehouseId);
}
const stockInWarehouseComputed = stockInWarehouseTpl;

// en template usamos stockInWarehouse(selectedMaterial?.id, w.id) directamente,
// así que dejamos helper:
function stockInWarehouseSelected(materialId, warehouseId) {
  return stockInWarehouse(String(materialId || ""), String(warehouseId || ""));
}
// map a nombre requerido
// const stockInWarehouse = stockInWarehouseSelected;

function lastMovement(materialId) {
  const list = movements.value
    .filter((mv) => mv.materialId === materialId)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return list[0] || null;
}

function money(n) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
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

function todayMinus(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function daysDiff(a, b) {
  // a y b: YYYY-MM-DD
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  const diff = Math.abs(db.getTime() - da.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
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
