<template>
  <q-dialog v-model="open" persistent>
    <q-card class="bank-dialog column no-wrap">
      <!-- HEADER -->
      <q-card-section
        class="dialog-header bg-primary row items-center justify-between"
      >
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon size="30px" name="account_balance" color="white" />
          </div>

          <div>
            <div class="dialog-title">Datos bancarios</div>
            <div class="dialog-subtitle ellipsis">
              {{ employee?.name || "Empleado no seleccionado" }} ·
              {{ employee?.email || "Sin correo" }}
            </div>
          </div>
        </div>

        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          :disable="saving"
          @click="open = false"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="bank-dialog-body">
        <!-- ESTADO -->
        <div class="form-section">
          <div class="form-section-header row items-start justify-between q-col-gutter-md">
            <div class="col-12 col-md">
              <div class="form-section-title">Estado de inclusión</div>
              <div class="form-section-subtitle">
                Activa esta opción para incluir al empleado en el archivo TXT de nómina.
              </div>
            </div>

            <div class="col-12 col-md-auto">
              <div class="status-card">
                <div class="row items-center no-wrap q-gutter-sm">
                  <q-avatar
                    size="38px"
                    :color="statusColor"
                    text-color="white"
                  >
                    <q-icon :name="statusIcon" size="21px" />
                  </q-avatar>

                  <div>
                    <div class="status-title">{{ statusLabel }}</div>
                    <div class="status-caption">
                      {{ bank.enabled ? "Validación de cuenta" : "Empleado fuera del archivo" }}
                    </div>
                  </div>
                </div>

                <q-toggle
                  v-model="bank.enabled"
                  color="primary"
                  checked-icon="check"
                  unchecked-icon="close"
                  dense
                />
              </div>
            </div>
          </div>

          <q-banner
            v-if="bank.enabled && missingRequired.length"
            rounded
            class="missing-banner"
          >
            <template #avatar>
              <q-icon name="error" color="negative" />
            </template>

            <div class="text-weight-bold">Faltan campos requeridos</div>
            <div class="text-caption">
              Completa: <b>{{ missingRequired.join(", ") }}</b>
            </div>
          </q-banner>
        </div>

        <!-- IDENTIFICACIÓN -->
        <div class="form-section">
          <div class="form-section-header">
            <div>
              <div class="form-section-title">Identificación del beneficiario</div>
              <div class="form-section-subtitle">
                Datos que identifican al empleado dentro del archivo bancario.
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <div class="field-label required">Tipo identificación</div>
              <q-select
                v-model="bank.idType"
                outlined
                dense
                rounded
                color="primary"
                :disable="!bank.enabled"
                emit-value
                map-options
                :options="ID_TYPE_OPTIONS"
                option-label="label"
                option-value="value"
                :rules="bank.enabled ? [req('Tipo identificación')] : []"
                placeholder="RN / CE / PS / OT"
              />
            </div>

            <div class="col-12 col-md-4">
              <div class="field-label required">Número identificación</div>
              <q-input
                v-model="bank.idNumber"
                outlined
                dense
                rounded
                color="primary"
                :maxlength="15"
                counter
                :disable="!bank.enabled"
                placeholder="Cédula/RNC/Pasaporte"
                :rules="bank.enabled ? [req('Número identificación')] : []"
              />
            </div>

            <div class="col-12 col-md-4">
              <div class="field-label">Referencia</div>
              <q-input
                v-model="bank.referenceNumber"
                outlined
                dense
                rounded
                color="primary"
                :maxlength="12"
                counter
                :disable="!bank.enabled"
                placeholder="Opcional"
              />
            </div>
          </div>
        </div>

        <!-- BANCO -->
        <div class="form-section">
          <div class="form-section-header">
            <div>
              <div class="form-section-title">Banco destino</div>
              <div class="form-section-subtitle">
                Selecciona el banco para autocompletar código y dígito verificador.
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="field-label required">Banco destino</div>

              <q-select
                v-model="bank.bankName"
                outlined
                dense
                rounded
                color="primary"
                :disable="!bank.enabled"
                emit-value
                map-options
                :options="BANK_OPTIONS"
                option-label="label"
                option-value="value"
                placeholder="Selecciona un banco"
                clearable
                :rules="bank.enabled ? [req('Banco')] : []"
              />

              <div class="bank-meta">
                Código: <b>{{ bank.bankCode || "—" }}</b>
                · Dígito: <b>{{ bank.bankDigit || "—" }}</b>
                <span v-if="bank.currency"> · Moneda: <b>{{ bank.currency }}</b></span>
              </div>
            </div>

            <div class="col-12 col-md-3">
              <div class="field-label required">Código banco destino</div>
              <q-input
                v-model="bank.bankCode"
                outlined
                dense
                rounded
                color="primary"
                :maxlength="8"
                counter
                :disable="!bank.enabled"
                placeholder="00000000"
                :rules="bank.enabled ? [req('Código banco')] : []"
              />
            </div>

            <div class="col-12 col-md-3">
              <div class="field-label required">Dígito verificador</div>
              <q-input
                v-model="bank.bankDigit"
                outlined
                dense
                rounded
                color="primary"
                :maxlength="1"
                counter
                :disable="!bank.enabled"
                placeholder="0"
                :rules="bank.enabled ? [req('Dígito banco')] : []"
              />
            </div>
          </div>
        </div>

        <!-- CUENTA -->
        <div class="form-section">
          <div class="form-section-header">
            <div>
              <div class="form-section-title">Cuenta bancaria</div>
              <div class="form-section-subtitle">
                Tipo de cuenta, número y moneda para la transferencia.
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <div class="field-label required">Tipo de cuenta</div>
              <q-select
                v-model="bank.accountType"
                outlined
                dense
                rounded
                color="primary"
                :disable="!bank.enabled"
                emit-value
                map-options
                :options="ACCOUNT_TYPE_OPTIONS"
                option-label="label"
                option-value="value"
                :rules="bank.enabled ? [req('Tipo cuenta')] : []"
                @update:model-value="onAccountTypeChange"
              />
            </div>

            <div class="col-12 col-md-5">
              <div class="field-label required">Número de cuenta</div>
              <q-input
                v-model="bank.accountNumber"
                outlined
                dense
                rounded
                color="primary"
                :maxlength="20"
                counter
                :disable="!bank.enabled"
                placeholder="00000000000000000000"
                :rules="bank.enabled ? [req('Cuenta')] : []"
              />
            </div>

            <div class="col-12 col-md-2">
              <div class="field-label required">Moneda</div>
              <q-select
                v-model="bank.currency"
                outlined
                dense
                rounded
                color="primary"
                :disable="!bank.enabled"
                emit-value
                map-options
                :options="CURRENCY_OPTIONS"
                option-label="label"
                option-value="value"
                :rules="bank.enabled ? [req('Moneda')] : []"
              />
            </div>

            <div class="col-12 col-md-2">
              <div class="field-label required">Operación</div>
              <q-input
                v-model="bank.operationCode"
                outlined
                dense
                rounded
                color="primary"
                disable
                :maxlength="2"
                counter
                placeholder="22 / 32"
                :rules="bank.enabled ? [req('Operación')] : []"
              />
            </div>
          </div>
        </div>

        <!-- CONTACTO -->
        <div class="form-section">
          <div class="form-section-header">
            <div>
              <div class="form-section-title">Contacto del beneficiario</div>
              <div class="form-section-subtitle">
                Información opcional para notificaciones bancarias.
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <div class="field-label">Método contacto</div>
              <q-select
                v-model="bank.contactMethod"
                outlined
                dense
                rounded
                color="primary"
                :disable="!bank.enabled"
                emit-value
                map-options
                :options="CONTACT_METHOD_OPTIONS"
                option-label="label"
                option-value="value"
                placeholder="Opcional"
              />
            </div>

            <div class="col-12 col-md-5">
              <div class="field-label">Email beneficiario</div>
              <q-input
                v-model="bank.emailBenef"
                outlined
                dense
                rounded
                color="primary"
                :maxlength="40"
                counter
                :disable="!bank.enabled || bank.contactMethod !== '1'"
                placeholder="Solo si método = Email"
              />
            </div>

            <div class="col-12 col-md-4">
              <div class="field-label">Fax/Teléfono</div>
              <q-input
                v-model="bank.faxOrPhoneBenef"
                outlined
                dense
                rounded
                color="primary"
                :maxlength="12"
                counter
                :disable="
                  !bank.enabled ||
                  (bank.contactMethod !== '2' && bank.contactMethod !== '3')
                "
                placeholder="Solo si método = Fax/Teléfono"
              />
            </div>
          </div>
        </div>

        <!-- OTROS -->
        <div class="form-section">
          <div class="form-section-header">
            <div>
              <div class="form-section-title">Otros datos</div>
              <div class="form-section-subtitle">
                Campos adicionales usados en operaciones especiales.
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <div class="field-label">Adquiriente</div>
              <q-input
                v-model="bank.acquirerId"
                outlined
                dense
                rounded
                color="primary"
                :maxlength="2"
                counter
                :disable="!bank.enabled"
                placeholder="00"
              />
            </div>

            <div class="col-12 col-md-3">
              <div class="field-label">Vencimiento</div>
              <q-input
                v-model="bank.dueDate4"
                outlined
                dense
                rounded
                color="primary"
                :maxlength="4"
                counter
                :disable="!bank.enabled"
                placeholder="Solo op. especiales"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- ACTIONS -->
      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          no-caps
          color="negative"
          label="Cancelar"
          icon="close"
          class="dialog-action-btn"
          :disable="saving"
          @click="open = false"
        />

        <q-btn
          color="primary"
          unelevated
          no-caps
          label="Guardar"
          icon="save"
          class="dialog-action-btn"
          :loading="saving"
          :disable="!employee?._id || (bank.enabled && missingRequired.length)"
          @click="saveBankInfo"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  employee: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue", "saved"]);

