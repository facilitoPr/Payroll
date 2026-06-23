<template>
  <div class="bg-white q-pa-md">
    <div class="row q-col-gutter-sm">
      <div class="row col-12 q-col-gutter-sm q-mb-sm">
        <div
          class="col-12 col-sm-2"
          v-if="auth.user.rol.code != 'EMPLOYEE' || auth.user.isManager"
        >
          <q-btn
            color="primary"
            label="AGREGAR"
            style="width: 100%; height: 40px"
            icon="add"
            @click="AddFile"
          />
        </div>

        <div
          class="col-12 col-xs-12 col-sm-2 col-md-auto"
          v-if="auth.user.rol.code != 'EMPLOYEE' || auth.user.isManager"
        >
          <q-btn
            color="secondary"
            label="Exportar Excel"
            style="height: 40px; width: 100%"
            icon="table_view"
            @click="exportExcel"
          />
        </div>

        <div
          class="col-12 col-xs-12 col-sm-2 col-md-auto"
          v-if="auth.user.rol.code != 'EMPLOYEE' || auth.user.isManager"
        >
          <q-btn
            color="secondary"
            label="Exportar Promedio"
            style="height: 40px; width: 100%"
            icon="description"
            @click="exportTalkingAverageExcel"
          />
        </div>

        <div
          class="col-12 col-xs-12 col-sm-2 col-md-auto"
          v-if="auth.user.rol.code != 'EMPLOYEE' || auth.user.isManager"
        >
          <q-btn
            color="primary"
            label="Producción"
            style="height: 40px; width: 100%"
            icon="description"
            @click="openProduction = true"
            :disable="date == null"
          />
        </div>
      </div>

      <div class="row q-col-gutter-sm col-12">
        <div
          class="col-12 col-sm-4"
          v-if="auth.user.rol.code != 'EMPLOYEE' || auth.user.isManager"
        >
          <q-select
            v-model="userSelected"
            label="Operadoras"
            option-label="name"
            option-value="_id"
            outlined
            dense
            color="primary"
            :options="operators"
            multiple
            use-chips
            emit-value
            map-options
            clearable
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-sm-2">
          <q-input
            v-model="date"
            label="Fecha inicio"
            type="date"
            outlined
            dense
          />
        </div>

        <div class="col-12 col-sm-2">
          <q-input
            v-model="endDate"
            label="Fecha fin (opcional)"
            type="date"
            outlined
            dense
          />
        </div>

        <div class="col-12 col-sm-2 col-md-auto">
          <q-btn
            color="primary"
            label="Buscar"
            style="height: 40px; width: 100%"
            icon="search"
            @click="search()"
          />
        </div>

        <div class="col-12 col-xs-12 col-sm-2 col-md-auto">
          <q-btn
            color="primary"
            label="Limpiar"
            style="height: 40px; width: 100%"
            icon="history"
            @click="clear"
          />
        </div>

        <div
          class="col-12 col-xs-12 col-sm-2 col-md-auto"
          v-if="auth.user.rol.code == 'EMPLOYEE' && !auth.user.isManager"
        >
          <q-btn
            color="primary"
            label="Producción"
            style="height: 40px; width: 100%"
            icon="description"
            @click="openProduction = true"
            :disable="date == null"
          />
        </div>
      </div>
    </div>

    <!-- SUMMARY -->
    <div class="q-mt-md">
      <div class="text-subtitle2 text-grey-7 q-mb-sm">
        Resumen {{ date || "inicio" }} — {{ endDate || "fin" }}
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-6 col-md-3">
          <q-card flat bordered class="q-pa-md">
            <div class="row items-center no-wrap">
              <q-icon name="call" size="md" color="primary" class="q-mr-sm" />
              <div>
                <div class="text-caption text-grey-7">Total llamadas</div>
                <div class="text-h6">{{ summary?.total }}</div>

                <!-- ⬇️ Promedio talking (Total) -->
                <div v-if="averages" class="text-caption text-grey-7 q-mt-xs">
                  Promedio conversación:
                  <q-badge
                    color="primary"
                    outline
                    class="q-ml-xs"
                    :title="`${averages?.all?.seconds ?? 0} s`"
                  >
                    {{ averages?.all?.formatted || "0:00:00" }}
                  </q-badge>
                </div>
              </div>
            </div>
          </q-card>
        </div>

        <div class="col-6 col-md-3">
          <q-card flat bordered class="q-pa-md">
            <div class="row items-center no-wrap">
              <q-icon name="call_made" size="md" color="teal" class="q-mr-sm" />
              <div>
                <div class="text-caption text-grey-7">
                  Salientes
                  <q-badge
                    v-if="summary?.total"
                    color="teal"
                    outline
                    class="q-ml-xs"
                  >
                    {{
                      Math.round((summary?.outbound / summary?.total) * 100)
                    }}%
                  </q-badge>
                </div>
                <div class="text-h6">{{ summary?.outbound }}</div>

                <!-- ⬇️ Promedio talking (Outbound) -->
                <div v-if="averages" class="text-caption text-grey-7 q-mt-xs">
                  Promedio conversación:
                  <q-badge
                    color="teal"
                    outline
                    class="q-ml-xs"
                    :title="`${averages?.outbound.seconds ?? 0} s`"
                  >
                    {{ averages?.outbound?.formatted || "0:00:00" }}
                  </q-badge>
                </div>
              </div>
            </div>
          </q-card>
        </div>

        <div class="col-6 col-md-3">
          <q-card flat bordered class="q-pa-md">
            <div class="row items-center no-wrap">
              <q-icon
                name="call_received"
                size="md"
                color="indigo"
                class="q-mr-sm"
              />
              <div>
                <div class="text-caption text-grey-7">
                  Entrantes
                  <q-badge
                    v-if="summary?.total"
                    color="indigo"
                    outline
                    class="q-ml-xs"
                  >
                    {{ Math.round((summary?.inbound / summary?.total) * 100) }}%
                  </q-badge>
                </div>
                <div class="text-h6">{{ summary?.inbound }}</div>

                <!-- ⬇️ Promedio talking (Inbound) -->
                <div v-if="averages" class="text-caption text-grey-7 q-mt-xs">
                  Promedio conversación:
                  <q-badge
                    color="indigo"
                    outline
                    class="q-ml-xs"
                    :title="`${averages?.inbound?.seconds ?? 0} s`"
                  >
                    {{ averages?.inbound?.formatted || "0:00:00" }}
                  </q-badge>
                </div>
              </div>
            </div>
          </q-card>
        </div>

        <div class="col-6 col-md-3">
          <q-card flat bordered class="q-pa-md">
            <div class="row items-center no-wrap">
              <q-icon
                name="call_made"
                size="md"
                color="grey-8"
                class="q-mr-sm"
              />
              <div>
                <div class="text-caption text-grey-7">
                  Internas
                  <q-badge
                    v-if="summary?.total"
                    color="grey-8"
                    outline
                    class="q-ml-xs"
                  >
                    {{
                      Math.round((summary?.internal / summary?.total) * 100)
                    }}%
                  </q-badge>
                </div>
                <div class="text-h6">{{ summary?.internal }}</div>

                <!-- ⬇️ Promedio talking (Internal) -->
                <div v-if="averages" class="text-caption text-grey-7 q-mt-xs">
                  Promedio conversación:
                  <q-badge
                    color="grey-8"
                    outline
                    class="q-ml-xs"
                    :title="`${averages?.internal.seconds ?? 0} s`"
                  >
                    {{ averages?.internal.formatted || "0:00:00" }}
                  </q-badge>
                </div>
              </div>
            </div>
          </q-card>
        </div>

        <div class="col-6 col-md-6">
          <q-card flat bordered class="q-pa-md">
            <div class="row items-center no-wrap">
              <q-icon
                name="done_all"
                size="md"
                color="positive"
                class="q-mr-sm"
              />
              <div>
                <div class="text-caption text-grey-7">
                  Contestadas
                  <q-badge
                    v-if="summary?.total"
                    color="positive"
                    outline
                    class="q-ml-xs"
                  >
                    {{
                      Math.round((summary?.answered / summary?.total) * 100)
                    }}%
                  </q-badge>
                </div>
                <div class="text-h6">{{ summary?.answered }}</div>
              </div>
            </div>
          </q-card>
        </div>

        <div class="col-6 col-md-6">
          <q-card flat bordered class="q-pa-md">
            <div class="row items-center no-wrap">
              <q-icon
                name="phone_missed"
                size="md"
                color="negative"
                class="q-mr-sm"
              />
              <div>
                <div class="text-caption text-grey-7">
                  No contestadas
                  <q-badge
                    v-if="summary?.total"
                    color="negative"
                    outline
                    class="q-ml-xs"
                  >
                    {{
                      Math.round((summary?.unanswered / summary?.total) * 100)
                    }}%
                  </q-badge>
                </div>
                <div class="text-h6">{{ summary?.unanswered }}</div>
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- modal -->
    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 500px; max-width: 80vw">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="add" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b>ADD FILE</b>
                </div>
              </div>

              <!-- groups -->
            </div>
            <span
              class="material-icons text-negative"
              style="font-size: 23px; cursor: pointer"
              @click="openModal = false"
            >
              cancel
            </span>
          </div>

          <q-card-section>
            <div class="col-12">
              <div class="bordereFile">
                <div class="file-select">
                  <div class="drag">
                    <div>
                      <div style="text-align: center">
                        <q-icon size="2.6em" name="description" color="white" />
                      </div>
                      <div style="text-align: center">
                        <b style="font-size: 17px; color: white">Add File</b>
                      </div>
                      <p style="color: white">or drag and drop</p>
                    </div>
                  </div>
                  <input type="file" @input="getFile" />
                </div>
              </div>

              <q-input
                v-model="nameFile"
                outlined
                label="Nombre"
                dense
                disable
                class="q-mt-md"
              />

              <!-- <div class="q-gutter-sm q-my-sm">
                <q-radio
                  dense
                  v-model="typeOfCall"
                  val="Entrantes"
                  label="Entrantes"
                />
                <q-radio
                  dense
                  v-model="typeOfCall"
                  val="Salientes"
                  label="Salientes"
                />
              </div> -->

              <div v-if="total !== 0" class="text-center">
                <q-circular-progress
                  show-value
                  font-size="12px"
                  :value="Math.round((totalSend / total) * 100)"
                  size="50px"
                  :thickness="0.22"
                  color="teal"
                  track-color="grey-3"
                  class="q-ma-md"
                >
                  {{ Math.round((totalSend / total) * 100) }}%
                </q-circular-progress>
                <div>Cargando...</div>
              </div>

              <div class="col-12 q-my-sm text-center">
                <q-btn
                  type="submit"
                  color="negative"
                  label="cancelar"
                  icon="cancel"
                  class="q-mx-sm"
                  @click="openModal = false"
                />

                <q-btn
                  type="submit"
                  color="primary"
                  label="guardar"
                  :disable="fileSeleted == ''"
                  icon="save"
                  @click="saveProductFile"
                />
              </div>
            </div>
          </q-card-section>

          <q-inner-loading
            :showing="loading"
            label="Procesando..."
            label-class="text-primary"
            label-style="font-size: 1.1em"
            color="primary"
          />
        </q-card>
      </q-dialog>
    </div>

    <!-- modal producción -->
    <div>
      <q-dialog
        v-model="openModalProduction"
        persistent
        maximized
        transition-show="slide-up"
        transition-hide="slide-down"
      >
        <q-card class="" style="width: 100%; height: 100vh">
          <div class="bg-primary row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="description" color="white" />
                </div>
                <div class="col-auto text-white">
                  <b>PRODUCCIÓN</b>
                </div>
              </div>

              <!-- groups -->
            </div>
            <span
              class="material-icons text-white"
              style="font-size: 23px; cursor: pointer"
              @click="openModalProduction = false"
            >
              cancel
            </span>
          </div>

          <q-card-section class="q-pt-md" style="position: relative">
            <div class="col-12">
              <q-tabs
                v-model="productionTab"
                dense
                class="text-grey"
                active-color="primary"
                indicator-color="primary"
                align="justify"
                narrow-indicator
                no-caps
              >
                <q-tab
                  v-for="(item, index) in productionTabs"
                  :key="index"
                  :name="item.value"
                  :label="item.label"
                />
              </q-tabs>

              <!-- Encabezado del modal -->
              <div class="q-px-sm q-pt-sm">
                <!-- Fila superior: Rango + Totales -->
                <div class="row items-center justify-between q-col-gutter-sm">
                  <!-- Rango -->
                  <div class="col-12 col-md-auto">
                    <div class="text-subtitle2 text-grey-7">
                      Rango:
                      <q-badge outline color="primary" class="q-mr-xs">{{
                        date || "inicio"
                      }}</q-badge>
                      —
                      <q-badge outline color="primary" class="q-ml-xs">{{
                        endDate || "fin"
                      }}</q-badge>
                    </div>
                  </div>

                  <!-- Totales y métricas -->
                  <div class="col-12 col-md-auto">
                    <div class="row items-center q-gutter-xs justify-end">
                      <q-badge color="secondary" outline
                        >Tab: {{ productionTab }}</q-badge
                      >
                      <q-badge
                        color="primary"
                        outline
                        v-if="!loadingAppointments"
                      >
                        Operadoras: {{ appointments?.length || 0 }}
                      </q-badge>
                      <q-badge color="teal" outline v-if="!loadingAppointments">
                        Total citas: {{ totalAppointments }}
                      </q-badge>
                      <q-badge
                        color="indigo"
                        outline
                        v-if="!loadingAppointments && appointments.length > 1"
                      >
                        Promedio/Operadora: {{ avgPerOperator }}
                      </q-badge>
                    </div>
                  </div>
                </div>

                <!-- Chips por operadora (scrollable) -->
                <div
                  v-if="
                    !loadingAppointments &&
                    operatorChips.length &&
                    appointments.length > 1
                  "
                  class="row no-wrap items-center justify-center q-gutter-xs q-mt-sm scroll-x"
                >
                  <div
                    class="row items-center justify-center"
                    style="max-width: 80%"
                  >
                    <q-chip
                      v-for="chip in operatorChips"
                      :key="chip.id"
                      square
                      clickable
                      outline
                      color="primary"
                      :title="`${chip.name} — ${chip.count} citas`"
                      class="q-mr-xs"
                    >
                      <q-avatar size="18px" color="primary" text-color="white">
                        {{ (chip.name || "?").substring(0, 1).toUpperCase() }}
                      </q-avatar>
                      <div class="q-ml-xs">
                        <span class="text-weight-medium">{{ chip.name }}</span>
                        <span class="text-grey-7"> · {{ chip.count }}</span>
                      </div>
                    </q-chip>
                  </div>
                </div>

                <!-- Chips por zona -->
                <div
                  v-if="
                    !loadingAppointments &&
                    zoneChips.length &&
                    appointments.length > 1
                  "
                  class="row no-wrap items-center justify-center q-gutter-xs q-mt-sm scroll-x"
                >
                  <div
                    class="row items-center justify-center"
                    style="max-width: 80%"
                  >
                    <q-chip
                      v-for="chip in zoneChips"
                      :key="chip.id"
                      square
                      clickable
                      outline
                      color="secondary"
                      :title="`${chip.name} — ${chip.count} citas`"
                      class="q-mr-xs"
                    >
                      <q-avatar
                        size="18px"
                        color="secondary"
                        text-color="white"
                      >
                        {{ (chip.name || "?").substring(0, 1).toUpperCase() }}
                      </q-avatar>
                      <div class="q-ml-xs">
                        <span class="text-weight-medium">{{ chip.name }}</span>
                        <span class="text-grey-7"> · {{ chip.count }}</span>
                      </div>
                    </q-chip>
                  </div>
                </div>
              </div>

              <q-tab-panels v-model="productionTab" animated class="q-mt-sm">
                <!-- APPOINTMENTS -->
                <q-tab-panel name="APPOINTMENTS">
                  <!-- Grid real -->
                  <div
                    class="row q-col-gutter-md column items-center justify-center col-12"
                    v-if="appointments?.length > 0"
                  >
                    <div
                      v-for="(item, index) in appointments"
                      :key="item?.user?._id || index"
                    >
                      <TableReportOperator
                        :item="item.user"
                        :rows="item.reminders"
                        :date="date"
                        :endDate="endDate"
                        :getReminders="getAppointments"
                      />
                    </div>
                  </div>

                  <!-- Empty state -->
                  <div
                    v-else
                    class="column items-center justify-center q-my-xl"
                  >
                    <q-icon name="event_busy" size="64px" color="grey-5" />
                    <div class="text-subtitle1 text-grey-7 q-mt-sm">
                      No hay citas para el rango seleccionado
                    </div>
                    <div class="text-caption text-grey-6">
                      Ajusta filtros o cambia el rango de fechas
                    </div>
                  </div>
                </q-tab-panel>

                <!-- CONFIRMED (mismo patrón) -->
                <q-tab-panel name="CONFIRMED">
                  <div
                    class="row q-col-gutter-md column items-center justify-center"
                    v-if="appointments?.length > 0"
                  >
                    <div
                      v-for="(item, index) in appointments"
                      :key="'cnf-' + (item?.user?._id || index)"
                    >
                      <TableReportOperator
                        :item="item.user"
                        :rows="item.reminders"
                        :date="date"
                        :endDate="endDate"
                        :getReminders="getAppointments"
                      />
                    </div>
                  </div>

                  <div
                    v-else
                    class="column items-center justify-center q-my-xl"
                  >
                    <q-icon
                      name="check_circle_outline"
                      size="64px"
                      color="grey-5"
                    />
                    <div class="text-subtitle1 text-grey-7 q-mt-sm">
                      No hay confirmados en este rango
                    </div>
                  </div>
                </q-tab-panel>
              </q-tab-panels>
            </div>

            <!-- Overlay de carga -->
            <q-inner-loading
              :showing="loadingAppointments"
              label="Cargando citas..."
              label-class="text-primary"
              label-style="font-size: 1.05em"
              color="primary"
            />
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>

    <div>
      <!-- table -->
      <q-table
        flat
        class="q-mt-md"
        row-key="_id"
        :rows="rows"
        :columns="
          !auth.user.isManager
            ? columns.columnsCallsReportsOperator()
            : columns.columnsCallsReports()
        "
        :rows-per-page-options="[limit]"
        hide-pagination
        :loading="tableLoading"
        bordered
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td
              key="user"
              :props="props"
              v-if="auth.user.rol.code != 'EMPLOYEE' || auth.user.isManager"
            >
              {{ props.row.user?.name }}
            </q-td>

            <q-td key="callTime" :props="props">
              {{ moment(props.row.callTime).format("MMMM Do YYYY, h:mm:ss a") }}
            </q-td>

            <q-td key="from" :props="props">
              {{ props.row.from }}
            </q-td>

            <q-td key="to" :props="props">
              {{ props.row.to }}
            </q-td>

            <q-td
              key="status"
              :props="props"
              :style="{
                color: props.row.status === 'Answered' ? '#28a745' : '#C93137',
              }"
            >
              {{ props.row.status }}
            </q-td>
            <q-td key="ringing" :props="props">
              {{ props.row.ringing }}
            </q-td>

            <q-td key="talking" :props="props">
              {{ props.row.talking }}
            </q-td>

            <q-td key="endByOperator" :props="props">
              {{ props.row.endByOperator ? "SI" : "NO" }}
            </q-td>
          </q-tr>
        </template>
      </q-table>

      <!-- pagination -->
      <div
        class="col-12 q-mt-sm"
        style="display: flex; align-items: center; justify-content: center"
      >
        <div
          class="col-12 q-mt-sm"
          style="display: flex; align-items: center; justify-content: center"
        >
          <TablePagination
            v-model="initialPagination"
            :orderQuantity="orderQuantity"
            color="light-blue-10"
            active-color="light-blue-5"
            :maxPages="6"
          />
        </div>
      </div>
      <NotificationsVue ref="notify" />
    </div>

    <ProductionRemindersModal
      v-model:openModal="openProduction"
      :operators="operators"
      :zones="zones"
      :date="date"
      :endDate="endDate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from "vue";
