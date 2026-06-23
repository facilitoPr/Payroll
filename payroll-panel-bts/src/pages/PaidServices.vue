<template>
  <div class="bg-white q-pa-sm">
    <!-- Título y descripción -->
    <div class="q-mt-md text-center">
      <h5 class="q-ma-xs">Servicios Pagos</h5>
      <p>
        Aquí puedes ver las solicitudes de servicios que los usuarios han
        llenado y pagado.
      </p>
    </div>

    <div>
      <q-table
        :loading="tableLoading"
        flat
        row-key="_id"
        :rows="rows"
        :columns="columns.columnsServiceAnswers()"
        hide-pagination
        :rows-per-page-options="[10]"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="actions" :props="props">
              <ActionsButtons :menuItems="menuItems" :data="props.row" />
            </q-td>

            <q-td key="image" :props="props">
              <ImagenVue
                :img="
                  props.row.services.img
                    ? props.row.services.img
                    : 'https://prorpeties-file.sfo3.digitaloceanspaces.com/conjunto-vacio.png'
                "
                style="
                  cursor: pointer;
                  width: 50px;
                  height: 50px;
                  overflow: hidden;
                "
              />
            </q-td>

            <q-td
              key="name"
              :props="props"
              class="cursor-pointer"
              @click="showDetails(props.row)"
            >
              {{ props.row?.services.name }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row?.patient.name }}
            </q-td>

            <q-td
              key="name"
              :props="props"
              :class="{
                'text-green': props.row.status.code === 'FINISHED',
                'text-warning': props.row.status.code === 'WAITINGDOCTOR',
              }"
            >
              {{ props.row.status.name }}
            </q-td>

            <q-td key="name" :props="props">
              {{ money.formatter(props.row?.amountPaid) }}
            </q-td>

            <q-td key="name" :props="props">
              {{ moment(props.row?.created_at).format("LL") }}
            </q-td>

            <q-td key="name" :props="props">
              {{ moment(props.row?.updated_at).format("LL") }}
            </q-td>
          </q-tr>
        </template>
      </q-table>

      <PaidServiceModal
        :openModal="openModal"
        @update:openModal="openModal = $event"
        :data="selectedAnswer"
        :confirmFinish="confirmFinish"
      />
    </div>

    <q-dialog v-model="confirmDialog" persistent>
      <q-card>
        <q-card-section class="text-h6">
          ¿Estás seguro de enviar este servicio al cliente?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn
            flat
            label="Confirmar"
            color="green"
            @click="handleConfirmFinish"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Notificaciones y componentes adicionales -->
    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo" @deleteGood="getServiceAnswerByDoctor()" />
  </div>
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import { ref, onMounted } from "vue";
import Delete from "src/components/utils/Delete.vue";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import ImagenVue from "src/components/utils/Imagen.vue";
import ActionsButtons from "src/components/table/ActionsButtons.vue";
import PaidServiceModal from "src/components/services/PaidServiceModal.vue";
import money from "src/components/utils/formatter";
import moment from "moment";

const tableLoading = ref(false);
const rows = ref([]);
const notify = ref(null);
const selectedAnswer = ref({});
const openModal = ref(false);
const confirmDialog = ref(false);
const selectedIdToFinish = ref(null);

onMounted(() => {
  getServiceAnswerByDoctor();
});

// Función para obtener las respuestas del servicio
const getServiceAnswerByDoctor = async () => {
  tableLoading.value = true; // Mostrar indicador de carga
  try {
    const resp = await methodsHttp.getApi("services/getServiceAnswerByDoctor");

    if (resp.ok) {
      rows.value = resp.answers; // Asignar las respuestas a las filas
    } else {
      console.error("Error al cargar los servicios:", resp.error);
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
  } finally {
    tableLoading.value = false; // Ocultar indicador de carga
  }
};

// Función para mostrar detalles de un servicio
const showDetails = (row) => {
  selectedAnswer.value = row;
  openModal.value = true;
};

const confirmFinish = (row) => {
  selectedIdToFinish.value = row._id;
  confirmDialog.value = true;
};

const finishServiceAnswer = async (id) => {
  try {
    const url = `services/finishServiceAnswer`;
    const resp = await methodsHttp.putApi(url, { id });

    if (resp.ok) {
      notify.value.showNotifyGood("Servicio enviado al cliente exitosamente");
      await getServiceAnswerByDoctor();
    } else {
      notify.value.showNotifyBad("Error al actualizar el servicio");
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
  } finally {
    tableLoading.value = false; // Ocultar indicador de carga
  }
};

const handleConfirmFinish = async () => {
  confirmDialog.value = false;
  await finishServiceAnswer(selectedIdToFinish.value);
  selectedIdToFinish.value = null;
};

const menuItems = ref([
  {
    icon: "send",
    text: "ENVIAR AL CLIENTE",
    color: "green",
    action: confirmFinish,
  },
  // {
  //   icon: "delete",
  //   text: "ELIMINAR",
  //   color: "negative",
  //   action: () => {},
  // },
]);
</script>
