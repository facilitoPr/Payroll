<template>
    <!-- modal -->
    <div>
        <q-dialog v-model="openModal" persistent>
            <q-card style="width: 500px; max-width: 80vw">
                <div class="bg-white row justify-between q-pa-md">
                    <div class="text-white" style="font-size: 19px; font-weight: 500">
                        <div class="row items-center">
                            <div class="col-auto q-mx-sm">
                                <q-icon size="2em" name="medical_services" color="primary" />
                            </div>
                            <div class="col-auto text-primary">
                                <b>{{ "AGREGAR SERVICIO" }}</b>
                            </div>
                        </div>

                        <!-- groups -->
                    </div>
                    <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer"
                        @click="openModal = false; clear(); editMode = false">
                        cancel
                    </span>
                </div>

                <q-card-section class="q-pt-sm">
                    <div>
                        <q-table :loading="props.tableLoading" flat row-key="_id" title="Services and order"
                            :rows="formServices" :columns="columns.columnsFormService()" hide-pagination>
                            <template v-slot:body="props">
                                <q-tr :props="props">

                                    <!-- Otros campos -->
                                    <q-td key="name" :props="props">
                                        {{ props.row?.services.name }}
                                    </q-td>
                                    <q-td key="name" :props="props">
                                        {{ props.row?.order }}
                                    </q-td>

                                    <!-- Campo de acciones -->
                                    <q-td key="actions" :props="props">
                                        <q-btn flat dense round icon="edit" color="primary"
                                            @click="editFormService(props.row)" />
                                        <q-btn flat dense round icon="delete" color="negative"
                                            @click="deleteFormService(props.row)" />
                                    </q-td>
                                </q-tr>

                            </template>
                        </q-table>
                    </div>
                    <div class="q-pt-sm q-col-gutter-sm">
                        <div class="col-12">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> NUMERO DE ORDEN
                                </b>
                            </label>
                            <q-input outlined dense color="primary" v-model="form.order">
                            </q-input>
                        </div>

                        <div class="col-12">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> SERVICIOS
                                </b>
                            </label>
                            <q-select v-model="form.services" use-input option-value="_id" option-label="name" outlined
                                color="primary" :options="services" emit-value map-options>
                                <template v-slot:no-option>
                                    <q-item>
                                        <q-item-section class="text-grey">
                                            No results
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-select>
                        </div>

                        <div class="col-12 q-my-sm text-center">
                            <q-btn type="submit" color="negative" label="cancelar" icon="cancel" class="q-mx-sm"
                                @click="openModal = false; clear()" />

                            <q-btn type="submit" color="primary" label="guardar" icon="save" @click="save"
                                :disable="form.order == '' || form.services == null" />
                        </div>
                    </div>
                </q-card-section>

                <q-inner-loading :showing="modalLoading" label="Please wait..." label-class="text-blue-11"
                    label-style="font-size: 1.5em" />
            </q-card>
        </q-dialog>
    </div>
    <NotificationsVue ref="notify" />
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from "vue"
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import moment from "moment"

const auth = authStore();
const props = defineProps({
    openModal: {
        type: Boolean,
        required: true
    },
    getForm: {
        type: Function,
        required: false
    },
    id: {
        type: String,
        required: true
    }
});

const openModal = ref(props.openModal);
const form = ref({
    order: "",
    services: null,
});
const modalLoading = ref(false);
const notify = ref(null);
const formServices = ref([]);
const services = ref([])
const editMode = ref(false)

onMounted(() => {
    getServices();
});

const getFormServiceByForm = async () => {
    const resp = await methodsHttp.getApi(`services/getFormServiceByForm/${props.id}`);

    if (resp.ok) {
        formServices.value = resp.form;
        console.log(resp)
    }
};

const getServices = async () => {
    const resp = await methodsHttp.getApi(`services/getServices`);

    if (resp.ok) {
        services.value = resp.services;
    }
};

const editFormService = (row) => {
    form.value = { ...row }; // Cargar los datos al formulario para editar
    editMode.value = true;
    openModal.value = true;
};

const deleteFormService = async (row) => {
    const resp = await methodsHttp.deleteApi(`services/deleteFormService/${row._id}`);
    if (resp.ok) {
        formServices.value = formServices.value.filter((item) => item._id !== row._id);
        notify.value?.showNotifyGood(resp.mensaje);
        // props.getForm();
    } else {
        notify.value?.showNotifyBad(resp.mensaje);
    }
};

const save = async () => {
    try {
        modalLoading.value = true
        if (!editMode.value) {

            let resp = await methodsHttp.postApi(
                "services/createFormService",
                { ...form.value, form: props.id }
            );
            if (resp.ok) {

                openModal.value = false;
                notify.value?.showNotifyGood(resp.mensaje);
                props.getForm();
                editMode.value = false
                clear();
            } else {
                notify.value?.showNotifyBad(resp.mensaje);
            }
        } else {

            delete form.value.img
            let resp = await methodsHttp.putApi(
                `services/updateFormService/${form.value._id}`,
                form.value
            );

            if (resp.ok) {

                openModal.value = false;
                notify.value?.showNotifyGood(resp.mensaje);
                props.getForm();
                editMode.value = false
                clear();
            } else {
                notify.value?.showNotifyBad(resp.mensaje);

            }
        }
    } catch (error) {
        console.log(error)
        notify.value?.showNotifyBad("An error has ocurred");
    }
    finally {
        modalLoading.value = false
    }
};

const clear = () => {
    form.value.order = ""
    form.value.services = null
    form.value.form = null
};

// 

const emit = defineEmits(['update:openModal', 'update:mode']);


watch(() => props.openModal, (newVal) => {
    openModal.value = newVal;
});


// Emite el evento para cerrar el modal y sincroniza el estado del modal en el hijo
const closeModal = () => {
    emit('update:openModal', false);
    openModal.value = false;
};

// Observa cambios en openModal para asegurarse de que el valor en el padre también se sincronice si cambia en el hijo
watch(openModal, (newVal) => {
    emit('update:openModal', newVal);
    if (newVal) {
        getFormServiceByForm()
    }
});

</script>