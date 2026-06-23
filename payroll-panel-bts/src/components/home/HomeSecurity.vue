<template>
  <div>
    <div class="row q-col-gutter-sm">

      <div class="col-12 col-md-6">
        <label>
          <b>
            AREAS RESIDENCIALES
          </b>
        </label>
        <q-select v-model="residentialAreaSelected" use-input label="Areas" option-label="name" outlined dense
          color="primary" :options="residentialAreas" @filter="filterFnResidencials">
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                No results
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <div class="col-12 col-md-6">
        <label>
          <b>
            BUSCAR RESIDENCIA
          </b>
        </label>
        <q-input outlined dense color="primary" v-model="search" label="Residencia">
          <template v-slot:append>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
      </div>

      <div class="col-12 col-md-6">
        <label>
          <b>
            RESIDENTES
          </b>
        </label>
        <q-select v-model="userSelected" use-input label="Residentes" option-label="name" outlined dense color="primary"
          :options="residents" @filter="filterFn">
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                No results
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </div>

    <div class="q-my-md">
      <q-separator />
    </div>

    <!-- modal details -->
    <q-dialog v-model="openModal" persistent>
      <q-card style="width: 700px; max-width: 80vw">
        <div class="bg-white row justify-between q-pa-md">
          <div class="text-white" style="font-size: 19px; font-weight: 500">
            <div class="row items-center">
              <div class="col-auto q-mx-sm">
                <q-icon size="2em" name="people" color="primary" />
              </div>
              <div class="col-auto text-primary">
                <b>DETALLES DE LA RESIDENCIA</b>
              </div>
            </div>

            <!-- groups -->
          </div>
          <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer"
            @click="openModal = false">
            cancel
          </span>
        </div>

        <q-card-section class="q-pt-sm row">
          <div class="col-12 flex row justify-between">
            <div class="col-6 flex column q-mb-md">
              <label class="text-body1 q-my-xs">
                <b class="text-weight-bold">
                  NOMBRE:
                </b>
                {{ residentDetails.name }}
              </label>

              <label class="text-body1 q-my-xs">
                <b class="text-weight-bold">
                  CODIGO:
                </b>
                {{ residentDetails.code }}
              </label>

              <label class="text-body1 q-my-xs">
                <b class="text-weight-bold">
                  DIRECCIÓN:
                </b>
                {{ residentDetails.address }}
              </label>

              <label class="text-body1 q-my-xs">
                <b class="text-weight-bold">
                  TELEFONO:
                </b>
                {{ residentDetails.phone }}
              </label>
            </div>

            <div class="col-6 flex row q-mb-md">
              <label class="text-body1 q-my-xs text-justify">
                <b class="text-weight-bold">
                  NOTA:
                </b>
                {{ residentDetails.note ? residentDetails.note : "No hay ninguna nota escrita." }}
              </label>


              <div class="col-12 q-mt-md">
                <q-btn type="submit" color="primary" label="HISTORIAL DE ACCESO" icon="remove_red_eye"
                  @click="openModalAccessHistory(residentDetails)" />
              </div>
            </div>
          </div>

          <div class="col-12 col-md-6">
            <label>
              <b class="text-h6">
                PROPIETARIOS
              </b>
            </label>

            <ul>
              <li v-for="(item, index) in residentDetails.user" :key="index" class="text-body1 q-mt-sm">
                <div class="flex">
                  <label class="text-weight-bold">Nombre:
                    <span class="text-weight-regular">
                      {{ item.name }}
                    </span>
                  </label>
                  <label class="text-weight-bold">Telefono:
                    <span class="text-weight-regular">
                      {{ item.phone }}
                    </span>
                  </label>
                </div>
              </li>
            </ul>

          </div>

          <div class="col-12 col-md-6">
            <label>
              <b class="text-h6">
                VISITANTES PERMITIDOS
              </b>
            </label>

            <ul>
              <li class="text-body1 q-mt-sm" v-for="(item, index) in residentDetails.authorized" :key="index">
                {{ item }}
              </li>
            </ul>
          </div>

        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- modal access -->

    <q-dialog v-model="openModalAccess" persistent>
      <q-card style="width: 700px; max-width: 80vw">
        <div class="bg-white row justify-between q-pa-md">

          <div class="text-white" style="font-size: 19px; font-weight: 500">
            <div class="row items-center">
              <div class="col-auto q-mx-sm">
                <q-icon size="2em" name="people" color="primary" />
              </div>
              <div class="col-auto text-primary">
                <b>HISTORIAL DE ACCESO</b>
              </div>
            </div>

            <!-- groups -->
          </div>
          <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer"
            @click="openModalAccess = false">
            cancel
          </span>
        </div>

        <q-card-section class="q-pt-sm row">
          <div class="q-pt-sm row q-col-gutter-sm">
            <div class="col-12 col-md-6">
              <label>
                <b>
                  <b class="text-negative">* </b> RESIDENTES
                </b>
              </label>

              <q-select v-model="form.user" use-input label="Residentes" option-label="name" outlined dense
                color="primary" :options="residentDetails.user" />
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b>
                  <b class="text-negative">* </b> VISITANTES
                </b>
              </label>
              <q-select outlined dense label="Visitantes" v-model="form.visitors" use-input use-chips multiple
                input-debounce="0" @new-value="createValue" :options="residentDetails.authorized"
                @filter="filterSelectVisitors" />
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b>
                  NOTAS
                </b>
              </label>
              <q-input outlined dense color="primary" v-model="form.note" type="textarea" rows="3">
              </q-input>
            </div>
          </div>

          <div class="col-12 col-md-6 q-mt-md">
            <q-btn type="submit" color="primary" label="CREAR ACCESO" icon="add" @click="saveHomeAccessHistory"
              :disable="form.user == '' || form.visitors.length == 0" />
          </div>

          <div class="col-12 q-mt-md">
            <q-table class="bg-grey-2" :loading="tableLoading" :rows="rowAccessHistory"
              :columns="columns.columnsAccessHistory()" title="Historial" row-key="home" :bordered="false" flat dense
              :rows-per-page-options="[10]">
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="" :props="props">
                  </q-td>
                  <q-td key="date" :props="props">
                    {{ moment(props.row.date).format('LL') }}
                  </q-td>
                  <q-td key="hour" :props="props">
                    {{ moment(props.row.hour, 'HH:mm:ss').format('LT') }}
                  </q-td>
                  <q-td key="user" :props="props">
                    {{ props.row.user.name }}
                  </q-td>
                  <q-td key="user" :props="props">
                    <ul class="q-pa-none q-pl-md " v-for="(item, index) in props.row.visitors" :key="index">
                      <li>
                        {{ item }}
                      </li>
                    </ul>
                  </q-td>
                  <q-td key="note" :props="props">
                    {{ props.row.note ? props.row.note : "No hay nota escrita." }}
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- table -->
    <div>
      <q-table :loading="tableLoading" :rows="rows" :columns="columns.columnsHome()" title="RESIDENCIAS" row-key="name"
        :bordered="false" flat :rows-per-page-options="[10]" dense>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="name" :props="props">
              <img v-if="props.row.img" :src="props.row.description" width="40" height="40" :alt="props.row.name" />
              <img v-else src="https://plus-nautic.nyc3.digitaloceanspaces.com/another-files/condominio.png" width="40"
                height="40" :alt="props.row.name" />
            </q-td>
            <q-td key="name" class="cursor-pointer" :props="props" @click="openModalDetails(props.row)">
              {{ props.row.name }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.residentialArea.name }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.code }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.phone }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.address }}
            </q-td>

            <q-td key="name" :props="props">
              <div v-if="props.row.isActive">
                <q-badge color="secondary" label="ACTIVO" />
              </div>
              <div v-else>
                <q-badge color="negative" label="INACTIVO" />
              </div>
            </q-td>

            <q-td key="name" :props="props">
              <q-icon name="menu" color="primary" size="25px" style="cursor: pointer">
                <q-menu transition-show="flip-right" transition-hide="flip-left">
                  <q-list style="width: 200px" @click="openModalAccessHistory(props.row)">
                    <q-item clickable class="row items-center">
                      <div class="col-auto">
                        <q-icon name="remove_red_eye" color="primary" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">Historial de acceso</div>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-icon>
              <!-- <q-btn dense icon="menu"> </q-btn> -->
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
  </div>

  <NotificationsVue ref="notify" />
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import columns from "src/components/utils/columns";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import moment from 'moment';

