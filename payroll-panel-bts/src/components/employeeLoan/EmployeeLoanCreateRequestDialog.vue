<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card class="loan-dialog">
      <q-inner-loading
        :showing="saving"
        label="Procesando..."
        label-class="text-primary"
      />

      <q-card-section class="loan-dialog-header">
        <div class="header-left">
          <div class="header-icon">
            <q-icon name="payments" size="30px" />
          </div>

          <div>
            <div class="header-title">
              Nueva solicitud de préstamo
            </div>

            <div class="header-subtitle">
              Selecciona los días de vacaciones y el sistema calculará
              automáticamente el monto equivalente.
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          color="white"
          icon="close"
          :disable="saving"
          @click="closeDialog"
        />
      </q-card-section>

      <q-card-section class="loan-dialog-body">
        <div class="loan-layout">
          <div class="loan-main">
            <q-card
              flat
              bordered
              class="section-card eligibility-card"
            >
              <q-card-section>
                <div class="section-heading">
                  <div>
                    <div class="section-title">
                      Elegibilidad disponible
                    </div>

                    <div class="section-subtitle">
                      Límites calculados usando el balance de vacaciones,
                      el valor del día y las reglas del producto.
                    </div>
                  </div>

                  <q-chip
                    dense
                    color="blue-1"
                    text-color="primary"
                    icon="verified"
                  >
                    Activa
                  </q-chip>
                </div>

                <div class="eligibility-grid q-mt-md">
                  <div class="eligibility-item">
                    <div class="mini-label">
                      Días disponibles
                    </div>

                    <div class="mini-value">
                      {{ numberValue(loanVacationDays) }} día(s)
                    </div>
                  </div>

                  <div class="eligibility-item">
                    <div class="mini-label">
                      Máximo de días
                    </div>

                    <div class="mini-value">
                      {{ numberValue(effectiveMaxGuaranteeDays) }} día(s)
                    </div>
                  </div>

                  <div class="eligibility-item">
                    <div class="mini-label">
                      Valor por día
                    </div>

                    <div class="mini-value">
                      {{ money(vacationDayAmount) }}
                    </div>
                  </div>

                  <div class="eligibility-item">
                    <div class="mini-label">
                      Monto máximo equivalente
                    </div>

                    <div class="mini-value">
                      {{ money(maxEquivalentLoanAmount) }}
                    </div>
                  </div>

                  <div class="eligibility-item">
                    <div class="mini-label">
                      Mínimo de días por monto
                    </div>

                    <div class="mini-value">
                      {{ numberValue(minimumDaysByLoanAmount) }} día(s)
                    </div>
                  </div>

                  <div class="eligibility-item">
                    <div class="mini-label">
                      Sueldo diario
                    </div>

                    <div class="mini-value">
                      {{
                        money(
                          eligibility?.salarySnapshot?.dailySalary || 0
                        )
                      }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card flat bordered class="section-card">
              <q-card-section>
                <div class="section-heading">
                  <div>
                    <div class="section-title">
                      Datos de la solicitud
                    </div>

                    <div class="section-subtitle">
                      Indica los días que deseas utilizar y la cantidad
                      de cuotas. El monto se calcula automáticamente.
                    </div>
                  </div>
                </div>

                <div class="row q-col-gutter-md q-mt-sm">
                  <div class="col-12 col-md-4">
                    <div class="field-label required">
                      Días para el préstamo
                    </div>

                    <q-input
                      :model-value="form.guaranteedDays"
                      type="number"
                      outlined
                      dense
                      rounded
                      color="primary"
                      min="1"
                      step="1"
                      :max="effectiveMaxGuaranteeDays"
                      suffix="día(s)"
                      label="Cantidad de días"
                      @update:model-value="setGuaranteedDays"
                    />

                    <div class="hint-text">
                      Puedes utilizar hasta
                      <b>{{ effectiveMaxGuaranteeDays }} día(s)</b>.
                    </div>
                  </div>

                  <div class="col-12 col-md-4">
                    <div class="field-label">
                      Monto equivalente
                    </div>

                    <q-input
                      :model-value="calculatedRequestedAmount"
                      type="number"
                      outlined
                      dense
                      rounded
                      readonly
                      color="primary"
                      prefix="RD$"
                    >
                      <template #append>
                        <q-icon
                          name="calculate"
                          color="primary"
                        />
                      </template>
                    </q-input>

                    <div class="hint-text">
                      {{
                        numberValue(form.guaranteedDays || 0)
                      }}
                      día(s) × {{ money(vacationDayAmount) }}.
                    </div>
                  </div>

                  <div class="col-12 col-md-4">
                    <div class="field-label required">
                      Cuotas solicitadas
                    </div>

                    <q-input
                      v-model.number="form.requestedInstallments"
                      type="number"
                      outlined
                      dense
                      rounded
                      color="primary"
                      :min="minimumInstallments"
                      :max="maximumInstallments"
                      step="1"
                      label="Cantidad de cuotas"
                    />

                    <div class="hint-text">
                      Permitidas:
                      <b>
                        {{ minimumInstallments }} a
                        {{ maximumInstallments }} cuota(s)
                      </b>.
                    </div>
                  </div>

                  <div class="col-12">
                    <q-banner
                      rounded
                      :class="
                        formHasError
                          ? 'bg-red-1 text-red-10'
                          : 'bg-blue-1 text-primary'
                      "
                    >
                      <template #avatar>
                        <q-icon
                          :name="
                            formHasError
                              ? 'warning'
                              : 'info'
                          "
                          :color="
                            formHasError
                              ? 'negative'
                              : 'primary'
                          "
                        />
                      </template>

                      <span v-if="formHasError">
                        {{ formError }}
                      </span>

                      <span v-else>
                        Solicitarás
                        <b>
                          {{ money(calculatedRequestedAmount) }}
                        </b>
                        utilizando
                        <b>
                          {{ numberValue(form.guaranteedDays) }}
                          día(s)
                        </b>.
                        Luego de la solicitud quedarán
                        <b>
                          {{ numberValue(availableAfterGuarantee) }}
                          día(s)
                        </b>
                        disponibles.
                      </span>
                    </q-banner>
                  </div>

                  <div class="col-12">
                    <div class="field-label">
                      Propósito
                    </div>

                    <q-input
                      v-model="form.purpose"
                      outlined
                      dense
                      rounded
                      color="primary"
                      label="Ej: emergencia, salud, estudios..."
                    />
                  </div>

                  <div class="col-12">
                    <div class="field-label">
                      Comentario
                    </div>

                    <q-input
                      v-model="form.employeeComment"
                      type="textarea"
                      outlined
                      dense
                      rounded
                      autogrow
                      color="primary"
                      label="Comentario adicional"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card
              v-if="amortizationRows.length"
              flat
              bordered
              class="section-card"
            >
              <q-card-section>
                <div class="section-heading">
                  <div>
                    <div class="section-title">
                      Tabla de amortización
                    </div>

                    <div class="section-subtitle">
                      Revisa el detalle completo de cada cuota
                      antes de aceptar.
                    </div>
                  </div>
                </div>

                <div class="q-mt-md">
                  <EmployeeLoanAmortizationTable
                    :rows="amortizationRows"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <aside class="loan-side">
            <q-card flat bordered class="summary-card">
              <q-card-section class="summary-header">
                <div class="summary-icon">
                  <q-icon name="summarize" size="24px" />
                </div>

                <div>
                  <div class="summary-title">
                    Resumen del préstamo
                  </div>

                  <div class="summary-subtitle">
                    Monto calculado según los días seleccionados.
                  </div>
                </div>
              </q-card-section>

              <q-card-section class="summary-body">
                <div class="summary-main-amount">
                  <div class="summary-main-label">
                    Monto del préstamo
                  </div>

                  <div class="summary-main-value">
                    {{ money(calculatedRequestedAmount) }}
                  </div>
                </div>

                <div class="summary-grid q-mt-md">
                  <div class="summary-box">
                    <div class="summary-label">
                      Días utilizados
                    </div>

                    <div class="summary-value">
                      {{
                        numberValue(
                          form.guaranteedDays || 0
                        )
                      }}
                    </div>
                  </div>

                  <div class="summary-box">
                    <div class="summary-label">
                      Valor por día
                    </div>

                    <div class="summary-value">
                      {{ money(vacationDayAmount) }}
                    </div>
                  </div>

                  <div class="summary-box">
                    <div class="summary-label">
                      Cuotas
                    </div>

                    <div class="summary-value">
                      {{
                        numberValue(
                          form.requestedInstallments || 0
                        )
                      }}
                    </div>
                  </div>

                  <div class="summary-box">
                    <div class="summary-label">
                      Días restantes
                    </div>

                    <div
                      class="summary-value"
                      :class="
                        availableAfterGuarantee < 0
                          ? 'text-negative'
                          : ''
                      "
                    >
                      {{ numberValue(availableAfterGuarantee) }}
                    </div>
                  </div>
                </div>

                <div class="summary-list q-mt-md">
                  <div class="summary-row">
                    <span>Días disponibles</span>

                    <strong>
                      {{ numberValue(loanVacationDays) }}
                      día(s)
                    </strong>
                  </div>

                  <div class="summary-row">
                    <span>Máximo permitido</span>

                    <strong>
                      {{ numberValue(effectiveMaxGuaranteeDays) }}
                      día(s)
                    </strong>
                  </div>

                  <div class="summary-row">
                    <span>Monto mínimo del producto</span>

                    <strong>
                      {{ money(minimumLoanAmount) }}
                    </strong>
                  </div>

                  <div class="summary-row">
                    <span>Monto máximo del producto</span>

                    <strong>
                      {{ money(maximumLoanAmount) }}
                    </strong>
                  </div>
                </div>

                <q-banner
                  v-if="quoteError"
                  rounded
                  class="bg-red-1 text-red-10 q-mt-md"
                >
                  <template #avatar>
                    <q-icon
                      name="warning"
                      color="negative"
                    />
                  </template>

                  {{ quoteError }}
                </q-banner>

                <q-banner
                  v-if="!loanQuote && !quoteError"
                  rounded
                  class="bg-grey-2 text-grey-8 q-mt-md"
                >
                  <template #avatar>
                    <q-icon
                      name="info"
                      color="grey-8"
                    />
                  </template>

                  Selecciona los días y presiona
                  <b>Calcular cuotas</b>.
                </q-banner>

                <div
                  v-if="loanQuote"
                  class="q-mt-md quote-card-wrapper"
                >
                  <EmployeeLoanQuoteSummaryCard
                    :quote="loanQuote"
                  />
                </div>
              </q-card-section>
            </q-card>
          </aside>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions
        align="right"
        class="loan-dialog-actions"
      >
        <q-btn
          flat
          rounded
          no-caps
          color="negative"
          icon="close"
          label="Cancelar"
          :disable="saving || quoteLoading"
          @click="closeDialog"
        />

        <q-btn
          unelevated
          rounded
          no-caps
          color="secondary"
          icon="calculate"
          label="Calcular cuotas"
          :loading="quoteLoading"
          :disable="saving || formHasError"
          @click="calculateLoanQuote"
        />

        <q-btn
          unelevated
          rounded
          no-caps
          color="primary"
          icon="task_alt"
          label="Aceptar préstamo"
          :loading="saving"
          :disable="acceptDisabled"
          @click="openContractDialog"
        />
      </q-card-actions>

      <EmployeeLoanContractDialog
        v-model="contractDialog.open"
        v-model:signature-name="signatureForm.signatureName"
        v-model:signature-document="signatureForm.signatureDocument"
        v-model:signature-image-base64="
          signatureForm.signatureImageBase64
        "
        v-model:accepted="signatureForm.accepted"
        :quote="loanQuote"
        :saving="saving"
        @sign="signContractAndCreateRequest"
      />
    </q-card>
  </q-dialog>
</template>

<script setup>
import {
  computed,
  ref,
  watch,
} from "vue";
import { useQuasar } from "quasar";

import methodsHttp from "src/api/methodsHttp";
import EmployeeLoanQuoteSummaryCard from "src/components/employeeLoan/EmployeeLoanQuoteSummaryCard.vue";
import EmployeeLoanAmortizationTable from "src/components/employeeLoan/EmployeeLoanAmortizationTable.vue";
import EmployeeLoanContractDialog from "src/components/employeeLoan/EmployeeLoanContractDialog.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },

  eligibility: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "created",
]);

