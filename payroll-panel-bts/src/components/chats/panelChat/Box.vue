<template>
  <div class="row conten-message">
    <div
      class="col-12 items-center justify-between q-px-md row bg-white"
      style="height: 7vh"
    >
      <div class="row items-center">
        <div class="col-auto text-center q-mr-sm" v-if="Object.keys(chat) != 0">
          <img
            :src="
              img
                ? img
                : 'https://img.freepik.com/premium-vector/user-icon-man-business-suit_454641-453.jpg'
            "
            alt=""
            style="
              border-radius: 50px;
              width: 40px;
              height: 40px;
              text-align: center;
            "
          />
        </div>
        <b>{{ name }} </b>
      </div>
      <!-- botonones de chat -->
      <div
        class="row"
        v-if="
          auth.typeChat == 'MEDICO_PACIENTES' ||
          auth.typeChat === 'ASOCIADO_PACIENTES'
        "
      >
        <q-btn color="primary" flat label="Iniciar chat" icon="start" />
        <q-btn color="negative" flat label="Finalizar chat" icon="close" />
      </div>
    </div>
    <boxMessage class="col-12" :loading="loading" :message="message" />

    <div class="col-12 row items-center" style="height: 10vh">
      <div class="col-1 text-center">
        <q-fab color="primary" direction="up" padding="xs">
          <template v-slot:icon="{ opened }">
            <q-icon
              :class="{ 'example-fab-animate--hover': opened !== true }"
              name="add"
            />
          </template>

          <template v-slot:active-icon="{ opened }">
            <q-icon
              :class="{ 'example-fab-animate': opened === true }"
              name="close"
            />
          </template>

          <q-fab-action color="primary" external-label>
            <template v-slot:icon>
              <q-icon name="message" />
            </template>
            <template v-slot:label> SMS </template>
          </q-fab-action>

          <AddImg
            :patient="'341423424545sfwfsdf'"
            @addMessage="addMessageModal"
          />
        </q-fab>
      </div>

      <div class="col-10 row justify-end position-container">
        <div v-if="listening" class="spinner-container">
          <q-spinner-bars color="primary" size="20px" />
          <q-tooltip :offset="[0, 8]">Escuchando....</q-tooltip>
        </div>
        <small class="col-12 text-negative" v-if="modeEdit">
          Editar este mensaje</small
        >
        <textarea
          v-model="text"
          ref="textarea"
          @input="ajustarAltura"
          placeholder="Escribe tu mensaje..."
          class="auto-ajustable q-pb-sm"
          @keydown="manejarTecla"
        >
        </textarea>
      </div>
      <div class="col-1">
        <q-btn flat v-if="!text">
          <Micro @sendTranscript="sendTranscript" @isListening="isListening" />
        </q-btn>

        <q-btn flat v-else>
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
  </div>
</template>
<script setup>
import {
  onMounted,
  ref,
  defineProps,
  onBeforeMount,
  nextTick,
  defineEmits,
} from "vue";
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";
import { generarMongoId } from "app/utils";
import socket from "src/api/socketconecction";

const auth = authStore();

import boxMessage from "./BoxMessage.vue";
import AddImg from "../AddImg.vue";
import Micro from "../Micro.vue";

const message = ref([]);
const loading = ref(false);
const listening = ref(false);
const modeEdit = ref(false);
const text = ref(null);
const textarea = ref(null);
const limit = ref(50);
const initial = ref(0);

const props = defineProps({
  chat: {
    type: Object,
    required: false,
  },
  img: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
});

onMounted(() => {
  nextTick(() => {
    socketCatch();
    getMessagesByChat();
  });
  ajustarAltura(); // Ajustar tamaño inicial
});

const socketCatch = async () => {
  socket.on(`${auth.user._id}-getMessageFromPanel`, (msg) => {
    console.log(msg.createMessage);
    message.value.push({
      ...msg.createMessage,
    });
  });
};

const ajustarAltura = async () => {
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

const addMessageModal = (data) => {
  message.value.push({
    //     name: auth.user.name,
    // message: data.message,
    //     position: 2,
    //     imgs: data.imgs,
    //     user: auth.user,
  });
};
const enviarMensaje = async () => {
  if (!modeEdit.value) {
    console.log(props.chat, "chat");
    if (text.value != null && text.value != "" && text.value.trim()) {
      const nuevoId = generarMongoId();
      let nuwValue_id = null;
      message.value.push({
        name: auth.user.name,
        avatar:
          "https://wac-cdn.atlassian.com/dam/jcr:ba03a215-2f45-40f5-8540-b2015223c918/Max-R_Headshot%20(1).jpg?cdnVersion=2314",
        message: text.value,
        isEdited: false,
        imgs: [],
        _id: nuevoId,
        user: auth.user,
        position: 2,
        chat: props.chat._id,
      });

      if (auth.typeChat === "MEDICO_ASOCIADOS") {
        nuwValue_id = props.chat?.userAssociate._id;
      }
      if (auth.typeChat === "ASOCIADO_MEDICOS") {
        nuwValue_id = props.chat?.user._id;
      }

      if (auth.typeChat === "MEDICO_MEDICOS") {
        nuwValue_id =
          props.chat?.user._id === auth.user._id
            ? props.chat.doctor._id
            : props.chat?.user._id;
      }

      await socket.emit("sendMessagesFromPanel", {
        user: auth.user._id,
        message: text.value,
        position: 2,
        imgs: [],
        patientCount: props.chat?.patientCount,
        _id: nuevoId,
        chat: props.chat._id,
        nuwValue_id: nuwValue_id,
      });

      text.value = null;
      ajustarAltura();
    }
  }
};

const sendTranscript = (data) => {
  text.value = data.transcript.trim();
  listening.value = data.isListening;
  ajustarAltura();
};

const isListening = (value) => {
  listening.value = value;
};

const getMessagesByChat = async () => {
  console.log("entro aqui");
  const resp = await methodsHttp.getApi(
    `messages/getMessagesByChat/${props.chat?._id}/${limit.value}/${initial.value}`
  );
  if (resp.ok) {
    message.value = resp.messages.reverse();
    // console.log(message.value, "message.value");
    loading.value = false;
  }
};
</script>
<style scoped>
textarea.auto-ajustable {
  width: 100%;
  height: 20px;
  /* Forzar el alto inicial */
  line-height: 16px;
  /* Ajustar el line-height para hacer el alto más consistente */
  max-height: 73px;
  /* Limita el tamaño máximo */
  overflow-y: auto;
  /* Oculta la barra de desplazamiento vertical */
  resize: none;
  /* Evita el ajuste manual del tamaño */
  border-radius: 15px;
  border: none;
  background: #f3f4f8;
  padding: 10px;
}

textarea:focus {
  outline: none;
}

.conten-message {
  background-image: linear-gradient(
      to bottom right,
      rgba(192, 228, 213, 0.7),
      rgba(127, 161, 233, 0.8)
    ),
    url("https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg");
  /* background-size: cover; */
  background-position: center;
  border-radius: 10px;
  /* margin: 4px; */
  height: 100vh;
}

.position-container {
  position: relative;
}

.spinner-container {
  position: absolute;
  top: 50%;
  /* Centra verticalmente */
  right: 10px;
  /* Ajusta esta distancia según tus necesidades */
  transform: translateY(-50%);
}

/* #209DBC */
</style>

