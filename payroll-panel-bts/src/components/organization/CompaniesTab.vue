<template>
  <div class="companies-tab">
    <q-card flat bordered class="section-card q-mb-md">
      <div class="companies-header">
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="row items-center q-gutter-sm">
              <q-avatar color="primary" text-color="white" icon="business" />

              <div>
                <div class="text-subtitle1 text-weight-bold">Compañías</div>
                <div class="text-caption text-grey-7">
                  Administra empresas, datos fiscales, contacto, banco,
                  configuración visual y perfil público.
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-auto">
            <div class="row q-gutter-sm justify-end">
              <q-btn
                unelevated
                rounded
                color="primary"
                icon="add"
                label="Agregar compañía"
                class="action-btn"
                @click="openCreate"
              />
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              emit-value
              map-options
              outlined
              dense
              color="primary"
              label="Estado"
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="filter_alt" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md">
            <q-input
              v-model="search"
              outlined
              dense
              clearable
              debounce="300"
              color="primary"
              placeholder="Buscar por compañía, RNC, banco, teléfono o email..."
              class="rounded-input"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>

        <div class="row items-center justify-between q-mt-md">
          <div class="text-caption text-grey-7">
            Los filtros se aplican sobre las compañías cargadas.
          </div>

          <q-chip dense color="primary" text-color="white" class="summary-chip">
            Total: {{ filteredRows.length }}
          </q-chip>
        </div>
      </div>
    </q-card>

    <q-card flat bordered class="table-card">
      <q-table
        :rows="filteredRows"
        :columns="columns"
        row-key="_id"
        flat
        :loading="loading"
        :pagination="{ rowsPerPage: 10 }"
        no-data-label="No hay compañías registradas"
        no-results-label="No se encontraron compañías"
        class="modern-table"
      >
        <template #body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <div class="row justify-center q-gutter-xs no-wrap">
              <q-btn
                flat
                round
                dense
                icon="visibility"
                color="primary"
                class="table-action-btn"
                @click="openDetail(props.row)"
              >
                <q-tooltip>Detalle</q-tooltip>
              </q-btn>

              <q-btn
                flat
                round
                dense
                icon="edit"
                color="primary"
                class="table-action-btn"
                @click="openEdit(props.row)"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>

              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                class="table-action-btn"
                @click="openDeleteConfirm(props.row)"
              >
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <template #body-cell-company="props">
          <q-td :props="props">
            <div class="row items-center no-wrap q-gutter-sm">
              <q-avatar
                size="42px"
                text-color="white"
                :icon="getCompanyLogo(props.row) ? undefined : 'business'"
              >
                <img
                  v-if="getCompanyLogo(props.row)"
                  :src="getCompanyLogo(props.row)"
                />
              </q-avatar>

              <div>
                <div class="text-weight-medium">
                  {{ getCompanyName(props.row) }}
                </div>

                <div class="text-caption text-grey-7">
                  {{ props.row.code || "Sin código" }}
                  <span v-if="props.row.isDefault"> · Principal</span>
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-contact="props">
          <q-td :props="props">
            <div class="text-body2">
              {{ props.row.email || "Sin email" }}
            </div>
            <div class="text-caption text-grey-7">
              {{ props.row.phone || "Sin teléfono" }}
            </div>
          </q-td>
        </template>

        <template #body-cell-bank="props">
          <q-td :props="props">
            <div class="text-body2">
              {{ props.row.banking?.originBankName || "Sin banco" }}
            </div>
            <div class="text-caption text-grey-7">
              Cuenta:
              {{ props.row.banking?.originAccountNumber || "N/A" }}
            </div>
          </q-td>
        </template>

        <template #body-cell-location="props">
          <q-td :props="props">
            <div class="location-cell">
              {{ getCompanyLocation(props.row) }}
            </div>
          </q-td>
        </template>

        <template #body-cell-publicProfile="props">
          <q-td :props="props" class="text-center">
            <q-chip
              dense
              :color="props.row.showInPublicLanding !== false ? 'positive' : 'grey'"
              text-color="white"
              :icon="props.row.showInPublicLanding !== false ? 'public' : 'visibility_off'"
              class="rounded-chip"
            >
              {{ props.row.showInPublicLanding !== false ? "Pública" : "Oculta" }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-departments="props">
          <q-td :props="props" class="text-center">
            <q-chip
              dense
              color="primary"
              text-color="white"
              icon="apartment"
              class="rounded-chip"
            >
              {{ getDepartmentsByCompany(props.row._id).length }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props" class="text-center">
            <div class="column items-center q-gutter-xs">
              <q-badge
                rounded
                :color="props.row.isActive ? 'secondary' : 'negative'"
                :label="props.row.isActive ? 'ACTIVA' : 'INACTIVA'"
                class="status-badge"
              />

              <q-badge
                v-if="props.row.isDefault"
                rounded
                color="primary"
                label="PRINCIPAL"
                class="status-badge"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <CompanyFormDialog
      v-model="openFormDialog"
      :is-edit-mode="isEditing"
      :form-data="form"
      :loading="saving"
      @save="saveCompany"
    />

    <CompanyDetailDialog
      v-model="openDetailDialog"
      :company="selected"
      :departments="selectedDepartments"
      :loading-departments="loadingDepartments"
      @create-department="openCreateDepartment"
    />

    <DepartmentFormDialog
      v-model="openDepartmentDialog"
      :is-edit-mode="false"
      :form-data="departmentForm"
      :companies="companyOptions"
      :loading="savingDepartment"
      @save="saveDepartment"
    />

    <OrganizationDeleteDialog
      v-model="openDeleteDialog"
      title="Eliminar compañía"
      icon="business"
      :item-name="selected?.legalName || selected?.tradeName || selected?.code"
      :loading="deleting"
      message="Esta acción hará un soft delete de la compañía seleccionada."
      @confirm="deleteCompany"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";

import CompanyDetailDialog from "./dialogs/company/CompanyDetailDialog.vue";
import OrganizationDeleteDialog from "./dialogs/OrganizationDeleteDialog.vue";
import DepartmentFormDialog from "./dialogs/department/DepartmentFormDialog.vue";
import CompanyFormDialog from "./dialogs/company/CompanyFormDialog.vue";

const emit = defineEmits(["loading"]);

const $q = useQuasar();

const loading = ref(false);
const loadingDepartments = ref(false);
const saving = ref(false);
const deleting = ref(false);
const savingDepartment = ref(false);

const rows = ref([]);
const departments = ref([]);

const search = ref("");
const statusFilter = ref("all");

const openFormDialog = ref(false);
const openDetailDialog = ref(false);
const openDeleteDialog = ref(false);
const openDepartmentDialog = ref(false);

const isEditing = ref(false);
const selected = ref(null);

const form = ref(getEmptyCompanyForm());
const departmentForm = ref(getEmptyDepartmentForm());

const statusOptions = [
  { label: "Todas", value: "all" },
  { label: "Activas", value: "active" },
  { label: "Inactivas", value: "inactive" },
];

const columns = [
  {
    name: "actions",
    label: "Acciones",
    field: "actions",
    align: "center",
  },
  {
    name: "company",
    label: "Compañía",
    field: "legalName",
    align: "left",
    sortable: true,
  },
  {
    name: "contact",
    label: "Contacto",
    field: "email",
    align: "left",
  },
  {
    name: "bank",
    label: "Banco origen",
    field: "banking",
    align: "left",
  },
  {
    name: "location",
    label: "Ubicación",
    field: "address",
    align: "left",
  },
  {
    name: "publicProfile",
    label: "Landing",
    field: "showInPublicLanding",
    align: "center",
  },
  {
    name: "departments",
    label: "Departamentos",
    field: "departments",
    align: "center",
  },
  {
    name: "status",
    label: "Estado",
    field: "isActive",
    align: "center",
    sortable: true,
  },
];

const companyOptions = computed(() =>
  rows.value.map((company) => ({
    ...company,
    label: getCompanyOptionLabel(company),
  })),
);

const filteredRows = computed(() => {
  const term = search.value?.toLowerCase().trim();

  return rows.value
    .filter((item) => item?.isDeleted !== true)
    .filter((item) => {
      if (statusFilter.value === "active") return item.isActive === true;
      if (statusFilter.value === "inactive") return item.isActive === false;
      return true;
    })
    .filter((item) => {
      if (!term) return true;

      const legalName = item.legalName?.toLowerCase() || "";
      const tradeName = item.tradeName?.toLowerCase() || "";
      const code = item.code?.toLowerCase() || "";
      const taxId = item.taxId?.toLowerCase() || "";
      const email = item.email?.toLowerCase() || "";
      const phone = item.phone?.toLowerCase() || "";
      const bankName = item.banking?.originBankName?.toLowerCase() || "";
      const accountNumber =
        item.banking?.originAccountNumber?.toLowerCase() || "";
      const agreementCode =
        item.bankFileConfig?.agreementCode?.toLowerCase() || "";
      const headline = item.publicProfile?.headline?.toLowerCase() || "";
      const mission = item.publicProfile?.mission?.toLowerCase() || "";
      const vision = item.publicProfile?.vision?.toLowerCase() || "";

      return (
        legalName.includes(term) ||
        tradeName.includes(term) ||
        code.includes(term) ||
        taxId.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        bankName.includes(term) ||
        accountNumber.includes(term) ||
        agreementCode.includes(term) ||
        headline.includes(term) ||
        mission.includes(term) ||
        vision.includes(term)
      );
    });
});

const selectedDepartments = computed(() => {
  if (!selected.value?._id) return [];
  return getDepartmentsByCompany(selected.value._id);
});

function getEmptyCompanyForm() {
  return {
    legalName: "",
    tradeName: "",
    taxId: "",
    businessGroupName: "",
    ownerName: "",

    contactName: "",
    email: "",
    phone: "",
    website: "",

    logo: "",
    logoUrl: "",
    logoFile: null,
    removeLogo: false,

    coverUrl: "",
    coverFile: null,
    removeCover: false,

    primaryColor: "#024D48",
    secondaryColor: "#1964A2",

    address: {
      country: "",
      state: "",
      city: "",
      street: "",
      zipCode: "",
      fullAddress: "",
    },

    fiscalInfo: {
      taxRegime: "",
      fiscalAddress: "",
      notes: "",
    },

    settings: {
      timezone: "America/Santo_Domingo",
      currency: "DOP",
      language: "es",
    },

    banking: {
      originBankName: "",
      originBankCode: "",
      originBankDigit: "",
      originAccountType: "1",
      originAccountNumber: "",
      currencyCode: "214",
    },

    bankFileConfig: {
      agreementCode: "",
      serviceCode: "",
      defaultStatementDescription: "NOMINA",
      bankFileLayoutVersion: 1,
      fileEncoding: "utf8",
      lineEnding: "LF",
      defaultPaddingChar: " ",
      lastSequenceDate: "",
      lastSequenceNumber: 0,
    },

    publicProfile: {
      headline: "",
      subtitle: "",
      aboutTitle: "",
      aboutDescription: "",
      aboutSecondDescription: "",
      trajectoryTitle: "",
      trajectoryDescription: "",
      trajectorySecondDescription: "",
      mission: "",
      vision: "",
      valuesDescription: "",
      values: [],
      stats: [],
      images: {
        main: "",
        secondary: "",
        third: "",
        trajectory: "",
        hero: "",
      },
    },

    publicMainFile: null,
    publicSecondaryFile: null,
    publicThirdFile: null,
    publicTrajectoryFile: null,
    publicHeroFile: null,

    removePublicMain: false,
    removePublicSecondary: false,
    removePublicThird: false,
    removePublicTrajectory: false,
    removePublicHero: false,

    showInPublicLanding: true,

    notes: "",

    isDefault: false,
    isActive: true,
  };
}

function getEmptyDepartmentForm() {
  return {
    company: "",
    name: "",
    code: "",
    description: "",
    isActive: true,
  };
}

const normalizeList = (resp, keys = []) => {
  for (const key of keys) {
    if (Array.isArray(resp?.[key])) return resp[key];
  }

  if (Array.isArray(resp?.data)) return resp.data;
  return [];
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id || "";
};

const getCompanyName = (company) => {
  return company?.tradeName || company?.legalName || company?.code || "Compañía";
};

const getCompanyOptionLabel = (company) => {
  const name = getCompanyName(company);
  return company?.code ? `${name} (${company.code})` : name;
};

const getCompanyLogo = (company) => {
  return company?.logo || company?.logoUrl || "";
};

const getCompanyLocation = (company) => {
  const address = company?.address || {};

  if (address.fullAddress) return address.fullAddress;

  const parts = [address.city, address.state, address.country].filter(Boolean);

  return parts.length ? parts.join(", ") : "Sin ubicación";
};

const getDepartmentsByCompany = (companyId) => {
  const id = getId(companyId);

  return departments.value.filter((department) => {
    return getId(department.company) === id;
  });
};

const getCompanies = async () => {
  loading.value = true;
  emit("loading", true);

  try {
    const resp = await methodsHttp.getApi("company");

    if (resp?.ok) {
      rows.value = normalizeList(resp, ["companies", "company", "data"]);
    } else {
      rows.value = [];
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudieron cargar las compañías.",
      });
    }
  } finally {
    loading.value = false;
    emit("loading", false);
  }
};

