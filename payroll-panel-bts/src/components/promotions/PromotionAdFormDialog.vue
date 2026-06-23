<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="promotion-dialog rounded-card column no-wrap">
      <!-- HEADER -->
      <q-card-section class="dialog-header row items-start justify-between">
  <div class="row items-center q-gutter-sm">
    <q-avatar color="white" text-color="primary" icon="campaign" />

    <div>
      <div class="text-h6 text-weight-bold">
        {{ form._id ? "Editar promoción" : "Nueva promoción" }}
      </div>
      <div class="text-caption text-blue-1">
        Crea anuncios para el landing sin configuraciones técnicas.
      </div>
    </div>
  </div>

  <q-btn
    flat
    round
    dense
    icon="close"
    color="white"
    :disable="loading"
    @click="emit('update:modelValue', false)"
  />
</q-card-section>

      <q-separator />

      <!-- BODY -->
      <q-card-section class="dialog-body q-pa-md">
        <!-- FORM -->
        <div class="form-area">
          <q-tabs
            v-model="tab"
            dense
            align="left"
            active-color="primary"
            indicator-color="primary"
            class="promotion-tabs q-mb-md"
          >
            <q-tab name="content" icon="article" label="Contenido" />
            <q-tab name="media" icon="image" label="Imagen" />
            <q-tab name="style" icon="palette" label="Estilo" />
            <q-tab name="cta" icon="ads_click" label="Acción" />
            <q-tab name="settings" icon="settings" label="Publicación" />
          </q-tabs>

          <q-tab-panels v-model="tab" animated class="tab-panels">
            <!-- CONTENIDO -->
            <q-tab-panel name="content" class="q-pa-none">
              <div class="section-title">Contenido principal</div>

              <div class="helper-card q-mb-md">
                <q-icon name="tips_and_updates" size="20px" color="primary" />
                <span>
                  El sistema generará el código interno automáticamente. Solo
                  completa lo que verá el usuario.
                </span>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="form.title"
                    outlined
                    dense
                    rounded
                    label="Título principal"
                    hint="Ej: Nuevos beneficios para colaboradores"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.highlight"
                    outlined
                    dense
                    rounded
                    label="Texto destacado"
                    hint="Ej: Este mes"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.badge"
                    outlined
                    dense
                    rounded
                    label="Etiqueta"
                    hint="Ej: Nuevo, Importante, RRHH"
                  />
                </div>

                <div class="col-12">
                  <q-input
                    v-model="form.subtitle"
                    outlined
                    dense
                    rounded
                    label="Subtítulo"
                    hint="Una frase corta que acompañe el título"
                  />
                </div>

                <div class="col-12">
                  <q-input
                    v-model="form.description"
                    outlined
                    dense
                    rounded
                    type="textarea"
                    autogrow
                    label="Descripción"
                    hint="Explica brevemente de qué trata la promoción"
                  />
                </div>
              </div>
            </q-tab-panel>

            <!-- MEDIA -->
            <q-tab-panel name="media" class="q-pa-none">
              <div class="section-title">Imagen de la promoción</div>

              <div class="helper-card q-mb-md">
                <q-icon name="image" size="20px" color="primary" />
                <span>
                  Puedes pegar una URL o reemplazar las imágenes actuales
                  subiendo nuevas imágenes. Si no subes una nueva, se mantiene
                  la imagen guardada.
                </span>
              </div>

              <q-option-group
                v-model="imageMode"
                inline
                color="primary"
                class="q-mb-md image-mode-options"
                :options="[
                  { label: 'Usar URL', value: 'url' },
                  { label: 'Subir imagen', value: 'upload' },
                ]"
              />

              <template v-if="imageMode === 'url'">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.media.desktopImage"
                      outlined
                      dense
                      rounded
                      label="URL de la imagen principal"
                      hint="Imagen que se verá en desktop y en el preview"
                    >
                      <template #prepend>
                        <q-icon name="link" color="primary" />
                      </template>
                    </q-input>
                  </div>

                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.media.mobileImage"
                      outlined
                      dense
                      rounded
                      label="URL de imagen móvil"
                      hint="Opcional. Si no se coloca, se usará la principal."
                    >
                      <template #prepend>
                        <q-icon name="phone_iphone" color="primary" />
                      </template>
                    </q-input>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <div class="image-edit-card">
                      <div class="image-edit-card__header">
                        <div>
                          <div class="image-edit-card__title">
                            Imagen principal
                          </div>
                          <div class="image-edit-card__subtitle">
                            Se verá en desktop y en el preview completo.
                          </div>
                        </div>

                        <q-btn
                          v-if="currentDesktopImage"
                          flat
                          dense
                          no-caps
                          color="negative"
                          icon="delete"
                          label="Quitar"
                          @click="clearDesktopImage"
                        />
                      </div>

                      <div
                        v-if="desktopPreviewImage"
                        class="image-edit-card__preview"
                      >
                        <q-img
                          :src="desktopPreviewImage"
                          fit="cover"
                          class="image-edit-card__img"
                        />

                        <q-badge
                          rounded
                          class="image-edit-card__badge"
                          :color="desktopImageFile ? 'positive' : 'primary'"
                          :label="
                            desktopImageFile
                              ? 'Nueva imagen'
                              : 'Imagen actual'
                          "
                        />
                      </div>

                      <div v-else class="image-edit-card__empty">
                        <q-icon name="image_not_supported" size="34px" />
                        <div>No hay imagen principal.</div>
                      </div>

                      <q-file
                        v-model="desktopImageFile"
                        outlined
                        dense
                        rounded
                        accept="image/*"
                        label="Reemplazar imagen principal"
                        hint="PNG, JPG o WEBP. Recomendado: 1600x900 o similar."
                        clearable
                        class="q-mt-md"
                      >
                        <template #prepend>
                          <q-icon name="upload_file" color="primary" />
                        </template>
                      </q-file>
                    </div>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="image-edit-card">
                      <div class="image-edit-card__header">
                        <div>
                          <div class="image-edit-card__title">
                            Imagen móvil
                          </div>
                          <div class="image-edit-card__subtitle">
                            Opcional. Se usará para pantallas pequeñas.
                          </div>
                        </div>

                        <q-btn
                          v-if="currentMobileImage"
                          flat
                          dense
                          no-caps
                          color="negative"
                          icon="delete"
                          label="Quitar"
                          @click="clearMobileImage"
                        />
                      </div>

                      <div
                        v-if="mobilePreviewImage"
                        class="image-edit-card__preview"
                      >
                        <q-img
                          :src="mobilePreviewImage"
                          fit="cover"
                          class="image-edit-card__img"
                        />

                        <q-badge
                          rounded
                          class="image-edit-card__badge"
                          :color="mobileImageFile ? 'positive' : 'primary'"
                          :label="
                            mobileImageFile
                              ? 'Nueva imagen'
                              : 'Imagen actual'
                          "
                        />
                      </div>

                      <div v-else class="image-edit-card__empty">
                        <q-icon name="phone_iphone" size="34px" />
                        <div>No hay imagen móvil.</div>
                      </div>

                      <q-file
                        v-model="mobileImageFile"
                        outlined
                        dense
                        rounded
                        accept="image/*"
                        label="Reemplazar imagen móvil"
                        hint="Opcional. Recomendado: formato vertical o cuadrado."
                        clearable
                        class="q-mt-md"
                      >
                        <template #prepend>
                          <q-icon name="phone_iphone" color="primary" />
                        </template>
                      </q-file>
                    </div>
                  </div>
                </div>
              </template>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12">
                  <q-input
                    v-model="form.media.alt"
                    outlined
                    dense
                    rounded
                    label="Descripción de la imagen"
                    hint="Texto alternativo para accesibilidad"
                  >
                    <template #prepend>
                      <q-icon name="description" color="primary" />
                    </template>
                  </q-input>
                </div>
              </div>
            </q-tab-panel>

            <!-- ESTILO -->
            <q-tab-panel name="style" class="q-pa-none">
              <div class="section-title">Estilo visual</div>

              <div class="helper-card q-mb-md">
                <q-icon name="info" size="20px" color="primary" />
                <span>
                  Selecciona una plantilla visual. No tienes que escribir CSS
                  ni configurar código.
                </span>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-select
                    v-model="selectedTheme"
                    outlined
                    dense
                    rounded
                    emit-value
                    map-options
                    label="Plantilla visual"
                    :options="themeOptions"
                    @update:model-value="applyThemePreset"
                  >
                    <template #selected-item="scope">
                      <div class="row items-center no-wrap">
                        <span
                          class="theme-dot q-mr-sm"
                          :style="{ background: scope.opt.primary }"
                        />
                        <span>{{ scope.opt.label }}</span>
                      </div>
                    </template>

                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section avatar>
                          <div
                            class="theme-option-preview"
                            :style="{
                              background: buildVisualBackground(
                                scope.opt.primary,
                                scope.opt.secondary,
                                scope.opt.variant,
                              ),
                            }"
                          />
                        </q-item-section>

                        <q-item-section>
                          <q-item-label>{{ scope.opt.label }}</q-item-label>
                          <q-item-label caption>
                            {{ scope.opt.description }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>

                <div class="col-12 col-md-4">
                  <q-input
                    v-model="form.style.primaryColor"
                    outlined
                    dense
                    rounded
                    type="color"
                    label="Color principal"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <q-input
                    v-model="form.style.secondaryColor"
                    outlined
                    dense
                    rounded
                    type="color"
                    label="Color secundario"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <q-select
                    v-model="form.style.textColor"
                    outlined
                    dense
                    rounded
                    emit-value
                    map-options
                    label="Color del texto"
                    :options="textColorOptions"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-select
                    v-model="visualVariant"
                    outlined
                    dense
                    rounded
                    emit-value
                    map-options
                    label="Tipo de fondo"
                    :options="visualVariantOptions"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.style.overlayColor"
                    outlined
                    dense
                    rounded
                    label="Overlay"
                    hint="Ej: rgba(0,0,0,0.18)"
                  />
                </div>
              </div>
            </q-tab-panel>

            <!-- CTA -->
            <q-tab-panel name="cta" class="q-pa-none">
              <div class="section-title">Acción del anuncio</div>

              <div class="helper-card q-mb-md">
                <q-icon name="ads_click" size="20px" color="primary" />
                <span>
                  Define qué pasará cuando el usuario haga clic en el botón
                  del anuncio.
                </span>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                  <q-select
                    v-model="form.cta.action"
                    outlined
                    dense
                    rounded
                    emit-value
                    map-options
                    label="Tipo de acción"
                    :options="ctaActionOptions"
                  />
                </div>

                <div class="col-12 col-md-8">
                  <q-input
                    v-model="form.cta.label"
                    outlined
                    dense
                    rounded
                    label="Texto del botón"
                  />
                </div>

                <div class="col-12" v-if="form.cta.action === 'URL'">
                  <q-input
                    v-model="form.cta.url"
                    outlined
                    dense
                    rounded
                    label="URL externa"
                  />
                </div>

                <div class="col-12" v-if="form.cta.action === 'ROUTE'">
                  <q-input
                    v-model="form.cta.route"
                    outlined
                    dense
                    rounded
                    label="Ruta interna"
                  />
                </div>

                <div class="col-12" v-if="form.cta.action === 'SCROLL'">
                  <q-input
                    v-model="form.cta.sectionId"
                    outlined
                    dense
                    rounded
                    label="ID de sección"
                  />
                </div>

                <div class="col-12">
                  <q-toggle
                    v-model="form.cta.openInNewTab"
                    color="primary"
                    label="Abrir en nueva pestaña"
                  />
                </div>
              </div>
            </q-tab-panel>

            <!-- CONFIGURACIÓN -->
            <q-tab-panel name="settings" class="q-pa-none">
              <div class="section-title">Configuración de publicación</div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-3">
                  <q-select
                    v-model="form.status"
                    outlined
                    dense
                    rounded
                    emit-value
                    map-options
                    label="Estado"
                    :options="statusOptions"
                  />
                </div>

                <div class="col-12 col-md-3">
                  <q-select
                    v-model="form.audience"
                    outlined
                    dense
                    rounded
                    emit-value
                    map-options
                    label="Audiencia"
                    :options="audienceOptions"
                  />
                </div>

                <div class="col-12 col-md-3">
                  <q-input
                    v-model.number="form.order"
                    outlined
                    dense
                    rounded
                    type="number"
                    label="Orden"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-select
                    v-model="form.company"
                    outlined
                    dense
                    rounded
                    clearable
                    emit-value
                    map-options
                    label="Empresa específica"
                    :options="companyOptions"
                  />
                </div>

                <div class="col-12 col-md-3">
                  <q-input
                    v-model="form.startsAt"
                    outlined
                    dense
                    rounded
                    type="date"
                    label="Fecha inicio"
                  />
                </div>

                <div class="col-12 col-md-3">
                  <q-input
                    v-model="form.endsAt"
                    outlined
                    dense
                    rounded
                    type="date"
                    label="Fecha fin"
                  />
                </div>

                <div class="col-12">
                  <q-toggle
                    v-model="form.isActive"
                    color="positive"
                    label="Promoción activa"
                  />
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>

        <!-- PREVIEW COMPLETO ABAJO -->
        <div class="website-preview-section">
          <div class="preview-header row items-center justify-between">
            <div>
              <div class="preview-header__title">Preview completo del website</div>
              <div class="preview-header__subtitle">
                Así se verá la promoción dentro del landing público.
              </div>
            </div>

            <q-badge
              rounded
              :color="form.status === 'PUBLISHED' ? 'positive' : 'grey-7'"
              :label="getStatusLabel(form.status)"
            />
          </div>

          <div class="website-preview-frame">
            <div class="landing-hero-preview" :style="heroPreviewStyle">
              <div class="landing-hero-pattern"></div>

              <div
                class="landing-hero-overlay"
                :style="{ background: form.style.overlayColor || 'rgba(0,0,0,0.18)' }"
              ></div>

              <div class="preview-container landing-hero-grid">
                <div class="landing-hero-copy">
                  <div class="landing-hero-badges">
                    <q-badge
                      v-if="form.badge"
                      rounded
                      class="landing-hero-badge"
                    >
                      {{ form.badge }}
                    </q-badge>

                    <q-badge
                      v-if="selectedCompanyPreview"
                      rounded
                      class="landing-hero-company-badge"
                    >
                      {{ selectedCompanyPreview }}
                    </q-badge>
                  </div>

                  <div class="text-h2 text-bold">
                    {{ form.title || "Promociones y comunicados" }}
                    <span>{{ form.highlight || "para colaboradores" }}</span>
                  </div>

                  <p v-if="form.subtitle" class="landing-hero-subtitle">
                    {{ form.subtitle }}
                  </p>

                  <p class="landing-hero-description">
                    {{
                      form.description ||
                      "Aquí se mostrarán anuncios, beneficios, noticias internas y campañas publicadas desde el panel administrativo."
                    }}
                  </p>

                  <div
                    v-if="form.cta.action !== 'NONE'"
                    class="row items-center q-gutter-sm landing-hero-actions"
                  >
                    <q-btn
                      unelevated
                      no-caps
                      size="lg"
                      class="landing-hero-cta"
                      :style="{ color: form.style.primaryColor }"
                      :label="form.cta.label || 'Conocer más'"
                      icon-right="arrow_forward"
                    />
                  </div>
                </div>

                <div class="landing-hero-visual">
                  <q-img
                    v-if="previewImage"
                    :src="previewImage"
                    :alt="form.media.alt || form.title || 'Promoción'"
                    fit="cover"
                    class="landing-hero-image"
                  />

                  <div v-else class="landing-hero-image-empty">
                    <q-icon name="image" size="48px" />
                    <div>Selecciona una imagen para verla aquí</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="preview-info">
            <q-icon name="tips_and_updates" size="18px" />
            <span>
              El preview usa la imagen principal. Si subes una imagen nueva, se
              verá inmediatamente antes de guardar.
            </span>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- ACTIONS -->
      <q-card-actions align="right" class="dialog-actions q-pa-md">
  <q-btn
    flat
    rounded
    color="grey-8"
    icon="close"
    label="Cancelar"
    class="dialog-btn"
    :disable="loading"
    @click="emit('update:modelValue', false)"
  />

  <q-btn
    unelevated
    rounded
    color="primary"
    icon="save"
    label="Guardar"
    class="dialog-btn"
    :loading="loading"
    @click="submit"
  />
</q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  promotion: { type: Object, default: null },
  companies: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "save"]);

