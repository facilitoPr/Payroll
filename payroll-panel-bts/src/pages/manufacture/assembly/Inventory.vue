<template>
  <q-page class="q-pa-md">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Inventario de productos</div>
        <div class="text-grey-7">
          Controla existencias de productos manufacturados (simulado).
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-input
            outlined
            dense
            debounce="250"
            v-model="filters.search"
            placeholder="Buscar SKU, nombre, categoría…"
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
            v-model="filters.stock"
            :options="stockOptions"
            emit-value
            map-options
            label="Filtro"
            style="min-width: 170px"
          />

          <q-btn
            unelevated
            color="primary"
            icon="add"
            label="Nuevo producto"
            @click="openCreate()"
          />

          <q-btn flat round icon="more_vert">
            <q-menu>
              <q-list style="min-width: 220px">
                <q-item clickable v-close-popup @click="fakeExport()">
                  <q-item-section avatar><q-icon name="download" /></q-item-section>
                  <q-item-section>Exportar</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="fakeImport()">
                  <q-item-section avatar><q-icon name="upload" /></q-item-section>
                  <q-item-section>Importar</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="fakeRefresh()">
                  <q-item-section avatar><q-icon name="refresh" /></q-item-section>
                  <q-item-section>Refrescar</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- KPI -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="inventory" size="34px" class="text-primary" />
            <div class="col">
              <div class="text-caption text-grey-7">Productos</div>
              <div class="text-h6 text-weight-bold">{{ kpi.total }}</div>
              <div class="text-caption text-grey-7">Registrados</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="warning_amber" size="34px" class="text-orange" />
            <div class="col">
              <div class="text-caption text-grey-7">Bajo stock</div>
              <div class="text-h6 text-weight-bold">{{ kpi.low }}</div>
              <div class="text-caption text-grey-7">Stock ≤ mínimo</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="report" size="34px" class="text-negative" />
            <div class="col">
              <div class="text-caption text-grey-7">Sin stock</div>
              <div class="text-h6 text-weight-bold">{{ kpi.out }}</div>
              <div class="text-caption text-grey-7">Stock = 0</div>
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
              <div class="text-h6 text-weight-bold">{{ money(kpi.value) }}</div>
              <div class="text-caption text-grey-7">Stock × costo</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- MAIN GRID -->
    <div class="row q-col-gutter-md">
      <!-- PRODUCTS TABLE -->
      <div class="col-12 col-lg-8">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Productos</div>
              <div class="text-caption text-grey-7">
                Ajusta stock y consulta movimientos.
              </div>
            </div>
            <q-badge outline color="primary">
              {{ filteredProducts.length }} visibles
            </q-badge>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none">
            <q-table
              flat
              :rows="filteredProducts"
              :columns="columns"
              row-key="id"
              :rows-per-page-options="[10, 20, 50]"
              :pagination="{ rowsPerPage: 10 }"
              class="rounded-table"
            >
              <template #body-cell-name="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ props.row.name }}</div>
                  <div class="text-caption text-grey-7">
                    <q-badge outline color="primary" class="q-mr-xs">{{ props.row.sku }}</q-badge>
                    <span>{{ props.row.category }}</span>
                    <span class="q-ml-sm">·</span>
                    <span class="q-ml-sm">{{ props.row.location }}</span>
                  </div>
                </q-td>
              </template>

              <template #body-cell-stock="props">
                <q-td :props="props">
                  <div class="row items-center justify-between">
                    <div>
                      <div class="text-weight-bold">
                        {{ props.row.stock }} {{ props.row.unit }}
                      </div>
                      <div class="text-caption text-grey-7">
                        Mín: {{ props.row.min }} {{ props.row.unit }}
                      </div>
                    </div>

                    <q-badge :color="stockBadgeColor(props.row)">
                      {{ stockBadgeLabel(props.row) }}
                    </q-badge>
                  </div>

                  <q-linear-progress
                    :value="stockProgress(props.row)"
                    class="q-mt-sm"
                    rounded
                    style="height: 8px"
                  />
                </q-td>
              </template>

              <template #body-cell-cost="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ money(props.row.cost) }}</div>
                  <div class="text-caption text-grey-7">
                    Valor: {{ money(props.row.cost * props.row.stock) }}
                  </div>
                </q-td>
              </template>

              <template #body-cell-actions="props">
                <q-td :props="props" class="text-right">
                  <q-btn flat round dense icon="history" @click="openHistory(props.row)">
                    <q-tooltip>Movimientos</q-tooltip>
                  </q-btn>

                  <q-btn flat round dense icon="edit" @click="openEdit(props.row)">
                    <q-tooltip>Editar</q-tooltip>
                  </q-btn>

                  <q-btn
                    unelevated
                    color="primary"
                    dense
                    icon="add_circle"
                    label="Entrada"
                    class="q-ml-sm"
                    @click="openAdjust(props.row, 'IN')"
                  />

                  <q-btn
                    outline
                    color="negative"
                    dense
                    icon="remove_circle"
                    label="Salida"
                    class="q-ml-sm"
                    @click="openAdjust(props.row, 'OUT')"
                  />
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">
                  No hay productos para mostrar con este filtro.
                </div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <!-- RIGHT: ALERTS + GLOBAL MOVEMENTS -->
      <div class="col-12 col-lg-4">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Alertas</div>
              <div class="text-caption text-grey-7">Productos críticos.</div>
            </div>
            <q-icon name="notifications" class="text-primary" size="22px" />
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-sm">Bajo stock</div>

            <div v-if="lowStockProducts.length" class="q-gutter-sm">
              <q-card
                v-for="p in lowStockProducts"
                :key="p.id"
                bordered
                flat
                class="q-pa-sm rounded-borders"
              >
                <div class="row items-center justify-between">
                  <div>
                    <div class="text-weight-medium">{{ p.name }}</div>
                    <div class="text-caption text-grey-7">
                      {{ p.stock }} {{ p.unit }} · min {{ p.min }} {{ p.unit }}
                    </div>
                  </div>
                  <q-badge :color="stockBadgeColor(p)">{{ stockBadgeLabel(p) }}</q-badge>
                </div>
                <q-linear-progress :value="stockProgress(p)" class="q-mt-sm" rounded style="height: 8px" />
              </q-card>
            </div>

            <div v-else class="text-caption text-grey-7">
              No hay alertas.
            </div>
          </q-card-section>
        </q-card>

        <q-card bordered class="bg-white rounded-borders q-mt-md">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Movimientos recientes</div>
              <div class="text-caption text-grey-7">Historial general</div>
            </div>
            <q-badge outline color="primary">{{ movements.length }}</q-badge>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-gutter-sm">
            <q-card
              v-for="m in movements.slice(0, 8)"
              :key="m.id"
              bordered
              flat
              class="q-pa-sm rounded-borders"
            >
              <div class="row items-center justify-between">
                <div>
                  <div class="text-weight-medium">
                    {{ movementTitle(m.type) }}
                    <span class="text-grey-7">·</span>
                    <span class="text-grey-7">{{ m.productSku }}</span>
                  </div>
                  <div class="text-caption text-grey-7">
                    {{ m.when }} · {{ m.by }}
                  </div>
                </div>

                <q-badge :color="movementColor(m.type)">
                  {{ signedQty(m.type, m.qty) }} {{ m.unit }}
                </q-badge>
              </div>

              <div class="text-caption text-grey-7 q-mt-xs">
                {{ m.note }}
              </div>
            </q-card>

            <q-btn
              outline
              icon="open_in_new"
              label="Ver todos"
              class="full-width"
              @click="openAllMovements()"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- CREATE/EDIT DIALOG -->
    <q-dialog v-model="editDlg.open" persistent>
      <q-card style="width: 780px; max-width: 95vw" class="rounded-borders">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">
            {{ editDlg.mode === 'create' ? 'Nuevo producto' : 'Editar producto' }}
          </div>
          <q-btn dense flat round icon="close" @click="editDlg.open = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input outlined dense v-model="editDlg.form.name" label="Nombre" />
          </div>

          <div class="col-12 col-md-6">
            <q-input outlined dense v-model="editDlg.form.sku" label="SKU" />
          </div>

          <div class="col-12 col-md-6">
            <q-input outlined dense v-model="editDlg.form.category" label="Categoría" />
          </div>

          <div class="col-12 col-md-6">
            <q-input outlined dense v-model="editDlg.form.location" label="Ubicación" placeholder="Ej: Almacén A" />
          </div>

          <div class="col-12 col-md-4">
            <q-input outlined dense v-model="editDlg.form.unit" label="Unidad" placeholder="unidad" />
          </div>

          <div class="col-12 col-md-4">
            <q-input outlined dense type="number" v-model.number="editDlg.form.min" label="Stock mínimo" min="0" />
          </div>

          <div class="col-12 col-md-4">
            <q-input outlined dense type="number" v-model.number="editDlg.form.cost" label="Costo" min="0" step="0.01" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="row items-center justify-end q-gutter-sm">
          <q-btn flat label="Cancelar" @click="editDlg.open = false" />
          <q-btn unelevated color="primary" icon="save" label="Guardar" @click="saveProduct()" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- ADJUST DIALOG -->
    <q-dialog v-model="adjustDlg.open" persistent>
      <q-card style="width: 720px; max-width: 95vw" class="rounded-borders">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">
            {{ adjustDlg.type === 'IN' ? 'Entrada de stock' : 'Salida de stock' }}
            <span class="text-grey-7">— {{ adjustDlg.product?.sku }}</span>
          </div>
          <q-btn dense flat round icon="close" @click="adjustDlg.open = false" />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="adjustDlg.product" class="q-gutter-y-md">
          <q-banner class="bg-grey-2 rounded-borders">
            <div class="text-caption text-grey-7">
              Producto: <b>{{ adjustDlg.product.name }}</b> · Stock actual:
              <b>{{ adjustDlg.product.stock }} {{ adjustDlg.product.unit }}</b>
            </div>
          </q-banner>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                outlined
                dense
                type="number"
                v-model.number="adjustDlg.qty"
                label="Cantidad"
                min="0"
                step="1"
              />
            </div>

            <div class="col-12 col-md-8">
              <q-input
                outlined
                dense
                v-model="adjustDlg.note"
                label="Nota (opcional)"
                placeholder="Ej: Ajuste por conteo / producción / venta…"
              />
            </div>
          </div>

          <q-separator />

          <div class="row items-center justify-between">
            <div class="text-caption text-grey-7">
              Resultado:
              <b>{{ previewNewStock }} {{ adjustDlg.product.unit }}</b>
            </div>

            <div class="row q-gutter-sm">
              <q-btn flat label="Cancelar" @click="adjustDlg.open = false" />
              <q-btn
                unelevated
                :color="adjustDlg.type === 'IN' ? 'primary' : 'negative'"
                icon="done"
                label="Aplicar"
                @click="applyAdjust()"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- PRODUCT HISTORY DIALOG -->
    <q-dialog v-model="historyDlg.open" persistent>
      <q-card style="width: 980px; max-width: 98vw" class="rounded-borders">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">
            Movimientos —
            <span class="text-grey-7">{{ historyDlg.product?.sku }} · {{ historyDlg.product?.name }}</span>
          </div>
          <q-btn dense flat round icon="close" @click="historyDlg.open = false" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-table
            flat
            :rows="productMovements"
            :columns="movementColumns"
            row-key="id"
            :rows-per-page-options="[10, 20, 50]"
            :pagination="{ rowsPerPage: 10 }"
            class="rounded-table"
          >
            <template #body-cell-type="props">
              <q-td :props="props">
                <q-badge :color="movementColor(props.row.type)">
                  {{ movementTitle(props.row.type) }}
                </q-badge>
              </q-td>
            </template>

            <template #body-cell-qty="props">
              <q-td :props="props">
                <div class="text-weight-bold">
                  {{ signedQty(props.row.type, props.row.qty) }} {{ props.row.unit }}
                </div>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- ALL MOVEMENTS -->
    <q-dialog v-model="allMovDlg.open" persistent maximized>
      <q-card class="bg-grey-1">
        <q-card-section class="row items-center justify-between bg-white">
          <div>
            <div class="text-h6 text-weight-bold">Movimientos (general)</div>
            <div class="text-caption text-grey-7">Historial completo simulado.</div>
          </div>
          <q-btn dense flat round icon="close" @click="allMovDlg.open = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <q-table
            flat
            :rows="movements"
            :columns="movementColumnsGeneral"
            row-key="id"
            :rows-per-page-options="[20, 50, 100]"
            :pagination="{ rowsPerPage: 20 }"
            class="rounded-table"
          >
            <template #body-cell-type="props">
              <q-td :props="props">
                <q-badge :color="movementColor(props.row.type)">
                  {{ movementTitle(props.row.type) }}
                </q-badge>
              </q-td>
            </template>

            <template #body-cell-qty="props">
              <q-td :props="props">
                <div class="text-weight-bold">
                  {{ signedQty(props.row.type, props.row.qty) }} {{ props.row.unit }}
                </div>
              </q-td>
            </template>

            <template #body-cell-product="props">
              <q-td :props="props">
                <div class="text-weight-medium">{{ props.row.productName }}</div>
                <div class="text-caption text-grey-7">{{ props.row.productSku }}</div>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();

const stockOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Bajo stock", value: "LOW" },
  { label: "Sin stock", value: "OUT" },
];

const filters = reactive({
  search: "",
  stock: "ALL",
});

const products = ref([
  {
    id: "p1",
    sku: "PRD-MESA-M1",
    name: "Mesa M1",
    category: "Muebles",
    location: "Almacén A",
    unit: "unidad",
    stock: 12,
    min: 8,
    cost: 45.5,
  },
  {
    id: "p2",
    sku: "PRD-MESA-PRO",
    name: "Mesa Pro",
    category: "Muebles",
    location: "Almacén A",
    unit: "unidad",
    stock: 4,
    min: 6,
    cost: 72,
  },
  {
    id: "p3",
    sku: "PRD-KIT-REP",
    name: "Kit Reparación",
    category: "Servicios",
    location: "Almacén B",
    unit: "unidad",
    stock: 0,
    min: 3,
    cost: 8.5,
  },
  {
    id: "p4",
    sku: "PRD-SILLA-S1",
    name: "Silla S1",
    category: "Muebles",
    location: "Almacén A",
    unit: "unidad",
    stock: 18,
    min: 10,
    cost: 18.25,
  },
]);

const movements = ref([
  {
    id: uid("mv"),
    type: "PROD",
    when: `${todayYMD()} 10:12`,
    by: "Juan",
    productId: "p1",
    productSku: "PRD-MESA-M1",
    productName: "Mesa M1",
    qty: 2,
    unit: "unidad",
    note: "Registro de producción",
  },
  {
    id: uid("mv"),
    type: "OUT",
    when: `${todayYMD()} 11:05`,
    by: "María",
    productId: "p2",
    productSku: "PRD-MESA-PRO",
    productName: "Mesa Pro",
    qty: 1,
    unit: "unidad",
    note: "Salida por entrega",
  },
  {
    id: uid("mv"),
    type: "IN",
    when: `${todayYMD()} 12:20`,
    by: "Osiris",
    productId: "p4",
    productSku: "PRD-SILLA-S1",
    productName: "Silla S1",
    qty: 5,
    unit: "unidad",
    note: "Entrada por ajuste",
  },
]);

