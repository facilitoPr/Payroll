<template>
  <q-page class="termination-page">
    <div class="page-container">
      <PageHeaderCard
        title="Desvinculaciones"
        subtitle="Revisa, aprueba y registra el pago de las liquidaciones de empleados."
        icon="person_remove"
      >
        <template #actions>
          <q-btn
            outline
            rounded
            no-caps
            color="primary"
            icon="refresh"
            label="Actualizar"
            :loading="loading || catalogsLoading"
            @click="loadPageData"
          />
        </template>
      </PageHeaderCard>

      <!-- Resumen -->

      <div class="row q-col-gutter-md">
        <div
          v-for="card in summaryCards"
          :key="card.key"
          class="col-12 col-sm-6 col-md-4 col-xl"
        >
          <q-card flat bordered class="summary-card">
            <div class="summary-card-content">
              <q-avatar
                :color="card.background"
                :text-color="card.color"
                :icon="card.icon"
                size="46px"
              />

              <div class="summary-card-info">
                <div class="summary-card-label">
                  {{ card.label }}
                </div>

                <div
                  class="summary-card-value"
                  :class="`text-${card.color}`"
                >
                  {{ card.isMoney ? money(card.value) : card.value }}
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </div>

      <!-- Política utilizada -->

      <q-banner
        v-if="catalogs.policy"
        class="policy-banner bg-blue-1 text-primary q-mt-md"
      >
        <template #avatar>
          <q-icon name="policy" color="primary" />
        </template>

        <div class="text-weight-bold">
          Política activa:
          {{
            catalogs.policy.name ||
            catalogs.policy.code ||
            "Política de desvinculación"
          }}
        </div>

        <div class="text-caption">
          Versión {{ catalogs.policy.version || 1 }}

          <span v-if="catalogs.policy.effectiveFrom">
            · Vigente desde {{ formatDate(catalogs.policy.effectiveFrom) }}
          </span>
        </div>
      </q-banner>

      <!-- Error de catálogos -->

      <q-banner
        v-if="catalogsError"
        class="policy-banner bg-orange-1 text-orange-10 q-mt-md"
      >
        <template #avatar>
          <q-icon name="warning" color="orange-10" />
        </template>

        {{ catalogsError }}

        <template #action>
          <q-btn
            flat
            dense
            no-caps
            color="orange-10"
            icon="refresh"
            label="Reintentar"
            :loading="catalogsLoading"
            @click="loadCatalogs"
          />
        </template>
      </q-banner>

      <!-- Filtros -->

      <q-card flat bordered class="filters-card q-mt-md">
        <div class="filters-header">
          <div class="row items-center no-wrap q-gutter-sm">
            <q-avatar
              color="blue-1"
              text-color="primary"
              icon="filter_alt"
              size="42px"
            />

            <div>
              <div class="section-title">Filtros</div>

              <div class="section-subtitle">
                Busca por empleado, estado, tipo, préstamo o fecha de salida.
              </div>
            </div>
          </div>

          <q-btn
            flat
            rounded
            no-caps
            color="grey-8"
            icon="filter_alt_off"
            label="Limpiar filtros"
            @click="resetFilters"
          />
        </div>

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12 col-md-4">
            <div class="field-label">Buscar</div>

            <q-input
              v-model="filters.search"
              outlined
              dense
              rounded
              clearable
              debounce="450"
              color="primary"
              placeholder="Nombre, cédula, código o razón..."
            >
              <template #prepend>
                <q-icon name="search" />
              </template>

              <template #append>
                <q-btn
                  v-if="filters.search"
                  flat
                  round
                  dense
                  icon="close"
                  @click="clearSearch"
                />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <div class="field-label">Estado</div>

            <q-select
              v-model="filters.status"
              outlined
              dense
              rounded
              clearable
              emit-value
              map-options
              color="primary"
              placeholder="Todos"
              :loading="catalogsLoading"
              :options="statusOptions"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="field-label">Tipo de desvinculación</div>

            <q-select
              v-model="filters.terminationType"
              outlined
              dense
              rounded
              clearable
              emit-value
              map-options
              use-input
              input-debounce="0"
              color="primary"
              placeholder="Todos"
              :loading="catalogsLoading"
              :options="filteredTerminationTypeOptions"
              @filter="filterTerminationTypes"
            >
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No hay tipos disponibles en la política activa.
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="field-label">Préstamos</div>

            <q-select
              v-model="filters.hasLoans"
              outlined
              dense
              rounded
              clearable
              emit-value
              map-options
              color="primary"
              placeholder="Todos"
              :loading="catalogsLoading"
              :options="loanFilterOptions"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="field-label">Fecha desde</div>

            <q-input
              v-model="filters.dateFrom"
              outlined
              dense
              rounded
              color="primary"
              type="date"
              clearable
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="field-label">Fecha hasta</div>

            <q-input
              v-model="filters.dateTo"
              outlined
              dense
              rounded
              color="primary"
              type="date"
              clearable
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="field-label">Neto mínimo</div>

            <q-input
              v-model.number="filters.minimumNet"
              outlined
              dense
              rounded
              color="primary"
              type="number"
              min="0"
              prefix="RD$"
              clearable
            />
          </div>

          <div class="col-12 col-md-3 flex items-end">
            <q-btn
              unelevated
              rounded
              no-caps
              color="primary"
              icon="search"
              label="Aplicar filtros"
              class="full-width filter-button"
              :loading="loading"
              @click="applyFilters"
            />
          </div>
        </div>
      </q-card>

      <!-- Tabla -->

      <q-card flat bordered class="table-card q-mt-md">
        <div class="table-card-header">
          <div>
            <div class="section-title">
              Registros de desvinculación
            </div>

            <div class="section-subtitle">
              {{ pagination.rowsNumber }} registro(s) encontrado(s).
            </div>
          </div>

          <q-chip
            dense
            color="grey-2"
            text-color="grey-9"
            icon="receipt_long"
          >
            Página {{ pagination.page }} de {{ totalPages }}
          </q-chip>
        </div>

        <q-table
          v-model:pagination="pagination"
          flat
          bordered
          row-key="_id"
          :rows="rows"
          :columns="columns"
          :loading="loading"
          :grid="$q.screen.lt.md"
          :rows-per-page-options="[10, 20, 50, 100]"
          binary-state-sort
          class="termination-table"
          @request="onRequest"
        >
          <template #loading>
            <q-inner-loading showing color="primary">
              <q-spinner-dots size="46px" />
            </q-inner-loading>
          </template>

          <template #no-data>
            <div class="full-width empty-state">
              <q-icon
                name="person_off"
                size="60px"
                color="grey-5"
              />

              <div class="empty-title">
                No hay desvinculaciones
              </div>

              <div class="empty-subtitle">
                No se encontraron registros con los filtros seleccionados.
              </div>

              <q-btn
                outline
                rounded
                no-caps
                color="primary"
                icon="refresh"
                label="Limpiar y actualizar"
                class="q-mt-md"
                @click="resetFilters"
              />
            </div>
          </template>

          <template #body-cell-terminationNumber="props">
            <q-td :props="props">
              <div class="termination-number">
                {{ getTerminationNumber(props.row) }}
              </div>

              <div class="text-caption text-grey-7">
                Creada {{ formatDateTime(props.row.createdAt) }}
              </div>
            </q-td>
          </template>

          <template #body-cell-employee="props">
            <q-td :props="props">
              <div class="employee-cell">
                <q-avatar size="42px" class="employee-avatar">
                  <q-img
                    v-if="getEmployeeImage(props.row)"
                    :src="getEmployeeImage(props.row)"
                    fit="cover"
                  />

                  <span v-else>
                    {{ getInitials(getEmployeeName(props.row)) }}
                  </span>
                </q-avatar>

                <div class="employee-cell-info">
                  <div class="employee-cell-name">
                    {{ getEmployeeName(props.row) }}
                  </div>

                  <div class="text-caption text-grey-7 ellipsis">
                    {{ getEmployeeEmail(props.row) }}
                  </div>

                  <div class="text-caption text-grey-7">
                    {{ getEmployeeCode(props.row) }}
                  </div>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-terminationType="props">
            <q-td :props="props">
              <div class="text-weight-bold">
                {{ getTerminationTypeLabel(props.row) }}
              </div>

              <div class="text-caption text-grey-7">
                {{ props.row.terminationType || "" }}
              </div>
            </q-td>
          </template>

          <template #body-cell-terminationDate="props">
            <q-td :props="props">
              <div class="text-weight-medium">
                {{ formatDate(props.row.terminationDate) }}
              </div>

              <div class="text-caption text-grey-7">
                Ingreso:
                {{
                  formatDate(
                    props.row.employeeSnapshot?.hiringDate ||
                      props.row.hiringDate ||
                      props.row.employee?.hiringDate,
                  )
                }}
              </div>
            </q-td>
          </template>

          <template #body-cell-totalIncome="props">
            <q-td :props="props" class="text-right">
              <div class="amount-positive">
                {{ money(getTotalIncome(props.row)) }}
              </div>
            </q-td>
          </template>

          <template #body-cell-loanDeduction="props">
            <q-td :props="props" class="text-right">
              <div
                v-if="getLoanDeduction(props.row) > 0"
                class="loan-cell"
              >
                <div class="amount-negative">
                  -{{ money(getLoanDeduction(props.row)) }}
                </div>

                <div
                  v-if="getLoanRemaining(props.row) > 0"
                  class="text-caption text-orange-10"
                >
                  Pendiente:
                  {{ money(getLoanRemaining(props.row)) }}
                </div>
              </div>

              <q-chip
                v-else
                dense
                color="grey-2"
                text-color="grey-7"
                icon="money_off"
              >
                Sin préstamo
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-netTotal="props">
            <q-td :props="props" class="text-right">
              <div class="net-total-cell">
                {{ money(getNetTotal(props.row)) }}
              </div>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                dense
                :color="getStatusConfig(props.row.status).background"
                :text-color="getStatusConfig(props.row.status).color"
                :icon="getStatusConfig(props.row.status).icon"
              >
                {{ getStatusConfig(props.row.status).label }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-left">
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="visibility"
                @click="openDetail(props.row)"
              >
                <q-tooltip>Ver detalle</q-tooltip>
              </q-btn>

              <q-btn
                v-if="getPrimaryAction(props.row)"
                flat
                round
                dense
                :color="getPrimaryAction(props.row).color"
                :icon="getPrimaryAction(props.row).icon"
                @click="openDetail(props.row)"
              >
                <q-tooltip>
                  {{ getPrimaryAction(props.row).label }}
                </q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <!-- Móvil -->

          <template #item="props">
            <div class="q-pa-sm col-12 col-sm-6">
              <q-card flat bordered class="mobile-termination-card">
                <q-card-section>
                  <div class="row items-start no-wrap">
                    <q-avatar size="46px" class="employee-avatar">
                      {{ getInitials(getEmployeeName(props.row)) }}
                    </q-avatar>

                    <div class="col q-ml-sm">
                      <div class="text-weight-bold">
                        {{ getEmployeeName(props.row) }}
                      </div>

                      <div class="text-caption text-grey-7">
                        {{ getTerminationNumber(props.row) }}
                      </div>
                    </div>

                    <q-chip
                      dense
                      :color="
                        getStatusConfig(props.row.status).background
                      "
                      :text-color="
                        getStatusConfig(props.row.status).color
                      "
                    >
                      {{ getStatusConfig(props.row.status).label }}
                    </q-chip>
                  </div>

                  <q-separator class="q-my-md" />

                  <div class="mobile-detail-row">
                    <span>Tipo</span>

                    <strong>
                      {{ getTerminationTypeLabel(props.row) }}
                    </strong>
                  </div>

                  <div class="mobile-detail-row">
                    <span>Fecha de salida</span>

                    <strong>
                      {{ formatDate(props.row.terminationDate) }}
                    </strong>
                  </div>

                  <div class="mobile-detail-row">
                    <span>Préstamos</span>

                    <strong class="text-negative">
                      {{ money(getLoanDeduction(props.row)) }}
                    </strong>
                  </div>

                  <div class="mobile-detail-row">
                    <span>Neto</span>

                    <strong class="text-primary">
                      {{ money(getNetTotal(props.row)) }}
                    </strong>
                  </div>
                </q-card-section>

                <q-card-actions align="right">
                  <q-btn
                    flat
                    rounded
                    no-caps
                    color="primary"
                    icon="visibility"
                    label="Ver detalle"
                    @click="openDetail(props.row)"
                  />
                </q-card-actions>
              </q-card>
            </div>
          </template>
        </q-table>
      </q-card>
    </div>

    <EmployeeTerminationDetailDialog
      v-model="detailDialogOpen"
      :termination="selectedTermination"
      :catalogs="catalogs"
      @updated="handleTerminationUpdated"
    />
  </q-page>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { Notify, useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import EmployeeTerminationDetailDialog from "src/components/employeeTermination/EmployeeTerminationDetailDialog.vue";
import { authStore } from "src/stores/auth-store";

const $q = useQuasar();
const store = authStore();

const ENDPOINTS = {
  list: "employee-termination/terminations",
  catalogs: "employee-termination/terminations/catalogs",
};

const createEmptyCatalogs = () => ({
  statuses: [],
  terminationTypes: [],
  paymentMethods: [],
  loanFilters: [],
  actions: [],
  policy: null,
});

const loading = ref(false);
const catalogsLoading = ref(false);
const catalogsError = ref("");

const rows = ref([]);
const catalogs = reactive(createEmptyCatalogs());

const selectedTermination = ref(null);
const detailDialogOpen = ref(false);

const summary = reactive({
  total: 0,
  totalNet: 0,
  byStatus: {},
});

const filters = reactive({
  search: "",
  status: null,
  terminationType: null,
  hasLoans: null,
  dateFrom: "",
  dateTo: "",
  minimumNet: null,
});

const pagination = ref({
  sortBy: "createdAt",
  descending: true,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

const filteredTerminationTypeOptions = ref([]);

const columns = [
  {
    name: "actions",
    label: "",
    field: "actions",
    align: "left",
  },
  {
    name: "terminationNumber",
    label: "Número",
    field: "terminationNumber",
    align: "left",
    sortable: true,
  },
  {
    name: "employee",
    label: "Empleado",
    field: "employee",
    align: "left",
  },
  {
    name: "terminationType",
    label: "Tipo",
    field: "terminationType",
    align: "left",
    sortable: true,
  },
  {
    name: "terminationDate",
    label: "Fecha de salida",
    field: "terminationDate",
    align: "left",
    sortable: true,
  },
  {
    name: "totalIncome",
    label: "Ingresos",
    field: "calculation.totalIncome",
    align: "right",
    sortable: true,
  },
  {
    name: "loanDeduction",
    label: "Préstamos",
    field: "loanSnapshot.totalDeducted",
    align: "right",
  },
  {
    name: "netTotal",
    label: "Neto",
    field: "calculation.netTotal",
    align: "right",
    sortable: true,
  },
  {
    name: "status",
    label: "Estado",
    field: "status",
    align: "left",
    sortable: true,
  },
];

const currentCompanyId = computed(() => {
  return (
    store?.user?.company?._id ||
    store?.user?.company ||
    store?.auth?.company?._id ||
    store?.auth?.company ||
    store?.company?._id ||
    store?.company ||
    null
  );
});

const statusOptions = computed(() => {
  return (catalogs.statuses || []).map((item) => ({
    label: item.label,
    value: item.value,
  }));
});

const terminationTypeOptions = computed(() => {
  return (catalogs.terminationTypes || []).map((item) => ({
    label: item.label,
    value: item.value,
    description: item.description || "",
  }));
});

const loanFilterOptions = computed(() => {
  return catalogs.loanFilters || [];
});

const totalPages = computed(() => {
  const rowsPerPage = Number(pagination.value.rowsPerPage || 20);

  return Math.max(
    1,
    Math.ceil(Number(pagination.value.rowsNumber || 0) / rowsPerPage),
  );
});

const summaryCards = computed(() => {
  const cards = [
    {
      key: "total",
      label: "Total",
      value: Number(summary.total || 0),
      icon: "receipt_long",
      background: "blue-1",
      color: "primary",
      isMoney: false,
    },
  ];

  const statusCards = (catalogs.statuses || [])
    .filter((item) => item.showInSummary === true)
    .map((item) => ({
      key: item.value,
      label: item.summaryLabel || item.label,
      value: Number(summary.byStatus?.[item.value] || 0),
      icon: item.icon || "label",
      background: item.background || "grey-2",
      color: item.color || "grey-9",
      isMoney: false,
    }));

  cards.push(...statusCards);

  cards.push({
    key: "totalNet",
    label: "Neto total",
    value: Number(summary.totalNet || 0),
    icon: "account_balance_wallet",
    background: "purple-1",
    color: "purple-10",
    isMoney: true,
  });

  return cards;
});

let searchTimer = null;

watch(
  () => filters.search,
  () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
      pagination.value.page = 1;
      loadTerminations();
    }, 500);
  },
);

watch(
  currentCompanyId,
  () => {
    pagination.value.page = 1;
    loadPageData();
  },
);

onMounted(() => {
  loadPageData();
});

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
});

