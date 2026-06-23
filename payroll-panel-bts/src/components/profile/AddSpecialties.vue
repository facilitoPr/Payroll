<template>
  <div>
    <div class="row q-py-md justify-center">
      <div class="col-12 row justify-end">
        <q-icon
          class="col-auto"
          style="cursor: pointer"
          size="20px "
          name="edit_square"
          color="primary"
          @click="openModalAdd"
        />
      </div>

      <div class="row col-12 justify-center q-mb-md">
        <div class="col-12 col-md-5 row">
          <div class="col-auto q-mr-sm">
            <q-icon size="2em" name="badge" color="primary" />
          </div>
          <div class="col-auto title-input">Especialidades</div>
          <div class="col-12 details">
            Edificio, número de puerta y nivel subDepartments
          </div>
        </div>
        <div class="col-12 col-md-5"></div>
      </div>

      <div
        class="row col-12 justify-center items-center"
        v-for="(item, index) in auth.departmentsAnsSubdepartments"
        :key="index"
      >
        <div class="col-12 col-md-10 q-mr-md">
          <div class="title-input">{{ item.departments.name }}</div>
        </div>
        <div class="q-my-sm col-12 col-md-10 row q-gutter-sm">
          <div
            v-for="(item2, index2) in item.subDepartments"
            :key="index2"
            class="col-auto q-px-sm q-ma-sm q-py-sm"
            style="
              font-size: 13px;
              background-color: #f6f6f6;
              border-radius: 5px;
            "
          >
            {{ item2.name }}
          </div>
        </div>
      </div>
    </div>
    <!-- modal -->
    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 800px; max-width: 80vw">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="personal_injury" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b> AGREGAR ESPECIALIDADES</b>
                </div>
              </div>
            </div>
            <span
              class="material-icons text-negative"
              style="font-size: 23px; cursor: pointer"
              @click="closeModal"
            >
              cancel
            </span>
          </div>

          <q-card-section class="q-pt-sm">
            <div class="q-pt-sm row q-col-gutter-sm items-center">
              <div class="col-12 col-md-5">
                <q-select
                  outlined
                  dense
                  color="primary"
                  :options="
                    auth.institutionsSelected.type_of_institution.departments
                  "
                  v-model="departmentsSelected"
                  option-label="name"
                  label="BUSCAR DEPARTAMENTO"
                >
                </q-select>
              </div>

              <div class="col-12 col-md-5">
                <q-skeleton type="QInput" dense v-if="loading" />
                <q-select
                  outlined
                  multiple
                  use-chips
                  dense
                  color="primary"
                  :options="subdepartments"
                  v-model="subdepartmentsSelected"
                  option-label="name"
                  label="BUSCAR SUBDEPARTAMENTOS"
                  v-if="subdepartments.length != 0 && loading == false"
                >
                </q-select>
                <div v-else>
                  Este departamento No tienen subdepartamento agregados
                </div>
              </div>

              <div class="col-12 col-md-2">
                <q-btn
                  color="primary"
                  label="agregar"
                  style="width: 100%; height: 40px"
                  :disable="
                    departmentsSelected == null ||
                    subdepartmentsSelected == null ||
                    subdepartmentsSelected.length == 0
                  "
                  @click="add"
                />
              </div>
              <!-- table -->
              <div class="col-12 col-md-12 q-my-lg">
                <q-table
                  :rows="auth.departmentsAnsSubdepartments"
                  :columns="columns.columnsDepartamentoAndSub()"
                  row-key="name"
                  :bordered="false"
                  flat
                  dense
                >
                  <template v-slot:body="props">
                    <q-tr :props="props">
                      <q-td key="name" :props="props">
                        {{ props.row.departments.name }}
                      </q-td>

                      <q-td key="name" :props="props">
                        <div
                          v-for="(item, index) in props.row.subDepartments"
                          :key="index"
                        >
                          <li>
                            {{ item.name }}
                          </li>
                        </div>
                      </q-td>

                      <q-td key="name" :props="props">
                        <q-icon
                          style="cursor: pointer"
                          name="delete"
                          color="negative"
                          size="25px"
                          @click="deleteItem(props.row)"
                        />
                      </q-td>
                    </q-tr>
                  </template> </q-table
                >
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>

    <!-- modal delete -->
    <div>
      <q-dialog v-model="openModalDelete">
        <q-card class="" style="width: 400px">
          <div class="q-my-xl">
            <div class="text-center">
              <q-img
                src="https://adoscrila.nyc3.cdn.digitaloceanspaces.com/delete.gif"
                width="250px"
              />
            </div>
            <div class="text-center text-h6 q-mb-sm">¿ESTAS SEGURO</div>
            <div class="text-center text-h6">QUE QUIERES ELIMINAR ESTO?</div>
          </div>

          <div class="row q-col-gutter-sm justify-center q-mb-md q-mt-xl">
            <div class="col-auto">
              <q-btn
                type="submit"
                color="negative"
                label="cancelar"
                icon="cancel"
                style="width: 100%; height: 30px"
                @click="openModalDelete = false"
              />
            </div>
            <div class="col-auto">
              <q-btn
                color="primary"
                label=" Eliminar"
                style="width: 100%; height: 30px"
                icon="delete"
                @click="saveDelete"
              />
            </div>
          </div>
        </q-card>
      </q-dialog>
    </div>

    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { authStore } from "src/stores/auth-store";
