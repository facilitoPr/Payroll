<template>
  <div class="bg-white q-pa-md">
    <div class="row">
      <div class="row col-12 q-col-gutter-sm">
        <div class="col-12 col-sm-3 col-md-3">
          <q-input outlined label="Buscar" dense v-model="text">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <!-- Pueblo -->
        <div class="col-12 col-sm-3 col-md-2">
          <q-select
            v-model="citySeleted"
            label="PUEBLO"
            option-label="name"
            outlined
            dense
            color="primary"
            :options="city"
            use-input
            @filter="filterCountry"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
        <!-- ESTADO -->
        <div class="col-12 col-sm-3 col-md-2">
          <q-select
            v-model="statusSelected"
            label="ESTADO"
            option-label="name"
            outlined
            dense
            color="primary"
            :options="status"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <!-- Gender -->
        <div class="col-12 col-sm-3 col-md-2">
          <q-select
            v-model="genderSelected"
            label="GENERO"
            option-label="name"
            outlined
            dense
            color="primary"
            :options="gender"
            use-input
            @filter="filterGender"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <!-- boton de buscar -->
        <div class="col-12 col-sm-auto">
          <q-btn
            color="primary"
            label="Buscar"
            style="height: 40px; width: 100%"
            icon="search"
            @click="getPatientsToSendMessage"
          />
        </div>

        <!-- boton limpiar -->
        <div class="col-12 col-sm-auto">
          <q-btn
            color="primary"
            label="Limpiar"
            style="height: 40px; width: 100%"
            icon="history"
            @click="clear"
          />
        </div>
      </div>

      <div
        class="col-12 col-sm-2 q-my-sm"
        v-if="
          selected.length > 0 &&
          (SMS == true || EMAIL == true || NOTIFICACIONES_PUSH == true)
        "
      >
        <q-btn
          color="primary"
          label="ENVIAR"
          style="width: 100%; height: 40px"
          icon="send"
          :disable="
            selected.length == 0 ||
            (SMS == false && EMAIL == false && NOTIFICACIONES_PUSH == false)
          "
          @click="openModalSendMessage = true"
        />
      </div>
    </div>

    <div class="q-mt-lg q-px-md">
      <q-checkbox v-model="SMS" label="SMS" color="primary" />
      <q-checkbox v-model="EMAIL" label="EMAIL" color="primary" />
      <q-checkbox
        v-model="NOTIFICACIONES_PUSH"
        label="NOTIFICACIONES PUSH"
        color="primary"
      />
    </div>
    <!-- table -->
    <div class="q-pa-md">
      <q-table
        flat
        title="MENSAJERIA"
        :rows="rows"
        :columns="columns"
        row-key="name"
        :selected-rows-label="getSelectedString"
        selection="multiple"
        v-model:selected="selected"
      >
        <template v-slot:body-cell-img="props">
          <q-td :props="props">
            <ImagenVue
              :img="
                props.row.img
                  ? props.row.img
                  : 'https://plus-nautic.nyc3.digitaloceanspaces.com/paciente.png'
              "
            />
          </q-td>
        </template>

        <template v-slot:body-cell-birthDate="props">
          <q-td :props="props">
            <div v-if="props.row?.birthDate">
              {{ calcularEdad.calcularEdad(props.row?.birthDate) }}
            </div>
            <div v-else class="text-primary">--</div>
          </q-td>
        </template>
        <template v-slot:body-cell-isActived="props">
          <q-td :props="props">
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
        </template>
      </q-table>

      <!-- <div class="q-mt-md">Selected: {{ JSON.stringify(selected) }}</div> -->
    </div>
    <!-- pagination -->
    <!-- <div
      class="col-12 q-mt-sm"
      style="display: flex; align-items: center; justify-content: center"
    >
      <div
        class="col-12 q-mt-sm"
        style="display: flex; align-items: center; justify-content: center"
      >
        <TablePagination
          v-model="initialPagination"
          :orderQuantity="orderQuantity"
          color="light-blue-10"
          active-color="light-blue-5"
          :maxPages="6"
          :initialPagination="initialPagination"
        />
      </div>
    </div> -->

    <!-- modal -->
    <div>
      <q-dialog v-model="openModalSendMessage">
        <q-card style="width: 550px; max-width: 80vw">
          <div class="bg-primary row justify-between items-center q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="email" color="white" />
                </div>
                <div class="col-auto text-white">
                  <b>ENVIAR MENSAJE</b>
                </div>
              </div>

              <!-- groups -->
            </div>
            <q-icon
              class=""
              size="23px"
              name="cancel"
              color="negative"
              @click="openModalSendMessage = false"
              style="cursor: pointer"
            />
          </div>

          <q-card-section>
            <!-- <div class="text-h6">{{ typeSms }}</div> -->
          </q-card-section>

          <q-card-section class="q-pt-sm">
            <div class="q-pt-sm row q-col-gutter-sm">
              <div class="col-12">
                <label>
                  <b> <b class="text-negative"> </b> ASUNTO </b>
                </label>
                <q-input outlined dense color="primary" v-model="affair">
                </q-input>
              </div>

              <div class="col-12">
                <label>
                  <b> <b class="text-negative">* </b> MENSAJE </b>
                </label>
                <q-input outlined type="textarea" v-model="msg" />
              </div>
            </div>

            <div v-if="total !== 0" class="text-center">
              <q-circular-progress
                show-value
                font-size="12px"
                :value="Math.round((totalSend / total) * 100)"
                size="50px"
                :thickness="0.22"
                color="teal"
                track-color="grey-3"
                class="q-ma-md"
              >
                {{ Math.round((totalSend / total) * 100) }}%
              </q-circular-progress>
              <div>Cargando...</div>
            </div>
          </q-card-section>

          <q-card-actions align="center" class="bg-white text-teal q-mb-sm">
            <q-btn outline label="Cancelar" v-close-popup color="negative" />
            <q-btn
              label="ENVIAR"
              color="primary"
              @click="sendMessage"
              icon="send"
              :disable="msg == ''"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>

    <NotificationsVue ref="notify" />
  </div>