import methodsHttp, { socket } from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import TablePagination from "src/components/table/TablePagination.vue";
import moment from "moment";
import { authStore } from "src/stores/auth-store";
import TableReportOperator from "src/components/reports/TableReportOperator.vue";
import ProductionRemindersModal from "src/components/reminders/ProductionRemindersModal.vue";

const auth = authStore();

const openModal = ref(false);
const openModalProduction = ref(false);

const fileSeleted = ref("");
const total = ref(0);
const totalSend = ref(0);
const nameFile = ref("");

const rows = ref([]);
const tableLoading = ref(false);
const loading = ref(false);

const limit = ref(10);
const initial = ref(0);
const orderQuantity = ref(1);
const initialPagination = ref(1);
const userSelected = ref([]); // antes: null

const notify = ref(null);
const operators = ref([]);

const summary = ref(null);
const averages = ref(null);

const productionTab = ref("APPOINTMENTS");
const productionTabs = ref([
  { label: "CITAS", value: "APPOINTMENTS" },
  { label: "CONFIRMADAS", value: "CONFIRMED" },
]);
const appointments = ref([]);
const appointmentsZone = ref([]);
const totalAppointments = ref(0);

const loadingAppointments = ref(false);
const openProduction = ref(false);

const zones = ref([])
const date = ref(moment().format("YYYY-MM-DD"));
const endDate = ref(null);

