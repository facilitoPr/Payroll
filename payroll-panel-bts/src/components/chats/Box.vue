<template>
  <div class="row conten-message">
    <div
      class="col-12 items-center justify-between q-px-md row bg-white"
      style="height: 7vh"
    >
      <div class="row items-center">
        <div class="col-auto text-center q-mr-sm" v-if="Object.keys(user) != 0">
          <img
            :src="
              user?.patient?.img
                ? user?.patient?.img
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

        <b>{{ user?.patient?.name }} </b>
      </div>

      <div class="row" v-if="Object.keys(user) != 0">
        <q-btn
          color="primary"
          flat
          label="Iniciar chat"
          icon="start"
          v-if="user?.IstakenByOperator == false"
          @click="confirmationInit"
        />
        <q-btn
          color="negative"
          flat
          label="Finalizar chat"
          icon="close"
          v-if="user?.IstakenByOperator == true && user?.user == auth.user._id"
          @click="confirmationExit"
        />
      </div>
    </div>

    <boxMessage
      class="col-12"
      :message="message"
      @searchMessage="searchMessage"
      @editMessage1="editMessage1"
      :loading="loading"
      v-if="Object.keys(user) != 0 && isChatInit == true"
    />

    <!-- esta es si ya otra operadora lo esta atendiendo -->
    <div
      v-else
      style="height: 83vh"
      class="col-12 q-px-xl row justify-center items-center"
    >
      <div
        v-if="user?.IstakenByOperator == true && user?.user != auth.user._id"
      >
        <div>
          <img
            src="../../assets/logo/customer.png"
            alt=""
            style="
              border-radius: 5px;
              width: 500px;
              height: 500px;
              text-align: center;
            "
          />
        </div>

        <div
          style="font-size: 20px; font-weight: 600"
          class="text-center text-primary"
        >
          Otra operadora lo esta atendiendo por el momento
        </div>
      </div>
    </div>

    <!-- texttarea -->

    <div class="col-12 row items-center" style="height: 10vh">
      <div
        class="col-1 text-center"
        v-if="Object.keys(user) != 0 && isChatInit == true"
      >
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

          <q-fab-action
            color="primary"
            external-label
            v-if="isChatInit == true"
          >
            <template v-slot:icon>
              <q-icon name="message" />
            </template>
            <template v-slot:label> SMS </template>
          </q-fab-action>

          <AddImg
            :patient="user?.patient?._id"
            @addMessage="addMessageModal"
            v-if="isChatInit == true"
          />
        </q-fab>
      </div>
      <div class="col-1" v-else></div>

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
          :disabled="isChatInit == false"
        >
        </textarea>
      </div>
      <div class="col-1" v-if="Object.keys(user) != 0 && isChatInit == true">
        <q-btn flat :disabled="isChatInit == false" v-if="!text">
          <Micro @sendTranscript="sendTranscript" @isListening="isListening" />
        </q-btn>

        <q-btn flat :disabled="isChatInit == false" v-else>
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

    <ModalChatInitAndExit ref="confirmation" @saveValue="chatInit" />
    <ModalChatInitAndExit ref="confirmation2" @saveValue="chatExit" />
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

import ModalChatInitAndExit from "./ModalChatInitAndExit.vue";
import ModalchatImg from "./ModalChatImg.vue";
import AddImg from "./AddImg.vue";
import boxMessage from "./BoxMessage.vue";
import Micro from "./Micro.vue";

import socket from "src/api/socketconecction";


import { authStore } from "src/stores/auth-store";
import { generarMongoId } from "app/utils";
import { Loading } from "quasar";

const auth = authStore();

const emit = defineEmits(["updateDateUser"]);

const listening = ref(false);
const modeEdit = ref(false);
const idMessage = ref(null);
const indexMessage = ref(null);

const confirmation = ref();
const confirmation2 = ref();
const modalImg = ref();
const limit = ref(50);
const initial = ref(0);
const loading = ref(true);

const props = defineProps({
  user: {
    type: Object,
    required: false,
  },
});

const message = ref([]);
const textarea = ref(null);
const text = ref(null);
const isChatInit = ref(false);

const isListening = (value) => {
  listening.value = value;
};

const ajustarAltura = async () => {
  const el = await textarea.value;
  el.style.height = await "40px"; // Restablece el alto
  el.style.height = (await el.scrollHeight) + "px"; // Ajusta al contenido
};

onMounted(() => {
  nextTick(() => {
    socketCatch();
    if (
      props.user?.IstakenByOperator == true &&
      props.user?.user == auth.user._id
    ) {
      isChatInit.value = true;
      if (isChatInit) {
        getMessagesByUser();
      }
    }
  });

  ajustarAltura(); // Ajustar tamaño inicial
});

