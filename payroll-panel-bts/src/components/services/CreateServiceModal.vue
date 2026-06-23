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
                                <b>{{
                                    "CREAR SERVICIO"
                                    }}</b>
                            </div>
                        </div>

                        <!-- groups -->
                    </div>
                    <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer"
                        @click="openModal = false; modeFalse()">
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


                        <div class="col-12 col-md-6">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> PRICE
                                </b>
                            </label>
                            <q-input outlined dense color="primary" type="number" v-model="form.price">
                            </q-input>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b>
                                    APLICACIÓN
                                </b>
                            </label>
                            <q-select v-model="form.application" option-label="name" outlined dense color="primary"
                                :options="applications">
                                <template v-slot:no-option>
                                    <q-item>
                                        <q-item-section class="text-grey">
                                            No results
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-select>
                        </div>

                        <div class="col-12">
                            <label>
                                <b> <b class="text-negative">* </b> DESCRIPTION </b>
                            </label>
                            <q-input outlined dense color="primary" type="textarea" v-model="form.description">
                            </q-input>
                        </div>

                        <q-file @input="updateFile" class="col-12 q-mt-sm" outlined label="Image" v-model="image">
                            <template v-slot:prepend>
                                <q-icon name="attach_file" />
                            </template>
                            <template v-slot:after>
                                <q-btn style="height: 100%;" @click="() => { form.img = null; image = null }">
                                    <q-icon name="delete" color="red" />
                                </q-btn>
                            </template>
                        </q-file>

                        <div class="col-12 q-mt-sm"
                            style="display: flex; align-items: center; justify-content: center;">
                            <q-img v-if="form.img" :src="form.img" spinner-color="white"
                                style="height: 140px; max-width: 150px; border: 1px solid black; border-radius: 20px" />
                        </div>

                        <div class="col-12 q-my-sm text-center">
                            <q-btn type="submit" color="negative" label="cancelar" icon="cancel" class="q-mx-sm"
                                @click="openModal = false" />

                            <q-btn type="submit" color="primary" label="guardar" icon="save" @click="save"
                                :disable="form.name == '' || form.code == '' || form.description == '' || form.application == null" />
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
    getServices: {
        type: Function,
        required: false
    },
    serviceData: {
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
const applications = ref([]);

onMounted(() => {
    getApplications();
});

const form = ref({
    name: "",
    code: "",
    img: "",
    price: 0,
    description: "",
    application: null
});
const modalLoading = ref(false);
const notify = ref(null);
const image = ref(null);

const getApplications = async () => {
    let resp = await methodsHttp.getApi(
        `applications/getApplications`
    );

    if (resp.ok) {
        applications.value = resp.applications
    }
};

const updateFile = ({ target }) => {
    if (target.files.length > 0) {
        // form.value.img = URL.createObjectURL(target.files);
        form.value.img = Array.from(target.files).map(file => URL.createObjectURL(file));
    }
}

const save = async () => {
    try {
        modalLoading.value = true
        if (!props.editMode) {

            form.value.img = ""
            let resp = await methodsHttp.postApi(
                "services/createServices",
                form.value
            );
            if (resp.ok) {

                const formData = new FormData();
                formData.append('image', image.value);

                if (image.value) {
                    await methodsHttp.putApi(
                        `services/updateServiceImage/${resp?.service._id}`,
                        formData
                    );
                }

                openModal.value = false;
                notify.value?.showNotifyGood(resp.mensaje);
                props.getServices();
                props.editMode = false
                clear();
            } else {
                notify.value?.showNotifyBad(resp.mensaje);
            }
        } else {

            delete form.value.img
            let resp = await methodsHttp.putApi(
                `services/updateService/${props.serviceData._id}`,
                form.value
            );

            if (resp.ok) {
                const formData = new FormData();
                formData.append('image', image.value);

                if (image.value) {
                    await methodsHttp.putApi(
                        `services/updateServiceImage/${resp?.service._id}`,
                        formData
                    );
                }

                openModal.value = false;
                notify.value?.showNotifyGood(resp.mensaje);
                props.getServices();
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
    form.value.code = ""
    form.value.description = ""
    form.value.img = ""
    form.value.price = 0
    form.value.application = null
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
        form.value = props.serviceData
    }
});

</script>