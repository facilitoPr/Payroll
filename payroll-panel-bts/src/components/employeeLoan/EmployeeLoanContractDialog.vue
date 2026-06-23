<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card class="contract-dialog">
      <q-inner-loading
        :showing="saving"
        label="Firmando contrato..."
        label-class="text-primary"
      />

      <q-card-section class="dialog-header bg-primary row items-center justify-between">
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon name="article" size="30px" />
          </div>

          <div>
            <div class="dialog-title">Contrato de préstamo</div>
            <div class="dialog-subtitle">
              Lee el documento completo, baja hasta el final y firma digitalmente.
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

      <div class="read-progress">
        <div
          class="read-progress-bar bg-primary"
          :style="{ width: `${readProgress}%` }"
        />
      </div>

      <q-card-section
        ref="dialogBodyRef"
        class="dialog-body"
        @scroll="handleBodyScroll"
      >
        <q-banner
          rounded
          :class="hasScrolledToBottom ? 'bg-green-1 text-green-10' : 'bg-orange-1 text-orange-10'"
          class="q-mb-md"
        >
          <template #avatar>
            <q-icon
              :name="hasScrolledToBottom ? 'verified' : 'warning'"
              :color="hasScrolledToBottom ? 'positive' : 'orange-10'"
            />
          </template>

          <span v-if="hasScrolledToBottom">
            Has llegado al final del documento. Ya puedes completar la firma digital.
          </span>

          <span v-else>
            Debes leer el contrato y bajar hasta el final para habilitar la firma.
          </span>
        </q-banner>

        <div class="document-shell">
          <div class="document-page">
            <div class="document-title">
              CONTRATO DE PRÉSTAMO A CORTO PLAZO
            </div>

            <div class="document-subtitle">
              MODALIDAD “PAY DAY LOAN” CON GARANTÍAS LABORALES Y AUTORIZACIÓN DE DÉBITOS
            </div>

            <div class="document-country">
              REPÚBLICA DOMINICANA
            </div>

            <div class="document-section-title">ENTRE:</div>

            <p>
              De una parte, <strong>{{ doc.lenderName }}</strong>, sociedad comercial
              organizada conforme a las leyes de la República Dominicana, con domicilio
              social en la República Dominicana, debidamente representada por su
              representante autorizado, quien en lo adelante se denominará
              <strong>“EL PRESTAMISTA”</strong>.
            </p>

            <p>
              Y de la otra parte, el(la) señor(a)
              <strong>{{ doc.debtorName }}</strong>,
              {{ doc.debtorNationality }}, mayor de edad, portador(a) de la cédula de
              identidad y electoral No.
              <strong>{{ doc.debtorDocument || "________________________" }}</strong>,
              domiciliado(a) en
              <strong>{{ doc.debtorAddress || "________________________________________" }}</strong>,
              empleado(a) de la empresa
              <strong>{{ doc.debtorCompanyName || "________________________________________" }}</strong>,
              quien en lo adelante se denominará
              <strong>“EL DEUDOR”</strong> o <strong>“EL SOLICITANTE”</strong>.
            </p>

            <p>
              Las partes, libre y voluntariamente, acuerdan celebrar el presente
              Contrato de Préstamo a Corto Plazo, sujeto a las cláusulas siguientes:
            </p>

            <div class="document-section-title">CLÁUSULA 1. OBJETO DEL CONTRATO</div>

            <p>
              EL PRESTAMISTA otorga a favor de EL DEUDOR un préstamo personal de corto
              plazo bajo modalidad “Pay Day Loan”, por la suma de:
            </p>

            <div class="amount-box">
              {{ doc.loanAmount }}
            </div>

            <p>
              Monto recibido a satisfacción por EL DEUDOR mediante transferencia
              electrónica, depósito bancario o cualquier medio autorizado.
            </p>

            <div class="document-section-title">CLÁUSULA 2. PLAZO Y FORMA DE PAGO</div>

            <p>
              El préstamo tendrá una duración de:
              <strong>{{ doc.loanDurationText }}</strong>.
            </p>

            <p>
              EL DEUDOR autoriza que el pago sea realizado automáticamente mediante
              débito electrónico recurrente en cada fecha de cobro salarial, hasta la
              cancelación total de la deuda.
            </p>

            <p>Los pagos podrán aplicarse a:</p>

            <ul>
              <li>Capital</li>
              <li>Intereses</li>
              <li>Cargos administrativos</li>
              <li>Penalidades autorizadas</li>
              <li>Gastos de gestión de cobro</li>
            </ul>

            <div class="document-section-title">
              CLÁUSULA 3. ACEPTACIÓN EXPRESA DE CLÁUSULAS Y CONTINGENCIAS
            </div>

            <p>
              EL DEUDOR declara que ha leído, comprendido y aceptado voluntariamente
              todas las disposiciones del presente contrato, incluyendo las cláusulas
              relacionadas con:
            </p>

            <ul>
              <li>Débitos automáticos de nómina</li>
              <li>Garantías laborales</li>
              <li>Cesión parcial de beneficios laborales</li>
              <li>Retención de pagos futuros</li>
              <li>Cobro electrónico recurrente</li>
              <li>Liquidación automática de deuda</li>
              <li>Aplicación de vacaciones y doble sueldo</li>
              <li>Consecuencias de incumplimiento</li>
              <li>Gestión de cobros administrativos y legales</li>
              <li>Utilización de información de la plataforma de Recursos Humanos</li>
            </ul>

            <p>
              Asimismo, EL DEUDOR reconoce que este préstamo constituye una obligación
              financiera exigible y que el incumplimiento podrá generar acciones de
              cobro conforme a las leyes de la República Dominicana.
            </p>

            <div class="document-section-title">CLÁUSULA 4. AUTORIZACIÓN DE DÉBITO DE NÓMINA</div>

            <p>
              EL DEUDOR autoriza de manera expresa, libre, voluntaria e irrevocable a
              EL PRESTAMISTA para gestionar y ejecutar débitos automáticos relacionados
              con el pago del préstamo sobre:
            </p>

            <ul>
              <li>Cuenta de nómina</li>
              <li>Cuenta bancaria personal</li>
              <li>Transferencias salariales</li>
              <li>Plataformas de pago vinculadas</li>
              <li>Métodos electrónicos registrados</li>
            </ul>

            <p>
              EL DEUDOR acepta que los débitos podrán realizarse en cada período de pago
              salarial, incluyendo quincenas, pagos extraordinarios, bonificaciones o
              cualquier otro desembolso laboral.
            </p>

            <p>
              La presente autorización permanecerá vigente hasta el pago total de la
              deuda. Autorizando cualquier actualización de información en el programa
              de recursos humanos como addendum al contrato de nueva actualización.
            </p>

            <div class="document-section-title">CLÁUSULA 5. CESIÓN PARCIAL DE VACACIONES</div>

            <p>
              EL DEUDOR autoriza expresamente que los valores económicos
              correspondientes a vacaciones acumuladas, generadas o pendientes de pago
              puedan ser utilizados como garantía parcial y mecanismo de compensación de
              la deuda objeto del presente contrato.
            </p>

            <p>
              Para esta solicitud, EL DEUDOR autoriza reservar
              <strong>{{ doc.guaranteedDaysText }}</strong> como garantía, con un valor
              estimado de <strong>{{ doc.estimatedGuaranteeAmount }}</strong>.
            </p>

            <p>
              EL DEUDOR acepta que, en caso de incumplimiento o mora, EL PRESTAMISTA
              podrá solicitar la aplicación parcial o total de dichos valores al saldo
              pendiente del préstamo, conforme a los límites permitidos por la legislación
              dominicana.
            </p>

            <div class="document-section-title">
              CLÁUSULA 6. AUTORIZACIÓN SOBRE DOBLE SUELDO Y BENEFICIOS EXTRAORDINARIOS
            </div>

            <p>
              EL DEUDOR autoriza de manera expresa que cualquier suma correspondiente a:
            </p>

            <ul>
              <li>Regalía Pascual</li>
              <li>Doble sueldo</li>
              <li>Bonificaciones</li>
              <li>Incentivos</li>
              <li>Comisiones</li>
              <li>Pagos extraordinarios</li>
            </ul>

            <p>
              pueda ser utilizada parcial o totalmente para cubrir obligaciones
              pendientes derivadas del presente contrato.
            </p>

            <p>
              EL DEUDOR reconoce que esta autorización constituye una garantía voluntaria
              otorgada a favor de EL PRESTAMISTA.
            </p>

            <div class="document-section-title">
              CLÁUSULA 7. LIQUIDACIÓN AUTOMÁTICA EN CASO DE TERMINACIÓN LABORAL
            </div>

            <p>En caso de:</p>

            <ul>
              <li>Renuncia</li>
              <li>Despido</li>
              <li>Terminación de contrato</li>
              <li>Desvinculación laboral</li>
              <li>Suspensión definitiva</li>
              <li>Liquidación laboral</li>
            </ul>

            <p>
              EL DEUDOR autoriza expresamente la aplicación automática de prestaciones
              laborales, vacaciones pendientes, regalía pascual, bonificaciones, salarios
              pendientes y compensaciones laborales al pago total o parcial del saldo
              adeudado.
            </p>

            <div class="document-section-title">CLÁUSULA 8. CONTINGENCIAS Y EVENTOS DE RIESGO</div>

            <p>
              EL DEUDOR reconoce que constituyen contingencias relevantes para el
              presente contrato:
            </p>

            <ol>
              <li>Cambio de empleo</li>
              <li>Reducción salarial</li>
              <li>Suspensión laboral</li>
              <li>Incapacidad de pago</li>
              <li>Cierre de cuenta bancaria</li>
              <li>Rechazo de débitos automáticos</li>
              <li>Información falsa o incompleta</li>
              <li>Revocación unilateral de autorizaciones financieras</li>
            </ol>

            <p>
              En cualquiera de estos casos, EL PRESTAMISTA podrá reestructurar la deuda,
              exigir garantías adicionales, declarar vencimiento anticipado, ejecutar
              cobros administrativos o iniciar acciones legales correspondientes.
            </p>

            <div class="document-section-title">CLÁUSULA 9. GARANTÍAS ADICIONALES</div>

            <p>EL DEUDOR adicionalmente:</p>

            <ul>
              <li>Autoriza validación de empleo y salario mediante el software de Recursos Humanos.</li>
              <li>Autoriza consulta de referencias personales y crediticias.</li>
              <li>Autoriza contacto con empleador para fines de validación.</li>
              <li>Autoriza notificaciones electrónicas, SMS y WhatsApp.</li>
              <li>Reconoce validez legal de documentos digitales y firmas electrónicas.</li>
              <li>Autoriza conservación digital de evidencia de aceptación contractual.</li>
            </ul>

            <div class="document-section-title">CLÁUSULA 10. INTERESES Y CARGOS</div>

            <p>
              El préstamo generará:
            </p>

            <div class="detail-grid">
              <div>
                <span>Interés</span>
                <strong>{{ doc.interestRateText }} {{ doc.interestRateTypeText }}</strong>
              </div>

              <div>
                <span>Cargo administrativo</span>
                <strong>{{ doc.adminFee }}</strong>
              </div>

              <div>
                <span>Monto financiado</span>
                <strong>{{ doc.loanAmount }}</strong>
              </div>

              <div>
                <span>Cuota estimada</span>
                <strong>{{ doc.loanInstallmentAmount }}</strong>
              </div>

              <div>
                <span>Total intereses</span>
                <strong>{{ doc.loanTotalInterest }}</strong>
              </div>

              <div>
                <span>Total a pagar</span>
                <strong>{{ doc.loanTotalToPay }}</strong>
              </div>

              <div>
                <span>Primer pago estimado</span>
                <strong>{{ doc.firstPaymentDate || "-" }}</strong>
              </div>

              <div>
                <span>Último pago estimado</span>
                <strong>{{ doc.lastPaymentDate || "-" }}</strong>
              </div>
            </div>

            <p>
              EL DEUDOR declara haber recibido información clara y suficiente sobre el
              monto financiado, total a pagar, fechas de cobro, intereses, penalidades
              y consecuencias de mora.
            </p>

            <div class="document-section-title">RESUMEN DE GARANTÍA LABORAL</div>

            <div class="detail-grid">
              <div>
                <span>Días reservados</span>
                <strong>{{ doc.guaranteedDaysText }}</strong>
              </div>

              <div>
                <span>Valor estimado de garantía</span>
                <strong>{{ doc.estimatedGuaranteeAmount }}</strong>
              </div>

              <div>
                <span>Salario mensual de referencia</span>
                <strong>{{ doc.monthlySalary }}</strong>
              </div>

              <div>
                <span>Salario diario de referencia</span>
                <strong>{{ doc.dailySalary }}</strong>
              </div>
            </div>

            <p>
              Estos valores se usan como referencia para documentar la garantía laboral
              comprometida en la solicitud y no sustituyen los cálculos finales que puedan
              corresponder al momento de una liquidación laboral o compensación autorizada.
            </p>

            <div class="document-section-title">CLÁUSULA 11. VALIDEZ ELECTRÓNICA</div>

            <p>
              Las partes reconocen plena validez jurídica a firmas electrónicas,
              aceptaciones digitales, OTP, correos electrónicos, mensajes de texto,
              confirmaciones vía plataforma, registros biométricos, logs electrónicos y
              evidencia digital de aceptación.
            </p>

            <p>
              El desembolso de préstamo se reconoce como aceptación y aprobación del
              acuerdo establecido, conforme a la legislación vigente de la República
              Dominicana.
            </p>

            <div class="document-section-title">CLÁUSULA 12. LEY APLICABLE Y JURISDICCIÓN</div>

            <p>
              El presente contrato será interpretado conforme al Código Civil Dominicano,
              Código de Trabajo de la República Dominicana, Ley sobre Comercio Electrónico,
              Documentos y Firmas Digitales, y demás normativas aplicables sobre
              obligaciones civiles y financieras.
            </p>

            <p>
              Las partes atribuyen competencia a los tribunales de la República Dominicana.
            </p>

            <div class="document-section-title">INFORMACIÓN DE PLATAFORMA</div>

            <div class="detail-grid">
              <div>
                <span>Plataforma origen</span>
                <strong>{{ doc.sourcePlatformName }}</strong>
              </div>

              <div>
                <span>Código plataforma</span>
                <strong>{{ doc.sourcePlatformCode || "-" }}</strong>
              </div>

              <div>
                <span>Código producto</span>
                <strong>{{ doc.sourceProductCode || "-" }}</strong>
              </div>

              <div>
                <span>Fecha de firma</span>
                <strong>{{ doc.signedAt }}</strong>
              </div>
            </div>

            <div class="document-section-title">FIRMAS</div>

            <div class="signature-grid">
              <div class="signature-box">
                <div class="signature-line" />
                <div class="signature-label">EL PRESTAMISTA</div>
                <div class="signature-text">{{ doc.lenderName }}</div>
                <div class="signature-text">Nombre: ________________________________</div>
                <div class="signature-text">Cargo: _________________________________</div>
              </div>

              <div class="signature-box">
                <div class="signature-preview">
                  <img
                    v-if="signatureImageModel"
                    :src="signatureImageModel"
                    alt="Firma del deudor"
                  />
                </div>

                <div class="signature-line" />
                <div class="signature-label">EL DEUDOR</div>
                <div class="signature-text">Nombre: {{ signatureNameModel || doc.debtorName }}</div>
                <div class="signature-text">Cédula: {{ signatureDocumentModel || doc.debtorDocument }}</div>
                <div class="signature-text">Empresa: {{ doc.debtorCompanyName || "-" }}</div>
              </div>
            </div>

            <div class="document-end-marker">
              FIN DEL DOCUMENTO
            </div>
          </div>
        </div>

        <q-card flat bordered class="summary-card q-mt-md">
          <q-card-section>
            <div class="table-title">Resumen final</div>

            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12 col-md-3">
                <div class="mini-label">Monto</div>
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
                <div class="mini-label">Cuota</div>
                <div class="mini-value">
                  {{ money(quote?.loanQuote?.installmentAmount) }}
                </div>
              </div>

              <div class="col-12 col-md-3">
                <div class="mini-label">Total</div>
                <div class="mini-value">
                  {{ money(quote?.loanQuote?.totalToPay) }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-slide-transition>
          <div v-if="hasScrolledToBottom" class="signature-section q-mt-md">
            <q-card flat bordered class="signature-pad-card">
              <q-card-section>
                <div class="table-title">Firma digital</div>
                <div class="table-subtitle">
                  Firma dentro del recuadro. Esta firma será insertada en el documento generado.
                </div>

                <div class="row q-col-gutter-md q-mt-md">
                  <div class="col-12 col-md-6">
                    <div class="field-label required">Nombre para firma</div>
                    <q-input
                      v-model="signatureNameModel"
                      outlined
                      dense
                      rounded
                      color="primary"
                      label="Escribe tu nombre completo"
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="field-label">Documento</div>
                    <q-input
                      v-model="signatureDocumentModel"
                      outlined
                      dense
                      rounded
                      color="primary"
                      label="Cédula o documento"
                    />
                  </div>

                  <div class="col-12">
                    <div class="field-label required">Dibuja tu firma</div>

                    <div class="signature-canvas-wrapper">
                      <canvas
                        ref="signatureCanvasRef"
                        class="signature-canvas"
                        @mousedown="startDrawing"
                        @mousemove="drawSignature"
                        @mouseup="stopDrawing"
                        @mouseleave="stopDrawing"
                        @touchstart.prevent="startDrawing"
                        @touchmove.prevent="drawSignature"
                        @touchend.prevent="stopDrawing"
                      />

                      <div v-if="!hasSignature" class="signature-placeholder">
                        Firma aquí con el mouse o con el dedo
                      </div>
                    </div>

                    <div class="row items-center justify-between q-mt-sm">
                      <div class="text-caption text-grey-7">
                        La firma se guardará como imagen y se asociará al préstamo.
                      </div>

                      <q-btn
                        flat
                        dense
                        rounded
                        no-caps
                        color="negative"
                        icon="backspace"
                        label="Limpiar firma"
                        :disable="saving || !hasSignature"
                        @click="clearSignature"
                      />
                    </div>
                  </div>

                  <div class="col-12">
                    <q-checkbox
                      v-model="acceptedModel"
                      color="primary"
                      :disable="saving"
                      label="Confirmo que he leído y acepto los términos del contrato."
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-slide-transition>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          rounded
          no-caps
          color="negative"
          icon="close"
          label="Cancelar"
          :disable="saving"
          @click="closeDialog"
        />

        <q-btn
          unelevated
          rounded
          no-caps
          color="primary"
          icon="draw"
          label="Firmar contrato"
          :loading="saving"
          :disable="signDisabled"
          @click="emitSign"
        >
          <q-tooltip v-if="signDisabled">
            Debes leer hasta el final, aceptar el contrato y dibujar tu firma.
          </q-tooltip>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { getLoanRateTypeText } from "../../helpers/catalogs/loan.catalog";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  quote: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  signatureName: {
    type: String,
    default: "",
  },
  signatureDocument: {
    type: String,
    default: "",
  },
  signatureImageBase64: {
    type: String,
    default: "",
  },
  accepted: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "update:signatureName",
  "update:signatureDocument",
  "update:signatureImageBase64",
  "update:accepted",
  "sign",
]);

