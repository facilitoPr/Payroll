<template>
  <div class="q-pa-md promotions-page">
    <PageHeaderCard
      title="Promociones y publicidad"
      subtitle="Administra los anuncios dinámicos que se muestran en el hero del landing y otras ubicaciones."
      icon="campaign"
      class="q-mb-md"
    >
      <template #actions>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Nueva promoción"
          class="header-action"
          @click="openCreateDialog"
        />
      </template>
    </PageHeaderCard>

    <q-card flat bordered class="filters-card q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-4">
            <q-input
              rounded
              v-model="filters.search"
              outlined
              dense
              clearable
              label="Buscar promoción"
              @keyup.enter="loadPromotions"
            >
              <template #prepend>
                <q-icon name="search" color="primary" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-2">
            <q-select
              rounded
              v-model="filters.status"
              outlined
              dense
              clearable
              emit-value
              map-options
              label="Estado"
              :options="statusOptions"
            />
          </div>

          <div class="col-12 col-md-2">
            <q-select
              rounded
              v-model="filters.audience"
              outlined
              dense
              clearable
              emit-value
              map-options
              label="Audiencia"
              :options="audienceOptions"
            />
          </div>

          <div class="col-12 col-md-2">
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="search"
              label="Buscar"
              class="full-width action-btn"
              :loading="loading"
              @click="loadPromotions"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="table-card">
  <q-table
    flat
    :rows="promotions"
    :columns="columns"
    row-key="_id"
    :loading="loading"
    v-model:pagination="tablePagination"
    :rows-per-page-options="[10, 20, 50, 100]"
    class="modern-table"
    no-data-label="No hay promociones registradas"
    no-results-label="No se encontraron promociones"
    @request="onRequest"
  >
    <template #body-cell-preview="props">
      <q-td :props="props">
        <div
          class="promo-preview"
          :style="{
            background:
              props.row?.style?.background ||
              'linear-gradient(135deg, #1a2436, #1964a2)',
          }"
        >
          <q-img
            v-if="getPreviewImage(props.row)"
            :src="getPreviewImage(props.row)"
            class="promo-preview-img"
            fit="cover"
          />

          <q-icon v-else name="campaign" size="30px" color="white" />
        </div>
      </q-td>
    </template>

    <template #body-cell-promotion="props">
      <q-td :props="props">
        <div class="promotion-main-cell">
          <div class="text-weight-bold text-dark promotion-title">
            {{ props.row.title || "Sin título" }}
          </div>

          <div class="text-caption text-grey-7 promotion-subtitle">
            {{ props.row.subtitle || props.row.description || "Sin descripción" }}
          </div>

          <div class="row items-center q-gutter-xs q-mt-xs">
            <q-badge
              v-if="props.row.badge"
              outline
              color="primary"
              class="soft-badge"
              :label="props.row.badge"
            />

            <q-badge
              v-if="props.row.code"
              outline
              color="grey-7"
              class="soft-badge"
              :label="props.row.code"
            />
          </div>
        </div>
      </q-td>
    </template>

    <template #body-cell-company="props">
      <q-td :props="props">
        <div v-if="props.row.company" class="company-cell">
          <q-avatar size="34px" text-color="white">
            <q-img
              v-if="props.row.company.logo || props.row.company.logoUrl"
              :src="props.row.company.logo || props.row.company.logoUrl"
            />
            <q-icon v-else name="business" />
          </q-avatar>

          <div>
            <div class="text-body2 text-weight-bold">
              {{ getCompanyName(props.row.company) }}
            </div>
          </div>
        </div>

        <q-badge v-else outline color="grey-7" label="Global" />
      </q-td>
    </template>

    <template #body-cell-publication="props">
      <q-td :props="props">
        <div class="column q-gutter-xs">
          <q-chip
            dense
            square
            color="primary"
            text-color="white"
            icon="ads_click"
            class="info-chip"
          >
            {{ getAudienceLabel(props.row.audience) }}
          </q-chip>
        </div>
      </q-td>
    </template>

    <template #body-cell-period="props">
      <q-td :props="props">
        <div class="period-cell">
          <q-icon name="event" size="18px" color="primary" />
          <div>
            <div class="text-body2 text-weight-medium">
              {{ getDateRangeLabel(props.row) }}
            </div>
            <div class="text-caption text-grey-7">
              {{ isPromotionActive(props.row) ? "Dentro de vigencia" : "Fuera de vigencia" }}
            </div>
          </div>
        </div>
      </q-td>
    </template>

    <template #body-cell-status="props">
      <q-td :props="props" class="text-center">
        <div class="column items-center q-gutter-xs">
          <q-badge
            rounded
            :color="getStatusColor(props.row.status)"
            :label="getStatusLabel(props.row.status)"
            class="status-badge"
          />

          <q-badge
            rounded
            :color="props.row.isActive ? 'positive' : 'grey-7'"
            :label="props.row.isActive ? 'ACTIVA' : 'INACTIVA'"
            class="status-badge"
          />
        </div>
      </q-td>
    </template>

    <template #body-cell-order="props">
      <q-td :props="props" class="text-center">
        <q-chip
          dense
          color="primary"
          text-color="white"
          icon="sort"
          class="rounded-chip"
        >
          {{ props.row.order || 0 }}
        </q-chip>
      </q-td>
    </template>

    <template #body-cell-metrics="props">
      <q-td :props="props">
        <div class="metrics-cell">
          <div class="metric-item">
            <q-icon name="visibility" size="17px" />
            <span>{{ props.row.metrics?.views || 0 }}</span>
          </div>

          <div class="metric-item">
            <q-icon name="ads_click" size="17px" />
            <span>{{ props.row.metrics?.clicks || 0 }}</span>
          </div>
        </div>
      </q-td>
    </template>

    <template #body-cell-cta="props">
      <q-td :props="props">
        <div class="text-body2 text-weight-medium">
          {{ props.row.cta?.label || "Sin botón" }}
        </div>
        <div class="text-caption text-grey-7">
          {{ getCtaLabel(props.row.cta?.action) }}
        </div>
      </q-td>
    </template>

    <template #body-cell-actions="props">
      <q-td :props="props" class="text-center">
        <div class="row justify-center q-gutter-xs no-wrap">
          <q-btn
            flat
            round
            dense
            color="primary"
            icon="edit"
            class="table-action-btn"
            @click="openEditDialog(props.row)"
          >
            <q-tooltip>Editar</q-tooltip>
          </q-btn>

          <q-btn
            v-if="props.row.status !== 'PUBLISHED'"
            flat
            round
            dense
            color="positive"
            icon="publish"
            class="table-action-btn"
            @click="publishPromotion(props.row)"
          >
            <q-tooltip>Publicar</q-tooltip>
          </q-btn>

          <q-btn
            v-if="props.row.status !== 'ARCHIVED'"
            flat
            round
            dense
            color="warning"
            icon="archive"
            class="table-action-btn"
            @click="archivePromotion(props.row)"
          >
            <q-tooltip>Archivar</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            color="negative"
            icon="delete"
            class="table-action-btn"
            @click="confirmDeletePromotion(props.row)"
          >
            <q-tooltip>Eliminar</q-tooltip>
          </q-btn>
        </div>
      </q-td>
    </template>

    <template #no-data>
      <div class="empty-state">
        <q-icon name="campaign" size="52px" />
        <div class="empty-title">No hay promociones registradas</div>
        <div class="empty-subtitle">
          Crea promociones para mostrar anuncios dinámicos en el landing.
        </div>
      </div>
    </template>
  </q-table>
