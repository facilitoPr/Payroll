<template>
    <div class="bg-white">
        <!-- table -->
        <div>
            <q-table :loading="props.tableLoading" flat row-key="_id" title="Inputs" :rows="props.rows"
                :columns="columns.columnsForm()" hide-pagination :rows-per-page-options="[10]">
                <template v-slot:body="props">
                    <q-tr :props="props">

                        <q-td key="name" :props="props">
                            {{ props.row?.name }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row?.label }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row?.typeOfForm?.name }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row?.placeholder }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row?.required ? 'SI' : 'NO' }}
                        </q-td>

                        <q-td key="name" :props="props" @click="updateState(props.row)">
                            <div v-if="props.row.isActived">
                                <q-badge color="secondary" label="ACTIVE" style="cursor: pointer" />
                            </div>
                            <div v-else>
                                <q-badge color="negative" label="INACTIVE" style="cursor: pointer" />
                            </div>
                        </q-td>

                        <!-- <q-td key="name" :props="props">
                            <div v-if="props.row?.description" style="max-height: 50px; overflow: hidden;">
                                <div v-html="limitHtmlContent(props.row.description, 20)"></div>
                            </div>
                        </q-td> -->

                        <!-- <q-td class="col" key="name" :props="props" v-for="(item, index) in props.row?.services" :key="index">
                            <q-chip color="primary" text-color="white">
                                {{ item.name }}
                            </q-chip>
                        </q-td> -->

                        <q-td key="actions" :props="props">
                            <ActionsButtons :menuItems="menuItems" :data="props.row" />
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
        </div>

        <CreateFormModal :openModal="openModal" :getForm="getForm" :formData="formData" :editMode="editMode"
            @update:openModal="openModal = $event" />

        <ManageServiceFormModal :openModal="openServiceFormModal" :getForm="getForm" :id="id"
            @update:openModal="openServiceFormModal = $event" />

        <NotificationsVue ref="notify" />
        <Delete ref="deleteInfo" @deleteGood="props.getForm()" />
    </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from "vue";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import Delete from "src/components/utils/Delete.vue";
import ActionsButtons from "src/components/table/ActionsButtons.vue"
import CreateFormModal from "./CreateFormModal.vue";
import ManageServiceFormModal from "./ManageServiceFormModal.vue";
import methodsHttp from "src/api/methodsHttp";

const notify = ref(null);
const deleteInfo = ref(null);
const formData = ref({});
const editMode = ref(false);
const openServiceFormModal = ref(false);
const id = ref("")

const props = defineProps({
    rows: {
        type: Array,
        required: true
    },
    tableLoading: {
        type: Boolean,
        required: true
    },
    getForm: {
        type: Function,
        required: false
    },
    openModal: {
        type: Boolean,
        required: true,
    },
});

const openModal = ref(props.openModal);
const emit = defineEmits(["update:openModal"]);

watch(
    () => props.openModal,
    (newVal) => {
        openModal.value = newVal;
    }
);

watch(openModal, (newVal) => {
    emit("update:openModal", newVal);
});

const limitHtmlContent = (html, limit) => {
    // Crear un contenedor temporal para eliminar las etiquetas HTML y obtener texto puro
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    // Limitar el contenido al número de caracteres especificado
    return plainText.length > limit ? plainText.substring(0, limit) + '...' : plainText;
};

const updateState = async (item) => {
    props.tableLoading = true;
    let resp = await methodsHttp.putApi(`services/updateForm/${item._id}`, {
        isActived: !item.isActived,
    });
    if (resp.ok) {
        openModal.value = false;
        notify.value?.showNotifyGood(resp.mensaje);
        props.getForm();
    } else {
        notify.value?.showNotifyBad(resp.mensaje);
    }
    props.tableLoading = false;
};

const openModalEdit = (item) => {
    openModal.value = true
    editMode.value = true;
    formData.value = { ...item }
};

const openModalServiceForm = (item) => {
    id.value = item._id
    openServiceFormModal.value = true
    formData.value = { ...item }
};

const openModalDelete = (item) => {
    const data = {
        id: item._id,
        ruta: "services/deleteForm",
    };

    deleteInfo.value?.openDelete(data);
};

const menuItems = ref([
    {
        icon: "add",
        text: "ADD TO SERVICE",
        color: "primary",
        action: openModalServiceForm
    },
    {
        icon: "edit",
        text: "EDITAR",
        color: "primary",
        action: openModalEdit
    },
    {
        icon: "delete",
        text: "ELIMINAR",
        color: "negative",
        action: openModalDelete
    },
]);

</script>

<style scoped></style>
