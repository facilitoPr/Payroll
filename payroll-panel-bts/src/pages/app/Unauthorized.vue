<template>
  <div class="unauthorized-page">
    <div class="unauthorized-bg">
      <div class="blob blob-one"></div>
      <div class="blob blob-two"></div>
      <div class="grid-pattern"></div>
    </div>

    <div class="unauthorized-container">
      <q-card flat class="unauthorized-card">
        <q-card-section class="unauthorized-content">
          <div class="icon-wrapper">
            <q-icon name="lock" />
          </div>

          <div class="error-code">403</div>

          <h1>No tienes autorización.</h1>

          <p>
            Tu usuario no tiene permisos para acceder a esta sección. Si crees
            que deberías tener acceso, contacta al administrador del sistema.
          </p>

          <div class="actions row items-center justify-center q-gutter-sm">
            <q-btn
              unelevated
              no-caps
              class="primary-btn"
              icon="dashboard"
              :label="auth.loggedIn ? 'Ir al portal' : 'Ir al inicio'"
              @click="goHome"
            />

            <q-btn
              outline
              no-caps
              class="secondary-btn"
              icon="arrow_back"
              label="Volver atrás"
              @click="goBack"
            />
          </div>

          <div class="help-box">
            <q-icon name="admin_panel_settings" size="20px" />
            <span>
              Esta restricción puede depender de tu rol, permisos asignados o
              estado de tu cuenta.
            </span>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { authStore } from "src/stores/auth-store";

defineOptions({
  name: "UnauthorizedPage",
});

const router = useRouter();
const auth = authStore();

const goHome = () => {
  if (auth.loggedIn) {
    router.replace(auth.defaultHomeRoute || "/portal/dashboard");
    return;
  }

  router.replace("/");
};

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  goHome();
};
</script>

<style scoped>
.unauthorized-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      circle at top left,
      rgba(var(--primary-rgb), 0.16),
      transparent 34%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(239, 68, 68, 0.08),
      transparent 32%
    ),
    linear-gradient(
      135deg,
      #f8fafc 0%,
      rgba(var(--primary-rgb), 0.06) 46%,
      #ffffff 100%
    );
  color: #0f172a;
}

.unauthorized-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.grid-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.22;
  background-image:
    linear-gradient(rgba(var(--primary-rgb), 0.08) 1px, transparent 1px),
    linear-gradient(
      90deg,
      rgba(var(--primary-rgb), 0.08) 1px,
      transparent 1px
    );
  background-size: 36px 36px;
  -webkit-mask-image: linear-gradient(to bottom, black, transparent 78%);
  mask-image: linear-gradient(to bottom, black, transparent 78%);
}

.blob {
  position: absolute;
  border-radius: 999px;
  filter: blur(14px);
  opacity: 0.85;
}

.blob-one {
  width: 360px;
  height: 360px;
  top: -120px;
  right: -90px;
  background: rgba(var(--primary-rgb), 0.2);
}

.blob-two {
  width: 300px;
  height: 300px;
  bottom: -110px;
  left: -80px;
  background: rgba(239, 68, 68, 0.1);
}

.unauthorized-container {
  min-height: 100vh;
  width: min(100% - 32px, 980px);
  margin: 0 auto;
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  padding: 40px 0;
}

.unauthorized-card {
  width: 100%;
  border-radius: 34px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.94),
      rgba(255, 255, 255, 0.86)
    ),
    #ffffff;
  border: 1px solid rgba(var(--primary-rgb), 0.12);
  box-shadow:
    0 30px 90px rgba(15, 23, 42, 0.12),
    0 18px 50px rgba(var(--primary-rgb), 0.08);
  backdrop-filter: blur(18px);
}

.unauthorized-content {
  padding: clamp(28px, 6vw, 64px);
  text-align: center;
}

.icon-wrapper {
  width: 86px;
  height: 86px;
  margin: 0 auto 22px;
  display: grid;
  place-items: center;
  border-radius: 26px;
  color: #ffffff;
  background:
    linear-gradient(
      135deg,
      var(--primary) 0%,
      rgba(var(--primary-rgb), 0.82) 58%,
      #ef4444 100%
    );
  box-shadow: 0 18px 45px rgba(var(--primary-rgb), 0.25);
}

.icon-wrapper .q-icon {
  font-size: 42px;
}

.error-code {
  font-size: clamp(86px, 16vw, 170px);
  line-height: 0.85;
  font-weight: 950;
  letter-spacing: -8px;
  color: transparent;
  background: linear-gradient(
    135deg,
    var(--primary) 0%,
    rgba(var(--primary-rgb), 0.82) 45%,
    #ef4444 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  text-shadow: 0 18px 44px rgba(var(--primary-rgb), 0.14);
}

.unauthorized-content h1 {
  margin: 22px 0 12px;
  color: #0f172a;
  font-size: clamp(30px, 4vw, 48px);
  line-height: 1.05;
  font-weight: 950;
  letter-spacing: -1.3px;
}

.unauthorized-content p {
  width: min(100%, 640px);
  margin: 0 auto;
  color: #64748b;
  font-size: 1.08rem;
  line-height: 1.65;
}

.actions {
  margin-top: 34px;
}

.primary-btn {
  min-height: 46px;
  padding: 0 24px;
  border-radius: 999px;
  font-weight: 800;
  color: #ffffff;
  background: var(--primary);
  box-shadow: 0 18px 40px rgba(var(--primary-rgb), 0.26);
}

.primary-btn:hover {
  box-shadow: 0 20px 46px rgba(var(--primary-rgb), 0.32);
}

.secondary-btn {
  min-height: 46px;
  padding: 0 22px;
  border-radius: 999px;
  font-weight: 800;
  color: var(--primary);
  background: rgba(var(--primary-rgb), 0.03);
}

.help-box {
  width: fit-content;
  max-width: 100%;
  margin: 34px auto 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 16px;
  color: #475569;
  background: rgba(var(--primary-rgb), 0.06);
  border: 1px solid rgba(var(--primary-rgb), 0.1);
  font-size: 0.9rem;
  font-weight: 600;
}

.help-box .q-icon {
  color: var(--primary);
}

@media (max-width: 640px) {
  .unauthorized-container {
    width: min(100% - 20px, 980px);
  }

  .error-code {
    letter-spacing: -4px;
  }

  .actions {
    flex-direction: column;
  }

  .actions .q-btn {
    width: 100%;
  }

  .help-box {
    align-items: flex-start;
    text-align: left;
  }
}
</style>