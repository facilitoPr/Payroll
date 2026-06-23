<template>
  <div class="bordere">
    <q-table
      flat
      row-key="name"
      title="CITAS"
      :rows="appointments"
      :columns="columns.columnsCitas2()"
      :bordered="false"
      dense
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="name" :props="props">
            <Imagen
              :img="
                props.row.patient?.img
                  ? props.row.patients?.img
                  : 'https://cdn-icons-png.flaticon.com/512/1430/1430453.png'
              "
            />
          </q-td>
          <q-td key="name" :props="props">
            {{ props.row.patients?.name ? props.row.patients?.name : "No paciente" }}
          </q-td>
          <!-- <q-td key="name" :props="props">
            {{ props.row.title }}
          </q-td> -->
          <q-td key="name" :props="props">
            {{
              moment(props.row.date)
                .locale("es-do")
                .format("dddd DD MMMM, YYYY")
            }}
          </q-td>
          <q-td key="name" :props="props">
            {{ moment(props.row?.initHour).format("h:mm A") }}
          </q-td>
          <q-td key="name" :props="props">
            {{ moment(props.row?.finalHour).format("h:mm A") }}
          </q-td>

          <q-td key="name" :props="props">
            <q-icon
              name="menu"
              color="primary"
              size="25px"
              style="cursor: pointer"
            >
              <q-menu transition-show="flip-right" transition-hide="flip-left">
                <!-- editar -->
                <q-list style="min-width: 100px">
                  <q-item
                    clickable
                    class="row items-center"
                   @click="seeAppoimentData(props.row)"
                  >
                    <div class="col-auto">
                      <q-icon name="edit" color="primary" size="25px" />
                    </div>
                    <div class="q-px-sm col-auto">VER CITA</div>
                  </q-item>
                </q-list>
                <!-- eliminar -->
                <!-- <q-list style="min-width: 100px">
                  <q-item clickable class="row items-center">
                    <div class="col-auto">
                      <q-icon name="delete" color="negative" size="25px" />
                    </div>
                    <div class="q-px-sm col-auto">ELIMINAR</div>
                  </q-item>
                </q-list> -->
              </q-menu>
            </q-icon>
          </q-td>
          <!-- <q-td key="name" :props="props">
            {{ props.row?.description }}
          </q-td> -->
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, defineProps, defineEmits } from "vue";
import columns from "src/components/utils/columns";
import Imagen from "src/components/utils/Imagen.vue";
import moment from "moment";

const emit = defineEmits(["seeAppoimentData"]);

const props = defineProps({
  appointments: {
    type: Array,
    required: true,
  },
});

const seeAppoimentData = async (item) => {
  await emit("seeAppoimentData", item);
};
</script>