</template>
  
  <script setup>
import { ref, onMounted, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import ImagenVue from "src/components/utils/Imagen.vue";
import TablePagination from "src/components/table/TablePagination.vue";
import NotificationsVue from "src/components/utils/Notifications.vue";
import calcularEdad from "../utils/formatter";

const columns = ref([
  {
    name: "img",
    required: true,
    label: "IMAGEN",
    align: "left",
    field: (row) => row.img,
    // format: (val) => `${val}`,
    sortable: false,
  },
  {
    name: "name",
    align: "center",
    label: "NOMBRE",
    field: "name",
    sortable: false,
    align: "left",
  },
  {
    name: "zone",
    label: "PUEBLO",
    field: (row) => row?.city?.name,
    align: "left",
  },
  { name: "email", label: "EMAIL", field: "email", align: "left" },
  { name: "birthDate", label: "EDAD", field: "birthDate", align: "left" },
  {
    name: "gender",
    label: "GENDER",
    field: (row) => row?.gender?.name,
    align: "left",
  },
  { name: "phone", label: "PHONE", field: "phone", align: "left" },
  {
    name: "isActived",
    align: "left",
    label: "ESTADO",
    field: (row) => {
      return row.isActived ? `<div>ACTIVO</div>` : `INACTIVO`;
    },
  },
]);

const rows = ref([]);

const selected = ref([]);

const limit = ref(10000);
const initial = ref(0);

const SMS = ref(false);
const EMAIL = ref(false);
const NOTIFICACIONES_PUSH = ref(false);

const openModalSendMessage = ref(false);
const text = ref("");
const msg = ref("");
const affair = ref("");

const orderQuantity = ref(1);
const initialPagination = ref(1);

const zones = ref([]);
const citySeleted = ref(null);

const gender = ref([]);
const genderSelected = ref(null);
const genderFilter = ref([]);

const notify = ref();

const status = ref([
  { id: 1, value: true, name: "ACTIVO" },
  { id: 2, value: false, name: "INACTIVO" },
]);

const statusSelected = ref(null);

const tableLoading = ref(false);

const loading = ref(false);
const total = ref(0);
const totalSend = ref(0);

const city = ref([]);
const cityFilter = ref({});

onMounted(() => {
  getPatientsToSendMessage();
  getCity();
  getGenders();
});

const getPatientsToSendMessage = async () => {
  let res = await methodsHttp.getApi(
    `patients/getPatientsToSendMessage/${limit.value}/${initial.value}/${
      citySeleted.value && citySeleted.value._id
    }/${statusSelected.value && statusSelected.value.value}/${
      genderSelected.value && genderSelected.value._id
    }`
  );
  if (res.ok) {
    rows.value = await res.patients;
    console.log(res.patients);
    // orderQuantity.value = Math.ceil(res.count / 2);
  }
};

const getSelectedString = () => {
  return selected.value.length === 0
    ? ""
    : `${selected.value.length} record${
        selected.value.length > 1 ? "s" : ""
      } selected of ${rows.length}`;
};

const sendMessage = async () => {
  let data = {
    SMS: SMS.value,
    EMAIL: EMAIL.value,
    NOTIFICACIONES_PUSH: NOTIFICACIONES_PUSH.value,
    text: msg.value,
    affair: affair.value,
  };

  let userData = selected.value.map((e) => {
    return {
      phone: e.phone,
      id: e._id,
      email: e.email,
      token: e.token,
    };
  });

  total.value = userData.length;
  for (let i in userData) {
    totalSend.value = Number(i) + 1;
    let res = await methodsHttp.postApi(`messages/createMasiveMessage`, {
      ...data,
      userData: { ...userData[i] },
    });
    if (res.ok) {
      notify.value?.showNotifyGood(res.mensaje);
    }
  }
};

const getPatientsToSendMessageBySearch = async (value) => {
  tableLoading.value = true;
  const res = await methodsHttp.getApi(
    `patients/getPatientsToSendMessageBySearch/${limit.value}/${
      initial.value
    }/${value}/${citySeleted.value && citySeleted.value._id}/${
      statusSelected.value && statusSelected.value.value
    }/${genderSelected.value && genderSelected.value._id}`
  );

  if (res.ok) {
    // console.log(res)
    rows.value = res.patients;
    orderQuantity.value = Math.ceil(res.count / 2);
  }
  tableLoading.value = false;
};

const getCity = async () => {
  let resp = await methodsHttp.getApi(`city/getCity`);
  if (resp.ok) {
    city.value = resp.city;
    cityFilter.value = resp.city;
  }
};

const getGenders = async () => {
  let resp = await methodsHttp.getApi(`gender/getGenders`);
  if (resp.ok) {
    gender.value = resp.gender;
    genderFilter.value = resp.gender;
  }
};

// watch(initialPagination, async (value) => {
//   initial.value = (await value) * 2;
//   if (value == 1) {
//     initial.value = 0;
//     getPatientsToSendMessage();
//   } else {
//     initial.value = value * 2 - 2;
//     getPatientsToSendMessage();
//   }
// });

watch(text, (value) => {
  initial.value = 0;
  limit.value = 10000;
  initialPagination.value = 1;
  if (value) {
    rows.value = [];
    getPatientsToSendMessageBySearch(value);
  } else {
    getPatientsToSendMessage();
  }
});

const changePaginationValues = async () => {
  initial.value = 0;
  limit.value = 10000;
  text.value = "";
  initialPagination.value = 1;
  statusSelected.value = await null;
  citySeleted.value = await null;
  genderSelected.value = await null;
};

const clear = async () => {
  await changePaginationValues();
  await getPatientsToSendMessage();
};

const filterCountry = (val, update) => {
  update(() => {
    if (val === "") {
      city.value = cityFilter.value;
    } else {
      const needle = val.toLowerCase();
      city.value = cityFilter.value.filter((e) => {
        return e.name.toLowerCase().includes(needle);
      });
    }
  });
};

const filterGender = (val, update) => {
  update(() => {
    if (val === "") {
      gender.value = genderFilter.value;
    } else {
      const needle = val.toLowerCase();
      gender.value = genderFilter.value.filter((e) => {
        return e.name.toLowerCase().includes(needle);
      });
    }
  });
};
</script>
  

<!-- createMasiveMessage -->