const dialogBodyRef = ref(null);
const signatureCanvasRef = ref(null);

const hasScrolledToBottom = ref(false);
const readProgress = ref(0);
const hasSignature = ref(false);
const isDrawing = ref(false);
const lastPoint = ref(null);

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const signatureNameModel = computed({
  get: () => props.signatureName,
  set: (value) => emit("update:signatureName", value),
});

const signatureDocumentModel = computed({
  get: () => props.signatureDocument,
  set: (value) => emit("update:signatureDocument", value),
});

const signatureImageModel = computed({
  get: () => props.signatureImageBase64,
  set: (value) => emit("update:signatureImageBase64", value),
});

const acceptedModel = computed({
  get: () => props.accepted,
  set: (value) => emit("update:accepted", value),
});

const doc = computed(() => {
  const data = props.quote?.contract?.documentData || {};
  const quote = props.quote?.loanQuote || {};
  const provider = props.quote?.loanProviderSnapshot || {};
  const vacation = props.quote?.vacationSnapshot || {};
  const salary = props.quote?.salarySnapshot || {};
  const employee = props.quote?.employee || {};
  const amortization = Array.isArray(props.quote?.amortizationSchedule)
    ? props.quote.amortizationSchedule
    : Array.isArray(quote?.amortizationSchedule)
      ? quote.amortizationSchedule
      : [];
  const lastInstallment = amortization[amortization.length - 1] || null;

  const currency =
    data.loanCurrency ||
    provider?.interestBankAccount?.currency ||
    "DOP";

  return {
    lenderName: data.lenderName || "Blue Technology Solution",
    debtorName:
      data.debtorName ||
      props.signatureName ||
      employee?.name ||
      "EL DEUDOR",
    debtorDocument:
      data.debtorDocument ||
      props.signatureDocument ||
      employee?.idNumber ||
      employee?.payrollBank?.idNumber ||
      "",
    debtorNationality: data.debtorNationality || "dominicano(a)",
    debtorAddress: data.debtorAddress || employee?.address || "",
    debtorCompanyName:
      data.debtorCompanyName ||
      data.employerName ||
      employee?.company?.legalName ||
      employee?.company?.commercialName ||
      employee?.company?.name ||
      "",

    loanAmount: data.loanAmount || money(quote?.principal, currency),
    loanDurationText:
      data.loanDurationText ||
      `${numberValue(quote?.installments || 0)} cuota(s)`,
    loanInstallments: data.loanInstallments || quote?.installments || 0,
    loanInstallmentAmount:
      data.loanInstallmentAmount || money(quote?.installmentAmount, currency),
    loanTotalInterest:
      data.loanTotalInterest || money(quote?.totalInterest, currency),
    loanTotalToPay:
      data.loanTotalToPay || money(quote?.totalToPay, currency),

    interestRateText:
      data.interestRateText ||
      `${numberValue(provider?.interestRate || 0)}%`,
    interestRateType:
      data.interestRateType ||
      provider?.interestRateType ||
      "",
    interestRateTypeText:
      data.interestRateTypeText ||
      getLoanRateTypeText(data.interestRateType || provider?.interestRateType),
    adminFee: data.adminFee || money(0, currency),

    guaranteedDaysText:
      data.guaranteedDaysText ||
      `${numberValue(vacation?.guaranteedDays || 0)} día(s)`,
    estimatedGuaranteeAmount:
      data.estimatedGuaranteeAmount ||
      money(vacation?.estimatedGuaranteeAmount, currency),

    monthlySalary:
      data.monthlySalary || money(salary?.monthlySalary, currency),
    dailySalary:
      data.dailySalary || money(salary?.dailySalary, currency),
    paymentFrequency:
      data.paymentFrequency ||
      salary?.paymentFrequencyName ||
      salary?.paymentFrequencyCode ||
      "",
    firstPaymentDate:
      data.firstPaymentDate ||
      dateValue(quote?.firstPaymentDate || amortization?.[0]?.dueDate),
    lastPaymentDate:
      data.lastPaymentDate ||
      dateValue(lastInstallment?.dueDate),

    sourcePlatformCode:
      data.sourcePlatformCode ||
      props.quote?.contract?.sourcePlatformCode ||
      "",
    sourcePlatformName:
      data.sourcePlatformName ||
      props.quote?.contract?.sourcePlatformName ||
      "Payroll System",
    sourceProductCode:
      data.sourceProductCode ||
      props.quote?.contract?.sourceProductCode ||
      provider?.productCode ||
      "",

    signedAt:
      data.signedAt ||
      new Intl.DateTimeFormat("es-DO", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date()),
  };
});

