<template>
  <q-page class="q-pa-md">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Órdenes de trabajo</div>
        <div class="text-grey-7">
          Flujo: Cotización → Orden → Factura (simulado).
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-input
            outlined
            dense
            debounce="250"
            v-model="filters.search"
            placeholder="Buscar por cliente, código…"
            style="min-width: 280px"
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

          <q-btn
            unelevated
            color="primary"
            icon="add"
            label="Nueva cotización"
            @click="openCreateQuote()"
          />
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- MAIN CARD -->
    <q-card bordered class="bg-white rounded-borders">
      <q-card-section>
        <q-tabs v-model="tab" dense class="text-grey-8">
          <q-tab name="quotes" icon="request_quote" label="Cotizaciones" />
          <q-tab name="orders" icon="assignment" label="Órdenes" />
          <q-tab name="invoices" icon="receipt_long" label="Facturas" />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-md">
        <q-tab-panels v-model="tab" animated>
          <!-- ===================== COTIZACIONES ===================== -->
          <q-tab-panel name="quotes" class="q-pa-none">
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12 col-sm-6 col-lg-3">
                <KpiCard icon="request_quote" label="Cotizaciones" :value="kpiQuotes.total" />
              </div>
              <div class="col-12 col-sm-6 col-lg-3">
                <KpiCard icon="schedule" label="Borradores" :value="kpiQuotes.draft" />
              </div>
              <div class="col-12 col-sm-6 col-lg-3">
                <KpiCard icon="check_circle" label="Aprobadas" :value="kpiQuotes.approved" />
              </div>
              <div class="col-12 col-sm-6 col-lg-3">
                <KpiCard icon="sync_alt" label="Convertidas a OT" :value="kpiQuotes.converted" />
              </div>
            </div>

            <div class="row items-center q-col-gutter-md q-mb-sm">
              <div class="col-12 col-md-4">
                <q-select
                  outlined
                  dense
                  v-model="filters.quoteStatus"
                  :options="quoteStatusOptions"
                  emit-value
                  map-options
                  label="Estatus"
                />
              </div>
              <div class="col-12 col-md-8 text-right">
                <q-badge outline color="primary">
                  {{ filteredQuotes.length }} visibles
                </q-badge>
              </div>
            </div>

            <q-table
              flat
              :rows="filteredQuotes"
              :columns="quoteColumns"
              row-key="id"
              :rows-per-page-options="[10, 20, 50]"
              :pagination="{ rowsPerPage: 10 }"
              class="rounded-table"
            >
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-badge :color="quoteStatusColor(props.row.status)">
                    {{ quoteStatusLabel(props.row.status) }}
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-total="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ money(props.row.totals.total) }}</div>
                  <div class="text-caption text-grey-7">
                    Sub: {{ money(props.row.totals.subtotal) }} · Imp: {{ money(props.row.totals.tax) }}
                  </div>
                </q-td>
              </template>

              <template #body-cell-actions="props">
                <q-td :props="props" class="text-right">
                  <q-btn flat round dense icon="visibility" @click="openViewQuote(props.row)">
                    <q-tooltip>Ver</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense icon="edit" @click="openEditQuote(props.row)">
                    <q-tooltip>Editar</q-tooltip>
                  </q-btn>

                  <q-btn
                    flat
                    round
                    dense
                    icon="sync_alt"
                    color="primary"
                    @click="convertQuoteToOrder(props.row.id)"
                  >
                    <q-tooltip>Convertir a Orden</q-tooltip>
                  </q-btn>

                  <q-btn flat round dense icon="delete" color="negative" @click="deleteQuote(props.row.id)">
                    <q-tooltip>Eliminar (hardcode)</q-tooltip>
                  </q-btn>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">
                  No hay cotizaciones con estos filtros.
                </div>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- ===================== ORDENES ===================== -->
          <q-tab-panel name="orders" class="q-pa-none">
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12 col-sm-6 col-lg-3">
                <KpiCard icon="assignment" label="Órdenes" :value="kpiOrders.total" />
              </div>
              <div class="col-12 col-sm-6 col-lg-3">
                <KpiCard icon="pending_actions" label="Pendientes" :value="kpiOrders.pending" />
              </div>
              <div class="col-12 col-sm-6 col-lg-3">
                <KpiCard icon="precision_manufacturing" label="En producción" :value="kpiOrders.inProduction" />
              </div>
              <div class="col-12 col-sm-6 col-lg-3">
                <KpiCard icon="local_shipping" label="Para entrega" :value="kpiOrders.readyToDeliver" />
              </div>
            </div>

            <div class="row items-center q-col-gutter-md q-mb-sm">
              <div class="col-12 col-md-4">
                <q-select
                  outlined
                  dense
                  v-model="filters.orderStatus"
                  :options="orderStatusOptions"
                  emit-value
                  map-options
                  label="Estatus"
                />
              </div>
              <div class="col-12 col-md-8 text-right">
                <q-badge outline color="primary">
                  {{ filteredOrders.length }} visibles
                </q-badge>
              </div>
            </div>

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
                  <q-badge :color="orderStatusColor(props.row.status)">
                    {{ orderStatusLabel(props.row.status) }}
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-total="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ money(props.row.totals.total) }}</div>
                  <div class="text-caption text-grey-7">
                    Items: {{ props.row.items.length }} · Prioridad: {{ props.row.priority }}
                  </div>
                </q-td>
              </template>

              <template #body-cell-actions="props">
                <q-td :props="props" class="text-right">
                  <q-btn flat round dense icon="visibility" @click="openViewOrder(props.row)">
                    <q-tooltip>Ver</q-tooltip>
                  </q-btn>

                  <q-btn flat round dense icon="edit" @click="openEditOrder(props.row)">
                    <q-tooltip>Editar</q-tooltip>
                  </q-btn>

                  <q-btn flat dense icon="more_vert">
                    <q-menu>
                      <q-list style="min-width: 240px">
                        <q-item clickable v-close-popup @click="setOrderStatus(props.row.id, 'PENDING')">
                          <q-item-section avatar><q-icon name="pending_actions" /></q-item-section>
                          <q-item-section>Poner: Pendiente</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="setOrderStatus(props.row.id, 'IN_PRODUCTION')">
                          <q-item-section avatar><q-icon name="precision_manufacturing" /></q-item-section>
                          <q-item-section>Poner: En producción</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="setOrderStatus(props.row.id, 'READY')">
                          <q-item-section avatar><q-icon name="task_alt" /></q-item-section>
                          <q-item-section>Poner: Lista</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="setOrderStatus(props.row.id, 'READY_TO_DELIVER')">
                          <q-item-section avatar><q-icon name="local_shipping" /></q-item-section>
                          <q-item-section>Poner: Para entrega</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="setOrderStatus(props.row.id, 'DELIVERED')">
                          <q-item-section avatar><q-icon name="check_circle" /></q-item-section>
                          <q-item-section>Poner: Entregada</q-item-section>
                        </q-item>

                        <q-separator />

                        <q-item clickable v-close-popup @click="convertOrderToInvoice(props.row.id)">
                          <q-item-section avatar><q-icon name="receipt_long" /></q-item-section>
                          <q-item-section>Convertir a Factura</q-item-section>
                        </q-item>

                        <q-item clickable v-close-popup @click="deleteOrder(props.row.id)">
                          <q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section>
                          <q-item-section class="text-negative">Eliminar (hardcode)</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">
                  No hay órdenes con estos filtros.
                </div>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- ===================== FACTURAS ===================== -->
          <q-tab-panel name="invoices" class="q-pa-none">
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12 col-sm-6 col-lg-3">
                <KpiCard icon="receipt_long" label="Facturas" :value="kpiInvoices.total" />
              </div>
              <div class="col-12 col-sm-6 col-lg-3">
                <KpiCard icon="hourglass_bottom" label="Pendientes" :value="kpiInvoices.pending" />
              </div>
              <div class="col-12 col-sm-6 col-lg-3">
                <KpiCard icon="paid" label="Pagadas" :value="kpiInvoices.paid" />
              </div>
              <div class="col-12 col-sm-6 col-lg-3">
                <KpiCard icon="block" label="Anuladas" :value="kpiInvoices.void" />
              </div>
            </div>

            <div class="row items-center q-col-gutter-md q-mb-sm">
              <div class="col-12 col-md-4">
                <q-select
                  outlined
                  dense
                  v-model="filters.invoiceStatus"
                  :options="invoiceStatusOptions"
                  emit-value
                  map-options
                  label="Estatus"
                />
              </div>
              <div class="col-12 col-md-8 text-right">
                <q-badge outline color="primary">
                  {{ filteredInvoices.length }} visibles
                </q-badge>
              </div>
            </div>

            <q-table
              flat
              :rows="filteredInvoices"
              :columns="invoiceColumns"
              row-key="id"
              :rows-per-page-options="[10, 20, 50]"
              :pagination="{ rowsPerPage: 10 }"
              class="rounded-table"
            >
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-badge :color="invoiceStatusColor(props.row.status)">
                    {{ invoiceStatusLabel(props.row.status) }}
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-total="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ money(props.row.totals.total) }}</div>
                  <div class="text-caption text-grey-7">
                    OT: {{ orderCodeById(props.row.orderId) || "—" }}
                  </div>
                </q-td>
              </template>

              <template #body-cell-actions="props">
                <q-td :props="props" class="text-right">
                  <q-btn flat round dense icon="visibility" @click="openViewInvoice(props.row)">
                    <q-tooltip>Ver</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense icon="edit" @click="openEditInvoice(props.row)">
                    <q-tooltip>Editar</q-tooltip>
                  </q-btn>

                  <q-btn flat dense icon="more_vert">
                    <q-menu>
                      <q-list style="min-width: 220px">
                        <q-item clickable v-close-popup @click="setInvoiceStatus(props.row.id, 'PENDING')">
                          <q-item-section avatar><q-icon name="hourglass_bottom" /></q-item-section>
                          <q-item-section>Poner: Pendiente</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="setInvoiceStatus(props.row.id, 'PAID')">
                          <q-item-section avatar><q-icon name="paid" /></q-item-section>
                          <q-item-section>Poner: Pagada</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="setInvoiceStatus(props.row.id, 'VOID')">
                          <q-item-section avatar><q-icon name="block" /></q-item-section>
                          <q-item-section>Poner: Anulada</q-item-section>
                        </q-item>

                        <q-separator />

                        <q-item clickable v-close-popup @click="deleteInvoice(props.row.id)">
                          <q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section>
                          <q-item-section class="text-negative">Eliminar (hardcode)</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">
                  No hay facturas con estos filtros.
                </div>
              </template>
            </q-table>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>

    <!-- ===================== DIALOG: COTIZACION ===================== -->
    <q-dialog v-model="quoteDlg.open" persistent maximized>
      <q-card class="bg-grey-1">
        <q-card-section class="row items-center justify-between bg-white">
          <div>
            <div class="text-h6 text-weight-bold">
              {{
                quoteDlg.mode === "create"
                  ? "Nueva cotización"
                  : quoteDlg.mode === "edit"
                    ? "Editar cotización"
                    : "Detalle cotización"
              }}
              <span v-if="quoteDlg.form.code" class="text-grey-7">— {{ quoteDlg.form.code }}</span>
            </div>
            <div class="text-caption text-grey-7">
              Cliente, items y totales (simulado).
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-badge outline :color="quoteStatusColor(quoteDlg.form.status)">
              {{ quoteStatusLabel(quoteDlg.form.status) }}
            </q-badge>
            <q-btn dense flat round icon="close" @click="quoteDlg.open = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-lg-8">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">Datos del cliente</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input outlined dense v-model="quoteDlg.form.clientName" label="Cliente" :disable="quoteReadOnly" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input outlined dense v-model="quoteDlg.form.clientPhone" label="Teléfono" :disable="quoteReadOnly" />
                  </div>
                  <div class="col-12">
                    <q-input outlined dense v-model="quoteDlg.form.clientAddress" label="Dirección" :disable="quoteReadOnly" />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-select
                      outlined
                      dense
                      v-model="quoteDlg.form.status"
                      :disable="quoteReadOnly"
                      :options="quoteDlgStatusOptions"
                      emit-value
                      map-options
                      label="Estatus"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input outlined dense v-model="quoteDlg.form.date" label="Fecha" :disable="quoteReadOnly" />
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section>
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle2 text-weight-bold">Items</div>
                    <q-btn
                      v-if="!quoteReadOnly"
                      outline
                      icon="add"
                      label="Agregar"
                      @click="addQuoteItem()"
                    />
                  </div>

                  <q-table
                    flat
                    :rows="quoteDlg.form.items"
                    :columns="itemColumns"
                    row-key="rowId"
                    hide-bottom
                    class="rounded-table"
                  >
                    <template #body-cell-name="props">
                      <q-td :props="props">
                        <q-input dense outlined v-model="props.row.name" :disable="quoteReadOnly" />
                      </q-td>
                    </template>

                    <template #body-cell-qty="props">
                      <q-td :props="props">
                        <q-input dense outlined type="number" v-model.number="props.row.qty" :disable="quoteReadOnly" min="1" />
                      </q-td>
                    </template>

                    <template #body-cell-price="props">
                      <q-td :props="props">
                        <q-input dense outlined type="number" v-model.number="props.row.price" :disable="quoteReadOnly" min="0" />
                      </q-td>
                    </template>

                    <template #body-cell-sub="props">
                      <q-td :props="props">
                        <div class="text-weight-bold">{{ money(itemSubtotal(props.row)) }}</div>
                      </q-td>
                    </template>

                    <template #body-cell-actions="props">
                      <q-td :props="props" class="text-right">
                        <q-btn
                          v-if="!quoteReadOnly"
                          flat
                          round
                          dense
                          icon="delete"
                          color="negative"
                          @click="removeQuoteItem(props.row.rowId)"
                        />
                      </q-td>
                    </template>

                    <template #no-data>
                      <div class="q-pa-md text-grey-7">
                        Agrega al menos un item.
                      </div>
                    </template>
                  </q-table>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-lg-4">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">Totales</div>
                  <div class="text-caption text-grey-7">Cálculo automático (hardcode).</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-gutter-sm">
                  <q-card bordered flat class="bg-grey-1 rounded-borders q-pa-sm">
                    <div class="row items-center justify-between">
                      <div class="text-grey-7 text-caption">Subtotal</div>
                      <div class="text-weight-bold">{{ money(quoteTotals.subtotal) }}</div>
                    </div>
                    <div class="row items-center justify-between q-mt-xs">
                      <div class="text-grey-7 text-caption">Impuesto ({{ taxPct }}%)</div>
                      <div class="text-weight-bold">{{ money(quoteTotals.tax) }}</div>
                    </div>
                    <q-separator class="q-my-sm" />
                    <div class="row items-center justify-between">
                      <div class="text-grey-7 text-caption">Total</div>
                      <div class="text-h6 text-weight-bold">{{ money(quoteTotals.total) }}</div>
                    </div>
                  </q-card>

                  <q-banner class="bg-grey-2 rounded-borders">
                    <div class="text-caption text-grey-7">
                      Puedes convertir esta cotización a Orden desde el listado, o desde aquí.
                    </div>
                  </q-banner>

                  <div class="row q-gutter-sm">
                    <q-btn flat class="col" label="Cerrar" @click="quoteDlg.open = false" />
                    <q-btn
                      v-if="quoteDlg.mode !== 'view'"
                      unelevated
                      class="col"
                      color="primary"
                      icon="save"
                      label="Guardar"
                      @click="saveQuote()"
                    />
                    <q-btn
                      v-if="quoteDlg.mode === 'view'"
                      unelevated
                      class="col"
                      color="primary"
                      icon="sync_alt"
                      label="A Orden"
                      @click="convertQuoteToOrder(quoteDlg.form.id)"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- ===================== DIALOG: ORDEN ===================== -->
    <q-dialog v-model="orderDlg.open" persistent maximized>
      <q-card class="bg-grey-1">
        <q-card-section class="row items-center justify-between bg-white">
          <div>
            <div class="text-h6 text-weight-bold">
              {{
                orderDlg.mode === "edit" ? "Editar orden" : "Detalle orden"
              }}
              <span v-if="orderDlg.form.code" class="text-grey-7">— {{ orderDlg.form.code }}</span>
            </div>
            <div class="text-caption text-grey-7">
              Incluye items, dirección y materiales sugeridos.
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-badge outline :color="orderStatusColor(orderDlg.form.status)">
              {{ orderStatusLabel(orderDlg.form.status) }}
            </q-badge>
            <q-btn dense flat round icon="close" @click="orderDlg.open = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-lg-8">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">Datos</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input outlined dense v-model="orderDlg.form.clientName" label="Cliente" :disable="orderReadOnly" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input outlined dense v-model="orderDlg.form.clientPhone" label="Teléfono" :disable="orderReadOnly" />
                  </div>
                  <div class="col-12">
                    <q-input outlined dense v-model="orderDlg.form.clientAddress" label="Dirección" :disable="orderReadOnly" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      outlined
                      dense
                      v-model="orderDlg.form.status"
                      :disable="orderReadOnly"
                      :options="orderDlgStatusOptions"
                      emit-value
                      map-options
                      label="Estatus"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      outlined
                      dense
                      v-model="orderDlg.form.priority"
                      :disable="orderReadOnly"
                      :options="priorityOptions"
                      emit-value
                      map-options
                      label="Prioridad"
                    />
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section>
                  <div class="text-subtitle2 text-weight-bold q-mb-sm">Items</div>

                  <q-table
                    flat
                    :rows="orderDlg.form.items"
                    :columns="orderItemColumns"
                    row-key="rowId"
                    hide-bottom
                    class="rounded-table"
                  >
                    <template #body-cell-name="props">
                      <q-td :props="props">
                        <q-input dense outlined v-model="props.row.name" :disable="orderReadOnly" />
                      </q-td>
                    </template>
                    <template #body-cell-qty="props">
                      <q-td :props="props">
                        <q-input dense outlined type="number" v-model.number="props.row.qty" :disable="orderReadOnly" min="1" />
                      </q-td>
                    </template>
                    <template #body-cell-price="props">
                      <q-td :props="props">
                        <q-input dense outlined type="number" v-model.number="props.row.price" :disable="orderReadOnly" min="0" />
                      </q-td>
                    </template>
                    <template #body-cell-sub="props">
                      <q-td :props="props">
                        <div class="text-weight-bold">{{ money(itemSubtotal(props.row)) }}</div>
                      </q-td>
                    </template>
                  </q-table>
                </q-card-section>
              </q-card>

              <q-card bordered class="bg-white rounded-borders q-mt-md">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">Materiales sugeridos</div>
                  <div class="text-caption text-grey-7">
                    Esto luego lo conectamos con tus “Paquetes de manufactura”.
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-gutter-sm">
                  <q-card
                    v-for="m in orderDlg.form.suggestedMaterials"
                    :key="m.name"
                    bordered
                    flat
                    class="q-pa-sm rounded-borders"
                  >
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-weight-medium">{{ m.name }}</div>
                        <div class="text-caption text-grey-7">
                          Requiere: {{ m.qty }} {{ m.unit }} · Stock: {{ m.stock }} {{ m.unit }}
                        </div>
                      </div>
                      <q-badge :color="m.stock >= m.qty ? 'green' : 'negative'">
                        {{ m.stock >= m.qty ? "OK" : "FALTA" }}
                      </q-badge>
                    </div>
                  </q-card>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-lg-4">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">Totales</div>
                  <div class="text-caption text-grey-7">Cálculo automático.</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-gutter-sm">
                  <q-card bordered flat class="bg-grey-1 rounded-borders q-pa-sm">
                    <div class="row items-center justify-between">
                      <div class="text-grey-7 text-caption">Subtotal</div>
                      <div class="text-weight-bold">{{ money(orderTotals.subtotal) }}</div>
                    </div>
                    <div class="row items-center justify-between q-mt-xs">
                      <div class="text-grey-7 text-caption">Impuesto ({{ taxPct }}%)</div>
                      <div class="text-weight-bold">{{ money(orderTotals.tax) }}</div>
                    </div>
                    <q-separator class="q-my-sm" />
                    <div class="row items-center justify-between">
                      <div class="text-grey-7 text-caption">Total</div>
                      <div class="text-h6 text-weight-bold">{{ money(orderTotals.total) }}</div>
                    </div>
                  </q-card>

                  <q-separator />

                  <div class="row q-gutter-sm">
                    <q-btn flat class="col" label="Cerrar" @click="orderDlg.open = false" />
                    <q-btn
                      v-if="orderDlg.mode === 'edit'"
                      unelevated
                      class="col"
                      color="primary"
                      icon="save"
                      label="Guardar"
                      @click="saveOrder()"
                    />
                    <q-btn
                      unelevated
                      class="col"
                      color="primary"
                      icon="receipt_long"
                      label="A Factura"
                      @click="convertOrderToInvoice(orderDlg.form.id)"
                    />
                  </div>
                </q-card-section>
              </q-card>

              <q-card bordered class="bg-white rounded-borders q-mt-md">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-bold">Historial</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-gutter-sm">
                  <q-timeline color="primary">
                    <q-timeline-entry
                      v-for="h in orderDlg.form.history"
                      :key="h.id"
                      :title="h.title"
                      :subtitle="h.when"
                    >
                      <div class="text-caption text-grey-7">{{ h.note }}</div>
                    </q-timeline-entry>
                  </q-timeline>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- ===================== DIALOG: FACTURA ===================== -->
    <q-dialog v-model="invoiceDlg.open" persistent maximized>
      <q-card class="bg-grey-1">
        <q-card-section class="row items-center justify-between bg-white">
          <div>
            <div class="text-h6 text-weight-bold">
              {{ invoiceDlg.mode === "edit" ? "Editar factura" : "Detalle factura" }}
              <span v-if="invoiceDlg.form.code" class="text-grey-7">— {{ invoiceDlg.form.code }}</span>
            </div>
            <div class="text-caption text-grey-7">
              Factura generada desde una Orden (simulado).
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-badge outline :color="invoiceStatusColor(invoiceDlg.form.status)">
              {{ invoiceStatusLabel(invoiceDlg.form.status) }}
            </q-badge>
            <q-btn dense flat round icon="close" @click="invoiceDlg.open = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-lg-8">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">Datos</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input outlined dense v-model="invoiceDlg.form.clientName" label="Cliente" :disable="invoiceReadOnly" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input outlined dense v-model="invoiceDlg.form.clientPhone" label="Teléfono" :disable="invoiceReadOnly" />
                  </div>
                  <div class="col-12">
                    <q-input outlined dense v-model="invoiceDlg.form.clientAddress" label="Dirección" :disable="invoiceReadOnly" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      outlined
                      dense
                      v-model="invoiceDlg.form.status"
                      :disable="invoiceReadOnly"
                      :options="invoiceDlgStatusOptions"
                      emit-value
                      map-options
                      label="Estatus"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      outlined
                      dense
                      v-model="invoiceDlg.form.paymentMethod"
                      :disable="invoiceReadOnly"
                      :options="paymentMethodOptions"
                      emit-value
                      map-options
                      label="Método de pago"
                    />
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section>
                  <div class="text-subtitle2 text-weight-bold q-mb-sm">Items</div>

                  <q-table
                    flat
                    :rows="invoiceDlg.form.items"
                    :columns="orderItemColumns"
                    row-key="rowId"
                    hide-bottom
                    class="rounded-table"
                  >
                    <template #body-cell-name="props">
                      <q-td :props="props">
                        <q-input dense outlined v-model="props.row.name" :disable="invoiceReadOnly" />
                      </q-td>
                    </template>
                    <template #body-cell-qty="props">
                      <q-td :props="props">
                        <q-input dense outlined type="number" v-model.number="props.row.qty" :disable="invoiceReadOnly" min="1" />
                      </q-td>
                    </template>
                    <template #body-cell-price="props">
                      <q-td :props="props">
                        <q-input dense outlined type="number" v-model.number="props.row.price" :disable="invoiceReadOnly" min="0" />
                      </q-td>
                    </template>
                    <template #body-cell-sub="props">
                      <q-td :props="props">
                        <div class="text-weight-bold">{{ money(itemSubtotal(props.row)) }}</div>
                      </q-td>
                    </template>
                  </q-table>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-lg-4">
              <q-card bordered class="bg-white rounded-borders">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">Totales</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-gutter-sm">
                  <q-card bordered flat class="bg-grey-1 rounded-borders q-pa-sm">
                    <div class="row items-center justify-between">
                      <div class="text-grey-7 text-caption">Subtotal</div>
                      <div class="text-weight-bold">{{ money(invoiceTotals.subtotal) }}</div>
                    </div>
                    <div class="row items-center justify-between q-mt-xs">
                      <div class="text-grey-7 text-caption">Impuesto ({{ taxPct }}%)</div>
                      <div class="text-weight-bold">{{ money(invoiceTotals.tax) }}</div>
                    </div>
                    <q-separator class="q-my-sm" />
                    <div class="row items-center justify-between">
                      <div class="text-grey-7 text-caption">Total</div>
                      <div class="text-h6 text-weight-bold">{{ money(invoiceTotals.total) }}</div>
                    </div>
                  </q-card>

                  <div class="row q-gutter-sm">
                    <q-btn flat class="col" label="Cerrar" @click="invoiceDlg.open = false" />
                    <q-btn
                      v-if="invoiceDlg.mode === 'edit'"
                      unelevated
                      class="col"
                      color="primary"
                      icon="save"
                      label="Guardar"
                      @click="saveInvoice()"
                    />
                    <q-btn
                      unelevated
                      class="col"
                      color="positive"
                      icon="paid"
                      label="Marcar pagada"
                      @click="setInvoiceStatus(invoiceDlg.form.id, 'PAID')"
                    />
                  </div>

                  <q-banner class="bg-grey-2 rounded-borders">
                    <div class="text-caption text-grey-7">
                      OT relacionada: <b>{{ orderCodeById(invoiceDlg.form.orderId) || "—" }}</b>
                    </div>
                  </q-banner>
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
import { computed, defineComponent, h, reactive, ref } from "vue";
import { useQuasar } from "quasar";

