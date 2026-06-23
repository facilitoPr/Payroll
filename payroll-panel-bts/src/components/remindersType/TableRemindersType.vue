<template>
    <div class="bg-white q-pa-sm">
        <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-auto col-md-auto row items-center">
                <q-btn color="primary" label="Crear tipo de recordatorio" style="width: 100%; height: 40px" icon="add"
                    @click="create" />
            </div>
        </div>

        <div class="q-my-md">
            <q-separator />
        </div>

        <!-- modal -->
        <div>
            <q-dialog v-model="openModal" persistent>
                <q-card style="width: 550px; max-width: 80vw">
                    <q-inner-loading :showing="isLoading" label="Enviando..." label-class="text-blue-11"
                        label-style="font-size: 1.1em" />
                    <div class="bg-white row justify-between q-pa-md">
                        <div class="text-white" style="font-size: 19px; font-weight: 500">
                            <div class="row items-center">
                                <div class="col-auto q-mx-sm">
                                    <q-icon size="2em" name="add" color="primary" />
                                </div>
                                <div class="col-auto text-primary">
                                    <b>{{
                                        mode ? "EDITAR TIPO DE RECORDATORIO" : "CREAR TIPO DE RECORDATORIO"
                                        }}</b>
                                </div>
                            </div>

                            <!-- groups -->
                        </div>
                        <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer"
                            @click="openModal = false">
                            cancel
                        </span>
                    </div>

                    <q-card-section class="q-pt-sm">
                        <div class="q-pt-sm row q-col-gutter-sm">
                            <div class="col-12 col-md-6">
                                <label>
                                    <b>
                                        <b class="text-negative">* </b> NOMBRE
                                    </b>
                                </label>
                                <q-input outlined dense color="primary" v-model="form.name">
                                </q-input>
                            </div>

                            <div class="col-12 col-md-6">
                                <label>
                                    <b>
                                        <b class="text-negative">* </b> CODE
                                    </b>
                                </label>
                                <q-input outlined dense color="primary" v-model="form.code">
                                </q-input>
                            </div>

                            <div class="col-12 q-my-sm text-center">
                                <q-btn type="submit" color="negative" label="cancelar" icon="cancel" class="q-mx-sm"
                                    @click="openModal = false" />

                                <q-btn type="submit" color="primary" label="guardar" icon="save" @click="save"
                                    :disable="form.name == '' || form.code == ''" />
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </q-dialog>
        </div>

        <!-- table -->
        <div>
            <q-table :loading="tableLoading" flat row-key="_id" title="TIPOS DE RECORDATORIOS" :rows="rows"
                :columns="columns.columnsZones()" dense>
                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td key="image" :props="props">
                            <ImagenVue :img="props.row.img
    ? props.row.img
    : 'https://plus-nautic.nyc3.digitaloceanspaces.com/recordatorio.png'
                        " style="cursor: pointer; width: 50px; height: 50px; overflow:hidden" />
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row.name }}
                        </q-td>

                        <q-td key="name" :props="props" @click="updateState(props.row)">
                            <div v-if="props.row.isActived">
                                <q-badge color="secondary" label="ACTIVE" style="cursor: pointer" />
                            </div>
                            <div v-else>
                                <q-badge color="negative" label="INACTIVE" style="cursor: pointer" />
                            </div>
                        </q-td>

                        <q-td key="actions" :props="props">
                            <ActionsButtons :menuItems="menuItems" :data="props.row" />
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
        </div>
        <NotificationsVue ref="notify" />
        <Delete ref="deleteInfo" @deleteGood="getRemindersTypes" />
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import Delete from "src/components/utils/Delete.vue";
import ImagenVue from "src/components/utils/Imagen.vue"
import ActionsButtons from "src/components/table/ActionsButtons.vue"

const notify = ref(null);
const deleteInfo = ref(null);

const rows = ref([]);
const TableFilter = ref([]);
const tableLoading = ref(false);
const openModal = ref(false);
const mode = ref(false);
const id = ref(null);
const form = ref({
    name: "",
    code: "",
});
const isLoading = ref(false);

onMounted(() => {
    getRemindersTypes();
});


const getRemindersTypes = async () => {
    tableLoading.value = true;
    const resp = await methodsHttp.getApi(
        `remindersTypes/getRemindersTypes`
    );

    if (resp.ok) {
        rows.value = resp.remindersTypes
        TableFilter.value = resp.remindersTypes
    }
    tableLoading.value = false;
};

const create = () => {
    mode.value = false
    clear()
    openModal.value = true;
};


const openModalEdit = (item) => {
    form.value.name = item.name;
    form.value.code = item.code;
    mode.value = true;
    openModal.value = true;
    id.value = item._id;
};


const updateState = async (item) => {
    tableLoading.value = true;
    let resp = await methodsHttp.putApi(
        `remindersTypes/updateReminderType/${item._id}`,
        { isActived: !item.isActived }
    );
    if (resp.ok) {
        openModal.value = false;
        notify.value?.showNotifyGood(resp.mensaje);
        getRemindersTypes();
        clear()
    } else {
        notify.value?.showNotifyBad(resp.mensaje);
    }
    tableLoading.value = false;
};

const clear = () => {
    form.value.name = "";
    form.value.code = "";
};

const openModalDelete = (item) => {
    const data = {
        id: item._id,
        ruta: "remindersTypes/deteleReminderType",
    };

    deleteInfo.value?.openDelete(data);
};

const save = async () => {
    try {
        isLoading.value = true;
        let resp;
        if (!mode.value) {
            resp = await methodsHttp.postApi("remindersTypes/createReminderType", { ...form.value });
        } else {
            resp = await methodsHttp.putApi(`remindersTypes/updateReminderType/${id.value}`, { ...form.value });
        }

        if (resp?.ok) {
            openModal.value = false;
            notify.value?.showNotifyGood(resp.mensaje);
            getRemindersTypes();
            clear();
        } else {
            notify.value?.showNotifyBad(resp?.mensaje || 'Error desconocido');
        }
    } catch (error) {
        notify.value?.showNotifyBad('Error al guardar la operadora');
        console.error('Error en la operación save:', error);
    }
    finally {
        isLoading.value = false;
    }
};

const menuItems = ref([
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
    }
]);

</script>

<style scoped></style>