const tab = ref("content");
const imageMode = ref("url");
const selectedTheme = ref("corporate");
const visualVariant = ref("soft");

const desktopImageFile = ref(null);
const mobileImageFile = ref(null);
const desktopFilePreview = ref("");
const mobileFilePreview = ref("");
const removeDesktopImage = ref(false);
const removeMobileImage = ref(false);

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

const ctaActionOptions = [
  { label: "Ninguna", value: "NONE" },
  { label: "URL externa", value: "URL" },
  { label: "Ruta interna", value: "ROUTE" },
  { label: "Login", value: "LOGIN" },
  { label: "Scroll", value: "SCROLL" },
];

const textColorOptions = [
  { label: "Claro", value: "#FFFFFF" },
  { label: "Oscuro", value: "#0F172A" },
];

const visualVariantOptions = [
  { label: "Suave", value: "soft" },
  { label: "Sólido", value: "solid" },
  { label: "Moderno", value: "modern" },
];

const themeOptions = [
  {
    label: "Corporativo azul",
    value: "corporate",
    primary: "#1A2436",
    secondary: "#1964A2",
    textColor: "#FFFFFF",
    variant: "modern",
    description: "Formal, ideal para anuncios institucionales.",
  },
  {
    label: "Institucional",
    value: "institutional",
    primary: "#024D48",
    secondary: "#1964A2",
    textColor: "#FFFFFF",
    variant: "modern",
    description: "Ideal para comunicaciones internas.",
  },
  {
    label: "Naranja acción",
    value: "orange",
    primary: "#C2410C",
    secondary: "#F97316",
    textColor: "#FFFFFF",
    variant: "modern",
    description: "Bueno para avisos importantes.",
  },
  {
    label: "Claro elegante",
    value: "light",
    primary: "#FFFFFF",
    secondary: "#E2E8F0",
    textColor: "#0F172A",
    variant: "soft",
    description: "Limpio, claro y sobrio.",
  },
  {
    label: "Oscuro premium",
    value: "dark",
    primary: "#0F172A",
    secondary: "#334155",
    textColor: "#FFFFFF",
    variant: "solid",
    description: "Más serio y de alto contraste.",
  },
];