const $q = useQuasar();

const saving = ref(false);
const quoteLoading = ref(false);

const loanQuote = ref(null);
const quoteError = ref("");
const amortizationRows = ref([]);

const form = ref({
  guaranteedDays: null,
  requestedInstallments: 1,
  purpose: "",
  employeeComment: "",
});

const contractDialog = ref({
  open: false,
});

const signatureForm = ref({
  signatureName: "",
  signatureDocument: "",
  signatureImageBase64: "",
  accepted: false,
});

const dialogModel = computed({
  get: () => props.modelValue,

  set: (value) => {
    emit("update:modelValue", value);
  },
});

const round2 = (value) => {
  return (
    Math.round(
      (Number(value || 0) +
        Number.EPSILON) *
        100,
    ) / 100
  );
};

const productConfig = computed(() => {
  return (
    props.eligibility?.productRules ||
    props.eligibility?.productConfig ||
    {}
  );
});

const eligibilityRules = computed(() => {
  return props.eligibility?.eligibility || {};
});

const loanVacationDays = computed(() => {
  return Math.max(
    0,
    Number(
      props.eligibility?.vacationSummary
        ?.availableForLoanDays ??
        props.eligibility?.eligibility
          ?.availableForLoanDays ??
        props.eligibility?.vacationBalance
          ?.availableForLoanDays ??
        props.eligibility?.vacationBalance
          ?.availableDays ??
        0,
    ),
  );
});

