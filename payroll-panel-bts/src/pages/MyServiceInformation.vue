<template>
    <div class="bg-white q-pa-sm">
        <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-auto col-md-auto row items-center">
                <q-btn color="primary" label="Crear articulo" style="width: 100%; height: 40px" icon="add"
                    @click="create" />
            </div>

            <div class="col-12 col-sm-3 col-md-4">
                <q-input outlined dense label="BUSCAR ARTICULO" color="primary" @keyup="search" v-model="text">
                    <template v-slot:append>
                        <q-icon name="search" color="primary" />
                    </template>
                </q-input>
            </div>
        </div>

        <div class="q-my-md">
            <q-separator />
        </div>

        <!-- modal -->
        <div>
            <q-dialog v-model="openModal" persistent>
                <q-card style="width: 1550px; max-width: 85vw">
                    <q-inner-loading :showing="isLoading" label="Enviando..." label-class="text-blue-11"
                        label-style="font-size: 1.1em" />
                    <div class="bg-white row justify-between q-pa-md">
                        <div class="text-white" style="font-size: 19px; font-weight: 500">
                            <div class="row items-center">
                                <div class="col-auto q-mx-sm">
                                    <q-icon size="2em" name="article" color="primary" />
                                </div>
                                <div class="col-auto text-primary">
                                    <b>{{
                                        mode ? "EDITAR INFORMACIONES" : "CREAR INFORMACIONES"
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
                            <div class="col-12 col-md-4">
                                <label>
                                    <b>
                                        <b class="text-negative">* </b> TITULO
                                    </b>
                                </label>
                                <q-input outlined dense color="primary" v-model="form.title">
                                </q-input>
                            </div>

                            <div class="col-12 col-md-2 row q-col-gutter-sm">
                                <label class="col-12">
                                    <b>
                                        ACTIVAR ARTICULO
                                    </b>
                                </label>
                                <q-toggle color="blue" v-model="form.isActived" val="blue" />
                            </div>


                            <div class="col-12 col-md-12">
                                <label>
                                    <b>
                                        <b class="text-negative">* </b> DESCRIPCIÓN
                                    </b>
                                </label>
                                <q-input outlined dense color="primary" v-model="form.description" type="textarea" />
                            </div>



                            <div class="col-12 col-md-12">
                                <label>
                                    <b>
                                        <b class="text-negative">* </b> INFORMACIÓN
                                    </b>
                                </label>

                                <q-editor v-model="form.information" :dense="$q.screen.lt.md" :toolbar="[
                                    [
                                        {
                                            label: $q.lang.editor.align,
                                            icon: $q.iconSet.editor.align,
                                            fixedLabel: true,
                                            list: 'only-icons',
                                            options: ['left', 'center', 'right', 'justify']
                                        },
                                        {
                                            label: $q.lang.editor.align,
                                            icon: $q.iconSet.editor.align,
                                            fixedLabel: true,
                                            options: ['left', 'center', 'right', 'justify']
                                        }
                                    ],
                                    ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
                                    ['token', 'hr', 'link', 'custom_btn'],
                                    ['print', 'fullscreen'],
                                    [
                                        {
                                            label: $q.lang.editor.formatting,
                                            icon: $q.iconSet.editor.formatting,
                                            list: 'no-icons',
                                            options: [
                                                'p',
                                                'h1',
                                                'h2',
                                                'h3',
                                                'h4',
                                                'h5',
                                                'h6',
                                                'code'
                                            ]
                                        },
                                        {
                                            label: $q.lang.editor.fontSize,
                                            icon: $q.iconSet.editor.fontSize,
                                            fixedLabel: true,
                                            fixedIcon: true,
                                            list: 'no-icons',
                                            options: [
                                                'size-1',
                                                'size-2',
                                                'size-3',
                                                'size-4',
                                                'size-5',
                                                'size-6',
                                                'size-7'
                                            ]
                                        },
                                        {
                                            label: $q.lang.editor.defaultFont,
                                            icon: $q.iconSet.editor.font,
                                            fixedIcon: true,
                                            list: 'no-icons',
                                            options: [
                                                'default_font',
                                                'arial',
                                                'arial_black',
                                                'comic_sans',
                                                'courier_new',
                                                'impact',
                                                'lucida_grande',
                                                'times_new_roman',
                                                'verdana'
                                            ]
                                        },
                                        'removeFormat'
                                    ],
                                    ['quote', 'unordered', 'ordered', 'outdent', 'indent'],

                                    ['undo', 'redo'],
                                    ['viewsource']
                                ]" :fonts="{
                                    arial: 'Arial',
                                    arial_black: 'Arial Black',
                                    comic_sans: 'Comic Sans MS',
                                    courier_new: 'Courier New',
                                    impact: 'Impact',
                                    lucida_grande: 'Lucida Grande',
                                    times_new_roman: 'Times New Roman',
                                    verdana: 'Verdana'
                                }" />
                            </div>

                            <div class="col-12 q-my-sm text-center">
                                <q-btn type="submit" color="negative" label="cancelar" icon="cancel" class="q-mx-sm"
                                    @click="openModal = false" />

                                <q-btn type="submit" color="primary" label="guardar" icon="save" @click="save"
                                    :disable="form.title == '' || form.writer == '' || form.description == '' || form.information == '' || form.application == ''" />
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </q-dialog>
        </div>

        <!-- update image modal -->
        <div>
            <q-dialog v-model="openModalImage" persistent>
                <q-card style="width: 400px; max-width: 70vw">
                    <q-inner-loading :showing="isLoading" label="Enviando..." label-class="text-blue-11"
                        label-style="font-size: 1.1em" />
                    <div class="bg-white row justify-between q-pa-md">
                        <div class="text-white" style="font-size: 19px; font-weight: 500">
                            <div class="row items-center">
                                <div class="col-auto q-mx-sm">
                                    <q-icon size="2em" name="article" color="primary" />
                                </div>
                                <div class="col-auto text-primary">
                                    <b>ACTUALIZAR IMAGEN</b>
                                </div>
                            </div>

                            <!-- groups -->
                        </div>
                        <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer"
                            @click="openModalImage = false">
                            cancel
                        </span>
                    </div>

                    <q-card-section class="q-pt-sm">
                        <div class="q-pt-sm row q-col-gutter-sm">

                            <div class="bordereFile">
                                <div class="file-select">


                                    <q-file color="teal" dense filled type="file" @input="updateFile" v-model="image">
                                        <!-- <template v-slot:prepend>
                                            <div class="drag">
                                        <div>
                                            <div style="text-align: center">
                                                <q-icon size="2.6em" name="description" color="white" />
                                            </div>
                                            <div style="text-align: center">
                                                <b style="font-size: 17px; color: white">Add File</b>
                                            </div>
                                            <p style="color: white">or drag and drop</p>
                                        </div>
                                    </div>
                                        </template> -->
                                    </q-file>
                                </div>
                            </div>

                            <div class="col-12 q-mt-sm"
                                style="display: flex; align-items: center; justify-content: center;">
                                <q-img v-if="imageString" :src="imageString" spinner-color="white"
                                    style="height: 140px; max-width: 150px; border: 1px solid black; border-radius: 20px" />
                            </div>


                            <div class="col-12 q-my-sm text-center">
                                <q-btn type="submit" color="negative" label="cancelar" icon="cancel" class="q-mx-sm"
                                    @click="openModalImage = false" />

                                <q-btn type="submit" color="primary" label="guardar" icon="save" @click="updateImage"
                                    :disable="image == null" />
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </q-dialog>
        </div>

        <!-- table -->
        <div>
            <q-table :loading="tableLoading" flat row-key="_id" title="INFORMACIONES" :rows="rows"
                :columns="columns.columnsServiceInfo()" hide-pagination :rows-per-page-options="[limit]">
                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td key="image" :props="props">
                            <ImagenVue :img="props.row.img
                                ? props.row.img
                                : 'https://plus-nautic.nyc3.digitaloceanspaces.com/articulos.png'
                                " style="cursor: pointer; width: 50px; height: 50px; overflow:hidden" />
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row?.title }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ utils.truncateText(props.row.description, 50) }}
                        </q-td>

                        <q-td key="name" :props="props" @click="updateState(props.row)">
                            <div v-if="props.row.isActived">
                                <q-badge color="secondary" label="ACTIVE" style="cursor: pointer" />
                            </div>
                            <div v-else>
                                <q-badge color="negative" label="INACTIVE" style="cursor: pointer" />
                            </div>
                        </q-td>

                        <q-td key="actions" :props="props">

                            <ActionsButtons :menuItems="menuItems" :data="props.row" />
                        </q-td>
                    </q-tr>
                </template>
            </q-table>

            <div class="col-12 q-mt-sm" style="display: flex; align-items: center; justify-content: center">
                <TablePagination v-model="initialPagination" :orderQuantity="orderQuantity" color="light-blue-10"
                    active-color="light-blue-5" />
            </div>
        </div>
        <NotificationsVue ref="notify" />
        <Delete ref="deleteInfo" @deleteGood="getArticles" />
    </div>
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import Delete from "src/components/utils/Delete.vue";
import ImagenVue from "src/components/utils/Imagen.vue"
import utils from "src/components/utils/modifiText"
import ActionsButtons from "src/components/table/ActionsButtons.vue"
import TablePagination from "src/components/table/TablePagination.vue"
import { authStore } from "src/stores/auth-store";

