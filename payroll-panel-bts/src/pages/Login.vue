<template>
  <div class="login-page">
    <div class="login-wrapper">
      <div class="login-content">
        <div class="login-brand">
          <div class="brand-overlay"></div>

          <div class="brand-content">
            <q-img :src="logo" class="brand-logo" fit="contain" />

            <div class="brand-text">
              <h1>Bienvenido</h1>
              <p>
                Accede a tu cuenta para gestionar tu sistema de forma rápida,
                segura y desde cualquier dispositivo.
              </p>
            </div>
          </div>
        </div>

        <div class="login-form-side">
          <q-card flat class="login-card">
            <q-card-section class="q-pa-none">
              <div class="form-header">
                <div class="form-chip">
                  <q-icon name="lock" size="18px" />
                  <span>Acceso seguro</span>
                </div>

                <h4 class="form-title">Iniciar sesión</h4>
                <p class="form-subtitle">
                  Ingresa tu correo y contraseña para continuar.
                </p>
              </div>

              <q-form class="q-gutter-y-sm" @submit="submitLogin">
                <q-input
                  v-model="form.email"
                  type="email"
                  label="Correo electrónico"
                  outlined
                  rounded
                  lazy-rules
                  autocomplete="username"
                  :rules="[
                    (val) => !!val || 'El correo es obligatorio',
                    // (val) =>
                    //   /.+@.+\\..+/.test(val) || 'Ingresa un correo válido',
                  ]"
                >
                  <template #prepend>
                    <q-icon name="mail" color="primary" />
                  </template>
                </q-input>

                <q-input
                  v-model="form.password"
                  :type="isPwd ? 'password' : 'text'"
                  label="Contraseña"
                  outlined
                  rounded
                  lazy-rules
                  autocomplete="current-password"
                  :rules="[(val) => !!val || 'La contraseña es obligatoria']"
                >
                  <template #prepend>
                    <q-icon name="lock" color="primary" />
                  </template>

                  <template #append>
                    <q-icon
                      :name="isPwd ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="isPwd = !isPwd"
                    />
                  </template>
                </q-input>

                <div v-if="errorL && message" class="error-box">
                  {{ message }}
                </div>

                <q-btn
                  dense
                  type="submit"
                  color="primary"
                  unelevated
                  rounded
                  no-caps
                  class="full-width login-btn"
                  :loading="loading"
                  :disable="!form.email || !form.password || loading"
                  label="Entrar"
                />

                <q-btn
  flat
  rounded
  no-caps
  class="full-width public-page-btn"
  icon="home"
  label="Ver página principal"
  :disable="loading"
  @click="goToPublicPage"
/>
              </q-form>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";
import { getOrCreateDeviceId, getPlatformWeb } from "src/helpers/device";
import logo from "src/assets/logo.png";
import { useRoute, useRouter } from "vue-router";
import { authStore } from "src/stores/auth-store";

const $q = useQuasar();
const userStore = authStore();
const router = useRouter();
const route = useRoute();
const auth = authStore();

const isPwd = ref(true);
const loading = ref(false);
const errorL = ref(false);
const message = ref("");

const form = ref({
  email: "",
  password: "",
});

onMounted(async () => {
  if (!auth.hydrated) {
    await auth.refreshMe();
  }

  if (auth.loggedIn) {
    router.replace(auth.defaultHomeRoute || "/portal/dashboard");
  }
});

const goToPublicPage = () => {
  router.push("/");
};