const rawMaxGuaranteeDays = computed(() => {
  return Math.max(
    0,
    Math.floor(
      Number(
        props.eligibility?.eligibility
          ?.maxGuaranteeDays ??
          loanVacationDays.value,
      ),
    ),
  );
});

const configuredMaximumGuaranteeDays = computed(() => {
  return Math.max(
    0,
    Math.floor(
      Number(
        props.eligibility?.eligibility
          ?.maxVacationGuaranteeDays ??
          productConfig.value
            ?.maxVacationGuaranteeDays ??
          0,
      ),
    ),
  );
});

const minimumVacationDaysRequired = computed(() => {
  return Math.max(
    0,
    Math.floor(
      Number(
        eligibilityRules.value
          ?.minimumVacationDaysRequired ??
          productConfig.value
            ?.minimumVacationDaysRequired ??
          0,
      ),
    ),
  );
});

const minimumLoanAmount = computed(() => {
  return Math.max(
    0,
    Number(
      eligibilityRules.value?.minLoanAmount ??
        productConfig.value?.minLoanAmount ??
        0,
    ),
  );
});

const maximumLoanAmount = computed(() => {
  return Math.max(
    0,
    Number(
      eligibilityRules.value?.maxLoanAmount ??
        productConfig.value?.maxLoanAmount ??
        0,
    ),
  );
});

