<template>
  <q-table
    :key="`table-${limit}`"
    flat
    bordered
    row-key="_id"
    :rows="rows"
    :columns="columns.conwasteHistorial()"
    :rows-per-page-options="[limit]"
    :rows-per-page="limit"
    :loading="tableLoading"
    hide-pagination
  >
    <template v-slot:body="props">
      <q-tr :props="props">
        <!-- operadora -->
        <q-td key="accountType" :props="props">
          {{ props.row?.user?.name }}
        </q-td>
        <!-- comentario -->
        <q-td key="customer_number" :props="props">
          <div
            class="note-truncate"
            v-if="props.row.note"
            @click="seeComment(props.row.note)"
          >
            {{ props.row.note }}
            <q-tooltip anchor="top middle" self="bottom middle">
              <div style="font-size: 1rem">{{ props.row.note }}</div>
            </q-tooltip>
          </div>
        </q-td>
        <!-- tipo de cuenta -->
        <q-td key="accountType" :props="props">
          {{ props.row?.clientsPaymentManagement?.accountType }}
        </q-td>

        <!-- numero de cliente -->
        <q-td key="customer_number" :props="props">
          {{ props.row?.clientsPaymentManagement?.customer_number }}
        </q-td>

        <!-- tipo de servicio -->
        <q-td key="customer_number" :props="props">
          {{ props.row?.typePayment }}
        </q-td>

        <!-- numero de cheque -->
        <q-td key="customer_number" :props="props"> </q-td>

        <!-- numero de cheque -->
        <q-td key="customer_number" :props="props">
          {{ props.row?.amountPayment }}
        </q-td>

        <!-- numero de factura -->
        <q-td key="customer_number" :props="props">
          {{ props.row?.numberBill }}
        </q-td>

        <!-- fecha de llamada -->
        <q-td key="customer_number" :props="props">
          {{ props.row?.callDate }}
        </q-td>
        <!-- fecha de llamada -->
        <q-td key="customer_number" :props="props">
          {{ props.row?.paymentCommitmentDate }}
        </q-td>

        <!-- mombre del negocio -->
        <q-td key="business_name" :props="props">
          {{ props.row?.clientsPaymentManagement.business_name }}
        </q-td>
        <!-- industria -->
        <q-td key="industry" :props="props">
          {{ props.row?.clientsPaymentManagement?.industry }}
        </q-td>
        <!-- contacto de persona -->
        <q-td key="contact_person_name" :props="props">
          {{ props.row?.clientsPaymentManagement?.contact_person_name }}
        </q-td>
        <!-- numero de telefono -->
        <q-td key="phone_number" :props="props">
          {{ props.row?.clientsPaymentManagement?.phone_number }}
        </q-td>
        <!-- direccion -->
        <q-td key="address" :props="props">
          {{ props.row?.clientsPaymentManagement?.address }}
        </q-td>
        <!-- pueblo -->
        <q-td key="town" :props="props">
          {{ props.row?.clientsPaymentManagement?.town }}
        </q-td>
        <q-td key="town" :props="props">
          {{ props.row?.typeOfManagement }}
        </q-td>
      </q-tr>
    </template>
  </q-table>

  <!-- pagination -->
  <div
    class="col-12 row q-mt-sm"
    style="display: flex; align-items: center; justify-content: center"
  >
    <div
      class="col-12 row q-mt-sm"
      style="display: flex; align-items: center; justify-content: center"
    >
      <TablePagination
        v-model="initialPagination"
        :orderQuantity="orderQuantity"
        color="light-blue-10"
        active-color="light-blue-5"
        :maxPages="6"
      />
      <div class="q-ml-md col-auto">
        <q-select v-model="limit" :options="options" label="limite" />
      </div>
    </div>
  </div>

  <q-dialog v-model="modalOpen">
    <q-card style="width: 700px; max-width: 80vw">
      <div class="bg-white row justify-between q-pa-md">
        <div class="text-primary" style="font-size: 19px; font-weight: 500">
          <div class="row items-center">
            <div class="col-auto q-mx-sm">
              <q-icon size="2em" name="comment" color="primary" />
            </div>
            <div class="col-auto text-primary">
              <b>COMENTARIO</b>
            </div>
          </div>
        </div>
        <span
          class="material-icons text-negative"
          style="font-size: 23px; cursor: pointer"
          @click="
            () => {
              modalOpen = false;
            }
          "
        >
          cancel
        </span>
      </div>

      <q-card-section class="q-pt-sm">
        <div class="q-pt-sm row q-col-gutter-sm">
          <div class="col-12 col-md-12">
            <q-card
              flat
              class=""
              style="height: 120px"
              :style="getNoteStyle(number)"
            >
              <q-card-section class="q-pa-sm borderes">
                <div class="row">
                  <div class="col">
                    <div class="row justify-between">
                      <div class="col-auto text-grey-7">{{ form.note }}</div>
                    </div>
                  </div>

                  <div class="column items-center q-ml-sm q-gutter-xs">
                    <q-btn
                      flat
                      round
                      dense
                      icon="content_copy"
                      size="sm"
                      color="grey-7"
                      @click="copyToClipboard(form.note)"
                    />
                  </div>
                </div> </q-card-section
            ></q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { onMounted, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import columns from "src/components/utils/columns";
import TablePagination from "src/components/table/TablePagination.vue";

moment.locale("es-do");

import { useQuasar } from "quasar";

const $q = useQuasar();

const limit = ref(10);
const initial = ref(0);
const orderQuantity = ref(1);
const initialPagination = ref(1);

const pagination = ref({
  page: 1,
  rowsPerPage: limit.value, // este se sincroniza con tu q-select
});

const colorList = ["#FBE9E7", "#E8F5E9", "#E3F2FD", "#FFF8E1", "#F3E5F5"];
const options = ref([5, 10, 20, 30, 100, 200, 300, 1000, 2000, 10000]);

const getNoteStyle = (index) => {
  const color = colorList[index % colorList.length];
  return `background-color: ${color}; border-radius: 8px`;
};

const form = ref({
  note: "",
});

const modalOpen = ref(false);

const rows = ref([]);

const number = ref(0);

onMounted(() => {
  getClientsPaymentHistory();
});

const getClientsPaymentHistory = async () => {
  //   rows.value = [];
  const resp = await methodsHttp.getApi(
    `client-payment-management/getClientsPaymentHistory/${limit.value}/${initial.value}`
  );
  if (resp.ok) {
    rows.value = resp.clientsPaymentNotes;
    orderQuantity.value = Math.ceil(resp.count / limit.value);
  }
};

const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      $q.notify({
        message: "Texto copiado al portapapeles",
        color: "primary",
        icon: "content_copy",
        position: "top-right",
        timeout: 2000,
      });
    })
    .catch(() => {
      $q.notify({
        message: "Error al copiar el texto",
        color: "negative",
        icon: "error",
        position: "top-right",
      });
    });
};

