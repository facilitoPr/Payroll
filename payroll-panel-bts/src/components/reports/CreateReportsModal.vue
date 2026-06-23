<template>
    <!-- modal -->
    <div>
        <q-dialog v-model="openModal" persistent>
            <q-card style="width: 900px; max-width: 80vw">
                <div class="bg-white row justify-between q-pa-md">
                    <div class="text-white" style="font-size: 19px; font-weight: 500">
                        <div class="row items-center">
                            <div class="col-auto q-mx-sm">
                                <q-icon size="2em" name="analytics" color="primary" />
                            </div>
                            <div class="col-auto text-primary">
                                <b>{{
                                    "CREAR REPORTE"
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
                        <!-- <div class="col-12 col-md-12">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> RANGO DE FECHA
                                </b>
                            </label>
                            <q-date v-model="datesRange" range />
                        </div> -->

                        <div class="col-12 col-sm-auto col-md-auto row items-center">
                            <q-btn color="primary" label="AGREGAR" style="width: 100%; height: 40px" icon="add"
                                @click="addDate" :disable="datesRange == null" />
                        </div>

                        <div class="col-12 col-md-4">
                            <q-input outlined dense v-model="formattedDates" readonly>
                                <template v-slot:append>
                                    <q-icon name="event" class="cursor-pointer">
                                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                            <q-date v-model="datesRange" range multiple>
                                                <div class="row items-center justify-end">
                                                    <q-btn v-close-popup label="Close" color="primary" flat />
                                                </div>
                                            </q-date>
                                        </q-popup-proxy>
                                    </q-icon>
                                </template>
                            </q-input>
                        </div>

                        <div class="col-12 col-sm-3">
                            <q-select v-model="operatorSelected" label="OPERADORAS" option-label="name" outlined dense
                                color="primary" :options="props.operators">
                                <template v-slot:no-option>
                                    <q-item>
                                        <q-item-section class="text-grey">
                                            No results
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-select>
                        </div>



                        <div class="col-12 q-my-md">
                            <q-table :loading="props.tableLoading" flat dense title="RANGOS DE FECHA SELECCIONADAS"
                                row-key="_id" :rows="datesToSend" :columns="columns.columnsDates()" hide-pagination>
                                <template v-slot:body="props">
                                    <q-tr :props="props">
                                        <q-td key="name" :props="props">
                                            <q-icon name="delete" class="cursor-pointer" size="25px" color="red"
                                                :onclick="() => removeDate(props.pageIndex)" />
                                        </q-td>

                                        <q-td key="name" :props="props">
                                            {{ moment(props.row?.from).format('LL') }}
                                        </q-td>

                                        <q-td key="name" :props="props">
                                            {{ moment(props.row?.to).format('LL') }}
                                        </q-td>
                                    </q-tr>
                                </template>
                            </q-table>
                        </div>

                        <div class="col-12 q-my-sm row">
                            <span class="col-12 text-h5 text-bold q-mb-sm">Reportes</span>

                            <div class="col-6 q-my-sm" v-for="(item, index) in reminders" :key="index">
                                <q-table class="q-gutter-x-sm" :loading="props.tableLoading"
                                    :title="`${moment(item.from).format('MMMM D')} to ${moment(item.to).format('MMMM D')}`"
                                    flat dense row-key="_id" :rows="item.zones" :columns="columns.columnsDatesReports()"
                                    hide-pagination>
                                    <template v-slot:body="props">
                                        <q-tr :props="props">
                                            <q-td key="name" :props="props">
                                                {{ props.row?.zone }}
                                            </q-td>

                                            <q-td key="name" :props="props">
                                                {{ props.row?.amount }}
                                            </q-td>

                                            <q-td key="name" :props="props">
                                                {{ props.row?.average }}
                                            </q-td>
                                        </q-tr>
                                    </template>
                                </q-table>

                                <div class="text-body2 q-my-xs q-ml-md">
                                    <span class="text-bold">
                                        Total:
                                    </span>
                                    <span class="">
                                        {{ item.total }}
                                    </span>
                                </div>

                                <div class="text-body2 q-my-xs q-ml-md">
                                    <span class="text-bold">
                                        Promedio:
                                    </span>
                                    <span class="">
                                        {{ item.totalAverage }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 q-my-sm text-center">
                            <q-btn type="submit" color="negative" label="cancelar" icon="cancel" class="q-mx-sm"
                                @click="openModal = false; modeFalse()" />

                            <q-btn type="submit" color="primary" label="guardar" icon="save" @click="createReports"
                                :disable="form.name == ''" />
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
    operators: {
        type: Object,
        required: false
    }
});

const openModal = ref(props.openModal);
const mode = ref(props.mode);

const form = ref({

});
const modalLoading = ref(false);
const notify = ref(null);

// 

const datesRange = ref(null);
const datesToSend = ref([]);
const reminders = ref([]);
const operatorSelected = ref(null);
const formattedDates = ref('');

watch(datesRange, (newVal) => {
    updateDates()
});

onMounted(() => {
    updateDates();
});

// Método para actualizar las fechas formateadas
const updateDates = () => {
    if (datesRange.value?.length > 0) {
        formattedDates.value = datesRange?.value
            .map(range => formatRange(range))
            .join(' | ')  // Separar los rangos con un delimitador
    } else {
        formattedDates.value = ''
    }
}

// Función para formatear un rango de fechas usando Moment.js
const formatRange = (range) => {
    // const fromDate = moment(range.from, 'YYYY/MM/DD').format('DD/MM/YYYY')
    const fromDate = moment(range.from).format('LL')
    const toDate = moment(range.to).format('LL')

    // const toDate = moment(range.to, 'YYYY/MM/DD').format('DD/MM/YYYY')
    return `${fromDate} - ${toDate}`  // Retornar el rango en formato legible
}

const save = async () => {
    try {
        let resp;
        const formData = new FormData();
        modalLoading.value = true;

        if (!mode.value) {
            resp = await methodsHttp.postApi("stores/createStore", { ...form.value, code: "STORE" });

        } else {
            resp = await methodsHttp.putApi(`stores/updateStore/${props.store._id}`, { ...form.value });
        }

        if (!resp.ok) {
            notify.value?.showNotifyBad(resp.mensaje);
            return
        }

        closeModal();
        notify.value?.showNotifyGood(resp.mensaje);
        clear();
        // modeFalse();
    } catch (error) {
        notify.value?.showNotifyBad('Error al crear tienda');
        console.error('Error en la operación save:', error);
    }
    finally {
        modalLoading.value = false;
    }
};

const createReports = async () => {
    try {
        modalLoading.value = true;
        let resp;

        if (operatorSelected.value){
            resp = await methodsHttp.postApi("reminders/getRemindersFilterDate", { dates: datesToSend.value, user: operatorSelected.value?._id });
        } else {
            resp = await methodsHttp.postApi("reminders/getRemindersFilterDate", { dates: datesToSend.value, user: "null" });
        }

        if (!resp.ok) {
            notify.value?.showNotifyBad(resp.mensaje);
            return
        }

        // closeModal();
        reminders.value = resp.reports
        notify.value?.showNotifyGood(resp.mensaje);
        // clear();
        // modeFalse();
    } catch (error) {
        notify.value?.showNotifyBad('Error al crear tienda');
        console.error('Error en la operación save:', error);
    }
    finally {
        modalLoading.value = false;
    }
}

const clear = () => {
};

const addDate = () => {
    datesToSend.value = [...datesToSend.value, ...datesRange.value]
    datesRange.value = null
}

const removeDate = (index) => {
    datesToSend.value = datesToSend.value.filter((item, itemIndex) => index != itemIndex)
    // console.log(index)
}


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
});

</script>