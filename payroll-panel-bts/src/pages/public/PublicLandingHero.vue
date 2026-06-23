<template>
  <section id="inicio" class="hero-section text-white">
    <q-carousel
      v-model="activeSlide"
      animated
      swipeable
      infinite
      :arrows="heroSlides.length > 1"
      :navigation="heroSlides.length > 1"
      navigation-position="bottom"
      transition-prev="slide-right"
      transition-next="slide-left"
      :autoplay="heroSlides.length > 1 ? 9000 : false"
      class="hero-carousel"
    >
      <q-carousel-slide
        v-for="item in heroSlides"
        :key="item._id"
        :name="item._id"
        class="hero-slide"
        :style="getHeroStyle(item)"
      >
        <div class="hero-pattern"></div>
        <div class="hero-overlay"></div>

        <div class="public-container hero-grid">
          <div class="hero-copy">
            <div class="hero-badges-row">
              <q-badge v-if="item.badge" rounded class="hero-badge">
                {{ item.badge }}
              </q-badge>

              <q-badge
                v-if="selectedCompany"
                rounded
                class="hero-company-badge"
              >
                {{ selectedCompany.tradeName || selectedCompany.legalName }}
              </q-badge>
            </div>

            <div class="text-h2 text-bold">
              {{ item.title || "Promoción" }}
              <span v-if="item.highlight">{{ item.highlight }}</span>
            </div>

            <p v-if="item.subtitle" class="hero-subtitle">
              {{ item.subtitle }}
            </p>

            <p v-if="item.description" class="hero-description">
              {{ item.description }}
            </p>

            <div v-if="shouldShowCta(item)" class="row items-center q-gutter-sm hero-actions">
              <q-btn
                unelevated
                no-caps
                size="lg"
                class="hero-cta"
                :icon="item.isDefault ? defaultCtaIcon : undefined"
                :label="item.cta?.label || defaultCtaLabel"
                :icon-right="item.isDefault ? undefined : 'arrow_forward'"
                @click="handleCtaClick(item)"
              />
            </div>
          </div>

          <div class="hero-visual">
            <q-img
              :src="getPromotionImage(item) || oficina"
              :alt="item.media?.alt || item.title || 'Créditos Guimanfer'"
              fit="cover"
              class="hero-image-card"
            />
          </div>
        </div>
      </q-carousel-slide>
    </q-carousel>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  promotions: {
    type: Array,
    default: () => [],
  },

  selectedCompany: {
    type: Object,
    default: null,
  },

  isLoggedIn: {
    type: Boolean,
    default: false,
  },

  oficina: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["go-portal", "promotion-click"]);

const activeSlide = ref(null);

const defaultCtaLabel = computed(() =>
  props.isLoggedIn ? "Ir al portal" : "Acceder al portal",
);

const defaultCtaIcon = computed(() =>
  props.isLoggedIn ? "dashboard" : "login",
);

const defaultHeroSlide = computed(() => ({
  _id: "__default_hero__",
  isDefault: true,
  badge: "Créditos Guimanfer",
  title: "Promociones y comunicados",
  highlight: "",
  subtitle: "",
  description:
    "Aquí se mostrarán anuncios, beneficios, noticias internas y campañas publicadas desde el panel administrativo.",
  media: {
    desktopImage: props.oficina,
    mobileImage: props.oficina,
    alt: "Oficina Créditos Guimanfer",
  },
  style: {
    background:
      "linear-gradient(135deg, #101828, rgba(var(--primary-rgb), 0.95))",
    textColor: "#ffffff",
  },
  cta: {
    label: defaultCtaLabel.value,
    action: "PORTAL",
  },
}));

const heroSlides = computed(() => {
  if (props.promotions?.length) {
    return props.promotions;
  }

  return [defaultHeroSlide.value];
});

watch(
  heroSlides,
  (slides) => {
    const currentSlideStillExists = slides.some(
      (item) => item._id === activeSlide.value,
    );

    if (!currentSlideStillExists) {
      activeSlide.value = slides[0]?._id || null;
    }
  },
  {
    immediate: true,
  },
);

const shouldShowCta = (item) => {
  if (item?.isDefault) return true;

  return Boolean(item?.cta?.action && item.cta.action !== "NONE");
};

const handleCtaClick = (item) => {
  if (item?.isDefault) {
    emit("go-portal");
    return;
  }

  emit("promotion-click", item);
};

const getPromotionImage = (item) => {
  return item?.media?.desktopImage || item?.media?.mobileImage || "";
};

const getHeroStyle = (item) => {
  return {
    background:
      item?.style?.background ||
      "linear-gradient(135deg, #101828, #344054)",
    color: item?.style?.textColor || "#ffffff",
  };
};
</script>

<style scoped>
.public-container {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
}

.hero-section {
  background: #101828;
}

.hero-carousel {
  height: 720px;
}

.hero-slide {
  position: relative;
  overflow: hidden;
}

.hero-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.16) 1px, transparent 1px);
  background-size: 42px 42px;
  pointer-events: none;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at 78% 42%,
      rgba(var(--primary-rgb), 0.32),
      transparent 24%
    ),
    linear-gradient(90deg, rgba(16, 24, 40, 0.48), rgba(16, 24, 40, 0.06));
  pointer-events: none;
}

.hero-grid {
  position: relative;
  z-index: 1;
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(390px, 0.82fr);
  align-items: center;
  gap: 54px;
}

.hero-copy {
  color: inherit;
  max-width: 720px;
}

.hero-badges-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}

.hero-badge {
  background: rgba(255, 255, 255, 0.16);
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.24);
  padding: 8px 14px;
  font-weight: 800;
}

.hero-company-badge {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--landing-primary);
  border: 1px solid rgba(255, 255, 255, 0.32);
  font-weight: 900;
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(44px, 5.5vw, 86px);
  line-height: 0.92;
  letter-spacing: -3px;
  font-weight: 950;
}

.hero-copy h1 span {
  display: block;
  color: white;
  opacity: 0.82;
}

.hero-subtitle {
  margin: 20px 0 0;
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 800;
  opacity: 0.94;
}

.hero-description {
  margin: 20px 0 34px;
  font-size: clamp(17px, 1.7vw, 22px);
  line-height: 1.45;
  opacity: 0.9;
  max-width: 760px;
}

.hero-actions {
  margin-top: 8px;
}

.hero-cta {
  background: white;
  color: var(--primary);
  border-radius: 999px;
  padding-left: 28px;
  padding-right: 28px;
  font-weight: 900;
  box-shadow: 0 16px 34px rgba(255, 255, 255, 0.16);
  color: var(--landing-primary);
}

.hero-visual {
  min-height: 500px;
  display: grid;
  place-items: center;
}

.hero-image-card {
  width: 100%;
  height: 500px;
  border-radius: 34px;
  overflow: hidden;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.22);
}

@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-carousel {
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
}
</style>