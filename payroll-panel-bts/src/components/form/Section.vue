<template>
  <div>
    <q-item clickable class="row items-center" @click="ModalActive">
      <div class="col-auto">
        <q-icon name="add" color="primary" size="25px" />
      </div>
      <div class="q-px-sm col-auto">SECCIÓN</div>
    </q-item>

    <!-- modal -->
    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 700px; max-width: 80vw">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="add" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b>{{ modo ? "EDITAR SECCIÓN" : "AGREGAR SECCIÓN" }}</b>
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
              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> NOMBRE DE LA SECCIÓN </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.name" />
              </div>
              <div class="col-12 col-md-3">
                <label>
                  <b> <b class="text-negative">* </b>ORDEN</b>
                </label>
                <q-input
                  type="number"
                  outlined
                  dense
                  color="primary"
                  v-model="form.order"
                />
              </div>
              <div class="col-12 col-md-3">
                <label>
                  <b class="text-white">.</b>
                </label>
                <q-btn
                  color="primary"
                  label="Agregar"
                  style="width: 100%; height: 40px"
                  icon="add"
                  @click="save"
                  :disable="
                    form.name == '' || form.order < 0 || form.order == undefined
                  "
                />
              </div>

              <div
                v-if="error"
                style="font-size: 15px; font-weight: bold"
                class="error text-white bg-negative col-12 text-center q-py-sm q-my-sm"
              >
                Ya existe este order en una section
              </div>
              <div class="q-my-md col-12">
                <q-separator />
              </div>

              <!-- table -->
              <div class="col-12">
                <q-table
                  :rows="rows"
                  :columns="columns.columnsSection()"
                  title="SECCIONES"
                  row-key="name"
                  :bordered="false"
                  flat
                  :rows-per-page-options="[10]"
                  dense
                >
                  <template v-slot:body="props">
                    <q-tr :props="props">
                      <q-td key="name" :props="props">
                        {{ props.row.name }}
                      </q-td>

                      <q-td key="name" :props="props">
                        <div v-if="props.row.isActive">
                          <q-badge
                            color="secondary"
                            label="ACTIVO"
                            style="cursor: pointer"
                          />
                        </div>
                        <div v-else>
                          <q-badge
                            color="negative"
                            label="INACTIVO"
                            style="cursor: pointer"
                          />
                        </div>
                      </q-td>

                      <q-td key="name" :props="props">
                        {{ props.row.order }}
                      </q-td>

                      <q-td key="name" :props="props">
                        <button @click="edit(props.row)">edit</button>
                      </q-td>
                    </q-tr>
                  </template>
                </q-table>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import columns from "src/components/utils/columns";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Delete from "src/components/utils/Delete.vue";
import ModifiText from "src/components/utils/modifiText";

const emit = defineEmits(["updateTable"]);
const notify = ref();
const deleteInfo = ref();
const modo = ref(false);
const error = ref(false);
const rows = ref([]);
const form = ref({
  name: "",
  order: 0,
});

const openModal = ref(false);

const props = defineProps({
  id: String,
  data: Object,
});

const ModalActive = () => {
  modo.value = false;
  openModal.value = true;
  rows.value = props.data.section;
};

const edit = (item) => {
  modo.value = true;
  form.value.name = item.name;
  form.value.order = item.order;
};

const save = async () => {
  let index = rows.value.findIndex((e) => {
    return e.order == form.value.order;
  });
  if (modo.value == false) {
    if (index == -1) {
      let resp = await methodsHttp.postApi("form/createSection", {
        ...form.value,
        id: props.id,
      });
      emit("updateTable");
      clear();
      openModal.value = false;
    } else {
      error.value = true;
      console.log("mensaje de que ya esta ese order");
    }
  } else {
    console.log("edit", modo.value);
  }
};

const clear = () => {
  (form.value.name = ""), (form.value.order = 0);
};
</script>
<style scoped>
</style>
