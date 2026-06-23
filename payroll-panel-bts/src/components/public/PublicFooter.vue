<template>
  <footer class="public-footer">
    <div class="footer-glow footer-glow-left"></div>
    <div class="footer-glow footer-glow-right"></div>

    <div class="public-container footer-grid">
      <div>
        <div class="footer-brand row items-center no-wrap">
          <img :src="displayLogo" :alt="displayName" class="footer-logo" />

          <div class="footer-brand-text">
            <div class="footer-title">
              {{ displayName }}
            </div>

            <div class="footer-subtitle">
              {{ displaySubtitle }}
            </div>
          </div>
        </div>

        <p class="footer-description">
          {{ displayDescription }}
        </p>

        <div v-if="hasContactInfo" class="footer-contact-list">
          <div v-if="company?.phone" class="footer-contact-item">
            <q-icon name="phone" size="18px" />
            <span>{{ company.phone }}</span>
          </div>

          <div v-if="company?.email" class="footer-contact-item">
            <q-icon name="mail" size="18px" />
            <span>{{ company.email }}</span>
          </div>

          <div v-if="company?.website" class="footer-contact-item">
            <q-icon name="language" size="18px" />
            <span>{{ company.website }}</span>
          </div>
        </div>
      </div>

      <div class="footer-links">
        <div class="footer-heading">Accesos</div>

        <button type="button" @click="$emit('go-section', 'inicio')">
          Inicio
        </button>

        <button type="button" @click="$emit('go-section', 'promociones')">
          Promociones
        </button>

        <button type="button" @click="$emit('go-section', 'empresa')">
          Nuestra Familia
        </button>

        <button type="button" @click="$emit('go-section', 'trayectoria')">
          Trayectoria
        </button>

        <button type="button" @click="$emit('go-section', 'valores')">
          Misión y Valores
        </button>

        <button type="button" @click="$emit('go-portal')">
          Portal RRHH
        </button>
      </div>

      <div class="footer-contact">
        <div class="footer-heading">Portal de colaboradores</div>

        <div class="footer-note">
          {{ displayPortalDescription }}
        </div>

        <q-btn
          unelevated
          no-caps
          class="footer-btn"
          icon-right="login"
          :label="portalButtonLabel"
          @click="$emit('go-portal')"
        />
      </div>
    </div>

    <div class="footer-bottom">
      <div class="public-container footer-bottom-content">
        <div>© {{ currentYear }} {{ displayName }}.</div>
        <div>Todos los derechos reservados.</div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from "vue";
import fallbackLogo from "src/assets/logo.png";

const props = defineProps({
  logo: {
    type: String,
    default: "",
  },
  brandName: {
    type: String,
    default: "",
  },
  brandSubtitle: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  company: {
    type: Object,
    default: null,
  },
  portalDescription: {
    type: String,
    default:
      "Accede al portal privado para consultar tus informaciones, solicitudes, ponches, entrenamientos y comunicaciones internas.",
  },
  portalButtonLabel: {
    type: String,
    default: "Acceder al portal",
  },
});

defineEmits(["go-section", "go-portal"]);

const currentYear = new Date().getFullYear();

const displayLogo = computed(() => {
  return props.logo || props.company?.logo || props.company?.logoUrl || fallbackLogo;
});

const displayName = computed(() => {
  return (
    props.brandName ||
    props.company?.tradeName ||
    props.company?.legalName ||
    props.company?.name ||
    "Créditos Guimanfer"
  );
});

const displaySubtitle = computed(() => {
  return (
    props.brandSubtitle ||
    props.company?.publicProfile?.headline ||
    "Soluciones a tiempo"
  );
});

const displayDescription = computed(() => {
  return (
    props.description ||
    props.company?.publicProfile?.aboutDescription ||
    "Empresa líder en soluciones para colaboradores, comunicaciones internas, beneficios y servicios empresariales."
  );
});

const displayPortalDescription = computed(() => {
  return props.portalDescription;
});

const hasContactInfo = computed(() => {
  return Boolean(props.company?.phone || props.company?.email || props.company?.website);
});
</script>

<style scoped lang="scss">
.public-footer {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 12% 20%,
      rgba(var(--landing-primary-rgb), 0.22),
      transparent 28%
    ),
    radial-gradient(
      circle at 90% 12%,
      rgba(var(--landing-primary-rgb), 0.16),
      transparent 26%
    ),
    linear-gradient(135deg, #101828 0%, #111827 48%, #0b1220 100%);
  color: white;
  padding-top: 58px;
}

.public-container {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
}

.footer-glow {
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 999px;
  filter: blur(70px);
  opacity: 0.32;
  pointer-events: none;
  background: var(--landing-primary, var(--q-primary));
}

.footer-glow-left {
  left: -90px;
  top: 20px;
}

.footer-glow-right {
  right: -120px;
  bottom: 10px;
}

.footer-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.25fr 0.7fr 1fr;
  gap: 38px;
  padding-bottom: 44px;
}

.footer-brand {
  gap: 12px;
}

.footer-logo {
  width: 60px;
  height: 60px;
  object-fit: contain;
  background: white;
  border-radius: 18px;
  padding: 6px;
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.18);
}

.footer-brand-text {
  min-width: 0;
}

.footer-title {
  max-width: 320px;
  font-size: 1.06rem;
  font-weight: 950;
  text-transform: uppercase;
  line-height: 1.05;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.footer-subtitle {
  max-width: 320px;
  margin-top: 4px;
  font-size: 0.82rem;
  opacity: 0.72;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.footer-description {
  margin: 22px 0 0;
  max-width: 540px;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.7;
}

.footer-contact-list {
  margin-top: 20px;
  display: grid;
  gap: 10px;
}

.footer-contact-item {
  width: fit-content;
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.86rem;
  font-weight: 700;
  word-break: break-word;
}

.footer-contact-item .q-icon {
  color: var(--landing-primary, var(--q-primary));
}

.footer-heading {
  font-size: 0.92rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
}

.footer-links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.footer-links button {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  padding: 6px 0;
  cursor: pointer;
  font-weight: 700;
  transition:
    color 0.18s ease,
    transform 0.18s ease;
}

.footer-links button:hover {
  color: white;
  transform: translateX(3px);
}

.footer-note {
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.6;
}

.footer-btn {
  margin-top: 18px;
  border-radius: 999px;
  font-weight: 850;
  color: white;
  background: var(--landing-primary, var(--q-primary));
  box-shadow: 0 18px 38px rgba(var(--landing-primary-rgb), 0.22);
}

.company-code-pill {
  width: fit-content;
  margin-top: 16px;
  padding: 7px 12px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.76rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.company-code-pill .q-icon {
  color: var(--landing-primary, var(--q-primary));
}

.footer-bottom {
  position: relative;
  z-index: 1;
  padding: 16px 0;
  color: rgba(255, 255, 255, 0.58);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.84rem;
}

.footer-bottom-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 900px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .public-container {
    width: min(100% - 22px, 1180px);
  }

  .footer-title,
  .footer-subtitle {
    max-width: calc(100vw - 120px);
  }

  .footer-bottom-content {
    display: block;
  }

  .footer-bottom-content > div + div {
    margin-top: 4px;
  }
}
</style>