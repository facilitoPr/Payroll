<template>
  <q-page class="q-pa-md">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Compra de materiales</div>
        <div class="text-grey-7">
          Registra compras para aumentar inventario (simulado).
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-input
            outlined
            dense
            debounce="250"
            v-model="filters.search"
            placeholder="Buscar compra…"
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
            v-model="filters.status"
            :options="statusOptions"
            label="Estatus"
            emit-value
            map-options
            style="min-width: 170px"
          />

          <q-btn
            unelevated
            color="primary"
            icon="add"
            label="Nueva compra"
            @click="openCreate()"
          />
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- CONTENT -->
    <div class="row q-col-gutter-md">
      <!-- LIST -->
      <div class="col-12 col-lg-8">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Listado de compras</div>
              <div class="text-caption text-grey-7">
                Borrador se puede editar · Confirmada impacta stock.
              </div>
            </div>

            <q-badge outline color="primary">
              {{ filteredPurchases.length }} compras
            </q-badge>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none">
            <q-table
              flat
              :rows="filteredPurchases"
              :columns="purchaseColumns"
              row-key="id"
              :rows-per-page-options="[5, 10, 20]"
              :pagination="{ rowsPerPage: 10 }"
              class="rounded-table"
            >
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-badge :color="props.row.status === 'CONFIRMED' ? 'green' : 'orange'">
                    {{ props.row.status === 'CONFIRMED' ? 'CONFIRMADA' : 'BORRADOR' }}
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-supplier="props">
                <q-td :props="props">
                  <div class="text-weight-medium">
                    {{ supplierName(props.row.supplierId) }}
                  </div>
                  <div class="text-caption text-grey-7">
                    Fact. proveedor: {{ props.row.invoiceNo || "—" }}
                  </div>
                </q-td>
              </template>

              <template #body-cell-total="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ money(purchaseTotal(props.row)) }}</div>
                  <div class="text-caption text-grey-7">
                    {{ props.row.items.length }} items
                  </div>
                </q-td>
              </template>

              <template #body-cell-actions="props">
                <q-td :props="props" class="text-right">
                  <q-btn
                    flat
                    round
                    dense
                    icon="visibility"
                    @click="openView(props.row)"
                  >
                    <q-tooltip>Ver</q-tooltip>
                  </q-btn>

                  <q-btn
                    flat
                    round
                    dense
                    icon="edit"
                    :disable="props.row.status === 'CONFIRMED'"
                    @click="openEdit(props.row)"
                  >
                    <q-tooltip>Editar</q-tooltip>
                  </q-btn>

                  <q-btn
                    flat
                    round
                    dense
                    icon="check_circle"
                    color="positive"
                    :disable="props.row.status === 'CONFIRMED'"
                    @click="askConfirmPurchase(props.row)"
                  >
                    <q-tooltip>Confirmar (impacta stock)</q-tooltip>
                  </q-btn>

                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    color="negative"
                    @click="removePurchase(props.row.id)"
                  >
                    <q-tooltip>Eliminar (hardcode)</q-tooltip>
                  </q-btn>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">
                  No hay compras para mostrar.
                </div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <!-- RIGHT: INVENTORY SNAPSHOT -->
      <div class="col-12 col-lg-4">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Inventario (simulado)</div>
              <div class="text-caption text-grey-7">
                Aquí verás el stock actual (local a esta pantalla).
              </div>
            </div>
            <q-icon name="inventory_2" class="text-primary" size="24px" />
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
                  {{ m.stock <= m.min ? 'BAJO' : 'OK' }}
                </q-badge>
              </div>
              <q-linear-progress
                :value="Math.min(1, m.stock / Math.max(1, m.min))"
                class="q-mt-sm"
              />
            </q-card>

            <q-separator class="q-my-sm" />

            <div class="text-caption text-grey-7">
              Nota: Esto está hardcode. Luego lo pasamos a Pinia + API para que se
              mantenga entre pantallas.
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- CREATE/EDIT/VIEW DIALOG -->
    <q-dialog v-model="dlg.open" persistent maximized>
      <q-card class="bg-grey-1">
        <!-- DIALOG HEADER -->
        <q-card-section class="row items-center justify-between bg-white">
          <div>
            <div class="text-h6 text-weight-bold">
              {{ dlg.mode === "create"
                ? "Nueva compra"
                : dlg.mode === "edit"
                  ? "Editar compra"
                  : "Detalle de compra" }}
              <span v-if="dlg.form.code" class="text-grey-7">
                — {{ dlg.form.code }}
              </span>
            </div>
            <div class="text-caption text-grey-7">
              {{ dlg.mode === "view"
                ? "Vista de solo lectura."
                : "Completa el encabezado y agrega materiales al detalle." }}
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-badge
              v-if="dlg.form.status"
              :color="dlg.form.status === 'CONFIRMED' ? 'green' : 'orange'"
              outline
            >
              {{ dlg.form.status === "CONFIRMED" ? "CONFIRMADA" : "BORRADOR" }}
            </q-badge>

            <q-btn dense flat round icon="close" @click="closeDialog()" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md">
            <!-- FORM -->
            <div class="col-12 col-lg-8">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">Encabezado</div>
                  <div class="text-caption text-grey-7">
                    Datos generales de la compra.
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section>
                  <q-form @submit.prevent="saveDialog()" class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <q-select
                        outlined
                        dense
                        v-model="dlg.form.supplierId"
                        :options="suppliersOptions"
                        label="Proveedor"
                        emit-value
                        map-options
                        :disable="isReadOnly"
                        :rules="[vRequired('Proveedor requerido')]"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        outlined
                        dense
                        v-model="dlg.form.date"
                        label="Fecha"
                        :disable="isReadOnly"
                        :rules="[vRequired('Fecha requerida')]"
                      >
                        <template #append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="dlg.form.date" mask="YYYY-MM-DD" minimal>
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Cerrar" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        outlined
                        dense
                        v-model="dlg.form.invoiceNo"
                        label="Factura / referencia proveedor"
                        :disable="isReadOnly"
                        placeholder="Ej: F-10293"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        outlined
                        dense
                        v-model="dlg.form.createdBy"
                        label="Registrado por"
                        :disable="isReadOnly"
                        placeholder="Ej: Romantiezer"
                        :rules="[vRequired('Campo requerido')]"
                      />
                    </div>

                    <div class="col-12">
                      <q-input
                        outlined
                        type="textarea"
                        v-model="dlg.form.notes"
                        label="Notas"
                        :disable="isReadOnly"
                        autogrow
                      />
                    </div>

                    <div class="col-12">
                      <q-separator class="q-my-sm" />
                      <div class="row items-center justify-between">
                        <div>
                          <div class="text-subtitle2 text-weight-bold">Detalle de materiales</div>
                          <div class="text-caption text-grey-7">
                            Agrega filas y define cantidad / costo.
                          </div>
                        </div>

                        <q-btn
                          v-if="!isReadOnly"
                          outline
                          icon="add"
                          label="Agregar material"
                          @click="addItem()"
                        />
                      </div>
                    </div>

                    <div class="col-12">
                      <q-table
                        flat
                        :rows="dlg.form.items"
                        :columns="itemsColumns"
                        row-key="rowId"
                        class="rounded-table"
                        hide-bottom
                      >
                        <template #body-cell-materialId="props">
                          <q-td :props="props">
                            <q-select
                              dense
                              outlined
                              v-model="props.row.materialId"
                              :options="materialsOptions"
                              emit-value
                              map-options
                              :disable="isReadOnly"
                              @update:model-value="onSelectMaterial(props.row)"
                            />
                          </q-td>
                        </template>

                        <template #body-cell-unit="props">
                          <q-td :props="props">
                            <q-badge outline color="primary">
                              {{ materialUnit(props.row.materialId) || "—" }}
                            </q-badge>
                          </q-td>
                        </template>

                        <template #body-cell-qty="props">
                          <q-td :props="props">
                            <q-input
                              dense
                              outlined
                              type="number"
                              v-model.number="props.row.qty"
                              :disable="isReadOnly"
                              min="0"
                              step="0.01"
                            />
                          </q-td>
                        </template>

                        <template #body-cell-cost="props">
                          <q-td :props="props">
                            <q-input
                              dense
                              outlined
                              type="number"
                              v-model.number="props.row.cost"
                              :disable="isReadOnly"
                              min="0"
                              step="0.01"
                              prefix="$"
                            />
                          </q-td>
                        </template>

                        <template #body-cell-subtotal="props">
                          <q-td :props="props">
                            <div class="text-weight-bold">
                              {{ money(lineSubtotal(props.row)) }}
                            </div>
                          </q-td>
                        </template>

                        <template #body-cell-actions="props">
                          <q-td :props="props" class="text-right">
                            <q-btn
                              v-if="!isReadOnly"
                              flat
                              round
                              dense
                              icon="delete"
                              color="negative"
                              @click="removeItem(props.row.rowId)"
                            />
                          </q-td>
                        </template>

                        <template #no-data>
                          <div class="q-pa-md text-grey-7">
                            Agrega al menos un material.
                          </div>
                        </template>
                      </q-table>
                    </div>

                    <div class="col-12">
                      <q-separator class="q-my-sm" />
                      <div class="row items-center justify-between q-col-gutter-md">
                        <div class="col-12 col-md-6">
                          <q-toggle
                            v-model="dlg.form.includeTax"
                            label="Aplicar IVU"
                            :disable="isReadOnly"
                          />
                        </div>

                        <div class="col-12 col-md-6">
                          <q-card bordered flat class="bg-grey-1 rounded-borders q-pa-sm">
                            <div class="row items-center justify-between">
                              <div class="text-grey-7">Subtotal</div>
                              <div class="text-weight-bold">
                                {{ money(dialogSubtotal) }}
                              </div>
                            </div>
                            <div class="row items-center justify-between">
                              <div class="text-grey-7">ITBIS</div>
                              <div class="text-weight-bold">
                                {{ money(dialogTax) }}
                              </div>
                            </div>
                            <q-separator class="q-my-sm" />
                            <div class="row items-center justify-between">
                              <div class="text-subtitle2 text-weight-bold">Total</div>
                              <div class="text-h6 text-weight-bold">
                                {{ money(dialogTotal) }}
                              </div>
                            </div>
                          </q-card>
                        </div>
                      </div>
                    </div>

                    <!-- ACTIONS -->
                    <div class="col-12">
                      <q-separator class="q-my-md" />

                      <div class="row items-center justify-end q-gutter-sm">
                        <q-btn
                          flat
                          label="Cerrar"
                          @click="closeDialog()"
                        />

                        <q-btn
                          v-if="dlg.mode !== 'view'"
                          unelevated
                          color="primary"
                          icon="save"
                          label="Guardar"
                          type="submit"
                        />

                        <q-btn
                          v-if="dlg.mode !== 'view'"
                          unelevated
                          color="positive"
                          icon="check_circle"
                          label="Guardar y confirmar"
                          @click="saveAndConfirm()"
                        />
                      </div>
                    </div>
                  </q-form>
                </q-card-section>
              </q-card>
            </div>

            <!-- SIDE: IMPACT PREVIEW -->
            <div class="col-12 col-lg-4">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">Impacto al inventario</div>
                  <div class="text-caption text-grey-7">
                    Vista previa (cuando confirmes).
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="q-gutter-sm">
                  <div v-if="impactPreview.length">
                    <q-card
                      v-for="x in impactPreview"
                      :key="x.materialId"
                      bordered
                      flat
                      class="q-pa-sm rounded-borders"
                    >
                      <div class="row items-center justify-between">
                        <div>
                          <div class="text-weight-medium">{{ x.name }}</div>
                          <div class="text-caption text-grey-7">
                            +{{ x.qty }} {{ x.unit }}
                          </div>
                        </div>

                        <q-badge outline color="primary">
                          {{ x.currentStock }} → {{ x.currentStock + x.qty }}
                        </q-badge>
                      </div>
                    </q-card>
                  </div>

                  <div v-else class="text-grey-7 text-caption">
                    Agrega materiales para ver el impacto.
                  </div>

                  <q-separator class="q-my-sm" />

                  <q-banner class="bg-grey-2 rounded-borders">
                    <div class="text-caption text-grey-7">
                      Si confirmas, esta compra cambiará a <b>CONFIRMADA</b> y
                      aumentará el stock en esta pantalla (simulado).
                    </div>
                  </q-banner>
                </q-card-section>
              </q-card>

              <q-card bordered class="bg-white rounded-borders q-mt-md">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-bold">Reglas (hardcode)</div>
                  <ul class="text-caption text-grey-7 q-pl-md q-mt-sm">
                    <li>Borrador: se puede editar.</li>
                    <li>Confirmada: bloquea edición y aumenta stock.</li>
                    <li>Eliminar: solo borra del arreglo local.</li>
                  </ul>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- CONFIRM DIALOG -->
    <q-dialog v-model="confirmDlg.open" persistent>
      <q-card class="rounded-borders" style="min-width: 420px; max-width: 95vw;">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="check_circle" color="positive" size="28px" />
          <div>
            <div class="text-subtitle1 text-weight-bold">Confirmar compra</div>
            <div class="text-caption text-grey-7">
              Esto impactará el inventario (simulado).
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-caption text-grey-7">Compra:</div>
          <div class="text-weight-bold">
            {{ confirmDlg.purchase?.code }} — {{ supplierName(confirmDlg.purchase?.supplierId || "") }}
          </div>

          <q-separator class="q-my-sm" />

          <div class="row items-center justify-between">
            <div class="text-grey-7">Total</div>
            <div class="text-weight-bold">
              {{ money(confirmDlg.purchase ? purchaseTotal(confirmDlg.purchase) : 0) }}
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            unelevated
            color="positive"
            label="Confirmar"
            @click="confirmPurchase(confirmDlg.purchase?.id || '')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup >
