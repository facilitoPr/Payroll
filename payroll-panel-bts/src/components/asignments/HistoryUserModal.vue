<template>
    <q-dialog v-model="modalOpen" persistent>
        <q-card style="width: 700px; max-width: 80vw">
            <q-inner-loading :showing="isLoading" label="Enviando..." label-class="text-blue-11"
                label-style="font-size: 1.1em" />
            <div class="bg-white row justify-between q-pa-md">
                <div class="text-primary" style="font-size: 19px; font-weight: 500">
                    <div class="row items-center">
                        <div class="col-auto q-mx-sm">
                            <q-icon size="2em" name="people" color="primary" />
                        </div>
                        <div class="col-auto text-primary">
                            <b>HISTORIAL DE USUARIOS</b>
                        </div>
                    </div>
                </div>
                <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer" @click="closeModal">
                    cancel
                </span>
            </div>

            <q-card-section class="q-pt-sm">
                <q-table :loading="props.tableLoading" flat dense row-key="_id" :rows="props.historyRows"
                    :columns="columns.columnsHistoryUser()" hide-pagination :rows-per-page-options="[10]">
                    <template v-slot:body="props">
                        <q-tr :props="props">
                            <q-td key="image" :props="props">
                                <ImagenVue :img="props.row?.patient?.img
                                    ? props.row?.patient?.img
                                    : 'https://plus-nautic.nyc3.digitaloceanspaces.com/paciente.png'
                                    " style="cursor: pointer; width: 50px; height: 50px; overflow:hidden" />
                            </q-td>

                            <q-td key="name" :props="props" style="cursor: pointer;"
                                @click="openDetailsModal(props.row)">
                                {{ props.row?.patient?.name }}
                            </q-td>

                            <q-td key="name" :props="props">
                                {{ props.row?.memberIdentificationNumber }}
                            </q-td>
                        </q-tr>
                    </template>
                </q-table>
            </q-card-section>
        </q-card>
    </q-dialog>

    <CreateUserModal :v-model="openModalUser" :openModal="openModalUser" :userData="userData"
        @update:openModal="openModalUser = $event" :readOnly="true"/>
    <NotificationsVue ref="notify" />
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import CreateUserModal from "./CreateUserModal.vue"
import { defineProps, defineEmits, ref, watch, onMounted } from 'vue';

const notify = ref(null);

const props = defineProps({
    openModal: {
        type: Boolean,
        required: true
    },
    historyRows: {
        type: Object,
        required: true
    }
});

const isLoading = ref(false);
const openModalUser = ref(false);
const userData = ref(null);

const openDetailsModal = (data) => {
    openModalUser.value = true;
    userData.value = { ...data?.patient };
};


const emit = defineEmits(['update:openModal']); // Agregar 'createdUser' al definir los eventos
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
    emit('update:openModal', newVal);
});


</script>