const signDisabled = computed(() => {
  return (
    props.saving ||
    !props.quote ||
    !props.accepted ||
    !hasScrolledToBottom.value ||
    !hasSignature.value ||
    !String(props.signatureName || "").trim()
  );
});

watch(
  () => props.modelValue,
  async (value) => {
    if (value) {
      resetReadAndSignature();
      await nextTick();
      handleBodyScroll();
    }
  },
);

watch(
  () => hasScrolledToBottom.value,
  async (value) => {
    if (value) {
      await nextTick();
      prepareSignatureCanvas();
    }
  },
);

watch(
  () => props.signatureImageBase64,
  (value) => {
    hasSignature.value = Boolean(value);
  },
);

const closeDialog = () => {
  if (props.saving) return;
  dialogModel.value = false;
};

const resetReadAndSignature = () => {
  hasScrolledToBottom.value = false;
  readProgress.value = 0;
  hasSignature.value = false;
  isDrawing.value = false;
  lastPoint.value = null;

  emit("update:signatureImageBase64", "");
  emit("update:accepted", false);
};

const getScrollElement = () => {
  return dialogBodyRef.value?.$el || dialogBodyRef.value || null;
};

const handleBodyScroll = () => {
  const el = getScrollElement();
  if (!el) return;

  const maxScroll = Math.max(el.scrollHeight - el.clientHeight, 1);
  const current = Math.max(el.scrollTop, 0);
  const progress = Math.min((current / maxScroll) * 100, 100);

  readProgress.value = Math.round(progress);

  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 32) {
    hasScrolledToBottom.value = true;
    readProgress.value = 100;
  }
};

