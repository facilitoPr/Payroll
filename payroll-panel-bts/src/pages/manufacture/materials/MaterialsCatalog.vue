<template>
  <q-page class="q-pa-md">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Catálogo de materiales</div>
        <div class="text-grey-7">
          Crea y administra los materiales (maestro). El inventario solo registra movimientos.
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-input
            outlined
            dense
            debounce="250"
            v-model="filters.search"
            placeholder="Buscar código, nombre, categoría…"
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
            style="min-width: 160px"
          />

          <q-btn
            unelevated
            color="primary"
            icon="add"
            label="Nuevo material"
            @click="openCreate()"
          />

          <q-btn flat round icon="more_vert">
            <q-menu>
              <q-list style="min-width: 220px">
                <q-item clickable v-close-popup @click="fakeExport()">
                  <q-item-section avatar><q-icon name="download" /></q-item-section>
                  <q-item-section>Exportar catálogo</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="fakeImport()">
                  <q-item-section avatar><q-icon name="upload" /></q-item-section>
                  <q-item-section>Importar catálogo</q-item-section>
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
            <q-icon name="category" size="34px" class="text-primary" />
            <div class="col">
              <div class="text-caption text-grey-7">Materiales</div>
              <div class="text-h6 text-weight-bold">{{ kpi.total }}</div>
              <div class="text-caption text-grey-7">Registrados</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="toggle_on" size="34px" class="text-primary" />
            <div class="col">
              <div class="text-caption text-grey-7">Activos</div>
              <div class="text-h6 text-weight-bold">{{ kpi.active }}</div>
              <div class="text-caption text-grey-7">Disponibles</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="toggle_off" size="34px" class="text-grey-7" />
            <div class="col">
              <div class="text-caption text-grey-7">Inactivos</div>
              <div class="text-h6 text-weight-bold">{{ kpi.inactive }}</div>
              <div class="text-caption text-grey-7">Archivados</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center q-gutter-md">
            <q-icon name="warning_amber" size="34px" class="text-orange" />
            <div class="col">
              <div class="text-caption text-grey-7">Pendientes</div>
              <div class="text-h6 text-weight-bold">{{ kpi.missingConfig }}</div>
              <div class="text-caption text-grey-7">Sin mínimo o unidad</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- TABLE -->
    <q-card bordered class="bg-white rounded-borders">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Listado</div>
          <div class="text-caption text-grey-7">
            Este es el maestro de materiales. Luego, el inventario usará estos materiales.
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
        >
          <template #body-cell-material="props">
            <q-td :props="props">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-weight-bold">{{ props.row.name }}</div>
                  <div class="text-caption text-grey-7">
                    <q-badge outline color="primary" class="q-mr-xs">{{ props.row.code }}</q-badge>
                    <span>{{ props.row.category }}</span>
                    <span class="q-ml-sm">·</span>
                    <span class="q-ml-sm">{{ props.row.location || "—" }}</span>
                  </div>
                </div>

                <q-badge :color="props.row.isActive ? 'primary' : 'grey'">
                  {{ props.row.isActive ? "ACTIVO" : "INACTIVO" }}
                </q-badge>
              </div>
            </q-td>
          </template>

          <template #body-cell-config="props">
            <q-td :props="props">
              <div class="text-weight-medium">
                Unidad: <b>{{ props.row.unit || "—" }}</b>
              </div>
              <div class="text-caption text-grey-7">
                Mín: <b>{{ props.row.min ?? "—" }}</b>
                <span v-if="props.row.unit"> {{ props.row.unit }}</span>
              </div>

              <div class="text-caption text-grey-7">
                Costo estándar: <b>{{ money(props.row.standardCost) }}</b>
              </div>

              <div class="text-caption" :class="configState(props.row).cls">
                {{ configState(props.row).label }}
              </div>
            </q-td>
          </template>

          <template #body-cell-supplier="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.supplier || "—" }}</div>
              <div class="text-caption text-grey-7">{{ props.row.notes || "—" }}</div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn flat round dense icon="edit" @click="openEdit(props.row)">
                <q-tooltip>Editar</q-tooltip>
              </q-btn>

              <q-btn
                :color="props.row.isActive ? 'grey' : 'primary'"
                :outline="props.row.isActive"
                :unelevated="!props.row.isActive"
                dense
                :icon="props.row.isActive ? 'toggle_off' : 'toggle_on'"
                :label="props.row.isActive ? 'Desactivar' : 'Activar'"
                class="q-ml-sm"
                @click="toggleActive(props.row.id)"
              />
            </q-td>
          </template>

          <template #no-data>
            <div class="q-pa-md text-grey-7">
              No hay materiales para mostrar con ese filtro.
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- CREATE / EDIT DIALOG -->
    <q-dialog v-model="dlg.open" persistent>
      <q-card style="width: 900px; max-width: 95vw" class="rounded-borders">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">
            {{ dlg.mode === 'create' ? 'Nuevo material' : 'Editar material' }}
          </div>
          <q-btn dense flat round icon="close" @click="dlg.open = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input outlined dense v-model="dlg.form.name" label="Nombre del material" />
          </div>

          <div class="col-12 col-md-3">
            <q-input outlined dense v-model="dlg.form.code" label="Código / SKU" />
          </div>

          <div class="col-12 col-md-3">
            <q-input outlined dense v-model="dlg.form.unit" label="Unidad" placeholder="kg, caja, unidad…" />
          </div>

          <div class="col-12 col-md-4">
            <q-input outlined dense v-model="dlg.form.category" label="Categoría" placeholder="Ej: Insumos, Tornillería…" />
          </div>

          <div class="col-12 col-md-4">
            <q-input outlined dense v-model="dlg.form.location" label="Ubicación" placeholder="Ej: Almacén A" />
          </div>

          <div class="col-12 col-md-4">
            <q-input outlined dense v-model="dlg.form.supplier" label="Proveedor sugerido (opcional)" />
          </div>

          <div class="col-12 col-md-4">
            <q-input outlined dense type="number" v-model.number="dlg.form.min" label="Stock mínimo" min="0" />
          </div>

          <div class="col-12 col-md-4">
            <q-input outlined dense type="number" v-model.number="dlg.form.standardCost" label="Costo estándar" min="0" step="0.01" />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              outlined
              dense
              v-model="dlg.form.isActive"
              :options="[{ label: 'Activo', value: true }, { label: 'Inactivo', value: false }]"
              emit-value
              map-options
              label="Estatus"
            />
          </div>

          <div class="col-12">
            <q-input outlined type="textarea" v-model="dlg.form.notes" label="Notas (opcional)" autogrow />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="row items-center justify-end q-gutter-sm">
          <q-btn flat label="Cancelar" @click="dlg.open = false" />
          <q-btn unelevated color="primary" icon="save" label="Guardar" @click="save()" />
        </q-card-section>
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
  { label: "Activos", value: "ACTIVE" },
  { label: "Inactivos", value: "INACTIVE" },
];

