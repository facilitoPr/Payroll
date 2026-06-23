<template>
  <div class="app-root">
    <!-- <div class="snow-overlay"></div> -->
    <router-view />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
export default defineComponent({
  name: "App",
});
</script>

<style scoped>
.app-root {
  position: relative;
  min-height: 100vh;
}

.shovel {
  width: 90px;
}

/* ❄️ Nieve cayendo sobre toda la pantalla */
.snow-overlay {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 9998;
  overflow: hidden;
  opacity: 0.5;
  background-image: radial-gradient(
      2px 2px at 10px 20px,
      rgba(255, 255, 255, 0.9) 100%,
      transparent 51%
    ),
    radial-gradient(
      2px 2px at 50px 80px,
      rgba(255, 255, 255, 0.8) 100%,
      transparent 51%
    ),
    radial-gradient(
      3px 3px at 130px 40px,
      rgba(255, 255, 255, 0.85) 100%,
      transparent 51%
    );
  background-size: 200px 200px, 260px 260px, 320px 320px;
  animation: snow-fall 10s linear infinite;
}

/* ❄️ Animación vertical tipo nevada */
@keyframes snow-fall {
  0% {
    background-position: 0 0, 0 0, 0 0;
  }
  100% {
    background-position: 0 600px, 0 900px, 0 1200px;
  }
}

</style>
