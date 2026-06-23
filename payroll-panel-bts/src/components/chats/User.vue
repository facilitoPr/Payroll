<template>
  <div class="row items-center col-12 q-pa-sm">
    <div class="col-2 text-center">
      <img
        :src="
          user?.img
            ? user?.img
            : 'https://img.freepik.com/premium-vector/user-icon-man-business-suit_454641-453.jpg'
        "
        alt=""
        style="
          border-radius: 50px;
          width: 45px;
          height: 45px;
          text-align: center;
        "
      />
    </div>
    <div class="col-10 row" style="padding-left: 5px">
      <div class="col-8 row text-dark">
        <div class="col-12">
          <b>{{ user?.name }}</b>
          <div
            style="
              color: gray;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            "
          >
            {{ theLastMessage }}
          </div>
        </div>
      </div>
      <div class="col-4 row text-dark">
        <div class="text-right col-12" style="font-size: 0.6rem">
          {{ formatDateTime(date) }}
        </div>
        <div class="text-right col-12 row justify-end">
          <!-- <div v-if="auth.user._id === operator">
            green
          </div> -->
          <div class="col-12" v-if="IstakenByOperator">
            <q-badge rounded color="green"
              ><q-tooltip class="bg-green text-white">
                <div v-if="auth.user._id !== operator">
                  En comunicacion con otra operadora
                </div>
                <div v-else>En comunicacion contigo</div>
              </q-tooltip>
            </q-badge>
          </div>
          <div class="col-12" v-else>
            <q-badge rounded color="orange"
              ><q-tooltip class="bg-orange text-white">
                Disponible para comunicarte
              </q-tooltip>
            </q-badge>
          </div>

          <div class="col-12 justify-end row" v-if="count > 0">
            <q-badge color="green">
              {{ count }}
            </q-badge>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
  <script setup>
import { defineProps, defineEmits, ref, watch, onMounted, nextTick } from "vue";
import { authStore } from "src/stores/auth-store";
import { formatDateTime } from "app/utils";
import socket from "src/api/socketconecction";


const auth = authStore();

// const theLastMessage = ref(props.theLastMessage);
// const count = ref(props.count);
// const IstakenByOperator = ref(props.IstakenByOperator);
// const operator = ref(props.operator);
// const date = ref(props.date);

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },

  theLastMessage: {
    type: String,
    required: true,
  },

  count: {
    type: Number,
    required: true,
  },
  IstakenByOperator: {
    type: Boolean,
    required: true,
  },
  operator: {
    type: String,
    default:undefined,
    required: false,
  },
  date: {
    type: String,
    required: true,
  },
});

onMounted(() => {
  // socket.on(`${props.user._id}-updateUser`, (msg) => {
  //   console.log(msg.patient._id === props.user._id)
  //   if (msg.patient._id === props.user._id) {
  //     count.value = msg.count;
  //     theLastMessage.value = msg.theLastMessage;
  //     IstakenByOperator.value = msg.IstakenByOperator;
  //     date.value = msg.created_at
  //   }
  // });
});

// watch(
//   () => props.theLastMessage,
//   async () => {
//     // console.log('kkkkkkkkkkkkkk')
//     theLastMessage.value = props.theLastMessage
//     count.value = 0
//   }
// );
</script>

<style scoped>
.select {
  background: red;
}
</style>
  