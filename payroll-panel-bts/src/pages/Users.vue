<template>
  <div class="bg-white q-pa-sm">
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-auto col-md-auto row items-center">
        <q-btn
          color="primary"
          label="Crear usuarios"
          style="width: 100%; height: 40px"
          icon="add"
          @click="create"
        />
      </div>

      <div class="col-12 col-sm-3">
        <q-select
          v-model="rolSelected"
          label="ROLES"
          option-label="name"
          outlined
          dense
          color="primary"
          :options="roles"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <div class="col-12 col-sm-3 col-md-4">
        <q-input
          outlined
          dense
          label="BUSCAR USUARIOS"
          color="primary"
          @keyup="search"
          v-model="text"
        >
          <template v-slot:append>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
      </div>
    </div>

    <div class="q-my-md">
      <q-separator />
    </div>

    <!-- modal -->
    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 550px; max-width: 80vw">
          <q-inner-loading
            :showing="isLoading"
            label="Enviando..."
            label-class="text-blue-11"
            label-style="font-size: 1.1em"
          />
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="add" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b>{{ mode ? "EDITAR USUARIOS" : "CREAR USUARIOS" }}</b>
                </div>
              </div>

              <!-- groups -->
            </div>
            <span
              class="material-icons text-negative"
              style="font-size: 23px; cursor: pointer"
              @click="openModal = false"
            >
              cancel
            </span>
          </div>

          <q-card-section class="q-pt-sm">
            <div class="q-pt-sm row q-col-gutter-sm">
              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> NOMBRE COMPLETO </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.name">
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> EMAIL </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.email">
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> TELEFONO </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.phone">
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> ROL </b>
                </label>
                <q-select
                  v-model="form.rol"
                  label="Roles"
                  option-value="_id"
                  option-label="name"
                  outlined
                  dense
                  color="primary"
                  :options="roles"
                  emit-value
                  map-options
                />
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> CONTRASEÑA </b>
                </label>

                <q-input
                  v-model="form.password"
                  outlined
                  dense
                  :type="isPassword ? 'password' : 'text'"
                >
                  <template v-slot:append>
                    <q-icon
                      :name="isPassword ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="isPassword = !isPassword"
                    />
                  </template>
                </q-input>
              </div>

              <div class="col-12 q-my-sm text-center">
                <q-btn
                  type="submit"
                  color="negative"
                  label="cancelar"
                  icon="cancel"
                  class="q-mx-sm"
                  @click="openModal = false"
                />

                <q-btn
                  type="submit"
                  color="primary"
                  label="guardar"
                  icon="save"
                  @click="save"
                  :disable="
                    form.name == '' ||
                    form.rol == '' ||
                    form.email == '' ||
                    (!mode && form.password == '')
                  "
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>

    <!-- table -->
    <div>
      <q-table
        :loading="tableLoading"
        flat
        row-key="_id"
        title="USUARIOS"
        :rows="rows"
        :columns="columns.columnsUsers()"
        hide-pagination
        dense
        max-pages="10"
        :rows-per-page-options="[limit]"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="image" :props="props">
              <ImagenVue
                :img="
                  props.row.img
                    ? props.row.img
                    : 'https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp'
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
              {{ props.row?.rol?.name }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.name }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.email }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.phone }}
            </q-td>

            <q-td key="name" :props="props" @click="updateState(props.row)">
              <div v-if="props.row.isActived">
                <q-badge
                  color="secondary"
                  label="ACTIVE"
                  style="cursor: pointer"
                />
              </div>
              <div v-else>
                <q-badge
                  color="negative"
                  label="INACTIVE"
                  style="cursor: pointer"
                />
              </div>
            </q-td>

            <q-td key="actions" :props="props">
              <!-- <q-icon name="menu" color="primary" size="25px" style="cursor: pointer">
                                <q-menu transition-show="flip-right" transition-hide="flip-left">
                                    <q-list style="min-width: 100px" @click="openModalEdit(props.row)">
                                        <q-item clickable class="row items-center">
                                            <div class="col-auto">
                                                <q-icon name="edit" color="primary" size="25px" />
                                            </div>
                                            <div class="q-px-sm col-auto">EDITAR</div>
                                        </q-item>
                                    </q-list>
                                    <q-list style="min-width: 100px" @click="openModalDelete(props.row)">
                                        <q-item clickable class="row items-center">
                                            <div class="col-auto">
                                                <q-icon name="delete" color="negative" size="25px" />
                                            </div>
                                            <div class="q-px-sm col-auto">ELIMINAR</div>
                                        </q-item>
                                    </q-list>
                                </q-menu>
                            </q-icon> -->

              <ActionsButtons :menuItems="menuItems" :data="props.row" />
            </q-td>
          </q-tr>
        </template>
      </q-table>

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
    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo" @deleteGood="getUsers" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import Delete from "src/components/utils/Delete.vue";
