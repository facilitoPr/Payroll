<template>
  <div class="col-12 row items-center q-pl-md" style="height: 5vh">
    <q-btn
      dense
      round
      unelevated
      color="primary"
      icon="arrow_back"
      text-color="white"
      @click="goBack"
    >
      <q-tooltip class="bg-primary text-white shadow-4" :offset="[10, 10]">
        <div class="text-bold">Regresar</div>
      </q-tooltip></q-btn
    >
  </div>

  <div class="row items-center justify-center" style="height: 95vh">
    <div class="col-12 row justify-center q-pb-xl">
      <div
        class="text-bold col-12 text-center text-h6 q-my-md text-primary"
        style=""
      >
        Ponchar aqui
      </div>
      <div
        class="pulse-button row justify-center items-center"
        @click="abrirCamara"
      >
        <q-icon name="fingerprint" size="3.5rem" color="white" />
      </div>
    </div>

    <q-dialog
      v-model="dialogVisible"
      persistent
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="q-pa-md q-gutter-y-md">
        <!-- Título -->
        <q-card-section class="row items-center q-pb-none">
          <q-icon name="photo_camera" color="primary" class="q-mr-sm" />
          <div class="text-h6 text-primary">Captura de Ponche</div>
        </q-card-section>

        <q-card-section class="q-pt-xs q-pb-sm">
          <div
            class="xmas-prompt row items-center justify-center"
            v-if="!fotoTomada"
          >
            <q-icon name="celebration" class="xmas-prompt-icon" />
            <div class="xmas-prompt-text">
              <div class="xmas-prompt-main">Sonríe, es Año nuevo 🎆</div>
              <div class="xmas-prompt-sub">
                Mira a la cámara, relájate y deja tu mejor foto para el ponche.
              </div>
            </div>
            <q-icon name="emoji_emotions" class="xmas-prompt-icon" />
          </div>

          <div class="xmas-prompt row items-center justify-center" v-else>
            <q-icon
              name="task_alt"
              class="xmas-prompt-icon xmas-prompt-icon--ok"
            />
            <div class="xmas-prompt-text">
              <div class="xmas-prompt-main">¡Perfecto! 🎆</div>
              <div class="xmas-prompt-sub">
                Si te gusta cómo saliste, coloca tu código y confirma el ponche.
              </div>
            </div>
          </div>
        </q-card-section>

        <!-- Vista de Cámara o Imagen -->
        <q-card-section class="text-center">
          <div v-if="!fotoTomada">
            <video
              ref="video"
              autoplay
              playsinline
              style="
                width: 100%;
                max-width: 800px;
                max-height: 400px;
                border-radius: 12px;
                background: black;
              "
            ></video>
            <div class="text-caption text-grey q-mt-sm">
              Activa tu cámara y presiona para capturar
            </div>
          </div>

          <div v-else>
            <img
              :src="fotoUrl"
              alt="Foto tomada"
              style="
                width: 100%;
                max-width: 400px;
                height: auto;
                border-radius: 12px;
                background: black;
              "
            />
            <div class="text-caption text-grey q-mt-sm">
              Verifica la imagen y confirma
            </div>
          </div>
        </q-card-section>

        <!-- Campo de Código -->
        <q-card-section
          v-if="fotoTomada"
          class="row justify-center q-gutter-y-sm q-mt-none"
        >
          <div class="text-subtitle2 text-center full-width text-grey-8">
            Por favor, digita tu <strong>código de empleado</strong> para
            confirmar el ponche.
          </div>

          <q-input
            v-model="codigo"
            type="number"
            label="Código de Empleado"
            outlined
            color="primary"
            dense
            style="width: 300px"
            :rules="[(val) => val.length === 4 || 'Debe tener 4 dígitos']"
            :input-attrs="{
              inputmode: 'numeric',
              pattern: '[0-9]*',
              maxlength: 4,
            }"
            @update:model-value="soloNumeros"
          />
        </q-card-section>

        <!-- Botones -->
        <q-card-actions class="q-mt-none" align="center">
          <q-btn
            v-if="!fotoTomada"
            label="📸 Tomar Foto"
            color="primary"
            unelevated
            no-caps
            @click="tomarFoto"
          />
          <q-btn
            v-if="fotoTomada"
            label="Confirmar Ponche"
            color="primary"
            unelevated
            no-caps
            :disable="codigo.length < 4 || showLoading"
            @click="registrarPonche"
          />
          <q-btn
            label="Cancelar"
            flat
            color="negative"
            no-caps
            @click="cerrarCamara"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <NotificationsVue ref="notify" />
    <q-dialog
      v-model="showLoading"
      :maximized="true"
      backdrop-filter="blur(4px) saturate(150%)"
    >
      <div class="justify-center items-center row">
        <div class="col-auto text-center items-center">
          <div class="q-mb-sm">
            <q-spinner-ios color="white" size="3em" class="" />
          </div>
          <div class="text-white" style="font-family: 20px; font-weight: bold">
            Cargando....
          </div>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, nextTick, onUnmounted } from "vue";
