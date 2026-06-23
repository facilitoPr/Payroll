<template>
  <div>
    <q-btn
      flat
      round
      dense
      icon="notifications"
      size="18px"
      color="primary"
      aria-label="Abrir notificaciones"
    >
      <q-badge
        v-if="unreadCount > 0"
        floating
        rounded
        color="negative"
        text-color="white"
        class="q-pa-sm"
      >
        {{ displayCount }}
      </q-badge>

      <q-menu
        v-model="open"
        anchor="bottom right"
        self="top right"
        transition-show="jump-down"
        transition-hide="jump-up"
        :offset="[0, 8]"
        class="notif-menu"
        bordered
      >
        <q-card flat style="min-width: 360px; max-width: 420px">
          <!-- Header -->
          <div class="row items-center justify-between q-pa-md">
            <div>
              <div class="text-subtitle1 text-weight-bold">Notificaciones</div>
              <div class="text-caption text-grey-6">
                {{ unreadCount }} sin leer
              </div>
            </div>

            <div class="row items-center q-gutter-xs">
              <q-btn
                flat
                dense
                icon="done_all"
                color="primary"
                :disable="unreadCount === 0 || loading"
                @click="markAllRead"
              >
                <q-tooltip>Marcar todas como leídas</q-tooltip>
              </q-btn>

              <q-btn
                flat
                dense
                icon="refresh"
                color="primary"
                :loading="loading"
                @click="refreshAll(true)"
              >
                <q-tooltip>Actualizar</q-tooltip>
              </q-btn>

              <q-btn
                flat
                dense
                icon="close"
                color="grey-7"
                @click="open = false"
              />
            </div>
          </div>

          <q-separator />

          <!-- Body -->
          <q-card-section class="q-pa-none">
            <div class="q-pa-sm">
              <q-toggle
                v-model="showUnreadOnly"
                color="primary"
                label="Solo no leídas"
                dense
              />
            </div>

            <q-separator />

            <!-- LISTA SCROLLABLE -->
            <div ref="scrollEl" class="notif-list" @scroll.passive="onScroll">
              <q-inner-loading
                :showing="loading && initial === 0"
                label="Cargando..."
              />

              <q-list v-if="filteredItems.length" separator>
                <q-item
                  v-for="it in filteredItems"
                  :key="it.notification?._id || it.notificationId"
                  clickable
                  class="notif-item"
                  :class="{ 'notif-item--unread': !it.readAt }"
                  @click="openNotification(it)"
                >
                  <q-item-section avatar>
                    <q-avatar
                      size="38px"
                      :class="severityClass(it.notification?.severity)"
                    >
                      <q-icon :name="iconByType(it.notification?.type)" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <div class="row items-start justify-between">
                      <div class="text-body2 text-weight-medium">
                        {{ it.notification?.title || "Notificación" }}
                      </div>
                      <div class="text-caption text-grey-6 q-ml-sm">
                        {{ formatWhen(it.notification?.createdAt) }}
                      </div>
                    </div>

                    <div class="text-caption text-grey-7 ellipsis-2">
                      {{ it.notification?.message || "" }}
                    </div>

                    <div
                      v-if="!it.readAt"
                      class="text-caption text-primary q-mt-xs"
                    >
                      • Sin leer
                    </div>
                  </q-item-section>

                  <!-- Acciones por item -->
                  <q-item-section side class="row items-center q-gutter-xs">
                    <q-btn
                      dense
                      flat
                      round
                      icon="delete"
                      color="negative"
                      :loading="!!deletingById[getNotifId(it)]"
                      @click.stop="deleteNotification(it)"
                    >
                      <q-tooltip>Eliminar</q-tooltip>
                    </q-btn>
                    <q-icon name="chevron_right" color="grey-6" />
                  </q-item-section>
                </q-item>
              </q-list>

              <div v-else class="q-pa-md text-center text-grey-7">
                No hay notificaciones por ahora.
              </div>

              <!-- Loader de paginación -->
              <div v-if="loadingMore" class="q-pa-sm flex flex-center">
                <q-spinner size="22px" />
                <span class="text-caption text-grey-6 q-ml-sm"
                  >Cargando más...</span
                >
              </div>

              <div
                v-else-if="!hasMore && items.length"
                class="q-pa-sm text-center text-caption text-grey-6"
              >
                No hay más notificaciones.
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <!-- Footer -->
          <q-card-actions align="between" class="q-px-md q-py-sm">
            <div class="text-caption text-grey-6">
              Mostrando {{ filteredItems.length }} de {{ items.length }}
            </div>
          </q-card-actions>
        </q-card>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import moment from "moment";

import methodsHttp, {
  connectSocketWithToken,
  socket,
} from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";