const avgPerOperator = computed(() => {
  const ops = appointments?.value?.length || 0;
  if (!ops) return 0;
  return Math.round(totalAppointments.value / ops);
});

const operatorChips = computed(() => {
  if (!appointments?.value?.length) return [];
  return appointments.value
    .map((it) => ({
      id: it?.user?._id || Math.random().toString(36).slice(2),
      name: it?.user?.name || "Operadora",
      count: it?.reminders?.length || 0,
    }))
    .sort((a, b) => b.count - a.count); // opcional: ordenar por mayor cantidad
});

const zoneChips = computed(() => {
  if (!appointmentsZone?.value?.length) return [];
  return appointmentsZone.value
    .map((it) => ({
      id: it?.zoneId || Math.random().toString(36).slice(2),
      name: it?.zoneName || "Zona",
      count: it?.count || 0,
    }))
    .sort((a, b) => b.count - a.count); // opcional: ordenar por mayor cantidad
});

const selectedUsersParam = computed(() => {
  const ids = (userSelected.value || []).filter(Boolean);
  return ids.length ? ids.join(",") : "null";
});

watch(productionTab, () => {
  getAppointments();
});


onMounted(async () => {
  getOperators();
  await getCallsReports();
  getTalkingTotals();
  getZonesActived();

  socket.off("callReport:created");
  socket.on("callReport:created", onCallReportCreated);
});