</q-card>

    <PromotionAdFormDialog
      v-model="promotionDialog.open"
      :promotion="promotionDialog.promotion"
      :companies="companies"
      :loading="saving"
      @save="savePromotion"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import PromotionAdFormDialog from "src/components/promotions/PromotionAdFormDialog.vue";
import PageHeaderCard from "src/components/PageHeaderCard.vue";

const $q = useQuasar();

const loading = ref(false);
const saving = ref(false);

const promotions = ref([]);
const companies = ref([]);

const filters = ref({
  search: "",
  placement: "LANDING_HERO",
  status: null,
  audience: null,
});

const tablePagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

const promotionDialog = ref({
  open: false,
  promotion: null,
});

const placementOptions = [
  { label: "Hero landing", value: "LANDING_HERO" },
  { label: "Sección landing", value: "LANDING_SECTION" },
  { label: "Login", value: "LOGIN" },
  { label: "Dashboard portal", value: "PORTAL_DASHBOARD" },
];

const statusOptions = [
  { label: "Borrador", value: "DRAFT" },
  { label: "Publicado", value: "PUBLISHED" },
  { label: "Archivado", value: "ARCHIVED" },
];

const audienceOptions = [
  { label: "Público", value: "PUBLIC" },
  { label: "Autenticados", value: "AUTHENTICATED" },
  { label: "Admin", value: "ADMIN" },
  { label: "Employee", value: "EMPLOYEE" },
  { label: "Todos", value: "ALL" },
];