const minimumInstallments = computed(() => {
  return Math.max(
    1,
    Math.floor(
      Number(
        eligibilityRules.value?.minInstallments ??
          productConfig.value?.minInstallments ??
          1,
      ),
    ),
  );
});

const maximumInstallments = computed(() => {
  return Math.max(
    minimumInstallments.value,
    Math.floor(
      Number(
        eligibilityRules.value?.maxInstallments ??
          productConfig.value?.maxInstallments ??
          minimumInstallments.value,
      ),
    ),
  );
});

const vacationDayValueMode = computed(() => {
  return String(
    productConfig.value?.vacationDayValueMode ||
      "DAILY_SALARY",
  ).toUpperCase();
});

const vacationDayAmount = computed(() => {
  if (vacationDayValueMode.value === "NONE") {
    return 0;
  }

  if (
    vacationDayValueMode.value ===
    "CUSTOM_AMOUNT"
  ) {
    return round2(
      Number(
        productConfig.value
          ?.customVacationDayAmount || 0,
      ),
    );
  }

  return round2(
    Number(
      props.eligibility?.salarySnapshot
        ?.dailySalary || 0,
    ),
  );
});

const maximumDaysByProductAmount = computed(() => {
  const dayAmount = Number(
    vacationDayAmount.value || 0,
  );

  const maximumAmount = Number(
    maximumLoanAmount.value || 0,
  );

  if (dayAmount <= 0) {
    return 0;
  }

  if (maximumAmount <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(
    0,
    Math.floor(
      (maximumAmount + Number.EPSILON) /
        dayAmount,
    ),
  );
});

const effectiveMaxGuaranteeDays = computed(() => {
  const candidates = [
    Math.floor(loanVacationDays.value),
    rawMaxGuaranteeDays.value,
  ];

  if (
    configuredMaximumGuaranteeDays.value > 0
  ) {
    candidates.push(
      configuredMaximumGuaranteeDays.value,
    );
  }

  if (
    Number.isFinite(
      maximumDaysByProductAmount.value,
    )
  ) {
    candidates.push(
      maximumDaysByProductAmount.value,
    );
  }

  return Math.max(
    0,
    Math.min(...candidates),
  );
});

const minimumDaysByLoanAmount = computed(() => {
  const dayAmount = Number(
    vacationDayAmount.value || 0,
  );

  if (dayAmount <= 0) {
    return 0;
  }

  if (minimumLoanAmount.value <= 0) {
    return 1;
  }

  return Math.max(
    1,
    Math.ceil(
      (minimumLoanAmount.value -
        Number.EPSILON) /
        dayAmount,
    ),
  );
});

const calculatedRequestedAmount = computed(() => {
  const days = Math.max(
    0,
    Math.floor(
      Number(form.value.guaranteedDays || 0),
    ),
  );

  return round2(
    days * vacationDayAmount.value,
  );
});

const maxEquivalentLoanAmount = computed(() => {
  return round2(
    effectiveMaxGuaranteeDays.value *
      vacationDayAmount.value,
  );
});

const availableAfterGuarantee = computed(() => {
  return (
    Number(loanVacationDays.value || 0) -
    Number(form.value.guaranteedDays || 0)
  );
});

const formError = computed(() => {
  if (!props.eligibility) {
    return "No se pudo cargar la elegibilidad del empleado.";
  }

  if (vacationDayAmount.value <= 0) {
    return "La configuración no tiene un valor válido para cada día de vacaciones.";
  }

  if (
    loanVacationDays.value <
    minimumVacationDaysRequired.value
  ) {
    return `Debes tener al menos ${minimumVacationDaysRequired.value} día(s) disponibles para solicitar un préstamo.`;
  }

  if (effectiveMaxGuaranteeDays.value <= 0) {
    return "Actualmente no tienes días disponibles para solicitar un préstamo.";
  }

  const guaranteedDays = Number(
    form.value.guaranteedDays || 0,
  );

  if (guaranteedDays <= 0) {
    return "Debes indicar la cantidad de días que deseas utilizar.";
  }

  if (!Number.isInteger(guaranteedDays)) {
    return "La cantidad de días debe ser un número entero.";
  }

  if (
    guaranteedDays >
    effectiveMaxGuaranteeDays.value
  ) {
    return `Solo puedes utilizar hasta ${effectiveMaxGuaranteeDays.value} día(s).`;
  }

  if (availableAfterGuarantee.value < 0) {
    return "No tienes suficientes días disponibles.";
  }

  if (
    calculatedRequestedAmount.value <
    minimumLoanAmount.value
  ) {
    return `Debes seleccionar al menos ${minimumDaysByLoanAmount.value} día(s) para alcanzar el monto mínimo de ${money(minimumLoanAmount.value)}.`;
  }

  if (
    maximumLoanAmount.value > 0 &&
    calculatedRequestedAmount.value >
      maximumLoanAmount.value
  ) {
    return `El monto calculado no puede superar ${money(maximumLoanAmount.value)}.`;
  }

  const installments = Number(
    form.value.requestedInstallments || 0,
  );

  if (!Number.isInteger(installments)) {
    return "La cantidad de cuotas debe ser un número entero.";
  }

  if (
    installments <
    minimumInstallments.value
  ) {
    return `La cantidad mínima permitida es ${minimumInstallments.value} cuota(s).`;
  }

  if (
    installments >
    maximumInstallments.value
  ) {
    return `La cantidad máxima permitida es ${maximumInstallments.value} cuota(s).`;
  }

  return "";
});

const formHasError = computed(() => {
  return Boolean(formError.value);
});

const acceptDisabled = computed(() => {
  return (
    saving.value ||
    quoteLoading.value ||
    formHasError.value ||
    !props.eligibility ||
    !loanQuote.value
  );
});

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      resetDialog();
    }
  },
);

