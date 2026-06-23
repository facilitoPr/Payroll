<template>
  <div class="bg-white q-pa-sm" @click="send">chat</div>
</template>

<script setup>

import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import "moment/locale/es";
moment.locale("es");
import { ref, onMounted, watch } from "vue";

import { io } from "socket.io-client";
const socket = io("http://104.131.185.226/", {
  transports: ["websocket"], // Forzar WebSockets
  upgrade: false, // Evitar que haga polling
});

onMounted(() => {
  socket.on("connect", () => {
    console.log("Connected to server new");
  });
});

const send = async () => {
  console.log("aqui");
  socket.emit("chat message", { name: "osiris" });

  socket.on("chat message", (msg) => {
    console.log(msg);
  });
};

// console.log(socket);

// socket.emit('chat message', 'Hola, ¿cómo estás?');
</script>