const filters = reactive({
  search: "",
  status: "ALL",
});

const materials = ref([
  {
    id: "m1",
    name: "Resina epóxica",
    code: "MAT-RESINA",
    unit: "kg",
    category: "Insumos",
    location: "Almacén A",
    supplier: "Proveedor Norte",
    min: 12,
    standardCost: 220.5,
    notes: "Mantener en área fresca.",
    isActive: true,
  },
  {
    id: "m2",
    name: "Tornillos 2cm",
    code: "MAT-TORN-2CM",
    unit: "caja",
    category: "Tornillería",
    location: "Almacén A",
    supplier: "Ferretería Central",
    min: 5,
    standardCost: 95,
    notes: "",
    isActive: true,
  },
  {
    id: "m3",
    name: "Lija fina",
    code: "MAT-LIJA-F",
    unit: "unidad",
    category: "Consumibles",
    location: "Almacén B",
    supplier: "",
    min: null,
    standardCost: 12.5,
    notes: "Pendiente definir mínimo.",
    isActive: true,
  },
  {
    id: "m4",
    name: "Pegamento industrial",
    code: "MAT-PEG-IND",
    unit: "",
    category: "Insumos",
    location: "",
    supplier: "Proveedor Sur",
    min: 3,
    standardCost: 180,
    notes: "Pendiente definir unidad/ubicación.",
    isActive: false,
  },
]);

const columns = [
  { name: "material", label: "Material", field: "name", align: "left", sortable: true },
  { name: "config", label: "Configuración", field: "unit", align: "left", sortable: false },
  { name: "supplier", label: "Proveedor / Notas", field: "supplier", align: "left", sortable: false },
  { name: "actions", label: "", field: "actions", align: "right", sortable: false },
];