const $q = useQuasar();
const router = useRouter();
const auth = authStore();

const open = ref(false);
const loading = ref(false);
const loadingMore = ref(false);

const unreadCount = ref(0);
const items = ref([]); // NotificationRecipient[]
const showUnreadOnly = ref(false);

const limit = ref(20);
const initial = ref(0);

const hasMore = ref(true);
const fetching = ref(false);

const deletingById = ref({}); // { [notifId]: true }

const scrollEl = ref(null);

const displayCount = computed(() =>
  unreadCount.value > 99 ? "99+" : String(unreadCount.value),
);

const filteredItems = computed(() => {
  if (!showUnreadOnly.value) return items.value;
  return items.value.filter((x) => !x.readAt);
});

function toggleMenu() {
  open.value = !open.value;
}

watch(open, async (val) => {
  if (val) {
    // al abrir: reset + carga
    await refreshAll(true);
    await nextTick();
    // opcional: scroll arriba
    if (scrollEl.value) scrollEl.value.scrollTop = 0;
  }
});

watch(showUnreadOnly, async () => {
  // Si tu backend soporta filtro de unread en el endpoint, aquí podrías recargar.
  // Como ahora es filtro local, no hace falta recargar.
});

onMounted(async () => {
  if (
    auth?.user?.rol?.code != "MEDICO" &&
    auth?.user?.rol.code != "VERONICAVELEZ" &&
    auth?.user?.rol?.code != "STORE"
  ) {
    await refreshUnreadCount();
    await initSocketListener();
  }
});

async function initSocketListener() {
  try {
    connectSocketWithToken();

    socket.off("notifications:new");
    socket.on("notifications:new", async (payload) => {
      unreadCount.value += 1;

      // si el menú está abierto, refresca arriba (no append) para ver la nueva
      if (open.value) {
        await refreshAll(true);
      }

      $q.notify({
        type: "info",
        message: payload?.title
          ? `Nueva notificación: ${payload.title}`
          : "Nueva notificación",
      });
    });

    socket.on("notifications:remove", async (payload) => {
      unreadCount.value -= 1;

      // si el menú está abierto, refresca arriba (no append) para ver la nueva
      if (open.value) {
        await refreshAll(true);
      }
    });
  } catch (e) {}
}

/**
 * Refresh general
 * @param reset si true: reinicia paginación y recarga primera página
 */
async function refreshAll(reset = false) {
  await Promise.all([refreshUnreadCount(), fetchMyNotifications({ reset })]);
}

async function refreshUnreadCount() {
  try {
    const resp = await methodsHttp.getApi("notifications/my/unread-count");
    if (resp?.ok) unreadCount.value = Number(resp.count || 0);
  } catch (e) {}
}

/**
 * Fetch paginado (append si no reset)
 */
async function fetchMyNotifications({ reset = false } = {}) {
  if (fetching.value) return;

  fetching.value = true;

  if (reset) {
    loading.value = true;
    initial.value = 0;
    hasMore.value = true;
  } else {
    // si no hay más, no busques
    if (!hasMore.value) {
      fetching.value = false;
      return;
    }
    loadingMore.value = true;
  }

  try {
    const resp = await methodsHttp.getApi(
      `notifications/my?limit=${limit.value}&initial=${initial.value}&archived=false`,
    );

    if (!resp?.ok) {
      if (reset) items.value = [];
      hasMore.value = false;
      return;
    }

    const batch = Array.isArray(resp.items) ? resp.items : [];
    const total = typeof resp.total === "number" ? resp.total : null;

    if (reset) {
      items.value = batch;
    } else {
      // append sin duplicados por id
      const map = new Map(items.value.map((x) => [getNotifId(x), x]));
      for (const r of batch) {
        map.set(getNotifId(r), r);
      }
      items.value = Array.from(map.values());
    }

    // avanzar el offset
    initial.value = items.value.length;

    // hasMore: si backend da total úsalo, si no, infiere por batch size
    if (total !== null) {
      hasMore.value = items.value.length < total;
    } else {
      hasMore.value = batch.length === limit.value;
    }
  } catch (e) {
    if (reset) items.value = [];
    hasMore.value = false;
  } finally {
    loading.value = false;
    loadingMore.value = false;
    fetching.value = false;
  }
}

/**
 * Infinite scroll (dentro del menú)
 */
function onScroll(evt) {
  const el = evt?.target;
  if (!el) return;

  const threshold = 80; // px antes del final
  const nearBottom =
    el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;

  if (nearBottom) {
    fetchMyNotifications({ reset: false });
  }
}

function getNotifId(it) {
  return String(it?.notification?._id || it?.notificationId || it?._id || "");
}

