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

        <div class="col-12 col-sm-3 col-md-3">
          <q-select
            v-model="sociedadesCardiologicasPRSeleted"
            label="Sociedad de cardiólogos de PR
"
            option-label="nombre"
            outlined
            dense
            color="primary"
            :options="sociedadesCardiologicasPR"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-sm-3 col-md-3">
          <q-select
            v-model="sociedadesNeumologicasPRSeleted"
            label="Sociedad de Neumólogos de PR
"
            option-label="nombre"
            outlined
            dense
            color="primary"
            :options="sociedadesNeumologicasPR"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-sm-3 col-md-3">
          <q-select
            v-model="ctdSeleted"
            label="Facilidades en Centros de Diagnóstico y Tratamiento (CDT)
"
            option-label="facilidad"
            outlined
            dense
            color="primary"
            :options="cdtFacilities"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-sm-3 col-md-3">
          <q-select
            v-model="centro330Seleted"
            label="Centros 330
"
            option-label="facilidad"
            outlined
            dense
            color="primary"
            :options="centros330"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-sm-3 col-md-3">
          <q-select
            v-model="centrosDialisisSeleted"
            label="Centros de Diálisis"
            option-label="facilidad"
            outlined
            dense
            color="primary"
            :options="centrosDialisis"
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

const sociedadesCardiologicasPRSeleted = ref(null);
const sociedadesCardiologicasPR = ref([
  {
    nombre: "Sociedad Puertorriqueña de Cardiología",
    sitioWeb: "https://www.cardiologiapr.org/",
    contacto: "contacto@cardiologiapr.org",
  },
  {
    nombre: "Sociedad de Cardiología del Hospital Universitario de Puerto Rico",
    sitioWeb: "https://www.hospitaluniversitariopr.edu/cardiologia",
  },
  {
    nombre: "Sociedad de Cardiología del Recinto de Ciencias Médicas",
    sitioWeb: "https://www.rcm.upr.edu/cardiologia",
  },
  {
    nombre: "Sociedad de Cardiología Intervencionista de Puerto Rico",
    // Ajustar sitio web si existe
  },
  {
    nombre: "Sociedad de Electrofisiología de Puerto Rico",
    // Ajustar sitio web si existe
  },
  {
    nombre: "Sociedad de Cardiología del Hospital Auxilio Mutuo",
    // Ajustar sitio web si existe
  },
  {
    nombre: "Sociedad de Cardiología del Hospital Pavia",
    // Ajustar sitio web si existe
  },
  {
    nombre: "Sociedad de Cardiología del Hospital Bella Vista",
    // Ajustar sitio web si existe
  },
  {
    nombre: "Sociedad de Cardiología del Centro Médico",
    // Ajustar sitio web si existe
  },
  // Agregar más hospitales y clínicas:
  // {
  //     nombre: "Sociedad de Cardiología del Hospital [Nombre del Hospital]",
  //     sitioWeb: "https://www.ejemplo.com"
  // }
  // Agregar sociedades regionales o especializadas:
  // {
  //     nombre: "Sociedad de Cardiología de [Región]",
  //     sitioWeb: "https://www.ejemplo.com"
  // }
]);

const sociedadesNeumologicasPRSeleted = ref(null);
const sociedadesNeumologicasPR = [
  {
    nombre: "Sociedad Puertorriqueña de Neumología",
    sitioWeb: "https://www.ejemplo.com", // Reemplazar con el sitio web correcto
    contacto: "contacto@ejemplo.com", // Reemplazar con el email correcto
  },
  // Agrega aquí otras sociedades a medida que las encuentres
  {
    nombre: "Sociedad de Neumología del Hospital X",
    sitioWeb: "https://www.hospitalx.com/neumologia",
    contacto: "neumologia@hospitalx.com",
  },
];