const companyOptions = computed(() => {
  return props.companies.map((company) => ({
    label: company.tradeName || company.legalName,
    value: company._id,
  }));
});

const selectedCompanyPreview = computed(() => {
  if (!form.company) return "";

  const found = props.companies.find((company) => company._id === form.company);

  return found?.tradeName || found?.legalName || "";
});

const defaultForm = () => ({
  _id: null,
  title: "",
  highlight: "",
  subtitle: "",
  description: "",
  badge: "",
  status: "DRAFT",
  audience: "PUBLIC",
  company: null,
  media: {
    desktopImage: "",
    mobileImage: "",
    alt: "",
  },
  style: {
    background: "",
    primaryColor: "#1A2436",
    secondaryColor: "#1964A2",
    textColor: "#FFFFFF",
    overlayColor: "rgba(0,0,0,0.18)",
  },
  cta: {
    label: "Conocer más",
    action: "LOGIN",
    url: "",
    route: "/login",
    sectionId: "",
    openInNewTab: false,
  },
  order: 0,
  startsAt: "",
  endsAt: "",
  isActive: true,
});

const form = reactive(defaultForm());

const currentDesktopImage = computed(() => {
  if (removeDesktopImage.value) return "";
  return form.media.desktopImage || "";
});

const currentMobileImage = computed(() => {
  if (removeMobileImage.value) return "";
  return form.media.mobileImage || "";
});

