<template>
  <div>
    <div v-if="auth.user.rol.code == 'MEDICO'">
      <div
        class="justify-center text-center q-mt-md q-mx-sm"
        style="cursor: pointer"
        v-for="(item, index) in auth.menudoctor"
        :key="index"
      >
        <div
          @click="selectedMenu(item, index)"
          :class="[index === indexSeleted ? 'borderB' : '']"
        >
          <q-icon
            size="2rem"
            name="group"
            color="white"
            style="cursor: pointer"
          />

          <div class="text-white">
            <b>{{ item.name }}</b>
          </div>
        </div>
      </div>
    </div>
    <div  v-if="auth.user.rol.code == 'MEDICOASOCIADO' || auth.user.rol.code == 'SECRETARIA'">
      <div
      class="justify-center text-center q-mt-md q-mx-sm"
      style="cursor: pointer"
      v-for="(item, index) in auth.menuAsociado"
      :key="index"
    >
      <div
        @click="selectedMenu(item, index)"
        :class="[index === indexSeleted ? 'borderB' : '']"
      >
        <q-icon
          size="2rem"
          name="group"
          color="white"
          style="cursor: pointer"
        />

        <div class="text-white">
          <b>{{ item.name }}</b>
        </div>
      </div>
    </div>
    </div>
   
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { authStore } from "src/stores/auth-store";
const auth = authStore();

const emit = defineEmits(["sendType"]);
const indexSeleted = ref(0);

const selectedMenu = (value, index) => {
  auth.addTypeMenu(value.type);
  indexSeleted.value = index;
  emit("sendType", value);
};

onMounted(async () => {
  if(auth.user.rol.code === "MEDICO"){
    auth.addTypeMenu("MEDICO_ASOCIADOS");
  }else{
    auth.addTypeMenu("ASOCIADO_MEDICOS");
  }
})
</script>

<style>
.borderB {
  border-bottom: 2px solid white;
}
</style>