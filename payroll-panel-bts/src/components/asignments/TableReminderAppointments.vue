<template>
    <div class="bg-white">
        <!-- table -->
        <div>
            <q-table :loading="props.tableLoading" flat dense row-key="_id" :rows="props.rows"
                :columns="columns.columnsRemindersAppointments()" bordered>
                <template v-slot:body="props">
                    <q-tr :props="props">

                        <q-td key="name" :props="props" style="cursor: pointer;" @click="openDetailsModal(props.row)">
                            {{ props.row?.comercial?.MemberFullname }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row?.user?.name }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row?.hour }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row?.zone?.name }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row?.reminderType?.name }}
                        </q-td>

                        <!-- <q-td key="name" :props="props">
                            <q-select v-model="props.row.status" :options="statusOptions" option-label="name"
                                option-value="_id"
                                @update:model-value="(item) => changeStatus(props.row._id, item, true)" dense outlined
                                :style="getBackgroundColor(props.row.status)" :disabled="true" />
                        </q-td> -->

                        <!-- <q-td key="name" :props="props">
                            <q-select v-model="props.row.statusCompleted" :options="statusOptionsCompleted"
                                option-label="name" option-value="_id"
                                @update:model-value="(item) => changeStatus(props.row._id, item, false)" dense outlined
                                :disabled="true" />
                        </q-td> -->

                        <!-- <q-td key="name" :props="props">
                            <div v-if="props.row?.note" style="max-height: 50px; overflow: hidden;">
                                <div v-html="limitHtmlContent(props.row.note, 20)"></div>
                            </div>
                        </q-td> -->
                    </q-tr>
                </template>
            </q-table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from "vue";
import methodsHttp from "src/api/methodsHttp";
import columns from "src/components/utils/columns";
import ImagenVue from "src/components/utils/Imagen.vue"

const notify = ref(null);
const statusOptions = ref([]);
const statusOptionsCompleted = ref([]);
const openModalUser = ref(false);
const userData = ref(null);

const props = defineProps({
    rows: {
        type: Array,
        required: true
    },
    tableLoading: {
        type: Boolean,
        required: true
    }
});

onMounted(() => {
    getStatus();
});

const limitHtmlContent = (html, limit) => {
    // Crear un contenedor temporal para eliminar las etiquetas HTML y obtener texto puro
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    // Limitar el contenido al número de caracteres especificado
    return plainText.length > limit ? plainText.substring(0, limit) + '...' : plainText;
};

const openDetailsModal = (props) => {
    openModalUser.value = true;
    userData.value = { ...props.patient, comercial: props?.comercial?._id };
};

const getBackgroundColor = (status) => {
    switch (status?.code) {
        case 'NOTCONFIRMED':
            return { backgroundColor: '#e0e0e0' }; // Gris claro
        case 'NOTCONTACTED':
            return { backgroundColor: '#616161' }; // Gris oscuro
        case 'CONFIRMED':
            return { backgroundColor: '#d4edda' }; // Verde claro
        default:
            return { backgroundColor: '#ffffff' }; // Blanco por defecto
    }
};

const getStatus = async () => {
    const resp = await methodsHttp.getApi(`status/getReminderStatus`);
    if (resp.ok) {
        statusOptions.value = resp.status
        statusOptionsCompleted.value = resp.statusCompleted
    }
};

const changeStatus = async (id, item, isStatus) => {
    try {
        console.log(item)
        props.tableLoading = true;
        const resp = await methodsHttp.putApi(`reminders/updateReminder/${id}`, { code: item?.code, isStatus });

        if (resp?.ok) {
            notify.value?.showNotifyGood("Cita actualizada correctamente");
            // props.getComercial();
        } else {
            notify.value?.showNotifyBad(resp?.mensaje || 'Error desconocido');
        }
    } catch (error) {
        notify.value?.showNotifyBad('Error al cambiar estado');
        console.error('Error en la operación save:', error);
    }
    finally {
        props.tableLoading = false;
    }
};

</script>