const loadPageData = async () => {
  await Promise.all([loadCatalogs(), loadTerminations()]);
};

const loadCatalogs = async () => {
  catalogsLoading.value = true;
  catalogsError.value = "";

  try {
    const query = new URLSearchParams();

    if (currentCompanyId.value) {
      query.set("company", String(currentCompanyId.value));
    }

    const url = query.toString()
      ? `${ENDPOINTS.catalogs}?${query.toString()}`
      : ENDPOINTS.catalogs;

    const response = await methodsHttp.getApi(url);

    if (!response?.ok) {
      Object.assign(catalogs, createEmptyCatalogs());

      catalogsError.value =
        response?.mensaje ||
        "No se pudieron cargar las opciones de desvinculación.";

      return;
    }

    const data =
      response?.data?.catalogs ||
      response?.catalogs ||
      response?.data ||
      {};

    Object.assign(catalogs, createEmptyCatalogs(), data);

    filteredTerminationTypeOptions.value = [
      ...terminationTypeOptions.value,
    ];
  } catch (error) {
    console.error("loadCatalogs error:", error);

    Object.assign(catalogs, createEmptyCatalogs());

    catalogsError.value =
      error?.response?.data?.mensaje ||
      error?.response?.data?.message ||
      "Error cargando los catálogos de desvinculación.";
  } finally {
    catalogsLoading.value = false;
  }
};

