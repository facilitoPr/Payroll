<template>
    <div class="bg-white" style="border-radius: 15px; padding: 10px;">
        <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-auto col-md-auto row items-center">
                <q-btn color="primary" label="CREATE DRIVER" style="width: 100%; height: 40px" icon="people"
                    @click="createDepartments" />
            </div>

            <div class="col-12 col-sm-6" v-if="auth.user.rol.code == 'ADMIN'">
                <q-select v-model="storeSelected" label="STORES" option-label="name" outlined dense color="primary"
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

        <!-- Tabs Store -->
        <div v-if="auth.user?.rol?.code === 'STORE'" class="q-my-md">

            <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary"
                align="justify" narrow-indicator>
                <q-tab name="DRIVERS" label="DRIVERS" />
                <q-tab name="REQUEST" label="DRIVERS REQUEST" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="tab" animated>
                <q-tab-panel name="DRIVERS">
                    <div>
                        <q-table :loading="tableLoading" :rows="rows" :columns="auth.user.rol.code == 'STORE' ?
                            columns.columnsDrivers() : columns.columnsDriversAdmin()" row-key="name" :bordered="false"
                            flat dense hide-pagination>
                            <template v-slot:body="props">
                                <q-tr :props="props">
                                    <q-td key="name" :props="props">
                                        <ImagenVue :img="props.row.img
                                            ? props.row.img
                                            : 'https://plus-nautic.nyc3.digitaloceanspaces.com/another-files/condominio.png'
                                            " style="cursor: pointer; width: 50px; height: 50px; overflow:hidden" />
                                    </q-td>

                                    <q-td v-if="auth.user.rol.code == 'ADMIN'" key="name" :props="props">
                                        {{ props.row.store_name }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ props.row.name }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ props.row.email }}
                                    </q-td>
                                    <q-td key="name" :props="props" @click="updateState(props.row)">
                                        <div v-if="props.row.isActived">
                                            <q-badge color="secondary" label="ACTIVE" style="cursor: pointer" />
                                        </div>
                                        <div v-else>
                                            <q-badge color="negative" label="INACTIVE" style="cursor: pointer" />
                                        </div>
                                    </q-td>

                                    <q-td key="name" :props="props">
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
                </q-tab-panel>
                <q-tab-panel name="REQUEST">
                    <div>
                        <q-table :loading="tableLoading" :rows="rowsRequest" :columns="columns.columnsDriversRequest()"
                            row-key="name" :bordered="false" flat dense hide-pagination>
                            <template v-slot:body="props">
                                <q-tr :props="props">
                                    <q-td key="name" :props="props">
                                        <ImagenVue :img="props.row.img
                                            ? props.row.img
                                            : 'https://plus-nautic.nyc3.digitaloceanspaces.com/another-files/condominio.png'
                                            " style="cursor: pointer; width: 50px; height: 50px; overflow:hidden" />
                                    </q-td>

                                    <q-td v-if="auth.user.rol.code == 'ADMIN'" key="name" :props="props">
                                        {{ props.row.store_name }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ props.row.name }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ props.row.email }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        <q-icon name="menu" color="primary" size="25px" style="cursor: pointer">
                                            <q-menu transition-show="flip-right" transition-hide="flip-left">
                                                <!-- editar -->
                                                <q-list style="min-width: 100px"
                                                    @click="openModalAcceptFunct(props.row)">
                                                    <q-item clickable class="row items-center">
                                                        <div class="col-auto">
                                                            <q-icon name="check" color="primary" size="25px" />
                                                        </div>
                                                        <div class="q-px-sm col-auto">ACEPTAR</div>
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
                </q-tab-panel>
            </q-tab-panels>
        </div>

        <!-- Admin table -->
        <div v-if="auth.user?.rol?.code === 'ADMIN'" class="q-my-md">
            <div>
                <q-table :loading="tableLoading" :rows="rows" :columns="auth.user.rol.code == 'STORE' ?
                    columns.columnsDrivers() : columns.columnsDriversAdmin()" row-key="name" :bordered="false" flat
                    dense hide-pagination>
                    <template v-slot:body="props">
                        <q-tr :props="props">
                            <q-td key="name" :props="props">
                                <ImagenVue :img="props.row.img
                                    ? props.row.img
                                    : 'https://plus-nautic.nyc3.digitaloceanspaces.com/another-files/condominio.png'
                                    " style="cursor: pointer; width: 50px; height: 50px; overflow:hidden" />
                            </q-td>

                            <q-td v-if="auth.user.rol.code == 'ADMIN'" key="name" :props="props">
                                {{ props.row.store_name }}
                            </q-td>

                            <q-td key="name" :props="props">
                                {{ props.row.name }}
                            </q-td>

                            <q-td key="name" :props="props">
                                {{ props.row.email }}
                            </q-td>
                            <q-td key="name" :props="props" @click="updateState(props.row)">
                                <div v-if="props.row.isActived">
                                    <q-badge color="secondary" label="ACTIVE" style="cursor: pointer" />
                                </div>
                                <div v-else>
                                    <q-badge color="negative" label="INACTIVE" style="cursor: pointer" />
                                </div>
                            </q-td>

                            <q-td key="name" :props="props">
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
        </div>

        <!-- Modal -->
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
                                            ? "EDIT DRIVER"
                                            : "CREATE DRIVER"
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
                            <div v-if="auth.user.rol.code == 'ADMIN'" class="col-12 col-md-12">
                                <label>
                                    <b>
                                        <b class="text-negative">* </b> STORE
                                    </b>
                                </label>
                                <q-select v-model="form.store_id" use-input label="STORE" option-value="id"
                                    option-label="name" outlined dense color="primary" :options="stores" emit-value
                                    map-options @filter="filterStores">
                                    <template v-slot:no-option>
                                        <q-item>
                                            <q-item-section class="text-grey">
                                                No results
                                            </q-item-section>
                                        </q-item>
                                    </template>
                                </q-select>
                            </div>

                            <div class="col-12 col-md-12">
                                <label>
                                    <b>
                                        <b class="text-negative">* </b> NAME
                                    </b>
                                </label>
                                <q-input outlined dense color="primary" v-model="form.name">
                                </q-input>
                            </div>

                            <div class="col-12 col-md-12">
                                <label>
                                    <b>
                                        <b class="text-negative">* </b> EMAIL
                                    </b>
                                </label>
                                <q-input outlined dense color="primary" v-model="form.email">
                                </q-input>
                            </div>

                            <div class="col-12 col-md-12" v-if="!modo">
                                <label>
                                    <b> <b class="text-negative">*</b> PASSWORD</b>
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
                                    <b> <b class="text-negative">* </b> ACTIVE </b>
                                </label>
                                <q-checkbox v-model="form.isActived" />
                            </div>

                            <div class="col-12 q-my-sm text-center">
                                <q-btn type="submit" color="negative" label="cancelar" icon="cancel" class="q-mx-sm"
                                    @click="openModal = false" />

                                <q-btn type="submit" color="primary" label="guardar" icon="save" @click="save"
                                    :disable="form.name == '' || form.description == '' || form.amount == '' || form.price == '' || form.storeCategory_id == ''" />
                            </div>
                        </div>
                    </q-card-section>

                    <q-inner-loading :showing="modalLoading" label="Please wait..." label-class="text-blue-11"
                        label-style="font-size: 1.1em" />
                </q-card>
            </q-dialog>
        </div>

        <!-- Modal accept -->
        <div>
            <q-dialog v-model="openModalAccept">
                <q-card class="" style="width: 400px">

                    <div class="q-my-xl">
                        <div class="text-center">

                            <!-- <q-img src="https://adoscrila.nyc3.cdn.digitaloceanspaces.com/delete.gif" width="250px" /> -->
                            <q-icon name="local_shipping" color="primary" size="150px" />


                        </div>
                        <div class="text-center text-h6 q-mb-sm">ARE YOU SURE YOU</div>
                        <div class="text-center text-h6">WANT TO ACCEPT THIS DRIVER?</div>
                    </div>

                    <div class="row q-col-gutter-sm justify-center q-mb-md q-mt-xl">
                        <div class="col-auto">
                            <q-btn type="submit" color="negative" label="Cancelar" icon="cancel"
                                style="width: 100%; height: 30px" @click="openModalAccept = false" />
                        </div>
                        <div class="col-auto">
                            <q-btn color="primary" label=" Aceptar" style="width: 100%; height: 30px" icon="check"
                                @click="acceptDriver" />
                        </div>
                    </div>
                </q-card>
            </q-dialog>
        </div>

        <NotificationsVue ref="notify" />
        <Delete ref="deleteInfo" @deleteGood="getDrivers" />
    </div>
