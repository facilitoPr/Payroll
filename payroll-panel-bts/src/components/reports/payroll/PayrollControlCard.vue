<template>
  <q-card flat bordered class="payroll-control-card">
    <q-card-section class="control-header">
      <div class="row items-start justify-between q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="header-title">
            <div class="header-icon">
              <q-icon name="price_check" size="22px" />
            </div>

            <div>
              <div class="text-subtitle1 text-weight-bold text-dark">
                Control de nómina del día
              </div>
              <div class="text-caption text-grey-7">
                Aprueba minutos o fuerza el comportamiento de descuento con
                auditoría.
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-auto">
          <q-badge
            class="impact-badge"
            :color="impactColor"
            text-color="white"
          >
            <q-icon :name="impactIcon" size="15px" class="q-mr-xs" />
            {{ impactLabel }}
          </q-badge>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pa-md">
      <div class="preview-grid q-mb-md">
        <div class="preview-card">
          <div class="preview-icon preview-icon--expected">
            <q-icon name="event_available" size="20px" />
          </div>

          <div>
            <div class="preview-label">Esperado</div>
            <div class="preview-value">{{ round2(preview.expected / 60) }}h</div>
            <div class="preview-caption">{{ preview.expected }} min</div>
          </div>
        </div>

        <div class="preview-card">
          <div class="preview-icon preview-icon--worked">
            <q-icon name="timer" size="20px" />
          </div>

          <div>
            <div class="preview-label">Trabajado</div>
            <div class="preview-value">{{ round2(preview.worked / 60) }}h</div>
            <div class="preview-caption">{{ preview.worked }} min</div>
          </div>
        </div>

        <div class="preview-card">
          <div class="preview-icon preview-icon--paid">
            <q-icon name="payments" size="20px" />
          </div>

          <div>
            <div class="preview-label">Pagable</div>
            <div class="preview-value">{{ round2(preview.paid / 60) }}h</div>
            <div class="preview-caption">{{ preview.paid }} min</div>
          </div>
        </div>

        <div class="preview-card">
          <div
            class="preview-icon"
            :class="
              preview.notWorked > 0
                ? 'preview-icon--missing'
                : 'preview-icon--ok'
            "
          >
            <q-icon
              :name="preview.notWorked > 0 ? 'timer_off' : 'check_circle'"
              size="20px"
            />
          </div>

          <div>
            <div class="preview-label">Faltante</div>
            <div class="preview-value">
              {{ round2(preview.notWorked / 60) }}h
            </div>
            <div class="preview-caption">{{ preview.notWorked }} min</div>
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <div class="form-panel">
            <div class="panel-title">
              <q-icon name="rule" color="primary" size="18px" />
              Modo de descuento
            </div>

            <q-select
              v-model="state.override"
              :options="overrideOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              dense
              outlined
              label="Modo"
              class="rounded-input q-mt-sm"
            >
              <template #prepend>
                <q-icon name="settings_suggest" color="primary" />
              </template>

              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-avatar
                      size="34px"
                      :color="getOverrideMeta(scope.opt.value).color"
                      text-color="white"
                    >
                      <q-icon
                        :name="getOverrideMeta(scope.opt.value).icon"
                        size="18px"
                      />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-bold">
                      {{ scope.opt.label }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ getOverrideMeta(scope.opt.value).caption }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-input
              v-if="state.override !== 'AUTO'"
              v-model="state.overrideReason"
              dense
              outlined
              type="textarea"
              autogrow
              label="Motivo del override"
              class="rounded-input q-mt-sm"
              placeholder="Explica por qué se fuerza este comportamiento."
            >
              <template #prepend>
                <q-icon name="edit_note" color="primary" />
              </template>
            </q-input>

            <div
              v-if="state.override !== 'AUTO'"
              class="helper-note q-mt-sm"
            >
              <q-icon name="info" color="primary" />
              Este cambio quedará registrado en auditoría.
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <div class="form-panel">
            <div class="panel-title">
              <q-icon name="verified" color="primary" size="18px" />
              Minutos aprobados
            </div>

            <q-input
              v-model.number="state.approvedMinutes"
              type="number"
              min="0"
              step="1"
              dense
              outlined
              label="Minutos aprobados"
              class="rounded-input q-mt-sm"
              :hint="`Aprobado: ${state.approvedMinutes || 0} min`"
            >
              <template #prepend>
                <q-icon name="timer" color="primary" />
              </template>
            </q-input>

            <div class="quick-actions">
              <q-chip
                clickable
                dense
                color="grey-3"
                text-color="dark"
                @click="state.approvedMinutes = 0"
              >
                0m
              </q-chip>

              <q-chip
                clickable
                dense
                color="primary"
                text-color="white"
                @click="approveMissing"
              >
                Aprobar faltante {{ preview.notWorked }}m
              </q-chip>

              <q-chip
                clickable
                dense
                color="positive"
                text-color="white"
                @click="payFull"
              >
                Pagar completo
              </q-chip>
            </div>

            <q-input
              v-model="state.approvedReason"
              dense
              outlined
              type="textarea"
              autogrow
              label="Motivo de aprobación"
              class="rounded-input q-mt-sm"
              placeholder="Ej: permiso autorizado, incidencia validada, aprobación de supervisor..."
            >
              <template #prepend>
                <q-icon name="fact_check" color="primary" />
              </template>
            </q-input>
          </div>
        </div>

        <div class="col-12">
          <div class="summary-strip">
            <div class="summary-item">
              <q-icon name="schedule" color="primary" />
              <span>Tardanza:</span>
              <b>{{ lateMinutes }}m</b>
            </div>

            <div class="summary-item">
              <q-icon name="add_task" color="positive" />
              <span>Aprobado:</span>
              <b>{{ preview.approved }}m</b>
            </div>

            <div class="summary-item">
              <q-icon :name="impactIcon" :color="impactColor" />
              <span>Impacto:</span>
              <b>{{ impactLabel }}</b>
            </div>
          </div>
        </div>

        <div class="col-12">
          <div class="row justify-end">
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="save"
              label="Guardar control"
              class="save-btn"
              :loading="saving"
              @click="save"
            />
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const $q = useQuasar();

