<template>
  <div>
    <q-dialog v-model="dialog" persistent>
      <q-card class="deduction-dialog column no-wrap">
        <q-inner-loading
          :showing="loadingData"
          label="Cargando deducciones..."
          label-class="text-primary"
          label-style="font-size: 1rem"
        />

        <!-- HEADER -->
        <q-card-section
          class="dialog-header bg-primary row items-center justify-between"
        >
          <div class="row items-center no-wrap text-white">
            <div class="dialog-icon">
              <q-icon size="30px" name="price_check" color="white" />
            </div>

            <div>
              <div class="dialog-title">Deducciones del empleado</div>
              <div class="dialog-subtitle">
                Activa, desactiva o personaliza las deducciones aplicables.
              </div>
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            :disable="loadingData || saving"
            @click="closeDialog"
          />
        </q-card-section>

        <q-separator />

        <!-- BODY -->
        <q-card-section class="deduction-dialog-body">
          <q-form @submit.prevent="guardarDeducciones">
            <template v-if="loadingData">
              <div class="q-gutter-md">
                <q-skeleton
                  v-for="item in 5"
                  :key="item"
                  type="rect"
                  height="88px"
                  class="rounded-skeleton"
                />
              </div>
            </template>

            <template v-else-if="deductionTypes.length">
              <div class="summary-card q-mb-md">
                <div class="row items-center justify-between q-col-gutter-md">
                  <div class="col-12 col-md">
                    <div class="summary-title">Configuración actual</div>
                    <div class="summary-subtitle">
                      {{ enabledCount }} deducción{{ enabledCount === 1 ? "" : "es" }}
                      activa{{ enabledCount === 1 ? "" : "s" }} para este empleado.
                    </div>
                  </div>

                  <div class="col-12 col-md-auto">
                    <q-badge rounded color="primary" class="summary-badge">
                      {{ deductionTypes.length }} disponibles
                    </q-badge>
                  </div>
                </div>
              </div>

              <div class="deduction-list">
                <q-card
                  v-for="deduction in deductionTypes"
                  :key="deduction._id"
                  flat
                  bordered
                  class="deduction-card"
                  :class="{
                    'deduction-card--active':
                      asignadas[deduction._id]?.isEnabled,
                  }"
                >
                  <q-card-section>
                    <div class="row items-start justify-between q-col-gutter-md">
                      <div class="col-12 col-md">
                        <div class="row items-center no-wrap">
                          <q-avatar
                            size="42px"
                            :color="
                              asignadas[deduction._id]?.isEnabled
                                ? 'primary'
                                : 'grey-5'
                            "
                            text-color="white"
                            class="q-mr-sm"
                          >
                            <q-icon name="payments" size="22px" />
                          </q-avatar>

                          <div>
                            <div class="deduction-title">
                              {{ deduction.name }}
                            </div>

                            <div class="deduction-subtitle">
                              {{ getDeductionDescription(deduction) }}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="col-12 col-md-auto">
                        <q-toggle
                          v-model="asignadas[deduction._id].isEnabled"
                          color="primary"
                          checked-icon="check"
                          unchecked-icon="close"
                          label="Aplicar"
                          :disable="saving"
                        />
                      </div>
                    </div>

                    <q-slide-transition>
                      <div
                        v-if="asignadas[deduction._id]?.isEnabled"
                        class="row q-col-gutter-md q-mt-md"
                      >
                        <div
                          v-if="deduction.percentage !== undefined"
                          class="col-12 col-md-6"
                        >
                          <div class="field-label">Porcentaje personalizado</div>

                          <q-input
                            v-model.number="
                              asignadas[deduction._id].customPercentage
                            "
                            type="number"
                            label="% Personalizado"
                            dense
                            outlined
                            rounded
                            color="primary"
                            :disable="saving"
                            suffix="%"
                          />
                        </div>

                        <div
                          v-if="deduction.fixedAmount !== undefined"
                          class="col-12 col-md-6"
                        >
                          <div class="field-label">Monto personalizado</div>

                          <q-input
                            v-model.number="
                              asignadas[deduction._id].customAmount
                            "
                            type="number"
                            label="Monto Personalizado"
                            dense
                            outlined
                            rounded
                            color="primary"
                            :disable="saving"
                            prefix="$"
                          />
                        </div>
                      </div>
                    </q-slide-transition>
                  </q-card-section>
                </q-card>
              </div>
            </template>

            <template v-else>
              <div class="empty-state">
                <q-icon name="price_check" size="54px" color="grey-5" />
                <div class="text-subtitle1 text-weight-bold q-mt-sm">
                  No hay tipos de deducciones
                </div>
                <div class="text-caption text-grey-7">
                  Primero debes crear tipos de deducciones para poder asignarlas.
                </div>
              </div>
            </template>
          </q-form>
        </q-card-section>

        <q-separator />

        <!-- ACTIONS -->
        <q-card-actions align="right" class="dialog-actions">
          <q-btn
            flat
            no-caps
            color="negative"
            label="Cancelar"
            icon="cancel"
            class="dialog-action-btn"
            :disable="saving"
            @click="closeDialog"
          />

          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Guardar"
            icon="save"
            type="submit"
            class="dialog-action-btn"
            :loading="saving"
            :disable="loadingData || saving || !deductionTypes.length"
            @click="guardarDeducciones"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";