import { computed, reactive, ref } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();

const statusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Borrador", value: "DRAFT" },
  { label: "Confirmada", value: "CONFIRMED" },
];

const suppliers = ref([
  { id: "s1", name: "Suplidores del Caribe SRL" },
  { id: "s2", name: "Ferretería Central" },
  { id: "s3", name: "Importadora Industrial" },
]);

const materials = ref([
  { id: "m1", name: "Resina epóxica", unit: "kg", defaultCost: 420, stock: 6, min: 12 },
  { id: "m2", name: "Tornillos 2cm", unit: "caja", defaultCost: 180, stock: 2, min: 5 },
  { id: "m3", name: "Lija fina", unit: "unidad", defaultCost: 35, stock: 9, min: 15 },
  { id: "m4", name: "Pegamento industrial", unit: "unidad", defaultCost: 250, stock: 1, min: 3 },
]);

const purchases = ref([
  {
    id: "p1",
    code: "COMP-00018",
    supplierId: "s1",
    date: todayYMD(),
    invoiceNo: "F-10293",
    notes: "Entrega parcial, revisar próxima semana.",
    status: "DRAFT",
    createdBy: "Romantiezer",
    includeTax: true,
    items: [
      { rowId: "r1", materialId: "m1", qty: 8, cost: 410 },
      { rowId: "r2", materialId: "m2", qty: 3, cost: 175 },
    ],
  },
  {
    id: "p2",
    code: "COMP-00017",
    supplierId: "s2",
    date: yesterdayYMD(),
    invoiceNo: "FC-8891",
    notes: "",
    status: "CONFIRMED",
    createdBy: "María",
    includeTax: false,
    items: [{ rowId: "r1", materialId: "m3", qty: 10, cost: 30 }],
  },
]);