const saving = ref(false);

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const defaults = () => ({
  enabled: false,

  accountNumber: "",
  accountType: "",
  currency: "214",

  bankName: "",
  bankCode: "",
  bankDigit: "",

  operationCode: "",
  idType: "",
  idNumber: "",

  referenceNumber: "",
  contactMethod: "",
  emailBenef: "",
  faxOrPhoneBenef: "",
  acquirerId: "00",
  dueDate4: "",
});

const bank = ref(defaults());

const BANKS = [
  { name: "BANCO DE RESERVAS", codes: { 214: "10101010", 840: "80101010" }, digits: { 214: "6", 840: "5" } },
  { name: "BANCO DEL PROGRESO", codes: { 214: "10101110", 840: "80101110" }, digits: { 214: "", 840: "" } },
  { name: "BANCO SCOTIABANK", codes: { 214: "10101030", 840: "80101030" }, digits: { 214: "0", 840: "9" } },
  { name: "CITIBANK", codes: { 214: "10101060", 840: "80101060" }, digits: { 214: "1", 840: "0" } },
  { name: "BANCO POPULAR", codes: { 214: "10101070", 840: "80101070" }, digits: { 214: "8", 840: "7" } },
  { name: "BANCO BHD", codes: { 214: "10101230", 840: "80101230" }, digits: { 214: "8", 840: "7" } },
  { name: "BANCO SANTA CRUZ", codes: { 214: "10101340", 840: "80101340" }, digits: { 214: "4", 840: "3" } },
  { name: "BANCO CARIBE", codes: { 214: "10101350", 840: "80101350" }, digits: { 214: "1", 840: "0" } },
  { name: "BANCO BDI", codes: { 214: "10101360", 840: "80101360" }, digits: { 214: "8", 840: "7" } },
  { name: "BANCO VIMENCA", codes: { 214: "10101380", 840: "80101380" }, digits: { 214: "2", 840: "1" } },
  { name: "BANCO LOPEZ DE HARO", codes: { 214: "10101390", 840: "80101390" }, digits: { 214: "9", 840: "8" } },
  { name: "BANCO PROMERICA", codes: { 214: "44405900", 840: "84405900" }, digits: { 214: "2", 840: "0" } },
  { name: "ASOC POPULAR DE AHORROS Y PRE.", codes: { 214: "47940900", 840: "87940900" }, digits: { 214: "9", 840: "7" } },
  { name: "ASOCIACIÓN CIBAO DE A/P", codes: { 214: "48991200", 840: "88991200" }, digits: { 214: "7", 840: "5" } },
  { name: "BANCO BANESCO", codes: { 214: "11102328", 840: "81102328" }, digits: { 214: "0", 840: "9" } },
  { name: "BANCO MÚLTIPLE ADEMI S,A", codes: { 214: "10101300", 840: "80101300" }, digits: { 214: "6", 840: "5" } },
  { name: "ASOC. LA NACIONAL", codes: { 214: "10231034", 840: "80231034" }, digits: { 214: "2", 840: "1" } },
  { name: "BANCO MULTIPLE LAFISE", codes: { 214: "11121214", 840: "81121214" }, digits: { 214: "3", 840: "2" } },
  { name: "BANCO ATLANTICO", codes: { 214: "11101012", 840: "81101012" }, digits: { 214: "5", 840: "4" } },
  { name: "BANCO UNION", codes: { 214: "30232423", 840: "80232423" }, digits: { 214: "5", 840: "0" } },
  { name: "BANCO AHORRO Y CREDITO FONDESA", codes: { 214: "43491100", 840: "83491100" }, digits: { 214: "8", 840: "7" } },
  { name: "QIK BANCO DIGITAL DOMINICANO", codes: { 214: "13249841", 840: "83249841" }, digits: { 214: "2", 840: "2" } },
  { name: "BANCO AGRICOLA DE LA REPUBLICA", codes: { 214: "40100766", 840: "" }, digits: { 214: "", 840: "" } },
];

