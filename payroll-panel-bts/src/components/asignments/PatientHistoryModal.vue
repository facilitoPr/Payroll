<template>
  <q-dialog v-model="modalOpen" persistent>
    <q-card style="width: 100%; max-width: 100vw">
      <q-inner-loading
        :showing="isLoading"
        label="Enviando..."
        label-class="text-blue-11"
        label-style="font-size: 1.1em"
      />
      <div class="bg-primary row justify-between q-pa-md">
        <div class="text-white" style="font-size: 19px; font-weight: 500">
          <div class="row items-center">
            <div class="col-auto q-mx-sm">
              <q-icon size="2em" name="task" color="white" />
            </div>
            <div class="col-auto text-white">
              <b>HISTORIAL</b>
            </div>
          </div>
        </div>
        <span
          class="material-icons text-white"
          style="font-size: 23px; cursor: pointer"
          @click="closeModal()"
        >
          cancel
        </span>
      </div>

      <q-card-section class="q-pt-sm">
        <TableReminders
          :rows="reminders"
          :tableLoading="tableLoading"
          :isHistory="true"
          :getPatientHistory="getPatientHistory"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import TableReminders from "src/components/reminders/TableReminders.vue";
import { defineProps, defineEmits, ref, watch, onMounted } from "vue";

const props = defineProps({
  openModal: {
    type: Boolean,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
});

const isLoading = ref(false);
const reminders = ref([]);
const tableLoading = ref(false);

//

const emit = defineEmits(["update:openModal"]);
const modalOpen = ref(props.openModal);

// Sincroniza el modal abierto con el valor que viene del padre
watch(
  () => props.openModal,
  (newVal) => {
    modalOpen.value = newVal;
  },
);

// Emite el evento para cerrar el modal y sincroniza el estado del modal en el hijo
const closeModal = () => {
  emit("update:openModal", false);
  modalOpen.value = false;
};

// Observa cambios en modalOpen para asegurarse de que el valor en el padre también se sincronice si cambia en el hijo
watch(modalOpen, (newVal) => {
  emit("update:openModal", newVal);
  getPatientHistory(props?.id);
});

const getPatientHistory = async (id) => {
  tableLoading.value = true;
  let resp = await methodsHttp.getApi(`comercial/getPatientHistory/${id}`);

  if (resp.ok) {
    reminders.value = resp.reminders;
  }
  tableLoading.value = false;
};
</script>
