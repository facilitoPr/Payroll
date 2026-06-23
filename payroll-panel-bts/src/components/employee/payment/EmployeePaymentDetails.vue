<template>
  <div>
    <q-dialog v-model="dialog" persistent :maximized="$q.screen.lt.sm">
      <q-card class="payment-dialog column no-wrap">
        <!-- HEADER -->
        <q-card-section
          class="dialog-header bg-primary row items-center justify-between"
        >
          <div class="row items-center no-wrap text-white">
            <div class="dialog-icon">
              <q-icon size="30px" name="price_check" color="white" />
            </div>

            <div>
              <div class="dialog-title">Detalle de pago</div>
              <div class="dialog-subtitle">
                {{ pago?.empleado?.nombre || "Resumen de nómina del empleado" }}
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
            @click="closeDialog"
          />
        </q-card-section>

        <q-separator />

        <!-- BODY -->
        <q-card-section class="payment-dialog-body">
          <template v-if="loading">
            <div class="q-gutter-md">
              <q-skeleton height="96px" class="rounded-skeleton" />
              <q-skeleton height="150px" class="rounded-skeleton" />
              <q-skeleton height="150px" class="rounded-skeleton" />
              <q-skeleton height="180px" class="rounded-skeleton" />
            </div>
          </template>

          <template v-else-if="pago">
            <!-- RESUMEN EMPLEADO -->
            <div class="summary-card q-mb-md">
              <div class="row items-center justify-between q-col-gutter-md">
                <div class="col-12 col-md">
                  <div class="employee-name">
                    {{ pago?.empleado?.nombre || "Empleado" }}
                  </div>

                  <div class="employee-meta">
                    {{ pago?.empleado?.tipoSalario || "Tipo de salario no definido" }}
                    ·
                    {{ pago?.sueldoPeriodo?.frecuencia || "Frecuencia no definida" }}
                  </div>
                </div>

                <div class="col-12 col-md-auto">
                  <q-badge rounded color="primary" class="summary-badge">
                    Neto período:
                    {{ formatCurrency(pago?.sueldoPeriodo?.neto) }}
                  </q-badge>
                </div>
              </div>
            </div>

            <!-- CARDS PRINCIPALES -->
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12 col-md-4">
                <q-card flat bordered class="metric-card">
                  <q-card-section>
                    <div class="metric-icon metric-icon--primary">
                      <q-icon name="payments" />
                    </div>

                    <div class="metric-label">Sueldo bruto mensual</div>
                    <div class="metric-value">
                      {{ formatCurrency(pago?.sueldoMensual?.bruto) }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-4">
                <q-card flat bordered class="metric-card">
                  <q-card-section>
                    <div class="metric-icon metric-icon--negative">
                      <q-icon name="remove_circle" />
                    </div>

                    <div class="metric-label">Deducciones mensuales</div>
                    <div class="metric-value">
                      {{ formatCurrency(pago?.sueldoMensual?.deducciones) }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-4">
                <q-card flat bordered class="metric-card metric-card--net">
                  <q-card-section>
                    <div class="metric-icon metric-icon--positive">
                      <q-icon name="check_circle" />
                    </div>

                    <div class="metric-label">Sueldo neto mensual</div>
                    <div class="metric-value">
                      {{ formatCurrency(pago?.sueldoMensual?.neto) }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <!-- ISR -->
            <q-card v-if="pago?.isr" flat bordered class="section-card q-mb-md">
              <q-card-section>
                <div class="section-header">
                  <div>
                    <div class="section-title">Información ISR</div>
                    <div class="section-subtitle">
                      Detalle del impuesto sobre la renta aplicado.
                    </div>
                  </div>

                  <q-avatar color="primary" text-color="white" size="42px">
                    <q-icon name="receipt_long" />
                  </q-avatar>
                </div>

                <div class="row q-col-gutter-md q-mt-sm">
                  <div class="col-12 col-md-4">
                    <div class="info-box">
                      <div class="info-label">Base ISR</div>
                      <div class="info-value">
                        {{ formatCurrency(pago.isr.baseISR) }}
                      </div>
                    </div>
                  </div>

                  <div class="col-12 col-md-4">
                    <div class="info-box">
                      <div class="info-label">ISR mensual</div>
                      <div class="info-value">
                        {{ formatCurrency(pago.isr.mensual) }}
                      </div>
                    </div>
                  </div>

                  <div class="col-12 col-md-4">
                    <div class="info-box">
                      <div class="info-label">ISR período</div>
                      <div class="info-value">
                        {{ formatCurrency(pago.isr.periodo) }}
                      </div>
                    </div>
                  </div>
                </div>

                <q-banner
                  v-if="pago.isr.bracket"
                  rounded
                  class="isr-banner q-mt-md"
                >
                  <template #avatar>
                    <q-icon name="info" color="primary" />
                  </template>

                  <div class="text-weight-bold">Tramo aplicado</div>
                  <div class="text-caption">
                    Desde {{ pago.isr.bracket.from }} hasta
                    {{ pago.isr.bracket.to ?? "∞" }} · Tasa
                    {{ formatRate(pago.isr.bracket.rate) }} · Fijo
                    {{ formatCurrency(pago.isr.bracket.fixedAmount) }}
                  </div>
                </q-banner>
              </q-card-section>
            </q-card>

            <!-- SUELDO POR PERIODO -->
            <q-card flat bordered class="section-card q-mb-md">
              <q-card-section>
                <div class="section-header">
                  <div>
                    <div class="section-title">Sueldo por período</div>
                    <div class="section-subtitle">
                      Valores calculados según la frecuencia de pago.
                    </div>
                  </div>

                  <q-avatar color="primary" text-color="white" size="42px">
                    <q-icon name="calendar_month" />
                  </q-avatar>
                </div>

                <q-list bordered separator class="modern-list q-mt-md">
                  <q-item
                    v-for="([key, value], index) in sueldoPeriodoSinFrecuencia"
                    :key="index"
                  >
                    <q-item-section>
                      <q-item-label class="list-label">
                        {{ formatPeriodKey(key) }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-item-label class="list-amount">
                        {{ formatCurrency(value) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>

            <!-- DEDUCCIONES -->
            <q-card flat bordered class="section-card">
              <q-card-section>
                <div class="section-header">
                  <div>
                    <div class="section-title">Deducciones aplicadas</div>
                    <div class="section-subtitle">
                      Desglose de los descuentos aplicados al período.
                    </div>
                  </div>

                  <q-avatar color="negative" text-color="white" size="42px">
                    <q-icon name="trending_down" />
                  </q-avatar>
                </div>

                <q-list
                  v-if="pago.detalleDeducciones?.length"
                  bordered
                  separator
                  class="modern-list q-mt-md"
                >
                  <q-item
                    v-for="(deduction, index) in pago.detalleDeducciones"
                    :key="index"
                  >
                    <q-item-section avatar>
                      <q-avatar size="34px" color="negative" text-color="white">
                        <q-icon name="remove" size="18px" />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="list-label">
                        {{ deduction.nombre }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ deduction.modo || "Deducción" }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-item-label class="list-amount text-negative">
                        {{ formatCurrency(deduction.montoPeriodo) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>

                <div v-else class="empty-deductions">
                  <q-icon name="check_circle" color="positive" size="38px" />
                  <div class="text-subtitle2 text-weight-bold q-mt-sm">
                    Sin deducciones aplicadas
                  </div>
                  <div class="text-caption text-grey-7">
                    Este empleado no tiene descuentos configurados para este período.
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </template>

          <template v-else>
            <div class="empty-state">
              <q-icon name="payments" size="54px" color="grey-5" />
              <div class="text-subtitle1 text-weight-bold q-mt-sm">
                No hay detalle disponible
              </div>
              <div class="text-caption text-grey-7">
                No se encontró información de pago para este empleado.
              </div>
            </div>
          </template>
        </q-card-section>

        <q-separator />

        <!-- ACTIONS -->
        <q-card-actions align="right" class="dialog-actions">
          <q-btn
            flat
            no-caps
            color="negative"
            label="Cerrar"
            icon="close"
            class="dialog-action-btn"
            :disable="loading"
            @click="closeDialog"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const $q = useQuasar();

const dialog = ref(false);
const loading = ref(false);
const pago = ref(null);

const sueldoPeriodoSinFrecuencia = computed(() => {
  if (!pago.value?.sueldoPeriodo) return [];

  const { frecuencia, ...resto } = pago.value.sueldoPeriodo;

  return Object.entries(resto).filter(([, value]) => {
    return typeof value === "number";
  });
});

function formatCurrency(value) {
  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
  });
}

function formatRate(rate) {
  const numberValue = Number(rate || 0);

  return `${(numberValue * 100).toFixed(0)}%`;
}

function formatPeriodKey(key) {
  const labels = {
    bruto: "Sueldo bruto",
    deducciones: "Deducciones",
    neto: "Sueldo neto",
    frecuencia: "Frecuencia",
    horasTrabajadas: "Horas trabajadas",
    sueldoBase: "Sueldo base",
    totalHoras: "Total horas",
    totalBruto: "Total bruto",
    totalDeducciones: "Total deducciones",
    totalNeto: "Total neto",
  };

  return labels[key] || humanizeKey(key);
}

function humanizeKey(key) {
  return String(key || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function closeDialog() {
  if (loading.value) return;

  dialog.value = false;
}

async function verDetalle(item) {
  dialog.value = true;
  loading.value = true;
  pago.value = null;

  try {
    const resp = await methodsHttp.getApi(
      `employee-payment-management/getEmployeePaymentSummary/${item._id}`,
    );

    if (resp?.ok) {
      const { ok, mensaje, message, ...data } = resp;
      pago.value = data;
      return;
    }

    $q.notify({
      type: "negative",
      message: resp?.mensaje || "No se pudo obtener el detalle de pago.",
    });
  } catch (error) {
    console.error(error);

    $q.notify({
      type: "negative",
      message: "Error cargando el detalle de pago.",
    });
  } finally {
    loading.value = false;
  }
}

defineExpose({ verDetalle });
</script>

<style scoped>
.payment-dialog {
  width: 820px;
  max-width: 96vw;
  max-height: 92vh;
  border-radius: 22px;
  overflow: hidden;
}

.dialog-header {
  min-height: 78px;
  padding: 16px 20px;
}

.dialog-icon {
  width: 46px;
  height: 46px;
  min-width: 46px;
  margin-right: 12px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.dialog-title {
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.05;
}

.dialog-subtitle {
  margin-top: 4px;
  max-width: 560px;
  font-size: 0.78rem;
  opacity: 0.86;
}

.payment-dialog-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(92vh - 154px);
  padding: 18px;
  background: #f8fafc;
}

.rounded-skeleton {
  border-radius: 18px;
}

.summary-card,
.section-card,
.metric-card {
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.summary-card {
  padding: 16px;
}

.employee-name {
  color: #0f172a;
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.1;
}

.employee-meta {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 600;
}

.summary-badge {
  padding: 7px 12px;
  font-weight: 800;
}

.metric-card {
  height: 100%;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
}

.metric-card--net {
  border-color: rgba(33, 186, 69, 0.24);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: white;
  font-size: 24px;
  margin-bottom: 12px;
}

.metric-icon--primary {
  background: var(--q-primary);
}

.metric-icon--negative {
  background: #c10015;
}

.metric-icon--positive {
  background: #21ba45;
}

.metric-label {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value {
  margin-top: 6px;
  color: #0f172a;
  font-size: 1.3rem;
  font-weight: 950;
  line-height: 1;
}

.section-card {
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  color: #0f172a;
  font-size: 0.98rem;
  font-weight: 900;
}

.section-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
}

.info-box {
  padding: 12px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.info-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-value {
  margin-top: 5px;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.isr-banner {
  color: #1e3a8a;
  background: #dbeafe;
  border: 1px solid rgba(37, 99, 235, 0.14);
}

.modern-list {
  border-radius: 18px;
  overflow: hidden;
  background: #ffffff;
  border-color: rgba(15, 23, 42, 0.08);
}

.list-label {
  color: #0f172a;
  font-weight: 800;
}

.list-amount {
  color: #0f172a;
  font-weight: 900;
}

.empty-deductions,
.empty-state {
  min-height: 180px;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  color: #64748b;
}

.empty-state {
  min-height: 340px;
}

.dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
  box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.04);
}

.dialog-action-btn {
  border-radius: 999px;
  padding-left: 18px;
  padding-right: 18px;
  font-weight: 800;
}

@media (max-width: 768px) {
  .payment-dialog {
    width: 96vw;
    max-height: 94vh;
  }

  .payment-dialog-body {
    max-height: calc(94vh - 154px);
    padding: 12px;
  }

  .metric-value {
    font-size: 1.15rem;
  }
}
</style>