import NotificationsVue from "src/components/utils/Notifications.vue";
import methodsHttp from "src/api/methodsHttp";
import { useRouter } from "vue-router";
import { Loading } from "quasar";
import { authStore } from "src/stores/auth-store";

const router = useRouter();
const auth = authStore();

const notify = ref(null);
const dialogVisible = ref(false);
const video = ref(null);
const stream = ref(null);
const fotoTomada = ref(false);
const fotoUrl = ref("");
const fotoBlob = ref(null);

const codigo = ref("");

const soloNumeros = (val) => {
  // Elimina cualquier cosa que no sea número
  const soloNumeros = val.replace(/\D/g, "").slice(0, 4);
  codigo.value = soloNumeros;
};

const showLoading = ref(false);
const abrirCamara = async () => {
  dialogVisible.value = true;
  await nextTick();

  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: true });
    if (video.value) {
      video.value.srcObject = stream.value;
      video.value.play();
    }
  } catch (err) {
    console.error("❌ No se pudo acceder a la cámara:", err);
  }
};

const tomarFoto = () => {
  const canvas = document.createElement("canvas");
  canvas.width = video.value.videoWidth;
  canvas.height = video.value.videoHeight;
  const context = canvas.getContext("2d");
  context.drawImage(video.value, 0, 0);

  canvas.toBlob((blob) => {
    fotoBlob.value = blob;
    fotoUrl.value = URL.createObjectURL(blob);
    fotoTomada.value = true;

    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop());
    }
  }, "/jpg");
};

const cerrarCamara = () => {
  dialogVisible.value = false;
  fotoTomada.value = false;
  fotoUrl.value = "";
  fotoBlob.value = null;
  codigo.value = "";

  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
  }
};

const registrarPonche = async () => {
  try {
    showLoading.value = true;
    if (!fotoBlob.value) return;

    const formData = new FormData();
    formData.append("image", fotoBlob.value);
    formData.append("codigo", codigo.value);

    // try {
    const resp = await methodsHttp.postApi("punch/registrarPonche", formData);
    if (resp.ok) {
      notify.value?.showNotifyGood(resp.mensaje);
      cerrarCamara();
      showLoading.value = false;
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
      showLoading.value = false;
    }
  } catch (error) {
    if (error?.code === 11000) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        ok: false,
        mensaje: "Ese ponche ya fue registrado (duplicado detectado).",
      });
    }
  }
};

onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
  }
});

const goToPage = () => {
  router.push({ name: "Confirmarturno" });
};

const goBack = () => {
  if (window.history.state?.back) {
    router.back();
  } else {
    router.push(auth.defaultHomeRoute || "/");
  }
};
</script>

<style scoped>
.pulse-button {
  animation: pulse 1.5s infinite;
  box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7);
  height: 100px;
  width: 100px;
  border-radius: 100px;
  background: #219ebc;
  cursor: pointer;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 10px rgba(33, 150, 243, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
  }
}

.xmas-prompt {
  max-width: 600px;
  margin: 0 auto;
  padding: 8px 14px;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(117, 207, 252, 0.15),
    rgba(2, 143, 213, 0.08),
    rgba(1, 90, 165, 0.12)
  );
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  text-align: left;
  gap: 8px;
}

.xmas-prompt-icon {
  font-size: 1.7rem;
  color: #178dd2;
}

.xmas-prompt-icon--ok {
  color: #4caf50;
}

.xmas-prompt-text {
  flex: 1;
  min-width: 0;
}

.xmas-prompt-main {
  font-weight: 700;
  font-size: 1rem;
  color: #023045;
}

.xmas-prompt-sub {
  font-size: 0.82rem;
  color: #4b5563;
}

/* Ajuste en pantallas pequeñas */
@media (max-width: 600px) {
  .xmas-prompt {
    padding: 6px 10px;
    border-radius: 12px;
  }

  .xmas-prompt-main {
    font-size: 0.9rem;
  }

  .xmas-prompt-sub {
    font-size: 0.75rem;
  }

  .xmas-prompt-icon {
    font-size: 1.4rem;
  }
}
</style>