const columns = [
  {
    name: "actions",
    label: "Acciones",
    field: "actions",
    align: "center",
  },
  {
    name: "preview",
    label: "Preview",
    field: "media",
    align: "left",
  },
  {
    name: "promotion",
    label: "Promoción",
    field: "title",
    align: "left",
    sortable: true,
  },
  {
    name: "company",
    label: "Empresa",
    field: "company",
    align: "left",
  },
  {
    name: "publication",
    label: "Publicación",
    field: "audience",
    align: "left",
  },
  {
    name: "period",
    label: "Vigencia",
    field: "startsAt",
    align: "left",
  },
  {
    name: "status",
    label: "Estado",
    field: "status",
    align: "center",
    sortable: true,
  },
  {
    name: "order",
    label: "Orden",
    field: "order",
    align: "center",
    sortable: true,
  },
  {
    name: "metrics",
    label: "Métricas",
    field: "metrics",
    align: "center",
  },
  {
    name: "cta",
    label: "Botón",
    field: "cta",
    align: "left",
  },
];

onMounted(async () => {
  await Promise.all([loadPromotions(), loadCompanies()]);
});

function buildQuery() {
  const params = new URLSearchParams();

  params.set("page", String(tablePagination.value.page || 1));
  params.set("limit", String(tablePagination.value.rowsPerPage || 20));

  if (filters.value.search) params.set("search", filters.value.search);
  if (filters.value.placement) params.set("placement", filters.value.placement);
  if (filters.value.status) params.set("status", filters.value.status);
  if (filters.value.audience) params.set("audience", filters.value.audience);

  return params.toString();
}

async function loadPromotions() {
  try {
    loading.value = true;

    const resp = await methodsHttp.getApi(`promotion-ads?${buildQuery()}`);

    if (resp.ok) {
      promotions.value = resp.promotions || [];

      tablePagination.value = {
        page: resp.pagination?.page || 1,
        rowsPerPage: resp.pagination?.limit || 20,
        rowsNumber: resp.pagination?.total || 0,
      };
    }
  } catch (error) {
    console.error(error);
    $q.notify({
      type: "negative",
      message: "No se pudieron cargar las promociones.",
    });
  } finally {
    loading.value = false;
  }
}

async function loadCompanies() {
  try {
    const resp = await methodsHttp.getApi("company?limit=100");

    if (resp.ok) {
      companies.value = resp.companies || [];
    }
  } catch (error) {
    console.error(error);
  }
}

function onRequest(props) {
  tablePagination.value = props.pagination;
  loadPromotions();
}

function openCreateDialog() {
  promotionDialog.value = {
    open: true,
    promotion: null,
  };
}

function openEditDialog(promotion) {
  promotionDialog.value = {
    open: true,
    promotion,
  };
}

async function savePromotion(payload) {
  try {
    saving.value = true;

    const promotionId =
      payload instanceof FormData ? payload.get("_id") : payload?._id;

    const isEdit = Boolean(promotionId);

    const resp = isEdit
      ? await methodsHttp.putApi(`promotion-ads/${promotionId}`, payload)
      : await methodsHttp.postApi("promotion-ads", payload);

    if (resp.ok) {
      $q.notify({
        type: "positive",
        message: resp.mensaje || "Promoción guardada correctamente.",
      });

      promotionDialog.value.open = false;
      await loadPromotions();
    } else {
      $q.notify({
        type: "negative",
        message: resp.mensaje || "No se pudo guardar la promoción.",
      });
    }
  } catch (error) {
    console.error(error);
    $q.notify({
      type: "negative",
      message: "Error al guardar la promoción.",
    });
  } finally {
    saving.value = false;
  }
}

async function publishPromotion(row) {
  try {
    const resp = await methodsHttp.patchApi(
      `promotion-ads/${row._id}/publish`,
      {},
    );

    if (resp.ok) {
      $q.notify({ type: "positive", message: "Promoción publicada." });
      await loadPromotions();
    }
  } catch (error) {
    console.error(error);
  }
}

async function archivePromotion(row) {
  try {
    const resp = await methodsHttp.patchApi(
      `promotion-ads/${row._id}/archive`,
      {},
    );

    if (resp.ok) {
      $q.notify({ type: "positive", message: "Promoción archivada." });
      await loadPromotions();
    }
  } catch (error) {
    console.error(error);
  }
}

