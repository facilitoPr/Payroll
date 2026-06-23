<template>
  <div class="bg-white q-pa-md">
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-2">
        <q-btn
          color="primary"
          label="AGREGAR"
          style="width: 100%; height: 40px"
          icon="add"
          @click="AddFile"
        />
      </div>

      <div class="col-12 col-sm-2">
        <q-input v-model="text" outlined label="Buscar" dense>
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <div class="col-12 col-sm-2 col-md-auto">
        <q-btn
          color="primary"
          label="Buscar"
          style="height: 40px; width: 100%"
          icon="search"
          @click="getComercialBySearch"
        />
      </div>

      <div class="col-12 col-sm-2">
        <q-select
          v-model="zoneSelected"
          label="ZONA"
          option-label="name"
          outlined
          dense
          color="primary"
          :options="zones"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <!-- <div class="col-12 col-sm-2">
        <q-select
          v-model="userSelected"
          label="Operadoras"
          option-label="name"
          outlined
          dense
          color="primary"
          :options="userOption"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div> -->

      <div class="col-12 col-sm-2 col-md-auto">
        <q-btn
          color="primary"
          label="Buscar"
          style="height: 40px; width: 100%"
          icon="search"
          @click="getComercial"
        />
      </div>

      <div class="col-12 col-xs-12 col-sm-2 col-md-auto">
        <q-btn
          color="primary"
          label="Limpiar"
          style="height: 40px; width: 100%"
          icon="history"
          @click="clear"
        />
      </div>

      <div class="col-12 col-xs-12 col-sm-2 col-md-auto">
        <q-btn
          color="primary"
          icon-right="archive"
          label="Export to csv"
          style="height: 40px; width: 100%"
          no-caps
          @click="openModalExport = true"
        />
      </div>
    </div>

    <!-- modal -->
    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 500px; max-width: 80vw">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="add" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b>ADD FILE</b>
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
            <div class="col-12">
              <a
                href=""
                @click="exportExcel"
                style="text-decoration: none"
                class="text-primary"
                >Descargar archivo</a
              >
            </div>

            <div class="col-12 q-my-sm">
              <div class="bordereFile q-mt-md">
                <div class="file-select">
                  <div class="drag">
                    <div>
                      <div style="text-align: center">
                        <q-icon size="2.6em" name="description" color="white" />
                      </div>
                      <div style="text-align: center">
                        <b style="font-size: 17px; color: white">Add File</b>
                      </div>
                      <p style="color: white">or drag and drop</p>
                    </div>
                  </div>
                  <input type="file" @input="getFile" />
                </div>
              </div>

              <q-select
                v-model="zoneSelected"
                label="Zonas"
                option-label="name"
                outlined
                dense
                color="primary"
                :options="zones"
                class="q-mt-md"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey"
                      >No results</q-item-section
                    >
                  </q-item>
                </template>
              </q-select>

              <q-input
                v-model="nameFile"
                outlined
                label="Nombre"
                dense
                class="q-mt-md"
              />

              <!-- 🔄 Switch Federal -->
              <div class="q-mt-md">
                <q-toggle
                  v-model="isFederal"
                  label="¿Es Federal?"
                  color="primary"
                  left-label
                />

                <q-toggle
                  v-model="uploadToBackend"
                  label="¿Subir al backend?"
                  color="primary"
                  left-label
                />
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
                  :disable="zoneSelected == null"
                  icon="save"
                  @click="saveProductFile"
                />
              </div>
            </div>
          </q-card-section>

          <q-inner-loading
            :showing="loading"
            label="Procesando..."
            label-class="text-primary"
            label-style="font-size: 1.1em"
            color="primary"
          />
        </q-card>
      </q-dialog>
    </div>

    <!-- modal 2 -->
    <div>
      <q-dialog v-model="openModalExport" persistent>
        <q-card style="width: 500px; max-width: 80vw">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="archive" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b>EXPORTAR</b>
                </div>
              </div>
            </div>
            <span
              class="material-icons text-negative"
              style="font-size: 23px; cursor: pointer"
              @click="openModalExport = false"
            >
              cancel
            </span>
          </div>
          <q-card-section class="q-pt-sm">
            <div class="col-12 q-my-sm">
              <q-select
                v-model="comercialDocumentInfoSelected"
                label="Registro de documento"
                option-label="name"
                outlined
                dense
                color="primary"
                :options="comercialDocumentInfo"
                class="q-mt-md"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label
                        >{{ scope.opt.name }},
                        {{
                          moment(scope.opt.created_at)
                            .locale("es-do")
                            .format("dddd DD MMMM, YYYY hh:mm:ss")
                        }}</q-item-label
                      >
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div style="padding-top: 30px; padding-bottom: 30px" v-if="loading">
              <q-inner-loading
                :showing="loading"
                label="Por favor esperar..."
                label-class="text-primary"
                label-style="font-size: 1.1em"
                color="primary"
              />
            </div>

            <div class="col-12 q-my-sm text-center q-mt-lg">
              <q-btn
                type="submit"
                color="negative"
                label="cancelar"
                icon="cancel"
                class="q-mx-sm"
                @click="openModalExport = false"
              />

              <q-btn
                type="submit"
                color="primary"
                label="Export to csv"
                :disable="comercialDocumentInfoSelected == null"
                icon="archive"
                @click="exportTable"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>

    <div>
      <!-- table -->
      <q-table
        flat
        row-key="_id"
        title="COMERCIAL"
        :rows="rows"
        :columns="columns.columnsComercial()"
        :rows-per-page-options="[limit]"
        hide-pagination
        :loading="tableLoading"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <!-- <q-td key="image" :props="props">
              {{ props.row.ComentariosAdicionales }}
            </q-td> -->

            <q-td key="memberIdentificationNumber" :props="props">
              {{ props.row.memberIdentificationNumber }}
            </q-td>

            <q-td key="MemberFullname" :props="props">
              {{ props.row.MemberFullname }}
            </q-td>

            <q-td key="CompanyCode" :props="props">
              {{ props.row.CompanyCode }}
            </q-td>

            <q-td key="Relationship" :props="props">
              {{ props.row.Relationship }}
            </q-td>
            <q-td key="Company" :props="props">
              {{ props.row.Company }}
            </q-td>

            <q-td key="GroupNumber" :props="props">
              {{ props.row.GroupNumber }}
            </q-td>
            <q-td key="Gender" :props="props">
              {{ props.row.Gender }}
            </q-td>
            <q-td key="enrollType" :props="props">
              {{ props.row.enrollType }}
            </q-td>
            <q-td key="GroupName" :props="props">
              {{ props.row.GroupName }}
            </q-td>
            <q-td key="CurrentAge" :props="props">
              {{ props.row.CurrentAge }}
            </q-td>
            <q-td key="BirthDate" :props="props">
              {{ props.row.BirthDate }}
            </q-td>
            <q-td key="PhysicalAddressCity" :props="props">
              {{ props.row.PhysicalAddressCity }}
            </q-td>

            <q-td key="PhysicalAddressState" :props="props">
              {{ props.row.PhysicalAddressState }}
            </q-td>
            <q-td key="PhysicalAddressZipCode" :props="props">
              {{ props.row.PhysicalAddressZipCode }}
            </q-td>
            <q-td key="HomePhone" :props="props">
              {{ props.row.HomePhone }}
            </q-td>
            <q-td key="AlternatePhone" :props="props">
              {{ props.row.AlternatePhone }}
            </q-td>
            <q-td key="Email" :props="props">
              {{ props.row.Email }}
            </q-td>
            <q-td key="N12348395592" :props="props">
              {{ props.row.N12348395592 }}
            </q-td>
            <q-td key="Comentarios" :props="props">
              {{ props.row.Comentarios }}
            </q-td>
            <q-td key="Segundo_intento_de_contacto" :props="props">
              {{ props.row.Segundo_intento_de_contacto }}
            </q-td>
            <q-td key="Comentarios2" :props="props">
              {{ props.row.Comentarios2 }}
            </q-td>
            <q-td key="Tercer_intento_de_contacto" :props="props">
              {{ props.row.Tercer_intento_de_contacto }}
            </q-td>
            <q-td key="Comentarios3" :props="props">
              {{ props.row.Comentarios3 }}
            </q-td>
            <q-td key="FECHA_DE_CITA" :props="props">
              {{ props.row.FECHA_DE_CITA }}
            </q-td>

            <q-td key="CBP" :props="props">
              {{ props.row.CBP }}
            </q-td>
            <q-td key="A1C" :props="props">
              {{ props.row.A1C }}
            </q-td>
            <q-td key="BCS" :props="props">
              {{ props.row.BCS }}
            </q-td>
            <q-td key="CCS" :props="props">
              {{ props.row.CCS }}
            </q-td>
            <q-td key="COL" :props="props">
              {{ props.row.COL }}
            </q-td>
            <q-td key="EYE_EXAM" :props="props">
              {{ props.row.EYE_EXAM }}
            </q-td>
            <q-td key="FLU" :props="props">
              {{ props.row.FLU }}
            </q-td>
            <q-td key="CCP" :props="props">
              {{ props.row.CCP }}
            </q-td>
            <q-td key="HerpesZ_Num" :props="props">
              {{ props.row.HerpesZ_Num }}
            </q-td>
            <q-td key="LastDOS_HerpesZ" :props="props">
              {{ props.row.LastDOS_HerpesZ }}
            </q-td>

            <q-td key="Tetano_Num" :props="props">
              {{ props.row.Tetano_Num }}
            </q-td>
            <q-td key="LastDOS_Tetano" :props="props">
              {{ props.row.LastDOS_Tetano }}
            </q-td>
            <q-td key="Neumococo_Num" :props="props">
              {{ props.row.Neumococo_Num }}
            </q-td>
            <q-td key="LastDOS_Neumococo" :props="props">
              {{ props.row.LastDOS_Neumococo }}
            </q-td>
            <q-td key="HepC_Num2" :props="props">
              {{ props.row.HepC_Num2 }}
            </q-td>
            <q-td key="LastDOS_HepC2" :props="props">
              {{ props.row.LastDOS_HepC2 }}
            </q-td>
            <q-td key="AAA_Num" :props="props">
              {{ props.row.AAA_Num }}
            </q-td>
            <q-td key="LastDOS_AAA" :props="props">
              {{ props.row.LastDOS_AAA }}
            </q-td>
            <q-td key="LastDOS_Densitrometry" :props="props">
              {{ props.row.LastDOS_Densitrometry }}
            </q-td>
            <q-td key="HIV_Num" :props="props">
              {{ props.row.HIV_Num }}
            </q-td>

            <q-td key="LastDOS_HIV" :props="props">
              {{ props.row.LastDOS_HIV }}
            </q-td>
            <q-td key="Chlamydia_Num" :props="props">
              {{ props.row.Chlamydia_Num }}
            </q-td>
            <q-td key="LastDOS_Chlamydia" :props="props">
              {{ props.row.LastDOS_Chlamydia }}
            </q-td>
            <q-td key="Gonorrhea_Num" :props="props">
              {{ props.row.Gonorrhea_Num }}
            </q-td>
            <q-td key="LastDOS_Gonorrhea" :props="props">
              {{ props.row.LastDOS_Gonorrhea }}
            </q-td>
            <q-td key="LastPreventive_Visit" :props="props">
              {{ props.row.LastPreventive_Visit }}
            </q-td>
            <q-td key="PreventiveCenter_Name_LastVisit" :props="props">
              {{ props.row.PreventiveCenter_Name_LastVisit }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.zona?.name }}
            </q-td>

            <!-- <q-td key="name" :props="props">
              <div v-if="props.row.user?.name">
                {{ props.row.user?.name }}
              </div>
              <div class="text-negative" style="cursor: pointer" v-else>
                No asignado
              </div>
            </q-td> -->
          </q-tr>
        </template>
      </q-table>
      <!-- pagination -->
      <div
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
          />
        </div>
      </div>
      <NotificationsVue ref="notify" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { exportFile, useQuasar } from "quasar";