const BANK_OPTIONS = computed(() => {
  const cur = String(bank.value.currency || "214");

  return BANKS.map((b) => {
    const code = b.codes?.[cur] || b.codes?.["214"] || "";
    const digit = b.digits?.[cur] || b.digits?.["214"] || "";

    return {
      label: `${b.name}${code ? ` — ${code}` : ""}${digit ? ` (dígito ${digit})` : ""}`,
      value: b.name,
    };
  });
});

const ID_TYPE_OPTIONS = [
  { value: "RN", label: "RN (RNC)" },
  { value: "CE", label: "CE (Cédula)" },
  { value: "PS", label: "PS (Pasaporte)" },
  { value: "OT", label: "OT (Otro)" },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: "1", label: "1 - Corriente" },
  { value: "2", label: "2 - Ahorros" },
];

const CURRENCY_OPTIONS = [
  { value: "214", label: "214 - DOP" },
  { value: "840", label: "840 - USD" },
  { value: "978", label: "978 - EUR" },
];

const CONTACT_METHOD_OPTIONS = [
  { value: "", label: "(Ninguno)" },
  { value: "1", label: "1 - Email" },
  { value: "2", label: "2 - Fax" },
  { value: "3", label: "3 - Teléfono" },
];

const req = (name) => (val) => {
  if (val === null || val === undefined) return `${name} es obligatorio`;
  if (String(val).trim() === "") return `${name} es obligatorio`;
  return true;
};

