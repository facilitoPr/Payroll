<template>
    <div class="bg-white" style="border-radius: 15px; padding: 10px;">
        <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-auto col-md-auto row items-center">
                <q-btn color="primary" label="CREATE ORDER" style="width: 100%; height: 40px" icon="people"
                    @click="openModalCreate" />
            </div>

            <div class="col-12 col-sm-5 col-md-6">
                <q-input outlined dense label="SEARCH ORDER" color="primary" @keyup="search" v-model="text">
                    <template v-slot:append>
                        <q-icon name="search" color="primary" />
                    </template>
                </q-input>
            </div>


            <div class="col-12 col-sm-3">
                <q-select v-model="storeStatusSelectedSearch" label="STATUS" option-label="name" outlined dense
                    color="primary" :options="storeStatus">
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
                :columns="auth.user.rol.code == 'STORE' ? columns.columnsSubOrdersTable() : columns.columnsOrders()"
                title="ORDERS" row-key="name" :bordered="false" :rows-per-page-options="[limit]" flat
                hide-pagination>
                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td key="name" :props="props"
                            @click="auth.user.rol.code == 'STORE' ? openModalSubOrdersDetailsFunct(props.row) : openModalSubOrdersFunct(props.row)"
                            class="text-primary cursor-pointer">
                            {{ props.row.code }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row?.patient?.name }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ moment(props.row.created_at).format("YYYY-MM-DD") }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ props.row.elapsedTime }}
                        </q-td>

                        <q-td key="name" v-if="auth.user.rol.code == 'STORE'"
                            :class="props.row?.storeStatus?.code == 'ACCEPTED' ? 'text-green-9' : props.row?.storeStatus?.code == 'PENDING' ? 'text-yellow-10' : props.row?.storeStatus?.code == 'DELIVERED' ? 'text-blue-10' : 'text-black'"
                            :props="props">
                            {{ props.row?.storeStatus?.name }}
                        </q-td>


                        <q-td key="name" :props="props">
                            {{ formatCurrency(props.row.amount) }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ formatCurrency(props.row?.stateTax) }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ formatCurrency(props.row?.municipalTax) }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ formatCurrency(props.row?.transationFee) }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ formatCurrency(props.row?.processingFee) }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ formatCurrency(props.row.totalToDeposit) }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ formatCurrency(props.row.totalToDiscount) }}
                        </q-td>

                        <q-td key="name" :props="props" v-if="auth.user.rol.code == 'STORE'">
                            {{ props.row.isSent ? "YES" : "NO" }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ formatCurrency(props.row.shippingPrice) }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ formatCurrency(props.row.totalIVU) }}
                        </q-td>

                        <q-td key="name" :props="props">
                            {{ formatCurrency(props.row.total) }}
                        </q-td>

                        <!-- <q-td key="name" :props="props" @click="updateState(props.row)">
                            <div v-if="props.row.isActived">
                                <q-badge color="secondary" label="ACTIVE" style="cursor: pointer" />
                            </div>
                            <div v-else>
                                <q-badge color="negative" label="INACTIVE" style="cursor: pointer" />
                            </div>
                        </q-td> -->

                    </q-tr>
                </template>
            </q-table>

            <div class="col-12 q-mt-sm" style="display: flex; align-items: center; justify-content: center">
                <q-pagination v-model="initialPagination" :max="orderQuantity ? orderQuantity : 1" max-pages="10"
                    direction-links push color="primary" active-design="push" active-color="primary" />
            </div>
        </div>

        <!-- Modal sub orders -->
        <div>
            <q-dialog v-model="openModalSubOrders" persistent>
                <q-card style="width: 1000px; max-width: 80vw">
                    <div class="bg-white row justify-between q-pa-md">
                        <div class="text-white" style="font-size: 19px; font-weight: 500">
                            <div class="row items-center">
                                <div class="col-auto q-mx-sm">
                                    <q-icon size="2em" name="shopping_bag" color="primary" />
                                </div>
                                <div class="col-auto text-primary">
                                    <b>
                                        Sub orders
                                    </b>
                                </div>
                            </div>

                            <!-- groups -->
                        </div>
                        <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer"
                            @click="openModalSubOrders = false">
                            cancel
                        </span>
                    </div>

                    <q-card-section class="q-pt-sm">
                        <q-table :loading="tableLoading" :rows="rowsDetails" :columns="columns.columnsSubOrders()"
                            title="SUB ORDERS" row-key="name" :bordered="false" :rows-per-page-options="[limit]" flat
                            dense hide-pagination>
                            <template v-slot:body="props">
                                <q-tr :props="props">
                                    <q-td key="name" :props="props" @click="openModalSubOrdersDetailsFunct(props.row)"
                                        class="text-primary cursor-pointer">
                                        {{ props.row.code }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ props.row?.store?.name }}
                                    </q-td>


                                    <q-td key="name" :props="props">
                                        {{ props.row?.patient?.name }}
                                    </q-td>

                                    <q-td key="name"
                                        :class="props.row?.storeStatus?.code == 'ACCEPTED' ? 'text-green-9' : props.row?.storeStatus?.code == 'PENDING' ? 'text-yellow-10' : props.row?.storeStatus?.code == 'DELIVERED' ? 'text-blue-10' : 'text-black'"
                                        :props="props">
                                        {{ props.row?.storeStatus?.name }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ formatCurrency(props.row.amount) }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ formatCurrency(props.row.stateTax) }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ formatCurrency(props.row.municipalTax) }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ formatCurrency(props.row.transationFee) }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ formatCurrency(props.row.processingFee) }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ formatCurrency(props.row.totalToDeposit) }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ formatCurrency(props.row.totalToDiscount) }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        <div v-if="props.row.shippingPrice">
                                            YES
                                        </div>
                                        <div v-else>
                                            NO
                                        </div>
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ formatCurrency(props.row.shippingPrice) }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ formatCurrency(props.row.totalIVU) }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ formatCurrency(props.row.total) }}
                                    </q-td>

                                </q-tr>
                            </template>
                        </q-table>

                        <div class="col-12 q-mt-sm" style="display: flex; align-items: center; justify-content: center">
                            <q-pagination v-model="initialPaginationDetails"
                                :max="orderDetailsQuantity ? orderDetailsQuantity : 1" max-pages="10" direction-links
                                push color="light-blue-10" active-design="push" active-color="light-blue-5" />
                        </div>
                    </q-card-section>
                </q-card>
            </q-dialog>
        </div>

        <!-- Modal sub orders details -->
        <div>
            <q-dialog v-model="openModalSubOrdersDetails" persistent>
                <q-card style="width: 1000px; max-width: 80vw">
                    <div class="bg-white row justify-between q-pa-md">
                        <div class="text-white" style="font-size: 19px; font-weight: 500">
                            <div class="row items-center">
                                <div class="col-auto q-mx-sm">
                                    <q-icon size="2em" name="people" color="primary" />
                                </div>
                                <div class="col-auto text-primary">
                                    <b>
                                        Order details
                                    </b>
                                </div>
                            </div>

                            <!-- groups -->
                        </div>
                        <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer"
                            @click="openModalSubOrdersDetails = false">
                            cancel
                        </span>
                    </div>

                    <q-card-section class="q-pt-sm row q-ml-md">
                        <div class="col-6 col-md-4">
                            <label class="text-body2 q-my-xs text-justify column">
                                <b class="text-weight-bold">
                                    CODE
                                </b>
                                {{ subOrderData?.code }}
                            </label>
                        </div>

                        <div class="col-6 col-md-4">
                            <label class="text-body2 q-my-xs text-justify column">
                                <b class="text-weight-bold">
                                    TOTAL TO DESPOSIT
                                </b>
                                {{ formatCurrency(subOrderData?.totalToDeposit ?? 0) }}
                            </label>
                        </div>

                        <div class="col-6 col-md-4 column">
                            <label class="text-body2 q-my-xs text-justify column">
                                <b class="text-weight-bold">
                                    TOTAL
                                </b>
                                {{ formatCurrency(subOrderData?.total ?? 0) }}
                            </label>
                        </div>

                        <div class="col-6 col-md-4 column q-mt-md">
                            <label class="text-body2 q-my-xs text-justify column">
                                <b class="text-weight-bold">
                                    STATUS
                                </b>

                                <div class="q-pa-sm">
                                    {{ subOrderData?.storeStatus?.name }}
                                </div>
                            </label>
                        </div>

                        <div class="col-12 col-sm-4 q-mt-md" v-if="auth.user.rol.code == 'STORE'">
                            <label class="text-body2 q-my-xs text-justify">
                                <b class="text-weight-bold">
                                    SELECT STATUS
                                </b>
                            </label>

                            <div class="col-12 row">

                                <q-select class="col-7"  v-model="storeStatusSelected" label="STATUS" option-label="name"
                                    outlined dense color="primary" :options="storeStatus">
                                    <template v-slot:no-option>
                                        <q-item>
                                            <q-item-section class="text-grey">
                                                No results
                                            </q-item-section>
                                        </q-item>
                                    </template>
                                </q-select>

                                <q-btn class="q-ml-sm col-4" color="primary" label="SUBMIT"
                                    @click="changeOrderStatus(storeStatusSelected)" />
                            </div>
                        </div>
                    </q-card-section>


                    <q-card-section class="q-pt-sm">
                        <q-table :loading="tableLoading" :rows="subOrderDetails"
                            :columns="columns.columnsSubOrderDetails()" row-key="name" :bordered="false"
                            :rows-per-page-options="[limit]" flat dense hide-pagination>
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
                                        {{ props.row?.storeProduct?.description }}
                                    </q-td>
                                    <q-td key="name" :props="props">
                                        {{ props.row.amount }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ formatCurrency(props.row.price) }}
                                    </q-td>
                                    <q-td key="name" :props="props">
                                        {{ formatCurrency(props.row.amount * props.row.price) }}
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

        <!-- modal -->
        <div>
            <q-dialog v-model="openModal" persistent>
                <q-card style="width: 800px;  max-width: 80vw">
                    <div class="bg-white row justify-between q-pa-md">
                        <div class="text-white" style="font-size: 19px; font-weight: 500">
                            <div class="row items-center">
                                <div class="col-auto q-mx-sm">
                                    <q-icon size="2em" name="people" color="primary" />
                                </div>
                                <div class="col-auto text-primary">
                                    <b>{{
                                        mode
                                        ? "EDIT ORDER"
                                        : "CREATE ORDER"
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
                    <q-card-section class="q-pt-sm row q-col-gutter-sm">
                        <div class="col-12 col-md-12">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> USER
                                </b>
                            </label>
                            <q-select v-model="form.patient" use-input option-label="name" option-value="_id"
                                outlined dense color="primary" :options="patients" emit-value map-options>
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
                                    <b class="text-negative">* </b> PRODUCTS
                                </b>
                            </label>
                            <q-select v-model="productSelected" use-input option-label="name" outlined dense
                                color="primary" :options="products" emit-value>
                                <template v-slot:no-option>
                                    <q-item>
                                        <q-item-section class="text-grey">
                                            No results
                                        </q-item-section>
                                    </q-item>
                                </template>
                                <!-- <template v-slot:option="scope">
                                    <q-item :key="scope.index" @click="scope.item">
                                        <q-item-section avatar>
                                            <q-img :src="scope.opt.img" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label>{{ scope.opt.name }}</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </template> -->
                            </q-select>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> AMOUNT
                                </b>
                            </label>
                            <q-input outlined dense color="primary" v-model="productsAmount">
                            </q-input>
                        </div>

                        <div class="col-12 col-md-6">
                            <label>
                                <b>
                                    PRICE
                                </b>
                            </label>
                            <q-input disable outlined dense color="primary" v-model="productSelected.price">
                            </q-input>
                        </div>

                        <div class="col-12 col-sm-auto col-md-auto row items-center">
                            <label>
                                <b class="text-white">
                                    .
                                </b>
                            </label>
                            <q-btn color="primary" label="ADD PRODUCT" style="width: 100%; height: 40px"
                                icon="inventory_2" @click="addProductToTable" />
                        </div>

                        <div class="col-12 col-sm-auto col-md-auto row items-center">
                            <label>
                                <b class="text-white">
                                    .
                                </b>
                            </label>
                            <q-btn color="primary" label="CREATE" style="width: 100%; height: 40px"
                                :disable="productsTableData.length == 0 || form.patient == null"
                                on-right="arrow_forward_ios" @click="save" />
                        </div>

                    </q-card-section>


                    <q-card-section class="q-pt-sm">
                        <q-table :loading="tableLoading" :rows="productsTableData"
                            :columns="columns.columnsSubOrderDetails()" row-key="name" :bordered="false"
                            :rows-per-page-options="[limit]" flat dense hide-pagination>
                            <template v-slot:body="props">
                                <q-tr :props="props">
                                    <q-td key="name" :props="props">
                                        <ImagenVue :img="props.row.storeProduct?.img
                        ? props.row.storeProduct?.img
                        : 'https://plus-nautic.nyc3.digitaloceanspaces.com/caja.png'
                        " w="40" h="40" style="cursor: pointer; width: 50px; height: 50px; overflow:hidden" />
                                    </q-td>
                                    <q-td key="name" :props="props">
                                        {{ props.row.name }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ props.row.description }}
                                    </q-td>
                                    <q-td key="name" :props="props">
                                        {{ props.row.amount }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        ${{ props.row.price }}
                                    </q-td>
                                    <q-td key="name" :props="props">
                                        ${{ props.row.amount * props.row.price }}
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
                                {{ subOrderData?.store?.name.toUpperCase() }}
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
                                        <span>{{ subOrderData?.patient?.name }}</span>
                                    </label>

                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">EMAIL:</b>
                                        <span>{{ subOrderData?.patient?.email }}</span>
                                    </label>

                                    <label class="col-12 row text-body2 q-my-xs"
                                        style="display: flex; justify-content: space-between;">
                                        <b class="text-weight-bold text-grey-8">PHONE:</b>
                                        <span>{{ subOrderData?.patient?.phone }}</span>
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
                                        <ImagenVue :img="props.row.storeProduct?.img
                        ? props.row.storeProduct?.img
                        : 'https://plus-nautic.nyc3.digitaloceanspaces.com/caja.png'
                        " w="40" h="40" style="cursor: pointer; width: 50px; height: 50px; overflow:hidden" />
                                    </q-td>
                                    <q-td key="name" :props="props">
                                        {{ props.row.name }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        {{ props.row.description }}
                                    </q-td>
                                    <q-td key="name" :props="props">
                                        {{ props.row.amount }}
                                    </q-td>

                                    <q-td key="name" :props="props">
                                        ${{ props.row.price }}
                                    </q-td>
                                    <q-td key="name" :props="props">
                                        ${{ props.row.amount * props.row.price }}
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
        <Delete ref="deleteInfo" @deleteGood="getOrders" />
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
import { formatCurrency } from "../../utils"
import moment from "moment"

const limit = ref(10);
const limitDetails = ref(10);
const initial = ref(0);
const initialDetails = ref(0);

const orderQuantity = ref(1);
const orderDetailsQuantity = ref(1);

const initialPagination = ref(1)
const initialPaginationDetails = ref(1)

const auth = authStore();
const isPwd = ref(true);
const notify = ref();
const deleteInfo = ref();
const id = ref(null);
const idOrderDetails = ref(null);
const storeSubOrder_id = ref(null);
const rows = ref([]);
const TableFilter = ref([]);
const rowsDetails = ref([]);

const storeStatus = ref([]);
const storeStatusSelectedSearch = ref(null)
const storeStatusSelected = ref({})

const subOrderDetails = ref([]);
const subOrderData = ref([]);

const openModal = ref(false);
const openModalCreateDetails = ref(false);
const openModalSubOrders = ref(false);
const openModalSubOrdersDetails = ref(false);
const mode = ref(false);
const text = ref("");
const form = ref({
    patient: null,
    store: auth.user._id,
    isSent: false,
    direction: null,
    shippingPrice: auth.user.driver_price
});
const tableLoading = ref(false);
const modalLoading = ref(false);

const productsTableData = ref([]);
const patients = ref([]);
const patientsFilter = ref([])
const products = ref([])
const productsFilter = ref([])
const productSelected = ref({
    name: null,
    price: 0
});
const productsAmount = ref(0);

onMounted(() => {
    getOrders();
    getStoreStatus();
});

watch(initialPagination, async (value) => {
    initial.value = await value * 10
    if (value == 1) {
        initial.value = 0
        getOrders();
    } else {
        initial.value = value * 10 - 10
        getOrders();
    }
});

watch(initialPaginationDetails, async (value) => {
    initialDetails.value = await value * 10
    if (value == 1) {
        initialDetails.value = 0
        getSubOrders();
    } else {
        initialDetails.value = value * 10 - 10
        getSubOrders();
    }
});

watch(storeStatusSelectedSearch, async (value) => {
    if (storeStatusSelectedSearch.value) {
        getOrdersByStatus(storeStatusSelectedSearch.value?.code);
    } else {
        getOrders();
    }
});



const addProductToTable = () => {
    if (!productSelected.value.name || !productsAmount.value) {
        return
    }

    productsTableData.value = [...productsTableData.value, { ...productSelected.value, amount: productsAmount.value }]
    products.value = products.value.filter((item) => item._id != productSelected.value._id)
    productSelected.value = {
        name: null,
        price: 0
    }
    productsAmount.value = null
}

const getPatients = async () => {
    const url = `patients/getPatients`

    let resp = await methodsHttp.getApi(url);

    if (resp.ok) {
        patients.value = resp.patients;
        patientsFilter.value = resp.patients;
    }
}

const getProducts = async () => {
    const url = `stores/getAllProductStore/null`

    let resp = await methodsHttp.getApi(url);
    if (resp.ok) {
        products.value = resp.products;
        productsFilter.value = resp.products;
    }
};

const getOrders = async () => {
    tableLoading.value = true;

    const url = `stores/getOrderOrSubOrders/${limit.value}/${initial.value}`

    let resp = await methodsHttp.getApi(url);

    if (resp.ok) {
        rows.value = resp.orders;
        TableFilter.value = resp.orders;
        orderQuantity.value = Math.ceil(resp.count / 10)

    }
    tableLoading.value = false;
};

const getSubOrders = async (order_id) => {
    const url = `stores/getSubOrdersByOrder/${order_id}/${limitDetails.value}/${initialDetails.value}`
    let resp = await methodsHttp.getApi(url);

    if (resp.ok) {
        rowsDetails.value = resp.orders;
        // TableFilter.value = resp.orders;
        orderDetailsQuantity.value = Math.ceil(resp.count / 10)
    }
};

const getOrdersByStatus = async (value) => {
    tableLoading.value = true;

    const url = `stores/getSubOrdersByStatus/${limit.value}/${initial.value}/${value}`

    let resp = await methodsHttp.getApi(url);

    if (resp.ok) {
        rows.value = resp.orders;
        TableFilter.value = resp.orders;
        orderQuantity.value = Math.ceil(resp.count / 10)

    }
    tableLoading.value = false;
};

const getStoreStatus = async () => {
    const url = `stores/getStoreStatus`
    let resp = await methodsHttp.getApi(url);

    if (resp.ok) {
        storeStatus.value = resp.status;
    }
};

const getSubOrdersDetails = async () => {
    modalLoading.value = true;
    const url = `stores/getSubOrdersDetails/${storeSubOrder_id.value}`
    let resp = await methodsHttp.getApi(url);

    if (resp.ok) {
        subOrderDetails.value = resp.orders;
        subOrderData.value = resp.subOrderData;

        storeStatusSelected.value = { ...resp.subOrderData?.storeStatus }

        // TableFilter.value = resp.orders;
        // orderDetailsQuantity.value = Math.ceil(resp.count / 10)
    }
    modalLoading.value = false;

};

const changeOrderStatus = async (status) => {
    modalLoading.value = true;
    const url = `stores/createOrderHistory/${storeSubOrder_id.value}`
    const data = { storeStatus: status._id }
    let resp = await methodsHttp.postApi(url, data);

    if (resp.ok) {
        notify.value?.showNotifyGood(resp.mensaje);
        getOrders();
        getSubOrdersDetails();
    } else {
        notify.value?.showNotifyGood(resp.mensaje);
    }
    modalLoading.value = false;
}

const clear = () => {
    form.value.name = "";
    form.value.email = "";
    form.value.password = "";
    form.value.isActived = true;
};

const openModalSubOrdersFunct = (item) => {
    openModalSubOrders.value = true;
    idOrderDetails.value = item._id
    getSubOrders(item._id)
};

const openModalSubOrdersDetailsFunct = (item) => {
    openModalSubOrdersDetails.value = true;
    storeSubOrder_id.value = item._id
    getSubOrdersDetails(item._id)
};


const openModalCreate = () => {
    clear();
    openModal.value = true;
    getPatients();
    getProducts();
};

const openModalDelete = (item) => {
    const data = {
        id: item._id,
        ruta: `stores/deleteDriverStore`,
    };

    deleteInfo.value?.openDelete(data);
};

const save = async () => {
    if (!mode.value) {
        const amount = productsTableData.value.reduce((sum, product) => sum + (product.amount * product.price), 0);
        const products = productsTableData.value.map((item) => {
            return {
                storeProduct: item._id,
                price: item.price,
                amount: Number(item.amount),
                patient: form.value.patient
            }
        })

        let resp = await methodsHttp.postApi(
            "stores/createOrderPanel",
            { ...form.value, amount, products }
        );
        if (resp.ok) {
            openModal.value = false;
            openModalCreateDetails.value = true;
            subOrderData.value = resp.subOrderData;
            // productsTableData.value = []
            form.value = {
                patient: null,
                store: auth.user._id,
                isSent: false,
                direction: null,
                shippingPrice: auth.user.driver_price
            }
            notify.value?.showNotifyGood(resp.mensaje);
            getOrders();
        } else {
            notify.value?.showNotifyBad(resp.mensaje);
        }
    } else {

        console.log(form.value)
        let resp = await methodsHttp.putApi(
            `stores/updateDriverStore/${id.value}`,
            form.value
        );

        if (resp.ok) {
            openModal.value = false;
            notify.value?.showNotifyGood(resp.mensaje);
            getOrders();
        } else {
            notify.value?.showNotifyBad(resp.mensaje);
        }
    }
};

const search = async (value) => {
    if (text.value == "") {
        getOrders();
    } else {
        let resp = await methodsHttp.getApi(`stores/searchOrderOrSubOrders/${limit.value}/${initial.value}/${text.value}`);
        if (resp.ok) {
            rows.value = resp.orders;
            // TableFilter.value = resp.products;
        }
    }
};
</script>

<style scoped>
.my-card {
    /* height: 200px */
}

.container {
    padding: 1rem;
}

.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 2fr));
    gap: 1rem;
}

.grid-item {
    display: flex;
    flex-direction: column;
    /* width: 100px; */
}
</style>