const loadTerminations = async () => {
  loading.value = true;

  try {
    const response = await methodsHttp.getApi(
      `${ENDPOINTS.list}?${buildQueryString()}`,
    );

    if (!response?.ok) {
      rows.value = [];
      pagination.value.rowsNumber = 0;

      resetSummary();

      Notify.create({
        type: "negative",
        message:
          response?.mensaje ||
          "No se pudieron cargar las desvinculaciones.",
      });

      return;
    }

    const result = extractListResponse(response);

    rows.value = result.items;

    pagination.value.rowsNumber = result.pagination.total;
    pagination.value.page = result.pagination.page;
    pagination.value.rowsPerPage = result.pagination.limit;

    summary.total = Number(result.summary.total || 0);
    summary.totalNet = Number(result.summary.totalNet || 0);
    summary.byStatus = result.summary.byStatus || {};
  } catch (error) {
    console.error("loadTerminations error:", error);

    rows.value = [];
    pagination.value.rowsNumber = 0;

    resetSummary();

    Notify.create({
      type: "negative",
      message:
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        "Error cargando las desvinculaciones.",
    });
  } finally {
    loading.value = false;
  }
};

const resetSummary = () => {
  summary.total = 0;
  summary.totalNet = 0;
  summary.byStatus = {};
};

