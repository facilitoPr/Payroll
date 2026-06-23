<template>
  <q-menu>
    <div style="" class="text-center q-mx-sm text-bold">
      horario selecionada
    </div>
    <div style="" class="q-pa-sm">
      {{ moment(item.initHour).format("h:mm A") }} -
      {{ moment(item.finalHour).format("h:mm A") }}
    </div>
    <q-list style="min-width: 100px">
      <q-item clickable v-close-popup @click="isWalking">
        <q-item-section>Walk In</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="isNoWalking">
        <q-item-section>Not Walk In</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="deleteAppoiments">
        <q-item-section>Eliminar</q-item-section>
      </q-item>
      <q-separator />
    </q-list>
  </q-menu>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, defineProps, defineEmits } from "vue";
import moment from "moment";

const emit = defineEmits(["isWalking", "deleteAppoiments", "isNoWalking"]);

const showing = ref(false);

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const isWalking = async() => {
  await emit("isWalking", props.item);
};

const isNoWalking = async()=>{
  await emit("isNoWalking", props.item);
}

const deleteAppoiments = async()=>{
  await emit("deleteAppoiments", props.item);
}
</script>