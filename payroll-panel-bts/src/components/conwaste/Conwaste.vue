<template>
  <div class="bg-white q-pa-md">
    <PageHeaderCard
      title="Gestión de Cobros"
      subtitle="Administra clientes, crea gestiones de cobro y revisa historiales."
      icon="payment"
    >
      <template #actions>
         <!-- Toggle: Clientes / Pagos -->
        <div class="pm-toggleWrap">
          <q-btn-toggle
            v-model="isHistorial"
            unelevated
            toggle-color="primary"
            color="grey-2"
            text-color="primary"
            no-caps
            :options="[
              { label: 'Clientes', value: false, icon: 'person_add' },
              { label: 'Pagos', value: true, icon: 'payments' },
            ]"
            class="pm-toggle"
          />
        </div>

        <!-- Agregar -->
        <q-btn
          color="primary"
          unelevated
          icon="add"
          label="Agregar"
          class="header-btn"
          :disable="isHistorial"
          @click="
            () => {
              clear();
              modalOpen = true;
              modeEdit = false;
              modeHistory = false;
              isHistorial = false;
            }
          "
        />

        <!-- Buscar -->
        <q-input
          v-model="text"
          outlined
          dense
          clearable
          label="Buscar"
          color="primary"
          class="header-search"
          :disable="isHistorial"
        >
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>

        <!-- Historial por operadora -->
        <HistoryByOperator />
      </template>
    </PageHeaderCard>

    <!-- table -->
    <div v-if="!isHistorial" class="q-mt-md">
      <q-table
        :key="`table-${limit}`"
        flat
        row-key="_id"
        :rows="rows"
        bordered
        :columns="columns.conwaste()"
        :rows-per-page-options="[limit]"
        :rows-per-page="limit"
        :loading="tableLoading"
        hide-pagination
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <!-- menu -->
            <q-td key="name" :props="props">
              <q-icon
                name="menu"
                color="primary"
                size="25px"
                style="cursor: pointer"
              >
                <q-menu
                  transition-show="flip-right"
                  transition-hide="flip-left"
                >
                  <!-- editar -->
                  <q-list
                    style="min-width: 100px"
                    @click="openModalEdit(props.row)"
                  >
                    <q-item clickable class="row items-center">
                      <div class="col-auto">
                        <q-icon name="edit" color="primary" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">EDITAR</div>
                    </q-item>
                  </q-list>
                  <!-- historial -->
                  <q-list
                    style="min-width: 100px"
                    @click="addHistory(props.row)"
                  >
                    <q-item clickable class="row items-center">
                      <div class="col-auto">
                        <q-icon name="add" color="secondary" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">GESTION DE COBROS</div>
                    </q-item>
                  </q-list>
                  <!-- eliminar -->
                  <q-list
                    style="min-width: 100px"
                    @click="openModalDelete(props.row)"
                  >
                    <q-item clickable class="row items-center">
                      <div class="col-auto">
                        <q-icon name="delete" color="negative" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">ELIMINAR</div>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-icon>
            </q-td>
            <!-- mombre del negocio -->
            <q-td key="business_name" :props="props">
              <div class="text-primary" style="cursor: pointer">
                <CreateNotes
                  :name="props.row.business_name"
                  :item="props.row"
                  :id="props.row._id"
                />
              </div>
            </q-td>
            <!-- tipo de cuenta -->
            <q-td key="accountType" :props="props">
              {{ props.row.accountType }}
            </q-td>
            <!-- numero de cliente -->
            <q-td key="customer_number" :props="props">
              {{ props.row.customer_number }}
            </q-td>

            <!-- industria -->
            <q-td key="industry" :props="props">
              {{ props.row.industry }}
            </q-td>
            <!-- contacto de persona -->
            <q-td key="contact_person_name" :props="props">
              {{ props.row.contact_person_name }}
            </q-td>
            <!-- numero de telefono -->
            <q-td key="phone_number" :props="props">
              {{ props.row.phone_number }}
            </q-td>
            <!-- direccion -->
            <q-td key="address" :props="props">
              {{ props.row.address }}
            </q-td>
            <!-- ciudad -->
            <q-td key="town" :props="props">
              {{ props.row.town }}
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
    </div>

    <div v-if="isHistorial">
      <AllHistory />
    </div>

    <q-dialog v-model="modalOpen" persistent>
      <q-card
        :style="
          modeHistory === false
            ? { width: '700px', maxWidth: '80vw' }
            : { width: '100%', maxWidth: '100vw' }
        "
        class="row"
      >
        <div class="bg-primary row justify-between q-pa-md col-12">
          <div class="text-white" style="font-size: 19px; font-weight: 500">
            <div class="row items-center">
              <div class="col-auto q-mx-sm">
                <q-icon size="2em" name="account_balance" color="white" />
              </div>
              <div class="col-auto text-white" v-if="!modeHistory">
                <b>{{ modeEdit ? "EDITAR CLIENTE" : "CREAR CLIENTE" }}</b>
              </div>
              <div class="col-auto text-primary" v-else>
                <b>GESTION DE COBRO</b>
              </div>
            </div>
          </div>
          <span
            class="material-icons text-white"
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

        <q-card-section
          class="q-pt-sm"
          :class="[modeHistory ? 'col-12 col-md-6' : 'col-12']"
        >
          <div class="q-pt-sm row q-col-gutter-sm">
            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b>TIPO DE CUENTA </b>
              </label>

              <q-select
                v-model="form.accountType"
                outlined
                dense
                color="primary"
                :options="accountType"
                :disable="modeHistory"
              />
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b>NUMERO DE CLIENTE </b>
              </label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.customer_number"
                :disable="modeHistory"
              />
            </div>

            <div class="col-12 col-md-6" v-if="modeHistory">
              <label>
                <b> <b class="text-negative">* </b>TIPO DE PAGO </b>
              </label>

              <q-select
                v-model="form.typePayment"
                outlined
                dense
                color="primary"
                :options="[
                  'Ninguno',
                  'Tarjeta de crédito o débito',
                  'ACH',
                  'Cheque',
                  'ATH',
                  'Depósito',
                  'Efectivo',
                ]"
                :disable="!modeHistory"
              />
            </div>

            <div class="col-12 col-md-6" v-if="modeHistory">
              <label>
                <b> <b class="text-negative">* </b> CANTIDAD DE PAGO </b>
              </label>
              <q-input
                type="number"
                outlined
                dense
                color="primary"
                v-model="form.amountPayment"
                :disable="!modeHistory"
              />
            </div>
            <div class="col-12 col-md-6" v-if="modeHistory">
              <label>
                <b> <b class="text-negative">* </b> NUMERO DE FACTURA </b>
              </label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.numberBill"
                :disable="!modeHistory"
              />
            </div>

            <div class="col-12 col-md-6" v-if="modeHistory">
              <label>
                <b>
                  <b class="text-negative">* </b> FECHA DE COMPROMISO DE PAGO
                </b>
              </label>
              <q-input
                type="date"
                outlined
                dense
                color="primary"
                v-model="form.paymentCommitmentDate"
                :disable="!modeHistory"
              />
            </div>
            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b> NOMBRE DE LA EMPRESA </b>
              </label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.business_name"
                :disable="modeHistory"
              />
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b>INDUSTRIA </b>
              </label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.industry"
                :disable="modeHistory"
              />
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b>
                  <b class="text-negative">* </b> NOMBRE DE LA PERSONA DE
                  CONTACTO
                </b>
              </label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.contact_person_name"
                :disable="modeHistory"
              />
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b> NUMERO DE TELEFONO </b>
              </label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.phone_number"
                mask="(###) ### - ####"
                fill-mask
                :disable="modeHistory"
              />
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b>CIUDAD </b>
              </label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.town"
                :disable="modeHistory"
              />
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b>DIRECCION </b>
              </label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.address"
                :disable="modeHistory"
              />
            </div>

            <div class="col-12 col-md-6" v-if="modeHistory">
              <label>
                <b> <b class="text-negative">* </b>TIPO DE GESTION </b>
              </label>

              <q-select
                v-model="form.typeOfManagement"
                outlined
                dense
                color="primary"
                :options="[
                  'No contestada',
                  'Pago agendado',
                  'Llamadas reagendada',
                  'Cobrado',
                  'Envio vendedor',
                  'Llamadas recibidas cobradas',
                  'Llamadas recibidas',
                ]"
                :disable="!modeHistory"
              />
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b>COMENTARIO </b>
              </label>
              <q-input
                type="textarea"
                outlined
                dense
                color="primary"
                v-model="form.note"
              />
            </div>

            <div class="col-12 q-my-sm text-center">
              <q-btn
                type="submit"
                color="negative"
                label="cancelar"
                icon="cancel"
                class="q-mx-sm"
                @click="
                  () => {
                    modalOpen = false;
                  }
                "
              />
              <q-btn
                v-if="modeHistory == false"
                type="submit"
                color="primary"
                label="guardar"
                icon="save"
                @click="save"
                :disable="
                  form.customer_number == '' ||
                  form.business_name == '' ||
                  form.industry == '' ||
                  form.contact_person_name == '' ||
                  form.phone_number == '' ||
                  form.accountType == '' ||
                  form.address == '' ||
                  form.town == ''
                "
              />

              <q-btn
                v-else
                type="submit"
                color="primary"
                label="guardar historial"
                icon="save"
                @click="saveHistory"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-section class="col-12 col-md-6" v-if="modeHistory">
          <History :id="id" :name="name" />
        </q-card-section>
      </q-card>
    </q-dialog>
    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo" @deleteGood="getClientsPaymentManagement" />
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from "vue";
import columns from "src/components/utils/columns";
import methodsHttp from "src/api/methodsHttp";
import TablePagination from "src/components/table/TablePagination.vue";
import moment from "moment";
import NotificationsVue from "src/components/utils/Notifications.vue";
import CreateNotes from "./CreateNotes.vue";
import Delete from "src/components/utils/Delete.vue";
import History from "./History.vue";
import AllHistory from "./AllHistory.vue";
import HistoryByOperator from "./HistoryByOperator.vue";
import PageHeaderCard from "../PageHeaderCard.vue";