const desktopPreviewImage = computed(() => {
  if (desktopFilePreview.value) return desktopFilePreview.value;
  return currentDesktopImage.value;
});

const mobilePreviewImage = computed(() => {
  if (mobileFilePreview.value) return mobileFilePreview.value;
  return currentMobileImage.value;
});

const previewImage = computed(() => {
  return (
    desktopPreviewImage.value ||
    mobilePreviewImage.value ||
    form.media.desktopImage ||
    form.media.mobileImage ||
    ""
  );
});

const heroPreviewStyle = computed(() => {
  return {
    background: buildCurrentBackground(),
    color: form.style.textColor || "#FFFFFF",
  };
});

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      tab.value = "content";
      fillForm();
    }
  },
);

watch(desktopImageFile, (file) => {
  if (desktopFilePreview.value) {
    URL.revokeObjectURL(desktopFilePreview.value);
  }

  desktopFilePreview.value = file ? URL.createObjectURL(file) : "";

  if (file) {
    removeDesktopImage.value = false;
  }
});

watch(mobileImageFile, (file) => {
  if (mobileFilePreview.value) {
    URL.revokeObjectURL(mobileFilePreview.value);
  }

  mobileFilePreview.value = file ? URL.createObjectURL(file) : "";

  if (file) {
    removeMobileImage.value = false;
  }
});