import * as XLSX from "xlsx";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import TablePagination from "src/components/table/TablePagination.vue";
import ExportJsonExcel from "js-export-excel";
import moment from "moment";

const openModal = ref(false);
const openModalExport = ref(false);
const fileSeleted = ref("");
const total = ref(0);
const totalSend = ref(0);
const userOption = ref([]);
const nameFile = ref("");

const rows = ref([]);
const comercialDocumentInfo = ref([]);
const comercialDocumentInfoSelected = ref(null);
const tableLoading = ref(false);
const loading = ref(false);

const limit = ref(10);
const initial = ref(0);
const orderQuantity = ref(1);
const initialPagination = ref(1);
const zones = ref([]);
const zoneSelected = ref(null);
const userSelected = ref(null);
const text = ref("");
const columns2 = ref(columns.columnsComercial());
const isFederal = ref(false);
const uploadToBackend = ref(false);
const notify = ref(null);

onMounted(() => {
  getComercial();
  getZonesActived();
  // getOperadorasFilter();
  getComercialDocumentInfo();
});

const federalColumnMapper = {
  // "Comentarios Adicionales": "ComentariosAdicionales",
  "Member Number": "memberIdentificationNumber",
  "Full Name": "MemberFullname",
  Age: "CurrentAge",
  "Birth Date": "BirthDate",
  City: "PhysicalAddressCity",
  // Enrollment Status
  // Last Product Name
  "Phone Number": "HomePhone",
  "Zip Code": "PhysicalAddressZipCode",
  // Primer Intento de Contacto
  Comentarios: "Comentarios",
  "Segundo Intento de Contacto": "Segundo_intento_de_contacto",
  Comentario2: "Comentarios2",
  "Tercer Intento de Contacto": "Tercer_intento_de_contacto",
  Comentario3: "Comentarios3",
  "FECHA DE CITA": "FECHA_DE_CITA",
  // AISINFL
  // BCS_E
  CBP: "CBP",
  CCS: "CCS",
  COL: "COL",
  // HBD1
  // HerpesZ_Den
  HerpesZ_Num: "HerpesZ_Num",
  LastDOS_HerpesZ: "LastDOS_HerpesZ",
  // Tetano_Den
  Tetano_Num: "Tetano_Num",
  LastDOS_Tetano: "LastDOS_Tetano",
  // Neumococo_Den
  Neumococo_Num: "Neumococo_Num",
  LastDOS_Neumococo: "LastDOS_Neumococo",
  // HepC_Den2
  HepC_Num2: "HepC_Num2",
  LastDOS_HepC2: "LastDOS_HepC2",
  // AAA_Den
  AAA_Num: "AAA_Num",
  LastDOS_AAA: "LastDOS_AAA",
  // Densitrometry_Den
  Densitrometry_Num: "Densitrometry_Num",
  LastDOS_Densitrometry: "LastDOS_Densitrometry",
  // HIV_Den
  HIV_Num: "HIV_Num",
  LastDOS_HIV: "LastDOS_HIV",
  // Chlamydia_Den
  Chlamydia_Num: "Chlamydia_Num",
  LastDOS_Chlamydia: "LastDOS_Chlamydia",
  // Gonorrhea_Den
  Gonorrhea_Num: "Gonorrhea_Num",
  LastDOS_Gonorrhea: "LastDOS_Gonorrhea",
  // LastPreventiveVisit_ServiceDate
  // LastVisitPreventiveCenter_Name
  LastPreventiveVisit_ServiceDate: "LastPreventive_Visit",
  LastVisitPreventiveCenter_Name: "PreventiveCenter_Name_LastVisit",

  "Company Code": "CompanyCode",
  Relationship: "Relationship",
  Company: "Company",
  "Group Number": "GroupNumber",
  Gender: "Gender",
  "Enroll Type": "enrollType",
  "Group Name": "GroupName",
  State: "PhysicalAddressState",
  "Alternate Phone": "AlternatePhone",
  Email: "Email",
  N12348395592: "N12348395592",
  A1C: "A1C",
  BCS: "BCS",
  "EYE EXAM": "EYE_EXAM",
  FLU: "FLU",
  CCP: "CCP",
};