watch(
  () => effectiveMaxGuaranteeDays.value,
  (maximumDays) => {
    const currentDays = Number(
      form.value.guaranteedDays || 0,
    );

    if (
      currentDays > maximumDays &&
      maximumDays >= 0
    ) {
      form.value.guaranteedDays =
        maximumDays || null;
    }
  },
);

watch(
  () => [
    form.value.guaranteedDays,
    form.value.requestedInstallments,
  ],
  () => {
    loanQuote.value = null;
    amortizationRows.value = [];
    quoteError.value = "";
  },
);

const setGuaranteedDays = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    form.value.guaranteedDays = null;
    return;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    form.value.guaranteedDays = null;
    return;
  }

  const integerValue = Math.max(
    0,
    Math.floor(numericValue),
  );

  form.value.guaranteedDays = Math.min(
    integerValue,
    effectiveMaxGuaranteeDays.value,
  );
};

const getEmployeeName = () => {
  const employee =
    props.eligibility?.employee || {};

  return String(
    employee.fullName ||
      employee.name ||
      employee.user?.name ||
      "",
  ).trim();
};

const getEmployeeDocument = () => {
  const employee =
    props.eligibility?.employee || {};

  return String(
    employee.document ||
      employee.identificationNumber ||
      employee.cedula ||
      employee.user?.document ||
      "",
  ).trim();
};