/** Table */
const columns = [
  { name: "name", label: "Producto", field: "name", align: "left", sortable: true },
  { name: "stock", label: "Stock", field: "stock", align: "left", sortable: true },
  { name: "cost", label: "Costo", field: "cost", align: "left", sortable: true },
  { name: "actions", label: "", field: "actions", align: "right", sortable: false },
];

const filteredProducts = computed(() => {
  const q = filters.search.trim().toLowerCase();
  const st = filters.stock;

  return products.value.filter((p) => {
    if (st === "LOW" && !(p.stock <= p.min)) return false;
    if (st === "OUT" && !(p.stock === 0)) return false;

    if (!q) return true;

    return (
      p.sku.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    );
  });
});

const kpi = computed(() => {
  const total = products.value.length;
  const low = products.value.filter((p) => p.stock > 0 && p.stock <= p.min).length;
  const out = products.value.filter((p) => p.stock === 0).length;
  const value = products.value.reduce((acc, p) => acc + (p.cost || 0) * (p.stock || 0), 0);
  return { total, low, out, value: round2(value) };
});

const lowStockProducts = computed(() =>
  products.value
    .filter((p) => p.stock <= p.min)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)
);

/** Dialogs: create/edit */
const editDlg = reactive({
  open: false,
  mode: "create",
  productId: "",
  form: emptyProduct(),
});

