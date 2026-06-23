<template>
  <q-page class="q-pa-md logistics-page">
    <!-- HEADER -->
    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-bold">Logística · Entrada y salida</div>
        <div class="text-grey-7">
          Registro y verificación de choferes, vehículos y carga.
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-input
            outlined
            dense
            debounce="250"
            v-model="search"
            placeholder="Buscar chofer, placa, empresa…"
            style="min-width: 280px"
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
            icon="add"
            label="Nuevo registro"
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

    <!-- KPIS -->
    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="kpi in kpis"
        :key="kpi.key"
        class="col-12 col-sm-6 col-lg-3"
      >
        <q-card bordered class="bg-white rounded-borders kpi-card">
          <q-card-section class="row items-center q-gutter-md">
            <q-avatar
              size="48px"
              color="primary"
              text-color="white"
              icon="local_shipping"
            />
            <div class="col">
              <div class="text-caption text-grey-7">{{ kpi.label }}</div>
              <div class="text-h6 text-weight-bold">{{ kpi.value }}</div>
              <div class="text-caption" :class="kpi.deltaClass">
                {{ kpi.delta }}
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
        <q-card bordered class="bg-white rounded-borders full-height">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Choferes / registros</div>
              <div class="text-caption text-grey-7">
                Lista hardcode para seleccionar y verificar.
              </div>
            </div>

            <q-badge outline color="primary">
              {{ filteredDrivers.length }} registros
            </q-badge>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-sm">
            <div class="q-gutter-sm driver-scroll">
              <q-card
                v-for="driver in filteredDrivers"
                :key="driver.id"
                bordered
                flat
                class="driver-card cursor-pointer"
                :class="{ 'driver-card--active': selectedDriver?.id === driver.id }"
                @click="selectDriver(driver)"
              >
                <q-card-section class="q-pa-md">
                  <div class="row items-center no-wrap q-col-gutter-sm">
                    <div class="col-auto">
                      <q-avatar
                        size="58px"
                        color="grey-3"
                        text-color="primary"
                        icon="person"
                      />
                    </div>

                    <div class="col">
                      <div class="text-weight-bold ellipsis">{{ driver.name }}</div>
                      <div class="text-caption text-grey-7 ellipsis">
                        {{ driver.company }}
                      </div>

                      <div class="row q-col-gutter-xs q-mt-xs">
                        <div class="col-12">
                          <span class="text-caption text-grey-7">Placa:</span>
                          <span class="text-caption text-weight-medium q-ml-xs">
                            {{ driver.plate }}
                          </span>
                        </div>
                        <div class="col-12">
                          <span class="text-caption text-grey-7">Tipo:</span>
                          <span class="text-caption text-weight-medium q-ml-xs">
                            {{ driver.vehicleType }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="col-auto">
                      <q-badge :color="statusColor(driver.status)">
                        {{ driver.status }}
                      </q-badge>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <div
                v-if="!filteredDrivers.length"
                class="q-pa-md text-grey-7 text-caption"
              >
                No hay registros para mostrar.
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- RIGHT PANEL -->
      <div class="col-12 col-lg-8">
        <q-card bordered class="bg-white rounded-borders full-height">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">
                Panel de verificación
              </div>
              <div class="text-caption text-grey-7">
                Selecciona un chofer para abrir el formulario en modal o crea un registro nuevo.
              </div>
            </div>

            <q-btn
              unelevated
              color="primary"
              icon="assignment"
              label="Nuevo registro"
              @click="openCreateModal"
            />
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-7">
                <div class="driver-summary">
                  <div class="row items-center q-col-gutter-md">
                    <div class="col-auto">
                      <q-avatar
                        size="86px"
                        color="grey-3"
                        text-color="primary"
                        icon="person"
                      />
                    </div>

                    <div class="col">
                      <div class="text-h6 text-weight-bold">
                        {{ selectedDriver?.name || "Sin chofer seleccionado" }}
                      </div>
                      <div class="text-grey-7">
                        {{ selectedDriver?.company || "Selecciona un registro de la izquierda" }}
                      </div>

                      <div class="row q-col-gutter-md q-mt-sm">
                        <div class="col-6 col-md-3">
                          <div class="summary-label">LICENCIA</div>
                          <div class="summary-value">
                            {{ selectedDriver?.licenseNumber || "—" }}
                          </div>
                        </div>
                        <div class="col-6 col-md-3">
                          <div class="summary-label">TELÉFONO</div>
                          <div class="summary-value">
                            {{ selectedDriver?.phone || "—" }}
                          </div>
                        </div>
                        <div class="col-6 col-md-3">
                          <div class="summary-label">TIPO</div>
                          <div class="summary-value">
                            {{ selectedDriver?.vehicleType || "—" }}
                          </div>
                        </div>
                        <div class="col-6 col-md-3">
                          <div class="summary-label">PLACA</div>
                          <div class="summary-value">
                            {{ selectedDriver?.plate || "—" }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="row q-col-gutter-md q-mt-md">
                  <div class="col-12 col-sm-6">
                    <q-card flat bordered class="rounded-borders info-card">
                      <q-card-section>
                        <div class="text-caption text-grey-7">ÚLTIMA ACCIÓN</div>
                        <div class="text-subtitle1 text-weight-bold q-mt-xs">
                          {{ selectedDriver?.recordType === "EXIT" ? "Salida" : "Entrada" }}
                        </div>
                        <q-badge
                          class="q-mt-sm"
                          :color="selectedDriver?.recordType === 'EXIT' ? 'orange' : 'green'"
                        >
                          {{ selectedDriver?.recordType === "EXIT" ? "Registro de salida" : "Registro de entrada" }}
                        </q-badge>
                      </q-card-section>
                    </q-card>
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-card flat bordered class="rounded-borders info-card">
                      <q-card-section>
                        <div class="text-caption text-grey-7">ESTADO</div>
                        <div class="text-subtitle1 text-weight-bold q-mt-xs">
                          {{ selectedDriver?.status || "Sin estado" }}
                        </div>
                        <q-badge
                          class="q-mt-sm"
                          :color="statusColor(selectedDriver?.status)"
                        >
                          {{ selectedDriver?.status || "N/D" }}
                        </q-badge>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-5">
                <q-card flat bordered class="rounded-borders side-action-card">
                  <q-card-section>
                    <div class="text-subtitle2 text-weight-bold">
                      Acciones rápidas
                    </div>
                    <div class="text-caption text-grey-7 q-mb-md">
                      Abre el formulario en modal para registrar entrada o salida.
                    </div>

                    <div class="column q-gutter-sm">
                      <q-btn
                        unelevated
                        color="primary"
                        icon="add"
                        label="Nuevo registro"
                        @click="openCreateModal"
                      />

                      <q-btn
                        outline
                        color="primary"
                        icon="edit"
                        label="Abrir registro seleccionado"
                        :disable="!selectedDriver"
                        @click="openSelectedDriverModal"
                      />

                      <q-btn
                        outline
                        color="grey-8"
                        icon="clear"
                        label="Limpiar selección"
                        :disable="!selectedDriver"
                        @click="clearSelectedDriver"
                      />
                    </div>

                    <q-separator class="q-my-md" />

                    <div class="text-caption text-grey-7">FECHA / HORA</div>
                    <div class="text-weight-medium">{{ nowLabel }}</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- MODAL FORM -->
    <q-dialog
      v-model="showFormModal"
      :maximized="$q.screen.lt.md"
      persistent
    >
      <q-card class="form-modal-card">
        <q-card-section class="row items-center justify-between q-pb-sm">
          <div>
            <div class="text-h6 text-weight-bold">
              {{ modalMode === "create" ? "Nuevo registro logístico" : "Verificación de registro" }}
            </div>
            <div class="text-caption text-grey-7">
              Completa la información del chofer, vehículo y carga.
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="close"
            @click="closeFormModal"
          />
        </q-card-section>

        <q-separator />

        <q-card-section class="form-modal-body">
          <!-- TOP SUMMARY -->
          <div class="row q-col-gutter-md items-start">
            <div class="col-12 col-md-8">
              <div class="driver-summary">
                <div class="row items-center q-col-gutter-md">
                  <div class="col-auto">
                    <q-avatar
                      size="86px"
                      color="grey-3"
                      text-color="primary"
                      icon="person"
                    />
                  </div>

                  <div class="col">
                    <div class="text-h6 text-weight-bold">
                      {{ form.driverName || "Sin chofer seleccionado" }}
                    </div>
                    <div class="text-grey-7">
                      {{ form.company || "Empresa no definida" }}
                    </div>

                    <div class="row q-col-gutter-md q-mt-sm">
                      <div class="col-6 col-md-3">
                        <div class="summary-label">LICENCIA</div>
                        <div class="summary-value">{{ form.licenseNumber || "—" }}</div>
                      </div>
                      <div class="col-6 col-md-3">
                        <div class="summary-label">TELÉFONO</div>
                        <div class="summary-value">{{ form.phone || "—" }}</div>
                      </div>
                      <div class="col-6 col-md-3">
                        <div class="summary-label">TIPO VEHÍCULO</div>
                        <div class="summary-value">{{ form.vehicleType || "—" }}</div>
                      </div>
                      <div class="col-6 col-md-3">
                        <div class="summary-label">PLACA</div>
                        <div class="summary-value">{{ form.plate || "—" }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-md-4">
              <q-card flat bordered class="rounded-borders">
                <q-card-section class="q-pa-md">
                  <div class="text-caption text-grey-7">TIPO DE REGISTRO</div>

                  <q-btn-toggle
                    v-model="form.recordType"
                    spread
                    no-caps
                    unelevated
                    toggle-color="primary"
                    class="q-mt-sm"
                    :options="[
                      { label: 'Entrada', value: 'ENTRY' },
                      { label: 'Salida', value: 'EXIT' }
                    ]"
                  />

                  <div class="q-mt-md text-caption text-grey-7">ESTATUS</div>
                  <q-badge
                    class="q-mt-xs"
                    :color="form.recordType === 'ENTRY' ? 'green' : 'orange'"
                  >
                    {{ form.recordType === "ENTRY" ? "Registro de entrada" : "Registro de salida" }}
                  </q-badge>

                  <div class="q-mt-md text-caption text-grey-7">FECHA / HORA</div>
                  <div class="text-weight-medium">{{ nowLabel }}</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <!-- STEPPER -->
          <q-stepper
            v-model="step"
            flat
            animated
            color="primary"
            active-color="amber-8"
            done-color="amber-8"
            contracted
            class="logistics-stepper"
          >
            <!-- STEP 1 -->
            <q-step
              :name="1"
              title="Vehículo"
              icon="local_shipping"
              :done="step > 1"
            >
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <div class="section-label">Tipo de Operación</div>
                  <q-btn-toggle
                    v-model="form.operationType"
                    spread
                    no-caps
                    unelevated
                    toggle-color="primary"
                    class="q-mt-xs"
                    :options="[
                      { label: 'Carga', value: 'LOAD' },
                      { label: 'Descarga', value: 'UNLOAD' },
                      { label: 'Transbordo', value: 'TRANSFER' }
                    ]"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <div class="section-label">Condición del Vehículo</div>
                  <q-btn-toggle
                    v-model="form.vehicleCondition"
                    spread
                    no-caps
                    unelevated
                    :toggle-color="vehicleConditionColor(form.vehicleCondition)"
                    class="q-mt-xs"
                    :options="[
                      { label: 'Buena', value: 'GOOD' },
                      { label: 'Regular', value: 'REGULAR' },
                      { label: 'Mala', value: 'BAD' }
                    ]"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.tractorUnit"
                    label="Unidad / Cabezote"
                    placeholder="Ej: TRK-204"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.trailerNumber"
                    label="Remolque / Trailer"
                    placeholder="Ej: TRL-7781"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <q-input
                    outlined
                    type="number"
                    v-model="form.vehicleWeight"
                    label="Peso del Vehículo (lbs)"
                    placeholder="Ej: 45000"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <q-input
                    outlined
                    v-model="form.plate"
                    label="Placa"
                    placeholder="Ej: E-34567"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <q-select
                    outlined
                    v-model="form.axles"
                    :options="[2, 3, 4, 5, 6]"
                    label="Cantidad de ejes"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-select
                    outlined
                    v-model="form.idPresented"
                    :options="yesNoOptions"
                    label="ID válido presentado (Chofer)"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-select
                    outlined
                    v-model="form.vehicleInspection"
                    :options="yesNoOptions"
                    label="Inspección visual completada"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.destinationArea"
                    label="Área / destino interno"
                    placeholder="Ej: Manufactura, Muelle 2, Almacén A"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.appointmentCode"
                    label="Cita / referencia de acceso"
                    placeholder="Ej: APPT-2026-0018"
                  />
                </div>
              </div>
            </q-step>

            <!-- STEP 2 -->
            <q-step
              :name="2"
              title="Acompañante"
              icon="groups"
              :done="step > 2"
            >
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-select
                    outlined
                    v-model="form.hasCompanion"
                    :options="yesNoOptions"
                    label="¿El chofer viene acompañado?"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-select
                    outlined
                    v-model="form.companionAuthorized"
                    :options="yesNoOptions"
                    label="¿Acompañante autorizado?"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.companionName"
                    label="Nombre del acompañante"
                    placeholder="Ej: José Martínez"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.companionId"
                    label="Cédula / ID"
                    placeholder="Ej: 402-1234567-8"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.companionPhone"
                    label="Teléfono"
                    placeholder="Ej: 809-555-0103"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-select
                    outlined
                    v-model="form.companionAccessPass"
                    :options="yesNoOptions"
                    label="Pase temporal entregado"
                  />
                </div>

                <div class="col-12">
                  <q-input
                    outlined
                    type="textarea"
                    autogrow
                    v-model="form.companionNotes"
                    label="Notas del acompañante"
                    placeholder="Observaciones sobre la persona acompañante"
                  />
                </div>
              </div>
            </q-step>

            <!-- STEP 3 -->
            <q-step
              :name="3"
              title="Carga"
              icon="inventory_2"
              :done="step > 3"
            >
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.containerNumber"
                    label="Numeración del contenedor"
                    placeholder="Ej: MSCU-1234567"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.containerSeal"
                    label="Sello del contenedor"
                    placeholder="Ej: SEAL-98765"
                  />
                </div>

                <div class="col-12">
                  <div class="section-label">Tipo de Carga</div>
                  <q-btn-toggle
                    v-model="form.cargoType"
                    no-caps
                    unelevated
                    spread
                    class="q-mt-xs"
                    toggle-color="primary"
                    :options="cargoOptions"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.referenceNumber"
                    label="Número de Orden / Referencia"
                    placeholder="Ej: OC-2026-0142"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.purchaseOrder"
                    label="PO / Documento relacionado"
                    placeholder="Ej: PO-33920"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <q-input
                    outlined
                    type="number"
                    v-model="form.temperature"
                    label="Temperatura (si aplica)"
                    placeholder="Ej: 5"
                  >
                    <template #append>
                      <span class="text-grey-7">°C</span>
                    </template>
                  </q-input>
                </div>

                <div class="col-12 col-md-4">
                  <q-select
                    outlined
                    v-model="form.hazardousMaterial"
                    :options="yesNoOptions"
                    label="¿Material peligroso?"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <q-select
                    outlined
                    v-model="form.docsVerified"
                    :options="yesNoOptions"
                    label="¿Documentos verificados?"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.origin"
                    label="Origen"
                    placeholder="Ej: Puerto Caucedo"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    v-model="form.finalDestination"
                    label="Destino final"
                    placeholder="Ej: Planta principal / Almacén B"
                  />
                </div>

                <div class="col-12">
                  <q-input
                    outlined
                    type="textarea"
                    autogrow
                    v-model="form.cargoDescription"
                    label="Descripción de la carga"
                    placeholder="Ej: Arroz en sacos, 22 pallets, lote A-14"
                  />
                </div>
              </div>
            </q-step>

            <!-- STEP 4 -->
            <q-step
              :name="4"
              title="Foto & Notas"
              icon="photo_camera"
            >
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-card flat bordered class="rounded-borders">
                    <q-card-section>
                      <div class="text-subtitle2 text-weight-bold">
                        Evidencias fotográficas
                      </div>
                      <div class="text-caption text-grey-7">
                        Hardcode por ahora. Luego aquí conectas cámara o subida real.
                      </div>

                      <div class="row q-col-gutter-sm q-mt-md">
                        <div
                          v-for="slot in photoSlots"
                          :key="slot.key"
                          class="col-12 col-sm-6"
                        >
                          <div class="photo-placeholder">
                            <q-icon name="photo_camera" size="28px" class="q-mb-sm" />
                            <div class="text-weight-medium">{{ slot.label }}</div>
                            <div class="text-caption text-grey-7">
                              Placeholder de imagen
                            </div>
                            <q-btn
                              dense
                              outline
                              color="primary"
                              icon="add_a_photo"
                              label="Agregar"
                              class="q-mt-sm"
                              @click="fakeUpload(slot.label)"
                            />
                          </div>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <div class="col-12 col-md-6">
                  <q-card flat bordered class="rounded-borders">
                    <q-card-section>
                      <div class="text-subtitle2 text-weight-bold">
                        Notas del guardia
                      </div>
                      <div class="text-caption text-grey-7">
                        Observaciones, incidencias y validaciones del acceso.
                      </div>

                      <q-input
                        class="q-mt-md"
                        outlined
                        type="textarea"
                        autogrow
                        v-model="form.guardNotes"
                        label="Observaciones"
                        placeholder="Ej: Se verificó sello, temperatura dentro del rango y documentación completa."
                      />

                      <q-select
                        class="q-mt-md"
                        outlined
                        v-model="form.incidentLevel"
                        :options="incidentOptions"
                        label="Nivel de incidencia"
                      />

                      <q-select
                        class="q-mt-md"
                        outlined
                        v-model="form.approvalDecision"
                        :options="approvalOptions"
                        label="Decisión del acceso"
                      />

                      <q-select
                        class="q-mt-md"
                        outlined
                        v-model="form.requiresEscort"
                        :options="yesNoOptions"
                        label="¿Requiere escolta interna?"
                      />
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-step>

            <template #navigation>
              <div class="row items-center justify-between q-mt-md">
                <div class="row q-gutter-sm">
                  <q-btn
                    flat
                    color="grey-8"
                    icon="arrow_back"
                    label="Anterior"
                    :disable="step === 1"
                    @click="step--"
                  />

                  <q-btn
                    v-if="step < 4"
                    unelevated
                    color="primary"
                    icon-right="arrow_forward"
                    label="Siguiente"
                    @click="step++"
                  />
                </div>

                <div class="row q-gutter-sm">
                  <q-btn
                    outline
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
                    :label="form.recordType === 'ENTRY' ? 'Registrar entrada' : 'Registrar salida'"
                    @click="submitRecord"
                  />
                </div>
              </div>
            </template>
          </q-stepper>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { reactive, ref, computed } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();