import ImagenVue from "src/components/utils/Imagen.vue";
import ActionsButtons from "src/components/table/ActionsButtons.vue";
import TablePagination from "src/components/table/TablePagination.vue";

const limit = ref(10);
const initial = ref(0);

const orderQuantity = ref(1);
const initialPagination = ref(1);

const text = ref("");
const notify = ref(null);
const deleteInfo = ref(null);

const rows = ref([]);
const TableFilter = ref([]);
const tableLoading = ref(false);
const openModal = ref(false);
const mode = ref(false);
const residentId = ref(null);
const form = ref({
  name: "",
  email: "",
  phone: "",
  password: "",
  rol: null,
});
const isPassword = ref(true);
const roles = ref([]);
const rolSelected = ref(null);
const isLoading = ref(false);

onMounted(() => {
  getUsers();
  getRoles();
});

watch(rolSelected, async (value) => {
  if (rolSelected.value) {
    text.value = "";
    getUsersByRole(value.code);
  }
});

watch(initialPagination, async (value) => {
  initial.value = (await value) * 10;
  if (value == 1) {
    initial.value = 0;
    if (rolSelected.value) {
      return getUsersByRole(rolSelected.value.code);
    }

    if (text.value) {
      return search();
    }

    getUsers();
  } else {
    initial.value = value * 10 - 10;
    if (rolSelected.value) {
      return getUsersByRole(rolSelected.value.code);
    }

    if (text.value) {
      return search();
    }

    getUsers();
  }
});

const clear = () => {
  form.value.name = "";
  form.value.email = "";
  form.value.phone = "";
  form.value.password = "";
  form.value.rol = null;
};

const getUsers = async () => {
  tableLoading.value = true;
  rolSelected.value = null;
  text.value = "";
  let resp = await methodsHttp.getApi(
    `user/getUsers/${limit.value}/${initial.value}`
  );

  if (resp.ok) {
    rows.value = resp.users;
    TableFilter.value = resp.users;
    orderQuantity.value = Math.ceil(resp.count / 10);
  }
  tableLoading.value = false;
};

const save = async () => {
  isLoading.value = true;
  if (!mode.value) {
    let resp = await methodsHttp.postApi("user/createUser", { ...form.value });
    if (resp.ok) {
      openModal.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
      getUsers();
      clear();
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  } else {
    let resp = await methodsHttp.putApi(`user/updateUser/${residentId.value}`, {
      ...form.value, application: "66ecb7991ff7c5fc69e69046"
    });
    if (resp.ok) {
      openModal.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
      getUsers();
      clear();
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  }
  isLoading.value = false;
};

const getUsersByRole = async (code) => {
  tableLoading.value = true;
  let resp = await methodsHttp.getApi(
    `user/getUsersByRole/${limit.value}/${initial.value}/${code}`
  );

  if (resp.ok) {
    rows.value = resp.users;
    TableFilter.value = resp.users;
    orderQuantity.value = Math.ceil(resp.count / 10);
  }
  tableLoading.value = false;
};

const getRoles = async () => {
  let resp = await methodsHttp.getApi(`rol/getRoles`);

  if (resp.ok) {
    roles.value = resp.roles;
  }
};

const create = () => {
  mode.value = false;
  clear();
  openModal.value = true;
};

const openModalEdit = (item) => {
  form.value.name = item.name;
  form.value.email = item.email;
  form.value.phone = item.phone;
  form.value.rol = item.rol._id;
  mode.value = true;
  openModal.value = true;
  residentId.value = item._id;
};

const updateState = async (item) => {
  tableLoading.value = true;
  let resp = await methodsHttp.putApi(`user/updateUser/${item._id}`, {
    isActived: !item.isActived,
  });
  if (resp.ok) {
    openModal.value = false;
    notify.value?.showNotifyGood(resp.mensaje);
    getUsers();
    clear();
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
  tableLoading.value = false;
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: "user/deleteUser",
  };

  deleteInfo.value?.openDelete(data);
};

const search = async () => {
  console.log(text.value);
  rolSelected.value = null;
  if (text.value == "") {
    getUsers();
  } else {
    let resp = await methodsHttp.postApi(
      `user/searchUsers/${limit.value}/${initial.value}`,
      { text: text.value }
    );
    if (resp.ok) {
      rows.value = resp.users;
      orderQuantity.value = Math.ceil(resp.count / 10);
      // TableFilter.value = resp.products;
    }
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
