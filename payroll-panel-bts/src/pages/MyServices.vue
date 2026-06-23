<template>
    <div class="bg-white q-pa-sm">
        <!-- Mensaje descriptivo -->
        <div class="q-mt-md text-center">
            <h5 class="q-ma-xs">Gestión de Servicios</h5>
            <p>
                Selecciona los servicios que deseas asociar a tu perfil y haz clic en "Guardar cambios" para
                actualizarlos.
            </p>
        </div>

        <!-- Formulario -->
        <q-form @submit.prevent="updateUserServices">
            <div class="row q-col-gutter-sm">
                <div v-for="(service, index) in rows" :key="service._id" class="col-12 col-sm-6 col-md-4 q-pa-sm">
                    <q-checkbox v-model="service.checked" :label="service.name" />
                </div>
            </div>

            <!-- Botón de guardar -->
            <div class="row justify-center q-my-md">
                <q-btn type="submit" color="primary" label="Guardar cambios" />
            </div>
        </q-form>

        <!-- Componentes adicionales -->
        <NotificationsVue ref="notify" />
        <Delete ref="deleteInfo" @deleteGood="getServiceDoctor()" />
    </div>
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import { ref, onMounted, watch } from "vue";
import Delete from "src/components/utils/Delete.vue";
import NotificationsVue from "src/components/utils/Notifications.vue";

const tableLoading = ref(false);
const rows = ref([]);
const notify = ref(null);

onMounted(() => {
    getServiceDoctor();
});

const getServiceDoctor = async () => {
    tableLoading.value = true;
    const resp = await methodsHttp.getApi(`services/getServicesDoctor`);

    if (resp.ok) {
        rows.value = resp.services;
    }
    tableLoading.value = false;
};

const updateUserServices = async () => {
    const selectedServices = rows.value
        .filter(service => service.checked) // Solo los servicios seleccionados
        .map(service => service._id); // Solo los IDs

    const resp = await methodsHttp.putApi("services/updateUserServices", {
        services: selectedServices,
    });

    if (resp.ok) {
        getServiceDoctor(); 
        notify.value?.showNotifyGood(resp.mensaje);
    } else {
        console.error(resp.error);
        notify.value?.showNotifyGood(resp.mensaje);
    }
};


</script>