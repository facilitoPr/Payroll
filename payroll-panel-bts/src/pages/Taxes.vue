<template>
    <div class="bg-white" style="border-radius: 15px; padding: 10px;">
        <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-auto col-md-auto row items-center">
                <q-btn color="primary" label="CREATE TAX" style="width: 100%; height: 40px" icon="people"
                    @click="createDepartments" />
            </div>

            <div class="col-12 col-sm-6" v-if="auth.user.rol.code == 'ADMIN'">
                <q-select v-model="storeSelected" label="TAXES" option-label="name" outlined dense color="primary"
                    :options="stores">
                    <template v-slot:no-option>
                        <q-item>
                            <q-item-section class="text-grey">
                                No results
                            </q-item-section>
                        </q-item>
                    </template>
                </q-select>
            </div>
        </div>

        <div class="q-my-md">
            <q-separator />
        </div>

        <!-- table -->
        <div>
            <q-table :loading="tableLoading" :rows="rows"
                :columns="auth.user.rol.code == 'STORE' ? columns.columnTaxes() : columns.columnTaxesAdmin()"
                title="TAXES" row-key="name" :bordered="false" flat dense hide-pagination>
                <template v-slot:body="props">
                    <q-tr :props="props">

                        <q-td v-if="auth.user.rol.code == 'ADMIN'" key="name" :props="props">
                            {{ props.row?.store?.name }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row.stateTax }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row.municipalTax }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row.transationFee }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row.processingFee }}
                        </q-td>

                        <q-td key="name" :props="props">
                            <div v-if="props.row.isActiveStateTax">
                                YES
                            </div>
                            <div v-else>
                                NO
                            </div>
                        </q-td>

                        <q-td key="name" :props="props">
                            <div v-if="props.row.isActiveMunicipalTax">
                                YES
                            </div>
                            <div v-else>
                                NO
                            </div>
                        </q-td>

                        <q-td key="name" :props="props">
                            <div v-if="props.row.isActiveTransationFee">
                                YES
                            </div>
                            <div v-else>
                                NO
                            </div>
                        </q-td>

                        <q-td key="name" :props="props" >
                            <div v-if="props.row.isActiveProcessingFee">
                                YES
                            </div>
                            <div v-else>
                                NO
                            </div>
                        </q-td>

                        <q-td key="name" :props="props" @click="auth.user.rol.code == 'ADMIN' && updateState(props.row)">
                            <div v-if="props.row.isDisabled">
                                <q-badge color="negative" label="INACTIVE" style="cursor: pointer" />
                            </div>
                            <div v-else>
                                <q-badge color="secondary" label="ACTIVE" style="cursor: pointer" />
                            </div>
                        </q-td>

                        <q-td key="name" :props="props" v-if="auth.user.rol.code == 'ADMIN'">
                            <q-icon name="menu" color="primary" size="25px" style="cursor: pointer">
                                <q-menu transition-show="flip-right" transition-hide="flip-left">
                                    <!-- editar -->
                                    <q-list style="min-width: 100px" @click="openModalEdit(props.row)">
                                        <q-item clickable class="row items-center">
                                            <div class="col-auto">
                                                <q-icon name="edit" color="primary" size="25px" />
                                            </div>
                                            <div class="q-px-sm col-auto">EDITAR</div>
                                        </q-item>
                                    </q-list>
                                    <!-- eliminar -->
                                    <q-list style="min-width: 100px" @click="openModalDelete(props.row)">
                                        <q-item clickable class="row items-center">
                                            <div class="col-auto">
                                                <q-icon name="delete" color="negative" size="25px" />
                                            </div>
                                            <div class="q-px-sm col-auto">ELIMINAR</div>
                                        </q-item>
                                    </q-list>
                                    <!-- imagen -->
                                </q-menu>
                            </q-icon>
                            <!-- <q-btn dense icon="menu"> </q-btn> -->
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
        </div>

        <!-- modal -->
        <div>
            <q-dialog v-model="openModal" persistent>
                <q-card style="width: 500px; max-width: 80vw">
                    <div class="bg-white row justify-between q-pa-md">
                        <div class="text-white" style="font-size: 19px; font-weight: 500">
                            <div class="row items-center">
                                <div class="col-auto q-mx-sm">
                                    <q-icon size="2em" name="people" color="primary" />
                                </div>
                                <div class="col-auto text-primary">
                                    <b>{{
                                        mode
                                            ? "EDIT TAX"
                                            : "CREATE TAX"
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
                            <div v-if="auth.user.rol.code == 'ADMIN' && mode == false" class="col-12 col-md-12">
                                <label>
                                    <b>
                                        <b class="text-negative">* </b> STORE
                                    </b>
                                </label>
                                <q-select v-model="form.store" use-input label="STORE" option-value="_id"
                                    option-label="name" outlined dense color="primary" :options="stores" emit-value
                                    map-options>
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
                                        <b class="text-negative">* </b> STATE TAX
                                    </b>
                                </label>
                                <q-input outlined dense color="primary" v-model="form.stateTax">
                                </q-input>
                            </div>

                            <div class="col-12 col-md-6">
                                <label>
                                    <b>
                                        <b class="text-negative">* </b>
                                        <!-- <b v-if="auth.user.Country.isoCode == 'DO'"> ITEBIS </b> -->
                                        <b> MUNICIPAL TAX STATUS</b>
                                    </b>
                                </label>
                                <q-input outlined dense color="primary" v-model="form.municipalTax">
                                </q-input>
                            </div>

                            <div class="col-12 col-md-6">
                                <label>
                                    <b>
                                        <b class="text-negative">* </b> TRASANCTION FEE
                                    </b>
                                </label>
                                <q-input outlined dense color="primary" v-model="form.transationFee">
                                </q-input>
                            </div>

                            <div class="col-12 col-md-6">
                                <label>
                                    <b>
                                        <b class="text-negative">* </b> PROCESSING FEE
                                    </b>
                                </label>
                                <q-input outlined dense color="primary" v-model="form.processingFee">
                                </q-input>
                            </div>

                            <div class="col-12 col-md-6">
                                <label>
                                    <b> STATE TAX STATUS</b>
                                </label>
                                <q-checkbox v-model="form.isActiveStateTax" />
                            </div>

                            <div class="col-12 col-md-6">
                                <label>
                                    <!-- <b v-if="auth.user.Country.isoCode == 'DO'"> ITEBIS </b> -->
                                    <b> MUNICIPAL TAX STATUS</b>
                                </label>
                                <q-checkbox v-model="form.isActiveMunicipalTax" />
                            </div>

                            <div class="col-12 col-md-6">
                                <label>
                                    <b> TRASANCTION FEE STATUS</b>
                                </label>
                                <q-checkbox v-model="form.isActiveTransationFee" />
                            </div>

                            <div class="col-12 col-md-6">
                                <label>
                                    <b> PROCESSING FEE STATUS</b>
                                </label>
                                <q-checkbox v-model="form.isActiveProcessingFee" />
                            </div>

                            <div class="col-12 q-my-sm text-center">
                                <q-btn type="submit" color="negative" label="cancelar" icon="cancel" class="q-mx-sm"
                                    @click="openModal = false" />

                                <q-btn type="submit" color="primary" label="guardar" icon="save" @click="save"
                                    :disable="form.stateTax == '' || form.municipalTax == '' || form.transationFee == '' || form.processingFee == ''" />
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </q-dialog>
        </div>

        <NotificationsVue ref="notify" />
        <Delete ref="deleteInfo" @deleteGood="getTaxes" />
    </div>
</template>
<script setup>
import { onMounted, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import columns from "src/components/utils/columns";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Delete from "src/components/utils/Delete.vue";
import { authStore } from "src/stores/auth-store";

const limit = ref(10);
const initial = ref(0);
const productQuantity = ref(1);
const auth = authStore();
const isPwd = ref(true);
const notify = ref();
const deleteInfo = ref();
const stores = ref([]);
const storesFilter = ref([]);

const storeSelected = ref(null);

const id = ref(null);
const rows = ref([]);
const TableFilter = ref([]);

const openModal = ref(false);
const mode = ref(false);
const form = ref({
    stateTax: "",
    municipalTax: "",
    transationFee: "",
    processingFee: "",
    store: auth.user.rol.code == 'STORE' ? auth.user._id : "",
    isActiveStateTax: false,
    isActiveMunicipalTax: false,
    isActiveTransationFee: false,
    isActiveProcessingFee: false
});
const tableLoading = ref(false);

onMounted(() => {
    getTaxes();

    if (auth.user.rol.code == 'ADMIN') {
        getAllStore();
    }
});

watch(storeSelected, async (value) => {
    if (storeSelected.value) {
        getCategoriesByStore(value._id);
    }
});


const getCategoriesByStore = async (id) => {
    tableLoading.value = true;
    const urlStore = `stores/getStoreTaxesByStore/${id}/${limit.value}/${initial.value}`;
    let resp = await methodsHttp.getApi(urlStore);
    if (resp.ok) {
        rows.value = resp.storeTaxes;
        TableFilter.value = resp.storeTaxes;
    }
    tableLoading.value = false;
};


const getTaxes = async () => {
    tableLoading.value = true;

    const url = `stores/getStoreTaxesPanel/null/${limit.value}/${initial.value}`
    // const urlAdmin = `stores/getAllTaxesAdmin/${limit.value}/${initial.value}`

    let resp = await methodsHttp.getApi(url);

    if (resp.ok) {
        rows.value = resp.storeTaxes;
        TableFilter.value = resp.storeTaxes;
        productQuantity.value = Math.ceil(resp.count / 10)

    }
    tableLoading.value = false;
};

const clear = () => {
    form.value.stateTax = "";
    form.value.municipalTax = "";
    form.value.transationFee = "";
    form.value.processingFee = "";
    form.value.isActiveStateTax = false;
    form.value.isActiveMunicipalTax = false;
    form.value.isActiveTransationFee = false;
    form.value.isActiveProcessingFee = false;
    form.value.store = auth.user.rol.code == 'STORE' ? auth.user._id : "";

};

const updateState = async (item) => {
    tableLoading.value = true;
    let resp = await methodsHttp.putApi(
        `stores/updateStoreTaxes/${item._id}`,
        { isDisabled: !item.isDisabled }
    );
    if (resp.ok) {
        openModal.value = false;
        notify.value?.showNotifyGood(resp.mensaje);
        getTaxes();
        clear();
    } else {
        notify.value?.showNotifyBad(resp.mensaje);
    }
    tableLoading.value = false;
};


const openModalEdit = (item) => {
    form.value.stateTax = item.stateTax;
    form.value.municipalTax = item.municipalTax;
    form.value.transationFee = item.transationFee;
    form.value.processingFee = item.processingFee;
    form.value.isActiveStateTax = item.isActiveStateTax;
    form.value.isActiveMunicipalTax = item.isActiveMunicipalTax;
    form.value.isActiveTransationFee = item.isActiveTransationFee;
    form.value.isActiveProcessingFee = item.isActiveProcessingFee;
    form.value.store = item.store;

    mode.value = true;
    openModal.value = true;
    id.value = item._id;
};

const createDepartments = () => {
    clear();
    mode.value = false;
    openModal.value = true;
};

const openModalDelete = (item) => {
    const data = {
        id: item._id,
        ruta: `stores/deleteStoreTaxes`,
    };

    deleteInfo.value?.openDelete(data);
};

const save = async () => {
    if (!mode.value) {
        console.log(form.value)
        let resp = await methodsHttp.postApi(
            "stores/createStoreTaxes",
            form.value
        );
        if (resp.ok) {
            openModal.value = false;
            notify.value?.showNotifyGood(resp.mensaje);
            getTaxes();
        } else {
            notify.value?.showNotifyBad(resp.mensaje);
        }
    } else {

        console.log(form.value)
        let resp = await methodsHttp.putApi(
            `stores/updateStoreTaxes/${id.value}`,
            form.value
        );

        if (resp.ok) {
            openModal.value = false;
            notify.value?.showNotifyGood(resp.mensaje);
            getTaxes();
        } else {
            notify.value?.showNotifyBad(resp.mensaje);
        }
    }
};

const getAllStore = async () => {
    let resp = await methodsHttp.getApi(`stores/getAllStore`);
    if (resp.ok) {
        stores.value = resp.stores;
        storesFilter.value = resp.stores;
    }
};

const filterStores = (val, update) => {
    update(
        () => {
            if (val == '') {
                stores.value = storesFilter.value;
            }
            else {
                const needle = val.toLowerCase();
                stores.value = storesFilter.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1)
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

</script>