const getDepartments = async () => {
  loadingDepartments.value = true;

  try {
    const resp = await methodsHttp.getApi("department/admin");

    if (resp?.ok) {
      departments.value = normalizeList(resp, [
        "departments",
        "department",
        "data",
      ]);
    } else {
      departments.value = [];
    }
  } finally {
    loadingDepartments.value = false;
  }
};

const openCreate = () => {
  isEditing.value = false;
  selected.value = null;
  form.value = getEmptyCompanyForm();
  openFormDialog.value = true;
};

const openEdit = (row) => {
  isEditing.value = true;
  selected.value = row;

  const empty = getEmptyCompanyForm();

  form.value = {
    ...empty,
    ...row,

    logo: row.logo || row.logoUrl || "",
    logoUrl: row.logoUrl || row.logo || "",
    logoFile: null,
    removeLogo: false,

    coverUrl: row.coverUrl || "",
    coverFile: null,
    removeCover: false,

    address: {
      ...empty.address,
      ...(row.address || {}),
    },

    fiscalInfo: {
      ...empty.fiscalInfo,
      ...(row.fiscalInfo || {}),
    },

    settings: {
      ...empty.settings,
      ...(row.settings || {}),
    },

    banking: {
      ...empty.banking,
      ...(row.banking || {}),
    },

    bankFileConfig: {
      ...empty.bankFileConfig,
      ...(row.bankFileConfig || {}),
    },

    publicProfile: {
      ...empty.publicProfile,
      ...(row.publicProfile || {}),
      values: Array.isArray(row.publicProfile?.values)
        ? row.publicProfile.values
        : [],
      stats: Array.isArray(row.publicProfile?.stats)
        ? row.publicProfile.stats
        : [],
      images: {
        ...empty.publicProfile.images,
        ...(row.publicProfile?.images || {}),
      },
    },

    publicMainFile: null,
    publicSecondaryFile: null,
    publicThirdFile: null,
    publicTrajectoryFile: null,
    publicHeroFile: null,

    removePublicMain: false,
    removePublicSecondary: false,
    removePublicThird: false,
    removePublicTrajectory: false,
    removePublicHero: false,

    showInPublicLanding: row.showInPublicLanding !== false,
  };

  openFormDialog.value = true;
};