const resetDialog = () => {
  form.value = {
    guaranteedDays: null,

    requestedInstallments:
      minimumInstallments.value,

    purpose: "",
    employeeComment: "",
  };

  loanQuote.value = null;
  quoteError.value = "";
  amortizationRows.value = [];

  signatureForm.value = {
    signatureName: getEmployeeName(),
    signatureDocument:
      getEmployeeDocument(),
    signatureImageBase64: "",
    accepted: false,
  };

  contractDialog.value.open = false;
};

const closeDialog = () => {
  if (
    saving.value ||
    quoteLoading.value
  ) {
    return;
  }

  emit("update:modelValue", false);
};

const buildLoanPayload = () => {
  return {
    requestedAmount: Number(
      calculatedRequestedAmount.value || 0,
    ),

    guaranteedDays: Number(
      form.value.guaranteedDays || 0,
    ),

    requestedInstallments: Number(
      form.value.requestedInstallments ||
        minimumInstallments.value,
    ),
  };
};

const calculateLoanQuote = async () => {
  if (formHasError.value) {
    $q.notify({
      type: "warning",
      message: formError.value,
    });

    return;
  }

  quoteLoading.value = true;
  quoteError.value = "";
  loanQuote.value = null;
  amortizationRows.value = [];

  try {
    const payload = buildLoanPayload();

    const resp =
      await methodsHttp.postApi(
        "employee-loan/requests/quote",
        payload,
      );

    if (resp?.ok) {
      loanQuote.value = resp;

      amortizationRows.value =
        resp.amortizationSchedule || [];

      $q.notify({
        type: "positive",
        message:
          "Cotización calculada correctamente.",
      });

      return;
    }

    quoteError.value =
      resp?.mensaje ||
      "No se pudo calcular la cotización.";
  } catch (error) {
    console.error(
      "calculateLoanQuote error:",
      error,
    );

    quoteError.value =
      error?.response?.data?.mensaje ||
      error?.data?.mensaje ||
      "Error calculando la cotización.";
  } finally {
    quoteLoading.value = false;
  }
};