onBeforeUnmount(() => {
  socket.off("callReport:created", onCallReportCreated);
});

const onCallReportCreated = ({ data }) => {
  rows.value = [data, ...rows.value];
  summary.value.total += 1;

  if (data.direction === "Internal") {
    summary.value.internal += 1;
  } else if (data.direction === "Inbound") {
    summary.value.inbound += 1;
  } else if (data.direction === "Outbound") {
    summary.value.outbound += 1;
  }

  if (data.status === "Unanswered") {
    summary.value.unanswered += 1;
  } else {
    summary.value.answered += 1;
  }

  const nextCount = orderQuantity.value * 10 + 1;
  orderQuantity.value = Math.ceil(nextCount / 10);

  getTalkingTotals();
};

watch(initialPagination, async (value) => {
  initial.value = (await value) * 10;
  if (value == 1) {
    initial.value = 0;
    getCallsReports();
  } else {
    initial.value = value * 10 - 10;
    getCallsReports();
  }
});

const search = () => {
  limit.value = 10;
  initial.value = 0;
  getCallsReports();
  getTalkingTotals();
};

const AddFile = () => {
  openModal.value = true;
};

const getFile = (e) => {
  let file = e.target.files[0];
  nameFile.value = file.name;
  if (file == "" || file == null || file == undefined) {
    console.log("no hay nada selecionado file");
    fileSeleted.value = "";
  } else {
    fileSeleted.value = e.target.files[0];
    console.log("so hay nada selecionado file");
  }
};