const search = ref("");
const step = ref(1);
const showFormModal = ref(false);
const modalMode = ref("create");
const selectedDriver = ref(null);

const nowLabel = new Intl.DateTimeFormat("es-DO", {
  dateStyle: "full",
  timeStyle: "short",
}).format(new Date());

const kpis = ref([
  {
    key: "inside",
    label: "Camiones dentro",
    value: "18",
    delta: "+3 vs ayer",
    deltaClass: "text-positive",
  },
  {
    key: "pending",
    label: "Pendientes de validar",
    value: "6",
    delta: "2 con incidencia",
    deltaClass: "text-warning",
  },
  {
    key: "exits",
    label: "Salidas del día",
    value: "11",
    delta: "+4 hoy",
    deltaClass: "text-positive",
  },
  {
    key: "visits",
    label: "Visitas logísticas",
    value: "9",
    delta: "1 bloqueada",
    deltaClass: "text-negative",
  },
]);

const drivers = ref([
  {
    id: "d1",
    name: "Carlos Rivera",
    company: "Express Boricua",
    licenseNumber: "34567890",
    phone: "787-555-0103",
    vehicleType: "Camión Cerrado",
    plate: "E-34567",
    status: "Pendiente",
    recordType: "ENTRY",
  },
  {
    id: "d2",
    name: "Miguel Torres",
    company: "Atlantic Cargo",
    licenseNumber: "92834711",
    phone: "809-555-2201",
    vehicleType: "Furgón",
    plate: "L-78211",
    status: "En proceso",
    recordType: "ENTRY",
  },
  {
    id: "d3",
    name: "Javier Núñez",
    company: "North Dock Logistics",
    licenseNumber: "55210094",
    phone: "829-555-7781",
    vehicleType: "Plataforma",
    plate: "A-88412",
    status: "Aprobado",
    recordType: "EXIT",
  },
  {
    id: "d4",
    name: "Pedro Castillo",
    company: "Ruta Industrial SRL",
    licenseNumber: "11338920",
    phone: "849-555-3342",
    vehicleType: "Camión Refrigerado",
    plate: "R-10292",
    status: "Pendiente",
    recordType: "ENTRY",
  },
]);