const openContractDialog = () => {
  if (!loanQuote.value) {
    return;
  }

  signatureForm.value = {
    signatureName: getEmployeeName(),
    signatureDocument:
      getEmployeeDocument(),
    signatureImageBase64: "",
    accepted: false,
  };

  contractDialog.value.open = true;
};

const signContractAndCreateRequest =
  async () => {
    if (formHasError.value) {
      $q.notify({
        type: "warning",
        message: formError.value,
      });

      return;
    }

    saving.value = true;

    try {
      const payload = {
        ...buildLoanPayload(),

        purpose: String(
          form.value.purpose || "",
        ).trim(),

        employeeComment: String(
          form.value.employeeComment || "",
        ).trim(),

        signatureName: String(
          signatureForm.value.signatureName ||
            "",
        ).trim(),

        signatureDocument: String(
          signatureForm.value
            .signatureDocument || "",
        ).trim(),

        signatureImageBase64:
          signatureForm.value
            .signatureImageBase64,
      };

      const resp =
        await methodsHttp.postApi(
          "employee-loan/requests/sign-contract",
          payload,
        );

      if (resp?.ok) {
        $q.notify({
          type: "positive",
          message:
            resp.mensaje ||
            "Préstamo aceptado correctamente.",
        });

        contractDialog.value.open = false;

        emit("update:modelValue", false);

        emit(
          "created",
          resp.loanRequest ||
            resp.request ||
            resp.data ||
            null,
        );

        resetDialog();
        return;
      }

      $q.notify({
        type: "negative",
        message:
          resp?.mensaje ||
          "No se pudo firmar el contrato.",
      });
    } catch (error) {
      console.error(
        "signContractAndCreateRequest error:",
        error,
      );

      $q.notify({
        type: "negative",
        message:
          error?.response?.data?.mensaje ||
          error?.data?.mensaje ||
          "Error firmando el contrato.",
      });
    } finally {
      saving.value = false;
    }
  };

const money = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount);
};

const numberValue = (value) => {
  const number = Number(value || 0);

  return Number.isInteger(number)
    ? number
    : number.toFixed(2);
};
</script>

<style scoped>
.loan-dialog {
  display: flex;
  width: 1350px;
  max-width: 97vw;
  max-height: 92vh;
  overflow: hidden;
  flex-direction: column;
  border-radius: 28px;
  background: #f8fafc;
}

.loan-dialog-header {
  display: flex;
  min-height: 86px;
  padding: 18px 22px;
  align-items: center;
  justify-content: space-between;
  background: var(--primary);
}

.header-left {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
  color: white;
}

.header-icon {
  display: grid;
  width: 52px;
  min-width: 52px;
  height: 52px;
  place-items: center;
  border: 1px solid
    rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  background:
    rgba(255, 255, 255, 0.14);
}

