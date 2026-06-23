<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle2 text-grey-7 q-mb-sm">Capturas</div>
      <div class="row q-col-gutter-sm">
        <div class="col-auto" v-for="(src, i) in images" :key="i">
          <q-img
            class="cursor-pointer"
            :src="src"
            spinner-color="primary"
            style="width: 120px; height: 80px"
            @click="$emit('preview', src)"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  images: { type: Array, default: () => [] },
});
defineEmits(["preview"]);
</script>