const centrosDialisisSeleted = ref(null);
const centrosDialisis = ref([
  {
    municipio: "Aguadilla",
    facilidad: "Fresenius Medical Care Aguadilla",
    latitud: 18.4486,
    longitud: -67.1402,
    direccion: "Carr. 459, Km 0.7, Bo. Camaseyes, Aguadilla, PR 00605",
    telefono: "(787) 882-1212",
  },
  {
    municipio: "Aguadilla",
    facilidad: "The Renal Centre of Aguadilla",
    latitud: 18.442576,
    longitud: -67.15091,
    direccion:
      "Ave. Severiano Cuevas #18, Bo. Caimita Bajo, Western Medical Plaza, Aguadilla, PR 00603",
    telefono: "(787) 882-6110",
  },
  {
    municipio: "Isabela",
    facilidad: "Atlantis Healthcare Group of Isabela",
    latitud: 18.4659,
    longitud: -67.0389,
    direccion: "Carr. 2 marginal, Km 113.5, Bo. Guerrero, Isabela, PR 00662",
    telefono: "(787) 292-7979",
  },
  {
    municipio: "Mayagüez",
    facilidad: "Atlantis Healthcare of Mayagüez",
    latitud: 18.183957,
    longitud: -67.1478,
    direccion:
      "Carr. 2, Km 156.5, Piso #1 Edificio Office Park IV, Mayagüez, PR 00680",
    telefono: "(787) 292-7979",
  },
  {
    municipio: "Mayagüez",
    facilidad: "Fresenius Medical Care North",
    latitud: 18.2473,
    longitud: -67.1672,
    direccion: "Carr. 64, Km 0.5, Bo. Sabanetas #5320, Mayagüez, PR 00680",
    telefono: "(787) 834-1550",
  },
  {
    municipio: "Mayagüez",
    facilidad: "Fresenius Medical Care Mayagüez",
    latitud: 18.1735,
    longitud: -67.1461,
    direccion: "Ave. Los Corazones #1050, Suite 101, Mayagüez, PR 00680",
    telefono: "(787) 834-5335",
  },
  {
    municipio: "San Germán",
    facilidad: "Fresenius Medical Care San Germán",
    latitud: 18.097687,
    longitud: -67.03767,
    direccion:
      "Carr. 2, Km 173.4, Bo. Caín Alto, Torre Médica San Vicente De Paul, San Germán, PR 00683",
    telefono: "(787) 892-4660",
  },
  {
    municipio: "San Germán",
    facilidad: "The Renal Centre of San Germán",
    latitud: 18.085135,
    longitud: -67.03155,
    direccion:
      "Carr. 122, Km 0.6, Ave. Casto Pérez, Centro Comercial Las Lomas, San Germán, PR 00683",
    telefono: "(787) 292-7979",
  },
  {
    municipio: "San Sebastián",
    facilidad: "Atlantis Healthcare of San Sebastián",
    latitud: 18.3401,
    longitud: -66.996,
    direccion:
      "PR 125, Ave. Emérito Estrada, Bo. Bahomamey, San Sebastián, PR 00685",
    telefono: "(787) 292-7979",
  },
  {
    municipio: "Río Grande",
    facilidad: "Fresenius Medical Care Río Grande",
    latitud: 18.376974,
    longitud: -65.83746,
    direccion:
      "Carr. PR3, Km. 23.9, Las Flores Ind. Park, Río Grande, PR 00721",
    telefono: "(787) 657-1644",
  },
]);

const ctdSeleted = ref(null);
const cdtFacilities = ref([
  {
    municipio: "Arecibo",
    facilidad: "CDT Dr. José A. Marrero Nieves",
    latitud: 18.463792,
    longitud: -66.72362,
    direccion: "Calle 4 #54, Urb. Arecibo Gardens, Arecibo, PR 00612",
    telefono: "(787) 878-5534",
  },
  {
    municipio: "Arecibo",
    facilidad: "CDT de Villa de los Santos",
    latitud: 18.46576,
    longitud: -66.74039,
    direccion: "Calle 16 #V-1, Urb. Villa Los Santos, Arecibo, PR 00612",
    telefono: "(787) 879-1585",
  },
  {
    municipio: "Arecibo",
    facilidad: "CDT Doctors Center Arecibo",
    latitud: 18.47771,
    longitud: -66.75554,
    direccion: "PR-2, Km 80.1, Bo. San Daniel, Arecibo, PR 00612",
    telefono: "(787) 878-0000",
  },
  {
    municipio: "Barceloneta",
    facilidad: "CDT Atlantic Medical Group",
    latitud: 18.4301,
    longitud: -66.564,
    direccion: "Carr. 2, #1995, Cruce Dávila, Barceloneta, PR 00617",
    telefono: "(787) 846-4412",
  },
  {
    municipio: "Barceloneta",
    facilidad: "CDT TMG Medical Group",
    latitud: 18.4523,
    longitud: -66.5395,
    direccion: "Calle Tomés Avila #1, Barceloneta, PR 00617",
    telefono: "(787) 846-6890",
  },
  {
    municipio: "Camuy",
    facilidad: "Camuy Health Services, Inc.",
    latitud: 18.4841,
    longitud: -66.8429,
    direccion: "Ave. Muñoz Rivera #63, Camuy, PR 00627",
    telefono: "(787) 262-1045",
  },
  {
    municipio: "Florida",
    facilidad: "Policlínica Familiar Florida - CDT",
    latitud: 18.36317,
    longitud: -66.56503,
    direccion: "Calle Arismendi #72, Florida, PR 00650",
    telefono: "(787) 822-3446",
  },
  {
    municipio: "Lares",
    facilidad: "Lares Medical Center - CDT",
    latitud: 18.29692,
    longitud: -66.88148,
    direccion: "Carr. 111, Ave. Los Patriotas, Bo. Pueblo, Lares, PR 00669",
    telefono: "(787) 897-1444",
  },
  {
    municipio: "Manatí",
    facilidad: "CDT Dr. César R. Rosa Febles",
    latitud: 18.42897,
    longitud: -66.4956,
    direccion: "PR-2, Km 50, Calle Quiñones 10, Manatí, PR 00674",
    telefono: "(787) 854-2292",
  },
  {
    municipio: "Quebradillas",
    facilidad: "CDT Policlínica Shalom",
    latitud: 18.4791,
    longitud: -66.9383,
    direccion: "Carr. 2, Km. 101.1, Bo. Terranova, Quebradillas, PR 00678",
    telefono: "(787) 895-0914",
  },
]);