const openDetail = async (row) => {
  selected.value = row;
  openDetailDialog.value = true;

  if (!departments.value.length) {
    await getDepartments();
  }
};

const openDeleteConfirm = (row) => {
  selected.value = row;
  openDeleteDialog.value = true;
};

const openCreateDepartment = () => {
  if (!selected.value?._id) return;

  departmentForm.value = {
    ...getEmptyDepartmentForm(),
    company: selected.value._id,
  };

  openDepartmentDialog.value = true;
};

const buildCompanyFormData = (payload) => {
  const formData = new FormData();

  const appendValue = (key, value) => {
    if (value === undefined || value === null) return;
    formData.append(key, value);
  };

  appendValue("legalName", payload.legalName);
  appendValue("tradeName", payload.tradeName);
  appendValue("taxId", payload.taxId);
  appendValue("businessGroupName", payload.businessGroupName);
  appendValue("ownerName", payload.ownerName);

  appendValue("contactName", payload.contactName);
  appendValue("email", payload.email);
  appendValue("phone", payload.phone);
  appendValue("website", payload.website);

  if (!payload.logoFile) {
    appendValue("logo", payload.logo || payload.logoUrl || "");
    appendValue("logoUrl", payload.logoUrl || payload.logo || "");
  }

  if (!payload.coverFile) {
    appendValue("coverUrl", payload.coverUrl || "");
  }

  appendValue("removeLogo", payload.removeLogo ? "true" : "false");
  appendValue("removeCover", payload.removeCover ? "true" : "false");

  appendValue("primaryColor", payload.primaryColor);
  appendValue("secondaryColor", payload.secondaryColor);

  appendValue("address", JSON.stringify(payload.address || {}));
  appendValue("fiscalInfo", JSON.stringify(payload.fiscalInfo || {}));
  appendValue("settings", JSON.stringify(payload.settings || {}));
  appendValue("banking", JSON.stringify(payload.banking || {}));
  appendValue("bankFileConfig", JSON.stringify(payload.bankFileConfig || {}));
  appendValue("publicProfile", JSON.stringify(payload.publicProfile || {}));

  appendValue("removePublicMain", payload.removePublicMain ? "true" : "false");
  appendValue(
    "removePublicSecondary",
    payload.removePublicSecondary ? "true" : "false",
  );
  appendValue("removePublicThird", payload.removePublicThird ? "true" : "false");
  appendValue(
    "removePublicTrajectory",
    payload.removePublicTrajectory ? "true" : "false",
  );
  appendValue("removePublicHero", payload.removePublicHero ? "true" : "false");

  appendValue(
    "showInPublicLanding",
    payload.showInPublicLanding !== false ? "true" : "false",
  );

  appendValue("notes", payload.notes || "");
  appendValue("isDefault", payload.isDefault ? "true" : "false");
  appendValue("isActive", payload.isActive ? "true" : "false");

  if (payload.logoFile) {
    formData.append("logo", payload.logoFile);
  }

  if (payload.coverFile) {
    formData.append("cover", payload.coverFile);
  }

  if (payload.publicMainFile) {
    formData.append("publicMain", payload.publicMainFile);
  }

  if (payload.publicSecondaryFile) {
    formData.append("publicSecondary", payload.publicSecondaryFile);
  }

  if (payload.publicThirdFile) {
    formData.append("publicThird", payload.publicThirdFile);
  }

  if (payload.publicTrajectoryFile) {
    formData.append("publicTrajectory", payload.publicTrajectoryFile);
  }

  if (payload.publicHeroFile) {
    formData.append("publicHero", payload.publicHeroFile);
  }

  return formData;
};