const cargoOptions = [
  { label: "Arroz", value: "RICE" },
  { label: "Granos", value: "GRAINS" },
  { label: "Materiales", value: "MATERIALS" },
  { label: "Químicos", value: "CHEMICALS" },
  { label: "Equipo", value: "EQUIPMENT" },
  { label: "Otro", value: "OTHER" },
];

const yesNoOptions = ["Sí", "No"];
const incidentOptions = ["Sin incidencia", "Leve", "Moderada", "Alta"];
const approvalOptions = ["Aprobado", "Aprobado con observación", "Rechazado"];

const photoSlots = [
  { key: "front", label: "Foto frontal" },
  { key: "plate", label: "Foto de placa" },
  { key: "seal", label: "Foto del sello" },
  { key: "cargo", label: "Foto de la carga" },
];

const form = reactive(getDefaultForm());

const filteredDrivers = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return drivers.value;

  return drivers.value.filter((d) => {
    return (
      d.name.toLowerCase().includes(q) ||
      d.company.toLowerCase().includes(q) ||
      d.plate.toLowerCase().includes(q) ||
      d.vehicleType.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q)
    );
  });
});

function getDefaultForm() {
  return {
    recordType: "ENTRY",

    driverName: "",
    company: "",
    licenseNumber: "",
    phone: "",
    vehicleType: "",
    plate: "",

    operationType: "LOAD",
    vehicleCondition: "GOOD",
    tractorUnit: "",
    trailerNumber: "",
    vehicleWeight: "",
    axles: 4,
    idPresented: "Sí",
    vehicleInspection: "Sí",
    destinationArea: "",
    appointmentCode: "",

    hasCompanion: "No",
    companionAuthorized: "Sí",
    companionName: "",
    companionId: "",
    companionPhone: "",
    companionAccessPass: "No",
    companionNotes: "",

    containerNumber: "",
    containerSeal: "",
    cargoType: "RICE",
    referenceNumber: "",
    purchaseOrder: "",
    temperature: "",
    hazardousMaterial: "No",
    docsVerified: "Sí",
    origin: "",
    finalDestination: "",
    cargoDescription: "",

    guardNotes: "",
    incidentLevel: "Sin incidencia",
    approvalDecision: "Aprobado",
    requiresEscort: "No",
  };
}

