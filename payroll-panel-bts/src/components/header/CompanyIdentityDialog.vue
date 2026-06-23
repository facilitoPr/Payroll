<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    maximized
  >
    <q-card class="company-dialog">
      <div class="dialog-shell">
        <div class="dialog-top row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="hero-badge">
              <q-icon name="corporate_fare" size="18px" class="q-mr-sm" />
              Nuestra identidad
            </div>

            <div class="text-h4 text-weight-bold q-mt-md">
              Créditos Guimanfer
            </div>

            <div class="text-subtitle1 text-grey-7 q-mt-sm hero-description">
              Soluciones a tiempo, con una cultura centrada en confianza,
              innovación, compromiso y cercanía con el cliente.
            </div>
          </div>

          <div class="col-auto">
            <q-btn
              flat
              round
              dense
              icon="close"
              color="grey-7"
              @click="emit('update:modelValue', false)"
            />
          </div>
        </div>

        <!-- NUEVO BLOQUE AL INICIO -->
        <q-card flat class="intro-card q-mt-lg">
          <q-card-section>
            <div class="section-chip">
              <q-icon name="groups" size="18px" class="q-mr-sm" />
              Nuestra Familia
            </div>

            <div class="text-h6 text-weight-bold q-mt-md">
              Créditos Guimanfer: soluciones a tiempo
            </div>

            <div class="section-text q-mt-md">
              En Créditos Guimanfer, nos dedicamos a proporcionar soluciones
              financieras confiables y accesibles a nuestros clientes. Con años
              de experiencia en el sector financiero, nos hemos destacado por
              nuestra ética, transparencia y compromiso con la satisfacción del
              cliente. Estamos comprometidos en ayudar a nuestros clientes a
              alcanzar sus metas financieras y a superar sus desafíos económicos.
            </div>
          </q-card-section>
        </q-card>

        <div class="row q-col-gutter-lg q-mt-sm">
          <div class="col-12 col-md-6">
            <q-card flat class="hero-card mission-card">
              <q-card-section>
                <div class="section-chip">
                  <q-icon name="flag" size="18px" class="q-mr-sm" />
                  Misión
                </div>

                <div class="section-text q-mt-md">
                  Ser una empresa líder en el sector financiero, brindando
                  servicios de calidad, eficiencia e innovación. Contando con un
                  equipo profesional altamente comprometido.
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-6">
            <q-card flat class="hero-card vision-card">
              <q-card-section>
                <div class="section-chip">
                  <q-icon name="visibility" size="18px" class="q-mr-sm" />
                  Visión
                </div>

                <div class="section-text q-mt-md">
                  Ofrecer soluciones financieras confiables que respondan a las
                  necesidades de nuestros clientes actuales y potenciales,
                  impulsando el desarrollo tanto a nivel interno como externo.
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <q-card flat class="values-summary-card q-mt-lg">
          <q-card-section>
            <div class="row items-center justify-between q-col-gutter-md">
              <div class="col-12 col-md">
                <div class="text-h6 text-weight-bold">Valores</div>
                <div class="text-body2 text-grey-7 q-mt-xs">
                  Innovación, Compromiso, Trabajo en Equipo, Orientación al
                  cliente, Orientación a resultados, Integridad y Flexibilidad.
                </div>
              </div>
            </div>

            <div class="chips-wrap q-mt-md">
              <q-chip
                v-for="item in valueCards"
                :key="item.title"
                outline
                color="primary"
                text-color="primary"
                class="value-chip"
              >
                <q-icon :name="item.icon" size="16px" class="q-mr-xs" />
                {{ item.title }}
              </q-chip>
            </div>
          </q-card-section>
        </q-card>

        <div class="row q-col-gutter-lg q-mt-sm">
          <div
            v-for="item in valueCards"
            :key="item.title"
            class="col-12 col-sm-6 col-lg-4"
          >
            <q-card flat class="value-card full-height">
              <q-card-section>
                <div class="value-icon">
                  <q-icon :name="item.icon" size="24px" color="primary" />
                </div>

                <div class="text-subtitle1 text-weight-bold q-mt-md">
                  {{ item.title }}
                </div>

                <div class="text-body2 text-grey-7 q-mt-sm">
                  {{ item.description }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const valueCards = [
  {
    title: "Innovación",
    icon: "lightbulb",
    description:
      "Generamos ideas y soluciones novedosas para nuestros clientes, buscando formas nuevas y eficaces para la mejora continua.",
  },
  {
    title: "Compromiso",
    icon: "verified",
    description:
      "Nos esforzamos por alcanzar altos estándares de excelencia, promoviendo el compromiso de nuestra gente con el logro de los resultados.",
  },
  {
    title: "Trabajo en Equipo",
    icon: "groups",
    description:
      "Promovemos el espíritu de equipo en toda la organización, con un ambiente amistoso basado en el respeto y la cooperación.",
  },
  {
    title: "Orientación al cliente",
    icon: "support_agent",
    description:
      "Estamos comprometidos con nuestros clientes, nos adelantamos a sus necesidades y construimos relaciones de confianza y fidelización.",
  },
  {
    title: "Orientación a resultados",
    icon: "insights",
    description:
      "Ayudamos a nuestra gente a alcanzar sus metas, definimos objetivos claros y gestionamos de forma efectiva el tiempo y los recursos.",
  },
  {
    title: "Integridad",
    icon: "gpp_good",
    description:
      "Trabajamos apegados a principios éticos que promueven el respeto hacia colaboradores, clientes y la sociedad.",
  },
  {
    title: "Flexibilidad",
    icon: "sync_alt",
    description:
      "Nos adaptamos con facilidad a situaciones diversas, valorando distintas opiniones y alineando el enfoque personal con el de la organización.",
  },
];
</script>

<style scoped>
.intro-card {
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(255, 255, 255, 0.97));
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
}

.company-dialog {
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 22%),
    linear-gradient(180deg, #f8fbff 0%, #f5f7fb 100%);
  min-height: 100vh;
}

.dialog-shell {
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px;
}

.dialog-top {
  padding: 4px 2px 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: var(--primary-color, #1976d2);
  font-weight: 700;
  font-size: 0.92rem;
}

.hero-description {
  max-width: 760px;
  line-height: 1.7;
}

.hero-card,
.values-summary-card,
.value-card,
.intro-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
}

.hero-card {
  min-height: 100%;
}

.intro-card {
  background:
    linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(255, 255, 255, 0.97));
}

.mission-card {
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(255, 255, 255, 0.96));
}

.vision-card {
  background:
    linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(255, 255, 255, 0.96));
}

.section-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 8px 14px;
  background: rgba(15, 23, 42, 0.05);
  font-weight: 700;
}

.section-text {
  font-size: 1rem;
  line-height: 1.8;
  color: #334155;
}

.chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.value-chip {
  border-radius: 999px;
  padding: 6px 10px;
}

.value-card {
  height: 100%;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.value-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 50px rgba(15, 23, 42, 0.08);
}

.value-icon {
  width: 50px;
  height: 50px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 99, 235, 0.08);
}

@media (max-width: 768px) {
  .dialog-shell {
    padding: 18px;
  }
}
</style>