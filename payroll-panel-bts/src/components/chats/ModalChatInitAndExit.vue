<template>
  <div>
    <q-dialog v-model="alert">
      <q-card style="width: 600px; max-width: 90vw">
        <!-- <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm"></div>
                <div class="col-auto"></div>
              </div>
            </div>
            <span
              class="material-icons"
              style="color: red; font-size: 23px; cursor: pointer"
              @click="openModal = false"
            >
              cancel
            </span>
          </div> -->

        <!-- <div class="q-my-xl">
            <div class="text-center">
              <q-icon name="check" color="secondary" style="font-size: 7em" />
            </div>
            <div class="text-center text-h5 q-mb-sm">Estas seguro?</div>
            <div class="text-center text-h6" style="color: gray">
              que quieres realizar esta acción
            </div>
          </div> -->
        <div class="q-my-xl">
          <div class="text-center">
            <q-img src="../../assets/logo/chat-init.png" width="400px" />
          </div>
          <div class="text-center text-primary text-h6 q-mt-sm">¿ESTAS SEGURO</div>
          <div class="text-center text-primary text-h6">QUE QUIERES REALIZAR ESTA ACCION ?</div>
        </div>

        <!-- <q-btn flat label="OK" color="primary" @click="save" /> -->
        <div class="row q-col-gutter-sm justify-center q-mb-md q-mt-xl">
          <div class="col-auto">
            <q-btn
              flat
              type="submit"
              color="negative"
              label="cancelar"
              icon="cancel"
              style="width: 100%; height: 30px"
              @click="alert = false"
            />
          </div>
          <div class="col-auto">
            <q-btn
              flat
              color="primary"
              label=" Aceptar"
              style="width: 100%; height: 30px"
              icon="start"
              @click="init"
            />
          </div>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>
  
  <script>
import { ref } from "vue";

export default {
  setup(props, { emit }) {
    const alert = ref(false);
    const init = () => {
      emit("saveValue");
      alert.value = false;
    };
    const chatInit = (item) => {
      alert.value = true;
    };
    return {
      chatInit,
      alert,
      init,
    };
  },
  emits: ["saveValue"],
};
</script>
  