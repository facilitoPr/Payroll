<template>
  <div class="q-pa-md">
    <PageHeaderCard
      title="Amonestaciones"
      subtitle="Filtra por empleado, categoría y rango. Crea nuevas amonestaciones y exporta."
      icon="gpp_maybe"
    >
      <template #actions>
        <!-- Categoria -->
        <q-select
          v-model="filters.category"
          label="Categoría"
          outlined
          dense
          color="primary"
          :options="CATEGORY_OPTIONS"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          clearable
          class="header-field header-field--wide"
        >
          <template #prepend>
            <q-icon name="category" color="primary" />
          </template>
        </q-select>

        <!-- Empleado -->
        <q-select
          v-model="filters.userId"
          label="Empleado"
          outlined
          dense
          color="primary"
          :options="employees"
          option-label="name"
          option-value="_id"
          emit-value
          map-options
          use-input
          input-debounce="350"
          clearable
          class="header-field header-field--wide"
          @filter="onFilterEmployees"
        >
          <template #prepend>
            <q-icon name="person_search" color="primary" />
          </template>

          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">No results</q-item-section>
            </q-item>
          </template>

          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="28px">
                  {{ initials(scope.opt?.name) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt?.name }}</q-item-label>
                <q-item-label caption>
                  {{ scope.opt?.email || "" }}
                  <span v-if="scope.opt?.department?.name">
                    • {{ scope.opt.department.name }}
                  </span>
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Fecha inicio -->
        <q-input
          outlined
          dense
          v-model="fromFormatted"
          class="header-field"
          label="Fecha inicio"
          clearable
          @clear="filters.from = ''"
        >
          <template #prepend>
            <q-icon
              name="schedule"
              class="cursor-pointer"
              @click="filters.from = moment().format('YYYY-MM-DD')"
            />
          </template>

          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date minimal v-model="filters.from" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Cerrar" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <!-- Fecha fin -->
        <q-input
          outlined
          dense
          v-model="toFormatted"
          class="header-field"
          label="Fecha fin (opcional)"
          clearable
          @clear="filters.to = ''"
        >
          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date minimal v-model="filters.to" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Cerrar" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <!-- Buscar -->
        <q-btn
          color="primary"
          unelevated
          icon="search"
          label="Buscar"
          class="header-btn"
          :loading="loading"
          @click="reload(true)"
        />

        <!-- Nueva amonestación -->
        <q-btn
          color="primary"
          outline
          icon="add"
          label="Nueva"
          class="header-btn"
          @click="openCreate()"
        />

        <!-- Acciones -->
        <q-btn
          color="primary"
          outline
          icon="more_vert"
          label="Acciones"
          class="header-btn"
        >
          <q-menu>
            <q-list style="min-width: 240px">
              <q-item clickable v-close-popup @click="exportCSV()">
                <q-item-section avatar
                  ><q-icon name="table_view"
                /></q-item-section>
                <q-item-section>Exportar datos</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </template>
    </PageHeaderCard>

    <!-- TABLA -->
    <q-card flat bordered class="rounded-borders">
      <q-table
        flat
        :rows="rows"
        :columns="columns"
        row-key="_id"
        :loading="loading"
        v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 50, 100]"
        @request="onRequest"
      >
        <template v-slot:body-cell-user="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar size="28px" color="primary" text-color="white">
                <q-img
                  v-if="!!props.row?.userSnapshot?.img"
                  :src="props.row?.userSnapshot?.img"
                  fit="cover"
                />
                <div v-else>
                  {{ initials(props.row?.userSnapshot?.name) }}
                </div>
              </q-avatar>
              <div class="q-ml-sm">
                <div class="text-body2">
                  {{ props.row?.userSnapshot?.name || "-" }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ props.row?.userSnapshot?.email || "" }}
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-category="props">
          <q-td :props="props">
            <q-chip dense color="blue-grey-1" text-color="blue-grey-9">
              {{ categoryLabel(props.row?.category) }}
            </q-chip>
            <q-chip
              v-if="props.row?.scope === 'RANGE'"
              dense
              color="purple-1"
              text-color="purple-9"
              class="q-ml-sm"
            >
              Rango
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-minutesLate="props">
          <q-td :props="props" class="text-right">
            <span v-if="props.row?.category === 'LATE_ARRIVAL'">
              <q-chip dense color="warning" text-color="black">
                {{ lateChipText(props.row) }}
              </q-chip>
            </span>
            <span v-else class="text-caption text-grey-7">—</span>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <div class="row items-center justify-end q-gutter-xs">
              <q-btn
                flat
                dense
                icon="visibility"
                @click.stop="openDetail(props.row)"
              >
                <q-tooltip>Ver detalle</q-tooltip>
              </q-btn>

              <q-btn
                flat
                dense
                color="negative"
                icon="delete"
                @click.stop="removeAction(props.row)"
              >
                <q-tooltip>Borrar</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <template v-slot:no-data>
          <div class="full-width row flex-center q-pa-lg text-grey-7">
            <q-icon name="info" class="q-mr-sm" />
            No hay amonestaciones.
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- DIALOG CREAR -->
    <q-dialog v-model="create.open" persistent>
      <q-card style="width: 820px; max-width: 95vw; border-radius: 16px">
        <div class="bg-primary row justify-between q-pa-md">
          <div class="text-white" style="font-size: 19px; font-weight: 500">
            <div class="row items-center">
              <div class="col-auto q-mx-sm">
                <q-icon size="2em" name="gpp_maybe" color="white" />
              </div>
              <div class="col-auto text-white">
                <b>Nueva amonestación</b>
              </div>
            </div>
          </div>
          <span
            class="material-icons text-white"
            style="font-size: 23px; cursor: pointer"
            @click="create.open = false"
          >
            cancel
          </span>
        </div>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- Categoria -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="create.form.category"
                label="Categoría"
                outlined
                dense
                color="primary"
                :options="CATEGORY_OPTIONS"
                option-label="label"
                option-value="value"
                emit-value
                map-options
              >
                <template #prepend>
                  <q-icon name="category" color="primary" />
                </template>
              </q-select>
            </div>

            <!-- Empleado -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="create.form.userId"
                label="Empleado"
                outlined
                dense
                color="primary"
                :options="employees"
                option-label="name"
                option-value="_id"
                emit-value
                map-options
                use-input
                input-debounce="350"
                clearable
                @filter="onFilterEmployees"
              >
                <template #prepend>
                  <q-icon name="person" color="primary" />
                </template>

                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey"
                      >No results</q-item-section
                    >
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- ✅ Si category = LATE_ARRIVAL → modo Día / Rango -->
            <div class="col-12" v-if="create.form.category === 'LATE_ARRIVAL'">
              <q-banner rounded class="bg-blue-1 text-blue-9 q-mb-md">
                Para tardanza, el sistema calculará automáticamente las
                tardanzas buscando los resumenes diarios del día o del rango.
              </q-banner>

              <q-btn-toggle
                v-model="create.form.lateMode"
                no-caps
                unelevated
                toggle-color="primary"
                color="grey-2"
                text-color="grey-8"
                class="q-mb-md"
                :options="[
                  { label: 'Un día', value: 'DAY' },
                  { label: 'Rango', value: 'RANGE' },
                ]"
              />

              <!-- Día -->
              <div
                v-if="create.form.lateMode === 'DAY'"
                class="row q-col-gutter-md"
              >
                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    dense
                    v-model="create.form.workDateString"
                    label="Fecha laboral (YYYY-MM-DD)"
                  >
                    <template #append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy
                          cover
                          transition-show="scale"
                          transition-hide="scale"
                        >
                          <q-date
                            minimal
                            v-model="create.form.workDateString"
                            mask="YYYY-MM-DD"
                          >
                            <div class="row items-center justify-end">
                              <q-btn
                                v-close-popup
                                label="Cerrar"
                                color="primary"
                                flat
                              />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
              </div>

              <!-- Rango -->
              <div v-else class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    dense
                    v-model="create.form.from"
                    label="Desde (YYYY-MM-DD)"
                  >
                    <template #append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy
                          cover
                          transition-show="scale"
                          transition-hide="scale"
                        >
                          <q-date
                            minimal
                            v-model="create.form.from"
                            mask="YYYY-MM-DD"
                          >
                            <div class="row items-center justify-end">
                              <q-btn
                                v-close-popup
                                label="Cerrar"
                                color="primary"
                                flat
                              />
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
                    v-model="create.form.to"
                    label="Hasta (YYYY-MM-DD)"
                  >
                    <template #append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy
                          cover
                          transition-show="scale"
                          transition-hide="scale"
                        >
                          <q-date
                            minimal
                            v-model="create.form.to"
                            mask="YYYY-MM-DD"
                          >
                            <div class="row items-center justify-end">
                              <q-btn
                                v-close-popup
                                label="Cerrar"
                                color="primary"
                                flat
                              />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
              </div>
            </div>

            <!-- ✅ Para otras categorías: fecha laboral normal -->
            <div class="col-12 col-md-6" v-else>
              <q-input
                outlined
                dense
                v-model="create.form.workDateString"
                label="Fecha laboral (YYYY-MM-DD)"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-date
                        minimal
                        v-model="create.form.workDateString"
                        mask="YYYY-MM-DD"
                      >
                        <div class="row items-center justify-end">
                          <q-btn
                            v-close-popup
                            label="Cerrar"
                            color="primary"
                            flat
                          />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- Notas -->
            <div class="col-12">
              <q-input
                v-model="create.form.notes"
                type="textarea"
                outlined
                label="Notas (opcional)"
                autogrow
              />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-px-md q-py-sm">
          <q-btn flat label="Cancelar" @click="create.open = false" />
          <q-btn
            color="primary"
            unelevated
            label="Crear"
            :loading="create.loading"
            @click="createAction()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIALOG DETALLE (simple) -->
    <q-dialog v-model="detail.open">
      <q-card style="width: 900px; max-width: 95vw; border-radius: 16px">
        <q-card-section class="bg-primary row items-center justify-between">
          <div>
            <div class="text-subtitle1 text-weight-bold text-white">
              Detalle de amonestación
            </div>
            <div class="text-caption text-white">
              {{ categoryLabel(detail.item?.category) }}
            </div>
          </div>
          <q-btn flat round icon="close" v-close-popup color="white" />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="detail.loading">
          <q-skeleton type="text" width="35%" class="q-mb-sm" />
          <q-skeleton type="rect" height="220px" />
        </q-card-section>

        <q-card-section v-else-if="detail.error">
          <q-banner rounded class="bg-red-1 text-red-9">{{
            detail.error
          }}</q-banner>
        </q-card-section>

        <q-card-section v-else>
          <!-- EMPLEADO -->
          <q-card flat bordered class="rounded-borders">
            <q-card-section class="row items-start q-col-gutter-md">
              <!-- Avatar iniciales -->
              <div class="col-auto">
                <q-avatar size="52px" color="primary" text-color="white">
                  {{
                    (detail.item?.userSnapshot?.name || "—")
                      .trim()
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                  }}
                </q-avatar>
              </div>

              <!-- Datos -->
              <div class="col">
                <div class="row items-start justify-between">
                  <div>
                    <div class="text-subtitle1 text-weight-bold">
                      {{ detail.item?.userSnapshot?.name || "-" }}
                    </div>

                    <div class="text-body2 text-grey-7 q-mt-xs">
                      <q-icon name="mail" size="16px" class="q-mr-xs" />
                      {{ detail.item?.userSnapshot?.email || "-" }}
                    </div>
                  </div>

                  <!-- Chip rol (si existe) -->
                  <!-- <div
                    class="col-auto"
                    v-if="detail.item?.userSnapshot?.roleCode"
                  >
                    <q-chip dense color="grey-2" text-color="grey-9">
                      <q-icon
                        name="verified_user"
                        size="16px"
                        class="q-mr-xs"
                      />
                      {{ detail.item?.userSnapshot?.roleCode }}
                    </q-chip>
                  </div> -->
                </div>

                <q-separator class="q-my-sm" />

                <!-- Departamento y Puesto -->
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <div class="text-caption text-grey-6">Departamento</div>
                    <div class="text-body2">
                      <q-icon name="apartment" size="16px" class="q-mr-xs" />
                      {{ detail.item?.userSnapshot?.department?.name || "-" }}
                      <span
                        v-if="detail.item?.userSnapshot?.department?.code"
                        class="text-caption text-grey-7 q-ml-xs"
                      >
                        ({{ detail.item?.userSnapshot?.department?.code }})
                      </span>
                    </div>
                  </div>

                  <div class="col-12 col-sm-6">
                    <div class="text-caption text-grey-6">Puesto</div>
                    <div class="text-body2">
                      <q-icon name="badge" size="16px" class="q-mr-xs" />
                      {{ detail.item?.userSnapshot?.jobPosition?.name || "-" }}
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- INFORMACIÓN -->
          <q-card flat bordered class="rounded-borders q-mt-md">
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <div class="text-subtitle2 text-weight-bold">Información</div>

                <!-- scope -->
                <q-chip
                  dense
                  :color="detail.item?.scope === 'RANGE' ? 'blue-1' : 'grey-2'"
                  text-color="grey-9"
                >
                  <q-icon name="event" size="16px" class="q-mr-xs" />
                  {{ detail.item?.scope === "RANGE" ? "Rango" : "Día" }}
                </q-chip>
              </div>

              <!-- Fecha o Rango -->
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-grey-7">
                  {{ detail.item?.scope === "RANGE" ? "Periodo" : "Fecha" }}
                </span>

                <span
                  class="text-body2 text-weight-medium"
                  style="text-align: right"
                >
                  <template v-if="detail.item?.scope === 'RANGE'">
                    {{ detail.item?.period?.fromDateString || "-" }}
                    <span class="text-grey-7">→</span>
                    {{ detail.item?.period?.toDateString || "-" }}
                  </template>
                  <template v-else>
                    {{ detail.item?.workDateString || "-" }}
                  </template>
                </span>
              </div>

              <!-- TARDANZA -->
              <div
                v-if="detail.item?.category === 'LATE_ARRIVAL'"
                class="q-mt-md"
              >
                <div
                  v-if="detail.item?.scope === 'RANGE'"
                  class="row items-center justify-between q-mb-xs"
                >
                  <span class="text-caption text-grey-7"
                    >Tardanza acumulada</span
                  >
                  <span class="text-body2 text-weight-bold">
                    {{ fmtLate(detail.item?.evidence?.totalMinutesLate) }}
                    <span class="text-caption text-grey-7">
                      ({{ detail.item?.evidence?.daysCount || 0 }} días)
                    </span>
                  </span>
                </div>

                <div v-else class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-grey-7">Minutos tarde</span>
                  <span class="text-body2 text-weight-bold">
                    {{ fmtLate(detail.item?.evidence?.minutesLate) }}
                  </span>
                </div>

                <!-- Extra: método / zona horaria -->
                <!-- <div class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-grey-7">Calculado por</span>
                  <span class="text-body2">
                    {{ detail.item?.evidence?.calculatedBy || "-" }}
                    <span
                      v-if="detail.item?.evidence?.timezone"
                      class="text-caption text-grey-7 q-ml-xs"
                    >
                      ({{ detail.item?.evidence?.timezone }})
                    </span>
                  </span>
                </div> -->

                <div
                  v-if="detail.item?.evidence?.graceMinutes !== undefined"
                  class="row items-center justify-between q-mb-xs"
                >
                  <span class="text-caption text-grey-7">Tiempo de gracia</span>
                  <span class="text-body2">
                    {{ detail.item?.evidence?.graceMinutes }} min
                  </span>
                </div>
              </div>

              <q-separator class="q-my-md" />

              <!-- Notas -->
              <div class="text-caption text-grey-7 q-mb-xs">Notas</div>
              <q-card flat class="bg-grey-1 rounded-borders">
                <q-card-section class="q-pa-sm">
                  <div class="text-body2" style="white-space: pre-wrap">
                    {{ detail.item?.notes || "-" }}
                  </div>
                </q-card-section>
              </q-card>

              <!-- Acknowledged -->
              <div
                v-if="
                  detail.item?.acknowledgedAt || detail.item?.acknowledgeNotes
                "
                class="q-mt-md"
              >
                <div class="text-caption text-grey-7 q-mb-xs">Acuse</div>

                <div class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-grey-7">Fecha de acuse</span>
                  <span class="text-body2">
                    {{
                      detail.item?.acknowledgedAt
                        ? new Date(detail.item.acknowledgedAt).toLocaleString()
                        : "-"
                    }}
                  </span>
                </div>

                <div v-if="detail.item?.acknowledgeNotes" class="q-mt-sm">
                  <div class="text-caption text-grey-7 q-mb-xs">
                    Nota del empleado
                  </div>
                  <q-card flat class="bg-grey-1 rounded-borders">
                    <q-card-section class="q-pa-sm">
                      <div class="text-body2" style="white-space: pre-wrap">
                        {{ detail.item?.acknowledgeNotes }}
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { Notify, useQuasar } from "quasar";
import moment from "moment";
import methodsHttp from "src/api/methodsHttp";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import "moment/dist/locale/es";
import { useRoute } from "vue-router";
moment.locale("es-do");

