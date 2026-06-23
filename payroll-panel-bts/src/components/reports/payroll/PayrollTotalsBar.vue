<template>
  <q-card flat bordered class="payroll-totals-card q-mb-md">
    <q-card-section class="q-pa-md">
      <div class="row items-stretch q-col-gutter-md">
        <!-- TOTAL HORAS -->
        <div class="col-12 col-sm-6 col-md-3">
          <div class="metric-card">
            <div class="metric-icon metric-icon--hours">
              <q-icon name="schedule" size="24px" />
            </div>

            <div class="metric-content">
              <div class="metric-label">Total horas</div>
              <div class="metric-value">{{ hoursLabel }}</div>
              <div class="metric-caption">
                Minutos trabajados: {{ totalWorkedMinutes }}
              </div>
            </div>
          </div>
        </div>

        <!-- EMPLEADOS -->
        <div class="col-12 col-sm-6 col-md-3">
          <button
            type="button"
            class="metric-card metric-button"
            @click="emit('open-employees')"
          >
            <div class="metric-icon metric-icon--employees">
              <q-icon name="groups" size="24px" />
            </div>

            <div class="metric-content">
              <div class="metric-label">Empleados</div>
              <div class="metric-value">{{ employeesCount }}</div>
              <div class="metric-caption">
                Ver y ajustar selección
              </div>
            </div>
          </button>
        </div>

        <!-- BRUTO HORAS -->
        <div v-if="canViewDeposit" class="col-12 col-sm-6 col-md-3">
          <div class="metric-card">
            <div class="metric-icon metric-icon--gross">
              <q-icon name="stacked_line_chart" size="24px" />
            </div>

            <div class="metric-content">
              <div class="metric-label">Bruto por horas</div>
              <div class="metric-value money-value">
                {{ money(totalGross) }}
              </div>
              <div class="metric-caption">
                Empleados por hora
              </div>
            </div>
          </div>
        </div>

        <!-- A DEPOSITAR -->
        <div v-if="canViewDeposit" class="col-12 col-sm-6 col-md-3">
          <div class="metric-card metric-card--primary">
            <div class="metric-icon metric-icon--deposit">
              <q-icon name="payments" size="24px" />
            </div>

            <div class="metric-content">
              <div class="metric-label">A depositar</div>
              <div class="metric-value money-value">
                {{ money(totals.totalNetoADepositar) }}
              </div>
              <div class="metric-caption">
                Neto total de nómina
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RESUMEN DE DESCUENTOS -->
      <div
        v-if="canViewDeposit"
        class="row q-col-gutter-sm q-mt-md"
      >
        <div class="col-12 col-sm-4">
          <div class="mini-stat">
            <q-icon name="timer_off" color="orange" size="18px" />
            <span>Tardanzas:</span>
            <b>{{ money(totals.totalDiscountTardanza) }}</b>
          </div>
        </div>

        <div class="col-12 col-sm-4">
          <div class="mini-stat">
            <q-icon name="event_busy" color="negative" size="18px" />
            <span>Ausencias:</span>
            <b>{{ money(totals.totalDiscountAusencia) }}</b>
          </div>
        </div>

        <div class="col-12 col-sm-4">
          <div class="mini-stat mini-stat--strong">
            <q-icon name="remove_circle" color="negative" size="18px" />
            <span>Total descuentos:</span>
            <b>{{ money(totals.totalDiscounts) }}</b>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  totals: { type: Object, required: true },
  totalGross: { type: Number, default: 0 },
  employeesCount: { type: Number, default: 0 },
  canViewDeposit: { type: Boolean, default: false },
});

const emit = defineEmits(["open-employees"]);

const totalWorkedMinutes = computed(() => {
  return Number(props.totals?.totalWorkedHours || 0);
});

const hoursLabel = computed(() => {
  const mins = totalWorkedMinutes.value;

  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
});

const money = (n) => {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(Number(n || 0));
};
</script>

<style scoped>
.payroll-totals-card {
  border-radius: 22px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(23, 141, 210, 0.08), transparent 32%),
    #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.05);
}

.metric-card {
  width: 100%;
  height: 100%;
  min-height: 112px;
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  gap: 14px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.metric-button {
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.metric-card:hover {
  transform: translateY(-2px);
  border-color: rgba(23, 141, 210, 0.25);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.metric-card--primary {
  background: linear-gradient(135deg, var(--q-primary), #1a2436);
  color: #ffffff;
  border: none;
}

.metric-icon {
  width: 52px;
  height: 52px;
  min-width: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-icon--hours {
  background: rgba(25, 118, 210, 0.1);
  color: #1976d2;
}

.metric-icon--employees {
  background: rgba(46, 125, 50, 0.1);
  color: #2e7d32;
}

.metric-icon--gross {
  background: rgba(251, 140, 0, 0.12);
  color: #ef6c00;
}

.metric-icon--deposit {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.metric-content {
  min-width: 0;
}

.metric-label {
  font-size: 0.78rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-card--primary .metric-label {
  color: rgba(255, 255, 255, 0.78);
}

.metric-value {
  margin-top: 3px;
  font-size: 1.35rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.1;
}

.metric-card--primary .metric-value {
  color: #ffffff;
}

.money-value {
  font-size: 1.15rem;
}

.metric-caption {
  margin-top: 5px;
  font-size: 0.78rem;
  color: #94a3b8;
}

.metric-card--primary .metric-caption {
  color: rgba(255, 255, 255, 0.72);
}

.mini-stat {
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 0.84rem;
}

.mini-stat b {
  margin-left: auto;
  color: #0f172a;
  font-weight: 900;
}

.mini-stat--strong {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.14);
}

@media (max-width: 599px) {
  .metric-card {
    min-height: 96px;
    padding: 14px;
  }

  .metric-icon {
    width: 46px;
    height: 46px;
    min-width: 46px;
    border-radius: 14px;
  }

  .metric-value {
    font-size: 1.18rem;
  }

  .money-value {
    font-size: 1rem;
  }
}
</style>
