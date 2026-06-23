<template>
  <div class="bg-white" style="border-radius: 15px; padding: 10px">
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-4 col-md-3">
        <q-input outlined dense label="BUSCAR ENTRADAS" color="primary">
          <template v-slot:append>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-sm-4 col-md-2">
        <div class="col-12">
          <q-select
            outlined
            dense
            color="primary"
            :options="departments"
            v-model="departmentsSelected"
            option-label="name"
            label="DEPARTAMENTOS"
          >
          </q-select>
        </div>
      </div>
      <div class="col-12 col-sm-4 col-md-2">
        <div class="col-12">
          <q-select
            outlined
            dense
            color="primary"
            :options="formByDepartments"
            v-model="formByDepartmentsSelected"
            option-label="name"
            label="FORMULARIOS"
          >
          </q-select>
        </div>
      </div>

      <div class="col-12 col-sm-4 col-md-2">
        <div class="col-12">
          <q-select
            outlined
            dense
            color="primary"
            :options="sectionByForm"
            v-model="sectionByFormSelected"
            option-label="name"
            label="FORMULARIOS"
          >
          </q-select>
        </div>
      </div>
      <div class="col-12 col-sm-auto col-md-auto row items-center">
        <q-btn
          color="primary"
          label="Agregar entradas"
          style="width: 100%; height: 40px"
          icon="add"
          @click="createForm"
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
        title="FORMULARIOS"
        row-key="name"
        :bordered="false"
        flat
        :rows-per-page-options="[10]"
        dense
        :columns="columns.columnsInput()"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="name" :props="props">
              {{ props.row.name }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.formType.name }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.order }}
            </q-td>
            <q-td key="name" :props="props">
              <div v-if="props.row.require">SI</div>
              <div v-else>NO</div>
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
    <!-- modal formulario -->
    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 700px; max-width: 80vw">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="add" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b>{{ modo ? "EDITAR ENTRADA" : "AGREGAR ENTRADA" }}</b>
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
              <div class="col-12 col-sm-4 col-md-6">
                <div class="col-12">
                  <label>
                    <b>SELECCIONAR DEPARTAMENTO</b>
                  </label>
                  <q-select
                    outlined
                    dense
                    color="primary"
                    :options="departments"
                    v-model="departmentsSelected"
                    option-label="name"
                    label="DEPARTAMENTOS"
                  >
                  </q-select>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="col-12">
                  <label>
                    <b>SELECCIONAR FORM</b>
                  </label>
                  <q-select
                    outlined
                    dense
                    color="primary"
                    :options="forms"
                    v-model="formsSelected"
                    option-label="name"
                  >
                  </q-select>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="col-12">
                  <label>
                    <b>SELECCIONAR SECCION</b>
                  </label>
                  <q-select
                    outlined
                    dense
                    color="primary"
                    :options="section"
                    v-model="sectionSelected"
                    option-label="name"
                    :disable="section.length <= 0"
                  >
                  </q-select>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="col-12">
                  <label>
                    <b>SELECCIONAR TIPO DE FORMULARIO</b>
                  </label>
                  <q-select
                    outlined
                    dense
                    color="primary"
                    :options="formsTypes"
                    v-model="formsTypesSelected"
                    option-label="name"
                  >
                  </q-select>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> NAME DE ENTRADA </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.name">
                </q-input>
              </div>

              <div v-if="selectActive" class="col-md-6 row">
                <label class="col-12">
                  <b> <b class="text-negative"></b> VALOR </b>
                </label>
                <div
                  class="col-10"
                  v-for="(item, index) in dataSelect"
                  :key="index"
                >
                  <q-input type="text" v-model="item.name" outlined dense color="primary" />
                </div>

                <div class="col-2">
                  <q-btn
                    type="submit"
                    color="primary"
                    @click="addValueSelect"
                    icon="add"
                    style="height: 40px"
                  />
                </div>
              </div>

              <!-- <div v-if="selectActive" class="col-md-6">
                <div
                  class="col-md-6"
                  v-for="(item, index) in dataSelect"
                  :key="index"
                >
                  <div class="row col-md-12">
                    <label>
                      <b> <b class="text-negative"></b> VALOR </b>
                    </label>
                    <q-input
                      type="text"
                      outlined
                      dense
                      color="primary"
                      v-model="item.name"
                    />
                  </div>
                </div>
              </div> -->
              <div class="col-12 col-md-3">
                <label>
                  <b> <b class="text-negative">* </b>ORDEN</b>
                </label>
                <q-input
                  type="number"
                  outlined
                  dense
                  color="primary"
                  v-model="form.order"
                />
              </div>
              <div class="col-12 col-md-3 text-center">
                <label>
                  <b> <b class="text-negative"></b> ACTIVO </b>
                </label>
                <q-checkbox v-model="form.isActive" />
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative"></b> ENTRADA REQUERIDA </b>
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
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";

