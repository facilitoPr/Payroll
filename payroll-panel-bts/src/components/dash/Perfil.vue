<template>
  <div class="perfil-flex">
    <!-- Foto -->
    <div class="perfil-left">
      <Imagen :img="auth.user.img" :w="'200px'" :h="'230px'" />
    </div>

    <!-- Info -->
    <div class="perfil-right">
      <b class="perfil-name">{{ auth.user.name }}</b>

      <b class="perfil-spec">{{ auth.user?.specialties?.name }}</b>

      <div class="perfil-row">
        <q-icon name="location_on" size="20px" color="grey-6" />
        <b class="perfil-grey">{{ auth.user?.city?.name }}</b>
      </div>

      <div class="perfil-row">
        <q-icon name="business_center" size="20px" color="grey-6" />
        <b class="perfil-grey">Experiencia</b>
        <b class="perfil-grey">{{ auth.user.yearsOfExperiences }}</b>
      </div>

      <div class="perfil-row">
        <q-icon name="diversity_3" size="20px" color="grey-6" />
        <b class="perfil-grey">Pacientes</b>
        <b class="perfil-grey">{{ auth.user.numberOfPatient }}</b>
      </div>
    </div>
  </div>
</template>

<script setup>
import Imagen from "src/components/utils/Imagen.vue";
import { authStore } from "src/stores/auth-store";
const auth = authStore();
</script>

<style scoped>
.perfil-flex {
  display: flex;
  align-items: center;
  justify-content: space-between; /* separa imagen y texto */
  gap: 24px;                      /* espacio entre columnas */
  min-height: 230px;
}

/* Columna izquierda (imagen) */
.perfil-left {
  flex: 0 0 auto;                 /* evita que crezca y monte el texto */
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Columna derecha (texto) */
.perfil-right {
  flex: 1 1 auto;                 /* ocupa el resto del espacio */
  display: flex;
  flex-direction: column;
  gap: 8px;                       /* separación entre filas de texto */
}

.perfil-name {
  font-size: 1.4rem;
}

.perfil-spec {
  color: #808a93;
  font-size: 1.1rem;
  font-weight: 600;
}

.perfil-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.perfil-grey {
  color: #6b7b86;
}

/* Responsive: apila en móviles */
@media (max-width: 768px) {
  .perfil-flex {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .perfil-right {
    align-items: center;
  }
}
</style>
