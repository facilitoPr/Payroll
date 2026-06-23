<template>
    <div class="bg-white q-pa-sm">
        <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-auto col-md-auto row items-center">
                <q-btn color="primary" label="Crear servicio" style="width: 100%; height: 40px" icon="add"
                    @click="openModal = true" />
            </div>
        </div>

        <div class="q-my-md">
            <q-separator />
        </div>

        <div>
            <TableServices :rows="rows" :tableLoading="tableLoading" :getServices="getServices" :openModal="openModal"
                @update:openModal="openModal = $event" />
        </div>
    </div>
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import { ref, onMounted, watch } from "vue";
import TableServices from "src/components/services/TableServices.vue";

const tableLoading = ref(false);
const rows = ref([]);
const openModal = ref(false);

onMounted(() => {
    getServices();
});

const getServices = async () => {
    tableLoading.value = true;
    const resp = await methodsHttp.getApi(`services/getAllServices`);

    if (resp.ok) {
        rows.value = resp.services;
    }
    tableLoading.value = false;
};

</script>