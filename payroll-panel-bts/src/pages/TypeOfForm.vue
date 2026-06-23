<template>
    <div class="bg-white q-pa-sm">
        <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-auto col-md-auto row items-center">
                <q-btn color="primary" label="Crear tipo de input" style="width: 100%; height: 40px" icon="add"
                    @click="openModal = true" />
            </div>
        </div>

        <div class="q-my-md">
            <q-separator />
        </div>

        <div>
            <TableTypeOfForm :rows="rows" :tableLoading="tableLoading" :getTypeOfForm="getTypeOfForm" :openModal="openModal"
                @update:openModal="openModal = $event" />
        </div>
    </div>
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";

import { ref, onMounted, watch } from "vue";
import TableTypeOfForm from "src/components/services/TableTypeOfForm.vue";
const tableLoading = ref(false);
const rows = ref([]);

const openModal = ref(false);

onMounted(() => {
    getTypeOfForm();
});

const getTypeOfForm = async () => {
    tableLoading.value = true;
    const resp = await methodsHttp.getApi(`services/getTypeOfForm`);

    if (resp.ok) {
        rows.value = resp.typeOfForm;
    }
    tableLoading.value = false;
};


</script>