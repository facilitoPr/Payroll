<template>
  <div>
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-4 col-md-4">
        <q-input
          outlined
          dense
          label="BUSCAR DEPARTAMENTOS"
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
          label="Agregar departamentos"
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
        :columns="columns.columnsDepartamentos()"
        title="DEPARTAMENTOS"
        row-key="name"
        :bordered="false"
        flat
        :rows-per-page-options="[10]"
        dense
      >
        <template v-slot:body="props">
          <q-tr :props="props">
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
                  <!-- imagen -->
                </q-menu>
              </q-icon>
              <!-- <q-btn dense icon="menu"> </q-btn> -->
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.name }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.code }}
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
                    modo ? "EDITAR DEPARTAMENTO" : "AGREGAR DEPARTAMENTO"
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
              <div class="col-12 col-md-12">
                <label>
                  <b>
                    <b class="text-negative">* </b> NOMBRE DEL DEPARTAMENTO
                  </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.name">
                </q-input>
              </div>

              <div class="col-12 col-md-12">
                <label>
                  <b>
                    <b class="text-negative">* </b> CODIGO DEL DEPARTAMENTO
                  </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.code">
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
                  :disable="form.name == '' || form.code == ''"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo" @deleteGood="getDepartments" />
  </div>
</template>
<script setup>
import { onMounted, ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
import columns from "src/components/utils/columns";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Delete from "src/components/utils/Delete.vue";
import ModifiText from "src/components/utils/modifiText";

const notify = ref();
const deleteInfo = ref();

const openModal = ref(false);
const modo = ref(false);

const form = ref({
  name: "",
  code: "",
  isActive: true,
});

const text = ref("");
const rows = ref([]);
const TableFilter = ref([]);

const tableLoading = ref(false);

const reset = () => {
  form.value.name = "";
  form.value.code = "";
};

const id = ref(null);

const openModalEdit = (item) => {
  form.value.name = item.name;
  form.value.code = item.code;
  form.value.isActive = item.isActive;
  modo.value = true;
  openModal.value = true;
  id.value = item._id;
};

onMounted(() => {
  getDepartments();
});

const getDepartments = async () => {
  tableLoading.value = true;
  let resp = await methodsHttp.getApi(`medical/institution/getDepartments`);
  if (resp.ok) {
    rows.value = resp.departments;
    TableFilter.value = resp.departments;
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
    ruta: "medical/institution/deleteDepartments",
  };

  deleteInfo.value?.openDelete(data, "Departments");
};

const save = async () => {
  if (!modo.value) {
    let resp = await methodsHttp.postApi(
      "medical/institution/createDepartments",
      form.value
    );
    if (resp.ok) {
      openModal.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
      getDepartments();
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  } else {
    let resp = await methodsHttp.putApi(
      `medical/institution/putDepartments/${id.value}`,
      form.value
    );
    if (resp.ok) {
      openModal.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
      getDepartments();
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