const dialog = ref(false);
const notify = ref(null);

const deductionTypes = ref([]);
const asignadas = ref({});

const id = ref(null);
const loadingData = ref(false);
const saving = ref(false);

const enabledCount = computed(() => {
  return Object.values(asignadas.value).filter((item) => item?.isEnabled)
    .length;
});

function closeDialog() {
  if (saving.value) return;

  dialog.value = false;
}

function inicializarAsignadas(tipos = [], asignadasBD = []) {
  const next = {};

  tipos.forEach((tipo) => {
    const existente = asignadasBD.find((a) => {
      const deductionTypeId =
        typeof a.deductionType === "object"
          ? a.deductionType?._id
          : a.deductionType;

      return String(deductionTypeId) === String(tipo._id);
    });

    next[tipo._id] = {
      isEnabled: Boolean(existente?.isEnabled),
      customPercentage: existente?.customPercentage ?? null,
      customAmount: existente?.customAmount ?? null,
    };
  });

  asignadas.value = next;
}

function getDeductionDescription(deduction) {
  const parts = [];

  if (deduction.percentage !== undefined && deduction.percentage !== null) {
    parts.push(`Porcentaje base: ${deduction.percentage}%`);
  }

  if (deduction.fixedAmount !== undefined && deduction.fixedAmount !== null) {
    parts.push(`Monto base: $${deduction.fixedAmount}`);
  }

  return parts.length ? parts.join(" · ") : "Deducción configurable";
}

async function guardarDeducciones() {
  if (!id.value || saving.value || loadingData.value) return;

  saving.value = true;

  try {
    const peticiones = deductionTypes.value.map((tipo) => {
      const datos = asignadas.value[tipo._id] || {
        isEnabled: false,
        customPercentage: null,
        customAmount: null,
      };

      return methodsHttp.postApi(
        "employee-payment-management/upsertEmployeeDeduction",
        {
          id: id.value,
          deductionType: tipo._id,
          isEnabled: datos.isEnabled,
          customPercentage: datos.customPercentage,
          customAmount: datos.customAmount,
        },
      );
    });

    await Promise.all(peticiones);

    notify.value?.showNotifyGood("Deducciones guardadas");
    dialog.value = false;
  } catch (err) {
    console.error(err);
    notify.value?.showNotifyBad("Error al guardar");
  } finally {
    saving.value = false;
  }
}

const openModalDeduction = async (item) => {
  dialog.value = true;
  id.value = item?._id || null;

  loadingData.value = true;
  deductionTypes.value = [];
  asignadas.value = {};

  try {
    const [typesRes, asignadasRes] = await Promise.all([
      methodsHttp.getApi("employee-payment-management/getDeductionType"),
      methodsHttp.getApi(
        `employee-payment-management/getUserDeductionByUser/${item._id}`,
      ),
    ]);

    const tipos = typesRes?.ok ? typesRes.deductionType || [] : [];
    const asignadasBD = asignadasRes?.ok ? asignadasRes.deduction || [] : [];

    deductionTypes.value = tipos;
    inicializarAsignadas(tipos, asignadasBD);
  } catch (error) {
    console.error(error);
    notify.value?.showNotifyBad("Error cargando las deducciones");
    deductionTypes.value = [];
    asignadas.value = {};
  } finally {
    loadingData.value = false;
  }
};

defineExpose({ openModalDeduction });
</script>

<style scoped>
.deduction-dialog {
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
  font-size: 0.78rem;
  opacity: 0.86;
}

.deduction-dialog-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(92vh - 154px);
  padding: 18px;
  background: #f8fafc;
}

.summary-card {
  padding: 14px 16px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.summary-title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.summary-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 600;
}

.summary-badge {
  padding: 7px 12px;
  font-weight: 800;
}

.deduction-list {
  display: grid;
  gap: 12px;
}

.deduction-card {
  border-radius: 20px;
  background: #ffffff;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.deduction-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.deduction-card--active {
  border-color: rgba(25, 100, 162, 0.22);
  box-shadow: 0 16px 38px rgba(25, 100, 162, 0.08);
}

.deduction-title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.deduction-subtitle {
  margin-top: 3px;
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

.empty-state {
  min-height: 320px;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  color: #64748b;
}

.rounded-skeleton {
  border-radius: 18px;
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

:deep(.q-field--outlined .q-field__control) {
  border-radius: 28px;
}

:deep(.q-field--outlined.q-field--rounded .q-field__control) {
  border-radius: 28px;
}

@media (max-width: 768px) {
  .deduction-dialog {
    width: 96vw;
    max-height: 94vh;
  }

  .deduction-dialog-body {
    max-height: calc(94vh - 154px);
    padding: 12px;
  }
}
</style>