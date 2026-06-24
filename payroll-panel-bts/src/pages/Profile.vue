<template>
  <q-page class="profile-page q-pa-md">
    <div class="profile-container">
      <!-- HERO / RESUMEN -->
      <q-card flat bordered class="hero-card q-mb-md">
        <div class="hero-bg" :style="heroStyle">
          <div class="hero-overlay">
            <div class="row items-center justify-between q-col-gutter-md">
              <div class="col-12 col-md">
                <div class="row items-center q-col-gutter-md">
                  <div class="col-auto">
                    <div class="avatar-wrapper" @click="triggerFileInput">
                      <q-avatar size="112px" class="profile-avatar">
                        <img :src="avatarUrl" fit="cover" />
                      </q-avatar>

                      <div class="avatar-hover">
                        <q-icon name="camera_alt" size="28px" color="white" />
                        <div class="text-caption text-white">Cambiar</div>
                      </div>
                    </div>

                    <q-file
                      ref="fileInput"
                      v-model="image"
                      accept="image/*"
                      class="hidden-file"
                      @update:model-value="previewFile"
                    />
                  </div>

                  <div class="col">
                    <div class="row items-center q-gutter-sm q-mb-xs">
                      <div class="text-h5 text-weight-bold text-white">
                        {{ form.name || "Mi perfil" }}
                      </div>

                      <q-badge
                        v-if="currentUser?.isManager"
                        rounded
                        color="amber-8"
                        text-color="white"
                        label="Manager"
                      />
                    </div>

                    <div class="text-body2 text-blue-1">
                      {{ form.email || "Sin correo registrado" }}
                    </div>

                    <div class="row q-gutter-sm q-mt-sm">
                      <q-chip
                        v-if="companyName"
                        dense
                        color="white"
                        text-color="primary"
                        icon="business"
                        class="hero-chip"
                      >
                        {{ companyName }}
                      </q-chip>

                      <q-chip
                        v-if="jobPositionName"
                        dense
                        color="white"
                        text-color="primary"
                        icon="work"
                        class="hero-chip"
                      >
                        {{ jobPositionName }}
                      </q-chip>

                      <q-chip
                        v-if="departmentName"
                        dense
                        color="white"
                        text-color="primary"
                        icon="apartment"
                        class="hero-chip"
                      >
                        {{ departmentName }}
                      </q-chip>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-auto">
                <div class="row q-gutter-sm justify-end">
                  <q-btn
                    unelevated
                    rounded
                    color="white"
                    text-color="primary"
                    icon="save"
                    label="Guardar datos"
                    class="hero-btn"
                    :loading="savingProfile"
                    :disable="!canSaveProfile"
                    @click="saveUpdate"
                  />

                  <q-btn
                    outline
                    rounded
                    color="white"
                    icon="refresh"
                    label="Actualizar"
                    class="hero-btn"
                    :loading="loadingMe"
                    @click="loadMe"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card>

      <!-- ACCESOS RÁPIDOS -->
      <q-card
        flat
        bordered
        class="section-card q-mb-md"
        v-if="auth?.user?.rol?.code == 'EMPLOYEE'"
      >
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-subtitle1 text-weight-bold">Accesos rápidos</div>
            <div class="text-caption text-grey-7">
              Acciones frecuentes de tu jornada laboral.
            </div>
          </div>

          <q-icon name="bolt" color="primary" size="28px" />
        </div>

        <div class="row q-col-gutter-md">
          <div
            v-for="action in quickActions"
            :key="action.label"
            class="col-12 col-sm-6 col-md-3"
          >
            <q-card
              flat
              bordered
              class="quick-action-card cursor-pointer"
              @click="goTo(action.to)"
            >
              <q-avatar
                :color="action.color"
                text-color="white"
                :icon="action.icon"
                size="44px"
              />

              <div class="q-mt-sm">
                <div class="text-subtitle2 text-weight-bold">
                  {{ action.label }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ action.caption }}
                </div>
              </div>

              <q-icon
                name="arrow_forward"
                color="grey-5"
                size="20px"
                class="quick-arrow"
              />
            </q-card>
          </div>
        </div>
      </q-card>

      <!-- BALANCE DE VACACIONES -->
<q-card
  v-if="showEmployeeSections"
  flat
  bordered
  class="vacation-balance-card q-mb-md"
