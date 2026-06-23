<template>
    <div class="bg-white" style="border-radius: 15px; padding: 10px;">

        <!-- table -->
        <div>
            <q-table :loading="tableLoading" :rows="rows" :columns="columns.columnsProductsActionsHistory()"
                title="HISTORIAL" row-key="name" :bordered="false" :rows-per-page-options="[limit]" flat dense
                hide-pagination>
                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td key="name" :props="props">
                            <ImagenVue :img="props.row.storeProduct?.img
                                ? props.row.storeProduct?.img
                                : 'https://plus-nautic.nyc3.digitaloceanspaces.com/caja.png'
                                " w="40" h="40" style="cursor: pointer; width: 50px; height: 50px; overflow:hidden" />
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row?.storeProduct?.name }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row.description }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row.elapsedTime }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ moment(props.row.created_at).format("YYYY-MM-DD") }}
                        </q-td>

                    </q-tr>
                </template>
            </q-table>

            <div class="col-12 q-mt-sm" style="display: flex; align-items: center; justify-content: center">
                <q-pagination v-model="initialPagination" :max="orderQuantity ? orderQuantity : 1" max-pages="10"
                    direction-links push color="light-blue-10" active-design="push" active-color="light-blue-5" />
            </div>
        </div>

        <!-- Modal create details -->
        <div>
            <q-dialog v-model="openModalCreateDetails" persistent>
                <q-card style="width: 900px;  max-width: 90vw">
                    <div class="bg-white row justify-between q-pa-md">
                        <div class="text-white" style="font-size: 19px; font-weight: 500">
                            <div class="row items-center">
                                <div class="col-auto q-mx-sm">
                                    <q-icon size="2em" name="people" color="primary" />
                                </div>
                                <div class="col-auto text-primary">
                                    <b>{{
                                        "ORDER DETAILS"
                                    }}</b>
                                </div>
                            </div>

                            <!-- groups -->
                        </div>
                        <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer"
                            @click="openModalCreateDetails = false; productsTableData = []">
                            cancel
                        </span>
                    </div>

                    <q-card-section class="q-pt-sm">
                        <div class="q-mb-sm">
                            <label class="text-body1 text-weight-bold">
                                {{ subOrderData?.store_name.toUpperCase() }}
                            </label>
                        </div>
                        <div style="display:flex; justify-content: space-between; gap: 10px">
                            <div class=" bg-grey-3 q-pa-md rounded-borders" style="width: 50%;">
                                <label class="text-body1 q-my-xs text-weight-bold">
                                    ORDER INFO:
                                </label>

                                <div class="row q-mt-md">
                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">CODE:</b>
                                        <span>{{ subOrderData?.code }}</span>
                                    </label>

                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">SHIPPING PRICE:</b>
                                        <span>${{ subOrderData?.shippingPrice }}</span>
                                    </label>

                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">AMOUNT:</b>
                                        <span>${{ subOrderData?.amount }}</span>
                                    </label>

                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">STATE TAX:</b>
                                        <span>${{ subOrderData?.stateTax }}</span>
                                    </label>

                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">MUNICIPAL TAX:</b>
                                        <span>${{ subOrderData?.municipalTax }}</span>
                                    </label>

                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">TRANSATION FEE:</b>
                                        <span>${{ subOrderData?.transationFee }}</span>
                                    </label>


                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">PRCESSING FEE:</b>
                                        <span>${{ subOrderData?.processingFee }}</span>
                                    </label>


                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">TOTAL TO DEPOSIT:</b>
                                        <span>${{ subOrderData?.totalToDeposit }}</span>
                                    </label>

                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">TOTAL TO DISCOUNT:</b>
                                        <span>${{ subOrderData?.totalToDiscount }}</span>
                                    </label>


                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">TOTAL IVU:</b>
                                        <span>${{ subOrderData?.totalIVU }}</span>
                                    </label>

                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">TOTAL:</b>
                                        <span>${{ subOrderData?.total }}</span>
                                    </label>
                                </div>
                            </div>

                            <div class="bg-grey-3 q-pa-md rounded-borders" style="width: 50%;">
                                <label class="text-body1 q-my-xs text-weight-bold">
                                    CLIENTE INFO:
                                </label>

                                <div class="row q-mt-md">
                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">NAME:</b>
                                        <span>{{ subOrderData?.user_name }}</span>
                                    </label>

                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">EMAIL:</b>
                                        <span>{{ subOrderData?.user_email }}</span>
                                    </label>

                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">PHONE:</b>
                                        <span>{{ subOrderData?.user_phone }}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </q-card-section>

                    <q-card-section class="q-pt-sm">
                        <div class="q-mb-sm">
                            <label class="text-body1 text-weight-bold">
                                PRODUCTS
                            </label>
                        </div>
                        <q-table :loading="tableLoading" :rows="productsTableData"
                            :columns="columns.columnsSubOrderDetails()" row-key="name" :bordered="false"
                            :rows-per-page-options="[limit]" flat dense hide-pagination>
                            <template v-slot:body="props">
                                <q-tr :props="props">
                                    <q-td key="name" :props="props">
                                        <ImagenVue :img="props.row.StoreProducts?.img
                                            ? props.row.StoreProducts?.img
                                            : 'https://plus-nautic.nyc3.digitaloceanspaces.com/caja.png'
                                            " w="40" h="40" style="cursor: pointer; width: 50px; height: 50px; overflow:hidden" />
                                    </q-td>
                                    <q-td key="name" :props="props">
                                        {{ props.row?.StoreProducts?.name }}
                                    </q-td>
                                    <q-td key="name" :props="props">
                                        {{ props.row.description }}
                                    </q-td>
                                    <q-td key="name" :props="props">
                                        {{ props.row?.elapsedTime }}
                                    </q-td>
                                </q-tr>
                            </template>
                        </q-table>
                    </q-card-section>


                    <q-inner-loading :showing="modalLoading" label="Please wait..." label-class="text-blue-11"
                        label-style="font-size: 1.5em" />
                </q-card>
            </q-dialog>
        </div>

        <NotificationsVue ref="notify" />
        <Delete ref="deleteInfo" @deleteGood="getProductsActions" />
    </div>
</template>
<script setup>
import { onMounted, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import columns from "src/components/utils/columns";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Delete from "src/components/utils/Delete.vue";
import { authStore } from "src/stores/auth-store";
import ImagenVue from "src/components/utils/Imagen.vue"
import moment from "moment"

const limit = ref(10);
const initial = ref(0);

const orderQuantity = ref(1);
const initialPagination = ref(1);

const auth = authStore();
const notify = ref();
const deleteInfo = ref();
const rows = ref([]);
const TableFilter = ref([]);

const subOrderData = ref([]);
const openModalCreateDetails = ref(false);
const tableLoading = ref(false);
const modalLoading = ref(false);

const productsTableData = ref([]);

onMounted(() => {
    getProductsActions();
});

watch(initialPagination, async (value) => {
    initial.value = await value * 10
    if (value == 1) {
        initial.value = 0
        getProductsActions();
    } else {
        initial.value = value * 10 - 10
        getProductsActions();
    }
});

const getProductsActions = async () => {
    tableLoading.value = true;

    const url = `stores/getStoreProductsActions/null/${limit.value}/${initial.value}`

    let resp = await methodsHttp.getApi(url);

    if (resp.ok) {
        rows.value = resp.productsActions;
        TableFilter.value = resp.productsActions;
        orderQuantity.value = Math.ceil(resp.count / 10)

    }
    tableLoading.value = false;
};

</script>
