<template>
  <div>
    <div class="bordere q-pa-sm" style="height: 520px; width: 100%">
      <div id="map" style="height: 500px; width: 100%"></div>
    </div>
    <q-dialog v-model="alert">
      <q-card class="" style="width: 500px">
        <div class="q-my-xl">
          <div class="text-center">
            <!-- <q-img src="../../assets/logo/trash.gif" width="250px" /> -->
            <!-- <div style="height: 100px; width: 10%">
              <div id="map" style="height: 100px; width: 10%"></div>
            </div> -->
          </div>
          <div class="text-center text-h6 q-mb-sm">¿ESTAS SEGURO</div>
          <div class="text-center text-h6">
            QUE QUIERES GUARDAR ESTA UBICACION?
          </div>
        </div>

        <div class="row q-col-gutter-sm justify-center q-mb-md q-mt-xl">
          <div class="col-auto">
            <q-btn
              type="submit"
              color="negative"
              label="cancelar"
              icon="cancel"
              style="width: 100%; height: 30px"
              @click="alert = false"
            />
          </div>
          <div class="col-auto">
            <q-btn
              color="primary"
              label=" GUARDAR"
              style="width: 100%; height: 30px"
              icon="delete"
              @click="save"
            />
          </div>
        </div>
      </q-card>
    </q-dialog>
    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import L from "leaflet";
import "leaflet-control-geocoder";
import { authStore } from "src/stores/auth-store";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";


const alert = ref(false);
const latitudeSeleted = ref(null);
const longitudeseleted = ref(null);
const auth = authStore();

const notify = ref();

const props = defineProps({
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
});

const save = async () => {
  const data = {
    latitude: latitudeSeleted.value,
    longitude: longitudeseleted.value,
  };
  let resp = await methodsHttp.putApi(`user/updateUser/${auth.user._id}`, data);
  if (resp.ok) {
    alert.value = false
    localStorage.setItem("user", JSON.stringify(resp.user));
    auth.addToken(resp);
    notify.value?.showNotifyGood("Ubicacion guardada correctamente");
    
  }
};

const map = ref(null);
const marker = ref(null);

const initializeMap = (lat, lng) => {
  if (!map.value) {
    // Inicializa el mapa
    map.value = L.map("map").setView([lat, lng], 15);

    // Añade el tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(map.value);
  } else {
    map.value.setView([lat, lng], 15);
  }

  if (marker.value) {
    marker.value.setLatLng([lat, lng]);
  } else {
    marker.value = L.marker([lat, lng])
      .addTo(map.value)
      .bindPopup("Ubicación seleccionada")
      .openPopup();
  }

  map.value.on("click", onMapClick);
};

const onMapClick = (e) => {
  const { lat, lng } = e.latlng;

  if (marker.value) {
    marker.value.setLatLng([lat, lng]);
  } else {
    marker.value = L.marker([lat, lng]).addTo(map.value);
  }

  console.log("Ubicación seleccionada:", lat, lng);
  latitudeSeleted.value = lat;
  longitudeseleted.value = lng;
  alert.value = true;
};

onMounted(() => {
  setTimeout(() => {
    if (props.latitude !== null && props.longitude !== null) {
      initializeMap(props.latitude, props.longitude);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: currentLat, longitude: currentLng } =
            position.coords;
          initializeMap(currentLat, currentLng);
        },
        (error) => {
          console.error("Error al obtener la ubicación:", error);
          initializeMap(20.5937, 78.9629); // Coordenadas por defecto
        }
      );
    } else {
      initializeMap(20.5937, 78.9629); // Coordenadas por defecto
    }
  }, 100);
});
</script>

<style>
#map {
  height: 100%;
  width: 100%;
}
</style>