<template>
  <div class="row" style="height: 100vh">
    <div class="col-1 col-xl-1 bg-primary">
      <SelectTypechat @sendType="sendType" />
    </div>

    <div class="col-3 col-xl-2">
      <div class="col-12 row justify-between q-pa-sm items-center">
        <div class="col-auto">
          <b class="text-primary" style="font-size: 20px">Chats</b>
        </div>
        <div class="col-auto">
          <q-icon
            size="1.5rem"
            name="low_priority"
            color="primary"
            style="cursor: pointer"
          />
        </div>
      </div>
      <div
        class="col-12 q-pa-sm q-py-md"
        style="height: 8vh"
        v-if="auth.typeChat !== 'ASOCIADO_MEDICOS'"
      >
        <SearchUser />
      </div>
      <!-- componetes users -->
      <div class="col-12 conten-user" style="">
        <div
          class="col-12 row select"
          v-for="(item, index) in sortedUsers"
          :id="index"
          :key="index"
          @click="seleted(item, index)"
          style="margin: 2px"
        >
          <div class="col-12" v-if="auth.typeChat === 'MEDICO_ASOCIADOS'">
            <UserAsociate
              :userAsociate="item?.userAssociate"
              :theLastMessage="item?.theLastMessage"
              :count="item?.count"
              :date="item?.created_at"
            />
          </div>
          <div class="col-12" v-if="auth.typeChat === 'MEDICO_MEDICOS'">
            <Medicos
              :doctor="
                item?.user._id == auth.user._id ? item?.doctor : item?.user
              "
              :theLastMessage="item?.theLastMessage"
              :count="item?.count"
              :date="item?.created_at"
            />
          </div>
          <div
            class="col-12"
            v-if="
              auth.typeChat === 'MEDICO_PACIENTES' ||
              auth.typeChat === 'ASOCIADO_PACIENTES'
            "
          >
            <Patiens
              :patiens="item?.patient"
              :theLastMessage="item?.theLastMessage"
              :count="item?.count"
              :date="item?.created_at"
            />
          </div>
          <div class="col-12" v-if="auth.typeChat === 'ASOCIADO_MEDICOS'">
            <MyDoctor
              :myDoctor="item?.user"
              :theLastMessage="item?.theLastMessage"
              :count="item?.count"
              :date="item?.created_at"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- box -->
    <div class="col-8 col-xl-9">
      <div v-if="Object.keys(userSelected) != 0">
        <Box :chat="userSelected" :name="name" :img="img" v-if="loadingBox" />
      </div>
      <div v-else class="justify-center row items-center" style="height: 100vh">
        <div class="conten col-12 justify-center items-center row">
          <div class="col-12 text-center">
            <img
              src="../../../assets/logo/no-chat.png"
              alt=""
              style="
                border-radius: 5px;
                width: 600px;
                height: 600px;
                text-align: center;
              "
            />
          </div>
          <div
            style="font-size: 20px; font-weight: 600"
            class="col-12 text-center text-primary"
          >
            Seleciona un chat para comenzar
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from "vue";
import methodsHttp from "src/api/methodsHttp";
import SearchUser from "../SearchUser.vue";
import UserAsociate from "./UserAsociate.vue";
import Medicos from "./Medicos.vue";
import Patiens from "./Patiens.vue";
import MyDoctor from "./MyDoctor.vue";
import Box from "./Box.vue";
import SelectTypechat from "./SelectTypechat.vue";
import { authStore } from "src/stores/auth-store";

const auth = authStore();
// const typeChat = ref(
//   auth.user.rol.code == "MEDICO" ? "MEDICO_ASOCIADOS" : "ASOCIADO_MEDICOS"
// );

const userSelected = ref({});
const loadingBox = ref(true);
const beforeId = ref(null);
const name = ref("");
const img = ref("");

const user = ref([]);

const sendType = async (value) => {
  user.value = [];
  name.value = "";
  img.value = "";

  loadingBox.value = false;
  beforeId.value = null;
  userSelected.value = {};
  getChat();
};

onMounted(async () => {
  getChat();
});

const sortedUsers = computed(() => {
  return user.value.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
});

const getChat = async () => {
  if (auth.typeChat === "MEDICO_ASOCIADOS") {
    const resp = await methodsHttp.getApi(
      `chat/getChatDoctorToUserAssociate/${auth.user._id}`
    );
    user.value = resp.chat;
  }
  if (auth.typeChat === "MEDICO_MEDICOS") {
    const resp = await methodsHttp.getApi(
      `chat/getChatDoctorToDoctor/${auth.user._id}`
    );
    user.value = resp.chat;
  }
  if (
    auth.typeChat === "MEDICO_PACIENTES" ||
    auth.typeChat === "ASOCIADO_PACIENTES"
  ) {
    const resp = await methodsHttp.getApi(
      `chat/getChatDoctorToPatient/${
        auth.typeChat === "MEDICO_PACIENTES"
          ? auth.user._id
          : auth.userAssociate
      }`
    );
    user.value = resp.chat;
  }
  if (auth.typeChat === "ASOCIADO_MEDICOS") {
    const resp = await methodsHttp.getApi(
      `chat/getChatsUserAssociateMyDoctor/${auth.user._id}`
    );
    user.value = resp.chat;
  }
};

const seleted = (item, index) => {
  console.log(item, 'chat')
  loadingBox.value = false;
  setTimeout(() => {
    loadingBox.value = true;
  }, 10);

  userSelected.value = item;
  if (beforeId.value == null) {
    beforeId.value = index;
  } else {
    let seleted = document.getElementById(beforeId.value);
    seleted.classList.remove("selected");
  }
  beforeId.value = index;
  let seleted = document.getElementById(index);
  seleted.classList.add("selected");

  if (auth.typeChat != "") {
    if (auth.typeChat === "MEDICO_ASOCIADOS") {
      name.value = item?.userAssociate?.name;
      img.value = item?.userAssociate?.img;
    }
    if (auth.typeChat === "MEDICO_MEDICOS") {
      name.value =
        item?.user._id === auth.user._id ? item?.doctor.name : item?.user.name;
      img.value =
        item?.user._id === auth.user._id ? item?.doctor.img : item?.user.img;
    }

    if (
      auth.typeChat === "MEDICO_PACIENTES" ||
      auth.typeChat === "ASOCIADO_PACIENTES"
    ) {
      console.log(item);
      name.value = item?.patient?.name;
      img.value = item?.patient?.img;
    }

    if (auth.typeChat === "ASOCIADO_MEDICOS") {
      name.value = item?.user?.name;
      img.value = item?.user?.img;
    }
  }
};
</script>

<style scoped>
.select {
  background: #f8f8fb;
  border-radius: 5px;
}

.select:hover {
  background: #f0f2f5;
  cursor: pointer;
  border-radius: 5px;
}

.selected {
  background: #e6e9ef;
  border-radius: 5px;
}
.bb {
  /* border:#F0F2F5 solid 1px */
  border-top: #f0f2f5 solid 1px;
}

.conten {
  background-image: linear-gradient(
      to bottom right,
      rgba(192, 228, 213, 0.7),
      rgba(127, 161, 233, 0.8)
    ),
    url("https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg");
  /* background-size: cover; */
  /* background-position: center; */
  border-radius: 10px;
  /* margin: 4px; */
  height: 100vh;
}
</style>