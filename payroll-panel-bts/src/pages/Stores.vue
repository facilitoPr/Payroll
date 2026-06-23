<template>
  <div class="bg-white q-pa-sm">
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-md-4">
        <q-input
          outlined
          dense
          label="Buscar"
          color="primary"
          @keyup="search"
          v-model="text"
        >
          <template v-slot:append>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
      </div>

      <div class="col-12 col-sm-auto col-md-auto row items-center">
        <q-btn
          color="primary"
          label="CREAR TIENDA"
          style="width: 100%; height: 40px"
          icon="people"
          @click="openModal = true"
        />
      </div>
    </div>

    <div>
      <TableStores
        :rows="rows"
        :tableLoading="tableLoading"
        :getStores="getStores"
       
        :openModal="openModal"
        @update:openModal="openModal = $event"
      />

      <div
        class="col-12 q-mt-sm"
        style="display: flex; align-items: center; justify-content: center"
      >
        <TablePagination
          
          :orderQuantity="orderQuantity"
          :initialPagination="initialPagination"
          color="light-blue-10"
          active-color="light-blue-5"
        />
      </div>
    </div>
    <!-- 
        <CreateStoreModal :v-model="openModal" :openModal="openModal" :mode="mode" :getStores="getStores"
            @update:openModal="openModal = $event" /> -->
  </div>
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import "moment/locale/es";
moment.locale("es");
import { ref, onMounted, watch } from "vue";
import TablePagination from "src/components/table/TablePagination.vue";
import TableStores from "../components/stores/TableStores.vue";

const limit = ref(10);
const initial = ref(0);
const orderQuantity = ref(1);
const initialPagination = ref(1);

const tableLoading = ref(false);
const date = ref(moment(new Date()).format("YYYY/MM/DD"));
const dateFormatted = ref(moment(new Date()).format("LL"));
const rows = ref([]);
const text = ref(null);

const openModal = ref(false);

onMounted(() => {
  getStores();
});

watch(date, async (value) => {
  if (value) {
    dateFormatted.value = moment(value).format("LL");
    getStores();
  }
});

watch(initialPagination, async (value) => {
  initial.value = (await value) * 10;
  if (value == 1) {
    initial.value = 0;
    getStores();
  } else {
    initial.value = value * 10 - 10;
    getStores();
  }
});

const getStores = async () => {
  tableLoading.value = true;
  const resp = await methodsHttp.getApi(
    `stores/getStores/${limit.value}/${initial.value}`
  );

  if (resp.ok) {
    rows.value = resp.stores;
    orderQuantity.value = Math.ceil(resp.count / 10);
  }
  tableLoading.value = false;
};

const search = async () => {
  // tableLoading.value = true;
  // zoneSelected.value = null;
  // changePaginationValues();
  if (text.value == "") {
    getStores();
  } else {
    const resp = await methodsHttp.getApi(
      `stores/searchStore/${limit.value}/${initial.value}/${text.value}`
    );
    if (resp.ok) {
      rows.value = resp.stores;
      orderQuantity.value = Math.ceil(resp.count / 10);
      // TableFilter.value = resp.products;
    }
  }
  tableLoading.value = false;
};
</script>