const saveProductFile = async () => {
  const formData = new FormData();
  formData.append("file", fileSeleted.value);
  formData.append("nameFile", nameFile.value);

  loading.value = true; // 🔁 INICIO LOADING
  const resp = await methodsHttp.postApi("callsReport/upload", formData);
  if (resp.ok) {
    notify.value.showNotifyGood("Archivo enviado al backend exitosamente");
    openModal.value = false;
    nameFile.value = "";
    fileSeleted.value = "";
  } else {
    notify.value.showNotifyBad("Error al enviar archivo");
  }
  loading.value = false; // ✅ FINALIZA LOADING
  getCallsReports();
};

const exportExcel = async () => {
  try {
    const filename = `reporte_operadores_${date.value || "inicio"}_${
      endDate.value || "fin"
    }.xlsx`;

    const blob = await methodsHttp.postBlob(
      "callsReport/exportCallsReportExcel",
      { startDate: date.value, endDate: endDate.value }
    );

    // por si el backend devolvió JSON de error en vez de excel
    if (blob.type?.includes("application/json")) {
      const text = await blob.text();
      try {
        const j = JSON.parse(text);
        notify.value.showNotifyBad(j?.mensaje || "Error al exportar excel");
        return;
      } catch {
        /* ignore */
      }
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.log(error);
    notify.value.showNotifyBad("Error al exportar excel");
  }
};

const exportTalkingAverageExcel = async () => {
  try {
    const filename = `reporte_operadores_promedio_${date.value || "inicio"}_${
      endDate.value || "fin"
    }.xlsx`;

    const blob = await methodsHttp.postBlob(
      "callsReport/exportOutboundAnsweredTalkingExcel",
      { startDate: date.value, endDate: endDate.value }
    );

    // por si el backend devolvió JSON de error en vez de excel
    if (blob.type?.includes("application/json")) {
      const text = await blob.text();
      try {
        const j = JSON.parse(text);
        notify.value.showNotifyBad(j?.mensaje || "Error al exportar excel");
        return;
      } catch {
        /* ignore */
      }
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.log(error);
    notify.value.showNotifyBad("Error al exportar docx");
  }
};

const getCallsReports = async () => {
  tableLoading.value = true;

  const data = {
    startDate: date.value,
    endDate: endDate.value,
  };

  const resp = await methodsHttp.postApi(
    `callsReport/getCallsReports?limit=${limit.value}&initial=${initial.value}&users=${selectedUsersParam.value}`,
    data
  );

  if (resp.ok) {
    rows.value = resp.callsReports;
    orderQuantity.value = Math.ceil(resp.count / 10);
    summary.value = resp.summary;
  }
  tableLoading.value = false;
};

const getTalkingTotals = async () => {
  averages.value = null;
  const data = {
    startDate: date.value,
    endDate: endDate.value,
  };

  const resp = await methodsHttp.postApi(
    `callsReport/getTalkingTotals?users=${selectedUsersParam.value}&answeredOnly=true`,
    data
  );

  if (resp.ok) {
    averages.value = resp.averages;
    // rows.value = resp.callsReports;
    // orderQuantity.value = Math.ceil(resp.count / 10);
    // summary.value = resp.summary;
  }
};

const getAppointments = async () => {
  appointments.value = [];
  loadingAppointments.value = true;
  const usersPath =
    selectedUsersParam.value === "null" ? "null" : selectedUsersParam.value;

  const resp = await methodsHttp.postApi(
    `reminders/getRemindersByOperatorAndDay?users=${usersPath}`,
    {
      date: moment(date.value).format("YYYY/MM/DD"),
      zone: zoneSelected?.value?._id,
      endDate: moment(endDate.value).format("YYYY/MM/DD"),
      confimed: productionTab.value === "CONFIRMED",
    }
  );

  if (resp.ok) {
    appointments.value = resp.users;
    totalAppointments.value = resp.total;
    appointmentsZone.value = resp.zonesSummary;
  }
  loadingAppointments.value = false;
};

const getOperators = async () => {
  try {
    const resp = await methodsHttp.getApi("user/getEmployees?isActived=true&departmentCode=TRIPLE_S");
    if (resp.ok) {
      operators.value = [...resp.employees];
    }
  } catch (error) {
    console.log(error);
  }
};

const changePaginationValues = async () => {
  initial.value = 0;
  limit.value = 10;
  initialPagination.value = 1;
  userSelected.value = null;
  date.value = null;
  endDate.value = null;
};

const clear = async () => {
  await changePaginationValues();
  await getCallsReports();
};

const getZonesActived = async () => {
  const resp = await methodsHttp.getApi(`zones/getZonesActived`);

  if (resp.ok) {
    zones.value = resp.zones;
  }
};

// const openProduction = () => {
//   openModalProduction.value = true;
//   getAppointments();
// };
</script>

<style>
.borderes {
  border: 1px solid red;
}
</style>