function openCreate() {
  editDlg.open = true;
  editDlg.mode = "create";
  editDlg.productId = "";
  editDlg.form = emptyProduct();
  editDlg.form.id = uid("prd");
  editDlg.form.unit = "unidad";
  editDlg.form.location = "Almacén A";
}

function openEdit(p) {
  editDlg.open = true;
  editDlg.mode = "edit";
  editDlg.productId = p.id;
  editDlg.form = deepClone(p);
}

function saveProduct() {
  const f = editDlg.form;

  if (!f.name.trim()) return notifyErr("Nombre requerido");
  if (!f.sku.trim()) return notifyErr("SKU requerido");
  if (!f.category.trim()) return notifyErr("Categoría requerida");
  if (!f.unit.trim()) return notifyErr("Unidad requerida");
  if (f.min < 0) return notifyErr("Mínimo inválido");
  if (f.cost < 0) return notifyErr("Costo inválido");

  if (editDlg.mode === "create") {
    products.value = [deepClone(f), ...products.value];
    movements.value.unshift(makeMovement("ADJUST", f, 0, "Producto creado"));
  } else {
    products.value = products.value.map((p) => (p.id === editDlg.productId ? deepClone(f) : p));
    const updated = products.value.find((p) => p.id === editDlg.productId);
    if (updated) movements.value.unshift(makeMovement("ADJUST", updated, 0, "Edición de producto"));
  }

  editDlg.open = false;
  $q.notify({ message: "Guardado (simulado).", color: "positive", position: "top" });
}