const socketCatch = async () => {
  socket.on("connect", () => {
    console.log("Connected to server en box");
  });

  socket.on(`${props.user?.patient?._id}-panel`, (msg) => {
    message.value.push({
      _id: msg?._id,
      avatar: msg?.imgs[0],
      name: msg?.patient?.name,
      position: 1,
      message: msg.message,
      imgs: msg?.imgs,
    });
  });

  socket.on(`${props.user?.patient?._id}-deletePanel`, ({ id }) => {
    const index = message.value.findIndex((i) => {
      return i._id == id;
    });
    if (index !== -1) {
      message.value.splice(index, 1);
    }
  });

  socket.on(`${props.user?.patient?._id}-editedPanel`, (data) => {
    const index = message.value.findIndex((i) => {
      return i._id == data.id;
    });
    if (index !== -1) {
      message.value[index].message = data.message;
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`Desconectado del servidor por: ${reason}`);
  });
};

const enviarMensaje = async () => {
  if (!modeEdit.value) {
    if (text.value != null && text.value != "" && text.value.trim()) {
      const nuevoId = generarMongoId();
      message.value.push({
        name: auth.user.name,
        avatar:
          "https://wac-cdn.atlassian.com/dam/jcr:ba03a215-2f45-40f5-8540-b2015223c918/Max-R_Headshot%20(1).jpg?cdnVersion=2314",
        message: text.value,
        position: 2,
        isEdited: false,
        imgs: [],
        _id: nuevoId,
        user: auth.user,
      });

      await socket.emit("sendMessage", {
        patient: props.user?.patient?._id,
        user: auth.user._id,
        message: text.value,
        position: 2,
        imgs: [],
        patientCount: props.user?.patientCount,
        _id: nuevoId,
      });
      await emit("updateDateUser", { values: props.user, message: text.value });
      text.value = null; // Limpia el textarea después de enviar
      ajustarAltura();
      // Restablece el tamaño
    }
  } else {
    // alert(`modo edit ${idMessage.value}`, );
    if (text.value != null && text.value != "" && text.value.trim()) {
      message.value[indexMessage.value].message = text.value;
      message.value[indexMessage.value].isEdited = true;

      await socket.emit("editMessageByOperator", {
        ...message.value[indexMessage.value],
      });
      modeEdit.value = false;
      text.value = null;
      ajustarAltura();
    }
  }
};

const manejarTecla = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Evitar el salto de línea con Enter normal
    enviarMensaje(); // Enviar el mensaje
  }
};

const confirmationInit = () => {
  confirmation.value?.chatInit("ok");
};

const confirmationExit = () => {
  confirmation2.value?.chatInit("exit");
};

// const openModalChatImg = () => {
//   modalImg.value?.chatInit({
//     patient: props.user?.patient?._id,
//     user: auth.user._id,
//   });
// };

const addMessageModal = (data) => {
  message.value.push({
    name: auth.user.name,
    message: data.message,
    position: 2,
    imgs: data.imgs,
    user: auth.user,
  });
};

const chatInit = async () => {
  isChatInit.value = true;
  if (isChatInit) {
    getMessagesByUser();
  }

  // socket.emit("chatInit", {
  //   patient: props.user?.patient?._id,
  //   IstakenByOperator: true,
  //   count: 0,
  //   user: auth.user._id,
  // });
  let resp = await methodsHttp.postApi(`chat/chatInit`, {
    patient: props.user?.patient?._id,
    IstakenByOperator: true,
    count: 0,
    user: auth.user._id,
  });
  if (resp.ok) {
    // console.log(resp.chat);
    socket.emit("chatInit", { ...resp.chat });
  }
};

const searchMessage = async () => {
  initial.value = await message.value.length;
  const resp = await methodsHttp.getApi(
    `messages/getMessagesByPatientPanel/${props.user?.patient?._id}/${limit.value}/${initial.value}`
  );

  if (resp.ok) {
    message.value = [...resp.messages.reverse(), ...message.value];
  }
};

const chatExit = async () => {
  isChatInit.value = false;
  if (isChatInit) {
    message.value = [];
    initial.value = 0;
  }
  let resp = await methodsHttp.postApi(`chat/chatInit`, {
    patient: props.user?.patient?._id,
    IstakenByOperator: false,
    user: auth.user._id,
  });
  if (resp.ok) {
    // console.log(resp.chat);
    socket.emit("chatInit", { ...resp.chat });
  }
};

const confirmationOpenModal = async () => {
  confirmation.value?.showConfirmation("ok");
};

const getMessagesByUser = async () => {
  const resp = await methodsHttp.getApi(
    `messages/getMessagesByPatientPanel/${props.user?.patient?._id}/${limit.value}/${initial.value}`
  );
  if (resp.ok) {
    message.value = resp.messages.reverse();

    loading.value = false;
  }
};

const sendTranscript = (data) => {
  text.value = data.transcript.trim();
  listening.value = data.isListening;
  ajustarAltura();
};

const editMessage1 = async (item) => {
  modeEdit.value = true;
  text.value = item.item.message;
  idMessage.value = item.item._id;
  indexMessage.value = item.index;
  ajustarAltura();
};

const thumbStyle = ref({
  right: "4px",
  borderRadius: "5px",
  backgroundColor: "#f0f2f5",
  width: "5px",
  opacity: 0.75,
});

const barStyle = ref({
  right: "2px",
  borderRadius: "9px",
  backgroundColor: "#7a7b7c",
  width: "9px",
  opacity: 0.2,
});
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