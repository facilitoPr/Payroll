<template>
  <div class="bg-white">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-subtitle1 text-weight-bold">Deducciones</div>
        <div class="text-caption text-grey-6">
          Crea y configura las deducciones
        </div>
      </div>

      <q-btn
        color="primary"
        icon="add"
        label="Agregar DEDUCCIONES"
        @click="openModal = true"
      />
    </div>

    <div class="q-my-md">
      <q-separator />
    </div>

    <!-- table -->
    <div>
      <q-table
        title="DEDUCCIONES"
        :rows="rows"
        :columns="columns"
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
                    @click="openModalEditPlan(props.row)"
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
                    @click="openModalDeletePlan(props.row)"
                  >
                    <q-item clickable class="row items-center">
                      <div class="col-auto">
                        <q-icon name="delete" color="negative" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">ELIMINAR</div>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-icon>
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.name }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.code }}
            </q-td>

            <q-td key="name" :props="props">
              <div v-if="props.row.isLegal">
                <q-badge color="secondary" label="SI" style="cursor: pointer" />
              </div>
              <div v-if="!props.row.isLegal">
                <q-badge color="negative" label="NO" style="cursor: pointer" />
              </div>
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.percentage }} %
            </q-td>

            <q-td key="name" :props="props">
              <b class="text-secondary">$</b>
              {{ money.formatter(props.row.fixedAmount) }}
            </q-td>

            <q-td key="name" :props="props">
              <div v-if="props.row.isActive">
                <q-badge
                  color="secondary"
                  label="ACTIVO"
                  style="cursor: pointer"
                />
              </div>
              <div v-if="!props.row.isActive">
                <q-badge
                  color="negative"
                  label="INACTIVO"
                  style="cursor: pointer"
                />
              </div>
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.description }}
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>

    <!-- modal -->
    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 800px; max-width: 90vw">
          <div class="bg-primary row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="price_check" color="white" />
                </div>
                <div class="col-auto">
                  <b>{{
                    modo ? "EDITAR DEDUCCIONES" : "AGREGAR DEDUCCIONES"
                  }}</b>
                </div>
              </div>
              <!-- groups -->
            </div>
            <span
              class="material-icons"
              style="color: white; font-size: 23px; cursor: pointer"
              @click="openModal = false"
            >
              cancel
            </span>
          </div>
          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <label>
                  <b> <b class="text-negative">*</b> NOMBRE</b>
                </label>
                <q-input outlined dense color="primary" v-model="form.name">
                </q-input>
              </div>

              <div class="col-6">
                <label>
                  <b> <b class="text-negative">*</b> CODIGO</b>
                </label>
                <q-input outlined dense color="primary" v-model="form.code">
                </q-input>
              </div>

              <div class="col-6">
                <label>
                  <b> <b class="text-negative">*</b>PROCENTAJE</b>
                </label>
                <q-input
                  outlined
                  dense
                  color="primary"
                  type="number"
                  v-model="form.percentage"
                >
                </q-input>
              </div>

              <div class="col-6">
                <label>
                  <b> <b class="text-negative">*</b> PRECIO</b>
                </label>
                <q-input
                  outlined
                  dense
                  color="primary"
                  type="number"
                  v-model="form.fixedAmount"
                >
                </q-input>
              </div>

              <div class="col-6">
                <label>
                  <b> REGLAMENTARIO </b>
                </label>
                <q-checkbox v-model="form.isLegal" />
              </div>

              <div class="col-6">
                <label>
                  <b> ACTIVAR </b>
                </label>
                <q-checkbox v-model="form.isActive" />
              </div>

              <div class="col-12">
                <label>
                  <b> <b class="text-negative">*</b> DESCRIPCION</b>
                </label>
                <q-input
                  type="textarea"
                  outlined
                  dense
                  color="primary"
                  v-model="form.description"
                >
                </q-input>
              </div>
            </div>

            <div class="col-12 q-mt-md q-my-sm text-center">
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
                :disable="form.name == '' || form.days == 0 || form.price == 0"
                @click="createDeductionType"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
    <NotificationsVue ref="notify" />
    <Delete ref="deleteCalendrInfo" @deleteGood="getDeductionTypeAdmin" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import money from "src/components/utils/formatter";
import Delete from "src/components/utils/Delete.vue";

const deleteInfo = ref();

const notify = ref();

const openModal = ref(false);
const modo = ref(false);
const id = ref("");

const rows = ref([]);

const form = ref({
  name: "nombre",
  code: "",
  isLegal: false,
  percentage: 0,
  isActive: true,
  fixedAmount: 1500,
  description: "prestamo",
});

onMounted(() => {
  getDeductionTypeAdmin();
});

const getDeductionTypeAdmin = async () => {
  let resp = await methodsHttp.getApi(
    `employee-payment-management/getDeductionTypeAdmin`
  );
  if (resp.ok) {
    rows.value = resp.deductionType;
  }
};

const createDeductionType = async () => {
  if (!modo.value) {
    let resp = await methodsHttp.postApi(
      `employee-payment-management/createDeductionType`,
      form.value
    );
    if (resp.ok) {
      openModal.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
      getDeductionTypeAdmin();
    } else {
      notify.value?.showNotifyGood(resp.mensaje);
    }
  } else {
    let resp = await methodsHttp.putApi(
      `employee-payment-management/updateDeductionType/${id.value}`,
      form.value
    );
    if (resp.ok) {
      openModal.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
      getDeductionTypeAdmin();
    } else {
      notify.value?.showNotifyGood(resp.mensaje);
    }
  }
};

const openModalEditPlan = (item) => {
  form.value.name = item.name;
  form.value.code = item.code;
  form.value.isActive = item.isActive;
  form.value.isLegal = item.isLegal;
  form.value.fixedAmount = item.fixedAmount;
  form.value.percentage = item.percentage;
  form.value.description = item.description;
  id.value = item._id;
  modo.value = true;
  openModal.value = true;
};

// salario fijo por dia //23.83

const openModalDeletePlan = (item) => {
  id.value = item._id;
  const data = {
    id: item._id,
    ruta: "ads/deletePlanAds",
  };
  deleteInfo.value?.openDelete(data, "Plan ads");
};

const columns = ref([
  { name: "name", label: "ACCIONES", align: "center" },
  { name: "name", label: "NOMBRE", align: "center" },
  {
    name: "name",
    label: "CODIGO ",
    align: "center",
  },

  {
    name: "name",
    label: "BAJO LEY",
    align: "right",
  },
  {
    name: "name",
    label: "PORCENTAJE",
    align: "right",
  },
  {
    name: "name",
    label: "CANTIDAD FIJA",
    align: "right",
  },
  { name: "name", label: "ESTADO", align: "center" },
  { name: "name", label: "DESCRIPCION", align: "center" },
]);
</script>