const notify = ref();
const form = ref({
  homeId: null,
  user: "",
  visitors: [],
  note: ""
})
const search = ref("")
const residents = ref([]);
const residentsFilter = ref([]);
const residentialAreas = ref([]);
const residentialAreasFilter = ref([]);
const rows = ref([]);
const TableFilter = ref([]);
const userSelected = ref(null);
const residentialAreaSelected = ref(null);
const tableLoading = ref(false);
const openModal = ref(false);
const openModalAccess = ref(false);
const residentDetails = ref({
  user: [],
  authorized: []
});
const rowAccessHistory = ref([]);
const filterVisitors = ref([])

onMounted(() => {
  getResidentes();
  getResidencias();
  getRensidencialAreas();
});

const clear = () => {
  form.value.user = "";
  form.value.visitors = [];
  form.value.note = "";
};

watch(userSelected, (value) => {
  if (value != null) {
    search.value = "";
    residentialAreaSelected.value = null;
    getHomeByUser(value._id);
  } else {
    if (residentialAreaSelected.value != null) {
      return
    }
    getResidencias();
  }
});

watch(residentialAreaSelected, (value) => {
  if (value != null) {
    search.value = "";
    userSelected.value = null;
    getHomeByResidentialArea(value._id);
  } else {
    if (userSelected.value != null){
      return
    }
    getResidencias();
  } 
});