const prepareSignatureCanvas = () => {
  const canvas = signatureCanvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(rect.width, 320);
  const height = 180;
  const ratio = window.devicePixelRatio || 1;

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#0f172a";
};

const getCanvasPoint = (event) => {
  const canvas = signatureCanvasRef.value;
  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  const sourceEvent = event.touches?.[0] || event.changedTouches?.[0] || event;

  return {
    x: sourceEvent.clientX - rect.left,
    y: sourceEvent.clientY - rect.top,
  };
};

const startDrawing = (event) => {
  if (props.saving) return;

  prepareSignatureCanvas();

  const point = getCanvasPoint(event);
  if (!point) return;

  isDrawing.value = true;
  lastPoint.value = point;
};

const drawSignature = (event) => {
  if (!isDrawing.value || props.saving) return;

  const canvas = signatureCanvasRef.value;
  const ctx = canvas?.getContext("2d");
  const currentPoint = getCanvasPoint(event);

  if (!canvas || !ctx || !currentPoint || !lastPoint.value) return;

  ctx.beginPath();
  ctx.moveTo(lastPoint.value.x, lastPoint.value.y);
  ctx.lineTo(currentPoint.x, currentPoint.y);
  ctx.stroke();

  lastPoint.value = currentPoint;
  hasSignature.value = true;
};

