<template>
  <div>
    <q-dialog v-model="alert">
      <q-card style="width: 600px; max-width: 90vw">
        <div class="q-ma-sm">
          <div class="bordereFile">
            <div class="file-select" @click="abrirFileInput">
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

              <input type="file" @input="getFile" multiple ref="fileInput" />
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
      </q-card>
    </q-dialog>
  </div>
</template>
    
    <script>
import { nextTick, onMounted, ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
export default {
  setup(props, { emit }) {
    const alert = ref(false);
    const images = ref([]);
    const images2 = ref([]);
    const textarea = ref(null);
    const text = ref(null);
    const patient = ref(null);
    const user = ref(null);
    const fileInput = ref(null);

    const init = () => {
      alert.value = false;
    };

    const chatInit = async (item) => {
      alert.value = await true;
      patient.value = item.patient;
      user.value = item.user;
      ajustarAltura();

      await abrirFileInput();
    };

    const getFile = (event) => {
      const files = event.target.files;
      images2.value = files;
      images.value = [];
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = (e) => {
          images.value.push(e.target.result); // Almacena la URL de la imagen
        };
        reader.readAsDataURL(file); // Lee el archivo como una URL de datos
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

    const abrirFileInput = async () => {
      await nextTick();
      if (fileInput.value) {
        fileInput.value.click(); // Ejecuta el clic solo si fileInput tiene valor
      }
    };

    const enviarMensaje = async () => {
      if (text.value != null || images2.value.length != 0) {
        const formData = new FormData();
        // Añadir el texto si existe
        if (text.value) {
          formData.append("message", text.value.trim());
        }

        formData.append("patient", patient.value);
        formData.append("user", user.value);

        for (const file of images2.value) {
          formData.append("images", file); // Agrega cada archivo al formData
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
        }
      } else {
        console.log("nada");
      }
    };

    return {
      chatInit,
      alert,
      init,
      getFile,
      images,
      textarea,
      ajustarAltura,
      text,
      manejarTecla,
      enviarMensaje,
      images2,
      patient,
      abrirFileInput,
      fileInput,
    };
  },
  emits: ["addMessage"],
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
</style>
    