/** Adjust stock */
const adjustDlg = reactive({
  open: false,
  type: "IN",
  product: null,
  qty: 0,
  note: "",
});

function openAdjust(p, type) {
  adjustDlg.open = true;
  adjustDlg.type = type;
  adjustDlg.product = p;
  adjustDlg.qty = 0;
  adjustDlg.note = "";
}

const previewNewStock = computed(() => {
  const p = adjustDlg.product;
  if (!p) return 0;
  const q = Math.max(0, Math.floor(Number(adjustDlg.qty) || 0));
  if (adjustDlg.type === "IN") return p.stock + q;
  return Math.max(0, p.stock - q);
});

function applyAdjust() {
  const p = adjustDlg.product;
  if (!p) return;

  const qty = Math.max(0, Math.floor(Number(adjustDlg.qty) || 0));
  if (qty <= 0) return notifyErr("Cantidad inválida");

  const idx = products.value.findIndex((x) => x.id === p.id);
  if (idx === -1) return;

  const current = products.value[idx];

  if (adjustDlg.type === "OUT" && qty > current.stock) {
    return notifyErr("No puedes sacar más de lo que hay en stock.");
  }

  if (adjustDlg.type === "IN") {
    current.stock = current.stock + qty;
    movements.value.unshift(makeMovement("IN", current, qty, adjustDlg.note || "Entrada"));
  } else {
    current.stock = current.stock - qty;
    movements.value.unshift(makeMovement("OUT", current, qty, adjustDlg.note || "Salida"));
  }

  adjustDlg.open = false;
  $q.notify({ message: "Ajuste aplicado.", color: "primary", position: "top" });
}