const filteredMaterials = computed(() => {
  const q = filters.search.trim().toLowerCase();
  const st = filters.status;

  return materials.value.filter((m) => {
    if (st === "ACTIVE" && !m.isActive) return false;
    if (st === "INACTIVE" && m.isActive) return false;

    if (!q) return true;

    return (
      m.name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      (m.category || "").toLowerCase().includes(q) ||
      (m.location || "").toLowerCase().includes(q) ||
      (m.supplier || "").toLowerCase().includes(q)
    );
  });
});

const kpi = computed(() => {
  const total = materials.value.length;
  const active = materials.value.filter((m) => m.isActive).length;
  const inactive = materials.value.filter((m) => !m.isActive).length;
  const missingConfig = materials.value.filter((m) => !m.unit || m.min === null).length;
  return { total, active, inactive, missingConfig };
});

/** Dialog (create/edit) */
const dlg = reactive({
  open: false,
  mode: "create",
  id: "",
  form: emptyMaterial(),
});

function openCreate() {
  dlg.open = true;
  dlg.mode = "create";
  dlg.id = "";
  dlg.form = emptyMaterial();
  dlg.form.id = uid("mat");
  dlg.form.isActive = true;
  dlg.form.unit = "unidad";
  dlg.form.min = 0;
  dlg.form.standardCost = 0;
}

function openEdit(m) {
  dlg.open = true;
  dlg.mode = "edit";
  dlg.id = m.id;
  dlg.form = deepClone(m);
}

function save() {
  const f = dlg.form;

  if (!f.name.trim()) return notifyErr("Nombre requerido");
  if (!f.code.trim()) return notifyErr("Código requerido");
  if (!f.category.trim()) return notifyErr("Categoría requerida");

  // unit puede ser vacío si quieres permitir guardarlo “pendiente”, pero aquí lo permitimos:
  if (f.min !== null && f.min < 0) return notifyErr("Mínimo inválido");
  if (f.standardCost < 0) return notifyErr("Costo inválido");

  if (dlg.mode === "create") {
    materials.value = [deepClone(f), ...materials.value];
    $q.notify({ message: "Material creado (simulado).", color: "positive", position: "top" });
  } else {
    materials.value = materials.value.map((m) => (m.id === dlg.id ? deepClone(f) : m));
    $q.notify({ message: "Material actualizado (simulado).", color: "positive", position: "top" });
  }

  dlg.open = false;
}

function toggleActive(id) {
  const idx = materials.value.findIndex((m) => m.id === id);
  if (idx === -1) return;

  const m = materials.value[idx];

  const action = m.isActive ? "desactivar" : "activar";
  $q.dialog({
    title: "Confirmación",
    message: `¿Seguro que deseas ${action} este material?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    m.isActive = !m.isActive;
    $q.notify({
      message: `Material ${m.isActive ? "activado" : "desactivado"}.`,
      color: m.isActive ? "primary" : "grey",
      position: "top",
    });
  });
}

function configState(m) {
  const missingUnit = !m.unit;
  const missingMin = m.min === null;
  if (!missingUnit && !missingMin) return { label: "Configuración completa", cls: "text-positive" };
  if (missingUnit && missingMin) return { label: "Falta unidad y mínimo", cls: "text-negative" };
  if (missingUnit) return { label: "Falta unidad", cls: "text-orange" };
  return { label: "Falta mínimo", cls: "text-orange" };
}

/** Mock actions */
function fakeRefresh() {
  $q.notify({ message: "Refrescado (simulado).", color: "primary", position: "top" });
}
function fakeExport() {
  $q.notify({ message: "Exportación.", color: "primary", position: "top" });
}
function fakeImport() {
  $q.notify({ message: "Importación.", color: "primary", position: "top" });
}

/** Utils */
function emptyMaterial() {
  return {
    id: "",
    name: "",
    code: "",
    unit: "",
    category: "",
    location: "",
    supplier: "",
    min: null,
    standardCost: 0,
    notes: "",
    isActive: true,
  };
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function notifyErr(msg) {
  $q.notify({ message: msg, color: "negative", position: "top" });
}
function money(n) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" }).format(v);
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
