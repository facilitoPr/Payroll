<template>
  <div>
    <q-fab-action color="primary" external-label @click="openModal" >
      <template v-slot:icon>
        <q-icon name="image" />
      </template>
      <template v-slot:label> FOTOS </template>
    </q-fab-action>

    <q-dialog v-model="alert">
      <q-card style="width: 600px; max-width: 90vw">
        <div class="q-ma-sm">
          <div class="bordereFile">
            <div class="file-select">
              <div class="drag">
                <div>
                  <div style="text-align: center">
                    <q-icon size="2.6em" name="description" color="white" />
                  </div>
                  <div style="text-align: center">
                    <b style="font-size: 17px; color: white">Add File</b>
                  </div>
                  <p style="color: white">or drag and drop</p>
                </div>
              </div>

              <input
                type="file"
                @input="getFile"
                multiple
                ref="fileInput"
                accept=".jpg, .jpeg, .png, .gif"
              />
            </div>
          </div>
        </div>

        <div class="q-mx-lg q-my-sm">
          <div
            v-for="(image, index) in images"
            :key="index"
            class="bordere image-container borderes"
            @click="eliminarImagen(index)"
            @mouseover="hoverIndex = index"
            @mouseleave="hoverIndex = null"
            style="
              height: 100px;
              width: 100px;
              border: dashed 1px black;
              cursor: pointer;
              display: inline-flex;
              justify-content: center;
              align-items: center;
              margin: 2px;
              position: relative;
            "
          >
            <img :src="image" style="height: 90px; width: 90px" />
            <div v-if="hoverIndex === index" class="overlay">
              <p class="text-negative">Eliminar</p>
            </div>
          </div>
        </div>

        <div class="q-mx-sm row justify-center">
          <div class="col-10">
            <textarea
              v-model="text"
              ref="textarea"
              @input="ajustarAltura"
              placeholder="Escribe tu mensaje..."
              class="auto-ajustable"
              @keydown="manejarTecla"
            >
            </textarea>
          </div>

          <div class="col-1">
            <q-btn flat :disabled="images.length == 0">
              <q-icon
                name="send"
                color="primary"
                size="35px"
                @click="enviarMensaje"
                style="cursor: pointer"
              />
            </q-btn>
          </div>
        </div>

        <q-inner-loading
          :showing="loading"
          label="Please wait..."
          label-class="text-blue-11"
          label-style="font-size: 1.5em"
          style="z-index: 9999"
          color="primary"
        ></q-inner-loading>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, defineProps, defineEmits } from "vue";
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";

const auth = authStore();

const props = defineProps({
  patient: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["addMessage"]);

const alert = ref(false);
const fileInput = ref(null);
const images = ref([]);
const images2 = ref([]);
const textarea = ref(null);
const text = ref(null);

const hoverIndex = ref(null);
const loading = ref(false);

const openModal = async () => {
  alert.value = await true;
  await abrirFileInput();
  await ajustarAltura();
};

const abrirFileInput = async () => {
  await nextTick();
  if (fileInput.value) {
    fileInput.value.click(); // Ejecuta el clic solo si fileInput tiene valor
  }
};

const ajustarAltura = async () => {
  await nextTick();
  const el = await textarea.value;
  el.style.height = await "40px"; // Restablece el alto
  el.style.height = (await el.scrollHeight) + "px"; // Ajusta al contenido
};

const manejarTecla = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Evitar el salto de línea con Enter normal
    enviarMensaje(); // Enviar el mensaje
  }
};

const getFile = (event) => {
  const files = Array.from(event.target.files);
  images2.value = files;
  //   console.log(Array.from(event.target.files), "Array.from(event.target.files);")
  images.value = [];
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = (e) => {
      images.value.push(e.target.result); // Almacena la URL de la imagen
    };
    reader.readAsDataURL(file); // Lee el archivo como una URL de datos
  }
};

const enviarMensaje = async () => {
  if (text.value != null || images2.value.length != 0) {
    loading.value = true;
    const formData = new FormData();
    // Añadir el texto si existe
    if (text.value) {
      formData.append("message", text.value.trim());
    }

    formData.append("patient", props.patient);
    formData.append("user", auth.user._id);

    for (const file of images2.value) {
      formData.append("images", file);
      //   console.log(file);
    }

    const resp = await methodsHttp.postApi(
      `messages/createMessagePanelWithImage`,
      formData
    );

    if (resp.ok) {
      alert.value = false;
      text.value = "";
      images.value = [];
      await emit("addMessage", resp.createMessage);
      loading.value = false;
    }
  } else {
    console.log("nada");
  }
};

const eliminarImagen = (index) => {
  images.value.splice(index, 1);
  images2.value.splice(index, 1);
  if (images2.value.length == 0) {
    alert.value = false;
  }
};
</script>

<style scoped>
textarea.auto-ajustable {
  width: 100%;
  height: 20px; /* Forzar el alto inicial */
  line-height: 16px; /* Ajustar el line-height para hacer el alto más consistente */
  max-height: 73px; /* Limita el tamaño máximo */
  overflow-y: auto; /* Oculta la barra de desplazamiento vertical */
  resize: none; /* Evita el ajuste manual del tamaño */
  border-radius: 15px;
  border: none;
  background: #f3f4f8;
  padding: 10px;
}

textarea:focus {
  outline: none;
}

.image-container {
  position: relative;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6); /* Fondo oscuro con opacidad */
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.image-container:hover .overlay {
  opacity: 1;
}
</style>
