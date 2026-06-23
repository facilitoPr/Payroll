<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="company-detail-dialog">
      <q-card-section class="dialog-header row items-start justify-between">
        <div class="row items-center q-gutter-sm">
          <q-avatar color="white" text-color="primary" icon="business" />

          <div>
            <div class="text-h6 text-weight-bold">Detalle de la compañía</div>
            <div class="text-caption text-blue-1">
              {{ companyName }}
              <span v-if="company?.code"> — {{ company.code }}</span>
            </div>
          </div>
        </div>

        <q-btn flat round dense icon="close" color="white" @click="close" />
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-tabs
          v-model="tab"
          dense
          align="left"
          class="text-primary detail-tabs"
          active-color="primary"
          indicator-color="primary"
          narrow-indicator
        >
          <q-tab name="summary" icon="dashboard" label="Resumen" />
          <q-tab name="publicProfile" icon="public" label="Perfil público" />
          <q-tab name="banking" icon="account_balance" label="Banco" />
          <q-tab name="bankFile" icon="description" label="Archivo" />
          <q-tab name="departments" icon="apartment" label="Departamentos" />
          <q-tab name="notes" icon="notes" label="Notas" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated class="detail-panels">
          <q-tab-panel name="summary">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-card flat bordered class="summary-card">
                  <q-avatar color="primary" text-color="white" icon="business" />
                  <div>
                    <div class="text-caption text-grey-7">Nombre legal</div>
                    <div class="text-subtitle2 text-weight-bold">
                      {{ company?.legalName || "N/A" }}
                    </div>
                  </div>
                </q-card>
              </div>

              <div class="col-12 col-md-4">
                <q-card flat bordered class="summary-card">
                  <q-avatar
                    color="secondary"
                    text-color="white"
                    icon="apartment"
                  />
                  <div>
                    <div class="text-caption text-grey-7">Departamentos</div>
                    <div class="text-subtitle2 text-weight-bold">
                      {{ departments.length }}
                    </div>
                  </div>
                </q-card>
              </div>

              <div class="col-12 col-md-4">
                <q-card flat bordered class="summary-card">
                  <q-avatar color="primary" text-color="white" icon="mail" />
                  <div>
                    <div class="text-caption text-grey-7">Email</div>
                    <div class="text-subtitle2 text-weight-bold">
                      {{ company?.email || "Sin email" }}
                    </div>
                  </div>
                </q-card>
              </div>

              <div class="col-12">
                <q-card flat bordered class="info-card">
                  <div class="row q-col-gutter-md">
                    <InfoItem
                      label="Nombre comercial"
                      :value="company?.tradeName"
                    />
                    <InfoItem label="RNC / Tax ID" :value="company?.taxId" />
                    <InfoItem
                      label="Grupo empresarial"
                      :value="company?.businessGroupName"
                    />
                    <InfoItem label="Propietario" :value="company?.ownerName" />
                    <InfoItem label="Contacto" :value="company?.contactName" />
                    <InfoItem label="Teléfono" :value="company?.phone" />
                    <InfoItem label="Website" :value="company?.website" />
                    <InfoItem
                      label="Dirección"
                      :value="addressLabel"
                      class="col-12"
                    />

                    <div class="col-12">
                      <q-separator class="q-my-md" />
                      <div class="text-subtitle2 text-weight-bold q-mb-sm">
                        Configuración general
                      </div>
                    </div>

                    <InfoItem
                      label="Zona horaria"
                      :value="company?.settings?.timezone"
                    />
                    <InfoItem
                      label="Moneda sistema"
                      :value="company?.settings?.currency"
                    />
                    <InfoItem
                      label="Idioma"
                      :value="company?.settings?.language"
                    />

                    <div class="col-12">
                      <q-separator class="q-my-md" />
                      <div class="text-subtitle2 text-weight-bold q-mb-sm">
                        Información fiscal
                      </div>
                    </div>

                    <InfoItem
                      label="Régimen fiscal"
                      :value="company?.fiscalInfo?.taxRegime"
                    />
                    <InfoItem
                      label="Dirección fiscal"
                      :value="company?.fiscalInfo?.fiscalAddress"
                    />
                    <InfoItem
                      label="Notas fiscales"
                      :value="company?.fiscalInfo?.notes"
                      class="col-12"
                    />
                  </div>
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="publicProfile">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-card flat bordered class="info-card">
                  <div class="row items-center justify-between q-mb-md">
                    <div>
                      <div class="text-subtitle2 text-weight-bold">
                        Perfil público / Landing
                      </div>
                      <div class="text-caption text-grey-7">
                        Información utilizada en la landing pública de la empresa.
                      </div>
                    </div>

                    <q-badge
                      rounded
                      :color="company?.showInPublicLanding !== false ? 'positive' : 'grey'"
                      :label="
                        company?.showInPublicLanding !== false
                          ? 'Visible en landing'
                          : 'Oculta en landing'
                      "
                    />
                  </div>

                  <div class="row q-col-gutter-md">
                    <InfoItem label="Headline" :value="publicProfile.headline" />
                    <InfoItem label="Subtítulo" :value="publicProfile.subtitle" />
                    <InfoItem
                      label="Título Nuestra Familia"
                      :value="publicProfile.aboutTitle"
                    />
                    <InfoItem
                      label="Descripción principal"
                      :value="publicProfile.aboutDescription"
                      class="col-12"
                    />
                    <InfoItem
                      label="Descripción secundaria"
                      :value="publicProfile.aboutSecondDescription"
                      class="col-12"
                    />
                    <InfoItem
                      label="Título trayectoria"
                      :value="publicProfile.trajectoryTitle"
                    />
                    <InfoItem
                      label="Descripción trayectoria"
                      :value="publicProfile.trajectoryDescription"
                      class="col-12"
                    />
                    <InfoItem
                      label="Descripción trayectoria secundaria"
                      :value="publicProfile.trajectorySecondDescription"
                      class="col-12"
                    />
                    <InfoItem
                      label="Misión"
                      :value="publicProfile.mission"
                      class="col-12"
                    />
                    <InfoItem
                      label="Visión"
                      :value="publicProfile.vision"
                      class="col-12"
                    />
                    <InfoItem
                      label="Descripción de valores"
                      :value="publicProfile.valuesDescription"
                      class="col-12"
                    />
                  </div>
                </q-card>
              </div>

              <div class="col-12 col-md-6">
                <q-card flat bordered class="info-card">
                  <div class="text-subtitle2 text-weight-bold q-mb-md">
                    Valores
                  </div>

                  <div v-if="profileValues.length" class="column q-gutter-sm">
                    <q-card
                      v-for="(item, index) in profileValues"
                      :key="`${item.title}-${index}`"
                      flat
                      bordered
                      class="mini-profile-card"
                    >
                      <div class="row items-start no-wrap q-gutter-sm">
                        <q-avatar
                          color="primary"
                          text-color="white"
                          :icon="item.icon || 'check_circle'"
                        />

                        <div>
                          <div class="text-body2 text-weight-bold">
                            {{ item.title || "Sin título" }}
                          </div>
                          <div class="text-caption text-grey-7">
                            {{ item.description || "Sin descripción" }}
                          </div>
                        </div>
                      </div>
                    </q-card>
                  </div>

                  <div v-else class="text-body2 text-grey-7">
                    No hay valores configurados.
                  </div>
                </q-card>
              </div>

              <div class="col-12 col-md-6">
                <q-card flat bordered class="info-card">
                  <div class="text-subtitle2 text-weight-bold q-mb-md">
                    Estadísticas
                  </div>

                  <div v-if="profileStats.length" class="row q-col-gutter-sm">
                    <div
                      v-for="(stat, index) in profileStats"
                      :key="`${stat.label}-${index}`"
                      class="col-12 col-sm-6"
                    >
                      <q-card flat bordered class="stat-preview-card">
                        <div class="stat-value">{{ stat.value || "0" }}</div>
                        <div class="stat-label">{{ stat.label || "Sin label" }}</div>
                      </q-card>
                    </div>
                  </div>

                  <div v-else class="text-body2 text-grey-7">
                    No hay estadísticas configuradas.
                  </div>
                </q-card>
              </div>

              <div class="col-12">
                <q-card flat bordered class="info-card">
                  <div class="text-subtitle2 text-weight-bold q-mb-md">
                    Imágenes públicas
                  </div>

                  <div class="row q-col-gutter-md">
                    <ProfileImageItem label="Principal" :src="profileImages.main" />
                    <ProfileImageItem
                      label="Secundaria"
                      :src="profileImages.secondary"
                    />
                    <ProfileImageItem label="Tercera" :src="profileImages.third" />
                    <ProfileImageItem
                      label="Trayectoria"
                      :src="profileImages.trajectory"
                    />
                    <ProfileImageItem label="Hero" :src="profileImages.hero" />
                  </div>
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="banking">
            <q-card flat bordered class="info-card">
              <div class="text-subtitle2 text-weight-bold q-mb-md">
                Datos bancarios de origen
              </div>

              <div class="row q-col-gutter-md">
                <InfoItem
                  label="Banco origen"
                  :value="company?.banking?.originBankName"
                />
                <InfoItem
                  label="Código banco"
                  :value="company?.banking?.originBankCode"
                />
                <InfoItem
                  label="Dígito banco"
                  :value="company?.banking?.originBankDigit"
                />
                <InfoItem label="Tipo de cuenta" :value="accountTypeLabel" />
                <InfoItem
                  label="Número de cuenta"
                  :value="company?.banking?.originAccountNumber"
                />
                <InfoItem label="Moneda banco" :value="bankCurrencyLabel" />
              </div>
            </q-card>
          </q-tab-panel>

          <q-tab-panel name="bankFile">
            <q-card flat bordered class="info-card">
              <div class="text-subtitle2 text-weight-bold q-mb-md">
                Configuración de archivo bancario / nómina
              </div>

              <div class="row q-col-gutter-md">
                <InfoItem
                  label="Código de convenio"
                  :value="company?.bankFileConfig?.agreementCode"
                />
                <InfoItem
                  label="Código de servicio"
                  :value="company?.bankFileConfig?.serviceCode"
                />
                <InfoItem
                  label="Descripción default"
                  :value="company?.bankFileConfig?.defaultStatementDescription"
                />
                <InfoItem
                  label="Versión layout"
                  :value="company?.bankFileConfig?.bankFileLayoutVersion"
                />
                <InfoItem
                  label="Encoding"
                  :value="company?.bankFileConfig?.fileEncoding"
                />
                <InfoItem
                  label="Salto de línea"
                  :value="company?.bankFileConfig?.lineEnding"
                />
                <InfoItem label="Relleno" :value="paddingLabel" />
                <InfoItem
                  label="Última fecha secuencia"
                  :value="company?.bankFileConfig?.lastSequenceDate"
                />
                <InfoItem
                  label="Último número secuencia"
                  :value="company?.bankFileConfig?.lastSequenceNumber"
                />
              </div>
            </q-card>
          </q-tab-panel>

          <q-tab-panel name="departments">
            <q-card flat bordered class="inner-card">
              <div class="row items-center justify-between q-pa-md">
                <div>
                  <div class="text-subtitle2 text-weight-bold">
                    Departamentos de la compañía
                  </div>
                  <div class="text-caption text-grey-7">
                    Crea y consulta los departamentos relacionados a esta empresa.
                  </div>
                </div>

                <q-btn
                  unelevated
                  rounded
                  color="primary"
                  icon="add"
                  label="Nuevo departamento"
                  class="action-btn"
                  @click="emit('create-department')"
                />
              </div>

              <q-separator />

              <q-table
                :rows="departments"
                :columns="departmentColumns"
                row-key="_id"
                flat
                :loading="loadingDepartments"
                :pagination="{ rowsPerPage: 8 }"
                no-data-label="Esta compañía no tiene departamentos registrados"
              >
                <template #body-cell-name="props">
                  <q-td :props="props">
                    <div class="row items-center q-gutter-sm no-wrap">
                      <q-avatar
                        size="32px"
                        color="primary"
                        text-color="white"
                        icon="apartment"
                      />

                      <div>
                        <div class="text-weight-medium">
                          {{ props.row.name }}
                        </div>
                        <div class="text-caption text-grey-7">
                          {{ props.row.code || "Sin código" }}
                        </div>
                      </div>
                    </div>
                  </q-td>
                </template>

                <template #body-cell-status="props">
                  <q-td :props="props" class="text-center">
                    <q-badge
                      rounded
                      :color="props.row.isActive ? 'secondary' : 'negative'"
                      :label="props.row.isActive ? 'ACTIVO' : 'INACTIVO'"
                    />
                  </q-td>
                </template>
              </q-table>
            </q-card>
          </q-tab-panel>

          <q-tab-panel name="notes">
            <q-card flat bordered class="info-card">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">
                Notas generales
              </div>
              <div class="text-body2 text-grey-8">
                {{ company?.notes || "Sin notas registradas." }}
              </div>
            </q-card>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, defineComponent, h, ref } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  company: {
    type: Object,
    default: null,
  },
  departments: {
    type: Array,
    default: () => [],
  },
  loadingDepartments: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "create-department"]);