const notify = ref(null);
const deleteInfo = ref(null);

const limit = ref(10);
const initial = ref(0);
const orderQuantity = ref(1);

const rows = ref([]);

const tableLoading = ref(false);

const initialPagination = ref(1);

const text = ref("");

const options = ref([5, 10, 20, 30, 100, 200, 300, 1000, 2000, 10000]);

const modalOpen = ref(false);
const modeEdit = ref(false);

const modeHistory = ref(false);

const id = ref(null);
const name = ref("");

const isHistorial = ref(false);

const form = ref({
  customer_number: "",
  business_name: "",
  industry: "",
  contact_person_name: "",
  phone_number: "",
  accountType: "",
  address: "",
  town: "",
  typePayment: "",
  amountPayment: "",
  numberBill: "",
  note: "",
  typeOfManagement: "",
});

const accountType = ref(["Comercial", "Biomedical"]);

const pagination = ref({
  page: 1,
  rowsPerPage: limit.value, // este se sincroniza con tu q-select
});
onMounted(() => {
  getClientsPaymentManagement();
});

const getClientsPaymentManagement = async () => {
  tableLoading.value = true;
  rows.value = [];
  const resp = await methodsHttp.getApi(
    `client-payment-management/getClientsPaymentManagement/${limit.value}/${initial.value}`
  );
  if (resp.ok) {
    rows.value = resp.clientsPaymentManagement;
    console.log(resp.clientsPaymentManagement);
    orderQuantity.value = Math.ceil(resp.count / limit.value);
    // TableFilter.value = resp.operadoras;
  }
  tableLoading.value = false;
};

