<template>
  <div>
    <PageHeaderCard
      :title="props.title"
      subtitle="Filtra por zona, busca y exporta el listado."
      icon="assignment"
    >
      <template #actions>
        <q-input
          outlined
          dense
          label="Buscar"
          color="primary"
          v-model="text"
          clearable
          class="header-search"
          @keyup.enter="onEnterSearch"
          @clear="onClearSearch"
        >
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
          <template #append>
            <q-btn
              flat
              round
              icon="search"
              @click="searchByText"
              color="primary"
            />
          </template>
        </q-input>

        <q-select
          v-model="zoneSelected"
          label="Zona"
          option-label="name"
          outlined
          dense
          color="primary"
          :options="zones"
          clearable
          class="header-field"
          @update:model-value="onZoneChange"
        >
          <template #prepend>
            <q-icon name="place" color="primary" />
          </template>

          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">No results</q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-btn
          color="primary"
          unelevated
          icon="search"
          label="Buscar"
          class="header-btn"
          @click="searchByText"
        />

        <q-btn
          color="primary"
          unelevated
          icon="person_add"
          label="Crear Paciente"
          class="header-btn"
          @click="showCreateModal = true"
        />

        <q-btn
          color="negative"
          unelevated
          icon="report"
          label="Reportar error"
          class="header-btn"
          @click="showCreateReportModal = true"
        />
      </template>
    </PageHeaderCard>

    <div>
      <q-table
        :loading="tableLoading"
        flat
        row-key="_id"
        :rows="rows"
        :columns="columns.columnsComercialAll()"
        hide-pagination
        bordered
        :rows-per-page-options="[limit]"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <!-- <q-td key="name" :props="props" @click="openDetailsModal(props.row)" style="cursor: pointer">
              {{ props.row?.user?.name }}
            </q-td> -->
            <q-td
              key="name"
              :props="props"
              @click="openDetailsModal(props.row)"
              style="cursor: pointer"
            >
              {{ props.row.memberIdentificationNumber || "N/A" }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.MemberFullname || "N/A" }}
            </q-td>
            <!-- <q-td key="name" :props="props">
              {{ props.row.CompanyCode }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Relationship }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Company }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.GroupNumber }}
            </q-td> -->
            <q-td key="name" :props="props">
              {{ props.row.Gender || "N/A" }}
            </q-td>
            <!-- <q-td key="name" :props="props">
              {{ props.row.enrollType }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.GroupName }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.CurrentAge }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.BirthDate }}
            </q-td> -->
            <!-- <q-td key="name" :props="props">
              {{ props.row.PhysicalAddressCity }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.PhysicalAddressState }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.PhysicalAddressZipCode }}
            </q-td> -->
            <q-td key="name" :props="props">
              {{ props.row.HomePhone || "N/A" }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.AlternatePhone || "N/A" }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Email || "N/A" }}
            </q-td>
            <!-- <q-td key="name" :props="props"> -->
            <!-- {{ props.row.N12348395592 }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Comentarios }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Segundo_intento_de_contacto }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Comentarios2 }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Tercer_intento_de_contacto }}
            </q-td> -->
            <!-- <q-td key="name" :props="props">
              {{ props.row.Comentarios3 }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.FECHA_DE_CITA }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.CBP }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.A1C }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.BCS }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.CCS }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.COL }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.EYE_EXAM }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.FLU }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.CCP }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.HerpesZ_Num }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.LastDOS_HerpesZ }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Tetano_Num }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.LastDOS_Tetano }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Neumococo_Num }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.LastDOS_Neumococo }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.HepC_Num2 }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.LastDOS_HepC2 }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.AAA_Num }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.LastDOS_AAA }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.LastDOS_Densitrometry }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.HIV_Num }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.LastDOS_HIV }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Chlamydia_Num }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.LastDOS_Chlamydia }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Gonorrhea_Num }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.LastDOS_Gonorrhea }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.LastPreventive_Visit }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.PreventiveCenter_Name_LastVisit }}
            </q-td> -->
            <q-td key="name" :props="props">
              {{ props.row?.zona?.name }}
            </q-td>
          </q-tr>
        </template>
      </q-table>

      <div
        class="col-12 q-mt-sm"
        style="display: flex; align-items: center; justify-content: center"
      >
        <TablePagination
          v-model="initialPagination"
          :orderQuantity="orderQuantity"
          color="light-blue-10"
          active-color="light-blue-5"
        />
      </div>
    </div>

    <NotificationsVue ref="notify" />
    <DetailsModal
      :openModal="openModal"
      :comercial="comercialSelected"
      :getComercial="getComercial"
      @update:openModal="openModal = $event"
    />

    <CreateIndividualComercial
      v-model="showCreateModal"
      @refresh="getComercial"
    />

    <CreateReportModal
      v-model="showCreateReportModal"
      :openModal="showCreateReportModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import { authStore } from "src/stores/auth-store";
