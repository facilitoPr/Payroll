<template>
  <q-dialog v-model="modalOpen" persistent>
    <q-card style="width: 500px; max-width: 80vw">
      <q-inner-loading
        :showing="isLoading"
        label="Enviando..."
        label-class="text-blue-11"
        label-style="font-size: 1.1em"
      />
      <div class="bg-white row justify-between q-pa-md">
        <div class="text-primary" style="font-size: 19px; font-weight: 500">
          <div class="row items-center">
            <div class="col-auto q-mx-sm">
              <q-icon size="2em" name="people" color="primary" />
            </div>
            <div class="col-auto text-primary">
              <b>{{
                props.readOnly ? "INFORMACION DEL PACIENTE" : "CREAR PACIENTE"
              }}</b>
            </div>
          </div>
        </div>
        <span
          class="material-icons text-negative"
          style="font-size: 23px; cursor: pointer"
          @click="closeModal"
        >
          cancel
        </span>
      </div>

      <q-card-section class="q-pt-sm">
        <div class="q-pt-sm row q-col-gutter-sm">
          <q-card-section class="q-pt-sm">
            <div class="q-pt-sm row q-col-gutter-sm">
              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> NOMBRE COMPLETO </b>
                </label>
                <q-input
                  outlined
                  dense
                  color="primary"
                  v-model="form.name"
                  :disable="props.readOnly"
                />
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> EMAIL </b>
                </label>
                <q-input
                  outlined
                  dense
                  color="primary"
                  v-model="form.email"
                  :disable="props.readOnly"
                >
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> ADDRESS </b>
                </label>
                <q-input
                  outlined
                  dense
                  color="primary"
                  v-model="form.address"
                  :disable="props.readOnly"
                >
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> ZONA </b>
                </label>
                <q-select
                  v-model="form.zone"
                  label="Zonas"
                  option-value="_id"
                  option-label="name"
                  outlined
                  dense
                  color="primary"
                  :options="zones"
                  emit-value
                  map-options
                  :disable="props.readOnly"
                />
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> TELEFONO </b>
                </label>
                <q-input
                  outlined
                  dense
                  color="primary"
                  v-model="form.phone"
                  :disable="props.readOnly"
                >
                </q-input>
              </div>

              <div class="col-12 col-md-6" v-if="!props.readOnly">
                <label>
                  <b> <b class="text-negative">* </b> CONTRASEÑA </b>
                </label>

                <q-input
                  v-model="form.password"
                  outlined
                  dense
                  :type="isPassword ? 'password' : 'text'"
                >
                  <template v-slot:append>
                    <q-icon
                      :name="isPassword ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="isPassword = !isPassword"
                    />
                  </template>
                </q-input>
              </div>
            </div>

            <div class="col-12 q-my-sm text-center" v-if="!props.readOnly">
              <q-btn
                type="submit"
                color="negative"
                label="cancelar"
                icon="cancel"
                class="q-mx-sm"
                @click="closeModal"
              />
              <q-btn
                type="submit"
                color="primary"
                label="guardar"
                icon="save"
                @click="save"
                :disable="
                  form.email == '' ||
                  form.name == '' ||
                  form.phone == '' ||
                  form.zone == null ||
                  form.password == ''
                "
              />
            </div>
          </q-card-section>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
  <NotificationsVue ref="notify" />
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import { defineProps, defineEmits, ref, watch, onMounted } from "vue";

const notify = ref(null);
const user = ref(null);

const props = defineProps({
  openModal: {
    type: Boolean,
    required: true,
  },
  getPatients: {
    type: Function,
    required: false,
  },
  userData: {
    type: Object,
    required: true,
  },
  createdUser: {
    type: Object,
    required: false,
  },
  readOnly: {
    type: Boolean,
    required: false,
  },
});

const form = ref({
  name: "",
  email: "",
  phone: "",
  password: "",
  address: "",
  zone: null,
  comercial: null,
});
const isLoading = ref(false);
const zones = ref([]);

const emit = defineEmits(["update:openModal", "createdUser"]); // Agregar 'createdUser' al definir los eventos
const modalOpen = ref(props.openModal);

onMounted(() => {
  getZones();
});

const getZones = async () => {
  let resp = await methodsHttp.getApi(`zones/getZones`);

  if (resp.ok) {
    zones.value = resp.zones;
  }
};

const save = async () => {
  try {
    isLoading.value = true;
    const resp = await methodsHttp.postApi("patients/createPatient", {
      ...form.value,
    });
    if (resp?.ok) {
      closeModal();
      notify.value?.showNotifyGood(resp.mensaje);
      emit("createdUser", resp.patient);

      console.log(props.createdUser, "HOLA", resp.patient);
      props.getPatients();
      clear();
    } else {
      notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
    }
  } catch (error) {
    notify.value?.showNotifyBad("Error al crear recordatorio");
    console.error("Error en la operación save:", error);
  } finally {
    isLoading.value = false;
  }
};

const clear = () => {
  form.value.name = "";
  form.value.email = "";
  form.value.phone = "";
  form.value.password = "";
  form.value.address = null;
  form.value.zone = null;
};

// Sincroniza el modal abierto con el valor que viene del padre
watch(
  () => props.openModal,
  (newVal) => {
    modalOpen.value = newVal;
  }
);

// Emite el evento para cerrar el modal y sincroniza el estado del modal en el hijo
const closeModal = () => {
  emit("update:openModal", false);
  modalOpen.value = false;
};

// Observa cambios en modalOpen para asegurarse de que el valor en el padre también se sincronice si cambia en el hijo
watch(modalOpen, (newVal) => {
  emit("update:openModal", newVal);
  form.value.name = props.userData?.name;
  form.value.phone = props.userData?.phone;
  form.value.email = props.userData?.email;
  form.value.address = props.userData?.address;
  form.value.zone = props.userData?.zone;
  form.value.comercial = props.userData?.comercial;
});
</script>