const stopDrawing = () => {
  if (!isDrawing.value) return;

  isDrawing.value = false;
  lastPoint.value = null;

  updateSignatureImage();
};

const updateSignatureImage = () => {
  const canvas = signatureCanvasRef.value;
  if (!canvas || !hasSignature.value) return;

  signatureImageModel.value = canvas.toDataURL("image/png");
};

const clearSignature = async () => {
  const canvas = signatureCanvasRef.value;
  const ctx = canvas?.getContext("2d");

  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  hasSignature.value = false;
  signatureImageModel.value = "";

  await nextTick();
  prepareSignatureCanvas();
};

const emitSign = () => {
  if (signDisabled.value) return;
  updateSignatureImage();
  emit("sign");
};

const money = (value, currency = "DOP") => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const numberValue = (value) => {
  const n = Number(value || 0);
  return Number.isInteger(n) ? n : n.toFixed(2);
};

const dateValue = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "short",
  }).format(date);
};
</script>

<style scoped>
.contract-dialog {
  width: 1120px;
  max-width: 96vw;
  max-height: 92vh;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
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
  font-size: 0.78rem;
  opacity: 0.86;
}

.read-progress {
  height: 4px;
  background: rgba(15, 23, 42, 0.08);
}

.read-progress-bar {
  height: 100%;
  transition: width 0.18s ease;
}

