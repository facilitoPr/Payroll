<template>
  <section class="company-menu-section">
    <div class="public-container">
      <div class="company-menu-shell">
        <div v-if="loading" class="company-menu-list centered">
          <div
            v-for="index in 6"
            :key="index"
            class="company-tab company-tab-skeleton"
          >
            <q-skeleton type="text" width="105px" />
          </div>
        </div>

        <div v-else class="company-menu-list centered">
          <button
            v-for="company in companies"
            :key="company._id"
            type="button"
            class="company-tab"
            :class="{ active: selectedCompany?._id === company._id }"
            @click="emit('select', company)"
          >
            <span class="company-name">
              {{ getCompanyName(company) }}
            </span>
          </button>

          <div v-if="!companies.length" class="empty-companies">
            No hay empresas disponibles.
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  companies: {
    type: Array,
    default: () => [],
  },
  selectedCompany: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select"]);

const getCompanyName = (company) => {
  return company?.tradeName || company?.legalName || company?.name || "Empresa";
};
</script>

<style scoped>
.company-menu-section {
  position: sticky;
  top: 78px;
  z-index: 18;
  padding: 10px 0;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(16, 24, 40, 0.08);
}

.public-container {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
}

.company-menu-shell {
  width: 100%;
  display: flex;
  justify-content: center;
}

.company-menu-list {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 4px 7px;
  scroll-snap-type: x proximity;
}

.company-menu-list.centered {
  justify-content: center;
}

.company-menu-list::-webkit-scrollbar {
  height: 5px;
}

.company-menu-list::-webkit-scrollbar-thumb {
  background: rgba(16, 24, 40, 0.14);
  border-radius: 999px;
}

.company-tab {
  position: relative;
  padding: 8px 18px;
  border: 1px solid rgba(16, 24, 40, 0.08);
  border-radius: 999px;
  background: #ffffff;
  color: #344054;
  gap: 3px;
  cursor: pointer;
  scroll-snap-align: center;
  box-shadow: 0 8px 22px rgba(16, 24, 40, 0.04);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
}

.company-tab:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--landing-primary-rgb), 0.24);
}

.company-tab.active {
  color: #ffffff;
  background: linear-gradient(
    135deg,
    var(--landing-primary, var(--primary)),
    var(--landing-secondary, #222c5b)
  );
  border-color: transparent;
}

.company-tab-skeleton {
  min-width: 132px;
  cursor: default;
  pointer-events: none;
}

.company-name {
  max-width: 170px;
  color: inherit;
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1.1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.company-code {
  max-width: 170px;
  color: inherit;
  opacity: 0.72;
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1;
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-companies {
  min-height: 42px;
  padding: 10px 18px;
  border-radius: 999px;
  color: #667085;
  background: #ffffff;
  border: 1px dashed rgba(16, 24, 40, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 700;
}

@media (max-width: 1024px) {
  .company-menu-section {
    top: 70px;
  }

  .company-menu-list.centered {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .public-container {
    width: min(100% - 22px, 1180px);
  }

  .company-tab {
    min-height: 40px;
    padding: 8px 15px;
  }

  .company-name {
    max-width: 140px;
    font-size: 0.78rem;
  }

  .company-code {
    max-width: 140px;
  }
}
</style>