<template>
  <q-page class="q-pa-md">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Paquetes de manufactura</div>
        <div class="text-grey-7">
          Define recetas por lote para saber cuánto puedes fabricar con tus
          materiales.
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-input
            outlined
            dense
            debounce="250"
            v-model="filters.search"
            placeholder="Buscar paquete…"
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
            emit-value
            map-options
            label="Estatus"
            style="min-width: 160px"
          />

          <q-btn
            unelevated
            color="primary"
            icon="add"
            label="Nuevo paquete"
            @click="openCreate()"
          />
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- TABS -->
    <q-card bordered class="bg-white rounded-borders">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Gestión</div>
          <div class="text-caption text-grey-7">
            Mantén recetas por lote (batch) y calcula producción posible.
          </div>
        </div>

        <q-badge outline color="primary">
          {{ filteredPackages.length }} paquetes
        </q-badge>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-tabs v-model="tab" dense class="text-grey-8">
          <q-tab name="packages" icon="widgets" label="Paquetes" />
          <q-tab
            name="calculator"
            icon="calculate"
            label="¿Cuánto puedo fabricar?"
          />
        </q-tabs>

        <q-separator class="q-my-sm" />

        <q-tab-panels v-model="tab" animated>
          <!-- PACKAGES LIST -->
          <q-tab-panel name="packages" class="q-pa-none">
            <div class="row q-col-gutter-md q-pa-md">
              <!-- KPI -->
              <div class="col-12 col-sm-6 col-lg-3">
                <q-card bordered class="bg-white rounded-borders">
                  <q-card-section class="row items-center q-gutter-md">
                    <q-icon name="widgets" size="34px" class="text-primary" />
                    <div class="col">
                      <div class="text-caption text-grey-7">Paquetes</div>
                      <div class="text-h6 text-weight-bold">
                        {{ kpi.total }}
                      </div>
                      <div class="text-caption text-grey-7">Registrados</div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-lg-3">
                <q-card bordered class="bg-white rounded-borders">
                  <q-card-section class="row items-center q-gutter-md">
                    <q-icon
                      name="check_circle"
                      size="34px"
                      class="text-positive"
                    />
                    <div class="col">
                      <div class="text-caption text-grey-7">Activos</div>
                      <div class="text-h6 text-weight-bold">
                        {{ kpi.active }}
                      </div>
                      <div class="text-caption text-grey-7">Disponibles</div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-lg-3">
                <q-card bordered class="bg-white rounded-borders">
                  <q-card-section class="row items-center q-gutter-md">
                    <q-icon
                      name="pause_circle"
                      size="34px"
                      class="text-orange"
                    />
                    <div class="col">
                      <div class="text-caption text-grey-7">Inactivos</div>
                      <div class="text-h6 text-weight-bold">
                        {{ kpi.inactive }}
                      </div>
                      <div class="text-caption text-grey-7">No disponibles</div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-lg-3">
                <q-card bordered class="bg-white rounded-borders">
                  <q-card-section class="row items-center q-gutter-md">
                    <q-icon
                      name="inventory_2"
                      size="34px"
                      class="text-primary"
                    />
                    <div class="col">
                      <div class="text-caption text-grey-7">Materiales</div>
                      <div class="text-h6 text-weight-bold">
                        {{ materials.length }}
                      </div>
                      <div class="text-caption text-grey-7">Catalogados</div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <q-separator />

            <q-card-section class="q-pa-none">
              <q-table
                flat
                :rows="filteredPackages"
                :columns="pkgColumns"
                row-key="id"
                :rows-per-page-options="[10, 20, 50]"
                :pagination="{ rowsPerPage: 10 }"
                class="rounded-table"
              >
                <template #body-cell-status="props">
                  <q-td :props="props">
                    <q-badge :color="props.row.isActive ? 'green' : 'orange'">
                      {{ props.row.isActive ? "ACTIVO" : "INACTIVO" }}
                    </q-badge>
                  </q-td>
                </template>

                <template #body-cell-yield="props">
                  <q-td :props="props">
                    <div class="text-weight-bold">
                      {{ props.row.yieldQty }} unidad
                    </div>
                    <div class="text-caption text-grey-7">por lote</div>
                  </q-td>
                </template>

                <template #body-cell-components="props">
                  <q-td :props="props">
                    <div class="text-weight-medium">
                      {{ props.row.components.length }} materiales
                    </div>
                    <div class="text-caption text-grey-7">
                      {{ summaryFirstMaterials(props.row) }}
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
                      @click="openEdit(props.row)"
                    >
                      <q-tooltip>Editar</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      round
                      dense
                      icon="content_copy"
                      @click="duplicate(props.row)"
                    >
                      <q-tooltip>Duplicar</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="negative"
                      @click="removePackage(props.row.id)"
                    >
                      <q-tooltip>Eliminar (hardcode)</q-tooltip>
                    </q-btn>
                  </q-td>
                </template>

                <template #no-data>
                  <div class="q-pa-md text-grey-7">
                    No hay paquetes con estos filtros.
                  </div>
                </template>
              </q-table>
            </q-card-section>
          </q-tab-panel>

          <!-- CALCULATOR -->
          <q-tab-panel name="calculator">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-lg-6">
                <q-card bordered class="bg-white rounded-borders">
                  <q-card-section>
                    <div class="text-subtitle1 text-weight-bold">
                      Calculadora
                    </div>
                    <div class="text-caption text-grey-7">
                      Selecciona un paquete y calcula cuántas unidades puedes
                      fabricar con el inventario actual.
                    </div>
                  </q-card-section>

                  <q-separator />

                  <q-card-section class="q-gutter-md">
                    <q-select
                      outlined
                      dense
                      v-model="calc.packageId"
                      :options="packageOptions"
                      emit-value
                      map-options
                      label="Paquete"
                    />

                    <q-input
                      outlined
                      dense
                      type="number"
                      v-model.number="calc.desiredUnits"
                      label="Quiero fabricar (unidades)"
                      min="0"
                      step="1"
                    />

                    <q-banner class="bg-grey-2 rounded-borders">
                      <div class="text-caption text-grey-7">
                        Nota: La receta está definida <b>por lote</b>. Cada lote
                        produce
                        <b>{{ selectedCalcPackage?.yieldQty || 0 }} unidades</b
                        >.
                      </div>
                    </q-banner>

                    <div class="row q-col-gutter-x-sm">
                      <div class="col-12 col-md-6">
                        <q-card
                          bordered
                          flat
                          class="bg-grey-1 rounded-borders q-pa-sm"
                        >
                          <div class="text-caption text-grey-7">
                            Lotes posibles
                          </div>
                          <div class="text-h6 text-weight-bold">
                            {{ calcResult.batchesPossible }}
                          </div>
                          <div class="text-caption text-grey-7">
                            Según inventario actual
                          </div>
                        </q-card>
                      </div>

                      <div class="col-12 col-md-6">
                        <q-card
                          bordered
                          flat
                          class="bg-grey-1 rounded-borders q-pa-sm"
                        >
                          <div class="text-caption text-grey-7">
                            Unidades posibles
                          </div>
                          <div class="text-h6 text-weight-bold">
                            {{ calcResult.unitsPossible }}
                          </div>
                          <div class="text-caption text-grey-7">
                            (lotes × rendimiento)
                          </div>
                        </q-card>
                      </div>
                    </div>

                    <q-separator />

                    <div class="text-subtitle2 text-weight-bold">
                      Material limitante
                    </div>
                    <div v-if="calcResult.limiting">
                      <q-card bordered flat class="rounded-borders q-pa-sm">
                        <div class="row items-center justify-between">
                          <div>
                            <div class="text-weight-medium">
                              {{ calcResult.limiting.name }}
                            </div>
                            <div class="text-caption text-grey-7">
                              Disponible: {{ calcResult.limiting.stock }}
                              {{ calcResult.limiting.unit }} · Requiere por
                              lote: {{ calcResult.limiting.reqPerBatch }}
                              {{ calcResult.limiting.unit }}
                            </div>
                          </div>
                          <q-badge color="negative">LIMITA</q-badge>
                        </div>
                      </q-card>
                    </div>
                    <div v-else class="text-caption text-grey-7">
                      Selecciona un paquete para ver el material limitante.
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-lg-6">
                <q-card bordered class="bg-white rounded-borders">
                  <q-card-section>
                    <div class="text-subtitle1 text-weight-bold">
                      Detalle de requerimientos
                    </div>
                    <div class="text-caption text-grey-7">
                      Lo que requiere 1 lote, y lo que requeriría tu objetivo.
                    </div>
                  </q-card-section>

                  <q-separator />

                  <q-card-section class="q-pa-none">
                    <q-table
                      flat
                      :rows="calcRows"
                      :columns="calcColumns"
                      row-key="materialId"
                      :rows-per-page-options="[50]"
                      hide-bottom
                      class="rounded-table"
                    >
                      <template #body-cell-stock="props">
                        <q-td :props="props">
                          <div class="text-weight-bold">
                            {{ props.row.stock }} {{ props.row.unit }}
                          </div>
                        </q-td>
                      </template>

                      <template #body-cell-reqBatch="props">
                        <q-td :props="props">
                          <div class="text-weight-bold">
                            {{ props.row.reqPerBatch }} {{ props.row.unit }}
                          </div>
                          <div class="text-caption text-grey-7">
                            Incluye merma: {{ props.row.wastePct }}%
                          </div>
                        </q-td>
                      </template>

                      <template #body-cell-reqDesired="props">
                        <q-td :props="props">
                          <div class="text-weight-bold">
                            {{ props.row.reqForDesired }} {{ props.row.unit }}
                          </div>
                          <div
                            class="text-caption"
                            :class="
                              props.row.enough
                                ? 'text-positive'
                                : 'text-negative'
                            "
                          >
                            {{ props.row.enough ? "Alcanza" : "No alcanza" }}
                          </div>
                        </q-td>
                      </template>

                      <template #no-data>
                        <div class="q-pa-md text-grey-7">
                          Selecciona un paquete para ver el detalle.
                        </div>
                      </template>
                    </q-table>
                  </q-card-section>
                </q-card>

                <q-card bordered class="bg-white rounded-borders q-mt-md">
                  <q-card-section>
                    <div class="text-subtitle2 text-weight-bold">
                      Inventario
                    </div>
                    <div class="text-caption text-grey-7">
                      Stocks de ejemplo usados por la calculadora.
                    </div>
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
                            Stock: {{ m.stock }} {{ m.unit }} · Min:
                            {{ m.min }} {{ m.unit }}
                          </div>
                        </div>
                        <q-badge
                          :color="m.stock <= m.min ? 'negative' : 'primary'"
                        >
                          {{ m.stock <= m.min ? "BAJO" : "OK" }}
                        </q-badge>
                      </div>
                    </q-card>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>

    <!-- CREATE/EDIT/VIEW DIALOG -->
    <q-dialog v-model="dlg.open" persistent maximized>
      <q-card class="bg-grey-1">
        <q-card-section class="row items-center justify-between bg-white">
          <div>
            <div class="text-h6 text-weight-bold">
              {{
                dlg.mode === "create"
                  ? "Nuevo paquete"
                  : dlg.mode === "edit"
                  ? "Editar paquete"
                  : "Detalle del paquete"
              }}
              <span v-if="dlg.form.code" class="text-grey-7"
                >— {{ dlg.form.code }}</span
              >
            </div>
            <div class="text-caption text-grey-7">
              Define materiales por lote y rendimiento del lote.
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-badge :color="dlg.form.isActive ? 'green' : 'orange'" outline>
              {{ dlg.form.isActive ? "ACTIVO" : "INACTIVO" }}
            </q-badge>
            <q-btn dense flat round icon="close" @click="dlg.open = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-lg-8">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">
                    Datos del paquete
                  </div>
                  <div class="text-caption text-grey-7">
                    Nombre, producto resultante y rendimiento por lote.
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      outlined
                      dense
                      v-model="dlg.form.name"
                      label="Nombre del paquete"
                      :disable="isReadOnly"
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-input
                      outlined
                      dense
                      v-model="dlg.form.productName"
                      label="Producto final"
                      :disable="isReadOnly"
                      placeholder="Ej: Mesa M1"
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-input
                      outlined
                      dense
                      type="number"
                      v-model.number="dlg.form.yieldQty"
                      label="Rendimiento (unidades por lote)"
                      :disable="isReadOnly"
                      min="1"
                      step="1"
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-toggle
                      v-model="dlg.form.isActive"
                      label="Activo"
                      :disable="isReadOnly"
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
                </q-card-section>

                <q-separator />

                <q-card-section>
                  <div class="row items-center justify-between q-mb-sm">
                    <div>
                      <div class="text-subtitle2 text-weight-bold">
                        Materiales por lote
                      </div>
                      <div class="text-caption text-grey-7">
                        Cantidad necesaria para fabricar 1 lote. Merma opcional.
                      </div>
                    </div>

                    <q-btn
                      v-if="!isReadOnly"
                      outline
                      icon="add"
                      label="Agregar material"
                      @click="addComponent()"
                    />
                  </div>

                  <q-table
                    flat
                    :rows="dlg.form.components"
                    :columns="compColumns"
                    row-key="rowId"
                    hide-bottom
                    class="rounded-table"
                  >
                    <template #body-cell-materialId="props">
                      <q-td :props="props">
                        <q-select
                          dense
                          outlined
                          v-model="props.row.materialId"
                          :options="materialOptions"
                          emit-value
                          map-options
                          :disable="isReadOnly"
                        />
                      </q-td>
                    </template>

                    <template #body-cell-qtyPerBatch="props">
                      <q-td :props="props">
                        <q-input
                          dense
                          outlined
                          type="number"
                          v-model.number="props.row.qtyPerBatch"
                          :disable="isReadOnly"
                          min="0"
                          step="0.01"
                        />
                      </q-td>
                    </template>

                    <template #body-cell-unit="props">
                      <q-td :props="props">
                        <q-badge outline color="primary">
                          {{ unitByMaterial(props.row.materialId) || "—" }}
                        </q-badge>
                      </q-td>
                    </template>

                    <template #body-cell-wastePct="props">
                      <q-td :props="props">
                        <q-input
                          dense
                          outlined
                          type="number"
                          v-model.number="props.row.wastePct"
                          :disable="isReadOnly"
                          min="0"
                          step="0.1"
                          suffix="%"
                        />
                      </q-td>
                    </template>

                    <template #body-cell-effective="props">
                      <q-td :props="props">
                        <div class="text-weight-bold">
                          {{ effectiveReq(props.row) }}
                          {{ unitByMaterial(props.row.materialId) || "" }}
                        </div>
                        <div class="text-caption text-grey-7">
                          req. real (con merma)
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
                          @click="removeComponent(props.row.rowId)"
                        />
                      </q-td>
                    </template>

                    <template #no-data>
                      <div class="q-pa-md text-grey-7">
                        Agrega al menos un material al paquete.
                      </div>
                    </template>
                  </q-table>
                </q-card-section>

                <q-separator />

                <q-card-section>
                  <div class="row items-center justify-between">
                    <div class="text-caption text-grey-7">
                      Última actualización:
                      <b>{{ dlg.form.updatedAt || "—" }}</b>
                    </div>

                    <div class="row items-center q-gutter-sm">
                      <q-btn flat label="Cerrar" @click="dlg.open = false" />

                      <q-btn
                        v-if="dlg.mode !== 'view'"
                        unelevated
                        color="primary"
                        icon="save"
                        label="Guardar"
                        @click="savePackage()"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-lg-4">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">
                    Vista previa
                  </div>
                  <div class="text-caption text-grey-7">
                    Rendimiento y materiales efectivos por lote.
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="q-gutter-sm">
                  <q-banner class="bg-grey-2 rounded-borders">
                    <div class="text-caption text-grey-7">
                      Este paquete produce
                      <b>{{ dlg.form.yieldQty || 0 }}</b> unidades por lote.
                    </div>
                  </q-banner>

                  <q-card
                    v-for="c in previewComponents"
                    :key="c.materialId + '_' + c.rowId"
                    bordered
                    flat
                    class="q-pa-sm rounded-borders"
                  >
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-weight-medium">
                          {{ materialName(c.materialId) }}
                        </div>
                        <div class="text-caption text-grey-7">
                          Req: {{ effectiveReq(c) }}
                          {{ unitByMaterial(c.materialId) }} (merma
                          {{ c.wastePct }}%)
                        </div>
                      </div>
                      <q-badge outline color="primary">
                        Stock: {{ stockByMaterial(c.materialId) }}
                        {{ unitByMaterial(c.materialId) }}
                      </q-badge>
                    </div>
                  </q-card>

                  <div
                    v-if="!previewComponents.length"
                    class="text-caption text-grey-7"
                  >
                    Agrega materiales para ver la vista previa.
                  </div>

                  <!-- <q-separator /> -->

                  <!-- <q-banner class="bg-grey-2 rounded-borders">
                    <div class="text-caption text-grey-7">
                      Todo está hardcode. Luego lo conectamos a inventario real y órdenes de trabajo.
                    </div>
                  </q-banner> -->
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();

