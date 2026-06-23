<template>
    <div class="row items-center col-12 q-pa-sm">
      <div class="col-2 text-center">
        <img
          :src="
            doctor?.img
              ? doctor?.img
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
            <b>{{ doctor?.name }}</b>
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
            <!-- <div class="col-12" v-if="IstakenByOperator">
              <q-badge rounded color="green"
                ><q-tooltip class="bg-green text-white">
                  <div v-if="auth.user._id !== operator">
                    En comunicacion con otra operadora
                  </div>
                  <div v-else>En comunicacion contigo</div>
                </q-tooltip>
              </q-badge>
            </div> -->
            <!-- <div class="col-12" v-else>
              <q-badge rounded color="orange"
                ><q-tooltip class="bg-orange text-white">
                  Disponible para comunicarte
                </q-tooltip>
              </q-badge>
            </div> -->
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
  import { formatDateTime } from "app/utils";
  import { authStore } from "src/stores/auth-store";
  
  const props = defineProps({
    doctor: {
      type: Object,
      required: false,
      default: {},
    },
  
    theLastMessage: {
      type: String,
      required: true,
       default:''
    },
  
    count: {
      type: Number,
      required: true,
    },
  
    date: {
      type: String,
      required: true,
    },
  });
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
  </style>