<template>
  <div>
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-auto col-md-auto row items-center">
        <q-btn
          color="primary"
          label="Agregar"
          style="width: 100%; height: 40px"
          icon="calendar_month"
          @click="createUserAssociate"
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
        :columns="columns.columnHorario()"
        title="HORARIO"
        row-key="name"
        :bordered="false"
        flat
        :rows-per-page-options="[10]"
        dense
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <!-- <q-td key="actions" :props="props">
              <q-btn
                dense
                flat
                round
                icon="edit"
                color="primary"
                @click="openModalEdit(props.row)"
                class="q-mr-xs"
              />
              <q-btn
                dense
                flat
                round
                icon="delete"
                color="negative"
                @click="openModalDelete(props.row)"
              />
            </q-td> -->

            <q-td key="actions" :props="props">
              <ActionsButtons :menuItems="menuItems" :data="props.row" />
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row?.day?.day }}
            </q-td>

            <q-td key="init" :props="props">
              <b>{{ moment(props.row.initHour).format("h:mm A") }}</b>
            </q-td>

            <q-td key="end" :props="props">
              <b>{{ moment(props.row.finalHour).format("h:mm A") }}</b>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>

    <!-- MODAL (Agregar / Editar) -->
    <q-dialog v-model="openModal" persistent>
      <q-card style="width: 400px; max-width: 80vw">
        <div class="bg-white row justify-between q-pa-md">
          <div class="text-white" style="font-size: 19px; font-weight: 500">
            <div class="row items-center">
              <div class="col-auto q-mx-sm">
                <q-icon
                  size="2em"
                  :name="isEditing ? 'edit' : 'add'"
                  color="primary"
                />
              </div>
              <div class="col-auto text-primary">
                <b>{{ isEditing ? "EDITAR HORARIO" : "AGREGAR" }}</b>
              </div>
            </div>
          </div>
          <span
            class="material-icons text-negative"
            style="font-size: 23px; cursor: pointer"
            @click="openModal = false"
          >
            cancel
          </span>
        </div>

        <q-card-section class="q-pt-none">
          <q-form>
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <label>
                  <b class="text-negative">* </b>
                  <b>SELECCIONAR DÍA</b>
                </label>
                <q-select
                  outlined
                  dense
                  color="primary"
                  :options="days"
                  v-model="daysSelected"
                  option-label="day"
                />
              </div>

              <div class="col-12">
                <label
                  ><b class="text-negative">* </b><b>HORA DE INICIO</b></label
                >
                <q-input outlined v-model="form.initHour" dense mask="time">
                  <template v-slot:append>
                    <q-icon
                      name="access_time"
                      color="primary"
                      class="cursor-pointer"
                    >
                      <q-popup-proxy
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                      >
                        <q-time v-model="form.initHour">
                          <div class="row items-center justify-end">
                            <q-btn
                              v-close-popup
                              label="Close"
                              color="primary"
                              flat
                            />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="col-12">
                <label
                  ><b class="text-negative">* </b><b>HORA DE FINAL</b></label
                >
                <q-input outlined v-model="form.finalHour" dense mask="time">
                  <template v-slot:append>
                    <q-icon
                      name="access_time"
                      color="primary"
                      class="cursor-pointer"
                    >
                      <q-popup-proxy
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                      >
                        <q-time v-model="form.finalHour">
                          <div class="row items-center justify-end">
                            <q-btn
                              v-close-popup
                              label="Close"
                              color="primary"
                              flat
                            />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="col-12">
                <div class="text-white">.</div>
                <q-btn
                  color="primary"
                  :label="isEditing ? 'Actualizar' : 'Agregar'"
                  style="width: 100%; height: 40px"
                  :disable="daysSelected == null"
                  @click="submit"
                />
              </div>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo" @deleteGood="getSchedule" />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
import columns from "src/components/utils/columns";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Delete from "src/components/utils/Delete.vue";
import { authStore } from "src/stores/auth-store";
import moment from "moment";
import ActionsButtons from "src/components/table/ActionsButtons.vue";

const auth = authStore();

const rows = ref([]);
const openModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const days = ref([]);
const daysSelected = ref(null);

const form = ref({
  initHour: "08:00",
  finalHour: "17:00",
});

const notify = ref();
const deleteInfo = ref();

onMounted(() => {
  getDays();
  getSchedule();
});

const resetForm = () => {
  daysSelected.value = null;
  form.value = { initHour: "08:00", finalHour: "17:00" };
  editingId.value = null;
};

const getDays = async () => {
  const resp = await methodsHttp.getApi(`schedule/getDays`);
  if (resp.ok) days.value = resp.days;
};

const getSchedule = async () => {
  const resp = await methodsHttp.getApi(
    `schedule/getScheduleByUser/${auth.userAssociate}`
  );
  if (resp.ok) rows.value = resp.schedules;
};

const createUserAssociate = () => {
  isEditing.value = false;
  resetForm();
  openModal.value = true;
};

const openModalEdit = (row) => {
  isEditing.value = true;
  openModal.value = true;
  editingId.value = row._id;

  // precargar
  daysSelected.value = row.day; // objeto { _id, day }
  form.value.initHour = moment(row.initHour).format("HH:mm");
  form.value.finalHour = moment(row.finalHour).format("HH:mm");
};

const submit = async () => {
  if (isEditing.value) {
    await update();
  } else {
    await add();
  }
};

const add = async () => {
  const today = moment().format("YYYY-MM-DD");
  const data = {
    day: daysSelected.value._id,
    user: auth.userAssociate,
    initHour: moment(
      `${today} ${form.value.initHour}`,
      "YYYY-MM-DD HH:mm"
    ).toDate(),
    finalHour: moment(
      `${today} ${form.value.finalHour}`,
      "YYYY-MM-DD HH:mm"
    ).toDate(),
  };

  const resp = await methodsHttp.postApi(`schedule/createSchedule`, data);
  if (resp.ok) {
    openModal.value = false;
    notify.value?.showNotifyGood(resp.mensaje || "Horario agregado");
    getSchedule();
  } else {
    notify.value?.showNotifyBad(resp.mensaje || "No se pudo agregar");
  }
};

const update = async () => {
  const today = moment().format("YYYY-MM-DD");
  const data = {
    day: daysSelected.value._id,
    user: auth.userAssociate,
    initHour: moment(
      `${today} ${form.value.initHour}`,
      "YYYY-MM-DD HH:mm"
    ).toDate(),
    finalHour: moment(
      `${today} ${form.value.finalHour}`,
      "YYYY-MM-DD HH:mm"
    ).toDate(),
  };

  const resp = await methodsHttp.putApi(
    `schedule/updateSchedule/${editingId.value}`,
    data
  );
  if (resp.ok) {
    openModal.value = false;
    notify.value?.showNotifyGood(resp.mensaje || "Horario actualizado");
    getSchedule();
  } else {
    notify.value?.showNotifyBad(resp.mensaje || "No se pudo actualizar");
  }
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: "schedule/deleteSchedule",
  };
  deleteInfo.value?.openDelete(data, "Departments");
};

const menuItems = ref([
  {
    icon: "edit",
    text: "EDITAR",
    color: "primary",
    action: openModalEdit,
  },
  {
    icon: "delete",
    text: "ELIMINAR",
    color: "negative",
    action: openModalDelete,
  },
]);
</script>
