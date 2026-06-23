<template>
  <div>
    <q-dialog v-model="dialog" persistent :maximized="$q.screen.lt.sm">
      <q-card class="sessions-dialog column no-wrap">
        <!-- HEADER -->
        <q-card-section
          class="dialog-header bg-primary row items-center justify-between"
        >
          <div class="row items-center no-wrap text-white">
            <div class="dialog-icon">
              <q-icon size="30px" name="devices" color="white" />
            </div>

            <div>
              <div class="dialog-title">Sesiones del usuario</div>
              <div class="dialog-subtitle">
                {{ targetUser?.name || "Usuario" }} ·
                {{ targetUser?.email || "Sin correo" }}
              </div>
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            :disable="loading || revoking"
            @click="closeDialog"
          />
        </q-card-section>

        <q-separator />

        <!-- BODY -->
        <q-card-section class="sessions-dialog-body">
          <template v-if="loading">
            <div class="q-gutter-md">
              <q-skeleton height="90px" class="rounded-skeleton" />
              <q-skeleton
                v-for="item in 4"
                :key="item"
                height="116px"
                class="rounded-skeleton"
              />
            </div>
          </template>

          <template v-else>
            <!-- SUMMARY -->
            <q-card flat bordered class="summary-card q-mb-md">
              <div class="row q-col-gutter-md items-center">
                <div class="col-12 col-md">
                  <div class="summary-title">Resumen de sesiones</div>
                  <div class="summary-subtitle">
                    Administra los dispositivos donde este usuario ha iniciado sesión.
                  </div>
                </div>

                <div class="col-12 col-md-auto">
                  <div class="row q-gutter-sm">
                    <q-badge rounded color="primary" class="summary-badge">
                      {{ summary.total }} total
                    </q-badge>

                    <q-badge rounded color="positive" class="summary-badge">
                      {{ summary.active }} activas
                    </q-badge>

                    <q-badge rounded color="grey-7" class="summary-badge">
                      {{ summary.revoked }} revocadas
                    </q-badge>
                  </div>
                </div>
              </div>
            </q-card>

            <!-- EMPTY -->
            <div v-if="!sessions.length" class="empty-state">
              <q-icon name="devices_off" size="56px" color="grey-5" />
              <div class="text-subtitle1 text-weight-bold q-mt-sm">
                No hay sesiones registradas
              </div>
              <div class="text-caption text-grey-7">
                Cuando el usuario inicie sesión, aparecerá aquí.
              </div>
            </div>

            <!-- LIST -->
            <div v-else class="sessions-list">
              <q-card
                v-for="session in sessions"
                :key="session._id"
                flat
                bordered
                class="session-card"
                :class="{ 'session-card--revoked': !session.isActive }"
              >
                <q-card-section>
                  <div class="row items-start justify-between q-col-gutter-md">
                    <div class="col-12 col-md">
                      <div class="row items-center no-wrap">
                        <q-avatar
                          size="48px"
                          :color="platformColor(session.platform)"
                          text-color="white"
                          class="q-mr-sm"
                        >
                          <q-icon
                            :name="platformIcon(session.platform)"
                            size="25px"
                          />
                        </q-avatar>

                        <div class="min-width-0">
                          <div class="session-title ellipsis">
                            {{ platformLabel(session.platform) }}
                          </div>

                          <div class="session-subtitle ellipsis">
                            {{ browserLabel(session.userAgent) }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-md-auto">
                      <div class="row items-center q-gutter-sm justify-end">
                        <q-badge
                          rounded
                          :color="session.isActive ? 'positive' : 'grey-7'"
                          class="status-badge"
                        >
                          {{ session.isActive ? "Activa" : "Revocada" }}
                        </q-badge>

                        <q-btn
                          v-if="session.isActive"
                          unelevated
                          no-caps
                          dense
                          color="negative"
                          icon="block"
                          label="Revocar"
                          class="rounded-action"
                          :loading="revokingId === session._id"
                          :disable="revoking"
                          @click="askRevokeSession(session)"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="session-details q-mt-md">
                    <div class="detail-item">
                      <div class="detail-label">Último uso</div>
                      <div class="detail-value">
                        {{ formatDate(session.lastUsedAt) }}
                      </div>
                    </div>

                    <div class="detail-item">
                      <div class="detail-label">Creada</div>
                      <div class="detail-value">
                        {{ formatDate(session.createdAt) }}
                      </div>
                    </div>

                    <div class="detail-item">
                      <div class="detail-label">IP</div>
                      <div class="detail-value">
                        {{ session.ip || "No registrada" }}
                      </div>
                    </div>

                    <div class="detail-item">
                      <div class="detail-label">Push</div>
                      <div class="detail-value">
                        <q-chip
                          dense
                          :color="
                            session.hasExpoPushToken ||
                            session.hasWebPushSubscription
                              ? 'positive'
                              : 'grey-4'
                          "
                          :text-color="
                            session.hasExpoPushToken ||
                            session.hasWebPushSubscription
                              ? 'white'
                              : 'grey-8'
                          "
                        >
                          {{
                            session.hasExpoPushToken ||
                            session.hasWebPushSubscription
                              ? "Configurado"
                              : "No configurado"
                          }}
                        </q-chip>
                      </div>
                    </div>
                  </div>

                  <q-expansion-item
                    v-if="session.userAgent"
                    dense
                    expand-separator
                    icon="info"
                    label="Ver información técnica"
                    class="technical-info q-mt-sm"
                  >
                    <div class="user-agent-box">
                      {{ session.userAgent }}
                    </div>
                  </q-expansion-item>
                </q-card-section>
              </q-card>
            </div>
          </template>
        </q-card-section>

        <q-separator />

        <!-- ACTIONS -->
        <q-card-actions align="right" class="dialog-actions">
          <q-btn
            flat
            no-caps
            color="grey-8"
            label="Actualizar"
            icon="refresh"
            class="dialog-action-btn"
            :loading="loading"
            :disable="revoking"
            @click="loadSessions"
          />

          <q-btn
            v-if="summary.active > 0"
            outline
            no-caps
            color="negative"
            label="Revocar activas"
            icon="block"
            class="dialog-action-btn"
            :loading="revokingAll"
            :disable="loading || revoking"
            @click="askRevokeAll"
          />

          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Cerrar"
            icon="check"
            class="dialog-action-btn"
            :disable="loading || revoking"
            @click="closeDialog"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- CONFIRM -->
    <q-dialog v-model="confirm.open" persistent>
      <q-card class="confirm-dialog">
        <q-card-section class="confirm-header">
          <q-avatar size="70px" color="negative" text-color="white">
            <q-icon name="block" size="36px" />
          </q-avatar>

          <div class="confirm-title">
            {{ confirm.mode === "all" ? "Revocar sesiones" : "Revocar sesión" }}
          </div>

          <div class="confirm-subtitle">
            {{
              confirm.mode === "all"
                ? "Todas las sesiones activas de este usuario serán cerradas."
                : "Esta sesión quedará cerrada y el usuario deberá volver a iniciar sesión."
            }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="confirm-actions">
          <q-btn
            flat
            no-caps
            color="grey-8"
            label="Cancelar"
            class="rounded-action"
            :disable="revoking"
            @click="confirm.open = false"
          />

          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Sí, revocar"
            icon="block"
            class="rounded-action"
            :loading="revoking"
            @click="confirm.mode === 'all' ? revokeAllSessions() : revokeSession()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const $q = useQuasar();

const dialog = ref(false);
const loading = ref(false);
const revoking = ref(false);
const revokingAll = ref(false);
const revokingId = ref(null);

const targetUser = ref(null);
const sessions = ref([]);

const confirm = ref({
  open: false,
  mode: "single",
  session: null,
});

const summary = computed(() => {
  const total = sessions.value.length;
  const active = sessions.value.filter((item) => item.isActive).length;
  const revoked = total - active;

  return {
    total,
    active,
    revoked,
  };
});

async function openModal(user) {
  targetUser.value = user;
  dialog.value = true;
  await loadSessions();
}

function closeDialog() {
  if (loading.value || revoking.value) return;

  dialog.value = false;
}

async function loadSessions() {
  if (!targetUser.value?._id) return;

  loading.value = true;

  try {
    const resp = await methodsHttp.getApi(
      `user-sessions/${targetUser.value._id}`,
    );

    if (resp?.ok) {
      sessions.value = resp.sessions || [];
      return;
    }

    $q.notify({
      type: "negative",
      message: resp?.mensaje || "No se pudieron cargar las sesiones.",
    });
  } catch (error) {
    console.error("loadSessions error:", error);

    $q.notify({
      type: "negative",
      message: "Error cargando las sesiones.",
    });
  } finally {
    loading.value = false;
  }
}

function askRevokeSession(session) {
  confirm.value = {
    open: true,
    mode: "single",
    session,
  };
}

function askRevokeAll() {
  confirm.value = {
    open: true,
    mode: "all",
    session: null,
  };
}

async function revokeSession() {
  const sessionId = confirm.value.session?._id;

  if (!sessionId) return;

  revoking.value = true;
  revokingId.value = sessionId;

  try {
    const resp = await methodsHttp.putApi(
      `user-sessions/${sessionId}/revoke`,
      {},
    );

    if (resp?.ok) {
      $q.notify({
        type: "positive",
        message: resp.mensaje || "Sesión revocada correctamente.",
      });

      confirm.value.open = false;
      await loadSessions();
      return;
    }

    $q.notify({
      type: "negative",
      message: resp?.mensaje || "No se pudo revocar la sesión.",
    });
  } catch (error) {
    console.error("revokeSession error:", error);

    $q.notify({
      type: "negative",
      message: "Error revocando la sesión.",
    });
  } finally {
    revoking.value = false;
    revokingId.value = null;
  }
}

async function revokeAllSessions() {
  if (!targetUser.value?._id) return;

  revoking.value = true;
  revokingAll.value = true;

  try {
    const resp = await methodsHttp.putApi(
      `user-sessions/user/${targetUser.value._id}/revoke-all`,
      {},
    );

    if (resp?.ok) {
      $q.notify({
        type: "positive",
        message: resp.mensaje || "Sesiones revocadas correctamente.",
      });

      confirm.value.open = false;
      await loadSessions();
      return;
    }

    $q.notify({
      type: "negative",
      message: resp?.mensaje || "No se pudieron revocar las sesiones.",
    });
  } catch (error) {
    console.error("revokeAllSessions error:", error);

    $q.notify({
      type: "negative",
      message: "Error revocando las sesiones.",
    });
  } finally {
    revoking.value = false;
    revokingAll.value = false;
  }
}

function platformIcon(platform) {
  if (platform === "ios") return "phone_iphone";
  if (platform === "android") return "android";
  return "desktop_windows";
}

function platformColor(platform) {
  if (platform === "ios") return "indigo";
  if (platform === "android") return "positive";
  return "primary";
}

function platformLabel(platform) {
  if (platform === "ios") return "iPhone / iPad";
  if (platform === "android") return "Android";
  if (platform === "web") return "Navegador web";
  return "Dispositivo";
}

function browserLabel(userAgent = "") {
  const ua = String(userAgent || "");

  if (!ua) return "Dispositivo no identificado";

  if (ua.includes("Edg")) return "Microsoft Edge";
  if (ua.includes("Chrome") && !ua.includes("Chromium")) return "Google Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Mozilla Firefox";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";

  return "Navegador / App";
}

function formatDate(value) {
  if (!value) return "No registrado";

  try {
    return new Date(value).toLocaleString("es-DO", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Fecha inválida";
  }
}

defineExpose({
  openModal,
});
</script>

<style scoped>
.sessions-dialog {
  width: 980px;
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
  max-width: 650px;
  font-size: 0.78rem;
  opacity: 0.86;
}

.sessions-dialog-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(92vh - 154px);
  padding: 18px;
  background: #f8fafc;
}

.rounded-skeleton {
  border-radius: 18px;
}

.summary-card,
.session-card {
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

.summary-card {
  padding: 16px;
}

.summary-title {
  color: #0f172a;
  font-size: 0.98rem;
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

.sessions-list {
  display: grid;
  gap: 12px;
}

.session-card {
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    opacity 0.18s ease;
}

.session-card:hover {
  transform: translateY(-2px);
  border-color: rgba(25, 100, 162, 0.18);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.session-card--revoked {
  opacity: 0.72;
}

.session-title {
  color: #0f172a;
  font-size: 0.98rem;
  font-weight: 900;
}

.session-subtitle {
  margin-top: 3px;
  max-width: 480px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge {
  padding: 6px 10px;
  font-weight: 800;
}

.session-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.detail-item {
  padding: 10px 12px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.detail-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-value {
  margin-top: 5px;
  color: #0f172a;
  font-size: 0.84rem;
  font-weight: 800;
  word-break: break-word;
}

.technical-info {
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
}

.user-agent-box {
  padding: 10px 12px;
  border-radius: 14px;
  color: #475569;
  background: #f1f5f9;
  font-size: 0.78rem;
  line-height: 1.45;
  word-break: break-word;
}

.empty-state {
  min-height: 340px;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  color: #64748b;
}

.dialog-actions {
  padding: 14px 18px;
  background: #ffffff;
  box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.04);
}

.dialog-action-btn,
.rounded-action {
  border-radius: 999px;
  padding-left: 16px;
  padding-right: 16px;
  font-weight: 800;
}

.confirm-dialog {
  width: 430px;
  max-width: 94vw;
  border-radius: 24px;
  overflow: hidden;
}

.confirm-header {
  padding: 28px 24px 22px;
  text-align: center;
  background:
    radial-gradient(circle at top, rgba(193, 0, 21, 0.12), transparent 38%),
    linear-gradient(180deg, #ffffff 0%, #fff7f7 100%);
}

.confirm-title {
  margin-top: 14px;
  color: #0f172a;
  font-size: 1.08rem;
  font-weight: 950;
}

.confirm-subtitle {
  margin-top: 7px;
  color: #64748b;
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.45;
}

.confirm-actions {
  padding: 16px 18px;
  background: #ffffff;
}

.min-width-0 {
  min-width: 0;
}

@media (max-width: 768px) {
  .sessions-dialog {
    width: 100%;
    max-width: 100%;
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
  }

  .sessions-dialog-body {
    max-height: calc(100vh - 154px);
    padding: 12px;
  }

  .session-details {
    grid-template-columns: 1fr;
  }

  .dialog-actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .dialog-action-btn {
    width: 100%;
  }
}
</style>