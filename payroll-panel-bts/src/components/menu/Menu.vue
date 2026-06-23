
<template>
  <div>
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-3 col-md-4">
        <q-input
          outlined
          dense
          label="BUSCAR MENU"
          color="primary"
          @keyup="search"
          v-model="text"
        >
          <template v-slot:append>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-sm-auto col-md-auto row items-center">
        <q-btn
          color="primary"
          label="Agregar menu"
          style="width: 100%; height: 40px"
          icon="add"
          @click="createDepartments"
        />
      </div>
    </div>

    <div class="q-my-md">
      <q-separator />
    </div>

    <!-- table -->
    <div>
      <q-table
        :rows="rows"
        :columns="columns.columnsMenu()"
        title="MENU"
        row-key="name"
        :bordered="false"
        flat
        :rows-per-page-options="[10]"
        dense
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="name" :props="props">
              {{ props.row.name }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.rol.name }}
            </q-td>

            <q-td key="name" :props="props">
              <q-icon size="2.6em" :name="props.row.img" color="primary" />

            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.url }}
            </q-td>

            <q-td key="name" :props="props">
              <div v-if="props.row.isActive">
                <q-badge
                  color="secondary"
                  label="ACTIVO"
                  style="cursor: pointer"
                />
              </div>
              <div v-else>
                <q-badge
                  color="negative"
                  label="INACTIVO"
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
                  <!-- eliminar -->
                  <!-- <q-list
                    style="min-width: 100px"
                    @click="openModalDelete(props.row)"
                  >
                    <q-item clickable class="row items-center">
                      <div class="col-auto">
                        <q-icon name="delete" color="negative" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">ELIMINAR</div>
                    </q-item>
                  </q-list> -->
                  <!-- imagen -->
                </q-menu>
              </q-icon>
              <!-- <q-btn dense icon="menu"> </q-btn> -->
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>

    <!-- modal -->
    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 400px; max-width: 80vw">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="add" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b>{{
                    modo
                      ? "EDITAR TYPO DE INSTITUCION"
                      : "AGREGAR TYPO DE INSTITUCION"
                  }}</b>
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
              <div class="col-12">
                <label>
                  <b>SELECCIONAR DEPARTAMENTO</b>
                </label>
                <q-select
                  outlined
                  use-chips
                  dense
                  color="primary"
                  :options="roles"
                  v-model="rolesSelected"
                  option-label="name"
                >
                </q-select>
              </div>

              <div class="col-12 col-md-12">
                <label>
                  <b>
                    <b class="text-negative">* </b> NOMBRE
                  </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.name">
                </q-input>
              </div>

              <div class="col-12 col-md-12">
                <label>
                  <b> <b class="text-negative">* </b> IMAGEN </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.img">
                </q-input>
              </div>

              <div class="col-12 col-md-12">
                <label>
                  <b>
                    <b class="text-negative">* </b> URL
                  </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.url">
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                  <label>
                    <b> <b class="text-negative">* </b> ACTIVO </b>
                  </label>
                  <q-checkbox v-model="form.isActive" />
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
                  :disable="form.name == ''"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>

    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo" @deleteGood="getMenus" />
  </div>
</template>
<script setup>
import { onMounted, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import columns from "src/components/utils/columns";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Delete from "src/components/utils/Delete.vue";
import ModifiText from "src/components/utils/modifiText";

const notify = ref();
const deleteInfo = ref();

const roles = ref([]);
const rolesSelected = ref(null);
const departmentsSelectedFilter = ref(null);

watch(rolesSelected, (value) => {
  if (value != null) {
    form.value.rol = value._id;
  }
});

const openModal = ref(false);
const modo = ref(false);
const text = ref("");
const form = ref({
  name: "",
  img: "",
  url:"",
  rol:"",
  isActive: true,
});

const rows = ref([]);
const TableFilter = ref([]);

const tableLoading = ref(false);

const reset = () => {
  form.value.name = "";
  form.value.departments = "";
  form.value.departments = [];
  rolesSelected.value = null;
};

const id = ref(null);

const openModalEdit = (item) => {
  form.value.name = item.name;
  form.value.img = item.img;
  form.value.url = item.url;
  form.value.isActive = item.isActive;
  rolesSelected.value = item.rol;
  modo.value = true;
  openModal.value = true;
  id.value = item._id;
};

onMounted(() => {
  getMenus();
  getrol();
});

const getrol = async () => {
  let resp = await methodsHttp.getApi(`rol/getRoles`);
  if (resp.ok) {
    roles.value = resp.roles;
  }
};
const getMenus = async () => {
  tableLoading.value = true;
  let resp = await methodsHttp.getApi(`menu/getMenus`);
  if (resp.ok) {
    rows.value = resp.menu;
    TableFilter.value = resp.menu;
  }
  tableLoading.value = false;
};

const createDepartments = () => {
  reset();
  modo.value = false;
  openModal.value = true;
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: "medical/institution/deleteTypeOfInstitution",
  };

  deleteInfo.value?.openDelete(data, "TypeOfInstitution");
};

const save = async () => {


  if (!modo.value) {
    let resp = await methodsHttp.postApi(
      "menu/create",
      form.value
    );
    if (resp.ok) {
      openModal.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
      getMenus();
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  } else {

    let resp = await methodsHttp.putApi(
      `menu/updateMenu/${id.value}`,
      form.value
    );

    if (resp.ok) {
      openModal.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
      getMenus();
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  }
};

const search = () => {
  let textM = ModifiText.ModifiText(text.value);
  if (textM != "") {
    const filter = TableFilter.value.filter((e) => {
      return ModifiText.ModifiText(e.name).includes(textM);
    });
    console.log(filter);
    rows.value = filter;
  } else {
    rows.value = TableFilter.value;
  }
};
</script>
