<template>
  <div class="bg-white q-pa-sm">
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-auto col-md-auto row items-center">
        <q-btn color="primary" label="Crear paciente" style="width: 100%; height: 40px" icon="add" @click="create" />
      </div>

      <div class="col-12 col-sm-3">
        <q-select v-model="zoneSelected" label="ZONA" option-label="name" outlined dense color="primary"
          :options="zones">
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <div class="col-12 col-sm-3 col-md-4">
        <q-input outlined dense label="BUSCAR PACIENTE" color="primary" @keyup="search" v-model="text">
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
          <q-inner-loading :showing="isLoading" label="Enviando..." label-class="text-blue-11"
            label-style="font-size: 1.1em" />
          <div class="bg-primary row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="add" color="white" />
                </div>
                <div class="col-auto text-white">
                  <b>{{ mode ? "EDITAR PACIENTE" : "CREAR PACIENTE" }}</b>
                </div>
              </div>

              <!-- groups -->
            </div>
            <span class="material-icons text-white" style="font-size: 23px; cursor: pointer"
              @click="openModal = false">
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
                  <b> <b class="text-negative">* </b> ADDRESS </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.address">
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> ZONAS </b>
                </label>
                <q-select v-model="form.zone" label="Zonas" option-value="_id" option-label="name" outlined dense
                  color="primary" :options="zones" emit-value map-options />
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
                  <b> <b class="text-negative">* </b> CONTRASEÑA </b>
                </label>

                <q-input v-model="form.password" outlined dense :type="isPassword ? 'password' : 'text'">
                  <template v-slot:append>
                    <q-icon :name="isPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                      @click="isPassword = !isPassword" />
                  </template>
                </q-input>
              </div>

              <q-file @input="updateFile" class="col-12 q-mt-sm" outlined label="Image" v-model="image">
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
                <template v-slot:after>
                  <q-btn style="height: 100%" @click="
                      () => {
                        form.img = null;
                        image = null;
                      }
                    ">
                    <q-icon name="delete" color="red" />
                  </q-btn>
                </template>
              </q-file>

              <div class="col-12 q-mt-sm" style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                <q-img v-if="form.img" :src="form.img" spinner-color="white" style="
                    height: 140px;
                    max-width: 150px;
                    border: 1px solid black;
                    border-radius: 20px;
                  " />
              </div>

              <div class="col-12 q-my-sm text-center">
                <q-btn type="submit" color="negative" label="cancelar" icon="cancel" class="q-mx-sm"
                  @click="openModal = false" />

                <q-btn type="submit" color="primary" label="guardar" icon="save" @click="save"
                  :disable="form.name == ''" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>

    <!-- table -->
    <div>
      <q-table :loading="tableLoading" flat row-key="_id" title="PACIENTES" :rows="rows"
        :columns="columns.columnsPatients()" :rows-per-page-options="[limit]" dense hide-pagination>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="image" :props="props">
              <ImagenVue :img="
                  props.row.img
                    ? props.row.img
                    : 'https://plus-nautic.nyc3.digitaloceanspaces.com/paciente.png'
                " style="
                  cursor: pointer;
                  width: 50px;
                  height: 50px;
                  overflow: hidden;
                " />
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.name }}
            </q-td>

            <!-- <q-td key="name" :props="props">
              {{ props.row.zone?.name }}
            </q-td> -->

            <!-- <q-td key="name" :props="props">
              {{ props.row.zone?.name }}
            </q-td> -->

            <q-td key="name" :props="props">
              {{ props.row.email }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.phone }}
            </q-td>

            <q-td key="name" :props="props" @click="updateState(props.row)">
              <div v-if="props.row.isActived">
                <q-badge color="secondary" label="ACTIVE" style="cursor: pointer" />
              </div>
              <div v-else>
                <q-badge color="negative" label="INACTIVE" style="cursor: pointer" />
              </div>
            </q-td>

            <q-td key="actions" :props="props">
              <ActionsButtons :menuItems="menuItems" :data="props.row" />
            </q-td>
          </q-tr>
        </template>
      </q-table>

      <div class="col-12 q-mt-sm" style="display: flex; align-items: center; justify-content: center">
        <TablePagination v-model="initialPagination" :orderQuantity="orderQuantity" color="light-blue-10"
          active-color="light-blue-5" />
      </div>
    </div>
    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo" @deleteGood="getPatients" />
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
const id = ref(null);
const image = ref(null);
const form = ref({
  name: "",
  email: "",
  phone: "",
  password: "",
  img: "",
  address: "",
  zone: null,
});
const isPassword = ref(true);
const zones = ref([]);
const zoneSelected = ref(null);
const isLoading = ref(false);