const missingRequired = computed(() => {
  if (!bank.value.enabled) return [];

  const m = [];
  if (!String(bank.value.idType || "").trim()) m.push("Tipo ID");
  if (!String(bank.value.idNumber || "").trim()) m.push("Número ID");
  if (!String(bank.value.bankCode || "").trim()) m.push("Banco");
  if (!String(bank.value.bankDigit || "").trim()) m.push("Dígito");
  if (!String(bank.value.accountType || "").trim()) m.push("Tipo cuenta");
  if (!String(bank.value.accountNumber || "").trim()) m.push("Cuenta");
  if (!String(bank.value.currency || "").trim()) m.push("Moneda");
  if (!String(bank.value.operationCode || "").trim()) m.push("Operación");
  return m;
});

const statusLabel = computed(() => {
  if (!bank.value.enabled) return "No incluido";
  if (missingRequired.value.length) return "Incompleto";
  return "Listo";
});

const statusColor = computed(() => {
  if (!bank.value.enabled) return "grey-7";
  if (missingRequired.value.length) return "negative";
  return "positive";
});

const statusIcon = computed(() => {
  if (!bank.value.enabled) return "block";
  if (missingRequired.value.length) return "error";
  return "check";
});

const toFormData = (obj) => {
  const fd = new FormData();

  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return;

    if (typeof v === "object") {
      fd.append(k, JSON.stringify(v));
      return;
    }

    fd.append(k, String(v));
  });

  return fd;
};

