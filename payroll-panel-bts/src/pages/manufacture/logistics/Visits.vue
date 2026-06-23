<template>
  <q-page class="q-pa-md logistics-visits-page">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Logística · Visitas</div>
        <div class="text-grey-7">
          Registro y control de visitantes, contratistas y accesos temporales.
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-btn
            unelevated
            color="primary"
            icon="person_add"
            label="Nueva visita"
            @click="openCreateModal"
          />
          <q-btn
            outline
            color="primary"
            icon="refresh"
            label="Refrescar"
            @click="fakeRefresh"
          />
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- KPI -->
    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="kpi in visitKpis"
        :key="kpi.key"
        class="col-12 col-sm-6 col-lg-3"
      >
        <q-card bordered class="bg-white rounded-borders kpi-card">
          <q-card-section class="row items-center q-gutter-md">
            <q-avatar
              :icon="kpi.icon"
              color="primary"
              text-color="white"
              size="48px"
            />
            <div class="col">
              <div class="text-caption text-grey-7">{{ kpi.label }}</div>
              <div class="text-h6 text-weight-bold">{{ kpi.value }}</div>
              <div class="text-caption" :class="kpi.class">
                {{ kpi.helper }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- MAIN GRID -->
    <div class="row q-col-gutter-md">
      <!-- LEFT PANEL -->
      <div class="col-12 col-lg-4">
        <q-card bordered class="bg-white rounded-borders q-mb-md">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Panel de visitas</div>
              <div class="text-caption text-grey-7">
                Abre el formulario en modal para registrar nuevos accesos.
              </div>
            </div>

            <q-btn
              unelevated
              color="primary"
              icon="person_add"
              label="Nueva visita"
              @click="openCreateModal"
            />
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="visit-summary-card">
              <div class="row items-center q-col-gutter-md">
                <div class="col-auto">
                  <q-avatar
                    size="72px"
                    color="grey-3"
                    text-color="primary"
                    icon="badge"
                  />
                </div>

                <div class="col">
                  <div class="text-subtitle1 text-weight-bold">
                    {{ selectedVisitPreview?.fullName || "Sin visita seleccionada" }}
                  </div>
                  <div class="text-grey-7">
                    {{ selectedVisitPreview?.company || "Selecciona una visita activa o del historial" }}
                  </div>

                  <div class="row q-col-gutter-md q-mt-sm">
                    <div class="col-6">
                      <div class="summary-label">TIPO</div>
                      <div class="summary-value small">
                        {{ selectedVisitPreview?.visitType || "—" }}
                      </div>
                    </div>

                    <div class="col-6">
                      <div class="summary-label">ESTATUS</div>
                      <div class="summary-value small">
                        {{ selectedVisitPreview?.visitStatus || "—" }}
                      </div>
                    </div>

                    <div class="col-6">
                      <div class="summary-label">ÁREA</div>
                      <div class="summary-value small">
                        {{ selectedVisitPreview?.areaToVisit || "—" }}
                      </div>
                    </div>

                    <div class="col-6">
                      <div class="summary-label">HOST</div>
                      <div class="summary-value small">
                        {{ selectedVisitPreview?.hostName || "—" }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-12">
                <q-card flat bordered class="rounded-borders quick-card">
                  <q-card-section>
                    <div class="text-subtitle2 text-weight-bold">
                      Acciones rápidas
                    </div>
                    <div class="text-caption text-grey-7 q-mb-md">
                      Crea una nueva visita o abre un registro existente.
                    </div>

                    <div class="column q-gutter-sm">
                      <q-btn
                        unelevated
                        color="primary"
                        icon="add"
                        label="Nueva visita"
                        @click="openCreateModal"
                      />

                      <q-btn
                        outline
                        color="primary"
                        icon="edit"
                        label="Abrir visita seleccionada"
                        :disable="!selectedVisitPreview"
                        @click="openSelectedVisitModal"
                      />

                      <q-btn
                        outline
                        color="grey-8"
                        icon="visibility"
                        label="Ver detalle"
                        :disable="!selectedVisitPreview"
                        @click="openDetail(selectedVisitPreview)"
                      />

                      <q-btn
                        flat
                        color="grey-8"
                        icon="clear"
                        label="Limpiar selección"
                        :disable="!selectedVisitPreview"
                        @click="clearSelectedVisit"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card bordered class="bg-white rounded-borders">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">Resumen rápido</div>
            <div class="text-caption text-grey-7">
              Estado general de visitas del día.
            </div>

            <div class="q-mt-md q-gutter-sm">
              <q-badge color="primary" outline>
                {{ activeVisits.length }} activas
              </q-badge>
              <q-badge color="warning" outline>
                {{ pendingVisitsCount }} pendientes
              </q-badge>
              <q-badge color="positive" outline>
                {{ finishedVisitsCount }} finalizadas
              </q-badge>
              <q-badge color="negative" outline>
                {{ rejectedVisitsCount }} rechazadas
              </q-badge>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- RIGHT PANEL -->
      <div class="col-12 col-lg-8">
        <!-- ACTIVE VISITS -->
        <q-card bordered class="bg-white rounded-borders q-mb-md">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Visitas activas</div>
              <div class="text-caption text-grey-7">
                Visitantes actualmente dentro de la facilidad.
              </div>
            </div>

            <q-badge outline color="primary">
              {{ activeVisits.length }} activas
            </q-badge>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div
                v-for="visit in activeVisits"
                :key="visit.id"
                class="col-12 col-md-6"
              >
                <q-card
                  flat
                  bordered
                  class="rounded-borders active-card cursor-pointer"
                  :class="{
                    'active-card--selected':
                      selectedVisitPreview?.id === visit.id,
                  }"
                  @click="selectVisitPreview(visit)"
                >
                  <q-card-section>
                    <div class="row items-start justify-between">
                      <div>
                        <div class="text-weight-bold">{{ visit.fullName }}</div>
                        <div class="text-caption text-grey-7">{{ visit.company }}</div>
                      </div>

                      <q-badge :color="statusColor(visit.visitStatus)">
                        {{ visit.visitStatus }}
                      </q-badge>
                    </div>

                    <div class="q-mt-sm text-caption text-grey-7">
                      <div><strong>Tipo:</strong> {{ visit.visitType }}</div>
                      <div><strong>Área:</strong> {{ visit.areaToVisit }}</div>
                      <div><strong>Host:</strong> {{ visit.hostName }}</div>
                      <div><strong>Entrada:</strong> {{ visit.entryTimeLabel }}</div>
                    </div>

                    <div class="row justify-end q-gutter-sm q-mt-md">
                      <q-btn
                        flat
                        dense
                        color="primary"
                        icon="visibility"
                        label="Ver"
                        @click.stop="openDetail(visit)"
                      />
                      <q-btn
                        flat
                        dense
                        color="primary"
                        icon="edit"
                        label="Abrir"
                        @click.stop="openEditVisit(visit)"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div v-if="!activeVisits.length" class="col-12">
                <div class="q-pa-md text-grey-7 text-caption">
                  No hay visitas activas en este momento.
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- FILTERS -->
        <q-card bordered class="bg-white rounded-borders q-mb-md">
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <div>
                <div class="text-subtitle1 text-weight-bold">Filtros de visitas</div>
                <div class="text-caption text-grey-7">
                  Consulta rápida del historial hardcode.
                </div>
              </div>

              <q-btn
                flat
                color="primary"
                icon="filter_alt_off"
                label="Limpiar filtros"
                @click="clearFilters"
              />
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  dense
                  debounce="250"
                  v-model="filters.search"
                  label="Buscar"
                  placeholder="Nombre, empresa, host..."
                >
                  <template #prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6 col-md-2">
                <q-select
                  outlined
                  dense
                  v-model="filters.visitType"
                  :options="filterVisitTypeOptions"
                  label="Tipo"
                />
              </div>

              <div class="col-12 col-sm-6 col-md-2">
                <q-select
                  outlined
                  dense
                  v-model="filters.status"
                  :options="filterStatusOptions"
                  label="Estatus"
                />
              </div>

              <div class="col-12 col-sm-6 col-md-2">
                <q-select
                  outlined
                  dense
                  v-model="filters.area"
                  :options="filterAreaOptions"
                  label="Área"
                />
              </div>

              <div class="col-12 col-sm-6 col-md-2">
                <q-input
                  outlined
                  dense
                  v-model="filters.date"
                  type="date"
                  label="Fecha"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- TABLE -->
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Historial de visitas</div>
              <div class="text-caption text-grey-7">
                {{ filteredVisits.length }} resultados encontrados.
              </div>
            </div>

            <div class="row q-gutter-sm">
              <q-btn
                outline
                color="primary"
                icon="print"
                label="Imprimir"
                @click="fakePrint"
              />
              <q-btn
                unelevated
                color="primary"
                icon="download"
                label="Exportar"
                @click="fakeExport"
              />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none">
            <q-table
              flat
              :rows="filteredVisits"
              :columns="columns"
              row-key="id"
              :rows-per-page-options="[5, 10, 20]"
              :pagination="{ rowsPerPage: 10 }"
              class="visits-table"
            >
              <template #body-cell-fullName="props">
                <q-td :props="props">
                  <div
                    class="text-weight-medium cursor-pointer"
                    @click="selectVisitPreview(props.row)"
                  >
                    {{ props.row.fullName }}
                  </div>
                  <div class="text-caption text-grey-7">{{ props.row.company }}</div>
                </q-td>
              </template>

              <template #body-cell-visitType="props">
                <q-td :props="props">
                  <q-badge :color="typeColor(props.row.visitType)">
                    {{ props.row.visitType }}
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-areaToVisit="props">
                <q-td :props="props">
                  <div class="text-weight-medium">{{ props.row.areaToVisit }}</div>
                  <div class="text-caption text-grey-7">{{ props.row.hostName }}</div>
                </q-td>
              </template>

              <template #body-cell-entryTimeLabel="props">
                <q-td :props="props">
                  <div class="text-weight-medium">{{ props.row.entryTimeLabel }}</div>
                  <div class="text-caption text-grey-7">
                    Salida: {{ props.row.exitTimeLabel || "Pendiente" }}
                  </div>
                </q-td>
              </template>

              <template #body-cell-visitStatus="props">
                <q-td :props="props">
                  <q-badge :color="statusColor(props.row.visitStatus)">
                    {{ props.row.visitStatus }}
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    dense
                    flat
                    round
                    color="primary"
                    icon="visibility"
                    @click="openDetail(props.row)"
                  >
                    <q-tooltip>Ver detalle</q-tooltip>
                  </q-btn>

                  <q-btn
                    dense
                    flat
                    round
                    color="primary"
                    icon="edit"
                    @click="openEditVisit(props.row)"
                  >
                    <q-tooltip>Abrir registro</q-tooltip>
                  </q-btn>
                </q-td>
              </template>

              <template #no-data>
                <div class="q-pa-md text-grey-7">
                  No hay visitas para mostrar.
                </div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- FORM MODAL -->
    <q-dialog
      v-model="showFormModal"
      :maximized="$q.screen.lt.md"
      persistent
    >
      <q-card class="visit-form-modal-card">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold">
              {{ modalMode === "create" ? "Registrar visita" : "Editar / revisar visita" }}
            </div>
            <div class="text-caption text-grey-7">
              Formulario hardcode para control de acceso.
            </div>
          </div>

          <q-btn flat round dense icon="close" @click="closeFormModal" />
        </q-card-section>

        <q-separator />

        <q-card-section class="visit-form-modal-body">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div class="section-label">Tipo de visita</div>
              <q-btn-toggle
                v-model="form.visitType"
                spread
                no-caps
                unelevated
                toggle-color="primary"
                class="q-mt-xs"
                :options="visitTypeOptions"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                v-model="form.fullName"
                label="Nombre completo"
                placeholder="Ej: José Martínez"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                v-model="form.idNumber"
                label="Cédula / ID"
                placeholder="Ej: 402-1234567-8"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                v-model="form.phone"
                label="Teléfono"
                placeholder="Ej: 809-555-0103"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                v-model="form.company"
                label="Empresa"
                placeholder="Ej: Atlantic Cargo"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                outlined
                v-model="form.areaToVisit"
                :options="areaOptions"
                label="Área a visitar"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                v-model="form.hostName"
                label="Persona que visita"
                placeholder="Ej: Miguel Ángel Soto"
              />
            </div>

            <div class="col-12">
              <q-input
                outlined
                type="textarea"
                autogrow
                v-model="form.reason"
                label="Motivo de la visita"
                placeholder="Ej: Mantenimiento del equipo de carga en muelle 2"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                outlined
                v-model="form.accessLevel"
                :options="accessLevelOptions"
                label="Nivel de acceso"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                outlined
                v-model="form.visitStatus"
                :options="visitStatusOptions"
                label="Estatus"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                type="datetime-local"
                v-model="form.entryDateTime"
                label="Fecha / hora entrada"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                outlined
                type="datetime-local"
                v-model="form.exitDateTime"
                label="Fecha / hora salida"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                outlined
                v-model="form.temporaryPass"
                :options="yesNoOptions"
                label="Pase temporal entregado"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                outlined
                v-model="form.idRetained"
                :options="yesNoOptions"
                label="ID retenido en garita"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                outlined
                v-model="form.hasVehicle"
                :options="yesNoOptions"
                label="¿Vino en vehículo?"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                outlined
                v-model="form.authorized"
                :options="yesNoOptions"
                label="¿Autorizado?"
              />
            </div>

            <template v-if="form.hasVehicle === 'Sí'">
              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  v-model="form.vehicleType"
                  label="Tipo de vehículo"
                  placeholder="Ej: Camioneta"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  v-model="form.plate"
                  label="Placa"
                  placeholder="Ej: G-123456"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  v-model="form.vehicleColor"
                  label="Color"
                  placeholder="Ej: Blanco"
                />
              </div>
            </template>

            <div class="col-12">
              <q-input
                outlined
                type="textarea"
                autogrow
                v-model="form.notes"
                label="Notas del guardia"
                placeholder="Observaciones, validaciones o incidencias"
              />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions class="q-pa-md justify-between">
          <q-btn
            flat
            color="grey-8"
            icon="restart_alt"
            label="Limpiar"
            @click="resetForm"
          />

          <div class="row q-gutter-sm">
            <q-btn
              flat
              color="grey-8"
              icon="close"
              label="Cerrar"
              @click="closeFormModal"
            />
            <q-btn
              outline
              color="primary"
              icon="save"
              label="Guardar borrador"
              @click="saveDraft"
            />
            <q-btn
              unelevated
              color="positive"
              icon="check_circle"
              label="Registrar visita"
              @click="submitVisit"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DETAIL MODAL -->
    <q-dialog v-model="detailDialog">
      <q-card style="width: 100%; max-width: 900px; border-radius: 18px;">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold">Detalle de visita</div>
            <div class="text-caption text-grey-7">
              Información general del visitante y validaciones de acceso.
            </div>
          </div>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedVisit">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
              <q-card flat bordered class="rounded-borders">
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <div class="detail-label">Nombre</div>
                      <div class="detail-value">{{ selectedVisit.fullName }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Tipo de visita</div>
                      <div class="detail-value">
                        <q-badge :color="typeColor(selectedVisit.visitType)">
                          {{ selectedVisit.visitType }}
                        </q-badge>
                      </div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Empresa</div>
                      <div class="detail-value">{{ selectedVisit.company }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Teléfono</div>
                      <div class="detail-value">{{ selectedVisit.phone }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">ID</div>
                      <div class="detail-value">{{ selectedVisit.idNumber }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Área</div>
                      <div class="detail-value">{{ selectedVisit.areaToVisit }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Host</div>
                      <div class="detail-value">{{ selectedVisit.hostName }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Nivel de acceso</div>
                      <div class="detail-value">{{ selectedVisit.accessLevel }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Entrada</div>
                      <div class="detail-value">{{ selectedVisit.entryTimeLabel }}</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="detail-label">Salida</div>
                      <div class="detail-value">
                        {{ selectedVisit.exitTimeLabel || "Pendiente" }}
                      </div>
                    </div>

                    <div class="col-12">
                      <div class="detail-label">Motivo</div>
                      <div class="detail-value">{{ selectedVisit.reason }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-4">
              <q-card flat bordered class="rounded-borders">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-bold">Validaciones</div>

                  <div class="q-mt-md q-gutter-sm">
                    <q-badge :color="selectedVisit.authorized === 'Sí' ? 'positive' : 'negative'">
                      {{ selectedVisit.authorized === "Sí" ? "Autorizado" : "No autorizado" }}
                    </q-badge>

                    <q-badge :color="selectedVisit.temporaryPass === 'Sí' ? 'primary' : 'grey-7'">
                      {{ selectedVisit.temporaryPass === "Sí" ? "Pase temporal" : "Sin pase" }}
                    </q-badge>

                    <q-badge :color="selectedVisit.idRetained === 'Sí' ? 'orange' : 'grey-7'">
                      {{ selectedVisit.idRetained === "Sí" ? "ID retenido" : "ID no retenido" }}
                    </q-badge>

                    <q-badge :color="selectedVisit.hasVehicle === 'Sí' ? 'teal' : 'grey-7'">
                      {{ selectedVisit.hasVehicle === "Sí" ? "Con vehículo" : "Sin vehículo" }}
                    </q-badge>
                  </div>

                  <q-separator class="q-my-md" />

                  <div class="text-subtitle2 text-weight-bold">Vehículo</div>
                  <div class="text-caption text-grey-7 q-mt-sm">
                    <div><strong>Tipo:</strong> {{ selectedVisit.vehicleType || "—" }}</div>
                    <div><strong>Placa:</strong> {{ selectedVisit.plate || "—" }}</div>
                    <div><strong>Color:</strong> {{ selectedVisit.vehicleColor || "—" }}</div>
                  </div>

                  <q-separator class="q-my-md" />

                  <div class="text-subtitle2 text-weight-bold">Notas</div>
                  <div class="text-caption text-grey-7 q-mt-sm">
                    {{ selectedVisit.notes || "Sin observaciones." }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat color="grey-8" label="Cerrar" v-close-popup />
          <q-btn
            unelevated
            color="primary"
            icon="print"
            label="Imprimir"
            @click="fakePrint"
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

const detailDialog = ref(false);
const selectedVisit = ref(null);
const selectedVisitPreview = ref(null);
const showFormModal = ref(false);
const modalMode = ref("create");

const visitTypeOptions = [
  { label: "Suplidor", value: "Suplidor" },
  { label: "Contratista", value: "Contratista" },
  { label: "Técnico", value: "Técnico" },
  { label: "Auditor", value: "Auditor" },
];

const areaOptions = [
  "Recepción",
  "Manufactura",
  "Muelle 1",
  "Muelle 2",
  "Almacén A",
  "Almacén B",
  "Oficina administrativa",
  "Seguridad industrial",
];

const accessLevelOptions = [
  "General",
  "Restringido",
  "Supervisado",
  "Técnico",
];

const visitStatusOptions = [
  "Pendiente",
  "Dentro",
  "Finalizada",
  "Rechazada",
];

const yesNoOptions = ["Sí", "No"];

const form = reactive(getDefaultForm());

const filters = reactive({
  search: "",
  visitType: "Todos",
  status: "Todos",
  area: "Todas",
  date: "",
});

const visits = ref([
  {
    id: "v1",
    fullName: "José Martínez",
    idNumber: "402-1234567-8",
    phone: "809-555-0103",
    company: "Atlantic Cargo",
    visitType: "Suplidor",
    areaToVisit: "Muelle 2",
    hostName: "Miguel Ángel Soto",
    reason: "Entrega de documentación y validación de mercancía.",
    accessLevel: "General",
    visitStatus: "Dentro",
    entryDateTime: "2026-03-17T08:10",
    exitDateTime: "",
    entryTimeLabel: "17/03/2026 08:10 AM",
    exitTimeLabel: "",
    temporaryPass: "Sí",
    idRetained: "Sí",
    hasVehicle: "Sí",
    vehicleType: "Camioneta",
    plate: "L-204991",
    vehicleColor: "Blanco",
    authorized: "Sí",
    notes: "Acceso autorizado sin incidencias.",
  },
  {
    id: "v2",
    fullName: "Rafael Peña",
    idNumber: "001-9988776-5",
    phone: "829-555-3312",
    company: "ServiTech Industrial",
    visitType: "Técnico",
    areaToVisit: "Manufactura",
    hostName: "Saúl González",
    reason: "Mantenimiento preventivo en línea de empaque.",
    accessLevel: "Técnico",
    visitStatus: "Dentro",
    entryDateTime: "2026-03-17T09:05",
    exitDateTime: "",
    entryTimeLabel: "17/03/2026 09:05 AM",
    exitTimeLabel: "",
    temporaryPass: "Sí",
    idRetained: "No",
    hasVehicle: "No",
    vehicleType: "",
    plate: "",
    vehicleColor: "",
    authorized: "Sí",
    notes: "Se indicó uso obligatorio de casco y chaleco.",
  },
  {
    id: "v3",
    fullName: "Diana López",
    idNumber: "402-5544332-1",
    phone: "849-555-1414",
    company: "Audit Partners",
    visitType: "Auditor",
    areaToVisit: "Oficina administrativa",
    hostName: "Carlos Ramírez",
    reason: "Revisión documental de procesos internos.",
    accessLevel: "Restringido",
    visitStatus: "Finalizada",
    entryDateTime: "2026-03-17T07:40",
    exitDateTime: "2026-03-17T11:25",
    entryTimeLabel: "17/03/2026 07:40 AM",
    exitTimeLabel: "17/03/2026 11:25 AM",
    temporaryPass: "Sí",
    idRetained: "Sí",
    hasVehicle: "Sí",
    vehicleType: "Sedán",
    plate: "A-778201",
    vehicleColor: "Gris",
    authorized: "Sí",
    notes: "Visita finalizada correctamente.",
  },
  {
    id: "v4",
    fullName: "Pedro Castillo",
    idNumber: "223-7766554-9",
    phone: "809-555-8890",
    company: "Construcciones PC",
    visitType: "Contratista",
    areaToVisit: "Almacén B",
    hostName: "María López",
    reason: "Evaluación para trabajo de reparación estructural.",
    accessLevel: "Supervisado",
    visitStatus: "Pendiente",
    entryDateTime: "2026-03-17T10:15",
    exitDateTime: "",
    entryTimeLabel: "17/03/2026 10:15 AM",
    exitTimeLabel: "",
    temporaryPass: "No",
    idRetained: "No",
    hasVehicle: "Sí",
    vehicleType: "Camioneta",
    plate: "G-887120",
    vehicleColor: "Negro",
    authorized: "No",
    notes: "Pendiente autorización del supervisor responsable.",
  },
  {
    id: "v5",
    fullName: "Laura Gómez",
    idNumber: "402-8765432-0",
    phone: "809-555-7777",
    company: "Distribuciones LG",
    visitType: "Suplidor",
    areaToVisit: "Recepción",
    hostName: "Miguel Ángel Soto",
    reason: "Entrega de muestras y reunión rápida.",
    accessLevel: "General",
    visitStatus: "Rechazada",
    entryDateTime: "2026-03-17T11:00",
    exitDateTime: "",
    entryTimeLabel: "17/03/2026 11:00 AM",
    exitTimeLabel: "",
    temporaryPass: "No",
    idRetained: "No",
    hasVehicle: "No",
    vehicleType: "",
    plate: "",
    vehicleColor: "",
    authorized: "No",
    notes: "No figuraba en lista de visitas autorizadas.",
  },
]);

const columns = [
  {
    name: "fullName",
    label: "Visitante",
    field: "fullName",
    align: "left",
    sortable: true,
  },
  {
    name: "visitType",
    label: "Tipo",
    field: "visitType",
    align: "left",
    sortable: true,
  },
  {
    name: "areaToVisit",
    label: "Área / Host",
    field: "areaToVisit",
    align: "left",
    sortable: true,
  },
  {
    name: "entryTimeLabel",
    label: "Entrada / Salida",
    field: "entryTimeLabel",
    align: "left",
    sortable: true,
  },
  {
    name: "visitStatus",
    label: "Estatus",
    field: "visitStatus",
    align: "left",
    sortable: true,
  },
  {
    name: "actions",
    label: "Acciones",
    field: "actions",
    align: "center",
  },
];

const activeVisits = computed(() => {
  return visits.value.filter((v) => v.visitStatus === "Dentro");
});

const filteredVisits = computed(() => {
  const q = filters.search.trim().toLowerCase();

  return visits.value.filter((v) => {
    const matchesSearch =
      !q ||
      v.fullName.toLowerCase().includes(q) ||
      v.company.toLowerCase().includes(q) ||
      v.hostName.toLowerCase().includes(q) ||
      v.idNumber.toLowerCase().includes(q) ||
      v.areaToVisit.toLowerCase().includes(q);

    const matchesType =
      filters.visitType === "Todos" || v.visitType === filters.visitType;

    const matchesStatus =
      filters.status === "Todos" || v.visitStatus === filters.status;

    const matchesArea =
      filters.area === "Todas" || v.areaToVisit === filters.area;

    const matchesDate =
      !filters.date || v.entryDateTime.startsWith(filters.date);

    return (
      matchesSearch &&
      matchesType &&
      matchesStatus &&
      matchesArea &&
      matchesDate
    );
  });
});

const pendingVisitsCount = computed(() => {
  return visits.value.filter((v) => v.visitStatus === "Pendiente").length;
});

const finishedVisitsCount = computed(() => {
  return visits.value.filter((v) => v.visitStatus === "Finalizada").length;
});

const rejectedVisitsCount = computed(() => {
  return visits.value.filter((v) => v.visitStatus === "Rechazada").length;
});

const visitKpis = computed(() => {
  const inside = visits.value.filter((v) => v.visitStatus === "Dentro").length;
  const pending = visits.value.filter((v) => v.visitStatus === "Pendiente").length;
  const finished = visits.value.filter((v) => v.visitStatus === "Finalizada").length;
  const rejected = visits.value.filter((v) => v.visitStatus === "Rechazada").length;

  return [
    {
      key: "inside",
      icon: "badge",
      label: "Dentro de la facilidad",
      value: inside,
      helper: "Visitas activas",
      class: "text-primary",
    },
    {
      key: "pending",
      icon: "pending_actions",
      label: "Pendientes",
      value: pending,
      helper: "Esperando autorización",
      class: "text-warning",
    },
    {
      key: "finished",
      icon: "logout",
      label: "Finalizadas",
      value: finished,
      helper: "Con salida registrada",
      class: "text-positive",
    },
    {
      key: "rejected",
      icon: "block",
      label: "Rechazadas",
      value: rejected,
      helper: "Acceso no autorizado",
      class: "text-negative",
    },
  ];
});

const filterVisitTypeOptions = [
  "Todos",
  "Suplidor",
  "Contratista",
  "Técnico",
  "Auditor",
];
const filterStatusOptions = [
  "Todos",
  "Pendiente",
  "Dentro",
  "Finalizada",
  "Rechazada",
];
const filterAreaOptions = ["Todas", ...areaOptions];

function getDefaultForm() {
  return {
    visitType: "Suplidor",
    fullName: "",
    idNumber: "",
    phone: "",
    company: "",
    areaToVisit: "Recepción",
    hostName: "",
    reason: "",
    accessLevel: "General",
    visitStatus: "Pendiente",
    entryDateTime: "2026-03-17T08:00",
    exitDateTime: "",
    temporaryPass: "No",
    idRetained: "No",
    hasVehicle: "No",
    vehicleType: "",
    plate: "",
    vehicleColor: "",
    authorized: "Sí",
    notes: "",
  };
}

function fillFormFromVisit(visit) {
  Object.assign(form, getDefaultForm(), {
    visitType: visit.visitType,
    fullName: visit.fullName,
    idNumber: visit.idNumber,
    phone: visit.phone,
    company: visit.company,
    areaToVisit: visit.areaToVisit,
    hostName: visit.hostName,
    reason: visit.reason,
    accessLevel: visit.accessLevel,
    visitStatus: visit.visitStatus,
    entryDateTime: visit.entryDateTime,
    exitDateTime: visit.exitDateTime,
    temporaryPass: visit.temporaryPass,
    idRetained: visit.idRetained,
    hasVehicle: visit.hasVehicle,
    vehicleType: visit.vehicleType,
    plate: visit.plate,
    vehicleColor: visit.vehicleColor,
    authorized: visit.authorized,
    notes: visit.notes,
  });
}

function typeColor(type) {
  switch (type) {
    case "Suplidor":
      return "primary";
    case "Contratista":
      return "orange";
    case "Técnico":
      return "teal";
    case "Auditor":
      return "purple";
    default:
      return "grey";
  }
}

function statusColor(status) {
  switch (status) {
    case "Pendiente":
      return "warning";
    case "Dentro":
      return "primary";
    case "Finalizada":
      return "positive";
    case "Rechazada":
      return "negative";
    default:
      return "grey";
  }
}

function openCreateModal() {
  modalMode.value = "create";
  Object.assign(form, getDefaultForm());
  showFormModal.value = true;
}

function openEditVisit(visit) {
  selectedVisitPreview.value = visit;
  modalMode.value = "edit";
  fillFormFromVisit(visit);
  showFormModal.value = true;
}

function openSelectedVisitModal() {
  if (!selectedVisitPreview.value) return;

  modalMode.value = "edit";
  fillFormFromVisit(selectedVisitPreview.value);
  showFormModal.value = true;
}

function closeFormModal() {
  showFormModal.value = false;
}

function selectVisitPreview(visit) {
  selectedVisitPreview.value = visit;
}

function clearSelectedVisit() {
  selectedVisitPreview.value = null;

  $q.notify({
    color: "grey-8",
    message: "Selección limpiada.",
    position: "top",
  });
}

function resetForm() {
  Object.assign(form, getDefaultForm());

  $q.notify({
    color: "primary",
    message: "Formulario de visita reiniciado.",
    position: "top",
  });
}

function saveDraft() {
  $q.notify({
    color: "warning",
    message: "Borrador de visita guardado (hardcode).",
    position: "top",
  });
}

function submitVisit() {
  $q.notify({
    color: "positive",
    message: "Visita registrada correctamente (hardcode).",
    position: "top",
  });

  showFormModal.value = false;
}

function openDetail(visit) {
  selectedVisit.value = visit;
  selectedVisitPreview.value = visit;
  detailDialog.value = true;
}

function clearFilters() {
  filters.search = "";
  filters.visitType = "Todos";
  filters.status = "Todos";
  filters.area = "Todas";
  filters.date = "";

  $q.notify({
    color: "primary",
    message: "Filtros limpiados.",
    position: "top",
  });
}

function fakeRefresh() {
  $q.notify({
    color: "primary",
    message: "Listado de visitas actualizado.",
    position: "top",
  });
}

function fakeExport() {
  $q.notify({
    color: "positive",
    message: "Exportación de visitas simulada.",
    position: "top",
  });
}

function fakePrint() {
  $q.notify({
    color: "primary",
    message: "Impresión simulada.",
    position: "top",
  });
}
</script>

<style scoped>
.logistics-visits-page {
  background: #f7f8fc;
  min-height: 100%;
}

.rounded-borders {
  border-radius: 16px;
}

.kpi-card {
  min-height: 96px;
}

.section-label {
  font-size: 13px;
  font-weight: 700;
  color: #394150;
  margin-bottom: 4px;
}

.active-card {
  min-height: 180px;
  transition: all 0.2s ease;
}

.active-card:hover {
  transform: translateY(-1px);
  border-color: rgba(25, 118, 210, 0.35);
}

.active-card--selected {
  border: 1px solid #1976d2;
  background: rgba(25, 118, 210, 0.05);
}

.visits-table :deep(.q-table__container) {
  border-radius: 16px;
}

.detail-label {
  font-size: 11px;
  color: #7a7f8a;
  font-weight: 700;
  letter-spacing: 0.4px;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 15px;
  color: #1f2530;
  font-weight: 600;
}

.visit-summary-card {
  background: #f9fafc;
  border: 1px solid #eceff5;
  border-radius: 18px;
  padding: 16px;
}

.summary-label {
  font-size: 11px;
  color: #7a7f8a;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e2430;
}

.summary-value.small {
  font-size: 14px;
}

.quick-card {
  height: 100%;
}

.visit-form-modal-card {
  width: 1100px;
  max-width: 95vw;
  border-radius: 20px;
}

.visit-form-modal-body {
  max-height: 80vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .detail-value {
    font-size: 14px;
  }

  .visit-form-modal-card {
    width: 100%;
    max-width: 100%;
    border-radius: 0;
  }

  .visit-form-modal-body {
    max-height: calc(100vh - 70px);
  }
}
</style>