/** -------------------- Small local KPI component (inline) -------------------- */
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
        { class: "q-card q-card--bordered bg-white rounded-borders q-pl-md" },
        h("div", { class: "q-card__section row items-center q-gutter-md" }, [
          h("i", { class: `q-icon material-icons text-primary`, style: "font-size:34px" }, props.icon),
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

/** -------------------- Settings -------------------- */
const taxPct = 18;

/** -------------------- UI State -------------------- */
const tab = ref("quotes");

const filters = reactive({
  search: "",
  quoteStatus: "ALL",
  orderStatus: "ALL",
  invoiceStatus: "ALL",
});

const quoteStatusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Borrador", value: "DRAFT" },
  { label: "Enviada", value: "SENT" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
];

const orderStatusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Pendiente", value: "PENDING" },
  { label: "En producción", value: "IN_PRODUCTION" },
  { label: "Lista", value: "READY" },
  { label: "Para entrega", value: "READY_TO_DELIVER" },
  { label: "Entregada", value: "DELIVERED" },
  { label: "Cancelada", value: "CANCELED" },
];

const invoiceStatusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Pagada", value: "PAID" },
  { label: "Anulada", value: "VOID" },
];

const priorityOptions = [
  { label: "Baja", value: "Baja" },
  { label: "Media", value: "Media" },
  { label: "Alta", value: "Alta" },
];