watch(limit, (value) => {
  changePaginationValues();
  if (value) {
    pagination.value.rowsPerPage = value;
    rows.value = [];
    getClientsPaymentHistory();
  }
});

watch(initialPagination, async (value) => {
  initial.value = (await value) * limit.value;
  if (value == 1) {
    initial.value = 0;
    getClientsPaymentHistory();
  } else {
    initial.value = value * limit.value - limit.value;
    getClientsPaymentHistory();
  }
});

const changePaginationValues = async () => {
  initial.value = 0;
  // limit.value = 10;
  initialPagination.value = 1;
};

const seeComment = (note) => {
  number.value = Math.floor(Math.random() * 5);
  form.value.note = note;
  modalOpen.value = true;
};
</script >

<style>
.note-scroll-box {
  height: 80px;
  overflow-y: auto;
  padding-right: 4px;
  /* background-color: #f5f5f5; */
  white-space: pre-wrap;
  /* border: dashed 1px black; */
  border-radius: 5px;
  padding: 5px;
  /* color: #9e9e9e; */
  /* cursor: not-allowed; */
  font-size: 14px;
  line-height: 1.4;
}

.note-scroll-box::-webkit-scrollbar {
  width: 3px; /* scrollbar delgada */
}

.note-scroll-box::-webkit-scrollbar-track {
  background: transparent;
}

.note-scroll-box::-webkit-scrollbar-thumb {
  background-color: var(--q-primary); /* usa el color primario de Quasar */
  border-radius: 4px;
}

.note-truncate {
  max-width: 250px; /* Ajusta el ancho según necesites */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer; /* Cambia el cursor para indicar “tooltip” */
}
</style>