function fillFormFromDriver(driver) {
  Object.assign(form, getDefaultForm(), {
    driverName: driver.name,
    company: driver.company,
    licenseNumber: driver.licenseNumber,
    phone: driver.phone,
    vehicleType: driver.vehicleType,
    plate: driver.plate,
    recordType: driver.recordType || "ENTRY",

    tractorUnit: "TRK-204",
    trailerNumber: "TRL-7781",
    vehicleWeight: "45000",
    axles: 4,
    idPresented: "Sí",
    vehicleInspection: "Sí",
    appointmentCode: "APPT-2026-0018",

    containerNumber: "MSCU-1234567",
    containerSeal: "SEAL-98765",
    referenceNumber: "OC-2026-0142",
    purchaseOrder: "PO-33920",
    hazardousMaterial: "No",
    docsVerified: "Sí",
    origin: "Puerto Caucedo",
    finalDestination: "Almacén A",
    cargoDescription: "Arroz empacado en pallets, lote A-14.",
  });

  if (driver.vehicleType === "Camión Refrigerado") {
    form.temperature = "4";
    form.cargoType = "MATERIALS";
    form.destinationArea = "Muelle 2";
    form.operationType = "UNLOAD";
  } else if (driver.vehicleType === "Plataforma") {
    form.temperature = "";
    form.cargoType = "EQUIPMENT";
    form.destinationArea = "Patio de carga";
    form.operationType = "TRANSFER";
  } else {
    form.temperature = "";
    form.cargoType = "RICE";
    form.destinationArea = "Manufactura";
    form.operationType = "LOAD";
  }
}