const paymentMethodOptions = [
  { label: "Efectivo", value: "Efectivo" },
  { label: "Transferencia", value: "Transferencia" },
  { label: "Tarjeta", value: "Tarjeta" },
];

/** -------------------- Mock Data -------------------- */
const quotes = ref([
  buildQuote({
    id: "q1",
    code: "COT-00311",
    status: "DRAFT",
    clientName: "Carlos Peña",
    clientPhone: "809-555-1234",
    clientAddress: "Av. 27 Feb #12",
    items: [
      { rowId: uid("li"), name: "Mesa M1", qty: 10, price: 2200 },
      { rowId: uid("li"), name: "Instalación", qty: 1, price: 3500 },
    ],
    convertedToOrder: false,
  }),
  buildQuote({
    id: "q2",
    code: "COT-00312",
    status: "APPROVED",
    clientName: "AutoParts SRL",
    clientPhone: "809-555-8899",
    clientAddress: "Zona Industrial",
    items: [{ rowId: uid("li"), name: "Mesa Pro", qty: 6, price: 3800 }],
    convertedToOrder: true,
  }),
]);

const orders = ref([
  buildOrder({
    id: "o1",
    code: "OT-00140",
    status: "READY_TO_DELIVER",
    priority: "Alta",
    quoteId: "q2",
    clientName: "AutoParts SRL",
    clientPhone: "809-555-8899",
    clientAddress: "Zona Industrial",
    items: [{ rowId: uid("li"), name: "Mesa Pro", qty: 6, price: 3800 }],
  }),
  buildOrder({
    id: "o2",
    code: "OT-00141",
    status: "IN_PRODUCTION",
    priority: "Media",
    clientName: "María López",
    clientPhone: "829-555-2211",
    clientAddress: "Los Prados, Calle 3",
    items: [{ rowId: uid("li"), name: "Mesa M1", qty: 10, price: 2200 }],
  }),
]);