const props = defineProps({
  workSummaryId: { type: String, required: true },
  workSummaryDoc: { type: Object, default: null },
  classification: { type: String, default: "" },
  expectedFallbackMinutes: { type: Number, default: 0 },
});

const emit = defineEmits(["saved"]);

const toNum = (value, defaultValue = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : defaultValue;
};

const round2 = (number) => {
  return Math.round(toNum(number, 0) * 100) / 100;
};

const API = {
  updateWorkSummaryPayrollControl: "punch/updateWorkSummaryPayrollControl",
};

const saving = ref(false);

const overrideOptions = [
  { label: "Auto (regla normal)", value: "AUTO" },
  { label: "No descontar (pagar completo)", value: "FORCE_NO_DEDUCT" },
  { label: "Forzar descuento", value: "FORCE_DEDUCT" },
];

const state = ref({
  override: "AUTO",
  overrideReason: "",
  approvedMinutes: 0,
  approvedReason: "",
});

watch(
  () => props.workSummaryDoc,
  (workSummary) => {
    if (!workSummary) return;

    state.value.override = String(
      workSummary.discountOverride || "AUTO",
    ).toUpperCase();

    state.value.overrideReason = workSummary.overrideReason || "";
    state.value.approvedMinutes = toNum(workSummary.approvedMinutes, 0);
    state.value.approvedReason = workSummary.approvedReason || "";
  },
  { immediate: true },
);

const lateSeconds = computed(() => {
  return toNum(props.workSummaryDoc?.lateTime, 0);
});

const lateMinutes = computed(() => {
  return Math.floor(lateSeconds.value / 60);
});

const workedMinutes = computed(() => {
  return toNum(props.workSummaryDoc?.totalMinutes, 0);
});

const expectedMinutes = computed(() => {
  const value = toNum(props.workSummaryDoc?.expectedMinutes, NaN);

  if (Number.isFinite(value)) return value;

  return toNum(props.expectedFallbackMinutes, 0);
});

const preview = computed(() => {
  const expected = expectedMinutes.value;
  const worked = workedMinutes.value;
  const approved = toNum(state.value.approvedMinutes, 0);

  let paid = worked;

  if (state.value.override === "FORCE_NO_DEDUCT") {
    paid = expected;
  } else if (state.value.override === "FORCE_DEDUCT") {
    paid = worked;
  } else {
    paid = expected > 0 ? Math.min(expected, worked + approved) : worked + approved;
  }

  const notWorked = expected > 0 ? Math.max(expected - paid, 0) : 0;

  const classification = String(
    props.classification || props.workSummaryDoc?.classification || "",
  ).trim();

  let impact = "NONE";

  if (state.value.override === "FORCE_NO_DEDUCT") {
    impact = "NONE";
  } else if (notWorked > 0) {
    impact = "DEDUCT";
  } else if (classification && classification !== "Trabajo regular") {
    impact = "PAID_LEAVE";
  } else {
    impact = "NONE";
  }

  return {
    expected,
    worked,
    approved,
    paid,
    notWorked,
    impact,
  };
});

const impactLabel = computed(() => {
  if (preview.value.impact === "DEDUCT") return "Descuenta";
  if (preview.value.impact === "PAID_LEAVE") return "Permiso pagado";
  return "Sin descuento";
});

const impactColor = computed(() => {
  if (preview.value.impact === "DEDUCT") return "negative";
  if (preview.value.impact === "PAID_LEAVE") return "positive";
  return "primary";
});

const impactIcon = computed(() => {
  if (preview.value.impact === "DEDUCT") return "remove_circle";
  if (preview.value.impact === "PAID_LEAVE") return "verified";
  return "check_circle";
});

