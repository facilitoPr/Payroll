<template>
  <div>
    
    <q-select
      outlined
      dense
      v-model="patientsSeleted"
      use-input
      hide-selected
      fill-input
      input-debounce="0"
      :options="options"
      option-label="name"
      @filter="filterFn"
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey"> No results </q-item-section>
        </q-item>
      </template>
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section avatar>
            <q-avatar>
              <q-img
                :src="
                  scope.opt.img
                    ? scope.opt.img
                    : 'https://baches.co.uk/wp-content/uploads/young-user-icon.jpg'
                "
                alt=""
              />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label
              ><b>{{ scope.opt.name }}</b>
            </q-item-label>
            <q-item-label>
              <b>{{ scope.opt.phone }}</b></q-item-label
            >
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>
    
    <script setup>
import { ref, watch, defineProps } from "vue";
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";

const auth = authStore();

const stringOptions = [];

const options = ref(stringOptions);
const patientsSeleted = ref(null);

const props = defineProps({
  // typeChat: {
  //   type: String,
  //   required: true,
  //   default: "ASOCIADOS",
  // },
});

const filterFn = (val, update, abort) => {
  update(async () => {
    if (val != null && val != "" && val.trim()) {

      console.log(props.typeChat, "props")
      const resp = await methodsHttp.getApi(
        `patients/searchPatientsChat/${val.trim()}`
      );

      options.value = resp.patients;
    }
  });
};

watch(patientsSeleted, async (value) => {
  if (value != null) {
    const resp = await methodsHttp.postApi(`chat/addchat`, {
      patient: value._id,
      theLastMessage: "",
      count: 0,
      user: auth.user._id,
    });
    if (resp.ok) {
      options.value = [];
      patientsSeleted.value = null;
    }

    // si el paciente ya existe en el chat abrir solo la pantalla de chat para escribir
    // si no existe primero crearlo y uego abrir esa chat para escribir con el
  }
});

watch(
  () => auth.typeChat,
  async () => {
    console.log('Dios es amor', auth.typeChat);
    options.value = []
    patientsSeleted.value = null
  }
);
</script>