const nonFederalColumnMapper = {
  // Puedes dejar fuera los campos federales si son distintos o más simples
  "Comentarios adicionales": "ComentariosAdicionales",
  memberidentificationnumber: "memberIdentificationNumber",
  MemberFullname: "MemberFullname",
  CompanyCode: "CompanyCode",
  Company: "Company",
  GroupNumber: "GroupNumber",
  GroupName: "GroupName",
  Relationship: "Relationship",
  enrolltype: "enrolltype",
  Gender: "Gender",
  BirthDate: "BirthDate",
  CurrentAge: "CurrentAge",
  PhysicalAddressCity: "PhysicalAddressCity",
  PhysicalAddressState: "PhysicalAddressState",
  PhysicalAddressZipCode: "PhysicalAddressZipCode",
  HomePhone: "HomePhone",
  AlternatePhone: "AlternatePhone",
  Email: "Email",
  12348395592: "N12348395592",
  Comentarios: "Comentarios",
  "Segundo intento de contacto": "Segundo_intento_de_contacto",
  Comentarios2: "Comentarios2",
  "Tercer intento de contacto": "Tercer_intento_de_contacto",
  Comentarios3: "Comentarios3",
  CBP: "CBP",
  A1C: "A1C",
  BCS: "BCS",
  CCS: "CCS",
  COL: "COL",
  "EYE EXAM": "EYE_EXAM",
  FLU: "FLU",
  CCP: "CCP",
  HerpesZ_Num: "HerpesZ_Num",
  LastDOS_HerpesZ: "LastDOS_HerpesZ",
  Tetano_Num: "Tetano_Num",
  LastDOS_Tetano: "LastDOS_Tetano",
  Neumococo_Num: "Neumococo_Num",
  LastDOS_Neumococo: "LastDOS_Neumococo",
  HepC_Num2: "HepC_Num2",
  LastDOS_HepC2: "LastDOS_HepC2",
  AAA_Num: "AAA_Num",
  LastDOS_AAA: "LastDOS_AAA",
  Densitrometry_Num: "Densitrometry_Num",
  LastDOS_Densitrometry: "LastDOS_Densitrometry",
  HIV_Num: "HIV_Num",
  LastDOS_HIV: "LastDOS_HIV",
  Chlamydia_Num: "Chlamydia_Num",
  LastDOS_Chlamydia: "LastDOS_Chlamydia",
  Gonorrhea_Num: "Gonorrhea_Num",
  LastDOS_Gonorrhea: "LastDOS_Gonorrhea",
  LastPreventive_Visit: "LastPreventive_Visit",
  PreventiveCenter_Name_LastVisit: "PreventiveCenter_Name_LastVisit",
};