const filters = reactive({
  search: "",
  status: "ALL",
});

const purchaseColumns = [
  { name: "date", label: "Fecha", field: "date", align: "left", sortable: true },
  { name: "code", label: "Código", field: "code", align: "left", sortable: true },
  { name: "supplier", label: "Proveedor", field: "supplierId", align: "left", sortable: false },
  { name: "status", label: "Estatus", field: "status", align: "left", sortable: true },
  { name: "total", label: "Total", field: "total", align: "left", sortable: false },
  { name: "actions", label: "", field: "actions", align: "right", sortable: false },
];

const itemsColumns = [
  { name: "materialId", label: "Material", field: "materialId", align: "left" },
  { name: "unit", label: "Unidad", field: "unit", align: "left" },
  { name: "qty", label: "Cantidad", field: "qty", align: "left" },
  { name: "cost", label: "Costo", field: "cost", align: "left" },
  { name: "subtotal", label: "Subtotal", field: "subtotal", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" },
];

const suppliersOptions = computed(() =>
  suppliers.value.map((s) => ({ label: s.name, value: s.id }))
);

const materialsOptions = computed(() =>
  materials.value.map((m) => ({ label: m.name, value: m.id }))
);

const filteredPurchases = computed(() => {
  const q = filters.search.trim().toLowerCase();
  const st = filters.status;

  return purchases.value.filter((p) => {
    const okStatus = st === "ALL" ? true : p.status === st;
    if (!okStatus) return false;

    if (!q) return true;

    const supplier = supplierName(p.supplierId).toLowerCase();
    return (
      p.code.toLowerCase().includes(q) ||
      p.date.toLowerCase().includes(q) ||
      supplier.includes(q) ||
      (p.invoiceNo || "").toLowerCase().includes(q) ||
      (p.createdBy || "").toLowerCase().includes(q)
    );
  });
});

/** Dialog state */
const dlg = reactive({
  open: false,
  mode: "create",
  form: emptyPurchase(),
  editingId: "",
});

const confirmDlg = reactive({
  open: false,
  purchase: null,
});

const isReadOnly = computed(() => dlg.mode === "view" || dlg.form.status === "CONFIRMED");

/** Dialog totals */
const dialogSubtotal = computed(() =>
  dlg.form.items.reduce((sum, it) => sum + lineSubtotal(it), 0)
);

const dialogTax = computed(() => {
  if (!dlg.form.includeTax) return 0;
  return round2(dialogSubtotal.value * 0.11);
});

const dialogTotal = computed(() => round2(dialogSubtotal.value + dialogTax.value));

const impactPreview = computed(() => {
  const map = new Map();

  for (const it of dlg.form.items) {
    if (!it.materialId) continue;
    const qty = Number(it.qty) || 0;
    if (qty <= 0) continue;
    map.set(it.materialId, (map.get(it.materialId) || 0) + qty);
  }

  return Array.from(map.entries()).map(([materialId, qty]) => {
    const mat = materials.value.find((m) => m.id === materialId);
    return {
      materialId,
      name: mat?.name || "Material",
      unit: mat?.unit || "",
      qty: round2(qty),
      currentStock: mat?.stock || 0,
    };
  });
});

/** Helpers */
function vRequired(msg) {
  return (val) => (val !== null && val !== undefined && String(val).trim() !== "" ? true : msg);
}

function supplierName(id) {
  const s = suppliers.value.find((x) => x.id === id);
  return s?.name || "—";
}

function materialUnit(materialId) {
  const m = materials.value.find((x) => x.id === materialId);
  return m?.unit || "";
}

function materialDefaultCost(materialId) {
  const m = materials.value.find((x) => x.id === materialId);
  return m?.defaultCost || 0;
}

function lineSubtotal(it) {
  const qty = Number(it.qty) || 0;
  const cost = Number(it.cost) || 0;
  return round2(qty * cost);
}

function purchaseSubtotal(p) {
  return p.items.reduce((sum, it) => sum + round2((Number(it.qty) || 0) * (Number(it.cost) || 0)), 0);
}

function purchaseTax(p) {
  if (!p.includeTax) return 0;
  return round2(purchaseSubtotal(p) * 0.11);
}

function purchaseTotal(p) {
  return round2(purchaseSubtotal(p) + purchaseTax(p));
}

function money(n) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n || 0);
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

