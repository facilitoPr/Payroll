<template>
  <AppBaseDialog
    :model-value="modelValue"
    title="Administrar cierre de nómina"
    subtitle="Cambia estado, actividad y agrega notas de auditoría."
    icon="edit_note"
    :loading="loading"
    loading-label="Guardando cambios..."
    width="760px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="admin-dialog-content">
      <q-banner rounded class="bg-blue-1 text-blue-grey-9 admin-banner">
        <template #avatar>
          <q-icon name="info" color="primary" />
        </template>

        Este cambio no elimina la data histórica. Para auditoría, se recomienda
        anular o desactivar antes que borrar.
      </q-banner>

      <div class="form-section">
        <div class="form-section-header">
          <div>
            <div class="form-section-title">Información del cierre</div>
            <div class="form-section-subtitle">
              {{ periodLabel }}
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="field-label">Estado</div>
            <q-select
              v-model="form.status"
              :options="statusOptions"
              emit-value
              map-options
              outlined
              dense
              rounded
              color="primary"
              :disable="loading"
            />
          </div>

          <div class="col-12 col-md-6">
            <div class="field-label">Actividad</div>
            <div class="status-toggle-card">
              <div class="row items-center q-gutter-sm">
                <q-icon
                  :name="form.isActive ? 'check_circle' : 'cancel'"
                  :color="form.isActive ? 'positive' : 'negative'"
                />

                <div>
                  <div class="text-subtitle2 text-weight-bold">
                    {{
                      form.isActive
                        ? "Cierre activo"
                        : "Cierre inactivo"
                    }}
                  </div>
                  <div class="text-caption text-grey-7">
                    {{
                      form.isActive
                        ? "Se toma en cuenta en reportes."
                        : "No se toma en cuenta en reportes operativos."
                    }}
                  </div>
                </div>
              </div>

              <q-toggle
                v-model="form.isActive"
                color="primary"
                checked-icon="check"
                unchecked-icon="close"
                dense
                :disable="loading"
              />
            </div>
          </div>

          <div class="col-12">
            <div class="field-label">Número de autorización bancaria</div>
            <q-input
              v-model="form.bankAuthorizationNumber"
              outlined
              dense
              rounded
              color="primary"
              placeholder="Ej: autorización del banco"
              :disable="loading"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-header">
          <div>
            <div class="form-section-title">Notas</div>
            <div class="form-section-subtitle">
              Puedes reemplazar las notas actuales o agregar una nueva nota de
              auditoría.
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div class="field-label">Notas actuales</div>
            <q-input
              v-model="form.notes"
              type="textarea"
              autogrow
              outlined
              dense
              rounded
              color="primary"
              placeholder="Notas del cierre..."
              :disable="loading"
            />
          </div>

          <div class="col-12">
            <div class="field-label">Agregar nota de auditoría</div>
            <q-input
              v-model="form.adminNote"
              type="textarea"
              autogrow
              outlined
              dense
              rounded
              color="primary"
              placeholder="Ej: Se anula porque faltó un empleado / se creó nueva versión con incentivos corregidos..."
              :disable="loading"
            />
          </div>
        </div>
      </div>
    </div>

    <template #actions>
      <q-btn
        flat
        no-caps
        color="negative"
        icon="cancel"
        label="Cancelar"
        class="dialog-action-btn"
        :disable="loading"
        @click="emit('update:modelValue', false)"
      />

      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="save"
        label="Guardar cambios"
        class="dialog-action-btn"
        :loading="loading"
        @click="save"
      />
    </template>
  </AppBaseDialog>
</template>

<script setup>
import AppBaseDialog from "src/components/dialog/AppBaseDialog.vue";
import { computed, reactive, watch } from "vue";


const props = defineProps({
  modelValue: { type: Boolean, default: false },
  run: { type: Object, default: null },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "save"]);

const statusOptions = [
  { label: "Cerrada", value: "CLOSED" },
  { label: "Anulada", value: "CANCELLED" },
];

const form = reactive({
  status: "CLOSED",
  isActive: true,
  notes: "",
  adminNote: "",
  bankAuthorizationNumber: "",
});

const periodLabel = computed(() => {
  if (!props.run) return "Sin cierre seleccionado";

  return `Período ${props.run.periodStart || "—"} → ${
    props.run.periodEnd || "—"
  }`;
});

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      hydrateForm();
    }
  },
);

watch(
  () => props.run,
  () => {
    if (props.modelValue) {
      hydrateForm();
    }
  },
);

const hydrateForm = () => {
  form.status = props.run?.status || "CLOSED";
  form.isActive = props.run?.isActive !== false;
  form.notes = props.run?.notes || "";
  form.adminNote = "";
  form.bankAuthorizationNumber = props.run?.bankAuthorizationNumber || "";
};

const save = () => {
  emit("save", {
    status: form.status,
    isActive: form.isActive,
    notes: form.notes,
    adminNote: form.adminNote,
    bankAuthorizationNumber: form.bankAuthorizationNumber,
  });
};
</script>

<style scoped>
.admin-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-banner {
  border-radius: 18px;
  font-weight: 600;
}

.form-section {
  padding: 16px;
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

.status-toggle-card {
  min-height: 48px;
  padding: 9px 12px;
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
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
</style>