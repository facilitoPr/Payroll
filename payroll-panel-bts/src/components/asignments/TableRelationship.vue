<template>
  <div class="bg-white">
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-md-3">
        <q-input
          outlined
          dense
          label="Buscar"
          color="primary"
          @keyup="search"
          v-model="text"
        >
          <template v-slot:append>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- table -->
    <div>
      <q-table
        :loading="props.tableLoading"
        flat
        row-key="_id"
        title=""
        :rows="filteredRows"
        :columns="columns.columnsComercialRelationship()"
        hide-pagination
        :rows-per-page-options="[10]"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="name" :props="props" style="cursor: pointer">
              <!-- {{ props.row?.user?.name }} -->
              <q-checkbox
                v-model="props.row.isMember"
                @click="addOrRemoveMembersToComercialRelationship(props.row)"
              />
            </q-td>

            <!-- <q-td key="name" :props="props" style="cursor: pointer;"
                            @click="addOrRemoveMembersToComercialRelationship(props.row)">
                            {{ props.row?.user?.name }}
                        </q-td> -->

            <q-td
              key="name"
              :props="props"
              style="cursor: pointer"
              @click="openDetailsModal(props.row)"
            >
              {{ props.row.memberIdentificationNumber }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.MemberFullname }}
            </q-td>

            <q-td key="name" :props="props">
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
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Gender }}
            </q-td>
            <q-td key="name" :props="props">
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
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.PhysicalAddressCity }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.PhysicalAddressState }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.PhysicalAddressZipCode }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.HomePhone }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.AlternatePhone }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.Email }}
            </q-td>
            <q-td key="name" :props="props">
              {{ props.row.N12348395592 }}
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
            </q-td>
            <q-td key="name" :props="props">
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
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>

    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo" @deleteGood="getRemindersTypes" />

   <DetailsModal
      :openModal="openModal"
      :comercial="comercialSelected"
      :getComercial="search"
      @update:openModal="openModal = $event"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import Delete from "src/components/utils/Delete.vue";
import DetailsModal from "./DetailsModal.vue";

const comercialSelected = ref(null);
const text = ref("");
const openModal = ref(false);

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  tableLoading: {
    type: Boolean,
    required: true,
  },
  addOrRemoveMembersToComercialRelationship: {
    type: Function,
    required: true,
  },
  createOrGetComercialRelationship: {
    type: Function,
    required: true,
  },
  comercialData: {
    type: Object,
    required: true,
  },
});

const filteredRows = ref([]);

onMounted(() => {
  filteredRows.value = [];
  if (props.rows.length > 0) {
    filteredRows.value = [...props.rows];
  }
});

watch(
  () => props.rows,
  (newData) => {
    if (newData) {
      filteredRows.value = newData;
    }
  },
);

const search = async () => {
  props.tableLoading = true;
  // changePaginationValues();
  if (text.value == "") {
    props.createOrGetComercialRelationship(props.comercialData);
  } else {
    const resp = await methodsHttp.getApi(
      `comercial/getComercialBySearchRelationship/${text.value}/${props.comercialData._id}`,
    );
    if (resp.ok) {
      filteredRows.value = resp.comercial;
      // orderQuantity.value = Math.ceil(resp.count / 10)
      // TableFilter.value = resp.products;
    }
  }
  props.tableLoading = false;
};

const openDetailsModal = (comercial) => {
  openModal.value = true;
  comercialSelected.value = { ...comercial };
};
</script>

<style scoped></style>