const notify = ref();
const tableLoading = ref(false);

const openModal = ref(false);
const modo = ref(false);

const rows = ref([]);
const TableFilter = ref([]);
const id = ref(null);

const dataSelect = ref([{ name: "" }]);
const selectActive = ref(false);

const form = ref({
  name: "",
  require: true,
  isActive: true,
  order: 0,
});

onMounted(() => {
  getFormType();
  getDepartments();
});

const forms = ref([]);
const formsSelected = ref(null);

const formsTypes = ref([]);
const formsTypesSelected = ref(null);

const section = ref([]);
const sectionSelected = ref(null);

const departments = ref([]);
const departmentsSelected = ref(null);

const formByDepartments = ref([]);
const formByDepartmentsSelected = ref(null);

const sectionByForm = ref([]);
const sectionByFormSelected = ref(null);

const getForm = async () => {
  let resp = await methodsHttp.getApi(`form/getForm`);
  if (resp.ok) {
    forms.value = resp.forms;
  }
};
const getFormByDepartments = async (id) => {
  let resp = await methodsHttp.getApi(`form/getFormByDepartments/${id}`);
  if (resp.ok) {
    formByDepartments.value = resp.forms;
    forms.value = resp.forms;
  }
};
const getFormType = async () => {
  let resp = await methodsHttp.getApi(`form/getFormType`);
  if (resp.ok) {
    formsTypes.value = resp.formType;
  }
};
const getDepartments = async () => {
  let resp = await methodsHttp.getApi(`medical/institution/getDepartments`);
  if (resp.ok) {
    departments.value = resp.departments;
  }
};

watch(formsSelected, (value) => {
  if (value != null) {
    console.log(value);
    section.value = value.section;
  }
});

watch(sectionSelected, (value) => {
  if (value != null) {
    console.log(value);
  }
});

watch(departmentsSelected, (value) => {
  if (value != null) {
    getFormByDepartments(value._id);
    formByDepartmentsSelected.value = null;
    sectionByFormSelected.value = null;
    formsSelected.value = null;
    sectionSelected.value = null;
  }
});

watch(formByDepartmentsSelected, (value) => {
  if (value != null) {
    sectionByForm.value = value.section;
  }
});

watch(sectionByFormSelected, (value) => {
  if (value != null) {
    tableLoading.value = true;
    rows.value = value.input;
    TableFilter.value = value.input;

    tableLoading.value = false;
  }
});

watch(formsTypesSelected, (value) => {
  if (value != null) {
    console.log(value);
    if (value.name == "select") {
      selectActive.value = true;
    } else {
      selectActive.value = false;
    }
  }
});

const createForm = () => {
  modo.value = false;
  openModal.value = true;
};

const openModalEdit = (item) => {
  form.value.name = item.name;
  form.value.isActive = item.isActive;
  form.value.order = item.order;
  form.value.require = item.require;

  formsSelected.value = formByDepartmentsSelected.value;
  sectionSelected.value = sectionByFormSelected.value;

  modo.value = true;
  openModal.value = true;

  id.value = item._id;
  console.log(item.formType);
  formsTypesSelected.value = item.formType;
};

const save = async () => {
  const data = {
    ...form.value,
    formType: formsTypesSelected.value._id,
    section: sectionSelected.value._id,
    forms: formsSelected.value._id,
    options:dataSelect.value
  };
  console.log(data);
  let resp = await methodsHttp.postApi("form/createInput", data);
  if (resp.ok) {
    openModal.value = false;
    notify.value?.showNotifyGood(resp.mensaje);
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
};

const addValueSelect = ()=>{
  dataSelect.value.push({name:""})
}
</script>