watch(limit, (value) => {
  changePaginationValues();
  if (value) {
    pagination.value.rowsPerPage = value;
    rows.value = [];
    getClientsPaymentManagement();
    // getClientsPaymentManagementBySearch(value);
  }
  // else {
  //   getClientsPaymentManagement();
  // }
});

watch(initialPagination, (page) => {
  initial.value = (page - 1) * limit.value;

  // si hay búsqueda activa, usa search; si no, carga normal
  if ((text.value || "").trim()) {
    getClientsPaymentManagementBySearch(text.value.trim());
  } else {
    getClientsPaymentManagement();
  }
});

watch(text, (value) => {
  changePaginationValues();
  if (value) {
    rows.value = [];

    getClientsPaymentManagementBySearch(value);
  } else {
    getClientsPaymentManagement();
  }
});

const changePaginationValues = async () => {
  initial.value = 0;
  // limit.value = 10;
  initialPagination.value = 1;
};

const getClientsPaymentManagementBySearch = async (value) => {
  tableLoading.value = true;
  const resp = await methodsHttp.postApi(
    `client-payment-management/getClientsPaymentManagementBySearch/${limit.value}/${initial.value}`,
    { text: value.trim() }
  );

  if (resp.ok) {
    rows.value = resp.clientsPaymentManagement;
    orderQuantity.value = Math.ceil(resp.count / limit.value);
  }
  tableLoading.value = false;
};