watch(
  () => [
    form.style.primaryColor,
    form.style.secondaryColor,
    visualVariant.value,
  ],
  () => {
    form.style.background = buildCurrentBackground();
  },
  { deep: true },
);

const buildVisualBackground = (primary, secondary, variant = "soft") => {
  if (variant === "solid") return primary;

  if (variant === "modern") {
    return `
      radial-gradient(circle at 78% 42%, ${secondary}66, transparent 24%),
      linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)
    `;
  }

  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
};

const buildCurrentBackground = () => {
  return buildVisualBackground(
    form.style.primaryColor || "#1A2436",
    form.style.secondaryColor || "#1964A2",
    visualVariant.value,
  );
};

const applyThemePreset = (value) => {
  const theme = themeOptions.find((item) => item.value === value);
  if (!theme) return;

  form.style.primaryColor = theme.primary;
  form.style.secondaryColor = theme.secondary;
  form.style.textColor = theme.textColor;
  visualVariant.value = theme.variant;
  form.style.background = buildVisualBackground(
    theme.primary,
    theme.secondary,
    theme.variant,
  );
};

const formatDateForInput = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const inferThemeFromPromotion = (source) => {
  const primary = source?.style?.primaryColor;
  const found = themeOptions.find((item) => item.primary === primary);
  return found?.value || "corporate";
};

