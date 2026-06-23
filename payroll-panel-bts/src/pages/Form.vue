<template>
  <div class="bg-white q-pa-sm">
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-auto col-md-auto row items-center">
        <q-btn
          color="primary"
          label="Crear input de formulario"
          style="width: 100%; height: 40px"
          icon="add"
          @click="openModal = true"
        />
      </div>
    </div>

    <div class="q-my-md">
      <q-separator />
    </div>

    <div>
      <TableForm
        :rows="rows"
        :tableLoading="tableLoading"
        :getForm="getForm"
        :openModal="openModal"
        @update:openModal="openModal = $event"
      />
    </div>

    <div
      class="col-12 q-mt-sm"
      style="display: flex; align-items: center; justify-content: center"
    >
      <TablePagination
        v-model="initialPagination"
        :orderQuantity="orderQuantity"
        color="light-blue-10"
        active-color="light-blue-5"
      />
    </div>
  </div>
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import TablePagination from "src/components/table/TablePagination.vue";
import { ref, onMounted, watch } from "vue";
import TableForm from "src/components/services/TableForm.vue";
const tableLoading = ref(false);
const rows = ref([]);
const openModal = ref(false);

const limit = ref(10);
const initial = ref(0);

const orderQuantity = ref(1);
const initialPagination = ref(1);

onMounted(() => {
  getForm();
});

watch(initialPagination, async (value) => {
  initial.value = (await value) * 10;
  if (value == 1) {
    initial.value = 0;
    getForm();
  } else {
    initial.value = value * 10 - 10;
    getForm();
  }
});

const getForm = async () => {
  tableLoading.value = true;
  const resp = await methodsHttp.getApi(
    `services/getAllForm/${limit.value}/${initial.value}`
  );

  if (resp.ok) {
    rows.value = resp.form;
    orderQuantity.value = Math.ceil(resp.count / 10);
  }
  tableLoading.value = false;
};
</script>