const invoices = ref([
  buildInvoice({
    id: "i1",
    code: "FAC-00029",
    status: "PENDING",
    orderId: "o1",
    paymentMethod: "Transferencia",
    clientName: "AutoParts SRL",
    clientPhone: "809-555-8899",
    clientAddress: "Zona Industrial",
    items: [{ rowId: uid("li"), name: "Mesa Pro", qty: 6, price: 3800 }],
  }),
]);

/** -------------------- Tables -------------------- */
const quoteColumns = [
  { name: "code", label: "Código", field: "code", align: "left", sortable: true },
  { name: "clientName", label: "Cliente", field: "clientName", align: "left", sortable: true },
  { name: "date", label: "Fecha", field: "date", align: "left", sortable: true },
  { name: "status", label: "Estatus", field: "status", align: "left", sortable: false },
  { name: "total", label: "Total", field: "totals", align: "left", sortable: false },
  { name: "actions", label: "", field: "actions", align: "right", sortable: false },
];

const orderColumns = [
  { name: "code", label: "OT", field: "code", align: "left", sortable: true },
  { name: "clientName", label: "Cliente", field: "clientName", align: "left", sortable: true },
  { name: "date", label: "Fecha", field: "date", align: "left", sortable: true },
  { name: "status", label: "Estatus", field: "status", align: "left", sortable: false },
  { name: "total", label: "Total", field: "totals", align: "left", sortable: false },
  { name: "actions", label: "", field: "actions", align: "right", sortable: false },
];