const fillForm = () => {
  const fresh = defaultForm();
  const source = props.promotion || {};

  desktopImageFile.value = null;
  mobileImageFile.value = null;
  desktopFilePreview.value = "";
  mobileFilePreview.value = "";
  removeDesktopImage.value = false;
  removeMobileImage.value = false;

  Object.assign(form, {
    ...fresh,
    ...source,
    company:
      typeof source.company === "object"
        ? source.company?._id || null
        : source.company || null,
    startsAt: formatDateForInput(source.startsAt),
    endsAt: formatDateForInput(source.endsAt),
    media: {
      ...fresh.media,
      ...(source.media || {}),
      videoUrl: undefined,
    },
    style: {
      ...fresh.style,
      ...(source.style || {}),
    },
    cta: {
      ...fresh.cta,
      ...(source.cta || {}),
    },
  });

  imageMode.value =
    form.media.desktopImage || form.media.mobileImage ? "url" : "upload";

  selectedTheme.value = inferThemeFromPromotion(source);

  if (!source?._id) {
    applyThemePreset(selectedTheme.value);
  } else {
    form.style.background = buildCurrentBackground();
  }
};

const clearDesktopImage = () => {
  desktopImageFile.value = null;
  desktopFilePreview.value = "";
  removeDesktopImage.value = true;
};

const clearMobileImage = () => {
  mobileImageFile.value = null;
  mobileFilePreview.value = "";
  removeMobileImage.value = true;
};

const getStatusLabel = (status) => {
  const map = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicado",
    ARCHIVED: "Archivado",
  };

  return map[status] || status;
};

const appendIfValue = (formData, key, value) => {
  if (value === undefined || value === null) return;
  formData.append(key, String(value));
};