import { ref, onMounted, watch } from "vue";

const notify = ref(null);
const deleteInfo = ref(null);
const auth = authStore();

const text = ref("");
const openModal = ref(false);
const openModalImage = ref(false)

const limit = ref(10);
const initial = ref(0);
const orderQuantity = ref(1);
const initialPagination = ref(1);

const id = ref(null)
const image = ref(null);
const imageString = ref(null);
const rows = ref([]);
const TableFilter = ref([]);
const tableLoading = ref(false);
const mode = ref(false);
const form = ref({
    title: "",
    writer: auth.user.name,
    isActived: true,
    description: "",
    information: "",
    application: auth.user.application,
    user: auth.user._id
});
const isLoading = ref(false);
const applications = ref([]);

onMounted(() => {
    getArticles();
    getApplications();
});

watch(initialPagination, async (value) => {
    initial.value = await value * 10
    if (value == 1) {
        initial.value = 0
        getArticles();
    } else {
        initial.value = value * 10 - 10
        getArticles();
    }
});

const getArticles = async () => {
    tableLoading.value = true;
    let resp = await methodsHttp.getApi(
        `articles/getArticles/${limit.value}/${initial.value}`
    );

    if (resp.ok) {
        rows.value = resp.articles
        TableFilter.value = resp.articles
    }
    tableLoading.value = false;
};