const tab = ref("packages");

const statusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Activos", value: "ACTIVE" },
  { label: "Inactivos", value: "INACTIVE" },
];

const filters = reactive({
  search: "",
  status: "ALL",
});

/** Mock materials + inventory (usado por la calculadora) */
const materials = ref([
  { id: "m1", name: "Doog Poop Scoop Size L", unit: "kg", stock: 1, min: 12 },
  { id: "m2", name: "Cotton Rope Ball Toy", unit: "caja", stock: 1, min: 5 },
  { id: "m3", name: "Rools of waste bags", unit: "unidad", stock: 4, min: 15 },
  {
    id: "m4",
    name: "Happy tails Box Size XL",
    unit: "unidad",
    stock: 1,
    min: 15,
  },
  {
    id: "m4",
    name: "Plastic bag box",
    unit: "unidad",
    stock: 1,
    min: 15,
  },
]);

/** Mock packages */
const packages = ref([
  {
    id: "p1",
    code: "KIT-00001",
    name: "Kit Mesa M1 (Lote)",
    productName: "Mesa M1",
    yieldQty: 10,
    isActive: true,
    notes: "Receta base para mesa pequeña.",
    updatedAt: todayYMD(),
    components: [
      { rowId: "r1", materialId: "m1", qtyPerBatch: 6, wastePct: 5 }, // 6kg + 5% merma
      { rowId: "r2", materialId: "m2", qtyPerBatch: 2, wastePct: 0 }, // 2 cajas
      { rowId: "r3", materialId: "m3", qtyPerBatch: 10, wastePct: 0 }, // 10 lijas
    ],
  },
  {
    id: "p2",
    code: "KIT-00002",
    name: "Kit Reparación (Lote)",
    productName: "Servicio reparación",
    yieldQty: 20,
    isActive: true,
    notes: "Consumibles para 20 servicios.",
    updatedAt: todayMinus(2),
    components: [
      { rowId: "r1", materialId: "m4", qtyPerBatch: 2, wastePct: 10 },
      { rowId: "r2", materialId: "m3", qtyPerBatch: 8, wastePct: 0 },
    ],
  },
  {
    id: "p3",
    code: "KIT-00003",
    name: "Kit Mesa Pro (Lote)",
    productName: "Mesa Pro",
    yieldQty: 6,
    isActive: false,
    notes: "En revisión por cambios de receta.",
    updatedAt: todayMinus(7),
    components: [
      { rowId: "r1", materialId: "m1", qtyPerBatch: 8, wastePct: 8 },
      { rowId: "r2", materialId: "m2", qtyPerBatch: 3, wastePct: 0 },
      { rowId: "r3", materialId: "m4", qtyPerBatch: 2, wastePct: 0 },
    ],
  },
]);