const submit = () => {
  const payload = new FormData();

  appendIfValue(payload, "_id", form._id);
  appendIfValue(payload, "title", form.title);
  appendIfValue(payload, "highlight", form.highlight);
  appendIfValue(payload, "subtitle", form.subtitle);
  appendIfValue(payload, "description", form.description);
  appendIfValue(payload, "badge", form.badge);
  appendIfValue(payload, "status", form.status);
  appendIfValue(payload, "audience", form.audience);
  appendIfValue(payload, "company", form.company || "");
  appendIfValue(payload, "order", form.order || 0);
  appendIfValue(payload, "startsAt", form.startsAt || "");
  appendIfValue(payload, "endsAt", form.endsAt || "");
  appendIfValue(payload, "isActive", form.isActive);

  const media = {
    desktopImage: removeDesktopImage.value ? "" : form.media.desktopImage || "",
    mobileImage: removeMobileImage.value ? "" : form.media.mobileImage || "",
    alt: form.media.alt || "",
  };

  if (imageMode.value === "url") {
    media.desktopImage = form.media.desktopImage || "";
    media.mobileImage = form.media.mobileImage || "";
  }

  const style = {
    ...form.style,
    background: buildCurrentBackground(),
    overlayColor: form.style.overlayColor || "rgba(0,0,0,0.18)",
  };

  payload.append("media", JSON.stringify(media));
  payload.append("style", JSON.stringify(style));
  payload.append("cta", JSON.stringify(form.cta));

  if (imageMode.value === "upload") {
    if (desktopImageFile.value) {
      payload.append("desktopImage", desktopImageFile.value);
    }

    if (mobileImageFile.value) {
      payload.append("mobileImage", mobileImageFile.value);
    }
  }

  emit("save", payload);
};
</script>

<style scoped>
.promotion-dialog {
  width: 1380px;
  max-width: 98vw;
  max-height: 94vh;
  border-radius: 20px;
  overflow: hidden;
}

.rounded-card {
  border-radius: 20px;
}

.dialog-header {
  min-height: 76px;
  color: white;
  padding: 18px 20px;
  background: var(--q-primary);
}

.dialog-btn {
  text-transform: none;
  font-weight: 700;
  min-width: 120px;
  border-radius: 999px;
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(94vh - 150px);
  background: #f8fafc;
}

.dialog-actions {
  background: #ffffff;
}

.form-area {
  padding: 4px;
}

.promotion-tabs {
  border-radius: 16px;
  background: #ffffff;
  padding: 4px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.promotion-tabs :deep(.q-tab) {
  border-radius: 12px;
  min-height: 38px;
}

.promotion-tabs :deep(.q-tab--active) {
  background: rgba(var(--primary-rgb), 0.08);
}

.tab-panels {
  background: #ffffff;
  border-radius: 22px;
  padding: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.section-title {
  margin-bottom: 12px;
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.helper-card {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 16px;
  color: #475569;
  background: rgba(var(--primary-rgb), 0.06);
  border: 1px solid rgba(var(--primary-rgb), 0.1);
  font-size: 0.86rem;
  font-weight: 600;
}

.image-mode-options {
  padding: 8px 12px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.image-edit-card {
  height: 100%;
  padding: 14px;
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
}

.image-edit-card__header {
  min-height: 54px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.image-edit-card__title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.image-edit-card__subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.image-edit-card__preview {
  height: 220px;
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: #e2e8f0;
}

.image-edit-card__img {
  width: 100%;
  height: 100%;
}

.image-edit-card__badge {
  position: absolute;
  left: 12px;
  bottom: 12px;
  font-weight: 800;
}

.image-edit-card__empty {
  height: 220px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  border-radius: 18px;
  color: #64748b;
  background: #f1f5f9;
  border: 1px dashed rgba(15, 23, 42, 0.16);
  font-weight: 700;
}

.theme-dot {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  display: inline-block;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
}

.theme-option-preview {
  width: 46px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
}

.website-preview-section {
  margin-top: 24px;
}

.preview-header {
  margin-bottom: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.preview-header__title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.preview-header__subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 600;
}

.website-preview-frame {
  overflow: hidden;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
}

.preview-container {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
}

.website-preview-top-strip {
  min-height: 46px;
  display: flex;
  align-items: center;
  color: #ffffff;
  background:
    linear-gradient(
      135deg,
      rgba(var(--primary-rgb), 0.98),
      rgba(var(--primary-rgb), 0.78)
    ),
    var(--primary);
  font-size: 0.82rem;
  font-weight: 800;
}

.website-preview-top-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  opacity: 0.94;
}

.website-preview-nav {
  height: 78px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.98);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.preview-logo {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: var(--primary);
  margin-right: 12px;
}

.preview-brand-title {
  color: var(--primary);
  font-weight: 950;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: -0.3px;
}

.preview-brand-subtitle {
  margin-top: 4px;
  color: #667085;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.preview-menu {
  display: flex;
  align-items: center;
  gap: 18px;
  color: #344054;
  font-size: 0.86rem;
  font-weight: 800;
}

.landing-hero-preview {
  min-height: 720px;
  position: relative;
  overflow: hidden;
}

.landing-hero-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.16) 1px, transparent 1px);
  background-size: 42px 42px;
  pointer-events: none;
}

.landing-hero-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.landing-hero-grid {
  min-height: 720px;
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(390px, 0.82fr);
  align-items: center;
  gap: 54px;
  padding-top: 44px;
  padding-bottom: 44px;
}

.landing-hero-copy {
  color: inherit;
  max-width: 720px;
}

.landing-hero-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}

