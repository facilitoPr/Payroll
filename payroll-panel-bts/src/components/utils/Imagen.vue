<template>
  <div>
    <!-- <q-avatar square size="60px" > -->
    <q-img
      spinner-color="white"
      :src="img"
      :width="w ? w : one"
      :height="h ? h : two"
      @click="dialog = true"
      :class="[b ? 'b' : 'c']"
      style="cursor: pointer;"
    />
    <!-- </q-avatar> -->
    <q-dialog
      v-model="dialog"
      persistent
      :maximized="maximizedToggle"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="bg-transparent text-white">
        <q-bar>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="q-pt-none" @click="dialog = false">
          <div class="row items-center justify-center" style="height: 95vh">
            <div class="col-auto">
              <img :src="img" @click="dialog = true" class="mm" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
export default {
  data() {
    return {
      maximizedToggle: true,
      dialog: false,
      one: 50,
      two: 80,
    };
  },
  props: {
    img: {
      type: String,
    },
    w: {
      type: String,
      default:'50px'
    },
    h: {
      type: String,
       default:'50px'
    },
    b: {
      type: Boolean,
    },
  },
};
</script>
<style scoped>
.b {
  border-radius: 50px;
}
.mm {
  max-width: 500px;
  max-height: 500px;
}
</style>