const getOverrideMeta = (value) => {
  const map = {
    AUTO: {
      icon: "auto_mode",
      color: "primary",
      caption: "Usa las reglas automáticas del sistema.",
    },
    FORCE_NO_DEDUCT: {
      icon: "payments",
      color: "positive",
      caption: "Paga completo aunque falten minutos.",
    },
    FORCE_DEDUCT: {
      icon: "remove_circle",
      color: "negative",
      caption: "Mantiene o fuerza el descuento.",
    },
  };

  return (
    map[value] || {
      icon: "settings",
      color: "grey-7",
      caption: "Modo personalizado.",
    }
  );
};

const approveMissing = () => {
  state.value.approvedMinutes = toNum(preview.value.notWorked, 0);
};

const payFull = () => {
  state.value.override = "FORCE_NO_DEDUCT";
  state.value.approvedMinutes = toNum(preview.value.notWorked, 0);
};

const save = async () => {
  try {
    const override = String(state.value.override || "AUTO").toUpperCase();
    const allowed = ["AUTO", "FORCE_NO_DEDUCT", "FORCE_DEDUCT"];

    if (!allowed.includes(override)) {
      $q.notify({
        type: "warning",
        message: "Override inválido",
      });

      return;
    }

    const overrideReason = String(state.value.overrideReason || "").trim();

    if (override !== "AUTO" && !overrideReason) {
      $q.notify({
        type: "warning",
        message:
          "Debes indicar un motivo si seleccionas No descontar / Forzar descuento.",
      });

      return;
    }

    const approvedMinutes = toNum(state.value.approvedMinutes, 0);

    if (!Number.isFinite(approvedMinutes) || approvedMinutes < 0) {
      $q.notify({
        type: "warning",
        message: "approvedMinutes inválido",
      });

      return;
    }

    const approvedReason = String(state.value.approvedReason || "").trim();

    if (approvedMinutes > 0 && !approvedReason) {
      $q.notify({
        type: "warning",
        message: "Si apruebas minutos, debes indicar un motivo.",
      });

      return;
    }

    saving.value = true;

    const payload = {
      workSummaryId: props.workSummaryId,
      discountOverride: override,
      overrideReason,
      approvedMinutes,
      approvedReason,
    };

    const resp = await methodsHttp.putApi(
      API.updateWorkSummaryPayrollControl,
      payload,
    );

    if (!resp?.ok) {
      $q.notify({
        type: "negative",
        message: resp?.mensaje || "No se pudo guardar el control de nómina.",
      });

      return;
    }

    $q.notify({
      type: "positive",
      message: "Control de nómina actualizado.",
    });

    emit("saved", resp.workSummary || null);
  } catch (error) {
    $q.notify({
      type: "negative",
      message: error?.message || "Error guardando control de nómina.",
    });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.payroll-control-card {
  border-radius: 22px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.04);
}

.control-header {
  padding: 16px;
  background:
    radial-gradient(circle at top left, rgba(23, 141, 210, 0.1), transparent 34%),
    linear-gradient(180deg, #ffffff, #f8fafc);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 15px;
  color: var(--q-primary);
  background: rgba(23, 141, 210, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.impact-badge {
  min-height: 32px;
  padding: 7px 11px;
  border-radius: 999px;
  font-weight: 900;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.preview-card {
  min-height: 86px;
  padding: 12px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-icon {
  width: 42px;
  height: 42px;
  min-width: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-icon--expected {
  color: var(--q-primary);
  background: rgba(23, 141, 210, 0.1);
}

.preview-icon--worked {
  color: #1976d2;
  background: rgba(25, 118, 210, 0.1);
}

.preview-icon--paid {
  color: #2e7d32;
  background: rgba(46, 125, 50, 0.1);
}

.preview-icon--missing {
  color: #c10015;
  background: rgba(193, 0, 21, 0.08);
}

.preview-icon--ok {
  color: #21ba45;
  background: rgba(33, 186, 69, 0.1);
}

.preview-label {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.preview-value {
  margin-top: 3px;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 900;
}

.preview-caption {
  margin-top: 1px;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 700;
}

.form-panel {
  height: 100%;
  padding: 14px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 900;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
  background: #ffffff;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;
}

.helper-note {
  min-height: 40px;
  padding: 9px 11px;
  border-radius: 14px;
  background: rgba(23, 141, 210, 0.06);
  border: 1px solid rgba(23, 141, 210, 0.1);
  color: #475569;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 600;
}

.summary-strip {
  padding: 10px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.summary-item {
  min-height: 34px;
  padding: 7px 10px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
}

.summary-item b {
  color: #0f172a;
  font-weight: 900;
}

.save-btn {
  min-height: 40px;
  border-radius: 12px;
  font-weight: 800;
}

@media (max-width: 1023px) {
  .preview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 599px) {
  .preview-grid {
    grid-template-columns: 1fr;
  }

  .control-header {
    padding: 14px;
  }
}
</style>