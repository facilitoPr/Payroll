<template>
  <div
    ref="messageContainer"
    class="message-container row q-px-xl items-center"
    @scroll="handleScroll"
  >
    <div
      class="col-12 q-mt-md"
      v-for="(item, index) in message"
      :key="index"
      @mouseover="hoverIndex = index"
      @mouseleave="hoverIndex = null"
    >
      <div class="row" v-if="auth.user._id !== item.user._id">
        <div class="col-9 row" v-if="!loading">
          <div class="row col-12 justify-start items-center">
            <div class="col-auto">
              <small><b style="color: transparent">.</b></small>
            </div>
            <div class="col-auto">
              <MenuOptionChat
                v-if="hoverIndex === index"
                :index="index"
                :item="item"
                @deleteMessage="deleteMessage"
                @editMessage="editMessage"
              />
            </div>
          </div>
          <div class="col-auto">
            <div class="left q-px-sm q-py-sm">
              <div v-if="item.imgs.length != 0">
                <div v-for="(item2, index) in item.imgs.reverse()" :key="index">
                  <img
                    :src="
                      item2
                        ? item2
                        : 'https://img.freepik.com/premium-vector/user-icon-man-business-suit_454641-453.jpg'
                    "
                    alt=""
                    style="
                      width: 250px;
                      /* height: 20%; */
                      border-radius: 10px;
                      cursor: pointer;
                    "
                  />
                </div>
              </div>
              <div v-if="item.message">
                <b>{{ item.message }}</b>
              </div>
              <small v-if="item.isEdited" style="font-size: 9px; color: gray"
                >editado</small
              >
            </div>
            <div class="">
              <small style="color: #9197a7">{{
                formatDateTime(item.created_at)
              }}</small>
            </div>
          </div>
        </div>
        <q-skeleton class="col-3" :type="QToolbar" v-else />
      </div>
      <div class="row justify-end" v-if="auth.user._id === item.user._id">
        <div class="col-9 justify-end row" v-if="!loading">
          <div class="row col-12 justify-end items-center">
            <div class="col-auto q-mx-sm">
              <MenuOptionChat
                v-if="hoverIndex === index"
                :index="index"
                :item="item"
                @deleteMessage="deleteMessage"
                @editMessage="editMessage"
              />
            </div>
            <div class="col-auto text-right">
              <small
                ><b>{{ item.user?.name }}
                    <!-- {{ item }} -->
                </b></small
              >
            </div>
          </div>

          <div class="col-auto">
            <div class="right q-px-sm q-py-sm bg-primary text-white">
              <div v-if="item.imgs.length != 0">
                <div v-for="(item2, index) in item.imgs" :key="index">
                  <img
                    :src="
                      item2
                        ? item2
                        : 'https://img.freepik.com/premium-vector/user-icon-man-business-suit_454641-453.jpg'
                    "
                    alt=""
                    style="
                      width: 250px;
                      /* height: 250px; */
                      border-radius: 10px;
                      cursor: pointer;
                    "
                  />
                </div>
              </div>

              <div v-if="item.message">
                <b>{{ item.message }}</b>
              </div>
              <small v-if="item.isEdited" style="font-size: 9px; color: white"
                >editado</small
              >
            </div>
            <div class="text-right">
              <small style="color: #9197a7">{{
                formatDateTime(item.created_at)
              }}</small>
            </div>
          </div>
        </div>
        <q-skeleton class="col-3" :type="QToolbar" v-else />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, defineProps, defineEmits } from "vue";
import MenuOptionChat from "../MenuOptionChat.vue";
import { formatDateTime } from "app/utils";
import { authStore } from "src/stores/auth-store";
const auth = authStore();
const props = defineProps({
  message: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["searchMessage", "editMessage1"]);
const hoverIndex = ref(null);

const messageContainer = ref(null);
const isFetching = ref(false); // Control para evitar múltiples llamadas
const isFirstLoad = ref(true); // Detecta si es la primera carga

// Función para cargar mensajes adicionales
const loadMoreMessages = async () => {
  if (isFetching.value) return;
  isFetching.value = true;
  await emit("searchMessage");
  isFetching.value = false;
};

// Función para desplazar al final solo en la primera carga
async function scrollToBottom() {
  await nextTick(); // Espera a que Vue renderice el DOM
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
}

watch(
  () => props.message,
  async (newMessages, oldMessages) => {
    const container = messageContainer.value;

    if (!container) return;

    if (isFirstLoad.value) {
      // En la primera carga, baja el scroll al final
      await scrollToBottom();
      isFirstLoad.value = false;
    } else {
      // Mantén la posición del scroll cuando se añaden mensajes
      const previousHeight = container.scrollHeight;
      await nextTick();
      const newHeight = container.scrollHeight;
      container.scrollTop += newHeight - previousHeight;
    }
  },
  { immediate: true } // Ejecuta el watch inmediatamente al montar
);

function handleScroll() {
  const container = messageContainer.value;
  if (container && container.scrollTop === 0) {
    // Llama a la función para cargar más mensajes solo al llegar al tope del contenedor
    loadMoreMessages();
  }
}

// Cuando el componente se monta, desplaza al final si hay mensajes
onMounted(async () => {
  nextTick(() => {
    // socket.on("connect", () => {
    //   console.log("Connected to server en box message");
    // });

    scrollToBottom();

    // socket.on("disconnect", (reason) => {
    //   console.log(`Desconectado del servidor por: ${reason}`);
    // });
  });
});

// Eliminar mensajes
const deleteMessage = async (index) => {
  //   await socket.emit("deleteMessageByOperator", {
  //     ...props.message[index],
  //   });
  //   props.message.splice(index, 1);
};

const editMessage = async (item) => {
  //   await emit("editMessage1", item);
};
</script>


<style scoped>
.message-container {
  height: 83vh;
  overflow-y: scroll;
  /* border: red solid 1px; */
  display: flex;
  /* justify-content: center; */
  align-content: flex-start;
  /* align-items: center; */
}

/* Personalización del scrollbar */
.message-container::-webkit-scrollbar {
  width: 4px;
  /* Cambia el grosor de la barra */
}

.message-container::-webkit-scrollbar-track {
  background: transparent;
  /* Fondo transparente para el track */
}

.message-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.4);
  /* Color de la barra con transparencia */
  border-radius: 10px;
  /* Bordes redondeados para la barra */
}

.message-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.6);
  /* Cambio de color al pasar el cursor */
}

.left {
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  border-bottom-right-radius: 15px;
  background: #f0f0f0;
  margin-top: 3px;
}

.right {
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  border-bottom-left-radius: 15px;
  background: #f1ecfd;
  margin-top: 3px;
}
</style>