</template>
<script setup>
import { onMounted, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import columns from "src/components/utils/columns";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Delete from "src/components/utils/Delete.vue";
import ModifiText from "src/components/utils/modifiText";

import ImagenVue from "src/components/utils/Imagen.vue"
import { useRouter } from "vue-router";
import { authStore } from "src/stores/auth-store";

const tab = ref("DRIVERS");
const limit = ref(10);
const initial = ref(0);
const productQuantity = ref(1);
const auth = authStore();
const isPwd = ref(true);
const notify = ref();
const deleteInfo = ref();
const stores = ref([]);
const storeSelected = ref(null);
const storesFilter = ref([]);

const id = ref(null);
const rows = ref([]);

const rowsRequest = ref([]);

const modalLoading = ref(false);
const image = ref(null);

const openModal = ref(false);
const openModalAccept = ref(ref);
const mode = ref(false);
const text = ref("");
const form = ref({
    name: "",
    email: "",
    password: "",
    isActived: true,
    store: auth.user.rol.code == 'STORE' ? auth.user._id : "",
    img: null
});
const tableLoading = ref(false);

watch(tab, () => {
    getDrivers();
    // getAllStore();
});

onMounted(() => {
    getDrivers();
    if (auth.user.rol.code == 'STORE') {
        getDriversRequest();
    }
    if (auth.user.rol.code == 'ADMIN') {
        getAllStore();
    }
});

watch(storeSelected, async (value) => {
    if (storeSelected.value) {
        getCategoriesByStore(value.id);
    }
});

const updateFile = ({ target }) => {
    console.log(target.files[0])
    if (target.files[0]) {
        form.value.img = URL.createObjectURL(target.files[0]);
    }
}

const getCategoriesByStore = async (id) => {
    tableLoading.value = true;
    const urlStore = `stores/getDriverByStoreId/${id}/${limit.value}/${initial.value}`;
    let resp = await methodsHttp.getApi(urlStore);
    if (resp.ok) {
        rows.value = resp.storeDriver;
    }
    tableLoading.value = false;
};


const getDrivers = async () => {
    tableLoading.value = true;

    const url = `stores/getDriverByStoreId/null/${limit.value}/${initial.value}`

    let resp = await methodsHttp.getApi(url);

    if (resp.ok) {
        rows.value = resp.storeDriver;
        productQuantity.value = Math.ceil(resp.count / 10)

    }
    tableLoading.value = false;
};


const getDriversRequest = async () => {
    tableLoading.value = true;

    const urlStore = `stores/getDriverRequestsByStore/${limit.value}/${initial.value}`

    let resp = await methodsHttp.getApi(urlStore);

    if (resp.ok) {
        rowsRequest.value = resp.storeDriver;
        productQuantity.value = Math.ceil(resp.count / 10)
    }
    tableLoading.value = false;
};


const clear = () => {
    form.value.name = "";
    form.value.email = "";
    form.value.password = "";
    form.value.isActived = true;
    form.value.img = "";
    image.value = "";
};

const updateState = async (item) => {
    tableLoading.value = true;
    let resp = await methodsHttp.putApi(
        `stores/updateDriverStore/${item._id}`,
        { isActived: !item.isActived }
    );
    if (resp.ok) {
        openModal.value = false;
        notify.value?.showNotifyGood(resp.mensaje);
        getDrivers();
        clear();
    } else {
        notify.value?.showNotifyBad(resp.mensaje);
    }
    tableLoading.value = false;
};

const acceptDriver = async () => {
    tableLoading.value = true;
    let resp = await methodsHttp.putApi(
        `stores/updateDriverStore/${id.value}`,
        { isAccepted: true }
    );
    if (resp.ok) {
        openModalAccept.value = false;
        notify.value?.showNotifyGood(resp.mensaje);
        getDriversRequest();
        clear();
    } else {
        notify.value?.showNotifyBad(resp.mensaje);
    }
    tableLoading.value = false;
};


const openModalEdit = (item) => {
    form.value.name = item.name;
    form.value.email = item.email;
    // form.value.password = item.password;
    form.value.img = item.img;
    form.value.isActived = item.isActived;
    mode.value = true;
    openModal.value = true;
    id.value = item._id;
};

const openModalAcceptFunct = (item) => {
    openModalAccept.value = true;
    id.value = item._id;
}

const createDepartments = () => {
    clear();
    mode.value = false;
    openModal.value = true;
};

const openModalDelete = (item) => {
    const data = {
        id: item._id,
        ruta: `stores/deleteDriverStore`,
    };

    deleteInfo.value?.openDelete(data);
};

const save = async () => {
    try {
        const formData = new FormData();
        formData.append('image', image.value);
        modalLoading.value = true;

        if (!mode.value) {
            let resp = await methodsHttp.postApi(
                "stores/createStoreDriver",
                { ...form.value, isAccepted: true }
            );

            if (resp.ok) {
                if (image.value) {
                    await methodsHttp.putApi(
                        `stores/updateDriverImage/${resp?.storeDriver._id}`,
                        formData
                    );
                }

                openModal.value = false;
                notify.value?.showNotifyGood(resp.mensaje);
                getDrivers();
                clear();
            } else {
                notify.value?.showNotifyBad(resp.mensaje);
            }
        } else {
            let resp = await methodsHttp.putApi(
                `stores/updateDriverStore/${id.value}`,
                form.value
            );

            if (resp.ok) {
                if (image.value) {
                    await methodsHttp.putApi(
                        `stores/updateDriverImage/${resp?.storeDriver._id}`,
                        formData
                    );
                }

                openModal.value = false;
                notify.value?.showNotifyGood(resp.mensaje);
                getDrivers();
                clear();
            } else {
                notify.value?.showNotifyBad(resp.mensaje);
            }
        }
    } catch (error) {
        notify.value?.showNotifyBad("An error has ocurred");
    }
    finally {
        modalLoading.value = false
    }
};

const getAllStore = async () => {
    let resp = await methodsHttp.getApi(`stores/getAllStore`);
    if (resp.ok) {
        stores.value = resp.store;
        storesFilter.value = resp.store;
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