const buildQueryString = () => {
  const query = new URLSearchParams();

  query.set("page", String(pagination.value.page));
  query.set("limit", String(pagination.value.rowsPerPage));
  query.set("sortBy", String(pagination.value.sortBy || "createdAt"));
  query.set(
    "descending",
    pagination.value.descending ? "true" : "false",
  );

  if (currentCompanyId.value) {
    query.set("company", String(currentCompanyId.value));
  }

  if (filters.search) {
    query.set("search", String(filters.search).trim());
  }

  if (filters.status) {
    query.set("status", String(filters.status));
  }

  if (filters.terminationType) {
    query.set("terminationType", String(filters.terminationType));
  }

  if (
    filters.hasLoans !== null &&
    filters.hasLoans !== undefined
  ) {
    query.set("hasLoans", filters.hasLoans ? "true" : "false");
  }

  if (filters.dateFrom) {
    query.set("from", filters.dateFrom);
  }

  if (filters.dateTo) {
    query.set("to", filters.dateTo);
  }

  if (Number(filters.minimumNet || 0) > 0) {
    query.set("minimumNet", String(Number(filters.minimumNet)));
  }

  return query.toString();
};

const extractListResponse = (response) => {
  const data = response?.data || {};

  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : Array.isArray(response?.items)
        ? response.items
        : [];

  const paginationData = data?.pagination || {};

  return {
    items,
    pagination: {
      total: Number(
        paginationData.total ??
          data.total ??
          response.total ??
          items.length,
      ),

      page: Number(
        paginationData.page ??
          data.page ??
          pagination.value.page,
      ),

      limit: Number(
        paginationData.limit ??
          data.limit ??
          pagination.value.rowsPerPage,
      ),

      pages: Number(
        paginationData.pages ??
          data.pages ??
          1,
      ),
    },

    summary:
      data?.summary ||
      response?.summary || {
        total: items.length,
        totalNet: items.reduce(
          (total, item) => total + getNetTotal(item),
          0,
        ),
        byStatus: {},
      },
  };
};