.dialog-body {
  flex: 1;
  min-height: 0;
  max-height: calc(92vh - 150px);
  overflow-y: auto;
  padding: 18px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 32%),
    #f8fafc;
}

.dialog-actions {
  padding: 14px 18px;
  background: white;
}

.document-shell {
  display: flex;
  justify-content: center;
}

.document-page {
  width: 100%;
  max-width: 850px;
  min-height: 1100px;
  padding: 56px 64px;
  border-radius: 12px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 20px 46px rgba(15, 23, 42, 0.08);
  color: #111827;
  font-size: 0.95rem;
  line-height: 1.7;
}

.document-title {
  text-align: center;
  color: #0f172a;
  font-size: 1.32rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.document-subtitle {
  max-width: 620px;
  margin: 10px auto 0;
  text-align: center;
  color: #334155;
  font-size: 0.94rem;
  font-weight: 800;
  line-height: 1.45;
  text-transform: uppercase;
}

.document-country {
  margin-top: 18px;
  text-align: center;
  color: #64748b;
  font-weight: 800;
}

.document-section-title {
  margin-top: 28px;
  margin-bottom: 10px;
  color: #0f172a;
  font-size: 0.94rem;
  font-weight: 900;
  text-transform: uppercase;
}

.document-page p {
  margin: 10px 0;
  text-align: justify;
}

.document-page ul,
.document-page ol {
  margin-top: 8px;
  margin-bottom: 12px;
  padding-left: 24px;
}

.amount-box {
  margin: 16px auto;
  padding: 14px 20px;
  max-width: 360px;
  border-radius: 14px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 900;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.12);
}