const invoiceColumns = [
  { name: "code", label: "Factura", field: "code", align: "left", sortable: true },
  { name: "clientName", label: "Cliente", field: "clientName", align: "left", sortable: true },
  { name: "date", label: "Fecha", field: "date", align: "left", sortable: true },
  { name: "status", label: "Estatus", field: "status", align: "left", sortable: false },
  { name: "total", label: "Total", field: "totals", align: "left", sortable: false },
  { name: "actions", label: "", field: "actions", align: "right", sortable: false },
];

const itemColumns = [
  { name: "name", label: "Item", field: "name", align: "left" },
  { name: "qty", label: "Cant.", field: "qty", align: "left" },
  { name: "price", label: "Precio", field: "price", align: "left" },
  { name: "sub", label: "Subtotal", field: "sub", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" },
];

const orderItemColumns = [
  { name: "name", label: "Item", field: "name", align: "left" },
  { name: "qty", label: "Cant.", field: "qty", align: "left" },
  { name: "price", label: "Precio", field: "price", align: "left" },
  { name: "sub", label: "Subtotal", field: "sub", align: "left" },
];

/** -------------------- Filters computed -------------------- */
const filteredQuotes = computed(() => {
  const q = filters.search.trim().toLowerCase();
  return quotes.value.filter((x) => {
    if (filters.quoteStatus !== "ALL" && x.status !== filters.quoteStatus) return false;
    if (!q) return true;
    return (
      x.code.toLowerCase().includes(q) ||
      x.clientName.toLowerCase().includes(q) ||
      x.clientAddress.toLowerCase().includes(q)
    );
  });
});

const filteredOrders = computed(() => {
  const q = filters.search.trim().toLowerCase();
  return orders.value.filter((x) => {
    if (filters.orderStatus !== "ALL" && x.status !== filters.orderStatus) return false;
    if (!q) return true;
    return (
      x.code.toLowerCase().includes(q) ||
      x.clientName.toLowerCase().includes(q) ||
      x.clientAddress.toLowerCase().includes(q)
    );
  });
});

const filteredInvoices = computed(() => {
  const q = filters.search.trim().toLowerCase();
  return invoices.value.filter((x) => {
    if (filters.invoiceStatus !== "ALL" && x.status !== filters.invoiceStatus) return false;
    if (!q) return true;
    return (
      x.code.toLowerCase().includes(q) ||
      x.clientName.toLowerCase().includes(q) ||
      x.clientAddress.toLowerCase().includes(q)
    );
  });
});

/** -------------------- KPIs -------------------- */
const kpiQuotes = computed(() => {
  const total = quotes.value.length;
  const draft = quotes.value.filter((q) => q.status === "DRAFT").length;
  const approved = quotes.value.filter((q) => q.status === "APPROVED").length;
  const converted = quotes.value.filter((q) => q.convertedToOrder).length;
  return { total, draft, approved, converted };
});

const kpiOrders = computed(() => {
  const total = orders.value.length;
  const pending = orders.value.filter((o) => o.status === "PENDING").length;
  const inProduction = orders.value.filter((o) => o.status === "IN_PRODUCTION").length;
  const readyToDeliver = orders.value.filter((o) => o.status === "READY_TO_DELIVER").length;
  return { total, pending, inProduction, readyToDeliver };
});

const kpiInvoices = computed(() => {
  const total = invoices.value.length;
  const pending = invoices.value.filter((i) => i.status === "PENDING").length;
  const paid = invoices.value.filter((i) => i.status === "PAID").length;
  const v = invoices.value.filter((i) => i.status === "VOID").length;
  return { total, pending, paid, void: v };
});

/** -------------------- Dialogs -------------------- */
const quoteDlg = reactive({
  open: false,
  mode: "create",
  editingId: "",
  form: emptyQuote(),
});

const orderDlg = reactive({
  open: false,
  mode: "view",
  editingId: "",
  form: emptyOrder(),
});

const invoiceDlg = reactive({
  open: false,
  mode: "view",
  editingId: "",
  form: emptyInvoice(),
});

const quoteReadOnly = computed(() => quoteDlg.mode === "view");
const orderReadOnly = computed(() => orderDlg.mode === "view");
const invoiceReadOnly = computed(() => invoiceDlg.mode === "view");

const quoteDlgStatusOptions = quoteStatusOptions.filter((x) => x.value !== "ALL");
const orderDlgStatusOptions = orderStatusOptions.filter((x) => x.value !== "ALL");
const invoiceDlgStatusOptions = invoiceStatusOptions.filter((x) => x.value !== "ALL");

/** Totals for dialogs */
const quoteTotals = computed(() => computeTotals(quoteDlg.form.items));
const orderTotals = computed(() => computeTotals(orderDlg.form.items));
const invoiceTotals = computed(() => computeTotals(invoiceDlg.form.items));

/** -------------------- Actions: Quotes -------------------- */
function openCreateQuote() {
  tab.value = "quotes";
  quoteDlg.open = true;
  quoteDlg.mode = "create";
  quoteDlg.editingId = "";
  quoteDlg.form = emptyQuote();
  quoteDlg.form.id = uid("q");
  quoteDlg.form.code = nextCode(quotes.value.map((x) => x.code), "COT-", 5);
  quoteDlg.form.date = todayYMD();
  quoteDlg.form.status = "DRAFT";
  quoteDlg.form.items = [newLineItem()];
  quoteDlg.form.convertedToOrder = false;
  quoteDlg.form.totals = computeTotals(quoteDlg.form.items);
}

function openEditQuote(q) {
  tab.value = "quotes";
  quoteDlg.open = true;
  quoteDlg.mode = "edit";
  quoteDlg.editingId = q.id;
  quoteDlg.form = deepClone(q);
}

function openViewQuote(q) {
  tab.value = "quotes";
  quoteDlg.open = true;
  quoteDlg.mode = "view";
  quoteDlg.editingId = q.id;
  quoteDlg.form = deepClone(q);
}

function addQuoteItem() {
  quoteDlg.form.items.push(newLineItem());
}

function removeQuoteItem(rowId) {
  quoteDlg.form.items = quoteDlg.form.items.filter((x) => x.rowId !== rowId);
}

function saveQuote() {
  if (!quoteDlg.form.clientName.trim()) return notifyErr("Cliente requerido");
  if (!quoteDlg.form.items.length) return notifyErr("Agrega al menos un item");

  quoteDlg.form.items = quoteDlg.form.items
    .filter((x) => x.name.trim() && (Number(x.qty) || 0) > 0)
    .map((x) => ({
      ...x,
      qty: Math.max(1, Math.floor(Number(x.qty) || 1)),
      price: Math.max(0, Number(x.price) || 0),
    }));

  if (!quoteDlg.form.items.length) return notifyErr("Agrega items válidos");

  quoteDlg.form.totals = computeTotals(quoteDlg.form.items);

  if (quoteDlg.mode === "create") {
    quotes.value = [deepClone(quoteDlg.form), ...quotes.value];
  } else {
    quotes.value = quotes.value.map((x) => (x.id === quoteDlg.editingId ? deepClone(quoteDlg.form) : x));
  }

  $q.notify({ message: "Cotización guardada (simulado).", color: "positive", position: "top" });
  quoteDlg.open = false;
}

function deleteQuote(id) {
  $q.dialog({
    title: "Eliminar cotización",
    message: "Se eliminará del arreglo local (hardcode).",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    quotes.value = quotes.value.filter((x) => x.id !== id);
    $q.notify({ message: "Cotización eliminada.", color: "negative", position: "top" });
  });
}

function convertQuoteToOrder(quoteId) {
  const q = quotes.value.find((x) => x.id === quoteId);
  if (!q) return;

  if (q.convertedToOrder) {
    $q.notify({ message: "Esta cotización ya fue convertida a una Orden.", color: "orange", position: "top" });
    tab.value = "orders";
    return;
  }

  const newOrder = buildOrder({
    id: uid("o"),
    code: nextCode(orders.value.map((x) => x.code), "OT-", 5),
    status: "PENDING",
    priority: "Media",
    quoteId: q.id,
    clientName: q.clientName,
    clientPhone: q.clientPhone,
    clientAddress: q.clientAddress,
    items: deepClone(q.items),
  });

  // marcar cotización
  q.convertedToOrder = true;
  q.status = q.status === "DRAFT" ? "SENT" : q.status; // pequeño cambio "simulado"
  q.totals = computeTotals(q.items);

  orders.value = [newOrder, ...orders.value];

  $q.notify({ message: "Cotización convertida a Orden (simulado).", color: "primary", position: "top" });
  quoteDlg.open = false;
  tab.value = "orders";
}

/** -------------------- Actions: Orders -------------------- */
function openViewOrder(o) {
  tab.value = "orders";
  orderDlg.open = true;
  orderDlg.mode = "view";
  orderDlg.editingId = o.id;
  orderDlg.form = deepClone(o);
}

function openEditOrder(o) {
  tab.value = "orders";
  orderDlg.open = true;
  orderDlg.mode = "edit";
  orderDlg.editingId = o.id;
  orderDlg.form = deepClone(o);
}

function saveOrder() {
  if (!orderDlg.form.clientName.trim()) return notifyErr("Cliente requerido");
  if (!orderDlg.form.items.length) return notifyErr("Items requeridos");

  orderDlg.form.items = orderDlg.form.items
    .filter((x) => x.name.trim() && (Number(x.qty) || 0) > 0)
    .map((x) => ({
      ...x,
      qty: Math.max(1, Math.floor(Number(x.qty) || 1)),
      price: Math.max(0, Number(x.price) || 0),
    }));

  orderDlg.form.totals = computeTotals(orderDlg.form.items);

  orders.value = orders.value.map((x) => (x.id === orderDlg.editingId ? deepClone(orderDlg.form) : x));
  $q.notify({ message: "Orden guardada (simulado).", color: "positive", position: "top" });
  orderDlg.open = false;
}

function deleteOrder(id) {
  $q.dialog({
    title: "Eliminar orden",
    message: "Se eliminará del arreglo local (hardcode).",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    orders.value = orders.value.filter((x) => x.id !== id);
    $q.notify({ message: "Orden eliminada.", color: "negative", position: "top" });
  });
}

function setOrderStatus(orderId, status) {
  const o = orders.value.find((x) => x.id === orderId);
  if (!o) return;

  o.status = status;
  o.history.unshift({
    id: uid("h"),
    title: `Estatus: ${orderStatusLabel(status)}`,
    when: `${todayYMD()} · ${nowTime()}`,
    note: "Cambio de estatus (simulado).",
  });

  $q.notify({ message: "Estatus actualizado.", color: "primary", position: "top" });

  // si el modal está abierto, actualiza también el form
  if (orderDlg.open && orderDlg.form.id === orderId) {
    orderDlg.form = deepClone(o);
  }
}

function convertOrderToInvoice(orderId) {
  const o = orders.value.find((x) => x.id === orderId);
  if (!o) return;

  const exists = invoices.value.find((x) => x.orderId === orderId);
  if (exists) {
    $q.notify({ message: "Esta orden ya tiene una factura.", color: "orange", position: "top" });
    tab.value = "invoices";
    return;
  }

  const inv = buildInvoice({
    id: uid("i"),
    code: nextCode(invoices.value.map((x) => x.code), "FAC-", 5),
    status: "PENDING",
    orderId: o.id,
    paymentMethod: "Efectivo",
    clientName: o.clientName,
    clientPhone: o.clientPhone,
    clientAddress: o.clientAddress,
    items: deepClone(o.items),
  });

  invoices.value = [inv, ...invoices.value];

  $q.notify({ message: "Orden convertida a Factura (simulado).", color: "primary", position: "top" });

  orderDlg.open = false;
  tab.value = "invoices";
}

/** -------------------- Actions: Invoices -------------------- */
function openViewInvoice(i) {
  tab.value = "invoices";
  invoiceDlg.open = true;
  invoiceDlg.mode = "view";
  invoiceDlg.editingId = i.id;
  invoiceDlg.form = deepClone(i);
}

function openEditInvoice(i) {
  tab.value = "invoices";
  invoiceDlg.open = true;
  invoiceDlg.mode = "edit";
  invoiceDlg.editingId = i.id;
  invoiceDlg.form = deepClone(i);
}

function saveInvoice() {
  if (!invoiceDlg.form.clientName.trim()) return notifyErr("Cliente requerido");
  invoiceDlg.form.items = invoiceDlg.form.items
    .filter((x) => x.name.trim() && (Number(x.qty) || 0) > 0)
    .map((x) => ({
      ...x,
      qty: Math.max(1, Math.floor(Number(x.qty) || 1)),
      price: Math.max(0, Number(x.price) || 0),
    }));

  invoiceDlg.form.totals = computeTotals(invoiceDlg.form.items);

  invoices.value = invoices.value.map((x) => (x.id === invoiceDlg.editingId ? deepClone(invoiceDlg.form) : x));
  $q.notify({ message: "Factura guardada (simulado).", color: "positive", position: "top" });
  invoiceDlg.open = false;
}

function setInvoiceStatus(invoiceId, status) {
  const i = invoices.value.find((x) => x.id === invoiceId);
  if (!i) return;

  i.status = status;
  $q.notify({ message: "Estatus de factura actualizado.", color: "primary", position: "top" });

  if (invoiceDlg.open && invoiceDlg.form.id === invoiceId) {
    invoiceDlg.form = deepClone(i);
  }
}

function deleteInvoice(id) {
  $q.dialog({
    title: "Eliminar factura",
    message: "Se eliminará del arreglo local (hardcode).",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    invoices.value = invoices.value.filter((x) => x.id !== id);
    $q.notify({ message: "Factura eliminada.", color: "negative", position: "top" });
  });
}

/** -------------------- Helpers -------------------- */
function itemSubtotal(i) {
  return round2((Number(i.qty) || 0) * (Number(i.price) || 0));
}

function computeTotals(items) {
  const subtotal = round2(items.reduce((sum, it) => sum + itemSubtotal(it), 0));
  const tax = round2(subtotal * (taxPct / 100));
  const total = round2(subtotal + tax);
  return { subtotal, tax, total };
}

function newLineItem() {
  return { rowId: uid("li"), name: "", qty: 1, price: 0 };
}

function emptyQuote() {
  return {
    id: "",
    code: "",
    date: "",
    status: "DRAFT",
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    items: [],
    totals: { subtotal: 0, tax: 0, total: 0 },
    convertedToOrder: false,
  };
}

function emptyOrder() {
  return {
    id: "",
    code: "",
    date: "",
    status: "PENDING",
    priority: "Media",
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    items: [],
    totals: { subtotal: 0, tax: 0, total: 0 },
    suggestedMaterials: [],
    history: [],
  };
}

function emptyInvoice() {
  return {
    id: "",
    code: "",
    date: "",
    status: "PENDING",
    orderId: "",
    paymentMethod: "Efectivo",
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    items: [],
    totals: { subtotal: 0, tax: 0, total: 0 },
  };
}

function buildQuote(input) {
  const q = {
    ...emptyQuote(),
    ...input,
    date: input.date || todayYMD(),
  };

  q.totals = computeTotals(q.items);
  return q;
}

function buildOrder(input) {
  const o = {
    ...emptyOrder(),
    ...input,
    date: input.date || todayYMD(),
  };

  o.totals = computeTotals(o.items);

  // materiales sugeridos mock
  o.suggestedMaterials = [
    { name: "Resina epóxica", qty: 6, unit: "kg", stock: 12 },
    { name: "Tornillos 2cm", qty: 2, unit: "caja", stock: 6 },
    { name: "Lija fina", qty: 10, unit: "unidad", stock: 30 },
  ];

  o.history = [
    { id: uid("h"), title: "Orden creada", when: `${todayYMD()} · ${nowTime()}`, note: "Creada desde el sistema (simulado)." },
  ];

  return o;
}

function buildInvoice(input) {
  const i = {
    ...emptyInvoice(),
    ...input,
    date: input.date || todayYMD(),
  };
  i.totals = computeTotals(i.items);
  return i;
}

function orderCodeById(orderId) {
  return orders.value.find((x) => x.id === orderId)?.code || "";
}

/** Labels/colors */
function quoteStatusLabel(s) {
  switch (s) {
    case "DRAFT": return "BORRADOR";
    case "SENT": return "ENVIADA";
    case "APPROVED": return "APROBADA";
    case "REJECTED": return "RECHAZADA";
  }
}
function quoteStatusColor(s) {
  switch (s) {
    case "DRAFT": return "grey";
    case "SENT": return "blue";
    case "APPROVED": return "green";
    case "REJECTED": return "negative";
  }
}

function orderStatusLabel(s) {
  switch (s) {
    case "PENDING": return "PENDIENTE";
    case "IN_PRODUCTION": return "EN PRODUCCIÓN";
    case "READY": return "LISTA";
    case "READY_TO_DELIVER": return "PARA ENTREGA";
    case "DELIVERED": return "ENTREGADA";
    case "CANCELED": return "CANCELADA";
  }
}
function orderStatusColor(s) {
  switch (s) {
    case "PENDING": return "grey";
    case "IN_PRODUCTION": return "purple";
    case "READY": return "teal";
    case "READY_TO_DELIVER": return "blue";
    case "DELIVERED": return "green";
    case "CANCELED": return "negative";
  }
}

function invoiceStatusLabel(s) {
  switch (s) {
    case "PENDING": return "PENDIENTE";
    case "PAID": return "PAGADA";
    case "VOID": return "ANULADA";
  }
}
function invoiceStatusColor(s) {
  switch (s) {
    case "PENDING": return "orange";
    case "PAID": return "green";
    case "VOID": return "negative";
  }
}

function notifyErr(msg) {
  $q.notify({ message: msg, color: "negative", position: "top" });
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
function nowTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * nextCode(["COT-00001"], "COT-", 5) => COT-00002
 */
function nextCode(existing, prefix, pad) {
  let max = 0;
  for (const code of existing) {
    if (!code.startsWith(prefix)) continue;
    const raw = code.slice(prefix.length);
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return `${prefix}${String(max + 1).padStart(pad, "0")}`;
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