const saveBankInfo = async () => {
  if (!props.employee?._id) return;

  saving.value = true;

  try {
    const payload = { payrollBank: bank.value };
    const fd = toFormData(payload);

    const resp = await methodsHttp.putApi(
      `user/updateEmployee/${props.employee._id}`,
      fd,
    );

    if (resp?.ok) {
      emit("saved", bank.value);
      open.value = false;
      bank.value = defaults();
    } else {
      console.error(resp);
    }
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
};

const applyBankMeta = () => {
  const bankName = String(bank.value.bankName || "").trim();
  if (!bankName) return;

  const found = BANKS.find((b) => b.name === bankName);
  if (!found) return;

  const cur = String(bank.value.currency || "214");

  const code = found.codes?.[cur] ?? found.codes?.["214"] ?? "";
  const digit = found.digits?.[cur] ?? found.digits?.["214"] ?? "";

  bank.value.bankCode = String(code || bank.value.bankCode || "").slice(0, 8);
  bank.value.bankDigit = String(digit || bank.value.bankDigit || "").slice(0, 1);
};

const inferBankNameFromCode = () => {
  const code = String(bank.value.bankCode || "").trim();
  if (!code) return;

  const cur = String(bank.value.currency || "214");
  const matches = BANKS.filter(
    (b) => String(b.codes?.[cur] || b.codes?.["214"] || "") === code,
  );

  if (matches.length === 1) {
    bank.value.bankName = matches[0].name;
  }
};

const applyOperationCode = () => {
  const t = String(bank.value.accountType || "").trim();

  if (!t) {
    bank.value.operationCode = "";
    return;
  }

  if (t === "1") bank.value.operationCode = "22";
  else if (t === "2") bank.value.operationCode = "32";
};

const onAccountTypeChange = () => {
  applyOperationCode();
};

watch(() => bank.value.bankName, applyBankMeta);

watch(() => bank.value.currency, () => {
  applyBankMeta();
});

watch(
  () => bank.value.bankCode,
  () => {
    if (!String(bank.value.bankName || "").trim()) inferBankNameFromCode();
  },
);

watch(() => bank.value.accountType, applyOperationCode, { immediate: true });

watch(
  () => props.employee,
  (emp) => {
    bank.value = { ...defaults(), ...(emp?.payrollBank || {}) };

    if (!bank.value.bankName) inferBankNameFromCode();

    applyBankMeta();
    applyOperationCode();
  },
  { immediate: true },
);
</script>

<style scoped>
.bank-dialog {
  width: 1120px;
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
  max-width: 680px;
  font-size: 0.78rem;
  opacity: 0.86;
}

.bank-dialog-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(92vh - 154px);
  padding: 18px;
  background: #f8fafc;
}

.form-section {
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.form-section-header {
  margin-bottom: 14px;
}

.form-section-title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.form-section-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.field-label {
  margin-bottom: 6px;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-label.required::before {
  content: "* ";
  color: #e53935;
}

.status-card {
  min-width: 330px;
  padding: 10px 12px;
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.04);
}

.status-title {
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 900;
  line-height: 1.1;
}

.status-caption {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
}

.missing-banner {
  margin-top: 14px;
  border-radius: 18px;
  color: #991b1b;
  background: #fee2e2;
  border: 1px solid rgba(239, 68, 68, 0.18);
}

.bank-meta {
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 14px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  font-size: 0.78rem;
  font-weight: 600;
}

.dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
}

.dialog-action-btn {
  border-radius: 999px;
  padding-left: 18px;
  padding-right: 18px;
  font-weight: 800;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

:deep(.q-field--outlined.q-field--rounded .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 768px) {
  .bank-dialog {
    width: 96vw;
    max-height: 94vh;
  }

  .bank-dialog-body {
    max-height: calc(94vh - 154px);
    padding: 12px;
  }

  .form-section {
    padding: 12px;
  }

  .status-card {
    min-width: 100%;
  }
}
</style>