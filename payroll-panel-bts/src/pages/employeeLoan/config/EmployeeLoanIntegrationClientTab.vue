<template>
  <div class="integration-client-tab">
    <q-card flat bordered class="panel-card">
      <q-card-section class="panel-header row items-center justify-between">
        <div>
          <div class="panel-title">Sistemas autorizados</div>
          <div class="panel-subtitle">
            Configura qué otros payrolls pueden consultar la API principal de préstamos.
          </div>
        </div>

        <div class="row items-center q-gutter-sm">
          <q-btn
            unelevated
            rounded
            no-caps
            color="primary"
            icon="add"
            label="Nueva integración"
            @click="openDialog()"
          />

          <q-btn
            unelevated
            rounded
            no-caps
            color="primary"
            icon="refresh"
            label="Actualizar"
            :loading="loading"
            @click="reload"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        flat
        bordered
        row-key="_id"
        class="main-table"
        :rows="rows"
        :columns="columns"
        :loading="loading"
        hide-pagination
        :rows-per-page-options="[0]"
      >
        <template #body-cell-systemCode="props">
          <q-td :props="props">
            <div class="text-weight-bold text-dark">
              {{ props.row.name }}
            </div>
            <div class="text-caption text-grey-7">
              {{ props.row.systemCode }}
            </div>
          </q-td>
        </template>

        <template #body-cell-allowedProductCodes="props">
          <q-td :props="props">
            <div class="row q-gutter-xs">
              <q-chip
                v-for="code in props.row.allowedProductCodes || []"
                :key="code"
                dense
                color="blue-1"
                text-color="primary"
              >
                {{ code }}
              </q-chip>

              <span
                v-if="!(props.row.allowedProductCodes || []).length"
                class="text-grey-6"
              >
                Producto predeterminado
              </span>
            </div>
          </q-td>
        </template>

        <template #body-cell-permissions="props">
          <q-td :props="props">
            <div class="row q-gutter-xs">
              <q-chip
                dense
                :color="props.row.canQuote ? 'green-1' : 'grey-3'"
                :text-color="props.row.canQuote ? 'positive' : 'grey-7'"
                icon="request_quote"
              >
                Cotizar
              </q-chip>

              <q-chip
                dense
                :color="props.row.canCreateRequests ? 'green-1' : 'grey-3'"
                :text-color="props.row.canCreateRequests ? 'positive' : 'grey-7'"
                icon="send"
              >
                Crear
              </q-chip>

              <q-chip
                dense
                :color="props.row.canCheckStatus ? 'green-1' : 'grey-3'"
                :text-color="props.row.canCheckStatus ? 'positive' : 'grey-7'"
                icon="fact_check"
              >
                Estado
              </q-chip>
            </div>
          </q-td>
        </template>

        <template #body-cell-usage="props">
          <q-td :props="props">
            <div class="text-weight-bold">
              {{ numberValue(props.row.usageCount || 0) }}
            </div>
            <div class="text-caption text-grey-7">
              Último uso: {{ formatDate(props.row.lastUsedAt) }}
            </div>
          </q-td>
        </template>

        <template #body-cell-isActive="props">
          <q-td :props="props">
            <q-badge
              rounded
              :color="props.row.isActive ? 'positive' : 'negative'"
              text-color="white"
            >
              {{ props.row.isActive ? "Activa" : "Inactiva" }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" auto-width>
            <div class="row items-center no-wrap q-gutter-xs">
              <q-btn
                dense
                round
                flat
                color="primary"
                icon="edit"
                @click="openDialog(props.row)"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>

              <q-btn
                dense
                round
                flat
                color="orange-10"
                icon="vpn_key"
                @click="confirmRegenerateApiKey(props.row)"
              >
                <q-tooltip>Regenerar API key</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <template #no-data>
          <div class="full-width text-center q-pa-xl text-grey-7">
            <q-icon name="hub" size="46px" color="grey-5" />
            <div class="text-subtitle1 text-weight-bold q-mt-sm">
              No hay integraciones registradas
            </div>
            <div class="text-caption">
              Agrega los sistemas externos autorizados para consultar préstamos.
            </div>
          </div>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialog.open" persistent>
      <q-card class="form-dialog">
        <q-inner-loading
          :showing="saving"
          label="Guardando integración..."
          label-class="text-primary"
        />

        <q-card-section class="dialog-header bg-primary row items-center justify-between">
          <div class="row items-center no-wrap text-white">
            <div class="dialog-icon">
              <q-icon name="hub" size="30px" />
            </div>

            <div>
              <div class="dialog-title">
                {{ dialog.isEdit ? "Editar integración" : "Nueva integración" }}
              </div>
              <div class="dialog-subtitle">
                Autoriza un payroll externo para consultar esta API principal.
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

        <q-card-section class="dialog-body">
          <q-banner rounded class="bg-blue-1 text-primary q-mb-md">
            <template #avatar>
              <q-icon name="info" color="primary" />
            </template>

            La API key se genera automáticamente al crear la integración. Por seguridad,
            solo se mostrará una vez. Si se pierde, deberás regenerarla.
          </q-banner>

          <q-card flat bordered class="section-card q-mb-md">
            <q-card-section>
              <div class="section-title">Datos de la integración</div>
              <div class="section-subtitle">
                Define el sistema externo autorizado y los productos de préstamo que podrá usar.
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-6">
                  <div class="field-label required">Nombre</div>
                  <q-input
                    v-model="form.name"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: Payroll Guimanfer"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <div class="field-label required">Código del sistema</div>
                  <q-input
                    v-model="form.systemCode"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: GUIMANFER_PAYROLL"
                    :disable="dialog.isEdit"
                  />
                </div>

                <div class="col-12">
                  <div class="field-label">Descripción</div>
                  <q-input
                    v-model="form.description"
                    outlined
                    dense
                    rounded
                    autogrow
                    type="textarea"
                    color="primary"
                    label="Descripción interna"
                  />
                </div>

                <div class="col-12">
                  <div class="field-label">Productos permitidos</div>
                  <q-input
                    v-model="form.allowedProductCodesText"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: EMPLOYEE_LOAN_STANDARD, EMPLOYEE_LOAN_SPECIAL"
                  />
                  <div class="hint-text">
                    Separa los códigos por coma. Si lo dejas vacío, el backend puede usar
                    el producto predeterminado.
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="section-card q-mb-md">
            <q-card-section>
              <div class="section-title">Permisos</div>
              <div class="section-subtitle">
                Controla qué puede hacer este sistema externo.
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-4">
                  <q-toggle
                    v-model="form.canQuote"
                    color="primary"
                    label="Puede cotizar"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <q-toggle
                    v-model="form.canCreateRequests"
                    color="primary"
                    label="Puede crear solicitudes"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <q-toggle
                    v-model="form.canCheckStatus"
                    color="primary"
                    label="Puede consultar estado"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <q-toggle
                    v-model="form.isActive"
                    color="positive"
                    label="Activa"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="section-card">
            <q-card-section>
              <div class="section-title">Seguridad opcional</div>
              <div class="section-subtitle">
                Puedes limitar orígenes, IPs o fecha de expiración.
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12">
                  <div class="field-label">Orígenes permitidos</div>
                  <q-input
                    v-model="form.allowedOriginsText"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: https://cliente.com, https://panel.cliente.com"
                  />
                </div>

                <div class="col-12">
                  <div class="field-label">IPs permitidas</div>
                  <q-input
                    v-model="form.allowedIpsText"
                    outlined
                    dense
                    rounded
                    color="primary"
                    label="Ej: 192.168.1.1, 10.0.0.2"
                  />
                </div>

                <div class="col-12 col-md-4">
                  <div class="field-label">Expira en</div>
                  <q-input
                    v-model="form.expiresAt"
                    outlined
                    dense
                    rounded
                    color="primary"
                    type="date"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
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
            icon="save"
            label="Guardar"
            :loading="saving"
            :disable="formHasError"
            @click="save"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="generatedApiKeyDialog.open" persistent>
      <q-card class="api-key-dialog">
        <q-card-section class="dialog-header bg-primary row items-center justify-between">
          <div class="row items-center no-wrap text-white">
            <div class="dialog-icon">
              <q-icon name="vpn_key" size="30px" />
            </div>

            <div>
              <div class="dialog-title">API key generada</div>
              <div class="dialog-subtitle">
                Guarda esta clave ahora. No se volverá a mostrar.
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="dialog-body">
          <q-banner rounded class="bg-orange-1 text-orange-10 q-mb-md">
            <template #avatar>
              <q-icon name="warning" color="orange-10" />
            </template>

            Copia esta API key y guárdala en el proyecto externo. Si la pierdes,
            tendrás que regenerarla y actualizarla en ese proyecto.
          </q-banner>

          <div class="field-label">API key</div>

          <q-input
            :model-value="generatedApiKeyDialog.apiKey"
            readonly
            outlined
            dense
            rounded
            color="primary"
          >
            <template #append>
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="content_copy"
                @click="copyGeneratedApiKey"
              >
                <q-tooltip>Copiar</q-tooltip>
              </q-btn>
            </template>
          </q-input>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="dialog-actions">
          <q-btn
            unelevated
            rounded
            no-caps
            color="primary"
            icon="check"
            label="Entendido"
            @click="closeGeneratedApiKeyDialog"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { copyToClipboard, useQuasar } from "quasar";
import moment from "moment";

import methodsHttp from "src/api/methodsHttp";

const emit = defineEmits(["loading"]);
const $q = useQuasar();

const loading = ref(false);
const saving = ref(false);
const rows = ref([]);

const dialog = ref({
  open: false,
  isEdit: false,
  id: null,
});

const generatedApiKeyDialog = ref({
  open: false,
  apiKey: "",
});

const defaultForm = () => ({
  systemCode: "",
  name: "",
  description: "",

  allowedProductCodesText: "EMPLOYEE_LOAN_STANDARD",

  canQuote: true,
  canCreateRequests: true,
  canCheckStatus: true,

  allowedOriginsText: "",
  allowedIpsText: "",
  expiresAt: "",

  isActive: true,
});

const form = ref(defaultForm());

const columns = [
  {
    name: "actions",
    label: "Acciones",
    align: "center",
    field: () => "",
  },
  {
    name: "systemCode",
    label: "Sistema",
    align: "left",
    field: "systemCode",
  },
  {
    name: "allowedProductCodes",
    label: "Productos",
    align: "left",
    field: "allowedProductCodes",
  },
  {
    name: "permissions",
    label: "Permisos",
    align: "left",
    field: () => "",
  },
  {
    name: "usage",
    label: "Uso",
    align: "left",
    field: "usageCount",
  },
  {
    name: "isActive",
    label: "Estado",
    align: "center",
    field: "isActive",
  },
];

const formHasError = computed(() => {
  if (!String(form.value.name || "").trim()) return true;
  if (!String(form.value.systemCode || "").trim()) return true;

  return false;
});

onMounted(async () => {
  await reload();
});

const reload = async () => {
  loading.value = true;
  emit("loading", true);

  try {
    const resp = await methodsHttp.getApi("employee-loan/integration-clients");

    if (resp?.ok) {
      rows.value = resp.clients || resp.data || [];
      return;
    }

    rows.value = [];
  } catch (error) {
    console.error("reload integration clients error:", error);
    rows.value = [];

    $q.notify({
      type: "negative",
      message: "Error cargando integraciones.",
    });
  } finally {
    loading.value = false;
    emit("loading", false);
  }
};

const openDialog = (row = null) => {
  if (row) {
    dialog.value = {
      open: true,
      isEdit: true,
      id: row._id,
    };

    form.value = {
      ...defaultForm(),
      ...row,
      allowedProductCodesText: arrayToText(row.allowedProductCodes),
      allowedOriginsText: arrayToText(row.allowedOrigins),
      allowedIpsText: arrayToText(row.allowedIps),
      expiresAt: row.expiresAt ? moment(row.expiresAt).format("YYYY-MM-DD") : "",
    };

    return;
  }

  dialog.value = {
    open: true,
    isEdit: false,
    id: null,
  };

  form.value = defaultForm();
};

const closeDialog = () => {
  if (saving.value) return;

  dialog.value = {
    open: false,
    isEdit: false,
    id: null,
  };

  form.value = defaultForm();
};

const textToArray = (value) => {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const arrayToText = (value) => {
  return Array.isArray(value) ? value.join(", ") : "";
};

const buildPayload = () => {
  return {
    systemCode: String(form.value.systemCode || "").trim().toUpperCase(),
    name: String(form.value.name || "").trim(),
    description: String(form.value.description || "").trim(),

    allowedProductCodes: textToArray(form.value.allowedProductCodesText).map(
      (item) => String(item).toUpperCase(),
    ),

    canQuote: Boolean(form.value.canQuote),
    canCreateRequests: Boolean(form.value.canCreateRequests),
    canCheckStatus: Boolean(form.value.canCheckStatus),

    allowedOrigins: textToArray(form.value.allowedOriginsText),
    allowedIps: textToArray(form.value.allowedIpsText),

    expiresAt: form.value.expiresAt || null,

    isActive: Boolean(form.value.isActive),
  };
};

const save = async () => {
  saving.value = true;

  try {
    const payload = buildPayload();

    const resp = dialog.value.isEdit
      ? await methodsHttp.putApi(
          `employee-loan/integration-clients/${dialog.value.id}`,
          payload,
        )
      : await methodsHttp.postApi("employee-loan/integration-clients", payload);

    if (resp?.ok) {
      closeDialog();
      await reload();

      $q.notify({
        type: "positive",
        message: resp.mensaje || "Integración guardada correctamente.",
      });

      if (resp.generatedApiKey) {
        openGeneratedApiKeyDialog(resp.generatedApiKey);
      }

      return;
    }

    $q.notify({
      type: "negative",
      message: resp?.mensaje || "No se pudo guardar la integración.",
    });
  } catch (error) {
    console.error("save integration client error:", error);

    $q.notify({
      type: "negative",
      message: "Error guardando integración.",
    });
  } finally {
    saving.value = false;
  }
};

const confirmRegenerateApiKey = (row) => {
  $q.dialog({
    title: "Regenerar API key",
    message: `¿Seguro que deseas regenerar la API key de ${row.name}? La clave anterior dejará de funcionar.`,
    cancel: true,
    persistent: true,
    ok: {
      label: "Regenerar",
      color: "negative",
      rounded: true,
      unelevated: true,
      noCaps: true,
    },
    cancel: {
      label: "Cancelar",
      flat: true,
      rounded: true,
      noCaps: true,
    },
  }).onOk(async () => {
    await regenerateApiKey(row);
  });
};

const regenerateApiKey = async (row) => {
  if (!row?._id) return;

  saving.value = true;

  try {
    const resp = await methodsHttp.postApi(
      `employee-loan/integration-clients/${row._id}/regenerate-api-key`,
      {},
    );

    if (resp?.ok) {
      await reload();

      $q.notify({
        type: "positive",
        message: resp.mensaje || "API key regenerada correctamente.",
      });

      if (resp.generatedApiKey) {
        openGeneratedApiKeyDialog(resp.generatedApiKey);
      }

      return;
    }

    $q.notify({
      type: "negative",
      message: resp?.mensaje || "No se pudo regenerar la API key.",
    });
  } catch (error) {
    console.error("regenerateApiKey error:", error);

    $q.notify({
      type: "negative",
      message: "Error regenerando API key.",
    });
  } finally {
    saving.value = false;
  }
};

const openGeneratedApiKeyDialog = (apiKey) => {
  generatedApiKeyDialog.value = {
    open: true,
    apiKey,
  };
};

const closeGeneratedApiKeyDialog = () => {
  generatedApiKeyDialog.value = {
    open: false,
    apiKey: "",
  };
};

const copyGeneratedApiKey = async () => {
  try {
    await copyToClipboard(generatedApiKeyDialog.value.apiKey);

    $q.notify({
      type: "positive",
      message: "API key copiada.",
    });
  } catch (error) {
    $q.notify({
      type: "negative",
      message: "No se pudo copiar la API key.",
    });
  }
};

const numberValue = (value) => {
  const n = Number(value || 0);
  return Number.isInteger(n) ? n : n.toFixed(2);
};

const formatDate = (value) => {
  if (!value) return "-";
  return moment(value).format("YYYY/MM/DD hh:mm A");
};

defineExpose({
  reload,
});
</script>

<style scoped>
.integration-client-tab {
  min-height: 400px;
}

.panel-card {
  border-radius: 22px;
  overflow: hidden;
  background: white;
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.04);
}

.panel-header {
  min-height: 82px;
  background: white;
}

.panel-title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.panel-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}

.main-table {
  background: white;
}

.form-dialog,
.api-key-dialog {
  width: 1050px;
  max-width: 96vw;
  max-height: 92vh;
  border-radius: 22px;
  overflow: hidden;
}

.api-key-dialog {
  width: 720px;
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

.dialog-body {
  max-height: calc(92vh - 150px);
  overflow-y: auto;
  padding: 18px;
  background: #f8fafc;
}

.dialog-actions {
  padding: 14px 18px;
  background: white;
}

.section-card {
  border-radius: 20px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.section-title {
  color: #0f172a;
  font-size: 0.98rem;
  font-weight: 900;
}

.section-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}

.field-label {
  margin-bottom: 6px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-label.required::before {
  content: "* ";
  color: #e53935;
}

.hint-text {
  margin-top: 5px;
  color: #64748b;
  font-size: 0.76rem;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}
</style>