function yesterdayYMD() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function nextPurchaseCode() {
  // Busca el mayor COMP-xxxxx y suma 1 (simulado)
  let max = 0;
  for (const p of purchases.value) {
    const m = p.code.match(/COMP-(\d+)/);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  const next = String(max + 1).padStart(5, "0");
  return `COMP-${next}`;
}

function emptyPurchase() {
  return {
    id: "",
    code: "",
    supplierId: "",
    date: todayYMD(),
    invoiceNo: "",
    notes: "",
    status: "DRAFT",
    createdBy: "Romantiezer",
    includeTax: true,
    items: [],
  };
}

/** Dialog actions */
function openCreate() {
  dlg.mode = "create";
  dlg.open = true;
  dlg.editingId = "";
  dlg.form = emptyPurchase();
  dlg.form.id = uid("purchase");
  dlg.form.code = nextPurchaseCode();
  dlg.form.items = [newItemRow()];
}

function openEdit(p) {
  dlg.mode = "edit";
  dlg.open = true;
  dlg.editingId = p.id;
  dlg.form = deepClone(p);
}

function openView(p) {
  dlg.mode = "view";
  dlg.open = true;
  dlg.editingId = p.id;
  dlg.form = deepClone(p);
}

function closeDialog() {
  dlg.open = false;
}

function saveDialog() {
  // Validaciones simples
  if (!dlg.form.supplierId) {
    $q.notify({ message: "Proveedor requerido", color: "negative", position: "top" });
    return;
  }
  if (!dlg.form.date) {
    $q.notify({ message: "Fecha requerida", color: "negative", position: "top" });
    return;
  }
  if (!dlg.form.createdBy) {
    $q.notify({ message: "Registrado por requerido", color: "negative", position: "top" });
    return;
  }
  if (!dlg.form.items.length) {
    $q.notify({ message: "Agrega al menos 1 material", color: "negative", position: "top" });
    return;
  }

  // Filtrar items inválidos
  dlg.form.items = dlg.form.items
    .filter((it) => it.materialId && (Number(it.qty) || 0) > 0)
    .map((it) => ({ ...it, qty: round2(Number(it.qty) || 0), cost: round2(Number(it.cost) || 0) }));

  if (!dlg.form.items.length) {
    $q.notify({ message: "Agrega materiales con cantidad válida", color: "negative", position: "top" });
    return;
  }

  if (dlg.mode === "create") {
    purchases.value = [deepClone(dlg.form), ...purchases.value];
  } else if (dlg.mode === "edit") {
    purchases.value = purchases.value.map((x) => (x.id === dlg.editingId ? deepClone(dlg.form) : x));
  }

  $q.notify({ message: "Compra guardada (simulado).", color: "primary", position: "top" });
}

function saveAndConfirm() {
  saveDialog();
  // si no está guardada/valida, no confirmes
  const exists = purchases.value.find((x) => x.id === dlg.form.id || x.id === dlg.editingId);
  if (!exists) return;

  askConfirmPurchase(dlg.form);
}

function addItem() {
  dlg.form.items.push(newItemRow());
}

function removeItem(rowId) {
  dlg.form.items = dlg.form.items.filter((x) => x.rowId !== rowId);
}

function newItemRow() {
  return {
    rowId: uid("row"),
    materialId: "",
    qty: 1,
    cost: 0,
  };
}

function onSelectMaterial(row) {
  // auto-llenar costo por defecto si está en 0
  if (!row.materialId) return;
  if (!row.cost || Number(row.cost) === 0) {
    row.cost = materialDefaultCost(row.materialId);
  }
}

function askConfirmPurchase(p) {
  if (p.status === "CONFIRMED") return;
  confirmDlg.purchase = purchases.value.find((x) => x.id === p.id) || p;
  confirmDlg.open = true;
}

function confirmPurchase(id) {
  const p = purchases.value.find((x) => x.id === id);
  if (!p) {
    $q.notify({ message: "Compra no encontrada", color: "negative", position: "top" });
    return;
  }
  if (p.status === "CONFIRMED") {
    confirmDlg.open = false;
    return;
  }

  // Impactar stock (simulado)
  for (const it of p.items) {
    const mat = materials.value.find((m) => m.id === it.materialId);
    if (!mat) continue;
    mat.stock = round2((mat.stock || 0) + (Number(it.qty) || 0));
  }

  p.status = "CONFIRMED";
  confirmDlg.open = false;

  // si el dialogo abierto corresponde a esta compra, reflejar
  if (dlg.open && (dlg.form.id === id || dlg.editingId === id)) {
    dlg.form.status = "CONFIRMED";
  }

  $q.notify({
    message: `Compra ${p.code} confirmada. Inventario actualizado (simulado).`,
    color: "positive",
    position: "top",
  });
}

function removePurchase(id) {
  purchases.value = purchases.value.filter((x) => x.id !== id);
  $q.notify({ message: "Compra eliminada (hardcode).", color: "negative", position: "top" });
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
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