.detail-grid {
  margin: 14px 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-grid div {
  padding: 12px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.detail-grid span {
  display: block;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-grid strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
}

.signature-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.signature-box {
  min-height: 180px;
  padding: 18px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.signature-preview {
  height: 74px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signature-preview img {
  max-width: 220px;
  max-height: 72px;
  object-fit: contain;
}

.signature-line {
  height: 1px;
  margin-top: 18px;
  margin-bottom: 8px;
  background: #0f172a;
}

.signature-label {
  color: #0f172a;
  font-weight: 900;
  text-transform: uppercase;
}

.signature-text {
  margin-top: 4px;
  color: #334155;
  font-size: 0.86rem;
}

.document-end-marker {
  margin: 34px auto 0;
  padding: 10px 14px;
  width: fit-content;
  border-radius: 999px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  background: #f1f5f9;
  letter-spacing: 0.08em;
}

.contract-card,
.summary-card,
.signature-pad-card {
  border-radius: 18px;
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
  margin-top: 4px;
  color: #64748b;
  font-size: 0.78rem;
}

.mini-label,
.field-label {
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

.field-label {
  margin-bottom: 6px;
}

.field-label.required::before {
  content: "* ";
  color: #e53935;
}

.signature-canvas-wrapper {
  position: relative;
  min-height: 180px;
  border-radius: 18px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(180deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    white;
  background-size: 22px 22px;
  border: 1.5px dashed rgba(15, 23, 42, 0.22);
}

.signature-canvas {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 180px;
  display: block;
  cursor: crosshair;
  touch-action: none;
}

.signature-placeholder {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  color: #94a3b8;
  font-weight: 800;
  pointer-events: none;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 760px) {
  .contract-dialog {
    width: 96vw;
    max-height: 94vh;
    border-radius: 22px;
  }

  .dialog-body {
    max-height: calc(94vh - 150px);
    padding: 12px;
  }

  .document-page {
    padding: 32px 22px;
    font-size: 0.88rem;
    line-height: 1.6;
  }

  .detail-grid,
  .signature-grid {
    grid-template-columns: 1fr;
  }

  .dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .dialog-actions .q-btn {
    width: 100%;
  }
}
</style>
