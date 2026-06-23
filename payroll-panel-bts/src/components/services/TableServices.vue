<template>
  <div class="bg-white">
    <!-- table -->
    <div>
      <q-table
        :loading="props.tableLoading"
        flat
        row-key="_id"
        title="Servicios"
        :rows="props.rows"
        :columns="columns.columnsServices()"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="image" :props="props">
              <ImagenVue
                :img="
                  props.row.img
                    ? props.row.img
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

            <q-td key="name" :props="props">
              {{ props.row?.application?.name }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row?.name }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row?.code }}
            </q-td>

            <q-td key="name" :props="props"> ${{ props.row?.price }} </q-td>

            <q-td key="name" :props="props">
              <div
                v-if="props.row?.description"
                style="max-height: 50px; overflow: hidden"
              >
                <div v-html="limitHtmlContent(props.row.description, 20)"></div>
              </div>
            </q-td>

            <q-td key="actions" :props="props">
              <ActionsButtons :menuItems="menuItems" :data="props.row" />
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>

    <CreateServiceModal
      :openModal="openModal"
      :getServices="getServices"
      :serviceData="serviceData"
      :editMode="editMode"
      @update:openModal="openModal = $event"
    />

    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo" @deleteGood="props.getServices()" />
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
import CreateServiceModal from "./CreateServiceModal.vue";

const notify = ref(null);
const deleteInfo = ref(null);
const serviceData = ref(null);
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
  getServices: {
    type: Function,
    required: false,
  },
  openModal: {
    type: Boolean,
    required: true,
  },
});

const openModal = ref(props.openModal);
const emit = defineEmits(["update:openModal"]);

watch(
  () => props.openModal,
  (newVal) => {
    openModal.value = newVal;
  }
);

watch(openModal, (newVal) => {
  emit("update:openModal", newVal);
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

const openModalEdit = (item) => {
  openModal.value = true;
  editMode.value = true;
  serviceData.value = { ...item };
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: "services/deleteService",
  };

  deleteInfo.value?.openDelete(data);
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
