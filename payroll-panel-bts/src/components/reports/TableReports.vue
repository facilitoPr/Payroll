<template>
  <div class="bg-white">
    <!-- table -->
    <div>
      <q-table
        :loading="props.tableLoading"
        flat
        row-key="_id"
        :title="'CITAS POR DIA - ' + props?.rows?.length"
        :rows="props.rows"
        :columns="columns.columnsReminders()"
      
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="name" :props="props">
              {{ props.row?.user?.name }}
            </q-td>

            <q-td
              key="name"
              :props="props"
              style="cursor: pointer"
              @click="openDetailsModal(props.row)"
            >
              {{ props.row?.comercial?.MemberFullname }}
            </q-td>
            <q-td
              key="name"
              :props="props"
              style="cursor: pointer"
              @click="openDetailsModal(props.row)"
            >
              {{ props.row?.comercial?.memberIdentificationNumber }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row?.comercial?.HomePhone }}
            </q-td>

            <q-td key="name" :props="props">
              {{
                moment(`${props.row?.date} ${props.row?.hour}`).format("LLLL")
              }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row?.zone?.name }}
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>

    <CreateUserModal
      :v-model="openModalUser"
      :openModal="openModalUser"
      :userData="userData"
      :getPatients="getPatients"
      @createdUser="handleCreatedUser"
      @update:openModal="openModalUser = $event"
      :readOnly="true"
    />

    <CreateAppointmentsModal
      :v-model="openModalAppoitment"
      :openModal="openModalAppoitment"
      :reminderData="reminderData"
      @update:openModal="openModalAppoitment = $event"
      :editMode="editMode"
      :getPatientHistory="props.getPatientHistory"
      @update:editMode="editMode = $event"
      :comercial="comercial"
      :getReminders="props.getReminders"
    />
    <NotificationsVue ref="notify" />
    <Delete
      ref="deleteInfo"
      @deleteGood="props.getPatientHistory(comercial?._id)"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import Delete from "src/components/utils/Delete.vue";
import ActionsButtons from "src/components/table/ActionsButtons.vue";
import ImagenVue from "src/components/utils/Imagen.vue";
import CreateUserModal from "../asignments/CreateUserModal.vue";
import CreateAppointmentsModal from "../asignments/CreateAppointmentsModal.vue";
import moment from "moment";

const notify = ref(null);
const deleteInfo = ref(null);
const statusOptions = ref([]);
const statusOptionsCompleted = ref([]);
const openModalUser = ref(false);
const openModalAppoitment = ref(false);
const userData = ref(null);
const comercial = ref(null);
const reminderData = ref(null);
const editMode = ref(false);

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  tableLoading: {
    type: Boolean,
    required: true,
  },
  getPatientHistory: {
    type: Function,
    required: false,
  },
  isHistory: {
    type: Boolean,
    required: false,
  },
  getReminders: {
    type: Function,
    required: false,
  },
});

onMounted(() => {
  getStatus();
});

const limitHtmlContent = (html, limit) => {
  // Crear un contenedor temporal para eliminar las etiquetas HTML y obtener texto puro
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const plainText = tempDiv.textContent || tempDiv.innerText || "";

  // Limitar el contenido al número de caracteres especificado
  return plainText.length > limit
    ? plainText.substring(0, limit) + "..."
    : plainText;
};

const openDetailsModal = (props) => {
  openModalUser.value = true;
  userData.value = { ...props.patient, comercial: props?.comercial?._id };
};

const getBackgroundColor = (status) => {
  switch (status?.code) {
    case "NOTCONFIRMED":
      return { backgroundColor: "#C4D9EE" };
    case "NOTCONTACTED":
      return { backgroundColor: "#A8AAA9" };
    case "CONFIRMED":
      return { backgroundColor: "#88ACAD" };
    default:
      return { backgroundColor: "#ffffff" };
  }
};

const openModalEdit = (item) => {
  comercial.value = item.comercial;
  openModalAppoitment.value = true;
  editMode.value = true;
  reminderData.value = { ...item };
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: "reminders/deteleReminder",
  };

  deleteInfo.value?.openDelete(data);
};

const getStatus = async () => {
  const resp = await methodsHttp.getApi(`status/getReminderStatus`);
  if (resp.ok) {
    statusOptions.value = resp.status;
    statusOptionsCompleted.value = resp.statusCompleted;
  }
};

const changeStatus = async (id, item, isStatus) => {
  try {
    console.log(item);
    props.tableLoading = true;
    const resp = await methodsHttp.putApi(`reminders/updateReminder/${id}`, {
      code: item?.code,
      isStatus,
    });

    if (resp?.ok) {
      notify.value?.showNotifyGood(resp.mensaje);
      // props.getComercial();
    } else {
      notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
    }
  } catch (error) {
    notify.value?.showNotifyBad("Error al cambiar estado");
    console.error("Error en la operación save:", error);
  } finally {
    props.tableLoading = false;
  }
};

const menuItems = ref([
  {
    icon: "edit",
    text: "EDITAR",
    color: "primary",
    action: openModalEdit,
  },
  {
    icon: "delete",
    text: "ELIMINAR",
    color: "negative",
    action: openModalDelete,
  },
]);
</script>

<style scoped></style>