.landing-hero-badge {
  background: rgba(255, 255, 255, 0.16);
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.24);
  padding: 8px 14px;
  font-weight: 800;
}

.landing-hero-company-badge {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--primary);
  border: 1px solid rgba(255, 255, 255, 0.32);
  font-weight: 900;
}

.landing-hero-copy h1 {
  margin: 0;
  font-size: clamp(44px, 5.5vw, 86px);
  line-height: 0.92;
  letter-spacing: -3px;
  font-weight: 950;
}

.landing-hero-copy h1 span {
  display: block;
  color: inherit;
  opacity: 0.82;
}

.landing-hero-subtitle {
  margin: 20px 0 0;
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 800;
  opacity: 0.94;
}

.landing-hero-description {
  margin: 20px 0 34px;
  font-size: clamp(17px, 1.7vw, 22px);
  line-height: 1.45;
  opacity: 0.9;
  max-width: 760px;
}

.landing-hero-cta {
  background: #ffffff;
  border-radius: 999px;
  padding-left: 28px;
  padding-right: 28px;
  font-weight: 900;
  box-shadow: 0 16px 34px rgba(255, 255, 255, 0.16);
}

.landing-hero-visual {
  min-height: 500px;
  display: grid;
  place-items: center;
}

.landing-hero-image {
  width: 100%;
  height: 500px;
  border-radius: 34px;
  overflow: hidden;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.landing-hero-image-empty {
  width: 100%;
  height: 500px;
  border-radius: 34px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.84);
  background: rgba(255, 255, 255, 0.12);
  border: 1px dashed rgba(255, 255, 255, 0.32);
  font-weight: 800;
}

.website-preview-next-section {
  padding: 32px 0;
  background: #ffffff;
}

.next-section-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.next-section-card {
  min-height: 96px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 22px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.next-section-card strong {
  display: block;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.next-section-card span {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
}

.preview-info {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 16px;
  color: #475569;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  font-size: 0.82rem;
  font-weight: 600;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

:deep(.q-field--outlined.q-field--rounded .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 1024px) {
  .landing-hero-grid {
    grid-template-columns: 1fr;
    min-height: 880px;
  }

  .landing-hero-preview {
    min-height: 880px;
  }

  .landing-hero-visual {
    min-height: 360px;
  }

  .landing-hero-image,
  .landing-hero-image-empty {
    height: 360px;
    min-height: 360px;
  }

  .next-section-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .promotion-dialog {
    width: 96vw;
    max-height: 94vh;
  }

  .dialog-body {
    max-height: calc(94vh - 150px);
  }

  .promotion-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .landing-hero-copy h1 {
    font-size: 42px;
    letter-spacing: -1.6px;
  }

  .landing-hero-description {
    font-size: 17px;
  }

  .landing-hero-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .landing-hero-actions .q-btn {
    width: 100%;
  }

  .preview-container {
    width: min(100% - 22px, 1180px);
  }
}
</style>