const tab = ref("summary");

const InfoItem = defineComponent({
  name: "InfoItem",
  props: {
    label: {
      type: String,
      default: "",
    },
    value: {
      type: [String, Number, Boolean],
      default: "",
    },
  },
  setup(componentProps) {
    return () =>
      h("div", { class: "col-12 col-md-4" }, [
        h("div", { class: "text-caption text-grey-7" }, componentProps.label),
        h(
          "div",
          { class: "text-body2 text-weight-medium info-value" },
          componentProps.value || componentProps.value === 0
            ? String(componentProps.value)
            : "N/A",
        ),
      ]);
  },
});

const ProfileImageItem = defineComponent({
  name: "ProfileImageItem",
  props: {
    label: {
      type: String,
      default: "",
    },
    src: {
      type: String,
      default: "",
    },
  },
  setup(componentProps) {
    return () =>
      h("div", { class: "col-12 col-sm-6 col-md-4" }, [
        h("div", { class: "text-caption text-grey-7 q-mb-xs" }, componentProps.label),
        componentProps.src
          ? h("img", {
              class: "profile-image-preview",
              src: componentProps.src,
              alt: componentProps.label,
            })
          : h(
              "div",
              { class: "profile-image-empty" },
              "Sin imagen configurada",
            ),
      ]);
  },
});