function confirmDeletePromotion(row) {
  $q.dialog({
    title: "Eliminar promoción",
    message: `¿Seguro que deseas eliminar "${row.title}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const resp = await methodsHttp.deleteApi(`promotion-ads/${row._id}`);

    if (resp.ok) {
      $q.notify({ type: "positive", message: "Promoción eliminada." });
      await loadPromotions();
    }
  });
}

function getStatusColor(status) {
  const map = {
    DRAFT: "grey-7",
    PUBLISHED: "positive",
    ARCHIVED: "warning",
  };

  return map[status] || "grey-7";
}

function getStatusLabel(status) {
  const map = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicado",
    ARCHIVED: "Archivado",
  };

  return map[status] || status;
}

function getPreviewImage(row) {
  return row?.media?.desktopImage || row?.media?.mobileImage || "";
}

function getCompanyName(company) {
  return company?.tradeName || company?.legalName || company?.name || "Empresa";
}

function getAudienceLabel(audience) {
  const map = {
    PUBLIC: "Público",
    AUTHENTICATED: "Autenticados",
    ADMIN: "Admin",
    EMPLOYEE: "Employee",
    ALL: "Todos",
  };

  return map[audience] || audience || "N/A";
}

function getCtaLabel(action) {
  const map = {
    NONE: "Sin acción",
    URL: "URL externa",
    ROUTE: "Ruta interna",
    LOGIN: "Login",
    SCROLL: "Scroll",
  };

  return map[action] || action || "Sin acción";
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getDateRangeLabel(row) {
  const start = formatDate(row?.startsAt);
  const end = formatDate(row?.endsAt);

  if (start && end) return `${start} - ${end}`;
  if (start) return `Desde ${start}`;
  if (end) return `Hasta ${end}`;

  return "Sin fechas";
}

function isPromotionActive(row) {
  if (!row?.isActive) return false;

  const now = new Date();

  const startsAt = row?.startsAt ? new Date(row.startsAt) : null;
  const endsAt = row?.endsAt ? new Date(row.endsAt) : null;

  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;

  return true;
}
</script>

<style scoped lang="scss">
.header-action,
.action-btn {
  border-radius: 12px;
  font-weight: 700;
}

.filters-card,
.table-card {
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
}

.promo-preview {
  width: 82px;
  height: 52px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  overflow: hidden;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
}

.promo-preview-img {
  width: 100%;
  height: 100%;
}

.empty-state {
  width: 100%;
  min-height: 240px;
  display: grid;
  place-items: center;
  text-align: center;
  color: #64748b;
  padding: 34px;
}

.empty-state .q-icon {
  color: $primary;
  margin-bottom: 10px;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 900;
  color: #0f172a;
}

.empty-subtitle {
  margin-top: 4px;
}

.modern-table :deep(.q-table__top),
.modern-table :deep(.q-table__bottom) {
  padding-left: 16px;
  padding-right: 16px;
}

.modern-table :deep(th) {
  color: #374151;
  background: #f8fafc;
}

.modern-table :deep(td) {
  vertical-align: middle;
}

.promo-preview {
  width: 88px;
  height: 58px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  overflow: hidden;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.promo-preview-img {
  width: 100%;
  height: 100%;
}

.promotion-main-cell {
  min-width: 240px;
  max-width: 360px;
}

.promotion-title {
  max-width: 340px;
  line-height: 1.2;
}

.promotion-subtitle {
  max-width: 340px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.company-cell {
  min-width: 190px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.period-cell {
  min-width: 190px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.metrics-cell {
  min-width: 92px;
  display: grid;
  gap: 4px;
}

.metric-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 800;
}

.metric-item .q-icon {
  color: var(--q-primary);
}

.status-badge {
  padding: 6px 10px;
  font-weight: 800;
}

.rounded-chip,
.info-chip,
.soft-badge {
  border-radius: 999px;
  font-weight: 800;
}

.info-chip {
  width: fit-content;
}

.table-action-btn {
  border-radius: 12px;
}

.empty-state {
  width: 100%;
  min-height: 240px;
  display: grid;
  place-items: center;
  text-align: center;
  color: #64748b;
  padding: 34px;
}

.empty-state .q-icon {
  color: $primary;
  margin-bottom: 10px;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 900;
  color: #0f172a;
}

.empty-subtitle {
  margin-top: 4px;
}
</style>
