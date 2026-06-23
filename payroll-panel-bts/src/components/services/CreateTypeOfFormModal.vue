<template>
    <!-- modal -->
    <div>
        <q-dialog v-model="openModal" persistent>
            <q-card style="width: 500px; max-width: 80vw">
                <div class="bg-white row justify-between q-pa-md">
                    <div class="text-white" style="font-size: 19px; font-weight: 500">
                        <div class="row items-center">
                            <div class="col-auto q-mx-sm">
                                <q-icon size="2em" name="analytics" color="primary" />
                            </div>
                            <div class="col-auto text-primary">
                                <b>{{ editMode ? 'EDITAR TIPO DE FORMULARIO' : "CREAR TIPO DE FORMULARIO" }}</b>
                            </div>
                        </div>

                        <!-- groups -->
                    </div>
                    <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer"
                        @click="openModal = false; clear(); props.editMode = false">
                        cancel
                    </span>
                </div>

                <q-card-section class="q-pt-sm">
                    <div class="q-pt-sm row q-col-gutter-sm">
                        <div class="col-12">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> NOMBRE
                                </b>
                            </label>
                            <q-input outlined dense color="primary" v-model="form.name">
                            </q-input>
                        </div>


                        <div class="col-12">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> CODIGO
                                </b>
                            </label>
                            <q-input outlined dense color="primary" v-model="form.code">
                            </q-input>
                        </div>

                        <div class="col-12 q-my-sm text-center">
                            <q-btn type="submit" color="negative" label="cancelar" icon="cancel" class="q-mx-sm"
                                @click="openModal = false; clear()" />

                            <q-btn type="submit" color="primary" label="guardar" icon="save" @click="save"
                                :disable="form.name == '' || form.code == ''" />
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
    getTypeOfForm: {
        type: Function,
        required: false
    },
    formData: {
        type: Object,
        required: true
    },
    editMode: {
        type: Boolean,
        required: true
    }
});

const openModal = ref(props.openModal);
const mode = ref(props.mode);

const form = ref({
    name: "",
    code: "",
});
const modalLoading = ref(false);
const notify = ref(null);

const save = async () => {
    try {
        modalLoading.value = true
        if (!props.editMode) {

            let resp = await methodsHttp.postApi(
                "services/createTypeOfForm",
                form.value
            );
            if (resp.ok) {

                openModal.value = false;
                notify.value?.showNotifyGood(resp.mensaje);
                props.getTypeOfForm();
                props.editMode = false
                clear();
            } else {
                notify.value?.showNotifyBad(resp.mensaje);
            }
        } else {

            delete form.value.img
            let resp = await methodsHttp.putApi(
                `services/updateForm/${props.formData._id}`,
                form.value
            );

            if (resp.ok) {

                openModal.value = false;
                notify.value?.showNotifyGood(resp.mensaje);
                props.getTypeOfForm();
                props.editMode = false
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
    form.value.name = ""
    form.value.typeOfForm = ""
    form.value.description = ""
    form.value.service = []
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
    if (props.editMode) {
        form.value = props.formData
    }
});

</script>