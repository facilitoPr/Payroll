<template>
  <div class="bg-white">
    <!-- table -->
    <div>
      <q-table
        :loading="props.tableLoading"
        flat
        row-key="_id"
        title="Tipos de inputs"
        :rows="props.rows"
        :columns="columns.columnsTypeOfForm()"
        :pagination="{ rowsPerPage: -1 }"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="name" :props="props">
              {{ props.row?.name }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row?.code }}
            </q-td>

            <q-td key="actions" :props="props">
              <ActionsButtons :menuItems="menuItems" :data="props.row" />
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>

    <CreateTypeOfFormModal
      :openModal="openModal"
      :getTypeOfForm="getTypeOfForm"
      :formData="formData"
      :editMode="editMode"
      @update:openModal="openModal = $event"
    />

    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo" @deleteGood="props.getTypeOfForm()" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from "vue";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import Delete from "src/components/utils/Delete.vue";
import ActionsButtons from "src/components/table/ActionsButtons.vue";
import CreateTypeOfFormModal from "./CreateTypeOfFormModal.vue";

const notify = ref(null);
const deleteInfo = ref(null);
const formData = ref(null);
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
  getTypeOfForm: {
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

const openModalEdit = (item) => {
  openModal.value = true;
  editMode.value = true;
  formData.value = { ...item };
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: "services/deleteTypeOfForm",
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
