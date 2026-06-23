<template>
  <q-dialog v-model="open" persistent>
    <q-card class="reset-password-dialog">
      <q-inner-loading
        :showing="loading"
        label="Actualizando contraseña..."
        label-class="text-primary"
        label-style="font-size: 1.05em"
        class="z-max"
      />

      <q-card-section class="dialog-header bg-primary row items-center justify-between">
        <div class="row items-center no-wrap text-white">
          <div class="dialog-icon">
            <q-icon size="28px" name="lock_reset" color="white" />
          </div>

          <div>
            <div class="dialog-title">Resetear contraseña</div>
            <div class="dialog-subtitle">
              Genera o asigna una nueva contraseña al usuario.
            </div>
          </div>
        </div>

        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          :disable="loading"
          @click="closeModal"
        />
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="employee-card">
          <q-avatar size="48px" color="primary" text-color="white">
            <span>{{ employeeInitials }}</span>
          </q-avatar>

          <div>
            <div class="text-subtitle2 text-weight-bold">
              {{ employee?.name || "Usuario" }}
            </div>

            <div class="text-caption text-grey-7">
              {{ employee?.email || "Sin correo registrado" }}
            </div>
          </div>
        </div>

        <q-banner class="bg-blue-1 text-primary q-mt-md q-mb-md rounded-banner" rounded>
          <template #avatar>
            <q-icon name="info" color="primary" />
          </template>

          La contraseña generada se mostrará solo en esta ventana. Cópiala antes
          de cerrar el modal.
        </q-banner>

        <q-card flat bordered class="option-card q-mb-md">
          <div>
            <div class="text-subtitle2 text-weight-bold">
              Generar automáticamente
            </div>
            <div class="text-caption text-grey-7">
              El sistema creará una contraseña temporal segura.
            </div>
          </div>

          <q-toggle
            v-model="autoGenerate"
            color="primary"
            checked-icon="check"
            unchecked-icon="close"
          />
        </q-card>

        <div v-if="!autoGenerate" class="row q-col-gutter-md">
          <div class="col-12">
            <div class="field-label required">Nueva contraseña</div>

            <q-input
              v-model="password"
              outlined
              dense
              rounded
              color="primary"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Mínimo 8 caracteres"
            >
              <template #prepend>
                <q-icon name="lock" color="primary" />
              </template>

              <template #append>
                <q-btn
                  flat
                  dense
                  round
                  :icon="showPassword ? 'visibility_off' : 'visibility'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>
          </div>

          <div class="col-12">
            <div class="field-label required">Confirmar contraseña</div>

            <q-input
              v-model="confirmPassword"
              outlined
              dense
              rounded
              color="primary"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Repite la contraseña"
            >
              <template #prepend>
                <q-icon name="verified_user" color="primary" />
              </template>

              <template #append>
                <q-btn
                  flat
                  dense
                  round
                  :icon="showConfirmPassword ? 'visibility_off' : 'visibility'"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </q-input>
          </div>
        </div>

        <q-card
          v-if="generatedPassword"
          flat
          bordered
          class="generated-password-card q-mt-md"
        >
          <div>
            <div class="text-caption text-grey-7">Contraseña generada</div>
            <div class="generated-password-text">
              {{ generatedPassword }}
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="content_copy"
            color="primary"
            @click="copyGeneratedPassword"
          >
            <q-tooltip>Copiar contraseña</q-tooltip>
          </q-btn>
        </q-card>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          no-caps
          color="negative"
          label="Cancelar"
          icon="cancel"
          class="dialog-action-btn"
          :disable="loading"
          @click="closeModal"
        />

        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Resetear contraseña"
          icon="lock_reset"
          class="dialog-action-btn"
          :loading="loading"
          :disable="buttonDisabled"
          @click="resetPassword"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from "vue";