.header-title {
  font-size: 1.16rem;
  font-weight: 900;
  line-height: 1.05;
}

.header-subtitle {
  margin-top: 5px;
  font-size: 0.8rem;
  opacity: 0.88;
}

.loan-dialog-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
  background:
    radial-gradient(
      circle at top left,
      rgba(59, 130, 246, 0.08),
      transparent 32%
    ),
    #f8fafc;
}

.loan-layout {
  display: grid;
  align-items: start;
  grid-template-columns:
    minmax(0, 1fr) 600px;
  gap: 18px;
}

.loan-main {
  display: grid;
  min-width: 0;
  gap: 18px;
}

.loan-side {
  position: sticky;
  top: 0;
  min-width: 0;
}

.section-card,
.summary-card {
  border: 1px solid
    rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  background: white;
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.055);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.section-subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.78rem;
}

.eligibility-card {
  overflow: hidden;
}

.eligibility-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.eligibility-item {
  min-height: 74px;
  padding: 13px;
  border: 1px solid
    rgba(15, 23, 42, 0.06);
  border-radius: 18px;
  background: #f8fafc;
}

.mini-label,
.field-label,
.summary-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.mini-value {
  margin-top: 5px;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.field-label {
  margin-bottom: 6px;
}

.field-label.required::before {
  color: #e53935;
  content: "* ";
}

.hint-text {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.73rem;
  line-height: 1.35;
}

.summary-card {
  overflow: hidden;
}

.summary-header {
  display: flex;
  padding: 18px;
  align-items: center;
  gap: 12px;
  background: white;
}

.summary-icon {
  display: grid;
  width: 48px;
  min-width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 18px;
  color: #1d4ed8;
  background: #dbeafe;
}

.summary-title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.1;
}

.summary-subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.78rem;
}

.summary-body {
  padding: 5px 18px 18px;
  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #f8fafc 100%
    );
}

.summary-main-amount {
  padding: 15px 20px;
  border-radius: 22px;
  color: white;
  background: var(--primary);
}

.summary-main-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  opacity: 0.74;
}

.summary-main-value {
  margin-top: 8px;
  font-size: 1.7rem;
  font-weight: 900;
  line-height: 1;
}

.summary-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.summary-box {
  padding: 13px;
  border: 1px solid
    rgba(15, 23, 42, 0.06);
  border-radius: 18px;
  background: white;
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.03);
}

.summary-value {
  margin-top: 6px;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.1;
}

.summary-list {
  display: grid;
  gap: 10px;
}

.summary-row {
  display: flex;
  padding: 12px 14px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid
    rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  background: white;
}

.summary-row span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}

.summary-row strong {
  color: #0f172a;
  font-size: 0.86rem;
  font-weight: 900;
  text-align: right;
}

.quote-card-wrapper :deep(.q-card) {
  box-shadow: none;
}

.loan-dialog-actions {
  padding: 14px 18px;
  border-top: 1px solid
    rgba(15, 23, 42, 0.08);
  background: white;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

:deep(.q-field--readonly .q-field__control) {
  background: #f8fafc;
}

@media (max-width: 1100px) {
  .loan-layout {
    grid-template-columns: 1fr;
  }

  .loan-side {
    position: static;
  }
}

@media (max-width: 760px) {
  .loan-dialog {
    width: 96vw;
    max-height: 94vh;
    border-radius: 22px;
  }

  .loan-dialog-header {
    align-items: flex-start;
    gap: 12px;
  }

  .header-left {
    align-items: flex-start;
  }

  .eligibility-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .loan-dialog-body {
    max-height: calc(94vh - 155px);
    padding: 12px;
  }

  .loan-dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .loan-dialog-actions .q-btn {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .eligibility-grid {
    grid-template-columns: 1fr;
  }

  .summary-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-row strong {
    text-align: left;
  }
}
</style>