onMounted(() => {
  getPatients();
  getZones();
});

watch(initialPagination, async (value) => {
  initial.value = (await value) * 10;
  if (value == 1) {
    initial.value = 0;
    if (zoneSelected.value) {
      return getPatientsByZones(zoneSelected.value.code);
    }

    if (text.value) {
      return search();
    }

    getPatients();
  } else {
    initial.value = value * 10 - 10;
    if (zoneSelected.value) {
      return getPatientsByZones(zoneSelected.value.code);
    }

    if (text.value) {
      return search();
    }

    getPatients();
  }
});

watch(zoneSelected, async (value) => {
  if (zoneSelected.value) {
    text.value = "";
    getPatientsByZones(value.code);
  }
});

const getPatients = async () => {
  tableLoading.value = true;
  zoneSelected.value = null;
  text.value = "";
  const resp = await methodsHttp.getApi(
    `patients/getPatients/${limit.value}/${initial.value}`
  );

  if (resp.ok) {
    rows.value = resp.patients;
    TableFilter.value = resp.patients;
    orderQuantity.value = Math.ceil(resp.count / 10);
  }
  tableLoading.value = false;
};

const getZones = async () => {
  let resp = await methodsHttp.getApi(`zones/getZones`);

  if (resp.ok) {
    zones.value = resp.zones;
  }
};

const getPatientsByZones = async (code) => {
  tableLoading.value = true;
  let resp = await methodsHttp.getApi(
    `patients/getPatientsByZones/${limit.value}/${initial.value}/${code}`
  );

  if (resp.ok) {
    rows.value = resp.patients;
    TableFilter.value = resp.patients;
    orderQuantity.value = Math.ceil(resp.count / 10);
  }
  tableLoading.value = false;
};

const save = async () => {
  try {
    let resp;
    const formData = new FormData();
    isLoading.value = true;
    if (image.value) {
      formData.append("image", image.value);
    }

    if (!mode.value) {
      resp = await methodsHttp.postApi("patients/createPatient", {
        ...form.value,
      });

      await methodsHttp.putApi(
        `patients/updatePatientImage/${id.value}`,
        formData
      );
    } else {
      resp = await methodsHttp.putApi(`patients/updatePatient/${id.value}`, {
        ...form.value,
      });

      await methodsHttp.putApi(
        `patients/updatePatientImage/${id.value}`,
        formData
      );
    }

    if (resp?.ok) {
      openModal.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
      getPatients();
      clear();
    } else {
      notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
    }
  } catch (error) {
    notify.value?.showNotifyBad("Error al guardar la operadora");
    console.error("Error en la operación save:", error);
  } finally {
    isLoading.value = false;
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
  form.value.address = item.address;
  form.value.zone = item.zone;
  form.value.img = item.img;
  // image.value = item.img
  // form.value.password = item.phone.password;
  mode.value = true;
  openModal.value = true;
  id.value = item._id;
};

const updateState = async (item) => {
  tableLoading.value = true;
  let resp = await methodsHttp.putApi(`patients/updatePatient/${item._id}`, {
    isActived: !item.isActived,
  });
  if (resp.ok) {
    openModal.value = false;
    notify.value?.showNotifyGood(resp.mensaje);
    getPatients();
    clear();
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
  tableLoading.value = false;
};

const clear = () => {
  form.value.name = "";
  form.value.email = "";
  form.value.phone = "";
  form.value.password = "";
  form.value.address = null;
  form.value.zone = null;
  form.value.img = null;
  image.value = null;
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: "patients/deletePatient",
  };

  deleteInfo.value?.openDelete(data);
};

const search = async (value) => {
  console.log(text.value);
  zoneSelected.value = null;
  if (text.value == "") {
    getPatients();
  } else {
    let resp = await methodsHttp.postApi(
      `patients/searchPatients/${limit.value}/${initial.value}`,
      { text: text.value }
    );
    if (resp.ok) {
      rows.value = resp.patients;
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

const updateFile = ({ target }) => {
  console.log(target.files[0]);
  if (target.files[0]) {
    form.value.img = URL.createObjectURL(target.files[0]);
  }
};
</script>

<style scoped></style>