function wrapCsvValue(val, row) {
  let formatted = val;

  formatted = formatted = String(formatted);

  formatted = formatted.split('"').join('""');

  return `"${formatted}"`;
}

const exportTable = async () => {
  loading.value = true;
  const resp = await methodsHttp.getApi(
    `comercial/getComercialForExcel/${comercialDocumentInfoSelected.value._id}`
  );
  if (resp.ok) {
    loading.value = false;
    const content = await [columns2.value.map((col) => wrapCsvValue(col.label))]
      .concat(
        resp.comercialsForExcel.map((row) =>
          columns2.value
            .map((col) => wrapCsvValue(row[col.name], row))
            .join(",")
        )
      )
      .join("\r\n");

    const status = await exportFile("table-export.csv", content, "text/csv");
  }
};

watch(initialPagination, async (value) => {
  initial.value = (await value) * 10;
  if (value == 1) {
    initial.value = 0;
    getComercial();
  } else {
    initial.value = value * 10 - 10;
    getComercial();
  }
});

const AddFile = () => {
  openModal.value = true;
};

const getFile = (e) => {
  let file = e.target.files[0];
  nameFile.value = file.name;
  if (file == "" || file == null || file == undefined) {
    console.log("no hay nada selecionado file");
    fileSeleted.value = "";
  } else {
    fileSeleted.value = e.target.files[0];
    console.log("so hay nada selecionado file");
  }
};