function iconByType(type) {
  switch (type) {
    case "TRIPLE_S_ERROR_REPORT":
      return "bug_report";
    case "DISCIPLINARY_WARNING_CREATED":
      return "gpp_maybe";
    case "PAYROLL_RUN_CLOSED":
      return "paid";
    case "PERMISSION_REQUEST_SUBMITTED":
      return "hail";
    case "RECRUITMENT_FORM_SUBMITTED":
      return "assignment_ind";
    default:
      return "notifications";
  }
}

function severityClass(sev) {
  switch (sev) {
    case "SUCCESS":
      return "sev-success";
    case "WARNING":
      return "sev-warning";
    case "ERROR":
      return "sev-error";
    default:
      return "sev-info";
  }
}

function formatWhen(date) {
  if (!date) return "";
  return moment(date).fromNow();
}

function buildFallbackLink(notification) {
  const entityType = notification?.entityType;
  const entityId = notification?.entityId;
  if (!entityType || !entityId) return null;

  switch (entityType) {
    case "DisciplinaryAction":
      return `/rrhh/amonestaciones/${entityId}`;
    case "PayrollRun":
      return `/payroll/runs/${entityId}`;
    case "PermissionRequest":
      return `/permisos/solicitudes/${entityId}`;
    case "RecruitmentApplication":
      return `/rrhh/reclutamiento/applications/${entityId}`;
    case "TripleSErrorReport":
      return `/triple-s/errors/${entityId}`;
    case "TripleSAppointment":
      return `/appointments?id=${entityId}`;
    default:
      return null;
  }
}

async function openNotification(it) {
  const notif = it?.notification;
  const notificationId = notif?._id;

  // marcar como leída
  if (notificationId && !it.readAt) {
    try {
      await methodsHttp.putApi(`notifications/my/${notificationId}/read`, {});
      it.readAt = new Date().toISOString();
      if (unreadCount.value > 0) unreadCount.value -= 1;
    } catch (e) {}
  }

  const link = notif?.link || buildFallbackLink(notif);
  open.value = false;

  if (link) router.push(link);
  else router.push("/notifications");
}

/**
 * Borrar notificación (por usuario)
 * Endpoint asumido: DELETE notifications/my/:notificationId
 * Ajusta si tu backend usa PUT (soft delete) u otra ruta.
 */
async function deleteNotification(it) {
  const id = getNotifId(it);
  const notificationId = it?.notification?._id;

  if (!notificationId) {
    return $q.notify({
      type: "warning",
      message: "No pude identificar el ID de la notificación.",
    });
  }

  const ok = await new Promise((resolve) => {
    $q.dialog({
      title: "Eliminar notificación",
      message: "¿Seguro que deseas eliminar esta notificación?",
      cancel: true,
      persistent: true,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });
  if (!ok) return;

  try {
    deletingById.value[id] = true;

    // ✅ AJUSTA AQUÍ si tu endpoint es distinto
    const resp = await methodsHttp.deleteApi?.(
      `notifications/my/${notificationId}`,
    );

    // Si tu methodsHttp no tiene deleteApi, usa:
    // const resp = await methodsHttp.putApi(`notifications/my/${notificationId}/delete`, {});

    if (!resp?.ok) throw new Error(resp?.mensaje || "No se pudo eliminar.");

    // si estaba sin leer, baja contador
    if (!it.readAt && unreadCount.value > 0) unreadCount.value -= 1;

    // quita de la lista
    items.value = items.value.filter((x) => getNotifId(x) !== id);

    $q.notify({ type: "positive", message: "Notificación eliminada." });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e?.message || "Error eliminando notificación.",
    });
  } finally {
    deletingById.value[id] = false;
  }
}

async function markAllRead() {
  try {
    loading.value = true;
    const resp = await methodsHttp.putApi("notifications/my/read-all", {});
    if (resp?.ok) {
      await refreshAll(true);
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.notif-menu {
  border-radius: 16px;
  overflow: hidden;
}

.notif-list {
  max-height: 420px;
  overflow: auto;
}

.notif-item {
  padding: 12px 10px;
}

.notif-item--unread {
  background: rgba(33, 150, 243, 0.06);
  border-left: 4px solid rgba(33, 150, 243, 0.6);
}

.ellipsis-2 {
  display: -webkit-box;
  /* -webkit-line-clamp: 2; */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Severidad (solo CSS, sin hardcodear en JS) */
.sev-info {
  background: rgba(33, 150, 243, 0.12);
  color: #1e88e5;
}
.sev-success {
  background: rgba(76, 175, 80, 0.12);
  color: #2e7d32;
}
.sev-warning {
  background: rgba(255, 152, 0, 0.14);
  color: #ef6c00;
}
.sev-error {
  background: rgba(244, 67, 54, 0.12);
  color: #d32f2f;
}
</style>