const submitLogin = async () => {
  loading.value = true;
  errorL.value = false;
  message.value = "";

  try {
    const payload = {
      ...form.value,
      deviceId: getOrCreateDeviceId(),
      platform: getPlatformWeb(),
    };

    const res = await methodsHttp.postApi("auth/login", payload);

    if (res.ok) {
      userStore.setSession(res.user, res.token);
      $q.notify({
        color: "positive",
        message: res.mensaje || "Has iniciado sesión correctamente",
        position: "top-right",
      });

      const redirect = route.query.redirect;
      router.replace(redirect || auth.defaultHomeRoute || "/portal/profile");
    } else {
      errorL.value = true;
      message.value = res.mensaje || "Credenciales inválidas";

      $q.notify({
        color: "negative",
        message: res.mensaje || "Credenciales inválidas",
        position: "top-right",
      });
    }
  } catch (error) {
    console.error(error);

    errorL.value = true;
    message.value = "Error de red, intenta de nuevo más tarde.";

    $q.notify({
      color: "negative",
      message: "Error de red, intenta de nuevo más tarde.",
      position: "top-right",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
:root {
  --login-bg-gradient: linear-gradient(
    135deg,
    #f6f8f7 0%,
    #e9efeb 35%,
    #dfe8e2 100%
  );
}

.login-page {
  min-height: 100vh;
  background: var(--login-bg-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-wrapper {
  width: 100%;
  max-width: 1200px;
}

.login-content {
  min-height: 720px;
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(21, 49, 73, 0.08);
  border-radius: 32px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 60px rgba(21, 49, 73, 0.12);
}

.login-brand {
  position: relative;
  background: linear-gradient(160deg, #9a8b86 0%, #bcb5b3 45%, #016893 100%);
  padding: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(255, 255, 255, 0.12),
      transparent 22%
    ),
    radial-gradient(
      circle at 80% 30%,
      rgba(255, 255, 255, 0.08),
      transparent 20%
    ),
    radial-gradient(
      circle at 50% 85%,
      rgba(255, 255, 255, 0.06),
      transparent 18%
    );
}

.brand-content {
  position: relative;
  z-index: 2;
  /* max-width: 430px; */
  color: white;
}

.brand-logo {
  width: 180px;
  margin-bottom: 20px;
}

.brand-text h1 {
  font-size: 42px;
  line-height: 1.1;
  font-weight: 800;
  margin: 0;
}

.brand-text p {
  font-size: 16px;
  line-height: 1.8;
  margin: 0;
  opacity: 0.92;
}

.login-form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 28px;
}

.login-card {
  width: 100%;
  max-width: 430px;
  background: transparent;
}

.form-header {
  margin-bottom: 26px;
}

.form-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #153149;
  background: rgba(65, 112, 78, 0.08);
  border: 1px solid rgba(65, 112, 78, 0.16);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}

.form-title {
  font-size: 32px;
  font-weight: 800;
  color: #153149;
  margin: 0 0 8px;
}

.form-subtitle {
  font-size: 15px;
  color: #5f6f7c;
  margin: 0;
  line-height: 1.6;
}

.login-btn {
  height: 52px;
  font-size: 15px;
  font-weight: 700;
}

.error-box {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.12);
  font-weight: 600;
  text-align: center;
}

.public-page-btn {
  height: 46px;
  margin-top: 8px;
  color: #153149;
  font-size: 14px;
  font-weight: 700;
  background: rgba(21, 49, 73, 0.06);
  border: 1px solid rgba(21, 49, 73, 0.08);
}

.public-page-btn:hover {
  background: rgba(21, 49, 73, 0.1);
}

@media (max-width: 1024px) {
  .brand-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
  }

  .login-content {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .login-brand {
    min-height: 280px;
    /* padding: 32px 24px; */
    text-align: center;
  }

  .brand-logo {
    width: 130px;
    height: 130px;
    margin-bottom: 0px;
  }

  .brand-text h1 {
    font-size: 30px;
  }

  .brand-text p {
    font-size: 14px;
  }

  .login-form-side {
    padding: 28px 20px 32px;
  }
}

@media (max-width: 600px) {
  .login-page {
    padding: 14px;
  }

  .login-content {
    border-radius: 24px;
  }

  .login-brand {
    min-height: 220px;
    /* padding: 24px 18px; */
  }

  .brand-text h1 {
    font-size: 24px;
  }

  .form-title {
    font-size: 26px;
  }
}
</style>