import TablePagination from "src/components/table/TablePagination.vue";
import DetailsModal from "./DetailsModal.vue";
import CreateIndividualComercial from "../comertials/CreateIndividualComercial.vue";
import CreateReportModal from "../comertials/CreateReportModal.vue";
import PageHeaderCard from "../PageHeaderCard.vue";

const auth = authStore();
const openModal = ref(false);

const rows = ref([]);
const tableLoading = ref(false);

const limit = ref(10);
const initial = ref(0);
const orderQuantity = ref(1);
const initialPagination = ref(1);
const comercialSelected = ref(null);

const text = ref("");
const zones = ref([]);
const zoneSelected = ref(null);
const isSearchingAll = ref(true);
const showCreateModal = ref(false);
const showCreateReportModal = ref(false);

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
});

onMounted(() => {
  getComercial();
  getZonesActived();
});

watch(zoneSelected, async () => {
  if (zoneSelected.value) {
    text.value = "";
    getComercial();
  }
});

watch(initialPagination, async (page) => {
  initial.value = (page - 1) * limit.value;

  if (text.value) return searchByText();
  getComercial();
});

const getZonesActived = async () => {
  const resp = await methodsHttp.getApi(`zones/getZonesActived`);
  if (resp.ok) {
    zones.value = resp.zones;
  }
};

const getComercial = async () => {
  tableLoading.value = true;
  const resp = await methodsHttp.getApi(
    `comercial/getComercialByUser/${limit.value}/${initial.value}/${
      props.status
    }/${zoneSelected.value?._id || "null"}`,
  );
  if (resp.ok) {
    rows.value = resp.comercial;
    orderQuantity.value = Math.ceil(resp.count / 10);
  }
  tableLoading.value = false;
};

const searchByText = async () => {
  tableLoading.value = true;
  zoneSelected.value = null;
  changePaginationValues();

  const searchTerm = text.value;

  if (!searchTerm) {
    getComercial();
    tableLoading.value = false;
    return;
  }

  const resp = await methodsHttp.getApi(
    `comercial/getComercialBySearchAndStatus/${limit.value}/${initial.value}/${searchTerm}/null/null`,
  );
  if (resp.ok) {
    rows.value = resp.comercial;
    orderQuantity.value = Math.ceil(resp.count / 10);
  }

  tableLoading.value = false;
};

const changePaginationValues = () => {
  initial.value = 0;
  limit.value = 10;
  initialPagination.value = 1;
};

const openDetailsModal = (props) => {
  comercialSelected.value = props;
  openModal.value = true;
};

const onEnterSearch = () => {
  const val = (text.value || "").trim();
  if (!val) {
    // si está vacío, recarga listado completo
    changePaginationValues();
    getComercial();
    return;
  }
  searchByText();
};

const onClearSearch = () => {
  text.value = "";
  changePaginationValues();
  getComercial();
};

const onZoneChange = () => {
  // al cambiar zona, resetea paginación y recarga listado
  text.value = "";
  changePaginationValues();
  getComercial();
};
</script>