const save = async () => {
  let url = "";
  if (!modeEdit.value) {
    url = "client-payment-management/createClientsPaymentManagement";
  } else {
    url = `client-payment-management/updateClientsPaymentManagement/${id.value}`;
  }

  const resp = await methodsHttp.postApi(url, {
    ...form.value,
  });
  if (resp.ok) {
    getClientsPaymentManagement();
    notify.value?.showNotifyGood(resp.mensaje);
    clear();
    modeEdit.value = false;
    modalOpen.value = false;
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
};

const saveHistory = async () => {
  let url = "client-payment-management/createClientsPaymentNotes";
  const resp = await methodsHttp.postApi(url, {
    ...form.value,
    clientsPaymentManagement: id.value,
  });
  if (resp.ok) {
    notify.value?.showNotifyGood(resp.mensaje);
    modeEdit.value = false;
    modeHistory.value = false;
    modalOpen.value = false;
    clear();
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
};

const clear = () => {
  form.value = {
    customer_number: "",
    business_name: "",
    industry: "",
    contact_person_name: "",
    phone_number: "",
    accountType: "",
    address: "",
    town: "",
    typePayment: "",
    amountPayment: "",
    numberBill: "",
    note: "",
    typeOfManagement: "",
  };
};

const openModalEdit = (item) => {
  form.value.customer_number = item.customer_number;
  form.value.business_name = item.business_name;
  form.value.industry = item.industry;
  form.value.contact_person_name = item.contact_person_name;
  form.value.phone_number = item.phone_number;
  form.value.accountType = item.accountType;
  form.value.address = item.address;
  form.value.town = item.town;
  modeEdit.value = true;
  modeHistory.value = false;

  modalOpen.value = true;

  id.value = item._id;
};

const addHistory = (item) => {
  form.value.customer_number = item.customer_number;
  form.value.business_name = item.business_name;
  form.value.industry = item.industry;
  form.value.contact_person_name = item.contact_person_name;
  form.value.phone_number = item.phone_number;
  form.value.accountType = item.accountType;
  form.value.address = item.address;
  form.value.town = item.town;
  modeEdit.value = false;
  modeHistory.value = true;

  modalOpen.value = true;

  id.value = item._id;
  name.value = item.business_name;
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: "client-payment-management/deleteClientsPaymentManagement",
  };

  deleteInfo.value?.openDelete(data);
};
</script>

<style>
.th {
  font-weight: bold;
}

.pm-toggleWrap {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.pm-toggle {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* Un poquito más “premium” */
.pm-toggle :deep(.q-btn) {
  padding: 8px 14px;
}

@media (max-width: 700px) {
  .pm-toggleWrap {
    justify-content: center;
  }

  .pm-toggle {
    width: 100%;
    max-width: 520px;
  }

  .pm-toggle :deep(.q-btn) {
    flex: 1;
    justify-content: center;
  }
}

</style>