const onRequest = (requestProps) => {
  pagination.value = {
    ...pagination.value,
    ...requestProps.pagination,
  };

  loadTerminations();
};

const applyFilters = () => {
  pagination.value.page = 1;
  loadTerminations();
};

const resetFilters = () => {
  filters.search = "";
  filters.status = null;
  filters.terminationType = null;
  filters.hasLoans = null;
  filters.dateFrom = "";
  filters.dateTo = "";
  filters.minimumNet = null;

  pagination.value.page = 1;

  loadTerminations();
};

const clearSearch = () => {
  filters.search = "";
  pagination.value.page = 1;
  loadTerminations();
};

const filterTerminationTypes = (value, update) => {
  update(() => {
    const search = String(value || "")
      .trim()
      .toLowerCase();

    if (!search) {
      filteredTerminationTypeOptions.value = [
        ...terminationTypeOptions.value,
      ];

      return;
    }

    filteredTerminationTypeOptions.value =
      terminationTypeOptions.value.filter((item) => {
        return (
          String(item.label || "")
            .toLowerCase()
            .includes(search) ||
          String(item.value || "")
            .toLowerCase()
            .includes(search)
        );
      });
  });
};

const openDetail = (termination) => {
  selectedTermination.value = termination;
  detailDialogOpen.value = true;
};