/** Product history dialog */
const historyDlg = reactive({
  open: false,
  product: null,
});

function openHistory(p) {
  historyDlg.open = true;
  historyDlg.product = p;
}

const productMovements = computed(() => {
  const p = historyDlg.product;
  if (!p) return [];
  return movements.value.filter((m) => m.productId === p.id);
});

const movementColumns = [
  { name: "when", label: "Fecha", field: "when", align: "left", sortable: true },
  { name: "type", label: "Tipo", field: "type", align: "left", sortable: true },
  { name: "qty", label: "Cantidad", field: "qty", align: "left", sortable: true },
  { name: "by", label: "Por", field: "by", align: "left", sortable: true },
  { name: "note", label: "Nota", field: "note", align: "left", sortable: false },
];

const allMovDlg = reactive({ open: false });
function openAllMovements() {
  allMovDlg.open = true;
}

const movementColumnsGeneral = [
  { name: "when", label: "Fecha", field: "when", align: "left", sortable: true },
  { name: "type", label: "Tipo", field: "type", align: "left", sortable: true },
  { name: "product", label: "Producto", field: "productName", align: "left", sortable: true },
  { name: "qty", label: "Cantidad", field: "qty", align: "left", sortable: true },
  { name: "by", label: "Por", field: "by", align: "left", sortable: true },
  { name: "note", label: "Nota", field: "note", align: "left", sortable: false },
];

/** UI helpers */
function stockBadgeColor(p) {
  if (p.stock === 0) return "negative";
  if (p.stock <= p.min) return "orange";
  return "primary";
}
function stockBadgeLabel(p) {
  if (p.stock === 0) return "SIN STOCK";
  if (p.stock <= p.min) return "BAJO";
  return "OK";
}
function stockProgress(p) {
  if (p.min <= 0) return p.stock > 0 ? 1 : 0;
  const ratio = p.stock / p.min;
  // 1 = mínimo cumplido, >1 lo capamos
  return Math.min(1, Math.max(0, ratio));
}

/** Movements helpers */
function movementTitle(t) {
  switch (t) {
    case "IN": return "Entrada";
    case "OUT": return "Salida";
    case "PROD": return "Producción";
    case "SALE": return "Venta";
    case "ADJUST": return "Ajuste";
  }
}
function movementColor(t) {
  switch (t) {
    case "IN": return "primary";
    case "OUT": return "negative";
    case "PROD": return "green";
    case "SALE": return "purple";
    case "ADJUST": return "grey";
  }
}
function signedQty(t, qty) {
  const q = Math.abs(Number(qty) || 0);
  if (t === "OUT" || t === "SALE") return `-${q}`;
  if (t === "IN" || t === "PROD") return `+${q}`;
  return `${q}`;
}

function makeMovement(type, p, qty, note) {
  return {
    id: uid("mv"),
    type,
    when: `${todayYMD()} ${nowTime()}`,
    by: "Osiris",
    productId: p.id,
    productSku: p.sku,
    productName: p.name,
    qty: Math.max(0, Math.floor(Number(qty) || 0)),
    unit: p.unit,
    note: note || "",
  };
}

/** Misc actions */
function fakeRefresh() {
  $q.notify({ message: "Refrescado (simulado).", color: "primary", position: "top" });
}
function fakeExport() {
  $q.notify({ message: "Exportación simulada.", color: "primary", position: "top" });
}
function fakeImport() {
  $q.notify({ message: "Importación simulada.", color: "primary", position: "top" });
}

/** Utils */
function emptyProduct() {
  return {
    id: "",
    sku: "",
    name: "",
    category: "",
    location: "",
    unit: "",
    stock: 0,
    min: 0,
    cost: 0,
  };
}
function deepClone(obj){
  return JSON.parse(JSON.stringify(obj));
}
function notifyErr(msg) {
  $q.notify({ message: msg, color: "negative", position: "top" });
}
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function money(n) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" }).format(v);
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