import methodsHttp from "src/api/methodsHttp";
import columns from "src/components/utils/columns";
import NotificationsVue from "src/components/utils/Notifications.vue";

const notify = ref();
const auth = authStore();

const departmentsSelected = ref(null);
const subdepartments = ref([]);
const subdepartmentsSelected = ref(null);

const openModal = ref(false);
const openModalDelete = ref(false);
const loading = ref(false);

const editMode = ref(false);

const id = ref(null);

const form = ref({
  medicalInstitution: auth.institutionsSelected._id,
  departments: "",
  medico: auth.information._id,
  subDepartments: [],
});

watch(departmentsSelected, (value) => {
  editMode.value = false;
  subdepartmentsSelected.value = null;
  subdepartments.value = [];
  if (value != null) {
    form.value.departments = value._id;
    searchSubDepartment(value._id);
    auth.departmentsAnsSubdepartments.forEach((element) => {
      element.departments._id == value._id;
      if (element.departments._id == value._id) {
        subdepartmentsSelected.value = element.subDepartments;
        editMode.value = true;
        id.value = element._id;
      }
    });
  }
});

watch(subdepartmentsSelected, (value) => {
  form.value.subDepartments = [];
  if (value != null) {
    value.forEach((element) => {
      form.value.subDepartments.push(element._id);
    });
  }
});

const searchSubDepartment = async (id) => {
  loading.value = true;
  subdepartments.value = [];
  let resp = await methodsHttp.getApi(
    `medical/institution/getSubDepartmentsById/${id}`
  );
  if (resp.ok) {
    subdepartments.value = resp.subdepartments;
  }
  setTimeout(() => {
    loading.value = false;
  }, 1000);
};

const closeModal = () => {
  openModal.value = false;
  reset();
};

const reset = () => {
  editMode.value = false;
  subdepartments.value = [];
  departmentsSelected.value = null;
  subdepartmentsSelected.value = null;
};

const add = async () => {
  if (!editMode.value) {
    let resp = await methodsHttp.postApi(
      `medical/institution/createMedicalInstitutionDepartments`,
      form.value
    );
    if (resp.ok) {
      notify.value?.showNotifyGood(resp.mensaje);
      auth.departmentsAnsSubdepartment(resp.medical);
      closeModal();
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  } else {
    let resp = await methodsHttp.putApi(
      `medical/institution/putMedicalInstitutionDepartments/${id.value}`,
      form.value
    );
    if (resp.ok) {
      notify.value?.showNotifyGood(resp.mensaje);
      auth.departmentsAnsSubdepartment(resp.medical);
      closeModal();
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  }
};

const openModalAdd = () => {
  openModal.value = true;
  form.value.medicalInstitution = auth.institutionsSelected._id;
  (form.value.departments = ""), (form.value.medico = auth.information._id);
  form.value.subDepartments = [];
};

const deleteItem = (item) => {
  id.value = item._id;
  openModalDelete.value = true;
};

const saveDelete = async () => {
  let resp = await methodsHttp.deleteApi(
    `medical/institution/deleteMedicalInstitutionDepartments/${id.value}`
  );
  if (resp.ok) {
    notify.value?.showNotifyGood(resp.mensaje);
    auth.departmentsAnsSubdepartment(resp.medical);
    openModalDelete.value = false;
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
};
</script>

