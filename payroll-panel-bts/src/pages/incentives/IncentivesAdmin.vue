<template>
  <div class="bg-white q-px-md q-pb-lg">
    <PageHeaderCard
      title="Incentivos"
      subtitle="Configura programas, reglas y revisa resultados mensuales."
      icon="settings"
    >
      <template #actions>
        <q-btn
          color="primary"
          outline
          icon="refresh"
          label="Refrescar"
          :loading="loading"
          @click="reloadAll"
        />
      </template>
    </PageHeaderCard>

    <q-card flat bordered class="admin-card">
      <q-card-section class="q-pa-sm">
        <q-tabs
          v-model="tab"
          dense
          active-color="primary"
          indicator-color="primary"
          align="left"
        >
          <q-tab name="programs" icon="workspace_premium" label="Programas" />
          <q-tab name="rules" icon="rule" label="Reglas" />
          <q-tab name="achievements" icon="emoji_events" label="Resultados" />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <!-- =======================
           PROGRAMAS
      ======================== -->
      <q-card-section v-show="tab === 'programs'" class="q-pa-md">
        <div class="row items-center q-col-gutter-sm q-mb-sm">
          <div class="col-12 col-md-5">
            <q-input
              outlined
              dense
              clearable
              v-model="programsSearch"
              label="Buscar programa (nombre/código)"
            >
              <template #prepend><q-icon name="search" color="primary" /></template>
            </q-input>
          </div>

          <div class="col-12 col-md-auto">
            <q-btn
              color="primary"
              unelevated
              icon="add"
              label="Nuevo programa"
              @click="openProgramCreate()"
            />
          </div>
        </div>

        <q-table
          flat
          bordered
          row-key="_id"
          :rows="programsFiltered"
          :columns="programColumns"
          :rows-per-page-options="[10, 20, 50]"
        >
          <template #body-cell-scopeCodes="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-xs">
                <q-chip
                  v-for="c in (props.row.scopeCodes || [])"
                  :key="c"
                  dense
                  color="grey-8"
                  text-color="white"
                >
                  {{ c }}
                </q-chip>
                <span v-if="!(props.row.scopeCodes || []).length" class="text-grey-6">
                  —
                </span>
              </div>
            </q-td>
          </template>

          <template #body-cell-isActive="props">
            <q-td :props="props">
              <q-chip
                dense
                :color="props.row.isActive ? 'green-8' : 'grey-7'"
                text-color="white"
              >
                {{ props.row.isActive ? "Activo" : "Inactivo" }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                dense
                round
                icon="edit"
                color="primary"
                @click="openProgramEdit(props.row)"
              />
              <q-btn
                flat
                dense
                round
                :icon="props.row.isActive ? 'toggle_off' : 'toggle_on'"
                :color="props.row.isActive ? 'grey-7' : 'green-8'"
                @click="toggleProgram(props.row)"
              />
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                @click="deleteProgram(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- =======================
           REGLAS
      ======================== -->
      <q-card-section v-show="tab === 'rules'" class="q-pa-md">
        <div class="row items-center q-col-gutter-sm q-mb-sm">
          <div class="col-12 col-md-4">
            <q-select
              outlined
              dense
              clearable
              v-model="rulesProgramId"
              :options="programs"
              option-label="name"
              option-value="_id"
              emit-value
              map-options
              label="Filtrar por programa"
            >
              <template #prepend><q-icon name="workspace_premium" color="primary" /></template>
            </q-select>
          </div>

          <div class="col-12 col-md-5">
            <q-input
              outlined
              dense
              clearable
              v-model="rulesSearch"
              label="Buscar regla (nombre/código/cálculo)"
            >
              <template #prepend><q-icon name="search" color="primary" /></template>
            </q-input>
          </div>

          <div class="col-12 col-md-auto">
            <q-btn
              color="primary"
              unelevated
              icon="add"
              label="Nueva regla"
              @click="openRuleCreate()"
            />
          </div>
        </div>

        <q-table
          flat
          bordered
          row-key="_id"
          :rows="rulesFiltered"
          :columns="ruleColumns"
          :rows-per-page-options="[10, 20, 50]"
        >
          <template #body-cell-program="props">
            <q-td :props="props">
              {{ props.row?.program?.name || "—" }}
            </q-td>
          </template>

          <template #body-cell-calc="props">
            <q-td :props="props">
              <q-chip dense outline color="grey-8" icon="functions">
                {{ calcLabel(props.row) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-reward="props">
            <q-td :props="props">
              <q-chip dense outline color="primary" icon="redeem">
                {{ props.row?.rewardLabel || "—" }}
              </q-chip>
              <q-chip dense outline color="grey-7" icon="info" class="q-ml-xs">
                {{ deliveryLabel(props.row?.deliveryChannel) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-isActive="props">
            <q-td :props="props">
              <q-chip
                dense
                :color="props.row.isActive ? 'green-8' : 'grey-7'"
                text-color="white"
              >
                {{ props.row.isActive ? "Activa" : "Inactiva" }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                dense
                round
                icon="edit"
                color="primary"
                @click="openRuleEdit(props.row)"
              />
              <q-btn
                flat
                dense
                round
                :icon="props.row.isActive ? 'toggle_off' : 'toggle_on'"
                :color="props.row.isActive ? 'grey-7' : 'green-8'"
                @click="toggleRule(props.row)"
              />
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                @click="deleteRule(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- =======================
           RESULTADOS (ACHIEVEMENTS)
      ======================== -->
      <q-card-section v-show="tab === 'achievements'" class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-select
              outlined
              dense
              v-model="achMonth"
              :options="monthOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              label="Mes"
            >
              <template #prepend><q-icon name="calendar_month" color="primary" /></template>
            </q-select>
          </div>

          <div class="col-12 col-md-4">
            <q-select
              outlined
              dense
              clearable
              v-model="achProgramId"
              :options="programs"
              option-label="name"
              option-value="_id"
              emit-value
              map-options
              label="Programa (opcional)"
            >
              <template #prepend><q-icon name="workspace_premium" color="primary" /></template>
            </q-select>
          </div>

          <div class="col-12 col-md-4" v-if="isManager">
            <q-select
              outlined
              dense
              clearable
              v-model="achUserIds"
              :options="operatorsOptions"
              option-label="name"
              option-value="_id"
              emit-value
              map-options
              multiple
              use-chips
              label="Usuarios (opcional)"
            >
              <template #prepend><q-icon name="person" color="primary" /></template>
            </q-select>
          </div>
        </div>

        <div class="row items-center q-gutter-sm q-mt-md">
          <q-btn
            color="primary"
            unelevated
            icon="search"
            label="Cargar resultados"
            :loading="achLoading"
            @click="loadAchievements()"
          />
          <q-chip dense outline color="grey-7" icon="info">
            Esto solo muestra etiquetas/logros. No toca nómina.
          </q-chip>
        </div>

        <q-table
          v-if="achRows.length"
          class="q-mt-md"
          flat
          bordered
          row-key="_id"
          :rows="achRows"
          :columns="achColumns"
          :rows-per-page-options="[10, 20, 50]"
        >
          <template #body-cell-rule="props">
            <q-td :props="props">
              <div class="text-weight-bold">{{ props.row?.rule?.name || "—" }}</div>
              <div class="text-caption text-grey-7">
                {{ props.row?.rule?.code || "" }}
              </div>
            </q-td>
          </template>

          <template #body-cell-subject="props">
            <q-td :props="props">
              <div v-if="props.row?.subjectUser">
                {{ props.row?.subjectUser?.name || "Usuario" }}
              </div>
              <div v-else-if="props.row?.subjectLocalityCode">
                Localidad: <b>{{ props.row.subjectLocalityCode }}</b>
              </div>
              <div v-else-if="props.row?.subjectDepartmentCode">
                Depto: <b>{{ props.row.subjectDepartmentCode }}</b>
              </div>
              <div v-else class="text-grey-6">—</div>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip dense :color="statusColor(props.row.status)" text-color="white">
                {{ statusLabel(props.row.status) }}
              </q-chip>

              <div class="q-mt-xs">
                <q-linear-progress
                  :value="(props.row.progressPercent || 0) / 100"
                  rounded
                  size="10px"
                  color="primary"
                />
                <div class="text-caption text-grey-7 q-mt-xs">
                  {{ props.row.progressPercent || 0 }}%
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-reward="props">
            <q-td :props="props">
              <q-chip dense outline color="primary" icon="redeem">
                {{ rewardSnapshotLabel(props.row?.rewardSnapshot) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-message="props">
            <q-td :props="props">
              <div class="text-body2">{{ props.row?.message || "—" }}</div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                v-if="isManager"
                flat
                dense
                round
                icon="check_circle"
                color="positive"
                @click="setAchievementStatus(props.row, 'approved')"
              >
                <q-tooltip>Aprobar</q-tooltip>
              </q-btn>

              <q-btn
                v-if="isManager"
                flat
                dense
                round
                icon="local_shipping"
                color="primary"
                @click="setAchievementStatus(props.row, 'delivered')"
              >
                <q-tooltip>Marcar entregado</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>

        <q-card v-else flat bordered class="q-mt-md result-card">
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold">Sin resultados</div>
            <div class="text-caption text-grey-7 q-mt-xs">
              Selecciona el mes y pulsa “Cargar resultados”.
            </div>
          </q-card-section>
        </q-card>
      </q-card-section>
    </q-card>

    <!-- =======================
         DIALOG: PROGRAMA
    ======================== -->
    <q-dialog v-model="programDlg.open" persistent>
      <q-card class="dlg-card">
        <q-card-section class="dlg-header row items-center justify-between">
          <div>
            <div class="text-h6 text-white">
              {{ programDlg.isEdit ? "Editar programa" : "Nuevo programa" }}
            </div>
            <div class="text-caption text-white opacity-80">
              Define vigencia (YYYY-MM) y alcance (scopeCodes).
            </div>
          </div>
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="saveProgram">
          <q-card-section class="q-gutter-md">
            <q-input
              outlined
              dense
              v-model="programDlg.form.name"
              label="Nombre"
              :rules="[(v) => !!v || 'Requerido']"
            />

            <q-input
              outlined
              dense
              v-model="programDlg.form.code"
              label="Código (único)"
              hint="Ej: INCENTIVOS_OPERADORES"
              @update:model-value="programDlg.form.code = normalizeCode(programDlg.form.code)"
              :rules="[(v) => !!v || 'Requerido']"
            />

            <q-input
              outlined
              dense
              v-model="programDlg.form.startMonth"
              label="Mes inicio (YYYY-MM)"
              hint="Ej: 2026-01"
              :rules="[(v) => isValidMonth(v) || 'Formato inválido (YYYY-MM)']"
            />

            <q-input
              outlined
              dense
              v-model="programDlg.form.endMonth"
              label="Mes fin (opcional, YYYY-MM)"
              hint="Ej: 2026-12"
              :rules="[(v) => !v || isValidMonth(v) || 'Formato inválido (YYYY-MM)']"
            />

            <q-input
              outlined
              dense
              v-model="programDlg.form.scopeCodesText"
              label="Scope codes (opcional)"
              hint="Separados por coma. Ej: TRIPLE_S, SANTIAGO"
            />

            <q-input
              outlined
              dense
              type="textarea"
              autogrow
              v-model="programDlg.form.description"
              label="Descripción"
            />

            <q-toggle v-model="programDlg.form.isActive" color="primary" label="Activo" />
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
            <q-btn
              unelevated
              color="primary"
              :loading="programDlg.loading"
              label="Guardar"
              type="submit"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- =======================
         DIALOG: REGLA
    ======================== -->
    <q-dialog v-model="ruleDlg.open" persistent>
      <q-card class="dlg-card-lg">
        <q-card-section class="dlg-header row items-center justify-between">
          <div>
            <div class="text-h6 text-white">
              {{ ruleDlg.isEdit ? "Editar regla" : "Nueva regla" }}
            </div>
            <div class="text-caption text-white opacity-80">
              La lógica vive en <b>config</b>. (No existe calculatorCode en el modelo.)
            </div>
          </div>
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="saveRule" class="q-pa-md">
          <q-card-section class="q-gutter-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-select
                  outlined
                  dense
                  v-model="ruleDlg.form.program"
                  :options="programs"
                  option-label="name"
                  option-value="_id"
                  emit-value
                  map-options
                  label="Programa"
                  :rules="[(v) => !!v || 'Requerido']"
                />
              </div>

              <!-- PLANTILLA UI (solo para autollenar config) -->
              <div class="col-12 col-md-6">
                <q-select
                  outlined
                  dense
                  v-model="ruleDlg.form.templateKey"
                  :options="ruleTemplateOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Plantilla (solo UI)"
                  @update:model-value="applyConfigTemplate"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  dense
                  v-model="ruleDlg.form.code"
                  label="Código (único)"
                  @update:model-value="ruleDlg.form.code = normalizeCode(ruleDlg.form.code)"
                  :rules="[(v) => !!v || 'Requerido']"
                />
              </div>

              <div class="col-12 col-md-8">
                <q-input
                  outlined
                  dense
                  v-model="ruleDlg.form.name"
                  label="Nombre"
                  :rules="[(v) => !!v || 'Requerido']"
                />
              </div>

              <div class="col-12">
                <q-input
                  outlined
                  dense
                  type="textarea"
                  autogrow
                  v-model="ruleDlg.form.description"
                  label="Descripción"
                />
              </div>
            </div>

            <q-separator />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-select
                  outlined
                  dense
                  v-model="ruleDlg.form.appliesTo"
                  :options="appliesToOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Aplica a"
                  :rules="[(v) => !!v || 'Requerido']"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-select
                  outlined
                  dense
                  v-model="ruleDlg.form.scopeType"
                  :options="scopeTypeOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Scope"
                  :rules="[(v) => !!v || 'Requerido']"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  dense
                  v-model.number="ruleDlg.form.displayOrder"
                  type="number"
                  label="Orden UI (displayOrder)"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-select
                  outlined
                  dense
                  v-model="ruleDlg.form.ruleType"
                  :options="ruleTypeOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Tipo de regla"
                  :rules="[(v) => !!v || 'Requerido']"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-select
                  outlined
                  dense
                  v-model="ruleDlg.form.metricSource"
                  :options="metricSourceOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Fuente métrica"
                  :rules="[(v) => !!v || 'Requerido']"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  dense
                  v-model="ruleDlg.form.startMonth"
                  label="startMonth (opcional YYYY-MM)"
                  :rules="[(v) => !v || isValidMonth(v) || 'Formato inválido (YYYY-MM)']"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  dense
                  v-model="ruleDlg.form.endMonth"
                  label="endMonth (opcional YYYY-MM)"
                  :rules="[(v) => !v || isValidMonth(v) || 'Formato inválido (YYYY-MM)']"
                />
              </div>
            </div>

            <q-separator />

            <!-- Reward -->
            <div class="text-subtitle1 text-weight-bold q-mb-none q-pa-none">Recompensa</div>
            <div class="row q-col-gutter-x-sm">
              <div class="col-12 col-md-6">
                <q-input
                  outlined
                  dense
                  v-model="ruleDlg.form.rewardLabel"
                  label="Label (visible en UI)"
                  hint="Ej: RD$1,500 (RD$750 + RD$750)"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-select
                  outlined
                  dense
                  v-model="ruleDlg.form.deliveryChannel"
                  :options="deliveryOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Canal"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-select
                  outlined
                  dense
                  v-model="ruleDlg.form.rewardKind"
                  :options="rewardKindOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Tipo"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  outlined
                  dense
                  type="number"
                  v-model.number="ruleDlg.form.rewardAmount"
                  label="Monto (opcional)"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-select
                  outlined
                  dense
                  v-model="ruleDlg.form.rewardCurrency"
                  :options="currencyOptions"
                  label="Moneda"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-toggle v-model="ruleDlg.form.isActive" color="primary" label="Activa" />
              </div>
            </div>

            <q-separator />

            <!-- Config JSON -->
            <div class="row items-center justify-between">
              <div class="text-subtitle2 text-weight-bold">Config (JSON)</div>
              <q-chip dense outline color="grey-7" icon="info">
                Debe ser JSON válido. Aquí vive la “calculadora”.
              </q-chip>
            </div>

            <q-input
              outlined
              type="textarea"
              autogrow
              v-model="ruleDlg.form.configText"
              label="Config JSON"
              :error="!!ruleDlg.jsonError"
              :error-message="ruleDlg.jsonError"
              @update:model-value="validateRuleJson"
            />
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
            <q-btn
              unelevated
              color="primary"
              :loading="ruleDlg.loading"
              label="Guardar"
              type="submit"
              :disable="!!ruleDlg.jsonError"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Notify } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import PageHeaderCard from "src/components/PageHeaderCard.vue";
import { authStore } from "src/stores/auth-store";

const auth = authStore();
const isManager = computed(() => !!auth?.user?.isManager);

/** =========================
 *  STATE
 *  ========================= */
const tab = ref("programs");
const loading = ref(false);

// lists
const programs = ref([]);
const rules = ref([]);
const operatorsOptions = ref([]);

// filters
const programsSearch = ref("");
const rulesSearch = ref("");
const rulesProgramId = ref(null);

// achievements
const achMonth = ref(getCurrentMonth());
const achProgramId = ref(null);
const achUserIds = ref([]);
const achLoading = ref(false);
const achRows = ref([]);

const monthOptions = computed(() => buildMonthOptions(24));

/** =========================
 *  TABLES
 *  ========================= */
const programColumns = [
  { name: "name", label: "Nombre", field: "name", align: "left", sortable: true },
  { name: "code", label: "Código", field: "code", align: "left", sortable: true },
  { name: "startMonth", label: "Inicio", field: "startMonth", align: "left", sortable: true },
  { name: "endMonth", label: "Fin", field: "endMonth", align: "left", sortable: true },
  { name: "scopeCodes", label: "Scope", field: "scopeCodes", align: "left", sortable: false },
  { name: "isActive", label: "Estado", field: "isActive", align: "left", sortable: true },
  { name: "actions", label: "Acciones", field: "actions", align: "right" },
];

const ruleColumns = [
  { name: "program", label: "Programa", field: "program", align: "left" },
  { name: "code", label: "Código", field: "code", align: "left", sortable: true },
  { name: "name", label: "Nombre", field: "name", align: "left", sortable: true },
  { name: "appliesTo", label: "Aplica a", field: "appliesTo", align: "left", sortable: true },
  { name: "ruleType", label: "Tipo", field: "ruleType", align: "left", sortable: true },
  { name: "metricSource", label: "Fuente", field: "metricSource", align: "left", sortable: true },
  { name: "calc", label: "Cálculo", field: "calc", align: "left" },
  { name: "reward", label: "Recompensa", field: "reward", align: "left" },
  { name: "isActive", label: "Estado", field: "isActive", align: "left", sortable: true },
  { name: "actions", label: "Acciones", field: "actions", align: "right" },
];

const achColumns = [
  { name: "rule", label: "Regla", field: "rule", align: "left" },
  { name: "subject", label: "Sujeto", field: "subject", align: "left" },
  { name: "status", label: "Estado / Progreso", field: "status", align: "left" },
  { name: "reward", label: "Recompensa", field: "reward", align: "left" },
  { name: "message", label: "Mensaje", field: "message", align: "left" },
  { name: "actions", label: "Acciones", field: "actions", align: "right" },
];

/** =========================
 *  DIALOGS: PROGRAM
 *  ========================= */
const programDlg = ref({
  open: false,
  loading: false,
  isEdit: false,
  id: null,
  form: {
    name: "",
    code: "",
    description: "",
    startMonth: getCurrentMonth(),
    endMonth: "",
    scopeCodesText: "TRIPLE_S",
    isActive: true,
  },
});

const openProgramCreate = () => {
  programDlg.value.open = true;
  programDlg.value.isEdit = false;
  programDlg.value.id = null;
  programDlg.value.form = {
    name: "",
    code: "",
    description: "",
    startMonth: getCurrentMonth(),
    endMonth: "",
    scopeCodesText: "TRIPLE_S",
    isActive: true,
  };
};

const openProgramEdit = (row) => {
  programDlg.value.open = true;
  programDlg.value.isEdit = true;
  programDlg.value.id = row._id;
  programDlg.value.form = {
    name: row.name || "",
    code: row.code || "",
    description: row.description || "",
    startMonth: row.startMonth || getCurrentMonth(),
    endMonth: row.endMonth || "",
    scopeCodesText: (row.scopeCodes || []).join(", "),
    isActive: !!row.isActive,
  };
};

const saveProgram = async () => {
  programDlg.value.loading = true;
  try {
    const scopeCodes = String(programDlg.value.form.scopeCodesText || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const payload = {
      name: programDlg.value.form.name,
      code: normalizeCode(programDlg.value.form.code),
      description: programDlg.value.form.description || null,
      startMonth: programDlg.value.form.startMonth,
      endMonth: programDlg.value.form.endMonth || null,
      scopeCodes,
      isActive: !!programDlg.value.form.isActive,
    };

    let resp;
    if (programDlg.value.isEdit) {
      resp = await methodsHttp.putApi(
        `incentives/updateIncentiveProgram/${programDlg.value.id}`,
        payload,
      );
    } else {
      resp = await methodsHttp.postApi(`incentives/createIncentiveProgram`, payload);
    }

    if (!resp?.ok) {
      Notify.create({ type: "negative", message: resp?.mensaje || "No se pudo guardar programa." });
      return;
    }

    Notify.create({ type: "positive", message: "Programa guardado." });
    programDlg.value.open = false;
    await loadPrograms();
  } catch (e) {
    Notify.create({ type: "negative", message: "Error guardando programa." });
  } finally {
    programDlg.value.loading = false;
  }
};

const toggleProgram = async (row) => {
  try {
    const payload = { isActive: !row.isActive };
    const resp = await methodsHttp.putApi(
      `incentives/updateIncentiveProgram/${row._id}`,
      payload,
    );

    if (!resp?.ok) {
      Notify.create({ type: "negative", message: resp?.mensaje || "No se pudo cambiar estado." });
      return;
    }
    await loadPrograms();
  } catch (e) {
    Notify.create({ type: "negative", message: "Error cambiando estado." });
  }
};

const deleteProgram = async (row) => {
  try {
    const resp = await methodsHttp.deleteApi?.(
      `incentives/deleteIncentiveProgram/${row._id}`,
    ) ?? await methodsHttp.postApi(`incentives/deleteIncentiveProgram/${row._id}`, {});

    if (!resp?.ok) {
      Notify.create({ type: "negative", message: resp?.mensaje || "No se pudo eliminar." });
      return;
    }
    Notify.create({ type: "positive", message: "Programa eliminado." });
    await loadPrograms();
  } catch (e) {
    Notify.create({ type: "negative", message: "Error eliminando programa." });
  }
};

/** =========================
 *  DIALOGS: RULE
 *  ========================= */
const appliesToOptions = [
  { label: "Operador", value: "operator" },
  { label: "Líder", value: "leader" },
  { label: "Equipo", value: "team" },
];

const scopeTypeOptions = [
  { label: "Usuario", value: "user" },
  { label: "Localidad", value: "locality" },
  { label: "Departamento", value: "department" },
  { label: "Equipo", value: "team" },
];

const ruleTypeOptions = [
  { label: "Conteo", value: "count" },
  { label: "Ratio / %", value: "ratio" },
  { label: "Composición", value: "composition" },
  { label: "Ranking", value: "leaderboard" },
];

const metricSourceOptions = [
  { label: "Citas (Reminders)", value: "reminders" },
  { label: "Asistencia (Ponches)", value: "attendance" },
  { label: "Custom", value: "custom" },
];

const deliveryOptions = [
  { label: "Solo etiqueta", value: "label_only" },
  { label: "Pago manual", value: "manual_cash" },
  { label: "Beneficio", value: "perk" },
  { label: "Incluye nómina", value: "payroll" },
];

const rewardKindOptions = [
  { label: "Dinero", value: "money" },
  { label: "Beneficio", value: "perk" },
];

const currencyOptions = ["DOP", "USD"];

// Plantillas UI para config (alineadas a tus SEEDS)
const ruleTemplateOptions = [
  { label: "Asistencia perfecta mensual (Ponches)", value: "TEMPLATE_PUNCH_PERFECT" },
  { label: "300 citas mensual (50% REAGENDAR / 50% sin marks)", value: "TEMPLATE_REM_300_5050" },
  { label: "Asistencia 240 (de los impactados)", value: "TEMPLATE_ATTENDED_240" },
  { label: "Empleado del mes (ranking)", value: "TEMPLATE_EMP_OF_MONTH" },
  { label: "Equipo por localidad 500 asistencias (perk)", value: "TEMPLATE_TEAM_LOCALITY_500" },
  { label: "Custom vacío", value: "TEMPLATE_EMPTY" },
];

const ruleDlg = ref({
  open: false,
  loading: false,
  isEdit: false,
  id: null,
  jsonError: "",
  form: {
    program: null,
    code: "",
    name: "",
    description: "",
    appliesTo: "operator",
    scopeType: "user",
    deliveryChannel: "manual_cash",
    rewardKind: "money",
    rewardAmount: null,
    rewardCurrency: "DOP",
    rewardLabel: "",
    ruleType: "count",
    metricSource: "reminders",
    startMonth: "",
    endMonth: "",
    displayOrder: 0,
    isActive: true,
    templateKey: "TEMPLATE_REM_300_5050",
    configText: "{}",
  },
});

const openRuleCreate = () => {
  ruleDlg.value.open = true;
  ruleDlg.value.isEdit = false;
  ruleDlg.value.id = null;
  ruleDlg.value.jsonError = "";

  ruleDlg.value.form = {
    program: rulesProgramId.value || (programs.value?.[0]?._id ?? null),
    code: "",
    name: "",
    description: "",
    appliesTo: "operator",
    scopeType: "user",
    deliveryChannel: "manual_cash",
    rewardKind: "money",
    rewardAmount: null,
    rewardCurrency: "DOP",
    rewardLabel: "",
    ruleType: "composition",
    metricSource: "reminders",
    startMonth: "",
    endMonth: "",
    displayOrder: 0,
    isActive: true,
    templateKey: "TEMPLATE_REM_300_5050",
    configText: JSON.stringify(defaultConfigFor("TEMPLATE_REM_300_5050"), null, 2),
  };
  validateRuleJson();
};

const openRuleEdit = (row) => {
  ruleDlg.value.open = true;
  ruleDlg.value.isEdit = true;
  ruleDlg.value.id = row._id;
  ruleDlg.value.jsonError = "";

  ruleDlg.value.form = {
    program: row?.program?._id || row?.program || null,
    code: row.code || "",
    name: row.name || "",
    description: row.description || "",
    appliesTo: row.appliesTo || "operator",
    scopeType: row.scopeType || "user",
    deliveryChannel: row.deliveryChannel || "label_only",
    rewardKind: row.rewardKind || "money",
    rewardAmount: row.rewardAmount ?? null,
    rewardCurrency: row.rewardCurrency || "DOP",
    rewardLabel: row.rewardLabel || "",
    ruleType: row.ruleType || "count",
    metricSource: row.metricSource || "reminders",
    startMonth: row.startMonth || "",
    endMonth: row.endMonth || "",
    displayOrder: row.displayOrder ?? 0,
    isActive: !!row.isActive,
    templateKey: guessTemplate(row),
    configText: JSON.stringify(row.config || {}, null, 2),
  };

  validateRuleJson();
};

const validateRuleJson = () => {
  try {
    const txt = String(ruleDlg.value.form.configText || "").trim();
    if (!txt) throw new Error("Config vacío.");
    JSON.parse(txt);
    ruleDlg.value.jsonError = "";
  } catch (e) {
    ruleDlg.value.jsonError = e?.message || "JSON inválido.";
  }
};

const applyConfigTemplate = () => {
  const t = ruleDlg.value.form.templateKey;
  ruleDlg.value.form.configText = JSON.stringify(defaultConfigFor(t), null, 2);
  validateRuleJson();
};

const saveRule = async () => {
  validateRuleJson();
  if (ruleDlg.value.jsonError) return;

  ruleDlg.value.loading = true;
  try {
    const config = JSON.parse(ruleDlg.value.form.configText);

    const payload = {
      program: ruleDlg.value.form.program, // ✅ el backend valida "program"
      name: ruleDlg.value.form.name,
      code: normalizeCode(ruleDlg.value.form.code),
      description: ruleDlg.value.form.description || null,

      appliesTo: ruleDlg.value.form.appliesTo,
      scopeType: ruleDlg.value.form.scopeType,

      deliveryChannel: ruleDlg.value.form.deliveryChannel,
      rewardKind: ruleDlg.value.form.rewardKind,
      rewardAmount: ruleDlg.value.form.rewardAmount,
      rewardCurrency: ruleDlg.value.form.rewardCurrency,
      rewardLabel: ruleDlg.value.form.rewardLabel,

      ruleType: ruleDlg.value.form.ruleType,
      metricSource: ruleDlg.value.form.metricSource,

      config, // ✅ aquí vive calculation/rule/dateField/etc.

      startMonth: ruleDlg.value.form.startMonth || null,
      endMonth: ruleDlg.value.form.endMonth || null,

      displayOrder: Number(ruleDlg.value.form.displayOrder || 0),

      isActive: !!ruleDlg.value.form.isActive,
    };

    let resp;
    if (ruleDlg.value.isEdit) {
      resp = await methodsHttp.putApi(
        `incentives/updateIncentiveRule/${ruleDlg.value.id}`,
        payload,
      );
    } else {
      resp = await methodsHttp.postApi(`incentives/createIncentiveRule`, payload);
    }

    if (!resp?.ok) {
      Notify.create({ type: "negative", message: resp?.mensaje || "No se pudo guardar regla." });
      return;
    }

    Notify.create({ type: "positive", message: "Regla guardada." });
    ruleDlg.value.open = false;
    await loadRules();
  } catch (e) {
    Notify.create({ type: "negative", message: "Error guardando regla." });
  } finally {
    ruleDlg.value.loading = false;
  }
};

const toggleRule = async (row) => {
  try {
    const resp = await methodsHttp.putApi(
      `incentives/updateIncentiveRule/${row._id}`,
      { isActive: !row.isActive },
    );

    if (!resp?.ok) {
      Notify.create({ type: "negative", message: resp?.mensaje || "No se pudo cambiar estado." });
      return;
    }
    await loadRules();
  } catch (e) {
    Notify.create({ type: "negative", message: "Error cambiando estado." });
  }
};

const deleteRule = async (row) => {
  try {
    const resp = await methodsHttp.deleteApi?.(
      `incentives/deleteIncentiveRule/${row._id}`,
    ) ?? await methodsHttp.postApi(`incentives/deleteIncentiveRule/${row._id}`, {});

    if (!resp?.ok) {
      Notify.create({ type: "negative", message: resp?.mensaje || "No se pudo eliminar." });
      return;
    }
    Notify.create({ type: "positive", message: "Regla eliminada." });
    await loadRules();
  } catch (e) {
    Notify.create({ type: "negative", message: "Error eliminando regla." });
  }
};

/** =========================
 *  COMPUTEDS
 *  ========================= */
const programsFiltered = computed(() => {
  const q = String(programsSearch.value || "").trim().toLowerCase();
  if (!q) return programs.value || [];
  return (programs.value || []).filter(
    (p) =>
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.code || "").toLowerCase().includes(q),
  );
});

const rulesFiltered = computed(() => {
  const q = String(rulesSearch.value || "").trim().toLowerCase();
  let arr = rules.value || [];

  if (rulesProgramId.value) {
    arr = arr.filter((r) => (r?.program?._id || r?.program) === rulesProgramId.value);
  }

  if (!q) return arr;

  return arr.filter((r) => {
    const calc = String(calcLabel(r) || "").toLowerCase();
    return (
      String(r.name || "").toLowerCase().includes(q) ||
      String(r.code || "").toLowerCase().includes(q) ||
      calc.includes(q)
    );
  });
});

/** =========================
 *  LOADERS
 *  ========================= */
onMounted(async () => {
  await reloadAll();
  await loadOperators();
});

const reloadAll = async () => {
  loading.value = true;
  try {
    await Promise.all([loadPrograms(), loadRules()]);
  } finally {
    loading.value = false;
  }
};

const loadPrograms = async () => {
  const resp = await methodsHttp.getApi("incentives/getIncentivePrograms");
  programs.value = resp?.ok ? resp.programs || [] : [];
};

const loadRules = async () => {
  const resp = await methodsHttp.getApi("incentives/getIncentiveRules");
  rules.value = resp?.ok ? resp.rules || [] : [];
};

const loadOperators = async () => {
  try {
    const resp = await methodsHttp.getApi(
      "user/getEmployees?isActived=true&departmentCode=TRIPLE_S",
    );
    operatorsOptions.value = resp?.ok ? resp.employees || [] : [];
  } catch {
    operatorsOptions.value = [];
  }
};

/** =========================
 *  ACHIEVEMENTS
 *  ========================= */
const loadAchievements = async () => {
  achLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.set("month", achMonth.value);
    if (achProgramId.value) params.set("programId", achProgramId.value);

    if (isManager.value) {
      if (achUserIds.value?.length) params.set("userIds", achUserIds.value.join(","));
      const resp = await methodsHttp.getApi(`incentives/getAchievementsManager?${params.toString()}`);
      achRows.value = resp?.ok ? resp.achievements || [] : [];
    } else {
      const resp = await methodsHttp.getApi(`incentives/getMyAchievementsByMonth?${params.toString()}`);
      achRows.value = resp?.ok ? resp.achievements || [] : [];
    }
  } catch (e) {
    achRows.value = [];
    Notify.create({ type: "negative", message: "Error cargando resultados." });
  } finally {
    achLoading.value = false;
  }
};

const setAchievementStatus = async (row, status) => {
  try {
    const resp =
      (await methodsHttp.patchApi?.(`incentives/updateAchievementStatus/${row._id}`, { status })) ??
      (await methodsHttp.postApi(`incentives/updateAchievementStatus/${row._id}`, { status }));

    if (!resp?.ok) {
      Notify.create({ type: "negative", message: resp?.mensaje || "No se pudo actualizar status." });
      return;
    }

    Notify.create({ type: "positive", message: "Status actualizado." });
    await loadAchievements();
  } catch (e) {
    Notify.create({ type: "negative", message: "Error actualizando status." });
  }
};

/** =========================
 *  HELPERS
 *  ========================= */
function normalizeCode(v) {
  return String(v || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

function isValidMonth(v) {
  return /^\d{4}-\d{2}$/.test(String(v || "").trim());
}

function deliveryLabel(ch) {
  const map = {
    payroll: "Incluye nómina",
    manual_cash: "Pago manual",
    perk: "Beneficio",
    label_only: "Solo etiqueta",
  };
  return map[ch] || ch || "—";
}

function calcLabel(rule) {
  const c = rule?.config?.calculation || rule?.config?.rule;
  if (c) return c;
  // fallback útil
  return `${rule?.metricSource || "custom"}:${rule?.ruleType || "rule"}`;
}

function guessTemplate(rule) {
  const c = rule?.config?.calculation;
  if (c === "PUNCH_PERFECT_MONTH") return "TEMPLATE_PUNCH_PERFECT";
  const comp = rule?.config?.composition?.buckets?.length;
  if (rule?.ruleType === "composition" && comp) return "TEMPLATE_REM_300_5050";
  if (rule?.code?.includes("ASISTENCIA_240")) return "TEMPLATE_ATTENDED_240";
  if (rule?.ruleType === "leaderboard") return "TEMPLATE_EMP_OF_MONTH";
  if (rule?.appliesTo === "team" && rule?.scopeType === "locality") return "TEMPLATE_TEAM_LOCALITY_500";
  return "TEMPLATE_EMPTY";
}

function rewardSnapshotLabel(rs) {
  if (!rs) return "—";
  if (rs.label) return rs.label;
  if (rs.rewardKind === "money" && rs.amount != null) {
    return `RD$${Number(rs.amount).toLocaleString("es-DO")}`;
  }
  return rs.rewardKind === "perk" ? "Beneficio" : "—";
}

function statusLabel(s) {
  const map = {
    in_progress: "En progreso",
    achieved: "Logrado",
    not_achieved: "No logrado",
    approved: "Aprobado",
    delivered: "Entregado",
  };
  return map[s] || s || "—";
}

function statusColor(s) {
  const map = {
    in_progress: "grey-7",
    achieved: "green-8",
    not_achieved: "red-8",
    approved: "blue-8",
    delivered: "deep-purple-8",
  };
  return map[s] || "grey-7";
}

function getCurrentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function buildMonthOptions(count = 12) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const value = `${y}-${m}`;
    const label = d.toLocaleDateString("es-DO", { year: "numeric", month: "long" });
    out.push({ label, value });
  }
  return out;
}

/**
 * ✅ Plantillas alineadas con tus SEEDS:
 * - Recoordinación: marks = ["REAGENDAR"]
 * - Base datos: sin marks (marksEmptyOrMissing=true)
 * - Asistencia perfecta: config.calculation = "PUNCH_PERFECT_MONTH"
 */
function defaultConfigFor(templateKey) {
  if (templateKey === "TEMPLATE_PUNCH_PERFECT") {
    return {
      period: "month",
      calculation: "PUNCH_PERFECT_MONTH",
      exclude: { medicalLeave: true, late: true },
    };
  }

  if (templateKey === "TEMPLATE_REM_300_5050") {
    return {
      period: "month",
      dateField: "createdByOperatorDate",
      targetTotal: 300,
      composition: {
        buckets: [
          {
            key: "RECOORDINACION",
            minPercent: 0.5,
            filters: { marks: ["REAGENDAR"] },
          },
          {
            key: "BASE_DATOS",
            minPercent: 0.5,
            filters: { marksEmptyOrMissing: true },
          },
        ],
      },
      bucketTargets: { RECOORDINACION: 150, BASE_DATOS: 150 },
    };
  }

  if (templateKey === "TEMPLATE_ATTENDED_240") {
    return {
      period: "month",
      dateField: "date",
      impactedDependsOnRuleCode: "OP_300_CITAS_MENSUAL_MIX",
      impactedTarget: 300,
      attendedTarget: 240,
      attendedDefinition: {},
    };
  }

  if (templateKey === "TEMPLATE_EMP_OF_MONTH") {
    return {
      period: "month",
      ranking: { pick: 1, metric: "attendedPatients", minAttended: 240 },
      requires: [{ ruleCode: "OP_ASISTENCIA_PERFECTA_MENSUAL" }],
      tieBreaker: "highest_attended",
    };
  }

  if (templateKey === "TEMPLATE_TEAM_LOCALITY_500") {
    return {
      period: "month",
      dateField: "date",
      attendedTarget: 500,
      attendedDefinition: {},
      perkRules: {
        base: { pizza: true, saturdaysOff: 1 },
        ifMoreThan: { attended: 500, extraSaturdaysOff: 1 },
      },
    };
  }

  return {};
}
</script>

<style scoped>
.admin-card {
  border-radius: 14px;
}

.dlg-card {
  width: 720px;
  max-width: 95vw;
  border-radius: 16px;
}

.dlg-card-lg {
  width: 980px;
  max-width: 95vw;
  border-radius: 16px;
}

.dlg-header {
  background: var(--q-primary);
}

.opacity-80 {
  opacity: 0.8;
}

.result-card {
  border-radius: 14px;
}
</style>