const handleTerminationUpdated = () => {
  detailDialogOpen.value = false;
  selectedTermination.value = null;

  loadTerminations();
};

const getStatusConfig = (status) => {
  const code = String(status || "").toUpperCase();

  const found = (catalogs.statuses || []).find(
    (item) => String(item.value).toUpperCase() === code,
  );

  return (
    found || {
      value: code,
      label: humanizeCode(code || "UNKNOWN"),
      color: "grey-9",
      background: "grey-3",
      icon: "help",
      actions: [],
      primaryAction: null,
    }
  );
};

const getPrimaryAction = (row) => {
  const status = getStatusConfig(row?.status);
  const actionCode = status?.primaryAction;

  if (!actionCode) {
    return null;
  }

  return (
    (catalogs.actions || []).find(
      (item) => item.code === actionCode,
    ) || null
  );
};

const getEmployeeData = (row) => {
  return row?.employeeSnapshot || row?.employee || row?.user || {};
};

const getEmployeeName = (row) => {
  const employee = getEmployeeData(row);

  return (
    employee?.fullName ||
    employee?.name ||
    row?.employeeName ||
    "Empleado sin nombre"
  );
};

const getEmployeeEmail = (row) => {
  return getEmployeeData(row)?.email || "Sin correo";
};

const getEmployeeCode = (row) => {
  return getEmployeeData(row)?.code || "";
};

const getEmployeeImage = (row) => {
  const employee = getEmployeeData(row);

  return employee?.img || employee?.image || "";
};