function formatCellValue(key, value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim().toUpperCase() === "NULL")
  ) {
    return "";
  }

  return String(value).trim();
}

const saveProductFile = async () => {
  if (uploadToBackend.value) {
    const formData = new FormData();
    formData.append("file", fileSeleted.value);
    formData.append("zoneId", zoneSelected.value._id);
    formData.append("nameFile", nameFile.value);
    formData.append("isFederal", isFederal.value);

    loading.value = true; // 🔁 INICIO LOADING
    const resp = await methodsHttp.postApi(
      "comercial/uploadComercialFile",
      formData
    );
    if (resp.ok) {
      notify.value.showNotifyGood("Archivo enviado al backend exitosamente");
      openModal.value = false;
    } else {
      notify.value.showNotifyBad("Error al enviar archivo");
    }
    loading.value = false; // ✅ FINALIZA LOADING
    getComercial();
    return;
  }

  const promise = new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.readAsArrayBuffer(fileSeleted.value);

    fileReader.onload = (e) => {
      const bufferArray = e.target.result;
      const wb = XLSX.read(bufferArray, { type: "buffer" });

      const wsname = wb.SheetNames[0];

      const ws = wb.Sheets[wsname];

      // const data = XLSX.utils.sheet_to_json(ws);

      const rawData = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });

      const columnMapperToUse = isFederal.value
        ? federalColumnMapper
        : nonFederalColumnMapper;

      const data = rawData.map((row) => {
        const mappedRow = {};
        for (const key in row) {
          const newKey = columnMapperToUse[key] || key;
          mappedRow[newKey] = formatCellValue(newKey, row[key]);
        }
        return mappedRow;
      });

      resolve(data);
    };

    fileReader.onerror = (error) => {
      reject(error);
    };
  });

  promise.then(async (d) => {
    const info = await methodsHttp.postApi(
      `comercial/createComercialDocumentInfo/${zoneSelected.value._id}/${nameFile.value}`,
      { isFederal: isFederal.value }
    );
    if (info.ok) {
      // console.log(info.comercialDocumenInfo._id);
      // let added = [];
      // let noAdded = [];

      total.value = d.length;
      for (let i in d) {
        totalSend.value = Number(i) + 1;
        const resp = await methodsHttp.postApi(
          `comercial/createComercial/${zoneSelected.value._id}`,
          {
            ...d[i],
            comercialDocumenInfo: info.comercialDocumenInfo._id,
            isFederal: isFederal.value,
          }
        );
        if (resp.ok) {
        }
      }
    }
  });
};