const getApplications = async () => {
    tableLoading.value = true;
    let resp = await methodsHttp.getApi(
        `applications/getApplications`
    );

    if (resp.ok) {
        applications.value = resp.applications
    }
    tableLoading.value = false;
};

const create = () => {
    mode.value = false
    clear()
    openModal.value = true;
};


const openPreview = (item) => {
    const url = `/articles/preview/${item._id}`;
    window.open(url, '_blank');
};


const openModalEdit = (item) => {
    id.value = item._id
    form.value.title = item.title;
    form.value.writer = item.writer;
    form.value.isActived = item.isActived;
    form.value.description = item.description;
    form.value.information = item.information;
    form.value.application = item.application;
    mode.value = true;
    openModal.value = true;
};


const updateState = async (item) => {
    tableLoading.value = true;
    let resp = await methodsHttp.putApi(
        `articles/updateArticles/${item._id}`,
        { isActived: !item.isActived }
    );
    if (resp.ok) {
        openModal.value = false;
        notify.value?.showNotifyGood(resp.mensaje);
        getArticles();
        clear();
    } else {
        notify.value?.showNotifyBad(resp.mensaje);
    }
    tableLoading.value = false;
};

const clear = () => {
    form.value.title = "";
    form.value.description = "";
    form.value.information = "";
    form.value.isActived = true;
};

const openModalImageFunct = (item) => {
    openModalImage.value = true;
    id.value = item._id
};

const openModalDelete = (item) => {
    const data = {
        id: item._id,
        ruta: "articles/deleteArticles",
    };

    deleteInfo.value?.openDelete(data);
};

const save = async () => {
    isLoading.value = true;
    if (!mode.value) {
        let resp = await methodsHttp.postApi(
            "articles/createArticles",
            { ...form.value }
        );
        if (resp.ok) {
            openModal.value = false;
            notify.value?.showNotifyGood(resp.mensaje);
            getArticles();
            clear();
        } else {
            notify.value?.showNotifyBad(resp.mensaje);
        }
    } else {
        let resp = await methodsHttp.putApi(
            `articles/updateArticles/${id.value}`,
            { ...form.value }
        );
        if (resp.ok) {
            openModal.value = false;
            notify.value?.showNotifyGood(resp.mensaje);
            getArticles();
            clear();
        } else {
            notify.value?.showNotifyBad(resp.mensaje);
        }
    }
    isLoading.value = false;
};

const updateImage = async () => {
    isLoading.value = true;
    const formData = new FormData();
    formData.append('image', image.value);

    const resp = await methodsHttp.putApi(`articles/updateArticleImage/${id.value}`, formData);

    if (resp.ok) {
        openModalImage.value = false;
        image.value = null;
        imageString.value = null;
        notify.value?.showNotifyGood(resp.mensaje);
        getArticles();
    } else {
        notify.value?.showNotifyBad(resp.mensaje);
    }
    isLoading.value = false
}

const search = async () => {
    if (text.value == "") {
        getArticles();
    } else {
        let resp = await methodsHttp.postApi(`articles/searchArticles/${limit.value}/${initial.value}`, { text: text.value });
        if (resp.ok) {
            rows.value = resp.articles;
            orderQuantity.value = Math.ceil(resp.count / 10)
            // TableFilter.value = resp.products;
        }
    }
};

const menuItems = ref([
    {
        icon: "visibility",
        text: "PREVIEW",
        color: "primary",
        action: openPreview
    },
    {
        icon: "image",
        text: "AÑADIR IMAGEN",
        color: "primary",
        action: openModalImageFunct
    },
    {
        icon: "edit",
        text: "EDITAR",
        color: "primary",
        action: openModalEdit
    },
    {
        icon: "delete",
        text: "ELIMINAR",
        color: "negative",
        action: openModalDelete
    }
]);

const updateFile = ({ target }) => {
    if (target.files[0]) {
        imageString.value = URL.createObjectURL(target.files[0]);
    }
}

</script>

<style scoped></style>