>
  <q-inner-loading :showing="loadingVacationBalance">
    <q-spinner size="34px" color="primary" />
  </q-inner-loading>

  <div class="vacation-balance-header">
    <div class="row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="row items-center no-wrap q-gutter-sm">
          <q-avatar class="vacation-header-avatar" size="50px">
            <q-icon name="beach_access" size="28px" />
          </q-avatar>

          <div>
            <div class="text-subtitle1 text-weight-bold">
              Balance de vacaciones
            </div>
            <div class="text-caption text-grey-7">
              Consulta tus días acumulados, disponibles y balance para préstamo.
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <q-btn
          unelevated
          rounded
          color="primary"
          icon="refresh"
          label="Actualizar balance"
          class="action-btn"
          :loading="loadingVacationBalance"
          @click="loadVacationSummary(true)"
        />
      </div>
    </div>

    <div class="row q-col-gutter-sm q-mt-md">
      <div class="col-12 col-md-6">
        <q-chip
          dense
          class="vacation-status-chip"
          :color="canEnjoyVacations ? 'positive' : 'warning'"
          text-color="white"
          :icon="canEnjoyVacations ? 'check_circle' : 'schedule'"
        >
          {{ vacationStatusLabel }}
        </q-chip>
      </div>

      <div class="col-12 col-md-6">
        <q-chip
          dense
          class="vacation-status-chip"
          :color="canUseVacationForLoan ? 'primary' : 'grey-7'"
          text-color="white"
          icon="account_balance_wallet"
        >
          {{ vacationLoanStatusLabel }}
        </q-chip>
      </div>
    </div>

    <div class="vacation-progress-box q-mt-md">
      <div class="row items-center justify-between q-mb-xs">
        <div class="text-caption text-weight-bold text-grey-8">
          Progreso para cumplir el primer año
        </div>

        <div class="text-caption text-weight-bold text-primary">
          {{ vacationServiceMonths }} / 12 meses
        </div>
      </div>

      <q-linear-progress
        rounded
        size="10px"
        color="primary"
        track-color="blue-grey-1"
        :value="vacationProgress"
      />

      <div class="text-caption text-grey-7 q-mt-sm">
        Antigüedad actual:
        <b>{{ vacationServiceYears }} años</b> ·
        <b>{{ vacationServiceMonths }} meses</b>
      </div>
    </div>
  </div>

  <q-separator />

  <div class="q-pa-md">
    <q-banner
      v-if="vacationBalanceError"
      rounded
      class="bg-red-1 text-negative q-mb-md"
    >
      <template #avatar>
        <q-icon name="error_outline" />
      </template>

      {{ vacationBalanceError }}
    </q-banner>

    <template v-if="vacationBalance">
      <div class="row q-col-gutter-md">
        <div
          v-for="item in vacationMetricItems"
          :key="item.key"
          class="col-12 col-sm-6 col-md-3"
        >
          <q-card flat bordered class="vacation-metric-card">
            <div class="row items-start justify-between no-wrap">
              <div>
                <div class="vacation-metric-label">
                  {{ item.label }}
                </div>

                <div class="vacation-metric-value">
                  {{ item.value }}
                </div>

                <div class="vacation-metric-caption">
                  {{ item.caption }}
                </div>
              </div>

              <q-avatar
                :color="item.color"
                text-color="white"
                :icon="item.icon"
                size="42px"
              />
            </div>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-12 col-md-4">
          <InfoTile
            icon="event"
            label="Ciclo actual"
            :value="vacationCycleLabel"
          />
        </div>

        <div class="col-12 col-md-4">
          <InfoTile
            icon="paid"
            label="Días pagables netos"
            :value="formatVacationDays(vacationBalance.netPayableVacationDays)"
          />
        </div>

        <div class="col-12 col-md-4">
          <InfoTile
            icon="update"
            label="Último cálculo"
            :value="vacationLastCalculatedLabel"
          />
        </div>
      </div>
    </template>

    <div v-else-if="!loadingVacationBalance" class="vacation-empty-state">
      <q-icon name="beach_access" size="44px" color="grey-5" />

      <div class="text-subtitle2 text-weight-bold q-mt-sm">
        No tienes balance de vacaciones calculado
      </div>

      <div class="text-caption text-grey-7">
        Presiona “Actualizar balance” para consultar o generar tu balance actual.
      </div>
    </div>
  </div>
</q-card>

      <!-- SALARIO DE NAVIDAD -->
<q-card
  v-if="showEmployeeSections"
  flat
  bordered
  class="vacation-balance-card q-mb-md"