const getComercial = async () => {
  tableLoading.value = true;
  const resp = await methodsHttp.getApi(
    `comercial/getComercial/${limit.value}/${initial.value}/${
      userSelected.value && userSelected.value._id
    }/${zoneSelected.value && zoneSelected.value._id}`
  );

  if (resp.ok) {
    rows.value = resp.comercial;
    orderQuantity.value = Math.ceil(resp.count / 10);
    // TableFilter.value = resp.operadoras;
  }
  tableLoading.value = false;
};

const getComercialDocumentInfo = async () => {
  const resp = await methodsHttp.getApi(`comercial/getComercialDocumentInfo`);

  if (resp.ok) {
    comercialDocumentInfo.value = resp.comercialDocumenInfo;
  }
};

const getZonesActived = async () => {
  const resp = await methodsHttp.getApi(`zones/getZonesActived`);
  if (resp.ok) {
    zones.value = resp.zones;
  }
  tableLoading.value = false;
};

// const getOperadorasFilter = async () => {
//   const resp = await methodsHttp.getApi(`user/getOperadorasFilter`);
//   if (resp.ok) {
//     userOption.value = resp.operadoras;
//   }
//   tableLoading.value = false;
// };

// watch(text, (value) => {
//   changePaginationValues();
//   if (value) {
//     rows.value = [];

