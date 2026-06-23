<template>
  <q-card v-if="quote" flat bordered class="quote-card">
    <q-card-section>
      <div class="table-title">Resumen del préstamo</div>
      <div class="table-subtitle">
        Revisa la tasa, cuotas, intereses y total a pagar antes de aceptar.
      </div>

      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-12 col-md-3">
          <div class="mini-label">Tasa</div>
          <div class="mini-value">
            {{ numberValue(quote?.loanProviderSnapshot?.interestRate) }}%
            {{ getLoanRateTypeText(quote?.loanProviderSnapshot?.interestRateType) || "-" }}
          </div>
        </div>

        <div class="col-12 col-md-3">
          <div class="mini-label">Cuota estimada</div>
          <div class="mini-value">
            {{ money(quote?.loanQuote?.installmentAmount) }}
          </div>
        </div>

        <div class="col-12 col-md-3">
          <div class="mini-label">Total intereses</div>
          <div class="mini-value">
            {{ money(quote?.loanQuote?.totalInterest) }}
          </div>
        </div>

        <div class="col-12 col-md-3">
          <div class="mini-label">Total a pagar</div>
          <div class="mini-value">
            {{ money(quote?.loanQuote?.totalToPay) }}
          </div>
        </div>

        <div class="col-12 col-md-3">
          <div class="mini-label">Monto solicitado</div>
          <div class="mini-value">
            {{ money(quote?.loanQuote?.principal) }}
          </div>
        </div>

        <div class="col-12 col-md-3">
          <div class="mini-label">Cuotas</div>
          <div class="mini-value">
            {{ numberValue(quote?.loanQuote?.installments) }}
          </div>
        </div>

        <div class="col-12 col-md-3">
          <div class="mini-label">Días garantía</div>
          <div class="mini-value">
            {{ numberValue(quote?.vacationSnapshot?.guaranteedDays) }} día(s)
          </div>
        </div>

        <div class="col-12 col-md-3">
          <div class="mini-label">Valor garantía</div>
          <div class="mini-value">
            {{ money(quote?.vacationSnapshot?.estimatedGuaranteeAmount) }}
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { getLoanRateTypeText } from 'src/helpers/catalogs/loan.catalog';

defineProps({
  quote: {
    type: Object,
    default: null,
  },
});

const money = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount);
};

const numberValue = (value) => {
  const n = Number(value || 0);
  return Number.isInteger(n) ? n : n.toFixed(2);
};
</script>

<style scoped>
.quote-card {
  border-radius: 20px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.table-title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.table-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}

.mini-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mini-value {
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 900;
  margin-top: 4px;
}
</style>