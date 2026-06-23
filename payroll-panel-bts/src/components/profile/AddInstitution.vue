<template>
  <div>
    <div>
      <q-icon
        class="col-auto"
        style="cursor: pointer"
        size="20px "
        name="edit_square"
        color="primary"
        @click="openModal = true"
      />
    </div>
    <!-- modal -->
    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 700px; ">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="domain_add" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b> AGREGAR INSTITUCION</b>
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
              <div class="col-12 col-md-9">
                <q-select
                  outlined
                  dense
                  color="primary"
                  :use-input="true"
                  :options="institution"
                  v-model="institutionSelected"
                  option-label="name"
                  @filter="filterSelect"
                  label="BUSCAR MOMBRE DE LA INTITUCION"
                >
                </q-select>
              </div>

              <div class="col-12 col-md-3 q-mb-xl">
                <q-btn
                  color="primary"
                  label="Add"
                  style="width: 100%; height: 40px"
                  icon="add"
                  @click="add"
                  :disable="institutionSelected == null"
                />
              </div>

              <div class="col-12 col-md-12 q-pa-sm">
                <div
                  class="col-12 row items-center"
                  v-for="(item, index) in auth.institutions"
                  :key="index"
                >
                  <div class="col-auto q-mr-sm">
                    <div
                      style="
                        width: 70px;
                        height: 70px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                      "
                    >
                      <ImagenVue
                        :img="
                          item.img
                            ? item.img
                            : 'https://static.vecteezy.com/system/resources/previews/014/322/451/original/hospital-icons-design-in-blue-circle-png.png'
                        "
                        :w="50"
                        :h="50"
                        style="cursor: pointer"
                      />
                    </div>
                  </div>
                  <div class="col-11 col-md-9 q-my-sm">
                    <div>
                      <b>{{ item.name }}</b>
                    </div>
                    <div style="color: #627884">
                      {{ item.address }}
                    </div>
                    <div style="color: #627884">
                      {{ item.email }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-icon
                      name="delete"
                      color="negative"
                      size="25px"
                      style="cursor: pointer"
                      @click="deleteItem(item)"
                    />
                  </div>
                </div>
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
import { onMounted, ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import mTexto from "src/components/utils/modifiText";

import { authStore } from "src/stores/auth-store";
import ImagenVue from "src/components/utils/Imagen.vue";

const auth = authStore();
const openModal = ref(false);
const openModalDelete = ref(false);

const notify = ref();

const institution = ref([]);
const institutionFilter = ref([]);
const institutionSelected = ref(null);

const institution_id = ref(null);

const allInstitutions = ref([...auth.institutions]);

const form = ref({
  institutions: [],
});

const reset = ()=>{
  institutionSelected.value = null
  allInstitutions.value = [...auth.institutions]
  institution_id.value = null
}

onMounted(() => {
  getInstitution();
  getIntitutinId();
});

const getIntitutinId = () => {
  auth.institutions.forEach((element) => {
    form.value.institutions.push(element._id);
  });
};

const deleteItem = (item) => {
  institution_id.value = item._id;
  openModalDelete.value = true;
};

const saveDelete = async () => {
  let index = form.value.institutions.findIndex((e) => {
    return e === institution_id;
  });

  await form.value.institutions.splice(index, 1);
  save("Se ha eliminado con exito")
  openModalDelete.value = false;
};

const save = async (msj) => {
  let resp = await methodsHttp.postApi(
    `user/addIntitutionToSpecialist/${auth.information._id}`,
    form.value
  );
  if (resp.ok) {
    notify.value?.showNotifyGood(msj);
    localStorage.setItem(
      "institutions",
      JSON.stringify(resp.informtation.institutions)
    );
    auth.addInstitutions(resp.informtation.institutions);
    if (auth.institutions.length == 1) {
      auth.changeInstitutionSelected(resp.informtation.institutions[0]);
    }
    reset()
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
};

const add = async () => {
  let index = auth.institutions.findIndex((E) => {
    return institutionSelected.value._id === E._id;
  });
  if (index == -1) {
    form.value.institutions.push(institutionSelected.value._id);
    allInstitutions.value.push(institutionSelected.value);

    save("Se ha agregado con exito")
  } else {
    notify.value?.showNotifyBad(
      "Esta institucion ya fue agregada anteriormente intente con otra"
    );
  }
};

const getInstitution = async () => {
  let resp = await methodsHttp.getApi(
    `medical/institution/getMedicalInstitution`
  );
  if (resp.ok) {
    institution.value = resp.medical;
    institutionFilter.value = resp.medical;
  }
};

const filterSelect = (val, update) => {
  update(() => {
    if (val === "") {
      institution.value = institutionFilter.value;
    } else {
      institution.value = institutionFilter.value.filter(
        (v) => mTexto.ModifiText(v.name).indexOf(mTexto.ModifiText(val)) > -1
      );
    }
  });
};
</script>