const companyName = computed(() => {
  return (
    props.company?.tradeName ||
    props.company?.legalName ||
    props.company?.code ||
    "Compañía"
  );
});

const publicProfile = computed(() => {
  return props.company?.publicProfile || {};
});

const profileValues = computed(() => {
  return Array.isArray(publicProfile.value?.values)
    ? publicProfile.value.values
    : [];
});

const profileStats = computed(() => {
  return Array.isArray(publicProfile.value?.stats)
    ? publicProfile.value.stats
    : [];
});

const profileImages = computed(() => {
  return publicProfile.value?.images || {};
});

const addressLabel = computed(() => {
  const address = props.company?.address || {};

  if (address.fullAddress) return address.fullAddress;

  const parts = [
    address.street,
    address.city,
    address.state,
    address.country,
    address.zipCode,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Sin dirección";
});

const accountTypeLabel = computed(() => {
  const value = props.company?.banking?.originAccountType;

  if (value === "1") return "Cuenta tipo 1";
  if (value === "2") return "Cuenta tipo 2";

  return "N/A";
});

const bankCurrencyLabel = computed(() => {
  const value = props.company?.banking?.currencyCode;

  if (value === "214") return "DOP - Peso dominicano (214)";
  if (value === "840") return "USD - Dólar estadounidense (840)";
  if (value === "978") return "EUR - Euro (978)";

  return value || "N/A";
});

const paddingLabel = computed(() => {
  const value = props.company?.bankFileConfig?.defaultPaddingChar;

  if (value === " ") return "Espacio";
  if (value === "0") return "Cero";

  return "N/A";
});

const departmentColumns = [
  {
    name: "name",
    label: "Departamento",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "description",
    label: "Descripción",
    field: "description",
    align: "left",
  },
  {
    name: "status",
    label: "Estado",
    field: "isActive",
    align: "center",
  },
];

const close = () => {
  emit("update:modelValue", false);
};
</script>

<style scoped>
.company-detail-dialog {
  width: 1120px;
  max-width: 96vw;
  max-height: 92vh;
  border-radius: 22px;
  overflow: hidden;
}

.dialog-header {
  background: var(--q-primary);
  color: white;
  padding: 18px 20px;
}

.detail-tabs {
  padding: 4px 12px 0;
}

.detail-panels {
  max-height: calc(92vh - 140px);
  overflow-y: auto;
}

.summary-card,
.info-card,
.inner-card {
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.summary-card {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 92px;
}

.info-card {
  padding: 16px;
}

.action-btn {
  text-transform: none;
  font-weight: 600;
}

.info-value {
  white-space: pre-line;
  word-break: break-word;
}

.mini-profile-card {
  padding: 12px;
  border-radius: 14px;
}

.stat-preview-card {
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--q-primary);
  line-height: 1;
}

.stat-label {
  margin-top: 6px;
  color: #667085;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.profile-image-preview {
  width: 100%;
  height: 130px;
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.profile-image-empty {
  height: 130px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  color: #667085;
  background: #f8fafc;
  border: 1px dashed rgba(0, 0, 0, 0.16);
  font-size: 0.82rem;
}
</style>