function openCreateModal() {
  modalMode.value = "create";
  selectedDriver.value = null;
  Object.assign(form, getDefaultForm());
  step.value = 1;
  showFormModal.value = true;
}

function selectDriver(driver) {
  selectedDriver.value = driver;
  modalMode.value = "edit";
  fillFormFromDriver(driver);
  step.value = 1;
  showFormModal.value = true;
}

function openSelectedDriverModal() {
  if (!selectedDriver.value) return;

  modalMode.value = "edit";
  fillFormFromDriver(selectedDriver.value);
  step.value = 1;
  showFormModal.value = true;
}

function clearSelectedDriver() {
  selectedDriver.value = null;

  $q.notify({
    color: "grey-8",
    message: "Selección limpiada.",
    position: "top",
  });
}

function closeFormModal() {
  showFormModal.value = false;
}

function vehicleConditionColor(value) {
  switch (value) {
    case "GOOD":
      return "positive";
    case "REGULAR":
      return "warning";
    case "BAD":
      return "negative";
    default:
      return "primary";
  }
}

function statusColor(status) {
  switch (status) {
    case "Pendiente":
      return "orange";
    case "En proceso":
      return "blue";
    case "Aprobado":
      return "positive";
    case "Rechazado":
      return "negative";
    default:
      return "grey";
  }
}