//     getComercialBySearch(value);
//   } else {
//     getComercial();
//   }
// });

const changePaginationValues = async () => {
  initial.value = 0;
  limit.value = 10;
  initialPagination.value = 1;
  userSelected.value = await null;
  zoneSelected.value = await null;
};

const getComercialBySearch = async () => {
  tableLoading.value = true;
  const resp = await methodsHttp.getApi(
    `comercial/getComercialBySearch/${limit.value}/${initial.value}/${text.value}/${
      userSelected.value && userSelected.value._id
    }/${zoneSelected.value && zoneSelected.value._id}`
  );

  if (resp.ok) {
    rows.value = resp.comercial;
    orderQuantity.value = Math.ceil(resp.count / 10);
  }
  tableLoading.value = false;
};

const clear = async () => {
  await changePaginationValues();
  await getComercial();
};

const exportExcel = () => {
  let option = {};
  option.fileName = "CALENDARIO MEDICO"; // nombre de archivo
  // name price quantity upc
  option.datas = [
    {
      sheetData: [
        // { one: "name", two: "upc", three: "quantity", four:"price" },
      ], // datos
      sheetName: "HISTORIAL", // nombre de la hoja
      sheetFilter: ["two", "one", "three", "four"], // filtrado de columna
      sheetHeader: [
        "ComentariosAdicionales",
        "memberIdentificationNumber",
        "MemberFullname",
        "CompanyCode",
        "Relationship",
        "Company",
        "GroupNumber",
        "Gender",
        "enrollType",
        "GroupName",
        "CurrentAge",
        "BirthDate",
        "PhysicalAddressCity",
        "PhysicalAddressState",
        "PhysicalAddressZipCode",
        "HomePhone",
        "AlternatePhone",
        "Email",
        "N12348395592",
        "Comentarios",
        "Segundo_intento_de_contacto",
        "Comentarios2",
        "Tercer_intento_de_contacto",
        "Comentarios3",
        "FECHA_DE_CITA",
        "CBP",
        "A1C",
        "BCS",
        "CCS",
        "COL",
        "EYE_EXAM",
        "FLU",
        "CCP",
        "HerpesZ_Num",
        "LastDOS_HerpesZ",
        "Tetano_Num",
        "LastDOS_Tetano",
        "Neumococo_Num",
        "LastDOS_Neumococo",
        "HepC_Num2",
        "LastDOS_HepC2",
        "AAA_Num",
        "LastDOS_AAA",
        "LastDOS_Densitrometry",
        "HIV_Num",
        "LastDOS_HIV",
        "Chlamydia_Num",
        "LastDOS_Chlamydia",
        "Gonorrhea_Num",
        "LastDOS_Gonorrhea",
        "LastPreventive_Visit",
        "PreventiveCenter_Name_LastVisit",
        "user",
        "zona",
      ], // encabezado de la primera fila
      // columnWidths: [20, 20] // el ancho de la columna debe corresponder al orden de la columna
    },
    // varias tablas
  ];

  const toExcel = new ExportJsonExcel(option); //new
  toExcel.saveExcel(); // Guardar
};
</script>

<style>
.borderes {
  border: 1px solid red;
}
</style>