const saveCompany = async (payload) => {
  saving.value = true;

  try {
    let resp;

    const formData = buildCompanyFormData(payload);

    if (isEditing.value && selected.value?._id) {
      resp = await methodsHttp.putApi(`company/${selected.value._id}`, formData);
    } else {
      resp = await methodsHttp.postApi("company", formData);
    }

    if (!resp?.ok) {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo guardar la compañía.",
      });
      return;
    }

    $q.notify({
      type: "positive",
      message: resp?.mensaje || "Compañía guardada correctamente.",
    });

    openFormDialog.value = false;
    await getCompanies();
  } finally {
    saving.value = false;
  }
};

const deleteCompany = async () => {
  if (!selected.value?._id) return;

  deleting.value = true;

  try {
    const resp = await methodsHttp.deleteApi(`company/${selected.value._id}`);

    if (!resp?.ok) {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo eliminar la compañía.",
      });
      return;
    }

    $q.notify({
      type: "positive",
      message: resp?.mensaje || "Compañía eliminada correctamente.",
    });

    openDeleteDialog.value = false;
    await getCompanies();
  } finally {
    deleting.value = false;
  }
};

const saveDepartment = async (payload) => {
  savingDepartment.value = true;

  try {
    const resp = await methodsHttp.postApi("department", payload);

    if (!resp?.ok) {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo crear el departamento.",
      });
      return;
    }

    $q.notify({
      type: "positive",
      message: resp?.mensaje || "Departamento creado correctamente.",
    });

    openDepartmentDialog.value = false;
    await getDepartments();
  } finally {
    savingDepartment.value = false;
  }
};

const reload = async () => {
  await Promise.all([getCompanies(), getDepartments()]);
};

onMounted(async () => {
  await reload();
});

defineExpose({
  reload,
});
</script>

<style scoped>
.companies-tab {
  width: 100%;
}

.section-card,
.table-card {
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.section-card {
  padding: 18px;
}

.table-card {
  overflow: hidden;
}

.action-btn {
  min-height: 40px;
  font-weight: 600;
  text-transform: none;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
}

.modern-table :deep(.q-table__top),
.modern-table :deep(.q-table__bottom) {
  padding-left: 16px;
  padding-right: 16px;
}

.modern-table :deep(th) {
  font-weight: 700;
  color: #374151;
  background: #f8fafc;
}

.modern-table :deep(td) {
  vertical-align: middle;
}

.table-action-btn {
  border-radius: 12px;
}

.status-badge {
  padding: 6px 10px;
  font-weight: 700;
}

.rounded-chip {
  border-radius: 999px;
}

.location-cell {
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.companies-header {
  width: 100%;
}

.summary-chip {
  border-radius: 999px;
}
</style>