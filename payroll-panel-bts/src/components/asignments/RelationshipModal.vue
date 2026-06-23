<template>
    <q-dialog v-model="modalOpen" persistent>
        <q-card style="width: 100%; max-width: 100vw">

            <div class="bg-white row justify-between q-pa-md">
                <div class="text-primary" style="font-size: 19px; font-weight: 500">
                    <div class="row items-center">
                        <div class="col-auto q-mx-sm">
                            <q-icon size="2em" name="task" color="primary" />
                        </div>
                        <div class="col-auto text-primary">
                            <b>RELACIONES</b>
                        </div>
                    </div>
                </div>
                <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer"
                    @click="closeModal();">
                    cancel
                </span>
            </div>

            <q-card-section class="q-pt-sm">
                <TableRelationship :rows="comercials" :tableLoading="tableLoading"
                    :addOrRemoveMembersToComercialRelationship="addOrRemoveMembersToComercialRelationship"
                    :createOrGetComercialRelationship="createOrGetComercialRelationship"
                    :comercialRelationship="comercialRelationship" :comercialData="comercialData" />
            </q-card-section>

            <q-inner-loading :showing="isLoading" label="Enviando..." label-class="text-blue-11"
                label-style="font-size: 1.1em" />
        </q-card>
    </q-dialog>

    <NotificationsVue ref="notify" />
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import TableRelationship from "src/components/asignments/TableRelationship.vue"
import NotificationsVue from "src/components/utils/Notifications.vue";
import { defineProps, defineEmits, ref, watch, onMounted } from 'vue';

const props = defineProps({
    openModal: {
        type: Boolean,
        required: true
    },
    comercial: {
        type: Object,
        required: true
    }
});

const isLoading = ref(false);
const comercials = ref([]);
const comercialRelationship = ref(null)
const tableLoading = ref(false);
const orderQuantity = ref(1);
const notify = ref(null);
const comercialData = ref(null)

// onMounted(() => {
//     getComercialByPhoneNumber();
// });

watch(() => props.comercial, (newComercial) => {
    if (newComercial) {
        // getComercialByPhoneNumber();
        comercialData.value = newComercial
        createOrGetComercialRelationship(newComercial);
    }
}, { immediate: true });

const getComercialByPhoneNumber = async () => {
    tableLoading.value = true;
    let resp = await methodsHttp.getApi(
        `comercial/getComercialByPhoneNumber/10/0/${props.comercial?.HomePhone ? props.comercial?.HomePhone : "null"}/${props.comercial?.AlternatePhone ? props.comercial?.AlternatePhone : "null"}/${props.comercial?.memberIdentificationNumber}`
    );

    if (resp.ok) {
        comercials.value = resp.comercials
        orderQuantity.value = Math.ceil(resp.count / 10)
    }
    tableLoading.value = false;
};

const createOrGetComercialRelationship = async (comercial) => {
    // tableLoading.value = true;
    const data = { _id: comercial._id }
    let resp = await methodsHttp.postApi(`comercial/createOrGetComercialRelationship/${props.comercial?.HomePhone ? props.comercial?.HomePhone : "null"}/${props.comercial?.AlternatePhone ? props.comercial?.AlternatePhone : "null"}/${props.comercial?.memberIdentificationNumber}`, data);

    if (resp.ok) {
        comercialRelationship.value = resp.comercialRelationship
        if(resp.comercials) {
            comercials.value = resp.comercials
        } else {
            comercials.value = []
        }
        orderQuantity.value = Math.ceil(resp.count / 10)
    }
    // tableLoading.value = false;
};

const addOrRemoveMembersToComercialRelationship = async (newMember) => {
    isLoading.value = true;
    const data = { member: newMember._id }
    let resp = await methodsHttp.postApi(`comercial/addOrRemoveMembersToComercialRelationship/${comercialRelationship.value?._id}`, data);

    if (resp.ok) {
        comercialRelationship.value = resp.comercialRelationship
        notify.value?.showNotifyGood(resp.mensaje);
    } else {
        notify.value?.showNotifyBad(resp?.mensaje || 'Error desconocido');
    }
    isLoading.value = false;
};

// 

const emit = defineEmits(['update:openModal']);
const modalOpen = ref(props.openModal);

// Sincroniza el modal abierto con el valor que viene del padre
watch(() => props.openModal, (newVal) => {
    modalOpen.value = newVal;
});

// Emite el evento para cerrar el modal y sincroniza el estado del modal en el hijo
const closeModal = () => {
    emit('update:openModal', false);
    modalOpen.value = false;
};

// Observa cambios en modalOpen para asegurarse de que el valor en el padre también se sincronice si cambia en el hijo
watch(modalOpen, (newVal) => {
    createOrGetComercialRelationship(props.comercial);
    emit('update:openModal', newVal);
});

</script>
