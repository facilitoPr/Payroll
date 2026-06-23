<template>
  <div class="public-page" :style="pageCssVars">
    <!-- TOP STRIP -->
    <div class="top-strip bg-primary">
      <div class="public-container top-strip-content">
        <div class="top-message row items-center no-wrap">
          <q-icon name="campaign" size="18px" class="q-mr-sm" />
          <span>{{ topMessage }}</span>
        </div>

        <div class="top-actions row items-center no-wrap">
          <q-btn
            flat
            dense
            no-caps
            class="top-link"
            label="Help Desk"
            @click="openSupport"
          />

          <q-btn
            flat
            dense
            no-caps
            class="top-link"
            label="Nuestra Familia"
            @click="scrollToSection('empresa')"
          />

          <q-btn
            flat
            dense
            no-caps
            class="top-link"
            label="Portal RRHH"
            @click="goToPortalAccess"
          />
        </div>
      </div>
    </div>

    <!-- NAV -->
    <div class="main-nav">
      <div class="public-container nav-content">
        <div
          class="brand row items-center no-wrap"
          @click="scrollToSection('inicio')"
        >
          <img :src="activeLogo" :alt="brandName" class="brand-logo-img" />

          <div>
            <div class="brand-title text-primary">{{ brandName }}</div>
            <div class="brand-subtitle">{{ brandSubtitle }}</div>
          </div>
        </div>

        <div class="desktop-menu row items-center no-wrap q-gutter-x-sm">
          <q-btn
            flat
            no-caps
            label="Inicio"
            @click="scrollToSection('inicio')"
          />

          <q-btn
            flat
            no-caps
            label="Promociones"
            @click="scrollToSection('promociones')"
          />

          <q-btn
            flat
            no-caps
            label="Nuestra Familia"
            @click="scrollToSection('empresa')"
          />

          <q-btn
            flat
            no-caps
            label="Trayectoria"
            @click="scrollToSection('trayectoria')"
          />

          <q-btn
            flat
            no-caps
            label="Misión y Valores"
            @click="scrollToSection('valores')"
          />
        </div>

        <div class="row items-center q-gutter-sm">
          <q-btn
            outline
            no-caps
            class="support-nav-btn gt-sm"
            icon="support_agent"
            label="Help Desk"
            @click="openSupport"
          />

          <!-- LOGUEADO -->
          <div v-if="isLoggedIn" class="logged-user">
            <q-btn unelevated no-caps rounded class="logged-user-btn">
              <div class="row items-center no-wrap">
                <q-avatar size="38px" class="logged-avatar">
                  <q-img
                    v-if="auth.user?.img"
                    :src="auth.user.img"
                    alt="Avatar"
                  />
                  <span v-else>{{ userInitial }}</span>
                </q-avatar>

                <div class="gt-xs q-ml-sm text-left">
                  <div class="logged-name ellipsis">{{ userName }}</div>
                  <div class="logged-role ellipsis">{{ roleLabel }}</div>
                </div>

                <q-icon name="expand_more" size="18px" class="q-ml-sm" />
              </div>

              <q-menu
                anchor="bottom right"
                self="top right"
                :offset="[0, 10]"
                class="account-menu"
              >
                <q-card flat class="account-card">
                  <div class="account-header">
                    <q-avatar size="76px" class="account-avatar">
                      <q-img
                        v-if="auth.user?.img"
                        :src="auth.user.img"
                        alt="Avatar"
                      />
                      <span v-else>{{ userInitial }}</span>
                    </q-avatar>

                    <div class="account-name ellipsis-2-lines">
                      {{ userName }}
                    </div>

                    <div class="account-role">
                      {{ roleLabel }}
                    </div>
                  </div>

                  <q-separator />

                  <q-list padding>
                    <q-item
                      clickable
                      v-ripple
                      class="account-item"
                      @click="goToProfile"
                    >
                      <q-item-section avatar>
                        <q-icon name="person" color="primary" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>Perfil</q-item-label>
                        <q-item-label caption>Datos y seguridad</q-item-label>
                      </q-item-section>

                      <q-item-section side>
                        <q-icon name="chevron_right" color="grey-6" />
                      </q-item-section>
                    </q-item>

                    <q-item
                      clickable
                      v-ripple
                      class="account-item"
                      @click="goToPunch"
                    >
                      <q-item-section avatar>
                        <q-icon name="fingerprint" color="primary" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>Ponchar</q-item-label>
                        <q-item-label caption>
                          Registrar entrada/salida
                        </q-item-label>
                      </q-item-section>

                      <q-item-section side>
                        <q-icon name="chevron_right" color="grey-6" />
                      </q-item-section>
                    </q-item>

                    <q-item
                      clickable
                      v-ripple
                      class="account-item"
                      @click="goToPortal"
                    >
                      <q-item-section avatar>
                        <q-icon name="dashboard" color="primary" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>Dashboard</q-item-label>
                        <q-item-label caption>
                          Volver al panel principal
                        </q-item-label>
                      </q-item-section>

                      <q-item-section side>
                        <q-icon name="chevron_right" color="grey-6" />
                      </q-item-section>
                    </q-item>
                  </q-list>

                  <q-separator />

                  <q-card-actions align="between" class="q-pa-md">
                    <div class="text-caption text-grey-7">Sesión activa</div>

                    <q-btn
                      flat
                      no-caps
                      color="negative"
                      icon="logout"
                      label="Cerrar sesión"
                      class="signout-btn"
                      @click="handleLogout"
                    />
                  </q-card-actions>
                </q-card>
              </q-menu>
            </q-btn>
          </div>

          <!-- NO LOGUEADO -->
          <q-btn
            v-else
            unelevated
            no-caps
            class="portal-btn"
            icon="login"
            label="Acceder"
            @click="goToLogin"
          />

          <q-btn
            flat
            round
            dense
            icon="menu"
            class="mobile-menu-btn"
            @click="mobileMenu = true"
          />
        </div>
      </div>
    </div>

    <PublicCompanyHorizontalMenu
      :companies="publicCompanies"
      :selected-company="selectedCompany"
      :loading="companiesLoading"
      @select="selectCompany"
      @clear="clearSelectedCompany"
    />

    <!-- MOBILE MENU -->
    <q-dialog v-model="mobileMenu" position="right">
      <q-card class="mobile-menu-card">
        <q-card-section
          class="row items-center justify-between mobile-menu-header"
        >
          <div class="row items-center no-wrap">
            <img :src="activeLogo" :alt="brandName" class="mobile-logo" />
            <div class="q-ml-sm text-subtitle1 text-weight-bold">Menú</div>
          </div>

          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </q-card-section>

        <q-list padding>
          <q-item clickable v-ripple @click="goMobileSection('inicio')">
            <q-item-section avatar>
              <q-icon name="home" />
            </q-item-section>
            <q-item-section>Inicio</q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="goMobileSection('promociones')">
            <q-item-section avatar>
              <q-icon name="campaign" />
            </q-item-section>
            <q-item-section>Promociones</q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="goMobileSection('empresa')">
            <q-item-section avatar>
              <q-icon name="groups" />
            </q-item-section>
            <q-item-section>Nuestra Familia</q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="goMobileSection('trayectoria')">
            <q-item-section avatar>
              <q-icon name="timeline" />
            </q-item-section>
            <q-item-section>Trayectoria</q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="goMobileSection('valores')">
            <q-item-section avatar>
              <q-icon name="flag" />
            </q-item-section>
            <q-item-section>Misión y Valores</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            @click="
              openSupport();
              mobileMenu = false;
            "
          >
            <q-item-section avatar>
              <q-icon name="support_agent" />
            </q-item-section>
            <q-item-section>Help Desk</q-item-section>
          </q-item>

          <q-expansion-item icon="business" label="Empresas" default-opened>
            <q-item
              clickable
              v-ripple
              @click="
                clearSelectedCompany();
                mobileMenu = false;
              "
            >
              <q-item-section avatar>
                <q-icon name="home_work" />
              </q-item-section>

              <q-item-section>Empresa predeterminada</q-item-section>

              <q-item-section
                side
                v-if="selectedCompany?._id === defaultCompany?._id"
              >
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
            </q-item>

            <q-item
              v-for="company in publicCompanies"
              :key="company._id"
              clickable
              v-ripple
              @click="
                selectCompany(company);
                mobileMenu = false;
              "
            >
              <q-item-section avatar>
                <q-avatar size="32px" color="primary" text-color="white">
                  <q-img v-if="company.logo" :src="company.logo" />
                  <q-icon v-else name="business" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                {{ company.tradeName || company.legalName || company.name }}
              </q-item-section>

              <q-item-section side v-if="selectedCompany?._id === company._id">
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
            </q-item>

            <q-item v-if="companiesLoading">
              <q-item-section avatar>
                <q-spinner color="primary" />
              </q-item-section>
              <q-item-section>Cargando empresas...</q-item-section>
            </q-item>
          </q-expansion-item>

          <q-item clickable v-ripple @click="goToPortalAccess">
            <q-item-section avatar>
              <q-icon name="badge" />
            </q-item-section>
            <q-item-section>
              {{ isLoggedIn ? "Ir al portal" : "Acceder al portal" }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <PublicLandingHero
      :promotions="promotions"
      :selected-company="selectedCompany"
      :is-logged-in="isLoggedIn"
      :oficina="landingContent.images.hero"
      @go-portal="goToPortalAccess"
      @promotion-click="handlePromotionClick"
    />

    <!-- NUESTRA FAMILIA -->
    <section id="empresa" class="company-section">
      <div class="public-container company-grid">
        <div>
          <q-badge rounded class="primary-action-btn" label="Nuestra Familia" />

          <h2>{{ landingContent.aboutTitle }}</h2>

          <p>
            {{ landingContent.aboutDescription }}
          </p>

          <p v-if="landingContent.aboutSecondDescription">
            {{ landingContent.aboutSecondDescription }}
          </p>

          <div class="company-actions row q-gutter-sm">
            <q-btn
              unelevated
              no-caps
              class="rounded-btn primary-action-btn"
              icon="flag"
              label="Ver misión"
              @click="scrollToSection('valores')"
            />

            <q-btn
              outline
              no-caps
              class="rounded-btn outline-action-btn"
              icon="timeline"
              label="Ver trayectoria"
              @click="scrollToSection('trayectoria')"
            />
          </div>
        </div>

        <div class="company-image-stack">
          <q-img
            :src="landingContent.images.main"
            :alt="brandName"
            fit="cover"
            class="company-office-image image-large"
          />

          <div class="small-image-row">
            <q-img
              :src="landingContent.images.secondary"
              :alt="brandName"
              fit="cover"
              class="company-office-image image-small"
            />

            <q-img
              :src="landingContent.images.third"
              :alt="brandName"
              fit="cover"
              class="company-office-image image-small"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- TRAYECTORIA -->
    <section id="trayectoria" class="trajectory-section">
      <div class="public-container trajectory-grid">
        <div class="trajectory-card">
          <q-badge rounded class="primary-action-btn" label="Trayectoria" />

          <h2>{{ landingContent.trajectoryTitle }}</h2>

          <p>
            {{ landingContent.trajectoryDescription }}
          </p>

          <p v-if="landingContent.trajectorySecondDescription">
            {{ landingContent.trajectorySecondDescription }}
          </p>
        </div>

        <div class="stats-grid">
          <div
            v-for="stat in landingContent.stats"
            :key="`${stat.label}-${stat.value}`"
            class="stat-card"
          >
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>

          <q-img
            :src="landingContent.images.trajectory"
            :alt="brandName"
            fit="cover"
            class="company-office-image stat-image"
          />
        </div>
      </div>
    </section>

    <!-- MISIÓN, VISIÓN Y VALORES -->
    <section id="valores" class="values-section">
      <div class="public-container">
        <div class="section-header">
          <div class="text-h3 text-bold">Misión, visión y valores</div>
          <p>
            {{ landingContent.valuesDescription }}
          </p>
        </div>

        <div class="mission-grid">
          <q-card flat bordered class="identity-card">
            <q-card-section>
              <q-icon name="visibility" size="md" class="icon" />
              <div class="identity-title">Visión</div>

              <div class="identity-text">
                {{ landingContent.vision }}
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="identity-card">
            <q-card-section>
              <q-icon name="flag" size="md" class="icon" />
              <div class="identity-title">Misión</div>

              <div class="identity-text">
                {{ landingContent.mission }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="values-summary-card">
          <div>
            <div class="text-h6 text-weight-bold">Valores</div>
            <div class="text-body2 text-grey-7 q-mt-xs">
              {{ landingContent.valuesDescription }}
            </div>
          </div>

          <div class="chips-wrap">
            <q-chip
              v-for="item in landingContent.values"
              :key="item.title"
              outline
              class="value-chip"
            >
              <q-icon
                :name="item.icon || 'check_circle'"
                size="16px"
                class="q-mr-xs icon"
              />
              {{ item.title }}
            </q-chip>
          </div>
        </div>

        <div class="values-grid">
          <q-card
            v-for="item in landingContent.values"
            :key="item.title"
            flat
            bordered
            class="value-card"
          >
            <q-card-section>
              <q-icon
                :name="item.icon || 'check_circle'"
                size="md"
                class="icon"
              />

              <div class="value-title">
                {{ item.title }}
              </div>

              <div class="value-desc">
                {{ item.description }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <PublicFooter
      :logo="activeLogo"
      :brand-name="brandName"
      :brand-subtitle="brandSubtitle"
      :description="landingContent.aboutDescription"
      :company="selectedCompany"
      @go-section="scrollToSection"
      @go-portal="goToPortalAccess"
    />

    <SupportTicketDialog
      v-model="showSupportDialog"
      @created="showSupportDialog = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";
import { scroll } from "quasar";

const { setVerticalScrollPosition } = scroll;

import { appConfig } from "src/config/app.config";
import {
  defaultStats,
  defaultCompanyContent,
  valueCards,
} from "src/config/landing-defaults";

import logo from "src/assets/logo.png";
import oficina from "src/assets/guimanfer/guimanfer-oficina.png";
import img1 from "src/assets/guimanfer/img-1.png";
import img2 from "src/assets/guimanfer/img-2.jpg";
import img3 from "src/assets/guimanfer/img-3.jpg";
import img4 from "src/assets/guimanfer/img-4.jpg";

import PublicFooter from "src/components/public/PublicFooter.vue";
import SupportTicketDialog from "src/components/support/SupportTicketDialog.vue";
import PublicLandingHero from "./PublicLandingHero.vue";
import PublicCompanyHorizontalMenu from "src/components/public/PublicCompanyHorizontalMenu.vue";

const defaultBrandName = appConfig.companyName;
const defaultSubBrandName = appConfig.companySubtitle;

const router = useRouter();
const route = useRoute();
const auth = authStore();

const mobileMenu = ref(false);
const loading = ref(false);
const promotions = ref([]);

const showSupportDialog = ref(false);
const companiesLoading = ref(false);
const publicCompanies = ref([]);
const selectedCompany = ref(null);

let promotionRequestId = 0;
const viewedPromotionIds = new Set();

const defaultCompany = computed(() => {
  return publicCompanies.value[0] || null;
});

const isLoggedIn = computed(() => Boolean(auth.loggedIn));

const userName = computed(() => auth.user?.name || "Usuario");

const userInitial = computed(() => {
  const name = auth.user?.name?.trim() || "U";
  return name.charAt(0).toUpperCase();
});

const roleLabel = computed(() => {
  const rol = auth.user?.rol || auth.user?.role;

  if (!rol) return "Colaborador";
  if (typeof rol === "string") return rol;

  return rol.name || rol.code || "Colaborador";
});

const hexToRgb = (hex) => {
  const cleanHex = String(hex || "")
    .replace("#", "")
    .trim();

  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return "23, 141, 210";
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `${r}, ${g}, ${b}`;
};

const getDefaultCompany = () => {
  return publicCompanies.value[0] || null;
};

const companyProfile = computed(() => {
  return selectedCompany.value?.publicProfile || {};
});

const brandName = computed(() => {
  return (
    selectedCompany.value?.tradeName ||
    selectedCompany.value?.legalName ||
    selectedCompany.value?.name ||
    defaultBrandName
  );
});

const brandSubtitle = computed(() => {
  return (
    companyProfile.value?.headline ||
    defaultSubBrandName ||
    defaultCompanyContent.headline
  );
});

const topMessage = computed(() => {
  return companyProfile.value?.subtitle || defaultCompanyContent.subtitle;
});

const activeLogo = computed(() => {
  return selectedCompany.value?.logo || selectedCompany.value?.logoUrl || logo;
});

const activePrimaryColor = computed(() => {
  return selectedCompany.value?.primaryColor || "#178DD2";
});

const activeSecondaryColor = computed(() => {
  return selectedCompany.value?.secondaryColor || "#222C5B";
});

const pageCssVars = computed(() => {
  return {
    "--landing-primary": activePrimaryColor.value,
    "--landing-secondary": activeSecondaryColor.value,
    "--landing-primary-rgb": hexToRgb(activePrimaryColor.value),
  };
});

const landingContent = computed(() => {
  const profile = companyProfile.value || {};

  return {
    aboutTitle:
      profile.aboutTitle ||
      `${brandName.value}: ${profile.headline || defaultCompanyContent.headline}`,

    aboutDescription:
      profile.aboutDescription || defaultCompanyContent.aboutDescription,

    aboutSecondDescription:
      profile.aboutSecondDescription ||
      defaultCompanyContent.aboutSecondDescription,

    trajectoryTitle:
      profile.trajectoryTitle || defaultCompanyContent.trajectoryTitle,

    trajectoryDescription:
      profile.trajectoryDescription ||
      defaultCompanyContent.trajectoryDescription,

    trajectorySecondDescription:
      profile.trajectorySecondDescription ||
      defaultCompanyContent.trajectorySecondDescription,

    mission: profile.mission || defaultCompanyContent.mission,

    vision: profile.vision || defaultCompanyContent.vision,

    valuesDescription:
      profile.valuesDescription || defaultCompanyContent.valuesDescription,

    values:
      Array.isArray(profile.values) && profile.values.length
        ? profile.values
        : valueCards,

    stats:
      Array.isArray(profile.stats) && profile.stats.length
        ? profile.stats
        : defaultStats,

    images: {
      main: profile.images?.main || img2,
      secondary: profile.images?.secondary || img3,
      third: profile.images?.third || img4,
      trajectory: profile.images?.trajectory || img1,
      hero: profile.images?.hero || oficina,
    },
  };
});

onMounted(async () => {
  await hydrateSessionIfNeeded();
  await loadPublicCompanies();

  // Siempre asigna la primera empresa si no hay una empresa válida en la URL.
  resolveSelectedCompanyFromRoute();

  // Las promociones iniciales siempre se cargan filtradas por la empresa seleccionada.
  await loadPromotions();

  if (route.query.support === "1" && isLoggedIn.value) {
    showSupportDialog.value = true;
  }
});

watch(
  () => route.query.company,
  async () => {
    if (!publicCompanies.value.length) return;

    const previousCompanyId = selectedCompany.value?._id || "";

    // Si no hay query company, o el código no existe, vuelve a la primera empresa.
    resolveSelectedCompanyFromRoute();

    const nextCompanyId = selectedCompany.value?._id || "";

    if (previousCompanyId !== nextCompanyId) {
      await loadPromotions();
    }
  },
);

const normalizeCompany = (company) => {
  return {
    ...company,
    logo: company.logo || company.logoUrl || "",
    tradeName: company.tradeName || company.name || company.legalName || "",
    publicProfile: company.publicProfile || {},
  };
};

const resolveSelectedCompanyFromRoute = () => {
  const defaultItem = getDefaultCompany();
  const companyFromUrl = route.query.company;

  // No hay empresa en URL: usar siempre la primera empresa de la lista.
  if (!companyFromUrl) {
    selectedCompany.value = defaultItem;
    return;
  }

  const key = String(companyFromUrl).trim().toLowerCase();

  const found = publicCompanies.value.find((item) => {
    return (
      String(item._id || "").toLowerCase() === key ||
      String(item.code || "").toLowerCase() === key
    );
  });

  // URL inválida o empresa no existente: regresar a la primera empresa.
  selectedCompany.value = found || defaultItem;
};

const hydrateSessionIfNeeded = async () => {
  try {
    if (auth.token && !auth.hydrated && typeof auth.refreshMe === "function") {
      await auth.refreshMe({
        force: false,
        maxAgeMs: 60_000,
      });
    }
  } catch (error) {
    console.error("hydrateSessionIfNeeded error:", error);
  }
};

const loadPublicCompanies = async () => {
  companiesLoading.value = true;

  try {
    const resp = await methodsHttp.getApi("company/public/list");

    if (resp?.ok) {
      const companies = Array.isArray(resp.companies)
        ? resp.companies.map(normalizeCompany)
        : [];

      publicCompanies.value = companies;

      const selectedCompanyStillExists = publicCompanies.value.some((company) => {
        return company._id === selectedCompany.value?._id;
      });

      // La primera empresa será la predeterminada desde que cargue la lista.
      if (!selectedCompanyStillExists) {
        selectedCompany.value = getDefaultCompany();
      }

      return;
    }

    publicCompanies.value = [];
    selectedCompany.value = null;
    promotions.value = [];
  } catch (error) {
    console.error("loadPublicCompanies error:", error);

    publicCompanies.value = [];
    selectedCompany.value = null;
    promotions.value = [];
  } finally {
    companiesLoading.value = false;
  }
};

const loadPromotions = async () => {
  const requestId = ++promotionRequestId;

  loading.value = true;

  try {
    const params = new URLSearchParams();

    // Si por cualquier motivo no hay una empresa seleccionada,
    // se toma inmediatamente la primera empresa disponible.
    if (!selectedCompany.value && getDefaultCompany()) {
      selectedCompany.value = getDefaultCompany();
    }

    if (selectedCompany.value?._id) {
      params.set(
        "company",
        selectedCompany.value.code || selectedCompany.value._id,
      );
    }

    const query = params.toString();

    const endpoint = query
      ? `promotion-ads/public/landing-hero?${query}`
      : "promotion-ads/public/landing-hero";

    const resp = await methodsHttp.getApi(endpoint);

    if (requestId !== promotionRequestId) return;

    if (resp?.ok) {
      const nextPromotions = (resp.promotions || []).map(normalizePromotion);

      promotions.value = nextPromotions;

      registerPromotionViews(nextPromotions);
      return;
    }

    promotions.value = [];
  } catch (error) {
    if (requestId !== promotionRequestId) return;

    console.error("loadPromotions error:", error);
    promotions.value = [];
  } finally {
    if (requestId === promotionRequestId) {
      loading.value = false;
    }
  }
};

const selectCompany = async (company) => {
  // Si llega null o undefined, nunca deja la pantalla sin empresa:
  // vuelve a la primera empresa de la lista.
  const companyToSelect = company || getDefaultCompany();

  selectedCompany.value = companyToSelect;

  const nextQuery = {
    ...route.query,
  };

  if (companyToSelect?._id) {
    nextQuery.company = companyToSelect.code || companyToSelect._id;
  } else {
    delete nextQuery.company;
  }

  await router.replace({
    path: route.path,
    query: nextQuery,
  });

  await loadPromotions();
  setVerticalScrollPosition(window, 0, 500);
};

const clearSelectedCompany = () => {
  // "Limpiar" ahora significa volver a la primera empresa,
  // no mostrar una página mezclada con todas las empresas.
  selectCompany(getDefaultCompany());
};

const normalizePromotion = (item) => {
  return {
    _id: item._id || item.id || item.code,
    code: item.code,
    badge: item.badge || "",
    title: item.title || "",
    highlight: item.highlight || "",
    subtitle: item.subtitle || "",
    description: item.description || "",
    placement: item.placement,
    audience: item.audience,
    media: item.media || {},
    style: item.style || {},
    cta: item.cta || {
      label: "Conocer más",
      action: "NONE",
    },
    order: item.order || 0,
  };
};

const registerPromotionViews = (items) => {
  items.forEach((item) => {
    if (!item?._id) return;
    if (viewedPromotionIds.has(item._id)) return;

    viewedPromotionIds.add(item._id);

    methodsHttp
      .postApi(`promotion-ads/public/${item._id}/view`, {})
      .catch(() => {});
  });
};

const registerPromotionClick = (item) => {
  if (!item?._id) return;

  methodsHttp
    .postApi(`promotion-ads/public/${item._id}/click`, {})
    .catch(() => {});
};

const handlePromotionClick = (item) => {
  registerPromotionClick(item);

  const action = item?.cta?.action;

  if (action === "LOGIN") {
    goToPortalAccess();
    return;
  }

  if (action === "ROUTE" && item.cta.route) {
    router.push(item.cta.route);
    return;
  }

  if (action === "URL" && item.cta.url) {
    window.open(item.cta.url, item.cta.openInNewTab ? "_blank" : "_self");
    return;
  }

  if (action === "SCROLL" && item.cta.sectionId) {
    scrollToSection(item.cta.sectionId);
  }
};

const goToLogin = () => {
  router.push("/login");
};

const goToPortal = () => {
  router.push(auth.defaultHomeRoute || "/portal/dashboard");
};

const goToPortalAccess = () => {
  if (isLoggedIn.value) {
    goToPortal();
    return;
  }

  router.push({
    path: "/login",
    query: {
      redirect: "/portal/dashboard",
    },
  });
};

const goToProfile = () => {
  router.push("/portal/profile");
};

const goToPunch = () => {
  router.push("/punch");
};

const handleLogout = async () => {
  await auth.logout();
  await router.replace("/login");
};

const scrollToSection = (sectionId) => {
  const section = document.getElementById(sectionId);

  if (!section) return;

  section.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

const goMobileSection = (sectionId) => {
  mobileMenu.value = false;
  setTimeout(() => scrollToSection(sectionId), 120);
};

const openSupport = () => {
  if (!isLoggedIn.value) {
    const redirectPath = router.resolve({
      path: route.path,
      query: {
        ...route.query,
        support: "1",
      },
    }).fullPath;

    router.push({
      path: "/login",
      query: {
        redirect: redirectPath,
      },
    });

    return;
  }

  showSupportDialog.value = true;
};
</script>

<style scoped>
.public-page {
  background: #f5f7fb;
  color: #101828;
}

.public-container {
  width: min(1250px, calc(100% - 32px));
  margin: 0 auto;
}

.top-strip {
  min-height: 46px;
  display: flex;
  align-items: center;
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.top-strip-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.top-message {
  font-size: 0.82rem;
  font-weight: 700;
  opacity: 0.96;
  letter-spacing: -0.01em;
}

.top-actions {
  padding: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  gap: 2px;
}

.top-link {
  min-height: 30px;
  padding: 0 11px;
  border-radius: 999px;
  color: white;
  font-size: 0.78rem;
  font-weight: 800;
  transition: all 0.18s ease;
}

.top-link:hover {
  background: rgba(255, 255, 255, 0.15);
}

.main-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(16, 24, 40, 0.08);
}

.nav-content {
  height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand {
  cursor: pointer;
  min-width: 0;
}

.brand-logo-img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  flex: 0 0 auto;
}

.brand-title {
  margin-left: 10px;
  font-weight: 950;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: -0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-subtitle {
  margin-left: 10px;
  color: #667085;
  font-size: 12px;
  font-weight: 400;
  text-transform: uppercase;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.desktop-menu {
  color: #344054;
}

.portal-btn,
.rounded-btn,
.support-nav-btn {
  border-radius: 999px;
  font-weight: 800;
}

.portal-btn,
.primary-action-btn {
  color: #ffffff;
  background: var(--landing-primary);
}

.support-nav-btn,
.outline-action-btn {
  color: var(--landing-primary);
  border-color: var(--landing-primary);
}

.mobile-menu-btn {
  display: none;
  color: var(--landing-primary);
}

.mobile-menu-card {
  width: min(360px, 88vw);
  height: 100vh;
  border-radius: 20px 0 0 20px;
}

.mobile-menu-header {
  color: white;
  background: var(--landing-primary);
}

.icon {
  color: var(--landing-primary);
}

.mobile-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
  background: white;
  border-radius: 10px;
  padding: 3px;
}

/* ACCOUNT MENU */
.logged-user-btn {
  background: rgba(var(--landing-primary-rgb), 0.08);
  color: #101828;
  border: 1px solid rgba(var(--landing-primary-rgb), 0.14);
  padding: 4px 10px 4px 5px;
}

.logged-avatar,
.account-avatar {
  color: white;
  font-weight: 800;
  background: linear-gradient(
    135deg,
    var(--landing-secondary),
    var(--landing-primary)
  );
  box-shadow:
    0 0 0 2px #fff,
    0 0 0 4px rgba(var(--landing-primary-rgb), 0.35);
  border-radius: 9999px;
}

.logged-name {
  max-width: 140px;
  font-size: 0.84rem;
  font-weight: 900;
  line-height: 1;
}

.logged-role {
  max-width: 140px;
  margin-top: 3px;
  color: #667085;
  font-size: 0.72rem;
  font-weight: 700;
}

.account-card {
  min-width: 310px;
  max-width: 340px;
  border-radius: 22px;
  overflow: hidden;
}

.account-header {
  padding: 22px;
  text-align: center;
  background: linear-gradient(
    135deg,
    rgba(var(--landing-primary-rgb), 0.1),
    #ffffff
  );
}

.account-avatar {
  margin: 0 auto;
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 4px rgba(var(--landing-primary-rgb), 0.22);
}

.account-name {
  margin-top: 10px;
  color: #101828;
  font-size: 1rem;
  font-weight: 900;
}

.account-role {
  margin-top: 4px;
  color: #667085;
  font-size: 0.8rem;
  font-weight: 700;
}

.account-item {
  border-radius: 14px;
  margin: 4px 8px;
  padding: 8px 10px;
}

.account-item:hover {
  background: rgba(var(--landing-primary-rgb), 0.06);
}

.signout-btn {
  border-radius: 10px;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* COMPANY */
.company-section,
.values-section,
.trajectory-section {
  padding: 50px 0;
}

.company-section {
  background: #ffffff;
}

.company-grid,
.trajectory-grid {
  display: grid;
  grid-template-columns: 1fr 430px;
  gap: 52px;
  align-items: center;
}

.company-section h2,
.trajectory-section h2,
.section-header h2 {
  margin: 12px 0;
  color: #101828;
  font-size: clamp(32px, 3.6vw, 52px);
  line-height: 1.05;
  letter-spacing: -1.4px;
  font-weight: 950;
}

.company-section p,
.trajectory-section p,
.section-header p {
  color: #667085;
  font-size: 18px;
  line-height: 1.7;
}

.company-actions {
  margin-top: 28px;
}

.company-image-stack {
  display: grid;
  gap: 14px;
}

.small-image-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.company-office-image {
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(16, 24, 40, 0.08);
  box-shadow: 0 22px 55px rgba(16, 24, 40, 0.08);
}

.company-office-image.image-large {
  height: 340px;
  border-radius: 30px;
}

.company-office-image.image-small {
  height: 130px;
  border-radius: 22px;
}

.company-office-image.stat-image {
  height: 170px;
  border-radius: 26px;
  grid-column: span 2;
}

/* TRAJECTORY */
.trajectory-section {
  background:
    radial-gradient(
      circle at 12% 22%,
      rgba(var(--landing-primary-rgb), 0.08),
      transparent 24%
    ),
    #f8fafc;
}

.trajectory-card {
  padding: 34px;
  border-radius: 30px;
  background: white;
  border: 1px solid rgba(16, 24, 40, 0.08);
  box-shadow: 0 22px 55px rgba(16, 24, 40, 0.07);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.stat-card {
  min-height: 150px;
  border-radius: 26px;
  padding: 24px;
  background: var(--landing-primary);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 22px 55px rgba(var(--landing-primary-rgb), 0.2);
}

.stat-value {
  font-size: 2.8rem;
  font-weight: 950;
  line-height: 1;
}

.stat-label {
  margin-top: 8px;
  font-size: 0.96rem;
  font-weight: 800;
  opacity: 0.82;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* VALUES */
.values-section {
  position: relative;
  overflow: hidden;
  padding: 96px 0;
  background:
    radial-gradient(
      circle at 10% 14%,
      rgba(var(--landing-primary-rgb), 0.14),
      transparent 24%
    ),
    radial-gradient(
      circle at 92% 18%,
      rgba(var(--landing-primary-rgb), 0.16),
      transparent 28%
    ),
    linear-gradient(135deg, #f8fbff 0%, #eef8ff 46%, #ffffff 100%);
}

.values-section::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px);
  background-size: 46px 46px;
  opacity: 0.28;
  pointer-events: none;
}

.section-header {
  position: relative;
  z-index: 1;
  max-width: 780px;
  margin-bottom: 34px;
}

.mission-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  margin-bottom: 22px;
}

.identity-card,
.value-card,
.values-summary-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(16, 24, 40, 0.08);
  box-shadow: 0 18px 45px rgba(16, 24, 40, 0.06);
  backdrop-filter: blur(10px);
}

.identity-card {
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;
}

.identity-card:hover {
  transform: translateY(-6px);
  border-color: rgba(var(--landing-primary-rgb), 0.18);
  box-shadow: 0 30px 76px rgba(16, 24, 40, 0.12);
}

.identity-title {
  margin-top: 18px;
  color: #101828;
  font-size: 1.2rem;
  font-weight: 950;
}

.identity-text {
  margin-top: 10px;
  color: #475467;
  line-height: 1.75;
}

.values-summary-card {
  position: relative;
  z-index: 1;
  padding: 22px;
  margin-bottom: 22px;
}

.chips-wrap {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.value-chip {
  border-radius: 999px;
  padding: 6px 10px;
  border-color: var(--landing-primary);
  color: var(--landing-primary);
}

.values-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.value-card {
  height: 100%;
  position: relative;
  overflow: hidden;
  cursor: default;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;
}

.value-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at top right,
      rgba(var(--landing-primary-rgb), 0.12),
      transparent 34%
    ),
    linear-gradient(180deg, rgba(var(--landing-primary-rgb), 0.04), transparent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease;
}

.value-card:hover {
  transform: translateY(-8px);
  border-color: rgba(var(--landing-primary-rgb), 0.2);
  box-shadow: 0 34px 80px rgba(16, 24, 40, 0.13);
}

.value-card:hover::before {
  opacity: 1;
}

.value-card:hover .q-icon {
  transform: scale(1.1) rotate(-4deg);
}

.value-card .q-icon {
  transition: transform 0.22s ease;
}

.value-title {
  margin-top: 16px;
  font-size: 1rem;
  font-weight: 900;
  color: #101828;
}

.value-desc {
  margin-top: 8px;
  color: #667085;
  line-height: 1.55;
}

@media (max-width: 1024px) {
  .desktop-menu,
  .support-nav-btn {
    display: none;
  }

  .mobile-menu-btn {
    display: inline-flex;
  }

  .hero-grid,
  .company-grid,
  .trajectory-grid,
  .mission-grid,
  .values-grid {
    grid-template-columns: 1fr;
  }

  .hero-carousel,
  .hero-empty {
    height: auto;
    min-height: 880px;
  }

  .hero-visual {
    min-height: 360px;
  }

  .hero-image-card {
    height: 360px;
    min-height: 360px;
  }
}

@media (max-width: 640px) {
  .public-container {
    width: min(100% - 22px, 1180px);
  }

  .top-actions {
    display: none;
  }

  .top-message {
    font-size: 0.72rem;
  }

  .brand {
    max-width: calc(100vw - 150px);
  }

  .brand-title {
    max-width: 150px;
    font-size: 13px;
  }

  .brand-subtitle {
    max-width: 150px;
    font-size: 10px;
  }

  .brand-logo-img {
    width: 44px;
    height: 44px;
  }

  .hero-copy h1 {
    font-size: 42px;
    letter-spacing: -1.6px;
  }

  .hero-description {
    font-size: 17px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-actions .q-btn {
    width: 100%;
  }

  .company-section,
  .values-section,
  .trajectory-section {
    padding: 62px 0;
  }

  .small-image-row,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .company-office-image.stat-image {
    grid-column: span 1;
  }

  .logged-user-btn {
    padding-right: 6px;
  }
}
</style>