import { copyToClipboard, useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const emit = defineEmits(["saved"]);

const props = defineProps({
  endpoint: {
    type: String,
    default: "user/resetEmployeePassword",
  },
});

const $q = useQuasar();

const open = ref(false);
const loading = ref(false);
const employee = ref(null);

const autoGenerate = ref(true);
const password = ref("");
const confirmPassword = ref("");
const generatedPassword = ref("");

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const employeeInitials = computed(() => {
  const value = String(employee.value?.name || employee.value?.email || "U").trim();

  if (!value) return "U";

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
});

const buttonDisabled = computed(() => {
  if (loading.value) return true;

  if (autoGenerate.value) return false;

  return (
    !password.value ||
    !confirmPassword.value ||
    password.value.length < 8 ||
    password.value !== confirmPassword.value
  );
});

const notifyGood = (message) => {
  $q.notify({
    type: "positive",
    message,
    position: "top-right",
  });
};

const notifyBad = (message) => {
  $q.notify({
    type: "negative",
    message,
    position: "top-right",
  });
};

const openModal = (item) => {
  employee.value = item || null;
  autoGenerate.value = true;
  password.value = "";
  confirmPassword.value = "";
  generatedPassword.value = "";
  showPassword.value = false;
  showConfirmPassword.value = false;
  open.value = true;
};

const closeModal = () => {
  if (loading.value) return;

  open.value = false;
  employee.value = null;
  autoGenerate.value = true;
  password.value = "";
  confirmPassword.value = "";
  generatedPassword.value = "";
  showPassword.value = false;
  showConfirmPassword.value = false;
};

const validateManualPassword = () => {
  if (autoGenerate.value) return true;

  if (!password.value || password.value.trim().length < 8) {
    notifyBad("La contraseña debe tener al menos 8 caracteres");
    return false;
  }

  if (password.value !== confirmPassword.value) {
    notifyBad("Las contraseñas no coinciden");
    return false;
  }

  return true;
};

const resetPassword = async () => {
  const employeeId = employee.value?._id;

  if (!employeeId) {
    notifyBad("Usuario inválido");
    return;
  }

  if (!validateManualPassword()) return;

  loading.value = true;

  try {
    const resp = await methodsHttp.putApi(`${props.endpoint}/${employeeId}`, {
      autoGenerate: autoGenerate.value,
      password: autoGenerate.value ? "" : password.value,
    });

    if (resp?.ok) {
      notifyGood(resp.mensaje || "Contraseña actualizada correctamente");

      if (resp.temporaryPassword) {
        generatedPassword.value = resp.temporaryPassword;
      } else {
        closeModal();
      }

      emit("saved", resp);
      return;
    }

    notifyBad(resp?.mensaje || "No se pudo resetear la contraseña");
  } catch (error) {
    console.error("resetPassword error:", error);
    notifyBad("Error al resetear la contraseña");
  } finally {
    loading.value = false;
  }
};

const copyGeneratedPassword = async () => {
  if (!generatedPassword.value) return;

  try {
    await copyToClipboard(generatedPassword.value);
    notifyGood("Contraseña copiada");
  } catch (error) {
    console.error("copyGeneratedPassword error:", error);
    notifyBad("No se pudo copiar la contraseña");
  }
};

defineExpose({
  openModal,
  closeModal,
});
</script>

<style scoped>
.reset-password-dialog {
  width: 560px;
  max-width: 96vw;
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
  font-size: 0.78rem;
  opacity: 0.86;
}

.employee-card {
  padding: 14px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.option-card {
  padding: 14px 16px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
}

.generated-password-card {
  padding: 14px 16px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
}

.generated-password-text {
  margin-top: 4px;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: #0f172a;
}

.rounded-banner {
  border-radius: 16px;
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

@media (max-width: 600px) {
  .dialog-header {
    align-items: flex-start;
  }

  .dialog-subtitle {
    display: none;
  }

  .employee-card {
    align-items: flex-start;
  }

  .option-card,
  .generated-password-card {
    align-items: flex-start;
    gap: 12px;
  }
}
</style>