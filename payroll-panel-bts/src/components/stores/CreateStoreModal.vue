<template>
    <!-- modal -->
    <div>
        <q-dialog v-model="openModal" persistent>
            <q-card style="width: 600px; max-width: 80vw">
                <div class="bg-white row justify-between q-pa-md">
                    <div class="text-white" style="font-size: 19px; font-weight: 500">
                        <div class="row items-center">
                            <div class="col-auto q-mx-sm">
                                <q-icon size="2em" name="people" color="primary" />
                            </div>
                            <div class="col-auto text-primary">
                                <b>{{
                                    mode
                                    ? "EDITAR TIENDA"
                                    : "CREAR TIENDA"
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
                        <div class="col-12 col-md-12">
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
                                <b> <b class="text-negative">* </b> CORREO </b>
                            </label>
                            <q-input outlined dense color="primary" v-model="form.email">
                            </q-input>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b> <b class="text-negative">* </b> APLICACIÓN </b>
                            </label>
                            <q-select v-model="form.application" option-value="_id" option-label="name" outlined dense
                                color="primary" :options="applications">
                                <template v-slot:no-option>
                                    <q-item>
                                        <q-item-section class="text-grey">
                                            No results
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-select>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b> <b class="text-negative">* </b> DIRECCIÓN </b>
                            </label>
                            <q-input outlined dense color="primary" v-model="form.address">
                            </q-input>
                        </div>

                        <div v-if="auth.user.rol.code == 'ADMIN'" class="col-12 col-md-6">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> ZONA
                                </b>
                            </label>
                            <q-select v-model="form.zone" use-input label="ZONA" option-value="_id" option-label="name"
                                outlined dense color="primary" :options="zones" emit-value map-options
                                @filter="filterZones">
                                <template v-slot:no-option>
                                    <q-item>
                                        <q-item-section class="text-grey">
                                            No results
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-select>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> ZIP
                                </b>
                            </label>
                            <q-input outlined dense color="primary" type="number" v-model="form.zip">
                            </q-input>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> TELEFONO
                                </b>
                            </label>
                            <q-input outlined dense color="primary" type="number" v-model="form.phone">
                            </q-input>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> CUENTA DE BANCO
                                </b>
                            </label>

                            <q-input outlined dense color="primary" type="number" v-model="form.bank_account">
                            </q-input>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> NUMERO DE RUTA
                                </b>
                            </label>

                            <q-input outlined dense color="primary" type="number" v-model="form.route_number">
                            </q-input>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> INSTITUTO BANCARIO
                                </b>
                            </label>

                            <q-input outlined dense color="primary" type="text" v-model="form.banking_institute">
                            </q-input>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> NOMBRE DE LA CUENTA
                                </b>
                            </label>

                            <q-input outlined dense color="primary" type="text" v-model="form.account_name">
                            </q-input>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b>TRANSACTION CODE</b>
                            </label>
                            <!-- <q-input outlined dense color="primary" v-model="inputTextM"> </q-input> -->
                            <q-select outlined dense color="primary" :require="true" :options="transaction_code"
                                v-model="transaction_codeSeleted" option-label="name">
                            </q-select>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b> <b class="text-negative">*</b> CONTRASEÑA </b>
                            </label>

                            <q-input color="primary" required outlined autocomplete="off"
                                :type="isPwd ? 'password' : 'text'" class="col-md-12" dense v-model="form.password">
                                <template v-slot:append>
                                    <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                                        @click="isPwd = !isPwd" />
                                </template>
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

                        <div class="col-12 col-md-6">
                            <label>
                                <b> <b class="text-negative">* </b> DISABLED? </b>
                            </label>
                            <q-checkbox v-model="form.isActived" />
                        </div>

                        <div class="col-12 q-my-sm text-center">
                            <q-btn type="submit" color="negative" label="cancelar" icon="cancel" class="q-mx-sm"
                                @click="openModal = false; modeFalse()" />

                            <q-btn type="submit" color="primary" label="guardar" icon="save" @click="save"
                                :disable="form.name == '' || form.email == '' || form.address == '' || form.zip == '' || form.phone == '' || form.account_name == '' || form.password == ''" />
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

const auth = authStore();
const props = defineProps({
    openModal: {
        type: Boolean,
        required: true
    },
    mode: {
        type: Boolean,
        required: true
    },
    getStores: {
        type: Function,
        required: true
    },
    store: {
        type: Object,
        require: false
    }
});

const openModal = ref(props.openModal);
const mode = ref(props.mode);

const form = ref({
    name: "",
    address: "",
    email: "",
    zip: "",
    phone: "",
    password: "",
    isActived: false,
    zone: null,
    img: null,
    bank_account: "",
    route_number: "",
    banking_institute: "",
    account_name: "",
    transaction_code: "",
    application: ""
});
const transaction_code = ref([
    { id: 22, name: "22 - Deposit destined for a checking account" },
    { id: 23, name: "23 - Prenotification for a cheking credit" },
    { id: 24, name: "24 - Zero dollar with remittance into Checking account" },
    { id: 27, name: "27 - Debit destined for a cheking account" },
    { id: 28, name: "28 - Prenotification for a checking debit" },
    { id: 29, name: "29 - Zero dollar with remittance into checking account" },
    { id: 32, name: "32 - Deposit destined for a savings account" },
    { id: 33, name: "33 - Prenotification for a savings credit" },
    { id: 34, name: "34 - Zero dollar with remittance into savings account" },
    { id: 37, name: "37 - Debit destined for a savings account" },
    { id: 38, name: "38 - Prenotification for a savings debit" },
    { id: 39, name: "39 - Zero dollar with remittance into savings account" },
]);
const transaction_codeSeleted = ref("");
const zones = ref([]);
const zonesFilter = ref([]);
const image = ref(null);
const modalLoading = ref(false);
const notify = ref(null);
const isPwd = ref(true);
const applications = ref([]);

watch(transaction_codeSeleted, (value) => {
    if (value !== null) {
        form.value.transaction_code = value.id;
    }
});

onMounted(() => {
    getZones();
    getApplications();
});

const getZones = async () => {
    let resp = await methodsHttp.getApi(`zones/getZonesActived`);
    if (resp.ok) {
        zones.value = resp.zones
        zonesFilter.value = resp.zones
    }
};

const getApplications = async () => {
    let resp = await methodsHttp.getApi(
        `applications/getApplications`
    );

    if (resp.ok) {
        applications.value = resp.applications
    }
};


const save = async () => {
    try {
        let resp;
        const formData = new FormData();
        modalLoading.value = true;
        if (image.value) {
            formData.append('image', image.value);
        }

        if (!mode.value) {

            resp = await methodsHttp.postApi("stores/createStore", { ...form.value, code: "STORE" });

            if (image.value) {
                await methodsHttp.putApi(
                    `stores/updateStoreImage/${resp.store._id}`,
                    formData
                );
            }

        } else {
            resp = await methodsHttp.putApi(`stores/updateStore/${props.store._id}`, { ...form.value });

            if (image.value) {
                await methodsHttp.putApi(
                    `stores/updateStoreImage/${props.store._id}`,
                    formData
                );
            }
        }

        if (!resp.ok) {
            notify.value?.showNotifyBad(resp.mensaje);
            return
        }

        closeModal();
        notify.value?.showNotifyGood(resp.mensaje);
        props.getStores();
        clear();
        modeFalse();
    } catch (error) {
        notify.value?.showNotifyBad('Error al crear tienda');
        console.error('Error en la operación save:', error);
    }
    finally {
        modalLoading.value = false;
    }
};

const updateFile = ({ target }) => {
    if (target.files[0]) {
        form.value.img = URL.createObjectURL(target.files[0]);
    }
}

const filterZones = (val, update) => {
    update(
        () => {
            if (val == '') {
                zones.value = zonesFilter.value;
            }
            else {
                const needle = val.toLowerCase();
                zones.value = zonesFilter.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1)
            }
        },

        ref => {
            if (val !== '') {
                ref.setOptionIndex(-1) // reset optionIndex in case there is something selected
                ref.moveOptionSelection(1, true) // focus the first selectable option and do not update the input-value
            }
        }
    )
};

const clear = () => {
    form.value._id = null
    form.value.name = "";
    form.value.address = "";
    form.value.email = "";
    form.value.zip = "";
    form.value.phone = "";
    form.value.password = "";
    form.value.isActived = false;
    form.value.zone = null;
    form.value.img = null;
    form.value.bank_account = "";
    form.value.route_number = "";
    form.value.banking_institute = "";
    form.value.account_name = "";
    form.value.transaction_code = "";
    form.value.application = "";
    image.value = null;
    transaction_codeSeleted.value = null;
};


// 

const emit = defineEmits(['update:openModal', 'update:mode']);

watch(() => props.store, (newVal) => {
    console.log(newVal)
    form.value = { ...newVal };
    transaction_codeSeleted.value = newVal.transaction_code;
    form.value.transaction_code = newVal.transaction_code;
});

watch(() => props.openModal, (newVal) => {
    openModal.value = newVal;
});

watch(() => props.mode, (newVal) => {
    mode.value = newVal;
});


// Emite el evento para cerrar el modal y sincroniza el estado del modal en el hijo
const closeModal = () => {
    emit('update:openModal', false);
    openModal.value = false;
};

const modeFalse = () => {
    emit('update:mode', false);
    openModal.value = false;
    clear();
};

// Observa cambios en openModal para asegurarse de que el valor en el padre también se sincronice si cambia en el hijo
watch(openModal, (newVal) => {
    emit('update:openModal', newVal);
    form.value.name = props.userData?.name;
    form.value.phone = props.userData?.phone;
    form.value.email = props.userData?.email;
    form.value.address = props.userData?.address;
    form.value.zone = props.userData?.zone
    form.value.comercial = props.userData?.comercial;
    form.value.application = props.userData?.application;
});


watch(mode, (newVal) => {
    emit('update:mode', newVal);
});
</script>