/** Table columns */
const pkgColumns = [
  {
    name: "code",
    label: "Código",
    field: "code",
    align: "left",
    sortable: true,
  },
  {
    name: "name",
    label: "Paquete",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "productName",
    label: "Producto final",
    field: "productName",
    align: "left",
    sortable: true,
  },
  {
    name: "yield",
    label: "Rendimiento",
    field: "yieldQty",
    align: "left",
    sortable: false,
  },
  {
    name: "components",
    label: "Materiales",
    field: "components",
    align: "left",
    sortable: false,
  },
  {
    name: "status",
    label: "Estatus",
    field: "isActive",
    align: "left",
    sortable: false,
  },
  {
    name: "updatedAt",
    label: "Actualizado",
    field: "updatedAt",
    align: "left",
    sortable: true,
  },
  {
    name: "actions",
    label: "",
    field: "actions",
    align: "right",
    sortable: false,
  },
];

const compColumns = [
  { name: "materialId", label: "Material", field: "materialId", align: "left" },
  {
    name: "qtyPerBatch",
    label: "Cantidad por lote",
    field: "qtyPerBatch",
    align: "left",
  },
  { name: "unit", label: "Unidad", field: "unit", align: "left" },
  { name: "wastePct", label: "Merma", field: "wastePct", align: "left" },
  { name: "effective", label: "Req. real", field: "effective", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" },
];

const materialOptions = computed(() =>
  materials.value.map((m) => ({ label: m.name, value: m.id }))
);

const filteredPackages = computed(() => {
  const q = filters.search.trim().toLowerCase();
  const st = filters.status;

  return packages.value.filter((p) => {
    const okStatus =
      st === "ALL" ? true : st === "ACTIVE" ? p.isActive : !p.isActive;
    if (!okStatus) return false;

    if (!q) return true;

    return (
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.productName.toLowerCase().includes(q)
    );
  });
});

const kpi = computed(() => {
  const total = packages.value.length;
  const active = packages.value.filter((p) => p.isActive).length;
  return { total, active, inactive: total - active };
});

/** Dialog */
const dlg = reactive({
  open: false,
  mode: "create",
  editingId: "",
  form: emptyPackage(),
});

const isReadOnly = computed(() => dlg.mode === "view");

const previewComponents = computed(() => {
  return (dlg.form.components || []).filter(
    (c) => c.materialId && (Number(c.qtyPerBatch) || 0) > 0
  );
});

/** Calculator */
const calc = reactive({
  packageId: "",
  desiredUnits: 0,
});

const selectedCalcPackage = computed(() => {
  return packages.value.find((p) => p.id === calc.packageId) || null;
});

const packageOptions = computed(() =>
  packages.value
    .filter((p) => p.isActive)
    .map((p) => ({ label: `${p.name} — (${p.yieldQty} unidad/lote)`, value: p.id }))
);

function effectiveReq(comp) {
  const base = Number(comp.qtyPerBatch) || 0;
  const waste = Number(comp.wastePct) || 0;
  const eff = base * (1 + waste / 100);
  return round2(eff);
}

/**
 * batchesPossible = min( stock(material) / effectiveReqPerBatch(material) )
 * unitsPossible = batchesPossible * yieldQty
 */
const calcResult = computed(() => {
  const p = selectedCalcPackage.value;
  if (!p || !p.components.length || p.yieldQty <= 0) {
    return {
      batchesPossible: 0,
      unitsPossible: 0,
      limiting: null
    };
  }

  let limiting = null;
  let minBatches = Infinity;

  for (const c of p.components) {
    const mid = c.materialId;
    if (!mid) continue;

    const req = effectiveReq(c);
    if (req <= 0) continue;

    const stock = stockByMaterial(mid);
    const batches = Math.floor(stock / req);

    if (batches < minBatches) {
      minBatches = batches;
      limiting = {
        materialId: mid,
        name: materialName(mid),
        unit: unitByMaterial(mid),
        stock,
        reqPerBatch: req,
        batchesPossibleForThis: batches,
      };
    }
  }

  if (!Number.isFinite(minBatches)) minBatches = 0;

  const batchesPossible = Math.max(0, minBatches);
  const unitsPossible = Math.max(0, batchesPossible * (p.yieldQty || 0));

  return { batchesPossible, unitsPossible, limiting };
});

/**
 * Si usuario quiere X unidades:
 * batchesNeeded = ceil(X / yieldQty)
 * reqForDesired = batchesNeeded * reqPerBatch
 */
const calcRows = computed(() => {
  const p = selectedCalcPackage.value;
  if (!p) return [];

  const desired = Math.max(0, Math.floor(Number(calc.desiredUnits) || 0));
  const yieldQty = Math.max(1, Math.floor(Number(p.yieldQty) || 1));
  const batchesNeeded = desired > 0 ? Math.ceil(desired / yieldQty) : 0;

  return p.components
    .filter((c) => c.materialId && effectiveReq(c) > 0)
    .map((c) => {
      const mid = c.materialId;
      const unit = unitByMaterial(mid);
      const stock = stockByMaterial(mid);

      const reqPerBatch = effectiveReq(c);
      const reqForDesired = round2(batchesNeeded * reqPerBatch);

      return {
        materialId: mid,
        materialName: materialName(mid),
        unit,
        stock: round2(stock),
        wastePct: round2(Number(c.wastePct) || 0),
        reqPerBatch: round2(reqPerBatch),
        reqForDesired,
        enough: desired === 0 ? true : stock >= reqForDesired,
      };
    });
});

const calcColumns = [
  {
    name: "materialName",
    label: "Material",
    field: "materialName",
    align: "left",
  },
  { name: "stock", label: "Disponible", field: "stock", align: "left" },
  {
    name: "reqBatch",
    label: "Req. por lote",
    field: "reqPerBatch",
    align: "left",
  },
  {
    name: "reqDesired",
    label: "Req. objetivo",
    field: "reqForDesired",
    align: "left",
  },
];

/** Actions */
function openCreate() {
  dlg.open = true;
  dlg.mode = "create";
  dlg.editingId = "";
  dlg.form = emptyPackage();
  dlg.form.id = uid("pkg");
  dlg.form.code = nextPackageCode();
  dlg.form.updatedAt = todayYMD();
  dlg.form.components = [newComponentRow()];
}

function openEdit(p) {
  dlg.open = true;
  dlg.mode = "edit";
  dlg.editingId = p.id;
  dlg.form = deepClone(p);
}

function openView(p) {
  dlg.open = true;
  dlg.mode = "view";
  dlg.editingId = p.id;
  dlg.form = deepClone(p);
}

function addComponent() {
  dlg.form.components.push(newComponentRow());
}

function removeComponent(rowId) {
  dlg.form.components = dlg.form.components.filter((x) => x.rowId !== rowId);
}

function savePackage() {
  // Validaciones mínimas (hardcode)
  if (!dlg.form.name.trim()) return notifyErr("Nombre requerido");
  if (!dlg.form.productName.trim())
    return notifyErr("Producto final requerido");
  if (!dlg.form.yieldQty || dlg.form.yieldQty <= 0)
    return notifyErr("Rendimiento inválido");
  if (!dlg.form.components.length)
    return notifyErr("Agrega materiales al paquete");

  // limpiar componentes inválidos
  dlg.form.components = dlg.form.components
    .filter((c) => c.materialId && (Number(c.qtyPerBatch) || 0) > 0)
    .map((c) => ({
      ...c,
      qtyPerBatch: round2(Number(c.qtyPerBatch) || 0),
      wastePct: round2(Number(c.wastePct) || 0),
    }));

  if (!dlg.form.components.length)
    return notifyErr("Agrega materiales con cantidad válida");

  dlg.form.updatedAt = todayYMD();

  if (dlg.mode === "create") {
    packages.value = [deepClone(dlg.form), ...packages.value];
  } else {
    packages.value = packages.value.map((x) =>
      x.id === dlg.editingId ? deepClone(dlg.form) : x
    );
  }

  $q.notify({
    message: "Paquete guardado (simulado).",
    color: "positive",
    position: "top",
  });
  dlg.open = false;
}

function duplicate(p) {
  const copy = deepClone(p);
  copy.id = uid("pkg");
  copy.code = nextPackageCode();
  copy.name = `${copy.name} (Copia)`;
  copy.updatedAt = todayYMD();
  copy.components = copy.components.map((c) => ({ ...c, rowId: uid("row") }));
  packages.value = [copy, ...packages.value];

  $q.notify({
    message: "Paquete duplicado (hardcode).",
    color: "primary",
    position: "top",
  });
}

function removePackage(id) {
  $q.dialog({
    title: "Eliminar paquete",
    message: "Esto lo eliminará del arreglo local (hardcode).",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    packages.value = packages.value.filter((x) => x.id !== id);
    $q.notify({
      message: "Paquete eliminado.",
      color: "negative",
      position: "top",
    });
  });
}

/** Helpers */
function newComponentRow() {
  return {
    rowId: uid("row"),
    materialId: "",
    qtyPerBatch: 1,
    wastePct: 0,
  };
}

function emptyPackage() {
  return {
    id: "",
    code: "",
    name: "",
    productName: "",
    yieldQty: 1,
    isActive: true,
    notes: "",
    updatedAt: "",
    components: [],
  };
}

function materialName(materialId) {
  return materials.value.find((m) => m.id === materialId)?.name || "—";
}

function unitByMaterial(materialId) {
  return materials.value.find((m) => m.id === materialId)?.unit || "";
}

function stockByMaterial(materialId) {
  return Number(materials.value.find((m) => m.id === materialId)?.stock || 0);
}

function summaryFirstMaterials(p) {
  const names = p.components
    .map((c) => materialName(c.materialId))
    .filter((x) => x && x !== "—")
    .slice(0, 2);

  if (!names.length) return "—";
  if (p.components.length <= 2) return names.join(", ");
  return `${names.join(", ")}…`;
}

function notifyErr(msg) {
  $q.notify({ message: msg, color: "negative", position: "top" });
}

function nextPackageCode() {
  let max = 0;
  for (const p of packages.value) {
    const m = p.code.match(/KIT-(\d+)/);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  const next = String(max + 1).padStart(5, "0");
  return `KIT-${next}`;
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

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
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