const centro330Seleted = ref(null);
const centros330 = [
  {
    municipio: "Arecibo",
    facilidad: "Atlantic Medical Center, Inc.",
    latitud: 18.41716,
    longitud: -66.61115,
    direccion:
      "Carr. 639, Km 2.0, Sector Candelaria, Bo. Sabana Hoyos, Arecibo, PR 00688",
    telefono: "(787) 846-4412",
  },
  {
    municipio: "Barceloneta",
    facilidad: "Atlantic Medical Center, Inc. (Barceloneta)",
    latitud: 18.43064,
    longitud: -66.56416,
    direccion: "Carr. 2, Km 57.8, Cruce Dávila, Barceloneta, PR 00617",
    telefono: "(787) 846-4412",
  },
  {
    municipio: "Ciales",
    facilidad: "PRYMED, Inc.",
    latitud: 18.34104,
    longitud: -66.46881,
    direccion: "Carr. 149, Km 12.3, Ciales, PR 00638",
    telefono: "(787) 871-0601",
  },
  {
    municipio: "Florida",
    facilidad: "Centro de Servicios Primarios de Salud, Inc.",
    latitud: 18.36449,
    longitud: -66.57055,
    direccion: "Calle Antonio L. Alcázar #7, Florida, PR 00664",
    telefono: "(787) 822-2170",
  },
  {
    municipio: "Hatillo",
    facilidad: "Corporación de Servicios Médicos de Hatillo, Inc.",
    latitud: 18.487476,
    longitud: -66.82556,
    direccion: "Ave. Dr. Susoni #166, Hatillo, PR 00659",
    telefono: "(787) 898-4190",
  },
  {
    municipio: "Lares",
    facilidad: "Centro Integrado de Servicios de Salud",
    latitud: 18.290388,
    longitud: -66.88543,
    direccion: "Carr. 111, Km 1.9, Ave. Los Patriotas, Lares, PR 00669",
    telefono: "(787) 897-2727",
  },
  {
    municipio: "Morovis",
    facilidad: "Morovis Community Health Center, Inc.",
    latitud: 18.32595,
    longitud: -66.40428,
    direccion: "Ave. Corozal, Calle Patrón #2, Morovis, PR 00687",
    telefono: "(787) 862-3000",
  },
  {
    municipio: "Quebradillas",
    facilidad: "Centro Integrados de Servicios de Salud",
    latitud: 18.471901,
    longitud: -66.93943,
    direccion: "Calle Rafols #116, Esq. Del Carmen, Quebradillas, PR 00678",
    telefono: "(787) 895-2660",
  },
  {
    municipio: "Utuado",
    facilidad: "Corporación de Servicios de Salud",
    latitud: 18.265764,
    longitud: -66.69837,
    direccion: "Calle Antonio R. Barceló #5, Utuado, PR 00641",
    telefono: "(787) 680-2019",
  },
  {
    municipio: "Vega Baja",
    facilidad: "PRYMED, Inc.",
    latitud: 18.447345,
    longitud: -66.40089,
    direccion: "Carr. 2, Km 41.6, Plaza Jardines, Vega Baja, PR 00693",
    telefono: "(787) 680-2019",
  },
];

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