const getTerminationTypeLabel = (row) => {
  const snapshotLabel =
    row?.terminationTypeLabel ||
    row?.terminationTypeRuleSnapshot?.label;

  if (snapshotLabel) {
    return snapshotLabel;
  }

  const found = (catalogs.terminationTypes || []).find(
    (item) => item.value === row?.terminationType,
  );

  return (
    found?.label ||
    humanizeCode(row?.terminationType) ||
    "Sin tipo"
  );
};

const getTerminationNumber = (row) => {
  return (
    row?.terminationNumber ||
    row?.code ||
    getShortId(row?._id)
  );
};

const getTotalIncome = (row) => {
  return Number(
    row?.calculation?.totalIncome ??
      row?.calculation?.grossTotal ??
      0,
  );
};

const getNetTotal = (row) => {
  return Number(
    row?.calculation?.netTotal ??
      row?.netTotal ??
      0,
  );
};

const getLoanDeduction = (row) => {
  if (Number(row?.loanSnapshot?.totalDeducted || 0) > 0) {
    return Number(row.loanSnapshot.totalDeducted);
  }

  const loanLine = (row?.calculation?.lines || []).find(
    (line) => line.code === "EMPLOYEE_LOAN",
  );

  return Number(loanLine?.amount || 0);
};

const getLoanRemaining = (row) => {
  return Number(
    row?.loanSnapshot?.remainingOutstanding || 0,
  );
};

const getShortId = (value) => {
  const id = String(value || "");

  return id ? `#${id.slice(-8).toUpperCase()}` : "N/A";
};

const getInitials = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "U";
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const humanizeCode = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (item) =>
        item.charAt(0).toUpperCase() + item.slice(1),
    )
    .join(" ");
};

const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const money = (value) => {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};
</script>

<style scoped>
.termination-page {
  min-height: 100%;
}

.page-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.policy-banner {
  border-radius: 18px;
}

.summary-card {
  height: 100%;
  padding: 16px;
  border-radius: 20px;
  background: #ffffff;
}

.summary-card-content {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
}

.summary-card-info {
  min-width: 0;
  overflow: hidden;
}

.summary-card-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-card-value {
  margin-top: 6px;
  font-size: clamp(1.05rem, 2vw, 1.3rem);
  font-weight: 950;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.filters-card,
.table-card {
  padding: 18px;
  border-radius: 22px;
  background: #ffffff;
}

.filters-header,
.table-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.section-title {
  color: #0f172a;
  font-size: 0.98rem;
  font-weight: 900;
}

.section-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}

.field-label {
  margin-bottom: 6px;
  color: #334155;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-button {
  min-height: 40px;
}

.termination-table {
  margin-top: 14px;
  border-radius: 16px;
  overflow: hidden;
}

.termination-number {
  color: #0f172a;
  font-weight: 900;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.employee-avatar {
  flex: 0 0 auto;
  color: white;
  font-weight: 900;
  background: linear-gradient(135deg, #1a2436, #1964a2);
}

.employee-cell-info {
  min-width: 0;
}

.employee-cell-name {
  max-width: 210px;
  color: #0f172a;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.amount-positive {
  color: #16803c;
  font-weight: 900;
}

.amount-negative {
  color: #d32f2f;
  font-weight: 900;
}

.net-total-cell {
  color: #0f172a;
  font-size: 0.98rem;
  font-weight: 950;
}

.empty-state {
  min-height: 300px;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  padding: 40px;
}

.empty-title {
  margin-top: 10px;
  color: #334155;
  font-size: 1rem;
  font-weight: 900;
}

.empty-subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.82rem;
}

.mobile-termination-card {
  border-radius: 18px;
}

.mobile-detail-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 9px;
  color: #64748b;
  font-size: 0.82rem;
}

.mobile-detail-row strong {
  color: #0f172a;
  text-align: right;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 24px;
}

:deep(.q-table th) {
  color: #475569;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #f8fafc;
}

:deep(.q-table tbody td) {
  height: 68px;
}

@media (max-width: 768px) {
  .page-container {
    padding: 0;
  }

  .filters-header,
  .table-card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .filters-card,
  .table-card {
    padding: 14px;
    border-radius: 18px;
  }
}
</style>
