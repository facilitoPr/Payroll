<template>
  <div class="secret-page">
    <div class="container q-pa-md">
      <q-card class="secret-card" flat bordered>
        <!-- Top glow -->
        <div class="top-glow" />

        <q-card-section class="q-pb-none">
          <div class="row items-center no-wrap">
            <div class="icon-wrap q-mr-md">
              <q-icon name="ac_unit" size="32px" />
            </div>

            <div class="col">
              <div class="text-h5 text-weight-bold">
                Descubriste la página secreta ❄️
              </div>
              <div class="text-subtitle2 text-grey-7 q-mt-xs">
                Tienes una sola oportunidad para desbloquear la nieve.
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-banner rounded class="bg-grey-1 text-grey-8">
            <div class="row items-center justify-between q-col-gutter-sm">
              <div class="col">
                Se cerrará en
                <b>{{ remaining }}s</b>.
                Si se acaba el tiempo, perderás el acceso.
              </div>

              <div class="col-auto">
                <q-chip
                  dense
                  square
                  class="timer-chip"
                  :class="remaining <= 5 ? 'timer-danger' : 'timer-ok'"
                >
                  <q-icon name="timer" class="q-mr-xs" />
                  {{ remaining }}s
                </q-chip>
              </div>
            </div>
          </q-banner>
        </q-card-section>

        <q-separator />

        <q-card-actions align="between" class="q-pa-md">
          <div class="text-caption text-grey-6">
            Estado:
            <b v-if="expired" class="text-negative">Expirado</b>
            <b v-else class="text-positive">Disponible</b>
          </div>

          <q-btn
            unelevated
            rounded
            icon="snowing"
            label="Desbloquear nieve"
            class="unlock-btn"
            :loading="loading"
            :disable="loading || expired"
            @click="onUnlock"
          />
        </q-card-actions>
      </q-card>

      <div class="hint text-caption text-grey-6 q-mt-sm">
        Tip: Esto es “one-shot”. Al salir, el historial se limpia y no podrás volver con
        “Atrás”.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { authStore } from "src/stores/auth-store";

const $q = useQuasar();
const auth = authStore();

const loading = ref(false);

// ⏳ Tiempo límite (segundos)
const TIME_LIMIT = 15;

const remaining = ref(TIME_LIMIT);
const expired = computed(() => remaining.value <= 0);

let timer: any = null;

function goHomeAndClearHistory() {
  // Limpia el historial: reemplaza la entrada actual y navega sin dejar “back”.
  // 1) Cambia la URL actual por "/" (no deja la ruta secreta en el stack)
  window.history.replaceState(null, "", "/");
  // 2) Re-carga en "/" sin agregar una nueva entrada
  window.location.replace("/");
}

onMounted(() => {
  timer = setInterval(() => {
    remaining.value -= 1;
    if (remaining.value <= 0) {
      remaining.value = 0;
      clearInterval(timer);

      $q.notify({
        type: "warning",
        message: "Tiempo agotado. Se cerrará la página secreta.",
        position: "top",
        timeout: 1200,
      });

      // Saca al usuario y limpia historial
      setTimeout(() => {
        goHomeAndClearHistory();
      }, 600);
    }
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

const onUnlock = async () => {
  if (loading.value || expired.value) return;

  loading.value = true;

  try {
    // Si unlockSnow es async, el await no rompe nada:
    await Promise.resolve(auth.unlockSnow());

    $q.notify({
      type: "positive",
      message: "Nieve desbloqueada. Redirigiendo...",
      position: "top",
      timeout: 900,
    });

    goHomeAndClearHistory();
  } catch (e: any) {
    console.error(e);
    $q.notify({
      type: "negative",
      message: e?.message || "No se pudo desbloquear la nieve.",
      position: "top",
    });
    loading.value = false;
  }
};
</script>

<style scoped>
.secret-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
      900px 500px at 15% 20%,
      rgba(34, 44, 91, 0.12),
      transparent 60%
    ),
    radial-gradient(
      700px 450px at 85% 30%,
      rgba(0, 150, 136, 0.12),
      transparent 55%
    ),
    linear-gradient(180deg, #ffffff 0%, #f6f7fb 100%);
}

.container {
  width: 100%;
  max-width: 640px;
}

.secret-card {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
}

.top-glow {
  height: 6px;
  width: 100%;
  background: linear-gradient(90deg, #222c5b, #009688);
}

.icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(
    135deg,
    rgba(34, 44, 91, 0.12),
    rgba(0, 150, 136, 0.12)
  );
}

.unlock-btn {
  padding-left: 18px;
  padding-right: 18px;
  font-weight: 700;
  letter-spacing: 0.2px;
  background: linear-gradient(135deg, #222c5b, #009688);
  color: #fff;
}

.timer-chip {
  border-radius: 10px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.timer-ok {
  background: rgba(0, 150, 136, 0.12);
  color: #00796b;
}

.timer-danger {
  background: rgba(244, 67, 54, 0.12);
  color: #c62828;
}

.hint {
  text-align: center;
}
</style>
