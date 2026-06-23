<!-- ActionsButtons.vue -->
<template>
  <q-icon name="menu" color="primary" size="25px" style="cursor: pointer">
    <q-menu transition-show="flip-right" transition-hide="flip-left">
      <q-list
        v-for="(item, index) in menuItems"
        :key="index"
        style="min-width: 100px"
        @click="item.action(data)"
      >
        <q-item clickable class="row items-center" v-if="isVisivble">
          <div class="col-auto">
            <q-icon :name="item.icon" :color="item.color" size="25px" />
          </div>
          <div class="q-px-sm col-auto">{{ item.text }}</div>
        </q-item>
      </q-list>
    </q-menu>
  </q-icon>
</template>

<script setup>
import { defineProps } from "vue";

const props = defineProps({
  menuItems: {
    type: Array,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  isVisivble: {
    type: Boolean,
    default: true,
  },
});
</script>
