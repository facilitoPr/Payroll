<template>
  <div class="bg-white">
    <!-- table -->
    <div>
      <q-table
        :loading="props.tableLoading"
        flat
        row-key="_id"
        title="Tiendas"
        :rows="props.rows"
        :columns="columns.columnsStores()"
        hide-pagination
        :rows-per-page-options="[10]"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="name" :props="props" style="overflow: hidden">
              <ImagenVue
                :img="
                  props.row.img
                    ? props.row.img
                    : 'https://plus-nautic.nyc3.digitaloceanspaces.com/caja.png'
                "
                style="cursor: pointer; width: 50px; height: 50px"
              />
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row?.application?.name }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.name }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.email }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row?.zone?.name }}
            </q-td>
            <q-td key="name" :props="props" class="description-cell">
              {{ props.row.address }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.zip }}
            </q-td>
            <q-td key="name" :props="props"> {{ props.row.phone }}$ </q-td>

            <q-td key="name" :props="props" @click="updateState(props.row)">
              <div v-if="!props.row.isActived">
                <q-badge
                  color="negative"
                  label="INACTIVE"
                  style="cursor: pointer"
                />
              </div>
              <div v-else>
                <q-badge
                  color="secondary"
                  label="ACTIVE"
                  style="cursor: pointer"
                />
              </div>
            </q-td>

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
                  <!-- edit -->
                  <q-list
                    style="min-width: 100px"
                    @click="openModalEdit(props.row)"
                  >
                    <q-item clickable class="row items-center">
                      <div class="col-auto">
                        <q-icon name="edit" color="primary" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">EDIT</div>
                    </q-item>
                  </q-list>

                  <!-- delete -->
                  <q-list
                    style="min-width: 100px"
                    @click="openModalDelete(props.row)"
                  >
                    <q-item clickable class="row items-center">
                      <div class="col-auto">
                        <q-icon name="delete" color="negative" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">DELETE</div>
                    </q-item>
                  </q-list>
                  <!-- imagen -->
                </q-menu>
              </q-icon>
              <!-- <q-btn dense icon="menu"> </q-btn> -->
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>

    <!-- <CreateUserModal :v-model="openModalUser" :openModal="openModalUser" :userData="userData"
            :getPatients="getPatients" @createdUser="handleCreatedUser" @update:openModal="openModalUser = $event"
            :readOnly="true" /> -->

    <!-- 
        <CreateAppointmentsModal :v-model="openModalAppoitmnet" :openModal="openModalAppoitmnet" :comercial="comercial"
            :reminderData="reminderData" :editMode="true" @update:openModal="openModalAppoitmnet = $event" /> -->

    <CreateStoreModal
      :v-model="openModal"
      :openModal="openModal"
      :mode="mode"
      :getStores="props.getStores"
      @update:openModal="openModal = $event"
      @update:mode="mode = $event"
      :store="store"
    />

    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo"  />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import Delete from "src/components/utils/Delete.vue";
import ImagenVue from "src/components/utils/Imagen.vue";
import CreateStoreModal from "src/components/stores/CreateStoreModal.vue";

const notify = ref(null);
const deleteInfo = ref(null);
const statusOptions = ref([]);
const statusOptionsCompleted = ref([]);

const store = ref({});
const mode = ref(false);

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  tableLoading: {
    type: Boolean,
    required: true,
  },
  isHistory: {
    type: Boolean,
    required: false,
  },
  getStores: {
    type: Function,
    required: true,
  },
  openModal: {
    type: Boolean,
    required: true,
  },
});

const openModal = ref(props.openModal);
const emit = defineEmits(["update:openModal"]); // Agregar 'createdUser' al definir los eventos

watch(
  () => props.openModal,
  (newVal) => {
    openModal.value = newVal;
  }
);

watch(openModal, (newVal) => {
  emit("update:openModal", newVal);
});

onMounted(() => {
  getStatus();
});

const openModalEdit = (item) => {
  store.value = item;
  openModal.value = true;
  mode.value = true;
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: "remindersTypes/deteleReminderType",
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

const updateState = async (item) => {
  try {
    console.log(item);
    props.tableLoading = true;
    const resp = await methodsHttp.putApi(`stores/updateStore/${item._id}`, {
      isActived: !item.isActived,
    });

    if (resp?.ok) {
      notify.value?.showNotifyGood(resp.mensaje);
      props.getStores();
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
