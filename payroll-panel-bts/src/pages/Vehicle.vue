<template>
  <div class="q-pa-md row items-start q-gutter-md">
    <q-card v-for="location in locations" :key="location.name" style="cursor: pointer;" @click="goToPage">
      <q-card-section>
        <div class="text-h6 q-mb-xs">{{ location.name }}</div>
        <div class="text-caption text-grey">{{ location.description }}</div>
      </q-card-section>

      <q-img :src="location.image" />

      <q-card-section>
        <q-icon name="place" />
        <span class="q-ml-sm">{{ location.info }}</span>
      </q-card-section>

      <q-card-actions>
        <q-btn flat color="primary" label="Ver Vehículos" @click="goToPage()" />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const locations = ref([
  {
    name: "San Juan",
    description: "Subasta de autos en la capital",
    image: "https://st2.depositphotos.com/1203257/7557/i/450/depositphotos_75573945-stock-photo-dealer-vehicles-in-stock.jpg",
    info: "Descubre vehículos exclusivos disponibles en esta ubicación.",
  },
  {
    name: "Bayamón",
    description: "Vehículos disponibles en el área metro",
    image: "https://eldinero.com.do/wp-content/uploads/Vehi%CC%81culos-Toyota.jpeg",
    info: "Gran selección de autos en subasta con precios competitivos.",
  },
  {
    name: "Ponce",
    description: "Subasta en la región sur de la isla",
    image: "https://di-uploads-pod41.dealerinspire.com/puentehillsford/uploads/2022/08/images.png",
    info: "Encuentra ofertas especiales en autos disponibles en Ponce.",
  },
]);

const goToPage = () => {
 
};
</script>

<style scoped>

</style>
