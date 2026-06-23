<template>
  <div>
    <q-icon
      name="mic"
      color="primary"
      size="35px"
      style="cursor: pointer"
      @click="startRecognition"
      v-if="!isListening"
    />

    <q-icon
      name="mic_off"
      color="negative"
      size="35px"
      style="cursor: pointer"
      @click="stopRecognition"
      v-if="isListening"
    />
  </div>
</template>

<script setup>
import { ref, defineEmits } from "vue";

const emit = defineEmits(["sendTranscript", "isListening"]);

// Verifica si el navegador soporta la Web Speech API
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

// Variables reactivas
const transcript = ref(""); // Donde se guarda el texto reconocido
const isListening = ref(false); // Controla el estado de escucha

if (recognition) {
  recognition.lang = "es-ES"; // Establece el idioma (ej. español)
  recognition.interimResults = false; // Solo resultados finales
  recognition.maxAlternatives = 1; // Máxima cantidad de alternativas de reconocimiento

  // Al obtener el resultado de voz a texto
  recognition.onresult = async (event) => {
    transcript.value = event.results[0][0].transcript;
    
    isListening.value = false;
    await emit("sendTranscript", {transcript:transcript.value, isListening:false});
    // console.log("Al obtener el resultado de voz a texto")
    // await emit("isListening", false);
  };

  // Detecta errores
  recognition.onerror = async(event) => {
    console.error("Error en reconocimiento:", event.error);
    isListening.value = false;
    await emit("isListening", false);
  };

  // Controla el fin del reconocimiento
  recognition.onend = async() => {
    isListening.value = false;
    await emit("isListening", false);
  };
}

// Función para iniciar el reconocimiento de voz
const startRecognition = async () => {
  if (recognition) {
    transcript.value = ""; // Resetea el texto anterior
    recognition.start();
    isListening.value = true;
    await emit("isListening", true);
  } else {
    console.log("El navegador no soporta Speech Recognition API");
  }
};

// Función para detener el reconocimiento de voz
async function stopRecognition() {
  if (recognition && isListening.value) {
    recognition.stop();
    isListening.value = false;
    await emit("isListening", false);
  }
}
</script>

<style scoped>
.speech-to-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

button {
  padding: 10px 15px;
  font-size: 16px;
  cursor: pointer;
}

p {
  font-size: 18px;
  color: #333;
}
</style>