>
  <q-inner-loading :showing="loadingChristmasSalary">
    <q-spinner size="34px" color="primary" />
  </q-inner-loading>

  <div class="vacation-balance-header">
    <div class="row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="row items-center no-wrap q-gutter-sm">
          <q-avatar class="vacation-header-avatar" size="50px">
            <q-icon name="redeem" size="28px" />
          </q-avatar>

          <div>
            <div class="text-subtitle1 text-weight-bold">
              Salario de Navidad
            </div>
            <div class="text-caption text-grey-7">
              Consulta el acumulado usado como garantía de préstamos.
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <q-btn
          unelevated
          rounded
          color="primary"
          icon="refresh"
          label="Actualizar"
          class="action-btn"
          :loading="loadingChristmasSalary"
          @click="loadChristmasSalarySummary"
        />
      </div>
    </div>
  </div>

  <q-separator />

  <div class="q-pa-md">
    <q-banner
      v-if="christmasSalaryError"
      rounded
      class="bg-red-1 text-negative q-mb-md"
    >
      <template #avatar>
        <q-icon name="error_outline" />
      </template>

      {{ christmasSalaryError }}
    </q-banner>

    <template v-if="christmasSalary">
      <div class="row q-col-gutter-md">
        <div
          v-for="item in christmasSalaryMetricItems"
          :key="item.key"
          class="col-12 col-sm-6 col-md-3"
        >
          <q-card flat bordered class="vacation-metric-card">
            <div class="row items-start justify-between no-wrap">
              <div>
                <div class="vacation-metric-label">
                  {{ item.label }}
                </div>
                <div class="vacation-metric-value">
                  {{ item.value }}
                </div>
                <div class="vacation-metric-caption">
                  {{ item.caption }}
                </div>
              </div>
              <q-avatar
                :color="item.color"
                text-color="white"
                :icon="item.icon"
                size="42px"
              />
            </div>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-12 col-md-5">
          <q-card flat bordered class="q-pa-md full-height">
            <div class="text-subtitle2 text-weight-bold q-mb-sm">
              Reservas activas
            </div>
            <div
              v-if="!christmasActiveReservations.length"
              class="text-caption text-grey-7"
            >
              No tienes reservas activas.
            </div>
            <q-list v-else dense separator>
              <q-item
                v-for="reservation in christmasActiveReservations"
                :key="reservation._id"
              >
                <q-item-section>
                  <q-item-label>
                    {{ formatCurrency(reservation.remainingReservedAmount) }}
                  </q-item-label>
                  <q-item-label caption>
                    Reservado: {{ formatCurrency(reservation.reservedAmount) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="primary" label="Activa" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>

        <div class="col-12 col-md-7">
          <q-card flat bordered class="q-pa-md full-height">
            <div class="text-subtitle2 text-weight-bold q-mb-sm">
              Movimientos recientes
            </div>
            <div
              v-if="!christmasRecentMovements.length"
              class="text-caption text-grey-7"
            >
              No hay movimientos recientes.
            </div>
            <q-list v-else dense separator>
              <q-item
                v-for="movement in christmasRecentMovements"
                :key="movement._id"
              >
                <q-item-section>
                  <q-item-label>
                    {{ christmasMovementLabel(movement.movementType) }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ formatDateTime(movement.effectiveAt || movement.createdAt) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <span class="text-weight-bold">
                    {{ formatCurrency(movement.amount) }}
                  </span>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>
      </div>
    </template>

    <div
      v-else-if="!loadingChristmasSalary && !christmasSalaryError"
      class="vacation-empty-state"
    >
      <q-icon name="redeem" size="42px" color="grey-5" />
      <div class="text-subtitle2 text-grey-8 q-mt-sm">
        No hay balance de salario de Navidad para este año.
      </div>
      <div class="text-caption text-grey-6">
        Cuando exista acumulación, reservas o movimientos se mostrarán aquí.
      </div>
    </div>
  </div>
</q-card>

      <div class="row q-col-gutter-md">
        <!-- FORMULARIO PERFIL -->
        <div class="col-12 col-lg-7">
          <q-card flat bordered class="section-card">
            <div class="row items-center justify-between q-mb-md">
              <div>
                <div class="text-subtitle1 text-weight-bold">
                  Información personal
                </div>
                <div class="text-caption text-grey-7">
                  Actualiza tus datos básicos de contacto.
                </div>
              </div>

              <q-avatar color="primary" text-color="white" icon="person" />
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.name"
                  outlined
                  dense
                  color="primary"
                  label="Nombre"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="person" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.email"
                  outlined
                  dense
                  disable
                  color="primary"
                  label="Correo electrónico"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="email" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.phone"
                  outlined
                  dense
                  color="primary"
                  label="Teléfono"
                  mask="(###) ### - ####"
                  fill-mask
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="call" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.password"
                  outlined
                  dense
                  autocomplete="off"
                  color="primary"
                  label="Nueva contraseña"
                  :type="isPwd ? 'password' : 'text'"
                  class="rounded-input"
                  hint="Déjalo vacío si no deseas cambiarla."
                >
                  <template #prepend>
                    <q-icon name="lock" />
                  </template>

                  <template #append>
                    <q-icon
                      :name="isPwd ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="isPwd = !isPwd"
                    />
                  </template>
                </q-input>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="row items-center justify-between q-col-gutter-md">
              <div class="col-12 col-md">
                <div class="row q-gutter-sm">
                  <q-btn
                    unelevated
                    rounded
                    color="primary"
                    icon="save"
                    label="Guardar cambios"
                    class="action-btn"
                    :loading="savingProfile"
                    :disable="!canSaveProfile"
                    @click="saveUpdate"
                  />

                  <q-btn
                    flat
                    rounded
                    color="negative"
                    icon="delete"
                    label="Eliminar imagen"
                    class="action-btn"
                    :disable="loadingImage"
                    :loading="loadingImage"
                    @click="deleteImage"
                  />
                </div>
              </div>
            </div>
          </q-card>
        </div>

        <!-- DATOS LABORALES -->
        <div class="col-12 col-lg-5">
          <q-card flat bordered class="section-card full-height">
            <div class="row items-center justify-between q-mb-md">
              <div>
                <div class="text-subtitle1 text-weight-bold">
                  Datos laborales
                </div>
                <div class="text-caption text-grey-7">
                  Información básica asociada a tu perfil.
                </div>
              </div>

              <q-avatar color="primary" text-color="white" icon="badge" />
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12">
                <InfoTile
                  icon="business"
                  label="Compañía"
                  :value="companyName || 'No asignada'"
                />
              </div>

              <div class="col-12 col-md-6">
                <InfoTile
                  icon="apartment"
                  label="Departamento"
                  :value="departmentName || 'No asignado'"
                />
              </div>

              <div class="col-12 col-md-6">
                <InfoTile
                  icon="work"
                  label="Puesto"
                  :value="jobPositionName || 'No asignado'"
                />
              </div>

              <div class="col-12 col-md-6">
                <InfoTile
                  icon="workspaces"
                  label="Proyecto"
                  :value="projectName || 'No asignado'"
                />
              </div>

              <div class="col-12 col-md-6">
                <InfoTile
                  icon="pin"
                  label="Código de ponche"
                  :value="currentUser?.code_punch || 'No asignado'"
                />
              </div>

              <div class="col-12 col-md-6">
                <InfoTile
                  icon="event"
                  label="Fecha de contratación"
                  :value="hiringDateLabel"
                />
              </div>

              <div class="col-12 col-md-6">
                <InfoTile
                  icon="verified_user"
                  label="Rol"
                  :value="roleName || 'Sin rol'"
                />
              </div>
            </div>
          </q-card>
        </div>
      </div>

      <!-- HORARIO DE PAGO -->
      <q-card
        v-if="hasPaymentSchedule"
        flat
        bordered
        class="section-card q-mt-md"
      >
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-subtitle1 text-weight-bold">Horario de pago</div>
            <div class="text-caption text-grey-7">
              Frecuencia y días de pago asignados.
            </div>
          </div>

          <q-avatar color="primary" text-color="white" icon="payments" />
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <InfoTile
              icon="event_repeat"
              label="Frecuencia"
              :value="paymentFrequencyLabel"
            />
          </div>

          <div class="col-12 col-md-4">
            <InfoTile
              icon="calendar_today"
              label="Días de pago"
              :value="paymentDaysLabel"
            />
          </div>

          <div class="col-12 col-md-4">
            <InfoTile
              icon="notes"
              label="Descripción"
              :value="paymentScheduleDescription"
            />
          </div>
        </div>
      </q-card>

      <q-card
        v-else-if="showEmployeeSections"
        flat
        bordered
        class="empty-card q-mt-md"
      >
        <q-icon name="payments" size="42px" color="grey-5" />
        <div class="text-subtitle2 text-weight-bold q-mt-sm">
          No tienes un horario de pago asignado
        </div>
        <div class="text-caption text-grey-7">
          Cuando tu administrador lo configure, aparecerá en esta sección.
        </div>
      </q-card>

      <!-- HORARIO SEMANAL -->
      <q-card
        v-if="showEmployeeSections && hasWeeklySchedule"
        flat
        bordered
        class="section-card q-mt-md"
      >
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-subtitle1 text-weight-bold">Horario semanal</div>
            <div class="text-caption text-grey-7">
              Días y horas definidos para tu jornada.
            </div>
          </div>

          <q-avatar color="primary" text-color="white" icon="schedule" />
        </div>

        <div class="row q-col-gutter-md">
          <div
            v-for="day in weeklyScheduleList"
            :key="day.key"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card
              flat
              bordered
              class="day-card"
              :class="{ 'day-card-off': !day.isActive }"
            >
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle2 text-weight-bold">
                  {{ day.label }}
                </div>

                <q-badge
                  rounded
                  :color="day.isActive ? 'secondary' : 'grey-6'"
                  :label="day.isActive ? 'Activo' : 'Libre'"
                />
              </div>

              <template v-if="day.isActive">
                <div class="schedule-line">
                  <q-icon name="login" color="primary" />
                  <span>Entrada:</span>
                  <b>{{ day.entryTime || "--" }}</b>
                </div>

                <div class="schedule-line">
                  <q-icon name="lunch_dining" color="primary" />
                  <span>Almuerzo:</span>
                  <b>{{ lunchLabel(day) }}</b>
                </div>

                <div class="schedule-line">
                  <q-icon name="logout" color="primary" />
                  <span>Salida:</span>
                  <b>{{ day.exitTime || "--" }}</b>
                </div>
              </template>

              <div v-else class="text-caption text-grey-7">
                No trabaja este día.
              </div>
            </q-card>
          </div>
        </div>
      </q-card>

      <q-card
        v-else-if="showEmployeeSections"
        flat
        bordered
        class="empty-card q-mt-md"
      >
        <q-icon name="schedule" size="42px" color="grey-5" />
        <div class="text-subtitle2 text-weight-bold q-mt-sm">
          No tienes horario semanal configurado
        </div>
        <div class="text-caption text-grey-7">
          Cuando se asigne tu horario, aparecerá aquí.
        </div>
      </q-card>
    </div>

    <NotificationsVue ref="notify" />
  </q-page>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import { authStore } from "src/stores/auth-store";
import moment from "moment";

const ME_ENDPOINT = "auth/me";
const VACATION_SUMMARY_ENDPOINT = "employee-vacation/my-summary";
const CHRISTMAS_SALARY_ENDPOINT = "employee-loan/christmas-salary/me";

const DEFAULT_AVATAR =
  "https://plus-nautic.nyc3.digitaloceanspaces.com/profile_avatar.png";

const emit = defineEmits(["editProfile"]);

const router = useRouter();
const auth = authStore();

const notify = ref(null);
const fileInput = ref(null);

const loadingMe = ref(false);
const loadingImage = ref(false);
const savingProfile = ref(false);

const image = ref(null);
const imageToPreview = ref("");
const isPwd = ref(true);

const currentUser = ref(null);
const loadingVacationBalance = ref(false);
const vacationBalanceResponse = ref(null);
const vacationBalanceError = ref("");
const loadingChristmasSalary = ref(false);
const christmasSalaryResponse = ref(null);
const christmasSalaryError = ref("");

const christmasSalary = computed(() => {
  return christmasSalaryResponse.value?.christmasSalary || null;
});

const christmasActiveReservations = computed(() => {
  return Array.isArray(christmasSalary.value?.activeReservations)
    ? christmasSalary.value.activeReservations
    : [];
});

const christmasRecentMovements = computed(() => {
  return Array.isArray(christmasSalary.value?.recentMovements)
    ? christmasSalary.value.recentMovements
    : [];
});

const vacationBalance = computed(() => {
  return vacationBalanceResponse.value?.balance || null;
});

const vacationSummary = computed(() => {
  return vacationBalanceResponse.value?.summary || {};
});

const vacationServiceMonths = computed(() => {
  return Number(
    vacationSummary.value?.serviceMonths ??
      vacationBalance.value?.serviceMonths ??
      0
  );
});

const vacationServiceYears = computed(() => {
  return Number(
    vacationSummary.value?.serviceYears ??
      vacationBalance.value?.serviceYears ??
      0
  );
});

const vacationProgress = computed(() => {
  return Math.min(vacationServiceMonths.value / 12, 1);
});

const canEnjoyVacations = computed(() => {
  return Boolean(
    vacationSummary.value?.canEnjoyVacations ??
      (vacationServiceYears.value >= 1 &&
        Number(vacationBalance.value?.availableDays || 0) > 0)
  );
});

const canUseVacationForLoan = computed(() => {
  return Boolean(
    vacationSummary.value?.canUseVacationForLoan ??
      Number(vacationBalance.value?.availableForLoanDays || 0) > 0
  );
});

const vacationStatusLabel = computed(() => {
  if (!vacationBalance.value) return "Sin balance calculado";

  if (canEnjoyVacations.value) {
    return "Ya puedes disfrutar vacaciones";
  }

  return "Aún no cumples el año para disfrutarlas";
});

const vacationLoanStatusLabel = computed(() => {
  if (!vacationBalance.value) return "Sin datos para préstamo";

  if (canUseVacationForLoan.value) {
    return "Tienes balance disponible para préstamo";
  }

  return "Sin balance disponible para préstamo";
});

const vacationCycleLabel = computed(() => {
  const start = vacationBalance.value?.cycleStartDate;
  const end = vacationBalance.value?.cycleEndDate;

  if (!start || !end) return "Ciclo no definido";

  return `${moment(start).format("DD/MM/YYYY")} - ${moment(end).format(
    "DD/MM/YYYY"
  )}`;
});

const vacationLastCalculatedLabel = computed(() => {
  const date = vacationBalance.value?.lastCalculatedAt;

  if (!date) return "No calculado";

  return moment(date).format("DD/MM/YYYY hh:mm A");
});

const formatVacationDays = (value) => {
  const number = Number(value || 0);

  return `${number.toFixed(number % 1 === 0 ? 0 : 2)} días`;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
};

const formatDateTime = (value) => {
  if (!value) return "Sin fecha";
  return moment(value).format("DD/MM/YYYY hh:mm A");
};

const christmasMovementLabel = (movementType) => {
  const labels = {
    CHRISTMAS_ACCRUAL: "Acumulación por nómina",
    CHRISTMAS_GUARANTEE_RESERVED: "Garantía reservada para préstamo",
    CHRISTMAS_GUARANTEE_REDUCED: "Garantía reducida por cuota pagada",
    CHRISTMAS_GUARANTEE_RELEASED: "Garantía liberada",
    CHRISTMAS_ACCRUAL_REVERSAL: "Reverso de acumulación",
    LEGACY_OPENING: "Saldo histórico inicial",
  };

  return labels[movementType] || movementType || "Movimiento";
};

const christmasSalaryMetricItems = computed(() => {
  const balance = christmasSalary.value || {};

  return [
    {
      key: "accrued",
      icon: "redeem",
      label: "Salario de Navidad acumulado",
      value: formatCurrency(balance.accruedChristmasSalaryAmount),
      caption: "Acumulado confirmado para el año actual.",
      color: "primary",
    },
    {
      key: "reserved",
      icon: "lock",
      label: "Monto reservado por préstamos",
      value: formatCurrency(balance.reservedGuaranteeAmount),
      caption: "Garantía retenida para préstamos activos.",
      color: "grey-8",
    },
    {
      key: "available",
      icon: "account_balance_wallet",
      label: "Disponible sin reservar",
      value: formatCurrency(balance.availableUnreservedChristmasSalaryAmount),
      caption: "Monto disponible para nuevas garantías.",
      color: "secondary",
    },
    {
      key: "pending",
      icon: "payments",
      label: "Pendiente pagable",
      value: formatCurrency(balance.pendingChristmasSalaryPayable),
      caption: "Monto acumulado pendiente de pago.",
      color: "positive",
    },
  ];
});

const vacationMetricItems = computed(() => {
  const balance = vacationBalance.value || {};

  return [
    {
      key: "availableDays",
      icon: "beach_access",
      label: "Disponible para disfrutar",
      value: formatVacationDays(balance.availableDays),
      caption: "Días que puedes tomar como vacaciones.",
      color: "primary",
    },
    {
      key: "accruedPaymentDays",
      icon: "trending_up",
      label: "Acumulado causado",
      value: formatVacationDays(balance.accruedPaymentDays),
      caption: "Días acumulados para pago o liquidación.",
      color: "secondary",
    },
    {
      key: "availableForLoanDays",
      icon: "account_balance_wallet",
      label: "Disponible para préstamo",
      value: formatVacationDays(balance.availableForLoanDays),
      caption: "Balance que puede servir como garantía.",
      color: "primary",
    },
    {
      key: "usedReserved",
      icon: "lock_clock",
      label: "Usados / reservados",
      value: formatVacationDays(
        Number(balance.usedDays || 0) + Number(balance.reservedDays || 0)
      ),
      caption: `${formatVacationDays(balance.usedDays)} usados · ${formatVacationDays(
        balance.reservedDays
      )} reservados`,
      color: "grey-8",
    },
  ];
});

const form = ref({
  name: "",
  phone: "",
  email: "",
  password: "",
});

const InfoTile = defineComponent({
  name: "InfoTile",
  props: {
    icon: {
      type: String,
      default: "info",
    },
    label: {
      type: String,
      default: "",
    },
    value: {
      type: [String, Number],
      default: "",
    },
  },
  setup(props) {
    return () =>
      h("div", { class: "info-tile" }, [
        h("div", { class: "info-icon" }, [
          h("span", { class: "material-icons" }, props.icon),
        ]),
        h("div", { class: "info-content" }, [
          h("div", { class: "info-label" }, props.label),
          h("div", { class: "info-value" }, props.value || "N/A"),
        ]),
      ]);
  },
});

const quickActions = [
  {
    label: "Ponchar",
    caption: "Registrar entrada, almuerzo o salida.",
    icon: "fingerprint",
    color: "primary",
    to: "/punch",
  },
  {
    label: "Mi historial",
    caption: "Consultar tus ponches registrados.",
    icon: "history",
    color: "secondary",
    to: "/portal/punch-history",
  },
  {
    label: "Permisos",
    caption: "Solicitar o revisar permisos laborales.",
    icon: "event_available",
    color: "primary",
    to: "/portal/permission-requests",
  },
  {
    label: "Soporte",
    caption: "Crear un ticket de ayuda.",
    icon: "support_agent",
    color: "secondary",
    to: "/portal/support-tickets",
  },
];

const showEmployeeSections = computed(() => {
  const code = currentUser.value?.rol?.code || currentUser.value?.role?.code;
  return code !== "SUPERADMIN" && code !== "SUPER_ADMIN";
});

const companyName = computed(() => {
  const company = currentUser.value?.company;
  return company?.tradeName || company?.legalName || company?.name || "";
});

const departmentName = computed(() => {
  const department = currentUser.value?.department;
  return department?.name || "";
});

const jobPositionName = computed(() => {
  const position = currentUser.value?.jobPosition;
  return position?.name || "";
});

const projectName = computed(() => {
  const project = currentUser.value?.project;
  return project?.name || "";
});

const roleName = computed(() => {
  return (
    currentUser.value?.rol?.name ||
    currentUser.value?.role?.name ||
    currentUser.value?.rol?.code ||
    currentUser.value?.role?.code ||
    ""
  );
});

const avatarUrl = computed(() => {
  return imageToPreview.value || currentUser.value?.img || DEFAULT_AVATAR;
});

const heroStyle = computed(() => {
  const primary = currentUser.value?.company?.primaryColor || "#024D48";
  const secondary = currentUser.value?.company?.secondaryColor || "#1964A2";

  return {
    background: `linear-gradient(135deg, ${primary}, ${secondary})`,
  };
});

const canSaveProfile = computed(() => {
  return !!form.value.name?.trim() && !!form.value.email?.trim();
});

const hiringDateLabel = computed(() => {
  if (!currentUser.value?.hiringDate) return "No registrada";
  return moment(currentUser.value.hiringDate).format("DD/MM/YYYY");
});

const paymentSchedule = computed(() => {
  return currentUser.value?.paymentSchedule || null;
});

const hasPaymentSchedule = computed(() => {
  return !!paymentSchedule.value?._id || !!paymentSchedule.value?.name;
});

const paymentFrequencyLabel = computed(() => {
  return (
    paymentSchedule.value?.paymentFrequency?.name ||
    paymentSchedule.value?.frequency?.name ||
    "No definida"
  );
});

const paymentScheduleDescription = computed(() => {
  return paymentSchedule.value?.description || "Sin descripción";
});

const weekDayNames = [
  "",
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const paymentDaysLabel = computed(() => {
  const schedule = paymentSchedule.value;

  if (!schedule) return "No definido";

  if (Array.isArray(schedule.weeklyDays) && schedule.weeklyDays.length) {
    return schedule.weeklyDays
      .map((day) => weekDayNames[Number(day)] || "")
      .filter(Boolean)
      .join(", ");
  }

  if (Array.isArray(schedule.payDays) && schedule.payDays.length) {
    return schedule.payDays.map((day) => `Día ${day}`).join(", ");
  }

  return "No definido";
});

const weeklySchedule = computed(() => {
  return currentUser.value?.schedule || null;
});

const hasWeeklySchedule = computed(() => {
  return (
    weeklySchedule.value &&
    typeof weeklySchedule.value === "object" &&
    Object.keys(weeklySchedule.value).length > 0
  );
});

const weeklyScheduleList = computed(() => {
  const schedule = weeklySchedule.value || {};

  const labels = {
    monday: "Lunes",
    martes: "Martes",
    tuesday: "Martes",
    miercoles: "Miércoles",
    wednesday: "Miércoles",
    thursday: "Jueves",
    jueves: "Jueves",
    friday: "Viernes",
    viernes: "Viernes",
    saturday: "Sábado",
    sabado: "Sábado",
    sunday: "Domingo",
    domingo: "Domingo",
    lunes: "Lunes",
  };

  return Object.entries(schedule).map(([key, value]) => ({
    key,
    label:
      labels[key] || key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
    ...(value || {}),
  }));
});

const lunchLabel = (day) => {
  if (!day?.lunchStartTime && !day?.lunchEndTime) return "--";
  return `${day.lunchStartTime || "--"} - ${day.lunchEndTime || "--"}`;
};

const syncUserToForm = (user) => {
  currentUser.value = user || auth.user || null;

  form.value = {
    name: currentUser.value?.name || "",
    phone: currentUser.value?.phone || "",
    email: currentUser.value?.email || "",
    password: "",
  };

  imageToPreview.value = currentUser.value?.img || "";
};

const loadMe = async () => {
  loadingMe.value = true;

  try {
    const resp = await methodsHttp.getApi(ME_ENDPOINT);

    if (resp?.ok && resp.user) {
      syncUserToForm(resp.user);
      localStorage.setItem("user", JSON.stringify(resp.user));

      if (auth.user) {
        auth.user = resp.user;
      }

      return;
    }

    syncUserToForm(auth.user);
  } catch (error) {
    syncUserToForm(auth.user);
  } finally {
    loadingMe.value = false;
  }
};

const loadVacationSummary = async (refresh = false) => {
  if (!showEmployeeSections.value) return;

  loadingVacationBalance.value = true;
  vacationBalanceError.value = "";

  try {
    const resp = await methodsHttp.getApi(
      `${VACATION_SUMMARY_ENDPOINT}?refresh=${refresh ? "true" : "false"}`
    );

    if (!resp?.ok) {
      vacationBalanceError.value =
        resp?.mensaje || "No se pudo cargar el balance de vacaciones.";
      return;
    }

    vacationBalanceResponse.value = resp;
  } catch (error) {
    console.log("loadVacationSummary error:", error);

    vacationBalanceError.value =
      error?.response?.data?.mensaje ||
      "No se pudo cargar el balance de vacaciones.";
  } finally {
    loadingVacationBalance.value = false;
  }
};

const loadChristmasSalarySummary = async () => {
  if (!showEmployeeSections.value) return;

  loadingChristmasSalary.value = true;
  christmasSalaryError.value = "";

  try {
    const resp = await methodsHttp.getApi(CHRISTMAS_SALARY_ENDPOINT);

    if (!resp?.ok) {
      christmasSalaryResponse.value = null;
      christmasSalaryError.value =
        resp?.mensaje || "No se pudo cargar el salario de Navidad.";
      return;
    }

    christmasSalaryResponse.value = resp;
  } catch (error) {
    console.log("loadChristmasSalarySummary error:", error);

    christmasSalaryResponse.value = null;
    christmasSalaryError.value =
      error?.response?.data?.mensaje ||
      "No se pudo cargar el salario de Navidad.";
  } finally {
    loadingChristmasSalary.value = false;
  }
};

const triggerFileInput = () => {
  fileInput.value?.pickFiles?.();
};

const previewFile = (file) => {
  if (!file) return;

  if (imageToPreview.value?.startsWith("blob:")) {
    URL.revokeObjectURL(imageToPreview.value);
  }

  imageToPreview.value = URL.createObjectURL(file);
};

const updateImage = async () => {
  if (!image.value) return;

  loadingImage.value = true;

  try {
    const formData = new FormData();
    formData.append("image", image.value);

    const resp = await methodsHttp.putApi(`user/updateUserImage`, formData);

    if (!resp?.ok) {
      notify.value?.showNotifyBad("No se pudo actualizar la imagen.");
      return;
    }

    notify.value?.showNotifyGood("Imagen actualizada correctamente");
    syncUserToForm(resp.user);
    localStorage.setItem("user", JSON.stringify(resp.user));
    image.value = null;
  } catch (error) {
    notify.value?.showNotifyBad("No se pudo actualizar la imagen.");
  } finally {
    loadingImage.value = false;
  }
};

const saveUpdate = async () => {
  if (!currentUser.value?._id) return;

  savingProfile.value = true;

  try {
    const formData = new FormData();

    formData.append("name", form.value.name?.trim() || "");
    formData.append("phone", form.value.phone || "");

    if (form.value.password?.trim()) {
      formData.append("password", form.value.password.trim());
    }

    /**
     * ✅ Mandar imagen dentro del updateUser
     */
    if (image.value) {
      formData.append("image", image.value);
    }

    const resp = await methodsHttp.putApi("user/updateUser", formData);

    if (!resp?.ok) {
      notify.value?.showNotifyBad(
        resp?.mensaje || "No se pudieron guardar los datos."
      );
      return;
    }

    notify.value?.showNotifyGood("Datos guardados correctamente");

    syncUserToForm(resp.user);
    localStorage.setItem("user", JSON.stringify(resp.user));

    if (auth.user) {
      auth.user = resp.user;
    }

    form.value.password = "";
    image.value = null;
  } catch (error) {
    notify.value?.showNotifyBad("No se pudieron guardar los datos.");
  } finally {
    savingProfile.value = false;
  }
};

const deleteImage = async () => {
  if (!currentUser.value?._id) return;

  loadingImage.value = true;

  try {
    const resp = await methodsHttp.putApi(`user/updateUser`, {
      img: null,
    });

    if (!resp?.ok) {
      notify.value?.showNotifyBad("No se pudo eliminar la imagen.");
      return;
    }

    notify.value?.showNotifyGood("Imagen eliminada correctamente");
    syncUserToForm(resp.user);
    localStorage.setItem("user", JSON.stringify(resp.user));
    image.value = null;
  } catch (error) {
    notify.value?.showNotifyBad("Error inesperado al eliminar imagen.");
  } finally {
    loadingImage.value = false;
  }
};

const goTo = (path) => {
  router.push(path).catch(() => {});
};

onMounted(async () => {
  syncUserToForm(auth.user);
  await loadMe();
  await loadVacationSummary();
  await loadChristmasSalarySummary();
});
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 100px);
  background: #f8fafc;
}

.profile-container {
  max-width: 1320px;
  margin: 0 auto;
}

.hero-card,
.section-card,
.empty-card {
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.hero-bg {
  min-height: 210px;
}

.hero-overlay {
  min-height: 210px;
  padding: 24px;
  background: linear-gradient(135deg, #1a2436, #1964a2);
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  width: 100%;
}

.profile-avatar {
  box-shadow: 0 18px 35px rgba(15, 23, 42, 0.25);
}

.avatar-hover {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  opacity: 0;
  transition: 0.2s ease;
}

.avatar-wrapper:hover .avatar-hover {
  opacity: 1;
}

.hidden-file {
  display: none;
}

.hero-chip,
.hero-btn {
  font-weight: 700;
}

.section-card {
  padding: 18px;
}

.full-height {
  height: 100%;
}

.quick-action-card {
  position: relative;
  min-height: 132px;
  border-radius: 20px;
  padding: 16px;
  transition: 0.2s ease;
  background: #ffffff;
}

.quick-action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.1);
}

.quick-arrow {
  position: absolute;
  right: 16px;
  bottom: 16px;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
}

.action-btn {
  text-transform: none;
  font-weight: 700;
  min-height: 40px;
}

.info-tile {
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  padding: 14px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  height: 100%;
}

.info-icon {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  background: rgba(2, 77, 72, 0.1);
  color: var(--q-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-icon .material-icons {
  font-size: 21px;
}

.info-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.info-value {
  font-size: 14px;
  color: #0f172a;
  font-weight: 800;
  margin-top: 2px;
  overflow-wrap: anywhere;
}

.empty-card {
  min-height: 160px;
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex-direction: column;
}

.day-card {
  border-radius: 20px;
  padding: 16px;
  min-height: 150px;
  background: #ffffff;
}

.day-card-off {
  background: #f8fafc;
}

.schedule-line {
  display: grid;
  grid-template-columns: 22px 76px 1fr;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  color: #334155;
}

@media (max-width: 600px) {
  .hero-overlay {
    padding: 18px;
  }

  .avatar-wrapper {
    margin: 0 auto;
  }

  .hero-btn,
  .action-btn {
    width: 100%;
  }
}

.vacation-balance-card {
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.vacation-balance-header {
  padding: 18px;
  background:
    radial-gradient(circle at top right, rgba(2, 77, 72, 0.12), transparent 35%),
    linear-gradient(135deg, #ffffff, #f8fafc);
}

.vacation-header-avatar {
  background: rgba(2, 77, 72, 0.1);
  color: var(--q-primary);
}

.vacation-status-chip {
  font-weight: 700;
  width: 100%;
  justify-content: center;
}

.vacation-progress-box {
  padding: 14px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.vacation-metric-card {
  height: 100%;
  border-radius: 20px;
  padding: 16px;
  background: #ffffff;
  transition: 0.2s ease;
}

.vacation-metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.vacation-metric-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
}

.vacation-metric-value {
  font-size: 24px;
  color: #0f172a;
  font-weight: 900;
  margin-top: 4px;
}

.vacation-metric-caption {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
  max-width: 180px;
}

.vacation-empty-state {
  min-height: 150px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px dashed rgba(15, 23, 42, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex-direction: column;
  padding: 24px;
}
</style>