watch(search, (value) => {
  if (value != null) {
    getResidenciasByInput(value);
    userSelected.value = null;
    residentialAreaSelected.value = null;
  }
});

const createValue = (val, done) => {
  if (val.length > 0) {
    const modelValue = (form.value.visitors || []).slice()

    val
      .split(/[,;|]+/)
      .map(v => v.trim())
      .filter(v => v.length > 0)
      .forEach(v => {
        if (residentDetails.value.authorized.includes(v) === false) {
          residentDetails.value.authorized.push(v)
        }
        if (modelValue.includes(v) === false) {
          modelValue.push(v)
        }
      })

    done(null)
    form.value.visitors = modelValue
  }
}

const filterSelectVisitors = (val, update) => {
  update(() => {
    if (val === '') {
      residentDetails.value.authorized = filterVisitors.value
    }
    else {
      const needle = val.toLowerCase()
      residentDetails.value.authorized = filterVisitors.value.filter(
        v => v.toLowerCase().indexOf(needle) > -1
      )
    }
  })
}

const filterFn = (val, update) => {
  update(
    () => {
      if (val == '') {
        residents.value = residentsFilter.value;
      }
      else {
        const needle = val.toLowerCase();
        residents.value = residentsFilter.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1)
      }
    },

    // "ref" is the Vue reference to the QSelect
    ref => {
      if (val !== '' && residents.length > 0) {
        ref.setOptionIndex(-1) // reset optionIndex in case there is something selected
        ref.moveOptionSelection(1, true) // focus the first selectable option and do not update the input-value
      }
    }
  )
};

const filterFnResidencials = (val, update) => {
  update(
    () => {
      if (val == '') {
        residentialAreas.value = residentialAreasFilter.value;
      }
      else {
        const needle = val.toLowerCase();
        residentialAreas.value = residentialAreasFilter.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1)
      }
    },

    // "ref" is the Vue reference to the QSelect
    ref => {
      if (val !== '' && residents.length > 0) {
        ref.setOptionIndex(-1) // reset optionIndex in case there is something selected
        ref.moveOptionSelection(1, true) // focus the first selectable option and do not update the input-value
      }
    }
  )
};

const openModalDetails = (item) => {
  residentDetails.value = { ...item }
  openModal.value = true;
};

const openModalAccessHistory = (item) => {
  form.value.homeId = item._id;
  getAccessHistoryByHome(item._id);
  residentDetails.value = { ...item }
  filterVisitors.value = item.authorized
  openModalAccess.value = true;
};

const getResidentes = async () => {
  let resp = await methodsHttp.getApi(
    `user/getUserByRol/RESIDENTE`
  );

  if (resp.ok) {
    residents.value = resp.user;
    residentsFilter.value = resp.user;
  }
};

const getResidencias = async () => {
  let resp = await methodsHttp.getApi(
    `home/getHome`
  );
  if (resp.ok) {
    rows.value = resp.home;
    TableFilter.value = resp.home;
  }
};

const getRensidencialAreas = async () => {
  let resp = await methodsHttp.getApi(
    `residentialArea/getResidentialArea`
  );

  if (resp.ok) {
    residentialAreas.value = resp.residentialArea;
    residentialAreasFilter.value = resp.residentialArea;
  }
};

const getResidenciasByInput = async (text) => {
  let resp = await methodsHttp.postApi(
    `home/searchHome`, { text }
  );
  if (resp.ok) {
    rows.value = resp.home;
  }
};

const getHomeByUser = async (id) => {
  tableLoading.value = true;
  let resp = await methodsHttp.postApi(
    `home/getHomeByUser`, { id }
  );
  if (resp.ok) {
    rows.value = resp.home;
  }
  tableLoading.value = false;
};

const getHomeByResidentialArea = async (id) => {
  tableLoading.value = true;
  let resp = await methodsHttp.postApi(
    `home/getHomeByResidentialArea`, { id }
  );
  if (resp.ok) {
    rows.value = resp.home;
  }
  tableLoading.value = false;
};

const getAccessHistoryByHome = async (id) => {
  tableLoading.value = true;
  let resp = await methodsHttp.getApi(
    `home/getAccessHistoryByHome/${id}`
  );
  if (resp.ok) {
    rowAccessHistory.value = resp.homeAccessHistory;
  }
  tableLoading.value = false;
}

const saveHomeAccessHistory = async () => {
  let resp = await methodsHttp.postApi(
    "home/createHomeAccessHistory",
    { ...form.value }
  );
  if (resp.ok) {
    notify.value?.showNotifyGood(resp.mensaje);
    getAccessHistoryByHome(form.value.homeId);
    clear();
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
}
</script>

<style></style>