function fakeRefresh() {
  $q.notify({
    color: "primary",
    message: "Listado de logística refrescado.",
    position: "top",
  });
}

function fakeUpload(label) {
  $q.notify({
    color: "primary",
    message: `${label} agregada (simulado).`,
    position: "top",
  });
}

function saveDraft() {
  $q.notify({
    color: "warning",
    message: "Borrador guardado localmente (hardcode).",
    position: "top",
  });
}

function submitRecord() {
  $q.notify({
    color: "positive",
    message:
      form.recordType === "ENTRY"
        ? "Entrada registrada correctamente (hardcode)."
        : "Salida registrada correctamente (hardcode).",
    position: "top",
  });

  showFormModal.value = false;
}
</script>

<style scoped>
.logistics-page {
  background: #f7f8fc;
  min-height: 100%;
}

.rounded-borders {
  border-radius: 16px;
}

.kpi-card {
  min-height: 96px;
}

.full-height {
  height: 100%;
}

.driver-scroll {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.driver-card {
  border-radius: 14px;
  transition: all 0.2s ease;
}

.driver-card:hover {
  transform: translateY(-1px);
  border-color: rgba(25, 118, 210, 0.35);
}

.driver-card--active {
  border: 1px solid #1976d2;
  background: rgba(25, 118, 210, 0.05);
}

.driver-summary {
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
  font-size: 19px;
  font-weight: 700;
  color: #1e2430;
}

.section-label {
  font-size: 13px;
  font-weight: 700;
  color: #394150;
  margin-bottom: 4px;
}

.photo-placeholder {
  min-height: 170px;
  border: 1px dashed #c8d0dc;
  border-radius: 14px;
  background: #fafbfd;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex-direction: column;
  padding: 16px;
}

.info-card,
.side-action-card {
  height: 100%;
}

.form-modal-card {
  width: 1200px;
  max-width: 95vw;
  border-radius: 20px;
}

.form-modal-body {
  max-height: 90vh;
  overflow-y: auto;
}

.logistics-stepper :deep(.q-stepper__tab) {
  border-radius: 12px;
}

@media (max-width: 1024px) {
  .driver-scroll {
    max-height: none;
    overflow: visible;
  }
}

@media (max-width: 768px) {
  .summary-value {
    font-size: 16px;
  }

  .form-modal-card {
    width: 100%;
    max-width: 100%;
    border-radius: 0;
  }

  .form-modal-body {
    max-height: calc(100vh - 70px);
  }
}
</style>