const $q = useQuasar();
const route = useRoute();

const CATEGORY_OPTIONS = [
  { label: "Llegada tarde", value: "LATE_ARRIVAL" },
  { label: "Salida temprano", value: "EARLY_DEPARTURE" },
  { label: "No se presentó", value: "NO_SHOW" },
  { label: "Ponche faltante", value: "MISSING_PUNCH" },
  { label: "Pausa no autorizada", value: "UNAUTHORIZED_BREAK" },
  { label: "Conducta inapropiada", value: "MISCONDUCT" },
  { label: "Insubordinación", value: "INSUBORDINATION" },
  { label: "Código de vestimenta", value: "DRESS_CODE" },
  { label: "Bajo desempeño", value: "POOR_PERFORMANCE" },
  { label: "Violación de procedimiento", value: "PROCEDURE_VIOLATION" },
  { label: "Violación de seguridad", value: "SAFETY_VIOLATION" },
  { label: "Queja de cliente", value: "CUSTOMER_COMPLAINT" },
  { label: "Violación política seguridad", value: "SECURITY_POLICY_VIOLATION" },
  { label: "Manejo indebido de datos", value: "DATA_MISHANDLING" },
];

function categoryLabel(v) {
  return CATEGORY_OPTIONS.find((x) => x.value === v)?.label || v || "-";
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

function fmtLate(mins) {
  const m = Number(mins || 0);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r}m`;
  return `${h}h ${r}m`;
}

function lateChipText(row) {
  if (!row) return "0m";
  if (row.scope === "RANGE") {
    return `${fmtLate(row?.evidence?.totalMinutesLate)} • ${
      row?.evidence?.daysCount || 0
    } días`;
  }
  return fmtLate(row?.evidence?.minutesLate);
}

/* ------------------- helpers fechas ------------------- */
function normalizeYMD(s) {
  const m = moment(String(s || "").trim(), ["YYYY-MM-DD", "YYYY/MM/DD"], true);
  return m.isValid() ? m.format("YYYY-MM-DD") : "";
}

function normalizeRange(from, to) {
  const f = normalizeYMD(from);
  const t = normalizeYMD(to) || f; // ✅ si no viene to, usar from
  if (!f) return { from: "", to: "" };

  // ✅ si el rango viene invertido, lo arreglamos
  if (moment(f).isAfter(moment(t))) {
    return { from: t, to: f };
  }
  return { from: f, to: t };
}

/* ------------------- filtros header ------------------- */
const filters = ref({
  category: "",
  userId: "",
  from: "",
  to: "",
});

const fromFormatted = computed({
  get: () => filters.value.from,
  set: (v) => (filters.value.from = v || ""),
});
const toFormatted = computed({
  get: () => filters.value.to,
  set: (v) => (filters.value.to = v || ""),
});

/* ------------------- tabla ------------------- */
const loading = ref(false);
const rows = ref([]);

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

const columns = [
  { name: "user", label: "Empleado", field: "user", align: "left" },
  { name: "category", label: "Categoría", field: "category", align: "left" },
  {
    name: "workDateString",
    label: "Fecha",
    field: "workDateString",
    align: "left",
  },
  {
    name: "minutesLate",
    label: "Tardanza",
    field: (r) => r?.evidence?.minutesLate,
    align: "right",
  },
  {
    name: "createdAt",
    label: "Creada",
    field: (r) =>
      moment(r?.createdAt).locale("es-do").format("dddd DD MMMM, YYYY"),
    align: "left",
  },
  { name: "actions", label: "", field: "actions", align: "right" },
];

function buildQueryParams(pag = pagination.value) {
  const limit = pag.rowsPerPage;
  const initial = (pag.page - 1) * pag.rowsPerPage;

  const params = { limit: String(limit), initial: String(initial) };

  if (filters.value.category) params.category = filters.value.category;
  if (filters.value.userId) params.userId = filters.value.userId;

  // normalizamos el filtro también
  const f = normalizeYMD(filters.value.from);
  const t = normalizeYMD(filters.value.to);
  if (f) params.from = f;
  if (t) params.to = t;

  return params;
}

async function fetchRows(pag = pagination.value) {
  loading.value = true;
  try {
    const params = buildQueryParams(pag);
    const qs = new URLSearchParams(params).toString();

    const resp = await methodsHttp.getApi(
      `disciplinary/listDisciplinaryActions?${qs}`,
    );
    if (!resp?.ok) throw new Error(resp?.mensaje || "No se pudo cargar");

    rows.value = Array.isArray(resp.items) ? resp.items : [];
    pagination.value.rowsNumber = Number(resp.total || 0);
  } catch (e) {
    Notify.create({
      type: "negative",
      message: e?.message || "Error cargando amonestaciones",
    });
    rows.value = [];
    pagination.value.rowsNumber = 0;
  } finally {
    loading.value = false;
  }
}

function onRequest(ctx) {
  pagination.value = ctx.pagination;
  fetchRows(pagination.value);
}

function reload(resetPage = false) {
  if (resetPage) pagination.value.page = 1;
  fetchRows(pagination.value);
}

/* ------------------- empleados (searchable) ------------------- */
const employees = ref([]);
let empFetchT = null;

async function searchEmployees(search = "") {
  try {
    const qs = new URLSearchParams({ search: String(search || "") }).toString();
    const resp = await methodsHttp.getApi(`user/lookupEmployees?${qs}`);
    if (resp?.ok) {
      const list = resp.employees || [];
      employees.value = Array.isArray(list) ? list : [];
    }
  } catch (e) {}
}

function onFilterEmployees(val, update) {
  update(() => {
    clearTimeout(empFetchT);
    empFetchT = setTimeout(() => {
      searchEmployees(val || "");
    }, 250);
  });
}

/* ------------------- crear ------------------- */
const create = ref({
  open: false,
  loading: false,
  form: {
    category: "LATE_ARRIVAL",
    userId: "",
    notes: "",

    // tardanza
    lateMode: "DAY", // DAY | RANGE
    workDateString: moment().format("YYYY-MM-DD"),
    from: moment().format("YYYY-MM-DD"),
    to: moment().format("YYYY-MM-DD"),
  },
});

function openCreate() {
  const today = moment().format("YYYY-MM-DD");
  create.value.open = true;
  create.value.form = {
    category: "LATE_ARRIVAL",
    userId: "",
    notes: "",

    lateMode: "DAY",
    workDateString: today,
    from: today,
    to: today,
  };
}

// ✅ Mantener campos consistentes al cambiar categoría / modo
watch(
  () => create.value.form.category,
  (cat) => {
    const today = moment().format("YYYY-MM-DD");

    if (cat === "LATE_ARRIVAL") {
      if (!create.value.form.lateMode) create.value.form.lateMode = "DAY";
      if (!create.value.form.workDateString)
        create.value.form.workDateString = today;
      if (!create.value.form.from)
        create.value.form.from = create.value.form.workDateString || today;
      if (!create.value.form.to)
        create.value.form.to = create.value.form.from || today;
    } else {
      // para otras categorías, solo usamos workDateString
      create.value.form.lateMode = "DAY";
      create.value.form.from = "";
      create.value.form.to = "";
      if (!create.value.form.workDateString)
        create.value.form.workDateString = today;
    }
  },
);

watch(
  () => create.value.form.lateMode,
  (mode) => {
    if (create.value.form.category !== "LATE_ARRIVAL") return;

    const wd =
      normalizeYMD(create.value.form.workDateString) ||
      moment().format("YYYY-MM-DD");
    if (mode === "DAY") {
      create.value.form.workDateString = wd;
    } else {
      // RANGE: prellenar con la fecha del día
      create.value.form.from = normalizeYMD(create.value.form.from) || wd;
      create.value.form.to =
        normalizeYMD(create.value.form.to) || create.value.form.from;
    }
  },
);

async function createAction() {
  const f = create.value.form;

  if (!f.userId) {
    Notify.create({
      type: "warning",
      message: "Debes seleccionar un empleado",
    });
    return;
  }
  if (!f.category) {
    Notify.create({
      type: "warning",
      message: "Debes seleccionar una categoría",
    });
    return;
  }

  // ✅ validar según categoría
  if (f.category === "LATE_ARRIVAL") {
    if (f.lateMode === "DAY") {
      const wd = normalizeYMD(f.workDateString);
      if (!wd) {
        Notify.create({
          type: "warning",
          message: "Debes seleccionar la fecha laboral",
        });
        return;
      }
    } else {
      const r = normalizeRange(f.from, f.to);
      if (!r.from) {
        Notify.create({
          type: "warning",
          message: "Debes seleccionar la fecha desde",
        });
        return;
      }
      // `to` puede venir vacío (se iguala a from), por eso no lo obligamos
    }
  } else {
    const wd = normalizeYMD(f.workDateString);
    if (!wd) {
      Notify.create({
        type: "warning",
        message: "Debes seleccionar la fecha laboral",
      });
      return;
    }
  }

  create.value.loading = true;
  try {
    const payload = {
      category: f.category,
      userId: f.userId,
      notes: f.notes || "",
      createdVia: "MANUAL",
      preventDuplicate: true,
    };

    // ✅ forma EXACTA de envío para el backend
    if (f.category === "LATE_ARRIVAL") {
      if (f.lateMode === "DAY") {
        payload.workDateString = normalizeYMD(f.workDateString);
      } else {
        const r = normalizeRange(f.from, f.to);
        payload.from = r.from;
        // ✅ si el usuario no puso "to", se manda igual que "from" (si prefieres omitir, dime)
        payload.to = r.to;
      }
    } else {
      payload.workDateString = normalizeYMD(f.workDateString);
    }

    const resp = await methodsHttp.postApi(
      "disciplinary/createDisciplinaryAction",
      payload,
    );
    if (!resp?.ok) throw new Error(resp?.mensaje || "No se pudo crear");

    Notify.create({ type: "positive", message: "Amonestación creada" });
    create.value.open = false;
    await reload(true);
  } catch (e) {
    Notify.create({
      type: "negative",
      message: e?.message || "Error creando amonestación",
    });
  } finally {
    create.value.loading = false;
  }
}

/* ------------------- detalle ------------------- */
const detail = ref({
  open: false,
  loading: false,
  error: "",
  item: null,
});

async function openDetail(row) {
  detail.value.open = true;
  detail.value.loading = true;
  detail.value.error = "";
  detail.value.item = null;

  try {
    const resp = await methodsHttp.getApi(
      `disciplinary/getDisciplinaryAction/${row?._id}`,
    );
    if (!resp?.ok)
      throw new Error(resp?.mensaje || "No se pudo cargar el detalle");
    detail.value.item = resp.disciplinaryAction || null;
  } catch (e) {
    detail.value.error = e?.message || "Error cargando detalle";
  } finally {
    detail.value.loading = false;
  }
}

/* ------------------- borrar ------------------- */
async function removeAction(row) {
  $q.dialog({
    title: "Borrar amonestación",
    message: "Esto hará soft delete. ¿Deseas continuar?",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const del = methodsHttp.deleteApi || methodsHttp.delApi;
      if (!del)
        throw new Error("No existe método deleteApi/delApi en methodsHttp");

      const resp = await del(
        `disciplinary/deleteDisciplinaryAction/${row?._id}`,
      );
      if (!resp?.ok) throw new Error(resp?.mensaje || "No se pudo borrar");

      Notify.create({ type: "positive", message: "Eliminada" });
      await reload(true);
    } catch (e) {
      Notify.create({
        type: "negative",
        message: e?.message || "Error borrando",
      });
    }
  });
}

function exportCSV() {
  Notify.create({ type: "info", message: "Pendiente: exportación CSV/Excel" });
}

/* ------------------- init ------------------- */
onMounted(async () => {
  await searchEmployees("");
  if (route.query.userId) {
    const employee = employees.value.find(
      (item) => item._id === route.query.userId,
    );


    filters.value.userId = employee._id;
  }

  reload(true);
});
</script>

<style scoped>
.rounded-borders {
  border-radius: 16px;
}

.header-field {
  min-width: 190px;
}
.header-field--wide {
  min-width: 260px;
}
.header-btn {
  height: 40px;
}
</style>
