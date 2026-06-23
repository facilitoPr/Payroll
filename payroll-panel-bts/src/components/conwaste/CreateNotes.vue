<template>
  <div
    @click="
      {
        openModalCreateNote = true;
        getClientsPaymentNotes();
      }
    "
  >
    {{ name }}
  </div>
  <q-dialog
    v-model="openModalCreateNote"
    persistent
    :maximized="true"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card>
      <div class="bg-white row justify-between q-pa-md">
        <div class="text-primary" style="font-size: 19px; font-weight: 500">
          <div class="row items-center">
            <div class="col-auto q-mx-sm">
              <q-icon size="2em" name="history" color="primary" />
            </div>
            <div class="col-auto text-primary">
              <b>HISTORIAL</b>
            </div>
          </div>
        </div>
        <span
          class="material-icons text-negative"
          style="font-size: 23px; cursor: pointer"
          @click="
            () => {
              openModalCreateNote = false;
            }
          "
        >
          cancel
        </span>
      </div>

      <q-card-section class="bg-white q-pa-md">
        <!-- <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-2">
            <q-btn
              color="primary"
              label="AGREGAR NOTA"
              style="width: 100%; height: 40px"
              icon="add"
              @click="modalOpen = true"
            />
          </div>
        </div> -->

        <!-- <div class="row q-col-gutter-sm q-mt-md">
          <div v-for="(item, index) in rows" :key="index" class="col-3">
            <q-card
              flat
              class=""
              style="height: 120px"
              :style="getNoteStyle(index)"
            >
              <q-card-section class="q-pa-sm borderes">
                <div class="row">
                  <div class="col">
                    <div class="row justify-between">
                      <div class="col-auto text-grey-7">Nota</div>
                      <small class="col-auto text-primary">{{
                        item.date
                      }}</small>
                    </div>

                    <div class="col note-scroll-box">
                      {{ item.note }}
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
                      @click="copyToClipboard(item.note)"
                    />
                    <q-btn
                      flat
                      round
                      dense
                      icon="edit"
                      size="sm"
                      color="primary"
                      @click="openModalEdit(item)"
                    />
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      size="sm"
                      color="red"
                      @click="openModalDelete(item)"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div> -->
        <q-table
          flat
          row-key="_id"
          :title="`HISTORIAL DE ${name}`"
          :rows="rows"
          :columns="columns.conwasteHistorial()"
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
      </q-card-section>
    </q-card>
  </q-dialog>

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

          <!-- <div class="col-12 col-md-6">
            <label>
              <b> <b class="text-negative">* </b>FECHA DE NOTIFICAR </b>
            </label>
            <q-input
              type="date"
              outlined
              dense
              color="primary"
              v-model="form.date"
            />
          </div> -->

          <!-- <div class="col-12 q-my-sm text-center">
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
              type="submit"
              color="primary"
              label="guardar"
              icon="save"
              @click="save"
              :disable="form.note == '' || form.date == ''"
            />
          </div> -->
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <NotificationsVue ref="notify" />
  <Delete ref="deleteInfo" @deleteGood="getClientsPaymentNotes" />
</template>
<script setup>
import { defineProps, onMounted, ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";

moment.locale("es-do");
import Delete from "src/components/utils/Delete.vue";

import { useQuasar } from "quasar";

const $q = useQuasar();

const notify = ref(null);
const deleteInfo = ref(null);

const colorList = ["#FBE9E7", "#E8F5E9", "#E3F2FD", "#FFF8E1", "#F3E5F5"];

const getNoteStyle = (index) => {
  const color = colorList[index % colorList.length];
  return `background-color: ${color}; border-radius: 8px`;
};

const openModalCreateNote = ref(false);

const form = ref({
  note: "",
  date: "",
});

const modalOpen = ref(false);
const modeEdit = ref(false);

const rows = ref([]);

const id = ref(null);
const number = ref(0);

const props = defineProps({
  item: {
    type: Object,
    default: null,
  },
  name: {
    type: String,
    default: "",
  },
  id: {
    type: String,
    default: "",
  },
});
// getClientsPaymentNotes

const clear = () => {
  form.value.note = "";
  form.value.date = "";
};

const getClientsPaymentNotes = async () => {
  //   rows.value = [];
  const resp = await methodsHttp.getApi(
    `client-payment-management/getClientsPaymentNotes/${props.id}`
  );
  if (resp.ok) {
    rows.value = resp.clientsPaymentNotes;
    console.log(resp.clientsPaymentNotes);
  }
};
const save = async () => {
  let url = "";
  if (!modeEdit.value) {
    url = "client-payment-management/createClientsPaymentNotes";
  } else {
    url = `client-payment-management/updatepClientsPaymentNotes/${id.value}`;
  }

  const resp = await methodsHttp.postApi(url, {
    ...form.value,
    clientsPaymentManagement: props.id,
  });
  if (resp.ok) {
    // getClientsPaymentManagement();
    notify.value?.showNotifyGood(resp.mensaje);
    clear();
    modeEdit.value = false;
    modalOpen.value = false;
    getClientsPaymentNotes();
    console.log(resp);
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
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

const openModalEdit = (item) => {
  form.value.note = item.note;
  form.value.date = item.date;
  modalOpen.value = true;
  id.value = item._id;
  modeEdit.value = true;
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: "client-payment-management/deleteClientsPaymentNotes",
  };

  deleteInfo.value?.openDelete(data);
};

const seeComment = (note) => {
  console.log(Math.floor(Math.random() * 5));
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
  cursor: help; /* Cambia el cursor para indicar “tooltip” */
}
</style>