<template>
  <div>
    <div
      class="row items-center"
      @click="dialog = true"
      style="cursor: pointer"
    >
      <div class="col-auto">
        <q-icon name="edit" color="primary" size="25px" />
      </div>
      <div class="q-px-sm col-auto">EDITAR IMAGEN</div>
    </div>

    <div>
      <q-dialog v-model="dialog" persistent>
        <q-card style="width: 550px; max-width: 90vw">
          <div class="bg-primary row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="add_photo_alternate" color="white" />
                </div>
                <div class="col-auto">
                  <b>SUBIR IMAGEN</b>
                </div>
              </div>
            </div>
            <span
              class="material-icons"
              style="color: white; font-size: 23px; cursor: pointer"
              @click="dialog = false"
            >
              cancel
            </span>
          </div>

          <q-card-section class="q-pt-sm row q-col-gutter-sm">
            <div class="q-pt-sm row q-col-gutter-sm">
              <div class="bordereFile col-12" style="margin-top: 10px">
                <div class="file-select col-12">
                  <div class="drag">
                    <div>
                      <div style="text-align: center">
                        <q-icon
                          size="2em"
                          name="add_photo_alternate"
                          color="white"
                        />
                      </div>
                      <div style="text-align: center">
                        <b style="font-size: 17px; color: white">
                          AÑADIR IMAGEN</b
                        >
                      </div>
                      <b
                        class="text-white"
                        style="font-size: 17px; font-weight: 600"
                        >O ARRASTRAR Y SOLTAR</b
                      >
                    </div>
                  </div>

                  <input type="file" @change="submitFile" />
                </div>
              </div>
              <div class="col-3" v-if="urlImgs">
                <q-img :src="urlImgs" />
              </div>

              <div
                style="padding-top: 30px; padding-bottom: 30px"
                v-if="loading"
              >
                <q-inner-loading
                  :showing="loading"
                  label="Por favor esperar..."
                  label-class="text-primary"
                  label-style="font-size: 1.1em"
                  color="primary"
                />
              </div>

              <div class="col-12 q-my-sm text-center">
                <q-btn
                  type="submit"
                  color="negative"
                  label="cancelar"
                  icon="cancel"
                  class="q-mx-sm"
                  @click="dialog = false"
                />

                <q-btn
                  type="submit"
                  color="primary"
                  label="guardar"
                  icon="save"
                  @click="submit(props.modelId, props.valueId, props.models)"
                  :disabled="!img"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>

    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
// const { default: NotificationsVue } = require("../utils/Notifications.vue");

const img = ref(null);
const dialog = ref(false);
const notify = ref();
const urlImgs = ref(props.image);

const loading = ref(false);

const emit = defineEmits(["updateImg"]);

const submitFile = (e) => {
  img.value = e.target.files[0];
  urlImgs.value = URL.createObjectURL(img.value);
};

const submit = async () => {
  loading.value = true;
  const formData = new FormData();
  formData.append("image", img.value);
  // formData.append(modelId, valueId);
  // formData.append("models", models);

  let resp = await methodsHttp.putApi(
    `${props.ruta}/${props.valueId}`,
    formData
  );

  if (resp.ok) {
    emit("updateImg", resp);
    loading.value = false;
    notify.value?.showNotifyGood(resp.mensaje);
    dialog.value = false;
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
    dialog.value = false;
    loading.value = false;
  }
};

const props = defineProps({
  valueId: String,
  image: String,
  ruta: String,
});

// };
//   },
// };
</script>

<style scoped>
/* .iconHeight {
  height: 100%;
} */
/* .bordereFile {
  max-height: 150px;
  border-radius: 6px;
  padding: 8px;
} */

/* .file-select {
  position: relative;
  z-index: 9;
  border-radius: 6px;
  background-color: #06739b;
  width: 100%;
} */

/* .file-select:hover {
  background: #0f3d87;
} */

/* .drag {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 30px;
  height: 100px;
  border: red solid 1px;
} */

/* .close-drap {
  display: flex;
  width: 100%;
  height: 30px;
  position: absolute;
  justify-content: right;
  align-items: center;
  padding-right: 5px;
} */

/* .close {
  background: white;
  color: black;
  z-index: 99999999999;
  cursor: pointer;
  font-weight: 600;
}

.close:hover {
  background: rgb(241, 241, 241);
} */

/* .file-select input[type="file"] {
  opacity: 0;
  width: 100%;
  height: 130px;
  cursor: pointer;
  z-index: 99999;

  border: blue solid 1px;
} */

/* .formMarginInput {
  margin: 5px 0px;
} */
</style>
